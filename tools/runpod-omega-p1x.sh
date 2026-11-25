#!/usr/bin/env bash
# runpod-omega-p1x.sh STAGE... — additions to Phase 1 of the ω = 9/4 lane on the same pod, at the control room's word
# (2026-11-25, after K0 had started; corpus/omega-nine-fourths/DEVIATIONS.md D3). No pre-registered row changes. It
# sources tools/runpod-omega-p1.sh as it ran on the pod (/opt/omega/p1.sh, never edited while it runs) for its
# variables and helpers, then:
#   xpin    the import closure of the modules the additions need beyond the sealed A1 closure
#           (SpectralBooks.DivisionExponent and SpectralBooks.CircuitRankSpecialization, which docs/379.md's division
#           claims live in); every file in it that is NOT in A1 hashed, with the reader's test files, into
#           /results/x/A1x-SHA256SUMS — pulled home and stamped BEFORE xbuild
#   xbuild  the planted challenges V1-V6 and the T3 pair regenerated from the pinned sources by the reader's own
#           scripts and compared byte for byte with the committed files; then `lake build` of the two extra modules and
#           the eight challenge modules
#   xf4     F4's decision tests: Comparator (the released settings) on V1-V6 (each must be REFUSED) and on the T3 pair
#           (ReaderDivision ACCEPTED, ReaderDivisionPlanted REFUSED); `lake env lean` on T1, T2, T3_DivisionInEnv, T4, T5
#           (green = exit 0, no error, no sorry, every #print axioms line only propext/Classical.choice/Quot.sound)
#   xcen    CEN additions (N2, N3, the reader's note on `rigidity`): CENX.lean prints the type, axioms and on-route flag
#           of the division theorems of docs/379.md, MatrixExponent.omega_eq, contact_of_installations and every
#           constant named *rigidity*; which Comparator configs name any of them
# Inputs in /opt/omega/reader (the committed reader/tests tree) and /opt/omega/CENX.lean.                        MIT
source /opt/omega/p1.sh stage
X=$R/x RT=$V/reader
mkdir -p $X
ok3() {  # name test-file: green = exit 0, no error line, no sorry, every #print axioms line answered with the three only
  local f=$R/$1 n; [ "$(ex $1)" = 0 ] || return 1
  ! grep -qE '(^|: )error' $f.out $f.err || return 1
  ! grep -q 'declaration uses' $f.out $f.err || return 1
  ! grep -q 'sorryAx' $f.out || return 1
  tr '\n' ' ' < $f.out | tr -s ' ' | grep -oE "depends on axioms: \[[^]]*\]|does not depend on any axioms" > $f.axioms
  n=$(grep -c '^#print axioms' $2)
  [ "$(wc -l < $f.axioms)" = "$n" ] && [ "$n" -gt 0 ] || return 1
  ! grep -vE '^(does not depend on any axioms|depends on axioms: \[(propext|Classical\.choice|Quot\.sound)(, (propext|Classical\.choice|Quot\.sound))*\])$' $f.axioms | grep -q .
}

s_xpin() {
  ( cd $RT && find . -type f | sort | xargs sha256sum ) > $X/reader-tests.sha256
  python3 -I /tmp/closure.py $W $P $X OAI.LinearAlgebra.SpectralBooks.DivisionExponent OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization > $X/closure.txt 2>&1
  sha256sum /tmp/closure.py > $X/closure-script.sha256
  awk 'NR==FNR{a[$2]=1; next} !($2 in a)' $R/target-SHA256SUMS $X/closure-SHA256SUMS > $X/extra-SHA256SUMS
  { cat $X/extra-SHA256SUMS; sed 's#  \./#  reader/tests/#' $X/reader-tests.sha256; } > $X/A1x-SHA256SUMS
  log "XPIN: closure of the two extra modules $(head -1 $X/closure.txt | cut -c1-120); files beyond A1: $(wc -l < $X/extra-SHA256SUMS) ($(cut -c67- $X/extra-SHA256SUMS | tr '\n' ' ' | cut -c1-400)); A1x list $(sha256sum $X/A1x-SHA256SUMS | cut -c1-16)…"
}

s_xbuild() {
  [ -s $V/SEAL-A1x.sha256 ] && [ "$(head -1 $V/SEAL-A1x.sha256 | cut -c1-64)" = "$(sha256sum $X/A1x-SHA256SUMS | cut -c1-64)" ] || stop "A1x not sealed (no SEAL-A1x.sha256 matching x/A1x-SHA256SUMS)"
  log "SEAL-A1x matches; the additions start"
  # the reader's files, regenerated from the pinned sources with its own scripts, must equal the committed ones
  mkdir -p /tmp/regen && rm -f /tmp/regen/*
  python3 -I $RT/planted/make_planted.py $W/ComparatorChallenges/MatrixExponent.lean /tmp/regen > $X/regen-planted.txt 2>&1
  python3 -I $RT/T3_division/make_division_challenge.py $W/OAI/LinearAlgebra/MatrixExponent/RationalCircuits.lean /tmp/regen > $X/regen-division.txt 2>&1
  sha256sum $W/OAI/LinearAlgebra/MatrixExponent/RationalCircuits.lean >> $X/regen-division.txt
  bad=0
  for f in V1_wireDimension_floor V2_sub_reversed V3_product_commuted V4_constant_cost_one V5_dual_Icc_0_2 V6_C_at_least_one; do
    cmp -s /tmp/regen/$f.lean $RT/planted/$f.lean || { bad=1; log "XBUILD: $f differs from its regeneration"; }
    diff $W/ComparatorChallenges/MatrixExponent.lean $RT/planted/$f.lean > $X/$f.diff
  done
  for f in ReaderDivision ReaderDivisionPlanted; do cmp -s /tmp/regen/$f.lean $RT/T3_division/$f.lean || { bad=1; log "XBUILD: $f differs from its regeneration"; }; done
  diff $RT/T3_division/ReaderDivision.lean $RT/T3_division/ReaderDivisionPlanted.lean > $X/ReaderDivision-planted.diff
  [ $bad = 0 ] && log "XBUILD: the 8 challenge files equal their regeneration from the pinned sources; diffs vs the challenge: $(for f in $X/V*.diff; do echo -n "$(basename $f .diff)=$(grep -c '^[<>]' $f) "; done)" || stop "a reader file is not what its script makes from the pinned source"
  for f in $RT/planted/V*.lean $RT/T3_division/ReaderDivision.lean $RT/T3_division/ReaderDivisionPlanted.lean; do install -o $U -g $U -m 644 $f $W/ComparatorChallenges/$(basename $f); done
  for f in $RT/T1_SquareTextbook.lean $RT/T2_AlphaOrientation.lean $RT/T4_PerN.lean $RT/T5_Eventually.lean $RT/T3_division/T3_DivisionInEnv.lean; do install -o $U -g $U -m 644 $f $A/$(basename $f); done
  step XB 14400 $W lake build OAI.LinearAlgebra.SpectralBooks.DivisionExponent OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization \
    ComparatorChallenges.V1_wireDimension_floor ComparatorChallenges.V2_sub_reversed ComparatorChallenges.V3_product_commuted \
    ComparatorChallenges.V4_constant_cost_one ComparatorChallenges.V5_dual_Icc_0_2 ComparatorChallenges.V6_C_at_least_one \
    ComparatorChallenges.ReaderDivision ComparatorChallenges.ReaderDivisionPlanted
  log "XB: built $(grep -cE '\[[0-9]+/[0-9]+\] Built' $R/XB.out) modules; errors: $(grep -c 'error' $R/XB.out)"
}

s_xf4() {
  for v in V1_wireDimension_floor V2_sub_reversed V3_product_commuted V4_constant_cost_one V5_dual_Icc_0_2 V6_C_at_least_one; do
    python3 -I -c 'import json,sys; c=json.load(open(sys.argv[1])); c["challenge_module"]="ComparatorChallenges."+sys.argv[3]; json.dump(c, open(sys.argv[2],"w"), indent=2)' $W/ComparatorChallenges/MatrixExponent.json $A/$v.json $v
    chown $U:$U $A/$v.json; cp $A/$v.json $R/X-$v-config.json
    n=X${v%%_*}CMP
    STEPENV="$(CMPENV)" step $n 14400 $W lake env $CMP $A/$v.json
    grep -q 'Your solution is okay!' $R/$n.out $R/$n.err && log "F4 $v: ACCEPTED by Comparator (!)" || log "F4 $v: refused by Comparator (exit $(ex $n)): $(grep -hiE 'mismatch|differ|not match|error' $R/$n.out $R/$n.err | head -1 | cut -c1-200)"
  done
  for j in ReaderDivision ReaderDivisionPlanted; do
    install -o $U -g $U -m 644 $RT/T3_division/$j.json $A/$j.json; cp $A/$j.json $R/X-$j-config.json
    STEPENV="$(CMPENV)" step X${j}CMP 14400 $W lake env $CMP $A/$j.json
    grep -q 'Your solution is okay!' $R/X${j}CMP.out $R/X${j}CMP.err && log "F4 T3 $j: ACCEPTED by Comparator (exit $(ex X${j}CMP))" || log "F4 T3 $j: refused by Comparator (exit $(ex X${j}CMP))"
  done
  for t in T1_SquareTextbook T2_AlphaOrientation T3_DivisionInEnv T4_PerN T5_Eventually; do
    n=X${t%%_*}
    step $n 3600 $W lake env lean $A/$t.lean
    ok3 $n $A/$t.lean && log "F4 $t: GREEN ($(sort -u $R/$n.axioms | tr '\n' ' '))" || log "F4 $t: NOT green (exit $(ex $n); $(grep -hE 'error|declaration uses' $R/$n.out $R/$n.err | head -2 | cut -c1-200 | tr '\n' ' '))"
  done
}

s_xcen() {
  install -o $U -g $U -m 644 $V/CENX.lean $A/CENX.lean; sha256sum $A/CENX.lean > $R/XCEN-file.sha256
  step XCEN 3600 $W lake env lean $A/CENX.lean
  ( cd $W && grep -lE 'divisionOmega|DivisionExponent|CircuitRankSpecialization|algebraicClosure_rank_le_twice|RationalMatrixAlgorithm|MatrixExponent\.omega_eq|contact_of_installations' ComparatorChallenges/*.json ComparatorChallenges/*.lean 2>/dev/null | grep -vE 'ReaderDivision|V[1-6]_' ) > $X/configs-naming-division.txt
  runuser -u $U -- bash -c "cd $M && git log -1 --format='%H %cI' -- lean/OAI/LinearAlgebra/MatrixMultiplication/Main.lean; git ls-tree $REPO_SHA lean/OAI/LinearAlgebra/MatrixMultiplication/Main.lean lean/ComparatorChallenges/MatrixMultiplication.json lean/ComparatorChallenges/MatrixMultiplication.lean; git log -1 --format='%H %cI' -- lean/ComparatorChallenges/MatrixMultiplication.json" > $X/n3-matrixmultiplication.txt 2>&1
  log "XCEN exit $(ex XCEN); configs (other than the reader's) naming the division theorems or omega_eq: $(wc -l < $X/configs-naming-division.txt)"
}

for s in "$@"; do log "p1x stage $s"; s_$s; done
