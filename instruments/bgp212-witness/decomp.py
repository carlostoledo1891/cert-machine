"""
Reference implementation (exact Fractions) of the decomposition used by the decider.

Datum: K variables, threshold g, mass bound L, caps C(m) (C(0)=0), marginal cutoff tau.
Support S = {x >= 0, sum x < L, sum of coords > g is <= C(#coords > g)}.
F = sum c (L - s)^a m_lam(x)   (real exponents 2*lam), 0 off S.

I = I0 - I1
  I0 = integral of F^2 over the simplex {x>=0, s<L} (Dirichlet)
  I1 = sum_m C(K,m) * integral over {exactly coords 1..m large, U > C(m)} of P^2
J = J0 - J1 + J2 + J3     (q has K-1 coordinates, rho = L - s_q)
  h0 = int_0^rho P dx ; hg = int_0^g P dx ; htheta = int_0^theta P dx
  J0 = int_{q>=0, s_q<=tau} h0^2
  J1 = sum_m C(K-1,m) int_{m-config, U > C(m), s<=tau} h0^2
  J2 = sum_m C(K-1,m) int_{m-config, U < min(C(m), C(m+1)-g), V < L-C(m+1)} (htheta^2 - h0^2),
       theta = C(m+1) - U, eta = L - C(m+1) - V (rho = theta + eta)
  J3 = sum_m C(K-1,m) int_{m-config, C(m+1)-g <= U <= C(m), s < L-g} (hg^2 - h0^2)

Group integrals use Laplace-type transforms in w = 1/p and z = exp(-g p):
  large coord x = g + u, x^e -> psi_e(w) = sum_j C(e,j) g^(e-j) j! w^(j+1)
  small coord x in [0,g], x^e -> phi_e = e! w^(e+1) - z psi_e(w)
  z^k w^r  <->  (t - k g)_+^(r-1)/(r-1)!
"""
from fractions import Fraction
from math import comb, factorial
from core import mults, nmono, mprod, submultisets


# ---------------------------------------------------------------- polynomial data from F
def expand_square(terms):
    """D[gam] = list over e of the coefficient of (L-s)^e m_gam(x) in P^2."""
    by_lam = {}
    for a, lam, c in terms:
        v = by_lam.setdefault(lam, {})
        v[a] = v.get(a, 0) + c
    lams = sorted(by_lam)
    D = {}
    for i, l1 in enumerate(lams):
        for l2 in lams[i:]:
            f = 1 if l1 == l2 else 2
            conv = {}
            for a, c1 in by_lam[l1].items():
                for b, c2 in by_lam[l2].items():
                    conv[a + b] = conv.get(a + b, 0) + c1 * c2
            for gam, N in mprod(l1, l2).items():
                d = D.setdefault(gam, {})
                for e, v in conv.items():
                    d[e] = d.get(e, 0) + f * N * v
    return D


def h_terms(terms):
    """Expand P(q,x) = sum c (rho - x)^a [m_lam(q) + sum_p x^{2p} m_{lam\\p}(q)]
    into a list of (beta, a, b, c) meaning c (rho-x)^a x^b m_beta(q)."""
    out = []
    for a, lam, c in terms:
        out.append((lam, a, 0, c))
        for p in sorted(set(lam)):
            l = list(lam)
            l.remove(p)
            out.append((tuple(l), a, 2 * p, c))
    return out


def h_polys(terms, g):
    """Per beta: H0[n] (poly in rho), Hg[n] (poly in rho), Hth[(i,j)] theta^i eta^j,
    H0th[(i,j)] (h0 written in theta, eta with rho = theta + eta)."""
    H0, Hg, Hth, H0th = {}, {}, {}, {}
    for beta, a, b, c in h_terms(terms):
        # h0: a! b!/(a+b+1)! rho^(a+b+1)
        k0 = Fraction(factorial(a) * factorial(b), factorial(a + b + 1)) * c
        n = a + b + 1
        d = H0.setdefault(beta, {})
        d[n] = d.get(n, 0) + k0
        d = H0th.setdefault(beta, {})
        for i in range(n + 1):
            d[(i, n - i)] = d.get((i, n - i), 0) + k0 * comb(n, i)
        # hg: sum_i C(a,i) rho^(a-i) (-1)^i g^(b+i+1)/(b+i+1)
        d = Hg.setdefault(beta, {})
        for i in range(a + 1):
            v = Fraction(comb(a, i) * (-1) ** i * g ** (b + i + 1)) / (b + i + 1) * c
            d[a - i] = d.get(a - i, 0) + v
        # htheta: sum_i C(a,i) eta^(a-i) i! b!/(i+b+1)! theta^(i+b+1)
        d = Hth.setdefault(beta, {})
        for i in range(a + 1):
            v = Fraction(comb(a, i) * factorial(i) * factorial(b), factorial(i + b + 1)) * c
            key = (i + b + 1, a - i)
            d[key] = d.get(key, 0) + v
    return H0, Hg, Hth, H0th


def square_h(H):
    """sum_{beta,beta'} m_beta m_beta' H_beta H_beta'  ->  dict gam -> poly (dict key->coef)."""
    betas = sorted(H)
    out = {}
    for i, b1 in enumerate(betas):
        for b2 in betas[i:]:
            f = 1 if b1 == b2 else 2
            prod = {}
            for k1, v1 in H[b1].items():
                for k2, v2 in H[b2].items():
                    if isinstance(k1, tuple):
                        k = (k1[0] + k2[0], k1[1] + k2[1])
                    else:
                        k = k1 + k2
                    prod[k] = prod.get(k, 0) + v1 * v2
            for gam, N in mprod(b1, b2).items():
                d = out.setdefault(gam, {})
                for k, v in prod.items():
                    d[k] = d.get(k, 0) + f * N * v
    return out


# ---------------------------------------------------------------- 1-d helpers
def G(a, b, D, R):
    """int_0^D u^a/a! (R-u)^b/b! du  (D <= R)."""
    s = Fraction(0)
    for j in range(b + 1):
        s += Fraction((R - D) ** (b - j), factorial(b - j)) * Fraction(D ** (a + j + 1), factorial(a + j + 1))
    return s


def Omega(e, r, sigma, L, Smax):
    """int_sigma^Smax (L-s)^e (s-sigma)^(r-1)/(r-1)! ds."""
    if Smax <= sigma:
        return Fraction(0)
    return factorial(e) * G(r - 1, e, Smax - sigma, L - sigma)


# ---------------------------------------------------------------- transforms
def psi(e, g):
    p = [Fraction(0)] * (e + 2)
    for j in range(e + 1):
        p[j + 1] = Fraction(comb(e, j) * factorial(j)) * g ** (e - j)
    return p


def pmul(a, b):
    out = [Fraction(0)] * (len(a) + len(b) - 1)
    for i, x in enumerate(a):
        if x:
            for j, y in enumerate(b):
                out[i + j] += x * y
    return out


def large_transform(gam1, m, g):
    A = [Fraction(0)] * (m - len(gam1)) + [Fraction(1)]
    for p in gam1:
        A = pmul(A, psi(2 * p, g))
    return A


def tail(A, d):
    """density sum_r A[r] u^(r-1)/(r-1)!, restricted to u > d, shifted by d."""
    if d == 0:
        return list(A)
    out = [Fraction(0)] * len(A)
    for r in range(1, len(A)):
        if A[r]:
            for j in range(r):
                out[j + 1] += A[r] * Fraction(d ** (r - 1 - j), factorial(r - 1 - j))
    return out


def small_transform(gam2, n, g, kmax):
    """dict k -> list over r."""
    B = {0: [Fraction(1)]}

    def mul(B, F):
        out = {}
        for k1, a in B.items():
            for k2, b in F.items():
                k = k1 + k2
                if k > kmax:
                    continue
                pr = pmul(a, b)
                cur = out.get(k)
                if cur is None:
                    out[k] = pr
                else:
                    if len(cur) < len(pr):
                        cur += [Fraction(0)] * (len(pr) - len(cur))
                    for i, v in enumerate(pr):
                        cur[i] += v
        return out

    for p in gam2:
        e = 2 * p
        f0 = [Fraction(0)] * (e + 2)
        f0[e + 1] = Fraction(factorial(e))
        f1 = [-v for v in psi(e, g)]
        B = mul(B, {0: f0, 1: f1})
    w = [Fraction(0), Fraction(1)]
    for _ in range(n - len(gam2)):
        B = mul(B, {0: w, 1: [Fraction(0), Fraction(-1)]})
    return B


# ---------------------------------------------------------------- pieces
def piece_window(Kv, Z, dat, mrange, windows, Smax):
    """sum_m C(Kv,m) sum_gam sum_splits M M sum_windows sign * int over {m-config, u>d, s<Smax}
    of sum_e Z[gam][e] (L-s)^e m_gam1(x_L) m_gam2(x_S)."""
    g, L = dat['g'], dat['L']
    total = Fraction(0)
    for m in mrange:
        ns = Kv - m
        wins = windows(m)
        if not wins:
            continue
        for gam, zg in Z.items():
            for g1, g2 in submultisets(gam):
                if len(g1) > m or len(g2) > ns:
                    continue
                mult = comb(Kv, m) * nmono(g1, m) * nmono(g2, ns)
                A = large_transform(g1, m, g)
                for sign, d in wins:
                    sig0 = m * g + d
                    if sig0 >= Smax:
                        continue
                    kmax = 0
                    while sig0 + (kmax + 1) * g < Smax:
                        kmax += 1
                    tA = tail(A, d)
                    B = small_transform(g2, ns, g, kmax)
                    acc = Fraction(0)
                    for k, Bk in B.items():
                        sig = sig0 + k * g
                        for r1, a in enumerate(tA):
                            if not a:
                                continue
                            for r2, b in enumerate(Bk):
                                if not b:
                                    continue
                                r = r1 + r2
                                om = sum(zc * Omega(e, r, sig, L, Smax) for e, zc in zg.items())
                                acc += a * b * om
                    total += sign * mult * acc
    return total


def piece_rect(Kv, Pi, dat, mrange):
    """J2: sum_m C(Kv,m) sum splits M M int_{u in [0,umax)} int_{V < L-C(m+1)} Pi_gam(theta,eta) ..."""
    g, L, C = dat['g'], dat['L'], dat['C']
    total = Fraction(0)
    for m in mrange:
        ns = Kv - m
        Cm1 = C(m + 1)
        if m == 0:
            umax = None
        else:
            umax = min(C(m), Cm1 - g) - m * g
            if umax <= 0:
                continue
        Theta0 = Cm1 - m * g
        etas = []
        k = 0
        while L - Cm1 - k * g > 0:
            etas.append(L - Cm1 - k * g)
            k += 1
        if not etas:
            continue
        kmax = len(etas) - 1
        for gam, P in Pi.items():
            deg = max(i + j for (i, j) in P) if P else 0
            for g1, g2 in submultisets(gam):
                if len(g1) > m or len(g2) > ns:
                    continue
                mult = comb(Kv, m) * nmono(g1, m) * nmono(g2, ns)
                if m == 0:
                    Aint = [Theta0 ** i for i in range(deg + 1)]
                else:
                    A = large_transform(g1, m, g)
                    Aint = []
                    for i in range(deg + 1):
                        s = Fraction(0)
                        for r1, a in enumerate(A):
                            if a:
                                s += a * factorial(i) * G(r1 - 1, i, umax, Theta0)
                        Aint.append(s)
                B = small_transform(g2, ns, g, kmax)
                Bint = []
                for j in range(deg + 1):
                    s = Fraction(0)
                    for k, Bk in B.items():
                        em = etas[k]
                        for r2, b in enumerate(Bk):
                            if b:
                                s += b * Fraction(factorial(j) * em ** (j + r2), factorial(j + r2))
                    Bint.append(s)
                acc = Fraction(0)
                for (i, j), v in P.items():
                    acc += v * Aint[i] * Bint[j]
                total += mult * acc
    return total


def I0_value(Kv, D, dat):
    L = dat['L']
    tot = Fraction(0)
    for gam, zg in D.items():
        if len(gam) > Kv:
            continue
        pf = 1
        for p in gam:
            pf *= factorial(2 * p)
        deg = 2 * sum(gam)
        for e, v in zg.items():
            N = Kv + e + deg
            tot += v * nmono(gam, Kv) * pf * factorial(e) * Fraction(L ** N, factorial(N))
    return tot


def J0_value(Kq, Z0, dat):
    L, tau = dat['L'], dat['tau']
    tot = Fraction(0)
    for gam, zg in Z0.items():
        if len(gam) > Kq:
            continue
        pf = 1
        for p in gam:
            pf *= factorial(2 * p)
        N = Kq - 1 + 2 * sum(gam)
        for n, v in zg.items():
            tot += v * nmono(gam, Kq) * pf * factorial(n) * G(N, n, tau, L)
    return tot


def compute_IJ(terms, dat, verbose=False):
    K, g, L, C, tau = dat['K'], dat['g'], dat['L'], dat['C'], dat['tau']
    assert tau >= L - g and tau < L
    D = expand_square(terms)
    I0 = I0_value(K, D, dat)
    I1 = piece_window(K, D, dat, range(1, K + 1),
                      lambda m: [(1, max(C(m) - m * g, 0))], L)
    H0, Hg, Hth, H0th = h_polys(terms, g)
    Z0 = square_h(H0)
    Zg = square_h(Hg)
    Zd = {}
    for gam in set(Z0) | set(Zg):
        d = {}
        for n, v in Zg.get(gam, {}).items():
            d[n] = d.get(n, 0) + v
        for n, v in Z0.get(gam, {}).items():
            d[n] = d.get(n, 0) - v
        Zd[gam] = d
    Pth = square_h(Hth)
    P0th = square_h(H0th)
    Pi = {}
    for gam in set(Pth) | set(P0th):
        d = {}
        for k, v in Pth.get(gam, {}).items():
            d[k] = d.get(k, 0) + v
        for k, v in P0th.get(gam, {}).items():
            d[k] = d.get(k, 0) - v
        Pi[gam] = d
    Kq = K - 1
    J0 = J0_value(Kq, Z0, dat)
    J1 = piece_window(Kq, Z0, dat, range(1, Kq + 1),
                      lambda m: [(1, max(C(m) - m * g, 0))], tau)

    def w3(m):
        lo = max(Fraction(0), C(m + 1) - g - m * g)
        hi = C(m) - m * g
        if hi <= lo:
            return []
        return [(1, lo), (-1, hi)]

    J3 = piece_window(Kq, Zd, dat, range(1, Kq + 1), w3, L - g)
    J2 = piece_rect(Kq, Pi, dat, range(0, Kq + 1))
    I = I0 - I1
    J = J0 - J1 + J2 + J3
    parts = dict(I0=I0, I1=I1, J0=J0, J1=J1, J2=J2, J3=J3)
    return I, J, parts
