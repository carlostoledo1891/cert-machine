#!/usr/bin/env python3
"""decide2.py - decider 2 of the physics answer key, v0.

Written clean-room from corpus/physics-key/RULES.md and the file format alone:
no sight of decider 1, no other decider read. Python 3.9+, standard library
only. No float takes part in any decision: every binary64 number is turned
into the exact rational its bit pattern denotes (fractions.Fraction) and every
comparison is a comparison of rationals. The one transcendental (the cosine of
P-ENERGY) is enclosed between two rationals by the Taylor polynomial and its
Lagrange remainder (RULES section 7).

    python3 decide2.py <path/to/runs.json> [--out <file>] [--only <run-id>]

The trajectory of run <id> is <id>.f64.gz beside runs.json.

Amended for RULES amendment 2, section A2.2 (given RULES.md and this file,
nothing else): a manifest entry may carry "layout": "world" (quaternion scalar
last, angular velocity in the world frame, for `fall` and `top`); any other
value of `layout` makes the run malformed; an entry with no `layout` is read
exactly as before.
"""

import argparse
import gzip
import hashlib
import json
import os
import struct
import sys
from fractions import Fraction

# ----------------------------------------------------------------------------
# constants of RULES.md
# ----------------------------------------------------------------------------

TOL = {
    "1e-2": Fraction(1, 10 ** 2),
    "1e-3": Fraction(1, 10 ** 3),
    "1e-4": Fraction(1, 10 ** 4),
    "1e-6": Fraction(1, 10 ** 6),
    "1e-9": Fraction(1, 10 ** 9),
    "1e-12": Fraction(1, 10 ** 12),
    "0": Fraction(0),
}

FALL_TOLS = ("1e-2", "1e-3", "1e-6", "1e-9", "1e-12", "0")
OTHER_TOLS = ("1e-2", "1e-4", "1e-6", "1e-9", "1e-12", "0")

SCENES = {
    "fall": {"laws": ("F-POS", "F-VEL"), "tols": FALL_TOLS,
             "nq": 7, "nv": 6, "params": ("G",)},
    "pendulum": {"laws": ("P-ENERGY",), "tols": OTHER_TOLS,
                 "nq": 1, "nv": 1, "params": ("M", "L", "IYY", "G")},
    "top": {"laws": ("T-ENERGY", "T-LMAG", "T-LVEC", "T-MONO"), "tols": OTHER_TOLS,
            "nq": 7, "nv": 6, "params": ("I1", "I2", "I3")},
}

# precision ladder of section 7: remainder at most 10^-40, 10^-80, 10^-160
LEVELS = (40, 80, 160)

# Above this |x| the Taylor polynomial is not attempted (its degree grows like
# e*|x|); the enclosure falls back to the rigorous but coarse [-1, 1]. See the
# report: this is a resource guard, not a rule of RULES.md.
COS_GUARD = 256

MASK63 = (1 << 63) - 1
MASK52 = (1 << 52) - 1
HEX = frozenset("0123456789abcdef")


# ----------------------------------------------------------------------------
# binary64 -> exact rational
# ----------------------------------------------------------------------------

def bits_finite(b):
    return ((b >> 52) & 0x7FF) != 0x7FF


def bits_to_fraction(b):
    """The exact rational a binary64 bit pattern denotes; None for inf / NaN."""
    exp = (b >> 52) & 0x7FF
    man = b & MASK52
    if exp == 0x7FF:
        return None
    if exp == 0:                      # zero (either sign) or subnormal
        m = man
        sh = -1074
    else:
        m = man | (1 << 52)
        sh = exp - 1075
    if b >> 63:
        m = -m
    if sh >= 0:
        return Fraction(m << sh)
    return Fraction(m, 1 << (-sh))


def parse_bits(s):
    """16 lowercase hex digits -> int, else None."""
    if not isinstance(s, str) or len(s) != 16:
        return None
    for ch in s:
        if ch not in HEX:
            return None
    return int(s, 16)


# ----------------------------------------------------------------------------
# the print format of section 6: 12 significant digits, rounded outward
# ----------------------------------------------------------------------------

def _ge_pow10(p, q, e):
    """p/q >= 10^e, for positive integers p, q."""
    if e >= 0:
        return p >= q * 10 ** e
    return p * 10 ** (-e) >= q


def _mag_string(digits, e):
    s = str(digits)                   # exactly twelve digits
    return s[0] + "." + s[1:] + "e" + str(e)


def fmt(v):
    """(lo, hi) decimal strings with lo <= v <= hi."""
    if v == 0:
        return ("0", "0")
    neg = v < 0
    p = -v.numerator if neg else v.numerator
    q = v.denominator
    # integer estimate of floor(log10(p/q)), then exact adjustment
    e = ((p.bit_length() - q.bit_length()) * 30103) // 100000
    while not _ge_pow10(p, q, e):
        e -= 1
    while _ge_pow10(p, q, e + 1):
        e += 1
    k = 11 - e
    if k >= 0:
        num = p * 10 ** k
        den = q
    else:
        num = p
        den = q * 10 ** (-k)
    lower = num // den
    upper = -((-num) // den)
    le = e
    ue = e
    if upper == 10 ** 12:
        upper = 10 ** 11
        ue = e + 1
    lo_mag = _mag_string(lower, le)
    hi_mag = _mag_string(upper, ue)
    if neg:
        return ("-" + hi_mag, "-" + lo_mag)
    return (lo_mag, hi_mag)


def fmt_exact(v):
    lo, hi = fmt(v)
    return {"lo": lo, "hi": hi}


# ----------------------------------------------------------------------------
# the cosine of section 7
# ----------------------------------------------------------------------------

ONE = Fraction(1)
MINUS_ONE = Fraction(-1)


def cos_enclosure(x, digits):
    """Rationals (lo, hi) with lo <= cos x <= hi and, for |x| <= COS_GUARD,
    half-width at most 10^-digits: the Taylor polynomial of degree 2N with the
    smallest N whose Lagrange remainder x^(2N+2)/(2N+2)! is <= 10^-digits."""
    if x == 0:
        return (ONE, ONE)
    ax = -x if x < 0 else x
    if ax > COS_GUARD:
        return (MINUS_ONE, ONE)
    xx = x * x
    a = xx.numerator
    b = xx.denominator
    bound = 10 ** digits
    n = 0
    num = a                            # a^(n+1)
    den = b * 2                        # b^(n+1) * (2n+2)!
    while num * bound > den:
        n += 1
        num *= a
        den *= b * (2 * n + 1) * (2 * n + 2)
    rem = Fraction(num, den)
    # Horner: V_N = 1, V_j = 1 - (a / (b (2j+1)(2j+2))) V_{j+1}, S_N = V_0
    pp = 1
    qq = 1
    for j in range(n - 1, -1, -1):
        nq = qq * b * ((2 * j + 1) * (2 * j + 2))
        pp = nq - a * pp
        qq = nq
    s = Fraction(pp, qq)
    lo = s - rem
    hi = s + rem
    if lo < MINUS_ONE:
        lo = MINUS_ONE
    if hi > ONE:
        hi = ONE
    return (lo, hi)


# ----------------------------------------------------------------------------
# result shapes
# ----------------------------------------------------------------------------

def blank_laws(sd):
    out = {}
    for law in sd["laws"]:
        out[law] = {
            "tolerances": dict((t, {"verdict": "REFUSED", "firstStep": None})
                               for t in sd["tols"]),
            "max": None,
            "last": None,
        }
    return out


def malformed(sd):
    return {"status": "malformed", "nonFiniteStep": None,
            "laws": blank_laws(sd) if sd is not None else {}}


class RationalLaw(object):
    """A law whose deviation is a rational at every step. one_sided (T-MONO of
    Amendment 1): `max` ranks max(deviation, 0) instead of |deviation|."""

    def __init__(self, tol_keys, thresholds, one_sided=False):
        self.one_sided = one_sided
        self.tol_keys = tol_keys
        self.pending = list(zip(tol_keys, thresholds))
        self.viol = {}
        self.max_abs = None
        self.max_step = None
        self.last = None

    def step(self, k, lhs, dev):
        """lhs <= threshold is the law's inequality; dev its signed deviation."""
        if self.pending:
            hit = False
            for key, thr in self.pending:
                if lhs > thr:
                    self.viol[key] = k
                    hit = True
            if hit:
                self.pending = [kt for kt in self.pending if kt[0] not in self.viol]
        if dev < 0:
            a = Fraction(0) if self.one_sided else -dev
        else:
            a = dev
        if self.max_abs is None or a > self.max_abs:
            self.max_abs = a
            self.max_step = k
        self.last = dev

    def result(self, complete):
        tols = {}
        for key in self.tol_keys:
            if key in self.viol:
                tols[key] = {"verdict": "REFUTED", "firstStep": self.viol[key]}
            elif complete:
                tols[key] = {"verdict": "CERTIFIED", "firstStep": None}
            else:
                tols[key] = {"verdict": "REFUSED", "firstStep": None}
        if self.max_abs is None:
            mx = None
        else:
            lo, hi = fmt(self.max_abs)
            mx = {"step": self.max_step, "lo": lo, "hi": hi}
        last = fmt_exact(self.last) if (complete and self.last is not None) else None
        return {"tolerances": tols, "max": mx, "last": last}


def row_nonfinite(vals, start, width):
    for i in range(start, start + width):
        if ((vals[i] >> 52) & 0x7FF) == 0x7FF:
            return True
    return False


# ----------------------------------------------------------------------------
# fall
# ----------------------------------------------------------------------------

def decide_fall(vals, nsteps, width, params):
    sd = SCENES["fall"]
    g = params["G"]
    tols = sd["tols"]
    thr = [TOL[t] for t in tols]
    pos = RationalLaw(tols, thr)
    vel = RationalLaw(tols, thr)
    half_g = g / 2
    nf = None
    t0 = z0 = vz0 = None
    for k in range(nsteps + 1):
        s = k * width
        if row_nonfinite(vals, s, width):
            nf = k
            break
        t = bits_to_fraction(vals[s])
        z = bits_to_fraction(vals[s + 3])          # qpos[2]
        vz = bits_to_fraction(vals[s + 10])        # qvel[2]
        if k == 0:
            t0, z0, vz0 = t, z, vz
        dt = t - t0
        dpos = z - (z0 - half_g * dt * dt)
        dvel = vz - (vz0 - g * dt)
        pos.step(k, -dpos if dpos < 0 else dpos, dpos)
        vel.step(k, -dvel if dvel < 0 else dvel, dvel)
    complete = nf is None
    return {"status": "ok" if complete else "nonfinite",
            "nonFiniteStep": nf,
            "laws": {"F-POS": pos.result(complete), "F-VEL": vel.result(complete)}}


# ----------------------------------------------------------------------------
# top
# ----------------------------------------------------------------------------

def top_quantities(vals, s, i1, i2, i3, world=False):
    """T, Lambda and the world-frame angular momentum of one row.

    world=False: section 4. qpos[3..6] = (qw, qx, qy, qz), scalar first, and
    qvel[3..5] is the angular velocity in the body frame.
    world=True: amendment 2, A2.2 ("layout": "world"). qpos[3..6] =
    (qx, qy, qz, qw), scalar last, and qvel[3..5] is the angular velocity in
    the world frame; the body-frame one is R(q)^T (wx, wy, wz). Everything
    after that reads as section 5 does."""
    if world:
        x = bits_to_fraction(vals[s + 4])
        y = bits_to_fraction(vals[s + 5])
        z = bits_to_fraction(vals[s + 6])
        w = bits_to_fraction(vals[s + 7])
    else:
        w = bits_to_fraction(vals[s + 4])
        x = bits_to_fraction(vals[s + 5])
        y = bits_to_fraction(vals[s + 6])
        z = bits_to_fraction(vals[s + 7])
    o1 = bits_to_fraction(vals[s + 11])            # qvel[3]
    o2 = bits_to_fraction(vals[s + 12])            # qvel[4]
    o3 = bits_to_fraction(vals[s + 13])            # qvel[5]
    ww = w * w
    xx = x * x
    yy = y * y
    zz = z * z
    n = ww + xx + yy + zz
    xy = x * y
    wz = w * z
    xz = x * z
    wy = w * y
    yz = y * z
    wx = w * x
    if world:
        # omega = R(q)^T (wx, wy, wz): the columns of R(q), each over n
        u1, u2, u3 = o1, o2, o3
        o1 = ((ww + xx - yy - zz) * u1 + 2 * (xy + wz) * u2 + 2 * (xz - wy) * u3) / n
        o2 = (2 * (xy - wz) * u1 + (ww - xx + yy - zz) * u2 + 2 * (yz + wx) * u3) / n
        o3 = (2 * (xz + wy) * u1 + 2 * (yz - wx) * u2 + (ww - xx - yy + zz) * u3) / n
    p1 = i1 * o1
    p2 = i2 * o2
    p3 = i3 * o3
    t = (p1 * o1 + p2 * o2 + p3 * o3) / 2
    lam = p1 * p1 + p2 * p2 + p3 * p3
    l1 = ((ww + xx - yy - zz) * p1 + 2 * (xy - wz) * p2 + 2 * (xz + wy) * p3) / n
    l2 = (2 * (xy + wz) * p1 + (ww - xx + yy - zz) * p2 + 2 * (yz - wx) * p3) / n
    l3 = (2 * (xz - wy) * p1 + 2 * (yz + wx) * p2 + (ww - xx - yy + zz) * p3) / n
    return t, lam, l1, l2, l3


def decide_top(vals, nsteps, width, params, world=False):
    sd = SCENES["top"]
    i1 = params["I1"]
    i2 = params["I2"]
    i3 = params["I3"]
    tols = sd["tols"]
    nf = None
    energy = lmag = lvec = mono = None
    t0 = lam0 = a1 = a2 = a3 = None
    t_prev = None
    for k in range(nsteps + 1):
        s = k * width
        if row_nonfinite(vals, s, width):
            nf = k
            break
        # the four quaternion entries are qpos[3..6] in both layouts (A2.2)
        if ((vals[s + 4] | vals[s + 5] | vals[s + 6] | vals[s + 7]) & MASK63) == 0:
            nf = k                                 # quaternion all zeros
            break
        t, lam, l1, l2, l3 = top_quantities(vals, s, i1, i2, i3, world)
        if k == 0:
            if t == 0 or lam == 0:
                return malformed(sd)
            t0, lam0, a1, a2, a3 = t, lam, l1, l2, l3
            energy = RationalLaw(tols, [TOL[x] * t0 for x in tols])
            lmag = RationalLaw(tols, [TOL[x] * lam0 for x in tols])
            lvec = RationalLaw(tols, [TOL[x] * TOL[x] * lam0 for x in tols])
            mono = RationalLaw(tols, [TOL[x] for x in tols], one_sided=True)
            t_prev = t0
        dt = t - t0
        energy.step(k, -dt if dt < 0 else dt, dt / t0)
        dl = lam - lam0
        lmag.step(k, -dl if dl < 0 else dl, dl / lam0)
        d1 = l1 - a1
        d2 = l2 - a2
        d3 = l3 - a3
        sq = d1 * d1 + d2 * d2 + d3 * d3
        lvec.step(k, sq, sq / lam0)
        # Amendment 1, T-MONO: R_k = (T_k - T_{k-1}) / T_0 <= eps; R_0 is 0
        rise = (t - t_prev) / t0
        mono.step(k, rise, rise)
        t_prev = t
    complete = nf is None
    if energy is None:                             # non-finite at step 0
        out = {"status": "nonfinite", "nonFiniteStep": 0, "laws": blank_laws(sd)}
        return out
    return {"status": "ok" if complete else "nonfinite",
            "nonFiniteStep": nf,
            "laws": {"T-ENERGY": energy.result(complete),
                     "T-LMAG": lmag.result(complete),
                     "T-LVEC": lvec.result(complete),
                     "T-MONO": mono.result(complete)}}


# ----------------------------------------------------------------------------
# pendulum
# ----------------------------------------------------------------------------

class PEntry(object):
    """One distinct (|theta|, theta'^2): D lies in [a, b]; exact means a = b."""
    __slots__ = ("step", "x", "r", "exact", "lvl", "a", "b")


class Pendulum(object):

    def __init__(self, coef, theta0, v0sq):
        self.coef = coef                           # J / (2 M G L)
        self.theta0 = theta0
        self.v0sq = v0sq
        self.cos0 = {}

    def cos_theta0(self, lvl):
        c = self.cos0.get(lvl)
        if c is None:
            c = cos_enclosure(self.theta0, LEVELS[lvl])
            self.cos0[lvl] = c
        return c

    def new_entry(self, k, theta, v, exact):
        e = PEntry()
        e.step = k
        e.x = theta
        e.r = self.coef * (v * v - self.v0sq)
        e.exact = exact
        if exact:
            e.lvl = len(LEVELS) - 1
            e.a = e.r
            e.b = e.r
        else:
            e.lvl = -1
            e.a = None
            e.b = None
            self.tighten(e)
        return e

    def tighten(self, e):
        """Next rung of the ladder; False if there is none."""
        if e.exact or e.lvl >= len(LEVELS) - 1:
            return False
        e.lvl += 1
        lo_k, hi_k = cos_enclosure(e.x, LEVELS[e.lvl])
        lo_0, hi_0 = self.cos_theta0(e.lvl)
        na = e.r - (hi_k - lo_0)
        nb = e.r - (lo_k - hi_0)
        if e.a is None or na > e.a:
            e.a = na
        if e.b is None or nb < e.b:
            e.b = nb
        return True


def abs_enclosure(e):
    a = e.a
    b = e.b
    if a >= 0:
        return (a, b)
    if b <= 0:
        return (-b, -a)
    na = -a
    return (Fraction(0), na if na > b else b)


def decide_pendulum(vals, nsteps, width, params):
    sd = SCENES["pendulum"]
    m = params["M"]
    ln = params["L"]
    iyy = params["IYY"]
    g = params["G"]
    mgl = m * g * ln
    if mgl == 0:
        return malformed(sd)
    coef = (iyy + m * ln * ln) / (2 * mgl)
    tols = sd["tols"]
    pending = list(tols)
    viol = {}
    undecided = set()
    seen = {}
    order = []
    nf = None
    pen = None
    theta0_key = None
    last_entry = None
    for k in range(nsteps + 1):
        s = k * width
        if row_nonfinite(vals, s, width):
            nf = k
            break
        tb = vals[s + 1]
        vb = vals[s + 2]
        if k == 0:
            theta0 = bits_to_fraction(tb)
            v0 = bits_to_fraction(vb)
            pen = Pendulum(coef, theta0, v0 * v0)
            theta0_key = tb & MASK63
        key = (tb & MASK63, vb & MASK63)
        e = seen.get(key)
        if e is not None:
            # same |theta| and same theta'^2 as an earlier step: the same D,
            # already judged there
            last_entry = e
            continue
        exact = (tb & MASK63) == theta0_key
        e = pen.new_entry(k, bits_to_fraction(tb), bits_to_fraction(vb), exact)
        seen[key] = e
        order.append(e)
        last_entry = e
        if not pending:
            continue
        hit = False
        for t in pending:
            eps = TOL[t]
            if exact:
                r = e.r
                if (-r if r < 0 else r) > eps:
                    viol[t] = k
                    hit = True
                continue
            if eps == 0:
                # |theta_k| != |theta_0|: D_k is irrational, so not 0 (sec. 7)
                viol[t] = k
                hit = True
                continue
            neps = -eps
            while True:
                if e.a >= neps and e.b <= eps:
                    break
                if e.a > eps or e.b < neps:
                    viol[t] = k
                    hit = True
                    break
                if not pen.tighten(e):
                    undecided.add(t)
                    break
        if hit:
            pending = [t for t in pending if t not in viol]

    complete = nf is None
    tol_out = {}
    for t in tols:
        if t in viol:
            tol_out[t] = {"verdict": "REFUTED", "firstStep": viol[t]}
        elif complete and t not in undecided:
            tol_out[t] = {"verdict": "CERTIFIED", "firstStep": None}
        else:
            tol_out[t] = {"verdict": "REFUSED", "firstStep": None}

    # max: one distinct (|theta|, theta'^2) strictly largest, else REFUSED
    mx = None
    if order:
        cands = order
        leader = None
        for lvl in range(len(LEVELS)):
            encs = []
            for e in cands:
                while e.lvl < lvl:
                    if not pen.tighten(e):
                        break
                encs.append(abs_enclosure(e))
            best = encs[0][0]
            for lo, _hi in encs:
                if lo > best:
                    best = lo
            cands = [cands[i] for i in range(len(cands)) if encs[i][1] >= best]
            if len(cands) == 1:
                leader = cands[0]
                break
        if leader is None:
            mx = "REFUSED"
        else:
            while True:
                lo, hi = abs_enclosure(leader)
                f_lo = fmt(lo)
                f_hi = fmt(hi)
                if f_lo == f_hi:
                    mx = {"step": leader.step, "lo": f_lo[0], "hi": f_lo[1]}
                    break
                if not pen.tighten(leader):
                    mx = "REFUSED"
                    break

    last = None
    if complete and last_entry is not None:
        e = last_entry
        while True:
            f_lo = fmt(e.a)
            f_hi = fmt(e.b)
            if f_lo == f_hi:
                last = {"lo": f_lo[0], "hi": f_lo[1]}
                break
            if not pen.tighten(e):
                last = "REFUSED"
                break

    return {"status": "ok" if complete else "nonfinite",
            "nonFiniteStep": nf,
            "laws": {"P-ENERGY": {"tolerances": tol_out, "max": mx, "last": last}}}


# ----------------------------------------------------------------------------
# one run
# ----------------------------------------------------------------------------

def is_count(v):
    return isinstance(v, int) and not isinstance(v, bool) and v >= 0


def read_run_bytes(path, expected):
    """The uncompressed bytes (at most expected + 1 of them), or None."""
    try:
        with gzip.open(path, "rb") as f:
            return f.read(expected + 1)
    except Exception:
        return None


def decide_entry(entry, base_dir):
    scene = entry.get("scene")
    if not isinstance(scene, str) or scene not in SCENES:
        return malformed(None)
    sd = SCENES[scene]
    # Amendment 2, A2.2: an entry with no `layout` is read as section 4 says;
    # "world" is the one value there is; any other value is a malformed run.
    world = False
    if "layout" in entry:
        layout = entry["layout"]
        if not isinstance(layout, str) or layout != "world":
            return malformed(sd)
        world = True
    run_id = entry.get("id")
    nsteps = entry.get("steps")
    nq = entry.get("nq")
    nv = entry.get("nv")
    sha = entry.get("sha256")
    if not (is_count(nsteps) and is_count(nq) and is_count(nv) and isinstance(sha, str)):
        return malformed(sd)
    if not isinstance(run_id, str) or run_id == "" or os.path.basename(run_id) != run_id:
        return malformed(sd)
    width = 1 + nq + nv
    expected = 8 * (nsteps + 1) * width
    data = read_run_bytes(os.path.join(base_dir, run_id + ".f64.gz"), expected)
    if data is None or len(data) != expected:
        return malformed(sd)
    if hashlib.sha256(data).hexdigest() != sha:
        return malformed(sd)
    # the scene's layout of section 4
    if nq != sd["nq"] or nv != sd["nv"]:
        return malformed(sd)
    raw = entry.get("params")
    if not isinstance(raw, dict):
        return malformed(sd)
    params = {}
    for name in sd["params"]:
        b = parse_bits(raw.get(name))
        if b is None or not bits_finite(b):
            return malformed(sd)
        params[name] = bits_to_fraction(b)
    count = (nsteps + 1) * width
    vals = struct.unpack("<%dQ" % count, data)
    if scene == "fall":
        # z = qpos[2] and vz = qvel[2] in both layouts (A2.2)
        return decide_fall(vals, nsteps, width, params)
    if scene == "pendulum":
        # A2.2 defines the world layout for `fall` and `top` only
        return decide_pendulum(vals, nsteps, width, params)
    return decide_top(vals, nsteps, width, params, world)


def main(argv=None):
    ap = argparse.ArgumentParser(description="physics answer key, decider 2 (exact)")
    ap.add_argument("manifest", help="path to runs.json")
    ap.add_argument("--out", default=None, help="write the JSON here instead of stdout")
    ap.add_argument("--only", default=None, help="decide only this run id")
    args = ap.parse_args(argv)

    try:
        with open(args.manifest, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as exc:
        sys.stderr.write("decide2: cannot read the manifest: %s\n" % (exc,))
        return 2
    if (not isinstance(manifest, dict) or manifest.get("format") != 1
            or isinstance(manifest.get("format"), bool)
            or not isinstance(manifest.get("runs"), list)):
        sys.stderr.write("decide2: the manifest is not {\"format\": 1, \"runs\": [...]}\n")
        return 2
    base_dir = os.path.dirname(os.path.abspath(args.manifest))

    runs = {}
    for entry in manifest["runs"]:
        if not isinstance(entry, dict) or not isinstance(entry.get("id"), str):
            sys.stderr.write("decide2: a manifest entry has no string id\n")
            return 2
        run_id = entry["id"]
        if args.only is not None and run_id != args.only:
            continue
        if run_id in runs:
            sys.stderr.write("decide2: duplicate run id %s\n" % (run_id,))
            return 2
        runs[run_id] = decide_entry(entry, base_dir)
    if args.only is not None and args.only not in runs:
        sys.stderr.write("decide2: no run with id %s\n" % (args.only,))
        return 2

    text = json.dumps({"runs": runs}, sort_keys=True, indent=1) + "\n"
    if args.out is not None:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(text)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
