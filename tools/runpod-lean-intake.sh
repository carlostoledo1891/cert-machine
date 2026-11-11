#!/usr/bin/env bash
# runpod-lean-intake.sh — the Lean intake (tools/lean-intake.js) run on ONE RunPod CPU pod, from pinned specs to the
# run's facts, with no credential on the pod (the day-zero kit of the intake plan, 2026-11-11). The Mac cannot build a
# lab's Lean release; this is the same tool, the same spec, on a rented machine. Same pod pattern as
# tools/runpod-eth-comparator.sh: the pod's start command fetches this file at a pinned commit of the PUBLIC repository,
# everything it produces is served read-only on port 8000, and the desk imports it with tools/import-runpod-intake.js.
#
#   start command   bash -c "curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA/tools/runpod-lean-intake.sh | bash"
#   env             AUDIT_SHA    the cert-machine commit that holds the tool and the specs (required; pushed before the pod)
#                   INTAKE_IDS   one or several spec ids, space separated (required): corpus/lean-intake/<id>/spec.json
#                   INTAKE_STAGES  optional, passed to `run --stages`
#
#   P1 prepare   packages, an unprivileged user, node, rust; the repository at AUDIT_SHA (the tool, the specs)
#   P2 <id>      for each id: `node tools/lean-intake.js run <id>` as that user — pin, toolchain, cache, canonical, the
#                generated checks, the planted statements and defects, the kernels, F2 — under a memory watchdog
#   P3 <id>      the run's facts as <id>.tar.gz with its sha256, and the record the pod derives from them (a convenience:
#                the desk re-derives the record from the imported facts and that is the one committed)
#
# Several ids on ONE canonical repository at ONE commit share one checkout and one build (LEAN_INTAKE_KEEP=1; the work
# directory is named by the canonical commit). A network volume mounted at /cache keeps the toolchains, the Mathlib
# cache downloads, cargo and the two export tools between pods; without one everything is fetched and built here.
# The machine the record names is the container's: the cgroup limits, and the size RunPod declares (RUNPOD_CPU_COUNT,
# RUNPOD_MEM_GB), which are passed through to the tool. The cost is NOT known here: it is written on the desk, after the
# pod is deleted, with `node tools/lean-intake.js cost <id> --usd … --what …`.
set -uo pipefail
DECL_CPUS=${RUNPOD_CPU_COUNT:-} DECL_MEM=${RUNPOD_MEM_GB:-}
# the pod's own API key never reaches a claimant's build
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}" "${INTAKE_IDS:?}"
REPO=https://github.com/carlostoledo1891/cert-machine.git
NODE_VERSION=v22.11.0
R=/results U=tester H=/home/tester A=/home/tester/audit
DAY=$(date -u +%F)
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar xz-utils zstd build-essential procps util-linux < /dev/null > /dev/null
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
fail() { status _phase "FAILED: $1"; sleep infinity; }
status _audit "$AUDIT_SHA"; status _ids "$INTAKE_IDS"; status _day "$DAY"; status _started "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _machine "$(nproc) processors seen; cgroup cpu.max $(cat /sys/fs/cgroup/cpu.max 2>/dev/null); memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null); declared ${DECL_CPUS:-?} vCPU, ${DECL_MEM:-?} GB"

# ---- the cache volume, when one is mounted at /cache ---------------------------------------------------------------
if mountpoint -q /cache 2>/dev/null || [ -d /cache ]; then
  mkdir -p /cache/elan /cache/mathlib /cache/cargo /cache/rustup && chown -R $U:$U /cache
  runuser -u $U -- bash -c "mkdir -p $H/.cache && ln -sfn /cache/elan $H/.elan && ln -sfn /cache/mathlib $H/.cache/mathlib && ln -sfn /cache/cargo $H/.cargo && ln -sfn /cache/rustup $H/.rustup"
  status _cache "/cache: $(du -sh /cache 2>/dev/null | cut -f1) at start"
else
  status _cache "none: everything fetched and built on this pod"
fi

# ---- P1: node, rust, elan, the repository at the pin -----------------------------------------------------------------
status _phase "P1 prepare"
curl -fsSL --retry 5 "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-linux-x64.tar.xz" | tar -xJ -C /usr/local --strip-components=1 || fail "node"
cat > /tmp/P1.sh <<BLOCK
set -euo pipefail
export PATH=\$HOME/.elan/bin:\$HOME/.cargo/bin:/usr/local/bin:/usr/bin:/bin
[ -x \$HOME/.elan/bin/elan ] || curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none
[ -x \$HOME/.cargo/bin/cargo ] || curl -sSfL https://sh.rustup.rs | sh -s -- -y --profile minimal
rm -rf $A && mkdir -p $A && cd $A && git init -q && git remote add origin $REPO
git fetch -q --depth 1 --filter=blob:none origin $AUDIT_SHA
git sparse-checkout set --no-cone /tools/lean-intake.js /tools/check-intake-specs.js /instruments/intake/ $(for i in $INTAKE_IDS; do printf '/corpus/lean-intake/%s/spec.json /corpus/lean-intake/%s/reading.json ' "$i" "$i"; done)
git checkout -q FETCH_HEAD && git rev-parse HEAD
mkdir -p certs
for i in $INTAKE_IDS; do test -f corpus/lean-intake/\$i/spec.json; done
node tools/check-intake-specs.js $(for i in $INTAKE_IDS; do printf 'corpus/lean-intake/%s/spec.json ' "$i"; done)
node --version; cargo --version; elan --version
BLOCK
chmod 644 /tmp/P1.sh
runuser -u $U -- env -i HOME=$H bash /tmp/P1.sh > $R/P1.out 2> $R/P1.err; echo $? > $R/P1.exit
[ "$(cat $R/P1.exit)" = 0 ] || fail "P1 prepare (see P1.err)"
status P1 "exit 0"

# ---- the memory watchdog: one sample a minute; the run's process group is stopped before the kernel's killer acts ----
MAX=$(cat /sys/fs/cgroup/memory.max 2>/dev/null); case "$MAX" in ''|max) MAX=$(( $(awk '/MemTotal/{print $2}' /proc/meminfo) * 1024 ));; esac
( while sleep 60; do
    CUR=$(cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0)
    echo "$(date -u +%H:%M:%S) $(( CUR / 1048576 )) MiB of $(( MAX / 1048576 ))" >> $R/_memory.txt
    if [ "$CUR" -gt $(( MAX / 100 * 93 )) ] && [ -s /tmp/run.pid ]; then
      echo "$(date -u +%H:%M:%S) STOPPED the run at 93% of the memory limit" >> $R/_memory.txt
      pkill -TERM -s "$(cat /tmp/run.pid)" 2>/dev/null; sleep 20; pkill -KILL -s "$(cat /tmp/run.pid)" 2>/dev/null
    fi
  done ) &

# ---- P2, P3: each id ---------------------------------------------------------------------------------------------------
for ID in $INTAKE_IDS; do
  KEY=$(python3 -c "import json,sys; print(json.load(open('$A/corpus/lean-intake/$ID/spec.json'))['canonical']['commit'][:12])")
  status _phase "P2 $ID running"; date +%s > $R/$ID.start
  setsid runuser -u $U -- env -i HOME=$H PATH="$H/.elan/bin:$H/.cargo/bin:/usr/local/bin:/usr/bin:/bin" \
    LEAN_INTAKE_KEEP=1 LEAN_INTAKE_WORK=$H/work/$KEY RUNPOD_CPU_COUNT="$DECL_CPUS" RUNPOD_MEM_GB="$DECL_MEM" \
    bash -c "cd $A && ulimit -s unlimited 2>/dev/null; exec node tools/lean-intake.js run $ID --day $DAY ${INTAKE_STAGES:+--stages $INTAKE_STAGES}" > $R/$ID.out 2> $R/$ID.err &
  echo $! > /tmp/run.pid; wait $!; echo $? > $R/$ID.exit; : > /tmp/run.pid; date +%s > $R/$ID.end
  status "$ID" "run exit $(cat $R/$ID.exit) after $(( $(cat $R/$ID.end) - $(cat $R/$ID.start) )) s"
  F=$A/corpus/lean-intake/$ID/runs
  if [ -d "$F/$DAY" ]; then
    tar -czf $R/$ID.tar.gz -C "$F" "$DAY" && (cd $R && sha256sum $ID.tar.gz > $ID.tar.gz.sha256)
    runuser -u $U -- env -i HOME=$H PATH="/usr/local/bin:/usr/bin:/bin" bash -c "cd $A && node tools/lean-intake.js record $ID" > $R/$ID.record.out 2>&1 \
      && cp $A/certs/lean-intake-$ID.json $R/$ID.record.json
    chmod 644 $R/$ID.* 2>/dev/null
  fi
done
[ -d /cache ] && status _cache_end "/cache: $(du -sh /cache 2>/dev/null | cut -f1) at the end"
status _finished "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status _phase complete
sleep infinity
