import json
import os
import shutil
import subprocess
import tarfile
import zipfile
from collections.abc import Callable
from pathlib import Path

from core.constants import (
    IS_WINDOWS,
    BIN_DIR,
    HELIOS_DIR,
    HELIOS_FILES,
    HELIOS_JSON,
    HM_API_URL,
    HM_BIN_DIR,
    HM_MOD_DIR,
    HM_RELEASE_URL_FMT,
    JVAV_HELIOS_URL,
    SEVENZ_API_URL,
    SEVENZ_ASSET,
    SEVENZ_BIN,
)
from core.depot import fetch_to, github_asset
from core.spinner import LazySpinner, Reporter

_last_error: str = ""
_release_cache: dict[str, tuple[str, str]] = {}


def _set_error(detail: str) -> None:
    global _last_error
    _last_error = detail


def _fail_message(fail_text: str) -> str:
    return f"{fail_text} — {_last_error}" if _last_error else fail_text


def _default_args(mod_dir: Path) -> Path | None:
    for name in ("DefaultArgs.dll", "defaultargs.dll"):
        candidate = mod_dir / name
        if candidate.exists():
            return candidate
    return None


def ensure_7zz(update: Callable[[str], None], force: bool = False) -> Path | None:
    if SEVENZ_BIN.exists() and not force:
        return SEVENZ_BIN

    update("Fetching 7zz")
    BIN_DIR.mkdir(parents=True, exist_ok=True)
    try:
        _, asset_url = github_asset(SEVENZ_API_URL, SEVENZ_ASSET)
        if IS_WINDOWS:
            fetch_to(asset_url, SEVENZ_BIN)
            return SEVENZ_BIN
        tarxz_path = BIN_DIR / "_7zz.tar.xz"
        tmp_dir = BIN_DIR / ".7zz.tmp"
        try:
            fetch_to(asset_url, tarxz_path)
            with tarfile.open(tarxz_path) as t:
                t.extract("7zz", tmp_dir, filter="data")
            tmp_bin = tmp_dir / "7zz"
            tmp_bin.chmod(tmp_bin.stat().st_mode | 0o111)
            os.replace(tmp_bin, SEVENZ_BIN)
            return SEVENZ_BIN
        finally:
            tarxz_path.unlink(missing_ok=True)
            shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception as e:
        _set_error(f"7zz download failed: {e}")
        return None


def ensure_helios(update: Callable[[str], None]) -> bool:
    if all((HELIOS_DIR / f).exists() for f in HELIOS_FILES):
        return True

    update("Fetching HeliosLoader")
    tmp_dir = HELIOS_DIR.with_name(HELIOS_DIR.name + ".tmp")
    zip_path = HM_BIN_DIR / "_helios.zip"
    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir.mkdir(parents=True)
        fetch_to(JVAV_HELIOS_URL, zip_path)
        with zipfile.ZipFile(zip_path) as z:
            for name in HELIOS_FILES:
                with z.open(f"HeliosLoader/{name}") as f:
                    (tmp_dir / name).write_bytes(f.read())
        if HELIOS_DIR.exists():
            shutil.rmtree(HELIOS_DIR)
        os.replace(tmp_dir, HELIOS_DIR)
        return True
    except Exception as e:
        _set_error(f"HeliosLoader download failed: {e}")
        return False
    finally:
        zip_path.unlink(missing_ok=True)
        shutil.rmtree(tmp_dir, ignore_errors=True)


def resolve_hm_release(hm_version: str) -> tuple[str, str] | None:
    if hm_version != "latest":
        return hm_version, HM_RELEASE_URL_FMT.format(tag=hm_version)
    cached = _release_cache.get(HM_API_URL)
    if cached is not None:
        return cached
    try:
        resolved = github_asset(HM_API_URL, ".7z")
    except Exception as e:
        _set_error(f"Heated Metal release lookup failed: {e}")
        return None
    _release_cache[HM_API_URL] = resolved
    return resolved


def _sevenz_error(rc: subprocess.CompletedProcess) -> str:
    stderr_line = next(
        (line.strip() for line in rc.stderr.decode(errors="replace").splitlines() if line.strip()),
        "",
    )
    detail = f"7z exited with code {rc.returncode}"
    return f"{detail}: {stderr_line}" if stderr_line else detail


def ensure_hm_mod(hm_version: str, update: Callable[[str], None]) -> Path | None:
    if hm_version == "latest":
        update("Looking up Heated Metal release")
    resolved = resolve_hm_release(hm_version)
    if resolved is None:
        return None
    tag, asset_url = resolved

    mod_dir = HM_MOD_DIR / tag
    if _default_args(mod_dir):
        return mod_dir

    sevenz = ensure_7zz(update)
    if sevenz is None:
        return None

    update(f"Fetching Heated Metal {tag}")
    tmp_dir = HM_MOD_DIR / f".{tag}.tmp"
    archive_path = tmp_dir / "_heatedmetal.7z"
    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
        tmp_dir.mkdir(parents=True)
        fetch_to(asset_url, archive_path)
        rc = subprocess.run(
            [str(sevenz), "x", "-y", f"-o{tmp_dir}", str(archive_path)],
            capture_output=True, check=False,
            creationflags=subprocess.CREATE_NO_WINDOW if IS_WINDOWS else 0,
        )
        if rc.returncode != 0:
            _set_error(_sevenz_error(rc))
            return None
        archive_path.unlink()
        if _default_args(tmp_dir) is None:
            _set_error(f"DefaultArgs.dll missing in Heated Metal {tag} archive")
            return None
        if mod_dir.exists():
            shutil.rmtree(mod_dir)
        os.replace(tmp_dir, mod_dir)
        return mod_dir
    except Exception as e:
        _set_error(f"Heated Metal download failed: {e}")
        return None
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


_PF_SSE4_2_INSTRUCTIONS_AVAILABLE = 38
_PF_AVX_INSTRUCTIONS_AVAILABLE = 39


def _detect_cpu_variant() -> str:
    if IS_WINDOWS:
        import ctypes

        present = ctypes.windll.kernel32.IsProcessorFeaturePresent
        if present(_PF_AVX_INSTRUCTIONS_AVAILABLE):
            return "AVX"
        if present(_PF_SSE4_2_INSTRUCTIONS_AVAILABLE):
            return "SSE"
        return ""
    try:
        for line in Path("/proc/cpuinfo").read_text().splitlines():
            if line.startswith("flags"):
                tokens = line.split()
                if "avx" in tokens:
                    return "AVX"
                if "sse4_2" in tokens:
                    return "SSE"
                break
    except OSError:
        pass
    return ""


def _install_helios(target_dir: Path, username: str) -> None:
    for name in HELIOS_FILES:
        if name == HELIOS_JSON:
            continue
        shutil.copy2(HELIOS_DIR / name, target_dir / name)

    config = json.loads((HELIOS_DIR / HELIOS_JSON).read_text())
    config["Username"] = username
    (target_dir / HELIOS_JSON).write_text(json.dumps(config, indent=2))


def apply_hm(target_dir: Path, username: str, hm_version: str | None,
             reporter: Reporter | None = None) -> bool:
    fail_text = "Heated Metal setup failed"
    _set_error("")
    with (reporter or LazySpinner()) as sp:
        if not ensure_helios(sp.update):
            sp.fail(_fail_message(fail_text))
            return False

        if hm_version is None:
            sp.update("Copying files")
            _install_helios(target_dir, username)
            sp.succeed("HeliosLoader applied")
            return True

        mod_dir = ensure_hm_mod(hm_version, sp.update)
        if mod_dir is None:
            sp.fail(_fail_message(fail_text))
            return False

        sp.update("Copying files")
        _install_helios(target_dir, username)

        for variant in ("DefaultArgs.dll", "defaultargs.dll"):
            (target_dir / variant).unlink(missing_ok=True)
        target_hm = target_dir / "HeatedMetal"
        if target_hm.exists():
            shutil.rmtree(target_hm)

        src = _default_args(mod_dir)
        shutil.copy2(src, target_dir / "defaultargs.dll")

        shutil.copytree(mod_dir / "HeatedMetal", target_hm)

        variant = _detect_cpu_variant()
        if variant:
            variant_dll = target_hm / f"HeatedMetal{variant}.dll"
            if variant_dll.exists():
                shutil.copy2(variant_dll, target_hm / "HeatedMetal.dll")

        (target_hm / ".version").write_text(mod_dir.name)

        notices = mod_dir / "ThirdPartyLegalNotices.txt"
        if notices.exists():
            shutil.copy2(notices, target_dir / "ThirdPartyLegalNotices.txt")

        sp.succeed("Heated Metal applied")
        return True
