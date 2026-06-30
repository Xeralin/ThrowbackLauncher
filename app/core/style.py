import os
import sys

_STDOUT = sys.stdout
_TTY = bool(_STDOUT) and _STDOUT.isatty()
_COLOR = _TTY and not os.environ.get("NO_COLOR") and os.environ.get("TERM") != "dumb"


def _style(code: str) -> str:
    return code if _COLOR else ""


def _ctrl(code: str) -> str:
    return code if _TTY else ""


class C:
    R           = _style("\033[0m")
    YEL         = _style("\033[33m")
    MAG         = _style("\033[95m")
    ORN         = _style("\033[38;5;208m")
    HIDE_CURSOR = _ctrl("\033[?25l")
    SHOW_CURSOR = _ctrl("\033[?25h")
    CLEAR_LINE  = _ctrl("\033[K")


def _emit(line: str) -> None:
    if _STDOUT is not None:
        print(line)


def step_pass(text: str) -> None:
    _emit(f"   {C.MAG}✓{C.R} {text}")


def step_fail(text: str) -> None:
    _emit(f"   {C.ORN}✗{C.R} {text}")


def step_warn(text: str) -> None:
    _emit(f"   {C.YEL}⚠{C.R} {text}")


def mag(s: str) -> str:
    return f"{C.MAG}{s}{C.R}"
