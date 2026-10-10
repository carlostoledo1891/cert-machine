"""_f35x_algebra.py — exact plumbing shared by F-351 and F-352 (the ten-dimensional algebra C of openai/math family 199).

Nothing here decides; it only computes. Standard library only, no code from the release.

SCALARS. Every structure constant of C, of T = C x DC and of the printed cochain lies in F_2[q]. A polynomial over F_2
is a Python int whose bit i is the coefficient of q^i; + is XOR and * is carry-less multiplication, so all arithmetic is
exact. Where a second symbol is needed — an indeterminate H for the twist h_H (Laurent: H^-1 occurs), or Q standing
for q^i in the resolution formulas that hold "for every i" — an element of F_2[q][Y, Y^-1] is a dict {k: int} (the
coefficient of Y^k).

ELEMENTS of an algebra with a letter basis are dicts {(letter, k): int}: the coefficient of letter * Y^k. Structure
constants MU[a][b] = {letter: int} (no Y). One multiplication routine serves C, T, the twisted computations and the
Q-parametrised ones.

PARAMETRISED RANK. A vector family whose entries lie in F_2[q][Q] is reduced by fraction-free elimination (row_r <-
p*row_r + c*row_p, characteristic two). Specialising Q -> q^n is a ring map and commutes with every step, so if every
pivot P stays nonzero at Q = q^n the rank at n equals the generic rank (and it is never larger). P(q, q^n) can vanish
only if two monomials q^a Q^b, q^a' Q^b' of P collide, a + b n = a' + b' n, which pins n = (a' - a)/(b - b') — a finite
set; there P is evaluated directly. So "rank = r for every n >= n0" is decided by finitely many exact computations.
span_decision turns a printed "image <...>, kernel <...>" claim into three such rank sets plus polynomial identities.

TEXT. Release files are read only through _common.Sources (Patched applies forged edits after recording the true
sha256); parse_expr / parse_tuple / angle_spans / table_after read the paper's own notation, so every decided object
is the published bytes, not a transcription.
"""

LOWER = 'exyzuvtjfn'
UPPER = LOWER.upper()


# ---------------------------------------------------------------- F_2[q] as ints

def pmul(a, b):
    if a.bit_length() < b.bit_length():
        a, b = b, a
    r = 0
    while b:
        if b & 1:
            r ^= a
        a <<= 1
        b >>= 1
    return r


def pstr(a):
    if a == 0:
        return '0'
    t = []
    for i in range(a.bit_length() - 1, -1, -1):
        if a >> i & 1:
            t.append('1' if i == 0 else ('q' if i == 1 else 'q^%d' % i))
    return '+'.join(t)


# ---------------------------------------------------------------- F_2[q][Y, Y^-1] as {k: int}

def r_add(a, b):
    r = dict(a)
    for k, c in b.items():
        v = r.get(k, 0) ^ c
        if v:
            r[k] = v
        else:
            r.pop(k, None)
    return r


def r_mul(a, b):
    r = {}
    for k1, c1 in a.items():
        for k2, c2 in b.items():
            k = k1 + k2
            v = r.get(k, 0) ^ pmul(c1, c2)
            if v:
                r[k] = v
            else:
                r.pop(k, None)
    return r


def r_eval(a, n):
    """a(q, Q = q^n) for a with nonnegative Y-exponents, as an int"""
    s = 0
    for k, c in a.items():
        if k < 0:
            raise ValueError('negative exponent at specialisation')
        s ^= c << (k * n)
    return s


def r_zeros(a, n0):
    """the n >= n0 with a(q, q^n) = 0, for a != 0: only colliding monomials can cancel"""
    mons = [(i, k) for k, c in a.items() for i in range(c.bit_length()) if c >> i & 1]
    cand = set()
    for x in range(len(mons)):
        for y in range(x + 1, len(mons)):
            (a1, b1), (a2, b2) = mons[x], mons[y]
            if b1 != b2 and (a2 - a1) % (b1 - b2) == 0:
                n = (a2 - a1) // (b1 - b2)
                if n >= n0:
                    cand.add(n)
    return sorted(n for n in cand if r_eval(a, n) == 0)


def r_str(a, var='Q'):
    if not a:
        return '0'
    t = []
    for k in sorted(a):
        c = pstr(a[k])
        if k == 0:
            t.append(c)
        else:
            y = var if k == 1 else '%s^%d' % (var, k)
            t.append(y if c == '1' else '(%s)%s' % (c, y))
    return ' + '.join(t)


# ---------------------------------------------------------------- elements {(letter, k): int}

def e_add(*xs):
    r = {}
    for x in xs:
        for key, c in x.items():
            v = r.get(key, 0) ^ c
            if v:
                r[key] = v
            else:
                r.pop(key, None)
    return r


def e_scale(x, c, k=0):
    """multiply by the scalar c * Y^k (c an int polynomial in q)"""
    if not c:
        return {}
    return {(l, kk + k): pmul(v, c) for (l, kk), v in x.items()}


def e_mul(x, y, MU):
    r = {}
    for (a, k1), c1 in x.items():
        row = MU.get(a)
        if not row:
            continue
        for (b, k2), c2 in y.items():
            m = row.get(b)
            if not m:
                continue
            c12 = pmul(c1, c2)
            k = k1 + k2
            for v, cv in m.items():
                key = (v, k)
                w = r.get(key, 0) ^ pmul(c12, cv)
                if w:
                    r[key] = w
                else:
                    r.pop(key, None)
    return r


def L(letter):
    return {(letter, 0): 1}


def e_str(x, var='H'):
    if not x:
        return '0'
    by = {}
    for (l, k), c in x.items():
        by.setdefault(l, {})[k] = c
    return ' + '.join('(%s)%s' % (r_str(by[l], var), l) for l in sorted(by))


def coords(x, basis):
    """the coordinate vector of x in a letter basis, entries in F_2[q][Y]; letters outside the basis are an error"""
    out = [dict() for _ in basis]
    idx = {b: i for i, b in enumerate(basis)}
    for (l, k), c in x.items():
        if l not in idx:
            raise ValueError('%s not in basis %s' % (l, basis))
        out[idx[l]][k] = c
    return out


# ---------------------------------------------------------------- parsing the paper's notation

def _match(s, i, o='(', c=')'):
    d = 0
    for j in range(i, len(s)):
        if s[j] == o:
            d += 1
        elif s[j] == c:
            d -= 1
            if d == 0:
                return j
    raise ValueError('unbalanced: ' + s)


def split_top(s, sep):
    out, d, cur = [], 0, ''
    for ch in s:
        if ch in '({':
            d += 1
        elif ch in ')}':
            d -= 1
        if ch == sep and d == 0:
            out.append(cur)
            cur = ''
        else:
            cur += ch
    out.append(cur)
    return out


def _exponent(s, i):
    """after '^': '2', 'i', '{i+2}', '{12}' -> ((a, b), next index) meaning q^(a + b*i)"""
    if s[i] == '{':
        j = _match(s, i, '{', '}')
        body = s[i + 1:j]
        nxt = j + 1
    else:
        body = s[i]
        nxt = i + 1
    if body == 'i':
        return (0, 1), nxt
    if body.startswith('i+'):
        return (int(body[2:]), 1), nxt
    if body.isdigit():
        return (int(body), 0), nxt
    raise ValueError('exponent ' + body)


def _qfactor(s, i):
    """s[i] == 'q' -> (coefficient {b: q^a}, next index)"""
    i += 1
    if i < len(s) and s[i] == '^':
        (a, b), i = _exponent(s, i + 1)
    else:
        a, b = 1, 0
    return {b: 1 << a}, i


def parse_poly(s):
    out = {}
    for m in split_top(s, '+'):
        if m == '1':
            out = r_add(out, {0: 1})
        elif m.startswith('q'):
            f, j = _qfactor(m, 0)
            if j != len(m):
                raise ValueError('poly ' + s)
            out = r_add(out, f)
        else:
            raise ValueError('poly ' + s)
    return out


def _symbol(s, i):
    """a basis letter, a starred letter (its dual), or \\ell_i / \\ell_<digit> -> (element, next index)"""
    if s.startswith('\\ell_', i):
        j = i + 5
        if s[j] == '{':
            k = _match(s, j, '{', '}')
            sub, j = s[j + 1:k], k + 1
        else:
            sub, j = s[j], j + 1
        if sub == 'i':
            return {('x', 0): 1, ('y', 1): 1}, j
        if sub.isdigit():
            return {('x', 0): 1, ('y', 0): 1 << int(sub)}, j
        raise ValueError('ell subscript ' + sub)
    ch = s[i]
    if ch in LOWER:
        if s.startswith('^*', i + 1):
            return L(ch.upper()), i + 3
        return L(ch), i + 1
    if ch in UPPER:
        return L(ch), i + 1
    raise ValueError('symbol at %d in %s' % (i, s))


def clean(s):
    for a, b in (('\\,', ''), ('\\!', ''), (' ', ''), ('\n', ''), ('\t', '')):
        s = s.replace(a, b)
    return s


def parse_expr(s):
    """'y+qx', '(1+q)n', 'q(1+q)z', 'q^{i+1}z', '(1+q^{i+2})j', '\\ell_i', 'qn^*', '0' -> element {(letter, k): int}"""
    s = clean(s).rstrip('.').rstrip(',')
    if s in ('0', ''):
        return {}
    out = {}
    for t in split_top(s, '+'):
        coef = {0: 1}
        i = 0
        sym = None
        while i < len(t):
            if t[i] == '(':
                j = _match(t, i)
                coef = r_mul(coef, parse_poly(t[i + 1:j]))
                i = j + 1
            elif t[i] == 'q':
                f, i = _qfactor(t, i)
                coef = r_mul(coef, f)
            else:
                if sym is not None:
                    raise ValueError('two symbols in term ' + t)
                sym, i = _symbol(t, i)
        if sym is None:
            raise ValueError('no basis symbol in term ' + t)
        for k, c in coef.items():
            out = e_add(out, e_scale(sym, c, k))
    return out


def parse_tuple(s):
    s = clean(s)
    if s.startswith('('):
        s = s[1:_match(s, 0)]
    return [parse_expr(x) for x in split_top(s, ',')]


def tuple_after(tex, marker, arrow):
    """the first parenthesised tuple after `arrow` (e.g. '=' or '\\longmapsto') following `marker`"""
    i = tex.index(arrow, tex.index(marker) + len(marker))
    j = tex.index('(', i)
    return parse_tuple(tex[j:_match(tex, j) + 1])


def angle_spans(fragment):
    """every \\langle ... \\rangle in fragment, as lists of raw symbol strings"""
    out, i = [], 0
    while True:
        a = fragment.find('\\langle', i)
        if a < 0:
            return out
        b = fragment.index('\\rangle', a)
        out.append([clean(x) for x in split_top(clean(fragment[a + 7:b]), ',')])
        i = b


def parse_corners(fragment):
    """'eCe&e,x,y,z&eCf&u,v ... fCe&t,j&fCf&f,n' -> {letter: (left, right)}"""
    import re
    out = {}
    for l, r, letters in re.findall(r'([ef])C([ef])&([a-z,]+)', clean(fragment)):
        for ch in letters.split(','):
            if ch:
                out[ch] = (l, r)
    return out


# ---------------------------------------------------------------- algebras

def C_from_products(corners, products):
    """structure constants of C: idempotent actions from the corners, radical products from the list, all else 0"""
    MU = {a: {} for a in LOWER}
    for a in LOWER:
        for b in LOWER:
            if a in 'ef':
                if corners[b][0] == a:
                    MU[a][b] = {b: 1}
            elif b in 'ef':
                if corners[a][1] == b:
                    MU[a][b] = {a: 1}
    for (a, b), val in products.items():
        if any(k for (_, k) in val):
            raise ValueError('a product with a parameter exponent')
        if val:
            MU[a][b] = {l: c for (l, _), c in val.items()}
    return MU


def T_from_C(MUC):
    """T = C x DC with (a phi)(c) = phi(ca), (phi a)(c) = phi(ac), DC^2 = 0; capital letter = dual basis vector"""
    MU = {a: {} for a in LOWER + UPPER}
    for a in LOWER:
        for b in LOWER:
            if MUC[a].get(b):
                MU[a][b] = dict(MUC[a][b])
    for a in LOWER:
        for B in UPPER:
            b = B.lower()
            val = {}
            for c in LOWER:                      # (a b*)(c) = b*(c a) = coefficient of b in c a
                co = MUC[c].get(a, {}).get(b, 0)
                if co:
                    val[c.upper()] = co
            if val:
                MU[a][B] = val
    for A in UPPER:
        a = A.lower()
        for b in LOWER:
            val = {}
            for c in LOWER:                      # (a* b)(c) = a*(b c) = coefficient of a in b c
                co = MUC[b].get(c, {}).get(a, 0)
                if co:
                    val[c.upper()] = co
            if val:
                MU[A][b] = val
    return MU


def endpoints(corners):
    """(left, right) idempotent of every letter of T: the dual of a in iCj lies in jLi"""
    ep = dict(corners)
    for a, (l, r) in corners.items():
        ep[a.upper()] = (r, l)
    return ep


def assoc_failures(MU, letters):
    bad = []
    for a in letters:
        for b in letters:
            ab = e_mul(L(a), L(b), MU)
            for c in letters:
                left = e_mul(ab, L(c), MU)
                right = e_mul(L(a), e_mul(L(b), L(c), MU), MU)
                if left != right:
                    bad.append(a + b + c)
    return bad


def nonzero_words(MU, rad):
    """for each length m, the number of words in the radical letters whose product is nonzero; stops at the first
    length with none (rad^m is spanned by such products, so that length is the nilpotency index)"""
    counts = []
    layer = [((a,), L(a)) for a in rad]
    while layer:
        counts.append(len(layer))
        nxt = []
        for w, val in layer:
            for b in rad:
                p = e_mul(val, L(b), MU)
                if p:
                    nxt.append((w + (b,), p))
        layer = nxt
    return counts


def is_homogeneous(MU, deg):
    bad = []
    for a, row in MU.items():
        for b, val in row.items():
            for v in val:
                if deg[v] != deg[a] + deg[b]:
                    bad.append((a, b, v))
    return bad


# ---------------------------------------------------------------- exact rank, generic in Q = q^n

def _eliminate(rows, zero, mul, add, nz):
    rows = [list(r) for r in rows]
    piv = []
    ncol = len(rows[0]) if rows else 0
    r0 = 0
    for c in range(ncol):
        p = next((i for i in range(r0, len(rows)) if nz(rows[i][c])), None)
        if p is None:
            continue
        rows[r0], rows[p] = rows[p], rows[r0]
        pv = rows[r0][c]
        piv.append(pv)
        for i in range(r0 + 1, len(rows)):
            if nz(rows[i][c]):
                f = rows[i][c]
                rows[i] = [add(mul(pv, x), mul(f, y)) for x, y in zip(rows[i], rows[r0])]
        r0 += 1
    return piv


def rank_int(rows):
    """exact rank over F_2(q) of a matrix with F_2[q] (int) entries"""
    return len(_eliminate(rows, 0, pmul, lambda a, b: a ^ b, bool))


def rank_param(vectors, n0=0):
    """vectors with entries in F_2[q][Q]; returns (generic rank r, {n: rank at Q=q^n} for the finitely many n >= n0
    where a pivot vanishes). For every other n >= n0 the rank is exactly r."""
    if not vectors:
        return 0, {}
    piv = _eliminate(vectors, {}, r_mul, r_add, bool)
    bad = sorted(set(n for p in piv for n in r_zeros(p, n0)))
    return len(piv), {n: rank_int([[r_eval(x, n) for x in v] for v in vectors]) for n in bad}


def rank_for_all(vectors, n0=0):
    """the set of ranks taken at Q = q^n over all n >= n0 (decided exactly; see rank_param)"""
    r, ex = rank_param(vectors, n0)
    return {r} | set(ex.values()), r, ex


def apply_map(f, basis, v):
    """the image of the vector v (coordinates in basis) under the linear map with f(letter) = element"""
    out = {}
    for b, c in zip(basis, v):
        for k, cc in c.items():
            out = e_add(out, e_scale(f(b), cc, k))
    return out


def det_int(m):
    """determinant over F_2[q] by full expansion (characteristic two: no signs); for small matrices"""
    import itertools
    n = len(m)
    s = 0
    for perm in itertools.permutations(range(n)):
        t = 1
        for i in range(n):
            t = pmul(t, m[i][perm[i]])
            if not t:
                break
        s ^= t
    return s


# ---------------------------------------------------------------- release text, letters, twists

from _common import Sources  # noqa: E402


class Patched(Sources):
    """reads the release like Sources (recording the true sha256) and then applies forged edits"""

    def __init__(self, patches):
        Sources.__init__(self)
        self.patches = patches

    def text(self, rel):
        t = Sources.text(self, rel)
        for path, old, new in self.patches:
            if path == rel:
                if old not in t:
                    raise ValueError('forge target not found: ' + old)
                t = t.replace(old, new, 1)
        return t


def between(t, a, b, start=0):
    i = t.index(a, start) + len(a)
    return t[i:t.index(b, i)]


def letter_el(c):
    """an F_2[q] coefficient dict {letter: int} -> element"""
    return {(l, 0): v for l, v in c.items()}


def star(a):
    return a.swapcase()


def eps(a):
    return 1 if a.isupper() else 0


def h(a, s=1):
    """h_H^s on a letter: capital letters (DC) carry H^s"""
    return {(a, s * eps(a)): 1}


def h_el(x, s=1):
    return {(l, k + s * eps(l)): c for (l, k), c in x.items()}


# ---------------------------------------------------------------- span decisions, generic in Q = q^i

def span_symbol(sym):
    """a printed span generator as an element (up to a nonzero scalar, which does not change a span); Q = q^i"""
    special = {'\\ell_{i+1}': {('x', 0): 1, ('y', 1): 2},       # x + q Q y
               '\\ell_{i-1}': {('x', 0): 2, ('y', 1): 1},       # q * (x + q^(i-1) y)
               '\\ell_{-1}': {('x', 0): 2, ('y', 0): 1},        # q * l_-1
               '\\ell_{-2}': {('x', 0): 4, ('y', 0): 1}}        # q^2 * l_-2
    return special[sym] if sym in special else parse_expr(sym)


def shift_Q(x, s):
    """substitute Q -> q^s Q"""
    return {(l, k): c << (s * k) for (l, k), c in x.items()}


def span_decision(f, src_basis, tgt_basis, image, kernel, n0):
    """image(f) = span(image) and ker(f) = span(kernel) for every i >= n0 (Q = q^i); returns (ok, detail)"""
    M = [coords(f(b), tgt_basis) for b in src_basis]
    S = [coords(span_symbol(s), tgt_basis) for s in image]
    K = [coords(span_symbol(s), src_basis) for s in kernel]
    rM, gM, exM = rank_for_all(M, n0)
    rS, _, _ = rank_for_all(S, n0)
    rMS, _, _ = rank_for_all(M + S, n0)
    rK, _, _ = rank_for_all(K, n0)
    in_ker = all(apply_map(f, src_basis, k) == {} for k in K)
    ok = (rM == rS == rMS == {len(S)} and in_ker and rK == {len(K)} and len(K) == len(src_basis) - len(S))
    return ok, 'rank f %s (generic %d, exceptional %s), rank S %s, rank [f|S] %s, kernel vectors killed %s, rank K %s' % (
        sorted(rM), gM, exM, sorted(rS), sorted(rMS), in_ker, sorted(rK))


def spec(x, n):
    """specialise Q -> q^n"""
    out = {}
    for (l, k), c in x.items():
        out[(l, 0)] = out.get((l, 0), 0) ^ (c << (k * n))
    return {key: c for key, c in out.items() if c}


def same_span(A, B, basis, n0):
    VA = [coords(a, basis) for a in A]
    VB = [coords(b, basis) for b in B]
    ra, _, _ = rank_for_all(VA, n0)
    rb, _, _ = rank_for_all(VB, n0)
    rab, _, _ = rank_for_all(VA + VB, n0)
    return ra == rb == rab and len(ra) == 1


def table_after(tex, header):
    """the rows of the array whose header row starts with `header`, as {row label: [cells]}"""
    i = tex.index(header)
    body = tex[i:tex.index('\\end{array}', i)].replace('\\hline', '')
    rows = [r for r in (clean(x) for x in body.split('\\\\')) if r]
    head = rows[0].split('&')
    out = {}
    for r in rows[1:]:
        cells = r.split('&')
        out[cells[0]] = [c.rstrip('.') for c in cells[1:]]
    return head[1:], out
