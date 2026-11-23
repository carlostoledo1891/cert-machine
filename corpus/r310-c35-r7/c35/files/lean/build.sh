#!/bin/sh
# Compile modules in order, from this folder, against the built Mathlib of instruments/rh-comparison
# (Lean 4.35.0, Mathlib 56a00585). Prints wall time and the lean process's peak memory per module.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
mkdir -p "$here/build"
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
for m in "$@"; do
  echo "== $m"
  LEAN_PATH="$here/build:$LP" /usr/bin/time -l /Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin/lean -DwarningAsError=true -R "$here" -o "$here/build/$m.olean" "$here/$m.lean" 2>&1 \
    | grep -v "^ *[0-9]* *\(page\|block\|signal\|voluntary\|messages\|swaps\|average\|involuntary\|instructions\|cycles\|socket\|maximum resident\)"
done
