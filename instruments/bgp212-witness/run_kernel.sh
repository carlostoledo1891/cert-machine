#!/bin/bash
# usage: run_kernel.sh TAG NPROC  -- runs the kernel over all primes not yet in work/TAG/res_*.txt
TAG=$1; NP=${2:-4}
cd "$(dirname "$0")"
DONE=$(cat work/$TAG/res_*.txt 2>/dev/null | awk '{print $1}' | sort -u)
TODO=$(comm -23 <(sort -u work/$TAG/primes.txt) <(echo "$DONE" | sort -u))
i=0
for p in $TODO; do echo $p >> work/$TAG/todo_$((i % NP)).lst; i=$((i+1)); done
for j in $(seq 0 $((NP-1))); do
  [ -f work/$TAG/todo_$j.lst ] || continue
  LST=$(cat work/$TAG/todo_$j.lst); rm work/$TAG/todo_$j.lst
  nohup ./kernel work/$TAG/input.txt work/$TAG/res_$j.txt $LST >> logs/kernel_${TAG}_$j.log 2>&1 &
done
wait
echo "all kernel workers finished for $TAG"
