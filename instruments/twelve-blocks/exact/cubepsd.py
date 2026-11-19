#!/usr/bin/env python3
"""cubepsd.py -- decider adapter: a certificate in the format `cube-psd-1` that V(n) >= v, where V(n) is the least
number of monochromatic triples (a, a+d, a+2d), d >= 1, over the 2-colourings of 1..n.

Written by the control room from the format's one-page description alone (a track's CERT-FORMAT-V.md), with no
code of the track that searches for certificates. Integers and exact fractions only; no search.

The file:  {"format": "cube-psd-1", "n": 46, "v": 90, "D": 1048576, "leaves": [{"cube": "..R..B..", "u": [U_0, ..., U_m]}, ...]}

What is checked.
 (C1) The cubes cover all 2^n colourings: they are pairwise disjoint (some site fixed R in one and B in the other)
      and their sizes 2^m sum to 2^n. A cover that is not pairwise disjoint is REFUSED by this checker, not judged.
 (C2) For every leaf, with w(i,j) = [j-i even] + [2j-i <= n] + [2i-j >= 1] for i < j, T = the number of triples,
      c0 = sum of w f f over pairs of fixed sites, b_k = sum of w f over fixed sites against the k-th free site, and
      A[0][0] = U_0, A[k][k] = U_k, A[0][k] = D b_k, A[k][l] = D w(j_k, j_l):
        (a) A is positive semidefinite  -- up to 64 rows: symmetric elimination in exact fractions (a negative pivot
            refuses; a zero pivot is allowed only if the rest of its row is zero), and when every pivot is positive
            the leading minors a second way (fraction-free elimination). Above 64 rows: a float Cholesky factor of
            A - delta I is rounded to an integer triangle L, and the EXACT integer remainder 4^s A - L L^T must be
            diagonally dominant with a nonnegative diagonal (then it is positive semidefinite by Gershgorin, and
            so is A). The float only proposes L; nothing is accepted on a float. A matrix this route cannot
            prove is REFUSED, which does not say it is not positive semidefinite.
        (b) 2 D (T + c0) - sum(U) > 8 D (v - 1).
 Why that proves it: 4M(x) = T + sum_{i<j} w x_i x_j for x in {+1,-1}^n; on the cube, with z = (1, free signs),
 z^T A z = sum(U) + 2D (the linear and quadratic free parts) >= 0, so 4M >= T + c0 - sum(U)/(2D) > 4(v-1), and M is
 an integer.

A file may carry "within": a cube string. The claim is then only about the colourings inside that cube, and (C1)
becomes: every leaf lies inside `within`, the leaves are pairwise disjoint, and their sizes sum to the size of `within`
(the format page's addendum).

A file may also carry "exceptions": complete colourings (n letters R or B). The claim is then about every colouring
in the cube OTHER than the listed ones, and the cover test becomes: every exception lies inside `within`, they are
distinct, none lies in a leaf, and the sizes of the leaves plus the number of exceptions make the size of `within`
(addendum 2). The exceptions' own counts are not part of the claim; this checker counts them and reports the range.

CERTIFIED: the file proves V(n) >= v (or, with "within", that every colouring in that cube has at least v; with
"exceptions", every one but those listed). REFUSED: it does not (which says nothing about whether V(n) >= v is true).
This checker never says REFUTED: a lower bound is refuted by a colouring, and colourings go to ap3.
Prints one JSON line last."""
import json, sys
from fractions import Fraction as Fr

N_MAX, LEAVES_MAX = 2000, 200000
FRACTIONS_UP_TO = 64            # above this size the matrix is proved positive semidefinite by an exact Gram remainder


class Refuse(Exception):
    pass


def w(i, j, n):
    if i > j: i, j = j, i
    return int((j - i) % 2 == 0) + int(2 * j - i <= n) + int(2 * i - j >= 1)


def psd_fractions(A):
    """Exact: True, all_positive  /  raises Refuse. Symmetric elimination without pivoting."""
    m = len(A)
    M = [[Fr(x) for x in row] for row in A]
    allpos = True
    for k in range(m):
        p = M[k][k]
        if p < 0: raise Refuse('not positive semidefinite: pivot %d is negative' % k)
        if p == 0:
            allpos = False
            if any(M[k][j] != 0 for j in range(k + 1, m)): raise Refuse('not positive semidefinite: pivot %d is zero and its row is not' % k)
            continue
        for i in range(k + 1, m):
            if M[i][k] == 0: continue
            f = M[i][k] / p
            for j in range(i, m):
                M[i][j] -= f * M[k][j]
                M[j][i] = M[i][j]
    return allpos


def minors_positive(A):
    """Fraction-free (Bareiss) elimination: every leading principal minor is a positive integer."""
    m = len(A)
    M = [list(row) for row in A]
    prev = 1
    for k in range(m):
        if M[k][k] <= 0: return False
        for i in range(k + 1, m):
            for j in range(k + 1, m):
                M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) // prev
        prev = M[k][k]
    return True


def psd_gram(A):
    """Exact proof of positive semidefiniteness for a large integer matrix: 4^s A = L L^T + R with L an integer
    lower triangle proposed from a float Cholesky factor and R, computed exactly, diagonally dominant with a
    nonnegative diagonal. Raises Refuse when this route does not prove it."""
    try:
        import numpy as np
    except Exception:
        raise Refuse('numpy is needed to propose a Cholesky factor for a matrix of %d rows' % len(A))
    m = len(A)
    Af = np.array([[float(x) for x in row] for row in A])
    lam = float(np.linalg.eigvalsh(Af)[0])
    if not lam > 0: raise Refuse('the float eigenvalue screen finds a least eigenvalue of %.3e: this route proves only strictly positive matrices' % lam)
    scale = float(np.max(np.abs(np.diag(Af))))
    for s in (20, 28, 36, 44):
        try:
            C = np.linalg.cholesky(Af - (lam / 2) * np.eye(m))
        except Exception:
            raise Refuse('the float Cholesky of A - delta I failed')
        L = [[int(round(float(C[i][j]) * (1 << s))) for j in range(i + 1)] for i in range(m)]
        S = 1 << (2 * s)
        ok = True
        rowsum = [0] * m; diag = [0] * m
        for i in range(m):
            Li = L[i]
            for j in range(i + 1):
                Lj = L[j]
                r = S * A[i][j] - sum(a * b for a, b in zip(Li, Lj))       # zip stops at the shorter row: k <= j
                if i == j: diag[i] = r
                else:
                    r = -r if r < 0 else r
                    rowsum[i] += r; rowsum[j] += r
        if all(diag[i] >= rowsum[i] for i in range(m)): return s
    raise Refuse('the exact remainder 4^s A - L L^T is not diagonally dominant at any scale tried (least float eigenvalue %.3e against a largest diagonal entry %.3e)' % (lam, scale))


def check(doc):
    if not isinstance(doc, dict) or doc.get('format') != 'cube-psd-1': raise Refuse('the file is not {"format": "cube-psd-1", ...}')
    n, v, D, leaves = doc.get('n'), doc.get('v'), doc.get('D'), doc.get('leaves')
    for name, x in (('n', n), ('v', v), ('D', D)):
        if not isinstance(x, int) or isinstance(x, bool) or x < 1: raise Refuse('"%s" is a positive integer' % name)
    if n > N_MAX: raise Refuse('n = %d is above this checker\'s limit of %d' % (n, N_MAX))
    if not isinstance(leaves, list) or not leaves: raise Refuse('"leaves" is a non-empty list')
    if len(leaves) > LEAVES_MAX: raise Refuse('more than %d leaves' % LEAVES_MAX)
    T = sum(max(0, n - 2 * d) for d in range(1, n))
    if T != (n - 1) ** 2 // 4: raise Refuse('internal: the two counts of triples differ')
    within = doc.get('within', '.' * n)
    if not isinstance(within, str) or len(within) != n or set(within) - set('RB.'): raise Refuse('"within" is %d letters over R, B and .' % n)
    exc = doc.get('exceptions', [])
    if not isinstance(exc, list) or any(not isinstance(e, str) or len(e) != n or set(e) - set('RB') for e in exc): raise Refuse('"exceptions" is a list of complete colourings, %d letters R or B' % n)
    if len(set(exc)) != len(exc): raise Refuse('an exception is listed twice')
    if any(any(a != '.' and a != b for a, b in zip(within, e)) for e in exc): raise Refuse('an exception does not lie inside "within"')
    cubes, total, weakest = [], 0, None
    for q, leaf in enumerate(leaves):
        cube, u = (leaf.get('cube'), leaf.get('u')) if isinstance(leaf, dict) else (None, None)
        if not isinstance(cube, str) or len(cube) != n or set(cube) - set('RB.'): raise Refuse('leaf %d: "cube" is %d letters over R, B and .' % (q, n))
        if any(a != '.' and a != b for a, b in zip(within, cube)): raise Refuse('leaf %d does not lie inside "within"' % q)
        free = [p for p in range(1, n + 1) if cube[p - 1] == '.']
        fixed = [(p, 1 if cube[p - 1] == 'R' else -1) for p in range(1, n + 1) if cube[p - 1] != '.']
        m = len(free)
        if not isinstance(u, list) or len(u) != m + 1 or any(not isinstance(x, int) or isinstance(x, bool) for x in u):
            raise Refuse('leaf %d: "u" is %d integers (one for the fixed part, one per free site)' % (q, m + 1))
        c0 = sum(w(fixed[a][0], fixed[b][0], n) * fixed[a][1] * fixed[b][1] for a in range(len(fixed)) for b in range(a + 1, len(fixed)))
        b = [sum(w(i, j, n) * f for i, f in fixed) for j in free]
        A = [[0] * (m + 1) for _ in range(m + 1)]
        A[0][0] = u[0]
        for k in range(1, m + 1):
            A[k][k] = u[k]
            A[0][k] = A[k][0] = D * b[k - 1]
            for l in range(k + 1, m + 1):
                A[k][l] = A[l][k] = D * w(free[k - 1], free[l - 1], n)
        try:
            if len(A) <= FRACTIONS_UP_TO:
                allpos = psd_fractions(A)
                if allpos and not minors_positive(A): raise Refuse('the two exact eliminations disagree; nothing is decided')
            else:
                psd_gram(A)
        except Refuse as e:
            raise Refuse('leaf %d (%s): %s' % (q, cube if len(cube) <= 80 else cube[:77] + '...', e))
        slack = 2 * D * (T + c0) - sum(u) - 8 * D * (v - 1)
        if slack <= 0:
            raise Refuse('leaf %d (%s): the bound fails: this leaf proves only M >= %s there, and %d is needed' % (q, cube, Fr(2 * D * (T + c0) - sum(u), 8 * D), v))
        margin = Fr(slack, 8 * D)                                   # the leaf proves M > (v - 1) + margin
        if weakest is None or margin < weakest[0]: weakest = (margin, q)
        cubes.append(cube); total += 1 << m
    # (C1) pairwise disjoint and of full measure. Outside the free sites of "within" every leaf equals it, so the
    # comparison is made on those sites only.
    P = [k for k in range(n) if within[k] == '.']
    short = [''.join(c[k] for k in P) for c in cubes]
    for a in range(len(short)):
        ca = short[a]
        for b2 in range(a + 1, len(short)):
            cb = short[b2]
            if not any(x != y and x != '.' and y != '.' for x, y in zip(ca, cb)):
                raise Refuse('the cubes %d and %d overlap: this checker verifies only pairwise disjoint covers' % (a, b2))
    for e in exc:
        es = ''.join(e[k] for k in P)
        for a, ca in enumerate(short):
            if all(x == '.' or x == y for x, y in zip(ca, es)): raise Refuse('an exception lies inside the cube %d' % a)
    if total + len(exc) != 1 << len(P):
        raise Refuse('the cubes are disjoint but, with %d exceptions, cover %d of the 2^%d colourings %s' % (len(exc), total + len(exc), len(P), 'of 1..n' if 'within' not in doc else 'inside "within"'))
    counts = []
    for e in exc:                                              # reported, not part of the claim
        red = int(e[::-1].replace('R', '1').replace('B', '0'), 2); blue = ((1 << n) - 1) ^ red
        counts.append(sum(bin(red & (red >> d) & (red >> (2 * d))).count('1') + bin(blue & (blue >> d) & (blue >> (2 * d))).count('1') for d in range(1, (n - 1) // 2 + 1)))
    return n, v, len(cubes), max(c.count('.') for c in cubes), weakest, (within if 'within' in doc else None), counts


def main():
    try:
        doc = json.load(open(sys.argv[1]))
    except Exception as e:
        print(json.dumps({'verdict': 'REFUSED', 'summary': 'not a readable JSON file: ' + str(e)[:200]})); return
    try:
        n, v, k, mmax, weakest, within, counts = check(doc)
    except Refuse as e:
        print(json.dumps({'verdict': 'REFUSED', 'summary': 'the file does not prove its claim: ' + str(e) + ' (a refusal is not a refutation)'})); return
    head = ('V(%d) >= %d: %d disjoint cubes covering all 2^%d colourings' % (n, v, k, n)) if within is None else \
        ('every colouring of 1..%d inside the stated cube (%d free sites, the rest fixed) has at least %d: %d disjoint cubes filling it' % (n, within.count('.'), v, k))
    if counts and within is None:
        head = 'every colouring of 1..%d OTHER THAN the %d listed has at least %d: %d disjoint cubes and the listed colourings cover all 2^%d' % (n, len(counts), v, k, n)
    elif counts:
        head = head.replace('has at least', 'OTHER THAN the %d listed has at least' % len(counts)).replace('filling it', 'filling it together with the listed colourings')
    tail = '' if not counts else ' · the %d listed colourings, counted here, have between %d and %d monochromatic triples' % (len(counts), min(counts), max(counts))
    print(json.dumps({'verdict': 'CERTIFIED', 'summary': head + ', every matrix positive semidefinite in exact arithmetic (largest %d free sites), every bound strict; the tightest leaf (%d) leaves a margin of %s'
                                                          % (mmax, weakest[1], weakest[0]) + tail,
                      'n': n, 'v': v, 'leaves': k, 'within': within, 'exceptions': len(counts), 'exceptionCounts': sorted(set(counts)), 'tightestMargin': str(weakest[0])}))


if __name__ == '__main__':
    main()
