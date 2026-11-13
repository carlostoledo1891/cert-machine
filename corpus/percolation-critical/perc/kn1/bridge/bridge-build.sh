#!/bin/bash
# bridge-build.sh LABEL TARGET... — run ON THE POD: `lake build TARGET...` in the working tree; log, exit code,
# seconds under $LOGS/LABEL.{log,exit,seconds}.
export PATH=$HOME/.elan/bin:$PATH
WORK="${WORK:-/root/kn1/third}"; LOGS="${LOGS:-/root/kn1/bridge-logs}"
label="$1"; shift
mkdir -p "$LOGS"; : > "$LOGS/$label.exit"
cd "$WORK"; t0=$(date +%s)
lake build "$@" > "$LOGS/$label.log" 2>&1; code=$?
echo $(( $(date +%s) - t0 )) > "$LOGS/$label.seconds"; echo $code > "$LOGS/$label.exit"
echo "build $label ($*): exit $code, $(cat "$LOGS/$label.seconds") s"
