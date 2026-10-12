#!/usr/bin/env bash
# runpod-sidorenko.sh — the Sidorenko measurement pilot (corpus/sidorenko/preregistration.json) on ONE RunPod GPU pod.
# The pod holds no credential: it fetches instruments/sidorenko/{pilot.py,battery.py} and the pre-registration from this
# repository at a fixed commit (AUDIT_SHA), runs the battery (torch against numpy included; it must exit 0 or nothing is
# searched), then searches within BUDGET_HOURS, deciding each cell's best kernel exactly (float64 residues on the GPU,
# CRT, one extra prime). Results are served read-only on port 8000 and tarred at the end (results.tar.gz); on the desk,
# `python3 instruments/sidorenko/pilot.py certify DIR` decides every saved kernel again on the CPU.
#
# The pilot stops itself at BUDGET_HOURS; the $10 cap is the parent's to enforce: terminate the pod at $10 billed.
#
# image: runpod/pytorch (CUDA, torch, numpy); start command:
#   curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-sidorenko.sh -o /run.sh && bash /run.sh
# env: AUDIT_SHA, BUDGET_HOURS (= (10 - 0.3 x price) / price, per the pre-registration)
set -uo pipefail
: "${AUDIT_SHA:?}" "${BUDGET_HOURS:?}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; W=/w; mkdir -p $R $W/sidorenko
status() { echo "{\"phase\":\"$1\",\"audit\":\"$AUDIT_SHA\",\"budgetHours\":$BUDGET_HOURS,\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json; }
status starting
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)
for f in instruments/sidorenko/pilot.py instruments/sidorenko/battery.py corpus/sidorenko/preregistration.json; do
  curl -fsSL "$RAW/$f" -o "$W/sidorenko/$(basename $f)" || { status "FAILED: fetch $f"; sleep infinity; }
done
{ sha256sum $W/sidorenko/*; nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader;
  python3 -c "import torch, numpy; print('torch', torch.__version__, 'cuda', torch.version.cuda, torch.cuda.is_available(), 'numpy', numpy.__version__)";
  nproc; free -g | head -2; } > $R/_build.txt 2>&1
status battery
cd /tmp
python3 -I $W/sidorenko/battery.py --source /nonexistent > $R/_battery.log 2>&1
if [ $? -ne 0 ]; then status "FAILED: battery (see _battery.log)"; sleep infinity; fi
python3 -I $W/sidorenko/pilot.py time --n 8,16,24,32 --batch 2 --reps 3 --backend torch --json $R/_timing.json > $R/_timing.log 2>&1
# the pilot rewrites _status.json while it runs
python3 -I $W/sidorenko/pilot.py search --prereg $W/sidorenko/preregistration.json --budget-hours "$BUDGET_HOURS" \
  --out $R --backend torch > $R/_search.log 2>&1
rc=$?
tar -czf /tmp/results.tar.gz -C $R . && mv /tmp/results.tar.gz $R/results.tar.gz
if [ $rc -ne 0 ]; then status "FAILED: search exited $rc (see _search.log)"; else status complete; fi
sleep infinity
