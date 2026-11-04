#!/usr/bin/env bash
# runpod-cslib-eth.sh — D1 of the ETH model-gap lane (notes/eth-model-gap-preregistration-2026-11-04.md) on ONE RunPod CPU
# pod: cslib-community/complexitylib at 1b7d62a8 (it holds #1338, the native ¬ETH on cslib's multitape TM, and #2027,
# the word-RAM simulation), built from source over Mathlib's cache, the axioms and statements from OUR file, nanoda on a
# lean4export of the headlines, and leanchecker --fresh on the abstract module.
#
# The pod runs plain ubuntu:24.04; the start command downloads this script from this repository at AUDIT_SHA and runs
# it. It holds NO credential and serves its facts (per step: .exit, .out, .err, .start, .end; GNU time's peak) read-only
# on port 8000; tools/import-runpod-flashprove.js-style import into corpus/eth-refutation/cslib/runs/runpod-<pod>/.
# Every step runs as an ordinary user.
#   L1 prepare    elan, the clone at the pin, its toolchain, `lake exe cache get` (Mathlib's cache only)
#   L2 build      `lake build ComplexityAbstracts.SubexponentialSATAbstract Complexity.Computability.WordRAM.OfTuring`
#   L3 axioms     `lake env lean tools/cslib-eth-axioms.lean` (ours)
#   L4 nanoda     lean4export (tag v4.36.0-rc1, built with the claim's v4.36.0-rc2) exports each headline with its
#                 dependencies; nanoda (8de7e0c, 1 GiB stacks, the three standard axioms) checks each export
#   L5 fresh      `lake env leanchecker --fresh ComplexityAbstracts.SubexponentialSATAbstract`
# env: AUDIT_SHA (required)
set -uo pipefail
: "${AUDIT_SHA:?}"
REPO=https://github.com/cslib-community/complexitylib.git
PIN=1b7d62a8655b08351ba37684f3318257c3cd63f9
TOOLCHAIN=leanprover/lean4:v4.36.0-rc2
LEAN4EXPORT_PIN=df81913eee5519d5a88ae5b0fd701b5298cc29ab   # tag v4.36.0-rc1
NANODA_PIN=8de7e0c4ed3052745a7f8725164efd9e76d84c56
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results U=tester H=/home/tester
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential procps util-linux < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $R && chown $U:$U $R
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1; echo -1000 > "/proc/$(cat /tmp/http.pid)/oom_score_adj" 2>/dev/null || true
cgcur() { cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0; }
( while true; do echo "$(date +%s) $(( $(cgcur) / 1024 ))" >> $R/_mem.tsv; sleep 15; done ) &
status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
chmod 644 /results/_status.json; }
status _audit "$AUDIT_SHA"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU; cgroup memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null); $(df -h / | awk 'NR==2{print $4}') free"
mkdir -p /audit/tools && curl -fsSL --retry 5 "$RAW/tools/cslib-eth-axioms.lean" -o /audit/tools/cslib-eth-axioms.lean || { status _phase "FAILED: fetch"; sleep infinity; }
chmod -R a+rX /audit
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env HOME=$H PATH="$H/.elan/bin:$H/.cargo/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
W=$H/cx
cat > /tmp/L1.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
for t in 1 2 3 4 5; do rm -rf $W; git clone -q $REPO $W && break; sleep \$((t * 60)); done
git -C $W checkout -q $PIN && test "\$(git -C $W rev-parse HEAD)" = $PIN
cd $W && test "\$(cat lean-toolchain)" = $TOOLCHAIN
elan toolchain install $TOOLCHAIN
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
lean --version; git -C $W log -1 --format='%H %cd'
BLOCK
chmod 644 /tmp/L1.sh; step L1 7200 / bash /tmp/L1.sh
[ "$(cat $R/L1.exit)" = 0 ] || { status _phase "STOPPED: L1 failed"; sleep infinity; }
step L2 21600 $W lake build ComplexityAbstracts.SubexponentialSATAbstract Complexity.Computability.WordRAM.OfTuring
cp /audit/tools/cslib-eth-axioms.lean /tmp/CslibEthAxioms.lean; chmod 644 /tmp/CslibEthAxioms.lean
step L3 3600 $W lake env lean /tmp/CslibEthAxioms.lean
cat > /tmp/L4tools.sh <<BLOCK
set -euo pipefail
export PATH=\$HOME/.elan/bin:\$HOME/.cargo/bin:\$PATH
mkdir -p \$HOME/src && cd \$HOME/src
rm -rf lean4export && git clone -q https://github.com/leanprover/lean4export.git && cd lean4export && git checkout -q $LEAN4EXPORT_PIN
echo "lean4export \$(git rev-parse --short HEAD) ships \$(cat lean-toolchain); built with $TOOLCHAIN"
echo $TOOLCHAIN > lean-toolchain && lake build lean4export
cd \$HOME/src && curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal
rm -rf nanoda && git clone -q https://github.com/ammkrn/nanoda_lib.git nanoda && cd nanoda && git checkout -q $NANODA_PIN && cargo build --release -q
BLOCK
chmod 644 /tmp/L4tools.sh; step L4.tools 3600 / bash /tmp/L4tools.sh
for t in ComplexityAbstracts.SubexponentialSATAbstract.not_eth:ComplexityAbstracts.SubexponentialSATAbstract \
         ComplexityAbstracts.SubexponentialSATAbstract.exact_count:ComplexityAbstracts.SubexponentialSATAbstract \
         Cslib.WordRAM.OfTuring.executes_simProgram:Complexity.Computability.WordRAM.OfTuring; do
  name=${t%%:*}; mod=${t#*:}; short=${name##*.}; X=$H/export-$short.ndjson
  step L4.export-$short 7200 $W bash -c "lake env $H/src/lean4export/.lake/build/bin/lean4export $mod -- $name > $X && ls -l $X && sha256sum $X"
  if [ "$(cat $R/L4.export-$short.exit)" = 0 ]; then
    runuser -u $U -- python3 -c "import json,sys; json.dump({'export_file_path': sys.argv[1], 'use_stdin': False, 'num_threads': 16, 'stack_size_bytes': 1073741824, 'permitted_axioms': ['propext', 'Classical.choice', 'Quot.sound'], 'unpermitted_axiom_hard_error': False, 'nat_extension': True, 'string_extension': True, 'print_success_message': True}, open(sys.argv[2], 'w'), indent=1)" "$X" "$H/nanoda-$short.json"
    cp $H/nanoda-$short.json $R/L4.nanoda-$short.config.json
    step L4.nanoda-$short 10800 $H $H/src/nanoda/target/release/nanoda_bin $H/nanoda-$short.json
    rm -f "$X"
  fi
done
step L5 14400 $W lake env leanchecker --fresh ComplexityAbstracts.SubexponentialSATAbstract
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
