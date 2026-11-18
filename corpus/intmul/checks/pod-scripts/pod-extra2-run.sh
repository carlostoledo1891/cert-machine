#!/bin/bash
# pod-extra2-run.sh — run as tester on the pod, low priority (2026-11-18): the optional checks, after the tools of
# pod-extra2-tools.sh exist. Facts only, in /results/extra2/<step>.{out,err,exit,start,end}; no verdict here.
#   chain A (Google/CMU, in a COPY of the checkout, the registered one untouched):
#     A0 copy; the release's own five lakefile lines appended; replay/Replay copied to ./Replay if the lib needs it
#     A1 comparator, the release's own positive.json (nanoda on), comparator v4.33.0 built on Lean v4.33.1
#     A2 the release's nine control configs, one after the other
#     A3 con-leche master on the registered run's export
#   chain B (lean4lean, one try each): the headline module alone, then --fresh; Google/CMU first, the community
#     proof after its registered run is over
#   chain C (the community proof, IN PLACE, only after its registered run is over):
#     C1 comparator v4.34.0 on a challenge module WE wrote (the release ships none): XReplay.Challenge, and one
#        changed statement (the numerator of the saving plus one), expected refused
#     C2 con-leche master on the registered run's export
# Guards: everything stops at DEADLINE (UTC); con-leche runs one at a time; a sampler of the cgroup's anonymous
# memory kills con-leche above 100 GiB and lean4lean above 112 GiB and says so in /results/extra2/_guard.txt.
# No systemd on the pod: the stack limit is `ulimit -s`, and comparator's README property
# RestrictAddressFamilies=~AF_UNIX is NOT applied. landrun runs with comparator's own --best-effort on a kernel
# whose Landlock ABI is 4.
set -uo pipefail
export HOME=/home/tester
X=/home/tester/x; O=/results/extra2; mkdir -p $O
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
ok() { [ "$(cat $O/$1.exit 2>/dev/null)" = 0 ]; }
date -u +%FT%TZ > $O/_run.start
until [ -f $O/tools/_done ] && [ -f $O/tools/lean4lean2.end ]; do sleep 20; done

# ---------- the guard
( while [ "$(left)" -gt 0 ] && [ ! -f $O/_run.done ]; do
    a=$(awk '$1=="anon"{print $2}' /sys/fs/cgroup/memory.stat 2>/dev/null); a=${a:-0}
    if [ "$a" -gt $((100*1024*1024*1024)) ] && pgrep -u tester -f "con-leche/.lake/build/bin" > /dev/null; then
      echo "$(date -u +%FT%TZ) anonymous memory $a bytes: con-leche killed" >> $O/_guard.txt; pkill -9 -u tester -f "con-leche/.lake/build/bin"; sleep 30
    elif [ "$a" -gt $((112*1024*1024*1024)) ] && pgrep -u tester -x lean4lean > /dev/null; then
      echo "$(date -u +%FT%TZ) anonymous memory $a bytes: lean4lean killed" >> $O/_guard.txt; pkill -9 -u tester -x lean4lean; sleep 30
    fi
    sleep 20
  done ) &

conleche() { # name export-file
  local CL; CL=$(ls $X/con-leche/.lake/build/bin/* 2>/dev/null | head -1)
  [ -n "$CL" ] || { echo "con-leche master did not build" > $O/$1.skipped; return; }
  ( flock 9; step $1 10800 /tmp $TB env CON_LECHE_VERBOSE=1 $CL --jobs=8 $2 ) 9> $X/conleche.lock
}
community_done() { until grep -q '"_phase": "complete"\|FAILED\|STOPPED' /results/_status.json 2>/dev/null; do [ "$(left)" -lt 300 ] && return 1; sleep 60; done; }

# ---------- chain A: Google/CMU
chainA() {
  date -u +%FT%TZ > $O/A0.start
  { rm -rf $G && cp -a $GSRC/canonical/lean $G && cd $G && cat replay/lakefile_addition.toml >> lakefile.toml \
    && { [ -d Replay ] || { cp -r replay/Replay Replay && echo "replay/Replay copied to ./Replay (the lib's default source directory)"; }; } \
    && sha256sum lakefile.toml replay/lakefile_addition.toml replay/configs/positive.json replay/configs/controls/*.json Replay/Challenge.lean Replay/Controls/*.lean SubNLogN/Challenge.lean; } > $O/A0.out 2>&1
  echo $? > $O/A0.exit; date -u +%FT%TZ > $O/A0.end
  ok A0 || return
  NANODA=$GSRC/tools/nanoda_lib/target/release/nanoda_bin; L4E=$X/cmp433/.lake/packages/lean4export/.lake/build/bin/lean4export
  { echo "comparator: $(git -C $X/cmp433 rev-parse HEAD) built with $(cat $X/cmp433/lean-toolchain)"; echo "lean4export: $(git -C $X/cmp433/.lake/packages/lean4export rev-parse HEAD)"
    echo "nanoda: $(git -C $GSRC/tools/nanoda_lib rev-parse HEAD); diff lines $(git -C $GSRC/tools/nanoda_lib diff | wc -l)"; git -C $GSRC/tools/nanoda_lib diff
    echo "landrun: $($LANDRUN --version 2>&1)"; echo "kernel: $(uname -r)"; echo "lean: $($TA/lean --version)"; } > $O/A.env.txt 2>&1
  step A1.comparator-positive 14400 $G $TA lake env $X/cmp433/.lake/build/bin/comparator replay/configs/positive.json
  touch $O/A1.done
  for c in S1_Exp45 S2_NoFinite S3_StrictLt P1_Sorry P2_AddedAxiom P3_NativeDecide P4_ExtraAxiomTransitive P5_DefinitionSwap S0_IdenticalCopy; do
    step A2.control-$c 7200 $G $TA lake env $X/cmp433/.lake/build/bin/comparator replay/configs/controls/$c.json
  done
  conleche A3.con-leche-gcmu $GSRC/f1.export
}

# ---------- chain B: lean4lean
chainB() {
  until [ -f $O/A0.end ]; do sleep 20; done
  local LA=$X/l4l433/.lake/build/bin/lean4lean LB=$X/l4l434/.lake/build/bin/lean4lean
  if [ -x $LA ] && ok A0; then
    step B1.lean4lean-gcmu 3600 $G $TA lake env $LA SubNLogN.Assembly.ChallengeHeadline
    step B2.lean4lean-gcmu-fresh 14400 $G $TA lake env $LA --fresh SubNLogN.Assembly.ChallengeHeadline
  else echo "lean4lean for v4.33.1 did not build, or the copy failed" > $O/B1.skipped; fi
  community_done || return
  if [ -x $LB ]; then
    step B3.lean4lean-community 3600 $C $TB lake env $LB IntegerMultBounds.MathlibTM2.Theorem
    step B4.lean4lean-community-fresh 14400 $C $TB lake env $LB --fresh IntegerMultBounds.MathlibTM2.Theorem
  else echo "lean4lean for v4.34.1 did not build" > $O/B3.skipped; fi
}

# ---------- chain C: the community proof
chainC() {
  community_done || return
  date -u +%FT%TZ > $O/C0.start
  { cd $C && cp lakefile.toml $O/C0.lakefile.before && mkdir -p XReplay xreplay-configs \
    && cp $X/xreplay/Challenge.lean $X/xreplay/ControlKappa.lean XReplay/ && cp $X/xreplay/*.json xreplay-configs/ \
    && { grep -q 'name = "XReplay"' lakefile.toml || printf '\n# added on the pod by cert-machine (pod-extra2-run.sh): our challenge module for comparator\n[[lean_lib]]\nname = "XReplay"\nglobs = ["XReplay.+"]\n' >> lakefile.toml; } \
    && sha256sum lakefile.toml XReplay/*.lean xreplay-configs/*.json IntegerMultBounds/MathlibTM2/Statement.lean IntegerMultBounds/MathlibTM2/Theorem.lean; } > $O/C0.out 2>&1
  echo $? > $O/C0.exit; date -u +%FT%TZ > $O/C0.end
  ok C0 || return
  NANODA=$CSRC/tools/nanoda_lib/target/release/nanoda_bin; L4E=$X/cmp434/.lake/packages/lean4export/.lake/build/bin/lean4export
  { echo "comparator: $(git -C $X/cmp434 rev-parse HEAD) built with $(cat $X/cmp434/lean-toolchain)"; echo "lean4export: $(git -C $X/cmp434/.lake/packages/lean4export rev-parse HEAD)"
    echo "nanoda: $(git -C $CSRC/tools/nanoda_lib rev-parse HEAD); diff lines $(git -C $CSRC/tools/nanoda_lib diff | wc -l)"
    echo "landrun: $($LANDRUN --version 2>&1)"; echo "kernel: $(uname -r)"; echo "lean: $($TB/lean --version)"; } > $O/C.env.txt 2>&1
  step C1.build-challenge 3600 $C $TB lake build XReplay.Challenge XReplay.ControlKappa
  step C1.comparator-control-kappa 7200 $C $TB lake env $X/cmp434/.lake/build/bin/comparator xreplay-configs/control-kappa.json
  step C1.comparator-positive 28800 $C $TB lake env $X/cmp434/.lake/build/bin/comparator xreplay-configs/positive.json
  conleche C2.con-leche-community $CSRC/f1.export
}

chainA & pa=$!
chainB & pb=$!
chainC & pc=$!
# the deadline: every step's timeout is already cut to it; this is the belt
( sleep $(( $(left) > 0 ? $(left) : 0 )); echo "$(date -u +%FT%TZ) deadline: the chains are stopped" > $O/_deadline; pkill -TERM -u tester -f "comparator|lean4lean|con-leche|nanoda_bin /tmp" ) &
wait $pa $pb $pc
date -u +%FT%TZ > $O/_run.done
