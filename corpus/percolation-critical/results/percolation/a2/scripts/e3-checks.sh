#!/usr/bin/env bash
# A2, every check of "Passes when" in the one environment E, in order. Each step: log, exit, seconds.
source /root/one/scripts/common.sh
E=$(ls -d /root/one/A/*/percolation); C=/root/one/cfg
CMP=$(ls -d /root/one/A/*)/.github/scripts/comparator-check.sh
cd $E
echo "$TRUE  Textbook.lean" | sha256sum -c - > $R/E-textbook-sha-before.log 2>&1; echo "Textbook sha before: $(cat $R/E-textbook-sha-before.log)"
# 1. clean build
rm -rf .lake/build
step E-clean-build lake build
step E-build-statement-files lake build Challenge ComparatorChallenges OurChallenge
grep -n "declaration uses .sorry." $R/E-clean-build.log > $R/E-clean-build.sorry.txt; echo "sorry warnings in the clean build: $(wc -l < $R/E-clean-build.sorry.txt)"
# 2. axioms
step E-axioms lake env lean $C/AxOne.lean
# olean hashes of what the kernels will be shown (compared after the red controls' restore)
sha256sum .lake/build/lib/lean/{Textbook,BridgeA,BridgeO,OneLean}.olean > $R/E-oleans-before.sha256
# 3. leanchecker --fresh on OneLean, in the background, beside the comparators (which only read the build)
( t0=$(date +%s); echo "$(date -u +%FT%TZ) start E-fresh" >> $R/TIMELINE; lake env leanchecker --fresh OneLean > $R/E-fresh.log 2>&1; rc=$?; echo $rc > $R/E-fresh.exit; echo $(( $(date +%s) - t0 )) > $R/E-fresh.seconds; echo "$(date -u +%FT%TZ) E-fresh exit $rc ($(cat $R/E-fresh.seconds) s)" >> $R/TIMELINE ) &
FRESH=$!
# 4. Comparator, our statement as the challenge
mkdir -p /root/one/cmp-aside && mv comparator.json /root/one/cmp-aside/anthropic-comparator.json
cp $C/comparator-ours.json comparator-ours.json
step E-comparator-ours bash $CMP
rm comparator-ours.json
# 5. Comparator, the ported lab's own theorem against its unchanged challenge file (OpenAI's own configuration)
cp /root/one/O/lean/ComparatorChallenges/CriticalZ3.json comparator-openai.json
step E-comparator-openai bash $CMP
rm comparator-openai.json
# 5b. (extra) Anthropic's own configuration, as P1 ran it
cp /root/one/cmp-aside/anthropic-comparator.json comparator.json
step E-comparator-anthropic bash $CMP
wait $FRESH
echo "fresh: exit $(cat $R/E-fresh.exit) ($(cat $R/E-fresh.seconds) s)"
echo "checks done"; for f in $R/E-*.exit; do echo "$(basename $f .exit): $(cat $f) ($(cat ${f%.exit}.seconds) s)"; done
