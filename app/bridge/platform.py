import sys

from PySide6.QtCore import Property, QObject


class Platform(QObject):
    @Property(str, constant=True)
    def os(self) -> str:
        if sys.platform.startswith("win"):
            return "windows"
        if sys.platform == "darwin":
            return "macos"
        return "linux"
