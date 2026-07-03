import os
import subprocess

_NOWINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)
_BREAKAWAY = 0x01000000


def spawn_detached(argv: list[str]) -> None:
    kw = {
        "cwd": os.environ.get("SYSTEMROOT", r"C:\Windows"),
        "close_fds": True,
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    try:
        subprocess.Popen(argv, creationflags=_NOWINDOW | _BREAKAWAY, **kw)
    except OSError:
        subprocess.Popen(argv, creationflags=_NOWINDOW, **kw)
