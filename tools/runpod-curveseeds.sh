#!/usr/bin/env bash
# runpod-curveseeds.sh — the optional point-counting lane of the NIST curve-seeds audit (R1: the skipped candidates) on
# ONE RunPod CPU pod. The pod holds no credential: it fetches the decider, the pre-registration, the published parameters
# and the scan script from this repository at a fixed commit (AUDIT_SHA), installs PARI/GP with the seadata tables from
# the distribution, counts points on every vCPU, and serves the result read-only on port 8000;
# tools/import-runpod-curveseeds.js brings it into corpus/curveseeds/scan.json. Counted APART from the certificate.
#
# start command (ubuntu:24.04):
#   apt-get update -qq && apt-get install -y -qq curl ca-certificates < /dev/null > /dev/null \
#     && curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-curveseeds.sh -o /run.sh \
#     && bash /run.sh
# env: AUDIT_SHA, RUNS (space-separated curve names; a group is scanned to its largest index), JOBS (optional; default nproc)
set -uo pipefail
: "${AUDIT_SHA:?}" "${RUNS:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; W=/work; mkdir -p $R $W/instruments/curveseeds $W/corpus/curveseeds $W/tools $W/certs
export DEBIAN_FRONTEND=noninteractive
status() { echo "{\"phase\":\"$1\",\"audit\":\"$AUDIT_SHA\",\"cpus\":$(nproc),\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json; }
status starting
apt-get update -qq && apt-get install -y -qq python3 pari-gp pari-seadata curl ca-certificates < /dev/null > /dev/null || { status "FAILED: apt"; sleep infinity; }
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)        # after apt: ubuntu:24.04 ships no python3, so the server could not start before it
for f in instruments/curveseeds/decide.py corpus/curveseeds/preregistration.json corpus/curveseeds/published.json tools/curveseeds-scan.py; do
  curl -fsSL "$RAW/$f" -o "$W/$f" || { status "FAILED: fetch $f"; sleep infinity; }
done
sed -i "s#^GP = .*#GP = '$(command -v gp)'#" $W/tools/curveseeds-scan.py
{ sha256sum $W/instruments/curveseeds/decide.py $W/corpus/curveseeds/published.json $W/tools/curveseeds-scan.py; gp --version-short 2>&1 | head -1; dpkg -s pari-seadata 2>/dev/null | grep -m1 Version; grep -m1 "model name" /proc/cpuinfo; } > $R/_build.txt
status "scanning $RUNS"
( cd $W && python3 -I tools/curveseeds-scan.py --jobs "${JOBS:-$(nproc)}" --out $R/curveseeds-scan.json $RUNS ) > $R/_scan.log 2>&1 \
  && status "complete" || status "FAILED: scan (see _scan.log)"
sleep infinity
