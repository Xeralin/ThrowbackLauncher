import json
import re
import sys
import tomllib
from pathlib import Path

from core.constants import (
    DOWNLOADS_DIR,
    HELIOS_JSON,
    HM_FOLDER_SUFFIX,
    HM_KEY,
    LAUNCHER_EXE,
    MANIFEST_FILE,
    SPLASH_MASTER_DIR,
    TL_TOML,
)

_INSTALL_PATTERN = re.compile(r"^Y\d+S\d+_")


def load_downloads() -> list[dict]:
    try:
        with open(MANIFEST_FILE, "rb") as f:
            data = tomllib.load(f)
    except FileNotFoundError:
        sys.exit(f"manifest.toml not found at {MANIFEST_FILE}")
    except tomllib.TOMLDecodeError as e:
        sys.exit(f"manifest.toml is malformed: {e}")

    defaults = {
        "app": data.get("app"),
        "depot_main": data.get("depot_main"),
        "depot_lang": data.get("depot_lang"),
        "depot_other": data.get("depot_other"),
        "loader": data.get("default_loader"),
    }
    return [
        {"key": key, **defaults, **block}
        for key, block in data.items()
        if isinstance(block, dict)
    ]


def local_downloads() -> list[Path]:
    if not DOWNLOADS_DIR.exists():
        return []
    return [
        d for d in sorted(DOWNLOADS_DIR.glob("*"))
        if d.is_dir() and _INSTALL_PATTERN.match(d.name)
    ]


def resolve_install(folder_name: str, downloads: list[dict]) -> tuple[dict, bool] | None:
    if folder_name.endswith(HM_FOLDER_SUFFIX):
        prefix = folder_name.removesuffix(HM_FOLDER_SUFFIX) + "_"
        for d in downloads:
            if d["key"].startswith(prefix) and HM_KEY in d:
                return d, True
        return None
    for d in downloads:
        if d["key"] == folder_name:
            return d, False
    return None


def hm_display_name(download: dict) -> str:
    return f"{download['label'].split(' ', 1)[0]} Heated Metal"


def launcher_name(is_hm: bool) -> str:
    return "RainbowSix.exe" if is_hm else LAUNCHER_EXE


def splash_path(key: str) -> Path | None:
    for ext in (".jpg", ".jpeg", ".png", ".webp"):
        candidate = SPLASH_MASTER_DIR / f"{key}{ext}"
        if candidate.exists():
            return candidate
    return None


def _is_installed(d: Path) -> bool:
    is_hm = d.name.endswith(HM_FOLDER_SUFFIX)
    if not (d / launcher_name(is_hm)).exists():
        return False
    return not is_hm or (d / HELIOS_JSON).exists()


def installed_downloads() -> list[Path]:
    return [d for d in local_downloads() if _is_installed(d)]


def installed_variant(key: str) -> tuple[Path, bool] | None:
    for is_hm in (False, True):
        folder = key.split("_", 1)[0] + HM_FOLDER_SUFFIX if is_hm else key
        path = DOWNLOADS_DIR / folder
        if _is_installed(path):
            return path, is_hm
    return None


def has_partial(key: str) -> bool:
    if installed_variant(key) is not None:
        return False
    base = key.split("_", 1)[0]
    for folder in (key, base + HM_FOLDER_SUFFIX):
        if (DOWNLOADS_DIR / folder).is_dir():
            return True
    return False


def installed_username(d: Path) -> str:
    toml_path = d / TL_TOML
    if toml_path.exists():
        m = re.search(r"""username\s*=\s*["']([^"']*)["']""", toml_path.read_text())
        if m:
            return m.group(1)
    json_path = d / HELIOS_JSON
    if json_path.exists():
        try:
            return json.loads(json_path.read_text()).get("Username", "")
        except (json.JSONDecodeError, OSError):
            pass
    return ""
