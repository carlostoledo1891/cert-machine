#!/usr/bin/env bash
# Red controls for Bridge A: the same Bridge.lean against three planted copies of Textbook.lean.
# Each must FAIL to build. The true Textbook.lean is restored (sha256 checked) and rebuilt at the end.
set -uo pipefail
export PATH=$HOME/.elan/bin:$HOME/.cargo/bin:$PATH
W=/root/bridgeA; R=$W/red; PR=$W/percolation; mkdir -p $R
TRUE=4dc732f55e6a2d87a19f3e62c175fdb738abebeaf1abc91f7b0e52c8c1e641ae
cd $PR
echo "$TRUE  Textbook.lean" | sha256sum -c - || { echo "Textbook.lean is not the sealed one before the controls"; exit 2; }
cp Textbook.lean $R/Textbook.true.lean

# R1: theta(p_c) = 1 in Statement
sed 's/θ d ⟨pc d, h⟩ = 0/θ d ⟨pc d, h⟩ = 1/' $R/Textbook.true.lean > $R/Textbook.R1.lean
# R2: 1 <= d in Statement
sed 's/∀ d : ℕ, 2 ≤ d →/∀ d : ℕ, 1 ≤ d →/' $R/Textbook.true.lean > $R/Textbook.R2.lean
# R3: pc := sInf {p | 0 < theta p}, no union with {1}
sed -e 's/  sSup {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, θ d ⟨p, h⟩ = 0}/  sInf {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, 0 < θ d ⟨p, h⟩}/' $R/Textbook.true.lean > $R/Textbook.R3.lean

for r in R1 R2 R3; do
  diff $R/Textbook.true.lean $R/Textbook.$r.lean > $R/$r.diff
  n=$(grep -c '^>' $R/$r.diff)
  echo "$r: planted lines changed = $n"
  [ "$n" = 1 ] || { echo "$r: the plant did not apply exactly once"; cp $R/Textbook.true.lean Textbook.lean; exit 3; }
  cp $R/Textbook.$r.lean Textbook.lean
  t0=$(date +%s)
  lake build Bridge > $R/$r.log 2>&1
  rc=$?
  echo $rc > $R/$r.exit; echo $(( $(date +%s) - t0 )) > $R/$r.seconds
  first=$(grep -m1 '^error: Bridge.lean' $R/$r.log || grep -m1 '^error' $R/$r.log)
  echo "$r: exit $rc ($(cat $R/$r.seconds) s); first error: $first"
  cp $R/Textbook.true.lean Textbook.lean
done

echo "$TRUE  Textbook.lean" | sha256sum -c - || { echo "restore FAILED"; exit 4; }
t0=$(date +%s)
lake build Bridge > $R/restore.log 2>&1
rc=$?; echo $rc > $R/restore.exit
echo "restore build: exit $rc ($(( $(date +%s) - t0 )) s); $(tail -1 $R/restore.log)"
lake env lean Axioms.lean > $R/axioms-after-restore.out 2>&1; echo "axioms after restore exit $?"; cat $R/axioms-after-restore.out
sha256sum Textbook.lean > $R/sha256-after.txt; cat $R/sha256-after.txt
echo "red controls done"
