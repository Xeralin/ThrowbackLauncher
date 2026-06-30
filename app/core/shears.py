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


def _videos_size(path: Path) -> int:
    v = path / "videos"
    if not v.is_dir():
        return 0
    try:
        return sum(f.stat().st_size for f in v.iterdir() if f.is_file())
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


def _delete_videos(path: Path) -> int:
    v = path / "videos"
    if not v.is_dir():
        return 0
    freed = 0
    for f in v.iterdir():
        if not f.is_file():
            continue
        try:
            size = f.stat().st_size
            f.unlink()
        except OSError:
            continue
        freed += size
    return freed


def _delete_events(path: Path) -> int:
    freed = 0
    for f in _event_files(path):
        try:
            size = f.stat().st_size
            f.unlink()
        except OSError:
            continue
        freed += size
    return freed


def _delete_textures_above(path: Path, keep_level: int) -> int:
    freed = 0
    for f, level, size in _texture_forges(path):
        if level > keep_level:
            try:
                f.unlink()
                freed += size
            except OSError:
                pass
    return freed


def _uses_upc_loader(d: Path) -> bool:
    return any((d / dll).exists() for dll in UPC_LOADERS)


def scan_download(d: Path) -> dict:
    upc = _uses_upc_loader(d)
    return {
        "total":  _folder_size(d),
        "tiers":  _texture_tiers(d),
        "videos": _videos_size(d),
        "events": 0 if upc else _events_size(d),
        "videos_applicable": (d / "videos").is_dir(),
        "events_applicable": not upc,
    }


def cut_download(d: Path, kind: str, level: int = 0) -> int:
    if kind == "videos":
        return _delete_videos(d)
    if kind == "events":
        return _delete_events(d)
    return _delete_textures_above(d, level)
