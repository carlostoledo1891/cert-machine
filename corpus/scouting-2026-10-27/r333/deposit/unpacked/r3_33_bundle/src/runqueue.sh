#!/bin/zsh
# usage: runqueue.sh <queuefile> <parallel>   (each line: k group tlimit)
cd ~/record-hunt
cat $1 | xargs -P $2 -L 1 zsh -c 'k=$0; g=$1; tl=$2; d=runs/k${k}_$g; [ -f $d/log.txt ] && grep -q -E "UNSAT|FOUND|TIMEOUT" $d/log.txt && exit 0; MULTI=6 .venv/bin/python src/cayley_sat8.py $g $k $d $tl > /dev/null 2>&1; echo "k=$k $g $(grep -h -E "FOUND|UNSAT|TIMEOUT|Error" $d/log.txt | tail -1)" >> runs/results.log'
echo QUEUEDONE >> runs/results.log
