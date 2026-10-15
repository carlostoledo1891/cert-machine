#!/usr/bin/env python3
"""instruments/aerp/p60.py — Problem 60 of the AlphaEvolve repository ("no 5 on a sphere"), decided exactly.

The definition, from the pinned notebook (experiments/no_5_on_a_sphere, commit 8f44745): a subset S of the grid
{0..n-1}^3 is admissible iff for every five points of S the 5 x 5 determinant det[x, y, z, x^2+y^2+z^2, 1] is nonzero —
which forbids five points on a common sphere AND five points on a common plane (the degenerate case). C(n) is the largest
admissible |S|. A claim "C(n) >= k" is decided by exhibiting an admissible S with |S| = k inside the grid.

Two deciders, both exact in integers, no floats anywhere:

  reference(points)  every 5-subset: the 4 x 4 determinant of the lifted differences (translation by the first point),
                     Python integers. O(|S|^5); used up to ~60 points and as the cross-check of the other.
  keyed(points)      every 4-subset: the hyperplane of R^4 through its four lifted points, as a primitive integer
                     5-vector (the generalised cross product of three lifted differences and its offset, divided by
                     the gcd, sign-normalised). A zero normal means the four lifted points are affinely dependent — a
                     violation with any fifth point. Two distinct 4-subsets with the same key share a hyperplane, so
                     their union puts >= 5 points on one sphere or plane — a violation. Conversely five points with a
                     zero determinant either contain a dependent 4-subset or span exactly one hyperplane, in which case
                     two of their 4-subsets carry the same key. So "no duplicate key and no zero normal" is EXACTLY
                     "no 5-subset with zero determinant". numpy int64 (coordinates <= 63: every intermediate is below
                     2^63 by the bounds in bounds_ok), O(|S|^4) and vectorised; this is what decides the big sets.

usage: python3 -I instruments/aerp/p60.py file.json [--ref]     (a JSON list of [x,y,z] or {"solution": [...]})
"""
import itertools, json, math, sys
try:
    import numpy as np
except ImportError:          # the pure-Python path below decides the same thing, slower
    np = None


def load_points(obj):
    pts = obj['solution'] if isinstance(obj, dict) and 'solution' in obj else obj
    if isinstance(obj, dict) and 'construction' in obj: pts = obj['construction']['points']
    pts = [tuple(int(c) for c in p) for p in pts]
    for p in pts:
        if len(p) != 3: raise ValueError('a point is not 3-dimensional: %r' % (p,))
    return pts


def in_grid(points, n):
    return all(0 <= c <= n - 1 for p in points for c in p)


def bounds_ok(points):
    """The int64 argument: |coordinate| <= 63 -> |lifted difference| <= 3*63^2 = 11907, a 3 x 3 minor of three such
    vectors <= 6 * 63 * 63 * 11907 < 2.9e8, the offset (a dot product of four such) < 1.4e13, and the gcd/normalisation
    stays within. Checked, not assumed."""
    return all(0 <= c <= 63 for p in points for c in p)


def reference(points):
    """Every 5-subset, Python integers. Returns (ok, zero_count, min_abs_det, witness)."""
    L = [(x, y, z, x * x + y * y + z * z) for (x, y, z) in points]
    zero = 0; mn = None; wit = None
    for a, b, c, d, e in itertools.combinations(range(len(L)), 5):
        p0 = L[a]
        m = [[L[i][j] - p0[j] for j in range(4)] for i in (b, c, d, e)]
        det = det4(m)
        if det == 0:
            zero += 1
            if wit is None: wit = [points[i] for i in (a, b, c, d, e)]
        else:
            ad = abs(det)
            if mn is None or ad < mn: mn = ad
    return zero == 0, zero, mn, wit


def det4(m):
    def d3(r, c):
        (a, b, cc), (d, e, f), (g, h, i) = [[m[x][y] for y in c] for x in r]
        return a * (e * i - f * h) - b * (d * i - f * g) + cc * (d * h - e * g)
    return (m[0][0] * d3((1, 2, 3), (1, 2, 3)) - m[0][1] * d3((1, 2, 3), (0, 2, 3))
            + m[0][2] * d3((1, 2, 3), (0, 1, 3)) - m[0][3] * d3((1, 2, 3), (0, 1, 2)))


def keyed_python(points):
    """The same hyperplane-key decision in pure Python integers (no numpy): the fallback and the second
    implementation of keyed() on every set the battery runs."""
    if len(set(points)) != len(points): raise ValueError('repeated point')
    N = len(points)
    if N < 5: return True, 0, 0, None
    L = [(x, y, z, x * x + y * y + z * z) for (x, y, z) in points]
    seen = {}; dep = 0; dup = 0; wit = None
    for a, b, c, d in itertools.combinations(range(N), 4):
        A = L[a]; B = [L[b][j] - A[j] for j in range(4)]; C = [L[c][j] - A[j] for j in range(4)]; D = [L[d][j] - A[j] for j in range(4)]
        def minor(c0, c1, c2):
            return (B[c0] * (C[c1] * D[c2] - C[c2] * D[c1]) - B[c1] * (C[c0] * D[c2] - C[c2] * D[c0]) + B[c2] * (C[c0] * D[c1] - C[c1] * D[c0]))
        n = (minor(1, 2, 3), -minor(0, 2, 3), minor(0, 1, 3), -minor(0, 1, 2))
        if n == (0, 0, 0, 0):
            dep += 1
            if wit is None: wit = ('dependent quadruple', [points[i] for i in (a, b, c, d)])
            continue
        off = -(n[0] * A[0] + n[1] * A[1] + n[2] * A[2] + n[3] * A[3])
        g = 0
        for t in n + (off,): g = math.gcd(g, t)
        key = tuple(t // g for t in n + (off,))
        for t in key:
            if t != 0:
                if t < 0: key = tuple(-u for u in key)
                break
        prev = seen.get(key)
        if prev is None: seen[key] = (a, b, c, d)
        else:
            dup += 1
            if wit is None: wit = ('two quadruples on one sphere or plane', [points[i] for i in prev], [points[i] for i in (a, b, c, d)])
    return dep == 0 and dup == 0, dep, dup, wit


def keyed(points):
    if np is None: return keyed_python(points)
    """Every 4-subset's hyperplane as a primitive integer key; numpy int64, exact under bounds_ok.
    Returns (ok, dependent_quadruples, duplicate_keys, witness)."""
    if not bounds_ok(points): raise ValueError('coordinates above 63: the int64 bound argument does not cover this set')
    if len(set(points)) != len(points): raise ValueError('repeated point')
    N = len(points)
    if N < 5: return True, 0, 0, None
    P = np.array([(x, y, z, x * x + y * y + z * z) for (x, y, z) in points], dtype=np.int64)
    quads = np.array(list(itertools.combinations(range(N), 4)), dtype=np.int32)   # C(N,4) rows (4.6M at N = 104)
    dep_total = 0; dup_total = 0; witness = None
    seen = {}
    CH = 400000
    for s in range(0, len(quads), CH):
        q = quads[s:s + CH]
        A = P[q[:, 0]]; B = P[q[:, 1]] - A; C = P[q[:, 2]] - A; Dd = P[q[:, 3]] - A
        # normal n_j = (-1)^j * det of the 3 x 3 minor leaving out column j, of the rows B, C, D
        def minor(cols):
            c0, c1, c2 = cols
            return (B[:, c0] * (C[:, c1] * Dd[:, c2] - C[:, c2] * Dd[:, c1])
                    - B[:, c1] * (C[:, c0] * Dd[:, c2] - C[:, c2] * Dd[:, c0])
                    + B[:, c2] * (C[:, c0] * Dd[:, c1] - C[:, c1] * Dd[:, c0]))
        n0 = minor((1, 2, 3)); n1 = -minor((0, 2, 3)); n2 = minor((0, 1, 3)); n3 = -minor((0, 1, 2))
        Nn = np.stack([n0, n1, n2, n3], axis=1)
        off = -(Nn * A).sum(axis=1)
        K = np.concatenate([Nn, off[:, None]], axis=1)                      # (rows, 5)
        zero = ~Nn.any(axis=1)
        dep_total += int(zero.sum())
        if zero.any() and witness is None:
            i = int(np.argmax(zero)); witness = ('dependent quadruple', [points[j] for j in q[i]])
        K = K[~zero]; qk = q[~zero]
        g = np.gcd.reduce(np.abs(K), axis=1)
        K = K // g[:, None]
        # sign: first nonzero component positive
        first = np.argmax(K != 0, axis=1)
        sgn = np.sign(K[np.arange(len(K)), first])
        K = K * sgn[:, None]
        for row, quad in zip(map(tuple, K.tolist()), qk.tolist()):
            prev = seen.get(row)
            if prev is None: seen[row] = quad
            else:
                dup_total += 1
                if witness is None: witness = ('two quadruples on one sphere or plane', [points[j] for j in prev], [points[j] for j in quad])
    return dep_total == 0 and dup_total == 0, dep_total, dup_total, witness


def decide(points, n, want_reference=None):
    """The verdict for a claim C(n) >= |points|."""
    out = {'n': n, 'size': len(points), 'inGrid': in_grid(points, n), 'distinct': len(set(points)) == len(points)}
    if not out['inGrid'] or not out['distinct']:
        out['verdict'] = 'REFUTED'; out['why'] = 'not a subset of the grid' if not out['inGrid'] else 'repeated point'
        return out
    ok, dep, dup, wit = keyed(points)
    out.update({'keyed': {'ok': ok, 'dependentQuadruples': dep, 'duplicateKeys': dup, 'engine': 'numpy-int64' if np is not None else 'python-int'}, 'quadruples': math.comb(len(points), 4)})
    if want_reference is None: want_reference = len(points) <= 60
    if want_reference:
        rok, zero, mn, rwit = reference(points)
        out['reference'] = {'ok': rok, 'zeroDeterminants': zero, 'minAbsDet': mn, 'quintuples': math.comb(len(points), 5)}
        if rok != ok: raise RuntimeError('the two deciders disagree: keyed %s, reference %s' % (ok, rok))
    out['verdict'] = 'CERTIFIED' if ok else 'REFUTED'
    if wit is not None: out['witness'] = wit
    return out


if __name__ == '__main__':
    obj = json.load(open(sys.argv[1]))
    pts = load_points(obj)
    n = int(obj['instance']['n']) if isinstance(obj, dict) and 'instance' in obj else int(max(c for p in pts for c in p)) + 1
    r = decide(pts, n, want_reference='--ref' in sys.argv)
    print(json.dumps(r, default=str))
