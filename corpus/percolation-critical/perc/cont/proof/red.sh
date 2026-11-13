#!/bin/bash
# red.sh — the red controls of C4 that need no Comparator. Run on the pod in /root/cont/percolation after the build.
# Each Red*.lean is elaborated with `lake env lean`; Red0 (the true statement) must exit 0, every other must exit != 0.
export PATH=$HOME/.elan/bin:$PATH
cd /root/cont/percolation
OUT=/root/cont/logs/red; mkdir -p $OUT; : > $OUT/summary.txt
for f in /root/cont/red/Red*.lean; do
  n=$(basename $f .lean); S=$(date +%s)
  lake env lean $f > $OUT/$n.log 2>&1; E=$?
  echo "$n exit=$E seconds=$(( $(date +%s) - S )) first: $(grep -m1 -E 'error' $OUT/$n.log | cut -c1-160)" >> $OUT/summary.txt
done
# forbidden tokens over the proof files (must print nothing)
grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" ContProof.lean UnitAux.lean ContPlanted.lean > $OUT/tokens.txt; echo "tokens grep exit=$? (1 = no match) lines=$(wc -l < $OUT/tokens.txt)" >> $OUT/summary.txt
cat $OUT/summary.txt
