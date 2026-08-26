#!/usr/bin/env python3
"""swap_consistency.py — exact-rational twin of swap-consistency.js (PATH 09).

Uses fractions.Fraction. from_double matches IEEE float → exact dyadic (same
class as eqcert fromDouble). Residual strings use n or n/d like Q.toString.

Crosslang gate: residual strings agree with the JS kernel on the fixture set.
"""
from __future__ import annotations

from fractions import Fraction
from typing import Any, Iterable, List, Optional, Sequence, Tuple, Union

Number = Union[int, float, Fraction, str]


def from_double(x: float) -> Fraction:
    """Lossless finite-float → Fraction (m·2^e), matching eqcert fromDouble."""
    if isinstance(x, Fraction):
        return x
    f = float(x)
    if f != f or f in (float("inf"), float("-inf")):
        raise ValueError("swap-consistency: non-finite double")
    return Fraction(*f.as_integer_ratio())


def q_prob(x: Number) -> Fraction:
    if isinstance(x, Fraction):
        r = x
    elif isinstance(x, str):
        r = Fraction(x)
    else:
        r = from_double(float(x))
    if r < 0 or r > 1:
        raise ValueError("swap-consistency: probability outside [0,1]: %s" % r_str(r))
    return r


def r_str(a: Fraction) -> str:
    a = Fraction(a)
    if a.denominator == 1:
        return str(a.numerator)
    return "%s/%s" % (a.numerator, a.denominator)


def residual_exact(p_orig: Number, p_swap: Number) -> Fraction:
    p = q_prob(p_orig)
    s = q_prob(p_swap)
    return abs(p - (1 - s))


def project_exact(p_orig: Number, p_swap: Number) -> Fraction:
    p = q_prob(p_orig)
    s = q_prob(p_swap)
    return (p + (1 - s)) / 2


def dispose_sample(
    pairs: Sequence[Sequence[Number]], eps: Optional[Number] = None
) -> dict:
    bound = Fraction(0) if eps is None else q_prob(eps)
    residuals: List[str] = []
    max_r = Fraction(0)
    for po, ps in pairs:
        r = residual_exact(po, ps)
        residuals.append(r_str(r))
        if r > max_r:
            max_r = r
    closes = max_r <= bound
    base = {
        "schema": "disposition/v0",
        "hack_class": None,
        "ground_truth_role": "unknown",
        "claim": {
            "statement": "swap-consistency residual |p_orig-(1-p_swap)| ≤ ε on the stated finite sample",
            "formalism": "p_sc=(p_orig+(1-p_swap))/2",
            "scope": "finite sample; algebraic projector only — not a PGR claim",
        },
        "witness": {
            "kind": "exact-residual",
            "kernel": "fellows-pack/kernels/swap_consistency.py",
            "payload": {
                "n": len(pairs),
                "eps": r_str(bound),
                "max_residual": r_str(max_r),
                "residuals": residuals,
            },
        },
    }
    if closes:
        return {
            **base,
            "verdict": "CERTIFIED",
            "refuse_reason": None,
            "notes": "pre-update residual; projector is identity on exact-consistent pairs",
        }
    return {
        **base,
        "verdict": "REFUSED",
        "refuse_reason": "max residual %s exceeds ε=%s" % (r_str(max_r), r_str(bound)),
        "notes": "honest stall — sample is not swap-consistent under stated ε",
    }


def consistent_sample(probs: Iterable[Number]) -> List[List[Fraction]]:
    out = []
    for p in probs:
        r = q_prob(p)
        out.append([r, 1 - r])
    return out


def plant_mutant(
    pairs: Sequence[Sequence[Number]], index: int = 0, delta: Optional[Number] = None
) -> List[List[Fraction]]:
    out = [[q_prob(a), q_prob(b)] for a, b in pairs]
    d = Fraction(1, 10) if delta is None else q_prob(delta)
    i = index
    po, ps = out[i]
    bad_swap = ps + d
    if bad_swap > 1:
        bad_swap = ps - d
    if bad_swap < 0:
        bad_swap = Fraction(0)
    if bad_swap > 1:
        bad_swap = Fraction(1)
    if residual_exact(po, bad_swap) == 0:
        bad_swap = Fraction(1) if po <= Fraction(1, 2) else Fraction(0)
    out[i] = [po, bad_swap]
    return out


if __name__ == "__main__":
    import json

    sample = consistent_sample([0, 0.25, 0.5, 0.75, 1, 1 / 3, 2 / 7])
    ok = dispose_sample(sample, 0)
    print(json.dumps({"verdict": ok["verdict"], "max": ok["witness"]["payload"]["max_residual"]}))
    bad = dispose_sample(plant_mutant(sample), 0)
    print(json.dumps({"verdict": bad["verdict"], "reason": bad["refuse_reason"]}))
    raise SystemExit(0 if ok["verdict"] == "CERTIFIED" and bad["verdict"] == "REFUSED" else 1)
