"""Independent exact decider: quantum-coupon-collector.

Claim (case.tex, Theorem thm:quantum-coupon-collector): Sra's conjecture
Q_n(X_1..X_n) = sum_{S nonempty} (-1)^{|S|-1} (sum_{i in S} X_i)^{-1} > 0 (Loewner) for all
SPD X_i fails at d=3, n=6: X_i = w_i u_i u_i^T + (1/100) I_3 with the tabulated (u_i, w_i),
and v = (4,1,3) gives -96 < v^T Q_6 v < -95.
Also carried (appendix Theorem thm:quantum-coupon-collector-trace): the trace consequence
fails at n=10: X_{t+1} = u_t u_t^T + (1/10000) I_3, u_t = (1,t,t^2), t=0..9, gives
-13901 < tr Q_10 < -13900.

Decided exactly (Fractions): every X_i and every subset sum X_S is SPD (leading principal
minors > 0), every inverse is exact (adjugate / determinant, and X_S X_S^{-1} = I checked),
the full alternating sum Q_6 as an exact rational matrix, v^T Q_6 v and its interval, the
exact inertia of Q_6 (characteristic polynomial + Descartes, exact for a symmetric matrix),
the commutator entries, and the whole n=10 trace sum with its interval and the triple
independence.  Ancillary (not needed for the refutation): the coefficient algebra of the
n <= 5 positivity theorem, and exact instances of its layer inequality and conclusion on
sub-tuples of the witness; the operator-convexity lemma itself is argued in prose there.

Standard library only; no float anywhere.
"""
import itertools
import json
import os
import sys
from fractions import Fraction

CASE = 'quantum-coupon-collector'


def F(x, d=None):
    return Fraction(x) if d is None else Fraction(x, d)


def zeros(n):
    return [[F(0)] * n for _ in range(n)]


def eye(n):
    return [[F(int(i == j)) for j in range(n)] for i in range(n)]


def madd(A, B, s=1):
    return [[A[i][j] + s * B[i][j] for j in range(len(A))] for i in range(len(A))]


def mscale(A, c):
    return [[c * x for x in r] for r in A]


def mm(A, B):
    n = len(A)
    return [[sum(A[i][k] * B[k][j] for k in range(n)) for j in range(n)] for i in range(n)]


def outer(u, w):
    return [[w * F(a) * F(b) for b in u] for a in u]


def det3(A):
    return (A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1])
            - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
            + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]))


def inv3(A):
    d = det3(A)
    if d == 0:
        raise ZeroDivisionError('singular')
    c = [[(A[(j + 1) % 3][(i + 1) % 3] * A[(j + 2) % 3][(i + 2) % 3]
           - A[(j + 1) % 3][(i + 2) % 3] * A[(j + 2) % 3][(i + 1) % 3]) for j in range(3)] for i in range(3)]
    # c[i][j] = cofactor C_{ji} = adj(A)[i][j]
    return [[c[i][j] / d for j in range(3)] for i in range(3)]


def spd3(A):
    """Symmetric and positive definite (Sylvester: leading minors > 0)."""
    sym = all(A[i][j] == A[j][i] for i in range(3) for j in range(3))
    m1 = A[0][0]
    m2 = A[0][0] * A[1][1] - A[0][1] * A[1][0]
    return sym and m1 > 0 and m2 > 0 and det3(A) > 0


def psd3(A):
    """Symmetric PSD iff all principal minors >= 0."""
    if not all(A[i][j] == A[j][i] for i in range(3) for j in range(3)):
        return False
    for k in (1, 2, 3):
        for S in itertools.combinations(range(3), k):
            sub = [[A[i][j] for j in S] for i in S]
            if k == 1:
                d = sub[0][0]
            elif k == 2:
                d = sub[0][0] * sub[1][1] - sub[0][1] * sub[1][0]
            else:
                d = det3(sub)
            if d < 0:
                return False
    return True


def inertia3(A):
    """Exact (n_pos, n_zero, n_neg) of a real symmetric 3x3 matrix from its
    characteristic polynomial x^3 - c1 x^2 + c2 x - c3 (all roots real, so Descartes'
    rule counts positive and negative roots exactly)."""
    c1 = A[0][0] + A[1][1] + A[2][2]
    c2 = (A[0][0] * A[1][1] - A[0][1] * A[1][0] + A[0][0] * A[2][2] - A[0][2] * A[2][0]
          + A[1][1] * A[2][2] - A[1][2] * A[2][1])
    c3 = det3(A)
    coeffs = [F(1), -c1, c2, -c3]            # p(x), highest first
    zero = 0
    while coeffs and coeffs[-1] == 0:          # factor out x^zero
        coeffs.pop()
        zero += 1

    def changes(cs):
        s = [c for c in cs if c != 0]
        return sum(1 for a, b in zip(s, s[1:]) if (a > 0) != (b > 0))
    pos = changes(coeffs)
    deg = len(coeffs) - 1
    neg = changes([c * (-1) ** (deg - i) for i, c in enumerate(coeffs)])
    return pos, zero, neg


def alternating(Xs, want_trace_only=False):
    """Exact Q = sum_{S != {}} (-1)^{|S|-1} X_S^{-1} (or its trace), with SPD and
    inverse checks on every X_S.  Returns (Q or trace, all_spd, all_inverse_ok, E layers)."""
    n = len(Xs)
    sums = {0: zeros(3)}
    Q = zeros(3)
    tr = F(0)
    all_spd = True
    inv_ok = True
    E = {k: zeros(3) for k in range(1, n + 1)}
    for mask in range(1, 1 << n):
        low = mask & -mask
        i = low.bit_length() - 1
        XS = madd(sums[mask ^ low], Xs[i])
        sums[mask] = XS
        if not spd3(XS):
            all_spd = False
        k = bin(mask).count('1')
        sgn = 1 if k % 2 == 1 else -1
        if want_trace_only:
            d = det3(XS)
            adjtr = (XS[1][1] * XS[2][2] - XS[1][2] * XS[2][1] + XS[0][0] * XS[2][2] - XS[0][2] * XS[2][0]
                     + XS[0][0] * XS[1][1] - XS[0][1] * XS[1][0])
            tr += sgn * adjtr / d
        else:
            Xi = inv3(XS)
            if mm(XS, Xi) != eye(3):
                inv_ok = False
            Q = madd(Q, Xi, sgn)
            E[k] = madd(E[k], Xi)
    return (tr if want_trace_only else Q), all_spd, inv_ok, E


def decide_from(cert):
    checks = []
    fail = []

    def add(name, ok, detail='', needed=True):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok and needed:
            fail.append(name)

    # ------------------------------------------------ Loewner witness, n = 6
    L = cert['loewner_n6']
    eps = F(L['epsilon'])
    Xs = [madd(outer(p['u'], F(p['weight'])), mscale(eye(3), eps)) for p in L['parameters']]
    add('n=6, d=3, epsilon=1/100 and the tabulated (u_i, w_i) of case.tex',
        len(Xs) == 6 and L['dimension'] == 3 and eps == F(1, 100) and
        [(p['u'], p['weight']) for p in L['parameters']] ==
        [([-1, 2, 1], 10), ([0, -3, 1], 10), ([-3, -2, 0], 100), ([2, -2, -2], 100), ([-1, 0, 2], 100), ([-1, 3, 0], 100)])
    add('every X_i is symmetric positive definite (Sylvester)', all(spd3(X) for X in Xs))
    comm = madd(mm(Xs[0], Xs[1]), mm(Xs[1], Xs[0]), -1)
    add('noncommuting: [X_1, X_2]_(1,2) = -1500', comm[0][1] == -1500, 'entry %s' % comm[0][1])
    Q, all_spd, inv_ok, E = alternating(Xs)
    add('all 63 subset sums X_S are SPD and each inverse satisfies X_S X_S^{-1} = I', all_spd and inv_ok)
    v = [F(x) for x in L['test_vector']]
    add('test vector is (4,1,3)', v == [4, 1, 3])
    qf = sum(v[i] * Q[i][j] * v[j] for i in range(3) for j in range(3))
    lo, hi = F(L['certified_interval'][0]), F(L['certified_interval'][1])
    add('v^T Q_6 v < 0 (so Q_6 is not PSD, a fortiori not PD)', qf < 0, 'v^T Q v = %s...' % _dec(qf))
    add('-96 < v^T Q_6 v < -95 (the certified interval)', lo == -96 and hi == -95 and lo < qf < hi)
    printed = F(int(L['quadratic_form']['numerator']), int(L['quadratic_form']['denominator']))
    add('printed quadratic form numerator/denominator agrees with the recomputation', printed == qf)
    inn = inertia3(Q)
    add('exact inertia of Q_6 (pos, zero, neg) has a negative eigenvalue', inn[2] >= 1,
        'inertia %s' % (inn,), needed=False)

    # ------------------------------------------------ ancillary: n <= 5 theorem
    disp = {2: {1: F(3, 4)}, 3: {1: F(1, 2), 3: F(1)}, 4: {1: F(1, 4), 3: F(13, 16)}, 5: {3: F(5, 8), 5: F(1)}}
    alg_ok = True
    for nn, want in disp.items():
        coef = {k: F((-1) ** (k - 1)) for k in range(1, nn + 1)}   # Q = sum (-1)^{k-1} E_k
        for k in range(1, nn, 2):                                   # replace -E_{k+1} by -c_k E_k
            if k + 1 <= nn:
                c = F(k * (nn - k), (k + 1) ** 2)
                coef[k] -= c
                coef[k + 1] = F(0)
        got = {k: c for k, c in coef.items() if c != 0}
        if got != want or any(c < 0 for c in coef.values()):
            alg_ok = False
    add('n<=5 theorem: layer coefficients k(n-k)/(k+1)^2 give the displayed bounds, all >= 0',
        alg_ok, 'Q2>=3/4E1, Q3>=1/2E1+E3, Q4>=1/4E1+13/16E3, Q5>=5/8E3+E5 (lemma: operator convexity, prose)',
        needed=False)
    layer_ok = all(psd3(madd(mscale(E[k], F(k * (6 - k), (k + 1) ** 2)), E[k + 1], -1)) for k in range(1, 6))
    add('layer inequality E_{k+1} <= k(n-k)/(k+1)^2 E_k holds exactly on the n=6 witness, k=1..5',
        layer_ok, 'instances of the lemma, not a proof of it', needed=False)
    sub_ok = True
    for r in range(1, 6):
        for S in itertools.combinations(range(6), r):
            Qs, _, _, _ = alternating([Xs[i] for i in S])
            if not spd3(Qs):
                sub_ok = False
    add('all 62 proper sub-tuples (n<=5) of the witness give Q_n positive definite (exact)',
        sub_ok, 'consistent with the n<=5 theorem on these instances', needed=False)

    # ------------------------------------------------ trace witness, n = 10
    Tt = cert.get('trace_n10')
    if Tt is not None:
        e10 = F(Tt['epsilon'])
        us = Tt['vectors']
        add('trace witness: n=10, epsilon=1/10000, u_t = (1,t,t^2) for t=0..9',
            e10 == F(1, 10000) and us == [[1, t, t * t] for t in range(10)] and Tt['dimension'] == 3)
        X10 = [madd(outer(u, F(1)), mscale(eye(3), e10)) for u in us]
        add('trace witness: every X_i SPD', all(spd3(X) for X in X10))
        indep = all(det3([list(map(F, us[a])), list(map(F, us[b])), list(map(F, us[c]))]) != 0
                    for a, b, c in itertools.combinations(range(10), 3))
        add('trace witness: every triple of u_t is linearly independent (120 determinants)', indep)
        cm = madd(mm(X10[0], X10[1]), mm(X10[1], X10[0]), -1)
        add('trace witness: noncommuting, [X_1, X_2]_(1,2) = 1', cm[0][1] == 1, 'entry %s' % cm[0][1])
        tr, spd10, _, _ = alternating(X10, want_trace_only=True)
        add('trace witness: all 1023 subset sums SPD', spd10)
        lo10, hi10 = F(Tt['certified_interval'][0]), F(Tt['certified_interval'][1])
        add('trace witness: -13901 < tr Q_10 < -13900', lo10 == -13901 and hi10 == -13900 and lo10 < tr < hi10,
            'tr Q_10 = %s...' % _dec(tr))
        pr10 = F(int(Tt['trace_inclusion_exclusion']['numerator']), int(Tt['trace_inclusion_exclusion']['denominator']))
        add('trace witness: printed numerator/denominator agrees', pr10 == tr)
        # 2n - (1/2) C(n,2) = n(9-n)/4 as a polynomial identity in n (checked at 4 points: degree 2)
        add('asymptotic coefficient identity 2n - C(n,2)/2 = n(9-n)/4 (degree-2 identity, 4 points)',
            all(2 * F(m) - F(m * (m - 1), 4) == F(m * (9 - m), 4) for m in range(4)), needed=False)

    claim = ('Six explicit 3x3 SPD matrices X_i = w_i u_i u_i^T + I/100 make the alternating inverse sum '
             'Q_6 = sum_S (-1)^{|S|-1} X_S^{-1} indefinite: v=(4,1,3) gives -96 < v^T Q_6 v < -95, so the '
             'conjecture Q_n > 0 fails at n=6 (and tr Q_10 < 0 for ten moment-curve matrices).')
    if fail:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'failed: ' + '; '.join(fail)}
    return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'why': ''}


def _dec(x, digits=9):
    """Display only: x truncated toward -inf to `digits` decimals, integer arithmetic."""
    s = x.numerator * 10 ** digits // x.denominator
    sign = '-' if s < 0 else ''
    s = abs(s)
    return '%s%d.%0*d' % (sign, s // 10 ** digits, digits, s % 10 ** digits)


def decide_cert(cert):
    """decide_from, with any failure to read or evaluate the certificate reported as
    REFUSED (never as CERTIFIED)."""
    try:
        return decide_from(cert)
    except Exception as e:  # noqa: BLE001
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [],
                'why': 'certificate could not be read or decided exactly: %s: %s' % (type(e).__name__, e)}


def decide(root):
    try:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    except Exception as e:  # noqa: BLE001
        return {'verdict': 'REFUSED', 'claim': '', 'checks': [], 'why': 'no readable certificate: %s' % e}
    return decide_cert(cert)


def forge(cert):
    """Smallest integer change of the test vector (L1 distance 1, then 2, ...) that makes
    v^T Q_6 v >= 0, with the printed numerator/denominator honestly recomputed and the
    claimed interval kept.  Must not be CERTIFIED."""
    c = json.loads(json.dumps(cert))
    L = c['loewner_n6']
    eps = F(L['epsilon'])
    Xs = [madd(outer(p['u'], F(p['weight'])), mscale(eye(3), eps)) for p in L['parameters']]
    Q, _, _, _ = alternating(Xs)
    v0 = L['test_vector']
    for dist in range(1, 6):
        for deltas in itertools.product(range(-dist, dist + 1), repeat=3):
            if sum(abs(d) for d in deltas) != dist:
                continue
            v = [a + d for a, d in zip(v0, deltas)]
            qf = sum(F(v[i]) * Q[i][j] * F(v[j]) for i in range(3) for j in range(3))
            if qf >= 0 and any(v):
                L['test_vector'] = v
                L['quadratic_form'] = {'numerator': str(qf.numerator), 'denominator': str(qf.denominator)}
                c['_forge_note'] = 'test vector %s -> %s (v^T Q v = %s...)' % (v0, v, _dec(qf))
                return c
    raise RuntimeError('no nearby nonnegative direction found')


def _default_root():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else _default_root()
    res = decide(root)
    print(CASE, '->', res['verdict'])
    print('claim:', res['claim'])
    for ch in res['checks']:
        print('  [%s] %s -- %s' % ('ok' if ch['ok'] else 'FAIL', ch['name'], ch['detail']))
    if res['why']:
        print('why:', res['why'])
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        cert = json.load(f)
    fc = forge(cert)
    fres = decide_cert(fc)
    print('forge (%s) ->' % fc['_forge_note'], fres['verdict'], '|', fres['why'])
    assert fres['verdict'] != 'CERTIFIED'
