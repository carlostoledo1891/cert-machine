#!/usr/bin/env bash
# runpod-eth-chain.sh — deciding the Anthropic chain in one environment (operator's word, 2026-11-04): claimbox's
# lean/eth-bridge at a pinned commit, EthBridge.AnthropicChain.not_eth : ¬ETH := not_eth_of_ethIsFalse MainResults.ethIsFalse,
# where MainResults.ethIsFalse is anthropics/formal-math eth/ at 16a5ce41 PORTED to Lean v4.36.0-rc2 (AnthropicEth/, every
# change in its PORT.md). Decided here: the trusted statement byte-equal to cert-machine's pin
# (corpus/eth-refutation/chain/statement.lean), the vendored MainResults.lean against Anthropic's pin, the axioms from OUR
# file, nanoda on a lean4export of not_eth with two negative controls, leanchecker --fresh, the three planted chain
# variants refused, and then Lean's own judge, `lake comparator --paranoid` (six checkers), against a challenge written
# from the pin, with the planted changed statement as a solution that must be rejected. A copy of runpod-eth-c2.sh with
# the names changed and the Comparator steps of runpod-eth-comparator.sh added; no credential, facts on port 8000.
#   L1 prepare     elan, claimbox at the pin, its toolchain, `lake exe cache get`
#   L2 build       `lake build EthBridge.AnthropicChain Planted`
#   L3 axioms      our two files (the theorem and helpers; the planted ones)
#   L3s statement  the trusted block of EthBridge/AnthropicChain.lean and of Planted/ChainStatement.lean against the
#                  pinned copy; the sha256 of EthBridge/Anthropic/MainResults.lean
#   L4 nanoda      exports of not_eth, planted_chain_sorry, planted_chain_axiom; the first must pass, the two others must fail
#   L5 fresh       `lake env leanchecker --fresh EthBridge.AnthropicChain`
#   P  comparator  `lake comparator --paranoid`: Challenge.Chain vs EthBridge.AnthropicChain, and vs Planted.ChainStatement
# env: AUDIT_SHA, CLAIMBOX_SHA (both required)
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
status _machine "$(nproc) vCPU; cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null)"
mkdir -p /audit/tools /audit/corpus/eth-refutation/chain
for f in tools/eth-chain-axioms.lean tools/eth-chain-planted-axioms.lean corpus/eth-refutation/chain/statement.lean; do
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
lean --version; sha256sum EthBridge/*.lean EthBridge/Anthropic/*.lean Planted/*.lean AnthropicEth/PORT.md lakefile.toml lake-manifest.json; echo "AnthropicEth .lean files: \$(find AnthropicEth -name '*.lean' | wc -l)"
BLOCK
chmod 644 /tmp/L1.sh; step L1 7200 / bash /tmp/L1.sh
[ "$(cat $R/L1.exit)" = 0 ] || { status _phase "STOPPED: L1 failed"; sleep infinity; }
step L2 28800 $W lake build EthBridge.AnthropicChain Planted
for f in eth-chain-axioms eth-chain-planted-axioms; do cp /audit/tools/$f.lean /tmp/$f.lean; chmod 644 /tmp/$f.lean; done
step L3 3600 $W lake env lean /tmp/eth-chain-axioms.lean
step L3p 3600 $W lake env lean /tmp/eth-chain-planted-axioms.lean
# the trusted block: from `namespace EthBridge.AnthropicChain` to the head of `theorem not_eth`, byte-equal to the pin
cat > /tmp/stmt.py <<'EOF'
import hashlib, json, sys
pin = open('/audit/corpus/eth-refutation/chain/statement.lean').read()
def block(p):
    s = open(p).read(); h = 'theorem not_eth : ¬ ComplexityAbstracts.SubexponentialSATAbstract.ETH :='
    a, b = s.find('namespace EthBridge.AnthropicChain'), s.find(h)
    if b < 0:
        h = 'theorem not_eth : ComplexityAbstracts.SubexponentialSATAbstract.ETH :='; b = s.find(h)
    return None if a < 0 or b < 0 else s[a:b + len(h)] + '\n'
out = {'pinSha256': hashlib.sha256(pin.encode()).hexdigest(), 'mainResultsSha256': hashlib.sha256(open(sys.argv[1] + '/EthBridge/Anthropic/MainResults.lean', 'rb').read()).hexdigest()}
for name, p in [('claim', sys.argv[1] + '/EthBridge/AnthropicChain.lean'), ('plantedStatement', sys.argv[1] + '/Planted/ChainStatement.lean')]:
    b = block(p)
    out[name] = {'found': b is not None, 'sha256': hashlib.sha256(b.encode()).hexdigest() if b else None, 'equalsPin': b == pin}
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
for t in EthBridge.AnthropicChain.not_eth:EthBridge.AnthropicChain:claim planted_chain_sorry:Planted.ChainSorry:sorry planted_chain_axiom:Planted.ChainAxiom:axiom; do
  name=${t%%:*}; rest=${t#*:}; mod=${rest%%:*}; short=${rest#*:}; X=$H/export-$short.ndjson
  step L4.export-$short 7200 $W bash -c "lake env $H/src/lean4export/.lake/build/bin/lean4export $mod -- $name > $X && ls -l $X && sha256sum $X"
  if [ "$(cat $R/L4.export-$short.exit)" = 0 ]; then
    runuser -u $U -- python3 -c "import json,sys; json.dump({'export_file_path': sys.argv[1], 'use_stdin': False, 'num_threads': 8, 'stack_size_bytes': 1073741824, 'permitted_axioms': ['propext', 'Classical.choice', 'Quot.sound'], 'unpermitted_axiom_hard_error': False, 'nat_extension': True, 'string_extension': True, 'print_success_message': True}, open(sys.argv[2], 'w'), indent=1)" "$X" "$H/nanoda-$short.json"
    cp $H/nanoda-$short.json $R/L4.nanoda-$short.config.json
    step L4.nanoda-$short 10800 $H $H/src/nanoda/target/release/nanoda_bin $H/nanoda-$short.json
    rm -f "$X"
  fi
done
step L5 28800 $W lake env leanchecker --fresh EthBridge.AnthropicChain
# P: Lean's own judge on the chain, against a challenge written from cert-machine's pin
cat > /tmp/P0.py <<'PYEOF'
import hashlib, json, os, sys
W = sys.argv[1]
os.makedirs(W + '/Challenge', exist_ok=True)
pin = open('/audit/corpus/eth-refutation/chain/statement.lean').read()
assert pin.rstrip().endswith(':=')
open(W + '/Challenge/Chain.lean', 'w').write('import ComplexityAbstracts.SubexponentialSATAbstract\n\n' + pin + '  by sorry\n\nend EthBridge.AnthropicChain\n')
lf = open(W + '/lakefile.toml').read()
if 'name = "Challenge"' not in lf:
    open(W + '/lakefile.toml', 'a').write('\n# written by cert-machine on the pod (tools/runpod-eth-chain.sh): the challenge is cert-machine\'s pin\n[[lean_lib]]\nname = "Challenge"\nglobs = ["Challenge.+"]\n')
AX = ['propext', 'Quot.sound', 'Classical.choice']
for k, so in [('chain', 'EthBridge.AnthropicChain'), ('chain-planted', 'Planted.ChainStatement')]:
    json.dump({'challenge_module': 'Challenge.Chain', 'solution_module': so, 'theorem_names': ['EthBridge.AnthropicChain.not_eth'], 'permitted_axioms': AX}, open(W + '/comparator-' + k + '.json', 'w'), indent=1)
print(json.dumps({'challenge': hashlib.sha256(open(W + '/Challenge/Chain.lean', 'rb').read()).hexdigest(), 'pin': hashlib.sha256(pin.encode()).hexdigest()}, indent=1))
PYEOF
chmod 644 /tmp/P0.py; chown -R $U:$U $W 2>/dev/null; step P0 600 / python3 -I /tmp/P0.py $W
cp $W/Challenge/Chain.lean $R/Challenge-Chain.lean; cp $W/comparator-*.json $R/ 2>/dev/null
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
judge P1 comparator-chain.json
judge P2 comparator-chain-planted.json
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
