#!/usr/bin/env bash
# runpod-eth-hawkley.sh — the HEAVY link of Daniel Hawkley's ETH bridge on ONE RunPod CPU pod: his theorem
#   OAI.Bridges.ETH.not_positiveRateETH : ¬ OAI.ParityWL.Complexity.PositiveRateETH
# (lean/OAI/Bridges/ETH/FinalImplication.lean of thinkthoughts/math, a fork of openai/math at our pin 7ef5c0cc), proved
# from OpenAI's original_sat_main — so its build is OpenAI's whole family-378 solution plus his bridge modules, the build
# that killed a hosted runner in October (certs/eth-kernel.json has the pod that did it). There is no Comparator
# challenge for this theorem in his tree, so the replay is: the claimant's build, #print axioms from OUR file, a
# standalone export of the theorem's closure replayed by nanoda (our build: issue44 patch, 1 GiB stack), and, unless
# SKIP_FRESH=1, leanchecker --fresh of the module (the toolchain's own kernel over every constant the module reaches).
#
# The pod holds NO credential. It runs a plain ubuntu:24.04 image whose start command downloads this script from this
# repository at a fixed commit (AUDIT_SHA) and runs it: `apt-get update -qq && apt-get install -y -qq curl
# ca-certificates && curl -fsSL <raw URL>/tools/runpod-eth-hawkley.sh -o /run.sh && bash /run.sh`. It clones his
# tree at HAWK_PIN (blobless, lean/ only), checks every OpenAI file of the clone against corpus/eth-refutation/pins.json
# (expected: exactly lean/lakefile.lean differs, his files are the unpinned extras), records the sha256 of every file of
# his that OpenAI's pins do not cover and the lakefile diff against OpenAI's pinned lakefile (the desk compares them
# with corpus/eth-refutation/hawkley/pins.json; no verdict here), runs `lake update` FIRST (OpenAI's post_update hook;
# lane K's rule) and refuses if any resolved dependency moved from the pinned manifest, then the steps above, each with
# exit code, wall seconds, GNU time's peak RSS and the container's peak from a 15-second cgroup sampler; the facts
# (result.json, logs) are served read-only on port 8000 for tools/import-runpod-eth-hawkley.js.
#
# env: AUDIT_SHA (required); HAWK_PIN (default d6b79b7d1…, his HEAD of 2026-11-02, which holds 81ec97cd2's bridge
#      modules unchanged); BUILD_TIMEOUT (s, default 43200); FRESH_TIMEOUT (s, default 21600); SKIP_FRESH (1 = no
#      leanchecker); NANODA_THREADS (default nproc); LEAN_GLIBC_TUNABLES (exported as GLIBC_TUNABLES for every Lean step
#      when set; the kernel lane's declared value for OpenAI's build was glibc.malloc.mmap_max=0:glibc.malloc.arena_max=1)
set -uo pipefail
# the pod's own API key never reaches the claimant's build (security pass, 2026-11-04)
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
HAWK_REPO=https://github.com/thinkthoughts/math.git
HAWK_PIN="${HAWK_PIN:-d6b79b7d165f9e6bef6e033949e3f14e913efdaa}"
OAI_PIN=7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a
OAI_TOOLCHAIN=leanprover/lean4:v4.34.1
LEAN4EXPORT_434=076e8e57707e813375e8f9da8bf989799ace9680  # tag v4.34.0 (comparator v4.34.0's manifest), built with v4.34.1
NANODA_PIN=3a2407216ee84a75f9e1aead6803d0578be06ae7
NANODA_BUILD=issue44-stack1g
ISSUE44_SHA256=3939d228619a28d7437bad82c1d41fe1fd4597a7ea55b849840c0f7caa7d0ee5
BUILD_TIMEOUT="${BUILD_TIMEOUT:-43200}"; FRESH_TIMEOUT="${FRESH_TIMEOUT:-21600}"; SKIP_FRESH="${SKIP_FRESH:-0}"
MODULE=OAI.Bridges.ETH.FinalImplication
THEOREM=OAI.Bridges.ETH.not_positiveRateETH
UPSTREAM=OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; C=hawkley
mkdir -p $R/$C /audit/tools /audit/corpus/eth-refutation /audit/corpus/openai-math/nanoda /src /tools/bin /tools/v4.34.1
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
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 & echo $! > /tmp/http.pid)
sleep 1; echo -1000 > "/proc/$(cat /tmp/http.pid)/oom_score_adj" 2>/dev/null || true
cgmax() { cat /sys/fs/cgroup/memory.max 2>/dev/null || cat /sys/fs/cgroup/memory/memory.limit_in_bytes 2>/dev/null || echo unknown; }
cgcur() { cat /sys/fs/cgroup/memory.current 2>/dev/null || cat /sys/fs/cgroup/memory/memory.usage_in_bytes 2>/dev/null || echo 0; }
( while true; do echo "$(date +%s) $(( $(cgcur) / 1024 ))" >> $R/_mem.tsv; sleep 15; done ) &
NANODA_THREADS="${NANODA_THREADS:-$(nproc)}"
status _audit "$AUDIT_SHA"; status _claims "$C"; status _pin "$HAWK_PIN"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) vCPU; cgroup memory.max $(cgmax) bytes; host shows $(free -g | awk '/Mem:/{print $2}') GB; $(df -h / | awk 'NR==2{print $4}') free; vm.max_map_count $(cat /proc/sys/vm/max_map_count 2>/dev/null)"
status _phase "fetching the lane's files at $AUDIT_SHA"
for f in tools/eth-pod-facts.py corpus/eth-refutation/pins.json corpus/openai-math/nanoda/issue44.patch; do
  curl -fsSL --retry 5 "$RAW/$f" -o "/audit/$f" || { status _phase "FAILED: could not fetch $f"; sleep infinity; }
done
FACTS="python3 -I /audit/tools/eth-pod-facts.py"

status _phase "building the tools at their pins (lean4export v4.34.0 with v4.34.1; nanoda: $NANODA_BUILD)"
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH="$HOME/.elan/bin:/tools/bin:$HOME/.cargo/bin:$PATH"
export GIT_TERMINAL_PROMPT=0 LEAN4EXPORT_434 OAI_TOOLCHAIN NANODA_PIN ISSUE44_SHA256 NANODA_BUILD
cat > /tmp/tools.sh <<'BLOCK'
  start=$(date +%s)
  cd /src && git clone -q https://github.com/leanprover/lean4export.git && cd lean4export && git checkout -q "$LEAN4EXPORT_434"
  echo "lean4export $LEAN4EXPORT_434 ships toolchain $(cat lean-toolchain); built with $OAI_TOOLCHAIN" > /results/_lean4export.txt
  echo "$OAI_TOOLCHAIN" > lean-toolchain
  lake build lean4export > /results/_tools-lean4export.log 2>&1
  cp .lake/build/bin/lean4export /tools/v4.34.1/lean4export
  cd /src && curl -sSf https://sh.rustup.rs | sh -s -- -y -q --profile minimal > /dev/null
  git clone -q https://github.com/ammkrn/nanoda_lib.git && cd nanoda_lib && git checkout -q "$NANODA_PIN"
  sed -i 's/pub(crate) const STACK_SIZE: usize = 16_777_216;/pub(crate) const STACK_SIZE: usize = 1_073_741_824;/' src/lib.rs
  test "$(git diff --numstat src/lib.rs | awk '{print $1+$2}')" = "2"
  P=/audit/corpus/openai-math/nanoda/issue44.patch
  test "$(sha256sum "$P" | cut -d' ' -f1)" = "$ISSUE44_SHA256"
  git apply "$P"
  test -z "$(git diff --name-only | grep -v -x -e src/lib.rs -e src/tc.rs)"
  git diff > /results/_nanoda.patch
  cargo build --release -q && cp target/release/nanoda_bin /tools/bin/
  echo "$NANODA_BUILD" > /tools/nanoda.build
  echo $(( $(date +%s) - start )) > /results/_tools-seconds.txt
BLOCK
bash -euo pipefail /tmp/tools.sh < /dev/null || { status _phase "FAILED: building the tools (see _tools-*.log)"; sleep infinity; }

cat > /tmp/retry.sh <<'BLOCK'
retry() { local log=$1; shift; local t; for t in 1 2 3 4 5 6; do if "$@" >> "$log" 2>&1; then return 0; fi
  echo "attempt $t failed; retrying in $((t * 60)) s" >> "$log"; sleep $((t * 60)); done; return 1; }
pinned_clone() { local url=$1 dir=$2 pin=$3; shift 3; rm -rf "$dir"
  git clone -q --filter=blob:none --no-checkout "$url" "$dir" && git -C "$dir" sparse-checkout set "$@" \
    && git -C "$dir" checkout -q "$pin" && test "$(git -C "$dir" rev-parse HEAD)" = "$pin"; }
BLOCK

D=/src/hawk/lean; OUT=$R/$C
timed() {  # $1 step, $2 timeout (s), the rest the command, in the project directory
  local s=$1 to=$2; shift 2
  date +%s > "$OUT/$s.start"; echo "$s" >> "$OUT/order.txt"
  ( cd "$D" && ulimit -s unlimited 2>/dev/null; export RUST_MIN_STACK=1073741824
    if [ -n "${LEAN_GLIBC_TUNABLES:-}" ]; then export GLIBC_TUNABLES="$LEAN_GLIBC_TUNABLES"; fi
    /usr/bin/time -v timeout "$to" "$@" > "$OUT/$s.log" 2> "$OUT/$s.err" ); echo $? > "$OUT/$s.exit"
  date +%s > "$OUT/$s.end"
}
facts() { $FACTS facts "$OUT" "$C" $R/_mem.tsv > "$OUT/result.json.tmp" 2> "$OUT/facts.err" && mv "$OUT/result.json.tmp" "$OUT/result.json"; }

# ── prepare: the clone at the pin; OpenAI's files against the pins (lakefile.lean expected to differ); his extras hashed
status _phase "prepare: the clone at $HAWK_PIN, the pins, lake update, the cache"; status $C prepare
date +%s > "$OUT/prepare.start"; echo prepare >> "$OUT/order.txt"
cat > /tmp/prepare.sh <<BLOCK
  . /tmp/retry.sh
  retry $OUT/prepare.log pinned_clone $HAWK_REPO /src/hawk $HAWK_PIN lean
  cd /src/hawk
  git log -1 --format='%H %cI %an %s' > $OUT/head.txt
  $FACTS verify openai /src/hawk /audit/corpus/eth-refutation/pins.json lean > $OUT/verify.json || true
  curl -fsSL --retry 5 https://raw.githubusercontent.com/openai/math/$OAI_PIN/lean/lakefile.lean -o /tmp/lakefile-openai.lean
  python3 -I - <<'EOF' > $OUT/extras.json
import hashlib, json, os
pins = json.load(open('/audit/corpus/eth-refutation/pins.json'))['claims']['openai']
base = open('/tmp/lakefile-openai.lean', 'rb').read()
got = hashlib.sha256(base).hexdigest()
out = {'openai_lakefile_sha256': got, 'openai_lakefile_pinned': pins['files'].get('lean/lakefile.lean'), 'extras': {}, 'modified': {}}
for d, _, names in os.walk('lean'):
    for n in names:
        rel = os.path.join(d, n)
        if '/.lake/' in rel or rel.startswith('lean/.lake'): continue
        h = hashlib.sha256(open(rel, 'rb').read()).hexdigest()
        if rel not in pins['files']: out['extras'][rel] = h
        elif pins['files'][rel] != h: out['modified'][rel] = h
import difflib
his = open('lean/lakefile.lean', 'rb').read()
out['lakefile_diff'] = list(difflib.unified_diff(base.decode('utf-8', 'replace').splitlines(), his.decode('utf-8', 'replace').splitlines(), 'openai/lakefile.lean', 'hawkley/lakefile.lean', lineterm='', n=0))
json.dump(out, open('/dev/stdout', 'w'), indent=1)
EOF
  cd lean && test "\$(cat lean-toolchain)" = $OAI_TOOLCHAIN
  retry $OUT/prepare.log lake update
  python3 -I - <<'EOF' >> $OUT/prepare.log
import json, sys
want = {d['name']: d['rev'] for d in json.load(open('/audit/corpus/eth-refutation/pins.json'))['claims']['openai']['dependencies']}
got = {p['name']: p['rev'] for p in json.load(open('lake-manifest.json'))['packages']}
moved = sorted(k for k in want if got.get(k) != want[k])
if moved: sys.exit('lake update moved a pinned dependency: ' + ', '.join(moved))
print('all %d dependency revisions equal the pinned manifest' % len(want))
EOF
  retry $OUT/prepare.log lake exe cache get
BLOCK
( /usr/bin/time -v bash -euo pipefail /tmp/prepare.sh < /dev/null >> "$OUT/prepare.log" 2> "$OUT/prepare.err" ); echo $? > "$OUT/prepare.exit"
date +%s > "$OUT/prepare.end"
{ echo "claim: $C"; echo "pin: $HAWK_PIN"; echo "toolchain: $OAI_TOOLCHAIN"; echo "kernel: $(uname -r)"
  echo "lean: $(cd "$D" && lean --version)"; echo "lean prefix: $(cd "$D" && lean --print-prefix)"
  echo "lean4export: /tools/v4.34.1/lean4export ($LEAN4EXPORT_434)"; echo "nanoda: $NANODA_PIN, build $(cat /tools/nanoda.build), threads $NANODA_THREADS"
  echo "leanchecker: $(cd "$D" && ls "$(lean --print-prefix)/bin/" | grep -x leanchecker || echo absent)"
  echo "vm.max_map_count: $(cat /proc/sys/vm/max_map_count 2>/dev/null)"; echo "cgroup memory.max: $(cgmax)"
  echo "GLIBC_TUNABLES: ${LEAN_GLIBC_TUNABLES:-unset}"; } > "$OUT/env.txt" 2>&1
facts
if [ "$(cat "$OUT/prepare.exit")" != 0 ]; then status $C "done (prepare failed: see prepare.log)"; status _phase complete; date -u +%FT%TZ > $R/_done; sleep infinity; fi

# ── build: the claimant's module (OpenAI's family-378 closure + his bridge)
status _phase "build: lake build $MODULE"; status $C build
timed build "$BUILD_TIMEOUT" lake build "$MODULE"
facts
if [ "$(cat "$OUT/build.exit")" != 0 ]; then status $C "done (build exit $(cat "$OUT/build.exit"): see build.err)"; status _phase complete; date -u +%FT%TZ > $R/_done; sleep infinity; fi

# ── axioms, from OUR file
status _phase "axioms"; status $C axioms
{ echo "import $MODULE"; echo "#print axioms $THEOREM"; echo "#print axioms $UPSTREAM"; } > "$D/AuditAxiomsEth.lean"
cp "$D/AuditAxiomsEth.lean" "$OUT/AuditAxioms.lean"
timed axioms 7200 lake env lean AuditAxiomsEth.lean
facts

# ── nanoda: the theorem's closure exported by lean4export (Comparator's declaration list) and replayed by our nanoda
status _phase "nanoda: export + replay"; status $C nanoda
timed export 7200 lake env /tools/v4.34.1/lean4export "$MODULE" -- \
  Quot Quot.mk Quot.lift Quot.ind "$THEOREM" propext Quot.sound Classical.choice Nat.add Nat.sub Nat.mul Nat.pow Nat.gcd Nat.div Nat.mod \
  Nat.beq Nat.ble Nat.land Nat.lor Nat.xor Nat.shiftLeft Nat.shiftRight String.ofList Char.ofNat List eagerReduce Nat String String.mk Char optParam autoParam semiOutParam outParam
mv "$OUT/export.log" "$D/solution.export"; sha256sum "$D/solution.export" > "$OUT/export.sha256"; ls -l "$D/solution.export" >> "$OUT/export.sha256"
echo "(the export itself is $D/solution.export on the pod: $(stat -c %s "$D/solution.export") bytes; its sha256 above)" > "$OUT/export.log"
cat > "$D/nanoda-eth.json" <<EOF
{"use_stdin": false, "export_file_path": "$D/solution.export", "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"],
 "unpermitted_axiom_hard_error": true, "num_threads": $NANODA_THREADS, "nat_extension": true, "string_extension": true}
EOF
cp "$D/nanoda-eth.json" "$OUT/nanoda.json"
timed nanoda 21600 /tools/bin/nanoda_bin nanoda-eth.json
facts
# the negative control: the same export with Classical.choice not permitted must be rejected
python3 -I -c "import json,sys; c=json.load(open(sys.argv[1])); c['permitted_axioms']=['propext','Quot.sound']; json.dump(c, open(sys.argv[2],'w'))" "$D/nanoda-eth.json" "$D/nanoda-eth-control.json"
timed nanoda-control 21600 /tools/bin/nanoda_bin nanoda-eth-control.json
facts

# ── leanchecker --fresh: the toolchain's own kernel over everything the module reaches (OpenAI's proof included)
if [ "$SKIP_FRESH" != 1 ]; then
  status _phase "leanchecker --fresh $MODULE"; status $C leanchecker
  echo "lake env leanchecker --fresh $MODULE" > "$OUT/leanchecker.cmd"
  timed leanchecker "$FRESH_TIMEOUT" lake env leanchecker --fresh "$MODULE"
  facts
fi
status $C "done (build exit $(cat "$OUT/build.exit"), axioms exit $(cat "$OUT/axioms.exit"), nanoda exit $(cat "$OUT/nanoda.exit"), control exit $(cat "$OUT/nanoda-control.exit"), leanchecker exit $(cat "$OUT/leanchecker.exit" 2>/dev/null || echo skipped))"
status _memoryPeak "cgroup memory.peak $(cat /sys/fs/cgroup/memory.peak 2>/dev/null || cat /sys/fs/cgroup/memory/memory.max_usage_in_bytes 2>/dev/null || echo unreadable) bytes"
status _phase "complete"
date -u +%Y-%m-%dT%H:%M:%SZ > $R/_done
sleep infinity
