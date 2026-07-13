import getpass
import hashlib
import os
import re
import shutil
import stat
import subprocess
import threading
import time
from collections.abc import Callable
from pathlib import Path

from core.constants import (
    RADMIN_BIN_DIR,
    RADMIN_MAC_FILE,
    RADMIN_PREFIX,
    RADMIN_STATE_DIR,
    RADMIN_TAP_DEV,
    WINE_BIN,
    WINE_DIR,
)
from core.reporter import NullReporter, Reporter

_TAP = RADMIN_TAP_DEV
_RADMIN_APP = RADMIN_PREFIX / "drive_c" / "Program Files (x86)" / "Radmin VPN"
_SERVICE_LOG = RADMIN_PREFIX / "drive_c" / "ProgramData" / "Famatech" / "Radmin VPN" / "service.log"
_SYS32 = RADMIN_PREFIX / "drive_c" / "windows" / "system32"
_SYSWOW = RADMIN_PREFIX / "drive_c" / "windows" / "syswow64"
_DRIVERS = _SYS32 / "drivers"

_CMD_FILE = "/tmp/radmin_netsh_cmd"
_MAC_RAW = "/tmp/rvpn_mac"
_FIFO_B2D = "/tmp/rvpn_b2d"
_FIFO_D2B_LOW = "/tmp/rvpn_d2b_low"
_FIFOS = (_FIFO_B2D, "/tmp/rvpn_d2b", "/tmp/rvpn_d2b_high", _FIFO_D2B_LOW)

_VPN_IP = re.compile(r"^26\.\d+\.\d+\.\d+$")
_VPN_IP_SCAN = re.compile(r"26\.\d+\.\d+\.\d+")
_SERVICE_14 = re.compile(r"Service version: *1\.4")
_WINE_VER = re.compile(r"^wine-(\d+)")
_MAC_RE = re.compile(r"^([0-9a-fA-F]{2}:){5}[0-9a-fA-F]{2}$")
_USER_RE = re.compile(r"^[A-Za-z0-9_.-]+$")
_NETSH_ADDR = re.compile(r"ip addr add (\d+\.\d+\.\d+\.\d+)/(\d+)")

_NET_CLASS = r"{4d36e972-e325-11ce-bfc1-08002be10318}"
_CLASS_KEY = rf"HKLM\SYSTEM\CurrentControlSet\Control\Class\{_NET_CLASS}\0099"
_NETWORK_KEY = rf"HKLM\SYSTEM\CurrentControlSet\Control\Network\{_NET_CLASS}"
_SERVICE_KEY = r"HKLM\SYSTEM\CurrentControlSet\Services\rvpnnetmp"
_NDIS_KEY = r"HKLM\SYSTEM\CurrentControlSet\Services\RvNetMP60"
_MEMORY_KEY = r"HKLM\System\CurrentControlSet\Control\Session Manager\Memory Management"


def _wine_env() -> dict[str, str]:
    env = dict(os.environ)
    env["WINEPREFIX"] = str(RADMIN_PREFIX)
    env["WINEDEBUG"] = "-all"
    env["MALLOC_ARENA_MAX"] = "2"
    if WINE_BIN.exists():
        env["PATH"] = str(WINE_DIR / "bin") + os.pathsep + env.get("PATH", "")
        env["WINELOADER"] = str(WINE_BIN)
        env["WINESERVER"] = str(WINE_DIR / "bin" / "wineserver")
    return env


def _pkexec(script: str) -> str | None:
    try:
        out = subprocess.run(["pkexec", "sh", "-c", script],
                             capture_output=True, text=True, check=False)
    except FileNotFoundError:
        return "pkexec not found"
    if out.returncode != 0:
        err = (out.stderr or out.stdout).strip().splitlines()
        return err[-1] if err else f"exit code {out.returncode}"
    return None


def _rm(path: str | Path) -> None:
    try:
        Path(path).unlink()
    except OSError:
        pass


def _terminate(proc: subprocess.Popen | None) -> None:
    if proc is not None and proc.poll() is None:
        try:
            proc.terminate()
        except OSError:
            pass


def _is_fifo(path: str) -> bool:
    try:
        return stat.S_ISFIFO(os.stat(path).st_mode)
    except OSError:
        return False


def _read_utf16(path: Path) -> str:
    try:
        return path.read_bytes().decode("utf-16-le", errors="ignore")
    except OSError:
        return ""


def _extract_ip(text: str) -> str | None:
    lines = text.strip().split("\n")
    if not any("adapter ready" in line for line in lines):
        return None
    for line in reversed(lines):
        if "Registered as" in line or ("IP:" in line and "0.0.0.0" not in line):
            match = _VPN_IP_SCAN.search(line)
            if match:
                return match.group()
    return None


def is_installed() -> bool:
    return (_RADMIN_APP / "RvControlSvc.exe").exists()


class Session:
    def __init__(self) -> None:
        self._cancel = threading.Event()
        self._relay_stop = threading.Event()
        self._relay_thread: threading.Thread | None = None
        self._bridge_proc: subprocess.Popen | None = None
        self._service_proc: subprocess.Popen | None = None
        self._gui_proc: subprocess.Popen | None = None
        self._mac = ""
        self._vpn_ip = ""
        self._env = _wine_env()

    def run(self, installer: Path | None, reporter: Reporter | None = None,
            *, want_gui: bool = True, on_ready: Callable[[str], None] | None = None) -> bool:
        with (reporter or NullReporter()) as sp:
            try:
                if not self._preflight(sp):
                    return False
                self._kill_previous()
                if not self._ensure_installed(installer, sp):
                    return False
                self._stage_artifacts(sp)
                self._load_mac()
                sp.update("Creating network device")
                error = self._net_bringup()
                if error:
                    sp.fail(f"Network setup failed — {error}")
                    return False
                if not self._start_bridge(sp):
                    return False
                self._configure_registry(sp)
                self._start_relay()
                if not self._start_service(sp):
                    return False
                sp.update("Configuring routes")
                error = self._net_ready()
                if error:
                    sp.fail(f"Routing failed — {error}")
                    return False
                self._apply_gui_prefs()
                if want_gui:
                    self._launch_gui(sp)
                sp.succeed(f"Bridge running — {self._vpn_ip}")
                if on_ready is not None:
                    on_ready(self._vpn_ip)
                self._wait_exit()
                return True
            finally:
                self._teardown()

    def stop(self) -> None:
        self._cancel.set()
        _terminate(self._gui_proc)
        _terminate(self._service_proc)

    def _preflight(self, sp: Reporter) -> bool:
        if shutil.which("pkexec") is None:
            sp.fail("pkexec not found — a polkit agent is required")
            return False
        if shutil.which("ip") is None:
            sp.fail("iproute2 (ip) is not available")
            return False
        if not WINE_BIN.exists():
            if shutil.which("wine") is None:
                sp.fail("Wine is not available")
                return False
            out = subprocess.run(["wine", "--version"], capture_output=True,
                                 text=True, errors="replace", check=False)
            match = _WINE_VER.match(out.stdout.strip())
            if not match or int(match.group(1)) < 11:
                sp.fail("Wine 11 or newer is required")
                return False
        return True

    def _ensure_installed(self, installer: Path | None, sp: Reporter) -> bool:
        if is_installed():
            return True
        if installer is None or not Path(installer).is_file():
            sp.fail("Select the RadminVPN installer first")
            return False
        sp.update("Installing RadminVPN")
        RADMIN_PREFIX.mkdir(parents=True, exist_ok=True)
        self._wine(["wineboot", "--init"])
        self._wineserver_kill()
        self._wine([str(installer), "/VERYSILENT", "/NORESTART"])
        for _ in range(30):
            if self._cancel.is_set():
                return False
            time.sleep(0.5)
            if is_installed():
                break
        if not is_installed():
            sp.fail("RadminVPN installation failed")
            return False
        self._wineserver_kill()
        self._scrub_ndis()
        self._reg_add(r"HKLM\SYSTEM\CurrentControlSet\Services\RvControlSvc",
                      "Start", "REG_DWORD", "4")
        self._wineserver_kill()
        sp.succeed("RadminVPN installed")
        return True

    def _stage_artifacts(self, sp: Reporter) -> None:
        sp.update("Installing components")
        _DRIVERS.mkdir(parents=True, exist_ok=True)
        _RADMIN_APP.mkdir(parents=True, exist_ok=True)
        _SYSWOW.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(RADMIN_BIN_DIR / "tap_bridge", 0o755)
        except OSError:
            pass
        shutil.copy2(RADMIN_BIN_DIR / "rvpnnetmp.sys", _DRIVERS / "rvpnnetmp.sys")
        shutil.copy2(RADMIN_BIN_DIR / "adapter_hook.dll", _RADMIN_APP / "adapter_hook.dll")
        shutil.copy2(RADMIN_BIN_DIR / "rvpn_launcher.exe", _RADMIN_APP / "rvpn_launcher.exe")
        shutil.copy2(RADMIN_BIN_DIR / "netsh.exe", _SYSWOW / "netsh.exe")
        shutil.copy2(RADMIN_BIN_DIR / "netsh64.exe", _SYS32 / "netsh.exe")
        shutil.copy2(RADMIN_BIN_DIR / "drvinst.exe", _RADMIN_APP / "drvinst.exe")
        self._scrub_ndis()

    def _load_mac(self) -> None:
        if RADMIN_MAC_FILE.exists():
            self._mac = RADMIN_MAC_FILE.read_text().strip()
        else:
            octets = bytes([0x02, *os.urandom(5)])
            self._mac = ":".join(f"{b:02x}" for b in octets)
            RADMIN_STATE_DIR.mkdir(parents=True, exist_ok=True)
            RADMIN_MAC_FILE.write_text(self._mac)
        Path(_MAC_RAW).write_bytes(bytes(int(p, 16) for p in self._mac.split(":")))

    def _net_bringup(self) -> str | None:
        if not _MAC_RE.match(self._mac):
            return "invalid adapter MAC"
        user = getpass.getuser()
        if not _USER_RE.match(user):
            return "invalid user name"
        script = "; ".join([
            "modprobe tun",
            f"ip link delete {_TAP} 2>/dev/null || true",
            f"ip tuntap add dev {_TAP} mode tap user {user}",
            f"ip link set {_TAP} address {self._mac}",
            f"ip link set {_TAP} up",
            f"ip link set {_TAP} multicast on",
            f"ip link set {_TAP} allmulticast on",
            f"sysctl -w net.ipv4.conf.{_TAP}.rp_filter=0",
            f"sysctl -w net.ipv4.conf.{_TAP}.accept_local=1",
            f"ip maddr add 224.0.2.60 dev {_TAP} 2>/dev/null || true",
            f"ip route add 224.0.2.60/32 dev {_TAP} 2>/dev/null || true",
            f"nmcli device set {_TAP} managed no 2>/dev/null || true",
        ])
        return _pkexec(script)

    def _start_bridge(self, sp: Reporter) -> bool:
        sp.update("Starting bridge")
        subprocess.run(["pkill", "-f", "tap_bridge"], check=False)
        for fifo in _FIFOS:
            _rm(fifo)
        self._bridge_proc = subprocess.Popen(
            [str(RADMIN_BIN_DIR / "tap_bridge")],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        for _ in range(10):
            if _is_fifo(_FIFO_B2D) and _is_fifo(_FIFO_D2B_LOW):
                return True
            time.sleep(0.1)
        sp.fail("tap_bridge failed to create FIFOs")
        return False

    def _configure_registry(self, sp: Reporter) -> None:
        sp.update("Detecting adapter")
        guid = self._detect_guid()
        sp.update("Configuring adapter")
        connection = _NETWORK_KEY + "\\" + guid + r"\Connection"
        self._reg_add(_CLASS_KEY, "NetCfgInstanceId", "REG_SZ", guid)
        self._reg_add(_CLASS_KEY, "MatchingDeviceId", "REG_SZ", guid + r"\RvNetMP60")
        self._reg_add(connection, "Name", "REG_SZ", "Radmin VPN")
        self._reg_add(connection, "PnpInstanceID", "REG_SZ", r"ROOT\NET\0099")
        self._reg_add(r"HKLM\Software\Wow6432Node\Famatech\RadminVPN\1.0\Firewall",
                      "AdapterId", "REG_SZ", guid)
        self._wine(["reg", "add", r"HKLM\SOFTWARE\Famatech\RadminVPN\1.0\Registration", "/f"])
        self._reg_add(_SERVICE_KEY, "DisplayName", "REG_SZ", "Radmin VPN TAP Bridge")
        self._reg_add(_SERVICE_KEY, "ImagePath", "REG_EXPAND_SZ",
                      r"C:\windows\system32\drivers\rvpnnetmp.sys")
        self._reg_add(_SERVICE_KEY, "Start", "REG_DWORD", "2")
        self._reg_add(_SERVICE_KEY, "Type", "REG_DWORD", "1")
        self._reg_add(_SERVICE_KEY, "Group", "REG_SZ", "NDIS")
        self._reg_add(_SERVICE_KEY, "ErrorControl", "REG_DWORD", "0")
        self._wineserver_kill()
        self._reg_add(_MEMORY_KEY, "SystemPages", "REG_DWORD", "0xFFFFFFFF")
        self._reg_add(_MEMORY_KEY, "ClearPageFileAtShutdown", "REG_DWORD", "0")
        self._reg_add(_MEMORY_KEY, "LargeSystemCache", "REG_DWORD", "1")

    def _detect_guid(self) -> str:
        try:
            out = self._wine(
                ["wmic", "path", "Win32_NetworkAdapter", "get", "Name,GUID"], timeout=10,
            )
            for line in out.stdout.splitlines():
                if _TAP in line:
                    field = line.split()
                    if field:
                        return field[0].strip()
        except (subprocess.TimeoutExpired, OSError):
            pass
        digest = hashlib.md5((self._mac.replace(":", "") + "\n").encode()).hexdigest()
        return ("{" + f"{digest[0:8]}-{digest[8:12]}-4{digest[12:16]}"
                f"-{digest[16:20]}-{digest[20:32]}" + "}")

    def _start_relay(self) -> None:
        _rm(_CMD_FILE)
        _rm(_CMD_FILE + ".proc")
        self._relay_stop.clear()
        self._relay_thread = threading.Thread(target=self._relay_loop, daemon=True)
        self._relay_thread.start()

    def _relay_loop(self) -> None:
        processing = _CMD_FILE + ".proc"
        while not self._relay_stop.is_set():
            try:
                if os.path.isfile(_CMD_FILE):
                    os.rename(_CMD_FILE, processing)
                    for line in Path(processing).read_text().splitlines():
                        self._apply_netsh(line.strip())
                    _rm(processing)
            except OSError:
                pass
            time.sleep(0.1)

    def _apply_netsh(self, line: str) -> None:
        match = _NETSH_ADDR.search(line)
        if not match:
            return
        ip, cidr = match.group(1), match.group(2)
        if _VPN_IP.match(ip):
            _pkexec(f"ip addr add {ip}/{cidr} dev {_TAP} 2>/dev/null || true; "
                    f"ip link set {_TAP} up 2>/dev/null || true")

    def _start_service(self, sp: Reporter) -> bool:
        sp.update("Starting service")
        _rm(_SERVICE_LOG)
        env = dict(self._env)
        env["WINEDLLOVERRIDES"] = "mscoree=;mshtml=;netsh.exe=n"
        env["WINE_LARGE_ADDRESS_AWARE"] = "1"
        self._service_proc = subprocess.Popen(
            ["wine", "rvpn_launcher.exe", "/run"],
            cwd=str(_RADMIN_APP), env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        for _ in range(60):
            if self._cancel.is_set():
                return False
            time.sleep(0.5)
            text = _read_utf16(_SERVICE_LOG)
            if text:
                if _SERVICE_14.search(text):
                    sp.fail("RadminVPN 1.4 is not supported — use a 2.0.x installer")
                    return False
                ip = _extract_ip(text)
                if ip:
                    self._vpn_ip = ip
                    return True
            if self._service_proc.poll() is not None:
                sp.fail("RadminVPN service exited")
                return False
        sp.fail("RadminVPN service never became ready")
        return False

    def _net_ready(self) -> str | None:
        if not _VPN_IP.match(self._vpn_ip):
            return "invalid VPN IP"
        script = "; ".join([
            f"ip addr add {self._vpn_ip}/8 dev {_TAP} 2>/dev/null || true",
            f"ip link set {_TAP} up",
            f"ip route replace 26.0.0.0/8 dev {_TAP}",
            f"ip route append 255.255.255.255/32 dev {_TAP} metric 0 2>/dev/null || true",
            f"ip route append 224.0.0.0/4 dev {_TAP} metric 0 2>/dev/null || true",
        ])
        return _pkexec(script)

    def _apply_gui_prefs(self) -> None:
        self._reg_add(r"HKCU\Software\Wine\X11 Driver", "Decorated", "REG_SZ", "N")
        self._reg_add(r"HKCU\Control Panel\Desktop", "FontSmoothing", "REG_SZ", "2")
        self._reg_add(r"HKCU\Control Panel\Desktop", "FontSmoothingType", "REG_DWORD", "2")
        self._reg_add(r"HKCU\Control Panel\Desktop", "FontSmoothingGamma", "REG_DWORD", "1400")
        self._reg_add(r"HKCU\Control Panel\Desktop", "FontSmoothingOrientation", "REG_DWORD", "1")

    def _launch_gui(self, sp: Reporter) -> None:
        sp.update("Starting RadminVPN")
        env = dict(self._env)
        env["LIBGL_ALWAYS_SOFTWARE"] = "1"
        env["GALLIUM_DRIVER"] = "llvmpipe"
        self._gui_proc = subprocess.Popen(
            ["wine", "RvRvpnGui.exe"],
            cwd=str(_RADMIN_APP), env=env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )

    def _wait_exit(self) -> None:
        proc = self._gui_proc
        if proc is None:
            self._cancel.wait()
            return
        while proc.poll() is None:
            if self._cancel.is_set():
                _terminate(proc)
                break
            time.sleep(0.3)

    def _teardown(self) -> None:
        self._relay_stop.set()
        self._wineserver_kill()
        _terminate(self._gui_proc)
        _terminate(self._service_proc)
        _terminate(self._bridge_proc)
        self._gui_proc = self._service_proc = self._bridge_proc = None
        _pkexec(f"ip link delete {_TAP} 2>/dev/null || true")
        for path in (_CMD_FILE, _CMD_FILE + ".proc", _MAC_RAW, *_FIFOS):
            _rm(path)

    def _wine(
        self, args: list[str], *, timeout: float | None = None
    ) -> subprocess.CompletedProcess:
        return subprocess.run(["wine", *args], env=self._env, capture_output=True,
                              text=True, errors="replace", timeout=timeout, check=False)

    def _wineserver_kill(self) -> None:
        subprocess.run(["wineserver", "-k"], env=self._env, capture_output=True, check=False)

    def _kill_previous(self) -> None:
        subprocess.run(["pkill", "-f", "RvControlSvc|RvRvpnGui|rvpn_launcher"], check=False)
        time.sleep(0.3)
        self._wineserver_kill()
        subprocess.run(["wineserver", "-p"], env=self._env, capture_output=True, check=False)

    def _reg_add(self, path: str, name: str, reg_type: str, data: str) -> None:
        self._wine(["reg", "add", path, "/v", name, "/t", reg_type, "/d", data, "/f"])

    def _scrub_ndis(self) -> None:
        self._wine(["reg", "delete", _NDIS_KEY, "/f"])
        _rm(_DRIVERS / "RvNetMP60.sys")
