#!/usr/bin/env python3
"""verify_skyaudit.py — stdlib re-proof of SkyAudit certificates.
apps/skyaudit/audit · cert-machine · zero dependencies beyond the stdlib.

An INDEPENDENT reimplementation (different language, exact Fractions,
integer-sqrt bounds — no floating point in any decision) that re-derives
each sampled certificate row from the scenario packs and the row's
recorded input boxes, and checks:

  1. POWER-BOX SOUNDNESS — the recorded hover/cruise power boxes CONTAIN
     the exactly-recomputed intervals (the JS builder pads outward, so
     containment must hold; sqrt is bounded by integer isqrt, certified).
  2. VERDICT SOUNDNESS — CERTIFIED rows must have exact worst-margin >= 0
     and REFUTED rows exact best-margin < 0. (The JS instrument uses
     outward-rounded intervals, wider than exact — so its one-sided
     verdicts must survive exact recomputation. REFUSED asserts nothing.)

Reds run first: a flipped verdict and a tampered battery box must BOTH be
caught, or the checker refuses itself.  Exit 0 = every check passed."""
import json, gzip, os, sys
from fractions import Fraction as Q
from math import isqrt

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.path.dirname(HERE)
DAY = 'day-2026-08-26'

def load_json(p):
    with open(p) as f: return json.load(f)

def load_rows(city):
    p = os.path.join(APP, 'data', DAY, city + '.certs.jsonl')
    raw = open(p, 'rb').read() if os.path.exists(p) else gzip.open(p + '.gz', 'rb').read()
    return [json.loads(l) for l in raw.decode().splitlines() if l.strip()]

SPECS = {i: load_json(os.path.join(APP, 'scenario/specs', i + '.json'))
         for i in ('joby-s4', 'archer-midnight', 'beta-alia', 'eve-100')}
PHYS = load_json(os.path.join(APP, 'scenario/physics/kasliwal-2019.json'))
G = Q(9.80665)          # exact double, same value the JS builder used

def box(v):             # JSON floats -> exact binary rationals (what JS computed with)
    return (Q(v[0]), Q(v[1]))

def sqrt_lo(q):
    n, d = q.numerator, q.denominator; S = 10**12
    return Q(isqrt(n * d * S * S), d * S)

def sqrt_hi(q):
    n, d = q.numerator, q.denominator; S = 10**12
    return Q(isqrt(n * d * S * S) + 1, d * S)

def hover_exact(spec):
    m = box(spec['boxes']['m_kg']['v']); dl = box(spec['boxes']['delta_nm2']['v'])
    eh = box(PHYS['boxes']['eta_h']['v']); rho = box(PHYS['boxes']['rho']['v'])
    lo = m[0] * G / eh[1] * sqrt_lo(dl[0] / (2 * rho[1])) / 1000
    hi = m[1] * G / eh[0] * sqrt_hi(dl[1] / (2 * rho[0])) / 1000
    return lo, hi

def cruise_exact(spec):
    m = box(spec['boxes']['m_kg']['v']); v = box(spec['boxes']['v_cruise_kmh']['v'])
    ld = box(PHYS['boxes']['ld']['v']); ec = box(PHYS['boxes']['eta_c']['v'])
    lo = m[0] * G * (v[0] / Q(36, 10)) / (ld[1] * ec[1]) / 1000
    hi = m[1] * G * (v[1] / Q(36, 10)) / (ld[0] * ec[0]) / 1000
    return lo, hi

def margins(row, spec, rule):
    """exact (worst, best) terminal margins from the row's recorded boxes.
    Methodology v2: cruise energy is V-FREE — at every parameter point
    t*P(V) = m*g*D/((L/D)*eta_c), so the exact cruise energy is enclosed
    directly (the v1 product through independent t and P(V) boxes was a
    sound over-enclosure). The reserve leg keeps P(V): normal cruising
    speed is unpublished, so V is a genuine unknown there."""
    dist = box(row['dist_km'])
    m = box(spec['boxes']['m_kg']['v'])
    ld = box(PHYS['boxes']['ld']['v']); ec = box(PHYS['boxes']['eta_c']['v'])
    ph = box(row['p_hover_kw']); pc = box(row['p_cruise_kw'])
    th = box(PHYS['boxes']['hover_budget_s']['v'])
    eta = box(PHYS['boxes']['eta_batt']['v'])
    cap = box(spec['boxes']['battery_kwh']['v']); uf = box(PHYS['boxes']['usable_frac']['v'])
    usable = (cap[0] * uf[0], cap[1] * uf[1])
    H = Q(3600)
    ecr_w = m[1] * G * dist[1] / (H * ld[0] * ec[0])   # cruise kWh, worst corner
    ecr_b = m[0] * G * dist[0] / (H * ld[1] * ec[1])   # cruise kWh, best corner
    rt = box(rule['reserve']['t_s']); rp = ph if rule['reserve']['power'] == 'hover' else pc
    used_w = (ecr_w + th[1] / H * ph[1]) / eta[0]
    used_b = (ecr_b + th[0] / H * ph[0]) / eta[1]
    res_w = rt[1] / H * rp[1] / eta[0]
    res_b = rt[0] / H * rp[0] / eta[1]
    return usable[0] - used_w - res_w, usable[1] - used_b - res_b

RULES = {i: load_json(os.path.join(APP, 'scenario/rules', i + '.json'))
         for i in ('faa-sfar-vfr', 'easa-final-reserve')}

def check(row):
    """returns None if sound, else a defect string"""
    spec, rule = SPECS[row['spec']], RULES[row['rule']]
    hl, hh = hover_exact(spec); rl, rh = box(row['p_hover_kw'])
    if not (rl <= hl and hh <= rh): return 'hover box does not contain exact interval'
    cl, ch = cruise_exact(spec); ql, qh = box(row['p_cruise_kw'])
    if not (ql <= cl and ch <= qh): return 'cruise box does not contain exact interval'
    worst, best = margins(row, spec, rule)
    if row['verdict'] == 'CERTIFIED' and worst < 0: return 'CERTIFIED but exact worst margin %s < 0' % float(worst)
    if row['verdict'] == 'REFUTED' and best >= 0: return 'REFUTED but exact best margin %s >= 0' % float(best)
    return None

def main():
    rows = load_rows('nyc')
    # ---- reds: the checker must catch a forgery before it may pass anything
    forged = dict(next(r for r in rows if r['verdict'] == 'REFUTED')); forged['verdict'] = 'CERTIFIED'
    if check(forged) is None:
        print('RED FAILED: flipped verdict not caught'); return 1
    tampered = json.loads(json.dumps(next(r for r in rows if r['verdict'] == 'REFUTED')))
    tampered['p_hover_kw'] = [0.001, 0.002]      # forged tiny hover power outside the exact interval
    if check(tampered) is None:
        print('RED FAILED: tampered power box not caught'); return 1
    # ---- the sample: every REFUTED + every CERTIFIED + every 7th REFUSED (deterministic)
    sample = [r for r in rows if r['verdict'] != 'REFUSED']
    sample += [r for i, r in enumerate(rows) if r['verdict'] == 'REFUSED' and i % 7 == 0]
    bad = 0
    for r in sample:
        d = check(r)
        if d: print('DEFECT %s %s|%s: %s' % (r['id'], r['spec'], r['rule'], d)); bad += 1
    print('verify_skyaudit: %d rows re-proved exactly (%d certified, %d refuted, %d refused sampled), %d defects, 2 reds fired'
          % (len(sample), sum(r['verdict'] == 'CERTIFIED' for r in sample),
             sum(r['verdict'] == 'REFUTED' for r in sample),
             sum(r['verdict'] == 'REFUSED' for r in sample), bad))
    return 1 if bad else 0

if __name__ == '__main__':
    sys.exit(main())
