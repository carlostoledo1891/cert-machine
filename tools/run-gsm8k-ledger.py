#!/usr/bin/env python3
"""run-gsm8k-ledger.py — the GSM8K answer key re-decided, exactly, and read
against GSM8K-Platinum. Writes certs/gsm8k-ledger.json.

    python3 tools/run-gsm8k-ledger.py            (about three seconds)
    python3 tools/run-gsm8k-ledger.py --check    re-derive and compare with the shipped ledger, write nothing

Pins first: the three corpus files re-hashed against corpus/gsm8k/meta.json;
a moved byte refuses the run. Then instruments/gsm8k/audit.py decides every
item of the test and train sets; then every Platinum row is joined to its
GSM8K row by question text and the two readings — this file's mechanical one
and Platinum's human one — are cross-tabulated. Every number a page states
about GSM8K comes from here.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
import time
from collections import Counter
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(ROOT, "instruments", "gsm8k"))
import audit  # noqa: E402

CORPUS = os.path.join(ROOT, "corpus", "gsm8k")
OUT = os.path.join(ROOT, "certs", "gsm8k-ledger.json")
CHECK = "--check" in sys.argv


def die(m):
    print("GSM8K LEDGER REFUSED: " + m, file=sys.stderr)
    sys.exit(1)


def sha(p):
    return hashlib.sha256(open(p, "rb").read()).hexdigest()


def load_jsonl(p):
    return [json.loads(l) for l in open(p, encoding="utf-8") if l.strip()]


def compact(d, keep_question=False):
    """One item's row for the ledger: the class and what a reader needs to
    re-check it, never the prompt text (the question is the corpus's)."""
    r = {"i": d["index"], "class": d["class"], "answer": d["final"], "annotations": len(d["annotations"]),
         "prose": sum(1 for p in d["prose"] if p["verdict"] != "UNREAD")}
    if d["class"] == "PRINTED_STEP_WRONG":
        r["witness"] = d["witness"]
        r["answer_held_elsewhere"] = d["answer_held_elsewhere"]
    if d["class"] == "ROUNDED_STEP":
        r["rounded"] = d["rounded"]
    if d["class"] == "ANSWER_IN_PROSE":
        r["derived_by"] = d["derived_by"]
    if d["class"] == "ANSWER_UNDERIVED":
        r["values"] = d["values"][-4:]
    if d["class"] == "REFUSED":
        r["why"] = d["why"]
    if keep_question:
        r["question"] = d["question"]
    return r


def main():
    t0 = time.time()
    meta = json.load(open(os.path.join(CORPUS, "meta.json")))
    claims = json.load(open(os.path.join(CORPUS, "claims.json")))
    pins = {}
    for group in ("gsm8k", "platinum"):
        for f, m in meta[group]["files"].items():
            p = os.path.join(CORPUS, f)
            if not os.path.exists(p):
                die(f"corpus/gsm8k/{f} is absent")
            h = sha(p)
            if h != m["sha256"]:
                die(f"corpus/gsm8k/{f} does not hash to its pin")
            pins[f"corpus/gsm8k/{f}"] = h

    sets = {}
    for name in ("test", "train"):
        rows = audit.audit_file(os.path.join(CORPUS, f"{name}.jsonl"))
        if len(rows) != meta["gsm8k"]["files"][f"{name}.jsonl"]["rows"]:
            die(f"{name} has {len(rows)} rows, the pin says {meta['gsm8k']['files'][name + '.jsonl']['rows']}")
        et = audit.equation_tally(rows)
        sets[name] = {
            "items": len(rows), "classes": audit.tally(rows),
            "annotations": et["annotations"], "prose": et["prose"],
            "annotationsTotal": sum(et["annotations"].values()),
            "proseTotal": sum(v for k, v in et["prose"].items() if k != "UNREAD"),
            "answerForms": dict(Counter(("fraction" if "/" in d["final"] else "negative" if d["final"].startswith("-")
                                          else "thousands" if "," in d["final"] else "decimal" if "." in d["final"] else "integer")
                                         for d in rows)),
            "rows": [compact(d) for d in rows],
            "_decided": rows,
        }

    # ---- Platinum, joined by question text ----
    test = sets["test"]["_decided"]
    by_q = {}
    for d in test:
        by_q.setdefault(d["question"], []).append(d)
    dup = [q for q, v in by_q.items() if len(v) > 1]
    plat = load_jsonl(os.path.join(CORPUS, "gsm8k-platinum.jsonl"))
    if len(plat) != meta["platinum"]["files"]["gsm8k-platinum.jsonl"]["rows"]:
        die("the Platinum file is not the pinned row count")
    status = {}
    unmatched = []
    revised = []
    for p in plat:
        hits = by_q.get(p["question"])
        if not hits:
            unmatched.append(p["question"][:80])
            continue
        d = hits[0]
        status[d["index"]] = p["cleaning_status"]
        if p["cleaning_status"] == "revised":
            new = audit.FINAL.search(p["answer"])
            new_ans = new.group(1).strip() if new else None
            revised.append({"i": d["index"], "class": d["class"], "gsm8k": d["final"], "platinum": new_ans,
                            "sameAnswer": (audit.read_number(new_ans) == audit.read_number(d["final"])) if new_ans else None,
                            "platinumSolutionChanged": p["answer"] != [r for r in load_jsonl(os.path.join(CORPUS, "test.jsonl"))][d["index"]]["answer"]})
    if unmatched:
        die(f"{len(unmatched)} Platinum rows match no GSM8K test question: {unmatched[:2]}")
    removed = [d["index"] for d in test if d["index"] not in status]
    for d in test:
        d["platinum"] = status.get(d["index"], "removed")
    cross = {}
    for d in test:
        cross.setdefault(d["platinum"], Counter())[d["class"]] += 1
    cross = {k: dict(v) for k, v in cross.items()}
    plat_counts = dict(Counter(d["platinum"] for d in test))
    printed = claims["platinum"]["printed"]
    if plat_counts.get("removed") != printed["removed"] or plat_counts.get("verified") != printed["verified"] or plat_counts.get("revised") != printed["revised"]:
        die(f"the Platinum counts {plat_counts} are not the printed {printed}")
    for d, r in zip(test, sets["test"]["rows"]):
        r["platinum"] = d["platinum"]

    # the arithmetic verdict of the items Platinum touched, and the converse
    flagged = [d for d in test if d["platinum"] in ("removed", "revised", "verified")]
    faults = [d for d in test if d["class"] == "PRINTED_STEP_WRONG"]
    findings = {
        "annotationsAllExact": all(v == "EXACT" for v in sets["test"]["annotations"]) and list(sets["test"]["annotations"]) == ["EXACT"],
        "printedStepWrongTest": len(faults),
        "printedStepWrongTestAnswerNotHeld": sum(1 for d in faults if not d["answer_held_elsewhere"]),
        "printedStepWrongTrain": sets["train"]["classes"]["PRINTED_STEP_WRONG"],
        "printedStepWrongTrainAnswerNotHeld": sum(1 for d in sets["train"]["_decided"] if d["class"] == "PRINTED_STEP_WRONG" and not d["answer_held_elsewhere"]),
        "printedStepWrongTrainAnnotationBeside": sum(1 for d in sets["train"]["_decided"] if d["class"] == "PRINTED_STEP_WRONG" and d["answer_held_elsewhere"]),
        "faultsPlatinumStatus": dict(Counter(d["platinum"] for d in faults)),
        "revisedByPlatinum": revised,
        "revisedWithPrintedStepWrong": sum(1 for r in revised if r["class"] == "PRINTED_STEP_WRONG"),
        "removedByPlatinum": {"n": len(removed), "classes": dict(Counter(d["class"] for d in test if d["platinum"] == "removed"))},
        "flaggedReproduced": sum(1 for d in flagged if d["class"] in ("REPRODUCED", "ANSWER_IN_PROSE")),
        "flagged": len(flagged),
    }

    ledger = {
        "what": "GSM8K's answer key (Cobbe et al. 2021; 1,319 test and 7,473 train items) re-decided in exact rational "
                "arithmetic: every calculator annotation <<lhs=rhs>> and every prose equation evaluated from the "
                "expression it prints and compared with the value it prints, the #### answer read against the last "
                "computed value; and, for the test set, every item's mechanical verdict set beside GSM8K-Platinum's "
                "human one (Vendrow et al. 2025: 110 removed, 99 verified, 10 revised).",
        "generated": time.strftime("%Y-%m-%d"),
        "pins": pins,
        "corpus": {"gsm8kCommit": meta["gsm8k"]["commit"], "platinumRevision": meta["platinum"]["revision"]},
        "classes": {
            "REPRODUCED": "every annotation exact; the answer is the last annotation's value",
            "ANSWER_IN_PROSE": "as above, the answer being the value of a prose equation that checks exactly",
            "ANSWER_UNDERIVED": "no arithmetic fault; the answer is not the value of any printed equation — a reader decides",
            "ROUNDED_STEP": "a printed step is a rounding of its exact value (within half a unit of its last place)",
            "PRINTED_STEP_WRONG": "a printed step is wrong by more than a rounding; the exact value is the witness",
            "NO_STEPS": "no equation of either kind is printed",
            "REFUSED": "an annotation outside the calculator grammar, or an unreadable answer",
        },
        "test": {k: v for k, v in sets["test"].items() if not k.startswith("_")},
        "train": {k: v for k, v in sets["train"].items() if not k.startswith("_")},
        "platinum": {"joinedBy": "question text, exact", "duplicateQuestionsInTest": len(dup),
                     "counts": plat_counts, "crossTab": cross},
        "findings": findings,
        "harnesses": claims["harnesses"],
        "observedHere": claims["observedHere"],
        "seconds": round(time.time() - t0, 2),
    }
    if CHECK:
        old = json.load(open(OUT)) if os.path.exists(OUT) else {}
        strip = lambda d: json.dumps({k: v for k, v in d.items() if k not in ("generated", "seconds")}, sort_keys=True)
        if strip(old) != strip(ledger):
            print("DRIFT: the ledger would change; run without --check")
            return 1
        print("gsm8k ledger unchanged")
        return 0
    json.dump(ledger, open(OUT, "w"), indent=1, ensure_ascii=False)
    t = ledger["test"]["classes"]
    print(f"wrote certs/gsm8k-ledger.json: test {t}; platinum {plat_counts}; findings {findings['printedStepWrongTest']} faults, "
          f"{findings['revisedWithPrintedStepWrong']} of {len(revised)} revised with a fault; {ledger['seconds']} s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
