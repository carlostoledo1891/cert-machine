#!/bin/sh
# Rebuilds every output in this folder. Run from this folder:  sh check.sh
# Needs: elan with leanprover/lean4:v4.35.0 (pinned by ./lean-toolchain), python3.
set -u
cd "$(dirname "$0")"
python3 gen.py > gen-output.txt || exit 1
lean --version > lean-version.txt
START=$(date +%s)
lean -o TwelveBlocks.olean TwelveBlocks.lean > lean-output.txt 2>&1
MAIN=$?
END=$(date +%s)
echo "lean -o TwelveBlocks.olean TwelveBlocks.lean: exit $MAIN, $((END - START)) s wall" > timing.txt
grep '^EVAL ' lean-output.txt > eval-m1-8.txt
grep 'depends on axioms\|does not depend on any axioms' lean-output.txt > axioms.txt
python3 compare.py > compare-output.txt 2>&1
echo "compare.py: exit $?" >> timing.txt
LEAN_PATH=. lean Planted.lean > planted-error.txt 2>&1
echo "exit code of lean Planted.lean: $?" >> planted-error.txt
rm -f TwelveBlocks.olean   # 52 MB, only needed for the import in Planted.lean
cat timing.txt
tail -2 compare-output.txt
tail -1 planted-error.txt
exit $MAIN
