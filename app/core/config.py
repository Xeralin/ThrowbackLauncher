import os
import tomllib
from typing import TypeVar

from core.constants import CONFIG_FILE
from core.style import step_warn

T = TypeVar("T")


def load_config() -> dict:
    if not CONFIG_FILE.exists():
        return {}
    try:
        with open(CONFIG_FILE, "rb") as f:
            return tomllib.load(f)
    except tomllib.TOMLDecodeError:
        broken = CONFIG_FILE.with_name(CONFIG_FILE.name + ".broken")
        CONFIG_FILE.replace(broken)
        step_warn(f"config.toml is malformed — saved as {broken.name}, starting with defaults")
        return {}


def save_config(cfg: dict) -> None:
    lines = ["[settings]"]
    s = cfg.get("settings", {})
    for k, v in s.items():
        if isinstance(v, str):
            esc = v.replace("\\", "\\\\").replace('"', '\\"')
            lines.append(f'{k} = "{esc}"')
        elif isinstance(v, bool):
            lines.append(f"{k} = {str(v).lower()}")
        else:
            lines.append(f"{k} = {v}")
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_FILE.with_name(CONFIG_FILE.name + ".tmp")
    tmp.write_text("\n".join(lines) + "\n")
    os.replace(tmp, CONFIG_FILE)


def get_setting(cfg: dict, key: str, default: T) -> T:
    return cfg.get("settings", {}).get(key, default)


def set_setting(cfg: dict, key: str, value: object) -> None:
    cfg.setdefault("settings", {})[key] = value
