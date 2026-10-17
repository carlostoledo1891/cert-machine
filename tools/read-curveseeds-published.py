#!/usr/bin/env python3
"""read-curveseeds-published.py — the published curve parameters, read from the pinned bytes, never retyped.

Two sources, each pinned in corpus/curveseeds/PINS.json:
  FIPS 186-2 (sources/fips186-2.pdf -> sources/fips186-2.txt by pdftotext -layout; the .txt is committed so the
  parse re-runs without pdftotext; the battery re-hashes the .pdf and checks the .txt was made from it):
     the NIST prime curves P-192..P-521 (p, r, s, c, b, Gx, Gy) and the pseudo-random binary curves B-163..B-571
     (the field polynomial, r, the polynomial-basis b/Gx/Gy, and in the NORMAL basis the seed s and b — FIPS says
     that b "is the output of the SHA-1 based algorithm").
  OpenSSL crypto/ec/ec_curve.c at a pinned commit: the ANSI X9.62 example curves prime192v2/v3, prime239v1/v2/v3
     (seed, p, a, b, x, y, order), whose standard is paywalled, and the NIST curves again as a cross-check.
Writes corpus/curveseeds/published.json. Standard library only.                        cert-machine · 2026-10-16
"""
import hashlib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'corpus', 'curveseeds', 'sources')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()

# ---- 1 · FIPS 186-2 -------------------------------------------------------------------------------------------
pdf, txt = os.path.join(SRC, 'fips186-2.pdf'), os.path.join(SRC, 'fips186-2.txt')
if '--extract' in sys.argv:
    subprocess.run(['/opt/homebrew/bin/pdftotext', '-layout', pdf, txt], check=True)
lines = open(txt, encoding='utf8', errors='replace').read().split('\n')

HEXLINE = re.compile(r'^[\s0-9a-fA-F\\]+$')
KEY = re.compile(r'^\s*(p|r|s|c|b|G\s?x|G\s?y)\s*=\s*(.*)$')
def is_page_number(l): return re.fullmatch(r'\s*\d{1,3}\s*', l) is not None
def clean_hex(v): return re.sub(r'[\s\\]', '', v).lower()
def clean_dec(v): return re.sub(r'[\s\\]', '', v)

def parse_block(start, stop_re):
    """key -> raw joined value, with the basis context for binary curves"""
    out, basis, key, buf = {}, None, None, []
    def flush():
        nonlocal key, buf
        if key: out[(basis, key)] = ' '.join(buf); key, buf = None, []
    for l in lines[start:]:
        if stop_re.search(l) and not KEY.match(l): flush(); break
        if is_page_number(l) or not l.strip(): continue
        if re.match(r'^\s*Polynomial Basis:', l): flush(); basis = 'polynomial'; continue
        if re.match(r'^\s*Normal Basis:', l): flush(); basis = 'normal'; continue
        m = KEY.match(l)
        if m: flush(); key = m.group(1).replace(' ', ''); buf = [m.group(2)]; continue
        if key and HEXLINE.match(l): buf.append(l)
        elif key: flush()
    flush()
    return out

fips = {'prime': {}, 'binary': {}}
for i, l in enumerate(lines):
    m = re.match(r'^\s*Curve (P-\d+)\s*$', l)
    if m:
        blk = parse_block(i + 1, re.compile(r'^\s*(Curve [PKB]-\d+|\d\. Curves over)'))
        g = lambda k: blk[(None, k)]
        fips['prime'][m.group(1)] = {'p': clean_dec(g('p')), 'r': clean_dec(g('r')), 'seed': clean_hex(g('s')), 'c': clean_hex(g('c')),
                                     'b': clean_hex(g('b')), 'Gx': clean_hex(g('Gx')), 'Gy': clean_hex(g('Gy'))}
    m = re.match(r'^\s*Curve (B-\d+)\s*$', l)
    if m:
        blk = parse_block(i + 1, re.compile(r'^\s*(Curve [PKB]-\d+|Degree \d+ Binary Field|\d\. )'))
        fips['binary'][m.group(1)] = {'r': clean_dec(blk[(None, 'r')]),
                                      'polynomialBasis': {k: clean_hex(blk[('polynomial', k)]) for k in ('b', 'Gx', 'Gy')},
                                      'normalBasis': {k: clean_hex(blk[('normal', k)]) for k in ('s', 'b', 'Gx', 'Gy')}}
# the field polynomials
for i, l in enumerate(lines):
    m = re.match(r'^\s*p\(t\) = (.*)$', l)
    if m:
        exps = [int(x) if x else 0 for x in re.findall(r't\s*(\d+)|(?<=\+ )1\b', m.group(1))]
        exps = [int(e) for e in re.findall(r't\s*(\d+)', m.group(1))] + [0]
        name = 'B-' + str(exps[0])
        if name in fips['binary']: fips['binary'][name]['fieldPolynomial'] = exps; fips['binary'][name]['m'] = exps[0]

# ---- 2 · OpenSSL ec_curve.c ----------------------------------------------------------------------------------
cpath = os.path.join(SRC, 'openssl-ec_curve.c')
csrc = open(cpath, encoding='utf8').read()
WANT = {'_EC_X9_62_PRIME_192V2': 'prime192v2', '_EC_X9_62_PRIME_192V3': 'prime192v3', '_EC_X9_62_PRIME_239V1': 'prime239v1',
        '_EC_X9_62_PRIME_239V2': 'prime239v2', '_EC_X9_62_PRIME_239V3': 'prime239v3',
        '_EC_NIST_PRIME_192': 'P-192', '_EC_NIST_PRIME_224': 'P-224', '_EC_X9_62_PRIME_256V1': 'P-256', '_EC_NIST_PRIME_384': 'P-384', '_EC_NIST_PRIME_521': 'P-521',
        '_EC_NIST_CHAR2_163B': 'B-163', '_EC_NIST_CHAR2_233B': 'B-233', '_EC_NIST_CHAR2_283B': 'B-283', '_EC_NIST_CHAR2_409B': 'B-409', '_EC_NIST_CHAR2_571B': 'B-571'}
openssl = {}
for sym, name in WANT.items():
    m = re.search(re.escape(sym) + r'\s*=\s*\{\s*\{([^}]*)\}\s*,\s*\{(.*?)\}\s*\};', csrc, re.S)
    if not m: raise SystemExit('OpenSSL: ' + sym + ' not found')
    hdr = [x.strip() for x in m.group(1).split(',')]
    field, seed_len, param_len, cofactor = hdr[0], int(hdr[1]), int(hdr[2]), int(hdr[3])
    body = m.group(2)
    parts = re.split(r'/\*\s*([^*]+?)\s*\*/', body)          # every comment is a section label; P-256 also carries "RR for prime" / "RR for order"
    vals = {}
    for k, v in zip(parts[1::2], parts[2::2]):
        if k in ('seed', 'p', 'a', 'b', 'x', 'y', 'order'): vals[k] = ''.join('%02x' % int(h, 16) for h in re.findall(r'0x([0-9A-Fa-f]{2})', v))
    rec = {'field': field, 'seedLen': seed_len, 'paramLen': param_len, 'cofactor': cofactor}
    for k in ('seed', 'p', 'a', 'b', 'x', 'y', 'order'):
        if k in vals: rec[k] = vals[k]
    openssl[name] = rec

# ---- 3 · agreement between the two sources on the NIST curves ---------------------------------------------------
def hexint(h): return int(h, 16)
agree = {}
for name, f in fips['prime'].items():
    o = openssl[name]
    agree[name] = {'seed': f['seed'] == o['seed'], 'p': int(f['p']) == hexint(o['p']), 'b': hexint(f['b']) == hexint(o['b']),
                   'Gx': hexint(f['Gx']) == hexint(o['x']), 'Gy': hexint(f['Gy']) == hexint(o['y']), 'r': int(f['r']) == hexint(o['order']), 'a': hexint(o['a']) == int(f['p']) - 3}
for name, f in fips['binary'].items():
    o = openssl[name]
    agree[name] = {'seed(normal basis s)': (f['normalBasis']['s'] == o['seed']) if 'seed' in o else 'OpenSSL carries no seed', 'b(polynomial basis)': hexint(f['polynomialBasis']['b']) == hexint(o['b']),
                   'Gx(polynomial basis)': hexint(f['polynomialBasis']['Gx']) == hexint(o['x']), 'r': int(f['r']) == hexint(o['order']),
                   'fieldPolynomial': hexint(o['p']) == sum(1 << e for e in f['fieldPolynomial'])}

out = {
    'what': 'The published curve parameters the certificate decides against, read by tools/read-curveseeds-published.py from the pinned bytes (never retyped). FIPS 186-2 is the standard; OpenSSL\'s table is the second reading of the NIST curves and the only open source for the X9.62 example curves (ANSI X9.62-1998 is paywalled).',
    'sources': {'fips186-2.pdf': sha(pdf), 'fips186-2.txt': sha(txt), 'openssl-ec_curve.c': sha(cpath),
                'opensslCommit': open(os.path.join(SRC, 'openssl-commit.txt')).read().split()[0]},
    'fips186_2': fips, 'openssl': openssl, 'agreement': agree}
dst = os.path.join(ROOT, 'corpus', 'curveseeds', 'published.json')
json.dump(out, open(dst, 'w'), indent=1); open(dst, 'a').write('\n')
bad = [(n, k) for n, d in agree.items() for k, v in d.items() if v is False]
print('published.json written:', len(fips['prime']), 'prime,', len(fips['binary']), 'binary,', len(openssl), 'OpenSSL entries; disagreements:', bad or 'none')
for n, f in fips['prime'].items(): print(' ', n, 'seed', f['seed'], 'c', f['c'][:16] + '…', len(f['c']) * 4, 'bits')
for n, f in fips['binary'].items(): print(' ', n, 'poly', f.get('fieldPolynomial'), 'seed', f['normalBasis']['s'], 'b_normal bits', len(f['normalBasis']['b']) * 4)
