#!/usr/bin/env bash
# runpod-qiushi-lifting.sh — the Qiushi Engine's dimensions 49-55 decided pair by pair on ONE RunPod GPU pod.
# The pod holds no credential: it fetches tools/run-kissing-configs.py from this repository at a fixed commit (AUDIT_SHA),
# downloads each configuration from the claimant's public release (refused unless it matches the pins in that file),
# decides every pair on the GPU (fp16 tensor cores, exact by the Cauchy-Schwarz bound 192 < 2^11) and serves the result
# JSON read-only on port 8000; `python3 tools/run-kissing-configs.py --import DIR` records them on the desk.
#
# FIRST a calibration: dimension 32, already decided on the desk by the numpy path, is decided again by the GPU path and
# must give the same contact count (CAL_CONTACTS); otherwise the pod stops with phase FAILED and decides nothing else.
#
# image: runpod/pytorch (CUDA, torch, numpy); start command:
#   curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-qiushi-lifting.sh -o /run.sh && bash /run.sh
# env: AUDIT_SHA, DIMS (space-separated, decided in order), CAL_CONTACTS
set -uo pipefail
: "${AUDIT_SHA:?}" "${DIMS:?}" "${CAL_CONTACTS:?}"
R=/results; D=/data; mkdir -p $R $D /w
status() { echo "{\"phase\":\"$1\",\"done\":\"${done_list:-}\",\"audit\":\"$AUDIT_SHA\",\"updated\":\"$(date -u +%FT%TZ)\"}" > $R/_status.json; }
done_list=""
status starting
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)
curl -fsSL "https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA/tools/run-kissing-configs.py" -o /w/run-kissing-configs.py || { status "FAILED: fetch"; sleep infinity; }
{ sha256sum /w/run-kissing-configs.py; nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader; python3 -c "import torch, numpy; print('torch', torch.__version__, 'cuda', torch.version.cuda, 'numpy', numpy.__version__)"; nproc; free -g | head -2; } > $R/_build.txt 2>&1
# the GPU must answer before anything is decided: retried, with the device state logged (two hosts failed CUDA init)
for k in 1 2 3 4 5 6 7 8 9 10; do
  if python3 -c "import torch; torch.zeros(1, device='cuda'); print('cuda ok', torch.cuda.get_device_name(0))" >> $R/_gpu.log 2>&1; then break; fi
  { echo "attempt $k failed"; env | grep -i -E "cuda|nvidia" ; ls -l /dev/nvidia* ; nvidia-smi -L; } >> $R/_gpu.log 2>&1
  [ $k = 10 ] && { status "FAILED: CUDA does not initialise (see _gpu.log)"; sleep infinity; }
  sleep 20
done
status "calibrating on dimension 32"
python3 /w/run-kissing-configs.py 32 --backend torch --out /w/cal --cache $D > $R/_cal.log 2>&1
got=$(python3 -c "import json; print(json.load(open('/w/cal/32.json'))['bulk']['contacts'])" 2>/dev/null)
cp /w/cal/32.json $R/_cal-32.json 2>/dev/null
if [ "$got" != "$CAL_CONTACTS" ]; then status "FAILED: calibration gave $got contacts, the desk $CAL_CONTACTS"; sleep infinity; fi
done_list="cal32"
for d in $DIMS; do
  status "deciding $d"
  python3 /w/run-kissing-configs.py "$d" --backend torch --out $R --cache $D > $R/_$d.log 2>&1
  rm -f $D/configuration$d.i8.gz
  done_list="$done_list $d"
done
status complete
sleep infinity
