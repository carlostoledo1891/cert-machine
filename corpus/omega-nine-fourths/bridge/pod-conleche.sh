#!/usr/bin/env bash
# con-leche 5ea446d5 (the runner's pin) on the bridge exports: --verified on each solution export, --compare against
# its challenge export (PREREG F2's third judge). Run as `bridge`, after the Comparator runs.
set -uo pipefail
export HOME=/home/bridge GIT_TERMINAL_PROMPT=0
export PATH=/home/bridge/.elan/bin:/pin/lean/bin:/usr/bin:/bin
T=/home/bridge/tools; W=/home/bridge/work; L=$W/math/lean; X=$W/exports; mkdir -p $X; cd $T
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
A="BlindA.square_exponent_holds BlindA.dual_exponent_holds BlindA.rectangular_exponent_holds"
B="BlindB.square_exponent_holds BlindB.dual_exponent_holds BlindB.rectangular_exponent_holds"
P=OAI.LinearAlgebra.SpectralBooks.F3
F="$P.schoolbook $P.admissible_three $P.two_le_of_admissible $P.formalOmega_square_mem_Icc $P.padding $P.formula_one_one_zero $P.independent_one_one_zero $P.formula_one_zero_zero $P.independent_one_zero_zero"
exp Bridge.BridgeA solA $A; exp BridgeChallenges.BlindA chalA $A
exp Bridge.BridgeB solB $B; exp BridgeChallenges.BlindB chalB $B
exp Bridge.F3 solF3 $F; exp BridgeChallenges.F3 chalF3 $F
exp Bridge.DivisionA solADiv BlindA.square_exponent_with_division_holds; exp BridgeChallenges.BlindADiv chalADiv BlindA.square_exponent_with_division_holds
exp Bridge.DivisionB solBDiv BlindB.square_exponent_with_division_holds; exp BridgeChallenges.BlindBDiv chalBDiv BlindB.square_exponent_with_division_holds
for s in A B F3 ADiv BDiv; do
  nice -n 10 $CL --verified --jobs=$NT $X/sol$s.ndjson > $X/K-$s.out 2>&1; log "con-leche --verified sol$s exit $?"
  nice -n 10 $CL --verified --jobs=$NT --compare -- $X/chal$s.ndjson $X/sol$s.ndjson > $X/KC-$s.out 2>&1; log "con-leche --verified --compare $s exit $?; justified lines: $(grep -c 'justified by the solution' $X/KC-$s.out)"
done
(cd $X && sha256sum *.ndjson) >> $X/conleche.log
date -u > $X/DONE
