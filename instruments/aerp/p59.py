#!/usr/bin/env python3
"""instruments/aerp/p59.py — Problem 59 of the AlphaEvolve repository ("subsets of the grid with no isosceles
triangles"), decided exactly.

The definition, from the pinned notebook's prompt (experiments/subsets_of_the_grid_with_no_isosceles_triangles, commit
8f44745): a subset S of the n x n grid {0..n-1}^2 is admissible iff no three distinct points of S form an isosceles
triangle — three points A, B, C with at least two of the three distances d(A,B), d(A,C), d(B,C) equal — the degenerate
collinear case (Q the midpoint of PR) included, since it has d(P,Q) = d(Q,R). C(n) is the largest admissible |S|.

Decided in integers: squared distances; a triple is forbidden iff two of its three squared distances coincide. Every
triple is examined (no apex shortcut), O(|S|^3). Maximality (no grid point can be added) is reported as a measurement.

usage: python3 -I instruments/aerp/p59.py file.json     (a JSON list of [x,y] or {"solution": [...]})
"""
import itertools, json, math, sys


def load_points(obj):
    pts = obj['solution'] if isinstance(obj, dict) and 'solution' in obj else obj
    pts = [tuple(int(c) for c in p) for p in pts]
    for p in pts:
        if len(p) != 2: raise ValueError('a point is not 2-dimensional: %r' % (p,))
    return pts


def d2(p, q):
    return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2


def isosceles_triples(points):
    bad = 0; wit = None
    for a, b, c in itertools.combinations(points, 3):
        x, y, z = d2(a, b), d2(a, c), d2(b, c)
        if x == y or x == z or y == z:
            bad += 1
            if wit is None: wit = [a, b, c]
    return bad, wit


def maximal(points, n):
    """True iff no grid point outside S can be added without an isosceles triple."""
    S = set(points)
    for x in range(n):
        for y in range(n):
            p = (x, y)
            if p in S: continue
            ok = True
            for a, b in itertools.combinations(points, 2):
                u, v, w = d2(p, a), d2(p, b), d2(a, b)
                if u == v or u == w or v == w: ok = False; break
            if ok: return False, p
    return True, None


def decide(points, n, check_maximal=True):
    out = {'n': n, 'size': len(points), 'inGrid': all(0 <= c <= n - 1 for p in points for c in p), 'distinct': len(set(points)) == len(points),
           'triples': math.comb(len(points), 3)}
    if not out['inGrid'] or not out['distinct']:
        out['verdict'] = 'REFUTED'; out['why'] = 'not a subset of the grid' if not out['inGrid'] else 'repeated point'; return out
    bad, wit = isosceles_triples(points)
    out['isoscelesTriples'] = bad
    if wit: out['witness'] = wit
    out['verdict'] = 'CERTIFIED' if bad == 0 else 'REFUTED'
    if check_maximal and bad == 0:
        m, p = maximal(points, n); out['maximal'] = m
        if not m: out['addablePoint'] = p
    return out


if __name__ == '__main__':
    obj = json.load(open(sys.argv[1]))
    pts = load_points(obj)
    n = int(obj['instance']['n']) if isinstance(obj, dict) and 'instance' in obj else int(max(c for p in pts for c in p)) + 1
    print(json.dumps(decide(pts, n)))
