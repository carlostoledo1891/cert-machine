#!/bin/sh
# one zip through decider B (called by run-b.sh with ROOT and OUT set)
set -e
uf=$(basename "$1" | cut -d_ -f3)
unzip -p "$1" '*.csv' | node "$ROOT/instruments/eleicoes2026/bu_b.js" "$uf" > "$OUT/$uf.json"
