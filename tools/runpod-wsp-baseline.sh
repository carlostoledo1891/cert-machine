#!/usr/bin/env bash
# runpod-wsp-baseline.sh — Stage 3 of the Weight-Space Programming verification (the unedited baseline under the model
# card's settings; notes/wsp-stage3-preregistration-2026-11-02.md) on ONE RunPod GPU pod running vllm/vllm-openai:v0.33.0,
# the vLLM version of the model card's own re-run. The pod holds no credential: it fetches tools/wsp-baseline-eval.py
# and corpus/wsp/PINS.json from this repository at a fixed commit (AUDIT_SHA), downloads the public checkpoints and
# MATH-500 from Hugging Face at the pinned revisions and REFUSES bytes that differ from the pins, runs the conditions in
# CONDITIONS order (each one llm.generate over the 500 problems), and serves /results read-only on port 8000: _status.json,
# _build.txt, and per condition meta.json, samples.jsonl.gz (every text) and _run.log. tools/import-runpod-wsp.js brings
# them to the desk, where instruments/wsp/grade.py decides every answer (tools/wsp-baseline.py → certs/wsp-baseline.json).
#
# start command (entrypoint /bin/bash -c; the image has python3 but no curl is assumed):
#   python3 -c "import urllib.request as u;u.urlretrieve('https://raw.githubusercontent.com/carlostoledo1891/cert-machine/<sha>/tools/runpod-wsp-baseline.sh','/run.sh')" && bash /run.sh
# env: AUDIT_SHA; CONDITIONS (default "C1 C3 C2"; C4 = the edited checkpoint under C2); DEADLINE_HOURS (no condition
#      STARTS after this many hours since the pod began; default 6); SAMPLES (4; SAMPLES_<condition> overrides one, e.g.
#      SAMPLES_C2=1 — a deviation from the pre-registration, stated in the record when used); LIMIT (problems, 0 = all 500)
set -uo pipefail
: "${AUDIT_SHA:?}"
CONDITIONS="${CONDITIONS:-C1 C3 C2}"; DEADLINE_HOURS="${DEADLINE_HOURS:-6}"; SAMPLES="${SAMPLES:-4}"; LIMIT="${LIMIT:-0}"
RAW=https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA
R=/results; W=/w; mkdir -p $R $W
T0=$(date +%s); DONE=""
export HF_HUB_DISABLE_TELEMETRY=1 PYTHONUNBUFFERED=1
status() { python3 -c "
import json,sys,time
json.dump({'phase':sys.argv[1],'done':sys.argv[2],'audit':sys.argv[3],'conditions':sys.argv[4],'deadline_hours':float(sys.argv[5]),
           'elapsed_s':int(time.time())-int(sys.argv[6]),'updated':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())},open('$R/_status.json.tmp','w'))
" "$1" "$DONE" "$AUDIT_SHA" "$CONDITIONS" "$DEADLINE_HOURS" "$T0" && mv $R/_status.json.tmp $R/_status.json; }
status starting
(cd $R && nohup python3 -m http.server 8000 --bind 0.0.0.0 > /dev/null 2>&1 &)
fetch() { python3 -c "import urllib.request as u,sys; u.urlretrieve(sys.argv[1], sys.argv[2])" "$RAW/$1" "$W/$(basename $1)" && return 0
          for i in 1 2 3 4; do sleep $((i * 10)); python3 -c "import urllib.request as u,sys; u.urlretrieve(sys.argv[1], sys.argv[2])" "$RAW/$1" "$W/$(basename $1)" && return 0; done
          status "FAILED: fetch $1"; sleep infinity; }
fetch tools/wsp-baseline-eval.py
fetch corpus/wsp/PINS.json
{ echo "audit $AUDIT_SHA"; sha256sum $W/wsp-baseline-eval.py $W/PINS.json; nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader;
  python3 -c "import vllm, transformers, torch; print('vllm', vllm.__version__, 'transformers', transformers.__version__, 'torch', torch.__version__, 'cuda', torch.version.cuda, torch.cuda.is_available())";
  nproc; free -g | head -2; df -h / | tail -1; } > $R/_build.txt 2>&1

# --- the inputs, at their pinned revisions, refused unless the bytes match corpus/wsp/PINS.json
status "downloading the inputs"
python3 - "$CONDITIONS" > $R/_download.log 2>&1 <<'EOF'
import hashlib, json, os, sys
from huggingface_hub import snapshot_download
P = json.load(open("/w/PINS.json")); S = P["sources"]; F = P["files"]
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def check(local, rels):
    bad = []
    for rel in rels:
        p = os.path.join("/w", rel)
        got = sha(p) if os.path.exists(p) else None
        print(rel, got, "pin", F[rel]["sha256"])
        if got != F[rel]["sha256"]: bad.append(rel)
    if bad: raise SystemExit("REFUSED: bytes differ from the pins: " + ", ".join(bad))
snapshot_download(S["base"]["repo"], revision=S["base"]["revision"], local_dir="/w/base")
check("/w/base", ["base/model.safetensors-00001-of-00001.safetensors", "base/config.json", "base/model.safetensors.index.json"])
snapshot_download(S["math500"]["repo"], repo_type="dataset", revision=S["math500"]["revision"], local_dir="/w/math500")
check("/w/math500", ["math500/test.jsonl"])
if "C4" in sys.argv[1].split():
    snapshot_download(S["edited"]["repo"], revision=S["edited"]["revision"], local_dir="/w/edited")
    check("/w/edited", ["edited/model.safetensors-00001-of-00001.safetensors", "edited/config.json", "edited/model.safetensors.index.json"])
print("INPUTS-OK")
EOF
grep -q INPUTS-OK $R/_download.log || { status "FAILED: inputs (see _download.log)"; sleep infinity; }

# --- the conditions (the pre-registration's table; C4 = the edited checkpoint under C2's settings)
settings() { case "$1" in
  C1) echo "base 1 {\"temperature\":0.6,\"top_p\":0.95,\"top_k\":20,\"presence_penalty\":1.5,\"max_tokens\":32768,\"seed\":0}" ;;
  C2) echo "base 1 {\"temperature\":1.0,\"top_p\":0.95,\"top_k\":20,\"min_p\":0.0,\"presence_penalty\":1.5,\"max_tokens\":81920,\"seed\":0}" ;;
  C3) echo "base 0 {\"temperature\":1.0,\"top_p\":1.0,\"top_k\":20,\"min_p\":0.0,\"presence_penalty\":2.0,\"max_tokens\":32768,\"seed\":0}" ;;
  C4) echo "edited 1 {\"temperature\":1.0,\"top_p\":0.95,\"top_k\":20,\"min_p\":0.0,\"presence_penalty\":1.5,\"max_tokens\":81920,\"seed\":0}" ;;
  *) echo "" ;; esac; }
for c in $CONDITIONS; do
  read -r model thinking sampling <<< "$(settings $c)"
  [ -n "$model" ] || { status "FAILED: unknown condition $c"; sleep infinity; }
  if [ $(( $(date +%s) - T0 )) -gt $(python3 -c "print(int($DEADLINE_HOURS*3600))") ]; then status "deadline: $c not started"; continue; fi
  n=$(eval echo "\${SAMPLES_$c:-$SAMPLES}")     # SAMPLES_C2=1 overrides the samples per problem for one condition (recorded in its meta.json)
  mkdir -p $R/$c; status "running $c"
  python3 $W/wsp-baseline-eval.py --model $W/$model --problems $W/math500/test.jsonl --out $R/$c --condition $c \
    --thinking $thinking --sampling "$sampling" --samples $n --limit $LIMIT > $R/$c/_run.log 2>&1
  if [ $? -eq 0 ] && [ -s $R/$c/samples.jsonl.gz ]; then DONE="$DONE $c"; status "finished $c"; else status "FAILED: $c (see $c/_run.log)"; fi
done
status complete
sleep infinity
