import os
import sys
import tempfile
from pathlib import Path

from core.constants import FROZEN, IS_WINDOWS
from core.winspawn import spawn_detached_bat

APP_NAME = "Throwback Launcher"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\ThrowbackLauncher"


def run() -> None:
    if not IS_WINDOWS or not FROZEN:
        return
    import winreg

    install_dir = Path(sys.executable).resolve().parent
    shortcut = (
        Path(os.environ.get("APPDATA", ""))
        / "Microsoft" / "Windows" / "Start Menu" / "Programs" / f"{APP_NAME}.lnk"
    )
    try:
        shortcut.unlink(missing_ok=True)
    except OSError:
        pass
    try:
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
    except OSError:
        pass

    bat = Path(tempfile.gettempdir()) / "ThrowbackLauncher-uninstall.bat"
    script = (
        "@echo off\r\n"
        "ping 127.0.0.1 -n 3 >nul\r\n"
        "taskkill /f /im throwback-launcher.exe >nul 2>&1\r\n"
        "taskkill /f /im Liberator.exe >nul 2>&1\r\n"
        "ping 127.0.0.1 -n 2 >nul\r\n"
        f'rmdir /s /q "{install_dir}" >nul 2>&1\r\n'
        'del "%~f0"\r\n'
    )
    try:
        bat.write_text(script, encoding="oem")
    except (OSError, LookupError, UnicodeError):
        return
    spawn_detached_bat(str(bat))
