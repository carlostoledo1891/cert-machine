"""qfield.py — exact arithmetic in Q(sqrt2, sqrt3) over the Q-basis {1, sqrt2, sqrt3, sqrt6}.

An element is four integers (a, b, c, d) meaning a + b sqrt2 + c sqrt3 + d sqrt6 (a common positive
denominator never changes a sign). The field is the tower Q(sqrt2)(sqrt3): x + y sqrt3 with
x = a + b sqrt2, y = c + d sqrt2, and ONE sign rule at every level — same-signed parts decide at
once, otherwise compare x^2 with m y^2 in the level below. The ties x^2 = 2 y^2 over Q and
x^2 = 3 y^2 over Q(sqrt2) are impossible for (x, y) != 0, and the code raises if it ever sees one.

Two implementations live here and the battery holds them against each other:
  sign(a, b, c, d)        Python integers, unbounded — the reference
  sign_arrays(A, B, C, D) numpy int64 arrays — the bulk path: decides the same-signed and the
                          two-component cases in int64 under explicit magnitude guards, and hands
                          every other element to the reference, one Python integer at a time.
"""
import numpy as np


def sign_z(x):
    return (x > 0) - (x < 0)


def sign_q2(a, b):
    """sign of a + b sqrt2, integers"""
    sa, sb = sign_z(a), sign_z(b)
    if sa >= 0 and sb >= 0:
        return 1 if (sa or sb) else 0
    if sa <= 0 and sb <= 0:
        return -1
    t = a * a - 2 * b * b
    if t == 0:
        raise ArithmeticError('a^2 = 2 b^2 with (a, b) != 0: impossible over Q')
    return 1 if (sa > 0) == (t > 0) else -1


def sign_pm(p, q, m):
    """sign of p + q sqrt(m) for integers; m must not be a perfect square, and a tie p^2 = m q^2 with
    (p, q) != 0 raises (it is how a mis-built field would show itself)"""
    sp, sq = sign_z(p), sign_z(q)
    if sp >= 0 and sq >= 0:
        return 1 if (sp or sq) else 0
    if sp <= 0 and sq <= 0:
        return -1
    t = p * p - m * q * q
    if t == 0:
        raise ArithmeticError('p^2 = %d q^2 with (p, q) != 0' % m)
    return 1 if (sp > 0) == (t > 0) else -1


def sign(a, b, c, d):
    """sign of a + b sqrt2 + c sqrt3 + d sqrt6, integers: x + y sqrt3 with x = a + b sqrt2, y = c + d sqrt2"""
    sx, sy = sign_q2(a, b), sign_q2(c, d)
    if sx >= 0 and sy >= 0:
        return 1 if (sx or sy) else 0
    if sx <= 0 and sy <= 0:
        return -1
    # x^2 - 3 y^2 in Z[sqrt2]:  x^2 = a^2 + 2b^2 + 2ab sqrt2,  y^2 = c^2 + 2d^2 + 2cd sqrt2
    t0 = a * a + 2 * b * b - 3 * (c * c + 2 * d * d)
    t1 = 2 * a * b - 6 * c * d
    st = sign_q2(t0, t1)
    if st == 0:
        raise ArithmeticError('x^2 = 3 y^2 with (x, y) != 0: impossible over Q(sqrt2)')
    return 1 if (sx > 0) == (st > 0) else -1


def mul(u, v):
    """product of two elements (a, b, c, d) — the multiplication table of {1, sqrt2, sqrt3, sqrt6}"""
    a, b, c, d = u
    e, f, g, h = v
    return (a * e + 2 * b * f + 3 * c * g + 6 * d * h,
            a * f + b * e + 3 * (c * h + d * g),
            a * g + c * e + 2 * (b * h + d * f),
            a * h + d * e + b * g + c * f)


def add(u, v):
    return tuple(x + y for x, y in zip(u, v))


def sub(u, v):
    return tuple(x - y for x, y in zip(u, v))


def scale(u, k):
    return tuple(x * k for x in u)


def approx(u):
    a, b, c, d = u
    return float(a) + float(b) * 2 ** 0.5 + float(c) * 3 ** 0.5 + float(d) * 6 ** 0.5


def show(u, den=1):
    a, b, c, d = (int(x) for x in u)
    parts = []
    for coef, r in ((a, ''), (b, '√2'), (c, '√3'), (d, '√6')):
        if coef:
            parts.append(('%d%s' % (coef, r)) if (coef != 1 or not r) else r)
    s = ' + '.join(parts).replace('+ -', '− ') if parts else '0'
    return s if den == 1 else '(%s)/%d' % (s, den)


LIM30 = 1 << 30
LIM29 = 1 << 29
fallbacks = [0]


def sign_arrays(A, B, C, D):
    """vectorized exact sign of A + B sqrt2 + C sqrt3 + D sqrt6 for int64 arrays of one shape.
    Returns int8 signs. int64 is used only under guards that keep every product below 2^62."""
    A = np.asarray(A, dtype=np.int64); B = np.asarray(B, dtype=np.int64)
    C = np.asarray(C, dtype=np.int64); D = np.asarray(D, dtype=np.int64)
    out = np.zeros(A.shape, dtype=np.int8)
    nz = (A != 0) | (B != 0) | (C != 0) | (D != 0)
    pos = (A >= 0) & (B >= 0) & (C >= 0) & (D >= 0) & nz
    neg = (A <= 0) & (B <= 0) & (C <= 0) & (D <= 0) & nz
    out[pos] = 1
    out[neg] = -1
    mixed = nz & ~pos & ~neg
    if not mixed.any():
        return out
    idx = np.nonzero(mixed)
    a, b, c, d = A[idx], B[idx], C[idx], D[idx]
    res = np.zeros(a.shape, dtype=np.int8)
    done = np.zeros(a.shape, dtype=bool)
    # two-component cases: p + q sqrt(m), mixed signs: sign = sign(p) if p^2 > m q^2 else sign(q)
    for (p, q, m, lim, sel) in ((a, c, 3, LIM30, (b == 0) & (d == 0)),
                                (a, b, 2, LIM30, (c == 0) & (d == 0)),
                                (a, d, 6, LIM29, (b == 0) & (c == 0))):
        s = sel & ~done & (np.abs(p) < lim) & (np.abs(q) < lim)
        if s.any():
            t = p[s] * p[s] - m * q[s] * q[s]
            if (t == 0).any():
                raise ArithmeticError('p^2 = %d q^2 with (p, q) != 0' % m)
            res[s] = np.where(t > 0, np.sign(p[s]), np.sign(q[s])).astype(np.int8)
            done |= s
    # b sqrt2 + c sqrt3 with a = d = 0: compare 2 b^2 with 3 c^2
    s = ~done & (a == 0) & (d == 0) & (np.abs(b) < LIM30) & (np.abs(c) < LIM30)
    if s.any():
        t = 2 * b[s] * b[s] - 3 * c[s] * c[s]
        if (t == 0).any():
            raise ArithmeticError('2 b^2 = 3 c^2 with (b, c) != 0')
        res[s] = np.where(t > 0, np.sign(b[s]), np.sign(c[s])).astype(np.int8)
        done |= s
    # the whole tower in int64, for elements whose components stay below 8000: x = a + b sqrt2,
    # y = c + d sqrt2; sign(x), sign(y) compare a^2 with 2 b^2 (< 2^27); when they differ,
    # t = x^2 - 3 y^2 = t0 + t1 sqrt2 with |t0|, |t1| < 12 * 8000^2 < 2^30, and sign(t) compares
    # t0^2 with 2 t1^2 (< 2^61) — every product below 2^62, nothing rounded
    s = ~done & (np.abs(a) <= 8000) & (np.abs(b) <= 8000) & (np.abs(c) <= 8000) & (np.abs(d) <= 8000)
    if s.any():
        aa, bb, cc, dd = a[s], b[s], c[s], d[s]

        def sq2(p, q):
            sp, sq_ = np.sign(p), np.sign(q)
            t = p * p - 2 * q * q
            mixed_ = (sp * sq_) < 0
            if np.any(mixed_ & (t == 0)):
                raise ArithmeticError('p^2 = 2 q^2 with (p, q) != 0')
            return np.where(mixed_, np.where(t > 0, sp, sq_), np.where(sp != 0, sp, sq_))
        sx, sy = sq2(aa, bb), sq2(cc, dd)
        t0 = aa * aa + 2 * bb * bb - 3 * (cc * cc + 2 * dd * dd)
        t1 = 2 * aa * bb - 6 * cc * dd
        st = sq2(t0, t1)
        mixed_xy = (sx * sy) < 0
        if np.any(mixed_xy & (st == 0)):
            raise ArithmeticError('x^2 = 3 y^2 with (x, y) != 0')
        res[s] = np.where(mixed_xy, np.where(st > 0, sx, sy), np.where(sx != 0, sx, sy)).astype(np.int8)
        done |= s
    rest = np.nonzero(~done)[0]
    fallbacks[0] += len(rest)
    for k in rest:
        res[k] = sign(int(a[k]), int(b[k]), int(c[k]), int(d[k]))
    out[idx] = res
    return out
