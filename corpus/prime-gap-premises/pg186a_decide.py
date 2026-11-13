#!/usr/bin/env python3
"""Decider A — the two finite-field axioms of openai/PrimeGaps186 (Challenge.lean, lines 24-56), on instances.

Written from the Lean text and Mathlib's lemma statements only (PREREG-PG186.md, "The Lean text decided").

  normalizedKloosterman3 p c  = (1/p) * sum over u, v, w in ZMod p with u*v*w = c of psi(u + v + w)
  unnormalizedKloosterman2 p c = sum over units u of psi(u + c/u)
  psi(j) = exp(2*pi*i*j.val/p)                      (ZMod.stdAddChar_apply, ZMod.toCircle_apply)
  axiom 1: for c != 0,       |normalizedKloosterman3 p c| <= 3
  axiom 2: for A, B != 0,    |sum over t != 0, -1 of K2(A/t) * K2(B/(t+1))| <= 8 * p * sqrt(p)

METHOD (a priori error bounds; decider B uses intervals instead).
  Every sum is first reduced to an EXACT integer vector of exponent counts n_k: the sum equals sum_k n_k * zeta^k with
  zeta = exp(2*pi*i/p). The reals cos(2*pi*k/p), sin(2*pi*k/p) enter only as integers C_k, S_k with
      |C_k - 2^F cos(2*pi*k/p)| <= 1   and   |S_k - 2^F sin(2*pi*k/p)| <= 1,                       (*)
  proved in `trig_tables` and asserted there with exact rationals. Everything after (*) is integer arithmetic, and each
  decision carries an error bound derived from (*) alone:
    axiom 1:  Re~ = sum n_k C_k, Im~ = sum n_k S_k, each within E1 = sum n_k = (p-1)^2 of 2^F times the true part.
    axiom 2:  k~_c = sum m_k C_k within e = p-1 of 2^F * K2(c) (K2(c) is real: the count vector is checked symmetric);
              C~ = sum_t k~ k~' within E2 = (p-2) * (2*e*Kmax + e^2) of 2^(2F) * (the true sum), Kmax = max |k~|.
  An instance "holds" only if the bound holds at the far end of its error interval, "fails" only if it fails at the
  near end; otherwise the precision is raised (F = 18 in int64 with a proved no-overflow bound, then F = 96 in Python
  integers); what is still open is counted "undecided". No floating point takes part in any decision.
"""
import argparse
import hashlib
import json
import re
import sys
import time
from fractions import Fraction
from math import factorial, isqrt

import numpy as np

G = 128            # working bits of the trig argument
TAYLOR_N = 40      # Taylor order (terms n = 0..N)
ERR_BITS = 120     # the proved accuracy of each trig value before scaling: 2^-ERR_BITS


def primes_below(n):
    return [p for p in range(2, n) if all(p % d for d in range(2, isqrt(p) + 1))]


# ---------------------------------------------------------------------------------------------------------------
# pi and the trig tables
# ---------------------------------------------------------------------------------------------------------------
def _arctan_inv(x, terms):
    """[lo, hi] enclosing arctan(1/x), x >= 2 an integer: the alternating series with decreasing terms, so consecutive
    partial sums bracket the value."""
    s = Fraction(0)
    for n in range(terms + 1):
        s += Fraction((-1) ** n, (2 * n + 1) * x ** (2 * n + 1))
    nxt = Fraction(1, (2 * terms + 3) * x ** (2 * terms + 3))
    return (s - nxt, s) if terms % 2 == 0 else (s, s + nxt)


def pi_enclosure():
    """Machin: pi = 16 arctan(1/5) - 4 arctan(1/239). Width below 2^-140."""
    a_lo, a_hi = _arctan_inv(5, 64)
    b_lo, b_hi = _arctan_inv(239, 20)
    lo, hi = 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo
    assert lo < hi and hi - lo < Fraction(1, 2 ** 140)
    assert Fraction(314159265358979, 10 ** 14) < lo and hi < Fraction(314159265358980, 10 ** 14)
    return lo, hi


PI_LO, PI_HI = pi_enclosure()
_FACT = [factorial(i) for i in range(2 * TAYLOR_N + 4)]


def _taylor_exact(X, sine):
    """The Taylor polynomial of cos (or sin) of order TAYLOR_N at x_m = X / 2^G, as an exact rational num/den
    (integers only, no gcd): sum_n (-1)^n x_m^(2n+s) / (2n+s)!, s = 0 for cos, 1 for sin."""
    s = 1 if sine else 0
    top = 2 * TAYLOR_N + s
    den = (1 << (top * G)) * _FACT[top]
    num = 0
    for n in range(TAYLOR_N + 1):
        d = 2 * n + s
        num += (-1) ** n * X ** d * (1 << ((top - d) * G)) * (_FACT[top] // _FACT[d])
    return num, den


def trig_tables(p, scales):
    """For each F in `scales`: lists C, S of integers satisfying (*) for k = 0..p-1.

    Proof of (*). x = 2*pi*k/p lies in [x_lo, x_hi] = [2k*PI_LO/p, 2k*PI_HI/p], of width <= 2*(PI_HI - PI_LO) < 2^-139.
    x_m = floor(x_lo * 2^G) / 2^G, so |x - x_m| < 2^-139 + 2^-G. cos and sin are 1-Lipschitz. The Taylor polynomial at
    x_m, 0 <= x_m < 7, has alternating terms that decrease from n = 3 on ((2n+1)(2n+2) > 49), so its error is at most
    the first omitted term, < 7^(2N+2)/(2N+2)!. The three errors are summed as exact rationals and asserted
    <= 2^-ERR_BITS. Rounding 2^F * (the polynomial's exact value) to the nearest integer adds 1/2; with
    F <= ERR_BITS - 1 the total is <= 1/2 + 2^F * 2^-ERR_BITS <= 1.
    """
    taylor_err = max(Fraction(7 ** (2 * TAYLOR_N + 2), _FACT[2 * TAYLOR_N + 2]),
                     Fraction(7 ** (2 * TAYLOR_N + 3), _FACT[2 * TAYLOR_N + 3]))
    err = taylor_err + 2 * (PI_HI - PI_LO) + Fraction(1, 2 ** G)
    assert err <= Fraction(1, 2 ** ERR_BITS)
    assert all(F <= ERR_BITS - 1 for F in scales)
    out = {F: ([], []) for F in scales}
    for k in range(p):
        x_lo = 2 * k * PI_LO / p
        X = (x_lo.numerator << G) // x_lo.denominator          # floor(x_lo * 2^G)
        assert 0 <= X < 7 << G
        for sine in (False, True):
            num, den = _taylor_exact(X, sine)
            for F in scales:
                v = ((num << (F + 1)) + den) // (2 * den)      # nearest integer to 2^F * num/den (floor of x + 1/2)
                out[F][1 if sine else 0].append(v)
    return out


# ---------------------------------------------------------------------------------------------------------------
# exact helpers
# ---------------------------------------------------------------------------------------------------------------
def inverses(p):
    inv = [0] * p                                              # 0^-1 = 0 in ZMod p (Lean's convention)
    for a in range(1, p):
        inv[a] = pow(a, p - 2, p) if p > 2 else 1
    assert all((a * inv[a]) % p == 1 for a in range(1, p))
    return inv


def is_integer_in_cyclotomic(vec, m):
    """sum_k vec[k] zeta^k == m, for prime p: the only rational relation among 1, zeta, ..., zeta^(p-1) is that they
    sum to zero, so the sum is the integer vec[0] - vec[1] exactly when vec[1] = ... = vec[p-1]."""
    p = len(vec)
    if p == 2:
        return int(vec[0]) - int(vec[1]) == m                  # zeta = -1
    return all(int(vec[k]) == int(vec[1]) for k in range(2, p)) and int(vec[0]) - int(vec[1]) == m


def floor_div(a, b):
    return a // b


def ceil_div(a, b):
    return -((-a) // b)


# ---------------------------------------------------------------------------------------------------------------
# axiom 1
# ---------------------------------------------------------------------------------------------------------------
def axiom1(p, trig):
    F = 64
    C, S = trig[F]
    inv = np.array(inverses(p), dtype=np.int64)
    rng = np.arange(1, p, dtype=np.int64)
    U, V = np.meshgrid(rng, rng, indexing="ij")
    base = (U + V) % p
    inv_uv = inv[(U * V) % p]                                  # (u v)^-1; u, v nonzero (u*v*w = c != 0 forces it)
    E1 = (p - 1) ** 2
    T = 9 * p * p << (2 * F)                                   # |S3|^2 <= 9 p^2, scaled by 2^(2F)
    den = p * p << (2 * F)
    holds = fails = undecided = 0
    max_lo = max_hi = -1
    argmax = fail_witness = None
    R = np.zeros(p, dtype=np.int64)                            # the anchor: sum_c |S3(c)|^2 as a count vector
    for c in range(1, p):
        k = (base + c * inv_uv) % p                            # u + v + w with w = c (u v)^-1
        n = np.bincount(k.ravel(), minlength=p)
        assert int(n.sum()) == E1
        R += np.correlate(np.concatenate([n, n[:-1]]), n, "valid")   # exact: entries <= (p-1)^4 < 2^63
        nl = [int(x) for x in n]
        re = abs(sum(a * b for a, b in zip(nl, C)))
        im = abs(sum(a * b for a, b in zip(nl, S)))
        up = (re + E1) ** 2 + (im + E1) ** 2
        lo = max(0, re - E1) ** 2 + max(0, im - E1) ** 2
        if up <= T:
            holds += 1
        elif lo > T:
            fails += 1
            fail_witness = fail_witness or [c]
        else:
            undecided += 1
        if up > max_hi:
            max_hi, argmax = up, [c]
        max_lo = max(max_lo, lo)
    anchor = is_integer_in_cyclotomic(R, p ** 3 - p ** 2 - p - 1)
    return {"axiom": 1, "p": p, "instances": p - 1, "holds": holds, "fails": fails, "undecided": undecided,
            "max_lo": str(floor_div(10 ** 12 * max_lo, den)), "max_hi": str(ceil_div(10 ** 12 * max_hi, den)),
            "argmax": argmax, "fail_witness": fail_witness, "anchor": bool(anchor)}


# ---------------------------------------------------------------------------------------------------------------
# axiom 2
# ---------------------------------------------------------------------------------------------------------------
def axiom2(p, trig):
    inv_l = inverses(p)
    inv = np.array(inv_l, dtype=np.int64)
    units = np.arange(1, p, dtype=np.int64)
    # m[c][k] = #{u unit : u + c/u = k}, for every c in ZMod p
    cs = np.arange(p, dtype=np.int64)
    kk = (units[None, :] + cs[:, None] * inv[units][None, :]) % p
    m = np.zeros((p, p), dtype=np.int64)
    np.add.at(m, (np.repeat(cs, p - 1), kk.ravel()), 1)
    assert (m.sum(axis=1) == p - 1).all()
    neg = (-np.arange(p)) % p
    symmetric = bool((m[1:] == m[1:][:, neg]).all())           # K2(c) real for every c != 0
    total = m[1:].sum(axis=0)
    anchor = symmetric and is_integer_in_cyclotomic(total, 1)  # sum_{c != 0} K2(c) = 1
    e = p - 1

    def ktilde(F):
        C = trig[F][0]
        return [sum(int(a) * b for a, b in zip(row, C)) for row in m]

    k96 = ktilde(96)
    # k2max: max over c != 0 of K2(c)^2 / p
    den_k = p << (2 * 96)
    k2_lo = max(max(0, abs(v) - e) ** 2 for v in k96[1:])
    k2_hi = max((abs(v) + e) ** 2 for v in k96[1:])

    ts = [t for t in range(1, p - 1)]                          # t != 0 and t != -1
    instances = (p - 1) ** 2
    if not ts:                                                 # p = 2: the sum is empty, hence 0
        return {"axiom": 2, "p": p, "instances": instances, "holds": instances, "fails": 0, "undecided": 0,
                "max_lo": "0", "max_hi": "0", "argmax": [1, 1], "fail_witness": None, "anchor": bool(anchor),
                "k2max_lo": str(floor_div(10 ** 12 * k2_lo, den_k)), "k2max_hi": str(ceil_div(10 ** 12 * k2_hi, den_k)),
                "tier2": 0}

    # tier 1: F = 18, int64, with the no-overflow bound asserted in Python integers
    F1 = 18
    k18 = ktilde(F1)
    kmax = max(abs(v) for v in k18)
    assert (p - 2) * kmax * kmax < 2 ** 63
    k18a = np.array(k18, dtype=np.int64)
    A = np.arange(1, p, dtype=np.int64)
    tarr = np.array(ts, dtype=np.int64)
    X = k18a[(A[:, None] * inv[tarr][None, :]) % p]            # K2(A / t)
    Y = k18a[(A[:, None] * inv[(tarr + 1) % p][None, :]) % p]  # K2(B / (t + 1))
    Ct = X @ Y.T
    absC = np.abs(Ct)
    E2 = (p - 2) * (2 * e * kmax + e * e)
    I1 = isqrt(64 * p ** 3 << (4 * F1))                        # (|C~| + E2)^2 <= T  <=>  |C~| + E2 <= isqrt(T)
    assert I1 + E2 + 1 < 2 ** 63
    hold1 = absC <= I1 - E2
    fail1 = absC >= I1 + E2 + 1
    open1 = ~(hold1 | fail1)
    holds, fails = int(hold1.sum()), int(fail1.sum())
    fail_witness = None
    if fails:
        a, b = np.argwhere(fail1)[0]
        fail_witness = [int(a) + 1, int(b) + 1]

    # tier 2: F = 96, Python integers, on the instances tier 1 left open and on every candidate for the maximum
    F2 = 96
    kmax2 = max(abs(v) for v in k96)
    E2b = (p - 2) * (2 * e * kmax2 + e * e)
    T2 = 64 * p ** 3 << (4 * F2)
    den = p ** 3 << (4 * F2)

    def tier2(a, b):
        s = sum(k96[(a * inv_l[t]) % p] * k96[(b * inv_l[(t + 1) % p]) % p] for t in ts)
        return max(0, abs(s) - E2b) ** 2, (abs(s) + E2b) ** 2

    undecided = 0
    n_tier2 = 0
    for a, b in np.argwhere(open1):
        lo, up = tier2(int(a) + 1, int(b) + 1)
        n_tier2 += 1
        if up <= T2:
            holds += 1
        elif lo > T2:
            fails += 1
            fail_witness = fail_witness or [int(a) + 1, int(b) + 1]
        else:
            undecided += 1
    max_lower1 = int(np.maximum(absC - E2, 0).max())
    cand = np.argwhere(absC + E2 >= max_lower1)                # only these can attain the maximum
    max_lo = max_hi = -1
    argmax = None
    for a, b in cand:
        lo, up = tier2(int(a) + 1, int(b) + 1)
        n_tier2 += 1
        if up > max_hi:
            max_hi, argmax = up, [int(a) + 1, int(b) + 1]
        max_lo = max(max_lo, lo)
    assert holds + fails + undecided == instances
    return {"axiom": 2, "p": p, "instances": instances, "holds": holds, "fails": fails, "undecided": undecided,
            "max_lo": str(floor_div(10 ** 12 * max_lo, den)), "max_hi": str(ceil_div(10 ** 12 * max_hi, den)),
            "argmax": argmax, "fail_witness": fail_witness, "anchor": bool(anchor),
            "k2max_lo": str(floor_div(10 ** 12 * k2_lo, den_k)), "k2max_hi": str(ceil_div(10 ** 12 * k2_hi, den_k)),
            "tier2": n_tier2}


# ---------------------------------------------------------------------------------------------------------------
# the tuple
# ---------------------------------------------------------------------------------------------------------------
def tuple_from_lean(path):
    text = open(path, encoding="utf-8").read()
    body = re.search(r"def admissibleTuple : Finset ℕ :=\s*\{([^}]*)\}", text).group(1)
    return [int(x) for x in re.findall(r"\d+", body)]


def tuple_report(elems):
    s = sorted(set(elems))
    covered = []
    for q in primes_below(len(s) + 1):                         # a prime q > |H| cannot have all q classes covered
        if len({h % q for h in s}) == q:
            covered.append(q)
    return {"listed": len(elems), "distinct": len(s), "least": s[0], "greatest": s[-1],
            "primes_checked": primes_below(len(s) + 1), "primes_fully_covered": covered, "admissible": not covered}


def _one_prime(p):
    trig = trig_tables(p, (18, 64, 96))
    return p, axiom1(p, trig), axiom2(p, trig)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("run")
    r.add_argument("--out", required=True)
    r.add_argument("--below", type=int, default=500)
    r.add_argument("--only", type=int)
    r.add_argument("--jobs", type=int, default=1)
    t = sub.add_parser("tuple")
    t.add_argument("challenge")
    args = ap.parse_args()
    if args.cmd == "tuple":
        h = tuple_from_lean(args.challenge)
        planted = [1 if x == 2 else x for x in h]
        print(json.dumps({"tuple": tuple_report(h), "planted_2_to_1": tuple_report(planted), "elements": h}, indent=1))
        return
    ps = [args.only] if args.only else primes_below(args.below)
    t0 = time.monotonic()
    lines1, lines2 = [], []
    if args.jobs > 1:                                          # primes in separate processes; the arithmetic is untouched
        import multiprocessing as mp
        done = {}
        with mp.get_context("spawn").Pool(args.jobs) as pool:
            for p, l1, l2 in pool.imap_unordered(_one_prime, sorted(ps, reverse=True), chunksize=1):
                done[p] = (l1, l2)
                print(f"p={p} done at {time.monotonic() - t0:.0f}s ({len(done)}/{len(ps)})", file=sys.stderr, flush=True)
        for p in ps:
            lines1.append(done[p][0])
            lines2.append(done[p][1])
    else:
        for p in ps:
            _, l1, l2 = _one_prime(p)
            lines1.append(l1)
            lines2.append(l2)
            print(f"p={p} done at {time.monotonic() - t0:.0f}s", file=sys.stderr, flush=True)
    with open(args.out, "w") as f:
        for line in lines1 + lines2:
            f.write(json.dumps(line, separators=(",", ":")) + "\n")
    sha = hashlib.sha256(open(__file__, "rb").read()).hexdigest()
    print(json.dumps({"primes": len(ps), "seconds": round(time.monotonic() - t0, 1), "decide.py_sha256": sha}))


if __name__ == "__main__":
    main()
