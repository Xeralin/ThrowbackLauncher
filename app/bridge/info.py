import sys

from PySide6.QtCore import Property, QObject, QUrl, Slot
from PySide6.QtGui import QDesktopServices

from core.constants import DOWNLOADS_DIR, IS_WINDOWS, VERSION
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
        return {"diskUsageGb": round(usage, 1), "version": VERSION}

    @Slot()
    def open_downloads(self) -> None:
        DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(DOWNLOADS_DIR)))
