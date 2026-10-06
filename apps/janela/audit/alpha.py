"""alpha.py — DNV's alpha factor, re-derived for a site from public pairs.

apps/janela/audit · cert-machine

    python alpha.py            reads corpus/janela/matchups.json.gz, writes certs/janela-alpha.json
    python alpha.py --check    the calibration only: the JIP method must reproduce DNV Table 4-1

THE STANDARD. DNV-OS-H101 (2011) Sec.4: an operation planned on a forecast may
start only if the forecast stays below OPWF = alpha * OPLIM. B704: "The
expected uncertainty in the weather forecast should be calculated based on
statistical data for the actual site and the operation schedule, i.e. TPOP."
B705: the tables (4-1 .. 4-5) are for the North Sea and Norwegian Sea and are
"a guideline for other offshore areas".

THE METHOD (J). The tables were made by the 2005–07 DNV joint industry project
(report 2006-1756, not public), as reconstructed by Wilcken (2012, University
of Stavanger MSc thesis, §4.1, hdl.handle.net/11250/182992), which worked from
the project's own spreadsheet; Wu & Gao (2021, Mar. Struct. 79:103050) restate
it. For design Hs h and planned operation time T:
  1. e = forecast - observed, binned by observed Hs (1 m groups) and lead;
     bias b and standard deviation s per (group, lead);
  2. only half of a positive bias is used: b' = b/2 if b > 0 else b;
  3. n = T / Tp waves, Tp = Tz / 0.7777 (JONSWAP, gamma 3.3), Tz the middle of
     the DNV range 8.9 sqrt(Hs/g) .. 13 s;
  4. the largest of n Rayleigh waves: P(Hmax > x | Hs) = 1 - (1 - exp(-2x^2/Hs^2))^n;
  5. Hmax: P(Hmax > Hmax | h + b') = 1e-4;   Hmax_WF: the same tail averaged over
     the true Hs ~ Normal(h, s) equals 1e-4;
  6. alpha = Hmax / Hmax_WF.
The 1e-4 sits on the largest individual wave (Rayleigh physics), not on Hs.
CALIBRATION: with the project's published error statistics (Wilcken Table 10)
this module must reproduce DNV Table 4-1 within +-0.02 in at least 16 of 20
cells (the 4-6 m rows at 72 h come out lower than the table — the table is
LESS conservative there; that is a finding of the reconstruction, not a bug).

WHAT IS AND IS NOT CLAIMED. alpha here is a STATISTICAL estimate with a
bootstrap interval (days resampled, 90%), computed in floating point with the
Python standard library only (bisection, composite Simpson) — never a
certified enclosure, never blurred with one. The satellite's own measurement
error and the 100 km collocation inflate s, which lowers alpha: the site value
leans conservative. The Gaussian error model is extrapolated to roughly its
1-in-1,000 tail; three years of matchups cannot observe 1e-4. What IS exact
here are the counts: how often the satellite saw Hs above OPLIM when the
forecast was at or below the table's alpha * OPLIM.

MIT licensed. Part of cert-machine.
"""
import gzip
import json
import math
import os
import random
import sys
from collections import defaultdict
from fractions import Fraction


HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..'))
P = 1e-4
TPOPS = [12, 24, 36, 48, 72]
DESIGN = [1, 2, 4, 6]

# DNV-OS-H101 (Oct 2011) Sec.4 Tables 4-1 .. 4-3 — ONE definition: apps/janela/scenario/rules/dnv-alpha.json
_DNVJ = json.load(open(os.path.join(HERE, '..', 'scenario', 'rules', 'dnv-alpha.json')))
assert _DNVJ['waveColumns'] == DESIGN
DNV = {k: {h: [_DNVJ['waveTables'][k]['rows'][str(T)][c] for T in TPOPS] for c, h in enumerate(DESIGN)} for k in ('4-1', '4-2', '4-3')}
DNV_NAMES = {k: _DNVJ['waveTables'][k]['name'] for k in DNV}

# Wilcken (2012) Table 10: the JIP's trend-line bias and SD of forecast - measured Hs, by observed group and forecast period
JIP_PERIODS = [6, 12, 24, 36, 48, 72, 96, 120, 144]
JIP_BIAS = {1: [0.22, 0.24, 0.26, 0.27, 0.27, 0.25, 0.26, 0.32, 0.50], 2: [0.19, 0.21, 0.23, 0.24, 0.24, 0.23, 0.21, 0.25, 0.30],
            3: [0.13, 0.15, 0.18, 0.18, 0.15, 0.08, 0.00, -0.03, 0.00], 4: [-0.02, 0.02, 0.03, 0.03, 0.01, -0.08, -0.24, -0.40, -0.60],
            5: [-0.13, -0.12, -0.10, -0.09, -0.09, -0.16, -0.37, -0.74, -1.35], 6: [-0.18, -0.17, -0.15, -0.13, -0.13, -0.21, -0.60, -1.15, -2.00]}
JIP_SD = {1: [0.33, 0.34, 0.36, 0.37, 0.39, 0.43, 0.48, 0.55, 0.65], 2: [0.39, 0.42, 0.45, 0.50, 0.54, 0.66, 0.75, 0.79, 0.78],
          3: [0.53, 0.56, 0.62, 0.68, 0.75, 0.87, 0.99, 1.08, 1.10], 4: [0.62, 0.66, 0.76, 0.85, 0.94, 1.08, 1.18, 1.23, 1.18],
          5: [0.73, 0.78, 0.90, 1.04, 1.15, 1.36, 1.47, 1.45, 1.24], 6: [0.80, 0.83, 0.94, 1.05, 1.16, 1.37, 1.52, 1.52, 1.24]}

# lead bins (hours from the 00 UTC base time) standing for each TPOP row
LEAD_BINS = {12: (9, 18), 24: (18, 30), 36: (30, 42), 48: (42, 60), 72: (60, 84)}
MIN_PAIRS = 30
B = 400
SEED = 20261006


def tp_of(hs):
    tz = 0.5 * (8.9 * math.sqrt(hs / 9.81) + 13.0)
    return tz / 0.7777


def exc(H, hs, n):
    """P(the largest of n Rayleigh waves exceeds H | Hs)."""
    p = math.exp(-2 * H * H / (hs * hs)) if hs > 0 else 0.0
    p = min(p, 1 - 1e-16)
    return -math.expm1(n * math.log1p(-p))


def bisect(f, a, b, tol=1e-12):
    """the root of a monotone f on [a, b] by bisection (standard library only, so any Python re-runs it)."""
    fa = f(a)
    for _ in range(200):
        m = 0.5 * (a + b)
        fm = f(m)
        if (fm > 0) == (fa > 0):
            a, fa = m, fm
        else:
            b = m
        if b - a <= tol * max(1.0, abs(m)):
            break
    return 0.5 * (a + b)


def hmax(hs, n):
    return bisect(lambda H: exc(H, hs, n) - P, 0.1 * hs, 10 * hs)


SIMPSON = 400


def hmax_wf(mu, s, n):
    """H such that the Rayleigh tail averaged over the true Hs ~ Normal(mu, s), truncated to Hs > 0, is P.
    Composite Simpson on [max(1e-3, mu - 8s), mu + 8s]; the normal density from math.exp, its mass from math.erf."""
    lo = max(1e-3, mu - 8 * s)
    hi = mu + 8 * s
    z = 0.5 * (math.erf((hi - mu) / (s * math.sqrt(2))) - math.erf((lo - mu) / (s * math.sqrt(2))))
    h = (hi - lo) / SIMPSON
    xs = [lo + k * h for k in range(SIMPSON + 1)]
    ws = [(1 if k in (0, SIMPSON) else 4 if k % 2 else 2) * math.exp(-0.5 * ((x - mu) / s) ** 2) / (s * math.sqrt(2 * math.pi))
          for k, x in enumerate(xs)]

    def tail(H):
        return sum(w * exc(H, x, n) for w, x in zip(ws, xs)) * h / 3 / z - P
    return bisect(tail, 0.5 * mu, 20 * (mu + 8 * s), tol=1e-10)


def alpha_j(h, b, s, T):
    bu = 0.5 * b if b > 0 else b
    n = T * 3600 / tp_of(h)
    return hmax(h + bu, n) / hmax_wf(h, s, n)


def calibration():
    cells, within = [], 0
    for h in DESIGN:
        for j, T in enumerate(TPOPS):
            i = JIP_PERIODS.index(T)
            a = alpha_j(h, JIP_BIAS[h][i], JIP_SD[h][i], T)
            tab = DNV['4-1'][h][j]
            ok = abs(a - tab) <= 0.02 + 1e-12
            within += ok
            cells.append({'designHs': h, 'TPOP': T, 'reconstructed': round(a, 4), 'table4_1': tab, 'dev': round(a - tab, 4), 'within0.02': ok})
    # RED CONTROL: the guidance note read literally — P(observed Hs > 1.5 OPLIM | forecast = alpha OPLIM) = 1e-4
    # with the same error SDs, alpha = 1.5 - z s / h (z the normal 1e-4 quantile, by bisection on math.erfc) —
    # must NOT pass the same gate: the gate tells the method that made the table from one that did not
    z = bisect(lambda x: 0.5 * math.erfc(x / math.sqrt(2)) - P, 0.0, 10.0)
    literal = sum(1 for h in DESIGN for j, T in enumerate(TPOPS)
                  if abs((1.5 - z * JIP_SD[h][JIP_PERIODS.index(T)] / h) - DNV['4-1'][h][j]) <= 0.02 + 1e-12)
    return {'cells': cells, 'within': within, 'of': len(cells),
            'gate': 'at least 16 of 20 cells within +-0.02 of DNV Table 4-1', 'pass': within >= 16,
            'redLiteralReading': {'within': literal, 'refused': literal < 16}}


def load_pairs():
    d = json.loads(gzip.decompress(open(os.path.join(ROOT, 'corpus', 'janela', 'matchups.json.gz'), 'rb').read()))
    out = defaultdict(list)
    for r in d['rows']:
        sid, mission, t, npts, obs, dist, rd, lead, fc = r[:9]
        out[sid].append({'o': Fraction(obs), 'f': Fraction(fc), 'lead': lead, 'day': t[:10], 'mission': mission})
    return out, d


def cell_stats(pairs):
    """bias and sd of e = f - o per (observed group, TPOP row)."""
    acc = defaultdict(list)
    for p in pairs:
        g = int(math.floor(float(p['o']) + 0.5))
        for T, (a, b) in LEAD_BINS.items():
            if a <= p['lead'] < b:
                acc[(g, T)].append(float(p['f'] - p['o']))
    out = {}
    for k, es in acc.items():
        n = len(es)
        if n < 2:
            continue
        m = sum(es) / n
        sd = math.sqrt(sum((e - m) ** 2 for e in es) / (n - 1))
        out[k] = (n, m, sd)
    return out


def site_alpha(pairs):
    full = cell_stats(pairs)
    days = sorted({p['day'] for p in pairs})
    by_day = defaultdict(list)
    for p in pairs:
        by_day[p['day']].append(p)
    rng = random.Random(SEED)
    boots = defaultdict(list)
    for _ in range(B):
        sample = []
        for d in rng.choices(days, k=len(days)):
            sample.extend(by_day[d])
        cs = cell_stats(sample)
        for h in DESIGN:
            for T in TPOPS:
                c = cs.get((h, T))
                if c and c[0] >= MIN_PAIRS and c[2] > 0:
                    boots[(h, T)].append(alpha_j(h, c[1], c[2], T))
    rows = []
    for h in DESIGN:
        for j, T in enumerate(TPOPS):
            c = full.get((h, T))
            row = {'designHs': h, 'TPOP': T, 'n': c[0] if c else 0,
                   'dnv': {k: DNV[k][h][j] for k in DNV}}
            if not c or c[0] < MIN_PAIRS:
                row.update(verdict='REFUSED', why=f'{row["n"]} pairs in the observed-Hs group {h} m at lead {LEAD_BINS[T][0]}-{LEAD_BINS[T][1]} h; at least {MIN_PAIRS} needed')
                rows.append(row)
                continue
            a = alpha_j(h, c[1], c[2], T)
            bs = sorted(boots[(h, T)])
            lo = bs[int(0.05 * (len(bs) - 1))] if bs else None
            hi = bs[int(math.ceil(0.95 * (len(bs) - 1)))] if bs else None
            tab = DNV['4-1'][h][j]
            reading = ('site alpha ABOVE the table (the North Sea table is conservative here)' if lo is not None and lo > tab else
                       'site alpha BELOW the table (the North Sea table is NOT conservative here)' if hi is not None and hi < tab else
                       'the 90% interval contains the table value')
            row.update(bias=round(c[1], 4), sd=round(c[2], 4), alpha=round(a, 4),
                       ci90=[round(lo, 4) if lo is not None else None, round(hi, 4) if hi is not None else None],
                       boot=len(bs), reading=reading, verdict='ESTIMATED')
            rows.append(row)
    return {'pairs': len(pairs), 'days': len(days), 'cells': rows,
            'groups': {f'{g}m@{T}h': {'n': n, 'bias': round(m, 4), 'sd': round(s, 4)} for (g, T), (n, m, s) in sorted(full.items())}}


def interp_dnv(table, hs, j):
    """DNV's linear interpolation between design-Hs columns, in exact rationals; below 1 m: REFUSED (case by case)."""
    cols = DESIGN
    if hs < 1:
        return None
    if hs >= 6:
        return Fraction(str(DNV[table][6][j]))
    for a, b in zip(cols, cols[1:]):
        if a <= hs <= b:
            ya, yb = Fraction(str(DNV[table][a][j])), Fraction(str(DNV[table][b][j]))
            return ya + (yb - ya) * (Fraction(hs) - a) / (b - a)
    return None


def exceedance_counts(pairs):
    """exact counts: forecasts at or below the table's alpha * OPLIM, and how often the satellite saw more."""
    out = []
    for oplim in [Fraction(3, 2), Fraction(2), Fraction(5, 2), Fraction(3), Fraction(7, 2), Fraction(4)]:
        for j, T in enumerate(TPOPS):
            a = interp_dnv('4-1', oplim, j)
            opwf = a * oplim
            a0, b0 = LEAD_BINS[T]
            sel = [p for p in pairs if a0 <= p['lead'] < b0 and p['f'] <= opwf]
            above = sum(1 for p in sel if p['o'] > oplim)
            above50 = sum(1 for p in sel if p['o'] > Fraction(3, 2) * oplim)
            out.append({'OPLIM': str(oplim), 'TPOP': T, 'alphaTable4_1': f'{a.numerator}/{a.denominator}', 'OPWF': f'{opwf.numerator}/{opwf.denominator}',
                        'forecastsAtOrBelowOPWF': len(sel), 'observedAboveOPLIM': above, 'observedAbove1.5xOPLIM': above50})
    return out


def main():
    cal = calibration()
    print(f"calibration: {cal['within']}/{cal['of']} cells within 0.02 of DNV Table 4-1", flush=True)
    if not cal['pass']:
        raise SystemExit('REFUSED: the reconstruction does not reproduce DNV Table 4-1')
    red = cal['redLiteralReading']
    print(f"red control: the guidance note read literally reproduces {red['within']}/20 — {'refused by the same gate (RED ok)' if red['refused'] else 'NOT refused'}", flush=True)
    if not red['refused']:
        raise SystemExit('REFUSED: the gate does not tell the table\'s method from the literal reading')
    if '--check' in sys.argv:
        return
    pairs, meta = load_pairs()
    sites = {}
    for sid, ps in sorted(pairs.items()):
        print(sid, len(ps), 'pairs', flush=True)
        sites[sid] = site_alpha(ps)
        sites[sid]['exceedance'] = exceedance_counts(ps)
    out = {
        'what': 'Site-specific DNV alpha factors (waves) from ECMWF open-data forecasts vs NOAA altimeter passes, by the method that made DNV Table 4-1 (the 2005-07 JIP as reconstructed by Wilcken 2012), with day-bootstrap 90% intervals, beside DNV-OS-H101 Tables 4-1..4-3; and exact counts of how often the satellite saw Hs above OPLIM when the forecast was at or below the table\'s alpha*OPLIM. alpha is a STATISTICAL estimate (float64), not a certified enclosure; the counts are exact.',
        'method': {'recipe': 'J (DNV JIP via Wilcken 2012 §4.1)', 'P': P, 'leadBins': LEAD_BINS, 'minPairs': MIN_PAIRS,
                   'bootstrap': {'resamples': B, 'unit': 'UTC day of the pass', 'seed': SEED, 'interval': '5th-95th percentile'},
                   'caveats': ['the altimeter measurement error and the 100 km collocation inflate the error SD: the site alpha leans low (conservative)',
                               'lead is counted from the 00 UTC base time; the open-data run is available about 8 h later, so operational leads are ~8 h longer',
                               'the Gaussian error model is extrapolated to about its 1-in-1,000 tail; 1e-4 cannot be observed in three years',
                               'Tables 4-4/4-5 (monitoring) and the wind table 4-6 are not re-derived here']},
        'calibration': cal,
        'source': {'matchups': 'corpus/janela/matchups.json.gz', 'rows': len(meta['rows'])},
        'sites': sites,
    }
    dest = os.path.join(ROOT, 'certs', 'janela-alpha.json')
    with open(dest, 'w') as fh:
        json.dump(out, fh, indent=1, ensure_ascii=False)
        fh.write('\n')
    print('wrote', os.path.relpath(dest, ROOT))


if __name__ == '__main__':
    main()
