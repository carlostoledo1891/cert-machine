#!/usr/bin/env python3
"""uniqueness.py -- a uniqueness argument for the stationary quadratic mean-field game, decided per rectangle.

The game (sigma = 1/2, on the torus R/Z):

    -sigma u'' + (1/2)(u')^2 + rho = c m + A cos(2 pi x),   -sigma m'' - (m u')' = 0,   int m = 1,  int u = 0,  m > 0.

THE ARGUMENT IS NOT OURS. It is GPT-6.2 Astra's (corpus/mfg-two-models/astra-report.tex, "A global uniqueness
rectangle at negative coupling"). It proves that on a rectangle c in [-G, 0], A in [0, a] there is exactly one
positive periodic equilibrium, even or not, PROVIDED one finite inequality holds. Its author evaluated the
inequality once, at G = 7, a = 6/5. Its hypotheses use only the largest |c| and the largest A of the rectangle,
so the same inequality decides any rectangle. This file evaluates it in exact rational arithmetic.

    S   = a / (sqrt2 (pi^2 - G))                     needs  pi^2/2 < G < pi^2
    D   = pi S,   eta = S / 2
    M   = (1 + D / sqrt12)^2
    U   = 3 G S + a / sqrt2
    B   = 3 G (M - 1) + a                            needs  B < 6 pi^2
    C2  = (2 D^2 + 4 G S^2 + 4 a S / sqrt2) / (16 pi^2 - 4 G)
    LB  = 2 pi^2 (1 - eta^2) - 3 G C2 - 2 eta U - 2 U^2 / (6 pi^2 - B)
    exactly one equilibrium on the rectangle  if  LB > 2 G.

Every quantity is bounded in the direction that makes the test harder (upper bounds on S, D, M, U, B, C2, a lower
bound on LB), with rational enclosures of pi (Machin's formula, alternating series) and of the square roots. A
point with -c <= pi^2/2 is covered by the rectangle of any larger G that passes.

WHAT THIS DECIDES: the last line of the argument. WHAT IT DOES NOT: the argument, which is a proof on paper.

usage: python3 labs/mfg/uniqueness.py            prints one JSON record                                    MIT
"""
import csv, json, os, sys
from fractions import Fraction as F

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def atan_inv_bounds(n, terms=40):
    """rigorous (lo, hi) for arctan(1/n): consecutive partial sums of an alternating series bracket it"""
    x = F(1, n); s = F(0); t = x; lo = hi = None
    for k in range(terms):
        s += t / (2 * k + 1) * (1 if k % 2 == 0 else -1)
        t *= x * x
        if k % 2 == 0: hi = s
        else: lo = s
    return lo, hi


_a5, _a239 = atan_inv_bounds(5), atan_inv_bounds(239)
PI_LO = 16 * _a5[0] - 4 * _a239[1]
PI_HI = 16 * _a5[1] - 4 * _a239[0]
assert PI_LO < PI_HI and PI_HI - PI_LO < F(1, 10**40)
assert F(314159265358979, 10**14) < PI_LO and PI_HI < F(314159265358980, 10**14)


def sqrt_lo(n, digits=30):
    """the largest multiple of 10^-digits whose square is below n"""
    lo, hi = 0, (n + 1) * 10**digits
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if mid * mid < n * 10**(2 * digits): lo = mid
        else: hi = mid
    r = F(lo, 10**digits)
    assert r * r < n
    return r


RT2_LO, RT12_LO = sqrt_lo(2), sqrt_lo(12)


def decide(G, a):
    """(passes, margin): passes iff the finite inequality holds on [-G, 0] x [0, a]; margin = LB - 2G when defined"""
    G, a = F(G), F(a)
    if not (2 * G > PI_HI**2 and G < PI_LO**2): return False, None
    if a == 0: return True, None                      # A = 0: the classification of the unforced problem
    S = a / (RT2_LO * (PI_LO**2 - G))                 # upper
    D = PI_HI * S                                     # upper
    eta = S / 2                                       # D / (2 pi), upper
    if not eta < 1: return False, None
    M = (1 + D / RT12_LO) ** 2                        # upper
    U = 3 * G * S + a / RT2_LO                        # upper
    B = 3 * G * (M - 1) + a                           # upper
    if not B < 6 * PI_LO**2: return False, None
    C2 = (2 * D * D + 4 * G * S * S + 4 * a * S / RT2_LO) / (16 * PI_LO**2 - 4 * G)   # upper
    LB = 2 * PI_LO**2 * (1 - eta * eta) - 3 * G * C2 - 2 * eta * U - 2 * U * U / (6 * PI_LO**2 - B)   # lower
    return LB > 2 * G, LB - 2 * G


STEP = F(1, 10000)


def best_G(a):
    """the largest G on a grid of 1e-4 found to pass, by bisection. Only the returned G is claimed, and it passes."""
    lo, hi = F(49349, 10000), F(98695, 10000)         # just above pi^2/2, just below pi^2
    if not decide(lo, a)[0]: return None
    if decide(hi, a)[0]: return hi
    while hi - lo > STEP:
        mid = F(int(((lo + hi) / 2) / STEP)) * STEP
        if mid <= lo: mid = lo + STEP
        if decide(mid, a)[0]: lo = mid
        else: hi = mid
    assert decide(lo, a)[0]
    return lo


def Q(x):
    return F(str(x)) if isinstance(x, float) else F(x)


def main():
    ok, margin = decide(7, F(6, 5))                   # the author's own point must pass
    assert ok
    assert not decide(F(98, 10), F(6, 5))[0] and not decide(9, 3)[0]     # two that must fail

    m = json.load(open(os.path.join(ROOT, 'certs', 'mfg-regime-map.json')))
    cells = m['cells']
    depths = sorted({Q(z['a1']).limit_denominator(10**6) for z in cells})
    curve = {a: best_G(a) for a in depths}
    for a_extra in (F(2), F(3)): curve[a_extra] = best_G(a_extra)        # beyond the map, for the table

    und = [z for z in cells if z['verdict'] == 'UNDECIDED']
    unique_cells, area, by_reason = 0, F(0), {}
    for z in und:
        c0, c1 = Q(z['c0']).limit_denominator(10**6), Q(z['c1']).limit_denominator(10**6)
        a0, a1 = Q(z['a0']).limit_denominator(10**6), Q(z['a1']).limit_denominator(10**6)
        if c1 > 0: continue
        G = curve[a1]
        if G is not None and -c0 <= G:
            unique_cells += 1; area += (c1 - c0) * (a1 - a0)
            by_reason[str(z['why'])] = by_reason.get(str(z['why']), 0) + 1
    # a falsifier: no cell the map proves MULTIPLE may touch the region the argument calls unique
    multiple_inside = sum(1 for z in cells if z['verdict'] == 'MULTIPLE'
                          and curve[Q(z['a1']).limit_denominator(10**6)] is not None
                          and Q(z['c1']).limit_denominator(10**6) > -curve[Q(z['a1']).limit_denominator(10**6)])
    in_author_rectangle = sum(1 for z in und if z['c0'] >= -7 and z['c1'] <= 0)
    total = F(str(m['tally']['total']))

    # the first fold, from Claude Fable 5.2's table (floating point, NOT certified), to measure the gap
    rows = [r for r in csv.reader(open(os.path.join(ROOT, 'corpus', 'mfg-two-models', 'fable-folds.csv')))
            if r and not r[0].startswith('#') and r[0] != 'j']
    f1 = sorted((float(r[1]), float(r[2])) for r in rows if r[0] == '1')

    def fold(A):
        import math
        if A <= f1[0][0]:
            return -math.pi**2 + (f1[0][1] + math.pi**2) * (A / f1[0][0]) ** (2 / 3)
        for (a0, c0), (a1, c1) in zip(f1, f1[1:]):
            if a0 <= A <= a1: return c0 + (c1 - c0) * (A - a0) / (a1 - a0)
        return f1[-1][1]

    n = 2400
    area_right_of_fold = sum(-fold((i + 0.5) * 1.2 / n) for i in range(n)) * 1.2 / n
    table = []
    for a in (F(1, 80), F(9, 80), F(5, 16), F(49, 80), F(73, 80), F(6, 5)):
        G = curve[a]
        table.append({'depth': str(a), 'depthFloat': float(a), 'G': str(G), 'GFloat': float(G),
                      'foldFloat': round(fold(float(a)), 4), 'gap': round(-fold(float(a)) - float(G), 3)})
    rec = {
        'what': 'a uniqueness argument (GPT-6.2 Astra) decided exactly per rectangle [-G, 0] x [0, a]: the largest G on a 1e-4 grid whose finite inequality holds',
        'authorPoint': {'G': '7', 'a': '6/5', 'lowerBoundFloat': round(float(margin + 14), 5), 'needs': 14},
        'mustFail': [{'G': '49/5', 'a': '6/5'}, {'G': '9', 'a': '3'}],
        'curve': [{'depth': str(a), 'depthFloat': float(a), 'G': (str(G) if G is not None else None),
                   'GFloat': (float(G) if G is not None else None), 'foldFloat': round(fold(float(a)), 4)}
                  for a, G in sorted(curve.items())],
        'table': table,
        'map': {'undecidedCells': len(und), 'uniqueByTheArgument': unique_cells, 'area': str(area),
                'areaFloat': round(float(area), 4), 'shareOfMap': round(float(area / total), 4),
                'byReason': by_reason, 'insideTheAuthorsRectangle': in_author_rectangle,
                'shareOfMapAuthorsRectangle': round(float(F(42, 5) / total), 4),
                'multipleCellsInsideTheUniqueRegion': multiple_inside},
        'againstTheFold': {'source': 'corpus/mfg-two-models/fable-folds.csv (floating point, not certified)',
                           'areaRightOfTheFoldFloat': round(area_right_of_fold, 3),
                           'shareOfMapFloat': round(area_right_of_fold / float(total), 4),
                           'argumentReachesShare': round(float(area) / area_right_of_fold, 4)},
    }
    json.dump(rec, sys.stdout, indent=1)


if __name__ == '__main__':
    main()
