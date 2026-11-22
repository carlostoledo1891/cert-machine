#!/usr/bin/env bash
# runpod-alpoge-grh-parallel-s1.sh — amendment A16 (2026-11-22): a second run of S1, the statement judge, on the
# parallel pod, as a backup for the build pod's run, which is at its memory limit. Same Comparator (tag v4.33.0 rebuilt on
# v4.33.1 by root in /opt/judges), same configuration as phase 2's s1.json (no definition_names, nanoda off), same sandbox
# test and the same challenge-unchanged gate (the compiled challenge files, amendment A13), against the challenge this pod
# built before any release artifact arrived. It waits for the parallel pod's export, nanoda and C5 to finish, so that the
# judge has the memory to itself and Lean's replay (KR) is not disturbed. File names match phase 2's, so the recorder
# reads both runs with one rule.
# usage: bash parallel-s1.sh        (start it detached; it waits by itself)
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=verifier H=/home/verifier W=/home/tester/release/lean T=/opt/judges
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_parallel.log; }
step() {  # name, timeout seconds, workdir, command... (run as verifier, outputs written by root)
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    COMPARATOR_LEAN4EXPORT=$T/lean4export/.lake/build/bin/lean4export COMPARATOR_LANDRUN=$T/landrun-use \
    COMPARATOR_NANODA=$T/nanoda_lib/target/release/nanoda_bin \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
grep -q "parallel pre done" $R/_parallel.log 2>/dev/null || { echo "run 'parallel.sh pre' first"; exit 1; }
log "backup S1 waiting for the parallel export chain to end (amendment A16)"
until grep -qE "parallel exp done|PARALLEL-HALT" $R/_parallel.log; do sleep 60; done
# the challenge this pod built at setup must be unchanged (compiled files only, amendment A13)
find $W/.lake/build -path '*CertMachine/Challenge.*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.before-S1.sha256
grep '/lib/lean/CertMachine/Challenge\.' $R/challenge-build.sha256 | sort -k2 > /tmp/ch0
grep '/lib/lean/CertMachine/Challenge\.' $R/challenge-build.before-S1.sha256 | sort -k2 > /tmp/ch1
[ -s /tmp/ch1 ] && cmp -s /tmp/ch0 /tmp/ch1 && log "challenge build unchanged before S1" || log "WARNING: challenge build differs before S1"
if [ -e $W/.lake/build/bin ]; then log "PARALLEL-HALT: .lake/build/bin present before S1"; exit 1; fi
# landrun: the same test and the same two modes as phase 2
if runuser -u $U -- $T/landrun/landrun --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $R/landrun-test.txt 2>&1; then
  ln -sf $T/landrun/landrun $T/landrun-use; echo 'sandbox (landrun --best-effort, Landlock ABI v4)' > $R/S1.mode
else
  printf '#!/usr/bin/env bash\n# pass-through: landrun cannot sandbox on this container (see landrun-test.txt); drop landrun flags up to --\nwhile [ $# -gt 0 ] && [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n' > $T/landrun-use; chmod 755 $T/landrun-use; echo nosandbox > $R/S1.mode
fi
chown -h $U:$U $T/landrun-use 2>/dev/null
log "Comparator mode: $(cat $R/S1.mode)"
mkdir -p $W/scratch && chown $U:$U $W/scratch
printf '{"challenge_module": "%s", "solution_module": "%s", "theorem_names": %s, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "CertMachine.Challenge" "Main" '["riemannHypothesis", "riemannZeta_eq_zero_re", "LFunction_ne_zero_of_half_lt_re", "LFunction_eq_zero_re", "LFunction_eq_zero_re_of_isPrimitive"]' "false" > $W/scratch/s1.json
chown $U:$U $W/scratch/s1.json; cp $W/scratch/s1.json $R/
sha256sum $T/comparator/.lake/build/bin/comparator $T/lean4export/.lake/build/bin/lean4export $T/landrun/landrun > $R/judges-used-S1.sha256
# nothing of the release may be compiled here: --no-build fails instead of building (the dropped row V's own gate)
step NOBUILD 21600 $W lake build --no-build
[ "$(cat $R/NOBUILD.exit)" = 0 ] || { log "PARALLEL-HALT: Lake would rebuild release modules on this pod (NOBUILD.out); the backup S1 does not run"; exit 1; }
step S1 259200 $W bash -c "lake env $T/comparator/.lake/build/bin/comparator scratch/s1.json"
log "parallel s1 done"
