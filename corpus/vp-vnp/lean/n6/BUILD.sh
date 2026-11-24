#!/bin/bash
# Rebuilds phase 3's Mathlib-only part from an empty build/ (Lean v4.33.1, Mathlib 0df444a3; see n6lean.sh).
set -eu
cd "$(dirname "$0")"
lean="$HOME/Projects/vp-vnp-n6-ws/tools/n6lean.sh"
for f in N6B/Bird N6B/Circuit N6B/Layers N6B/Det N6R/Control N6R/MatrixAnchors N6R/Affine N6R/Substitution N6R/Bridge N6R/Growth N6R/Remark N6/Local; do
  echo "== $f"; "$lean" "$f.lean"
done
