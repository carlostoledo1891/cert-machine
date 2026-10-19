#!/usr/bin/env python
"""effective.py — Erdős #1's effective rate from a crude bound on the buffer, and what a structural bound would add.

The note (paper/erdos1-explicit.md §3) left one step un-bounded: the buffer K = D ||E H^-1||. It enters the construction
only through k, the number of binary digits, which must exceed log2(r K) by a constant. A crude bound suffices:

  Lemma 5. If H is upper triangular with H[j][j] >= 1 and 0 <= H[i][j] < H[i][i] (i < j) — the canonical Hermite form —
           then |H^-1[i][j]| <= 2^(j-i-1) / H[j][j] for i < j, so K <= D (2^r - 1).
  Lemma 6. With t = ceil((2^k + K)/D), N/2^n <= (Delta_s/2) (1 + (K+D)/2^k)^r (1 + 1/(t-1))^(r+1); for
           k >= k0 = ceil(log2(r(K+D) + 2D(r+1))) that is <= (e/2) Delta_s, i.e. f(n) <= e Delta_s at n = d k.
  Lemma 7. f(n+1) <= f(n) (the set 2A u {1}).
  Theorem. For odd b >= 3, s >= 1, d = b^s: f(n) <= e Delta_s(b) for every n >= d (d + ceil(log2 d) + s).
  Corollary. With b(s) the least odd b with b^(s-1) <= 2^b, Delta_s <= e^1.5 (2/3)^s, so f(n) <= e^2.5 (2/3)^s on that
           range, and f(n) <= n^(-(c0 - o(1))/ln ln n) with c0 = ln(3/2)/2 = 0.2027... — Bloom's form, effective.

This tool (1) checks Lemma 5's entrywise inequality on every cached Hermite form (a sanity check of a proved lemma, with
the largest observed fraction of the bound), and (2) tabulates the theorem exactly for s = 1..S: b(s), d, the
threshold n*, an upper bound on f(n) for n >= n*, and the exponent c it achieves at n*; beside it, the same with the
structural bound K <= 4 N_s^s (b^s - 1) of F. Schmidt's note (decided on 48 cases in certs/erdos1/buffer-structure.json,
NOT proved) — conditional, labelled so. Upper bounds use exact rationals and outward-rounded decimals; nothing is a
float.

usage: python effective.py            -> certs/erdos1/effective-rate.json
       python effective.py --check    re-derive and compare; nothing written
MIT"""
import sys, os, json, gzip, glob, hashlib, time
sys.set_int_max_str_digits(0)
from fractions import Fraction as Fr
from decimal import Decimal, getcontext, ROUND_CEILING, ROUND_FLOOR, localcontext

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OUT = os.path.join(ROOT, 'certs', 'erdos1', 'effective-rate.json')
CHECK = '--check' in sys.argv
S_MAX = 60
LN15_LO = Fr(4054651081, 10 ** 10)      # ln(3/2) = 0.40546510810816...; a rational below it (checked below)
T0 = time.time()
def die(m): print('EFFECTIVE REFUSED: ' + m, file=sys.stderr); sys.exit(1)

def dec(x, up, prec=40):
    with localcontext() as c:
        c.prec = prec; c.rounding = ROUND_CEILING if up else ROUND_FLOOR
        return Decimal(x.numerator) / Decimal(x.denominator)

def _exp_series(y, prec, up):
    """e^y for a Decimal y >= 0: halve until y <= 1/2, sum the Taylor series (all terms positive), square back; rounded
    up with the geometric tail added (an upper bound), or rounded down without it (a lower bound)"""
    with localcontext() as c:
        c.prec = prec + 10; c.rounding = ROUND_CEILING if up else ROUND_FLOOR
        k = 0
        while y / (2 ** k) > Decimal('0.5'): k += 1
        z = y / (2 ** k); term = Decimal(1); total = Decimal(1); n = 1
        while True:
            term = term * z / n; total += term
            if term < Decimal(10) ** -(prec + 8): break
            n += 1
        if up: total += term * 2                  # the tail is below twice the last term when z <= 1/2
        for _ in range(k): total = total * total
        return +total

def exp_up(x, prec=40):
    """an upper bound on e^x for a Decimal x"""
    if x >= 0: return _exp_series(x, prec, True)
    with localcontext() as c:
        c.prec = prec + 10; c.rounding = ROUND_CEILING
        return Decimal(1) / _exp_series(-x, prec, False)

# the rational below ln(3/2), checked: e^LN15_LO < 3/2 (its upper bound is below 1.5)
if not exp_up(dec(LN15_LO, True)) < Decimal('1.5'): die('LN15_LO is not below ln(3/2)')

# ---- (1) Lemma 5 on every cached Hermite form -------------------------------------------------------------
sys.path.insert(0, HERE)
import heapq
def supports(H, r): return [frozenset(i for i in range(r) if H[i][j]) for j in range(r)]
def inverse_columns(H, r, sup):
    """column j of H^-1 by exact back-substitution over the rows that can be nonzero (as instruments/erdos1/structure.py
    does; repeated here because structure.py is a script that runs its grid on import)"""
    cols = []
    for j in range(r):
        x = {j: Fr(1, H[j][j])}; heap = [-i for i in sup[j] if i < j]; heapq.heapify(heap); seen = set(-h for h in heap)
        while heap:
            i = -heapq.heappop(heap)
            v = -sum(H[i][k] * x[k] for k in x if k > i and H[i][k]) / H[i][i]
            if v:
                x[i] = v
                for q in sup[i]:
                    if q < i and q not in seen: seen.add(q); heapq.heappush(heap, -q)
        cols.append(x)
    return cols
lemma = []
for f in sorted(glob.glob(os.path.join(HERE, 'cache', 'H-b*-s*.json.gz'))):
    name = os.path.basename(f)
    if '-a' in name: continue                       # Bloom's gadget only (alpha = 1/2): the tilts have other D
    b, s = int(name.split('-b')[1].split('-')[0]), int(name.split('-s')[1].split('.')[0])
    if b ** s > 1400 and CHECK: continue
    H = json.load(gzip.open(f, 'rt')); r = len(H); D = 2 ** s
    if any(H[j][j] < 1 for j in range(r)) or any(not (0 <= H[i][j] < H[i][i]) for i in range(r) for j in range(i + 1, r)): die('%s is not a reduced triangular form' % name)
    cols = inverse_columns(H, r, supports(H, r))
    worst = Fr(0)
    for j in range(r):
        for i, v in cols[j].items():
            bound = Fr(2 ** max(j - i - 1, 0), H[j][j])
            if abs(v) > bound: die('Lemma 5 fails at %s, entry (%d, %d)' % (name, i, j))
            if i < j: worst = max(worst, abs(v) / bound)
    lemma.append(dict(b=b, s=s, r=r, held=True, largestFractionOfBound=float(worst)))

# ---- (2) the theorem, tabulated ----------------------------------------------------------------------------
def sig12(x):
    with localcontext() as c:
        c.prec = 12; c.rounding = ROUND_CEILING
        return str(+x)

def b_of(s):
    b = 3
    while b ** (s - 1) > 2 ** b: b += 2
    return b

def ln_delta_up(b, s):
    """ln Delta_s <= ((b^s - 1)/(b - 1)) * 2^-b - s ln(3/2)   (ln(1+x) <= x), an exact rational"""
    return Fr(b ** s - 1, b - 1) * Fr(1, 2 ** b) - s * LN15_LO

def ceil_log2(x):   # for a positive integer x
    return (x - 1).bit_length()

rows = []
for s in range(1, S_MAX + 1):
    b = b_of(s); d = b ** s; r = d - 1; D = 2 ** s
    kstar = r + ceil_log2(r) + s + 1                     # crude: K <= D (2^r - 1)
    nstar = d * kstar
    lnD = ln_delta_up(b, s)
    bound_ln = 1 + lnD                                   # ln(e Delta_s) upper bound
    bound = exp_up(dec(bound_ln, True))
    # the exponent achieved at n*: f(n*) <= n*^(-c / ln ln n*)  <=>  c = -ln(bound) ln ln n* / ln n*  (a lower bound on c)
    row = dict(s=s, b=b, d_digits=len(str(d)), log2_nstar=nstar.bit_length(), lnDeltaUpper=str(dec(lnD, True, 20)), fBoundUpper=sig12(bound))
    # conditional: K <= 4 N_s^s (b^s - 1), N_s = 3*2^(s-1) - 1 (the note's structure; decided on 48 cases, not proved)
    Ns = 3 * 2 ** (s - 1) - 1; Kc = 4 * Ns ** s * r
    k0c = ceil_log2(r * (Kc + D) + 2 * D * (r + 1)); row['log2_nstar_ifStructure'] = (d * k0c).bit_length()
    rows.append(row)

# the exponent c reached along the table, from the bit lengths (lower bounds on n* are 2^(bits-1)): computed in Decimal
def c_at(bits, bound_str):
    with localcontext() as c:
        c.prec = 30
        ln2 = Decimal(2).ln(); lnn = (bits - 1) * ln2          # ln n* >= (bits - 1) ln 2
        lnb = Decimal(bound_str).ln()
        return round(float(-lnb * lnn.ln() / ((bits) * ln2)), 6) if lnb < 0 else None   # an estimate (30-digit decimal, not outward-rounded): informational
for row in rows:
    row['cAtNstar'] = c_at(row['log2_nstar'], row['fBoundUpper'])
    row['cAtNstar_ifStructure'] = c_at(row['log2_nstar_ifStructure'], row['fBoundUpper'])

rec = dict(what='Erdős #1, the effective rate: Lemma 5 (the inverse of a reduced triangular form, so K <= D(2^r - 1)) checked on every cached Hermite form, and the effective theorem f(n) <= e·Delta_s(b) for n >= d(d + ceil(log2 d) + s) tabulated for s = 1..%d with b(s) the least odd b with b^(s-1) <= 2^b; beside it, conditional on the structural bound of F. Schmidt\'s note (not proved), the threshold it would give. Written by instruments/erdos1/effective.py.' % S_MAX,
           c0='ln(3/2)/2 = 0.20273255405408219...', ln15Lower=str(LN15_LO), lemma5=lemma, table=rows,
           decider=hashlib.sha256(open(os.path.abspath(__file__), 'rb').read()).hexdigest())
if CHECK:
    was = json.load(open(OUT))
    if [x for x in was['table']] != rows: die('the table does not re-derive as recorded')
    W = {(x['b'], x['s']): x for x in was['lemma5']}
    for x in lemma:
        w = W.get((x['b'], x['s']))
        if not w or w['largestFractionOfBound'] != x['largestFractionOfBound']: die('Lemma 5 does not re-derive at %s' % ((x['b'], x['s']),))
    print('effective-rate battery: Lemma 5 on %d cached forms, the table of %d rows re-derived (%.1fs)' % (len(lemma), len(rows), time.time() - T0))
else:
    rec['generated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()); rec['seconds'] = round(time.time() - T0, 1)
    json.dump(rec, open(OUT, 'w'), indent=1); open(OUT, 'a').write('\n')
    print('wrote certs/erdos1/effective-rate.json — Lemma 5 held on %d forms (largest fraction of the bound %.3g); s = 1..%d tabulated' % (len(lemma), max(x['largestFractionOfBound'] for x in lemma), S_MAX))
    for x in rows[:12] + rows[19::10]:
        print('  s=%2d b=%3d d has %3d digits  log2 n* = %6d  f(n) <= %-22s c at n* ~ %s   | if the structure is proved: log2 n* = %d, c ~ %s' % (x['s'], x['b'], x['d_digits'], x['log2_nstar'], x['fBoundUpper'][:22], x['cAtNstar'], x['log2_nstar_ifStructure'], x['cAtNstar_ifStructure']))
