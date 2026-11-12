#!/usr/bin/env bash
# P6 of PREREG-PERCOLATION.md, the orchestrator's replay of both bridges on the pod (not the agents' runs):
# the sealed statement's sha256 in each environment, a clean rebuild of the bridge modules, our own axiom check,
# leanchecker --fresh on the bridge module, and Comparator (with nanoda) with OUR statement as the challenge.
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
R=/root/p6/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; }
WANT=4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae
CMP=/root/p1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/.github/scripts/comparator-check.sh

# ---- bridge A (Anthropic's toolchain v4.32.0)
A=/root/bridgeA/percolation; cd $A
echo "$WANT  Textbook.lean" | sha256sum -c - > $R/A-sha.log 2>&1 && echo "A sha ok" || echo "A sha FAIL"
sha256sum Bridge.lean Challenge.lean Solution.lean >> $R/A-sha.log
find .lake/build -name 'Bridge.*' -delete; find .lake/build -name 'Textbook.*' -delete
step A-build lake build Textbook Bridge
cat > /root/p6/AxA.lean <<'L'
import Bridge
#print axioms bridgeA
#print axioms statement_from_anthropic
#check (statement_from_anthropic : TextbookPercolation.Statement)
L
step A-axioms lake env lean /root/p6/AxA.lean
step A-fresh lake env leanchecker --fresh Bridge
cat > OurChallenge.lean <<'L'
import Textbook
theorem statement_from_anthropic : TextbookPercolation.Statement := sorry
L
grep -q 'name = "OurChallenge"' lakefile.toml || printf '\n[[lean_lib]]\nname = "OurChallenge"\nroots = ["OurChallenge"]\n' >> lakefile.toml
mkdir -p /root/p6/A-cmp && cp comparator.json /root/p6/A-cmp/their-comparator.json && rm comparator.json
cat > comparator-ours.json <<'L'
{"challenge_module": "OurChallenge", "solution_module": "Bridge", "theorem_names": ["statement_from_anthropic"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step A-comparator bash $CMP
mv /root/p6/A-cmp/their-comparator.json comparator.json

# ---- bridge O (OpenAI's toolchain v4.34.1)
O=/root/bridgeO/math/lean; cd $O
echo "$WANT  bridge/Textbook.lean" | sha256sum -c - > $R/O-sha.log 2>&1 && echo "O sha ok" || echo "O sha FAIL"
sha256sum bridge/Bridge.lean >> $R/O-sha.log; git -C /root/bridgeO/math rev-parse HEAD >> $R/O-sha.log; git -C /root/bridgeO/math status --short >> $R/O-sha.log
find .lake/build -name 'Bridge.*' -delete; find .lake/build -name 'Textbook.*' -delete
step O-build lake build Textbook Bridge
cat > /root/p6/AxO.lean <<'L'
import Bridge
#print axioms BridgeO.bridgeO
#print axioms BridgeO.statement3_from_openai
#check (BridgeO.statement3_from_openai : TextbookPercolation.Statement3)
L
step O-axioms lake env lean /root/p6/AxO.lean
step O-fresh lake env leanchecker --fresh Bridge
echo P6 done
