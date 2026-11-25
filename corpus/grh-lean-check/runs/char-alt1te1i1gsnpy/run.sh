#!/bin/bash
# CHAR for grh-lean (amendment A2): Mathlib 56a00585, Lean v4.35.0; the four files unchanged from cert-machine.
export PATH=$HOME/.elan/bin:$PATH
R=/root/char-results; cd /root/char
echo "start $(date -u +%FT%TZ)" > $R/CHAR.log
echo "leanprover/lean4:v4.35.0" > lean-toolchain
cat > lakefile.toml <<T
name = "char"
[[require]]
name = "mathlib"
git = "https://github.com/leanprover-community/mathlib4"
rev = "56a005855ea17e0b0958f73ec801ae140b0a1679"
[[lean_lib]]
name = "Spec"
srcDir = "src"
[[lean_lib]]
name = "Challenge"
srcDir = "src"
[[lean_lib]]
name = "Textbook"
srcDir = "src"
[[lean_lib]]
name = "TextbookAx"
srcDir = "src"
T
sha256sum src/*.lean > $R/inputs.sha256
lake update >> $R/CHAR.log 2>&1 && lake exe cache get >> $R/CHAR.log 2>&1 || { echo "setup exit $?" >> $R/CHAR.log; exit 1; }
git -C .lake/packages/mathlib rev-parse HEAD > $R/mathlib-rev.txt
for m in Spec Challenge Textbook TextbookAx; do
  s=$(date +%s); lake build $m > $R/$m.out 2>&1; rc=$?; echo "$m exit $rc $(( $(date +%s)-s )) s" >> $R/CHAR.log
  [ $rc = 0 ] || break
done
echo "end $(date -u +%FT%TZ)" >> $R/CHAR.log
