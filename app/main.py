import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_DIR))

if "--uninstall" in sys.argv:
    from core.self_uninstall import run as _run_uninstall

    _run_uninstall()
    sys.exit(0)

from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication

from core.config import get_setting, load_config
from core.constants import MEDIA_DIR, WEB_OUT_DIR
from core.manifest import load_downloads
from core.rpc import start_presence, stop_presence

from app_window import BrowserView
from bridge.downloader import DownloadController
from bridge.forward import EventForwarder
from bridge.info import Info
from bridge.launch import LaunchController
from bridge.library import Library
from bridge.liberator import LiberatorController
from bridge.platform import Platform
from bridge.radmin import RadminController
from bridge.settings import Settings
from bridge.shears import Shears
from bridge.uninstall import UninstallController
from bridge.update import UpdateController
from server import StaticServer


def _wire_downloader_events(view: BrowserView, downloader: DownloadController) -> EventForwarder:
    forwarder = EventForwarder(view, "downloader")
    downloader.log_line.connect(lambda s: forwarder.send("log_line", s))
    downloader.state_changed.connect(lambda: forwarder.send("state", downloader.property("state")))
    downloader.progress_changed.connect(lambda: forwarder.send("progress", downloader.property("progress")))
    downloader.running_changed.connect(lambda: forwarder.send("running", downloader.property("running")))
    downloader.active_key_changed.connect(lambda: forwarder.send("active_key", downloader.property("active_key")))
    downloader.login_required.connect(lambda kind: forwarder.send("login_required", kind))
    downloader.finished.connect(lambda code: forwarder.send("finished", code))
    downloader.error.connect(lambda message: forwarder.send("error", message))
    downloader.steam_setup_done.connect(lambda ok, message: forwarder.send("steam_setup_done", ok, message))
    return forwarder


def _wire_radmin_events(view: BrowserView, radmin: RadminController) -> EventForwarder:
    forwarder = EventForwarder(view, "radmin")
    radmin.changed.connect(lambda: forwarder.send("status"))
    radmin.result.connect(lambda ok, message: forwarder.send("result", ok, message))
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
    return forwarder


def main() -> int:
    os.environ.setdefault(
        "QTWEBENGINE_CHROMIUM_FLAGS",
        "--disable-accelerated-video-decode --disable-gpu-memory-buffer-video-frames",
    )
    app = QApplication(sys.argv)
    app.setApplicationName("Launcher")
    app.setApplicationDisplayName("Throwback Launcher")
    app.setDesktopFileName("throwback-launcher")
    app.setWindowIcon(QIcon(str(MEDIA_DIR / "otb_icon.png")))

    cfg = load_config()
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

    radmin = RadminController(cfg)
    liberator = LiberatorController()
    app.aboutToQuit.connect(liberator.shutdown)

    uninstaller = UninstallController()

    server = StaticServer(WEB_OUT_DIR)
    server.start()
    app.aboutToQuit.connect(server.stop)

    view = BrowserView(
        server.base_url + "/",
        {
            "platform": Platform(),
            "library": Library(downloads),
            "info": Info(downloads),
            "settings": settings,
            "downloader": downloader,
            "radmin": radmin,
            "liberator": liberator,
            "launch": LaunchController(),
            "shears": Shears(),
            "uninstall": uninstaller,
            "update": updater,
        },
    )
    view.setWindowTitle("Throwback Launcher")
    view.setMinimumSize(1000, 500)
    view.resize(1400, 700)
    view.show()

    _wire_downloader_events(view, downloader)
    _wire_radmin_events(view, radmin)
    _wire_liberator_events(view, liberator)
    _wire_update_events(view, updater)
    _wire_uninstall_events(view, uninstaller)

    liberator.start()

    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
