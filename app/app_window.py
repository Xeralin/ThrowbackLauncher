from PySide6.QtCore import QObject, QStandardPaths, Qt, QUrl
from PySide6.QtGui import QDesktopServices
from PySide6.QtWebChannel import QWebChannel
from PySide6.QtWebEngineCore import QWebEnginePage, QWebEngineSettings
from PySide6.QtWebEngineWidgets import QWebEngineView

_INTERNAL_HOSTS = ("127.0.0.1", "localhost")


class _AppPage(QWebEnginePage):
    def acceptNavigationRequest(
        self, url: QUrl, nav_type: QWebEnginePage.NavigationType, is_main_frame: bool
    ) -> bool:
        if (
            nav_type == QWebEnginePage.NavigationType.NavigationTypeLinkClicked
            and url.scheme() in ("http", "https")
            and url.host() not in _INTERNAL_HOSTS
        ):
            QDesktopServices.openUrl(url)
            return False
        return super().acceptNavigationRequest(url, nav_type, is_main_frame)


class BrowserView(QWebEngineView):
    def __init__(self, url: str, objects: dict[str, QObject]) -> None:
        super().__init__()

        self.setContextMenuPolicy(Qt.ContextMenuPolicy.NoContextMenu)
        self.setPage(_AppPage(self))

        self.page().settings().setAttribute(
            QWebEngineSettings.WebAttribute.ScrollAnimatorEnabled, True
        )
        self.page().settings().setAttribute(
            QWebEngineSettings.WebAttribute.JavascriptCanAccessClipboard, True
        )
        self.page().newWindowRequested.connect(self._open_external_window)
        self.page().profile().downloadRequested.connect(self._accept_download)

        self._channel = QWebChannel(self.page())
        for name, obj in objects.items():
            obj.setParent(self)
            self._channel.registerObject(name, obj)
        self.page().setWebChannel(self._channel)

        self.load(QUrl(url))

    def _open_external_window(self, request) -> None:
        url = request.requestedUrl()
        if url.scheme() in ("http", "https") and url.host() not in _INTERNAL_HOSTS:
            QDesktopServices.openUrl(url)

    def _accept_download(self, request) -> None:
        request.setDownloadDirectory(
            QStandardPaths.writableLocation(QStandardPaths.StandardLocation.DownloadLocation)
        )
        request.accept()
