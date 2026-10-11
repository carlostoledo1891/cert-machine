#!/usr/bin/env python3
"""ref.py — the slow reference for one prime gate of the lonely runner proofs, written straight from the
definitions in README.md (every multiset, every lift, every time). Standard library only. It is the oracle the
battery compares lr.c with on small k and p; it is never used on a real gate.

usage: python3 -I ref.py <k> <p>     -> JSON record on stdout
"""
import itertools
import json
import math
import sys


def d(x, N):
    x %= N
    return min(x, N - x)


def cls(x, p):
    """the class of x in Z_p^x / {+1,-1}, represented in 1..(p-1)/2"""
    x %= p
    return min(x, p - x)


def canon(row, p):
    """lexicographic minimum of the sorted unit images of a multiset of classes"""
    return min(tuple(sorted(cls(u * x, p) for x in row)) for u in range(1, (p - 1) // 2 + 1))


def witness(w, l, p, K1):
    N = l * p
    return any(all(K1 * d(c * x, N) >= N for x in w) for c in range(1, N))


def gcd_proper(w, l):
    return any(math.gcd(l, *[w[j] for j in range(len(w)) if j != i]) > 1 for i in range(len(w)))


def proper(w, l, p, K1):
    return gcd_proper(w, l) or witness(w, l, p, K1)


def lifts(w, l, f, p):
    """the f^k lifts of w (a vector modulo lp) to level f*l"""
    for a in itertools.product(range(f), repeat=len(w)):
        yield tuple(w[i] + a[i] * l * p for i in range(len(w)))


def near_gcd(w, L, K1):
    """the few-exception shift lemma: some prime d | L with 2 <= e and e*ceil(2d/K1) < d"""
    for dd in [q for q in range(2, L + 1) if L % q == 0 and all(q % r for r in range(2, q))]:
        e = sum(1 for x in w if x % dd)
        if e >= 2 and e * (-(-2 * dd // K1)) < dd:
            return True
    return False


def gate(k, p, levels=(2, 4, 8, 16, 32)):
    K1 = k + 1
    n = (p - 1) // 2
    m = (p - 1) // K1
    times = range(1, n + 1)
    covers = lambda v, c: K1 * d(c * v, p) < p
    rows = set()
    for row in itertools.combinations_with_replacement(range(1, n + 1), k):
        sup = set(row)
        if all(any(covers(v, c) for v in sup) for c in times):
            rows.add(canon(row, p))
    rows = sorted(rows)
    # minimal covers, up to units, by size (supports of the improper rows reduced to minimal)
    minimal = {}
    for s in range(1, k + 1):
        for T in itertools.combinations(range(1, n + 1), s):
            if all(any(covers(v, c) for v in T) for c in times) and \
               all(not all(any(covers(v, c) for v in T if v != x) for c in times) for x in T):
                minimal.setdefault(s, set()).add(canon(T, p))
    out = {'k': k, 'p': p, 'n': n, 'm': m, 'rows': len(rows),
           'minimalCovers': {str(s): len(v) for s, v in sorted(minimal.items())}, 'perRow': []}
    L = K1
    verdict = 'CLOSED'
    jempty = True
    for r in rows:
        rec = {'row': list(r), 'F': []}
        cur = [tuple(r)]
        l = 1
        survived = True
        for lv in levels:
            f = lv // l
            nxt = [w for v in cur for w in lifts(v, l, f, p) if not proper(w, lv, p, K1)]
            # the chain must equal the improper lifts taken directly from level 1 (the monotonicity the method rests on)
            if lv ** k <= 200000:
                direct = {w for w in lifts(tuple(r), 1, lv, p) if not proper(w, lv, p, K1)}
                assert direct == set(nxt), ('chain != direct', r, lv)
            rec['F'].append(len(nxt))
            cur, l = nxt, lv
            if not cur:
                survived = False
                break
        if survived:
            wf = [w for w in lifts(tuple(r), 1, L, p) if not witness(w, L, p, K1)]
            after_gcd = [w for w in wf if not gcd_proper(w, L)]
            after_ng = [w for w in after_gcd if not near_gcd(w, L, K1)]
            rec['terminal'] = {'witnessFree': len(wf), 'improperAfterGcd': len(after_gcd), 'improperAfterNearGcd': len(after_ng)}
            if after_gcd:
                jempty = False
            if after_ng:
                verdict = 'OPEN'
        out['perRow'].append(rec)
    out['verdict'] = verdict
    out['jEmpty'] = jempty and verdict == 'CLOSED'
    return out


if __name__ == '__main__':
    k, p = int(sys.argv[1]), int(sys.argv[2])
    print(json.dumps(gate(k, p)))
