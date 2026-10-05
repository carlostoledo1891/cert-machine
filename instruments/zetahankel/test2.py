"""Quadrature checks of every moment / node formula in hankel2.py, plus agreement with hankel.py."""
import mpmath as mp
from flint import fmpq
import hankel, hankel2
mp.mp.dps = 30
def wfun(k, kind):
    if kind == 'Z':
        g = lambda y: 1 / mp.expm1(2 * mp.pi * y)
    else:
        g = lambda y: 1 / mp.sinh(mp.pi * y)
    return lambda y: (-1) ** (k - 1) * y ** k * mp.diff(g, y, k - 1)
def check(k, kind):
    w = wfun(k, kind)
    I = lambda f: mp.quad(lambda y: f(y) * w(y), [0, 0.25, 1, 3, 8, 30])
    # normalisation: compare the ratio of moment e=1 to e=0 and node transforms to moment 0
    m0 = I(lambda y: 1)
    c = mp.mpf(int(hankel2.mu_mono(0, k, kind).p)) / int(hankel2.mu_mono(0, k, kind).q) / m0
    out = []
    for e in (1, 3):
        ex = hankel2.mu_mono(e, k, kind); ex = mp.mpf(int(ex.p)) / int(ex.q)
        out.append(('mom', e, mp.nstr(ex / (c * I(lambda y: y ** (2 * e))) - 1, 3)))
    if kind == 'E':
        consts = [('int', mp.zeta(k)), ('half', mp.catalan if k == 2 else (mp.zeta(k, 0.25) - mp.zeta(k, 0.75)) / 4 ** k)]
    else:
        consts = [('int', mp.zeta(k)), ('half', mp.zeta(k))]
    for nm, X in consts:
        for a in ([fmpq(1), fmpq(3), fmpq(4)] if nm == 'int' else [fmpq(1, 2), fmpq(5, 2), fmpq(7, 2)]):
            al, be = hankel2.node_value(a, k, kind)
            ex = mp.mpf(int(al.p)) / int(al.q) * X + mp.mpf(int(be.p)) / int(be.q)
            af = mp.mpf(int(a.p)) / int(a.q)
            q = c * I(lambda y: 1 / (y * y + af * af))
            out.append((nm, str(a), mp.nstr(ex / q - 1, 3)))
    print(k, kind, out)
for k in (2, 3, 5, 7):
    for kind in ('Z', 'E'):
        check(k, kind)
# agreement with the original engine on Fauzan-type data
r1, P1, _ = hankel.run(5, 24, 2, 6, verbose=False)
r2, P2, _ = hankel2.run(5, 'Z', [fmpq(j) for j in range(3, 25)], [(fmpq(a), 5) for a in (1, 2)])
print('engines agree:', P1 == P2, r1['logP_at_zeta'], r2['logP_at_X'])
