#!/usr/bin/env bash
# con-leche 5ea446d5 (the runner's pin) on the Phase 4 exports: --verified on the solution export, --compare against
# the challenge export (our sealed PerN.lean + the four stubs), and against the planted challenge (must be refused).
# Run as `prover`, after the Comparator runs. Adapted from bridge/pod-conleche.sh.
set -uo pipefail
export HOME=/home/prover GIT_TERMINAL_PROMPT=0
export PATH=/home/prover/.elan/bin:/pin/lean/bin:/usr/bin:/bin
T=/home/prover/tools; W=/home/prover/work; L=$W/math/lean; X=$W/exports; mkdir -p $X; cd $T
CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f; NT=8
LEX=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $X/conleche.log; }
[ -x $HOME/.elan/bin/elan ] || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > $X/elan.log 2>&1
[ -d con-leche/.git ] || git clone -q https://github.com/leanprover/con-leche.git con-leche
git -C con-leche checkout -q $CLPIN
(cd con-leche && elan toolchain install "$(cat lean-toolchain)" > $X/cl-toolchain.log 2>&1; nice -n 10 lake build > $X/cl-build.log 2>&1); log "con-leche $(git -C con-leche rev-parse HEAD) toolchain $(cat con-leche/lean-toolchain) build exit $?"
CL=$T/con-leche/.lake/build/bin/con-leche; sha256sum $CL >> $X/conleche.log
cd $L
exp() { PATH=/pin/lean/bin:/usr/bin:/bin lake env $LEX "$1" -- "${@:3}" > $X/$2.ndjson 2> $X/$2.export.err; log "export $2 ($1) exit $? $(sha256sum $X/$2.ndjson | cut -c1-16)"; }
N="PerN.gatesPerNAll_holds PerN.gatesPerN_holds PerN.asymptoticRank_holds PerN.borderRankLower_holds"
exp PerNProof.Main sol $N; exp PerNChallenges.PerN chal $N; exp PerNChallenges.PerNPlanted chalPlanted $N
nice -n 10 $CL --verified --jobs=$NT $X/sol.ndjson > $X/K-sol.out 2>&1; log "con-leche --verified sol exit $?"
nice -n 10 $CL --verified --jobs=$NT --compare -- $X/chal.ndjson $X/sol.ndjson > $X/KC.out 2>&1; log "con-leche --verified --compare chal exit $?; justified lines: $(grep -c 'justified by the solution' $X/KC.out)"
nice -n 10 $CL --verified --jobs=$NT --compare -- $X/chalPlanted.ndjson $X/sol.ndjson > $X/KC-planted.out 2>&1; log "con-leche --verified --compare planted exit $?; justified lines: $(grep -c 'justified by the solution' $X/KC-planted.out)"
(cd $X && sha256sum *.ndjson) >> $X/conleche.log
date -u > $X/DONE
