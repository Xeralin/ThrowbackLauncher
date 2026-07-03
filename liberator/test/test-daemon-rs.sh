#!/bin/sh
set -e
cd "$(dirname "$0")"
WINE="${WINE:-$HOME/.local/share/Steam/steamapps/common/Proton - Experimental/files/bin/wine}"
WINESERVER="$(dirname "$WINE")/wineserver"
ZIG="${ZIG:-$HOME/.local/zig/zig-x86_64-linux-0.16.0/zig}"
RUST_EXE="${RUST_EXE:-../target/x86_64-pc-windows-gnu/release/liberator.exe}"
[ -x "$WINE" ] || { echo "wine not found: $WINE"; exit 1; }
[ -f "$RUST_EXE" ] || { echo "rust exe not found: $RUST_EXE"; exit 1; }

export WINEPREFIX="$PWD/.wpfx-daemon-rs" WINEDEBUG=-all DISPLAY=
rm -rf "$WINEPREFIX" dummy_build.exe daemon-port-rs liberator-rs.exe

"$ZIG" cc -target x86_64-windows-gnu -O2 -o dummy_build.exe dummy_build.c -lkernel32
rm -f dummy_build.pdb dummy_build.lib
cp "$RUST_EXE" liberator-rs.exe
win() { printf 'Z:%s' "$(printf '%s' "$1" | tr '/' '\\')"; }

"$WINE" wineboot -i >/dev/null 2>&1 || true
"$WINE" dummy_build.exe >/dev/null 2>&1 &
dummy=$!

RUNNER_TARGET=dummy_build.exe "$WINE" liberator-rs.exe --port-file "$(win "$PWD/daemon-port-rs")" >/dev/null 2>&1 &
daemon=$!

echo "=== mock client (host python, connects to WINE Rust-daemon loopback) ==="
python3 mock_client.py "$PWD/daemon-port-rs" || true

kill "$daemon" "$dummy" 2>/dev/null || true
"$WINESERVER" -k >/dev/null 2>&1 || true
"$WINESERVER" -w >/dev/null 2>&1 || true
rm -rf "$WINEPREFIX" dummy_build.exe daemon-port-rs liberator-rs.exe
