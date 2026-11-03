#!/usr/bin/env python3
"""wsp-baseline-eval.py — Stage 3 of the Weight-Space Programming verification, the part that runs on the GPU: ONE
pre-registered condition (notes/wsp-stage3-preregistration-2026-11-02.md) of MATH-500 generated with vLLM, exactly the
post's protocol (code/evaluate.py of RikiyaT/lm_understand-logs, read, never run): the chat template with the thinking
switch, the user turn = problem + "\\n" + the model card's instruction, SAMPLES samples per problem, seed 0, one
llm.generate over the whole set.

It generates and records; it grades NOTHING. Every text comes back to the desk (samples.jsonl.gz: id, sample index,
finish reason, token count, text), where instruments/wsp/grade.py decides each answer and tools/wsp-baseline.py writes
the record. meta.json carries the sampling dict, the thinking flag, the versions, the GPU, the sha256 of the chat
template and of the prompts, the wall-clock and the token sum.

usage: python3 wsp-baseline-eval.py --model DIR --problems test.jsonl --out DIR --condition C1 --thinking 0|1
                                    --sampling '{"temperature":0.6,...,"max_tokens":32768,"seed":0}' [--samples 4] [--limit N]
MIT"""
import argparse
import gzip
import hashlib
import json
import os
import sys
import threading
import time

INSTRUCTION = "Please reason step by step, and put your final answer within \\boxed{}."


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--problems", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--condition", required=True)
    ap.add_argument("--thinking", type=int, required=True)
    ap.add_argument("--sampling", required=True)
    ap.add_argument("--samples", type=int, default=4)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--gpu-mem", type=float, default=0.85)
    a = ap.parse_args()
    sampling = json.loads(a.sampling)
    rows = [json.loads(l) for l in open(a.problems, encoding="utf-8") if l.strip()]
    if a.limit:
        rows = rows[: a.limit]
    os.makedirs(a.out, exist_ok=True)
    thinking = bool(a.thinking)

    import torch
    import transformers
    import vllm
    from transformers import AutoTokenizer
    from vllm import LLM, SamplingParams

    tok = AutoTokenizer.from_pretrained(a.model)
    prompts = [tok.apply_chat_template([{"role": "user", "content": r["problem"] + "\n" + INSTRUCTION}],
                                       tokenize=False, add_generation_prompt=True, enable_thinking=thinking) for r in rows]
    ct = os.path.join(a.model, "chat_template.jinja")
    meta = {
        "condition": a.condition, "model_dir": a.model, "thinking": thinking, "sampling": sampling, "samples": a.samples,
        "n_problems": len(rows), "instruction": INSTRUCTION, "prompt_form": "problem + '\\n' + instruction, one user turn, "
        "add_generation_prompt, enable_thinking=" + str(thinking),
        "prompts_sha256": hashlib.sha256("\n".join(prompts).encode("utf-8")).hexdigest(),
        "chat_template_sha256": sha256_file(ct) if os.path.exists(ct) else None,
        "prompt_example": prompts[0],
        "versions": {"vllm": vllm.__version__, "transformers": transformers.__version__, "torch": torch.__version__,
                     "cuda": torch.version.cuda, "python": sys.version.split()[0]},
        "gpu": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "max_model_len": sampling["max_tokens"] + 2048, "gpu_memory_utilization": a.gpu_mem, "llm_seed": 0,
        "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    json.dump(meta, open(os.path.join(a.out, "meta.json"), "w"), indent=1)

    llm = LLM(model=a.model, dtype="bfloat16", gpu_memory_utilization=a.gpu_mem, max_model_len=meta["max_model_len"], seed=0)
    sp = SamplingParams(n=a.samples, **sampling)

    t0 = time.time()
    stop = threading.Event()

    def heartbeat():
        while not stop.wait(30):
            json.dump({"condition": a.condition, "phase": "generating", "elapsed_s": round(time.time() - t0)},
                      open(os.path.join(a.out, "_heartbeat.json"), "w"))
    threading.Thread(target=heartbeat, daemon=True).start()
    outs = llm.generate(prompts, sp)
    stop.set()
    seconds = round(time.time() - t0)

    bad = sum(1 for o in outs for x in o.outputs if x.finish_reason not in ("stop", "length"))
    if bad:
        raise RuntimeError(f"{bad} generations ended without finishing or reaching max_tokens; not saved")
    tokens, cut, boxed = 0, 0, 0
    with gzip.open(os.path.join(a.out, "samples.jsonl.gz"), "wt", encoding="utf-8") as f:
        for r, o in zip(rows, outs):
            for k, s in enumerate(o.outputs):
                n = len(s.token_ids)
                tokens += n
                cut += s.finish_reason == "length"
                boxed += "\\boxed" in s.text
                f.write(json.dumps({"id": r["unique_id"], "k": k, "finish": s.finish_reason, "tokens": n, "text": s.text},
                                   ensure_ascii=False) + "\n")
    total = len(rows) * a.samples
    meta.update({"seconds": seconds, "generations": total, "tokens_sum": tokens, "mean_tokens": tokens / total,
                 "cut": cut, "cut_share": cut / total, "boxed_mentions": boxed,
                 "finished": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                 "samples_sha256": sha256_file(os.path.join(a.out, "samples.jsonl.gz"))})
    json.dump(meta, open(os.path.join(a.out, "meta.json"), "w"), indent=1)
    print(a.condition, json.dumps({k: meta[k] for k in ("seconds", "generations", "tokens_sum", "cut_share", "boxed_mentions")}), flush=True)


if __name__ == "__main__":
    main()
