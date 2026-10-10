"""F-105 — "A stable coordinate that is not a coordinate in four variables" (openai/math family 049).

THE CLAIM (build/source/sections/01-introduction.tex, Theorem thm:main lines 8-16): in R = C[x1,x2,x3,x4], with
Q = x2^2 - x4^2 + x1x3 and f = x1 - 2Q(Q(x2 + x4) + x1x4), "There is a C-algebra automorphism of R[w] sending f to
x1, but there is no such automorphism of R"; and Corollary cor:fibers (l.20-22): every fibre f^-1(lambda) is A^3 and
its embedding is not rectifiable. The abstract calls f "an explicit degree-five polynomial". The explicit part is in
build/source/sections/02-construction.tex: the presentation A = P/(H), P = C[p,s,u,F,J], x = s^2 - u^2 + pF,
H = x^2F - (1+2sx)J - pJ^2 - u (con:presentation, l.10-16); Proposition prop:polynomial (l.22-69: the matrix change
M' = (I - 2ne^T)M identifying A with C[p',s',F',J] and p with f); Proposition prop:stable (l.97-164: Delta with the
values con:delta l.114-119, exp(w Delta) with H -> H + pw, the unimodular change (F,J) -> (L,N) l.135-146,
con:H-expansion l.149-150, w' = w + Q0); Proposition prop:fibers (l.176-195).

DECIDED HERE, exactly, over Q (every map has rational coefficients; the identities hold over C), with integer
polynomial arithmetic written for this audit (_poly.py). The automorphism is decided as a chain of isomorphisms, each
with an exhibited inverse and both composites checked; the composite theta itself is never expanded (measured once outside
this decider, theta(x2) alone has 24,356 terms of degree 56, and theta(f) would need its fifth powers):
  A. R = A with p -> f (Proposition prop:polynomial). sigma: the primed coordinates p',s',u',F' read off
     M' = (I - 2ne^T)M as polynomials in P; tau: the inverse substitution M = (I + 2ne^T)M', x = -det M'. Checked:
     x = -det M, e^T n = 0, H = e^T M e - J - u, (ne^T)^2 = 0, det(I - 2ne^T) = 1, -det M' = x, u' = u - e^T M e,
     H = -J - u', the printed lower-right entry p = p' - 2x(x(s' - u') + p'J); sigma(tau(g)) = g and
     tau(sigma(g)) = g on all generators. With u' = -J: pi^-1: P -> R (p',s',F',J -> x1,x2,x3,x4) and
     pi: R -> P/(H). Checked: pi^-1(H) = 0; pi^-1(pi(x_i)) = x_i; pi(pi^-1(g)) - g = c_g H with explicit cofactors
     for g = p,s,u,F,J; pi^-1(p) = f and pi^-1(x) = Q exactly as printed in the theorem; deg f = 5; f(0,0,0,0) = 0,
     f(1,0,0,0) = 1 (the printed values).
  B. A[w] = C^[5] with p a coordinate (Proposition prop:stable). Delta from the printed values: Delta x = Delta y =
     Delta z = 0 (it is -p d/du in the localized coordinates), xy - z(z+1) = p(H + u), Delta H = p, Delta^2 H = 0;
     Phi (sum_i w^i/i! Delta^i on generators; the series terminate) and Phi^- (with -w) mutually inverse on all six
     generators, and Phi(H) = H + pw, by direct substitution. The unimodular change: determinant 1 and both
     composites; con:H-expansion H = L - u + pQ0. eps: P[w] -> Q[p,s,u,N,w'] (F, J through L = u - pw' and N,
     w -> w' - Q0) and eps': N -> (1-2sx0)F + 4s^2J, w' -> w + Q0. Checked: eps(H + pw) = 0, eps(eps'(y)) = y on the
     five generators, eps'(eps(g)) - g = c_g (H + pw) with explicit cofactors. So
        theta = relabel o eps o Phi o pi : R[w] -> R[w]   (p,s,u,N,w' -> x1,x2,x3,x4,w)
     is an automorphism with inverse pi^-1 o Phi^- o eps' o relabel^-1 (each stage inverted, composites checked), and
     theta(f) = x1: pi(f) = pi(pi^-1(p)) = p + c_p H (computed above), Phi(p) = p, eps(p) = p, eps(Phi(H)) = 0.
  C. Every fibre is C^[3] (Proposition prop:fibers). lambda = 0: Q[s,u,F,J]/(H|p=0) = Q[s,u,N], maps both ways,
     well defined, both composites (cofactors explicit). lambda != 0, symbolically: maps between
     Q[lambda^+-1][s,u,F,J]/(H|p=lambda) and Q[lambda^+-1][x,y,z] (u = (xy - z(z+1))/lambda and con:localized-inverse),
     well defined, both composites, cofactors explicit; the identities hold in the Laurent ring, so at every complex
     lambda != 0.
  Spot check (evidence, not proof): at rational points of A^5 (one with x1 = 0), the point maps of theta and of its
  inverse are mutually inverse and f(theta(t)) = t1.

WHAT IS NOT DECIDED: "there is no such automorphism of R" — that f is NOT a coordinate in four variables — which is
the half that makes f a counterexample to the stable coordinate conjecture. It is the paper's sections 03-05 (the
filtration and gr A = B[tau, I/tau], the lift of a locally nilpotent derivation to the line bundle, the rigidity
argument), theory about all locally nilpotent derivations, not a finite object. The non-rectifiability in Corollary
cor:fibers rests on it as well; only "every fibre is A^3" is decided here.
"""
import os
import re
import sys
from fractions import Fraction
from math import factorial

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, compose, const, degree, diff, divide, evaluate, mul, pw, scale, sub, total, var  # noqa: E402

DIR = 'preprints/A-stable-coordinate-that-is-not-a-coordinate-in-four-variables-October-5-2026/build/source/'
MAIN = DIR + 'main.tex'
INTRO = DIR + 'sections/01-introduction.tex'
CONS = DIR + 'sections/02-construction.tex'

PRINTED = [
    (MAIN, r'anexplicitdegree-fivepolynomialover$\C$', 'abstract: degree five'),
    (INTRO, r'Q=x_2^2-x_4^2+x_1x_3,\qquadf=x_1-2Q\bigl(Q(x_2+x_4)+x_1x_4\bigr).', 'eq:explicit-counterexample'),
    (INTRO, r'Thereisa$\C$-algebraautomorphismof$R[w]$sending$f$to$x_1$', 'thm:main, the stable half'),
    (CONS, r'P=k[p,s,u,F,J],\qquadx=s^2-u^2+pF,\\H=x^2F-(1+2sx)J-pJ^2-u,\qquadA=P/(H).', 'con:presentation'),
    (CONS, r"x=(s')^2-J^2+p'F',\qquadp=p'-2x\bigl(x(s'+J)+p'J\bigr).", 'con:candidate'),
    (CONS, r'M=\begin{pmatrix}F&s-u\\s+u&-p\end{pmatrix},\qquade=\binom{x}{-J},\qquadn=\binom{J}{x}.', 'M, e, n'),
    (CONS, r'$x=-\detM$,$e^{\mathsft}n=0$', 'x = -det M, e^T n = 0'),
    (CONS, r'H=e^{\mathsft}Me-J-u.', 'H = e^T M e - J - u'),
    (CONS, r"M'=(I_2-2ne^{\mathsft})M=\begin{pmatrix}F'&s'-u'\\s'+u'&-p'\end{pmatrix}.", 'con:matrix-change'),
    (CONS, r"$(ne^{\mathsft})^2=0$and$\det(I_2-2ne^{\mathsft})=1$", '(ne^T)^2 = 0, det = 1'),
    (CONS, r"$-\detM'=x$", "-det M' = x"),
    (CONS, r"M=(I_2+2ne^{\mathsft})M',\qquadx=-\detM',", 'the inverse substitution'),
    (CONS, r"u'=u-e^{\mathsft}Me,\qquadH=-J-u'.", "u' and H = -J - u'"),
    (CONS, r"p=p'-2x\bigl(x(s'-u')+p'J\bigr),", 'the lower-right entry'),
    (CONS, r"thevalues$0$and$1$at$(p',s',F',J)=(0,0,0,0)$and$(1,0,0,0)$", 'values 0 and 1'),
    (CONS, r'y=s+x(x+u^2),\qquadz=sx+pJ.', 'con:xyz'),
    (CONS, r'xy-z(z+1)=p(H+u).', 'con:quadric-identity'),
    (CONS, r's=y-x(x+u^2),\qquadF=\frac{x-s^2+u^2}{p},\qquadJ=\frac{z-sx}{p}.', 'con:localized-inverse'),
    (CONS, r'\Delta=-p\frac{\partial}{\partialu},\qquad\Delta(p)=\Delta(x)=\Delta(y)=\Delta(z)=0.', 'Delta = -p d/du'),
    (CONS, r'\Delta(p)=0,\qquad\Delta(u)=-p,\qquad\Delta(s)=2pxu,\\\Delta(F)=-4sxu-2u,\qquad\Delta(J)=-2x^2u.', 'con:delta'),
    (CONS, r'$\Delta(H)=p$', 'Delta(H) = p'),
    (CONS, r'sends$H$to$H+pw$', 'exp(w Delta)(H) = H + pw'),
    (CONS, r'Put$x_0=s^2-u^2$', 'x0'),
    (CONS, r'L&=x_0^2F-(1+2sx_0)J,\\N&=(1-2sx_0)F+4s^2J.', 'con:linear-coordinates'),
    (CONS, r'4s^2x_0^2+(1+2sx_0)(1-2sx_0)=1', 'determinant 1'),
    (CONS, r'F=4s^2L+(1+2sx_0)N,\qquadJ=-(1-2sx_0)L+x_0^2N.', 'con:linear-inverse'),
    (CONS, r'H=L-u+pQ_0,\qquadQ_0=2x_0F^2+pF^3-2sFJ-J^2.', 'con:H-expansion'),
    (CONS, r"$w'=w+Q_0$", "w' = w + Q0"),
    (CONS, r"=k[p,s,u,L,N,w']/(L-u+pw')\simeqk[p,s,u,N,w'].", 'the stabilized quotient'),
    (CONS, r'A/(p)=k[s,u,L,N]/(L-u)=k[s,u,N].', 'fibre at 0'),
    (CONS, r'A/(p-\lambda)=k[x,y,z,u]/\bigl(xy-z(z+1)-\lambdau\bigr)\simeqk[x,y,z],', 'fibre at lambda != 0'),
]

SPOT = [(Fraction(1, 2), Fraction(-2, 3), Fraction(3, 5), Fraction(1, 7), Fraction(-5, 4)),
        (Fraction(0), Fraction(2), Fraction(-1, 3), Fraction(4, 3), Fraction(1, 2)),
        (Fraction(-3), Fraction(1, 4), Fraction(1), Fraction(-2), Fraction(2, 9))]
HALF = Fraction(1, 2)


def mat_mul(A, B):
    return [[add(mul(A[i][0], B[0][j]), mul(A[i][1], B[1][j])) for j in range(2)] for i in range(2)]


def det2(A):
    return sub(mul(A[0][0], A[1][1]), mul(A[0][1], A[1][0]))


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


def cofactor(d, g):
    """q with d = q g exactly, or None (a single polynomial is a Groebner basis of its ideal)"""
    q, r = divide(d, g)
    return q if not r and sub(d, mul(q, g)) == {} else None


def compose0(a, subs, n_out):
    """substitute subs for variables 1.. of a, keeping variable 0 (lambda, exponent may be negative) as it is"""
    r = {}
    for m, c in a.items():
        t = {(m[0],) + (0,) * (n_out - 1): c}
        for i, e in enumerate(m[1:]):
            if e:
                t = mul(t, pw(subs[i], e, n_out))
        r = add(r, t)
    return r


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

    n = 6                                   # P[w] and its primed copy: p s u F J w
    p, s, u, F, J, w = gens = [var(i, n) for i in range(n)]
    one = const(1, n)
    x = total(pw(s, 2, n), scale(pw(u, 2, n), -1), mul(p, F))
    H = total(mul(pw(x, 2, n), F), scale(mul(add(one, scale(mul(s, x), 2)), J), -1),
              scale(mul(p, pw(J, 2, n)), -2 if forged == 'H_J2' else -1), scale(u, -1))
    I2 = [[one, {}], [{}, one]]
    k = 1 if forged == 'M1' else 2

    # A. the matrix change
    M = [[F, sub(s, u)], [add(s, u), scale(p, -1)]]
    e = [x, scale(J, -1)]
    nn = [J, x]
    neT = [[mul(nn[i], e[j]) for j in range(2)] for i in range(2)]
    Tm = [[sub(I2[i][j], scale(neT[i][j], k)) for j in range(2)] for i in range(2)]
    Mp = mat_mul(Tm, M)
    eMe = total(*[mul(mul(e[i], M[i][j]), e[j]) for i in range(2) for j in range(2)])
    check(checks, 'A. x = -det M, e^T n = 0, H = e^T M e - J - u',
          scale(det2(M), -1) == x and add(mul(e[0], nn[0]), mul(e[1], nn[1])) == {} and H == total(eMe, scale(J, -1), scale(u, -1)))
    check(checks, 'A. (n e^T)^2 = 0 and det(I - 2 n e^T) = 1', all(v == {} for row in mat_mul(neT, neT) for v in row) and det2(Tm) == one)
    Fp, sp, up, pp = Mp[0][0], scale(add(Mp[0][1], Mp[1][0]), HALF), scale(sub(Mp[1][0], Mp[0][1]), HALF), scale(Mp[1][1], -1)
    sigma = [pp, sp, up, Fp, J, w]
    check(checks, "A. -det M' = x", scale(det2(Mp), -1) == x)
    check(checks, "A. u' = u - e^T M e and H = -J - u'", up == sub(u, eMe) and H == sub(scale(J, -1), up))
    xq = total(pw(s, 2, n), scale(pw(u, 2, n), -1), mul(p, F))           # in the primed copy: (s')^2 - (u')^2 + p'F'
    Mq = [[F, sub(s, u)], [add(s, u), scale(p, -1)]]
    eq, nq = [xq, scale(J, -1)], [J, xq]
    Mr = mat_mul([[add(I2[i][j], scale(mul(nq[i], eq[j]), 2)) for j in range(2)] for i in range(2)], Mq)
    tau = [scale(Mr[1][1], -1), scale(add(Mr[0][1], Mr[1][0]), HALF), scale(sub(Mr[1][0], Mr[0][1]), HALF), Mr[0][0], J, w]
    check(checks, "A. tau(sigma(g)) = g and sigma(tau(g)) = g on all generators: p',s',u',F',J is a coordinate system on P",
          all(compose(tau[i], sigma, n) == gens[i] and compose(sigma[i], tau, n) == gens[i] for i in range(n)))
    check(checks, "A. the inverse's lower-right entry: p = p' - 2x(x(s' - u') + p'J)",
          tau[0] == sub(p, scale(mul(xq, add(mul(xq, sub(s, u)), mul(p, J))), 2)))
    m = 5                                   # R[w]: x1 x2 x3 x4 w
    x1, x2, x3, x4, wR = Rg = [var(i, m) for i in range(m)]
    Q = total(pw(x2, 2, m), scale(pw(x4, 2, m), 1 if forged == 'f_sign' else -1), mul(x1, x3))
    f = sub(x1, scale(mul(Q, add(mul(Q, add(x2, x4)), mul(x1, x4))), 2))
    pinv = [compose(g, [x1, x2, scale(x4, -1), x3, x4, wR], m) for g in tau]      # u' = -J
    pi = [sigma[0], sigma[1], sigma[3], J, w]
    check(checks, 'A. pi^-1(H) = 0: pi^-1 is well defined on A = P/(H)', compose(H, pinv, m) == {})
    check(checks, 'A. pi^-1(pi(x_i)) = x_i for x1..x4, w', all(compose(pi[i], pinv, m) == Rg[i] for i in range(m)))
    cof_A = [cofactor(sub(compose(pinv[i], pi, n), gens[i]), H) for i in range(n)]
    check(checks, 'A. pi(pi^-1(g)) - g = c_g H with explicit cofactors, g = p,s,u,F,J,w', all(c is not None for c in cof_A),
          'cofactor terms %s' % [len(c) if c is not None else None for c in cof_A])
    check(checks, "A. pi^-1(p) = f and pi^-1(x) = Q, as printed in thm:main (con:candidate)", pinv[0] == f and compose(x, pinv, m) == Q)
    check(checks, 'A. deg f = 5', degree(f) == 5, '%d terms' % len(f))
    check(checks, 'A. f(0,0,0,0) = 0 and f(1,0,0,0) = 1', evaluate(f, (0, 0, 0, 0, 0)) == 0 and evaluate(f, (1, 0, 0, 0, 0)) == 1)

    # B. the stabilization
    y = add(s, mul(x, add(x, pw(u, 2, n))))
    z = add(mul(s, x), mul(p, J))
    Delta = [{}, scale(mul(mul(p, x), u), 2), scale(p, -1),
             add(scale(mul(mul(s, x), u), -4), scale(u, 2 if forged == 'dF' else -2)), scale(mul(pw(x, 2, n), u), -2), {}]
    check(checks, 'B. Delta x = Delta y = Delta z = 0 and Delta u = -p (Delta is -p d/du in p,x,y,z,u)', all(derive(g, Delta) == {} for g in (x, y, z)))
    check(checks, 'B. xy - z(z+1) = p(H + u)', sub(mul(x, y), mul(z, add(z, one))) == mul(p, add(H, u)))
    check(checks, 'B. con:localized-inverse: s = y - x(x+u^2), pF = x - s^2 + u^2, pJ = z - sx',
          s == sub(y, mul(x, add(x, pw(u, 2, n)))) and mul(p, F) == total(x, scale(pw(s, 2, n), -1), pw(u, 2, n)) and mul(p, J) == sub(z, mul(s, x)))
    dH = derive(H, Delta)
    check(checks, 'B. Delta H = p and Delta^2 H = 0', dH == p and derive(dH, Delta) == {})
    Phi, Phim, orders = [], [], []
    for g in gens:
        a, o = exp_w(g, Delta, w, 1)
        Phi.append(a)
        Phim.append(exp_w(g, Delta, w, -1)[0])
        orders.append(o)
    nilp = check(checks, 'B. Delta is locally nilpotent on the generators (first vanishing iterate on p,s,u,F,J,w)', all(o is not None for o in orders), str(orders))
    if not nilp:                            # no exponential to build; the identity stands in, and every check on Phi fails
        Phi, Phim = list(gens), list(gens)
    check(checks, 'B. Phi^-(Phi(g)) = g and Phi(Phi^-(g)) = g on the six generators: Phi is an automorphism of P[w]',
          nilp and all(compose(Phi[i], Phim, n) == gens[i] and compose(Phim[i], Phi, n) == gens[i] for i in range(n)))
    G = add(H, mul(p, w))
    phiH_ok = check(checks, 'B. Phi(H) = H + p w (direct substitution)', compose(H, Phi, n) == G)
    x0 = sub(pw(s, 2, n), pw(u, 2, n))
    L = sub(mul(pw(x0, 2, n), F), mul(add(one, scale(mul(s, x0), 2)), J))
    N = add(mul(sub(one, scale(mul(s, x0), 2)), F), scale(mul(pw(s, 2, n), J), 3 if forged == 'N3' else 4))
    LN = [p, s, u, add(scale(mul(pw(s, 2, n), L), 4), mul(add(one, scale(mul(s, x0), 2)), N)),
          add(scale(mul(sub(one, scale(mul(s, x0), 2)), L), -1), mul(pw(x0, 2, n), N)), w]
    check(checks, 'B. the (F,J) -> (L,N) change: determinant 1 and con:linear-inverse returns F and J',
          add(scale(mul(pw(s, 2, n), pw(x0, 2, n)), 4), mul(add(one, scale(mul(s, x0), 2)), sub(one, scale(mul(s, x0), 2)))) == one and LN[3] == F and LN[4] == J)
    Q0 = total(scale(mul(x0, pw(F, 2, n)), 2), mul(p, pw(F, 3, n)), scale(mul(mul(s, F), J), -2), scale(pw(J, 2, n), -1))
    check(checks, 'B. con:H-expansion H = L - u + p Q0', H == total(L, scale(u, -1), mul(p, Q0)))
    m5 = 5                                  # S = Q[p,s,u,N,w']
    pS, sS, uS, NS, wS = Sg = [var(i, m5) for i in range(m5)]
    oS = const(1, m5)
    x0S = sub(pw(sS, 2, m5), pw(uS, 2, m5))
    LS = sub(uS, mul(pS, wS))
    FS = add(scale(mul(pw(sS, 2, m5), LS), 4), mul(add(oS, scale(mul(sS, x0S), 2)), NS))
    JS = add(scale(mul(sub(oS, scale(mul(sS, x0S), 2)), LS), -1), mul(pw(x0S, 2, m5), NS))
    eps = [pS, sS, uS, FS, JS, sub(wS, compose(Q0, [pS, sS, uS, FS, JS, {}], m5))]
    epsp = [p, s, u, N, add(w, Q0)]
    check(checks, 'B. eps(H + p w) = 0: eps is well defined on P[w]/(H + pw)', compose(G, eps, m5) == {})
    check(checks, "B. eps(eps'(y)) = y for y = p,s,u,N,w'", all(compose(epsp[i], eps, m5) == Sg[i] for i in range(m5)))
    cof_B = [cofactor(sub(compose(eps[i], epsp, n), gens[i]), G) for i in range(n)]
    check(checks, "B. eps'(eps(g)) - g = c_g (H + pw) with explicit cofactors, g = p,s,u,F,J,w", all(c is not None for c in cof_B),
          'cofactor terms %s' % [len(c) if c is not None else None for c in cof_B])
    check(checks, 'B. theta(f) = x1: pi(f) = p + c_p H (A), Phi(p) = p, eps(p) = p, eps(Phi(H)) = eps(H + pw) = 0',
          cof_A[0] is not None and pinv[0] == f and Phi[0] == p and eps[0] == pS and phiH_ok and compose(G, eps, m5) == {})

    # spot check of the composite theta = relabel o eps o Phi o pi and its inverse, on points
    spot = []
    for t in SPOT:
        th = point_map(pi, point_map(Phi, point_map(eps, t)))
        back = point_map(epsp, point_map(Phim, point_map(pinv, th)))
        fwd = point_map(pi, point_map(Phi, point_map(eps, point_map(epsp, point_map(Phim, point_map(pinv, t))))))
        spot.append(back == t and fwd == t and evaluate(f, th) == t[0])
    check(checks, 'spot (evidence, not proof): theta and its inverse are mutually inverse on %d rational points (one with x1 = 0) and f(theta(t)) = t1' % len(SPOT), all(spot))

    # C. the fibres
    m3 = 3                                  # Q[s,u,N]
    s3, u3, N3 = (var(i, m3) for i in range(m3))
    o3 = const(1, m3)
    x03 = sub(pw(s3, 2, m3), pw(u3, 2, m3))
    zeta = [{}, s3, u3, add(scale(mul(pw(s3, 2, m3), u3), 4), mul(add(o3, scale(mul(s3, x03), 2)), N3)),
            add(scale(mul(sub(o3, scale(mul(s3, x03), 2)), u3), -1), mul(pw(x03, 2, m3), N3)), {}]
    H0 = compose(H, [{}, s, u, F, J, w], n)
    zetap = [s, u, compose(N, [{}, s, u, F, J, w], n)]
    cof0 = [cofactor(sub(compose(zeta[i], zetap, n), gens[i]), H0) for i in (1, 2, 3, 4)]
    check(checks, 'C. lambda = 0: zeta(H|p=0) = 0, zeta(zeta\'(N)) = N, zeta\'(zeta(g)) - g = c_g H|p=0 for g = s,u,F,J: A/(p) = Q[s,u,N]',
          compose(H0, zeta, m3) == {} and compose(zetap[2], zeta, m3) == N3 and all(c is not None for c in cof0))
    # lambda != 0: variable 0 is lambda (exponents may be negative), Q[lambda^+-1][s,u,F,J] -> Q[lambda^+-1][x,y,z]
    lam5 = var(0, 5)
    _, sl, ul, Fl, Jl = (var(i, 5) for i in range(5))
    Hl = compose(H, [lam5, sl, ul, Fl, Jl, {}], 5)
    m4 = 4
    xl, yl, zl = (var(i, m4) for i in (1, 2, 3))
    inv_l = {(-1, 0, 0, 0): 1}
    U = mul(inv_l, sub(mul(xl, yl), mul(zl, add(zl, const(1, m4)))))
    Sv = sub(yl, mul(xl, add(xl, pw(U, 2, m4))))
    nu = [Sv, U, mul(inv_l, total(xl, scale(pw(Sv, 2, m4), -1), pw(U, 2, m4))), mul(inv_l, sub(zl, mul(Sv, xl)))]
    X = total(pw(sl, 2, 5), scale(pw(ul, 2, 5), -1), mul(lam5, Fl))
    nup = [X, add(sl, mul(X, add(X, pw(ul, 2, 5)))), add(mul(sl, X), mul(lam5, Jl))]
    ok_well = compose0(Hl, nu, m4) == {}
    ok_nn = all(compose0(nup[i], nu, m4) == [xl, yl, zl][i] for i in range(3))
    cof_l = []
    for i, g in enumerate((sl, ul, Fl, Jl)):
        d = sub(compose0(nu[i], nup, 5), g)
        kk = max(0, -min((mm[0] for mm in d), default=0))
        q = cofactor({(mm[0] + kk,) + mm[1:]: c for mm, c in d.items()}, Hl)
        q = {(mm[0] - kk,) + mm[1:]: c for mm, c in q.items()} if q is not None else None
        cof_l.append(q is not None and d == mul(q, Hl))
    check(checks, "C. lambda != 0 (symbolic): nu(H|p=lambda) = 0, nu(nu'(v)) = v for v = x,y,z, nu'(nu(g)) - g = c_g H|p=lambda "
                  "for g = s,u,F,J in Q[lambda^+-1][...]: A/(p - lambda) = Q[x,y,z]", ok_well and ok_nn and all(cof_l),
          'well-defined %s, one way %s, cofactors %s' % (ok_well, ok_nn, cof_l))

    ok = all(c_['pass'] for c_ in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'a finite component: f is a one-stable coordinate (an explicit automorphism of C[x1..x4,w] with '
                       'exhibited inverse sends f to x1), deg f = 5, and every fibre f = lambda is C^[3]; NOT that f is '
                       'not a coordinate in four variables, which carries the counterexample',
            'value': {'f_terms': len(f), 'f_degree': degree(f), 'H_terms': len(H), 'Delta_nilpotency_orders': orders,
                      'cofactor_terms_A': [len(c) if c is not None else None for c in cof_A],
                      'cofactor_terms_B': [len(c) if c is not None else None for c in cof_B]}}


def forge():
    """each must NOT certify"""
    out = []
    for key, what in (('f_sign', 'f with Q = x2^2 + x4^2 + x1x3 (one sign flipped)'),
                      ('dF', 'Delta(F) printed as -4sxu + 2u'),
                      ('N3', 'N = (1 - 2s x0) F + 3s^2 J (the change is no longer unimodular)'),
                      ('M1', "M' = (I - n e^T) M (factor 1 in place of 2)"),
                      ('H_J2', 'the relation with -2pJ^2 in place of -pJ^2')):
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
