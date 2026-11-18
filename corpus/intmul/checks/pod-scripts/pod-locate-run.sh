#!/bin/bash
# pod-locate-run.sh — as tester on the second pod (2026-11-18): con-leche master (cd2eceab, --verified, 8 threads) on
# the export, alone on the pod, with its progress heartbeat every 10 seconds. In the pool each heartbeat line ends with
# the number of busy workers and the OLDEST check in flight with its age: the declaration a worker is stuck on is named
# there. A sampler writes con-leche's resident memory every 10 seconds; at 100 GiB it is stopped (kill -9) and the stop
# is written down. Facts in /results/locate: progress.log (the heartbeat), memory.txt, run.{start,end,exit,stopped}.
set -uo pipefail
export HOME=/home/tester
O=/results/locate; WORK=/home/tester/work/aaf109266438
CL=/home/tester/x/con-leche/.lake/build/bin/con-leche
TB=$HOME/.elan/toolchains/leanprover--lean4---v4.34.1/bin
until [ -f $O/export.end ] && [ -f /results/locate/tools/conleche.end ]; do sleep 20; done
[ -x $CL ] || { echo "con-leche did not build" > $O/run.skipped; exit 1; }
{ echo "con-leche: $(git -C /home/tester/x/con-leche rev-parse HEAD) $(cat /home/tester/x/con-leche/lean-toolchain) sha256 $(sha256sum $CL | cut -c1-64)"; cat $O/export.log; } > $O/run.env.txt
date -u +%FT%TZ > $O/run.start
echo "$CL --jobs=8 --progress=10s $WORK/f1.export" > $O/run.cmd
( cd /tmp && ulimit -s unlimited 2>/dev/null; exec env -i HOME=$HOME PATH="$TB:/usr/local/bin:/usr/bin:/bin" /usr/bin/time -v $CL --jobs=8 --progress=10s $WORK/f1.export ) > $O/run.out 2> $O/progress.log &
PID=$!
( while kill -0 $PID 2>/dev/null; do
    P=$(pgrep -u tester -f "con-leche/.lake/build/bin/con-leche" | head -1)
    if [ -n "$P" ]; then R=$(awk '/VmRSS/{print $2}' /proc/$P/status 2>/dev/null); R=${R:-0}
      echo "$(date -u +%T) $(awk -v r=$R 'BEGIN{printf "%.1f", r/1048576}') GiB" >> $O/memory.txt
      if [ "$R" -gt $((100*1024*1024)) ]; then echo "$(date -u +%FT%TZ) stopped (kill -9) at $(awk -v r=$R 'BEGIN{printf "%.1f", r/1048576}') GiB of resident memory, by the sampler of pod-locate-run.sh; not a rejection" > $O/run.stopped; kill -9 $P; fi
    fi
    sleep 10
  done ) &
wait $PID; echo $? > $O/run.exit; date -u +%FT%TZ > $O/run.end
