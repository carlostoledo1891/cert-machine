#!/usr/bin/env python3
"""battery.py — the gate of the hundred pre-registered machine claims' Python runs (phase 4b).
instruments/mc100 · cert-machine

The Station's Jacobian construction (tools/run-mc100-station.py, instruments/polymaps): the ledger held to the
manifest (every row of the station-v2 pool decided or listed with what it needs, nothing else, the bytes hashing to
the pin), the decision re-derived LIVE from the pinned file and compared, the register holding the row; and red
controls that must fire — a coefficient moved, a witness moved, a printed image moved, the printed determinant
moved — each must turn the row REFUTED.

usage: python3 instruments/mc100/battery.py     exit 0 iff every check passes and every red control fires"""
import copy
import hashlib
import importlib.util
import json
import os
import sys

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
spec = importlib.util.spec_from_file_location('run_mc100_station', os.path.join(ROOT, 'tools', 'run-mc100-station.py'))
ST = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ST)

passed = failed = reds = fired = 0


def ok(c, m):
    global passed, failed
    if c:
        passed += 1
        print('PASS  ' + m)
    else:
        failed += 1
        print('FAIL  ' + m)


def red(c, m):
    global reds, fired
    reds += 1
    fired += 1 if c else 0
    ok(c, 'RED   ' + m)


def J(p):
    return json.load(open(os.path.join(ROOT, p)))


M = J('corpus/machine-claims-100.json')
print('-- the station-v2 pool, wave 1 (the Jacobian construction)')
L = J('certs/mc100-station-v2.json')
want = [r for r in M['rows'] if r['pool'] == 'station-v2']
ids = [r['id'] for r in L['rows']]
und = [u['id'] for u in L['undecided']]
ok(len(ids) + len(und) == len(want) == M['caps']['station-v2'] and set(ids) | set(und) == {w['id'] for w in want} and not set(ids) & set(und),
   'every one of the pool\'s %d rows is decided (%d) or listed undecided with a reason (%d), never both, nothing else' % (len(want), len(ids), len(und)))
ok(all(r['sha256'] == next(w['sha256'] for w in want if w['id'] == r['id']) for r in L['rows']), 'every decided row was read from bytes that hash to the manifest\'s pin')
ok(all(len(u['needs']) > 10 for u in L['undecided']), 'every undecided row says what it needs')

src = os.path.join(ROOT, 'corpus', 'station-v2', 'jacobian', 'construction.json')
raw = open(src, 'rb').read()
C = json.loads(raw.decode('utf-8'))
row = next(r for r in L['rows'] if r['id'] == 'st-jacobian')
v, k, s, d = ST.decide_jacobian(C)


def strip(dd):
    dd = copy.deepcopy(dd)
    dd.pop('seconds', None)
    for c in dd.get('checks', []):
        c.pop('seconds', None)
    return dd


ok(hashlib.sha256(raw).hexdigest() == row['sha256'] and v == row['verdict'] == 'CERTIFIED' and k == row['kind'] and s == row['scope'] and strip(d) == strip(row['decision']),
   'LIVE: st-jacobian re-decided from the pinned bytes — %s, the decision identical to the ledger\'s (det JF = %s identically, three points onto (%s))' % (v, d.get('jacobianDeterminant'), ', '.join(d.get('commonImage', []))))
ok(all(c['ok'] for c in d['checks']) and len(d['checks']) == 6, 'all six checks hold: the determinant, the degrees, the collision, the term counts, the printed images, the spot check a = 6')


def forged(edit):
    F = copy.deepcopy(C)
    edit(F)
    return ST.decide_jacobian(F)


def bump_coeff(F):
    F['reconstructed_map']['polynomials'][0][0]['coefficient'] = '7'      # 6x -> 7x


def bump_point(F):
    F['reconstructed_map']['witnesses'][1]['point'][2] = '-979/27'


def bump_image(F):
    F['reconstructed_map']['witnesses'][2]['image'][1] = '7/2'


def bump_det(F):
    F['reconstructed_map']['expected']['jacobian_determinant'] = '-5'


red(forged(bump_coeff)[0] == 'REFUTED', 'the coefficient of x in the first component moved from 6 to 7: the determinant is no longer the constant -6 — REFUTED')
red(forged(bump_point)[0] == 'REFUTED', 'one witness\'s z moved by 1/27: it no longer maps to the common image — REFUTED')
red(forged(bump_image)[0] == 'REFUTED', 'one printed image moved: the file no longer agrees with its own map — REFUTED')
red(forged(bump_det)[0] == 'REFUTED', 'the printed determinant moved to -5: the identity det JF = -5 fails — REFUTED')

R = J('certs/claims-ledger.json')
reg = next((x for x in R['rows'] if x['id'] == 'mc100-st-jacobian'), None)
ok(reg is not None and reg['verdict'] == row['verdict'] and reg['decidedFrom'] == 'certs/mc100-station-v2.json', 'the register holds mc100-st-jacobian, derived from certs/mc100-station-v2.json')

print('\nmc100 battery (python): %d pass, %d fail · red controls %d/%d fired' % (passed, failed, fired, reds))
sys.exit(1 if failed or fired != reds else 0)
