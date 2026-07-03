import contextlib
import re
import shutil
import zipfile
from pathlib import Path

from core.constants import (
    LAUNCHER_EXE,
    LEGACY_LAUNCHER_EXE,
    TL_API_URL,
    TL_DIR,
    TL_DLLS_COMMON,
    TL_EXTRACT,
    TL_TOML,
    TL_VERSION_FILE,
)
from core.depot import RateLimited, fetch_to, github_asset
from core.manifest import local_downloads
from core.spinner import LazySpinner, Reporter
from core.steam import is_steam_running, migrate_shortcut_exe


def ensure_tl(reporter: Reporter | None = None, force: bool = False) -> bool:
    if all((TL_DIR / f).exists() for f in TL_EXTRACT) and not force:
        return True

    with (reporter or LazySpinner()) as sp:
        sp.update("Fetching ThrowbackLoader")
        TL_DIR.mkdir(parents=True, exist_ok=True)
        zip_path = TL_DIR / "_throwbackloader.zip"
        try:
            tag, asset_url = github_asset(TL_API_URL, ".zip")
            fetch_to(asset_url, zip_path, on_progress=sp.progress)
            with zipfile.ZipFile(zip_path) as z:
                for name in TL_EXTRACT:
                    z.extract(name, TL_DIR)
        except RateLimited:
            sp.fail("ThrowbackLoader download failed")
            zip_path.unlink(missing_ok=True)
            raise
        except Exception as e:
            sp.fail(f"ThrowbackLoader download failed — {e}")
            zip_path.unlink(missing_ok=True)
            return False

        zip_path.unlink(missing_ok=True)
        if all((TL_DIR / f).exists() for f in TL_EXTRACT):
            (TL_DIR / TL_VERSION_FILE).write_text(tag)
            sp.succeed("ThrowbackLoader ready")
            return True
        sp.fail("ThrowbackLoader extraction failed")
        return False


def write_tl_toml(target_dir: Path, username: str) -> None:
    src = TL_DIR / TL_TOML
    if not src.exists():
        src = target_dir / TL_TOML
    text = src.read_text()
    text = re.sub(
        r"""username\s*=\s*["'][^"']*["']""",
        f"username = '{username}'",
        text,
        count=1,
    )
    (target_dir / TL_TOML).write_text(text)


def apply_tl(target_dir: Path, username: str, loader: str) -> None:
    for name in (*TL_DLLS_COMMON, f"{loader}_loader64.dll"):
        shutil.copy2(TL_DIR / name, target_dir / name)
    write_tl_toml(target_dir, username)


def write_launcher(target_dir: Path, reporter: Reporter | None = None) -> None:
    src = TL_DIR / LAUNCHER_EXE
    if not src.exists() and not ensure_tl(reporter):
        raise OSError("ThrowbackLoader download failed")
    shutil.copy2(src, target_dir / LAUNCHER_EXE)
    legacy = target_dir / LEGACY_LAUNCHER_EXE
    if legacy.exists() and not is_steam_running():
        migrate_shortcut_exe(legacy, target_dir / LAUNCHER_EXE)
        legacy.unlink()


def migrate_legacy_installs() -> None:
    legacy_cache = TL_DIR / LEGACY_LAUNCHER_EXE
    with contextlib.suppress(OSError):
        if legacy_cache.exists():
            if (TL_DIR / LAUNCHER_EXE).exists():
                legacy_cache.unlink()
            else:
                legacy_cache.rename(TL_DIR / LAUNCHER_EXE)
    steam_up = is_steam_running()
    for folder in local_downloads():
        legacy = folder / LEGACY_LAUNCHER_EXE
        if not legacy.exists():
            continue
        with contextlib.suppress(OSError):
            new = folder / LAUNCHER_EXE
            if not new.exists():
                shutil.copy2(legacy, new)
            if not steam_up:
                migrate_shortcut_exe(legacy, new)
                legacy.unlink()
