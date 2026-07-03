import tomllib
from typing import TypeVar

from core.constants import CONFIG_FILE

T = TypeVar("T")

warning: str | None = None


def load_config() -> dict:
    global warning
    if not CONFIG_FILE.exists():
        return {}
    try:
        with open(CONFIG_FILE, "rb") as f:
            return tomllib.load(f)
    except tomllib.TOMLDecodeError:
        broken = CONFIG_FILE.with_name(CONFIG_FILE.name + ".broken")
        CONFIG_FILE.replace(broken)
        warning = f"Settings were malformed and reset — backup saved as {broken.name}"
        return {}


def _fmt_value(value: object) -> str:
    if isinstance(value, str):
        if "'" in value:
            esc = value.replace("\\", "\\\\").replace('"', '\\"')
            return f'"{esc}"'
        return f"'{value}'"
    if isinstance(value, bool):
        return str(value).lower()
    return str(value)


def save_config(cfg: dict) -> None:
    lines = ["[settings]"]
    s = cfg.get("settings", {})
    for k, v in s.items():
        if isinstance(v, list):
            lines.append(f"{k} = [{', '.join(_fmt_value(i) for i in v)}]")
        elif isinstance(v, dict):
            items = ", ".join(
                f"{_fmt_value(str(key))} = {_fmt_value(val)}" for key, val in v.items()
            )
            lines.append(f"{k} = {{ {items} }}")
        else:
            lines.append(f"{k} = {_fmt_value(v)}")
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = CONFIG_FILE.with_name(CONFIG_FILE.name + ".tmp")
    tmp.write_text("\n".join(lines) + "\n")
    tmp.replace(CONFIG_FILE)


def get_setting(cfg: dict, key: str, default: T) -> T:
    return cfg.get("settings", {}).get(key, default)


def set_setting(cfg: dict, key: str, value: object) -> None:
    cfg.setdefault("settings", {})[key] = value
