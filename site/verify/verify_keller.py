#!/usr/bin/env python3
"""verify_keller.py — independent verification of the detached keller
certificates, using NOTHING but the Python standard library.

The certificate (certs/keller-certificate.json) claims, per entry:

  (1) det J_F == c, a stated nonzero constant, as a POLYNOMIAL IDENTITY
      over the rationals;
  (2) k >= 2 listed rational points all map exactly to one listed image;
  (3) the points are pairwise distinct.

Together those three facts say: F is a polynomial map with constant nonzero
Jacobian determinant that is not injective — a counterexample to the
Jacobian conjecture in that dimension (for entries marked hessian, F is the
gradient of a polynomial and the Hessian conjecture falls instead).

This script re-derives everything from the monomial lists alone: formal
partial derivatives, symbolic determinant expansion, exact evaluation — all
in fractions.Fraction. It shares no arithmetic with the machine that wrote
the certificate. A verifier this small is the point: the claim is checkable
by a stranger in one file.

It also re-checks itself: a RED CONTROL perturbs one coefficient by 1e-6
and requires the audit to FAIL. If the forged certificate passes, the
verifier is broken and exits nonzero regardless of everything else.

usage: python3 verify_keller.py certs/keller-certificate.json [--sources DIR]
       --sources DIR   also re-hash pinned source PDFs found in DIR
       --quick         skip entries with > 3 variables (the 5-variable
                       Hessian determinant costs minutes in pure Python)
exit 0 iff every checked entry verifies AND the red control fires."""

import sys
import json
import hashlib
import os
from fractions import Fraction

# ---- polynomials: dict {exponent-tuple: Fraction} ---------------------------

def parse_poly(rows):
    p = {}
    for row in rows:
        e, c = tuple(row[:-1]), Fraction(row[-1])
        if c != 0:
            p[e] = p.get(e, Fraction(0)) + c
    return {e: c for e, c in p.items() if c != 0}

def pmul(a, b):
    out = {}
    for ea, ca in a.items():
        for eb, cb in b.items():
            e = tuple(x + y for x, y in zip(ea, eb))
            s = out.get(e, Fraction(0)) + ca * cb
            if s == 0:
                out.pop(e, None)
            else:
                out[e] = s
    return out

def padd(a, b):
    out = dict(a)
    for e, c in b.items():
        s = out.get(e, Fraction(0)) + c
        if s == 0:
            out.pop(e, None)
        else:
            out[e] = s
    return out

def pneg(a):
    return {e: -c for e, c in a.items()}

def pdiff(a, i):
    out = {}
    for e, c in a.items():
        if e[i] == 0:
            continue
        e2 = e[:i] + (e[i] - 1,) + e[i + 1:]
        out[e2] = c * e[i]
    return out

def peval(a, pt):
    s = Fraction(0)
    for e, c in a.items():
        t = c
        for i, k in enumerate(e):
            for _ in range(k):
                t *= pt[i]
        s += t
    return s

def pdet(M):
    """symbolic determinant, cofactor recursion over columns with zero pruning
    (mirrors nothing — written from the definition)"""
    n = len(M)
    used = [False] * n

    def rec(row):
        if row == n:
            return {tuple([0] * nvars): Fraction(1)}
        acc = {}
        sgn = 1
        for c in range(n):
            if used[c]:
                continue
            entry = M[row][c]
            if entry:
                used[c] = True
                sub = rec(row + 1)
                used[c] = False
                term = pmul(entry, sub)
                acc = padd(acc, term if sgn == 1 else pneg(term))
            sgn = -sgn
        return acc

    nvars = 0
    for r in M:
        for p in r:
            for e in p:
                nvars = len(e)
                break
            if nvars:
                break
        if nvars:
            break
    return rec(0)

# ---- the audit --------------------------------------------------------------

def audit(entry):
    """returns (ok, message) — the three facts, checked from scratch"""
    F = [parse_poly(rows) for rows in entry['F']]
    n = len(F)
    det_claim = Fraction(entry['det'])
    if det_claim == 0:
        return False, 'claimed determinant is zero — not a Keller map'

    J = [[pdiff(f, j) for j in range(n)] for f in F]
    D = pdet(J)
    const_key = tuple([0] * n)
    nonconst = [e for e in D if e != const_key]
    if nonconst:
        return False, 'det J is NOT constant: monomial with exponents %s survives' % (nonconst[0],)
    got = D.get(const_key, Fraction(0))
    if got != det_claim:
        return False, 'det J = %s, certificate claims %s' % (got, det_claim)

    pts = [[Fraction(x) for x in pt] for pt in entry['collisions']]
    img = [Fraction(x) for x in entry['image']]
    if len(pts) < 2:
        return False, 'fewer than two collision points'
    for pt in pts:
        for i in range(n):
            got_i = peval(F[i], pt)
            if got_i != img[i]:
                return False, 'F(%s) coordinate %d = %s, claimed %s' % (pt, i, got_i, img[i])
    for a in range(len(pts)):
        for b in range(a + 1, len(pts)):
            if pts[a] == pts[b]:
                return False, 'collision points %d and %d coincide' % (a, b)

    return True, 'det J == %s identically (%dx%d symbolic det, %d monomials checked to cancel), %d exact collisions, pairwise distinct' % (
        det_claim, n, n, sum(len(p) for row in J for p in row), len(pts))

# ---- main -------------------------------------------------------------------

def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    cert_path = args[0]
    quick = '--quick' in args
    sources_dir = None
    if '--sources' in args:
        sources_dir = args[args.index('--sources') + 1]

    # name the exact bytes this verification is about: two transcripts that
    # print the same hash provably checked the same certificate
    with open(cert_path, 'rb') as f:
        raw = f.read()
    print('certificate %s  sha256 %s' % (cert_path, hashlib.sha256(raw).hexdigest()))
    cert = json.loads(raw)

    failures = 0
    checked = 0
    for entry in cert['entries']:
        n = entry['n']
        if quick and n > 3:
            print('SKIP  %-10s n=%d (--quick)' % (entry['id'], n))
            continue
        checked += 1
        ok, msg = audit(entry)
        print('%s  %-10s n=%d  %s' % ('PASS' if ok else 'FAIL', entry['id'], n, msg))
        if not ok:
            failures += 1

    # pinned sources, if a directory was offered
    if sources_dir:
        for fname, sha in cert.get('sourcePins', {}).items():
            p = os.path.join(sources_dir, fname)
            if not os.path.exists(p):
                print('SKIP  source %s not present' % fname)
                continue
            with open(p, 'rb') as f:
                actual = hashlib.sha256(f.read()).hexdigest()
            ok = actual == sha
            print('%s  source %s sha256 %s' % ('PASS' if ok else 'FAIL', fname, 'matches pin' if ok else 'DRIFTED'))
            if not ok:
                failures += 1

    # RED CONTROL: a forged coefficient must fail. Perturb the first
    # monomial of the first polynomial of the first checked entry by 1e-6.
    red = None
    for entry in cert['entries']:
        if quick and entry['n'] > 3:
            continue
        red = json.loads(json.dumps(entry))
        break
    if red is not None:
        red['F'][0][0][-1] = str(Fraction(red['F'][0][0][-1]) + Fraction(1, 10 ** 6))
        ok, _ = audit(red)
        print('%s  RED control: one coefficient forged by 1e-6 %s' % (
            'PASS' if not ok else 'FAIL', 'is refuted' if not ok else 'PASSED THE AUDIT — verifier broken'))
        if ok:
            failures += 1
    else:
        print('FAIL  RED control: no entry available to forge')
        failures += 1

    print()
    print('verify_keller: %d entries checked, %d failures' % (checked, failures))
    return 1 if failures or checked == 0 else 0

if __name__ == '__main__':
    sys.exit(main())
