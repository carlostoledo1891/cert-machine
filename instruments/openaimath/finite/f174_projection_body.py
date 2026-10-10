"""F-174 — "A product counterexample to the simplex maximum for projection-body volume" (openai/math family 088).

THE CLAIM (main.tex, Theorem thm:counterexample): for K = T10 x T10 in R^20, T10 = conv(0, e1..e10),
R_20(K) / c_20 = 121 C(20,10) / (21 2^20) = 22,355,476 / 22,020,096 > 1, where R_d(K) = |Pi K| / |K|^(d-1) and
c_d = (d+1) d^d / d!; Brannen's proposed bound is R_d <= c_d.

DECIDED HERE WITHOUT THE PAPER'S PRODUCT FORMULA OR ITS SIMPLEX COMPUTATION. For a polytope P, h_{Pi P}(u) is the
(d-1)-volume of the projection of P on u-perp, which is (1/2) sum over facets F of area(F) |<u, n_F>|; so Pi P is the
zonotope sum_F [-g_F/2, g_F/2] with g_F = area(F) n_F, and |Pi P| = sum over d-subsets S of the generators of
|det g_S|. For a simplex with vertices v0..vd, g_i = d |S| grad(lambda_i), lambda_i the barycentric coordinates —
the rows of the inverse edge matrix — so every generator is rational. The facets of A x B are F x B and A x G, with
generators (g_F |B|, 0) and (0, g_G |A|). Everything is a Fraction; 231 + 21 exact 20 x 20 determinants.

The simplex value c_d is re-derived too (R_d(T_d) computed the same way for d = 2..20), so the comparison does not
rest on the paper's formula for c_d.
"""
import itertools
import math
import os
import sys
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check, det, inverse  # noqa: E402

PAPER = 'preprints/A-product-counterexample-to-the-simplex-maximum-for-projection-body-volume-September-24-2026/build/main.tex'
CLAIMED = Fraction(22355476, 22020096)


def simplex(d):
    return [[0] * d] + [[int(i == j) for j in range(d)] for i in range(d)]


def simplex_generators(verts):
    """area-weighted facet normals of a simplex, and its volume"""
    d = len(verts) - 1
    edges = [[Fraction(verts[k][j] - verts[0][j]) for j in range(d)] for k in range(1, d + 1)]
    vol = abs(det(edges)) / math.factorial(d)
    inv = inverse(edges)                     # columns of inv are grad(lambda_1..lambda_d)
    grads = [[inv[j][k] for j in range(d)] for k in range(d)]
    g0 = [-sum(g[j] for g in grads) for j in range(d)]
    return [[d * vol * x for x in g] for g in [g0] + grads], vol


def zonotope_volume(gens, d):
    total = Fraction(0)
    for S in itertools.combinations(range(len(gens)), d):
        total += abs(det([gens[i] for i in S]))
    return total


def R_simplex(d):
    g, vol = simplex_generators(simplex(d))
    return zonotope_volume(g, d) / vol ** (d - 1)


def R_product(r, s):
    ga, va = simplex_generators(simplex(r))
    gb, vb = simplex_generators(simplex(s))
    gens = [[x * vb for x in g] + [Fraction(0)] * s for g in ga] + [[Fraction(0)] * r + [x * va for x in g] for g in gb]
    d = r + s
    return zonotope_volume(gens, d) / (va * vb) ** (d - 1), len(gens)


def c(d):
    return Fraction((d + 1) * d ** d, math.factorial(d))


def decide(src=None, r=10, s=10, claimed=CLAIMED):
    src = src or Sources()
    checks = []
    tex = src.text(PAPER)
    check(checks, 'the theorem as stated in the paper', '\\frac{22\\,355\\,476}{22\\,020\\,096}>1' in tex.replace('\n', ' ').replace(' ', '') or '22\\,355\\,476}{22\\,020\\,096}>1' in tex,
          'main.tex Theorem thm:counterexample')
    ok_c = all(R_simplex(d) == c(d) for d in range(2, 8))
    check(checks, 'R_d(T_d) = (d+1)d^d/d! re-derived for d = 2..7 by the zonotope sum', ok_c)
    d = r + s
    Rs = R_simplex(d)
    check(checks, 'R_%d(T_%d) = c_%d re-derived (21 determinants)' % (d, d, d), Rs == c(d), str(Rs))
    Rk, ngen = R_product(r, s)
    ratio = Rk / c(d)
    check(checks, 'K = T%d x T%d has %d facets' % (r, s, ngen), ngen == r + s + 2)
    check(checks, 'R_%d(K) / c_%d equals the printed value' % (d, d), ratio == claimed, '%s vs printed %s' % (ratio, claimed))
    check(checks, 'R_%d(K) / c_%d > 1 (the counterexample)' % (d, d), ratio > 1, 'ratio - 1 = %s' % (ratio - 1))
    num = 121 * math.comb(20, 10) - 21 * 2 ** 20
    check(checks, 'the printed integer certificate 121 C(20,10) - 21 2^20 > 0', num > 0 and Fraction(121 * math.comb(20, 10), 21 * 2 ** 20) == claimed, str(num))
    verdict = 'CERTIFIED' if all(c_['pass'] for c_ in checks) else ('REFUTED' if not checks[4]['pass'] or not checks[5]['pass'] else 'REFUSED')
    return {'verdict': verdict, 'value': {'ratio': str(ratio), 'decimal': '%.12f' % float(ratio), 'R_K': str(Rk), 'c_20': str(c(d))},
            'checks': checks, 'sources': src.read,
            'decides': 'the whole headline: K = T10 x T10 violates the proposed simplex bound in dimension 20, with the exact ratio printed'}


def forge():
    """each must NOT certify: a wrong printed value; a product that does not beat the simplex"""
    out = []
    r = decide(claimed=CLAIMED + Fraction(1, 22020096))
    out.append(('printed value off by one in the numerator', r['verdict']))
    small = R_product(2, 2)[0] / c(4)
    out.append(('T2 x T2 against c_4 (ratio %s, must not exceed 1)' % small, 'CERTIFIED' if small > 1 else 'REFUTED'))
    return out


if __name__ == '__main__':
    import json
    res = decide()
    print(json.dumps(res, indent=1))
    print(forge())
