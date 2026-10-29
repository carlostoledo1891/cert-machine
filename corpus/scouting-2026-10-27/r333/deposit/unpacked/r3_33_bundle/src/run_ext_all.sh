#!/bin/zsh
# Run the one-vertex extension search on every R(3,k) certificate, k=24..49, smallest first.
cd ~/record-hunt
C=data/raw/furini/ramsey-number-lower-bounds-main/lower-bounds/certificates
for k in 24 25 26 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49; do
  f=$(ls $C/R_3_${k}_graphSize_*.clq)
  echo "=== k=$k $f" >> runs/ext_all.log
  .venv/bin/python src/extend.py $f $k runs/ext_3_$k 3600 2>&1 | tail -2 >> runs/ext_all.log
done
echo DONE >> runs/ext_all.log
