import threading

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core.steam import uninstall, uninstall_item, uninstall_targets

BLOCKED_MESSAGE = "Verify is running — wait for it to finish"


class UninstallController(QObject):
    done = Signal(bool, str)
    item_done = Signal(str, bool, str)
    _done_in = Signal(bool, str)
    _item_done_in = Signal(str, bool, str)

    def __init__(self, downloader: QObject, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloader = downloader
        self._busy_key: str | None = None
        self._done_in.connect(self.done)
        self._item_done_in.connect(self.item_done)

    def busy_key(self) -> str | None:
        return self._busy_key

    def _blocked(self, key: str) -> bool:
        return bool(self._downloader.property("running")) and key == self._downloader.property(
            "active_key"
        )

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
        if self._busy_key is not None:
            return
        if self._blocked(key):
            self.done.emit(False, BLOCKED_MESSAGE)
            return
        self._busy_key = key

        def work() -> None:
            try:
                result = uninstall(key)
            except Exception as e:
                result = {"ok": False, "message": f"Uninstall failed — {e}"}
            self._busy_key = None
            self._done_in.emit(bool(result.get("ok")), str(result.get("message", "")))

        threading.Thread(target=work, daemon=True).start()

    @Slot(str, str)
    def run_item(self, key: str, item: str) -> None:
        QTimer.singleShot(0, lambda: self._dispatch_item(key, item))

    def _dispatch_item(self, key: str, item: str) -> None:
        if self._busy_key is not None:
            return
        if self._blocked(key):
            self.item_done.emit(item, False, BLOCKED_MESSAGE)
            return
        self._busy_key = key

        def work() -> None:
            try:
                result = uninstall_item(key, item)
            except Exception as e:
                result = {"ok": False, "message": f"Delete failed — {e}"}
            self._busy_key = None
            self._item_done_in.emit(item, bool(result.get("ok")), str(result.get("message", "")))

        threading.Thread(target=work, daemon=True).start()
