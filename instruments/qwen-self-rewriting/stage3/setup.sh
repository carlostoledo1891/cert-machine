#!/usr/bin/env bash
# setup.sh — Stage 3 of the audit of "Language Models Can Rewrite Their Own Weights" (arXiv 2611.21885 v2): the pod's
# inputs, before any token is generated (notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md, rows P1–P3).
# Called by run.sh; writes /results/setup/ and prints SETUP-OK as its last line only when every refusal check passed.
#
#   code     the Stage 3 files from this repository at AUDIT_SHA (raw.githubusercontent.com), each sha256 recorded;
#            the draw and the specification must hash to PINS.json
#   build    GPU, driver, vLLM, torch, transformers, huggingface_hub, safetensors versions; CPU, RAM, disk
#   P1       Qwen/Qwen3.5-27B at commit 81a287ca (never `main`) into /w/base; the 11 shards hashed whole, in parallel,
#            against their LFS sha256; config.json, the index, README.md, generation_config.json and tokenizer.json
#            against PINS.json; every other file's sha256 recorded. The download's seconds and bytes are recorded.
#   MV       math-verify 0.9.0 and its four dependencies from PyPI with --require-hashes into /w/mvlib (a reading only;
#            a failure here is recorded and stops nothing)
#   P2       apply_edit.py --selftest (K1, K2 caught), apply_edit.py into /w/edited (hash checks), then
#            verify_edit_torch.py (the second reader). Any failure: no SETUP-OK.
set -uo pipefail
: "${AUDIT_SHA:?}"
CODE_URL="${CODE_URL:-https://raw.githubusercontent.com/carlostoledo1891/cert-machine/$AUDIT_SHA}"
R=/results; S=$R/setup; W=/w; C=$W/code
mkdir -p $S $C
export HF_HUB_DISABLE_TELEMETRY=1 PYTHONUNBUFFERED=1
say() { echo "$(date -u +%FT%TZ) $*" | tee -a $S/_setup.log; }
die() { say "SETUP-FAILED: $*"; exit 1; }

FILES="instruments/qwen-self-rewriting/stage3/run.sh instruments/qwen-self-rewriting/stage3/client.py
instruments/qwen-self-rewriting/stage3/project.py instruments/qwen-self-rewriting/stage3/state.py
instruments/qwen-self-rewriting/stage3/apply_edit.py instruments/qwen-self-rewriting/stage3/verify_edit_torch.py
instruments/qwen-self-rewriting/stage3/mv_grade.py instruments/qwen-self-rewriting/stage3/setup.sh
corpus/qwen-self-rewriting/stage3/PINS.json corpus/qwen-self-rewriting/stage3/draw-490.jsonl
corpus/qwen-self-rewriting/runs/stage1/py/session8-edit-spec.json"
say "code from $CODE_URL"
for f in $FILES; do
  ok=0
  for i in 1 2 3 4 5; do
    python3 -c "import urllib.request as u,sys; u.urlretrieve(sys.argv[1], sys.argv[2])" "$CODE_URL/$f" "$C/$(basename $f)" && { ok=1; break; }
    sleep $((i * 10))
  done
  [ $ok = 1 ] || die "fetch $f"
done
(cd $C && sha256sum * > $S/code.sha256)
python3 - $C <<'EOF' || die "the draw or the specification differs from PINS.json"
import hashlib, json, sys, os
c = sys.argv[1]; P = json.load(open(os.path.join(c, "PINS.json")))
sha = lambda p: hashlib.sha256(open(p, "rb").read()).hexdigest()
assert sha(os.path.join(c, "draw-490.jsonl")) == P["draw"]["sha256"], "draw"
assert sha(os.path.join(c, "session8-edit-spec.json")) == P["edit"]["sha256"], "spec"
print("pins ok")
EOF

{ echo "audit $AUDIT_SHA"; date -u +%FT%TZ
  nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
  python3 -c "import sys, vllm, torch, transformers, huggingface_hub, safetensors; print('python', sys.version.split()[0], 'vllm', vllm.__version__, 'torch', torch.__version__, 'cuda', torch.version.cuda, torch.cuda.is_available(), 'transformers', transformers.__version__, 'huggingface_hub', huggingface_hub.__version__, 'safetensors', safetensors.__version__)"
  python3 -m pip --version; nproc; free -g | head -2; df -h / /w 2>/dev/null | tail -n +2; } > $S/build.txt 2>&1
say "$(cat $S/build.txt | tr '\n' ' ' | cut -c1-400)"

# --- P1: the base at the pinned commit
say "P1: downloading Qwen/Qwen3.5-27B at the pinned commit"
python3 - $C/PINS.json > $S/download.log 2>&1 <<'EOF' || die "download (see setup/download.log)"
import json, sys, time, os
from huggingface_hub import snapshot_download
P = json.load(open(sys.argv[1]))["model"]
t0 = time.time()
snapshot_download(P["repo"], revision=P["commit"], local_dir="/w/base", max_workers=16)
by = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk("/w/base") for f in fs if ".cache" not in d)
json.dump({"seconds": round(time.time() - t0, 1), "bytes": by, "MB_per_s": round(by / 1e6 / max(1e-9, time.time() - t0), 1)},
          open("/results/setup/download.json", "w"))
print("DOWNLOAD-OK", round(time.time() - t0, 1), by)
EOF
say "$(tail -1 $S/download.log)"
say "P1: hashing the 11 shards whole"
(cd /w/base && ls model.safetensors-*-of-00011.safetensors | xargs -P 11 -n 1 sha256sum > $S/shards.sha256) || die "hash"
python3 - $C/PINS.json $S/shards.sha256 > $S/p1.json <<'EOF' || die "P1: a file differs from its pin (setup/p1.json)"
import hashlib, json, os, sys
P = json.load(open(sys.argv[1]))["model"]
got = dict(reversed(l.split()) for l in open(sys.argv[2]) if l.strip())
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 22), b""): h.update(b)
    return h.hexdigest()
rows, bad = [], []
for s in P["shards"]:
    p = "/w/base/" + s["file"]
    ok = got.get(s["file"]) == s["sha256"] and os.path.getsize(p) == s["bytes"]
    rows.append({"file": s["file"], "sha256": got.get(s["file"]), "equals_pin": ok}); bad += [] if ok else [s["file"]]
whole = {}
for f, want in P["whole_files"].items():
    g = sha("/w/base/" + f) if os.path.exists("/w/base/" + f) else None
    whole[f] = {"sha256": g, "equals_pin": g == want}; bad += [] if g == want else [f]
other = {f: sha("/w/base/" + f) for f in sorted(os.listdir("/w/base")) if os.path.isfile("/w/base/" + f)
         and f not in P["whole_files"] and not f.startswith("model.safetensors-")}
print(json.dumps({"commit": P["commit"], "shards": rows, "whole_files": whole, "other_files": other, "passed": not bad, "failed": bad}, indent=1))
sys.exit(1 if bad else 0)
EOF
say "P1 passed"

# --- the paper's grader, as a reading (never blocks)
say "MV: math-verify 0.9.0 into /w/mvlib"
python3 - $C/PINS.json > $W/mv-req.txt <<'EOF'
import json, sys
M = json.load(open(sys.argv[1]))["math_verify"]
for req, w in zip(M["requirements"], M["wheels"]): print(req, "--hash=sha256:" + w["sha256"])
EOF
if python3 -m pip install --no-deps --require-hashes --only-binary=:all: --target $W/mvlib -r $W/mv-req.txt > $S/mv-install.log 2>&1 \
   && python3 -c "import sys; sys.path.insert(0, '$W/mvlib'); import math_verify, sympy; from math_verify import parse, verify; print('MV-OK', sympy.__version__, verify(parse('\$\\\\frac{1}{2}\$'), parse('\$0.5\$')))" >> $S/mv-install.log 2>&1; then
  say "MV: $(tail -1 $S/mv-install.log)"
else
  say "MV: NOT AVAILABLE (setup/mv-install.log); the reading will be missing, nothing else changes"
fi

# --- P2: the edit, on the pod, hash-checked twice
say "P2: the edit's controls"
python3 $C/apply_edit.py --selftest --spec $C/session8-edit-spec.json --base /w/base > $S/edit-selftest.json 2>&1 || die "P2: a planted error was not caught (setup/edit-selftest.json)"
SPEC_SHA=$(python3 -c "import json; print(json.load(open('$C/PINS.json'))['edit']['sha256'])")
say "P2: applying the edit into /w/edited"
python3 $C/apply_edit.py --spec $C/session8-edit-spec.json --spec-sha $SPEC_SHA --base /w/base --out /w/edited --record $S/edit.json > $S/edit.log 2>&1 || die "P2: apply_edit refused (setup/edit.log)"
say "$(tail -1 $S/edit.log)"
python3 $C/verify_edit_torch.py /w/base /w/edited $C/session8-edit-spec.json $S/edit-second-reader.json > $S/edit-second-reader.log 2>&1 || die "P2: the second reader refused (setup/edit-second-reader.json)"
say "$(tail -1 $S/edit-second-reader.log)"
say "SETUP-OK"
