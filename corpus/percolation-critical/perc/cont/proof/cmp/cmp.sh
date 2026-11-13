#!/bin/bash
# cmp.sh CONFIG TAG — Comparator on one configuration, with the tools the lab's own script
# (.github/scripts/comparator-check.sh at 795efb86) built under ~/.cache/lean-ci-tools at its pins, and that script's
# invocation (toolchain binaries first in PATH, landrun, lean4export, nanoda on, LEAN_ABORT_ON_PANIC). The lab's script
# itself is not run because it globs comparator*.json in the project directory and would also need the lab's own
# comparator.json moved; nothing of the lab is moved here.
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
cd /root/cont/percolation
T=$HOME/.cache/lean-ci-tools; CFG=$1; TAG=$2; L=/root/cont/logs/cmp; mkdir -p $L
{
  echo "comparator $(git -C $T/comparator rev-parse HEAD)"
  echo "lean4export $(git -C $T/lean4export rev-parse HEAD)"
  echo "nanoda $(git -C $T/nanoda rev-parse HEAD)"
  echo "landrun $(cat $T/bin/landrun.commit)"
  echo "lean-toolchain $(cat lean-toolchain)"
} > $L/$TAG.tools.txt 2>&1
lean_prefix="$(lean --print-prefix)"
export PATH="$lean_prefix/bin:$PATH"
export COMPARATOR_LANDRUN="$T/bin/landrun"
export COMPARATOR_LEAN4EXPORT="$T/lean4export/.lake/build/bin/lean4export"
export COMPARATOR_NANODA="$T/nanoda/target/release/nanoda_bin"
export LEAN_ABORT_ON_PANIC=1
jq '.enable_nanoda = true' "$CFG" > $L/$TAG.json
S=$(date +%s)
lake env "$T/comparator/.lake/build/bin/comparator" $L/$TAG.json > $L/$TAG.log 2>&1
E=$?
OK=no; grep -qxF 'Your solution is okay!' $L/$TAG.log && OK=yes
echo "config=$CFG exit=$E okay_line=$OK seconds=$(( $(date +%s) - S )) utc=$(date -u +%FT%TZ)" > $L/$TAG.exit
