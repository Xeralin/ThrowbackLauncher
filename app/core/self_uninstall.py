import os
import subprocess
import sys
from pathlib import Path

APP_NAME = "Throwback Launcher"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\ThrowbackLauncher"


def run() -> None:
    if not sys.platform.startswith("win"):
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
    cleanup = (
        "ping 127.0.0.1 -n 3 >nul & "
        "taskkill /f /im throwback-launcher.exe >nul 2>&1 & "
        "taskkill /f /im Liberator.exe >nul 2>&1 & "
        "ping 127.0.0.1 -n 2 >nul & "
        f'rmdir /s /q "{install_dir}"'
    )
    subprocess.Popen(
        ["cmd", "/c", cleanup],
        cwd=os.environ.get("SystemRoot", r"C:\Windows"),
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        close_fds=True,
    )
