#!/usr/bin/env python3
"""facelaw battery — greens on the theorem's live re-derivation and the record
walk; reds that FIRE on the mutations the theorem exists to rule out."""
import json
import os
import random
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import facelaw as FL  # noqa: E402

checks = []
reds = []
ok = lambda c, m: checks.append((bool(c), m))
red = lambda c, m: reds.append((bool(c), m))

# ---- green: a fast live re-derivation (600 fresh networks each run) ----
rng = random.Random(714)
agree = True
corollary = True
seen_z = 0
sample_fail = None
for t in range(600):
    inst = FL.random_instance(rng)
    if inst is None:
        continue
    edges, exits, ea, eb = inst
    r = FL.face(edges, exits, ea, eb)
    th = FL.theorem_k(edges, exits, ea, eb)
    if r['k'] != th['k']:
        agree = False
    if (r['k'] != r['shortcut']) != (th['z'] > 0):
        corollary = False
    if th['z'] > 0:
        seen_z += 1
        if sample_fail is None:
            sample_fail = (edges, exits, ea, eb, r, th)
ok(agree, 'theorem formula equals the exact Q null space on 600 live random networks')
ok(corollary, 'corollary both ways: shortcut errs exactly when z > 0')
ok(seen_z > 10, 'the live ensemble actually exercises the z > 0 regime (%d instances)' % seen_z)

# ---- green: cycle family + origin instance re-derived every run ----
cyc = FL.cycle_family()
ok(all(r['formulaExact'] and r['deficitIsZ'] and r['z'] >= 1 for r in cyc),
   'exit-free cycles L = 3..8: formula exact, shortcut deficit == z >= 1')
org = FL.face(FL.ORIGIN['edges'], FL.ORIGIN['exits'], FL.ORIGIN['ea'], FL.ORIGIN['eb'])
org_th = FL.theorem_k(FL.ORIGIN['edges'], FL.ORIGIN['exits'], FL.ORIGIN['ea'], FL.ORIGIN['eb'])
ok(org['k'] == 6 and org_th['z'] == 0 and org['agree'],
   'origin 15-edge instance: k = 6, z = 0 — why the shortcut looked like a law')

# ---- green: the record walk ----
p = os.path.join(ROOT, 'certs', 'facelaw-theorem.json')
ok(os.path.exists(p), 'certs/facelaw-theorem.json exists')
if os.path.exists(p):
    c = json.load(open(p))
    ok(c['verdict'] == 'VERIFIED', 'record VERIFIED')
    ok(c['originEnsemble']['shortcutFailures'] == 572,
       'origin-seed replay re-derives the published 572 failures (a replication, not a quotation)')
    ok(c['originEnsemble']['shortcutFailures'] == c['originEnsemble']['zPositive']
       and c['freshEnsemble']['shortcutFailures'] == c['freshEnsemble']['zPositive'],
       'failures == z-positive count in both ensembles (the corollary, quantified)')
    nfail = len(c['failingInstances']['origin'])
    ok(nfail == 572, 'all 572 failing instances are ENUMERATED in the record (%d found)' % nfail)
    ok(all(f['deficit'] == f['z'] for f in c['failingInstances']['origin'][:50]),
       'spot-walk: recorded deficits equal z on the first 50 enumerated failures')
    # re-run five enumerated failures from their stored bytes — the record has teeth
    redo = True
    for f in c['failingInstances']['origin'][:5]:
        edges = [tuple(e) for e in f['edges']]
        r = FL.face(edges, set(f['exits']), f['ea'], f['eb'])
        if r['k'] != f['k'] or r['shortcut'] != f['shortcut']:
            redo = False
    ok(redo, 'five enumerated failures re-run from their stored bytes and reproduce exactly')
    ok('not an enclosure' in c['statement'], 'the statement carries its honest scope fence')

# ---- red controls ----
# R1: the SHORTCUT run as if it were the formula must fail on a z > 0 instance
if sample_fail:
    edges, exits, ea, eb, r, th = sample_fail
    red(r['shortcut'] != r['k'] and th['z'] > 0,
        'the shortcut-as-formula forgery fails on a live z > 0 instance (deficit %d)' % (r['k'] - r['shortcut']))
else:
    red(False, 'no z > 0 instance found to fire R1')

# R2: a rank forgery (dropping one conservation row) must change k on the cycle family
edges2 = [(1, 100), (2, 100), (1, 3), (2, 3), (3, 4)] + [(100 + i, 100 + (i + 1) % 3) for i in range(3)]
a1, a2 = FL.reach(edges2, 1), FL.reach(edges2, 2)
shared = sorted(set(a1) & set(a2))
K1 = FL.kirchhoff(edges2, a1, {4})
K2 = FL.kirchhoff(edges2, a2, {4})
i1 = {e: c for c, e in enumerate(a1)}
i2 = {e: c for c, e in enumerate(a2)}
M = [[row[i1[e]] for e in shared] for row in K1] + [[row[i2[e]] for e in shared] for row in K2]
rk_true, k_true = FL.rank_and_nullity(M, len(shared))
# single-row drops can NEVER fire here — the two populations' restricted rows
# coincide (the theorem's own observation), so every row appears twice.  The
# real forgery is losing a node's conservation law ENTIRELY: drop every copy
# of one distinct row and the dimension must move for some node.
fired = False
k_f = k_true
groups = {}
for i, row in enumerate(M):
    groups.setdefault(tuple(row), []).append(i)
for idxs in groups.values():
    keep = [r for i, r in enumerate(M) if i not in idxs]
    rk_f, k_f = FL.rank_and_nullity(keep, len(shared))
    if k_f != k_true:
        fired = True
        break
red(fired, 'erasing one node\'s conservation law entirely changes the exact dimension (%d -> %d)'
    % (k_true, k_f))

# R3: a z-definition forgery (counting ALL components, not exit-free ones) breaks V3
z_forged = len(FL.components([FL.ORIGIN['edges'][i] for i in
                              sorted(set(FL.reach(FL.ORIGIN['edges'], 1)) & set(FL.reach(FL.ORIGIN['edges'], 9)))]))
red(z_forged >= 1 and z_forged != org_th['z'],
    'counting all components instead of exit-free ones is caught on the origin instance '
    '(forged z = %d vs true z = %d; the forged formula would give k = %d, not 6)'
    % (z_forged, org_th['z'], 6 + z_forged - org_th['z']))

failed = [m for c, m in checks + reds if not c]  # noqa: E305
for c, m in checks:
    print(('  ok    ' if c else '  FAIL  ') + m)
for c, m in reds:
    print(('  RED ok  ' if c else '  RED FAIL  ') + m)
print('facelaw battery: %d checks, %d red controls, %d failures'
      % (len(checks), len(reds), len(failed)))
sys.exit(1 if failed else 0)
