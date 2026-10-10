"""F-045 — "Squarefree values of quartics and power-free values of polynomials" (openai/math family 020).

THE CLAIM (build/sections/01-introduction.tex:20-29, Theorem thm:density): for f in Z[x] irreducible of degree d,
4 <= d <= 8, k = d - 2, with rho_f(p^k) < p^k for every prime p, S_{f,k}(X) = c_{f,k} X + o_f(X) with
c_{f,k} = prod_p (1 - rho_f(p^k)/p^k) > 0. For d = 4 this is the squarefree-value density of every admissible
irreducible quartic.

THE FINITE OBJECT (build/sections/10-parameters.tex). With K0 = 3000, G0 = 100000, tau = 1/50000 (l.15), for each
d in 4..8 and each integer z >= K0 the cell eta- = z/K0, eta+ = (z+1)/K0, b- = d - k eta+, b+ = d - k eta- (l.28-34),
used until the first z_d with eta-(1 - k eta-/d) < 2495/10000 (l.35-39); mode Q is d = 4, z < 4000 (l.40).
Proposition prop:parameter-certificate (l.67-105): z_d is as in Table tab:parameter-certificate (l.107-123), and for
every K0 <= z < z_d there are positive rationals t*, w with m = (d-1)w satisfying the cut inequalities
eq:parameter-cut-inequalities (l.74-83) and the saving conditions eq:parameter-saving (l.86-97), with the
thresholds delta_h, E_h of eq:parameter-thresholds (l.43-65). The prescription (l.147-162): t* = i/50, 1 <= i < 500,
minimising (eta+ + b+ t)^d / H(t), first on ties; w = up_{d-1}(X), X = ((d+1)(eta+ + b+ t*)/d^2)^d / H(t*),
up_e(x) the least r/G0 (r in 1..G0) with (r/G0)^e > x. The table's last column (l.110-121) is the minimum over the
cells of 1 - m - sum_h Ebar_h, each radical threshold rounded strictly upwards (l.168-180). The endpoint derivative
inequalities (l.231-238): N_{h,a,b}(t) >= 0 and N_{h,a,b}(t)^h < (k+t)^{h-1}(a+bt) at t in {3/20, 5}, 2 <= k <= 6,
2 <= h <= k+2, (a,b) in {(1,0),(0,1),(1,1)}. The margins eq:parameter-final-box-exponent (l.278-282),
eq:parameter-fiber-exponent (l.287-291), eq:parameter-large-eta-gap (l.297-315). And the enlarged first quartic
cell of Proposition prop:cyclotomic-central (build/sections/13-cyclotomic.tex:74-103), with its printed parameters,
threshold bounds and two printed gaps.

DECIDED HERE, exactly (int and Fraction; no float anywhere in a decision), written from the paper's prose only —
the paper's Python program (12-certificate.tex, verbatim blocks) was not read before this decider ran:
  0. H, H_a, H_b re-derived from R(A,B) of eq:hilbert-polynomial (05-determinant-cuts.tex:47-49) by exact
     differentiation, and R itself re-derived as the leading form (k d_A + d_B)^{d-2} A^{d-1}B^{d-1}/((d-1)!)^2 of
     the Hilbert function (05-determinant-cuts.tex:93-98); both compared with the closed form eq:parameter-polynomials.
  1. For each d: z_d is the first stopping index (every earlier z checked not to stop), the interval count, z_d/K0,
     each compared with the table.
  2. For every one of the 3,989 cells: t* by the prescription (integer comparison of N_i^d * H_j against
     N_j^d * H_i over the 499 grid points), X in [0,1), w = up_{d-1}(X) (r found by an integer e-th root and both
     defining inequalities r^e q > p G0^e >= (r-1)^e q re-checked), 0 < m < 1, min(eta-, b-) > m, BOTH cut
     inequalities checked directly (the first is not taken from the definition of up), 3/20 <= v/u <= 5, and
     m + sum_h E_h(u,v) < 999/1000 decided through rational upper bounds: each Psi_h = UV/((kU+V)^{h-1}D)^{1/h}
     is replaced by up_h(Psi_h^h) and U/sqrt3 by up_2(U^2/3) — a strict upper bound each, so the sum of the
     prefix maxima bounds sum E_h from above (a one-sided certificate, valid in the direction used). In mode Q,
     m + 2u < 999/1000 exactly.
  3. The table's certified gap: the minimum over each degree's cells of 1 - m - sum Ebar_h, compared exactly.
  4. The 150 endpoint derivative inequalities (25 pairs (k,h) x 3 pairs (a,b) x 2 endpoints): N >= 0 and
     N^h < (k+t)^{h-1}(a+bt) — this is D <= 1 at the two endpoints only; and the paper's closed form for
     D(t) = f(t) + (1-t) f'(t), f = F_{h,a,b}(1,.), checked as a rational identity: N = D / g with g =
     ((k+t)^{h-1}(a+bt))^{-1/h}, where D/g = 1 - (1-t)t(h-1)/(h(k+t)) - (1-t)tb/(h(a+bt)) follows from
     g'/g = -(h-1)/(h(k+t)) - b/(h(a+bt)); after clearing (k+t)(a+bt) both sides are polynomials of degree <= 3 in
     t, so agreement at 6 rational points proves the identity.
  5. The printed margins: 999/1000 + 8 tau = 24979/25000; 999/1000 + 2 tau = 3122/3125; (4999/10000)^2 - 2495/10000
     = 40001/100000000; 2495/10000 + (3e + e^2)/4 < (4999/10000)^2 with e = 1/10000; the extra pair
     (e, d/k + e) has e(d/k + e)/d < (4999/10000)^2 for every d; 4999/10000 + 1/2 = 9999/10000.
  6. The enlarged quartic cell (13-cyclotomic.tex:74-103): eta+, b-, b+ from eta- = 1 - 1e-6; (H, H_a, H_b)(1/2) =
     (10, 5, 10) (12-certificate.tex:99-100); both strict cut inequalities with the printed w; m, u, v equal to the
     printed values; m < min(eta-, b-); 3/20 <= v/u <= 5; each printed threshold bound is a strict upper bound for
     the true threshold AND equals up_h of it; 1 - m - sum Ebar_h - 4 tau = 1941/100000; 1 - m - 2u - 2 tau =
     15319/120000.

WHAT IS NOT DECIDED HERE: the theorem. This is a finite component: the parameter certificate the proof consumes. The
sieve reduction, the affine counting theorem, the arithmetic and lattice boxes, the determinant cuts (including
that eq:cut-conditions suffice), Lemma lem:bicone (primeness, the Hilbert series of the regular sequence), the
Hilbert-function bounds, the quartic surface geometry and the quintic discard, the curve estimates, the large-prime
tail argument, and the continuous parts of the shift estimate eq:parameter-shift — the concavity of q_{a,b} and
F_{h,a,b}, that the maximum of D on [3/20, 5] is at an endpoint, the path integration, and the c >= 1 and min/max
reductions — are proved in prose and taken as the paper's. Also not decided: the Lean challenge PowerFreeValues.

AFTER THE RUN (the authors' program, 12-certificate.tex:11-90 and 105-128, read only after this decider had run):
it implements the same prescription in Fraction arithmetic with a bisection for up_e and asserts the table's
(z_d, gap) pairs. It does not check the first cut inequality directly (it rests on the definition of up), does
not derive H, H_a, H_b from R(A,B) (it uses the binomial closed forms), does not check the identity behind N_{h,a,b}
(the 'direct differentiation'), does not check the Section 10 margins (24979/25000, 3122/3125, 40001/10^8, the
large-eta weights), and in the enlarged cell hard-codes (H, H_a, H_b)(1/2) = (10, 5, 10) and never compares m, u,
v with the values printed in 13-cyclotomic.tex:83-85. All of those are checked here; every number agreed.
"""
import os
import sys
import re
from fractions import Fraction
from math import comb, factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, diff, mul, pw, scale, var  # noqa: E402

DIR = 'preprints/Squarefree-values-of-quartics-and-power-free-values-of-polynomials-September-24-2026/build/sections/'
PARAMS = DIR + '10-parameters.tex'
CUTS = DIR + '05-determinant-cuts.tex'
CYCLO = DIR + '13-cyclotomic.tex'
APPX = DIR + '12-certificate.tex'

K0 = 3000
G0 = 100000
TAU = Fraction(1, 50000)
STOP = Fraction(2495, 10000)
SAVE = Fraction(999, 1000)
LO, HI = Fraction(3, 20), Fraction(5)


# ---------------------------------------------------------------- exact helpers

def iroot(n, e):
    """floor(n^(1/e)) for an integer n >= 0, by integer Newton iteration"""
    if n < 2:
        return n
    x = 1 << ((n.bit_length() + e - 1) // e)       # x >= the root
    while True:
        y = ((e - 1) * x + n // x ** (e - 1)) // e
        if y >= x:
            break
        x = y
    while x ** e > n:
        x -= 1
    while (x + 1) ** e <= n:
        x += 1
    return x


def up(x, e, bounded=True):
    """the least r/G0, r >= 1, with (r/G0)^e > x, for a rational x >= 0; both defining inequalities re-checked.
    bounded: the paper's up_e also requires r <= G0 (i.e. x < 1); returns None when that fails"""
    x = Fraction(x)
    p, q = x.numerator, x.denominator
    P = p * G0 ** e
    r = iroot(P // q, e) + 1                        # r^e > P/q  <=>  r^e > floor(P/q) for integer r^e
    assert r ** e * q > P and (r - 1 < 1 or (r - 1) ** e * q <= P)
    if bounded and r > G0:
        return None
    return Fraction(r, G0)


def coeffs(d):
    k = d - 2
    return {j: comb(d, j) * comb(d - 2, j - 1) * k ** (j - 1) for j in range(1, d)}


def R_poly(d):
    """R(A,B) = (1/d!) sum_j C(d,j) C(d-2,j-1) k^(j-1) A^(d-j) B^j, eq:hilbert-polynomial, as a 2-variable poly"""
    k = d - 2
    return {(d - j, j): Fraction(comb(d, j) * comb(d - 2, j - 1) * k ** (j - 1), factorial(d)) for j in range(1, d)}


def R_from_hilbert(d):
    """the leading form (k d_A + d_B)^(d-2) A^(d-1) B^(d-1) / ((d-1)!)^2, computed by repeated differentiation"""
    k = d - 2
    p = {(d - 1, d - 1): Fraction(1, factorial(d - 1) ** 2)}
    for _ in range(d - 2):
        p = add(scale(diff(p, 0), k), diff(p, 1))
    return p


def ev1(p, A, B):
    s = Fraction(0)
    for (a, b), c in p.items():
        s += c * Fraction(A) ** a * Fraction(B) ** b
    return s


def polys(d):
    c = coeffs(d)

    def H(t):
        return sum(c[j] * t ** j for j in c)

    def Ha(t):
        return sum(Fraction(d - j, d) * c[j] * t ** j for j in c)

    def Hb(t):
        return sum(Fraction(j, d) * c[j] * t ** (j - 1) for j in c)
    return H, Ha, Hb


def psi_pow(U, V, D, h, k):
    """Psi_h(U,V;D)^h = (UV)^h / ((kU+V)^(h-1) D), exact"""
    return (U * V) ** h / ((k * U + V) ** (h - 1) * D)


def thresholds(d, U, V, modeQ):
    """(exact h-th powers or exact values) -> rational strict upper bounds delta-bar_h, h = d..1, and the exact
    h-th powers, so a caller can re-check delta-bar^h > delta^h"""
    k = d - 2
    g = (d - 1) * (k - 1) + (1 if d == 4 else 0)
    out = {}
    out[d] = up(psi_pow(U, V, U + V, d, k), d, bounded=False)
    if modeQ:
        assert d == 4
        out[3] = up(psi_pow(U, V, V, 3, k), 3, bounded=False)
        out[2] = max(up(psi_pow(U, V, min(3 * U, 2 * V, U + V), 2, k), 2, bounded=False), up(U * U / 3, 2, bounded=False))
    else:
        for h in range(2, d):
            out[h] = up(psi_pow(U, V, min(U, V), h, k), h, bounded=False)
    out[1] = max(U / 2, min(U, V / g))
    return out


def E_sum(d, dbar):
    run, tot = Fraction(0), Fraction(0)
    for h in range(d, 0, -1):
        run = max(run, dbar[h])
        tot += run
    return tot


# ---------------------------------------------------------------- the cells

def stop_index(d):
    k = d - 2
    z = K0
    while True:
        e = Fraction(z, K0)
        if e * (1 - k * e / d) < STOP:
            return z
        z += 1


def cell(d, z, ti_override=None):
    """apply the prescription to cell z; returns a dict of every quantity and the per-cell failures"""
    k = d - 2
    H, Ha, Hb = polys(d)
    c = coeffs(d)
    em, ep = Fraction(z, K0), Fraction(z + 1, K0)
    bm, bp = d - k * ep, d - k * em
    modeQ = (d == 4 and z < 4000)
    # t* : minimise N_i^d / Hint_i over i = 1..499 (the common positive factors dropped), first on ties
    if ti_override is None:
        best = None
        A0, A1 = 50 * (z + 1), d * K0 - k * z
        for i in range(1, 500):
            N = A0 + A1 * i
            Hi = sum(c[j] * i ** j * 50 ** (d - 1 - j) for j in c)
            if best is None or N ** d * best[2] < best[1] ** d * Hi:
                best = (i, N, Hi)
        ti = best[0]
    else:
        ti = ti_override
    t = Fraction(ti, 50)
    X = ((d + 1) * (ep + bp * t) / d ** 2) ** d / H(t)
    fails = []
    if not (0 <= X < 1):
        fails.append('X not in [0,1)')
        return {'fails': fails}
    w = up(X, d - 1)
    m = (d - 1) * w
    if not (0 < m < 1):
        fails.append('m not in (0,1)')
    if not (min(em, bm) > m):
        fails.append('min(eta-,b-) <= m')
    if not (w ** (d - 1) * H(t) > ((d + 1) * (ep + bp * t) / d ** 2) ** d):
        fails.append('first cut inequality')
    if not (w ** (d - 2) * min(Ha(t), Hb(t)) > ((ep + bp * t) / (d - 1)) ** (d - 1)):
        fails.append('second cut inequality')
    u, v = (ep - m) / d, (bp - m) / d
    if not (u > 0 and v > 0 and LO <= v / u <= HI):
        fails.append('v/u outside [3/20,5]')
        return {'fails': fails}
    dbar = thresholds(d, u, v, modeQ)
    gap = 1 - m - E_sum(d, dbar)
    if not (m + E_sum(d, dbar) < SAVE):
        fails.append('m + sum Ebar >= 999/1000')
    if modeQ and not (m + 2 * u < SAVE):
        fails.append('mode Q: m + 2u >= 999/1000')
    return {'fails': fails, 't': t, 'w': w, 'm': m, 'u': u, 'v': v, 'gap': gap, 'modeQ': modeQ}


# ---------------------------------------------------------------- the derivative branch checks

def N_hab(t, h, k, a, b):
    return t * (1 + 1 / t - Fraction(h - 1, h) * Fraction(k + 1) / (k + t) - Fraction(1, h) * Fraction(a + b) / (a + b * t))


def D_over_g(t, h, k, a, b):
    return 1 - (1 - t) * t * Fraction(h - 1, h) / (k + t) - (1 - t) * t * Fraction(b, h) / (a + b * t)


# ---------------------------------------------------------------- the table

TABLE_RE = re.compile(r'^\s*(\d)\s*&\s*(\d+)\s*&\s*(\d+)\s*&\s*\$(\d+)/(\d+)\$\s*&\s*\$(\d+)/(\d+)\$')


def read_table(tex):
    rows = {}
    for line in tex.split('\n'):
        mt = TABLE_RE.match(line)
        if mt:
            g = [int(x) for x in mt.groups()]
            rows[g[0]] = {'z_d': g[1], 'intervals': g[2], 'ratio': Fraction(g[3], g[4]), 'gap': Fraction(g[5], g[6])}
    return rows


EXT = {   # 13-cyclotomic.tex:74-103 and 12-certificate.tex:99-100, as printed
    'eps0': Fraction(1, 10 ** 6), 'eta+': Fraction(3001, 3000), 'b-': Fraction(2999, 1500), 't': Fraction(1, 2),
    'w': Fraction(24809, 100000), 'm': Fraction(74427, 100000), 'u': Fraction(76819, 1200000),
    'v': Fraction(313933, 1000000),
    'dbar': (Fraction(4729, 100000), Fraction(5097, 100000), Fraction(6899, 100000), Fraction(76819, 1200000)),
    'gap1': Fraction(1941, 100000), 'gap2': Fraction(15319, 120000), 'HHaHb': (10, 5, 10)}


def extension(checks, ext):
    d, k = 4, 2
    H, Ha, Hb = polys(d)
    em = 1 - ext['eps0']
    ep = ext['eta+']
    bm = d - k * ep
    bp = d - k * em
    t, w = ext['t'], ext['w']
    check(checks, '6. enlarged cell: b- = 4 - 2 eta+ = 2999/1500 and b+ = 2 + 2 eps0', bm == ext['b-'] and bp == 2 + 2 * ext['eps0'])
    check(checks, '6. (H, H_a, H_b)(1/2) = (10, 5, 10)', (H(t), Ha(t), Hb(t)) == ext['HHaHb'], str((H(t), Ha(t), Hb(t))))
    c1 = w ** (d - 1) * H(t) > ((d + 1) * (ep + bp * t) / d ** 2) ** d
    c2 = w ** (d - 2) * min(Ha(t), Hb(t)) > ((ep + bp * t) / (d - 1)) ** (d - 1)
    X = ((d + 1) * (ep + bp * t) / d ** 2) ** d / H(t)
    check(checks, '6. enlarged cell: both strict cut inequalities with w = 24809/100000', c1 and c2,
          'w = up_3(X): %s' % (up(X, 3) == w))
    m = (d - 1) * w
    u, v = (ep - m) / d, (bp - m) / d
    check(checks, '6. enlarged cell: m, u, v equal the printed values', (m, u, v) == (ext['m'], ext['u'], ext['v']), '%s %s %s' % (m, u, v))
    check(checks, '6. enlarged cell: 0 < m < min(eta-, b-) and 3/20 <= v/u <= 5', 0 < m < min(em, bm) and LO <= v / u <= HI)
    # the true thresholds (mode Q), and the printed bounds
    psi4 = psi_pow(u, v, u + v, 4, k)
    psi3 = psi_pow(u, v, v, 3, k)
    psi2 = psi_pow(u, v, min(3 * u, 2 * v, u + v), 2, k)
    d4, d3, d2, d1 = ext['dbar']
    strict = d4 ** 4 > psi4 and d3 ** 3 > psi3 and d2 ** 2 > psi2 and d2 ** 2 > u * u / 3 and d1 == max(u / 2, min(u, v / 4))
    check(checks, '6. enlarged cell: each printed threshold bound is a strict upper bound (dbar^h > delta^h) and delta_1 exact', strict)
    mine = thresholds(4, u, v, True)
    check(checks, '6. enlarged cell: the printed bounds equal up_h of the thresholds', (mine[4], mine[3], mine[2], mine[1]) == ext['dbar'],
          str([str(mine[h]) for h in (4, 3, 2, 1)]))
    Eb = E_sum(4, {4: d4, 3: d3, 2: d2, 1: d1})
    g1 = 1 - m - Eb - 4 * TAU
    g2 = 1 - m - 2 * u - 2 * TAU
    check(checks, '6. enlarged cell: 1 - m - sum Ebar_h - 4 tau = 1941/100000 > 0', g1 == ext['gap1'] and g1 > 0, str(g1))
    check(checks, '6. enlarged cell: 1 - m - 2u - 2 tau = 15319/120000 > 0', g2 == ext['gap2'] and g2 > 0, str(g2))


# ---------------------------------------------------------------- decide

def decide(src=None, table_patch=None, ext_patch=None, degrees=(4, 5, 6, 7, 8)):
    src = src or Sources()
    checks = []
    tex = src.text(PARAMS)
    cuts = src.text(CUTS)
    cyc = src.text(CYCLO)
    appx = src.text(APPX)
    flat = re.sub(r'\s+', '', tex)
    check(checks, 'the prescription constants as printed (K0, G0, tau, 2495/10000, grid i/50 with 1 <= i < 500, 999/1000, 3/20..5)',
          all(s in flat for s in ('K_0=3000,\\qquadG_0=100000,\\qquad\\tau=\\frac1{50000}', '<\\frac{2495}{10000}', '$i/50$,$1\\lei<500$',
                                  '<\\frac{999}{1000}', '\\frac3{20}\\le\\fracvu\\le5')))
    check(checks, 'R(A,B) as printed in eq:hilbert-polynomial', 'R(A,B)=\\frac1{d!}\\sum_{j=1}^{d-1}' in re.sub(r'\s+', '', cuts) and
          '\\binomdj\\binom{d-2}{j-1}k^{j-1}A^{d-j}B^j' in re.sub(r'\s+', '', cuts))
    check(checks, '(H,H_a,H_b)=(10,5,10) at t*=1/2 as printed', '$(H,H_a,H_b)=(10,5,10)$' in re.sub(r'\s+', '', appx))
    table = read_table(tex)
    if table_patch:
        table = {dd: dict(r) for dd, r in table.items()}
        for dd, key, val in table_patch:
            table[dd][key] = val
    check(checks, 'Table tab:parameter-certificate parsed: five rows d = 4..8', sorted(table) == [4, 5, 6, 7, 8])

    # 0. the polynomials
    ok0 = True
    for d in range(4, 9):
        R = R_poly(d)
        ok0 &= (R_from_hilbert(d) == R)
        H, Ha, Hb = polys(d)
        for t in (Fraction(1, 7), Fraction(3, 2), Fraction(11, 5)):
            ok0 &= H(t) == factorial(d) * ev1(R, 1, t)
            ok0 &= Ha(t) == factorial(d - 1) * ev1(diff(R, 0), 1, t)
            ok0 &= Hb(t) == factorial(d - 1) * ev1(diff(R, 1), 1, t)
        # degree <= d-1 polynomials agreeing at d points are equal; check d+1 points
        for i in range(1, d + 2):
            t = Fraction(i, 3)
            ok0 &= H(t) == factorial(d) * ev1(R, 1, t)
            ok0 &= Ha(t) == factorial(d - 1) * ev1(diff(R, 0), 1, t)
            ok0 &= Hb(t) == factorial(d - 1) * ev1(diff(R, 1), 1, t)
    check(checks, '0. R = leading form of the Hilbert function, and H, H_a, H_b = the closed forms eq:parameter-polynomials (d = 4..8)', ok0)

    # 1-3. the cells
    value = {}
    for d in degrees:
        k = d - 2
        zd = stop_index(d)
        row = table.get(d, {})
        check(checks, '1. d=%d: stopping index z_d = %d (first z >= 3000 with eta-(1 - k eta-/d) < 2495/10000)' % (d, zd), row.get('z_d') == zd,
              'printed %s' % row.get('z_d'))
        check(checks, '1. d=%d: %d intervals, z_d/K0 = %s' % (d, zd - K0, Fraction(zd, K0)),
              row.get('intervals') == zd - K0 and row.get('ratio') == Fraction(zd, K0), 'printed %s, %s' % (row.get('intervals'), row.get('ratio')))
        bad = []
        mingap = None
        argmin = None
        tset = set()
        for z in range(K0, zd):
            r = cell(d, z)
            if r['fails']:
                bad.append((z, r['fails']))
                continue
            tset.add(r['t'])
            if mingap is None or r['gap'] < mingap:
                mingap, argmin = r['gap'], (z, r['t'], r['w'])
        check(checks, '2. d=%d: all %d cells pass (X<1, 0<m<1, min(eta-,b-)>m, both cut inequalities, 3/20<=v/u<=5, m+sum E_h<999/1000%s)'
              % (d, zd - K0, ', m+2u<999/1000 in mode Q' if d == 4 else ''), not bad, str(bad[:3]))
        check(checks, '3. d=%d: certified gap min(1 - m - sum Ebar_h) = %s' % (d, mingap), mingap == row.get('gap'),
              'printed %s; attained at z=%s t*=%s w=%s' % (row.get('gap'), argmin[0] if argmin else None, argmin[1] if argmin else None, argmin[2] if argmin else None))
        check(checks, '3. d=%d: gap > d tau and > 1/1000 (so m + sum E_h + d tau < 1)' % d, mingap is not None and mingap > d * TAU and mingap > 1 - SAVE)
        value[d] = {'z_d': zd, 'cells': zd - K0, 'gap': str(mingap), 'distinct_t*': len(tset), 'argmin_z': argmin[0] if argmin else None}

    # 4. the derivative branches
    bad4 = []
    nb = 0
    for k in range(2, 7):
        for h in range(2, k + 3):
            for a, b in ((1, 0), (0, 1), (1, 1)):
                for t in (LO, HI):
                    nb += 1
                    N = N_hab(t, h, k, a, b)
                    if not (N >= 0 and N ** h < (k + t) ** (h - 1) * (a + b * t)):
                        bad4.append((k, h, a, b, str(t)))
                for i in range(1, 7):      # the closed form for D, as a rational identity
                    t = Fraction(i, 4) + Fraction(1, 13)
                    if N_hab(t, h, k, a, b) != D_over_g(t, h, k, a, b):
                        bad4.append(('identity', k, h, a, b))
    check(checks, '4. the %d endpoint inequalities N >= 0, N^h < (k+t)^(h-1)(a+bt) at t = 3/20, 5; and N = D/g as an identity' % nb, not bad4, str(bad4[:4]))

    # 5. the margins
    e = Fraction(1, 10000)
    q = Fraction(4999, 10000) ** 2
    m5 = [SAVE + 8 * TAU == Fraction(24979, 25000), Fraction(24979, 25000) < 1,
          SAVE + 2 * TAU == Fraction(3122, 3125), Fraction(3122, 3125) < 1,
          q - STOP == Fraction(40001, 100000000),
          STOP + (3 * e + e * e) / 4 < q,
          all(e * (Fraction(d, d - 2) + e) / d < q for d in range(4, 9)),
          Fraction(4999, 10000) + Fraction(1, 2) == Fraction(9999, 10000),
          all(Fraction(4000, K0) == Fraction(4, 3) for _ in (0,))]
    check(checks, '5. printed margins: 24979/25000, 3122/3125, 40001/100000000, the large-eta weights, 9999/10000, the last Q interval ends at 4/3', all(m5), str(m5))

    # 6. the enlarged first quartic cell
    ext = dict(EXT)
    if ext_patch:
        ext.update(ext_patch)
    check(checks, '6. the enlarged-cell parameters as printed (13-cyclotomic.tex:61-102)',
          all(s in re.sub(r'\s+', '', cyc) for s in ('\\epsilon_0=10^{-6}', '\\eta_+=\\frac{3001}{3000}', 'b_-=\\frac{2999}{1500}', 'b_+=2+2\\epsilon_0',
                                                    'w=\\frac{24809}{100000}', 'm=\\frac{74427}{100000}', 'u=\\frac{76819}{1200000}', 'v=\\frac{313933}{1000000}',
                                                    '\\frac{4729}{100000},\\frac{5097}{100000},\\frac{6899}{100000},\\frac{76819}{1200000}',
                                                    '=\\frac{1941}{100000}>0', '1-m-2u-2\\tau=\\frac{15319}{120000}>0')))
    extension(checks, ext)

    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the exact parameter certificate of Proposition prop:parameter-certificate '
                       '(all 3,989 cells for d = 4..8, Table tab:parameter-certificate, the 150 endpoint derivative '
                       'inequalities), the printed exponent margins, and the enlarged quartic cell of Proposition '
                       'prop:cyclotomic-central; not the density theorem, whose other steps are proved in prose',
            'value': value}


def forge():
    """each must NOT certify"""
    out = []
    r = decide(table_patch=[(4, 'gap', Fraction(192, 100000))], degrees=(4,))
    out.append(('Table: d=4 certified gap printed 192/100000 instead of 191/100000', r['verdict']))
    r = decide(table_patch=[(6, 'z_d', 3553)], degrees=(6,))
    out.append(('Table: d=6 stopping index printed 3553 instead of 3552', r['verdict']))
    r = decide(ext_patch={'w': Fraction(24808, 100000), 'm': Fraction(74424, 100000), 'u': (Fraction(3001, 3000) - Fraction(74424, 100000)) / 4,
                          'v': (2 + Fraction(2, 10 ** 6) - Fraction(74424, 100000)) / 4}, degrees=())
    out.append(('enlarged cell: w moved one grid step down, 24808/100000 (m, u, v recomputed consistently)', r['verdict']))
    r = decide(ext_patch={'dbar': (Fraction(4728, 100000), Fraction(5097, 100000), Fraction(6899, 100000), Fraction(76819, 1200000))}, degrees=())
    out.append(('enlarged cell: printed delta_4 bound lowered to 4728/100000', r['verdict']))
    # a cell forced off the prescription: the worst grid point t* = 1/50 for the first d=4 cell
    c = cell(4, 3000, ti_override=1)
    out.append(('d=4, z=3000 with t* forced to 1/50 (the cell must fail)', 'CERTIFIED' if not c['fails'] else 'REFUTED: ' + ', '.join(c['fails'])))
    return out


if __name__ == '__main__':
    import json
    import time
    t0 = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], c_['detail'])
    print('sources:', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t0))
    t1 = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t1))
