#!/bin/bash
# red.sh — the red controls KR1, KR2, KR3 of PREREG-KN1.md. Run ON THE POD, after the green build:
#   SRC=/root/kn1/bridge-src RED=/root/kn1/red bash /root/kn1/bridge-src/red.sh
# (KR4 — Comparator with the challenge changed to a planted variant — is in k3.sh, with the Comparator.)
#
# KR1  THE PROOF SCRIPTS FOR T1 AGAINST EACH PLANTED STATEMENT. For every planted definition P proved false in K0
#      (Planted 1–11), and, reported apart, for Planted 12 (proved TRUE: not part of KR1):
#      (K2) one file = our K2 scripts for T1 as they are (Transport1.lean ++ Compare.lean, import lines removed,
#           behind the imports they need) with the name `KN1Printed.Conjecture1` replaced by `KN1Planted.P`
#           everywhere: must FAIL to compile. The log names the declarations in which the errors fall.
#      (K3) Proved.lean with the same replacement, against the GENUINE built `KN1.Bridge.Compare`: must FAIL.
#      Green control of the harness: the same two files with the name replaced by itself must compile (exit 0).
#      Nothing is swapped inside the working tree: every red file lives under $RED and is compiled with
#      `lake env lean`.
# KR2  the dependency walk on cheating proofs (KN1/Bridge/Cheat.lean): the five `#kn1_walk FLAGGED` of
#      KN1/Bridge/Walk.lean pass (verdicts re-read from the walk's log), and the converse: a file that EXPECTS a
#      cheat to be CLEAN must fail to compile, for each of the five.
# KR3  forbidden tokens: none in the files that carry proofs; every match elsewhere is listed and classified.
#
# Afterwards: sha256 of the working set re-verified against the list taken at the start, and the third party's
# files compared with the pristine tree.
set -u
export PATH=$HOME/.elan/bin:$PATH
WORK="${WORK:-/root/kn1/third}"; SRC="${SRC:-/root/kn1/bridge-src}"; RED="${RED:-/root/kn1/red}"
SEALED="${SEALED:-/root/sealed}"
PRISTINE="${PRISTINE:-$(ls -d /root/third/src/percolation-after-anthropic-*/)}"
WALKLOG="${WALKLOG:-/root/kn1/bridge-logs/walk.log}"
TOKENS='sorry|axiom|native_decide|implemented_by|unsafe|extern|admit'
mkdir -p "$RED"; cd "$WORK" || exit 2
fail=0
say() { echo "$@" | tee -a "$RED/summary.txt"; }
: > "$RED/summary.txt"
say "red.sh start $(date -u +%Y-%m-%dT%H:%M:%SZ)"
( sha256sum Printed.lean Printed1.lean Planted1.lean KN1/K0/*.lean KN1/Bridge/*.lean KN1/Proved.lean lakefile.toml ) > "$RED/sha256-before.txt"
for f in Printed Printed1 Planted1; do cmp -s $f.lean "$SEALED/$f.lean" || { say "$f.lean differs from the sealed bytes BEFORE the run"; fail=1; }; done

# --- the red files, made mechanically -----------------------------------------------------------------------------
python3 - "$WORK" "$RED" <<'PY'
import re, sys
work, red = sys.argv[1:3]
strip = lambda t: "".join(l for l in t.splitlines(keepends=True) if not l.startswith("import "))
t1 = strip(open(f"{work}/KN1/Bridge/Transport1.lean").read())
cmp_ = strip(open(f"{work}/KN1/Bridge/Compare.lean").read())
proved = strip(open(f"{work}/KN1/Proved.lean").read())
planted = open(f"{work}/Planted1.lean").read()
names = re.findall(r"^def (Planted\d+_\w+)", planted, re.M)
assert len(names) == 17, names
want = [n for n in names if int(re.match(r"Planted(\d+)", n).group(1)) <= 12]
head2 = "import KNConjectures.Conjectures\nimport KNConjectures.KN1Statement\nimport KN1.Bridge.Transport3\nimport KN1.K0.Required\nimport Planted1\n\n"
head3 = "import KNConjectures.Conjectures\nimport KN1.Bridge.Compare\nimport Planted1\n\n"
pat = re.compile(r"\bKN1Printed\.Conjecture1\b(?!_)")
def put(tag, repl):
    a, k1 = pat.subn(repl, t1); b, k2 = pat.subn(repl, cmp_); c, k3 = pat.subn(repl, proved)
    assert k1 >= 2 and k2 >= 6 and k3 >= 1, (k1, k2, k3)
    open(f"{red}/K2_{tag}.lean", "w").write(head2 + a + "\n" + b)
    open(f"{red}/K3_{tag}.lean", "w").write(head3 + c)
    return k1, k2, k3
print("green: the name replaced by itself:", put("green", "KN1Printed.Conjecture1"))
for n in want:
    k = re.match(r"Planted(\d+)", n).group(1)
    print(f"plant {k}: {n}: occurrences replaced (Transport1, Compare, Proved):", put("P" + k, "KN1Planted." + n))
open(f"{red}/plants.txt", "w").write("\n".join(want) + "\n")
PY
[ $? -eq 0 ] || { say "could not make the red files"; exit 2; }

# --- KR1: compile them all (in parallel) --------------------------------------------------------------------------
ls "$RED"/K2_*.lean "$RED"/K3_*.lean | xargs -P 14 -I{} bash -c 'f={}; lake env lean "$f" > "${f%.lean}.log" 2>&1; echo $? > "${f%.lean}.exit"'
decls() { # decls FILE LOG : the declarations of FILE in which the errors of LOG fall
  python3 - "$1" "$2" <<'PY'
import re, sys
src = open(sys.argv[1]).read().splitlines()
errs = [int(m.group(1)) for m in re.finditer(r":(\d+):\d+: error", open(sys.argv[2]).read())]
out = []
for e in errs:
    i = e - 1
    while i >= 0 and not re.match(r"(theorem|def|example|instance) ", src[i]): i -= 1
    name = re.match(r"\w+ (\S+)", src[i]).group(1) if i >= 0 else "?"
    if name not in out: out.append(name)
print(len(errs), "error(s) in:", ", ".join(out) if out else "-")
PY
}
for tag in green; do
  for K in K2 K3; do
    rc=$(cat "$RED/${K}_$tag.exit")
    if [ "$rc" = 0 ] && ! grep -q "error" "$RED/${K}_$tag.log"; then say "KR1 harness control ($K, the name replaced by itself): compiles, exit 0 — as it must"; else say "KR1 harness control ($K): DOES NOT COMPILE (exit $rc) — the harness proves nothing"; fail=1; fi
  done
done
while read -r name; do
  k=$(echo "$name" | sed -E 's/Planted([0-9]+)_.*/\1/'); tag="P$k"
  rc2=$(cat "$RED/K2_$tag.exit"); rc3=$(cat "$RED/K3_$tag.exit")
  d2=$(decls "$RED/K2_$tag.lean" "$RED/K2_$tag.log"); d3=$(decls "$RED/K3_$tag.lean" "$RED/K3_$tag.log")
  if [ "$rc2" != 0 ] && [ "$rc3" != 0 ] && grep -q "error" "$RED/K2_$tag.log" && grep -q "error" "$RED/K3_$tag.log"; then v="REFUSED (both fail to compile)"; else v="NOT REFUSED"; fi
  if [ "$k" = 12 ]; then
    say "Planted 12 (TRUE in K0; not part of KR1) $name: K2 scripts exit $rc2, $d2; K3 script exit $rc3, $d3 — $v"
  else
    say "KR1 $name: K2 scripts exit $rc2, $d2; K3 script exit $rc3, $d3 — $v"
    case "$v" in REFUSED*) ;; *) fail=1;; esac
  fi
done < "$RED/plants.txt"

# --- KR2: the walk on the cheats ------------------------------------------------------------------------------------
for c in cheat_R0_to_T1 cheat_R0_to_T2 cheat_T1_via_T2 cheat_via_lowerBound cheat_T1_to_R0; do
  if grep -A40 "kn1walk KN1Cheat.$c:" "$WALKLOG" | grep -m1 "verdict:" | grep -q FLAGGED; then
    why=$(grep -A40 "kn1walk KN1Cheat.$c:" "$WALKLOG" | grep -m1 -A1 "flags:" | tail -1 | cut -c1-170)
    say "KR2 KN1Cheat.$c: FLAGGED by the walk —$why"
  else say "KR2 KN1Cheat.$c: NOT FLAGGED"; fail=1; fi
  printf 'import KN1.Bridge.Walk\n\n#kn1_walk CLEAN KN1Cheat.%s\n' "$c" > "$RED/KR2_expect_clean_$c.lean"
done
ls "$RED"/KR2_expect_clean_*.lean | xargs -P 5 -I{} bash -c 'f={}; lake env lean "$f" > "${f%.lean}.log" 2>&1; echo $? > "${f%.lean}.exit"'
for c in cheat_R0_to_T1 cheat_R0_to_T2 cheat_T1_via_T2 cheat_via_lowerBound cheat_T1_to_R0; do
  rc=$(cat "$RED/KR2_expect_clean_$c.exit")
  if [ "$rc" != 0 ] && grep -q "expected CLEAN, got FLAGGED" "$RED/KR2_expect_clean_$c.log"; then say "KR2 converse, $c expected CLEAN: fails to compile (exit $rc, 'expected CLEAN, got FLAGGED') — as it must"; else say "KR2 converse, $c: COMPILES or fails otherwise (exit $rc)"; fail=1; fi
done

# --- KR3: forbidden tokens --------------------------------------------------------------------------------------------
PROOF="KN1/Bridge/Transport3.lean KN1/Bridge/Transport1.lean KN1/Bridge/Compare.lean KN1/Bridge/Targets.lean KN1/Proved.lean KN1/K0/Basic.lean KN1/K0/Required.lean KN1/K0/PlantedFalse.lean KN1/K0/PlantedFalse10.lean KN1/K0/PlantedFalse11.lean KN1/K0/Planted12.lean KN1/K0/Readings.lean KN1/K0/Weakenings.lean"
OTHER="Printed.lean Printed1.lean Planted1.lean KN1/K0/Frag.lean KN1/K0/Axioms.lean KN1/Bridge/Axioms.lean KN1/Bridge/Cheat.lean KN1/Bridge/DepWalk.lean KN1/Bridge/Walk.lean"
grep -nHE "$TOKENS" $PROOF > "$RED/KR3-proof-files.txt" 2>&1
n=$(wc -l < "$RED/KR3-proof-files.txt")
if [ "$n" = 0 ]; then say "KR3 proof files ($(echo $PROOF | wc -w) files): 0 matching lines"; else say "KR3 proof files: $n matching lines"; cat "$RED/KR3-proof-files.txt" | tee -a "$RED/summary.txt"; fail=1; fi
grep -nHE "$TOKENS" $OTHER > "$RED/KR3-other-files.txt" 2>&1
for f in $OTHER; do
  t=$(grep -c "^$f:" "$RED/KR3-other-files.txt"); p=$(grep "^$f:" "$RED/KR3-other-files.txt" | grep -cE ":[0-9]+:#print axioms ")
  say "KR3 other file $f: $t matching line(s), of which $p are '#print axioms' commands"
done
grep -vE ":[0-9]+:#print axioms " "$RED/KR3-other-files.txt" > "$RED/KR3-other-files-not-print-axioms.txt"
say "KR3 other files, lines that are not '#print axioms' commands: $(wc -l < "$RED/KR3-other-files-not-print-axioms.txt") (listed in KR3-other-files-not-print-axioms.txt, classified in RESULTS.md)"

# --- afterwards ---------------------------------------------------------------------------------------------------------
( sha256sum Printed.lean Printed1.lean Planted1.lean KN1/K0/*.lean KN1/Bridge/*.lean KN1/Proved.lean lakefile.toml ) > "$RED/sha256-after.txt"
if cmp -s "$RED/sha256-before.txt" "$RED/sha256-after.txt"; then say "working set unchanged by the red run (sha256 before = after)"; else say "WORKING SET CHANGED"; fail=1; fi
diff -rq "$PRISTINE" "$WORK" -x .lake -x KN1 -x Printed.lean -x Printed1.lean -x Planted1.lean -x K1Axioms.lean -x 'OurChallenge*.lean' -x 'comparator-kn1*.json' -x lakefile.toml > "$RED/diff-pristine.txt" 2>&1
say "third party's files against the pristine tree (our added files and lakefile.toml set apart): $(wc -l < "$RED/diff-pristine.txt") difference(s) $(tr '\n' ';' < "$RED/diff-pristine.txt" | cut -c1-300)"
if cmp -s -n "$(stat -c %s "$PRISTINE/lakefile.toml")" "$PRISTINE/lakefile.toml" lakefile.toml; then say "lakefile.toml: the third party's bytes, unchanged, followed by $(( $(stat -c %s lakefile.toml) - $(stat -c %s "$PRISTINE/lakefile.toml") )) bytes of our [[lean_lib]] entries"; else say "lakefile.toml: THE THIRD PARTY'S BYTES ARE NOT A PREFIX"; fail=1; fi
say "red.sh done $(date -u +%Y-%m-%dT%H:%M:%SZ): $([ $fail = 0 ] && echo 'ALL RED CONTROLS REFUSED AS THEY MUST' || echo 'A RED CONTROL DID NOT BEHAVE')"
exit $fail
