#!/usr/bin/env bash
# Comparator for bridge O as lane K ran it (cert-machine .github/workflows/openai-math-kernel.yml): comparator d03acab1
# (tag v4.34.0) with its toolchain raised to v4.34.1 and lean4export 076e8e57; nanoda and landrun as built for bridge A.
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
L=/root/p6/runs/O-comparator3.log; t0=$(date +%s)
{
T=$HOME/.cache/lean-ci-tools-4341b; mkdir -p $T && cd $T
[ -d comparator ] || git clone -q https://github.com/leanprover/comparator.git
cd comparator && git checkout -q d03acab154d269c06e60e4de7e4cc85deebff94b
echo "leanprover/lean4:v4.34.1" > lean-toolchain
sed -i "s/\"rev\": \"[0-9a-f]\{40\}\"/\"rev\": \"076e8e57707e813375e8f9da8bf989799ace9680\"/" lake-manifest.json
lake build lean4export comparator
CB=$T/comparator/.lake/build/bin/comparator; LB=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export
(cd .lake/packages/lean4export && git rev-parse HEAD)
cd /root/bridgeO/math/lean
export PATH="$(lean --print-prefix)/bin:$PATH"
export COMPARATOR_LANDRUN=$HOME/.cache/lean-ci-tools/bin/landrun COMPARATOR_LEAN4EXPORT=$LB COMPARATOR_NANODA=$HOME/.cache/lean-ci-tools/nanoda/target/release/nanoda_bin LEAN_ABORT_ON_PANIC=1
jq ".enable_nanoda = true" comparator-ours.json > /root/p6/O-cmp.json
lake env $CB /root/p6/O-cmp.json
} > $L 2>&1
echo $? > /root/p6/runs/O-comparator3.exit; echo $(( $(date +%s) - t0 )) > /root/p6/runs/O-comparator3.seconds
