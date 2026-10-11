#!/usr/bin/env bash
# runpod-openai-math.sh — lane K of the openai/math audit on ONE RunPod CPU pod, for the challenges GitHub's hosted
# runners (4 vCPU, 16 GB, 6 h) cannot finish. Pre-registration amendment 14: the same steps as the check job of
# .github/workflows/openai-math-kernel.yml, at the same pins, on a bigger machine — nothing else changes.
#
# The pod runs a plain ubuntu:24.04 image whose start command downloads this script from this repository at a fixed
# commit (AUDIT_SHA) to a file and runs it — `apt-get update -qq && apt-get install -y -qq curl ca-certificates &&
# curl -fsSL <raw URL> -o /run.sh && bash /run.sh` — and holds NO credential: it clones public repositories, builds the tools from source at
# their pins, runs the challenges, and serves the facts (result.json + logs per challenge, no verdict) read-only on
# port 8000, which tools/import-runpod-openai-math.js downloads into corpus/openai-math/kernel-runs/runpod-<pod>/.
#
# env: AUDIT_SHA (this repository's commit), CHALLENGES (space-separated), NANODA_BUILD (stack1g | issue44 |
#      issue44-stack1g; default issue44-stack1g), SLOTS (challenges at once; default 3), LEAN_GLIBC_TUNABLES (optional,
#      amendment 15: exported as GLIBC_TUNABLES for the Comparator run — the release README's workaround)
set -uo pipefail
: "${AUDIT_SHA:?}" "${CHALLENGES:?}"
NANODA_BUILD="${NANODA_BUILD:-issue44-stack1g}"
SLOTS="${SLOTS:-3}"
MATH_REPO=https://github.com/openai/math.git
MATH_PIN=fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb
LEAN_TOOLCHAIN=leanprover/lean4:v4.34.1
COMPARATOR_PIN=d03acab154d269c06e60e4de7e4cc85deebff94b
LEAN4EXPORT_PIN=076e8e57707e813375e8f9da8bf989799ace9680
LANDRUN_PIN=811cfff51ceaf3d9843708aa6d22e9b84ccac8b4
NANODA_PIN=3a2407216ee84a75f9e1aead6803d0578be06ae7
ISSUE44_SHA256=3939d228619a28d7437bad82c1d41fe1fd4597a7ea55b849840c0f7caa7d0ee5
GO_TGZ=go1.24.13.linux-amd64.tar.gz
GO_SHA256=1fc94b57134d51669c72173ad5d49fd62afb0f1db9bf3f798fd98ee423f8d730
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results
mkdir -p $R /audit/tools /audit/corpus/openai-math/nanoda /src /tools/bin
status() { flock /tmp/status.lock python3 - "$@" <<'EOF'
import json, sys, os, time
p = '/results/_status.json'
s = json.load(open(p)) if os.path.exists(p) else {}
s[sys.argv[1]] = sys.argv[2]; s['_updated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
json.dump(s, open(p + '.tmp', 'w'), indent=1); os.replace(p + '.tmp', p)
EOF
}
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential procps util-linux < /dev/null > /dev/null
# serve the facts from here on, so progress is visible while it runs
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)
status _audit "$AUDIT_SHA"; status _nanodaBuild "$NANODA_BUILD"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU, $(free -g | awk '/Mem:/{print $2}') GB RAM, $(df -h / | awk 'NR==2{print $4}') free; landlock: $(cat /sys/kernel/security/lsm 2>/dev/null || echo unreadable)"
status _phase "fetching the audit's helpers at $AUDIT_SHA"
for f in tools/openai-math-kernel-result.py tools/openai-math-transfer.py corpus/openai-math/release.json corpus/openai-math/nanoda/issue44.patch; do
  curl -fsSL "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: could not fetch $f"; sleep infinity; }
done

status _phase "building the tools at their pins (nanoda: $NANODA_BUILD)"
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH="$HOME/.elan/bin:/tools/bin:/usr/local/go/bin:$HOME/.cargo/bin:$PATH"
export GIT_TERMINAL_PROMPT=0 MATH_REPO MATH_PIN LEAN_TOOLCHAIN COMPARATOR_PIN LEAN4EXPORT_PIN LANDRUN_PIN NANODA_PIN ISSUE44_SHA256 GO_TGZ GO_SHA256 NANODA_BUILD
# each block runs in its own `bash -e` (set -e is ignored inside a ( ... ) || ... list, so a failed step would go unnoticed)
cat > /tmp/tools.sh <<'BLOCK'
  cd /src && git clone -q https://github.com/leanprover/comparator.git && cd comparator && git checkout -q "$COMPARATOR_PIN"
  echo "$LEAN_TOOLCHAIN" > lean-toolchain
  sed -i 's/"rev": "[0-9a-f]\{40\}"/"rev": "'"$LEAN4EXPORT_PIN"'"/' lake-manifest.json
  lake build lean4export comparator > /results/_tools-comparator.log 2>&1
  cp .lake/build/bin/comparator /tools/bin/ && cp .lake/packages/lean4export/.lake/build/bin/lean4export /tools/bin/
  (cd .lake/packages/lean4export && git rev-parse HEAD) > /tools/lean4export.rev
  cd /src && curl -fsSL -o go.tgz "https://go.dev/dl/$GO_TGZ" && echo "$GO_SHA256  go.tgz" | sha256sum -c - && tar -C /usr/local -xzf go.tgz
  git clone -q https://github.com/Zouuup/landrun.git && cd landrun && git checkout -q "$LANDRUN_PIN" && go build -o /tools/bin/landrun ./cmd/landrun
  cd /src && curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal > /dev/null
  git clone -q https://github.com/ammkrn/nanoda_lib.git && cd nanoda_lib && git checkout -q "$NANODA_PIN"
  case "$NANODA_BUILD" in stack1g|issue44-stack1g)
    sed -i 's/pub(crate) const STACK_SIZE: usize = 16_777_216;/pub(crate) const STACK_SIZE: usize = 1_073_741_824;/' src/lib.rs
    test "$(git diff --numstat src/lib.rs | awk '{print $1+$2}')" = "2" ;; esac
  case "$NANODA_BUILD" in issue44|issue44-stack1g)
    P=/audit/corpus/openai-math/nanoda/issue44.patch
    test "$(sha256sum "$P" | cut -d' ' -f1)" = "$ISSUE44_SHA256"
    git apply "$P" ;; esac
  test -z "$(git diff --name-only | grep -v -x -e src/lib.rs -e src/tc.rs)"
  git diff > /results/_nanoda.patch
  cargo build --release -q && cp target/release/nanoda_bin /tools/bin/
  echo "$NANODA_BUILD" > /tools/nanoda.build
BLOCK
bash -euo pipefail /tmp/tools.sh < /dev/null || { status _phase "FAILED: building the tools (see _tools-comparator.log)"; sleep infinity; }

status _phase "the release at its pin; lake update; the Mathlib cache"
cat > /tmp/release.sh <<'BLOCK'
  cd /src && git clone -q --filter=blob:none --no-checkout "$MATH_REPO" math
  cd math && git sparse-checkout set lean && git checkout -q "$MATH_PIN" && test "$(git rev-parse HEAD)" = "$MATH_PIN"
  cd lean && test "$(cat lean-toolchain)" = "$LEAN_TOOLCHAIN"
  # anonymous clones from a datacenter address are sometimes refused by GitHub for a while ("could not read
  # Username"): retry with backoff; lake resumes the packages it has
  ok=0
  for t in 1 2 3 4 5 6; do
    if lake update > /results/_lake-update.log 2>&1; then ok=1; break; fi
    echo "attempt $t failed; retrying in $((t * 60)) s" >> /results/_lake-update-retries.log; sleep $((t * 60))
  done
  test "$ok" = 1
  python3 - <<'EOF'
import json, sys
rel = json.load(open('/audit/corpus/openai-math/release.json'))
want = {d['name']: d['rev'] for d in rel['dependencies']}
got = {p['name']: p['rev'] for p in json.load(open('lake-manifest.json'))['packages']}
moved = sorted(k for k in want if got.get(k) != want[k])
if moved: sys.exit('lake update moved a pinned dependency: ' + ', '.join(moved))
EOF
  ok=0
  for t in 1 2 3 4 5; do
    if lake exe cache get > /results/_cache.log 2>&1; then ok=1; break; fi
    sleep $((t * 60))
  done
  test "$ok" = 1
BLOCK
bash -euo pipefail /tmp/release.sh < /dev/null || { status _phase "FAILED: preparing the release (see _lake-update.log, _cache.log)"; sleep infinity; }
for s in $(seq 1 "$SLOTS"); do cp -a /src/math "/src/slot$s"; done

run_one() {  # $1 slot, $2 challenge — the check job's steps, verbatim in substance
  local slot=$1 CH=$2 out=$R/$2
  mkdir -p "$out"; status "$CH" "running (slot $slot)"
  cd "/src/slot$slot/lean" || return
  CH="$CH" python3 - <<'EOF' > "$out/census.txt" 2>&1 || { status "$CH" "census mismatch"; return; }
import hashlib, json, os, sys
rel = json.load(open('/audit/corpus/openai-math/release.json'))
ch = next((c for c in rel['challenges'] if c['name'] == os.environ['CH']), None)
if ch is None: sys.exit('not a census challenge: ' + os.environ['CH'])
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
assert sha('ComparatorChallenges/%s.json' % ch['name']) == ch['configSha256'], 'config bytes differ from the census'
assert sha('ComparatorChallenges/%s.lean' % ch['name']) == ch['statementSha256'], 'statement bytes differ from the census'
cfg = json.load(open('ComparatorChallenges/%s.json' % ch['name']))
cfg['enable_nanoda'] = True
json.dump(cfg, open('audit-config-%s.json' % ch['name'], 'w'), indent=1)
if cfg.get('definition_names'):
    json.dump(dict(cfg, definition_names=[]), open('audit-config-strict-%s.json' % ch['name'], 'w'), indent=1)
print('census bytes match; nanoda on; definition holes: %d' % len(cfg.get('definition_names') or []))
EOF
  {
    echo "kernel: $(uname -r)"; echo "landlock: $(cat /sys/kernel/security/lsm 2>/dev/null)"
    lean --version; comparator --version 2>/dev/null || true
    echo "lean4export rev: $(cat /tools/lean4export.rev)"
    echo "nanoda build: $(cat /tools/nanoda.build)"
    echo "runner: runpod $(hostname | cut -c1-12) slot $slot ($(nproc) vCPU, $(free -g | awk '/Mem:/{print $2}') GB RAM)"
  } > "$out/env.txt" 2>&1
  (
    ulimit -s unlimited || true
    export RUST_MIN_STACK=1073741824
    # amendment 15: the release's own README workaround for Lean crashing (exit 139) when vm.max_map_count is too low
    if [ -n "${LEAN_GLIBC_TUNABLES:-}" ]; then export GLIBC_TUNABLES="$LEAN_GLIBC_TUNABLES"; echo "GLIBC_TUNABLES=$GLIBC_TUNABLES" >> "$out/env.txt"; fi
    echo "vm.max_map_count: $(cat /proc/sys/vm/max_map_count 2>/dev/null)" >> "$out/env.txt"
    echo "stack: $(ulimit -s); RUST_MIN_STACK=$RUST_MIN_STACK" >> "$out/env.txt"
    start=$(date +%s)
    /usr/bin/time -v lake env comparator "audit-config-$CH.json" > "$out/comparator.log" 2> "$out/comparator.err"
    echo $? > "$out/exit.txt"; echo $(( $(date +%s) - start )) > "$out/seconds.txt"
    if [ -f "audit-config-strict-$CH.json" ]; then
      start=$(date +%s)
      lake env comparator "audit-config-strict-$CH.json" > "$out/strict.log" 2> "$out/strict.err"
      echo $? > "$out/strict-exit.txt"; echo $(( $(date +%s) - start )) > "$out/strict-seconds.txt"
      T=/audit/tools/openai-math-transfer.py
      if python3 "$T" "ComparatorChallenges/$CH.lean" "ComparatorChallenges/$CH.json" > "AuditTransfer$CH.lean" 2> "$out/transfer.err"; then
        cp "AuditTransfer$CH.lean" "$out/AuditTransfer.lean"
        timeout 3600 lake env lean "AuditTransfer$CH.lean" > "$out/transfer.log" 2>> "$out/transfer.err"; echo $? > "$out/transfer-exit.txt"
      else echo 97 > "$out/transfer-exit.txt"; fi
      python3 "$T" "ComparatorChallenges/$CH.lean" "ComparatorChallenges/$CH.json" --forge > "AuditTransferForge$CH.lean" 2> "$out/forge.err"; fe=$?
      if [ $fe -eq 0 ]; then cp "AuditTransferForge$CH.lean" "$out/AuditTransferForge.lean"
        timeout 3600 lake env lean "AuditTransferForge$CH.lean" > "$out/forge.log" 2>> "$out/forge.err"; echo $? > "$out/forge-exit.txt"
      elif [ $fe -eq 3 ]; then echo genuine > "$out/forge-exit.txt"; else echo 97 > "$out/forge-exit.txt"; fi
    fi
  )
  python3 /audit/tools/openai-math-kernel-result.py "$out" "$CH" > "$out/result.json"
  status "$CH" "done (exit $(cat "$out/exit.txt" 2>/dev/null))"
}

# the queue: slot k takes challenges k, k+SLOTS, k+2*SLOTS, ... in the order given
read -r -a LIST <<< "$CHALLENGES"
for c in "${LIST[@]}"; do status "$c" queued; done
status _phase "running ${#LIST[@]} challenges on $SLOTS slots"
for s in $(seq 1 "$SLOTS"); do
  ( i=$((s - 1)); while [ $i -lt ${#LIST[@]} ]; do run_one "$s" "${LIST[$i]}"; i=$((i + SLOTS)); done ) &
done
wait
status _phase "complete"
date -u +%Y-%m-%dT%H:%M:%SZ > $R/_done
sleep infinity
