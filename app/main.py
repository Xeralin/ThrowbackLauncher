import contextlib
import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))

from core.self_update import maybe_apply_staged, run_relaunch

if "--relaunch" in sys.argv:
    sys.exit(run_relaunch(sys.argv))

if "--uninstall" in sys.argv:
    from core.self_uninstall import run as _run_uninstall

    _run_uninstall()
    sys.exit(0)

if maybe_apply_staged():
    sys.exit(0)

from PySide6.QtCore import QLockFile, QObject
from PySide6.QtNetwork import QLocalServer, QLocalSocket
from PySide6.QtWidgets import QApplication

from core.config import get_setting, load_config
from core.constants import (
    DATA_ROOT,
    DEFAULT_DOWNLOADS_DIR,
    FROZEN,
    WEB_OUT_DIR,
    default_library,
)
from core.manifest import load_downloads, local_downloads, resolve_install
from core.rpc import start_presence, stop_presence

from app_window import BrowserView
from bridge.downloader import DownloadController
from bridge.forward import EventForwarder
from bridge.info import Info, Platform
from bridge.launch import LaunchController
from bridge.library import Library
from bridge.liberator import LiberatorController
from bridge.radmin import RadminController
from bridge.settings import Settings
from bridge.shears import Shears
from bridge.uninstall import UninstallController
from bridge.update import UpdateController
from server import StaticServer

CA_BUNDLES = (
    "/etc/ssl/certs/ca-certificates.crt",
    "/etc/pki/tls/certs/ca-bundle.crt",
    "/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem",
    "/etc/ssl/ca-bundle.pem",
)


FORWARDS = {
    "downloader": {
        "login_required": "login_required",
        "done": "done",
        "error": "error",
        "steam_setup_done": "steam_setup_done",
        "partial_deleted": "partial_deleted",
        "rate_limited": "rate_limited",
    },
    "liberator": {"state_changed": "state", "tree_changed": "tree", "error": "error"},
    "radmin": {"state_changed": "state", "error": "error"},
    "update": {"changed": "status", "progress": "progress", "done": "done"},
    "uninstall": {"done": "done", "item_done": "item_done"},
    "shears": {"scan_done": "scan", "cut_done": "cut"},
}


def _wire_events(view: BrowserView, bridges: dict[str, QObject]) -> None:
    for target, signals in FORWARDS.items():
        obj = bridges.get(target)
        if obj is None:
            continue
        forwarder = EventForwarder(view, target)
        for signal, event in signals.items():
            getattr(obj, signal).connect(lambda *args, f=forwarder, e=event: f.send(e, *args))
        if target == "downloader":
            obj.log_line.connect(lambda s, f=forwarder: f.send_buffered("log_line", s))
            for prop in ("state", "progress", "running", "active_key", "verifying"):
                getattr(obj, f"{prop}_changed").connect(
                    lambda *_, f=forwarder, o=obj, p=prop: f.send(p, o.property(p))
                )
            obj.queue_changed.connect(lambda *_, f=forwarder, o=obj: f.send("queue", o.queued_keys()))
        if target == "radmin":
            obj.log_line.connect(lambda s, f=forwarder: f.send_buffered("log_line", s))


def main() -> int:
    if sys.platform == "linux":
        os.environ.setdefault("QT_QPA_PLATFORMTHEME", "xdgdesktopportal")
        if FROZEN and "SSL_CERT_FILE" not in os.environ:
            bundle = next((p for p in CA_BUNDLES if Path(p).exists()), None)
            if bundle is not None:
                os.environ["SSL_CERT_FILE"] = bundle
    os.environ.setdefault(
        "QTWEBENGINE_CHROMIUM_FLAGS",
        "--disable-accelerated-video-decode --disable-gpu-memory-buffer-video-frames"
        " --enable-features=OverlayScrollbar,FluentOverlayScrollbar",
    )
    app = QApplication(sys.argv)
    app.setApplicationName("Launcher")
    app.setApplicationDisplayName("Throwback Launcher")
    app.setDesktopFileName("ThrowbackLauncher")

    DATA_ROOT.mkdir(parents=True, exist_ok=True)
    lock = QLockFile(str(DATA_ROOT / ".lock"))
    lock.setStaleLockTime(0)
    if not lock.tryLock(0):
        peer = QLocalSocket()
        peer.connectToServer("ThrowbackLauncher")
        peer.waitForConnected(300)
        peer.close()
        return 0

    if default_library() == DEFAULT_DOWNLOADS_DIR:
        with contextlib.suppress(OSError):
            DEFAULT_DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    cfg = load_config()
    if get_setting(cfg, "discord_rpc", False):
        start_presence()
    app.aboutToQuit.connect(stop_presence)
    try:
        downloads = load_downloads()
    except RuntimeError as e:
        sys.exit(str(e))

    downloader = DownloadController(cfg, downloads)
    app.aboutToQuit.connect(downloader.shutdown)

    updater = UpdateController()
    settings = Settings(cfg)
    settings.set_peers(downloader, updater)

    liberator = LiberatorController()
    app.aboutToQuit.connect(liberator.shutdown)

    radmin = RadminController() if sys.platform == "linux" else None
    if radmin is not None:
        app.aboutToQuit.connect(radmin.shutdown)

    uninstaller = UninstallController(downloader)
    downloader.set_peers(updater, settings, uninstaller)
    shears = Shears()

    server = StaticServer(WEB_OUT_DIR)
    server.start()
    app.aboutToQuit.connect(server.stop)

    has_local = any(resolve_install(d.name, downloads) for d in local_downloads())
    bridges: dict[str, QObject] = {
        "platform": Platform(),
        "library": Library(downloads),
        "info": Info(),
        "settings": settings,
        "downloader": downloader,
        "liberator": liberator,
        "launch": LaunchController(),
        "shears": shears,
        "uninstall": uninstaller,
        "update": updater,
    }
    if radmin is not None:
        bridges["radmin"] = radmin
    view = BrowserView(server.base_url + ("/" if has_local else "/download/"), bridges)
    view.setWindowTitle("Throwback Launcher")
    avail = app.primaryScreen().availableSize()
    width = max(940, min(1280, round(avail.width() * 0.9)))
    height = max(540, min(720, round(avail.height() * 0.9)))
    view.setMinimumSize(940, 540)
    view.resize(width, height)
    view.show()

    def activate_window() -> None:
        view.showNormal()
        view.raise_()
        view.activateWindow()

    QLocalServer.removeServer("ThrowbackLauncher")
    instance_server = QLocalServer()
    instance_server.newConnection.connect(activate_window)
    instance_server.listen("ThrowbackLauncher")
    app.aboutToQuit.connect(instance_server.close)

    _wire_events(view, bridges)

    if get_setting(cfg, "liberator_enabled", True):
        liberator.start()
    settings.liberator_enabled_changed.connect(
        lambda: liberator.start() if settings.liberator_enabled else liberator.stop()
    )

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
