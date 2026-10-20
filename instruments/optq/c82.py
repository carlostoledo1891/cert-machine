#!/usr/bin/env python3
"""instruments/optq/c82.py — a C_82 construction (Doche's limit-point bound for the essential minimum of the
Zhang–Zagier height) decided in the Python standard library. No code is shared with the claimants' checkers (kept as
text, never run) or with the JavaScript decider (tools/replay-c82.js); the arithmetic differs on purpose: there,
every operation is rounded outward; here, the transcendental parts are computed in plain IEEE doubles and every
result carries an A PRIORI rounding-error bound from the standard model fl(a op b) = (a op b)(1 + d), |d| <= u = 2^-53
(+, -, *, /, sqrt correctly rounded, as IEEE 754 requires; no underflow or overflow occurs at the magnitudes used, and
the code checks the ranges it relies on). sin, cos and log are this file's own, with their errors bounded.

A construction: denominator factors R_j (integer, leading coefficient ±1) with multiplicities m_j > 0, numerator
factors S_i (integer) with rational exponents q_i >= 0. With T(z) = z(1 - z), D = Σ m_j deg R_j:
    B = ( log M(Q∘T) + ∫_0^1 max(0, Σ q_i log|S_i∘T(e^{2πit})| - Σ m_j log|R_j∘T(e^{2πit})|) dt ) / D.
DECIDED here:
  Y1  the factors read exactly (integers; q a rational >= 0, written n/d, an integer, or a terminating decimal)   exact
  Y2  Σ q_i deg S_i < D                                                                                          exact
  Y3  gcd(S_i, R_j) = 1 for q_i > 0: Euclid modulo primes not dividing the leading coefficients (Gauss's lemma)  exact
  Y4  the roots of each R∘T, S∘T: Durand–Kerner on the factor in complex doubles, mapped through z^2 - z + rho = 0,
      Newton steps in integer fixed point at 2^-200, then the COLUMN Gershgorin theorem on the Weierstrass matrix
      diag(z) - W 1^T (characteristic polynomial P∘T / lc): the disks D(z_j, Σ_i |W_i|), the W_i exact, pairwise
      disjoint, so each holds one root                                                                           exact
  Y5  log M(Q∘T) = Σ m_j Σ log max(1, |r|)                                                                       bound
  Y6  the integral on [0, 1/2], doubled (real coefficients), on dyadic panels: zeroth order from |u(t) - u(t_c)|
      <= πw; second order from g'' = 4π² Σ w_k Re(u r/(u - r)^2); the per-panel bounds in panel()                bound
  Y7  B against the printed bound: CERTIFIED below, REFUTED at or above (the certificate's B, not the row's number),
      REFUSED if the enclosure straddles it
The step from B to C_82 <= B (Doche's theorem; the claimant's README proves it directly) is read, not re-derived.

usage: python3 -I instruments/optq/c82.py construction.json BOUND [--tau 2e-8] [--json out.json]
MIT"""
import cmath
import json
import math
import sys
import time
from fractions import Fraction as Fr

U = 2.0 ** -53                                   # unit roundoff of IEEE double, round to nearest
TRACE = int(__import__('os').environ.get('C82_TRACE', '0'))
DEBUG = __import__('os').environ.get('C82_PANEL', '')


class Refused(Exception):
    pass


# ------------------------------------------------------------------------------------------------------------------
# exact reading
# ------------------------------------------------------------------------------------------------------------------
def exact_int(v, what):
    if isinstance(v, bool) or not (isinstance(v, int) or (isinstance(v, str) and v.lstrip('-').isdigit())):
        raise Refused('%s is not an exact integer: %r' % (what, v))
    return int(v)


def exact_q(v, what):
    if isinstance(v, bool) or isinstance(v, float):
        raise Refused('%s is not written exactly: %r' % (what, v))
    s = str(v)
    try:
        if '/' in s:
            a, b = s.split('/')
            if not (a.isdigit() and b.isdigit()):
                raise ValueError
            q = Fr(int(a), int(b))
        elif '.' in s:
            a, b = s.split('.')
            if not (a.isdigit() and b.isdigit()):
                raise ValueError
            q = Fr(int(a + b), 10 ** len(b))
        else:
            if not s.isdigit():
                raise ValueError
            q = Fr(int(s))
    except (ValueError, ZeroDivisionError):
        raise Refused('%s is not a rational >= 0: %r' % (what, v))
    return q


def poly(coeffs, what):                         # highest degree first in the file; lowest first here
    if not isinstance(coeffs, list) or not coeffs:
        raise Refused(what + ' has no coefficients')
    p = [exact_int(c, what + ' coefficient') for c in coeffs][::-1]
    while len(p) > 1 and p[-1] == 0:
        p.pop()
    if p == [0]:
        raise Refused(what + ' is the zero polynomial')
    return p


def compose_T(p):                               # p(z - z^2), lowest first
    out = [0]
    for c in reversed(p):
        nxt = [0] * (len(out) + 2)
        for i, a in enumerate(out):
            if a:
                nxt[i + 1] += a
                nxt[i + 2] -= a
        nxt[0] += c
        out = nxt
    while len(out) > 1 and out[-1] == 0:
        out.pop()
    return out


# ------------------------------------------------------------------------------------------------------------------
# Y3 — Euclid modulo p
# ------------------------------------------------------------------------------------------------------------------
PRIMES = [2147483647, 2147483629, 2147483587, 2147483579, 2147483563, 2147483549, 2147483543, 2147483497]


def gcd_degree_mod(a, b, p):
    A = [x % p for x in a]
    B = [x % p for x in b]
    for X in (A, B):
        while len(X) > 1 and X[-1] == 0:
            X.pop()
    while not (len(B) == 1 and B[0] == 0):
        inv = pow(B[-1], p - 2, p)
        while len(A) >= len(B) and not (len(A) == 1 and A[0] == 0):
            c = A[-1] * inv % p
            s = len(A) - len(B)
            for i, y in enumerate(B):
                A[s + i] = (A[s + i] - c * y) % p
            A.pop()
            if not A:
                A = [0]
            while len(A) > 1 and A[-1] == 0:
                A.pop()
        A, B = B, A
    return len(A) - 1


def coprime(s, r):
    for p in PRIMES:
        if s[-1] % p and r[-1] % p and gcd_degree_mod(s, r, p) == 0:
            return p
    return 0


# ------------------------------------------------------------------------------------------------------------------
# Y4 — roots
# ------------------------------------------------------------------------------------------------------------------
def durand_kerner(p):
    n = len(p) - 1
    lc = complex(p[-1])
    a = [complex(c) / lc for c in p]
    z = [(0.4 + 0.9j) ** k * 1.1 for k in range(n)]
    for _ in range(3000):
        moved = 0.0
        for i in range(n):
            x = z[i]
            v = 0j
            for c in reversed(a):
                v = v * x + c
            d = 1 + 0j
            for j in range(n):
                if j != i:
                    d *= x - z[j]
            if d == 0:
                d = 1e-300
            w = v / d
            z[i] = x - w
            moved = max(moved, abs(w))
        if moved < 1e-15:
            break
    return z


KF = 200
ONE = 1 << KF


def fix(x):
    return int(round(x * 2.0 ** 60)) << (KF - 60)


def newton_fix(c, zr, zi, steps=8):
    """Newton on c (lowest first) at the integer fixed point zr + i zi (scale 2^KF)"""
    n = len(c) - 1
    for _ in range(steps):
        pr, pi = c[n] << KF, 0
        dr, di = 0, 0
        for k in range(n - 1, -1, -1):
            dr, di = ((dr * zr - di * zi) >> KF) + pr, ((dr * zi + di * zr) >> KF) + pi
            pr, pi = ((pr * zr - pi * zi) >> KF) + (c[k] << KF), (pr * zi + pi * zr) >> KF
        q = dr * dr + di * di
        if q == 0:
            break
        sr, si = ((pr * dr + pi * di) << KF) // q, ((pi * dr - pr * di) << KF) // q
        zr, zi = zr - sr, zi - si
        if abs(sr) + abs(si) < (1 << (KF - 150)):
            break
    return zr, zi


def isqrt_up(x):
    r = math.isqrt(x)
    return r if r * r == x else r + 1


def certify_roots(c, base, what):
    n = len(c) - 1
    if n < 1:
        return []
    lc = c[-1]
    approx = []
    for rho in durand_kerner(base):
        s = cmath.sqrt(1 - 4 * rho)
        approx += [(1 + s) / 2, (1 - s) / 2]
    if len(approx) != n:
        raise Refused(what + ': the composed degree is not twice the factor\'s')
    Z = [newton_fix(c, fix(z.real), fix(z.imag)) for z in approx]
    # exact W_j = p(z_j) / (lc Π_{i≠j} (z_j - z_i)); with z = Z / 2^KF: p(z) 2^{KF n} and Π 2^{KF (n-1)}
    absW = []                                    # each an upper bound of |W_j| as (numerator int, shift): |W| <= num / 2^shift
    for j in range(n):
        zr, zi = Z[j]
        pr, pi = c[n], 0
        for k in range(n - 1, -1, -1):
            pr, pi = pr * zr - pi * zi + (c[k] << (KF * (n - k))), pr * zi + pi * zr
        qr, qi = 1, 0
        for i in range(n):
            if i != j:
                er, ei = zr - Z[i][0], zi - Z[i][1]
                qr, qi = qr * er - qi * ei, qr * ei + qi * er
        q2 = qr * qr + qi * qi
        if q2 == 0:
            raise Refused(what + ': two approximations coincide')
        # |W|^2 = (pr^2 + pi^2) / (lc^2 q2 2^{2KF}); bound |W| <= isqrt_up(ceil(|W|^2 2^{2S})) / 2^S at S = 400 bits
        S = 400
        num = (pr * pr + pi * pi) << (2 * S)
        den = lc * lc * q2 << (2 * KF)
        absW.append(isqrt_up(-(-num // den)))
    total = sum(absW)                             # Σ |W_i| <= total / 2^400; the column Gershgorin radius bound
    rad = Fr(total, 1 << 400)
    disks = []
    for j in range(n):
        cr, ci = Fr(Z[j][0], ONE), Fr(Z[j][1], ONE)
        disks.append((cr, ci))
    # pairwise disjoint: |z_j - z_i|^2 > (2 rad)^2, exactly
    for j in range(n):
        for i in range(j + 1, n):
            dr, di = disks[j][0] - disks[i][0], disks[j][1] - disks[i][1]
            if not dr * dr + di * di > 4 * rad * rad:
                raise Refused(what + ': two root disks are not disjoint (a repeated root, or approximations not separated)')
    out = []
    for cr, ci in disks:
        x, y = float(cr), float(ci)               # nearest doubles; their error is bounded exactly below
        e = abs(Fr(x) - cr) + abs(Fr(y) - ci) + rad
        out.append((x, y, float(e) * (1 + 4 * U) + 1e-300))
    return out


# ------------------------------------------------------------------------------------------------------------------
# sound transcendental pieces: π and ln 2 as exact rational brackets, sin/cos/log in doubles with error bounds
# ------------------------------------------------------------------------------------------------------------------
def atan_inv(k, bits):
    """arctan(1/k) in fixed point at 2^-bits, with the absolute error in units of 2^-bits"""
    one = 1 << bits
    term = one // k
    s, n, sign, err = 0, 1, 1, 1
    k2 = k * k
    while term:
        s += sign * (term // n)
        err += 2
        term //= k2
        n += 2
        sign = -sign
    return s, err + 1


def pi_bracket():
    b = 256
    a5, e5 = atan_inv(5, b)
    a239, e239 = atan_inv(239, b)
    v = 16 * a5 - 4 * a239
    e = 16 * e5 + 4 * e239
    return Fr(v - e, 1 << b), Fr(v + e, 1 << b)


def ln2_bracket():
    """ln 2 = 2 atanh(1/3) = 2 Σ 1/((2k+1) 3^(2k+1)); the tail after K terms is below the next term / (1 - 1/9)"""
    s = Fr(0)
    for k in range(60):
        s += Fr(1, (2 * k + 1) * 3 ** (2 * k + 1))
    tail = Fr(1, (2 * 60 + 1) * 3 ** (2 * 60 + 1)) * Fr(9, 8)
    return 2 * s, 2 * (s + tail)


PI_LO, PI_HI = pi_bracket()
LN2_LO, LN2_HI = ln2_bracket()
PI_F = float(PI_HI)                                            # a double within 2^-52 of π
PI_ERR = float(max(abs(Fr(PI_F) - PI_LO), abs(Fr(PI_F) - PI_HI))) * 1.01
LN2_F = float(LN2_HI)
LN2_ERR = float(max(abs(Fr(LN2_F) - LN2_LO), abs(Fr(LN2_F) - LN2_HI))) * 1.01


def sincos_2pi(t):
    """(cos 2πt, sin 2πt) for a dyadic t in [0, 1/2], as doubles with an absolute error bound: the angle x = 2πt reduced
    to |r| <= π/4 by a quadrant, the Taylor series in exact rationals at 2^-120 truncated with its remainder"""
    T = Fr(t)
    xl, xh = 2 * PI_LO * T, 2 * PI_HI * T
    x = (xl + xh) / 2
    ex = (xh - xl) / 2                          # |2πt - x| <= ex
    q = int(round(float(x) / (math.pi / 2)))
    r = x - q * (PI_LO + PI_HI) / 4            # π/2 taken as the midpoint of its bracket
    er = ex + abs(q) * (PI_HI - PI_LO) / 4
    bits = 120
    R = int(r * (1 << bits))
    er += Fr(1, 1 << bits)

    def series(start):
        one = 1 << bits
        term = one if start == 0 else R
        s, k, err = term, start, 1
        while abs(term) > 1:
            term = -(term * R >> bits) * R >> bits
            term //= (k + 1) * (k + 2)
            k += 2
            s += term
            err += 6
        return Fr(s, one), Fr(err + 2, one)    # |series - truncation| below err units, the tail below one unit

    c, ec = series(0)
    s, es = series(1)
    # cos and sin are 1-Lipschitz: the error in r moves each by at most er
    ec += er
    es += er
    cq = [(c, s), (-s, c), (-c, -s), (s, -c)][q % 4]
    cx, sx = cq
    fx, fy = float(cx), float(sx)
    eu = float(abs(Fr(fx) - cx) + abs(Fr(fy) - sx) + ec + es) * 1.01   # |u(t) - (fx, fy)| <= eu
    return fx, fy, eu


def ln_bound(x):
    """(value, error): |ln x - value| <= error, for a positive normal double x"""
    m, e = math.frexp(x)                         # x = m 2^e exactly, m in [0.5, 1)
    if m < 0.7071067811865476:
        m *= 2.0
        e -= 1
    v = (m - 1.0) / (m + 1.0)                    # |v| <= 0.1716
    v2 = v * v
    s = 0.0
    for k in range(12, -1, -1):
        s = s * v2 + 1.0 / (2 * k + 1)
    lm = 2.0 * v * s
    # truncation after v^25: 2|v|^27 / (27 (1 - v^2)) < 3e-22; rounding: v carries 3u relative, the Horner sum about
    # 30u relative on a value of size <= 1.04, so |lm - ln m| <= 40u |lm| + 4e-22
    err_m = 40 * U * abs(lm) + 4e-22
    val = lm + e * LN2_F
    err = err_m + abs(e) * LN2_ERR + U * (abs(val) + abs(e) * LN2_F) * 2
    return val, err


def log1p_up(x):
    """an upper bound of log(1 + x), x >= 0"""
    v, e = ln_bound((1.0 + x) * (1 + 2 * U))
    return v + e


# ------------------------------------------------------------------------------------------------------------------
# the decision
# ------------------------------------------------------------------------------------------------------------------
def decide(cons, bound, tau_rel=2e-8):
    t0 = time.time()
    res = {'bound': bound, 'checks': {}}
    try:
        if not isinstance(cons, dict) or not isinstance(cons.get('denominator'), list) or not isinstance(cons.get('numerator'), list) or not cons['denominator']:
            raise Refused('not a construction: denominator and numerator lists are needed')
        den = []
        for j, r in enumerate(cons['denominator']):
            what = 'denominator %s' % r.get('name', j)
            p = poly(r.get('coeffs'), what)
            if len(p) < 2:
                raise Refused(what + ' is constant')
            if abs(p[-1]) != 1:
                raise Refused(what + ' is not monic up to sign')
            m = exact_int(r.get('multiplicity'), what + ' multiplicity')
            if m <= 0:
                raise Refused(what + ' multiplicity is not positive')
            den.append((r.get('name', 'R%d' % j), p, m))
        num = []
        for i, s in enumerate(cons['numerator']):
            what = 'numerator %s' % s.get('name', i)
            p = poly(s.get('coeffs'), what)
            q = exact_q(s.get('q_rational'), what + ' exponent')
            if q > 0:
                num.append((s.get('name', 'S%d' % i), p, q))
        res['checks']['Y1'] = {'ok': True, 'denominators': len(den), 'numeratorsActive': len(num)}
        D = sum(m * (len(p) - 1) for _, p, m in den)
        degA = sum((q * (len(p) - 1) for _, p, q in num), Fr(0))
        if not degA < D:
            raise Refused('deg A = %s is not below deg Q = %d' % (degA, D))
        res['checks']['Y2'] = {'ok': True, 'degQ': str(D), 'degA': str(degA)}
        used = set()
        for ns, sp, _ in num:
            for rn, rp, _ in den:
                pr = coprime(sp, rp)
                if not pr:
                    raise Refused('gcd(%s, %s) is not shown to be 1 modulo any of %d primes' % (ns, rn, len(PRIMES)))
                used.add(pr)
        res['checks']['Y3'] = {'ok': True, 'pairs': len(num) * len(den), 'primesUsed': len(used)}
        roots = []                                # (x, y, err, factor)
        factors = []                              # (weight as Fraction (signed), log|lc| (value, err), degree)
        for side, lst in (('den', den), ('num', num)):
            for name, p, wq in lst:
                c = compose_T(p)
                disks = certify_roots(c, p, name)
                fi = len(factors)
                w = Fr(-wq) if side == 'den' else wq
                lcv = ln_bound(float(abs(c[-1]))) if abs(c[-1]) != 1 else (0.0, 0.0)
                if abs(c[-1]) >= 2 ** 53:
                    raise Refused('a leading coefficient beyond 2^53')
                factors.append((w, lcv, len(c) - 1, side))
                roots += [(x, y, e, fi) for x, y, e in disks]
        res['checks']['Y4'] = {'ok': True, 'roots': len(roots), 'maxError': max(r[2] for r in roots)}
        # Y5: Σ m Σ log max(1, |r|), |r| within [h(1 - 2u) - e, h(1 + 2u) + e], h = hypot computed as sqrt(x^2 + y^2)
        lmv, lme = 0.0, 0.0
        terms = []
        for x, y, e, fi in roots:
            w, _, _, side = factors[fi]
            if side != 'den':
                continue
            h = math.sqrt(x * x + y * y)
            hl, hh = h * (1 - 3.5 * U) - e, h * (1 + 3.5 * U) + e
            if hh <= 1:
                continue
            vh, eh = ln_bound(hh)
            vl, el = (0.0, 0.0) if hl <= 1 else ln_bound(hl)
            mid = (vh + vl) / 2
            terms.append((-w, mid, (vh - vl) / 2 + max(eh, el)))
        lm = sum(float(m) * v for m, v, _ in terms)
        lm_err = sum(float(m) * (er + U * abs(v)) for m, v, er in terms) * (1 + 1e-12) + 2 * len(terms) * U * sum(float(m) * abs(v) for m, v, _ in terms)
        res['checks']['Y5'] = {'ok': True, 'logM': [lm - lm_err, lm + lm_err]}
        # Y6
        N = len(roots)
        RX = [r[0] for r in roots]
        RY = [r[1] for r in roots]
        RE = [r[2] for r in roots]
        RF = [r[3] for r in roots]
        RH = [(math.sqrt(r[0] * r[0] + r[1] * r[1]) * (1 + 3.5 * U) + r[2]) * (1 + U) for r in roots]
        NF = len(factors)
        WF = [float(f[0]) for f in factors]                   # |float(w) - w| <= u |w|
        WA = [abs(x) * (1 + U) for x in WF]
        LC = [f[1] for f in factors]
        NDEG = [f[2] for f in factors]
        two_pi = 2 * PI_F
        two_pi_err = 2 * PI_ERR + 2 * U * two_pi
        tol = tau_rel * D

        def panel(tl, w):
            tc = tl + w / 2
            ux, uy, eu = sincos_2pi(tc)
            pw = PI_F * w * (1 + 2 * U) + PI_ERR * w
            # per factor: the product of the distances at (ux, uy) to the disk centres, with frexp renormalisation
            pm = [1.0] * NF
            pe = [0] * NF
            eps_c = [0.0] * NF                    # Σ relative errors at the centre
            eps_p = [0.0] * NF                    # Σ relative errors over the panel (for the upper end)
            eps_pl = [0.0] * NF                   # Σ ε/(1-ε) over the panel (for the lower end); inf if a distance may vanish
            eps_cl = [0.0] * NF
            gp = 0.0
            gp_abs = 0.0
            gp_err = 0.0
            Msum = 0.0
            taylor = True
            frexp = math.frexp
            for k in range(N):
                dx = ux - RX[k]
                dy = uy - RY[k]
                s = dx * dx + dy * dy
                d = math.sqrt(s)
                f = RF[k]
                m, e = frexp(pm[f] * d)
                pm[f] = m
                pe[f] += e
                Dk = RE[k] + eu
                ec = 3.2 * U + Dk / d             # |true distance at t_c - d| <= ec d
                ep = ec + pw / d                  # over the panel
                # log(1 + x) <= x, tight for small x; for a root close to the point, log(1 + x) itself, bounded above
                eps_c[f] += ec if ec < 0.25 else log1p_up(ec)
                eps_p[f] += ep if ep < 0.25 else log1p_up(ep)
                if ec < 0.5:
                    eps_cl[f] += ec / (1 - ec)
                else:
                    eps_cl[f] = math.inf
                if ep < 0.5:
                    eps_pl[f] += ep / (1 - ep)
                else:
                    eps_pl[f] = math.inf
                if not taylor:
                    continue
                if ep >= 0.5:
                    taylor = False
                    continue
                tau = (ux * dy - uy * dx) / s     # Re(i u / (u - r)) at the double points
                wk = WF[f]
                gp += wk * tau
                gp_abs += abs(wk * tau)
                # |tau_true - tau| <= 9.7u/d (rounding) + (eu d + (1 + eu) Dk) / ((d - Dk) d) (the points' errors)
                dl = d * (1 - 6 * U) - Dk * (1 + 4 * U)
                gp_err += WA[f] * (9.7 * U / d + (eu * d + (1 + eu) * Dk) * (1 + 8 * U) / (dl * d * (1 - 4 * U)))
                pl = d * (1 - 6 * U) - (Dk + pw) * (1 + 4 * U)
                Msum += WA[f] * RH[k] / (pl * pl)
            # the factors' logs: log Π d = log(pm 2^pe); the product's roundings contribute <= 1.01 deg u relative.
            # L_true in [L - Lerr - Σ ε/(1-ε), L + Lerr + Σ ε] (log(1 + x) <= x, log(1 - x) >= -x/(1-x)); then w L, with
            # |float(w) - w| <= u|w| and the product's rounding: 2.01 u |w L| per end; the sum's: 2 NF u Σ|terms|
            gl = gh = gup = 0.0
            sab = sabp = 0.0
            for f in range(NF):
                v, ev = ln_bound(pm[f])
                L = v + pe[f] * LN2_F + LC[f][0]
                Lerr = ev + abs(pe[f]) * LN2_ERR + 2 * U * (abs(v) + abs(pe[f]) * LN2_F + abs(LC[f][0])) + (NDEG[f] + 2) * U * 1.01 + LC[f][1]
                up_c = L + Lerr + eps_c[f] * (1 + 1e-9)
                lo_c = L - Lerr - eps_cl[f] * (1 + 1e-9)
                up_p = L + Lerr + eps_p[f] * (1 + 1e-9)
                lo_p = L - Lerr - eps_pl[f] * (1 + 1e-9)
                wf = WF[f]                        # (not w: w is the panel's width)
                a_, b_, pmax = (lo_c, up_c, up_p) if wf > 0 else (up_c, lo_c, lo_p)
                x = wf * a_
                y = wf * b_
                z = wf * pmax
                gl += x - 2.01 * U * abs(x)
                gh += y + 2.01 * U * abs(y)
                gup += z + 2.01 * U * abs(z)
                sab += abs(x) + abs(y)
                sabp += abs(z)
                if DEBUG:
                    print('f', f, 'w', wf, 'L', L, 'Lerr', Lerr, 'eps_c', eps_c[f], 'eps_cl', eps_cl[f], 'eps_p', eps_p[f], 'eps_pl', eps_pl[f], 'z', z, file=sys.stderr)
            gl -= 2 * NF * U * sab
            gh += 2 * NF * U * sab
            gup += 2 * NF * U * sabp
            if math.isnan(gup) or gup == math.inf:
                hi = math.inf
            else:
                hi = 0.0 if gup <= 0 else w * gup * (1 + 2 * U)
            lo = 0.0
            if taylor and hi > 0 and math.isfinite(gl) and math.isfinite(gh):
                gpv = two_pi * gp
                gpe = two_pi * (gp_err + 2 * N * U * gp_abs) * (1 + 1e-9) + two_pi_err * gp_abs + 2 * U * abs(gpv)
                L = abs(gpv) + gpe
                M = 4 * (PI_F + PI_ERR) ** 2 * Msum * (1 + (N + 20) * U)
                h = w / 2
                quad = M * h * h / 2 * (1 + 4 * U)
                Lh = L * h * (1 + 2 * U)
                Lg = (gl - Lh - quad) - 4 * U * (abs(gl) + Lh + quad)
                Ug = (gh + Lh + quad) + 4 * U * (abs(gh) + Lh + quad)
                rem = M * w * w * w / 24 * (1 + 6 * U)
                if Ug <= 0:
                    hi = 0.0
                elif Lg > 0:
                    hi = min(hi, (w * gh + rem) * (1 + 4 * U))
                    lo = max(0.0, (w * gl - rem) - 4 * U * (abs(w * gl) + rem))
                else:
                    hi = min(hi, (w * max(0.0, gh) + L * w * w / 4 + rem) * (1 + 6 * U))
            return lo, hi

        if DEBUG:
            tl_, w_ = map(float, DEBUG.split(','))
            print('panel', panel(tl_, w_), file=sys.stderr)
            raise SystemExit(0)
        n0 = 1 << 10
        stack = [(i * (0.5 / n0), 0.5 / n0) for i in range(n0 - 1, -1, -1)]
        los, his = [], []
        evaluated = 0
        wmin = 2.0 ** -44
        narrowest = 0.5
        while stack:
            tl, w = stack.pop()
            lo, hi = panel(tl, w)
            evaluated += 1
            if TRACE and evaluated % TRACE == 0:
                print('trace', evaluated, len(his), tl, w, lo, hi, file=sys.stderr)
            if not (hi - lo <= tol * w):
                if w > wmin:
                    stack.append((tl + w / 2, w / 2))
                    stack.append((tl, w / 2))
                    continue
                if hi == math.inf:
                    raise Refused('a panel of width 2^-44 near t = %r is not bounded (a denominator root on the circle?)' % tl)
            los.append(lo)
            his.append(hi)
            narrowest = min(narrowest, w)
        ilo = math.fsum(los) * (1 - 2 * U)        # fsum is the correctly rounded sum of the doubles given
        ihi = math.fsum(his) * (1 + 2 * U)
        res['checks']['Y6'] = {'ok': True, 'integralHalf': [ilo, ihi], 'panels': len(his), 'evaluated': evaluated, 'narrowest': narrowest, 'tauRel': tau_rel}
        bdlo = ((lm - lm_err) + 2 * ilo) * (1 - 2 * U)
        bdhi = ((lm + lm_err) + 2 * ihi) * (1 + 2 * U)
        if D >= 2 ** 53:
            raise Refused('deg Q beyond 2^53')
        blo, bhi = bdlo / D * (1 - 2 * U), bdhi / D * (1 + 2 * U)
        res['B'] = [blo, bhi]
        bar = Fr(bound)                           # the printed decimal, exactly
        if Fr(bhi) < bar:
            res['verdict'], res['why'] = 'CERTIFIED', 'B < ' + bound
        elif Fr(blo) >= bar:
            res['verdict'], res['why'] = 'REFUTED', 'the certificate\'s B is at least ' + bound
        else:
            res['verdict'], res['why'] = 'REFUSED', 'the enclosure of B straddles ' + bound
    except Refused as e:
        res['verdict'], res['why'] = 'REFUSED', str(e)
    res['seconds'] = round(time.time() - t0, 2)
    return res


def main(argv):
    if len(argv) < 3:
        sys.exit(__doc__)
    cons = json.load(open(argv[1]))
    tau = float(argv[argv.index('--tau') + 1]) if '--tau' in argv else 2e-8
    r = decide(cons, argv[2], tau)
    s = json.dumps(r, indent=1)
    if '--json' in argv:
        open(argv[argv.index('--json') + 1], 'w').write(s + '\n')
    print(s)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
