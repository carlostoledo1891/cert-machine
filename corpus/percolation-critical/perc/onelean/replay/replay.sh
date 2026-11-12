#!/usr/bin/env bash
# A2 / P4′ — THE ORCHESTRATOR'S REPLAY on a fresh pod (2026-11-12, after the first pod was deleted for the desk's battery).
# Inputs, all checked against home hashes before anything runs (INPUTS.sha256): the pinned tarball, the sealed Textbook,
# the two sealed bridges, the anchors, and the agent's ported environment as saved (a2/env) with its cfg and scripts.
# The orchestrator assembles E itself, checks the port against the pinned originals itself (CHECKS.txt), then runs the
# agent's e3-checks.sh and e4-red.sh (read by the orchestrator; unchanged).
# Run: nohup bash /root/one/replay.sh > /root/one/replay.out 2>&1 < /dev/null &
source /root/one/scripts/common.sh
cd /root/one && sha256sum -c INPUTS.sha256 > $R/inputs-check.log 2>&1; echo "inputs check exit $? ($(grep -vc ': OK$' $R/inputs-check.log) not OK)"
grep -vq ': OK$' $R/inputs-check.log && { echo "INPUTS DIFFER — stop"; exit 2; }
eval "$(grep '^step tools' /root/one/scripts/s1-setup.sh)"
[ "$(cat $R/tools.exit)" = 0 ] || { echo "tools failed"; exit 2; }
# Anthropic's tree from the pinned tarball; OpenAI's pinned sources (no build there: originals for the comparison only)
mkdir -p /root/one/A && tar xzf $I/formal-math-795efb86.tar.gz -C /root/one/A
mkdir -p /root/one/O && cd /root/one/O && git init -q && git remote add origin https://github.com/openai/math && git fetch -q --depth 1 origin $OAI && git checkout -q FETCH_HEAD
git rev-parse HEAD > $R/O-head.txt; echo "openai/math at $(cat $R/O-head.txt)"
E=$(ls -d /root/one/A/*/percolation); O=/root/one/O/lean; S=/root/one/envsaved; C=/root/one/cfg
cd $E && cp lakefile.toml /root/one/lakefile.toml.orig
mkdir -p OAI/Probability ComparatorChallenges
cp -r $S/OAI/Probability/CriticalZ3 OAI/Probability/
cp $S/ComparatorChallenges/CriticalZ3.lean ComparatorChallenges/CriticalZ3.lean
cp $I/Textbook.lean Textbook.lean                 # the SEALED file, from the orchestrator's copy, not from the saved env
cp $I/bridgeA/Bridge.lean BridgeA.lean            # the SEALED bridge A
cp $S/BridgeO.lean BridgeO.lean                   # the agent's edited bridge O
cp $I/ThetaAnchors.lean $I/PlantedFalse.lean .
cp $C/OneLean.lean $C/OurChallenge.lean .
cp $S/lakefile.toml lakefile.toml
{
  echo "# THE ORCHESTRATOR'S OWN CHECKS OF THE PORT ($(date -u +%FT%TZ))"
  echo "Textbook.lean in E: $(sha256sum < Textbook.lean | cut -c1-64) (sealed $TRUE)"
  echo "BridgeA.lean in E:  $(sha256sum < BridgeA.lean | cut -c1-64) (sealed ab8be23f…)"
  echo "BridgeO.lean in E:  $(sha256sum < BridgeO.lean | cut -c1-64) (sealed original $(sha256sum < $I/bridgeO/Bridge.lean | cut -c1-64))"
  echo "saved env's Textbook / BridgeA equal the sealed ones: $(cmp -s $S/Textbook.lean $I/Textbook.lean && echo yes || echo NO) / $(cmp -s $S/BridgeA.lean $I/bridgeA/Bridge.lean && echo yes || echo NO)"
  echo "OpenAI statement file, E vs the pinned checkout: $(cmp -s ComparatorChallenges/CriticalZ3.lean $O/ComparatorChallenges/CriticalZ3.lean && echo BYTE-IDENTICAL || echo DIFFERS); git blob $(git hash-object ComparatorChallenges/CriticalZ3.lean) (pin 56e93b89a55e098ad924270cd85ec9f5754fd57f)"
  n=0; same=0; rm -rf /root/one/mydiffs; mkdir -p /root/one/mydiffs
  for f in $O/OAI/Probability/CriticalZ3/*.lean; do b=$(basename $f)
    [ -f OAI/Probability/CriticalZ3/$b ] || { echo "MISSING in the port: $b"; continue; }
    if cmp -s $f OAI/Probability/CriticalZ3/$b; then same=$((same+1)); else n=$((n+1)); diff -u $f OAI/Probability/CriticalZ3/$b > /root/one/mydiffs/$b.diff; fi; done
  echo "OpenAI closure: $(ls $O/OAI/Probability/CriticalZ3/*.lean | wc -l) pinned files, $(ls OAI/Probability/CriticalZ3/*.lean | wc -l) in the port; byte-identical $same, changed $n"
  echo "files in the port that the pinned directory does not have: $(for f in OAI/Probability/CriticalZ3/*.lean; do [ -f $O/OAI/Probability/CriticalZ3/$(basename $f) ] || echo -n "$(basename $f) "; done)"
  echo "lines removed / added over the changed files: $(cat /root/one/mydiffs/*.diff | grep -c '^-[^-]') / $(cat /root/one/mydiffs/*.diff | grep -c '^+[^+]')"
  diff -u $I/bridgeO/Bridge.lean BridgeO.lean > /root/one/mydiffs/BridgeO.diff; echo "bridge O lines removed / added: $(grep -c '^-[^-]' /root/one/mydiffs/BridgeO.diff) / $(grep -c '^+[^+]' /root/one/mydiffs/BridgeO.diff)"
  echo "forbidden tokens on ADDED lines (sorry|axiom|native_decide|implemented_by|unsafe|extern|admit|opaque): $(cat /root/one/mydiffs/*.diff | grep '^+[^+]' | grep -cE 'sorry|axiom|native_decide|implemented_by|unsafe|extern|admit|opaque')"
  echo "the same tokens anywhere in the ported closure, the bridges, OneLean (whole files, comments included):"; grep -nE '\bsorry\b|^\s*axiom\b|native_decide|implemented_by|\bunsafe\b|@\[extern|\badmit\b' OAI/Probability/CriticalZ3/*.lean BridgeA.lean BridgeO.lean OneLean.lean Textbook.lean | cut -c1-200 | head -40; echo "(end of list)"
  echo "the agent's saved diffs equal the orchestrator's (changed-line multiset per file):"; for f in /root/one/mydiffs/*.diff; do b=$(basename $f); a=/root/one/diffs-agent/OAI/$b; [ "$b" = BridgeO.diff ] && a=/root/one/diffs-agent/BridgeO.diff; if [ -f $a ] && cmp -s <(grep -E '^[-+][^-+]' $f | sort) <(grep -E '^[-+][^-+]' $a | sort); then :; else echo "  DIFFERENT OR MISSING: $b"; fi; done; echo "  (compared $(ls /root/one/mydiffs | wc -l) files)"
  echo "Anthropic's tree in E vs a fresh unpack of the pinned tarball (diff -rq, .lake excluded):"
  mkdir -p /root/one/A-ref && tar xzf $I/formal-math-795efb86.tar.gz -C /root/one/A-ref; diff -rq --exclude=.lake $(ls -d /root/one/A-ref/*/percolation) $E
  echo "lakefile diff vs the tarball's:"; diff /root/one/lakefile.toml.orig lakefile.toml
  echo "lean-toolchain: $(cat lean-toolchain); mathlib rev in the manifest: $(grep -B2 -A8 '"name": "mathlib"' lake-manifest.json | grep -o '"rev": "[0-9a-f]*"')"
  echo "OneLean.lean:"; cat OneLean.lean; echo "OurChallenge.lean:"; cat OurChallenge.lean
} > $R/CHECKS.txt 2>&1
echo "orchestrator checks written: $(wc -l < $R/CHECKS.txt) lines"
step A-cache lake exe cache get
bash /root/one/scripts/e3-checks.sh > /root/one/e3.out 2>&1; echo "e3 exit $?"
bash /root/one/scripts/e4-red.sh > /root/one/e4.out 2>&1; echo "e4 exit $?"
echo "$(date -u +%FT%TZ) REPLAY DONE" | tee -a $R/TIMELINE
