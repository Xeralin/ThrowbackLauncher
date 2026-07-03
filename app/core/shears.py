from collections.abc import Iterator
from pathlib import Path

from core.constants import TEXTURE_QUALITIES, TEXTURE_RX, UPC_LOADERS


def _folder_size(path: Path) -> int:
    try:
        return sum(f.stat().st_size for f in path.rglob("*") if f.is_file())
    except OSError:
        return 0


def _texture_forges(path: Path) -> Iterator[tuple[Path, int, int]]:
    for f in path.iterdir():
        if f.suffix.lower() != ".forge":
            continue
        m = TEXTURE_RX.search(f.stem)
        if not m:
            continue
        level = int(m.group(1))
        if not 0 <= level < len(TEXTURE_QUALITIES):
            continue
        try:
            yield f, level, f.stat().st_size
        except OSError:
            continue


def _texture_tiers(path: Path) -> dict[int, int]:
    tiers: dict[int, int] = {}
    for _, level, size in _texture_forges(path):
        tiers[level] = tiers.get(level, 0) + size
    return tiers


def _video_files(path: Path) -> list[Path]:
    v = path / "videos"
    if not v.is_dir():
        return []
    try:
        return [f for f in v.iterdir() if f.is_file()]
    except OSError:
        return []


def _videos_size(path: Path) -> int:
    try:
        return sum(f.stat().st_size for f in _video_files(path))
    except OSError:
        return 0


def _event_files(path: Path) -> list[Path]:
    return [
        f for f in path.iterdir()
        if f.is_file()
        and f.suffix.lower() in (".forge", ".depgraphbin")
        and "events" in f.stem.lower()
    ]


def _events_size(path: Path) -> int:
    return sum(f.stat().st_size for f in _event_files(path))


def _delete_files(files: list[Path]) -> int:
    freed = 0
    for f in files:
        try:
            size = f.stat().st_size
            f.unlink()
        except OSError:
            continue
        freed += size
    return freed


def _uses_upc_loader(d: Path) -> bool:
    return any((d / dll).exists() for dll in UPC_LOADERS)


def scan_download(d: Path) -> dict:
    return {
        "total":  _folder_size(d),
        "tiers":  _texture_tiers(d),
        "videos": _videos_size(d),
        "events": 0 if _uses_upc_loader(d) else _events_size(d),
    }


def cut_download(d: Path, kind: str, level: int = 0) -> int:
    if kind == "videos":
        return _delete_files(_video_files(d))
    if kind == "events":
        return _delete_files(_event_files(d))
    return _delete_files([f for f, lvl, _ in _texture_forges(d) if lvl > level])
