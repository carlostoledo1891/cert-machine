#!/bin/bash
# Row K: export the closure of the three theorems, then nanoda and con-leche on it (cert-machine, 2026-11-21).
set -u
here=$(cd "$(dirname "$0")" && pwd)
out=${1:?output dir}
mkdir -p "$out"
B=$HOME/.elan/toolchains/leanprover--lean4---v4.35.0/bin
cd /Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
LP=$(lake env printenv LEAN_PATH)
export LEAN_PATH="$here/build:$LP"
echo "export start $(date -u +%H:%M:%S)"
/usr/bin/time -l $B/leanexport OutsideSize -- RamseyScout.PathLemma.lemma_P RamseyScout.PathLemma.order_at_most_39 RamseyScout.PathLemma.four_outside_C4 > "$out/c35.ndjson" 2> "$out/export.time"
echo "export exit $? bytes $(wc -c < "$out/c35.ndjson") $(date -u +%H:%M:%S)"
shasum -a 256 "$out/c35.ndjson" > "$out/c35.ndjson.sha256"
cat > "$out/nanoda.json" <<J
{"export_file_path": "$out/c35.ndjson", "num_threads": 4, "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": true, "nat_extension": true, "string_extension": true, "print_success_message": true}
J
/usr/bin/time -l $B/nanoda_bin "$out/nanoda.json" > "$out/nanoda.out" 2>&1
echo "nanoda exit $? $(date -u +%H:%M:%S)"
/usr/bin/time -l $B/con-leche --verified --jobs=4 "$out/c35.ndjson" > "$out/con-leche.out" 2>&1
echo "con-leche exit $? $(date -u +%H:%M:%S)"
