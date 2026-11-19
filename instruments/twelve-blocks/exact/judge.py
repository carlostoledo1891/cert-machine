#!/usr/bin/env python3
"""judge.py — exact values of V(n) and the unit scale: the statements U0–U6, T1, T2 and the controls of
notes/twelve-blocks-2-preregistration-2026-11-19.md, decided from the pinned copies in corpus/twelve-blocks-2.

UNCONDITIONAL statements use nothing but the definition of M. The two models' theorems about every large n are
NOT decided here. No program of either track is read or imported. cubepsd.py is the control room's checker of the
certificate format cube-psd-1 (written during the run from the format's page); ap3.py is its counter.

  python3 instruments/twelve-blocks/exact/judge.py --write     decide everything, write certs/twelve-blocks-exact.json (~10 min)
  python3 instruments/twelve-blocks/exact/judge.py --check     the pins, and U0 (to n = 10), U1 (n <= 50), U2, U5 again (~40 s)
  python3 instruments/twelve-blocks/exact/judge.py --only U4   one statement, printed
  python3 instruments/twelve-blocks/exact/judge.py --unit      run the separate judge of E1 (judge548/) and its named controls, and
                                                               write the outcome under "unitScale" in the record (amendment A2)"""
import hashlib, itertools, json, lzma, os, random, re, subprocess, sys, time
from fractions import Fraction as Fr
from multiprocessing import Pool

HERE = os.path.dirname(os.path.abspath(__file__))
TB = os.path.dirname(HERE)
ROOT = os.path.dirname(os.path.dirname(TB))
sys.path.insert(0, HERE); sys.path.insert(0, TB)
import ap3, cubepsd                                           # noqa: E402
import judge as tb                                            # noqa: E402  (the first run's judge: rounded, witness_sites, table, flipped, EDGES)

C = os.path.join(ROOT, 'corpus', 'twelve-blocks-2')
RECORD = os.path.join(ROOT, 'certs', 'twelve-blocks-exact.json')
PREREG = 'notes/twelve-blocks-2-preregistration-2026-11-19.md'
SEED = 20261119
PROCS = max(1, (os.cpu_count() or 2) - 1)
B = tb.EDGES
SAYS_FIRST = ('Two kinds of statement are decided here, and they are kept apart. UNCONDITIONAL: exact values of V(n), the least number of monochromatic '
              '3-term progressions over the 2-colourings of 1..n, each by a certificate a short checker verifies in exact arithmetic and a colouring; '
              'they use nothing but the definition. NOT DECIDED: the two models\' theorems about every large n (the exact formula from n = 15,756, every '
              'multiple of 548 beyond the first): each was read once, by the other model, and rests on the unrefereed October result.')


def out(verdict, text, **detail): return {'verdict': verdict, 'text': text, 'detail': detail}
def control(name, refused, text): return {'control': name, 'refused': bool(refused), 'text': text}
def f(n): return Fr(117 * n * n, 2192) - Fr(n, 2)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def cert(name): return json.loads(lzma.open(os.path.join(C, 'certificates', name + '.xz')).read())
def col_of(s): return [0] + [1 if ch == 'R' else 0 for ch in s]
def str_of(col): return ''.join('R' if c else 'B' for c in col[1:])
def A(n, T): return Fr(117 * n * n + T[n % 1096]['excess_numerator'], 2192) - Fr(n, 2)


def proves(doc):
    try: return cubepsd.check(doc), None
    except cubepsd.Refuse as e: return None, str(e)


def M_plain(x):
    n = len(x) - 1
    return sum(1 for d in range(1, n) for a in range(1, n - 2 * d + 1) if x[a] == x[a + d] == x[a + 2 * d])


# ------------------------------------------------------------------------------------------------ U0
def u0_length(args):
    n, words = args
    W = [[cubepsd.w(i, j, n) if i < j else 0 for j in range(n + 1)] for i in range(n + 1)]
    Wp = [[(W[i][j] - int((j - i) % 2 == 0)) if i < j else 0 for j in range(n + 1)] for i in range(n + 1)]     # control: no parity term
    T = (n - 1) ** 2 // 4; bad = 0; ctl_holds = True
    for wd in words:
        x = [0] + [1 if wd >> k & 1 else -1 for k in range(n)]
        m4 = 4 * M_plain(x)
        if m4 != T + sum(W[i][j] * x[i] * x[j] for i in range(1, n + 1) for j in range(i + 1, n + 1)): bad += 1
        if m4 != T + sum(Wp[i][j] * x[i] * x[j] for i in range(1, n + 1) for j in range(i + 1, n + 1)): ctl_holds = False
    return n, len(words), bad, ctl_holds


def U0(nmax=14, rnd=True):
    rng = random.Random(SEED)
    jobs = [(n, range(1 << n)) for n in range(1, nmax + 1)] + ([(n, [rng.getrandbits(n) for _ in range(2000)]) for n in range(15, 61)] if rnd else [])
    with Pool(PROCS) as P: res = P.map(u0_length, jobs)
    bad = sum(r[2] for r in res); tested = sum(r[1] for r in res)
    return (out('REFUTED' if bad else 'CERTIFIED', 'the identity 4M = T + sum w x_i x_j holds on %d colourings (every colouring to n = %d%s)' % (tested, nmax, '; 2,000 seeded at each n = 15..60' if rnd else ''), colourings=tested),
            [control('K0 the identity without the parity term of w', not all(r[3] for r in res if r[0] >= 3), 'fails on some colouring' if not all(r[3] for r in res if r[0] >= 3) else 'holds everywhere: NOT refused')])


# ------------------------------------------------------------------------------------------------ U1
def u1_row(row):
    cubepsd.FRACTIONS_UP_TO = 24
    n, V = row['n'], row['V']
    name = 'V%d-ge-%d.json' % (n, V)
    r = {'n': n, 'V': V, 'cubes': None, 'lower': False, 'upper': False, 'why': None}
    try:
        doc = cert(name)
        if doc.get('n') != n or doc.get('v') != V or 'within' in doc or 'exceptions' in doc: raise cubepsd.Refuse('the certificate is not for this row')
        if V >= 1:
            res, why = proves(doc)
            if res is None: raise cubepsd.Refuse(why)
            r['cubes'] = res[2]
        else: r['cubes'] = len(doc['leaves'])
        r['lower'] = True
        s = row['colouring']
        if len(s) != n or set(s) - {'R', 'B'}: raise cubepsd.Refuse('the colouring is not %d letters R or B' % n)
        m = ap3.count(col_of(s))
        if m != V: raise cubepsd.Refuse('the colouring has %d, not %d' % (m, V))
        r['upper'] = True
    except Exception as e:
        r['why'] = str(e)[:200]
    return r


def U1(nmax=None):
    T = json.load(open(os.path.join(C, 'run', 'claude', 'V-table.json')))['rows']
    rows = [r for r in T if nmax is None or r['n'] <= nmax]
    with Pool(PROCS) as P: res = P.map(u1_row, sorted(rows, key=lambda r: -r['n']), chunksize=1)
    res.sort(key=lambda r: r['n'])
    ok = [r for r in res if r['lower'] and r['upper']]
    ns = [r['n'] for r in res]
    oeis = {}
    for l in open(os.path.join(ROOT, 'corpus', 'twelve-blocks', 'oeis-b121385.txt')):
        if l.strip() and not l.startswith('#'): a, b = l.split()[:2]; oeis[int(a)] = int(b)
    tab = {x['residue']: x for x in tb.table()}
    eq_oeis = [r['n'] for r in ok if r['n'] in oeis and oeis[r['n']] == r['V']]
    eq_A = [r['n'] for r in ok if A(r['n'], tab) == r['V']]
    good = len(ok) == len(res) and ns == list(range(1, len(ns) + 1))
    ctl = []
    if nmax is None:
        r46 = next(r for r in T if r['n'] == 46); d46 = cert('V46-ge-90.json')
        up = dict(d46); up['v'] = 91
        ctl.append(control('K1 a value raised by one against its own certificate (V(46) >= 91)', proves(up)[0] is None, proves(up)[1] or 'ACCEPTED'))
        s = r46['colouring']; flip = ('B' if s[0] == 'R' else 'R') + s[1:]
        ctl.append(control('K1 a colouring with one site flipped', ap3.count(col_of(flip)) != 90, 'it has %d' % ap3.count(col_of(flip))))
        dr = dict(d46); dr['leaves'] = d46['leaves'][1:]
        ctl.append(control('K1 a certificate with one leaf dropped', proves(dr)[0] is None, proves(dr)[1] or 'ACCEPTED'))
        wn = dict(d46); wn['n'] = 47
        ctl.append(control('K1 a certificate given for the wrong n', proves(wn)[0] is None, proves(wn)[1] or 'ACCEPTED'))
        # cross-route: 40 seeded leaves by both exact routes
        rng = random.Random(SEED + 1); agree = 0; tried = 0; tam = None
        for _ in range(40):
            row = rng.choice([r for r in T if 30 <= r['n'] <= 60]); d = cert('V%d-ge-%d.json' % (row['n'], row['V'])); leaf = rng.choice(d['leaves'])
            one = {'format': 'cube-psd-1', 'n': d['n'], 'v': d['v'], 'D': d['D'], 'within': leaf['cube'].replace('.', '.'), 'leaves': [leaf]}
            verdicts = []
            for lim in (10 ** 6, 0):
                cubepsd.FRACTIONS_UP_TO = lim; verdicts.append(proves(one)[0] is not None)
            tried += 1; agree += verdicts[0] == verdicts[1] and verdicts[0]
            if tam is None and leaf['cube'].count('.') >= 4:
                bad_leaf = {'cube': leaf['cube'], 'u': list(leaf['u'])}; bad_leaf['u'][1] //= 4
                t1 = dict(one); t1['leaves'] = [bad_leaf]; tv = []
                for lim in (10 ** 6, 0):
                    cubepsd.FRACTIONS_UP_TO = lim; tv.append(proves(t1)[0] is None)
                tam = all(tv)
        cubepsd.FRACTIONS_UP_TO = 64
        ctl.append(control('cross-route: 40 seeded leaves by both exact routes, and a tampered leaf', agree == tried and bool(tam), '%d of %d leaves accepted by both routes; the tampered leaf refused by both: %s' % (agree, tried, tam)))
    text = ('V(n) exact at %d of %d lengths (n = %d..%d), each by a certificate that passes the checker and a colouring that attains it; %d cubes in all'
            % (len(ok), len(res), min(ns), max(ns), sum(r['cubes'] or 0 for r in res)))
    return (out('CERTIFIED' if good else 'REFUTED' if any(r['lower'] and not r['upper'] and 'has' in (r['why'] or '') for r in res) else 'REFUSED', text,
                rows=[{'n': r['n'], 'V': r['V'], 'cubes': r['cubes']} for r in res], failures=[r for r in res if not (r['lower'] and r['upper'])],
                observed={'equal to OEIS A121385': '%d of %d rows it lists' % (len(eq_oeis), sum(1 for r in ok if r['n'] in oeis)), 'equal to A(n)': '%d of %d rows' % (len(eq_A), len(ok))}), ctl)


# ------------------------------------------------------------------------------------------------ U2..U5
def U2():
    d = cert('sdp548-root.json'); res, why = proves(d)
    ok = res is not None and d['n'] == 548 and d['v'] == 15385 and len(d['leaves']) == 1 and set(d['leaves'][0]['cube']) == {'.'} and 'within' not in d
    up = dict(d); up['v'] = 15386
    return (out('CERTIFIED' if ok else 'REFUSED', 'V(548) >= 15,385 by one all-free cube' + ('' if ok else ': ' + str(why)), margin=str(res[4][0]) if res else None),
            [control('K2 the same file claiming 15,386', proves(up)[0] is None, (proves(up)[1] or 'ACCEPTED')[:160])])


def unit_cube():
    col = ap3.base(1)
    free = set(p for b in B for p in range(b - 1, b + 3)) | {31, 32, 517, 518}
    return col, free, ''.join('.' if p in free else ('R' if col[p] else 'B') for p in range(1, 549))


def U3():
    d = cert('W-unit-final-ge-15756.json'); col, free, want = unit_cube()
    res, why = proves(d); mb = ap3.count(col)
    ok = res is not None and d['n'] == 548 and d['v'] == 15756 and d.get('within') == want and 'exceptions' not in d and mb == 15756 and len(free) == 48
    k1 = dict(d); p = next(q for q in range(1, 549) if q not in free and all(abs(q - x) > 3 for x in free)); k1['within'] = want[:p - 1] + '.' + want[p:]
    k2 = dict(d); k2['v'] = 15757
    return (out('CERTIFIED' if ok else 'REFUSED', 'every colouring of 1..548 that agrees with B_1 outside the 48 stated sites has at least 15,756; M(B_1) = %d' % mb + ('' if ok else ': ' + str(why)),
                cubes=res[2] if res else None, freeSites=sorted(free)),
            [control('K3 the sub-cube with one more site freed', proves(k1)[0] is None, (proves(k1)[1] or 'ACCEPTED')[:160]),
             control('K3 the claim raised to 15,757 without exceptions', proves(k2)[0] is None, (proves(k2)[1] or 'ACCEPTED')[:160])])


def U4():
    cubepsd.FRACTIONS_UP_TO = 24
    d = cert('W-unit-count.json'); col, free, want = unit_cube(); base = str_of(col)
    res, why = proves(d)
    exc = d.get('exceptions', [])
    flips = sorted(tuple(p + 1 for p in range(548) if e[p] != base[p]) for e in exc)
    first = json.load(open(os.path.join(ROOT, 'certs', 'twelve-blocks.json')))
    F = [b + e for b in B for e in (0, 1)]
    mine = sorted(tuple(sorted(F[i] for i in w)) for w in first['statements']['D5']['detail']['oddMinimisers'])
    counts = res[6] if res else []
    ok = res is not None and d['n'] == 548 and d['v'] == 15757 and d.get('within') == want and len(exc) == 51 and set(counts) == {15756} and flips == mine
    k1 = dict(d); k1['exceptions'] = exc[1:]
    other = next(q for q in sorted(free) if True); alt = list(exc[0]); alt[other - 1] = 'B' if alt[other - 1] == 'R' else 'R'; alt = ''.join(alt)
    k2 = dict(d); k2['exceptions'] = [alt] + exc[1:]
    r1, w1 = proves(k1); r2, w2 = proves(k2)
    cubepsd.FRACTIONS_UP_TO = 64
    return (out('CERTIFIED' if ok else 'REFUSED', 'in that sub-cube exactly 51 colourings have 15,756 and every other has at least 15,757; the 51 are the 22-site census\'s minimisers of the first record' + ('' if ok else ': ' + str(why)),
                cubes=res[2] if res else None, exceptionCounts=sorted(set(counts)), sameAsFirstRecord=flips == mine, flipSetSizes=sorted({len(x) for x in flips})),
            [control('K4 one exception removed', r1 is None, (w1 or 'ACCEPTED')[:160]),
             control('K4 one exception replaced by another colouring of the cube', r2 is None or set(r2[6]) != {15756}, (w2 or 'accepted as a cover, but the replaced colouring has %s, not 15,756' % sorted(set(r2[6])) if r2 else w2)[:200])])


def U5():
    d = json.load(open(os.path.join(C, 'run', 'gpt', 'sdp548-primal.json'))); S, V, n = d['scale'], d['vectors'], 548
    def value(V):
        norms = [sum(x * x for x in v) for v in V]
        q = sum(cubepsd.w(i + 1, j + 1, n) * sum(a * b for a, b in zip(V[i], V[j])) for i in range(n) for j in range(i + 1, n))
        return max(norms) <= S * S, ((n - 1) ** 2 // 4 + Fr(q, S * S)) / 4
    feas, val = value(V)
    ok = len(V) == n and all(len(v) == 5 for v in V) and feas and val == Fr(3076878488712142201, 200000000000000) and val < 15385
    V2 = [list(v) for v in V]; V2[0] = [2 * x for x in V2[0]]
    return (out('CERTIFIED' if ok else 'REFUSED', 'the rational point is feasible (every squared norm <= 1) with value %s = %.8f < 15,385: one all-free cube cannot prove 15,386' % (val, float(val)), value=str(val)),
            [control('K5 one vector doubled', not value(V2)[0], 'its squared norm exceeds one')])


# ------------------------------------------------------------------------------------------------ U6, T1, T2
def u6_n(n):
    T = {x['residue']: x for x in tb.table()}
    col, _ = tb.rounded(n); sites = tb.witness_sites(n, T[n % 1096]['example_boundary_offsets'])
    if not all(1 <= p <= n for p in sites): return n, False
    return n, ap3.count_masks(tb.flipped(col, sites)) == A(n, T)


def U6():
    T = {x['residue']: x for x in tb.table()}
    with Pool(PROCS) as P: res = dict(P.map(u6_n, range(1, 3289), chunksize=32))
    miss = [n for n in res if not res[n]]
    rep = {it['n']: it for it in json.load(open(os.path.join(C, 'run', 'gpt', 'upper-short.json')))['items']}
    fixed = [n for n in miss if n in rep and ap3.count(ap3.read_coloring(rep[n])) == A(n, T) == rep[n]['count']]
    ok = miss == [23, 24, 25, 31, 33] and fixed == miss
    return (out('CERTIFIED' if ok else 'REFUSED', 'for every n = 1..3288 some colouring has exactly A(n): the table\'s mask on C_n at %d lengths, the replacement colourings at n = %s' % (3288 - len(miss), miss), maskMisses=miss, replaced=fixed),
            [control('K6 the five replacements withheld', len(miss) == 5, '%d lengths miss without them' % len(miss))])


def jumps(col): return [t for t in range(1, len(col) - 1) if col[t] != col[t + 1]]


def from_jumps(n, js):
    js = sorted(js)
    if len(set(js)) != len(js) or js[0] < 1 or js[-1] > n - 1: return None
    col = [0] * (n + 1); c = 1; k = 0
    for p in range(1, n + 1):
        while k < len(js) and js[k] < p: c ^= 1; k += 1
        col[p] = c
    return col


def edge_of(t, n): return min(range(11), key=lambda i: abs(Fr(n * B[i], 548) - t))


def t1_case(args):
    n, kind, seed = args
    T = {x['residue']: x for x in tb.table()}
    col, cuts = tb.rounded(n)
    if kind == 'witness': col = tb.flipped(col, tb.witness_sites(n, T[n % 1096]['example_boundary_offsets']))
    if kind == 'random':
        rng = random.Random(seed)
        for b in cuts:
            for _ in range(rng.randint(0, 2)):
                a = b + rng.randint(-40, 30); col = tb.flipped(col, range(a, a + rng.randint(1, 8)))
    js = jumps(col); M = ap3.count_masks(col)
    up = from_jumps(n + 1096, [t + 2 * B[edge_of(t, n)] for t in js])
    wrong = from_jumps(n + 1096, [t + 2 * B[edge_of(t, n)] + 1 for t in js])
    q = (n + 20700 + 1095) // 1096; n2 = 1096 * q - n
    rf = from_jumps(n2, [2 * q * B[edge_of(t, n)] - t for t in js])
    return (ap3.count_masks(up) - M == 117 * n + 63568, ap3.count_masks(rf) - f(n2) == M - f(n), wrong is not None and ap3.count_masks(wrong) - M == 117 * n + 63568)


def T1():
    rng = random.Random(20700); ns = sorted(rng.sample(range(20700, 23000), 40))
    jobs = [(n, k, 1000 * n + j) for n in ns for j, k in enumerate(('rounded', 'witness', 'random'))]
    with Pool(PROCS) as P: res = P.map(t1_case, jobs, chunksize=2)
    tr = sum(r[0] for r in res); rf = sum(r[1] for r in res); wr = sum(r[2] for r in res)
    return (out('CERTIFIED' if tr == rf == len(res) else 'REFUTED', 'the translation by 2B_i changes M by 117n + 63,568 in %d of %d cases and the reflection keeps M - f in %d of %d (40 lengths from 20,700; C_n, the witness, a random colouring inside the windows)' % (tr, len(res), rf, len(res)), cases=len(res)),
            [control('K7 the shift 2B_i + 1', wr < len(res), 'it gives the right change in %d of %d cases' % (wr, len(res)))])


def t2_r(r):
    T = {x['residue']: x for x in tb.table()}
    n = 20700 + ((r - 20700) % 1096); col, _ = tb.rounded(n)
    return ap3.count_masks(tb.flipped(col, tb.witness_sites(n, T[r]['example_boundary_offsets']))) == A(n, T)


def T2():
    with Pool(PROCS) as P: res = P.map(t2_r, range(1096), chunksize=8)
    return out('CERTIFIED' if all(res) else 'REFUTED', 'the table\'s witness at the least n >= 20,700 of each residue class has exactly A(n): %d of 1,096' % sum(res)), []


# ------------------------------------------------------------------------------------------------ E1 (amendment A2)
J548 = os.path.join(HERE, 'judge548')


def E1(controls=True):
    """Run the separate judge of the exclusion at the unit scale. It is its own program (Node); this only runs it and
    reads its verdict. Its report, with its gaps, is judge548/REPORT.md."""
    try:
        p = subprocess.run(['node', 'judge.js'], cwd=J548, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=1800)
    except Exception as e:
        return {'verdict': 'REFUSED', 'text': 'the judge did not run: ' + str(e)[:200]}
    text = p.stdout.decode(errors='replace')
    items = re.findall(r'^(PASS|FAIL)\s+item (\d)\s+(.*)$', text, re.M)
    ok = p.returncode == 0 and len(items) == 9 and all(i[0] == 'PASS' for i in items) and 'E: CERTIFIED' in text
    out1 = {'verdict': 'CERTIFIED' if ok else 'REFUSED',
            'text': 'every colouring of 1..548 with at most 15,756, in its orientation nearer to the twelve blocks, agrees with them outside the 48 sites of U3: %d of 9 items established by the separate judge' % sum(i[0] == 'PASS' for i in items),
            'items': [{'item': int(i[1]), 'passed': i[0] == 'PASS', 'what': i[2].strip()} for i in items],
            'restsOn': 'the four slab bounds are taken from instruments/delta3/verify.js; the October multipliers and gpt/unit-tangents.json enter as numbers whose identities are verified',
            'report': 'instruments/twelve-blocks/exact/judge548/REPORT.md'}
    if controls:
        c = subprocess.run(['node', 'controls.js', '--quick'], cwd=J548, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=3600).stdout.decode(errors='replace')
        found = re.findall(r'^control (\S+)\s+(.*)\n\s+verdict (CERTIFIED|REFUSED)', c, re.M)
        out1['controls'] = [{'control': name + '  ' + what.strip(), 'refused': v == 'REFUSED'} for name, what, v in found if name != '0']
        out1['controlsNotRefused'] = [x['control'] for x in out1['controls'] if not x['refused']]
        out1['whyNotRefused'] = 'every rational tangent vector gives a true inequality, so a perturbed vector makes the certificate wrong only if the replay stops closing; this one still closes. The control was badly chosen by the pre-registration (amendment A2). In a sweep over all 201 vectors the same perturbation stops the replay in 191.'
        out1['cleanRun'] = any(name == '0' and v == 'CERTIFIED' for name, what, v in found)
    return out1


# ------------------------------------------------------------------------------------------------ the record
NOT_DECIDED = [
    'every theorem about infinitely many n: the localisation from 20,700 (LOCAL75), the scaled result at m >= 2 (which also needs the first run\'s window classification), the two maps as bijections of minimisers (JUMPS), the formula A(n) from 15,756 or from 20,700, the value A(n) attained beyond n = 3288',
    'the lower bound V(n) >= A(n) for 95 <= n <= 15,755 off the multiples of 548, which neither model claims',
    'E1, the exclusion at the unit scale, unless its own judge certifies it (see "unitScale" in this record)',
]
STATEMENTS = [('U0', U0), ('U1', U1), ('U2', U2), ('U3', U3), ('U4', U4), ('U5', U5), ('U6', U6), ('T1', T1), ('T2', T2)]


def pins():
    files = ['instruments/twelve-blocks/exact/judge.py', 'instruments/twelve-blocks/exact/cubepsd.py', 'instruments/twelve-blocks/ap3.py', 'instruments/twelve-blocks/judge.py',
             'corpus/twelve-blocks-2/MANIFEST.json', 'corpus/twelve-blocks-2/run/claude/V-table.json', 'corpus/twelve-blocks-2/run/claude/CERT-FORMAT-V.md',
             'corpus/twelve-blocks-2/run/gpt/sdp548-primal.json', 'corpus/twelve-blocks-2/run/gpt/upper-short.json', 'corpus/twelve-blocks/run/gpt/optimum-residues.json',
             'corpus/twelve-blocks/oeis-b121385.txt', 'certs/twelve-blocks.json', PREREG,
             'instruments/twelve-blocks/exact/judge548/judge.js', 'instruments/twelve-blocks/exact/judge548/controls.js',
             'corpus/twelve-blocks-2/run/gpt/unit-tangents.json', 'instruments/delta3/verify.js', 'certs/delta3/inner-r20-g24_4_8.json']
    d = {p: sha(os.path.join(ROOT, p)) for p in files}
    h = hashlib.sha256()
    for name in sorted(os.listdir(os.path.join(C, 'certificates'))): h.update(name.encode() + b'\0' + sha(os.path.join(C, 'certificates', name)).encode())
    d['corpus/twelve-blocks-2/certificates/ (all %d files, names and sha256)' % len(os.listdir(os.path.join(C, 'certificates')))] = h.hexdigest()
    return d


def decide_all(only=None):
    S, K, t0 = {}, [], time.time()
    for name, fn in STATEMENTS:
        if only and name not in only: continue
        t = time.time(); r, k = fn(); r['seconds'] = round(time.time() - t, 1); S[name] = r; K.extend(k)
        print('%-3s %-10s %6.1f s  %s' % (name, r['verdict'], r['seconds'], r['text'][:170]), flush=True)
    for k in K: print('    %-8s %s: %s' % ('refused' if k['refused'] else 'MISSED', k['control'], k['text'][:120]), flush=True)
    return S, K, round(time.time() - t0, 1)


def main():
    a = sys.argv[1:]
    if a[:1] == ['--only']: decide_all(set(a[1:])); return
    if a[:1] == ['--check']:
        rec = json.load(open(RECORD)); now = pins()
        moved = [p for p in rec['pins'] if now.get(p) != rec['pins'][p]]
        if moved: print('REFUSED: these files changed since the record was written: ' + ', '.join(moved)); sys.exit(1)
        quick = {'U0': U0(10, False)[0], 'U1': U1(50)[0], 'U2': U2()[0], 'U5': U5()[0]}
        bad = [k for k, v in quick.items() if v['verdict'] != rec['statements'][k]['verdict']]
        e1 = rec.get('unitScale', {}).get('E1')
        if isinstance(e1, dict):
            again = E1(controls=False); quick['E1'] = again
            if again['verdict'] != e1['verdict']: bad.append('E1')
        print('pins intact (%d entries); decided again now: %s; the record: %s; controls refused %d of %d' % (
            len(now), ', '.join('%s %s' % (k, v['verdict']) for k, v in quick.items()), ', '.join('%s %s' % (k, v['verdict']) for k, v in rec['statements'].items()),
            sum(k['refused'] for k in rec['controls']), len(rec['controls'])))
        sys.exit(1 if bad else 0)
    if a[:1] == ['--unit']:
        rec = json.load(open(RECORD)); S = rec['statements']
        e1 = E1()
        both = e1['verdict'] == 'CERTIFIED' and S['U3']['verdict'] == 'CERTIFIED' and S['U4']['verdict'] == 'CERTIFIED' and e1.get('cleanRun')
        rec['unitScale'] = {'E1': e1,
                            'V548': {'verdict': 'CERTIFIED' if both else 'REFUSED',
                                     'text': 'V(548) = 15,756 exactly, with exactly 102 labelled minimising colourings: E1 puts every colouring with at most 15,756 (or its colour exchange) inside the sub-cube of U3, where U3 gives at least 15,756 and U4 gives exactly 51 at 15,756; the 51 and their colour exchanges are 102 distinct colourings.',
                                     'from': ['E1', 'U3', 'U4'],
                                     'uses': 'no theorem about the continuum and no paper lemma; the October certificate files as numbers whose identities are verified, and the four slab bounds of this repository\'s delta-three verifier'}}
        rec['notDecided'] = [x for x in NOT_DECIDED if not x.startswith('E1')]
        rec['pins'] = pins()
        json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False)
        print('E1 %s (%d of 9 items); controls refused %d of %d; not refused: %s' % (e1['verdict'], sum(i['passed'] for i in e1.get('items', [])), sum(c['refused'] for c in e1.get('controls', [])), len(e1.get('controls', [])), e1.get('controlsNotRefused')))
        print('V(548) = 15,756 with 102 minimisers: ' + rec['unitScale']['V548']['verdict'])
        return
    if a[:1] == ['--write']:
        S, K, secs = decide_all()
        prior = json.load(open(RECORD)) if os.path.exists(RECORD) else {}
        try: import numpy; npv = numpy.__version__
        except Exception: npv = None
        rec = {'what': 'Exact values of V(n) and the unit scale of the twelve blocks: unconditional statements decided from certificates and colourings, two finite tests of the conditional theorems, and the controls that must be refused.',
               'saysFirst': SAYS_FIRST, 'preregistration': PREREG, 'decidedOn': time.strftime('%Y-%m-%d', time.gmtime()),
               'theorems': 'NOT DECIDED HERE: the two models\' statements about every large n were each read once, by the other model',
               'statements': S, 'controls': K, 'controlsMissed': [k['control'] for k in K if not k['refused']], 'notDecided': NOT_DECIDED,
               'unitScale': prior.get('unitScale', {'E1': 'not decided: its judge has not reported'}),
               'pins': pins(), 'environment': {'python': sys.version.split()[0], 'numpy': npv, 'processes': PROCS}, 'seconds': secs}
        if prior.get('amendments'): rec['amendments'] = prior['amendments']
        json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False)
        print('\nwritten: certs/twelve-blocks-exact.json  (%s; controls refused %d of %d; %.0f s)' % (', '.join('%s %s' % (k, v['verdict']) for k, v in S.items()), sum(k['refused'] for k in K), len(K), secs))
        return
    print(__doc__)


if __name__ == '__main__':
    main()
