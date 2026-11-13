#!/usr/bin/env bash
# The ORCHESTRATOR'S replay (C5 of PREREG-CONT.md) of the continuity proof: a fresh copy of the pristine K1 build; the
# sealed statement bytes and our earlier files from the DESK ORIGINALS; the author's proof files as brought home
# (INPUTS.sha256); the statement wrapper and the Comparator challenges written HERE; a clean build; our axiom report;
# the token grep; leanchecker --fresh; Comparator through the LAB'S OWN script (nanoda on) with our statement as the
# challenge; the planted challenge (must be refused); the author's red files elaborated in this tree.
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
RP=/root/creplay; R=$RP/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
PRISTINE=/root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/percolation
CMP=/root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/.github/scripts/comparator-check.sh
SRC=/root/creplay-src
step inputs bash -c "cd $SRC && sha256sum -c INPUTS.sha256"
rm -rf $RP/percolation
step copy cp -a $PRISTINE $RP/percolation
cd $RP/percolation
cp $SRC/Textbook.lean $SRC/Bridge.lean $SRC/ThetaAnchors.lean $SRC/DimOne.lean $SRC/ContProof.lean $SRC/UnitAux.lean $SRC/ContPlanted.lean $SRC/ContAxioms.lean .
{ printf 'import Textbook\n'; cat $SRC/Continuity.lean; } > ContStatement.lean
cat $SRC/lakefile.append.toml >> lakefile.toml
step sealed bash -c 'echo "4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae  Textbook.lean" | sha256sum -c - && [ "$(tail -n +2 ContStatement.lean | sha256sum | cut -c1-64)" = d012845f1f04304e82a9de0059d2373ed144460b4a5171061dc6a2009cff8243 ] && echo "ContStatement.lean = import Textbook + the sealed Continuity.lean bytes" && echo "ab8be23fcdec9c211bad2d44bc0b44ab22e26ea4bdf9111309670f2d78cae00a  Bridge.lean" | sha256sum -c -'
step build lake build Textbook ContStatement Bridge ThetaAnchors DimOne UnitAux ContPlanted ContProof
step axioms lake env lean ContAxioms.lean
step tokens bash -c '! grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" ContProof.lean UnitAux.lean ContPlanted.lean Textbook.lean ContStatement.lean Bridge.lean ThetaAnchors.lean DimOne.lean'
step imports bash -c 'grep -n "^import" ContProof.lean ContPlanted.lean UnitAux.lean ContStatement.lean Textbook.lean Bridge.lean ThetaAnchors.lean DimOne.lean'
( step fresh lake env leanchecker --fresh ContProof ) &
FRESH=$!
# ---- the author's red files, elaborated in this tree: Red0 must exit 0, every other must not
mkdir -p $R/red; : > $R/red/summary.txt
for f in $SRC/red/Red*.lean; do n=$(basename $f .lean); S=$(date +%s); lake env lean $f > $R/red/$n.log 2>&1; E=$?; echo "$n exit=$E seconds=$(( $(date +%s) - S )) first: $(grep -m1 -E 'error' $R/red/$n.log | cut -c1-200)" >> $R/red/summary.txt; done
cat $R/red/summary.txt
# ---- Comparator through the lab's own script, OUR statement as the challenge
cat > ContChallenge.lean <<'L'
import ContStatement
theorem theta_continuous : TextbookPercolation.ContinuityStatement := sorry
theorem theta_right_continuous : TextbookPercolation.RightContinuity := sorry
theorem theta_left_continuous_above_pc : TextbookPercolation.LeftContinuityAbovePc := sorry
theorem theta_continuous_iff_critical : TextbookPercolation.ContinuityIffCritical := sorry
L
printf '\n[[lean_lib]]\nname = "ContChallenge"\nroots = ["ContChallenge"]\n' >> lakefile.toml
mv comparator.json $RP/their-comparator.json
cat > comparator-ours.json <<'L'
{"challenge_module": "ContChallenge", "solution_module": "ContProof", "theorem_names": ["theta_continuous", "theta_right_continuous", "theta_left_continuous_above_pc", "theta_continuous_iff_critical"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step challenge-build lake build ContChallenge
step comparator bash $CMP
cp -r .lake/comparator-logs $R/comparator-logs 2>/dev/null
# ---- the planted challenge: must be refused
cp ContChallenge.lean $RP/ContChallenge.good.lean; cp comparator-ours.json $RP/comparator-ours.good.json
cat > ContChallenge.lean <<'L'
import ContStatement
theorem theta_continuous : TextbookPercolation.Planted_dimOne := sorry
L
cat > comparator-ours.json <<'L'
{"challenge_module": "ContChallenge", "solution_module": "ContProof", "theorem_names": ["theta_continuous"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step planted-challenge-build lake build ContChallenge
step planted-comparator bash $CMP
cp $RP/ContChallenge.good.lean ContChallenge.lean; cp $RP/comparator-ours.good.json comparator-ours.json
wait $FRESH
sha256sum *.lean lakefile.toml comparator-ours.json > $R/sha256-after.txt
diff -rq --exclude=.lake $PRISTINE $RP/percolation > $R/diff-vs-pristine.txt 2>&1
echo "CREPLAY done $(date -u +%H:%M:%SZ)"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
