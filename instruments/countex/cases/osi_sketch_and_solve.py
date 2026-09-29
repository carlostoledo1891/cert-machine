"""Independent exact decider: osi-sketch-and-solve.

Claim (case.tex, Theorem thm:osi-sketch-and-solve): the three-atom sketch
Omega in {I, B+, B-} with probabilities (1-2rho, rho, rho), rho = 1/100, is an
isotropic (E[Omega Omega^T] = I) oblivious subspace injection of dimension 1 with
injectivity 1 and failure probability rho (hence injectivity 1-eps for every eps in
(0,1)); yet for A = (1,0)^T, b = (0,1)^T the sketch-and-solve solution
x~ = (Omega^T A)^+ (Omega^T b) has squared residual 2 = 2 * OPT^2 with probability
2 rho = 1/50 > rho, so ||A x~ - b|| <= (1 + C eps) min ||A x - b|| cannot hold with the
OSI success probability once C eps <= 1/4.

Decided exactly (Fractions):
  * the atoms are a probability distribution; E[Omega Omega^T] = I entrywise
    (equivalently E||Omega^T x||^2 = ||x||^2 for every x -- a quadratic-form identity);
  * OSI with injectivity 1 on EVERY line, failure probability <= rho: for each atom,
    M_j = Omega_j Omega_j^T - I; atoms with M_j PSD (exact principal minors) never fail;
    for the remaining atoms a strictly positive combination sum c_j M_j = 0 is exhibited
    and verified, so on any v != 0 they cannot all fail at once -- a proof for all v;
    the worst failure probability is then at most the largest probability of any
    subfamily that CAN fail together (here: one of B+, B-);
  * sketch-and-solve per atom: pseudoinverse computed and the four Penrose equations
    verified exactly; residuals and ratios; the least-squares optimum from the normal
    equations with A full column rank;
  * the bad event: probability 1/50 > failure probability 1/100, and 2 > (5/4)^2.

Standard library only; no float anywhere.
"""
import itertools
import json
import os
import sys
from fractions import Fraction

CASE = 'osi-sketch-and-solve'


def F(x, d=1):
    return Fraction(x, d) if d != 1 else Fraction(x)


def mat(rows):
    return [[F(x) for x in r] for r in rows]


def T(A):
    return [list(r) for r in zip(*A)]


def mm(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def madd(A, B, s=1):
    return [[A[i][j] + s * B[i][j] for j in range(len(A[0]))] for i in range(len(A))]


def mscale(A, c):
    return [[c * x for x in r] for r in A]


def eye(n):
    return [[F(int(i == j)) for j in range(n)] for i in range(n)]


def det(A):
    """Exact determinant by fraction-exact Gaussian elimination."""
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


def is_psd(M):
    """Symmetric M is PSD iff every principal minor is >= 0 (exact)."""
    n = len(M)
    for k in range(1, n + 1):
        for S in itertools.combinations(range(n), k):
            if det([[M[i][j] for j in S] for i in S]) < 0:
                return False
    return True


def pinv_column(u):
    """Moore-Penrose pseudoinverse of a column vector u (n x 1)."""
    nn = sum(x[0] * x[0] for x in u)
    if nn == 0:
        return [[F(0)] * len(u)]
    return [[x[0] / nn for x in u]]


def penrose_ok(Aa, X):
    AX, XA = mm(Aa, X), mm(X, Aa)
    return (mm(AX, Aa) == Aa and mm(XA, X) == X and T(AX) == AX and T(XA) == XA)


def decide_from(cert):
    checks = []
    fail = []

    def add(name, ok, detail='', needed=True):
        checks.append({'name': name, 'ok': bool(ok), 'detail': detail})
        if not ok and needed:
            fail.append(name)

    atoms = [(mat(a['matrix']), F(a['probability'])) for a in cert['atoms']]
    n = len(atoms[0][0])
    rho = F(cert['rho'])
    probs = [p for _, p in atoms]
    add('probabilities are positive and sum to 1', all(p > 0 for p in probs) and sum(probs) == 1,
        'probabilities %s' % [str(p) for p in probs])
    add('atoms match the case (I, B+, B-) with probabilities (1-2rho, rho, rho), rho = 1/100',
        rho == F(1, 100) and [A for A, _ in atoms] == [eye(2), mat([[1, 0], [1, 0]]), mat([[1, 0], [-1, 0]])]
        and probs == [1 - 2 * rho, rho, rho], 'rho = %s' % rho)

    # isotropy
    E = [[F(0)] * n for _ in range(n)]
    for Om, p in atoms:
        E = madd(E, mscale(mm(Om, T(Om)), p))
    add('isotropy: E[Omega Omega^T] = I exactly (so E||Omega^T x||^2 = ||x||^2 for all x)', E == eye(n),
        'E = %s' % [[str(x) for x in r] for r in E])
    add('printed isotropy matrix agrees', mat(cert['isotropy']) == E)

    # OSI with injectivity alpha = 1 on every 1-dim subspace, failure probability <= rho
    Ms = [madd(mm(Om, T(Om)), eye(n), -1) for Om, _ in atoms]
    never = [j for j, M in enumerate(Ms) if is_psd(M)]
    risky = [j for j in range(len(atoms)) if j not in never]
    # a subfamily can fail together only if it admits no positive combination summing to 0.
    # Exhibit c_j > 0 with sum c_j M_j = 0 for the family of risky atoms, and for each
    # risky pair; then compute the worst failure probability from the maximal subfamilies
    # that are not so blocked.
    def blocked(S):
        # search small positive integer combinations (c in 1..3) with sum c_j M_j = 0
        for cs in itertools.product(range(1, 4), repeat=len(S)):
            Z = [[F(0)] * n for _ in range(n)]
            for c, j in zip(cs, S):
                Z = madd(Z, mscale(Ms[j], F(c)))
            if all(x == 0 for r in Z for x in r):
                return cs
        return None
    worst = F(0)
    detail = []
    blocked_sets = []
    for k in range(1, len(risky) + 1):
        for S in itertools.combinations(risky, k):
            if any(set(B) <= set(S) for B in blocked_sets):
                continue                      # contains a family that cannot fail together
            b = blocked(S) if k >= 2 else None
            if b is not None:
                blocked_sets.append(S)
                detail.append('atoms %s cannot fail together (%s combination of M_j = 0)' % (list(S), list(b)))
                continue
            # not proved impossible: count it (upper bound on failure probability)
            worst = max(worst, sum(probs[j] for j in S))
    add('OSI (1, 1, rho): on every line the injectivity-1 inequality fails with probability <= rho',
        worst <= rho,
        'never-failing atoms (M_j PSD): %s; %s; worst failure probability bound %s' % (never, '; '.join(detail), worst))
    add('printed injection success probability agrees (>= 1 - rho)',
        F(cert['injection_success_probability_at_least']) == 1 - rho and 1 - worst >= 1 - rho)
    # the identity behind it, as a polynomial identity in (x, y): (x+y)^2 + (x-y)^2 = 2(x^2+y^2)
    # (checked through the coefficient matrices: M_{B+} + M_{B-} = 0 above; restated here)
    add('quadratic-form identity: Omega_+Omega_+^T + Omega_-Omega_-^T = 2I',
        madd(mm(atoms[1][0], T(atoms[1][0])), mm(atoms[2][0], T(atoms[2][0]))) == mscale(eye(2), F(2)))

    # least squares problem
    Aa = mat([[1], [0]])
    bb = mat([[0], [1]])
    Ap = pinv_column(Aa)
    add('A full column rank (A^T A invertible)', det(mm(T(Aa), Aa)) != 0)
    xstar = mm(Ap, bb)
    r0 = madd(mm(Aa, xstar), bb, -1)
    opt2 = sum(x[0] ** 2 for x in r0)
    # optimality of x*: normal equations A^T (A x* - b) = 0 (convex quadratic: global min)
    add('unsketched optimum x* = A^+ b = 0 satisfies the normal equations; OPT^2 = 1',
        mm(T(Aa), r0) == [[0]] and xstar == [[0]] and opt2 == 1, 'OPT^2 = %s' % opt2)
    ratios = []
    for Om, p in atoms:
        SA, Sb = mm(T(Om), Aa), mm(T(Om), bb)
        X = pinv_column(SA)
        pen = penrose_ok(SA, X)
        xt = mm(X, Sb)
        res = madd(mm(Aa, xt), bb, -1)
        r2 = sum(x[0] ** 2 for x in res)
        ratios.append(r2 / opt2)
        add('atom p=%s: pseudoinverse satisfies the 4 Penrose equations; x~ = %s; squared residual %s'
            % (p, xt[0][0], r2), pen)
    add('printed squared residual ratios agree', [F(x) for x in cert['squared_residual_ratios']] == ratios,
        'recomputed %s' % [str(x) for x in ratios])
    # bad event: ratio^2 = 2 on the two non-identity atoms
    bad = sum(p for (Om, p), r in zip(atoms, ratios) if r >= 2)
    add('bad event (squared residual ratio >= 2) has probability 1/50 > rho',
        bad == F(1, 50) and bad > rho and F(cert['bad_probability']) == bad, 'P(bad) = %s' % bad)
    # asymptotic: any C, eps with C eps <= 1/4 gives (1 + C eps)^2 <= 25/16 < 2
    add('sqrt2 > 5/4 >= 1 + C eps, decided on squares: 2 > 25/16', F(2) > F(25, 16))
    claim = ('A 3-atom isotropic sketch on R^2 that is a (1,1,1/100) oblivious subspace injection makes '
             'sketch-and-solve for A=(1,0)^T, b=(0,1)^T return residual sqrt(2)*OPT with probability '
             '1/50 > 1/100, so no (1+O(eps)) relative-error guarantee holds at the OSI success probability.')
    if fail:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'failed: ' + '; '.join(fail)}
    return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks,
            'why': '', 'scope': 'the probabilistic reading (the relative-error event should hold with at '
                                'least the OSI success probability 1-delta) is the case.tex interpretation '
                                'of the source problem; everything else is decided exactly.'}


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
    """Shift 1/10000 of probability from the identity atom to B+ (probabilities
    still sum to 1): E[Omega Omega^T] gets off-diagonal 1/10000, so isotropy fails
    and Omega is no longer an OSI in the source's sense.  Must not be CERTIFIED."""
    c = json.loads(json.dumps(cert))
    c['atoms'][0]['probability'] = str(F(c['atoms'][0]['probability']) - F(1, 10000))
    c['atoms'][1]['probability'] = str(F(c['atoms'][1]['probability']) + F(1, 10000))
    return c


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
    fres = decide_cert(forge(cert))
    print('forge ->', fres['verdict'], '|', fres['why'])
    assert fres['verdict'] != 'CERTIFIED'
