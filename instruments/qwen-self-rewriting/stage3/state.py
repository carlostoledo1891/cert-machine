#!/usr/bin/env python3
"""state.py: the pod runner's measured state for project.py (Stage 3). Python standard library only.
  init  --price P --start EPOCH --pair 0|1           writes STATE with the deadline (project.deadline)
  probe --arm-dir DIR                                 R0 from DIR/metrics.jsonl between PROBE_FROM_S and PROBE_S after the
                                                      first sample; stored as probe_rate (and A_start)
  done  --arm X --arm-dir DIR --restart S             the arm's tokens, cut share, mean finished length, wall-clock
  index --root DIR                                    writes DIR/_index.json (path, bytes, sha256 of every file) for pulls
every command takes --state FILE (default /results/_state.json) and prints the updated state.
MIT"""
import argparse
import hashlib
import json
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import project  # noqa: E402


def load(p):
    return json.load(open(p)) if os.path.exists(p) else {}


def save(p, st):
    tmp = p + ".tmp"
    json.dump(st, open(tmp, "w"), indent=1)
    os.replace(tmp, p)
    print(json.dumps(st))


def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["init", "probe", "done", "index"])
    ap.add_argument("--state", default="/results/_state.json")
    ap.add_argument("--price", type=float)
    ap.add_argument("--start", type=float)
    ap.add_argument("--pair", type=int, default=1)
    ap.add_argument("--arm")
    ap.add_argument("--arm-dir")
    ap.add_argument("--restart", type=float)
    ap.add_argument("--root")
    a = ap.parse_args()
    if a.cmd == "index":
        out = []
        for d, _, fs in os.walk(a.root):
            for f in sorted(fs):
                p = os.path.join(d, f)
                rel = os.path.relpath(p, a.root)
                if rel in ("_index.json", "_index.json.tmp") or f.endswith(".tmp"):
                    continue
                try:
                    out.append({"path": rel, "bytes": os.path.getsize(p), "sha256": sha_file(p)})
                except OSError:
                    pass
        tmp = os.path.join(a.root, "_index.json.tmp")
        json.dump({"utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "files": out}, open(tmp, "w"))
        os.replace(tmp, os.path.join(a.root, "_index.json"))
        return
    st = load(a.state)
    if a.cmd == "init":
        st.update({"price": a.price, "pod_start": a.start, "cap_usd": project.CAP_USD, "reserve_s": project.RESERVE_S,
                   "deadline": project.deadline(a.price, a.start), "pair_ab": bool(a.pair)})
    elif a.cmd == "probe":
        ms = [json.loads(l) for l in open(os.path.join(a.arm_dir, "metrics.jsonl")) if l.strip()]
        ms = [m for m in ms if "gen_tokens" in m]
        meta = json.load(open(os.path.join(a.arm_dir, "meta.json")))
        t0 = meta["t_start"]
        win = [m for m in ms if project.PROBE_FROM_S <= m["t"] - t0 <= project.PROBE_S + 30]
        rate = None
        if len(win) >= 2 and win[-1]["t"] > win[0]["t"]:
            rate = (win[-1]["gen_tokens"] - win[0]["gen_tokens"]) / (win[-1]["t"] - win[0]["t"])
        source = "vllm:generation_tokens_total"
        if rate is None:   # no server counter: the finished answers' tokens only (an undercount, so a later projection)
            rp = os.path.join(a.arm_dir, "responses.jsonl")
            rs = [json.loads(l) for l in open(rp, encoding="utf-8") if l.strip()] if os.path.exists(rp) else []
            span = max(1.0, time.time() - t0)
            rate = sum(r["tokens"] or 0 for r in rs) / span if rs else None
            source = "finished answers only (no server counter)"
        st.update({"A_start": t0, "probe_rate": rate, "probe_source": source,
                   "probe_window": [win[0]["t"] - t0, win[-1]["t"] - t0] if len(win) >= 2 else None, "probe_samples": len(win)})
    elif a.cmd == "done":
        meta = json.load(open(os.path.join(a.arm_dir, "meta.json")))
        rs = [json.loads(l) for l in open(os.path.join(a.arm_dir, "responses.jsonl"), encoding="utf-8") if l.strip()]
        tok = sum(r["tokens"] or 0 for r in rs)
        cut = sum(1 for r in rs if r["finish"] == "length")
        fin = [r["tokens"] for r in rs if r["finish"] != "length" and r["tokens"] is not None]
        rec = {"complete": meta.get("complete"), "answers": len(rs), "tokens": tok, "cut_share": cut / len(rs) if rs else None,
               "mean_finished_tokens": sum(fin) / len(fin) if fin else project.LF_HI, "gen_wall_s": meta.get("gen_wall_s"),
               "restart_s": a.restart}
        st[a.arm + "_done"] = rec
        if a.arm == "A":
            st["restart_s"] = a.restart
    save(a.state, st)


if __name__ == "__main__":
    main()
