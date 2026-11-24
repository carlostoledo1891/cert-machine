#!/usr/bin/env bash
# runpod-vp-vnp-f2.sh — the control room's replay of row F2 (corpus/vp-vnp/PREREG.md) for both blind statements:
#   for X in A B: the sealed blind file and the release's files unchanged; Comparator (the release's own pins, nanoda on,
#   landrun sandbox) with OUR blind statement as the challenge (CertMachine.ChallengeX) and the bridge as the solution;
#   lean4export of both; nanoda (second pin) on the bridge's export; con-leche --compare; leanchecker --fresh on the bridge.
# Runs as root on the phase-1 pod after runpod-vp-vnp-p1.sh's tools exist; inputs in /opt/vpd/f2 (comparator-X.json,
# SEAL-1A.sha256, SEAL-1B.sha256). Every Lean step runs as `tester`; results in /results/F2*.                      MIT
set -uo pipefail
R=/results U=tester H=/home/tester V=/opt/vpd/f2 CI=$H/ci-tools T=$H/tools E=$H/exports-f2
NT=$(nproc)
UPATH="$H/.elan/bin:$H/.cargo/bin:$H/go/bin:/usr/lib/go/bin:/usr/local/bin:/usr/bin:/bin"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
step() { local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"; }
LEX=$CI/lean4export/.lake/build/bin/lean4export; CMP=$CI/comparator/.lake/build/bin/comparator
NDC=$CI/nanoda/target/release/nanoda_bin; LRN=$CI/bin/landrun; [ "$(cat $R/K1.mode 2>/dev/null)" = passthrough ] && LRN=$H/tools.landrun-pass
ND2=$T/nanoda_lib/target/release/nanoda_bin; CL=$(ls $T/con-leche/.lake/build/bin/con-leche)
LP=$(runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash -c "cd $H/fm/vp-vnp && lean --print-prefix")
mkdir -p $E && chown $U:$U $E
for X in A B; do
  W=$H/ws-$X
  log "F2$X start"
  ( cd $W && sha256sum CertMachine/Blind$X.lean Statement.lean Solution.lean Challenge.lean comparator.json lean-toolchain lake-manifest.json ) > $R/F2$X-files.sha256
  grep -q "$(awk '/Blind'$X'.lean/{print $1}' $V/SEAL-1$X.sha256)" $R/F2$X-files.sha256 && log "F2$X blind file = its seal" || log "F2$X BLIND FILE DIFFERS FROM ITS SEAL"
  grep -n '^import' $W/CertMachine/Blind$X.lean $W/CertMachine/Challenge$X.lean $W/CertMachine/Bridge$X.lean > $R/F2$X-imports.txt
  grep -nE 'sorry|native_decide|implemented_by|@\[extern|^[[:space:]]*axiom[[:space:]]' $W/CertMachine/Bridge$X.lean $W/CertMachine/Blind$X.lean > $R/F2$X-grep.txt; log "F2$X grep: $(wc -l < $R/F2$X-grep.txt) lines"
  install -o $U -g $U -m 644 $V/comparator-$X.json $E/comparator-$X.json
  THX=$(python3 -I -c "import json,sys; print(' '.join(json.load(open(sys.argv[1]))['theorem_names']))" $V/comparator-$X.json)
  step F2${X}B 3600 $W lake build CertMachine.Challenge$X CertMachine.Bridge$X
  step F2${X}CMP 14400 $W env PATH="$LP/bin:$UPATH" COMPARATOR_LANDRUN=$LRN COMPARATOR_LEAN4EXPORT=$LEX COMPARATOR_NANODA=$NDC lake env $CMP $E/comparator-$X.json
  grep -q 'Your solution is okay!' $R/F2${X}CMP.out && log "F2${X}CMP-OK" || log "F2${X}CMP-NOT-OK"
  step F2${X}EXP 7200 $W bash -c "lake env $LEX CertMachine.Bridge$X -- $THX > $E/bridge$X.ndjson"
  step F2${X}EXPC 7200 $W bash -c "lake env $LEX CertMachine.Challenge$X -- $THX > $E/challenge$X.ndjson"
  sed "s#\"export_file_path\": \"[^\"]*\"#\"export_file_path\": \"$E/bridge$X.ndjson\"#" $H/exports/nanoda.json > $E/nanoda-$X.json; chown $U:$U $E/nanoda-$X.json
  step F2${X}ND 14400 $E $ND2 $E/nanoda-$X.json
  step F2${X}CL 14400 $E $CL --jobs=$NT --compare -- $E/challenge$X.ndjson $E/bridge$X.ndjson
done
sha256sum $E/*.ndjson > $R/F2-exports.sha256
for X in A B; do W=$H/ws-$X; ( step F2${X}KR 172800 $W env PATH="$LP/bin:$UPATH" lake env $LP/bin/leanchecker --fresh CertMachine.Bridge$X ) & done
wait
log "F2 DONE: A CMP=$(cat $R/F2ACMP.exit) ND=$(cat $R/F2AND.exit) CL=$(cat $R/F2ACL.exit) KR=$(cat $R/F2AKR.exit); B CMP=$(cat $R/F2BCMP.exit) ND=$(cat $R/F2BND.exit) CL=$(cat $R/F2BCL.exit) KR=$(cat $R/F2BKR.exit)"
