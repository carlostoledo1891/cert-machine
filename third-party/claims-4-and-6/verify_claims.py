#!/usr/bin/env python3
"""verify_claims.py - a third-party exact recheck of cert-machine claims #4 and #6.

Independent of the engine and of the owner's checkers: it reads only the pinned witness
bytes and recomputes every number in exact rational arithmetic with its own algorithms.

    python3 -I verify_claims.py                 # the two verdicts and their numbers
    python3 -I verify_claims.py --controls      # add the control battery
    python3 -I verify_claims.py --json          # machine record
    python3 -I verify_claims.py --scan-upto N   # add the far float screen (slow)

Runtime: about 8 s for the two claims, about 20 s more with --controls; the far screen
adds about a minute per 6.4 million integers.  Standard library only.
"""

import argparse
import hashlib
import json
import os
from decimal import Decimal, getcontext
from fractions import Fraction
from functools import reduce
from math import gcd

getcontext().prec = 100

AC2_SHA = "3d453b729f5913e7f686e1386c5351fb90a2f434910604c6199ad39905a3cb4b"
BEST7_SHA = "5382b697a7920edd92edc8c4770441925042bde3d3719456e84f248fbb8bd333"
STATEMENT_SHA = "5e97cd89a653836230688934cdf92681e546ade47f0e2b2fad18b79ac3d2e20d"

AC2_PATH = "corpus/claims-intake/inputs/thetaevolve-7c12898-SecondAutoCorrIneq-data.json"
BEST7_PATH = "corpus/einstein-arena/best-7.json"
STATEMENT_PATH = "corpus/claims-intake/inputs/einstein-arena-api-problems-prime-number-theorem_2026-11-08.json"

ENTRY = "8B-w_RL@65"
CELLS = 3072
CLAIM_THRESHOLD = Fraction("0.9469")
TOLERANCE = Fraction(10001, 10000)
PLATFORM_SCORE = Decimal("0.9976572852677297")
SCORE_TOLERANCE = Decimal("0.000001")
EXTRA_RANGE = 400000


def refuse(msg):
    print("REFUSED: " + msg)
    raise SystemExit(2)


def pinned(path, sha):
    if not os.path.exists(path):
        refuse("missing input " + path)
    raw = open(path, "rb").read()
    got = hashlib.sha256(raw).hexdigest()
    if got != sha:
        refuse("%s hashes to %s, the pin is %s" % (os.path.basename(path), got, sha))
    return raw


def load_exact(path):
    return json.loads(open(path, encoding="utf-8").read(), parse_float=str, parse_int=str)


def _fmt(v, places):
    s = str(abs(v)).rjust(places + 1, "0")
    return ("-" if v < 0 else "") + s[:-places] + "." + s[-places:]


def dec(x, places):
    """The floor of x at a fixed number of decimals."""
    return _fmt((x.numerator * 10 ** places) // x.denominator, places)


def dec_up(x, places):
    """The ceiling of x at a fixed number of decimals."""
    return _fmt(-((-x.numerator * 10 ** places) // x.denominator), places)


def enclosure(x, places=30):
    return [dec(x, places), dec_up(x, places)]


# ---------- claim #4 ----------

def scale_to_integers(values):
    k = 0
    while any((Fraction(v) * 10 ** k).denominator != 1 for v in values):
        k += 1
        if k > 400:
            refuse("a value that is not a finite decimal")
    return [int(Fraction(v) * 10 ** k) for v in values], k


def autoconvolve(a):
    n = len(a)
    c = [0] * (2 * n - 1)
    for i, ai in enumerate(a):
        if ai == 0:
            continue
        for j, aj in enumerate(a):
            c[i + j] += ai * aj
    return c


def c2_ratio(values):
    """Q = ||F||_2^2 / (||F||_1 ||F||_inf) for F = f*f, f a step function on n equal cells.

    On the knot grid t = 0, h, ..., 2n h the autoconvolution takes the values
    ext = [0] + c + [0], c the exact autoconvolution, because F(m h) = c_{m-1}; F is
    linear between knots and zero at both ends, so
      ||F||_2^2 = h/3 sum_m (ext_m^2 + ext_m ext_{m+1} + ext_{m+1}^2),
      ||F||_1   = h sum_m (ext_m + ext_{m+1})/2 = h sum_k c_k,
      ||F||_inf = max ext,
    and h cancels from the ratio.
    """
    a, decimals = scale_to_integers(values)
    n = len(a)
    negatives = sum(1 for v in a if v < 0)
    if negatives:
        return {"domain": False, "negatives": negatives}
    c = autoconvolve(a)
    ext = [0] + c + [0]
    S2 = sum(ext[m] ** 2 + ext[m] * ext[m + 1] + ext[m + 1] ** 2 for m in range(len(ext) - 1))
    S1 = sum(c)
    top = max(ext)
    if S1 <= 0 or top <= 0:
        return {"domain": False, "negatives": 0}
    return {"domain": True, "negatives": 0, "n": n, "decimals": decimals,
            "argmax": ext.index(top) - 1, "Q": Fraction(S2, 1) / (3 * S1 * top)}


def refine(values, factor=2):
    """Subdivide every cell; the same step function, a finer grid."""
    return [v for v in values for _ in range(factor)]


def claim_4(entries, controls):
    values = entries[ENTRY]
    if len(values) != CELLS:
        refuse("entry %s has %d values, not %d" % (ENTRY, len(values), CELLS))
    r = c2_ratio(values)
    out = {"entry": ENTRY, "cells": len(values), "domain": r["domain"], "negatives": r["negatives"]}
    if r["domain"]:
        q = r["Q"]
        out.update({
            "Q30": enclosure(q, 30),
            "Qnum": str(q.numerator),
            "Qden": str(q.denominator),
            "argmax": r["argmax"],
            "decimals": r["decimals"],
            "margin_to_0.9469_30": enclosure(q - CLAIM_THRESHOLD, 30),
            "literal_threshold_0.9469": "CERTIFIED" if q >= CLAIM_THRESHOLD else "REFUTED",
            "threshold_0.9468": "CERTIFIED" if q >= Fraction("0.9468") else "REFUTED",
            "rounds_to_0.9469_at_4dp": bool(abs(q - CLAIM_THRESHOLD) <= Fraction(1, 20000)),
            "truncates_to_0.9469_at_4dp": bool(Fraction(dec(q, 4)) <= q < Fraction(dec(q, 4)) + Fraction(1, 10 ** 4)),
        })
        out["verdict_as_stated"] = out["literal_threshold_0.9469"]
        out["verdict_as_displayed"] = "CERTIFIED" if out["rounds_to_0.9469_at_4dp"] else out["literal_threshold_0.9469"]
    if controls:
        ctl = {}
        neg = list(values)
        neg[0] = "-1e-6"
        ctl["R1_cell0_negative_not_in_domain"] = c2_ratio(neg)["domain"] is False
        ctl["R2_0.9468"] = out.get("threshold_0.9468")
        ctl["R3_0.9469"] = out.get("literal_threshold_0.9469")
        alpha = entries["AlphaEvolve-v1"]
        ctl["R4_refinement_invariance_50_cells"] = c2_ratio(refine(alpha))["Q"] == c2_ratio(alpha)["Q"]
        ctl["R5_refinement_invariance_1024_cells"] = (
            c2_ratio(refine(entries["StrongInit"]))["Q"] == c2_ratio(entries["StrongInit"])["Q"]
        )
        cal = {}
        for name, printed in (("AlphaEvolve-v1", "0.8962"), ("StrongInit", "0.9055"), ("8B-wo_RL@100", "0.9434")):
            rr = c2_ratio(entries[name])
            p = Fraction(printed)
            cal[name] = {
                "cells": len(entries[name]),
                "printed": printed,
                "Q12": enclosure(rr["Q"], 12),
                "printed_is_truncation": Fraction(dec(rr["Q"], 4)) == p,
                "printed_is_rounding": abs(rr["Q"] - p) <= Fraction(1, 20000),
                "printed_above_exact": p > rr["Q"],
            }
        ctl["R6_calibrations"] = cal
        out["controls"] = ctl
    return out


# ---------- claim #6 ----------

def pnt_state(record):
    values = {int(k): Fraction(v) for k, v in record["data"]["partial_function"].items()}
    values = {k: min(max(v, Fraction(-10)), Fraction(10)) for k, v in values.items()}
    keys = sorted(k for k in values if k != 1)
    common = reduce(lambda x, y: x * y // gcd(x, y), (values[k].denominator for k in keys))
    a = {k: int(values[k] * common) for k in keys}
    total = sum(Fraction(a[k], k) for k in keys) / common
    return {"keys": keys, "scale": common, "a": a, "U": total, "f1": -total}


def F_exact(state, n):
    return sum(Fraction(state["a"][k], state["scale"]) * (n // k) for k in state["keys"]) + state["f1"] * n


def state_with(state, a):
    st = {**state, "a": a,
          "U": sum(Fraction(a[k], k) for k in state["keys"]) / state["scale"]}
    st["f1"] = -st["U"]
    return st


def sweep(state, window, upto):
    """Exact scan over [1, upto]; the supremum on [1, window] and the first violation after.

    F(n) = B(n)/scale - n * sum_k f(k)/k; B is accumulated from a divisor difference
    array, comparisons run in 100-digit decimals, and every reported value is then
    recomputed as an exact fraction at its own n.
    """
    scale = state["scale"]
    B = [0] * (upto + 1)
    for k in state["keys"]:
        ak = state["a"][k]
        if ak:
            for m in range(k, upto + 1, k):
                B[m] += ak
    S = Decimal(scale)
    U = Decimal(state["U"].numerator) / Decimal(state["U"].denominator)
    limit = Decimal(TOLERANCE.numerator) / Decimal(TOLERANCE.denominator) * S
    cur = 0
    best = None
    best_n = 0
    in_window_over = 0
    first_over = None
    for n in range(1, upto + 1):
        cur += B[n]
        v = Decimal(cur) - Decimal(n) * S * U
        if n <= window:
            if best is None or v > best:
                best, best_n = v, n
            if v > limit:
                in_window_over += 1
        elif first_over is None and v > limit:
            first_over = n
    return {"sup_at_n": best_n, "window_above": in_window_over, "first_over": first_over}


def screen(state, upto):
    """Float64 screen for the far maximum; the reported values are then exact."""
    diff = [0.0] * (upto + 1)
    for k in state["keys"]:
        vk = float(Fraction(state["a"][k], state["scale"]))
        if vk:
            for m in range(k, upto + 1, k):
                diff[m] += vk
    total = float(state["U"])
    cur = 0.0
    best = None
    best_n = 0
    above = 0
    for n in range(1, upto + 1):
        cur += diff[n]
        v = cur - total * n
        if best is None or v > best:
            best, best_n = v, n
        if v > 1.0001:
            above += 1
    return {"upto": upto, "argmax": best_n, "float_sup": best, "float_above": above}


def claim_6(record, controls, scan_upto):
    st = pnt_state(record)
    window = 10 * max(st["keys"])
    s = sweep(st, window, window + EXTRA_RANGE)
    sup = F_exact(st, s["sup_at_n"])
    score = Decimal(0)
    for k in st["keys"]:
        score += Decimal(st["a"][k]) / Decimal(st["scale"]) * Decimal(k).ln() / Decimal(k)
    score += Decimal(st["f1"].numerator) / Decimal(st["f1"].denominator) * Decimal(1).ln()
    score = -score
    fv = None
    if s["first_over"] is not None:
        f = F_exact(st, s["first_over"])
        fv = {"n": s["first_over"], "F30": enclosure(f, 30), "excess30": enclosure(f - TOLERANCE, 30),
              "steps_past_window": s["first_over"] - window}
    out = {
        "solution": record["id"], "agent": record["agentName"],
        "keys": len(st["keys"]), "max_key": max(st["keys"]),
        "sampled_window": [1, window],
        "f1_30": enclosure(st["f1"], 30),
        "window_sup30": enclosure(sup, 30), "window_sup_at_n": s["sup_at_n"],
        "window_above": s["window_above"],
        "window_headroom30": enclosure(TOLERANCE - sup, 30),
        "window_reading": "HOLDS" if s["window_above"] == 0 else "FAILS",
        "F_at_1_above_1": F_exact(st, 1) > 1,
        "first_violation_after_window": fv,
        "score_exact_30": str(score.quantize(Decimal(10) ** -30)),
        "score_printed": str(PLATFORM_SCORE),
        "score_diff": str(score - PLATFORM_SCORE),
        "score_agrees": abs(score - PLATFORM_SCORE) < SCORE_TOLERANCE,
        "verdict_as_stated": "REFUTED" if (fv is not None or F_exact(st, 1) > 1) else "CERTIFIED",
    }
    if scan_upto:
        sc = screen(st, scan_upto)
        far = F_exact(st, sc["argmax"])
        out["far_screen"] = sc
        out["far_exact"] = {"n": sc["argmax"], "F30": enclosure(far, 30),
                            "excess30": enclosure(far - TOLERANCE, 30)}
    if controls:
        ctl = {}
        ctl["K1_window_holds"] = s["window_above"] == 0
        ctl["K2_strict_reading_refuted_at_1"] = F_exact(st, 1) > 1
        ctl["K3_score_agrees"] = out["score_agrees"]
        ctl["K4_score_plus_2e-6_refuted"] = abs((PLATFORM_SCORE + Decimal("0.000002")) - score) >= SCORE_TOLERANCE
        bump = dict(st["a"])
        bump[2] -= int(Fraction(1, 1000) * st["scale"])
        p = sweep(state_with(st, bump), window, window)
        ctl["K5_f2_minus_1e-3_fails_window"] = p["window_above"] > 0
        scaled = {k: v * 1001 for k, v in st["a"].items()}
        q = sweep(state_with(st, scaled), window, window)
        ctl["K6_f_scaled_by_1001_fails_window"] = q["window_above"] > 0
        out["controls"] = ctl
    return out


def main():
    parser = argparse.ArgumentParser(description="third-party exact recheck of claims #4 and #6")
    parser.add_argument("--repo", default=".", help="cert-machine checkout root")
    parser.add_argument("--ac2", default=None)
    parser.add_argument("--best7", default=None)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--controls", action="store_true")
    parser.add_argument("--scan-upto", type=int, default=0, help="far float screen limit")
    args = parser.parse_args()

    ac2_path = args.ac2 or os.path.join(args.repo, AC2_PATH)
    best7_path = args.best7 or os.path.join(args.repo, BEST7_PATH)
    pinned(ac2_path, AC2_SHA)
    pinned(best7_path, BEST7_SHA)
    statement_path = os.path.join(args.repo, STATEMENT_PATH)
    if os.path.exists(statement_path):
        pinned(statement_path, STATEMENT_SHA)

    ac2 = {e["name"]: e["list"] for e in load_exact(ac2_path)}
    best7 = load_exact(best7_path)
    c4 = claim_4(ac2, args.controls)
    c6 = claim_6(best7, args.controls, args.scan_upto)
    out = {"issue4": c4, "issue6": c6}

    if args.json:
        print(json.dumps(out, indent=1))
        return

    print("claim #4, entry %s (%d cells)" % (ENTRY, CELLS))
    print("  in the inequality's domain (every value >= 0): %s (%d negatives)"
          % (c4["domain"], c4["negatives"]))
    print("  Q in [%s, %s]  (argmax at c index %d, values over 10^%d)"
          % (c4["Q30"][0], c4["Q30"][1], c4["argmax"], c4["decimals"]))
    print("  Q - 0.9469 in [%s, %s]" % tuple(c4["margin_to_0.9469_30"]))
    print("  literal threshold 0.9469: %s   4-decimal display of Q: %s"
          % (c4["literal_threshold_0.9469"], c4["verdict_as_displayed"]))
    print()
    print("claim #6, solution %s (%s): %d keys, max key %d, sampled window [1, %d]"
          % (c6["solution"], c6["agent"], c6["keys"], c6["max_key"], c6["sampled_window"][1]))
    print("  f(1) in [%s, %s]" % tuple(c6["f1_30"]))
    print("  window supremum in [%s, %s] at n = %d; %d integers there above 1 + 1e-4"
          % (c6["window_sup30"][0], c6["window_sup30"][1], c6["window_sup_at_n"], c6["window_above"]))
    print("  headroom below 1 + 1e-4 in [%s, %s]" % tuple(c6["window_headroom30"]))
    if c6["first_violation_after_window"]:
        fv = c6["first_violation_after_window"]
        print("  first violation after the window: n = %d (%d past its end), F in [%s, %s], excess in [%s, %s]"
              % (fv["n"], fv["steps_past_window"], fv["F30"][0], fv["F30"][1],
                 fv["excess30"][0], fv["excess30"][1]))
    if "far_exact" in c6:
        fe = c6["far_exact"]
        print("  far maximum found by a float screen to %d: n = %d, F in [%s, %s]"
              % (c6["far_screen"]["upto"], fe["n"], fe["F30"][0], fe["F30"][1]))
    print("  exact S = %s; printed %s; difference %s (agrees within the platform's 1e-6: %s)"
          % (c6["score_exact_30"], c6["score_printed"], c6["score_diff"], c6["score_agrees"]))
    print()
    print("verdict #4 as stated: %s;  #6 as stated: %s"
          % (c4["verdict_as_stated"], c6["verdict_as_stated"]))
    if args.controls:
        print()
        print("controls #4: " + json.dumps(c4["controls"], sort_keys=True))
        print("controls #6: " + json.dumps(c6["controls"], sort_keys=True))


if __name__ == "__main__":
    main()
