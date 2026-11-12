#!/usr/bin/env bash
# P1 of PREREG-PERCOLATION.md, on the pod: Anthropic's percolation development (795efb86) built from the pinned
# tarball, its axioms listed, its own Comparator check (Palomar pins: comparator + lean4export + nanoda + landrun),
# two planted red controls through the same check, leanchecker --fresh. Every step: log, exit code, seconds.
# Usage on the pod: bash pod-p1.sh /root/formal-math-795efb86.tar.gz   (expects sha256 10f3e6b9…)
set -uo pipefail
TAR="$1"; W=/root/p1; R=$W/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
echo 10f3e6b94b9584799670bfd842e3cadb2287fa9e9f50b9fb6b5ec9a2756955c4"  $TAR" | sha256sum -c - || { echo "tarball is not the pinned one"; exit 2; }
step tools bash -c 'apt-get update -qq && apt-get install -y -qq jq golang-go git curl build-essential >/dev/null && (command -v rustup || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal) && (command -v elan || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none) && go version && $HOME/.cargo/bin/cargo --version'
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
mkdir -p $W/src && tar xzf "$TAR" -C $W/src && P=$(ls -d $W/src/*/percolation)
cd $P
step cache lake exe cache get
step build lake build Percolation Solution
step build-challenge lake build Challenge
step axioms lake env lean scripts/Axioms.lean
step comparator bash ../.github/scripts/comparator-check.sh
# red controls: each planted statement must make the same check FAIL
cp Challenge.lean /root/Challenge.orig
sed -i 's/theorem percolation_continuity (d : ℕ) (hd : 2 ≤ d)/theorem percolation_continuity (d : ℕ) (hd : 1 ≤ d)/' Challenge.lean
step red-d1 bash ../.github/scripts/comparator-check.sh
cp /root/Challenge.orig Challenge.lean
sed -i 's/  theta (zdGraph d) (0 : Site d) (criticalProbI d) = 0/  theta (zdGraph d) (0 : Site d) (criticalProbI d) = 1/' Challenge.lean
step red-theta1 bash ../.github/scripts/comparator-check.sh
cp /root/Challenge.orig Challenge.lean
step fresh lake env leanchecker --fresh Solution
sha256sum Challenge.lean Solution.lean > $R/sha256.txt
echo "P1 done"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
