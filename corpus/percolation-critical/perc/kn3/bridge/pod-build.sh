#!/bin/bash
# pod-build.sh LABEL TARGET... — run ON THE POD: `lake build TARGET...` in the working tree; log, exit code, seconds
# under /root/kn3/logs/LABEL.{log,exit,seconds}.
export PATH=$HOME/.elan/bin:$PATH
WORK="${WORK:-/root/kn3/percolation}"
LOGS="${LOGS:-/root/kn3/logs}"
label="$1"; shift
mkdir -p "$LOGS"; rm -f "$LOGS/$label.exit"
cd "$WORK"
t0=$(date +%s)
lake build "$@" > "$LOGS/$label.log" 2>&1
code=$?
echo $(( $(date +%s) - t0 )) > "$LOGS/$label.seconds"
echo $code > "$LOGS/$label.exit"
