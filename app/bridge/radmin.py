import threading
from collections.abc import Callable
from pathlib import Path

from PySide6.QtCore import QObject, Signal, Slot
from PySide6.QtWidgets import QFileDialog

from core.bridge_runtime import ensure_bridge, ensure_wine
from core.depot import RateLimited
from core.radmin import Session, is_installed


class _Reporter:
    def __init__(self, log: Callable[[str], None], fail: Callable[[str], None]) -> None:
        self._log = log
        self._fail = fail

    def __enter__(self) -> "_Reporter":
        return self

    def __exit__(self, *exc: object) -> bool:
        return False

    def update(self, text: str) -> None:
        self._log(text)

    def succeed(self, text: str) -> None:
        self._log(text)

    def fail(self, text: str) -> None:
        self._log(text)
        self._fail(text)

    def progress(self, fraction: float) -> None:
        pass


class RadminController(QObject):
    state_changed = Signal("QVariantMap")
    error = Signal(str)
    log_line = Signal(str)
    _state_in = Signal("QVariantMap")
    _error_in = Signal(str)
    _log_in = Signal(str)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._session: Session | None = None
        self._thread: threading.Thread | None = None
        self._installer = ""
        self._busy = False
        self._state = self._make_state("idle")
        self._state_in.connect(self._store_and_emit)
        self._error_in.connect(self.error)
        self._log_in.connect(self.log_line)

    def _make_state(self, status: str, ip: str = "") -> dict:
        return {
            "status": status,
            "ip": ip,
            "installed": is_installed(),
            "hasInstaller": bool(self._installer),
            "busy": self._busy,
        }

    @Slot("QVariantMap")
    def _store_and_emit(self, state: dict) -> None:
        self._state = state
        self.state_changed.emit(state)

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return self._state

    @Slot()
    def select_installer(self) -> None:
        picked, _ = QFileDialog.getOpenFileName(
            None, "Choose the RadminVPN installer", "",
            "RadminVPN installer (Radmin_VPN_*.exe);;Executables (*.exe)",
        )
        if picked:
            self._installer = picked
            self._store_and_emit(self._make_state("idle"))

    @Slot()
    def start(self) -> None:
        if self._busy:
            return
        self._busy = True
        self._store_and_emit(self._make_state("connecting"))
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    @Slot()
    def stop(self) -> None:
        session = self._session
        if session is not None:
            session.stop()

    @Slot()
    def shutdown(self) -> None:
        self.stop()

    def _run(self) -> None:
        reporter = _Reporter(self._log_in.emit, self._error_in.emit)
        try:
            if ensure_wine(self._log_in.emit) is None:
                self._error_in.emit("Wine download failed")
                return
            if ensure_bridge(reporter) is None:
                return
            self._session = Session()
            installer = Path(self._installer) if self._installer else None
            self._session.run(installer, reporter, on_ready=self._on_ready)
        except RateLimited as e:
            self._error_in.emit(str(e))
        except Exception as e:
            self._error_in.emit(str(e))
        finally:
            self._session = None
            self._busy = False
            self._state_in.emit(self._make_state("idle"))

    def _on_ready(self, ip: str) -> None:
        self._state_in.emit(self._make_state("running", ip))
