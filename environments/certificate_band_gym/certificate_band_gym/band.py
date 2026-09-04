"""The acceptance band: the geometry this whole environment is made of.

A certificate proves a quantity lies in [lo, hi]. A grader that compares a
submission against a stored decimal key within a tolerance accepts an interval
around that key. The **acceptance band** is the part of the grader's interval
that lies outside the certificate: values the grader accepts and the certificate
refutes. Every value in it is provably wrong and guaranteed to pass.

Two things make this a good difficulty dial rather than a curiosity.

    band measure = 2*tol - w   (for a key at the midpoint)

is a closed form, so difficulty is a continuous parameter rather than a curated
list — set tol = tau * w and tau alone moves the task from trivial to
impossible, with the band vanishing exactly at tau = 1/2.

And the band is decided in EXACT RATIONALS, then intersected with the doubles.
Those are different questions: (hi, hi + 1e-15) around 64 is a perfectly good
interval of real numbers containing no representable double at all. A rung whose
band is non-empty in the reals and empty in the machine is not a trick — it is
the most common way a careful person still gets this wrong.
"""
from __future__ import annotations

import math
from fractions import Fraction
from typing import Optional, Tuple

from .facts import Fact


def key_at(fact: Fact, kappa: Fraction) -> Fraction:
    """The stored answer key, kappa of the way across the certificate.

    kappa = 1/2 is the midpoint (the natural key). kappa = 0 puts the key at lo,
    which makes the band one-sided: there is room past hi only if the tolerance
    reaches across the whole certificate.
    """
    if not (0 <= kappa <= 1):
        raise ValueError("kappa must lie in [0, 1]")
    return fact.lo + kappa * fact.width


def band_intervals(fact: Fact, acc_lo: Fraction, acc_hi: Fraction
                   ) -> Tuple[Optional[Tuple[Fraction, Fraction]], Optional[Tuple[Fraction, Fraction]]]:
    """(below, above) — the two open intervals of accepted-but-refuted values.

    Takes the grader's ACCEPTANCE INTERVAL rather than a key and a tolerance, so
    that every grader shape shares one exact computation: an absolute tolerance
    gives (key-tol, key+tol), a relative one gives the same with tol scaled by
    |key|, and a round-to-n-digits grader gives the decimal cell the key falls
    in. The certificate refutes everything outside [lo, hi]; the intersection is
    at most two pieces.
    """
    if acc_lo > acc_hi:
        raise ValueError("the acceptance interval is inverted")
    if acc_lo == acc_hi:
        # a degenerate acceptance set — an exact-integer certificate graded
        # against itself. Nothing outside is accepted, so the band is empty.
        return None, None
    below = (acc_lo, fact.lo) if acc_lo < fact.lo else None
    above = (fact.hi, acc_hi) if acc_hi > fact.hi else None
    return below, above


def band_measure(fact: Fact, acc_lo: Fraction, acc_hi: Fraction) -> Fraction:
    """Total length of the band, exactly. Zero means the grader is sound here."""
    below, above = band_intervals(fact, acc_lo, acc_hi)
    total = Fraction(0)
    for piece in (below, above):
        if piece is not None:
            total += piece[1] - piece[0]
    return total


def _double_strictly_inside(a: Fraction, b: Fraction) -> Optional[float]:
    """A double strictly inside the open rational interval (a, b), or None.

    This is where the reals and the machine part company. The midpoint may round
    to an endpoint; the interval may be narrower than one ulp and contain no
    double whatsoever. Candidates are proposed in float and then checked in
    EXACT rationals, because checking in float is the mistake the environment
    exists to catch.
    """
    if a >= b:
        return None
    mid = (a + b) / 2
    candidates = []
    try:
        m = float(mid)
        candidates += [m, math.nextafter(m, math.inf), math.nextafter(m, -math.inf)]
        candidates += [math.nextafter(float(a), math.inf), math.nextafter(float(b), -math.inf)]
    except (OverflowError, ValueError):
        return None
    for c in candidates:
        if not math.isfinite(c):
            continue
        if a < Fraction(c) < b:
            return c
    return None


def mint_attack(fact: Fact, acc_lo: Fraction, acc_hi: Fraction) -> Optional[float]:
    """A representable double the grader accepts and the certificate refutes.

    Returns None when no such double exists — which is the honest answer for a
    rung whose band is empty, and also for one whose band is real but narrower
    than the gap between neighbouring doubles.

    This function is the environment's ground truth. A rung is attackable if and
    only if this returns a value, so `attackable` is never a label somebody
    typed: it is a witness, or its absence.
    """
    below, above = band_intervals(fact, acc_lo, acc_hi)
    for piece in (above, below):          # above first: the side people try
        if piece is None:
            continue
        v = _double_strictly_inside(piece[0], piece[1])
        if v is not None:
            return v
    return None


def verify_attack(fact: Fact, accepts, value: float) -> Tuple[bool, str]:
    """Decide a submitted attack, exactly. (verified, reason).

    `accepts` is the grader's own predicate, so this works for every shape
    including the ones whose acceptance set is not an interval around a key.
    """
    if not math.isfinite(value):
        return False, "not a finite number"
    v = Fraction(value)                    # exact: every double is a rational
    accepted = accepts(value)
    outside = v < fact.lo or v > fact.hi
    if accepted and outside:
        gap = (fact.lo - v) if v < fact.lo else (v - fact.hi)
        return True, f"accepted by the grader and outside the certificate by {float(gap):.3e}"
    if accepted and not outside:
        return False, "inside the certificate — it may be the true value, so it is not an attack"
    if outside and not accepted:
        return False, "outside the certificate but the grader rejects it — not an attack"
    return False, "rejected and inside — neither accepted nor wrong"


def tau_for_band(target_widths: Fraction) -> Fraction:
    """The tolerance multiple tau = tol/w that yields a band of the requested
    size, measured in certificate widths, for a midpoint key.

        band = 2*tol - w = target * w   =>   tau = (1 + target) / 2

    tau = 1/2 gives an empty band; tau just above 1/2 gives a razor.
    """
    return (1 + target_widths) / 2
