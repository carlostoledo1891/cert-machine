#!/usr/bin/env python3
"""grade3.py: the Python grader of Stage 3 of the audit of "Language Models Can Rewrite Their Own Weights"
(arXiv 2611.21885 v2). Rules: notes/qwen-self-rewriting-stage3-preregistration-2026-11-26.md.

It is instruments/wsp/grade.py (the exact, three-valued, standard-library grader of the WSP lane, used unchanged) with
the paper's rule put in front of it (Tab. 5: "The last \\boxed{} after the thinking, checked against the reference
...; no credit if the thinking is still open when the budget runs out"):

  1. the thinking closes at the FIRST "</think>" of the response text (the generation prompt ends with "<think>\\n",
     so the text starts inside the thinking). No "</think>" at all: WRONG, "the thinking never closed", whether the
     answer was cut at the budget or stopped without closing it. Nothing inside the thinking is ever read.
  2. the answer region is the text after that "</think>"; its LAST closed \\boxed{...} is the prediction.
     No closed box in the region: WRONG. An empty box: WRONG ("an empty \\boxed{}").
  3. the prediction against the gold answer: instruments/wsp/grade.py's grade(), CORRECT / WRONG / REFUSED.
  A second reading is recorded beside the first and decides nothing by itself: the region after the LAST "</think>"
  (it can differ only on a response that closes the thinking twice and boxes nothing after the second close).

The JavaScript grader grade3.js applies the same rule from this description and shares no code with this file (it
wraps instruments/wsp/grade.js, which shares no code with instruments/wsp/grade.py).

usage: python3 grade3.py GOLD < response.txt        (prints the verdict as JSON)
       python3 grade3.py --selftest                  (the grader controls K3; exit 1 on a failure)
MIT"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(HERE)), "wsp"))
import grade as wsp  # noqa: E402  instruments/wsp/grade.py, unchanged

END = "</think>"
ELIGIBLE_GOLD = ("q", "sqrt", "pi", "deg", "c")   # the draw keeps a problem only if its gold is one of these


def gold_class(gold):
    """the canonical class of a gold answer under instruments/wsp/grade.py, or None for an empty one"""
    if gold is None or str(gold).strip() == "":
        return None
    return wsp.canon(gold)[0]


def _region(text, last):
    i = text.rfind(END) if last else text.find(END)
    return None if i < 0 else text[i + len(END):]


def _decide(gold, region):
    if region is None:
        return "WRONG", "the thinking never closed", None
    pred = wsp.extract_boxed(region)
    if pred is None:
        return "WRONG", "no closed \\boxed{} after the thinking", None
    if pred.strip() == "":
        return "WRONG", "an empty \\boxed{}", pred
    v, why = wsp.grade(gold, pred)
    return v, why, pred


def grade_response(gold, text, finish=None):
    """the verdict of one response: dict with verdict, reason, pred, think_closed, closes, and the second reading"""
    text = text or ""
    v, why, pred = _decide(gold, _region(text, last=False))
    v2, why2, pred2 = _decide(gold, _region(text, last=True))
    return {"verdict": v, "reason": why, "pred": pred, "think_closed": END in text, "closes": text.count(END),
            "cut": finish == "length", "second": {"verdict": v2, "pred": pred2}}


def selftest():
    """K3: planted responses whose verdicts are fixed by the rule; each must come out as stated"""
    cases = [
        ("7", "reasoning ... \\boxed{7}", "length", "WRONG"),                       # right box, thinking never closed
        ("7", "reasoning ... \\boxed{7} more", "stop", "WRONG"),                    # stopped without closing
        ("7", "think \\boxed{7}</think>The answer is \\boxed{8}.", "stop", "WRONG"),  # the box inside is never read
        ("7", "think \\boxed{8}</think>So \\boxed{7}.", "stop", "CORRECT"),
        ("7", "think</think>first \\boxed{8}, finally \\boxed{7}", "stop", "CORRECT"),  # the last box after
        ("7", "think</think>The answer is \\boxed{", "length", "WRONG"),             # closed, cut inside the box
        ("7", "think</think>The answer is \\boxed{7}", "length", "CORRECT"),         # closed, cut after the box
        ("7", "think</think>\\boxed{}", "stop", "WRONG"),                            # an empty box
        ("\\frac{1}{2}", "t</think>\\boxed{0.5}", "stop", "CORRECT"),
        ("\\frac{1}{2}", "t</think>\\boxed{x^2+1}", "stop", "REFUSED"),
        ("2\\sqrt{3}", "t</think>\\boxed{\\sqrt{12}}", "stop", "CORRECT"),
        ("7", "t</think>no box at all", "stop", "WRONG"),
    ]
    bad = []
    for gold, text, fin, want in cases:
        got = grade_response(gold, text, fin)["verdict"]
        if got != want:
            bad.append({"gold": gold, "text": text, "want": want, "got": got})
    two = grade_response("7", "a</think>\\boxed{7}</think>no box after the second close", "stop")
    if not (two["verdict"] == "CORRECT" and two["second"]["verdict"] == "WRONG" and two["closes"] == 2):
        bad.append({"case": "two closes", "got": two})
    return {"cases": len(cases) + 1, "failures": bad}


if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        r = selftest()
        print(json.dumps(r, indent=1))
        sys.exit(1 if r["failures"] else 0)
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    print(json.dumps(grade_response(sys.argv[1], sys.stdin.read())))
