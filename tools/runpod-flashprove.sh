#!/usr/bin/env bash
# runpod-flashprove.sh — phase 2 of the outside check of FlashProve (notes/flashprove-preregistration-2026-11-04.md) on
# ONE RunPod CPU pod (cpu3m, 32 vCPU / 256 GB; cap US$25): the claim's Lean library built from the public bytes, the
# axioms of its six theorems from OUR file, its Lean verifier beside cp_verify on the stored full-size proof, and a
# second kernel (nanoda) on exports made by the PUBLIC lean4export — the route the claim's lean/CHECKING.md calls
# "untried".
#
# The pod runs a plain ubuntu:24.04 image whose start command downloads this script from this repository at a fixed
# commit (AUDIT_SHA) and runs it — `apt-get update -qq && apt-get install -y -qq curl ca-certificates && curl -fsSL
# <raw URL>/tools/runpod-flashprove.sh -o /run.sh && bash /run.sh`. It holds NO credential: it clones the public claim at
# its pin, checks every pinned byte against corpus/flashprove/PINS.json, and serves the facts (per step: .exit, .out,
# .err, .start, .end, and GNU time's peak) read-only on port 8000, which tools/import-runpod-flashprove.js downloads into
# corpus/flashprove/runs/runpod-<pod>/. Every step runs as an ordinary user (the claim's rule: never as root).
#
#   L1  prepare     elan + the pinned toolchain, the clone at the pin against PINS.json, `lake exe cache get`
#   L2  build       `lake build` (Library + AtFullSide), LEAN_NUM_THREADS from the claim's own rule of thumb
#   L3  axioms      `lake env lean tools/flashprove-axioms.lean` (ours)
#   L4  verifiers   cp_verify built here (verifier/build.sh), then cp_verify and lean_verify.sh on examples/full-size and
#                   on that proof with its middle byte flipped
#   L5  nanoda      lean4export v4.29.1 (the claim's toolchain) exports each named theorem with its dependencies; nanoda
#                   (ammkrn/nanoda_lib, NANODA_PIN, 1 GiB worker stacks, the three standard axioms permitted, nothing
#                   else) checks each export
#
# env: AUDIT_SHA (required), BUILD_TIMEOUT (s, default 36000), NANODA_TIMEOUT (s per theorem, default 10800),
#      STEPS (default "L1 L2 L3 L4 L5"), LEAN_THREADS (override the parallel bound), SPLIT_BUILD (1 = one lake call per target)
set -uo pipefail
: "${AUDIT_SHA:?}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-36000}"
NANODA_TIMEOUT="${NANODA_TIMEOUT:-10800}"
STEPS="${STEPS:-L1 L2 L3 L4 L5}"
CLAIM_REPO=https://github.com/anthropics/FlashProve.git
CLAIM_PIN=9e2bdd8ff5bf9c62f18263d7dac189b0400b260c
TOOLCHAIN=leanprover/lean4:v4.29.1
LEAN4EXPORT_PIN=6f4e21dd70c3c11d7fbd07d39e3192792c657448   # tag v4.29.1
NANODA_PIN=8de7e0c4ed3052745a7f8725164efd9e76d84c56        # HEAD on 2026-11-04 (stack_size_bytes in its config)
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results
U=tester
H=/home/$U

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential \
  g++ make unzip procps util-linux diffutils < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $R && chown $U:$U $R
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1; echo -1000 > "/proc/$(cat /tmp/http.pid)/oom_score_adj" 2>/dev/null || true
cgmax() { cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo unknown; }
cgcur() { cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || echo 0; }
( while true; do echo "$(date +%s) $(( $(cgcur) / 1024 ))" >> $R/_mem.tsv; sleep 15; done ) &

status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
chmod 644 /results/_status.json; }
status _audit "$AUDIT_SHA"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"; status _steps "$STEPS"
MEMMAX=$(cgmax)
status _machine "$(nproc) vCPU; cgroup memory.max $MEMMAX bytes; host shows $(free -g | awk '/Mem:/{print $2}') GB; $(df -h / | awk 'NR==2{print $4}') free; kernel $(uname -r); $(grep -o -m1 sha_ni /proc/cpuinfo || echo 'no sha_ni')"

# the claim's rule of thumb for the build (lean/CHECKING.md): one process, and one more per 12 GiB beyond 50
if [ "$MEMMAX" != unknown ] && [ "$MEMMAX" != max ]; then GIB=$(( MEMMAX / 1073741824 )); else GIB=$(free -g | awk '/Mem:/{print $2}'); fi
BOUND=$(( 1 + (GIB > 50 ? (GIB - 50) / 12 : 0) )); [ $BOUND -gt "$(nproc)" ] && BOUND=$(nproc)
# a re-run may lower it (the 2026-11-04 run: Lake itself segfaulted at 37,583/37,650 jobs with 16)
[ -n "${LEAN_THREADS:-}" ] && BOUND=$LEAN_THREADS
status _leanNumThreads "$BOUND (from $GIB GiB)"

mkdir -p /audit/tools /audit/corpus/flashprove
for f in tools/flashprove-pins.py tools/flashprove-axioms.lean corpus/flashprove/PINS.json; do
  curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: could not fetch $f"; sleep infinity; }
done
chmod -R a+rX /audit

# one timed step as the ordinary user: $1 name, $2 timeout (s), $3 directory, the rest the command
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"
  date +%s > $R/$n.start
  runuser -u $U -- env HOME=$H PATH="$H/.elan/bin:/usr/local/bin:/usr/bin:/bin" LEAN_NUM_THREADS="$BOUND" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" \
    > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
has() { case " $STEPS " in *" $1 "*) return 0;; *) return 1;; esac; }
FP=$H/fp

if has L1; then
  cat > /tmp/L1.sh <<BLOCK
set -euo pipefail
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
export PATH=\$HOME/.elan/bin:\$PATH
for t in 1 2 3 4 5; do rm -rf $FP; git clone -q $CLAIM_REPO $FP && break; sleep \$((t * 60)); done
git -C $FP checkout -q $CLAIM_PIN
python3 -I /audit/tools/flashprove-pins.py $FP --check
cd $FP/lean && test "\$(cat lean-toolchain)" = $TOOLCHAIN
elan toolchain install $TOOLCHAIN
for t in 1 2 3 4 5; do lake exe cache get && break; sleep \$((t * 60)); done
ls .lake/packages/mathlib/.lake/build/ir/Mathlib/Logic/Basic.c || echo 'NOTE: no .c files in the Mathlib cache (tools/lean-verify/README.md, "If a .c file is missing")'
lean --version
BLOCK
  chmod 644 /tmp/L1.sh; step L1 7200 / bash /tmp/L1.sh
  [ "$(cat $R/L1.exit)" = 0 ] || { status _phase "STOPPED: L1 failed"; sleep infinity; }
fi

if has L2; then
  if [ "${SPLIT_BUILD:-0}" = 1 ]; then
    # one Lake call per default target, so no single Lake process holds the whole job graph
    step L2a "$BUILD_TIMEOUT" $FP/lean env LEAN_ABORT_ON_PANIC=1 lake build Library
    step L2b "$BUILD_TIMEOUT" $FP/lean env LEAN_ABORT_ON_PANIC=1 lake build AtFullSide
    cp $R/L2b.exit $R/L2.exit
  else
    step L2 "$BUILD_TIMEOUT" $FP/lean env LEAN_ABORT_ON_PANIC=1 lake build
  fi
fi
has L3 && { cp /audit/tools/flashprove-axioms.lean /tmp/FlashproveAxioms.lean; chmod 644 /tmp/FlashproveAxioms.lean
            step L3 3600 $FP/lean lake env lean /tmp/FlashproveAxioms.lean; }

if has L4; then
  step L4.build 1800 $FP verifier/build.sh
  E=examples/full-size
  runuser -u $U -- bash -c "mkdir -p $H/t && python3 - $FP/$E/example.proof $H/t/a.proof <<'EOF'
import sys
b = bytearray(open(sys.argv[1], 'rb').read()); i = len(b) // 2; b[i] ^= 1; open(sys.argv[2], 'wb').write(b); print(i)
EOF" > $R/L4.flip.txt
  step L4.cp 1800 $FP bin/cp_verify $E/config $E/ivk $E/example.req $E/example.y $E/example.proof -id "$(cat $FP/$E/ID.txt)"
  step L4.cp-a 1800 $FP bin/cp_verify $E/config $E/ivk $E/example.req $E/example.y $H/t/a.proof -id "$(cat $FP/$E/ID.txt)"
  step L4.lean 10800 $FP tools/lean-verify/lean_verify.sh $E/config $E/ivk $E/example.req $E/example.y $E/example.proof $E/ID.txt
  step L4.lean-a 10800 $FP tools/lean-verify/lean_verify.sh $E/config $E/ivk $E/example.req $E/example.y $H/t/a.proof $E/ID.txt
fi

if has L5; then
  cat > /tmp/L5tools.sh <<BLOCK
set -euo pipefail
export PATH=\$HOME/.elan/bin:\$HOME/.cargo/bin:\$PATH
mkdir -p \$HOME/src && cd \$HOME/src
rm -rf lean4export && git clone -q https://github.com/leanprover/lean4export.git && cd lean4export && git checkout -q $LEAN4EXPORT_PIN
test "\$(cat lean-toolchain)" = $TOOLCHAIN
lake build lean4export
cd \$HOME/src && curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal
rm -rf nanoda && git clone -q https://github.com/ammkrn/nanoda_lib.git nanoda && cd nanoda && git checkout -q $NANODA_PIN
cargo build --release -q
ls -la target/release/nanoda_bin \$HOME/src/lean4export/.lake/build/bin/lean4export
BLOCK
  chmod 644 /tmp/L5tools.sh; step L5.tools 3600 / bash /tmp/L5tools.sh
  # the theorems in order: the one beneath `sound` first (the claim's nanoda accepted it over its own exporter), then
  # the three the claim's nanoda accepted by name, then the three it checked with Lean's kernel alone
  for t in VerifierAndGoals.AtTheName.sound_of_verify_at:Johnson.Goal.Skeleton.SoundOfVerifyAt \
           VerifiableInference.sound:AtFullSide.Face.TheSixLines \
           VerifiableInference.repliesFit:AtFullSide.Face.TheSixLines \
           VerifiableInference.refusedHandsOutNoProof:AtFullSide.Face.TheSixLines \
           VerifiableInference.soundAndBinding:AtFullSide.Face.TheSixLines \
           VerifiableInference.completeOnCanServe:AtFullSide.Face.TheSixLines \
           VerifiableInference.zeroKnowledgeOnCanServe:AtFullSide.Face.TheSixLines; do
    name=${t%%:*}; mod=${t#*:}; short=${name##*.}
    X=$H/export-$short.ndjson
    step L5.export-$short 7200 $FP/lean bash -c "lake env $H/src/lean4export/.lake/build/bin/lean4export $mod -- $name > $X && ls -l $X && sha256sum $X"
    if [ "$(cat $R/L5.export-$short.exit)" = 0 ]; then
      runuser -u $U -- python3 - "$X" "$H/nanoda-$short.json" <<'EOF'
import json, sys
json.dump({'export_file_path': sys.argv[1], 'use_stdin': False, 'num_threads': 16, 'stack_size_bytes': 1073741824,
           'permitted_axioms': ['propext', 'Classical.choice', 'Quot.sound'], 'unpermitted_axiom_hard_error': False,
           'nat_extension': True, 'string_extension': True, 'print_success_message': True}, open(sys.argv[2], 'w'), indent=1)
EOF
      cp $H/nanoda-$short.json $R/L5.nanoda-$short.config.json
      step L5.nanoda-$short "$NANODA_TIMEOUT" $H $H/src/nanoda/target/release/nanoda_bin $H/nanoda-$short.json
      rm -f "$X"
    fi
  done
fi

status _phase "complete"
status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
