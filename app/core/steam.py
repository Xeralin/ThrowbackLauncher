import contextlib
import json
import os
import re
import shutil
import subprocess
import zlib
from pathlib import Path

import psutil

from core.constants import (
    IS_WINDOWS,
    PROTON_BUILTIN,
    SHORTCUTS_VDF,
    STEAM_COMMON,
    STEAM_COMPATDATA,
    STEAM_COMPAT_TOOLS_D,
    STEAM_CONFIG_VDF,
    STEAM_DIR,
    STEAM_USERDATA,
)
from PySide6.QtGui import QImage

from core.manifest import installed_variant, launcher_name


_GAME_PROC_RE = re.compile(r"RainbowSix.*\.exe")
_STEAM_NAMES = ("steam", "steam.exe")


def is_steam_running() -> bool:
    return any(
        (proc.info["name"] or "").lower() in _STEAM_NAMES
        for proc in psutil.process_iter(["name"])
    )


def request_steam_shutdown() -> None:
    with contextlib.suppress(OSError):
        subprocess.Popen(
            ["steam", "-shutdown"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )


def proc_environ(pid: int) -> dict[str, str]:
    try:
        return dict(psutil.Process(pid).environ())
    except (psutil.Error, OSError):
        return {}


def proc_cwd(pid: int) -> Path | None:
    try:
        return Path(psutil.Process(pid).cwd())
    except (psutil.Error, OSError):
        return None


def running_game_pids() -> list[int]:
    pids: list[int] = []
    for proc in psutil.process_iter(["name", "cmdline"]):
        cmdline = proc.info["cmdline"] or []
        haystack = " ".join(cmdline) if cmdline else (proc.info["name"] or "")
        if not _GAME_PROC_RE.search(haystack):
            continue
        if IS_WINDOWS or proc_environ(proc.pid).get("STEAM_COMPAT_DATA_PATH"):
            pids.append(proc.pid)
    return pids


def is_game_running() -> bool:
    return bool(running_game_pids())


def _parse_vdf(data: bytes) -> dict:
    pos = 0

    def read_string() -> str:
        nonlocal pos
        start = pos
        while pos < len(data) and data[pos] != 0:
            pos += 1
        if pos >= len(data):
            raise ValueError("Truncated string in binary VDF")
        s = data[start:pos].decode("utf-8", errors="replace")
        pos += 1
        return s

    def read_int(size: int) -> int:
        nonlocal pos
        if pos + size > len(data):
            raise ValueError("Truncated integer in binary VDF")
        value = int.from_bytes(data[pos:pos + size], "little", signed=False)
        pos += size
        return value

    def read_map() -> dict:
        nonlocal pos
        result: dict = {}
        while pos < len(data):
            t = data[pos]
            pos += 1
            if t == 0x08:
                return result
            key = read_string()
            if t == 0x00:
                result[key] = read_map()
            elif t == 0x01:
                result[key] = read_string()
            elif t == 0x02:
                result[key] = read_int(4)
            elif t == 0x07:
                result[key] = read_int(8)
            else:
                raise ValueError(f"Unknown type byte 0x{t:02x} in binary VDF")
        return result

    return read_map()


def _serialize_vdf(obj: dict) -> bytes:
    buf = bytearray()

    def w_string(s: str) -> None:
        buf.extend(s.encode("utf-8"))
        buf.append(0)

    def w_map(m: dict) -> None:
        for k, v in m.items():
            if isinstance(v, dict):
                buf.append(0x00)
                w_string(k)
                w_map(v)
            elif isinstance(v, str):
                buf.append(0x01)
                w_string(k)
                w_string(v)
            elif isinstance(v, int):
                if 0 <= v < (1 << 32):
                    buf.append(0x02)
                    w_string(k)
                    buf.extend(v.to_bytes(4, "little"))
                else:
                    buf.append(0x07)
                    w_string(k)
                    buf.extend(v.to_bytes(8, "little"))
        buf.append(0x08)

    w_map(obj)
    return bytes(buf)


def _backup_and_write(path: Path, data: bytes) -> None:
    if path.exists():
        shutil.copy2(path, path.with_name(path.name + ".bak"))
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_bytes(data)
    os.replace(tmp, path)


def _active_userdata() -> Path | None:
    login = STEAM_DIR / "config" / "loginusers.vdf"
    if login.exists():
        text = login.read_text(errors="replace")
        for m in re.finditer(r'"(\d{17})"\s*\{[^}]*?"MostRecent"\s*"1"', text):
            account_id = int(m.group(1)) - 76561197960265728
            user_dir = STEAM_USERDATA / str(account_id)
            if user_dir.is_dir():
                return user_dir
    users = [p for p in STEAM_USERDATA.glob("*") if p.is_dir() and p.name != "0"]
    if not users:
        return None
    return max(users, key=lambda p: p.stat().st_mtime)


def _shortcuts_path() -> Path | None:
    user_dir = _active_userdata()
    return user_dir / SHORTCUTS_VDF if user_dir else None


def _compute_shortcut_appid(name: str, exe: str) -> int:
    return zlib.crc32((exe + name).encode("utf-8")) | 0x80000000


def shortcut_appids() -> dict[str, int]:
    path = _shortcuts_path()
    if path is None or not path.exists():
        return {}
    try:
        parsed = _parse_vdf(path.read_bytes())
    except (OSError, ValueError, KeyError):
        return {}
    return {
        entry.get("exe", "").strip('"'): entry["appid"]
        for entry in parsed.get("shortcuts", {}).values()
        if "appid" in entry
    }


def find_existing_appid(exe: Path) -> int | None:
    return shortcut_appids().get(str(exe))


def list_protons() -> list[dict]:
    protons: list[dict] = []
    for dirname, internal, display in PROTON_BUILTIN:
        binary = STEAM_COMMON / dirname / "proton"
        if binary.exists():
            protons.append({"display": display, "internal": internal, "binary": binary})

    if STEAM_COMPAT_TOOLS_D.exists():
        for d in sorted(STEAM_COMPAT_TOOLS_D.iterdir()):
            binary = d / "proton"
            vdf = d / "compatibilitytool.vdf"
            if not binary.exists() or not vdf.exists():
                continue
            text = vdf.read_text(errors="replace")
            m = re.search(r'"compat_tools"\s*\{\s*"([^"]+)"', text)
            if not m:
                continue
            internal = m.group(1)
            display_m = re.search(r'"display_name"\s+"([^"]+)"', text)
            display = display_m.group(1) if display_m else internal
            protons.append({"display": display, "internal": internal, "binary": binary})

    return protons


def _add_shortcut(appid: int, name: str, exe: Path, start_dir: Path, icon: Path | None = None) -> bool:
    path = _shortcuts_path()
    if path is None:
        return False

    if path.exists():
        try:
            parsed = _parse_vdf(path.read_bytes())
        except (OSError, ValueError, KeyError):
            return False
    else:
        parsed = {"shortcuts": {}}
    shortcuts = parsed.setdefault("shortcuts", {})
    icon_value = str(icon) if icon else ""

    for entry in shortcuts.values():
        if entry.get("appid") == appid:
            entry["appname"] = name
            entry["exe"] = f'"{exe}"'
            entry["StartDir"] = f'"{start_dir}"'
            entry["icon"] = icon_value
            entry["AllowOverlay"] = 0
            _backup_and_write(path, _serialize_vdf(parsed))
            return True

    new_index = str(max((int(k) for k in shortcuts if k.isdigit()), default=-1) + 1)
    shortcuts[new_index] = {
        "appid": appid,
        "appname": name,
        "exe": f'"{exe}"',
        "StartDir": f'"{start_dir}"',
        "icon": icon_value,
        "ShortcutPath": "",
        "LaunchOptions": "",
        "IsHidden": 0,
        "AllowDesktopConfig": 1,
        "AllowOverlay": 0,
        "OpenVR": 0,
        "Devkit": 0,
        "DevkitGameID": "",
        "DevkitOverrideAppID": 0,
        "LastPlayTime": 0,
        "FlatpakAppID": "",
        "sortas": "",
        "tags": {},
    }
    _backup_and_write(path, _serialize_vdf(parsed))
    return True


def _remove_shortcut(appid: int) -> bool:
    path = _shortcuts_path()
    if path is None or not path.exists():
        return False
    try:
        parsed = _parse_vdf(path.read_bytes())
    except (OSError, ValueError, KeyError):
        return False
    shortcuts = parsed.get("shortcuts", {})
    remaining = [entry for entry in shortcuts.values() if entry.get("appid") != appid]
    if len(remaining) == len(shortcuts):
        return False
    parsed["shortcuts"] = {str(i): entry for i, entry in enumerate(remaining)}
    _backup_and_write(path, _serialize_vdf(parsed))
    return True


def _brace_block_end(text: str, block_start: int) -> int | None:
    depth = 1
    pos = block_start
    while depth > 0 and pos < len(text):
        if text[pos] == '{':
            depth += 1
        elif text[pos] == '}':
            depth -= 1
        pos += 1
    return pos - 1 if depth == 0 else None


def _set_compat_tool(appid: int, internal_name: str) -> bool:
    if not STEAM_CONFIG_VDF.exists():
        return False

    text = STEAM_CONFIG_VDF.read_text(errors="replace")

    block_match = re.search(r'"CompatToolMapping"\s*\{', text)
    if not block_match:
        steam_match = re.search(r'"Steam"\s*\{', text, re.IGNORECASE)
        if not steam_match:
            return False
        insert_at = steam_match.end()
        text = (
            text[:insert_at]
            + '\n\t\t\t\t"CompatToolMapping"\n\t\t\t\t{\n\t\t\t\t}'
            + text[insert_at:]
        )
        block_match = re.search(r'"CompatToolMapping"\s*\{', text)
        if not block_match:
            return False
    block_start = block_match.end()
    block_end = _brace_block_end(text, block_start)
    if block_end is None:
        return False
    block_inner = text[block_start:block_end]

    entry = (
        f'\t\t\t\t\t"{appid}"\n'
        f'\t\t\t\t\t{{\n'
        f'\t\t\t\t\t\t"name"\t\t"{internal_name}"\n'
        f'\t\t\t\t\t\t"config"\t\t""\n'
        f'\t\t\t\t\t\t"priority"\t\t"250"\n'
        f'\t\t\t\t\t}}'
    )

    existing = re.search(
        rf'\t*"{re.escape(str(appid))}"\s*\{{[^}}]*\}}',
        block_inner,
    )
    if existing:
        new_inner = block_inner[:existing.start()] + entry + block_inner[existing.end():]
    else:
        new_inner = "\n" + entry + block_inner

    new_text = text[:block_start] + new_inner + text[block_end:]
    _backup_and_write(STEAM_CONFIG_VDF, new_text.encode("utf-8"))
    return True


def _remove_compat_tool(appid: int) -> bool:
    if not STEAM_CONFIG_VDF.exists():
        return False
    text = STEAM_CONFIG_VDF.read_text(errors="replace")
    block_match = re.search(r'"CompatToolMapping"\s*\{', text)
    if not block_match:
        return False
    block_start = block_match.end()
    block_end = _brace_block_end(text, block_start)
    if block_end is None:
        return False
    new_inner, count = re.subn(
        rf'\n?\t*"{re.escape(str(appid))}"\s*\{{[^}}]*\}}',
        "",
        text[block_start:block_end],
    )
    if count == 0:
        return False
    new_text = text[:block_start] + new_inner + text[block_end:]
    _backup_and_write(STEAM_CONFIG_VDF, new_text.encode("utf-8"))
    return True


def _place_artwork(source: Path, dest_base: Path) -> None:
    if source.suffix.lower() in (".png", ".jpg", ".jpeg"):
        shutil.copy2(source, dest_base.with_suffix(source.suffix))
        return
    image = QImage(str(source))
    if not image.isNull():
        image.save(str(dest_base.with_suffix(".jpg")), "JPG", 92)


def _write_grid_artwork(appid: int, logo: Path | None, hero: Path | None, capsule: Path | None) -> None:
    user = _active_userdata()
    if user is None:
        return
    grid = user / "config" / "grid"
    grid.mkdir(parents=True, exist_ok=True)
    if logo and logo.exists():
        _place_artwork(logo, grid / f"{appid}_logo")
        position = {
            "nVersion": 1,
            "logoPosition": {
                "pinnedPosition": "BottomLeft",
                "nWidthPct": 30,
                "nHeightPct": 30,
            },
        }
        (grid / f"{appid}.json").write_text(json.dumps(position))
    if hero and hero.exists():
        _place_artwork(hero, grid / f"{appid}_hero")
    if capsule and capsule.exists():
        _place_artwork(capsule, grid / f"{appid}p")


def _remove_grid_artwork(appid: int) -> None:
    user = _active_userdata()
    if user is None:
        return
    grid = user / "config" / "grid"
    if not grid.is_dir():
        return
    prefix = str(appid)
    for f in grid.iterdir():
        if (
            f.name == f"{prefix}.json"
            or f.name.startswith(f"{prefix}_")
            or f.name.startswith(f"{prefix}p.")
        ):
            with contextlib.suppress(OSError):
                f.unlink()


def apply_steam_setup(name: str, exe: Path, start_dir: Path, proton: dict, icon: Path | None = None,
                      logo: Path | None = None, hero: Path | None = None, capsule: Path | None = None) -> str | None:
    if is_steam_running():
        return "Close Steam completely to apply"

    user = _active_userdata()
    if user is None:
        return "No Steam account found"

    appid = find_existing_appid(exe) or _compute_shortcut_appid(name, str(exe))

    if icon is not None and icon.exists():
        grid = user / "config" / "grid"
        grid.mkdir(parents=True, exist_ok=True)
        persistent = grid / f"{appid}_icon{icon.suffix}"
        shutil.copy2(icon, persistent)
        icon = persistent

    if not _set_compat_tool(appid, proton["internal"]):
        return "Could not update config.vdf"
    if not _add_shortcut(appid, name, exe, start_dir, icon):
        return "Could not write shortcuts.vdf"

    _write_grid_artwork(appid, logo, hero, capsule)

    return None


def uninstall_targets(key: str) -> dict | None:
    variant = installed_variant(key)
    if variant is None:
        return None
    folder, is_hm = variant
    appid = find_existing_appid(folder / launcher_name(is_hm))
    prefix = STEAM_COMPATDATA / str(appid) if appid is not None else None
    return {
        "folder": str(folder),
        "prefix": str(prefix) if prefix is not None and prefix.exists() else "",
        "shortcut": appid is not None,
    }


def uninstall(key: str) -> dict:
    variant = installed_variant(key)
    if variant is None:
        return {"ok": False, "message": "Not installed"}
    if is_game_running():
        return {"ok": False, "message": "Close Rainbow Six Siege first"}
    folder, is_hm = variant
    appid = find_existing_appid(folder / launcher_name(is_hm))

    if appid is not None:
        if is_steam_running():
            return {"ok": False, "message": "Close Steam completely first"}
        _unlink_steam(appid)
        error = _delete_prefix(appid)
        if error is not None:
            return error

    error = _delete_folder(folder)
    if error is not None:
        return error

    return {"ok": True, "message": ""}


def _unlink_steam(appid: int) -> None:
    _remove_shortcut(appid)
    _remove_compat_tool(appid)
    _remove_grid_artwork(appid)


def _delete_prefix(appid: int) -> dict | None:
    prefix = STEAM_COMPATDATA / str(appid)
    if prefix.exists():
        try:
            shutil.rmtree(prefix)
        except OSError as e:
            return {"ok": False, "message": f"Could not delete prefix — {e}"}
    return None


def _delete_folder(folder: Path) -> dict | None:
    try:
        shutil.rmtree(folder)
    except OSError as e:
        return {"ok": False, "message": f"Could not delete install — {e}"}
    return None


def uninstall_item(key: str, item: str) -> dict:
    variant = installed_variant(key)
    if variant is None:
        return {"ok": False, "message": "Not installed"}
    folder, is_hm = variant
    if item == "files":
        if is_game_running():
            return {"ok": False, "message": "Close Rainbow Six Siege first"}
        error = _delete_folder(folder)
        if error is not None:
            return error
        return {"ok": True, "message": "Game files deleted"}
    appid = find_existing_appid(folder / launcher_name(is_hm))
    if appid is None:
        return {"ok": False, "message": "Not linked to Steam"}
    if is_steam_running():
        return {"ok": False, "message": "Close Steam completely first"}
    if item == "prefix":
        error = _delete_prefix(appid)
        if error is not None:
            return error
        return {"ok": True, "message": "Proton prefix deleted"}
    if item == "shortcut":
        _unlink_steam(appid)
        return {"ok": True, "message": "Steam shortcut removed"}
    return {"ok": False, "message": "Unknown item"}
