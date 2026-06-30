# Launcher

A Rainbow Six Siege season launcher. **Qt desktop app** (PySide6 + QtWebEngine) with a
**Next.js + Tailwind + TypeScript** frontend and the Python `app/` backend, bridged
via QWebChannel.

```
web/         Next.js + Tailwind frontend (static export → web/out/)
app/         PySide6 host + Python backend: window, loopback server,
             QWebChannel bridges (bridge/), shared logic (core/)
```

## Prerequisites

- Node + pnpm (frontend)
- Python 3 (backend / host)

## Setup (once)

```bash
pnpm -C web install
python3 -m venv .venv
.venv/bin/pip install -r app/requirements.txt
```

## Run the app

```bash
./run.sh
```

This builds the frontend and opens the desktop window (it serves `web/out/` over a
loopback port internally — you do **not** start a web server yourself).

## Frontend-only preview (design iteration)

```bash
pnpm -C web dev        # http://localhost:3000
```

Fast hot-reload for UI work, but the QWebChannel bridge is absent in a plain browser,
so real data (seasons, settings) shows a loading state. Use `./run.sh` to see real data.
