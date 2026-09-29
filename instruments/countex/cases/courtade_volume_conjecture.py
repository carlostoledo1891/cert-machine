"""Independent exact decider for counterexamples/courtade-volume-conjecture.
Python 3 standard library only: integers and fractions.Fraction; no floats.
Written from case.tex before reading verify.py.

Claim: in R^4, with B the zonotope of 7 integer generators and K=[0,b], L=[0,c],
  |B| |K+L+B| > |K+B| |L+B|, and |K|=|L|=0,
so (|K+L+B||B|)^(1/4) + (|K||L|)^(1/4) > (|K+B||L+B|)^(1/4): Courtade's inequality fails.
Also: the thickened full-dimensional variant (eps = 1/100) and the padding to d > 4.

Volumes: (1) Shephard's zonotope formula vol Z(v_1..v_m) = sum_{|S|=d} |det v_S|;
(2) independently, for the integer zonotopes, the Ehrhart polynomial: count lattice
points of tZ (t = 0..4) from an exact H-description of Z and read vol = Delta^4 L(0)/4!.
"""
import json
import os
import copy
import itertools
from fractions import Fraction

CASE = 'courtade-volume-conjecture'


def det(M):
    """Exact determinant over Fractions (Gaussian elimination)."""
    n = len(M)
    A = [[Fraction(x) for x in row] for row in M]
    s = Fraction(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None:
            return Fraction(0)
        if p != c:
            A[c], A[p] = A[p], A[c]
            s = -s
        s *= A[c][c]
        for r in range(c + 1, n):
            if A[r][c] != 0:
                f = A[r][c] / A[c][c]
                A[r] = [a - f * b for a, b in zip(A[r], A[c])]
    return s


def zvol(gens, d):
    """Shephard: volume of the zonotope sum [0, g] = sum over d-subsets of |det|."""
    tot = Fraction(0)
    hist = {}
    for S in itertools.combinations(range(len(gens)), d):
        v = abs(det([gens[i] for i in S]))  # rows = generators; |det| is transpose-invariant
        hist[v] = hist.get(v, 0) + 1
        tot += v
    return tot, hist


def cofactor_normal(vecs, d):
    """Integer normal to the hyperplane spanned by d-1 vectors (generalized cross product)."""
    n = []
    for k in range(d):
        minor = [[v[j] for j in range(d) if j != k] for v in vecs]
        n.append(((-1) ** k) * int(det(minor)))
    return n


def slabs(gens, d):
    """H-description of the zonotope sum [0,g]: for every hyperplane spanned by d-1 generators,
    the slab sum_i min(0, n.g_i) <= n.x <= sum_i max(0, n.g_i).  The facet normals of a
    full-dimensional zonotope are among these normals, and every such slab is valid, so the
    intersection is exactly the zonotope."""
    out = set()
    for S in itertools.combinations(range(len(gens)), d - 1):
        n = cofactor_normal([gens[i] for i in S], d)
        if any(n):
            dots = [sum(a * b for a, b in zip(n, g)) for g in gens]
            lo = sum(min(0, x) for x in dots)
            hi = sum(max(0, x) for x in dots)
            out.add((tuple(n), lo, hi))
    return list(out)


def lattice_count(gens, d, t):
    """#(t Z  cap  Z^d), enumerating x_1..x_{d-1} in the bounding box and solving for x_d."""
    if t == 0:
        return 1
    H = slabs(gens, d)
    lo = [t * sum(min(0, g[k]) for g in gens) for k in range(d)]
    hi = [t * sum(max(0, g[k]) for g in gens) for k in range(d)]
    cnt = 0
    for pre in itertools.product(*[range(lo[k], hi[k] + 1) for k in range(d - 1)]):
        a, b = Fraction(lo[d - 1]), Fraction(hi[d - 1])
        ok = True
        for n, l, h in H:
            s = sum(n[k] * pre[k] for k in range(d - 1))
            nd = n[d - 1]
            L, U = t * l - s, t * h - s
            if nd == 0:
                if not (L <= 0 <= U):
                    ok = False
                    break
            elif nd > 0:
                a, b = max(a, Fraction(L, nd)), min(b, Fraction(U, nd))
            else:
                a, b = max(a, Fraction(U, nd)), min(b, Fraction(L, nd))
            if a > b:
                ok = False
                break
        if ok:
            ca = -((-a.numerator) // a.denominator)   # ceil
            fb = b.numerator // b.denominator         # floor
            if fb >= ca:
                cnt += fb - ca + 1
    return cnt


def ehrhart_volume(gens, d):
    Ls = [lattice_count(gens, d, t) for t in range(d + 1)]
    diff = sum(((-1) ** (d - k)) * _binom(d, k) * Ls[k] for k in range(d + 1))
    fact = 1
    for k in range(2, d + 1):
        fact *= k
    return Fraction(diff, fact), Ls


def _binom(n, k):
    r = 1
    for i in range(k):
        r = r * (n - i) // (i + 1)
    return r


def is_int_vec(v):
    return all(isinstance(x, int) and not isinstance(x, bool) for x in v)


def decide(root, cert=None):
    if cert is None:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    checks = []
    try:
        d = cert['dimension']
        Bg = [list(g) for g in cert['A_generators']]     # the zonotope B of case.tex (called A in the json)
        b, c = list(cert['b']), list(cert['c'])           # K = [0,b], L = [0,c]
        eps = Fraction(cert['thickening_eps'])
    except Exception as ex:
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [], 'why': 'malformed certificate: %r' % ex}
    claim = ('In R^4 the zonotope B (7 integer generators) and segments K=[0,b], L=[0,c] satisfy '
             '|B||K+L+B| > |K+B||L+B| with |K|=|L|=0, so Courtade\'s inequality '
             '|K+L+B|^(1/4)|B|^(1/4) + |K|^(1/4)|L|^(1/4) <= |K+B|^(1/4)|L+B|^(1/4) fails; it still fails for '
             'full-dimensional eps-thickened segments and for d > 4 after padding B with a cube.')
    ok_in = (d == 4 and len(Bg) == 7 and all(len(g) == 4 and is_int_vec(g) for g in Bg)
             and len(b) == 4 and len(c) == 4 and is_int_vec(b) and is_int_vec(c) and 0 < eps)
    checks.append({'name': 'witness shape: d=4, 7 integer generators, integer b, c, eps > 0', 'ok': ok_in,
                   'detail': 'G columns %s; b=%s c=%s eps=%s' % (Bg, b, c, eps)})
    if not ok_in:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks, 'why': 'witness not in the expected form'}
    G_tex = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [0, 1, -1, 1], [1, 0, -1, 1], [0, 0, 1, 1]]
    checks.append({'name': 'certificate generators == columns of G in case.tex, b=(1,-1,1,1), c=(0,0,-1,1)',
                   'ok': Bg == G_tex and b == [1, -1, 1, 1] and c == [0, 0, -1, 1], 'detail': '', 'side': True})
    sets = {'B': Bg, 'K+B': Bg + [b], 'L+B': Bg + [c], 'K+L+B': Bg + [b, c]}
    V, E = {}, {}
    for k, g in sets.items():
        V[k], hist = zvol(g, 4)
        if k == 'B':
            checks.append({'name': '|det| histogram over the 35 quadruples of B (case.tex: 11 zero, 20 one, 4 two)',
                           'ok': hist == {0: 11, 1: 20, 2: 4}, 'detail': str(sorted(hist.items())), 'side': True})
        E[k], Ls = ehrhart_volume(g, 4)
        checks.append({'name': 'vol(%s): Shephard sum == Ehrhart leading coefficient' % k, 'ok': V[k] == E[k],
                       'detail': 'Shephard %s, Ehrhart %s from L(0..4)=%s' % (V[k], E[k], Ls)})
    # segments have 4-volume 0 (a single generator: no 4-subsets)
    VK, _ = zvol([b], 4)
    VL, _ = zvol([c], 4)
    checks.append({'name': '|K| = |L| = 0 (segments)', 'ok': VK == 0 and VL == 0, 'detail': ''})
    lhs4, rhs4 = V['B'] * V['K+L+B'], V['K+B'] * V['L+B']
    viol = lhs4 > rhs4
    checks.append({'name': '|B||K+L+B| > |K+B||L+B| (fourth powers; t -> t^4 is monotone on t >= 0), '
                           'so (|K+L+B||B|)^(1/4) + 0 > (|K+B||L+B|)^(1/4)',
                   'ok': viol, 'detail': '%s*%s = %s > %s = %s*%s' % (V['B'], V['K+L+B'], lhs4, rhs4, V['K+B'], V['L+B'])})
    pv = cert.get('volumes_segment_form', {})
    agree = (Fraction(pv.get('A', -1)) == V['B']
             and Fraction(pv.get('A+B', -1)) == V['K+B'] and Fraction(pv.get('A+C', -1)) == V['L+B']
             and Fraction(pv.get('A+B+C', -1)) == V['K+L+B'])
    pp = cert.get('products_segment_form', {})
    agree &= (Fraction(pp.get('Vol(A)*Vol(A+B+C)', -1)) == lhs4 and Fraction(pp.get('Vol(A+B)*Vol(A+C)', -1)) == rhs4)
    checks.append({'name': 'printed segment-form volumes and products agree', 'ok': agree,
                   'detail': 'printed %s %s' % (pv, pp)})
    # thickened, full-dimensional variant
    box = [[eps if i == j else 0 for j in range(4)] for i in range(4)]
    Ke, Le = [b] + box, [c] + box
    T = {'K_eps': Ke, 'L_eps': Le, 'K_eps+B': Bg + Ke, 'L_eps+B': Bg + Le, 'K_eps+L_eps+B': Bg + Ke + Le}
    TV = {k: zvol(g, 4)[0] for k, g in T.items()}
    full = TV['K_eps'] > 0 and TV['L_eps'] > 0 and V['B'] > 0
    checks.append({'name': 'thickened sets full-dimensional: |K_eps|, |L_eps|, |B| > 0', 'ok': full,
                   'detail': '|K_eps|=%s |L_eps|=%s' % (TV['K_eps'], TV['L_eps'])})
    gap = V['B'] * TV['K_eps+L_eps+B'] - TV['K_eps+B'] * TV['L_eps+B']
    checks.append({'name': 'thickened: |B||K_e+L_e+B| - |K_e+B||L_e+B| > 0, so X > Z and X + Y > Z with '
                           'Y = (|K_e||L_e|)^(1/4) >= 0', 'ok': gap > 0, 'detail': 'gap = %s' % gap})
    pt = cert.get('volumes_thickened', {})
    try:
        agree_t = (Fraction(pt['B_eps']) == TV['K_eps'] and Fraction(pt['C_eps']) == TV['L_eps']
                   and Fraction(pt['A+B_eps']) == TV['K_eps+B'] and Fraction(pt['A+C_eps']) == TV['L_eps+B']
                   and Fraction(pt['A+B_eps+C_eps']) == TV['K_eps+L_eps+B']
                   and Fraction(cert['thickened_gap_Vol(A)Vol(A+B+C)-Vol(A+B)Vol(A+C)']) == gap)
    except Exception:
        agree_t = False
    checks.append({'name': 'printed thickened volumes and gap agree', 'ok': agree_t, 'detail': ''})
    # d > 4: B x [0,1]^(d-4), segments embedded with zero padding; recompute for d = 5, 6
    pad_ok = True
    det_ = []
    for dd in (5, 6):
        e = [[1 if i == j else 0 for j in range(dd)] for i in range(4, dd)]
        Bp = [g + [0] * (dd - 4) for g in Bg] + e
        bp, cp = b + [0] * (dd - 4), c + [0] * (dd - 4)
        vB = zvol(Bp, dd)[0]
        vKB = zvol(Bp + [bp], dd)[0]
        vLB = zvol(Bp + [cp], dd)[0]
        vKLB = zvol(Bp + [bp, cp], dd)[0]
        same = (vB, vKB, vLB, vKLB) == (V['B'], V['K+B'], V['L+B'], V['K+L+B'])
        pad_ok &= same and vB * vKLB > vKB * vLB
        det_.append('d=%d: %s' % (dd, (vB, vKB, vLB, vKLB)))
    checks.append({'name': 'padding to d=5,6 recomputed: the four volumes are unchanged and still violate '
                           '(d >= 7 by the product identity (B+[0,b]) x [0,1]^(d-4), not computed)',
                   'ok': pad_ok, 'detail': '; '.join(det_), 'side': True})
    need = [ch for ch in checks if not ch.get('side')]
    allok = all(ch['ok'] for ch in need)
    return {'verdict': 'CERTIFIED' if allok else 'REFUTED', 'claim': claim, 'checks': checks,
            'why': '' if allok else 'failed: ' + '; '.join(ch['name'] for ch in need if not ch['ok'])}


def forge(cert):
    """One coordinate of one generator moved by one: generator 7 (0,0,1,1) -> (0,0,0,1)."""
    f = copy.deepcopy(cert)
    f['A_generators'][6][2] -= 1
    return f


def forges(cert):
    out = []
    out.append(('generator 7 (0,0,1,1) -> (0,0,0,1)', forge(cert)))
    f = copy.deepcopy(cert)
    f['b'] = [1, -1, 1, 0]
    out.append(('b = (1,-1,1,1) -> (1,-1,1,0)', f))
    f = copy.deepcopy(cert)
    f['volumes_segment_form']['A+B'] = '67'
    out.append(('printed |K+B| 68 -> 67', f))
    return out


if __name__ == '__main__':
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as fh:
        cert = json.load(fh)
    r = decide(root, cert)
    print(CASE, '->', r['verdict'])
    for ch in r['checks']:
        print('  [%s]%s %s  %s' % ('ok' if ch['ok'] else 'FAIL', ' (side)' if ch.get('side') else '', ch['name'],
                                   ch['detail'][:200]))
    print('why:', r['why'])
    for name, fc in forges(cert):
        rf = decide(root, fc)
        print('FORGE (%s) -> %s   %s' % (name, rf['verdict'], rf['why'][:200]))
        assert rf['verdict'] != 'CERTIFIED'
