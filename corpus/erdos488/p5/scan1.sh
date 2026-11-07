#!/bin/sh
# P5 scan 1: A = P-smooth numbers in (T, cT]; P = the first r primes (with 2) or the first r odd primes; M = 10^7.
M=10000000
PR="2 3 5 7 11 13 17 19 23 29 31 37 41"
for odd in 0 1; do for r in 1 2 3 4 5 6 7 8 9 10 11 12; do
  if [ $odd = 0 ]; then P=$(echo $PR | cut -d' ' -f1-$r); else P=$(echo $PR | cut -d' ' -f2-$((r+1))); fi
  for c in 2 3 4 6 8 12 16 32 64 128 256; do T=1; while [ $((c*T*10)) -lt $M ]; do echo "$M $c $T $P"; T=$((T*2)); done; done
done; done
