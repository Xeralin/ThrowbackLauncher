import os
import re
import shutil
import subprocess
import sys
import zipfile
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from tempfile import TemporaryDirectory

from core.constants import (
    IS_WINDOWS,
    DD_API_URL,
    DD_BIN,
    DEFAULT_USERNAME,
    FROZEN,
    HM_API_URL,
    HM_KEY,
    SEVENZ_API_URL,
    SEVENZ_BIN,
    TL_API_URL,
    TL_DIR,
    TL_EXTRACT,
    TL_VERSION_FILE,
    UPDATE_API_URL,
    VERSION,
    libraries,
    version_tuple,
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
from core.heatedmetal import (
    apply_hm,
    clear_release_cache,
    ensure_7zz,
    hm_installed_version,
    resolve_hm_release,
)
from core.manifest import (
    hm_folder_name,
    installed_downloads,
    installed_username,
    is_installed,
    load_downloads,
    resolve_install,
)
from core.self_update import READY, helper_argv
from core.steam import is_game_running
from core.winspawn import spawn_detached
from core.reporter import NullReporter, Reporter
from core.throwbackloader import apply_tl, ensure_tl, write_launcher


def _newer(latest: str, current: str) -> bool:
    try:
        return version_tuple(latest) > version_tuple(current)
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


def _throwback_fetch() -> dict:
    global _throwback_release
    if _throwback_release is None:
        asset = "App.zip" if IS_WINDOWS else "Launcher.AppImage"
        tag, url = github_asset(UPDATE_API_URL, asset)
        _throwback_release = {"tag": tag, "url": url}
    return _throwback_release


def _throwback_latest() -> str | None:
    try:
        tag = _throwback_fetch()["tag"].removeprefix("v")
        version_tuple(tag)
    except (LookupError, ValueError):
        return None
    return tag


def _throwback_present() -> bool:
    return FROZEN and (IS_WINDOWS or bool(os.environ.get("APPIMAGE")))


def _release_notes(api_url: str) -> Callable[[], list[dict]]:
    def notes() -> list[dict]:
        collected = []
        has_parent = False
        in_fence = False
        in_comment = False
        for line in github_body(api_url).splitlines():
            expanded = line.expandtabs(4)
            stripped = expanded.strip()
            if in_comment:
                in_comment = "-->" not in stripped
                continue
            if stripped.startswith(("```", "~~~")):
                in_fence = not in_fence
                has_parent = False
                continue
            if in_fence:
                continue
            if stripped.startswith("<!--") and "-->" not in stripped:
                in_comment = True
                continue
            if not stripped:
                continue
            if set(stripped) <= set("-*_ "):
                has_parent = False
                continue
            indent = len(expanded) - len(expanded.lstrip())
            if not stripped.startswith(("- ", "* ", "+ ")):
                if indent < 2:
                    has_parent = False
                continue
            if indent < 2:
                has_parent = True
            collected.append({"text": stripped[2:].strip(), "level": 1 if indent >= 2 and has_parent else 0})
        return collected[:10]

    return notes


def _throwback_apply_windows(sp: Reporter, url: str, tag: str) -> bool:
    install_dir = Path(sys.executable).resolve().parent
    staging = install_dir.parent / (install_dir.name + ".update")
    try:
        with TemporaryDirectory() as tmp:
            archive = Path(tmp) / "App.zip"
            sp.update("Downloading update")
            fetch_to(url, archive, on_progress=sp.progress)
            sp.update("Preparing update")
            shutil.rmtree(staging, ignore_errors=True)
            staging.mkdir(parents=True)
            with zipfile.ZipFile(archive) as z:
                z.extractall(staging)
                names = z.namelist()
            removed = [n for n in names if not (staging / n).exists()]
            if removed:
                raise OSError(f"{len(removed)} update files removed — check antivirus exclusions")
            files = [n for n in names if not n.endswith("/")]
            (staging / READY).write_text("\n".join([tag.removeprefix("v"), *files]), encoding="ascii")
        spawn_detached(helper_argv(staging))
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
    replacement = target.with_name(target.name + ".update")
    fetch_to(url, replacement, on_progress=sp.progress)
    replacement.chmod(0o755)
    replacement.replace(target)
    return True


def _throwback_apply(reporter: Reporter | None = None) -> bool:
    release = _throwback_fetch()
    with (reporter or NullReporter()) as sp:
        try:
            if IS_WINDOWS:
                ok = _throwback_apply_windows(sp, release["url"], release["tag"])
            else:
                ok = _throwback_apply_appimage(sp, release["url"])
        except Exception as e:
            sp.fail(f"Update failed — {e}")
            return False
        if not ok:
            return False
        sp.succeed(f"Updated to {release['tag'].removeprefix('v')} — restarting")
    return True


def _sevenz_apply(reporter: Reporter | None = None) -> bool:
    with (reporter or NullReporter()) as sp:
        sp.update("Updating 7z")
        if ensure_7zz(sp.update, force=True, on_progress=sp.progress) is None:
            sp.fail("7z update failed")
            return False
        sp.succeed("7z updated")
    return True


def _tl_current() -> str | None:
    f = TL_DIR / TL_VERSION_FILE
    return f.read_text().strip() if f.exists() else None


def _tl_apply(reporter: Reporter | None = None) -> bool:
    if is_game_running():
        raise OSError("Close Rainbow Six Siege first")
    if not ensure_tl(reporter, force=True):
        return False
    downloads = load_downloads()
    for folder in installed_downloads():
        resolved = resolve_install(folder.name, downloads)
        if resolved is None or resolved[1]:
            continue
        username = installed_username(folder) or DEFAULT_USERNAME
        apply_tl(folder, username, resolved[0]["loader"])
        write_launcher(folder)
    return True


def _hm_latest_installs() -> list[Path]:
    try:
        downloads = load_downloads()
    except Exception:
        return []
    installs: list[Path] = []
    for download in downloads:
        hm = download.get(HM_KEY)
        if not isinstance(hm, dict) or hm.get("hm_version") != "latest":
            continue
        for root in libraries():
            folder = root / hm_folder_name(download["key"])
            if is_installed(folder):
                installs.append(folder)
    return installs


def _hm_current() -> str | None:
    versions = [hm_installed_version(f) for f in _hm_latest_installs()]
    if not versions or any(v is None for v in versions):
        return None
    try:
        return min(versions, key=version_tuple)
    except ValueError:
        return min(versions)


def _hm_latest() -> str | None:
    resolved = resolve_hm_release("latest")
    return resolved[0] if resolved else None


def _hm_apply(reporter: Reporter | None = None) -> bool:
    installs = _hm_latest_installs()
    if not installs:
        return False
    if is_game_running():
        raise OSError("Close Rainbow Six Siege first")
    ok = True
    for folder in installs:
        username = installed_username(folder) or DEFAULT_USERNAME
        if not apply_hm(folder, username, "latest", reporter=reporter):
            ok = False
    return ok


@dataclass
class Component:
    name: str
    present: Callable[[], bool]
    current: Callable[[], str | None]
    latest: Callable[[], str | None]
    apply: Callable[..., bool]
    restart: bool = False
    notes: Callable[[], list[dict]] | None = None
    target: str | None = None
    notes_value: list[dict] = field(default_factory=list)

    def pending(self, latest: str) -> str | None:
        if not self.present():
            return None
        current = self.current()
        if current is None or _newer(latest, current):
            self.target = latest
            return latest
        return None


COMPONENTS = [
    Component("Throwback Launcher", _throwback_present,
              lambda: VERSION, _throwback_latest, _throwback_apply, restart=True,
              notes=_release_notes(UPDATE_API_URL)),
    Component("DepotDownloader", DD_BIN.exists, lambda: _binary_version(DD_BIN, ["--version"], r"v(\d+(?:\.\d+)+)"),
              lambda: github_tag(DD_API_URL).removeprefix("DepotDownloader_") or None,
              lambda reporter=None: ensure_depotdownloader(reporter, force=True) is not None,
              notes=_release_notes(DD_API_URL)),
    Component("7z", SEVENZ_BIN.exists,
              lambda: _binary_version(SEVENZ_BIN, [], r"7-Zip(?:\s+\([arz]\))?\s+(\d+(?:\.\d+)+)"),
              lambda: github_tag(SEVENZ_API_URL), _sevenz_apply),
    Component("ThrowbackLoader", lambda: all((TL_DIR / f).exists() for f in TL_EXTRACT),
              _tl_current, lambda: github_tag(TL_API_URL), _tl_apply,
              notes=_release_notes(TL_API_URL)),
    Component("Heated Metal", lambda: bool(_hm_latest_installs()),
              _hm_current, _hm_latest, _hm_apply,
              notes=_release_notes(HM_API_URL)),
]


def available(force: bool = False) -> tuple[list[Component], str]:
    global _throwback_release
    _throwback_release = None
    if force:
        invalidate_api_cache()
        clear_release_cache()
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
