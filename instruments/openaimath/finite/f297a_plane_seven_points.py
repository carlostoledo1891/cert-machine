"""F-297a — "The Euclidean plane is not five-colorable" (openai/math family 158): the seven-point certificate.

THE CLAIM. The headline (main.tex abstract; introduction.tex:62-68, Theorem thm:main) is that every colouring of the
plane with five colours has a monochromatic unit-distance pair. Its proof is a transfer theorem (thm:transfer) plus a
measurable obstruction (thm:weak-five), which ends (angular.tex:609-617) by excluding interface cycles of length
three, four and five. The length-three case, Proposition prop:angular-three (angular.tex:586-607), rests on one
finite object, quoted here:
  angular.tex:529-533  G = {0, A, B, T, uA, uB, uT},  A = (sqrt3+i)/2,  B = (sqrt3-i)/2,  T = sqrt3,  u = (5+i sqrt11)/6
  angular.tex:546-550  z_g = (35+12i)/37 * (g + (-290+149i)/250),  g in G
  angular.tex:484-490  with z = xi + i*upsilon and l = xi^2 + upsilon^2, the region 0 < l < 4 and
                       P := upsilon^2 (3 xi^2 - upsilon^2)^2 < P' := l^3 (1 - l/4)(l - 1)^2       (eq:source-27)
  angular.tex:577-580  Lemma angular-certificate: "Every z_g ... satisfies 0 < |z_g|^2 < 4 and (eq:source-27)."
  angular.tex:534-543  the seven points are a Moser spindle: unit edges, and no proper three-colouring.
  angular.tex:619-773  the paper's own rational verification: Table tab:angular-coordinates (centres xi_0, upsilon_0
                       within h = 0.00011, bounds P_+ and P'_-), the midpoint residual table (d_x, d_y over
                       710400000000), Table tab:angular-factors (b_y, b_H, a, b), and the squared-radius intervals.
  figures/moser-placement.tex  the eleven drawn edges.

WHAT IS DECIDED HERE, exactly. Arithmetic is in the real field K = Q(sqrt3, sqrt11); an element is four Fractions
over the basis 1, sqrt3, sqrt11, sqrt33 (sqrt3*sqrt11 = sqrt33), and a complex number is a pair of elements. Every
strict inequality is decided TWO ways:
  (1) an exact sign algorithm. For p + q sqrt3 (p, q rational): if p and q do not have strictly opposite signs the
      sign is read off; otherwise sign = sign(p) * sign(p^2 - 3 q^2). For alpha + sqrt11 beta (alpha, beta in
      Q(sqrt3)): the same, with sign(alpha^2 - 11 beta^2) computed in Q(sqrt3) by the first rule. This is real
      arithmetic on both sides of a comparison of nonnegative numbers; it never assumes the basis is independent.
  (2) rational isolation. sqrt3 and sqrt11 are enclosed by [isqrt(n 10^2k), isqrt(n 10^2k)+1] / 10^k (each
      endpoint squared and compared with n, exactly); the seven points are rebuilt from these enclosures by
      complex interval arithmetic with Fraction endpoints (uA = u*A as an interval product, never through sqrt33),
      placed, and xi^2, upsilon^2, l, P, P' are evaluated by outward interval operations. k doubles from 8 until
      every inequality is settled (cap 512 digits; reaching it would be a REFUSAL, never a pass).
Both must agree and settle for a check to pass. Decided:
  - Lemma angular-certificate: 0 < l, l < 4 and P < P' at each of the seven z_g (21 inequalities, two ways each).
  - the spindle: the eleven drawn edges (parsed from the figure) have squared length exactly 1, before and after the
    placement; |w|^2 = 1 for w = (35+12i)/37; the paper's |u|^2 = (25+11)/36, |1-u|^2 = (1+11)/36, |T-uT|^2 = 1; the
    printed coordinates of uA, uB, uT; the 21 pairwise distances (exactly 11 are 1, none is 0); and, by exhausting
    all 3^7 colourings, that the eleven-edge graph has no proper three-colouring (and that every proper
    three-colouring of the rhombus 0,A,B,T forces c(0) = c(T), the step the paper's argument uses).
  - every number the verification subsection prints: the centres (|xi - xi_0| < h, |upsilon - upsilon_0| < h, decided
    exactly), P < P_+, P'_- < P' (exactly), P_+ < P'_-, the radical bounds, the midpoint product bound, the residual
    table d_x, d_y (recomputed exactly from the midpoint substitution), the 35520000 bound, the 47/37 row sum and
    the final h bound, the squared-coordinate integer form, every factor-table inequality y_u < b_y, H < b_H,
    a < l_l <= l_u < b, (a, b) in (0, 4) avoiding 1, b_y b_H^2 < P_+, a^3 (1 - b/4) min(|a-1|,|b-1|)^2 > P'_-, the
    worked row for uT, and the seven squared-radius intervals.

WHAT IS NOT DECIDED. The headline — that the plane is not five-colourable — is NOT decided here. It rests on the
transfer theorem (unrestricted to weak measurable colourings, Theorem thm:transfer), the spectral / rigidity /
palette / transition / interface machinery that extracts an interface cycle of length 3, 4 or 5, Propositions
prop:angular-five and prop:angular-four, and the analytic Lemma angular-region (that P < P' with 0 < l < 4 forces a
neighbourhood to use only the three triangle labels, via triple-angle identities, a.e. arguments and a local
diffeomorphism). This decider certifies only the finite object that the length-three exclusion consumes: that the
seven placed points lie strictly in the region of eq:source-27, that they span a non-three-colourable unit-distance
graph, and that every number in the paper's own verification of that is right.
"""
import itertools
import math
import os
import re
import sys
import time
from fractions import Fraction as Fr

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

D = 'preprints/The-Euclidean-plane-is-not-five-colorable-September-23-2026/build/'
ANG = D + 'sections/angular.tex'
FIG = D + 'figures/moser-placement.tex'
MAIN = D + 'main.tex'
INTRO = D + 'sections/introduction.tex'
NAMES = ['0', 'A', 'B', 'T', 'uA', 'uB', 'uT']
FIGNAME = {'O': '0', 'A': 'A', 'B': 'B', 'T': 'T', 'UA': 'uA', 'UB': 'uB', 'UT': 'uT'}


class Refused(Exception):
    pass


# ---------------------------------------------------------------- the field K = Q(sqrt3, sqrt11), exactly
# an element is (a, b, c, d) = a + b sqrt3 + c sqrt11 + d sqrt33

def K(a=0, b=0, c=0, d=0):
    return (Fr(a), Fr(b), Fr(c), Fr(d))


ZERO, ONE = K(), K(1)
S3, S11, S33 = K(0, 1), K(0, 0, 1), K(0, 0, 0, 1)


def kadd(x, y):
    return tuple(p + q for p, q in zip(x, y))


def ksub(x, y):
    return tuple(p - q for p, q in zip(x, y))


def kscale(x, r):
    r = Fr(r)
    return tuple(p * r for p in x)


def kmul(x, y):
    a1, b1, c1, d1 = x
    a2, b2, c2, d2 = y
    # e1 e1 = 3, e2 e2 = 11, e3 e3 = 33, e1 e2 = e3, e1 e3 = 3 e2, e2 e3 = 11 e1
    return (a1 * a2 + 3 * b1 * b2 + 11 * c1 * c2 + 33 * d1 * d2,
            a1 * b2 + b1 * a2 + 11 * c1 * d2 + 11 * d1 * c2,
            a1 * c2 + c1 * a2 + 3 * b1 * d2 + 3 * d1 * b2,
            a1 * d2 + d1 * a2 + b1 * c2 + c1 * b2)


def _sgn(r):
    return (r > 0) - (r < 0)


def sign_q3(p, q):
    """exact sign of p + q sqrt3"""
    sp, sq = _sgn(p), _sgn(q)
    if sp >= 0 and sq >= 0:
        return 1 if (sp or sq) else 0
    if sp <= 0 and sq <= 0:
        return -1
    return sp * _sgn(p * p - 3 * q * q)


def ksign(x):
    """exact sign of a + b sqrt3 + c sqrt11 + d sqrt33 = alpha + sqrt11 beta, alpha = a + b sqrt3, beta = c + d sqrt3"""
    a, b, c, d = x
    sa, sb = sign_q3(a, b), sign_q3(c, d)
    if sa >= 0 and sb >= 0:
        return 1 if (sa or sb) else 0
    if sa <= 0 and sb <= 0:
        return -1
    # alpha^2 - 11 beta^2 in Q(sqrt3)
    p = a * a + 3 * b * b - 11 * (c * c + 3 * d * d)
    q = 2 * a * b - 22 * c * d
    return sa * sign_q3(p, q)


def cmul(z, w):
    return (ksub(kmul(z[0], w[0]), kmul(z[1], w[1])), kadd(kmul(z[0], w[1]), kmul(z[1], w[0])))


def cadd(z, w):
    return (kadd(z[0], w[0]), kadd(z[1], w[1]))


def csub(z, w):
    return (ksub(z[0], w[0]), ksub(z[1], w[1]))


def cnorm(z):
    return kadd(kmul(z[0], z[0]), kmul(z[1], z[1]))


def crat(re_, im_):
    return (K(re_), K(im_))


def points_exact(u=None):
    A = (kscale(S3, Fr(1, 2)), K(Fr(1, 2)))
    B = (kscale(S3, Fr(1, 2)), K(Fr(-1, 2)))
    T = (S3, ZERO)
    u = u or (K(Fr(5, 6)), kscale(S11, Fr(1, 6)))
    O = (ZERO, ZERO)
    return {'0': O, 'A': A, 'B': B, 'T': T, 'uA': cmul(u, A), 'uB': cmul(u, B), 'uT': cmul(u, T)}, u


def place(g, w, c):
    return cmul(w, cadd(g, c))


def PQ(z):
    """l, P, P' of eq:source-27 at z, exactly in K"""
    xi, up = z
    x2, y2 = kmul(xi, xi), kmul(up, up)
    l = kadd(x2, y2)
    t = ksub(kscale(x2, 3), y2)
    P = kmul(y2, kmul(t, t))
    lm1 = ksub(l, ONE)
    Pp = kmul(kmul(kmul(l, kmul(l, l)), ksub(ONE, kscale(l, Fr(1, 4)))), kmul(lm1, lm1))
    return l, P, Pp


# ---------------------------------------------------------------- rational isolation (way 2), Fraction intervals

class I:
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        self.lo = Fr(lo)
        self.hi = Fr(lo if hi is None else hi)
        if self.lo > self.hi:
            raise ValueError('inverted interval')

    def __add__(self, o):
        o = o if isinstance(o, I) else I(o)
        return I(self.lo + o.lo, self.hi + o.hi)

    def __sub__(self, o):
        o = o if isinstance(o, I) else I(o)
        return I(self.lo - o.hi, self.hi - o.lo)

    def __mul__(self, o):
        o = o if isinstance(o, I) else I(o)
        ps = [self.lo * o.lo, self.lo * o.hi, self.hi * o.lo, self.hi * o.hi]
        return I(min(ps), max(ps))

    def sq(self):
        if self.lo >= 0:
            return I(self.lo ** 2, self.hi ** 2)
        if self.hi <= 0:
            return I(self.hi ** 2, self.lo ** 2)
        return I(0, max(self.lo ** 2, self.hi ** 2))

    def pos(self):
        return 1 if self.lo > 0 else (-1 if self.hi < 0 else 0)


def sqrt_enclosure(n, k):
    s = math.isqrt(n * 10 ** (2 * k))
    lo, hi = Fr(s, 10 ** k), Fr(s + 1, 10 ** k)
    if not (lo * lo <= n < hi * hi):
        raise Refused('sqrt enclosure failed')
    return I(lo, hi)


def points_interval(k, u_exact=None):
    r3, r11 = sqrt_enclosure(3, k), sqrt_enclosure(11, k)
    half = Fr(1, 2)

    def m(z, w):
        return (z[0] * w[0] - z[1] * w[1], z[0] * w[1] + z[1] * w[0])
    A = (r3 * half, I(half))
    B = (r3 * half, I(-half))
    T = (r3, I(0))
    if u_exact is None:
        u = (I(Fr(5, 6)), r11 * Fr(1, 6))
    else:  # a forged rational u
        u = (I(u_exact[0][0]), I(u_exact[1][0]))
        assert all(v == 0 for v in u_exact[0][1:] + u_exact[1][1:])
    return {'0': (I(0), I(0)), 'A': A, 'B': B, 'T': T, 'uA': m(u, A), 'uB': m(u, B), 'uT': m(u, T)}


def region_interval(z, w, c):
    gx, gy = z[0] + c[0], z[1] + c[1]
    xi = gx * w[0] - gy * w[1]
    up = gx * w[1] + gy * w[0]
    x2, y2 = xi.sq(), up.sq()
    l = x2 + y2
    t = x2 * 3 - y2
    P = y2 * t.sq()
    lm1 = l - 1
    Pp = l * l * l * (I(1) - l * Fr(1, 4)) * lm1.sq()
    return l, P, Pp


# ---------------------------------------------------------------- the published numbers

def _cells(line):
    return [s.strip() for s in re.findall(r'\\\((.*?)\\\)', line)]


def parse_tables(tex):
    L = tex.split('\n')
    i0 = next(i for i, s in enumerate(L) if '\\label{tab:angular-coordinates}' in s)
    coord = {}
    for s in L[i0 - 15:i0]:
        c = _cells(s)
        if len(c) == 5 and c[0] in NAMES:
            coord[c[0]] = tuple(Fr(x) for x in c[1:])
    i1 = next(i for i, s in enumerate(L) if '\\label{tab:angular-factors}' in s)
    fac = {}
    for s in L[i1 - 15:i1]:
        c = _cells(s)
        if len(c) == 5 and c[0] in NAMES:
            fac[c[0]] = tuple(Fr(x) for x in c[1:])
    a0 = next(i for i, s in enumerate(L) if '\\begin{array}{c|rr}' in s)
    res = {}
    for s in L[a0 + 1:a0 + 12]:
        if '\\end{array}' in s:
            break
        m = re.match(r'\s*(0|A|B|T|uA|uB|uT)&(-?\d+)&(-?\d+)\s*(\\\\)?\s*$', s)
        if m:
            res[m.group(1)] = (int(m.group(2)), int(m.group(3)))
    j = next(i for i, s in enumerate(L) if 'The squared-radius' in s)
    blob = ' '.join(L[j:j + 5])
    radii = [(Fr(a), Fr(b)) for a, b in re.findall(r'\((\d+\.\d+),(\d+\.\d+)\)', blob)]
    return coord, fac, res, radii


def parse_edges(fig):
    edges = set()
    for line in fig.split('\n'):
        if '\\draw[first]' in line or '\\draw[second]' in line:
            names = re.findall(r'\((O|A|B|T|UA|UB|UT)\)', line)
            for p, q in zip(names, names[1:]):
                edges.add(frozenset((FIGNAME[p], FIGNAME[q])))
    m = re.search(r'\\draw\[orange[^\]]*\]\s*\((\w+)\)\s*--', fig)
    tail = re.search(r'\{\$1\$\}\s*\((\w+)\)', fig)
    if m and tail:
        edges.add(frozenset((FIGNAME[m.group(1)], FIGNAME[tail.group(1)])))
    return edges


def three_colourings(edges, verts=NAMES):
    idx = {v: i for i, v in enumerate(verts)}
    E = [(idx[a], idx[b]) for a, b in (tuple(e) for e in edges)]
    good = []
    for col in itertools.product(range(3), repeat=len(verts)):
        if all(col[a] != col[b] for a, b in E):
            good.append(col)
    return good


# ---------------------------------------------------------------- decide

W = (Fr(35, 37), Fr(12, 37))
C = (Fr(-290, 250), Fr(149, 250))


def decide(src=None, w=W, c=C, u=None, tables=None, edges=None):
    src = src or Sources()
    checks = []
    tex = src.text(ANG)
    fig = src.text(FIG)
    main = src.text(MAIN)
    intro = src.text(INTRO)
    flat = tex.replace('\n', ' ')
    check(checks, 'the headline as stated (main.tex abstract, introduction.tex Theorem thm:main)',
          'every coloring of the Euclidean plane with five colors has a' in main.replace('\n', ' ') and 'has no proper five-coloring' in intro.replace('\n', ' '),
          'NOT decided here; this row decides the seven-point certificate only')
    check(checks, 'the lemma, the region, the vertex set and the placement as printed (angular.tex:484-550, 577-580)',
          all(s in flat for s in ('P:=\\upsilon^2(3\\xi^2-\\upsilon^2)^2', 'P\':=l^3(1-l/4)(l-1)^2', 'u=\\frac{5+i\\sqrt{11}}6',
                                  'z_g=\\frac{35+12i}{37}', 'g+\\frac{-290+149i}{250}', '\\(0<\\abs{z_g}^2<4\\) and \\eqref{eq:source-27}')))
    coord, fac, res, radii = tables or parse_tables(tex)
    check(checks, 'the three printed tables parse to 7 rows each, and seven squared-radius intervals',
          len(coord) == len(fac) == len(res) == len(radii) == 7, '%d %d %d %d' % (len(coord), len(fac), len(res), len(radii)))

    # ---- the spindle
    G, uu = points_exact(u)
    wK = crat(*w)
    cK = crat(*c)
    Z = {g: place(G[g], wK, cK) for g in NAMES}
    check(checks, '|w|^2 = 1 for w = (35+12i)/37 (35^2 + 12^2 = 37^2)', cnorm(wK) == ONE and 35 ** 2 + 12 ** 2 == 37 ** 2)
    check(checks, '|u|^2 = (25+11)/36 = 1', ksign(ksub(cnorm(uu), ONE)) == 0 and Fr(25 + 11, 36) == 1)
    check(checks, '|1-u|^2 = (1+11)/36', ksign(ksub(cnorm(csub((ONE, ZERO), uu)), K(Fr(12, 36)))) == 0)
    check(checks, '|T-uT|^2 = 3|1-u|^2 = 1', ksign(ksub(cnorm(csub(G['T'], G['uT'])), ONE)) == 0)
    printed = {'uA': (K(0, Fr(5, 12), Fr(-1, 12)), K(Fr(5, 12), 0, 0, Fr(1, 12))),
               'uB': (K(0, Fr(5, 12), Fr(1, 12)), K(Fr(-5, 12), 0, 0, Fr(1, 12))),
               'uT': (K(0, Fr(5, 6)), K(0, 0, 0, Fr(1, 6)))}
    for g, (px, py) in printed.items():
        check(checks, 'printed coordinates of %s (angular.tex:665-669)' % g, ksign(ksub(G[g][0], px)) == 0 and ksign(ksub(G[g][1], py)) == 0)
    E = edges if edges is not None else parse_edges(fig)
    check(checks, 'the figure draws eleven distinct edges', len(E) == 11, ' '.join(sorted('-'.join(sorted(e)) for e in E)))
    for e in sorted(E, key=lambda e: sorted(e)):
        a, b = sorted(e)
        d0 = ksign(ksub(cnorm(csub(G[a], G[b])), ONE))
        d1 = ksign(ksub(cnorm(csub(Z[a], Z[b])), ONE))
        check(checks, 'unit edge %s-%s: |g-h|^2 = 1 and |z_g - z_h|^2 = 1' % (a, b), d0 == 0 and d1 == 0)
    unit, coinc = 0, 0
    for a, b in itertools.combinations(NAMES, 2):
        d2 = cnorm(csub(G[a], G[b]))
        unit += ksign(ksub(d2, ONE)) == 0
        coinc += ksign(d2) == 0
    check(checks, 'the seven points are distinct, and exactly 11 of the 21 pairs are at distance 1', coinc == 0 and unit == 11, 'unit pairs %d' % unit)
    rh = three_colourings({frozenset(p) for p in (('0', 'A'), ('0', 'B'), ('A', 'B'), ('A', 'T'), ('B', 'T'))}, ['0', 'A', 'B', 'T'])
    check(checks, 'every proper 3-colouring of the rhombus 0,A,B,T has c(0) = c(T) (all 81 tried)', rh and all(col[0] == col[3] for col in rh), '%d proper' % len(rh))
    good = three_colourings(E)
    check(checks, 'the eleven-edge graph has no proper 3-colouring (all 3^7 = 2187 tried)', len(good) == 0, '%d proper' % len(good))

    # ---- Lemma angular-certificate, way 1 (exact sign) and way 2 (isolation)
    ex = {g: PQ(Z[g]) for g in NAMES}
    way1 = {g: (ksign(ex[g][0]), ksign(ksub(K(4), ex[g][0])), ksign(ksub(ex[g][2], ex[g][1]))) for g in NAMES}
    k, way2 = 8, None
    wI = (I(w[0]), I(w[1]))
    cI = (I(c[0]), I(c[1]))
    while True:
        pts = points_interval(k, None if u is None else uu)
        iv = {g: region_interval(pts[g], wI, cI) for g in NAMES}
        way2 = {g: (iv[g][0].pos(), (I(4) - iv[g][0]).pos(), (iv[g][2] - iv[g][1]).pos()) for g in NAMES}
        if all(s != 0 for v in way2.values() for s in v) or k >= 512:
            break      # an unsettled sign stays 0 and its check cannot pass (a refusal, never a pass)
        k *= 2
    digits = k
    unsettled = sum(s == 0 for v in way2.values() for s in v)
    for g in NAMES:
        for i, what in enumerate(('0 < |z_g|^2', '|z_g|^2 < 4', 'P < P\'')):
            check(checks, 'Lemma angular-certificate at z_%s: %s' % (g, what), way1[g][i] == 1 and way2[g][i] == 1,
                  'exact sign %+d, isolation sign %+d at %d digits' % (way1[g][i], way2[g][i], digits))

    # ---- Table tab:angular-coordinates, against the exact points
    h = Fr('0.00011')
    for g in NAMES:
        x0, y0, Pp_, Pm_ = coord[g]
        xi, up = Z[g]
        l, P, Pp = ex[g]
        okx = ksign(ksub(xi, K(x0 + h))) < 0 and ksign(ksub(xi, K(x0 - h))) > 0
        oky = ksign(ksub(up, K(y0 + h))) < 0 and ksign(ksub(up, K(y0 - h))) > 0
        check(checks, 'tab:angular-coordinates %s: |xi - (%s)| < h exactly' % (g, x0), okx, 'xi ~ %.7f' % _approx(xi))
        check(checks, 'tab:angular-coordinates %s: |upsilon - (%s)| < h exactly' % (g, y0), oky, 'upsilon ~ %.7f' % _approx(up))
        check(checks, 'tab:angular-coordinates %s: P < P_+ = %s exactly' % (g, Pp_), ksign(ksub(K(Pp_), P)) > 0, 'P ~ %.3g' % _approx(P))
        check(checks, 'tab:angular-coordinates %s: P\'_- = %s < P\' exactly' % (g, Pm_), ksign(ksub(Pp, K(Pm_))) > 0, 'P\' ~ %.4g' % _approx(Pp))
        check(checks, 'tab:angular-coordinates %s: P_+ < P\'_-' % g, Pp_ < Pm_)

    # ---- the paper's midpoint verification, every printed number
    a_s, b_s, eps = Fr('1.732055'), Fr('3.316625'), Fr('0.000005')
    check(checks, '1.73205^2 < 3 < 1.73206^2 and 3.31662^2 < 11 < 3.31663^2',
          Fr('1.73205') ** 2 < 3 < Fr('1.73206') ** 2 and Fr('3.31662') ** 2 < 11 < Fr('3.31663') ** 2)
    pe = (a_s + b_s) * eps + eps ** 2
    check(checks, '(a_* + b_*) eps + eps^2 = 0.000025243425 < 0.000026', pe == Fr('0.000025243425') and pe < Fr('0.000026'))
    check(checks, 'the product error bound bounds |sqrt3 sqrt11 - a_* b_*| (from the radical bounds)',
          max(abs(Fr('1.73205') * Fr('3.31662') - a_s * b_s), abs(Fr('1.73206') * Fr('3.31663') - a_s * b_s)) <= pe
          and ksign(ksub(S33, K(a_s * b_s + pe))) < 0 and ksign(ksub(S33, K(a_s * b_s - pe))) > 0)
    check(checks, '0.000026/6 < eps', Fr('0.000026') / 6 < eps)
    check(checks, 'the rotation has absolute row sum 47/37', abs(w[0]) + abs(w[1]) == Fr(47, 37))
    den = 710400000000
    for g in NAMES:
        # midpoint substitution: sqrt3 -> a_*, sqrt11 -> b_*, sqrt33 -> a_* b_* (the paper's "their product")
        def mid(x):
            return x[0] + x[1] * a_s + x[2] * b_s + x[3] * a_s * b_s
        gx, gy = mid(G[g][0]), mid(G[g][1])
        err = max(_absK(ksub(G[g][0], K(gx))), _absK(ksub(G[g][1], K(gy))))
        check(checks, 'midpoint substitution moves each coordinate of %s by at most eps (exact)' % g, err <= 0, 'excess sign %d' % err)
        X, Y = gx + c[0], gy + c[1]
        zx, zy = w[0] * X - w[1] * Y, w[1] * X + w[0] * Y
        x0, y0 = coord[g][0], coord[g][1]
        dx, dy = (zx - x0) * den, (zy - y0) * den
        check(checks, 'residual table %s: d_x = %d' % (g, res[g][0]), dx == res[g][0], 'recomputed %s' % dx)
        check(checks, 'residual table %s: d_y = %d' % (g, res[g][1]), dy == res[g][1], 'recomputed %s' % dy)
        check(checks, 'residual table %s: |d_x|, |d_y| < 35520000' % g, abs(res[g][0]) < 35520000 and abs(res[g][1]) < 35520000)
    check(checks, '35520000 = 710400000000/20000', Fr(den, 20000) == 35520000)
    check(checks, '(47/37) eps + 0.00005 < 0.00011 = h', Fr(47, 37) * eps + Fr('0.00005') < h)

    # ---- Table tab:angular-factors and the polynomial bounds
    M = 10 ** 5
    for g in NAMES:
        x0, y0, Pp_, Pm_ = coord[g]
        by, bH, a, b = fac[g]
        ax, ay = abs(x0), abs(y0)
        xl, xu, yl, yu = (ax - h) ** 2, (ax + h) ** 2, (ay - h) ** 2, (ay + h) ** 2
        ll, lu = xl + yl, xu + yu
        H = max(abs(3 * xl - yu), abs(3 * xu - yl))
        m_, n_ = M * ax, M * ay
        check(checks, 'factors %s: |xi_0|, |upsilon_0| > h' % g, ax > h and ay > h)
        check(checks, 'factors %s: (x_l,x_u,y_l,y_u) = ((m-11)^2,(m+11)^2,(n-11)^2,(n+11)^2)/10^10, m, n integers' % g,
              m_.denominator == 1 and n_.denominator == 1 and (xl, xu, yl, yu) == tuple(Fr(v, 10 ** 10) for v in ((m_ - 11) ** 2, (m_ + 11) ** 2, (n_ - 11) ** 2, (n_ + 11) ** 2)))
        check(checks, 'factors %s: y_u < b_y = %s' % (g, by), yu < by, 'y_u = %s' % float(yu))
        check(checks, 'factors %s: H < b_H = %s' % (g, bH), H < bH, 'H = %s' % float(H))
        check(checks, 'factors %s: a = %s < l_l <= l_u < b = %s' % (g, a, b), a < ll <= lu < b, '[%s, %s]' % (float(ll), float(lu)))
        check(checks, 'factors %s: (a, b) lies in (0, 4) and avoids 1' % g, 0 < a < b < 4 and not (a <= 1 <= b))
        check(checks, 'factors %s: b_y b_H^2 < P_+ = %s' % (g, Pp_), by * bH ** 2 < Pp_, '%s' % float(by * bH ** 2))
        lowP = a ** 3 * (1 - b / 4) * min(abs(a - 1), abs(b - 1)) ** 2
        check(checks, 'factors %s: a^3 (1-b/4) min(|a-1|,|b-1|)^2 > P\'_- = %s' % (g, Pm_), lowP > Pm_, '%s' % float(lowP))
        ra, rb = radii[NAMES.index(g)]
        l = ex[g][0]
        check(checks, 'squared-radius interval %s: [l_l, l_u] and the exact |z_g|^2 lie in (%s, %s)' % (g, ra, rb),
              ra < ll and lu < rb and ksign(ksub(l, K(ra))) > 0 and ksign(ksub(K(rb), l)) > 0)
    check(checks, 'the worked row: 2.44 (2.273)^2 < 12.65 and (2.493)^3 (1 - 2.495/4)(1.493)^2 > 12.9',
          Fr('2.44') * Fr('2.273') ** 2 < Fr('12.65') and Fr('2.493') ** 3 * (1 - Fr('2.495') / 4) * Fr('1.493') ** 2 > Fr('12.9')
          and '2.44(2.273)^2<12.65' in flat)

    ok = all(x['pass'] for x in checks)
    lemma_fail = any(not x['pass'] for x in checks if x['check'].startswith(('Lemma', 'unit edge', 'the eleven-edge')))
    # a check that failed only because isolation did not settle is a refusal; any decided failure refutes
    decided_fail = any(not x['pass'] and not (x['check'].startswith('Lemma') and 'isolation sign +0' in x['detail']) for x in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if decided_fail or not unsettled else 'REFUSED')
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: Lemma angular-certificate (all seven placed Moser-spindle vertices strictly in '
                       'the region 0<l<4, P<P\'), the eleven unit edges and non-3-colourability, and every number of the '
                       'paper\'s rational verification. NOT the headline (the plane is not 5-colourable), which rests on '
                       'the transfer theorem and the measurable/angular theory.',
            'value': {'isolation_digits': digits, 'lemma_failed': lemma_fail,
                      'margins': {g: {'l': '%.6f' % _approx(ex[g][0]), 'P': '%.6g' % _approx(ex[g][1]), "P'": '%.6g' % _approx(ex[g][2])} for g in NAMES}}}


def _approx(x):
    """float, for printed summaries only"""
    return float(x[0]) + float(x[1]) * 3 ** .5 + float(x[2]) * 11 ** .5 + float(x[3]) * 33 ** .5


def _absK(x):
    """sign of |x| - eps, exactly: returns 1 if |x| > eps, else 0 or -1"""
    eps = Fr('0.000005')
    return max(ksign(ksub(x, K(eps))), ksign(ksub(K(-eps), x)))


def forge():
    """each must NOT certify"""
    out = []
    src = Sources()
    tex = src.text(ANG)
    coord, fac, res, radii = parse_tables(tex)
    # 1. a printed bound changed: P'_- in the worked row uT, 12.9 -> 13.0
    c2 = dict(coord)
    c2['uT'] = c2['uT'][:3] + (Fr('13.0'),)
    out.append(("tab:angular-coordinates uT: P'_- printed 13.0 instead of 12.9", decide(tables=(c2, fac, res, radii))['verdict']))
    # 2. a residual numerator off by one
    r2 = dict(res)
    r2['A'] = (r2['A'][0] + 1, r2['A'][1])
    out.append(('residual table A: d_x off by one', decide(tables=(coord, fac, r2, radii))['verdict']))
    # 3. the placement moved: translation (-290+149i)/250 -> (-290+174i)/250 (one vertex leaves the region)
    r = decide(c=(Fr(-290, 250), Fr(174, 250)))
    bad = [x['check'] for x in r['checks'] if not x['pass'] and x['check'].startswith('Lemma')]
    out.append(('placement translation moved by +0.1i (lemma fails at: %s)' % ('; '.join(bad) or 'none'), r['verdict']))
    # 4. u moved to the rational unit (3+4i)/5: the spindle's eleventh edge is no longer unit
    r = decide(u=(K(Fr(3, 5)), K(Fr(4, 5))))
    out.append(('u = (3+4i)/5 instead of (5+i sqrt11)/6', r['verdict']))
    # 5. the eleventh edge T-uT dropped: the graph becomes 3-colourable
    E = parse_edges(src.text(FIG))
    r = decide(edges=E - {frozenset(('T', 'uT'))})
    out.append(('edge T-uT dropped (ten edges): %d proper 3-colourings' % len(three_colourings(E - {frozenset(('T', 'uT'))})), r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%d checks, %.1fs' % (len(res['checks']), time.time() - t))
    print(json.dumps(res['sources'], indent=1))
    t = time.time()
    for f in forge():
        print('FORGE', f)
    print('forges %.1fs' % (time.time() - t))
