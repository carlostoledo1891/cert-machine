#!/bin/bash
# pod-setup.sh SRC — run ON THE POD. Assembles our modules in the working copy of the lab's built tree.
#   SRC            the folder holding the bridge sources (Transport.lean, Exhaustion.lean, Compare.lean, …)
#   /root/sealed   the sealed bytes (Printed.lean, Check.lean, Planted.lean, PlantedCheck.lean)
#   $WORK          the working tree (default /root/kn3/percolation), a copy of the built library
# Layout written:
#   $WORK/Printed.lean          the sealed bytes, unchanged (lean_lib KN3Printed, root Printed)
#   $WORK/KN3/Frag.lean         "import Mathlib / import Printed" ++ Check ++ Planted ++ PlantedCheck (sealed bytes)
#   $WORK/KN3/Transport.lean    "import KN3.Frag" ++ Transport.lean
#   $WORK/KN3/Exhaustion.lean   "import KN3.Transport" ++ Exhaustion.lean
#   $WORK/KN3/{Compare,Proved,Cheat,Walk,Axioms,DepWalk}.lean   as they are
# The lab's lakefile.toml gets two [[lean_lib]] entries appended, once; no other file of the lab is touched.
set -eu
SRC="${1:?usage: pod-setup.sh SRC}"
WORK="${WORK:-/root/kn3/percolation}"
SEALED="${SEALED:-/root/sealed}"
mkdir -p "$WORK/KN3"
cp "$SEALED/Printed.lean" "$WORK/Printed.lean"
{ printf 'import Mathlib\nimport Printed\n\n'; cat "$SEALED/Check.lean" "$SEALED/Planted.lean" "$SEALED/PlantedCheck.lean"; } > "$WORK/KN3/Frag.lean"
{ printf 'import KN3.Frag\n\n'; cat "$SRC/Transport.lean"; } > "$WORK/KN3/Transport.lean"
{ printf 'import KN3.Transport\n\n'; cat "$SRC/Exhaustion.lean"; } > "$WORK/KN3/Exhaustion.lean"
for f in Compare Proved Cheat Walk Axioms DepWalk; do cp "$SRC/$f.lean" "$WORK/KN3/$f.lean"; done
if ! grep -q 'name = "KN3Printed"' "$WORK/lakefile.toml"; then
  cat >> "$WORK/lakefile.toml" <<'TOML'

# KN3 (added 2026-11-13): the sealed hand-written statement of Kozma-Nitzan Conjecture 3 and the bridge to it.
[[lean_lib]]
name = "KN3Printed"
roots = ["Printed"]

[[lean_lib]]
name = "KN3"
globs = ["KN3.+"]
TOML
fi
( cd "$WORK" && sha256sum Printed.lean KN3/*.lean )
