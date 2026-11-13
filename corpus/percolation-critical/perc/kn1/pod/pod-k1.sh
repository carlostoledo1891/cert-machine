#!/usr/bin/env bash
# K1 of PREREG-KN1.md, on the pod, run by the ORCHESTRATOR after K0 was imported to the desk: the third party's
# environment (nitromannitol/percolation-after-anthropic at a5cc72bd, tarball sha256 7bb1df4c…) built the way its own
# scripts/bootstrap.sh does (the lab's commit fetched by sha, cache get), narrowed to the modules of the three targets.
# The closed files are removed from the pod BEFORE anything is built, and the tarball with them (it stays on the desk).
# Every step: log, exit code, seconds under /root/third/runs.
set -uo pipefail
export PATH=$HOME/.elan/bin:$PATH
W=/root/third; R=$W/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
SHA=a5cc72bd7627f313abbb00bcb47616678abbeb35
TAR=/root/percolation-after-anthropic-$SHA.tar.gz
echo "7bb1df4cb7c5572e6279f5bdbc3007ef59ce1ff111c7afb989e393368d89adab  $TAR" | sha256sum -c - || { echo "tarball is not the pinned one"; sha256sum $TAR; exit 2; }
mkdir -p $W/src && tar xzf "$TAR" -C $W/src && P=$W/src/percolation-after-anthropic-$SHA
cd $P
# every file's hash before anything is removed (names and hashes only)
find . -type f | sort | xargs sha256sum > $R/tree-sha256.txt
# the closed files (PREREG "What stays closed", widened by amendment A1 before any was opened): removed, with the tarball
CLOSED="README.md VERIFICATION.md CONTRIBUTING.md CITATION.cff formalization.yaml source-layout.json docs verification tests"
for c in $CLOSED; do [ -e "$c" ] && echo "removed $c" && rm -rf "$c"; done > $R/closed-removed.txt
rm -f "$TAR"; echo "removed the tarball from the pod" >> $R/closed-removed.txt
sha256sum lean-toolchain lake-manifest.json lakefile.toml scripts/bootstrap.sh > $R/sha256.txt
# their bootstrap's fetch of the lab's commit (on no branch), then the cache, then the narrow build
fetch() {
  package_dir=.lake/packages/PercolationContinuity
  revision=795efb86f191735c5481675763537cfb4ff37e55
  mkdir -p "$package_dir"; git -C "$package_dir" init -q
  git -C "$package_dir" remote add origin https://github.com/anthropics/formal-math
  git -C "$package_dir" fetch origin "$revision" && git -C "$package_dir" checkout --detach "$revision"
  git -C "$package_dir" rev-parse HEAD
  # the fetched tree against the lab's pinned tarball already on the pod (K0's environment source)
  diff -rq "$package_dir/percolation" /root/k1/src/formal-math-$revision/percolation -x .lake -x .git && echo "fetched percolation/ = the pinned tarball's percolation/"
}
step fetch fetch
step cache lake exe cache get
step build lake build KNConjectures.Conjectures KNConjectures.KN1Statement KNConjectures.KN1Bridge KNConjectures.KozmaNitzanConjecture1
cat > K1Axioms.lean <<'L'
import KNConjectures.Conjectures
import KNConjectures.KN1Statement
import KNConjectures.KN1Bridge
import KNConjectures.KozmaNitzanConjecture1
#print axioms KNAll.conjecture1_holds
#print axioms KN1Statement.multiplicativeGluing_holds
#print axioms KN1Corollary.kozmaNitzan_conjecture1
L
step axioms lake env lean K1Axioms.lean
cp lake-manifest.json $R/lake-manifest.after.json
# the author's working copy
rm -rf /root/kn1/third && cp -a $P /root/kn1/third && echo "working copy /root/kn1/third"
echo "K1 done $(date -u +%H:%M:%SZ)"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
