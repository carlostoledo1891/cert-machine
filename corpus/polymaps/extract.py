#!/usr/bin/env python3
"""extract.py — the polynomial maps two papers print, read from their TeX sources (both CC BY 4.0, mirrored here).

  gao-2608.00222.tex  S. Gao, "Counterexamples to the Jacobian conjecture in dimensions greater than two" (arXiv 2608.00222v1)
                      G (Thm 3.5, n = 3), F4 (Thm 4.3, n = 4), F5 (Thm 4.4, n = 4): printed in full.
  chv-2608.05392.tex  Castañeda, Honorato, Valenzuela-Henríquez, "The weak Markus–Yamabe conjecture fails in dimension 14"
                      (arXiv 2608.05392v1): the field X on R^14 (Thm 5.1), the cubic Phi on 11 variables (Prop 6.2), the
                      field X-hat on R^18 (Thm 8.1).

Each map is written to maps.json as components of exact terms [[exponents], "numerator/denominator"]. The line ranges
are fixed; `--check` re-reads the TeX and requires maps.json to be what it gives. The parser refuses any text it does
not consume (a term it cannot read is an error, never a skip).

usage: python3 corpus/polymaps/extract.py [--check]"""
import json
import os
import re
import sys
from fractions import Fraction as Fr

HERE = os.path.dirname(os.path.abspath(__file__))


def parse_tex(s, names):
    """a TeX polynomial like '\\tfrac{22}{9}x^6yz^2t^2+14x^4yz^2t-...' into {exponents: Fraction}"""
    vi = {v: i for i, v in enumerate(names)}
    s = s.replace('\\\\[2pt]', '').replace('\\\\', '').replace('&', '').replace('{}', '')
    s = re.sub(r'\s+', '', s).replace('\\tfrac', '\\frac')
    s = re.sub(r'\\frac(\d)(\d)', r'\\frac{\1}{\2}', s)
    terms = re.findall(r'([+-]?)((?:\\frac\{\d+\}\{\d+\}|\d+)?)((?:[a-z](?:_\{?\d\}?)?(?:\^\{?\d+\}?)?)*)', s)
    out, seen = {}, ''
    for sign, coef, mono in terms:
        if not coef and not mono:
            continue
        seen += sign + coef + mono
        c = Fr(1)
        if coef.startswith('\\frac'):
            a, b = re.findall(r'\{(\d+)\}', coef)
            c = Fr(int(a), int(b))
        elif coef:
            c = Fr(int(coef))
        if sign == '-':
            c = -c
        e = [0] * len(names)
        for v, k in re.findall(r'([a-z](?:_\{?\d\}?)?)(?:\^\{?(\d+)\}?)?', mono):
            e[vi[v.replace('{', '').replace('}', '')]] += int(k) if k else 1
        e = tuple(e)
        out[e] = out.get(e, 0) + c
        if out[e] == 0:
            del out[e]
    if seen != s:
        raise ValueError('unread text in a printed polynomial: ' + s[len(seen):len(seen) + 60])
    return out


def lines(tex, a, b):
    return '\n'.join(open(os.path.join(HERE, tex)).read().split('\n')[a - 1:b])


def gao_block(a, b, names):
    txt = lines('gao-2608.00222.tex', a, b).replace('\\begin{align*}', '').replace('\\end{align*}', '')
    parts = re.split(r'([A-Za-z]_?\{?[\d,]*\}?)\s*=\{\}&', txt)
    return [parse_tex(parts[i + 1], names) for i in range(1, len(parts), 2)]


def chv_block(a, b, tag, names):
    body = ' '.join(lines('chv-2608.05392.tex', a, b).split('\n'))
    body = re.sub(r'\\quad', '', body).replace(' and ', ' ')
    body = re.sub(r'\\frac(\d)(\d)', r'\\frac{\1}{\2}', body)
    body = re.sub(r'\\(begin|end)\{[a-z*]+\}', '', body)
    parts = re.split(tag + r'_\{?(\d+)\}?=\{\}&', body)
    out = {}
    for i in range(1, len(parts), 2):
        e = parts[i + 1].replace('&', '').replace('\\\\', ' ')
        e = e.strip().rstrip('.').rstrip(',').strip().rstrip('.').rstrip(',')
        out[int(parts[i])] = parse_tex(e, names)
    return [out[k] for k in sorted(out)]


def chv_x14(names):
    body = lines('chv-2608.05392.tex', 539, 556)
    body = re.sub(r'\\tfrac(\d)(\d)', r'\\frac{\1}{\2}', body)
    pr = dict(re.findall(r'X_\{?(\d+)\}?&=(.*?)(?:,?&|,?\\\\|\.\s*$)', body, re.M))
    return [parse_tex(pr[str(k)].strip().rstrip(','), names) for k in range(1, 15)]


def enc(poly):
    return sorted([list(e), str(c)] for e, c in poly.items())


def build():
    N11 = ['x', 'y', 'z', 'a', 'b', 'c', 'd', 'q', 's', 'h', 'k']
    N18 = N11 + ['v_%d' % i for i in range(1, 8)]
    N14 = ['x', 'y', 'z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'p', 'q', 'r']
    maps = {
        'G': {'vars': list('xyz'), 'src': 'gao-2608.00222.tex lines 499-504 (Thm 3.5)', 'comps': gao_block(499, 504, list('xyz'))},
        'F4': {'vars': list('xyzt'), 'src': 'gao-2608.00222.tex lines 1001-1026 (Thm 4.3)', 'comps': gao_block(1001, 1026, list('xyzt'))},
        'F5': {'vars': list('xyzt'), 'src': 'gao-2608.00222.tex lines 1263-1283 (Thm 4.4)', 'comps': gao_block(1263, 1283, list('xyzt'))},
        'X14': {'vars': N14, 'src': 'chv-2608.05392.tex lines 539-556 (Thm 5.1)', 'comps': chv_x14(N14)},
        'Phi': {'vars': N11, 'src': 'chv-2608.05392.tex lines 644-656 (Prop 6.2)', 'comps': chv_block(644, 656, r'\\Phi', N11)},
        'Xhat18': {'vars': N18, 'src': 'chv-2608.05392.tex lines 1027-1050 (Thm 8.1)', 'comps': chv_block(1027, 1050, r'\\widehat X', N18)},
    }
    for k, m in maps.items():
        m['comps'] = [enc(p) for p in m['comps']]
    return maps


if __name__ == '__main__':
    M = build()
    out = os.path.join(HERE, 'maps.json')
    if '--check' in sys.argv:
        same = json.load(open(out)) == json.loads(json.dumps(M))
        print('polymaps extract: ' + ('identical' if same else 'DIFFERS from maps.json'))
        sys.exit(0 if same else 1)
    json.dump(M, open(out, 'w'), indent=None)
    open(out, 'a').write('\n')
    print('polymaps extract: ' + ', '.join('%s %d comps %d terms' % (k, len(m['comps']), sum(len(c) for c in m['comps'])) for k, m in M.items()))
