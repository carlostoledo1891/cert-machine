#!/usr/bin/env python3
"""wsp-regrade.py — the Weight-Space Programming MATH-500 results re-graded exactly (instruments/wsp/grade.py: a
three-valued grader, CORRECT / WRONG / REFUSED, Python standard library) from the claimants' released outputs,
compared answer by answer with the `correct` flags their grader (math-verify 0.9.0 on the last \\boxed{}) produced.

What is released and what is re-graded (every input sha256-pinned in corpus/wsp/PINS.json and in the record):
  the post's two runs (RikiyaT/lm_understand-logs @ 4d09ba6d, exp8_math/eval/{unedited,p50c}/parts/math500_s*of10):
    per problem the four samples' correct flags and `pred_first`, the extracted answer of the first sample — 500 each;
    and `math500_first_samples.jsonl.gz`, the first sample's full text for 20 problems per shard — 200 texts each run;
  the model card's re-run (RikiyaT/Qwen3.5-0.8B-weight-space-programming @ d1671a17, eval/): 500 × 4 correct flags for
    the edited model (51.0%), 25 × 4 for the base smoke test, and 20 full texts of each;
  the gold answers: HuggingFaceH4/MATH-500 @ 6e4ed1a2, test.jsonl (500).
So the texts behind 2,000 flags are NOT released: what can be re-graded is every first-sample answer string of the
post's two runs (1,000), the 400 + 40 released texts (our own extraction of the last \\boxed{}, then the grade), and
the flags themselves re-summed. The grader decides the gold answers it canonicalises (rationals, radicals, multiples of
π, complex numbers, tuples, degrees, base-n literals, words); the rest is REFUSED and the accuracies are re-stated on
the decided subset.

usage: python3 tools/wsp-regrade.py            → certs/wsp-regrade.json
       python3 tools/wsp-regrade.py --check    re-derives everything and compares with the record; nothing written
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
LOGS = os.path.join(CACHE, "logs", "exp8_math", "eval")
HF = os.path.join(CACHE, "edited", "eval")
GOLD = os.path.join(CACHE, "math500", "test.jsonl")
RECORD = os.path.join(ROOT, "certs", "wsp-regrade.json")


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def rel(p):
    return os.path.relpath(p, CACHE)


def load_gold():
    gold = {}
    for line in open(GOLD):
        r = json.loads(line)
        gold[r["unique_id"]] = r["answer"]
    return gold


def shards(run):
    """the post's run: per_problem rows and first-sample texts over the ten shards, with the files pinned."""
    rows, texts, pins = [], {}, {}
    for d in sorted(glob.glob(os.path.join(LOGS, run, "parts", "math500_s*of10"))):
        pp = os.path.join(d, "math500_per_problem.json")
        fs = os.path.join(d, "math500_first_samples.jsonl.gz")
        sc = os.path.join(d, "scores.json")
        for p in (pp, fs, sc):
            pins[rel(p)] = sha(p)
        rows += json.load(open(pp))
        for line in gzip.open(fs, "rt"):
            r = json.loads(line)
            texts[r["id"]] = r["text"]
    merged = os.path.join(LOGS, run, "merged.json")
    pins[rel(merged)] = sha(merged)
    return rows, texts, pins, json.load(open(merged))["math500"]


def regrade_rows(rows, gold, texts=None):
    """every row: our grade of pred_first against the gold; the comparison with correct[0]; the extraction check."""
    out = []
    tally = {"n": 0, "decided": 0, "refused": 0, "agree": 0, "their_1_our_WRONG": 0, "their_0_our_CORRECT": 0,
             "our_CORRECT": 0, "their_1_on_decided": 0, "their_1_all": 0, "no_box": 0,
             "texts": 0, "extraction_agrees": 0, "extraction_differs": 0, "text_grade_agrees_pred_first": 0,
             "boxed": 0, "boxed_their_1": 0, "boxed_decided": 0, "boxed_our_CORRECT": 0}
    for r in rows:
        g = gold[r["id"]]
        pred = r.get("pred_first")
        verdict, reason = G.grade(g, pred)
        theirs = int(r["correct"][0])
        row = {"id": r["id"], "gold": g, "pred_first": pred, "their_first": theirs, "their_all": r["correct"],
               "verdict": verdict, "reason": reason}
        tally["n"] += 1
        tally["their_1_all"] += theirs
        if pred is None:
            tally["no_box"] += 1
        else:
            tally["boxed"] += 1
            tally["boxed_their_1"] += theirs
            if verdict != "REFUSED":
                tally["boxed_decided"] += 1
                tally["boxed_our_CORRECT"] += 1 if verdict == "CORRECT" else 0
        if verdict == "REFUSED":
            tally["refused"] += 1
        else:
            tally["decided"] += 1
            tally["their_1_on_decided"] += theirs
            ours = 1 if verdict == "CORRECT" else 0
            tally["our_CORRECT"] += ours
            if ours == theirs:
                tally["agree"] += 1
            elif theirs == 1:
                tally["their_1_our_WRONG"] += 1
            else:
                tally["their_0_our_CORRECT"] += 1
        if texts is not None and r["id"] in texts:
            tally["texts"] += 1
            ex = G.extract_boxed(texts[r["id"]])
            row["our_extraction"] = ex
            same = (ex or "").strip() == (pred or "").strip()
            tally["extraction_agrees" if same else "extraction_differs"] += 1
            v2, _ = G.grade(g, ex)
            row["text_verdict"] = v2
            if v2 == verdict:
                tally["text_grade_agrees_pred_first"] += 1
        out.append(row)
    return out, tally


def hf_run(name, gold):
    scores = json.load(open(os.path.join(HF, f"scores_{name}_math500.json")))
    samples = [json.loads(l) for l in open(os.path.join(HF, f"samples_{name}_math500.jsonl"))]
    flags = {r["id"]: r["correct"] for r in scores["per_problem"]}
    allflags = [x for r in scores["per_problem"] for x in r["correct"]]
    rows = []
    t = {"n_problems": len(flags), "flags": len(allflags), "their_1": sum(allflags), "texts": len(samples), "decided": 0,
         "agree_with_first_flag": 0, "their_1_our_WRONG": 0, "their_0_our_CORRECT": 0, "refused": 0, "our_CORRECT": 0}
    for s in samples:
        ex = G.extract_boxed(s["text"])
        verdict, reason = G.grade(gold[s["id"]], ex)
        theirs = int(flags[s["id"]][0])
        rows.append({"id": s["id"], "gold": gold[s["id"]], "released_answer_field": s.get("answer"), "our_extraction": ex,
                     "their_first": theirs, "their_all": flags[s["id"]], "verdict": verdict, "reason": reason})
        if verdict == "REFUSED":
            t["refused"] += 1
        else:
            t["decided"] += 1
            ours = 1 if verdict == "CORRECT" else 0
            t["our_CORRECT"] += ours
            if ours == theirs:
                t["agree_with_first_flag"] += 1
            elif theirs == 1:
                t["their_1_our_WRONG"] += 1
            else:
                t["their_0_our_CORRECT"] += 1
    return {"summary_printed": {k: scores["summary"][k] for k in ("acc", "cut_share", "n_problems", "samples")},
            "acc_resummed": sum(allflags) / len(allflags), "tally": t, "rows": rows}


def build():
    t0 = time.time()
    gold = load_gold()
    kinds = {}
    for a in gold.values():
        c = G.canon(a)
        k = c[0] if c[0] != "tuple" else ("tuple" if all(x[0] != "lit" for x in c[1]) else "lit")
        kinds[k] = kinds.get(k, 0) + 1
    decidable = sum(v for k, v in kinds.items() if k != "lit")
    pins = {"math500/test.jsonl": sha(GOLD)}
    runs = {}
    for run, label in (("unedited", "post_unedited"), ("p50c", "post_edited_50_passes")):
        rows, texts, p, merged = shards(run)
        pins.update(p)
        graded, tally = regrade_rows(rows, gold, texts)
        allflags = [x for r in rows for x in r["correct"]]
        runs[label] = {"merged_printed": merged, "acc_resummed_all_samples": sum(allflags) / len(allflags),
                       "acc_first_sample_theirs": tally["their_1_all"] / tally["n"],
                       "acc_first_sample_theirs_on_decided": tally["their_1_on_decided"] / tally["decided"],
                       "acc_first_sample_ours_on_decided": tally["our_CORRECT"] / tally["decided"],
                       "first_sample_boxed_share": tally["boxed"] / tally["n"],
                       "acc_given_boxed_theirs": tally["boxed_their_1"] / tally["boxed"],
                       "acc_given_boxed_ours_on_decided": tally["boxed_our_CORRECT"] / tally["boxed_decided"],
                       "tally": tally,
                       "disagreements": [r for r in graded if r["verdict"] != "REFUSED" and (r["verdict"] == "CORRECT") != bool(r["their_first"])],
                       "extraction_differences": [{"id": r["id"], "pred_first": r["pred_first"], "our_extraction": r["our_extraction"]} for r in graded if "our_extraction" in r and (r["our_extraction"] or "").strip() != (r["pred_first"] or "").strip()],
                       "refused": [{"id": r["id"], "gold": r["gold"], "pred_first": r["pred_first"], "reason": r["reason"]} for r in graded if r["verdict"] == "REFUSED"],
                       "rows": graded}
    for name in ("edited", "base"):
        for f in (f"scores_{name}_math500.json", f"samples_{name}_math500.jsonl"):
            pins["edited/eval/" + f] = sha(os.path.join(HF, f))
    hf = {"card_rerun_edited": hf_run("edited", gold), "card_smoke_base": hf_run("base", gold)}
    rec = {
        "what": "The Weight-Space Programming MATH-500 results re-graded exactly from the released outputs: every first-sample answer of the post's unedited and 50-pass runs (500 each) graded by instruments/wsp/grade.py (three-valued, exact, standard library) against HuggingFaceH4/MATH-500's answers and compared with the claimants' math-verify flags; the 400 + 40 released texts re-extracted (the last \\boxed{}) and graded; every flag re-summed; the texts behind the other 1,500 + 1,500 + 1,580 flags are not released",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "seconds": round(time.time() - t0, 1),
        "python": sys.version.split()[0],
        "grader": {"file": "instruments/wsp/grade.py", "sha256": sha(os.path.join(ROOT, "instruments", "wsp", "grade.py"))},
        "sources": {"logs": {"repo": "github.com/RikiyaT/lm_understand-logs", "commit": "4d09ba6d6a7e891dd8063974dfe81b3d78e3494f"},
                    "card": {"repo": "RikiyaT/Qwen3.5-0.8B-weight-space-programming", "revision": "d1671a178705bcab7644806d23c535517f35723b"},
                    "math500": {"repo": "HuggingFaceH4/MATH-500", "revision": "6e4ed1a2a79af7d8630a6b768ec859cb5af4d3be"}},
        "pins": pins,
        "gold": {"n": len(gold), "canonical_kinds": kinds, "decidable": decidable, "refused_kinds": kinds.get("lit", 0)},
        "post_runs": runs, "card_runs": hf,
    }
    return rec


def main():
    check = "--check" in sys.argv
    rec = build()
    if check:
        old = json.load(open(RECORD))
        bad = []
        for k in ("pins", "gold"):
            if old[k] != rec[k]:
                bad.append(k)
        for run in rec["post_runs"]:
            for k in ("tally", "acc_resummed_all_samples", "acc_first_sample_ours_on_decided", "disagreements", "refused"):
                if old["post_runs"][run][k] != rec["post_runs"][run][k]:
                    bad.append(run + "." + k)
        for run in rec["card_runs"]:
            for k in ("tally", "acc_resummed", "rows"):
                if old["card_runs"][run][k] != rec["card_runs"][run][k]:
                    bad.append(run + "." + k)
        if old["grader"]["sha256"] != rec["grader"]["sha256"]:
            bad.append("grader drift")
        if bad:
            print("FAIL  wsp-regrade --check: " + ", ".join(bad))
            sys.exit(1)
        print("PASS  wsp-regrade --check (%.1f s)" % rec["seconds"])
        return
    json.dump(rec, open(RECORD, "w"), indent=1)
    for run, r in rec["post_runs"].items():
        t = r["tally"]
        print(f"{run}: printed {r['merged_printed']['acc']}  resummed {r['acc_resummed_all_samples']:.4f}  first-sample theirs {r['acc_first_sample_theirs']:.3f}; "
              f"decided {t['decided']}/{t['n']} (refused {t['refused']}): theirs {r['acc_first_sample_theirs_on_decided']:.4f} ours {r['acc_first_sample_ours_on_decided']:.4f}; "
              f"agree {t['agree']}, their 1/our WRONG {t['their_1_our_WRONG']}, their 0/our CORRECT {t['their_0_our_CORRECT']}; no box {t['no_box']}; "
              f"texts {t['texts']}: extraction agrees {t['extraction_agrees']}, differs {t['extraction_differs']}")
    for run, r in rec["card_runs"].items():
        t = r["tally"]
        print(f"{run}: printed {r['summary_printed']['acc']} resummed {r['acc_resummed']:.4f}; texts {t['texts']}: decided {t['decided']}, agree {t['agree_with_first_flag']}, "
              f"their 1/our WRONG {t['their_1_our_WRONG']}, their 0/our CORRECT {t['their_0_our_CORRECT']}, refused {t['refused']}")
    print("record certs/wsp-regrade.json written in %.1f s" % rec["seconds"])


if __name__ == "__main__":
    main()
