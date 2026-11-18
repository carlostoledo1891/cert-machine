#!/bin/bash
# pod-locate-export.sh — as tester on the second pod (2026-11-18): after the intake's stages through f1, the proof is
# exported exactly as the registered run exported it (the tool's own recipe: lean4export at the commit it picked then,
# cacf989, its toolchain set to the proof's; `lean4export Intake.F1 -- Intake.f1`). The sha256 is compared with the
# registered export's (114e7e51...): equal means the checkers here read the same file. Facts in /results/locate.
set -uo pipefail
export HOME=/home/tester
O=/results/locate; mkdir -p $O
WORK=/home/tester/work/aaf109266438; CAN=$WORK/canonical
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin GIT_TERMINAL_PROMPT=0
WANT=114e7e51f9237319131b447eb1497ad70f4621bce37d4b8a442362f4ede9103b
until grep -q '"intmul-community": "run exit' /results/_status.json 2>/dev/null; do sleep 30; done
grep '"intmul-community"' /results/_status.json > $O/intake-run.txt
date -u +%FT%TZ > $O/export.start
{ cd $WORK && rm -rf tools/lean4export && mkdir -p tools && git clone -q https://github.com/leanprover/lean4export tools/lean4export && cd tools/lean4export \
  && git checkout -q cacf989 && git log --oneline -1 && echo leanprover/lean4:v4.34.1 > lean-toolchain && lake build 2>&1 | tail -4 && ls .lake/build/bin; } > $O/lean4export-build.log 2>&1
echo $? > $O/lean4export-build.exit
( cd $CAN && /usr/bin/time -v lake env $WORK/tools/lean4export/.lake/build/bin/lean4export Intake.F1 -- Intake.f1 > $WORK/f1.export ) 2> $O/export.err
echo $? > $O/export.exit
GOT=$(sha256sum $WORK/f1.export | cut -c1-64)
echo "export exit $(cat $O/export.exit) bytes $(wc -c < $WORK/f1.export) sha256 $GOT registered $WANT same=$([ "$GOT" = "$WANT" ] && echo yes || echo NO)" > $O/export.log
date -u +%FT%TZ > $O/export.end
