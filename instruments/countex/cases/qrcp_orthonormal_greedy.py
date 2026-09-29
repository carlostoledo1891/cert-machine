"""Independent exact decider: qrcp-orthonormal-greedy.

Claim (case.tex, Theorem thm:qrcp-orthonormal-greedy): for n=8, k=3 and
Q = V H^{-1/2}, V = [I_3; W], H = V^T V (Q^T Q = I_3), exact Businger-Golub QRCP on
Q^T makes three STRICT pivot choices I = (1,2,3), and ||Q(I,:)^{-1}||_2 > sqrt(k(n-k+1))
= sqrt(18), violating the bound quoted in Problem 4.3.

Everything that matters depends only on the projector P = Q Q^T = V H^{-1} V^T, which
is rational; H^{-1/2} (irrational) is never needed:
  * QRCP on Q^T picks, at each step, the column (= row q_i of Q) with the largest
    squared residual after projection off the chosen ones; with Gram matrix
    (q_i . q_j) = P this residual is the Schur complement P_ii - P_iS P_SS^{-1} P_Si.
  * ||Q(I,:)^{-1}||_2^2 = lambda_max((Q_I Q_I^T)^{-1}) = lambda_max(P_II^{-1}), which is
    invariant under Q -> Q U for orthogonal U (any orthonormal basis of the same
    column space).
  * lambda_max(M) > 18 for symmetric M  <=>  18 I - M is not PSD  <=>  some principal
    minor of 18 I - M is negative (decided exactly), plus the certificate's Rayleigh
    vector checked separately.
  * P is certified to be an orthogonal projector of rank 3 (symmetric, P^2 = P,
    trace 3), so an 8x3 Q with orthonormal columns and Q Q^T = P exists.

Standard library only; no float anywhere.
"""
import itertools
import json
import os
import sys
from fractions import Fraction

CASE = 'qrcp-orthonormal-greedy'


def F(x):
    return Fraction(x)


def mat(rows):
    return [[F(x) for x in r] for r in rows]


def T(A):
    return [list(r) for r in zip(*A)]


def mm(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def eye(n):
    return [[F(int(i == j)) for j in range(n)] for i in range(n)]


def det(A):
    A = [list(r) for r in A]
    n = len(A)
    d = F(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None:
            return F(0)
        if p != c:
            A[c], A[p] = A[p], A[c]
            d = -d
        d *= A[c][c]
        for r in range(c + 1, n):
            f = A[r][c] / A[c][c]
            for k in range(c, n):
                A[r][k] -= f * A[c][k]
    return d


def inv(A):
    """Exact inverse by Gauss-Jordan; raises on a singular matrix."""
    n = len(A)
    M = [list(A[i]) + [F(int(i == j)) for j in range(n)] for i in range(n)]
    for c in range(n):
        p = next((r for r in range(c, n) if M[r][c] != 0), None)
        if p is None:
            raise ZeroDivisionError('singular')
        M[c], M[p] = M[p], M[c]
        pv = M[c][c]
        M[c] = [x / pv for x in M[c]]
        for r in range(n):
            if r != c and M[r][c] != 0:
                f = M[r][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [row[n:] for row in M]


def principal_minors(M):
    n = len(M)
    for k in range(1, n + 1):
        for S in itertools.combinations(range(n), k):
            yield S, det([[M[i][j] for j in S] for i in S])


def residual(P, S, i):
    """Squared residual of index i after projection off the indices S (Schur complement)."""
    if not S:
        return P[i][i]
    PSS = [[P[a][b] for b in S] for a in S]
    PiS = [P[i][a] for a in S]
    X = inv(PSS)
    return P[i][i] - sum(PiS[a] * X[a][b] * PiS[b] for a in range(len(S)) for b in range(len(S)))


def projector_from_W(W):
    k = len(W[0])
    V = eye(k) + [list(r) for r in W]
    H = mm(T(V), V)
    P = mm(mm(V, inv(H)), T(V))
    return V, H, P


def qrcp_path(P, k):
    """Exact greedy path; returns list of steps with pivot, residual, runner-up and
    whether the choice is strict."""
    n = len(P)
    S = []
    steps = []
    for _ in range(k):
        res = {i: residual(P, S, i) for i in range(n) if i not in S}
        best = max(res.values())
        winners = [i for i, v in res.items() if v == best]
        piv = winners[0]
        runner = max(v for i, v in res.items() if i != piv)
        steps.append({'S': list(S), 'pivot': piv, 'res': res, 'best': best, 'runner': runner,
                      'strict': len(winners) == 1})
        S.append(piv)
    return steps


def decide_from(cert):
    checks = []
    fail = []

    def add(name, ok, detail='', needed=True):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok and needed:
            fail.append(name)

    n, k = int(cert['n']), int(cert['k'])
    W = mat(cert['W'])
    add('shapes: W is (n-k) x k = 5 x 3', len(W) == n - k and all(len(r) == k for r in W))
    V, H, P = projector_from_W(W)
    add('printed V = [I_3; W]', mat(cert['V']) == V)
    # H positive definite (Sylvester: leading principal minors > 0)
    lead = [det([r[:j] for r in H[:j]]) for j in range(1, k + 1)]
    add('H = I + W^T W positive definite (leading minors > 0)', all(x > 0 for x in lead),
        'leading minors %s' % [str(x) for x in lead])
    add('printed P agrees with V H^{-1} V^T', mat(cert['P']) == P)
    add('P is an orthogonal projector of rank 3 (P = P^T, P^2 = P, tr P = 3)',
        P == T(P) and mm(P, P) == P and sum(P[i][i] for i in range(n)) == k)

    # QRCP path, exact
    steps = qrcp_path(P, k)
    path = [s['pivot'] + 1 for s in steps]
    claimed = [int(x) for x in cert['pivot_sequence_one_based']]
    add('exact QRCP pivot path equals the claimed I = %s' % claimed, path == claimed, 'recomputed %s' % path)
    for st, pc in zip(steps, cert['pivot_steps']):
        gap = st['best'] - st['runner']
        add('step S=%s: pivot %d is the STRICT maximum (gap %s > 0)' % ([x + 1 for x in st['S']], st['pivot'] + 1, gap),
            st['strict'] and gap > 0)
        add('step S=%s: printed pivot residual, runner-up and gap agree' % [x + 1 for x in st['S']],
            [int(x) for x in pc['selected_before']] == [x + 1 for x in st['S']] and int(pc['pivot']) == st['pivot'] + 1
            and F(pc['pivot_residual']) == st['best'] and F(pc['runner_up_residual']) == st['runner']
            and F(pc['strict_gap']) == gap,
            'recomputed residual %s, runner-up %s' % (st['best'], st['runner']))

    # the conditioning claim
    I = [x - 1 for x in claimed]
    PII = [[P[a][b] for b in I] for a in I]
    M = inv(PII)                                  # = (Q_I Q_I^T)^{-1}
    bound2 = F(k * (n - k + 1))
    add('k(n-k+1) = 18 = printed claimed_bound_squared', bound2 == F(cert['claimed_bound_squared']) == 18)
    add('P_II^{-1} = H (so Q(I,:) = H^{-1/2} up to an orthogonal factor)', M == H)
    neg = [(S, dv) for S, dv in principal_minors([[bound2 * (i == j) - M[i][j] for j in range(k)] for i in range(k)])
           if dv < 0]
    add('lambda_max(P_II^{-1}) > 18 decided exactly: a principal minor of 18I - P_II^{-1} is negative',
        bool(neg), 'negative minors on index sets %s' % [tuple(i + 1 for i in S) for S, _ in neg])
    x = [F(v) for v in cert['rayleigh_vector']]
    Wx = [sum(W[r][c] * x[c] for c in range(k)) for r in range(n - k)]
    gap17 = sum(v * v for v in Wx) - 17 * sum(v * v for v in x)
    xMx = sum(x[i] * M[i][j] * x[j] for i in range(k) for j in range(k))
    add('Rayleigh certificate: x=%s gives x^T H x - 18 x^T x = ||Wx||^2 - 17||x||^2 = %s > 0' %
        ([str(v) for v in x], gap17), gap17 > 0 and xMx - bound2 * sum(v * v for v in x) == gap17)
    add('printed rayleigh_gap_over_17 agrees', F(cert['rayleigh_gap_over_17']) == gap17)

    claim = ('For the rank-3 orthogonal projector P = V H^{-1} V^T on R^8 (V = [I_3; W], W rational), exact '
             'QRCP on Q^T (any Q with QQ^T = P) makes three strict pivots I = (1,2,3), and '
             '||Q(I,:)^{-1}||_2^2 = lambda_max(H) > 18 = k(n-k+1).')
    if fail:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'failed: ' + '; '.join(fail)}
    return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'why': '',
            'scope': 'refutes the displayed bound sqrt(k(n-k+1)) for QRCP; says nothing about a looser '
                     '"similar" bound (as case.tex itself notes).'}


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


def _reprint(cert, W):
    """An honest certificate for witness W that keeps the CLAIMS (pivot sequence,
    Rayleigh vector, bound) and recomputes every printed number."""
    c = json.loads(json.dumps(cert))
    V, H, P = projector_from_W(W)
    k = len(W[0])
    c['W'] = [[str(v) for v in r] for r in W]
    c['V'] = [[str(v) for v in r] for r in V]
    c['P'] = [[str(v) for v in r] for r in P]
    claimed = [int(x) - 1 for x in c['pivot_sequence_one_based']]
    steps = []
    for j, piv in enumerate(claimed):
        S = claimed[:j]
        res = {i: residual(P, S, i) for i in range(len(P)) if i not in S}
        runner = max(v for i, v in res.items() if i != piv)
        steps.append({'pivot': piv + 1, 'pivot_residual': str(res[piv]), 'runner_up_residual': str(runner),
                      'selected_before': [s + 1 for s in S], 'strict_gap': str(res[piv] - runner)})
    c['pivot_steps'] = steps
    x = [F(v) for v in c['rayleigh_vector']]
    Wx = [sum(W[r][cc] * x[cc] for cc in range(k)) for r in range(len(W))]
    c['rayleigh_gap_over_17'] = str(sum(v * v for v in Wx) - 17 * sum(v * v for v in x))
    return c


def forge(cert, max_steps=400):
    """Smallest single-entry change of W on the certificate's own 1/1000 grid that
    breaks the claim, with every printed number honestly recomputed (so only the
    mathematics can fail).  Must not be CERTIFIED."""
    W0 = mat(cert['W'])
    for s in range(1, max_steps + 1):
        for r in range(len(W0)):
            for cidx in range(len(W0[0])):
                for sign in (1, -1):
                    W = [list(row) for row in W0]
                    W[r][cidx] += sign * F(s) / 1000
                    c = _reprint(cert, W)
                    if decide_from(c)['verdict'] != 'CERTIFIED':
                        c['_forge_note'] = 'W[%d][%d] %+d/1000' % (r, cidx, sign * s)
                        return c
    raise RuntimeError('no breaking perturbation found within the search')


def _default_root():
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)


if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else _default_root()
    res = decide(root)
    print(CASE, '->', res['verdict'])
    print('claim:', res['claim'])
    for c in res['checks']:
        print('  [%s] %s -- %s' % ('ok' if c['ok'] else 'FAIL', c['name'], c['detail']))
    if res['why']:
        print('why:', res['why'])
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        cert = json.load(f)
    fc = forge(cert)
    fres = decide_cert(fc)
    print('forge (%s) ->' % fc['_forge_note'], fres['verdict'], '|', fres['why'])
    assert fres['verdict'] != 'CERTIFIED'
