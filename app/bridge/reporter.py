from collections.abc import Callable


class SignalReporter:
    def __init__(self, emit: Callable[[str], None] | None = None,
                 progress_emit: Callable[[float], None] | None = None) -> None:
        self._emit = emit
        self._progress_emit = progress_emit

    def __enter__(self) -> "SignalReporter":
        return self

    def __exit__(self, *exc: object) -> bool:
        return False

    def update(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)

    def succeed(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)

    def fail(self, text: str) -> None:
        if self._emit is not None:
            self._emit(text)

    def progress(self, fraction: float) -> None:
        if self._progress_emit is not None:
            self._progress_emit(fraction)
