"""F-106 — "An explicit noncoordinate polynomial with affine three-space zero fibre" (openai/math family 049).

THE CLAIM (paper.tex, Theorem thm:main, lines 85-110): in R = C[h,u,v,w], with x = u^3 + hv, y = -u^2 + hw,
s = 2u^3v + 3u^4w + h(v^2 - 3u^2w^2) + h^2w^3, p = -2s^2x + 3sy^2 - 3s^3y and F = h - p(x,y,s) - 1:
R/(F) = C^[3] and grad F(2, 0, -1/2, 1/2) = 0, so F is not a coordinate — a counterexample to the Abhyankar-Sathaye
embedding conjecture in ambient dimension four.

DECIDED HERE, exactly, with integer polynomial arithmetic written for this audit (_poly.py):
  1. x^2 + y^3 = h s in R (the paper's definition of s).
  2. grad F(P) = 0 at P = (2, 0, -1/2, 1/2), and F(P) = -1 (so P is off the zero fibre, where F is singular-free).
     A coordinate F is a component of a polynomial automorphism, whose Jacobian determinant is a nonzero constant,
     so grad F vanishes nowhere; a critical point rules F out (the chain rule; no computation beyond 2).
  3. The isomorphism, both ways, from the paper's printed maps (Appendix, lines 342-375):
     psi: R -> C[X,Y,T] by h, u, v, w -> the appendix's inverse formulas (s = X^2+Y^3, x = X - s^3, y = Y + s^2,
     h = 1 + p, alpha, beta, u = hT - beta x, g = yT + alpha x, w, v = g - uw), and
     phi: C[X,Y,T] -> R/(F) by X -> x + s^3, Y -> y - s^2, T -> alpha u + beta(v + uw).
     (a) psi(u)^3 + psi(h)psi(v) = x_B, -psi(u)^2 + psi(h)psi(w) = y_B and S(psi(h),psi(u),psi(v),psi(w)) = s_B,
         computed in C[X,Y,T]; hence psi(F) = h_B - p(x_B, y_B, s_B) - 1 = 0 (computed). psi is applied to the
         paper's building blocks as written (a ring homomorphism), never to their expansions in h,u,v,w.
     (b) psi(phi(X)) = X, psi(phi(Y)) = Y, psi(phi(T)) = T, computed in C[X,Y,T].
     (c) phi(psi(z)) = z mod F for z = h, u, v, w, through four identities in R with explicit cofactors, computed:
         (x+s^3)^2 + (y-s^2)^3 - s = s F;   alpha h + beta y - 1 = (1 + 2s^2x) F;
         h T_R - beta x - u = u (1+2s^2x) F;  y T_R + alpha x - (v+uw) = (v+uw)(1+2s^2x) F;
         W_R - w = w (1+2s^2x)(1+beta y) F, W_R the w-formula evaluated in R.
         From the first, phi(s_B) = s, phi(x_B) = x, phi(y_B) = y, phi(h_B) = 1 + p = h, phi(alpha_B) = alpha,
         phi(beta_B) = beta mod F (ring homomorphism), and then the others give phi(psi(u)) = u, phi(psi(g)) = v+uw,
         phi(psi(w)) = w, phi(psi(v)) = v mod F. So phi and psi are mutually inverse: R/(F) = C[X,Y,T].
"""
import os
import sys
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402
from _poly import add, const, diff, evaluate, mul, pw, scale, sub, total, var  # noqa: E402

PAPER = 'preprints/An-explicit-noncoordinate-polynomial-with-affine-three-space-zero-fibre-September-24-2026/build/paper.tex'
P = (Fraction(2), Fraction(0), Fraction(-1, 2), Fraction(1, 2))


def build_R(perturb=0):
    n = 4
    h, u, v, w = (var(i, n) for i in range(4))
    one = const(1, n)
    x = add(pw(u, 3, n), mul(h, v))
    y = add(scale(pw(u, 2, n), -1), mul(h, w))
    s = total(scale(mul(pw(u, 3, n), v), 2), scale(mul(pw(u, 4, n), w), 3), mul(h, sub(pw(v, 2, n), scale(mul(pw(u, 2, n), pw(w, 2, n)), 3))),
              mul(pw(h, 2, n), pw(w, 3, n)))
    if perturb:
        s = add(s, scale(mul(h, pw(v, 2, n)), perturb))
    p = total(scale(mul(pw(s, 2, n), x), -2), scale(mul(s, pw(y, 2, n)), 3), scale(mul(pw(s, 3, n), y), -3))
    F = total(h, scale(p, -1), scale(one, -1))
    return dict(n=n, h=h, u=u, v=v, w=w, one=one, x=x, y=y, s=s, p=p, F=F)


def alpha_beta(x, y, s, one, n):
    alpha = total(one, scale(mul(pw(s, 2, n), x), 2), scale(pw(s, 5, n), 4))
    c = add(one, scale(mul(pw(s, 2, n), x), 2))
    beta = sub(mul(sub(scale(pw(s, 3, n), 3), scale(mul(s, y), 3)), c), scale(mul(pw(s, 4, n), pw(y, 2, n)), 4))
    return alpha, beta, c


def p_of(x, y, s, n):
    return total(scale(mul(pw(s, 2, n), x), -2), scale(mul(s, pw(y, 2, n)), 3), scale(mul(pw(s, 3, n), y), -3))


def decide(src=None, point=P, perturb=0):
    src = src or Sources()
    checks = []
    tex = src.text(PAPER)
    check(checks, 'the paper prints F, the critical point and the inverse maps', all(k in tex for k in ('p(x,y,s)=-2s^2x+3sy^2-3s^3y', '\\grad F(2,0,-1/2,1/2)=0', 'u&=hT-\\beta x', 'T=\\alpha u+\\beta(v+uw)')))
    R = build_R(perturb)
    n, h, u, v, w, one, x, y, s, F = (R[k] for k in ('n', 'h', 'u', 'v', 'w', 'one', 'x', 'y', 's', 'F'))
    check(checks, '1. x^2 + y^3 = h s in R', sub(add(pw(x, 2, n), pw(y, 3, n)), mul(h, s)) == {})
    grad = [evaluate(diff(F, i), point) for i in range(4)]
    check(checks, '2. grad F(2, 0, -1/2, 1/2) = 0', all(g == 0 for g in grad), str([str(g) for g in grad]))
    check(checks, '2. F(2, 0, -1/2, 1/2) = -1 (the critical point lies on the fibre F = -1)', evaluate(F, point) == -1, str(evaluate(F, point)))

    # psi side: C[X,Y,T]
    m = 3
    X, Y, T = (var(i, m) for i in range(3))
    o3 = const(1, m)
    sB = add(pw(X, 2, m), pw(Y, 3, m))
    xB = sub(X, pw(sB, 3, m))
    yB = add(Y, pw(sB, 2, m))
    hB = add(o3, p_of(xB, yB, sB, m))
    aB, bB, _ = alpha_beta(xB, yB, sB, o3, m)
    uP = sub(mul(hB, T), mul(bB, xB))
    gP = add(mul(yB, T), mul(aB, xB))
    wP = add(mul(mul(aB, add(o3, mul(bB, yB))), add(yB, pw(uP, 2, m))),
             mul(pw(bB, 2, m), total(sB, scale(mul(hB, pw(gP, 2, m)), -1), scale(mul(mul(uP, yB), gP), 2))))
    vP = sub(gP, mul(uP, wP))
    check(checks, '3a. in C[X,Y]: x_B^2 + y_B^3 = h_B s_B', sub(add(pw(xB, 2, m), pw(yB, 3, m)), mul(hB, sB)) == {})
    check(checks, '3a. psi(x) = psi(u)^3 + psi(h) psi(v) = x_B', sub(add(pw(uP, 3, m), mul(hB, vP)), xB) == {})
    check(checks, '3a. psi(y) = -psi(u)^2 + psi(h) psi(w) = y_B', sub(add(scale(pw(uP, 2, m), -1), mul(hB, wP)), yB) == {})
    psi = [hB, uP, vP, wP]
    # psi is a ring homomorphism, so it is applied to the paper's building blocks as written, never to their
    # expansions in h,u,v,w (whose powers of w reach the hundreds): psi(x) = psi(u)^3 + psi(h)psi(v), and so on
    psi_x = add(pw(uP, 3, m), mul(hB, vP))
    psi_y = add(scale(pw(uP, 2, m), -1), mul(hB, wP))
    psi_s = total(scale(mul(pw(uP, 3, m), vP), 2), scale(mul(pw(uP, 4, m), wP), 3), mul(hB, sub(pw(vP, 2, m), scale(mul(pw(uP, 2, m), pw(wP, 2, m)), 3))),
                  mul(pw(hB, 2, m), pw(wP, 3, m)))
    check(checks, '3a. psi(s) = s_B, computed directly from S(psi(h), psi(u), psi(v), psi(w))', sub(psi_s, sB) == {}, '%d terms in psi(w), degree %d' % (len(wP), max(sum(e) for e in wP)))
    psi_F = sub(sub(hB, p_of(psi_x, psi_y, psi_s, m)), o3)
    check(checks, '3a. psi(F) = psi(h) - p(psi(x), psi(y), psi(s)) - 1 = 0', psi_F == {})
    # psi(phi(.)) = id
    aR, bR, cR = alpha_beta(x, y, s, one, n)
    phiX = add(x, pw(s, 3, n))
    phiY = sub(y, pw(s, 2, n))
    phiT = add(mul(aR, u), mul(bR, add(v, mul(u, w))))
    a_psi, b_psi, _ = alpha_beta(psi_x, psi_y, psi_s, o3, m)
    check(checks, '3b. psi(phi(X)) = psi(x) + psi(s)^3 = X', sub(add(psi_x, pw(psi_s, 3, m)), X) == {})
    check(checks, '3b. psi(phi(Y)) = psi(y) - psi(s)^2 = Y', sub(sub(psi_y, pw(psi_s, 2, m)), Y) == {})
    check(checks, '3b. psi(phi(T)) = alpha(psi) psi(u) + beta(psi)(psi(v) + psi(u) psi(w)) = T', sub(add(mul(a_psi, uP), mul(b_psi, add(vP, mul(uP, wP)))), T) == {})
    # phi(psi(.)) = id mod F, by identities with explicit cofactors in R
    check(checks, '3c. (x+s^3)^2 + (y-s^2)^3 - s = s F', sub(sub(add(pw(phiX, 2, n), pw(phiY, 3, n)), s), mul(s, F)) == {})
    check(checks, '3c. h - 1 - p(x,y,s) = F (the definition, as polynomials)', sub(sub(sub(h, one), p_of(x, y, s, n)), F) == {})
    check(checks, '3c. alpha h + beta y - 1 = (1 + 2s^2 x) F', sub(sub(add(mul(aR, h), mul(bR, y)), one), mul(cR, F)) == {})
    check(checks, '3c. h T_R - beta x - u = u (1 + 2s^2 x) F', sub(sub(sub(mul(h, phiT), mul(bR, x)), u), mul(mul(u, cR), F)) == {})
    g = add(v, mul(u, w))
    check(checks, '3c. y T_R + alpha x - (v + uw) = (v + uw)(1 + 2s^2 x) F', sub(sub(add(mul(y, phiT), mul(aR, x)), g), mul(mul(g, cR), F)) == {})
    WR = add(mul(mul(aR, add(one, mul(bR, y))), add(y, pw(u, 2, n))),
             mul(pw(bR, 2, n), total(s, scale(mul(h, pw(g, 2, n)), -1), scale(mul(mul(u, y), g), 2))))
    check(checks, '3c. W_R - w = w (1 + 2s^2 x)(1 + beta y) F', sub(sub(WR, w), mul(mul(mul(w, cR), add(one, mul(bR, y))), F)) == {})
    ok = all(c['pass'] for c in checks)
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED', 'checks': checks, 'sources': src.read,
            'decides': 'the whole headline: R/(F) = C^[3] by the paper\'s printed mutually inverse maps, and grad F vanishes at a point, so F is not a coordinate',
            'value': {'F_terms': len(F), 'F_degree': max(sum(e) for e in F), 'psi_w_terms': len(wP)}}


def forge():
    out = []
    r = decide(point=(Fraction(2), Fraction(0), Fraction(-1, 2), Fraction(1, 3)))
    out.append(('the critical point moved (w = 1/3)', r['verdict']))
    r = decide(perturb=1)
    out.append(('s perturbed by + h v^2 (x^2 + y^3 = hs breaks)', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    import time
    t = time.time()
    res = decide()
    print(json.dumps({k: res[k] for k in ('verdict', 'value')}, indent=1))
    for c in res['checks']:
        print(('PASS ' if c['pass'] else 'FAIL ') + c['check'], c['detail'])
    print('%.1fs' % (time.time() - t))
    print(forge())
