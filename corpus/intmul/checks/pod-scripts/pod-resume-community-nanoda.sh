#!/bin/bash
# pod-resume-community-nanoda.sh — as tester (2026-11-18). The registered run of intmul-community was stopped by the
# run's own memory watchdog at 03:35:38 UTC, 76 minutes into its last step (nanoda), when the container's memory
# reading (it counts the file cache and every process in the container) passed 93% of the limit; a build of optional
# tools started by the session at 03:09 UTC was sharing the pod. The tool had not written nanoda.{log,exit,seconds}
# nor machine.json. This runs the SAME step again by hand: the same binary, the same nanoda.json, the same export
# (sha256 in export.log), the same working directory, stack limit and environment as tools/lean-intake.js gives it,
# with the tool's own limit of this run (LEAN_INTAKE_KERNEL_SECONDS=10800). It writes the three files the tool
# would have written, one line in _status.txt that says "second attempt, by hand", and _resumed.json.
F=/home/tester/audit/corpus/lean-intake/intmul-community/runs/2026-11-17
WORK=/home/tester/work/aaf109266438
export HOME=/home/tester PATH=/home/tester/.elan/bin:/home/tester/.cargo/bin:/usr/local/bin:/usr/bin:/bin
[ -e $F/nanoda.exit ] && { echo "nanoda.exit exists: nothing done"; exit 1; }
cd $WORK && ulimit -s unlimited 2>/dev/null
stamp() { date -u +%Y-%m-%dT%H:%M:%S.000Z; }
B=$WORK/tools/nanoda_lib/target/release/nanoda_bin
pre="{\"binary_sha256\": \"$(sha256sum $B | cut -c1-64)\", \"config_sha256\": \"$(sha256sum nanoda.json | cut -c1-64)\", \"export_sha256\": \"$(sha256sum f1.export | cut -c1-64)\""
echo "$(stamp) start nanoda (second attempt, by hand: pod-resume-community-nanoda.sh; the first was stopped by the memory watchdog at 03:35:38Z)" >> $F/_status.txt
s=$(date -u +%FT%TZ); t0=$(date +%s.%N)
timeout 10800 bash -c "\"$B\" nanoda.json 2>&1" > $F/nanoda.log; e=$?
[ $e = 124 ] && e=timeout
t1=$(date +%s.%N); echo "$e" > $F/nanoda.exit; python3 -c "print('%.1f' % ($t1 - $t0))" > $F/nanoda.seconds
echo "$(stamp) end nanoda exit $e" >> $F/_status.txt
[ -e $F/machine.json ] || cp /home/tester/audit/corpus/lean-intake/intmul-gcmu/runs/2026-11-17/machine.json $F/machine.json
echo "$pre, \"started\": \"$s\", \"ended\": \"$(date -u +%FT%TZ)\", \"exit\": \"$e\", \"what\": \"nanoda run a second time by hand after the run's memory watchdog stopped the first at 2026-11-18T03:35:38Z; nanoda.log, nanoda.exit, nanoda.seconds are this attempt's; machine.json is a copy of the file the tool wrote for intmul-gcmu in the same container two hours earlier\", \"script\": \"pod-resume-community-nanoda.sh\"}" > $F/_resumed.json
date -u +%FT%TZ > /results/extra/community-nanoda-resumed.done
