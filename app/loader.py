import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

from PySide6.QtCore import Qt, QLockFile, QPointF, QRectF, QSize, QThread, QTimer, Signal
from PySide6.QtGui import (
    QColor,
    QFont,
    QFontDatabase,
    QIcon,
    QPainter,
    QPainterPath,
    QPen,
    QPixmap,
    QPolygonF,
)
from PySide6.QtWidgets import (
    QApplication,
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

APP_NAME = "Throwback Launcher"
PAYLOAD_URL = "https://github.com/Xeralin/ThrowbackLauncher/releases/latest/download/App.zip"
_LOCAL = os.environ.get("LOCALAPPDATA") or str(Path.home() / "AppData" / "Local")
INSTALL_DIR = Path(_LOCAL) / "ThrowbackLauncher"
APP_EXE = INSTALL_DIR / "throwback-launcher.exe"


def _load_fonts() -> None:
    fonts = Path(__file__).resolve().parent / "assets" / "fonts"
    for ttf in fonts.glob("*.ttf"):
        QFontDatabase.addApplicationFont(str(ttf))

STYLE = """
#card {
    background: #13131a;
    border: 1px solid #2a2a38;
    border-radius: 8px;
    font-family: "Barlow";
}
#title { color: #e8e0d5; font-family: "Rajdhani"; font-weight: 700; font-size: 18px; }
#body { color: #7a7890; font-size: 12px; }
#status {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 4px;
    padding: 2px 6px;
    color: #e8e0d5;
    font-family: "Share Tech Mono";
    font-size: 12px;
}
#stepnum { color: #7a7890; font-size: 12px; }
#path {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 4px;
}
#pathtext {
    background: transparent;
    border: none;
    color: #e8e0d5;
    font-family: "Share Tech Mono";
    font-size: 12px;
}
#copy { background: transparent; border: none; border-radius: 4px; padding: 2px; }
#copy:hover { background: #2a2a38; }
#close {
    background: #1a1a24;
    border: 1px solid #2a2a38;
    border-radius: 6px;
    color: #7a7890;
}
#close:hover { background: #2a2a38; color: #e8e0d5; }
"""

def _hi(text: str) -> str:
    return f'<span style="font-family:\'Barlow SemiBold\'; color:#e8e0d5">{text}</span>'


STEPS = (
    f"Open {_hi('Windows Security')} &gt; {_hi('Virus &amp; threat protection')}",
    f"{_hi('Manage settings')} &gt; {_hi('Exclusions')} &gt; {_hi('Add or remove exclusions')}",
    f"{_hi('Add an exclusion')} &gt; {_hi('Folder')}, then choose the folder above",
)


def _button_font() -> QFont:
    font = QFont()
    font.setFamilies(["Share Tech Mono", "monospace"])
    font.setPixelSize(12)
    font.setLetterSpacing(QFont.AbsoluteSpacing, 1.0)
    return font


def _draw_icon(paint) -> QIcon:
    pixmap = QPixmap(48, 48)
    pixmap.fill(Qt.transparent)
    painter = QPainter(pixmap)
    painter.setRenderHint(QPainter.Antialiasing)
    paint(painter, 48 / 24)
    painter.end()
    return QIcon(pixmap)


def _copy_icon() -> QIcon:
    def paint(painter, k):
        pen = QPen(QColor("#7a7890"))
        pen.setWidthF(2 * k)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        painter.drawRoundedRect(QRectF(9 * k, 9 * k, 13 * k, 13 * k), 2 * k, 2 * k)
        clip = QPainterPath()
        clip.addRect(QRectF(0, 0, 48, 48))
        hole = QPainterPath()
        hole.addRect(QRectF(6.5 * k, 6.5 * k, 48, 48))
        painter.setClipPath(clip.subtracted(hole))
        painter.drawRoundedRect(QRectF(2 * k, 2 * k, 13 * k, 13 * k), 2 * k, 2 * k)

    return _draw_icon(paint)


def _check_icon() -> QIcon:
    def paint(painter, k):
        pen = QPen(QColor("#e8e0d5"))
        pen.setWidthF(2.5 * k)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(pen)
        painter.drawPolyline(
            QPolygonF([QPointF(4 * k, 12 * k), QPointF(9 * k, 17 * k), QPointF(20 * k, 6 * k)])
        )

    return _draw_icon(paint)


def _merge_bin(src: Path, dst: Path) -> None:
    for root, _dirs, files in os.walk(src):
        target_dir = dst / Path(root).relative_to(src)
        target_dir.mkdir(parents=True, exist_ok=True)
        for name in files:
            os.replace(Path(root) / name, target_dir / name)


def _launch_app() -> None:
    subprocess.Popen([str(APP_EXE)], cwd=str(INSTALL_DIR))


def _create_shortcut() -> None:
    programs = Path(os.environ["APPDATA"]) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
    lnk = programs / f"{APP_NAME}.lnk"
    lnk_ps = str(lnk).replace("'", "''")
    exe_ps = str(APP_EXE).replace("'", "''")
    dir_ps = str(INSTALL_DIR).replace("'", "''")
    ps = (
        f"$s=(New-Object -COM WScript.Shell).CreateShortcut('{lnk_ps}');"
        f"$s.TargetPath='{exe_ps}';"
        f"$s.WorkingDirectory='{dir_ps}';"
        f"$s.IconLocation='{exe_ps}';"
        f"$s.Save()"
    )
    subprocess.run(
        ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
        creationflags=subprocess.CREATE_NO_WINDOW,
        check=False,
    )


def _register_uninstall() -> None:
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
    except OSError:
        pass


class Installer(QThread):
    progress = Signal(int)
    status = Signal(str)
    failed = Signal()
    done = Signal()

    def run(self) -> None:
        try:
            archive = Path(tempfile.gettempdir()) / "ThrowbackLauncher-App.zip"
            self._download(PAYLOAD_URL, archive)
            self._extract(archive, INSTALL_DIR)
            archive.unlink(missing_ok=True)
            _create_shortcut()
            _register_uninstall()
            self.done.emit()
        except Exception:
            self.failed.emit()

    def _download(self, url: str, dest: Path) -> None:
        req = urllib.request.Request(url, headers={"User-Agent": APP_NAME})
        with urllib.request.urlopen(req, timeout=30) as r, open(dest, "wb") as f:
            total = int(r.headers.get("Content-Length") or 0)
            read = 0
            last = -1
            while True:
                chunk = r.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
                read += len(chunk)
                self.progress.emit(int(read * 90 / total) if total else 0)
                if read // 100_000 != last:
                    last = read // 100_000
                    self.status.emit(f"Downloading {read / 1_000_000:.1f} MB")

    def _extract(self, archive: Path, dest: Path) -> None:
        staging = dest.parent / (dest.name + ".new")
        shutil.rmtree(staging, ignore_errors=True)
        staging.mkdir(parents=True)
        with zipfile.ZipFile(archive) as z:
            members = z.infolist()
            for i, member in enumerate(members):
                z.extract(member, staging)
                self.progress.emit(90 + int((i + 1) * 10 / len(members)))
                name = member.filename.rstrip("/").rsplit("/", 1)[-1]
                if name:
                    self.status.emit(name)
        dest.mkdir(parents=True, exist_ok=True)
        entries = sorted(staging.iterdir(), key=lambda e: e.name == APP_EXE.name)
        for entry in entries:
            target = dest / entry.name
            if entry.name.lower() == "bin":
                _merge_bin(entry, target)
                continue
            if target.is_dir():
                shutil.rmtree(target)
            else:
                target.unlink(missing_ok=True)
            entry.rename(target)
        shutil.rmtree(staging, ignore_errors=True)


class ProgressButton(QPushButton):
    def __init__(self, text: str) -> None:
        super().__init__(text)
        self._progress = 0
        self._failed = False
        self._hover = False

    def set_progress(self, value: int) -> None:
        self._progress = value
        self.update()

    def set_failed(self) -> None:
        self._failed = True
        self.update()

    def enterEvent(self, event) -> None:
        self._hover = True
        self.update()

    def leaveEvent(self, event) -> None:
        self._hover = False
        self.update()

    def paintEvent(self, event) -> None:
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        rect = QRectF(self.rect())
        path = QPainterPath()
        path.addRoundedRect(rect, 6, 6)
        if self._failed:
            painter.fillPath(path, QColor("#4a4a5a"))
        else:
            painter.fillPath(path, QColor("#a01020"))
            width = rect.width() * self._progress / 100
            if width > 0:
                painter.setClipRect(QRectF(0, 0, width, rect.height()))
                hovered = self.isEnabled() and self._hover
                painter.fillPath(path, QColor("#a01020" if hovered else "#c0152a"))
                painter.setClipping(False)
        painter.setPen(QColor("#8a8a95") if self._failed else QColor("white"))
        painter.setFont(self.font())
        painter.drawText(rect, Qt.AlignCenter, self.text())


class Loader(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.setWindowFlags(Qt.FramelessWindowHint)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setStyleSheet(STYLE)
        self.setFixedWidth(480)
        self._drag = None

        card = QFrame()
        card.setObjectName("card")
        card.setAttribute(Qt.WA_StyledBackground, True)
        shell = QVBoxLayout(self)
        shell.setContentsMargins(0, 0, 0, 0)
        shell.addWidget(card)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(24, 24, 24, 24)
        layout.setSpacing(11)

        title = QLabel("Add an antivirus exclusion")
        title.setObjectName("title")
        body = QLabel(
            "Windows Security and other antivirus can flag the Launcher and its "
            "game files as false positives and delete them. Add this folder as an "
            "exclusion to prevent that."
        )
        body.setObjectName("body")
        body.setWordWrap(True)

        path_box = QFrame()
        path_box.setObjectName("path")
        path_box.setAttribute(Qt.WA_StyledBackground, True)
        path_text = QLabel(str(INSTALL_DIR))
        path_text.setObjectName("pathtext")
        path_text.setTextInteractionFlags(Qt.TextSelectableByMouse)
        self._copy = QPushButton()
        self._copy.setObjectName("copy")
        self._copy.setIcon(_copy_icon())
        self._copy.setIconSize(QSize(16, 16))
        self._copy.setToolTip("Copy path")
        self._copy.setCursor(Qt.PointingHandCursor)
        self._copy.clicked.connect(self._copy_path)
        path_row = QHBoxLayout(path_box)
        path_row.setContentsMargins(10, 2, 5, 2)
        path_row.setSpacing(6)
        path_row.addWidget(path_text, 1)
        path_row.addWidget(self._copy)

        steps = QVBoxLayout()
        steps.setSpacing(6)
        for index, html in enumerate(STEPS, 1):
            num = QLabel(f"{index}.")
            num.setObjectName("stepnum")
            num.setFixedWidth(14)
            text = QLabel(html)
            text.setObjectName("body")
            text.setTextFormat(Qt.RichText)
            text.setWordWrap(True)
            row = QHBoxLayout()
            row.setSpacing(8)
            row.addWidget(num, 0, Qt.AlignTop)
            row.addWidget(text, 1)
            steps.addLayout(row)

        self._status = QLabel("Downloading")
        self._status.setObjectName("status")

        self._cont = ProgressButton("Continue")
        self._cont.setEnabled(False)
        self._cont.setFont(_button_font())
        self._cont.setFixedHeight(30)
        self._cont.setMinimumWidth(104)
        self._cont.clicked.connect(self._finish)
        self._close = QPushButton("Close")
        self._close.setObjectName("close")
        self._close.setFont(_button_font())
        self._close.setFixedHeight(30)
        self._close.setMinimumWidth(84)
        self._close.setCursor(Qt.PointingHandCursor)
        self._close.clicked.connect(QApplication.quit)
        button_row = QHBoxLayout()
        button_row.setSpacing(8)
        button_row.addWidget(self._status, 0, Qt.AlignVCenter)
        button_row.addStretch(1)
        button_row.addWidget(self._close)
        button_row.addWidget(self._cont)

        header = QVBoxLayout()
        header.setSpacing(6)
        header.addWidget(title)
        header.addWidget(body)
        layout.addLayout(header)
        layout.addWidget(path_box)
        layout.addLayout(steps)
        layout.addLayout(button_row)

        self._installer = Installer()
        self._installer.progress.connect(self._cont.set_progress)
        self._installer.status.connect(self._status.setText)
        self._installer.failed.connect(self._on_failed)
        self._installer.done.connect(self._on_done)

    def _center(self) -> None:
        geo = QApplication.primaryScreen().availableGeometry()
        self.move(geo.center() - self.rect().center())

    def begin(self) -> None:
        self._center()
        self._installer.start()

    def _on_failed(self) -> None:
        self._cont.set_failed()
        self._status.setText("Install failed")
        QTimer.singleShot(4000, QApplication.quit)

    def _on_done(self) -> None:
        self._cont.set_progress(100)
        self._cont.setEnabled(True)
        self._cont.setCursor(Qt.PointingHandCursor)
        self._status.setText("Done")

    def _copy_path(self) -> None:
        QApplication.clipboard().setText(str(INSTALL_DIR))
        self._copy.setIcon(_check_icon())
        QTimer.singleShot(1200, lambda: self._copy.setIcon(_copy_icon()))

    def _finish(self) -> None:
        _launch_app()
        QApplication.quit()

    def mousePressEvent(self, event) -> None:
        if event.button() == Qt.LeftButton:
            self._drag = event.globalPosition().toPoint() - self.frameGeometry().topLeft()

    def mouseMoveEvent(self, event) -> None:
        if self._drag is not None and event.buttons() & Qt.LeftButton:
            self.move(event.globalPosition().toPoint() - self._drag)

    def mouseReleaseEvent(self, event) -> None:
        self._drag = None

    def keyPressEvent(self, event) -> None:
        if event.key() == Qt.Key_Escape:
            QApplication.quit()


def main() -> int:
    if APP_EXE.exists():
        _launch_app()
        return 0
    app = QApplication(sys.argv)
    lock = QLockFile(str(Path(tempfile.gettempdir()) / "ThrowbackLauncher-loader.lock"))
    lock.setStaleLockTime(0)
    if not lock.tryLock(0):
        return 0
    _load_fonts()
    loader = Loader()
    loader.show()
    app.processEvents()
    loader.begin()
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
