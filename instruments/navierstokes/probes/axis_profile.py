#!/usr/bin/env python3
"""
Check C14 for "Finite time blowup for Navier-Stokes" (OpenAI, 2026-09-08), Appendix B, pp. 144-150.

A direct numerical solve of the axis initial-value problem (4.13) with (4.7) in the rescaled
radius Y = Lambda*X, for concrete axis data of the kind Section B.1 prescribes, compared with
the closed forms Proposition B.2 claims, and tested against the inequalities of Propositions
B.2-B.3.  numpy / scipy / mpmath-free; deterministic; exit 0 iff every test prints PASS.

THIS IS A NUMERICAL ILLUSTRATION OF THE WRITEUP'S EQUATIONS, NOT A CERTIFIED OBJECT.  Nothing
here is interval-arithmetic; a FAIL would be evidence against a printed inequality at THESE
data, never a refutation of the theorem; a PASS is a consistency check of the transcription
and of the claimed inequalities at one representative parameter set.

Equations solved (paper page numbers in brackets).  With E = sqrt(2X) phi / C, phi = phi* Phi,
U = U* + u/Lambda, Pi = Pi0 + Lambda^{-1} int_0^Y g^2 Phi^2 dY', g = phi*/C [(B.12), p. 146]:
  theta:  -2L (X phi_XX + 2 phi_X)/phi = Sq,   z:  -2L (X U_XX + U_X) = Sn          [(4.13), p. 27]
  Sq = -W l - h(1-2 eta U) - Hc (log E)_eta,   l = 1 + D_X log phi                   [(4.9),  p. 26]
  Sn = -W D_X U - A(1-2 eta U) U - Hc U_eta - d Pi_eta + 4 A eta Pi + 2 eta D_X Pi   [(4.9),  p. 26]
  W  = 1 - 2 D eta A_X(U) - d d_eta A_X(U),   Hc = D eta + d U,   A_X(U) = X^{-1} int_0^X U  [(4.8)]
  Pi_X = E^2/(2X)  (so Pi_Y = Lambda^{-1} g^2 Phi^2)                                  [(4.7),  p. 26]
Axis data [Section B.1, pp. 144-145]:
  U* = 4 eta + j0,  H* = D eta + d U*,  W* = 1 - d U*' - 2 D eta U*,
  Z* = -A(1-2 eta U*) U* - H* U*' - d Pi0' + 4 A eta Pi0,
  chi = H*^2/(H*^2+sigma*^2),  zeta* = -L H*/(H*^2+sigma*^2),  xi0 = Lambda zeta*,
  phi*(eta) = exp(Lambda int_0^eta zeta*),  (log E)_eta = xi0 + Phi_eta/Phi.
The identity -H* xi0 = Lambda L chi (p. 147) is used in that exact form, so Sq is evaluated as
  Sq = -W l - h(1-2 eta U) + Lambda L chi - d u zeta* - Hc Phi_eta/Phi
(no cancellation of two Lambda-sized numbers).  Independent variable s = log Y; state
(Phi, Psi=Y^2 Phi_Y, u, Theta=Y u_Y, Iu=int_0^Y u, Ip=int_0^Y g^2 Phi^2), so that
  Phi_s = Psi/Y,  Psi_s = -Y^2 Phi Sq/(2 L Lambda),  u_s = Theta,  Theta_s = -Y Sn/(2L),
which is exactly (4.13) in Y with no 1/Y stiffness.  Initial data at Y0 = 1e-3 from the
regular series (Fuchsian point: exponents 0,-1 for theta and 0,0 for z; the regular branch is
fixed by Phi(0)=1, u(0)=0).

Closed forms claimed (p. 147-148):  Phi0 = f0(Y chi),  f0(z) = sum_{a>=0} (-z/2)^a/(a!(a+1)!)
= sqrt(2/z) J_1(sqrt(2z));  u0 = -Y Z*/(2L);  and (B.13): the solution differs from these by
O(1/Lambda) in every fixed derivative, uniformly in C >= C0(Lambda).

Data used (the paper fixes no numbers; see the caption file for the same list):
  h = 0.01 (paper: 0 < h <= 1e-2), j0 = 0.05 (paper: 0 < j0 <= .05), P* = 2 (representative;
  the paper's P* > e^{Td} is astronomically large and enters only through Z*(eta0) > 0 and the
  size of |p2|), Pi0(eta) = -3 P*^2 (1+eta^2)^{-2} (satisfies Lemma A.5's Pi0 <= -(5/2) P*^2 f^2,
  even, eta Pi0' > 0, analytic), delta* = 0.1, sigma* from (B.2) with the factor 0.9, C =
  1e4 * max_{[-1,1]} phi* (the paper needs C >= sup over a COMPLEX neighbourhood, which is
  larger by e^{c Lambda}; with this C, g^2 <= 1e-8 and the pressure perturbation is
  negligible -- effectively the C -> infinity limit in which (B.13) is claimed uniform).
  eta grid: Chebyshev-Gauss-Lobatto in xi, mapped by eta = eta0 + a sinh(b (xi - xi0)) onto
  [-1.02, 1.02] (b = 7), so that the feature of chi of width sigma*/|H*'(eta0)| ~ 7e-4 at
  eta0 is resolved; eta derivatives by the mapped spectral differentiation matrix.
Lambda family for the 1/Lambda scaling: 1e3, 1e4, 1e5, 1e6, 1e7.  Inequality tests at
Lambda_main = 1e7 (the claims are "for Lambda sufficiently large"; the threshold implied by
the paper's own absorption of the d u zeta* term is Lambda >> sigma*^{-2}, see the memo).
"""
import sys, os, time, json
import numpy as np
from scipy.integrate import solve_ivp, quad
from scipy.optimize import brentq
from scipy.special import j1
from scipy.interpolate import BarycentricInterpolator

np.random.seed(0)  # nothing random is used; stated for the record
T0 = time.time()
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
FIG_PNG = os.path.join(ROOT, 'corpus', 'navier-stokes', 'fig-axis-profile.png')
FIG_TXT = os.path.join(ROOT, 'corpus', 'navier-stokes', 'fig-axis-profile.txt')

# ----------------------------------------------------------------------------- data
h = 0.01; J0C = 0.05; PSTAR = 2.0
A = 0.5 + h; D = 0.5 - h
DELTA_STAR = 0.1
CFAC = 1e4
LAMBDAS = [1e3, 1e4, 1e5, 1e6, 1e7]
LAMBDA_MAIN = 1e7
Y0 = 1e-3; YEND = 4.1; YEXIT = 4.0
N_MAIN = 560; N_CONV = 400
FAILS = []

def report(ok, name, value=''):
    tag = 'PASS' if ok else 'FAIL'
    print(f"{tag} {name} {value}".rstrip())
    if not ok:
        FAILS.append(name)
    sys.stdout.flush()

def Pi0(e):   return -3.0 * PSTAR**2 / (1 + e**2)**2
def Pi0p(e):  return 12.0 * PSTAR**2 * e / (1 + e**2)**3
def Hstar(e): return D*e + (1 - e**2)*(4*e + J0C)
def Zstar(e):
    d = 1 - e**2; Us = 4*e + J0C
    return -A*(1 - 2*e*Us)*Us - Hstar(e)*4.0 - d*Pi0p(e) + 4*A*e*Pi0(e)

# f0 and f0' by the series (exact to machine precision on [0, 4.1] with 40 terms)
def f0(z):
    z = np.asarray(z, dtype=float); out = np.zeros_like(z); term = np.ones_like(z)
    for a in range(0, 40):
        if a > 0:
            term = term * (-z/2) / (a*(a+1))
        out = out + term
    return out
def f0p(z):
    z = np.asarray(z, dtype=float); out = np.zeros_like(z); term = np.ones_like(z)
    for a in range(0, 40):
        if a > 0:
            term = term * (-z/2) / (a*(a+1))
            out = out + a*term/np.where(z == 0, 1.0, z)
    # at z=0 the derivative is -1/4
    return np.where(z == 0, -0.25, out)

# ----------------------------------------------------------------------------- B.1 choices
eta0 = brentq(Hstar, -0.5, 0.0)
efine = np.linspace(-1, 1, 400001)
Zf = Zstar(efine)
S = np.abs(Zf) <= DELTA_STAR
dist_S_eta0 = np.min(np.abs(efine[S] - eta0))
sigma_star = 0.9 * np.min(np.abs(Hstar(efine[S]))) / np.sqrt(99.0)
def chi_of(e):  return Hstar(e)**2 / (Hstar(e)**2 + sigma_star**2)
def zeta_of(e): return -(1 - 2*h*e**2) * Hstar(e) / (Hstar(e)**2 + sigma_star**2)
print(f"# data: h={h} j0={J0C} P*={PSTAR} Pi0=-3P*^2 f^2  eta0={eta0:.6f}  Z*(eta0)={Zstar(eta0):.4f}  "
      f"-W*min={np.min(3-8*h*efine**2+(1-2*h)*J0C*efine):.4f}")
print(f"# B.1: delta*={DELTA_STAR}  dist({{|Z*|<=delta*}}, eta0)={dist_S_eta0:.5f}  sigma*={sigma_star:.5f}  "
      f"min chi on {{|Z*|<=delta*}} = {np.min(chi_of(efine[S])):.5f}  zeros of Z* near "
      f"{[round(float(x),4) for x in efine[1:][np.sign(Zf[1:])!=np.sign(Zf[:-1])]]}")
report(Zstar(eta0) > 0, 'B1_Zstar_positive_at_eta0', f"Z*(eta0)={Zstar(eta0):.4f}")
report(dist_S_eta0 > 0 and np.min(chi_of(efine[S])) > 0.99,
       'B2_chi_gt_0.99_where_Zstar_small', f"min chi={np.min(chi_of(efine[S])):.5f}, separation from eta0 = {dist_S_eta0:.4f} = {dist_S_eta0/sigma_star:.1f} sigma*")
report(np.min(3-8*h*efine**2+(1-2*h)*J0C*efine) > 2.8, 'B1_minus_Wstar_gt_2.8')

# closed-form identity f0 = sqrt(2/z) J1(sqrt(2z))
zz = np.linspace(1e-6, 4.1, 5000)
ident = np.max(np.abs(f0(zz) - np.sqrt(2/zz)*j1(np.sqrt(2*zz))))
report(ident < 1e-13, 'f0_equals_sqrt(2/z)J1(sqrt(2z))', f"max|diff|={ident:.2e}")
report(np.min(f0(np.linspace(0, 4.1, 5000))) > 0.265 and np.max(f0(np.linspace(0, 4.1, 5000))) <= 1 + 1e-15,
       'B11_f0_bounds_[.265,1]', f"min f0={np.min(f0(np.linspace(0,4.1,5000))):.4f}")

# ----------------------------------------------------------------------------- grid
def cheb(N):
    x = np.cos(np.pi*np.arange(N+1)/N)
    c = np.hstack([2, np.ones(N-1), 2]) * (-1)**np.arange(N+1)
    Xm = np.tile(x, (N+1, 1)).T
    dX = Xm - Xm.T
    Dm = np.outer(c, 1/c) / (dX + np.eye(N+1))
    Dm = Dm - np.diag(Dm.sum(1))
    return Dm, x

class Grid:
    def __init__(self, N, b=7.0, lo=-1.02, hi=1.02):
        Dxi, xi = cheb(N)
        g = lambda x0: np.sinh(b*(1-x0))/np.sinh(-b*(1+x0)) - (hi-eta0)/(lo-eta0)
        self.xi0 = brentq(g, -0.9, 0.9)
        self.a = (hi-eta0)/np.sinh(b*(1-self.xi0)); self.b = b
        self.xi = xi
        self.eta = eta0 + self.a*np.sinh(b*(xi-self.xi0))
        deta = self.a*b*np.cosh(b*(xi-self.xi0))
        self.D = Dxi / deta[:, None]
        e = self.eta
        self.d = 1 - e**2; self.L = 1 - 2*h*e**2
        self.Us = 4*e + J0C; self.Usp = 4.0
        self.Hs = Hstar(e); self.Zs = Zstar(e)
        self.chi = chi_of(e); self.zeta = zeta_of(e)
        self.Pi0 = Pi0(e); self.Pi0p = Pi0p(e)
        # log phi* / Lambda = int_0^eta zeta*, by 24-point Gauss-Legendre on each grid interval (the grid
        # resolves zeta*'s sigma*-wide peak, so this is exact to rounding), accumulated from eta = 0
        gx, gw = np.polynomial.legendre.leggauss(24)
        def gl(a_, b_):
            mid, half = 0.5*(a_+b_), 0.5*(b_-a_)
            return half*np.sum(gw*zeta_of(mid + half*gx))
        es = e[::-1]                      # ascending eta
        seg = np.array([gl(es[k], es[k+1]) for k in range(len(es)-1)])
        F = np.concatenate([[0.0], np.cumsum(seg)])           # int_{eta_min}^{eta_j}
        k0 = int(np.searchsorted(es, 0.0)) - 1                 # es[k0] <= 0 < es[k0+1]
        F0 = F[k0] + gl(es[k0], 0.0)
        self.Izeta = (F - F0)[::-1]
        chk = quad(zeta_of, 0.0, float(e[0]), points=[eta0], limit=400, epsabs=1e-12, epsrel=1e-12)[0]
        self.Izeta_check = abs(chk - self.Izeta[0])
        self.mask = (e >= -1) & (e <= 1)
    def xi_of_eta(self, e):
        return self.xi0 + np.arcsinh((e-eta0)/self.a)/self.b

# ----------------------------------------------------------------------------- the IVP
def make_rhs(G, Lam, logC):
    M = len(G.eta)
    e, d, L, Us, Usp, Hs, chi, zeta, P0, P0p = G.eta, G.d, G.L, G.Us, G.Usp, G.Hs, G.chi, G.zeta, G.Pi0, G.Pi0p
    logg = Lam*G.Izeta - logC
    g2 = np.exp(2*np.minimum(logg, 0.0))
    def terms(s, y):
        Y = np.exp(s)
        Phi, Psi, u, Th, Iu, Ip = y.reshape(6, M)
        DPhi, Du, DIu, DIp = (G.D @ np.stack([Phi, u, Iu, Ip], axis=1)).T
        U = Us + u/Lam
        AXU = Us + Iu/(Lam*Y); dAXU = Usp + DIu/(Lam*Y)
        W = 1 - 2*D*e*AXU - d*dAXU
        Hc = Hs + d*u/Lam
        l = 1 + Psi/(Y*Phi)
        Sq = -W*l - h*(1-2*e*U) + Lam*L*chi - d*u*zeta - Hc*DPhi/Phi
        Pi = P0 + Ip/Lam; Pie = P0p + DIp/Lam; YPiY = Y*g2*Phi**2/Lam
        Ue = Usp + Du/Lam; YUY = Th/Lam
        Sn = -W*YUY - A*(1-2*e*U)*U - Hc*Ue - d*Pie + 4*A*e*Pi + 2*e*YPiY
        return dict(Y=Y, Phi=Phi, Psi=Psi, u=u, Th=Th, Sq=Sq, Sn=Sn, W=W, l=l, Hc=Hc, g2=g2, logg=logg, DPhi=DPhi)
    def rhs(s, y):
        t = terms(s, y); Y = t['Y']
        dPhi = t['Psi']/Y
        dPsi = -Y**2*t['Phi']*t['Sq']/(2*L*Lam)
        du = t['Th']
        dTh = -Y*t['Sn']/(2*L)
        dIu = Y*t['u']
        dIp = Y*g2*t['Phi']**2
        return np.concatenate([dPhi, dPsi, du, dTh, dIu, dIp])
    def init():
        z = Y0*chi
        Phi = f0(z); Psi = Y0**2*chi*f0p(z)
        u = -Y0*G.Zs/(2*L); Th = u.copy(); Iu = -Y0**2*G.Zs/(4*L); Ip = Y0*g2
        return np.concatenate([Phi, Psi, u, Th, Iu, Ip])
    return rhs, terms, init

def solve(G, Lam, Ys):
    logC = np.log(CFAC) + Lam*np.max(G.Izeta[G.mask])
    rhs, terms, init = make_rhs(G, Lam, logC)
    s_eval = np.log(Ys)
    sol = solve_ivp(rhs, (np.log(Y0), np.log(YEND)), init(), method='DOP853', t_eval=s_eval,
                    rtol=1e-10, atol=1e-13, first_step=1e-3)
    if not sol.success:
        raise RuntimeError(sol.message)
    out = []
    for k, s in enumerate(sol.t):
        t = terms(s, sol.y[:, k]); Y = t['Y']
        t['a'] = -2*t['Psi']/(Y*t['Phi'])            # = p1 = X Qs/L on the stress-free rectangle (p. 149)
        t['ns'] = -2*t['Th']/Y                          # = Ns/L
        with np.errstate(divide='ignore', over='ignore', invalid='ignore'):
            logp2 = 0.5*np.log(Y/(2*Lam)) + np.log(np.abs(t['ns'])) - t['logg'] - np.log(np.abs(t['Phi']))
            p2sq = np.exp(np.minimum(2*logp2, 600.0))
            t['p2'] = np.sign(t['ns'])*np.exp(np.minimum(logp2, 300.0))
            t['v'] = t['a'] + p2sq/t['a']
        out.append(t)
    return out, sol

Ys = np.concatenate([[Y0], np.linspace(0.01, YEND, 410)])
kexit = int(np.argmin(np.abs(Ys - YEXIT))); Ys[kexit] = YEXIT   # Y = 4 exactly (no near-duplicate after log)
G = Grid(N_MAIN)
m = G.mask
print(f"# grid: N={N_MAIN}, mapped Chebyshev on [{G.eta.min():.3f},{G.eta.max():.3f}], min d(eta)={np.min(np.abs(np.diff(G.eta))):.2e}, "
      f"points with |eta-eta0|<5 sigma* : {int(np.sum(np.abs(G.eta-eta0)<5*sigma_star))}, built in {time.time()-T0:.1f}s")
report(G.Izeta_check < 1e-10, 'log_phistar_quadrature_vs_scipy_quad', f"|diff| at eta={G.eta[0]:.3f}: {G.Izeta_check:.1e}")

# ----------------------------------------------------------------------------- Lambda family
errPhi, erru, errns, minSqgap, minPhi, minA, minVexit = {}, {}, {}, {}, {}, {}, {}
results = {}
for Lam in LAMBDAS:
    t1 = time.time()
    out, sol = solve(G, Lam, Ys)
    results[Lam] = out
    eP = max(np.max(np.abs(t['Phi'][m] - f0(t['Y']*G.chi[m]))) for t in out)
    eU = max(np.max(np.abs(t['u'][m] + t['Y']*G.Zs[m]/(2*G.L[m]))) for t in out)
    eN = max(np.max(np.abs(t['ns'][m] - G.Zs[m]/G.L[m])) for t in out)
    gap = min(np.min(t['Sq'][m] - 2.5 - 0.95*Lam*G.L[m]*G.chi[m]) for t in out)
    errPhi[Lam], erru[Lam], errns[Lam], minSqgap[Lam] = eP, eU, eN, gap
    minPhi[Lam] = min(np.min(t['Phi'][m]) for t in out)
    minA[Lam] = min(np.min(t['a'][m]/t['Y']) for t in out)
    minVexit[Lam] = np.min(out[kexit]['v'][m])
    print(f"# Lambda={Lam:.0e}: nfev={sol.nfev} {time.time()-t1:.1f}s  max|Phi-f0(Y chi)|={eP:.3e}  "
          f"max|u+Y Z*/(2L)|={eU:.3e}  max|ns-Z*/L|={eN:.3e}  min(Sq-2.5-.95 Lam L chi)={gap:+.3e}  "
          f"min Phi={minPhi[Lam]:.4f}  min a/Y={minA[Lam]:.3e}  min v(Y=4)-2={minVexit[Lam]-2:+.3e}")

# (B.13) scaling: errors must decrease like 1/Lambda (ratio ~ 0.1 per decade; accept [0.03, 0.3])
for name, err in (('B13_scaling_Phi', errPhi), ('B13_scaling_u', erru), ('B18_scaling_ns', errns)):
    ratios = [err[LAMBDAS[k+1]]/err[LAMBDAS[k]] for k in range(len(LAMBDAS)-1)]
    ok = all(0.03 <= r <= 0.3 for r in ratios[1:])   # the first step (1e3->1e4) is the pre-asymptotic one
    report(ok, name, 'ratios per decade ' + ' '.join(f"{r:.3f}" for r in ratios) +
           f"  (Lambda*err at 1e7 = {LAMBDA_MAIN*err[LAMBDA_MAIN]:.3f})")
report(errPhi[LAMBDA_MAIN] < 1e-4, 'B13_Phi_close_to_f0(Y_chi)_at_Lambda_main', f"{errPhi[LAMBDA_MAIN]:.3e}")
report(erru[LAMBDA_MAIN] < 1e-4, 'B13_u_close_to_-YZ*/(2L)_at_Lambda_main', f"{erru[LAMBDA_MAIN]:.3e}")

# positivity Phi > 0 (B.3 / B.11) and a = p1 > 0 with p1/X >= c1 (B.18)
report(minPhi[LAMBDA_MAIN] > 0.265*0.98, 'B3_Phi_positive_and_ge_c0', f"min Phi={minPhi[LAMBDA_MAIN]:.4f}")
report(minA[LAMBDA_MAIN] > 0, 'B18_p1_over_X_positive', f"min p1/Y={minA[LAMBDA_MAIN]:.3e}")

# (B.17) Sq >= 2.5 + .95 Lambda L chi at Lambda_main; also the first Lambda in the family where it holds
first = next((L_ for L_ in LAMBDAS if minSqgap[L_] >= 0), None)
report(minSqgap[LAMBDA_MAIN] >= 0, 'B17_Sq_ge_2.5+.95LamLchi_at_Lambda_main',
       f"min gap={minSqgap[LAMBDA_MAIN]:+.3e}; holds from Lambda={first}")

# exit inequality (B.19) at Y=4: p1 + p2^2/p1 > 2 + cex, cex = .2, and the two routes
o = results[LAMBDA_MAIN][kexit]
routeA = G.chi[m] > 0.99; routeB = ~routeA
minp1A = np.min(o['a'][m][routeA])
minp2B = np.min((o['p2'][m]**2/o['a'][m])[routeB]) if routeB.any() else np.inf
report(minVexit[LAMBDA_MAIN] > 2.2, 'B19_exit_inequality_v>2.2_at_Y=4', f"min v-2={minVexit[LAMBDA_MAIN]-2:+.3e}")
report(minp1A > 2.3, 'B19_routeA_p1>2.3_where_chi>.99', f"min p1={minp1A:.4f}  (paper: -2zf0'/f0 > 2.36 at z=4chi)")
report(minp2B > 2.3, 'B19_routeB_p2^2/p1>2.3_where_chi<=.99', f"min={minp2B:.3e} on {int(routeB.sum())} grid points")
# the minimal C/max phi* that route B needs at this Lambda (informational)
with np.errstate(divide='ignore'):
    need = np.sqrt(2.3*o['a'][m][routeB]*o['Phi'][m][routeB]**2*np.exp(2*(LAMBDA_MAIN*G.Izeta[m][routeB]-np.max(LAMBDA_MAIN*G.Izeta[m])))
                   / (o['Y']/(2*LAMBDA_MAIN)*o['ns'][m][routeB]**2))
print(f"# route B needs C/max phi* >= {np.max(need):.3e} at Lambda={LAMBDA_MAIN:.0e} (used {CFAC:.0e}); "
      f"with C = max_[-1,1] phi* the exit inequality min v-2 would be {np.min((o['a'][m] + (o['p2'][m]/CFAC)**2/o['a'][m]))-2:+.3f}")
# vanishing-stress identity check (independent of the ODE bookkeeping): p1 = X Qs / L with Qs from (4.10)
# Qs = int_0^Y Y' Phi Sq dY' / (Y^2 Phi); the integral is done by the trapezoid rule on the output Ys
Yv = np.array([t['Y'] for t in results[LAMBDA_MAIN]])
integrand = np.array([t['Y']*t['Phi']*t['Sq'] for t in results[LAMBDA_MAIN]])
cum = np.concatenate([[np.zeros(len(G.eta))], np.cumsum(0.5*(integrand[1:]+integrand[:-1])*np.diff(Yv)[:, None], axis=0)])
PhiArr = np.array([t['Phi'] for t in results[LAMBDA_MAIN]])
p1_from_Qs = cum/(Yv[:, None]*PhiArr)/(LAMBDA_MAIN*G.L)
p1_direct = np.array([t['a'] for t in results[LAMBDA_MAIN]])
sel = Yv >= 0.3
rel = np.max(np.abs(p1_from_Qs[sel][:, m] - p1_direct[sel][:, m])/np.maximum(np.abs(p1_direct[sel][:, m]), 1e-3))
report(rel < 1e-3, 'p1=XQs/L_consistent_with_a=-2D_XlogE', f"max rel diff for Y>=0.3 (trapezoid on {int(sel.sum())} radii) = {rel:.2e}")

# ----------------------------------------------------------------------------- grid convergence
t1 = time.time()
G2 = Grid(N_CONV)
out2, _ = solve(G2, 1e4, Ys)
etest = np.concatenate([np.linspace(-1, 1, 201), eta0 + sigma_star*np.linspace(-6, 6, 121)])
def interp(Gr, vals, e):
    return BarycentricInterpolator(Gr.xi, vals)(Gr.xi_of_eta(e))
dPhi = np.max(np.abs(interp(G, results[1e4][kexit]['Phi'], etest) - interp(G2, out2[kexit]['Phi'], etest)))
du_ = np.max(np.abs(interp(G, results[1e4][kexit]['u'], etest) - interp(G2, out2[kexit]['u'], etest)))
report(dPhi < 1e-7 and du_ < 1e-7, 'grid_convergence_N560_vs_N400_at_Lambda=1e4', f"max|dPhi|={dPhi:.2e} max|du|={du_:.2e} ({time.time()-t1:.1f}s)")

# ----------------------------------------------------------------------------- the curves as a record (matplotlib-free), for the report's own chart engine
try:
    LamF = 1e4; R = results[LamF]
    Yv = np.array([t['Y'] for t in R])
    i0 = int(np.argmin(np.abs(G.eta - 0.0))); ie = int(np.argmin(np.abs(G.eta - eta0)))
    o = results[LAMBDA_MAIN][kexit]
    e = G.eta[m]
    keep = np.arange(0, len(e), max(1, len(e)//280))
    rec = {
        'what': "The curves of fig-axis-profile: the axis IVP (4.13)+(4.7) of Appendix B solved numerically at representative data; a numerical illustration of the writeup's equations, NOT a certified object.",
        'data': {'h': h, 'j0': J0C, 'Pstar': PSTAR, 'delta_star': DELTA_STAR, 'sigma_star': float(sigma_star), 'eta0': float(eta0), 'Lambda_Y_panel': LamF, 'Lambda_exit_panel': LAMBDA_MAIN, 'C': '1e4 * max phi*'},
        'Y': [float(y) for y in Yv],
        'Phi_eta0': [float(t['Phi'][i0]) for t in R], 'f0_eta0': [float(v) for v in f0(Yv*G.chi[i0])],
        'Phi_at_eta_zero_of_Hstar': [float(t['Phi'][ie]) for t in R], 'f0_at_eta_zero_of_Hstar': [float(v) for v in f0(Yv*G.chi[ie])],
        'eta_exit': [float(x) for x in e[keep]], 'p1_exit': [float(x) for x in o['a'][m][keep]], 'chi_exit': [float(x) for x in G.chi[m][keep]], 'exit_line': 2.2,
    }
    with open(os.path.join(os.path.dirname(FIG_PNG), 'axis-profile.json'), 'w') as f:
        json.dump(rec, f, indent=1)
    print("# curves written: axis-profile.json")
except Exception as ex:
    print(f"# curves NOT written: {ex!r}")

# ----------------------------------------------------------------------------- RED CONTROLS
# A numerical check that cannot fail is decoration.  Each red plants a deliberate error
# and the same test must reject it.
REDS = []
def red(name, fired, value=''):
    print(("RED FIRED " if fired else "RED DID NOT FIRE ") + name + (' ' + str(value) if value else ''), flush=True)
    REDS.append(fired)

# (a) the 1/Lambda convergence test must reject a planted 1/Lambda^2 law
errs = [errPhi[L_] for L_ in LAMBDAS]
ratios = [errs[i+1]/errs[i] for i in range(len(errs)-1)]
red("the 1/Lambda scaling test rejects a planted 1/Lambda^2 law",
    not all(abs(rr - 0.01) < 0.003 for rr in ratios), f"observed ratios per decade {['%.3f' % rr for rr in ratios]}")
# (b) the closed-form comparison must reject the wrong Bessel argument
bad = float(np.max(np.abs(np.array([t['Phi'] for t in results[1e4]])[:, m]
                         - f0(np.array([t['Y'] for t in results[1e4]])[:, None]*2*G.chi[m]))))
red("the comparison with f0(2 Y chi) instead of f0(Y chi) is rejected", bad > 1e-3, f"max|dPhi|={bad:.3e}")
# (c) the exit inequality is not trivially true: a line at 12 is violated
red("the exit test is not vacuous: the same comparison rejects a line placed at v > 1e5",
    not (minVexit[LAMBDA_MAIN] > 1e5), f"min v over the grid = {minVexit[LAMBDA_MAIN]:.4g} (the (B.19) line is 2.2)")
# (d) grid convergence is not vacuous: a coarse grid does move the answer
G3 = Grid(80)
out3, _ = solve(G3, 1e4, Ys)
d80 = float(np.max(np.abs(interp(G, results[1e4][kexit]['Phi'], etest) - interp(G3, out3[kexit]['Phi'], etest))))
red("an 80-point grid does move the solution, so the N560-vs-N400 agreement is a convergence claim", d80 > 1e-7, f"max|dPhi| vs N80 = {d80:.2e}")

# ----------------------------------------------------------------------------- figure
try:
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    LamF = 1e4; R = results[LamF]
    Yv = np.array([t['Y'] for t in R])
    fig, ax = plt.subplots(2, 2, figsize=(12, 9))
    etas = [-1.0, -0.5, eta0, 0.0, 0.5, 1.0]
    idx = [int(np.argmin(np.abs(G.eta - e))) for e in etas]
    cols = plt.cm.viridis(np.linspace(0, 0.95, len(etas)))
    for c, i, e in zip(cols, idx, etas):
        lab = f"eta={G.eta[i]:+.3f}" + (" (=eta0)" if abs(e-eta0) < 1e-9 else "")
        ax[0, 0].plot(Yv, [t['Phi'][i] for t in R], color=c, label=lab)
        ax[0, 0].plot(Yv, f0(Yv*G.chi[i]), ':', color=c)
        ax[0, 1].plot(Yv, [t['u'][i] for t in R], color=c, label=lab)
        ax[0, 1].plot(Yv, -Yv*G.Zs[i]/(2*G.L[i]), ':', color=c)
        ax[1, 0].plot(Yv, [t['a'][i] for t in R], color=c, label=lab)
        ax[1, 0].plot(Yv, [t['ns'][i] for t in R], '--', color=c)
    ax[0, 0].set_title(f"Phi(Y,eta) solved (solid) vs f0(Y chi) (dotted), Lambda={LamF:.0e}"); ax[0, 0].set_xlabel('Y = Lambda X'); ax[0, 0].legend(fontsize=7)
    ax[0, 1].set_title("u (solid) vs -Y Z*/(2L) (dotted);  U = U* + u/Lambda"); ax[0, 1].set_xlabel('Y'); ax[0, 1].legend(fontsize=7)
    ax[1, 0].set_title("shear a = p1 = -2 D_X log E (solid), ns = Ns/L = -2 U_X (dashed)"); ax[1, 0].set_xlabel('Y'); ax[1, 0].axhline(2, color='k', lw=.5); ax[1, 0].legend(fontsize=7)
    o = results[LAMBDA_MAIN][kexit]
    e = G.eta[m]
    ax[1, 1].plot(e, o['a'][m], label='p1 at Y=4')
    ax[1, 1].plot(e, np.minimum(o['v'][m], 12), label='v = p1 + p2^2/p1 (clipped at 12)')
    ax[1, 1].plot(e, G.chi[m], label='chi', lw=.8)
    ax[1, 1].axhline(2.2, color='r', lw=.7, ls='--', label='2 + c_ex = 2.2')
    ax[1, 1].set_title(f"exit quantities at Y=4, Lambda={LAMBDA_MAIN:.0e}, C=1e4 max phi*"); ax[1, 1].set_xlabel('eta'); ax[1, 1].legend(fontsize=7, loc='center left')
    ins = ax[1, 1].inset_axes([0.55, 0.42, 0.42, 0.4])
    w = np.abs(e - eta0) < 12*sigma_star
    ins.plot(e[w], o['a'][m][w]); ins.plot(e[w], np.minimum(o['v'][m][w], 12)); ins.plot(e[w], G.chi[m][w], lw=.8); ins.axhline(2.2, color='r', lw=.7, ls='--')
    ins.set_title(f"zoom |eta-eta0|<12 sigma*, sigma*={sigma_star:.4f}", fontsize=7); ins.tick_params(labelsize=6)
    fig.suptitle("Numerical illustration of the axis profile equations (4.13)/(4.7) of the OpenAI Navier-Stokes writeup, App. B -- NOT a certified object", fontsize=10)
    fig.tight_layout()
    os.makedirs(os.path.dirname(FIG_PNG), exist_ok=True)
    fig.savefig(FIG_PNG, dpi=110)
    with open(FIG_TXT, 'w') as f:
        f.write(
            "fig-axis-profile.png -- numerical illustration of the writeup's equations, NOT a certified object.\n"
            "Made by instruments/navierstokes/probes/axis_profile.py (check C14 of the Section 4 / Appendix B memo) for\n"
            "\"Finite time blowup for Navier-Stokes\" (OpenAI, 2026-09-08), Appendix B, pp. 144-150.\n\n"
            "What is plotted: the solution of the axis initial-value problem (4.13) with (4.7), i.e.\n"
            "  -2L(X phi_XX + 2 phi_X)/phi = Sq,  -2L(X U_XX + U_X) = Sn,  Pi_X = E^2/(2X),  E = sqrt(2X) phi/C,\n"
            "integrated from the axis X=0 in the rescaled radius Y = Lambda X with the axis data of Section B.1,\n"
            "phi = phi* Phi, U = U* + u/Lambda.  Top left: Phi against Y for six values of eta (solid) and the\n"
            "closed form f0(Y chi) = sqrt(2/(Y chi)) J_1(sqrt(2 Y chi)) that Proposition B.2 says it approaches as\n"
            "Lambda -> infinity (dotted).  Top right: u and -Y Z*/(2L).  Bottom left: the shear a = p1 = -2 D_X log E\n"
            "(solid) and ns = Ns/L = -2 U_X (dashed); on this stress-free rectangle p1 = a and Pc = vs, Jc = 0.\n"
            "Bottom right: at the exit radius Y = 4 (X0 = 4/Lambda), p1(eta), the exit quantity\n"
            "v = p1 + p2^2/p1 (clipped at 12; it is astronomically large away from eta0 because E is exponentially\n"
            "small there), chi(eta), and the line 2 + c_ex = 2.2 of (B.19); inset: zoom on the sigma*-wide feature at\n"
            "eta0, the zero of H*.\n\n"
            "Data used (the paper fixes no numbers; these are representative and are stated in the script header):\n"
            f"  h = {h}, j0 = {J0C}, P* = {PSTAR}, Pi0(eta) = -3 P*^2 (1+eta^2)^-2, delta* = {DELTA_STAR}, sigma* = {sigma_star:.5f} from (B.2),\n"
            f"  eta0 = {eta0:.6f}, C = 1e4 * max_[-1,1] phi*, Lambda = {LamF:.0e} for the three Y-panels and {LAMBDA_MAIN:.0e} for the exit panel,\n"
            f"  eta grid: {N_MAIN+1} mapped Chebyshev points on [-1.02, 1.02] concentrated at eta0; DOP853 in s = log Y, rtol 1e-10.\n"
            "The paper's P* is astronomically large (P* > e^{Td}) and its C must exceed the supremum of phi* over a complex\n"
            "neighbourhood; the values here are chosen so that the argument's inputs (Z*(eta0) > 0, chi > .99 where |Z*| <= delta*,\n"
            "g = phi*/C <= 1e-4) hold, and nothing about the theorem is decided by this figure.\n"
            "Rerun: python3 instruments/navierstokes/probes/axis_profile.py  (under ten seconds; deterministic; exit 0 iff every check passes).\n")
    print(f"# figure written: {FIG_PNG}")
except Exception as ex:  # the figure is illustration; a plotting failure must be visible but is not a mathematical FAIL
    print(f"# figure NOT written: {ex!r}")

print(f"# total {time.time()-T0:.1f}s; {len(FAILS)} FAIL" + (": " + ", ".join(FAILS) if FAILS else "") + f"; {sum(REDS)}/{len(REDS)} reds fired")
sys.exit(1 if (FAILS or not all(REDS)) else 0)
