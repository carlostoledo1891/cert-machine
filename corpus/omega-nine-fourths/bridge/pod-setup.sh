#!/usr/bin/env bash
# Bridge author's own build of the release at the pin, as the unprivileged user `bridge`, in its own home.
# (The runner's build in /home/tester is not readable by another user, and granting access was refused.)
set -uo pipefail
export PATH=/pin/lean/bin:/usr/local/bin:/usr/bin:/bin GIT_TERMINAL_PROMPT=0 HOME=/home/bridge
W=/home/bridge/work; PIN=92b516ef8e2abf66c3db7aa31438d3010bc7956f
cd $W || exit 1
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $W/setup.log; }
log "start; lean $(lean --version)"
for t in 1 2 3; do [ -d math/.git ] && break; git clone -q --filter=blob:none --no-checkout https://github.com/openai/math.git math && break; rm -rf math; sleep 30; done
cd math && git sparse-checkout set lean && git checkout -q $PIN && log "release at $(git rev-parse HEAD)"
cd lean
sha256sum ComparatorChallenges/MatrixExponent.lean OAI/LinearAlgebra/SpectralBooks/ExactExponent.lean lake-manifest.json lakefile.lean lean-toolchain >> $W/setup.log
cp lake-manifest.json $W/manifest.before.json
nice -n 19 lake update > $W/update.log 2>&1; log "lake update exit $?"
cmp -s lake-manifest.json $W/manifest.before.json && log "manifest unchanged" || log "MANIFEST CHANGED"
nice -n 19 lake exe cache get > $W/cache.log 2>&1; log "cache get exit $?"
nice -n 19 lake build OAI.LinearAlgebra.SpectralBooks.ExactExponent ComparatorChallenges.MatrixExponent > $W/build.log 2>&1; log "build exit $?"
date -u > $W/SETUP.done
