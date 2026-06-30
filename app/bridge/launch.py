import os
import subprocess
import sys

from PySide6.QtCore import QObject, Slot

from core.manifest import has_partial, installed_variant, launcher_name
from core.steam import find_existing_appid


class LaunchController(QObject):
    @Slot(str, result="QVariantMap")
    def status(self, key: str) -> dict:
        variant = installed_variant(key)
        if variant is None:
            return {"installed": False, "hm": False, "partial": has_partial(key)}
        return {"installed": True, "hm": variant[1], "partial": False}

    @Slot(str)
    def launch(self, key: str) -> None:
        variant = installed_variant(key)
        if variant is None:
            return
        folder, is_hm = variant
        launcher = folder / launcher_name(is_hm)
        if sys.platform.startswith("win"):
            os.startfile(str(launcher), cwd=str(folder))
            return
        appid = find_existing_appid(launcher)
        if appid is None:
            return
        rungameid = (appid << 32) | 0x02000000
        try:
            subprocess.Popen(
                ["xdg-open", f"steam://rungameid/{rungameid}"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except OSError:
            pass
