import os
import subprocess

_NOWINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
_BREAKAWAY = 0x01000000


def spawn_detached_bat(bat: str, env: dict | None = None) -> None:
    kw = {
        "cwd": os.environ.get("SYSTEMROOT", r"C:\Windows"),
        "close_fds": True,
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if env is not None:
        kw["env"] = env
    try:
        subprocess.Popen(["cmd", "/c", bat], creationflags=_NOWINDOW | _BREAKAWAY, **kw)
    except OSError:
        subprocess.Popen(["cmd", "/c", bat], creationflags=_NOWINDOW, **kw)
