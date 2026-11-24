#!/usr/bin/env bash
# runpod-vp-vnp-cr.sh MODE — row CR of corpus/vp-vnp/PREREG.md: a second machine that never ran the release's proofs.
#   setup  the official Lean v4.33.1 release (GitHub's digest enforced); lean4export v4.33.0 (on v4.33.1), nanoda
#          0da9f98f and con-leche 5ea446d5 built from source; a workspace holding only Mathlib 0df444a3 and the
#          release's two statement files (Statement.lean, Challenge.lean; hashes checked against target-SHA256SUMS)
#          plus control C1's challenge; both challenges built and exported HERE
#   check  the first machine's export of the five theorems' closure (uploaded to /data/export.ndjson.zst) must have the
#          recorded sha256; then nanoda on it; con-leche --compare against the challenge exported here (five justified);
#          C1 (exponent 1/3 -> 1/2) must be refused by con-leche --compare; C2 (Solution.mainTheorem re-typed as False,
#          made here from the export) must be refused by nanoda and by con-leche
# Inputs in /opt/vpd: target-SHA256SUMS, Statement.lean, Challenge.lean, C1.lean, c2.py. Results in /results.      MIT
set -uo pipefail
MODE=${1:?setup or check}
R=/results U=clean H=/home/clean T=/opt/judges V=/opt/vpd CW=/home/clean/cw D=/data
CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
EXPORT_SHA=60d25e1af9cede90e4a7ba2b2169b9d8eef2d540397cb5d3cdd6e319821b2bcc
THMS="Solution.mainTheorem Solution.mainTheoremApprox Solution.separation Solution.separationClosure Solution.permanent_over_real"
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R $D && chmod 755 $R
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
step() { local n=$1 to=$2 dir=$3; shift 3; log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end; log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"; }
stop() { log "STOPPED (CR): $*"; exit 1; }
if [ "$MODE" = setup ]; then
  log "CR setup; $(nproc) vCPU; $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes; $(hostname)"
  apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd build-essential procps pkg-config libssl-dev < /dev/null > /dev/null
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  ( cd $V && for f in Statement.lean Challenge.lean; do h=$(grep " \./$f\$" target-SHA256SUMS | cut -c1-64); [ "$(sha256sum $f | cut -c1-64)" = "$h" ] || exit 1; done ) || stop "a statement file differs from its pin"
  log "the two statement files match target-SHA256SUMS"
  mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://github.com/leanprover/lean4/releases/download/v4.33.1/lean-4.33.1-linux.tar.zst
  sha256sum /opt/lean.tar.zst > $R/toolchain.sha256
  grep -q '^890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235 ' $R/toolchain.sha256 || stop "the toolchain archive does not match GitHub's published digest"
  tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
  cat > /tmp/judges.sh <<J
set -uo pipefail
export GIT_TERMINAL_PROMPT=0 HOME=/root
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH=/root/.elan/bin:/root/.cargo/bin:\$PATH
mkdir -p $T && cd $T
rec() { echo "\$1 \$(git -C \$2 rev-parse HEAD) \$(git -C \$2 describe --tags --always 2>/dev/null)"; }
for t in 1 2 3; do [ -d lean4export/.git ] && break; git clone -q https://github.com/leanprover/lean4export.git && break; sleep 20; done
git -C lean4export checkout -q v4.33.0 && rec lean4export lean4export
(cd lean4export && echo 'leanprover/lean4:v4.33.1' > lean-toolchain && lake build 2>&1 | tail -1)
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=/root/.cargo/bin:\$PATH
for t in 1 2 3; do [ -d nanoda_lib/.git ] && break; git clone -q https://github.com/ammkrn/nanoda_lib.git && break; sleep 20; done
git -C nanoda_lib checkout -q 0da9f98feadd3a0a2ef4b3dbcf52a298a6fef929 && rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -1)
for t in 1 2 3; do [ -d con-leche/.git ] && break; git clone -q https://github.com/leanprover/con-leche.git && break; sleep 20; done
git -C con-leche checkout -q $CLPIN && rec con-leche con-leche
(cd con-leche && elan toolchain install "\$(cat lean-toolchain)" && lake build 2>&1 | tail -3)
sha256sum lean4export/.lake/build/bin/lean4export nanoda_lib/target/release/nanoda_bin con-leche/.lake/build/bin/*
J
  bash /tmp/judges.sh > $R/judges.txt 2>&1; log "judges exit $?"; chmod -R a+rX,go-w $T
  grep -q "^con-leche $CLPIN" $R/judges.txt && grep -q '^nanoda 0da9f98f' $R/judges.txt && [ -x $T/lean4export/.lake/build/bin/lean4export ] && [ -x $T/nanoda_lib/target/release/nanoda_bin ] || stop "a judge did not build at its pin (judges.txt)"
  mkdir -p $CW/Challenge && cp $V/Statement.lean $V/Challenge.lean $CW/ && cp $V/C1.lean $CW/Challenge/C1.lean
  echo 'leanprover/lean4:v4.33.1' > $CW/lean-toolchain
  printf 'name = "cw"\n\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "0df444a360eaa60ab8c11dca51a86af692955474"\n\n[[lean_lib]]\nname = "Statement"\n\n[[lean_lib]]\nname = "Challenge"\n' > $CW/lakefile.toml
  sha256sum $CW/*.lean $CW/Challenge/C1.lean $CW/lakefile.toml > $R/workspace.sha256
  chown -R $U:$U $H
  step CRM 7200 $CW bash -c 'for t in 1 2 3; do lake exe cache get && exit 0; sleep 30; done; exit 1'
  [ "$(cat $R/CRM.exit)" = 0 ] || stop "Mathlib cache (CRM)"
  step CRB 7200 $CW lake build Challenge Challenge.C1
  [ "$(cat $R/CRB.exit)" = 0 ] || stop "the challenges did not build (CRB)"
  mkdir -p $D/cr && chown $U:$U $D/cr
  step CRX 7200 $CW bash -c "lake env $T/lean4export/.lake/build/bin/lean4export Challenge -- $THMS > $D/cr/challenge.ndjson"
  step CRX1 7200 $CW bash -c "lake env $T/lean4export/.lake/build/bin/lean4export Challenge.C1 -- Solution.permanent_over_real > $D/cr/challenge-c1.ndjson"
  [ "$(cat $R/CRX.exit)" = 0 ] && [ "$(cat $R/CRX1.exit)" = 0 ] || stop "the challenge exports failed"
  sha256sum $D/cr/challenge.ndjson $D/cr/challenge-c1.ndjson > $R/challenges.sha256
  log "CR setup done"
  exit 0
fi
if [ "$MODE" = check ]; then
  grep -q "CR setup done" $R/_phase.log || stop "setup has not finished"
  [ -s $D/export.ndjson.zst ] || stop "no export uploaded"
  zstd -q -d -f $D/export.ndjson.zst -o $D/export.ndjson && sha256sum $D/export.ndjson > $R/export.sha256
  [ "$(cut -c1-64 $R/export.sha256)" = "$EXPORT_SHA" ] || stop "the export's digest is not the recorded one"
  log "the export arrived and matches the record ($(stat -c %s $D/export.ndjson) bytes)"
  chmod 644 $D/export.ndjson
  python3 -I $V/c2.py < $D/export.ndjson > $D/cr/export-c2.ndjson 2> $R/CRC2-make.txt; echo "exit $?" >> $R/CRC2-make.txt
  chown -R $U:$U $D/cr; NT=$(nproc)
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": %s, "stack_size_bytes": 1073741824,\n "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,\n "nat_extension": true, "string_extension": true, "print_success_message": true}\n' $D/export.ndjson $NT > $D/cr/nanoda.json
  sed "s#$D/export.ndjson#$D/cr/export-c2.ndjson#" $D/cr/nanoda.json > $D/cr/nanoda-c2.json; cp $D/cr/nanoda.json $D/cr/nanoda-c2.json $R/; chown $U:$U $D/cr/*.json
  CL=$(ls $T/con-leche/.lake/build/bin/con-leche)
  step CRK   43200 $D $T/nanoda_lib/target/release/nanoda_bin $D/cr/nanoda.json
  step CRS   14400 $D $CL --jobs=$NT --compare -- $D/cr/challenge.ndjson $D/export.ndjson
  step CRC1  14400 $D $CL --jobs=$NT --compare -- $D/cr/challenge-c1.ndjson $D/export.ndjson
  step CRC2N 43200 $D $T/nanoda_lib/target/release/nanoda_bin $D/cr/nanoda-c2.json
  step CRC2C 14400 $D $CL --jobs=$NT $D/cr/export-c2.ndjson
  o() { cat $R/$1.out $R/$1.err 2>/dev/null; }; ex() { cat $R/$1.exit; }
  rej() { local e; e=$(ex $1); [ "$e" != 0 ] && [ "$e" != 124 ] && [ "$e" != 137 ]; }
  nok() { o $1 | tr -s ' \n' ' ' | grep -qE 'Checked [0-9]+ declarations with no errors|Checked [0-9]+ declarations with no typechecker errors, 1 pretty printer errors: \[ ?"Unable to print axioms",? ?\]'; }
  k=0
  [ "$(ex CRK)" = 0 ] && nok CRK && k=$((k+1)) || log "CR gate: nanoda did not accept"
  [ "$(ex CRS)" = 0 ] && [ "$(o CRS | grep -cE '^con-leche: theorem Solution\.(mainTheorem|mainTheoremApprox|separation|separationClosure|permanent_over_real) justified by the solution')" = 5 ] && k=$((k+1)) || log "CR gate: con-leche --compare did not justify the five theorems"
  rej CRC1 && o CRC1 | grep -q 'permanent_over_real' && ! o CRC1 | grep -qE 'theorem [^ ]+ justified by the solution' && k=$((k+1)) || log "CR gate: C1 was not refused with its diagnostic"
  rej CRC2N && grep -q 'C2: Solution.mainTheorem re-typed as False' $R/CRC2-make.txt && ! nok CRC2N && k=$((k+1)) || log "CR gate: C2 was not refused by nanoda"
  rej CRC2C && o CRC2C | grep -q 'Solution.mainTheorem' && ! o CRC2C | grep -q 'accepted [0-9]* declarations' && k=$((k+1)) || log "CR gate: C2 was not refused by con-leche"
  [ $k = 5 ] && log "CR: all 5 gates held" || log "CR: $k of 5 gates held"
  log "CR done"
fi
