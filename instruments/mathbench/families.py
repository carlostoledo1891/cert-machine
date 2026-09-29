"""instruments/mathbench/families.py — Certified MathBench v0: construction families a model proposes into, each decided exactly.
cert-machine/instruments/mathbench · MIT · stdlib only. K1 of notes/attack-plan-2026-09-29.md.

THE CONTRACT is tools/llm-harness.py's Family (prompt, parse, enumerate, value, interesting, certify, key,
statement) with two duties made universal here: every rung carries its GREEN controls where a witness is on
record (it must certify before anything is graded) and its RED controls — near-misses FORGED from a known
witness by the smallest change that breaks it (they must never certify). A family whose forgeries do not all
refute is not admitted: the harness exits before the first model call.

Every family asks for an exhibited OBJECT (a ruler, a cap, a code, a graph, a law, a set of vectors, a bilinear
algorithm) and decides it with integers, exact rationals or rigorous decimal intervals — no float decides, no
answer key, no judge. The ladder of each family runs from textbook rungs to the published record and, where the
record is not known to be optimal, one rung past it: a certified proposal there would be a new result, and the
page would say so only after the certificate re-derives in a second implementation.
"""
from __future__ import annotations

import itertools
import json
import os
import random
import re
import sys
from fractions import Fraction

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'tools')
sys.path.insert(0, HERE)
from llm_harness_base import Family, Verdict  # noqa: E402  (the Family/Verdict types, shared with tools/llm-harness.py)


def _json(reply):
    """the last JSON object or list in a reply, or None"""
    for m in reversed(list(re.finditer(r'(\{.*\}|\[.*\])', reply, re.S))):
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            continue
    return None


def _ints(xs):
    return isinstance(xs, list) and all(isinstance(x, int) and not isinstance(x, bool) for x in xs)


# ---------------------------------------------------------------------------------------------------------------
# 1. Golomb rulers: n marks, all pairwise differences distinct, length at most L
# ---------------------------------------------------------------------------------------------------------------
OGR = {4: [0, 1, 4, 6], 5: [0, 1, 4, 9, 11], 6: [0, 1, 4, 10, 12, 17], 7: [0, 1, 4, 10, 18, 23, 25], 8: [0, 1, 4, 9, 15, 22, 32, 34],
       9: [0, 1, 5, 12, 25, 27, 35, 41, 44], 10: [0, 1, 6, 10, 23, 26, 34, 41, 53, 55], 11: [0, 1, 4, 13, 28, 33, 47, 54, 64, 70, 72],
       12: [0, 2, 6, 24, 29, 40, 43, 55, 68, 75, 76, 85], 13: [0, 2, 5, 25, 37, 43, 59, 70, 85, 89, 98, 99, 106]}


class GolombFamily(Family):
    name = 'golomb'
    LADDER = [(6, 17), (8, 34), (10, 55), (11, 72), (12, 85), (13, 106)]   # the optimal lengths: every rung is the record

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        n, L = t
        return (f"Give a Golomb ruler with {n} marks and length at most {L}: {n} distinct non-negative integers, the smallest 0 "
                f"and the largest at most {L}, such that all pairwise differences are distinct. Reply with ONLY a JSON list of "
                f"the {n} integers in increasing order, e.g. [0,1,4,6]. No prose.")

    def parse(self, reply):
        xs = _json(reply)
        return tuple(sorted(xs)) if _ints(xs) and xs else None

    def value(self, obj):
        return float(max(obj))

    def interesting(self, obj, t):
        return len(obj) == t[0]

    def certify(self, obj, t):
        n, L = t
        diffs = [b - a for a, b in itertools.combinations(obj, 2)]
        ok = len(obj) == n and len(set(obj)) == n and obj[0] == 0 and obj[-1] <= L and len(set(diffs)) == len(diffs)
        rep = sorted(d for d in set(diffs) if diffs.count(d) > 1)[:3]
        return Verdict(ok, f"length {obj[-1]}, {len(diffs)} differences" + ('' if ok else f", repeated {rep}" if rep else ', bounds violated'),
                       {'marks': list(obj), 'length': obj[-1], 'repeatedDifferences': rep})

    def statement(self, obj, t):
        return f"{list(obj)} is a Golomb ruler with {t[0]} marks and length <= {t[1]}"

    def green_controls(self, t):
        return [tuple(OGR[t[0]])] if t[0] in OGR and OGR[t[0]][-1] <= t[1] else []

    def red_controls(self, t):
        g = OGR.get(t[0])                                   # the last mark moved so the last gap repeats the first: a difference repeats
        return [tuple(sorted(g[:-1] + [g[-2] + (g[1] - g[0])]))] if g and g[-2] + (g[1] - g[0]) not in g else []

    def baseline(self, t):
        """the dumb baseline: marks placed greedily, each the smallest integer keeping every difference new"""
        marks, diffs = [0], set()
        x = 0
        while len(marks) < t[0]:
            x += 1
            nd = {x - m for m in marks}
            if not (nd & diffs) and len(nd) == len(marks):
                diffs |= nd
                marks.append(x)
        return tuple(marks)

    def fake(self, prompt, rng):
        n = int(re.search(r'with (\d+) marks', prompt).group(1))
        g = OGR[n]
        return json.dumps(g if rng.random() < 0.6 else g[:-1] + [g[-2] + (g[1] - g[0])])


# ---------------------------------------------------------------------------------------------------------------
# 2. Cap sets: k points of F_3^n, no three distinct on a line (x + y + z = 0)
# ---------------------------------------------------------------------------------------------------------------
CAP9 = [(0, 1, 0), (1, 1, 2), (1, 0, 1), (1, 2, 2), (0, 1, 2), (0, 0, 0), (2, 1, 0), (0, 0, 2), (1, 0, 0)]
CAP20 = [(0, 2, 2, 0), (1, 2, 1, 0), (0, 2, 2, 2), (2, 2, 1, 0), (0, 1, 0, 0), (2, 2, 1, 1), (1, 0, 0, 2), (1, 1, 2, 2), (1, 1, 0, 1), (0, 1, 0, 2),
         (2, 1, 1, 0), (0, 0, 0, 2), (2, 0, 0, 1), (1, 0, 1, 1), (2, 0, 0, 0), (0, 0, 2, 0), (2, 1, 0, 1), (1, 2, 2, 0), (1, 2, 2, 2), (1, 2, 1, 1)]


class CapsetFamily(Family):
    name = 'capset'
    LADDER = [(3, 9), (4, 20), (5, 45), (6, 112), (7, 236), (7, 237)]     # maxima 9, 20, 45, 112 (proved); 236 the dimension-7 record; 237 open

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        n, k = t
        return (f"Give a cap set of size {k} in F_3^{n}: {k} distinct vectors with entries in {{0,1,2}} and length {n}, no three of which "
                f"are collinear, i.e. no three distinct vectors x, y, z with x + y + z = 0 (mod 3) in every coordinate. Reply with ONLY a "
                f"JSON list of {k} lists of {n} integers. No prose.")

    def parse(self, reply):
        xs = _json(reply)
        if not isinstance(xs, list) or not xs or not all(_ints(v) for v in xs):
            return None
        return tuple(sorted(tuple(v) for v in xs))

    def value(self, obj):
        return float(len(obj))

    def interesting(self, obj, t):
        return len(obj) >= t[1] and all(len(v) == t[0] and all(c in (0, 1, 2) for c in v) for v in obj)

    def certify(self, obj, t):
        n, k = t
        S = set(obj)
        line = None
        if len(S) == len(obj):
            for x, y in itertools.combinations(obj, 2):
                z = tuple((-a - b) % 3 for a, b in zip(x, y))
                if z in S and z != x and z != y:
                    line = [list(x), list(y), list(z)]
                    break
        ok = len(S) == len(obj) and len(S) >= k and line is None and all(len(v) == n and all(c in (0, 1, 2) for c in v) for v in obj)
        return Verdict(ok, f"{len(S)} distinct points" + ('' if line is None else f", a line {line}"), {'points': [list(v) for v in obj], 'line': line})

    def statement(self, obj, t):
        return f"a cap of size {len(obj)} in F_3^{t[0]}"

    def green_controls(self, t):
        return [tuple(sorted(CAP9))] if t == (3, 9) else [tuple(sorted(CAP20))] if t == (4, 20) else []

    def red_controls(self, t):
        if t == (4, 20):                                                    # one point replaced by the third point of a line through two others
            x, y = CAP20[0], CAP20[1]
            z = tuple((-a - b) % 3 for a, b in zip(x, y))
            return [tuple(sorted(CAP20[:-1] + [z]))] if z not in CAP20 else []
        return []

    def baseline(self, t):
        """the dumb baseline: points taken in lexicographic order whenever they complete no line"""
        S, out = set(), []
        for p in itertools.product(range(3), repeat=t[0]):
            if all(tuple((-a - b) % 3 for a, b in zip(p, q)) not in S for q in out):
                S.add(p)
                out.append(p)
        return tuple(sorted(out))

    def fake(self, prompt, rng):
        n = int(re.search(r'in F_3\^(\d+)', prompt).group(1))
        base = CAP20 if n == 4 else CAP9 if n == 3 else [tuple(v) for v in itertools.product((0, 1), repeat=n)]
        return json.dumps([list(v) for v in base])


# ---------------------------------------------------------------------------------------------------------------
# 3. Binary codes: M words of length n, pairwise Hamming distance at least d
# ---------------------------------------------------------------------------------------------------------------
HAMMING7 = [format(x, '07b') for x in (0, 105, 42, 67, 76, 37, 102, 15, 112, 25, 90, 51, 60, 85, 22, 127)]
CODE8 = ['10010111', '10011100', '00001111', '01011001', '00000000', '01010110', '10111011', '00011010', '11000011', '11101101',
         '00101100', '10100110', '00100011', '01111111', '01000101', '11100000', '01101010', '11001110', '10001001', '00110101']


class CodeFamily(Family):
    name = 'code'
    LADDER = [(7, 3, 16), (8, 3, 20), (10, 3, 72), (12, 4, 144), (16, 6, 256), (10, 3, 73)]  # A(n,d) values; 73 <= A(10,3) is open (72..79)

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        n, d, M = t
        return (f"Give a binary code of length {n} with {M} codewords and minimum Hamming distance at least {d}: {M} distinct strings of "
                f"{n} characters '0'/'1', every two differing in at least {d} positions. Reply with ONLY a JSON list of the {M} strings. No prose.")

    def parse(self, reply):
        xs = _json(reply)
        if not isinstance(xs, list) or not xs or not all(isinstance(w, str) and re.fullmatch(r'[01]+', w) for w in xs):
            return None
        return tuple(sorted(xs))

    def value(self, obj):
        return float(len(obj))

    def interesting(self, obj, t):
        return len(obj) >= t[2] and all(len(w) == t[0] for w in obj)

    def certify(self, obj, t):
        n, d, M = t
        ws = [int(w, 2) for w in obj]
        worst, pair = n + 1, None
        for a, b in itertools.combinations(range(len(ws)), 2):
            h = bin(ws[a] ^ ws[b]).count('1')
            if h < worst:
                worst, pair = h, (obj[a], obj[b])
        ok = all(len(w) == n for w in obj) and len(set(obj)) == len(obj) >= M and worst >= d
        return Verdict(ok, f"{len(obj)} words, minimum distance {worst}", {'words': list(obj), 'minDistance': worst, 'closestPair': list(pair) if pair else None})

    def statement(self, obj, t):
        return f"a binary ({t[0]}, {len(obj)}, {t[1]}) code"

    def green_controls(self, t):
        return [tuple(sorted(HAMMING7))] if t == (7, 3, 16) else [tuple(sorted(CODE8))] if t == (8, 3, 20) else []

    def red_controls(self, t):
        if t == (8, 3, 20):                                                  # one bit of one word flipped until a pair sits at distance 2
            w = list(CODE8)
            for i, x in enumerate(w):
                for bit in range(8):
                    y = format(int(x, 2) ^ (1 << bit), '08b')
                    if y not in w and any(bin(int(y, 2) ^ int(z, 2)).count('1') < 3 for j, z in enumerate(w) if j != i):
                        return [tuple(sorted(w[:i] + [y] + w[i + 1:]))]
        return []

    def baseline(self, t):
        """the dumb baseline: the lexicode — words taken in increasing order whenever they keep the distance"""
        n, d, M = t
        out = []
        for x in range(1 << n):
            if all(bin(x ^ y).count('1') >= d for y in out):
                out.append(x)
        return tuple(sorted(format(x, '0%db' % n) for x in out))

    def fake(self, prompt, rng):
        n = int(re.search(r'length (\d+)', prompt).group(1))
        return json.dumps(HAMMING7 if n == 7 else CODE8)


# ---------------------------------------------------------------------------------------------------------------
# 4. Ramsey witnesses: a graph on n vertices with no clique of size s and no independent set of size t
# ---------------------------------------------------------------------------------------------------------------
def _circulant(n, S):
    S = {x % n for x in S} | {(-x) % n for x in S}
    return [[(j - i) % n in S for j in range(n)] for i in range(n)]


def _has_clique(adj, k, want):
    """exact: is there a set of k vertices, pairwise adjacent (want=True) or pairwise non-adjacent (want=False)?"""
    n = len(adj)
    nb = [[j for j in range(n) if j != i and adj[i][j] == want] for i in range(n)]

    def grow(cands, size):
        if size == k:
            return True
        for idx, v in enumerate(cands):
            if size + len(cands) - idx < k:
                return False
            if grow([u for u in cands[idx + 1:] if u in nbs[v]], size + 1):
                return True
        return False
    nbs = [set(x) for x in nb]
    return any(grow([u for u in nb[v] if u > v], 1) for v in range(n)) if k > 1 else n > 0


PALEY17 = [1, 2, 4, 8]                  # the quadratic residues mod 17 up to sign: {±1, ±2, ±4, ±8}


class RamseyFamily(Family):
    name = 'ramsey'
    LADDER = [(3, 4, 8), (3, 5, 13), (4, 4, 17), (3, 6, 17), (4, 5, 24), (3, 9, 35), (4, 6, 36)]  # R(4,6) >= 36 known; a 36-vertex witness would be new

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        s, u, n = t
        return (f"Give a graph on {n} vertices, labelled 0..{n - 1}, with no clique of size {s} and no independent set of size {u} "
                f"(this shows the Ramsey number R({s},{u}) > {n}). Reply with ONLY a JSON object, either "
                f"{{\"n\": {n}, \"edges\": [[i, j], ...]}} or, for a circulant graph, {{\"n\": {n}, \"circulant\": [d1, d2, ...]}} "
                f"(i ~ j iff j - i or i - j is congruent to a listed d mod n). No prose.")

    def parse(self, reply):
        o = _json(reply)
        if not isinstance(o, dict) or not isinstance(o.get('n'), int) or o['n'] < 1 or o['n'] > 64:
            return None
        n = o['n']
        if _ints(o.get('circulant')):
            return ('circulant', n, tuple(sorted({d % n for d in o['circulant']} - {0})))
        es = o.get('edges')
        if isinstance(es, list) and all(isinstance(e, list) and len(e) == 2 and _ints(e) and 0 <= e[0] < n and 0 <= e[1] < n and e[0] != e[1] for e in es):
            return ('edges', n, tuple(sorted({tuple(sorted(e)) for e in es})))
        return None

    def _adj(self, obj):
        kind, n, data = obj
        if kind == 'circulant':
            return _circulant(n, data)
        A = [[False] * n for _ in range(n)]
        for i, j in data:
            A[i][j] = A[j][i] = True
        return A

    def value(self, obj):
        return float(obj[1])

    def interesting(self, obj, t):
        return obj[1] == t[2]

    def certify(self, obj, t):
        s, u, n = t
        A = self._adj(obj)
        k = _has_clique(A, s, True)
        i = _has_clique(A, u, False)
        ok = obj[1] == n and not k and not i
        return Verdict(ok, f"{n} vertices; clique of size {s}: {'yes' if k else 'no'}; independent set of size {u}: {'yes' if i else 'no'}",
                       {'graph': {'kind': obj[0], 'n': obj[1], 'data': [list(x) if isinstance(x, tuple) else x for x in obj[2]]}, 'cliqueFound': k, 'independentFound': i})

    def statement(self, obj, t):
        return f"R({t[0]},{t[1]}) > {t[2]}"

    def green_controls(self, t):
        return {(3, 4, 8): [('circulant', 8, (1, 4, 7))], (3, 5, 13): [('circulant', 13, (1, 5, 8, 12))],
                (4, 4, 17): [('circulant', 17, tuple(sorted({d % 17 for d in PALEY17} | {(-d) % 17 for d in PALEY17})))]}.get(t, [])

    def red_controls(self, t):
        if t == (4, 4, 17):                                                  # Paley(17) with one more distance: a 4-clique appears
            return [('circulant', 17, tuple(sorted({1, 2, 4, 8, 9, 13, 15, 16, 3, 14})))]
        if t == (3, 5, 13):
            return [('circulant', 13, (1, 2, 5, 8, 11, 12))]
        return []

    def baseline(self, t):
        """the dumb baseline: the circulant on the quadratic residues mod n (Paley when n is a prime = 1 mod 4)"""
        n = t[2]
        return ('circulant', n, tuple(sorted({(x * x) % n for x in range(1, n)} - {0})))

    def fake(self, prompt, rng):
        n = int(re.search(r'graph on (\d+) vertices', prompt).group(1))
        return json.dumps({'n': n, 'circulant': [1, 2, 4, 8] if n == 17 else [1, 5] if n == 13 else [1, 4]})


# ---------------------------------------------------------------------------------------------------------------
# 5. Sum–difference entropy (C3b): a law on Z^2 with H(X-Y) / max(H(X), H(Y), H(X+Y)) >= c
# ---------------------------------------------------------------------------------------------------------------
class SumdiffFamily(Family):
    name = 'sumdiff3b'
    LADDER = ['1.6', '1.7', '1.725', '1.77', '1.778', '1.77898', '1.77898884', '1.7789889']  # 1.72598 Ruzsa; 1.77898884 the record; above it open

    def __init__(self):
        sys.path.insert(0, HERE)
        import verify_sumdiff as V  # the standard-library decider: decimal at 120 digits, every operation outward
        self.V = V

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, c):
        return (f"Find a probability distribution of a pair of integer random variables (X, Y), supported on finitely many points of Z^2, "
                f"with H(X - Y) >= {c} * max(H(X), H(Y), H(X + Y)), where H is the Shannon entropy of the distribution of each linear "
                f"combination. Weights must be positive integers (they are normalised by their sum). Reply with ONLY a JSON list of "
                f"[x, y, weight] triples, at most 60 of them. No prose.")

    def parse(self, reply):
        xs = _json(reply)
        if not isinstance(xs, list) or not xs or len(xs) > 200 or not all(_ints(p) and len(p) == 3 and p[2] > 0 for p in xs):
            return None
        pts = {}
        for x, y, w in xs:
            pts[(x, y)] = pts.get((x, y), 0) + w
        return tuple(sorted((x, y, w) for (x, y), w in pts.items()))

    def value(self, obj):
        return float(len(obj))

    def interesting(self, obj, c):
        return len(obj) >= 2

    def certify(self, obj, c):
        tot = sum(w for _, _, w in obj)
        mu = {(x, y): Fraction(w, tot) for x, y, w in obj}
        r = self.V.ratio('3b', mu)
        v = self.V.decide(r, c)
        if v == 'UNDECIDED':
            return None
        return Verdict(v == 'CERTIFIED', f"ratio in [{str(r[0])[:22]}, {str(r[1])[:22]}]", {'law': [list(p) for p in obj], 'ratioLo': str(r[0])[:44], 'ratioHi': str(r[1])[:44]})

    def statement(self, obj, c):
        return f"C3b >= {c} from a {len(obj)}-point law"

    def _record(self):
        d = json.load(open(os.path.join(HERE, '..', 'corpus', 'optimization-constants', 'mi2026', 'c3b_pr92', 'certificate_3b_13pt.json')))
        L = 1
        for w in d['weights']:
            L = L * w['den'] // __import__('math').gcd(L, w['den'])
        return tuple(sorted((w['x'], w['y'], w['num'] * (L // w['den'])) for w in d['weights']))

    def green_controls(self, c):
        return [self._record()] if Fraction(c) <= Fraction('1.77898884') else []

    def red_controls(self, c):
        return [((0, 0, 1), (0, 1, 1), (1, 0, 1), (1, 1, 1))] if Fraction(c) > 1 else []   # two fair bits: ratio exactly 1

    def baseline(self, c):
        """the dumb baseline: X, Y independent and uniform on {0, 1, 2}"""
        return tuple((x, y, 1) for x in range(3) for y in range(3))

    def fake(self, prompt, rng):
        return json.dumps([list(p) for p in self._record()])


# ---------------------------------------------------------------------------------------------------------------
# 6. Kissing configurations: k integer vectors of one norm N in an n-dimensional subspace, pairwise angle >= 60 degrees
# ---------------------------------------------------------------------------------------------------------------
def _dn_roots(n):
    out = []
    for i, j in itertools.combinations(range(n), 2):
        for si, sj in itertools.product((1, -1), repeat=2):
            v = [0] * n
            v[i], v[j] = si, sj
            out.append(tuple(v))
    return out


def _e8_roots():
    out = [tuple(2 * x for x in v) for v in _dn_roots(8)]
    for signs in itertools.product((1, -1), repeat=8):
        if signs.count(-1) % 2 == 0:
            out.append(signs)
    return out                                                  # 112 + 128 = 240, all of squared norm 8


def _rank(vs):
    M = [[Fraction(x) for x in v] for v in vs]
    r, cols = 0, len(M[0]) if M else 0
    for c in range(cols):
        p = next((i for i in range(r, len(M)) if M[i][c] != 0), None)
        if p is None:
            continue
        M[r], M[p] = M[p], M[r]
        for i in range(len(M)):
            if i != r and M[i][c] != 0:
                f = M[i][c] / M[r][c]
                M[i] = [a - f * b for a, b in zip(M[i], M[r])]
        r += 1
    return r


class KissingFamily(Family):
    name = 'kissing'
    LADDER = [(3, 12), (4, 24), (5, 40), (6, 72), (7, 126), (8, 240), (5, 41)]   # kissing numbers / records; 41 in dimension 5 is open (40..44)

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        n, k = t
        return (f"Give {k} nonzero integer vectors, all of the same squared length N, spanning a subspace of dimension at most {n}, such "
                f"that every two distinct vectors u, v satisfy 2 * (u . v) <= N (angle at least 60 degrees): a kissing configuration of "
                f"{k} spheres around one in dimension {n}. Vectors may have more than {n} coordinates if their span has dimension <= {n}. "
                f"Reply with ONLY a JSON list of the {k} integer vectors. No prose.")

    def parse(self, reply):
        xs = _json(reply)
        if not isinstance(xs, list) or not xs or not all(_ints(v) and v for v in xs) or len({len(v) for v in xs}) != 1:
            return None
        return tuple(tuple(v) for v in xs)

    def value(self, obj):
        return float(len(obj))

    def interesting(self, obj, t):
        return len(obj) >= t[1]

    def certify(self, obj, t):
        n, k = t
        norms = {sum(x * x for x in v) for v in obj}
        N = next(iter(norms)) if len(norms) == 1 else None
        bad = None
        if N:
            for a, b in itertools.combinations(range(len(obj)), 2):
                if 2 * sum(x * y for x, y in zip(obj[a], obj[b])) > N:
                    bad = [list(obj[a]), list(obj[b])]
                    break
        rk = _rank(obj)
        ok = N is not None and N > 0 and len(set(obj)) == len(obj) >= k and bad is None and rk <= n
        return Verdict(ok, f"{len(set(obj))} vectors, norms {sorted(norms)[:3]}, span dimension {rk}" + (f", a pair too close {bad}" if bad else ''),
                       {'vectors': [list(v) for v in obj], 'norm': N, 'span': rk, 'closePair': bad})

    def statement(self, obj, t):
        return f"a kissing configuration of {len(obj)} in dimension {t[0]}"

    def green_controls(self, t):
        n, k = t
        if n in (3, 4, 5) and k == 2 * n * (n - 1):
            return [tuple(_dn_roots(n))]
        e8 = _e8_roots()
        if t == (8, 240):
            return [tuple(e8)]
        if t == (7, 126):                                    # the E8 roots orthogonal to one root
            r = e8[0]
            return [tuple(v for v in e8 if sum(a * b for a, b in zip(v, r)) == 0)]
        if t == (6, 72):                                     # orthogonal to an A2: two roots at 120 degrees
            r = e8[0]
            q = next(v for v in e8 if 2 * sum(a * b for a, b in zip(v, r)) == -8)
            return [tuple(v for v in e8 if sum(a * b for a, b in zip(v, r)) == 0 and sum(a * b for a, b in zip(v, q)) == 0)]
        return []

    def red_controls(self, t):
        if t == (4, 24):                                    # one root replaced by a vector at 60 - epsilon degrees from another
            D = _dn_roots(4)
            return [tuple(D[:-1] + [(1, 1, 0, 0)])]         # a duplicate of D[0]
        return []

    def baseline(self, t):
        """the dumb baseline: the D_n root system, 2n(n-1) vectors — the textbook first try"""
        return tuple(_dn_roots(t[0]))

    def fake(self, prompt, rng):
        n = int(re.search(r'at most (\d+)', prompt).group(1))
        g = self.green_controls((n, 2 * n * (n - 1)) if n <= 5 else (n, {6: 72, 7: 126, 8: 240}[n]))
        return json.dumps([list(v) for v in g[0]])


# ---------------------------------------------------------------------------------------------------------------
# 7. Polynomial multiplication over F2: a bilinear algorithm of rank R for the full product of two n-term polynomials
# ---------------------------------------------------------------------------------------------------------------
KARATSUBA2 = {'u': [[1, 0], [0, 1], [1, 1]], 'v': [[1, 0], [0, 1], [1, 1]], 'w': [[1, 1, 0], [0, 1, 1], [0, 1, 0]]}
KARATSUBA3 = {'u': [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]],
              'v': [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]],
              'w': [[1, 1, 1, 0, 0], [0, 1, 1, 1, 0], [0, 0, 1, 1, 1], [0, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 0]]}


class PolymulFamily(Family):
    name = 'polymulF2'
    LADDER = [(2, 3), (3, 6), (4, 9), (5, 13), (6, 17), (7, 22)]           # the published ranks over F2 (Chen–Kauers 2025 table)

    def enumerate(self, n, seed):
        return [self.LADDER[i % len(self.LADDER)] for i in range(n)]

    def prompt(self, t):
        n, R = t
        return (f"Give a bilinear algorithm over the field F2 that multiplies two polynomials a(x) = a_0 + ... + a_{n - 1} x^{n - 1} and "
                f"b(x) = b_0 + ... + b_{n - 1} x^{n - 1} with {R} products. Format: rows r = 1..{R}; u[r] and v[r] are 0/1 lists of length {n}, "
                f"w[r] a 0/1 list of length {2 * n - 1}; the algorithm computes m_r = (sum_i u[r][i] a_i)(sum_j v[r][j] b_j) and c_k = sum_r "
                f"w[r][k] m_r, and it must satisfy, mod 2, sum_r u[r][i] v[r][j] w[r][k] = 1 if i + j = k else 0, for all i, j, k. "
                f"Reply with ONLY a JSON object {{\"u\": [...], \"v\": [...], \"w\": [...]}}. No prose.")

    def parse(self, reply):
        o = _json(reply)
        if not isinstance(o, dict) or not all(isinstance(o.get(k), list) and o[k] for k in 'uvw'):
            return None
        rows = [o['u'], o['v'], o['w']]
        if len({len(m) for m in rows}) != 1 or not all(_ints(r) and all(x in (0, 1) for x in r) for m in rows for r in m):
            return None
        return (tuple(map(tuple, o['u'])), tuple(map(tuple, o['v'])), tuple(map(tuple, o['w'])))

    def value(self, obj):
        return float(len(obj[0]))

    def interesting(self, obj, t):
        n = t[0]
        return all(len(r) == n for r in obj[0]) and all(len(r) == n for r in obj[1]) and all(len(r) == 2 * n - 1 for r in obj[2])

    def certify(self, obj, t):
        n, R = t
        U, V, W = obj
        bad = None
        for i, j, k in itertools.product(range(n), range(n), range(2 * n - 1)):
            s = sum(U[r][i] * V[r][j] * W[r][k] for r in range(len(U))) % 2
            if s != (1 if i + j == k else 0):
                bad = [i, j, k]
                break
        ok = len(U) <= R and bad is None and self.interesting(obj, t)
        return Verdict(ok, f"rank {len(U)}" + (f", equation ({bad[0]},{bad[1]},{bad[2]}) fails" if bad else ''), {'u': [list(r) for r in U], 'v': [list(r) for r in V], 'w': [list(r) for r in W], 'firstViolation': bad})

    def statement(self, obj, t):
        return f"the product of two {t[0]}-term polynomials over F2 in {len(obj[0])} multiplications"

    def green_controls(self, t):
        return [tuple(tuple(map(tuple, KARATSUBA2[k])) for k in 'uvw')] if t == (2, 3) else [tuple(tuple(map(tuple, KARATSUBA3[k])) for k in 'uvw')] if t == (3, 6) else []

    def red_controls(self, t):
        if t == (3, 6):
            w = [list(r) for r in KARATSUBA3['w']]
            w[0][1] ^= 1                                     # one coefficient of one output flipped
            return [(tuple(map(tuple, KARATSUBA3['u'])), tuple(map(tuple, KARATSUBA3['v'])), tuple(map(tuple, w)))]
        return []

    def baseline(self, t):
        """the dumb baseline: the schoolbook algorithm, one product a_i b_j per pair (rank n^2)"""
        n = t[0]
        U, V, W = [], [], []
        for i, j in itertools.product(range(n), range(n)):
            U.append(tuple(int(k == i) for k in range(n)))
            V.append(tuple(int(k == j) for k in range(n)))
            W.append(tuple(int(k == i + j) for k in range(2 * n - 1)))
        return (tuple(U), tuple(V), tuple(W))

    def fake(self, prompt, rng):
        return json.dumps(KARATSUBA3 if 'a_2' in prompt else KARATSUBA2)


BENCH = {f.name: f for f in (GolombFamily, CapsetFamily, CodeFamily, RamseyFamily, SumdiffFamily, KissingFamily, PolymulFamily)}
for _f in BENCH.values():
    _f.dedup = False            # a bench row is a (rung, sample) decision; the same object at two rungs is two decisions,
                                # and repeats within a rung are kept so "distinct certified objects" can be counted from key()
