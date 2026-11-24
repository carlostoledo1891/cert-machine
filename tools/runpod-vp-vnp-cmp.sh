#!/usr/bin/env bash
# runpod-vp-vnp-cmp.sh WORKSPACE CONFIG TAG — the control room's replay of one Comparator configuration in one author's
# workspace (rows F3, F4, F5 of corpus/vp-vnp/PREREG.md): build both modules; Comparator at the release's own pins with
# nanoda on and the landrun sandbox; lean4export of the solution's and the challenge's theorems; nanoda (second pin) on
# the solution's export; con-leche --compare. Runs as root on the phase-1 pod; Lean steps as `tester`; /results/TAG.*. MIT
set -uo pipefail
WS=$1 CFG=$2 TAG=$3
R=/results U=tester H=/home/tester CI=$H/ci-tools T=$H/tools E=$H/exports-$TAG
NT=$(nproc); UPATH="$H/.elan/bin:$H/.cargo/bin:$H/go/bin:/usr/lib/go/bin:/usr/local/bin:/usr/bin:/bin"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
step() { local n=$1 to=$2 dir=$3; shift 3; log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end; log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"; }
LEX=$CI/lean4export/.lake/build/bin/lean4export; CMP=$CI/comparator/.lake/build/bin/comparator
NDC=$CI/nanoda/target/release/nanoda_bin; LRN=$CI/bin/landrun; [ "$(cat $R/K1.mode 2>/dev/null)" = passthrough ] && LRN=$H/tools.landrun-pass
ND2=$T/nanoda_lib/target/release/nanoda_bin; CL=$(ls $T/con-leche/.lake/build/bin/con-leche)
LP=$(runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash -c "cd $H/fm/vp-vnp && lean --print-prefix")
mkdir -p $E && chown $U:$U $E; install -o $U -g $U -m 644 $CFG $E/config.json; cp $CFG $R/$TAG.config.json
read CH SO <<< "$(python3 -I -c "import json,sys; d=json.load(open(sys.argv[1])); print(d['challenge_module'], d['solution_module'])" $CFG)"
NAMES=$(python3 -I -c "import json,sys; print(' '.join(json.load(open(sys.argv[1]))['theorem_names']))" $CFG)
for m in $CH $SO; do f=$WS/$(echo $m | tr . /).lean; sha256sum $f >> $R/$TAG.files.sha256; grep -n '^import' $f >> $R/$TAG.imports.txt; done
grep -nE 'sorry|native_decide|implemented_by|@\[extern|^[[:space:]]*axiom[[:space:]]' $WS/$(echo $SO | tr . /).lean > $R/$TAG.grep.txt; log "$TAG grep of the solution: $(wc -l < $R/$TAG.grep.txt) lines"
step ${TAG}B 3600 $WS lake build $CH $SO
step ${TAG}CMP 14400 $WS env PATH="$LP/bin:$UPATH" COMPARATOR_LANDRUN=$LRN COMPARATOR_LEAN4EXPORT=$LEX COMPARATOR_NANODA=$NDC lake env $CMP $E/config.json
grep -q 'Your solution is okay!' $R/${TAG}CMP.out && log "${TAG}CMP-OK" || log "${TAG}CMP-NOT-OK"
step ${TAG}EXP 7200 $WS bash -c "lake env $LEX $SO -- $NAMES > $E/solution.ndjson"
step ${TAG}EXPC 7200 $WS bash -c "lake env $LEX $CH -- $NAMES > $E/challenge.ndjson"
sed "s#\"export_file_path\": \"[^\"]*\"#\"export_file_path\": \"$E/solution.ndjson\"#" $H/exports/nanoda.json > $E/nanoda.json; chown $U:$U $E/nanoda.json
step ${TAG}ND 14400 $E $ND2 $E/nanoda.json
step ${TAG}CL 14400 $E $CL --jobs=$NT --compare -- $E/challenge.ndjson $E/solution.ndjson
sha256sum $E/*.ndjson > $R/$TAG.exports.sha256
log "$TAG DONE: CMP=$(cat $R/${TAG}CMP.exit) ND=$(cat $R/${TAG}ND.exit) CL=$(cat $R/${TAG}CL.exit)"
