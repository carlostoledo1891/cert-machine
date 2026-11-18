#!/bin/bash
# pod-extra2-run4.sh — as tester (2026-11-18 10:25 UTC): the last optional step. At 10:15:08 UTC the memory guard
# stopped pod-extra2-run3.sh (the community fresh replay was passing 100 GiB; comparator on the community proof, true
# statement, no nanoda, was 5 h 14 min in and held 7.4 GB, undecided), and at 10:18:25 UTC the fresh replay itself was
# stopped by hand at 120.8 GB. The pod is now empty. Left of run3: con-leche master on each registered run's export.
# Here both run at once (--jobs=8 each on 16 vCPU), same binary and command as run3's chainL; outputs in
# /results/extra2/r4. The comparator positive on the community proof is NOT run again: it cannot finish before the
# deadline. Guard: pod-guard3.sh (stops everything under /home/tester/x at 100 GiB of anonymous memory).
set -uo pipefail
export HOME=/home/tester
X=/home/tester/x; O=/results/extra2/r4; mkdir -p $O
DEADLINE=${DEADLINE:-2026-11-18T13:00:00Z}
EL=$HOME/.elan/toolchains
TB=$EL/leanprover--lean4---v4.34.1/bin
GSRC=/home/tester/work/4738aeff839d; CSRC=/home/tester/work/aaf109266438
BASEPATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin
dl=$(date -u -d "$DEADLINE" +%s)
left() { echo $(( dl - $(date +%s) )); }
step() { # name timeout-seconds dir toolchain-bin command...
  local n=$1 to=$2 dir=$3 tb=$4; shift 4
  local l; l=$(left); [ "$l" -lt 120 ] && { echo "not started: the deadline $DEADLINE" > $O/$n.skipped; return 1; }
  [ "$to" -gt "$l" ] && to=$l
  date -u +%FT%TZ > $O/$n.start; echo "$*" > $O/$n.cmd
  ( cd "$dir" && ulimit -s 16777216 2>/dev/null || ulimit -s unlimited 2>/dev/null; echo "stack limit: $(ulimit -s)" > $O/$n.env
    exec env -i HOME=$HOME PATH="$tb:$X/bin:$BASEPATH" LEAN_ABORT_ON_PANIC=1 nice -n 10 /usr/bin/time -v timeout "$to" "$@" ) > $O/$n.out 2> $O/$n.err
  echo $? > $O/$n.exit; date -u +%FT%TZ > $O/$n.end
}
date -u +%FT%TZ > $O/_run.start
CL=$X/con-leche/.lake/build/bin/con-leche
{ echo "con-leche: $(git -C $X/con-leche rev-parse HEAD) $(cat $X/con-leche/lean-toolchain) sha256 $(sha256sum $CL | cut -c1-64)"
  sha256sum $GSRC/f1.export $CSRC/f1.export; ls -l $GSRC/f1.export $CSRC/f1.export; $CL --help 2>&1 | head -30; } > $O/L.env.txt 2>&1
step A3.con-leche-gcmu 9000 /tmp $TB env CON_LECHE_VERBOSE=1 $CL --jobs=8 $GSRC/f1.export & pa=$!
step C2.con-leche-community 9000 /tmp $TB env CON_LECHE_VERBOSE=1 $CL --jobs=8 $CSRC/f1.export & pc=$!
wait $pa $pc
date -u +%FT%TZ > $O/_run.done
