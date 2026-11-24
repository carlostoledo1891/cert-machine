#!/usr/bin/env bash
# runpod-vp-vnp-p1.sh — Phase 1 of cert-machine's decision of Anthropic's VP ≠ VNP release (corpus/vp-vnp/PREREG.md):
#   K0   lake build + PrintAxioms + a grep for native_decide / implemented_by / extern / axiom declarations
#   K1   the release's own acceptance bar, ../.github/scripts/comparator-check.sh, at its own pins
#   EXP  lean4export of the five theorems' closure (and of Challenge, and of control C1's challenge)
#   K2   nanoda at a second pin (ammkrn/nanoda_lib 0da9f98f) on that export
#   K3   con-leche 5ea446d5 (plain check of the export; --compare against the challenge)
#   C1   Challenge with the exponent 1/3 -> 1/2: Comparator and con-leche --compare must refuse
#   C2   the export with Solution.mainTheorem re-typed as False: nanoda and con-leche must refuse
#   CEN  census of the closure + T3 (the paper's Table 3 names), instruments/vp-vnp/census/Census.lean
#   KR   leanchecker --fresh Solution (last: the longest)
# Inputs uploaded to /opt/vpd: target-SHA256SUMS, Census.lean, C1.lean, c2.py. Results in /results (root-owned);
# every Lean, cargo and go step runs as the unprivileged user `tester`. Runs as root:  nohup bash p1.sh > /results/p1.log 2>&1 &
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
R=/results U=tester H=/home/tester V=/opt/vpd
FM=$H/fm W=$H/fm/vp-vnp T=$H/tools CI=$H/ci-tools D=$H/exports
REPO_SHA=11b6c7e3c927df2658f513b6b68ea7f8929c62c5
CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
NDPIN=0da9f98feadd3a0a2ef4b3dbcf52a298a6fef929
THMS="Solution.mainTheorem Solution.mainTheoremApprox Solution.separation Solution.separationClosure Solution.permanent_over_real"
NT=$(nproc)
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R; chmod 755 $R
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a $R/_phase.log; }
stop() { log "STOP: $*"; exit 1; }
UPATH="$H/.elan/bin:$H/.cargo/bin:$H/go/bin:/usr/lib/go/bin:/usr/local/bin:/usr/bin:/bin"
step() {  # name, timeout seconds, workdir, command... (as tester; outputs written by root into /results)
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="$UPATH" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s, peak $(grep -m1 'Maximum resident' $R/$n.err | awk '{print $NF}') kB"
}
ex() { cat $R/$1.exit 2>/dev/null; }

log "P1 start on $(hostname), $NT vCPU, $(free -g | awk '/Mem/{print $2}') GB"
apt-get update -qq < /dev/null > /dev/null 2>&1
apt-get install -y -qq git curl jq golang-go build-essential pkg-config libssl-dev time python3 zstd < /dev/null > /dev/null 2>&1 || log "apt partly failed"
id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
mkdir -p $D && chown $U:$U $D

# setup as tester: elan (no default toolchain), rustup, the release at its pinned commit
cat > /tmp/setup.sh <<BLOCK
set -uo pipefail
export PATH=$UPATH
curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null 2>&1
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1
for t in 1 2 3; do [ -d $FM/.git ] && break; git clone -q --filter=blob:none --no-checkout https://github.com/anthropics/formal-math.git $FM && break; sleep 20; done
cd $FM && git sparse-checkout set vp-vnp .github && git checkout -q $REPO_SHA
echo "repo \$(git rev-parse HEAD); vp-vnp last changed \$(git log -1 --format=%H -- vp-vnp)"
BLOCK
chmod 644 /tmp/setup.sh
runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/setup.sh > $R/setup.txt 2>&1
log "setup: $(tail -1 $R/setup.txt)"
(cd $W && sha256sum -c --quiet $V/target-SHA256SUMS > $R/pin-check.txt 2>&1) && log "PIN-OK: all $(wc -l < $V/target-SHA256SUMS) files match target-SHA256SUMS" || stop "the release differs from its pin (pin-check.txt)"
cp $V/target-SHA256SUMS $R/; sha256sum $FM/.github/scripts/comparator-check.sh > $R/ci-script.sha256

# K0
step K0M 3600 $W bash -c 'for t in 1 2 3; do lake exe cache get && exit 0; sleep 30; done; exit 1'
step K0 21600 $W lake build
grep -n "declaration uses 'sorry'" $R/K0.out $R/K0.err 2>/dev/null > $R/K0-sorry.txt
log "K0 sorry warnings: $(wc -l < $R/K0-sorry.txt) lines; outside Challenge.lean: $(grep -vc 'Challenge.lean' $R/K0-sorry.txt)"
step K0A 3600 $W lake env lean scripts/PrintAxioms.lean
(cd $W && grep -rnE 'native_decide|implemented_by|@\[extern|^[[:space:]]*(private[[:space:]]+)?axiom[[:space:]]' --include='*.lean' . | grep -v '^./.lake/' > $R/K0-grep.txt; true)
log "K0 grep (native_decide/implemented_by/extern/axiom): $(wc -l < $R/K0-grep.txt) lines"
log "K0 axioms: $(grep -o "depends on axioms: \[[^]]*\]" $R/K0A.out | sort | uniq -c | tr '\n' ' ')"

# K1: their bar, at their pins
step K1 43200 $W env TOOLS_DIR=$CI LOG_DIR=$D/k1-logs bash ../.github/scripts/comparator-check.sh
if grep -q 'All 1 comparator configuration(s) accepted.' $R/K1.out; then echo strict > $R/K1.mode; log "K1-OK (their script, unmodified)";
elif grep -qiE 'landrun|landlock' $R/K1.out $R/K1.err; then
  log "K1 failed with a sandbox message; K1P: the same script with a pass-through in place of landrun (a deviation)"
  printf '#!/usr/bin/env bash\n# pass-through: landrun cannot sandbox on this container; drop its flags up to --\nwhile [ $# -gt 0 ] && [ "$1" != "--" ]; do shift; done; shift; exec "$@"\n' > $T.landrun-pass; chmod 755 $T.landrun-pass
  sed "s#^export COMPARATOR_LANDRUN=.*#export COMPARATOR_LANDRUN=$T.landrun-pass#" $FM/.github/scripts/comparator-check.sh > /tmp/comparator-check-pass.sh; chmod 644 /tmp/comparator-check-pass.sh
  diff $FM/.github/scripts/comparator-check.sh /tmp/comparator-check-pass.sh > $R/K1P.diff
  step K1P 43200 $W env TOOLS_DIR=$CI LOG_DIR=$D/k1p-logs bash /tmp/comparator-check-pass.sh
  grep -q 'All 1 comparator configuration(s) accepted.' $R/K1P.out && { echo passthrough > $R/K1.mode; log "K1P-OK (landrun pass-through)"; } || log "K1P-NOT-OK"
else log "K1-NOT-OK (see K1.out)"; fi
LEX=$CI/lean4export/.lake/build/bin/lean4export; CMP=$CI/comparator/.lake/build/bin/comparator
NDC=$CI/nanoda/target/release/nanoda_bin; LRN=$CI/bin/landrun; [ "$(cat $R/K1.mode 2>/dev/null)" = passthrough ] && LRN=$T.landrun-pass
sha256sum $LEX $CMP $NDC $CI/bin/landrun > $R/ci-tools.sha256 2>&1

# our judges: nanoda at a second pin, con-leche
cat > /tmp/judges.sh <<BLOCK
set -uo pipefail
export PATH=$UPATH
mkdir -p $T && cd $T
rec() { echo "\$1 \$(git -C \$2 rev-parse HEAD)"; }
for t in 1 2 3; do [ -d nanoda_lib/.git ] && break; git clone -q https://github.com/ammkrn/nanoda_lib.git && break; sleep 20; done
git -C nanoda_lib checkout -q $NDPIN && rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -1)
for t in 1 2 3; do [ -d con-leche/.git ] && break; git clone -q https://github.com/leanprover/con-leche.git && break; sleep 20; done
git -C con-leche checkout -q $CLPIN && rec con-leche con-leche
(cd con-leche && elan toolchain install "\$(cat lean-toolchain)" > /dev/null 2>&1; lake build 2>&1 | tail -2)
BLOCK
chmod 644 /tmp/judges.sh
runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash /tmp/judges.sh > $R/judges.txt 2>&1
ND2=$T/nanoda_lib/target/release/nanoda_bin; CL=$(ls $T/con-leche/.lake/build/bin/con-leche 2>/dev/null || ls $T/con-leche/.lake/build/bin/* 2>/dev/null | head -1)
sha256sum $ND2 $CL >> $R/judges.txt 2>&1
grep -q "^nanoda $NDPIN" $R/judges.txt && grep -q "^con-leche $CLPIN" $R/judges.txt && [ -x "$ND2" ] && [ -x "$CL" ] && log "JUDGES-OK" || log "JUDGES-NOT-OK (judges.txt)"

# C1's challenge module, in the tree on this pod only (recorded)
install -o $U -g $U -m 644 $V/C1.lean $W/Challenge/C1.lean 2>/dev/null || { mkdir -p $W/Challenge && chown $U:$U $W/Challenge && install -o $U -g $U -m 644 $V/C1.lean $W/Challenge/C1.lean; }
sha256sum $W/Challenge/C1.lean > $R/C1-file.sha256
step C1B 3600 $W lake build Challenge.C1

# EXP: the closure, the challenge, C1's challenge
step EXP 21600 $W bash -c "lake env $LEX Solution -- $THMS > $D/export.ndjson"
step EXPC 7200 $W bash -c "lake env $LEX Challenge -- $THMS > $D/challenge.ndjson"
step EXPC1 7200 $W bash -c "lake env $LEX Challenge.C1 -- Solution.permanent_over_real > $D/challenge-c1.ndjson"
sha256sum $D/export.ndjson $D/challenge.ndjson $D/challenge-c1.ndjson > $R/exports.sha256; ls -la $D >> $R/exports.sha256
chown -R root:root $D; chmod 755 $D; chmod 644 $D/*.ndjson
log "exports: $(awk '{print $2": "$1}' $R/exports.sha256 | head -3 | tr '\n' ' ')"

# K2: nanoda at the second pin
cat > $D/nanoda.json <<EOF
{"export_file_path": "$D/export.ndjson", "use_stdin": false, "num_threads": $NT, "stack_size_bytes": 1073741824,
 "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,
 "nat_extension": true, "string_extension": true, "print_success_message": true}
EOF
chmod 644 $D/nanoda.json; cp $D/nanoda.json $R/
step K2 43200 $D $ND2 $D/nanoda.json

# K3: con-leche
step K3 43200 $D $CL --jobs=$NT --progress=10% $D/export.ndjson
step K3C 14400 $D $CL --jobs=$NT --compare -- $D/challenge.ndjson $D/export.ndjson

# C1: Comparator (their pins) and con-leche --compare must refuse
cat > $D/c1.json <<EOF
{"challenge_module": "Challenge.C1", "solution_module": "Solution", "theorem_names": ["Solution.permanent_over_real"],
 "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
EOF
chmod 644 $D/c1.json; cp $D/c1.json $R/
LP=$(runuser -u $U -- env -i HOME=$H PATH="$UPATH" bash -c "cd $W && lean --print-prefix")
step C1CMP 14400 $W env PATH="$LP/bin:$UPATH" COMPARATOR_LANDRUN=$LRN COMPARATOR_LEAN4EXPORT=$LEX COMPARATOR_NANODA=$NDC lake env $CMP $D/c1.json
step C1CL 14400 $D $CL --jobs=$NT --compare -- $D/challenge-c1.ndjson $D/export.ndjson

# C2: Solution.mainTheorem re-typed as False
python3 -I $V/c2.py < $D/export.ndjson > $D/export-c2.ndjson 2> $R/C2-make.txt; chmod 644 $D/export-c2.ndjson
sed "s#\"export_file_path\": \"[^\"]*\"#\"export_file_path\": \"$D/export-c2.ndjson\"#" $D/nanoda.json > $D/nanoda-c2.json; chmod 644 $D/nanoda-c2.json; cp $D/nanoda-c2.json $R/
step C2ND 43200 $D $ND2 $D/nanoda-c2.json
step C2CL 43200 $D $CL --jobs=$NT $D/export-c2.ndjson

# CEN + T3
install -o $U -g $U -m 644 $V/Census.lean $W/Census.lean
step CEN 14400 $W lake env lean Census.lean

# the verdicts of phase 1 so far (KR follows)
ok() { [ "$(ex $1)" = 0 ]; }; rej() { [ -n "$(ex $1)" ] && [ "$(ex $1)" != 0 ]; }
log "SUMMARY K0=$(ex K0) K0A=$(ex K0A) K1=$(cat $R/K1.mode 2>/dev/null || echo fail) K2=$(ex K2) K3=$(ex K3) K3C=$(ex K3C) C1CMP=$(ex C1CMP) C1CL=$(ex C1CL) C2ND=$(ex C2ND) C2CL=$(ex C2CL) CEN=$(ex CEN)"
grep -q 'Your solution is okay!' $R/C1CMP.out && log "C1 NOT REFUSED by Comparator (!)" || log "C1 refused by Comparator (exit $(ex C1CMP))"

# KR last
step KR 172800 $W env PATH="$LP/bin:$UPATH" lake env $LP/bin/leanchecker --fresh Solution
log "P1 DONE (KR exit $(ex KR))"
