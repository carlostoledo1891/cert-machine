"""Independent exact decider: sdd-nystrom-diminishing-returns.

Standard library only; every number is an integer or a fractions.Fraction.

What is decided (from case.tex, not from verify.py):
  L = M - gamma*I is symmetric, diagonally dominant (strictly, as claimed), positive
  definite, and NOT an SDDM matrix (so it is a witness for part (b), not part (a));
  K = (L + gamma*I)^{-1} = M^{-1};
  F(I) = || K - K[:,I] K[I,I]^{-1} K[I,:] ||_*  computed from K directly (the residual
  is proved PSD by exhausting all principal minors, so its nuclear norm is its trace);
  with S = {2} (nonempty), T = {2,4}, i = 3 (one-based):
        F(S) - F(S+i)  <  F(T) - F(T+i)
  i.e. the diminishing-returns inequality fails.
"""
import json
import os
import copy
from fractions import Fraction as Fr
from itertools import combinations

CASE = 'sdd-nystrom-diminishing-returns'

# The comparison named in case.tex (one-based indices).
S_BASE = (2,)
T_BASE = (2, 4)
ADD_I = 3


# ---------------------------------------------------------------- exact linear algebra
def det(A):
    """Exact determinant by fraction-valued Gaussian elimination."""
    n = len(A)
    if n == 0:
        return Fr(1)
    A = [[Fr(x) for x in row] for row in A]
    d = Fr(1)
    for c in range(n):
        p = next((r for r in range(c, n) if A[r][c] != 0), None)
        if p is None:
            return Fr(0)
        if p != c:
            A[c], A[p] = A[p], A[c]
            d = -d
        d *= A[c][c]
        for r in range(c + 1, n):
            f = A[r][c] / A[c][c]
            if f:
                for k in range(c, n):
                    A[r][k] -= f * A[c][k]
    return d


def inv(A):
    """Exact inverse by Gauss-Jordan; raises if singular."""
    n = len(A)
    W = [[Fr(x) for x in row] + [Fr(int(i == j)) for j in range(n)] for i, row in enumerate(A)]
    for c in range(n):
        p = next((r for r in range(c, n) if W[r][c] != 0), None)
        if p is None:
            raise ZeroDivisionError('singular')
        W[c], W[p] = W[p], W[c]
        pv = W[c][c]
        W[c] = [x / pv for x in W[c]]
        for r in range(n):
            if r != c and W[r][c] != 0:
                f = W[r][c]
                W[r] = [a - f * b for a, b in zip(W[r], W[c])]
    return [row[n:] for row in W]


def matmul(A, B):
    return [[sum((A[i][k] * B[k][j] for k in range(len(B))), Fr(0)) for j in range(len(B[0]))]
            for i in range(len(A))]


def sub(A, rows, cols):
    return [[A[i][j] for j in cols] for i in rows]


def all_principal_minors_nonneg(A):
    n = len(A)
    for r in range(1, n + 1):
        for idx in combinations(range(n), r):
            if det(sub(A, idx, idx)) < 0:
                return False, idx
    return True, None


def nystrom_error(K, sel0):
    """F(I) from the definition: nuclear norm of K - K[:,I] K[I,I]^{-1} K[I,:].
    Returns (value, residual_is_psd, residual)."""
    n = len(K)
    I = sorted(sel0)
    KII_inv = inv(sub(K, I, I))
    KaI = sub(K, range(n), I)
    KIa = sub(K, I, range(n))
    corr = matmul(matmul(KaI, KII_inv), KIa)
    R = [[K[i][j] - corr[i][j] for j in range(n)] for i in range(n)]
    sym = all(R[i][j] == R[j][i] for i in range(n) for j in range(n))
    psd, _ = all_principal_minors_nonneg(R)
    # For a symmetric PSD matrix the singular values are the eigenvalues, all >= 0,
    # so the nuclear norm equals the trace.  Otherwise we refuse to call it a norm value.
    val = sum((R[i][i] for i in range(n)), Fr(0)) if (sym and psd) else None
    return val, (sym and psd), R


# ---------------------------------------------------------------- the decider
def _load(root):
    if isinstance(root, dict):
        return root
    with open(os.path.join(root, 'artifacts', 'certificate.json')) as f:
        return json.load(f)


def decide(root):
    cert = _load(root)
    checks = []

    def ck(name, ok, detail=''):
        checks.append({'name': name, 'ok': bool(ok), 'detail': str(detail)})
        return bool(ok)

    claim = ('For the integer matrix M and gamma = 1/2, L = M - I/2 is symmetric, strictly '
             'diagonally dominant and positive definite, and with K = (L + gamma I)^{-1} the '
             'nuclear Nystrom error F satisfies F({2}) - F({2,3}) < F({2,4}) - F({2,3,4}), so '
             'adding index 3 helps more after index 4 is selected: diminishing returns fail for SDD L '
             '(Amsel et al. Problem 4.6(b)).')
    try:
        M = [[Fr(x) for x in row] for row in cert['M']]
        gamma = Fr(cert['gamma'])
    except Exception as e:  # malformed witness
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks, 'why': 'witness unreadable: %r' % e}
    n = len(M)
    need = []  # (name) of load-bearing checks

    ok_sq = all(len(r) == n for r in M)
    need.append(ck('M is square', ok_sq, '%dx%d' % (n, len(M[0]) if M else 0)))
    if not ok_sq:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks, 'why': 'M is not square'}
    need.append(ck('gamma > 0', gamma > 0, 'gamma = %s' % gamma))
    L = [[M[i][j] - (gamma if i == j else 0) for j in range(n)] for i in range(n)]
    need.append(ck('L symmetric', all(L[i][j] == L[j][i] for i in range(n) for j in range(n))))
    margins = [L[i][i] - sum(abs(L[i][j]) for j in range(n) if j != i) for i in range(n)]
    need.append(ck('L strictly diagonally dominant with positive diagonal',
                   all(m > 0 for m in margins) and all(L[i][i] > 0 for i in range(n)),
                   'margins L_ii - sum_j|L_ij| = ' + ', '.join(str(m) for m in margins)))
    lead = [det(sub(L, range(k), range(k))) for k in range(1, n + 1)]
    need.append(ck('L positive definite (Sylvester: every leading principal minor > 0, exact)',
                   all(d > 0 for d in lead), 'leading minors = ' + ', '.join(str(d) for d in lead)))
    has_pos_off = any(L[i][j] > 0 for i in range(n) for j in range(n) if i != j)
    ck('L is SDD but not SDDM (has a positive off-diagonal), so it tests part (b), not the proved part (a)',
       has_pos_off)

    Lpg = [[L[i][j] + (gamma if i == j else 0) for j in range(n)] for i in range(n)]
    K = inv(Lpg)
    need.append(ck('K = (L + gamma I)^{-1} computed exactly; K*(L+gamma I) = I',
                   matmul(K, Lpg) == [[Fr(int(i == j)) for j in range(n)] for i in range(n)]))

    S = [x - 1 for x in S_BASE]
    T = [x - 1 for x in T_BASE]
    i0 = ADD_I - 1
    need.append(ck('S nonempty, S subset of T, i not in T', len(S) > 0 and set(S) <= set(T) and i0 not in T,
                   'S=%s T=%s i=%d (one-based)' % (S_BASE, T_BASE, ADD_I)))
    F = {}
    for lab, sel in (('2', S), ('23', S + [i0]), ('24', T), ('234', T + [i0])):
        val, psd, R = nystrom_error(K, sel)
        need.append(ck('Nystrom residual for I=%s is symmetric PSD (all 2^n-1 principal minors >= 0), '
                       'so ||.||_* = trace' % lab, psd))
        J = [j for j in range(n) if j not in sel]
        block = inv(sub(M, J, J)) if J else []
        ck('residual block on the complement equals (M_JJ)^{-1} (case.tex identity; cross-check only)',
           sub(R, J, J) == block and all(R[a][b] == 0 for a in range(n) for b in range(n)
                                          if a in sel or b in sel), 'I=%s' % lab)
        F[lab] = val
    if any(v is None for v in F.values()):
        return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks,
                'why': 'a residual was not PSD, so its nuclear norm is not its trace; not computed here'}
    first = F['2'] - F['23']
    later = F['24'] - F['234']
    gap = later - first
    need.append(ck('violation: [F(T)-F(T+i)] - [F(S)-F(S+i)] > 0 (exact)', gap > 0,
                   'F({2})=%s F({2,3})=%s F({2,4})=%s F({2,3,4})=%s; first=%s later=%s gap=%s'
                   % (F['2'], F['23'], F['24'], F['234'], first, later, gap)))

    # --- printed numbers, compared only
    pe = cert.get('errors', {})
    ck('printed: the four errors agree', set(pe) == set(F) and all(Fr(pe[k]) == F[k] for k in F),
       'printed %s' % pe)
    ck('printed: first_reduction agrees', Fr(cert.get('first_reduction', '0')) == first, cert.get('first_reduction'))
    ck('printed: later_reduction agrees', Fr(cert.get('later_reduction', '0')) == later, cert.get('later_reduction'))
    ck('printed: violation_gap agrees', Fr(cert.get('violation_gap', '0')) == gap, cert.get('violation_gap'))
    pm = cert.get('strict_diagonal_dominance_margins_of_L', [])
    ck('printed: SDD margins agree', [Fr(x) for x in pm] == margins, pm)

    if all(need):
        return {'verdict': 'CERTIFIED', 'claim': claim, 'checks': checks, 'why': ''}
    failed = [c['name'] for c in checks if not c['ok'] and not c['name'].startswith('printed')]
    return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks,
            'why': 'a load-bearing fact is false: ' + '; '.join(failed)}


def forge(cert):
    """Flip the sign of the (1,3)/(3,1) entry of M: -4 -> +4.  L stays symmetric,
    strictly SDD and positive definite, but the diminishing-returns violation disappears."""
    c = copy.deepcopy(cert)
    c['M'][0][2] = '4'
    c['M'][2][0] = '4'
    return c


if __name__ == '__main__':
    import sys
    here = os.path.dirname(os.path.abspath(__file__))
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        here, '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    r = decide(root)
    print(CASE, '->', r['verdict'])
    print('claim:', r['claim'])
    for c in r['checks']:
        print('  [%s] %s  %s' % ('ok' if c['ok'] else 'NO', c['name'], c['detail']))
    if r['why']:
        print('why:', r['why'])
    f = decide(forge(_load(root)))
    print('forge ->', f['verdict'], '|', f['why'])
    assert f['verdict'] != 'CERTIFIED'
