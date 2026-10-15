#!/usr/bin/env python3
"""Check a lower bound for C_3c = SD({0,1,2,oo}; -1) in ball arithmetic (python-flint).

C_3c is problem 3c of Tao's optimization-constants repository; in its entropy formulation it is the least constant C
with H(X - Y) <= C max(H(X), H(Y), H(X + Y), H(X + 2Y)) for all pairs of discrete random variables X, Y.

The certificate (JSON) gives a base B, positive integer counts a_1, ..., a_K, and K laws: law k is a list of points
(x, y) in Z^2 with positive rational weights.  The pair (X, Y) is built from n = a_1 + ... + a_K independent digits
(x_i, y_i), a_k of them distributed according to law k, as (X, Y) = sum_i B^i (x_i, y_i).

The script
  1. checks exactly (integers and fractions): the points of each law are distinct pairs of integers; the weights
     are positive and sum to 1; x - y takes distinct values on the points of each law; 2|L(x, y)| < B for the five
     forms L = x - y, x, y, x + y, x + 2y and every point; the counts are positive integers;
  2. uses the consequence of 1 that H(L(X, Y)) = sum_k a_k H(L(law k)) for each of the five forms (L(X, Y) =
     sum_i B^i L(x_i, y_i) with |L(x_i, y_i)| < B/2, so L(X, Y) determines the independent digits L(x_i, y_i);
     balanced base-B expansion), where H(L(law k)) is the entropy of the image of law k under L;
  3. evaluates these entropies (natural logarithm) in arb ball arithmetic and certifies
        H(X - Y) / max(H(X), H(Y), H(X + Y), H(X + 2Y)) > claimed bound
     by comparing the lower endpoint of the ball with the claimed bound, an exact rational.
Usage: python3 verify_flint.py certificate.json [precision_in_bits]
"""
import sys
import json
from fractions import Fraction
from flint import arb, fmpq, ctx

FORMS = [("x-y", 1, -1), ("x", 1, 0), ("y", 0, 1), ("x+y", 1, 1), ("x+2y", 1, 2)]


def is_int(v):
    return isinstance(v, int) and not isinstance(v, bool)


def entropy(masses):
    """Shannon entropy (natural log) of a list of positive Fractions summing to 1, as an arb ball."""
    s = arb(0)
    for p in masses:
        t = arb(fmpq(p.numerator, p.denominator))
        s -= t * t.log()
    return s


def main():
    path = sys.argv[1]
    ctx.prec = int(sys.argv[2]) if len(sys.argv) > 2 else 600
    cert = json.load(open(path))
    problems = []
    B, counts, laws = cert["base"], cert["counts"], cert["laws"]
    cn, cd = cert["claimed_lower_bound"]
    if not (is_int(cn) and is_int(cd) and cd > 0):
        problems.append("claimed bound is not a fraction of integers")
    claim = Fraction(cn, cd)
    if not (is_int(B) and B >= 2):
        problems.append("base is not an integer >= 2")
    if len(counts) != len(laws) or not all(is_int(a) and a > 0 for a in counts):
        problems.append("counts are not positive integers, one per law")
    n = sum(counts)
    totals = [arb(0) for _ in FORMS]
    maxL = 0
    for k, law in enumerate(laws):
        pts, ws = law["points"], law["weights"]
        if len(pts) != len(ws):
            problems.append("law %d: %d points but %d weights" % (k, len(pts), len(ws)))
            continue
        if not all(len(p) == 2 and is_int(p[0]) and is_int(p[1]) for p in pts):
            problems.append("law %d: a point is not a pair of integers" % k)
            continue
        if not all(len(w) == 2 and is_int(w[0]) and is_int(w[1]) and w[1] > 0 for w in ws):
            problems.append("law %d: a weight is not a fraction of integers" % k)
            continue
        P = [tuple(p) for p in pts]
        W = [Fraction(a, b) for a, b in ws]
        if len(set(P)) != len(P):
            problems.append("law %d: repeated point" % k)
        if any(w <= 0 for w in W):
            problems.append("law %d: a weight is not positive" % k)
        if sum(W) != 1:
            problems.append("law %d: weights sum to %s, not 1" % (k, sum(W)))
        if len(set(x - y for x, y in P)) != len(P):
            problems.append("law %d: x - y is not injective on the points" % k)
        m = max(abs(a * x + b * y) for _, a, b in FORMS for x, y in P)
        maxL = max(maxL, m)
        if not 2 * m < B:
            problems.append("law %d: max |L| = %d but base %d (need 2 max|L| < base)" % (k, m, B))
        for j, (_, a, b) in enumerate(FORMS):
            image = {}
            for (x, y), w in zip(P, W):
                image[a * x + b * y] = image.get(a * x + b * y, Fraction(0)) + w
            totals[j] += counts[k] * entropy(list(image.values()))
    print("certificate:", path)
    print("laws: %d; points per law: %s; counts: %s; n = %d digits; base %d; max |L| = %d"
          % (len(laws), [len(L["points"]) for L in laws], counts, n, B, maxL))
    print("exact checks:", "all passed" if not problems else "FAILED")
    for p in problems:
        print("   ", p)
    N, D = totals[0], totals[1:]
    print("entropies per digit (divided by n), natural log, as balls:")
    for (name, _, _), h in zip(FORMS, totals):
        print("   H(%s)/n = %s" % (name.replace("x", "X").replace("y", "Y"), (h / n).str(40, radius=True)))
    # ratio = N / max_j D_j = min_j N / D_j (N > 0); its ball is enclosed by [min_j lower, min_j upper]
    ratios = [N / d for d in D]
    lower, upper = ratios[0].lower(), ratios[0].upper()
    for r in ratios[1:]:
        if r.lower() < lower:
            lower = r.lower()
        if r.upper() < upper:
            upper = r.upper()
    print("ratio H(X-Y)/max(H(X),H(Y),H(X+Y),H(X+2Y)) lies in [lo, hi] (endpoints shown to 45 digits; the")
    print("comparison with the claim below uses the exact endpoint lo):")
    print("   lo = %s" % lower.str(45, radius=False))
    print("   hi = %s" % upper.str(45, radius=False))
    print("   hi - lo = %s" % (upper - lower).str(3, radius=False))
    c = fmpq(claim.numerator, claim.denominator)
    margin = lower - c
    ok = (not problems) and bool(margin > 0)
    print("claimed lower bound: %d/%d; certified lower endpoint - claim = %s" % (cn, cd, margin.str(12)))
    print("RESULT: %s" % ("certified, C_3c >= %s" % decimal(cn, cd) if ok else "NOT certified"))
    sys.exit(0 if ok else 1)


def decimal(num, den):
    """Exact decimal string of num/den when den is a power of 10 (else 'num/den')."""
    d, e = den, 0
    while d % 10 == 0:
        d //= 10; e += 1
    if d != 1 or num < 0:
        return "%d/%d" % (num, den)
    s = str(num).rjust(e + 1, "0")
    return s[:-e] + "." + s[-e:] if e else s


if __name__ == "__main__":
    main()
