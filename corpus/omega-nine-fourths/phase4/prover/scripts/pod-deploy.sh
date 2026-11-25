#!/usr/bin/env bash
# Install the Phase 4 prover's sources into the prover user's own copy of the release (run as `prover`).
# Adapted from bridge/pod-deploy.sh.
set -uo pipefail
L=/home/prover/work/math/lean; S=/home/prover/work/src
mkdir -p $L/PerNProof $L/PerNChallenges
cp $S/PerNProof/*.lean $L/PerNProof/ && cp $S/PerNChallenges/*.lean $L/PerNChallenges/ && cp $S/PerNAxioms.lean $L/PerNAxioms.lean
grep -q '^lean_lib PerNProof ' $L/lakefile.lean || cat >> $L/lakefile.lean <<'LF'

-- Added by the ω = 9/4 Phase 4 prover (cert-machine), in the prover user's private copy only.
lean_lib PerNProof where globs := #[`PerNProof.+]
lean_lib PerNChallenges where globs := #[`PerNChallenges.+]
LF
sha256sum $L/PerNProof/*.lean $L/PerNChallenges/*.lean $L/PerNAxioms.lean
