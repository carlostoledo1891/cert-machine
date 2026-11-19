#!/usr/bin/env python3
"""wsp-regrade-dna.py — six MATH-500 trace files of Nondual-Observer/dna-weight-editing re-graded with this repository's
three-valued grader (instruments/wsp/grade.py), as offered in RikiyaT/lm_understand-logs#4 (2026-11-18) and accepted.

The inputs, each sha256-pinned in the record:
  Nondual-Observer/dna-weight-editing @ b7cdf67a52dee6c750bdcff9d5164101ec31cd8d, traces/math500_{base,mit_p50c,sgne_cc}
  _think32k_{pure_t0,card_pp15}.jsonl (500 rows each: the full response text, the authors' extracted `pred` and their
  `strict_ok`), and suites/reproducibility_and_holdout_manifest.json (the 200 calibration ids and the untouched 300);
  the gold answers: HuggingFaceH4/MATH-500 @ 6e4ed1a2, test.jsonl (the same file as certs/wsp-regrade.json).

The convention, fixed before any grade was computed and the same as certs/wsp-baseline.json:
  the answer is the LAST closed \\boxed{} of the whole response text (thinking included, as in C2); a response with no
  closed \\boxed{} (an empty one counts as none) is WRONG; CORRECT / WRONG / REFUSED as grade.py decides; the floor is
  CORRECT / all, the decided rate CORRECT / (CORRECT + WRONG). Reported beside it, as a second reading and not the
  verdict: the answer taken only after the last </think> (a response whose thinking never closed has no answer).
The second grader (instruments/wsp/grade.js, JavaScript, no shared code) re-extracts and re-grades every response; any
disagreement in extraction or verdict is listed. Red controls: a CORRECT pair with its gold changed must turn WRONG in
both graders; a \\pm must be REFUSED by both; the split must be 200 + 300 = 500 disjoint ids covering every trace.

usage: python3 tools/wsp-regrade-dna.py            → certs/wsp-dna-regrade.json
       python3 tools/wsp-regrade-dna.py --check    re-derives everything and compares with the record; nothing written
MIT"""
import hashlib
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "instruments", "wsp"))
import grade as G  # noqa: E402

COMMIT = "b7cdf67a52dee6c750bdcff9d5164101ec31cd8d"
CACHE = os.path.join(ROOT, "corpus", "wsp", ".cache")
DNA = os.path.join(CACHE, "dna-b7cdf67a")
GOLD = os.path.join(CACHE, "math500", "test.jsonl")
RECORD = os.path.join(ROOT, "certs", "wsp-dna-regrade.json")
RUNS = [("base", "pure_t0"), ("mit_p50c", "pure_t0"), ("sgne_cc", "pure_t0"),
        ("base", "card_pp15"), ("mit_p50c", "card_pp15"), ("sgne_cc", "card_pp15")]
FILE = lambda m, r: "traces/math500_%s_think32k_%s.jsonl" % (m, r)


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def after_think(text):
    i = text.rfind("</think>")
    return None if i < 0 else text[i + len("</think>"):]


def second_grader(items):
    """items: [[gold, text]] -> [[extraction, verdict]] from instruments/wsp/grade.js"""
    js = ("const G=require(%s);let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const I=JSON.parse(s);"
          "process.stdout.write(JSON.stringify(I.map(([g,t])=>{const p=G.extractBoxed(t);"
          "const e=(p===null||p===undefined||String(p).trim()==='')?null:p;return [e,G.grade(g,e)[0]];})));});"
          % json.dumps(os.path.join(ROOT, "instruments", "wsp", "grade.js")))
    out = subprocess.run(["node", "-e", js], input=json.dumps(items).encode(), stdout=subprocess.PIPE, check=True)
    return json.loads(out.stdout)


def ext(text):
    p = G.extract_boxed(text)
    return None if p is None or str(p).strip() == "" else p


def tally(rows):
    t = {"n": len(rows), "CORRECT": 0, "WRONG": 0, "REFUSED": 0, "no_box": 0, "authors_strict_ok": 0, "hit_cap": 0}
    for r in rows:
        t[r["v"]] += 1
        t["no_box"] += r["pred"] is None
        t["authors_strict_ok"] += bool(r["strict_ok"])
        t["hit_cap"] += r["hit_cap"]
    d = t["CORRECT"] + t["WRONG"]
    t["floor_percent"] = round(100 * t["CORRECT"] / t["n"], 2)
    t["decided_percent"] = round(100 * t["CORRECT"] / d, 2) if d else None
    t["authors_percent"] = round(100 * t["authors_strict_ok"] / t["n"], 2)
    t["hit_cap_percent"] = round(100 * t["hit_cap"] / t["n"], 2)
    return t


def build():
    t0 = time.time()
    gold = {}
    for line in open(GOLD):
        r = json.loads(line)
        gold[r["unique_id"]] = r["answer"]
    man = json.load(open(os.path.join(DNA, "suites", "reproducibility_and_holdout_manifest.json")))
    sp = man["math500_calibration_vs_holdout_split"]
    held, cal = set(sp["untouched_holdout_pool_300_ids"]), set(sp["excluded_calibration_and_exploratory_200_ids"])
    split_ok = len(held) == 300 and len(cal) == 200 and not (held & cal) and (held | cal) == set(gold)
    if not split_ok:
        raise SystemExit("REFUSED: the manifest's split is not 200 + 300 disjoint ids covering MATH-500")
    runs, pins, disagreements = {}, {}, []
    for m, reg in RUNS:
        f = FILE(m, reg)
        p = os.path.join(DNA, f)
        pins[f] = sha(p)
        L = [json.loads(line) for line in open(p)]
        ids = [r["unique_id"] for r in L]
        if sorted(ids) != sorted(gold):
            raise SystemExit("REFUSED: %s does not hold each MATH-500 problem exactly once" % f)
        gold_mismatch = [r["unique_id"] for r in L if r["gold"].strip() != gold[r["unique_id"]].strip()]
        rows, strict = [], []
        for r in L:
            pred = ext(r["text"])
            v, why = G.grade(gold[r["unique_id"]], pred)
            a = after_think(r["text"])
            pa = ext(a) if a is not None else None
            va = G.grade(gold[r["unique_id"]], pa)[0]
            rows.append({"id": r["unique_id"], "pred": pred, "v": v, "why": why, "strict_ok": r["strict_ok"],
                         "authors_pred": r["pred"], "hit_cap": r["stop_reason"].startswith("max_new_tokens"),
                         "closed_think": r["closed_think"]})
            strict.append({"id": r["unique_id"], "pred": pa, "v": va, "strict_ok": r["strict_ok"],
                           "hit_cap": r["stop_reason"].startswith("max_new_tokens")})
        sec = second_grader([[gold[r["unique_id"]], r["text"]] for r in L])
        for row, (e2, v2) in zip(rows, sec):
            if (row["pred"] or None) != (e2 or None) or row["v"] != v2:
                disagreements.append({"run": f, "id": row["id"], "python": [row["pred"], row["v"]], "javascript": [e2, v2]})
        cross = {}
        for row in rows:
            k = "%s / authors %s" % (row["v"], "ok" if row["strict_ok"] else "not ok")
            cross[k] = cross.get(k, 0) + 1
        runs[f] = {
            "model": L[0]["model_id"], "regime": reg, "sampling": L[0]["sampling"],
            "all_500": tally(rows), "untouched_300": tally([r for r in rows if r["id"] in held]),
            "after_think_only": {"all_500": tally(strict), "untouched_300": tally([r for r in strict if r["id"] in held])},
            "cross_with_authors": cross, "gold_field_differs_from_HF": gold_mismatch,
            "refused": [{"id": r["id"], "pred": r["pred"], "why": r["why"]} for r in rows if r["v"] == "REFUSED"],
            "correct_here_not_ok_there": [{"id": r["id"], "pred": r["pred"], "authors_pred": r["authors_pred"]} for r in rows if r["v"] == "CORRECT" and not r["strict_ok"]],
            "ok_there_not_correct_here": [{"id": r["id"], "pred": r["pred"], "v": r["v"], "authors_pred": r["authors_pred"]} for r in rows if r["v"] != "CORRECT" and r["strict_ok"]],
        }
    # red controls, in both graders
    g0 = "\\frac{1}{2}"
    ctl = {"changed_gold": [G.grade("\\frac{1}{3}", g0)[0]] + [v for _, v in second_grader([["\\frac{1}{3}", "\\boxed{%s}" % g0]])],
           "pm": [G.grade("\\pm 2", "2")[0]] + [v for _, v in second_grader([["\\pm 2", "\\boxed{2}"]])]}
    controls_ok = ctl["changed_gold"] == ["WRONG", "WRONG"] and ctl["pm"] == ["REFUSED", "REFUSED"]
    pins["suites/reproducibility_and_holdout_manifest.json"] = sha(os.path.join(DNA, "suites", "reproducibility_and_holdout_manifest.json"))
    return {
        "what": "Six MATH-500 trace files of Nondual-Observer/dna-weight-editing (the untouched Qwen3.5-0.8B, the MIT-p50c edit and the SGNE-CC edit, each greedy and at the card's settings, thinking on, 32,768 tokens) re-graded with this repository's three-valued grader, on all 500 and on the untouched 300 of the authors' manifest, compared answer by answer with the authors' strict_ok, and re-graded again by the JavaScript second grader",
        "offer": "https://github.com/RikiyaT/lm_understand-logs/issues/4 (offered 2026-11-18, accepted the same day)",
        "convention": "the last closed \\boxed{} of the whole response (as in certs/wsp-baseline.json); none or empty -> WRONG; floor = CORRECT/all; decided = CORRECT/(CORRECT+WRONG). Second reading, not the verdict: the answer after the last </think> only",
        "sources": {"traces": {"repo": "github.com/Nondual-Observer/dna-weight-editing", "commit": COMMIT},
                    "gold": {"repo": "HuggingFaceH4/MATH-500", "revision": "6e4ed1a2a79af7d8630a6b768ec859cb5af4d3be", "sha256": sha(GOLD)}},
        "split": {"untouched": 300, "calibration": 200, "disjoint_and_complete": split_ok, "sealed_at_utc": sp.get("sealed_at_utc")},
        "runs": runs, "second_grader": {"responses": 6 * 500, "disagreements": disagreements},
        "controls": ctl, "controls_ok": controls_ok, "pins": pins,
        "grader": {"python": "instruments/wsp/grade.py", "sha256": sha(os.path.join(ROOT, "instruments", "wsp", "grade.py")),
                   "javascript": "instruments/wsp/grade.js", "js_sha256": sha(os.path.join(ROOT, "instruments", "wsp", "grade.js"))},
        "seconds": round(time.time() - t0, 1), "python": sys.version.split()[0],
    }


def summary(rec):
    lines = []
    for f, r in rec["runs"].items():
        a, h, s = r["all_500"], r["untouched_300"], r["after_think_only"]["untouched_300"]
        lines.append("%-48s untouched 300: %3d C %3d W %2d R  floor %5.1f%%  decided %5.1f%%  (authors %5.1f%%; after </think> only %5.1f%%)  all 500 floor %5.1f%%  cap %5.1f%%" % (
            f.split("/")[1], h["CORRECT"], h["WRONG"], h["REFUSED"], h["floor_percent"], h["decided_percent"] or 0, h["authors_percent"], s["floor_percent"], a["floor_percent"], a["hit_cap_percent"]))
    lines.append("second grader: %d disagreements of %d; controls %s" % (len(rec["second_grader"]["disagreements"]), rec["second_grader"]["responses"], "refused" if rec["controls_ok"] else "MISSED"))
    return "\n".join(lines)


def main():
    rec = build()
    if "--check" in sys.argv:
        old = json.load(open(RECORD))
        same = all(json.dumps(old[k], sort_keys=True) == json.dumps(rec[k], sort_keys=True) for k in ("runs", "second_grader", "controls", "pins", "split"))
        print(("the record re-derived: identical\n" if same else "REFUSED: the record differs from a fresh derivation\n") + summary(rec))
        sys.exit(0 if same and rec["controls_ok"] and not rec["second_grader"]["disagreements"] else 1)
    json.dump(rec, open(RECORD, "w"), indent=1, ensure_ascii=False)
    print(summary(rec))


if __name__ == "__main__":
    main()
