#!/usr/bin/env python3
"""attnflow battery — the exact-Q attention theorems re-decided live, the
record walked, and reds that FIRE on the forgeries the deciders exist to
catch (a single zero passed off as double; a flow with a real crossing;
kernel slope leaking through a non-tangent perturbation)."""
import json
import os
import sys
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import attnflow as A  # noqa: E402

checks = []
reds = []
ok = lambda c, m: checks.append((bool(c), m))
red = lambda c, m: reds.append((bool(c), m))

# ---- green: every decision re-derived at every run ----
d1 = A.decide_reduced_flow()
ok(d1['multiplicityExactly2'], 'D1: the zero at c* = -1/beta has multiplicity EXACTLY 2')
ok(d1['denominatorSOS'], 'D1: denominator is a sum of two squares, positive for all real c')
ok(d1['signStructure'], 'D1: cdot > 0 on (-1,1) away from c* for beta > 1 — no crossing, ever')
d2 = A.decide_cross_weights()
ok(d2['crossWeightIdenticallyZero'] and d2['firstOrderVanishes_p2to12'],
   'D2: cross-weights identically zero; first-order vanishing for p = 2..12')
ok(d2['p1DerivativeIsOne'], 'D2: p = 1 breaks first-order vanishing — the honest boundary, recorded')
d3 = A.decide_consensus_spectrum()
ok(all(r['slopeFree'] for r in d3), 'D3: kernel slope cancels IDENTICALLY at n = 3..6 (beta/p-free)')
ok(all(r['jacobianIsMeanMinusId'] for r in d3), 'D3: consensus Jacobian is exactly vbar - v')

# ---- green: the record walk ----
p = os.path.join(ROOT, 'certs', 'attnflow-theorems.json')
ok(os.path.exists(p), 'certs/attnflow-theorems.json exists')
if os.path.exists(p):
    c = json.load(open(p))
    ok(c['verdict'] == 'VERIFIED', 'record VERIFIED')
    ok('NEVER a Transformer/softmax claim' in c['statement'] and '2312.10794' in c['statement'],
       'the softmax fence travels in the statement, with its citation')
    ok('certifying the wrong object very precisely' in c['refusalHonored'],
       'the origin\'s edge-of-chaos refusal is quoted and honored')
    arts = c['phantomCatalogue']['artifacts']
    ok(len(arts) == 4 and arts[0]['demo']['phantomEquilibriumDeclared']
       and arts[0]['demo']['exactRefutation'],
       'phantom catalogue: 4 artifacts, the locator transient re-demonstrated live and refuted exactly')
    ok(all('ORIGIN-MEASURED' in a['status'] for a in arts[1:]),
       'the budget-heavy artifacts are carried as origin-measured, never as proved here')

# ---- red controls ----
# R1: a single zero passed off as double — (1+bc)(1-c^2) divides ONCE, not twice
single = A.pmul(A.pm(2, 0, 0), A.pmul(A.ONE_BC, A.padd(A.ONE, A.pneg(A.pmul(A.C, A.C)))))
q1, r1 = A.pdivide(single, A.ONE_BC)
q2, r2 = A.pdivide(q1, A.ONE_BC)
red(r1 == {} and r2 != {}, 'a single-zero forgery fails the multiplicity-exactly-2 division test')

# R2: a flow with a REAL crossing must fail the sign structure — odd multiplicity
# changes sign at c*: evaluate the forged numerator just below and above c*
b = F(5, 2)
cstar = -1 / b
ev = lambda poly, cc: sum(v * b ** e[0] * cc ** e[1] for e, v in poly.items())
lo = ev(single, cstar - F(1, 100))
hi = ev(single, cstar + F(1, 100))
red(lo < 0 < hi, 'a genuine sign crossing (odd multiplicity) is exactly detectable (%s -> %s)'
    % ('neg', 'pos'))

# R3: the s-detector is ALIVE, not decorative.  (An earlier construction stored
# s*(deviation) in a truncating algebra and could NEVER fire — this red caught
# it.)  Two parts: (a) the s-slot survives multiplication and inversion; (b) on
# a NON-consensus two-cluster configuration — where re-weighting genuinely
# moves the drift because the base points differ — the slope symbol SURVIVES
# into the drift.  At consensus it must cancel (that is Theorem 1); off
# consensus it must not (that is why the theorem needed proving).
alive = A.Dual(2, 0, 3).inv().s == F(-3, 4) and (A.Dual(2, 0, 3) * A.Dual(5, 0, 0)).s == 15
u = [A.Dual(x) for x in (F(3, 13), F(4, 13), F(12, 13))]
w = [A.Dual(x) for x in (F(-3, 13), F(-4, 13), F(12, 13))]     # a second base point
K11 = A.Dual(2, 0, 0)                                          # self-weight k(1)
K12 = A.Dual(F(288, 169), 0, 1)                                # cross-weight with slope exposure
rowsum = K11 + K12
drift = [(K11 * u[d] + K12 * w[d]) / rowsum for d in range(3)]
leaks_off_consensus = any(drift[d].s != 0 for d in range(3))
red(alive and leaks_off_consensus,
    'the s-detector is alive: slope survives algebra and leaks in a genuine two-cluster drift')

failed = [m for c, m in checks + reds if not c]
for c, m in checks:
    print(('  ok    ' if c else '  FAIL  ') + m)
for c, m in reds:
    print(('  RED ok  ' if c else '  RED FAIL  ') + m)
print('attnflow battery: %d checks, %d red controls, %d failures'
      % (len(checks), len(reds), len(failed)))
sys.exit(1 if failed else 0)
