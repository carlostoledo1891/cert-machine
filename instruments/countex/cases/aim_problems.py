"""Independent exact decider for counterexamples/aim-problems (Borcea--Branden AIM
problems 35, 36, 37, 38).  Python 3 standard library only; every decision is made
in integers or fractions.Fraction.  Written from case.tex before reading verify.py.

Witnesses (from case.tex; artifacts/certificate-35-38.json carries only the
coefficients of p, not p itself, so the factorization of p is taken from case.tex
eq. (stable-p) and can be overridden in the cert dict under 'witness_p_linear_forms'):

  p      = prod_i (x_i + 5 sum_{j != i} x_j)                      (Problems 35, 38)
  q      = det(sum_i x_i J_i) / 648                               (Problem 36)
  qtilde = det(sum_i x_i Jtilde_i) / 5184,  Jtilde_i=(4J_i+2G)/5  (Problem 37)
"""
import json
import os
import copy
import itertools
from fractions import Fraction

CASE = 'aim-problems'
N = 5          # number of variables
D = 5          # degree
PARTS = [(5,), (4, 1), (3, 2), (3, 1, 1), (2, 2, 1), (2, 1, 1, 1), (1, 1, 1, 1, 1)]


def pstr(lam):
    return '(' + ','.join(map(str, lam)) + ')'


# ---------------------------------------------------------------- polynomials
def pmul(a, b):
    r = {}
    for ea, ca in a.items():
        for eb, cb in b.items():
            e = tuple(x + y for x, y in zip(ea, eb))
            r[e] = r.get(e, 0) + ca * cb
    return {e: c for e, c in r.items() if c != 0}


def padd(a, b, s=1):
    r = dict(a)
    for e, c in b.items():
        r[e] = r.get(e, 0) + s * c
    return {e: c for e, c in r.items() if c != 0}


def unit(i, c=1):
    e = [0] * N
    e[i] = 1
    return {tuple(e): c}


def linear(coeffs):
    r = {}
    for i, c in enumerate(coeffs):
        if c != 0:
            r = padd(r, unit(i, c))
    return r


def perm_sign(p):
    s, seen = 1, [False] * len(p)
    for i in range(len(p)):
        if not seen[i]:
            j, L = i, 0
            while not seen[j]:
                seen[j] = True
                j = p[j]
                L += 1
            if L % 2 == 0:
                s = -s
    return s


def det_int(M):
    """Exact determinant by fraction-free Bareiss elimination."""
    n = len(M)
    A = [list(map(int, row)) for row in M]
    sign, prev = 1, 1
    for k in range(n - 1):
        if A[k][k] == 0:
            sw = next((i for i in range(k + 1, n) if A[i][k] != 0), None)
            if sw is None:
                return 0
            A[k], A[sw] = A[sw], A[k]
            sign = -sign
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                A[i][j] = (A[i][j] * A[k][k] - A[i][k] * A[k][j]) // prev
        prev = A[k][k]
    return sign * A[n - 1][n - 1]


def det_pencil(Js):
    """det(sum_i x_i J_i) as an exact integer polynomial (Leibniz expansion)."""
    n = len(Js[0])
    entry = [[linear([Js[i][r][c] for i in range(N)]) for c in range(n)] for r in range(n)]
    total = {}
    for sigma in itertools.permutations(range(n)):
        term = {tuple([0] * N): perm_sign(sigma)}
        for r in range(n):
            term = pmul(term, entry[r][sigma[r]])
            if not term:
                break
        total = padd(total, term)
    return total


def all_monomials(deg, nv):
    for c in itertools.combinations_with_replacement(range(nv), deg):
        e = [0] * nv
        for i in c:
            e[i] += 1
        yield tuple(e)


def is_symmetric(P):
    for e, c in P.items():
        for s in itertools.permutations(e):
            if P.get(s, 0) != c:
                return False
    return True


def is_homogeneous(P, deg):
    return all(sum(e) == deg for e in P)


def m_coeffs(P):
    return {lam: P.get(tuple(list(lam) + [0] * (N - len(lam))), 0) for lam in PARTS}


# --------------------------------------------------- symmetric-function tools
def conj(lam):
    return tuple(sum(1 for x in lam if x > j) for j in range(lam[0])) if lam else ()


def hook_f(lam):
    """f^lambda by the hook-length formula (exact integer division)."""
    n = sum(lam)
    lc = conj(lam)
    prod = 1
    for i, row in enumerate(lam):
        for j in range(row):
            prod *= (row - j - 1) + (lc[j] - i - 1) + 1
    num = 1
    for k in range(2, n + 1):
        num *= k
    assert num % prod == 0
    return num // prod


def syt_count(lam):
    """f^lambda by removing corners recursively (independent of the hook formula)."""
    lam = tuple(x for x in lam if x > 0)
    if sum(lam) <= 1:
        return 1
    tot = 0
    for i in range(len(lam)):
        if i == len(lam) - 1 or lam[i] > lam[i + 1]:
            mu = list(lam)
            mu[i] -= 1
            tot += syt_count(tuple(mu))
    return tot


def horizontal_strips(shape, k, maxlen):
    """All partitions nu containing shape with nu/shape a horizontal strip of size k."""
    shape = list(shape) + [0] * (maxlen - len(shape))
    out = []

    def rec(i, rem, cur):
        if i == maxlen:
            if rem == 0:
                out.append(tuple(x for x in cur if x > 0))
            return
        cap = rem if i == 0 else min(rem, shape[i - 1] - shape[i])
        for a in range(cap + 1):
            rec(i + 1, rem - a, cur + [shape[i] + a])
    rec(0, k, [])
    return out


def kostka(lam, mu):
    """Number of SSYT of shape lam and content mu (horizontal-strip enumeration)."""
    shapes = {(): 1}
    for m in mu:
        nxt = {}
        for sh, c in shapes.items():
            for nu in horizontal_strips(sh, m, len(lam) + 1):
                if len(nu) <= len(lam) and all(nu[i] <= lam[i] for i in range(len(nu))):
                    nxt[nu] = nxt.get(nu, 0) + c
        shapes = nxt
    return shapes.get(tuple(lam), 0)


def mn_char(lam, mu):
    """chi^lam at cycle type mu by Murnaghan--Nakayama on beta-sets."""
    k = len(lam)
    beta = frozenset(lam[i] + (k - 1 - i) for i in range(k))

    def rec(beta, mu):
        if not mu:
            return 1
        r, rest = mu[0], mu[1:]
        tot = 0
        for b in beta:
            t = b - r
            if t >= 0 and t not in beta:
                between = sum(1 for x in beta if t < x < b)
                tot += (-1) ** between * rec((beta - {b}) | {t}, rest)
        return tot
    return rec(beta, tuple(mu))


def solve_fraction(A, y):
    n = len(A)
    M = [[Fraction(A[i][j]) for j in range(n)] + [Fraction(y[i])] for i in range(n)]
    for c in range(n):
        p = next(r for r in range(c, n) if M[r][c] != 0)
        M[c], M[p] = M[p], M[c]
        for r in range(n):
            if r != c and M[r][c] != 0:
                f = M[r][c] / M[c][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [M[i][n] / M[i][i] for i in range(n)]


def schur_by_kostka(P):
    """Schur coefficients from monomial-symmetric coefficients: m_mu = sum_lam a_lam K_{lam,mu}."""
    mc = m_coeffs(P)
    K = [[kostka(lam, mu) for lam in PARTS] for mu in PARTS]
    a = solve_fraction(K, [mc[mu] for mu in PARTS])
    return dict(zip(PARTS, a))


VAND = None


def vandermonde():
    global VAND
    if VAND is None:
        V = {tuple([0] * N): 1}
        for i in range(N):
            for j in range(i + 1, N):
                V = pmul(V, padd(unit(i), unit(j), -1))
        VAND = V
    return VAND


def schur_by_bialternant(P):
    """a_lam = [x^(lam+delta)] (P * prod_{i<j}(x_i - x_j)); independent of Kostka numbers."""
    PV = pmul(P, vandermonde())
    out = {}
    for lam in PARTS:
        l = list(lam) + [0] * (N - len(lam))
        e = tuple(l[i] + (N - 1 - i) for i in range(N))
        out[lam] = Fraction(PV.get(e, 0))
    return out


def schur_expand(P, name, checks):
    a1 = schur_by_kostka(P)
    a2 = schur_by_bialternant(P)
    agree = all(a1[l] == a2[l] for l in PARTS)
    checks.append({'name': name + ': Schur expansion, Kostka inversion == bialternant extraction',
                   'ok': agree, 'detail': '; '.join('%s:%s' % (pstr(l), a2[l]) for l in PARTS)})
    return a2 if agree else None


def leading_minors(J):
    return [det_int([row[:k] for row in J[:k]]) for k in range(1, len(J) + 1)]


def is_sym_matrix(J):
    return all(J[i][j] == J[j][i] for i in range(len(J)) for j in range(len(J)))


def cmp_printed(checks, name, mine, printed):
    try:
        ok = all(Fraction(mine[k]) == Fraction(printed[k]) for k in mine) and len(mine) == len(printed)
    except Exception as ex:  # malformed printed data
        ok = False
    checks.append({'name': name, 'ok': ok, 'detail': 'recomputed %s | printed %s' % (
        [str(mine[k]) for k in mine], [str(printed[k]) for k in printed])})
    return ok


def key_of(lam):
    return str(tuple(lam))


# ---------------------------------------------- hypotheses of Problem 36 (shared)
def problem36_hypotheses(P, checks, label, stable_detail, stable_ok):
    ok = True
    c = is_homogeneous(P, D) and bool(P)
    checks.append({'name': label + ': homogeneous of degree 5 in 5 variables, not identically zero',
                   'ok': c, 'detail': '%d monomials' % len(P)})
    ok &= c
    c = is_symmetric(P)
    checks.append({'name': label + ': symmetric (coefficient invariant under all 120 permutations of each exponent)',
                   'ok': c, 'detail': ''})
    ok &= c
    c = D <= N
    checks.append({'name': label + ': d <= n', 'ok': c, 'detail': 'd=%d n=%d' % (D, N)})
    ok &= c
    allm = list(all_monomials(D, N))
    npos = sum(1 for e in allm if P.get(e, 0) > 0)
    c = npos >= 1 and all(P.get(e, 0) >= 0 for e in allm)
    checks.append({'name': label + ': at least one positive monomial coefficient (and none negative)',
                   'ok': c, 'detail': '%d of %d monomials strictly positive' % (npos, len(allm))})
    ok &= c
    checks.append({'name': label + ': real stable', 'ok': stable_ok, 'detail': stable_detail})
    ok &= stable_ok
    return ok


# ------------------------------------------------------------------- decide
DEFAULT_P_FORMS = [[1 if i == j else 5 for j in range(N)] for i in range(N)]


def load(root):
    a = os.path.join(root, 'artifacts')
    with open(os.path.join(a, 'certificate-35-38.json')) as f:
        c1 = json.load(f)
    with open(os.path.join(a, 'certificate-36-37.json')) as f:
        c2 = json.load(f)
    return {'certificate-35-38': c1, 'certificate-36-37': c2}


def decide_38_35(cert, results):
    c1 = cert['certificate-35-38']
    forms = cert.get('witness_p_linear_forms', DEFAULT_P_FORMS)
    ch = []
    # the witness p as a product of linear forms
    P = {tuple([0] * N): 1}
    for row in forms:
        P = pmul(P, linear(row))
    pos_forms = all(isinstance(c, int) and c > 0 for row in forms for c in row)
    stable_detail = ('each of the 5 linear factors has all coefficients > 0, so Im(sum c_j z_j) = sum c_j Im z_j > 0 '
                     'on the open upper half-plane^5: no factor vanishes there; a product of nonvanishing factors '
                     'is nonvanishing, and the coefficients are real' if pos_forms else
                     'a linear factor has a nonpositive coefficient: stability not established by this argument')
    hyp = problem36_hypotheses(P, ch, 'p', stable_detail, pos_forms)
    mc = m_coeffs(P)
    cmp_printed(ch, 'p: monomial-symmetric coefficients agree with certificate-35-38.json',
                {l: mc[l] for l in PARTS}, dict(zip(map(tuple, c1['partitions']), c1['monomial_coefficients'])))
    a = schur_expand(P, 'p', ch)
    if a is None:
        results['aim-problem-38'] = {'verdict': 'REFUSED', 'checks': ch, 'why': 'two Schur expansions disagree'}
        results['aim-problem-35'] = {'verdict': 'REFUSED', 'checks': [], 'why': 'depends on 38'}
        return None
    cmp_printed(ch, 'p: Schur coefficients agree with certificate-35-38.json',
                {l: a[l] for l in PARTS}, dict(zip(map(tuple, c1['partitions']), c1['schur_coefficients'])))
    f = {}
    for l in PARTS:
        f[l] = hook_f(l)
        assert f[l] == syt_count(l)
    ch.append({'name': 'f^lambda: hook-length formula == corner-removal count', 'ok': True,
               'detail': str([f[l] for l in PARTS])})
    cmp_printed(ch, 'f^lambda agrees with immanant_f_vector', {l: f[l] for l in PARTS},
                dict(zip(map(tuple, c1['partitions']), c1['immanant_f_vector'])))
    top = a[(1, 1, 1, 1, 1)]
    viol = [l for l in PARTS if a[l] > f[l] * top]
    ok38 = hyp and len(viol) > 0
    ch.append({'name': 'Problem 38 conclusion fails: exists lam with a_lam > f^lam a_(1^5)',
               'ok': len(viol) > 0,
               'detail': '; '.join('%s: %s > %d*%s = %s' % (pstr(l), a[l], f[l], top, f[l] * top) for l in viol)})
    printed_viol = sorted(tuple(v) for v in c1.get('violating_partitions', []))
    ch.append({'name': 'violating partitions agree with certificate', 'ok': sorted(viol) == printed_viol,
               'detail': 'recomputed %s | printed %s' % (viol, printed_viol)})
    # Diagonal mixed-determinant representation claimed in case.tex (not needed by the refutation)
    Dm = [[1 if k == j else 5 for k in range(N)] for j in range(N)]  # D_j = diag, entry j is 1
    eta = {}
    for fmap in itertools.product(range(N), repeat=N):   # f: [5] -> block index
        term = {tuple([0] * N): 1}
        for i in range(N):   # diagonal: det of a principal block = product of its diagonal entries
            term = pmul(term, unit(fmap[i], Dm[fmap[i]][i]))
        eta = padd(eta, term)
    ch.append({'name': '(side claim, not needed by the refutation) eta(x_1 D_1,...,x_5 D_5) == p exactly',
               'ok': eta == P, 'detail': '', 'side': True})
    exact_ok = all(c['ok'] for c in ch if not c.get('side'))
    results['aim-problem-38'] = {
        'verdict': 'CERTIFIED' if (ok38 and exact_ok) else 'REFUTED',
        'claim': 'p = prod(5S-4x_i) is symmetric, homogeneous of degree 5 in 5 variables, real stable, with positive '
                 'coefficients, yet a_lam > f^lam a_(1^5) for some lam, so Problem 38 has a negative answer.',
        'checks': ch,
        'why': '' if (ok38 and exact_ok) else 'a needed fact failed (see checks)'}
    # ---------------- Problem 35
    ch35 = []
    ok_id = eta_schur_identity_check(ch35)
    ok35_exact = ok38 and exact_ok and ok_id
    mprod = Fraction(mc[(1, 1, 1, 1, 1)], 120)
    ch35.append({'name': 'if p = eta(z_1A,...,z_5A) then [m_(1^5)]p = 5! prod a_ii (direct from the definition of eta)',
                 'ok': True, 'detail': 'prod a_ii would be %s/120 = %s' % (mc[(1, 1, 1, 1, 1)], mprod)})
    ch35.append({'name': 'if p = eta(zA) then per(A) = a_(1^5) and Imm_(4,1)(A) = a_(2,1,1,1) (by the identity above)',
                 'ok': True, 'detail': 'per(A) would be %s, Imm_(4,1)(A) would be %s' % (top, a[(2, 1, 1, 1)])})
    ch35.append({'name': 'exact consequence: per(A) < prod a_ii would be forced', 'ok': top < mprod,
                 'detail': '%s < %s: contradicts Marcus (1963) per(A) >= prod a_ii for PSD A -- a cited theorem' % (top, mprod)})
    ch35.append({'name': 'exact consequence: Imm_(4,1)(A) > 4 per(A) would be forced', 'ok': a[(2, 1, 1, 1)] > 4 * top,
                 'detail': '%s > %s: contradicts Imm_(4,1)(A) = sum_i a_ii per(A(i)) - per(A) <= 4 per(A), i.e. '
                           "Lieb's (1966) per(A) >= a_ii per(A(i)) for PSD A; and Lieb dominance at size 5 "
                           '(Wanless 2022) as case.tex argues -- cited theorems' % (a[(2, 1, 1, 1)], 4 * top)})
    results['aim-problem-35'] = {
        'verdict': 'REFUSED' if ok35_exact else 'REFUTED',
        'claim': 'no 5x5 PSD A satisfies p = eta(z_1A,...,z_5A), so Problem 35 has a negative answer.',
        'checks': ch35,
        'why': ('The finite part is exact: the Schur coefficients of p, and the identity eta(z_1A,...,z_5A) = '
                'sum_lam Imm_lam\'(A) s_lam checked symbolically for a generic 5x5 A. Nonexistence over ALL PSD A '
                'needs a universal inequality over the PSD cone (Lieb permanental dominance at size 5 as case.tex '
                'cites [Wanless 2022]; Lieb 1966 or Marcus 1963 suffice, as shown in the checks). That is a cited '
                'theorem, not a finite exact computation, so it is not re-derived here.') if ok35_exact else
               'a needed exact fact failed'}
    return P


def eta_schur_identity_check(ch):
    """eta(z_1A,...,z_5A) = sum_lam Imm_{lam'}(A) s_lam(z) for a generic symbolic 5x5 A.
    Both sides are sums over sigma in S_5 of (prod_i a_{i,sigma(i)}) * (polynomial in z);
    compare the 120 x 126 integer coefficients."""
    n = N
    lhs = {}
    for fmap in itertools.product(range(n), repeat=n):
        blocks = [[i for i in range(n) if fmap[i] == j] for j in range(n)]
        zexp = tuple(len(b) for b in blocks)
        # all sigma preserving each block, with sign
        per_block = [list(itertools.permutations(b)) for b in blocks]
        for choice in itertools.product(*per_block):
            sigma = list(range(n))
            for b, img in zip(blocks, choice):
                for i, t in zip(b, img):
                    sigma[i] = t
            sg = perm_sign(sigma)
            k = (tuple(sigma), zexp)
            lhs[k] = lhs.get(k, 0) + sg
    lhs = {k: v for k, v in lhs.items() if v}

    def ctype(s):
        seen, t = [False] * n, []
        for i in range(n):
            if not seen[i]:
                j, L = i, 0
                while not seen[j]:
                    seen[j] = True
                    j = s[j]
                    L += 1
                t.append(L)
        return tuple(sorted(t, reverse=True))
    K = {(l, m): kostka(l, m) for l in PARTS for m in PARTS}
    chi = {(l, m): mn_char(l, m) for l in PARTS for m in PARTS}
    # sanity: chi(id) = f, and row orthogonality
    ok_char = all(chi[(l, (1, 1, 1, 1, 1))] == hook_f(l) for l in PARTS)
    classes = {}
    for s in itertools.permutations(range(n)):
        classes[ctype(s)] = classes.get(ctype(s), 0) + 1
    for l in PARTS:
        for l2 in PARTS:
            sm = sum(classes[m] * chi[(l, m)] * chi[(l2, m)] for m in PARTS)
            ok_char &= (sm == (120 if l == l2 else 0))
    ch.append({'name': 'S_5 characters (Murnaghan--Nakayama): chi(id)=f^lam and row orthogonality',
               'ok': ok_char, 'detail': ''})
    rhs = {}
    for s in itertools.permutations(range(n)):
        mu = ctype(s)
        for e in all_monomials(D, n):
            srt = tuple(sorted([x for x in e if x > 0], reverse=True))
            v = sum(chi[(conj(l), mu)] * K[(l, srt)] for l in PARTS)
            if v:
                rhs[(s, e)] = v
    ok = (lhs == rhs)
    ch.append({'name': "identity eta(z_1A,...,z_5A) = sum_lam Imm_{lam'}(A) s_lam(z), symbolic in A (120 x 126 coefficients)",
               'ok': ok, 'detail': '%d nonzero (sigma, monomial) coefficients on each side' % len(lhs)})
    return ok and ok_char


def decide_36_37(cert, results):
    c2 = cert['certificate-36-37']
    J = c2['J_matrices']
    G = c2['gram_G']
    ch = []
    ints = all(isinstance(x, int) for Ji in J for row in Ji for x in row)
    ch.append({'name': 'J_i are integer 5x5 matrices', 'ok': ints and len(J) == 5 and all(len(Ji) == 5 for Ji in J),
               'detail': ''})
    sym = all(is_sym_matrix(Ji) for Ji in J)
    mins = [leading_minors(Ji) for Ji in J]
    pd = all(all(m > 0 for m in mm) for mm in mins)
    ch.append({'name': 'J_i symmetric and positive definite (all leading principal minors > 0, Sylvester)',
               'ok': sym and pd, 'detail': str(mins)})
    ch.append({'name': 'leading principal minors agree with certificate',
               'ok': mins == c2['leading_principal_minors'], 'detail': ''})
    stable_ok = sym and pd
    stable_detail = ('J_i real symmetric PD: if Im z_i > 0 and (sum z_i J_i)v = 0 with v != 0 then '
                     '0 = Im v*(sum z_i J_i)v = sum Im(z_i) v*J_i v > 0, impossible; coefficients real')
    Q = det_pencil(J)
    div = all(c % 648 == 0 for c in Q.values())
    q = {e: Fraction(c, 648) for e, c in Q.items()}
    ch.append({'name': 'det(sum x_i J_i) divisible by 648 (q has integer coefficients)', 'ok': div, 'detail': ''})
    hyp = problem36_hypotheses(q, ch, 'q', stable_detail, stable_ok)
    allm = list(all_monomials(D, N))
    allpos = all(q.get(e, 0) > 0 for e in allm)
    ch.append({'name': 'q: all 126 monomial coefficients strictly positive', 'ok': allpos, 'detail': ''})
    mc = m_coeffs(q)
    cmp_printed(ch, 'q: monomial-symmetric coefficients agree with certificate', {key_of(l): mc[l] for l in PARTS},
                c2['monomial_symmetric_coefficients_q'])
    a = schur_expand(q, 'q', ch)
    if a is not None:
        cmp_printed(ch, 'q: Schur coefficients agree with certificate', {key_of(l): a[l] for l in PARTS},
                    c2['schur_coefficients_q'])
        neg = [l for l in PARTS if a[l] < 0]
        ch.append({'name': 'q is NOT Schur positive', 'ok': len(neg) > 0,
                   'detail': '; '.join('%s: %s' % (pstr(l), a[l]) for l in neg)})
        ident = (mc[(5,)] - 2 * mc[(4, 1)] - 2 * mc[(3, 2)] + 3 * mc[(3, 1, 1)] + 3 * mc[(2, 2, 1)]
                 - 4 * mc[(2, 1, 1, 1)] + mc[(1, 1, 1, 1, 1)])
        ch.append({'name': "case.tex's single integer identity for [s_(1^5)]q", 'ok': ident == a[(1, 1, 1, 1, 1)],
                   'detail': str(ident)})
    ok36 = a is not None and hyp and allpos and any(a[l] < 0 for l in PARTS)
    exact_ok = all(c['ok'] for c in ch)
    results['aim-problem-36'] = {
        'verdict': 'CERTIFIED' if (ok36 and exact_ok) else 'REFUTED',
        'claim': 'q = det(sum x_i J_i)/648 is symmetric, homogeneous of degree 5 in 5 variables, real stable, with all '
                 '126 monomial coefficients positive, yet [s_(1^5)]q < 0, so Problem 36 has a negative answer.',
        'checks': ch, 'why': '' if (ok36 and exact_ok) else 'a needed fact failed (see checks)'}
    # ---------------- Problem 37
    ch = []
    Jt, integral = [], True
    for Ji in J:
        M = []
        for r in range(5):
            row = []
            for c in range(5):
                v = 4 * Ji[r][c] + 2 * G[r][c]
                integral &= (v % 5 == 0)
                row.append(v // 5)
            M.append(row)
        Jt.append(M)
    ch.append({'name': 'Jtilde_i = (4J_i + 2G)/5 are integer matrices', 'ok': integral, 'detail': ''})
    ch.append({'name': 'Jtilde_i agree with certificate lower_endpoint_witness.J_matrices',
               'ok': Jt == c2['lower_endpoint_witness']['J_matrices'], 'detail': ''})
    sym = all(is_sym_matrix(M) for M in Jt)
    mins = [leading_minors(M) for M in Jt]
    pd = all(all(m > 0 for m in mm) for mm in mins)
    ch.append({'name': 'Jtilde_i symmetric positive definite (leading principal minors > 0)', 'ok': sym and pd,
               'detail': str(mins)})
    ch.append({'name': 'Jtilde leading minors agree with certificate',
               'ok': mins == c2['lower_endpoint_witness']['leading_principal_minors'], 'detail': ''})
    Qt = det_pencil(Jt)
    div = all(c % 5184 == 0 for c in Qt.values())
    qt = {e: Fraction(c, 5184) for e, c in Qt.items()}
    ch.append({'name': 'det(sum x_i Jtilde_i) divisible by 5184', 'ok': div, 'detail': ''})
    hyp = problem36_hypotheses(qt, ch, 'qtilde', stable_detail, sym and pd)
    mct = m_coeffs(qt)
    cmp_printed(ch, 'qtilde: monomial-symmetric coefficients agree with certificate', {key_of(l): mct[l] for l in PARTS},
                c2['lower_endpoint_witness']['monomial_symmetric_coefficients'])
    at = schur_expand(qt, 'qtilde', ch)
    ok37 = False
    if at is not None:
        cmp_printed(ch, 'qtilde: Schur coefficients agree with certificate', {key_of(l): at[l] for l in PARTS},
                    c2['lower_endpoint_witness']['schur_coefficients'])
        spos = all(at[l] >= 0 for l in PARTS)
        ch.append({'name': 'qtilde is Schur positive (the reading case.tex argues matters)', 'ok': spos, 'detail': ''})
        fails = [l for l in PARTS if at[l] < hook_f(l) * at[(5,)]]
        ch.append({'name': 'Problem 37 conclusion fails: exists lam with a_lam < f^lam a_(5)', 'ok': len(fails) > 0,
                   'detail': '; '.join('%s: %s < %d*%s' % (pstr(l), at[l], hook_f(l), at[(5,)]) for l in fails)})
        ch.append({'name': "(side claim) case.tex: (1^5) is the only failing partition", 'ok': fails == [(1, 1, 1, 1, 1)],
                   'detail': str(fails), 'side': True})
        ok37 = hyp and len(fails) > 0
    exact_ok = all(c['ok'] for c in ch if not c.get('side'))
    results['aim-problem-37'] = {
        'verdict': 'CERTIFIED' if (ok37 and exact_ok) else 'REFUTED',
        'claim': 'qtilde = det(sum x_i Jtilde_i)/5184 satisfies the hypotheses of Problem 36 (and is Schur positive), '
                 'yet a_(1^5) = 69 < 125 = f^(1^5) a_(5), so Problem 37 has a negative answer.',
        'checks': ch, 'why': '' if (ok37 and exact_ok) else 'a needed fact failed (see checks)'}


RANK = {'CERTIFIED': 2, 'REFUSED': 1, 'REFUTED': 0}


def decide(root, cert=None):
    if cert is None:
        cert = load(root)
    results = {}
    try:
        decide_38_35(cert, results)
    except Exception as ex:
        results.setdefault('aim-problem-38', {'verdict': 'REFUSED', 'checks': [], 'why': 'malformed: %r' % ex})
        results.setdefault('aim-problem-35', {'verdict': 'REFUSED', 'checks': [], 'why': 'malformed: %r' % ex})
    try:
        decide_36_37(cert, results)
    except Exception as ex:
        results.setdefault('aim-problem-36', {'verdict': 'REFUSED', 'checks': [], 'why': 'malformed: %r' % ex})
        results.setdefault('aim-problem-37', {'verdict': 'REFUSED', 'checks': [], 'why': 'malformed: %r' % ex})
    worst = min(results.values(), key=lambda r: RANK[r['verdict']])['verdict']
    checks = []
    for rid in ('aim-problem-38', 'aim-problem-35', 'aim-problem-36', 'aim-problem-37'):
        for c in results[rid]['checks']:
            checks.append({'name': '[%s] %s' % (rid, c['name']), 'ok': c['ok'], 'detail': c['detail'],
                           'side': c.get('side', False)})
    why = '; '.join('%s: %s -- %s' % (k, v['verdict'], v['why']) for k, v in results.items() if v['verdict'] != 'CERTIFIED')
    return {'verdict': worst,
            'claim': 'Four AIM problems (Borcea--Branden 35, 36, 37, 38) have negative answers, witnessed by '
                     'p = prod(5S-4x_i) (35, 38) and two positive-definite determinantal pencils (36, 37).',
            'checks': checks, 'why': why,
            'results': {k: v['verdict'] for k, v in results.items()}}


def forge(cert):
    """One diagonal entry of J_1 moved by one (72 -> 71): J_1 stays symmetric PD, but q is
    no longer symmetric, so the hypotheses of Problems 36/37 fail."""
    f = copy.deepcopy(cert)
    f['certificate-36-37']['J_matrices'][0][4][4] -= 1
    return f


def forges(cert):
    out = [('J_1[5][5]: 72 -> 71 (q loses symmetry)', forge(cert))]
    f = copy.deepcopy(cert)
    f['witness_p_linear_forms'] = [[1 if i == j else 2 for j in range(N)] for i in range(N)]
    out.append(('p factors 5S-4x_i -> 2S-x_i (symmetric, stable; POT bound then holds)', f))
    f = copy.deepcopy(cert)
    f['certificate-35-38']['schur_coefficients'][2] -= 1
    out.append(('printed a_(3,2) 7125 -> 7124 (printed number disagrees)', f))
    f = copy.deepcopy(cert)
    f['certificate-36-37']['J_matrices'] = [[[2 * g for g in row] for row in G5] for G5 in
                                            [f['certificate-36-37']['gram_G']] * 5]
    out.append(('all J_i := 2G (q = c*(sum x_i)^5: Schur positive, 36 claim false)', f))
    return out


if __name__ == '__main__':
    import sys
    root = sys.argv[1] if len(sys.argv) > 1 else os.path.join(
        os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'corpus', 'countex', 'counterexamples', CASE)
    cert = load(root)
    r = decide(root, cert)
    print(CASE, '->', r['verdict'], r['results'])
    for c in r['checks']:
        print('  [%s] %s  %s' % ('ok' if c['ok'] else 'FAIL', c['name'], c['detail'][:220]))
    print('why:', r['why'])
    for name, fc in forges(cert):
        rf = decide(root, fc)
        print('FORGE (%s) -> %s %s' % (name, rf['verdict'], rf['results']))
        assert rf['verdict'] != 'CERTIFIED'
