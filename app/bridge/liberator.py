import json
import os
import socket
import subprocess
import sys
import threading
import time
from pathlib import Path

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core.constants import BIN_DIR, LIBERATOR_PATH, STEAM_DIR
from core.steam import is_game_running, list_protons, proc_environ, running_game_pids

_CAP_KEYS = (
    "godMode", "disableAI", "unlimitedAmmo", "unlimitedEquip", "infiniteTime",
    "disablePrimary", "disableSecondary", "disableSpecialGadget", "disableGadget",
    "harvard", "oldHereford", "displayBuild", "madHouse", "endRound", "endMatch",
    "playlist", "unlockAll",
)


def _winpath(path: Path) -> str:
    return "Z:" + str(path).replace("/", "\\")


def _headless_exe() -> Path | None:
    return LIBERATOR_PATH if LIBERATOR_PATH.exists() else None


def _running_game_env() -> dict[str, str] | None:
    for pid in running_game_pids():
        env = proc_environ(pid)
        if env.get("STEAM_COMPAT_DATA_PATH"):
            return env
    return None


def _find_proton(env: dict[str, str]) -> Path | None:
    for directory in env.get("STEAM_COMPAT_TOOL_PATHS", "").split(":"):
        if directory:
            candidate = Path(directory) / "proton"
            if candidate.exists():
                return candidate
    protons = list_protons()
    return protons[0]["binary"] if protons else None


class LiberatorController(QObject):
    state_changed = Signal(object)
    tree_changed = Signal(object)
    error = Signal(str)
    _state_in = Signal(object)
    _tree_in = Signal(object)
    _error_in = Signal(str)
    _kill_in = Signal()

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._proc: subprocess.Popen | None = None
        self._sock: socket.socket | None = None
        self._send_lock = threading.Lock()
        self._busy = False
        self._active = False
        self._timer: QTimer | None = None
        self._last_state: dict = self._default_state()
        self._last_tree: object = None
        self._state_in.connect(self._relay_state)
        self._tree_in.connect(self._relay_tree)
        self._error_in.connect(self._relay_error)
        self._kill_in.connect(self._kill)

    @Slot(object)
    def _relay_state(self, state: object) -> None:
        self.state_changed.emit(state)

    @Slot(object)
    def _relay_tree(self, tree: object) -> None:
        self.tree_changed.emit(tree)

    @Slot(str)
    def _relay_error(self, message: str) -> None:
        self.error.emit(message)

    def _default_state(self) -> dict:
        return {
            "attached": False,
            "seasonName": "",
            "buildNumber": "",
            "tier": "",
            "ready": False,
            "status": "",
            "capabilities": {key: False for key in _CAP_KEYS},
            "madHouseVariants": [],
        }

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return self._last_state

    @Slot(result="QVariant")
    def tree_snapshot(self) -> object:
        return self._last_tree

    @Slot(result=bool)
    def is_game_running(self) -> bool:
        return is_game_running()

    @Slot()
    def start(self) -> None:
        self._active = True
        if self._timer is None:
            self._timer = QTimer(self)
            self._timer.timeout.connect(self._poll)
            self._timer.start(1500)
        self._poll()

    @Slot()
    def shutdown(self) -> None:
        self._active = False
        self._kill()

    @Slot(str, bool)
    def set_mod(self, mod: str, enabled: bool) -> None:
        self._send(cmd="setMod", mod=mod, enabled=enabled)

    @Slot(str)
    def set_gametype(self, gametype_id: str) -> None:
        self._send(cmd="setGametype", gametypeId=gametype_id)

    @Slot(int)
    def set_mad_house(self, variant: int) -> None:
        self._send(cmd="setMadHouse", variant=variant)

    @Slot()
    def end_round(self) -> None:
        self._send(cmd="endRound")

    @Slot()
    def end_match(self) -> None:
        self._send(cmd="endMatch")

    def _poll(self) -> None:
        if not self._active:
            return
        running = is_game_running()
        if running and self._sock is None and not self._busy:
            self._busy = True
            threading.Thread(target=self._attach, daemon=True).start()
        elif not running and self._sock is not None:
            self._kill()

    def _attach(self) -> None:
        try:
            helper = _headless_exe()
            if helper is None:
                self._error_in.emit("Liberator helper is not installed")
                return

            port_file = BIN_DIR / "liberator-port"
            port_file.unlink(missing_ok=True)
            if sys.platform.startswith("win"):
                self._proc = subprocess.Popen(
                    [str(helper), "--port-file", str(port_file)],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
            else:
                env_game = _running_game_env()
                if env_game is None:
                    return
                proton = _find_proton(env_game)
                if proton is None:
                    self._error_in.emit("Could not find Proton for the running game")
                    return
                env = dict(os.environ)
                env["STEAM_COMPAT_DATA_PATH"] = env_game["STEAM_COMPAT_DATA_PATH"]
                client_install = env_game.get("STEAM_COMPAT_CLIENT_INSTALL_PATH")
                env["STEAM_COMPAT_CLIENT_INSTALL_PATH"] = client_install or str(STEAM_DIR)
                self._proc = subprocess.Popen(
                    [str(proton), "run", _winpath(helper),
                     "--port-file", _winpath(port_file)],
                    env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )

            port = self._await_port(port_file)
            if port is None:
                self._error_in.emit("Liberator helper did not start")
                self._kill()
                return
            sock = socket.create_connection(("127.0.0.1", port), timeout=5)
            sock.settimeout(None)
            self._sock = sock
            self._raw_send(sock, {"cmd": "hello", "protocol": 1})
            threading.Thread(target=self._reader, args=(sock,), daemon=True).start()
            self._raw_send(sock, {"cmd": "requestTree"})
        except Exception as e:
            self._error_in.emit(f"Attach failed — {e}")
            self._kill()
        finally:
            self._busy = False

    def _await_port(self, port_file: Path, timeout: float = 15.0) -> int | None:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            if self._proc is not None and self._proc.poll() is not None:
                return None
            try:
                text = port_file.read_text().strip()
                if text:
                    return int(text)
            except (OSError, ValueError):
                pass
            time.sleep(0.2)
        return None

    def _reader(self, sock: socket.socket) -> None:
        buffer = b""
        try:
            while True:
                data = sock.recv(4096)
                if not data:
                    break
                buffer += data
                while b"\n" in buffer:
                    line, buffer = buffer.split(b"\n", 1)
                    if not line.strip():
                        continue
                    try:
                        msg = json.loads(line.decode("utf-8"))
                    except ValueError:
                        continue
                    if msg.get("event") == "state":
                        self._last_state = msg
                        self._state_in.emit(msg)
                    elif msg.get("event") == "tree":
                        self._last_tree = msg.get("tree")
                        self._tree_in.emit(self._last_tree)
        except OSError:
            pass
        if sock is self._sock:
            self._kill_in.emit()

    def _send(self, **payload: object) -> None:
        sock = self._sock
        if sock is not None:
            self._raw_send(sock, payload)

    def _raw_send(self, sock: socket.socket, payload: dict) -> None:
        data = (json.dumps(payload) + "\n").encode("utf-8")
        try:
            with self._send_lock:
                sock.sendall(data)
        except OSError:
            pass

    def _kill(self) -> None:
        sock = self._sock
        self._sock = None
        if sock is not None:
            try:
                sock.close()
            except OSError:
                pass
        proc = self._proc
        self._proc = None
        if proc is not None:
            try:
                proc.terminate()
            except OSError:
                pass
        self._last_state = self._default_state()
        self._last_tree = None
        self._state_in.emit(self._last_state)
