#!/usr/bin/env bash
# runpod-ramsey.sh — one orbital-kernel search (instruments/ramsey/orbital.c) on ONE RunPod CPU pod. The pod holds no
# credential: it fetches the kernel, the runner that writes its input (tools/run-ramsey-ledger.py --emit) with the three
# modules it imports, and the pinned graph from this repository at a fixed commit (AUDIT_SHA); refuses a graph that is
# not the pinned bytes; searches on every vCPU for at most BUDGET seconds; and serves the progress read-only on port 8000.
# tools/import-runpod-ramsey.py brings it into corpus/ramsey/runs/, and the runner re-reads it (--reread).
#
# start command (ubuntu:24.04):
#   apt-get update -qq && apt-get install -y -qq curl ca-certificates < /dev/null > /dev/null \
#     && curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-ramsey.sh -o /run.sh \
#     && bash /run.sh
# env: AUDIT_SHA, JOB (an AlphaEvolve file name, e.g. R_8_18_ge_1052), SIDE (I), BUDGET (seconds of search),
#      FLAGS (kernel flags, e.g. "-b -R": split into branches, cheap roots first)
set -uo pipefail
: "${AUDIT_SHA:?}" "${JOB:?}" "${SIDE:?}" "${BUDGET:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; W=/cm; mkdir -p $R $W/tools $W/instruments/ramsey $W/corpus/ramsey/alphaevolve/graphs
export DEBIAN_FRONTEND=noninteractive
status() { echo "{\"phase\":\"$1\",\"audit\":\"$AUDIT_SHA\",\"job\":\"$JOB.$SIDE\",\"cpus\":$(nproc),\"updated\":\"$(date -u +%FT%TZ)\"$2}" > $R/_status.json; }
status starting ""
apt-get update -qq && apt-get install -y -qq build-essential python3 curl ca-certificates < /dev/null > /dev/null || { status "FAILED: apt" ""; sleep infinity; }
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)    # after apt: ubuntu:24.04 ships no python3
fetch() { for i in 1 2 3 4 5; do curl -fsSL "$RAW/$1" -o "$W/$1" && return 0; sleep $((i * 5)); done; status "FAILED: fetch $1" ""; sleep infinity; }
for f in tools/run-ramsey-ledger.py instruments/ramsey/graph.py instruments/ramsey/clique.py instruments/ramsey/orbital.py \
         instruments/ramsey/orbital.c corpus/ramsey/alphaevolve/PINS.json corpus/ramsey/alphaevolve/graphs/$JOB.txt; do fetch $f; done
want=$(python3 -c "import json; print(json.load(open('$W/corpus/ramsey/alphaevolve/PINS.json'))['files']['graphs/$JOB.txt']['sha256'])")
got=$(sha256sum $W/corpus/ramsey/alphaevolve/graphs/$JOB.txt | cut -d' ' -f1)
[ "$want" = "$got" ] || { status "FAILED: the graph is not the pinned bytes" ""; sleep infinity; }
cc -O3 -march=native -o $W/orbital $W/instruments/ramsey/orbital.c -lpthread || { status "FAILED: compile" ""; sleep infinity; }
python3 $W/tools/run-ramsey-ledger.py --emit $JOB $SIDE > $W/input.txt || { status "FAILED: emit" ""; sleep infinity; }
{ sha256sum $W/instruments/ramsey/orbital.c $W/tools/run-ramsey-ledger.py $W/corpus/ramsey/alphaevolve/graphs/$JOB.txt $W/input.txt $W/orbital
  grep -m1 "model name" /proc/cpuinfo; cc --version | head -1; echo "flags: ${FLAGS:-} budget: $BUDGET threads: $(nproc)"; } > $R/_build.txt
P=$R/$JOB.$SIDE.orbital.progress; touch $P
start=$(date +%s)
status searching ",\"started\":\"$(date -u +%FT%TZ)\""
( while sleep 60; do
    status searching ",\"elapsed\":$(( $(date +%s) - start )),\"unitsDone\":$(wc -l < $P),\"nodesInDoneUnits\":$(awk '{s+=$4} END {print s+0}' $P)"
  done ) &
mon=$!
$W/orbital -t $(nproc) -s $BUDGET -d $P -r $R/$JOB.$SIDE.orbital.roots ${FLAGS:-} < $W/input.txt > $R/$JOB.$SIDE.orbital.json 2> $R/_kernel.err
kill $mon
status complete ",\"elapsed\":$(( $(date +%s) - start )),\"threads\":$(nproc)"
sleep infinity
