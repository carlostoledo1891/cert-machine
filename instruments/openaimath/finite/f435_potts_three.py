"""F-435 — "The exact reconstruction threshold for the three-state symmetric channel" (openai/math family 229).

THE CLAIM (build/main.tex abstract; sections/01-introduction.tex:44-52, Theorem thm:threshold): for the symmetric
three-state channel on every regular b-ary tree (b >= 2) and every Poisson Galton-Watson tree of mean d > 1,
reconstruction occurs iff d lambda^2 > 1 (d = b in the regular model), with non-reconstruction at equality for either
sign of lambda. The negative-equality direction is computer assisted by three certificates
(sections/appendix-certificates.tex:1-9): the pair coefficient certificate (pair.py), the interval positivity
certificate (interval.cpp), and the finite grid-experiment certificate (grid.cpp).

WHAT IS DECIDED HERE, exactly, with code written for this audit (no release code is imported or run). Clean-room
order: PAIR and GRID were written and run before any release program was opened; the INTERVAL part was first written
and run as a plain interval evaluator, then rewritten with the centred (mean-value) form AFTER interval.cpp had been
read — the method is the one appendix-interval.tex describes in prose, the code is independent.

  PAIR (appendix-certificates.tex:60-167, Lemma loc:pair at 04-local.tex:39-51). From the definitions only — the sorted
    parametrisation p = (6s+3t+2, 3t+2, 2), q = (6u+3v+2, 3v+2, 2), e_i = Q - q_i, E = 2Q, r^(j)_i = p_i e~_{i+j},
    T_j = sum_i r^(j)_i, N_x, N_y, the cleared denominator D = PE (T0T1T2)^3 P^4 E^4, the reflection term I, and the
    seven printed combinations — the fourteen cleared polynomials are rebuilt in Z[s,t,u,v] (exact integer/rational
    polynomial arithmetic, packed exponents) for both reflection classes. Decided: every one has total degree 28,
    integer coefficients, all coefficients >= 0 (so each inequality holds on the whole closed quadrant s,t,u,v >= 0),
    and its number of nonzero coefficients equals the printed 13672, 13672, 13674, 13625, 13625, 13625, 13625. Also
    the identities sum_j T_j = PE and E = 2Q, and the parametrisation's inverse (p = 2h/h_2), are checked.

  GRID (06-grid.tex:129-400, appendix-grid.tex). The exact integer recursion is re-implemented from the text: the 469
    sorted triples of sum H = 72, the spread rounding (n_i, b_i, k), the three likelihood modes with their table
    denominators D_tab = 6H^2, 6BH^2, 18B^2H^2, the floor-and-complete combine (eq. grid:combine), the regular recursion
    h = C2(m,m), m' = C0(h,h), the Poisson count recursion Q_n = C1(Q_{n-1}, m) with the integer Taylor/Poisson weights
    (S0 = 10^15, l_n, u_n, L, w_0, w_n), the bins d_min = 800+3j, the least A with A^2 d_min >= 200*10^12, and the
    stopping test 20 M(m) < N H^2. Decided per case: the table mass identity sum_h w_{p,q}(h) = D_tab for every ordered
    pair, the symmetry w_{p,q} = w_{q,p} of modes 0 and 2 (which the authors' triangular code relies on), and the
    stopping iteration, compared with the printed -1 -> 162 and j = 0..26 -> eq. grid:outputs. The combine is computed
    as Lambda[p] = sum_q n_q w_{p,q}(.) then sum_p m_p Lambda[p] — the same integer sum as eq. grid:combine.

  INTERVAL (Lemma wei:positive, 05-weighted.tex:255-289; appendix-interval.tex). P = D0 + D1 xi + D2 xi^2 + D3 xi^3
    with D0..D3 from eq. wei:coefficients, the band parameters parsed from eq. wei:parameters, and the paper's
    parametrisation p = (1, q^18, r^18)/(1 + q^18 + r^18). Re-derived here: the closed forms of T, W, Y (centred logs)
    and of the hatted edge functions are cross-checked against their definitions at a rational point. Decided with my
    own rigorous arithmetic — dyadic intervals (integer endpoints over 2^62, rounded outward), log via
    2 atanh((m-1)/(m+1)) with an explicit tail bound, exact integer cube roots, L(t) = -log(1-t)/t by its series or by
    log, monotonicity of L and L' (L', L'' > 0), the bounds |q^6 log^j q| <= q^3 and |q^5 log^j q| <= q^2 (j <= 3) at
    q = 0, a first-order forward mode for the gradient in (q, r, a), the centred (mean-value) form on each box, and an
    exact Bernstein positivity test of the cubic with the D_i lower ends on xi in [3/100, 1] — that P > 0 on the
    sub-domain {0 <= r <= q <= 4/5} x band x [3/100, 1] for each of the three bands (decide(qmax=...)). NOT decided:
    the rest of the domain, q in (4/5, 1] (messages with max(p2, p3)/p1 > (4/5)^18 = 0.018, including the
    near-uniform corner where P is ~2e-5); the measured cost is reported in the value. (P > 0 there is supported only
    by the authors' interval program, not re-decided.)

WHAT IS NOT DECIDED HERE (theory, not the finite objects):
  - Everything analytic: Sections 2-5 and 7 (degradation, the fixed-point limit, the local gap Proposition loc:gap with
    its decimal estimates, the weighted identities and scalar bounds of Section 5, the positive-channel analysis of
    Section 3, the radial appendix, the SBM corollary and the external theorems it cites).
  - For PAIR: the extension of the a = 1/2, strictly-positive inequalities to every 0 <= a <= 1/2 and to the boundary
    (04-local.tex:61-75), and the identification of the class averages with the tilted product moments (re-read).
  - For INTERVAL: the rest of the domain (above), and the scalar bounds h <= h_bar, z >= z_bar, xi in (.03, 1) of
    Lemma wei:scalarbounds that make P > 0 sufficient (analytic).
  - For GRID: that the rounded recursion dominates the exact experiments (Lemmas grid:spread, grid:completion, the
    garbling and degradation arguments) — the code decides only what the integers do. The Poisson weights' validity
    as lower bounds of e^{-d} d^n / n! is re-derived as integer arithmetic only, not proved here.
  - That these certificates together cover the parameter table tab:coverage (07-conclusion.tex:5-22) is re-read; the
    bin overlap with the analytic range (eq. grid:overlap) is recomputed exactly.
"""
import itertools
import os
import re
import sys
import time
from array import array
from fractions import Fraction
from math import gcd

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import Sources, check  # noqa: E402

PAPER = 'preprints/The-exact-reconstruction-threshold-for-the-three-state-symmetric-channel-September-25-2026/build/sections/'
F_GRID = PAPER + '06-grid.tex'
F_GRIDAPP = PAPER + 'appendix-grid.tex'
F_CERT = PAPER + 'appendix-certificates.tex'
F_LOCAL = PAPER + '04-local.tex'
F_WEIGHTED = PAPER + '05-weighted.tex'
F_INTERVAL = PAPER + 'appendix-interval.tex'
F_CONCL = PAPER + '07-conclusion.tex'

# ----------------------------------------------------------------------------------------------------------------------
# PAIR: polynomials in Z[s,t,u,v] (Fraction coefficients allowed), exponents packed base 64 (total degree <= 28)
# ----------------------------------------------------------------------------------------------------------------------
_B = 64
_PAIR_CACHE = {}


def _var(i):
    return {_B ** i: 1}


def _const(c):
    return {0: c} if c else {}


def _add(*ps):
    r = {}
    for p in ps:
        for k, c in p.items():
            v = r.get(k, 0) + c
            if v:
                r[k] = v
            else:
                r.pop(k, None)
    return r


def _scale(p, c):
    return {k: v * c for k, v in p.items()} if c else {}


def _sub(a, b):
    return _add(a, _scale(b, -1))


def _mul(a, b):
    if len(a) > len(b):
        a, b = b, a
    r = {}
    g = r.get
    for ka, ca in a.items():
        for kb, cb in b.items():
            k = ka + kb
            r[k] = g(k, 0) + ca * cb
    return {k: c for k, c in r.items() if c}


def _pw(a, n):
    r = _const(1)
    for _ in range(n):
        r = _mul(r, a)
    return r


def _deg(k):
    d = 0
    while k:
        d += k % _B
        k //= _B
    return d


def _ev(p, pt):
    tot = Fraction(0)
    for k, c in p.items():
        t = Fraction(c)
        for i in range(4):
            e = (k // _B ** i) % _B
            if e:
                t *= Fraction(pt[i]) ** e
        tot += t
    return tot


def _Nx(r):
    R = _add(*r)
    return _scale(_sub(_scale(_add(*[_mul(x, x) for x in r]), 3), _mul(R, R)), Fraction(1, 2))


def _Ny(r):
    R = _add(*r)
    return _scale(_add(_scale(_mul(_mul(r[0], r[1]), r[2]), 27), _scale(_pw(R, 3), -1), _scale(_mul(R, _Nx(r)), 3)),
                  Fraction(1, 2))


def _odd(r):
    return _scale(_mul(_mul(_sub(r[1], r[2]), _sub(r[0], r[1])), _sub(r[0], r[2])), 4)


# The seven printed combinations (appendix-certificates.tex:136-145), as coefficient tables over the cleared blocks
# Xz, W, y0B0, SA, SB, dx, de, dn, I. Each row: dict block -> coefficient.
PAIR_ROWS = [
    {'Xz': 13, 'dn': -2},                                                       # 13Xz - 2d_n
    {'Xz': 11, 'de': -1},                                                       # 11Xz - d_e
    {'de': 250, 'Xz': 79},                                                      # 250d_e + 79Xz
    {'Xz': -20, 'W': -40, 'y0B0': 40, 'SA': 51, 'SB': 51, 'dx': -20, 'I': 40},  # -20Xz-40W+40y0B0+51S-20(dx-2I)
    {'Xz': 6, 'W': -6, 'y0B0': 1, 'SA': 1, 'SB': 1, 'de': -1, 'I': -1},         # 6Xz-6W+y0B0+S-(de+I)
    {'de': 2, 'I': 2, 'Xz': -12, 'W': 12, 'y0B0': -2, 'SA': 19, 'SB': 19},      # 2(de+I)-12Xz+12W-2y0B0+19S
    {'Xz': -4, 'W': 44, 'y0B0': -14, 'SA': 52, 'SB': 111, 'dn': -5, 'I': -50 + 4, 'de': 4},
    # -4Xz+44W-14y0B0+52SA+111SB-{5(dn+10I)-4(de+I)}  -> I coefficient -50+4 = -46
]
PAIR_PRINTED_COUNTS = [13672, 13672, 13674, 13625, 13625, 13625, 13625]


def pair_blocks():
    """the cleared building blocks for both reflection classes (D times each quantity), plus side identities"""
    if 'b' not in _PAIR_CACHE:
        _PAIR_CACHE['b'] = _pair_blocks()
    return _PAIR_CACHE['b']


def _pair_blocks():
    s, t, u, v = (_var(i) for i in range(4))
    p = [_add(_scale(s, 6), _scale(t, 3), _const(2)), _add(_scale(t, 3), _const(2)), _const(2)]
    q = [_add(_scale(u, 6), _scale(v, 3), _const(2)), _add(_scale(v, 3), _const(2)), _const(2)]
    P = _add(*p)
    Q = _add(*q)
    e = [_sub(Q, qi) for qi in q]
    E = _add(*e)
    side = {'E=2Q': E == _scale(Q, 2)}
    Nxp, Nyp = _Nx(p), _Ny(p)
    classes = []
    for et in ([e[0], e[1], e[2]], [e[0], e[2], e[1]]):
        rs = [[_mul(p[i], et[(i + j) % 3]) for i in range(3)] for j in range(3)]
        T = [_add(*r) for r in rs]
        side.setdefault('sum T_j = PE', True)
        side['sum T_j = PE'] = side['sum T_j = PE'] and _add(*T) == _mul(P, E)
        T3 = [_pw(Tj, 3) for Tj in T]
        TTT = _mul(_mul(T3[0], T3[1]), T3[2])
        P4E4 = _mul(_pw(P, 4), _pw(E, 4))
        Nxe, Nye = _Nx(et), _Ny(et)

        def mon(i, j, k, l):
            # D * X^i y0^j z^k B0^l, X = Nx(p)/P^2, y0 = Ny(p)/P^3, z = Nx(e)/E^2, B0 = Ny(e)/E^3
            assert 5 - 2 * i - 3 * j >= 0 and 5 - 2 * k - 3 * l >= 0
            f = _mul(_pw(P, 5 - 2 * i - 3 * j), _pw(E, 5 - 2 * k - 3 * l))
            f = _mul(f, _mul(_pw(Nxp, i), _pw(Nyp, j)))
            f = _mul(f, _mul(_pw(Nxe, k), _pw(Nye, l)))
            return _mul(f, TTT)

        def others(j, pows):
            f = _const(1)
            for jj in range(3):
                if jj != j:
                    f = _mul(f, T3[jj])
            return _mul(f, _pw(T[j], pows))
        # D * sum_j Nx(r_j)/(PE T_j), D * sum_j Ny(r_j)/(PE T_j^2), D * sum_j Nx(r_j)^2/(PE T_j^3)
        outx = _add(*[_mul(_mul(_Nx(rs[j]), others(j, 2)), P4E4) for j in range(3)])
        outy = _add(*[_mul(_mul(_Ny(rs[j]), others(j, 1)), P4E4) for j in range(3)])
        outn = _add(*[_mul(_mul(_pw(_Nx(rs[j]), 2), others(j, 0)), P4E4) for j in range(3)])
        b = {'Xz': mon(1, 0, 1, 0), 'W': _add(mon(0, 1, 1, 0), mon(1, 0, 0, 1)), 'y0B0': mon(0, 1, 0, 1),
             'SA': mon(2, 0, 1, 0), 'SB': mon(1, 0, 2, 0)}
        b['dx'] = _sub(outx, _add(mon(1, 0, 0, 0), mon(0, 0, 1, 0)))
        b['de'] = _sub(outy, _add(mon(0, 1, 0, 0), mon(0, 0, 0, 1)))
        b['dn'] = _sub(outn, _add(mon(2, 0, 0, 0), mon(0, 0, 2, 0)))
        b['I'] = _scale(_mul(_mul(_mul(_odd(p), _odd(et)), TTT), _mul(_pw(P, 2), _pw(E, 2))), Fraction(27, 64))
        classes.append(b)
    return classes, side, p


def pair_polys(blocks, rows=PAIR_ROWS):
    out = []
    for row in rows:
        f = {}
        for name, c in row.items():
            f = _add(f, _scale(blocks[name], c))
        out.append(f)
    return out


def pair_stats(f):
    vals = list(f.values())
    return {'nonzero': len(f), 'min': min(vals) if vals else 0, 'degmax': max(_deg(k) for k in f) if f else -1,
            'integral': all(Fraction(c).denominator == 1 for c in vals)}


# ----------------------------------------------------------------------------------------------------------------------
# GRID
# ----------------------------------------------------------------------------------------------------------------------
H = 72
N = 10 ** 12
REPS = [(a, b, H - a - b) for a in range(H, -1, -1) for b in range(H - a, -1, -1) if a >= b >= H - a - b]
NR = len(REPS)
IDX = {h: i for i, h in enumerate(REPS)}
PURE = IDX[(72, 0, 0)]
UNI = IDX[(24, 24, 24)]
PERM3 = list(itertools.permutations(range(3)))


def _orbit(v):
    return IDX[tuple(sorted(v, reverse=True))]


class Table:
    """w_{p,q}(h) for all ordered pairs (p first, q second), stored per p as flat arrays (q offsets, h, w)"""

    def __init__(self, mode, A=1, B=1):
        g = gcd(A, B)
        A //= g
        B //= g
        self.mode, self.A, self.B = mode, A, B
        self.D = {0: 6 * H * H, 1: 6 * B * H * H, 2: 18 * B * B * H * H}[mode]
        self.mass_ok = True
        self.rows = []
        self.nentries = 0

        def e(q):
            return [(B + A) * H - 3 * A * qi for qi in q]
        for p in REPS:
            lp = list(p) if mode in (0, 1) else e(p)
            off = array('l', [0])
            hs = array('H')
            ws = array('q')
            for q in REPS:
                rq = [3 * x for x in q] if mode == 0 else e(q)
                acc = {}
                for pi in PERM3:
                    r = [lp[i] * rq[pi[i]] for i in range(3)]
                    T = r[0] + r[1] + r[2]
                    if T == 0:
                        continue
                    nn = [H * ri // T for ri in r]
                    b = [H * ri - ni * T for ri, ni in zip(r, nn)]
                    k = H - sum(nn)
                    if sum(b) != k * T or k not in (0, 1, 2):
                        raise AssertionError('spread deficit')
                    if k == 0:
                        o = _orbit(nn)
                        acc[o] = acc.get(o, 0) + T
                    elif k == 1:
                        for i in range(3):
                            if b[i]:
                                vv = list(nn)
                                vv[i] += 1
                                o = _orbit(vv)
                                acc[o] = acc.get(o, 0) + b[i]
                    else:
                        for i in range(3):
                            if T - b[i]:
                                vv = [x + 1 for x in nn]
                                vv[i] -= 1
                                o = _orbit(vv)
                                acc[o] = acc.get(o, 0) + T - b[i]
                if sum(acc.values()) != self.D or min(acc.values(), default=0) < 0:
                    self.mass_ok = False
                for h in sorted(acc):
                    hs.append(h)
                    ws.append(acc[h])
                off.append(len(hs))
            self.rows.append((off, hs, ws))
            self.nentries += len(hs)

    def entry(self, ip, iq):
        off, hs, ws = self.rows[ip]
        return dict(zip(hs[off[iq]:off[iq + 1]], ws[off[iq]:off[iq + 1]]))

    def symmetric(self):
        return all(self.entry(i, j) == self.entry(j, i) for i in range(NR) for j in range(i + 1, NR))

    def lam(self, second):
        """Lambda[p][h] = sum_q second_q w_{p,q}(h)"""
        nz = [(iq, x) for iq, x in enumerate(second) if x]
        out = []
        for off, hs, ws in self.rows:
            acc = [0] * NR
            for iq, x in nz:
                s0, e0 = off[iq], off[iq + 1]
                for h, w in zip(hs[s0:e0], ws[s0:e0]):
                    acc[h] += x * w
            out.append(acc)
        return out


_SLOT = 15  # bytes per packed slot: every slot sum is <= N^2 D_tab < 2^115, all terms nonnegative


def _pack(vec):
    return int.from_bytes(b''.join(v.to_bytes(_SLOT, 'little') for v in vec), 'little')


def _unpack(x):
    b = x.to_bytes(_SLOT * NR, 'little')
    return [int.from_bytes(b[_SLOT * h:_SLOT * h + _SLOT], 'little') for h in range(NR)]


def _complete(l):
    s = sum(l)
    if s > N or min(l) < 0:
        raise AssertionError('mass')
    l = list(l)
    l[PURE] += N - s
    return l


def _apply(first, packed, D):
    tot = 0
    for p, x in enumerate(first):
        if x:
            tot += x * packed[p]
    den = N * D
    return _complete([v // den for v in _unpack(tot)])


def combine(tab, first, second):
    """eq. grid:combine: floor(sum_{p,q} m_p n_q w_{p,q}(h) / (N D)), completed at the pure orbit"""
    L = tab.lam(second)
    return _apply(first, [_pack(r) for r in L], tab.D)


def moment_num(m):
    return sum(mh * (H * H - 3 * (h[0] * h[1] + h[1] * h[2] + h[2] * h[0])) for mh, h in zip(m, REPS))


def below(m):
    return 20 * moment_num(m) < N * H * H


def poisson_weights(dmax):
    S0 = 10 ** 15
    l = [S0]
    u = [S0]
    for n in range(1, 42):
        l.append(l[-1] * dmax // (200 * n))
        u.append(-((-u[-1] * dmax) // (200 * n)))
    L = S0 + sum(l[n] for n in range(1, 42) if n % 2 == 0) - sum(u[n] for n in range(1, 42) if n % 2 == 1)
    if L <= 0:
        raise AssertionError('L')
    w = [N * L // S0]
    n = 1
    while True:
        nw = w[-1] * dmax // (200 * n)
        if nw == 0:
            break
        w.append(nw)
        n += 1
    return w


def magnitude(dmin):
    lo, hi = 1, 500000
    if hi * hi * dmin < 200 * 10 ** 12:
        raise AssertionError('upper end')
    while lo < hi:
        mid = (lo + hi) // 2
        if mid * mid * dmin >= 200 * 10 ** 12:
            hi = mid
        else:
            lo = mid + 1
    return lo


_GRID_CACHE = {}


def grid_case(j, maxit=400):
    """returns (stopping iteration, info dict) for case j (-1 regular, 0..26 Poisson); cached per process"""
    if j in _GRID_CACHE:
        return _GRID_CACHE[j]
    _GRID_CACHE[j] = _grid_case(j, maxit)
    return _GRID_CACHE[j]


def _grid_case(j, maxit):
    t0 = time.time()
    m = [0] * NR
    m[PURE] = N
    info = {}
    if j == -1:
        T2 = Table(2, 1, 2)
        T0 = Table(0)
        info.update(mass_ok=T2.mass_ok and T0.mass_ok, symmetric=T2.symmetric() and T0.symmetric(),
                    entries=[T2.nentries, T0.nentries], D=[T2.D, T0.D])
        it = 0
        while not below(m):
            hh = combine(T2, m, m)
            m = combine(T0, hh, hh)
            it += 1
            if it > maxit:
                raise AssertionError('no stop')
    else:
        dmin, dmax = 800 + 3 * j, 803 + 3 * j
        A = magnitude(dmin)
        T1 = Table(1, A, 10 ** 6)
        w = poisson_weights(dmax)
        info.update(mass_ok=T1.mass_ok, A=A, D=T1.D, nweights=len(w), entries=T1.nentries)
        it = 0
        while not below(m):
            packed = [_pack(r) for r in T1.lam(m)]
            ell = [0] * NR
            ell[UNI] += w[0] * N // N
            Qn = [0] * NR
            Qn[UNI] = N
            for n in range(1, len(w)):
                Qn = _apply(Qn, packed, T1.D)
                for h in range(NR):
                    if Qn[h]:
                        ell[h] += w[n] * Qn[h] // N
            m = _complete(ell)
            it += 1
            if it > maxit:
                raise AssertionError('no stop')
    info['seconds'] = round(time.time() - t0, 1)
    info['mu_final'] = str(Fraction(moment_num(m), N * H * H))
    return it, info


def _grid_worker(j):
    return j, grid_case(j)


def printed_grid(src):
    g = src.text(F_GRID)
    block = g[g.index('\\begin{gathered}'):g.index('\\end{gathered}')]
    vals = [int(x) for x in re.findall(r'\d+', block)]
    reg = re.search(r'returns iteration\s*\$(\d+)\$ for argument \$-1\$', g.replace('\n', ' '))
    return int(reg.group(1)), vals


# ----------------------------------------------------------------------------------------------------------------------
# INTERVAL: dyadic intervals [lo, hi] * 2^-PREC with integer lo, hi (exact rationals, rounded outward), a first-order
# forward mode (value and the three partial derivatives in q, r, a enclosed on the whole box), and the centred form
# F(box) in F(centre) + sum_k dF_k(box) (box_k - centre_k)  (mean value theorem; the box is convex).
# ----------------------------------------------------------------------------------------------------------------------
PREC = 62
ONE = 1 << PREC


def _fl(n, d):   # floor(n/d), d > 0
    return n // d


def _ce(n, d):   # ceil(n/d), d > 0
    return -((-n) // d)


class I:
    __slots__ = ('l', 'h')

    def __init__(self, l, h):
        if l > h:
            raise AssertionError('empty interval')
        self.l, self.h = l, h

    @staticmethod
    def q(x, y=None):
        """enclosure of the rationals x (and y >= x)"""
        x = Fraction(x)
        y = x if y is None else Fraction(y)
        return I(_fl(x.numerator * ONE, x.denominator), _ce(y.numerator * ONE, y.denominator))

    def lo(self):
        return Fraction(self.l, ONE)

    def hi(self):
        return Fraction(self.h, ONE)

    def __add__(s, o):
        if isinstance(o, I):
            return I(s.l + o.l, s.h + o.h)
        return s + I.q(o)
    __radd__ = __add__

    def __neg__(s):
        return I(-s.h, -s.l)

    def __sub__(s, o):
        if isinstance(o, I):
            return I(s.l - o.h, s.h - o.l)
        return s - I.q(o)

    def __rsub__(s, o):
        return I.q(o) - s

    def __mul__(s, o):
        if not isinstance(o, I):
            o = Fraction(o)
            n, d = o.numerator, o.denominator
            if n >= 0:
                return I(_fl(s.l * n, d), _ce(s.h * n, d))
            return I(_fl(s.h * n, d), _ce(s.l * n, d))
        c = (s.l * o.l, s.l * o.h, s.h * o.l, s.h * o.h)
        return I(min(c) >> PREC, _ce(max(c), ONE))
    __rmul__ = __mul__

    def recip(s):
        if s.l > 0 or s.h < 0:
            return I(_fl(ONE * ONE, s.h), _ce(ONE * ONE, s.l))
        raise AssertionError('reciprocal of an interval containing 0')

    def __truediv__(s, o):
        return s * (o.recip() if isinstance(o, I) else I.q(1 / Fraction(o)))

    def sq(s):
        if s.l >= 0:
            return I((s.l * s.l) >> PREC, _ce(s.h * s.h, ONE))
        if s.h <= 0:
            return I((s.h * s.h) >> PREC, _ce(s.l * s.l, ONE))
        return I(0, _ce(max(s.l * s.l, s.h * s.h), ONE))

    def meet(s, o):
        return I(max(s.l, o.l), min(s.h, o.h))

    def hull(s, o):
        return I(min(s.l, o.l), max(s.h, o.h))


ZERO = I(0, 0)


def _atanh2(w, N=26):
    """2 atanh(w) for rational |w| <= 1/5: 2 sum_{n<N} w^(2n+1)/(2n+1) by interval Horner, plus the tail bound
    2|w|^(2N+1)/((2N+1)(1-w^2))"""
    w = Fraction(w)
    if abs(w) > Fraction(1, 5):
        raise AssertionError('atanh argument')
    w2 = I.q(w * w)
    acc = I.q(Fraction(1, 2 * N - 1))
    for n in range(N - 2, -1, -1):
        acc = acc * w2 + Fraction(1, 2 * n + 1)
    val = acc * (2 * w)
    tail = 2 * abs(w) ** (2 * N + 1) / ((2 * N + 1) * (1 - w * w))
    return val + I.q(-tail, tail)


_LN2 = []
_LOGC = {}


def log_pt(x):
    """enclosure of log x, rational x > 0: x = m 2^e, m in [2/3, 4/3], log m = 2 atanh((m-1)/(m+1)), log 2 = 2 atanh(1/3)
    (the 1/3 argument uses N = 40 terms)"""
    x = Fraction(x)
    if x in _LOGC:
        return _LOGC[x]
    if x <= 0:
        raise AssertionError('log domain')
    if not _LN2:
        w = Fraction(1, 3)
        N = 40
        acc = I.q(Fraction(1, 2 * N - 1))
        for n in range(N - 2, -1, -1):
            acc = acc * I.q(w * w) + Fraction(1, 2 * n + 1)
        tail = 2 * w ** (2 * N + 1) / ((2 * N + 1) * (1 - w * w))
        _LN2.append(acc * (2 * w) + I.q(-tail, tail))
    e, m = 0, x
    while m > Fraction(4, 3):
        m /= 2
        e += 1
    while m < Fraction(2, 3):
        m *= 2
        e -= 1
    r = _atanh2((m - 1) / (m + 1)) + _LN2[0] * e
    if len(_LOGC) < 200000:
        _LOGC[x] = r
    return r


def _icbrt(n):
    if n < 2:
        return n
    x = 1 << ((n.bit_length() + 2) // 3)
    while True:
        y = (2 * x + n // (x * x)) // 3
        if y >= x:
            break
        x = y
    while x * x * x > n:
        x -= 1
    while (x + 1) ** 3 <= n:
        x += 1
    return x


def cbrt_I(v):
    """cube root is increasing: [floor-root of the lower end, ceil-root of the upper end] in units 2^-PREC"""
    if v.l <= 0:
        raise AssertionError('cbrt domain')
    lo = _icbrt(v.l * ONE * ONE)
    n = v.h * ONE * ONE
    hi = _icbrt(n)
    if hi ** 3 < n:
        hi += 1
    return I(lo, hi)


def L_pt(t):
    """enclosure of L(t) = -log(1-t)/t at a rational t < 1 (L(0) = 1)"""
    t = Fraction(t)
    if abs(t) <= Fraction(1, 8):
        N = 34
        acc = I.q(Fraction(1, N))
        for n in range(N - 2, -1, -1):
            acc = acc * t + Fraction(1, n + 1)
        tail = abs(t) ** N / ((N + 1) * (1 - abs(t)))
        return acc + I.q(-tail, tail)
    return (-log_pt(1 - t)) * (1 / t)


def dL_pt(t):
    """enclosure of L'(t) = sum_{n>=1} n t^(n-1)/(n+1) = ((1-t)^-1 - L(t))/t"""
    t = Fraction(t)
    if abs(t) <= Fraction(1, 8):
        N = 34
        acc = I.q(Fraction(N - 1, N))
        for n in range(N - 2, 0, -1):
            acc = acc * t + Fraction(n, n + 1)
        tail = abs(t) ** (N - 1) / (1 - abs(t))       # coefficients n/(n+1) <= 1
        return acc + I.q(-tail, tail)
    return (I.q(1 / (1 - t)) - L_pt(t)) * (1 / t)


def _endpt(v, which):
    return Fraction(v.l if which == 0 else v.h, ONE)


def L_I(t):
    """L and L' are increasing on t < 1 (L' = int s/(1-st)^2 ds, L'' = 2 int s^2/(1-st)^3 ds > 0)"""
    lo, hi = _endpt(t, 0), _endpt(t, 1)
    return I(L_pt(lo).l, L_pt(hi).h), I(dL_pt(lo).l, dL_pt(hi).h)


class J:
    """value and gradient (q, r, a) enclosures"""
    __slots__ = ('v', 'g')

    def __init__(self, v, g):
        self.v, self.g = v, g

    @staticmethod
    def const(c):
        return J(c if isinstance(c, I) else I.q(c), (ZERO, ZERO, ZERO))

    def __add__(s, o):
        o = o if isinstance(o, J) else J.const(o)
        return J(s.v + o.v, tuple(x + y for x, y in zip(s.g, o.g)))
    __radd__ = __add__

    def __neg__(s):
        return J(-s.v, tuple(-x for x in s.g))

    def __sub__(s, o):
        o = o if isinstance(o, J) else J.const(o)
        return J(s.v - o.v, tuple(x - y for x, y in zip(s.g, o.g)))

    def __rsub__(s, o):
        return J.const(o) - s

    def __mul__(s, o):
        if not isinstance(o, J):
            return J(s.v * o, tuple(x * o for x in s.g))
        return J(s.v * o.v, tuple(x * o.v + y * s.v for x, y in zip(s.g, o.g)))
    __rmul__ = __mul__

    def recip(s):
        r = s.v.recip()
        r2 = r.sq()
        return J(r, tuple(-(x * r2) for x in s.g))

    def sq(s):
        return J(s.v.sq(), tuple(x * s.v * 2 for x in s.g))


def qlog_J(qi, k, j):
    """J for q^6 (log q)^j, q the k-th variable on [ql, qh] subset [0, 1]. Derivative 6 q^5 L^j + j q^5 L^(j-1).
    Bounds used where ql = 0: |q^6 L^j| <= q^3 and |q^5 L^j| <= q^(5/2) <= q^2 for 0 <= j <= 3 (e^{-ht/2} t^j <= 1 for
    h >= 5), with the sign of L <= 0."""
    ql, qh = _endpt(qi, 0), _endpt(qi, 1)

    def pw_log(e, jj):
        if jj == 0:
            return I.q(ql ** e, qh ** e)
        bound = qh ** 3 if e == 6 else qh ** 2
        sg = I.q(0, bound) if jj % 2 == 0 else I.q(-bound, 0)
        if ql == 0:
            return sg
        L = I(log_pt(ql).l, min(log_pt(qh).h, 0))
        Lj = L if jj == 1 else (L.sq() if jj == 2 else L.sq() * L)
        return (I.q(ql ** e, qh ** e) * Lj).meet(sg)
    val = pw_log(6, j)
    der = pw_log(5, j) * 6 + (pw_log(5, j - 1) * j if j else ZERO)
    g = [ZERO, ZERO, ZERO]
    g[k] = der
    return J(val, tuple(g))


def pow_J(qi, k, e):
    ql, qh = _endpt(qi, 0), _endpt(qi, 1)
    g = [ZERO, ZERO, ZERO]
    g[k] = I.q(e * ql ** (e - 1), e * qh ** (e - 1))
    return J(I.q(ql ** e, qh ** e), tuple(g))


def cbrt_J(x):
    c = cbrt_I(x.v)
    f = (c.sq() * 3).recip()
    return J(c, tuple(t * f for t in x.g))


def L_J(t):
    val, der = L_I(t.v)
    return J(val, tuple(x * der for x in t.g))


BANDS = [  # a band, 1000 c0, 1000 c1, 1000 s1, 1000 delta, H, U  (eq. wei:parameters)
    (Fraction(0), Fraction(190, 1000), -268, -60, -55, 130, Fraction(1, 16), Fraction(15, 32)),
    (Fraction(190, 1000), Fraction(448, 1000), -269, 67, 47, 55, Fraction(1, 16), Fraction(15, 32)),
    (Fraction(448, 1000), Fraction(477, 1000), -271, 58, 49, 50, Fraction(1, 12), Fraction(1, 2)),
]


BANDS_PRINTED = [tuple(b) for b in BANDS]


def D_J(q, r, a, band):
    """first-order enclosures of D0..D3 (eq. wei:coefficients) on the box q x r x a (I's, 0 <= q, r <= 1)"""
    _, _, c0, c1, s1, dl, Hc, Uc = band
    c0, c1, s1, dl = Fraction(c0, 1000), Fraction(c1, 1000), Fraction(s1, 1000), Fraction(dl, 1000)
    s0 = c0 + Fraction(1, 3)
    aJ = J(a, (ZERO, ZERO, I.q(1)))
    q18, r18 = pow_J(q, 0, 18), pow_J(r, 1, 18)
    q6, r6 = pow_J(q, 0, 6), pow_J(r, 1, 6)
    iZ = (1 + q18 + r18).recip()
    v = [iZ * 3 - 1, q18 * iZ * 3 - 1, r18 * iZ * 3 - 1]
    for vi in v:
        vi.v = vi.v.meet(I.q(-1, 2))
    x = (v[0].sq() + v[1].sq() + v[2].sq()) * Fraction(1, 6)
    y = v[0] * v[1] * v[2] * Fraction(1, 2)
    qL = [None] + [qlog_J(q, 0, j) for j in (1, 2, 3)]
    rL = [None] + [qlog_J(r, 1, j) for j in (1, 2, 3)]
    T = 1 - q6 * r6 * iZ * 3
    W = (r6 * qL[2] + q6 * rL[2] - qL[1] * rL[1]) * iZ * 216
    Y = ((r6 * qL[3]) * 2 + (q6 * rL[3]) * 2 - (qL[2] * rL[1]) * 3 - (qL[1] * rL[2]) * 3) * iZ * 648
    e = [1 - aJ * vi for vi in v]
    prod = e[0] * e[1] * e[2]
    a2 = aJ.sq()
    alt = 1 - a2 * x * 3 - a2 * aJ * y * 2          # = e0 e1 e2 exactly (sum v = 0)
    prod.v = prod.v.meet(alt.v)
    Ge = cbrt_J(prod)
    b = [-(vi * L_J(aJ * vi)) for vi in v]
    w = [(b[0] * 2 - b[1] - b[2]) * Fraction(1, 3), (b[1] * 2 - b[0] - b[2]) * Fraction(1, 3),
         (b[2] * 2 - b[0] - b[1]) * Fraction(1, 3)]
    That = (x * 3 + aJ * y * 2) * (1 + Ge + Ge.sq()).recip()
    What = Ge * (w[0].sq() + w[1].sq() + w[2].sq()) * Fraction(1, 3)
    Yhat = aJ * Ge * w[0] * w[1] * w[2]
    D0 = T - That + (W - What) * c0 + (Y - Yhat) * s0
    D1 = (W - What) * c1 + (Y - Yhat) * s1 + What * c0 + Yhat * s0 + That * (Fraction(1, 2) - dl)
    D2 = What * c1 + Yhat * s1 + That * Hc + dl
    D3 = That * (Hc / 2) + Uc * dl
    return D0, D1, D2, D3


def D_box(qb, rb, ab, band):
    """centred-form enclosures of D0..D3 on the box (qb, rb, ab are pairs of rationals)"""
    box = [I.q(*qb), I.q(*rb), I.q(*ab)]
    full = D_J(box[0], box[1], box[2], band)
    cen = [(qb[0] + qb[1]) / 2, (rb[0] + rb[1]) / 2, (ab[0] + ab[1]) / 2]
    at_c = D_J(I.q(cen[0]), I.q(cen[1]), I.q(cen[2]), band)
    dev = [I.q(qb[0] - cen[0], qb[1] - cen[0]), I.q(rb[0] - cen[1], rb[1] - cen[1]), I.q(ab[0] - cen[2], ab[1] - cen[2])]
    out = []
    for F, Fc in zip(full, at_c):
        enc = Fc.v + F.g[0] * dev[0] + F.g[1] * dev[1] + F.g[2] * dev[2]
        out.append(enc.meet(F.v))
    return out


def cubic_positive(d, l, h, depth=0):
    """exact: sum_i d_i xi^i > 0 on [l, h] by positive cubic Bernstein coefficients, bisecting [l, h] up to 4 times"""
    w = h - l
    e = [d[0] + d[1] * l + d[2] * l * l + d[3] * l ** 3, (d[1] + 2 * d[2] * l + 3 * d[3] * l * l) * w,
         (d[2] + 3 * d[3] * l) * w * w, d[3] * w ** 3]
    bc = [e[0], e[0] + e[1] / 3, e[0] + 2 * e[1] / 3 + e[2] / 3, e[0] + e[1] + e[2] + e[3]]
    if min(bc) > 0:
        return True
    if depth >= 4 or bc[0] <= 0 or bc[3] <= 0:
        return False
    mid = (l + h) / 2
    return cubic_positive(d, l, mid, depth + 1) and cubic_positive(d, mid, h, depth + 1)


XI = (Fraction(3, 100), Fraction(1))


def box_ok(qb, rb, ab, band):
    D = D_box(qb, rb, ab, band)
    return cubic_positive([Fraction(Di.l, ONE) for Di in D], XI[0], XI[1])


def certify_band(bi, qmax, nq=8, na=2, max_boxes=10 ** 7, log=None):
    """certify P > 0 on {0 <= r <= q <= qmax} x band x [3/100, 1]"""
    band = BANDS[bi]
    alo, ahi = band[0], band[1]
    stack = []
    for i in range(nq):
        for j in range(i + 1):
            for k in range(na):
                stack.append(((qmax * i / nq, qmax * (i + 1) / nq), (qmax * j / nq, qmax * (j + 1) / nq),
                              (alo + (ahi - alo) * k / na, alo + (ahi - alo) * (k + 1) / na), 0))
    visited = 0
    open_boxes = []
    t0 = time.time()
    while stack:
        qb, rb, ab, dep = stack.pop()
        visited += 1
        if rb[0] > qb[1]:
            continue
        if box_ok(qb, rb, ab, band):
            continue
        if dep >= 60 or visited > max_boxes:
            open_boxes.append((qb, rb, ab))
            continue
        wq = (qb[1] - qb[0]) * (1 + 18 * qb[1] ** 17)
        wr = (rb[1] - rb[0]) * (1 + 18 * rb[1] ** 17)
        wa = (ab[1] - ab[0]) * 2
        if wq >= wr and wq >= wa:
            m = (qb[0] + qb[1]) / 2
            stack += [((qb[0], m), rb, ab, dep + 1), ((m, qb[1]), rb, ab, dep + 1)]
        elif wr >= wa:
            m = (rb[0] + rb[1]) / 2
            stack += [(qb, (rb[0], m), ab, dep + 1), (qb, (m, rb[1]), ab, dep + 1)]
        else:
            m = (ab[0] + ab[1]) / 2
            stack += [(qb, rb, (ab[0], m), dep + 1), (qb, rb, (m, ab[1]), dep + 1)]
        if log and visited % 5000 == 0:
            print('band', bi, 'visited', visited, 'stack', len(stack), round(time.time() - t0, 1), file=log, flush=True)
    return not open_boxes, visited, open_boxes, round(time.time() - t0, 1)



def parse_bands(tex):
    i = tex.index('\\label{wei:parameters}')
    block = tex[i:tex.index('\\end{array}', i)]
    out = []
    for m in re.finditer(r'\\bigl\[([\d.]+),([\d.]+)\\bigr\]&(-?\d+)&(-?\d+)&(-?\d+)&(\d+)&(\d+)/(\d+)&(\d+)/(\d+)', block):
        lo, hi = (Fraction(x) if x != '0' else Fraction(0) for x in m.group(1, 2))
        out.append((lo, hi, int(m.group(3)), int(m.group(4)), int(m.group(5)), int(m.group(6)),
                    Fraction(int(m.group(7)), int(m.group(8))), Fraction(int(m.group(9)), int(m.group(10)))))
    return out


def P_point(q, r, a, xi, band):
    """enclosure of P = D0 + D1 xi + D2 xi^2 + D3 xi^3 at one rational point"""
    D = D_J(I.q(q), I.q(r), I.q(a), band)
    xi = Fraction(xi)
    return D[0].v + D[1].v * xi + D[2].v * xi * xi + D[3].v * xi ** 3


def definition_crosscheck(q, r, a):
    """T, W, Y and the hatted edge functions from their definitions (wei:functions: G = (m0 m1 m2)^(1/3), u = centred
    log m, W = G<u^2>, Y = G<u^3>; edge: m_e = 1 - a v, hat = d * (.)_e with d = a^-2) at a rational point with
    q, r, a > 0, against the closed forms used by D_J (int:weighted-functions, int:edge-functions)"""
    q, r, a = Fraction(q), Fraction(r), Fraction(a)
    Z = 1 + q ** 18 + r ** 18
    m = [3 / Z, 3 * q ** 18 / Z, 3 * r ** 18 / Z]
    lg = [log_pt(x) for x in m]
    mean = (lg[0] + lg[1] + lg[2]) * Fraction(1, 3)
    u = [x - mean for x in lg]
    G = cbrt_I(I.q(m[0] * m[1] * m[2]))
    Wd = G * (u[0].sq() + u[1].sq() + u[2].sq()) * Fraction(1, 3)
    Yd = G * u[0] * u[1] * u[2]
    v = [x - 1 for x in m]
    e = [1 - a * x for x in v]
    le = [log_pt(x) for x in e]
    me = (le[0] + le[1] + le[2]) * Fraction(1, 3)
    ue = [x - me for x in le]
    Ge = cbrt_I(I.q(e[0] * e[1] * e[2]))
    d = 1 / (a * a)
    Th = (1 - Ge) * d
    Wh = Ge * (ue[0].sq() + ue[1].sq() + ue[2].sq()) * (d / 3)
    Yh = Ge * ue[0] * ue[1] * ue[2] * d
    # closed forms (the code path of D_J)
    qI, rI, aI = I.q(q), I.q(r), I.q(a)
    q18, r18, q6, r6 = pow_J(qI, 0, 18), pow_J(rI, 1, 18), pow_J(qI, 0, 6), pow_J(rI, 1, 6)
    iZ = (1 + q18 + r18).recip()
    qL = [None] + [qlog_J(qI, 0, j) for j in (1, 2, 3)]
    rL = [None] + [qlog_J(rI, 1, j) for j in (1, 2, 3)]
    W = (r6 * qL[2] + q6 * rL[2] - qL[1] * rL[1]) * iZ * 216
    Y = ((r6 * qL[3]) * 2 + (q6 * rL[3]) * 2 - (qL[2] * rL[1]) * 3 - (qL[1] * rL[2]) * 3) * iZ * 648
    vv = [x for x in v]
    x2 = sum(t * t for t in vv) / 6
    y3 = vv[0] * vv[1] * vv[2] / 2
    aJ = J(aI, (ZERO, ZERO, I.q(1)))
    vJ = [J.const(t) for t in vv]
    b = [-(vi * L_J(aJ * vi)) for vi in vJ]
    w = [(b[0] * 2 - b[1] - b[2]) * Fraction(1, 3), (b[1] * 2 - b[0] - b[2]) * Fraction(1, 3), (b[2] * 2 - b[0] - b[1]) * Fraction(1, 3)]
    GeJ = cbrt_J(J.const(I.q(e[0] * e[1] * e[2])))
    That = (J.const(3 * x2 + 2 * a * y3)) * (1 + GeJ + GeJ.sq()).recip()
    What = GeJ * (w[0].sq() + w[1].sq() + w[2].sq()) * Fraction(1, 3)
    Yhat = aJ * GeJ * w[0] * w[1] * w[2]

    def close(A, B):
        return A.l <= B.h and B.l <= A.h and max(A.h - A.l, B.h - B.l) < (1 << (PREC - 30))
    return {'W': close(W.v, Wd), 'Y': close(Y.v, Yd), 'That': close(That.v, Th), 'What': close(What.v, Wh),
            'Yhat': close(Yhat.v, Yh)}


def _band_worker(args):
    global XI
    bi, qmax, bands, xi = args
    BANDS[:] = bands
    XI = xi
    return bi, certify_band(bi, qmax)


# ----------------------------------------------------------------------------------------------------------------------
def decide(src=None, parts=('pair', 'grid', 'interval'), grid_cases='all', jobs=1, printed=None, pair_rows=None, log=None,
           qmax=Fraction(4, 5), bands=None, xi=None):
    src = src or Sources()
    checks = []
    value = {}
    t0 = time.time()
    cert = src.text(F_CERT)
    local = src.text(F_LOCAL)
    src.text(F_GRIDAPP)
    src.text(F_CONCL)
    if 'pair' in parts:
        m = re.search(r'are\s*\\\[\s*([\d,\\ ]+)\.\s*\\\]', cert)
        printed_counts = [int(x) for x in re.findall(r'\d+', m.group(1))] if m else None
        check(checks, 'pair: printed nonzero-coefficient counts parsed', printed_counts == PAIR_PRINTED_COUNTS, str(printed_counts))
        check(checks, 'pair: the certified Lemma loc:pair as printed (coarse bounds 13/2, 79/250, 11)',
              '\\frac{13}{2}Xz' in local and '\\frac{79}{250}Xz' in local and '11Xz' in local)
        tp = time.time()
        classes, side, p = pair_blocks()
        check(checks, 'pair: E = 2Q (coloring edge e_i = Q - q_i)', side['E=2Q'])
        check(checks, 'pair: sum_j T_j = PE in both reflection classes (tilt weights sum to one)', side['sum T_j = PE'])
        h = (Fraction(7), Fraction(4), Fraction(3))
        s_, t_ = (h[0] - h[1]) / (3 * h[2]), 2 * (h[1] - h[2]) / (3 * h[2])
        pv = [_ev(x, (s_, t_, 0, 0)) for x in p]
        check(checks, 'pair: the parametrisation inverse gives p = 2h/h_2 (h = (7,4,3))', pv == [2 * x / h[2] for x in h], str(pv))
        rows = pair_rows or PAIR_ROWS
        stats = []
        for ci, b in enumerate(classes):
            for ri, f in enumerate(pair_polys(b, rows)):
                st = pair_stats(f)
                stats.append(st)
                ok = st['min'] >= 0 and st['degmax'] == 28 and st['integral']
                check(checks, 'pair: reflection %d, polynomial %d: degree 28, integer coefficients, all >= 0' % (ci + 1, ri + 1), ok,
                      'min coefficient %s, %d nonzero' % (st['min'], st['nonzero']))
                check(checks, 'pair: reflection %d, polynomial %d: nonzero coefficients = printed %d' % (ci + 1, ri + 1, PAIR_PRINTED_COUNTS[ri]),
                      st['nonzero'] == PAIR_PRINTED_COUNTS[ri], str(st['nonzero']))
        value['pair'] = {'counts': [s['nonzero'] for s in stats], 'seconds': round(time.time() - tp, 1)}
    if 'grid' in parts:
        gtxt = src.text(F_GRID)
        reg, outs = printed if printed else printed_grid(src)
        check(checks, 'grid: printed outputs parsed (27 Poisson values and the regular 162)', len(outs) == 27, '%s; regular %s' % (outs, reg))
        check(checks, 'grid: 469 sorted triples of sum 72', NR == 469 and 'There are $469$ representatives' in gtxt)
        ov = Fraction(881, 200) - 1 / Fraction(477, 1000) ** 2
        check(checks, 'grid: overlap 881/200 - 1/(477/1000)^2 = 453049/45505800 > 0 (eq. grid:overlap)', ov == Fraction(453049, 45505800) and ov > 0, str(ov))
        cover = all(Fraction(800 + 3 * j, 200) == Fraction(803 + 3 * (j - 1), 200) for j in range(1, 27)) and Fraction(803 + 78, 200) == Fraction(881, 200)
        check(checks, 'grid: the bins [d_min/200, d_max/200] share endpoints and cover [4, 881/200]', cover)
        mag_ok = True
        for j in range(27):
            dmin = 800 + 3 * j
            A = magnitude(dmin)
            # a_+ = A/10^6 >= d^{-1/2} for every d in the bin  <=>  A^2 d_min >= 200*10^12 (d >= d_min/200), and a_+ <= 1/2
            mag_ok = mag_ok and A * A * dmin >= 200 * 10 ** 12 > (A - 1) ** 2 * dmin and 2 * A <= 10 ** 6
        check(checks, 'grid: magnitudes A (least with A^2 d_min >= 200*10^12) satisfy a_+ >= d^{-1/2} on the bin and a_+ <= 1/2', mag_ok)
        cases = list(grid_cases) if grid_cases != 'all' else [-1] + list(range(27))
        results = {}
        if jobs > 1:
            from concurrent.futures import ProcessPoolExecutor
            with ProcessPoolExecutor(jobs) as ex:
                for j, res in ex.map(_grid_worker, cases):
                    results[j] = res
                    if log:
                        print('grid case', j, res, file=log, flush=True)
        else:
            for j in cases:
                results[j] = grid_case(j)
                if log:
                    print('grid case', j, results[j], file=log, flush=True)
        for j in cases:
            _GRID_CACHE[j] = results[j]
            it, info = results[j]
            want = reg if j == -1 else outs[j]
            check(checks, 'grid: case %d tables have sum_h w = D_tab for every ordered pair%s' % (j, ' and modes 0, 2 symmetric' if j == -1 else ''),
                  info['mass_ok'] and info.get('symmetric', True), str({k: v for k, v in info.items() if k in ('D', 'A', 'entries', 'nweights')}))
            check(checks, 'grid: case %d stops at iteration %d (printed %d)' % (j, it, want), it == want,
                  'mu at stop = %s; %.1f s' % (info['mu_final'], info['seconds']))
        value['grid'] = {str(j): results[j][0] for j in cases}
    if 'interval' in parts:
        wtx = src.text(F_WEIGHTED)
        itx = src.text(F_INTERVAL)
        parsed = parse_bands(wtx)
        check(checks, 'interval: the parameter table eq. wei:parameters parsed (3 bands)', parsed == BANDS_PRINTED, str(parsed))
        bands = bands or parsed
        global XI
        XI = xi or (Fraction(3, 100), Fraction(1))
        check(checks, 'interval: the xi domain [.03, 1] and the 12 xi intervals as printed (int:xi-grid)',
              r'.03\le\xi\le1' in wtx and '(30,50,75,100,150,200,300,400,500,650,800,900,1000)' in itx)
        cc = definition_crosscheck(Fraction(3, 4), Fraction(1, 2), Fraction(2, 5))
        check(checks, 'interval: closed forms for W, Y, That, What, Yhat agree with their definitions at (q, r, a) = (3/4, 1/2, 2/5)',
              all(cc.values()), str(cc))
        # P at the pure message and at the uniform message (P = delta xi^2 + U delta xi^3 there)
        pts = []
        for bi, band in enumerate(bands):
            for qq, rr in ((0, 0), (1, 1), (Fraction(1, 2), Fraction(1, 4))):
                for xx in (XI[0], XI[1]):
                    pts.append(P_point(qq, rr, band[1], xx, band).l > 0)
        check(checks, 'interval: P > 0 at the pure, uniform and one mixed message, both xi ends, each band top (point enclosures)', all(pts))
        BANDS[:] = bands
        res = {}
        if not all(pts):
            res = {bi: (False, 0, [None], 0.0) for bi in range(len(bands))}
        elif jobs > 1:
            from concurrent.futures import ProcessPoolExecutor
            with ProcessPoolExecutor(min(jobs, 3)) as ex:
                for bi, out in ex.map(_band_worker, [(bi, qmax, list(bands), XI) for bi in range(len(bands))]):
                    res[bi] = out
        else:
            for bi in range(len(bands)):
                res[bi] = certify_band(bi, qmax)
        for bi in range(len(bands)):
            okb, visited, open_boxes, sec = res[bi]
            check(checks, 'interval: band %d [%s, %s]: P > 0 on {0 <= r <= q <= %s} x band x [%s, %s] (all boxes accepted)'
                  % (bi, bands[bi][0], bands[bi][1], qmax, XI[0], XI[1]), okb,
                  '%d boxes, %s s, %d open' % (visited, sec, len(open_boxes)))
        value['interval'] = {'qmax': str(qmax), 'boxes': [res[b][1] for b in range(len(bands))],
                             'seconds': [res[b][3] for b in range(len(bands))]}
    ok = all(c['pass'] for c in checks)
    verdict = 'CERTIFIED' if ok else ('REFUTED' if any(not c['pass'] and ('stops at' in c['check'] or 'all >= 0' in c['check']
                                                                          or 'P > 0 at the pure' in c['check']) for c in checks) else 'REFUSED')
    scope = []
    if 'pair' in parts:
        scope.append('the pair coefficient certificate (14 polynomials)')
    if 'grid' in parts:
        scope.append('the grid certificate for case(s) %s' % ('all 28 (-1, 0..26)' if grid_cases == 'all' else grid_cases,))
    if 'interval' in parts:
        scope.append('the interval inequality P > 0 of Lemma wei:positive on the part q <= %s of its domain '
                     '(max(p_2, p_3)/p_1 <= (%s)^18), all three bands, all xi in [.03, 1]' % (qmax, qmax))
    value['seconds'] = round(time.time() - t0, 1)
    return {'verdict': verdict, 'checks': checks, 'sources': src.read, 'value': value,
            'decides': 'a finite component: ' + '; '.join(scope) + ' — not the analytic reductions'}


def forge():
    out = []
    # 1. pair: tighten the printed coarse bound 13/2 -> 6 (row 1 becomes 12Xz - 2d_n): must leave a negative coefficient
    rows = [dict(r) for r in PAIR_ROWS]
    rows[0]['Xz'] = 12
    classes, _, _ = pair_blocks()
    f = pair_polys(classes[0], rows[:1])[0]
    out.append(('pair row 1 with 12Xz in place of 13Xz (d_n <= 6Xz)', 'CERTIFIED' if pair_stats(f)['min'] >= 0 else 'REFUTED'))
    # 2. pair: drop the reflection term I from row 5 (6Xz-6W+y0B0+S-d_e)
    rows = [dict(r) for r in PAIR_ROWS]
    rows[4]['I'] = 0
    bad = [pair_stats(pair_polys(b, rows[4:5])[0])['min'] for b in classes]
    out.append(('pair row 5 without the reflection correction I', 'CERTIFIED' if min(bad) >= 0 else 'REFUTED'))
    # 3. interval: the xi domain extended down to 0 (the scalar bound xi > .03 dropped): P(0) = D0 < 0 at the pure message
    r = decide(parts=('interval',), xi=(Fraction(0), Fraction(1)), qmax=Fraction(1, 4))
    out.append(('interval with xi in [0, 1] instead of [3/100, 1]', r['verdict']))
    # 4. grid: a wrong printed stopping iteration for the regular case
    r = decide(parts=('grid',), grid_cases=(-1,), printed=(161, [0] * 27))
    out.append(('grid regular case printed as 161 instead of 162', r['verdict']))
    return out


if __name__ == '__main__':
    import json
    t = time.time()
    res = decide(jobs=int(os.environ.get('JOBS', '1')), log=sys.stderr)
    print(json.dumps(res, indent=1, default=str))
    print('runtime %.1f s' % (time.time() - t))
    print(forge())
