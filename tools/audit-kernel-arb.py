#!/usr/bin/env python3
"""audit-kernel-arb.py — decide each case tools/audit-kernel-arb.js wrote, in Arb (python-flint) at 256 bits.

For each case the exact result is computed as an Arb ball from the exact binary values of the input doubles: for an
interval input, the exact range (the four operations at their endpoint combinations; a monotone function at its two
ends; sin and cos with every critical point inside the box; lnΓ with its minimum at x* when the box straddles it; P(a, z)
at its two corners). The kernel's enclosure CONTAINS the truth when Arb proves lo <= every point of the range's lower
ball and every point of the upper ball <= hi. A case whose truth Arb cannot separate from an end is counted UNDECIDED
(never as contained). A case the kernel refused counts as refused; for a malformed input that is the required answer.

usage: python3 tools/audit-kernel-arb.py cases.jsonl out.json '<meta json>'      (run by audit-kernel-arb.js)"""
import json
import sys
from collections import defaultdict

import flint
from flint import arb, ctx

ctx.prec = 256
XSTAR_DIGITS = '1.4616321449683623412626595423257213284681962040064463512959884085987864403538'   # the minimum of Γ on (0, ∞)
PRECS = (256, 1024, 4096)   # a case Arb cannot separate from an end at one precision is retried at the next
BOUNDED = ('tanh', 'sin', 'cos', 'encloseCos', 'encloseSin')


def A(s):
    """a double, exactly (Python's float() reads the shortest round-trip decimal back to the same double)"""
    return arb(float(s))


def lo_hi(vals):
    lo = vals[0]
    hi = vals[0]
    for v in vals[1:]:
        lo = lo.min(v) if hasattr(lo, 'min') else (v if v < lo else lo)
        hi = hi.max(v) if hasattr(hi, 'max') else (v if v > hi else hi)
    return lo, hi


def mn(vals):
    m = vals[0]
    for v in vals[1:]:
        m = arb.min(m, v)
    return m


def mx(vals):
    m = vals[0]
    for v in vals[1:]:
        m = arb.max(m, v)
    return m


def trig_range(f, a, b):
    """the exact range of sin or cos on [a, b]: the ends, and ±1 wherever a critical point lies inside"""
    PI = arb.pi(); HALF_PI = PI / 2
    vals = [f(a), f(b)]
    shift = arb(0) if f is arb.sin else HALF_PI          # sin's extrema at π/2 + kπ; cos's at kπ
    k0 = ((a - (HALF_PI - shift)) / PI).floor() - 1
    k1 = ((b - (HALF_PI - shift)) / PI).ceil() + 1
    lo_k, hi_k = int(k0.mid().floor().unique_fmpz()), int(k1.mid().ceil().unique_fmpz())
    if hi_k - lo_k > 8:                                   # a box wider than a period contains both extrema
        return arb(-1), arb(1)
    for k in range(lo_k, hi_k + 1):
        c = (HALF_PI - shift) + k * PI
        if c >= a and c <= b:                             # certainly inside
            vals.append(f(c))
        elif not (c < a or c > b):                        # not separated from an end: the extreme may be there
            vals.append(f(c))
    return mn(vals), mx(vals)


def truth(op, args):
    XSTAR = arb(XSTAR_DIGITS); SQRT2 = arb(2).sqrt()
    op = op[4:] if op.startswith('red:') else op           # a planted kernel is judged against the true operation
    if op in ('add', 'sub', 'mul', 'div'):
        (a0, a1), (b0, b1) = [[A(x) for x in iv] for iv in args]
        f = {'add': lambda x, y: x + y, 'sub': lambda x, y: x - y, 'mul': lambda x, y: x * y, 'div': lambda x, y: x / y}[op]
        if op == 'add':
            return a0 + b0, a1 + b1
        if op == 'sub':
            return a0 - b1, a1 - b0
        v = [f(x, y) for x in (a0, a1) for y in (b0, b1)]
        return mn(v), mx(v)
    if op in ('sqr', 'abs', 'pow'):
        a0, a1 = [A(x) for x in args[0]]
        k = 2 if op == 'sqr' else int(float(args[1])) if op == 'pow' else 1
        g = (lambda x: abs(x)) if op == 'abs' else (lambda x: x ** k)
        v = [g(a0), g(a1)]
        if (op == 'abs' or k % 2 == 0) and a0 <= 0 and a1 >= 0:
            v.append(arb(0))
        return mn(v), mx(v)
    if op in ('exp', 'log', 'tanh', 'Phi', 'digamma'):
        a0, a1 = [A(x) for x in args[0]]
        g = {'exp': arb.exp, 'log': arb.log, 'tanh': arb.tanh, 'digamma': arb.digamma,
             'Phi': lambda x: (-x / SQRT2).erfc() / 2}[op]
        return g(a0), g(a1)                               # increasing
    if op == 'trigamma':
        a0, a1 = [A(x) for x in args[0]]
        return arb(2).zeta(a1), arb(2).zeta(a0)           # decreasing on (0, ∞)
    if op == 'lgamma':
        a0, a1 = [A(x) for x in args[0]]
        v = [a0.lgamma(), a1.lgamma()]
        if not (a1 < XSTAR or a0 > XSTAR):
            v.append(XSTAR.lgamma())
        return mn(v), mx(v)
    if op == 'gammaP':
        (s0, s1), (z0, z1) = [[A(x) for x in iv] for iv in args]
        return z0.gamma_lower(s1, regularized=1), z1.gamma_lower(s0, regularized=1)   # increasing in z, decreasing in a
    if op in ('sin', 'cos'):
        a0, a1 = [A(x) for x in args[0]]
        return trig_range(arb.sin if op == 'sin' else arb.cos, a0, a1)
    if op in ('encloseCos', 'encloseSin'):
        x = A(args[0])
        v = x.cos() if op == 'encloseCos' else x.sin()
        return v, v
    raise ValueError('unknown op ' + op)


def main():
    cases_path, out_path, meta = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
    per = defaultdict(lambda: {'cases': 0, 'contained': 0, 'violations': 0, 'undecided': 0, 'refused': 0, 'widthUlps': []})
    bad = {'cases': 0, 'refused': 0, 'decided': []}
    violations = []
    for line in open(cases_path):
        c = json.loads(line)
        if c['expectRefusal']:
            bad['cases'] += 1
            if c['threw']:
                bad['refused'] += 1
            else:
                bad['decided'].append({'op': c['op'], 'args': c['args'], 'res': c['res']})
            continue
        r = per[c['op']]
        r['cases'] += 1
        if c['threw']:
            r['refused'] += 1
            continue
        lo, hi = A(c['res'][0]), A(c['res'][1])
        verdict = None
        for prec in PRECS:
            ctx.prec = prec
            tlo, thi = truth(c['op'], c['args'])
            bounded = c['op'] in BOUNDED          # |f| <= 1 everywhere: an end at or past ±1 holds by mathematics, not by Arb
            low_in = lo <= tlo or (bounded and lo <= -1)
            high_in = thi <= hi or (bounded and hi >= 1)
            if low_in and high_in:
                verdict = 'in'; break
            if (lo > tlo and not (bounded and lo <= -1)) or (thi > hi and not (bounded and hi >= 1)):
                verdict = 'out'; break
        ctx.prec = PRECS[0]
        if verdict == 'in':
            r['retried'] = r.get('retried', 0) + (prec != PRECS[0])
            r['contained'] += 1
            thin = all(isinstance(a, list) and a[0] == a[1] for a in c['args'] if isinstance(a, list))
            if thin and float(c['res'][0]) != 0 and float(c['res'][1]) != 0:
                import math
                w, m = float(c['res'][1]) - float(c['res'][0]), max(abs(float(c['res'][0])), abs(float(c['res'][1])))
                ulp = math.ulp(m) if m and math.isfinite(m) else 0
                if ulp and math.isfinite(w):
                    r['widthUlps'].append(w / ulp)
        elif verdict == 'out':
            r['violations'] += 1
            if not c['op'].startswith('red:'):
                violations.append({'op': c['op'], 'args': c['args'], 'res': c['res'], 'truth': [str(tlo), str(thi)]})
        else:
            r['undecided'] += 1
    reds = {op: per.pop(op) for op in [k for k in per if k.startswith('red:')]}
    red_fired = {op: r['violations'] > 0 for op, r in reds.items()}
    summary = {}
    for op, r in sorted(per.items()):
        w = sorted(r.pop('widthUlps'))
        r['thinWidthUlps'] = {'median': w[len(w) // 2] if w else None, 'max': w[-1] if w else None, 'n': len(w)}
        summary[op] = r
    total = sum(r['cases'] for r in summary.values())
    rec = {
        'what': 'The interval kernel checked against Arb (python-flint): every enclosure the kernel returned must contain the exact result or range, computed in Arb at 256 bits from the exact input doubles; every malformed input must be refused. Written by tools/audit-kernel-arb.js + tools/audit-kernel-arb.py.',
        'generated': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(timespec='seconds'),
        'seconds': round(__import__('time').time() - meta['t0'] / 1000, 1),
        'seed': meta['seed'], 'perOp': meta['perOp'], 'node': meta['node'], 'pythonFlint': flint.__version__, 'arbPrec': list(PRECS),
        'modules': meta['modules'],
        'counts': {'cases': total, 'contained': sum(r['contained'] for r in summary.values()), 'violations': sum(r['violations'] for r in summary.values()),
                   'undecided': sum(r['undecided'] for r in summary.values()), 'refused': sum(r['refused'] for r in summary.values()),
                   'malformed': bad['cases'], 'malformedRefused': bad['refused']},
        'redControls': {op: {'cases': r['cases'], 'violationsCaught': r['violations']} for op, r in reds.items()},
        'byOp': summary, 'malformedDecided': bad['decided'], 'violations': violations[:50]}
    json.dump(rec, open(out_path, 'w'), indent=1)
    open(out_path, 'a').write('\n')
    c = rec['counts']
    print('kernel vs Arb: %d cases — %d contained, %d VIOLATIONS, %d undecided, %d refused (in domain); malformed %d/%d refused'
          % (c['cases'], c['contained'], c['violations'], c['undecided'], c['refused'], c['malformedRefused'], c['malformed']))
    for op, r in summary.items():
        print('  %-11s %6d  contained %6d  violations %d  undecided %d  refused %d  thin width (ulps) median %s max %s'
              % (op, r['cases'], r['contained'], r['violations'], r['undecided'], r['refused'], r['thinWidthUlps']['median'], r['thinWidthUlps']['max']))
    for op, r in reds.items():
        print('  RED %-9s planted wrong kernel: %d of %d cases caught as violations — %s' % (op, r['violations'], r['cases'], 'fired' if r['violations'] else 'DID NOT FIRE'))
    sys.exit(1 if c['violations'] or c['malformedRefused'] != c['malformed'] or not all(red_fired.values()) or len(red_fired) < 2 else 0)


if __name__ == '__main__':
    main()
