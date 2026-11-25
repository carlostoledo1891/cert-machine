#!/usr/bin/env bash
# runpod-omega-cr.sh MODE — row CR of corpus/omega-nine-fourths/PREREG.md: a second, fresh pod that never ran the
# release's proofs (the solution module is never built, imported or run here).
#   setup  the official Lean v4.34.1 release (GitHub's digest enforced); lean4export 076e8e57 (Comparator v4.34.0's pin,
#          on v4.34.1), nanoda d0a02cc5 and con-leche 5ea446d5 built from source; a workspace holding only Mathlib
#          d13f23b7 (whose own manifest pins the same Batteries/Aesop/Qq/ProofWidgets/Plausible/ImportGraph/
#          LeanSearchClient revisions as the release's) and the challenge file fetched from GitHub at 92b516ef (sha256
#          checked against A1), plus control C1's two challenges made here by the same one-line edits as on P1; every
#          closure file of the challenge re-hashed against the sealed A1 list; the three challenges built and exported HERE
#   check  P1's export of the three theorems' closure (uploaded to /data/export.ndjson.zst) must have the recorded
#          sha256 (/opt/omega/export.sha256); then nanoda on it; con-leche --verified --compare against the challenge
#          exported here (three justified); C1 (9/4 -> 2.24; 1/2 -> 0.49) must be refused by con-leche --compare;
#          C2 (square_exponent re-typed as False, made here from the export) must be refused by nanoda and by con-leche
# Inputs in /opt/omega: A1-target-SHA256SUMS, c2.py, export.sha256 (check). Results in /results (root-owned); every Lean
# step as the unprivileged user `clean`. Start detached:  nohup bash cr.sh setup > /results/cr-setup.log 2>&1 &    MIT
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?setup or check}
R=/results U=clean H=/home/clean T=/opt/judges V=/opt/omega CW=/home/clean/cw D=/data
REPO_SHA=92b516ef8e2abf66c3db7aa31438d3010bc7956f
CHAL_SHA=a56cd2267e261903bb62e18eaa4f4663c81dfea83510f20eb19617a42e640534
LEAN_TGZ_SHA=47bf4bbd78f70c2e9670598ab7124d92b6efb7330ff33e5fbb4030f6fd72e4e4
MATHLIB=d13f23b723b8a846827a245b89c10fc7d3f11612
LEXPIN=076e8e57707e813375e8f9da8bf989799ace9680 NDPIN=d0a02cc5defadd683f62f9d078f41688314fa31f CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
THMS="OAI.LinearAlgebra.SpectralBooks.square_exponent OAI.LinearAlgebra.SpectralBooks.dual_exponent OAI.LinearAlgebra.SpectralBooks.rectangular_exponent"
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R $D && chmod 755 $R
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
step() { local n=$1 to=$2 dir=$3; shift 3; log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s, peak $(grep -m1 'Maximum resident' $R/$n.err | awk '{print $NF}') kB"; }
stop() { log "STOPPED (CR): $*"; exit 1; }
if [ "$MODE" = setup ]; then
  log "CR setup; $(nproc) vCPU; $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes; $(hostname)"
  apt-get update -qq && apt-get install -y -qq git python3 curl ca-certificates time tar zstd build-essential procps pkg-config libssl-dev < /dev/null > /dev/null
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  [ -s $V/A1-target-SHA256SUMS ] || stop "no A1 list uploaded"
  sha256sum $V/A1-target-SHA256SUMS > $R/A1.sha256; log "A1 list $(cut -c1-16 $R/A1.sha256)…"
  # the challenge, straight from GitHub at the pinned commit, checked against PREREG and A1
  curl -fsSL --retry 5 -o /tmp/MatrixExponent.lean https://raw.githubusercontent.com/openai/math/$REPO_SHA/lean/ComparatorChallenges/MatrixExponent.lean
  h=$(sha256sum /tmp/MatrixExponent.lean | cut -c1-64)
  [ "$h" = $CHAL_SHA ] && grep -q "^$h  math/lean/ComparatorChallenges/MatrixExponent.lean$" $V/A1-target-SHA256SUMS || stop "the challenge file differs from its pin"
  log "the challenge file matches PREREG and A1"
  mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://github.com/leanprover/lean4/releases/download/v4.34.1/lean-4.34.1-linux.tar.zst
  sha256sum /opt/lean.tar.zst > $R/toolchain.sha256
  grep -q "^$LEAN_TGZ_SHA " $R/toolchain.sha256 || stop "the toolchain archive does not match GitHub's published digest"
  tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
  cat > /tmp/judges.sh <<J
set -uo pipefail
export GIT_TERMINAL_PROMPT=0 HOME=/root
curl -sSfL https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh | sh -s -- -y --default-toolchain none > /dev/null
export PATH=/root/.elan/bin:/root/.cargo/bin:\$PATH
mkdir -p $T && cd $T
rec() { echo "\$1 \$(git -C \$2 rev-parse HEAD) \$(git -C \$2 describe --tags --always 2>/dev/null)"; }
for t in 1 2 3; do [ -d lean4export/.git ] && break; git clone -q https://github.com/leanprover/lean4export.git && break; sleep 20; done
git -C lean4export checkout -q $LEXPIN && rec lean4export lean4export
(cd lean4export && echo "lean4export toolchain as committed: \$(cat lean-toolchain)" && echo 'leanprover/lean4:v4.34.1' > lean-toolchain && lake build 2>&1 | tail -1)
curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal > /dev/null 2>&1; export PATH=/root/.cargo/bin:\$PATH
for t in 1 2 3; do [ -d nanoda_lib/.git ] && break; git clone -q https://github.com/ammkrn/nanoda_lib.git && break; sleep 20; done
git -C nanoda_lib checkout -q $NDPIN && rec nanoda nanoda_lib
(cd nanoda_lib && cargo build --release 2>&1 | tail -1)
for t in 1 2 3; do [ -d con-leche/.git ] && break; git clone -q https://github.com/leanprover/con-leche.git && break; sleep 20; done
git -C con-leche checkout -q $CLPIN && rec con-leche con-leche
(cd con-leche && elan toolchain install "\$(cat lean-toolchain)" && lake build 2>&1 | tail -3)
sha256sum lean4export/.lake/build/bin/lean4export nanoda_lib/target/release/nanoda_bin con-leche/.lake/build/bin/con-leche
J
  bash /tmp/judges.sh > $R/judges.txt 2>&1; log "judges exit $?"; chmod -R a+rX,go-w $T
  grep -q "^con-leche $CLPIN" $R/judges.txt && grep -q "^nanoda $NDPIN" $R/judges.txt && grep -q "^lean4export $LEXPIN" $R/judges.txt && [ -x $T/lean4export/.lake/build/bin/lean4export ] && [ -x $T/nanoda_lib/target/release/nanoda_bin ] && [ -x $T/con-leche/.lake/build/bin/con-leche ] || stop "a judge did not build at its pin (judges.txt)"
  # the workspace: Mathlib at the release's pin and the challenge (+ control C1's two, one line each)
  mkdir -p $CW/ComparatorChallenges && cp /tmp/MatrixExponent.lean $CW/ComparatorChallenges/MatrixExponent.lean
  F=$CW/ComparatorChallenges/MatrixExponent.lean
  sed 's|theorem square_exponent (F : Type\*) \[Field F\] : formalOmega F 1 1 1 = (9 : ℝ) / 4 := by|theorem square_exponent (F : Type*) [Field F] : formalOmega F 1 1 1 = (2.24 : ℝ) := by|' $F > $CW/ComparatorChallenges/MatrixExponentC1a.lean
  sed 's|theorem dual_exponent (F : Type\*) \[Field F\] : formalAlpha F = (1 : ℝ) / 2 := by|theorem dual_exponent (F : Type*) [Field F] : formalAlpha F = (0.49 : ℝ) := by|' $F > $CW/ComparatorChallenges/MatrixExponentC1b.lean
  for c in C1a C1b; do diff $F $CW/ComparatorChallenges/MatrixExponent$c.lean > $R/$c.diff; [ "$(grep -c '^[<>]' $R/$c.diff)" = 2 ] || stop "control $c changes other than one line"; done
  echo 'leanprover/lean4:v4.34.1' > $CW/lean-toolchain
  printf 'name = "cw"\n\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "%s"\n\n[[lean_lib]]\nname = "ComparatorChallenges"\nglobs = ["ComparatorChallenges.+"]\n' $MATHLIB > $CW/lakefile.toml
  sha256sum $CW/ComparatorChallenges/*.lean $CW/lakefile.toml $CW/lean-toolchain > $R/workspace.sha256
  chown -R $U:$U $H
  step CRM 7200 $CW bash -c 'for t in 1 2 3 4 5; do lake exe cache get && exit 0; sleep $((t*30)); done; exit 1'
  [ "$(cat $R/CRM.exit)" = 0 ] || stop "Mathlib cache (CRM)"
  # every closure file of the challenge here equals the sealed A1 list (Mathlib and its dependencies; core from the archive)
  python3 -I - $CW $V/A1-target-SHA256SUMS > $R/CR-closure-rehash.txt <<'PY'
import hashlib, os, sys
CW, A1 = sys.argv[1:3]
n, bad, absent = 0, [], 0
for l in open(A1):
    h, p = l.rstrip('\n').split('  ', 1)
    if p.startswith('pkg/'):
        name, rest = p[4:].split('/', 1); f = os.path.join(CW, '.lake', 'packages', name, rest)
    elif p.startswith('toolchain/src/'): f = os.path.join('/opt/toolchain', p[len('toolchain/'):])
    else: continue
    if not os.path.exists(f): absent += 1; continue
    n += 1
    if hashlib.sha256(open(f, 'rb').read()).hexdigest() != h: bad.append(p)
for p in bad: print('DIFFERS ' + p)
print('re-hashed %d A1 files present here: %d differ (%d A1 package/core files not present here)' % (n, len(bad), absent))
PY
  log "closure here vs A1: $(tail -1 $R/CR-closure-rehash.txt)"
  grep -q '^DIFFERS' $R/CR-closure-rehash.txt && stop "a closure file differs from the sealed A1 list"
  step CRB 7200 $CW lake build ComparatorChallenges.MatrixExponent ComparatorChallenges.MatrixExponentC1a ComparatorChallenges.MatrixExponentC1b
  [ "$(cat $R/CRB.exit)" = 0 ] || stop "the challenges did not build (CRB)"
  mkdir -p $D/cr && chown $U:$U $D/cr
  LX=$T/lean4export/.lake/build/bin/lean4export
  step CRX 7200 $CW bash -c "lake env $LX ComparatorChallenges.MatrixExponent -- $THMS > $D/cr/challenge.ndjson"
  for c in C1a C1b; do step CRX$c 7200 $CW bash -c "lake env $LX ComparatorChallenges.MatrixExponent$c -- $THMS > $D/cr/challenge-$c.ndjson"; done
  [ "$(cat $R/CRX.exit)" = 0 ] && [ "$(cat $R/CRXC1a.exit)" = 0 ] && [ "$(cat $R/CRXC1b.exit)" = 0 ] || stop "the challenge exports failed"
  sha256sum $D/cr/challenge.ndjson $D/cr/challenge-C1a.ndjson $D/cr/challenge-C1b.ndjson > $R/challenges.sha256
  log "CR setup done"
  exit 0
fi
if [ "$MODE" = check ]; then
  grep -q "CR setup done" $R/_phase.log || stop "setup has not finished"
  [ -s $D/export.ndjson.zst ] && [ -s $V/export.sha256 ] || stop "no export (or no recorded digest) uploaded"
  EXPORT_SHA=$(cut -c1-64 $V/export.sha256)
  zstd -q -d -f $D/export.ndjson.zst -o $D/export.ndjson && sha256sum $D/export.ndjson > $R/export.sha256
  [ "$(cut -c1-64 $R/export.sha256)" = "$EXPORT_SHA" ] || stop "the export's digest is not the recorded one"
  log "the export arrived and matches P1's record ($(stat -c %s $D/export.ndjson) bytes, $(cut -c1-16 $R/export.sha256)…)"
  chmod 644 $D/export.ndjson
  python3 -I $V/c2.py OAI.LinearAlgebra.SpectralBooks.square_exponent < $D/export.ndjson > $D/cr/export-c2.ndjson 2> $R/CRC2-make.txt; echo "exit $?" >> $R/CRC2-make.txt
  chown -R $U:$U $D/cr; NT=$(nproc)
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": %s,\n "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,\n "nat_extension": true, "string_extension": true, "print_success_message": true}\n' $D/export.ndjson $NT > $D/cr/nanoda.json
  sed "s#$D/export.ndjson#$D/cr/export-c2.ndjson#" $D/cr/nanoda.json > $D/cr/nanoda-c2.json; cp $D/cr/nanoda.json $D/cr/nanoda-c2.json $R/; chown $U:$U $D/cr/*.json
  CL=$T/con-leche/.lake/build/bin/con-leche ND=$T/nanoda_lib/target/release/nanoda_bin
  step CRK   43200 $D $ND $D/cr/nanoda.json
  step CRS   14400 $D $CL --verified --jobs=$NT --compare -- $D/cr/challenge.ndjson $D/export.ndjson
  step CRC1a 14400 $D $CL --verified --jobs=$NT --compare -- $D/cr/challenge-C1a.ndjson $D/export.ndjson
  step CRC1b 14400 $D $CL --verified --jobs=$NT --compare -- $D/cr/challenge-C1b.ndjson $D/export.ndjson
  step CRC2N 43200 $D $ND $D/cr/nanoda-c2.json
  step CRC2C 43200 $D $CL --verified --jobs=$NT $D/cr/export-c2.ndjson
  o() { cat $R/$1.out $R/$1.err 2>/dev/null; }; ex() { cat $R/$1.exit; }
  rej() { local e; e=$(ex $1); [ "$e" != 0 ] && [ "$e" != 124 ] && [ "$e" != 137 ]; }
  nok() { o $1 | tr -s ' \n' ' ' | grep -qE 'Checked [0-9]+ declarations with no (typechecker )?errors'; }
  k=0
  [ "$(ex CRK)" = 0 ] && nok CRK && k=$((k+1)) || log "CR gate: nanoda did not accept"
  [ "$(ex CRS)" = 0 ] && [ "$(o CRS | grep -cE '^con-leche: theorem OAI\.LinearAlgebra\.SpectralBooks\.(square_exponent|dual_exponent|rectangular_exponent) justified by the solution')" = 3 ] && k=$((k+1)) || log "CR gate: con-leche --compare did not justify the three theorems"
  rej CRC1a && o CRC1a | grep -q 'square_exponent' && ! o CRC1a | grep -qE 'theorem [^ ]*square_exponent justified by the solution' && k=$((k+1)) || log "CR gate: C1a was not refused with its diagnostic"
  rej CRC1b && o CRC1b | grep -q 'dual_exponent' && ! o CRC1b | grep -qE 'theorem [^ ]*dual_exponent justified by the solution' && k=$((k+1)) || log "CR gate: C1b was not refused with its diagnostic"
  rej CRC2N && grep -q 'C2: OAI.LinearAlgebra.SpectralBooks.square_exponent re-typed as False' $R/CRC2-make.txt && ! nok CRC2N && k=$((k+1)) || log "CR gate: C2 was not refused by nanoda"
  rej CRC2C && o CRC2C | grep -q 'square_exponent' && ! o CRC2C | grep -q 'accepted [0-9]* declarations' && k=$((k+1)) || log "CR gate: C2 was not refused by con-leche"
  [ $k = 6 ] && log "CR: all 6 gates held" || log "CR: $k of 6 gates held"
  [ -s $V/p1-challenge.sha256 ] && { [ "$(cut -c1-64 $V/p1-challenge.sha256)" = "$(head -1 $R/challenges.sha256 | cut -c1-64)" ] && log "CR: the challenge export here is byte-identical to P1's" || log "CR: the challenge export here differs in bytes from P1's (not a gate; --compare decides)"; }
  log "CR done"
fi
