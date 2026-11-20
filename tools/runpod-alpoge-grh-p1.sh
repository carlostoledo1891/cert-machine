#!/usr/bin/env bash
# runpod-alpoge-grh-p1.sh — phase 1 of the decision of Alpöge's Lean release (notes/alpoge-grh-preregistration-2026-11-20.md):
# I1 (the 14 parts fetched from alpo.ge on the pod, each against corpus/alpoge-grh/PINS.json), then cert-machine's challenge
# built BEFORE any of the release's code is compiled on this machine (Comparator's assumption 2), its .olean hashed, then B1
# (the release's own `lake build` of its default targets). Runs as root; every Lean step runs as the unprivileged user
# `tester`. Results in /results (pulled by scp). env: AUDIT_SHA (the cert-machine commit holding the pins and the challenge).
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results U=tester H=/home/tester
TOOLCHAIN=leanprover/lean4:v4.33.1
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
log "start; audit $AUDIT_SHA; $(nproc) vCPU; $(free -g | awk '/Mem:/{print $2" GB host"}'); cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null); disk $(df -h / | awk 'NR==2{print $4" free"}')"
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd xz-utils build-essential procps < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
chown $U:$U $R; chmod 755 $R
mkdir -p /audit && curl -fsSL --retry 5 "$RAW/corpus/alpoge-grh/PINS.json" -o /audit/PINS.json && curl -fsSL --retry 5 "$RAW/instruments/alpoge-grh/Challenge.lean" -o /audit/Challenge.lean || { log "FAILED: fetch pins"; exit 1; }
sha256sum /audit/PINS.json /audit/Challenge.lean | tee $R/audit-files.sha256
# I1: fetch and check every part against its pin
mkdir -p /claim && cd /claim
python3 -I - <<'EOF' > $R/I1.txt 2>&1
import hashlib, json, subprocess, sys
pins = json.load(open('/audit/PINS.json'))
ok = True
for name, p in sorted(pins['parts'].items()):
    for t in range(5):
        r = subprocess.run(['curl', '-fsSL', '--retry', '3', '-A', 'Mozilla/5.0 (cert-machine audit)', '-o', name, p['url']])
        if r.returncode == 0: break
    h = hashlib.sha256(open(name, 'rb').read()).hexdigest()
    print(name, h, 'MATCH' if h == p['sha256'] else 'MISMATCH ' + p['sha256']); ok &= h == p['sha256']
data = b''.join(open(n, 'rb').read() for n in sorted(pins['parts']))
h = hashlib.sha256(data).hexdigest()
print('joined', len(data), h, 'MATCH' if h == pins['archive']['sha256'] else 'MISMATCH'); ok &= h == pins['archive']['sha256']
open('lean.tar.gz', 'wb').write(data)
print('I1', 'PASS' if ok else 'FAIL'); sys.exit(0 if ok else 1)
EOF
I1=$?; cat $R/I1.txt | tail -2 | tee -a $R/_phase.log
[ $I1 = 0 ] || { log "STOPPED: I1 failed"; exit 1; }
tar -tzf lean.tar.gz > $R/tarlist.txt && sha256sum $R/tarlist.txt | tee -a $R/_phase.log
mkdir -p $H/release && tar -xzf lean.tar.gz -C $H/release && chown -R $U:$U $H/release
W=$H/release/lean
# the challenge lives in the release's checkout as its own library (the only change to the checkout, recorded)
mkdir -p $W/src/CertMachine && cp /audit/Challenge.lean $W/src/CertMachine/Challenge.lean
cp $W/lakefile.toml $R/lakefile.release.toml
printf '\n# written by cert-machine (tools/runpod-alpoge-grh-p1.sh): the challenge, built before any release module\n[[lean_lib]]\nname = "CertMachine"\nglobs = ["CertMachine.+"]\n' >> $W/lakefile.toml
cp $W/lakefile.toml $R/lakefile.with-challenge.toml; chown -R $U:$U $W
step() {  # name, timeout seconds, command...
  local n=$1 to=$2; shift 2
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$W" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
cat > /tmp/setup.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
test "\$(cat lean-toolchain)" = $TOOLCHAIN
elan toolchain install $TOOLCHAIN
lean --version; lake --version; ls "\$(lean --print-prefix)/bin"
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
cat lake-manifest.json | python3 -c "import json,sys; [print(p['name'], p.get('rev')) for p in json.load(sys.stdin)['packages']]"
git -C .lake/packages/mathlib rev-parse HEAD
BLOCK
chmod 644 /tmp/setup.sh; step P1-setup 14400 bash /tmp/setup.sh
[ "$(cat $R/P1-setup.exit)" = 0 ] || { log "STOPPED: setup failed"; exit 1; }
# the challenge, before any release module is compiled
step P1-challenge 7200 bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake build CertMachine.Challenge'
find $W/.lake/build -path '*CertMachine*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.sha256; cat $R/challenge-build.sha256 >> $R/_phase.log
find $W/.lake/build -name '*.olean' | grep -v CertMachine | wc -l | xargs -I{} echo "release oleans before B1: {}" | tee -a $R/_phase.log
[ "$(cat $R/P1-challenge.exit)" = 0 ] || { log "STOPPED: the challenge did not build"; exit 1; }
# B1: the release's own build of its default targets
step B1 259200 bash -c 'export PATH=$HOME/.elan/bin:$PATH; lake build 2>&1 | tee /results/B1.progress'
find $W/.lake/build -path '*CertMachine*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.after-B1.sha256
cmp -s $R/challenge-build.sha256 $R/challenge-build.after-B1.sha256 && log "challenge build unchanged by B1" || log "WARNING: challenge build CHANGED during B1"
log "oleans after B1: $(find $W/.lake/build -name '*.olean' | wc -l); sorry warnings: $(grep -c "declaration uses 'sorry'" $R/B1.progress)"
log "phase 1 done"
