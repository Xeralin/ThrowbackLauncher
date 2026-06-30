import os
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from pathlib import Path

from PySide6.QtCore import Qt, QThread, QTimer, Signal
from PySide6.QtWidgets import (
    QApplication,
    QFrame,
    QProgressBar,
    QVBoxLayout,
    QWidget,
)

APP_NAME = "Throwback Launcher"
PAYLOAD_URL = "https://github.com/Xeralin/ThrowbackLauncher/releases/latest/download/ThrowbackLauncher-app.zip"
INSTALL_DIR = Path(os.environ.get("PUBLIC") or r"C:\Users\Public") / "ThrowbackLauncher"
APP_EXE = INSTALL_DIR / "throwback-launcher.exe"
LOG_FILE = Path(tempfile.gettempdir()) / "ThrowbackLauncher-install.log"
MIN_VISIBLE_MS = 2000

STYLE = """
#card {
    background: #0d0d0f;
    border: 1px solid #2a2a38;
    border-radius: 8px;
}
QProgressBar { background: #1a1a24; border: none; border-radius: 3px; }
QProgressBar::chunk { background: #c0152a; border-radius: 3px; }
QProgressBar[failed="true"]::chunk { background: #4a4a5a; }
"""


def _log(message: str) -> None:
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"{time.strftime('%H:%M:%S')} {message}\n")
    except OSError:
        pass


def _launch_app() -> None:
    subprocess.Popen([str(APP_EXE)], cwd=str(INSTALL_DIR))


def _create_shortcut() -> None:
    if not sys.platform.startswith("win"):
        return
    programs = Path(os.environ["APPDATA"]) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
    lnk = programs / f"{APP_NAME}.lnk"
    ps = (
        f"$s=(New-Object -COM WScript.Shell).CreateShortcut('{lnk}');"
        f"$s.TargetPath='{APP_EXE}';"
        f"$s.WorkingDirectory='{INSTALL_DIR}';"
        f"$s.IconLocation='{APP_EXE}';"
        f"$s.Save()"
    )
    r = subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
        capture_output=True, text=True,
        creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        check=False,
    )
    _log(f"shortcut rc={r.returncode} exists={lnk.exists()} err={r.stderr.strip()}")


def _register_uninstall() -> None:
    if not sys.platform.startswith("win"):
        return
    import winreg

    key_path = r"Software\Microsoft\Windows\CurrentVersion\Uninstall\ThrowbackLauncher"
    try:
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path) as k:
            winreg.SetValueEx(k, "DisplayName", 0, winreg.REG_SZ, APP_NAME)
            winreg.SetValueEx(k, "DisplayIcon", 0, winreg.REG_SZ, str(APP_EXE))
            winreg.SetValueEx(k, "Publisher", 0, winreg.REG_SZ, "Operation Throwback")
            winreg.SetValueEx(k, "InstallLocation", 0, winreg.REG_SZ, str(INSTALL_DIR))
            winreg.SetValueEx(k, "UninstallString", 0, winreg.REG_SZ, f'"{APP_EXE}" --uninstall')
            winreg.SetValueEx(k, "NoModify", 0, winreg.REG_DWORD, 1)
            winreg.SetValueEx(k, "NoRepair", 0, winreg.REG_DWORD, 1)
        _log("uninstall key written")
    except OSError as e:
        _log(f"uninstall key FAILED {e!r}")


class Installer(QThread):
    progress = Signal(int)
    failed = Signal()
    done = Signal()

    def run(self) -> None:
        try:
            archive = Path(tempfile.gettempdir()) / "ThrowbackLauncher-app.zip"
            _log("download start")
            self._download(PAYLOAD_URL, archive)
            _log("extract start")
            self._extract(archive, INSTALL_DIR)
            archive.unlink(missing_ok=True)
            _create_shortcut()
            _register_uninstall()
            _log("done")
            self.done.emit()
        except Exception as e:
            _log(f"FAILED {e!r}")
            self.failed.emit()

    def _download(self, url: str, dest: Path) -> None:
        req = urllib.request.Request(url, headers={"User-Agent": APP_NAME})
        with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
            total = int(r.headers.get("Content-Length") or 0)
            read = 0
            while True:
                chunk = r.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
                read += len(chunk)
                self.progress.emit(int(read * 90 / total) if total else 0)

    def _extract(self, archive: Path, dest: Path) -> None:
        staging = dest.parent / (dest.name + ".new")
        shutil.rmtree(staging, ignore_errors=True)
        staging.mkdir(parents=True)
        with zipfile.ZipFile(archive) as z:
            members = z.infolist()
            for i, member in enumerate(members):
                z.extract(member, staging)
                self.progress.emit(90 + int((i + 1) * 10 / len(members)))
        if dest.exists():
            shutil.rmtree(dest)
        staging.rename(dest)


class Loader(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setFixedSize(320, 56)
        self.setStyleSheet(STYLE)
        self._shown_at = 0.0

        card = QFrame()
        card.setObjectName("card")
        card.setAttribute(Qt.WA_StyledBackground, True)
        shell = QVBoxLayout(self)
        shell.setContentsMargins(0, 0, 0, 0)
        shell.addWidget(card)

        self._bar = QProgressBar()
        self._bar.setRange(0, 100)
        self._bar.setTextVisible(False)
        self._bar.setFixedHeight(6)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(26, 0, 26, 0)
        layout.addStretch()
        layout.addWidget(self._bar)
        layout.addStretch()

        geo = QApplication.primaryScreen().availableGeometry()
        self.move(geo.center() - self.rect().center())

        self._installer = Installer()
        self._installer.progress.connect(self._on_progress)
        self._installer.failed.connect(self._on_failed)
        self._installer.done.connect(self._on_done)

    def begin(self) -> None:
        self._shown_at = time.monotonic()
        _log(f"window shown visible={self.isVisible()}")
        self._installer.start()

    def _on_progress(self, pct: int) -> None:
        self._bar.setValue(pct)

    def _on_failed(self) -> None:
        self._bar.setValue(100)
        self._bar.setProperty("failed", True)
        self._bar.style().unpolish(self._bar)
        self._bar.style().polish(self._bar)
        QTimer.singleShot(4000, QApplication.quit)

    def _on_done(self) -> None:
        elapsed_ms = int((time.monotonic() - self._shown_at) * 1000)
        QTimer.singleShot(max(0, MIN_VISIBLE_MS - elapsed_ms), self._finish)

    def _finish(self) -> None:
        _launch_app()
        QApplication.quit()

    def keyPressEvent(self, event) -> None:
        if event.key() == Qt.Key_Escape:
            QApplication.quit()


def main() -> int:
    _log(f"loader start; installed={APP_EXE.exists()}")
    if APP_EXE.exists():
        _launch_app()
        return 0
    app = QApplication(sys.argv)
    loader = Loader()
    loader.show()
    app.processEvents()
    loader.begin()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
