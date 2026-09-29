"""Independent exact decider for counterexamples/hamiltonian-nepv-identity (Amsel et al. S6.2).
Python 3 standard library only; exact rationals.  Written from case.tex before reading verify.py.

Definitions (case.tex context): F_i, G_ij, K_ij Hermitian with norm <= 1, x_i nonzero in C^n;
  H = sum_i ( F_i^<i> + sum_j G_ij^<i> K_ij^<j> ),  M^<i> = I x ... x M (slot i) x ... x I;
  f = (x_1 x...x x_d)^H H (x_1 x...x x_d) / prod_j x_j^H x_j;
  A_i = (sum_j x_j^H x_j / x_i^H x_i) (F_i + sum_j G_ij x_j^H K_ij x_j / x_j^H x_j);
  asserted: z^H A(z) z / z^H z = f with z = (x_1; ...; x_d).
The certificate's entries are real rationals, so ^H is transpose here; a certificate with
non-rational (e.g. complex) entries is REFUSED rather than guessed at.
"""
import json
import os
import copy
import itertools
from fractions import Fraction as Fr

CASE = 'hamiltonian-nepv-identity'


def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(len(B))) for j in range(len(B[0]))] for i in range(len(A))]


def kron(A, B):
    return [[A[i][j] * B[k][l] for j in range(len(A[0])) for l in range(len(B[0]))]
            for i in range(len(A)) for k in range(len(B))]


def eye(n):
    return [[Fr(int(i == j)) for j in range(n)] for i in range(n)]


def madd(A, B, s=1):
    return [[A[i][j] + s * B[i][j] for j in range(len(A[0]))] for i in range(len(A))]


def det(M):
    n = len(M)
    A = [list(r) for r in M]
    s = Fr(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None:
            return Fr(0)
        if p != c:
            A[c], A[p] = A[p], A[c]
            s = -s
        s *= A[c][c]
        for r in range(c + 1, n):
            f = A[r][c] / A[c][c]
            A[r] = [a - f * b for a, b in zip(A[r], A[c])]
    return s


def psd(M):
    """Real symmetric PSD <=> every principal minor >= 0 (exact)."""
    n = len(M)
    for k in range(1, n + 1):
        for S in itertools.combinations(range(n), k):
            if det([[M[i][j] for j in S] for i in S]) < 0:
                return False
    return True


def hermitian_norm_le_1(M):
    n = len(M)
    sym = all(M[i][j] == M[j][i] for i in range(n) for j in range(n))
    return sym and psd(madd(eye(n), M, -1)) and psd(madd(eye(n), M, 1))


def slot(M, i, d, n):
    out = [[Fr(1)]]
    for k in range(d):
        out = kron(out, M if k == i else eye(n))
    return out


def quad(x, M, y):
    return sum(x[i] * M[i][j] * y[j] for i in range(len(x)) for j in range(len(y)))


def parse_mat(m):
    return [[Fr(v) for v in row] for row in m]


def decide(root, cert=None):
    if cert is None:
        with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
            cert = json.load(f)
    claim = ('For n=2, d=1, Hermitian F_1=0, G_11=diag(1,0), K_11=diag(0,-1) of norm <= 1 and x_1=(1,2), the product-'
             'state objective f(x_1) and the Rayleigh quotient of the proposed NEPv matrix A(z) differ (0 vs -4/25), '
             'so the identity asserted after eq. (20) is false.')
    checks = []
    try:
        n, d = int(cert['n']), int(cert['d'])
        F = [parse_mat(cert['F_%d' % (i + 1)]) for i in range(d)]
        G = {(i, j): parse_mat(cert['G_%d_%d' % (i + 1, j + 1)]) for i in range(d) for j in range(d)}
        K = {(i, j): parse_mat(cert['K_%d_%d' % (i + 1, j + 1)]) for i in range(d) for j in range(d)}
        X = [[Fr(v) for v in cert['x_%d' % (i + 1)]] for i in range(d)]
    except Exception as ex:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': [],
                'why': 'certificate not readable as real rational data (complex entries are not handled): %r' % ex}
    shapes = (n >= 1 and d >= 1 and all(len(M) == n and all(len(r) == n for r in M)
                                        for M in F + list(G.values()) + list(K.values()))
              and all(len(x) == n for x in X))
    checks.append({'name': 'dimensions: n x n matrices, x_i in Q^n, d >= 1', 'ok': shapes, 'detail': 'n=%d d=%d' % (n, d)})
    if not shapes:
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks, 'why': 'shape mismatch'}
    hyp = all(hermitian_norm_le_1(M) for M in F + list(G.values()) + list(K.values()))
    checks.append({'name': 'every F_i, G_ij, K_ij Hermitian with norm <= 1 (I-M and I+M PSD via all principal minors)',
                   'ok': hyp, 'detail': ''})
    nz = all(any(v != 0 for v in x) for x in X)
    checks.append({'name': 'every x_i nonzero', 'ok': nz, 'detail': str(X)})
    N = n ** d
    H = [[Fr(0)] * N for _ in range(N)]
    for i in range(d):
        H = madd(H, slot(F[i], i, d, n))
        for j in range(d):
            H = madd(H, matmul(slot(G[(i, j)], i, d, n), slot(K[(i, j)], j, d, n)))
    Hh = all(H[a][b] == H[b][a] for a in range(N) for b in range(N))
    checks.append({'name': 'H is Hermitian', 'ok': Hh, 'detail': 'H = %s' % H, 'side': True})
    prod = [Fr(1)]
    for x in X:
        prod = [p * v for p in prod for v in x]
    nrm = [sum(v * v for v in x) for x in X]
    pn = Fr(1)
    for s in nrm:
        pn *= s
    f = quad(prod, H, prod) / pn
    tot = sum(nrm)
    A = []
    for i in range(d):
        B = [list(r) for r in F[i]]
        for j in range(d):
            B = madd(B, [[v * (quad(X[j], K[(i, j)], X[j]) / nrm[j]) for v in row] for row in G[(i, j)]])
        A.append([[v * (tot / nrm[i]) for v in row] for row in B])
    rq = sum(quad(X[i], A[i], X[i]) for i in range(d)) / tot
    differ = f != rq
    checks.append({'name': 'z^H A(z) z / z^H z != f(x_1,...,x_d)', 'ok': differ,
                   'detail': 'f = %s, Rayleigh quotient of A = %s' % (f, rq)})
    try:
        agree = (Fr(cert['objective_from_equations_18_19']) == f and Fr(cert['rayleigh_from_equation_20']) == rq
                 and (d != 1 or Fr(cert['x_norm_squared']) == nrm[0]))
    except Exception:
        agree = False
    checks.append({'name': 'printed objective, Rayleigh quotient and |x|^2 agree', 'ok': agree, 'detail': ''})
    need = [c for c in checks if not c.get('side')]
    allok = all(c['ok'] for c in need)
    return {'verdict': 'CERTIFIED' if allok else 'REFUTED', 'claim': claim, 'checks': checks,
            'why': '' if allok else 'failed: ' + '; '.join(c['name'] for c in need if not c['ok'])}


def forge(cert):
    """x_1 = (1,2) -> (0,2): one entry moved by one; then f = z^H A z / z^H z = 0 and the identity holds."""
    f = copy.deepcopy(cert)
    f['x_1'][0] = '0'
    return f


def forges(cert):
    out = [('x_1 (1,2) -> (0,2)', forge(cert))]
    f = copy.deepcopy(cert)
    f['G_1_1'][0][0] = '0'
    out.append(('G_11[1,1] 1 -> 0 (H = A = 0)', f))
    f = copy.deepcopy(cert)
    f['K_1_1'][1][1] = '-2'
    out.append(('K_11[2,2] -1 -> -2 (norm > 1)', f))
    f = copy.deepcopy(cert)
    f['K_1_1'][0][0] = '1'
    out.append(("README's own mutation K_11[1,1] 0 -> 1 (identity still fails; only printed values move)", f))
    return out


if __name__ == '__main__':
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as fh:
        cert = json.load(fh)
    r = decide(root, cert)
    print(CASE, '->', r['verdict'])
    for c in r['checks']:
        print('  [%s]%s %s  %s' % ('ok' if c['ok'] else 'FAIL', ' (side)' if c.get('side') else '', c['name'], c['detail']))
    print('why:', r['why'])
    for name, fc in forges(cert):
        rf = decide(root, fc)
        print('FORGE (%s) -> %s   %s' % (name, rf['verdict'], rf['why'][:200]))
        assert rf['verdict'] != 'CERTIFIED'
