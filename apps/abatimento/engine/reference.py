#!/usr/bin/env python3
"""reference.py — a SECOND implementation of the Registro de Abatimento's
arithmetic, in the Python standard library (fractions.Fraction), sharing no
code with abatimento.js. For every scenario version in data/cenarios.json it
prints the exact enclosure [lo, hi] over the corners of the premise box, the
class verdicts against the declared thresholds, and the compatibility of the
published point claim. battery.js compares these strings with the kernel's,
character for character. apps/abatimento · cert-machine                  MIT

usage: python3 apps/abatimento/engine/reference.py [cenarios.json]
"""
import json, sys, itertools
from fractions import Fraction as F
from pathlib import Path

HERE = Path(__file__).resolve().parent
src = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / 'data' / 'cenarios.json'
D = json.loads(src.read_text(encoding='utf-8'))

def q(s):
    s = str(s).strip().replace(',', '.')
    return F(s)

def tostr(x):
    x = F(x)
    return str(x.numerator) if x.denominator == 1 else f"{x.numerator}/{x.denominator}"

def enclose(c):
    P = {k: (q(b['lo']), q(b['hi'])) for k, b in c['premissas'].items()}
    for k, (lo, hi) in P.items():
        if lo > hi or lo < 0:
            raise SystemExit('premise %s invalid' % k)
    keys = list(P.keys())
    lo = hi = None
    for sides in itertools.product((0, 1), repeat=len(keys)):
        pt = {k: P[k][s] for k, s in zip(keys, sides)}
        v = F(0)
        for t in c['termos']:
            if len(set(t['vars'])) != len(t['vars']):
                raise SystemExit('term uses a premise twice')
            p = q(t.get('fator', '1'))
            for var in t['vars']:
                p *= pt[var]
            sinal = -1 if str(t.get('sinal', 1)) in ('-1', '-') else 1
            v += sinal * p
        lo = v if lo is None or v < lo else lo
        hi = v if hi is None or v > hi else hi
    return lo, hi

def classes(lo, hi):
    out = []
    decided = None
    for nome, (a, b) in D['classes'].items():
        A = q(a); B = None if b is None else q(b)
        inside = lo >= A and (B is None or hi < B)
        outside = hi < A or (B is not None and lo >= B)
        v = 'PROVADO' if inside else 'REFUTADO' if outside else 'RECUSADO'
        if inside:
            decided = nome
        out.append((nome, v))
    return out, decided

rows = []
for c in D['cenarios']:
    lo, hi = enclose(c)
    cls, decided = classes(lo, hi)
    claim = None
    af = c.get('afirmacao') or {}
    if af.get('valor') not in (None, ''):
        v = q(af['valor'])
        claim = 'COMPATÍVEL' if lo <= v <= hi else 'INCOMPATÍVEL'
    rows.append({'id': c['id'], 'versao': c['versao'], 'lo': tostr(lo), 'hi': tostr(hi), 'classes': cls, 'decidida': decided, 'afirmacao': claim})
print(json.dumps(rows, ensure_ascii=False))
