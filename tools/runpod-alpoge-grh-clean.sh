#!/usr/bin/env bash
# runpod-alpoge-grh-clean.sh — CR, the clean machine (amendment A12 of notes/alpoge-grh-preregistration-2026-11-20.md):
# a fresh RunPod CPU pod (>= 128 GB of memory) that NEVER runs the release's code. Only one thing arrives from the build
# pod: the export file of the five theorems' closure, accepted only if its sha256 equals the value already committed in
# the record (EXPORT_SHA). Everything else is made here:
#   setup  the official Lean v4.33.1 release unpacked by root (digest enforced); lean4export v4.33.0 (on v4.33.1),
#          nanoda 0da9f98f and con-leche 5ea446d5 built by root from source; a workspace holding only Mathlib 0df444a3
#          from `lake exe cache get`, cert-machine's challenge and control C1's challenge built there and exported;
#          an ssh key for the pull (its public half goes into the build pod's authorized_keys, from the Mac)
#   check  pull the export FROM the build pod (this pod initiates; the build pod never logs in here), check its digest,
#          then  CRK  nanoda on the export
#                CRS  con-leche --compare: the challenge exported HERE against the export (five theorems justified)
#                CRC1 con-leche --compare: control C1's challenge (1/3) against the export — must be rejected
#                CRC5 C5's export (riemannHypothesis re-typed as False) — must be rejected by nanoda
#                CRC5c the same file — must be rejected by con-leche
#          and the gate line "CR CERTIFIED by its gates" only if every one of them holds.
# Every Lean step runs as the unprivileged user `clean`; results are root-owned in /results.
# usage: AUDIT_SHA=<commit> bash clean.sh setup
#        EXPORT_SHA=<sha256 from certs/alpoge-grh-lean.json> SRC=<host> SRC_PORT=<port> bash clean.sh check
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?setup or check}
R=/results U=clean H=/home/clean CW=/home/clean/cw T=/opt/judges D=/data
THMS="riemannHypothesis riemannZeta_eq_zero_re LFunction_ne_zero_of_half_lt_re LFunction_eq_zero_re LFunction_eq_zero_re_of_isPrimitive"
CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R $D && chmod 755 $R
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
step() {  # name, timeout, workdir, command... (run as clean, outputs written by root)
  local n=$1 to=$2 dir=$3; shift 3
  log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s"
}
stop() { log "STOPPED (CR): $*"; exit 1; }
if [ "$MODE" = setup ]; then
  : "${AUDIT_SHA:?}"
  RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
  log "CR setup; audit $AUDIT_SHA; $(nproc) vCPU; $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes; $(hostname)"
  apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd build-essential procps pkg-config libssl-dev openssh-client < /dev/null > /dev/null
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  # the toolchain, root-owned, the digest GitHub publishes for the asset
  mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://github.com/leanprover/lean4/releases/download/v4.33.1/lean-4.33.1-linux.tar.zst
  sha256sum /opt/lean.tar.zst > $R/toolchain.sha256
  grep -q '^890afd185370f85666025b883914ab4f4b339136f8c96167b69cfb62aecaf235 ' $R/toolchain.sha256 || stop "the toolchain archive does not match GitHub's published digest"
  tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
  # the judges, root-owned, from source at their pins
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
  # cert-machine's files at the audit commit
  mkdir -p /audit && for f in corpus/alpoge-grh/PINS.json instruments/alpoge-grh/Challenge.lean instruments/alpoge-grh/controls/ChallengeC1.lean instruments/alpoge-grh/controls/c5.py; do
    curl -fsSL --retry 5 "$RAW/$f" -o /audit/$(basename $f) || stop "fetch $f"; done
  sha256sum /audit/* > $R/audit-files.sha256
  install -m 755 /audit/c5.py $T/c5.py
  # a workspace holding Mathlib 0df444a3 only, from the official cache; the two challenges built here
  mkdir -p $CW/src/CertMachine && cp /audit/Challenge.lean /audit/ChallengeC1.lean $CW/src/CertMachine/
  echo 'leanprover/lean4:v4.33.1' > $CW/lean-toolchain
  printf 'name = "cw"\n\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "0df444a360eaa60ab8c11dca51a86af692955474"\n\n[[lean_lib]]\nname = "CertMachine"\nsrcDir = "src"\n' > $CW/lakefile.toml
  chown -R $U:$U $H
  step CRM 7200 $CW bash -c 'lake exe cache get'
  [ "$(cat $R/CRM.exit)" = 0 ] || stop "Mathlib cache (CRM)"
  step CRB 7200 $CW bash -c 'lake build CertMachine.Challenge CertMachine.ChallengeC1'
  [ "$(cat $R/CRB.exit)" = 0 ] || stop "the challenges did not build (CRB)"
  (cd $CW/.lake/build && find . -path '*CertMachine/Challenge.*' -type f -exec sha256sum {} \; | sort -k2) > $R/challenge-build.sha256
  mkdir -p $D/cr && chown $U:$U $D/cr
  step CRX 7200 $CW bash -c "lake env $T/lean4export/.lake/build/bin/lean4export CertMachine.Challenge -- $THMS > $D/cr/challenge.ndjson"
  step CRX1 7200 $CW bash -c "lake env $T/lean4export/.lake/build/bin/lean4export CertMachine.ChallengeC1 -- riemannZeta_eq_zero_re > $D/cr/challenge-c1.ndjson"
  [ "$(cat $R/CRX.exit)" = 0 ] && [ "$(cat $R/CRX1.exit)" = 0 ] || stop "the challenge exports failed"
  sha256sum $D/cr/challenge.ndjson $D/cr/challenge-c1.ndjson > $R/challenges.sha256
  mkdir -p /root/.ssh && chmod 700 /root/.ssh && [ -f /root/.ssh/cr_pull ] || ssh-keygen -q -t ed25519 -N '' -C cr-pull -f /root/.ssh/cr_pull
  cp /root/.ssh/cr_pull.pub $R/cr_pull.pub
  log "CR setup done (the pull key is $R/cr_pull.pub)"
  exit 0
fi
if [ "$MODE" = check ]; then
  : "${EXPORT_SHA:?}" "${SRC:?}" "${SRC_PORT:?}"
  grep -q "CR setup done" $R/_phase.log || stop "setup has not finished"
  log "CR check; expecting export sha256 $EXPORT_SHA"
  date +%s > $R/CRP.start
  scp -q -P "$SRC_PORT" -i /root/.ssh/cr_pull -o StrictHostKeyChecking=accept-new -o BatchMode=yes "root@$SRC:/data/export.ndjson" $D/export.ndjson; echo $? > $R/CRP.exit; date +%s > $R/CRP.end
  sha256sum $D/export.ndjson > $R/export.sha256
  [ "$(cut -d' ' -f1 $R/export.sha256)" = "$EXPORT_SHA" ] || stop "the export's digest is not the recorded one"
  log "the export arrived and matches the record ($(stat -c %s $D/export.ndjson) bytes)"
  chmod 644 $D/export.ndjson
  python3 -I $T/c5.py < $D/export.ndjson > $D/cr/export-c5.ndjson 2> $R/CRC5-make.txt; echo "exit $?" >> $R/CRC5-make.txt
  chown -R $U:$U $D/cr
  NT=$(nproc)
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": %s, "stack_size_bytes": 1073741824,\n "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,\n "nat_extension": true, "string_extension": true, "print_success_message": true}\n' $D/export.ndjson $NT > $D/cr/nanoda.json
  sed "s#$D/export.ndjson#$D/cr/export-c5.ndjson#" $D/cr/nanoda.json > $D/cr/nanoda-c5.json; cp $D/cr/nanoda.json $D/cr/nanoda-c5.json $R/; chown $U:$U $D/cr/*.json
  CL=$(ls $T/con-leche/.lake/build/bin/con-leche 2>/dev/null || ls $T/con-leche/.lake/build/bin/* | head -1)
  step CRK   172800 $D $T/nanoda_lib/target/release/nanoda_bin $D/cr/nanoda.json
  step CRS    14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=$NT --progress=5% --compare -- $D/cr/challenge.ndjson $D/export.ndjson
  step CRC1   14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=$NT --compare -- $D/cr/challenge-c1.ndjson $D/export.ndjson
  step CRC5  172800 $D $T/nanoda_lib/target/release/nanoda_bin $D/cr/nanoda-c5.json
  step CRC5c  14400 $D env LEAN_ABORT_ON_PANIC=1 $CL --jobs=$NT $D/cr/export-c5.ndjson
  o() { cat $R/$1.out $R/$1.err 2>/dev/null; }
  ex() { cat $R/$1.exit; }
  rej() { local e; e=$(ex $1); [ "$e" != 0 ] && [ "$e" != 124 ] && [ "$e" != 137 ]; }
  k=0
  # nanoda's acceptance line, either form (amendment A18; the same two patterns as the recorder's nanoda_accepts)
  nok() { o $1 | tr -s ' \n' ' ' | grep -qE 'Checked [0-9]+ declarations with no errors|Checked [0-9]+ declarations with no typechecker errors, 1 pretty printer errors: \[ ?"Unable to print axioms",? ?\]'; }
  [ "$(ex CRK)" = 0 ] && nok CRK && k=$((k+1)) || log "CR gate: CRK did not accept"
  [ "$(ex CRS)" = 0 ] && o CRS | grep -q '5 axioms justified by the solution' && [ "$(o CRS | grep -cE '^con-leche: theorem (riemannHypothesis|riemannZeta_eq_zero_re|LFunction_ne_zero_of_half_lt_re|LFunction_eq_zero_re|LFunction_eq_zero_re_of_isPrimitive) justified by the solution')" = 5 ] && k=$((k+1)) || log "CR gate: CRS did not justify the five theorems"
  rej CRC1 && o CRC1 | grep -qE 'RiemannZetaZerosOnLine|riemannZeta_eq_zero_re' && ! o CRC1 | grep -q 'justified by the solution' && k=$((k+1)) || log "CR gate: CRC1 was not rejected with its diagnostic"
  rej CRC5 && grep -q 'C5: riemannHypothesis re-typed as False' $R/CRC5-make.txt && ! nok CRC5 && k=$((k+1)) || log "CR gate: CRC5 was not rejected by nanoda"
  rej CRC5c && o CRC5c | grep -q riemannHypothesis && ! o CRC5c | grep -q 'accepted [0-9]* declarations' && k=$((k+1)) || log "CR gate: CRC5c was not rejected by con-leche"
  if [ $k = 5 ]; then log "CR CERTIFIED by its gates"; else log "CR: $k of 5 gates held"; fi
  log "CR done"
fi
