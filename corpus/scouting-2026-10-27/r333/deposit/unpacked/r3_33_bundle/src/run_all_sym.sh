#!/bin/zsh
# Runs the three symmetric-circulant queues in order (cyclic k<=35, abelian, cyclic k=36..49).
cd ~/record-hunt
P=${1:-4}
src/runqueue_sym.sh runs/queue_sym.txt $P
src/runqueue_sym.sh runs/queue_symab.txt $P
src/runqueue_sym.sh runs/queue_sym2.txt $P
echo ALLDONE >> runs/symresults.log
