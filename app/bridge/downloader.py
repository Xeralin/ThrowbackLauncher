import re
import shutil
import threading
from collections import deque
from pathlib import Path

from PySide6.QtCore import QObject, QProcess, Property, QTimer, Signal, Slot

from core.config import get_setting
from core.constants import (
    DEFAULT_MAX_DOWNLOADS,
    DEFAULT_USERNAME,
    default_library,
    HM_KEY,
    LAUNCHER_EXE,
    libraries,
    MEDIA_DIR,
    NAME_PATTERN,
)
from core.depot import RateLimited, depot_commands, ensure_runtime
from core.heatedmetal import apply_hm
from core.manifest import (
    hm_display_name,
    hm_folder_name,
    installed_username,
    installed_variant,
    launcher_name,
    partial_variant,
    splash_path,
)
from core.spinner import LazySpinner, Reporter
from core.steam import apply_steam_setup, is_game_running, is_steam_running as steam_running, list_protons
from core.throwbackloader import apply_tl, write_launcher

from bridge.reporter import SignalReporter

_PERCENT = re.compile(r"^\s*(\d+(?:\.\d+)?)\s*%")


def _redacted_args(args: list[str]) -> str:
    out = list(args)
    for i, arg in enumerate(out):
        if arg == "-username" and i + 1 < len(out):
            out[i + 1] = "<hidden>"
    return " ".join(out)


def apply_install(target: Path, download: dict, is_hm: bool, username: str,
                  include_launcher: bool = True, reporter: Reporter | None = None) -> bool:
    if is_hm:
        return apply_hm(target, username, download[HM_KEY].get("hm_version"), reporter=reporter)
    with (reporter or LazySpinner()) as sp:
        sp.update("Copying files")
        try:
            apply_tl(target, username, download["loader"])
            if include_launcher:
                write_launcher(target)
        except OSError as e:
            sp.fail(f"ThrowbackLoader setup failed — {e}")
            return False
        sp.succeed("ThrowbackLoader applied")
        return True


class DownloadController(QObject):
    log_line = Signal(str)
    progress_changed = Signal()
    running_changed = Signal()
    state_changed = Signal()
    finished = Signal(int)
    login_required = Signal(str)
    error = Signal(str)
    active_key_changed = Signal()
    steam_setup_done = Signal(bool, str)
    partial_deleted = Signal(str, bool, str)
    rate_limited = Signal()
    queue_changed = Signal()

    _prepare_done = Signal(int, str, str)
    _apply_done = Signal(int, bool)
    _steam_done = Signal(int, bool, str)
    _deleted_in = Signal(str, bool, str)

    def __init__(self, cfg: dict, downloads: list[dict], parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._cfg = cfg
        self._downloads = downloads
        self._peer: QObject | None = None
        self._settings: QObject | None = None
        self._process: QProcess | None = None
        self._proc_done = False
        self._progress = 0.0
        self._running = False
        self._state = "idle"
        self._active_key = ""
        self._cancelled = False
        self._generation = 0
        self._login_pending = False
        self._login_kind = ""
        self._pending_password = ""
        self._pending_request: tuple | None = None
        self._buffer = ""
        self._history: deque[str] = deque(maxlen=2000)
        self._commands: list[dict] = []
        self._index = 0
        self._download: dict = {}
        self._enable_hm = False
        self._verifying = False
        self._steam_account = ""
        self._max_downloads = DEFAULT_MAX_DOWNLOADS
        self._target = default_library()
        self._dd = ""
        self._protons: list[dict] = []
        self._deleting_key = None
        self._uninstaller: QObject | None = None
        self._steam_generation = 0
        self._queue: list[tuple[str, bool, str]] = []
        self.log_line.connect(self._history.append)
        self._prepare_done.connect(self._on_prepare_done)
        self._apply_done.connect(self._on_apply_done)
        self._steam_done.connect(self._on_steam_done)
        self._deleted_in.connect(self._on_deleted)

    @Property(float, notify=progress_changed)
    def progress(self) -> float:
        return self._progress

    @Property(bool, notify=running_changed)
    def running(self) -> bool:
        return self._running

    @Property(str, notify=state_changed)
    def state(self) -> str:
        return self._state

    @Property(str, notify=active_key_changed)
    def active_key(self) -> str:
        return self._active_key

    def _set_progress(self, value: float) -> None:
        if value != self._progress:
            self._progress = value
            self.progress_changed.emit()

    def _set_running(self, value: bool) -> None:
        if value != self._running:
            self._running = value
            self.running_changed.emit()

    def _set_state(self, value: str) -> None:
        if value != self._state:
            self._state = value
            self.state_changed.emit()

    def set_peer(self, peer: QObject) -> None:
        self._peer = peer
        peer.changed.connect(self._start_next)

    def set_settings(self, settings: QObject) -> None:
        self._settings = settings

    def set_uninstaller(self, uninstaller: QObject) -> None:
        self._uninstaller = uninstaller

    def _accept(self, season_key: str, resume: tuple) -> dict | None:
        if self._running:
            return None
        if self._deleting_key == season_key:
            self.error.emit("Deleting files — wait a moment")
            return None
        if self._uninstaller is not None and self._uninstaller.busy_key() == season_key:
            self.error.emit("Uninstall is running — wait for it to finish")
            return None
        if self._peer is not None and self._peer.property("busy"):
            self.error.emit("Updates are running — wait for them to finish")
            return None
        download = next((d for d in self._downloads if d["key"] == season_key), None)
        if download is None:
            self.error.emit("Unknown download")
            return None
        steam_account = get_setting(self._cfg, "steam_account", "")
        if not steam_account or not NAME_PATTERN.match(steam_account):
            self._pending_request = resume
            self._login_kind = "account"
            self.login_required.emit("account")
            return None
        self._steam_account = steam_account
        return download

    @Slot(str, bool, str)
    def start(self, season_key: str, enable_hm: bool, library: str) -> None:
        QTimer.singleShot(0, lambda: self._start(season_key, enable_hm, library))

    @Slot(str, bool, str)
    def enqueue(self, season_key: str, enable_hm: bool, library: str) -> None:
        QTimer.singleShot(0, lambda: self._enqueue(season_key, enable_hm, library))

    def _enqueue(self, season_key: str, enable_hm: bool, library: str) -> None:
        if not self._running:
            self._start(season_key, enable_hm, library)
            return
        if season_key == self._active_key or any(item[0] == season_key for item in self._queue):
            return
        if installed_variant(season_key) is not None:
            self.error.emit("Already installed")
            return
        self._queue.append((season_key, enable_hm, library))
        self.queue_changed.emit()

    @Slot(str)
    def dequeue(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._dequeue(season_key))

    def _dequeue(self, season_key: str) -> None:
        remaining = [item for item in self._queue if item[0] != season_key]
        if len(remaining) != len(self._queue):
            self._queue = remaining
            self.queue_changed.emit()

    def queued_keys(self) -> list:
        return [item[0] for item in self._queue]

    def _start_next(self) -> None:
        while self._queue and not self._running and self._pending_request is None:
            if self._queue[0][0] == self._deleting_key or (
                self._peer is not None and self._peer.property("busy")
            ):
                return
            season_key, enable_hm, library = self._queue.pop(0)
            self.queue_changed.emit()
            self._start(season_key, enable_hm, library)

    def _start(self, season_key: str, enable_hm: bool, library: str) -> None:
        self._dequeue(season_key)
        download = self._accept(season_key, ("start", season_key, enable_hm, library))
        if download is None:
            return
        partial = partial_variant(season_key)
        if partial is not None:
            target, is_hm = partial
            if enable_hm != is_hm or (library and Path(library).resolve() != target.parent):
                self.error.emit("A partial download exists — continue or delete it first")
                return
        else:
            if installed_variant(season_key) is not None:
                self.error.emit("Already installed")
                return
            root = Path(library).resolve() if library else default_library()
            if root not in libraries():
                self.error.emit("Unknown library")
                return
            if not root.exists():
                self.error.emit("Library folder is missing — is the drive connected?")
                return
            target = root / (hm_folder_name(season_key) if enable_hm else season_key)
        self._launch(download, season_key, target, enable_hm, verify=False)

    @Slot(str)
    def delete_partial(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._delete_partial(season_key))

    def _delete_partial(self, season_key: str) -> None:
        if self._running and season_key == self._active_key:
            return
        if self._deleting_key is not None:
            self.partial_deleted.emit(season_key, False, "Deleting files — wait a moment")
            return
        installed = installed_variant(season_key)
        installed_path = installed[0] if installed is not None else None
        targets = [
            path
            for root in libraries()
            for folder in (season_key, hm_folder_name(season_key))
            if (path := root / folder).is_dir() and path != installed_path
        ]
        if not targets:
            self.partial_deleted.emit(season_key, False, "Nothing to delete")
            return
        self._deleting_key = season_key
        label = next((d["label"] for d in self._downloads if d["key"] == season_key), season_key)

        def work() -> None:
            try:
                for path in targets:
                    shutil.rmtree(path)
            except OSError as e:
                self._deleted_in.emit(season_key, False, f"Delete failed — {e}")
            else:
                self._deleted_in.emit(season_key, True, f"{label} download deleted")

        threading.Thread(target=work, daemon=True).start()

    def _on_deleted(self, season_key: str, ok: bool, message: str) -> None:
        self._deleting_key = None
        self.partial_deleted.emit(season_key, ok, message)
        self._start_next()

    @Slot(str)
    def verify(self, season_key: str) -> None:
        QTimer.singleShot(0, lambda: self._verify(season_key))

    def _verify(self, season_key: str) -> None:
        download = self._accept(season_key, ("verify", season_key))
        if download is None:
            return
        variant = installed_variant(season_key)
        if variant is None:
            self.error.emit("Not installed")
            return
        target, is_hm = variant
        if is_game_running():
            self.error.emit("Close the game to continue")
            return
        self._launch(download, season_key, target, is_hm, verify=True)

    def _launch(self, download: dict, season_key: str, target: Path,
                enable_hm: bool, verify: bool) -> None:
        self._generation += 1
        self._download = download
        self._enable_hm = enable_hm
        self._verifying = verify
        self._max_downloads = get_setting(self._cfg, "max_downloads", DEFAULT_MAX_DOWNLOADS)
        self._target = target
        self._cancelled = False
        self._history.clear()
        if self._active_key != season_key:
            self._active_key = season_key
            self.active_key_changed.emit()
        self._set_progress(0.0)
        self._set_state("preparing")
        self._set_running(True)
        threading.Thread(
            target=self._prepare,
            args=(self._generation, enable_hm),
            daemon=True,
        ).start()

    def _prepare(self, generation: int, enable_hm: bool) -> None:
        reporter = SignalReporter(self.log_line.emit)
        try:
            dd = ensure_runtime(enable_hm, reporter)
            if dd is None:
                self._prepare_done.emit(generation, "", "Runtime setup failed")
                return
            self._prepare_done.emit(generation, str(dd), "")
        except RateLimited:
            self.rate_limited.emit()
            self._prepare_done.emit(generation, "", "Runtime setup failed")
        except Exception as e:
            self._prepare_done.emit(generation, "", f"Setup failed — {e}")

    def _on_prepare_done(self, generation: int, dd: str, err: str) -> None:
        if generation != self._generation or self._cancelled:
            return
        if err:
            self.log_line.emit(err)
            self._finish(1)
            return
        self._dd = dd
        try:
            self._commands = depot_commands(
                self._download, self._steam_account, self._target, self._max_downloads, is_hm=self._enable_hm
            )
            self._target.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            self.log_line.emit(f"Setup failed — {e}")
            self._finish(1)
            return
        self.log_line.emit(f"Validating {self._target}" if self._verifying else f"Downloading to {self._target}")
        self._set_state("downloading")
        self._index = 0
        self._run_next()

    def _run_next(self) -> None:
        if self._index >= len(self._commands):
            self._set_progress(100.0)
            self._start_apply()
            return
        cmd = self._commands[self._index]
        self._set_progress(0.0)
        self._buffer = ""
        self._login_pending = False
        self._proc_done = False
        proc = QProcess(self)
        proc.setProcessChannelMode(QProcess.MergedChannels)
        proc.readyReadStandardOutput.connect(self._on_output)
        proc.finished.connect(self._on_process_finished)
        proc.errorOccurred.connect(self._on_process_error)
        self._process = proc
        self.log_line.emit(f"$ DepotDownloader {_redacted_args(cmd['args'])}")
        proc.start(self._dd, cmd["args"])

    def _on_output(self) -> None:
        proc = self.sender()
        if proc is None or proc is not self._process:
            return
        self._buffer += bytes(proc.readAllStandardOutput()).decode("utf-8", errors="replace")
        while True:
            nl = self._buffer.find("\n")
            if nl < 0:
                break
            line = self._buffer[:nl].rstrip("\r")
            self._buffer = self._buffer[nl + 1:]
            self._emit_line(line)
        self._check_prompt(self._buffer)

    def _emit_line(self, line: str) -> None:
        self.log_line.emit(line)
        match = _PERCENT.match(line)
        if match and self._commands:
            depot_pct = min(float(match.group(1)), 100.0)
            if depot_pct > self._progress:
                self._set_progress(depot_pct)

    def _check_prompt(self, text: str) -> None:
        if self._login_pending:
            return
        stripped = text.rstrip()
        if not stripped.endswith(":"):
            return
        low = stripped.lower()
        if any(token in low for token in ("auth code", "2-factor", "two-factor", "steam guard")):
            kind = "guard"
        elif "password" in low:
            kind = "password"
        else:
            return
        self._login_pending = True
        self.log_line.emit(stripped)
        if kind == "password" and self._pending_password and self._process is not None:
            password = self._pending_password
            self._pending_password = ""
            self._login_pending = False
            self._process.write((password + "\n").encode())
            return
        self._login_kind = kind
        self.login_required.emit(kind)

    @Slot(str)
    def submit_login(self, text: str) -> None:
        if self._process is None or not self._login_pending:
            return
        self._login_pending = False
        self._login_kind = ""
        self._process.write((text + "\n").encode())

    @Slot(str, str)
    def submit_account_login(self, account: str, password: str) -> None:
        account = account.strip()
        if not account or not NAME_PATTERN.match(account):
            self.error.emit("Invalid Steam account")
            return
        self._login_kind = ""
        self._settings.set_steam_account(account)
        self._pending_password = password
        request = self._pending_request
        self._pending_request = None
        if request is None:
            return
        kind, *rest = request
        if kind == "verify":
            self._verify(*rest)
        else:
            self._start(*rest)

    def _on_process_finished(self, code: int, status: QProcess.ExitStatus) -> None:
        proc = self.sender()
        if proc is not self._process:
            if isinstance(proc, QProcess):
                proc.deleteLater()
            return
        if self._proc_done:
            return
        self._proc_done = True
        self._process = None
        proc.deleteLater()
        if self._cancelled:
            self._finish(1)
            return
        if status == QProcess.ExitStatus.CrashExit:
            self.log_line.emit("DepotDownloader crashed")
            self._finish(1)
            return
        cmd = self._commands[self._index]
        if code != 0:
            if not cmd["optional"]:
                self.log_line.emit(f"{cmd['name']} depot download failed — exit code {code}")
                self._finish(code)
                return
            self.log_line.emit(f"{cmd['name']} depot failed — continuing without it")
        self._index += 1
        self._run_next()

    def _on_process_error(self, err: QProcess.ProcessError) -> None:
        proc = self.sender()
        if proc is not self._process or self._proc_done:
            return
        if err != QProcess.ProcessError.FailedToStart:
            return
        self._proc_done = True
        self._process = None
        proc.deleteLater()
        self.log_line.emit("DepotDownloader failed to start")
        self.error.emit("DepotDownloader failed to start")
        self._finish(1)

    def _start_apply(self) -> None:
        self._set_state("applying")
        username = get_setting(self._cfg, "username", DEFAULT_USERNAME)
        if self._verifying:
            username = installed_username(self._target) or username
        threading.Thread(
            target=self._apply,
            args=(self._generation, self._target, self._download, self._enable_hm, username,
                  self._verifying),
            daemon=True,
        ).start()

    def _apply(self, generation: int, target: Path, download: dict, is_hm: bool,
               username: str, verify: bool) -> None:
        reporter = SignalReporter(self.log_line.emit)
        try:
            ok = apply_install(target, download, is_hm, username,
                               include_launcher=not verify, reporter=reporter)
            if ok and verify and not is_hm and not (target / LAUNCHER_EXE).exists():
                write_launcher(target)
        except RateLimited:
            self.rate_limited.emit()
            self.log_line.emit("Install failed")
            ok = False
        except Exception as e:
            self.log_line.emit(f"Install failed — {e}")
            ok = False
        self._apply_done.emit(generation, ok)

    def _on_apply_done(self, generation: int, ok: bool) -> None:
        if generation != self._generation or self._cancelled:
            return
        if ok:
            if self._verifying:
                self.log_line.emit(f"{self._download['label']} verified")
            else:
                self.log_line.emit(f"{self._download['label']} installed to {self._target}")
            self._finish(0)
        else:
            self._finish(1)

    @Slot()
    def cancel(self) -> None:
        QTimer.singleShot(0, self._cancel)

    def _cancel(self) -> None:
        if not self._running:
            return
        if self._process is None or self._process.state() == QProcess.ProcessState.NotRunning:
            return
        self._cancelled = True
        self._process.kill()

    @Slot()
    def shutdown(self) -> None:
        self.cancel()
        proc = self._process
        if proc is not None and proc.state() != QProcess.ProcessState.NotRunning:
            proc.kill()
            proc.waitForFinished(2000)

    @Slot(result=str)
    def log_history(self) -> str:
        return "\n".join(self._history)

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {
            "state": self._state,
            "progress": self._progress,
            "running": self._running,
            "activeKey": self._active_key,
            "login": self._login_kind,
            "queue": self.queued_keys(),
        }

    @Slot(result="QVariantList")
    def proton_options(self) -> list:
        self._protons = list_protons()
        return [{"index": i, "display": p["display"]} for i, p in enumerate(self._protons)]

    @Slot(result=bool)
    def is_steam_running(self) -> bool:
        return steam_running()

    @Slot(str, int)
    def steam_setup(self, season_key: str, proton_index: int) -> None:
        QTimer.singleShot(0, lambda: self._steam_setup_begin(season_key, proton_index))

    def _steam_setup_begin(self, season_key: str, proton_index: int) -> None:
        download = next((d for d in self._downloads if d["key"] == season_key), None)
        variant = installed_variant(season_key)
        if download is None or variant is None or proton_index < 0 or proton_index >= len(self._protons):
            self.steam_setup_done.emit(False, "Could not update Steam files")
            return
        target, is_hm = variant
        proton = self._protons[proton_index]
        name = hm_display_name(download) if is_hm else download["label"]
        launcher = target / launcher_name(is_hm)
        if is_hm:
            icon = MEDIA_DIR / "hm_icon.png"
            logo = MEDIA_DIR / "hm_title.png"
            capsule = None
        else:
            icon = MEDIA_DIR / "tb_icon.png"
            logo = MEDIA_DIR / "tb_logo.png"
            capsule = MEDIA_DIR / "tb_library.png"
        hero = splash_path(season_key) or MEDIA_DIR / "tb_hero.png"
        self._steam_generation += 1
        threading.Thread(
            target=self._steam_setup,
            args=(self._steam_generation, name, launcher, target, proton, icon, logo, hero, capsule),
            daemon=True,
        ).start()

    def _steam_setup(self, generation: int, name: str, launcher: Path, target: Path, proton: dict,
                     icon: Path, logo: Path, hero: Path, capsule: Path | None) -> None:
        try:
            if steam_running():
                self._steam_done.emit(generation, False, "Close Steam completely to apply")
                return
            ok = apply_steam_setup(name, launcher, target, proton, icon=icon, logo=logo, hero=hero,
                                   capsule=capsule)
        except Exception:
            ok = False
        self._steam_done.emit(generation, ok, f"{name} was added to Steam" if ok else "Could not update Steam files")

    def _on_steam_done(self, generation: int, ok: bool, message: str) -> None:
        if generation != self._steam_generation:
            return
        self.steam_setup_done.emit(ok, message)

    def _finish(self, code: int) -> None:
        if self._process is not None:
            self._process.deleteLater()
            self._process = None
        self._login_pending = False
        self._login_kind = ""
        self._pending_password = ""
        self._pending_request = None
        self._buffer = ""
        if self._cancelled:
            self._set_state("idle")
            if self._active_key:
                self._active_key = ""
                self.active_key_changed.emit()
        elif code != 0:
            self._set_state("failed")
        else:
            self._set_state("verified" if self._verifying else "done")
        self._set_running(False)
        self.finished.emit(code)
        if self._queue:
            QTimer.singleShot(0, self._start_next)
