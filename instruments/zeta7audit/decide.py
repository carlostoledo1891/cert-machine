#!/usr/bin/env python3
"""decide.py — the audit of P. Anand, "Zeta 7 is Irrational" (Zenodo 22920911 v1), and of issue #1 on
gmDevi/zeta-7-21-lean (opened 2026-10-03 by GitHub user huntrontrakkr, a third party). Writes
certs/zeta7-anand-audit.json.

What is decided, and how:
  * the outer integral I_out of (73)/(122), EXACTLY, from the paper's (54), (58), (59), (62) [and (72)]
    under each reading of (71)-(73) — pwaff.integrate proves the integrand piecewise affine and returns
    an exact rational; the printed Table 5 integrated the same way;
  * the same evaluator on Fauzan's (4.10), (4.14), (5.3) and on his printed (5.8)-(5.10): it must give
    his printed 127751/96000 (the calibration — a printed value that is right);
  * two finite-K routes that share no expression with the limit: the exact integer sum
    (1/K^2) sum_{K/3<p<=2h} (-L_p) over all integers p, and the actual prime sum
    (1/K^2) sum_p (-L_p) log p in arb balls — the outer part of log m_{K,M}/K^2 itself;
  * the inner integral (121) from (64)-(69), exactly (inner.py);
  * the constants: A0 against Fauzan's A*, the paper's own tail bound (85) at T = 20 (and Fauzan's (5.16)
    by the same function, as calibration), U's ingredients I(rho) and C* in arb, the potential 2U^rho - V
    at grid points in arb (measured, not a sup);
  * the margins A_M + U exactly, for the printed values and for every correction, and the cutoff M;
  * the measured family (certs/zeta7-anand/measure.json, from measure.py);
  * the Lean repository: a grep census at the pinned commit (not built here).
Runs under instruments/zetahankel/.venv (python-flint for arb). About 15 s.
usage: instruments/zetahankel/.venv/bin/python instruments/zeta7audit/decide.py"""
import sys, os, json, time, math, hashlib, platform, re, subprocess
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VENV = os.path.join(ROOT, 'instruments', 'zetahankel', '.venv', 'bin', 'python')
try:
    import flint  # noqa
except ImportError:
    if os.path.exists(VENV) and os.path.realpath(sys.executable) != os.path.realpath(VENV):
        os.execv(VENV, [VENV] + sys.argv)
    sys.exit('zeta7audit: python-flint is not importable; run `make zetahankel-venv`')
sys.path.insert(0, HERE)
sys.set_int_max_str_digits(0)
from fractions import Fraction as Q
from decimal import Decimal, getcontext
from flint import arb, ctx, fmpq
import pwaff, formulas as F, inner as INNER

OUT = os.path.join(ROOT, 'certs', 'zeta7-anand-audit.json')
MEASURE = os.path.join(ROOT, 'certs', 'zeta7-anand', 'measure.json')
PROV = os.path.join(HERE, 'PROVENANCE.json')
CACHE = os.path.join(ROOT, 'corpus', 'sources', 'zeta7-anand', '.cache')
LEAN = os.path.join(CACHE, 'zeta-7-21-lean')
rel = lambda p: os.path.relpath(p, ROOT)
sha_file = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
getcontext().prec = 40


def down(x): return math.nextafter(x, -math.inf)
def up(x): return math.nextafter(x, math.inf)


def rq(x):
    """An exact rational for the record: the fraction and a 16-significant-digit decimal."""
    x = Q(x)
    d = Decimal(x.numerator) / Decimal(x.denominator)
    return dict(q=f'{x.numerator}/{x.denominator}' if x.denominator != 1 else str(x.numerator), dec=f'{d:.16g}', f=float(x))


def ball(a):
    return [down(float(a.lower())), up(float(a.upper()))]


def A(q):
    q = Q(q)
    return arb(fmpq(q.numerator, q.denominator))


def pieces_out(pcs):
    return [dict(lo=str(a), hi=str(b), b=str(c0), c=str(c1)) for a, b, c0, c1 in pcs]


def primes_upto(n):
    s = bytearray([1]) * (n + 1); s[0:2] = b'\x00\x00'
    for i in range(2, int(n ** 0.5) + 1):
        if s[i]:
            s[i * i::i] = bytearray(len(s[i * i::i]))
    return [i for i in range(n + 1) if s[i]]


# ------------------------------------------------------------------------------------------------------
# 1. the outer integral
# ------------------------------------------------------------------------------------------------------
def outer_block():
    t = time.time()
    out = {}
    tab = pwaff.integrate_pieces(F.ANAND_TABLE5)
    out['table5'] = dict(rows=[dict(lo=str(l), hi=str(r), b=str(b), c=str(c)) for l, r, b, c in F.ANAND_TABLE5],
                         integral=rq(tab), printed122=rq(F.ANAND['Iout']), equal=tab == F.ANAND['Iout'])
    R2, p2 = pwaff.integrate(F.anand_T_R2, F.Y0, F.Y1)
    R1, p1 = pwaff.integrate(F.anand_T_R1, F.Y0, F.Y1)
    RL, _ = pwaff.integrate(F.anand_T_R2_legendre, F.Y0, F.Y1)
    dint, _ = pwaff.integrate(F.anand_d, F.Y0, Q(1, 2))
    out['formula'] = dict(
        R2=dict(value=rq(R2), pieces=pieces_out(p2),
                reading='lim -gamma_p^out/K from (59) plus the scalar of (62): the integrand whose integral is lim (1/K^2) sum (-L_p) log p '
                        'with L_p from (60) — what (61) defines and what the proof of Proposition 5.4 uses ("-gamma_out = K(R0 - d) + O(1)")'),
        R1=dict(value=rq(R1), pieces=pieces_out(p1),
                reading='the literal (71) + (73): R0 := lim -gamma/K, and d(y) of (72) subtracted again — double-counts the rank correction; '
                        'the reading most favourable to the claimant'),
        dIntegral=rq(dint), legendreScalarAgrees=RL == R2)
    # the last row, alone
    lo, hi = Q(1), Q(37, 20)
    form_last, plast = pwaff.integrate(F.anand_T_R2, lo, hi)
    tab_last = pwaff.integrate_pieces([F.ANAND_TABLE5[-1]])
    form_last_R1, _ = pwaff.integrate(F.anand_T_R1, lo, hi)
    out['lastRow'] = dict(interval=['1', '37/20'], formulaPieces=pieces_out(plast), formula='37/20 - y',
                          formulaIsScalarOnly=plast == [(lo, hi, Q(37, 20), Q(-1))], table='-239/20 - 2y',
                          formulaIntegral=rq(form_last), tableIntegral=rq(tab_last), delta=rq(form_last - tab_last),
                          readingsAgree=form_last == form_last_R1,
                          why='For p > K the paper sets gamma_p^out = 0 (§5.1) and d(y) = 0 off (1/3,1/2), so the integrand is the scalar '
                              'part alone: v_p(S_K) = -2 #{i < h : 2i >= p} for p in (K, 2h] (K!, N!, 4 are p-units), i.e. -L_p/K -> 2 lambda - y = 37/20 - y >= 0.')
    # Table 5 against the formula, interval by interval
    rows = []
    for l, r, b, c in F.ANAND_TABLE5:
        rows.append(dict(lo=str(l), hi=str(r), table=rq(pwaff.integrate_pieces([(l, r, b, c)])),
                         R2=rq(pwaff.integrate(F.anand_T_R2, l, r)[0]), R1=rq(pwaff.integrate(F.anand_T_R1, l, r)[0])))
    out['byTable5Interval'] = rows
    t13 = pwaff.integrate_pieces(F.ANAND_TABLE5[:-1])
    out['oneThirdToOne'] = dict(table=rq(t13), R2=rq(pwaff.integrate(F.anand_T_R2, F.Y0, 1)[0]), R1=rq(pwaff.integrate(F.anand_T_R1, F.Y0, 1)[0]))
    # Fauzan, the calibration
    fg, pfg = pwaff.integrate(F.fauzan_T_from_gamma, F.Y0, F.Y1)
    fp, pfp = pwaff.integrate(F.fauzan_T_printed_R0, F.Y0, F.Y1)
    ft = pwaff.integrate_pieces(F.FAUZAN_TABLE4)
    out['fauzan'] = dict(printed510=rq(F.FAUZAN['Iout']), fromGamma414=rq(fg), fromPrintedR0=rq(fp), table4=rq(ft),
                         allEqual=fg == fp == ft == F.FAUZAN['Iout'], piecesFromGamma=pieces_out(pfg),
                         lastRowTable4='37/20 - y', lastRowFormula=[str(x) for x in pfg[-1]])
    out['secs'] = round(time.time() - t, 3)
    return out, R2, R1


# ------------------------------------------------------------------------------------------------------
# 2. finite K: the exact integer sum and the prime sum, both from the finite exponents L_p(K)
# ------------------------------------------------------------------------------------------------------
def integer_sum(n, Lp):
    K, h = 40 * n, 37 * n
    s = 0
    for p in range(K // 3 + 1, 2 * h + 1):
        s -= Lp(n, p)
    return Q(s, K * K)


def prime_sum(n, Lp, primes):
    K, h = 40 * n, 37 * n
    old = ctx.prec; ctx.prec = 128
    try:
        tot = arb(0); cnt = 0
        for p in primes:
            if 3 * p <= K or p > 2 * h:
                continue
            L = Lp(n, p)
            if L:
                tot -= L * arb(p).log()
            cnt += 1
        return ball(tot / (K * K)), cnt
    finally:
        ctx.prec = old


def finite_block(R2):
    t = time.time()
    ns = [100, 1000, 10000]
    primes = primes_upto(2 * 37 * max(ns))
    rows = []
    for n in ns:
        ia = integer_sum(n, F.anand_Lp)
        pa, ca = prime_sum(n, F.anand_Lp, primes)
        ifz = integer_sum(n, F.fauzan_Lp)
        pf, _ = prime_sum(n, F.fauzan_Lp, primes)
        rows.append(dict(n=n, K=40 * n, primes=ca,
                         anandIntegerSum=rq(ia), anandIntegerSumMinusLimit=float(ia - R2), anandPrimeSum=pa,
                         fauzanIntegerSum=rq(ifz), fauzanIntegerSumMinusLimit=float(ifz - F.FAUZAN['Iout']), fauzanPrimeSum=pf))
    return dict(rows=rows, secs=round(time.time() - t, 2),
                what='L_p(K) = v_p(S_K) + gamma_p^out, the third branch of (60), as exact integers from (54), (58), (59), (62) at K = 40n. '
                     'The integer sum over every integer p in (K/3, 2h] is a Riemann sum of the limit integrand (error O(1/K)); the prime sum '
                     'with log p in arb is the outer-range part of log m_{K,M}/K^2 itself at that K, which tends to I_out by the prime number '
                     'theorem, as the paper\'s Proposition 5.4 says.')


# ------------------------------------------------------------------------------------------------------
# 3. constants: A0, the tail bound (85), U's ingredients, the potential
# ------------------------------------------------------------------------------------------------------
TABLE1_L = [870000000000, 800000000000, 700000000000, 600000000000, 500000000000, 400000000000, 300000000000, 250000000000,
            200000000000, 150000000000, 120000000000, 100000000000, 80000000000, 60000000000, 40000000000, 20000000000]
TABLE1_C = [100000000000, 80000000000, 60000000000, 50000000000, 50000000000, 50000000000, 50000000000, 50000000000,
            50000000000, 50000000000, 50000000000, 50000000000, 50000000000, 50000000000, 15000000000, 120000000000]


def constants_block():
    t = time.time()
    out = {}
    fz = F.FAUZAN
    fsum = fz['Iout'] + fz['inner'] + fz['tail']
    out['A0'] = dict(printed87=rq(F.ANAND['A0']), fauzanAstar519=rq(fz['Astar']), equalsFauzanAstar=F.ANAND['A0'] == fz['Astar'],
                     fauzanIout_plus_518_plus_516=rq(fsum), equalsFauzanSum=fsum == fz['Astar'],
                     role='used in (88) as the bound for int_20^inf R/x^3 dx (end of §5.5: "A0 = int_20^inf R/x^3 dx bounded in Appendix A"); '
                          'Appendix A gives no derivation of it')
    P20, C20 = F.anand_P(20), F.anand_C(20)
    G = lambda v: v * (1 - v) * (2 * v - 1)
    Pbar = -F.LAM * Q(1, 6) + Q(296, 3) * Q(1, 6)
    tail = F.tail_bound_85(20, F.LAM, P20, F.ANAND['P_mean'], C20, F.ANAND['C_bound'], F.ANAND['Q_hi'])
    ftail = F.tail_bound_85(20, F.LAM, F.fauzan_P(20), fz['P_mean'], Q(0), fz['C_bound'], fz['Q_hi'])
    out['tail85'] = dict(P20=rq(P20), P20printed='74/3', C20=rq(C20), Pmean=rq(Pbar), PmeanPrinted='11729/720',
                         bound=rq(tail), fauzanSameFunction=rq(ftail), fauzanPrinted516=rq(fz['tail']), fauzanReproduced=ftail == fz['tail'],
                         what='the paper\'s own (85) at T = 20 with its (83) (Q <= 27/8) and |C| < 22: an upper bound for int_20^inf R/x^3. '
                              '(80)-(83) are taken as printed, not re-derived here. The same function on Fauzan\'s (5.15) with his (5.14) and '
                              '|C| < 16 returns his printed (5.16) exactly — the calibration of this reading of (85).')
    # U's ingredients
    old = ctx.prec; ctx.prec = 200
    try:
        Ls = [Q(x, 10 ** 12) for x in TABLE1_L]; cs = [Q(x, 10 ** 12) for x in TABLE1_C]
        lg = lambda q: (A(q) / 4).log()
        S = [Q(0)]
        for c in cs:
            S.append(S[-1] + c)
        I110 = sum((A(S[j + 1] ** 2 - S[j] ** 2) * lg(Ls[j]) for j in range(16)), arb(0))
        Inest = arb(0)
        for i in range(16):
            for j in range(16):
                Inest += A(cs[i]) * A(cs[j]) * lg(Ls[min(i, j)])        # nested: the pair takes the OUTER interval's log(L/4)
        al, la = A(F.ALPHA), A(F.LAM)
        Cs = -2 * la + 16 * al * la * (1 - al.log()) + 3 * la ** 2 - 2 * la ** 2 * (2 * la).log()
        M0 = A(F.ANAND['M0'])
        U110 = la * M0 - I110 + Cs
        Unest = la * M0 - Inest + Cs
        Unest_q = Q(math.ceil(float(Unest.upper()) * 10 ** 6), 10 ** 6)       # a rational upper bound, 6 decimals
        assert A(Unest_q) > Unest
        # the potential 2U^rho(t) - V(t), (109) and (113), at grid points (each value an arb ball; the max over a grid is not a sup)
        Lb = [A(x) for x in Ls]; cb = [A(x) for x in cs]
        pi = arb.pi()

        def pot(tq):
            tt = A(tq); s = arb(0)
            for Lq, Lj, cj in zip(Ls, Lb, cb):
                if tq <= Lq:
                    s += cj * (Lj / 4).log()
                else:
                    s += cj * ((tt - Lj / 2 + (tt * (tt - Lj)).sqrt()) / 2).log()
            r = tt.sqrt()
            V = (1 + tt).log() - 8 * al * (tt + al * al).log() - 2 + 16 * al + 2 * r * (pi + (1 / r).atan() - 8 * (al / r).atan())
            return 2 * s - V
        grid = [Q(k, 10000) for k in range(1, 20001)] + [Q(2) + Q(k, 100) for k in range(1, 1801)]
        best_t, best_v = None, None
        for tq in grid:
            v = pot(tq)
            if best_v is None or v.mid() > best_v.mid():
                best_t, best_v = tq, v
        at2648 = pot(Q(2648, 10000))
        Umeas = la * best_v - Inest + Cs
        out['U'] = dict(printed96=rq(F.ANAND['U']), M0=rq(F.ANAND['M0']),
                        I110asPrinted=ball(I110), I110printedDecimal=F.ANAND['I_rho_decimal'],
                        Inested=ball(Inest), Cstar=ball(Cs), CstarPrintedDecimal=F.ANAND['Cstar_decimal'],
                        sum110=ball(U110), sumPrintedDecimal=F.ANAND['sum_decimal'],
                        sumNested=ball(Unest), sumNestedRationalUpper=rq(Unest_q),
                        why110='(110) accumulates S_j from j = 1, the OUTERMOST interval (L_1 = 0.87), so each pair of nested arcsine measures '
                               'is given the inner interval\'s log(L/4); the potential of the outer measure is the constant log(L_outer/4) on the inner '
                               'one\'s support, so the pair\'s energy is log(L_outer/4). Summed correctly, I(rho) = -1.948 (equal to (110) with S taken '
                               'from the inside), not -3.143. The slip makes the printed bound WEAKER: lambda M0 - I(rho) + C* is 0.556, and (96) '
                               'still holds — it is in the claimant\'s disfavour.',
                        potential=dict(grid=f'{len(grid)} points: t = k/10^4 on (0, 2] and 2 + k/100 on (2, 20]', maxAt=str(best_t),
                                       maxBall=ball(best_v), at02648=ball(at2648), printedMax='-5.4719 at t ~ 0.2648 (§6.2)', bound94='-5.45',
                                       printedWorstA3='-5.865 on [0.3, 0.4], -5.689 after subdividing [L1, 2]',
                                       note='each value is an arb ball; the max over a grid is a MEASUREMENT, not a certified sup — the paper\'s A.3 '
                                            'partition certificate is not re-run here'),
                        Umeasured=ball(Umeas))
    finally:
        ctx.prec = old
    out['secs'] = round(time.time() - t, 2)
    return out, Unest_q


# ------------------------------------------------------------------------------------------------------
# 4. the margins
# ------------------------------------------------------------------------------------------------------
def margins_block(R2, R1, tailq, Unest_q, measured_U):
    a = F.ANAND
    out = {}
    B0p = a['A0'] + a['Iout'] + a['inner']
    A200p = F.anand_AM(200, a['A0'], a['Iout'], a['inner'])
    A1e5p = F.anand_AM(100000, a['A0'], a['Iout'], a['inner'])
    out['printedChain'] = dict(B0=rq(B0p), B0printedDecimal=a['B0_decimal'],
                               A200=rq(A200p), A200printed=rq(a['A200']), A200equal=A200p == a['A200'],
                               A100000=rq(A1e5p), A100000printed=rq(a['A100000']), A100000equal=A1e5p == a['A100000'],
                               A200plusU=rq(a['A200'] + a['U']), A100000plusU=rq(a['A100000'] + a['U']),
                               holds118=a['A200'] + a['U'] < a['claim118'], holds119=a['A100000'] + a['U'] < a['claim119'],
                               decayM200=rq(1600 * (a['A200'] + a['U'])), decayM100000=rq(1600 * (a['A100000'] + a['U'])))
    lastonly = a['Iout'] - pwaff.integrate_pieces([F.ANAND_TABLE5[-1]]) + pwaff.integrate(F.anand_T_R2, 1, Q(37, 20))[0]
    iouts = [('printed', 'I_out as printed (122)', a['Iout']),
             ('lastRow', 'Table 5 kept on (1/3, 1], its last row replaced by 37/20 − y (the issue\'s point 1) — not a reading: the formulas contradict Table 5 on (1/3, 1] too', lastonly),
             ('R2', 'I_out from (54), (58), (59), (62) — reading R2, the faithful one (the issue\'s point 2)', R2),
             ('R1', 'I_out from the literal (71)–(73) — reading R1, d subtracted twice, the most favourable to the claimant', R1)]
    a0s = [('printed', 'A0 as printed (87)', a['A0']), ('tail85', 'A0 replaced by the paper\'s own (85) bound at T = 20 (the issue\'s point 3)', tailq)]
    us = [('printed', 'U = 44/25 as printed (96)', a['U'], 'decided'),
          ('nested', 'U from the correctly summed energy of the paper\'s own ρ (rounded up)', Unest_q, 'decided'),
          ('measured', 'U replaced by the measured log F_K(ζ(7))/K² at n = 3 — the value of the quantity U bounds, at one n', measured_U, 'measured')]
    scen = []
    for ki, li, iv in iouts:
        for ka, la_, av in a0s:
            for ku, lu, uv, status in us:
                B0 = av + iv + a['inner']
                A200 = F.anand_AM(200, av, iv, a['inner'])
                A1e5 = F.anand_AM(100000, av, iv, a['inner'])
                scen.append(dict(key=f'{ki}|{ka}|{ku}', Iout=ki, A0=ka, U=ku, status=status if ki != 'lastRow' else status + ', not a reading',
                                 IoutValue=rq(iv), A0Value=rq(av), UValue=rq(uv),
                                 B0=rq(B0), A200plusU=rq(A200 + uv), A100000plusU=rq(A1e5 + uv), B0plusU=rq(B0 + uv),
                                 decayPerN2=rq(1600 * (A200 + uv)), negative118=A200 + uv < 0))
    out['labels'] = dict(Iout={k: l for k, l, _ in iouts}, A0={k: l for k, l, _ in a0s}, U={k: l for k, l, _, _ in us})
    out['scenarios'] = scen
    # any cutoff: A_M - B0 = 9 lambda/M - 11549/(720 M^2) + 44/M^3 = (1/M)(9 lambda - 11549/(720 M) + 44/M^2) > 0 for every M > 0,
    # because the quadratic 9 lambda M^2 - (11549/720) M + 44 has negative discriminant.
    disc = Q(11549, 720) ** 2 - 4 * 9 * F.LAM * 44
    out['anyCutoff'] = dict(discriminant=rq(disc), AMexceedsB0ForEveryM=disc < 0,
                            statement='A_M > B0 for every M > 0 (the M-terms of (89) form (1/M)(9λ − 11549/(720M) + 44/M²), whose quadratic has negative '
                                      'discriminant), so A_M + U < 0 for some M needs B0 + U < 0; the B0 + U column is the best any cutoff can do.')
    decided = [s for s in scen if s['Iout'] in ('R2', 'R1') and s['U'] != 'measured']
    out['decidedMinA200plusU'] = min((Q(s['A200plusU']['q']) for s in decided))
    out['decidedMinB0plusU'] = min((Q(s['B0plusU']['q']) for s in decided))
    out['measuredMinB0plusU'] = min((Q(s['B0plusU']['q']) for s in scen if s['Iout'] in ('R2', 'R1')))
    for k in ('decidedMinA200plusU', 'decidedMinB0plusU', 'measuredMinB0plusU'):
        out[k] = rq(out[k])
    return out


# ------------------------------------------------------------------------------------------------------
# 5. the Lean repository: a grep census at the pinned commit
# ------------------------------------------------------------------------------------------------------
LEAN_PATTERNS = {'sorry': r'\bsorry\b', 'admit': r'\badmit\b',
                 'axiom declaration': r'^\s*(?:@\[[^\]]*\]\s*)?(?:private |protected |noncomputable )*axiom\s',
                 'native_decide': r'native_decide', 'implemented_by': r'implemented_by', '@[extern': r'@\[extern',
                 'unsafe': r'\bunsafe\b', 'sorryAx': r'sorryAx', '#exit': r'#exit', 'ofReduceBool': r'ofReduceBool',
                 'decide +kernel': r'decide \+kernel'}


def lean_census(path):
    files = []
    for d, dirs, fs in os.walk(path):
        dirs[:] = [x for x in dirs if x not in ('.git', '.lake')]
        for f in fs:
            if f.endswith('.lean'):
                files.append(os.path.relpath(os.path.join(d, f), path))
    files.sort()
    lines = 0; hits = {k: [] for k in LEAN_PATTERNS}
    for f in files:
        for i, l in enumerate(open(os.path.join(path, f), encoding='utf-8')):
            lines += 1
            for k, p in LEAN_PATTERNS.items():
                if re.search(p, l):
                    hits[k].append(f'{f}:{i + 1}')
    head = subprocess.check_output(['git', '-C', path, 'rev-parse', 'HEAD']).decode().strip()
    main = open(os.path.join(path, 'Zeta2Lean', 'Window', 'Main.lean'), encoding='utf-8').read()
    m = re.search(r'theorem zeta_7_to_21_not_all_rational :\s*\n(.*?):=', main, re.S)
    challenge = open(os.path.join(path, 'Challenge.lean'), encoding='utf-8').read()
    readme = open(os.path.join(path, 'README.md'), encoding='utf-8').read()
    return dict(commit=head, files=len(files), lines=lines,
                counts={k: len(v) for k, v in hits.items()},
                where={k: v for k, v in hits.items() if v and k != 'decide +kernel'},
                mainTheorem='theorem ZetaWindow.zeta_7_to_21_not_all_rational :' + (' ' + ' '.join(m.group(1).split()) if m else ''),
                mainTheoremHasHypotheses=False if m and '(' not in m.group(1).split('¬')[0] else True,
                sorryIsTheChallengeStub=hits['sorry'] == ['Challenge.lean:32'] and 'sorry' in challenge,
                mentionsAnand=sorted({f for f in ['README.md', 'formalization.yaml'] if 'Anand' in open(os.path.join(path, f), encoding='utf-8').read()}),
                readmeOnAnand=re.sub(r'\s+', ' ', readme[readme.find('* **Claims about single values.**'):readme.find('* **Relation to the 2-adic')]).strip())


# ------------------------------------------------------------------------------------------------------
def main():
    t0 = time.time()
    prov = json.load(open(PROV))
    srcs = []
    for s in prov['sources']:
        srcs.append(dict(file=s['file'], sha256=s['sha256'], ok=sha_file(os.path.join(ROOT, s['file'])) == s['sha256'], committed=True))
    for s in prov['cache']:
        p = os.path.join(ROOT, s['file'])
        srcs.append(dict(file=s['file'], sha256=s['sha256'], ok=(sha_file(p) == s['sha256']) if os.path.exists(p) else None, committed=False))
    if not all(s['ok'] is not False for s in srcs):
        sys.exit('decide: a pinned source does not hash to PROVENANCE.json: ' + str([s['file'] for s in srcs if s['ok'] is False]))
    outer, R2, R1 = outer_block()
    finite = finite_block(R2)
    inner_v, inner_p = INNER.inner_integral()
    inner = dict(printed121=rq(F.ANAND['inner']), fromDefinitions=rq(inner_v), equal=inner_v == F.ANAND['inner'], certifiedPieces=len(inner_p),
                 printedPieces=192,
                 what='R(x) = -Gamma(x) - N(x) of (64)-(69), proved affine on each of its cells and integrated against x^-3 exactly (inner.py). '
                      'This decides the printed (121) as a consequence of (64)-(69); whether (64)-(69) is the right limit of the inner exponents '
                      '(Proposition 4.4, (70)) is not decided here.')
    consts, Unest_q = constants_block()
    meas = json.load(open(MEASURE))
    m3 = max(meas['rows'], key=lambda r: r['n'])
    measured_U = Q(math.ceil(m3['logF'][1] / m3['K'] ** 2 * 10 ** 6), 10 ** 6)
    margins = margins_block(R2, R1, Q(consts['tail85']['bound']['q']), Unest_q, measured_U)
    lean = lean_census(LEAN) if os.path.isdir(LEAN) else None
    if lean is None:
        sys.exit('decide: the Lean clone is not in corpus/sources/zeta7-anand/.cache/ — fetch it at the pinned commit first')
    a = F.ANAND
    pc = margins['printedChain']
    sc = {s['key']: s for s in margins['scenarios']}
    lastonly = sc['lastRow|printed|printed']
    issue = json.load(open(os.path.join(ROOT, 'corpus', 'sources', 'zeta7-anand', 'github-gmDevi-zeta-7-21-lean-issue-1.json')))
    comments = json.load(open(os.path.join(ROOT, 'corpus', 'sources', 'zeta7-anand', 'github-gmDevi-zeta-7-21-lean-issue-1-comments.json')))
    measured_rows = [dict(n=r['n'], K=r['K'], h=r['h'], logP_per_K2=r['logP_per_K2'], logP_per_h2=r['logP_per_h2'],
                          logF_per_K2=[down(r['logF'][0] / r['K'] ** 2), up(r['logF'][1] / r['K'] ** 2)],
                          P_sha256=r['P_sha256'], lemma23=r['lemma23_leading_coefficient'], prop63=r['prop63_holds'],
                          prop46=all(v['prop46'] is not False for v in r['vp']),
                          prop46Tested=sum(1 for v in r['vp'] if v.get('hyp52')),
                          prop46Sharp=sum(1 for v in r['vp'] if v.get('hyp52') and v['vp_content'] == v['gamma_out']),
                          aboveK=[dict(p=v['p'], vp=v['vp_content'], table5Needs=v['table5_would_need']) for v in r['vp'] if v['p'] > r['K']])
                     for r in meas['rows']]
    verdicts = [
        dict(id='table5-is-the-integral', claim='The printed (122), I_out = −11002997/720000, is the integral of the printed Table 5',
             verdict='CERTIFIED', by='exact rational integration of the nine printed rows', values=[outer['table5']['integral']['q']]),
        dict(id='issue-point-2', claim='I_out from the paper\'s (54), (58), (59), (62) is 453803/288000 (huntrontrakkr, issue #1, point 2)',
             verdict='CERTIFIED', by='pwaff: the integrand proved piecewise affine, integrated exactly; the finite-K integer and prime sums converge to it',
             values=[outer['formula']['R2']['value']['q'], outer['formula']['R1']['value']['q']],
             note='453803/288000 under reading R2 (the faithful one); the literal reading R1 gives 445163/288000. Either is positive.'),
        dict(id='paper-122', claim='(122): I_out = −11002997/720000 follows from the paper\'s own formulas', verdict='REFUTED', kind='arithmetic-slip',
             by='the same integral, both readings', values=[outer['formula']['R2']['value']['q'], outer['formula']['R1']['value']['q']],
             note='Table 5 does not follow from (54), (58), (59), (62) on (1/3, 1] or on (1, 37/20]; the printed value is Table 5\'s integral.'),
        dict(id='table5-last-row', claim='Table 5, last row: T(y) = −239/20 − 2y on [1, 37/20]', verdict='REFUTED', kind='arithmetic-slip',
             by='for p > K the paper sets γ_p^out = 0 and d = 0, so T(y) = 37/20 − y ≥ 0 under every reading; measured v_p(cont Δ_K) = 0 at every prime in (K, 2h] for K = 40, 80, 120',
             values=[outer['lastRow']['formulaIntegral']['q'], outer['lastRow']['tableIntegral']['q']]),
        dict(id='issue-point-1', claim='Correcting (1, 37/20] alone moves A200 + U from −11.99 to +0.95 (issue #1, point 1)', verdict='CERTIFIED',
             by='exact', values=[pc['A200plusU']['q'], lastonly['A200plusU']['q']],
             note='True with the printed A0 and U. With A0 and U also corrected in the claimant\'s favour (below), the last row alone would leave '
                  'A200 + U = ' + sc['lastRow|tail85|nested']['A200plusU']['dec'][:7] + ' < 0: the failure needs the (1/3, 1] part as well, which the formulas also decide.'),
        dict(id='issue-point-3', claim='A0 equals Fauzan\'s I_out + (5.18) + (5.16), his whole ζ(5) constant A* (5.19); the paper\'s own (85) bounds ∫₂₀^∞ R/x³ by about −0.057 (issue #1, point 3)',
             verdict='CERTIFIED', by='exact rational identities; (85) evaluated at T = 20 with (83) and |C| < 22 as printed',
             values=[consts['A0']['printed87']['q'], consts['tail85']['bound']['q']]),
        dict(id='issue-final', claim='With I_out from (59), A200 + U ≈ +4.86, or about +3.49 with A0 also replaced (issue #1)', verdict='CERTIFIED', by='exact',
             values=[sc['R2|printed|printed']['A200plusU']['q'], sc['R2|tail85|printed']['A200plusU']['q']]),
        dict(id='paper-121', claim='(121): ∫₃²⁰ R(x)/x³ dx = 120667538150827615739401/708353029541942104320000 from (64)–(69)', verdict='CERTIFIED',
             by='inner.py: R proved affine on ' + str(len(inner_p)) + ' cells, integrated exactly', values=[inner['fromDefinitions']['q']]),
        dict(id='paper-96', claim='(96): λM0 − I(ρ) + C* ≤ U = 44/25, with I(ρ) = −3.143 by (110)', verdict='CERTIFIED', kind='arithmetic-slip',
             by='arb: the inequality holds (the sum is 0.556); the printed I(ρ) mis-sums the nested energies (−1.948 correctly) — in the claimant\'s disfavour',
             values=[consts['U']['sumNestedRationalUpper']['q']]),
        dict(id='paper-118', claim='(118): A200 + U < −11 < 0, the inequality Theorem 1.1 rests on', verdict='REFUTED', kind='arithmetic-slip',
             by='exact: with I_out from the formulas A200 + U > 0 under both readings, with the printed A0 and U and with every claimant-favourable correction decided here; no cutoff M rescues it',
             values=[sc['R2|printed|printed']['A200plusU']['q'], margins['decidedMinA200plusU']['q'], margins['decidedMinB0plusU']['q']]),
        dict(id='paper-119', claim='(119): A100000 + U < −12, the input to Corollary 1.3', verdict='REFUTED', kind='arithmetic-slip', by='exact, as (118)',
             values=[sc['R2|printed|printed']['A100000plusU']['q']]),
        dict(id='paper-prop46', claim='Proposition 4.6: v_p(Δ_K) ≥ γ_p^out under (52), and ≥ 0 for p > K', verdict='PARTIAL',
             by='exact content of Δ_K at K = 40, 80, 120: holds at every prime tested, with equality at most of them',
             note='a finite statement checked at three K; not a proof for all K'),
        dict(id='paper-prop63', claim='Proposition 6.3 (for every K ∈ 40ℤ): log F_K(ζ(7)) ≤ U K² + 24K log K + 220K', verdict='PARTIAL',
             by='arb at K = 40, 80, 120: holds', note='checked at three K; the real bound is not where the proof fails'),
        dict(id='paper-thm12', claim='Theorem 1.2: 0 < Q_{40n,200}(ζ(7)) < exp(−19000 n²) for all sufficiently large n', verdict='REFUTED', kind='arithmetic-slip',
             by='the proof\'s own bound (117) gives a positive exponent once I_out is computed from the formulas',
             note='The PROOF is refuted. The statement is a limit in n and is not decided by any finite computation; measured, the best integer '
                  'normalisation of this determinant has log P_K(ζ(7))/K² = +0.80, +0.87, +0.88 at n = 1, 2, 3, where the statement needs < −11.87.',
             scope='the derivation, not the asymptotic statement'),
        dict(id='paper-thm11', claim='Theorem 1.1: ζ(7) is irrational', verdict='REFUSED',
             by='its only route, Theorem 1.2 with M = 200, rests on (118), which is refuted',
             note='Not proved by this paper; not disproved either. Whether ζ(7) is irrational is open, and nothing here bears on it beyond this route.'),
        dict(id='paper-cor13', claim='Corollary 1.3: |ζ(7) − a/b| > b^−270 for large b', verdict='REFUSED', by='rests on (119), refuted'),
        dict(id='lean-statement', claim='What gmDevi/zeta-7-21-lean proves: its README\'s theorem — ζ(7), ζ(9), …, ζ(21) are not all rational — with no hypotheses, one intended sorry (Challenge.lean, the Comparator statement stub), no axiom declarations, no native_decide',
             verdict='PARTIAL', by='grep-level reading at commit ' + lean['commit'][:7] + ' (not built here): the statement and the census match the README',
             note='It is not a formalisation of Anand\'s paper and does not say it is: it cites the paper as background and states that its own check could not '
                  'confirm two constants of the final inequality. "ζ(7) is irrational" appears nowhere as a formal statement; the formal theorem does not imply it.'),
    ]
    rec = dict(
        what="The audit of P. Anand, 'Zeta 7 is Irrational' (Zenodo 22920911 v1, 2026-09-23), and of issue #1 on gmDevi/zeta-7-21-lean "
             "(opened 2026-10-03 by GitHub user huntrontrakkr, a third party): the outer integral I_out of (73)/(122) recomputed exactly "
             "from the paper's own formulas under each reading, the margin (118) that Theorem 1.1 rests on recomputed for every correction, "
             "the calibration on Fauzan's ζ(5) paper, the paper's finite statements checked at small K, its own family measured, and the "
             "Lean repository read.",
        generatedBy='instruments/zeta7audit/decide.py', generatedOn=time.strftime('%Y-%m-%d'),
        env=dict(python=platform.python_version(), flint=flint.__version__, machine=platform.machine(), system=platform.system()),
        rule=dict(exact='every integral is an exact rational: pwaff.integrate certifies each branch of the integrand constant on each cell '
                        '(an affine difference evaluated at both closed endpoints) and cuts a cell at the exact point where one is not',
                  balls='every logarithm is an arb ball; [lo, hi] endpoints rounded outward to doubles',
                  independence='no code shared with the claimant or with the issue\'s reproduction script; the calibration on Fauzan is the '
                               'control that the same evaluator reproduces a printed value that is right'),
        scope='Decided: the arithmetic of the paper\'s proof route — I_out, (121), A0, (85), the U ingredients, (117)–(119) — as exact '
              'rationals or balls, from the formulas as printed. Not decided: whether ζ(7) is irrational (open); Theorem 1.2 as an asymptotic '
              'statement (measured at n ≤ 3 only); the inner estimate Proposition 4.4 and its limit (70); Lemma 6.1\'s sup (94) (grid-measured); '
              'the Lean repository\'s own theorem (read, not built).',
        claim=dict(title='Zeta 7 is Irrational', author='Prince Anand', doi='10.5281/zenodo.22920911', version='v1 (the record\'s only version)',
                   date='2026-09-23', license='CC-BY-4.0', pages=42,
                   statement='Theorem 1.1: ζ(7) is irrational. Theorem 1.2: Q_{40n,200} ∈ ℤ[X], deg 37n, 0 < Q_{40n,200}(ζ(7)) < exp(−19000 n²) '
                             'for large n. Corollary 1.3: |ζ(7) − a/b| > b^−270.',
                   route='lim sup K^−2 log Q_{K,M}(ζ(7)) ≤ A_M + U (117), with A_M from the prime sum (89) and U = 44/25 from the real bound; '
                         '(118) A200 + U < −11 < 0 is what makes the integer b^{37n} Q(a/b) tend to zero.',
                   authorNote='The Zenodo record\'s own note: "an optimality mismatch error in 1.3 theorem proof particularly the A200 which uses −11 '
                              'and gets exp(−17600 n²) … would be fixed in v2" — about the decay constant\'s rounding, not about I_out.'),
        issue=dict(url=issue['html_url'], number=issue['number'], title=issue['title'], author=issue['user']['login'], authorIsThisLab=False,
                   opened=issue['created_at'], updated=issue['updated_at'], state=issue['state'], comments=len(comments), fetched='2026-10-05',
                   points=['on (1, 37/20] the outer integrand is 37/20 − y ≥ 0, not −239/20 − 2y; this alone moves A200 + U from −11.99 to +0.95',
                           'integrating (54), (58), (59), (62) over (1/3, 37/20] gives I_out = 453803/288000 ≈ +1.576, not −11002997/720000; the printed value is the integral of Table 5; the same steps on Fauzan reproduce his 127751/96000',
                           'A0 equals Fauzan\'s whole ζ(5) constant A*, used as a bound for ∫₂₀^∞ R/x³, which (85) bounds by about −0.057',
                           'with I_out from (59), A200 + U ≈ +4.86, or about +3.49 with A0 also replaced; (118) fails']),
        sources=srcs,
        outer=outer, finiteK=finite, inner=inner, constants=consts, margins=margins,
        measured=dict(record=rel(MEASURE), sha256=sha_file(MEASURE), rows=measured_rows, scope=meas['scope'],
                      family='K = 40n, N = 3n, W = D_N^8/D_K, h = 37n — the paper\'s own (7), through instruments/zetahankel/hankel.py'),
        lean=lean,
        verdicts=verdicts,
        notDecided=[
            'Whether ζ(7) is irrational. It is open; this audit refutes one proof route and says nothing else about it.',
            'Theorem 1.2 as a statement about large n: no finite computation decides it. Measured at n = 1, 2, 3 only.',
            'Proposition 4.4 (the inner range) and the limit (70): they need K ≥ 200M² and are not tested here; (121) is decided only as a consequence of (64)–(69).',
            'Lemma 6.1\'s potential bound (94) as a sup: measured on a grid, not certified; the paper\'s A.3 partition is not re-run.',
            'The Lean repository\'s own theorem (one of ζ(7), …, ζ(21) is irrational): read at the pinned commit, not built.',
        ],
        verdict='REFUTED',
        verdictLine='The proof route is refuted, not the theorem: I_out computed from the paper\'s own formulas is +1.576 (or +1.546), not −15.28, '
                    'and A200 + U, which must be negative, is positive under every reading and every correction decided here. ζ(7)\'s irrationality is untouched.',
        kind='arithmetic-slip',
        files=[dict(file=rel(os.path.join(HERE, f)), sha256=sha_file(os.path.join(HERE, f)))
               for f in ['pwaff.py', 'formulas.py', 'inner.py', 'measure.py', 'decide.py', 'battery.py', 'PROVENANCE.json'] if os.path.exists(os.path.join(HERE, f))],
        timings=dict(totalSecs=round(time.time() - t0, 1), outer=outer['secs'], finiteK=finite['secs'], constants=consts['secs']))
    json.dump(rec, open(OUT, 'w'), indent=1, ensure_ascii=False)
    print(f"wrote {rel(OUT)} in {rec['timings']['totalSecs']} s — I_out R2 {outer['formula']['R2']['value']['dec'][:8]}, "
          f"R1 {outer['formula']['R1']['value']['dec'][:8]}; A200+U {sc['R2|printed|printed']['A200plusU']['dec'][:7]} (printed {pc['A200plusU']['dec'][:7]}); "
          f"decided min A200+U {margins['decidedMinA200plusU']['dec'][:7]}, B0+U {margins['decidedMinB0plusU']['dec'][:7]}")


if __name__ == '__main__':
    main()
