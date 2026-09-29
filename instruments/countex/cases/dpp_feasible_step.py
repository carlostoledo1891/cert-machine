"""Independent exact decider for counterexamples/dpp-feasible-step (Mariet--Sra).
Python 3 standard library only; all arithmetic in fractions.Fraction.  Written from
case.tex before reading verify.py.

Claim: ground set {1,2}, observations {1},{2},{1,2}; for the rational PD kernel L0,
the Picard step L1 = L0 + a L0 Delta(L0) L0 with a = 5 keeps L1 positive definite
(feasible) and strictly lowers phi(L) = (1/3)(log L11 + log L22 + log det L) - log det(I+L).

phi(L1) < phi(L0)  <=>  L1_11 L1_22 det L1 / (L0_11 L0_22 det L0) < (det(I+L1)/det(I+L0))^3,
because exp and t -> t^3 are strictly increasing and every quantity is positive: a
comparison of two rationals, decided exactly.

case.tex gives TWO meanings of "feasible": the context says a step is feasible when it
keeps the iterate PD; the statement block says "feasibility is the bound a <= 1/(1-gamma)
of Prop. A.1", gamma = max{lambda_min(L Z), 1/lambda_max(I+L)}.  Z is not defined in
case.tex; we take Z = (1/n) sum_i U_i (U_i^* L U_i)^{-1} U_i^* (the first term of Delta),
for which that bound is exactly the sufficient PD condition one derives.  Both are decided.
"""
import json
import os
import copy
from fractions import Fraction as Fr

CASE = 'dpp-feasible-step'
I2 = [[Fr(1), Fr(0)], [Fr(0), Fr(1)]]


def mul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(2)) for j in range(2)] for i in range(2)]


def add(A, B, s=1):
    return [[A[i][j] + s * B[i][j] for j in range(2)] for i in range(2)]


def sc(c, A):
    return [[c * x for x in r] for r in A]


def det(A):
    return A[0][0] * A[1][1] - A[0][1] * A[1][0]


def inv(A):
    d = det(A)
    return [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]]


def sym_pd(A):
    return A[0][1] == A[1][0] and A[0][0] > 0 and det(A) > 0   # Sylvester, 2x2


def Zterm(L):
    # (1/3)[U_1 (L_11)^-1 U_1^* + U_2 (L_22)^-1 U_2^* + L^-1]
    return sc(Fr(1, 3), add(add([[1 / L[0][0], Fr(0)], [Fr(0), Fr(0)]],
                                [[Fr(0), Fr(0)], [Fr(0), 1 / L[1][1]]]), inv(L)))


def Delta(L):
    return add(Zterm(L), inv(add(I2, L)), -1)


def step(L, a):
    return add(L, sc(a, mul(mul(L, Delta(L)), L)))


def sides(L0, L1):
    left = (L1[0][0] * L1[1][1] * det(L1)) / (L0[0][0] * L0[1][1] * det(L0))
    right = (det(add(I2, L1)) / det(add(I2, L0))) ** 3
    return left, right


def lam_min_bracket(M, iters=60):
    """Rational bracket of the smaller eigenvalue of a 2x2 matrix with real eigenvalues."""
    t, d = M[0][0] + M[1][1], det(M)
    disc = t * t - 4 * d
    assert disc >= 0
    p = lambda x: x * x - t * x + d
    lo, hi = t / 2 - (abs(t) + abs(d) + 1), t / 2    # p(lo) > 0, p(hi) <= 0
    for _ in range(iters):
        mid = (lo + hi) / 2
        if p(mid) > 0:
            lo = mid
        else:
            hi = mid
    return lo, hi


def parse_a(s):
    s = str(s).strip()
    if s.startswith('a='):
        s = s[2:]
    return Fr(s)


def decide(root, cert=None):
    if cert is None:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    claim = ('For observations {1},{2},{1,2} and the rational PD kernel L0, the Picard step with a = 5 keeps the '
             'kernel positive definite yet strictly lowers the DPP log-likelihood, refuting ascent for every '
             'feasible a >= 1.')
    checks = []
    try:
        L0 = [[Fr(x) for x in row] for row in cert['L0']]
        L1p = [[Fr(x) for x in row] for row in cert['L1']]
        a = parse_a(cert['step'])
    except Exception as ex:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': [], 'why': 'malformed certificate: %r' % ex}
    tex = [[Fr(337200647, 10 ** 8), Fr(262325460, 10 ** 8)], [Fr(262325460, 10 ** 8), Fr(607953037, 10 ** 8)]]
    checks.append({'name': 'L0 equals the decimals printed in case.tex read as exact rationals /10^8',
                   'ok': L0 == tex, 'detail': str(L0), 'side': True})
    checks.append({'name': 'L0 symmetric positive definite', 'ok': sym_pd(L0),
                   'detail': 'L0_11=%s det=%s' % (L0[0][0], det(L0))})
    checks.append({'name': 'step size a >= 1', 'ok': a >= 1, 'detail': 'a = %s' % a})
    if not sym_pd(L0):
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'L0 not PD'}
    L1 = step(L0, a)
    checks.append({'name': 'L1 = L0 + a L0 Delta(L0) L0 recomputed exactly equals the certificate L1',
                   'ok': L1 == L1p, 'detail': ''})
    checks.append({'name': 'feasible (context definition): L1 symmetric positive definite', 'ok': sym_pd(L1),
                   'detail': 'L1_11=%s... det L1 ~ %s' % (str(L1[0][0])[:30], _dec(det(L1)))})
    left, right = (sides(L0, L1) if sym_pd(L1) else (None, None))
    if left is not None:
        desc = left < right
        checks.append({'name': 'phi(L1) < phi(L0): L1_11 L1_22 detL1/(L0_11 L0_22 detL0) < (det(I+L1)/det(I+L0))^3',
                       'ok': desc, 'detail': 'left ~ %s, right ~ %s, right-left ~ %s' % (
                           _dec(left), _dec(right), _dec(right - left))})
        try:
            agree = (Fr(cert['left']) == left and Fr(cert['right']) == right and Fr(cert['gap']) == right - left)
        except Exception:
            agree = False
        checks.append({'name': 'printed left, right, gap agree exactly', 'ok': agree, 'detail': ''})
    # Reading B: the Prop A.1 bound a <= 1/(1-gamma)
    LZ = mul(L0, Zterm(L0))
    lo, hi = lam_min_bracket(LZ)
    Lmax_lo, _ = lam_min_bracket(sc(-1, add(I2, L0)))   # -lambda_max(I+L) bracket
    lmaxIL_hi, lmaxIL_lo = -Lmax_lo, -_                  # lambda_max(I+L) in [lmaxIL_lo, lmaxIL_hi]
    g_lo = max(lo, 1 / lmaxIL_hi)
    g_hi = max(hi, 1 / lmaxIL_lo)
    # exact decision of a <= 1/(1-gamma)  <=>  gamma >= 1 - 1/a (gamma < 1 here)
    c = 1 - 1 / a
    M = add(LZ, sc(c, I2), -1)
    lzmin_ge_c = (M[0][0] + M[1][1] >= 0) and det(M) >= 0
    Mx = add(sc(1 / c - 1, I2), L0, -1) if c > 0 else None   # 1/lambda_max(I+L) >= c <=> L <= (1/c - 1) I
    lmax_ok = (Mx is not None and Mx[0][0] >= 0 and Mx[1][1] >= 0 and det(Mx) >= 0)
    inB = lzmin_ge_c or lmax_ok
    checks.append({'name': "reading B (statement block: feasibility = Prop. A.1 bound a <= 1/(1-gamma)): "
                           "is a = %s within the bound?" % a,
                   'ok': inB, 'side': True,
                   'detail': 'gamma = lambda_min(L0 Z) in [%s, %s] (1/lambda_max(I+L0) ~ %s), bound 1/(1-gamma) in '
                             '[%s, %s]; decided exactly: a %s bound' % (
                                 _dec(lo), _dec(hi), _dec(1 / lmaxIL_hi), _dec(1 / (1 - g_lo)), _dec(1 / (1 - g_hi)),
                                 '<=' if inB else '>')})
    # exact PD range of the step for this L0: I + a L^{1/2} Delta L^{1/2} > 0 <=> a < -1/lambda_min(L Delta)
    need = [ch for ch in checks if not ch.get('side')]
    allok = all(ch['ok'] for ch in need)
    out = {'verdict': 'CERTIFIED' if allok else 'REFUTED', 'claim': claim, 'checks': checks,
           'why': '' if allok else 'failed: ' + '; '.join(ch['name'] for ch in need if not ch['ok'])}
    out['reading_B'] = ('CERTIFIED' if (allok and inB) else ('REFUTED' if allok else out['verdict']))
    if allok and not inB:
        out['caveat'] = ('Certified for "feasible = keeps L positive definite" (case.tex context). Under the statement '
                         'block\'s gloss "feasibility is the bound a <= 1/(1-gamma) of Prop. A.1" the witness does '
                         'not qualify: a = 5 exceeds 1/(1-gamma) ~ 1.8995, so under that reading the hypothesis the '
                         'counterexample needs is false.')
    return out


def _dec(x, k=12):
    """Display only (never used for a decision): x rounded toward zero to k decimals."""
    x = Fr(x)
    s = '-' if x < 0 else ''
    x = abs(x)
    ip = x.numerator // x.denominator
    fp = (x - ip) * 10 ** k
    return '%s%d.%0*d' % (s, ip, k, fp.numerator // fp.denominator)


def _recompute(cert, a):
    f = copy.deepcopy(cert)
    L0 = [[Fr(x) for x in row] for row in f['L0']]
    L1 = step(L0, a)
    f['step'] = 'a=%s' % a
    f['L1'] = [[str(x) for x in row] for row in L1]
    if sym_pd(L1):
        l, r = sides(L0, L1)
        f['left'], f['right'], f['gap'] = str(l), str(r), str(r - l)
    return f


def forge(cert):
    """Step size 5 -> 4 with L1 and the printed sides recomputed consistently: still PD, but ascends."""
    return _recompute(cert, Fr(4))


def forges(cert):
    out = [('a = 5 -> 4, everything recomputed consistently', forge(cert)),
           ('a = 5 -> 6, recomputed (L1 no longer PD)', _recompute(cert, Fr(6)))]
    f = copy.deepcopy(cert)
    f['L0'][0][0] = '337200648/100000000'
    out.append(('L0_11 moved by 1e-8, printed L1 kept', f))
    return out


if __name__ == '__main__':
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as fh:
        cert = json.load(fh)
    r = decide(root, cert)
    print(CASE, '->', r['verdict'], '| reading B:', r.get('reading_B'))
    for ch in r['checks']:
        print('  [%s]%s %s  %s' % ('ok' if ch['ok'] else 'FAIL', ' (side)' if ch.get('side') else '', ch['name'],
                                   ch['detail'][:260]))
    print('why:', r['why'])
    print('caveat:', r.get('caveat', ''))
    # sampled step sizes inside the Prop A.1 range, exact
    L0 = [[Fr(x) for x in row] for row in cert['L0']]
    for a in (Fr(1), Fr(3, 2), Fr(9, 5), Fr(1899, 1000)):
        L1 = step(L0, a)
        l, rr = sides(L0, L1)
        print('  a=%s: PD=%s, descends=%s' % (a, sym_pd(L1), l < rr))
    for name, fc in forges(cert):
        rf = decide(root, fc)
        print('FORGE (%s) -> %s   %s' % (name, rf['verdict'], rf['why'][:200]))
        assert rf['verdict'] != 'CERTIFIED'
