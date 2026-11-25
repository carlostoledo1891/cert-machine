#!/usr/bin/env bash
# Install the bridge sources into the bridge user's own copy of the release (run as `bridge`).
set -uo pipefail
L=/home/bridge/work/math/lean; S=/home/bridge/work/src
mkdir -p $L/Bridge $L/BridgeChallenges
cp $S/Bridge/*.lean $L/Bridge/ && cp $S/BridgeChallenges/*.lean $L/BridgeChallenges/
grep -q '^lean_lib Bridge ' $L/lakefile.lean || cat >> $L/lakefile.lean <<'LF'

-- Added by the ω = 9/4 bridge author (cert-machine), in the bridge user's private copy only.
lean_lib Bridge where globs := #[`Bridge.+]
lean_lib BridgeChallenges where globs := #[`BridgeChallenges.+]
LF
sha256sum $L/Bridge/*.lean $L/BridgeChallenges/*.lean
