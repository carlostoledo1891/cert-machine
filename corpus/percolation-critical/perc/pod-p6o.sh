#!/usr/bin/env bash
# P6, bridge O part, run beside pod-p6.sh's bridge A part (the same steps, plus Comparator with OUR statement).
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:/usr/local/go/bin:$PATH
R=/root/p6/runs; mkdir -p $R
step() { local name=$1; shift; local t0=$(date +%s); ( "$@" ) > $R/$name.log 2>&1; local rc=$?; echo $rc > $R/$name.exit; echo $(( $(date +%s) - t0 )) > $R/$name.seconds; echo "$name exit $rc ($(cat $R/$name.seconds) s)"; }
WANT=4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae
CMP=/root/p1/src/formal-math-795efb86f191735c5481675763537cfb4ff37e55/.github/scripts/comparator-check.sh
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
cat > bridge/OurChallenge3.lean <<'L'
import Textbook
namespace BridgeO
theorem statement3_from_openai : TextbookPercolation.Statement3 := sorry
end BridgeO
L
sed -i 's/roots := #\[`Textbook, `Bridge\]/roots := #[`Textbook, `Bridge, `OurChallenge3]/' lakefile.lean
cat > comparator-ours.json <<'L'
{"challenge_module": "OurChallenge3", "solution_module": "Bridge", "theorem_names": ["BridgeO.statement3_from_openai"], "definition_names": [], "permitted_axioms": ["propext", "Quot.sound", "Classical.choice"], "enable_nanoda": true}
L
step O-comparator env TOOLS_DIR=$HOME/.cache/lean-ci-tools-4341 bash $CMP
step O-fresh lake env leanchecker --fresh Bridge
echo P6O done
