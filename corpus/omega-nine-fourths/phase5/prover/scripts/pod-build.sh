#!/usr/bin/env bash
# pod-build.sh STAGE : run as `prover`. STAGE sealed = deploy + build the sealed byte copy and the two challenge modules;
# STAGE main = build RectProof.Main and print the axioms; logs in /home/prover/work/.
set -uo pipefail
export HOME=/home/prover PATH=/pin/lean/bin:/usr/local/bin:/usr/bin:/bin
W=/home/prover/work; L=$W/math/lean
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" >> $W/p5.log; }
case "$1" in
  sealed)
    bash $W/scripts/pod-deploy.sh > $W/deploy.txt 2>&1
    cd $L && nice -n 10 lake build RectProof.Rect RectChallenges.Rect RectChallenges.RectPlanted > $W/build-sealed.log 2>&1
    log "sealed build exit $?" ;;
  main)
    bash $W/scripts/pod-deploy.sh > $W/deploy.txt 2>&1
    cd $L && nice -n 10 lake build RectProof.Main > $W/build-main.log 2>&1; e=$?
    log "main build exit $e"
    if [ $e = 0 ]; then nice -n 10 lake env lean RectAxioms.lean > $W/axioms.txt 2>&1; log "axioms exit $?"; fi ;;
esac
date -u > $W/DONE-$1
