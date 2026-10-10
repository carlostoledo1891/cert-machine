"""F-540 — "A boundary-field gap for the spin-one Heisenberg chain" (openai/math family 268).

THE CLAIM (build/main.tex:77-83, Theorem thm:main): for H_L(h) = sum_{j=-L}^{L-1} S_j . S_{j+1} - h(S_{-L}^z + S_L^z)
on 2L+1 sites, "E_1(L,3/5) - E_0(L,3/5) > log(10)/392 for every integer L >= 960."

The proof (sections/conclusion.tex) runs a boundary recurrence (boundary.tex) seeded by
 (A) Proposition appth:bounds (thermal.tex:7-19): Y_6(b_0) < .027 and c_0 P_*(lambda_0)^2 < .003745, from fifteen
     short-chain traces Z_{n,g} (n = 2..6, g = 1,-1,0) computed by a floored integer Horner recurrence whose
     results are printed as k_{n,g} = floor(1e16 W_{n,g}) (thermal.tex:197-207, appth:integer-table), with the
     error Lemma appth:matrix-error, the rational intervals (:272-303) and the moment centres (:305-323);
 (B) Proposition apptr:bound (trials.tex:21-28): E_0^opp(m) + am < .4042 for m = 34, 78, 142, 240, from integer
     MPS vectors with endpoint data (Tables apptr:endpoint-table, apptr:coupling-table), a 162-dimensional row
     recurrence (:237-288) and the printed certificate table (:306-320);
 (C) the scalar comparisons of initialization.tex (Lemma in:seedbounds, in:78, in:142, in:puritynumbers, the
     table in:table, Proposition in:quadratic), periodic.tex (per:initial-ratios, per:scalar-checks, G(.052),
     d(.052)) and conclusion.tex (the final ratio and the covering 1920 = M_5);
 plus periodic inputs cited from the companion paper (per:native = its cor:boundary-inputs), which is F-539.

WHAT IS DECIDED HERE, AND HOW (Python integers and Fractions only; nothing from the release is imported or run):
 * (A) the integer matrix D = 80 J A J^{-1} is built from its printed entry rules (eta(w), the -10 bond hops, the
   -3(1+p_w) end hops for g = 0) and the recurrence X_i = floor(D X_{i+1}/80) + t_i I, t_i = floor(Q s_i/S_K),
   K = 192, Q = 2^50, is run EXACTLY on all 3^n columns at once (one 128-bit lane per column; the floor by 80 of
   every lane is an exact magic-number division, valid because every lane is bounded a priori — the bound is
   re-checked as an exact inequality and every final lane is unpacked and bounded). All fifteen quotients
   k_{n,g} = floor(1e16 sum x^2 (2-p_w)(1+p_r) / (2Q^2)) are compared with appth:integer-table. Then every
   constant of Lemma appth:matrix-error, the intervals (appth:interval-data, appth:partition-interval) with
   rigorous exp enclosures, Y_6 in (.0266319440, .0266319607), the five centres of I(n) within 1e-7, the
   polynomial value .003744031780, 1.7032 and the bound .0037442021 < .003745 are checked exactly — and the
   polynomial bound is also re-derived directly from the rational enclosures (not through the rounded centres).
 * (B) A_s (the same integer triple as F-539) and the endpoint vectors b, c are built from the printed tables and
   must equal trial-exact-matrices.json; T_*, G_*, O_* are restricted to the 162 labels ((i,d),(j,d)); the
   three-row recurrence is run to m = 240; V_m, H_m^* are compared with trial-exact-results.json in full and with
   p_m, q_m, k_m of the certificate table, and 202100 V_m - H_m^* > 0 is checked. The contraction lemma and the
   recurrence are re-derived a second way for m = 2..7 by explicit amplitudes b^T A_{s1}..A_{sm} c and the
   explicit opposite-field Hamiltonian (and for m = 2..6 compared with trial-direct-physical-crosscheck.json).
 * (C) every printed scalar comparison listed above, exactly; e^y by partial sums with a proved tail; cube roots
   by cubing; fractional powers by raising both sides to integer powers. The periodic constants l, U, V, m_J, m_N
   and 1 - S(72,b_1) <= 151249/2500000 are re-derived here from the companion's printed b = 49/4 table by F-539's
   scalar code (F-539 decides that table; here it is an input).
 * the operator-norm facts behind A being a contraction: the bond (-2,-1,1) and the two-bond operator
   S_2.(S_1+S_3) (eigenvalues -3..2) by exact minimal polynomials, and the printed upper bounds 5.4 .. 15.4.

WHAT IS NOT DECIDED HERE: the theorem's analytic argument — the boundary transfer identity (sec:transfer), the
group averaging identity appth:average and the leading-line invariance, Proposition per:concentration beyond its
scalar instances, Lemma be:recurrence and Proposition be:coupled (their scalar instances are checked), the
squaring/purity lemma, Lemma co:signed, Proposition co:purity, the Fox-Glynn coefficient estimate and the
Frobenius propagation argument of appth:matrix-error (their constants are checked), the variational principle,
and Tasaki's index corollary (sec:topology). The periodic thermal table itself is F-539's finite input and is
decided there (where W_{12,g} is refused for cost). A CERTIFIED here says: this paper's finite certificate is
exactly right.
"""
import itertools
import json
import math
import os
import struct
import sys
import time
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
import f539_haldane_periodic as P9  # noqa: E402  (this audit's own code; nothing from the release is imported)

F = Fraction
dec, lit, exp_bounds, log_bounds, f_sq, mm = P9.dec, P9.lit, P9.exp_bounds, P9.log_bounds, P9.f_sq, P9.mm

DIR = 'preprints/A-boundary-field-gap-for-the-spin-one-Heisenberg-chain-September-24-2026'
SEC = DIR + '/build/sections/'
MAIN = DIR + '/build/main.tex'
THERM, TRIALS, INIT, PER, CONC, BOUND = (SEC + f for f in ('thermal.tex', 'trials.tex', 'initialization.tex', 'periodic.tex', 'conclusion.tex', 'boundary.tex'))
VER = DIR + '/verification/'
TMAT, TRES, TCROSS, TCERT = (VER + f for f in ('trial-exact-matrices.json', 'trial-exact-results.json', 'trial-direct-physical-crosscheck.json', 'thermal_certificate_results.json'))

A_SHIFT = F(700741, 500000)
H_FIELD = F(3, 5)
B0 = F(49, 4)
ALPHA = F(2021, 5000)


# ----------------------------------------------------------------------------------------------- printed values
def printed(src):
    import re
    P = {}
    th = src.text(THERM)
    m = th[th.find('\\label{appth:integer-table}'):]
    P['k'] = {int(n): {1: int(a), -1: int(b), 0: int(c)} for n, a, b, c in re.findall(r'^\s*(\d)&(\d+)&(\d+)&(\d+)', m, re.M)}
    m = re.search(r'\\text\{center of \}I\(n\)\s*((?:&\.\d+)+)', th)
    P['centers'] = dict(zip(range(2, 7), [F(x.strip('&')) for x in re.findall(r'&\.\d+', m.group(1))])) if m else None
    tr = src.text(TRIALS)
    rows = re.findall(r'^\s*(\d)&(\d)&\$?(-?\d+)\$?&(-?\d+|\$-?\d+\$)&(\d+)\s*(?:\\\\)?\s*$', tr, re.M)
    P['endpoint'] = {int(i): {'ell': int(l), 'D': int(d), 'beta': int(b.strip('$')), 'kappa': int(k)} for i, l, d, b, k in rows}
    sec = tr[tr.find('\\label{apptr:endpoint-table}'):tr.find('\\label{apptr:coupling-table}')]
    P['pairs'] = {(int(a), int(b)): int(v) for a, b, v in re.findall(r'\$\((\d),(\d)\)\$&\$?(-?\d+)\$?', sec)}
    P['cert'] = {int(m_): (int(p), int(q), int(k)) for m_, p, q, k in re.findall(r'^\s*(\d+)&(\d+)&(\d+)&(\d+)&\$\[', tr, re.M)}
    ini = src.text(INIT)
    tab = ini[ini.find('\\label{in:table}'):]
    P['table'] = {int(j): (F(E), F(e)) for j, E, e in re.findall(r'^\s*(\d)&(\.\d+)&(\.\d+)&', tab, re.M)}
    return P


# ----------------------------------------------------------------------------------------------- (A) thermal
K_POIS, Q_TH, SLOT = 192, 2 ** 50, 128
B80 = 80 * 2 ** 53                       # bias, divisible by 80, exceeding every |lane| of D X (checked)
NBITS = 61                               # 0 <= y + B80 < 2^61
KSH = NBITS + 7                          # magic shift: 2^NBITS * 80 <= 2^KSH
MAGIC = -((-(1 << KSH)) // 80)           # ceil(2^KSH / 80)


def C10(n):
    """10 C_n with C_n = 3 floor((n-1)/2) + 2((n-1) mod 2) + 6/5"""
    return 30 * ((n - 1) // 2) + 20 * ((n - 1) % 2) + 12


def thermal_matrix(n, g):
    words = list(itertools.product((-1, 0, 1), repeat=n))
    idx = {w: i for i, w in enumerate(words)}
    eta, hops, ends, endc, par = [], [], [], [], []
    for w in words:
        p = sum(w) % 2
        par.append(p)
        eta.append(80 - C10(n) - 10 * sum(w[j] * w[j + 1] for j in range(n - 1)) + 6 * w[0] - 6 * g * w[n - 1])
        hp = []
        for j in range(n - 1):
            for s in (1, -1):
                a, b = w[j] + s, w[j + 1] - s
                if -1 <= a <= 1 and -1 <= b <= 1:
                    y = list(w)
                    y[j], y[j + 1] = a, b
                    hp.append(idx[tuple(y)])
        hops.append(tuple(hp))
        en = []
        if g == 0:
            for s in (1, -1):
                a = w[n - 1] + s
                if -1 <= a <= 1:
                    y = list(w)
                    y[n - 1] = a
                    en.append(idx[tuple(y)])
        ends.append(tuple(en))
        endc.append(3 * (1 + p))
    return words, idx, eta, hops, ends, endc, par


def poisson_t():
    fK = math.factorial(K_POIS)
    s = [49 ** i * (fK // math.factorial(i)) for i in range(K_POIS + 1)]
    S = sum(s)
    return [Q_TH * si // S for si in s], s, S


def thermal_k(n, g):
    """run the printed recurrence exactly on all 3^n columns; return k_{n,g}, max |x|, max row sum of |D|"""
    words, idx, eta, hops, ends, endc, par = thermal_matrix(n, g)
    d = len(words)
    rowsum = max(abs(eta[w]) + 10 * len(hops[w]) + endc[w] * len(ends[w]) for w in range(d))
    ONES = sum(1 << (SLOT * t) for t in range(d))
    BIAS = B80 * ONES
    MASK = ((1 << (SLOT - KSH)) - 1) * ONES
    OFF = (B80 // 80) * ONES
    E = [1 << (SLOT * w) for w in range(d)]             # lane r = column r; t_i I adds at (w, w)
    WIN = (1 << 51) * ONES                              # every lane of every stage is checked to lie in [-2^51, 2^51)
    HIGHM = ((1 << SLOT) - (1 << 52)) * ONES
    bad = 0
    t, _, _ = poisson_t()
    X = [0] * d
    for i in range(K_POIS, -1, -1):
        if not any(X) and t[i] == 0:
            continue
        g_ = X.__getitem__
        Y = [0] * d
        for w in range(d):
            y = eta[w] * X[w] - 10 * sum(map(g_, hops[w]))
            if ends[w]:
                y -= endc[w] * sum(map(g_, ends[w]))
            v = ((((y + BIAS) * MAGIC) >> KSH) & MASK) - OFF
            if t[i]:
                v += t[i] * E[w]
            u_ = v + WIN
            if u_ < 0 or u_ & HIGHM:
                bad += 1
            Y[w] = v
        X = Y
    half = 1 << (SLOT - 1)
    num, xmax = 0, 0
    for w in range(d):
        u = X[w] + half * ONES
        b = u.to_bytes(SLOT // 8 * d, 'little')
        vals = [int.from_bytes(b[k:k + SLOT // 8], 'little') - half for k in range(0, len(b), SLOT // 8)]
        wt = 2 - par[w]
        for r, x in enumerate(vals):
            num += x * x * wt * (1 + par[r])
            if abs(x) > xmax:
                xmax = abs(x)
    k = (10 ** 16 * num) // (2 * Q_TH ** 2)
    return k, xmax, rowsum, num, bad


def thermal_checks(checks, src, P, value, override_k=None):
    th = src.text(THERM)
    t, s, S = poisson_t()
    # magic division and lane bounds, as exact integer facts
    e = MAGIC * 80 - (1 << KSH)
    check(checks, 'exact floor by 80 in 128-bit lanes: MAGIC = ceil(2^68/80) with 0 <= 80 MAGIC - 2^68 < 80 and 2^61 * 80 <= 2^68 (so floor(y M / 2^68) = '
          'floor(y/80) for 0 <= y < 2^61), (2^61) MAGIC < 2^128, quotient < 2^60, bias 80 * 2^53 > 256 * 2^51',
          0 <= e < 80 and (1 << NBITS) * 80 <= (1 << KSH) and (1 << NBITS) * MAGIC < (1 << SLOT) and ((1 << NBITS) * MAGIC >> KSH) < (1 << (SLOT - KSH))
          and B80 > 256 * 2 ** 51 and B80 + 256 * 2 ** 51 < (1 << NBITS))
    ks, xmaxes, rowsums, bads = {}, {}, {}, {}
    t0 = time.time()
    for n in range(2, 7):
        ks[n] = {}
        for g in (1, -1, 0):
            key = ('f540-thermal', n, g)
            if key not in P9._CACHE:
                P9._CACHE[key] = thermal_k(n, g)
            k, xm, rs, num, bad = P9._CACHE[key]
            ks[n][g], xmaxes[(n, g)], rowsums[(n, g)] = k, xm, rs
            bads[(n, g)] = bad
    value['thermal_seconds'] = round(time.time() - t0, 1)
    printed_k = override_k or P['k']
    check(checks, 'the packed floors are exact: every |D| row sum <= 256 and EVERY lane of EVERY stage lies in [-2^51, 2^51) (checked at run time), '
          'so |D x| < 256 * 2^51 < 80 * 2^53 = bias at the next stage', max(rowsums.values()) <= 256 and not any(bads.values()) and max(xmaxes.values()) < 2 ** 51,
          'max row sum %d, final max |x| %d, out-of-window rows %d' % (max(rowsums.values()), max(xmaxes.values()), sum(bads.values())))
    diff = [(n, g) for n in range(2, 7) for g in (1, -1, 0) if ks[n][g] != printed_k.get(n, {}).get(g)]
    check(checks, 'appth:integer-table: all fifteen k_{n,g} recomputed by the integer recurrence equal the printed integers (thermal.tex:199-206)',
          not diff and len(printed_k) == 5, 'differ: %s' % diff if diff else 'all fifteen equal')
    cert = json.loads(src.text(TCERT))
    cm = {(c['n'], c['g']): c for c in cert['cases']}
    check(checks, 'thermal_certificate_results.json: its fifteen quotients equal the recomputed ones, its 193 coefficients equal t_i, and its recorded '
          'max |x| (over all stages) is below 2^51 and at least our final-stage max',
          all(cm[(n, g)]['quotient'] == ks[n][g] and xmaxes[(n, g)] <= cm[(n, g)]['max_abs_x'] < 2 ** 51 for n in range(2, 7) for g in (1, -1, 0))
          and cert['parameters']['coefficients'] == t)
    # Lemma appth:matrix-error constants
    R = F(49 ** 193, math.factorial(193)) / (1 - F(49, 194))
    tot = 193 * (F(27) + F(3, 2) * 729)
    ok = R < F(3152, 10 ** 36) and tot / 2 ** 50 == F(432513, 2 ** 51) and 54 * R + F(432513, 2 ** 51) < F(2, 10 ** 10)
    ok = ok and all((2 * 3 ** n) <= 54 * 54 for n in range(2, 7)) and 3 ** 6 == 729
    check(checks, 'appth:tail and appth:frobenius-error: R = 49^193/193!/(1-49/194) < 3.152e-33, 193(27 + (3/2)729)/2^50 = 432513/2^51, '
          '54R + 432513/2^51 < 2e-10 (sqrt(3^n) <= 27, sqrt2 < 3/2)', ok and lit(th, 'R=\\frac{49^{193}}{193!}\\frac1{1-49/194}<3.152\\cdot10^{-33}.'),
          '54R + ... = %s' % dec(54 * R + F(432513, 2 ** 51), 15))
    # operator bounds behind -I <= A <= I
    check(checks, 'C_n and the printed upper bounds n - 1 + 6/5 + C_n = 5.4, 7.4, 10.4, 12.4, 15.4 (all <= 16)',
          [F(10 * (n - 1) + 12 + C10(n), 10) for n in range(2, 7)] == [F('5.4'), F('7.4'), F('10.4'), F('12.4'), F('15.4')]
          and lit(th, '$5.4,7.4,10.4,12.4,15.4$'))
    # intervals
    Z = {}
    okL, det = True, []
    expo = {}
    for n in range(2, 7):
        y = B0 * (F(C10(n), 10) - A_SHIFT * n)
        expo[n] = y
        elo, ehi = exp_bounds(y, 80) if y >= 0 else exp_bounds(y, 80)
        for g in (1, -1, 0):
            k = printed_k[n][g]
            L, U = F(k, 10 ** 16), F(k + 1, 10 ** 16)
            r = F(math.isqrt(k + 1) + 1, 10 ** 8)
            eps = F(4, 10 ** 10) * r + F(4, 10 ** 20)
            if not L - eps > 0:
                okL = False
                det.append('n=%d g=%d L - eps <= 0' % (n, g))
            Z[(n, g)] = (elo * (L - eps), ehi * (U + eps))
    check(checks, 'appth:interval-data: L - eps > 0 in every entry; the exponents b_0(C_n - a n) lie in [-.0544635, 9.691073] (exp enclosed by T_80 + 2y^81/81!)',
          okL and min(expo.values()) >= F('-.0544635') and max(expo.values()) <= F('9.691073') and lit(th, 'between $-.0544635$ and $9.691073$'),
          'exponents %s' % ', '.join(dec(v, 7) for v in expo.values()))
    z61 = Z[(6, 1)]
    check(checks, 'appth:Y6-interval: .0266319440 < Z_{6,1} < .0266319607 < .027', z61[0] > F('.0266319440') and z61[1] < F('.0266319607') < F('.027'),
          'Z_{6,1} in [%s, %s]' % (dec(z61[0], 12), dec(z61[1], 12)))
    I = {n: ((Z[(n, 1)][0] + Z[(n, -1)][0] + 4 * Z[(n, 0)][0]) / 6, (Z[(n, 1)][1] + Z[(n, -1)][1] + 4 * Z[(n, 0)][1]) / 6) for n in range(2, 7)}
    cen = P['centers']
    check(checks, 'appth:moment-centers: each I(n) = (Z_{n,1} + Z_{n,-1} + 4 Z_{n,0})/6 lies within 1e-7 of its printed centre (n = 2..6)',
          cen is not None and all(cen[n] - F(1, 10 ** 7) < I[n][0] and I[n][1] < cen[n] + F(1, 10 ** 7) for n in range(2, 7)),
          '; '.join('I(%d) in [%s, %s]' % (n, dec(I[n][0], 10), dec(I[n][1], 10)) for n in range(2, 7)))
    coef = {6: F(1), 5: F('-.28'), 4: F('-.3404'), 3: F('.0504'), 2: F('.0324')}
    # P_*(x)^2 = x^6 - .28x^5 - .3404x^4 + .0504x^3 + .0324x^2
    pst = [F(0), F('-.18'), F('-.14'), F(1)]
    sq = [sum(pst[i] * pst[j - i] for i in range(len(pst)) if 0 <= j - i < len(pst)) for j in range(7)]
    at_centers = sum(c * cen[n] for n, c in coef.items())
    upper_direct = sum(c * (I[n][1] if c > 0 else I[n][0]) for n, c in coef.items())
    check(checks, 'appth:polynomial: P_*(x)^2 has coefficients 1, -.28, -.3404, .0504, .0324 (sum of absolute values 1.7032); at the centres it equals '
          '.003744031780; .003744031780 + .00000017032 = .0037442021 < .003745',
          sq == [0, 0, coef[2], coef[3], coef[4], coef[5], coef[6]] and sum(abs(c) for c in coef.values()) == F('1.7032')
          and at_centers == F('.003744031780') and F('.003744031780') + F('.00000017032') == F('.0037442021') < F('.003745'))
    check(checks, 'appth:bounds (second claim) re-derived from the rational enclosures directly: I(6) - .28I(5) - .3404I(4) + .0504I(3) + .0324I(2) < .003745',
          upper_direct < F('.003745'), 'upper bound %s' % dec(upper_direct, 12))
    value['Y6_interval'] = (dec(z61[0], 12), dec(z61[1], 12))
    value['polynomial_upper'] = dec(upper_direct, 12)
    return Z, I


# ----------------------------------------------------------------------------------------------- (B) trials
def trial_data(P):
    ell = [P['endpoint'][i]['ell'] for i in range(1, 9)]
    diag = [P['endpoint'][i]['D'] for i in range(1, 9)]
    labels, A = P9.trial_matrices(ell, diag, P['pairs'])
    bvec = [P['endpoint'][a]['beta'] if d == -1 else 0 for a, d in labels]
    cvec = [P['endpoint'][a]['kappa'] * P['endpoint'][a]['beta'] if d == -1 else 0 for a, d in labels]
    return labels, A, bvec, cvec


def restricted(labels, A):
    """T_*, G_*, O_* on the 162 paired labels ((i,d),(j,d)), lexicographic in the inherited order"""
    D = len(labels)
    pairs = [(i, j) for i in range(D) for j in range(D) if labels[i][1] == labels[j][1]]
    Tt, Ot = P9.transfer_terms(A)
    Gt = [(s, A[s], A[s]) for s in (-1, 1)]
    return pairs, P9.kron_block(pairs, Tt), P9.kron_block(pairs, Gt), P9.kron_block(pairs, Ot)


def vecmat(v, M):
    cols = list(zip(*M))
    return [sum(map(lambda a, b: a * b, v, c)) for c in cols]


def trial_recurrence(labels, A, bvec, cvec, lengths=(34, 78, 142, 240)):
    pairs, T, G, O = restricted(labels, A)
    L0 = [bvec[i] * bvec[j] for i, j in pairs]
    u = [cvec[i] * cvec[j] for i, j in pairs]
    Gu = [sum(G[r][c] * u[c] for c in range(len(u))) for r in range(len(u))]
    x, y = L0, vecmat(L0, T)
    w = [-300000 * v for v in vecmat(L0, G)]
    out = {}
    mx = max(lengths)
    for m in range(2, mx + 1):
        xO = vecmat(x, O)
        wT = vecmat(w, T)
        yT = vecmat(y, T)
        w = [a + 500000 * b + 700741 * c for a, b, c in zip(wT, xO, yT)]      # (x T) T = y T
        x, y = y, yT
        if m in lengths or m <= 7:
            V = sum(a * b for a, b in zip(y, u))
            H = sum(a * b for a, b in zip(w, u)) + 300000 * sum(a * b for a, b in zip(x, Gu)) + 700741 * V
            out[m] = (V, H)
    return out, (pairs, T, G, O)


def trial_direct(A, bvec, cvec, m):
    """second derivation: amplitudes b^T A_{s1}..A_{sm} c and 500000 <psi, (H_opp + a m) psi> by explicit action"""
    D = len(bvec)
    amp = {}
    rows = {(): bvec}
    for _ in range(m):
        nxt = {}
        for wd, r in rows.items():
            for s in (-1, 0, 1):
                nxt[wd + (s,)] = [sum(r[i] * A[s][i][j] for i in range(D) if r[i]) for j in range(D)]
        rows = nxt
    for wd, r in rows.items():
        amp[wd] = sum(a * b for a, b in zip(r, cvec))
    V = sum(v * v for v in amp.values())
    Hs = 0
    for wd, v in amp.items():
        if not v:
            continue
        hv = 0
        for i in range(m - 1):
            a, b = wd[i], wd[i + 1]
            hv += a * b * v
            for d in (1, -1):
                if -1 <= a + d <= 1 and -1 <= b - d <= 1:
                    w2 = list(wd)
                    w2[i], w2[i + 1] = a + d, b - d
                    hv += amp[tuple(w2)]
        # 500000 (H + a m): fields -3/5 S^z_1 + 3/5 S^z_m and shift
        Hs += 500000 * v * hv + v * v * (-300000 * wd[0] + 300000 * wd[-1] + 700741 * m)
    return V, Hs


def trial_checks(checks, src, P, value):
    t0 = time.time()
    labels, A, bvec, cvec = trial_data(P)
    tm = json.loads(src.text(TMAT))
    key = ('f540-trial', json.dumps(sorted(P['endpoint'].items())), json.dumps(sorted(P['pairs'].items())))
    if key not in P9._CACHE:
        P9._CACHE[key] = trial_recurrence(labels, A, bvec, cvec)
    res, (pairs, T, G, O) = P9._CACHE[key]
    L0 = [bvec[i] * bvec[j] for i, j in pairs]
    uu = [cvec[i] * cvec[j] for i, j in pairs]
    mats_ok = _matrices_equal(tm, A, bvec, cvec, pairs, T, G, O, labels, L0, uu)
    p9 = P9.printed(src)
    same = (P9.trial_matrices(p9['ell'], p9['diag'], p9['pairs'])[1] == A)
    check(checks, 'the tables (apptr:entry-table, apptr:endpoint-table, apptr:coupling-table) give A_s, b, c and the restricted T_*, G_*, O_* equal to '
          'trial-exact-matrices.json; the bulk triple equals the periodic paper\'s (F-539 tables)', mats_ok[0] and same, mats_ok[1] + '; equals F-539 triple: %s' % same)
    check(checks, 'apptr:restricted-dimension: the paired labels ((i,d),(j,d)) number 1+16+64+64+16+1 = 162', len(pairs) == 162)
    tr = json.loads(src.text(TRES))
    okc, det = True, []
    for m in (34, 78, 142, 240):
        V, H = res[m]
        p, q, k = P['cert'][m]
        pm = len(str(V))
        qm = V // 10 ** (pm - 6)
        km = (20 * H) // V
        ok = V > 0 and 10 ** (p - 1) <= V < 10 ** p and q * 10 ** (p - 6) <= V < (q + 1) * 10 ** (p - 6) and k * V <= 20 * H < (k + 1) * V
        ok = ok and 202100 * V - H > 0 and k + 1 < 4042000
        ok = ok and int(tr[str(m)]['V_m']) == V and int(tr[str(m)]['H_m_star']) == H and int(tr[str(m)]['strict_margin_202100V_minus_H']) == 202100 * V - H
        okc = okc and ok
        det.append('m=%d: p=%d q=%d k=%d %s' % (m, pm, qm, km, 'ok' if ok else 'FAIL'))
        value['H/(500000V) m=%d' % m] = dec(F(H, 500000 * V), 10)
    check(checks, 'apptr:certificate-table: V_m, H_m^* recomputed by the row recurrence satisfy every printed p_m, q_m, k_m window, 202100 V_m - H_m^* > 0, '
          'and equal trial-exact-results.json in full (m = 34, 78, 142, 240)', okc, '; '.join(det))
    check(checks, 'apptr:bound: H_m^*/(500000 V_m) < 202100/500000 = alpha = 2021/5000 for all four lengths', okc and F(202100, 500000) == ALPHA)
    cross = json.loads(src.text(TCROSS))
    okd, det = True, []
    for m in range(2, 8):
        Vd, Hd = trial_direct(A, bvec, cvec, m)
        ok = (Vd, Hd) == res[m]
        if str(m) in cross:
            ok = ok and int(cross[str(m)]['V']) == Vd and int(cross[str(m)]['H_star']) == Hd
        okd = okd and ok
        det.append('m=%d %s' % (m, 'ok' if ok else 'DIFF'))
    check(checks, 'Lemma apptr:contractions and the recurrence re-derived for m = 2..7 by explicit amplitudes and the explicit opposite-field Hamiltonian '
          '(m = 2..6 also equal trial-direct-physical-crosscheck.json)', okd, ' '.join(det))
    value['trial_seconds'] = round(time.time() - t0, 1)


def _matrices_equal(tm, A, bvec, cvec, pairs, T, G, O, labels, L0, u):
    parts = {'A_s': all(tm['A'][str(s)] == A[s] for s in (-1, 0, 1)), 'b': tm['b'] == bvec, 'c': tm['c'] == cvec,
             'labels': [tuple(x) for x in tm['virtual_labels']] == list(labels),
             'pairs': [tuple(x) for x in tm['restricted_pair_indices_zero_based']] == pairs,
             'T_*': tm['T_star'] == T, 'G_*': tm['G_star'] == G, 'O_*': tm['O_star'] == O, 'L_0': tm['L_0'] == L0, 'u': tm['u'] == u}
    return all(parts.values()), ', '.join('%s %s' % (k, 'ok' if v else 'DIFF') for k, v in parts.items())


# ----------------------------------------------------------------------------------------------- (C) scalars
def scalar_checks(checks, src, P, value, Z):
    ini, per, conc = src.text(INIT), src.text(PER), src.text(CONC)
    ell, U, V = F('.999'), F('1.00139'), F('.872')
    # the periodic constants, re-derived from the companion's printed table by F-539's code
    sub = []
    comp = P9.decide(src=src, parts=('scalars',), measure=False)
    s2304_ok = all(c['pass'] for c in comp['checks'] if c['check'].startswith(('seed2304', 'cor:boundary')))
    mJ, mN = F('1.0657205'), F('.2783155')
    check(checks, 'per:native (cited): l = .999, U = 1.00139, V = .872, m_J = 1.0657205, m_N = .2783155 and 1 - S(72,b_1) <= 151249/2500000 = .0604996 '
          'are the companion\'s seed2304 values (re-derived by F-539\'s scalar code from its printed b = 49/4 table)',
          s2304_ok and F(151249, 2500000) == F('.0604996') and lit(per, 'm_J=1.0657205,\\quad m_N=.2783155.') and lit(per, '\\ell=.999,\\quad U=1.00139,\\quad V=.872,'))
    # per:initial-ratios
    check(checks, 'per:initial-ratios: m_J - l^12 < l^12, V < l, m_J - l^12 < (.874 l)^12, V < .874 l (so rho_0 < .874)',
          mJ - ell ** 12 < ell ** 12 and V < ell and mJ - ell ** 12 < (F('.874') * ell) ** 12 and V < F('.874') * ell)
    a3, b3 = F('.426635'), F('.439736')
    check(checks, 'cube roots: (m_J - l^12)^(1/3) < .426635 and (m_N - V^12)^(1/3) < .439736 (by cubing); V^12 < m_N < 2V^12',
          mJ - ell ** 12 < a3 ** 3 and mN - V ** 12 < b3 ** 3 and V ** 12 < mN < 2 * V ** 12)
    D32 = (a3 ** 8 + 3 * (V ** 32 + b3 ** 8)) / ell ** 32
    D120 = ((mJ - ell ** 12) ** 10 + 3 * (V ** 120 + (mN - V ** 12) ** 10)) / ell ** 120
    t32 = U ** 64 * (1 + F('.0442')) ** 2 / F('.9856') - 1
    s_ = (1 + F('.9525') ** 60) ** -2
    R = U ** 120 * (1 + F('.00000025')) - 1
    t_ = (1 + R * R) ** -2
    c1 = f_sq(1 - F('.9002') ** 2 * F('.9372'))
    c2 = f_sq(1 - F('.9372') ** 2 * (1 - F('.0502')))
    ok = D32 < F('.0442') and D120 < F('.00000025') and F('.9856') ** 9 < F('.968') ** 4 and t32 < F('.2092') < F('.9525') ** 32
    ok = ok and s_ > F('.9002') and t_ > F('.9372') and c1 < F('.0502') and c2 < F('.0198') and F('.0604996') < 2 * F('.032') * F('.968')
    ok = ok and max(c1, c2) < F('.052')
    check(checks, 'per:scalar-checks: D(32) < .0442, D(120) < 2.5e-7, .9856^9 < .968^4, U^64(1.0442)^2/.9856 - 1 < .2092 < .9525^32, s > .9002, t > .9372, '
          'f(1-.9002^2 .9372) < .0502, f(1-.9372^2(1-.0502)) < .0198 (< .052), .0604996 < 2(.032)(.968)', ok,
          'D32 < %s, D120 < %s, tail32 %s, s %s, t %s, outputs %s, %s' % (dec(D32, 6), dec(D120, 10), dec(t32, 6), dec(s_, 6), dec(t_, 6), dec(c1, 6), dec(c2, 6)))

    def G(u):
        q = 1 - u
        return (1 / q + 1 / q ** 2 + 1 / q ** 3) ** 2 / 2

    def d(u):
        return u / (2 - 3 * u)
    check(checks, 'periodic induction: G(.052) < 5.583 < 6, 6(.052)^2 <= .052, d(.052) < .971^120 (rho_2 < .971)',
          G(F('.052')) < F('5.583') < 6 and 6 * F('.052') ** 2 <= F('.052') and d(F('.052')) < F('.971') ** 120, 'G(.052) = %s' % dec(G(F('.052')), 6))
    # Lemma in:seedbounds and its scalars
    b0a = B0 * ALPHA
    ea = exp_bounds(b0a, 80)
    e132 = exp_bounds(F('.132'), 80)

    def eps(m):
        return F('.027') * ea[1] * U ** m * F('.874') ** (m - 6) / ell ** 6

    def Rm(m):
        return e132[1] * U ** m + eps(m) - 1                       # an upper bound for R(m)

    def Rm_lo(m):
        return e132[0] * U ** m + F('.027') * ea[0] * U ** m * F('.874') ** (m - 6) / ell ** 6 - 1

    def Pst(x):
        return x ** 3 - F('.14') * x ** 2 - F('.18') * x
    pts = [F(k, 7) for k in range(1, 6)]
    fact = all(Pst(x) == x * (x - F(1, 2)) * (x + F(9, 25)) for x in pts)
    # 4P - xP' = x(x^2 - .28x - .54): its quadratic factor is positive at l and increasing beyond .14
    quad_ok = ell ** 2 - F('.28') * ell - F('.54') > 0 and ell > F('.14') and all(4 * Pst(x) - x * (3 * x * x - F('.28') * x - F('.18')) == x * (x * x - F('.28') * x - F('.54')) for x in pts)
    lead = F('.003745') * ea[1] / Pst(U) ** 2
    check(checks, 'in:seedbounds: P_* = x(x-1/2)(x+9/25) > 0 on [l, U], 4P_* - xP_*\' = x(x^2-.28x-.54) > 0 there; .003745 e^{b_0 alpha}/P_*(U)^2 < 1.133226 '
          'and e^{.132} > 1.141108 (b_0 alpha = 4.95145; exp enclosed rigorously)',
          fact and quad_ok and Pst(ell) > 0 and lead < F('1.133226') and e132[0] > F('1.141108') and b0a == F('4.95145'),
          'left coefficient %s, e^.132 >= %s' % (dec(lead, 7), dec(e132[0], 7)))
    check(checks, 'Y_6(b_0) < .027 is the thermal interval above, and eps(34) < .0928 < 1 (c_0 > 0)', Z[(6, 1)][1] < F('.027') and eps(34) < F('.0928'),
          'eps(34) < %s' % dec(eps(34), 6))

    def Fb(q, e, t):
        return q / (1 - q) * (1 / ((1 - e) ** 2 * t) - 1)
    a78 = (1 + Rm(78)) ** -2
    a142 = (1 + Rm(142) ** 2) ** -2
    a240 = (1 + Rm(240) ** 4) ** -2
    o78 = Fb(F('.953') ** 44, F('.093'), a78)
    o142 = Fb(F('.971') ** 64, F('.133'), a142)
    check(checks, 'in:puritynumbers: (1+R(78))^-2 > .6180, (1+R(142)^2)^-2 > .7533, (1+R(240)^4)^-2 > .7923 (and R(m) > 0 from its lower enclosure, so t = (1+R)^-2 is in (0,1])',
          a78 > F('.6180') and a142 > F('.7533') and a240 > F('.7923') and min(Rm_lo(78), Rm_lo(142), Rm_lo(240)) > 0,
          '%s, %s, %s' % (dec(a78, 6), dec(a142, 6), dec(a240, 6)))
    check(checks, 'in:78 / in:142: F(.953^44, .093, (1+R(78))^-2) < .132129 < .133 and F(.971^64, .133, (1+R(142)^2)^-2) < .137301 < .14; 1 - A(240,2) bound '
          '< .207518 < .21; rho_1 < .9525 <= .953, .0928 <= .093',
          o78 < F('.132129') < F('.133') and o142 < F('.137301') < F('.14') and 1 - a240 < F('.207518') < F('.21') and F('.9525') <= F('.953'),
          'outputs %s, %s, %s' % (dec(o78, 7), dec(o142, 7), dec(1 - a240, 7)))
    # the table in:table (Proposition be:coupled), j = 2..5
    u = {2: F('.052')}
    for j in range(2, 6):
        u[j + 1] = 6 * u[j] ** 2
    M = {j: 240 * 2 ** (j - 2) for j in range(2, 7)}
    kk = {2: 142}
    for j in range(2, 6):
        kk[j + 1] = M[j]
    qb = {2: F('.142'), 3: F('.0282'), 4: F('.0028')}
    tab = P['table']
    okq = d(u[3]) ** 49 < F('.142') ** 120 and d(u[4]) < F('.0282') ** 2 and d(u[5]) < F('.0028') ** 2
    okq = okq and [F(M[j] - kk[j], M[j]) for j in (2, 3, 4)] == [F(98, 240), F(1, 2), F(1, 2)]
    Eout = {j: Fb(qb[j], tab[j][0], 1 - tab[j][1]) for j in (2, 3, 4)}
    hout = {j: f_sq(1 - (1 - tab[j][1]) * (1 - u[j]) * (1 - u[j + 1]) * (1 - tab[j + 1][0])) for j in (2, 3, 4)}
    pE = {2: F('.117754'), 3: F('.015328'), 4: F('.000170')}
    ph = {2: F('.147078'), 3: F('.025188'), 4: F('.000432')}
    okt = all(Eout[j] < pE[j] <= tab[j + 1][0] and hout[j] < ph[j] <= tab[j + 1][1] for j in (2, 3, 4))
    okt = okt and tab.get(2) == (F('.14'), F('.21')) and len(tab) == 4
    check(checks, 'in:table: q bounds d(u_3)^(49/120) < .142, d(u_4)^(1/2) < .0282, d(u_5)^(1/2) < .0028 (exponents 98/240, 1/2, 1/2); E-outputs < .117754, '
          '.015328, .000170 and eta-outputs < .147078, .025188, .000432, each below the next printed row', okq and okt,
          'E: %s; eta: %s' % (', '.join(dec(Eout[j], 7) for j in (2, 3, 4)), ', '.join(dec(hout[j], 7) for j in (2, 3, 4))))
    # Proposition in:quadratic
    x = F(1, 100)
    pts = [F(k, 1000) for k in range(1, 9)]
    id1 = all(Fb(2 * y, y, 1 - y) / y ** 2 == 2 / (1 - 2 * y) * (1 / (1 - y) + 1 / (1 - y) ** 2 + 1 / (1 - y) ** 3) for y in pts)
    id2 = all(f_sq(2 * y + 16 * y * y) / y ** 2 == (2 + 16 * y) ** 2 / (2 * (1 - 2 * y - 16 * y * y) ** 2) for y in pts)
    v1 = 2 / (1 - 2 * x) * (1 / (1 - x) + 1 / (1 - x) ** 2 + 1 / (1 - x) ** 3)
    v2 = (2 + 16 * x) ** 2 / (2 * (1 - 2 * x - 16 * x * x) ** 2)
    okx = u[5] < F('.000015') < x and tab[5][0] <= x and tab[5][1] <= x and 6 * x * x / (2 - 18 * x * x) <= (2 * x) ** 2
    okx = okx and all(10 * F(1, 10 ** (1 + 2 ** (j - 5))) ** 2 == F(1, 10 ** (1 + 2 ** (j - 4))) for j in range(5, 12))
    check(checks, 'in:quadratic: u_5 < .000015 < .01, E_5, eta_5 <= .01, sqrt(6x^2/(2-18x^2)) <= 2x, F(2x,x,1-x)/x^2 and f(2x+16x^2)/x^2 identities (at 8 points) '
          'with endpoint values 42430000/6792093 < 10 and 3645000/1495729 < 10, x_j = 10^(-1-2^(j-5))',
          okx and id1 and id2 and v1 == F(42430000, 6792093) < 10 and v2 == F(3645000, 1495729) < 10, 'u_5 = %s' % dec(u[5], 12))
    # conclusion
    okc = 2 * x + 26 * x * x <= 4 * x and F(4) / (10 * (1 - F('.04'))) < 1 and B0 * 2 ** 5 == 392 and M[5] == 1920 and 2 * 960 + 1 >= M[5]
    okc = okc and all(B0 * 2 ** j == 392 * F(2) ** (j - 5) for j in range(5, 10)) and 1 - 4 * x > F(1, 2)
    l10 = log_bounds(10)
    gap = (l10[0] / 392, l10[1] / 392)
    check(checks, 'conclusion: 2x + 26x^2 <= 4x, 4/[10(1-.04)] < 1, b_5 = 392, M_5 = 1920 <= 2L+1 for L >= 960; log(10)/392 enclosed (atanh series)',
          okc and gap[0] > 0, 'log(10)/392 in [%s, %s]' % (dec(gap[0], 15), dec(gap[1], 15)))
    value['gap_L>=960'] = dec(gap[0], 15)


# ----------------------------------------------------------------------------------------------- decide
def decide(src=None, override=None, parts=('thermal', 'trial', 'scalars')):
    t_start = time.time()
    src = src or Sources()
    checks, value = [], {}
    P = printed(src)
    for k, v in (override or {}).items():
        P[k] = v
    main = src.text(MAIN)
    check(checks, 'the theorem as stated: E_1(L,3/5) - E_0(L,3/5) > log(10)/392 for every integer L >= 960 (main.tex:77-83)',
          lit(main, 'E_1(L,3/5)-E_0(L,3/5)>\\frac{\\log10}{392}') and lit(main, 'L\\ge960.'))
    check(checks, 'the printed tables were read: 15 k_{n,g}, 5 centres, 8 endpoint rows, 15 couplings, 4 certificate rows, 4 in:table rows',
          len(P['k']) == 5 and P['centers'] is not None and len(P['endpoint']) == 8 and len(P['pairs']) == 15 and len(P['cert']) == 4 and len(P['table']) == 4)
    two = _two_bond_checks(checks)
    Z = None
    if 'thermal' in parts:
        Z, I = thermal_checks(checks, src, P, value)
    if 'trial' in parts:
        trial_checks(checks, src, P, value)
    if 'scalars' in parts:
        if Z is None:
            Z, I = thermal_checks(checks, src, P, value)
        scalar_checks(checks, src, P, value, Z)
    ok = all(c['pass'] for c in checks) and two
    full = set(parts) >= {'thermal', 'trial', 'scalars'}
    verdict = 'REFUTED' if not ok else ('CERTIFIED' if full else 'REFUSED')
    value['runtime_s'] = round(time.time() - t_start, 1)
    decides = ('a finite component: the fifteen thermal integers k_{n,g} recomputed by the printed recurrence and every enclosure built on them '
               '(Y_6 < .027, c_0 P_*(lambda_0)^2 < .003745), the four trial-vector certificates (m = 34, 78, 142, 240) recomputed exactly, and every '
               'printed scalar comparison of the initialization, periodic extraction and conclusion. NOT the gap theorem: the boundary transfer '
               'identity, the averaging identity, the boundary recurrence lemmas, the purity lemma and the variational principle are analytic; the '
               'periodic inputs are the companion\'s (F-539), used here as printed')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'decides': decides, 'value': value}


def _two_bond_checks(checks):
    """bond eigenvalues -2,-1,1 and S_2.(S_1+S_3) eigenvalues in {-3,..,2}, by exact minimal polynomials (weight basis, integer entries)"""
    def bond(n, i, j):
        words = list(itertools.product((-1, 0, 1), repeat=n))
        idx = {w: k for k, w in enumerate(words)}
        M = [[0] * len(words) for _ in words]
        for w in words:
            r = idx[w]
            M[r][r] += w[i] * w[j]
            for d in (1, -1):
                a, b = w[i] + d, w[j] - d
                if -1 <= a <= 1 and -1 <= b <= 1:
                    y = list(w)
                    y[i], y[j] = a, b
                    M[r][idx[tuple(y)]] += 1
        return M

    def minpoly_zero(M, roots):
        n = len(M)
        acc = [[int(i == j) for j in range(n)] for i in range(n)]
        for lam in roots:
            acc = mm(acc, [[M[i][j] - (lam if i == j else 0) for j in range(n)] for i in range(n)])
        return all(v == 0 for r in acc for v in r)
    h = bond(2, 0, 1)
    two = [[a + b for a, b in zip(r1, r2)] for r1, r2 in zip(bond(3, 0, 1), bond(3, 1, 2))]
    ok = minpoly_zero(h, (-2, -1, 1)) and minpoly_zero(two, (-3, -2, -1, 0, 1, 2)) and not minpoly_zero(two, (-2, -1, 0, 1, 2))
    check(checks, 'A is a contraction (finite part): a bond has spectrum in {-2,-1,1}; S_1.S_2 + S_2.S_3 has spectrum in {-3,..,2} and attains -3', ok)
    return ok


def _failing(r):
    return '; '.join(c['check'][:90] for c in r['checks'] if not c['pass']) or 'nothing failed'


def forge():
    """each must NOT certify"""
    out = []
    P = printed(Sources())
    k = {n: dict(v) for n, v in P['k'].items()}
    k[6][1] += 1
    r = decide(override={'k': k}, parts=('thermal',))
    out.append(('printed k_{6,1} 16467340956 -> 16467340957 -> fails: ' + _failing(r), r['verdict']))
    ep = {i: dict(v) for i, v in P['endpoint'].items()}
    ep[7]['beta'] = 12476
    r = decide(override={'endpoint': ep}, parts=('trial',))
    out.append(('endpoint beta_7 12475 -> 12476 -> fails: ' + _failing(r), r['verdict']))
    cen = dict(P['centers'])
    cen[6] = cen[6] + F(2, 10 ** 7)
    r = decide(override={'centers': cen}, parts=('thermal',))
    out.append(('centre of I(6) .00893272 -> .00893292 -> fails: ' + _failing(r), r['verdict']))
    tab = dict(P['table'])
    tab[4] = (F('.015'), tab[4][1])
    r = decide(override={'table': tab}, parts=('scalars',))
    out.append(('in:table E_4 = .016 -> .015 -> fails: ' + _failing(r), r['verdict']))
    return out


if __name__ == '__main__':
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides')}, indent=1))
    print(json.dumps(res['value'], indent=1, default=str))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], '|', c['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('decide %.1fs' % (time.time() - t))
    t = time.time()
    for d, v in forge():
        print('FORGE', v, '-', d)
    print('forges %.1fs' % (time.time() - t))
