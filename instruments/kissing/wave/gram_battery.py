#!/usr/bin/env python3
"""instruments/kissing/wave/gram_battery.py — the Gram-form path (gram.py, gramcheck.js): calibrations that must
certify, red controls that must fire. Runs in seconds: every configuration is small enough for plain Python integers
and for the BigInt second language to decide whole.

Calibrations: A2's 6 roots in their own basis (6 contacts); E8's 240 roots as coefficient rows over the Bourbaki
simple roots, G the Cartan matrix (6,720 contacts = 240 * 56 / 2), through a pinned manifest, through the forked tile
pool, and through the float64 path; the 56 roots of E8 at inner product 1 with a fixed root, projected away from it —
rational rows over the common denominator 2 (the scaled path), spanning exactly 7 dimensions, no contact, the nearest
pair at cos 1/3.
"""
import json, os, sys, tempfile, hashlib
from fractions import Fraction
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gram   # noqa: E402

passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL ' + name)


def red(cond, name):
    global passed, failed, reds, fired
    reds += 1
    if cond:
        fired += 1; passed += 1
    else:
        failed += 1
        print('RED DID NOT FIRE ' + name)


quiet = lambda *a: None


def refused(f):
    try:
        f()
    except gram.Refused:
        return True
    return False


# ---- E8: the 240 roots, doubled to integers, written over the Bourbaki simple roots ----
roots2 = []
for i in range(8):
    for j in range(i + 1, 8):
        for si in (2, -2):
            for sj in (2, -2):
                v = [0] * 8; v[i] = si; v[j] = sj; roots2.append(v)
for mask in range(256):
    v = [-1 if mask >> k & 1 else 1 for k in range(8)]
    if v.count(-1) % 2 == 0:
        roots2.append(v)
ok(len(roots2) == 240, 'E8: 240 roots generated')
e = lambda k: [2 if t == k else 0 for t in range(8)]
B = [[1, -1, -1, -1, -1, -1, -1, 1], [a + b for a, b in zip(e(0), e(1))]] + [[a - b for a, b in zip(e(k), e(k - 1))] for k in range(1, 7)]
Bf = [[Fraction(v) for v in r] for r in B]


def solve_rows(X, Bm):
    """x = z B over Q, exactly (Gauss-Jordan on B^T)"""
    m = len(Bm)
    A = [[Bm[r][c] for r in range(m)] for c in range(m)]
    inv = [[Fraction(int(i == j)) for j in range(m)] for i in range(m)]
    for c in range(m):
        p = next(r for r in range(c, m) if A[r][c] != 0)
        A[c], A[p] = A[p], A[c]; inv[c], inv[p] = inv[p], inv[c]
        f = 1 / A[c][c]; A[c] = [x * f for x in A[c]]; inv[c] = [x * f for x in inv[c]]
        for r in range(m):
            if r != c and A[r][c] != 0:
                g = A[r][c]; A[r] = [a - g * b for a, b in zip(A[r], A[c])]; inv[r] = [a - g * b for a, b in zip(inv[r], inv[c])]
    return [[sum(inv[i][k] * x[k] for k in range(m)) for i in range(m)] for x in X]


Z8q = solve_rows([[Fraction(v) for v in x] for x in roots2], Bf)
ok(all(v.denominator == 1 for r in Z8q for v in r), 'E8: every root is an integer combination of the simple roots')
Z8 = np.array([[int(v) for v in r] for r in Z8q], dtype=np.int64)
cartan = [[sum(a * b for a, b in zip(B[i], B[j])) // 4 for j in range(8)] for i in range(8)]
ok(all(cartan[i][i] == 2 for i in range(8)) and sorted(v for r in cartan for v in r).count(-1) == 14, 'E8: G = B B^T / 4 is the Cartan matrix (7 edges)')
gf = gram.gram_facts(cartan)
ok(gf['positiveDefinite'] and gf['det'] == '1', 'E8: the Cartan matrix is positive definite with determinant 1, exactly')

r = gram.decide(Z8, cartan, norm=2, dim=8, count=240, procs=1, tile=2048, sample=240, log=quiet)
ok(r['verdict'] == 'WITNESSED' and r['bulk']['contacts'] == 6720 and r['bulk']['violations'] == 0 and r['bulk']['pairs'] == 28680,
   'E8 in Gram form: 28,680 pairs, 6,720 contacts = 240 * 56 / 2, none closer')
ok(r['bulk']['nearestNonContactDot'] == 0 and r['facts']['path'] == 'float32' and r['second']['agree'], 'E8: nearest non-contact orthogonal; float32 path; Python integers agree')
r2 = gram.decide(Z8, cartan, norm=2, dim=8, count=240, procs=2, tile=16, sample=100, log=quiet)
ok(r2['bulk']['tiles'] == 120 and r2['bulk']['contacts'] == 6720 and r2['verdict'] == 'WITNESSED', 'E8 through the forked tile pool (120 tiles of 16): the same 6,720')
js = gram.js_sample(Z8, cartan, 2, k=240)
ok(js['agree'] and js['jsContacts'] == 6720 and js['jsVerdict'] == 'CERTIFIED', 'E8: gramcheck.js (BigInt) decides all 240 and agrees with plain Python')

# the scaled path and the float64 path: the same E8 rows times 2^10, scale 2^10
r64 = gram.decide(Z8 * 1024, cartan, scale=1024, norm=2, dim=8, count=240, procs=1, sample=50, log=quiet)
ok(r64['facts']['path'] == 'float64' and r64['bulk']['contacts'] == 6720 and r64['verdict'] == 'WITNESSED', 'E8 x 2^10 over scale 2^10: the float64 path, the same 6,720 contacts')

# ---- the 56: E8 roots at inner product 1 with a root r, projected orthogonally to r (rows 2x - r, scale 2) ----
G8 = np.array(cartan, dtype=np.int64)
rr = Z8[0]
P1 = Z8 @ G8 @ rr
sel = Z8[P1 == 1]
ok(sel.shape[0] == 56, 'E8: 56 roots at inner product 1 with a fixed root')
Z56 = 2 * sel - rr
r56 = gram.decide(Z56, cartan, scale=2, norm=Fraction(3, 2), dim=7, count=56, procs=1, sample=56, log=quiet)
ok(r56['verdict'] == 'WITNESSED' and r56['facts']['spanDimension'] == 7 and r56['bulk']['contacts'] == 0 and r56['bulk']['nearestNonContactCos'] == '1/3',
   'the projected 56 (rational rows over 2): 7 dimensions, no contact, nearest pair at cos 1/3')
js56 = gram.js_sample(Z56, cartan, r56['facts']['normInteger'], k=56)
ok(js56['agree'] and js56['jsContacts'] == 0 and js56['jsVerdict'] == 'CERTIFIED', 'the projected 56: gramcheck.js agrees')

# ---- A2, through a manifest with a CSV rows file; then E8 through a binary int8 manifest ----
A2 = [[2, -1], [-1, 2]]
rows2 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]]
with tempfile.TemporaryDirectory() as td:
    csv = ''.join(','.join(map(str, x)) + '\n' for x in rows2).encode()
    open(os.path.join(td, 'a2.csv'), 'wb').write(csv)
    man = {'rows': {'file': 'a2.csv', 'sha256': hashlib.sha256(csv).hexdigest(), 'format': 'csv', 'columns': 2},
           'gram': {'num': A2, 'den': 1}, 'scale': 1, 'claim': {'count': 6, 'dimension': 2, 'norm': '2'}}
    json.dump(man, open(os.path.join(td, 'a2.json'), 'w'))
    P = gram.load_manifest(os.path.join(td, 'a2.json'))
    ra = gram.decide(P['Z'], P['num'], P['den'], P['scale'], P['norm'], P['dim'], P['count'], procs=1, log=quiet)
    ok(ra['verdict'] == 'WITNESSED' and ra['bulk']['contacts'] == 6, 'A2 from a CSV manifest: 6 roots, 6 contacts')
    b8 = Z8.astype('<i1').tobytes()
    open(os.path.join(td, 'e8.i8'), 'wb').write(b8)
    man8 = {'rows': {'file': 'e8.i8', 'sha256': hashlib.sha256(b8).hexdigest(), 'format': 'i1', 'columns': 8},
            'gram': {'num': cartan, 'den': 1}, 'scale': 1, 'claim': {'count': 240, 'dimension': 8, 'norm': '2'}}
    json.dump(man8, open(os.path.join(td, 'e8.json'), 'w'))
    P8 = gram.load_manifest(os.path.join(td, 'e8.json'))
    re8 = gram.decide(P8['Z'], P8['num'], P8['den'], P8['scale'], P8['norm'], P8['dim'], P8['count'], procs=1, sample=60, log=quiet)
    ok(re8['verdict'] == 'WITNESSED' and re8['bulk']['contacts'] == 6720, 'E8 from an int8 manifest: 6,720 contacts')
    man8['rows']['sha256'] = '0' * 64
    json.dump(man8, open(os.path.join(td, 'e8bad.json'), 'w'))
    red(refused(lambda: gram.load_manifest(os.path.join(td, 'e8bad.json'))), 'a rows file that does not match its pin is refused')

# ---- red controls ----
red(refused(lambda: gram.decide(np.array(rows2), [[0, 1], [1, 0]], norm=2, log=quiet)), 'an indefinite Gram matrix is refused')
red(refused(lambda: gram.decide(np.array(rows2), [[2, -1], [0, 2]], norm=2, log=quiet)), 'an asymmetric Gram matrix is refused')
red(refused(lambda: gram.decide(np.array(rows2), [[1, 1], [1, 1]], norm=2, log=quiet)), 'a singular Gram matrix is refused')
red(refused(lambda: gram.decide(np.array(rows2), A2, norm=Fraction(1, 3), log=quiet)), 'a norm that is not an integer in the scaled units is refused')
red(refused(lambda: gram.decide(Z8 * (1 << 27), cartan, scale=1 << 27, norm=2, log=quiet)), 'a partial-sum bound past 2^53 is refused, never rounded')
bad = [r_[:] for r_ in cartan]; bad[0][2] = bad[2][0] = 0
rb = gram.decide(Z8, bad, norm=2, procs=1, sample=60, log=quiet)
red(rb['verdict'] == 'UNWITNESSED' and not rb['facts']['allNormsEqual'], 'E8 against a Cartan matrix with one edge removed: the norms break')
rd = gram.decide(np.vstack([Z8, Z8[:1]]), cartan, norm=2, count=241, procs=1, sample=60, log=quiet)
red(rd['verdict'] == 'UNWITNESSED' and rd['facts']['distinctRows'] == 240, 'a repeated root is caught')
rc = gram.decide(Z8, cartan, norm=2, count=241, procs=1, sample=60, log=quiet)
red(rc['verdict'] == 'UNWITNESSED', 'a claimed count of 241 for 240 rows is refused')
rw = gram.decide(Z56, cartan, scale=2, norm=Fraction(3, 2), dim=8, procs=1, sample=56, log=quiet)
red(rw['verdict'] == 'UNWITNESSED' and rw['facts']['spanDimension'] == 7, 'the projected 56 claimed in 8 dimensions is refused (they span 7)')
# a seventh point of norm 2 in A2 (a rational one: (3/7, 8/7)), with the roots, all over the common denominator 7
Z7 = np.array([[7 * a, 7 * b] for a, b in rows2] + [[3, 8]], dtype=np.int64)
rv = gram.decide(Z7, A2, scale=7, norm=2, dim=2, count=7, procs=1, log=quiet)
red(rv['verdict'] == 'UNWITNESSED' and rv['bulk']['violations'] > 0 and rv['second']['pythonViolations'] == rv['bulk']['violations'],
    'a seventh equal-norm point in the plane: violations found by the bulk path and by plain Python, the same count')
jv = gram.js_sample(Z7, A2, rv['facts']['normInteger'], k=7)
red(jv['jsVerdict'] == 'REFUTED' and jv['jsViolations'] == rv['bulk']['violations'], 'the same seventh point: gramcheck.js refutes, the same count')

print('kissing gram-form battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
