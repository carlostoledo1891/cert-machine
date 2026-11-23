#!/bin/sh
# native.sh — the native program of T2-COMMANDS.md, built from this folder's R7Cnf.lean and R7CnfMain.lean with the toolchain
# alone (no Mathlib on the path), run on the given rows in ONE call; shasum hashes the bytes written; each hash is compared
# with the ledger's cnf_sha256. The level of each row is read from the ledger.
# usage: sh native.sh WORKDIR IDX ...        WORKDIR must not exist. Nothing is written in this folder.
set -u
here=$(cd "$(dirname "$0")" && pwd)
W=$1; shift
mkdir "$W" || exit 2
B=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin
PATH="$B:$PATH"; export PATH
ledger="$here/../prod-out/prod.tsv"
cp "$here/R7Cnf.lean" "$here/R7CnfMain.lean" "$W/"
cd "$W"
lean --version
echo "sources: R7Cnf.lean $(shasum -a 256 R7Cnf.lean | cut -c1-64), R7CnfMain.lean $(shasum -a 256 R7CnfMain.lean | cut -c1-64)"
echo "inputs: cores_e85.g6 $(shasum -a 256 "$here/../cores_e85.g6" | cut -c1-64), configs.bin $(shasum -a 256 "$here/../configs.bin" | cut -c1-64), prod.tsv $(shasum -a 256 "$ledger" | cut -c1-64)"
lean -o R7Cnf.olean -c R7Cnf.c R7Cnf.lean;                  echo "lean -o R7Cnf.olean -c R7Cnf.c R7Cnf.lean: exit $?"
LEAN_PATH="$W" lean -c R7CnfMain.c R7CnfMain.lean;         echo "LEAN_PATH=\$PWD lean -c R7CnfMain.c R7CnfMain.lean: exit $?"
leanc -O3 -o r7cnf_lean R7Cnf.c R7CnfMain.c;               echo "leanc -O3 -o r7cnf_lean R7Cnf.c R7CnfMain.c: exit $?"
echo "R7Cnf.olean $(shasum -a 256 R7Cnf.olean | cut -c1-64); R7Cnf.c $(shasum -a 256 R7Cnf.c | cut -c1-64); R7CnfMain.c $(shasum -a 256 R7CnfMain.c | cut -c1-64)"
args=""
for idx in "$@"; do
  lvl=$(awk -F'\t' -v i="$idx" '$1 == i { print $4; exit }' "$ledger")
  args="$args $idx:$lvl"
done
mkdir out
/usr/bin/time -l ./r7cnf_lean "$here/../cores_e85.g6" "$here/../configs.bin" out $args 2> time.txt; echo "r7cnf_lean, one call, $# rows: exit $?"
echo "time: $(head -1 time.txt | tr -s ' '); peak memory $(awk '/maximum resident set size/ { printf "%.0f MB", $1 / 1048576 }' time.txt)"
ok=0; bad=0
for a in $args; do
  idx=${a%:*}; lvl=${a#*:}
  want=$(awk -F'\t' -v i="$idx" '$1 == i { print $6; exit }' "$ledger")
  got=$(shasum -a 256 "out/${idx}_${lvl}.cnf" | cut -c1-64)
  n=$(wc -c < "out/${idx}_${lvl}.cnf" | tr -d ' ')
  if [ "$got" = "$want" ]; then ok=$((ok + 1)); echo "idx $idx level $lvl bytes $n sha256 $got SAME"; else bad=$((bad + 1)); echo "idx $idx level $lvl bytes $n sha256 $got ledger $want DIFFERENT"; fi
done
echo "rows $((ok + bad)), same $ok, different $bad"
