#!/usr/bin/env bash
# runpod-grh-lean.sh — the checks of lsernau/grh-lean at 72fead10 (corpus/grh-lean-check/PREREG.md, AMENDMENTS.md) on ONE
# pod, cpu3m 16 vCPU / 128 GB (disk >= 160 GB). Every step writes /results/<step>.{start,end,exit,out,err} (and
# .mem, .memmax); a step that cannot start writes /results/<step>.not-run with the reason.
#
#   setup    apt; users; the official Lean v4.35.0 and v4.36.0 archives by GitHub's published digests (/opt/toolchain,
#            /opt/toolchain-436); elan (root) to build the judges, its toolchains compared byte for byte with the archives;
#            Comparator at tag v4.35.0 (e3dcf308) with the lean4export its manifest pins (v4.35.0, 5a9a355d); nanoda
#            0da9f98f; landrun 573aa723; con-leche 5ea446d5 (the earlier lane's pins); the community's shared build cache
#            host blocked in /etc/hosts; Landlock: the ABI, landrun with Comparator's own flags, a write-denial probe
#   DERISK   the judges on a three-file project at v4.35.0 (a tool check, not a row)
#   I1       the clone at 72fead10: HEAD, tree, a sha256 list of every file, the registered pins, the lakefile guard
#   CHB      both editions: Mathlib's official cache, then cert-machine's challenge (and C3's) built BEFORE any module
#            of the release is compiled on this machine; the compiled challenge made root-owned and hashed
#   B1 B2    `lake build` of each edition from source, its own exit status; sources reconciled with .olean files
#   A1       #print axioms of the five theorems, both editions
#   EXP K1 K2  lean4export of the closure of the five; nanoda on it; con-leche --verified, and --compare against the
#            challenge's export; C3's challenge export against the release's export (must be refused)
#   CTL      C1, C2 (instruments/grh-lean/controls): built after B1; Comparator against the challenge; con-leche on each
#            control's export, --verified and --compare (all must be refused)
#   S1 C3 KR Comparator against our challenge; Comparator against C3's challenge; leanchecker --fresh Main
#   E1       the compact edition's Main through S1's check (after B2)
#   D1       the declarations of each edition outside the closure of the five (instruments/grh-lean/census/Unused.lean)
#   S2       Comparator with the release's own Challenge.lean and comparator.json (nanoda on, as theirs)
#   CHAR     NOT in `all`: amendment A2 ran it on the Lean-bridge pod (runs/char-alt1te1i1gsnpy); here only on request
#   seal     a sha256 list of /results (and a 400-line tail of every file over 5 MB) for the pull; run at the end of `all`
#
# usage (as root on the pod; the script is copied to /root/runpod-grh-lean.sh first):
#   AUDIT_SHA=<cert-machine commit holding instruments/grh-lean> DEADLINE=<unix time> \
#     setsid nohup bash /root/runpod-grh-lean.sh all > /root/grh-lean.out 2>&1 < /dev/null &
#   bash /root/runpod-grh-lean.sh KR      (one step or group; resumable; a second invocation may run beside `all`)
#   watch:  tail /results/_phase.log ;  pgrep -af '[r]unpod-grh-lean'   (the bracket keeps pgrep off its own line)
#
# Resuming: a step with an .exit file is never re-run (unless its name is in RETRY="<step> ...", the control room's
# request: the earlier attempt is moved to /results/attempts/, never deleted). A step with a .start and no .exit was
# interrupted: its files are moved to /results/attempts/ and it runs again. Each step holds a lock, so two invocations
# never run the same step. Memory: S1, C3S, E1, S2 (Comparator, the authors' 64 GB) and KR are the large ones; on 128 GB
# run at most one Comparator step beside KR. CTL_NAMES=all makes C1 and C2 list all five theorems (an S1-sized run each).
# DEADLINE (unix time, set by the control room from the A1 ceiling): no step starts within 10 minutes of it, and a
# running step is stopped at it (exit 124 and /results/<step>.deadline). A file /root/grh-lean.stop stops new starts.
#
# _phase.log is written by log() below and by nothing else; this script never reads it (resumption reads the .exit
# files). Never write into /results by hand.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
export R=/results D=/data U=tester H=/home/tester CM=/opt/cm T=/opt/judges TC=/opt/toolchain TC36=/opt/toolchain-436
export W0=/home/tester/grh-lean
export WR=$W0/grh WC=$W0/grh-compact
export COMMIT=72fead102f663d5c7a407964a13dc0cf9d977207 TREE=5eb1240f03e791edd3fc7aa84a3a7d8dc3997b7f NFILES=1627
export THMS="riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive"
export LEAN_URL=https://github.com/leanprover/lean4/releases/download/v4.35.0/lean-4.35.0-linux.tar.zst
export LEAN_SHA=7289597a44543246c9227b8cae501767e095ce17f6d448b95fc4a8dc97268f6d
export LEAN36_URL=https://github.com/leanprover/lean4/releases/download/v4.36.0/lean-4.36.0-linux.tar.zst
export LEAN36_SHA=2b7ab1ed8b92d2e6abfaf41344823b510064dbc9c0260cac73eb496ab2dea6eb
export CMP_SHA=e3dcf3083fc53d44b27a4431fabf7d43181583f5 L4E_SHA=5a9a355dc6c5fd82b69058d433e2ae2e8dfbf8fe
export NANODA_SHA=0da9f98feadd3a0a2ef4b3dbcf52a298a6fef929 LANDRUN_SHA=573aa723afb16bb1da2dbe24fc00df46cd0ad13b
export CL_SHA=5ea446d5c79d23ef1f954215d094db2162f1ab6f
export CMP=$T/comparator/.lake/build/bin/comparator L4E=$T/comparator/.lake/packages/lean4export/.lake/build/bin/lean4export
export NANODA=$T/nanoda_lib/target/release/nanoda_bin LANDRUN=$T/landrun/landrun CL=$T/con-leche/.lake/build/bin/con-leche
export CACHE_HOST=rh-cache.taucetiproject.org
export NT=$(nproc)
export SELF=$(readlink -f "$0")
mkdir -p $R/attempts && chmod 755 $R

log() { { flock 9; echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $R/_phase.log; } 9> $R/.phase.lock; echo "$*"; }
export -f log

# run NAME TIMEOUT WHO DIR CMD...  (WHO: root, or an unprivileged user; env STDOUT_TO=<file> sends stdout there)
run() {
  local n=$1 to=$2 who=$3 dir=$4; shift 4
  local lk; exec {lk}> $R/.lock.$n
  flock -n $lk || { log "$n is running in another invocation; skipped here"; exec {lk}>&-; return 3; }
  # a finished step is never re-run, unless its name is in RETRY (the control room's request, logged; the earlier
  # attempt is moved to attempts/, never deleted)
  local retry=0; case " ${RETRY:-} " in *" $n "*) retry=1 ;; esac
  if [ -f $R/$n.exit ] && [ $retry = 0 ]; then local e; e=$(cat $R/$n.exit); exec {lk}>&-; return $e; fi
  [ -f $R/$n.exit ] && log "$n: RETRY requested"
  if [ -e $R/$n.start ] || [ -e $R/$n.not-run ] || [ -e $R/$n.exit ]; then
    local k=1; while [ -e $R/attempts/$n.$k ]; do k=$((k+1)); done
    mkdir -p $R/attempts/$n.$k && mv $R/$n.* $R/attempts/$n.$k/ 2>/dev/null
    log "$n: the previous attempt is kept in attempts/$n.$k"
  fi
  if [ -e /root/grh-lean.stop ]; then echo "not started: /root/grh-lean.stop present" > $R/$n.not-run; log "$n not started (stop file)"; exec {lk}>&-; return 125; fi
  local now; now=$(date +%s)
  if [ -n "${DEADLINE:-}" ]; then
    local left=$((DEADLINE - now))
    if [ $left -lt 600 ]; then echo "not started: $left s left before the lane's deadline $DEADLINE" > $R/$n.not-run; log "$n not started (deadline)"; exec {lk}>&-; return 125; fi
    [ $left -lt $to ] && to=$left
  fi
  local out=${STDOUT_TO:-$R/$n.out}
  local oom0; oom0=$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory.events 2>/dev/null)
  # the cgroup's memory (page cache included) sampled every 15 s; the sampler drops the step's lock and ends with this shell
  ( exec {lk}>&-; m=0; while kill -0 $$ 2>/dev/null; do c=$(cat /sys/fs/cgroup/memory.current 2>/dev/null || echo 0); [ "$c" -gt "$m" ] && { m=$c; echo $m > $R/$n.memmax; }; sleep 15; done ) &
  local sp=$!
  echo $now > $R/$n.start; echo "$to" > $R/$n.timeout; log "$n running (timeout $to s)"
  if [ "$who" = root ]; then
    ( cd "$dir" && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout -k 60 "$to" "$@" ) > "$out" 2> $R/$n.err
  else
    runuser -u $who -- env -i HOME=/home/$who PATH="$TC/bin:/usr/local/bin:/usr/bin:/bin" TMPDIR=$D/tmp LANG=C.UTF-8 \
      COMPARATOR_LEAN4EXPORT=$L4E COMPARATOR_LANDRUN=$LANDRUN COMPARATOR_NANODA=$NANODA \
      bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout -k 60 "$0" "$@"' "$to" "$dir" "$@" > "$out" 2> $R/$n.err
  fi
  local e=$?
  echo $e > $R/$n.exit; date +%s > $R/$n.end
  kill $sp 2>/dev/null; wait $sp 2>/dev/null
  local oom1; oom1=$(awk '$1=="oom_kill"{print $2}' /sys/fs/cgroup/memory.events 2>/dev/null)
  echo "oom_kill_before ${oom0:-none} oom_kill_after ${oom1:-none} memory_max $(cat /sys/fs/cgroup/memory.max 2>/dev/null) memory_events $(tr '\n' ' ' < /sys/fs/cgroup/memory.events 2>/dev/null)" > $R/$n.mem
  if [ $e = 124 ] && [ -n "${DEADLINE:-}" ] && [ "$(date +%s)" -ge $((DEADLINE - 5)) ]; then
    echo "stopped at the lane's deadline $DEADLINE after $(( $(cat $R/$n.end) - now )) s (amendment A1 ceiling)" > $R/$n.deadline
  fi
  log "$n exit $e after $(( $(cat $R/$n.end) - now )) s"
  exec {lk}>&-
  return $e
}

# need STEP DEP... : every DEP has exit 0, else STEP gets a not-run file naming the first that has not
need() {
  local n=$1; shift
  [ -f $R/$n.exit ] && return 0
  for d in "$@"; do
    if [ "$(cat $R/$d.exit 2>/dev/null)" != 0 ]; then
      echo "not started: needs $d (exit $(cat $R/$d.exit 2>/dev/null || echo none))" > $R/$n.not-run
      log "$n not started: needs $d"; return 1
    fi
  done
}

# ---------------------------------------------------------------- setup (root)
step_setup() {
  set -uo pipefail
  : "${AUDIT_SHA:?AUDIT_SHA is the cert-machine commit holding instruments/grh-lean}"
  echo "audit commit $AUDIT_SHA"
  echo "host $(hostname); $NT vCPU; memory.max $(cat /sys/fs/cgroup/memory.max 2>/dev/null); disk $(df -h / | awk 'NR==2{print $4" free"}'); kernel $(uname -r)"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd xz-utils build-essential procps \
    golang-go pkg-config libssl-dev iproute2 util-linux < /dev/null > /dev/null || { echo "FAILED apt"; return 1; }
  for u in tester spec; do id $u > /dev/null 2>&1 || useradd -m -s /bin/bash $u; done
  mkdir -p $D $CM/cfg $CM/src && chmod 755 $D $CM && mkdir -p $D/tmp $D/k2 && chown tester:tester $D/tmp && chmod 700 $D/tmp
  chown root:root $D/k2 && chmod 755 $D/k2
  # the community's shared build cache (leanprover-community/riemann-hypothesis, CACHE.md) must be unreachable
  grep -q " $CACHE_HOST\$" /etc/hosts || { echo "0.0.0.0 $CACHE_HOST" >> /etc/hosts; echo ":: $CACHE_HOST" >> /etc/hosts; }
  if curl -sS --max-time 15 -o /dev/null "https://$CACHE_HOST/" 2>/dev/null; then echo "FAILED: $CACHE_HOST is reachable"; return 1; fi
  echo "cache host blocked: $CACHE_HOST unreachable"
  # the official toolchains, by GitHub's published digests
  for v in 35 36; do
    if [ $v = 35 ]; then url=$LEAN_URL sha=$LEAN_SHA dst=$TC; else url=$LEAN36_URL sha=$LEAN36_SHA dst=$TC36; fi
    curl -fsSL --retry 5 -o /opt/lean-4.$v.tar.zst "$url" || { echo "FAILED download $url"; return 1; }
    got=$(sha256sum /opt/lean-4.$v.tar.zst | cut -d' ' -f1); echo "toolchain 4.$v.0 archive $got (expected $sha)"
    [ "$got" = "$sha" ] || { echo "FAILED: the v4.$v.0 archive is not the published one"; return 1; }
    rm -rf $dst && mkdir -p $dst && tar --zstd -xf /opt/lean-4.$v.tar.zst -C $dst --strip-components=1 && chmod -R a+rX,go-w $dst
  done
  $TC/bin/lean --version; $TC36/bin/lean --version
  # cert-machine's instruments at the audit commit
  RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
  for f in instruments/grh-lean/Challenge.lean instruments/grh-lean/controls/ChallengeC3.lean instruments/grh-lean/controls/GrhC1.lean \
      instruments/grh-lean/controls/GrhC2.lean instruments/grh-lean/census/Unused.lean instruments/alpoge-grh/Challenge.lean \
      instruments/alpoge-grh/spec/Spec.lean instruments/alpoge-grh/spec/Textbook.lean instruments/alpoge-grh/spec/TextbookAx.lean \
      corpus/grh-lean-check/PREREG.md corpus/grh-lean-check/AMENDMENTS.md tools/runpod-grh-lean.sh; do
    mkdir -p $CM/src/$(dirname $f) && curl -fsSL --retry 5 "$RAW/$f" -o $CM/src/$f || { echo "FAILED fetch $f"; return 1; }
  done
  (cd $CM/src && find . -type f -exec sha256sum {} \; | sort -k2) | tee $R/audit-files.sha256
  echo "this script: $(sha256sum "$SELF")"
  cmp -s "$SELF" $CM/src/tools/runpod-grh-lean.sh && echo "this script equals tools/runpod-grh-lean.sh at $AUDIT_SHA" || echo "NOTE: this script differs from tools/runpod-grh-lean.sh at $AUDIT_SHA"
  chmod -R a+rX,go-w $CM
  # the judges, built by root outside anything the release's build can write
  cat > /tmp/judges.sh <<'J'
set -uo pipefail
export GIT_TERMINAL_PROMPT=0 HOME=/root
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH=/root/.elan/bin:/root/.cargo/bin:/usr/lib/go/bin:$PATH
mkdir -p $T && cd $T
rec() { echo "JUDGE $1 $(git -C $2 rev-parse HEAD) $(git -C $2 describe --tags --always 2>/dev/null)"; }
clone() { for t in 1 2 3 4 5; do [ -d $2/.git ] && return 0; rm -rf $2; git clone -q $1 $2 && return 0; sleep $((t*20)); done; return 1; }
clone https://github.com/leanprover/comparator.git comparator && git -C comparator checkout -q $CMP_SHA && rec comparator comparator
echo "comparator lean-toolchain $(cat comparator/lean-toolchain)"
(cd comparator && elan toolchain install "$(cat lean-toolchain)" && lake build lean4export comparator 2>&1 | tail -3)
rec lean4export comparator/.lake/packages/lean4export
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=/root/.cargo/bin:$PATH; rustc --version
clone https://github.com/ammkrn/nanoda_lib.git nanoda_lib && git -C nanoda_lib checkout -q $NANODA_SHA && rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -2)
clone https://github.com/Zouuup/landrun.git landrun && git -C landrun checkout -q $LANDRUN_SHA && rec landrun landrun
go version; (cd landrun && go build -o landrun ./cmd/landrun 2>&1 | tail -2)
clone https://github.com/leanprover/con-leche.git con-leche && git -C con-leche checkout -q $CL_SHA && rec con-leche con-leche
echo "con-leche lean-toolchain $(cat con-leche/lean-toolchain)"
(cd con-leche && elan toolchain install "$(cat lean-toolchain)" && lake build 2>&1 | tail -3)
sha256sum $CMP $L4E $NANODA $LANDRUN $CL
J
  bash /tmp/judges.sh 2>&1 | tee $R/judges.txt | grep -E '^JUDGE|^[0-9a-f]{64} '
  chmod -R a+rX,go-w $T
  local ok=1
  grep -q "^JUDGE comparator $CMP_SHA" $R/judges.txt || { echo "FAILED: comparator not at $CMP_SHA"; ok=0; }
  grep -q "^JUDGE lean4export $L4E_SHA" $R/judges.txt || { echo "FAILED: lean4export not at $L4E_SHA"; ok=0; }
  grep -q "^JUDGE nanoda $NANODA_SHA" $R/judges.txt || { echo "FAILED: nanoda not at $NANODA_SHA"; ok=0; }
  grep -q "^JUDGE landrun $LANDRUN_SHA" $R/judges.txt || { echo "FAILED: landrun not at $LANDRUN_SHA"; ok=0; }
  grep -q "^JUDGE con-leche $CL_SHA" $R/judges.txt || { echo "FAILED: con-leche not at $CL_SHA"; ok=0; }
  for b in $CMP $L4E $NANODA $LANDRUN $CL; do [ -x $b ] || { echo "FAILED: $b not built"; ok=0; }; done
  # elan's toolchains against the archives (the checks themselves use only the archives in /opt)
  for p in "$TC leanprover--lean4---v4.35.0" "$TC36 leanprover--lean4---v4.36.0"; do
    set -- $p
    a=$( (cd $1 && find bin lib -type f -exec sha256sum {} \; | sort -k2) | sha256sum | cut -c1-64)
    b=$( (cd /root/.elan/toolchains/$2 2>/dev/null && find bin lib -type f -exec sha256sum {} \; | sort -k2) | sha256sum | cut -c1-64)
    [ "$a" = "$b" ] && echo "elan's $2 equals the published archive ($a)" || echo "NOTE: elan's $2 differs from the published archive ($a vs $b)"
  done
  # Landlock: the ABI the kernel offers (landlock_create_ruleset with LANDLOCK_CREATE_RULESET_VERSION)
  python3 -I -c 'import ctypes; l = ctypes.CDLL(None, use_errno=True); v = l.syscall(444, None, ctypes.c_size_t(0), ctypes.c_uint32(1)); print("landlock ABI", v if v >= 0 else "unavailable (errno %d)" % ctypes.get_errno())'
  echo "systemd-run: $(command -v systemd-run || echo absent); /run/systemd/system: $([ -d /run/systemd/system ] && echo present || echo absent)"
  echo "listening UNIX sockets (pathname and abstract):"; ss -xl 2>/dev/null | sed -n '1,40p'
  [ $ok = 1 ] || return 1
  echo "setup complete"
}
export -f step_setup

# Landlock with Comparator's own landrun flags (Main.lean, buildLandrunArgs): LL1 must run, LL2 (a write outside the
# allowed paths) must be refused by the sandbox and leave no file
sandbox_steps() {
  need LL1 setup && run LL1 300 $U $H $LANDRUN --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true
  if [ ! -f $R/LL2.exit ] && need LL2 setup; then
    rm -f $D/tmp/landrun-probe
    run LL2 300 $U $H $LANDRUN --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/sh -c 'echo probe > /data/tmp/landrun-probe'
    [ -e $D/tmp/landrun-probe ] && echo "probe file WRITTEN" > $R/LL2-probe.txt || echo "probe file absent" > $R/LL2-probe.txt
  fi
  need LL3 setup && run LL3 300 $U $H $LANDRUN --ro / --rw /dev -ldd -add-exec -- /bin/true   # strict mode, recorded only
  return 0
}
gate_sandbox() {  # G-sandbox-<for>: LL1 ran, LL2 was refused and wrote nothing
  [ "$(cat $R/LL1.exit 2>/dev/null)" = 0 ] && [ -f $R/LL2.exit ] && [ "$(cat $R/LL2.exit)" != 0 ] && grep -qx 'probe file absent' $R/LL2-probe.txt 2>/dev/null
}
export -f gate_sandbox

# ---------------------------------------------------------------- DERISK (the judges on a tiny project, as tester)
derisk_steps() {
  cat > $CM/derisk.sh <<'X'
set -uo pipefail
cd $HOME && rm -rf derisk && mkdir derisk && cd derisk
printf 'name = "derisk"\n[[lean_lib]]\nname = "Ch"\n[[lean_lib]]\nname = "So"\n[[lean_lib]]\nname = "Bad"\n' > lakefile.toml
echo 'leanprover/lean4:v4.35.0' > lean-toolchain
echo 'theorem t : 2 + 2 = 4 := sorry' > Ch.lean
echo 'theorem t : 2 + 2 = 4 := by decide' > So.lean
printf 'axiom a : 2 + 2 = 4\ntheorem t : 2 + 2 = 4 := a\n' > Bad.lean
lake build Ch So Bad 2>&1 | tail -2
mk() { printf '{"challenge_module": "Ch", "solution_module": "%s", "theorem_names": ["t"], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "$1" "$2" > cfg-$1.json; }
mk So true; mk Bad false
for s in So Bad; do lake env /opt/judges/comparator/.lake/build/bin/comparator cfg-$s.json 2>&1 | tail -4; echo "DERISK comparator-$s exit ${PIPESTATUS[0]}"; done
lake env $COMPARATOR_LEAN4EXPORT So -- t > e.ndjson; echo "DERISK export exit $? bytes $(wc -c < e.ndjson)"; head -c 220 e.ndjson; echo
lake env $COMPARATOR_LEAN4EXPORT Ch -- t > ch.ndjson; echo "DERISK export-ch exit $?"
python3 -I -c 'import sys; t = open("e.ndjson").read(); assert t.count("\"natVal\":\"4\"") >= 1; open("bad.ndjson", "w").write(t.replace("\"natVal\":\"4\"", "\"natVal\":\"5\"", 1))'; echo "DERISK flip exit $?"
for f in e bad; do
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": 2, "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false, "nat_extension": true, "string_extension": true, "print_success_message": true}\n' "$PWD/$f.ndjson" > n-$f.json
  $COMPARATOR_NANODA n-$f.json 2>&1 | tail -3; echo "DERISK nanoda-$f exit ${PIPESTATUS[0]}"
  /opt/judges/con-leche/.lake/build/bin/con-leche --verified $f.ndjson 2>&1 | tail -2; echo "DERISK conleche-$f exit ${PIPESTATUS[0]}"
done
/opt/judges/con-leche/.lake/build/bin/con-leche --verified --compare -- ch.ndjson e.ndjson 2>&1 | tail -3; echo "DERISK conleche-compare exit ${PIPESTATUS[0]}"
X
  chmod 644 $CM/derisk.sh
  need DERISK setup && run DERISK 1800 $U $H bash $CM/derisk.sh
  return 0
}

# ---------------------------------------------------------------- I1 (root)
step_I1() {
  set -uo pipefail
  rm -rf $W0
  for t in 1 2 3 4 5; do git clone -q https://github.com/lsernau/grh-lean.git $W0 && break; rm -rf $W0; sleep $((t*20)); done
  git -C $W0 checkout -q --detach $COMMIT || { echo "FAILED checkout"; return 1; }
  local ok=1 head tree n
  head=$(git -C $W0 rev-parse HEAD); tree=$(git -C $W0 rev-parse 'HEAD^{tree}'); n=$(git -C $W0 ls-files | wc -l)
  [ "$head" = $COMMIT ] && echo "HEAD $head MATCH" || { ok=0; echo "HEAD $head MISMATCH"; }
  [ "$tree" = $TREE ] && echo "TREE $tree MATCH" || { ok=0; echo "TREE $tree MISMATCH"; }
  [ "$n" = $NFILES ] && echo "FILES $n MATCH" || { ok=0; echo "FILES $n MISMATCH"; }
  [ -z "$(git -C $W0 status --porcelain)" ] && echo "WORKTREE clean" || { ok=0; echo "WORKTREE not clean"; }
  (cd $W0 && git ls-files -z | xargs -0 sha256sum | sort -k2) > $R/I1-files.sha256
  echo "LIST $(sha256sum < $R/I1-files.sha256 | cut -c1-64) $(wc -l < $R/I1-files.sha256) files"
  pin() { local h; h=$(sha256sum "$W0/$1" | cut -d' ' -f1); [ "$h" = "$2" ] && echo "PIN $1 $h MATCH" || { echo "PIN $1 $h MISMATCH (registered $2)"; return 1; }; }
  for e in grh grh-compact; do
    pin $e/src/Statements.lean 79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf || ok=0
    pin $e/Challenge.lean b729a3ccbc3290cf9d9356d8dd8009ad19b5bad10bb50d5a4711ff3d5133b055 || ok=0
    pin $e/comparator.json af227d4d6a09bd1449d297a745a7a28d1ecd22ecf85ec62deb2825bd0f164304 || ok=0
    pin $e/lakefile.toml f36c58efd8ff5e936868990c4ce23598d84dd3c2acf0cd1c64423fcd888c6010 || ok=0
    pin $e/lake-manifest.json 1390a02c1729c30db51ee0b19ea7199a129ed899ac571a48956da719573590ae || ok=0
    pin $e/lean-toolchain ca5f1f601d34c49079e38d7e7041eb0f2a9c227fbc1df0f404820069a052330c || ok=0
  done
  pin grh/src/Main.lean 40da180aea415129d3f2c2f374c6ba4606be91a199871efc84a1d19a67a17c6d || ok=0
  pin grh-compact/src/Main.lean e831c518e29e2f1bc06965cda6fed7a8ea77740915c64fdbb96639126ff1c013 || ok=0
  # the lakefile guard: no cache service, no executable, no lakefile.lean (Lake would prefer it to lakefile.toml)
  if grep -nE '^\s*\[\[?(cache|lean_exe)|artifactEndpoint|revisionEndpoint|defaultService|platformIndependent' $W0/grh/lakefile.toml $W0/grh-compact/lakefile.toml; then
    echo "LAKEFILE GUARD failed"; ok=0; else echo "LAKEFILE GUARD clean"; fi
  if git -C $W0 ls-files | grep -E '(^|/)lakefile\.lean$'; then echo "LAKEFILE.LEAN present"; ok=0; fi
  chown -R $U:$U $W0
  git config --global --add safe.directory $W0   # root reads the tester-owned clone later (git show of pristine files)
  [ $ok = 1 ]
}
export -f step_I1

# ---------------------------------------------------------------- CHB: the challenge, before any release module is compiled
step_chb_install() {  # root: cert-machine's modules into the edition, its libs appended to the lakefile (recorded)
  set -uo pipefail
  local e=$1 W rel; [ $e = grh ] && { W=$WR; rel=grh; } || { W=$WC; rel=grh-compact; }
  git -C $W0 show HEAD:$rel/lakefile.toml > $W/lakefile.toml || return 1   # the pristine file, so a re-run appends once
  cp $W/lakefile.toml $R/lakefile.$e.release.toml
  mkdir -p $W/src/CertMachine $W/src/CertMachineCtl
  cp $CM/src/instruments/grh-lean/Challenge.lean $W/src/CertMachine/Challenge.lean
  [ $e = grh ] && cp $CM/src/instruments/grh-lean/controls/ChallengeC3.lean $W/src/CertMachine/ChallengeC3.lean
  printf '\n# written by cert-machine (tools/runpod-grh-lean.sh, step CHB): the challenge and the controls, not part of the release\n[[lean_lib]]\nname = "CertMachine"\nglobs = ["CertMachine.+"]\n\n[[lean_lib]]\nname = "CertMachineCtl"\nglobs = ["CertMachineCtl.+"]\n' >> $W/lakefile.toml
  cp $W/lakefile.toml $R/lakefile.$e.with-challenge.toml
  chown root:root $W/src/CertMachine $W/src/CertMachine/*.lean $W/src/CertMachineCtl && chmod 755 $W/src/CertMachine $W/src/CertMachineCtl && chmod 644 $W/src/CertMachine/*.lean
  # nothing of the release is compiled yet: no .olean outside cert-machine's in the edition's build folder
  local n; n=$(find $W/.lake/build -name '*.olean' 2>/dev/null | grep -v '/CertMachine' | wc -l)
  echo "release .olean files before any build: $n"; [ "$n" = 0 ]
}
export -f step_chb_install
step_chb_seal() {  # root: the compiled challenge made root-owned, then hashed (lib/lean only: what the judges read, A13 of the earlier lane)
  set -uo pipefail
  local e=$1 W; [ $e = grh ] && W=$WR || W=$WC
  # KEEP_TESTER_OWNED=1 skips the ownership change (if Lake inside Comparator ever needs to write there); the hash gate
  # before every judge run detects a change either way
  if [ "${KEEP_TESTER_OWNED:-0}" != 1 ]; then
    for d in $W/.lake/build/lib/lean/CertMachine $W/.lake/build/ir/CertMachine; do [ -d $d ] && chown -R root:root $d && chmod -R go-w,a+rX $d; done
  fi
  (cd $W/.lake/build/lib/lean && find CertMachine -type f -exec sha256sum {} \; | sort -k2) > $R/challenge-$e.sha256
  cat $R/challenge-$e.sha256
  grep -q ' CertMachine/Challenge\.olean$' $R/challenge-$e.sha256
}
export -f step_chb_seal
chb_steps() {
  for e in grh compact; do
    local W; [ $e = grh ] && W=$WR || W=$WC
    need CHB-$e-install I1 && run CHB-$e-install 600 root / bash -c "step_chb_install $e"
    need CACHE-$e CHB-$e-install && run CACHE-$e 3600 $U $W lake exe cache get
    local mods="CertMachine.Challenge"; [ $e = grh ] && mods="CertMachine.Challenge CertMachine.ChallengeC3"
    need CHB-$e CACHE-$e && run CHB-$e 3600 $U $W lake build $mods
    need CHB-$e-seal CHB-$e && run CHB-$e-seal 600 root / bash -c "step_chb_seal $e"
  done
  return 0
}

# the gate before every judge run: the compiled challenge equals its sealed hashes, the sources equal cert-machine's,
# and the workspace has no .lake/build/bin (lake env would put it first on PATH)
gate_challenge() {  # edition
  local e=$1 W; [ $e = grh ] && W=$WR || W=$WC
  local now; now=$( (cd $W/.lake/build/lib/lean && find CertMachine -type f -exec sha256sum {} \; | sort -k2) )
  echo "$now"
  [ -s $R/challenge-$e.sha256 ] && [ "$now" = "$(cat $R/challenge-$e.sha256)" ] || { echo "the compiled challenge differs from challenge-$e.sha256"; return 1; }
  cmp -s $W/src/CertMachine/Challenge.lean $CM/src/instruments/grh-lean/Challenge.lean || { echo "Challenge.lean differs"; return 1; }
  if [ $e = grh ]; then cmp -s $W/src/CertMachine/ChallengeC3.lean $CM/src/instruments/grh-lean/controls/ChallengeC3.lean || { echo "ChallengeC3.lean differs"; return 1; }; fi
  [ ! -e $W/.lake/build/bin ] || { ls -laR $W/.lake/build/bin; echo ".lake/build/bin present"; return 1; }
  echo "challenge unchanged since CHB-$e-seal; no .lake/build/bin"
}
export -f gate_challenge

# ---------------------------------------------------------------- B1, B2: the builds, from source
build_facts() {  # root, after the build: reconcile sources and .olean files; warnings that matter
  local e=$1 n=$2 W; [ $e = grh ] && W=$WR || W=$WC
  python3 -I - $W > $R/$n-reconcile.txt 2>&1 <<'PY'
import os, sys
W = sys.argv[1]; src = os.path.join(W, 'src'); lib = os.path.join(W, '.lake', 'build', 'lib', 'lean')
mine = ('CertMachine', 'CertMachineCtl')
mods = set()
for d, ds, fs in os.walk(src):
    for f in fs:
        if f.endswith('.lean'):
            rel = os.path.relpath(os.path.join(d, f), src)[:-5]
            if rel.split(os.sep)[0] not in mine: mods.add(rel)
built = set()
for d, ds, fs in os.walk(lib):
    for f in fs:
        if f.endswith('.olean'):
            rel = os.path.relpath(os.path.join(d, f), lib)[:-6]
            if rel.split(os.sep)[0] not in mine: built.add(rel)
print('sources', len(mods), 'oleans', len(built), 'missing', len(mods - built), 'extra', len(built - mods))
for m in sorted(mods - built)[:50]: print('MISSING', m)
for m in sorted(built - mods)[:50]: print('EXTRA', m)
PY
  {
    echo "sorry_warnings $(grep -cE "declaration uses .sorry." $R/$n.out)"
    echo "error_lines $(grep -cE '(^|: )error' $R/$n.out)"
    echo "built_release_modules $(grep -cE '^[^ ]+ \[[0-9]+/[0-9]+\] Built (Lib\.|New\.|Main |Statements )' $R/$n.out)"
    echo "fetch_lines $(grep -ciE 'fetch|download|unpack|ltar' $R/$n.out)"
    echo "build_bin $([ -e $W/.lake/build/bin ] && echo present || echo absent)"
    echo "lake_cache_dirs $(ls -d /home/$U/.cache/lake /home/$U/.lake $W/.lake/cache 2>/dev/null | tr '\n' ' ')"
  } > $R/$n-facts.txt
  cat $R/$n-reconcile.txt $R/$n-facts.txt
}
export -f build_facts
build_steps() {  # B1 (grh) or B2 (compact)
  local n=$1 e=$2 W; [ $e = grh ] && W=$WR || W=$WC
  need $n CHB-grh-seal CHB-compact-seal || return 0
  if [ ! -f $R/$n.exit ]; then
    local pre; pre=$(find $W/.lake/build/lib/lean -name '*.olean' 2>/dev/null | grep -v '/CertMachine' | wc -l)
    echo "release .olean files before $n: $pre" > $R/$n-pre.txt
  fi
  run $n 14400 $U $W lake build
  [ -f $R/$n.exit ] && [ ! -f $R/$n-facts.txt ] && build_facts $e $n > /dev/null
  return 0
}

# ---------------------------------------------------------------- A1, D1 (cert-machine's files, root-owned, read by lean)
a1_files() {
  printf 'import Main\n\n#print axioms riemannHypothesis\n#print axioms riemannZeta_eq_zero_re\n#print axioms LFunction_ne_zero_of_half_lt_re\n#print axioms LFunction_eq_zero_re\n#print axioms LFunction_eq_zero_re_of_isPrimitive\n' > $CM/Axioms.lean
  chmod 644 $CM/Axioms.lean
}
a1_steps() {  # edition
  local e=$1 b W; [ $e = grh ] && { W=$WR; b=B1; } || { W=$WC; b=B2; }
  a1_files
  need A1-$e $b && run A1-$e 3600 $U $W lake env lean $CM/Axioms.lean
  return 0
}
d1_steps() {
  local e=$1 b W; [ $e = grh ] && { W=$WR; b=B1; } || { W=$WC; b=B2; }
  need D1-$e $b && run D1-$e 10800 $U $W lake env lean $CM/src/instruments/grh-lean/census/Unused.lean
  return 0
}

# ---------------------------------------------------------------- EXP, K1, K2 (+ C3's con-leche check)
export_facts() {  # root: digest, the five roots as theorems with a value, the axiom records by name
  sha256sum $D/export.ndjson > $R/export.sha256; stat -c '%s bytes' $D/export.ndjson >> $R/export.sha256
  head -c 400 $D/export.ndjson > $R/export.head
  python3 -I - $D/export.ndjson > $R/export-facts.txt 2>&1 <<'PY'
import json, sys
roots = {'riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re', 'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive'}
names, found, decls, axioms = {0: None}, set(), 0, []
KINDS = ('{"thm"', '{"defn"', '{"axiom"', '{"inductive"', '{"opaque"', '{"quot"')
for line in open(sys.argv[1], encoding='utf-8'):
    if line.startswith('{"in"'):
        o = json.loads(line)
        if 'str' in o: names[o['in']] = (o['str']['pre'], o['str']['str'])
        elif 'num' in o: names[o['in']] = (o['num']['pre'], str(o['num']['i']))
    elif line.startswith(KINDS):
        decls += 1
        o = json.loads(line); k = next(iter(o)); body = o[k]
        if k == 'thm' and isinstance(body.get('name'), int):
            p = names.get(body['name'])
            if p and p[0] == 0 and p[1] in roots and body.get('value') is not None: found.add(p[1])
        if k == 'axiom': axioms.append(body.get('name'))
def full(i):
    parts = []
    while i:
        p = names.get(i)
        if p is None: return '?%s' % i
        parts.append(p[1]); i = p[0]
    return '.'.join(reversed(parts))
print('roots %d/5 found as theorems with a value: %s' % (len(found), sorted(found)))
print('declaration lines', decls)
print('axiom records', len(axioms), sorted(full(a) for a in axioms))
PY
  cat $R/export.sha256 $R/export-facts.txt
}
export -f export_facts
k_steps() {
  need EXP B1 || return 0
  [ -f $R/EXP.exit ] || gate_challenge grh > $R/EXP-gate.txt 2>&1
  STDOUT_TO=$D/export.ndjson run EXP 14400 $U $WR lake env $L4E Main -- $THMS
  [ "$(cat $R/EXP.exit 2>/dev/null)" = 0 ] && chown root:root $D/export.ndjson && chmod 444 $D/export.ndjson
  need EXPF EXP && run EXPF 7200 root / bash -c export_facts
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": %s, "stack_size_bytes": 1073741824,\n "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,\n "nat_extension": true, "string_extension": true, "print_success_message": true}\n' $D/export.ndjson $NT > $CM/cfg/nanoda.json
  cp $CM/cfg/nanoda.json $R/nanoda.json
  need K1 EXP && run K1 14400 $U $D $NANODA $CM/cfg/nanoda.json
  # K2: con-leche, verified mode, then --compare against the challenge's own export (the five as roots)
  need K2V EXP && run K2V 7200 $U $D env LEAN_ABORT_ON_PANIC=1 $CL --verified --jobs=$NT --progress=5% $D/export.ndjson
  need K2X CHB-grh-seal && STDOUT_TO=$D/k2/challenge.ndjson run K2X 3600 $U $WR lake env $L4E CertMachine.Challenge -- $THMS
  need K2C EXP K2X && run K2C 7200 $U $D env LEAN_ABORT_ON_PANIC=1 $CL --verified --jobs=$NT --progress=5% --compare -- $D/k2/challenge.ndjson $D/export.ndjson
  # C3 through K2's check: C3's challenge (1/2 -> 1/3 in DirichletLZerosOnLine) against the release's export
  need C3X CHB-grh-seal && STDOUT_TO=$D/k2/challenge-c3.ndjson run C3X 3600 $U $WR lake env $L4E CertMachine.ChallengeC3 -- $THMS
  need C3K EXP C3X && run C3K 7200 $U $D env LEAN_ABORT_ON_PANIC=1 $CL --verified --jobs=$NT --compare -- $D/k2/challenge-c3.ndjson $D/export.ndjson
  sha256sum $D/k2/*.ndjson > $R/k2-exports.sha256 2>/dev/null
  return 0
}

# ---------------------------------------------------------------- Comparator configurations (root-owned, no definition_names)
cfgs() {
  python3 -I - $CM/cfg "${CTL_NAMES:-planted}" <<'PY'
import json, sys
d, ctl = sys.argv[1], sys.argv[2]
five = ['riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re', 'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive']
ax = ['propext', 'Quot.sound', 'Classical.choice']
def w(name, ch, so, th, nanoda=False):
    json.dump({'challenge_module': ch, 'solution_module': so, 'theorem_names': th, 'permitted_axioms': ax, 'enable_nanoda': nanoda},
              open('%s/%s.json' % (d, name), 'w'), indent=1)
w('s1', 'CertMachine.Challenge', 'Main', five)
w('e1', 'CertMachine.Challenge', 'Main', five)
w('c1', 'CertMachine.Challenge', 'CertMachineCtl.GrhC1', five if ctl == 'all' else ['LFunction_eq_zero_re_of_isPrimitive'])
w('c2', 'CertMachine.Challenge', 'CertMachineCtl.GrhC2', five if ctl == 'all' else ['LFunction_ne_zero_of_half_lt_re'])
w('c3', 'CertMachine.ChallengeC3', 'Main', five)
PY
  chmod 644 $CM/cfg/*.json; cp $CM/cfg/s1.json $CM/cfg/e1.json $CM/cfg/c1.json $CM/cfg/c2.json $CM/cfg/c3.json $R/
}
judge() {  # NAME EDITION CONFIG TIMEOUT DEPS... : the sandbox and challenge gates, then Comparator
  local n=$1 e=$2 c=$3 to=$4; shift 4
  local W; [ $e = grh ] && W=$WR || W=$WC
  need $n "$@" || return 0
  if [ ! -f $R/$n.exit ]; then
    gate_sandbox || { echo "not started: the Landlock sandbox did not hold (LL1, LL2)" > $R/$n.not-run; log "$n not started: no sandbox"; return 0; }
    gate_challenge $e > $R/$n-gate.txt 2>&1 || { echo "not started: the challenge gate failed ($n-gate.txt)" > $R/$n.not-run; log "$n not started: challenge gate"; return 0; }
    cat /proc/net/unix > $R/$n-unix-sockets.txt 2>/dev/null
  fi
  run $n $to $U $W lake env $CMP $c
  return 0
}

# ---------------------------------------------------------------- CTL: C1, C2 (after B1)
step_ctl_install() {
  set -uo pipefail
  cp $CM/src/instruments/grh-lean/controls/GrhC1.lean $CM/src/instruments/grh-lean/controls/GrhC2.lean $WR/src/CertMachineCtl/
  chown root:root $WR/src/CertMachineCtl/*.lean && chmod 644 $WR/src/CertMachineCtl/*.lean
  # the compiled controls go to lib/lean/CertMachineCtl (tester's); lib/lean/CertMachine stays root-owned
  sha256sum $WR/src/CertMachineCtl/*.lean
}
export -f step_ctl_install
ctl_steps() {
  cfgs
  need CTL-install B1 && run CTL-install 600 root / bash -c step_ctl_install
  need CTLB CTL-install && run CTLB 3600 $U $WR lake build CertMachineCtl.GrhC1 CertMachineCtl.GrhC2
  local c th
  for c in C1 C2; do
    [ $c = C1 ] && th=LFunction_eq_zero_re_of_isPrimitive || th=LFunction_ne_zero_of_half_lt_re
    local lc; lc=$(echo $c | tr C c)
    need ${c}X CTLB && STDOUT_TO=$D/k2/$lc.ndjson run ${c}X 3600 $U $WR lake env $L4E CertMachineCtl.Grh$c -- $th
    need ${c}CX CHB-grh-seal && STDOUT_TO=$D/k2/challenge-$lc.ndjson run ${c}CX 3600 $U $WR lake env $L4E CertMachine.Challenge -- $th
    need ${c}K ${c}X && run ${c}K 3600 $U $D env LEAN_ABORT_ON_PANIC=1 $CL --verified --jobs=$NT $D/k2/$lc.ndjson
    need ${c}KC ${c}X ${c}CX && run ${c}KC 3600 $U $D env LEAN_ABORT_ON_PANIC=1 $CL --verified --jobs=$NT --compare -- $D/k2/challenge-$lc.ndjson $D/k2/$lc.ndjson
    judge ${c}S grh $CM/cfg/$lc.json 21600 CTLB LL1
  done
  return 0
}

# ---------------------------------------------------------------- S2: the release's own challenge and configuration
step_s2_install() {
  set -uo pipefail
  local h1 h2 h3
  h1=$(sha256sum $WR/comparator.json | cut -d' ' -f1); h2=$(sha256sum $WR/Challenge.lean | cut -d' ' -f1); h3=$(sha256sum $WR/src/Statements.lean | cut -d' ' -f1)
  echo "comparator.json $h1"; echo "Challenge.lean $h2"; echo "src/Statements.lean $h3"
  [ $h1 = af227d4d6a09bd1449d297a745a7a28d1ecd22ecf85ec62deb2825bd0f164304 ] && [ $h2 = b729a3ccbc3290cf9d9356d8dd8009ad19b5bad10bb50d5a4711ff3d5133b055 ] \
    && [ $h3 = 79ef7ca776e42abe1f46caee13ea09bd19f1e2d0b1620d8d5d200258f33b47bf ] || { echo "a file of the release's judge set differs from its pin"; return 1; }
  cp $WR/comparator.json $CM/cfg/s2.json && chmod 644 $CM/cfg/s2.json && cp $CM/cfg/s2.json $R/s2.json
}
export -f step_s2_install

# ---------------------------------------------------------------- CHAR (optional: amendment A2 ran it elsewhere)
step_char_install() {
  set -uo pipefail
  local C=/home/spec/char; rm -rf $C; mkdir -p $C/src
  for f in Spec Textbook TextbookAx; do cp $CM/src/instruments/alpoge-grh/spec/$f.lean $C/src/; done
  cp $CM/src/instruments/alpoge-grh/Challenge.lean $C/src/Challenge.lean
  echo 'leanprover/lean4:v4.35.0' > $C/lean-toolchain
  printf 'name = "char"\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "56a005855ea17e0b0958f73ec801ae140b0a1679"\n' > $C/lakefile.toml
  for m in Spec Challenge Textbook TextbookAx; do printf '[[lean_lib]]\nname = "%s"\nsrcDir = "src"\n' $m >> $C/lakefile.toml; done
  chown -R spec:spec $C; (cd $C && sha256sum src/*.lean) | tee $R/CHAR-inputs.sha256
}
export -f step_char_install
char_steps() {
  need CHAR-install setup && run CHAR-install 600 root / bash -c step_char_install
  need CHAR-cache CHAR-install && run CHAR-cache 3600 spec /home/spec/char lake exe cache get
  need CHAR-build CHAR-cache && run CHAR-build 3600 spec /home/spec/char lake build Spec Challenge Textbook TextbookAx
  return 0
}

# ---------------------------------------------------------------- seal: what the pull checks
seal() {
  { flock 7
    : > $R/LARGE.txt
    find $R -maxdepth 1 -type f -size +5M ! -name '*.tail' | sort | while read -r f; do
      tail -n 400 "$f" > "$f.tail"; echo "$(basename "$f") $(stat -c %s "$f") $(sha256sum "$f" | cut -c1-64)" >> $R/LARGE.txt
    done
    (cd $R && find . -type f ! -name 'RESULTS.sha256*' ! -name '.*' -exec sha256sum {} \; | sort -k2) > $R/RESULTS.sha256.new && mv $R/RESULTS.sha256.new $R/RESULTS.sha256
  } 7> $R/.seal.lock
  log "seal: $(wc -l < $R/RESULTS.sha256) files listed, $(wc -l < $R/LARGE.txt) large"
}

# ---------------------------------------------------------------- the groups and the order of `all`
group() {
  case $1 in
    setup)  run setup 5400 root / bash -c step_setup; sandbox_steps ;;
    DERISK) derisk_steps ;;
    I1)     need I1 setup && run I1 1800 root / bash -c step_I1 ;;
    CHB)    chb_steps ;;
    B1)     build_steps B1 grh ;;
    B2)     build_steps B2 compact ;;
    A1)     a1_steps grh; a1_steps compact ;;
    A1-grh) a1_steps grh ;;
    A1-compact) a1_steps compact ;;
    EXP|K1|K2) k_steps ;;
    CTL)    ctl_steps ;;
    S1)     cfgs; judge S1 grh $CM/cfg/s1.json 36000 B1 LL1 ;;
    C3)     cfgs; judge C3S grh $CM/cfg/c3.json 21600 B1 LL1 ;;
    KR)     need KR B1 && { [ -f $R/KR.exit ] || gate_challenge grh > $R/KR-gate.txt 2>&1; run KR 36000 $U $WR lake env leanchecker --fresh Main; } ;;
    E1)     cfgs; judge E1 compact $CM/cfg/e1.json 28800 B2 LL1 ;;
    D1)     d1_steps grh; d1_steps compact ;;
    S2)     need S2-install B1 && run S2-install 600 root / bash -c step_s2_install
            judge S2 grh $CM/cfg/s2.json 36000 S2-install LL1 ;;
    CHAR)   char_steps ;;
    seal)   seal ;;
    *)      echo "unknown step or group: $1"; return 2 ;;
  esac
  return 0
}
ALL="setup DERISK I1 CHB B1 A1-grh EXP CTL S1 C3 KR B2 A1-compact E1 D1 S2"
[ $# -ge 1 ] || { sed -n '2,40p' "$SELF"; exit 2; }
log "invoked: $* (pid $$; audit ${AUDIT_SHA:-unset}; deadline ${DEADLINE:-none}; script $(sha256sum "$SELF" | cut -c1-16))"
for g in "$@"; do
  if [ "$g" = all ]; then for a in $ALL; do group $a; done; seal; else group "$g"; fi
done
log "invocation done: $*"
