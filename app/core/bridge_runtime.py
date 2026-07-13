import os
import shutil
import tarfile
from collections.abc import Callable
from pathlib import Path

from core.constants import (
    BIN_DIR,
    BRIDGE_API_URL,
    BRIDGE_ASSET_SUFFIX,
    BRIDGE_VERSION_FILE,
    RADMIN_ARTIFACTS,
    RADMIN_BIN_DIR,
    WINE_API_URL,
    WINE_ASSET_SUFFIX,
    WINE_BIN,
    WINE_DIR,
    WINE_VERSION_FILE,
)
from core.depot import RateLimited, fetch_to, github_asset
from core.reporter import NullReporter, Reporter


def _single_root(tmp_dir: Path) -> Path:
    entries = list(tmp_dir.iterdir())
    if len(entries) == 1 and entries[0].is_dir():
        return entries[0]
    return tmp_dir


def ensure_bridge(reporter: Reporter | None = None, force: bool = False) -> Path | None:
    if all((RADMIN_BIN_DIR / name).exists() for name in RADMIN_ARTIFACTS) and not force:
        return RADMIN_BIN_DIR

    with (reporter or NullReporter()) as sp:
        sp.update("Fetching Bridge")
        BIN_DIR.mkdir(parents=True, exist_ok=True)
        archive = BIN_DIR / "_bridge.tar.xz"
        tmp_dir = BIN_DIR / ".bridge.tmp"
        try:
            tag, asset_url = github_asset(BRIDGE_API_URL, BRIDGE_ASSET_SUFFIX)
            shutil.rmtree(tmp_dir, ignore_errors=True)
            tmp_dir.mkdir(parents=True)
            fetch_to(asset_url, archive, on_progress=sp.progress)
            with tarfile.open(archive) as t:
                t.extractall(tmp_dir, filter="data")
            staged = _single_root(tmp_dir)
            if not all((staged / name).exists() for name in RADMIN_ARTIFACTS):
                sp.fail("Bridge archive is incomplete")
                return None
            for name in RADMIN_ARTIFACTS:
                binary = staged / name
                binary.chmod(binary.stat().st_mode | 0o111)
            if RADMIN_BIN_DIR.exists():
                shutil.rmtree(RADMIN_BIN_DIR)
            os.replace(staged, RADMIN_BIN_DIR)
            (RADMIN_BIN_DIR / BRIDGE_VERSION_FILE).write_text(tag)
        except RateLimited:
            sp.fail("Bridge download failed")
            raise
        except Exception as e:
            sp.fail(f"Bridge download failed — {e}")
            return None
        finally:
            archive.unlink(missing_ok=True)
            shutil.rmtree(tmp_dir, ignore_errors=True)
        sp.succeed("Bridge ready")
        return RADMIN_BIN_DIR


def ensure_wine(update: Callable[[str], None], force: bool = False,
                on_progress: Callable[[float], None] | None = None) -> Path | None:
    if WINE_BIN.exists() and not force:
        return WINE_DIR

    update("Fetching Wine")
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    archive = BIN_DIR / "_wine.tar.xz"
    tmp_dir = BIN_DIR / ".wine.tmp"
    try:
        tag, asset_url = github_asset(WINE_API_URL, WINE_ASSET_SUFFIX)
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir.mkdir(parents=True)
        fetch_to(asset_url, archive, on_progress=on_progress)
        with tarfile.open(archive) as t:
            t.extractall(tmp_dir, filter="data")
        staged = _single_root(tmp_dir)
        if not (staged / "bin" / "wine").exists():
            return None
        if WINE_DIR.exists():
            shutil.rmtree(WINE_DIR)
        os.replace(staged, WINE_DIR)
        (WINE_DIR / WINE_VERSION_FILE).write_text(tag)
        return WINE_DIR
    except RateLimited:
        raise
    except Exception:
        return None
    finally:
        archive.unlink(missing_ok=True)
        shutil.rmtree(tmp_dir, ignore_errors=True)
