#!/usr/bin/env bash
# Amendment A1 of PREREG-PERCOLATION.md, on a pod. Both bridge environments rebuilt from the pins; the anchors and the
# non-vacuity corollaries built INSIDE each lab's environment; red control R4 (the planted false p_c): each bridge must
# FAIL to build against Textbook.R4.lean while PlantedFalse (the planted statement refuted) BUILDS in the same
# environment; then the sealed statement restored (sha256) and rebuilt green. Every step: log, exit code, seconds.
# Usage on the pod: bash /root/in/pod-r4.sh   (inputs in /root/in, checked against /root/in/SHA256SUMS first)
set -uo pipefail
I=/root/in; R=/root/r4/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
TRUE=4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae
OAI=4eaee87548250b2682affda7d05d947c05554bae
(cd $I && sha256sum -c SHA256SUMS) > $R/inputs-sha.log 2>&1 || { echo "inputs are not the sealed ones"; cat $R/inputs-sha.log; exit 2; }
echo "inputs sha ok"
step tools bash -c 'apt-get update -qq && apt-get install -y -qq git curl >/dev/null && (command -v elan || curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none)'
export PATH=$HOME/.elan/bin:$PATH

# ---- bridge A: Anthropic's environment (v4.32.0)
mkdir -p /root/A && tar xzf $I/formal-math-795efb86.tar.gz -C /root/A && A=$(ls -d /root/A/*/percolation) && cd $A
cp $I/Textbook.lean $I/ThetaAnchors.lean $I/Anchors.lean $I/PlantedFalse.lean $I/CorollaryA.lean .
cp $I/bridgeA/Bridge.lean Bridge.lean; cp $I/bridgeA/lakefile.toml lakefile.toml
printf '\n# Amendment A1 (2026-11-12): the anchors, the corollary, the R4 refutation (built only against the planted file).\n[[lean_lib]]\nname = "ThetaAnchors"\nroots = ["ThetaAnchors"]\n\n[[lean_lib]]\nname = "Anchors"\nroots = ["Anchors"]\n\n[[lean_lib]]\nname = "CorollaryA"\nroots = ["CorollaryA"]\n\n[[lean_lib]]\nname = "PlantedFalse"\nroots = ["PlantedFalse"]\n' >> lakefile.toml
step A-cache lake exe cache get
step A-green lake build Textbook Bridge ThetaAnchors Anchors CorollaryA
step A-axioms lake env lean $I/AxA.lean
cp $I/Textbook.R4.lean Textbook.lean
step A-R4-bridge lake build Bridge
step A-R4-plantedfalse lake build PlantedFalse
step A-R4-axioms lake env lean $I/AxP.lean
cp $I/Textbook.lean Textbook.lean
echo "$TRUE  Textbook.lean" | sha256sum -c - > $R/A-restore-sha.log 2>&1; echo "A restore sha: $(cat $R/A-restore-sha.log)"
step A-restore lake build Textbook Bridge CorollaryA
step A-restore-axioms lake env lean $I/AxA.lean

# ---- bridge O: OpenAI's environment (v4.34.1)
mkdir -p /root/O && cd /root/O && git init -q && git remote add origin https://github.com/openai/math && git fetch -q --depth 1 origin $OAI && git checkout -q FETCH_HEAD
git rev-parse HEAD > $R/O-head.txt; git apply $I/bridgeO/lakefile.diff
cd lean && mkdir -p bridge && cp $I/Textbook.lean $I/ThetaAnchors.lean $I/Anchors.lean $I/PlantedFalse.lean $I/CorollaryO.lean bridge/ && cp $I/bridgeO/Bridge.lean bridge/Bridge.lean
sed -i 's/roots := #\[`Textbook, `Bridge\]/roots := #[`Textbook, `Bridge, `ThetaAnchors, `Anchors, `CorollaryO]/' lakefile.lean
printf '\n-- Amendment A1 (2026-11-12): the R4 refutation, built only against the planted file.\nlean_lib TextbookPlanted where\n  srcDir := "bridge"\n  roots := #[`PlantedFalse]\n' >> lakefile.lean
git diff lakefile.lean > $R/O-lakefile.diff
step O-update lake update
git diff --stat lake-manifest.json > $R/O-manifest.diff; echo "O manifest diff lines: $(wc -l < $R/O-manifest.diff)"
step O-cache lake exe cache get
step O-green lake build Textbook Bridge ThetaAnchors Anchors CorollaryO
step O-axioms lake env lean $I/AxO.lean
cp $I/Textbook.R4.lean bridge/Textbook.lean
step O-R4-bridge lake build Bridge
step O-R4-plantedfalse lake build PlantedFalse
step O-R4-axioms lake env lean $I/AxP.lean
cp $I/Textbook.lean bridge/Textbook.lean
echo "$TRUE  bridge/Textbook.lean" | sha256sum -c - > $R/O-restore-sha.log 2>&1; echo "O restore sha: $(cat $R/O-restore-sha.log)"
step O-restore lake build Textbook Bridge CorollaryO
step O-restore-axioms lake env lean $I/AxO.lean
echo "A1 done"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
