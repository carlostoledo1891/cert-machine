#!/usr/bin/env bash
# runpod-eth-openai-chain.sh — deciding the OpenAI chain in one environment (pre-registered 2026-11-05,
# notes/eth-openai-chain-preregistration-2026-11-05.md): claimbox's lean/eth-bridge at a pinned commit,
# EthBridge.OpenAIChain.not_eth : ¬ETH := not_eth_of_ethIsFalse (not_positiveRateETH_implies_ethIsFalse not_positiveRateETH),
# where OpenAI's family-378 proof (openai/math at 7ef5c0cc: SqrtLogSpace.exact_count_and_sat / original_sat_main and the
# ParityLifts) and Daniel Hawkley's two bridge theorems (thinkthoughts/math at d6b79b7d, OAI.Bridges) are PORTED to Lean
# v4.36.0-rc2 (OpenAIEth/, every change in its PORT.md). Decided here: the trusted statement byte-equal to cert-machine's pin
# (corpus/eth-refutation/openai-chain/statement.lean), the vendored MainResults.lean against Anthropic's pin, every ported
# file byte-equal to its scout pin (corpus/eth-refutation/openai-chain/scout-pins.json) or modified exactly as PORT.md
# declares, the axioms from OUR file, nanoda on a lean4export of not_eth with two negative controls, leanchecker --fresh,
# the three planted chain variants refused, and then Lean's own judge, `lake comparator --paranoid` (six checkers), against
# a challenge written from the pin, with the planted changed statement as a solution that must be rejected. A copy of
# runpod-eth-chain.sh with the names changed and the port-ledger check added to L3s; no credential, facts on port 8000.
#   L1 prepare     elan, claimbox at the pin, its toolchain, `lake exe cache get`
#   L2 build       `lake build EthBridge.OpenAIChain Planted`
#   L3 axioms      our two files (the theorem and its links; the planted ones)
#   L3s statement  the trusted block of EthBridge/OpenAIChain.lean and of Planted/OpenAIChainStatement.lean against the
#                  pinned copy; the sha256 of EthBridge/Anthropic/MainResults.lean; the port ledger: every .lean under
#                  OpenAIEth/ against scout-pins.json and PORT.md (unchanged / modified as declared / a refusal)
#   L4 nanoda      exports of not_eth, planted_openai_chain_sorry, planted_openai_chain_axiom; the first must pass, the two others must fail
#   L5 fresh       `lake env leanchecker --fresh EthBridge.OpenAIChain`
#   P  comparator  `lake comparator --paranoid`: Challenge.OpenAIChain vs EthBridge.OpenAIChain, and vs Planted.OpenAIChainStatement
#   P3 OpenAI's own challenge (pre-registration §5, "attempted in addition"): lean/ComparatorChallenges/SubexponentialSAT.lean
#                  pinned in corpus/eth-refutation/openai-chain/challenge/ (sha256 checked against its PINS.json before use),
#                  placed unchanged as the module Challenge.OpenAISubexponentialSAT; the config from OpenAI's json with ONE
#                  field changed (challenge_module → ours; solution_module stays OpenAI's OAI.Algorithms.SubexponentialSAT.Main,
#                  which the port carries and P3b builds), recorded in P3.0.out; `lake comparator --paranoid`
#                  like P1. If the challenge does not BUILD on this Mathlib (69552756) the step ends NOT RUN (P3.notrun, the
#                  build error in P3b.err), distinct from a rejection.
# env: AUDIT_SHA, CLAIMBOX_SHA (both required)
# pod: >= 128 GB RAM (OpenAI's own closure: `lake build` 39 min on 16 vCPU, leanchecker --fresh 44 min at 99 GB peak,
#      nanoda 6 min on a 2.4 GB export) — the cpu3m 16 vCPU shape (US$0.88/h); a soft cap of US$25 before asking (the
#      operator, 2026-11-05). The script stops before L1 on a pod whose cgroup memory.max is under 120 GB.
set -uo pipefail
# the pod's own API key never reaches the claimant's build (security pass, 2026-11-04)
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}" "${CLAIMBOX_SHA:?}"
REPO=https://github.com/carlostoledo1891/claimbox.git
TOOLCHAIN=leanprover/lean4:v4.36.0-rc2
LEAN4EXPORT_PIN=df81913eee5519d5a88ae5b0fd701b5298cc29ab
NANODA_PIN=8de7e0c4ed3052745a7f8725164efd9e76d84c56
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
MEMMAX=$(cat /sys/fs/cgroup/memory.max 2>/dev/null)
status _machine "$(nproc) vCPU; cgroup memory.max $MEMMAX"
# leanchecker --fresh peaked at 99 GB on OpenAI's closure: a smaller pod would end in an OOM kill, a platform failure
case "$MEMMAX" in ''|max) ;; *) [ "$MEMMAX" -ge 120000000000 ] || { status _phase "STOPPED: the pod has under 120 GB (memory.max $MEMMAX); the pre-registration asks for >= 128 GB"; sleep infinity; } ;; esac
mkdir -p /audit/tools /audit/corpus/eth-refutation/openai-chain/challenge
for f in tools/eth-openai-chain-axioms.lean tools/eth-openai-chain-planted-axioms.lean corpus/eth-refutation/openai-chain/statement.lean corpus/eth-refutation/openai-chain/scout-pins.json \
         corpus/eth-refutation/openai-chain/challenge/SubexponentialSAT.lean corpus/eth-refutation/openai-chain/challenge/SubexponentialSAT.json corpus/eth-refutation/openai-chain/challenge/PINS.json; do
  curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: fetch $f"; sleep infinity; }
done
chmod -R a+rX /audit
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:$H/.cargo/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
CB=$H/claimbox W=$CB/lean/eth-bridge
cat > /tmp/L1.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
for t in 1 2 3 4 5; do rm -rf $CB; git clone -q $REPO $CB && break; sleep \$((t * 60)); done
git -C $CB checkout -q $CLAIMBOX_SHA && test "\$(git -C $CB rev-parse HEAD)" = $CLAIMBOX_SHA
cd $W && test "\$(cat lean-toolchain)" = $TOOLCHAIN && elan toolchain install $TOOLCHAIN
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
lean --version; sha256sum EthBridge/*.lean EthBridge/Anthropic/*.lean Planted/*.lean OpenAIEth/PORT.md lakefile.toml lake-manifest.json; echo "OpenAIEth .lean files: \$(find OpenAIEth -name '*.lean' | wc -l)"
BLOCK
chmod 644 /tmp/L1.sh; step L1 7200 / bash /tmp/L1.sh
[ "$(cat $R/L1.exit)" = 0 ] || { status _phase "STOPPED: L1 failed"; sleep infinity; }
step L2 28800 $W lake build EthBridge.OpenAIChain Planted
for f in eth-openai-chain-axioms eth-openai-chain-planted-axioms; do cp /audit/tools/$f.lean /tmp/$f.lean; chmod 644 /tmp/$f.lean; done
step L3 3600 $W lake env lean /tmp/eth-openai-chain-axioms.lean
step L3p 3600 $W lake env lean /tmp/eth-openai-chain-planted-axioms.lean
# the trusted block: from `namespace EthBridge.OpenAIChain` to the head of `theorem not_eth`, byte-equal to the pin;
# then the port ledger: every .lean under OpenAIEth/ is byte-equal to its scout pin ("unchanged") or listed in PORT.md
# with the pin's sha256 as "upstream" and its current sha256 as "here" ("modified as declared"); anything else refuses
cat > /tmp/stmt.py <<'EOF'
import hashlib, json, os, re, sys
W = sys.argv[1]
sha = lambda b: hashlib.sha256(b).hexdigest()
pin = open('/audit/corpus/eth-refutation/openai-chain/statement.lean').read()
def block(p):
    s = open(p).read(); h = 'theorem not_eth : ¬ ComplexityAbstracts.SubexponentialSATAbstract.ETH :='
    a, b = s.find('namespace EthBridge.OpenAIChain'), s.find(h)
    if b < 0:
        h = 'theorem not_eth : ComplexityAbstracts.SubexponentialSATAbstract.ETH :='; b = s.find(h)
    return None if a < 0 or b < 0 else s[a:b + len(h)] + '\n'
out = {'pinSha256': sha(pin.encode()), 'mainResultsSha256': sha(open(W + '/EthBridge/Anthropic/MainResults.lean', 'rb').read())}
for name, p in [('claim', W + '/EthBridge/OpenAIChain.lean'), ('plantedStatement', W + '/Planted/OpenAIChainStatement.lean')]:
    b = block(p)
    out[name] = {'found': b is not None, 'sha256': sha(b.encode()) if b else None, 'equalsPin': b == pin}
# the port ledger
pinsBytes = open('/audit/corpus/eth-refutation/openai-chain/scout-pins.json', 'rb').read()
pins = json.loads(pinsBytes)
PORT, pmd = W + '/OpenAIEth/PORT.md', W + '/OpenAIEth/PORT.md'
HEX = r'[0-9a-f]{64}'
ledger, portFound, portSha = {}, os.path.exists(pmd), None
def rel(p):  # a path as PORT.md or the pin writes it -> the path relative to OpenAIEth/ (OAI/...)
    p = p.strip().strip('`')
    for pre in ('OpenAIEth/', 'lean/'):
        if p.startswith(pre): p = p[len(pre):]
    return p
if portFound:
    text = open(pmd, 'rb').read(); portSha = sha(text); head = None
    for line in text.decode('utf-8', 'replace').split('\n'):
        m = re.match(r'#{2,6}\s+`([^`]+\.lean)`\s*$', line)
        if m: head = rel(m.group(1)); continue
        m = re.search(r'upstream sha256 `(' + HEX + r')`\s*(?:→|->)\s*here `(' + HEX + r')`', line)
        if m and head: ledger[head] = (m.group(1), m.group(2)); continue
        m = re.match(r'\|\s*`?([^`|]+\.lean)`?\s*\|\s*`?(' + HEX + r')`?\s*\|\s*`?(' + HEX + r')`?\s*\|', line)
        if m: ledger[rel(m.group(1))] = (m.group(2), m.group(3))
present = {}
for d, _, fs in os.walk(W + '/OpenAIEth'):
    for f in fs:
        if f.endswith('.lean'):
            p = os.path.join(d, f); present[os.path.relpath(p, W + '/OpenAIEth')] = sha(open(p, 'rb').read())
unchanged, declared, refusals = [], [], []
for r, cur in sorted(present.items()):
    key = 'lean/' + r
    if key not in pins['files']: refusals.append({'file': r, 'why': 'not in the pin (a file the scout closure does not hold)'}); continue
    p = pins['files'][key]
    if cur == p:
        if r in ledger: refusals.append({'file': r, 'why': 'byte-equal to its pin but listed in PORT.md as modified'})
        else: unchanged.append(r)
    elif r in ledger:
        before, after = ledger[r]
        if before != p: refusals.append({'file': r, 'why': 'PORT.md names an upstream sha256 that is not the pin (' + before[:12] + ' vs ' + p[:12] + ')'})
        elif after != cur: refusals.append({'file': r, 'why': 'differs from its pin and from the sha256 PORT.md declares (' + after[:12] + ' vs ' + cur[:12] + ')'})
        else: declared.append(r)
    else: refusals.append({'file': r, 'why': 'differs from its pin and is not in PORT.md'})
for key in sorted(pins['files']):
    if rel(key) not in present: refusals.append({'file': rel(key), 'why': 'pinned file missing from the port'})
for r in sorted(ledger):
    if r not in present: refusals.append({'file': r, 'why': 'listed in PORT.md but not in the port'})
out['port'] = {'pinsSha256': sha(pinsBytes), 'pinCommit': pins.get('commit'), 'portMdFound': portFound, 'portMdSha256': portSha,
  'counts': {'pinned': len(pins['files']), 'present': len(present), 'unchanged': len(unchanged), 'modifiedDeclared': len(declared), 'ledgerRows': len(ledger), 'refusals': len(refusals)},
  'modified': declared, 'refusals': refusals}
print(json.dumps(out, indent=1))
EOF
chmod 644 /tmp/stmt.py; step L3s 600 / python3 -I /tmp/stmt.py $W
cat > /tmp/L4tools.sh <<BLOCK
set -euo pipefail
export PATH=\$HOME/.elan/bin:\$HOME/.cargo/bin:\$PATH
mkdir -p \$HOME/src && cd \$HOME/src
rm -rf lean4export && git clone -q https://github.com/leanprover/lean4export.git && cd lean4export && git checkout -q $LEAN4EXPORT_PIN
echo $TOOLCHAIN > lean-toolchain && lake build lean4export
cd \$HOME/src && curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal
rm -rf nanoda && git clone -q https://github.com/ammkrn/nanoda_lib.git nanoda && cd nanoda && git checkout -q $NANODA_PIN && cargo build --release -q
BLOCK
chmod 644 /tmp/L4tools.sh; step L4.tools 3600 / bash /tmp/L4tools.sh
for t in EthBridge.OpenAIChain.not_eth:EthBridge.OpenAIChain:claim planted_openai_chain_sorry:Planted.OpenAIChainSorry:sorry planted_openai_chain_axiom:Planted.OpenAIChainAxiom:axiom; do
  name=${t%%:*}; rest=${t#*:}; mod=${rest%%:*}; short=${rest#*:}; X=$H/export-$short.ndjson
  step L4.export-$short 7200 $W bash -c "lake env $H/src/lean4export/.lake/build/bin/lean4export $mod -- $name > $X && ls -l $X && sha256sum $X"
  if [ "$(cat $R/L4.export-$short.exit)" = 0 ]; then
    runuser -u $U -- python3 -c "import json,sys; json.dump({'export_file_path': sys.argv[1], 'use_stdin': False, 'num_threads': int(sys.argv[3]), 'stack_size_bytes': 1073741824, 'permitted_axioms': ['propext', 'Classical.choice', 'Quot.sound'], 'unpermitted_axiom_hard_error': False, 'nat_extension': True, 'string_extension': True, 'print_success_message': True}, open(sys.argv[2], 'w'), indent=1)" "$X" "$H/nanoda-$short.json" "$(nproc)"
    cp $H/nanoda-$short.json $R/L4.nanoda-$short.config.json
    step L4.nanoda-$short 10800 $H $H/src/nanoda/target/release/nanoda_bin $H/nanoda-$short.json
    rm -f "$X"
  fi
done
step L5 28800 $W lake env leanchecker --fresh EthBridge.OpenAIChain
# P: Lean's own judge on the chain, against a challenge written from cert-machine's pin
cat > /tmp/P0.py <<'PYEOF'
import hashlib, json, os, sys
W = sys.argv[1]
os.makedirs(W + '/Challenge', exist_ok=True)
pin = open('/audit/corpus/eth-refutation/openai-chain/statement.lean').read()
assert pin.rstrip().endswith(':=')
open(W + '/Challenge/OpenAIChain.lean', 'w').write('import ComplexityAbstracts.SubexponentialSATAbstract\n\n' + pin + '  by sorry\n\nend EthBridge.OpenAIChain\n')
lf = open(W + '/lakefile.toml').read()
if 'name = "Challenge"' not in lf:
    open(W + '/lakefile.toml', 'a').write('\n# written by cert-machine on the pod (tools/runpod-eth-openai-chain.sh): the challenge is cert-machine\'s pin\n[[lean_lib]]\nname = "Challenge"\nglobs = ["Challenge.+"]\n')
AX = ['propext', 'Quot.sound', 'Classical.choice']
for k, so in [('openai-chain', 'EthBridge.OpenAIChain'), ('openai-chain-planted', 'Planted.OpenAIChainStatement')]:
    json.dump({'challenge_module': 'Challenge.OpenAIChain', 'solution_module': so, 'theorem_names': ['EthBridge.OpenAIChain.not_eth'], 'permitted_axioms': AX}, open(W + '/comparator-' + k + '.json', 'w'), indent=1)
print(json.dumps({'challenge': hashlib.sha256(open(W + '/Challenge/OpenAIChain.lean', 'rb').read()).hexdigest(), 'pin': hashlib.sha256(pin.encode()).hexdigest()}, indent=1))
PYEOF
chmod 644 /tmp/P0.py; chown -R $U:$U $W 2>/dev/null; step P0 600 / python3 -I /tmp/P0.py $W
cp $W/Challenge/OpenAIChain.lean $R/Challenge-OpenAIChain.lean; cp $W/comparator-*.json $R/ 2>/dev/null
step P0b 7200 $W lake build Challenge
judge() {  # $1 name, $2 config
  step "$1" 28800 $W lake comparator --paranoid --config "$2"
  # the sandbox may not start on a container without unprivileged user namespaces: lake prints bwrap's refusal and
  # exits 1 (seen on RunPod 2026-11-04, run 6c6qd1lla7mtt5), not the documented 2; either way no judging happened
  if [ "$(cat $R/$1.exit)" = 2 ] || grep -q "^bwrap: No permissions to create new namespace" "$R/$1.err"; then
    for e in exit out err start end; do mv "$R/$1.$e" "$R/$1.sandbox.$e"; done
    step "$1" 28800 $W lake comparator --paranoid --inadvisably-no-sandbox --config "$2"
    echo nosandbox > "$R/$1.mode"
  else echo sandbox > "$R/$1.mode"; fi
}
judge P1 comparator-openai-chain.json
judge P2 comparator-openai-chain-planted.json
# P3: OpenAI's own challenge against the ported solution. The pinned .lean is checked against PINS.json, placed unchanged
# as Challenge/OpenAISubexponentialSAT.lean, and the config written from OpenAI's json with exactly two fields changed.
cat > /tmp/P3.py <<'PYEOF'
import hashlib, json, os, sys
W, A = sys.argv[1], '/audit/corpus/eth-refutation/openai-chain/challenge/'
pins = json.load(open(A + 'PINS.json'))
lean = open(A + 'SubexponentialSAT.lean', 'rb').read(); cfg = json.load(open(A + 'SubexponentialSAT.json'))
got = hashlib.sha256(lean).hexdigest(); want = pins['files']['SubexponentialSAT.lean']['sha256']
out = {'leanSha256': got, 'pinSha256': want, 'pinOk': got == want, 'configSha256': hashlib.sha256(open(A + 'SubexponentialSAT.json', 'rb').read()).hexdigest(), 'upstream': pins['upstream']}
if got != want:
    print(json.dumps(out, indent=1)); sys.exit(3)
open(W + '/Challenge/OpenAISubexponentialSAT.lean', 'wb').write(lean)
new = dict(cfg); new['challenge_module'] = 'Challenge.OpenAISubexponentialSAT'
out['configChanges'] = {k: {'from': cfg[k], 'to': new[k]} for k in cfg if cfg[k] != new[k]}
out['config'] = new
json.dump(new, open(W + '/comparator-openai-challenge.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
PYEOF
chmod 644 /tmp/P3.py; step P3.0 600 / python3 -I /tmp/P3.py $W
if [ "$(cat $R/P3.0.exit)" != 0 ]; then
  echo "NOT RUN: the fetched challenge is not the pinned bytes (P3.0 exit $(cat $R/P3.0.exit))" > $R/P3.notrun; echo notrun > $R/P3.mode
else
  cp $W/Challenge/OpenAISubexponentialSAT.lean $R/Challenge-OpenAISubexponentialSAT.lean; cp $W/comparator-openai-challenge.json $R/
  # the challenge is `import Mathlib` plus self-contained definitions: a Mathlib rename between d13f23b7 and 69552756 could
  # stop it compiling, which is NOT a verdict on the proof — reported as it ran
  # OpenAI's own solution module (Main, in the port) is built here too: L2 builds only what the chain imports
  step P3b 7200 $W lake build Challenge.OpenAISubexponentialSAT OAI.Algorithms.SubexponentialSAT.Main
  if [ "$(cat $R/P3b.exit)" != 0 ]; then
    echo "NOT RUN: the challenge or OpenAI's Main does not compile on Mathlib 69552756 (lake build exit $(cat $R/P3b.exit); the error in P3b.err)" > $R/P3.notrun; echo notrun > $R/P3.mode
  else
    judge P3 comparator-openai-challenge.json
  fi
fi
status P3 "$(cat $R/P3.notrun 2>/dev/null || echo "judged, exit $(cat $R/P3.exit)")"
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
