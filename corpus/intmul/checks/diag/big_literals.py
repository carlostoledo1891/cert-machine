#!/usr/bin/env python3
"""big_literals.py <export.ndjson> — diagnostic (2026-11-18): where does the export use natural-number literals of
2^24 or more, and under which constant? nanoda's memory on this export doubled about once a minute from its 70th
minute, three times; Lean's kernel evaluates Nat.pow on literals only up to an exponent of 2^24. This lists every
application whose argument is a large literal (bare, or wrapped as OfNat.ofNat T lit inst), by the head constant of
the application and the argument's position, with the first declaration emitted after it. A reading aid: it proves
nothing about what any kernel does."""
import sys, re, bisect
from array import array
from collections import Counter
sys.set_int_max_str_digits(0)   # the community export holds literals of thousands of digits
E = sys.argv[1]; BIG = 1 << 24; N = 64_000_000
fn = array('i', [-1]) * N; ar = array('i', [-1]) * N; cn = array('i', [-1]) * N
names = {0: ''}; big = {}; decl_ie = []; decl_nm = []; maxie = 0; nline = 0; samples = []
ra = re.compile(r'\{"app":\{"arg":(\d+),"fn":(\d+)\},"ie":(\d+)\}')
rc = re.compile(r'\{"const":\{"name":(\d+),')
rie = re.compile(r'"ie":(\d+)')
rn = re.compile(r'\{"in":(\d+),"(str|num)":\{"pre":(\d+),"(?:str|i)":"?(.*?)"?\}\}$')
rv = re.compile(r'\{"ie":(\d+),"natVal":"(\d+)"\}')
rdn = re.compile(r'"name":(\d+)')
with open(E, 'rb') as f:
    for raw in f:
        nline += 1
        line = raw.decode('utf-8', 'replace').rstrip('\n')
        if line.startswith('{"app"'):
            m = ra.match(line)
            if m:
                i = int(m.group(3)); ar[i] = int(m.group(1)); fn[i] = int(m.group(2)); maxie = i if i > maxie else maxie
            continue
        if line.startswith('{"in"'):
            m = rn.match(line)
            if m: names[int(m.group(1))] = (int(m.group(3)), m.group(4))
            continue
        if line.startswith('{"il"'): continue
        if line.startswith('{"const"'):
            m = rc.match(line); k = rie.search(line)
            if m and k: i = int(k.group(1)); cn[i] = int(m.group(1)); maxie = i if i > maxie else maxie
            continue
        if line.startswith('{"ie"'):
            m = rv.match(line)
            if m:
                v = int(m.group(2))
                if v >= BIG: big[int(m.group(1))] = v.bit_length()
            k = rie.match(line[1:]) or rie.search(line[:40])
            if k: i = int(k.group(1)); maxie = i if i > maxie else maxie
            continue
        k = rie.search(line)
        if k and not line.startswith('{"meta"') and ('"ie":' in line[-24:] or '"ie":' in line[:12]):
            i = int(k.group(1)); maxie = i if i > maxie else maxie
            continue
        if line.startswith('{"meta"'): continue
        m = rdn.search(line)
        decl_ie.append(maxie); decl_nm.append(int(m.group(1)) if m else -1)
        if len(samples) < 4: samples.append(line[:260])
def nm(i):
    out = []
    while i and i in names:
        p, s = names[i]; out.append(s); i = p
    return '.'.join(reversed(out))
print(f'lines {nline}; expressions up to {maxie}; names {len(names)}; declarations {len(decl_ie)}; literals >= 2^24: {len(big)}')
for s in samples: print('  declaration line sample:', s)
bl = Counter(big.values()); print('literal bit lengths (bits: count):', sorted(bl.items())[-25:])
OFNAT = {i for i in range(maxie + 1) if cn[i] >= 0 and nm(cn[i]) == 'OfNat.ofNat'}
w1 = {}  # app(app(OfNat.ofNat, T), lit)
for i in range(maxie + 1):
    a = ar[i]
    if a >= 0 and a in big:
        g = fn[i]
        if g >= 0 and fn[g] in OFNAT: w1[i] = big[a]
w2 = {}
for i in range(maxie + 1):
    g = fn[i]
    if g >= 0 and g in w1: w2[i] = w1[g]
val = dict(big); val.update(w2)
def head(i):
    d = 0
    while fn[i] >= 0: i = fn[i]; d += 1
    return (nm(cn[i]) if cn[i] >= 0 else '(not a constant)'), d
uses = []
for i in range(maxie + 1):
    a = ar[i]
    if a >= 0 and a in val:
        h, d = head(i)
        if h in ('OfNat.ofNat', 'instOfNatNat', 'instOfNat', 'instOfNatAtLeastTwo'): continue
        uses.append((val[a], h, d, i))
print(f'applications with a large literal as argument (outside the literal wrappers): {len(uses)}')
by = Counter((h, d) for _, h, d, _ in uses)
print('by head constant and argument position (1 = first argument):')
for (h, d), c in by.most_common(60): print(f'  {c:8d}  {h}  #{d}  max bits {max(b for b, hh, dd, _ in uses if hh == h and dd == d)}')
def decl_after(i):
    k = bisect.bisect_left(decl_ie, i)
    return nm(decl_nm[k]) if k < len(decl_nm) and decl_nm[k] >= 0 else '?'
POW = ('pow', 'Pow', 'shiftLeft', 'npow')
print('uses under a power-like head, largest literals first:')
pw = sorted([u for u in uses if any(p in u[1] for p in POW)], reverse=True)
seen = Counter()
for b, h, d, i in pw[:400]:
    dn = decl_after(i); key = (h, d, dn)
    seen[key] += 1
    if seen[key] == 1: print(f'  {b:6d} bits  {h} #{d}  expr {i}  first declaration after it: {dn}')
print('largest literals anywhere (bits, head, position, first declaration after):')
for b, h, d, i in sorted(uses, reverse=True)[:40]: print(f'  {b:6d}  {h} #{d}  {decl_after(i)}')
