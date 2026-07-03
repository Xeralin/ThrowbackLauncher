import threading

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core.steam import uninstall, uninstall_targets


class UninstallController(QObject):
    finished = Signal(bool, str)

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._busy = False

    @Slot(str, result="QVariantMap")
    def preview(self, key: str) -> dict:
        targets = uninstall_targets(key)
        if targets is None:
            return {"folder": "", "prefix": "", "shortcut": False}
        return targets

    @Slot(str)
    def run(self, key: str) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(key))

    def _dispatch(self, key: str) -> None:
        if self._busy:
            return
        self._busy = True

        def work() -> None:
            try:
                result = uninstall(key)
            except Exception as e:
                result = {"ok": False, "message": f"Uninstall failed — {e}"}
            self._busy = False
            self.finished.emit(bool(result.get("ok")), str(result.get("message", "")))

        threading.Thread(target=work, daemon=True).start()
