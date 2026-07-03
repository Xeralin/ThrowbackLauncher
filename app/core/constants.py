import os
import platform
import re
import sys
import tomllib
from pathlib import Path

VERSION = "0.2.23"

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
FROZEN = bool(getattr(sys, "frozen", False)) or "__compiled__" in globals()
IS_WINDOWS = sys.platform.startswith("win")


def _asset_root() -> Path:
    if FROZEN:
        return Path(sys.executable).parent
    return PROJECT_ROOT


def user_data_base() -> Path:
    if IS_WINDOWS:
        return Path(os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local"))
    return Path(os.environ.get("XDG_DATA_HOME") or str(Path.home() / ".local" / "share"))


def _data_root() -> Path:
    if not FROZEN:
        return PROJECT_ROOT
    return user_data_base() / ("ThrowbackLauncher" if IS_WINDOWS else "throwback-launcher")


ASSET_ROOT = _asset_root()
DATA_ROOT = _data_root()

MEDIA_DIR = ASSET_ROOT / "media"
MANIFEST_FILE = ASSET_ROOT / "manifest.toml"
WEB_OUT_DIR = ASSET_ROOT / "web" / "out"
SPLASH_MASTER_DIR = ASSET_ROOT / "web" / "assets" / "splash"

CONFIG_FILE = DATA_ROOT / "config.toml"
BIN_DIR = DATA_ROOT / "bin"
API_CACHE_FILE = BIN_DIR / "api-cache.json"


DEFAULT_DOWNLOADS_DIR = (DATA_ROOT / "downloads").resolve()


def _config_libraries() -> list[str]:
    try:
        with open(CONFIG_FILE, "rb") as f:
            settings = tomllib.load(f).get("settings", {})
    except (OSError, tomllib.TOMLDecodeError):
        return []
    values = settings.get("libraries")
    if isinstance(values, list):
        return [v for v in values if isinstance(v, str)]
    legacy = settings.get("downloads_dir", "")
    return [legacy] if isinstance(legacy, str) and legacy else []


def _resolve_libraries(values: list[str]) -> list[Path]:
    roots: list[Path] = []
    for value in values:
        if not value:
            continue
        path = Path(value).resolve()
        if path not in roots:
            roots.append(path)
    return roots or [DEFAULT_DOWNLOADS_DIR]


_libraries_current = _resolve_libraries(_config_libraries())


def libraries() -> list[Path]:
    return _libraries_current


def default_library() -> Path:
    return _libraries_current[0]


def set_libraries(values: list[str]) -> None:
    global _libraries_current
    _libraries_current = _resolve_libraries(values)


def _os_arch() -> tuple[str, str]:
    machine = platform.machine().lower()
    arch = "arm64" if machine in ("arm64", "aarch64") else "x64"
    return ("windows", arch) if IS_WINDOWS else ("linux", arch)


_OS, _ARCH = _os_arch()

TL_DIR = BIN_DIR / "ThrowbackLoader"
DD_MEMBER = "DepotDownloader.exe" if _OS == "windows" else "DepotDownloader"
_DD_ASSET = f"DepotDownloader-{_OS}-{_ARCH}.zip"
DD_BIN = BIN_DIR / DD_MEMBER
DD_ZIP = BIN_DIR / _DD_ASSET
DD_URL = f"https://github.com/SteamRE/DepotDownloader/releases/latest/download/{_DD_ASSET}"
DD_API_URL = "https://api.github.com/repos/SteamRE/DepotDownloader/releases/latest"

LIBERATOR_PATH = ASSET_ROOT / "bin" / "Liberator.exe"

TL_API_URL = "https://api.github.com/repos/Xeralin/ThrowbackLoader/releases/latest"
TL_DLLS_COMMON = ("defaultargs.dll", "steam_api64.dll")
UPC_LOADERS = ("upc_r1_loader64.dll", "upc_r2_loader64.dll")
TL_TOML = "Config.toml"
LAUNCHER_EXE = "LaunchR6S.exe"
TL_VERSION_FILE = ".version"
TL_EXTRACT = (*TL_DLLS_COMMON, "uplay_r1_loader64.dll", *UPC_LOADERS, TL_TOML, LAUNCHER_EXE)

HM_KEY = "heatedmetal"
HM_FOLDER_SUFFIX = "_HeatedMetal"

HM_BIN_DIR = BIN_DIR / "HeatedMetal"
HELIOS_DIR = ASSET_ROOT / "bin" / "helios"
HM_MOD_DIR = HM_BIN_DIR / "mod"
if _OS == "windows":
    SEVENZ_ASSET = "7zr.exe"
    SEVENZ_BIN = BIN_DIR / "7zr.exe"
else:
    SEVENZ_ASSET = f"{_OS}-{_ARCH}.tar.xz"
    SEVENZ_BIN = BIN_DIR / "7zz"

UPDATE_API_URL = "https://api.github.com/repos/Xeralin/ThrowbackLauncher/releases/latest"
SEVENZ_API_URL = "https://api.github.com/repos/ip7z/7zip/releases/latest"
HM_API_URL = "https://api.github.com/repos/DataCluster0/HeatedMetal/releases/latest"
HM_RELEASE_URL_FMT = "https://github.com/DataCluster0/HeatedMetal/releases/download/{tag}/HeatedMetal.7z"

HELIOS_JSON = "HeliosLoader.json"
HELIOS_FILES = (
    HELIOS_JSON,
    "steam_api64.dll",
    "upc_r2_loader64.dll",
    "uplay_r1_loader64.dll",
    "uplay_r2_loader64.dll",
)

def _steam_dir() -> Path:
    if IS_WINDOWS:
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                value, _ = winreg.QueryValueEx(key, "SteamPath")
            if value:
                return Path(value)
        except (OSError, ImportError):
            pass
        program_files = os.environ.get("PROGRAMFILES(X86)", r"C:\Program Files (x86)")
        return Path(program_files) / "Steam"
    return Path.home() / ".local" / "share" / "Steam"


STEAM_DIR = _steam_dir()
STEAM_USERDATA = STEAM_DIR / "userdata"
STEAM_COMPATDATA = STEAM_DIR / "steamapps" / "compatdata"
STEAM_COMMON = STEAM_DIR / "steamapps" / "common"
STEAM_COMPAT_TOOLS_D = STEAM_DIR / "compatibilitytools.d"
STEAM_CONFIG_VDF = STEAM_DIR / "config" / "config.vdf"
SHORTCUTS_VDF = "config/shortcuts.vdf"

PROTON_BUILTIN = (
    ("Proton - Experimental", "proton_experimental", "Proton Experimental"),
    ("Proton Hotfix", "proton_hotfix", "Proton Hotfix"),
)

VBOX_IFACE = "vboxnet0"
VBOX_CMD = "VBoxManage"

DEFAULT_USERNAME = "ThrowbackUser"
DEFAULT_MAX_DOWNLOADS = 25
DOWNLOADS_MIN = 1
DOWNLOADS_MAX = 100

NAME_PATTERN = re.compile(r"^[A-Za-z0-9_.-]+$")
MAX_USERNAME_LENGTH = 16

TEXTURE_QUALITIES = ("Low", "Medium", "High", "Very High", "Ultra")
TEXTURE_RX = re.compile(r"textures(\d)")
