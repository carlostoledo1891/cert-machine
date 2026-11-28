#!/usr/bin/env python3
"""client.py: one arm of Stage 3 against the local vLLM server (notes/qwen-self-rewriting-stage3-preregistration-
2026-11-26.md). It generates and records; it grades nothing.

  prompts   the chat template of the pinned checkpoint (tokenizer.apply_chat_template, add_generation_prompt,
            enable_thinking=True) over one user turn: problem + "\\n" + "Please reason step by step, and put your final
            answer within \\boxed{}." (Tab. 5's instruction; the separator is ours). The hand-built form
            "<|im_start|>user\\n...<|im_end|>\\n<|im_start|>assistant\\n<think>\\n" is compared and the result recorded.
  requests  all 490 at once to /v1/completions (raw prompt, n = 1, the problem's own seed, the arm's sampling dict);
            the server schedules them. Each finished answer is appended to responses.jsonl and flushed at once, so a
            stop at the deadline keeps every finished answer.
  stop      the file STOP_FILE, or the deadline (epoch seconds), ends the arm: in-flight answers are lost and the arm
            is written as incomplete.
  metrics   every 30 s the server's /metrics counter vllm:generation_tokens_total (and the number of running and
            waiting requests) goes to metrics.jsonl; the probe reads it.
usage: client.py --server URL --model-dir DIR --draw draw-490.jsonl --arm A --sampling JSON --out DIR
                 --deadline EPOCH [--stop-file F] [--limit N]
       client.py --fingerprint --server URL --out FILE      (K6: one greedy answer to a fixed prompt, with log-probs)
MIT"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.request

INSTRUCTION = "Please reason step by step, and put your final answer within \\boxed{}."
FP_PROMPT = "<|im_start|>user\nWhat is 17 times 23? Answer with the number only.<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n"


def post(server, body, timeout):
    req = urllib.request.Request(server + "/v1/completions", data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def metrics(server):
    try:
        txt = urllib.request.urlopen(server + "/metrics", timeout=10).read().decode()
    except Exception as e:  # noqa: BLE001
        return {"error": str(e)[:200]}
    out = {}
    for key, name in (("gen_tokens", "vllm:generation_tokens_total"), ("prompt_tokens", "vllm:prompt_tokens_total"),
                      ("running", "vllm:num_requests_running"), ("waiting", "vllm:num_requests_waiting"),
                      ("kv_usage", "vllm:kv_cache_usage_perc"), ("kv_usage", "vllm:gpu_cache_usage_perc")):
        vals = [float(m.group(1)) for m in re.finditer(r"^" + re.escape(name) + r"(?:\{[^}]*\})?\s+([0-9.eE+-]+)\s*$", txt, re.M)]
        if vals and key not in out:
            out[key] = sum(vals)
    return out


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def fingerprint(a):
    body = {"model": "qwen", "prompt": FP_PROMPT, "max_tokens": 8, "temperature": 0.0, "logprobs": 5, "seed": 0}
    r = post(a.server, body, 600)
    c = r["choices"][0]
    rec = {"prompt": FP_PROMPT, "text": c.get("text"), "logprobs": c.get("logprobs"), "utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    json.dump(rec, open(a.out, "w"), indent=1)
    print("FINGERPRINT", json.dumps(c.get("text")))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--server", default="http://127.0.0.1:8001")
    ap.add_argument("--fingerprint", action="store_true")
    ap.add_argument("--model-dir")
    ap.add_argument("--draw")
    ap.add_argument("--arm")
    ap.add_argument("--sampling")
    ap.add_argument("--out", required=True)
    ap.add_argument("--deadline", type=float, default=0)
    ap.add_argument("--stop-file", default="/w/STOP")
    ap.add_argument("--limit", type=int, default=0)
    a = ap.parse_args()
    if a.fingerprint:
        return fingerprint(a)
    sampling = json.loads(a.sampling)
    rows = [json.loads(l) for l in open(a.draw, encoding="utf-8") if l.strip()]
    if a.limit:
        rows = rows[:a.limit]
    os.makedirs(a.out, exist_ok=True)
    from transformers import AutoTokenizer
    tok = AutoTokenizer.from_pretrained(a.model_dir)
    prompts, hand_equal = [], 0
    for r in rows:
        content = r["problem"] + "\n" + INSTRUCTION
        p = tok.apply_chat_template([{"role": "user", "content": content}], tokenize=False, add_generation_prompt=True,
                                    enable_thinking=True)
        hand = "<|im_start|>user\n" + content + "<|im_end|>\n<|im_start|>assistant\n<think>\n"
        hand_equal += p == hand
        prompts.append(p)
    ct = os.path.join(a.model_dir, "chat_template.jinja")
    meta = {"arm": a.arm, "sampling": sampling, "n_problems": len(rows), "instruction": INSTRUCTION,
            "prompt_form": "problem + '\\n' + instruction, one user turn, add_generation_prompt, enable_thinking=True",
            "prompts_sha256": hashlib.sha256("\n".join(prompts).encode("utf-8")).hexdigest(),
            "prompts_equal_to_the_hand_built_form": hand_equal, "prompt_example": prompts[0],
            "chat_template_sha256": sha_file(ct) if os.path.exists(ct) else None,
            "seeds_sha256": hashlib.sha256(",".join(str(r["seed"]) for r in rows).encode()).hexdigest(),
            "model_dir": os.path.realpath(a.model_dir), "deadline": a.deadline,
            "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "t_start": time.time()}
    json.dump(meta, open(os.path.join(a.out, "meta.json"), "w"), indent=1)

    out_path = os.path.join(a.out, "responses.jsonl")
    lock = threading.Lock()
    done = {"n": 0, "tokens": 0, "errors": 0}
    stop = threading.Event()
    fout = open(out_path, "a", encoding="utf-8")

    def one(r, prompt):
        body = dict(sampling)
        body.update({"model": "qwen", "prompt": prompt, "n": 1, "seed": r["seed"]})
        last = None
        for attempt in range(3):
            if stop.is_set():
                return
            try:
                t0 = time.time()
                res = post(a.server, body, 6 * 3600)
                c = res["choices"][0]
                u = res.get("usage") or {}
                rec = {"id": r["id"], "seed": r["seed"], "finish": c.get("finish_reason"), "tokens": u.get("completion_tokens"),
                       "prompt_tokens": u.get("prompt_tokens"), "text": c.get("text"), "attempt": attempt,
                       "seconds": round(time.time() - t0, 1), "t_done": round(time.time(), 1)}
                with lock:
                    fout.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    fout.flush()
                    os.fsync(fout.fileno())
                    done["n"] += 1
                    done["tokens"] += rec["tokens"] or 0
                return
            except Exception as e:  # noqa: BLE001
                last = str(e)[:300]
                time.sleep(5)
        with lock:
            done["errors"] += 1
            with open(os.path.join(a.out, "errors.jsonl"), "a") as fe:
                fe.write(json.dumps({"id": r["id"], "error": last}) + "\n")

    def sampler():
        with open(os.path.join(a.out, "metrics.jsonl"), "a") as fm:
            while not stop.wait(30):
                m = metrics(a.server)
                m.update({"t": round(time.time(), 1), "done": done["n"]})
                fm.write(json.dumps(m) + "\n")
                fm.flush()
    m0 = metrics(a.server)
    m0.update({"t": round(time.time(), 1), "done": 0})
    with open(os.path.join(a.out, "metrics.jsonl"), "a") as fm:
        fm.write(json.dumps(m0) + "\n")
    threading.Thread(target=sampler, daemon=True).start()
    ex = cf.ThreadPoolExecutor(max_workers=len(rows))
    futs = [ex.submit(one, r, p) for r, p in zip(rows, prompts)]
    reason = "complete"
    while True:
        if all(f.done() for f in futs):
            break
        if os.path.exists(a.stop_file):
            reason = "stopped: the stop file"
            break
        if a.deadline and time.time() >= a.deadline:
            reason = "stopped: the deadline"
            break
        time.sleep(5)
    stop.set()
    fout.close()
    n = sum(1 for l in open(out_path, encoding="utf-8") if l.strip())
    meta.update({"finished": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "t_end": time.time(),
                 "gen_wall_s": round(time.time() - meta["t_start"], 1), "answers": n, "errors": done["errors"],
                 "complete": reason == "complete" and n == len(rows) and done["errors"] == 0, "end": reason,
                 "responses_sha256": sha_file(out_path)})
    json.dump(meta, open(os.path.join(a.out, "meta.json"), "w"), indent=1)
    print("ARM", a.arm, json.dumps({k: meta[k] for k in ("answers", "errors", "complete", "end", "gen_wall_s")}), flush=True)
    os._exit(0 if meta["complete"] else 3)


if __name__ == "__main__":
    main()
