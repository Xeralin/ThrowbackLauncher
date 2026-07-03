import sys
from pathlib import Path

from PySide6.QtCore import Property, QObject, QUrl, Slot
from PySide6.QtGui import QDesktopServices

from core import config
from core.constants import IS_WINDOWS, VERSION, default_library, libraries
from core.manifest import installed_downloads, resolve_install


class Platform(QObject):
    @Property(str, constant=True)
    def os(self) -> str:
        if IS_WINDOWS:
            return "windows"
        if sys.platform == "darwin":
            return "macos"
        return "linux"


class Info(QObject):
    def __init__(self, downloads: list[dict], parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloads = downloads

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        usage = 0.0
        for folder in installed_downloads():
            resolved = resolve_install(folder.name, self._downloads)
            if resolved is not None:
                usage += resolved[0].get("size_gb") or 0.0
        return {"diskUsageGb": round(usage, 1), "version": VERSION, "warning": config.warning}

    @Slot(str)
    def open_library(self, path: str) -> None:
        target = Path(path) if path else default_library()
        if target in libraries() and target.exists():
            QDesktopServices.openUrl(QUrl.fromLocalFile(str(target)))
