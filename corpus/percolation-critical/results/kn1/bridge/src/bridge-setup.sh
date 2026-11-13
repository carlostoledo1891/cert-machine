#!/bin/bash
# bridge-setup.sh — run ON THE POD. Assembles our modules in a working copy of the third party's built tree.
#   SRC      this folder (the bridge sources as on the desk: perc/kn1/bridge/)
#   SEALED   /root/sealed       Printed.lean Printed1.lean Planted1.lean (sealed bytes)
#   SEALED3  /root/sealed-kn3   Check.lean Planted.lean PlantedCheck.lean (the sibling's sealed fragments)
#   WORK     /root/kn1/third    a copy of the third party's tree after K1 (no file of theirs is edited; lakefile.toml
#                               gets our [[lean_lib]] entries appended, once)
# Layout written:
#   $WORK/Printed.lean, Printed1.lean, Planted1.lean   the sealed bytes, unchanged
#   $WORK/KN1/K0/Frag.lean          31-byte import header ++ Check ++ Planted ++ PlantedCheck (sealed bytes)
#   $WORK/KN1/K0/*.lean             the K0 modules, unchanged (SRC/K0/, = perc/kn1/k0/KN1/K0/)
#   $WORK/KN1/Bridge/Transport3.lean  "import KN1.K0.Frag" ++ the sibling's bridge/Transport.lean, unchanged (SRC/kn3/)
#   $WORK/KN1/Bridge/DepWalk.lean     the sibling's bridge/DepWalk.lean, unchanged (SRC/kn3/)
#   $WORK/KN1/Bridge/{Transport1,Compare,Targets,Cheat,Walk,Axioms}.lean, $WORK/KN1/Proved.lean   as they are
set -eu
SRC="${SRC:?SRC=the bridge sources}"; SEALED="${SEALED:-/root/sealed}"; SEALED3="${SEALED3:-/root/sealed-kn3}"
WORK="${WORK:-/root/kn1/third}"
sha256sum -c - <<EOF
161411bd3a703971c05bbbe10554841612bbb97f0f23eaae9988468b1a98def8  $SEALED/Printed.lean
f168a013573ae665753ee73ce2adf5192a03bb5bd14b8d4c00b5e75f7df6aacb  $SEALED/Printed1.lean
2ea564dab87cd7dbdac03370a42aad48e49370cc1657951261cf776e9e6a55b1  $SEALED/Planted1.lean
5e337e967eb3ebd9df22b2e1ea79ae79dd6cc918e62672581cdbe341bbcd1740  $SEALED3/Check.lean
70b4f0bd68319005ce4250fc4a42fec93e885f393e6da2b250ab16c6b0357848  $SEALED3/Planted.lean
849cf56114867c4ceec23a0781a66272eb4e52aa8dbbf2aecb7189a11ea63664  $SEALED3/PlantedCheck.lean
EOF
( cd "$SRC" && sha256sum -c INPUTS-FIXED.sha256 )   # the K0 modules and the sibling's two files are the recorded bytes
mkdir -p "$WORK/KN1/K0" "$WORK/KN1/Bridge"
cp "$SEALED/Printed.lean" "$SEALED/Printed1.lean" "$SEALED/Planted1.lean" "$WORK/"
{ printf 'import Mathlib\nimport Printed\n\n'; cat "$SEALED3/Check.lean" "$SEALED3/Planted.lean" "$SEALED3/PlantedCheck.lean"; } > "$WORK/KN1/K0/Frag.lean"
cp "$SRC"/K0/*.lean "$WORK/KN1/K0/"
{ printf 'import KN1.K0.Frag\n\n'; cat "$SRC/kn3/Transport.lean"; } > "$WORK/KN1/Bridge/Transport3.lean"
cp "$SRC/kn3/DepWalk.lean" "$WORK/KN1/Bridge/DepWalk.lean"
for f in Transport1 Compare Targets Cheat Walk Axioms; do cp "$SRC/$f.lean" "$WORK/KN1/Bridge/$f.lean"; done
cp "$SRC/Proved.lean" "$WORK/KN1/Proved.lean"
find "$WORK/KN1" -name '._*' -print -delete
grep -q 'name = "KN1Printed"' "$WORK/lakefile.toml" || cat "$SRC/lakefile-additions.toml" >> "$WORK/lakefile.toml"
cmp <(tail -c +32 "$WORK/KN1/K0/Frag.lean") <(cat "$SEALED3/Check.lean" "$SEALED3/Planted.lean" "$SEALED3/PlantedCheck.lean") && echo "Frag.lean = 31-byte header ++ the three sealed fragments"
cmp <(tail -c +21 "$WORK/KN1/Bridge/Transport3.lean") "$SRC/kn3/Transport.lean" && echo "Transport3.lean = 20-byte header ++ the sibling's Transport.lean"
( cd "$WORK" && sha256sum Printed.lean Printed1.lean Planted1.lean KN1/K0/*.lean KN1/Bridge/*.lean KN1/Proved.lean lakefile.toml )
