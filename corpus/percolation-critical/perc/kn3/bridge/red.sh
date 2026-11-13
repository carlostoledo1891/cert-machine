#!/bin/bash
# red.sh — the red controls KR1, KR2, KR3 of PREREG-KN3.md. Run ON THE POD, after the green build:
#   nohup /root/kn3/src/red.sh > /root/kn3/red/red.out 2>&1 < /dev/null &
# (KR4 — Comparator with the challenge changed to Planted3 — is the orchestrator's.)
#
# KR1  the bridge against Planted3, Planted4, Planted5 swapped in for `Conjecture3`: must FAIL to elaborate.
#      Two forms, both run for each plant N:
#      (b) the bridge's own proof script against the planted statement: KN3/Red<N>.lean is Transport.lean with
#          the namespace renamed and the word `Conjecture3` replaced by the planted definition's name. Everything
#          that does not mention the conjecture (the measure transports, the dictionary of connections) must
#          still elaborate, and the implications must not: expected exit 1, with every error inside
#          `conjecture3_of_labForm` / `labForm_of_conjecture3` (and what follows from them).
#      (a) the letter of the rule: Printed.lean with the BODY of `Conjecture3` replaced by the body of the planted
#          definition (taken mechanically from the sealed Planted.lean), swapped in place, then
#          `lake build KN3.Compare`: expected exit 1. Note: with (a) the build already stops in KN3.Frag, i.e. in
#          the sealed sanity lemmas of Check.lean / PlantedCheck.lean, before it reaches the bridge; (b) is the
#          form that tests the bridge itself.
# KR2  the dependency walk on cheating proofs (KN3/Cheat.lean, proved from the lab's theorem): the three
#      `#depwalk_expect FLAGGED` of KN3/Walk.lean pass (verdicts re-read from the build log), and the converse:
#      a file that EXPECTS the cheat to be CLEAN must fail to compile.
# KR3  forbidden tokens: none in the files that carry proofs; every match elsewhere is listed and classified.
#
# Afterwards: every swapped file restored, sha256 of the whole working set re-verified against the list taken at
# the start, the green targets rebuilt (must be up to date / exit 0), and the lab's tree compared with the
# pristine copy (`diff -rq --exclude=.lake`).
set -u
export PATH=$HOME/.elan/bin:$PATH
WORK="${WORK:-/root/kn3/percolation}"
SEALED="${SEALED:-/root/sealed}"
SRC="${SRC:-/root/kn3/src}"
RED="${RED:-/root/kn3/red}"
PRISTINE="${PRISTINE:-/root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/percolation}"
TOKENS='sorry|axiom|native_decide|implemented_by|unsafe|extern|admit'
mkdir -p "$RED"
cd "$WORK" || exit 2
fail=0
say() { echo "$@" | tee -a "$RED/summary.txt"; }
: > "$RED/summary.txt"
say "red.sh start $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# --- the working set and its hashes, before -------------------------------------------------------------------
( sha256sum Printed.lean KN3/*.lean lakefile.toml ) > "$RED/sha256-before.txt"
[ "$(sha256sum < Printed.lean)" = "$(sha256sum < "$SEALED/Printed.lean")" ] || { say "Printed.lean differs from the sealed bytes BEFORE the run"; fail=1; }

# --- the plants, made mechanically from the sealed files --------------------------------------------------------
python3 - "$SEALED" "$SRC" "$RED" <<'PY'
import re, sys
sealed, src, red = sys.argv[1:4]
printed = open(f"{sealed}/Printed.lean").read()
planted = open(f"{sealed}/Planted.lean").read()
transport = open(f"{src}/Transport.lean").read()
names = {3: "Planted3_conclusionReversed", 4: "Planted4_hypothesisDropped", 5: "Planted5_existsInsteadOfForall"}
def body(text, name):
    m = re.search(r"^def " + re.escape(name) + r" : Prop :=\n((?:[ \t]+\S.*\n)+)", text, re.M)
    assert m, name
    return m.group(1)
orig = body(printed, "Conjecture3")
assert printed.count(orig) >= 1
head = "def Conjecture3 : Prop :=\n"
i = printed.index(head) + len(head)
assert printed[i:i + len(orig)] == orig
for n, name in names.items():
    b = body(planted, name)
    assert b != orig
    # (a) Printed.lean with the body of Conjecture3 replaced by the body of the planted definition
    open(f"{red}/Printed.R{n}.lean", "w").write(printed[:i] + b + printed[i + len(orig):])
    # (b) the bridge's proofs against the planted statement
    t = transport.replace("KN3Transport", f"KN3Red{n}")
    t, k = re.subn(r"\bConjecture3\b", f"KN3Planted.{name}", t)
    assert k >= 3, k
    open(f"{red}/Red{n}.lean", "w").write("import KN3.Frag\n\n" + t)
    print(f"plant {n}: {name}: body of {len(b.splitlines())} lines; {k} occurrences of Conjecture3 replaced in Transport.lean")
PY
[ $? -eq 0 ] || { say "could not make the plants"; exit 2; }
for n in 3 4 5; do diff "$SEALED/Printed.lean" "$RED/Printed.R$n.lean" > "$RED/KR1a-R$n.diff"; done

# --- KR1 (b): the bridge's proof script against each planted statement ------------------------------------------
for n in 3 4 5; do
  t0=$(date +%s)
  lake env lean "$RED/Red$n.lean" > "$RED/KR1b-R$n.log" 2>&1
  code=$?
  secs=$(( $(date +%s) - t0 ))
  nerr=$(grep -c ': error' "$RED/KR1b-R$n.log")
  first=$(grep -m1 ': error' "$RED/KR1b-R$n.log" | cut -c1-200)
  # the first line of the first implication in the red file: every error must be at or after it
  line0=$(grep -n '^theorem conjecture3_of_labForm' "$RED/Red$n.lean" | cut -d: -f1)
  early=$(grep ': error' "$RED/KR1b-R$n.log" | sed -E 's/^[^:]*:([0-9]+):.*/\1/' | awk -v L="$line0" '$1 < L' | wc -l)
  echo "$code" > "$RED/KR1b-R$n.exit"; echo "$secs" > "$RED/KR1b-R$n.seconds"
  if [ "$code" -ne 0 ] && [ "$nerr" -gt 0 ] && [ "$early" -eq 0 ]; then
    say "KR1b plant $n: REFUSED (exit $code, $secs s, $nerr errors, none before line $line0 = the implications). first: $first"
  else
    say "KR1b plant $n: NOT REFUSED AS EXPECTED (exit $code, errors $nerr, errors before the implications $early)"; fail=1
  fi
done

# --- KR1 (a): the letter of the rule — the planted body swapped into Printed.lean -------------------------------
for n in 3 4 5; do
  cp "$RED/Printed.R$n.lean" Printed.lean
  t0=$(date +%s)
  lake build KN3.Compare > "$RED/KR1a-R$n.log" 2>&1
  code=$?
  secs=$(( $(date +%s) - t0 ))
  cp "$SEALED/Printed.lean" Printed.lean
  echo "$code" > "$RED/KR1a-R$n.exit"; echo "$secs" > "$RED/KR1a-R$n.seconds"
  first=$(grep -m1 '^error: ' "$RED/KR1a-R$n.log" | cut -c1-200)
  built_printed=$(grep -c 'Built Printed' "$RED/KR1a-R$n.log")
  if [ "$code" -ne 0 ]; then
    say "KR1a plant $n: REFUSED (exit $code, $secs s; the planted Printed.lean itself built: $built_printed). first: $first"
  else
    say "KR1a plant $n: NOT REFUSED (exit 0)"; fail=1
  fi
done

# --- restore, and rebuild the green targets ---------------------------------------------------------------------
cp "$SEALED/Printed.lean" Printed.lean
t0=$(date +%s)
lake build KN3.Compare KN3.Proved KN3.Cheat KN3.Axioms KN3.Walk > "$RED/restore.log" 2>&1
code=$?
echo "$code" > "$RED/restore.exit"
say "restore: lake build KN3.Compare KN3.Proved KN3.Cheat KN3.Axioms KN3.Walk: exit $code, $(( $(date +%s) - t0 )) s"
[ "$code" -eq 0 ] || fail=1
grep "depends on axioms" "$RED/restore.log" | grep -v "KN3/Frag.lean" > "$RED/axioms-after-restore.out"
bad=$(grep -vc "depends on axioms: \[propext, Classical.choice, Quot.sound\]$" "$RED/axioms-after-restore.out")
say "axioms after restore: $(wc -l < "$RED/axioms-after-restore.out") lines, $bad of them not exactly [propext, Classical.choice, Quot.sound]"
[ "$bad" -eq 0 ] || fail=1

# --- KR2: the walk on the cheating proofs ------------------------------------------------------------------------
awk '/^info: /{name=""} /^info: KN3\/Walk.lean:[0-9]+:0: depwalk /{name=$4} /^  verdict: /{if (name != "") print name, $2}' "$RED/restore.log" > "$RED/KR2-verdicts.txt"
for c in KN3Cheat.cheat_R0_to_lab KN3Cheat.cheat_N2_to_lab KN3Cheat.cheat_via_additive; do
  v=$(grep "^$c: " "$RED/KR2-verdicts.txt" | awk '{print $2}')
  if [ "$v" = "FLAGGED" ]; then say "KR2 $c: FLAGGED by the walk"; else say "KR2 $c: verdict '$v' — NOT FLAGGED"; fail=1; fi
done
nclean=$(grep -c "^KN3Compare\.[A-Za-z0-9_]*: CLEAN$" "$RED/KR2-verdicts.txt")
say "KR2 (green side): $nclean K2 theorems walked CLEAN: $(grep '^KN3Compare' "$RED/KR2-verdicts.txt" | tr '\n' ' ')"
# the converse: a file that expects the cheat to be CLEAN must not compile
cat > "$RED/WalkRed.lean" <<'LEAN'
import KN3.DepWalk
import KN3.Cheat
#depwalk_expect CLEAN KN3Cheat.cheat_R0_to_lab Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds
LEAN
t0=$(date +%s)
lake env lean "$RED/WalkRed.lean" > "$RED/KR2-WalkRed.log" 2>&1
code=$?
echo "$code" > "$RED/KR2-WalkRed.exit"
if [ "$code" -ne 0 ] && grep -q "expected CLEAN, got FLAGGED" "$RED/KR2-WalkRed.log"; then
  say "KR2 converse: a walk file expecting the cheat to be CLEAN fails to compile (exit $code, $(( $(date +%s) - t0 )) s)"
else
  say "KR2 converse: NOT REFUSED (exit $code)"; fail=1
fi

# --- KR3: forbidden tokens ---------------------------------------------------------------------------------------
# (i) the files that carry our proofs and statements of the bridge: no match at all
grep -nE "$TOKENS" "$SRC/Transport.lean" "$SRC/Exhaustion.lean" "$SRC/Compare.lean" "$SRC/Proved.lean" "$SRC/Cheat.lean" \
  KN3/Transport.lean KN3/Exhaustion.lean KN3/Compare.lean KN3/Proved.lean KN3/Cheat.lean Printed.lean \
  > "$RED/KR3-proof-files.txt"
n1=$(wc -l < "$RED/KR3-proof-files.txt")
if [ "$n1" -eq 0 ]; then say "KR3 (i) Transport, Exhaustion, Compare, Proved, Cheat, Printed: no match"; else say "KR3 (i): $n1 matches"; fail=1; fi
# (ii) every other file of ours: each match listed; allowed only `#print axioms` commands (sealed Check.lean /
#      PlantedCheck.lean inside KN3/Frag.lean, and Axioms.lean), and the walk's own source and prose
grep -nE "$TOKENS" KN3/Frag.lean KN3/Axioms.lean KN3/Walk.lean KN3/DepWalk.lean > "$RED/KR3-other-files.txt"
# (the sealed Check.lean also has ONE line of prose with two of the words, in its module docstring; it is matched
#  here by its exact text — amendment after run 1, which stopped on it: see LOG.md)
grep -vE "^KN3/(Frag|Axioms)\.lean:[0-9]+:#print axioms |^KN3/DepWalk\.lean:" "$RED/KR3-other-files.txt" \
  | grep -vxF 'KN3/Frag.lean:11:What is proved (all without `sorry`, axioms printed at the end):' > "$RED/KR3-unclassified.txt"
n2=$(wc -l < "$RED/KR3-other-files.txt"); n3=$(wc -l < "$RED/KR3-unclassified.txt")
say "KR3 (ii) Frag, Axioms, Walk, DepWalk: $n2 matches, all listed in KR3-other-files.txt: $(grep -c '#print axioms ' "$RED/KR3-other-files.txt") '#print axioms' commands, $(grep -c '^KN3/DepWalk' "$RED/KR3-other-files.txt") lines of the walk's own source, $(grep -cF 'What is proved (all without' "$RED/KR3-other-files.txt") line of prose in the sealed Check.lean docstring; anything else: $n3"
[ "$n3" -eq 0 ] || fail=1

# --- hashes after, and the lab's tree against the pristine copy --------------------------------------------------
( sha256sum Printed.lean KN3/*.lean lakefile.toml ) > "$RED/sha256-after.txt"
if cmp -s "$RED/sha256-before.txt" "$RED/sha256-after.txt"; then say "sha256 of Printed.lean, KN3/*.lean, lakefile.toml: identical before and after"; else say "sha256 CHANGED"; fail=1; fi
[ "$(sha256sum < Printed.lean)" = "$(sha256sum < "$SEALED/Printed.lean")" ] && say "Printed.lean = the sealed bytes ($(sha256sum < Printed.lean | cut -c1-16)…)" || { say "Printed.lean differs from the sealed bytes"; fail=1; }
diff -rq --exclude=.lake "$PRISTINE" "$WORK" > "$RED/diff-against-pristine.txt" 2>&1
say "diff -rq --exclude=.lake pristine working: $(wc -l < "$RED/diff-against-pristine.txt") lines:"
cat "$RED/diff-against-pristine.txt" | tee -a "$RED/summary.txt"
diff "$PRISTINE/lakefile.toml" "$WORK/lakefile.toml" > "$RED/lakefile.diff"

say "red.sh end $(date -u +%Y-%m-%dT%H:%M:%SZ): $([ $fail -eq 0 ] && echo 'ALL RED CONTROLS REFUSED, FILES RESTORED' || echo 'A CONTROL DID NOT BEHAVE AS EXPECTED')"
echo $fail > "$RED/red.exit"
exit $fail
