import json
import shutil
from pathlib import Path

from PySide6.QtCore import Property, QObject, Signal, Slot

from core.config import get_setting, save_config, set_setting
from core.constants import (
    DD_BIN,
    DEFAULT_MAX_DOWNLOADS,
    DEFAULT_USERNAME,
    DOWNLOADS_MAX,
    DOWNLOADS_MIN,
    HELIOS_JSON,
    HM_BIN_DIR,
    MAX_USERNAME_LENGTH,
    NAME_PATTERN,
    SEVENZ_BIN,
    TL_DIR,
    TL_EXTRACT,
    TL_TOML,
)
from core.manifest import installed_downloads
from core.rpc import is_discord_installed, start_presence, stop_presence
from core.throwbackloader import write_tl_toml


def _depot_token_stores(iso_dir: Path) -> list[Path]:
    return sorted({p.parent.parent for p in iso_dir.rglob("AssemFiles/account.config")})


def wipe_depot_token() -> tuple[bool, list[str]]:
    iso_dir = Path.home() / ".local" / "share" / "IsolatedStorage"
    stores = _depot_token_stores(iso_dir) if iso_dir.exists() else []
    if not stores:
        return False, []
    errors = []
    for store in stores:
        try:
            shutil.rmtree(store)
        except OSError as e:
            errors.append(f"Could not remove {store} — {e}")
    return True, errors


def write_download_username(d: Path, username: str) -> bool:
    if (d / TL_TOML).exists():
        write_tl_toml(d, username)
        return True
    json_path = d / HELIOS_JSON
    if json_path.exists():
        try:
            config = json.loads(json_path.read_text())
        except (json.JSONDecodeError, OSError):
            return False
        config["Username"] = username
        json_path.write_text(json.dumps(config, indent=2))
        return True
    return False


def clear_download_cache() -> None:
    DD_BIN.unlink(missing_ok=True)
    SEVENZ_BIN.unlink(missing_ok=True)
    for name in TL_EXTRACT:
        (TL_DIR / name).unlink(missing_ok=True)
    shutil.rmtree(HM_BIN_DIR, ignore_errors=True)

_RPC_FIELDS = (
    "discord_client_id",
    "discord_details",
    "discord_state",
    "discord_large_image",
    "discord_large_text",
    "discord_small_image",
    "discord_small_text",
    "discord_button1_label",
    "discord_button1_url",
    "discord_button2_label",
    "discord_button2_url",
)

_RPC_DEFAULTS = {
    "discord_details": "{season_name}",
    "discord_large_text": "{season_name}",
}

_RPC_MAX = {
    "discord_client_id": 20,
    "discord_details": 128,
    "discord_state": 128,
    "discord_large_image": 256,
    "discord_large_text": 128,
    "discord_small_image": 256,
    "discord_small_text": 128,
    "discord_button1_label": 32,
    "discord_button1_url": 512,
    "discord_button2_label": 32,
    "discord_button2_url": 512,
}


class Settings(QObject):
    username_changed = Signal()
    steam_account_changed = Signal()
    max_downloads_changed = Signal()
    discord_rpc_changed = Signal()
    rpc_config_changed = Signal()
    invalid_setting = Signal(str, str)
    logged_out = Signal(bool, str)
    cache_cleared = Signal()

    def __init__(self, cfg: dict) -> None:
        super().__init__()
        self._cfg = cfg

    @Property(str, notify=username_changed)
    def username(self) -> str:
        return get_setting(self._cfg, "username", DEFAULT_USERNAME)

    @Property(str, notify=steam_account_changed)
    def steam_account(self) -> str:
        return get_setting(self._cfg, "steam_account", "")

    @Property(int, notify=max_downloads_changed)
    def max_downloads(self) -> int:
        return get_setting(self._cfg, "max_downloads", DEFAULT_MAX_DOWNLOADS)

    @Property(bool, notify=discord_rpc_changed)
    def discord_rpc(self) -> bool:
        return get_setting(self._cfg, "discord_rpc", False)

    @Property("QVariantMap", constant=True)
    def download_bounds(self) -> dict:
        return {"min": DOWNLOADS_MIN, "max": DOWNLOADS_MAX}

    def _store(self, key: str, value: object) -> None:
        set_setting(self._cfg, key, value)
        save_config(self._cfg)

    @Slot(str)
    def set_username(self, value: str) -> None:
        value = value.strip()
        if not NAME_PATTERN.match(value) or len(value) > MAX_USERNAME_LENGTH:
            self.invalid_setting.emit(
                "username",
                f"Username must be 1–{MAX_USERNAME_LENGTH} characters: letters, digits, . _ -",
            )
            return
        if value == self.username:
            return
        self._store("username", value)
        for d in installed_downloads():
            try:
                write_download_username(d, value)
            except OSError:
                pass
        self.username_changed.emit()

    @Slot(str)
    def set_steam_account(self, value: str) -> None:
        value = value.strip()
        if value == self.steam_account:
            return
        self._store("steam_account", value)
        self.steam_account_changed.emit()

    @Slot(int)
    def set_max_downloads(self, value: int) -> None:
        if not DOWNLOADS_MIN <= value <= DOWNLOADS_MAX:
            self.invalid_setting.emit("max_downloads", f"Download speed must be {DOWNLOADS_MIN}–{DOWNLOADS_MAX}")
            return
        if value == self.max_downloads:
            return
        self._store("max_downloads", value)
        self.max_downloads_changed.emit()

    @Slot(bool)
    def set_discord_rpc(self, value: bool) -> None:
        if value == self.discord_rpc:
            return
        if value and not is_discord_installed():
            self.invalid_setting.emit("discord_rpc", "Discord is not installed")
            return
        self._store("discord_rpc", value)
        self.discord_rpc_changed.emit()
        if value:
            start_presence()
        else:
            stop_presence()

    @Property("QVariantMap", notify=rpc_config_changed)
    def rpc_config(self) -> dict:
        return {
            key: get_setting(self._cfg, key, _RPC_DEFAULTS.get(key, ""))
            for key in _RPC_FIELDS
        }

    @Slot(str, str)
    def set_rpc_field(self, key: str, value: str) -> None:
        if key not in _RPC_FIELDS:
            return
        value = value.strip()
        if len(value) > _RPC_MAX[key]:
            self.invalid_setting.emit(key, f"Too long (max {_RPC_MAX[key]} characters)")
            return
        if key == "discord_client_id" and value and not (value.isdigit() and 17 <= len(value) <= 20):
            self.invalid_setting.emit(key, "Application ID must be a 17–20 digit number")
            return
        if key.endswith("_url") and value and not value.startswith(("http://", "https://")):
            self.invalid_setting.emit(key, "URL must start with http:// or https://")
            return
        if get_setting(self._cfg, key, "") == value:
            return
        self._store(key, value)
        self.rpc_config_changed.emit()

    @Slot()
    def logout(self) -> None:
        self._store("steam_account", "")
        self.steam_account_changed.emit()
        found, errors = wipe_depot_token()
        if errors:
            self.logged_out.emit(False, errors[0])
        else:
            self.logged_out.emit(True, "Logged out" if found else "No Steam token found")

    @Slot()
    def clear_cache(self) -> None:
        clear_download_cache()
        self.cache_cleared.emit()
