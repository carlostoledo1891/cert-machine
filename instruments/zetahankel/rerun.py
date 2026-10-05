#!/usr/bin/env python3
"""rerun.py — re-runs, on this machine and from the LIFTED engine, every number of the zeta-hankel port
that has proof force per instance, and writes certs/zeta-hankel-ledger.json. cert-machine's own file,
not a port (the lifted files are pinned in PROVENANCE.json and run unmodified).

What is re-run here (python-flint 0.9.0; ~1 min, most of it the Calegari family at h = 77..99):
  · the four headline families of the claimant notes, at EVERY h the lifted record holds:
      zeta(3)  Z int a=4 b=1 r=4 (h = 3..39) · zeta(5)  Z int a=8 b=1 r=6 and r=4 (h = 7..35)
      zeta(7)  Z int a=8 b=1 r=4 (h = 7..35) · Catalan G  E half a=8 b=1 r=1 (h = 7..35)
    through scan2.nodes + hankel2.run, the entry points that wrote the lifted records;
  · Calegari's K = 12n, N = n, r = 6 family for k = 5 and k = 7 (hankel.run, as family.py did), n <= 9;
  · padic.profile for Z int a=12 b=1 r=6 m=5 at k = 5 and k = 7 (the v_p of the content, prime by prime).
For each instance: the engine's own float (bit-compared with the lifted record), a BALL for log P(xi)
evaluated here with outward-rounded double endpoints (arb, P exact in Z[X]), the exact fingerprint of P
(sha256 of its integer coefficients) and of the content. AGREE iff the lifted value lies in the ball
widened by TOL_LIFTED: the lifted engine stopped at rad(P(xi)) < 2^-30 P(xi), so its log is good to
about 1e-9 and no better — that, not the ball here, is the width of the comparison.

The cross-check (crosscheck.py, stdlib, no shared code) is run in-process on six small instances: P
equal coefficient by coefficient, content equal, and for zeta(3) the engine's arb ball of P(zeta(3))
must intersect crosscheck's exact rational enclosure (Apery's series).

What is NOT re-run: the ~300-family scan and the structural variants (4,902 records, about an hour of
one core on the bench). They enter the ledger as LIFTED records under classReading, which is marked an
extrapolation, never a theorem.

usage: instruments/zetahankel/.venv/bin/python instruments/zetahankel/rerun.py [--quick]
       --quick stops Calegari's family at n = 6 (h = 66)."""
import sys, os, json, time, math, hashlib, platform, subprocess, re
getattr(sys, 'set_int_max_str_digits', lambda n: None)(0)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VENVS = [os.path.join(HERE, '.venv', 'bin', 'python'), os.path.join(ROOT, 'instruments', 'erdos1', '.venv', 'bin', 'python')]
try:
    import flint  # noqa
except ImportError:
    for vp in VENVS:
        if os.path.exists(vp) and os.path.abspath(sys.executable) != os.path.abspath(vp):
            os.execv(vp, [vp] + sys.argv)
    print('zetahankel: python-flint is not importable; build the venv: /opt/homebrew/bin/python3.12 -m venv '
          'instruments/zetahankel/.venv && instruments/zetahankel/.venv/bin/pip install python-flint==0.9.0 mpmath==1.4.1')
    sys.exit(2)
sys.path.insert(0, HERE)
from flint import arb, ctx, fmpq
import hankel, hankel2, scan2, padic
import crosscheck as XC

RUNS = os.path.join(ROOT, 'certs', 'zeta-hankel', 'runs')
LEDGER = os.path.join(ROOT, 'certs', 'zeta-hankel-ledger.json')
TEST2_LOG = os.path.join(ROOT, 'certs', 'zeta-hankel', 'test2-certmachine.log')
TOL_LIFTED = 2.0 ** -29          # the lifted engine's own stopping rule, rad < 2^-30 * value, doubled
rel = lambda p: os.path.relpath(p, ROOT)
sha_file = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

HEADLINE = [
    dict(key='zeta3', constant='ζ(3)', k=3, spec=('Z', 3, 'int', 4, 1, 4)),
    dict(key='zeta5', constant='ζ(5)', k=5, spec=('Z', 5, 'int', 8, 1, 6)),
    dict(key='zeta7', constant='ζ(7)', k=7, spec=('Z', 7, 'int', 8, 1, 4)),
    dict(key='catalan', constant='G', k=2, spec=('E', 2, 'half', 8, 1, 1)),
]
EXTRA = [dict(key='zeta5r4', constant='ζ(5)', k=5, spec=('Z', 5, 'int', 8, 1, 4))]
CALEGARI = [dict(key='calegari5', constant='ζ(5)', k=5, record='k5_12_1_6.jsonl'),
            dict(key='calegari7', constant='ζ(7)', k=7, record='k7_12_1_6.jsonl')]

def spec_name(spec):
    return '%s_k%d_%s_a%d_b%d_r%d' % spec

def fingerprint(P):
    return hashlib.sha256(','.join(str(int(c.p)) for c in P.coeffs()).encode()).hexdigest()

def down(x): return math.nextafter(x, -math.inf)
def up(x): return math.nextafter(x, math.inf)

def ball_log(P, xfun):
    """log P(xi) as [lo, hi] with outward-rounded double endpoints; P in Z[X], xfun() -> arb xi"""
    coeffs = [int(c.p) for c in P.coeffs()]
    prec = max(abs(c).bit_length() for c in coeffs) + 256
    while True:
        old = ctx.prec; ctx.prec = prec
        try:
            z = xfun(); v = arb(0)
            for c in reversed(coeffs):
                v = v * z + c
            if v > 0 and v.rad() < v.mid() * arb(2) ** -60:
                L = v.log()
                return dict(lo=down(float(L.lower())), hi=up(float(L.upper())), prec=prec), v
            if v < 0:
                raise RuntimeError('P(xi) < 0: positivity violated')
        finally:
            ctx.prec = old
        prec *= 2

def row_from(res, P, cont, h, ball, lifted, secs):
    mid = res['logP_at_X'] if 'logP_at_X' in res else res['logP_at_zeta']
    lo, hi = ball['lo'], ball['hi']
    agree = lifted is not None and (lo - TOL_LIFTED) <= lifted['logP'] <= (hi + TOL_LIFTED)
    return dict(h=h, deg=P.degree(),
                logP=mid, logP_lo=lo, logP_hi=hi,
                margin=mid / h ** 2, margin_lo=down(lo / h ** 2), margin_hi=up(hi / h ** 2),
                log_content=res['log_content'], P_sha256=fingerprint(P),
                content_sha256=hashlib.sha256((str(cont.p) + '/' + str(cont.q)).encode()).hexdigest(),
                prec=ball['prec'], secs=secs,
                lifted=lifted, bitIdentical=bool(lifted) and lifted['logP'] == mid and lifted['log_content'] == res['log_content'],
                agree=bool(agree))

def read_jsonl(p):
    return [json.loads(l) for l in open(p) if l.strip()]

def run_scan_family(spec, ms=None):
    """re-run a scan3 family at every m in its lifted record (or the given ms)"""
    weight, k, typ, a, b, r = spec
    path = os.path.join(RUNS, 'scan3', spec_name(spec) + '.jsonl')
    lifted = {d['m']: d for d in read_jsonl(path) if 'error' not in d}
    rows = []
    for m in sorted(ms or lifted):
        K, N = a * m, b * m
        den, num = scan2.nodes(typ, K, N, r)
        num = [x for x in num if x[1] > 0]
        t0 = time.time()
        res, P, D = hankel2.run(k, weight, den, num)
        cont = hankel.content(D)
        half = den[0].q != 1
        ball, _ = ball_log(P, lambda: hankel2.const_ball(k, weight, half))
        L = lifted.get(m)
        lift = dict(logP=L['logP_at_X'], log_content=L['log_content'], h=L['h']) if L else None
        row = row_from(res, P, cont, len(den), ball, lift, round(time.time() - t0, 3))
        row['m'] = m
        rows.append(row)
    return dict(record=rel(path), record_sha256=sha_file(path), rows=rows)

def run_calegari(k, record, nmax):
    path = os.path.join(RUNS, record)
    lifted = {d['n']: d for d in read_jsonl(path)}
    rows = []
    for n in sorted(x for x in lifted if x <= nmax):
        t0 = time.time()
        res, P, D = hankel.run(k, 12 * n, n, 6, None, verbose=False)
        cont = hankel.content(D)
        ball, _ = ball_log(P, lambda: arb(k).zeta())
        L = lifted[n]
        row = row_from(res, P, cont, res['h'], ball, dict(logP=L['logP_at_zeta'], log_content=L['log_content'], h=L['h']),
                       round(time.time() - t0, 3))
        row['n'] = n
        rows.append(row)
    notrun = sorted(x for x in lifted if x > nmax)
    return dict(record=rel(path), record_sha256=sha_file(path), rows=rows,
                liftedOnly=[dict(n=x, h=lifted[x]['h'], logP=lifted[x]['logP_at_zeta'],
                                 margin=lifted[x]['logP_at_zeta'] / lifted[x]['h'] ** 2) for x in notrun])

def padic_derived(prof5, prof7, K):
    """the claimant's accounting, recomputed from the two v_p profiles"""
    big = [p for p in map(int, prof5) if p > math.sqrt(K)]
    small = [p for p in map(int, prof5) if p <= math.sqrt(K)]
    rows = [dict(p=p, v5=prof5[str(p)], v7=prof7[str(p)], extra=prof5[str(p)] - prof7[str(p)], naive=2 * (K - p)) for p in big]
    extra = sum(r['extra'] * math.log(r['p']) for r in rows)
    naive = sum(r['naive'] * math.log(r['p']) for r in rows)
    smallx = sum((prof5[str(p)] - prof7[str(p)]) * math.log(p) for p in small)
    return dict(K=K, rows=rows, extraLogWeighted=extra, naiveLogWeighted=naive, ratio=extra / naive,
                smallPrimes=small, smallPrimesExtra=smallx)

def run_padic():
    path = os.path.join(RUNS, 'padic-k5-k7.json')
    lifted = json.load(open(path))
    here = {}
    t0 = time.time()
    for k in (5, 7):
        res, prof = padic.profile('Z', k, 'int', 12, 1, 6, 5)
        here[str(k)] = dict(res={x: res[x] for x in ('k', 'h', 'deg', 'log_content', 'logP_at_X', 'log_delta_at_X')},
                            prof={str(p): v for p, v in prof.items() if v})
    secs = round(time.time() - t0, 2)
    same_prof = all(here[k]['prof'] == {p: v for p, v in lifted[k]['prof'].items() if v} for k in ('5', '7'))
    same_res = all(here[k]['res'][x] == lifted[k]['res'][x] for k in ('5', '7') for x in ('h', 'deg', 'log_content', 'logP_at_X'))
    return dict(record=rel(path), record_sha256=sha_file(path), family='Z int a=12 b=1 r=6, m=5 (K=60, N=5, h=55)',
                here=here, profilesEqual=same_prof, resEqual=same_res, secs=secs,
                derived=padic_derived(here['5']['prof'], here['7']['prof'], 60),
                derivedFromLifted=padic_derived({p: v for p, v in lifted['5']['prof'].items()},
                                                {p: v for p, v in lifted['7']['prof'].items()}, 60))

def run_crosscheck():
    out = []
    for inst in XC.INSTANCES:
        weight, k, typ, a, b, r, m = inst
        t0 = time.time()
        x = XC.compute(inst)
        t1 = time.time()
        K, N = a * m, b * m
        den, num = scan2.nodes(typ, K, N, r)
        num = [y for y in num if y[1] > 0]
        res, P, D = hankel2.run(k, weight, den, num)
        cont = hankel.content(D)
        same_P = [int(c.p) for c in P.coeffs()] == x['P']
        same_c = (int(cont.p), int(cont.q)) == (x['content'].numerator, x['content'].denominator)
        row = dict(spec=list(inst[:6]), m=m, h=x['h'], P_sha256_engine=fingerprint(P), P_sha256_stdlib=XC.fingerprint(x['P']),
                   samePolynomial=same_P, sameContent=same_c, secsStdlib=round(t1 - t0, 3))
        if 'vlo' in x:
            ball, v = ball_log(P, lambda: arb(3).zeta())
            old = ctx.prec; ctx.prec = ball['prec']
            try:
                lo_a, hi_a = arb(fmpq(x['vlo'].numerator, x['vlo'].denominator)), arb(fmpq(x['vhi'].numerator, x['vhi'].denominator))
                overlap = not (v < lo_a) and not (v > hi_a)
            finally:
                ctx.prec = old
            lifted = next((d for d in read_jsonl(os.path.join(RUNS, 'scan3', spec_name(inst[:6]) + '.jsonl')) if d['m'] == m), None)
            row.update(zeta3Enclosure=dict(aperyTerms=x['terms'], logP_lo_stdlib=x['logP_lo'], logP_hi_stdlib=x['logP_hi'],
                                           engineBallIntersectsRationalEnclosure=bool(overlap),
                                           liftedLogP=lifted['logP_at_X'] if lifted else None,
                                           liftedWithinStdlib=bool(lifted) and x['logP_lo'] - TOL_LIFTED <= lifted['logP_at_X'] <= x['logP_hi'] + TOL_LIFTED))
        row['agree'] = same_P and same_c and row.get('zeta3Enclosure', {}).get('engineBallIntersectsRationalEnclosure', True) \
            and row.get('zeta3Enclosure', {}).get('liftedWithinStdlib', True)
        out.append(row)
    return out

def read_test2():
    txt = open(TEST2_LOG).read()
    errs = [abs(float(v)) for v in re.findall(r"'(-?[0-9.]+(?:e-?[0-9]+)?)'\)", txt)]
    agree = re.search(r'engines agree: (True|False) (\S+) (\S+)', txt)
    real = re.search(r'^real ([0-9.]+)', txt, re.M)
    return dict(log=rel(TEST2_LOG), log_sha256=sha_file(TEST2_LOG), checks=len(errs), maxRelErr=max(errs),
                enginesAgree=bool(agree and agree.group(1) == 'True'), exitZero='exit 0' in txt,
                secs=float(real.group(1)) if real else None,
                what='every moment (e = 1, 3) and every node transform (integer a = 1, 3, 4; half-integer a = 1/2, 5/2, 7/2) of '
                     'hankel2.py against mpmath quadrature at 30 digits, k = 2, 3, 5, 7, both weights; then hankel.py and hankel2.py '
                     'on the Fauzan-type ζ(5) family K = 24, N = 2, r = 6 must give the identical P. Numerical, not interval: it '
                     'checks the formulas the exact engine is built on.')

def class_reading():
    """from the LIFTED records only — the measurement across the families, not re-run here"""
    fams = []
    for d in ('scan3', 'struct', 'scan1'):
        for f in sorted(os.listdir(os.path.join(RUNS, d))):
            if not f.endswith('.jsonl'): continue
            L = sorted([x for x in read_jsonl(os.path.join(RUNS, d, f)) if 'error' not in x], key=lambda x: x['m'])
            if not L: continue
            last = L[-1]
            v = last.get('logP_at_X', last.get('logP_at_zeta'))
            fams.append(dict(dir=d, name=f[:-6], k=last['k'], h=last['h'], margin=v / last['h'] ** 2, records=len(L),
                             weight=(f[0] if d == 'scan3' else ('Z' if d != 'scan1' else 'Z'))))
    nrec = sum(len(read_jsonl(os.path.join(RUNS, d, f))) for d in ('scan3', 'struct', 'scan1')
               for f in os.listdir(os.path.join(RUNS, d)) if f.endswith('.jsonl'))
    nerr = sum(1 for d in ('scan3', 'struct', 'scan1') for f in os.listdir(os.path.join(RUNS, d)) if f.endswith('.jsonl')
               for x in read_jsonl(os.path.join(RUNS, d, f)) if 'error' in x)
    def best(pred):
        c = [x for x in fams if x['dir'] == 'scan3' and pred(x['name']) and x['h'] >= 30]
        b = min(c, key=lambda x: x['margin'])
        return dict(family=b['name'], h=b['h'], margin=b['margin'], families=len(c))
    bestZ = {str(k): best(lambda n, k=k: n.startswith('Z_k%d_' % k)) for k in (3, 5, 7)}
    bestE = {str(k): best(lambda n, k=k: n.startswith('E_k%d_int' % k)) for k in (3, 5, 7)}
    bestG = best(lambda n: n.startswith('E_k2_half'))
    ks = [3, 5, 7]; ys = [bestZ[str(k)]['margin'] for k in ks]
    kbar = sum(ks) / 3; ybar = sum(ys) / 3
    slope = sum((k - kbar) * (y - ybar) for k, y in zip(ks, ys)) / sum((k - kbar) ** 2 for k in ks)
    icpt = ybar - slope * kbar
    cross57 = 5 + 2 * (-bestZ['5']['margin']) / (bestZ['7']['margin'] - bestZ['5']['margin'])
    struct = [dict(family=x['name'], k=x['k'], h=x['h'], margin=x['margin']) for x in fams if x['dir'] == 'struct']
    bestZ5 = bestZ['5']['margin']
    return dict(
        status='extrapolation',
        statement='The class of Hankel families measured here stops between ζ(5) and ζ(7): the best margin found at '
                  'h ≈ 35 is negative at k = 3 and k = 5 and positive at k = 7, and every structural variant is worse. '
                  'This is a MEASUREMENT across a finite set of families at finite h, extrapolated in h and in k. It is '
                  'NOT a theorem: no statement here excludes a family outside the ones scanned, and no limit in h is proved.',
        counts=dict(families=len(fams), scan3=sum(1 for x in fams if x['dir'] == 'scan3'),
                    struct=sum(1 for x in fams if x['dir'] == 'struct'), scan1=sum(1 for x in fams if x['dir'] == 'scan1'),
                    records=nrec, errors=nerr),
        bestZ=bestZ, bestE=bestE, bestCatalan=bestG,
        linearInK=dict(slopePerUnitK=slope, intercept=icpt, zeroCrossingFit=-icpt / slope, zeroCrossingInterp57=cross57,
                       note='least squares through the three best Z margins (k = 3, 5, 7); and the linear interpolation '
                            'between k = 5 and k = 7. The claimant notes round the threshold to "k ≈ 6".'),
        struct=struct, structAllWorseThanBestZ5=all(x['margin'] > bestZ5 for x in struct if x['k'] == 5),
        structRange=[min(x['margin'] for x in struct), max(x['margin'] for x in struct)])

def published():
    """the published decay rates, per h^2, read off the pinned sources (corpus/sources/zeta-hankel)"""
    src = os.path.join(ROOT, 'corpus', 'sources', 'zeta-hankel')
    return dict(
        fauzan=dict(source='corpus/sources/zeta-hankel/zenodo-22826419.json', sha256=sha_file(os.path.join(src, 'zenodo-22826419.json')),
                    stated='integer polynomials Q_n of degree 37n with 0 < Q_n(ζ(5)) < exp(−139n²/5); |ζ(5) − a/b| > b^−260',
                    perN2=-139 / 5, degreePerN=37, perH2=(-139 / 5) / 37 ** 2),
        calegari=dict(source='corpus/sources/zeta-hankel/calegari-2026-09-24-zeta5-is-irrational.html',
                      sha256=sha_file(os.path.join(src, 'calegari-2026-09-24-zeta5-is-irrational.html')),
                      stated='K = 12n, N = n, r = 6, h = 11n; deg P_{k,n} = 11n, P_{k,n}(ζ(k)) ≤ e^{−γ_k n²}, γ_5 = 3/2',
                      perN2=-1.5, degreePerN=11, perH2=-1.5 / 11 ** 2))

RACE = [
    dict(claim='ζ(7) is irrational (Anand, Zenodo 22920911, v1 2026-09-23)',
         status='open issue: gmDevi/zeta-7-21-lean #1 (opened 2026-10-03 by a third party, GitHub user huntrontrakkr — not this lab) reports that the outer integral I_out does not follow '
                'from the paper\'s own formulas, moving the decay constant from −11.99 to +0.95',
         sources=['zenodo-22920911.json', 'github-gmDevi-zeta-7-21-lean-issue-1.json']),
    dict(claim='Catalan\'s constant is irrational (Sun, arXiv 2609.04176, 2026-09-03)',
         status='Wachs, arXiv 2609.22339 (2026-09-16), reports exact computations locating a discrepancy at the prime 2',
         sources=['arxiv-2609.04176.html', 'arxiv-2609.22339.html']),
    dict(claim='ζ(5) is irrational (Fauzan, Zenodo 22826419, 2026-09-17; Calegari\'s reconstruction 2026-09-24)',
         status='the method measured on this page; the proof itself is not re-checked here',
         sources=['zenodo-22826419.json', 'calegari-2026-09-24-zeta5-is-irrational.html']),
]

def main():
    quick = '--quick' in sys.argv
    T0 = time.time()
    fam = {}
    for H in HEADLINE + EXTRA:
        t0 = time.time()
        fam[H['key']] = dict(constant=H['constant'], k=H['k'], spec=list(H['spec']), name=spec_name(H['spec']),
                             **run_scan_family(H['spec']))
        fam[H['key']]['secs'] = round(time.time() - t0, 2)
        print('family', H['key'], fam[H['key']]['secs'], 's', flush=True)
    cal = {}
    for c in CALEGARI:
        t0 = time.time()
        cal[c['key']] = dict(constant=c['constant'], k=c['k'], family='K = 12n, N = n, r = 6, h = 11n (hankel.run)',
                             **run_calegari(c['k'], c['record'], 6 if quick else 9))
        cal[c['key']]['secs'] = round(time.time() - t0, 2)
        print('calegari', c['key'], cal[c['key']]['secs'], 's', flush=True)
    pad = run_padic(); print('padic', pad['secs'], 's', flush=True)
    t0 = time.time(); xc = run_crosscheck(); xsecs = round(time.time() - t0, 2); print('crosscheck', xsecs, 's', flush=True)
    headline = []
    for H in HEADLINE:
        F = fam[H['key']]; top = max(F['rows'], key=lambda r: r['h'])
        headline.append(dict(key=H['key'], constant=H['constant'], k=H['k'], family=F['name'], h=top['h'],
                             margin=top['margin'], margin_lo=top['margin_lo'], margin_hi=top['margin_hi'],
                             liftedMargin=top['lifted']['logP'] / top['h'] ** 2, agree=top['agree'], bitIdentical=top['bitIdentical'],
                             sign='negative' if top['margin_hi'] < 0 else 'positive' if top['margin_lo'] > 0 else 'undecided'))
    allrows = [r for F in fam.values() for r in F['rows']] + [r for C in cal.values() for r in C['rows']]
    deps = ['instruments/zetahankel/hankel.py', 'instruments/zetahankel/hankel2.py', 'instruments/zetahankel/scan2.py',
            'instruments/zetahankel/padic.py', 'instruments/zetahankel/test2.py', 'instruments/zetahankel/crosscheck.py',
            'instruments/zetahankel/rerun.py', rel(TEST2_LOG)]
    L = dict(
        what='The Fauzan/Calegari Hankel-determinant irrationality method, measured: the exact content-normalised '
             'polynomial P of each family member and log P(ξ)/h², the margin (negative = the family proves ξ irrational). '
             'Ported from frontier-apps/experiments/zeta-hankel on 2026-10-05 (instruments/zetahankel/PROVENANCE.json); '
             'every per-instance number below was re-run on this machine from the lifted engine.',
        generatedBy='instruments/zetahankel/rerun.py' + (' --quick' if quick else ''),
        generatedOn=time.strftime('%Y-%m-%d'),
        env=dict(python=platform.python_version(), flint=flint.__version__, machine=platform.machine(), system=platform.system()),
        rule=dict(margin='log P(ξ) / h², P the primitive integer polynomial of Δ(X) = det(A + XB) (content stripped exactly)',
                  ball='[logP_lo, logP_hi]: arb evaluation of P(ξ) with rad < 2^-60 · value, log taken in arb, endpoints rounded '
                       'outward to doubles; margin_lo/hi the same divided by h², outward',
                  agree='the lifted value lies in the ball widened by %.3g (the lifted engine stopped at rad < 2^-30 · value)' % TOL_LIFTED,
                  bitIdentical='the engine\'s own float output here equals the lifted record\'s, bit for bit, and so does log_content'),
        scope='Per instance: exact (P and its content are exact integers/rationals) and ball-certified (log P(ξ)). '
              'The wall — "the class stops between ζ(5) and ζ(7)" — is a measurement across the lifted families, extrapolated; '
              'not a theorem. The race context is UNVERIFIED by cert-machine.',
        headline=headline,
        families=fam,
        calegari=cal,
        padic=pad,
        test2=read_test2(),
        crosscheck=dict(what='crosscheck.py: Python standard library only, written from the docstring definitions, no code shared '
                             'with the engine; moments from its own Bernoulli recurrence, partial fractions by schoolbook division, '
                             'Δ by Fraction determinants at h+1 points and Lagrange interpolation, ζ(3) by an exact rational '
                             'enclosure from Apéry\'s series. ζ(5), ζ(7) and G: the exact polynomial only.',
                        rows=xc, secs=xsecs),
        classReading=class_reading(),
        published=published(),
        raceContext=dict(status='unverified', note='Reported by others; nothing in this list was checked by cert-machine. '
                                                   'The sources are pinned (corpus/sources/zeta-hankel, sha256 in PROVENANCE.json).',
                         items=RACE),
        counts=dict(rowsRerun=len(allrows), agree=sum(r['agree'] for r in allrows), bitIdentical=sum(r['bitIdentical'] for r in allrows),
                    crosscheck=len(xc), crosscheckAgree=sum(r['agree'] for r in xc), maxHRerun=max(r['h'] for r in allrows)),
        timings=dict(totalSecs=round(time.time() - T0, 1),
                     families={k: v['secs'] for k, v in fam.items()}, calegari={k: v['secs'] for k, v in cal.items()},
                     padic=pad['secs'], crosscheck=xsecs),
        files=[dict(file=f, sha256=sha_file(os.path.join(ROOT, f))) for f in deps],
    )
    L['verdict'] = 'AGREE' if (L['counts']['agree'] == L['counts']['rowsRerun'] and L['counts']['crosscheckAgree'] == len(xc)
                               and pad['profilesEqual'] and pad['resEqual'] and L['test2']['enginesAgree']) else 'DISAGREE'
    json.dump(L, open(LEDGER, 'w'), indent=1, ensure_ascii=False)
    open(LEDGER, 'a').write('\n')
    print('certs/zeta-hankel-ledger.json written:', L['verdict'], L['counts'], 'in', L['timings']['totalSecs'], 's')
    for h in headline:
        print('  %-6s %-22s h=%3d  margin %+.6f  [%+.9f, %+.9f]  lifted %+.6f  agree=%s bit=%s' % (
            h['constant'], h['family'], h['h'], h['margin'], h['margin_lo'], h['margin_hi'], h['liftedMargin'], h['agree'], h['bitIdentical']))
    return 0 if L['verdict'] == 'AGREE' else 1

if __name__ == '__main__':
    sys.exit(main())
