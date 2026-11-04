#!/usr/bin/env bash
# runpod-eth-comparator.sh — the third check on C1 and C2 of the ETH model-gap lane (operator's word, 2026-11-04): Lean's
# own judge, `lake comparator --paranoid` (Comparator merged into core at v4.35; v4.36.0-rc2 bundles leanchecker-paranoid,
# lean4lean, nanoda, con-leche and con-ron beside Lean's kernel), on ONE RunPod CPU pod. The CHALLENGES are cert-machine's:
# each is a pinned statement (corpus/eth-refutation/c1|c2/statement.lean) with its imports and `sorry`, written into the
# claim's checkout as the module Challenge.C1 / Challenge.C2. The solutions are claimbox's modules at a pinned commit.
# Two negative controls must be REJECTED: claimbox's planted changed statements (Planted.Statement, Planted.C2Statement)
# judged as solutions to the same challenges. Same pod pattern as tools/runpod-eth-c1.sh: no credential, facts read-only
# on port 8000.
#   P1 prepare     elan, bubblewrap, claimbox at the pin, its toolchain, `lake exe cache get`, `lake build EthBridge Planted`
#   P2 challenges  the two challenge modules and five configs, written from the pins (sha256 of each recorded)
#   P3 C1          lake comparator --paranoid  (Challenge.C1 vs EthBridge.WordRAM, not_eth_ram)
#   P4 C2          lake comparator --paranoid  (Challenge.C2 vs EthBridge.Anthropic, not_eth_of_ethIsFalse)
#   P5 controls    the planted statements as solutions; each must exit 1
# If the sandbox cannot start (bwrap without user namespaces: exit 2, or exit 1 with bwrap's refusal), each comparator step is run again with
# --inadvisably-no-sandbox and recorded as such; the sandbox protects the judge from the claim's build, not the verdict's
# arithmetic, and the record says which mode decided.
# env: AUDIT_SHA, CLAIMBOX_SHA (both required)
set -uo pipefail
# the pod's own API key never reaches the claimant's build (security pass, 2026-11-04)
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}" "${CLAIMBOX_SHA:?}"
REPO=https://github.com/carlostoledo1891/claimbox.git
TOOLCHAIN=leanprover/lean4:v4.36.0-rc2
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results U=tester H=/home/tester
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential procps util-linux bubblewrap < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $R && chown $U:$U $R
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1; echo -1000 > "/proc/$(cat /tmp/http.pid)/oom_score_adj" 2>/dev/null || true
status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
chmod 644 /results/_status.json; }
status _audit "$AUDIT_SHA"; status _claimbox "$CLAIMBOX_SHA"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU; cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null); bwrap $(bwrap --version 2>&1 | head -1); userns $(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo n/a)"
mkdir -p /audit/corpus/eth-refutation/c1 /audit/corpus/eth-refutation/c2
for f in corpus/eth-refutation/c1/statement.lean corpus/eth-refutation/c2/statement.lean; do
  curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: fetch $f"; sleep infinity; }
done
chmod -R a+rX /audit
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
CB=$H/claimbox W=$CB/lean/eth-bridge
cat > /tmp/P1.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
for t in 1 2 3 4 5; do rm -rf $CB; git clone -q $REPO $CB && break; sleep \$((t * 60)); done
git -C $CB checkout -q $CLAIMBOX_SHA && test "\$(git -C $CB rev-parse HEAD)" = $CLAIMBOX_SHA
cd $W && test "\$(cat lean-toolchain)" = $TOOLCHAIN && elan toolchain install $TOOLCHAIN
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
lake build EthBridge Planted
lean --version; ls "\$(lean --print-prefix)/bin"
BLOCK
chmod 644 /tmp/P1.sh; step P1 21600 / bash /tmp/P1.sh
[ "$(cat $R/P1.exit)" = 0 ] || { status _phase "STOPPED: P1 failed"; sleep infinity; }
# P2: the challenges, from cert-machine's pins; the imports are the statement's own (those of claimbox's planted copies)
cat > /tmp/P2.py <<'EOF'
import hashlib, json, os, sys
W = sys.argv[1]
os.makedirs(W + '/Challenge', exist_ok=True)
c1 = open('/audit/corpus/eth-refutation/c1/statement.lean').read()
c2 = open('/audit/corpus/eth-refutation/c2/statement.lean').read()
assert c1.rstrip().endswith(':= by') and c2.rstrip().endswith(':=')
C1 = ('import ComplexityAbstracts.SubexponentialSATAbstract\nimport Complexity.Computability.WordRAM.Time\n\n'
      + c1 + '  sorry\n\nend EthBridge.WordRAM\n')
C2 = ('import EthBridge.Anthropic.MainResults\nimport ComplexityAbstracts.SubexponentialSATAbstract\n\n'
      + c2 + '  by sorry\n\nend EthBridge.Anthropic\n')
open(W + '/Challenge/C1.lean', 'w').write(C1); open(W + '/Challenge/C2.lean', 'w').write(C2)
lf = open(W + '/lakefile.toml').read()
if 'name = "Challenge"' not in lf:
    open(W + '/lakefile.toml', 'a').write('\n# written by cert-machine on the pod (tools/runpod-eth-comparator.sh): the challenges are cert-machine\'s pins\n[[lean_lib]]\nname = "Challenge"\nglobs = ["Challenge.+"]\n')
AX = ['propext', 'Quot.sound', 'Classical.choice']
cfg = {
  'c1': ('Challenge.C1', 'EthBridge.WordRAM', 'EthBridge.WordRAM.not_eth_ram'),
  'c2': ('Challenge.C2', 'EthBridge.Anthropic', 'EthBridge.Anthropic.not_eth_of_ethIsFalse'),
  'c1-planted': ('Challenge.C1', 'Planted.Statement', 'EthBridge.WordRAM.not_eth_ram'),
  'c2-planted': ('Challenge.C2', 'Planted.C2Statement', 'EthBridge.Anthropic.not_eth_of_ethIsFalse'),
}
for k, (ch, so, th) in cfg.items():
    json.dump({'challenge_module': ch, 'solution_module': so, 'theorem_names': [th], 'permitted_axioms': AX}, open(W + '/comparator-' + k + '.json', 'w'), indent=1)
out = {k: hashlib.sha256(open(W + '/Challenge/' + k.upper() + '.lean', 'rb').read()).hexdigest() for k in ['c1', 'c2']}
out['pins'] = {k: hashlib.sha256(open('/audit/corpus/eth-refutation/' + k + '/statement.lean', 'rb').read()).hexdigest() for k in ['c1', 'c2']}
print(json.dumps(out, indent=1))
EOF
chmod 644 /tmp/P2.py; chown -R $U:$U $W 2>/dev/null; step P2 600 / python3 -I /tmp/P2.py $W
cp $W/Challenge/C1.lean $R/Challenge-C1.lean; cp $W/Challenge/C2.lean $R/Challenge-C2.lean; cp $W/comparator-*.json $R/ 2>/dev/null
step P2b 7200 $W lake build Challenge
judge() {  # $1 name, $2 config
  step "$1" 21600 $W lake comparator --paranoid --config "$2"
  # the sandbox may not start on a container without unprivileged user namespaces: lake prints bwrap's refusal and
  # exits 1 (seen on RunPod 2026-11-04, run 6c6qd1lla7mtt5), not the documented 2; either way no judging happened
  if [ "$(cat $R/$1.exit)" = 2 ] || grep -q "^bwrap: No permissions to create new namespace" "$R/$1.err"; then
    for e in exit out err start end; do mv "$R/$1.$e" "$R/$1.sandbox.$e"; done
    step "$1" 21600 $W lake comparator --paranoid --inadvisably-no-sandbox --config "$2"
    echo nosandbox > "$R/$1.mode"
  else echo sandbox > "$R/$1.mode"; fi
}
judge P3 comparator-c1.json
judge P4 comparator-c2.json
judge P5a comparator-c1-planted.json
judge P5b comparator-c2-planted.json
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
