#!/bin/bash
# Step 5, ON THE POD: the package's own drivers, in its README's order, on the stack built by setup182.sh.
# Deviations (each also in DEVIATIONS.md): (1) step5_flint_shim.py (loaded by a .pth line) in the two venvs resolves `flint` from the venv, not from
# the package's bundled macOS build; (2) a copy of the package's own libflint.24.0.dylib is placed where two producers
# hash it by path (flint/.dylibs/) — it is hashed, never loaded; (3) test_rejection_linux.py is the package's
# test_rejection.py with ONE change: the obsolete-runtime case runs under the stock python-flint 0.9.0 wheel (venv-stock)
# instead of swapping a macOS library; (4) `/bin/cp -cR` (a macOS clone flag) is GNU cp here.
# Run: nohup bash /root/s/run182.sh > /root/s/run.out 2>&1 < /dev/null &
st() { echo "$(date -u +%FT%TZ) $*" >> /root/s/runs/_status.txt; }
export LD_LIBRARY_PATH=/root/s/flint-fixed/lib
unset PYTHONOPTIMIZE
P=/root/s/pkg/prime-gaps-external-182; W=/root/s/work; R=/root/s/runs
PY=/root/s/venv-fixed/bin/python
rm -rf $W; mkdir -p $W
for v in fixed stock; do
  SP=/root/s/venv-$v/lib/python3.12/site-packages
  cp /root/s/step5_flint_shim.py $SP/step5_flint_shim.py; echo "import step5_flint_shim" > $SP/step5_flint_shim.pth
  mkdir -p $SP/flint/.dylibs && cp $P/snapshot/prime_gaps_20260903/runtime/flint/.dylibs/libflint.24.0.dylib $SP/flint/.dylibs/
done
sha256sum /root/s/flint-fixed/lib/libflint.so.*.*.* $P/snapshot/prime_gaps_20260903/runtime/flint/.dylibs/libflint.24.0.dylib > $R/libraries.sha256 2>&1
cd $P
( while true; do echo "$(date +%s) $(ps -eo rss= | awk '{s+=$1} END {print s}')" >> $R/mem.tsv; sleep 30; done ) &
SAMPLER=$!
step() { local name=$1; shift; local t0=$(date +%s); "$@" > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; st "$name exit $rc ($(cat $R/$name.seconds) s)"; return $rc; }
step repo-check-archive python3 -B /root/s/src/prime-gaps-lean/scripts/check_external_numerics.py --archive /root/s/src/pg182.zip
step check-package $PY -B check_package.py
step audit $PY -B audit.py --work $W/audits
step negative $PY -B /root/s/test_rejection_linux.py --work $W/negative
step verify $PY -B verify.py --work $W/production --jobs 3
step finish $PY -B finish.py --work $W/production --audits $W/audits --negative $W/negative --export $W/evidence
kill $SAMPLER 2>/dev/null
C=$W/production/coverage.json; L=/root/s/src/prime-gaps-lean/formal; E=/root/s/src/prime-gaps-lean/research/numerical_182/evidence/coverage.json
if [ -f $C ]; then
  sha256sum /root/s/compare182.py > $R/compare182.at-run.sha256
  step compare python3 /root/s/compare182.py --coverage $C --lean $L --published $E --output $R/compare182.json
  step red-tighten python3 /root/s/compare182.py --coverage $C --lean $L --tighten outer:17:rootUpper
  step red-drop python3 /root/s/compare182.py --coverage $C --lean $L --drop 200
fi
st "run182 done"
