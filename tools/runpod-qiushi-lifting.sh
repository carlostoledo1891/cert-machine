#!/usr/bin/env bash
# runpod-qiushi-lifting.sh — the Qiushi Engine's dimensions 49-55 decided pair by pair on ONE RunPod GPU pod.
# The pod holds no credential: it fetches tools/run-kissing-configs.py from this repository at a fixed commit (AUDIT_SHA),
# downloads each configuration from the claimant's public release (refused unless it matches the pins in that file),
# decides every pair on the GPU (fp16 tensor cores, exact by the Cauchy-Schwarz bound 192 < 2^11) and serves the result
# JSON read-only on port 8000; `python3 tools/run-kissing-configs.py --import DIR` records them on the desk.
#
# FIRST a calibration: dimensions already decided on the desk by the numpy path (32; 39, two norms) are decided again by the
# GPU path and must give the same contact counts (CAL); otherwise the pod stops with phase FAILED and decides nothing else.
#
# image: runpod/pytorch (CUDA, torch, numpy); start command:
#   curl -fsSL https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-qiushi-lifting.sh -o /run.sh && bash /run.sh
# env: AUDIT_SHA, DIMS (space-separated, decided in order), CAL ("32:358430976 39:325490632", desk contact counts), BACKEND (triton | torch)
set -uo pipefail
: "${AUDIT_SHA:?}" "${DIMS:?}" "${CAL:?}"
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
BACKEND="${BACKEND:-triton}"
# CAL: "dim:contacts ..." decided on the desk; the GPU path must give the same contact counts, or nothing else runs
for pair in $CAL; do
  cd_=${pair%%:*}; want=${pair#*:}
  status "calibrating on dimension $cd_"
  python3 /w/run-kissing-configs.py $cd_ --backend $BACKEND --out /w/cal --cache $D > $R/_cal-$cd_.log 2>&1
  got=$(python3 -c "import json; d=json.load(open('/w/cal/$cd_.json')); print(d['bulk']['contacts'] if d['verdict'] == 'WITNESSED' and d['second']['agree'] else 'refused')" 2>/dev/null)
  cp /w/cal/$cd_.json $R/_cal-$cd_.json 2>/dev/null
  if [ "$got" != "$want" ]; then status "FAILED: calibration on $cd_ gave $got contacts, the desk $want"; sleep infinity; fi
  done_list="$done_list cal$cd_"
done
for d in $DIMS; do
  status "deciding $d"
  python3 /w/run-kissing-configs.py "$d" --backend $BACKEND --out $R --cache $D > $R/_$d.log 2>&1
  rm -f $D/configuration$d.i8.gz
  done_list="$done_list $d"
done
status complete
sleep infinity
