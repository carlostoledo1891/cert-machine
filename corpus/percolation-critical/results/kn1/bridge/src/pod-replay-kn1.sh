#!/usr/bin/env bash
# pod-replay-kn1.sh — for the ORCHESTRATOR: K2, K3 and the red controls of PREREG-KN1.md replayed from the sealed
# bytes in a FRESH copy of the pristine third-party tree (not the author's working copy).
#   SRC      the bridge sources as brought home to the desk (perc/kn1/bridge/), uploaded to the pod; checked
#            against SRC/INPUTS.sha256 first
#   PRISTINE /root/third/src/percolation-after-anthropic-<sha>/   (read: copied, never written)
#   RP       /root/replay-kn1   the fresh copy (RP/third), logs RP/runs, red controls RP/red, kernels RP/k3
# Steps, each with log, exit code and seconds under RP/runs:
#   inputs  sha256 of every source file · copy  cp -a of the pristine tree · setup  bridge-setup.sh (sealed bytes
#   checked, modules assembled) · build  our modules · axioms · walk  the dependency walks (builds the rest of
#   KNConjectures and two Hypergraph modules so that every forbidden name exists) · tokens · imports ·
#   k3  leanchecker --fresh, Comparator with OUR challenge, KR4 · red  KR1, KR2, KR3.
# Usage: SRC=/root/replay-kn1-src bash pod-replay-kn1.sh
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
SRC="${SRC:?SRC=the bridge sources}"; RP="${RP:-/root/replay-kn1}"; R=$RP/runs; mkdir -p "$R"
PRISTINE="${PRISTINE:-$(ls -d /root/third/src/percolation-after-anthropic-*/)}"
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > "$R/$name.log" 2>&1; local rc=$?; echo $rc > "$R/$name.exit"; echo $(( $(date +%s) - t0 )) > "$R/$name.seconds"; echo "$name exit $rc ($(cat "$R/$name.seconds") s)"; return 0; }
step inputs bash -c "cd '$SRC' && sha256sum -c INPUTS.sha256"
step tools bash -c 'apt-get install -y -qq golang-go jq >/dev/null 2>&1; (command -v cargo || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal); go version; $HOME/.cargo/bin/cargo --version'
[ -e "$RP/third" ] && { echo "$RP/third exists: choose another RP"; exit 1; }
step copy cp -a "$PRISTINE" "$RP/third"
cd "$RP/third"
step setup env SRC="$SRC" WORK="$RP/third" bash "$SRC/bridge-setup.sh"
step build lake build KN3Printed KN1Printed KN1Planted KN1.K0.Required KN1.K0.PlantedFalse KN1.K0.PlantedFalse10 KN1.K0.PlantedFalse11 KN1.K0.Planted12 KN1.K0.Readings KN1.K0.Weakenings KN1.Bridge.Transport1 KN1.Bridge.Compare KN1.Bridge.Targets KN1.Proved KN1.Bridge.Cheat KN1.Bridge.DepWalk
step axioms lake build KN1.Bridge.Axioms
step walk lake build KN1.Bridge.Walk
step tokens bash -c '! grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" KN1/Bridge/Transport3.lean KN1/Bridge/Transport1.lean KN1/Bridge/Compare.lean KN1/Bridge/Targets.lean KN1/Proved.lean'
step imports bash -c 'grep -n "^import" Printed.lean Printed1.lean Planted1.lean KN1/K0/Frag.lean KN1/K0/Basic.lean KN1/K0/Required.lean KN1/Bridge/Transport3.lean KN1/Bridge/Transport1.lean KN1/Bridge/Compare.lean KN1/Bridge/Targets.lean KN1/Proved.lean'
step k3 env SRC="$SRC" WORK="$RP/third" K3="$RP/k3" bash "$SRC/k3.sh"
step red env SRC="$SRC" WORK="$RP/third" RED="$RP/red" PRISTINE="$PRISTINE" WALKLOG="$R/walk.log" bash "$SRC/red.sh"
sha256sum Printed.lean Printed1.lean Planted1.lean KN1/K0/*.lean KN1/Bridge/*.lean KN1/Proved.lean lakefile.toml OurChallenge*.lean comparator-kn1.json > "$R/sha256-after.txt"
echo "REPLAY done $(date -u +%H:%M:%SZ)"; for f in "$R"/*.exit; do echo "$(basename "$f" .exit): $(cat "$f")"; done
cat "$RP/k3"/verdict-*.txt 2>/dev/null; tail -3 "$RP/red/summary.txt" 2>/dev/null
