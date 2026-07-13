import os
import threading
from pathlib import Path

from PySide6.QtCore import Property, QObject, QUrl, Signal, Slot
from PySide6.QtGui import QDesktopServices

from core import config
from core.constants import IS_WINDOWS, VERSION, default_library, libraries
from core.manifest import local_downloads


class Platform(QObject):
    @Property(str, constant=True)
    def os(self) -> str:
        return "windows" if IS_WINDOWS else "linux"


def _folder_bytes(path: Path) -> int:
    total = 0
    for root, _dirs, files in os.walk(path):
        for name in files:
            try:
                total += (Path(root) / name).lstat().st_size
            except OSError:
                pass
    return total


class Info(QObject):
    disk_usage_changed = Signal(float)

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        return {"version": VERSION, "warning": config.warning}

    @Slot()
    def refresh_disk_usage(self) -> None:
        threading.Thread(target=self._emit_disk_usage, daemon=True).start()

    def _emit_disk_usage(self) -> None:
        total = sum(_folder_bytes(folder) for folder in local_downloads())
        self.disk_usage_changed.emit(round(total / 2**30, 1))

    @Slot(str)
    def open_library(self, path: str) -> None:
        target = Path(path) if path else default_library()
        if target in libraries() and target.exists():
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))
