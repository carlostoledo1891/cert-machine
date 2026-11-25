#!/usr/bin/env bash
# pod-compare.sh NAME... : run Comparator (Lean's kernel + nanoda, enable_nanoda true) on configs/NAME.json, one at a time.
# Phase 4's pod-compare.sh unchanged except this comment.
set -uo pipefail
T=/home/prover/tools; W=/home/prover/work; L=$W/math/lean; O=$W/compare; mkdir -p $O
export HOME=/home/prover PATH=/pin/lean/bin:/home/prover/cmpbin:/usr/local/go/bin:/usr/bin:/bin
mkdir -p /home/prover/cmpbin
ln -sf $T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export /home/prover/cmpbin/lean4export
ln -sf $T/nanoda-3a24/target/release/nanoda_bin /home/prover/cmpbin/nanoda_bin
ln -sf $T/landrun/landrun /home/prover/cmpbin/landrun
export COMPARATOR_LANDRUN=$T/landrun/landrun COMPARATOR_LEAN4EXPORT=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export COMPARATOR_NANODA=$T/nanoda-3a24/target/release/nanoda_bin RUST_MIN_STACK=1073741824 LEAN_ABORT_ON_PANIC=1
$T/landrun/landrun --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $O/landrun-test.txt 2>&1; echo "landrun probe exit $?" >> $O/landrun-test.txt
cd $L
for n in "$@"; do
  cp $W/configs/$n.json $O/$n.config.json; sha256sum $W/configs/$n.json > $O/$n.config.sha256
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $n start" >> $O/compare.log
  ( ulimit -s unlimited 2>/dev/null; /usr/bin/time -v nice -n 10 lake env $T/comparator/.lake/build/bin/comparator $O/$n.config.json ) > $O/$n.out 2> $O/$n.err
  e=$?; echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $n exit $e, peak $(grep -m1 'Maximum resident' $O/$n.err | awk '{print $NF}') kB, ok-line: $(grep -c 'Your solution is okay!' $O/$n.out $O/$n.err | tr '\n' ' ')" >> $O/compare.log
done
date -u > $O/DONE-$(echo "$@" | tr ' ' '_')
