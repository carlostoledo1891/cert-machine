#!/bin/sh
# controls.sh — three mutated copies of R7Cnf.lean; with each, R7CnfSound.lean must FAIL to compile.
# usage: sh controls.sh WORKDIR
set -u
here=$(cd "$(dirname "$0")" && pwd)
work=$1
proj=/Users/carlostoledo/Projects/cert-machine/instruments/rh-comparison
LP=$(cd "$proj" && lake env printenv LEAN_PATH)
LEAN=/Users/carlostoledo/.elan/toolchains/leanprover--lean4---v4.35.0/bin/lean
run() {
  name=$1; from=$2; to=$3
  d="$work/$name"; mkdir -p "$d/build"
  python3 - "$here/R7Cnf.lean" "$d/R7Cnf.lean" "$from" "$to" <<'PY'
import sys
s = open(sys.argv[1]).read()
assert s.count(sys.argv[3]) == 1, "the mutation site must occur exactly once"
open(sys.argv[2], "w").write(s.replace(sys.argv[3], sys.argv[4]))
PY
  cp "$here/R7CnfSound.lean" "$d/R7CnfSound.lean"
  (cd "$d" && LEAN_PATH="$d/build:$LP" "$LEAN" -R . -o build/R7Cnf.olean R7Cnf.lean > defs.log 2>&1; echo "defs exit $?" >> defs.log
   LEAN_PATH="$d/build:$LP" "$LEAN" -R . -o build/R7CnfSound.olean R7CnfSound.lean > sound.log 2>&1; echo "exit $?" >> sound.log)
  echo "$name: definitions $(tail -1 "$d/defs.log"); soundness file: $(grep -c 'error' "$d/sound.log") error line(s), $(tail -1 "$d/sound.log"); sorryAx in axioms: $(grep -c sorryAx "$d/sound.log")"
}
run C-threshold '10 - I.length - maxMiss' '9 - I.length - maxMiss'
run C-counter   '[[-(l.getD i 0), -(s (i - 1) (k - 1))]]' '[[-(l.getD i 0), s (i - 1) (k - 1)]]'
run C-order     '[neg (e y.val), neg (xv c y), pos (xv c'"'"' y)] ::' '[neg (e y.val), pos (xv c y), neg (xv c'"'"' y)] ::'
