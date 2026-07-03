#!/bin/sh
set -e
cd "$(dirname "$0")"
export PATH="$HOME/.cargo/bin:$PATH"
cargo zigbuild --release --target x86_64-pc-windows-gnu
mkdir -p ../bin/liberator
cp target/x86_64-pc-windows-gnu/release/liberator.exe ../bin/liberator/Liberator.exe
echo "built + deployed -> ../bin/liberator/Liberator.exe"
