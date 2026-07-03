import contextlib
import os
import subprocess

from core.constants import IS_WINDOWS

from PySide6.QtCore import QObject, Slot

from core.manifest import installed_variant, launcher_name, partial_variant
from core.steam import find_existing_appid, shortcut_appids


class LaunchController(QObject):
    @Slot(str, result="QVariantMap")
    def status(self, key: str) -> dict:
        variant = installed_variant(key)
        if variant is None:
            partial = partial_variant(key)
            return {
                "installed": False,
                "hm": partial is not None and partial[1],
                "partial": partial is not None,
                "steamLinked": False,
            }
        folder, is_hm = variant
        linked = str(folder / launcher_name(is_hm)) in shortcut_appids()
        return {"installed": True, "hm": is_hm, "partial": False, "steamLinked": linked}

    @Slot(str)
    def launch(self, key: str) -> None:
        variant = installed_variant(key)
        if variant is None:
            return
        folder, is_hm = variant
        launcher = folder / launcher_name(is_hm)
        if IS_WINDOWS:
            os.startfile(str(launcher), cwd=str(folder))
            return
        appid = find_existing_appid(launcher)
        if appid is None:
            return
        rungameid = (appid << 32) | 0x02000000
        with contextlib.suppress(OSError):
            subprocess.Popen(
                ["xdg-open", f"steam://rungameid/{rungameid}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
