#!/usr/bin/env python3
"""judge.py — the finite facts of "twelve blocks at finite length".

Decides D1–D10 and runs the controls K1–K9 of notes/twelve-blocks-preregistration-2026-11-19.md, written after that
file was committed. No code of either track of the multitrack run is read or imported; the inputs are the
statements and data pinned in corpus/twelve-blocks. Counting is done by ap3.py (the control room's counter,
written from the definition before the run) and, for D3, by a numpy routine tied to the definition on B_1.

THE THEOREM IS NOT DECIDED HERE. Each statement is decided on its stated finite domain: CERTIFIED (it holds on
all of it), REFUTED (a counterexample, printed), REFUSED (not finished or not readable; not a refutation).

  python3 instruments/twelve-blocks/judge.py --write      decide everything, write certs/twelve-blocks.json (~15 min, 7 processes)
  python3 instruments/twelve-blocks/judge.py --check      re-check the pins and the quick statements (D1, D2 to n = 10, D4, D8)
  python3 instruments/twelve-blocks/judge.py --only D7    one statement, printed
  python3 instruments/twelve-blocks/judge.py --redo D9 L1 decide the named statements again and rewrite them in the record,
                                                          keeping the first verdict under "amendments" (amendment A2)"""
import hashlib, json, os, random, re, shutil, subprocess, sys, tempfile, time
from fractions import Fraction as Fr
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import ap3                                               # noqa: E402  (count_masks, count, base, census)

CORPUS = os.path.join(ROOT, 'corpus', 'twelve-blocks')
RECORD = os.path.join(ROOT, 'certs', 'twelve-blocks.json')
PREREG = 'notes/twelve-blocks-preregistration-2026-11-19.md'
EDGES = (28, 34, 62, 99, 158, 274, 390, 449, 486, 514, 520)
SEED = 20261119
PROCS = max(1, (os.cpu_count() or 2) - 1)
SAYS_FIRST = ('The theorem (V(548m) = M(B_m) for every even m >= 118 and odd m >= 123; V(n) to within a bounded error at every n; '
              'the exact V(n) for n >= 92,000) is NOT decided here. It was proposed by two AI models working together and read by each '
              'other, and it rests on the delta-three certificates (not refereed) and on two paper lemmas no machine has checked. This '
              'decides finite facts only: the constants, identities, counts and tables the proofs display, each on a stated finite domain.')


def f(n): return Fr(117 * n * n, 2192) - Fr(n, 2)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def out(verdict, text, **detail): return {'verdict': verdict, 'text': text, 'detail': detail}
def control(name, refused, text): return {'control': name, 'refused': bool(refused), 'text': text}


def rounded(n):
    """C_n as col[1..n] in {0,1} (1 = red): the colour changes after site floor(n B_j / 548 + 1/2)."""
    cuts = [(2 * n * b + 548) // 1096 for b in EDGES]
    col = [0] * (n + 1)
    for p in range(1, n + 1):
        col[p] = 1 - (sum(1 for c in cuts if c < p) & 1)
    return col, cuts


def flipped(col, sites):
    c = list(col)
    for p in sites: c[p] ^= 1
    return c


def M_plain(s):
    """M by the definition, s[1..n]; for short words."""
    n = len(s) - 1
    return sum(1 for d in range(1, (n - 1) // 2 + 1) for a in range(1, n - 2 * d + 1) if s[a] == s[a + d] == s[a + 2 * d])


# ------------------------------------------------------------------------------------------------ D1
def D1():
    p = subprocess.run(['node', os.path.join(HERE, 'd1.js'), '948', '947'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
    if p.returncode: return out('REFUSED', 'the verifier did not run: ' + p.stderr.decode()[-300:]), []
    d = json.loads(p.stdout.decode().strip().splitlines()[-1])
    c948, c947 = d['inner']
    ok = (c948['verdict'] == 'VERIFIED' and d['theorem'] == 'VERIFIED' and d['cover'] is True and len(d['slabs']) == 4
          and all(s['verdict'] == 'VERIFIED' and s['above1over3792'] for s in d['slabs']) and d['widthsSum'] == '1')
    text = 'inner certificate with N + w w^T/948: %s by instruments/delta3/verify.js; four slabs VERIFIED, each bound > 1/3792; cover complete: %s' % (c948['verdict'], d['cover'])
    return out('CERTIFIED' if ok else 'REFUTED', text, node=d), [control('K1 the constant 947', c947['verdict'] != 'VERIFIED', '947: %s (%s)' % (c947['verdict'], c947['why']))]


# ------------------------------------------------------------------------------------------------ D2
def area4(n):
    """4 * area of {(x, y) in [q-1, q] x [p-1, p] : 0 <= 2y - x <= n}, for p, q in 1..n, by integrating the section
    length over x. The section is linear on the cell (its kinks 2p-2, 2p, 2p-2-n, 2p-n are integers), so the trapezoid
    rule is exact; lengths are multiples of 1/2, so 4 * area is an integer."""
    def twice_len(x, p):                                   # 2 * |[p-1, p] ∩ [x/2, (n+x)/2]|
        return max(0, min(2 * p, n + x) - max(2 * p - 2, x))
    return [[0] * (n + 1)] + [[0] + [twice_len(q - 1, p) + twice_len(q, p) for q in range(1, n + 1)] for p in range(1, n + 1)]


def d2_length(args):
    n, words, variants = args
    A = area4(n)
    rcoef = [[0] * (n + 1) for _ in range(n + 1)]
    for p in range(1, n + 1):
        for q in range(1, n + 1):
            t = 2 * p - q
            rcoef[p][q] = (t == 1) - (t == 0) + (t == n) - (t == n + 1)
    T = (n - 1) ** 2 // 4
    bad, badR, missed = None, None, {'without R': True, 'with -R': True, 'd = 0 admitted': True, 'T unrounded': n % 2 == 0}
    for w in words:
        s = [0] + [1 if w >> i & 1 else -1 for i in range(n)]
        Se = sum(s[2::2]); So = sum(s[1::2])
        Q4 = sum(s[p] * s[q] * A[p][q] for p in range(1, n + 1) for q in range(1, n + 1))        # 4 n^2 Q(phi_s)
        R4 = sum(s[p] * s[q] * rcoef[p][q] for p in range(1, n + 1) for q in range(1, n + 1))    # 4 R_n(s)
        M = M_plain(s)
        lhs = 16 * M
        rhs = 4 * T - 6 * n + 2 * (Se * Se + So * So) + Q4 + R4
        if lhs != rhs and bad is None: bad = {'n': n, 'word': w, '16M': lhs, 'right side': rhs}
        J1 = sum(1 for p in range(1, n, 2) if s[p] != s[p + 1]); J2 = sum(1 for p in range(2, n, 2) if s[p] != s[p + 1])
        lim = 4 * J1 if n % 2 == 0 else 2 * (J1 + J2) + 2
        if abs(R4) > lim and badR is None: badR = {'n': n, 'word': w, '4R': R4, 'limit': lim}
        if variants:
            if lhs != rhs - R4: missed['without R'] = False
            if lhs != rhs - 2 * R4: missed['with -R'] = False
            if lhs + 16 * n != rhs: missed['d = 0 admitted'] = False
            if n % 2 == 0 and lhs != rhs + 1: missed['T unrounded'] = False        # 4 (n-1)^2/4 = 4T + 1 at even n
    return n, len(words), bad, badR, missed


def D2(nmax=14, rnd=True):
    rng = random.Random(SEED)
    jobs = [(n, range(1 << n), n <= 8) for n in range(2, nmax + 1)]
    if rnd: jobs += [(n, [rng.getrandbits(n) for _ in range(200)], False) for n in range(15, 81)]
    with Pool(PROCS) as P: res = P.map(d2_length, jobs)
    bad = [r[2] for r in res if r[2]]; badR = [r[3] for r in res if r[3]]
    total = sum(r[1] for r in res)
    missed = {k: all(r[4][k] for r in res if r[0] <= 8 and (k != 'T unrounded' or r[0] % 2 == 0)) for k in ('without R', 'with -R', 'd = 0 admitted', 'T unrounded')}
    text = 'identity and the bounds on R_n: %d colourings (every colouring of every length 2..%d%s)' % (total, nmax, '; 200 seeded at each length 15..80' if rnd else '')
    verdict = 'REFUTED' if bad or badR else 'CERTIFIED'
    return (out(verdict, text + ('' if verdict == 'CERTIFIED' else ': FAILS'), colourings=total, identityCounterexample=bad[:1], boundCounterexample=badR[:1]),
            [control('K2 the identity ' + k, not v, 'fails on some colouring of length <= 8' if not v else 'holds on every colouring of length <= 8: NOT refused') for k, v in missed.items()])


# ------------------------------------------------------------------------------------------------ D3
def flip_costs(col):
    """L[p] = M(col with site p flipped) - M(col), for every site, counted from triples with numpy (exact int64)."""
    import numpy as np
    n = len(col) - 1
    s = np.array(col[1:], dtype=np.int8)
    before = np.zeros(n, dtype=np.int64); after = np.zeros(n, dtype=np.int64)
    for d in range(1, (n - 1) // 2 + 1):
        a, b, c = s[:n - 2 * d], s[d:n - d], s[2 * d:]
        ab, bc, ac = a == b, b == c, a == c
        mono = ab & bc
        before[:n - 2 * d] += mono; before[d:n - d] += mono; before[2 * d:] += mono
        after[:n - 2 * d] += bc & ~ab          # the other two agree and differ from the left site
        after[d:n - d] += ac & ~ab             # ... from the middle site
        after[2 * d:] += ab & ~bc              # ... from the right site
    return (after - before).tolist()


def d3_scale(m):
    col = ap3.base(m); n = len(col) - 1; o = m % 2
    L = flip_costs(col)
    outside = [p for p in range(1, n + 1) if not any(b * m - 2 * m < p <= b * m + 2 * m for b in EDGES)]
    least = min((L[p - 1], p) for p in outside)
    return m, n, len(outside), least[0], least[1], 2 * m + 2 - o


def D3(scales=tuple(range(1, 13)) + (118, 123)):
    try: import numpy  # noqa: F401
    except Exception as e: return out('REFUSED', 'numpy is not available: ' + str(e)), []
    col = ap3.base(1); L = flip_costs(col); b0 = ap3.count(col)               # tie the numpy routine to the definition
    if any(ap3.count_masks(flipped(col, [p])) - b0 != L[p - 1] for p in range(1, 549)): return out('REFUSED', 'the numpy routine disagrees with a recount on B_1'), []
    with Pool(min(PROCS, 4)) as P: res = P.map(d3_scale, scales)
    bad = [r for r in res if r[3] < r[5]]
    attained = [r[0] for r in res if r[3] == r[5]]
    text = 'least single-flip cost outside the windows >= 2m+2-o at m = %s' % ', '.join(str(r[0]) for r in res)
    return (out('REFUTED' if bad else 'CERTIFIED', text + ('' if not bad else ': FAILS at m = %s' % bad[0][0]), scales=[{'m': r[0], 'n': r[1], 'sites outside': r[2], 'least cost': r[3], 'at site': r[4], 'bound': r[5]} for r in res],
                numpyTiedToDefinition='all 548 single flips of B_1 recounted'),
            [control('K3 the bound 2m+3-o', bool(attained), 'the least cost equals 2m+2-o at m = %s' % attained if attained else 'never attained: NOT refused')])


# ------------------------------------------------------------------------------------------------ D4
def d4_max(o):
    """max of 1 + max(|a|,|b|) + k + |a+b| over integers with |a|+|b| <= k, k = a+b (mod 2),
    k^2/237 + 2(a-o)^2 + 2(b+o)^2 <= k + 6o. The constraint forces k <= 243 and |a-o|, |b+o| <= 5, so the box
    k <= 400, |a|, |b| <= 12 contains every feasible point."""
    best, arg = None, None
    for k in range(0, 401):
        for a in range(-12, 13):
            for b in range(-12, 13):
                if abs(a) + abs(b) > k or (k - a - b) % 2: continue
                if k * k + 474 * (a - o) ** 2 + 474 * (b + o) ** 2 > 237 * k + 1422 * o: continue
                v = 1 + max(abs(a), abs(b)) + k + abs(a + b)
                if best is None or v > best: best, arg = v, (k, a, b)
    return best, arg


def D4():
    G = {o: d4_max(o) for o in (0, 1)}
    cut = {o: min(m for m in range(1, 1000) if m % 2 == o and all(2 * mm + 2 - o >= G[o][0] for mm in range(m, 1000, 2))) for o in (0, 1)}
    mk = min(Fr(k * k, 237) - k for k in range(0, 1000))
    def ceil(x): return -((-x.numerator) // x.denominator)
    lows = {o: ceil((mk - 6 * o) / 4) for o in (0, 1)}
    even = (Fr(-237, 4) - 11) / 4
    odd = (Fr(1, 4) + Fr(1, 2) - Fr(237, 4) - Fr(23, 2)) / 4          # T_n gains 1/4, the parity squares give >= 1/2, R_n >= -(k + 23/2)
    ok = (G[0][0] == 237 and G[1][0] == 244 and cut == {0: 118, 1: 123} and mk == Fr(-14042, 237) and lows == {0: -14, 1: -16}
          and even == Fr(-281, 16) and odd == Fr(-35, 2) and 4 * Fr(117, 2192) == Fr(1, 4) - Fr(5, 137))
    text = 'maxima %d (at k, a, b = %s) and %d (at %s); cutoffs even m >= %d, odd m >= %d; min k^2/237 - k = %s; bands -%d, -%d; %s, %s' % (
        G[0][0], G[0][1], G[1][0], G[1][1], cut[0], cut[1], mk, -lows[0], -lows[1], even, odd)
    return (out('CERTIFIED' if ok else 'REFUTED', text, maxima={'even': G[0][0], 'odd': G[1][0]}, cutoffs={'even': cut[0], 'odd': cut[1]}),
            [control('K4 the maxima 236 and 243', (G[0][0], G[1][0]) != (236, 243), 'the maxima are %d and %d' % (G[0][0], G[1][0])),
             control('K4 the cutoffs 116 and 121', not (2 * 116 + 2 >= G[0][0]) and not (2 * 121 + 1 >= G[1][0]), '2*116+2 = 234 < %d and 2*121+1 = 243 < %d' % (G[0][0], G[1][0]))])


# ------------------------------------------------------------------------------------------------ D5
def family22(m): return [b * m + e for b in EDGES for e in (0, 1)]


def d5_base(m):
    col = ap3.base(m); n = len(col) - 1
    v = ap3.count(col)                                    # two programs up to n = 12,000, bit masks above
    return m, n, v, f(n) + (m % 2) == v


def d5_census(m):
    F = family22(m)
    n, b, best, ties, winners = ap3.census(m, F)
    idx = {p: i for i, p in enumerate(F)}
    return m, best, ties, sorted(tuple(sorted(idx[p] for p in w)) for w in winners)


def d5_coeffs(m):
    """The 22 single-flip and 231 pair-flip costs, each by recounting the whole colouring."""
    col = ap3.base(m); F = family22(m); b0 = ap3.count_masks(col)
    single = [ap3.count_masks(flipped(col, [p])) - b0 for p in F]
    pair = [ap3.count_masks(flipped(col, [F[i], F[j]])) - b0 for i in range(22) for j in range(i + 1, 22)]
    return m, single, pair


def D5():
    with Pool(PROCS) as P:
        bases = P.map(d5_base, list(range(1, 25)) + [118, 123, 192, 195])
        cens = P.map(d5_census, range(1, 9))
        coef = P.map(d5_coeffs, range(1, 9))
    badb = [b for b in bases if not b[3]]
    odd = [c for c in cens if c[0] % 2]; even = [c for c in cens if c[0] % 2 == 0]
    cen_ok = all(c[1] == 0 for c in cens) and all(c[2] == 51 and c[3] == odd[0][3] for c in odd) and all(c[2] == 1 and c[3] == [()] for c in even)
    C = {c[0]: c for c in coef}
    coef_ok = all(C[m][1] == C[m + 2][1] and C[m][2] == C[m + 2][2] for m in range(1, 7))
    doc = json.load(open(os.path.join(CORPUS, 'run', 'gpt', 'threshold_counts.json')))
    thr = [ap3.decide_coloring(it) for it in doc['items']]
    thr_ok = len(thr) == 6 and all(t[0] == 'CERTIFIED' for t in thr)
    ok = not badb and cen_ok and coef_ok and thr_ok
    F1 = family22(1); i28, i34 = F1.index(28), F1.index(34)
    k = 0
    for i in range(22):
        for j in range(i + 1, 22):
            if (i, j) == (i28, i34): mixed = C[1][2][k] - C[1][1][i] - C[1][1][j]
            k += 1
    col1 = ap3.base(1); b1 = ap3.count(col1)
    thirds = sorted(r for r in range(1, 549) if r not in (28, 34) and (2 * r == 62 or 2 * 28 - 34 == r or 2 * 34 - 28 == r))
    swap4 = ap3.count_masks(flipped(ap3.base(4), [112, 113])) - ap3.count(ap3.base(4))
    ctrl = [control('K5 the odd tie count 50', odd[0][2] != 50, 'the census finds %d' % odd[0][2]),
            control('K5 the zero mask unique at every scale', any(c[2] != 1 for c in cens), 'at m = 1 there are %d minimisers' % odd[0][2]),
            control('K5 the first-boundary swap costs m (the run\'s plant)', swap4 != 4, 'at m = 4 the swap costs %+d' % swap4),
            control('K5 the pair weight without the midpoint (-2 for sites 28, 34)', mixed != -2, 'the mixed term is %+d; third sites %s' % (mixed, thirds))]
    text = ('M(B_m) = f + (m mod 2) at %d scales (m = 1..24, 118, 123, 192, 195); six threshold counts; census m = 1..8: minimum 0, 51 masks at odd m (one index set), '
            'the zero mask alone at even m; 253 flip costs equal at m and m+2, m = 1..6' % len(bases))
    return (out('CERTIFIED' if ok else 'REFUTED', text, baseline=[{'m': b[0], 'n': b[1], 'M': b[2]} for b in bases], baselineFails=badb, census=[{'m': c[0], 'min': c[1], 'ties': c[2]} for c in cens],
                censusOK=cen_ok, coefficientsOK=coef_ok, thresholdCounts=[t[1] for t in thr], mixed_28_34=mixed, oddMinimisers=[list(w) for w in odd[0][3]]), ctrl)


# ------------------------------------------------------------------------------------------------ D6
def d6_piece(args):
    m, windows, expect = args
    lo, hi = {1: (-1, 2), 2: (-3, 4), 3: (-5, 6)}[m]
    F = [EDGES[w] * m + e for w in windows for e in range(lo, hi + 1)]
    n, b, best, ties, winners = ap3.census(m, F)
    inside = sorted(tuple(x) for x in expect if set(x) <= set(F))
    got = sorted(tuple(sorted(w)) for w in winners)
    return m, list(windows), len(F), best, ties, got == inside and ties == len(inside)


def D6(odd_minimisers):
    rng = random.Random(SEED + 6)
    def as_sites(m): return [[family22(m)[i] for i in w] for w in odd_minimisers]
    jobs = [(1, tuple(range(i, i + 6)), as_sites(1)) for i in range(6)]
    seen = {j[1] for j in jobs}
    while len(jobs) < 20:
        w = tuple(sorted(rng.sample(range(11), 6)))
        if w not in seen: seen.add(w); jobs.append((1, w, as_sites(1)))
    j2 = [(2, tuple(range(i, i + 3)), [[]]) for i in range(9)]; seen = {j[1] for j in j2}
    while len(j2) < 39:
        w = tuple(sorted(rng.sample(range(11), 3)))
        if w not in seen: seen.add(w); j2.append((2, w, [[]]))
    j3 = [(3, (i, j), as_sites(3)) for i in range(11) for j in range(i + 1, 11)]
    jobs += j2 + j3
    with Pool(PROCS) as P: res = P.map(d6_piece, jobs, chunksize=1)
    bad = [r for r in res if r[3] != 0 or not r[5]]
    text = '%d pieces of 24 sites walked in full (20 at m = 1, 39 at m = 2, 55 at m = 3): minimum 0, minimisers exactly the expected ones' % len(res)
    return (out('REFUTED' if bad else 'CERTIFIED', text + ('' if not bad else ': FAILS on %s' % (bad[0][:5],)), pieces=[{'m': r[0], 'windows': [w + 1 for w in r[1]], 'min': r[3], 'ties': r[4]} for r in res]),
            [control('K6 a piece\'s tie count raised by one', res[0][4] + 1 != res[0][4] and res[0][5], 'the first piece has exactly %d minimisers' % res[0][4])])


# ------------------------------------------------------------------------------------------------ D7, D9, D10
def count_rounded(n):
    col, _ = rounded(n)
    return n, ap3.count_masks(col)


def witness_sites(n, offsets):
    _, cuts = rounded(n)
    return [cuts[j - 1] + e for j, e in offsets]


def count_witness(args):
    n, offsets = args
    col, _ = rounded(n)
    return n, ap3.count_masks(flipped(col, witness_sites(n, offsets)))


def D7():
    with Pool(PROCS) as P: res = dict(P.map(count_rounded, range(1, 3289), chunksize=16))
    small = all(ap3.count_midpoints(rounded(n)[0]) == res[n] for n in range(1, 301))          # the second program on the short lengths
    ex = {n: res[n] - f(n) for n in res}
    periodic = [n for n in range(1, 2193) if ex[n] != ex[n + 1096]]
    per = {n % 1096: ex[n] for n in range(1097, 2193)}
    lo, hi = min(per.values()), max(per.values())
    argmax = sorted(r for r, v in per.items() if v == hi)
    ok = small and not periodic and lo == Fr(-369, 548) and hi == Fr(1453, 137) and argmax == [220, 876]
    p548 = [n for n in range(1, 2741) if ex[n] != ex[n + 548]]
    text = 'M(C_n) - f(n) for n = 1..3288: equal at n and n + 1096 for every n <= 2192; minimum %s, maximum %s at residues %s' % (lo, hi, argmax)
    return (out('CERTIFIED' if ok else 'REFUTED', text, firstNonPeriodic=periodic[:1], secondProgramTo300=small),
            [control('K7 period 548', bool(p548), 'fails first at n = %s' % p548[0] if p548 else 'holds: NOT refused'),
             control('K7 the maximum 1452/137', hi != Fr(1452, 137), 'the maximum is %s' % hi)]), ex


def D8():
    oeis = {}
    for l in open(os.path.join(CORPUS, 'oeis-b121385.txt')):
        if l.strip() and not l.startswith('#'): a, b = l.split()[:2]; oeis[int(a)] = int(b)
    bad = [n for n, v in oeis.items() if not (f(n) - Fr(281, 16) <= v <= f(n) + Fr(1453, 137))]
    V = {}
    for n in range(1, 15):
        best = None
        for w in range(1 << (n - 1)):                      # colour exchange: site n fixed blue
            s = [0] + [1 if w >> i & 1 else -1 for i in range(n)]
            v = M_plain(s)
            if best is None or v < best: best = v
        V[n] = best
    same = all(V[n] == oeis[n] for n in V)
    doc = json.load(open(os.path.join(CORPUS, 'run', 'claude', 'alln_anchors.json')))
    anc = [ap3.decide_coloring(it) for it in doc['items']]
    ok = len(oeis) == 45 and sorted(oeis) == list(range(1, 46)) and not bad and same and all(a[0] == 'CERTIFIED' for a in anc)
    below = [n for n, v in oeis.items() if v < f(n)]
    gap = [float(v - f(n)) for n, v in oeis.items()]
    text = 'f(n) - 281/16 <= V(n) <= f(n) + 1453/137 at the 45 lengths of OEIS A121385; V(n), n <= 14, recomputed by exhaustion and equal; %d anchors recounted' % len(anc)
    return (out('CERTIFIED' if ok else 'REFUTED', text, V_minus_f={'min': min(gap), 'max': max(gap)}, exhaustion={str(n): V[n] for n in V}, anchors=[a[1] for a in anc]),
            [control('K8 V(n) >= f(n) for every n', bool(below), 'V(n) < f(n) at n = %s' % below[:6])])


def table():
    return json.load(open(os.path.join(CORPUS, 'run', 'gpt', 'optimum-residues.json')))


def D9():
    T = table()
    by = {row['residue']: row for row in T}
    shape = len(T) == 1096 and sorted(by) == list(range(1096))
    c = [by[r]['excess_numerator'] for r in range(1096)] if shape else []
    mult = [by[r]['labeled_minimizers'] for r in range(1096)] if shape else []
    rd = [by[r]['rounded_delta'] for r in range(1096)] if shape else []
    facts = shape and c[0] == 0 and mult[0] == 2 and c[548] == 2192 and mult[548] == 102 and min(c) == -1476 and max(c) == 3516 and min(mult) == 2 and max(mult) == 536 \
        and sum(1 for x in rd if x == 0) == 500 and max(rd) == 0 and min(rd) >= -10          # A2: the field is the proposed minimum minus M(C_n)
    if not shape: return out('REFUSED', 'the table is not 1,096 rows with residues 0..1095'), [], None
    with Pool(PROCS) as P:
        cn = dict(P.map(count_rounded, [r + 3288 for r in range(1096)], chunksize=8))
        wn = dict(P.map(count_witness, [(r + 3288, by[r]['example_boundary_offsets']) for r in range(1096)], chunksize=8))
    def val(n, cr): return Fr(117 * n * n + cr, 2192) - Fr(n, 2)
    badrd = [r for r in range(1096) if cn[r + 3288] - val(r + 3288, c[r]) != -rd[r]]
    wit_small = sum(1 for r in range(1096) if wn[r + 3288] == val(r + 3288, c[r]))
    lowered = [r for r in range(1096) if cn[r + 3288] - val(r + 3288, c[r] - 2192) != -rd[r]]
    ok = facts and not badrd
    text = ('1,096 rows; c_0 = 0 (2 minimisers), c_548 = 2192 (102); c_r in [%d, %d]; multiplicities in [%d, %d]; rounded_delta = 0 on %d rows, never below %d; '
            'M(C_n) minus the row\'s value equals -rounded_delta at n = r + 3288 on %d of 1,096 rows' % (min(c), max(c), min(mult), max(mult), sum(1 for x in rd if x == 0), min(rd), 1096 - len(badrd)))
    return (out('CERTIFIED' if ok else 'REFUTED', text, tableFacts=bool(facts), firstBadRow=badrd[:1],
                reportedNotAVerdict='the row\'s witness attains the row\'s value at n = r + 3288 on %d of 1,096 rows (the claim asserts it only from 92,000)' % wit_small),
            [control('K9 a row with c_r lowered by 2192', len(lowered) == 1096, 'every lowered row disagrees with the count of C_n' if len(lowered) == 1096 else '%d lowered rows still agree: NOT refused' % (1096 - len(lowered)))], by)


def D10(by):
    rng = random.Random(SEED + 10)
    c = {r: by[r]['excess_numerator'] for r in by}
    pick = [0, 548, 220, 876, min(c, key=c.get), max(c, key=c.get)]
    while len(pick) < 24:
        r = rng.randrange(1096)
        if r not in pick: pick.append(r)
    def least(r): return 92000 + ((r - 92000) % 1096)
    jobs = [(least(r), by[r]['example_boundary_offsets']) for r in pick]
    rdrop = next(r for r in pick if by[r]['example_boundary_offsets'])
    drop = (least(rdrop), by[rdrop]['example_boundary_offsets'][1:])
    doc = json.load(open(os.path.join(CORPUS, 'run', 'gpt', 'period-witnesses.json')))
    with Pool(PROCS) as P:
        res = P.map(count_witness, jobs + [drop], chunksize=1)
        gw = P.map(ap3.decide_coloring, doc['items'], chunksize=1)
    def val(n, cr): return Fr(117 * n * n + cr, 2192) - Fr(n, 2)
    rows = [{'residue': r, 'n': n, 'M of the witness': m, 'the row\'s value': str(val(n, c[r])), 'equal': m == val(n, c[r])} for r, (n, m) in zip(pick, res[:-1])]
    ok = all(x['equal'] for x in rows) and all(g[0] == 'CERTIFIED' for g in gw) and all(x['n'] >= 92000 and x['n'] % 1096 == x['residue'] for x in rows)
    text = 'the witness has M = (117 n^2 + c_r)/2192 - n/2 at the least n >= 92,000 of %d residue classes; %d of GPT\'s witnesses recounted. This is V(n) <= that value at those lengths, nothing more' % (len(rows), len(gw))
    return (out('CERTIFIED' if ok else 'REFUTED', text, rows=rows, gptWitnesses=[g[1] for g in gw]),
            [control('K9 a witness with its first listed site dropped', res[-1][1] != val(drop[0], c[rdrop]), 'residue %d, n = %d: M = %d against %s' % (rdrop, drop[0], res[-1][1], val(drop[0], c[rdrop])))])


# ------------------------------------------------------------------------------------------------ L1 (amendment A2)
LEAN = os.path.join(HERE, 'lean')
STANDARD = ['propext', 'Classical.choice', 'Quot.sound']
STATED = 'theorem signature_period (m : Int) (hm : 1 ≤ m) : signature (m + 2) = signature m'


def L1():
    """Recompile the Lean file in a scratch folder and rerun its checks. reference.py is the brief's appendix, verbatim:
    it is the thing the Lean definitions are compared with, not a decider."""
    src = open(os.path.join(LEAN, 'TwelveBlocks.lean')).read()
    clean = not re.search(r'\bsorry\b|native_decide|ofReduceBool|^axiom\b', src, re.M)
    tmp = tempfile.mkdtemp(prefix='twelve-blocks-lean-')
    for fn in ('TwelveBlocks.lean', 'Planted.lean', 'lean-toolchain', 'compare.py', 'reference.py'): shutil.copy(os.path.join(LEAN, fn), tmp)
    try:
        ver = subprocess.run(['lean', '--version'], cwd=tmp, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=300).stdout.decode()
        t0 = time.time()
        p = subprocess.run(['lean', '-o', 'TwelveBlocks.olean', 'TwelveBlocks.lean'], cwd=tmp, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=1800)
        secs = round(time.time() - t0, 1)
    except Exception as e:
        shutil.rmtree(tmp, ignore_errors=True)
        return out('REFUSED', 'Lean did not run here: ' + str(e)[:200]), []
    text = p.stdout.decode(errors='replace')
    lines = [l for l in text.splitlines() if 'depends on axioms' in l or 'does not depend on any axioms' in l]
    used = sorted({x.strip() for l in lines if '[' in l for x in l[l.index('[') + 1:l.rindex(']')].split(',')})
    main = next((l for l in lines if "'TwelveBlocks.signature_period'" in l), '')
    main_ax = [x.strip() for x in main[main.index('[') + 1:main.rindex(']')].split(',')] if '[' in main else None
    evals = [l for l in text.splitlines() if l.startswith('EVAL ')]
    kept = [l.rstrip('\n') for l in open(os.path.join(LEAN, 'eval-m1-8.txt')) if l.startswith('EVAL ')]
    open(os.path.join(tmp, 'eval-m1-8.txt'), 'w').write('\n'.join(evals) + '\n')
    cmpo = subprocess.run([sys.executable, 'compare.py'], cwd=tmp, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=600).stdout.decode()
    mo = re.search(r'numbers compared: (\d+).*mismatches: (\d+)', cmpo)
    planted = subprocess.run(['lean', 'Planted.lean'], cwd=tmp, env=dict(os.environ, LEAN_PATH='.'), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
    perr = planted.stdout.decode(errors='replace').count('error')
    shutil.rmtree(tmp, ignore_errors=True)
    sys.path.insert(0, LEAN)
    import tie
    compared, differ = tie.run()
    v = re.search(r'version ([0-9.]+)', ver)
    d = {'version': v.group(1) if v else ver.strip()[:60], 'exit': p.returncode, 'seconds': secs, 'statement': STATED, 'stated': STATED in src, 'noSorryNativeDecideOrAxiom': clean,
         'axioms': main_ax, 'axiomsOfEveryTheorem': used, 'evalEqualsKept': evals == kept and len(evals) == 8,
         'compare': {'compared': int(mo.group(1)) if mo else 0, 'mismatches': int(mo.group(2)) if mo else -1},
         'plantedRefused': planted.returncode != 0 and perr >= 3, 'plantedErrors': perr, 'tie': {'compared': compared, 'differ': differ},
         'sha256': sha(os.path.join(LEAN, 'TwelveBlocks.lean'))}
    ok = (p.returncode == 0 and d['stated'] and clean and main_ax == STANDARD and set(used) <= set(STANDARD) and d['evalEqualsKept']
          and d['compare'] == {'compared': 2024, 'mismatches': 0} and d['plantedRefused'] and d['tie'] == {'compared': 2024, 'differ': 0})
    text = ('Lean %s, core only: TwelveBlocks.lean compiles (exit %d, %.0f s) and states signature (m + 2) = signature m for every m >= 1; axioms %s; '
            'the #eval at m = 1..8 equals the appendix on %d numbers and whole-colouring recounts on %d' % (d['version'], p.returncode, secs, main_ax, d['compare']['compared'], compared))
    return (out('CERTIFIED' if ok else 'REFUTED', text, **d),
            [control('KL the planted Lean file (period 1; one constant moved; the pair weight without its parity bracket)', d['plantedRefused'], 'lean exits %d with %d errors' % (planted.returncode, perr))])


# ------------------------------------------------------------------------------------------------ the record
NOT_DECIDED = [
    'the centring identity and E >= L (paper lemmas of the delta-three record)',
    'that the identity verified in D1 yields E >= mu^2/948 (it does through those lemmas)',
    'the lattice identity beyond the lengths of D2',
    'the outside-window bound beyond the scales of D3',
    'WINDOW beyond the pieces of D6: no full 2^(44m) family is walked, at any m',
    'the localisation and last-deletion arguments of GLOBAL and SHARP',
    'the affine and polynomial-in-k arguments of H3, ROUNDED and PERIOD',
    'the lower bound of V in every statement: no V(n) is computed beyond n = 14',
    'the multiplicities of PERIOD',
    'that the two tracks\' programs do what their notes say',
    'L1: that the cost of a pattern of flips is the quadratic form with the closed-form coefficients, for every m (the bridge from the definition of M stays on paper); no other lemma is in Lean',
]


def pins():
    files = ['instruments/twelve-blocks/judge.py', 'instruments/twelve-blocks/d1.js', 'instruments/twelve-blocks/ap3.py', 'instruments/delta3/verify.js',
             'instruments/delta3/model.js', 'instruments/delta3/psd.js', 'instruments/interval/rational.js', 'certs/delta3/inner-r20-g24_4_8.json',
             'corpus/twelve-blocks/MANIFEST.json', 'corpus/twelve-blocks/oeis-b121385.txt', 'corpus/twelve-blocks/run/gpt/optimum-residues.json',
             'corpus/twelve-blocks/run/gpt/period-witnesses.json', 'corpus/twelve-blocks/run/gpt/threshold_counts.json', 'corpus/twelve-blocks/run/claude/alln_anchors.json', PREREG,
             'instruments/twelve-blocks/lean/TwelveBlocks.lean', 'instruments/twelve-blocks/lean/Planted.lean', 'instruments/twelve-blocks/lean/eval-m1-8.txt',
             'instruments/twelve-blocks/lean/reference.py', 'instruments/twelve-blocks/lean/compare.py', 'instruments/twelve-blocks/lean/tie.py', 'instruments/twelve-blocks/first-run.log']
    return {p: sha(os.path.join(ROOT, p)) for p in files}


def env():
    try: import numpy; npv = numpy.__version__
    except Exception: npv = None
    node = subprocess.run(['node', '--version'], stdout=subprocess.PIPE).stdout.decode().strip()
    return {'python': sys.version.split()[0], 'numpy': npv, 'node': node, 'processes': PROCS}


def decide_all(only=None):
    S, K, t0 = {}, [], time.time()
    def run(name, fn, *a):
        if only and name not in only: return None
        t = time.time(); r = fn(*a); S[name] = r[0]; S[name]['seconds'] = round(time.time() - t, 1); K.extend(r[1])
        print('%-4s %-10s %6.1f s  %s' % (name, r[0]['verdict'], S[name]['seconds'], r[0]['text'][:150]), flush=True)
        return r
    run('D1', D1); run('D2', D2); run('D3', D3); run('D4', D4)
    r5 = run('D5', D5)
    if r5: run('D6', D6, [tuple(w) for w in r5[0]['detail']['oddMinimisers']])
    if not only or 'D7' in only:
        t = time.time(); (r, k), _ = D7(); S['D7'] = r; r['seconds'] = round(time.time() - t, 1); K.extend(k)
        print('%-4s %-10s %6.1f s  %s' % ('D7', r['verdict'], r['seconds'], r['text'][:150]), flush=True)
    run('D8', D8)
    if not only or 'D9' in only or 'D10' in only:
        t = time.time(); r, k, by = D9()
        if not only or 'D9' in only:
            S['D9'] = r; r['seconds'] = round(time.time() - t, 1); K.extend(k)
            print('%-4s %-10s %6.1f s  %s' % ('D9', r['verdict'], r['seconds'], r['text'][:150]), flush=True)
        if by is not None and (not only or 'D10' in only): run('D10', D10, by)
    run('L1', L1)
    for k in K: print('     %-8s %s: %s' % ('refused' if k['refused'] else 'MISSED', k['control'], k['text'][:110]), flush=True)
    return S, K, round(time.time() - t0, 1)


def main():
    a = sys.argv[1:]
    if a[:1] == ['--only']:
        decide_all(only=set(a[1:])); return
    if a[:1] == ['--redo']:
        rec = json.load(open(RECORD)); names = a[1:]
        first_judge = rec['pins']['instruments/twelve-blocks/judge.py']
        rec.setdefault('judge', {'firstRun': {'sha256': first_judge, 'decided': sorted(rec['statements'])}, 'redone': {}})
        rec.setdefault('amendments', [])
        for name in names:
            t = time.time()
            if name == 'D9': r, k, _ = D9(); prefix = 'K9 a row'
            elif name == 'L1': r, k = L1(); prefix = 'KL '
            else: sys.exit('--redo knows D9 and L1')
            r['seconds'] = round(time.time() - t, 1)
            old = rec['statements'].get(name)
            if name == 'D9' and old and not any(x['id'] == 'A2' for x in rec['amendments']):
                rec['amendments'].append({'id': 'A2', 'statement': 'D9', 'firstVerdict': old['verdict'], 'firstText': old['text'],
                                          'why': 'a fault of the pre-registration: the table\'s rounded_delta is the proposed minimum minus M(C_n), at most 0; D9 as first written read it as a loss, at least 0. '
                                                 'Restated in amendment A2 before the judge was changed, and decided again alone. Nothing else moved.'})
            rec['statements'][name] = r
            rec['controls'] = [x for x in rec['controls'] if not x['control'].startswith(prefix)] + k
            rec['judge']['redone'][name] = 'by the judge as pinned below'
            print('%-4s %-10s %6.1f s  %s' % (name, r['verdict'], r['seconds'], r['text'][:170]), flush=True)
            for x in k: print('     %-8s %s: %s' % ('refused' if x['refused'] else 'MISSED', x['control'], x['text'][:110]), flush=True)
        rec['controlsMissed'] = [x['control'] for x in rec['controls'] if not x['refused']]
        rec['notDecided'] = NOT_DECIDED; rec['pins'] = pins(); rec['environment'] = env()
        json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False)
        print('rewritten: certs/twelve-blocks.json  (%s; controls refused %d of %d)' % (', '.join('%s %s' % (k, v['verdict']) for k, v in rec['statements'].items()), sum(x['refused'] for x in rec['controls']), len(rec['controls'])))
        return
    if a[:1] == ['--check']:
        rec = json.load(open(RECORD)); now = pins()
        moved = [p for p in rec['pins'] if now.get(p) != rec['pins'][p]]
        if moved: print('REFUSED: these files changed since the record was written: ' + ', '.join(moved)); sys.exit(1)
        quick = {'D1': D1()[0], 'D2 (to n = 10)': D2(10, False)[0], 'D4': D4()[0], 'D8': D8()[0]}
        bad = [k for k, v in quick.items() if v['verdict'] != rec['statements'][k.split()[0]]['verdict']]
        words = ', '.join('%s %s' % (k, v['verdict']) for k, v in rec['statements'].items())
        print('pins intact (%d files); recomputed now: %s; the record: %s; controls refused %d of %d' % (
            len(now), ', '.join('%s %s' % (k, v['verdict']) for k, v in quick.items()), words, sum(k['refused'] for k in rec['controls']), len(rec['controls'])))
        sys.exit(1 if bad else 0)
    if a[:1] == ['--write']:
        S, K, secs = decide_all()
        prior = json.load(open(RECORD)) if os.path.exists(RECORD) else {}
        rec = {'what': 'The finite facts of "twelve blocks at finite length": ten statements decided on stated finite domains, and the controls that must be refused. PRIVATE until its reveal.',
               'saysFirst': SAYS_FIRST, 'preregistration': PREREG, 'decidedOn': time.strftime('%Y-%m-%d', time.gmtime()),
               'theorem': 'NOT DECIDED HERE: proposed by two models, read once by the other family, its displayed finite facts decided below',
               'statements': S, 'controls': K, 'controlsMissed': [k['control'] for k in K if not k['refused']], 'notDecided': NOT_DECIDED,
               'pins': pins(), 'environment': env(), 'seconds': secs}
        if prior.get('amendments'): rec['amendments'] = prior['amendments']        # the history of the first run stays with the record
        os.makedirs(os.path.dirname(RECORD), exist_ok=True)
        json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False)
        print('\nwritten: certs/twelve-blocks.json  (%s; controls refused %d of %d; %.0f s)' % (', '.join('%s %s' % (k, v['verdict']) for k, v in S.items()), sum(k['refused'] for k in K), len(K), secs))
        return
    print(__doc__)


if __name__ == '__main__':
    main()
