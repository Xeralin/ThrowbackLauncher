import re
import shutil
import subprocess
import threading

from PySide6.QtCore import QObject, QTimer, Signal, Slot

from core.config import get_setting, save_config, set_setting
from core.constants import VBOX_CMD, VBOX_IFACE


def bridge_present() -> bool:
    try:
        out = subprocess.run([VBOX_CMD, "list", "hostonlyifs"],
                             capture_output=True, text=True, check=False)
    except FileNotFoundError:
        return False
    return bool(re.search(rf"\b{VBOX_IFACE}\b", out.stdout))


def competing_route() -> str | None:
    try:
        out = subprocess.run(
            ["ip", "-o", "route", "show"],
            capture_output=True, text=True, check=False,
        )
    except FileNotFoundError:
        return None
    for route in out.stdout.splitlines():
        m = re.match(r"^26\.\S+\s+.*\bdev\s+(\S+)", route)
        if m and m.group(1) != VBOX_IFACE:
            return m.group(1)
    return None


def verify_bridge(radmin_ip: str) -> bool:
    try:
        addr_out = subprocess.run(
            ["ip", "-o", "-4", "addr", "show", "dev", VBOX_IFACE],
            capture_output=True, text=True, check=False,
        ).stdout
        if f"inet {radmin_ip}/8" not in addr_out:
            return False
        route_out = subprocess.run(
            ["ip", "route", "show", "dev", VBOX_IFACE],
            capture_output=True, text=True, check=False,
        ).stdout
    except FileNotFoundError:
        return False
    return (
        "224.0.0.0/4" in route_out
        and "26.255.255.255" in route_out
        and "255.255.255.255" in route_out
    )


def list_vms() -> list[str] | None:
    out = subprocess.run([VBOX_CMD, "list", "vms"], capture_output=True, text=True, check=False)
    if out.returncode != 0:
        return None
    return re.findall(r'"([^"]+)"', out.stdout)


def vm_state(vm_name: str) -> str | None:
    info = subprocess.run(
        [VBOX_CMD, "showvminfo", vm_name, "--machinereadable"],
        capture_output=True, text=True, check=False,
    )
    if info.returncode != 0:
        return None
    state_match = re.search(r'VMState="([^"]+)"', info.stdout)
    return state_match.group(1) if state_match else "unknown"


def attach_vm(vm_name: str) -> str | None:
    rc = subprocess.run(
        [VBOX_CMD, "modifyvm", vm_name, "--nic2", "hostonly", "--hostonlyadapter2", VBOX_IFACE],
        capture_output=True, text=True, check=False,
    )
    if rc.returncode != 0:
        err = (rc.stderr or rc.stdout).strip().splitlines()
        return err[0] if err else "unknown error"
    return None


_RADMIN_IP = re.compile(r"^26\.\d+\.\d+\.\d+$")


class RadminController(QObject):
    changed = Signal()
    result = Signal(bool, str)
    state = Signal("QVariantMap")
    _persist_ip = Signal(str)
    _state_in = Signal("QVariantMap")
    _vms_in = Signal(object)
    vms_listed = Signal(object)

    def __init__(self, cfg: dict, parent: QObject | None = None) -> None:
        super().__init__(parent)
        self._cfg = cfg
        self._busy = False
        self._persist_ip.connect(self._save_ip)
        self._state_in.connect(self.state)
        self._vms_in.connect(self.vms_listed)

    @Slot(str)
    def _save_ip(self, ip: str) -> None:
        set_setting(self._cfg, "radmin_ip", ip)
        save_config(self._cfg)

    @Slot()
    def refresh(self) -> None:
        threading.Thread(target=self._snapshot, daemon=True).start()

    def _snapshot(self) -> None:
        ip = get_setting(self._cfg, "radmin_ip", "")
        present = bridge_present()
        self._state_in.emit({
            "vboxInstalled": shutil.which(VBOX_CMD) is not None,
            "radminIp": ip,
            "bridgePresent": present,
            "bridgeReady": bool(ip) and present and verify_bridge(ip),
            "competingRoute": competing_route() or "",
            "busy": self._busy,
        })

    @Slot()
    def vms(self) -> None:
        threading.Thread(
            target=lambda: self._vms_in.emit(list_vms() or []), daemon=True
        ).start()

    @Slot(str)
    def create_bridge(self, ip: str) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(lambda: self._create(ip)))

    @Slot()
    def remove_bridge(self) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(self._remove))

    @Slot(str)
    def attach(self, vm: str) -> None:
        QTimer.singleShot(0, lambda: self._dispatch(lambda: self._attach(vm)))

    def _dispatch(self, action) -> None:
        if self._busy:
            return
        self._set_busy(True)

        def run() -> None:
            try:
                action()
            finally:
                self._set_busy(False)

        threading.Thread(target=run, daemon=True).start()

    def _set_busy(self, value: bool) -> None:
        if value != self._busy:
            self._busy = value
            self.changed.emit()

    def _pkexec(self, script: str) -> str | None:
        try:
            out = subprocess.run(
                ["pkexec", "sh", "-c", script],
                capture_output=True, text=True, check=False,
            )
        except FileNotFoundError:
            return "pkexec not found"
        if out.returncode != 0:
            err = (out.stderr or out.stdout).strip().splitlines()
            return err[-1] if err else f"exit code {out.returncode}"
        return None

    def _create(self, ip: str) -> None:
        ip = ip.strip()
        iface = VBOX_IFACE
        if not _RADMIN_IP.match(ip):
            self.result.emit(False, "Invalid RadminVPN IP")
            return
        if shutil.which(VBOX_CMD) is None:
            self.result.emit(False, "Install VirtualBox first")
            return
        conflict = competing_route()
        if conflict:
            self.result.emit(False, f"Interface {conflict} already routes 26.x — remove it first")
            return
        self._persist_ip.emit(ip)

        err = self._pkexec("modprobe vboxnetadp && chmod 0666 /dev/vboxnetctl")
        if err:
            self.result.emit(False, f"Bridge setup failed — {err}")
            return
        if not bridge_present():
            created = subprocess.run([VBOX_CMD, "hostonlyif", "create"], capture_output=True, text=True, check=False)
            if created.returncode != 0:
                self.result.emit(False, "Could not create host-only interface")
                return
        subprocess.run(
            [VBOX_CMD, "hostonlyif", "ipconfig", iface, "--ip", ip, "--netmask", "255.0.0.0"],
            capture_output=True, text=True, check=False,
        )
        err = self._pkexec(
            f"ip link set {iface} up && "
            f"ip addr add {ip}/8 dev {iface} 2>/dev/null; "
            f"ip route add 224.0.0.0/4 dev {iface} 2>/dev/null; "
            f"ip route add 26.255.255.255/32 dev {iface} 2>/dev/null; "
            f"ip route add 255.255.255.255/32 dev {iface} 2>/dev/null; true"
        )
        if err:
            self.result.emit(False, f"Bridge setup failed — {err}")
            return
        if verify_bridge(ip):
            self.result.emit(True, "Bridge ready")
        else:
            self.result.emit(False, "Bridge verification failed")

    def _remove(self) -> None:
        iface = VBOX_IFACE
        if shutil.which(VBOX_CMD) is None:
            self.result.emit(False, "Install VirtualBox first")
            return
        if not bridge_present():
            self.result.emit(True, "Bridge already removed")
            return
        err = self._pkexec(f"ip addr flush dev {iface}; ip link set {iface} down")
        if err:
            self.result.emit(False, f"Bridge removal failed — {err}")
            return
        removed = subprocess.run([VBOX_CMD, "hostonlyif", "remove", iface], capture_output=True, text=True, check=False)
        if removed.returncode != 0:
            self.result.emit(False, "Could not remove host-only interface")
            return
        self.result.emit(True, "Bridge removed")

    def _attach(self, vm: str) -> None:
        if not bridge_present():
            self.result.emit(False, "Bridge not set up — create it first")
            return
        state = vm_state(vm)
        if state is None:
            self.result.emit(False, f"Could not read state of {vm}")
            return
        if state not in ("poweroff", "aborted"):
            self.result.emit(False, f"{vm} is {state} — power it off first")
            return
        err = attach_vm(vm)
        if err:
            self.result.emit(False, f"Attach failed — {err}")
            return
        self.result.emit(True, f"{vm} attached to {VBOX_IFACE}")
