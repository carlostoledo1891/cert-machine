"""numbers.tex for the delta_3 paper, read from vcheck.log (the independent verifier's run) and the
certificate files — no typed decimals. Fails if the log does not say THEOREM VERIFIED."""
import json, os, re
from fractions import Fraction as Fr
H = os.path.dirname(os.path.abspath(__file__)); X = os.path.dirname(H)
log = open(os.path.join(X, 'vcheck.log')).read()
assert 'THEOREM VERIFIED' in log and 'COMPLETE' in log, 'vcheck.log does not certify the theorem'
def trunc(x, d):
    n = (x.numerator * 10**d) // x.denominator; s = str(n).rjust(d + 1, '0'); return s[:-d] + '.' + s[-d:]
def sci(x, d=2):      # truncated scientific, e.g. 2.78\cdot10^{-4}
    e = 0
    while x < 1: x *= 10; e -= 1
    return r'%s\cdot10^{%d}' % (trunc(x, d), e)
rows = []; out = []
for line in log.splitlines():
    m = re.match(r'(\S+\.json): (inner|slab) \[([^,]+), ([^\]]+)\]\s+n=(\d+)\s+VERIFIED', line)
    if not m: continue
    fn, kind, lo, hi, n = m.groups(); C = json.load(open(os.path.join(X, fn)))
    if kind == 'inner':
        nf = len(C['lam']) + len(C['N']) + sum(1 for v in C['nu'] if v != '0')
        rows.append((Fr(0), Fr(hi), int(n), r'zero gap, $E\ge0$', nf, 0)); out.append(r'\newcommand{\Rin}{%s}' % hi.replace('1/5', r'1/5'))
    else:
        nt = sum(1 for f in C['forms'] if f[0] == 'tri')
        rows.append((Fr(lo), Fr(hi), int(n), r'$E\ge %s$' % sci(Fr(C['claim'])), len(C['forms']), nt))
rows.sort()
assert rows[0][0] == 0 and rows[-1][1] == Fr(1, 2)
tab = [r'$[%s,\ %s]$ & %d & %s & %s & %s \\' % (lo, hi, n, b, f'{nf:,}', f'{nt:,}' if nt else '--') for lo, hi, n, b, nf, nt in rows]
out.append(r'\newcommand{\CoverTable}{%s}' % '\n'.join(tab))
out.append(r'\newcommand{\MinSlab}{%s}' % sci(min(Fr(json.load(open(os.path.join(X, f)))['claim'])
          for f in re.findall(r'(slab-\S+\.json): slab', log))))
out.append(r'\newcommand{\NCerts}{%d}' % len(rows))
open(os.path.join(H, 'numbers.tex'), 'w').write('\n'.join(out) + '\n')
print('\n'.join(out))
