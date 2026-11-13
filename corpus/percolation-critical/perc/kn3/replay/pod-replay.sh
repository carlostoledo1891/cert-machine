#!/usr/bin/env bash
# The ORCHESTRATOR'S replay of K2 and K3 of PREREG-KN3.md (not the author's run): a fresh copy of the pristine K1 build,
# the sealed statement bytes, the bridge sources as brought home to the desk (INPUTS.sha256), a clean build, our axiom
# report, the dependency walk, the token grep, leanchecker --fresh, Comparator (nanoda on) with OUR statement as the
# challenge, KR4 (the challenge changed to the planted, proved-false Planted3: must be refused), then the author's
# red.sh (KR1-KR3) in this tree. Every step: log, exit code, seconds under /root/replay/runs.
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
RP=/root/replay; R=$RP/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; return 0; }
PRISTINE=/root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/percolation
CMP=/root/k1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/.github/scripts/comparator-check.sh
SRC=/root/replay-src
step inputs bash -c "cd $SRC && sha256sum -c INPUTS.sha256"
step tools bash -c 'apt-get install -y -qq golang-go jq >/dev/null 2>&1; (command -v cargo || curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal); go version; $HOME/.cargo/bin/cargo --version'
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
rm -rf $RP/percolation
step copy cp -a $PRISTINE $RP/percolation
cd $RP/percolation
step setup env WORK=$RP/percolation SEALED=/root/sealed bash $SRC/pod-setup.sh $SRC
step sealed bash -c 'echo "161411bd3a703971c05bbbe10554841612bbb97f0f23eaae9988468b1a98def8  Printed.lean" | sha256sum -c -; sha256sum /root/sealed/*.lean; diff <(tail -n +4 KN3/Frag.lean) <(cat /root/sealed/Check.lean /root/sealed/Planted.lean /root/sealed/PlantedCheck.lean) && echo "Frag.lean = header + the three sealed fragments"'
step build lake build KN3Printed KN3.Frag KN3.Transport KN3.Exhaustion KN3.Compare KN3.Proved KN3.Cheat KN3.DepWalk
step axioms lake env lean KN3/Axioms.lean
step walk lake env lean KN3/Walk.lean
step tokens bash -c '! grep -nE "sorry|axiom|native_decide|implemented_by|unsafe|extern|admit" Printed.lean KN3/Transport.lean KN3/Exhaustion.lean KN3/Compare.lean KN3/Proved.lean'
step imports bash -c 'grep -n "^import" KN3/Frag.lean KN3/Transport.lean KN3/Exhaustion.lean KN3/Compare.lean KN3/Proved.lean Printed.lean'
( step fresh lake env leanchecker --fresh KN3.Proved ) &
FRESH=$!
# ---- Comparator with OUR statement as the challenge
cat > OurChallenge.lean <<'L'
import Printed
theorem conjecture3_as_printed : KN3Printed.Conjecture3 := sorry
theorem conjecture3_readingB_as_printed : KN3Printed.Conjecture3_readingB := sorry
L
printf '\n[[lean_lib]]\nname = "OurChallenge"\nroots = ["OurChallenge"]\n' >> lakefile.toml
mv comparator.json $RP/their-comparator.json
cat > comparator-ours.json <<'L'
{"challenge_module": "OurChallenge", "solution_module": "KN3.Proved", "theorem_names": ["conjecture3_as_printed", "conjecture3_readingB_as_printed"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step challenge-build lake build OurChallenge
step comparator bash $CMP
cp -r .lake/comparator-logs $R/comparator-logs 2>/dev/null
# ---- KR4: the challenge changed to the planted, proved-false Planted3 (must be refused)
cp OurChallenge.lean $RP/OurChallenge.good.lean; cp comparator-ours.json $RP/comparator-ours.good.json
cat > OurChallenge.lean <<'L'
import KN3.Frag
theorem conjecture3_as_printed : KN3Planted.Planted3_conclusionReversed := sorry
L
cat > comparator-ours.json <<'L'
{"challenge_module": "OurChallenge", "solution_module": "KN3.Proved", "theorem_names": ["conjecture3_as_printed"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step kr4-challenge-build lake build OurChallenge
step kr4-comparator bash $CMP
cp $RP/OurChallenge.good.lean OurChallenge.lean; cp $RP/comparator-ours.good.json comparator-ours.json
wait $FRESH
# ---- the author's red controls, in this tree
mkdir -p $RP/red
step red env WORK=$RP/percolation SEALED=/root/sealed SRC=$SRC RED=$RP/red PRISTINE=$PRISTINE bash $SRC/red.sh
sha256sum Printed.lean KN3/*.lean lakefile.toml OurChallenge.lean comparator-ours.json > $R/sha256-after.txt
echo "REPLAY done $(date -u +%H:%M:%SZ)"; for f in $R/*.exit; do echo "$(basename $f .exit): $(cat $f)"; done
