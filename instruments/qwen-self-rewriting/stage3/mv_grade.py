#!/usr/bin/env python3
"""mv_grade.py: the paper's grader as a READING beside ours (Stage 3, notes/qwen-self-rewriting-stage3-preregistration-
2026-11-26.md). The paper names Math-Verify and gives no version; this runs math-verify 0.9.0 (wheels pinned by sha256 in
corpus/qwen-self-rewriting/stage3/PINS.json, installed into /w/mvlib apart from the engine's Python packages). Its
verdicts decide no row; they are printed beside the two graders'.

Rule, as Tab. 5 states it: no credit if the text has no "</think>"; otherwise Math-Verify's own extraction over the text
after the first "</think>" (LaTeX with \\boxed{} first, then plain expressions), against the gold answer read as
\\boxed{gold}; verify(gold, prediction).
usage: python3 mv_grade.py MVLIB DRAW.jsonl RESPONSES.jsonl OUT.jsonl
MIT"""
import json
import sys

sys.path.insert(0, sys.argv[1])
from math_verify import ExprExtractionConfig, LatexExtractionConfig, parse, verify  # noqa: E402
import math_verify  # noqa: E402

CFG = [LatexExtractionConfig(boxed_match_priority=0), ExprExtractionConfig()]


def main():
    _, _, draw, responses, out = sys.argv
    gold = {json.loads(l)["id"]: json.loads(l)["answer"] for l in open(draw, encoding="utf-8") if l.strip()}
    with open(out, "w", encoding="utf-8") as fo:
        for line in open(responses, encoding="utf-8"):
            if not line.strip():
                continue
            r = json.loads(line)
            text = r.get("text") or ""
            i = text.find("</think>")
            rec = {"id": r["id"], "mv_version": getattr(math_verify, "__version__", "0.9.0")}
            if i < 0:
                rec.update({"mv": False, "why": "the thinking never closed"})
            else:
                try:
                    g = parse("\\boxed{" + gold[r["id"]] + "}", extraction_config=CFG)
                    p = parse(text[i + len("</think>"):], extraction_config=CFG)
                    rec.update({"mv": bool(verify(g, p)), "gold_parsed": [str(x) for x in g][:2], "pred_parsed": [str(x) for x in p][:2]})
                except Exception as e:  # noqa: BLE001
                    rec.update({"mv": None, "why": "error: " + str(e)[:200]})
            fo.write(json.dumps(rec, ensure_ascii=False) + "\n")
    print("MV-DONE", out)


if __name__ == "__main__":
    main()
