"""F-103 — "An explicit failure of complex affine-space cancellation" (openai/math family 047).

THE CLAIM (build/sections/01-introduction.tex, eq:example lines 48-55 and Theorem thm:main lines 59-70): in
P = C[p,s,u,F,J], with x = s^2 + u^3 + p^2F and H = x^2F - (1+2sx)J - p^2J^2 - pu, the algebra A = P/(H) is an
integral complex algebra of dimension four with
    A[w] = C^[5]   and   A not = C^[4],
so Zariski cancellation fails over C in dimension four. The cylinder half is Proposition prop:stabilization
(build/sections/02-construction.tex lines 97-256), proved by explicit formulas: the derivation eq:derivation
(l.116-122), Phi = exp(w Delta) with Phi(H) = H + p^3 w (l.125-138), the unimodular change (F,J) -> (L,M)
eq:linear-coordinates / eq:linear-inverse (l.145-158), eq:h-expansion (l.166-169), the root eq:root (l.180-186) and
eq:root-divisibility (l.189-191), e_0 and eq:e-certificate (l.199-208), W(Z) (l.237), and the five coordinates
Phi^-1(p), Phi^-1(s), Phi^-1(u), Phi^-1(M), Phi^-1(e_0) (l.246-251).

DECIDED HERE, exactly, over Q (every map has rational coefficients, so the isomorphism base-changes to C), with integer
polynomial arithmetic written for this audit (_poly.py). The cylinder isomorphism is decided as a chain of three
isomorphisms, each with an exhibited inverse and both composites checked; no expansion of the full composite is needed
(the inverse composite would put W(E), of degree 55, to the sixth power), and no theory of exponentials or of
domains is used:
  1. Phi. The substitution Phi of P[w] that fixes p and w and sends g in {s,u,F,J} to sum_i w^i/i! Delta^i(g), with
     Delta the derivation with the printed values (the series terminate: Delta^2 u = Delta^4 s = Delta^4 J =
     Delta^7 F = 0, computed), and Phi^- the same with -w. Checked: Delta x = Delta y = Delta z = 0 (Delta is the
     paper's -p^2 d/du in the localized coordinates), Delta H = p^3, Delta^2 H = 0, the identity xy - z(z+1) =
     p^2(H + pu); Phi^-(Phi(g)) = g and Phi(Phi^-(g)) = g for all six generators (so Phi is an automorphism of P[w]),
     and Phi(H) = H + p^3 w by direct substitution. Hence Phi: P[w]/(H) -> P[w]/(H + p^3 w) is an isomorphism.
  2. kappa / iota. P[w] = B[L,w], B = Q[p,s,u,M], by the printed linear change and its printed inverse; both
     composites checked on generators, and the determinant 4s^2x0^2 + (1+2sx0)(1-2sx0) = 1. G := kappa(H) + p^3 w.
  3. alpha / beta. beta: B[L,w] -> Q[p,s,u,M,E] by L -> L_* + p^3 E, w -> W(E) = -H(L_* + p^3 E)/p^3, and
     alpha: Q[p,s,u,M,E] -> B[L,w]/(G) by E -> e_0. Checked: eq:h-expansion, C = Q(0) as printed, L | Q(L) - C
     (so Q_1 is a polynomial), eq:root-divisibility, H(L) + p^3 w = L - p h, eq:e-certificate, p^3 | H(L_* + p^3 E)
     (so W is a polynomial; it has 381 terms, degree 55, cubic in E), and then
        beta(G) = 0                         (beta is well defined on B[L,w]/(G)),
        beta(alpha(E)) = beta(e_0) = E      (computed),
        alpha(beta(L)) - L = L_* + p^3 e_0 - L = (p^2 Q_1 - 1) G          (eq:e-certificate),
        alpha(beta(w)) - w = W(e_0) - w = q G, with q an explicit cofactor (computed; W(e_0) has 19,860 terms).
     q is built as -((p^2 Q_1 - 1) D(L_* + p^3 e_0, L) + 1)/p^3, D the divided difference of H in L, after checking
     that the numerator is divisible by p^3; only the final identity W(e_0) - w = q G is load-bearing.
  So A[w] = P[w]/(H) = P[w]/(H + p^3 w) = B[L,w]/(G) = Q[p,s,u,M,E], and the transported generators are the paper's
  Phi^-1(p), Phi^-1(s), Phi^-1(u), Phi^-1(M), Phi^-1(e_0) (iota is the identification of B[L,w] with P[w]).
  Integrality of A follows (A is a subring of A[w], a polynomial ring), and dim A = 4 from dim A[w] = 5.
  A spot check (evidence, not part of the proof): the composite of the three point maps sends a rational point t of
  A^5 (including points with p = 0) to a point of {H = 0} in A^6, and the paper's five coordinates, evaluated there
  through the same chain, return t.

WHAT IS NOT DECIDED: A not = C^[4] — the half that makes this a counterexample. It is the paper's rigidity argument
(sections 03-06: the valuation filtration and gr A, the lift of a homogeneous additive action through the
principalizing line bundle, the Mason-Stothers obstruction), which is theory about all locally nilpotent derivations,
not a finite object. Nor the Stable Coordinate corollary (it rests on A not = C^[4] and on Dutta-Lahiri), nor the
affine-fibration consequences (section 07). This decider certifies only the cylinder isomorphism A[w] = C^[5].
"""
import os
import re
import sys
from fractions import Fraction
from math import factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, compose, degree, diff, evaluate, mul, pw, scale, sub, total, var  # noqa: E402

DIR = 'preprints/An-explicit-failure-of-complex-affine-space-cancellation-September-23-2026/build/sections/'
INTRO = DIR + '01-introduction.tex'
CONS = DIR + '02-construction.tex'

# every formula transcribed below, as the TeX prints it (whitespace removed)
PRINTED = [
    (INTRO, r'x=s^2+u^3+p^2F,\\H&=x^2F-(1+2sx)J-p^2J^2-pu', 'eq:example'),
    (CONS, r'H=x^2F-(1+2sx)J-p^2J^2-pu', 'con:setup'),
    (CONS, r'y=s+x(x-u^3),\qquadz=sx+p^2J', 'con:setup y, z'),
    (CONS, r'xy-z(z+1)=p^2(H+pu)', 'con:identity'),
    (CONS, r'\Deltap=0,\qquad\Deltau=-p^2,\qquad\Deltas=-3p^2xu^2,\\\DeltaF=(6sx+3)u^2,\qquad\DeltaJ=3x^2u^2', 'eq:derivation'),
    (CONS, r'\DeltaH=p^3\)and\(\Delta^2H=0', 'Delta H'),
    (CONS, r'\Phi(H)=H+p^3w', 'eq:cylinder-automorphism'),
    (CONS, r'L=x_0^2F-(1+2sx_0)J,\qquadM=(1-2sx_0)F+4s^2J', 'eq:linear-coordinates'),
    (CONS, r'4s^2x_0^2+(1+2sx_0)(1-2sx_0)=1', 'determinant'),
    (CONS, r'F=4s^2L+(1+2sx_0)M,\qquadJ=-(1-2sx_0)L+x_0^2M', 'eq:linear-inverse'),
    (CONS, r'H(L)=L-pu+p^2Q(L)+p^4F(L)^3,\qquadQ(L)=2x_0F(L)^2-2sF(L)J(L)-J(L)^2', 'eq:h-expansion'),
    (CONS, r'C=Q(0)=M^2(2x_0+6sx_0^2+4s^2x_0^3-x_0^4)', 'eq:root C'),
    (CONS, r'Q_1(L)=\frac{Q(L)-C}{L}\inB[L],\qquadL_*=pu-p^2C', 'eq:root Q_1, L_*'),
    (CONS, r'H(L_*)=p^3\bigl((u-pC)Q_1(L_*)+pF(L_*)^3\bigr)', 'eq:root-divisibility'),
    (CONS, r'h=u-pQ(L)-p^3F(L)^3-p^2w,\qquade_0=-w-pF(L)^3-Q_1(L)h', 'eq:e-polynomial'),
    (CONS, r'H(L)+p^3w=L-ph', 'H(L) + p^3 w = L - ph'),
    (CONS, r'p^3e_0-(L-L_*)=(p^2Q_1(L)-1)\bigl(H(L)+p^3w\bigr)', 'eq:e-certificate'),
    (CONS, r'W(Z):=-\frac{H(L_*+p^3Z)}{p^3}\inB[Z]', 'W(Z)'),
    (CONS, r'\Phi^{-1}(p),\quad\Phi^{-1}(s),\quad\Phi^{-1}(u),\quad\Phi^{-1}(M),\quad\Phi^{-1}(e_0)', 'the five coordinates'),
]

N = 6                       # P[w]: p s u F J w      B[L,w]: p s u M L w      target: p s u M E (5 variables)
SPOT = [(Fraction(1, 2), Fraction(-2, 3), Fraction(3, 5), Fraction(1, 7), Fraction(-5, 4)),
        (Fraction(0), Fraction(2), Fraction(-1, 3), Fraction(4, 3), Fraction(1, 2)),
        (Fraction(-3), Fraction(1, 4), Fraction(1), Fraction(-2), Fraction(2, 9))]


def P_side(fg):
    """the paper's objects in P[w]; fg names a forged variant (None = as published)"""
    n = N
    p, s, u, F, J, w = (var(i, n) for i in range(n))
    one = const(1, n)
    x = total(pw(s, 2, n), pw(u, 3, n), mul(pw(p, 2, n), F))
    H = total(mul(pw(x, 2, n), F), scale(mul(add(one, scale(mul(s, x), 2)), J), -1), scale(mul(pw(p, 2, n), pw(J, 2, n)), -1),
              scale(mul(p, u), -2 if fg == 'H_pu' else -1))
    y = add(s, mul(x, sub(x, pw(u, 3, n))))
    z = add(mul(s, x), mul(pw(p, 2, n), J))
    Delta = [{}, scale(mul(mul(pw(p, 2, n), x), pw(u, 2, n)), -3), scale(pw(p, 2, n), -1),
             mul(add(scale(mul(s, x), 6), const(3, n)), pw(u, 2, n)),
             scale(mul(x if fg == 'dJ' else pw(x, 2, n), pw(u, 2, n)), 3), {}]
    x0 = add(pw(s, 2, n), pw(u, 3, n))
    Lp = sub(mul(pw(x0, 2, n), F), mul(add(one, scale(mul(s, x0), 2)), J))
    Mp = add(mul(sub(one, scale(mul(s, x0), 2)), F), scale(mul(pw(s, 2, n), J), 3 if fg == 'M4' else 4))
    return dict(n=n, gens=[p, s, u, F, J, w], p=p, w=w, one=one, x=x, y=y, z=z, H=H, Delta=Delta, iota=[p, s, u, Mp, Lp, w])


def derive(g, D):
    r = {}
    for i, d in enumerate(D):
        if d:
            r = add(r, mul(diff(g, i), d))
    return r


def exp_w(g, D, w, sign, cap=12):
    """sum_i (sign w)^i / i! D^i(g) and the first i with D^i(g) = 0; (None, None) if D^cap(g) != 0 (not nilpotent here)"""
    its = [g]
    while its[-1] and len(its) <= cap:
        its.append(derive(its[-1], D))
    if its[-1]:
        return None, None
    r, wi = {}, const(1, len(next(iter(g))))
    for i, t in enumerate(its[:-1]):
        r = add(r, scale(mul(t, wi), Fraction(sign ** i, factorial(i))))
        wi = mul(wi, w)
    return r, len(its) - 1


def shift(a, idx, k):
    """a / v_idx^k for a monomial-divisible a; None if some term is not divisible"""
    if any(m[idx] < k for m in a):
        return None
    return {m[:idx] + (m[idx] - k,) + m[idx + 1:]: c for m, c in a.items()}


def point_map(images, pt):
    return tuple(evaluate(g, pt) for g in images)


def decide(src=None, forged=None):
    src = src or Sources()
    checks = []
    norm = {}
    for rel, s, label in PRINTED:
        if rel not in norm:
            norm[rel] = re.sub(r'\s+', '', src.text(rel))
        check(checks, '0. printed: ' + label, s in norm[rel], rel.split('/')[-1])

    S = P_side(forged)
    n, gens, p, w, one, x, y, z, H, Delta = (S[k] for k in ('n', 'gens', 'p', 'w', 'one', 'x', 'y', 'z', 'H', 'Delta'))
    # 1. the derivation and Phi
    check(checks, '1. Delta x = Delta y = Delta z = 0 and Delta u = -p^2 (Delta is -p^2 d/du in the coordinates p,x,y,z,u)',
          all(derive(g, Delta) == {} for g in (x, y, z)))
    check(checks, '1. xy - z(z+1) = p^2 (H + pu)', sub(sub(mul(x, y), mul(z, add(z, one))), mul(pw(p, 2, n), add(H, mul(p, gens[2])))) == {})
    dH = derive(H, Delta)
    check(checks, '1. Delta H = p^3 and Delta^2 H = 0', dH == pw(p, 3, n) and derive(dH, Delta) == {})
    Phi, Phim, orders = [], [], []
    for g in gens:
        a, k = exp_w(g, Delta, w, 1)
        b, _ = exp_w(g, Delta, w, -1)
        Phi.append(a)
        Phim.append(b)
        orders.append(k)
    nilp = check(checks, '1. Delta is locally nilpotent on the generators (first vanishing iterate on p,s,u,F,J,w)', all(k is not None for k in orders), str(orders))
    if not nilp:                            # no exponential to build; the identity stands in, and every check on Phi fails
        Phi, Phim = list(gens), list(gens)
    check(checks, '1. Phi^-1(Phi(g)) = g for the six generators (computed)', nilp and all(compose(Phi[i], Phim, n) == gens[i] for i in range(6)))
    check(checks, '1. Phi(Phi^-1(g)) = g for the six generators (computed)', nilp and all(compose(Phim[i], Phi, n) == gens[i] for i in range(6)))
    check(checks, '1. Phi(H) = H + p^3 w (direct substitution)', compose(H, Phi, n) == add(H, mul(pw(p, 3, n), w)))

    # 2. the unimodular change P[w] = B[L,w]
    pB, sB, uB, MB, LB, wB = (var(i, n) for i in range(n))
    oB = const(1, n)
    x0B = add(pw(sB, 2, n), pw(uB, 3, n))
    FL = add(scale(mul(pw(sB, 2, n), LB), 4), mul(add(oB, scale(mul(sB, x0B), 2)), MB))
    JL = add(scale(mul(sub(oB, scale(mul(sB, x0B), 2)), LB), -1), mul(pw(x0B, 2, n), MB))
    kappa = [pB, sB, uB, FL, JL, wB]
    iota = S['iota']
    Bgens = [pB, sB, uB, MB, LB, wB]
    detm = add(mul(scale(pw(sB, 2, n), 4), pw(x0B, 2, n)), mul(add(oB, scale(mul(sB, x0B), 2)), sub(oB, scale(mul(sB, x0B), 2))))
    check(checks, '2. determinant 4s^2x0^2 + (1+2sx0)(1-2sx0) = 1', detm == oB)
    check(checks, '2. iota(kappa(g)) = g on p,s,u,F,J,w and kappa(iota(g)) = g on p,s,u,M,L,w (computed)',
          all(compose(kappa[i], iota, n) == gens[i] for i in range(6)) and all(compose(iota[i], kappa, n) == Bgens[i] for i in range(6)))
    HL = compose(H, kappa, n)
    G = add(HL, mul(pw(pB, 3, n), wB))
    QL = total(scale(mul(x0B, pw(FL, 2, n)), 2), scale(mul(mul(sB, FL), JL), -2), scale(pw(JL, 2, n), -1))
    check(checks, '3. eq:h-expansion H(L) = L - pu + p^2 Q(L) + p^4 F(L)^3',
          sub(HL, total(LB, scale(mul(pB, uB), -1), mul(pw(pB, 2, n), QL), mul(pw(pB, 4, n), pw(FL, 3, n)))) == {})

    # 3. the root, e_0, W and the isomorphism B[L,w]/(G) = Q[p,s,u,M,E]
    def at_L(a, val):
        return compose(a, [pB, sB, uB, MB, val, wB], n)
    C = at_L(QL, {})
    Cp = mul(pw(MB, 2, n), total(scale(x0B, 2), scale(mul(sB, pw(x0B, 2, n)), 5 if forged == 'C6' else 6),
                                 scale(mul(pw(sB, 2, n), pw(x0B, 3, n)), 4), scale(pw(x0B, 4, n), -1)))
    check(checks, '3. C = Q(0) = M^2(2x0 + 6s x0^2 + 4s^2 x0^3 - x0^4) as printed', C == Cp, '%d terms, degree %d' % (len(C), degree(C)))
    Q1 = shift(sub(QL, Cp), 4, 1)
    check(checks, '3. L divides Q(L) - C, so Q_1 = (Q(L) - C)/L is in B[L]', Q1 is not None)
    if Q1 is None:
        Q1 = {}
    Ls = sub(mul(pB, uB), mul(pw(pB, 2, n), Cp))
    check(checks, '3. eq:root-divisibility H(L_*) = p^3((u - pC) Q_1(L_*) + p F(L_*)^3)',
          at_L(HL, Ls) == mul(pw(pB, 3, n), add(mul(sub(uB, mul(pB, Cp)), at_L(Q1, Ls)), mul(pB, pw(at_L(FL, Ls), 3, n)))))
    h = total(uB, scale(mul(pB, QL), -1), scale(mul(pw(pB, 3, n), pw(FL, 3, n)), -1), scale(mul(pw(pB, 2, n), wB), -1))
    e0 = total(scale(wB, -1), scale(mul(pB, pw(FL, 3, n)), -1), scale(mul(Q1, h), -1))
    check(checks, '3. H(L) + p^3 w = L - p h', G == sub(LB, mul(pB, h)))
    cof_L = sub(mul(pw(pB, 2, n), Q1), oB)
    check(checks, '3. eq:e-certificate p^3 e_0 - (L - L_*) = (p^2 Q_1(L) - 1)(H(L) + p^3 w)',
          sub(mul(pw(pB, 3, n), e0), sub(LB, Ls)) == mul(cof_L, G), 'e_0: %d terms, degree %d' % (len(e0), degree(e0)))
    m5 = 5
    p5, s5, u5, M5, E5 = (var(i, m5) for i in range(m5))
    to5 = [p5, s5, u5, M5, {}, {}]
    Ls5 = compose(Ls, to5, m5)
    bL = add(Ls5, mul(pw(p5, 3, m5), E5))
    HZ = compose(HL, [p5, s5, u5, M5, bL, {}], m5)
    W = shift(HZ, 0, 3)
    check(checks, '3. p^3 divides H(L_* + p^3 E), so W(E) = -H(L_* + p^3 E)/p^3 is in B[E]', W is not None)
    W = scale(W or {}, -1)
    beta = [p5, s5, u5, M5, bL, W]
    alpha = [pB, sB, uB, MB, e0]
    check(checks, '3. beta(G) = H(L_* + p^3 E) + p^3 W(E) = 0: beta is well defined on B[L,w]/(G)', compose(G, beta, m5) == {},
          'W: %d terms, degree %d, degree %d in E' % (len(W), degree(W), max((m[4] for m in W), default=-1)))
    check(checks, '3. beta(alpha(E)) = beta(e_0) = E (computed)', compose(e0, beta, m5) == E5)
    check(checks, '3. alpha(beta(L)) - L = L_* + p^3 e_0 - L = (p^2 Q_1 - 1) G (explicit cofactor)',
          sub(compose(bL, alpha, n), LB) == mul(cof_L, G))
    We0 = compose(W, alpha, n)
    # the cofactor for w: q = -((p^2 Q_1 - 1) D(a, L) + 1)/p^3, a = L_* + p^3 e_0, D the divided difference of H(L)
    hk = [compose(shift({m: c for m, c in HL.items() if m[4] == k}, 4, k) or {}, Bgens, n) for k in range(4)]
    check(checks, '3. H(L) is cubic in L over B', all(m[4] <= 3 for m in HL))
    a = add(Ls, mul(pw(pB, 3, n), e0))
    Dd = total(hk[1], mul(hk[2], add(a, LB)), mul(hk[3], total(pw(a, 2, n), mul(a, LB), pw(LB, 2, n))))
    q = shift(add(mul(cof_L, Dd), oB), 0, 3)
    q = scale(q, -1) if q is not None else {}
    check(checks, '3. alpha(beta(w)) - w = W(e_0) - w = q G (explicit cofactor q)', sub(We0, wB) == mul(q, G),
          'W(e_0): %d terms, degree %d; q: %d terms, degree %d' % (len(We0), degree(We0), len(q), degree(q)))

    # the paper's five coordinates, and a spot check of the whole chain on points
    Mfin = compose(iota[3], Phim, n)
    spot = []
    for t in SPOT:
        b = point_map(beta, t)                                    # B[L,w] point
        c = point_map(kappa, b)                                   # P[w] point
        d = point_map(Phi, c)                                     # P[w] point on {H = 0}
        back = point_map(alpha, point_map(iota, point_map(Phim, d)))
        spot.append(evaluate(H, d) == 0 and back == t and evaluate(Mfin, d) == t[3])
    check(checks, 'spot (evidence, not proof): t in Q^5 -> chi(t) lies on H = 0 and the five coordinates return t, at %d points (one with p = 0)' % len(SPOT), all(spot))
    ok = all(c_['pass'] for c_ in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: the cylinder isomorphism A[w] = C^[5] (Proposition prop:stabilization), '
                       'by the paper\'s printed maps with inverses; NOT A not = C^[4], which carries the counterexample',
            'value': {'H_terms': len(H), 'H_degree': degree(H), 'Delta_nilpotency_orders': orders, 'e0_terms': len(e0),
                      'W_terms': len(W), 'W_degree': degree(W), 'cofactor_q_terms': len(q),
                      'Phi_inv_M_terms': len(Mfin), 'Phi_inv_M_degree': degree(Mfin)}}


def forge():
    """each must NOT certify"""
    out = []
    for key, what in (('dJ', 'Delta J printed as 3x u^2 instead of 3x^2 u^2'),
                      ('C6', 'the root C with 5 s x0^2 in place of 6 s x0^2'),
                      ('M4', 'M = (1 - 2s x0) F + 3s^2 J (the change is no longer unimodular)'),
                      ('H_pu', 'the relation with -2pu in place of -pu')):
        out.append((what, decide(forged=key)['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'decides', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    t = time.time()
    print(forge())
    print('forges %.1fs' % (time.time() - t))
