#!/usr/bin/env bash
# runpod-lonely-runner.sh — gates of the lonely-runner re-verification (corpus/lonely-runner/preregistration.json) on ONE
# RunPod CPU pod. The pod holds no credential: it fetches instruments/lonelyrunner/{lr.c,gate.py} from this repository at
# a fixed commit (AUDIT_SHA), compiles lr.c, decides each gate with gate.py on every vCPU, and serves the records
# read-only on port 8000; tools/import-runpod-lonely-runner.js brings them into corpus/lonely-runner/runs/runpod-<pod>/.
#
# start command (ubuntu:24.04):
#   apt-get update -qq && apt-get install -y -qq curl ca-certificates < /dev/null > /dev/null \
#     && curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-lonely-runner.sh -o /run.sh \
#     && bash /run.sh
# env: AUDIT_SHA, GATES (space-separated primes, decided in order), EXTRA (optional: "233:--no-neargcd" pairs)
set -uo pipefail
: "${AUDIT_SHA:?}" "${GATES:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; mkdir -p $R /lr
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq && apt-get install -y -qq build-essential python3 curl ca-certificates < /dev/null > /dev/null
echo "{\"phase\":\"starting\",\"audit\":\"$AUDIT_SHA\",\"cpus\":$(nproc)}" > $R/_status.json
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)
for f in lr.c gate.py; do curl -fsSL "$RAW/instruments/lonelyrunner/$f" -o /lr/$f || { echo '{"phase":"FAILED: fetch"}' > $R/_status.json; sleep infinity; }; done
cc -O3 -march=native -o /lr/lr /lr/lr.c || { echo '{"phase":"FAILED: compile"}' > $R/_status.json; sleep infinity; }
sha256sum /lr/lr.c /lr/gate.py /lr/lr > $R/_build.txt; cat /proc/cpuinfo | grep -m1 "model name" >> $R/_build.txt
done_list=""
for p in $GATES; do
  echo "{\"phase\":\"deciding $p\",\"done\":\"$done_list\",\"audit\":\"$AUDIT_SHA\",\"cpus\":$(nproc),\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json
  python3 /lr/gate.py "$p" --jobs "$(nproc)" --split 3 --lr /lr/lr --out $R --label "runpod-$(hostname | cut -c1-12)" > $R/_gate-$p.log 2>&1
  done_list="$done_list $p"
done
for pair in ${EXTRA:-}; do
  p=${pair%%:*}; opt=${pair#*:}
  echo "{\"phase\":\"deciding $p $opt\",\"done\":\"$done_list\",\"audit\":\"$AUDIT_SHA\",\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json
  python3 /lr/gate.py "$p" --jobs "$(nproc)" --split 3 --lr /lr/lr --out $R --label "runpod-$(hostname | cut -c1-12)" $opt > $R/_gate-$p$opt.log 2>&1
  done_list="$done_list $p$opt"
done
echo "{\"phase\":\"complete\",\"done\":\"$done_list\",\"audit\":\"$AUDIT_SHA\",\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json
sleep infinity
