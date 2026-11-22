#!/usr/bin/env bash
# runpod-alpoge-grh-judge.sh — amendment A17 (2026-11-22): S1 and its control C1 on a machine with more memory.
# Comparator v4.33.0 reads the whole export into memory (61.6 GB of text, held as about 120 GB) while lean4export still
# holds its own 67 GB and needs the compiled proof files in the file cache: more than a 256 GB pod has. On the build pod
# the export ran about 500 times slower than normal at that limit. This script runs the same judge with the same
# settings on a larger machine, on a hash-checked copy of the compiled release:
#   pre      the copy's two sha256 lists equal; the challenge this machine built at setup unchanged by the copy; no bin
#   NOBUILD  `lake build --no-build` must succeed: nothing of the release is compiled here
#   S1       Comparator, phase 2's s1.json (no definition_names, nanoda off), sandbox mode recorded
#   C1       the same judge against the challenge with 1/2 replaced by 1/3: it must be rejected
# Before this script: `runpod-alpoge-grh-verifier.sh setup` on this machine, then `runpod-alpoge-grh-verifier-copy.sh`
# from the operator's Mac. Every Lean step runs as the unprivileged user `verifier`; results are root-owned in /results.
# File names match phase 2's, so the recorder reads every run of the judge with one rule.
# usage: bash judge.sh        (start it detached)
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=verifier H=/home/verifier W=/home/tester/release/lean T=/opt/judges
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_judge.log; }
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
log "judge start; $(nproc) vCPU; memory limit $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes"
# pre: the gates the dropped row V had before its checks
[ -s $R/copy-source.sha256 ] && [ -s $R/copy-dest.sha256 ] && cmp -s $R/copy-source.sha256 $R/copy-dest.sha256 || { log "JUDGE-HALT: the copy's sha256 lists are missing or differ"; exit 1; }
log "copy lists equal: $(wc -l < $R/copy-dest.sha256) files, list sha256 $(sha256sum < $R/copy-dest.sha256 | cut -c1-64)"
find $W/.lake/build -path '*CertMachine/Challenge*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.after-copy.sha256
[ -s $R/challenge-build.after-copy.sha256 ] && cmp -s <(grep 'CertMachine/Challenge' $R/challenge-build.sha256) $R/challenge-build.after-copy.sha256 && log "challenge build unchanged by the copy" || { log "JUDGE-HALT: the challenge build changed or is missing after the copy"; exit 1; }
if [ -e $W/.lake/build/bin ]; then ls -laR $W/.lake/build/bin > $R/workspace-bin.txt 2>&1; log "JUDGE-HALT: .lake/build/bin present after the copy"; exit 1; fi
log "release oleans after the copy: $(find $W/.lake/build -name '*.olean' | grep -vc CertMachine)"
(cd /opt/toolchain && find bin lib -type f -exec sha256sum {} \; | sort -k2) > $R/toolchain-official.sha256
sha256sum $T/comparator/.lake/build/bin/comparator $T/lean4export/.lake/build/bin/lean4export $T/landrun/landrun > $R/judges-used.sha256
# the compiled challenge files, as the gate before S1 reads them (amendment A13)
find $W/.lake/build -path '*CertMachine/Challenge.*' -type f -exec sha256sum {} \; | sort -k2 > $R/challenge-build.before-S1.sha256
grep '/lib/lean/CertMachine/Challenge\.' $R/challenge-build.sha256 | sort -k2 > /tmp/ch0
grep '/lib/lean/CertMachine/Challenge\.' $R/challenge-build.before-S1.sha256 | sort -k2 > /tmp/ch1
[ -s /tmp/ch1 ] && cmp -s /tmp/ch0 /tmp/ch1 && log "challenge build unchanged before S1" || log "WARNING: challenge build differs before S1"
# landrun: the same test and the same two modes as phase 2
if runuser -u $U -- $T/landrun/landrun --best-effort --ro / --rw /dev -ldd -add-exec -- /bin/true > $R/landrun-test.txt 2>&1; then
  ln -sf $T/landrun/landrun $T/landrun-use; echo 'sandbox (landrun --best-effort, Landlock ABI v4)' > $R/S1.mode
else
  printf '#!/usr/bin/env bash\n# pass-through: landrun cannot sandbox on this container (see landrun-test.txt); drop landrun flags up to --\nwhile [ $# -gt 0 ] && [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n' > $T/landrun-use; chmod 755 $T/landrun-use; echo nosandbox > $R/S1.mode
fi
chown -h $U:$U $T/landrun-use 2>/dev/null
log "Comparator mode: $(cat $R/S1.mode)"
mkdir -p $W/scratch && chown $U:$U $W/scratch
cfg() {  # file challenge solution theorems(json) — phase 2's own line, no definition_names
  printf '{"challenge_module": "%s", "solution_module": "%s", "theorem_names": %s, "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": %s}\n' "$2" "$3" "$4" "false" > $W/scratch/$1; chown $U:$U $W/scratch/$1; cp $W/scratch/$1 $R/
}
cfg s1.json CertMachine.Challenge Main '["riemannHypothesis", "riemannZeta_eq_zero_re", "LFunction_ne_zero_of_half_lt_re", "LFunction_eq_zero_re", "LFunction_eq_zero_re_of_isPrimitive"]'
cfg c1.json CertMachine.ChallengeC1 Main '["riemannZeta_eq_zero_re"]'
step NOBUILD 21600 $W lake build --no-build
[ "$(cat $R/NOBUILD.exit)" = 0 ] || { log "JUDGE-HALT: Lake would rebuild release modules on this machine (NOBUILD.out)"; exit 1; }
CMP=$T/comparator/.lake/build/bin/comparator
step S1 259200 $W bash -c "lake env $CMP scratch/s1.json"
step C1 86400 $W bash -c "lake env $CMP scratch/c1.json"
log "judge done"
