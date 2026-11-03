#!/usr/bin/env python3
"""wsp-baseline.py — Stage 3 of the Weight-Space Programming verification, the desk side: every text a pod generated
under the pre-registered conditions (notes/wsp-stage3-preregistration-2026-11-02.md; tools/runpod-wsp-baseline.sh;
brought here by tools/import-runpod-wsp.js) graded by instruments/wsp/grade.py — three-valued, exact, standard library;
math-verify is not used — against HuggingFaceH4/MATH-500's answers, and the pre-registered readings written:
  (a) the accuracy on the decided subset (CORRECT / (CORRECT + WRONG); a REFUSED is neither),
  (b) the floor: REFUSED counted as wrong (CORRECT / all),
  (c) the cut share (generations that reached max_tokens), and the boxed share (a closed \\boxed{} present),
each for the first sample per problem and over all samples; then the pre-registered interpretation rule applied as
written (a card-settings condition within 10 points of 48.1 → the "6×" is mostly the baseline's settings; both below
20 → the edit's gain stands against the card's settings too).

The texts live in corpus/wsp/.cache/baseline-runs/<pod>/<condition>/samples.jsonl.gz (git-ignored, 2,000 texts per
condition), pinned by sha256 in corpus/wsp/baseline-runs/<pod>.json and in the record; every verdict is in the record.

usage: python3 -I tools/wsp-baseline.py            → certs/wsp-baseline.json
       python3 -I tools/wsp-baseline.py --check    re-derives everything where the texts are cached and compares with the
                                                   record; where they are not, checks the record's pins against the run
                                                   file and the grader; nothing written
MIT"""
import glob
import gzip
import hashlib
import json
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "instruments", "wsp"))
import grade as G  # noqa: E402

CACHE = os.path.join(ROOT, "corpus", "wsp", ".cache")
RUNS = os.path.join(ROOT, "corpus", "wsp", "baseline-runs")
GOLD = os.path.join(CACHE, "math500", "test.jsonl")
PINS = os.path.join(ROOT, "corpus", "wsp", "PINS.json")
RECORD = os.path.join(ROOT, "certs", "wsp-baseline.json")
POST = {"unedited_math500_printed": 0.079, "edited_50_passes_printed": 0.481, "card_rerun_edited": 0.510, "card_smoke_base_25": 0.05}
RULE = {"near": 10.0, "low": 20.0, "target": 48.1}


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def load_gold():
    pins = json.load(open(PINS))["files"]["math500/test.jsonl"]["sha256"]
    got = sha(GOLD)
    if got != pins:
        raise SystemExit("REFUSED: math500/test.jsonl sha256 %s differs from corpus/wsp/PINS.json (%s)" % (got, pins))
    gold = {}
    for line in open(GOLD, encoding="utf-8"):
        r = json.loads(line)
        gold[r["unique_id"]] = r["answer"]
    return gold, got


def grade_condition(c, meta, samples_path, gold):
    rows = {}
    for line in gzip.open(samples_path, "rt", encoding="utf-8"):
        s = json.loads(line)
        pred = G.extract_boxed(s["text"])
        verdict, reason = G.grade(gold[s["id"]], pred)
        rows.setdefault(s["id"], []).append({"k": s["k"], "finish": s["finish"], "tokens": s["tokens"], "pred": pred,
                                             "verdict": verdict, "reason": reason if verdict != "CORRECT" else None})
    problems = [{"id": i, "gold": gold[i], "samples": sorted(v, key=lambda x: x["k"])} for i, v in rows.items()]
    problems.sort(key=lambda p: p["id"])

    def tally(samples):
        t = {"n": len(samples), "CORRECT": 0, "WRONG": 0, "REFUSED": 0, "no_box": 0, "boxed": 0, "cut": 0, "tokens": 0,
             "boxed_and_cut": 0}
        for s in samples:
            t[s["verdict"]] += 1
            t["tokens"] += s["tokens"]
            if s["pred"] is None:
                t["no_box"] += 1
            else:
                t["boxed"] += 1
            if s["finish"] == "length":
                t["cut"] += 1
                if s["pred"] is not None:
                    t["boxed_and_cut"] += 1
        d = t["CORRECT"] + t["WRONG"]
        t["decided"] = d
        t["acc_decided"] = t["CORRECT"] / d if d else None
        t["acc_floor"] = t["CORRECT"] / t["n"]
        t["cut_share"] = t["cut"] / t["n"]
        t["boxed_share"] = t["boxed"] / t["n"]
        t["acc_given_boxed_decided"] = (t["CORRECT"] / (t["boxed"] - t["REFUSED"])) if t["boxed"] - t["REFUSED"] else None
        t["mean_tokens"] = t["tokens"] / t["n"]
        return t
    first = tally([p["samples"][0] for p in problems])
    every = tally([s for p in problems for s in p["samples"]])
    refused = [{"id": p["id"], "k": s["k"], "gold": p["gold"], "pred": s["pred"], "reason": s["reason"]}
               for p in problems for s in p["samples"] if s["verdict"] == "REFUSED"]
    keep = {k: meta.get(k) for k in ("condition", "thinking", "sampling", "samples", "n_problems", "instruction", "prompt_form",
                                     "chat_template_sha256", "prompts_sha256", "versions", "gpu", "max_model_len",
                                     "gpu_memory_utilization", "llm_seed", "started", "finished", "seconds", "generations",
                                     "tokens_sum", "cut_share", "samples_sha256", "samples_bytes", "samples_file")}
    keep["model"] = os.path.basename(meta.get("model_dir", ""))
    return {"meta": keep, "first_sample": first, "all_samples": every, "n_problems": len(problems), "refused": refused,
            "problems": problems}


def reading(conds):
    """the pre-registered interpretation rule, applied as written to the card-settings conditions C2 and C3."""
    out = {"rule": "a card-settings condition (C2 or C3) whose MATH-500 accuracy (first-sample or 4-sample mean, the floor, "
                   "REFUSED counted wrong) is within 10 points of 48.1 → the '6×' is mostly the baseline's settings; both "
                   "below 20 → the edit's gain stands against the card's settings too; otherwise: between, stated as such",
           "target_percent": RULE["target"], "conditions": {}}
    best = {}
    for c in ("C2", "C3"):
        if c not in conds:
            out["conditions"][c] = "not run"
            continue
        f, a = conds[c]["first_sample"]["acc_floor"] * 100, conds[c]["all_samples"]["acc_floor"] * 100
        best[c] = max(f, a)
        out["conditions"][c] = {"first_sample_floor_percent": round(f, 2), "all_samples_floor_percent": round(a, 2),
                                "points_below_48_1": round(RULE["target"] - max(f, a), 2)}
    if not best:
        out["verdict"] = "NEEDS DATA: no card-settings condition finished"
    elif any(RULE["target"] - v <= RULE["near"] for v in best.values()):
        out["verdict"] = "the '6×' is mostly the baseline's settings: " + ", ".join("%s reaches %.1f%%" % (c, v) for c, v in best.items() if RULE["target"] - v <= RULE["near"])
    elif all(v < RULE["low"] for v in best.values()) and len(best) == 2:
        out["verdict"] = "the edit's gain stands against the card's settings too: " + ", ".join("%s %.1f%%" % (c, v) for c, v in best.items())
    elif len(best) < 2:
        out["verdict"] = "between (one card-settings condition only): " + ", ".join("%s %.1f%%" % (c, v) for c, v in best.items())
    else:
        out["verdict"] = "between: " + ", ".join("%s %.1f%%" % (c, v) for c, v in best.items())
    return out


def build(cached_only=False):
    t0 = time.time()
    gold, gold_sha = load_gold()
    runs = sorted(glob.glob(os.path.join(RUNS, "*.json")))
    if not runs:
        raise SystemExit("no run file in corpus/wsp/baseline-runs/ (node tools/import-runpod-wsp.js <pod>)")
    pins = {"math500/test.jsonl": gold_sha, "instruments/wsp/grade.py": sha(os.path.join(ROOT, "instruments", "wsp", "grade.py"))}
    conds, pods, missing = {}, [], []
    for rf in runs:
        R = json.load(open(rf))
        pins[os.path.relpath(rf, ROOT)] = sha(rf)
        pods.append({"id": R["pod"]["id"], "audit": R["pod"]["audit"], "build": R["pod"]["build"], "status": R["pod"]["status"],
                     "conditions_requested": R["pod"]["conditions_requested"], "imported": R["imported"]})
        for c, meta in sorted(R["conditions"].items()):
            p = os.path.join(ROOT, meta["samples_file"])
            pins[meta["samples_file"]] = meta["samples_sha256"]
            if not os.path.exists(p):
                missing.append(c)
                continue
            got = sha(p)
            if got != meta["samples_sha256"]:
                raise SystemExit("REFUSED: %s sha256 %s differs from the run file's %s" % (meta["samples_file"], got, meta["samples_sha256"]))
            conds[c] = grade_condition(c, meta, p, gold)
    rec = {
        "what": "Stage 3 of the Weight-Space Programming verification: MATH-500 generated by the UNEDITED Qwen/Qwen3.5-0.8B @ 2fc06364 under the pre-registered conditions (C1 the post's settings, the control; C2 the model card's thinking-mode text settings with 81,920 tokens; C3 the card's non-thinking text settings; C4, if run, the edited checkpoint @ d1671a17 under C2) on one RunPod GPU pod with vLLM 0.33.0, every text brought to the desk and graded by instruments/wsp/grade.py (three-valued, exact, standard library; math-verify not used); the pre-registered readings (a) accuracy on the decided subset, (b) the floor with REFUSED counted wrong, (c) the cut share, first-sample and all-sample; the interpretation rule applied as written",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
        "python": sys.version.split()[0],
        "preregistration": "notes/wsp-stage3-preregistration-2026-11-02.md",
        "grader": {"file": "instruments/wsp/grade.py", "sha256": pins["instruments/wsp/grade.py"]},
        "pods": pods, "pins": pins, "post_printed": POST,
        "conditions": {c: {k: v for k, v in d.items() if k != "problems"} for c, d in conds.items()},
        "reading": reading(conds),
        "rows": {c: d["problems"] for c, d in conds.items()},
        "not_cached": missing,
    }
    return rec


def main():
    check = "--check" in sys.argv
    rec = build()
    if check:
        old = json.load(open(RECORD))
        bad = []
        if old["pins"] != rec["pins"]:
            bad.append("pins")
        if old["grader"]["sha256"] != rec["grader"]["sha256"]:
            bad.append("grader drift")
        for c in old["conditions"]:
            if c in rec["conditions"]:
                for k in ("first_sample", "all_samples", "refused", "n_problems"):
                    if old["conditions"][c][k] != rec["conditions"][c][k]:
                        bad.append(c + "." + k)
                if old["rows"][c] != rec["rows"][c]:
                    bad.append(c + ".rows")
            elif c not in rec["not_cached"]:
                bad.append(c + " missing")
        if old["reading"]["conditions"] != rec["reading"]["conditions"] and not rec["not_cached"]:
            bad.append("reading")
        if bad:
            print("FAIL  wsp-baseline --check: " + ", ".join(bad))
            sys.exit(1)
        print("PASS  wsp-baseline --check (%.1f s%s)" % (rec["seconds"], "; texts not cached: " + ", ".join(rec["not_cached"]) + " — pins and grader checked" if rec["not_cached"] else ""))
        return
    if rec["not_cached"]:
        raise SystemExit("cannot build: texts not cached for " + ", ".join(rec["not_cached"]))
    os.makedirs(os.path.dirname(RECORD), exist_ok=True)
    json.dump(rec, open(RECORD, "w"), indent=1)
    for c, d in rec["conditions"].items():
        f, a = d["first_sample"], d["all_samples"]
        print("%s (%s, thinking %s, max_tokens %s): first sample — decided %d/%d, acc %.4f decided / %.4f floor, boxed %.3f, cut %.3f; "
              "all %d — acc %.4f decided / %.4f floor, boxed %.3f, cut %.3f, mean tokens %.0f; %s s" %
              (c, d["meta"]["model"], d["meta"]["thinking"], d["meta"]["sampling"]["max_tokens"], f["decided"], f["n"],
               f["acc_decided"] or 0, f["acc_floor"], f["boxed_share"], f["cut_share"], a["n"], a["acc_decided"] or 0,
               a["acc_floor"], a["boxed_share"], a["cut_share"], a["mean_tokens"], d["meta"]["seconds"]))
    print("reading: " + rec["reading"]["verdict"])
    print("certs/wsp-baseline.json written (%.1f s)" % rec["seconds"])


if __name__ == "__main__":
    main()
