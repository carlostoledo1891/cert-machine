#!/usr/bin/env python3
"""The GSM8K answer key re-decided, arithmetic step by arithmetic step, exactly.

    python3 instruments/gsm8k/audit.py corpus/gsm8k/test.jsonl [--witnesses]

Every GSM8K solution carries calculator annotations, `<<lhs=rhs>>`, that the
authors inserted so a model could call a calculator, and prose equations
("99 + 5 = $104") that carry the steps the calculator was not asked; the final
line `#### N` is the answer every harness grades against. This file reads
every `lhs` as the expression it denotes and evaluates it in exact rational
arithmetic (stdlib fractions, a hand-written parser — nothing is ever passed
to eval), reads every `rhs` and the final answer as the rationals they denote,
and decides:

  per equation (an annotation, or a prose equation)
    EXACT      rhs equals the exact value of lhs
    ROUNDED    rhs differs from the exact value by at most half a unit in the
               last place it prints (7/3 = 2.33; 7/2 = 3 is a rounding to zero
               places and is said so)
    WRONG      rhs differs by more than that — an arithmetic error, and the
               exact value is its witness
    REFUSED    (annotations only) lhs is not in the calculator grammar
               (+ - * / and parentheses), divides by zero, or rhs is not a
               number; nothing is guessed. A prose equation that cannot be
               read is UNREAD and never a verdict: "2/3 * x = 12" is algebra.

  per item
    REPRODUCED         every annotation EXACT, no WRONG or ROUNDED equation,
                       and the answer is the last annotation's value
    ANSWER_IN_PROSE    as above, but the answer is the value of a prose
                       equation after the last annotation (the calculator was
                       not asked for the last step; the step checks exactly)
    ANSWER_UNDERIVED   no arithmetic fault, but the answer is not the value of
                       any equation the key prints — a unit change, a rounding
                       up to whole packs, an algebra step: a READER decides
    ROUNDED_STEP       no WRONG equation, at least one ROUNDED
    PRINTED_STEP_WRONG at least one WRONG equation, as printed (the witness is named;
                       whether the answer still rests on a step that holds is recorded)
    NO_STEPS           the key prints no equation of either kind
    REFUSED            an annotation, or the answer, could not be read

Nothing here knows what a word problem means: an ambiguous question with
correct arithmetic is REPRODUCED. This is the mechanical half of a task-QA
audit — the half that needs no model and no reader — and its finding is the
set of items whose own printed arithmetic contradicts their own answer key.
The other half, GSM8K-Platinum's human reading of 219 model-flagged items, is
compared against it in the ledger.
"""
from __future__ import annotations

import json
import re
import sys
from fractions import Fraction
from typing import Any, Dict, List, Optional, Tuple

ANNOTATION = re.compile(r"<<([^<>]*)>>")
FINAL = re.compile(r"####\s*(.*?)\s*$", re.S)


class Refuse(Exception):
    pass


# ------------------------------------------------------------------ reading
def read_number(s: str) -> Optional[Fraction]:
    """The rational a printed number denotes, or None if it is not one.
    Accepts -12, 3.5, .5, 1,450,000 (thousands separators), 3/4, 60% (as
    60/100), and a leading $ sign; nothing else."""
    t = s.strip().replace("$", "").replace(" ", "")
    pct = t.endswith("%")
    if pct:
        t = t[:-1]
    if re.fullmatch(r"-?\d{1,3}(,\d{3})+(\.\d+)?", t):
        t = t.replace(",", "")
    v = None
    if re.fullmatch(r"-?\d+", t):
        v = Fraction(int(t))
    elif re.fullmatch(r"-?\d*\.\d+", t):
        v = Fraction(t)
    else:
        m = re.fullmatch(r"(-?\d+)/(\d+)", t)
        if m and int(m.group(2)) != 0:
            v = Fraction(int(m.group(1)), int(m.group(2)))
    if v is None:
        return None
    return v / 100 if pct else v


def decimals(s: str) -> int:
    """How many places after the point a printed number shows (0 if none);
    a percent adds two."""
    t = s.strip().replace("$", "").replace(",", "")
    pct = t.endswith("%")
    if pct:
        t = t[:-1]
    return (len(t.split(".", 1)[1]) if "." in t else 0) + (2 if pct else 0)


# ---------------------------------------------------------------- evaluating
_TOKEN = re.compile(r"\s*(?:(\d+\.\d*|\.\d+|\d+)(%?)|([+\-*/()]))")


def tokenize(expr: str) -> List[Tuple[str, str]]:
    out, i = [], 0
    while i < len(expr):
        m = _TOKEN.match(expr, i)
        if not m:
            if expr[i:].strip() == "":
                break
            raise Refuse(f"cannot read {expr[i:i + 12]!r} as arithmetic")
        if m.group(1) is not None:
            out.append(("num", m.group(1) + m.group(2)))
        else:
            out.append(("op", m.group(3)))
        i = m.end()
    return out


def evaluate(expr: str) -> Fraction:
    """An expression as the rational it denotes: + - * / and parentheses,
    left-associative, unary minus, a trailing % on a number meaning /100,
    exact. No names, no powers — GSM8K's calculator uses none."""
    toks = tokenize(expr)
    pos = 0

    def peek():
        return toks[pos] if pos < len(toks) else (None, None)

    def take():
        nonlocal pos
        t = toks[pos]
        pos += 1
        return t

    def parse_expr():
        v = parse_term()
        while peek() == ("op", "+") or peek() == ("op", "-"):
            _, op = take()
            w = parse_term()
            v = v + w if op == "+" else v - w
        return v

    def parse_term():
        v = parse_factor()
        while peek() == ("op", "*") or peek() == ("op", "/"):
            _, op = take()
            w = parse_factor()
            if op == "*":
                v = v * w
            else:
                if w == 0:
                    raise Refuse("division by zero")
                v = v / w
        return v

    def parse_factor():
        kind, val = peek()
        if kind == "op" and val == "-":
            take()
            return -parse_factor()
        if kind == "op" and val == "+":
            take()
            return parse_factor()
        if kind == "op" and val == "(":
            take()
            v = parse_expr()
            if peek() != ("op", ")"):
                raise Refuse("unbalanced parenthesis")
            take()
            return v
        if kind == "num":
            take()
            return Fraction(val[:-1]) / 100 if val.endswith("%") else Fraction(val)
        raise Refuse("expected a number" if kind is None else f"unexpected {val!r}")

    if not toks:
        raise Refuse("empty expression")
    v = parse_expr()
    if pos != len(toks):
        raise Refuse(f"trailing {toks[pos][1]!r}")
    return v


# ------------------------------------------------------------------ deciding
def decide_equation(lhs: str, rhs: str) -> Dict[str, Any]:
    out: Dict[str, Any] = {"lhs": lhs.strip(), "rhs": rhs.strip()}
    try:
        exact = evaluate(lhs)
    except Refuse as e:
        out.update(verdict="REFUSED", why=str(e))
        return out
    out["exact"] = str(exact)
    r = read_number(rhs)
    if r is None:
        out.update(verdict="REFUSED", why=f"rhs {rhs.strip()!r} is not a number")
        return out
    if r == exact:
        out["verdict"] = "EXACT"
        return out
    places = decimals(rhs)
    if abs(exact - r) <= Fraction(1, 2 * 10 ** places):
        out.update(verdict="ROUNDED", places=places, off=str(r - exact))
        return out
    out.update(verdict="WRONG", off=str(r - exact))
    return out


def decide_annotation(body: str) -> Dict[str, Any]:
    """One `<<lhs=rhs>>` body, decided."""
    if body.count("=") != 1:
        return {"lhs": body, "rhs": None, "verdict": "REFUSED", "why": "not one '='"}
    lhs, rhs = body.split("=")
    return decide_equation(lhs, rhs)


# a prose equation: a run of arithmetic characters with at least one '=' in it,
# read as a CHAIN "a = b = c" and decided pair by pair. 'x' with a space on both
# sides is multiplication; "3x" is algebra and the segment is UNREAD. A segment
# that begins with an operator was cut off by a word ("14 apples + 8 = 22" reads
# "+ 8 = 22") and is UNREAD too — nothing is guessed from a fragment.
_RUN = re.compile(r"[0-9.$%+\-–−*/()x×÷=, \t]+")          # never across a line break
_NUMBER_TEXT = re.compile(r"^-?\$?\s*\d[\d,]*(\.\d+)?(/\d+)?%?$")


def _normalize_prose(t: str) -> str:
    """Prose notation into the calculator grammar, conservatively: dashes,
    × ÷, dollar signs, thousands separators, a spaced 'x' as times, mixed
    numbers ("5 and 2/3", "16 and (2/3)"), and a fraction written without
    spaces as ONE literal ("25 / 1/3" is 25 ÷ (1/3), which is how every GSM8K
    writer means it; "14 / 1 / 4" stays left-associative, as printed)."""
    t = t.replace("×", "*").replace("÷", "/").replace("–", "-").replace("−", "-").replace("$", "")
    t = re.sub(r"(?<=\d),(?=\d{3}(?!\d))", "", t)
    t = re.sub(r"(\d+) and \(?(\d+/\d+)\)?", r"(\1+\2)", t)
    t = re.sub(r"(?<![\d/.])(\d+)/(\d+)(?![\d/.])", r"(\1/\2)", t)
    t = re.sub(r"(?<=\s)x(?=\s)", "*", t)
    return t


def _segment_value(seg: str) -> Optional[Fraction]:
    t = re.sub(r"\.$", "", seg.strip()).strip()       # a sentence's period, never a leading ".25"
    if not t or not re.search(r"\d", t):
        return None
    t = t.replace("–", "-").replace("−", "-")
    if re.match(r"^[+*/×÷=]", t) or re.match(r"^-\s*$", t):
        return None                                   # cut off by a word
    if re.match(r"^-\s", t):
        return None                                   # "- 6 = 12" is "18 - 6" with the 18 lost
    norm = _normalize_prose(t)
    if "," in norm or "x" in norm:
        return None                                   # a list, or algebra
    try:
        return evaluate(norm)
    except Refuse:
        return None


def prose_equations(text: str) -> List[Dict[str, Any]]:
    """Every `a = b` pair written in the prose (annotations removed), each
    decided or UNREAD. Only pairs whose left side contains an operator are
    equations: "x = 18" has no arithmetic to check."""
    plain = ANNOTATION.sub("", text)
    plain = re.sub(r"(\d+) and \(?(\d+/\d+)\)?", r"(\1+\2)", plain)      # "5 and 2/3", a mixed number
    out = []
    for m in _RUN.finditer(plain):
        run = m.group(0)
        if "=" not in run:
            continue
        # glued to a word or a clock ("w-10=60", "1.2Y", "6:00+48=6:48"): the
        # segment on that side is a fragment, not an equation
        glued_before = m.start() > 0 and (plain[m.start() - 1].isalnum() or plain[m.start() - 1] == ":") and not run[0].isspace()
        glued_after = m.end() < len(plain) and (plain[m.end()].isalpha() or plain[m.end()] == ":") and not run[-1].isspace()
        after_word = re.match(r"\s*([A-Za-z]+)", plain[m.end():])
        unit_after = after_word.group(1).lower() if after_word else ""
        segs = run.split("=")
        for k, (a, b) in enumerate(zip(segs, segs[1:])):
            a_t, b_t = re.sub(r"\.$", "", a.strip()).strip(), re.sub(r"\.$", "", b.strip()).strip()
            a_ops = re.sub(r"^\s*[-–−]", "", a_t)              # a leading minus is a sign, not an operator
            if not re.search(r"[+\-–−*/x×÷]", a_ops) or not re.search(r"\d", a_t) or not re.search(r"\d", b_t):
                continue
            d: Dict[str, Any] = {"prose": a_t + " = " + b_t, "lhs": a_t, "rhs": b_t}
            if (k == 0 and glued_before) or (k == len(segs) - 2 and glued_after):
                d["verdict"] = "UNREAD"
                out.append(d)
                continue
            va = _segment_value(a_t)
            vb = _segment_value(b_t)
            if va is None or vb is None:
                d["verdict"] = "UNREAD"
                out.append(d)
                continue
            d["exact"] = str(va)
            # unit labels: a percent sign on one side only ("100 - 60 = 40%",
            # "1.2 x 100% = 120"), "cents" after a dollar computation, are read
            # as the label they are, so the equality is tried at the scale too
            alt = {vb}
            if ("%" in a_t) != ("%" in b_t):
                alt |= {vb * 100, vb / 100}
            if k == len(segs) - 2 and unit_after in ("cent", "cents") and "$" in a_t:
                alt.add(vb / 100)
            # a running chain, "10 + 5 = 15 + 3 = 18": the right side of a pair
            # may be the next step, and then the equation asserts its LEADING number
            lead = re.match(r"^-?\$?\s*\d[\d,]*(\.\d+)?(/\d+)?%?", b_t) if re.search(r"[+\-*/x×÷]", b_t) else None
            vlead = _segment_value(lead.group(0)) if lead else None
            if va in alt:
                d["verdict"] = "EXACT"
            elif vlead is not None and va == vlead:
                d.update(verdict="EXACT", chain=True)
            elif _NUMBER_TEXT.match(b_t) and abs(va - vb) <= Fraction(1, 2 * 10 ** decimals(b_t)):
                d.update(verdict="ROUNDED", places=decimals(b_t), off=str(vb - va))
            else:
                d.update(verdict="WRONG", off=str(vb - va))
            out.append(d)
    return out


def decide_item(answer: str) -> Dict[str, Any]:
    """One GSM8K solution string, decided."""
    anns = [decide_annotation(b) for b in ANNOTATION.findall(answer)]
    prose = prose_equations(answer)
    m = FINAL.search(answer)
    final = m.group(1).strip() if m else None
    fv = read_number(final) if final is not None else None
    out: Dict[str, Any] = {"annotations": anns, "prose": prose, "final": final,
                           "final_value": (str(fv) if fv is not None else None)}
    av = [a["verdict"] for a in anns]
    pv = [p["verdict"] for p in prose if p["verdict"] != "UNREAD"]
    if final is None or fv is None or "REFUSED" in av:
        out["class"] = "REFUSED"
        out["why"] = ("no #### answer" if final is None else f"answer {final!r} is not a number"
                      if fv is None else next(a["why"] for a in anns if a["verdict"] == "REFUSED"))
        return out
    wrong = [a for a in anns if a["verdict"] == "WRONG"] + [p for p in prose if p["verdict"] == "WRONG"]
    if wrong:
        w = wrong[0]
        out["class"] = "PRINTED_STEP_WRONG"
        out["witness"] = {"lhs": w.get("prose", w["lhs"]).split(" = ")[0] if "prose" in w else w["lhs"],
                          "rhs": w["rhs"], "exact": w["exact"], "off": w["off"],
                          "where": "prose" if "prose" in w else "annotation"}
        # does the answer still rest on an equation that holds? (a typo in one
        # line of a key whose answer is computed correctly elsewhere)
        held = {a["exact"] for a in anns if a["verdict"] == "EXACT"} | {p["exact"] for p in prose if p["verdict"] == "EXACT"}
        out["answer_held_elsewhere"] = str(fv) in held
        return out
    if not anns and not pv:
        out["class"] = "NO_STEPS"
        return out
    rounded = [a for a in anns if a["verdict"] == "ROUNDED"] + [p for p in prose if p["verdict"] == "ROUNDED"]
    if rounded:
        out["class"] = "ROUNDED_STEP"
        out["rounded"] = [{"lhs": r.get("prose", r["lhs"]), "rhs": r["rhs"], "exact": r["exact"], "places": r["places"]}
                          for r in rounded]
        return out
    if anns:
        last = Fraction(anns[-1]["exact"])
        out["last_value"] = str(last)
        if fv == last:
            out["class"] = "REPRODUCED"
            return out
    # the answer is the value of a prose equation, exactly checked
    hits = [p for p in prose if p["verdict"] == "EXACT" and Fraction(p["exact"]) == fv]
    if hits:
        out["class"] = "ANSWER_IN_PROSE"
        out["derived_by"] = hits[-1]["prose"]
        return out
    out["class"] = "ANSWER_UNDERIVED"
    out["values"] = sorted({a["exact"] for a in anns} | {p["exact"] for p in prose if p["verdict"] == "EXACT"},
                           key=lambda s: Fraction(s))
    return out


CLASSES = ("REPRODUCED", "ANSWER_IN_PROSE", "ANSWER_UNDERIVED", "ROUNDED_STEP",
           "PRINTED_STEP_WRONG", "NO_STEPS", "REFUSED")


def audit_file(path: str) -> List[Dict[str, Any]]:
    rows = []
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f):
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            d = decide_item(r["answer"])
            d["index"] = i
            d["question"] = r["question"]
            rows.append(d)
    return rows


def tally(rows: List[Dict[str, Any]]) -> Dict[str, int]:
    t = {c: 0 for c in CLASSES}
    for r in rows:
        t[r["class"]] += 1
    return t


def equation_tally(rows: List[Dict[str, Any]]) -> Dict[str, Dict[str, int]]:
    a: Dict[str, int] = {}
    p: Dict[str, int] = {}
    for r in rows:
        for x in r["annotations"]:
            a[x["verdict"]] = a.get(x["verdict"], 0) + 1
        for x in r["prose"]:
            p[x["verdict"]] = p.get(x["verdict"], 0) + 1
    return {"annotations": dict(sorted(a.items())), "prose": dict(sorted(p.items()))}


def main(argv: List[str]) -> int:
    if not argv:
        print(__doc__)
        return 2
    rows = audit_file(argv[0])
    t = tally(rows)
    print(f"{len(rows)} items: " + ", ".join(f"{k} {v}" for k, v in t.items()))
    et = equation_tally(rows)
    print("annotations: " + ", ".join(f"{k} {v}" for k, v in et["annotations"].items()))
    print("prose equations: " + ", ".join(f"{k} {v}" for k, v in et["prose"].items()))
    if "--witnesses" in argv:
        for r in rows:
            if r["class"] == "PRINTED_STEP_WRONG":
                w = r["witness"]
                print(f"  #{r['index']}: {w['where']} {w['lhs']} = {w['rhs']} · exact {w['exact']} (off {w['off']}); answer {r['final']}")
            elif r["class"] == "ROUNDED_STEP":
                print(f"  #{r['index']}: ROUNDED " + "; ".join(f"{x['lhs']} = {x['rhs']} (exact {x['exact']})" for x in r["rounded"]))
            elif r["class"] == "ANSWER_UNDERIVED":
                print(f"  #{r['index']}: answer {r['final']} is none of {r['values']}")
            elif r["class"] in ("REFUSED", "NO_STEPS"):
                print(f"  #{r['index']}: {r['class']} {r.get('why', '')}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
