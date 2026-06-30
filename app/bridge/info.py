import shutil

from PySide6.QtCore import QObject, Slot

from core.constants import DOWNLOADS_DIR, VERSION
from core.manifest import installed_downloads, resolve_install


class Info(QObject):
    def __init__(self, downloads: list[dict], parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloads = downloads

    @Slot(result="QVariantMap")
    def snapshot(self) -> dict:
        downloads = self._downloads
        installs = installed_downloads()
        usage = 0.0
        for folder in installs:
            resolved = resolve_install(folder.name, downloads)
            if resolved is not None:
                usage += resolved[0].get("size_gb") or 0.0
        target = DOWNLOADS_DIR if DOWNLOADS_DIR.exists() else DOWNLOADS_DIR.parent
        try:
            free = shutil.disk_usage(target).free / 1_000_000_000
        except OSError:
            free = 0.0
        return {
            "version": VERSION,
            "downloads": len(installs),
            "diskUsageGb": round(usage, 1),
            "freeSpaceGb": round(free, 1),
        }
