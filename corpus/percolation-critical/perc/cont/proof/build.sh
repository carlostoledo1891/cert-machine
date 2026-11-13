#!/bin/bash
# build.sh TARGET TAG — one lake build in /root/cont/percolation, log + exit + seconds under /root/cont/logs
export PATH=$HOME/.elan/bin:$PATH
cd /root/cont/percolation
mkdir -p /root/cont/logs
T=$1; TAG=$2
S=$(date +%s)
lake build $T > /root/cont/logs/$TAG.log 2>&1
E=$?
echo "target=$T exit=$E seconds=$(( $(date +%s) - S )) utc=$(date -u +%FT%TZ)" > /root/cont/logs/$TAG.exit
