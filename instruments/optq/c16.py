#!/usr/bin/env python3
"""instruments/optq/c16.py — the registry's C_16 enclosure (maximusrufus, #246 on teorth/optimizationproblems) decided in the
standard library, the second implementation beside tools/replay-c16.js; no code shared with it or with the claimant's
checkers (kept as text under corpus/optconst-queue/c16-2026-10-27/claimant/, never run).

The claims are corpus/optconst-queue/c16-2026-10-27/claims.json (written before either decider). Here:
- LOWER (LF1, LF2): the trial polynomial's three lattice sums at |k|² <= 4000², μ = 1221/10000, as exact rationals at
  2^-200 by instruments/optq/bgw16a.py (octant enumeration, floor and ceiling of every term) in bgw16a's normalisation
  c_n = 1/(n(n + 10000/1221)), which is the claimant's c_n = 1/(n(1 + 0.1221 n)) times 1221/10000 — the bound
  S1²/(π S2) − ln δ − ln(1 + ln δ) is invariant under scaling c, and the claimant's S1, S2, S3 are the scaled sums
  exactly; so the certificate's bracket integers are checked for CONTAINMENT, not just consistency.
- UPPER (UF1–UF4): S1(μ) by its partial sum over 0 < |k| <= 1000 (integer floor/ceiling at 2^-160) plus the tail bound
  of claims.json UR2 — Z2 = (2π²/3)G with Catalan's G from Ramanujan's series G = (π/8) ln(2 + √3) + (3/8) Σ (n!)²/((2n)!
  (2n+1)²) (a classical identity, read; the tail after N terms <= (4/3)·t_N since the term ratio is < 1/4); every box
  decided by DERIVATIVE SIGNS: on a sub-box X, if the monotone enclosure of B_μ (or g) is below the bound it is done;
  else if the enclosure of B_μ' = S1μ/π − 1/δ − 1/(δ(1 + ln δ)) (written by hand) is negative B_μ is decreasing and its
  sup is B_μ(lo X), if positive its sup is B_μ(hi X); otherwise bisect. Decimal at directed rounding (prec 50), ln
  correctly rounded ±1 ulp (ivdec.py).

usage: python3 -I instruments/optq/c16.py --json OUT --lower 2.1562247706 --upper 2.1562256466 --below 2.1562256457
"""
import argparse, hashlib, json, math, os, re, sys, time
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction as F
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ivdec import contexts, pi_iv, ln_iv, sqrt_iv
import bgw16a

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
DIR = os.path.join(ROOT, 'corpus', 'optconst-queue', 'c16-2026-10-27')
PREC = 50
DN, UPC, EV = contexts(PREC)
PI = pi_iv(PREC)
WIDE = Context(prec=200)


def pinned(rel):
    pins = json.load(open(os.path.join(DIR, 'PINS.json')))
    b = open(os.path.join(DIR, rel), 'rb').read()
    if rel not in pins['files'] or hashlib.sha256(b).hexdigest() != pins['files'][rel]['sha256']:
        raise SystemExit('c16.py: %s does not match its pin' % rel)
    return b


# ---- Decimal intervals (lo, hi), every operation rounded outward ------------------------------------------------------
def iv(x): return (x, x)
def qv(q):  # an exact Fraction as an outward Decimal interval
    q = F(q); return (DN.divide(Decimal(q.numerator), Decimal(q.denominator)), UPC.divide(Decimal(q.numerator), Decimal(q.denominator)))
def add(a, b): return (DN.add(a[0], b[0]), UPC.add(a[1], b[1]))
def sub(a, b): return (DN.subtract(a[0], b[1]), UPC.subtract(a[1], b[0]))
def mul(a, b):
    lo = min(DN.multiply(x, y) for x in a for y in b); hi = max(UPC.multiply(x, y) for x in a for y in b); return (lo, hi)
def div(a, b):
    if b[0] <= 0 <= b[1]: raise ValueError('division by an interval containing 0')
    lo = min(DN.divide(x, y) for x in a for y in b); hi = max(UPC.divide(x, y) for x in a for y in b); return (lo, hi)
def ln(a):
    if not a[0] > 0: raise ValueError('ln of a non-positive interval')
    return ln_iv(a[0], a[1], EV)
ONE = iv(Decimal(1))
def fl(x, k): return str(x.quantize(Decimal(1).scaleb(-k), rounding=ROUND_FLOOR, context=WIDE))
def ce(x, k): return str(x.quantize(Decimal(1).scaleb(-k), rounding=ROUND_CEILING, context=WIDE))
def out(a, k): return [fl(a[0], k), ce(a[1], k)]
def dec(s): return Decimal(s)


# ---- constants -----------------------------------------------------------------------------------------------------
SQ2 = sqrt_iv(Decimal(2), Decimal(2), EV)
def catalan(N=90):
    """Ramanujan: G = (π/8) ln(2 + √3) + (3/8) Σ_{n>=0} t_n, t_n = (n!)²/((2n)!(2n+1)²); t_{n+1}/t_n = (n+1)(2n+1)/(2(2n+3)²) < 1/4,
    so Σ_{n>=N} t_n <= (4/3) t_N."""
    s = F(0); c = F(1)  # c = (n!)²/(2n)!
    for n in range(N):
        if n: c = c * F(n * n, (2 * n) * (2 * n - 1))
        s += c / (2 * n + 1) ** 2
    cN = c * F(N * N, (2 * N) * (2 * N - 1)); tN = cN / (2 * N + 1) ** 2
    S = (qv(s)[0], qv(s + F(4, 3) * tN)[1])
    s3 = sqrt_iv(Decimal(3), Decimal(3), EV)
    return add(mul(div(PI, iv(Decimal(8))), ln(add(iv(Decimal(2)), s3))), mul(qv(F(3, 8)), S))
G = catalan()
Z2 = mul(mul(qv(F(2, 3)), mul(PI, PI)), G)


def gauss(R):  # lattice points with 0 < |k|² <= R²
    return 4 * R + 4 * sum(math.isqrt(R * R - i * i) for i in range(1, R + 1))


# ================================ LOWER ================================
def lower(cert, claimed):
    t0 = time.time()
    R, (p, q) = cert['R'], cert['mu']
    lam = F(q, p)                      # the claimant's c_n over bgw16a's c_n (μ_bgw = q/p)
    (s0, s1, s2), terms, points = bgw16a.sums(R, F(q, p))
    if points != gauss(R): raise SystemExit('c16.py: the octant counts %d lattice points, Gauss %d' % (points, gauss(R)))
    S1 = (s0[0] * lam, s0[1] * lam); S2 = (s1[0] * lam * lam, s1[1] * lam * lam); S3 = (s2[0] * lam * lam, s2[1] * lam * lam)
    P = F(1, 2 ** cert['PREC'])
    br = {k: (int(cert[k + 'lo_num']) * P, int(cert[k + 'hi_num']) * P) for k in ('S1', 'S2', 'S3')}
    contains = {k: br[k][0] <= v[0] and v[1] <= br[k][1] for k, v in (('S1', S1), ('S2', S2), ('S3', S3))}
    a1, a2, a3 = (qv(S1[0])[0], qv(S1[1])[1]), (qv(S2[0])[0], qv(S2[1])[1]), (qv(S3[0])[0], qv(S3[1])[1])
    A = div(mul(a1, a1), mul(PI, a2)); delta = div(a3, a2); Ld = ln(delta)
    L = sub(A, add(Ld, ln(add(ONE, Ld))))
    adm = delta[0] >= 1
    c = dec(claimed)
    v = 'REFUSED' if not adm else 'CERTIFIED' if L[0] >= c else 'REFUTED' if L[1] < c else 'REFUSED'
    rat = F(int(cert['L_lower_bound_rational'][0]), int(cert['L_lower_bound_rational'][1]))
    ratLe = 'CERTIFIED' if rat <= F(L[0]) else 'REFUTED' if rat > F(L[1]) else 'REFUSED'
    fltLe = F(cert['L_lower_bound_float_rounded_down']) <= rat
    prLe = F(dec(claimed)) <= rat
    lf2 = 'CERTIFIED' if all(contains.values()) and ratLe == 'CERTIFIED' and fltLe and prLe else 'REFUTED' if (not all(contains.values()) or ratLe == 'REFUTED' or not fltLe) else 'REFUSED'
    return {'LF1': {'claim': 'C_16 >= ' + claimed, 'verdict': v, 'latticePoints': points, 'distinctNorms': terms, 'S1': out(a1, 20), 'S2': out(a2, 20), 'S3': out(a3, 20),
                    'delta': out(delta, 20), 'deltaAtLeast1': adm, 'enclosure': out(L, 20), 'seconds': round(time.time() - t0, 1)},
            'LF2': {'verdict': lf2, 'bracketsContainExactSums': contains, 'rationalLeExactRHS': ratLe, 'floatLeRational': fltLe, 'printedLeRational': prLe}}, L


# ================================ UPPER ================================
RU, R0 = 1000, 100
SCB = 1 << 160


def prepare(cert):
    t0 = time.time()
    r = bgw16a.r2_table(RU)
    ns = [(n, r[n]) for n in range(1, RU * RU + 1) if r[n]]
    pts = sum(w for _, w in ns)
    if pts != gauss(RU): raise SystemExit('c16.py: the octant counts %d lattice points, Gauss %d' % (pts, gauss(RU)))
    def fsum(term_num_den, pick=lambda n: True):
        lo = hi = 0
        for n, w in ns:
            if not pick(n): continue
            a, b = term_num_den(n, w); qq, rr = divmod(a * SCB, b); lo += qq; hi += qq + (1 if rr else 0)
        return (F(lo, SCB), F(hi, SCB))
    P2 = fsum(lambda n, w: (w, n * n))
    H = fsum(lambda n, w: (w, n), lambda n: n <= R0 * R0)
    T0 = sub(iv(Decimal(R0)), SQ2)
    Hiv = (qv(H[0])[0], qv(H[1])[1])
    K = sub(add(div(Hiv, PI), div(SQ2, T0)), mul(iv(Decimal(2)), ln(T0)))      # K = H/π + √2/T0 − 2 ln T0 (UR4)
    TT, TP = sub(iv(Decimal(RU)), SQ2), add(iv(Decimal(RU)), SQ2)
    boxes = []
    for b in cert['boxes']:
        mu = F(float(b[2])); p, q = mu.numerator, mu.denominator
        P1 = fsum(lambda n, w: (w * q, n * (q + p * n)))
        MU = qv(mu)
        tA = div(sub(Z2, qv(P2[0])), MU)[1]                                                    # UR2 (A): Z2 − P2 with P2's lower end
        tB = add(mul(PI, ln(add(ONE, div(ONE, mul(MU, mul(TT, TT)))))), div(mul(PI, SQ2), TT))[1]   # UR2 (B)
        lnTP = mul(PI, ln(add(ONE, div(ONE, mul(MU, mul(TP, TP))))))                           # UR5 (lower ends only)
        corr = min(div(ONE, TP)[1], div(ONE, mul(iv(Decimal(3)), mul(MU, mul(TP, mul(TP, TP)))))[1])
        tLo = max(Decimal(0), sub(lnTP, mul(mul(PI, SQ2), iv(corr)))[0])
        S1 = (add(qv(P1[0]), iv(tLo))[0], add(qv(P1[1]), iv(min(tA, tB)))[1])
        boxes.append({'d1': F(b[0]), 'd2': F(b[1]), 'muStr': b[2], 'mu': MU, 'printed': b[3], 'S1': S1, 'tailUsed': 'A' if tA <= tB else 'B', 'tA': tA, 'tB': tB})
    boxes.sort(key=lambda x: x['d1'])
    return {'boxes': boxes, 'K': K, 'H': H, 'P2': P2, 'T0': T0, 'TWOT02': mul(iv(Decimal(2)), mul(T0, T0)), 'distinctNorms': len(ns), 'seconds': round(time.time() - t0, 1)}


def B(bx, X):  # monotone enclosure of B_μ over X (a point or a box)
    A = div(mul(bx['S1'], add(ONE, mul(bx['mu'], X))), PI); L = ln(X)
    return sub(A, add(L, ln(add(ONE, L))))
def dB(bx, X):  # enclosure of B_μ' over X: S1μ/π − 1/δ − 1/(δ(1 + ln δ))
    return sub(div(mul(bx['S1'], bx['mu']), PI), add(div(ONE, X), div(ONE, mul(X, add(ONE, ln(X))))))
def g(UP, X):
    L = ln(X)
    if not L[0] >= 1: return None
    return add(add(add(ONE, UP['K']), div(add(UP['K'], ln(L)), L)), div(UP['TWOT02'], mul(X, L)))


def sup_box(UP, bx, U, maxdepth):
    a0, b0 = qv(bx['d1'])[0], qv(bx['d2'])[1]
    st = [(a0, b0, 0)]; n = 0; depth = 0; how = {'enclosure': 0, 'decreasing': 0, 'increasing': 0, 'g': 0}; und = []
    while st:
        a, b, k = st.pop(); n += 1; X = (a, b)
        bB = B(bx, X)[1]; gg = g(UP, X); bG = gg[1] if gg else None
        if bB <= U: how['enclosure'] += 1; depth = max(depth, k); continue
        if bG is not None and bG <= U: how['g'] += 1; depth = max(depth, k); continue
        d = dB(bx, X)
        if d[1] < 0 and B(bx, iv(a))[1] <= U: how['decreasing'] += 1; depth = max(depth, k); continue
        if d[0] > 0 and B(bx, iv(b))[1] <= U: how['increasing'] += 1; depth = max(depth, k); continue
        if k >= maxdepth:
            und.append([str(a), str(b)])
            if len(und) > 3: break
            continue
        m = EV.sqrt(EV.multiply(a, b)) if b > 2 * a else EV.divide(EV.add(a, b), 2)
        if not (a < m < b): und.append([str(a), str(b)]); continue
        st.append((a, m, k + 1)); st.append((m, b, k + 1))
    return {'verdict': 'REFUSED' if und else 'CERTIFIED', 'subBoxes': n, 'depth': depth, 'how': how}


def upper(cert, UP, claimed, maxdepth=80):
    t0 = time.time(); U = dec(claimed); bs = UP['boxes']
    cov = 'CERTIFIED'
    if bs[0]['d1'] != 1 or bs[-1]['d2'] != F(cert['D0']): cov = 'REFUTED'
    for x, y in zip(bs, bs[1:]):
        if x['d2'] != y['d1'] or not x['d1'] < x['d2']: cov = 'REFUTED'
    per = [sup_box(UP, bx, U, maxdepth) for bx in bs]
    uf2 = 'CERTIFIED' if all(r['verdict'] == 'CERTIFIED' for r in per) else 'REFUSED'
    D0 = qv(F(cert['D0'])); gD0 = g(UP, D0); lnD0 = ln(D0)
    side = lnD0[0] >= 1 and add(UP['K'], ln(lnD0))[0] >= 1
    uf3 = 'CERTIFIED' if side and gD0[1] <= U else 'REFUTED' if side and gD0[0] > U else 'REFUSED'
    v = 'CERTIFIED' if cov == uf2 == uf3 == 'CERTIFIED' else 'REFUSED'
    return {'claim': 'C_16 <= ' + claimed, 'verdict': v, 'UF1': {'verdict': cov}, 'UF2': {'verdict': uf2, 'certified': sum(r['verdict'] == 'CERTIFIED' for r in per), 'boxes': len(per),
            'subBoxes': sum(r['subBoxes'] for r in per), 'maxDepth': max(r['depth'] for r in per), 'how': {k: sum(r['how'][k] for r in per) for k in per[0]['how']}},
            'UF3': {'verdict': uf3, 'gD0': out(gD0, 20), 'sideConditions': side}, 'perBox': per, 'seconds': round(time.time() - t0, 1)}


def facts(UP, bx):
    B1, B2 = B(bx, qv(bx['d1'])), B(bx, qv(bx['d2']))
    f = (max(B1[0], B2[0]), max(B1[1], B2[1])); g1 = None
    if bx['d1'] >= 16:
        g1 = g(UP, qv(bx['d1'])); f = (min(f[0], g1[0]), min(f[1], g1[1]))
    pb = F(bx['printed'])
    v = 'CERTIFIED' if pb >= F(f[1]) else 'REFUTED' if pb < F(f[0]) else 'REFUSED'
    return {'B_d1': out(B1, 13), 'B_d2': out(B2, 13), 'g_d1': out(g1, 13) if g1 else None, 'formula': out(f, 13), 'formulaHi': f[1], 'UF4': v}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', required=True); ap.add_argument('--lower', required=True); ap.add_argument('--upper', required=True); ap.add_argument('--below', required=True)
    a = ap.parse_args()
    t0 = time.time()
    CL = json.loads(pinned('claimant/lower_certificate.json')); CU = json.loads(pinned('claimant/upper_certificate.json'))
    pg = pinned('upstream/16a.md').decode('utf8')
    up_sec = pg.split('## Known upper bounds')[1].split('## Known lower bounds')[0]; lo_sec = pg.split('## Known lower bounds')[1]
    row = re.compile(r'^\| \$([0-9.]+)\^\\\*\$ \| \[certificate\]\(https://github\.com/maximusrufus/c16-bgw-certificates\)', re.M)
    if row.search(up_sec).group(1) != a.upper or row.search(lo_sec).group(1) != a.lower: raise SystemExit('c16.py: the page prints other bounds than the ones passed')
    print('G %s  Z2 %s' % (out(G, 20), out(Z2, 18)))
    low, Lenc = lower(CL, a.lower)
    print('LF1 %s %s  LF2 %s  %s s' % (low['LF1']['verdict'], low['LF1']['enclosure'], low['LF2']['verdict'], low['LF1']['seconds']))
    UP = prepare(CU)
    print('upper: S1(μ) for %d boxes at |k| <= %d (%d norms), K %s  %s s' % (len(UP['boxes']), RU, UP['distinctNorms'], out(UP['K'], 20), UP['seconds']))
    u = upper(CU, UP, a.upper)
    print('UF1 %s  UF2 %s (%d/%d boxes, %d sub-boxes, depth %d, %s)  UF3 %s g(D0) %s  %s s' % (u['UF1']['verdict'], u['UF2']['verdict'], u['UF2']['certified'], u['UF2']['boxes'], u['UF2']['subBoxes'], u['UF2']['maxDepth'], u['UF2']['how'], u['UF3']['verdict'], u['UF3']['gD0'], u['seconds']))
    fx = [facts(UP, bx) for bx in UP['boxes']]
    Urat = F(int(CU['U_rational'][0]), int(CU['U_rational'][1]))
    cnt = {k: sum(f['UF4'] == k for f in fx) for k in ('CERTIFIED', 'REFUTED', 'REFUSED')}
    uf4 = 'CERTIFIED' if Urat <= F(dec(a.upper)) and cnt['REFUTED'] == 0 and cnt['REFUSED'] == 0 else 'REFUTED' if cnt['REFUTED'] or Urat > F(dec(a.upper)) else 'REFUSED'
    wi = max(range(len(fx)), key=lambda i: fx[i]['formulaHi'])
    supported = ce(fx[wi]['formulaHi'], 10)
    print('UF4 %s  box bounds %s; the largest endpoint value %s (box %d) -> the boxes support %s' % (uf4, cnt, fx[wi]['formula'], wi, supported))
    bel = upper(CU, UP, a.below, 40)
    lp1 = str(dec(a.lower) + Decimal(1).scaleb(-len(a.lower.split('.')[1])))
    # the lower control re-uses the computed enclosure (the claim moves, the sums do not)
    c = dec(lp1); lv = 'CERTIFIED' if Lenc[0] >= c else 'REFUTED' if Lenc[1] < c else 'REFUSED'
    print('RED upper-below-supported %s: %s   RED lower-plus-one-unit %s: %s' % (a.below, bel['verdict'], lp1, lv))
    for f in fx: del f['formulaHi']
    res = {'python': sys.version.split()[0], 'seconds': round(time.time() - t0, 1),
           'constants': {'G': out(G, 20), 'Z2': out(Z2, 20), 'pi': out(PI, 20), 'sqrt2': out(SQ2, 20)},
           'lower': low,
           'upper': {'claim': u['claim'], 'verdict': u['verdict'], 'R': RU, 'UF1': u['UF1'], 'UF2': u['UF2'], 'UF3': u['UF3'],
                     'UF4': {'verdict': uf4, 'U_rationalLePrinted': Urat <= F(dec(a.upper)), 'boxBounds': cnt}, 'K': out(UP['K'], 20),
                     'endpointMax': {'box': wi, 'enclosure': fx[wi]['formula']}, 'supported': supported,
                     'boxes': [dict({'box': i, 'mu': bx['muStr'], 'tailUsed': bx['tailUsed'], 'S1': out(bx['S1'], 15), 'UF2': u['perBox'][i]['verdict'], 'subBoxes': u['perBox'][i]['subBoxes']}, **fx[i]) for i, bx in enumerate(UP['boxes'])],
                     'seconds': u['seconds'] + UP['seconds']},
           'redControls': {'upper-below-supported': bel['verdict'], 'lower-plus-one-unit': lv}}
    with open(a.json, 'w') as fh: json.dump(res, fh, indent=1)
    print('c16.py: lower %s, upper %s; %s s' % (low['LF1']['verdict'], u['verdict'], res['seconds']))


if __name__ == '__main__':
    main()
