#!/bin/sh
set -e
cd "$(dirname "$0")"
RS="${RS:-../target/release/verify}"
PORT="${PORT:-../../../Liberator/Dev}"
E="$PORT/extract"
ORACLE="$PORT/oracle"
OUT="out"
mkdir -p "$OUT"

diffcheck() {
    if diff -q "$1" "$2" >/dev/null; then
        echo "$3"
    else
        echo "$4: MISMATCH"
        diff "$1" "$2" | head -20
        exit 1
    fi
}

"$RS" descramble selfcheck
"$RS" descramble "$ORACLE/inputs.txt" "$OUT/rust-out.txt"
diffcheck "$ORACLE/oracle-out.txt" "$OUT/rust-out.txt" \
    "A: descramble byte-identical over $(wc -l < "$OUT/rust-out.txt") inputs" A

"$RS" descramble patches "$E/patches.txt" "$OUT/rust-patches.txt"
diffcheck "$E/compiled-patches.txt" "$OUT/rust-patches.txt" \
    "B: $(wc -l < "$OUT/rust-patches.txt") static patches byte-identical vs real compiled engine" B

"$RS" engine selftest
"$RS" engine emit "$OUT/rust-engine-emit.txt"
diffcheck "$E/compiled-patches.txt" "$OUT/rust-engine-emit.txt" \
    "C: assembled engine emits $(wc -l < "$OUT/rust-engine-emit.txt") patches byte-identical vs real compiled engine" C

"$RS" chain "$E/chains.txt" "$OUT/rust-chains.txt"
diffcheck "$E/chains-compiled.txt" "$OUT/rust-chains.txt" \
    "D: $(wc -l < "$OUT/rust-chains.txt") pointer-chains byte-identical vs real compiled engine (mock memory)" D

"$RS" buildscan "$E/corpus.txt" "$OUT/rust-buildscan.txt"
diffcheck "$E/buildscan-regex.txt" "$OUT/rust-buildscan.txt" \
    "E: build-string matcher identical to real C# regex over $(wc -l < "$OUT/rust-buildscan.txt") cases" E

if [ -f "$E/ripbufs.bin" ]; then
    "$RS" scanrip "$E/ripbufs.bin" "$OUT/rust-rip.txt"
    diffcheck "$E/rip-oracle.txt" "$OUT/rust-rip.txt" \
        "F: ScanRipRel fixups byte-identical to real compiled engine over $(wc -l < "$OUT/rust-rip.txt") buffers" F
else
    echo "F: SKIPPED (no ripbufs.bin)"
fi

if [ -f "$E/names-corpus.txt" ]; then
    "$RS" gametype_names "$E/names-corpus.txt" "$OUT/rust-names.txt"
    diffcheck "$E/names-oracle.txt" "$OUT/rust-names.txt" \
        "G: gametype display-names identical to real GetMapDisplayName/NormalizeGametypeName over $(wc -l < "$OUT/rust-names.txt") names" G
fi

if [ -f "$E/memread-corpus.txt" ]; then
    "$RS" memread "$E/memread-corpus.txt" "$OUT/rust-memread.txt"
    diffcheck "$E/memread-oracle.txt" "$OUT/rust-memread.txt" \
        "H: tree read-primitives identical to real MemoryHandler over $(wc -l < "$OUT/rust-memread.txt") reads (mock memory)" H
fi
