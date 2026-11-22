#!/usr/bin/env bash
# runpod-alpoge-grh-judge-guard.sh — amendment A21 (2026-11-22): a guard on the larger machine itself.
# Amendment A19 fixed that if S1 stops on resources there, C1 is not run. The judge script starts C1 right after S1
# whatever S1's exit was, and until now that rule was enforced by the control room from the operator's Mac. This script
# enforces it on the machine, so it holds when the Mac or the session is down.
# It waits for S1's exit code. If S1 was killed (exit 137), timed out (exit 124), or exited non-zero with the kernel's
# out-of-memory counter above zero, it stops the judge script and anything the unprivileged user had started for C1,
# and writes /results/C1.not-run. On any other exit, 0 included, it does nothing: C1 runs as registered.
# usage: JUDGE_PID=<pid of `bash /root/judge.sh`> nohup bash judge-guard.sh > /dev/null 2>&1 &
set -uo pipefail
: "${JUDGE_PID:?}"
R=/results U=verifier
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_guard.log; }
grep -q 'judge.sh' /proc/$JUDGE_PID/cmdline 2>/dev/null || { log "guard not armed: pid $JUDGE_PID is not the judge script"; exit 1; }
log "guard armed on judge.sh pid $JUDGE_PID; S1 running since $(date -u -d @"$(cat $R/S1.start)" +%Y-%m-%dT%H:%M:%SZ)"
until [ -s $R/S1.exit ] || ! kill -0 "$JUDGE_PID" 2>/dev/null; do sleep 2; done
e=$(cat $R/S1.exit 2>/dev/null || echo none)
oom=$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory.events 2>/dev/null); oom=${oom:-0}
if [ "$e" = 137 ] || [ "$e" = 124 ] || { [ "$e" != 0 ] && [ "$e" != none ] && [ "$oom" -gt 0 ]; }; then
  kill "$JUDGE_PID" 2>/dev/null
  sleep 1
  pkill -u $U 2>/dev/null
  sleep 2
  pkill -9 -u $U 2>/dev/null
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) S1 exit $e, oom_kill $oom: the judge script was stopped and C1 was not run (amendments A19, A21)" > $R/C1.not-run
  log "S1 stopped on resources (exit $e, oom_kill $oom): judge.sh stopped, C1 not run"
else
  log "S1 exit $e, oom_kill $oom: nothing to do, C1 runs as registered"
fi
