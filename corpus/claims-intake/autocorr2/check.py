#!/usr/bin/env python3
"""check.py - the standalone check for cert-machine claim #4: the second autocorrelation inequality, entry "8B-w_RL@65".

Re-runs on stock Python (standard library only) without cert-machine:

    python3 -I check.py            # the claim: the 3072-cell step function gives C2 >= 0.9469
    python3 -I check.py --json     # machine-readable (read by tools/record-claims-intake.js)
    python3 -I check.py --controls --json

Input: ../inputs/thetaevolve-7c12898-SecondAutoCorrIneq-data.json, byte for byte the file
github.com/ypwang61/ThetaEvolve @ 7c12898f5d7627af403e3aca643af76199fb5c20, Results/SecondAutoCorrIneq/data.json
(Apache-2.0, ../inputs/THETAEVOLVE-LICENSE); refused unless its sha256 is the pinned one.

The definition (arXiv:2511.23473 App. A.3; AlphaEvolve's B.2): C2 is the least constant with
||f*f||_2^2 <= C2 ||f*f||_1 ||f*f||_inf for every non-negative f, so a non-negative f proves C2 >= Q(f), Q the ratio.
For f = a_i on n equal cells, f*f is piecewise linear with f*f(mh) = h c_{m-1}, c_k = sum_{i+j=k} a_i a_j, so

    Q = sum_{m=0}^{2n-1} (c_{m-1}^2 + c_{m-1} c_m + c_m^2) / (3 (sum a)^2 max c),     c_{-1} = c_{2n-1} = 0,

a rational. Every a_i is the rational its decimal literal denotes, scaled to an integer over one power of ten; c is
computed exactly by Kronecker substitution (one big-integer square). Pre-registration:
notes/claims-intake-preregistration-2026-11-08.md. MIT. Written by Claude under Carlos Toledo's direction; shares no
code with the JavaScript decider.
"""
import sys, os, json, hashlib, random
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
INPUT = os.path.join(HERE, '..', 'inputs', 'thetaevolve-7c12898-SecondAutoCorrIneq-data.json')
SHA256 = '3d453b729f5913e7f686e1386c5351fb90a2f434910604c6199ad39905a3cb4b'
ENTRY, CELLS, THRESHOLD = '8B-w_RL@65', 3072, '0.9469'
CALIBRATIONS = [('AlphaEvolve-v1', '0.8962', "AlphaEvolve's 0.8962 <= C2 (its B.2 notebook; the same 50 literals)"),
                ('StrongInit', '0.9055', "Table 2, Initial, Distill-Qwen3-8B"),
                ('8B-wo_RL@100', '0.9434', "Table 2, w/o RL (late), step 100, best")]


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


def integers(vals):
    """Fractions over one power of ten -> (integers, the power)"""
    k = 0
    while any((v * 10 ** k).denominator != 1 for v in vals):
        k += 1
        if k > 400:
            refuse('a value that is not a finite decimal')
    return [int(v * 10 ** k) for v in vals], k


def autoconv(a):
    """c_k = sum_{i+j=k} a_i a_j for non-negative integers, by one big-integer square"""
    n = len(a)
    top = max(a)
    W = 2 * max(top.bit_length(), 1) + n.bit_length() + 2
    W += (-W) % 8                                   # whole bytes
    X = 0
    for v in reversed(a):
        X = (X << W) | v
    Y = X * X
    nb = W // 8
    b = Y.to_bytes((Y.bit_length() + 7) // 8 + nb, 'little')
    return [int.from_bytes(b[k * nb:(k + 1) * nb], 'little') for k in range(2 * n - 1)]


def ratio(vals):
    a, k = integers(vals)
    neg = [i for i, v in enumerate(a) if v < 0]
    s = sum(a)
    if neg or s <= 0:
        return {'domain': False, 'negatives': len(neg), 'sumPositive': s > 0}
    c = autoconv(a)
    n = len(a)
    ext = [0] + c + [0]                             # ext[m] = c_{m-1}, m = 0..2n
    S2 = sum(ext[m] * ext[m] + ext[m] * ext[m + 1] + ext[m + 1] * ext[m + 1] for m in range(2 * n))
    mc = max(c)
    q = Fraction(S2, 3 * s * s * mc)
    return {'domain': True, 'negatives': 0, 'n': n, 'decimals': k, 'argmax': c.index(mc), 'Q': q}


def floor_s(q, d):
    v = (q.numerator * 10 ** d) // q.denominator
    return ('-' if v < 0 else '') + (str(abs(v)).rjust(d + 1, '0')[:-d] + '.' + str(abs(v)).rjust(d + 1, '0')[-d:])


def ceil_s(q, d):
    v = -((-q.numerator * 10 ** d) // q.denominator)
    return ('-' if v < 0 else '') + (str(abs(v)).rjust(d + 1, '0')[:-d] + '.' + str(abs(v)).rjust(d + 1, '0')[-d:])


def verdict(r, thr):
    if not r['domain']:
        return 'REFUTED'
    return 'CERTIFIED' if r['Q'] >= Fraction(thr) else 'REFUTED'


def printed_as(q, printed):
    d = len(printed.split('.')[1])
    p = Fraction(printed)
    return {'rounds': abs(q - p) <= Fraction(1, 2 * 10 ** d), 'truncates': p <= q < p + Fraction(1, 10 ** d), 'atLeast': q >= p}


def selftests():
    out = {}
    out['oneCell'] = ratio([Fraction(1)])['Q'] == Fraction(2, 3)
    out['twoEqualCells'] = ratio([Fraction(1), Fraction(1)])['Q'] == Fraction(2, 3)
    rnd = random.Random(20261108)
    a = [rnd.randint(0, 10 ** 6) for _ in range(40)]
    school = [sum(a[i] * a[k - i] for i in range(max(0, k - 39), min(k, 39) + 1)) for k in range(79)]
    out['kroneckerEqualsSchoolbook'] = autoconv(a) == school
    # the formula against a float quadrature of the three norms (a test of the formula, not a decision)
    f = [rnd.random() for _ in range(7)]
    n = len(f)
    M = 2 * n * 200                                  # the knots (integers) are grid points; Simpson panels inside pieces
    def conv_at(t):                                  # f*f(t), cells [i, i+1)
        s = 0.0
        for i in range(n):
            for j in range(n):
                u = t - (i + j)
                if 0 < u < 2:
                    s += f[i] * f[j] * (1 - abs(u - 1))
        return s
    pts = [conv_at(2 * n * m / M) for m in range(M + 1)]
    hh = 2 * n / M
    l1 = sum((pts[m] + pts[m + 1]) / 2 * hh for m in range(M))
    l2 = sum((pts[m] ** 2 + 4 * pts[m + 1] ** 2 + pts[m + 2] ** 2) * hh / 3 for m in range(0, M, 2))   # Simpson
    qf = l2 / (l1 * max(pts))
    qe = ratio([Fraction(x) for x in f])['Q']
    out['quadratureWithin1e-6'] = abs(qf - float(qe)) < 1e-6
    return out


def main():
    args = sys.argv[1:]
    E = load()
    vals = [Fraction(x) for x in E[ENTRY]]
    if len(vals) != CELLS:
        refuse('entry %s has %d values, not %d' % (ENTRY, len(vals), CELLS))
    r = ratio(vals)
    v = verdict(r, THRESHOLD)
    res = {'verdict': v, 'n': len(vals), 'domain': r['domain'], 'negatives': r['negatives']}
    if r['domain']:
        q = r['Q']
        m = q - Fraction(THRESHOLD)
        res.update({'Q30': [floor_s(q, 30), ceil_s(q, 30)], 'argmax': r['argmax'], 'decimals': r['decimals'],
                    'Qnum': str(q.numerator), 'Qden': str(q.denominator), 'margin': [floor_s(m, 30), ceil_s(m, 30)],
                    'printed0.9469': printed_as(q, THRESHOLD)})
    out = {'issue': 4, 'entry': ENTRY, 'input': os.path.basename(INPUT), 'sha256': SHA256, 'python': sys.version.split()[0], 'result': res}
    if '--controls' in args:
        C = {}
        q = r['Q']
        Q1 = list(vals)
        Q1[0] = Fraction('-1e-6')
        C['Q1'] = {'what': 'cell 0 := -1e-6', 'verdict': verdict(ratio(Q1), THRESHOLD)}
        up4 = Fraction(-((-q.numerator * 10 ** 4) // q.denominator), 10 ** 4)
        dn4 = Fraction((q.numerator * 10 ** 4) // q.denominator, 10 ** 4)
        if up4 == q:
            up4 += Fraction(1, 10 ** 4)
        C['Q2up'] = {'what': 'the least 4-decimal threshold above Q: ' + floor_s(up4, 4), 'verdict': 'CERTIFIED' if q >= up4 else 'REFUTED'}
        C['Q2down'] = {'what': 'the greatest 4-decimal threshold at or below Q: ' + floor_s(dn4, 4), 'verdict': 'CERTIFIED' if q >= dn4 else 'REFUTED'}
        Q3 = list(vals)
        big = max(range(len(Q3)), key=lambda i: Q3[i])
        Q3[big] = Q3[big] * 100
        r3 = ratio(Q3)
        C['Q3'] = {'what': 'cell %d (the largest) times 100' % big, 'verdict': verdict(r3, THRESHOLD), 'Q30': [floor_s(r3['Q'], 30), ceil_s(r3['Q'], 30)]}
        cal = {}
        for name, printed, src in CALIBRATIONS:
            rc = ratio([Fraction(x) for x in E[name]])
            cal[name] = {'cells': len(E[name]), 'printed': printed, 'source': src, 'Q30': [floor_s(rc['Q'], 30), ceil_s(rc['Q'], 30)]}
            cal[name].update(printed_as(rc['Q'], printed))
        C['Q4'] = cal
        C['Q5'] = selftests()
        out['controls'] = C
    if '--json' in args:
        print(json.dumps(out, indent=1))
        return
    print('claim #4, entry "%s" (%d cells): %s' % (ENTRY, len(vals), v))
    if r['domain']:
        print('  every value >= 0; Q = ||f*f||_2^2 / (||f*f||_1 ||f*f||_inf) in [%s, %s]' % tuple(res['Q30']))
        print('  Q - 0.9469 in [%s, %s]; the printed 0.9469 rounds Q: %s, truncates Q: %s' % (res['margin'][0], res['margin'][1], res['printed0.9469']['rounds'], res['printed0.9469']['truncates']))
    else:
        print('  %d negative value(s): not a non-negative function' % r['negatives'])
    if 'controls' in out:
        for k, c in out['controls'].items():
            if k in ('Q4', 'Q5'):
                print('  control %s: %s' % (k, json.dumps(c)))
            else:
                print('  control %s: %s -> %s' % (k, c['what'], c['verdict']))


if __name__ == '__main__':
    main()
