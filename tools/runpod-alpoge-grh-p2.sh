#!/usr/bin/env bash
# runpod-alpoge-grh-p2.sh — phase 2 of the decision of Alpöge's Lean release (notes/alpoge-grh-preregistration-2026-11-20.md),
# started on the pod right after phase 1 and waiting there for "phase 1 done", so it runs whether or not anyone is watching.
#   A1        #print axioms of the five theorems (Lean, the release's toolchain)
#   CEN       the closure census and the False probe (P1, D1: COMPUTED)
#   S1        Comparator v4.33.0 (rebuilt on v4.33.1) against cert-machine's challenge, the challenge's build checked unchanged
#   C1-C4     the controls, each through the same judge, each must be REJECTED
#   EXP, K2   lean4export of the five theorems' closure to a file; nanoda on it (C5, a corrupted export, ran on a
#             small export before phase 1 ended: /results/derisk.txt, a literal 4 -> 5 made nanoda exit 101)
#   KR        last: leanchecker --fresh Main (Lean's kernel replaying the closure from the .olean files in a fresh environment)
# Every Lean step runs as `tester`. If landrun cannot sandbox on this container, Comparator gets a pass-through wrapper and
# the record says "no sandbox" (as the ETH lane did with bwrap).
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester W=/home/tester/release/lean T=/home/tester/tools D=/data
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
until grep -qE "phase 1 done|STOPPED" $R/_phase.log; do sleep 60; done
grep -q "STOPPED" $R/_phase.log && { log "phase 2 not started: phase 1 stopped"; exit 1; }
[ "$(cat $R/B1.exit)" = 0 ] || { log "phase 2 not started: B1 exit $(cat $R/B1.exit)"; exit 1; }
log "phase 2 start"
mkdir -p $D && chown $U:$U $D
step() {  # name, timeout seconds, workdir, command...
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:$H/.cargo/bin:/usr/local/bin:/usr/bin:/bin" \
    COMPARATOR_LEAN4EXPORT=$T/lean4export/.lake/build/bin/lean4export COMPARATOR_LANDRUN=$T/landrun-use \
    COMPARATOR_NANODA=$T/nanoda_lib/target/release/nanoda_bin \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
mkdir -p $W/scratch && chown $U:$U $W/scratch
# A1
cat > $W/scratch/Axioms.lean <<'EOF'
import Main
#print axioms riemannHypothesis
#print axioms riemannZeta_eq_zero_re
#print axioms LFunction_ne_zero_of_half_lt_re
#print axioms LFunction_eq_zero_re
#print axioms LFunction_eq_zero_re_of_isPrimitive
EOF
# CEN: our own census script (cert-machine's code, run after the release is built; reads the environment only)
cat > $W/scratch/Census.lean <<'EOF'
import Main
open Lean
def roots : List Name := [`riemannHypothesis, `riemannZeta_eq_zero_re, `LFunction_ne_zero_of_half_lt_re,
  `LFunction_eq_zero_re, `LFunction_eq_zero_re_of_isPrimitive]
#eval show CoreM Unit from do
  let env ← getEnv
  let mut seen : NameHashSet := {}
  let mut stack : Array Name := roots.toArray
  while !stack.isEmpty do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    if let some ci := env.find? n then
      for c in ci.getUsedConstantsAsSet do
        if !seen.contains c then stack := stack.push c
  let mut byRoot : Std.HashMap String Nat := {}
  let mut mods : NameHashSet := {}
  let mut falseInClosure : Array Name := #[]
  let mut axiomsInClosure : Array Name := #[]
  for n in seen.toList do
    let some ci := env.find? n | continue
    let modName := match env.getModuleIdxFor? n with
      | some idx => env.header.moduleNames[idx.toNat]!
      | none => `_current
    mods := mods.insert modName
    let r := modName.getRoot.toString
    byRoot := byRoot.insert r (byRoot.getD r 0 + 1)
    if ci.type.isConstOf ``False then falseInClosure := falseInClosure.push n
    if ci matches .axiomInfo _ then axiomsInClosure := axiomsInClosure.push n
  let mut falseAnywhere : Array Name := #[]
  let mut total := 0
  for (n, ci) in env.constants.toList do
    total := total + 1
    if ci.type.isConstOf ``False && !ci matches .axiomInfo _ then falseAnywhere := falseAnywhere.push n
  let mut modsByRoot : Std.HashMap String Nat := {}
  for m in mods.toList do
    let r := m.getRoot.toString
    modsByRoot := modsByRoot.insert r (modsByRoot.getD r 0 + 1)
  IO.println s!"CENSUS closure_constants={seen.size} closure_modules={mods.size} env_constants={total}"
  IO.println s!"CENSUS constants_by_root={(byRoot.toList.toArray.qsort (fun a b => a.2 > b.2)).toList}"
  IO.println s!"CENSUS modules_by_root={(modsByRoot.toList.toArray.qsort (fun a b => a.2 > b.2)).toList}"
  IO.println s!"CENSUS axioms_in_closure={axiomsInClosure.toList}"
  IO.println s!"CENSUS false_typed_in_closure={falseInClosure.toList}"
  IO.println s!"CENSUS false_typed_anywhere_count={falseAnywhere.size} first={falseAnywhere.toList.take 20}"
EOF
# the controls' modules (cert-machine's own, Mathlib only, written into the checkout's CertMachine library)
cat > $W/src/CertMachine/ChallengeC1.lean <<'EOF'
import Mathlib
-- control C1: the challenge with 1 / 2 replaced by 1 / 3; the release's theorem must NOT match it
def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 3
theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := sorry
EOF
cat > $W/src/CertMachine/Ctl2.lean <<'EOF'
import Mathlib
-- control C2: a planted axiom
axiom cheat : RiemannHypothesis
theorem riemannHypothesis : RiemannHypothesis := cheat
EOF
cat > $W/src/CertMachine/Ctl3.lean <<'EOF'
import Mathlib
-- control C3: sorry
theorem riemannHypothesis : RiemannHypothesis := sorry
EOF
cat > $W/src/CertMachine/Ctl4.lean <<'EOF'
import Mathlib
-- control C4: a hijacked definition
def RiemannZetaZerosOnLine : Prop := True
theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := trivial
EOF
chown -R $U:$U $W/src/CertMachine $W/scratch
step A1 7200 $W bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake env lean scratch/Axioms.lean'
step CEN 21600 $W bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake env lean scratch/Census.lean'
# the challenge's build must be the one made before B1
find $W/.lake/build -path '*CertMachine/Challenge.*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.before-S1.sha256
grep 'CertMachine/Challenge\.' $R/challenge-build.sha256 | sort -k2 > /tmp/ch0
cmp -s /tmp/ch0 $R/challenge-build.before-S1.sha256 && log "challenge build unchanged before S1" || log "WARNING: challenge build differs before S1"
step CTLB 7200 $W bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake build CertMachine.ChallengeC1 CertMachine.Ctl2 CertMachine.Ctl3 CertMachine.Ctl4'
# landrun: sandbox if it can run here, else a recorded pass-through
# Comparator calls landrun with --best-effort (it applies what the host's Landlock ABI offers: v4 here, file-system rules);
# the same flags decide the mode; a strict request fails on this host (ABI v4, landrun asks v10), recorded in derisk.txt
if runuser -u $U -- $T/landrun/landrun --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $R/landrun-test.txt 2>&1; then
  ln -sf $T/landrun/landrun $T/landrun-use; echo 'sandbox (landrun --best-effort, Landlock ABI v4)' > $R/S1.mode
else
  printf '#!/usr/bin/env bash\n# pass-through: landrun cannot sandbox on this container (see landrun-test.txt); drop landrun flags up to --\nwhile [ $# -gt 0 ] && [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n' > $T/landrun-use; chmod 755 $T/landrun-use; echo nosandbox > $R/S1.mode
fi
chown -h $U:$U $T/landrun-use 2>/dev/null
log "Comparator mode: $(cat $R/S1.mode)"
cfg() {  # file challenge solution theorems(json) defs(json) nanoda
  printf '{"challenge_module": "%s", "solution_module": "%s", "theorem_names": %s, "definition_names": %s, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "$2" "$3" "$4" "$5" "$6" > $W/scratch/$1; chown $U:$U $W/scratch/$1; cp $W/scratch/$1 $R/
}
TH='["riemannHypothesis", "riemannZeta_eq_zero_re", "LFunction_ne_zero_of_half_lt_re", "LFunction_eq_zero_re", "LFunction_eq_zero_re_of_isPrimitive"]'
DF='["RiemannZetaZerosOnLine", "DirichletLNonvanishingRightOfHalf", "DirichletLZerosOnLine", "PrimitiveDirichletLZerosOnLine"]'
cfg s1.json CertMachine.Challenge Main "$TH" "$DF" false
cfg c1.json CertMachine.ChallengeC1 Main '["riemannZeta_eq_zero_re"]' '["RiemannZetaZerosOnLine"]' false
cfg c2.json CertMachine.Challenge CertMachine.Ctl2 '["riemannHypothesis"]' '[]' false
cfg c3.json CertMachine.Challenge CertMachine.Ctl3 '["riemannHypothesis"]' '[]' false
cfg c4.json CertMachine.Challenge CertMachine.Ctl4 '["riemannZeta_eq_zero_re"]' '["RiemannZetaZerosOnLine"]' false
CMP=$T/comparator/.lake/build/bin/comparator
step S1 172800 $W bash -c "export PATH=\$HOME/.elan/bin:\$PATH; lake env $CMP scratch/s1.json"
for c in c1 c2 c3 c4; do step ${c^^} 14400 $W bash -c "export PATH=\$HOME/.elan/bin:\$PATH; lake env $CMP scratch/$c.json"; done
# EXP, K2: the closure of the five theorems, exported once to a file, nanoda on it
step EXP 86400 $W bash -c "export PATH=\$HOME/.elan/bin:\$PATH; lake env $T/lean4export/.lake/build/bin/lean4export Main -- riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive > $D/export.ndjson"
ls -la $D/export.ndjson | tee -a $R/_phase.log; sha256sum $D/export.ndjson > $R/export.sha256; head -c 300 $D/export.ndjson > $R/export.head
cat > $D/nanoda.json <<EOF
{"export_file_path": "$D/export.ndjson", "use_stdin": false, "num_threads": 32, "stack_size_bytes": 1073741824,
 "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,
 "nat_extension": true, "string_extension": true, "print_success_message": true}
EOF
chown $U:$U $D/nanoda.json; cp $D/nanoda.json $R/
step K2 172800 $D $T/nanoda_lib/target/release/nanoda_bin $D/nanoda.json
# KR last: Lean's own replay of the whole closure from the .olean files in a fresh environment (single process, the longest)
step KR 172800 $W bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake env leanchecker --fresh Main'
log "phase 2 done"
