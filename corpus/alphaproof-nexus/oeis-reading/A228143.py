#!/usr/bin/env python3
# Lean: oeis_228143_conjecture_1.lean -- A005259' m = sum_k C(m,k)^2 C(m+k,k)^2; a n = |det (A005259'(i+j))_{0<=i,j<=n}|; statement: exists C in Z[[x]], C^8 = sum a(n)/3^n x^n
# Exact arithmetic only (int / fractions.Fraction); no floats in the translation.
# Run: python3 -I <this file>   (reads OEIS b-files from ../oeis-data)
import os, sys, json
from fractions import Fraction
from math import comb, factorial, gcd, isqrt
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', 'oeis-data')

def bfile(anum):
    terms = {}
    with open(os.path.join(DATA, 'b' + anum[1:] + '.txt')) as f:
        for line in f:
            s = line.strip()
            if not s or s.startswith('#'):
                continue
            p = s.split()
            if len(p) >= 2:
                try:
                    terms[int(p[0])] = int(p[1])
                except ValueError:
                    pass
    return terms

def compare(anum, fn, indices):
    """Compare fn(i) with the OEIS b-file value at index i (same index convention).
    Returns (number_checked, first_disagreement_or_None)."""
    b = bfile(anum)
    checked, first = 0, None
    for i in indices:
        if i not in b:
            continue
        v = fn(i)
        checked += 1
        if v != b[i]:
            first = {'index': i, 'lean': str(v)[:80], 'oeis': str(b[i])[:80]}
            break
    return checked, first

def report(**kw):
    print(json.dumps(kw))

def apery(m):
    return sum(comb(m, k) ** 2 * comb(m + k, k) ** 2 for k in range(m + 1))

def det_bareiss(M):
    M = [row[:] for row in M]
    n = len(M); sign = 1; prev = 1
    for k in range(n - 1):
        if M[k][k] == 0:
            sw = next((r for r in range(k + 1, n) if M[r][k] != 0), None)
            if sw is None: return 0
            M[k], M[sw] = M[sw], M[k]; sign = -sign
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) // prev
        prev = M[k][k]
    return sign * M[n - 1][n - 1]

AP = [apery(m) for m in range(70)]
def lean_a(n):
    return abs(det_bareiss([[AP[i + j] for j in range(n + 1)] for i in range(n + 1)]))

NMAX = 32
A = [lean_a(n) for n in range(NMAX + 1)]
checked, first = compare('A228143', lambda i: A[i], range(NMAX + 1))
# sanity: B = sum a(n)/3^n x^n; its 8th root with constant term 1 has integer coefficients up to x^NMAX
Bs = [Fraction(A[n], 3 ** n) for n in range(NMAX + 1)]
C = [Fraction(1)]
def pow_series(C, e, N):
    R = [Fraction(1)] + [Fraction(0)] * N
    for _ in range(e):
        R = [sum(R[i] * C[k - i] for i in range(k + 1) if i < len(R) and k - i < len(C)) for k in range(N + 1)]
    return R
for k in range(1, NMAX + 1):
    # coefficient of x^k in C^8 is 8*c_k + (terms in c_1..c_{k-1}); solve for c_k
    C.append(Fraction(0))
    rest = pow_series(C, 8, k)[k]
    C[k] = (Bs[k] - rest) / 8
nonint = [k for k in range(NMAX + 1) if C[k].denominator != 1]
report(anumber='A228143', termsChecked=checked, termsAgree=first is None, firstDisagreement=first,
       statementSanity={'eighth_root_coeffs_checked': NMAX + 1, 'nonintegral_at': nonint,
                        'a_div_3^n_integral': all(A[n] % 3 ** n == 0 for n in range(NMAX + 1))})
