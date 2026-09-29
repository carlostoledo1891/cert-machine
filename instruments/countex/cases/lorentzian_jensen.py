"""Independent exact decider for counterexamples/lorentzian-jensen (two results:
lorentzian-jensen and log-volume-distance).  Python 3 standard library only.
Written from case.tex before reading verify.py.

Witness (case.tex Lemma lem:lorentzian-cubic; the artifact does not carry G itself, so its
coefficients are taken from case.tex and may be overridden by cert['G_coefficients'] =
[a_0, a_1, a_2, a_3] for G = sum_k a_k x^k y^(3-k)):
    G(x,y) = y^3 + 11/5 x y^2 + 3/2 x^2 y + 1/10 x^3,  p=(35,2), q=(11/2,23/2), r=(1/500,15).
Claim: G is (strictly) Lorentzian, and d_G(p,r) > d_G(p,q) + d_G(q,r), where
    d_G(a,b) = sqrt(J(a,b)),  J(a,b) = (1/2) log R_ab,  R_ab = G((a+b)/2)^2 / (G(a) G(b)).

Transcendentals, rigorously and without floats or the decimal module:
  ln R (R > 1): with t = (R-1)/(R+1) in (0,1), ln R = 2 sum_{k>=0} t^(2k+1)/(2k+1);
      the N-term partial sum is a lower bound (all terms positive) and adding
      2 t^(2N+1) / ((2N+1)(1-t^2)) gives an upper bound (geometric majorant of the tail).
  sqrt(y): integer isqrt on y*10^(2P), floor for the lower, ceiling for the upper bound.
All bounds are Fractions rounded outward onto the grid 10^-P.
"""
import json
import os
import copy
from fractions import Fraction as Fr
from math import isqrt

CASE = 'lorentzian-jensen'
TEX_COEFFS = [Fr(1), Fr(11, 5), Fr(3, 2), Fr(1, 10)]     # a_k for x^k y^(3-k)
P = 110                                                 # digits of the enclosure grid


def G(a, x, y):
    return sum(a[k] * x ** k * y ** (3 - k) for k in range(4))


def floor_grid(v, p=P):
    s = 10 ** p
    return Fr((v.numerator * s) // v.denominator, s)


def ceil_grid(v, p=P):
    s = 10 ** p
    return Fr(-((-v.numerator * s) // v.denominator), s)


def ln_enclosure(R, p=P):
    assert R >= 1
    if R == 1:
        return Fr(0), Fr(0)
    t = (R - 1) / (R + 1)
    t2 = t * t
    target = Fr(1, 10 ** (p + 5))
    s, pw, k = Fr(0), t, 0
    while True:
        s += pw / (2 * k + 1)
        k += 1
        pw *= t2
        tail = 2 * pw / ((2 * k + 1) * (1 - t2))   # bounds 2 * sum_{j>=k} t^(2j+1)/(2j+1)
        if tail < target:
            break
    lo = 2 * s
    hi = lo + tail
    return floor_grid(lo, p), ceil_grid(hi, p)


def sqrt_enclosure(lo, hi, p=P):
    assert 0 <= lo <= hi
    s2 = 10 ** (2 * p)
    m = (lo.numerator * s2) // lo.denominator             # floor(lo * 10^2p)
    L = Fr(isqrt(m), 10 ** p)                              # L^2 <= lo
    M = -((-hi.numerator * s2) // hi.denominator)          # ceil(hi * 10^2p)
    u = isqrt(M)
    if u * u < M:
        u += 1
    U = Fr(u, 10 ** p)                                     # U^2 >= hi
    return L, U


def dec(x, k=50):
    """Display only: truncation toward -inf to k decimals."""
    s = floor_grid(x, k)
    neg = s < 0
    s = abs(s)
    ip = s.numerator // s.denominator
    fp = (s - ip) * 10 ** k
    return ('-' if neg else '') + '%d.%0*d' % (ip, k, fp.numerator // fp.denominator)


def lorentzian_checks(a, checks):
    ok_pos = all(c > 0 for c in a)
    checks.append({'name': 'G has all four coefficients > 0 (G > 0 on the open quadrant; support = all of {k+l=3}, '
                           'which is M-convex)', 'ok': ok_pos, 'detail': str(a)})
    # G = a0 y^3 + a1 x y^2 + a2 x^2 y + a3 x^3
    a0, a1, a2, a3 = a
    # Hessian of dG/dx = a1 y^2 + 2 a2 x y + 3 a3 x^2  -> [[6 a3, 2 a2], [2 a2, 2 a1]]
    Hx = [[6 * a3, 2 * a2], [2 * a2, 2 * a1]]
    Hy = [[2 * a2, 2 * a1], [2 * a1, 6 * a0]]            # dG/dy = 3 a0 y^2 + 2 a1 x y + a2 x^2
    dx = Hx[0][0] * Hx[1][1] - Hx[0][1] ** 2
    dy = Hy[0][0] * Hy[1][1] - Hy[0][1] ** 2
    ok_bh = dx < 0 and dy < 0 and Hx[0][0] > 0 and Hy[0][0] > 0
    checks.append({'name': 'Branden-Huh definition: Hessians of dG/dx and dG/dy are nonsingular with exactly one '
                           'positive eigenvalue (det < 0) -- strictly Lorentzian', 'ok': ok_bh,
                   'detail': 'det Hess(G_x) = %s, det Hess(G_y) = %s' % (dx, dy)})
    b = [a0, a1 / 3, a2 / 3, a3]
    ok_lc = b[1] ** 2 > b[0] * b[2] and b[2] ** 2 > b[1] * b[3]
    checks.append({'name': 'bivariate criterion of case.tex: a_k / C(3,k) strictly log-concave', 'ok': ok_lc,
                   'detail': 'normalized %s: %s > %s, %s > %s' % ([str(v) for v in b], b[1] ** 2, b[0] * b[2],
                                                                b[2] ** 2, b[1] * b[3])})
    # context definition: second-order directional derivative (Hessian of G at v) Lorentzian for v > 0:
    # Hess G(v) = v1 Hx + v2 Hy; det = c20 v1^2 + c11 v1 v2 + c02 v2^2 must be < 0 on the open quadrant
    c20 = dx
    c02 = dy
    c11 = Hx[0][0] * Hy[1][1] + Hx[1][1] * Hy[0][0] - 2 * Hx[0][1] * Hy[0][1]
    neg_quadrant = c20 < 0 and c02 < 0 and (c11 <= 0 or c11 * c11 < 4 * c20 * c02)
    checks.append({'name': 'context definition: det Hess G(v) < 0 for every v in the open positive quadrant '
                           '(binary quadratic form in v decided exactly)', 'ok': neg_quadrant,
                   'detail': 'det Hess G(v) = %s v1^2 + %s v1 v2 + %s v2^2' % (c20, c11, c02)})
    return ok_pos and ok_bh and ok_lc and neg_quadrant


def decide(root, cert=None):
    if cert is None:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    checks = []
    results = {}
    try:
        a = [Fr(v) for v in cert.get('G_coefficients', TEX_COEFFS)]
        p = tuple(Fr(v) for v in cert['p'])
        q = tuple(Fr(v) for v in cert['q'])
        r = tuple(Fr(v) for v in cert['r'])
        assert len(a) == 4 and len(p) == len(q) == len(r) == 2
    except Exception as ex:
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [], 'why': 'malformed certificate: %r' % ex}
    claim = ('The cubic G = y^3 + 11/5 xy^2 + 3/2 x^2y + 1/10 x^3 is homogeneous and strictly Lorentzian, yet '
             'sqrt of its log-midpoint Jensen gap violates the triangle inequality at p=(35,2), q=(11/2,23/2), '
             'r=(1/500,15); via Shephard realization the same numbers refute the log-volume distance on convex bodies.')
    lor = lorentzian_checks(a, checks)
    inC = all(v > 0 for pt in (p, q, r) for v in pt)
    checks.append({'name': 'p, q, r lie in the open cone R_{>0}^2', 'ok': inC, 'detail': ''})
    Gv = [G(a, *pt) for pt in (p, q, r)]
    try:
        agree = [Fr(v) for v in cert['G_values']] == Gv
    except Exception:
        agree = False
    checks.append({'name': 'printed G(p), G(q), G(r) agree', 'ok': agree, 'detail': str([str(v) for v in Gv])})

    def R(u, v):
        m = ((u[0] + v[0]) / 2, (u[1] + v[1]) / 2)
        return G(a, *m) ** 2 / (G(a, *u) * G(a, *v))
    Rs = {'pq': R(p, q), 'qr': R(q, r), 'pr': R(p, r)}
    try:
        agree = all(Fr(cert['R_' + k]) == v for k, v in Rs.items())
    except Exception:
        agree = False
    checks.append({'name': 'printed R_pq, R_qr, R_pr agree exactly', 'ok': agree,
                   'detail': '; '.join('%s=%s' % kv for kv in Rs.items())})
    ge1 = all(v >= 1 for v in Rs.values())
    checks.append({'name': 'every R >= 1, so every Jensen gap J = (1/2) ln R >= 0 and d_G is real', 'ok': ge1,
                   'detail': ''})
    if not (ge1 and inC):
        results['lorentzian-jensen'] = 'REFUTED'
        results['log-volume-distance'] = 'REFUTED'
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'a needed fact failed',
                'results': results}
    enc = {}
    for k, v in Rs.items():
        lo, hi = ln_enclosure(v)
        Jlo, Jhi = lo / 2, hi / 2
        dlo, dhi = sqrt_enclosure(Jlo, Jhi)
        enc[k] = (Jlo, Jhi, dlo, dhi)
    Vlo = enc['pr'][2] - enc['pq'][3] - enc['qr'][3]
    Vhi = enc['pr'][3] - enc['pq'][2] - enc['qr'][2]
    viol = Vlo > 0
    checks.append({'name': 'triangle inequality violated: d_G(p,r) - d_G(p,q) - d_G(q,r) > 0 (rigorous enclosure)',
                   'ok': viol, 'detail': 'violation in [%s, %s]' % (dec(Vlo, 60), dec(Vhi, 60))})
    try:
        claimed = Fr(cert['violation_lower_exact'])
        c_ok = Vlo > claimed
        c_detail = 'claimed %s; decided %s' % (dec(claimed, 60), 'true' if c_ok else (
            'FALSE' if Vhi <= claimed else 'undecided at this precision'))
    except Exception:
        c_ok, c_detail = False, 'no readable claimed bound'
    checks.append({'name': "the certificate's stated lower bound on the violation holds", 'ok': c_ok,
                   'detail': c_detail})
    ok_printed_J = True
    det_J = []
    for k in ('pq', 'qr', 'pr'):
        try:
            pr_lo = Fr(cert['J_%s_lower' % k])
            good = pr_lo <= enc[k][0]      # printed lower bound below our certified lower bound
            ok_printed_J &= good
            det_J.append('J_%s in [%s, %s], printed lower %s' % (k, dec(enc[k][0], 52), dec(enc[k][1], 52),
                                                                  cert['J_%s_lower' % k]))
        except Exception:
            ok_printed_J = False
    checks.append({'name': 'printed J lower bounds are valid lower bounds', 'ok': ok_printed_J,
                   'detail': ' | '.join(det_J)})
    need_ok = all(c['ok'] for c in checks)
    results['lorentzian-jensen'] = 'CERTIFIED' if (need_ok and lor) else 'REFUTED'
    # -------- log-volume-distance: Steiner / Shephard reading
    W = [a[3], a[2] / 3, a[1] / 3, a[0]]     # Vol(xK+yL) = sum_i C(3,i) W_i x^(3-i) y^i
    steiner_ok = (W == [Fr(1, 10), Fr(1, 2), Fr(11, 15), Fr(1)] or 'G_coefficients' in cert)
    af = all(w > 0 for w in W) and W[1] ** 2 >= W[0] * W[2] and W[2] ** 2 >= W[1] * W[3]
    ch2 = [{'name': '(log-volume-distance) W = (1/10, 1/2, 11/15, 1) positive and Aleksandrov-Fenchel log-concave '
                    '(W1^2 >= W0 W2, W2^2 >= W1 W3, hence W1 W2 >= W0 W3)', 'ok': af and steiner_ok,
            'detail': 'W1^2=%s vs %s; W2^2=%s vs %s; W1W2=%s vs %s' % (
                W[1] ** 2, W[0] * W[2], W[2] ** 2, W[1] * W[3], W[1] * W[2], W[0] * W[3])},
           {'name': '(log-volume-distance) Minkowski linearity: d_Vol(A,B)^2 = J_G(p,q) etc. for A = p1 K + p2 L, ...',
            'ok': True, 'detail': 'algebraic: (A+B)/2 = ((p1+q1)/2)K + ((p2+q2)/2)L for convex K, L'},
           {'name': '(log-volume-distance) existence of convex K, L in R^3 with these mixed volumes', 'ok': False,
            'detail': "Shephard's realization theorem (1960, Thm 4) is cited; no explicit K, L is given, so the "
                      'existence is not re-derived here', 'side': True}]
    checks.extend(ch2)
    results['log-volume-distance'] = ('REFUSED' if (results['lorentzian-jensen'] == 'CERTIFIED' and af)
                                      else 'REFUTED')
    rank = {'CERTIFIED': 2, 'REFUSED': 1, 'REFUTED': 0}
    worst = min(results.values(), key=lambda v: rank[v])
    why = []
    if results['log-volume-distance'] == 'REFUSED':
        why.append('log-volume-distance: REFUSED -- the transfer to convex bodies needs bodies K, L in R^3 whose '
                   'Steiner polynomial is G; case.tex obtains them from Shephard\'s realization theorem (cited) and '
                   'exhibits none, so their existence is not re-derivable by exact computation. The AF '
                   'inequalities it needs do hold exactly.')
    if results['lorentzian-jensen'] != 'CERTIFIED':
        why.append('lorentzian-jensen: a needed fact failed')
    return {'verdict': worst, 'claim': claim, 'checks': checks, 'why': ' '.join(why), 'results': results}


def forge(cert):
    """q = (11/2, 23/2) -> (11/2, 13): one coordinate of the middle point moved by 3/2; the
    triangle inequality then HOLDS at the three points (violation < 0), so nothing to certify."""
    f = copy.deepcopy(cert)
    f['q'][1] = '13'
    return f


def forges(cert):
    out = [('q_2 23/2 -> 13 (triangle inequality holds)', forge(cert))]
    f = copy.deepcopy(cert)
    f['r'][1] = '14'
    out.append(('r_2 15 -> 14 (still violates, but every printed number is now wrong)', f))
    f = copy.deepcopy(cert)
    f['G_coefficients'] = ['1', '11/5', '3/2', '1/2']
    out.append(('G coefficient of x^3 1/10 -> 1/2 (no longer Lorentzian; printed values also move)', f))
    f = copy.deepcopy(cert)
    f['violation_lower_exact'] = '7156704176613847159228106087505875849130469/1000000000000000000000000000000000000000000000'
    out.append(('claimed lower bound raised by 2e-45 (above the true value ...1304686...)', f))
    return out


if __name__ == '__main__':
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as fh:
        cert = json.load(fh)
    r = decide(root, cert)
    print(CASE, '->', r['verdict'], r.get('results'))
    for c in r['checks']:
        print('  [%s]%s %s  %s' % ('ok' if c['ok'] else 'FAIL', ' (side)' if c.get('side') else '', c['name'],
                                   c['detail'][:400]))
    print('why:', r['why'])
    for name, fc in forges(cert):
        rf = decide(root, fc)
        print('FORGE (%s) -> %s %s' % (name, rf['verdict'], rf.get('results')))
        bad = [c['name'][:90] for c in rf['checks'] if not c['ok'] and not c.get('side')]
        print('     failed:', bad)
        assert rf.get('results', {}).get('lorentzian-jensen') != 'CERTIFIED'
