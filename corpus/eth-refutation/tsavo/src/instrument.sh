#!/bin/bash
# R = number of declarations in bridge/Bridge/Main.lean that still contain `sorry`, from the Lean build log.
# Usage: instrument.sh <bridge_build.log>   (prints "R=<n>" and the list; nonzero exit while R>0)
log=${1:?build log}
n=$(grep -c "declaration uses \`sorry\`" "$log")
echo "R=$n sorry-declarations in Bridge.Main (build rc: $(grep -o 'build rc=[0-9]*' "$log" | tail -c 2 2>/dev/null || true))"
grep "declaration uses \`sorry\`" "$log" | sed 's/.*Main.lean:\([0-9]*\):.*/line \1/' | tr '\n' ' '; echo
[ "$n" -eq 0 ]
