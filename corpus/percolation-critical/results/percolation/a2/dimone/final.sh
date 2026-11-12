#!/usr/bin/env bash
# P5' final: clean rebuild of Textbook, ThetaAnchors, DimOne at both pins (project build dir deleted first), axioms.
set -uo pipefail
export PATH=$HOME/.elan/bin:$PATH
cd /root/d1; R=/root/d1/results; rm -rf $R; mkdir -p $R
for p in p432 p4341; do
  cd /root/d1/$p
  cp /root/d1/DimOne.lean DimOne.lean
  rm -rf .lake/build
  { echo "# $p clean rebuild, $(date -u +%FT%TZ)"; echo "# toolchain: $(cat lean-toolchain); lean: $(lake env lean --version)";
    echo "# mathlib rev: $(git -C .lake/packages/mathlib rev-parse HEAD)"; echo "# sha256 inputs as built:"; sha256sum Textbook.lean ThetaAnchors.lean DimOne.lean lakefile.toml lake-manifest.json; } > $R/$p-build.log
  t0=$(date +%s); lake build DimOne >> $R/$p-build.log 2>&1; rc=$?
  echo $rc > $R/$p-build.exit; echo $(( $(date +%s) - t0 )) > $R/$p-build.seconds
  lake env lean /root/d1/AxD.lean > $R/$p-axioms.txt 2>&1; echo $? > $R/$p-axioms.exit
  sha256sum DimOne.lean | cut -d' ' -f1 > $R/$p-DimOne.sha256
  cp lakefile.toml $R/$p-lakefile.toml; cp lake-manifest.json $R/$p-lake-manifest.json
  echo "$p build exit $rc ($(cat $R/$p-build.seconds) s); axioms exit $(cat $R/$p-axioms.exit)"
  echo "warnings: $(grep -c -i 'warning' $R/$p-build.log)  errors: $(grep -c -i 'error' $R/$p-build.log)"
done
cd /root/d1; sha256sum DimOne.lean AxD.lean > $R/SHA256SUMS; wc -l DimOne.lean >> $R/SHA256SUMS
echo done
