import os
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from tempfile import TemporaryDirectory

from core.constants import (
    IS_WINDOWS,
    DD_API_URL,
    DD_BIN,
    FROZEN,
    SEVENZ_API_URL,
    SEVENZ_BIN,
    TL_API_URL,
    TL_DIR,
    TL_EXTRACT,
    TL_VERSION_FILE,
    UPDATE_API_URL,
    VERSION,
)
from core.depot import (
    RateLimited,
    ensure_depotdownloader,
    fetch_to,
    github_asset,
    github_body,
    github_tag,
    invalidate_api_cache,
)
from core.heatedmetal import ensure_7zz
from core.winspawn import spawn_detached_bat
from core.spinner import LazySpinner, Reporter
from core.throwbackloader import ensure_tl


def _version_tuple(v: str) -> tuple[int, ...]:
    return tuple(int(p) for p in v.split("."))


def _newer(latest: str, current: str) -> bool:
    try:
        return _version_tuple(latest) > _version_tuple(current)
    except ValueError:
        return latest != current


def _binary_version(binary: Path, args: list[str], pattern: str) -> str | None:
    try:
        out = subprocess.run(
            [str(binary), *args],
            capture_output=True, text=True, timeout=30, check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0,
        ).stdout
    except Exception:
        return None
    match = re.search(pattern, out)
    return match.group(1) if match else None


_throwback_release: dict | None = None


def _throwback_asset() -> str:
    return "App.zip" if IS_WINDOWS else "ThrowbackLauncher.AppImage"


def _throwback_fetch() -> dict:
    global _throwback_release
    if _throwback_release is None:
        tag, url = github_asset(UPDATE_API_URL, _throwback_asset())
        _throwback_release = {"tag": tag, "url": url}
    return _throwback_release


def _throwback_latest() -> str | None:
    try:
        return _throwback_fetch()["tag"].removeprefix("v") or None
    except LookupError:
        return None


def _throwback_present() -> bool:
    return FROZEN and (IS_WINDOWS or bool(os.environ.get("APPIMAGE")))


def _release_notes(api_url: str) -> Callable[[], list[str]]:
    def notes() -> list[str]:
        collected = []
        for line in github_body(api_url).splitlines():
            stripped = line.strip()
            if stripped.startswith("- "):
                collected.append(stripped[2:].strip())
        return collected[:10]

    return notes


_UPDATE_SCRIPT = r"""@echo off
set tries=0
:wait
set /a tries+=1
if %tries% gtr 30 goto kill
tasklist /fi "imagename eq throwback-launcher.exe" | find /i "throwback-launcher.exe" >nul
if not errorlevel 1 (
  ping 127.0.0.1 -n 2 >nul
  goto wait
)
goto swap
:kill
taskkill /f /im throwback-launcher.exe >nul 2>&1
ping 127.0.0.1 -n 2 >nul
:swap
set wipe=0
:wipeloop
set /a wipe+=1
set locked=0
for /f "delims=" %%i in ('dir /b "%TB_STAGING%"') do (
  if /i not "%%i"=="bin" (
    rd /s /q "%TB_INSTALL%\%%i" 2>nul
    del /f /q "%TB_INSTALL%\%%i" 2>nul
    if exist "%TB_INSTALL%\%%i" set locked=1
  )
)
if %locked%==1 if %wipe% lss 5 (
  ping 127.0.0.1 -n 2 >nul
  goto wipeloop
)
for /f "delims=" %%i in ('dir /b "%TB_STAGING%"') do (
  if /i not "%%i"=="bin" (
    if not exist "%TB_INSTALL%\%%i" move /y "%TB_STAGING%\%%i" "%TB_INSTALL%\%%i" >nul
  )
)
robocopy "%TB_STAGING%\bin" "%TB_INSTALL%\bin" /e /move >nul 2>&1
dir /b "%TB_STAGING%" 2>nul | findstr . >nul || rd /s /q "%TB_STAGING%" >nul 2>&1
start "" "%TB_EXE%"
del "%~f0"
"""


def _spawn_update_script(install_dir: Path, staging: Path) -> None:
    bat = Path(tempfile.gettempdir()) / "ThrowbackLauncher-update.bat"
    bat.write_text(_UPDATE_SCRIPT.replace("\n", "\r\n"), encoding="ascii")
    env = {
        **os.environ,
        "TB_INSTALL": str(install_dir),
        "TB_STAGING": str(staging),
        "TB_EXE": str(install_dir / "throwback-launcher.exe"),
    }
    spawn_detached_bat(str(bat), env)


def _throwback_apply_windows(sp: Reporter, url: str) -> bool:
    install_dir = Path(sys.executable).resolve().parent
    staging = install_dir.parent / (install_dir.name + ".new")
    try:
        with TemporaryDirectory() as tmp:
            archive = Path(tmp) / "App.zip"
            sp.update("Downloading update")
            fetch_to(url, archive)
            sp.update("Preparing update")
            shutil.rmtree(staging, ignore_errors=True)
            staging.mkdir(parents=True)
            with zipfile.ZipFile(archive) as z:
                z.extractall(staging)
        _spawn_update_script(install_dir, staging)
    except BaseException:
        shutil.rmtree(staging, ignore_errors=True)
        raise
    return True


def _throwback_apply_appimage(sp: Reporter, url: str) -> bool:
    appimage = os.environ.get("APPIMAGE", "")
    if not appimage:
        sp.fail("Update failed — not running from an AppImage")
        return False
    target = Path(appimage)
    sp.update("Downloading update")
    replacement = target.with_name(target.name + ".new")
    fetch_to(url, replacement)
    replacement.chmod(0o755)
    replacement.replace(target)
    return True


def _throwback_apply(reporter: Reporter | None = None) -> bool:
    release = _throwback_fetch()
    with (reporter or LazySpinner()) as sp:
        try:
            if IS_WINDOWS:
                ok = _throwback_apply_windows(sp, release["url"])
            else:
                ok = _throwback_apply_appimage(sp, release["url"])
        except Exception as e:
            sp.fail(f"Update failed — {e}")
            return False
        if not ok:
            return False
        sp.succeed(f"Updated to {release['tag'].removeprefix('v')} — restarting")
    return True


def _dd_latest() -> str | None:
    return github_tag(DD_API_URL).removeprefix("DepotDownloader_") or None


def _sevenz_apply(reporter: Reporter | None = None) -> bool:
    with (reporter or LazySpinner()) as sp:
        sp.update("Updating 7zz")
        if ensure_7zz(sp.update, force=True) is None:
            sp.fail("7zz update failed")
            return False
        sp.succeed("7zz updated")
    return True


def _tl_current() -> str | None:
    f = TL_DIR / TL_VERSION_FILE
    return f.read_text().strip() if f.exists() else None


class Component:
    def __init__(
        self,
        name: str,
        present: Callable[[], bool],
        current: Callable[[], str | None],
        latest: Callable[[], str | None],
        apply: Callable[..., bool],
        restart: bool = False,
        notes: Callable[[], list[str]] | None = None,
    ) -> None:
        self.name = name
        self.present = present
        self.current = current
        self.latest = latest
        self.apply = apply
        self.restart = restart
        self.notes = notes
        self.target: str | None = None
        self.current_value: str | None = None
        self.notes_value: list[str] = []

    def pending(self, latest: str) -> str | None:
        if not self.present():
            return None
        current = self.current()
        self.current_value = current
        if current is None or _newer(latest, current):
            self.target = latest
            return latest
        return None


COMPONENTS = [
    Component("Throwback Launcher", _throwback_present,
              lambda: VERSION, _throwback_latest, _throwback_apply, restart=True,
              notes=_release_notes(UPDATE_API_URL)),
    Component("DepotDownloader", DD_BIN.exists, lambda: _binary_version(DD_BIN, ["--version"], r"v(\d+(?:\.\d+)+)"),
              _dd_latest, lambda reporter=None: ensure_depotdownloader(reporter, force=True) is not None,
              notes=_release_notes(DD_API_URL)),
    Component("7zz", SEVENZ_BIN.exists,
              lambda: _binary_version(SEVENZ_BIN, [], r"7-Zip(?:\s+\([arz]\))?\s+(\d+(?:\.\d+)+)"),
              lambda: github_tag(SEVENZ_API_URL), _sevenz_apply),
    Component("ThrowbackLoader", lambda: all((TL_DIR / f).exists() for f in TL_EXTRACT),
              _tl_current, lambda: github_tag(TL_API_URL),
              lambda reporter=None: ensure_tl(reporter, force=True),
              notes=_release_notes(TL_API_URL)),
]


def available(force: bool = False) -> tuple[list[Component], str]:
    global _throwback_release
    _throwback_release = None
    if force:
        invalidate_api_cache()
    present = [c for c in COMPONENTS if c.present()]
    if not present:
        return [], ""

    def probe(component: Component) -> tuple[str | None, str]:
        try:
            return component.latest(), ""
        except RateLimited:
            return None, "rate_limit"
        except Exception:
            return None, "error"

    with ThreadPoolExecutor(max_workers=len(present)) as ex:
        results = list(ex.map(probe, present))
    failures = {status for _, status in results if status}
    status = "rate_limit" if "rate_limit" in failures else ("error" if failures else "")
    pending = [
        c
        for c, (latest, _) in zip(present, results, strict=True)
        if latest is not None and c.pending(latest)
    ]
    for component in pending:
        if component.notes is not None:
            try:
                component.notes_value = component.notes()
            except Exception:
                component.notes_value = []
    return pending, status
