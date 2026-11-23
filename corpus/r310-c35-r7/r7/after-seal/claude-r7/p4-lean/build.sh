#!/bin/sh
# Compile modules in order, from this folder, against the built Mathlib of instruments/rh-comparison (Lean 4.35.0).
set -eu
here=$(cd "$(dirname "$0")" && pwd)
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
mkdir -p "$here/build"
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
for m in "$@"; do
  echo "== $m"
  LEAN_PATH="$here/build:$LP" /Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin/lean -R "$here" -o "$here/build/$m.olean" "$here/$m.lean" 2>&1
done
