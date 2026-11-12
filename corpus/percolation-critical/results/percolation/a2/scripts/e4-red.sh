#!/usr/bin/env bash
# A2, the red controls in the one environment E (run after every kernel check has finished): R1 (θ = 1) and R4 (the
# planted false p_c, with PlantedFalse building next to it); then the sealed statement restored and rebuilt.
source /root/one/scripts/common.sh
E=$(ls -d /root/one/A/*/percolation); C=/root/one/cfg; X=/root/one/red; mkdir -p $X
cd $E
echo "$TRUE  Textbook.lean" | sha256sum -c - || { echo "Textbook.lean is not the sealed one before the controls"; exit 2; }
cp Textbook.lean $X/Textbook.true.lean
sed 's/θ d ⟨pc d, h⟩ = 0/θ d ⟨pc d, h⟩ = 1/' $X/Textbook.true.lean > $X/Textbook.R1A.lean          # Statement, as bridge A's R1
sed 's/θ 3 ⟨pc 3, h⟩ = 0/θ 3 ⟨pc 3, h⟩ = 1/' $X/Textbook.true.lean > $X/Textbook.R1O.lean          # Statement3, as bridge O's R1
sed -e 's/θ d ⟨pc d, h⟩ = 0/θ d ⟨pc d, h⟩ = 1/' -e 's/θ 3 ⟨pc 3, h⟩ = 0/θ 3 ⟨pc 3, h⟩ = 1/' $X/Textbook.true.lean > $X/Textbook.R1.lean   # both
cp $I/Textbook.R4.lean $X/Textbook.R4.lean
for r in R1A R1O R1 R4; do diff $X/Textbook.true.lean $X/Textbook.$r.lean > $X/$r.diff; echo "$r: planted lines = $(grep -c '^>' $X/$r.diff)"; done
first() { grep -m1 '^error: [A-Za-z/]*\.lean' $R/$1.log | cut -c1-160; }
# R1, Statement planted: bridge A must refuse; OneLean must not build
cp $X/Textbook.R1A.lean Textbook.lean
step R1A-BridgeA lake build BridgeA;  echo "  first error: $(first R1A-BridgeA)"
step R1A-OneLean lake build OneLean;  echo "  first error: $(first R1A-OneLean)"
# R1, Statement3 planted: bridge O must refuse
cp $X/Textbook.R1O.lean Textbook.lean
step R1O-BridgeO lake build BridgeO;  echo "  first error: $(first R1O-BridgeO)"
step R1O-OneLean lake build OneLean;  echo "  first error: $(first R1O-OneLean)"
# R1, both planted
cp $X/Textbook.R1.lean Textbook.lean
step R1-OneLean lake build OneLean;   echo "  first error: $(first R1-OneLean)"
# R4, the planted false p_c
cp $X/Textbook.R4.lean Textbook.lean
step R4-BridgeA lake build BridgeA;   echo "  first error: $(first R4-BridgeA)"
step R4-BridgeO lake build BridgeO;   echo "  first error: $(first R4-BridgeO)"
step R4-OneLean lake build OneLean;   echo "  first error: $(first R4-OneLean)"
step R4-plantedfalse lake build PlantedFalse
step R4-axioms lake env lean $I/AxP.lean
# restore
cp $X/Textbook.true.lean Textbook.lean
echo "$TRUE  Textbook.lean" | sha256sum -c - > $R/restore-sha.log 2>&1; echo "restore sha: $(cat $R/restore-sha.log)"
step restore-build lake build
step restore-axioms lake env lean $C/AxOne.lean
sha256sum .lake/build/lib/lean/{Textbook,BridgeA,BridgeO,OneLean}.olean > $R/E-oleans-after.sha256
cmp $R/E-oleans-before.sha256 $R/E-oleans-after.sha256 && echo "oleans after restore: identical to the checked ones" || echo "oleans after restore: DIFFER from the checked ones"
sha256sum Textbook.lean > $R/Textbook-final.sha256; cat $R/Textbook-final.sha256
echo "red done"; for f in $R/R*.exit $R/restore*.exit; do echo "$(basename $f .exit): $(cat $f) ($(cat ${f%.exit}.seconds) s)"; done
