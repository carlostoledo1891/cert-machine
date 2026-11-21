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
# v2 (2026-11-21, amendment A3, after an outside red-team reading): no definition_names (in Comparator they are HOLES whose
# bodies are not compared); /results and the export become root-owned before any judge runs; the judges are rebuilt by
# root in /opt/judges after B1 (the release's build ran as tester and could have touched tester-owned tools); B1V re-runs
# lake build with its own exit status (B1's went through tee); the release's olean count is reconciled with its sources;
# the workspace's Mathlib .olean files are compared with a clean root-owned cache download; A1 also runs on the C2/C3
# controls; C5 runs on the release's own export (riemannHypothesis re-typed as False must be rejected by nanoda).
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester W=/home/tester/release/lean T=/home/tester/tools D=/data
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
until grep -qE "phase 1 done|STOPPED" $R/_phase.log; do sleep 60; done
grep -q "STOPPED" $R/_phase.log && { log "phase 2 not started: phase 1 stopped"; exit 1; }
[ "$(cat $R/B1.exit)" = 0 ] || { log "phase 2 not started: B1 exit $(cat $R/B1.exit)"; exit 1; }
log "phase 2 start"
chown -R root:root $R; chmod -R go-w $R; mkdir -p $D && chown root:root $D && chmod 755 $D
# judges rebuilt by root, outside anything the release's build could write
cat > /tmp/judges.sh <<'J'
set -uo pipefail
export GIT_TERMINAL_PROMPT=0 HOME=/root
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH=/root/.elan/bin:/root/.cargo/bin:/usr/lib/go/bin:$PATH
mkdir -p /opt/judges && cd /opt/judges
rec() { echo "$1 $(git -C $2 rev-parse HEAD) $(git -C $2 describe --tags --always 2>/dev/null)"; }
for r in lean4export comparator; do
  for t in 1 2 3 4 5; do [ -d $r/.git ] && break; rm -rf $r; git clone -q https://github.com/leanprover/$r.git && break; sleep $((t*20)); done
  git -C $r checkout -q v4.33.0 && rec $r $r
  (cd $r && echo 'leanprover/lean4:v4.33.1' > lean-toolchain && lake build 2>&1 | tail -1)
done
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=/root/.cargo/bin:$PATH
for t in 1 2 3; do [ -d nanoda_lib/.git ] && break; git clone -q https://github.com/ammkrn/nanoda_lib.git && break; sleep 20; done
git -C nanoda_lib checkout -q 0da9f98feadd3a0a2ef4b3dbcf52a298a6fef929 && rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -1)
for t in 1 2 3; do [ -d landrun/.git ] && break; git clone -q https://github.com/Zouuup/landrun.git && break; sleep 20; done; rec landrun landrun
(cd landrun && go build -o landrun ./cmd/landrun 2>&1 | tail -1)
sha256sum lean4export/.lake/build/bin/lean4export comparator/.lake/build/bin/comparator nanoda_lib/target/release/nanoda_bin landrun/landrun
J
bash /tmp/judges.sh > $R/judges.txt 2>&1; log "judges (root, /opt/judges) exit $?"
chmod -R a+rX /opt/judges; chmod -R go-w /opt/judges
T=/opt/judges
# the toolchain every later step uses: the official v4.33.1 release, unpacked by root (tester's ~/.elan was writable
# during B1); tester's copy is hashed against it for the record
mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://github.com/leanprover/lean4/releases/download/v4.33.1/lean-4.33.1-linux.tar.zst && sha256sum /opt/lean.tar.zst > $R/toolchain.sha256
# the digest GitHub publishes for this release asset (read 2026-11-21 from the releases API); a mismatch stops phase 2
grep -q '^890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235 ' $R/toolchain.sha256 || { log "STOPPED: the toolchain archive does not match GitHub's published digest"; exit 1; }
tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
# lake env puts the workspace's .lake/build/bin first on PATH: the release defines no executable, so it must not exist
if [ -e $W/.lake/build/bin ]; then ls -laR $W/.lake/build/bin > $R/workspace-bin.txt 2>&1; log "STOPPED: the release workspace has .lake/build/bin (workspace-bin.txt)"; exit 1; fi
(cd /opt/toolchain && find bin lib -type f -exec sha256sum {} \; | sort -k2) > $R/toolchain-official.sha256
(cd /home/tester/.elan/toolchains/leanprover--lean4---v4.33.1 && find bin lib -type f -exec sha256sum {} \; | sort -k2) > $R/toolchain-tester.sha256
cmp -s $R/toolchain-official.sha256 $R/toolchain-tester.sha256 && log "tester's toolchain identical to the official release" || log "WARNING: tester's toolchain differs from the official release (see the two lists)"
sha256sum /home/tester/tools/lean4export/.lake/build/bin/lean4export /home/tester/tools/comparator/.lake/build/bin/comparator /home/tester/tools/nanoda_lib/target/release/nanoda_bin /home/tester/tools/landrun/landrun > $R/judges-tester-built.sha256 2>&1
step() {  # name, timeout seconds, workdir, command...
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
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
    if ci.type.isConstOf ``False || (ci.type.isAppOfArity ``Not 1 && ci.type.appArg!.isConstOf ``True) then falseInClosure := falseInClosure.push n
    if ci matches .axiomInfo _ then axiomsInClosure := axiomsInClosure.push n
  let mut falseAnywhere : Array Name := #[]
  let mut total := 0
  for (n, ci) in env.constants.toList do
    total := total + 1
    if (ci.type.isConstOf ``False || (ci.type.isAppOfArity ``Not 1 && ci.type.appArg!.isConstOf ``True)) && !ci matches .axiomInfo _ then falseAnywhere := falseAnywhere.push n
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
# B1V: the release's build re-run with its own exit status (B1's status went through tee)
step B1V 86400 $W bash -c 'lake build'
python3 -I - $W > $R/reconcile.txt 2>&1 <<'PY2'
import os, sys
W = sys.argv[1]; src = os.path.join(W, 'src'); lib = os.path.join(W, '.lake', 'build', 'lib', 'lean')
mods = set()
for d, ds, fs in os.walk(src):
    for f in fs:
        if f.endswith('.lean'):
            rel = os.path.relpath(os.path.join(d, f), src)[:-5]
            if not rel.startswith('CertMachine') and not rel.startswith('scratch'): mods.add(rel)
built = set()
for d, ds, fs in os.walk(lib):
    for f in fs:
        if f.endswith('.olean'):
            rel = os.path.relpath(os.path.join(d, f), lib)[:-6]
            if not rel.startswith('CertMachine'): built.add(rel)
print('sources', len(mods), 'oleans', len(built), 'missing', len(mods - built), 'extra', len(built - mods))
for m in sorted(mods - built)[:50]: print('MISSING', m)
PY2
log "reconcile: $(head -1 $R/reconcile.txt)"
# the workspace's Mathlib (and its dependencies) against a clean root-owned cache download of the same revision
mkdir -p /opt/cleanws && cp $W/lean-toolchain $W/lake-manifest.json /opt/cleanws/ && printf 'name = "tree"\n\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "0df444a360eaa60ab8c11dca51a86af692955474"\n' > /opt/cleanws/lakefile.toml
(cd /opt/cleanws && export HOME=/root PATH=/root/.elan/bin:$PATH && for t in 1 2 3; do lake exe cache get > $R/cleanws.txt 2>&1 && break; sleep 30; done)
python3 -I - $W/.lake/packages /opt/cleanws/.lake/packages > $R/mathlib-integrity.txt 2>&1 <<'PY3'
import hashlib, os, sys
def tree(root):
    # every compiled artifact of every dependency package: .olean and its .private/.server parts, .ilean (amendment A5)
    out = {}
    for d, ds, fs in os.walk(root):
        for f in fs:
            if '.olean' in f or f.endswith('.ilean'):
                p = os.path.join(d, f); out[os.path.relpath(p, root)] = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    return out
a, b = tree(sys.argv[1]), tree(sys.argv[2])
diff = [k for k in set(a) & set(b) if a[k] != b[k]]
print('workspace', len(a), 'clean', len(b), 'common', len(set(a) & set(b)), 'differing', len(diff), 'only-workspace', len(set(a) - set(b)), 'only-clean', len(set(b) - set(a)))
for k in sorted(diff)[:50]: print('DIFF', k)
PY3
log "mathlib integrity: $(head -1 $R/mathlib-integrity.txt)"
step A1 7200 $W bash -c 'lake env lean scratch/Axioms.lean'
step CEN 21600 $W bash -c 'lake env lean scratch/Census.lean'
# the challenge's build must be the one made before B1
find $W/.lake/build -path '*CertMachine/Challenge.*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.before-S1.sha256
grep 'CertMachine/Challenge\.' $R/challenge-build.sha256 | sort -k2 > /tmp/ch0
cmp -s /tmp/ch0 $R/challenge-build.before-S1.sha256 && log "challenge build unchanged before S1" || log "WARNING: challenge build differs before S1"
step CTLB 7200 $W bash -c 'lake build CertMachine.ChallengeC1 CertMachine.Ctl2 CertMachine.Ctl3 CertMachine.Ctl4'
printf 'import CertMachine.Ctl2\n#print axioms riemannHypothesis\n' > $W/scratch/AxCtl2.lean; printf 'import CertMachine.Ctl3\n#print axioms riemannHypothesis\n' > $W/scratch/AxCtl3.lean; chown $U:$U $W/scratch/AxCtl*.lean
step A1C2 3600 $W bash -c 'lake env lean scratch/AxCtl2.lean'
step A1C3 3600 $W bash -c 'lake env lean scratch/AxCtl3.lean'
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
cfg() {  # file challenge solution theorems(json) _unused nanoda — NO definition_names: in Comparator those are holes (bodies not compared)
  printf '{"challenge_module": "%s", "solution_module": "%s", "theorem_names": %s, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "$2" "$3" "$4" "$6" > $W/scratch/$1; chown $U:$U $W/scratch/$1; cp $W/scratch/$1 $R/
}
TH='["riemannHypothesis", "riemannZeta_eq_zero_re", "LFunction_ne_zero_of_half_lt_re", "LFunction_eq_zero_re", "LFunction_eq_zero_re_of_isPrimitive"]'
DF='["RiemannZetaZerosOnLine", "DirichletLNonvanishingRightOfHalf", "DirichletLZerosOnLine", "PrimitiveDirichletLZerosOnLine"]'
cfg s1.json CertMachine.Challenge Main "$TH" "$DF" false
cfg c1.json CertMachine.ChallengeC1 Main '["riemannZeta_eq_zero_re"]' '["RiemannZetaZerosOnLine"]' false
cfg c2.json CertMachine.Challenge CertMachine.Ctl2 '["riemannHypothesis"]' '[]' false
cfg c3.json CertMachine.Challenge CertMachine.Ctl3 '["riemannHypothesis"]' '[]' false
cfg c4.json CertMachine.Challenge CertMachine.Ctl4 '["riemannZeta_eq_zero_re"]' '["RiemannZetaZerosOnLine"]' false
CMP=$T/comparator/.lake/build/bin/comparator
step S1 172800 $W bash -c "lake env $CMP scratch/s1.json"
for c in c1 c2 c3 c4; do step ${c^^} 14400 $W bash -c "lake env $CMP scratch/$c.json"; done
# EXP, K2: the closure of the five theorems, exported once to a file, nanoda on it
step EXP 86400 $W bash -c "lake env $T/lean4export/.lake/build/bin/lean4export Main -- riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive"
mv $R/EXP.out $D/export.ndjson && chmod 644 $D/export.ndjson
ls -la $D/export.ndjson | tee -a $R/_phase.log; sha256sum $D/export.ndjson > $R/export.sha256; head -c 300 $D/export.ndjson > $R/export.head
cat > $D/nanoda.json <<EOF
{"export_file_path": "$D/export.ndjson", "use_stdin": false, "num_threads": 32, "stack_size_bytes": 1073741824,
 "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,
 "nat_extension": true, "string_extension": true, "print_success_message": true}
EOF
chown $U:$U $D/nanoda.json; cp $D/nanoda.json $R/
step K2 172800 $D $T/nanoda_lib/target/release/nanoda_bin $D/nanoda.json
# C5 on the release's own export: the theorem riemannHypothesis re-typed as False (its proof unchanged) must be rejected
cat > /opt/judges/c5.py <<'PY5'
import json, sys
names, false_name, false_expr, rh_name, done = {}, None, None, None, False
for line in sys.stdin:
    if not done:
        o = json.loads(line)
        if 'in' in o and 'str' in o and o['str']['pre'] == 0:
            if o['str']['str'] == 'False': false_name = o['in']
            if o['str']['str'] == 'riemannHypothesis': rh_name = o['in']
        elif 'ie' in o and 'const' in o and false_name is not None and o['const']['name'] == false_name and o['const']['us'] == []:
            false_expr = o['ie']
        elif 'thm' in o and rh_name is not None and o['thm']['name'] == rh_name:
            if false_expr is None: sys.stderr.write('C5: no expression for False before riemannHypothesis\n'); sys.exit(3)
            o['thm']['type'] = false_expr; line = json.dumps(o, separators=(',', ':')) + '\n'; done = True
            sys.stderr.write('C5: riemannHypothesis re-typed as False (expr %d)\n' % false_expr)
    sys.stdout.write(line)
if not done: sys.stderr.write('C5: riemannHypothesis not found\n'); sys.exit(4)
PY5
sed 's#"export_file_path": "[^"]*", "use_stdin": false#"use_stdin": true#' $D/nanoda.json > $D/nanoda-stdin.json; cp $D/nanoda-stdin.json $R/
step C5 172800 $D bash -c "set -o pipefail; python3 -I /opt/judges/c5.py < $D/export.ndjson | $T/nanoda_lib/target/release/nanoda_bin $D/nanoda-stdin.json"
# KR last: Lean's own replay of the whole closure from the .olean files in a fresh environment (single process, the longest)
step KR 172800 $W bash -c 'lake env leanchecker --fresh Main'
log "phase 2 done"
