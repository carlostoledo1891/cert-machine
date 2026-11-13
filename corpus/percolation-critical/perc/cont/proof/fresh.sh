#!/bin/bash
# fresh.sh — leanchecker --fresh on the proof module (replays the whole import closure in the kernel).
export PATH=$HOME/.elan/bin:$PATH
cd /root/cont/percolation
S=$(date +%s)
lake env leanchecker --fresh ContProof > /root/cont/logs/fresh.log 2>&1
E=$?
echo "leanchecker --fresh ContProof exit=$E seconds=$(( $(date +%s) - S )) utc=$(date -u +%FT%TZ)" > /root/cont/logs/fresh.exit
