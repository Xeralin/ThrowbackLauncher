from PySide6.QtCore import QObject, Slot

from core.constants import TEXTURE_QUALITIES
from core.manifest import installed_variant
from core.shears import cut_download, scan_download
from core.steam import is_game_running

_KINDS = ("videos", "events", "textures")


def _empty() -> dict:
    return {"total": 0, "videos": 0, "events": 0, "tiers": []}


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
    @Slot(str, result="QVariantMap")
    def scan(self, key: str) -> dict:
        variant = installed_variant(key)
        if variant is None or variant[1]:
            return _empty()
        return _serialize(scan_download(variant[0]))

    @Slot(str, str, int, result="QVariantMap")
    def cut(self, key: str, kind: str, level: int) -> dict:
        if kind not in _KINDS:
            return {"ok": False, "message": "Invalid target", "freed": 0, "scan": _empty()}
        variant = installed_variant(key)
        if variant is None or variant[1]:
            return {"ok": False, "message": "Not available", "freed": 0, "scan": _empty()}
        if is_game_running():
            return {
                "ok": False,
                "message": "Close Rainbow Six Siege first",
                "freed": 0,
                "scan": _empty(),
            }
        path = variant[0]
        freed = cut_download(path, kind, level)
        return {"ok": True, "message": "", "freed": freed, "scan": _serialize(scan_download(path))}
