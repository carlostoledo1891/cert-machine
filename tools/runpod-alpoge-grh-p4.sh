#!/usr/bin/env bash
# runpod-alpoge-grh-p4.sh — K3 of the decision of Alpöge's Lean release (amendment A12 of
# notes/alpoge-grh-preregistration-2026-11-20.md): con-leche, a third independently written checker, on the build pod.
# Started on the pod at once; it waits until phase 2 is over ("phase 2 done", or phase 2 stopped) AND the bridge is over
# (done, not started, or stopped), so it never competes with KR or the bridge for memory. Then, as root, con-leche is
# built from source at the pinned commit with its own toolchain; as tester, the challenge and control C1's challenge are
# exported with lean4export (phase 2's root-built judge), and con-leche runs four times:
#   K3     the release's export (phase 2's /data/export.ndjson, its sha256 checked against export.sha256), verified mode
#   K3S    --compare: the challenge's export against the release's export (the five theorems are the holes)
#   K3C1   --compare: control C1's challenge (1/2 replaced by 1/3) against the release's export — must be REJECTED
#   K3C5   C5's export (riemannHypothesis re-typed as False, /opt/judges/c5.py) — must be REJECTED
# MIT's record (math.mit.edu/~drew/grh): con-leche checked this closure in 3 min 15 s on 64 workers, 46 GiB peak.
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
: "${AUDIT_SHA:?}"
R=/results U=tester H=/home/tester W=/home/tester/release/lean T=/opt/judges D=/data CLD=/opt/judges4
PIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
until grep -qE "phase 2 done|phase 2 not started|STOPPED: " $R/_phase.log 2>/dev/null; do sleep 300; done
until grep -qE "bridge \(p3\) done|bridge not started|STOPPED \(bridge\)" $R/_phase.log 2>/dev/null; do sleep 300; done
if [ ! -s $D/export.ndjson ] || [ ! -s $R/export.sha256 ]; then log "K3 not started: no export from phase 2"; exit 1; fi
log "K3 (p4) start (audit $AUDIT_SHA)"
step() {  # name, timeout seconds, workdir, command...
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
# the export is the one phase 2 recorded
sha256sum $D/export.ndjson > $R/K3-export.sha256
[ "$(cut -d' ' -f1 $R/K3-export.sha256)" = "$(cut -d' ' -f1 $R/export.sha256)" ] && log "K3: the export matches export.sha256" || { log "STOPPED (K3): the export differs from export.sha256"; exit 1; }
# con-leche, built by root from source at the pin, outside anything the release's build could write
cat > /tmp/k3build.sh <<J
set -uo pipefail
export GIT_TERMINAL_PROMPT=0 HOME=/root PATH=/root/.elan/bin:\$PATH
mkdir -p $CLD && cd $CLD
for t in 1 2 3; do [ -d con-leche/.git ] && break; git clone -q https://github.com/leanprover/con-leche.git con-leche-\$t && mv con-leche-\$t con-leche && break; sleep 20; done
git -C con-leche checkout -q $PIN && echo "con-leche \$(git -C con-leche rev-parse HEAD)"
cd con-leche && echo "toolchain \$(cat lean-toolchain)" && elan toolchain install "\$(cat lean-toolchain)" && lake build 2>&1 | tail -3
ls -l .lake/build/bin/ && sha256sum .lake/build/bin/*
J
bash /tmp/k3build.sh > $R/K3-build.txt 2>&1; echo $? > $R/K3-build.exit
chmod -R a+rX $CLD; chmod -R go-w $CLD
CL=$CLD/con-leche/.lake/build/bin/con-leche
[ -x $CL ] || CL=$(ls $CLD/con-leche/.lake/build/bin/* 2>/dev/null | head -1)
grep -q "^con-leche $PIN" $R/K3-build.txt && [ -n "$CL" ] && [ -x "$CL" ] || { log "STOPPED (K3): con-leche did not build at the pin (K3-build.txt)"; exit 1; }
log "K3: con-leche built at ${PIN:0:8} ($CL)"
# the challenge and control C1's challenge, exported by phase 2's root-built lean4export (both built before B1 / in CTLB)
mkdir -p $D/k3 && chown $U:$U $D/k3
step K3X 7200 $W bash -c "lake env $T/lean4export/.lake/build/bin/lean4export CertMachine.Challenge -- riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive > $D/k3/challenge.ndjson"
step K3X1 7200 $W bash -c "lake env $T/lean4export/.lake/build/bin/lean4export CertMachine.ChallengeC1 -- riemannZeta_eq_zero_re > $D/k3/challenge-c1.ndjson"
sha256sum $D/k3/challenge.ndjson $D/k3/challenge-c1.ndjson > $R/K3-challenges.sha256
[ "$(cat $R/K3X.exit)" = 0 ] && [ "$(cat $R/K3X1.exit)" = 0 ] && [ -s $D/k3/challenge.ndjson ] && [ -s $D/k3/challenge-c1.ndjson ] || { log "STOPPED (K3): the challenge exports failed"; exit 1; }
# C5's export for con-leche (the same re-typing phase 2 gave nanoda)
python3 -I /opt/judges/c5.py < $D/export.ndjson > $D/k3/export-c5.ndjson 2> $R/K3C5-make.txt; echo $? >> $R/K3C5-make.txt
chown -R $U:$U $D/k3
step K3   14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=32 --progress=5% $D/export.ndjson
step K3S  14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=32 --progress=5% --compare -- $D/k3/challenge.ndjson $D/export.ndjson
step K3C1 14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=32 --compare -- $D/k3/challenge-c1.ndjson $D/export.ndjson
step K3C5 14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=32 $D/k3/export-c5.ndjson
log "K3 (p4) done"
