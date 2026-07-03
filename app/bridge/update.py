import os
import subprocess
import threading

from core.constants import IS_WINDOWS

from PySide6.QtCore import Property, QCoreApplication, QObject, QTimer, Signal, Slot

from bridge.reporter import SignalReporter
from core import update as update_backend


class UpdateController(QObject):
    changed = Signal()
    log_line = Signal(str)
    finished = Signal(bool, str)
    _restart_in = Signal()

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._busy = False
        self._checking = False
        self._pending: list = []
        self._components: list[dict] = []
        self._check_error = ""
        self._restart_in.connect(self._schedule_restart)

    @Property(bool, notify=changed)
    def busy(self) -> bool:
        return self._busy

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {
            "busy": self._busy,
            "checking": self._checking,
            "components": self._components,
            "checkError": self._check_error,
        }

    @Slot(bool)
    def check(self, force: bool = False) -> None:
        if self._busy or self._checking:
            return
        self._checking = True
        self.changed.emit()
        threading.Thread(target=lambda: self._check(force), daemon=True).start()

    def _check(self, force: bool = False) -> None:
        try:
            pending, error = update_backend.available(force)
        except Exception:
            pending, error = [], "error"
        self._pending = pending
        self._check_error = error
        self._components = [
            {
                "name": c.name,
                "current": c.current_value or "—",
                "target": c.target or "—",
                "notes": c.notes_value,
            }
            for c in pending
        ]
        self._checking = False
        self.changed.emit()

    @Slot(int)
    def apply(self, index: int) -> None:
        if self._busy or self._checking or not 0 <= index < len(self._pending):
            return
        component = self._pending[index]
        self._busy = True
        self.changed.emit()
        threading.Thread(target=lambda: self._apply(component), daemon=True).start()

    def _apply(self, component) -> None:
        ok = False
        try:
            ok = bool(component.apply(reporter=SignalReporter(self.log_line.emit)))
        except Exception as exc:
            self.log_line.emit(str(exc))
        if ok and component.restart:
            self.finished.emit(ok, component.name)
            self._restart_in.emit()
            return
        self._checking = True
        self._busy = False
        self.changed.emit()
        self.finished.emit(ok, component.name)
        self._check()

    def _schedule_restart(self) -> None:
        QTimer.singleShot(800, self._restart)

    def _restart(self) -> None:
        if not IS_WINDOWS:
            appimage = os.environ.get("APPIMAGE", "")
            if appimage:
                subprocess.Popen(
                    [appimage],
                    start_new_session=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
        QCoreApplication.quit()
