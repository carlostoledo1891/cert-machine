#!/bin/bash
# k3.sh — K3's kernels and red control KR4 of PREREG-KN1.md. Run ON THE POD after `KN1.Proved` is built:
#   SRC=/root/kn1/bridge-src K3=/root/kn1/k3 bash /root/kn1/bridge-src/k3.sh
# 1. `lake env leanchecker --fresh KN1.Proved` (in the background while the rest runs).
# 2. Comparator (the lab's .github/scripts/comparator-check.sh: leanprover/comparator, lean4export, the nanoda
#    kernel forced on, landrun) with OUR statement as the challenge:
#        OurChallenge.lean = `import Printed1` + `theorem conjecture1_as_printed : KN1Printed.Conjecture1 := sorry`
#        solution module KN1.Proved, permitted axioms propext, Quot.sound, Classical.choice.
#    Must print "Your solution is okay!".
# 3. KR4: the same with the challenge changed to planted variants proved false in K0
#        OurChallengeKR4_<k>.lean = `import Planted1` + `theorem conjecture1_as_printed : KN1Planted.<Planted k> := sorry`
#    Must be REFUSED (the script exits non-zero and never prints "Your solution is okay!").
# Files added to the working tree: OurChallenge*.lean, comparator-kn1*.json (one configuration present at a time),
# lean_lib entries appended to lakefile.toml. No file of the third party is edited.
set -u
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
WORK="${WORK:-/root/kn1/third}"; SRC="${SRC:-/root/kn1/bridge-src}"; K3="${K3:-/root/kn1/k3}"
CMP="${CMP:-$(ls /root/k1/src/formal-math-*/.github/scripts/comparator-check.sh)}"
KR4="${KR4:-Planted3_inequalityReversed Planted1_maxInPlaceOfMin Planted4_strictInequality}"
mkdir -p "$K3"; cd "$WORK" || exit 2
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > "$K3/$name.log" 2>&1; local rc=$?; echo $rc > "$K3/$name.exit"; echo $(( $(date +%s) - t0 )) > "$K3/$name.seconds"; echo "$name exit $rc ($(cat "$K3/$name.seconds") s)"; return 0; }
sha256sum "$CMP" > "$K3/comparator-check.sha256"
( step fresh lake env leanchecker --fresh KN1.Proved ) &
FRESH=$!
cat > OurChallenge.lean <<'L'
import Printed1
theorem conjecture1_as_printed : KN1Printed.Conjecture1 := sorry
L
grep -q 'name = "OurChallenge"' lakefile.toml || printf '\n[[lean_lib]]\nname = "OurChallenge"\nroots = ["OurChallenge"]\n' >> lakefile.toml
for f in comparator-kn1*.json; do [ -e "$f" ] && mv "$f" "$K3/moved-aside-$(date +%s)-$f"; done
cat > comparator-kn1.json <<'L'
{"challenge_module": "OurChallenge", "solution_module": "KN1.Proved", "theorem_names": ["conjecture1_as_printed"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step challenge-build lake build OurChallenge
step comparator env LOG_DIR="$K3/comparator-logs" bash "$CMP"
if [ "$(cat "$K3/comparator.exit")" = 0 ] && grep -qxF 'Your solution is okay!' "$K3/comparator.log"; then echo "K3 Comparator (our challenge, nanoda on): ACCEPTED" | tee "$K3/verdict-comparator.txt"; else echo "K3 Comparator: NOT ACCEPTED" | tee "$K3/verdict-comparator.txt"; fi
mv comparator-kn1.json "$K3/comparator-kn1.good.json"
# ---- KR4
: > "$K3/verdict-kr4.txt"
for name in $KR4; do
  k=$(echo "$name" | sed -E 's/Planted([0-9]+)_.*/\1/')
  printf 'import Planted1\ntheorem conjecture1_as_printed : KN1Planted.%s := sorry\n' "$name" > "OurChallengeKR4_$k.lean"
  grep -q "name = \"OurChallengeKR4_$k\"" lakefile.toml || printf '\n[[lean_lib]]\nname = "OurChallengeKR4_%s"\nroots = ["OurChallengeKR4_%s"]\n' "$k" "$k" >> lakefile.toml
  printf '{"challenge_module": "OurChallengeKR4_%s", "solution_module": "KN1.Proved", "theorem_names": ["conjecture1_as_printed"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}\n' "$k" > comparator-kn1-kr4.json
  step "kr4-$k-challenge-build" lake build "OurChallengeKR4_$k"
  step "kr4-$k-comparator" env LOG_DIR="$K3/comparator-logs-kr4-$k" bash "$CMP"
  if [ "$(cat "$K3/kr4-$k-comparator.exit")" != 0 ] && ! grep -qxF 'Your solution is okay!' "$K3/kr4-$k-comparator.log"; then echo "KR4 $name: REFUSED by Comparator (exit $(cat "$K3/kr4-$k-comparator.exit"))" | tee -a "$K3/verdict-kr4.txt"; else echo "KR4 $name: NOT REFUSED" | tee -a "$K3/verdict-kr4.txt"; fi
  mv comparator-kn1-kr4.json "$K3/comparator-kn1-kr4-$k.json"
done
cp "$K3/comparator-kn1.good.json" comparator-kn1.json
wait $FRESH
if [ "$(cat "$K3/fresh.exit")" = 0 ]; then echo "leanchecker --fresh KN1.Proved: ACCEPTED (exit 0)" | tee "$K3/verdict-fresh.txt"; else echo "leanchecker --fresh KN1.Proved: exit $(cat "$K3/fresh.exit")" | tee "$K3/verdict-fresh.txt"; fi
sha256sum OurChallenge*.lean comparator-kn1.json lakefile.toml KN1/Proved.lean Printed1.lean Planted1.lean > "$K3/sha256-after.txt"
echo "k3.sh done $(date -u +%H:%M:%SZ)"
