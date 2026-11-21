#!/usr/bin/env bash
# rerun.sh — re-run cert-machine's decision of Levent Alpöge's Lean release (alpo.ge, 2026-11-20) on a machine of your own,
# with the same scripts, in the same order, from the same commit. Needs: Linux x86-64 (Debian/Ubuntu), root, network,
# >= 320 GB of free disk, >= 256 GB of memory (nanoda peaks near 90 GB, the build and leanchecker less), ideally >= 32 vCPU
# (the build ran at ~150 files a minute on 32 vCPU: about 20 hours). Results land in /results; then compare them with ours:
#   python3 -I tools/check-alpoge-grh.py --compare-run /results      (from a checkout of the same commit)
# usage: AUDIT_SHA=<cert-machine commit> bash rerun.sh
set -uo pipefail
: "${AUDIT_SHA:?set AUDIT_SHA to the cert-machine commit you are re-running}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
mkdir -p /opt/rerun && cd /opt/rerun
for s in p1 p2tools p2 p3-bridge p4 setupclean; do
  curl -fsSL --retry 5 "$RAW/tools/runpod-alpoge-grh-$s.sh" -o $s.sh || { echo "cannot fetch $s"; exit 1; }
done
sha256sum *.sh | tee /opt/rerun/scripts.sha256
# the waiting phases start first (each waits on /results/_phase.log), then phase 1 in the foreground
mkdir -p /results
nohup bash setupclean.sh > /results/setupclean.out 2>&1 &
AUDIT_SHA=$AUDIT_SHA nohup bash p2tools.sh > /results/p2tools.log 2>&1 &
AUDIT_SHA=$AUDIT_SHA nohup bash p2.sh > /results/p2.log 2>&1 &
AUDIT_SHA=$AUDIT_SHA nohup bash p3-bridge.sh > /results/p3.log 2>&1 &
AUDIT_SHA=$AUDIT_SHA nohup bash p4.sh > /results/p4.log 2>&1 &
AUDIT_SHA=$AUDIT_SHA bash p1.sh 2>&1 | tee /results/p1.log
echo "phase 1 has ended; phases 2-4 continue in the background: tail -f /results/_phase.log"
