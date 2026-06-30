from pathlib import Path

from PySide6.QtCore import Property, QObject, Slot

from core.constants import HM_KEY, WEB_OUT_DIR
from core.manifest import (
    installed_downloads,
    launcher_name,
    local_downloads,
    resolve_install,
)
from core.steam import find_existing_appid


def _splash_url(key: str) -> str | None:
    if (WEB_OUT_DIR / "splash-display" / f"{key}.webp").exists():
        return f"/splash-display/{key}.webp"
    return None


def _season_entry(download: dict) -> dict:
    label = download["label"]
    code, _, name = label.partition(" ")
    return {
        "key": download["key"],
        "code": code,
        "name": name or label,
        "label": label,
        "sizeGb": download.get("size_gb"),
        "liberator": bool(download.get("liberator", False)),
        "heatedMetal": HM_KEY in download,
        "hm": False,
        "partial": False,
        "steamLinked": False,
        "splash": _splash_url(download["key"]),
    }


class Library(QObject):
    def __init__(self, downloads: list[dict], parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._downloads = downloads

    @Property("QVariantList", constant=True)
    def seasons(self) -> list:
        return [
            _season_entry(d)
            for d in self._downloads
            if d.get("label") and "manifest_main" in d
        ]

    @Slot(result="QVariantList")
    def home(self) -> list:
        entries: dict[str, dict] = {}
        installed_names: set[str] = set()
        for folder in installed_downloads():
            installed_names.add(folder.name)
            self._merge(entries, folder, partial=False)
        for folder in local_downloads():
            if folder.name not in installed_names:
                self._merge(entries, folder, partial=True)
        return list(entries.values())

    def _merge(self, entries: dict, folder: Path, partial: bool) -> None:
        resolved = resolve_install(folder.name, self._downloads)
        if resolved is None:
            return
        download, is_hm = resolved
        entry = entries.setdefault(download["key"], {**_season_entry(download), "partial": partial})
        if is_hm:
            entry["hm"] = True
        if not partial and find_existing_appid(folder / launcher_name(is_hm)) is not None:
            entry["steamLinked"] = True
