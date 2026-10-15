#!/usr/bin/env python3
"""instruments/bandeira/verify.py — the Lai--Lim (5,5) Farkas certificate decided from first principles.

The claim (Oxelra-AI/Bandeira-0.2a-open-source, 2026-06): Bandeira's Open Problem 0.2(a) is false at n = 5, because
Recht--Re's conjecture (RR_{5,5}) is false, because the feasibility problem "lambda = 120" of Lai--Lim's SDP (their
Conjecture 1C, eq. (6)-(7), ICML 2020) is infeasible, which an exact rational Farkas certificate (y0, y) shows.

This program decides the last step with NO code from the claimant. It builds the SDP's constraints itself from the
definition in Lai--Lim's paper, read as text:

    lambda + sum_{distinct j1..j5} X_j1 ... X_j5  =  sum_{i=1}^{6} tr( beta X_i beta^T Y_i ),       X_6 := 5 - X_1 - ... - X_5,

with beta the 31 noncommutative monomials of degree <= 2 in X_1..X_5, Y_1..Y_6 symmetric 31 x 31 and PSD, and the
equation read coefficient by coefficient on the 3906 monomials of degree <= 5. Writing each monomial's equation in the
standard form tr(C_w Y) = b_w with Y = diag(lambda, Y_1, ..., Y_6) (C_w carries +1 at (0,0) when w = 1 and the negated
RHS coefficients in the blocks, b_w = -[w is a distinct 5-word]; this is the orientation the claimant's export states,
and the other orientation is the same certificate with y negated), the Farkas argument is: for any feasible Y with
lambda = 120,

    120 y0 + b^T y  =  tr( (y0 C_0 + sum_w y_w C_w) Y )  =  tr(M Y)  <=  0      whenever  -M is PSD,

so a (y0, y) with -M PSD and 120 y0 + b^T y > 0 proves infeasibility. Because M is block-diagonal (the scalar
m00 = y0 + y_1, then six 31 x 31 blocks), -M PSD means m00 <= 0 and, for each i, the symmetric 31 x 31 matrix

    Phi_i[j][k] = ( phi(beta_j X_i beta_k^T) + phi(beta_k X_i beta_j^T) ) / 2,     phi(w) := y_w extended linearly,

is PSD. Decided here, all in exact rationals (the standard library's fractions): the 3906 monomials enumerated in the
order the claimant's export uses (by degree, then lexicographic in the letters 0..4 — the only convention taken from
them, and tested: a wrong order makes the scalar and the pivots disagree with every reported value); the six Phi_i
built by multiplying monomials; each Phi_i decided positive DEFINITE by an exact LDL^T with every pivot > 0 (PD implies
PSD; a zero pivot would be REFUSED, never read as PSD); m00 < 0; the scalar > 0. The record carries the smallest pivot
of each block as an exact fraction so the claimant's own figures can be compared AFTER the record is written.

    python3 -I instruments/bandeira/verify.py corpus/bandeira/certificate-v2.json [--convention leftT|rightT|none] [--out certs/bandeira-farkas.json]
"""
import hashlib, json, os, sys, time
from fractions import Fraction
from itertools import product

N_VARS, DEG_BETA, DEG_MAX, LAMBDA0 = 5, 2, 5, 120


def words(n, dmax):
    """every word over n letters of length <= dmax, by length then lexicographic (tuples of 0..n-1)"""
    out = []
    for d in range(dmax + 1):
        out.extend(product(range(n), repeat=d))
    return out


def pmul(p, q):
    """product of two noncommutative polynomials, dict word -> Fraction"""
    out = {}
    for a, ca in p.items():
        for b, cb in q.items():
            w = a + b
            out[w] = out.get(w, 0) + ca * cb
    return {w: c for w, c in out.items() if c != 0}


def ldl_pivots(A):
    """exact LDL^T pivots of a symmetric rational matrix (no pivoting); stops at the first non-positive pivot"""
    n = len(A)
    M = [row[:] for row in A]
    piv = []
    for k in range(n):
        d = M[k][k]
        piv.append(d)
        if d <= 0:
            return piv, False
        for i in range(k + 1, n):
            if M[i][k] != 0:
                f = M[i][k] / d
                Mi, Mk = M[i], M[k]
                for j in range(k, n):
                    Mi[j] -= f * Mk[j]
    return piv, True


CONVENTIONS = {
    'rightT': 'beta_j * X_i * beta_k^T  (the k-th basis monomial reversed; Helton\'s SOS form f^T l f written on the right factor)',
    'leftT': 'beta_j^T * X_i * beta_k  (the j-th basis monomial reversed; Helton\'s SOS form f^T l f)',
    'none': 'beta_j * X_i * beta_k  (no reversal; the convention the claimant\'s export states)',
}


def decide(cert, convention='leftT'):
    t0 = time.time()
    y0 = Fraction(cert['y0'][0], cert['y0'][1])
    y = [Fraction(a, b) for a, b in zip(cert['y_num'], cert['y_den'])]
    monos = words(N_VARS, DEG_MAX)
    if len(y) != len(monos):
        return {'verdict': 'REFUSED', 'why': 'the certificate has %d multipliers; the SDP has %d monomial constraints' % (len(y), len(monos))}
    phi = dict(zip(monos, y))
    beta = words(N_VARS, DEG_BETA)                                   # 31 basis monomials
    ell = [{(i,): Fraction(1)} for i in range(N_VARS)] + [{(): Fraction(N_VARS), **{(i,): Fraction(-1) for i in range(N_VARS)}}]
    blocks = []
    for i in range(N_VARS + 1):
        q = len(beta)
        P = [[None] * q for _ in range(q)]
        for j in range(q):
            for k in range(q):
                bj = tuple(reversed(beta[j])) if convention == 'leftT' else beta[j]
                bk = tuple(reversed(beta[k])) if convention == 'rightT' else beta[k]
                p = pmul(pmul({bj: Fraction(1)}, ell[i]), {bk: Fraction(1)})
                P[j][k] = sum((c * phi[w] for w, c in p.items()), Fraction(0))
        Phi = [[(P[j][k] + P[k][j]) / 2 for k in range(q)] for j in range(q)]
        piv, pd = ldl_pivots(Phi)
        blocks.append({'block': i + 1, 'constraint': 'X_%d' % (i + 1) if i < N_VARS else '%d - X_1 - ... - X_%d' % (N_VARS, N_VARS),
                       'size': q, 'positiveDefinite': pd, 'pivots': len(piv), 'minPivot': str(min(piv)) if pd else str(piv[-1]),
                       'symmetricBeforeAveraging': all(P[j][k] == P[k][j] for j in range(q) for k in range(q))})
    m00 = y0 + phi[()]
    distinct = [w for w in monos if len(w) == DEG_MAX and len(set(w)) == DEG_MAX]
    scalar = LAMBDA0 * y0 - sum(phi[w] for w in distinct)             # 120 y0 + b^T y with b_w = -[w distinct 5-word]
    cone = m00 < 0 and all(b['positiveDefinite'] for b in blocks)
    ok = cone and scalar > 0
    return {'convention': convention, 'conventionMeaning': CONVENTIONS[convention], 'verdict': 'CERTIFIED' if ok else ('REFUTED' if (m00 > 0 or scalar < 0 or any(not b['positiveDefinite'] for b in blocks)) else 'REFUSED'),
            'what': 'the Lai--Lim (5,5) SDP is infeasible at lambda = 120: -M is PSD and 120 y0 + b^T y > 0 for the published (y0, y), the constraints built here from the definition',
            'monomials': len(monos), 'basis': len(beta), 'distinctWords': len(distinct),
            'y0': str(y0), 'yConstant': str(phi[()]), 'm00': str(m00), 'm00Negative': m00 < 0, 'scalar': str(scalar), 'scalarPositive': scalar > 0,
            'blocks': blocks, 'maxDenominator': max(cert['y_den']), 'seconds': round(time.time() - t0, 1)}


if __name__ == '__main__':
    src = sys.argv[1]
    out = sys.argv[sys.argv.index('--out') + 1] if '--out' in sys.argv else None
    raw = open(src, 'rb').read()
    cert = json.loads(raw)
    conv = sys.argv[sys.argv.index('--convention') + 1] if '--convention' in sys.argv else 'leftT'
    rec = decide(cert, conv)
    rec['input'] = {'file': src, 'sha256': hashlib.sha256(raw).hexdigest(), 'claimantFile': cert.get('source')}
    rec['decidedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    rec['decider'] = {'file': 'instruments/bandeira/verify.py', 'sha256': hashlib.sha256(open(os.path.abspath(__file__), 'rb').read()).hexdigest(), 'python': sys.version.split()[0]}
    if out:
        json.dump(rec, open(out, 'w'), indent=1); open(out, 'a').write('\n')
    print('%s: m00 = %s (%s), scalar = %s (%s), blocks PD: %s (%.0f s)' % (rec['verdict'], rec['m00'], 'neg' if rec['m00Negative'] else 'NOT neg', rec['scalar'],
          'pos' if rec['scalarPositive'] else 'NOT pos', [b['positiveDefinite'] for b in rec['blocks']], rec['seconds']))
    for b in rec['blocks']:
        print('  block %d (%s): min pivot %s' % (b['block'], b['constraint'], b['minPivot'][:60] + ('...' if len(b['minPivot']) > 60 else '')))
    sys.exit(0 if rec['verdict'] == 'CERTIFIED' else 1)
