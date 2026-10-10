"""F-199 — "A sharp entropy bound and the simplex inequality for isotropic constants" (openai/math family 101).

THE CLAIM (main.tex:45-47, the abstract; introduction.tex:39-44, Theorem intro:simplex): "We prove the strong
isotropic constant conjecture: in each dimension, simplices are the unique maximizers of the isotropic constant among
convex bodies", via the sharp entropy bound h(f) >= m + (1/2) log det Cov(f) for log-concave f (introduction.tex:75-80).
The proof is analytic except for one-variable scalar estimates, Lemma sc:bounds (scalar.tex:33-81) and Lemma
tr:scalar-basic (transport.tex:102-108), which Appendix cert:verification (certificate.tex:1-612) proves with "finite
certificates ... with no sampling assumption" (certificate.tex:5-7), and the rational comparisons of Section sc:scalar.

WHAT IS DECIDED HERE, exactly (int and Fraction only; no float in any decision; nothing from the release is run):
  A. The central piecewise-polynomial certificate on [-6,10] (certificate.tex:351-590), rebuilt from the eleven
     printed seed pairs (Table cert:centers, parsed from the file): the degree-14 recurrences (cert:recurrence); the
     22 differential residual bounds (cert:residuals); the 20 joining bounds; D > .09 by the quartic rule; the norms
     [k^] < 2 / 5.6; the printed endpoint values k^(-1) ~ .16237766 and P(1) ~ 10.098093234; the full auxiliary
     polynomials B, J, Y and their error bounds (cert:aux-errors); the degree-4 enclosure arithmetic
     (cert:product-error) and the Bernstein lower-bound rule (cert:Bernstein) applied to every member of the four
     groups G1-G4 in every row, with the bins of Table sc:interval-table, the (z, chi) triples, and m_0 of Table
     tr:bins, all parsed from the files; every one of the 44 entries of Table cert:group-bounds compared against the
     recomputed group minimum; the endpoint claims q(-1) > .287, q(-2) < .056, q(-3) < .005, q(4) > 4.
  B. The two analytic anchors as rational arithmetic: the alternating Mills sums S_11, S_12 at r = 10 and S_13, S_14
     at r = 6 (cert:Mills), phi(6) < 7e-9 from sqrt(2 pi) > 12/5 and the 60-term partial sum of e^18, and both
     anchor claims. The error budgets (cert:global-errors): the paper's displayed sums 8e-9 < e_q and
     7.114e-7 < e_k, and the same budgets re-summed from OUR recomputed residuals, joins and anchors.
  C. Every transcendental the certificate uses, rigorously enclosed by rationals: pi (Gauss's three-arctangent formula
     with alternating-series bounds, cross-checked against Machin's), exp (Taylor partial sum + geometric tail bound),
     log (atanh series + geometric tail, cross-checked by exp). With them: theta_0 = log(200 pi)/2 in
     (3.221523626198, 3.221523626199); the four claims log(q(-1)/q(-2)) > 1.62, ... > 4, ... > 4, ... > 6.5;
     log 2 < .694; the tangent of F_0 at S = .28 (intercept < .16, slope < .52).
  D. The rational inequalities of the two tail arguments (each one named in a check), at the extreme point the paper
     names (r = 6, resp. r = 10 / theta in [3.221, 3.222]): the error chain |g_j - I_j| <= .01 u j!/r^(j+1) (constants 4, 6, 9 re-derived), the
     consequences for k, b, l, l', p, h_0, the ratio bounds, K_0, J_0, D, L, z, h_*, chi, the N-matrix bounds and the
     determinants .023232 and .00175; on the right, the derivative bounds 1, 6, 90, 2520 and |G''| < 23, |G'''| < 435,
     the Taylor data F'(0) = -1, G(0) = -1/2, G'(0) = 5/2 (formal power series), the linear-in-u errors and the
     remainder constants 5g+3, 30g+33, 210g+321+8c_0u (operator algebra in d/dtheta and U = u d/du, exact), the
     three-row uniformity table (.024, .102, .624), and all of (cert:right-consequences). Each tail's bounds are
     checked to lie inside the row of Table sc:interval-table / sc:derivative-table they are said to prove.
  E. Section sc:scalar's finite comparisons: the 36-entry substitution table (sc:substitution-table) by enumerating
     every corner of each multi-affine expression; the F-bounds (sc:F-simple), (sc:F-negative); the threshold
     comparisons for every endpoint case, including Theta_0(6.5) > .39, the two negative discriminants and
     Theta_0 >= .25 + .0026 delta^2 for delta >= 4; the absorption constants (.111, .689, .02582, .027, .88, 69/500);
     the p-minorant identities; and (sc:F0-sqrt): x^2 J' = P exactly, Descartes' count, the sign pattern, |P'| < 4.

WHAT IS NOT DECIDED (it rests on analysis, not on a finite object): everything outside the scalar lemmas (transport,
the matrix argument, approximation, rigidity, the geometric reduction — i.e. the headline); and inside them, the
analytic links that turn the finite certificate into statements about q, k, b, l on the real line: that ODE residuals
plus anchors plus joins bound the uniform errors (stability of q' = q(q-a) backward and of k' = 1 - kd forward); the
soundness of the Bernstein rule and of the enclosure arithmetic (standard; implemented here as the paper states it);
the Mills alternating bounds and 0 <= 1 - (1-P)(-log(1-P))/P <= 2P (one-line series facts, quoted in comments); the
integral and Taylor bounds for F, G and R_0 on the right tail and for I_j on the left; every "decreasing in r" /
"maximum at the endpoint" step that extends a check at r = 6 or r = 10 to the whole tail (the finite sign conditions
behind several of them are checked, the calculus is not); the concavity of F_0 and the limits of J(x).
"""
import os
import re
import sys
import time
from fractions import Fraction
from math import comb, factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

DIR = 'preprints/A-sharp-entropy-bound-and-the-simplex-inequality-for-isotropic-constants-October-5-2026/build/manuscript/'
CERT, SCALAR, TRANSPORT, MATRIX, MAIN = (DIR + f for f in ('certificate.tex', 'scalar.tex', 'transport.tex', 'matrix.tex', 'main.tex'))
Fr = Fraction
ROWNAMES = ['O', 'P_1', 'R_1', 'U_1', 'V_1', 'T_1']


def X(s):
    """a terminating decimal of the paper, as the exact rational it denotes (certificate.tex:4-5, scalar.tex:10-11)"""
    return Fraction(s)


def squash(t):
    return re.sub(r'\s+', '', t)


# ---------------------------------------------------------------- rigorous transcendentals (rational bounds)

def exp_bounds(x, N=80):
    """e^x for rational x: [S_N, S_N + tail] with tail <= x^(N+1)/(N+1)! / (1 - x/(N+2)) (x >= 0, N + 2 > x)"""
    x = Fr(x)
    if x < 0:
        lo, hi = exp_bounds(-x, N)
        return 1 / hi, 1 / lo
    assert N + 2 > x
    t, s = Fr(1), Fr(1)
    for n in range(1, N + 1):
        t = t * x / n
        s += t
    tail = t * x / (N + 1) / (1 - x / (N + 2))
    return s, s + tail


def log_bounds(y, N=60):
    """log y = 2 sum_{j<=N} z^(2j+1)/(2j+1) + R, z = (y-1)/(y+1), |R| <= 2|z|^(2N+3) / ((2N+3)(1-z^2)) (geometric tail)"""
    y = Fr(y)
    z = (y - 1) / (y + 1)
    s, zp = Fr(0), z
    for j in range(N + 1):
        s += zp / (2 * j + 1)
        zp *= z * z
    s *= 2
    R = 2 * abs(zp) / ((2 * N + 3) * (1 - z * z))
    return s - R, s + R


def arctan_inv(n, terms):
    """arctan(1/n) between consecutive partial sums of the alternating series (terms decrease for n >= 1)"""
    s, lo, hi = Fr(0), None, None
    for i in range(terms):
        s += Fr((-1) ** i, (2 * i + 1) * n ** (2 * i + 1))
        if i % 2:
            lo = s
        else:
            hi = s
    return lo, hi


def outward(lo, hi, bits=256):
    """round an enclosure outward to the dyadic grid 2^-bits (keeps Fraction sizes small; still a valid enclosure)"""
    sc = 2 ** bits
    return Fr((lo.numerator * sc) // lo.denominator, sc), Fr(-((-hi.numerator * sc) // hi.denominator), sc)


def pi_bounds(terms=30):
    """Gauss: pi = 48 atan(1/18) + 32 atan(1/57) - 20 atan(1/239)"""
    a, b, c = arctan_inv(18, terms), arctan_inv(57, terms), arctan_inv(239, terms)
    return outward(48 * a[0] + 32 * b[0] - 20 * c[1], 48 * a[1] + 32 * b[1] - 20 * c[0])


def pi_bounds_machin(terms=40):
    a, b = arctan_inv(5, terms), arctan_inv(239, terms)
    return 16 * a[0] - 4 * b[1], 16 * a[1] - 4 * b[0]


def log_greater(y, c):
    """proves log y > c by y > (upper bound of e^c)"""
    return Fr(y) > exp_bounds(c)[1]


# ---------------------------------------------------------------- polynomials in x (dense, exact)

def pmul(A, B):
    out = [Fr(0)] * (len(A) + len(B) - 1)
    for i, a in enumerate(A):
        if a:
            for j, b in enumerate(B):
                out[i + j] += a * b
    return out


def padd(*Ps):
    n = max(len(P) for P in Ps)
    return [sum((P[i] for P in Ps if i < len(P)), Fr(0)) for i in range(n)]


def pscale(P, c):
    return [c * x for x in P]


def norm1(P):
    """[A]: the sum of the absolute values of the coefficients (certificate.tex:392-393)"""
    return sum((abs(x) for x in P), Fr(0))


def peval(P, x):
    s = Fr(0)
    for c in reversed(P):
        s = s * x + c
    return s


class Q:
    """an enclosure (A, e): the function differs from the quartic A(x) by at most e on [-1,1] (certificate.tex:479-494).
    Construction truncates to degree 4 and charges the discarded |coefficients| to e; a product uses
    [A]e_B + [B]e_A + e_A e_B; scalar multiplication scales e by |scalar|."""
    __slots__ = ('c', 'e')

    def __init__(self, c, e=0):
        c = [Fr(x) for x in c]
        e = Fr(e)
        if len(c) > 5:
            e += norm1(c[5:])
            c = c[:5]
        self.c = c + [Fr(0)] * (5 - len(c))
        self.e = e

    def __add__(self, o):
        o = o if isinstance(o, Q) else Q([o])
        return Q([x + y for x, y in zip(self.c, o.c)], self.e + o.e)

    __radd__ = __add__

    def __neg__(self):
        return Q([-x for x in self.c], self.e)

    def __sub__(self, o):
        return self + (-(o if isinstance(o, Q) else Q([o])))

    def __rsub__(self, o):
        return Q([o]) - self

    def __mul__(self, o):
        if not isinstance(o, Q):
            o = Fr(o)
            return Q([x * o for x in self.c], self.e * abs(o))
        return Q(pmul(self.c, o.c), norm1(self.c) * o.e + norm1(o.c) * self.e + self.e * o.e)

    __rmul__ = __mul__


def bernstein_lower(A):
    """(cert:Bernstein): min over sigma = +-1, 0 <= i <= 4 of sum_{j<=i} C(i,j)/C(4,j) sigma^j A_j, minus e"""
    best = None
    for sg in (1, -1):
        for i in range(5):
            v = sum(Fr(comb(i, j), comb(4, j)) * sg ** j * A.c[j] for j in range(i + 1))
            best = v if best is None else min(best, v)
    return best - A.e


# ---------------------------------------------------------------- the paper's constants

def constants():
    al = Fr(3, 40)
    s = 1 / (1 - al)
    be, c = Fr(7, 25), Fr(3, 2)
    ga = c / 2
    eps, ka = Fr(3, 20), Fr(49, 100)
    Ds = 1 / (4 * (1 - eps))
    As = s + 1 + s / 8
    eta = s * be + (1 + s / 8) * ga
    nu = s * be ** 2 + (9 * s / 8) * ga ** 2
    return dict(al=al, s=s, be=be, c=c, ga=ga, eps=eps, ka=ka, Ds=Ds, As=As, eta=eta, nu=nu)


# ---------------------------------------------------------------- parsing the published tables

def parse(src):
    cert, scal, trans, mat = src.text(CERT), src.text(SCALAR), src.text(TRANSPORT), src.text(MATRIX)
    num = r'(-?[\d.]+)'
    seg = cert[cert.index(r'\label{cert:centers}'):]
    seg = seg[:seg.index(r'\end{tabular}')]
    centers = [tuple(m) for m in re.findall(r'^\$%s\$&\$%s\$&\$%s\$&\$%s\$\\\\' % (num, num, num, num), seg, re.M)]
    seg = cert[cert.index(r'\label{cert:group-bounds}'):]
    seg = seg[:seg.index(r'\end{tabular}')]
    groups = [tuple(m) for m in re.findall(r'^\$%s\$&\$%s\$&\$%s\$&\$%s\$&\$%s\$\\\\' % ((num,) * 5), seg, re.M)]
    seg = scal[scal.index(r'\label{sc:interval-table}'):]
    seg = seg[:seg.index(r'\end{array}')]
    bins = {}
    for m in re.finditer(r'^\s*(O|P_1|R_1|U_1|V_1|T_1)\s*&\[([-\d.]+),([-\d.]+)\]&([\d.]+)&([^&]+)&\[([\d.]+),([\d.]+)\]&([\d.]+)&([\d.]+)', seg, re.M):
        name, b0, b1, L, D, K0, K1, J, l1 = m.groups()
        Dmax = None if 'a^2' in D else X(D)
        Dcoef = X(D.split('(')[0]) if 'a^2' in D else None
        bins[name] = dict(bmin=X(b0), bmax=X(b1), Lmax=X(L), Dmax=Dmax, Dcoef=Dcoef, Kmin=X(K0), Kmax=X(K1), Jmax=X(J), l1=X(l1))
    seg = scal[scal.index(r'\label{sc:derivative-table}'):]
    seg = seg[:seg.index(r'\end{array}')]
    deriv = {}
    for m in re.finditer(r'a\\(le|ge)-1&\[([-\d.]+),([-\d.]+)\]&\[([\d.]+),([\d.]+)\]&([\d.]+)', seg):
        side, z0, z1, h0, h1, chi = m.groups()
        deriv[side] = dict(zmin=X(z0), zmax=X(z1), hmin=X(h0), hmax=X(h1), chi=X(chi))
    seg = scal[scal.index(r'\label{sc:substitution-table}'):]
    seg = seg[:seg.index(r'\end{array}')]
    subst = {}
    for m in re.finditer(r'^\s*(O|P_1|R_1|U_1|V_1|T_1)&\(([\d.]+),([\d.]+),([\d.]+)\)&\(([\d.]+),([\d.]+),([\d.]+)\)', seg, re.M):
        g = m.groups()
        subst[g[0]] = {'le': tuple(X(v) for v in g[1:4]), 'ge': tuple(X(v) for v in g[4:7])}
    m = re.search(r'm_0\(a\)&([^\\\n]+)', trans)
    m0 = dict(zip(ROWNAMES, [X(v) for v in m.group(1).split('&')]))
    m = re.search(r'a&\(-\\infty,-3\)&\[-3,-2\)&\[-2,-1\)&\[-1,\\tfrac12\)&\[\\tfrac12,4\)&\[4,\\infty\)', trans)
    binedges = m is not None
    return dict(cert=cert, scal=scal, trans=trans, mat=mat, centers=centers, groups=groups, bins=bins, deriv=deriv,
                subst=subst, m0=m0, binedges=binedges)


def bin_of_row(w, r):
    """Table tr:bins: O = (-inf,-3), P_1 = [-3,-2), R_1 = [-2,-1), U_1 = [-1,1/2), V_1 = [1/2,4), T_1 = [4,inf)"""
    lo, hi = w - r, w + r
    edges = [(None, Fr(-3), 'O'), (Fr(-3), Fr(-2), 'P_1'), (Fr(-2), Fr(-1), 'R_1'), (Fr(-1), Fr(1, 2), 'U_1'),
             (Fr(1, 2), Fr(4), 'V_1'), (Fr(4), None, 'T_1')]
    for a, b, name in edges:
        if (a is None or lo >= a) and (b is None or hi <= b):
            return name
    return None


# ---------------------------------------------------------------- A. the central certificate

def build_row(w, r, P0, k0, N=14):
    """(cert:recurrence): D = P - a, P_{i+1} = r/(i+1) (PD)_i, k_{i+1} = r/(i+1) (1 - kD)_i, a = w + r x"""
    a = [w, r]
    P, K = [P0], [k0]
    for i in range(N):
        def Dc(j):
            return P[j] - (a[j] if j < 2 else 0)
        P.append(r / (i + 1) * sum(P[j] * Dc(i - j) for j in range(i + 1)))
        K.append(r / (i + 1) * ((1 if i == 0 else 0) - sum(K[j] * Dc(i - j) for j in range(i + 1))))
    D = padd(P, [-w, -r])
    return P, K, D, a


def central(centers, groups, bins, deriv, m0, C, eq, ek):
    """returns (row records, per-row data) for the eleven rows"""
    rows = []
    for (ws, rs, ps, ks) in centers:
        w, r, P0, k0 = X(ws), X(rs), X(ps), X(ks)
        P, K, D, a = build_row(w, r, P0, k0)
        PD, KD = pmul(P, D), pmul(K, D)
        res_P, res_K = r * norm1(PD[14:]), r * norm1(KD[14:])
        Bf = padd([Fr(1)], pscale(KD, -1))                       # B = 1 - k D
        Jf = padd(K, pscale(P, -1), pmul(a, Bf))                 # J = k - P + aB
        Yf = padd(pscale(Bf, 2), pscale(PD, -1), pmul(a, Jf))    # Y = 2B - PD + aJ
        na, nk, nD, nP = abs(w) + r, norm1(K), norm1(D), norm1(P)
        Eb = nk * eq + ek * (eq + nD)
        El = eq + ek + na * Eb
        Elp = 2 * Eb + (nP + nD + eq) * eq + na * El
        rows.append(dict(w=w, r=r, P=P, K=K, D=D, a=a, res_P=res_P, res_K=res_K, Bf=Bf, Jf=Jf, Yf=Yf,
                         nk=nk, Eb=Eb, El=El, Elp=Elp, Dlow=bernstein_lower(Q(D))))
    for row in rows:
        w, r = row['w'], row['r']
        name = bin_of_row(w, r)
        bn = bins[name]
        side = 'le' if w + r <= -1 else 'ge'
        dv = deriv[side]
        q, k, d = Q(row['P'], eq), Q(row['K'], ek), Q(row['D'], eq)
        b, l, lp = Q(row['Bf'], row['Eb']), Q(row['Jf'], row['El']), Q(row['Yf'], row['Elp'])
        aa = Q(row['a'])
        al, Ds, As, eta, nu, c = C['al'], C['Ds'], C['As'], C['eta'], C['nu'], C['c']
        ia = 1 / al
        p = b + k * l - (l * l) * ia
        E = p + b * (X('.75') - b) - (l * l) * ia
        H = l + (b * 3) * l + k * lp
        f1 = b * c
        h = X('.43') - bn['l1'] - (b * b) * As + b * eta - nu / 4 - (l * l) * ia
        v = X('1.97') - nu
        o = X('.13') - nu / 2 + b * eta
        G1 = [b - bn['bmin'], bn['bmax'] - b, l, al * bn['Lmax'] - l]
        if w < 0:
            G1.append(p * (7 + aa * aa) - 1)
        elif w < 4:
            G1.append(p - X('.25'))
        else:
            G1.append(p - X('.46'))
        h0 = k * (b - X('.5')) - ((b - X('.28')) * 2) * l * ia
        G1.append(p * X('.67') ** 2 - h0 * h0)
        mm = m0[name]
        G2 = [lp - l * dv['zmin'], l * dv['zmax'] - lp, H - l * X('.8'), l * X('1.77') - H, d * dv['chi'] - l,
              ((1 - q * d) * 2) * (1 - b * b) - ((b * 2) * l) * d - ((d * d) * mm) * (1 - b * b)]
        G3 = ([] if bn['Dmax'] is None else [p - Ds / bn['Dmax']]) + \
             [E * Ds - p * bn['Kmin'], p * bn['Kmax'] - E * Ds, p * bn['Jmax'] - f1 * Ds]
        G4 = [h * p - (E * E) * Ds,
              p * (h * v - o * o) - ((E * E) * v - ((E * 2) * o) * f1 + (h * f1) * f1) * Ds]
        row['bin'], row['side'] = name, side
        row['group_min'] = [min(bernstein_lower(m) for m in G) for G in (G1, G2, G3, G4)]
        row['members'] = [len(G) for G in (G1, G2, G3, G4)]
    return rows


# ---------------------------------------------------------------- B. anchors

def mills(r, N):
    """S_N(r) = sum_{i<=N} (-1)^i (2i-1)!! / r^(2i+1)   (cert:Mills)"""
    s, df = Fr(0), 1
    for i in range(N + 1):
        if i:
            df *= 2 * i - 1
        s += Fr((-1) ** i * df) / Fr(r) ** (2 * i + 1)
    return s


# ---------------------------------------------------------------- operator algebra in (d/dtheta, U)

def opmul(A, B):
    out = {}
    for (i, j), a in A.items():
        for (k, l), b in B.items():
            out[(i + k, j + l)] = out.get((i + k, j + l), 0) + a * b
    return {k: v for k, v in out.items() if v}


def apply_lin(op_const, C):
    """(op_const - D) C for C a polynomial in (theta, u) {(i,j): coef} meaning theta^i u^j; D = d/dtheta - 2 u d/du"""
    out = {}
    for (i, j), cf in C.items():
        out[(i, j)] = out.get((i, j), 0) + op_const * cf
        if i:
            out[(i - 1, j)] = out.get((i - 1, j), 0) - i * cf
        if j:
            out[(i, j)] = out.get((i, j), 0) + 2 * j * cf
    return {k: v for k, v in out.items() if v}


# ---------------------------------------------------------------- the decision

def decide(src=None, centers_override=None, groups_override=None, subst_override=None, det_left=None):
    t0 = time.time()
    src = src or Sources()
    checks = []
    T = parse(src)
    cert, scal = squash(T['cert']), squash(T['scal'])
    centers = centers_override or T['centers']
    groups = groups_override or T['groups']
    subst = subst_override or T['subst']
    bins, deriv, m0 = T['bins'], T['deriv'], T['m0']
    C = constants()
    al, s, Ds, As, eta, nu, c = C['al'], C['s'], C['Ds'], C['As'], C['eta'], C['nu'], C['c']

    def cited(snippet):
        return squash(snippet) in cert or squash(snippet) in scal

    # --- the published object, as parsed
    check(checks, 'tables parsed: 11 seed rows, 11 group-bound rows, 6 bins, 2 derivative rows, 6 substitution rows, m_0',
          len(centers) == 11 and len(groups) == 11 and len(bins) == 6 and len(deriv) == 2 and len(subst) == 6 and len(m0) == 6
          and T['binedges'], 'certificate.tex:378-388, 561-571; scalar.tex:46-51, 76-77, 329-334; transport.tex:93-98')
    mat = squash(T['mat'])
    check(checks, 'constants alpha = 3/40, s = 1/(1-alpha), beta = 7/25, c = 3/2, gamma = c/2, epsilon = 3/20, kappa = 49/100 as printed',
          all(squash(x) in mat for x in (r'\alpha=\frac{3}{40},\qquad s=\frac1{1-\alpha}', r'\beta=\frac7{25},\qquad c=\frac32,\qquad \gamma=\frac c2',
                                          r'\epsilon=\frac3{20},\qquad\kappa=\frac{49}{100}')), 'matrix.tex:178, 233, 419')
    rowsW = [X(cw[0]) for cw in centers]
    rowsR = [X(cw[1]) for cw in centers]
    cover = rowsW[0] - rowsR[0] == -6 and rowsW[-1] + rowsR[-1] == 10 and all(
        rowsW[i] + rowsR[i] == rowsW[i + 1] - rowsR[i + 1] for i in range(10))
    check(checks, 'the eleven rows a = w + r x are consecutive and cover [-6,10]', cover)
    check(checks, 'every row lies inside one bin of Table tr:bins', all(bin_of_row(w, r) for w, r in zip(rowsW, rowsR)),
          ', '.join('%s:%s' % (w, bin_of_row(w, r)) for w, r in zip(rowsW, rowsR)))

    # --- B. anchors and phi(6)
    S18 = sum(Fr(18 ** i, factorial(i)) for i in range(60))
    phi6_up = Fr(5, 12) / S18
    pi_lo, pi_hi = pi_bounds()
    mpi_lo, mpi_hi = pi_bounds_machin()
    check(checks, 'pi enclosed two ways (Gauss three-arctangent and Machin, alternating bounds) and the enclosures intersect',
          pi_lo < pi_hi and mpi_lo < mpi_hi and max(pi_lo, mpi_lo) < min(pi_hi, mpi_hi) and pi_hi - pi_lo < Fr(1, 10 ** 30),
          'width %.1e' % float(pi_hi - pi_lo))
    check(checks, 'sqrt(2 pi) > 12/5 (2 pi > 144/25) and (5/12) / sum_{i<60} 18^i/i! < 7e-9, so phi(6) < 7e-9',
          2 * pi_lo > Fr(144, 25) and phi6_up < X('7e-9'), 'bound %.4e' % float(phi6_up))
    phi6 = X('7e-9')
    S11, S12 = mills(10, 11), mills(10, 12)
    q10 = (1 / S12, 1 / S11)
    check(checks, '|q(10) - 10.098093234| < 4e-10 from 1/S_12(10) <= q(10) <= 1/S_11(10)',
          S11 < S12 and all(abs(v - X('10.098093234')) < X('4e-10') for v in q10) and cited(r'|q(10)-10.098093234|<4\cdot10^{-10}'),
          '[%.12f, %.12f]' % tuple(float(v) for v in q10))
    S13, S14 = mills(6, 13), mills(6, 14)
    k6 = (S13 - 2 * phi6 / 36, S14 + 2 * phi6 / 36)
    check(checks, '|k(-6) - .16237766| < 4e-8 from S_13(6) <= I_0(6) <= S_14(6) and |k(-6) - I_0(6)| <= 2 phi(6)/36',
          S13 < S14 and all(abs(v - X('.16237766')) < X('4e-8') for v in k6) and cited(r'|k(-6)-.16237766|<4\cdot10^{-8}'),
          '[%.12f, %.12f]' % tuple(float(v) for v in k6))

    # --- A. the central certificate
    eq, ek = X('1e-8'), X('8e-7')
    rows = central(centers, groups, bins, deriv, m0, C, eq, ek)
    worst = {}
    for i, row in enumerate(rows):
        lim = X('2e-9') if row['w'] == X('-3.75') else X('7e-11')
        worst.setdefault('P', []).append(row['res_P'] < lim)
        worst.setdefault('K', []).append(row['res_K'] < X('2e-10'))
    check(checks, '11 residual bounds r[(PD)_{deg>=14}] < 2e-9 (w = -3.75), 7e-11 (otherwise)', all(worst['P']),
          'max %.3e' % max(float(r_['res_P']) for r_ in rows))
    check(checks, '11 residual bounds r[(kD)_{deg>=14}] < 2e-10', all(worst['K']), 'max %.3e' % max(float(r_['res_K']) for r_ in rows))
    jP = [abs(peval(rows[i]['P'], 1) - peval(rows[i + 1]['P'], -1)) for i in range(10)]
    jK = [abs(peval(rows[i]['K'], 1) - peval(rows[i + 1]['K'], -1)) for i in range(10)]
    check(checks, '20 joining bounds: P and k^ at each common endpoint differ by < 2e-10', all(v < X('2e-10') for v in jP + jK),
          'max %.3e (P), %.3e (k)' % (float(max(jP)), float(max(jK))))
    check(checks, 'D > .09 on every row by the quartic Bernstein rule (discarded coefficients charged)',
          all(r_['Dlow'] > X('.09') for r_ in rows), 'min %.5f' % min(float(r_['Dlow']) for r_ in rows))
    check(checks, '[k^] < 2 on rows w <= .25 and < 5.6 on rows w > .25',
          all(r_['nk'] < (2 if r_['w'] <= X('.25') else X('5.6')) for r_ in rows))
    kL, PR = peval(rows[0]['K'], -1), peval(rows[-1]['P'], 1)
    check(checks, 'first-row k^(-1) within 3e-9 of .16237766; last-row P(1) within 2e-10 of 10.098093234',
          abs(kL - X('.16237766')) < X('3e-9') and abs(PR - X('10.098093234')) < X('2e-10'),
          '%.12f, %.12f' % (float(kL), float(PR)))
    # the error budgets: the paper's displayed sums, and ours from the recomputed quantities
    check(checks, 'e_q budget as displayed: 6e-10 + 2(2e-9 + 10*7e-11) + 10*2e-10 = 8e-9 < 1e-8',
          X('6e-10') + 2 * (X('2e-9') + 10 * X('7e-11')) + 10 * X('2e-10') == X('8e-9') < eq and cited(r'=8\cdot10^{-9}<e_q'))
    check(checks, 'e_k budget as displayed: 4.3e-8 + 22e-10*2 + 20e-10 + 1e-8(6.5*2 + 9.5*5.6) = 7.114e-7 < 8e-7',
          X('4.3e-8') + X('22e-10') * 2 + X('20e-10') + X('1e-8') * (X('6.5') * 2 + X('9.5') * X('5.6')) == X('7.114e-7') < ek
          and cited(r'=7.114\cdot10^{-7}<e_k'))
    lenL = sum(2 * r_['r'] for r_ in rows if r_['w'] <= X('.25'))
    lenR = sum(2 * r_['r'] for r_ in rows if r_['w'] > X('.25'))
    anchor_q = max(abs(v - PR) for v in q10)
    budget_q = anchor_q + sum(2 * r_['res_P'] for r_ in rows) + sum(jP)
    anchor_k = max(abs(v - kL) for v in k6)
    budget_k = anchor_k + sum(2 * r_['res_K'] for r_ in rows) + sum(jK) + sum(2 * r_['r'] * r_['nk'] for r_ in rows) * eq
    check(checks, 'the same budgets re-summed from our recomputed anchors, residuals, joins and row norms: < e_q and < e_k; lengths 6.5 and 9.5',
          budget_q < eq and budget_k < ek and lenL == X('6.5') and lenR == X('9.5'),
          'q: %.3e, k: %.3e' % (float(budget_q), float(budget_k)))
    # the 44 group bounds
    bad, detail = [], []
    for row, g in zip(rows, groups):
        if X(g[0]) != row['w']:
            bad.append('row order')
        for j in range(4):
            claimed = X(g[j + 1]) / 1000
            got = row['group_min'][j]
            if not (got >= claimed and got > 0):
                bad.append('w=%s G%d: %.4f < %s' % (g[0], j + 1, float(got * 1000), g[j + 1]))
        detail.append('%s:%s' % (g[0], '/'.join('%.2f' % float(v * 1000) for v in row['group_min'])))
    check(checks, 'all 44 entries of Table cert:group-bounds: recomputed group minimum >= the printed lower bound, and > 0',
          not bad, '; '.join(bad) if bad else ' '.join(detail) + ' (units 1e-3)')
    nmem = sum(sum(r_['members']) for r_ in rows)
    check(checks, 'group membership as listed: G1 6, G2 6, G3 4 (3 in bin O), G4 2 per row', all(
        r_['members'] == [6, 6, 3 if r_['bin'] == 'O' else 4, 2] for r_ in rows), '%d polynomials bounded' % nmem)
    # endpoint enclosures
    def Pat(a):
        vals = []
        for r_ in rows:
            x = (a - r_['w']) / r_['r']
            if -1 <= x <= 1:
                vals.append(peval(r_['P'], x))
        return vals
    ep = {a: Pat(Fr(a)) for a in (-1, -2, -3, 4)}
    check(checks, 'q(-1) > .287, q(-2) < .056, q(-3) < .005, q(4) > 4 from P -+ e_q at the endpoint (both adjacent rows)',
          all(v - eq > X('.287') for v in ep[-1]) and all(v + eq < X('.056') for v in ep[-2]) and
          all(v + eq < X('.005') for v in ep[-3]) and all(v - eq > 4 for v in ep[4]) and all(len(v) == 2 for v in ep.values()),
          ', '.join('q(%d)~%.6f' % (a, float(v[0])) for a, v in ep.items()))
    check(checks, 'log(q(-1)/q(-2)) > 1.62, log(q(-1)/q(-3)) > 4, log(q(4)/q(-2)) > 4, log(q(4)/q(-3)) > 6.5 (exp upper bounds)',
          log_greater(X('.287') / X('.056'), X('1.62')) and log_greater(X('.287') / X('.005'), 4) and
          log_greater(4 / X('.056'), 4) and log_greater(4 / X('.005'), X('6.5')))

    # --- C. theta_0
    th_lo, th_hi = X('3.221523626198'), X('3.221523626199')
    ok_th = 200 * pi_lo > exp_bounds(2 * th_lo)[1] and 200 * pi_hi < exp_bounds(2 * th_hi)[0]
    l2 = log_bounds(2, 80)
    lg = log_bounds(200 * pi_lo / 512, 80)[0] + 9 * l2[0], log_bounds(200 * pi_hi / 512, 80)[1] + 9 * l2[1]
    check(checks, '3.221523626198 < theta_0 = log(200 pi)/2 < 3.221523626199 (exp bounds against pi bounds; atanh series agrees)',
          ok_th and th_lo < lg[0] / 2 and lg[1] / 2 < th_hi and cited(r'3.221523626198<\theta_0<3.221523626199'),
          '[%.15f, %.15f]' % (float(lg[0] / 2), float(lg[1] / 2)))
    t0_lo, t0_hi = X('3.221'), X('3.222')

    # --- D1. the negative tail (r = -a >= 6, u = 1/r^2 <= 1/36)
    r6, u6 = Fr(6), Fr(1, 36)
    zeta = 1 + u6 / 100
    check(checks, 'q <= 1.01 phi(r): 1/(1 - phi(6)/6) <= 1.01', 1 / (1 - phi6 / 6) <= X('1.01'))
    # |b-I1| <= 2P + kq <= phi/r (2 + 1.01 + 2.02 phi/r); |l-I2| <= phi (2/r^2 + 1.01 + 4); |l'-I3| <= phi(8/r + 1.0201 phi + 7.01 r)
    check(checks, 'the error constants 4, 6, 9 re-derived from identities (cert:identities) at r >= 6',
          2 + X('1.01') + X('2.02') * phi6 / 6 <= 4 and 2 / r6 ** 2 + X('1.01') + 4 <= 6 and 8 / r6 + X('1.0201') * phi6 + X('7.01') * r6 <= 9 * r6,
          'b: 2P + kq; l = k - q - rb; l\' = 2b - q(q+r) - rl')
    errs = [(2 * phi6 / r6 ** 2, 0), (4 * phi6 / r6, 1), (6 * phi6, 2), (9 * r6 * phi6, 3)]
    check(checks, '(cert:left-errors) at r = 6: |g_j - I_j| <= .01 u j!/r^(j+1), j = 0..3; r^N phi(r) decreasing for N <= 7 as 36 > 7',
          all(e <= u6 / 100 * factorial(j) / r6 ** (j + 1) for e, j in errs))
    check(checks, 'u zeta < .028 at u = 1/36; l\' >= 6r^-4(1 - 10.01u) > 0',
          u6 * zeta < X('.028') and 1 - X('10.01') * u6 > 0, 'u zeta = %.6f' % float(u6 * zeta))
    check(checks, 'p >= u(1-4.54u) >= 1/(7+r^2): 3.01 + 4 zeta^2 u/alpha < 4.54 and (1-4.54u)(1+7u) >= 1 at u = 1/36 (the latter = u(2.46 - 31.78u))',
          X('3.01') + 4 * zeta ** 2 * u6 / al < X('4.54') and (1 - X('4.54') * u6) * (1 + 7 * u6) >= 1)
    h0_k = zeta / 2
    h0_l = 2 * X('.28') * 2 * zeta / (al * r6 ** 2)
    check(checks, 'h_0 summands at most .501/r and .43/r; .501^2 < .67^2 (1 - 4.54u)',
          h0_k <= X('.501') and h0_l <= X('.43') and X('.501') ** 2 < X('.67') ** 2 * (1 - X('4.54') * u6),
          '%.5f, %.5f' % (float(h0_k), float(h0_l)))
    klb = 2 * u6 * zeta ** 2 / (1 - X('3.01') * u6)
    l2b = 4 * u6 ** 2 * zeta ** 2 / (al * (1 - X('3.01') * u6))
    check(checks, '.93 < b/p < 1.05 from (cert:left-ratios) at u = 1/36', 1 / (1 + klb) > X('.93') and 1 / (1 - l2b) < X('1.05'),
          'b/p in [%.5f, %.5f]' % (float(1 / (1 + klb)), float(1 / (1 - l2b))))
    Lleft = 2 * zeta / (al * r6 ** 3)
    K0lo = Ds * (1 + (X('.75') - X('.028')) * X('.93') - l2b * X('1.05'))
    K0hi = Ds * (1 + X('.75') * X('1.05'))
    J0hi = Ds * c * X('1.05')
    check(checks, 'D_* < .295; L <= 2 zeta/(alpha r^3) < .60; .37 < K_0 < .56 (corners of b, b/p, l^2/(alpha b)); J_0 < .72',
          Ds < X('.295') and Lleft < X('.60') and K0lo > X('.37') and K0hi < X('.56') and J0hi < X('.72'),
          'K_0 in [%.4f, %.4f], J_0 <= %.4f' % (float(K0lo), float(K0hi), float(J0hi)))
    zl = 3 * zeta / (r6 * (1 - X('6.01') * u6))
    hs = 1 + 3 * X('.028') + zeta * X('.61') / 6
    chil = 2 * zeta * u6 ** 2
    check(checks, 'z <= 3 zeta/(r(1-6.01u)) < .61; h_* < 1 + 3(.028) + zeta(.61)/6 < 1.77; chi <= 2 zeta u^2 < .070',
          zl < X('.61') and hs < X('1.77') and chil < X('.070'), 'z <= %.5f, h_* < %.5f' % (float(zl), float(hs)))
    Eleft = X('.028') * (X('1.75') + klb)
    check(checks, 'E < .05072 (E <= b(1.75 + kl/b), b < .028)', Eleft < X('.05072'), '%.6f' % float(Eleft))
    N22 = nu + X('.72') * c * X('.028')
    # N12 = nu/2 - eta b + K0 c b, multi-affine in (b, K0): corners b in {0,.028}, K0 in {.37,.56}
    N12s = [nu / 2 - eta * b_ + K_ * c * b_ for b_ in (0, X('.028')) for K_ in (X('.37'), X('.56'))]
    l2a = 4 * zeta ** 2 * u6 ** 3 / al
    N11 = max(As * b_ ** 2 - eta * b_ for b_ in (0, X('.028'))) + nu / 4 + l2a + X('.56') * X('.05072')
    check(checks, 'N_11 < .224, N_22 < .802, .34 < N_12 < .386 (cert:N with b < .028, K_0 < .56, J_0 < .72)',
          N11 < X('.224') and N22 < X('.802') and min(N12s) > X('.34') and max(N12s) < X('.386'),
          'N11 %.5f N22 %.5f N12 [%.5f, %.5f]' % (float(N11), float(N22), float(min(N12s)), float(max(N12s))))
    detL = (X('.43') - X('.224') - X('.13')) * (X('2.72') - X('.802') - X('.75')) - (X('.13') - X('.386')) ** 2
    claimedL = det_left if det_left is not None else X('.023232')
    check(checks, 'left-tail determinant (.43-.224-.13)(2.72-.802-.75) - (.13-.386)^2 = .023232 > 0, leading minor > 0',
          detL == claimedL and detL > 0 and X('.43') - X('.224') - X('.13') > 0 and cited(r'=.023232>0'), str(detL))
    bO, dO = bins['O'], deriv['le']
    check(checks, 'the left tail lands inside row O and row a <= -1: b < .028 <= .09, L < .60, K_0 in [.37,.56], J_0 <= .72, l_1 = .13, z in (0,.61), h_* in (1,1.77), chi < .070, m_0 = 0',
          X('.028') <= bO['bmax'] and Lleft <= bO['Lmax'] and bO['Kmin'] <= X('.37') and X('.56') <= bO['Kmax'] and J0hi <= bO['Jmax']
          and bO['l1'] == X('.13') and bO['Dcoef'] == X('.295') and dO['zmin'] <= 0 and X('.61') <= dO['zmax'] and dO['hmin'] <= 1
          and X('1.77') <= dO['hmax'] and chil <= dO['chi'] and m0['O'] == 0)

    # --- D2. the positive tail (r = a >= 10, u = 1/r^2 <= .01, theta = log(r sqrt(2 pi)) >= theta_0)
    check(checks, '|F^(j)| <= (2j)!/2^j gives 1, 6, 90, 2520', [factorial(2 * j) // 2 ** j for j in range(1, 5)] == [1, 6, 90, 2520])
    G2b = Fr(90, 2 * 3) + 6 + 1 / X('.99')
    G3b = Fr(2520, 2 * 4) + 90 + 18 / X('.99') + 1 / X('.99') ** 2
    check(checks, '|G\'\'| <= 15 + 6 + 1/.99 < 23 and |G\'\'\'| <= 315 + 90 + 18/.99 + 1/.99^2 < 435 (15 = 90/(2*3), 315 = 2520/(2*4))',
          G2b < 23 and G3b < 435, '%.4f, %.4f' % (float(G2b), float(G3b)))
    # formal power series of F and G at u = 0
    NS = 4
    Fs = [Fr((-1) ** n * factorial(2 * n), 2 ** n * factorial(n)) for n in range(NS)]
    Xs = [Fr(0)] + Fs[1:]                             # F - 1
    logF = [Fr(0)] * NS
    pw_ = [Fr(1)] + [Fr(0)] * (NS - 1)
    for m in range(1, NS):
        pw_ = pmul(pw_, Xs)[:NS]
        for i in range(NS):
            logF[i] += Fr((-1) ** (m + 1), m) * pw_[i]
    FlogF = pmul(Fs, logF)[:NS]
    Gs = [Fs[i + 1] / 2 - FlogF[i] for i in range(NS - 1)]
    check(checks, 'Taylor data F(0) = 1, F\'(0) = -1, G(0) = -1/2, G\'(0) = 5/2 (formal power series of F and G = (F-1)/(2u) - F log F)',
          Fs[0] == 1 and Fs[1] == -1 and Gs[0] == Fr(-1, 2) and Gs[1] == Fr(5, 2))
    Clin = {(1, 0): Fr(1), (0, 0): Fr(-1, 2), (0, 1): Fr(5, 2), (1, 1): Fr(-1)}
    Blin = apply_lin(1, Clin)
    Jlin = apply_lin(2, Blin)
    Rlin = apply_lin(3, Jlin)
    check(checks, 'linear-in-u parts: (1-D)C, (2-D)B, (3-D)J give theta-1.5+(8.5-3theta)u, 2theta-4+(37-12theta)u, 6theta-14+(197-60theta)u',
          Blin == {(1, 0): 1, (0, 0): Fr(-3, 2), (0, 1): Fr(17, 2), (1, 1): -3} and
          Jlin == {(1, 0): 2, (0, 0): -4, (0, 1): 37, (1, 1): -12} and Rlin == {(1, 0): 6, (0, 0): -14, (0, 1): 197, (1, 1): -60})
    # remainder constants: operators as polynomials in d = d/dtheta, U; |U^j R0| <= 2^j g u^2 (+ c0 u^3 at j = 3), d R0 same with g=3, c0=90
    Dop = {(1, 0): 1, (0, 1): -2}
    ops = []
    cur = {(0, 0): 1}
    for k_ in (1, 2, 3):
        cur = opmul({(0, 0): k_, (1, 0): -1, (0, 1): 2}, cur)
        ops.append(cur)
    def bound(op):
        gco, const, cco = 0, 0, 0
        for (i, j), cf in op.items():
            if i == 0:
                gco += abs(cf) * 2 ** j
                cco += abs(cf) if j == 3 else 0
            elif i == 1:
                const += abs(cf) * 3 * 2 ** j
                cco += 0
                if j == 3:
                    raise ValueError
        return gco, const, cco
    bds = [bound(o) for o in ops]
    check(checks, 'remainder constants (5g+3), (30g+33), (210g+321+8c_0u) re-derived by expanding (k-D)...(1-D), D = d_theta - 2U',
          bds == [(5, 3, 0), (30, 33, 0), (210, 321, 8)] and Dop, str(bds))
    gp, cp = X('11.5') + 3 * t0_hi, 435 + 90 * t0_hi
    aB, aJ, aR = 3 * t0_hi - X('8.5'), 12 * t0_hi - 37, 197 - 60 * t0_hi
    eB = X('.015') / (2 - 2 * aB / 3) + (5 * gp + 3) / 10 ** 4
    eJ = X('.06') / (2 - aJ / 6) + (30 * gp + 33) / 10 ** 4
    eR = max((197 - 60 * t0_lo) / 100, X('.3') / (2 + aR / 30)) + (210 * gp + 321) / 10 ** 4 + 8 * cp / 10 ** 6
    check(checks, 'uniformity table: B <= .024, J <= .102, R <= .624, hence < .04, .13, .75 (cert:right-errors); g = (23 + 6 theta)/2, c_0 = 435 + 90 theta',
          eB <= X('.024') and eJ <= X('.102') and eR <= X('.624') and X('.024') < X('.04') and X('.102') < X('.13') and X('.624') < X('.75')
          and 0 < aB < Fr(3, 2) and 0 < aJ < 6 and aR > 0 and t0_lo < th_lo and th_hi < t0_hi,
          'B %.6f J %.6f R %.6f' % (float(eB), float(eJ), float(eR)))
    th = t0_lo
    check(checks, 'J > 2theta - 4.13 > 0; R - 1.7J > 2.6theta - 8.171 > 0; 3J - R > .86 (theta >= 3.221)',
          2 * th - X('4.13') > 0 and (6 * th - 14 - X('.75')) - X('1.7') * (2 * th - 4 + X('.13')) == X('2.6') * th - X('8.171') > 0
          and 3 * (2 * th - 4 - X('.13')) - (6 * th - 14 + X('.75')) == X('.86'))
    blo = X('.5') - X('.01') * (t0_hi - X('1.46'))
    lhi = (2 * t0_hi - X('3.87')) / 1000
    kr = X('.5') + X('.01') * (t0_hi - X('.5'))
    check(checks, '.482 < b; l < .0026; k/r < .528 (at r = 10, theta < 3.222); B > 0, J > 0 give b < .5, l > 0',
          blo > X('.482') and lhi < X('.0026') and kr < X('.528') and t0_lo - X('1.54') > 0,
          'b > %.5f, l < %.6f, k/r < %.5f' % (float(blo), float(lhi), float(kr)))
    check(checks, 'C >= .99theta - .5 > 0 and C - (theta - .5) <= u{2.5 - theta + .01(11.5 + 3theta)} < 0 for theta >= 3.221',
          X('.99') * th - X('.5') > 0 and X('2.5') - th + X('.01') * (X('11.5') + 3 * th) < 0)
    uCJ = X('.01') * (t0_hi - X('.475')) * (2 * t0_hi - X('3.87'))
    check(checks, '0 < uCJ < .075 and the majorant decreases: 1/(theta-.475) + 2/(2theta-3.87) < 2 at theta = 3.221',
          uCJ < X('.075') and 1 / (th - X('.475')) + 2 / (2 * th - X('3.87')) < 2, '%.5f' % float(uCJ))
    plo = X('.5') - X('.01') * X('.605') - X('.0026') ** 2 / al
    phi_ = X('.5') + X('.01') * (X('-.395') + X('.075'))
    check(checks, '-.605 < -B + .5J < -.395 (theta cancels) and .493 < p < .5',
          -(th - X('1.46')) + (2 * th - X('4.13')) / 2 == X('-.605') and -(th - X('1.54')) + (2 * th - X('3.87')) / 2 == X('-.395')
          and plo > X('.493') and phi_ < X('.5'), 'p in (%.5f, %.5f)' % (float(plo), float(phi_)))
    Br = (t0_hi - X('1.46')) / 10
    h0r = X('.528') * X('.18') + 2 * X('.22') * X('.0026') / al
    check(checks, 'B/r < .18; |h_0| <= .528(.18) + 2(.22)(.0026)/alpha < .14 < .67 sqrt(.493)',
          Br < X('.18') and h0r < X('.14') and X('.14') ** 2 < X('.67') ** 2 * X('.493'), '%.5f' % float(h0r))
    bb = [X('.482') * (X('.75') - X('.482')), X('.5') * X('.25')]
    K0r_hi = Ds * (1 + max(bb) / X('.493'))
    K0r_lo = Ds * (1 + min(bb) / X('.5') - X('.0026') ** 2 / (al * X('.493')))
    check(checks, '.367 < K_0 < .4; D < D_*/.493 < .640; J_0 < D_* c (.5)/.493 < .48; L < .0026/alpha < .20',
          K0r_lo > X('.367') and K0r_hi < X('.4') and Ds / X('.493') < X('.640') and Ds * c * X('.5') / X('.493') < X('.48')
          and X('.0026') / al < X('.20'), 'K_0 in [%.5f, %.5f]' % (float(K0r_lo), float(K0r_hi)))
    check(checks, '-.3 < z < 0 (z = -R/(rJ), 1.7 < R/J < 3, r >= 10) and .8 < 1 + 3(.482) - 3(.528) <= h_* <= 1 + 3(.5) - 1.7(.5) < 1.77',
          Fr(3, 10) <= X('.3') and 1 + 3 * X('.482') - 3 * X('.528') > X('.8') and 1 + 3 * X('.5') - X('1.7') * X('.5') < X('1.77'))
    chir = X('.01') * (2 * t0_hi - X('3.87')) / X('.97')
    check(checks, 'd >= .97/r, Var V >= .88 (u <= .01); chi <= J/(.97 r^2) < .027 < .097; slope >= 2(.88) - .027/(1-.5^2) > .68',
          1 - 3 * X('.01') == X('.97') and 2 * (1 - 6 * X('.01')) - 1 == X('.88') and chir < X('.027')
          and 2 * X('.88') - X('.027') / (1 - X('.5') ** 2) > X('.68'), 'chi < %.5f' % float(chir))
    N11r = As / 4 - eta / 2 + nu / 4 + X('.0026') ** 2 / al + Ds * (X('.5') + bb[0]) ** 2 / X('.5')
    N22r = nu + Ds * (c / 2) ** 2 / X('.493')
    N12r = [nu / 2 + b_ * (c * K_ - eta) for b_ in (X('.482'), X('.5')) for K_ in (X('.367'), X('.4'))]
    check(checks, 'N_11 < .403 (first part increasing in b: 2A_*(.482) > eta_*), N_22 < 1.12, .080 < N_12 < .13',
          N11r < X('.403') and 2 * As * X('.482') > eta and N22r < X('1.12') and min(N12r) > X('.080') and max(N12r) < X('.13'),
          'N11 %.5f N22 %.5f N12 [%.5f, %.5f]' % (float(N11r), float(N22r), float(min(N12r)), float(max(N12r))))
    detR = (X('.43') - X('.403') - X('.022')) * (X('2.72') - X('1.12') - X('.75')) - X('.05') ** 2
    check(checks, 'right-tail determinant (.43-.403-.022)(2.72-1.12-.75) - .05^2 = .00175 > 0, |.13 - N_12| < .05',
          detR == X('.00175') and cited(r'=.00175>0') and X('.13') - X('.080') <= X('.05'), str(detR))
    bT, dG = bins['T_1'], deriv['ge']
    check(checks, 'the right tail lands inside row T_1 and row a >= -1: b in (.482,.5), L < .0347 <= .20, D < .640, K_0 in (.367,.4), J_0 < .48, l_1 = .022, z in (-.3,0), h_* in (.8,1.77), chi < .027, slope > .68 = m_0, p > .46',
          bT['bmin'] <= X('.482') and bT['bmax'] >= X('.5') and X('.0026') / al <= bT['Lmax'] and bT['Dmax'] == X('.640')
          and bT['Kmin'] <= X('.367') and bT['Kmax'] >= X('.4') and bT['Jmax'] == X('.48') and bT['l1'] == X('.022')
          and dG['zmin'] <= X('-.3') and dG['zmax'] >= 0 and dG['hmin'] <= X('.8') and dG['hmax'] >= X('1.77') and chir <= dG['chi']
          and m0['T_1'] == X('.68') and X('.493') >= X('.46'))

    # --- E. Section sc:scalar
    check(checks, 'D_* = 5/17, A_* = s + 1 + s/8, eta_*, nu_* computed; rho <= epsilon + kappa = .64; 1 - epsilon - kappa = .36',
          Ds == Fr(5, 17) and C['eps'] + C['ka'] == X('.64') and 1 - C['eps'] - C['ka'] == X('.36'),
          'A_* = %s, eta_* = %s, nu_* = %s' % (As, eta, nu))
    ycost = s * (X('.28') ** 2 + X('.075') * X('.67') ** 2 / (4 * X('.36')))
    check(checks, '(sc:y-cost) s(.28^2 + .075 * .67^2/(4 * .36)) < .111', ycost < X('.111'), '%.6f' % float(ycost))
    # p-minorant: 1 - (1-x/2)(x^2+7u) - x(x-1)^2/2 - .045(2-x) = .91 - 7u + x(3.5u - .455), affine in x and u
    def pm(x, u):
        return 1 - (1 - x / 2) * (x * x + 7 * u) - x * (x - 1) ** 2 / 2 - X('.045') * (2 - x)
    ident = all(pm(Fr(x), Fr(u)) == X('.91') - 7 * Fr(u) + Fr(x) * (X('3.5') * Fr(u) - X('.455'))
                for x in (0, 1, 2, Fr(1, 3)) for u in (0, Fr(1, 10), X('.13'), Fr(1, 7)))
    corners = all(pm(Fr(x), u) >= 0 for x in (0, 2) for u in (0, X('.13')))
    check(checks, 'p-minorant: 1 - (1-x/2)(x^2+7u) >= x(x-1)^2/2 + .045(2-x) on [0,2] x [0,.13] (difference affine, corners >= 0)',
          ident and corners and all(X('.045') * (2 - Fr(x)) >= 0 for x in (0, 2)))
    check(checks, 'p-minorant on [0,4]: u + 2u^(3/2) < .25 at u <= .13 (u^3 < .0036); on [4,inf): u + n_u^2/(4d_u) = .46 identically',
          X('.13') ** 3 < X('.0036') and all(u + (u ** 3 / 4) / (4 * u ** 3 / (16 * (X('.46') - u))) == X('.46') for u in (X('.13'), Fr(1, 100), Fr(1, 9), Fr(1, 3), Fr(2, 5), X('.45'))))
    check(checks, '(sc:p-mean) 1 - 1.28^2/[16(.46-.13)] > .689', 1 - X('1.28') ** 2 / (16 * (X('.46') - X('.13'))) > X('.689'))
    check(checks, '(sc:rho-loss) .64 * 1.28^2 * .13/[16(.46-.13)] < .02582 and alpha s * .64 * .13^3/[16(.46-.13)] < .027',
          X('.64') * X('1.28') ** 2 * X('.13') / (16 * X('.33')) < X('.02582') and al * s * X('.64') * X('.13') ** 3 / (16 * X('.33')) < X('.027'))
    # F_0 tangent at S = .28: intercept, slope affine in L = log .28
    S0 = X('.28')
    Llo, Lhi = log_bounds(S0, 40)
    elo, ehi = exp_bounds(Llo)[1], exp_bounds(Lhi)[0]
    def F0(L):
        return S0 * (S0 - 1 - L) / (1 - S0) ** 2
    def F0p(L):
        return (2 * S0 - 2 - L) / (1 - S0) ** 2 + 2 * S0 * (S0 - 1 - L) / (1 - S0) ** 3
    icpt = max(F0(L) - S0 * F0p(L) for L in (Llo, Lhi))
    slope = max(F0p(L) for L in (Llo, Lhi))
    check(checks, 'tangent of F_0 at S = .28: intercept < .16, slope < .52 (log .28 enclosed by the atanh series with z = -9/16, checked by exp)',
          elo <= S0 <= ehi and (1 - S0) / (1 + S0) == Fr(9, 16) and icpt < X('.16') and slope < X('.52'),
          'intercept %.5f slope %.5f' % (float(icpt), float(slope)))
    check(checks, '.075(.16 + .52S) < .089(.15 + .45325S) coefficientwise; kappa/s = .45325',
          X('.075') * X('.16') < X('.089') * X('.15') and X('.075') * X('.52') < X('.089') * X('.45325') and C['ka'] / s == X('.45325'))
    # (sc:F0-sqrt)
    A_ = pmul([X('.478'), 0, X('1.4')], pmul([1, 0, -1], [1, 0, -1]))
    Ap = [i * A_[i] for i in range(1, len(A_))]
    x2J = padd(pmul(Ap, [0, 1]), pscale(A_, -1), [0, 2, 0, -2])
    Pp = [X('-.478'), 2, X('.444'), -2, X('-6.966'), 0, 7]
    x2J = x2J + [Fr(0)] * (len(Pp) - len(x2J))
    signs = [v for v in Pp if v]
    changes = sum(1 for i in range(len(signs) - 1) if (signs[i] > 0) != (signs[i + 1] > 0))
    dP = [i * Pp[i] for i in range(1, len(Pp))]
    log2hi = log_bounds(2, 40)[1]
    J25 = (X('.478') + X('1.4') / 16) * (1 - Fr(1, 16)) ** 2 / Fr(1, 4) - (Fr(1, 16) - 1 + 4 * X('.694'))   # with log 2 < .694
    dPmax = sum(abs(v) * X('.26') ** i for i, v in enumerate(dP))
    check(checks, '(sc:F0-sqrt): x^2 J\'(x) = P(x) exactly; Descartes: 3 sign changes; P(.24) < 0 < P(.26), P(.6) < 0, P(1) = 0 < P\'(1)',
          [Fr(v) for v in x2J] == [Fr(v) for v in Pp] and changes == 3 and peval(Pp, X('.24')) < 0 < peval(Pp, X('.26'))
          and peval(Pp, X('.6')) < 0 and peval(Pp, 1) == 0 and peval(dP, 1) > 0)
    check(checks, 'J(1) = 0; J(.25) > .14 from log 2 < .694; |P(.25)| < .01, |P\'| < 4 on [.24,.26]; |J\'| < 2 there; J at the first minimum > .14 - .02 > 0',
          log2hi < X('.694') and J25 > X('.14') and abs(peval(Pp, X('.25'))) < X('.01') and dPmax < 4
          and (X('.01') + 4 * X('.01')) / X('.24') ** 2 < 2 and X('.14') - 2 * X('.01') > 0, 'J(.25) > %.5f' % float(J25))
    check(checks, 'sqrt(.075) * .478/.15 < .88 ((.88*.15/.478)^2 > .075); the ratio decreases (1.4*.15 < .478*.45325); .089 < .688*.13, .88 < .688*1.28',
          (X('.88') * X('.15') / X('.478')) ** 2 > X('.075') and X('1.4') * X('.15') < X('.478') * X('.45325')
          and X('.089') < X('.688') * X('.13') and X('.88') < X('.688') * X('1.28'))
    check(checks, '.027 + .111 = 69/500', X('.027') + X('.111') == Fr(69, 500) and cited(r'\frac{69}{500}\norm{Y}^2'))
    # substitution table: every corner of each multi-affine expression
    sub_bad, sub_detail = [], []
    zr = {'le': (deriv['le']['zmin'], deriv['le']['zmax']), 'ge': (deriv['ge']['zmin'], deriv['ge']['zmax'])}
    hr = (deriv['le']['hmin'], deriv['le']['hmax'])
    comp = {}
    for name in ROWNAMES:
        bn = bins[name]
        for side in ('le', 'ge'):
            e1 = e2 = e3 = Fr(0)
            for hh in hr:
                for b_ in (bn['bmin'], bn['bmax']):
                    for L_ in (Fr(0), bn['Lmax']):
                        for z_ in zr[side]:
                            W = hh - 2 * b_ - 2 * L_ * z_
                            e1 = max(e1, abs(W))
                            for K_ in (bn['Kmin'], bn['Kmax']):
                                e2 = max(e2, abs(As * b_ - eta / 2 + L_ * z_ + K_ * W))
                            for J_ in (Fr(0), bn['Jmax']):
                                e3 = max(e3, abs(-eta + J_ * W))
            comp[(name, side)] = (e1, e2, e3)
            printed = subst[name][side]
            for k_, (got, pr) in enumerate(zip((e1, e2, e3), printed)):
                if got > pr:
                    sub_bad.append('%s %s #%d: corner max %.5f > printed %s' % (name, side, k_ + 1, float(got), pr))
            sub_detail.append('%s%s:%.3f/%.3f/%.3f' % (name, side, float(e1), float(e2), float(e3)))
    check(checks, 'the 36 entries of (sc:substitution-table): the maximum over every corner of the box is <= the printed bound',
          not sub_bad, '; '.join(sub_bad) if sub_bad else ' '.join(sub_detail))
    def Fbound(name, side, Dval):
        e1, e2, e3 = subst[name][side]
        zz = max(abs(v) for v in zr[side])
        chi = deriv[side]['chi']
        return chi ** 2, As + zz ** 2 / al + e2 ** 2 / bins[name]['l1'] + e3 ** 2 / X('.75'), Dval * e1 ** 2
    fs = {}
    for name in ROWNAMES[1:]:
        for side in ('le', 'ge'):
            ch2, base, dpart = Fbound(name, side, bins[name]['Dmax'])
            fs[(name, side)] = ch2 * (base + dpart)
    claims_simple = [('R_1', X('.295')), ('U_1', X('.23')), ('V_1', X('.23')), ('T_1', X('.39'))]
    ok_simple = all(fs[(n, sd)] <= v for n, v in claims_simple for sd in ('le', 'ge')) and fs[('R_1', 'le')] <= X('.20') \
        and fs[('P_1', 'le')] <= X('.42') ** 2 and fs[('P_1', 'ge')] <= X('.61') ** 2
    check(checks, '(sc:F-simple): F_j <= .295, .23, .23, .39 (R_1, U_1, V_1, T_1, all a); R_1 <= .20 for a <= -1; P_1 <= .42^2 / .61^2',
          ok_simple and cited(r'F_j(a)\le .295,\quad .23,\quad .23,\quad .39'),
          ' '.join('%s%s:%.4f' % (n, sd, float(v)) for (n, sd), v in sorted(fs.items())))
    okneg = True
    negd = []
    for side, cst, coef in (('le', 20, X('1.04')), ('ge', 12, X('1.63'))):
        ch2, base, dpart = Fbound('O', side, bins['O']['Dcoef'])
        okneg = okneg and base <= cst and dpart <= coef
        negd.append('%s: %.4f + %.4f(7+t^2)' % (side, float(base), float(dpart)))
    check(checks, '(sc:F-negative): F_j/chi^2 <= 20 + 1.04(7+t_j^2) (a <= -1), 12 + 1.63(7+t_j^2) (a >= -1)', okneg, '; '.join(negd))
    # thresholds
    def Theta(m, d):
        m = Fr(m)
        y = Fr(d) ** 2
        return (1 + m) / 4 * (1 + y / 30 + y * y / 1680) / (1 + y / 36)
    num_ok = all((Fr(1, 30) + 2 * y / 1680) * (1 + y / 36) - (1 + y / 30 + y * y / 1680) / 36 == Fr(1, 180) + 2 * y / 1680 + y * y / (1680 * 36)
                 for y in (Fr(0), Fr(1), Fr(7, 3), Fr(50)))
    check(checks, 'Theta_m increases: d/dy numerator = 1/180 + 2y/1680 + y^2/(1680*36); r_ij delta^2 = delta^2(1+delta^2/36)Theta/4',
          num_ok and all(Fr(d) ** 2 * (1 + Fr(d) ** 2 / 36) * Theta(m, d) / 4 == (1 + m) / 16 * (1 + Fr(d) ** 2 / 30 + Fr(d) ** 4 / 1680) * Fr(d) ** 2
                         for m in (Fr(0), X('.19')) for d in (1, 3, 7)))
    thr = [
        ('R_1: (.295+.39)/2 = .3425 < Theta_.38(0) = .345', (X('.295') + X('.39')) / 2 == X('.3425') < Theta(X('.38'), 0) == X('.345')),
        ('U_1/V_1: max(.23, (.23+.39)/2) <= Theta_.68(0) = .42; T_1: .39 < .42', max(X('.23'), (X('.23') + X('.39')) / 2) <= Theta(X('.68'), 0) == X('.42') and X('.39') < X('.42')),
        ('P_1, a_+ <= -1: .20 < Theta_.19(0) = .2975', X('.20') < Theta(X('.19'), 0) == X('.2975')),
        ('P_1: (.61-.42)1.62 = .3078; (.61 - .3078/4)^2 <= .284143 < .2975', (X('.61') - X('.42')) * X('1.62') == X('.3078')
         and (X('.61') - X('.3078') / 4) ** 2 <= X('.284143') < Theta(X('.19'), 0) and max(X('.284143'), (X('.284143') + X('.23')) / 2) == X('.284143')),
        ('P_1, 4 <= delta <= 5: (.61-.3078/5)^2 < .300787, max(.300787, (.300787+.39)/2) < .345394 < Theta_.19(4)',
         (X('.61') - X('.3078') / 5) ** 2 < X('.300787') and max(X('.300787'), (X('.300787') + X('.39')) / 2) < X('.345394') < Theta(X('.19'), 4)),
        ('P_1, delta >= 5: max(.3721, (.3721+.39)/2) = .38105 < Theta_.19(5)', X('.61') ** 2 == X('.3721') and max(X('.3721'), (X('.3721') + X('.39')) / 2) == X('.38105') < Theta(X('.19'), 5)),
        ('O: l <= .075 * 1.19 < .09; chi^2[20 + 1.04(7 + a^2 + 2delta)] <= .144 + .011 delta (chi <= .07, |a|chi <= .09)',
         X('.075') * X('1.19') < X('.09') and X('.07') ** 2 * (20 + 7 * X('1.04')) + X('1.04') * X('.09') ** 2 <= X('.144') and 2 * X('1.04') * X('.07') ** 2 <= X('.011')),
        ('O, delta <= 4: .144 + .011*4 < .25 and .20 < .25 = Theta_0(0)', X('.144') + X('.011') * 4 < X('.25') and X('.20') < X('.25') == Theta(0, 0)),
        ('(sc:theta-tail) Theta_0(delta) >= .25 + .0026 delta^2 for delta^2 >= 16: (1 + y/30 + y^2/1680)/4 - (.25 + .0026y)(1 + y/36) = y(c1 + c2 y), c2 > 0, >= 0 at y = 16',
         all((1 + y / 30 + y * y / 1680) / 4 - (X('.25') + X('.0026') * y) * (1 + y / 36) >= 0 for y in (Fr(16), Fr(17), Fr(100)))
         and (Fr(1, 1680 * 4) - X('.0026') / 36) > 0),
        ('O: .106 - .011 delta + .0026 delta^2 has negative discriminant', X('.011') ** 2 - 4 * X('.106') * X('.0026') < 0 and X('.25') - X('.144') == X('.106')),
        ('O, a_+ > -1: chi = .097: .097^2(12 + 1.63(8 + 2delta)) <= .236 + .031 delta', X('.097') ** 2 * (12 + X('1.63') * 8) <= X('.236') and X('.097') ** 2 * X('1.63') * 2 <= X('.031')),
        ('O: P_- = .236 + .031delta - (4/delta)(.092 + .020delta) = .156 + .031delta - .368/delta; .092 + .020delta = (.236+.031delta) - (.144+.011delta)',
         X('.236') - 4 * X('.020') == X('.156') and 4 * X('.092') == X('.368') and X('.236') - X('.144') == X('.092') and X('.031') - X('.011') == X('.020')),
        ('O: .094 - .031delta + .0026delta^2 has negative discriminant (and .25 - .156 = .094)', X('.031') ** 2 - 4 * X('.0026') * X('.094') < 0 and X('.25') - X('.156') == X('.094')),
        ('O, a_+ in T_1: .39 < Theta_0(6.5); .23 < .25', X('.39') < Theta(0, X('6.5')) and X('.23') < X('.25')),
    ]
    tb = [n for n, ok in thr if not ok]
    check(checks, 'threshold comparisons (sc:threshold) in all %d endpoint cases' % len(thr), not tb, '; '.join(tb) if tb else
          'Theta_.19(4) = %.6f, Theta_.19(5) = %.6f, Theta_0(6.5) = %.6f' % (float(Theta(X('.19'), 4)), float(Theta(X('.19'), 5)), float(Theta(0, X('6.5')))))

    allpass = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if allpass else 'REFUSED'
    # a failure of a published bound under the paper's own rule is a refutation of that printed bound
    if not allpass:
        names = [c_['check'] for c_ in checks if not c_['pass']]
        if any(n.startswith(('all 44', 'the 36', '11 residual', '20 joining', 'left-tail determinant')) for n in names):
            verdict = 'REFUTED'
    return {'verdict': verdict,
            'value': {'group_min_1e-3': {str(r_['w']): [str(round(float(v * 1000), 4)) for v in r_['group_min']] for r_ in rows},
                      'residual_P_max': '%.4e' % max(float(r_['res_P']) for r_ in rows),
                      'budget_q': '%.4e' % float(budget_q), 'budget_k': '%.4e' % float(budget_k),
                      'theta0': '[%.15f, %.15f]' % (float(lg[0] / 2), float(lg[1] / 2)),
                      'polynomials_bounded': nmem, 'runtime_s': round(time.time() - t0, 1)},
            'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the scalar certificate behind Lemmas sc:bounds and tr:scalar-basic — the central '
                       'piecewise-polynomial certificate on [-6,10] rebuilt from its eleven seed pairs (residuals, joins, '
                       'anchors, error budgets, all 44 group bounds), the rational inequalities of both tail arguments at their '
                       'extreme points, and the finite comparisons of Section sc:scalar; NOT the isotropic-constant headline'}


def forge():
    """each must NOT certify"""
    src = Sources()
    T = parse(src)
    out = []
    cen = [list(r_) for r_ in T['centers']]
    cen[7][2] = '3.2830986559304364'                 # P_0 of row w = 3 moved by 1e-9
    out.append(('seed P_0 of row w = 3 moved by 1e-9 (a join exceeds 2e-10)', decide(centers_override=[tuple(r_) for r_ in cen])['verdict']))
    cen = [list(r_) for r_ in T['centers']]
    cen[0][3] = '.1842076803035094'                  # k^_0 of row w = -5.25 moved by 1e-8
    out.append(('seed k^_0 of row w = -5.25 moved by 1e-8 (k^(-1) leaves the anchor window, a join exceeds 2e-10)',
                decide(centers_override=[tuple(r_) for r_ in cen])['verdict']))
    grp = [list(g) for g in T['groups']]
    grp[10][2] = '.6'                                # G2 at w = 9 printed .35 -> .6 (recomputed .508)
    out.append(('Table cert:group-bounds G2 at w = 9 printed .6 instead of .35', decide(groups_override=[tuple(g) for g in grp])['verdict']))
    sub = {k: dict(v) for k, v in T['subst'].items()}
    e = list(sub['T_1']['ge'])
    e[1] = X('.80')
    sub['T_1']['ge'] = tuple(e)
    out.append(('substitution table T_1, a >= -1 middle entry .840 -> .80', decide(subst_override=sub)['verdict']))
    out.append(('left-tail determinant printed .023233', decide(det_left=X('.023233'))['verdict']))
    return out


def control():
    """NOT a forge (expected to certify): the seeds are rational starting values, not claimed Gaussian values, so a
    seed moved by 1e-12 stays inside every tolerance and still certifies — the certificate has slack, by design"""
    T = parse(Sources())
    cen = [list(r_) for r_ in T['centers']]
    cen[7][2] = '3.2830986549314364'
    return [('seed P_0 of row w = 3 moved by 1e-12', decide(centers_override=[tuple(r_) for r_ in cen])['verdict'])]


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], '|', c_['detail'])
    print('%.1fs' % (time.time() - t))
    print('forges:', forge())
    print('control:', control())
