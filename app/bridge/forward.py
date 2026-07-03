import json

from PySide6.QtCore import QObject, QTimer
from PySide6.QtWebEngineCore import QWebEnginePage
from PySide6.QtWebEngineWidgets import QWebEngineView


class EventForwarder(QObject):
    def __init__(self, view: QWebEngineView, target: str) -> None:
        super().__init__(view)
        self._view = view
        self._target = target
        self._pending: list[str] = []
        self._timer = QTimer(self)
        self._timer.setInterval(50)
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self._flush)

    def _dispatch(self, details: list[str]) -> None:
        page = self._view.page()
        if page.lifecycleState() == QWebEnginePage.LifecycleState.Discarded:
            return
        js = ";".join(
            f"window.dispatchEvent(new CustomEvent('throwback:event',{{detail:{detail}}}))"
            for detail in details
        )
        page.runJavaScript(js)

    def _flush(self) -> None:
        if self._pending:
            pending, self._pending = self._pending, []
            self._dispatch(pending)

    def send(self, event: str, *args: object) -> None:
        self._flush()
        self._dispatch([json.dumps({"target": self._target, "event": event, "args": list(args)})])

    def send_buffered(self, event: str, *args: object) -> None:
        self._pending.append(json.dumps({"target": self._target, "event": event, "args": list(args)}))
        if not self._timer.isActive():
            self._timer.start()
