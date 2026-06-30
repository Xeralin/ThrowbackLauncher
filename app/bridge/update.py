import threading

from PySide6.QtCore import Property, QObject, Signal, Slot

from bridge.reporter import SignalReporter
from core import update as update_backend


class UpdateController(QObject):
    changed = Signal()
    log_line = Signal(str)
    finished = Signal(bool, str)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._busy = False
        self._checking = False
        self._pending: list = []
        self._components: list[dict] = []

    @Property(bool, notify=changed)
    def busy(self) -> bool:
        return self._busy

    @Property(bool, notify=changed)
    def checking(self) -> bool:
        return self._checking

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {
            "busy": self._busy,
            "checking": self._checking,
            "components": self._components,
        }

    @Slot()
    def check(self) -> None:
        if self._busy or self._checking:
            return
        self._checking = True
        self.changed.emit()
        threading.Thread(target=self._check, daemon=True).start()

    def _check(self) -> None:
        try:
            pending = [c for c in update_backend.available() if not c.restart]
        except Exception:
            pending = []
        self._pending = pending
        self._components = [
            {"name": c.name, "current": c.current() or "—", "target": c.target or "—"}
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
        self.finished.emit(ok, component.name)
        self._busy = False
        self._check()
