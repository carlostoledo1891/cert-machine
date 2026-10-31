#!/usr/bin/env python3
"""tools/xx_study.py — the study of x^x = y (the operator's experiment, 2026-10-31, extended from x^x = 64).

For every integer y from 2 to 1000 the real root x of x^x = y (one root, above 1: library/selfpower.py) is COMPUTED here, by
Newton's method on x·ln x = ln y in 160-digit decimal arithmetic, then read as a continued fraction (its first 40 partial
quotients, kept only where the 120- and 160-digit roots agree) and its convergents. Nothing here is decided: these are a
proposer's numbers. What is decided is written as claims for cert-machine — for y = 2..100 and the neighbours of k^k —
each root bracketed by its two last convergents with denominator ≤ 1000, one exact integer inequality per side, and at
y = k^k the root pinned to k by the two bounds x ≥ k and x ≤ k.

    python3 tools/xx_study.py          writes records/xxy-study.json, corpus/xxy/{source.md, claims.claim, n/<y>.json}
    python3 -m claimbox check corpus/xxy/claims.claim --run --record records/xxy-check.json      cert-machine's words

Standard library only.
"""
import json
import math
import os
from decimal import Decimal, getcontext
from fractions import Fraction

REPO = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
YS = range(2, 1001)                                    # the computed study
DECIDED = sorted(set(range(2, 101)) | {255, 256, 257, 3124, 3125, 3126})   # the roots cert-machine brackets
DMAX = 1000                                            # "the closest fraction": the last convergent with denominator ≤ 1000
TERMS = 40


def root(y, prec):
    getcontext().prec = prec
    L = Decimal(y).ln()
    x = Decimal(max(2, int(math.log(y) / max(math.log(math.log(y) + 1e-9), 0.5)) + 1)) if y > 3 else Decimal('1.5')
    for _ in range(400):
        nx = x - (x * x.ln() - L) / (x.ln() + 1)
        if abs(nx - x) < Decimal(10) ** (-(prec - 5)):
            x = nx
            break
        x = nx
    return x


def exact_k(y):
    """k with k^k = y, else None"""
    for k in range(1, 12):
        if k ** k == y:
            return k
    return None


def cf_of(x, n):
    out, f = [], Fraction(x)
    for _ in range(n):
        a = f.numerator // f.denominator
        out.append(a)
        f -= a
        if f == 0:
            break
        f = 1 / f
    return out


def convergents(cf):
    h0, h1, k0, k1 = 1, cf[0], 0, 1
    out = [(h1, k1)]
    for a in cf[1:]:
        h0, h1, k0, k1 = h1, a * h1 + h0, k1, a * k1 + k0
        out.append((h1, k1))
    return out


def study(y):
    k = exact_k(y)
    if k is not None:
        return {'y': y, 'x': str(k), 'xShort': str(k), 'exact': True, 'k': k, 'cf': [k], 'closest': [k, 1], 'error': '0', 'bracket': [[k, 1], [k, 1]]}
    x160, x120 = root(y, 160), root(y, 120)
    a, b = cf_of(x160, TERMS + 5), cf_of(x120, TERMS + 5)
    agree = 0
    while agree < min(len(a), len(b)) and a[agree] == b[agree]:
        agree += 1
    cf = a[:min(agree - 2, TERMS)]                        # only the quotients both precisions agree on, two to spare
    conv = convergents(cf)
    within = [c for c in conv if c[1] <= DMAX]
    best = within[-1]
    prev = within[-2] if len(within) > 1 else (cf[0] + 1, 1) if Fraction(*within[-1]) < Fraction(x160) else (cf[0], 1)
    getcontext().prec = 60
    xf = Fraction(x160)
    err = Fraction(best[0], best[1]) - xf
    nxt = next((c for c in conv if c[1] > DMAX), None)
    return {'y': y, 'x': str(+x160)[:52], 'xShort': str(+x160)[:24], 'exact': False, 'cf': cf, 'closest': list(best), 'error': '%.6e' % float(err),
            'quality': float(abs(err) * best[1] ** 2), 'bracket': [list(prev), list(best)], 'next': list(nxt) if nxt else None,
            'lnLn': float(Decimal(y).ln() / Decimal(y).ln().ln()) if y > 2 else None}


GK = {k: -math.log2(1 - 1 / (k + 1) ** 2) for k in range(1, 11)}      # the Gauss–Kuzmin law, P(a = k)
KHINCHIN, LEVY = 2.6854520010653064, math.pi ** 2 / (12 * math.log(2))      # Lévy: (ln q_n)/n → π²/(12 ln 2) for almost every x


def main():
    rows = [study(y) for y in YS] + [study(y) for y in (3124, 3125, 3126)]
    irr = [r for r in rows if not r['exact']]
    pooled = [a for r in irr for a in r['cf'][1:]]
    freq = {k: sum(1 for a in pooled if a == k) / len(pooled) for k in range(1, 11)}
    geo = math.exp(sum(math.log(a) for a in pooled) / len(pooled))
    levy = [math.log(convergents(r['cf'])[-1][1]) / (len(r['cf']) - 1) for r in irr if len(r['cf']) > 20]
    big = sorted(({'y': r['y'], 'n': i, 'a': a, 'fraction': list(convergents(r['cf'])[i - 1])} for r in irr for i, a in enumerate(r['cf']) if i >= 1),
                 key=lambda z: -z['a'])[:12]
    near = [r for r in rows if r['y'] in (26, 28, 255, 257, 3124, 3126)]
    rec = {'what': 'tools/xx_study.py: the real root of x^x = y for y = 2..1000 (and 3124..3126), COMPUTED by Newton\'s method in 160-digit '
                   'arithmetic; its continued fraction (the quotients the 120- and 160-digit roots agree on), its closest fraction with '
                   'denominator ≤ ' + str(DMAX) + ' (the last convergent), the error. Computed, not decided: cert-machine\'s words on the brackets are '
                   'records/xxy-check.json',
           'dmax': DMAX, 'count': len(rows), 'exactRoots': [r['y'] for r in rows if r['exact']], 'decidedYs': DECIDED,
           'stats': {'pooledQuotients': len(pooled), 'frequency': {str(k): round(v, 5) for k, v in freq.items()},
                     'gaussKuzmin': {str(k): round(v, 5) for k, v in GK.items()}, 'geometricMean': round(geo, 4), 'khinchin': round(KHINCHIN, 4),
                     'levyMean': round(sum(levy) / len(levy), 4), 'levy': round(LEVY, 4), 'largest': big},
           'near': [{'y': r['y'], 'x': r['x'][:24], 'quotient': max(r['cf'][1:3]), 'cf': r['cf'][:5],
                     'predicted': round(next(k ** k for k in range(1, 7) if abs(k ** k - r['y']) == 1) * (1 + math.log(next(k for k in range(1, 7) if abs(k ** k - r['y']) == 1))), 1)}
                    for r in near],
           'rows': rows}
    with open(os.path.join(REPO, 'records', 'xxy-study.json'), 'w', encoding='utf-8') as f:
        json.dump(rec, f, indent=1, ensure_ascii=False)
        f.write('\n')
    # the claims cert-machine decides: per y, the bracket by the last two convergents with denominator ≤ DMAX
    os.makedirs(os.path.join(REPO, 'corpus', 'xxy', 'n'), exist_ok=True)
    src, claims, decls = ['# x^x = y: the AI\'s proposals, one bracket per root (tools/xx_study.py: computed, not decided)', ''], [], []
    by = {r['y']: r for r in rows}
    for y in DECIDED:
        r = by[y]
        with open(os.path.join(REPO, 'corpus', 'xxy', 'n', f'{y}.json'), 'w', encoding='utf-8') as f:
            f.write(json.dumps({'what': f'x^x = N with N = {y}', 'N': y}) + '\n')
        decls += [f'data   n{y} = ../claimbox/corpus/xxy/n/{y}.json', f'read   n{y} as integers']
        if r['exact']:
            pairs = [('ge', '≥', f"{r['k']}"), ('le', '≤', f"{r['k']}")]
        else:
            lo, hi = sorted((Fraction(*r['bracket'][0]), Fraction(*r['bracket'][1])))
            fmt = lambda q: f'{q.numerator}/{q.denominator}' if q.denominator > 1 else str(q.numerator)
            pairs = [('gt', '>', fmt(lo)), ('lt', '<', fmt(hi))]
        for tag, sym, bar in pairs:
            line = f'for y = {y}: xroot {sym} {bar}'
            src.append(line)
            claims += [f'claim  y{y}_{tag} over n{y}', f'  quote "{line}" from P', f'  : xroot(n{y}) {sym} {bar}',
                       '  proposed by model:claude-opus-5-5', '  expect CERTIFIED', '']
    # planted wrong claims, which cert-machine must refute: four brackets turned the wrong way round
    src += ['', 'Planted wrong claims, each bracket turned the wrong way round:']
    for y in (10, 64, 100, 255):
        r = by[y]
        lo, hi = sorted((Fraction(*r['bracket'][0]), Fraction(*r['bracket'][1])))
        for tag, sym, q in (('planted_lt', '<', lo), ('planted_gt', '>', hi)):
            bar = f'{q.numerator}/{q.denominator}' if q.denominator > 1 else str(q.numerator)
            line = f'planted, for y = {y}: xroot {sym} {bar}'
            src.append(line)
            claims += [f'claim  y{y}_{tag} over n{y}', f'  quote "{line}" from P', f'  : xroot(n{y}) {sym} {bar}', '  expect REFUTED', '']
    with open(os.path.join(REPO, 'corpus', 'xxy', 'source.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(src) + '\n')
    with open(os.path.join(REPO, 'corpus', 'xxy', 'claims.claim'), 'w', encoding='utf-8') as f:
        f.write('-- x^x = y: each root bracketed by its last two convergents with denominator <= ' + str(DMAX) + '; at y = k^k pinned to k.\n'
                '-- Written by tools/xx_study.py; python3 -m claimbox check corpus/xxy/claims.claim --run --record records/xxy-check.json\n'
                'source P = ../claimbox/corpus/xxy/source.md\n' + '\n'.join(decls) + '\nuse    xroot v1\n\n' + '\n'.join(claims))
    print(f'{len(rows)} roots; {len(DECIDED)} to decide, {2 * len(DECIDED)} claims; pooled quotients {len(pooled)}; geometric mean {geo:.4f}')


if __name__ == '__main__':
    main()
