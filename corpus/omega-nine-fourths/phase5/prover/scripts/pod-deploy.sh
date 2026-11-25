#!/usr/bin/env bash
# Install the Phase 5 prover's sources into the prover user's own copy of the release (run as `prover`).
# Adapted from phase4/prover/scripts/pod-deploy.sh.
set -uo pipefail
L=/home/prover/work/math/lean; S=/home/prover/work/src
mkdir -p $L/RectProof $L/RectChallenges
cp $S/RectProof/*.lean $L/RectProof/ 2>/dev/null; cp $S/RectChallenges/*.lean $L/RectChallenges/ 2>/dev/null; cp $S/RectAxioms.lean $L/RectAxioms.lean 2>/dev/null
grep -q '^lean_lib RectProof ' $L/lakefile.lean || cat >> $L/lakefile.lean <<'LF'

-- Added by the ω = 9/4 Phase 5 prover (cert-machine), in the prover user's private copy only.
lean_lib RectProof where globs := #[`RectProof.+]
lean_lib RectChallenges where globs := #[`RectChallenges.+]
LF
sha256sum $L/RectProof/*.lean $L/RectChallenges/*.lean $L/RectAxioms.lean 2>/dev/null
