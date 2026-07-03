import contextlib
import json
import os
import select
import shutil
import socket
import struct
import subprocess
import threading
import time
import uuid
from collections.abc import Iterator
from pathlib import Path
from typing import BinaryIO

from core.config import get_setting, load_config
from core.constants import CONFIG_FILE, IS_WINDOWS, libraries
from core.manifest import hm_display_name, load_downloads, resolve_install
from core.steam import proc_cwd, running_game_pids

OP_HANDSHAKE = 0
OP_FRAME = 1
OP_CLOSE = 2
OP_PING = 3
OP_PONG = 4

POLL_INTERVAL = 10
MAX_RECONNECT_DELAY = 30
IPC_TIMEOUT = 10


def _unix_paths() -> Iterator[str]:
    bases = []
    for env in ("XDG_RUNTIME_DIR", "TMPDIR", "TMP", "TEMP"):
        v = os.environ.get(env)
        if v:
            bases.append(v)
    bases.append("/tmp")
    subs = (
        "",
        "app/com.discordapp.Discord",
        ".flatpak/com.discordapp.Discord/xdg-run",
    )
    for base in bases:
        for sub in subs:
            d = Path(base) / sub
            for i in range(10):
                p = d / f"discord-ipc-{i}"
                if p.exists():
                    yield str(p)


class _PipeConn:
    def __init__(self, fileobj: BinaryIO) -> None:
        self._f = fileobj

    def sendall(self, data: bytes) -> None:
        self._f.write(data)
        self._f.flush()

    def recv(self, n: int) -> bytes:
        return self._f.read(n) or b""

    def close(self) -> None:
        with contextlib.suppress(OSError):
            self._f.close()


def _open_candidates() -> Iterator[_PipeConn | socket.socket]:
    if IS_WINDOWS:
        for i in range(10):
            try:
                f = open(rf"\\.\pipe\discord-ipc-{i}", "r+b", buffering=0)
            except OSError:
                continue
            yield _PipeConn(f)
    else:
        for path in _unix_paths():
            s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            s.settimeout(IPC_TIMEOUT)
            try:
                s.connect(path)
            except OSError:
                s.close()
                continue
            yield s


class Presence:
    def __init__(self, client_id: str) -> None:
        self.client_id = client_id
        self.sock = None

    @property
    def connected(self) -> bool:
        return self.sock is not None

    def connect(self) -> bool:
        for conn in _open_candidates():
            self.sock = conn
            try:
                self._send(OP_HANDSHAKE, {"v": 1, "client_id": self.client_id})
                op, _ = self._recv()
                if op == OP_FRAME:
                    return True
            except OSError:
                pass
            self.close()
        return False

    def _send(self, op: int, payload: dict) -> None:
        sock = self.sock
        if sock is None:
            raise ConnectionError("not connected")
        data = json.dumps(payload).encode()
        sock.sendall(struct.pack("<II", op, len(data)) + data)

    def _recv(self) -> tuple[int, dict]:
        sock = self.sock
        if sock is None:
            raise ConnectionError("not connected")
        header = b""
        while len(header) < 8:
            chunk = sock.recv(8 - len(header))
            if not chunk:
                raise ConnectionError("socket closed")
            header += chunk
        op, length = struct.unpack("<II", header)
        body = b""
        while len(body) < length:
            chunk = sock.recv(length - len(body))
            if not chunk:
                raise ConnectionError("socket closed")
            body += chunk
        return op, json.loads(body.decode())

    def _await_response(self, nonce: str) -> bool:
        while True:
            op, payload = self._recv()
            if op == OP_PING:
                self._send(OP_PONG, payload)
                continue
            if op == OP_FRAME and payload.get("nonce") == nonce:
                return True

    def _send_activity(self, activity: dict | None) -> bool:
        try:
            nonce = str(uuid.uuid4())
            self._send(OP_FRAME, {
                "cmd": "SET_ACTIVITY",
                "args": {"pid": os.getpid(), "activity": activity},
                "nonce": nonce,
            })
            return self._await_response(nonce)
        except OSError:
            self.close()
            return False

    def set(self, activity: dict) -> bool:
        return self._send_activity(activity)

    def clear(self) -> bool:
        return self._send_activity(None)

    def drain(self) -> None:
        if not self.sock or IS_WINDOWS:
            return
        try:
            while select.select([self.sock], [], [], 0)[0]:
                op, payload = self._recv()
                if op == OP_PING:
                    self._send(OP_PONG, payload)
        except OSError:
            self.close()

    def close(self) -> None:
        if self.sock:
            with contextlib.suppress(OSError):
                self._send(OP_CLOSE, {})
            with contextlib.suppress(OSError):
                self.sock.close()
            self.sock = None


def _find_game_folder() -> str | None:
    roots = sorted(libraries(), key=lambda p: len(p.parts), reverse=True)
    for pid in running_game_pids():
        cwd = proc_cwd(pid)
        if cwd is None:
            continue
        resolved = cwd.resolve()
        for root in roots:
            try:
                rel = resolved.relative_to(root)
            except ValueError:
                continue
            if rel.parts:
                return rel.parts[0]
    return None


def _valid_client_id(value: str) -> str:
    value = (value or "").strip()
    return value if value.isdigit() and len(value) >= 17 else ""


def _resolve_label(folder: str, downloads: list[dict]) -> str | None:
    resolved = resolve_install(folder, downloads)
    if resolved is None:
        return None
    download, is_hm = resolved
    return hm_display_name(download) if is_hm else download["label"]


def _build_buttons(cfg: dict) -> list:
    buttons = []
    for i in (1, 2):
        label = get_setting(cfg, f"discord_button{i}_label", "").strip()
        url = get_setting(cfg, f"discord_button{i}_url", "").strip()
        if label and url:
            buttons.append({"label": label, "url": url})
    if not buttons:
        buttons.append(
            {"label": "Throwback Launcher", "url": "https://github.com/Xeralin/ThrowbackLauncher"}
        )
    return buttons


def _apply_tokens(text: str, label: str, code: str) -> str:
    return text.replace("{season_name}", label).replace("{season_code}", code)


def _build_activity(label: str, start_time: int, cfg: dict) -> dict:
    code = label.split(" ", 1)[0]
    details = _apply_tokens(
        get_setting(cfg, "discord_details", "").strip() or "{season_name}", label, code
    )
    state_raw = get_setting(cfg, "discord_state", "").strip()
    state = _apply_tokens(state_raw, label, code)
    large_image = get_setting(cfg, "discord_large_image", "").strip()
    large_text_raw = get_setting(cfg, "discord_large_text", "").strip()
    large_text = _apply_tokens(large_text_raw, label, code) if large_text_raw else details
    small_image = get_setting(cfg, "discord_small_image", "").strip()
    small_text_raw = get_setting(cfg, "discord_small_text", "").strip()
    small_text = _apply_tokens(small_text_raw, label, code) if small_text_raw else ""

    assets: dict = {}
    if large_image:
        assets["large_image"] = large_image
        assets["large_text"] = large_text
    if small_image:
        assets["small_image"] = small_image
        if small_text:
            assets["small_text"] = small_text

    activity: dict = {"details": details, "timestamps": {"start": start_time}}
    if state:
        activity["state"] = state
    if assets:
        activity["assets"] = assets
    activity["buttons"] = _build_buttons(cfg)
    return activity


def is_discord_installed() -> bool:
    if IS_WINDOWS:
        local = os.environ.get("LOCALAPPDATA")
        if local and (Path(local) / "Discord").exists():
            return True
        return any(shutil.which(name) for name in ("Discord", "discord"))
    for name in ("discord", "Discord", "discord-stable", "discord-canary", "discord-ptb"):
        if shutil.which(name):
            return True
    try:
        return subprocess.run(
            ["flatpak", "info", "com.discordapp.Discord"],
            capture_output=True, check=False,
        ).returncode == 0
    except FileNotFoundError:
        return False


def _config_mtime() -> float:
    try:
        return CONFIG_FILE.stat().st_mtime
    except OSError:
        return 0.0


def _run(stop: threading.Event) -> None:
    try:
        downloads = load_downloads()
    except RuntimeError:
        return
    presence: Presence | None = None
    current_folder: str | None = None
    current_client_id: str | None = None
    start_time = 0
    reconnect_delay = 1
    last_signature: str | None = None
    cfg = load_config()
    cfg_mtime = _config_mtime()

    try:
        while not stop.is_set():
            if presence and presence.connected:
                presence.drain()

            mtime = _config_mtime()
            if mtime != cfg_mtime:
                cfg_mtime = mtime
                cfg = load_config()
            client_id = _valid_client_id(get_setting(cfg, "discord_client_id", ""))
            folder = _find_game_folder()
            label = _resolve_label(folder, downloads) if folder else None

            if not client_id or label is None:
                if presence is not None:
                    presence.clear()
                    presence.close()
                    presence = None
                current_folder = None
                current_client_id = None
                start_time = 0
                last_signature = None
                reconnect_delay = 1
            else:
                if folder != current_folder:
                    start_time = int(time.time())
                if (presence is None
                        or not presence.connected
                        or current_client_id != client_id):
                    if presence is not None:
                        presence.close()
                    presence = Presence(client_id)
                    if not presence.connect():
                        delay = reconnect_delay
                        reconnect_delay = min(reconnect_delay * 2, MAX_RECONNECT_DELAY)
                        if stop.wait(delay):
                            break
                        continue
                    current_client_id = client_id
                    reconnect_delay = 1
                    last_signature = None

                activity = _build_activity(label, start_time, cfg)
                signature = json.dumps(activity, sort_keys=True)
                if signature != last_signature and presence.set(activity):
                    current_folder = folder
                    last_signature = signature

            if stop.wait(POLL_INTERVAL):
                break
    finally:
        if presence:
            presence.clear()
            presence.close()


_thread: threading.Thread | None = None
_stop = threading.Event()


def start_presence() -> None:
    global _thread, _stop
    if _thread is not None and _thread.is_alive() and not _stop.is_set():
        return
    _stop = threading.Event()
    _thread = threading.Thread(target=_run, args=(_stop,), name="discord-rpc", daemon=True)
    _thread.start()


def stop_presence() -> None:
    _stop.set()
