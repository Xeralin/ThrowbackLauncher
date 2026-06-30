import json

from PySide6.QtCore import QObject
from PySide6.QtWebEngineWidgets import QWebEngineView


class EventForwarder(QObject):
    """Pushes backend events to the web frontend via page.runJavaScript.

    QWebChannel's spontaneous C++->JS property/signal push is unreliable in this
    embedded setup; runJavaScript host->JS is not, so live events are delivered
    as a DOM CustomEvent the frontend listens for. Slots still go through
    QWebChannel (JS->C++ is reliable).
    """

    def __init__(self, view: QWebEngineView, target: str) -> None:
        super().__init__(view)
        self._view = view
        self._target = target

    def send(self, event: str, *args: object) -> None:
        detail = json.dumps({"target": self._target, "event": event, "args": list(args)})
        self._view.page().runJavaScript(
            f"window.dispatchEvent(new CustomEvent('throwback:event',{{detail:{detail}}}))"
        )
