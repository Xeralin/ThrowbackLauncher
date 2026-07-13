import contextlib
import ctypes
import os
import shutil
import sys
import time
from pathlib import Path

from core.constants import FROZEN, IS_WINDOWS, VERSION, version_tuple
from core.winspawn import spawn_detached

READY = ".ready"
_SYNCHRONIZE = 0x00100000
_WAIT_OBJECT_0 = 0
_ERROR_ALREADY_EXISTS = 183
_mutex = None


def _claim() -> bool:
    global _mutex
    if _mutex is not None:
        return True
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    handle = kernel32.CreateMutexW(None, True, "Local\\ThrowbackLauncher.update")
    if not handle:
        return False
    if ctypes.get_last_error() == _ERROR_ALREADY_EXISTS:
        kernel32.CloseHandle(handle)
        return False
    _mutex = handle
    return True


def _paths() -> tuple[Path, Path, Path]:
    here = Path(sys.executable).resolve().parent
    name = here.name.removesuffix(".update")
    install = here.with_name(name)
    return (
        install,
        install.with_name(install.name + ".update"),
        install.with_name(install.name + ".old"),
    )


def _wait_pid(pid: int, timeout_ms: int = 30_000) -> bool:
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(_SYNCHRONIZE, False, pid)
    if not handle:
        return True
    result = kernel32.WaitForSingleObject(handle, timeout_ms)
    kernel32.CloseHandle(handle)
    return result == _WAIT_OBJECT_0


def _move(src: Path, dst: Path, deadline: float) -> bool:
    while True:
        try:
            os.rename(src, dst)
            return True
        except FileNotFoundError:
            return True
        except OSError as e:
            if isinstance(e, FileExistsError):
                _remove(dst)
            if time.monotonic() > deadline:
                return False
            time.sleep(0.25)


def _remove(path: Path) -> None:
    with contextlib.suppress(OSError):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        else:
            path.unlink(missing_ok=True)


def _staged_version(staging: Path) -> str | None:
    ready = staging / READY
    if not staging.is_dir() or not ready.is_file():
        return None
    try:
        staged, *files = ready.read_text(encoding="ascii").splitlines()
        if version_tuple(staged) < version_tuple(VERSION):
            return None
    except (OSError, ValueError):
        return None
    if not all((staging / name).is_file() for name in files):
        return None
    return staged


def _carry_over(trash: Path, install: Path, deadline: float, carried: list[tuple[Path, Path]]) -> bool:
    for entry in trash.iterdir():
        if entry.name.lower() == "bin":
            new_bin = install / "bin"
            new_bin.mkdir(exist_ok=True)
            for cached in entry.iterdir():
                target = new_bin / cached.name
                if target.exists():
                    continue
                if not _move(cached, target, deadline):
                    return False
                carried.append((cached, target))
            continue
        target = install / entry.name
        if target.exists():
            continue
        if not _move(entry, target, deadline):
            return False
        carried.append((entry, target))
    return True


def _apply(timeout: float = 60.0) -> bool:
    install, staging, trash = _paths()
    if _staged_version(staging) is None:
        _remove(staging)
        _remove(trash)
        return False
    deadline = time.monotonic() + timeout
    entries = sorted(
        (p for p in staging.iterdir() if p.name != READY),
        key=lambda p: p.name == Path(sys.executable).name,
    )
    _remove(trash)
    if not _move(install, trash, deadline):
        return False
    placed: list[Path] = []
    carried: list[tuple[Path, Path]] = []
    ok = True
    try:
        install.mkdir()
        for entry in entries:
            if _move(entry, install / entry.name, deadline):
                placed.append(entry)
            else:
                ok = False
                break
        if ok:
            ok = _carry_over(trash, install, deadline, carried)
    except OSError:
        ok = False
    if not ok:
        rollback = time.monotonic() + 15
        for src, dst in reversed(carried):
            _move(dst, src, rollback)
        for entry in placed:
            _move(install / entry.name, entry, rollback)
        with contextlib.suppress(OSError):
            install.rmdir()
        _move(trash, install, rollback)
        return False
    (staging / READY).unlink(missing_ok=True)
    _remove(staging)
    _remove(trash)
    return True


def helper_argv(staging: Path) -> list[str]:
    exe = staging / Path(sys.executable).name
    return [str(exe), "--relaunch", str(os.getpid())]


def maybe_apply_staged() -> bool:
    if not (IS_WINDOWS and FROZEN):
        return False
    install, staging, trash = _paths()
    if _staged_version(staging) is None:
        _remove(staging)
        _remove(trash)
        return False
    helper = staging / Path(sys.executable).name
    if not helper.is_file():
        _remove(staging)
        return False
    try:
        spawn_detached(helper_argv(staging))
    except OSError:
        _remove(staging)
        return False
    return True


def run_relaunch(argv: list[str]) -> int:
    if not (IS_WINDOWS and FROZEN):
        return 0
    install, staging, trash = _paths()
    with contextlib.suppress(ValueError, IndexError):
        pid = int(argv[argv.index("--relaunch") + 1])
        if not _wait_pid(pid):
            return 0
    if not _claim():
        return 0
    try:
        applied = _apply()
    except OSError:
        applied = False
    if not applied:
        with contextlib.suppress(OSError):
            (staging / READY).unlink(missing_ok=True)
    with contextlib.suppress(OSError):
        spawn_detached([str(install / Path(sys.executable).name)])
    return 0
