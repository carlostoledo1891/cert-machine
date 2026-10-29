#!/usr/bin/env bash
# runpod-eth.sh — the KERNEL lane of the check of the two claimed refutations of the Exponential Time Hypothesis, on ONE
# RunPod CPU pod: OpenAI's openai/math family 378 (SubexponentialSAT, Lean v4.34.1; the hosted runner died on it,
# certs/openai-math-kernel-7ef5c0cc.json) and Anthropic's formal-math/eth (MainResults, Lean v4.33.1).
#
# The pod runs a plain ubuntu:24.04 image whose start command downloads this script from this repository at a fixed
# commit (AUDIT_SHA) and runs it — `apt-get update -qq && apt-get install -y -qq curl ca-certificates && curl -fsSL
# <raw URL>/tools/runpod-eth.sh -o /run.sh && bash /run.sh` — and holds NO credential: it clones the two public claims
# at their pins and checks every byte against corpus/eth-refutation/pins.json, builds the tools from source at their
# pins, runs the steps below one claim at a time, and serves the facts (result.json + logs per claim, no verdict)
# read-only on port 8000, which tools/import-runpod-eth.js downloads into corpus/eth-refutation/runs/runpod-<pod>/.
#
# Per claim, in this order (Comparator first, before anything outside its sandbox builds the solution — its README's
# second assumption):
#   prepare      the clone at the pin, its bytes against pins.json; OpenAI: `lake update` FIRST (its post_update hook
#                patches dependencies; lane K's rule), the resolved revisions against the pinned manifest; then
#                `lake exe cache get` (both)
#   comparator   the claim's OWN config with ONE change, enable_nanoda: true: Comparator (leanprover/comparator d03acab1
#                = tag v4.34.0, lane K's, built with v4.34.1) builds the challenge and the solution inside landrun,
#                exports both with the lean4export of the CLAIM's toolchain, compares the statements, checks the axioms
#                against the permitted three, and replays the solution in Lean's kernel and in nanoda (ammkrn/nanoda_lib
#                3a240721 with lane K's issue44 patch and 1 GiB stack: NANODA_BUILD)
#   build        the claimant's own build instruction outside the sandbox (Anthropic: `lake build`; OpenAI: the solution
#                module and the challenge module — the whole OAI library is 1.7 GB of other families)
#   axioms       `#print axioms` of each main theorem, from OUR file (never the claimant's script)
# and after both claims (the long, single-threaded replays last, so the deciding facts arrive first):
#   leanchecker  `lake env leanchecker --fresh <solution module>`: the claim's own toolchain's kernel (leanchecker has
#                shipped inside every toolchain since v4.28; the lean4checker repository is archived) replays every
#                constant the solution module reaches, Mathlib included, from the .olean files
#
# Every step: exit code, wall seconds, GNU time's peak RSS of the largest process, and the container's peak from a
# 15-second sampler of the cgroup (RunPod's `free` shows the host's RAM, not the pod's: lane K's 2026-10-12 note).
#
# env: AUDIT_SHA (this repository's commit; required), CLAIMS (default "anthropic openai"), NANODA_BUILD (stack1g |
#      issue44 | issue44-stack1g; default issue44-stack1g), COMPARATOR_TIMEOUT (s, default 43200), FRESH_TIMEOUT (s,
#      default 21600), SKIP_FRESH (1 = no leanchecker), FRESH_PARALLEL (default 1: the claims' replays run at the same
#      time, each single-threaded, so the wall clock is the longer one, not the sum; 0 = one after the other; the
#      container-peak figure of each is then the container's, both replays included), LEAN_GLIBC_TUNABLES (optional: exported as GLIBC_TUNABLES for
#      every Lean step — lane K's amendment 15, the release README's workaround for exit 139)
set -uo pipefail
: "${AUDIT_SHA:?}"
CLAIMS="${CLAIMS:-anthropic openai}"
NANODA_BUILD="${NANODA_BUILD:-issue44-stack1g}"
COMPARATOR_TIMEOUT="${COMPARATOR_TIMEOUT:-43200}"
FRESH_TIMEOUT="${FRESH_TIMEOUT:-21600}"
SKIP_FRESH="${SKIP_FRESH:-0}"
FRESH_PARALLEL="${FRESH_PARALLEL:-1}"
OAI_REPO=https://github.com/openai/math.git
OAI_PIN=7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a
OAI_TOOLCHAIN=leanprover/lean4:v4.34.1
ANT_REPO=https://github.com/anthropics/formal-math.git
ANT_PIN=16a5ce41304fcdaea4e0be7c132e1c361dc26da5
ANT_TOOLCHAIN=leanprover/lean4:v4.33.1
COMPARATOR_PIN=d03acab154d269c06e60e4de7e4cc85deebff94b   # tag v4.34.0 (lane K's); its toolchain raised to v4.34.1
COMPARATOR_TOOLCHAIN=leanprover/lean4:v4.34.1
LEAN4EXPORT_434=076e8e57707e813375e8f9da8bf989799ace9680  # tag v4.34.0 (comparator v4.34.0's manifest), built with v4.34.1
LEAN4EXPORT_433=15f6055e299ad5b89345e533cc2192f4cc00f659  # tag v4.33.0 (comparator v4.33.0's manifest), built with v4.33.1
LANDRUN_PIN=811cfff51ceaf3d9843708aa6d22e9b84ccac8b4
NANODA_PIN=3a2407216ee84a75f9e1aead6803d0578be06ae7
ISSUE44_SHA256=3939d228619a28d7437bad82c1d41fe1fd4597a7ea55b849840c0f7caa7d0ee5
GO_TGZ=go1.24.13.linux-amd64.tar.gz
GO_SHA256=1fc94b57134d51669c72173ad5d49fd62afb0f1db9bf3f798fd98ee423f8d730
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results
mkdir -p $R /audit/tools /audit/corpus/eth-refutation /audit/corpus/openai-math/nanoda /src /tools/bin
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
# serve the facts from here on, and keep the server out of the OOM killer's reach (lane K's pod went dark under pressure)
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1; echo -1000 > "/proc/$(cat /tmp/http.pid)/oom_score_adj" 2>/dev/null || true
cgmax() { cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo unknown; }
cgcur() { cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || echo 0; }
# the sampler: epoch seconds, container memory (kB) — the facts take each step's peak from its window
( while true; do echo "$(date +%s) $(( $(cgcur) / 1024 ))" >> $R/_mem.tsv; sleep 15; done ) &
status _audit "$AUDIT_SHA"; status _nanodaBuild "$NANODA_BUILD"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"; status _claims "$CLAIMS"
status _machine "$(nproc) vCPU; cgroup memory.max $(cgmax) bytes; host shows $(free -g | awk '/Mem:/{print $2}') GB; $(df -h / | awk 'NR==2{print $4}') free; vm.max_map_count $(cat /proc/sys/vm/max_map_count 2>/dev/null); landlock: $(cat /sys/kernel/security/lsm 2>/dev/null || echo unreadable); kernel $(uname -r)"
status _phase "fetching the lane's files at $AUDIT_SHA"
for f in tools/eth-pod-facts.py corpus/eth-refutation/pins.json corpus/openai-math/nanoda/issue44.patch; do
  curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: could not fetch $f"; sleep infinity; }
done
FACTS="python3 -I /audit/tools/eth-pod-facts.py"

status _phase "building the tools at their pins (nanoda: $NANODA_BUILD)"
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH="$HOME/.elan/bin:/tools/bin:/usr/local/go/bin:$HOME/.cargo/bin:$PATH"
export GIT_TERMINAL_PROMPT=0 COMPARATOR_PIN COMPARATOR_TOOLCHAIN LEAN4EXPORT_434 LEAN4EXPORT_433 OAI_TOOLCHAIN ANT_TOOLCHAIN \
  LANDRUN_PIN NANODA_PIN ISSUE44_SHA256 GO_TGZ GO_SHA256 NANODA_BUILD
# each block runs in its own `bash -e` (set -e is ignored inside a ( ... ) || ... list, so a failed step would go unnoticed)
cat > /tmp/tools.sh <<'BLOCK'
  start=$(date +%s)
  cd /src && git clone -q https://github.com/leanprover/comparator.git && cd comparator && git checkout -q "$COMPARATOR_PIN"
  echo "$COMPARATOR_TOOLCHAIN" > lean-toolchain
  sed -i 's/"rev": "[0-9a-f]\{40\}"/"rev": "'"$LEAN4EXPORT_434"'"/' lake-manifest.json
  lake build lean4export comparator > /results/_tools-comparator.log 2>&1
  cp .lake/build/bin/comparator /tools/bin/
  mkdir -p /tools/v4.34.1 /tools/v4.33.1
  cp .lake/packages/lean4export/.lake/build/bin/lean4export /tools/v4.34.1/lean4export
  test "$(cd .lake/packages/lean4export && git rev-parse HEAD)" = "$LEAN4EXPORT_434"
  # lean4export for the v4.33.1 claim: the v4.33.0 tag built with the claim's toolchain (as lane K raised v4.34.0 to v4.34.1)
  cd /src && git clone -q https://github.com/leanprover/lean4export.git lean4export-433 && cd lean4export-433 && git checkout -q "$LEAN4EXPORT_433"
  echo "lean4export $LEAN4EXPORT_433 ships toolchain $(cat lean-toolchain); built with $ANT_TOOLCHAIN" > /results/_lean4export-433.txt
  echo "$ANT_TOOLCHAIN" > lean-toolchain
  lake build lean4export > /results/_tools-lean4export-433.log 2>&1
  cp .lake/build/bin/lean4export /tools/v4.33.1/lean4export
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
  echo $(( $(date +%s) - start )) > /results/_tools-seconds.txt
BLOCK
bash -euo pipefail /tmp/tools.sh < /dev/null || { status _phase "FAILED: building the tools (see _tools-*.log)"; sleep infinity; }

# retry: anonymous clones from a datacenter address are sometimes refused by GitHub for a while
cat > /tmp/retry.sh <<'BLOCK'
retry() { local log=$1; shift; local t; for t in 1 2 3 4 5 6; do if "$@" >> "$log" 2>&1; then return 0; fi
  echo "attempt $t failed; retrying in $((t * 60)) s" >> "$log"; sleep $((t * 60)); done; return 1; }
# a blobless sparse clone at a pin: $1 url, $2 dir, $3 commit, then the sparse-checkout arguments (a failed attempt
# starts again from nothing)
pinned_clone() { local url=$1 dir=$2 pin=$3; shift 3; rm -rf "$dir"
  git clone -q --filter=blob:none --no-checkout "$url" "$dir" && git -C "$dir" sparse-checkout set "$@" \
    && git -C "$dir" checkout -q "$pin" && test "$(git -C "$dir" rev-parse HEAD)" = "$pin"; }
BLOCK

# ── the claims ──────────────────────────────────────────────────────────────────────────────────────────────────────
dir_of() { case $1 in anthropic) echo /src/ant/eth;; openai) echo /src/oai/lean;; esac; }
tc_of() { case $1 in anthropic) echo "$ANT_TOOLCHAIN";; openai) echo "$OAI_TOOLCHAIN";; esac; }
mod_of() { case $1 in anthropic) echo Solution;; openai) echo OAI.Algorithms.SubexponentialSAT.Main;; esac; }
thms_of() { case $1 in anthropic) echo MainResults.ethIsFalse MainResults.mainTheorem;; openai) echo OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.exact_count_and_sat;; esac; }
cfg_of() { case $1 in anthropic) echo comparator.json;; openai) echo ComparatorChallenges/SubexponentialSAT.json;; esac; }
# one timed step: $1 claim, $2 step, $3 timeout (s), the rest the command, run in the claim's project directory
timed() {
  local c=$1 s=$2 to=$3; shift 3; local out=$R/$c
  date +%s > "$out/$s.start"; echo "$s" >> "$out/order.txt"
  ( cd "$(dir_of "$c")" && ulimit -s unlimited 2>/dev/null; export RUST_MIN_STACK=1073741824
    if [ -n "${LEAN_GLIBC_TUNABLES:-}" ]; then export GLIBC_TUNABLES="$LEAN_GLIBC_TUNABLES"; fi
    /usr/bin/time -v timeout "$to" "$@" > "$out/$s.log" 2> "$out/$s.err" ); echo $? > "$out/$s.exit"
  date +%s > "$out/$s.end"
}
facts() { $FACTS facts "$R/$1" "$1" $R/_mem.tsv > "$R/$1/result.json.tmp" 2> "$R/$1/facts.err" && mv "$R/$1/result.json.tmp" "$R/$1/result.json"; }

prepare() {  # $1 claim
  local c=$1 out=$R/$1
  date +%s > "$out/prepare.start"; echo prepare >> "$out/order.txt"
  cat > /tmp/prepare-$c.sh <<BLOCK
    . /tmp/retry.sh
    cd /src
    case $c in
      anthropic)
        retry $out/prepare.log pinned_clone $ANT_REPO /src/ant $ANT_PIN --no-cone '/eth/**' '/.github/**'
        cd /src/ant
        $FACTS verify anthropic /src/ant /audit/corpus/eth-refutation/pins.json eth .github > $out/verify.json
        cd eth && test "\$(cat lean-toolchain)" = $ANT_TOOLCHAIN
        retry $out/prepare.log lake exe cache get ;;
      openai)
        retry $out/prepare.log pinned_clone $OAI_REPO /src/oai $OAI_PIN lean
        cd /src/oai
        $FACTS verify openai /src/oai /audit/corpus/eth-refutation/pins.json lean > $out/verify.json
        cd lean && test "\$(cat lean-toolchain)" = $OAI_TOOLCHAIN
        # lane K's rule: lake update FIRST (the post_update hook applies OpenAI's dependency patches); every resolved
        # revision must then equal the pinned manifest's, so the update cannot move a pin silently
        retry $out/prepare.log lake update
        python3 -I - <<'EOF' >> $out/prepare.log
import json, sys
want = {d['name']: d['rev'] for d in json.load(open('/audit/corpus/eth-refutation/pins.json'))['claims']['openai']['dependencies']}
got = {p['name']: p['rev'] for p in json.load(open('lake-manifest.json'))['packages']}
moved = sorted(k for k in want if got.get(k) != want[k])
if moved: sys.exit('lake update moved a pinned dependency: ' + ', '.join(moved))
print('all %d dependency revisions equal the pinned manifest' % len(want))
EOF
        retry $out/prepare.log lake exe cache get ;;
    esac
BLOCK
  ( /usr/bin/time -v bash -euo pipefail /tmp/prepare-$c.sh < /dev/null >> "$out/prepare.log" 2> "$out/prepare.err" ); echo $? > "$out/prepare.exit"
  date +%s > "$out/prepare.end"
  test "$(cat "$out/prepare.exit")" = 0
}

kernels() {  # $1 claim: comparator, build, axioms
  local c=$1 out=$R/$1 d; d=$(dir_of "$1")
  local tc; tc=$(tc_of "$c"); local v=${tc##*:}
  {
    echo "claim: $c"; echo "toolchain: $tc"; echo "kernel: $(uname -r)"; echo "landlock: $(cat /sys/kernel/security/lsm 2>/dev/null)"
    echo "lean: $(cd "$d" && lean --version)"; echo "lean prefix: $(cd "$d" && lean --print-prefix)"
    echo "comparator: $COMPARATOR_PIN built with $COMPARATOR_TOOLCHAIN"
    echo "lean4export: /tools/$v/lean4export ($( [ "$v" = v4.33.1 ] && echo "$LEAN4EXPORT_433" || echo "$LEAN4EXPORT_434"))"
    echo "nanoda: $NANODA_PIN, build $(cat /tools/nanoda.build)"
    echo "landrun: $LANDRUN_PIN"
    echo "leanchecker: $(cd "$d" && ls "$(lean --print-prefix)/bin/" | grep -x leanchecker || echo absent)"
    echo "vm.max_map_count: $(cat /proc/sys/vm/max_map_count 2>/dev/null)"; echo "cgroup memory.max: $(cgmax)"
    echo "GLIBC_TUNABLES: ${LEAN_GLIBC_TUNABLES:-unset}"
  } > "$out/env.txt" 2>&1
  # the claim's own config, ONE change: enable_nanoda true
  python3 -I - "$d/$(cfg_of "$c")" "$d/audit-config-eth.json" <<'EOF' > "$out/config.txt" 2>&1
import json, sys
cfg = json.load(open(sys.argv[1])); cfg['enable_nanoda'] = True
json.dump(cfg, open(sys.argv[2], 'w'), indent=1); print(json.dumps(cfg))
EOF
  cp "$d/audit-config-eth.json" "$out/audit-config.json"
  status "$c" "comparator"
  # Comparator runs `lake` inside landrun, which may execute only the toolchain's directory: put the claim's own
  # toolchain binaries first on PATH (not elan's shims), and name the claim's lean4export and our nanoda
  timed "$c" comparator "$COMPARATOR_TIMEOUT" env PATH="$(cd "$d" && lean --print-prefix)/bin:$PATH" \
    COMPARATOR_LANDRUN=/tools/bin/landrun COMPARATOR_LEAN4EXPORT="/tools/$v/lean4export" COMPARATOR_NANODA=/tools/bin/nanoda_bin \
    lake env /tools/bin/comparator audit-config-eth.json
  facts "$c"
  status "$c" "build"
  case $c in
    anthropic) timed "$c" build 21600 lake build ;;
    openai) timed "$c" build 43200 lake build OAI.Algorithms.SubexponentialSAT.Main ComparatorChallenges.SubexponentialSAT ;;
  esac
  facts "$c"
  status "$c" "axioms"
  { echo "import $(mod_of "$c")"; for t in $(thms_of "$c"); do echo "#print axioms $t"; done; } > "$d/AuditAxiomsEth.lean"
  cp "$d/AuditAxiomsEth.lean" "$out/AuditAxioms.lean"
  timed "$c" axioms 7200 lake env lean AuditAxiomsEth.lean
  facts "$c"
}

fresh() {  # $1 claim: leanchecker --fresh on the solution module, with the claim's own toolchain
  local c=$1 out=$R/$1
  echo "lake env leanchecker --fresh $(mod_of "$c")" > "$out/leanchecker.cmd"
  status "$c" "leanchecker"
  timed "$c" leanchecker "$FRESH_TIMEOUT" lake env leanchecker --fresh "$(mod_of "$c")"
  facts "$c"
}

read -r -a LIST <<< "$CLAIMS"
for c in "${LIST[@]}"; do mkdir -p "$R/$c"; status "$c" queued; done
for c in "${LIST[@]}"; do
  status _phase "kernels: $c"; status "$c" "prepare"
  if prepare "$c"; then kernels "$c"; status "$c" "kernels done (comparator exit $(cat "$R/$c/comparator.exit" 2>/dev/null))"
  else facts "$c"; status "$c" "done (prepare failed: see prepare.log)"; fi
done
if [ "$SKIP_FRESH" != 1 ]; then
  todo=(); pids=()
  for c in "${LIST[@]}"; do
    case "$(python3 -c 'import json,sys; print(json.load(open("/results/_status.json"))[sys.argv[1]])' "$c")" in "kernels done"*) todo+=("$c") ;; esac
  done
  status _freshParallel "$FRESH_PARALLEL"
  for c in "${todo[@]}"; do
    if [ "$FRESH_PARALLEL" = 1 ]; then status _phase "leanchecker --fresh: ${todo[*]}"; fresh "$c" & pids+=($!)
    else status _phase "leanchecker --fresh: $c"; fresh "$c"; fi
  done
  # wait for the replays only (a bare `wait` would also wait for the memory sampler, which never ends)
  if [ ${#pids[@]} -gt 0 ]; then wait "${pids[@]}"; fi
fi
for c in "${LIST[@]}"; do
  case "$(python3 -c 'import json,sys; print(json.load(open("/results/_status.json"))[sys.argv[1]])' "$c")" in
    "kernels done"*|leanchecker) status "$c" "done (comparator exit $(cat "$R/$c/comparator.exit" 2>/dev/null), leanchecker exit $(cat "$R/$c/leanchecker.exit" 2>/dev/null || echo skipped))" ;;
  esac
done
status _memoryPeak "cgroup memory.peak $(cat /sys/fs/cgroup/memory.peak 2>/dev/null || cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || echo unreadable) bytes"
status _phase "complete"
date -u +%Y-%m-%dT%H:%M:%SZ > $R/_done
sleep infinity
