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
_ERROR_ALREADY_EXISTS = 183
_mutex = None


def _claim() -> bool:
    global _mutex
    if _mutex is not None:
        return True
    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
    handle = kernel32.CreateMutexW(None, True, "Local\\ThrowbackLauncher-update")
    if not handle:
        return False
    if ctypes.get_last_error() == _ERROR_ALREADY_EXISTS:
        kernel32.CloseHandle(handle)
        return False
    _mutex = handle
    return True


def _paths() -> tuple[Path, Path, Path]:
    install = Path(sys.executable).resolve().parent
    return (
        install,
        install.with_name(install.name + ".new"),
        install.with_name(install.name + ".old"),
    )


def _wait_pid(pid: int, timeout_ms: int = 30_000) -> None:
    kernel32 = ctypes.windll.kernel32
    handle = kernel32.OpenProcess(_SYNCHRONIZE, False, pid)
    if not handle:
        return
    kernel32.WaitForSingleObject(handle, timeout_ms)
    kernel32.CloseHandle(handle)


def _remove(path: Path) -> None:
    with contextlib.suppress(OSError):
        if path.is_dir():
            shutil.rmtree(path, ignore_errors=True)
        else:
            path.unlink(missing_ok=True)


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


def _merge_bin(src: Path, install: Path, deadline: float) -> bool:
    ok = True
    for root, _dirs, files in os.walk(src):
        rel = Path(root).relative_to(src)
        dst_dir = install / "bin" / rel
        dst_dir.mkdir(parents=True, exist_ok=True)
        for name in files:
            while True:
                try:
                    os.replace(Path(root) / name, dst_dir / name)
                    break
                except FileNotFoundError:
                    break
                except OSError:
                    if time.monotonic() > deadline:
                        ok = False
                        break
                    time.sleep(0.25)
    if ok:
        shutil.rmtree(src, ignore_errors=True)
    return ok


def _apply(timeout: float = 30.0) -> bool:
    install, staging, trash = _paths()
    ready = staging / READY
    if not staging.is_dir():
        shutil.rmtree(trash, ignore_errors=True)
        return False
    if not _claim():
        return False
    if not ready.is_file():
        shutil.rmtree(staging, ignore_errors=True)
        return False
    staged = ready.read_text(encoding="ascii").strip()
    try:
        stale = version_tuple(staged) < version_tuple(VERSION)
    except ValueError:
        stale = False
    if stale:
        shutil.rmtree(staging, ignore_errors=True)
        return False
    deadline = time.monotonic() + timeout
    shutil.rmtree(trash, ignore_errors=True)
    trash.mkdir(exist_ok=True)
    entries = [p.name for p in staging.iterdir() if p.name != READY and p.name.lower() != "bin"]
    asided: list[str] = []
    for name in entries:
        if not (install / name).exists():
            continue
        if _move(install / name, trash / name, deadline):
            asided.append(name)
        else:
            rollback = time.monotonic() + 10
            for done in asided:
                _move(trash / done, install / done, rollback)
            shutil.rmtree(trash, ignore_errors=True)
            return False
    placed: list[str] = []
    ok = True
    for name in entries:
        if _move(staging / name, install / name, deadline):
            placed.append(name)
        else:
            ok = False
            break
    if not ok:
        rollback = time.monotonic() + 10
        for name in placed:
            _move(install / name, staging / name, rollback)
        for name in asided:
            _move(trash / name, install / name, rollback)
        shutil.rmtree(trash, ignore_errors=True)
        return False
    if (staging / "bin").is_dir():
        ok = _merge_bin(staging / "bin", install, deadline)
    if ok:
        ready.unlink(missing_ok=True)
        shutil.rmtree(staging, ignore_errors=True)
    shutil.rmtree(trash, ignore_errors=True)
    return ok


def maybe_apply_staged() -> bool:
    if not (IS_WINDOWS and FROZEN) or not _apply(timeout=10.0):
        return False
    spawn_detached([sys.executable])
    return True


def run_relaunch(argv: list[str]) -> int:
    if IS_WINDOWS and FROZEN:
        with contextlib.suppress(ValueError, IndexError):
            pid = int(argv[argv.index("--relaunch") + 1])
            _wait_pid(pid)
        _apply()
        spawn_detached([sys.executable])
    return 0
