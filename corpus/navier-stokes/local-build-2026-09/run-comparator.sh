#!/bin/sh
# Run the Lean FRO's Comparator on OpenAI's solution, on macOS, with the pass-through landrun
# stand-in (bin/landrun) in place of the Linux-only Landlock sandbox, and nanoda as the
# independent external kernel. Statement equality, the axiom walk, Lean's kernel replay and
# nanoda's replay are all performed; process isolation is not.
set -u
ROOT=/Users/carlostoledo/Projects/navier-stokes-lean
cd "$ROOT/NavierStokesAndEuler" || exit 2
date
echo "== building lean4export (the pinned package) =="
( cd .lake/packages/lean4export && lake build 2>&1 | tail -3 )
L4E="$ROOT/NavierStokesAndEuler/.lake/packages/lean4export/.lake/build/bin/lean4export"
ls -la "$L4E" || { echo "no lean4export binary"; exit 3; }
export PATH="$ROOT/bin:$ROOT/nanoda_lib/target/release:$(dirname "$L4E"):$PATH"
export COMPARATOR_LANDRUN="$ROOT/bin/landrun"
export COMPARATOR_LEAN4EXPORT="$L4E"
export COMPARATOR_NANODA="$ROOT/nanoda_lib/target/release/nanoda_bin"
echo "landrun stand-in: $COMPARATOR_LANDRUN"; echo "nanoda: $COMPARATOR_NANODA"; nanoda_bin --version 2>/dev/null || true
for cfg in ComparatorChallenges/NavierStokes.json ComparatorChallenges/Euler.json; do
  echo "== lake exe comparator $cfg =="
  date
  time lake exe comparator "$cfg" 2>&1
  echo "COMPARATOR EXIT $? for $cfg"
  date
done
echo "DONE"
