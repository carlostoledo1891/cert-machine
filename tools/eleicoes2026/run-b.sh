#!/bin/sh
# decider B over every pinned bweb zip of round $1: one process per UF (4 at a time), then the merge
set -e
R=$1; ROOT=$(cd "$(dirname "$0")/../.." && pwd); RAW=$ROOT/corpus/eleicoes2026/raw; OUT=$RAW/derived/b$R; SUM=$ROOT/corpus/eleicoes2026/derived; mkdir -p "$OUT"
export ROOT OUT
ls "$RAW"/bweb_${R}t_*.zip | xargs -P 4 -n 1 sh "$ROOT/tools/eleicoes2026/b-one.sh"
node "$ROOT/instruments/eleicoes2026/bu_b.js" --merge "$OUT"/*.json > "$SUM/r$R-b.json"
echo "decider B: round $R merged into corpus/eleicoes2026/derived/r$R-b.json"
