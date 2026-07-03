import contextlib
import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))

if "--uninstall" in sys.argv:
    from core.self_uninstall import run as _run_uninstall

    _run_uninstall()
    sys.exit(0)

from PySide6.QtWidgets import QApplication

from core.config import get_setting, load_config, save_config
from core.constants import DEFAULT_DOWNLOADS_DIR, FROZEN, WEB_OUT_DIR, default_library
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
    "/etc/pki/tls/cert.pem",
    "/etc/ssl/cert.pem",
    "/etc/ssl/ca-bundle.pem",
)


def _wire_downloader_events(view: BrowserView, downloader: DownloadController) -> EventForwarder:
    forwarder = EventForwarder(view, "downloader")
    downloader.log_line.connect(lambda s: forwarder.send_buffered("log_line", s))
    downloader.state_changed.connect(lambda: forwarder.send("state", downloader.property("state")))
    downloader.progress_changed.connect(lambda: forwarder.send("progress", downloader.property("progress")))
    downloader.running_changed.connect(lambda: forwarder.send("running", downloader.property("running")))
    downloader.active_key_changed.connect(lambda: forwarder.send("active_key", downloader.property("active_key")))
    downloader.login_required.connect(lambda kind: forwarder.send("login_required", kind))
    downloader.finished.connect(lambda code: forwarder.send("finished", code))
    downloader.error.connect(lambda message: forwarder.send("error", message))
    downloader.steam_setup_done.connect(lambda ok, message: forwarder.send("steam_setup_done", ok, message))
    downloader.partial_deleted.connect(lambda key, ok, message: forwarder.send("partial_deleted", key, ok, message))
    downloader.rate_limited.connect(lambda: forwarder.send("rate_limited"))
    downloader.queue_changed.connect(lambda: forwarder.send("queue", downloader.queued_keys()))
    return forwarder


def _wire_radmin_events(view: BrowserView, radmin: RadminController) -> EventForwarder:
    forwarder = EventForwarder(view, "radmin")
    radmin.changed.connect(lambda: forwarder.send("status"))
    radmin.result.connect(lambda ok, message: forwarder.send("result", ok, message))
    radmin.state.connect(lambda state: forwarder.send("state", state))
    radmin.vms_listed.connect(lambda vms: forwarder.send("vms", vms))
    return forwarder


def _wire_shears_events(view: BrowserView, shears: Shears) -> EventForwarder:
    forwarder = EventForwarder(view, "shears")
    shears.scan_done.connect(lambda scan: forwarder.send("scan", scan))
    shears.cut_done.connect(lambda result: forwarder.send("cut", result))
    return forwarder


def _wire_liberator_events(view: BrowserView, liberator: LiberatorController) -> EventForwarder:
    forwarder = EventForwarder(view, "liberator")
    liberator.state_changed.connect(lambda state: forwarder.send("state", state))
    liberator.tree_changed.connect(lambda tree: forwarder.send("tree", tree))
    liberator.error.connect(lambda message: forwarder.send("error", message))
    return forwarder


def _wire_update_events(view: BrowserView, updater: UpdateController) -> EventForwarder:
    forwarder = EventForwarder(view, "update")
    updater.changed.connect(lambda: forwarder.send("status"))
    updater.log_line.connect(lambda s: forwarder.send("log_line", s))
    updater.finished.connect(lambda ok, name: forwarder.send("finished", ok, name))
    return forwarder


def _wire_uninstall_events(view: BrowserView, uninstaller: UninstallController) -> EventForwarder:
    forwarder = EventForwarder(view, "uninstall")
    uninstaller.finished.connect(lambda ok, message: forwarder.send("finished", ok, message))
    uninstaller.item_finished.connect(lambda item, ok, message: forwarder.send("item_finished", item, ok, message))
    return forwarder


def main() -> int:
    if sys.platform == "linux":
        os.environ.setdefault("QT_QPA_PLATFORMTHEME", "xdgdesktopportal")
        if FROZEN and "SSL_CERT_FILE" not in os.environ:
            bundle = next((p for p in CA_BUNDLES if os.path.exists(p)), None)
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
    app.setDesktopFileName("throwback-launcher")

    if default_library() == DEFAULT_DOWNLOADS_DIR:
        with contextlib.suppress(OSError):
            DEFAULT_DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
    cfg = load_config()
    settings_map = cfg.get("settings", {})
    if "downloads_dir" in settings_map:
        legacy = settings_map.pop("downloads_dir")
        if legacy and "libraries" not in settings_map:
            settings_map["libraries"] = [legacy]
        save_config(cfg)
    if get_setting(cfg, "discord_rpc", False):
        start_presence()
    app.aboutToQuit.connect(stop_presence)
    downloads = load_downloads()

    downloader = DownloadController(cfg, downloads)
    app.aboutToQuit.connect(downloader.shutdown)

    updater = UpdateController()
    downloader.set_peer(updater)

    settings = Settings(cfg)
    downloader.set_settings(settings)
    settings.set_peers(downloader, updater)

    radmin = RadminController(cfg)
    liberator = LiberatorController()
    app.aboutToQuit.connect(liberator.shutdown)

    uninstaller = UninstallController(downloader)
    downloader.set_uninstaller(uninstaller)
    shears = Shears()

    server = StaticServer(WEB_OUT_DIR)
    server.start()
    app.aboutToQuit.connect(server.stop)

    has_local = any(resolve_install(d.name, downloads) for d in local_downloads())
    view = BrowserView(
        server.base_url + ("/" if has_local else "/download/"),
        {
            "platform": Platform(),
            "library": Library(downloads),
            "info": Info(downloads),
            "settings": settings,
            "downloader": downloader,
            "radmin": radmin,
            "liberator": liberator,
            "launch": LaunchController(),
            "shears": shears,
            "uninstall": uninstaller,
            "update": updater,
        },
    )
    view.setWindowTitle("Throwback Launcher")
    avail = app.primaryScreen().availableSize()
    width = max(1000, min(1440, round(avail.width() * 0.9), round(avail.height() * 0.9) * 2))
    view.setMinimumSize(width, width // 2)
    view.resize(width, width // 2)
    view.show()

    _wire_downloader_events(view, downloader)
    _wire_radmin_events(view, radmin)
    _wire_liberator_events(view, liberator)
    _wire_update_events(view, updater)
    _wire_uninstall_events(view, uninstaller)
    _wire_shears_events(view, shears)

    if get_setting(cfg, "liberator_enabled", True):
        liberator.start()
    settings.liberator_enabled_changed.connect(
        lambda: liberator.start() if settings.liberator_enabled else liberator.stop()
    )

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
