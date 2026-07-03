#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

pnpm -C web build

exec .venv/bin/python app/main.py
