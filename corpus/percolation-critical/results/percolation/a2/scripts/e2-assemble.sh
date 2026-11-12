#!/usr/bin/env bash
# A2, the one environment E: Anthropic's project (v4.32.0 / Mathlib 81a5d257, unchanged) + OpenAI's ported Z3 closure
# + its unchanged statement file + the sealed Textbook + both bridges + OneLean. Also writes every diff.
source /root/one/scripts/common.sh
E=$(ls -d /root/one/A/*/percolation); O=/root/one/O/lean; M=/root/one/m2; C=/root/one/cfg; D=/root/one/diffs
cd $E
[ -f /root/one/lakefile.toml.orig ] || cp lakefile.toml /root/one/lakefile.toml.orig
mkdir -p OAI/Probability ComparatorChallenges
rm -rf OAI/Probability/CriticalZ3 && cp -r $M/OAI/Probability/CriticalZ3 OAI/Probability/
cp $O/ComparatorChallenges/CriticalZ3.lean ComparatorChallenges/CriticalZ3.lean
cp $I/Textbook.lean Textbook.lean
cp $I/bridgeA/Bridge.lean BridgeA.lean
cp $M/BridgeO.lean BridgeO.lean
cp $I/ThetaAnchors.lean $I/PlantedFalse.lean .
cp $C/OneLean.lean $C/OurChallenge.lean .
sed 's/^defaultTargets = \["Percolation", "Solution"\]$/defaultTargets = ["Percolation", "Solution", "OAI", "Textbook", "BridgeA", "BridgeO", "OneLean"]/' /root/one/lakefile.toml.orig > lakefile.toml
cat $C/lakefile.append.toml >> lakefile.toml
# ---- diffs: original vs ported, one per file
rm -rf $D && mkdir -p $D/OAI
n=0; for f in $O/OAI/Probability/CriticalZ3/*.lean; do b=$(basename $f)
  if ! cmp -s $f OAI/Probability/CriticalZ3/$b; then diff -u --label a/OAI/Probability/CriticalZ3/$b --label b/OAI/Probability/CriticalZ3/$b $f OAI/Probability/CriticalZ3/$b > $D/OAI/$b.diff; n=$((n+1)); fi; done
diff -u --label a/bridgeO/Bridge.lean --label b/BridgeO.lean $I/bridgeO/Bridge.lean BridgeO.lean > $D/BridgeO.diff
diff -u --label a/bridgeA/Bridge.lean --label b/BridgeA.lean $I/bridgeA/Bridge.lean BridgeA.lean > $D/BridgeA.diff
diff -u --label a/lakefile.toml --label b/lakefile.toml /root/one/lakefile.toml.orig lakefile.toml > $D/lakefile.diff
diff -u --label a/ComparatorChallenges/CriticalZ3.lean --label b/ComparatorChallenges/CriticalZ3.lean $O/ComparatorChallenges/CriticalZ3.lean ComparatorChallenges/CriticalZ3.lean > $D/OpenAI-challenge.diff
{
  echo "files of OpenAI's Z3 closure (34 under OAI/Probability/CriticalZ3 + the statement file): changed $n of 34, statement file changed 0"
  echo "lines removed / added over the changed OAI files: $(cat $D/OAI/*.diff | grep -c '^-[^-]') / $(cat $D/OAI/*.diff | grep -c '^+[^+]')"
  echo "bridge O lines removed / added: $(grep -c '^-[^-]' $D/BridgeO.diff) / $(grep -c '^+[^+]' $D/BridgeO.diff)"
  echo "bridge A diff bytes: $(wc -c < $D/BridgeA.diff)   OpenAI challenge diff bytes: $(wc -c < $D/OpenAI-challenge.diff)"
  echo "per file (removed added):"; for f in $D/OAI/*.diff; do echo "  $(basename $f .diff) $(grep -c '^-[^-]' $f) $(grep -c '^+[^+]' $f)"; done
  echo "forbidden tokens on added lines (sorry|axiom|native_decide|implemented_by|unsafe|extern|admit): $(cat $D/OAI/*.diff $D/BridgeO.diff | grep '^+[^+]' | grep -cE 'sorry|axiom|native_decide|implemented_by|unsafe|extern|admit')"
} > $D/SUMMARY.txt
cat $D/SUMMARY.txt
# ---- the statement side, before/after
{
  echo "# sha256, original (pinned checkout / sealed input) then in E"
  sha256sum $O/ComparatorChallenges/CriticalZ3.lean ComparatorChallenges/CriticalZ3.lean
  sha256sum $O/OAI/Probability/CriticalZ3/Model.lean OAI/Probability/CriticalZ3/Model.lean
  echo "git blob of the challenge file in E: $(git hash-object ComparatorChallenges/CriticalZ3.lean) (pin 56e93b89a55e098ad924270cd85ec9f5754fd57f)"
  sha256sum $I/Textbook.lean Textbook.lean $I/bridgeA/Bridge.lean BridgeA.lean $I/bridgeO/Bridge.lean BridgeO.lean
  sha256sum Challenge.lean Solution.lean comparator.json
  echo "# Anthropic's tree in E against a fresh unpack of the pinned tarball (diff -rq, .lake excluded):"
  rm -rf /root/one/A-ref && mkdir -p /root/one/A-ref && tar xzf $I/formal-math-795efb86.tar.gz -C /root/one/A-ref
  diff -rq --exclude=.lake $(ls -d /root/one/A-ref/*/percolation) $E
} > $R/E-statement-sha.log 2>&1
cat $R/E-statement-sha.log
echo assemble done
