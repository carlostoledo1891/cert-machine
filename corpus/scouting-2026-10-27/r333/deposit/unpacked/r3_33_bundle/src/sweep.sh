#!/bin/zsh
# usage: sweep.sh <k> <tlimit> <parallel> <group> [group...]
cd ~/record-hunt; k=$1; tl=$2; par=$3; shift 3
printf '%s\n' "$@" | xargs -P $par -I{} zsh -c "MULTI=6 .venv/bin/python src/cayley_sat8.py {} $k runs/k${k}_{} $tl > /dev/null 2>&1; echo \"{} \$(grep -h -E 'FOUND|UNSAT|TIMEOUT' runs/k${k}_{}/log.txt | tail -1)\" >> runs/sweep_k$k.log"
echo SWEEPDONE >> runs/sweep_k$k.log
