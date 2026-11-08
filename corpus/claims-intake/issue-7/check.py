#!/usr/bin/env python3
"""check.py - the standalone certificate for cert-machine claim #7: 26 circles in the unit square, no tolerance.

Re-runs on stock Python (standard library only) without cert-machine:

    python3 -I check.py                      # claim #7: entry "8B-w_RL@65-Formal", strict, sum = 2.63598308
    python3 -I check.py --controls --json    # the same with the planted controls, machine-readable
                                             # (read by tools/record-claims-intake-7.js)

Input: ../inputs/thetaevolve-7c12898-CirclePacking-data.json, byte for byte the file
github.com/ypwang61/ThetaEvolve @ 7c12898f5d7627af403e3aca643af76199fb5c20, Results/CirclePacking/data.json
(Apache-2.0, ../inputs/THETAEVOLVE-LICENSE); refused unless its sha256 is the pinned one (the one the issue states).
The entry is two blocks, 26 centres [x, y] then 26 radii; any other shape is refused.

Every number is the rational its decimal literal denotes (json parse_float=str, then Fraction). Decided exactly:
    r_i > 0;   r_i <= x_i <= 1 - r_i  and the same for y;
    for every pair:  (r_i + r_j)^2 <= d_ij^2   (tangency allowed);
    the printed sum read as a rounding: |sum r - 2.63598308| <= 5e-9 (truncation reported beside it).
Reported as facts: the same constraints at #5's tolerance t = 1e-6, and whether the sum exceeds #3's exact
AlphaEvolve sum. Pre-registration: notes/claims-intake-7-preregistration-2026-11-08.md.
MIT. Written by Claude under Carlos Toledo's direction; adapted from ../circles/check.py (#3/#5), which is left
unchanged; shares no code with the JavaScript decider.
"""
import sys, os, json, hashlib
from fractions import Fraction
from math import isqrt

HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, '..', 'inputs', 'thetaevolve-7c12898-CirclePacking-data.json')
SHA256 = 'c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8'
CLAIM = {'entry': '8B-w_RL@65-Formal', 'tol': '0', 'sum': '2.63598308', 'bump': '1e-6', 'sumMoved': '2.63598309'}
AE_SUM = '2.63586275641369812'             # #3's exact AlphaEvolve sum (certs/claims-intake-2026-11-08.json)
EXP = 40                                   # distance enclosures at 10^-40


def refuse(msg):
    print('REFUSED: ' + msg)
    sys.exit(2)


def load():
    raw = open(INPUT, 'rb').read()
    got = hashlib.sha256(raw).hexdigest()
    if got != SHA256:
        refuse('the input hashes to %s, the pin is %s' % (got, SHA256))
    data = json.loads(raw.decode('utf-8'), parse_float=str, parse_int=str)
    return {e['name']: e['list'] for e in data}


def triples(v):
    """the Formal entry's two blocks -> 26 [x, y, r] rows of Fractions; None if the shape is not 26 pairs + 26 numbers"""
    if not (isinstance(v, list) and len(v) == 2 and isinstance(v[0], list) and isinstance(v[1], list)):
        return None
    cs, rs = v
    if len(cs) != 26 or len(rs) != 26 or any(not isinstance(c, list) or len(c) != 2 for c in cs) or any(isinstance(r, list) for r in rs):
        return None
    return [[Fraction(c[0]), Fraction(c[1]), Fraction(r)] for c, r in zip(cs, rs)]


def dec_exact(q):
    """a rational with a finite decimal expansion, every digit; None otherwise"""
    for k in range(0, 401):
        v = q * 10 ** k
        if v.denominator == 1:
            n = v.numerator
            s = str(abs(n)).rjust(k + 1, '0')
            out = ('-' if n < 0 else '') + (s[:-k] + '.' + s[-k:] if k else s)
            return out.rstrip('0').rstrip('.') if k else out
    return None


def floor_div(a, b):
    return a // b


def ceil_div(a, b):
    return -((-a) // b)


def fixed(n, k):
    s = str(abs(n)).rjust(k + 1, '0')
    return ('-' if n < 0 else '') + s[:-k] + '.' + s[-k:]


def sum_minus_dist(s, d2):
    """(s - d) * 10^EXP enclosed in integers [lo, hi], d = sqrt(d2), s and d2 rationals"""
    sc = 10 ** (2 * EXP)
    lo_sq = (d2.numerator * sc) // d2.denominator
    hi_sq = ceil_div(d2.numerator * sc, d2.denominator)
    d_lo = isqrt(lo_sq)
    d_hi = isqrt(hi_sq)
    if d_hi * d_hi < hi_sq:
        d_hi += 1
    s_sc = s * 10 ** EXP
    if s_sc.denominator != 1:
        refuse('a radius sum with more than %d decimals' % EXP)
    return s_sc.numerator - d_hi, s_sc.numerator - d_lo


def decide(C, t, sum_lit, with_repair=True):
    """the facts and the verdict of one reading; t a Fraction >= 0"""
    if len(C) != 26 or any(len(c) != 3 for c in C):
        return {'verdict': 'REFUSED', 'why': 'not 26 triples [x, y, r] (%d rows)' % len(C)}
    n = len(C)
    nonpos = [i for i, c in enumerate(C) if c[2] <= 0]
    side_all = []
    for i, (x, y, r) in enumerate(C):
        side_all.append((x - r, i, 'left (x - r)'))
        side_all.append((1 - x - r, i, 'right (1 - x - r)'))
        side_all.append((y - r, i, 'bottom (y - r)'))
        side_all.append((1 - y - r, i, 'top (1 - y - r)'))
    pair_all = []
    for i in range(n):
        for j in range(i + 1, n):
            dx, dy = C[i][0] - C[j][0], C[i][1] - C[j][1]
            d2 = dx * dx + dy * dy
            s = C[i][2] + C[j][2]
            pair_all.append((i, j, d2, s))

    def bad_under(tt):
        sb = [(i, nm) for (sl, i, nm) in side_all if sl + tt < 0]
        pb = [(i, j) for (i, j, d2, s) in pair_all if (s - tt) > 0 and (s - tt) * (s - tt) > d2]
        return sb, pb

    sb_t, pb_t = bad_under(t)
    sb_0, pb_0 = bad_under(Fraction(0))
    total = sum(c[2] for c in C)
    printed = Fraction(sum_lit)
    places = len(sum_lit.split('.')[1]) if '.' in sum_lit else 0
    rounds = abs(total - printed) <= Fraction(1, 2 * 10 ** places)
    truncates = printed <= total < printed + Fraction(1, 10 ** places)
    fails = []
    if nonpos:
        fails.append('a radius is not positive (circles %s)' % ', '.join(map(str, nonpos)))
    if sb_t:
        fails.append('%d side constraint%s fail' % (len(sb_t), '' if len(sb_t) == 1 else 's'))
    if pb_t:
        fails.append('%d pair%s overlap' % (len(pb_t), '' if len(pb_t) == 1 else 's'))
    if not rounds:
        fails.append('the exact sum does not round to ' + sum_lit)
    tight_side = min(side_all, key=lambda z: z[0])            # first minimum in (circle, side) order
    tight_pair = None
    for (i, j, d2, s) in pair_all:
        v = d2 - s * s
        if tight_pair is None or v < tight_pair[2]:
            tight_pair = (i, j, v)
    encl = [(i, j) + sum_minus_dist(s, d2) for (i, j, d2, s) in pair_all]
    worst = None
    for e in encl:
        if worst is None or e[2] > worst[2]:
            worst = e
    strict_holds = not nonpos and not sb_0 and not pb_0
    repair = None
    if not strict_holds and with_repair:
        need = 0
        for e in encl:
            need = max(need, ceil_div(e[3], 2))
        for (sl, i, nm) in side_all:
            v = -sl * 10 ** EXP
            need = max(need, ceil_div(v.numerator, v.denominator))
        delta_bar = Fraction(ceil_div(need, 10 ** (EXP - 20)), 10 ** 20)
        C2 = [[x, y, r - delta_bar] for (x, y, r) in C]
        r2 = decide(C2, Fraction(0), sum_lit, with_repair=False)
        repair = {'deltaUpper': fixed(ceil_div(need, 10 ** (EXP - 30)), 30), 'deltaBar': dec_exact(delta_bar),
                  'repairedSum': r2['sumExact'], 'repairedStrictHolds': r2['strict']['holds']}
    return {
        'verdict': 'REFUTED' if fails else 'CERTIFIED', 'fails': fails, 'tolerance': dec_exact(t), 'n': n,
        'sumExact': dec_exact(total), 'claim': sum_lit, 'sumRounds': rounds, 'sumTruncates': truncates,
        'sumMinusClaim': dec_exact(total - printed),
        'underReading': {'sideViolations': len(sb_t), 'pairViolations': len(pb_t)},
        'strict': {'holds': strict_holds, 'sideViolations': len(sb_0), 'pairViolations': len(pb_0),
                   'sides': [{'i': i, 'side': nm} for (i, nm) in sb_0], 'pairs': [list(p) for p in pb_0]},
        'radiiNonPositive': nonpos,
        'tightestSide': {'circle': tight_side[1], 'side': tight_side[2], 'slackExact': dec_exact(tight_side[0])},
        'tightestPairSquared': {'pair': [tight_pair[0], tight_pair[1]], 'dSquaredMinusSumSquaredExact': dec_exact(tight_pair[2])},
        'worstPairDistance': {'pair': [worst[0], worst[1]],
                              'sumMinusDistance': [fixed(floor_div(worst[2], 10 ** (EXP - 30)), 30), fixed(ceil_div(worst[3], 10 ** (EXP - 30)), 30)]},
        'tangenciesExact': sum(1 for (i, j, d2, s) in pair_all if d2 == s * s),
        'sideTouchesExact': sum(1 for (sl, i, nm) in side_all if sl == 0),
        'repair': repair,
    }


def shrunk(C, delta):
    C2 = [[x, y, r - delta] for (x, y, r) in C]
    r = decide(C2, Fraction(0), '0')
    return {'strictHolds': r['strict']['holds'], 'sumExact': r['sumExact'],
            'sideViolations': r['strict']['sideViolations'], 'pairViolations': r['strict']['pairViolations']}


def controls(C, claim, base):
    """the planted perturbations of the pre-registration; each returns the verdict it got"""
    t = Fraction(claim['tol'])
    out = {}
    i = base['tightestPairSquared']['pair'][0]
    P1 = [list(c) for c in C]
    P1[i][2] += Fraction(claim['bump'])
    out['P1'] = {'what': 'circle %d (the tightest pair, squared form) radius + %s' % (i, claim['bump']), 'verdict': decide(P1, t, claim['sum'])['verdict']}
    P2 = [list(c) for c in C]
    P2[0][0] = P2[0][2] - Fraction('2e-6')
    out['P2strict'] = {'what': 'x_0 := r_0 - 2e-6, strict', 'verdict': decide(P2, Fraction(0), claim['sum'])['verdict']}
    out['P2tol'] = {'what': 'x_0 := r_0 - 2e-6, tolerance 1e-6', 'verdict': decide(P2, Fraction('1e-6'), claim['sum'])['verdict']}
    P3 = [list(c) for c in C]
    P3[1][0], P3[1][1] = P3[0][0], P3[0][1]
    out['P3'] = {'what': "circle 1's centre on circle 0's", 'verdict': decide(P3, t, claim['sum'])['verdict']}
    out['P4'] = {'what': 'the sum claim moved to ' + claim['sumMoved'], 'verdict': decide(C, t, claim['sumMoved'])['verdict']}
    if base['repair']:
        d = Fraction(base['repair']['deltaBar'])
        P5 = [[x, y, r - d] for (x, y, r) in C]
        held = decide(P5, Fraction(0), '0')['strict']['holds']          # a packing question: the sum is not asked
        out['P5'] = {'what': 'every radius - %s (the repair), strict' % base['repair']['deltaBar'], 'verdict': 'CERTIFIED' if held else 'REFUTED'}
    out['P6'] = {'what': 'the first 25 circles only', 'verdict': decide(C[:25], t, claim['sum'])['verdict']}
    return out


def main():
    args = sys.argv[1:]
    if any(a not in ('--controls', '--json') for a in args):
        print(__doc__)
        sys.exit(1)
    claim = CLAIM
    E = load()
    C = triples(E[claim['entry']])
    if C is None:
        refuse('entry %s is not 26 centres [x, y] followed by 26 radii' % claim['entry'])
    res = decide(C, Fraction(claim['tol']), claim['sum'])
    tol = decide(C, Fraction('1e-6'), claim['sum'], with_repair=False)
    out = {'issue': 7, 'entry': claim['entry'], 'input': os.path.basename(INPUT), 'sha256': SHA256,
           'python': sys.version.split()[0], 'result': res,
           'atTolerance1e-6': {'sideViolations': tol['underReading']['sideViolations'], 'pairViolations': tol['underReading']['pairViolations']},
           'aboveAlphaEvolveExactSum': Fraction(res['sumExact']) > Fraction(AE_SUM)}
    if '--controls' in args:
        out['controls'] = controls(C, claim, res)
        out['controls']['P7'] = {'what': 'the radii block dropped', 'verdict': 'REFUSED' if triples([E[claim['entry']][0]]) is None else 'NOT REFUSED'}
    if '--json' in args:
        print(json.dumps(out, indent=1))
        return
    print('claim #7, entry "%s", strict: %s' % (claim['entry'], res['verdict']))
    for f in res['fails']:
        print('  fails: ' + f)
    print('  sum of radii, exactly: %s  (printed %s: rounds %s, truncates %s)' % (res['sumExact'], res['claim'], res['sumRounds'], res['sumTruncates']))
    st = res['strict']
    print('  strict: %s — %d overlapping pairs, %d side excesses' % ('holds' if st['holds'] else 'FAILS', st['pairViolations'], st['sideViolations']))
    print('  tightest side: circle %d, %s = %s' % (res['tightestSide']['circle'], res['tightestSide']['side'], res['tightestSide']['slackExact']))
    w = res['worstPairDistance']
    print('  largest r_i + r_j - d_ij: pair %s, in [%s, %s]' % (w['pair'], w['sumMinusDistance'][0], w['sumMinusDistance'][1]))
    print('  exact tangencies %d, exact side touches %d' % (res['tangenciesExact'], res['sideTouchesExact']))
    if res['repair']:
        print('  repair: every radius minus %s gives an exact packing (strict holds: %s), sum %s' % (res['repair']['deltaBar'], res['repair']['repairedStrictHolds'], res['repair']['repairedSum']))
    print('  at tolerance 1e-6: %d pair and %d side violations' % (out['atTolerance1e-6']['pairViolations'], out['atTolerance1e-6']['sideViolations']))
    print('  sum above #3\'s exact AlphaEvolve sum %s: %s' % (AE_SUM, out['aboveAlphaEvolveExactSum']))
    if 'controls' in out:
        for k, v in out['controls'].items():
            print('  control %s: %s -> %s' % (k, v['what'], v['verdict']))


if __name__ == '__main__':
    main()
