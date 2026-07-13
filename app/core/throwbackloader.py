import os
import re
import shutil
import zipfile
from pathlib import Path

from core.constants import (
    LAUNCHER_EXE,
    TL_API_URL,
    TL_DIR,
    TL_DLLS_COMMON,
    TL_EXTRACT,
    TL_TOML,
    TL_VERSION_FILE,
)
from core.depot import RateLimited, fetch_to, github_asset
from core.reporter import NullReporter, Reporter


def ensure_tl(reporter: Reporter | None = None, force: bool = False) -> bool:
    if all((TL_DIR / f).exists() for f in TL_EXTRACT) and not force:
        return True

    with (reporter or NullReporter()) as sp:
        sp.update("Fetching ThrowbackLoader")
        TL_DIR.mkdir(parents=True, exist_ok=True)
        zip_path = TL_DIR / "tl.zip"
        tmp_dir = TL_DIR / ".tl.tmp"
        try:
            tag, asset_url = github_asset(TL_API_URL, ".zip")
            fetch_to(asset_url, zip_path, on_progress=sp.progress)
            shutil.rmtree(tmp_dir, ignore_errors=True)
            with zipfile.ZipFile(zip_path) as z:
                for name in TL_EXTRACT:
                    z.extract(name, tmp_dir)
            for name in TL_EXTRACT:
                os.replace(tmp_dir / name, TL_DIR / name)
            (TL_DIR / TL_VERSION_FILE).write_text(tag)
        except RateLimited:
            sp.fail("ThrowbackLoader download failed")
            raise
        except Exception as e:
            sp.fail(f"ThrowbackLoader download failed — {e}")
            return False
        finally:
            zip_path.unlink(missing_ok=True)
            shutil.rmtree(tmp_dir, ignore_errors=True)
        sp.succeed("ThrowbackLoader ready")
        return True


def write_tl_toml(target_dir: Path, username: str) -> None:
    src = target_dir / TL_TOML
    if not src.exists():
        src = TL_DIR / TL_TOML
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
