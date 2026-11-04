#!/usr/bin/env bash
# runpod-flashprove-gpu.sh — phase 5 of the FlashProve check (notes/flashprove-preregistration-2026-11-04.md; operator,
# 2026-11-04: "Run now", cap US$5) on ONE RunPod H100 80 GB pod: the claim at its pin, every pinned byte against
# corpus/flashprove/PINS.json, CUDA 13.2 Update 2 (nvcc 13.2.86) from NVIDIA's PyPI packages by the claim's own install
# lines (prover/docs/build.md), then the claim's GPU route `examples/quickstart-gpu.sh` (build, commit, prove one 64-token
# request, verify), then the fresh proof checked again here by the cp_verify that route built, and a copy with its middle
# byte flipped, which must be refused. No credential; facts read-only on port 8000; every step as an ordinary user.
# env: AUDIT_SHA (required)
set -uo pipefail
# the pod's own API key never reaches the claimant's build (security pass, 2026-11-04)
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
CLAIM_REPO=https://github.com/anthropics/FlashProve.git
CLAIM_PIN=9e2bdd8ff5bf9c62f18263d7dac189b0400b260c
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results U=tester H=/home/tester
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 python3-pip curl ca-certificates time build-essential g++ make unzip procps util-linux binutils < /dev/null > /dev/null
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $R && chown $U:$U $R
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
chmod 644 /results/_status.json; }
status _audit "$AUDIT_SHA"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU; $(nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader 2>&1 | head -1)"
mkdir -p /audit/tools /audit/corpus/flashprove
for f in tools/flashprove-pins.py corpus/flashprove/PINS.json; do curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: fetch $f"; sleep infinity; }; done
chmod -R a+rX /audit
step() {
  local n=$1 to=$2 dir=$3; shift 3
  status _phase "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$H/cuda-13.2.86/nvidia/cu13/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  status "$n" "exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
FP=$H/fp
cat > /tmp/G1.sh <<BLOCK
set -euo pipefail
for t in 1 2 3; do rm -rf $FP; git clone -q $CLAIM_REPO $FP && break; sleep 60; done
git -C $FP checkout -q $CLAIM_PIN
python3 -I /audit/tools/flashprove-pins.py $FP --check
# the claim's own install lines (prover/docs/build.md, "One way to get that compiler"), in order
cuda=\$HOME/cuda-13.2.86
mkdir "\$cuda"
python3 -m pip install --target "\$cuda" "cuda-toolkit[nvcc,cublas,cccl,crt,nvvm,cudart]==13.2.2"
lib="\$cuda/nvidia/cu13/lib"
for n in cublasLt cublas cudart; do ln -s lib\$n.so.13 "\$lib/lib\$n.so"; done
mkdir "\$lib/stubs"
ln -s "\$(/sbin/ldconfig -p | awk '/libcuda\.so\.1 .*x86-64/ { print \$NF; exit }')" "\$lib/stubs/libcuda.so"
chmod -R go-w "\$cuda"
export PATH="\$cuda/nvidia/cu13/bin:\$PATH"
nvcc --version; g++ --version | head -1; nvidia-smi
BLOCK
chmod 644 /tmp/G1.sh; step G1 3600 / bash /tmp/G1.sh
[ "$(cat $R/G1.exit)" = 0 ] || { status _phase "STOPPED: G1 failed"; sleep infinity; }
step G2 7200 $FP bash examples/quickstart-gpu.sh
# the fresh proof, checked again by the route's own cp_verify, and a tampered copy that must be refused
cat > /tmp/G3.sh <<'BLOCK'
set -uo pipefail
out=$(grep -o 'The proof is [^ ]*example.proof' /results/G2.out | tail -1 | sed 's/The proof is //')
id=$(grep -o 'The commitment ID is [0-9a-f]\{64\}' /results/G2.out | tail -1 | awk '{print $5}')
d=$(dirname "$out"); echo "dir $d id $id"; ls -la "$d"
fp=$HOME/fp
args=("$d/config" "$d/ivk" "$d/example.req" "$d/example.y")
"$fp/bin/cp_verify" "${args[@]}" "$d/example.proof" -id "$id" > /results/G3.fresh.out 2>&1; echo $? > /results/G3.fresh.exit
python3 - "$d/example.proof" /tmp/a.proof <<'EOF'
import sys
b = bytearray(open(sys.argv[1], 'rb').read()); b[len(b) // 2] ^= 1; open(sys.argv[2], 'wb').write(b)
EOF
"$fp/bin/cp_verify" "${args[@]}" /tmp/a.proof -id "$id" > /results/G3.tampered.out 2>&1; echo $? > /results/G3.tampered.exit
sha256sum "$d"/example.* > /results/G3.sha256; cp "$d"/example.req "$d"/example.y /results/ 2>/dev/null; echo "$id" > /results/G3.id
tail -2 /results/G3.fresh.out; tail -2 /results/G3.tampered.out
BLOCK
chmod 644 /tmp/G3.sh; step G3 1800 $FP bash /tmp/G3.sh
status _phase complete; status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
sleep infinity
