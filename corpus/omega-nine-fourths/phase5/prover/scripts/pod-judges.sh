#!/usr/bin/env bash
# The Phase 4 prover's own judges, at the same pins as the Phase 1 runner (tools/runpod-omega-p1.sh s_judges):
# Comparator d03acab1 (toolchain set to v4.34.1, lean4export 076e8e57), landrun 811cfff5, nanoda 3a240721.
set -uo pipefail
export HOME=/home/prover GIT_TERMINAL_PROMPT=0
export PATH=/home/prover/.cargo/bin:/pin/lean/bin:/usr/local/go/bin:/usr/local/bin:/usr/bin:/bin
T=/home/prover/tools; mkdir -p $T; cd $T
CMPPIN=d03acab154d269c06e60e4de7e4cc85deebff94b LEXPIN=076e8e57707e813375e8f9da8bf989799ace9680
LRNPIN=811cfff51ceaf3d9843708aa6d22e9b84ccac8b4 ND1PIN=3a2407216ee84a75f9e1aead6803d0578be06ae7
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $T/judges.log; }
clone() { for t in 1 2 3; do [ -d $2/.git ] && return 0; git clone -q $1 $2 && return 0; rm -rf $2; sleep 20; done; return 1; }
[ -x $HOME/.cargo/bin/cargo ] || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > $T/rustup.log 2>&1
log "cargo: $(cargo --version 2>&1); go: $(go version 2>&1); lean: $(lean --version)"
clone https://github.com/leanprover/comparator.git comparator && git -C comparator checkout -q $CMPPIN
(cd comparator && echo 'leanprover/lean4:v4.34.1' > lean-toolchain && sed -i 's/"rev": "[0-9a-f]\{40\}"/"rev": "'$LEXPIN'"/' lake-manifest.json && nice -n 10 lake build lean4export comparator > $T/comparator-build.log 2>&1); log "comparator build exit $? at $(git -C comparator rev-parse HEAD); lean4export $(git -C comparator/.lake/packages/lean4export rev-parse HEAD 2>/dev/null)"
clone https://github.com/Zouuup/landrun.git landrun && git -C landrun checkout -q $LRNPIN
(cd landrun && nice -n 10 go build -o landrun ./cmd/landrun > $T/landrun-build.log 2>&1); log "landrun build exit $? at $(git -C landrun rev-parse HEAD)"
clone https://github.com/ammkrn/nanoda_lib.git nanoda-3a24 && git -C nanoda-3a24 checkout -q $ND1PIN
(cd nanoda-3a24 && nice -n 10 cargo build --release > $T/nanoda-build.log 2>&1); log "nanoda build exit $? at $(git -C nanoda-3a24 rev-parse HEAD)"
sha256sum comparator/.lake/build/bin/comparator comparator/.lake/packages/lean4export/.lake/build/bin/lean4export landrun/landrun nanoda-3a24/target/release/nanoda_bin >> $T/judges.log 2>&1
date -u > $T/JUDGES.done
