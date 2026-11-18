#!/bin/bash
# pod-extra2-run3.sh — as tester (2026-11-18 05:00 UTC): what was left of pod-extra2-run2.sh when the memory guard
# stopped it at 04:59:25 UTC (the registered step's second nanoda attempt was passing 89 GB; the optional checks held
# 23.5 GB). Same commands and tools as run2; the steps here write to /results/extra2/r3. Left to do: the Google/CMU
# controls S3, P1-P5 and S0 (S1 and S2 were refused in r2), comparator on the community proof with the true
# statement (no nanoda), then con-leche on each export, alone on the pod, one at a time.
set -uo pipefail
export HOME=/home/tester
X=/home/tester/x; O=/results/extra2/r3; mkdir -p $O
DEADLINE=${DEADLINE:-2026-11-18T13:00:00Z}
EL=$HOME/.elan/toolchains
TA=$EL/leanprover--lean4---v4.33.1/bin; TB=$EL/leanprover--lean4---v4.34.1/bin
GSRC=/home/tester/work/4738aeff839d; CSRC=/home/tester/work/aaf109266438
G=$X/gcmu; C=$CSRC/canonical
BASEPATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin
LANDRUN=$X/bin/landrun
dl=$(date -u -d "$DEADLINE" +%s)
left() { echo $(( dl - $(date +%s) )); }
step() { # name timeout-seconds dir toolchain-bin command...
  local n=$1 to=$2 dir=$3 tb=$4; shift 4
  local l; l=$(left); [ "$l" -lt 120 ] && { echo "not started: the deadline $DEADLINE" > $O/$n.skipped; return 1; }
  [ "$to" -gt "$l" ] && to=$l
  date -u +%FT%TZ > $O/$n.start; echo "$*" > $O/$n.cmd
  ( cd "$dir" && ulimit -s 16777216 2>/dev/null || ulimit -s unlimited 2>/dev/null; echo "stack limit: $(ulimit -s)" > $O/$n.env
    exec env -i HOME=$HOME PATH="$tb:$X/bin:$BASEPATH" COMPARATOR_LANDRUN=$LANDRUN COMPARATOR_LEAN4EXPORT="${L4E:-}" COMPARATOR_NANODA="${NANODA:-}" \
      LEAN_ABORT_ON_PANIC=1 nice -n 10 /usr/bin/time -v timeout "$to" "$@" ) > $O/$n.out 2> $O/$n.err
  echo $? > $O/$n.exit; date -u +%FT%TZ > $O/$n.end
}
date -u +%FT%TZ > $O/_run.start
chainA() {
  NANODA=$X/nanoda-gcmu/target/release/nanoda_bin; L4E=$X/cmp433/.lake/packages/lean4export/.lake/build/bin/lean4export
  { echo "comparator: $(git -C $X/cmp433 rev-parse HEAD) built with $(cat $X/cmp433/lean-toolchain)"; echo "lean4export: $(git -C $X/cmp433/.lake/packages/lean4export rev-parse HEAD)"
    echo "nanoda: $(git -C $X/nanoda-gcmu rev-parse HEAD); diff lines $(git -C $X/nanoda-gcmu diff | wc -l); sha256 $(sha256sum $NANODA | cut -c1-64)"
    echo "landrun: $($LANDRUN --version 2>&1)"; echo "kernel: $(uname -r)"; echo "lean: $($TA/lean --version)"; } > $O/A.env.txt 2>&1
  for c in S3_StrictLt P1_Sorry P2_AddedAxiom P3_NativeDecide P4_ExtraAxiomTransitive P5_DefinitionSwap S0_IdenticalCopy; do
    step A2.control-$c 7200 $G $TA lake env $X/cmp433/.lake/build/bin/comparator replay/configs/controls/$c.json
  done
}
chainC() {
  NANODA=$CSRC/tools/nanoda_lib/target/release/nanoda_bin; L4E=$X/cmp434/.lake/packages/lean4export/.lake/build/bin/lean4export
  sed 's/"enable_nanoda": true/"enable_nanoda": false/' $C/xreplay-configs/positive.json > $C/xreplay-configs/positive-no-nanoda.json
  sed 's/"enable_nanoda": true/"enable_nanoda": false/' $C/xreplay-configs/control-kappa.json > $C/xreplay-configs/control-kappa-no-nanoda.json
  { echo "comparator: $(git -C $X/cmp434 rev-parse HEAD) built with $(cat $X/cmp434/lean-toolchain)"; echo "lean4export: $(git -C $X/cmp434/.lake/packages/lean4export rev-parse HEAD)"
    echo "nanoda: not enabled"; echo "landrun: $($LANDRUN --version 2>&1)"; echo "kernel: $(uname -r)"; echo "lean: $($TB/lean --version)"; sha256sum $C/xreplay-configs/*.json $C/XReplay/*.lean $C/lakefile.toml; } > $O/C.env.txt 2>&1
  step C1.comparator-positive 28800 $C $TB lake env $X/cmp434/.lake/build/bin/comparator xreplay-configs/positive-no-nanoda.json
}
chainL() { # con-leche, alone
  local CL=$X/con-leche/.lake/build/bin/con-leche
  step A3.con-leche-gcmu 10800 /tmp $TB env CON_LECHE_VERBOSE=1 $CL --jobs=8 $GSRC/f1.export
  step C2.con-leche-community 10800 /tmp $TB env CON_LECHE_VERBOSE=1 $CL --jobs=8 $CSRC/f1.export
}
until [ -f /results/extra/community-nanoda-resumed.done ]; do sleep 20; done
chainA & pa=$!
chainC & pc=$!
wait $pa $pc
chainL
date -u +%FT%TZ > $O/_run.done
