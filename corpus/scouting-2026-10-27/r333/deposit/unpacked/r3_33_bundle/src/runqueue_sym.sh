#!/bin/zsh
# usage: runqueue_sym.sh <queuefile> <parallel>   (each line: k group h) multiplier-invariant circulant search
cd ~/record-hunt
cat $1 | xargs -P $2 -L 1 zsh -c 'k=$0; g=$1; h=$2; d=runs/sym/k${k}_${g}_h$h; [ -f $d/log.txt ] && grep -q -E "UNSAT|FOUND|TIMEOUT|CANDIDATE" $d/log.txt && exit 0; HMUL=$h MULTI=6 .venv/bin/python src/cayley_sat9.py $g $k $d ${TL:-300} > /dev/null 2>&1; echo "k=$k $g h=$h $(grep -h -E "FOUND|UNSAT|TIMEOUT|CANDIDATE|Error" $d/log.txt | tail -1)" >> runs/symresults.log'
echo QUEUEDONE >> runs/symresults.log
