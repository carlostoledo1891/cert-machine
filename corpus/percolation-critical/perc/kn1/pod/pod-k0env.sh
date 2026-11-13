#!/usr/bin/env bash
# K0 environment of PREREG-KN1.md (the same steps as K1 of PREREG-KN3.md), on the pod: the lab's percolation development (anthropics/formal-math 795efb86) from the pinned
# tarball (sha256 10f3e6b9…), built by its own lakefile. Every step: log, exit code, seconds under /root/k1/runs.
set -uo pipefail
W=/root/k1; R=$W/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
TAR=/root/formal-math-795efb86.tar.gz
[ -f $TAR ] || curl -sSfL -o $TAR https://github.com/anthropics/formal-math/archive/795efb86f191735c5481675763537cfb4ff37e55.tar.gz
echo "10f3e6b94b9584799670bfd842e3cadb2287fa9e9f50b9fb6b5ec9a2756955c4  $TAR" | sha256sum -c - || { echo "tarball is not the pinned one"; sha256sum $TAR; exit 2; }
step tools bash -c 'apt-get update -qq && apt-get install -y -qq jq git curl build-essential zstd >/dev/null && (command -v elan || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none)'
export PATH=$HOME/.elan/bin:$PATH
mkdir -p $W/src && tar xzf "$TAR" -C $W/src && P=$(ls -d $W/src/*/percolation)
cd $P
step cache lake exe cache get
step build lake build Percolation Solution
sha256sum Challenge.lean Solution.lean lean-toolchain lake-manifest.json > $R/sha256.txt
rm -rf /root/kn1 && mkdir -p /root/kn1 && cp -a $P /root/kn1/percolation && echo "working copy /root/kn1/percolation"; echo "K0-ENV done $(date -u +%H:%M:%SZ)"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
