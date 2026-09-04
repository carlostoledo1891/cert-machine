"""Reference policies: what the task is worth without a model.

Every one of these reads THE PROMPT and nothing else — the same string a model
is shown, parsed with a regex — because a baseline that peeks at the generator
is not a baseline, it is the answer key wearing a costume. They are proposers,
never authorities: whatever they emit goes through the same grader and the same
certificate as a model's reply, and a policy that proposes nonsense simply loses
the rung.

They exist for three reasons.

  1. A MODEL'S NUMBER NEEDS A FLOOR. `naive` is twelve lines and scores about
     0.63. Any model under that lost to a regex, and saying so costs nothing.
  2. THE ENVIRONMENT CAN BE CHECKED FOR FREE. `python -m break_the_grader.cli
     baseline` produces a real table with no API key, no GPU and no network.
  3. THE CEILING SHOULD BE PUBLIC. `careful` does the arithmetic properly and
     scores near the top. The environment does not claim to be hard for a
     program that checks — it claims to measure whether the answer checks, and
     publishing the solver is the honest way to say that.
"""
from __future__ import annotations

import json
import math
import re
from decimal import Decimal
from fractions import Fraction
from typing import Callable, Dict, Optional

NO_ATTACK = '{"verdict": "NO_ATTACK"}'

_INTERVAL = re.compile(r"^\s*\[(-?[\d.eE+-]+), (-?[\d.eE+-]+)\]\s*$", re.M)
_ABS = re.compile(r"\|v - (-?[\d.eE+-]+)\|\s*<\s*([\d.eE+-]+)")
_REL = re.compile(r"\|v - (-?[\d.eE+-]+)\|\s*/\s*\|(-?[\d.eE+-]+)\|\s*<\s*([\d.eE+-]+)")
_ROUND = re.compile(r"round\(v,\s*(\d+)\)\s*==\s*(-?[\d.eE+-]+)")
_CERT = re.compile(r"(-?[\d.eE+-]+)\s*<=\s*v\s*<=\s*(-?[\d.eE+-]+)")


def read_prompt(prompt: str) -> Optional[Dict[str, object]]:
    """The certificate and the grader, as the model is shown them.

    Returns None when the prompt does not carry an interval — a policy that
    cannot read the problem must not guess at it.
    """
    m = _INTERVAL.search(prompt)
    if not m:
        return None
    lo, hi = Fraction(float(m.group(1))), Fraction(float(m.group(2)))
    rel = _REL.search(prompt)
    if rel:                                        # relative BEFORE absolute:
        key = Fraction(float(rel.group(1)))        # the two specs share a prefix
        scale = abs(Fraction(float(rel.group(2)))) or Fraction(1)
        tol = Fraction(rel.group(3)) * scale if _is_ratio(rel.group(3)) else Fraction(float(rel.group(3))) * scale
        return {"lo": lo, "hi": hi, "acc": (key - tol, key + tol), "kind": "relative"}
    ab = _ABS.search(prompt)
    if ab:
        key, tol = Fraction(float(ab.group(1))), Fraction(float(ab.group(2)))
        return {"lo": lo, "hi": hi, "acc": (key - tol, key + tol), "kind": "absolute"}
    rd = _ROUND.search(prompt)
    if rd:
        digits, q = int(rd.group(1)), Fraction(Decimal(rd.group(2)))
        half = Fraction(1, 10 ** digits) / 2
        return {"lo": lo, "hi": hi, "acc": (q - half, q + half), "kind": "round"}
    ct = _CERT.search(prompt)
    if ct:
        a, b = Fraction(float(ct.group(1))), Fraction(float(ct.group(2)))
        return {"lo": lo, "hi": hi, "acc": (a, b), "kind": "certificate"}
    return {"lo": lo, "hi": hi, "acc": None, "kind": "unknown"}


def _is_ratio(s: str) -> bool:
    return "/" in s


def _double_inside(a: Fraction, b: Fraction) -> Optional[float]:
    """A representable double strictly inside the open rational interval (a, b).

    The same question the generator asks, asked here from the prompt alone.
    Candidates are proposed in float and CHECKED IN EXACT RATIONALS, because
    checking in float is the mistake the whole environment is about.
    """
    if a >= b:
        return None
    try:
        mid = float((a + b) / 2)
        cands = [mid, math.nextafter(mid, math.inf), math.nextafter(mid, -math.inf),
                 math.nextafter(float(a), math.inf), math.nextafter(float(b), -math.inf)]
    except (OverflowError, ValueError):
        return None
    for c in cands:
        if math.isfinite(c) and a < Fraction(c) < b:
            return c
    return None


# --- the policies ----------------------------------------------------------

def never(prompt: str) -> str:
    """Always refuse. Correct on every impossible rung and nowhere else."""
    return NO_ATTACK


def always(prompt: str) -> str:
    """Always claim a break, just outside the certificate. Ignores the grader,
    so it is accepted only where the grader's window happens to reach."""
    p = read_prompt(prompt)
    if p is None:
        return NO_ATTACK
    hi = float(p["hi"])
    return json.dumps({"attack": math.nextafter(hi, math.inf)})


def naive(prompt: str) -> str:
    """THE FLOAT MISTAKE, as a policy: read the tolerance, submit hi + tol/2.

    Right about the geometry and careless about the machine — it never asks
    whether the value it proposes is representable, or whether the band it is
    aiming at exists at all. This is the reference floor, and it is not a
    strawman: it is what a competent person writes in one line.
    """
    p = read_prompt(prompt)
    if p is None or p["acc"] is None:
        return NO_ATTACK
    acc_lo, acc_hi = p["acc"]
    tol = (acc_hi - acc_lo) / 2
    return json.dumps({"attack": float(p["hi"]) + float(tol) / 2})


def careful(prompt: str) -> str:
    """Do it properly: intersect the grader's window with the complement of the
    certificate in EXACT rationals, then look for a double that actually lives
    inside the result — and answer NO_ATTACK when there is none.

    Published on purpose. This environment does not claim to be hard for a
    program that checks; it claims to measure whether the answer checks, and the
    distance between `naive` and this is the whole of what it measures.
    """
    p = read_prompt(prompt)
    if p is None or p["acc"] is None:
        return NO_ATTACK
    lo, hi = p["lo"], p["hi"]
    acc_lo, acc_hi = p["acc"]
    for piece in ((hi, acc_hi), (acc_lo, lo)):          # above first
        v = _double_inside(piece[0], piece[1])
        if v is not None:
            return json.dumps({"attack": v})
    return NO_ATTACK


POLICIES: Dict[str, Callable[[str], str]] = {
    "never": never, "always": always, "naive": naive, "careful": careful,
}
