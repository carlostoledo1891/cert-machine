#!/usr/bin/env python3
"""grade.py — an exact grader for boxed MATH answers, Python standard library only (fractions, re). No sympy, no
math-verify, no code shared with the claimants' mathqa.py (read as text, never run).

The grader is three-valued and never guesses:
  CORRECT  the prediction and the gold answer parse to the SAME canonical exact object
  WRONG    both parse, to DIFFERENT exact objects — or the prediction has no closed \\boxed{} at all
  REFUSED  the grader cannot decide (an expression it does not canonicalise, a \\pm, an ordering it will not assume, …)
A REFUSED is not a wrong answer and not a right one: it is reported as such, and the accuracy is re-stated on the
decided subset only.

Canonical objects (every one exact):
  ('q', Fraction)                      integers, \\frac{a}{b}, \\dfrac, a/b, mixed numbers a\\frac{b}{c}, decimals, 1,000
  ('q%', Fraction)                     a percentage  n\\%  (never equal to the bare number)
  ('deg', Fraction)                    n^\\circ — compared equal to the bare number n (the degree sign read as decoration
                                       when the GOLD carries it; stated here as the one convention)
  ('sqrt', Fraction, int)              c·√m with m square-free (k\\sqrt{n}, \\frac{a\\sqrt{n}}{b}, \\frac{\\sqrt n}{b}, …)
  ('pi', Fraction)                     c·π  (k\\pi, \\frac{k\\pi}{m}, \\frac{k}{m}\\pi, -\\frac{\\pi}{6})
  ('c', Fraction, Fraction)            a + b i with rational a, b
  ('text', str)                        \\text{word} / \\textbf{word} / a bare word, lower-cased
  ('base', str, str)                   digits_base  (52_8, 4210_{5})
  ('tuple', (objects…))                ( … , … ) or a bare comma list — ORDERED; the same multiset in another order
                                       is REFUSED, not WRONG (a set answer may be meant)
  ('lit', str)                         anything else, whitespace- and brace-normalised: equal strings → CORRECT,
                                       different strings → REFUSED (they may still be equivalent)
MIT"""
import re
from fractions import Fraction

__all__ = ["extract_boxed", "canon", "grade"]


# ---------------------------------------------------------------- extraction
def extract_boxed(text):
    """the content of the LAST \\boxed{…} (brace-matched) in text; a '\\boxed ' without a brace reads to the next '$' or
    line end; no closed box → None. Written from the convention's description, not from any grader's code."""
    if text is None:
        return None
    i = text.rfind("\\boxed")
    if i < 0:
        return None
    j = i + len("\\boxed")
    while j < len(text) and text[j] == " ":
        j += 1
    if j >= len(text):
        return None
    if text[j] != "{":
        k = j
        while k < len(text) and text[k] not in "$\n":
            k += 1
        s = text[j:k].strip()
        return s or None
    depth = 0
    k = j
    while k < len(text):
        ch = text[k]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[j + 1:k]
        k += 1
    return None  # unclosed


# ---------------------------------------------------------------- normalisation
def _strip(s):
    s = s.strip()
    s = s.replace("\\!", "").replace("\\,", "").replace("\\;", "").replace("\\ ", "")
    s = s.replace("\\left", "").replace("\\right", "")
    s = s.replace("\\dfrac", "\\frac").replace("\\tfrac", "\\frac")
    s = s.replace("\\displaystyle", "")
    s = re.sub(r"\\(text|mathrm|textbf|mbox)\{([^{}]*)\}", lambda m: " " + m.group(2) + " ", s)
    s = s.replace("$", "")
    s = re.sub(r"\s+", " ", s).strip()
    s = s.rstrip(".")
    s = s.strip()
    if s.startswith("{") and s.endswith("}") and _balanced(s[1:-1]):
        s = s[1:-1].strip()
    return s


def _balanced(s):
    d = 0
    for ch in s:
        if ch == "{":
            d += 1
        elif ch == "}":
            d -= 1
            if d < 0:
                return False
    return d == 0


_INT = r"-?\d+"
_DEC = r"-?(?:\d+\.\d*|\.\d+)"
_NUM = r"-?(?:\d+(?:,\d{3})+|\d+\.\d*|\.\d+|\d+)"


def _q(s):
    """a rational from an integer / decimal / grouped-integer string, or None."""
    s = s.strip().replace(" ", "")
    if re.fullmatch(r"-?\d{1,3}(?:,\d{3})+", s):
        s = s.replace(",", "")
    if re.fullmatch(_INT, s):
        return Fraction(int(s))
    if re.fullmatch(_DEC, s):
        return Fraction(s)
    return None


def _frac(s):
    """\\frac{a}{b}, \\frac ab, a/b, -\\frac…, a\\frac{b}{c} (mixed) → Fraction or None; a, b integers/decimals."""
    s = s.strip().replace(" ", "")
    m = (re.fullmatch(r"(-?)(\d+)?\\frac\{(" + _NUM + r")\}\{(" + _NUM + r")\}", s) or re.fullmatch(r"(-?)(\d+)?\\frac(\d)(\d)", s)
         or re.fullmatch(r"(-?)(\d+)?\\frac(\d)\{(" + _NUM + r")\}", s) or re.fullmatch(r"(-?)(\d+)?\\frac\{(" + _NUM + r")\}(\d)", s))
    if m:
        sign = -1 if m.group(1) else 1
        whole = Fraction(int(m.group(2))) if m.group(2) else Fraction(0)
        a, b = _q(m.group(3)), _q(m.group(4))
        if a is None or b is None or b == 0:
            return None
        return sign * (whole + a / b)
    m = re.fullmatch(r"(" + _NUM + r")/(" + _NUM + r")", s)
    if m:
        a, b = _q(m.group(1)), _q(m.group(2))
        if a is None or b is None or b == 0:
            return None
        return a / b
    return _q(s)


def _sqfree(n):
    """n = c²·m with m square-free: returns (c, m); n ≥ 0 integer."""
    c, m, p = 1, n, 2
    while p * p <= m:
        while m % (p * p) == 0:
            m //= p * p
            c *= p
        p += 1
    return c, m


def _coef(s):
    """a coefficient string before \\sqrt or \\pi: '', '-', '3', '-2', '\\frac{3}{2}', '3/2' → Fraction or None"""
    s = s.strip()
    if s in ("", "+"):
        return Fraction(1)
    if s == "-":
        return Fraction(-1)
    return _frac(s)


def canon(s):
    """the canonical exact object of an answer string, or ('lit', normalised) when nothing else applies."""
    if s is None:
        return None
    s = _strip(s)
    if s == "":
        return ("lit", "")
    # a grouped integer / decimal ("1,000", "32,348.5") before any comma split
    if re.fullmatch(r"-?\d{1,3}(?:,\d{3})+(?:\.\d+)?", s.replace(" ", "")):
        return ("q", Fraction(s.replace(" ", "").replace(",", "")))
    # a tuple / list of atoms
    inner = s
    if (s.startswith("(") and s.endswith(")")) or (s.startswith("[") and s.endswith("]")):
        inner = s[1:-1]
    parts = _split_top(inner, ",")
    if len(parts) > 1 and all(_atom(p) is not None for p in parts):
        if (s[0] in "([" and s[-1] in ")]") and (s[0], s[-1]) in (("(", "]"), ("[", ")")):
            return ("lit", s.replace(" ", ""))   # an interval, not a tuple
        return ("tuple", tuple(_atom(p) for p in parts))
    a = _atom(s)
    if a is not None:
        return a
    return ("lit", s.replace(" ", ""))


def _split_top(s, sep):
    out, d, cur = [], 0, ""
    for ch in s:
        if ch in "({[":
            d += 1
        elif ch in ")}]":
            d -= 1
        if ch == sep and d == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return [p.strip() for p in out]


def _atom(s):
    s = s.strip()
    if s == "":
        return None
    # percent
    m = re.fullmatch(r"(" + _NUM + r")\s*\\%", s) or re.fullmatch(r"(" + _NUM + r")\s*%", s)
    if m:
        return ("q%", _q(m.group(1)))
    # degrees
    m = re.fullmatch(r"(-?[\d.,/\\{}frac]+?)\s*\^\s*(\\circ|\{\\circ\})", s)
    if m:
        q = _frac(m.group(1))
        if q is not None:
            return ("deg", q)
    # plain rational
    q = _frac(s)
    if q is not None:
        return ("q", q)
    # base-n literal
    m = re.fullmatch(r"(\d+)_\{?(\d+)\}?", s)
    if m:
        return ("base", m.group(1), m.group(2))
    # c·√m  (coefficient forms: k\sqrt{n}, \frac{a\sqrt{n}}{b}, \frac{\sqrt{n}}{b}, k\sqrt{n}/b, \sqrt{n}/b, \sqrt n)
    m = re.fullmatch(r"(-?\d*|-?\\frac\{\d+\}\{\d+\}|-?\d+/\d+)\s*\\sqrt\s*(?:\{(\d+)\}|(\d+))(?:/(\d+))?", s.replace(" ", ""))
    if m:
        c = _coef(m.group(1))
        n = int(m.group(2) or m.group(3))
        if c is not None:
            if m.group(4):
                c = c / int(m.group(4))
            return _sqrt_obj(c, n)
    m = re.fullmatch(r"(-?)\\frac\{(\d*)\\sqrt\{?(\d+)\}?\}\{(\d+)\}", s.replace(" ", ""))
    if m:
        c = Fraction(int(m.group(2)) if m.group(2) else 1, int(m.group(4))) * (-1 if m.group(1) else 1)
        return _sqrt_obj(c, int(m.group(3)))
    # c·π
    t = s.replace(" ", "")
    m = re.fullmatch(r"(-?\d*|-?\\frac\{\d+\}\{\d+\}|-?\d+/\d+)\\pi(?:/(\d+))?", t)
    if m:
        c = _coef(m.group(1))
        if c is not None:
            if m.group(2):
                c = c / int(m.group(2))
            return ("pi", c)
    m = re.fullmatch(r"(-?)\\frac\{(\d*)\\pi\}\{(\d+)\}", t)
    if m:
        c = Fraction(int(m.group(2)) if m.group(2) else 1, int(m.group(3))) * (-1 if m.group(1) else 1)
        return ("pi", c)
    # a + b i
    m = re.fullmatch(r"(" + _NUM + r"|-?\\frac\{\d+\}\{\d+\})?\s*([+-])?\s*(" + _NUM + r"|\\frac\{\d+\}\{\d+\})?\s*i", s)
    if m and "i" in s and (m.group(1) or m.group(3) or m.group(2)):
        re_, sign, im_ = m.group(1), m.group(2), m.group(3)
        a = _frac(re_) if re_ else Fraction(0)
        b = _frac(im_) if im_ else Fraction(1)
        if re_ and not sign and im_ is None:
            return None   # "3i" matched as re with no sign: handled below
        if a is None or b is None:
            return None
        if sign == "-":
            b = -b
        return ("c", a, b)
    m = re.fullmatch(r"(-?)(" + _NUM + r"|\\frac\{\d+\}\{\d+\})?i", t)
    if m:
        b = _frac(m.group(2)) if m.group(2) else Fraction(1)
        if b is None:
            return None
        return ("c", Fraction(0), -b if m.group(1) else b)
    # a bare word
    if re.fullmatch(r"[A-Za-z][A-Za-z ]*", s):
        return ("text", s.strip().lower())
    return None


def _sqrt_obj(c, n):
    k, m = _sqfree(n)
    c = c * k
    if m == 1:
        return ("q", c)
    return ("sqrt", c, m)


# ---------------------------------------------------------------- the decision
def _same(g, p):
    if g == p:
        return True
    if g[0] == "deg" and p[0] == "q" and g[1] == p[1]:
        return True   # the gold's degree sign read as decoration
    if g[0] == "q" and p[0] == "deg" and g[1] == p[1]:
        return True
    return False


def grade(gold, pred):
    """returns (verdict, reason): CORRECT / WRONG / REFUSED"""
    if pred is None:
        return "WRONG", "no closed \\boxed{} in the response"
    g, p = canon(gold), canon(pred)
    if g[0] == "lit" or p[0] == "lit":
        if g[0] == "lit" and p[0] == "lit" and g[1] == p[1]:
            return "CORRECT", "identical after normalisation"
        return "REFUSED", "not canonicalised: gold %s / pred %s" % (g[0], p[0])
    if g[0] == "tuple" and p[0] == "tuple":
        if len(g[1]) != len(p[1]):
            return "WRONG", "tuples of different length"
        if all(_same(x, y) for x, y in zip(g[1], p[1])):
            return "CORRECT", "equal tuples"
        if sorted(map(repr, g[1])) == sorted(map(repr, p[1])):
            return "REFUSED", "the same elements in another order (a set may be meant)"
        if any(x[0] == "lit" or y[0] == "lit" for x in g[1] for y in p[1]):
            return "REFUSED", "a tuple element not canonicalised"
        return "WRONG", "different tuples"
    if g[0] == "tuple" or p[0] == "tuple":
        if g[0] == "tuple" and len(g[1]) == 1 and _same(g[1][0], p):
            return "CORRECT", "a singleton tuple"
        return "WRONG", "a tuple against a scalar"
    if _same(g, p):
        return "CORRECT", "equal exact objects"
    if g[0] == "text" or p[0] == "text":
        return "WRONG" if (g[0] == p[0] == "text") else "REFUSED", "text answers"
    if "q%" in (g[0], p[0]) and g[0] != p[0]:
        return "REFUSED", "a percentage against a number (the convention is not decided here)"
    if "base" in (g[0], p[0]) and g[0] != p[0]:
        return "REFUSED", "a base-n literal against a bare number (the convention is not decided here)"
    return "WRONG", "different exact objects: %s vs %s" % (_show(g), _show(p))


def _show(o):
    return o[0] + ":" + ",".join(str(x) for x in o[1:])


if __name__ == "__main__":
    import sys
    print(grade(sys.argv[1], sys.argv[2]))
