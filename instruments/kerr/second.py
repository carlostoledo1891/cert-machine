#!/usr/bin/env python3
"""second.py: the black hole's decided layer, a second time, with no code shared with kerr.js.

instruments/kerr · cert-machine · 2026-10-31 (Phase 0; notes/black-hole-phase0-preregistration-2026-10-31.md).

Python standard library only. Arithmetic: intervals of decimal.Decimal at 40 significant digits, every lower end
computed under ROUND_FLOOR and every upper end under ROUND_CEILING (the decimal module's own directed rounding: the
first decider simulates it on doubles by one-ulp widening). Square and cube roots are rounded by the module and then
CHECKED in exact fractions (s² ≤ x for a lower end, and stepped one unit until it holds). π comes from Machin's
formula in fractions with the alternating-series bound; cos and sin of an inclination from their Taylor series in
fractions with the same bound. The first decider uses the kernel's π (arctan series) and its interval cos/sin.

The curve is swept differently too: u = (r − 3)/a on [−2, 2] in 160 equal boxes, then every box that can still move
an end is split in three (the first decider splits in two), and the box's middle third's centre is tested as a
point. The spin band is a branch and bound over spin only, at the camera's 17°. The inclination band is NOT decided
here (the first decider alone carries it: a wide inclination box needs its √G bound and bracket witnesses, and this
decider's point witnesses would need thousands of boxes in Python); cos and sin of 17° come from monotone Taylor
enclosures on (0°, 90°).

    python3 -I instruments/kerr/second.py            prints one JSON object (the enclosures as decimal strings)
"""
import json
import sys
from decimal import Decimal, Context, ROUND_FLOOR, ROUND_CEILING
from fractions import Fraction as F

PREC = 40
DN = Context(prec=PREC, rounding=ROUND_FLOOR)
UP = Context(prec=PREC, rounding=ROUND_CEILING)


def fdec(q, ctx):
    """a Fraction rounded to a Decimal in the context's direction"""
    return ctx.divide(Decimal(q.numerator), Decimal(q.denominator))


class V:
    """a closed interval [lo, hi] of Decimals"""
    __slots__ = ('lo', 'hi')

    def __init__(self, lo, hi=None):
        if not isinstance(lo, Decimal):
            q = F(lo)
            lo, hi2 = fdec(q, DN), fdec(q, UP)
            hi = hi2 if hi is None else fdec(F(hi), UP)
        elif hi is None:
            hi = lo
        if lo > hi:
            raise ValueError('inverted interval')
        self.lo, self.hi = lo, hi

    def __add__(s, o):
        o = o if isinstance(o, V) else V(o)
        return V(DN.add(s.lo, o.lo), UP.add(s.hi, o.hi))

    __radd__ = __add__

    def __sub__(s, o):
        o = o if isinstance(o, V) else V(o)
        return V(DN.subtract(s.lo, o.hi), UP.subtract(s.hi, o.lo))

    def __rsub__(s, o):
        return V(o) - s

    def __neg__(s):
        return V(-s.hi, -s.lo)

    def __mul__(s, o):
        o = o if isinstance(o, V) else V(o)
        ps = [(x, y) for x in (s.lo, s.hi) for y in (o.lo, o.hi)]
        return V(min(DN.multiply(x, y) for x, y in ps), max(UP.multiply(x, y) for x, y in ps))

    __rmul__ = __mul__

    def __truediv__(s, o):
        o = o if isinstance(o, V) else V(o)
        if o.lo <= 0 <= o.hi:
            raise ZeroDivisionError('interval division by an interval holding 0')
        ps = [(x, y) for x in (s.lo, s.hi) for y in (o.lo, o.hi)]
        return V(min(DN.divide(x, y) for x, y in ps), max(UP.divide(x, y) for x, y in ps))

    def __rtruediv__(s, o):
        return V(o) / s

    def sq(s):
        if s.lo >= 0:
            return V(DN.multiply(s.lo, s.lo), UP.multiply(s.hi, s.hi))
        if s.hi <= 0:
            return V(DN.multiply(s.hi, s.hi), UP.multiply(s.lo, s.lo))
        m = max(-s.lo, s.hi)
        return V(Decimal(0), UP.multiply(m, m))

    def hull(s, o):
        return V(min(s.lo, o.lo), max(s.hi, o.hi))

    def strs(s):
        return [str(s.lo), str(s.hi)]


def root_dn(x, k):
    """a Decimal s with s^k <= x (x >= 0), checked in fractions"""
    if x <= 0:
        return Decimal(0)
    s = DN.sqrt(x) if k == 2 else DN.power(x, DN.divide(Decimal(1), Decimal(3)))
    while F(s) ** k > F(x):
        s = s.next_minus(DN)
    return s


def root_up(x, k):
    if x < 0:
        raise ValueError('root of a negative upper end')
    if x == 0:
        return Decimal(0)
    s = UP.sqrt(x) if k == 2 else UP.power(x, UP.divide(Decimal(1), Decimal(3)))
    while F(s) ** k < F(x):
        s = s.next_plus(UP)
    return s


def vsqrt(v):
    if v.hi < 0:
        raise ValueError('sqrt of a negative interval')
    return V(root_dn(max(v.lo, Decimal(0)), 2), root_up(v.hi, 2))


def vcbrt(v):
    return V(root_dn(max(v.lo, Decimal(0)), 3), root_up(v.hi, 3))


# ---------- π, cos, sin in fractions ----------

def arctan_inv(n, terms):
    """arctan(1/n) between two partial sums of the alternating series"""
    s, x2 = F(0), F(1, n * n)
    t = F(1, n)
    for k in range(terms):
        s += (t / (2 * k + 1)) * (-1 if k % 2 else 1)
        t *= x2
    nxt = t / (2 * terms + 1)
    return (s, s + nxt) if terms % 2 == 0 else (s - nxt, s)


def pi_frac():
    a = arctan_inv(5, 40)
    b = arctan_inv(239, 20)
    return 16 * a[0] - 4 * b[1], 16 * a[1] - 4 * b[0]


PI_LO, PI_HI = pi_frac()
PI = V(fdec(PI_LO, DN), fdec(PI_HI, UP))


def taylor(x, start, terms=40):
    """sum over k of (−1)^k x^(2k+start)/(2k+start)!, for 0 <= x < 1.6: an alternating series with decreasing
    terms, so the next term bounds the error and gives its sign"""
    s, t = F(0), F(1)
    for j in range(1, start + 1):
        t = t * x / j
    for k in range(terms):
        s += t if k % 2 == 0 else -t
        t = t * x * x / ((2 * k + start + 1) * (2 * k + start + 2))
    return (s, s + t) if terms % 2 == 0 else (s - t, s)


def cos_sin_deg(dlo, dhi):
    """cos and sin over the inclination box [dlo°, dhi°] inside (0°, 90°), as intervals: cos falls and sin rises"""
    xlo = (F(dlo) * PI_LO / 180, F(dlo) * PI_HI / 180)
    xhi = (F(dhi) * PI_LO / 180, F(dhi) * PI_HI / 180)
    c_lo = taylor(xhi[1], 0)[0]       # cos is decreasing in x: the lowest cos at the largest x
    c_hi = taylor(xlo[0], 0)[1]
    s_lo = taylor(xlo[0], 1)[0]
    s_hi = taylor(xhi[1], 1)[1]
    return V(fdec(c_lo, DN), fdec(c_hi, UP)), V(fdec(s_lo, DN), fdec(s_hi, UP))


# ---------- the curve ----------

class Incl:
    def __init__(self, dlo, dhi=None):
        dhi = dlo if dhi is None else dhi
        self.c, self.s = cos_sin_deg(dlo, dhi)
        self.c2 = self.c.sq()
        self.cot2 = self.c2 / self.s.sq()


def at(a, u, th):
    """(r u², β², α) over the box a × u × θo; a and u are intervals"""
    r = 3 + a * u
    rm1 = r - 1
    if rm1.lo <= 0:
        raise ValueError('r − 1 not proven positive')
    lam = -((r.sq() * u + a * (r + 1)) / rm1)
    eta = (r.sq() * r * (4 - r * u.sq())) / rm1.sq()
    b2 = eta + a.sq() * th.c2 - lam.sq() * th.cot2
    return r * u.sq(), b2, -(lam / th.s)


def extents(a, th, coarse=160, passes=9):
    alo, ahi_hint = -2, 2
    live = []
    for k in range(coarse):
        u = V(F(-2) + F(4 * k, coarse), F(-2) + F(4 * (k + 1), coarse))
        ru2, b2, al = at(a, u, th)
        if ru2.lo > 4 or b2.hi < 0:
            continue
        live.append(u)
    best = {'amaxlo': None, 'aminhi': None, 'b2lo': None}

    def test_point(q):
        ru2, b2, al = at(a, V(q, q), th)
        if ru2.hi <= 4 and b2.lo >= 0:
            if best['amaxlo'] is None or al.lo > best['amaxlo']:
                best['amaxlo'] = al.lo
            if best['aminhi'] is None or al.hi < best['aminhi']:
                best['aminhi'] = al.hi
            if best['b2lo'] is None or b2.lo > best['b2lo']:
                best['b2lo'] = b2.lo

    for u in live:
        test_point((F(u.lo) + F(u.hi)) / 2)
    boxes = [(F(u.lo), F(u.hi)) for u in live]
    for p in range(passes + 1):
        ev = []
        for (l, h) in boxes:
            ru2, b2, al = at(a, V(l, h), th)
            if ru2.lo > 4 or b2.hi < 0:
                continue
            ev.append(((l, h), b2, al))
        if p == passes or best['amaxlo'] is None:
            break
        nb = []
        for (l, h), b2, al in ev:
            if al.hi > best['amaxlo'] or al.lo < best['aminhi'] or b2.hi > best['b2lo']:
                w = (h - l) / 3
                test_point(l + w * F(3, 2))
                test_point(l + w)
                test_point(l + 2 * w)
                nb += [(l, l + w), (l + w, l + 2 * w), (l + 2 * w, h)]
            else:
                nb.append((l, h))
        boxes = nb
    if best['amaxlo'] is None:
        return None
    amaxhi = max(al.hi for _, _, al in ev)
    aminlo = min(al.lo for _, _, al in ev)
    b2hi = max(b2.hi for _, b2, _ in ev)
    W = V(DN.subtract(best['amaxlo'], best['aminhi']), UP.subtract(amaxhi, aminlo))
    H = V(Decimal(2)) * V(root_dn(max(best['b2lo'], Decimal(0)), 2), root_up(b2hi, 2))
    d = (W + H) / 2
    return {'W': W, 'H': H, 'd': d}


def band_spin(th, passes=3):
    """the spin band at one inclination over a ∈ [0, 499/500], on a FIXED grid of spin boxes that covers the range
    (no search: 1/1000 wide over [0, 1/50] and [97/100, 499/500], where the band's ends sit; 1/100 between). Every
    box is a true enclosure, so the hull is one; it is coarser than the first decider's branch and bound, and the
    agreement asked of the two is that their enclosures intersect."""
    cuts = [F(k, 1000) for k in range(0, 21)] + [F(k, 100) for k in range(3, 97)] + \
           [F(k, 1000) for k in range(970, 998)] + [F(499, 500)]
    cuts = sorted(set(cuts))
    if cuts[0] != 0 or cuts[-1] != F(499, 500):
        raise RuntimeError('band_spin: the grid does not cover [0, 499/500]')
    res = []
    for l, h in zip(cuts, cuts[1:]):
        stack = [(l, h)]
        while stack:
            lo_, hi_ = stack.pop()
            e = extents(V(lo_, hi_), th, passes=passes)
            if e is None:                      # no point proven on the curve for the whole box: halve it
                m = (lo_ + hi_) / 2
                stack += [(lo_, m), (m, hi_)]
            else:
                res.append(e)
    out = {'boxes': len(res)}
    for k in ('W', 'H', 'd'):
        out[k] = {'min': [str(min(e[k].lo for e in res)), str(min(e[k].hi for e in res))],
                  'max': [str(max(e[k].lo for e in res)), str(max(e[k].hi for e in res))]}
    return out


# ---------- exact pieces ----------

def cubic_roots(a, bits=50):
    """roots of r(r − 3)² = 4a² in [1, 3] and [3, 4], a a Fraction in (0, 1), by bisection on fractions"""
    f = lambda r: r * (r - 3) ** 2 - 4 * a * a
    out = []
    for lo, hi in ((F(1), F(3)), (F(3), F(4))):
        sl = f(lo) > 0
        assert (f(hi) > 0) != sl
        while hi - lo > F(1, 2 ** bits):
            m = (lo + hi) / 2
            if f(m) == 0:
                lo = hi = m
                break
            if (f(m) > 0) == sl:
                lo = m
            else:
                hi = m
        out.append((lo, hi))
    return out


C = 299792458
GM_SUN = F(13271244) * 10 ** 13
AU = 149597870700
GM_C2 = GM_SUN / (C * C)


def theta_g(m, d):
    return GM_C2 * m / (d * AU)


def isco(a, pro=True):
    av = V(a) if not isinstance(a, V) else a
    z1 = 1 + vcbrt(1 - av.sq()) * (vcbrt(1 + av) + vcbrt(1 - av))
    z2 = vsqrt(3 * av.sq() + z1.sq())
    p = (3 - z1) * (3 + z1 + 2 * z2)
    p = V(max(p.lo, Decimal(0)), p.hi)            # (3 − Z1) ≥ 0 on [0, 1) (Bardeen, Press & Teukolsky)
    rt = vsqrt(p)
    return 3 + z2 - rt if pro else 3 + z2 + rt


def period_tg(r, a, pro=True):
    r32 = r * vsqrt(r)
    return 2 * PI * (r32 + a if pro else r32 - a)


def main():
    text = '' if sys.stdin.isatty() else sys.stdin.read()
    inp = json.loads(text) if text.strip() else {}
    out = {'decider': 'instruments/kerr/second.py (decimal, ROUND_FLOOR / ROUND_CEILING, 40 digits)'}
    s27 = vsqrt(V(27))
    out['sqrt27'] = s27.strs()
    out['schwarzschild'] = {'f3': str(F(27) - 27 * (3 - 2)), 'fp3': str(F(27) - 27)}
    out['roots'] = {}
    for a in inp.get('rootSpins', ['1/2', '47/50', '499/500']):
        (l1, h1), (l2, h2) = cubic_roots(F(a))
        out['roots'][a] = {'rMinus': [str(V(l1).lo), str(V(h1).hi)], 'rPlus': [str(V(l2).lo), str(V(h2).hi)]}
    th17 = Incl(17)
    out['cos17'] = th17.c.strs()
    out['sin17'] = th17.s.strs()
    out['spins'] = {}
    for a in inp.get('spins', ['0', '1/2', '47/50', '99/100', '499/500']):
        e = extents(V(F(a)), th17)
        out['spins'][a] = {k: e[k].strs() for k in ('W', 'H', 'd')}
    out['band17'] = band_spin(th17)
    out['thetaG'] = {}
    for row in inp.get('rows', []):
        if 'thetaG' in row:
            out['thetaG'][row['id']] = [str(V(F(row['thetaG'][0])).lo), str(V(F(row['thetaG'][1])).hi)]
        else:
            lo_ = theta_g(F(row['mass'][0]), F(row['distanceMpc']))
            hi_ = theta_g(F(row['mass'][1]), F(row['distanceMpc']))
            out['thetaG'][row['id']] = [str(fdec(lo_, DN)), str(fdec(hi_, UP))]
    out['tg_per_msun_s'] = [str(fdec(GM_C2 / C, DN)), str(fdec(GM_C2 / C, UP))]
    out['isco'] = {}
    for a, pro in inp.get('isco', [['0', True], ['1/2', True], ['47/50', True], ['499/500', True], ['499/500', False]]):
        r = isco(F(a), pro)
        out['isco'][a + (' pro' if pro else ' retro')] = {'r': r.strs(), 'Ptg': period_tg(r, V(F(a)), pro).strs()}
    print(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
