#!/bin/sh
# t2_sample.sh — T2 on a sample: the Lean definition (interpreted, lean --run) writes the bytes; shasum hashes them; the hash is
# compared with the ledger's cnf_sha256. usage: sh t2_sample.sh OUTDIR IDX ...   (the level is read from the ledger)
set -eu
here=$(cd "$(dirname "$0")" && pwd)
out=$1; shift
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
LEAN=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin/lean
mkdir -p "$out"
ok=0; bad=0
for idx in "$@"; do
  row=$(awk -F'\t' -v i="$idx" '$1 == i { print $4 "\t" $6; exit }' "$here/../prod-out/prod.tsv")
  lvl=$(printf '%s' "$row" | cut -f1); want=$(printf '%s' "$row" | cut -f2)
  (cd "$here" && LEAN_PATH="$here/build:$LP" "$LEAN" --run R7CnfMain.lean ../cores_e85.g6 ../configs.bin "$out" "$idx:$lvl")
  got=$(shasum -a 256 "$out/${idx}_${lvl}.cnf" | cut -d' ' -f1)
  if [ "$got" = "$want" ]; then ok=$((ok + 1)); echo "idx $idx level $lvl SAME"; else bad=$((bad + 1)); echo "idx $idx level $lvl DIFFERENT"; fi
  : > "$out/${idx}_${lvl}.cnf"
done
echo "rows $((ok + bad)), same $ok, different $bad"
