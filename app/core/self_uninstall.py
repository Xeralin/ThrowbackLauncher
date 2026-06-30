import os
import subprocess
import sys
import tempfile
import time
from pathlib import Path

APP_NAME = "Throwback Launcher"
UNINSTALL_KEY = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\ThrowbackLauncher"
LOG_FILE = Path(os.environ.get("TEMP") or os.environ.get("TMP") or ".") / "ThrowbackLauncher-uninstall.log"

_NOWINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
_BREAKAWAY = 0x01000000


def _log(message: str) -> None:
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%H:%M:%S')} {message}\n")
    except OSError:
        pass


def run() -> None:
    if not sys.platform.startswith("win") or not (getattr(sys, "frozen", False) or "__compiled__" in globals()):
        return
    import winreg

    install_dir = Path(sys.executable).resolve().parent
    _log(f"uninstall start; install_dir={install_dir}")
    shortcut = (
        Path(os.environ.get("APPDATA", ""))
        / "Microsoft" / "Windows" / "Start Menu" / "Programs" / f"{APP_NAME}.lnk"
    )
    try:
        shortcut.unlink(missing_ok=True)
        _log("shortcut removed")
    except OSError as e:
        _log(f"shortcut FAILED {e!r}")
    try:
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, UNINSTALL_KEY)
        _log("regkey removed")
    except OSError as e:
        _log(f"regkey FAILED {e!r}")

    bat = Path(tempfile.gettempdir()) / "ThrowbackLauncher-uninstall.bat"
    script = (
        "@echo off\r\n"
        f'echo CMD START>>"{LOG_FILE}"\r\n'
        "ping 127.0.0.1 -n 3 >nul\r\n"
        "taskkill /f /im throwback-launcher.exe >nul 2>&1\r\n"
        "taskkill /f /im Liberator.exe >nul 2>&1\r\n"
        "ping 127.0.0.1 -n 2 >nul\r\n"
        f'rmdir /s /q "{install_dir}">>"{LOG_FILE}" 2>&1\r\n'
        f'if exist "{install_dir}" (echo CMD RESULT STILL_EXISTS>>"{LOG_FILE}") else (echo CMD RESULT GONE>>"{LOG_FILE}")\r\n'
        'del "%~f0"\r\n'
    )
    try:
        bat.write_text(script, encoding="mbcs")
    except (OSError, LookupError, UnicodeError) as e:
        _log(f"bat write FAILED {e!r}")
        return

    kw = {
        "cwd": os.environ.get("SystemRoot", r"C:\Windows"),
        "close_fds": True,
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    try:
        subprocess.Popen(["cmd", "/c", str(bat)], creationflags=_NOWINDOW | _BREAKAWAY, **kw)
        _log("cleanup spawned (nowindow+breakaway)")
    except OSError as e:
        _log(f"breakaway spawn failed {e!r}; retry nowindow")
        try:
            subprocess.Popen(["cmd", "/c", str(bat)], creationflags=_NOWINDOW, **kw)
            _log("cleanup spawned (nowindow)")
        except OSError as e2:
            _log(f"cleanup spawn FAILED {e2!r}")
