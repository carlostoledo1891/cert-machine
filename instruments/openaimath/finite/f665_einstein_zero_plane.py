"""F-665 -- "Zero-Plane Rigidity for Einstein Four-Manifolds" (openai/math family 348).  Shared engine for F-667.

THE CLAIM (01-introduction.tex:14-24, Theorem thm:main; paper.tex abstract): "Let (M^4,g) be a connected smooth
closed Riemannian manifold satisfying Ric_g = 3g, K_g(sigma) >= 0 for every tangent two-plane sigma. If K_g(sigma_0)
= 0 for at least one tangent two-plane, then the universal Riemannian cover is isometric to S^2(1/sqrt3) x
S^2(1/sqrt3)."   Its finite input is the appendix "Exact polynomial certificates"
(build/sections/07-certificates.tex): Lemma lem:scalar-certificates (:84-132), Lemma lem:matrix-certificates
(:180-352, the 12-row triangle table :223-246, the expansion instructions :248-345) and Lemma
lem:potential-certificate (:356-427), "proved" by the Bernstein conversion Lemma lem:bernstein-conversion (:22-80);
plus the rational certificates of Section 4 (04-volume.tex): the sine minorant lem:sine-minorant (:296-320), the
three upper-deficit integral rows (:325-341) and the constrained-moment coefficient table (:606-653).  The release
ships the same verification/results.json (447,073 bytes) with F-667, as "the complete finite results".

WHAT IS DECIDED HERE, from the paper's definitions, re-derived and expanded with this audit's own exact polynomial
arithmetic (_poly.py, Fraction):
  A. Every certificate polynomial built TWICE and required equal: once from Section 6's definitions
     (06-coupling.tex: D, h, kappa (eq:15), c, Theta, A0, L0, C0, A, G, H, L, Z*, P0, Pk, Pl, K1, K2, K12 (eq:21 at
     sigma = 1), X_v, Q_v, J, H_v (via the clearing of eq:22), S*, E0, F, L_v, L_b (eq:23)), and once from the
     appendix's own expansion instructions (m*, d0, P_{k,*}, P_{l,*}, Y*, A1, A12, X*, H*, the two scalar rows).
  B. Bernstein coefficients computed TWO WAYS and required equal: the paper's coefficient-sum formula
     (lem:bernstein-conversion) and an independent homogenization ((u0+u1)^N, resp. (u1+u2+u3)^N expansion divided
     by the multinomials).  Then, exactly: the 8 scalar interval boxes of lem:scalar-certificates against the printed
     lower bounds and the printed minima (3971/3200, 1063/1600, 101027/20000, 283729/400000); the 12 triangle rows
     (A on OSC, OCW0, SCU; B on OAS, ASE, ACE, SBE, CBE, SUB; L_v on OCU; F + 12 c delta^2 L_b on OSC, SCU): every
     nonzero coefficient matrix has diagonal >= the printed bound and determinant >= the printed bound, every
     exceptional coefficient is the zero matrix, and the set of zero coefficients is EXACTLY the printed list
     (:339-345) with the printed counts; the three printed CBE triples (:316-323); the potential F: F*(n,t) even in t
     with the five printed f_j, h_i = d_i q_i as polynomial identities, the five q_i on the four quarters against the
     printed bounds and degrees, the Bernstein identity sum h_i C(4,i) z^i (1-z)^(4-i) = F* (cleared), F*(1,0) = 0.
  C. The covering claims: OSC, OCW0, SCU tile D and OAS, ASE, ACE, SBE, CBE, SUB tile D+ = OCU (containment, area
     sum, pairwise interior-disjointness by separating edges), exactly.
  D. The algebra that ties the certificates to Section 6, as polynomial identities: the eq:20 enlargement
     (g_v, g_b at (V, W) = (delta, 0)) and "dividing by v b P^4 gives exactly A/v + Au^2/b + Gv + Hb - L"; 10/9 (h -
     67/50 - 27/100 vb) = c; the eq:19 clearing 4 C0 D0^sc (2-v) form; P0 = Pk + 30 h v; the axial identity
     lambda_ax + 32 v delta = 6(a^2+s^2) + 32 a delta; the sigma-monotonicity -d/dsigma A_sigma (with sigma symbolic);
     r_v = 8v + (1-v)^2 and S* = (alpha b r_v + v r_b / alpha)/2; the g-majorant gap identity and its bracket >= 4
     on [1,2]; I0 = -E0 - 6v^2(1-sigma)L_v - 6b^2(1-sigma')L_b is NOT re-derived (it needs eq:16-18's tensors).
     Also c - 1/10 >= 0 and M - 1/4 >= 0 on D (Bernstein, so m >= 1/16 and c >= 1/10 as stated).
  E. Section 4: the sine-minorant coefficients and a0 < pi < b0 (pi enclosed by Machin's formula with alternating
     tails, all rational); S(z)/z - 9/5 >= 0 on [0,1/2] and the printed floor; the three upper-deficit integrals
     computed exactly (polynomial integration) against 11869, 30175, 39518 / 10^6 and their sum > 163/2000 > 2/25 >
     3/40; f(5/8) < 1, beta^2(3-beta) at 5/8 > 15/16, the reduction to 6 - 13u^2 + 6u^4 (identity) and its sign; the
     moment-obstruction certificates: L(2x^2), V(2x^2) from L, V; H''' = L z^(-5/2) and Phi''' = V (half-integer
     exponent arithmetic); D* on four quarters (bound 2/5, printed least 2459668689/5793382400); P_-, P_+ on
     [0, 37/100] (bound 1, printed least coefficients); H(2) - H(w) = sqrt2 (R*(1) - x R*(x)); the two-point J
     identity; the t_-/t_+ nonemptiness factor (2-w)(10-37w); B_+- > 0; 32 d >= 88/5 and 4 sqrt2 < 17/3; (37/100)^2 >=
     5/37; the moment bound 17/225 and the strictly feasible measure (-5/2, -1/8); G'(c) in [0, sqrt(K)/2].
  R. The release's results.json, read as DATA after the above: every polynomial, every Bernstein coefficient, index,
     determinant, minimum, minimizing index, zero set and exact value it records for these rows is compared
     with the values computed here.

RESULT: CERTIFIED -- every bound, zero list, printed minimum and printed triple holds exactly; the two derivations
of every polynomial agree, the two Bernstein expansions agree, and results.json agrees entry for entry.

OBSERVATIONS (after this decider ran, the release's verification/verify.py and polynomial.py were READ, never run):
verify.py builds each certificate polynomial ONCE, from Section-6-style definitions (it does not expand the
appendix's own starred instructions m*, Y*, A1, A12, X*, H*, so the agreement of the two descriptions is checked only
here), computes Bernstein coefficients by the paper's coefficient-sum formula and confirms them by re-expanding the
Bernstein basis, asserts the bounds and the exact zero patterns, 53 identities and 24 exact values, and requires the
recomputed output to equal results.json byte for byte.  It does not check that the triangles tile D and D+, nor
a0 < pi < b0; its COVERAGE.md says it does not check the geometric or analytic reductions.

WHAT IS NOT DECIDED (theory, not the finite object): the classification theorem and everything that turns these
inequalities into it -- the Weyl-block calculus and the weak identities (Sections 2-3, eq:3, eq:4), the polar and
radial volume comparisons and the discrete Jacobi determinant (Section 4 lemmas), the Taylor inequality behind
S(z) <= sin(pi z) (its constants a0 < pi < b0 ARE decided), the constrained-moment separation argument, the weighted
Hessian inequality (Section 5), the derivation of the combined integrand and of eq:19-eq:23 from eq:16-eq:18 (only the
polynomial identities listed in D are checked), the zero-set limits, Section 8, and the Bernstein lemma itself (a
classical fact; its formula is cross-checked here by a second expansion, not proved).  The 53 identities of
results.json that concern Section 5 (eq12.*) and the eq9 Taylor clearing identities are not re-derived here.
"""
import itertools
import json
import os
import sys
import time
from fractions import Fraction
from math import comb, factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, compose, const, diff, mul, pw, scale, sub, total, var  # noqa: E402

DIRS = {'665': 'preprints/Zero-Plane-Rigidity-for-Einstein-Four-Manifolds-October-4-2026/',
        '667': 'preprints/Positively-curved-Einstein-four-manifolds-September-23-2026/'}
CERT = 'build/sections/07-certificates.tex'
COUP = 'build/sections/06-coupling.tex'
VOL = 'build/sections/04-volume.tex'
RESULTS = 'verification/results.json'
F = Fraction

# ---------------------------------------------------------------- the paper's constants (06-coupling.tex:64-75)
D_ = F(158)
h_ = F(17, 10)
Z_KAPPA = (-43, -45, -63, 21, 183, 208, 61, 46, 101, 79, -41)      # 4 (z1, ..., z11)
ALPHA = F(5, 4)

# the printed tables
SCALAR_ROWS = [  # (key, degree, intervals, lower bound) -- 07-certificates.tex:106-120
    ('eq19.defect_C0', 2, [(0, 1), (1, 2)], F(1, 2)),
    ('eq19.defect_determinant', 5, [(0, 1), (1, 2)], F(1, 2)),
    ('eq20.G', 4, [(0, 1)], F(9, 10)),
    ('eq20.H', 4, [(0, 1)], F(1, 4)),
    ('eq20.minus_Z', 8, [(0, F(1, 16))], F(13, 100)),
    ('eq20.radical', 16, [(F(1, 16), 1)], F(12, 100)),
]
PRINTED_MINIMA = {'eq19.defect_C0': (F(3971, 3200), F(1063, 1600)),
                  'eq19.defect_determinant': (F(101027, 20000), F(283729, 400000))}
VERT = {'O': (0, 0), 'S': (1, 0), 'C': (1, 1), 'U': (2, 0), 'W0': (0, 2),
        'A': (F(1, 2), F(1, 2)), 'B': (F(3, 2), F(1, 2)), 'E': (1, F(1, 2))}
TRI_ROWS = [  # (key, object, triangle, N, zero count, diagonal-or-scalar bound, determinant bound) -- :230-243
    ('eq21.A.OSC', 'A', ('O', 'S', 'C'), 8, 0, F(16000), F(53000000)),
    ('eq21.A.OCW0', 'A', ('O', 'C', 'W0'), 8, 0, F(890), F(3900000)),
    ('eq21.A.SCU', 'A', ('S', 'C', 'U'), 8, 0, F(2400), F(3500000)),
    ('eq22.B.OAS', 'B', ('O', 'A', 'S'), 9, 0, F(43), F(1050)),
    ('eq22.B.ASE', 'B', ('A', 'S', 'E'), 9, 0, F(43), F(490)),
    ('eq22.B.ACE', 'B', ('A', 'C', 'E'), 10, 1, F(2), F(21)),
    ('eq22.B.SBE', 'B', ('S', 'B', 'E'), 9, 0, F(43), F(1300)),
    ('eq22.B.CBE', 'B', ('C', 'B', 'E'), 10, 2, F(13, 100), F(4)),
    ('eq22.B.SUB', 'B', ('S', 'U', 'B'), 9, 0, F(5), F(290)),
    ('eq23.Lv.OCU', 'Lv', ('O', 'C', 'U'), 6, 1, F(9, 10), None),
    ('eq23.Fplus.OSC', 'Fplus', ('O', 'S', 'C'), 9, 6, F(19, 100), None),
    ('eq23.Fplus.SCU', 'Fplus', ('S', 'C', 'U'), 9, 7, F(9, 1000), None),
]
# the printed zero exceptions (07-certificates.tex:339-345), as (i, j) with the third index N - i - j
ZEROS = {'eq22.B.ACE': {(0, 10)}, 'eq22.B.CBE': {(10, 0), (9, 1)}, 'eq23.Lv.OCU': {(0, 6)},
         'eq23.Fplus.OSC': {(i, j) for i in range(3) for j in range(3) if i + j <= 2},
         'eq23.Fplus.SCU': {(i, j) for i in range(10) for j in range(10) if i + j <= 9 and 9 - j <= 2} | {(0, 6)}}
CBE_PRINTED = {(8, 0): (F(11041, 810), F(4063, 810), F(60557, 16200)),
               (8, 1): (F(4328, 405), F(839, 405), F(3977, 2700)),
               (8, 2): (F(191, 81), F(191, 81), F(-1189, 1350))}
F_PRINTED = {  # 07-certificates.tex:369-377: (multiplier, coefficients in n, low to high)
    0: (240, None),   # 240 f0 = n^3 (1-n)(53511 n^4 - 151593 n^3 + 222537 n^2 - 83607 n + 10256)
    1: (60, None),    # 60 f1 = n (19389 n^5 - 418926 n^4 + 523719 n^3 - 289776 n^2 + 67782 n + 10564)
    2: (60, [74, 23442, -451164, 1370598, -1260129]),
    3: (10, [75, 2601, -12200]),
    4: (1, [F(-23, 5)]),
}
Q_ROWS = [(0, 4, F(3)), (1, 6, F(31)), (2, 7, F(1, 5)), (3, 7, F(12, 5)), (4, 7, F(9, 5))]   # :398-409
QUARTERS = [(F(j, 4), F(j + 1, 4)) for j in range(4)]


# ---------------------------------------------------------------- univariate polynomials: lists, low to high
def u_trim(p):
    p = [F(x) for x in p]
    while p and p[-1] == 0:
        p.pop()
    return p


def u_add(*ps):
    n = max(len(p) for p in ps)
    return u_trim([sum((p[i] if i < len(p) else 0) for p in ps) for i in range(n)])


def u_scale(p, k):
    return u_trim([k * x for x in p])


def u_sub(p, q):
    return u_add(p, u_scale(q, -1))


def u_mul(*ps):
    r = [F(1)]
    for p in ps:
        out = [F(0)] * (len(r) + len(p) - 1) if r and p else []
        for i, x in enumerate(r):
            if x:
                for j, y in enumerate(p):
                    out[i + j] += x * y
        r = u_trim(out)
    return r


def u_pow(p, k):
    return u_mul(*([p] * k)) if k else [F(1)]


def u_eval(p, x):
    s = F(0)
    for c in reversed(p):
        s = s * x + c
    return s


def u_compose(p, q):
    r = []
    for c in reversed(p):
        r = u_add(u_mul(r, q) if r else [], [c])
    return r


def u_diff(p):
    return u_trim([i * p[i] for i in range(1, len(p))])


def u_divexact(p, q):
    """quotient of p by q, and the remainder (exact long division)"""
    p = list(u_trim(p))
    q = u_trim(q)
    out = [F(0)] * max(len(p) - len(q) + 1, 1)
    while len(p) >= len(q) and p:
        k = p[-1] / q[-1]
        sh = len(p) - len(q)
        out[sh] = k
        for i, c in enumerate(q):
            p[i + sh] -= k * c
        p = u_trim(p)
    return u_trim(out), p


def u_integral(p, r, s):
    return sum(c * (F(s) ** (j + 1) - F(r) ** (j + 1)) / (j + 1) for j, c in enumerate(p))


X1 = [F(0), F(1)]


def lin(c0, c1):
    return u_trim([c0, c1])


# ---------------------------------------------------------------- Bernstein coefficients, two independent ways
def bern_interval(p, r, s, N):
    """lem:bernstein-conversion: a_j of p(r + (s-r) z), then h_i = sum_j a_j C(i,j)/C(N,j)"""
    r, s = F(r), F(s)
    p = u_trim(p)
    assert len(p) - 1 <= N
    a = [(s - r) ** j * sum(p[k] * comb(k, j) * r ** (k - j) for k in range(j, len(p))) for j in range(N + 1)]
    return [sum(a[j] * F(comb(i, j), comb(N, j)) for j in range(i + 1)) for i in range(N + 1)]


def bern_interval_hom(p, r, s, N):
    """second way: p((r u0 + s u1)/(u0+u1)) (u0+u1)^N expanded; coefficient of u0^(N-i) u1^i over C(N,i)"""
    r, s = F(r), F(s)
    out = [F(0)] * (N + 1)
    for k, pk in enumerate(u_trim(p)):
        if pk:
            A = [comb(k, i) * s ** i * r ** (k - i) for i in range(k + 1)]
            for i, x in enumerate(A):
                for j in range(N - k + 1):
                    out[i + j] += pk * x * comb(N - k, j)
    return [out[i] / comb(N, i) for i in range(N + 1)]


def bern_tri(P, tri, N):
    """lem:bernstein-conversion on a triangle: P(z,w) = p(V,W), [p]_ij = sum C(i,d)C(j,e)/(C(N,d+e)C(d+e,d)) P_de"""
    (r1, s1), (r2, s2), (r3, s3) = [tuple(F(x) for x in VERT[t]) for t in tri]
    V = {k: c for k, c in {(0, 0): r3, (1, 0): r1 - r3, (0, 1): r2 - r3}.items() if c}
    W = {k: c for k, c in {(0, 0): s3, (1, 0): s1 - s3, (0, 1): s2 - s3}.items() if c}
    Pz = compose(P, [V, W], 2)
    assert all(d + e <= N for d, e in Pz)
    out = {}
    for i in range(N + 1):
        for j in range(N + 1 - i):
            out[(i, j)] = sum((F(comb(i, d) * comb(j, e), comb(N, d + e) * comb(d + e, d)) * Pz.get((d, e), 0)
                               for d in range(i + 1) for e in range(j + 1)), F(0))
    return out


def bern_tri_hom(P, tri, N):
    """second way: P((u1 p1 + u2 p2 + u3 p3)/(u1+u2+u3)) (u1+u2+u3)^N, coefficient over N!/(i! j! k!)"""
    pts = [tuple(F(x) for x in VERT[t]) for t in tri]
    X = {(1, 0, 0): pts[0][0], (0, 1, 0): pts[1][0], (0, 0, 1): pts[2][0]}
    Y = {(1, 0, 0): pts[0][1], (0, 1, 0): pts[1][1], (0, 0, 1): pts[2][1]}
    X = {k: c for k, c in X.items() if c}
    Y = {k: c for k, c in Y.items() if c}
    T = {(1, 0, 0): 1, (0, 1, 0): 1, (0, 0, 1): 1}
    Hm = {}
    for (d, e), c in P.items():
        Hm = add(Hm, scale(mul(mul(pw(X, d, 3), pw(Y, e, 3)), pw(T, N - d - e, 3)), c))
    out = {}
    for i in range(N + 1):
        for j in range(N + 1 - i):
            k = N - i - j
            out[(i, j)] = F(Hm.get((i, j, k), 0)) * F(factorial(i) * factorial(j) * factorial(k), factorial(N))
    return out


# ---------------------------------------------------------------- the polynomials of Section 6 and Section 7
def build(kappa_z=Z_KAPPA):
    n = 2
    v, b = var(0, n), var(1, n)
    one = const(1, n)

    def C(x):
        return const(F(x), n)

    def swap(P):
        return {(e[1], e[0]): c for e, c in P.items()}
    a, s = sub(v, one), sub(b, one)
    delta = total(C(2), scale(v, -1), scale(b, -1))
    K = total(C(4), pw(v, 2, n), pw(b, 2, n))
    M = sub(one, scale(sub(v, b), F(3, 8)))
    m = pw(M, 2, n)
    z = [F(x, 4) for x in kappa_z]
    # eq:15, built in (a, s) and composed, so that its partial derivatives are taken in (v, b) directly
    A_, S_ = var(0, n), var(1, n)
    kap_as = total(scale(sub(A_, S_), -D_ / 6), scale(pw(A_, 2, n), z[0]),
                   scale(mul(A_, S_), 60 - 2 * D_ / 9 + 2 * z[0]), scale(pw(S_, 2, n), z[1]),
                   *[scale(mul(pw(A_, i, n), pw(S_, 3 - i, n)), z[2 + i]) for i in range(4)],
                   *[scale(mul(pw(A_, i, n), pw(S_, 4 - i, n)), z[6 + i]) for i in range(5)])
    kap = compose(kap_as, [a, s], n)
    kapb = swap(kap)
    d1k, d2k = diff(kap, 0), diff(kap, 1)
    c = sub(C(F(2, 5)), scale(mul(v, b), F(3, 10)))
    nn = scale(delta, F(1, 2))
    t = scale(sub(v, b), F(1, 2))
    Theta = scale(total(mul(mul(pw(nn, 2, n), sub(one, nn)), add(C(105), scale(nn, 5))),
                        mul(pw(t, 2, n), total(C(4), scale(nn, 360), scale(pw(nn, 2, n), -586))),
                        scale(pw(t, 4, n), -4)), F(1, 4))
    # ---- eq:21 at sigma = 1 (06-coupling.tex:455-488)
    P0 = total(scale(m, 300), scale(v, 30 * h_), scale(delta, 160 * h_))
    Pk = add(scale(m, 300), scale(delta, 160 * h_))
    Pl = scale(mul(m, v), 35)
    lam_v = sub(scale(total(pw(v, 2, n), pw(b, 2, n), scale(v, -1), scale(b, -1)), 6), scale(delta, 26))
    K2 = sub(mul(m, total(C(42), scale(pw(b, 2, n), 3), scale(pw(v, 2, n), 10))), scale(lam_v, h_))
    K1 = total(scale(K2, 5), mul(m, add(scale(v, 300), scale(pw(v, 2, n), 140))), scale(mul(delta, v), 160 * h_))
    K12 = add(mul(m, add(scale(v, 75), scale(pw(v, 2, n), 35))), scale(mul(delta, v), 40 * h_))
    A6 = (total(mul(P0, sub(mul(v, K1), scale(kap, 5))), scale(mul(pw(v, 2, n), pw(Pk, 2, n)), -2)),
          total(mul(P0, sub(mul(v, K2), kap)), scale(mul(pw(v, 2, n), pw(Pl, 2, n)), -2)),
          total(mul(P0, mul(v, K12)), scale(mul(pw(v, 2, n), mul(Pk, Pl)), -2)))
    # ---- eq:22 (06-coupling.tex:528-549 and 07-certificates.tex:136-165)
    X_v = add(mul(m, total(C(-70), scale(v, 100), scale(pw(v, 2, n), -25), scale(pw(b, 2, n), -5))),
              scale(add(scale(add(pw(a, 2, n), pw(s, 2, n)), 6), scale(mul(a, delta), 32)), F(5, 3) * h_))
    r_v = total(one, scale(v, 6), pw(v, 2, n))
    H_v = sub(scale(mul(mul(mul(v, K), Theta), add(one, v)), 8),
              mul(r_v, add(scale(v, D_), mul(K, add(mul(v, add(X_v, d1k)), scale(kap, F(2, 3)))))))
    H_b = swap(H_v)
    S_star = add(scale(mul(v, b), 4 * (ALPHA + 1 / ALPHA)),
                 scale(add(scale(mul(b, pw(sub(one, v), 2, n)), ALPHA), scale(mul(v, pw(sub(one, b), 2, n)), 1 / ALPHA)),
                       F(1, 2)))
    KJ = sub(scale(mul(K, add(d2k, swap(d2k))), F(1, 2)), C(D_))   # K J, J = (d_b kappa + d_v kappabar)/2 - D/K; d_v kappabar = (d_2 kappa)(b, v)
    B6 = (H_v, H_b, mul(S_star, KJ))
    # ---- eq:23 (06-coupling.tex:571-597)
    E0 = total(scale(mul(sub(one, scale(pw(delta, 2, n), F(1, 4))), pw(sub(v, b), 2, n)), D_),
               scale(mul(delta, add(mul(pw(v, 2, n), pw(a, 2, n)), mul(pw(b, 2, n), pw(s, 2, n)))), 30 * h_),
               scale(add(mul(mul(a, v), kap), mul(mul(s, b), kapb)), 6))
    Fp = sub(mul(c, E0), pw(Theta, 2, n))
    Lv = sub(scale(mul(delta, v), 10 * h_), kap)
    Lb = sub(scale(mul(delta, b), 10 * h_), kapb)
    Fplus6 = add(Fp, scale(mul(mul(c, pw(delta, 2, n)), Lb), 12))
    # ---- the appendix's own expansion instructions (07-certificates.tex:248-334), with V = v, W = b
    V, W = v, b
    ms = pw(sub(one, scale(sub(V, W), F(3, 8))), 2, n)
    d0 = total(C(2), scale(V, -1), scale(W, -1))
    Pks = add(scale(ms, 300), scale(d0, 160 * h_))
    Pls = scale(mul(ms, V), 35)
    Ys = sub(mul(ms, total(C(42), scale(pw(W, 2, n), 3), scale(pw(V, 2, n), 10))),
             scale(sub(scale(total(pw(V, 2, n), pw(W, 2, n), scale(V, -1), scale(W, -1)), 6), scale(d0, 26)), h_))
    A1 = total(scale(Ys, 5), mul(ms, add(scale(V, 300), scale(pw(V, 2, n), 140))), scale(mul(d0, V), 160 * h_))
    A12 = add(mul(ms, add(scale(V, 75), scale(pw(V, 2, n), 35))), scale(mul(d0, V), 40 * h_))
    pre = add(Pks, scale(V, 30 * h_))
    A7 = (sub(mul(pre, sub(mul(V, A1), scale(kap, 5))), scale(mul(pw(V, 2, n), pw(Pks, 2, n)), 2)),
          sub(mul(pre, sub(mul(V, Ys), kap)), scale(mul(pw(V, 2, n), pw(Pls, 2, n)), 2)),
          sub(mul(pre, mul(V, A12)), scale(mul(pw(V, 2, n), mul(Pks, Pls)), 2)))
    Ks = total(C(4), pw(V, 2, n), pw(W, 2, n))
    Xs = add(mul(ms, total(C(-70), scale(V, 100), scale(pw(V, 2, n), -25), scale(pw(W, 2, n), -5))),
             scale(add(scale(add(pw(a, 2, n), pw(s, 2, n)), 6), scale(mul(a, d0), 32)), F(5, 3) * h_))
    Hs = sub(scale(mul(mul(mul(V, Ks), Theta), add(one, V)), 8),
             mul(total(one, scale(V, 6), pw(V, 2, n)),
                 add(scale(V, D_), mul(Ks, add(mul(V, add(Xs, d1k)), scale(kap, F(2, 3)))))))
    B7 = (Hs, swap(Hs), mul(S_star, sub(scale(mul(Ks, add(d2k, swap(d2k))), F(1, 2)), C(D_))))
    Lv7 = sub(scale(mul(d0, V), 10 * h_), kap)
    Fplus7 = sub(mul(c, total(scale(mul(sub(one, scale(pw(d0, 2, n), F(1, 4))), pw(sub(V, W), 2, n)), D_),
                              scale(mul(d0, add(mul(pw(V, 2, n), pw(a, 2, n)), mul(pw(W, 2, n), pw(s, 2, n)))), 30 * h_),
                              scale(add(mul(mul(V, a), kap), mul(mul(W, s), kapb)), 6),
                              scale(mul(pw(d0, 2, n), sub(scale(mul(d0, W), 10 * h_), kapb)), 12))),
                 pw(Theta, 2, n))
    return dict(n=n, v=v, b=b, one=one, a=a, s=s, delta=delta, K=K, M=M, m=m, kap=kap, kapb=kapb, c=c,
                Theta=Theta, P0=P0, Pk=Pk, Pl=Pl, K1=K1, K2=K2, K12=K12, A6=A6, A7=A7, B6=B6, B7=B7, X_v=X_v,
                r_v=r_v, H_v=H_v, S_star=S_star, KJ=KJ, E0=E0, Fp=Fp, Lv=Lv, Lb=Lb, Fplus6=Fplus6, Lv7=Lv7,
                Fplus7=Fplus7, lam_v=lam_v, d1k=d1k, d2k=d2k)


def scalar_polys():
    """lem:scalar-certificates, from 06-coupling.tex:298-313 and :405-427"""
    v = X1
    A0 = u_mul([F(0), F(27, 320)], lin(F(15, 2), F(2, 3)))
    L0 = u_mul([F(0), F(9, 20)], lin(F(7, 4), F(-3, 4)))
    C0 = u_sub(u_sub([F(7, 5) * h_], A0), L0)
    two_v = lin(2, -1)
    Q5 = u_sub(u_scale(u_mul(C0, u_add(u_mul(u_sub([h_], A0), two_v), u_scale(v, F(2, 5) * h_))), 4),
               u_mul(two_v, u_pow(u_add(u_scale(A0, 2), L0), 2)))
    om, mu = F(27, 128), F(9, 32)
    u = X1
    one_u, u2 = lin(1, 1), u_pow(u, 2)
    A = u_scale(u_add([1], u2), F(67, 50))
    G = u_add(u_scale(u_mul(u_add([1], u2), u2), F(27, 100)), u_scale(u_pow(one_u, 2), 3 * om),
              u_scale(u_mul(one_u, u_sub([1], u_pow(u, 3))), mu))
    H = u_add(u_scale(u_add([1], u2), F(27, 100)), u_scale(u_mul(u_add([17], u_scale(u2, 19)), u_pow(one_u, 2)), om / 12),
              u_scale(u_mul(one_u, u_sub([1], u_pow(u, 3))), -mu))
    L = u_add(u_scale(u_mul(u_pow(one_u, 2), u_add([F(19, 3)], u_scale(u2, F(7, 2)))), om),
              u_scale(u_mul(one_u, u_add([1], u_pow(u, 3))), F(3, 4)))
    Zs = u_sub(u_pow(L, 2), u_scale(u_mul(A, u_add(G, u_mul(u2, H))), 4))
    rad = u_sub(u_scale(u_mul(u_pow(A, 2), u2, G, H), 64), u_pow(Zs, 2))
    return dict(A0=A0, L0=L0, C0=C0, Q5=Q5, A=A, G=G, H=H, L=L, Zs=Zs, rad=rad,
                rows={'eq19.defect_C0': C0, 'eq19.defect_determinant': Q5, 'eq20.G': G, 'eq20.H': H,
                      'eq20.minus_Z': u_scale(Zs, -1), 'eq20.radical': rad})


# ---------------------------------------------------------------- geometry of the subdivisions
def area2(p, q, r):
    return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])


def tri_pts(tri):
    return [tuple(F(x) for x in VERT[t]) for t in tri]


def inside(pt, big):
    a, b_, c_ = big
    s = area2(a, b_, c_)
    return all(area2(*[pt if k == i else big[k] for k in range(3)]) * s >= 0 for i in range(3))


def interiors_disjoint(T1, T2):
    for T in (T1, T2):
        for i in range(3):
            p, q = T[i], T[(i + 1) % 3]
            nx, ny = q[1] - p[1], p[0] - q[0]
            pr1 = [nx * x + ny * y for x, y in T1]
            pr2 = [nx * x + ny * y for x, y in T2]
            if max(pr1) <= min(pr2) or max(pr2) <= min(pr1):
                return True
    return False


def tiles(parts, big):
    P = [tri_pts(t) for t in parts]
    Bg = tri_pts(big)
    ok_in = all(inside(x, Bg) for T in P for x in T)
    ok_area = sum(abs(area2(*T)) for T in P) == abs(area2(*Bg))
    ok_dis = all(interiors_disjoint(P[i], P[j]) for i in range(len(P)) for j in range(i + 1, len(P)))
    ok_nondeg = all(area2(*T) != 0 for T in P)
    return ok_in and ok_area and ok_dis and ok_nondeg


# ---------------------------------------------------------------- Section 4
def pi_bounds(terms=30):
    """Machin: pi = 16 atan(1/5) - 4 atan(1/239); alternating series partial sums bracket atan(x) for 0 < x < 1"""
    def atan_lo_hi(x):
        s, lo, hi = F(0), None, None
        for k in range(terms):
            s += F((-1) ** k) * x ** (2 * k + 1) / (2 * k + 1)
            if k % 2:
                lo = s
            else:
                hi = s
        return lo, hi
    a_lo, a_hi = atan_lo_hi(F(1, 5))
    b_lo, b_hi = atan_lo_hi(F(1, 239))
    return 16 * a_lo - 4 * b_hi, 16 * a_hi - 4 * b_lo


A0S, B0S = F(157, 50), F(22, 7)


def sine_minorant():
    a0, b0 = A0S, B0S
    return u_trim([0, a0, 0, -b0 ** 3 / 6, 0, a0 ** 5 / 120, 0, -b0 ** 7 / 5040])


def f_poly():
    return u_mul([0, 0, 0, 0, 1], [3, 0, 5, 0, 6])


def upper_rows():
    S = sine_minorant()
    S1 = u_compose(S, lin(1, -1))
    w = u_sub([1], u_scale(u_pow(X1, 2), F(1, 2)))
    f = f_poly()
    return [('upper_1', 0, F(1, 2), u_mul(f, w, u_pow(S, 3)), F(11869, 10 ** 6)),
            ('upper_2', F(1, 2), F(5, 8), u_mul(f, w, u_pow(S1, 3)), F(30175, 10 ** 6)),
            ('upper_3', F(5, 8), 1, u_mul([F(15, 16)], w, u_pow(S1, 3)), F(39518, 10 ** 6))]


def lower_rows():
    S = sine_minorant()
    S1 = u_compose(S, lin(1, -1))
    g = u_mul([0, 0, 1], u_add(u_scale(u_pow(X1, 4), F(1, 2)), u_scale(u_pow(X1, 6), F(1, 3))))
    return [('lower_1', 0, F(1, 2), u_mul(g, S), F(698, 10 ** 6)),
            ('lower_2', F(1, 2), 1, u_mul(g, S1), F(40554, 10 ** 6))]


def moment_polys():
    x = X1
    w = u_scale(u_pow(x, 2), 2)
    Lz = [F(3, 8), 0, F(3, 64), 0, F(-35, 1024)]
    Vz = [F(24, 5), 0, F(-16, 15), 0, F(-7, 48), 0, F(7, 1152)]
    L2 = u_compose(Lz, w)
    V2 = u_compose(Vz, w)
    Dst = u_sub(u_scale(L2, F(88, 5)), u_scale(u_mul(u_pow(x, 5), V2), F(17, 3)))
    Rst = [1, 0, 0, 0, F(1, 10), 0, 0, 0, F(-1, 72)]
    R1 = u_eval(Rst, 1)
    core = u_sub([R1], u_mul(x, Rst))
    w2 = u_pow(w, 2)
    out = {}
    for tag, Aa, Bb in (('lower', u_sub([1], w2), u_sub([4], w2)),
                        ('upper', u_add([25], u_scale(w, -28), u_scale(w2, -6)), u_add([80], u_scale(w, -28), u_scale(w2, -6)))):
        BA = u_sub(Bb, Aa)
        P = u_sub(u_scale(u_mul(Aa, BA, u_pow(core, 2)), 32), u_scale(u_mul(u_add(u_mul(BA, u_sub(w2, w)), u_scale(Aa, 2)), Bb), 9))
        out[tag] = (P, Bb)
    return dict(Lz=Lz, Vz=Vz, L2=L2, V2=V2, Dst=Dst, Rst=Rst, P=out)


# ---------------------------------------------------------------- results.json helpers (data)
def rj_poly(pj, nvars):
    return {tuple(t['powers']): F(t['coefficient']) for t in pj['terms']}


def as_dict1(p):
    return {(i,): c for i, c in enumerate(p) if c}


def decide(src=None, paper='665', kappa_z=Z_KAPPA, printed=None, vertices=None, with_lower=False):
    global VERT
    src = src or Sources()
    checks = []
    t0 = time.time()
    base = DIRS[paper]
    cert = src.text(base + CERT)
    coup = src.text(base + COUP)
    vol = src.text(base + VOL)
    pr = dict(minima=PRINTED_MINIMA, cbe=CBE_PRINTED, tri=TRI_ROWS, scal=SCALAR_ROWS, q=Q_ROWS)
    if printed:
        pr.update(printed)
    saved_vert = VERT
    if vertices:
        VERT = dict(VERT)
        VERT.update(vertices)
    try:
        return _decide(src, checks, cert, coup, vol, base, pr, kappa_z, with_lower, t0, paper)
    finally:
        VERT = saved_vert


def _decide(src, checks, cert, coup, vol, base, pr, kappa_z, with_lower, t0, paper):
    flat = lambda s: ''.join(s.split())  # noqa: E731
    fc, fk, fv = flat(cert), flat(coup), flat(vol)
    check(checks, 'the paper prints kappa, Theta, c and the constants used here (06-coupling.tex)',
          all(k in fk for k in ('D=158,\\qquadh=\\frac{17}{10}', '4(z_1,\\ldots,z_{11})={}&(-43,-45,-63,21,183,208,61,46,101,79,-41)',
                                 'c&=\\frac25-\\frac3{10}vb' if paper == '665' else 'c=\\frac25-\\frac3{10}vb',
                                 'n^2(1-n)(105+5n)+t^2(4+360n-586n^2)-4t^4', 'G&=\\frac{27}{100}(1+u^2)u^2',
                                 'P_0=300m+30hv+160h\\delta')), '06-coupling.tex:62-75, :189-198, :405-416, :455-457')
    if paper == '665':
        intro = flat(src.text(base + 'build/sections/01-introduction.tex'))
        check(checks, 'the theorem as stated (01-introduction.tex:14-24)', 'S^2(1/\\sqrt3)\\timesS^2(1/\\sqrt3)' in intro and 'K_g(\\sigma_0)=0' in intro)
    check(checks, 'the paper prints the two tables and the zero list (07-certificates.tex)',
          all(k in fc for k in ('$\\mathcalA$&$OSC$&$8$&$0$&$16000$&$53000000$', '&$CBE$&$10$&$2$&$13/100$&$4$',
                                 '$F+12c\\delta^2L_b$&$OSC$&$9$&$6$&$19/100$&---', '$-Z_*$&$8$&$[0,1/16]$&$13/100$',
                                 'thezerosareexactly$i+j\\le2$')),
          '07-certificates.tex:106-120, :223-246, :339-345')
    P = build(kappa_z)
    n = P['n']
    # ---------------- A. two derivations of every certificate polynomial
    check(checks, 'A. matrix A: eq:21 at sigma = 1 from Section 6 = the appendix instructions (three entries)',
          all(sub(x, y) == {} for x, y in zip(P['A6'], P['A7'])))
    check(checks, 'A. matrix B: (H_v, H_b, S* K J) from Section 6 = the appendix instructions (H*, its exchange, S*{...})',
          all(sub(x, y) == {} for x, y in zip(P['B6'], P['B7'])))
    check(checks, 'A. scalar rows: L_v and F + 12 c delta^2 L_b from eq:23 = the appendix instructions',
          sub(P['Lv'], P['Lv7']) == {} and sub(P['Fplus6'], P['Fplus7']) == {})
    # ---------------- D. identities that tie the certificates to Section 6
    v, b, one = P['v'], P['b'], P['one']
    # the clearing of eq:22's diagonal: v K r_v (2 Theta R_v - Q_v) = H_v, with R_v = 4(1+v)/r_v and
    # Q_v = X_v + D/K + d_v kappa + 2 kappa/(3v): the polynomial form of both sides
    lhs = sub(scale(mul(mul(mul(P['Theta'], add(one, v)), v), P['K']), 8),
              mul(P['r_v'], total(mul(mul(v, P['K']), P['X_v']), scale(v, D_), mul(mul(v, P['K']), P['d1k']),
                                  scale(mul(P['K'], P['kap']), F(2, 3)))))
    check(checks, 'D. eq:22 diagonal clearing: v K r_v (2 Theta R_v - Q_v) = H_v (polynomial identity)', sub(lhs, P['H_v']) == {})
    check(checks, 'D. r_v = 8v + (1-v)^2 and S* = (alpha b r_v + v r_b/alpha)/2 (the AM-GM pair)',
          sub(P['r_v'], add(scale(v, 8), pw(sub(one, v), 2, n))) == {} and
          sub(P['S_star'], scale(add(scale(mul(b, P['r_v']), ALPHA), scale(mul(v, {(e[1], e[0]): c for e, c in P['r_v'].items()}), 1 / ALPHA)), F(1, 2))) == {})
    check(checks, 'D. P0 = Pk + 30 h v', sub(P['P0'], add(P['Pk'], scale(v, 30 * h_))) == {})
    lam_ax = P['lam_v']
    check(checks, 'D. axial: lambda_ax + 32 v delta = 6(a^2+s^2) + 32 a delta',
          sub(add(lam_ax, scale(mul(v, P['delta']), 32)), add(scale(add(pw(P['a'], 2, n), pw(P['s'], 2, n)), 6), scale(mul(P['a'], P['delta']), 32))) == {})
    check(checks, 'D. 10/9 (h - 67/50 - 27/100 vb) = c', sub(scale(sub(const(h_ - F(67, 50), n), scale(mul(v, b), F(27, 100))), F(10, 9)), P['c']) == {})
    # sigma monotonicity (06-coupling.tex:490-498), sigma as a third variable
    n3 = 3
    v3, b3, sg = var(0, n3), var(1, n3), var(2, n3)
    one3 = const(1, n3)

    def up(Pp):
        return {e + (0,): c for e, c in Pp.items()}
    m3, d3, kap3 = up(P['m']), up(P['delta']), up(P['kap'])
    lam_s = sub(scale(total(mul(sg, pw(v3, 2, n3)), pw(b3, 2, n3), scale(v3, -1), scale(b3, -1)), 6), scale(d3, 26))
    K2s = sub(mul(m3, total(const(42, n3), scale(pw(b3, 2, n3), 3), scale(pw(v3, 2, n3), 10))), scale(lam_s, h_))
    K1s = total(scale(K2s, 5), mul(m3, add(scale(mul(v3, sg), 300), scale(pw(v3, 2, n3), 140))), scale(mul(mul(d3, v3), sg), 160 * h_))
    K12s = add(mul(m3, add(scale(v3, 75), scale(mul(pw(v3, 2, n3), sg), 35))), scale(mul(d3, v3), 40 * h_))
    P0s, Pks, Pls = up(P['P0']), up(P['Pk']), up(P['Pl'])
    opsg = add(one3, sg)
    As = (sub(mul(P0s, sub(mul(v3, K1s), scale(kap3, 5))), mul(mul(opsg, pw(v3, 2, n3)), pw(Pks, 2, n3))),
          sub(mul(P0s, sub(mul(v3, K2s), kap3)), mul(mul(opsg, pw(v3, 2, n3)), pw(Pls, 2, n3))),
          sub(mul(P0s, mul(v3, K12s)), mul(mul(opsg, pw(v3, 2, n3)), mul(Pks, Pls))))
    hv = scale(v3, 30 * h_)
    rhs = (mul(pw(v3, 2, n3), pw(hv, 2, n3)), mul(pw(v3, 2, n3), add(pw(Pls, 2, n3), scale(mul(v3, P0s), 6 * h_))),
           scale(mul(pw(v3, 2, n3), mul(hv, Pls)), -1))
    check(checks, 'D. -d/dsigma A_sigma = v^2 [ (30hv, -Pl)(30hv, -Pl)^T + diag(0, 6 h v P0) ] (sigma symbolic)',
          all(sub(scale(diff(x, 2), -1), y) == {} for x, y in zip(As, rhs)) and
          all(sub({e[:2]: c for e, c in compose(x, [v3, b3, one3], n3).items()}, y) == {} for x, y in zip(As, P['A6'])))
    # eq:20: the enlargement and the exact division (06-coupling.tex:342-421)
    n4 = 3
    V4, B4, U4 = var(0, n4), var(1, n4), var(2, n4)
    o4 = const(1, n4)
    W_ = const(0, n4)
    Vv = total(const(2, n4), scale(V4, -1), scale(B4, -1))        # (V, W) = (delta, 0)
    gv = total(scale(total(const(4, n4), B4, W_), F(7, 12)), scale(V4, -1), scale(Vv, 2))
    gb = total(scale(total(const(4, n4), V4, Vv), F(7, 12)), scale(B4, -1), scale(W_, 2))
    check(checks, 'D. eq:20 enlarged g_v = 19/3 - 3v - 17/12 b, g_b = 7/2 - 19/12 b',
          sub(gv, total(const(F(19, 3), n4), scale(V4, -3), scale(B4, F(-17, 12)))) == {} and
          sub(gb, add(const(F(7, 2), n4), scale(B4, F(-19, 12)))) == {})
    Mv = sub(o4, scale(sub(V4, B4), F(3, 8)))
    Mb = sub(o4, scale(sub(B4, V4), F(3, 8)))
    Pq, Qq = o4, U4                                                 # P = 1, Q = u
    left = mul(mul(add(const(F(67, 50), n4), scale(mul(V4, B4), F(27, 100))), add(pw(Pq, 2, n4), pw(Qq, 2, n4))),
               add(mul(B4, pw(Pq, 2, n4)), mul(V4, pw(Qq, 2, n4))))
    right = add(scale(mul(mul(mul(V4, B4), pw(add(Pq, Qq), 2, n4)), add(mul(gv, pw(Pq, 2, n4)), mul(gb, pw(Qq, 2, n4)))), F(27, 128)),
                scale(mul(mul(mul(V4, B4), add(Pq, Qq)), add(mul(Mv, pw(Pq, 3, n4)), mul(Mb, pw(Qq, 3, n4)))), F(3, 4)))
    SP = scalar_polys()

    def lift_u(p):
        return {(0, 0, i): c for i, c in enumerate(p) if c}
    target = total(mul(lift_u(SP['A']), B4), mul(mul(lift_u(SP['A']), pw(U4, 2, n4)), V4), mul(lift_u(SP['G']), mul(pw(V4, 2, n4), B4)),
                   mul(lift_u(SP['H']), mul(V4, pw(B4, 2, n4))), scale(mul(lift_u(SP['L']), mul(V4, B4)), -1))
    check(checks, 'D. eq:20: (left - enlarged right)/(v b P^4) = A/v + A u^2/b + G v + H b - L (cleared by v b)', sub(sub(left, right), target) == {})
    v1 = X1
    two_v = lin(2, -1)
    D0sc_num = u_add(u_mul(u_sub([h_], SP['A0']), two_v), u_scale(v1, F(2, 5) * h_))   # (2-v) D0^sc
    check(checks, 'D. eq:19: (2-v)(4 C0 D0^sc - (2A0+L0)^2) is the printed quintic',
          u_sub(u_sub(u_scale(u_mul(SP['C0'], D0sc_num), 4), u_mul(two_v, u_pow(u_add(u_scale(SP['A0'], 2), SP['L0']), 2))), SP['Q5']) == [])
    # the g-majorant (06-coupling.tex:348-371)
    r = X1
    sig = u_scale(u_sub(u_scale(r, 3), u_pow(r, 3)), F(1, 2))
    gap_ok = (u_sub(u_sub([1], sig), u_scale(u_mul(u_pow(lin(-1, 1), 2), lin(2, 1)), F(1, 2))) == [] and
              u_sub(u_add([1], sig), u_scale(u_mul(lin(2, -1), u_pow(lin(1, 1), 2)), F(1, 2))) == [])
    bracket = u_sub(u_mul([0, 4], lin(3, 1)), u_mul(lin(-1, 1), lin(2, 1), u_pow(lin(1, 1), 2)))
    # 2 - (r-1)(r+2)/2 (1 + (1+sigma)/(2r)) = (2-r)/(8r) bracket, cleared by 8r
    lhs8 = u_sub([0, 16], u_mul(u_scale(u_mul(lin(-1, 1), lin(2, 1)), 2), u_add(u_scale(r, 2), u_add([1], sig))))
    gap_ok = gap_ok and u_sub(lhs8, u_mul(lin(2, -1), bracket)) == []
    bb = bern_interval(bracket, 1, 2, 4)
    check(checks, 'D. g-majorant: 1 -+ sigma factorizations, the gap identity, bracket(1) = 16, bracket(2) = 4, concave, Bernstein >= 4 on [1,2]',
          gap_ok and u_eval(bracket, 1) == 16 and u_eval(bracket, 2) == 4 and min(bb) >= 4 and
          max(bern_interval(u_diff(u_diff(bracket)), 1, 2, 2)) < 0, str(bb))
    # c >= 1/10 and M >= 1/4 on D
    cmin = min(min(bern_tri(sub(P['c'], const(F(1, 10), n)), t, 2).values()) for t in (('O', 'S', 'C'), ('O', 'C', 'W0'), ('S', 'C', 'U')))
    Mmin = min(min(bern_tri(sub(P['M'], const(F(1, 4), n)), t, 1).values()) for t in (('O', 'S', 'C'), ('O', 'C', 'W0'), ('S', 'C', 'U')))
    check(checks, 'D. c >= 1/10 and M >= 1/4 (so m >= 1/16) on D, by Bernstein coefficients', cmin >= 0 and Mmin >= 0)
    # ---------------- C. coverings
    check(checks, 'C. OSC, OCW0, SCU tile D = O U W0 (containment, area, disjoint interiors)',
          tiles([('O', 'S', 'C'), ('O', 'C', 'W0'), ('S', 'C', 'U')], ('O', 'U', 'W0')))
    check(checks, 'C. OAS, ASE, ACE, SBE, CBE, SUB tile D+ = OCU; OSC and SCU tile OCU',
          tiles([('O', 'A', 'S'), ('A', 'S', 'E'), ('A', 'C', 'E'), ('S', 'B', 'E'), ('C', 'B', 'E'), ('S', 'U', 'B')], ('O', 'C', 'U'))
          and tiles([('O', 'S', 'C'), ('S', 'C', 'U')], ('O', 'C', 'U')))
    # ---------------- B. scalar interval certificates
    computed = {'interval': {}, 'triangle': {}}
    for key, N, ivs, lb in pr['scal']:
        p = SP['rows'][key]
        rows = []
        ok2 = True
        for (r0, r1) in ivs:
            h1 = bern_interval(p, r0, r1, N)
            h2 = bern_interval_hom(p, r0, r1, N)
            ok2 = ok2 and h1 == h2
            rows.append((F(r0), F(r1), h1))
        strict = key.startswith('eq19')
        ok = all((min(h) > lb if strict else min(h) >= lb) for _, _, h in rows) and len(p) - 1 <= N and ok2
        mins = [min(h) for _, _, h in rows]
        computed['interval'][key] = (p, N, rows)
        check(checks, 'B. scalar %s: degree %d, Bernstein %d on %s, every coefficient %s %s' % (key, len(p) - 1, N, [(str(a), str(b_)) for a, b_ in ivs], '>' if strict else '>=', lb),
              ok, 'minima ' + ', '.join(str(x) for x in mins) + ('' if ok2 else '; THE TWO EXPANSIONS DISAGREE'))
        if key in pr['minima']:
            check(checks, 'B. printed minima of %s on the two intervals (07-certificates.tex:122-127)' % key,
                  tuple(mins) == tuple(pr['minima'][key]), '%s vs printed %s' % ([str(x) for x in mins], [str(x) for x in pr['minima'][key]]))
    # ---------------- B. triangle certificates
    objs = {'A': P['A6'], 'B': P['B6'], 'Lv': (P['Lv'],), 'Fplus': (P['Fplus6'],)}
    for key, obj, tri, N, nz, lb, dlb in pr['tri']:
        ents = objs[obj]
        co = [bern_tri(e, tri, N) for e in ents]
        co2 = [bern_tri_hom(e, tri, N) for e in ents]
        same = co == co2
        idx = sorted(co[0])
        zeros = {ij for ij in idx if all(c[ij] == 0 for c in co)}
        if len(ents) == 3:
            nonz = [ij for ij in idx if ij not in zeros]
            dmin = min(min(co[0][ij], co[1][ij]) for ij in nonz)
            det = {ij: co[0][ij] * co[1][ij] - co[2][ij] ** 2 for ij in idx}
            detmin = min(det[ij] for ij in nonz)
            ok = dmin >= lb and detmin >= dlb
            detail = 'min diagonal %s, min determinant %s' % (dmin, detmin)
        else:
            nonz = [ij for ij in idx if ij not in zeros]
            dmin = min(co[0][ij] for ij in nonz)
            detmin, det = None, None
            ok = dmin >= lb
            detail = 'min nonzero coefficient %s' % dmin
        want_zero = ZEROS.get(key, set())
        ok_z = zeros == want_zero and len(zeros) == nz
        computed['triangle'][key] = (ents, N, co, det, zeros, dmin, detmin, tri)
        check(checks, 'B. triangle %s %s N=%d: bounds %s%s, all coefficients nonnegative/PSD, %d zero(s) exactly as printed' % (
            key, ''.join(tri), N, lb, '' if dlb is None else ' / det %s' % dlb, nz),
            ok and ok_z and same and all(sum(e) <= N for ent in ents for e in ent),
            detail + '; zeros %s%s' % (sorted(zeros), '' if same else '; THE TWO EXPANSIONS DISAGREE'))
    cbe = computed['triangle']['eq22.B.CBE'][2]
    got = {ij: tuple(c[ij] for c in cbe) for ij in pr['cbe']}
    check(checks, 'B. the three printed CBE triples at (8,0), (8,1), (8,2) (07-certificates.tex:316-323)', got == pr['cbe'],
          str({k: [str(x) for x in v_] for k, v_ in got.items()}))
    # ---------------- B. the potential F (lem:potential-certificate)
    nt = 2
    N_, T_ = var(0, nt), var(1, nt)
    Fst = compose(P['Fp'], [add(sub(const(1, nt), N_), T_), sub(sub(const(1, nt), N_), T_)], nt)
    even = all(e[1] % 2 == 0 for e in Fst)
    fj = {j: u_trim([Fst.get((i, 2 * j), 0) for i in range(12)]) for j in range(5)}
    pf0 = u_scale(u_mul([0, 0, 0, 1], lin(1, -1), [10256, -83607, 222537, -151593, 53511]), F(1, 240))
    pf1 = u_scale(u_mul([0, 1], [10564, 67782, -289776, 523719, -418926, 19389]), F(1, 60))
    printed_f = {0: pf0, 1: pf1, 2: u_scale(F_PRINTED[2][1], F(1, 60)), 3: u_scale(F_PRINTED[3][1], F(1, 10)), 4: F_PRINTED[4][1]}
    check(checks, 'B. F*(n,t) = F(1-n+t, 1-n-t) is even in t with exactly the five printed f_j (07-certificates.tex:366-377)',
          even and all(fj[j] == printed_f[j] for j in range(5)) and max(e[1] for e in Fst) == 8)
    one_n = lin(1, -1)
    hi = {i: u_add(*[u_scale(u_mul(fj[j], u_pow(one_n, 2 * j)), F(comb(i, j), comb(4, j))) for j in range(i + 1)]) for i in range(5)}
    divs = {0: u_mul([0, 0, 0, 1], one_n), 1: u_mul([0, 1], one_n), 2: one_n, 3: one_n, 4: one_n}
    qi = {}
    okdiv = True
    for i in range(5):
        q, rem = u_divexact(hi[i], divs[i])
        okdiv = okdiv and rem == [] and u_sub(u_mul(q, divs[i]), hi[i]) == []
        qi[i] = q
    check(checks, 'B. h_i = d_i q_i exactly, i = 0..4, with q_i of degrees 4, 6, 7, 7, 7', okdiv and [len(qi[i]) - 1 for i in range(5)] == [4, 6, 7, 7, 7],
          str([len(qi[i]) - 1 for i in range(5)]))
    # second way: sum_i h_i C(4,i) t^(2i) ((1-n)^2 - t^2)^(4-i) = (1-n)^8 F*
    lhs = {}
    on2 = sub(pw(sub(const(1, nt), N_), 2, nt), pw(T_, 2, nt))
    for i in range(5):
        lhs = add(lhs, scale(mul(mul({(k, 0): c for k, c in enumerate(hi[i]) if c}, pw(T_, 2 * i, nt)), pw(on2, 4 - i, nt)), comb(4, i)))
    check(checks, 'B. sum_i h_i C(4,i) z^i (1-z)^(4-i) = F*, z = t^2/(1-n)^2 (cleared by (1-n)^8), and F*(1,0) = f_0(1) = 0',
          sub(lhs, mul(pw(sub(const(1, nt), N_), 8, nt), Fst)) == {} and u_eval(fj[0], 1) == 0)
    for i, N, lb in pr['q']:
        rows = []
        ok2 = True
        for (r0, r1) in QUARTERS:
            h1 = bern_interval(qi[i], r0, r1, N)
            ok2 = ok2 and h1 == bern_interval_hom(qi[i], r0, r1, N)
            rows.append((r0, r1, h1))
        mins = [min(hh) for _, _, hh in rows]
        computed['interval']['eq23.F_quarters.%d' % i] = (qi[i], N, rows)
        check(checks, 'B. q_%d on the four quarters, Bernstein degree %d, every coefficient >= %s' % (i, N, lb),
              len(qi[i]) - 1 <= N and all(x >= lb for x in mins) and ok2, 'minima ' + ', '.join(str(x) for x in mins))
    # ---------------- E. Section 4
    plo, phi = pi_bounds()
    S = sine_minorant()
    check(checks, 'E. a0 = 157/50 < pi < 22/7 = b0 (pi enclosed in [%s.., %s..] by Machin with alternating tails)' % (str(float(plo))[:12], str(float(phi))[:12]),
          A0S < plo and phi < B0S)
    check(checks, 'E. S(z) coefficients 157/50, -5324/1029, 95388992557/37500000000, -155897368/259416045 (04-volume.tex:306-308)',
          S == [0, F(157, 50), 0, F(-5324, 1029), 0, F(95388992557, 37500000000), 0, F(-155897368, 259416045)])
    floor_ = A0S - B0S ** 3 / 24 - B0S ** 7 / 322560
    Sz = S[1:]
    check(checks, 'E. S(z) >= z (a0 - b0^3/24 - b0^7/322560) >= 9/5 z on [0,1/2]: the floor %s > 9/5, and S(z)/z - 9/5 has Bernstein >= 0' % floor_,
          floor_ > F(9, 5) and min(bern_interval(u_sub(Sz, [F(9, 5)]), 0, F(1, 2), 6)) >= 0)
    ups = []
    for tag, r0, r1, integ, lb in upper_rows():
        val = A0S * 9 / 48 * u_integral(integ, r0, r1)
        ups.append((tag, r0, r1, integ, val, lb))
        check(checks, 'E. upper-deficit row [%s,%s]: degree %d, (9 a0/48) * integral > %s' % (r0, r1, len(integ) - 1, lb),
              val > lb and len(integ) - 1 == {'upper_1': 31, 'upper_2': 31, 'upper_3': 23}[tag], '%.9f' % float(val))
    tot = sum(u[4] for u in ups)
    check(checks, 'E. the three rows sum to more than 163/2000 > 2/25 > 3/40; printed floors sum to 81562/10^6 > 163/2000',
          tot > F(163, 2000) > F(2, 25) > F(3, 40) and sum(u[5] for u in ups) > F(163, 2000), '%.9f' % float(tot))
    f = f_poly()
    u = X1
    beta = F(25, 39)
    red = u_sub(u_mul(u_sub([3], u_scale(u_pow(u, 2), 4)), [1]), u_mul(u_add([3], u_scale(u_pow(u, 2), 5), u_scale(u_pow(u, 4), 6)), u_pow(u_sub([1], u_pow(u, 2)), 3)))
    fac = u_trim([6, 0, -13, 0, 6])
    check(checks, 'E. f(5/8) = 7511875/8388608 < 1; beta^2(3-beta) at u = 5/8 is 57500/59319 > 15/16; the comparison reduces to u^6(6 - 13u^2 + 6u^4) >= 0, positive on [0,5/8]',
          u_eval(f, F(5, 8)) == F(7511875, 8388608) < 1 and beta ** 2 * (3 - beta) == F(57500, 59319) > F(15, 16) and
          u_sub(red, u_mul([0, 0, 0, 0, 0, 0, 1], fac)) == [] and min(bern_interval(fac, 0, F(5, 8), 4)) > 0 and
          min(bern_interval(u_diff(f), 0, F(5, 8), 11)) >= 0)
    MP = moment_polys()
    check(checks, 'E. L(2x^2) = 3/8 + 3/16 x^4 - 35/64 x^8 and V(2x^2) = 24/5 - 64/15 x^4 - 7/3 x^8 + 7/18 x^12 (04-volume.tex:634-636)',
          MP['L2'] == u_trim([F(3, 8), 0, 0, 0, F(3, 16), 0, 0, 0, F(-35, 64)]) and
          MP['V2'] == u_trim([F(24, 5), 0, 0, 0, F(-64, 15), 0, 0, 0, F(-7, 3), 0, 0, 0, F(7, 18)]))
    # H''' = L z^(-5/2), Phi''' = V: H = z^(1/2) + z^(5/2)/40 - z^(9/2)/1152 (exponents as Fractions)
    Hterms = {F(1, 2): F(1), F(5, 2): F(1, 40), F(9, 2): F(-1, 1152)}
    H3 = {}
    for e, cc in Hterms.items():
        H3[e - 3 + F(5, 2)] = cc * e * (e - 1) * (e - 2)
    Lfrom = {F(i): c_ for i, c_ in enumerate(MP['Lz']) if c_}
    Phi = u_add(u_scale(u_mul([0, 1], u_pow([1, 0, F(1, 40), 0, F(-1, 1152)], 2)), 16), [0, 9, -9])
    check(checks, "E. H''' = L(z) z^(-5/2) and Phi''' = V(z), Phi = 16 H^2 + 9z(1-z)",
          {k: v_ for k, v_ in H3.items() if v_} == Lfrom and u_diff(u_diff(u_diff(Phi))) == u_trim(MP['Vz']))
    certs4 = {}
    for key, poly, N, ivs, lb in (('eq9.L', MP['L2'], 8, [(0, 1)], F(1, 100)), ('eq9.third_derivative_sign', MP['Dst'], 17, QUARTERS, F(2, 5)),
                                  ('eq9.endpoint.lower', MP['P']['lower'][0], 22, [(0, F(37, 100))], F(1)),
                                  ('eq9.endpoint.upper', MP['P']['upper'][0], 22, [(0, F(37, 100))], F(1))):
        rows = [(F(a_), F(b_), bern_interval(poly, a_, b_, N)) for a_, b_ in ivs]
        ok2 = all(hh == bern_interval_hom(poly, a_, b_, N) for a_, b_, hh in rows)
        mins = [min(hh) for _, _, hh in rows]
        certs4[key] = (poly, N, rows)
        computed['interval'][key] = (poly, N, rows)
        check(checks, 'E. %s: degree %d, Bernstein %d, every coefficient > %s' % (key, len(poly) - 1, N, lb),
              len(poly) - 1 == N and all(x > lb for x in mins) and ok2, 'least ' + str(min(mins)))
    least = {'eq9.L': F(1, 64), 'eq9.third_derivative_sign': F(2459668689, 5793382400),
             'eq9.endpoint.lower': F(58454914732902747377800095783827783501884053, 50000000000000000000000000000000000000000000),
             'eq9.endpoint.upper': F(132428032291164570287168821949356607977047, 770000000000000000000000000000000000000)}
    if pr.get('least'):
        least.update(pr['least'])
    check(checks, 'E. the four printed least coefficients 1/64, 2459668689/5793382400, and those of P_-, P_+ (04-volume.tex:638-649)',
          all(min(min(hh) for _, _, hh in certs4[k][2]) == least[k] for k in least))
    w = u_scale(u_pow(X1, 2), 2)
    check(checks, 'E. 1 + w^2/40 - w^4/1152 = R*(x) at w = 2x^2 (so H(2) - H(w) = sqrt2 (R*(1) - x R*(x)))',
          u_compose([1, 0, F(1, 40), 0, F(-1, 1152)], w) == u_trim(MP['Rst']))
    n5 = 4
    tt, Hw, H2, ww = (var(i, n5) for i in range(4))
    o5 = const(1, n5)
    Jt = sub(scale(pw(add(mul(sub(o5, tt), Hw), mul(tt, H2)), 2, n5), 16),
             add(mul(sub(o5, tt), add(scale(pw(Hw, 2, n5), 16), scale(mul(ww, sub(o5, ww)), 9))), mul(tt, sub(scale(pw(H2, 2, n5), 16), const(18, n5)))))
    Jr = add(scale(mul(mul(tt, sub(o5, tt)), pw(sub(H2, Hw), 2, n5)), -16), scale(add(mul(sub(o5, tt), sub(pw(ww, 2, n5), ww)), scale(tt, 2)), 9))
    wv = X1
    nonempty = u_sub(u_mul(u_add([25], u_scale(wv, -28), u_scale(u_pow(wv, 2), -6)), u_sub([4], u_pow(wv, 2))),
                     u_mul(u_sub([1], u_pow(wv, 2)), u_add([80], u_scale(wv, -28), u_scale(u_pow(wv, 2), -6))))
    check(checks, 'E. two-point J = -16t(1-t)(H(2)-H(w))^2 + 9((1-t)(w^2-w) + 2t); t_+ - t_- numerator = (2-w)(10-37w); B_-, B_+ > 0 on [0,37/100]',
          sub(Jt, Jr) == {} and nonempty == u_mul(lin(2, -1), lin(10, -37)) and
          min(bern_interval(MP['P']['lower'][1], 0, F(37, 100), 4)) > 0 and min(bern_interval(MP['P']['upper'][1], 0, F(37, 100), 4)) > 0)
    qd = [25, F(-346, 25), F(31, 45)]
    check(checks, 'E. 32 (11/20) = 88/5, (4 sqrt2)^2 = 32 < 289/9; (37/100)^2 = 1369/10000 >= 5/37; q(z) = 25 - 346z/25 + 31z^2/45 has q(2) = 17/225, q\'(2) = -2494/225 < 0, q\'\' = 62/45',
          32 * F(11, 20) == F(88, 5) and 32 < F(289, 9) and F(37, 100) ** 2 >= F(5, 37) and u_eval(qd, 2) == F(17, 225) and
          u_eval(u_diff(qd), 2) == F(-2494, 225) and u_diff(u_diff(qd)) == [F(62, 45)])
    # Phi(z) - 121/25 z^2 >= z q(z): with 1 + z^2/40 - z^4/1152 >= 1 + 31 z^2/1440 on [0,2]
    gapH = u_sub([1, 0, F(1, 40), 0, F(-1, 1152)], [1, 0, F(31, 1440)])
    lowPhi = u_add(u_scale(u_mul([0, 1], u_pow([1, 0, F(31, 1440)], 2)), 16), [0, 9, -9])
    check(checks, 'E. the moment lower bound: 1 + z^2/40 - z^4/1152 - (1 + 31z^2/1440) >= 0 on [0,2]; 16z(1+31z^2/1440)^2 + 9z(1-z) - 121z^2/25 - z q(z) >= 0 on [0,2]',
          min(bern_interval(gapH, 0, 2, 4)) >= 0 and min(bern_interval(u_sub(u_sub(lowPhi, [0, 0, F(121, 25)]), u_mul([0, 1], qd)), 0, 2, 5)) >= 0)
    g1 = lambda z: 28 * z + 6 * z * z - 25  # noqa: E731
    check(checks, 'E. the measure 9/32 at 2, rest at 0: constraint expectations -5/2 and -1/8',
          F(9, 32) * g1(2) + F(23, 32) * g1(0) == F(-5, 2) and F(9, 32) * (1 - 4) + F(23, 32) * 1 == F(-1, 8))
    Gp = [1, 0, F(1, 8), 0, F(-1, 128)]
    zsq = u_sub(u_pow([1, F(1, 2), F(-1, 8)], 2), [1, 1])
    check(checks, "E. G'(c) = 1 + b^2/8 - b^4/128 >= 0 on [0,2], and with z = b^2/4: (1 + z/2 - z^2/8)^2 - (1+z) = -z^3/8 + z^4/64 <= 0 on [0,1]",
          min(bern_interval(Gp, 0, 2, 4)) >= 0 and zsq == u_trim([0, 0, 0, F(-1, 8), F(1, 64)]) and max(bern_interval(zsq, 0, 1, 4)) <= 0)
    lows = []
    if with_lower:
        for tag, r0, r1, integ, lb in lower_rows():
            lb = pr.get('lower', {}).get(tag, lb)
            val = A0S ** 3 / 27 * u_integral(integ, r0, r1)
            lows.append((tag, r0, r1, integ, val, lb))
            check(checks, 'E. lower-volume row [%s,%s] (08-classification.tex:205-214): degree %d, (a0^3/27) * integral > %s' % (r0, r1, len(integ) - 1, lb),
                  val > lb and len(integ) - 1 == 15, '%.9f' % float(val))
        base_c = 2 * (A0S ** 2 - 4) / 9
        check(checks, 'E. 2(a0^2-4)/9 = 4883/3750 and base + the two rows > 1343/1000 > 4/3 (printed floors too)',
              base_c == F(4883, 3750) and base_c + sum(x[4] for x in lows) > F(1343, 1000) > F(4, 3) and
              base_c + sum(x[5] for x in lows) > F(1343, 1000), '%.9f' % float(base_c + sum(x[4] for x in lows)))
    # ---------------- R. results.json, read as data
    rj = json.loads(src.text(base + RESULTS))
    mism = []
    for row in rj['interval_certificates']:
        k = row['key']
        if k not in computed['interval']:
            continue
        poly, N, rows = computed['interval'][k]
        if rj_poly(row['polynomial'], 1) != as_dict1(poly) or row['bernstein_degree'] != N:
            mism.append(k + ' polynomial/degree')
        if len(row['intervals']) != len(rows):
            mism.append(k + ' intervals')
            continue
        for iv, (r0, r1, hh) in zip(row['intervals'], rows):
            mn = min(hh)
            if (F(iv['left']), F(iv['right'])) != (r0, r1) or [F(x) for x in iv['coefficients']] != hh or F(iv['minimum']) != mn or \
                    iv['minimizing_indices'] != [i for i, x in enumerate(hh) if x == mn] or iv['zero_indices'] != [i for i, x in enumerate(hh) if x == 0]:
                mism.append('%s on [%s,%s]' % (k, r0, r1))
    seen_int = [r['key'] for r in rj['interval_certificates'] if r['key'] in computed['interval']]
    for row in rj['triangle_certificates']:
        k = row['key']
        ents, N, co, det, zeros, dmin, detmin, tri = computed['triangle'][k]
        if row['vertices'] != list(tri) or row['bernstein_degree'] != N:
            mism.append(k + ' vertices/degree')
        if [rj_poly(pj, 2) for pj in row['polynomials']] != [dict(e) for e in ents]:
            mism.append(k + ' polynomials')
        for cf in row['coefficients']:
            i, j, kk = cf['index']
            if i + j + kk != N or [F(x) for x in cf['entries']] != [c[(i, j)] for c in co] or cf['zero'] != ((i, j) in zeros) or \
                    (det is not None and 'determinant' in cf and F(cf['determinant']) != det[(i, j)]):
                mism.append('%s %s' % (k, cf['index']))
        if len(row['coefficients']) != len(co[0]) or F(row['minimum_diagonal_or_scalar']) != dmin or \
                (detmin is not None and F(row['minimum_determinant']) != detmin) or {tuple(z) for z in row['zero_indices']} != zeros:
            mism.append(k + ' summary')
    ev = rj['exact_values']
    for tag, r0, r1, integ, val, lb in ups + lows:
        e = ev['volume.printed_piece.' + tag]
        if F(e['exact_integral_with_prefactor']) != val or rj_poly(e['integrand'], 1) != as_dict1(integ) or F(e['strict_lower_bound']) != lb:
            mism.append('volume ' + tag)
    if F(ev['volume.upper_saved']['exact_value']) != tot:
        mism.append('volume.upper_saved')
    if lows and F(ev['volume.lower']['exact_value']) != 2 * (A0S ** 2 - 4) / 9 + sum(x[4] for x in lows):
        mism.append('volume.lower')
    for kk, ij in (('eq22.printed_CBE.8.0', (8, 0)), ('eq22.printed_CBE.8.1', (8, 1)), ('eq22.printed_CBE.8.2', (8, 2))):
        if tuple(F(x) for x in ev[kk]['triple_11_22_12']) != tuple(c[ij] for c in cbe):
            mism.append(kk)
    if F(ev['volume.printed_sine_positive_floor']['exact_floor']) != floor_:
        mism.append('sine floor')
    check(checks, 'R. results.json (data) agrees with every polynomial, coefficient, index, determinant, minimum, minimizing index and zero set computed here (%d interval rows, %d triangle rows, %d integrals)' % (
        len(seen_int), len(rj['triangle_certificates']), len(ups) + len(lows)), not mism, '; '.join(mism[:8]))
    ok = all(c_['pass'] for c_ in checks)
    verdict = 'CERTIFIED' if ok else 'REFUTED' if any(not c_['pass'] and c_['check'][:2] in ('B.', 'C.', 'D.', 'E.') for c_ in checks) else 'REFUSED'
    nbox = sum(len(x[2]) for x in computed['interval'].values())
    return {'verdict': verdict, 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: every exact polynomial certificate the paper prints -- the appendix lemmas '
                       'scalar (8 interval boxes), matrix-and-boundary (12 triangle rows) and potential F (20 interval boxes), '
                       'with the polynomials re-derived from Section 6 and the coverings -- plus Section 4\'s sine minorant, '
                       'upper-deficit integrals and moment-obstruction coefficient table' + (' and the conditional lower-volume rows' if with_lower else '') +
                       '; not the classification theorem',
            'value': {'interval_boxes': nbox, 'triangle_rows': len(computed['triangle']), 'eta_plus_lower': str(tot),
                      'runtime_s': round(time.time() - t0, 1)}}


def forge():
    """each must NOT certify"""
    out = []
    z = list(Z_KAPPA)
    z[10] += 1                                  # kappa's z_11 = -41/4 -> -40/4
    out.append(('kappa coefficient 4 z_11 = -41 changed to -40', decide(kappa_z=tuple(z))['verdict']))
    out.append(('printed minimum 3971/3200 changed to 3972/3200', decide(printed={'minima': dict(PRINTED_MINIMA, **{'eq19.defect_C0': (F(3972, 3200), F(1063, 1600))})})['verdict']))
    cbe = dict(CBE_PRINTED)
    cbe[(8, 2)] = (F(191, 81), F(191, 81), F(-1188, 1350))
    out.append(('printed CBE triple (8,2) off-diagonal -1189/1350 changed to -1188/1350', decide(printed={'cbe': cbe})['verdict']))
    out.append(('vertex B moved from (3/2,1/2) to (3/2,3/5)', decide(vertices={'B': (F(3, 2), F(3, 5))})['verdict']))
    tri = [list(r) for r in TRI_ROWS]
    tri[7][5] = F(14, 100)
    out.append(('CBE diagonal bound 13/100 printed as 14/100', decide(printed={'tri': [tuple(r) for r in tri]})['verdict']))
    return out


def main(dec=decide, frg=forge):
    t = time.time()
    res = dec()
    print(json.dumps({k: res[k] for k in ('verdict', 'value', 'decides')}, indent=1, default=str))
    for c_ in res['checks']:
        print(('PASS ' if c_['pass'] else 'FAIL ') + c_['check'], c_['detail'])
    print('sources', json.dumps(res['sources'], indent=1))
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(frg())
    print('forges %.1fs' % (time.time() - t))


if __name__ == '__main__':
    main()
