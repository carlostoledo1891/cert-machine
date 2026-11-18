#!/bin/bash
# pod-extra2-tools.sh — run as tester on the pod, low priority (2026-11-18, on the operator's answer "run them if time
# allows"): builds the tools of the optional checks, each from source at a named commit. Nothing here touches the
# registered run's checkouts. Facts in /results/extra2/tools/<name>.{log,exit}; versions in /results/extra2/tools.txt.
#   landrun      Zouuup/landrun at the Google/CMU replay's commit (ec104f6e), built with Go 1.24.13 (our pinned tarball)
#   comparator   leanprover/comparator tag v4.33.0 (3927ad38) on Lean v4.33.1, the Google/CMU replay's own recipe;
#                tag v4.34.0 (d03acab1) on Lean v4.34.1 with lean4export 076e8e57, the recipe of tools/runpod-eth.sh
#   lean4lean    digama0/lean4lean at the newest commit whose lean-toolchain names v4.33.x / v4.34.x, built with the
#                proof's exact toolchain
#   con-leche    leanprover/con-leche master, its own toolchain
set -uo pipefail
export HOME=/home/tester
X=/home/tester/x; O=/results/extra2/tools; mkdir -p $X $O
export PATH=$X/go/bin:$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin
export GIT_TERMINAL_PROMPT=0
GO_TGZ=go1.24.13.linux-amd64.tar.gz
GO_SHA256=1fc94b57134d51669c72173ad5d49fd62afb0f1db9bf3f798fd98ee423f8d730
LANDRUN_GCMU=ec104f6edc1e14d7fec6d31146f1ec6f9c192c5a
LANDRUN_OURS=811cfff51ceaf3d9843708aa6d22e9b84ccac8b4
CMP433=3927ad383f208ae977c340a91c48ac9b497d2097
L4E433=15f6055e299ad5b89345e533cc2192f4cc00f659
CMP434=d03acab154d269c06e60e4de7e4cc85deebff94b
L4E434=076e8e57707e813375e8f9da8bf989799ace9680
blk() { # name, script on stdin
  local n=$1; date -u +%FT%TZ > $O/$n.start
  nice -n 10 bash -euo pipefail -s > $O/$n.log 2>&1; echo $? > $O/$n.exit; date -u +%FT%TZ > $O/$n.end
}
date -u +%FT%TZ > $O/_start

blk landrun <<BLOCK
cd $X && curl -fsSL -o go.tgz "https://go.dev/dl/$GO_TGZ" && echo "$GO_SHA256  go.tgz" | sha256sum -c - && tar -xzf go.tgz
go version
rm -rf landrun && git clone -q https://github.com/Zouuup/landrun.git && cd landrun
for pin in $LANDRUN_GCMU $LANDRUN_OURS; do
  git checkout -q \$pin && GOTOOLCHAIN=local go build -o $X/bin-landrun-\$pin ./cmd/landrun && echo "built landrun \$pin" || echo "landrun \$pin did not build with the local Go"
done
mkdir -p $X/bin
if [ -x $X/bin-landrun-$LANDRUN_GCMU ]; then cp $X/bin-landrun-$LANDRUN_GCMU $X/bin/landrun; echo "landrun in use: $LANDRUN_GCMU"; else cp $X/bin-landrun-$LANDRUN_OURS $X/bin/landrun; echo "landrun in use: $LANDRUN_OURS"; fi
$X/bin/landrun --version || true
# does Landlock work in this container?
$X/bin/landrun --rox /usr --rox /bin --rox /lib --rox /lib64 --ro /etc -- /bin/true && echo "landrun smoke: exit 0" || echo "landrun smoke: FAILED exit \$?"
uname -r
BLOCK

blk comparator433 <<BLOCK
cd $X && rm -rf cmp433 && git clone -q https://github.com/leanprover/comparator.git cmp433 && cd cmp433 && git checkout -q $CMP433
echo "ships toolchain \$(cat lean-toolchain)"; echo "leanprover/lean4:v4.33.1" > lean-toolchain
lake build lean4export comparator
test "\$(git -C .lake/packages/lean4export rev-parse HEAD)" = $L4E433 && echo "lean4export rev $L4E433 as pinned"
ls -l .lake/build/bin/comparator .lake/packages/lean4export/.lake/build/bin/lean4export
sha256sum .lake/build/bin/comparator .lake/packages/lean4export/.lake/build/bin/lean4export
BLOCK

blk comparator434 <<BLOCK
cd $X && rm -rf cmp434 && git clone -q https://github.com/leanprover/comparator.git cmp434 && cd cmp434 && git checkout -q $CMP434
echo "ships toolchain \$(cat lean-toolchain)"; echo "leanprover/lean4:v4.34.1" > lean-toolchain
sed -i 's/"rev": "[0-9a-f]\{40\}"/"rev": "$L4E434"/' lake-manifest.json
lake build lean4export comparator
test "\$(git -C .lake/packages/lean4export rev-parse HEAD)" = $L4E434 && echo "lean4export rev $L4E434 as pinned"
ls -l .lake/build/bin/comparator .lake/packages/lean4export/.lake/build/bin/lean4export
sha256sum .lake/build/bin/comparator .lake/packages/lean4export/.lake/build/bin/lean4export
BLOCK

blk lean4lean <<'BLOCK'
X=/home/tester/x
cd $X && rm -rf lean4lean l4l433 l4l434 && git clone -q https://github.com/digama0/lean4lean.git && cd lean4lean
git log --format=%H -- lean-toolchain | while read c; do echo "$c $(git show $c:lean-toolchain | tr -d '\n') $(git show -s --format=%cI $c)"; done > $X/l4l-toolchains.txt
head -40 $X/l4l-toolchains.txt
for v in 33 34; do
  c=$(grep -E "lean4:v4\.$v\.[0-9]+$" $X/l4l-toolchains.txt | head -1 | cut -d' ' -f1)
  [ -n "$c" ] || c=$(grep -E "lean4:v4\.$v\." $X/l4l-toolchains.txt | head -1 | cut -d' ' -f1)
  [ -n "$c" ] || { echo "no lean4lean commit names v4.$v"; continue; }
  # the newest commit still on that toolchain: the parent of the next bump, i.e. the commit just before the next line up
  n=$(grep -n "^$c " $X/l4l-toolchains.txt | cut -d: -f1)
  if [ "$n" -gt 1 ]; then nextbump=$(sed -n "$((n-1))p" $X/l4l-toolchains.txt | cut -d' ' -f1); use=$(git rev-parse "$nextbump^"); else use=$(git rev-parse HEAD); fi
  echo "v4.$v: bump commit $c; in use $use ($(git show -s --format=%cI $use)); its toolchain $(git show $use:lean-toolchain)"
  git worktree add -q $X/l4l4$v $use
  ( cd $X/l4l4$v && echo "leanprover/lean4:v4.$v.1" > lean-toolchain && (lake build lean4lean 2>&1 | tail -15); ls -l .lake/build/bin/ 2>/dev/null; sha256sum .lake/build/bin/lean4lean 2>/dev/null ) || echo "lean4lean for v4.$v did not build"
done
BLOCK

blk conleche <<'BLOCK'
X=/home/tester/x
cd $X && rm -rf con-leche && git clone -q https://github.com/leanprover/con-leche.git && cd con-leche
echo "con-leche master $(git rev-parse HEAD) $(git log -1 --format=%cI)"; cat lean-toolchain
elan toolchain install "$(cat lean-toolchain)" 2>&1 | tail -2
lake build 2>&1 | tail -8
ls -l .lake/build/bin/ 2>/dev/null; sha256sum .lake/build/bin/* 2>/dev/null
BLOCK

{ for n in landrun comparator433 comparator434 lean4lean conleche; do echo "$n: exit $(cat $O/$n.exit) ($(cat $O/$n.start) to $(cat $O/$n.end))"; done; } > /results/extra2/tools.txt
date -u +%FT%TZ > $O/_done
