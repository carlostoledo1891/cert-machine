#!/usr/bin/env python3
"""
Check C1 for "Finite time blowup for Navier-Stokes" (OpenAI, 2026-09-08), Section 5.1, pp. 45-48.

Substitutes the expansion (5.1) into the axisymmetric cylindrical Navier-Stokes operator at
viscosity one, written in the similarity variables (q, X, eta) with the physical derivatives
obtained by implicit differentiation of q - z^2 q^{2h} = 1 - t, z = q^D eta, X = r^2/(2q)
(these primitives are themselves verified against Lemma 4.1 below), expands in powers of q, and
tests the printed order-n coefficient equations exactly.  sympy only; deterministic; no
sympy.simplify on Derivative objects (jets are replaced by symbols, identities are tested by
exact rational-point evaluation after expansion).

Transcribed from pdftotext -f 45 -l 48 -layout (page numbers are the printed ones):

p. 46, (5.1):   u_{theta,n} = q^{-A+lam_n} E_n = r q^{-A-1/2+lam_n} phi_n / C,   E_n = sqrt(2X) phi_n / C,
                u_{z,n} = q^{-A+lam_n} U_n,     r u_{r,n} = q^{lam_n} V_n,     p_n = q^{-2A+lam_n} Pi_n,
                lam_n = 2 n h,  A_X(U_n)(X,eta) = X^{-1} int_0^X U_n(x,eta) dx.
p. 46:          T_{a,n} = T_{a+lam_n},  Z_{a,n} = Z_{a+lam_n},  Z^{[2]}_{a,n} = Z_{a+lam_n-D} Z_{a+lam_n}.
                Negative field indices mean zero.
p. 46, (5.2):   d_X V_n = -Z_{-A,n} U_n,
                V_n / X = [2 eta U_n - 2 eta (D+lam_n) A_X(U_n) - d d_eta A_X(U_n)] / L.
p. 46, b = -A-1/2, c = -A, primes = d_X at fixed eta:
  (5.3)  2(X phi_n'' + 2 phi_n') = T_{b,n} phi_n + sum_{i+j=n} { V_i (phi_j' + phi_j/X) + U_i Z_{b,j} phi_j } - Z^{[2]}_{b,n-1} phi_{n-1}
  (5.4)  2(X U_n'' + U_n')       = T_{c,n} U_n   + sum_{i+j=n} { V_i U_j' + U_i Z_{c,j} U_j } + Z_{-2A,n} Pi_n - Z^{[2]}_{c,n-1} U_{n-1}
  (5.5)  Pi_n' = C^{-2} sum_{i+j=n} phi_i phi_j - Omega_{n-1} / (2X)
  (5.6)  Omega_k = T_{0,k} V_k + sum_{i+j=k} { V_i (V_j' - V_j/(2X)) + U_i Z_{0,j} V_j } - 2X V_k'' - Z^{[2]}_{0,k-1} V_{k-1}
p. 47:  "The angular vector Laplacian gives 2(X d_XX phi_n + 2 d_X phi_n) after removing r q^{b-1+lam_n}/C.
         The corresponding axial scalar Laplacian gives 2(X d_XX U_n + d_X U_n)."
        "applying the radial operator d_rr + r^{-1} d_r - r^{-2} to V(X)/r gives 2X d_XX V/(q r)"
        "Since (5.2) gives V_j = X v_j with smooth v_j, every term of Omega_k is divisible by X."
p. 47, (5.7):   K_n = A_X(U_n) - U_n,   W_n = (phi_n, U_n, K_n, Pi_n, d_xi phi_n, d_xi U_n)^T,   xi = sqrt(X),
                d_xi W_n + xi^{-1} diag(0,0,2,0,3,1) W_n = A_0 W_n + A_1 d_eta W_n + f_n,   W_n(0) = 0.
p. 48:  "d_xi K_n + 2 K_n / xi = -d_xi U_n, and the two radial second-order operators become
         (d_xixi + 3 xi^{-1} d_xi)/2 and (d_xixi + xi^{-1} d_xi)/2."
        "The pressure row is d_xi Pi_n = 4 xi phi_0 phi_n / C^2 + known terms"
        With H_c = D eta + d U_0, the only possibly nonzero entries of A_1 are
          (A_1)_51 = 2 H_c / L,   (A_1)_52 = (A_1)_53 = -2 d (phi_0 + X d_X phi_0) / L,
          (A_1)_62 = 2 (H_c - d X d_X U_0) / L,   (A_1)_63 = -2 d X d_X U_0 / L,   (A_1)_64 = 2 d / L.
        "Thus A_1 ... maps the first four coordinates into the last two and annihilates the last two."
p. 49:  r_{theta,n} = (R/C)[ T_{b,n} phi_n + sum{...} - 2(X phi_n'' + 2 phi_n') - Z^{[2]}_{b,n-1} phi_{n-1} ],  R = sqrt(2X),
        r_{z,n}     =        T_{c,n} U_n + sum{...} + Z_{-2A,n} Pi_n - 2(X U_n'' + U_n') - Z^{[2]}_{c,n-1} U_{n-1},
        R_{j,n} = q^{-A-1+lam_n} r_{j,n}  (p. 53).
Lemma 4.1, (4.2): d_t(q^b f) = q^{b-1} T_b f,  d_z(q^b f) = q^{b-D} Z_b f,
        T_b f = L^{-1}(-b f + D eta f_eta + X f_X),   Z_b f = L^{-1}(2 b eta f + d f_eta - 2 eta X f_X),
        with (4.1): d = 1 - eta^2, L = 1 - 2 h eta^2, A = 1/2 + h, D = 1/2 - h.

The residual at viscosity one is R(u,p) = d_t u + (u.grad)u - Lap u + grad p, (3.1); its axisymmetric
cylindrical components are written out below (standard).
"""
import sys
import time
import random
import sympy as sp

T0 = time.time()
q, X, eta, h, C, xi, s_ = sp.symbols('q X eta h C xi s', positive=True)
A = sp.Rational(1, 2) + h
D = sp.Rational(1, 2) - h
Lf = sp.Function('L')(eta)          # L = 1 - 2 h eta^2, kept opaque so q L stays a product of powers
df = sp.Function('d')(eta)          # d = 1 - eta^2
L_explicit = 1 - 2*h*eta**2
d_explicit = 1 - eta**2
L, d = Lf, df
r = sp.sqrt(2*q*X)
b = -A - sp.Rational(1, 2)
c = -A
def lam(n): return 2*n*h

RESULTS = []
def report(name, ok, residual=None):
    line = ("PASS " + name) if ok else ("FAIL " + name + " " + str(residual)[:400])
    print(line, flush=True)
    RESULTS.append(ok)

# ---------------------------------------------------------------- jets -> symbols, exact zero test
JET = {}                                   # atom -> symbol, one consistent table for the whole run
def jetsym(a):
    if a not in JET:
        JET[a] = sp.Symbol('%s%d' % ('J' if isinstance(a, sp.Derivative) else 'F', len(JET)))
    return JET[a]
def jetsub(e):
    e = sp.expand(e.doit())
    for a in sorted(e.atoms(sp.Derivative), key=lambda a: sp.srepr(a)):
        jetsym(a)
    e = e.xreplace({a: JET[a] for a in e.atoms(sp.Derivative)})
    for a in sorted(e.atoms(sp.core.function.AppliedUndef), key=lambda a: sp.srepr(a)):
        jetsym(a)
    return sp.expand(e.xreplace({a: JET[a] for a in e.atoms(sp.core.function.AppliedUndef)}))
def tie(e):
    """Replace the jet symbols of L(eta), d(eta) and their eta-derivatives by the explicit forms (4.1)."""
    rep = {}
    for a, sym in JET.items():
        if isinstance(a, sp.Derivative):
            base, order = a.expr, sum(cnt for v, cnt in a.variable_count)
            if base == Lf: rep[sym] = sp.diff(L_explicit, eta, order)
            if base == df: rep[sym] = sp.diff(d_explicit, eta, order)
        elif a == Lf: rep[sym] = L_explicit
        elif a == df: rep[sym] = d_explicit
    return e.xreplace(rep)

def is_zero(e, trials=3):
    """Exact test: expand, replace jets by symbols, check q-free, then evaluate at random rational points."""
    e = jetsub(e)
    if e == 0:
        return True, None
    if e.has(q):
        return False, "uncancelled q-power in: " + str(e)
    e = sp.expand(tie(e))
    if e == 0:
        return True, None
    syms = sorted(e.free_symbols, key=str)
    rng = random.Random(20260909)
    for _ in range(trials):
        while True:
            vals = {}
            for sname in syms:
                if sname == h:
                    vals[sname] = sp.Rational(rng.randint(1, 30), rng.randint(200, 400))   # 0 < h < 1/6
                elif sname == eta:
                    vals[sname] = sp.Rational(rng.randint(-40, 40), 41)                    # |eta| < 1
                elif sname in (X, C):
                    vals[sname] = sp.Rational(rng.randint(1, 50), rng.randint(1, 50))
                else:
                    vals[sname] = sp.Rational(rng.randint(-50, 50), rng.randint(1, 50))
            if vals.get(X, 1) != 0 and (1 - 2*vals.get(h, 0)*vals.get(eta, 0)**2) != 0:
                break
        v = e.subs(vals)
        if v != 0:
            return False, "nonzero at rational point, residual expression: " + str(e)
    return True, None

def check(name, expr):
    ok, res = is_zero(expr)
    report(name, ok, res)

# ---------------------------------------------------------------- physical derivative primitives
# Implicit differentiation of  q - z^2 q^{2h} = 1 - t,  z = q^D eta,  X = s/q (s = r^2/2 fixed under d_z, d_t)
q_t = -1/L;            X_t = X/(q*L);              eta_t = D*eta/(q*L)
q_z = 2*eta*q**(1-D)/L; X_z = -2*eta*X*q**(-D)/L;  eta_z = q**(-D)*d/L
EXPL = {Lf: L_explicit, df: d_explicit}
def Dt(g): return q_t*sp.diff(g, q) + X_t*sp.diff(g, X) + eta_t*sp.diff(g, eta)
def Dz(g): return q_z*sp.diff(g, q) + X_z*sp.diff(g, X) + eta_z*sp.diff(g, eta)
def Dr(g): return sp.sqrt(2*X/q)*sp.diff(g, X)           # X_r = r/q at fixed (z,t)

# verify the primitives from the coordinate map (q,eta) -> (z,t) at fixed s
zz = q**D*eta; tt = 1 - q*(1 - eta**2)
J = sp.Matrix([[sp.diff(zz, q), sp.diff(zz, eta)], [sp.diff(tt, q), sp.diff(tt, eta)]])
Ji = J.inv()
prim = [(Ji[0, 0] - q_z).subs(EXPL), (Ji[1, 0] - eta_z).subs(EXPL), (Ji[0, 1] - q_t).subs(EXPL), (Ji[1, 1] - eta_t).subs(EXPL),
        (-(X/q)*q_z - X_z).subs(EXPL), (-(X/q)*q_t - X_t).subs(EXPL)]
report("primitives q_z,eta_z,q_t,eta_t,X_z,X_t from implicit differentiation of q - z^2 q^{2h} = 1-t",
       all(sp.simplify(sp.powsimp(p_, force=True)) == 0 for p_ in prim), [sp.simplify(p_) for p_ in prim])

# Lemma 4.1 operators (4.2)
def T(bb, f): return (-bb*f + D*eta*sp.diff(f, eta) + X*sp.diff(f, X))/L
def Z(bb, f): return (2*bb*eta*f + d*sp.diff(f, eta) - 2*eta*X*sp.diff(f, X))/L
def Z2(bb, f): return Z(bb - D, Z(bb, f))                 # Z^{[2]}_a = Z_{a-D} Z_a  (printed order)
bb = sp.Symbol('beta')
f = sp.Function('f')(X, eta)
check("Lemma 4.1: d_t(q^b f) = q^{b-1} T_b f", (Dt(q**bb*f) - q**(bb-1)*T(bb, f))*q**(1-bb))
check("Lemma 4.1: d_z(q^b f) = q^{b-D} Z_b f", (Dz(q**bb*f) - q**(bb-D)*Z(bb, f))*q**(D-bb))
check("d_zz(q^b f) = q^{b-2D} Z_{b-D} Z_b f  (order of composition in Z^{[2]})",
      (Dz(Dz(q**bb*f)) - q**(bb-2*D)*Z2(bb, f))*q**(2*D-bb))

# ---------------------------------------------------------------- the expansion (5.1)
def phi(i): return sp.Function('phi%d' % i)(X, eta)
def U(i):   return sp.Function('U%d' % i)(X, eta)
def V(i):   return sp.Function('V%d' % i)(X, eta)
def Pi(i):  return sp.Function('Pi%d' % i)(X, eta)
def uth(i): return r*q**(b + lam(i))*phi(i)/C
def uz(i):  return q**(-A + lam(i))*U(i)
def ur(i):  return q**(lam(i))*V(i)/r
def p(i):   return q**(-2*A + lam(i))*Pi(i)
def dX(g):  return sp.diff(g, X)
def lapv(g): return Dr(Dr(g)) + Dr(g)/r - g/r**2         # radial part of the vector Laplacian (theta, r components)
def laps(g): return Dr(Dr(g)) + Dr(g)/r                  # radial part of the scalar Laplacian (z component)

# printed order-n brackets
def bracket_theta(n):
    e = T(b + lam(n), phi(n)) - 2*(X*dX(dX(phi(n))) + 2*dX(phi(n)))
    for i in range(n + 1):
        j = n - i
        e += V(i)*(dX(phi(j)) + phi(j)/X) + U(i)*Z(b + lam(j), phi(j))
    if n >= 1:
        e -= Z2(b + lam(n - 1), phi(n - 1))
    return e
def bracket_z(n):
    e = T(c + lam(n), U(n)) + Z(-2*A + lam(n), Pi(n)) - 2*(X*dX(dX(U(n))) + dX(U(n)))
    for i in range(n + 1):
        j = n - i
        e += V(i)*dX(U(j)) + U(i)*Z(c + lam(j), U(j))
    if n >= 1:
        e -= Z2(c + lam(n - 1), U(n - 1))
    return e
def Omega(k):
    if k < 0:
        return sp.Integer(0)
    e = T(lam(k), V(k)) - 2*X*dX(dX(V(k)))
    for i in range(k + 1):
        j = k - i
        e += V(i)*(dX(V(j)) - V(j)/(2*X)) + U(i)*Z(lam(j), V(j))
    if k >= 1:
        e -= Z2(lam(k - 1), V(k - 1))
    return e
def bracket_r(n):                                        # r R_r at power q^{-2A+lam_n}:  2X[Pi_n' - (5.5) RHS]
    e = 2*X*dX(Pi(n)) + Omega(n - 1)
    for i in range(n + 1):
        e -= 2*X*phi(i)*phi(n - i)/C**2
    return e
def bracket_div(n):                                      # (5.2) first form, at power q^{lam_n - 1}
    return dX(V(n)) + Z(-A + lam(n), U(n))

# ---------------------------------------------------------------- piecewise tests (each printed term)
n = sp.Integer(2); i_, j_ = 1, 2
check("theta: [d_t - (d_rr + d_r/r - 1/r^2)] u_theta,n  ->  T_{b,n} phi_n - 2(X phi_n'' + 2 phi_n')  after removing r q^{b-1+lam_n}/C",
      (Dt(uth(2)) - lapv(uth(2)))*C/(r*q**(b - 1 + lam(2))) - (T(b + lam(2), phi(2)) - 2*(X*dX(dX(phi(2))) + 2*dX(phi(2)))))
check("theta: -d_zz u_theta,n  ->  -Z^{[2]}_{b,n} phi_n at power r q^{b-1+lam_n+2h}/C (enters order n+1)",
      (-Dz(Dz(uth(2))))*C/(r*q**(b - 1 + lam(2) + 2*h)) + Z2(b + lam(2), phi(2)))
check("theta: u_r,i d_r u_theta,j + u_z,i d_z u_theta,j + u_r,i u_theta,j / r  ->  V_i(phi_j' + phi_j/X) + U_i Z_{b,j} phi_j",
      (ur(i_)*Dr(uth(j_)) + uz(i_)*Dz(uth(j_)) + ur(i_)*uth(j_)/r)*C/(r*q**(b - 1 + lam(i_) + lam(j_)))
      - (V(i_)*(dX(phi(j_)) + phi(j_)/X) + U(i_)*Z(b + lam(j_), phi(j_))))
check("z: [d_t - (d_rr + d_r/r)] u_z,n  ->  T_{c,n} U_n - 2(X U_n'' + U_n') at power q^{c-1+lam_n}",
      (Dt(uz(2)) - laps(uz(2)))/q**(c - 1 + lam(2)) - (T(c + lam(2), U(2)) - 2*(X*dX(dX(U(2))) + dX(U(2)))))
check("z: -d_zz u_z,n  ->  -Z^{[2]}_{c,n} U_n at power q^{c-1+lam_n+2h}",
      (-Dz(Dz(uz(2))))/q**(c - 1 + lam(2) + 2*h) + Z2(c + lam(2), U(2)))
check("z: u_r,i d_r u_z,j + u_z,i d_z u_z,j  ->  V_i U_j' + U_i Z_{c,j} U_j",
      (ur(i_)*Dr(uz(j_)) + uz(i_)*Dz(uz(j_)))/q**(c - 1 + lam(i_) + lam(j_)) - (V(i_)*dX(U(j_)) + U(i_)*Z(c + lam(j_), U(j_))))
check("z: d_z p_n  ->  Z_{-2A,n} Pi_n at power q^{c-1+lam_n}",
      Dz(p(2))/q**(c - 1 + lam(2)) - Z(-2*A + lam(2), Pi(2)))
check("r: r d_t u_r,k  ->  T_{0,k} V_k at power q^{lam_k-1}",
      r*Dt(ur(2))/q**(lam(2) - 1) - T(lam(2), V(2)))
check("r: r u_r,i d_r u_r,j + r u_z,i d_z u_r,j  ->  V_i(V_j' - V_j/(2X)) + U_i Z_{0,j} V_j",
      (r*ur(i_)*Dr(ur(j_)) + r*uz(i_)*Dz(ur(j_)))/q**(lam(i_) + lam(j_) - 1) - (V(i_)*(dX(V(j_)) - V(j_)/(2*X)) + U(i_)*Z(lam(j_), V(j_))))
check("r: -r (d_rr + d_r/r - 1/r^2) u_r,k  ->  -2X V_k''   ('2X d_XX V/(q r)' claim, p. 47)",
      -r*lapv(ur(2))/q**(lam(2) - 1) + 2*X*dX(dX(V(2))))
check("r: -r d_zz u_r,k  ->  -Z^{[2]}_{0,k} V_k at power q^{lam_k-1+2h} (enters order k+1)",
      -r*Dz(Dz(ur(2)))/q**(lam(2) - 1 + 2*h) + Z2(lam(2), V(2)))
check("r: -u_theta,i u_theta,j  ->  -2X phi_i phi_j / C^2 at power q^{-2A+lam_i+lam_j}",
      -uth(i_)*uth(j_)/q**(-2*A + lam(i_) + lam(j_)) + 2*X*phi(i_)*phi(j_)/C**2)
check("r: r d_r p_n  ->  2X Pi_n' at power q^{-2A+lam_n}",
      r*Dr(p(2))/q**(-2*A + lam(2)) - 2*X*dX(Pi(2)))
check("power bookkeeping: q^{lam_k - 1} = q^{-2A + lam_{k+1}}  (Omega_{k} enters (5.5) at order k+1)",
      sp.expand((lam(2) - 1) - (-2*A + lam(3))))
check("div: r^{-1} d_r(r u_r,n) + d_z u_z,n  ->  V_n' + Z_{-A,n} U_n at power q^{lam_n-1}",
      (Dr(ur(2)) + ur(2)/r + Dz(uz(2)))/q**(lam(2) - 1) - bracket_div(2))

# ---------------------------------------------------------------- full residual with orders 0..N, grouped by q-power
N = 2
uT = sum(uth(i) for i in range(N + 1)); uZ = sum(uz(i) for i in range(N + 1))
uR = sum(ur(i) for i in range(N + 1));  P = sum(p(i) for i in range(N + 1))
R_theta = Dt(uT) + uR*Dr(uT) + uZ*Dz(uT) + uR*uT/r - lapv(uT) - Dz(Dz(uT))
R_z     = Dt(uZ) + uR*Dr(uZ) + uZ*Dz(uZ) - laps(uZ) - Dz(Dz(uZ)) + Dz(P)
rR_r    = r*(Dt(uR) + uR*Dr(uR) + uZ*Dz(uR) - lapv(uR) - Dz(Dz(uR)) + Dr(P)) - uT**2
DIV     = Dr(uR) + uR/r + Dz(uZ)

def by_power(expr):
    out = {}
    for term in sp.Add.make_args(jetsub(expr)):
        ex = sp.expand(term.as_powers_dict().get(q, 0))     # symbolic exponents (as_coeff_exponent drops them)
        cf = sp.expand(term*q**(-ex))
        assert not cf.has(q), term
        out[ex] = out.get(ex, 0) + cf
    return out

for label, expr, base, bracket, extra in [
        ("theta", R_theta, -A - 1, lambda n_: sp.sqrt(2*X)/C*bracket_theta(n_), 1),
        ("z",     R_z,     -A - 1, bracket_z, 1),
        ("r",     rR_r,    -2*A,   bracket_r, 1),
        ("div",   DIV,     -1,     bracket_div, 0)]:
    groups = by_power(expr)
    expected_exps = {sp.expand(base + lam(m)) for m in range(0, 2*N + 1 + extra)}
    stray = [ex for ex in groups if ex not in expected_exps]
    report("%s-residual with orders 0..%d: every q-power is of the form q^{%s + 2mh}" % (label, N, str(base)), not stray, stray)
    for n_ in range(N + 1):
        ex = sp.expand(base + lam(n_))
        got = groups.get(ex, sp.Integer(0))
        check("%s-residual, coefficient of q^{%s + lam_%d} equals printed order-%d bracket (%s)" %
              (label, str(base), n_, n_, {"theta": "(5.3)", "z": "(5.4)", "r": "(5.5)+(5.6)", "div": "(5.2)"}[label]),
              got - jetsub(bracket(n_)))

# ---------------------------------------------------------------- (5.2) closed form, K-equation, xi-operators
am = [sp.Function('a%d' % m)(eta) for m in range(5)]
Upoly = sum(am[m]*X**m for m in range(5))
AXU = sum(am[m]*X**m/(m + 1) for m in range(5))          # X^{-1} int_0^X U
Vclosed = X*(2*eta*Upoly - 2*eta*(D + lam(2))*AXU - d*sp.diff(AXU, eta))/L
check("(5.2) closed form: d_X V_n = -Z_{-A,n} U_n with V_n/X = [2 eta U_n - 2 eta (D+lam_n) A_X U_n - d d_eta A_X U_n]/L",
      sp.diff(Vclosed, X) + Z(-A + lam(2), Upoly))
Kaux = AXU - Upoly
Uxi = Upoly.subs(X, xi**2); Kxi = Kaux.subs(X, xi**2)
check("(5.7): d_xi K_n + 2 K_n/xi = -d_xi U_n with K_n = A_X(U_n) - U_n", sp.diff(Kxi, xi) + 2*Kxi/xi + sp.diff(Uxi, xi))
check("(5.7): 2(X phi'' + 2 phi') = (d_xixi + 3 xi^{-1} d_xi) phi / 2",
      (2*(X*sp.diff(Upoly, X, 2) + 2*sp.diff(Upoly, X))).subs(X, xi**2) - (sp.diff(Uxi, xi, 2) + 3*sp.diff(Uxi, xi)/xi)/2)
check("(5.7): 2(X U'' + U') = (d_xixi + xi^{-1} d_xi) U / 2",
      (2*(X*sp.diff(Upoly, X, 2) + sp.diff(Upoly, X))).subs(X, xi**2) - (sp.diff(Uxi, xi, 2) + sp.diff(Uxi, xi)/xi)/2)
check("(5.7) pressure row: d_xi Pi_n = 4 xi phi_0 phi_n / C^2 + known   (from (5.5), d_xi = 2 xi d_X)",
      2*xi*(2*phi(0)*phi(2)/C**2) - 4*xi*phi(0)*phi(2)/C**2)

# ---------------------------------------------------------------- A_1 sparsity and entries (n = 2)
Kn = sp.Function('K2')(X, eta)
Vn_closed = X*(2*eta*U(2) - 2*eta*(D + lam(2))*(Kn + U(2)) - d*sp.diff(Kn + U(2), eta))/L
row5 = 2*(bracket_theta(2) + 2*(X*dX(dX(phi(2))) + 2*dX(phi(2)))).subs(V(2), Vn_closed)   # 2 x RHS of (5.3)
row6 = 2*(bracket_z(2) + 2*(X*dX(dX(U(2))) + dX(U(2)))).subs(V(2), Vn_closed)             # 2 x RHS of (5.4)
Hc = D*eta + d*U(0)
unknowns = [phi(2), U(2), Kn, Pi(2)]
def coeff_of(expr, der):
    e = jetsub(expr)
    return sp.expand(e.coeff(jetsym(der)))
printed = {
    (5, 0): 2*Hc/L, (5, 1): -2*d*(phi(0) + X*dX(phi(0)))/L, (5, 2): -2*d*(phi(0) + X*dX(phi(0)))/L, (5, 3): 0,
    (6, 0): 0,      (6, 1): 2*(Hc - d*X*dX(U(0)))/L,          (6, 2): -2*d*X*dX(U(0))/L,               (6, 3): 2*d/L}
A1 = sp.zeros(6, 6)
for rowidx, row in [(5, row5), (6, row6)]:
    for col, w in enumerate(unknowns):
        got = coeff_of(row, sp.Derivative(w, eta))
        A1[rowidx - 1, col] = got
        check("(A_1)_%d%d coefficient of d_eta %s in row %d equals printed %s" % (rowidx, col + 1, str(w.func), rowidx, str(printed[(rowidx, col)])),
              got - printed[(rowidx, col)])
    for w in unknowns:
        check("row %d: no d_eta^2 %s" % (rowidx, str(w.func)), coeff_of(row, sp.Derivative(w, (eta, 2))))
        check("row %d: no mixed d_X d_eta %s (A_1 annihilates the last two coordinates)" % (rowidx, str(w.func)),
              coeff_of(row, sp.Derivative(w, X, eta)))
# rows 1-4: (5.7) rows for phi, U are definitions; row 3 is the K-equation; row 4 is (5.5): none contains d_eta of an unknown
row4 = jetsub(2*xi*(2*phi(0)*phi(2)/C**2 - Omega(1)/(2*X) + sum(phi(i)*phi(2 - i) for i in range(1, 2))/C**2))
report("rows 1-4 of (5.7) contain no d_eta of an order-n unknown (row 4 = (5.5) checked, rows 1-3 by form)",
       all(row4.coeff(jetsym(sp.Derivative(w, eta))) == 0 for w in unknowns))
Dg = sp.diag(*sp.symbols('g1:7'))
report("A_1 D_0 A_1 = 0 for any diagonal D_0 (block nilpotency used in (5.8))", sp.expand(A1*Dg*A1) == sp.zeros(6, 6))
A1eta = A1.applyfunc(lambda e_: sp.diff(tie(e_), eta))
report("A_1 D_0 (d_eta A_1) = 0", sp.expand(A1*Dg*A1eta) == sp.zeros(6, 6))

# ---------------------------------------------------------------- Omega_k divisible by X  (V_j = X v_j)
vfun = [sp.Function('v%d' % j)(X, eta) for j in range(3)]
Om2 = Omega(2).subs({V(j): X*vfun[j] for j in range(3)}).doit()
quot = sp.cancel(jetsub(Om2/X))
num, den = sp.fraction(quot)
report("Omega_2 / X has no X in its denominator after V_j = X v_j (divisibility claim, p. 47); denominator = %s" % str(sp.factor(den)),
       not den.has(X))
check("sample term V_i(V_j' - V_j/(2X)) = X v_i (v_j/2 + X v_j') (p. 47)",
      (V(1)*(dX(V(2)) - V(2)/(2*X))).subs({V(1): X*vfun[1], V(2): X*vfun[2]}) - X*vfun[1]*(vfun[2]/2 + X*dX(vfun[2])))

print("elapsed %.1fs; %d/%d passed" % (time.time() - T0, sum(RESULTS), len(RESULTS)))
sys.exit(0 if all(RESULTS) else 1)
