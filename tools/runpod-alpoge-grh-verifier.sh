#!/usr/bin/env bash
# runpod-alpoge-grh-verifier.sh — the clean second verifier (amendment A3; the operator's "Clean second verifier",
# 2026-11-21). A fresh pod that never compiles release code:
#   V1  the official Lean v4.33.1 release unpacked by root in /opt/toolchain; the judges built by root in /opt/judges
#       (lean4export, Comparator at v4.33.0 rebuilt on v4.33.1, nanoda at 0da9f98f, landrun); every binary hashed
#   V2  the 14 parts fetched from alpo.ge again and checked against corpus/alpoge-grh/PINS.json; the workspace's own clean
#       Mathlib cache; cert-machine's challenge built here BEFORE any release artifact arrives, its .olean hashed
#   (then the release's compiled .lake/build is copied in from the build pod: tools/runpod-alpoge-grh-verifier-copy.sh)
#   V3  `lake build` must be a no-op (nothing of the release is compiled here); the copied artifacts hashed
#   V4  #print axioms of the five theorems; Comparator with nanoda ON (Lean's kernel and nanoda) against the challenge,
#       no definition_names; control C1 (the challenge with 1/3) must be rejected
# Every Lean step runs as the unprivileged user `verifier`; results are root-owned in /results.
# usage: AUDIT_SHA=<cert-machine commit> bash verifier.sh setup   |   bash verifier.sh check
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?setup or check}
R=/results U=verifier H=/home/verifier W=/home/tester/release/lean T=/opt/judges   # W: the build pod's path, so Lake's traces see the same paths
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R && chmod 755 $R
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
step() {  # name, timeout, command... (run as verifier in $W, outputs written by root)
  local n=$1 to=$2; shift 2
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    COMPARATOR_LEAN4EXPORT=$T/lean4export/.lake/build/bin/lean4export COMPARATOR_LANDRUN=$T/landrun/landrun \
    COMPARATOR_NANODA=$T/nanoda_lib/target/release/nanoda_bin \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$W" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
if [ "$MODE" = setup ]; then
  : "${AUDIT_SHA:?}"
  RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
  log "verifier setup; audit $AUDIT_SHA; $(nproc) vCPU; $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes"
  apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd build-essential procps golang-go pkg-config libssl-dev < /dev/null > /dev/null
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  # V1: the toolchain and the judges, root-owned
  mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://releases.lean-lang.org/lean4/v4.33.1/lean-4.33.1-linux.tar.zst
  sha256sum /opt/lean.tar.zst > $R/toolchain.sha256 && tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
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
  bash /tmp/judges.sh > $R/judges.txt 2>&1; log "judges exit $?"; chmod -R a+rX,go-w /opt/judges
  # V2: the claim's bytes fetched again, against the pins; the challenge built first
  mkdir -p /audit && curl -fsSL --retry 5 "$RAW/corpus/alpoge-grh/PINS.json" -o /audit/PINS.json && curl -fsSL --retry 5 "$RAW/instruments/alpoge-grh/Challenge.lean" -o /audit/Challenge.lean
  sha256sum /audit/PINS.json /audit/Challenge.lean > $R/audit-files.sha256
  mkdir -p /claim && cd /claim && python3 -I - > $R/I1.txt 2>&1 <<'EOF'
import hashlib, json, subprocess, sys
pins = json.load(open('/audit/PINS.json')); ok = True
for name, p in sorted(pins['parts'].items()):
    for t in range(5):
        if subprocess.run(['curl', '-fsSL', '--retry', '3', '-A', 'Mozilla/5.0 (cert-machine audit)', '-o', name, p['url']]).returncode == 0: break
    h = hashlib.sha256(open(name, 'rb').read()).hexdigest(); print(name, h, 'MATCH' if h == p['sha256'] else 'MISMATCH ' + p['sha256']); ok &= h == p['sha256']
data = b''.join(open(n, 'rb').read() for n in sorted(pins['parts'])); h = hashlib.sha256(data).hexdigest()
print('joined', len(data), h, 'MATCH' if h == pins['archive']['sha256'] else 'MISMATCH'); ok &= h == pins['archive']['sha256']
open('lean.tar.gz', 'wb').write(data); print('I1', 'PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
EOF
  [ $? = 0 ] || { log "STOPPED: I1 failed on the verifier"; exit 1; }
  tar -tzf lean.tar.gz | sha256sum | tee $R/tarlist.sha256
  mkdir -p /home/tester/release && tar -xzf lean.tar.gz -C /home/tester/release
  mkdir -p $W/src/CertMachine && cp /audit/Challenge.lean $W/src/CertMachine/Challenge.lean
  cat > $W/src/CertMachine/ChallengeC1.lean <<'EOF'
import Mathlib
-- control C1: the challenge with 1 / 2 replaced by 1 / 3; the release's theorem must NOT match it
def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 3
theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := sorry
EOF
  printf '\n# written by cert-machine (tools/runpod-alpoge-grh-verifier.sh): the challenge, built before any release artifact arrives\n[[lean_lib]]\nname = "CertMachine"\nglobs = ["CertMachine.+"]\n' >> $W/lakefile.toml
  chown -R $U:$U /home/tester/release
  step V2-cache 7200 lake exe cache get
  step V2-challenge 7200 lake build CertMachine.Challenge CertMachine.ChallengeC1
  find $W/.lake/build -path '*CertMachine*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.sha256
  log "release oleans before the copy: $(find $W/.lake/build -name '*.olean' | grep -vc CertMachine)"
  log "verifier setup done"
  exit 0
fi
if [ "$MODE" = check ]; then
  find $W/.lake/build -path '*CertMachine/Challenge*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.before-check.sha256
  cmp -s <(grep 'CertMachine/Challenge' $R/challenge-build.sha256) $R/challenge-build.before-check.sha256 && log "challenge build unchanged by the copy" || log "WARNING: challenge build changed"
  log "release oleans after the copy: $(find $W/.lake/build -name '*.olean' | grep -vc CertMachine)"
  # V3: nothing of the release may be compiled here; --no-build fails instead of building
  step V3-nobuild 21600 lake build --no-build
  [ "$(cat $R/V3-nobuild.exit)" = 0 ] || { log "STOPPED: Lake would rebuild release modules on the verifier (see V3-nobuild.out)"; exit 1; }
  cat > $W/Axioms.lean <<'EOF'
import Main
#print axioms riemannHypothesis
#print axioms riemannZeta_eq_zero_re
#print axioms LFunction_ne_zero_of_half_lt_re
#print axioms LFunction_eq_zero_re
#print axioms LFunction_eq_zero_re_of_isPrimitive
EOF
  chown $U:$U $W/Axioms.lean
  step V4-axioms 7200 lake env lean Axioms.lean
  printf '{"challenge_module": "CertMachine.Challenge", "solution_module": "Main", "theorem_names": ["riemannHypothesis", "riemannZeta_eq_zero_re", "LFunction_ne_zero_of_half_lt_re", "LFunction_eq_zero_re", "LFunction_eq_zero_re_of_isPrimitive"], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}\n' > $W/v-s1.json
  printf '{"challenge_module": "CertMachine.ChallengeC1", "solution_module": "Main", "theorem_names": ["riemannZeta_eq_zero_re"], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": false}\n' > $W/v-c1.json
  chown $U:$U $W/v-*.json; cp $W/v-*.json $R/
  runuser -u $U -- $T/landrun/landrun --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $R/landrun-test.txt 2>&1 && echo 'sandbox (landrun --best-effort)' > $R/V4.mode || echo 'landrun refused: see landrun-test.txt' > $R/V4.mode
  step V4-C1 14400 lake env $T/comparator/.lake/build/bin/comparator v-c1.json
  step V4-S1 259200 lake env $T/comparator/.lake/build/bin/comparator v-s1.json
  log "verifier check done"
fi
