#!/usr/bin/env bash
# cr-p5.sh MODE — row P5-CR (Phase 5's clean room, the same steps, gates and pins as Phase 4's G3-CR, phase4/prover/
# scripts/cr-g3.sh): a fresh pod that never runs the release's code (no clone of openai/math, no OAI module built,
# imported or run here).
#   setup  the official Lean v4.34.1 release (GitHub's digest enforced); lean4export 076e8e57 (on v4.34.1), nanoda
#          d0a02cc5 (the second pin, not the 3a240721 Comparator ran on the Phase 5 prover pod) and con-leche 5ea446d5
#          built from source; a workspace holding only Mathlib d13f23b7 (cache) and our two challenge files uploaded to
#          /opt/omega: the sealed Rect.lean (A16, sha256 95340267…) + four stubs, and its planted twin RectPlanted2
#          (rectBound's `(3 : ℝ) / 4` -> `(3 : ℝ) / 3`, the one-constant change with no side effect); their sha256s and
#          the sealed prefix checked; both challenges built and exported HERE (the four theorems)
#   check  the Phase 5 prover pod's solution export (uploaded to /data/sol.ndjson.zst) must have the recorded sha256
#          (/opt/omega/sol.sha256); then nanoda on it; con-leche --verified; con-leche --verified --compare against the
#          challenge exported here (four justified); the planted challenge must be refused by con-leche --compare
# Results in /results (root-owned); every Lean/judge step as the unprivileged user `clean`.
# Start detached:  nohup bash cr-p5.sh setup > /results/cr-setup.log 2>&1 &
set -uo pipefail
unset RUNPOD_API_KEY RUNPOD_SECRET_KEY 2>/dev/null || true
MODE=${1:?setup or check}
R=/results U=clean H=/home/clean T=/opt/judges V=/opt/omega CW=/home/clean/cw D=/data
LEAN_TGZ_SHA=47bf4bbd78f70c2e9670598ab7124d92b6efb7330ff33e5fbb4030f6fd72e4e4
MATHLIB=d13f23b723b8a846827a245b89c10fc7d3f11612
SEALED_SHA=953402670d04aaeac26f97e8034debb8401250de62bcb0baa511931d85e8577a SEALED_BYTES=17068
CHAL_SHA=412524b989224d6b475fd88e923e65324ae4b26a7e54c5442394cc6b1d2aa58c
PLANT_SHA=2201264716501d81414b39f64b96bfe21e7d7ac189fe2e3ccc5c683e7ac0eb25
LEXPIN=076e8e57707e813375e8f9da8bf989799ace9680 NDPIN=d0a02cc5defadd683f62f9d078f41688314fa31f CLPIN=5ea446d5c79d23ef1f954215d094db2162f1ab6f
THMS="Rect.borderRankRect_holds Rect.asymptoticRankRect_holds Rect.alphaBounds_holds Rect.dualExponentDiv_holds"
export DEBIAN_FRONTEND=noninteractive
mkdir -p $R $D && chmod 755 $R
log() { echo "$(date -u +%FT%TZ) $*" | tee -a $R/_phase.log; }
step() { local n=$1 to=$2 dir=$3; shift 3; log "$n running"; date +%s > $R/$n.start
  runuser -u $U -- env -i HOME=$H PATH="/opt/toolchain/bin:/usr/local/bin:/usr/bin:/bin" LEAN_ABORT_ON_PANIC=1 \
    bash -c 'cd "$1" && shift && ulimit -s unlimited 2>/dev/null; exec /usr/bin/time -v timeout "$0" "$@"' "$to" "$dir" "$@" > $R/$n.out 2> $R/$n.err
  echo $? > $R/$n.exit; date +%s > $R/$n.end
  log "$n exit $(cat $R/$n.exit) after $(( $(cat $R/$n.end) - $(cat $R/$n.start) )) s, peak $(grep -m1 'Maximum resident' $R/$n.err | awk '{print $NF}') kB"; }
stop() { log "STOPPED (P5-CR): $*"; exit 1; }
if [ "$MODE" = setup ]; then
  log "P5-CR setup; $(nproc) vCPU; $(cat /sys/fs/cgroup/memory.max 2>/dev/null) bytes; $(hostname)"
  # (cr-g3.sh chained install to update with &&; on this pod a third-party index of the image, the deadsnakes PPA, answered
  #  503 and nothing was installed, so the install now runs on whatever indexes did update and must itself succeed)
  apt-get update -qq; apt-get install -y -qq git python3 curl ca-certificates time tar zstd build-essential procps pkg-config libssl-dev < /dev/null > /dev/null || stop "apt-get install failed"
  [ -x /usr/bin/time ] || stop "/usr/bin/time is missing"
  id $U > /dev/null 2>&1 || useradd -m -s /bin/bash $U
  # our two challenge files, checked against the recorded digests and the sealed prefix
  [ "$(sha256sum $V/Rect.lean | cut -c1-64)" = $CHAL_SHA ] || stop "Rect.lean differs from its record"
  [ "$(sha256sum $V/RectPlanted2.lean | cut -c1-64)" = $PLANT_SHA ] || stop "RectPlanted2.lean differs from its record"
  [ "$(head -c $SEALED_BYTES $V/Rect.lean | sha256sum | cut -c1-64)" = $SEALED_SHA ] || stop "the challenge does not start with the sealed Rect.lean"
  diff $V/Rect.lean $V/RectPlanted2.lean > $R/planted.diff; [ "$(grep -c '^[<>]' $R/planted.diff)" = 2 ] || stop "the planted twin changes more than one line"
  log "challenge files match their records; the first $SEALED_BYTES bytes are the sealed Rect.lean (${SEALED_SHA:0:16}…); the planted twin differs in one line"
  mkdir -p /opt/toolchain && curl -fsSL --retry 5 -o /opt/lean.tar.zst https://github.com/leanprover/lean4/releases/download/v4.34.1/lean-4.34.1-linux.tar.zst
  sha256sum /opt/lean.tar.zst > $R/toolchain.sha256
  grep -q "^$LEAN_TGZ_SHA " $R/toolchain.sha256 || stop "the toolchain archive does not match GitHub's published digest"
  tar --zstd -xf /opt/lean.tar.zst -C /opt/toolchain --strip-components=1 && chmod -R a+rX,go-w /opt/toolchain
  log "toolchain archive matches GitHub's digest: $(/opt/toolchain/bin/lean --version)"
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
  # the workspace: Mathlib at the release's pin (cache only) and our two challenges
  mkdir -p $CW/RectChallenges && cp $V/Rect.lean $V/RectPlanted2.lean $CW/RectChallenges/
  echo 'leanprover/lean4:v4.34.1' > $CW/lean-toolchain
  printf 'name = "cw"\n\n[[require]]\nname = "mathlib"\ngit = "https://github.com/leanprover-community/mathlib4"\nrev = "%s"\n\n[[lean_lib]]\nname = "RectChallenges"\nglobs = ["RectChallenges.+"]\n' $MATHLIB > $CW/lakefile.toml
  sha256sum $CW/RectChallenges/*.lean $CW/lakefile.toml $CW/lean-toolchain > $R/workspace.sha256
  chown -R $U:$U $H
  step CRM 7200 $CW bash -c 'for t in 1 2 3 4 5; do lake exe cache get && exit 0; sleep $((t*30)); done; exit 1'
  [ "$(cat $R/CRM.exit)" = 0 ] || stop "Mathlib cache (CRM)"
  runuser -u $U -- git -C $CW/.lake/packages/mathlib rev-parse HEAD > $R/mathlib-rev.txt 2>&1
  [ "$(head -1 $R/mathlib-rev.txt)" = $MATHLIB ] || stop "Mathlib is not at $MATHLIB"
  log "Mathlib at $(head -1 $R/mathlib-rev.txt) (cache only); no OAI package in the workspace: $(ls $CW/.lake/packages | tr '\n' ' ')"
  step CRB 7200 $CW lake build RectChallenges.Rect RectChallenges.RectPlanted2
  [ "$(cat $R/CRB.exit)" = 0 ] || stop "the challenges did not build (CRB)"
  mkdir -p $D/cr && chown $U:$U $D/cr
  LX=$T/lean4export/.lake/build/bin/lean4export
  step CRX 7200 $CW bash -c "lake env $LX RectChallenges.Rect -- $THMS > $D/cr/challenge.ndjson"
  step CRXP 7200 $CW bash -c "lake env $LX RectChallenges.RectPlanted2 -- $THMS > $D/cr/challenge-planted.ndjson"
  [ "$(cat $R/CRX.exit)" = 0 ] && [ "$(cat $R/CRXP.exit)" = 0 ] || stop "the challenge exports failed"
  sha256sum $D/cr/challenge.ndjson $D/cr/challenge-planted.ndjson > $R/challenges.sha256
  log "P5-CR setup done"
  exit 0
fi
if [ "$MODE" = check ]; then
  grep -q "P5-CR setup done" $R/_phase.log || stop "setup has not finished"
  [ -s $D/sol.ndjson.zst ] && [ -s $V/sol.sha256 ] || stop "no export (or no recorded digest) uploaded"
  EXPORT_SHA=$(cut -c1-64 $V/sol.sha256)
  zstd -q -d -f --long=27 $D/sol.ndjson.zst -o $D/sol.ndjson && sha256sum $D/sol.ndjson > $R/sol.sha256
  [ "$(cut -c1-64 $R/sol.sha256)" = "$EXPORT_SHA" ] || stop "the export's digest is not the recorded one"
  log "the export arrived and matches the Phase 5 prover pod's record ($(stat -c %s $D/sol.ndjson) bytes, $(cut -c1-16 $R/sol.sha256)…)"
  chmod 644 $D/sol.ndjson; chown -R $U:$U $D/cr; NT=$(nproc)
  printf '{"export_file_path": "%s", "use_stdin": false, "num_threads": %s,\n "permitted_axioms": ["propext", "Classical.choice", "Quot.sound"], "unpermitted_axiom_hard_error": false,\n "nat_extension": true, "string_extension": true, "print_success_message": true}\n' $D/sol.ndjson $NT > $D/cr/nanoda.json
  cp $D/cr/nanoda.json $R/; chown $U:$U $D/cr/*.json
  CL=$T/con-leche/.lake/build/bin/con-leche ND=$T/nanoda_lib/target/release/nanoda_bin
  step CRK  43200 $D $ND $D/cr/nanoda.json
  step CRV  14400 $D $CL --verified --jobs=$NT $D/sol.ndjson
  step CRS  14400 $D $CL --verified --jobs=$NT --compare -- $D/cr/challenge.ndjson $D/sol.ndjson
  step CRP  14400 $D $CL --verified --jobs=$NT --compare -- $D/cr/challenge-planted.ndjson $D/sol.ndjson
  o() { cat $R/$1.out $R/$1.err 2>/dev/null; }; ex() { cat $R/$1.exit; }
  rej() { local e; e=$(ex $1); [ "$e" != 0 ] && [ "$e" != 124 ] && [ "$e" != 137 ]; }
  nok() { o $1 | tr -s ' \n' ' ' | grep -qE 'Checked [0-9]+ declarations with no (typechecker )?errors'; }
  k=0
  [ "$(ex CRK)" = 0 ] && nok CRK && k=$((k+1)) || log "P5-CR gate: nanoda did not accept"
  [ "$(ex CRV)" = 0 ] && o CRV | grep -qE 'accepted [0-9]+ declarations' && k=$((k+1)) || log "P5-CR gate: con-leche --verified did not accept"
  [ "$(ex CRS)" = 0 ] && [ "$(o CRS | grep -cE '^con-leche: theorem Rect\.(borderRankRect_holds|asymptoticRankRect_holds|alphaBounds_holds|dualExponentDiv_holds) justified by the solution')" = 4 ] && k=$((k+1)) || log "P5-CR gate: con-leche --compare did not justify the four theorems"
  # the planted change is in rectBound, which the types of borderRankRect_holds and asymptoticRankRect_holds read
  rej CRP && o CRP | grep -qE 'Rect\.(borderRankRect|asymptoticRankRect)_holds is not justified by the solution' && ! o CRP | grep -qE 'theorem Rect\.(borderRankRect|asymptoticRankRect)_holds justified by the solution' && k=$((k+1)) || log "P5-CR gate: the planted challenge was not refused with its diagnostic"
  [ $k = 4 ] && log "P5-CR: all 4 gates held" || log "P5-CR: $k of 4 gates held"
  [ -s $V/p5-challenge.sha256 ] && { [ "$(cut -c1-64 $V/p5-challenge.sha256)" = "$(head -1 $R/challenges.sha256 | cut -c1-64)" ] && log "P5-CR: the challenge export here is byte-identical to the Phase 5 prover pod's" || log "P5-CR: the challenge export here differs in bytes from the Phase 5 prover pod's (not a gate; --compare decides)"; }
  [ -s $V/p5-planted2.sha256 ] && { [ "$(cut -c1-64 $V/p5-planted2.sha256)" = "$(sed -n 2p $R/challenges.sha256 | cut -c1-64)" ] && log "P5-CR: the planted challenge export here is byte-identical to the Phase 5 prover pod's" || log "P5-CR: the planted challenge export here differs in bytes from the Phase 5 prover pod's (not a gate)"; }
  log "P5-CR done"
fi
