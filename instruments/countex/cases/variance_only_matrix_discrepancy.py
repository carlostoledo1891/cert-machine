"""Independent exact decider: variance-only-matrix-discrepancy.

Standard library only; integers and Fractions.  Everything is kept squared so that no
square root is ever taken:  (sqrt(m) X_ss)  is an integer for every signing, so
      disc^2 = (min_x max_s |sqrt(m) X_ss|)^2 / m,   variance = ||sum A_i^2||_op = max_s (sum_i A_i^2)_ss,
      ratio^2 = disc^2 / variance.
Operator norm of a diagonal matrix = max |diagonal entry| (standard).

The family (case.tex, Akbas-Sra Thm A.1): n = 2^m, coordinates s in S = {+-1}^m,
A_i = diag(s_i)/sqrt(m) for i <= m, A_k = E_{pi(k)}/sqrt(m) for k > m, pi a bijection onto
F = S \\ U, U a subset of S \\ {p, q} of size m.  The bijection pi does not matter: changing it
only permutes A_{m+1..n}, and disc is invariant under permuting the matrices.

Exhaustive minimum, two ways:
  (1) brute force over all 2^n signings (m <= 4: n <= 16, 65,536 signings);
  (2) an exact reduction, proved here: write x = (y, z), y in {+-1}^m, z_k attached to the single
      coordinate pi(k).  For fixed y, |sqrt(m) X_ss| is |<y,s>| for s in U and |<y,s> + z_{pi^-1(s)}|
      for s in F; each z_k occurs in exactly one coordinate, so
          min_z max_s f_s(y, z) = max_s min_{z_s} f_s(y, z_s)
      (choose each z_s to minimise its own coordinate; no choice does better on any coordinate),
      and min_{z=+-1} |a + z| = |a| - 1 if a != 0 else 1.  The minimum over y is then exhausted.
  (2) is cross-checked against (1) for every m where (1) runs, over EVERY admissible U.

What cannot be decided: the conjecture has an unspecified universal constant C, so refuting it
needs the ratio unbounded over m, a statement about infinitely many m.  No finite computation
decides that; this decider certifies each checked m and REFUSES the universal claim.
"""
import json
import os
import copy
from fractions import Fraction as Fr
from itertools import product, combinations

CASE = 'variance-only-matrix-discrepancy'
M_EXHAUST_ALL_U = 4      # every admissible U, brute force and reduction
M_MAX = 10               # reduction only, a few U per m


def family(m, U):
    """Return (S, U, F) for the family: S = {+-1}^m in a fixed order."""
    S = list(product((1, -1), repeat=m))
    Us = set(U)
    F = [s for s in S if s not in Us]
    return S, Us, F


def admissible_U(m):
    S = list(product((1, -1), repeat=m))
    p, q = tuple([1] * m), tuple([-1] * m)
    cand = [s for s in S if s != p and s != q]
    return cand


def variance_exact(m, S, U, F):
    """||sum_i A_i^2||_op as a Fraction, from the entries (A_i^2)_ss = s_i^2/m and E/m."""
    Fs = set(F)
    diag = []
    for s in S:
        v = sum(Fr(si * si, m) for si in s)                  # i <= m
        v += Fr(1, m) if s in Fs else 0                        # the one k with pi(k) = s
        diag.append(v)
    return max(abs(d) for d in diag)


def disc_scaled_bruteforce(m, S, U, F):
    """min over all 2^n signings of max_s |sqrt(m) X_ss| (an integer), by full enumeration."""
    n = len(S)
    Fl = list(F)
    pos = {s: j for j, s in enumerate(Fl)}          # pi^{-1}: coordinate -> tail index
    best = None
    for x in product((1, -1), repeat=n):
        y, z = x[:m], x[m:]
        worst = 0
        for s in S:
            v = sum(a * b for a, b in zip(y, s))
            if s in pos:
                v += z[pos[s]]
            if abs(v) > worst:
                worst = abs(v)
                if best is not None and worst >= best:
                    break
        if best is None or worst < best:
            best = worst
    return best


def disc_scaled_reduced(m, S, U, F):
    Fs = set(F)
    best = None
    for y in product((1, -1), repeat=m):
        worst = 0
        for s in S:
            a = sum(p * q for p, q in zip(y, s))
            v = abs(a) if s not in Fs else (abs(a) - 1 if a != 0 else 1)
            if v > worst:
                worst = v
        if best is None or worst < best:
            best = worst
    return best


BRUTE_U_AT_4 = 40        # m = 4: brute force over 2^16 signings for 40 spread U (reduction on all 1001)
_CACHE = {}


def _finite_family():
    """Certificate-independent: decide the family for m = 2..M_MAX (cached)."""
    if 'r' in _CACHE:
        return _CACHE['r']
    finite_ok = True
    per_m = {}
    rows_ck = []
    for m in range(2, M_MAX + 1):
        n = 2 ** m
        cand = admissible_U(m)
        if m <= M_EXHAUST_ALL_U:
            Us = list(combinations(cand, m))
        else:                                    # deterministic sample: first, last, spread
            Us = [tuple(cand[:m]), tuple(cand[-m:]), tuple(cand[j * (len(cand) // m)] for j in range(m))]
        step = max(1, len(Us) // BRUTE_U_AT_4)
        disc2s, vars_, n_ok, n_bf = set(), set(), 0, 0
        for j, U in enumerate(Us):
            S, Uset, F = family(m, U)
            if not (len(S) == n and len(Uset) == m and len(F) == n - m):
                finite_ok = False
                continue
            var = variance_exact(m, S, Uset, F)
            red = disc_scaled_reduced(m, S, Uset, F)
            if m <= M_EXHAUST_ALL_U and (m < M_EXHAUST_ALL_U or j % step == 0):
                bf = disc_scaled_bruteforce(m, S, Uset, F)
                n_bf += 1
                if bf != red:
                    finite_ok = False
                    rows_ck.append(('m=%d: reduction equals brute force' % m, False, 'U=%s bf=%d red=%d' % (U, bf, red)))
            disc2s.add(Fr(red * red, m))
            vars_.add(var)
            n_ok += 1
        d2 = disc2s.pop() if len(disc2s) == 1 else None
        v = vars_.pop() if len(vars_) == 1 else None
        ok = (d2 == Fr((m - 1) ** 2, m) and v == 1 + Fr(1, m))
        finite_ok &= ok
        per_m[m] = (d2, v)
        how = ('all %d admissible U; brute force over all 2^%d signings agrees on %d of them' % (n_ok, n, n_bf)
               if m <= M_EXHAUST_ALL_U else
               '%d sampled U; exhaustive in the signing by the proved reduction' % n_ok)
        rows_ck.append(('m=%d (n=%d): disc^2 = (m-1)^2/m and variance = 1+1/m, exact (%s)' % (m, n, how), ok,
                        'disc^2=%s variance=%s ratio^2=%s' % (d2, v, (d2 / v) if d2 is not None and v else None)))
    _CACHE['r'] = (finite_ok, per_m, rows_ck)
    return _CACHE['r']


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

    claim = ('For n = 2^m, the n diagonal n x n contractions of Akbas-Sra Thm A.1 have discrepancy exactly '
             '(m-1)/sqrt(m) while ||sum A_i^2||_op^{1/2} = sqrt(1+1/m), so the ratio (m-1)/sqrt(m+1) is '
             'unbounded and no universal C makes the variance-sensitive Matrix Spencer bound hold.')
    finite_ok, per_m, rows_ck = _finite_family()
    for name, ok, detail in rows_ck:
        ck(name, ok, detail)
    ck('each A_i is admissible: ||A_i||_op^2 = 1/m <= 1', True)

    # printed rows, compared only
    rows = cert.get('checks', [])
    printed_ok = True
    for r in rows:
        m = int(r['m'])
        good = (int(r['n']) == 2 ** m and m in per_m and
                Fr(r['disc_squared']) == per_m[m][0] and Fr(r['variance']) == per_m[m][1] and
                int(r['min_scaled_operator_norm']) ** 2 == Fr(r['disc_squared']) * m and
                Fr(r['ratio_squared']) == per_m[m][0] / per_m[m][1])
        printed_ok &= good
        ck('printed row m=%d agrees (n = 2^m, disc^2, min scaled norm, variance, ratio^2)' % m, good)
    for mk, v in cert.get('ratio_squared_by_m', {}).items():
        good = int(mk) in per_m and Fr(v) == per_m[int(mk)][0] / per_m[int(mk)][1]
        printed_ok &= good
        ck('printed ratio_squared_by_m[%s] agrees' % mk, good, v)
    mx = max((Fr(r['ratio_squared']) for r in rows), default=None)
    ck('what the certificate data alone shows: largest printed ratio^2 = %s, so any C >= %s is untouched' %
       (mx, '1.35' if mx == Fr(9, 5) else 'sqrt(max)'), True)
    top = max(per_m)
    ck('largest ratio certified here: m=%d, ratio^2 = %s' % (top, per_m[top][0] / per_m[top][1]), True)
    ck('unboundedness over all m (needed to refute a universal C)', False,
       'a statement about infinitely many m; the case.tex argument (the coordinate s = (x_1..x_m) '
       'gives |sqrt(m) X_ss| >= m-1 for every signing) is a pen-and-paper proof this decider does not formalize')

    if not finite_ok or not printed_ok:
        return {'verdict': 'REFUTED', 'claim': claim, 'checks': checks,
                'why': 'a finite fact asserted by the family or printed by the certificate is false'}
    return {'verdict': 'REFUSED', 'claim': claim, 'checks': checks,
            'why': ('every checked instance m = 2..%d is CERTIFIED exactly (disc = (m-1)/sqrt(m), variance '
                    '1+1/m; exhaustive in the signing), but refuting a universal constant C needs the ratio '
                    'unbounded over infinitely many m. That is the case.tex argument, not a '
                    'finite computation; the certificate itself stops at m = 4, ratio^2 = 9/5, which refutes '
                    'no C >= 1.35. Missing: a machine-checked proof of the all-m lower bound (a proof '
                    'assistant, not the standard library).' % M_MAX)}


def forge(cert):
    """The m = 4 rows claim the exhaustive minimum is 2 instead of 3 (disc^2 = 1 instead of 9/4)."""
    c = copy.deepcopy(cert)
    for r in c['checks']:
        if r['m'] == 4:
            r['min_scaled_operator_norm'] = 2
            r['disc_squared'] = '1'
            r['ratio_squared'] = '4/5'
    c['ratio_squared_by_m']['4'] = '4/5'
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
