import threading

from PySide6.QtCore import QObject, Signal, Slot

from core.constants import TEXTURE_QUALITIES
from core.manifest import installed_variant
from core.shears import cut_download, scan_download
from core.steam import is_game_running

_KINDS = ("videos", "events", "textures")


def _empty() -> dict:
    return {"total": 0, "videos": 0, "events": 0, "tiers": []}


def _fail(key: str, message: str) -> dict:
    return {"key": key, "ok": False, "message": message, "freed": 0, "scan": _empty()}


def _serialize(scan: dict) -> dict:
    return {
        "total": scan["total"],
        "videos": scan["videos"],
        "events": scan["events"],
        "tiers": [
            {"level": level, "quality": TEXTURE_QUALITIES[level], "size": size}
            for level, size in sorted(scan["tiers"].items())
        ],
    }


class Shears(QObject):
    scan_done = Signal("QVariantMap")
    cut_done = Signal("QVariantMap")
    _scan_in = Signal("QVariantMap")
    _cut_in = Signal("QVariantMap")

    def __init__(self, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._scan_in.connect(self.scan_done)
        self._cut_in.connect(self.cut_done)

    @Slot(str)
    def scan(self, key: str) -> None:
        threading.Thread(target=self._scan, args=(key,), daemon=True).start()

    def _scan(self, key: str) -> None:
        try:
            variant = installed_variant(key)
            if variant is None or variant[1]:
                self._scan_in.emit({"key": key, **_empty()})
                return
            self._scan_in.emit({"key": key, **_serialize(scan_download(variant[0]))})
        except Exception:
            self._scan_in.emit({"key": key, **_empty()})

    @Slot(str, str, int)
    def cut(self, key: str, kind: str, level: int) -> None:
        threading.Thread(target=self._cut, args=(key, kind, level), daemon=True).start()

    def _cut(self, key: str, kind: str, level: int) -> None:
        if kind not in _KINDS:
            self._cut_in.emit(_fail(key, "Invalid target"))
            return
        try:
            variant = installed_variant(key)
            if variant is None or variant[1]:
                self._cut_in.emit(_fail(key, "Not available"))
                return
            if is_game_running():
                self._cut_in.emit(_fail(key, "Close Rainbow Six Siege first"))
                return
            path = variant[0]
            freed = cut_download(path, kind, level)
            self._cut_in.emit({
                "key": key,
                "ok": True,
                "message": "",
                "freed": freed,
                "scan": _serialize(scan_download(path)),
            })
        except Exception as e:
            self._cut_in.emit(_fail(key, f"Shears failed — {e}"))
