#!/usr/bin/env python3
# X1, reconstruction A (cert-machine, omega = 9/4 lane): exact checks of the printed local identities and counts of
# Zhi-Wei Sun, arXiv:2610.13971v1, Theorem 1.3(a) (M_32 <| D_16 [x] S_2048).  Stdlib only; run as
#   python3 -I x1a.py <path/to/P102Final.tex> <outdir>
# The TeX is read as TEXT only (to cross-check the hand transcription below); nothing in it is executed.
# Every decision is exact: Fraction arithmetic over Q, integer arithmetic over F_2, F_3 and F_p.
import sys, os, re, json, random, hashlib
from fractions import Fraction as Fr

TEX, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
RESULTS = []          # (id, ok, summary, details)
LOG = []


def log(*a):
    s = ' '.join(str(x) for x in a)
    LOG.append(s)
    print(s, flush=True)


def record(cid, ok, summary, details=None):
    RESULTS.append({'id': cid, 'ok': bool(ok), 'summary': summary, 'details': details})
    log(('PASS ' if ok else 'FAIL ') + cid + ': ' + summary)


with open(TEX, 'rb') as fh:
    TEXB = fh.read()
TEX_SHA = hashlib.sha256(TEXB).hexdigest()
TEXL = TEXB.decode('utf-8').split('\n')          # TEXL[i-1] is TeX line i


def lines(a, b):
    return '\n'.join(TEXL[a - 1:b])

# ---------------------------------------------------------------- F_2^k helpers (bit i <-> e_{i+1})


def ip(u, v):
    return bin(u & v).count('1') & 1


def chi(u, v):
    return -1 if ip(u, v) else 1


def linmap(images):
    def f(x):
        r = 0
        for i, im in enumerate(images):
            if (x >> i) & 1:
                r ^= im
        return r
    return f


def linmap_T(images):
    # <T^T c, b> = <c, T b>: bit i of T^T c is <c, T e_i>
    def f(c):
        r = 0
        for i, im in enumerate(images):
            if ip(c, im):
                r |= 1 << i
        return r
    return f


def matvec2(rows, s):
    r = 0
    for i, row in enumerate(rows):
        b = 0
        for j, a in enumerate(row):
            if a and (s >> j) & 1:
                b ^= 1
        if b:
            r |= 1 << i
    return r


def rank_f2(vecs):
    basis = []
    for v in vecs:
        for b in basis:
            v = min(v, v ^ b)
        if v:
            basis.append(v)
    return len(basis)

# ---------------------------------------------------------------- rational / modular linear algebra


def mat_rank(M, p=None):
    A = [[(Fr(x) if p is None else int(x) % p) for x in row] for row in M]
    if not A:
        return 0
    n, m, r = len(A), len(A[0]), 0
    for c in range(m):
        piv = None
        for i in range(r, n):
            if A[i][c] != 0:
                piv = i
                break
        if piv is None:
            continue
        A[r], A[piv] = A[piv], A[r]
        inv = (1 / A[r][c]) if p is None else pow(A[r][c], p - 2, p)
        A[r] = [(x * inv) if p is None else (x * inv) % p for x in A[r]]
        for i in range(n):
            if i != r and A[i][c] != 0:
                f = A[i][c]
                A[i] = [(x - f * y) if p is None else (x - f * y) % p for x, y in zip(A[i], A[r])]
        r += 1
    return r


def mat_mul(A, B, p=None):
    n, m, k = len(A), len(B), len(B[0])
    out = [[0] * k for _ in range(n)]
    for i in range(n):
        for j in range(k):
            s = 0
            for l in range(m):
                s += A[i][l] * B[l][j]
            out[i][j] = s if p is None else s % p
    return out


def T_(A):
    return [list(r) for r in zip(*A)]


def det(M):
    A = [[Fr(x) for x in r] for r in M]
    n, d = len(A), Fr(1)
    for c in range(n):
        piv = next((i for i in range(c, n) if A[i][c] != 0), None)
        if piv is None:
            return Fr(0)
        if piv != c:
            A[c], A[piv] = A[piv], A[c]
            d = -d
        d *= A[c][c]
        for i in range(c + 1, n):
            f = A[i][c] / A[c][c]
            A[i] = [x - f * y for x, y in zip(A[i], A[c])]
    return d


def inv(M):
    n = len(M)
    A = [[Fr(x) for x in r] + [Fr(int(i == j)) for j in range(n)] for i, r in enumerate(M)]
    for c in range(n):
        piv = next(i for i in range(c, n) if A[i][c] != 0)
        A[c], A[piv] = A[piv], A[c]
        f = A[c][c]
        A[c] = [x / f for x in A[c]]
        for i in range(n):
            if i != c and A[i][c] != 0:
                g = A[i][c]
                A[i] = [x - g * y for x, y in zip(A[i], A[c])]
    return [r[n:] for r in A]

# ---------------------------------------------------------------- Laurent tensor engine
# A Laurent vector is {(degree, key): coeff}; a term is (coef, LX, LY, LZ); expand() returns {degree: {(kx,ky,kz): coeff}}.


def expand(terms):
    out = {}
    for coef, LX, LY, LZ in terms:
        if coef == 0:
            continue
        for (da, ka), ca in LX.items():
            for (db, kb), cb in LY.items():
                for (dc, kc), cc in LZ.items():
                    T = out.setdefault(da + db + dc, {})
                    k = (ka, kb, kc)
                    T[k] = T.get(k, 0) + coef * ca * cb * cc
    res = {}
    for d in sorted(out):
        T = {k: v for k, v in out[d].items() if v != 0}
        if T:
            res[d] = T
    return res


def lv(*items):  # lv((deg, key, coeff), ...)
    v = {}
    for d, k, c in items:
        v[(d, k)] = v.get((d, k), 0) + Fr(c)
    return {k: c for k, c in v.items() if c != 0}


def compose(L, sub):
    """Post-compose a Laurent vector with a degree-zero linear map: sub[key] = {newkey: coeff}; absent keys kept."""
    out = {}
    for (d, k), c in L.items():
        for nk, nc in sub.get(k, {k: 1}).items():
            out[(d, nk)] = out.get((d, nk), 0) + c * Fr(nc)
    return {k: c for k, c in out.items() if c != 0}


def tensor_eq(A, B):
    keys = set(A) | set(B)
    diff = {k: (A.get(k, 0), B.get(k, 0)) for k in keys if A.get(k, 0) != B.get(k, 0)}
    return len(diff) == 0, diff


def cw_monos(q):
    m = []
    for i in range(1, q + 1):
        m += [((0, i, i), 'A%d' % i), ((i, 0, i), 'B%d' % i), ((i, i, 0), 'C%d' % i)]
    m += [((0, 0, 'inf'), 'P'), ((0, 'inf', 0), 'Q'), (('inf', 0, 0), 'R')]
    return m


def cw_tensor(q, tag=''):
    return {((tag, a), (tag, b), (tag, c)): Fr(1) for (a, b, c), _ in cw_monos(q)}


def source_terms(monos, MX, MY, MZ):
    # monos: list of ((a,b,c), coef); M*: colour -> Laurent vector
    return [(Fr(c), MX.get(a, {}), MY.get(b, {}), MZ.get(cc, {})) for (a, b, cc), c in monos]

# ================================================================ transcription (hand) + cross-check against the TeX


def tex_num(tok):
    tok = tok.strip().strip('$').strip()
    m = re.fullmatch(r'(-?)\\t?frac\{?(\d+)\}?\{?(\d+)\}?', tok)
    if m:
        return Fr(int(m.group(2)), int(m.group(3))) * (-1 if m.group(1) else 1)
    return Fr(int(tok))


def parse_pmatrices(a, b):
    txt = lines(a, b)
    mats = []
    for body in re.findall(r'\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}', txt, re.S):
        rows = [r for r in body.split('\\\\') if r.strip()]
        mats.append([[tex_num(e) for e in r.split('&')] for r in rows])
    return mats


TRANS = {}   # name -> (hand, parsed)

PACKETS = [  # label, lambda, s, chi, type, retained supports   (l. 1509-1540)
    (0, 0, 0, 0, 3, ''), (1, 1, 1, 10, 2, 'A1,B1,B2,C1,P,Q,R'), (2, 0, 1, 2, 2, ''),
    (3, 1, 0, 0, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (4, 1, 3, 11, 2, 'A1,A2,B1,C1,P,Q,R'), (5, 0, 2, 5, 3, ''),
    (6, 1, 2, 1, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (7, 0, 3, 7, 3, 'C1'), (8, 0, 4, 10, 2, 'C1'),
    (9, 1, 5, 15, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (10, 0, 5, 8, 3, ''), (11, 1, 4, 5, 3, 'A1,A3,B1,B2,C1,P,Q,R'),
    (12, 1, 7, 14, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (13, 0, 6, 15, 3, ''), (14, 1, 6, 4, 3, 'A1,A3,B1,B2,C1,P,Q,R'),
    (15, 0, 7, 13, 2, ''), (16, 0, 8, 1, 2, ''), (17, 1, 9, 8, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (18, 0, 9, 3, 3, ''),
    (19, 1, 8, 2, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (20, 1, 11, 9, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (21, 0, 10, 4, 3, ''),
    (22, 1, 10, 3, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (23, 0, 11, 6, 2, 'C1'), (24, 0, 12, 11, 3, 'C1'),
    (25, 1, 13, 13, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (26, 0, 13, 9, 3, ''), (27, 1, 12, 7, 2, 'A1,A2,B1,C1,P,Q,R'),
    (28, 1, 15, 12, 3, 'A1,A3,B1,B2,C1,P,Q,R'), (29, 0, 14, 14, 2, ''), (30, 1, 14, 6, 2, 'A1,B1,B2,C1,P,Q,R'),
    (31, 0, 15, 12, 3, ''),
]


def parse_packet_rows(a, b, ncol):
    out = []
    for L in TEXL[a - 1:b]:
        L = L.strip()
        if not re.match(r'^\d+&', L):
            continue
        cells = [c.strip() for c in L.rstrip('\\').split('&')]
        typ = 2 if 'CW_2' in cells[ncol - 2] else 3
        sup = cells[ncol - 1].strip('$').replace('_', '').replace(' ', '')
        sup = '' if sup in ('--', '') else sup
        out.append(tuple(int(c) for c in cells[:ncol - 2]) + (typ, sup))
    return out


PARSED_PACKETS = parse_packet_rows(1509, 1540, 6)
TRANS['packet table l.1509-1540'] = (PACKETS == PARSED_PACKETS)
PARSED_A3 = parse_packet_rows(3701, 3720, 5)  # App A.3 repeat: p, l, chi, type, supports
TRANS['App A.3 repeat l.3701-3720 vs main table'] = all(
    (p, l, c, ty, su) == (PACKETS[p][0], PACKETS[p][1], PACKETS[p][3], PACKETS[p][4], PACKETS[p][5])
    for (p, l, c, ty, su) in PARSED_A3) and len(PARSED_A3) == 20

A0 = [[0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 0], [0, 0, 1, 0]]
A1 = [[0, 1, 1, 0], [1, 0, 0, 1], [0, 0, 1, 0], [1, 0, 0, 0]]
pm = parse_pmatrices(1482, 1488)
TRANS['A_0, A_1 l.1482-1488'] = (pm == [A0, A1])
pm = parse_pmatrices(3657, 3662)
TRANS['A_0, A_1 repeat l.3657-3662'] = (pm == [A0, A1])
KIMG = (2, 5, 8, 16)
B0IMG, B1IMG = (9, 4, 8, 6), (8, 6, 4, 9)
TRANS['k, B_0, B_1 l.1490,1584'] = ('(2,5,8,16)' in TEXL[1489] and 'B_0=(9,4,8,6),\\qquad B_1=(8,6,4,9)' in TEXL[1583])
TRANS['K, B_0, B_1 repeat l.3666'] = ('K=(2,5,8,16),\\qquad B_0=(9,4,8,6),\\qquad B_1=(8,6,4,9)' in TEXL[3665])
THETA = {'A1': 3, 'A2': 0, 'A3': 0, 'B1': 5, 'B2': 9, 'B3': 0, 'C1': 6, 'C2': 9, 'C3': 0, 'P': 10, 'Q': 12, 'R': 15}
TRANS['Theta l.1590 and l.3673'] = ('3&0&0&5&9&0&6&9&0&10&12&15' in TEXL[1589].replace(' ', '') and
                                    '3&0&0&5&9&0&6&9&0&10&12&15' in TEXL[3672].replace(' ', ''))
SIDECOL = {'X': {0: 0, 1: 5, 2: 9, 3: 0, 'inf': 15}, 'Y': {0: 0, 1: 3, 2: 0, 3: 0, 'inf': 12},
           'Z': {0: 0, 1: 0, 2: 0, 3: 0, 'inf': 10}}
TRANS['side-colour twists l.3681-3683'] = (TEXL[3680].replace(' ', '').startswith('X&0&5&9&0&15') and
                                            TEXL[3681].replace(' ', '').startswith('Y&0&3&0&0&12') and
                                            TEXL[3682].replace(' ', '').startswith('Z&0&0&0&0&10'))
LAMIMG = (1, 2, 12)
UX, UY, UZ = (2, 4, 8, 3), (4, 8, 3, 6), (7, 14, 15, 13)
TRANS['U_X,U_Y,U_Z l.2008-2010'] = ('U_X=(2,4,8,3)' in TEXL[2007] and 'U_Y=(4,8,3,6)' in TEXL[2008] and
                                     'U_Z=(7,14,15,13)' in TEXL[2009])
XI = {6, 7, 10, 11}

FB = [[0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [2, 0, 0, 0, 0, -1, 1, 0, 0, 0], [2, 0, 0, 0, 0, -1, 0, 1, 0, 0], [2, 0, 0, 0, 0, -1, 0, 0, 1, 0],
      [2, 0, 0, 0, 0, -1, 0, 0, 0, 1]]
h, q4 = Fr(1, 2), Fr(1, 4)
FD = [[0, 0, 0, 0, 0, 0, 1, 0, 0, -1], [0, 0, 0, 0, 0, 0, 0, 1, 0, -1], [0, 0, 0, 0, 0, 0, 0, 0, 1, -1],
      [0, 1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
      [-h, -1, -1, -1, 0, q4, 0, 0, 0, -q4]]
Fc = [1, 0, 0, 0, 0, h, 0, 0, 0, -h]
FB = [[Fr(x) for x in r] for r in FB]
FD = [[Fr(x) for x in r] for r in FD]
Fc = [Fr(x) for x in Fc]
pm = parse_pmatrices(1803, 1826)
TRANS['five-empty B, D l.1805-1825'] = (pm == [FB, FD])
TRANS['five-empty c l.1801'] = ('c=\\bigl(1,0,0,0,0,\\tfrac12,0,0,0,-\\tfrac12\\bigr)' in TEXL[1800].replace(' ', ''))
pm = parse_pmatrices(3856, 3877)
TRANS['five-empty B, D repeat l.3858-3877'] = (pm == [FB, FD])

BCOV = {6: (-1, 1, -1, 3, 0, -1, -1, -1), 7: (-1, 1, -1, -1, 4, 0, -1, -1, -1),
        10: (-1, 1, -1, 2, 0, -1, 0, -1), 11: (-1, 1, -1, -1, 3, 0, -1, -1, -1)}
parsed_b = {}
for L in TEXL[4406:4410]:
    m = re.search(r'b_\{?(\d+)\}?&=\(([-\d,]+)\)', L.replace(' ', ''))
    if m:
        parsed_b[int(m.group(1))] = tuple(int(x) for x in m.group(2).split(','))
TRANS['barred covectors l.4407-4410'] = (parsed_b == BCOV)
EXC = {6: ('X', [(23, 2), (30, 2)], 3), 7: ('X', [(7, 3), (27, 2)], 4),
       10: ('Y', [(8, 2), (1, 2)], 3), 11: ('Y', [(24, 3), (4, 2)], 4)}
t3, t2, t4 = Fr(1, 3), Fr(1, 2), Fr(1, 4)
EG = {
    6: ([[-t3, 1, 0, 0, 0, 0, 0, 0], [t3, 0, 1, 0, 0, 0, 0, 0], [t3, 0, 0, 1, 0, 0, 0, 0]],
        [[t2, -1, 0, -1, Fr(3, 2), 0, 0, 0], [0, 0, -1, 1, 0, 0, 0, 0], [-1, -1, 1, -5, 0, 0, 0, 0]]),
    7: ([[-t4, 1, 0, 0, 0, 0, 0, 0, 0], [t4, 0, 1, 0, 0, 0, 0, 0, 0], [t4, 0, 0, 1, 0, 0, 0, 0, 0],
         [t4, 0, 0, 0, 1, 0, 0, 0, 0]],
        [[1, -1, 0, 0, -1, 2, 0, 0, 0], [0, 0, -1, 0, 1, 0, 0, 0, 0], [0, 0, 0, -1, 1, 0, 0, 0, 0],
         [-1, -1, 1, 1, -7, 0, 0, 0, 0]]),
    10: ([[-t2, 1, 0, 0, 0, 0, 0, 0], [t2, 0, 1, 0, 0, 0, 0, 0], [t2, 0, 0, 1, 0, 0, 0, 0]],
         [[1, -1, 0, -1, 2, 0, 0, 0], [0, 0, -1, 1, 0, 0, 0, 0], [-1, -1, 1, -4, 0, 0, 0, 0]]),
    11: ([[-t3, 1, 0, 0, 0, 0, 0, 0, 0], [t3, 0, 1, 0, 0, 0, 0, 0, 0], [t3, 0, 0, 1, 0, 0, 0, 0, 0],
          [t3, 0, 0, 0, 1, 0, 0, 0, 0]],
         [[t2, -1, 0, 0, -1, Fr(3, 2), 0, 0, 0], [0, 0, -1, 0, 1, 0, 0, 0, 0], [0, 0, 0, -1, 1, 0, 0, 0, 0],
          [-1, -1, 1, 1, -6, 0, 0, 0, 0]]),
}
EG = {k: ([[Fr(x) for x in r] for r in a], [[Fr(x) for x in r] for r in b]) for k, (a, b) in EG.items()}
pm = parse_pmatrices(4420, 4479)
TRANS['generic E_L, E_R l.4425-4477'] = (pm == [EG[6][0], EG[6][1], EG[7][0], EG[7][1], EG[10][0], EG[10][1],
                                                 EG[11][0], EG[11][1]])
ET = {
    6: ([[1, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0]],
        [[1, 0, 0, 2, 1, 0, 0, 0], [0, 0, 2, 1, 0, 0, 0, 0], [2, 2, 1, 1, 0, 0, 0, 0]]),
    7: ([[2, 1, 0, 0, 0, 0, 0, 0, 0], [1, 0, 1, 0, 0, 0, 0, 0, 0], [1, 0, 0, 1, 0, 0, 0, 0, 0],
         [1, 0, 0, 0, 1, 0, 0, 0, 0]],
        [[1, 2, 0, 0, 2, 2, 0, 0, 0], [0, 0, 2, 0, 1, 0, 0, 0, 0], [0, 0, 0, 2, 1, 0, 0, 0, 0],
         [2, 2, 1, 1, 2, 0, 0, 0, 0]]),
    10: ([[1, 1, 0, 0, 0, 0, 0, 0], [2, 0, 1, 0, 0, 0, 0, 0], [2, 0, 0, 1, 0, 0, 0, 0]],
         [[1, 2, 0, 2, 2, 0, 0, 0], [0, 0, 2, 1, 0, 0, 0, 0], [2, 2, 1, 2, 0, 0, 0, 0]]),
    11: ([[1, 0, 0, 0, 0, 0, 0, 0, 0], [0, 1, 1, 0, 0, 0, 0, 0, 0], [0, 1, 0, 1, 0, 0, 0, 0, 0],
          [0, 1, 0, 0, 1, 0, 0, 0, 0]],
         [[1, 0, 0, 0, 2, 1, 0, 0, 0], [0, 0, 2, 0, 1, 0, 0, 0, 0], [0, 0, 0, 2, 1, 0, 0, 0, 0],
          [2, 2, 1, 1, 0, 0, 0, 0, 0]]),
}
pm = parse_pmatrices(4484, 4543)
TRANS['F_3 tilde E_L, E_R l.4489-4541'] = (pm == [[[Fr(x) for x in r] for r in m] for k in (6, 7, 10, 11)
                                                   for m in ET[k]])
SA_A = [[1, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 0]]
SA_R = [[0, 0, 1], [0, 1, 0], [1, 0, 0]]
pm = parse_pmatrices(1719, 1727)
TRANS['singular-active A, R l.1719,1727'] = (pm == [[[Fr(x) for x in r] for r in SA_A],
                                                     [[Fr(x) for x in r] for r in SA_R]])
M0 = [[1, 1, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]
pm = parse_pmatrices(1912, 1917)
TRANS['active slice M_0 l.1912-1917'] = (pm == [[[Fr(x) for x in r] for r in M0]])

record('T0 transcription', all(TRANS.values()),
       '%d/%d hand transcriptions equal the values parsed from the TeX text' % (sum(TRANS.values()), len(TRANS)),
       {k: v for k, v in TRANS.items()})

# ================================================================ C1, C2, S1: defect fibres, orbit bijection, T_0 = G_H4 [x] M_2


def lab(u):  # u = (q, eps, a)
    return u


OMEGA = [(q, e, a) for q in range(16) for e in (0, 1) for a in (0, 1)]


def defect(u, v, w):
    (q, e, a), (r, d, b), (s, f, c) = u, v, w
    return (q ^ r ^ s, b ^ a ^ e, f ^ e ^ d, c ^ a ^ e ^ d)


fib = {}
zero = []
for u in OMEGA:
    for v in OMEGA:
        for w in OMEGA:
            dd = defect(u, v, w)
            fib[dd] = fib.get(dd, 0) + 1
            if dd == (0, 0, 0, 0):
                zero.append((u, v, w))
Z0 = (0, 0, 0)
nz = sum(1 for (u, v, w) in zero if Z0 not in (u, v, w))
onebar = [sum(1 for t in zero if t[i] == Z0 and t[(i + 1) % 3] != Z0 and t[(i + 2) % 3] != Z0) for i in range(3)]
cubic = sum(1 for t in zero if t == (Z0, Z0, Z0))
two_zero_one_nonzero = sum(1 for t in zero if sum(x == Z0 for x in t) == 2)
record('C1 Lemma fibres32', len(fib) == 128 and set(fib.values()) == {2048} and len(zero) == 2048 and nz == 1954
       and onebar == [31, 31, 31] and cubic == 1 and two_zero_one_nonzero == 0,
       '128 fibres of %s elements; zero fibre %d = %d all-nonzero + %s one-bar + %d cubic' %
       (sorted(set(fib.values())), len(zero), nz, onebar, cubic))

# eq. completion32 (l. 1290-1302): the canonical completion tensor equals the one-bar part of the zero fibre plus the cubic
comp = set()
for qq in range(16):
    for ee in (0, 1):
        if (qq, ee) == (0, 0):
            continue
        comp.add((Z0, (qq, ee, 0), (qq, ee, ee)))
        comp.add(((qq, ee, ee), Z0, (qq, ee, 0)))
        comp.add(((qq, ee, 0), (qq, ee, ee), Z0))
comp.add((Z0, Z0, Z0))
zero_comp = {t for t in zero if Z0 in t}
record('C1b completion tensor eq. completion32', comp == zero_comp and len(comp) == 94,
       'the 94 printed completion triples are exactly the zero-fibre triples with a zero label: %s' % (comp == zero_comp))

cyc = set()
okform = True
for (u, v, w) in zero:
    (q, e, a), (r, d, b), (s, f, c) = u, v, w
    for hh in range(16):
        X = ((hh, a), (hh ^ q, a ^ e))
        g = hh ^ q
        Y = ((g, b), (g ^ r, b ^ d))
        g2 = hh ^ q ^ r
        Z = ((g2, c), (g2 ^ s, c ^ f))
        if not (X[1] == Y[0] and Y[1] == Z[0] and Z[1] == X[0]):
            okform = False
        cyc.add((X[0], Y[0], Z[0]))
record('C2 Prop orbit32', okform and len(cyc) == 32 ** 3,
       '16*2048 row-translated monomials are cycles x_ij y_jk z_ki: %s; distinct cycles %d (32^3 = %d)' %
       (okform, len(cyc), 32 ** 3))

img = set()
okS1 = True
for (u, v, w) in zero:
    (q, e, a), (r, d, b), (s, f, c) = u, v, w
    X2, Y2, Z2 = (a, a ^ e), (b, b ^ d), (c, c ^ f)
    if not (q ^ r ^ s == 0 and X2[1] == Y2[0] and Y2[1] == Z2[0] and Z2[1] == X2[0]):
        okS1 = False
    img.add(((q, r, s), X2, Y2, Z2))
target = {((q, r, q ^ r), (i, j), (j, k), (k, i)) for q in range(16) for r in range(16)
          for i in (0, 1) for j in (0, 1) for k in (0, 1)}
# Fourier: G_H4 = (1/16) sum_c (sum_q chi(c,q) x_q)(sum_r chi(c,r) y_r)(sum_s chi(c,s) z_s)
G = {}
for cc in range(16):
    for q in range(16):
        for r in range(16):
            for s in range(16):
                k = (q, r, s)
                G[k] = G.get(k, 0) + Fr(chi(cc, q) * chi(cc, r) * chi(cc, s), 16)
G = {k: v for k, v in G.items() if v != 0}
okG = G == {(q, r, q ^ r): 1 for q in range(16) for r in range(16)}
record('S1 T_0 = G_H4 [x] M_2, G_H4 = D_16 by Fourier', okS1 and img == target and okG,
       'relabeling u=(q,e,a)->(q;a,a+e) maps the 2048 zero-fibre triples bijectively onto {q+r+s=0} x {M_2 cycles}: %s;'
       ' Fourier identity G_H4 = (1/16) sum of 16 rank-one terms: %s' % (okS1 and img == target, okG))

# ================================================================ C4, C5: packet table, masks, restrictions
kf = linmap(KIMG)
okrows, bad = True, []
for (p, l, s, c, ty, sup) in PACKETS:
    pp = kf(s) ^ (3 * l)
    cc = matvec2(A1 if l else A0, s)
    if pp != p or cc != c:
        okrows = False
        bad.append((p, pp, c, cc))
labels_once = sorted(kf(s) ^ (3 * l) for s in range(16) for l in (0, 1)) == list(range(32))
chars_per_layer = all(sorted(matvec2(A1 if l else A0, s) for s in range(16)) == list(range(16)) for l in (0, 1))
int_reading_row1 = (KIMG[0] + 3 == 1)
ntype = (sum(1 for r in PACKETS if r[4] == 3), sum(1 for r in PACKETS if r[4] == 2))
record('C4a packet table vs formulas', okrows and labels_once and chars_per_layer and not int_reading_row1,
       'p = k(s) XOR 3*lambda and chi = A_lambda s reproduce all 32 rows: %s (bad %s); labels once: %s; each layer runs '
       'through all 16 characters: %s; integer "+" would reproduce row 1: %s' %
       (okrows, bad, labels_once, chars_per_layer, int_reading_row1))
record('C4b type count', ntype == (22, 10), 'types %d CW_3 + %d CW_2 (printed 22 + 10)' % ntype)


def rule_mask(l, c):
    if l == 0:
        return {'C1'} if c in XI else set()
    if c in (6, 10):
        return {'A1', 'B1', 'B2', 'C1', 'P', 'Q', 'R'}
    if c in (7, 11):
        return {'A1', 'A2', 'B1', 'C1', 'P', 'Q', 'R'}
    return {'A1', 'A3', 'B1', 'B2', 'C1', 'P', 'Q', 'R'}


okmask, badmask = True, []
for (p, l, s, c, ty, sup) in PACKETS:
    m = set(sup.split(',')) if sup else set()
    names = {nm for _, nm in cw_monos(ty)}
    if m != rule_mask(l, c) or not m <= names:
        okmask = False
        badmask.append(p)
n_ident = sum(len(cw_monos(r[4])) for r in PACKETS)
n_ret = sum(len(r[5].split(',')) if r[5] else 0 for r in PACKETS)
per_char = {c: sum(len(r[5].split(',')) if r[5] else 0 for r in PACKETS if r[3] == c) for c in range(16)}
record('C4c masks', okmask and n_ident == 354 and n_ret == 128 and set(per_char.values()) == {8},
       'table masks = Xi rule and exist in the packet type: %s (bad %s); packet-support identities %d (printed 354); '
       'retained supports %d; retained per character %s' % (okmask, badmask, n_ident, n_ret, sorted(set(per_char.values()))))

GTAB = {(): (0, 0, 0), ('A',): (0, 1, 1), ('B',): (1, 0, 1), ('C',): (1, 1, 0), ('A', 'B', 'C'): (1, 1, 1)}


def restriction(ty, sup, xscale_sat=Fr(1)):
    m = set(sup.split(',')) if sup else set()
    x = {0: Fr(1, 128), 'inf': Fr(1, 128) * ('R' in m)}
    y = {0: Fr(1), 'inf': Fr(int('Q' in m))}
    z = {0: Fr(1), 'inf': Fr(int('P' in m))}
    for i in range(1, ty + 1):
        g = tuple(L for L in 'ABC' if ('%s%d' % (L, i)) in m)
        if g not in GTAB:
            raise ValueError('G_i pattern not in the printed table: %s' % (g,))
        xi, yi, zi = GTAB[g]
        x[i], y[i], z[i] = Fr(xi) * xscale_sat, Fr(yi), Fr(zi)
    return x, y, z


def restr_coeffs(xscale_sat):
    out = {}
    for (p, l, s, c, ty, sup) in PACKETS:
        x, y, z = restriction(ty, sup, xscale_sat)
        for (a, b, cc), nm in cw_monos(ty):
            out[(p, nm)] = x[a] * y[b] * z[cc]
    return out


for nm_read, sc in (('literal (as printed)', Fr(1)), ('alternate G3\' (x_i scaled 1/128)', Fr(1, 128))):
    co = restr_coeffs(sc)
    wrong_ret, wrong_om = [], []
    for (p, l, s, c, ty, sup) in PACKETS:
        m = set(sup.split(',')) if sup else set()
        for _, nm in cw_monos(ty):
            v = co[(p, nm)]
            if nm in m and v != Fr(1, 128):
                wrong_ret.append((p, nm, str(v)))
            if nm not in m and v != 0:
                wrong_om.append((p, nm, str(v)))
    byname = {}
    for (p, nm, v) in wrong_ret:
        byname[nm[0]] = byname.get(nm[0], 0) + 1
    record('C5 scalar restriction, %s' % nm_read, not wrong_ret and not wrong_om,
           'retained supports with coefficient != 1/128: %d %s; omitted supports with nonzero coefficient: %d' %
           (len(wrong_ret), dict(sorted(byname.items())), len(wrong_om)),
           {'retained_wrong': wrong_ret, 'omitted_wrong': wrong_om})

# ================================================================ C6: B_0, B_1, Lambda, chart representatives
B0, B1 = linmap(B0IMG), linmap(B1IMG)
B0T, B1T = linmap_T(B0IMG), linmap_T(B1IMG)
SB = linmap(tuple(x ^ y for x, y in zip(B0IMG, B1IMG)))
ker = [b for b in range(16) if SB(b) == 0]
LAM = linmap(LAMIMG)
reps_ok = True
reps0 = None
for dH in range(16):
    for dl in range(8):
        sols = [(rho, be) for rho in range(16) for be in range(16) if rho ^ B0(be) == dH and SB(be) == LAM(dl)]
        if len(sols) != 2:
            reps_ok = False
        if dH == 0 and dl == 0:
            reps0 = sols
record('C6 B_0, B_1, Lambda', B0(15) == 3 and ker == [0, 15] and reps_ok and reps0 == [(0, 0), (3, 15)]
       and rank_f2([LAM(1), LAM(2), LAM(4)]) == 3,
       'B_0(15)=%d; ker(B_0+B_1)=%s; every one of the 128 defects has exactly two chart representatives: %s; d=0 -> %s' %
       (B0(15), ker, reps_ok, reps0))

# ================================================================ C7: Prop dense32 and the eight-bucket claim
SUPN = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3', 'P', 'Q', 'R']


def F_lm(l, m, r):
    return Fr(sum(chi(c, r) for c in range(16) if m in rule_mask(l, c)), 128)


Ftab = {(l, m, r): F_lm(l, m, r) for l in (0, 1) for m in SUPN for r in range(16)}
Bl = (B0, B1)
fail_pt, fail_tr = [], 0
for r in range(16):
    for be in range(16):
        lhs = sum(chi(THETA[m], be) * Ftab[(l, m, r ^ Bl[l](be))] for l in (0, 1) for m in SUPN)
        rhs = int(SB(be) == 0 and r == B0(be))
        if lhs != rhs:
            fail_pt.append((r, be, str(lhs), rhs))
        for ph in range(16):
            lt = sum(chi(THETA[m] ^ ph, be) * Ftab[(l, m, r ^ Bl[l](be))] for l in (0, 1) for m in SUPN)
            if lt != chi(ph, be) * rhs:
                fail_tr += 1
BlT = (B0T, B1T)
bucket_ok, bucket_bad = True, []
for c in range(16):
    bk = [THETA[m] ^ BlT[l](c) for l in (0, 1) for m in sorted(rule_mask(l, c))]
    want = sorted(e for e in range(16) if ip(e, 15) == ip(c, 3))
    if sorted(bk) != want:
        bucket_ok = False
        bucket_bad.append((c, sorted(bk), want))
record('C7a Prop dense32 (uniform 1/128, as printed)', not fail_pt and fail_tr == 0,
       '256 pointwise identities: %d failures; 4096 translated identities: %d failures' % (len(fail_pt), fail_tr),
       {'pointwise_failures': fail_pt[:20]})
record('C7b eight Walsh buckets per character', bucket_ok,
       'for every chi the 8 retained (layer, support) pairs occupy exactly {eta: <eta,15> = <chi,3>} once: %s' % bucket_ok,
       {'bad': bucket_bad})
# the same compiler with the literal restriction weights (G3) instead of uniform 1/128
for nm_read, sc in (('literal', Fr(1)), ('alternate G3\'', Fr(1, 128))):
    co = restr_coeffs(sc)
    nf = 0
    for r in range(16):
        for be in range(16):
            lhs = 0
            for (p, l, s, c, ty, sup) in PACKETS:
                for m in (sup.split(',') if sup else []):
                    lhs += co[(p, m)] * chi(THETA[m], be) * chi(c, r ^ Bl[l](be))
            if lhs != int(SB(be) == 0 and r == B0(be)):
                nf += 1
    record('C7c dense32 with the %s restriction weights' % nm_read, nf == 0,
           '256 pointwise identities with each retained support weighted by its restriction coefficient: %d failures' % nf)

# ================================================================ C8: literal dense operator and module-chart table (App A.4 / eq. module-chart-table)
MODULES = {0: [23, 30], 1: [7, 27], 2: [14], 3: [5, 11], 4: [2, 19], 5: [22], 6: [3], 7: [16, 6], 8: [29, 12],
           9: [13, 9], 10: [28], 11: [15, 25], 12: [8, 1], 13: [24, 4], 14: [10, 17], 15: [20]}
listed = sorted(p for v in MODULES.values() for p in v)
# l. 2251 says "The thirty-two packet columns are grouped into the sixteen modules"; the table lists 27 labels.  Accept
# when the 27 are distinct and the 5 unlisted are exactly the five-empty packets (zero dense columns).
okpart = len(listed) == len(set(listed)) == 27 and sorted(set(range(32)) - set(listed)) == [0, 18, 21, 26, 31]
zero_cols = sorted(r[0] for r in PACKETS if not r[5])
fails8, fails8b = 0, 0
for lam in range(16):
    for rho in range(16):
        for be in range(16):
            Cv = 0
            for p in MODULES[lam]:
                _, l, s, c, ty, sup = PACKETS[p]
                Cv += chi(c, rho ^ Bl[l](be)) * sum(chi(THETA[m], be) for m in (sup.split(',') if sup else []))
            if be in (0, 15):
                bb = int(be == 15)
                if Cv != 8 * chi(rho ^ (3 * bb), lam ^ 6):
                    fails8 += 1
            elif Cv != 0:
                fails8 += 1
# eq. literal-W32-scaled: (1/128)(-1)^{gb+<d,6>} C_lam(d+3b,15b) = (1/16)(-1)^{<Gamma,R>}
for lam in range(16):
    for bb in (0, 1):
        for d in range(16):
            for g in (0, 1):
                Cv = 0
                for p in MODULES[lam]:
                    _, l, s, c, ty, sup = PACKETS[p]
                    Cv += chi(c, (d ^ 3 * bb) ^ Bl[l](15 * bb)) * sum(chi(THETA[m], 15 * bb)
                                                                      for m in (sup.split(',') if sup else []))
                lhs = Fr((-1) ** ((g * bb + ip(d, 6)) % 2) * Cv, 128)
                if lhs != Fr((-1) ** ((ip(d, lam) + g * bb) % 2), 16):
                    fails8b += 1
record('C8 module-chart table (M_1024 appendix, same 32-packet ledger)', okpart and fails8 == 0 and fails8b == 0
       and zero_cols == [0, 2, 5, 10, 13, 15, 16, 18, 21, 26, 29, 31],
       'module table lists %d labels, distinct, the 5 unlisted = the five-empty packets: %s; 4096 entries '
       'C_lambda(rho,beta): %d failures; eq. literal-W32-scaled (1024 entries): %d failures; zero columns %s' %
       (len(listed), okpart, fails8, fails8b, zero_cols))
twist_ok = all(SIDECOL['X'][a] ^ SIDECOL['Y'][b] ^ SIDECOL['Z'][c] == THETA[nm] for (a, b, c), nm in cw_monos(3))
common = (len({(SIDECOL['Y'][b], SIDECOL['Z'][c]) for (a, b, c), nm in cw_monos(3) if nm in ('A3', 'B1', 'B2', 'R')}) == 1
          and len({(SIDECOL['X'][a], SIDECOL['Z'][c]) for (a, b, c), nm in cw_monos(3) if nm in ('A1', 'Q')}) == 1)
record('C8b side-colour twists', twist_ok and common,
       'X xor Y xor Z twist = Theta on all 12 CW_3 supports: %s; record-partition common labels: %s' % (twist_ok, common))

# ================================================================ C9: usage table (sec. 5.1)
PUNCT = [2, 5, 10, 13, 15, 16, 29]
USAGE = {'five-empty': [0, 18, 21, 26, 31], 'tangent': [16, 6, 15, 25, 2, 19, 29, 12, 5, 11, 10, 17, 13, 9],
         'singular': [3, 14, 20, 22, 28], 'exceptional': [1, 4, 7, 8, 23, 24, 27, 30]}
allu = sorted(p for v in USAGE.values() for p in v)
TY = {r[0]: r[4] for r in PACKETS}
LA = {r[0]: r[1] for r in PACKETS}
punct_ok = all(LA[p] == 0 and not PACKETS[p][5] for p in PUNCT)
punct_types = (sum(TY[p] == 3 for p in PUNCT), sum(TY[p] == 2 for p in PUNCT))
pairs = [(16, 6), (15, 25), (2, 19), (29, 12), (5, 11), (10, 17), (13, 9)]
comp_ok = all(a in PUNCT and TY[b] == 3 for a, b in pairs)
exc_ok = sorted(USAGE['exceptional']) == sorted(r[0] for r in PACKETS if r[3] in XI)
src = {'CW3': sum(TY[p] == 3 for p in range(32) if p not in PUNCT), 'CW2': sum(TY[p] == 2 for p in range(32) if p not in PUNCT),
       'W': len(PUNCT)}
cost2128 = 5 * src['CW3'] + 4 * src['CW2'] + 2 * src['W']
cost2048 = 5 * (src['CW3'] - 5) + 4 * src['CW2'] + 2 * src['W'] + 4 * 5
record('C9 usage table and source rows', allu == list(range(32)) and punct_ok and punct_types == (3, 4) and comp_ok
       and exc_ok and src == {'CW3': 19, 'CW2': 6, 'W': 7} and cost2128 == 133 and cost2048 == 128
       and all(TY[p] == 3 for p in USAGE['five-empty'] + USAGE['singular']),
       'labels once: %s; punctures layer-0 & empty: %s, types %s CW_3/CW_2; companions are CW_3: %s; exceptional = '
       'Xi-character packets: %s; S_2128 = %s, cost %d; S_2048 cost %d; 16*128=%d, 16*133=%d' %
       (allu == list(range(32)), punct_ok, punct_types, comp_ok, exc_ok, src, cost2128, cost2048, 16 * 128, 16 * 133))

# ================================================================ C10: the W map against T_ar
TAR = {(('X', 0), ('Y', 0), ('Z', 0)): 1, (('X', 0), ('Y', 1), ('Z', 0)): 1, (('X', 0), ('Y', 2), ('Z', 0)): 1,
       (('X', 1), ('Y', 0), ('Z', 0)): 1, (('X', 1), ('Y', 1), ('Z', 0)): 1, (('X', 2), ('Y', 0), ('Z', 0)): 1,
       (('X', 3), ('Y', 0), ('Z', 0)): 1, (('X', 0), ('Y', 0), ('Z', 1)): 1}
Wmon = [((0, 0, 'inf'), 1), ((0, 'inf', 0), 1), (('inf', 0, 0), 1)]
WX = {0: lv((0, ('X', 0), 1)), 'inf': lv((0, ('X', 0), 1), (0, ('X', 1), 1), (0, ('X', 2), 1), (0, ('X', 3), 1))}
WY = {0: lv((0, ('Y', 0), 1)), 'inf': lv((0, ('Y', 1), 1), (0, ('Y', 2), 1))}
WZ = {0: lv((0, ('Z', 0), 1)), 'inf': lv((0, ('Z', 1), 1))}
Wimg = expand(source_terms(Wmon, WX, WY, WZ))
missing = sorted(set(TAR) - set(Wimg.get(0, {})))
extra = sorted(set(Wimg.get(0, {})) - set(TAR))
record('C10 W map vs T_ar', list(Wimg) == [0] and missing == [(('X', 1), ('Y', 1), ('Z', 0))] and not extra
       and all(v == 1 for v in Wimg[0].values()),
       'image has %d monomials, all in T_ar with coefficient 1; missing %s' % (len(Wimg.get(0, {})), missing))

# ================================================================ C11: singular active compilers


def sa_maps_Y():
    MX = {0: lv((2, 'XE', 1)), 1: lv((3, 'Xr1', 1)), 2: lv((0, 'Xr2', 1)), 3: lv((0, 'Xr3', 1)), 'inf': lv((2, 'Xr1', 1))}
    MY = {0: lv((-1, 'Yr1', 1)), 1: lv((-1, 'Yb', 1)), 2: lv((1, 'Yr2', 1)), 3: lv((1, 'Yr3', 1)), 'inf': {}}
    MZ = {0: lv((-1, ('Z', 0), 1)), 1: lv((-1, 'ZE', 1)), 2: {}, 3: lv((1, ('Z', 1), 1)), 'inf': {}}
    return MX, MY, MZ


def mat_sub(M, raw, tgt):  # raw key j (1..3) -> sum_i M[i][j-1] tgt(i)
    return {raw(j): {tgt(i): M[i][j - 1] for i in range(len(M)) if M[i][j - 1]} for j in (1, 2, 3)}


AR = mat_mul(SA_A, SA_R)
yshift = {'Yr%d' % k: {('Y', k - 1): 1} for k in (1, 2, 3)}
cw3m = [(m, 1) for m, _ in cw_monos(3)]
MX, MY, MZ = sa_maps_Y()
xsub = mat_sub(SA_A, lambda j: 'Xr%d' % j, lambda i: ('X', i))
raw_Y = expand(source_terms(cw3m, MX, MY, MZ))
fin_Y = expand(source_terms(cw3m, {k: compose(v, xsub) for k, v in MX.items()},
                            {k: compose(v, yshift) for k, v in MY.items()}, MZ))
want_Y = dict(TAR)
want_Y[('XE', 'Yb', 'ZE')] = 1
okY, dY = tensor_eq(fin_Y.get(0, {}), want_Y)
fin_Y_noshift = expand(source_terms(cw3m, {k: compose(v, xsub) for k, v in MX.items()}, MY, MZ))
okY_noshift, _ = tensor_eq({k: v for k, v in fin_Y_noshift.get(0, {}).items()}, want_Y)
record('C11a singular-active Y-endpoint compiler (literal map, A, Y shift)', okY and min(fin_Y) >= 0,
       'Laurent degrees present %s (none negative: %s); degree-0 output = T_ar + X_E Ybar Z_E: %s; without the unprinted '
       'Y index shift: %s' % (sorted(fin_Y), min(fin_Y) >= 0, okY, okY_noshift),
       {'raw_degrees': {d: len(T) for d, T in raw_Y.items()}, 'diff': {str(k): [str(a), str(b)] for k, (a, b) in dY.items()}})
# X-endpoint reading: swap source x<->y roles (and target letters), X-map AR on raw X, Y-map R on raw Y, same Y shift
MXs = {0: lv((-1, 'Xr1', 1)), 1: lv((-1, 'Xb', 1)), 2: lv((1, 'Xr2', 1)), 3: lv((1, 'Xr3', 1)), 'inf': {}}
MYs = {0: lv((2, 'YE', 1)), 1: lv((3, 'Yr1', 1)), 2: lv((0, 'Yr2', 1)), 3: lv((0, 'Yr3', 1)), 'inf': lv((2, 'Yr1', 1))}
xsubs = mat_sub(AR, lambda j: 'Xr%d' % j, lambda i: ('X', i))
ysubs = mat_sub(SA_R, lambda j: 'Yr%d' % j, lambda i: 'Ys%d' % (i + 1))
ysh2 = {'Ys%d' % k: {('Y', k - 1): 1} for k in (1, 2, 3)}
fin_X = expand(source_terms(cw3m, {k: compose(v, xsubs) for k, v in MXs.items()},
                            {k: compose(compose(v, ysubs), ysh2) for k, v in MYs.items()}, MZ))
want_X = dict(TAR)
want_X[('Xb', 'YE', 'ZE')] = 1
okX, dX = tensor_eq(fin_X.get(0, {}), want_X)
record('C11b singular-active X-endpoint compiler (reading G7)', okX and min(fin_X) >= 0,
       'degrees %s; degree-0 output = T_ar + Xbar Y_E Z_E: %s' % (sorted(fin_X), okX),
       {'diff': {str(k): [str(a), str(b)] for k, (a, b) in dX.items()}})

# ================================================================ C12: rank-four active blocks
M1 = [[1, 0, 0, 0], [0] * 4, [0] * 4, [0] * 4]
M2 = [[0] * 4, [0] * 4, [0] * 4, [0, 0, 0, 1]]
Am = [[a + b for a, b in zip(r1, r2)] for r1, r2 in zip(M0, M2)]
Ai = inv(Am)
E31 = [[0] * 4, [0] * 4, [1, 0, 0, 0], [0] * 4]
okA = det(Am) == -1 and mat_mul(Ai, M1) == E31 and mat_mul(Ai, M2) == M2
# simultaneous swap of 2nd and 3rd basis vectors on X and Y: slices (I, E31, E44) -> (I, E21, E44)
Pm = [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]]
sw = lambda M: mat_mul(mat_mul(Pm, M), Pm)
E21 = [[0] * 4, [1, 0, 0, 0], [0] * 4, [0] * 4]
okSw = sw([[int(i == j) for j in range(4)] for i in range(4)]) == [[int(i == j) for j in range(4)] for i in range(4)] \
    and sw(E31) == E21 and sw(M2) == M2
ACAN = {}
for i in (1, 2, 3, 4):
    ACAN[('x%d' % i, 'y%d' % i, 'z0')] = 1
ACAN[('x2', 'y1', 'z1')] = 1
ACAN[('x4', 'y4', 'z2')] = 1
RT = [(1, lv((1, 'x1', -1), (0, 'x2', 1)), lv((-1, 'y1', -1)), lv((0, 'z0', 1))),
      (1, lv((0, 'x2', 1)), lv((-1, 'y1', 1), (0, 'y2', 1)), lv((0, 'z0', 1), (1, 'z1', 1))),
      (1, lv((0, 'x3', 1)), lv((0, 'y3', 1)), lv((0, 'z0', 1))),
      (1, lv((0, 'x4', 1)), lv((0, 'y4', 1)), lv((0, 'z0', 1), (0, 'z2', 1)))]
ERT = expand(RT)
okRt = sorted(ERT) == [0, 1] and tensor_eq(ERT[0], ACAN)[0] and ERT[1] == {('x2', 'y2', 'z1'): 1}


def flat_rank(T, side):
    rows = sorted({k[side] for k in T})
    cols = sorted({(k[(side + 1) % 3], k[(side + 2) % 3]) for k in T})

    def key(r, c):
        kk = [None, None, None]
        kk[side], kk[(side + 1) % 3], kk[(side + 2) % 3] = r, c[0], c[1]
        return tuple(kk)
    return mat_rank([[T.get(key(r, c), 0) for c in cols] for r in rows])


fr = tuple(flat_rank(ACAN, s) for s in range(3))
# transfer to the physical active tensor A_X = T_ar + E_X E_Y E_Z (local bases), through the printed steps
XV = {'x1': {('X', 0): 1, ('X', 1): 1, ('X', 2): 1, ('X', 3): 1},   # X''_1 = A col 1 = X0+X1+X23, X23 = X2+X3
      'x2': {('X', 0): 1},                                          # X''_2 = X'_3 = A col 3
      'x3': {('X', 0): 1, ('X', 1): 1},                             # X''_3 = X'_2 = A col 2
      'x4': {'EX': 1}}
YV = {'y1': {('Y', 0): 1}, 'y2': {('Y', 2): 1}, 'y3': {('Y', 1): 1}, 'y4': {'EY': 1}}
ZV = {'z0': {('Z', 0): 1}, 'z1': {('Z', 1): 1}, 'z2': {'EZ': 1, ('Z', 0): -1}}
ERX = expand([(c, compose(a, XV), compose(b, YV), compose(cc, ZV)) for c, a, b, cc in RT])
want_AX = dict(TAR)
want_AX[('EX', 'EY', 'EZ')] = 1
okAX = min(ERX) >= 0 and tensor_eq(ERX[0], want_AX)[0]
record('C12a Lemma active-rank4', okA and okSw and okRt and fr == (4, 4, 3) and okAX,
       'det(M0+M2) = %s, A^-1 B = E31: %s, A^-1 C = E44: %s; swap -> (I,E21,E44): %s; R_t = A_can + t x2y2z1: %s; '
       'flattening ranks %s; R_t transferred by the printed steps has degree-0 term T_ar + E_X E_Y E_Z: %s'
       % (det(Am), mat_mul(Ai, M1) == E31, mat_mul(Ai, M2) == M2, okSw, okRt, fr, okAX))
LIFT = [(Fr(1), lv((-1, 'b', 1), (0, 'a', 1)), lv((0, 'u', 1), (1, 'v', 1)), lv((0, 'z', 1), (1, 's', 1))),
        (Fr(-1), lv((-1, 'b', 1)), lv((0, 'u', 1)), lv((0, 'z', 1))),
        (Fr(1), lv((0, 'c', 1)), lv((0, 'w', 1)), lv((0, 'r', 1))),
        (Fr(1), lv((0, 'eX', 1)), lv((0, 'eY', 1)), lv((0, 'eZ', 1)))]
EL = expand(LIFT)
wantL0 = {('a', 'u', 'z'): 1, ('b', 'v', 'z'): 1, ('b', 'u', 's'): 1, ('c', 'w', 'r'): 1, ('eX', 'eY', 'eZ'): 1}
wantL1 = {('b', 'v', 's'): 1, ('a', 'v', 'z'): 1, ('a', 'u', 's'): 1}
PHY = {'a': {('X', 0): 1, ('X', 1): 1, ('X', 2): 1, ('X', 3): 1}, 'b': {('X', 0): 1}, 'c': {('X', 1): 1},
       'u': {('Y', 0): 1}, 'v': {('Y', 1): 1, ('Y', 2): 1}, 'w': {('Y', 1): 1},
       'z': {('Z', 0): 1}, 's': {('Z', 1): 1}, 'r': {('Z', 0): 1}}
ELP = expand([(c, compose(a, PHY), compose(b, PHY), compose(cc, PHY)) for c, a, b, cc in LIFT])
wantP = dict(TAR)
wantP[('eX', 'eY', 'eZ')] = 1
okL = (sorted(EL) == [0, 1, 2] and EL[0] == wantL0 and EL[1] == wantL1 and EL[2] == {('a', 'v', 's'): 1}
       and tensor_eq(ELP[0], wantP)[0] and min(ELP) >= 0)
record('C12b active lift (App A.5 / Lemma active-lift-1024)', okL,
       'R_t = A_hat + t(bvs+avz+aus) + t^2 avs and physical specialization gives T_ar + endpoint: %s' % okL)

# ================================================================ C13: exceptional endpoint quotients


def block_K(chi_, p=None):
    bar, packs, r = EXC[chi_]
    b = BCOV[chi_]
    cols = [(pk, col) for pk, ty in packs for col in list(range(0, ty + 1)) + ['inf']]
    assert len(cols) == len(b)
    # K rows = first endpoint side, columns = second endpoint side (Z); barred side contracted with b
    K = [[Fr(0)] * len(cols) for _ in cols]
    idx = {c: i for i, c in enumerate(cols)}
    for pk, ty in packs:
        for (a, bb, c), _ in cw_monos(ty):
            if bar == 'X':
                K[idx[(pk, bb)]][idx[(pk, c)]] += b[idx[(pk, a)]]
            else:
                K[idx[(pk, a)]][idx[(pk, c)]] += b[idx[(pk, bb)]]
    return K, cols


def cov(pk, side, cols):
    _, l, s, c, ty, sup = PACKETS[pk]
    x, y, z = restriction(ty, sup)
    vec = {'X': x, 'Y': y, 'Z': z}[side]
    return [vec[col] if q == pk else Fr(0) for q, col in cols]


RNAMES = ('R-D1 (one row per packet)', 'R-D2 (one combined row)', 'R-D3 (D_L per packet, D_R combined)',
          'R-D4 (D_L combined, D_R per packet)')
exc_summary = {}
ok13 = True
for ch in (6, 7, 10, 11):
    bar, packs, r = EXC[ch]
    K, cols = block_K(ch)
    EL_, ER_ = EG[ch]
    I_r = [[Fr(int(i == j)) for j in range(r)] for i in range(r)]
    e1 = mat_mul(mat_mul(EL_, K), T_(ER_)) == I_r
    K3 = [[int(x) % 3 for x in row] for row in K]
    e3 = mat_mul(mat_mul(ET[ch][0], K3, 3), T_(ET[ch][1]), 3) == [[int(i == j) for j in range(r)] for i in range(r)]
    gen_mod3 = None
    if ch in (7, 10):
        ELm = [[(x.numerator * pow(x.denominator, -1, 3)) % 3 for x in row] for row in EL_]
        ERm = [[(x.numerator * pow(x.denominator, -1, 3)) % 3 for x in row] for row in ER_]
        gen_mod3 = mat_mul(mat_mul(ELm, K3, 3), T_(ERm), 3) == [[int(i == j) for j in range(r)] for i in range(r)]
    endsides = ('Y', 'Z') if bar == 'X' else ('X', 'Z')
    rd = {}
    for rname in RNAMES:
        per = lambda side: [cov(pk, side, cols) for pk, _ in packs]
        comb = lambda side: [[a + b for a, b in zip(*[cov(pk, side, cols) for pk, _ in packs])]]
        DL = per(endsides[0]) if rname[3] in '13' else comb(endsides[0])
        DR = per(endsides[1]) if rname[3] in '14' else comb(endsides[1])
        dd = mat_mul(mat_mul(DL, K), T_(DR))
        ed = mat_mul(mat_mul(EL_, K), T_(DR))
        de = mat_mul(mat_mul(DL, K), T_(ER_))
        clean = (len(cols) - mat_rank(mat_mul(K, T_(DR))), len(cols) - mat_rank(mat_mul(DL, K)))
        rd[rname] = {'DLKDR=0': all(x == 0 for row in dd for x in row), 'ELKDR=0': all(x == 0 for row in ed for x in row),
                     'DLKER=0': all(x == 0 for row in de for x in row), 'clean_dims': clean,
                     'DLKDR': [[str(x) for x in row] for row in dd]}
    exc_summary[ch] = {'E_L K E_R^T = I_r over Q': e1, 'tilde over F_3': e3, 'generic reduced mod 3': gen_mod3, 'readings': rd}
    ok13 = ok13 and e1 and e3 and (gen_mod3 in (None, True))
n_occ = sum(len(cw_monos(ty)) for ch in EXC for _, ty in EXC[ch][1])
printed_clean = {6: (7, 6), 7: (8, 7), 10: (7, 6), 11: (8, 7)}
record('C13a exceptional blocks: E_L K E_R^T = I_r (Q and F_3)', ok13 and n_occ == 78,
       'Q: %s; F_3 tilde: %s; generic chi=7,10 mod 3: %s; source occurrences %d (printed 78)' %
       ([exc_summary[c]['E_L K E_R^T = I_r over Q'] for c in (6, 7, 10, 11)],
        [exc_summary[c]['tilde over F_3'] for c in (6, 7, 10, 11)],
        [exc_summary[c]['generic reduced mod 3'] for c in (7, 10)], n_occ))
for rname in RNAMES:
    okr = all(exc_summary[c]['readings'][rname]['DLKDR=0'] and exc_summary[c]['readings'][rname]['ELKDR=0'] and
              exc_summary[c]['readings'][rname]['DLKER=0'] and
              exc_summary[c]['readings'][rname]['clean_dims'] == printed_clean[c] for c in (6, 7, 10, 11))
    record('C13b exceptional cross identities + clean dims under %s' % rname, okr,
           '; '.join('chi=%d: DKD=0 %s, EKD=0 %s, DKE=0 %s, clean %s (printed %s)' % (
               c, exc_summary[c]['readings'][rname]['DLKDR=0'], exc_summary[c]['readings'][rname]['ELKDR=0'],
               exc_summary[c]['readings'][rname]['DLKER=0'], exc_summary[c]['readings'][rname]['clean_dims'],
               printed_clean[c]) for c in (6, 7, 10, 11)), {str(c): exc_summary[c] for c in exc_summary})

# ================================================================ C14: the five-empty module
J10 = [[Fr(int(j == (i + 5) % 10)) for j in range(10)] for i in range(10)]
cJc = mat_mul(mat_mul([Fc], J10), T_([Fc]))[0][0]
BJD = mat_mul(mat_mul(FB, J10), T_(FD))
BJc = mat_mul(mat_mul(FB, J10), T_([Fc]))
DJc = mat_mul(mat_mul(FD, J10), T_([Fc]))
I7 = [[Fr(int(i == j)) for j in range(7)] for i in range(7)]
zs = all(sum(row[5:]) == 0 for row in FB + FD + [Fc])
okBD = cJc == 1 and BJD == I7 and all(x[0] == 0 for x in BJc) and all(x[0] == 0 for x in DJc) and zs


def five_empty_terms():
    terms = []
    for j in range(1, 6):
        MX = {0: lv((-2, 'Xb', 1), *[(1, 'P%d' % a, FB[a - 1][j - 1]) for a in range(1, 8)]),
              'inf': lv(*[(1, 'P%d' % a, FB[a - 1][4 + j]) for a in range(1, 8)])}
        MY = {0: lv((-2, 'Yb', 1), (1, 'U', Fc[j - 1]), *[(1, 'Q%d' % a, FD[a - 1][j - 1]) for a in range(1, 8)]),
              'inf': lv((1, 'U', Fc[4 + j]), *[(1, 'Q%d' % a, FD[a - 1][4 + j]) for a in range(1, 8)])}
        MZ = {0: lv((-2, 'Zb', 1), (1, 'V', Fc[j - 1])),
              'inf': lv((1, 'V', Fc[4 + j]), *([(4, 'Zb', 1)] if j == 1 else []))}
        for i in (1, 2, 3):
            MX[i] = lv((1, 'Xsh%d' % (3 * (j - 1) + i), 1))
            MY[i] = lv((1, 'Ysh%d' % (3 * (j - 1) + i), 1))
            MZ[i] = lv((1, 'Zsh%d' % (3 * (j - 1) + i), 1))
        terms += source_terms(cw3m, MX, MY, MZ)
    return terms


E5 = expand(five_empty_terms())
want5 = {}
for i in range(1, 16):
    want5[('Xb', 'Ysh%d' % i, 'Zsh%d' % i)] = 1
    want5[('Xsh%d' % i, 'Yb', 'Zsh%d' % i)] = 1
    want5[('Xsh%d' % i, 'Ysh%d' % i, 'Zb')] = 1
want5[('Xb', 'U', 'V')] = 1
for a in range(1, 8):
    want5[('P%d' % a, 'Q%d' % a, 'Zb')] = 1
want5[('Xb', 'Yb', 'Zb')] = 1
ok5, d5 = tensor_eq(E5.get(0, {}), want5)
prof = (sum(1 for k in E5.get(0, {}) if k[0] == 'Xb' and k[1] != 'Yb'),
        sum(1 for k in E5.get(0, {}) if k[1] == 'Yb' and k[0] != 'Xb'),
        sum(1 for k in E5.get(0, {}) if k[2] == 'Zb' and k[0] != 'Xb'))
record('C14 five-empty module (Lemma fiveC3paper32)', okBD and ok5 and min(E5) >= 0 and prof == (16, 15, 22),
       'cJc^T=%s, BJD^T=I_7: %s, BJc^T=0: %s, DJc^T=0: %s, last-five zero sums: %s; Laurent degrees %s (no negative: %s); '
       'degree-0 output = eq. fiveC3-output32: %s; profile %s' %
       (cJc, BJD == I7, all(x[0] == 0 for x in BJc), all(x[0] == 0 for x in DJc), zs, sorted(E5), min(E5) >= 0, ok5, prof),
       {'diff': {str(k): [str(a), str(b)] for k, (a, b) in d5.items()}})

# ================================================================ C15: ledgers (arithmetic)
prof_sum = tuple(sum(x) for x in zip((16, 15, 22), (6, 6, 9), (7, 7, 0), (2, 3, 0)))
alloc = {'X': [range(1, 16), range(16, 18), range(18, 24), range(24, 31), range(31, 32)],
         'Y': [range(1, 16), range(16, 19), range(19, 25), range(25, 32)],
         'Z': [range(1, 16), range(16, 25), range(25, 32)]}
alloc_ok = all(sorted(x for rg in v for x in rg) == list(range(1, 32)) for v in alloc.values())
record('C15 endpoint ledger and allocation table', prof_sum == (31, 31, 31) and alloc_ok and
       [len(list(rg)) for rg in alloc['X']] == [15, 2, 6, 7, 1] and [len(list(rg)) for rg in alloc['Y']] == [15, 3, 6, 7]
       and [len(list(rg)) for rg in alloc['Z']] == [15, 9, 7],
       'profile sum %s; each sector uses 1..31 once: %s' % (prof_sum, alloc_ok))

# ================================================================ C16: section-8 identities
U = {'X': UX, 'Y': UY, 'Z': UZ}
subs = [I for I in (('X',), ('Y',), ('Z',), ('X', 'Y'), ('X', 'Z'), ('Y', 'Z'), ('X', 'Y', 'Z'))]
ranks = {}
row_fail = 0
for I in subs:
    imgs = tuple(0 for _ in range(4))
    imgs = [0, 0, 0, 0]
    for S in I:
        imgs = [a ^ b for a, b in zip(imgs, U[S])]
    ranks[''.join(I)] = rank_f2(imgs)
    MI, MIT = linmap(imgs), linmap_T(imgs)
    for sg in range(16):
        for et in range(16):
            v = Fr(sum(chi(sg, hh) * chi(et, MI(hh)) for hh in range(16)), 16)
            if v != int(sg == MIT(et)):
                row_fail += 1
heis_fail = sum(1 for al in range(16) for be in range(16) for q in range(16) for r in range(16)
                if (ip(al, q) + ip(be, r) + ip(be, q ^ r) + ip(al ^ be, q ^ r)) % 2 != ip(al ^ be, r))
wp_fail = 0
for al in range(16):
    for q in range(16):
        for be in range(16):
            for r in range(16):
                sg = (-1) ** ip(al, r)
                for w in range(16):
                    if chi(be, w) * chi(al, w ^ r) != sg * chi(al ^ be, w):
                        wp_fail += 1
gram_fail = sum(1 for al in range(16) for q in range(16) for be in range(16) for r in range(16)
                if (sum(chi(al, v) * chi(be, v) for v in range(16)) if q == r else 0) != (16 if (al, q) == (be, r) else 0))
diag_fail = sum(1 for hh in range(16) for v in range(16)
                if Fr(sum(chi(al, hh) * chi(al, v) for al in range(16)), 16) != int(v == hh))
record('C16 section-8 identities', set(ranks.values()) == {4} and row_fail == 0 and heis_fail == 0 and wp_fail == 0
       and gram_fail == 0 and diag_fail == 0,
       'subset-sum ranks %s; eq. absolute-row32 failures %d (7*256 cases); Heisenberg failures %d (65536); Weyl product '
       'failures %d (1048576 entries); Gram failures %d; diagonal failures %d' %
       (ranks, row_fail, heis_fail, wp_fail, gram_fail, diag_fail))

# ================================================================ C17: source realizations (in s)


def sv(*items):
    return lv(*items)


def cw_target(q):
    return {(a, b, c): 1 for (a, b, c), _ in cw_monos(q)}


def phi_q(q):
    terms = []
    for i in range(1, q + 1):
        terms.append((Fr(1), sv((0, 0, 1), (1, i, 1)), sv((0, 0, 1), (1, i, 1)), sv((0, 0, 1), (1, i, 1))))
    S1 = [(1, i, 1) for i in range(1, q + 1)]
    if q >= 3:
        mid = sv((0, 0, 1), *S1, (2, 'inf', q - 2))
        terms.append((Fr(1, q - 2), mid, mid, mid))
        low = sv((0, 0, 1), *[(1, i, Fr(1, q - 1)) for i in range(1, q + 1)])
        terms.append((-Fr((q - 1) ** 2, q - 2), low, low, low))
    else:  # q = 2, char != 3 realization (eq. cw2-explicit)
        mid = sv((0, 0, 1), *[(1, i, 2) for i in range(1, 3)], (2, 'inf', 4))
        terms.append((Fr(1, 4), mid, mid, mid))
        low = sv((0, 0, 1), *[(1, i, Fr(2, 3)) for i in range(1, 3)])
        terms.append((-Fr(9, 4), low, low, low))
    return terms


src_ok = {}
for q in (3, 2):
    E = expand(phi_q(q))
    src_ok['CW_%d' % q] = (min(E) >= 2 and max(E) <= 6 and E[2] == cw_target(q) and len(phi_q(q)) == q + 2)
Wtan = [(Fr(1), sv((1, 0, 1), (2, 'inf', 1)), sv((0, 0, 1), (1, 'inf', 1)), sv((0, 0, 1), (1, 'inf', 1))),
        (Fr(-1), sv((1, 0, 1)), sv((0, 0, 1)), sv((0, 0, 1)))]
EW = expand(Wtan)
src_ok['W'] = min(EW) >= 2 and max(EW) <= 4 and EW[2] == {('inf', 0, 0): 1, (0, 'inf', 0): 1, (0, 0, 'inf'): 1}
record('C17 source realizations', all(src_ok.values()),
       'Phi_3: 5 products, [s^0]=[s^1]=0, [s^2]=CW_3, deg<=6: %s; Phi_2 (char != 3): %s; W tangent times s: %s' %
       (src_ok['CW_3'], src_ok['CW_2'], src_ok['W']))

# ================================================================ C18: seeded F_p replays of the explicit local Laurent identities


def is_prime(n):
    if n < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    for a in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True


SEED, PRIMES, NPTS = 2610139701, (1000003, 998244353), 24
assert all(is_prime(p) for p in PRIMES)
rng = random.Random(SEED)


def modfr(c, p):
    c = Fr(c)
    return c.numerator % p * pow(c.denominator % p, p - 2, p) % p


def keys_of(terms, side):
    ks = set()
    for t in terms:
        ks |= {k for (_, k) in t[1 + side]}
    return sorted(ks, key=str)


def replay(name, terms, target, h):
    kx, ky, kz = keys_of(terms, 0), keys_of(terms, 1), keys_of(terms, 2)
    for k in target:
        assert k[0] in kx and k[1] in ky and k[2] in kz, (name, k)
    out_ok = True
    rows = []
    for p in PRIMES:
        for n in range(NPTS):
            x = {k: rng.randrange(p) for k in kx}
            y = {k: rng.randrange(p) for k in ky}
            z = {k: rng.randrange(p) for k in kz}
            poly = {}
            for coef, LX, LY, LZ in terms:
                ex = {}
                for (d, k), c in LX.items():
                    ex[d] = (ex.get(d, 0) + modfr(c, p) * x[k]) % p
                ey = {}
                for (d, k), c in LY.items():
                    ey[d] = (ey.get(d, 0) + modfr(c, p) * y[k]) % p
                ez = {}
                for (d, k), c in LZ.items():
                    ez[d] = (ez.get(d, 0) + modfr(c, p) * z[k]) % p
                cf = modfr(coef, p)
                for da, va in ex.items():
                    for db, vb in ey.items():
                        for dc, vc in ez.items():
                            dd = da + db + dc
                            poly[dd] = (poly.get(dd, 0) + cf * va * vb * vc) % p
            tv = sum(modfr(c, p) * x[k[0]] * y[k[1]] * z[k[2]] for k, c in target.items()) % p
            lo = {d: v for d, v in poly.items() if d < h}
            ok = all(v == 0 for v in lo.values()) and poly.get(h, 0) == tv
            out_ok = out_ok and ok
            rows.append({'identity': name, 'p': p, 'k': n, 'x': {str(k): v for k, v in x.items()},
                         'y': {str(k): v for k, v in y.items()}, 'z': {str(k): v for k, v in z.items()},
                         'coefficients': {str(d): poly[d] for d in sorted(poly)}, 'target_degree': h,
                         'target_value': tv, 'pass': ok})
    return out_ok, rows


MXc, MYc, MZc = sa_maps_Y()
REPLAYS = [
    ('five-empty module', five_empty_terms(), want5, 0),
    ('singular active, Y endpoint', source_terms(cw3m, {k: compose(v, xsub) for k, v in MXc.items()},
                                                 {k: compose(v, yshift) for k, v in MYc.items()}, MZc), want_Y, 0),
    ('singular active, X endpoint (reading G7)', source_terms(cw3m, {k: compose(v, xsubs) for k, v in MXs.items()},
                                                              {k: compose(compose(v, ysubs), ysh2) for k, v in MYs.items()},
                                                              MZ), want_X, 0),
    ('R_t on A_can', RT, ACAN, 0),
    ('R_t transferred to A_X', [(c, compose(a, XV), compose(b, YV), compose(cc, ZV)) for c, a, b, cc in RT], want_AX, 0),
    ('active lift, physical specialization', [(c, compose(a, PHY), compose(b, PHY), compose(cc, PHY))
                                              for c, a, b, cc in LIFT], wantP, 0),
    ('Phi_3 -> CW_3', phi_q(3), cw_target(3), 2),
    ('Phi_2 -> CW_2', phi_q(2), cw_target(2), 2),
    ('W tangent * s -> W', Wtan, {('inf', 0, 0): 1, (0, 'inf', 0): 1, (0, 0, 'inf'): 1}, 2),
]
allrows = []
rep_summary = {}
for name, terms, target, hh in REPLAYS:
    ok, rows = replay(name, terms, target, hh)
    rep_summary[name] = ok
    allrows += rows
with open(os.path.join(OUT, 'points.jsonl'), 'w') as fh:
    for r in allrows:
        fh.write(json.dumps(r, sort_keys=True) + '\n')
record('C18 seeded F_p replays (local identities only)', all(rep_summary.values()),
       '%d identities x 2 primes x %d points = %d evaluations, all pass: %s' %
       (len(REPLAYS), NPTS, len(allrows), rep_summary))

# ================================================================ output
summary = {'tex_sha256': TEX_SHA, 'python': sys.version.split()[0], 'seed': SEED, 'primes': PRIMES,
           'points_per_prime_per_identity': NPTS, 'n_checks': len(RESULTS),
           'n_pass': sum(r['ok'] for r in RESULTS), 'results': RESULTS}


def jsonable(o):
    if isinstance(o, Fr):
        return str(o)
    if isinstance(o, dict):
        return {str(k): jsonable(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [jsonable(v) for v in o]
    return o


with open(os.path.join(OUT, 'results.json'), 'w') as fh:
    json.dump(jsonable(summary), fh, indent=1, sort_keys=True)
with open(os.path.join(OUT, 'run.log'), 'w') as fh:
    fh.write('\n'.join(LOG) + '\n')
log('checks: %d, pass: %d' % (len(RESULTS), sum(r['ok'] for r in RESULTS)))
