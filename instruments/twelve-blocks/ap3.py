#!/usr/bin/env python3
"""ap3.py -- decider adapter: monochromatic 3-term progressions of a 2-colouring of {1..n}.

Written by the control room from the definition alone (no code of any claimant or track):
M(c) = the number of triples (a, a+d, a+2d), d >= 1, all three sites in 1..n, all of one colour, each counted once.

A file is JSON: {"items": [ITEM, ...]}. Two kinds of ITEM.

  a colouring       {"name": "...", "n": 1096, "coloring": C, "count": 63568, "delta": 0, "beats": false}
      C is one of   {"runs": [56, 12, ...], "first": "R"}      block lengths from site 1, alternating, summing to n
                    {"string": "RRBB..."}                       n letters, R or B, site 1 first
                    {"red": [1, 2, 5, ...]}                     the red sites, every other site blue
                    {"base": 2, "flip": [56, 57]}               the twelve-block colouring B_m with these sites flipped
      facts         "count": M(c) is this integer
                    "delta": M(c) - M(B_m) is this integer      (needs n = 548 m)
                    "beats": true/false, M(c) < M(B_m) strictly (needs n = 548 m)
      At least one fact. Every stated fact is decided.

  a census          {"name": "...", "census": {"m": 1, "sites": [28, 29, ...], "min": 0, "ties": 51}}
      or            {"name": "...", "census": {"m": 1, "offsets": [0, 1], "min": 0, "ties": 51}}
      Over ALL subsets x of the listed sites (at most 24), D(x) = M(B_m with x flipped) - M(B_m).
      "offsets": the sites b + e for each of the eleven interior boundaries b of B_m and each listed e.
      facts         "min": the minimum of D     "ties": how many subsets attain it (the empty one included)

How it decides. M is counted twice by two different programs: shifts of two bit masks, and a loop over midpoints
(the second only up to n = 12,000). B_m is built from the block lengths and, for even m, its count must equal
117 n^2 / 2192 - n / 2. A census walks every subset once, changing one site at a time and recounting only the
triples through that site; the baseline, every minimiser (up to 256) and 64 other subsets are then recounted
from their bits (bit masks). A fact that holds is CERTIFIED, one that fails is REFUTED with the number found, a file this
program cannot read or will not finish is REFUSED. Prints one JSON line last."""
import json, random, sys

WIDTHS = (28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28)
N_MAX = 200000          # the bit-mask count is n/2 shifts of an n-bit integer
N_TWICE = 12000         # up to here the midpoint loop counts a second time
CENSUS_MAX = 24


class Refuse(Exception):
    pass


def popcount(x):
    return bin(x).count('1')


def count_masks(col):
    """col[1..n] in {0, 1}; col[0] unused. Shifts of the red mask and of the blue mask."""
    n = len(col) - 1
    red = 0
    for i in range(n, 0, -1):
        red = (red << 1) | col[i]
    blue = ((1 << n) - 1) ^ red
    total = 0
    for d in range(1, (n - 1) // 2 + 1):
        total += popcount(red & (red >> d) & (red >> (2 * d))) + popcount(blue & (blue >> d) & (blue >> (2 * d)))
    return total


def count_midpoints(col):
    """The same number by a loop over the middle site and the step."""
    n = len(col) - 1
    total = 0
    for b in range(2, n):
        c = col[b]
        for d in range(1, min(b - 1, n - b) + 1):
            if col[b - d] == c and col[b + d] == c:
                total += 1
    return total


def count(col):
    n = len(col) - 1
    m = count_masks(col)
    if n <= N_TWICE and count_midpoints(col) != m:
        raise Refuse('the two counting programs disagree at n = %d; nothing is decided' % n)
    return m


def base(m):
    if not isinstance(m, int) or isinstance(m, bool) or m < 1:
        raise Refuse('the scale m is a positive integer')
    col = [0]
    c = 1                                            # 1 = red: the first block is red
    for w in WIDTHS:
        col += [c] * (w * m)
        c ^= 1
    return col


_base_count = {}


def base_count(m):
    if m not in _base_count:
        col = base(m)
        n = len(col) - 1
        if n > N_MAX:
            raise Refuse('n = %d is above this decider\'s limit of %d' % (n, N_MAX))
        v = count(col)
        if m % 2 == 0 and 2192 * v != 117 * n * n - 1096 * n:
            raise Refuse('B_%d counted %d, not 117 n^2/2192 - n/2: the baseline is not what the goal says' % (m, v))
        _base_count[m] = v
    return _base_count[m]


def sites_ok(xs, n, what):
    if not isinstance(xs, list) or any(not isinstance(x, int) or isinstance(x, bool) for x in xs):
        raise Refuse(what + ' is a list of integers')
    if any(x < 1 or x > n for x in xs):
        raise Refuse(what + ' has a site outside 1..%d' % n)
    if len(set(xs)) != len(xs):
        raise Refuse(what + ' lists a site twice')
    return xs


def read_coloring(item):
    C = item.get('coloring')
    if not isinstance(C, dict):
        raise Refuse('no "coloring" object')
    n = item.get('n')
    if 'base' in C:
        col = base(C['base'])
        if n is not None and n != len(col) - 1:
            raise Refuse('"n" is %s but B_%d has %d sites' % (n, C['base'], len(col) - 1))
        for p in sites_ok(C.get('flip', []), len(col) - 1, '"flip"'):
            col[p] ^= 1
        return col
    if not isinstance(n, int) or isinstance(n, bool) or n < 1:
        raise Refuse('"n" is a positive integer')
    if n > N_MAX:
        raise Refuse('n = %d is above this decider\'s limit of %d' % (n, N_MAX))
    if 'runs' in C:
        runs = C['runs']
        if not isinstance(runs, list) or any(not isinstance(r, int) or isinstance(r, bool) or r < 1 for r in runs):
            raise Refuse('"runs" is a list of positive integers')
        if sum(runs) != n:
            raise Refuse('"runs" sums to %d, not n = %d' % (sum(runs), n))
        if C.get('first') not in ('R', 'B'):
            raise Refuse('"first" is "R" or "B"')
        col = [0]
        c = 1 if C['first'] == 'R' else 0
        for r in runs:
            col += [c] * r
            c ^= 1
        return col
    if 'string' in C:
        s = C['string']
        if not isinstance(s, str) or len(s) != n or set(s) - {'R', 'B'}:
            raise Refuse('"string" is n letters, each R or B')
        return [0] + [1 if ch == 'R' else 0 for ch in s]
    if 'red' in C:
        col = [0] * (n + 1)
        for p in sites_ok(C['red'], n, '"red"'):
            col[p] = 1
        return col
    raise Refuse('"coloring" has none of: runs, string, red, base')


def decide_coloring(item):
    col = read_coloring(item)
    n = len(col) - 1
    facts = [k for k in ('count', 'delta', 'beats') if k in item]
    if not facts:
        raise Refuse('no fact to decide: give "count", "delta" or "beats"')
    for k in ('count', 'delta'):
        if k in item and (not isinstance(item[k], int) or isinstance(item[k], bool)):
            raise Refuse('"%s" is an integer' % k)
    if 'beats' in item and not isinstance(item['beats'], bool):
        raise Refuse('"beats" is true or false')
    m = count(col)
    found = {'n': n, 'count': m, 'counted': 'twice' if n <= N_TWICE else 'once (bit masks; above n = %d the second program is not run)' % N_TWICE}
    bad = []
    if 'count' in item and item['count'] != m:
        bad.append('count is %d, not %d' % (m, item['count']))
    if 'delta' in item or 'beats' in item:
        if n % 548:
            raise Refuse('n = %d is not a multiple of 548: there is no B_m to compare with' % n)
        b = base_count(n // 548)
        found['baseline'] = b
        found['delta'] = m - b
        if 'delta' in item and item['delta'] != m - b:
            bad.append('M - M(B_%d) is %d, not %d' % (n // 548, m - b, item['delta']))
        if 'beats' in item and item['beats'] != (m < b):
            bad.append('M = %d and M(B_%d) = %d: "beats" is %s' % (m, n // 548, b, 'true' if m < b else 'false'))
    text = 'n = %d, M = %d' % (n, m) + ((', M(B_%d) = %d, difference %+d' % (n // 548, found['baseline'], found['delta'])) if 'baseline' in found else '')
    return ('REFUTED' if bad else 'CERTIFIED'), (text + ('; ' + '; '.join(bad) if bad else '')), found


def census(m, F):
    """min over all subsets x of F of M(B_m with x flipped) - M(B_m), and the subsets attaining it."""
    col = base(m)
    n = len(col) - 1
    k = len(F)
    idx = {p: i for i, p in enumerate(F)}
    alone = [[0, 0] for _ in F]                      # triples through F[i] alone, by the common colour of the other two
    pair = [[[0, 0] for _ in F] for _ in F]          # triples through F[i], F[j] and a fixed third site, by its colour
    triples = set()                                  # triples of three listed sites
    for i, p in enumerate(F):
        others = []
        for d in range(1, n):
            if p + 2 * d <= n: others.append((p + d, p + 2 * d))
            if p - 2 * d >= 1: others.append((p - 2 * d, p - d))
            if p - d >= 1 and p + d <= n: others.append((p - d, p + d))
        for x, y in others:
            fx, fy = x in idx, y in idx
            if fx and fy:
                triples.add(tuple(sorted((i, idx[x], idx[y]))))
            elif fx:
                pair[i][idx[x]][col[y]] += 1
            elif fy:
                pair[i][idx[y]][col[x]] += 1
            elif col[x] == col[y]:
                alone[i][col[x]] += 1
    tri = [[] for _ in F]
    for t in triples:
        for i in t:
            tri[i].append(tuple(j for j in t if j != i))
    partners = [[(j, pair[i][j][0], pair[i][j][1]) for j in range(k) if j != i and (pair[i][j][0] or pair[i][j][1])] for i in range(k)]
    cur = [col[p] for p in F]
    delta = best = mask = 0
    winners = [0]
    ties = 1
    for step in range(1, 1 << k):
        low = step & -step
        i = low.bit_length() - 1
        old = cur[i]
        new = old ^ 1
        a = alone[i]
        delta += a[new] - a[old]
        for j, p0, p1 in partners[i]:
            if cur[j] == new:
                delta += p1 if new else p0
            else:
                delta -= p1 if old else p0
        for j, l in tri[i]:
            if cur[j] == cur[l]:
                delta += 1 if cur[j] == new else -1
        cur[i] = new
        mask ^= low
        if delta < best:
            best, ties, winners = delta, 1, [mask]
        elif delta == best:
            ties += 1
            if len(winners) < 4096: winners.append(mask)
    # recount from the bits: the baseline, the minimisers, and 64 other subsets
    b = base_count(m)
    rng = random.Random(548 * m + k)
    probes = winners[:256] + [rng.getrandbits(k) for _ in range(64)]
    want = {w: best for w in winners[:256]}
    for x in probes:
        c2 = list(col)
        for i in range(k):
            if x >> i & 1: c2[F[i]] ^= 1
        got = count_masks(c2) - b                   # the walk is the second program here
        if x in want:
            if got != best: raise Refuse('a minimiser recounted from its bits gives %+d, the walk gave %+d' % (got, best))
        else:
            # replay the walk's value for this subset directly
            d2 = walk_value(col, F, alone, pair, triples, x)
            if got != d2: raise Refuse('a subset recounted from its bits gives %+d, the walk gives %+d' % (got, d2))
    return n, b, best, ties, [[F[i] for i in range(k) if w >> i & 1] for w in winners[:256]]


def walk_value(col, F, alone, pair, triples, x):
    """D(x) from the same tables the walk uses, with no walk: used only to compare against a recount."""
    k = len(F)
    cur0 = [col[p] for p in F]
    cur = [cur0[i] ^ (x >> i & 1) for i in range(k)]
    d = 0
    for i in range(k):
        d += alone[i][cur[i]] - alone[i][cur0[i]]
        for j in range(i + 1, k):
            for c in (0, 1):
                # pair[i][j][c] counts each triple {F[i], F[j], third of colour c} once from i's side
                d += pair[i][j][c] * (int(cur[i] == c and cur[j] == c) - int(cur0[i] == c and cur0[j] == c))
    for (i, j, l) in triples:
        d += int(cur[i] == cur[j] == cur[l]) - int(cur0[i] == cur0[j] == cur0[l])
    return d


def decide_census(item):
    C = item['census']
    if not isinstance(C, dict):
        raise Refuse('"census" is an object')
    m = C.get('m')
    n = len(base(m)) - 1
    if n > N_TWICE:
        raise Refuse('a census is run up to n = %d (m = %d); this one has n = %d' % (N_TWICE, N_TWICE // 548, n))
    if 'sites' in C:
        F = sites_ok(C['sites'], n, '"sites"')
    elif 'offsets' in C:
        offs = C['offsets']
        if not isinstance(offs, list) or any(not isinstance(e, int) or isinstance(e, bool) for e in offs):
            raise Refuse('"offsets" is a list of integers')
        ends, t = [], 0
        for w in WIDTHS[:-1]:
            t += w * m
            ends.append(t)
        F = sites_ok([b + e for b in ends for e in offs], n, 'the sites from "offsets"')
    else:
        raise Refuse('a census names "sites" or "offsets"')
    if not F:
        raise Refuse('a census needs at least one site')
    if len(F) > CENSUS_MAX:
        raise Refuse('%d sites: this decider walks at most 2^%d subsets; a larger family needs a proof with a finite core' % (len(F), CENSUS_MAX))
    facts = [f for f in ('min', 'ties') if f in C]
    if not facts or any(not isinstance(C[f], int) or isinstance(C[f], bool) for f in facts):
        raise Refuse('a census states "min" and/or "ties", integers')
    n, b, best, ties, winners = census(m, F)
    bad = []
    if 'min' in C and C['min'] != best: bad.append('the minimum is %+d, not %+d' % (best, C['min']))
    if 'ties' in C and C['ties'] != ties: bad.append('%d subsets attain it, not %d' % (ties, C['ties']))
    text = 'm = %d, n = %d, %d sites, 2^%d subsets: minimum %+d, attained by %d' % (m, n, len(F), len(F), best, ties)
    return ('REFUTED' if bad else 'CERTIFIED'), (text + ('; ' + '; '.join(bad) if bad else '')), \
        {'m': m, 'n': n, 'sites': F, 'baseline': b, 'min': best, 'ties': ties, 'minimisers (flipped sites, first 256)': winners}


def main():
    try:
        doc = json.load(open(sys.argv[1]))
        items = doc.get('items') if isinstance(doc, dict) else None
        if not isinstance(items, list) or not items:
            raise Refuse('the file is {"items": [...]} with at least one item')
        if len(items) > 200:
            raise Refuse('at most 200 items in one file')
    except Refuse as e:
        print(json.dumps({'verdict': 'REFUSED', 'summary': str(e)})); return
    except Exception as e:
        print(json.dumps({'verdict': 'REFUSED', 'summary': 'not a readable JSON file: ' + str(e)[:200]})); return
    out = []
    for k, item in enumerate(items):
        name = str(item.get('name', k + 1)) if isinstance(item, dict) else str(k + 1)
        try:
            if not isinstance(item, dict): raise Refuse('an item is an object')
            word, text, found = decide_census(item) if 'census' in item else decide_coloring(item)
        except Refuse as e:
            word, text, found = 'REFUSED', str(e), {}
        out.append({'name': name, 'word': word, 'text': text, 'found': found})
    words = [o['word'] for o in out]
    verdict = 'REFUTED' if 'REFUTED' in words else 'CERTIFIED' if all(w == 'CERTIFIED' for w in words) else 'REFUSED'
    tally = ', '.join('%d %s' % (words.count(w), w) for w in ('CERTIFIED', 'REFUTED', 'REFUSED') if words.count(w))
    show = out if len(out) <= 4 else [o for o in out if o['word'] != 'CERTIFIED'][:4]
    summary = '%d item%s: %s' % (len(out), '' if len(out) == 1 else 's', tally) + ''.join(' · %s: %s' % (o['name'], o['text']) for o in show)
    print(json.dumps({'verdict': verdict, 'summary': summary, 'items': out}))


if __name__ == '__main__':
    main()
