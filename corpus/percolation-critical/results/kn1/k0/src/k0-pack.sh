#!/bin/bash
# k0-pack.sh — run ON THE POD after `k0-all.sh all`: one negative control of the per-definition verdict, then the
# K0 record gathered in /root/kn1/k0record with SHA256SUMS over every file of it, and /root/kn1/k0record.tar.
#   run-final/  the last full run (logs, exit codes, seconds, split modules and their logs, definitions.tsv, axioms)
#   run1/       the first full run (before Axioms.lean listed every theorem; kept, not deleted)
#   stage/      the three compiles of one combined scratch file made while the lab's build was still running
#   tree/       our files as they sit in the working tree (sealed statement files, KN1/K0/*.lean, lakefile.toml, pins)
#   src/        the K0 sources as uploaded (the desk's perc/kn1/k0/)
#   env/        the environment build's own exit codes and seconds (read from /root/k1/runs, nothing written there)
#   control/    the negative control
set -eu
export PATH=$HOME/.elan/bin:$PATH
WORK=/root/kn1/percolation; OUT=/root/kn1/k0; REC=/root/kn1/k0record
# Usage: k0-pack.sh gather   (the control and the copies; refuses if the record folder exists)
#        k0-pack.sh seal     (adds /root/kn1/K0-RESULTS.md, writes SHA256SUMS and the tar; may be repeated)
MODE="${1:?usage: k0-pack.sh gather|seal}"
if [ "$MODE" = gather ]; then
[ -e "$REC" ] && { echo "$REC exists: move it aside first"; exit 1; }
mkdir -p "$REC"/{run-final,run1,stage,tree/KN1/K0,src,env,control}
# negative control: a definition with one name misspelt must come out as a failure of the same test
C="$REC/control"
sed 's/prob G p (connEvent G o b) ≥/probb G p (connEvent G o b) ≥/' "$OUT/split/Printed1_01_Conjecture1.lean" > "$C/Printed1_01_Conjecture1_misspelt.lean"
cmp -s "$OUT/split/Printed1_01_Conjecture1.lean" "$C/Printed1_01_Conjecture1_misspelt.lean" && { echo "control not planted"; exit 1; }
( cd "$WORK" && lake env lean "$C/Printed1_01_Conjecture1_misspelt.lean" > "$C/Printed1_01_Conjecture1_misspelt.log" 2>&1; echo $? > "$C/Printed1_01_Conjecture1_misspelt.exit" ) || true
rc=$(cat "$C/Printed1_01_Conjecture1_misspelt.exit")
if [ "$rc" != 0 ] && grep -q error "$C/Printed1_01_Conjecture1_misspelt.log"; then echo "negative control: REFUSED (exit $rc), as it must be" | tee "$C/verdict.txt"; else echo "negative control: NOT REFUSED — the per-definition verdict proves nothing" | tee "$C/verdict.txt"; fi
cp -a "$OUT/." "$REC/run-final/"; cp /root/kn1/k0-all.out "$REC/run-final/k0-all.out"
cp -a /root/kn1/attic/run1/k0/. "$REC/run1/"; cp /root/kn1/attic/run1/k0-all.out "$REC/run1/k0-all.out"
cp /root/kn1/stage/* "$REC/stage/"
cp "$WORK/Printed.lean" "$WORK/Printed1.lean" "$WORK/Planted1.lean" "$WORK/lakefile.toml" "$WORK/lean-toolchain" "$WORK/lake-manifest.json" "$REC/tree/"
cp "$WORK"/KN1/K0/*.lean "$REC/tree/KN1/K0/"
cp -a /root/kn1/k0src/. "$REC/src/"
cp /root/k1/runs/*.exit /root/k1/runs/*.seconds /root/k1/runs/sha256.txt /root/k0env.out "$REC/env/"
echo "gathered: $(find "$REC" -type f | wc -l) files"
fi
[ "$MODE" = seal ] || exit 0
for f in K0-RESULTS.md; do [ -f "/root/kn1/$f" ] && cp "/root/kn1/$f" "$REC/"; done
( cd "$REC" && find . -type f ! -name SHA256SUMS | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS && wc -l SHA256SUMS )
tar cf /root/kn1/k0record.tar -C /root/kn1 k0record
sha256sum /root/kn1/k0record.tar
