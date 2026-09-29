#!/usr/bin/env python3
"""Independent adversarial checker for problem-3a digit-construction certificates.

Written 2026-06-10 as an independent adversarial audit of a problem-3a
digit-construction certificate; generalized to verify any certificate of this family.

DELIBERATELY independent of targets/gh3a/verifier_3a.py: nothing is imported
from it and every quantity is recomputed from first principles with different
code (and, where cheap, different algorithms):

  * max(U)   — budgeted DP over digit positions (no greedy argument needed);
  * |U+U|    — digit-vector DP over (total digit sum, achievable-split bitset);
  * |U-U|    — TWO implementations: a plain (sum_b, sum_a) dict DP and a
               Kronecker-packed big-integer polynomial DP; they must agree;
  * value    — exact-rational enclosure of 1 + ln(D/S)/ln(2m+1) via one-sided
               atanh series bounds over Fraction (zero floats on the certifying
               path), printed by integer-only decimal truncation;
  * bonus    — a log-free EXACT INTEGER inequality check  D^q > S^q (2m+1)^p
               proving value > 1 + p/q for a user-chosen rational.

Mathematical facts the counters rely on (re-derived, see PROOFS below):

  U = { sum_i a_i B^i : a_i in A, 0 <= i < d, sum_i a_i <= T },
  with 0 in A, A a set of distinct non-negative integers, B >= 2*max(A)+1.

  (P1) Sums: for u,v in U the digit sums a_i+b_i lie in [0, 2max(A)] subset
       [0, B-1], so u+v has base-B digits y_i = a_i+b_i with no carries, and
       u+v determines (y_i) uniquely (ordinary base-B uniqueness).  Hence
       |U+U| = #{ feasible y-vectors }, where y is feasible iff y_i in A+A for
       all i and there is a choice a_i in P[y_i] = {a in A : y_i - a in A}
       with sum a_i <= T and sum (y_i - a_i) <= T.
  (P2) Differences: for u,v in U, u-v = sum_i (a_i-b_i) B^i with deltas in
       A-A subset [-(B-1)/2, (B-1)/2].  If two delta-vectors gave the same
       integer, subtracting and reducing mod B forces equality digit by digit
       (|delta_i - delta'_i| <= 2max(A) <= B-1 < B).  Hence
       |U-U| = #{ feasible delta-vectors }, where delta is feasible iff there
       are b_i in Q[delta_i] = {b in A : b+delta_i in A} with sum b_i <= T and
       sum (b_i + delta_i) <= T.  Both constraints are monotone increasing in
       every b_i, so feasibility holds iff it holds for the coordinate-wise
       minimal choice q(delta_i) = min Q[delta_i]:
         feasible(delta)  <=>  sum q(delta_i) <= T  and
                               sum (q(delta_i)+delta_i) <= T.
  (P3) The GHR digit lemma (problem page, teorth/optimizationproblems
       constants/3a.md): any finite set U of non-negative integers with
       0 in U gives  C_3a >= 1 + log(|U-U|/|U+U|) / log(2 max(U) + 1).
       Admissibility of a capped digit construction therefore only needs:
       U finite (yes: |U| <= |A|^d), U subset Z>=0 (yes: digits >= 0),
       0 in U (yes: the all-zero word has digit sum 0 <= T, needs T >= 0).
       The base condition B >= 2max(A)+1 is NOT needed for admissibility —
       it is needed for the exactness of the counting (P1)/(P2).

Self-tests ("selftest" mode) check every counter against a brute-force
enumeration of U on small instances, including gapped digit sets and the
audited digit set itself at small d.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from fractions import Fraction

RECORD_LB = Fraction(11740744, 10**7)   # published record 1.1740744 (G2026)
DIGIT_LEMMA_CAP = Fraction(5, 4)        # GHR2007: this family cannot exceed 1.25
PROVEN_UB = Fraction(4, 3)              # GHR2007 theorem


# ---------------------------------------------------------------------------
# Admissibility (re-derived from the problem page, not from SPEC_3a.md)
# ---------------------------------------------------------------------------

def validate(raw: dict) -> tuple[tuple[int, ...], int, int, int | None]:
    digits = sorted(set(raw["digit_set"]))
    if any((not isinstance(x, int)) or isinstance(x, bool) for x in raw["digit_set"]):
        raise ValueError("digit_set entries must be ints")
    if digits[0] < 0:
        raise ValueError("digits must be non-negative (lemma needs U subset Z>=0)")
    if 0 not in digits:
        raise ValueError("0 must be in digit_set (lemma needs 0 in U)")
    if len(digits) < 2:
        raise ValueError("need at least two digits")
    B = int(raw["base"])
    if B < 2 * digits[-1] + 1:
        raise ValueError(
            f"base {B} < 2*max(A)+1 = {2*digits[-1]+1}: no-carry counting (P1)/(P2) invalid"
        )
    d = int(raw["digit_count"])
    if d < 1:
        raise ValueError("digit_count must be >= 1")
    T = raw.get("sum_cap")
    if T is not None:
        T = int(T)
        if T < 0:
            raise ValueError("sum_cap must be >= 0 (0 in U needs the zero word feasible)")
        if T >= d * digits[-1]:
            T = None                     # cap not binding
    return tuple(digits), B, d, T


# ---------------------------------------------------------------------------
# Exact counters (pure integer arithmetic)
# ---------------------------------------------------------------------------

def max_u(A: tuple[int, ...], B: int, d: int, T: int | None) -> int:
    """max(U) by DP over digit positions: state = digit-sum used -> max value.

    No greedy/lexicographic argument is assumed (the digit set has gaps)."""
    if T is None:
        return A[-1] * (B**d - 1) // (B - 1)
    best = {0: 0}
    for i in range(d):
        w = B**i
        nxt: dict[int, int] = {}
        for s, v in best.items():
            for a in A:
                ns = s + a
                if ns <= T:
                    cand = v + a * w
                    if cand > nxt.get(ns, -1):
                        nxt[ns] = cand
        best = nxt
    return max(best.values())


def sum_count(A: tuple[int, ...], B: int, d: int, T: int | None,
              progress: bool = False) -> int:
    """|U+U| by (P1): count feasible digit-sum vectors y.

    DP state after processing k positions: (Y = sum of y_i so far,
    bitset of achievable values of sum a_i, truncated to [0, T]).  Truncation
    is sound: sum a_i is non-decreasing, so a partial sum > T can never end
    <= T.  A final state is feasible iff some achievable s satisfies
    s >= Y - T (then the partner sum Y - s <= T as well).  States with
    Y > 2T are pruned (s <= T and Y - s <= T force Y <= 2T)."""
    if T is None:
        return len({a + b for a in A for b in A}) ** d
    Aset = set(A)
    Y = sorted({a + b for a in A for b in A})
    assert Y[-1] <= B - 1, "no-carry violated"
    P = {y: tuple(a for a in A if y - a in Aset) for y in Y}
    mask = (1 << (T + 1)) - 1
    shift_cache: dict[tuple[int, int], int] = {}

    states: dict[tuple[int, int], int] = {(0, 1): 1}
    for step in range(d):
        nxt: dict[tuple[int, int], int] = {}
        for (ytot, bm), cnt in states.items():
            for y in Y:
                ny = ytot + y
                if ny > 2 * T:
                    break               # Y sorted ascending
                key = (bm, y)
                nbm = shift_cache.get(key)
                if nbm is None:
                    nbm = 0
                    for p in P[y]:
                        nbm |= bm << p
                    nbm &= mask
                    shift_cache[key] = nbm
                if nbm:
                    k2 = (ny, nbm)
                    nxt[k2] = nxt.get(k2, 0) + cnt
        states = nxt
        if progress:
            print(f"  sum_count step {step+1}/{d}: {len(states)} states", flush=True)

    total = 0
    for (ytot, bm), cnt in states.items():
        if bm >> max(0, ytot - T):
            total += cnt
    return total


def _delta_pairs(A: tuple[int, ...]) -> list[tuple[int, int]]:
    """Per (P2): for each delta in A-A the minimal pair (b, a) = (q, q+delta)."""
    Aset = set(A)
    out = []
    for delta in sorted({a - b for a in A for b in A}):
        q = min(b for b in A if b + delta in Aset)
        out.append((q, q + delta))
    return out


def diff_count_dict(A: tuple[int, ...], B: int, d: int, T: int | None,
                    progress: bool = False) -> int:
    """|U-U| by (P2), plain dict DP over (sum of q, sum of q+delta)."""
    if T is None:
        return len({a - b for a in A for b in A}) ** d
    pairs = _delta_pairs(A)
    states: dict[tuple[int, int], int] = {(0, 0): 1}
    for step in range(d):
        nxt: dict[tuple[int, int], int] = {}
        for (x, y), cnt in states.items():
            for p, q in pairs:
                nx, ny = x + p, y + q
                if nx <= T and ny <= T:
                    k = (nx, ny)
                    nxt[k] = nxt.get(k, 0) + cnt
        states = nxt
        if progress:
            print(f"  diff_count step {step+1}/{d}: {len(states)} states", flush=True)
    return sum(states.values())


def diff_count_packed(A: tuple[int, ...], B: int, d: int, T: int | None) -> int:
    """|U-U| by (P2) again, but as polynomial exponentiation with Kronecker
    packing: the state polynomial sum c_{x,y} u^x v^y is packed into one big
    integer with a W-bit slot per (x,y) cell; multiplying by
    f(u,v) = sum_{(p,q)} u^p v^q is integer shift-and-add; after each of the
    d multiplications, slots with x > T or y > T are masked away.

    Slot-overflow safety: every coefficient counts a subset of delta-vectors,
    so it is <= |A-A|^d; W is chosen with |A-A|^d * |A-A| < 2^W, and the grid
    is padded by max exponent of f in each axis so a single multiplication
    never wraps a row before masking."""
    if T is None:
        return len({a - b for a in A for b in A}) ** d
    pairs = _delta_pairs(A)
    pmax = max(p for p, _ in pairs)
    qmax = max(q for _, q in pairs)
    nP = len(pairs)
    Wmin = (nP**(d + 1)).bit_length() + 2
    W = ((Wmin + 63) // 64) * 64
    cols = T + qmax + 1                 # v-axis stride
    rows = T + pmax + 1

    def slot(x: int, y: int) -> int:
        return (x * cols + y) * W

    keep_mask = 0
    cell = (1 << W) - 1
    for x in range(T + 1):
        row = 0
        for y in range(T + 1):
            row |= cell << slot(0, y)
        keep_mask |= row << (x * cols * W)

    state = 1 << slot(0, 0)
    for _ in range(d):
        acc = 0
        for p, q in pairs:
            acc += state << slot(p, q)
        state = acc & keep_mask
    # unpack and total
    total = 0
    while state:
        total += state & cell
        state >>= W
    return total


def brute_force(A: tuple[int, ...], B: int, d: int, T: int | None) -> tuple[int, int, int]:
    """Oracle: enumerate U literally; return (max, |U+U|, |U-U|)."""
    cap = T if T is not None else d * A[-1]
    words = [(0, 0)]
    for i in range(d):
        w = B**i
        words = [(v + a * w, s + a) for (v, s) in words for a in A if s + a <= cap]
    U = sorted({v for v, _ in words})
    sums = {u + v for u in U for v in U}
    diffs = {u - v for u in U for v in U}
    return max(U), len(sums), len(diffs)


# ---------------------------------------------------------------------------
# Exact rational log enclosure (one-sided atanh bounds; zero floats)
# ---------------------------------------------------------------------------

def _atanh_bounds(z: Fraction, M: int) -> tuple[Fraction, Fraction]:
    """[lo, hi] for atanh(z), 0 <= z < 1: partial sum is a lower bound (all
    terms positive); tail <= z^(2M+1) / ((2M+1)(1-z^2)) geometric bound."""
    assert 0 <= z < 1
    s = Fraction(0)
    zp = z
    z2 = z * z
    for j in range(M):
        s += zp / (2 * j + 1)
        zp *= z2
    tail = zp / ((2 * M + 1) * (1 - z2))   # zp == z^(2M+1) now
    return s, s + tail


def ln_interval(x: Fraction, M: int = 170) -> tuple[Fraction, Fraction]:
    """Rigorous [lo, hi] of ln(x) for rational x > 0.

    Reduce x = 2^k * r with r in [1, 2); ln r = 2 atanh((r-1)/(r+1)) with
    z in [0, 1/3]; ln 2 = 2 atanh(1/3).  M=170 gives tail < 3^-341 ~ 1e-162,
    so even after multiplying by |k| <= ~500 the enclosure width stays far
    below 1e-150."""
    x = Fraction(x)
    if x <= 0:
        raise ValueError("x must be > 0")
    if x < 1:
        lo, hi = ln_interval(1 / x, M)
        return -hi, -lo
    n, q = x.numerator, x.denominator
    k = n.bit_length() - q.bit_length()
    if k > 0 and (n << 0) < (q << k):
        k -= 1
    # ensure 1 <= x / 2^k < 2
    while x / (Fraction(2) ** k) >= 2:
        k += 1
    while x / (Fraction(2) ** k) < 1:
        k -= 1
    r = x / (Fraction(2) ** k)
    l2lo, l2hi = _atanh_bounds(Fraction(1, 3), M)
    l2lo, l2hi = 2 * l2lo, 2 * l2hi
    zrlo, zrhi = _atanh_bounds((r - 1) / (r + 1), M)
    rlo, rhi = 2 * zrlo, 2 * zrhi
    assert k >= 0
    return k * l2lo + rlo, k * l2hi + rhi


def dec_floor(x: Fraction, digits: int) -> str:
    """Decimal truncation toward -inf, integer arithmetic only."""
    scaled = x * 10**digits
    n = scaled.numerator // scaled.denominator
    sign = "-" if n < 0 else ""
    s = str(abs(n)).rjust(digits + 1, "0")
    return f"{sign}{s[:-digits]}.{s[-digits:]}"


def value_interval(m: int, S: int, D: int, M: int = 170) -> tuple[Fraction, Fraction]:
    """Rigorous [lo, hi] of 1 + ln(D/S)/ln(2m+1)."""
    rlo, rhi = ln_interval(Fraction(D, S), M)
    nlo, nhi = ln_interval(Fraction(2 * m + 1), M)
    if nlo <= 0:
        raise ValueError("denominator enclosure not positive")
    lo = 1 + (rlo / nhi if rlo >= 0 else rlo / nlo)
    hi = 1 + (rhi / nlo if rhi >= 0 else rhi / nhi)
    return lo, hi


def power_check(m: int, S: int, D: int, p: int, q: int) -> bool:
    """Log-free exact integer proof of value > 1 + p/q:
    1 + ln(D/S)/ln(2m+1) > 1 + p/q  <=>  D^q > S^q * (2m+1)^p
    (valid since ln(2m+1) > 0 and all quantities positive integers)."""
    return D**q > S**q * (2 * m + 1) ** p


# ---------------------------------------------------------------------------
# Modes
# ---------------------------------------------------------------------------

def run_verify(args: argparse.Namespace) -> int:
    cons_raw = json.loads(args.construction)
    A, B, d, T = validate(cons_raw)
    print(f"construction admissible: A={list(A)} B={B} d={d} T={T}", flush=True)

    t0 = time.time()
    m = max_u(A, B, d, T)
    print(f"max_u   = {m}  ({time.time()-t0:.1f}s)", flush=True)

    t0 = time.time()
    D1 = diff_count_packed(A, B, d, T)
    print(f"diff(packed) = {D1}  ({time.time()-t0:.1f}s)", flush=True)
    t0 = time.time()
    D2 = diff_count_dict(A, B, d, T, progress=args.progress)
    print(f"diff(dict)   = {D2}  ({time.time()-t0:.1f}s)", flush=True)
    if D1 != D2:
        print("FATAL: the two independent |U-U| implementations disagree", flush=True)
        return 2
    D = D1

    t0 = time.time()
    S = sum_count(A, B, d, T, progress=args.progress)
    print(f"sum_count    = {S}  ({time.time()-t0:.1f}s)", flush=True)

    lo, hi = value_interval(m, S, D)
    out = {
        "checker": "independent_check_3a (independent audit, from scratch, no producer-code imports)",
        "construction": {"digit_set": list(A), "base": B, "digit_count": d,
                         "sum_cap": cons_raw.get("sum_cap")},
        "max_u": str(m),
        "sum_count": str(S),
        "diff_count": str(D),
        "value_lo_100": dec_floor(lo, 100),
        "value_hi_100_plus_ulp": dec_floor(hi + Fraction(1, 10**100), 100),
        "value_lo_40": dec_floor(lo, 40),
        "value_hi_40_plus_ulp": dec_floor(hi + Fraction(1, 10**40), 40),
        "enclosure_width_lt_1e120": bool(hi - lo < Fraction(1, 10**120)),
        "beats_record_exact": bool(lo > RECORD_LB),
        "under_digit_lemma_cap": bool(hi < DIGIT_LEMMA_CAP),
        "under_proven_ub": bool(hi < PROVEN_UB),
    }
    if args.power_check:
        p, q = (int(t) for t in args.power_check.split("/"))
        ok = power_check(m, S, D, p, q)
        out["power_check"] = {
            "claim": f"value > 1 + {p}/{q}",
            "integer_inequality": f"D^{q} > S^{q} * (2m+1)^{p}",
            "holds": bool(ok),
            "exceeds_record": bool(Fraction(p, q) > RECORD_LB - 1),
        }
    if args.claimed:
        cl = json.loads(open(args.claimed).read())
        out["claim_comparison"] = {
            "max_u_match": str(m) == cl["max_u"],
            "sum_count_match": str(S) == cl["sum_count"],
            "diff_count_match": str(D) == cl["diff_count"],
            "their_value_lo_str": cl["value_lo_str"],
            "their_value_hi_str": cl["value_hi_str"],
            "my_lo_40_equals_their_lo": dec_floor(lo, 40) == cl["value_lo_str"],
            "my_interval_inside_theirs": (
                Fraction(cl["value_lo_str"]) <= lo and hi <= Fraction(cl["value_hi_str"])
            ),
        }
    print(json.dumps(out, indent=2), flush=True)
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(out, fh, indent=2)
    return 0


def run_selftest(args: argparse.Namespace) -> int:
    import random
    print("=== independent checker self-test ===", flush=True)

    # (1) hand example: A={0,1}, B=3, d=2, uncapped: U={0,1,3,4},
    # |U+U|=9, |U-U|=9, max=4 -> value exactly 1.
    A, B, d, T = validate({"digit_set": [0, 1], "base": 3, "digit_count": 2})
    assert (max_u(A, B, d, T), sum_count(A, B, d, T), diff_count_dict(A, B, d, T)) == (4, 9, 9)
    lo, hi = value_interval(4, 9, 9)
    assert lo <= 1 <= hi and hi - lo < Fraction(1, 10**120)
    print("  (1) hand example OK", flush=True)

    # (2) random instances vs brute force (incl. gapped digit sets).
    rng = random.Random(20260610)
    n = 0
    for _ in range(60):
        size = rng.randint(2, 5)
        digits = tuple(sorted({0} | {rng.randint(1, 9) for _ in range(size - 1)}))
        base = 2 * digits[-1] + 1 + rng.randint(0, 4)
        d = rng.randint(1, 4)
        cap = rng.choice([None, rng.randint(0, d * digits[-1] + 2)])
        try:
            A, B, d, T = validate({"digit_set": list(digits), "base": base,
                                   "digit_count": d, "sum_cap": cap})
        except ValueError:
            continue
        bm, bs, bd = brute_force(A, B, d, T)
        assert max_u(A, B, d, T) == bm, (A, B, d, T)
        assert sum_count(A, B, d, T) == bs, (A, B, d, T)
        assert diff_count_dict(A, B, d, T) == bd, (A, B, d, T)
        assert diff_count_packed(A, B, d, T) == bd, (A, B, d, T)
        n += 1
    print(f"  (2) DP == brute force on {n} random instances OK", flush=True)

    # (3) the audited digit set itself at small d vs brute force.
    AUD = [0, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
    for d_small, cap in [(1, 10), (2, 20), (2, None), (3, 12), (3, 25)]:
        A, B, dd, T = validate({"digit_set": AUD, "base": 33,
                                "digit_count": d_small, "sum_cap": cap})
        bm, bs, bd = brute_force(A, B, dd, T)
        assert max_u(A, B, dd, T) == bm
        assert sum_count(A, B, dd, T) == bs
        assert diff_count_dict(A, B, dd, T) == bd
        assert diff_count_packed(A, B, dd, T) == bd
    print("  (3) audited digit set at small d vs brute force OK", flush=True)

    # (4) ln enclosure: ln(2) to 50 digits (known constant), width checks.
    LN2_50 = Fraction(
        69314718055994530941723212145817656807550013436026, 10**50)
    lo, hi = ln_interval(Fraction(2))
    assert lo <= LN2_50 + Fraction(1, 10**49) and hi >= LN2_50 - Fraction(1, 10**49)
    assert abs(lo - LN2_50) < Fraction(1, 10**49) and hi - lo < Fraction(1, 10**150)
    for x in (Fraction(3, 2), Fraction(1, 7), Fraction(10**40 + 9), Fraction(7, 10**25)):
        lo, hi = ln_interval(x)
        assert lo < hi and hi - lo < Fraction(1, 10**140)
        assert ln_interval(1 / x)[0] == -hi
    print("  (4) ln enclosure vs known ln(2), widths < 1e-140 OK", flush=True)

    # (5) oracle: random valid constructions never certify >= 1.25.
    rng = random.Random(424242)
    n = 0
    for _ in range(150):
        size = rng.randint(2, 6)
        digits = tuple(sorted({0} | {rng.randint(1, 12) for _ in range(size - 1)}))
        base = 2 * digits[-1] + 1
        d = rng.randint(1, 6)
        cap = rng.choice([None, rng.randint(0, d * digits[-1])])
        try:
            A, B, dd, T = validate({"digit_set": list(digits), "base": base,
                                    "digit_count": d, "sum_cap": cap})
        except ValueError:
            continue
        m = max_u(A, B, dd, T)
        S = sum_count(A, B, dd, T)
        D = diff_count_dict(A, B, dd, T)
        if m == 0:
            continue
        lo, hi = value_interval(m, S, D, M=60)
        assert hi < DIGIT_LEMMA_CAP, (A, B, dd, T)
        n += 1
    print(f"  (5) digit-lemma cap oracle OK on {n} constructions", flush=True)

    # (6) power_check consistency with the interval on a small instance.
    A, B, dd, T = validate({"digit_set": [0, 2, 3], "base": 7, "digit_count": 3,
                            "sum_cap": 6})
    m, S, D = max_u(A, B, dd, T), sum_count(A, B, dd, T), diff_count_dict(A, B, dd, T)
    lo, hi = value_interval(m, S, D)
    for p, q in [(1, 20), (1, 10), (1, 5), (1, 3)]:
        assert power_check(m, S, D, p, q) == (lo > 1 + Fraction(p, q)) or \
               (1 + Fraction(p, q) >= lo and 1 + Fraction(p, q) <= hi)
        n += 1
    print("  (6) power_check consistent with interval OK", flush=True)
    print("=== all self-tests passed ===", flush=True)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="mode", required=True)
    v = sub.add_parser("verify")
    v.add_argument("construction", help="construction JSON")
    v.add_argument("--claimed", help="path to claimed certificate JSON to compare")
    v.add_argument("--power-check", help="rational p/q: prove value > 1+p/q by integers")
    v.add_argument("--out", help="write result JSON here")
    v.add_argument("--progress", action="store_true")
    sub.add_parser("selftest")
    args = ap.parse_args()
    if args.mode == "selftest":
        return run_selftest(args)
    return run_verify(args)


if __name__ == "__main__":
    raise SystemExit(main())
