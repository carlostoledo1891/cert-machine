#!/usr/bin/env python3
"""instruments/kissing/wave/battery.py — the September-wave engine: calibrations that must certify,
red controls that must fire, and a walk of certs/kissing-wave.json.

Runs in under a minute: the calibrations are small (E8, D4, the Leech shell's signature on sampled
rows), the bulk paths are exercised on small configurations where plain Python integers can decide
every pair too, and the record is walked, not recomputed (tools/run-kissing-wave.py recomputes it).
"""
import hashlib, json, os, pickle, random, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, HERE)
import engine, qfield as QF, leech, pklread, claims   # noqa: E402

passed = failed = reds = fired = 0


def ok(cond, name):
    global passed, failed
    if cond:
        passed += 1
    else:
        failed += 1
        print('FAIL ' + name)


def red(cond, name):
    global passed, failed, reds, fired
    reds += 1
    if cond:
        fired += 1
        passed += 1
    else:
        failed += 1
        print('RED DID NOT FIRE ' + name)


quiet = lambda *a: None


def fam(name, rows, comp=0, **kw):
    rows = np.array(rows, dtype=np.int64)
    C = np.zeros((4,) + rows.shape, dtype=np.int64)
    C[comp] = rows
    return engine.Family(name, C, **kw)


def brute(fams, N):
    """every pair in plain Python integers: (violations, contacts)"""
    rows = []
    for F in fams:
        for i in range(F.n):
            rows.append(F.row(i))
    v = c = 0
    for i in range(len(rows)):
        for j in range(i + 1, len(rows)):
            (x, dx), (y, dy) = rows[i], rows[j]
            sg = QF.sign(*QF.sub(QF.scale(N, dx * dy), QF.scale(engine.dot_py(x, y), 2)))
            v += sg < 0
            c += sg == 0
    return v, c


# ---- the reference sign and the bulk sign agree, including near-ties and the fallbacks ----
rng = random.Random(20261005)
A, B, C, D, ref = [], [], [], [], []
for t in range(30000):
    m = 10 ** rng.choice([1, 3, 6, 9])
    a, b, c, d = (rng.randint(-m, m) for _ in range(4))
    if t % 4 == 0:
        b = d = 0
    if t % 9 == 0:
        a, c = 1351 * rng.choice([1, -1]), 780 * rng.choice([1, -1])     # 1351^2 - 3 780^2 = 1
    A.append(a); B.append(b); C.append(c); D.append(d); ref.append(QF.sign(a, b, c, d))
got = QF.sign_arrays(A, B, C, D)
ok(all(int(g) == r for g, r in zip(got, ref)), 'sign_arrays agrees with the Python-integer tower on 30,000 elements (Pell near-ties included)')
ok(QF.sign(1351, 0, -780, 0) == 1 and QF.sign(-1351, 0, 780, 0) == -1 and QF.sign(0, 0, 0, 0) == 0 and QF.sign(-5, 0, 0, 2) == -1,
   'reference signs: 1351 - 780 sqrt3 > 0, its negative < 0, zero is 0, -5 + 2 sqrt6 < 0')
try:
    QF.sign_pm(2, -1, 4)
    r_ = False
except ArithmeticError:
    r_ = True
red(r_, 'a forced tie 2 - 1*sqrt4 raises instead of returning a sign')

# ---- calibrations through the engine ----
e8 = []
for a in range(8):
    for b in range(a + 1, 8):
        for sa in (2, -2):
            for sb in (2, -2):
                v = [0] * 8; v[a] = sa; v[b] = sb; e8.append(v)
for mm in range(256):
    if bin(mm).count('1') % 2 == 0:
        e8.append([(-1 if mm >> i & 1 else 1) for i in range(8)])
r = engine.decide([fam('e8', e8)], (8, 0, 0, 0), log=quiet)
ok(r['verdict'] == 'CERTIFIED' and r['contacts'] == 6720 and r['pairs'] == 28680, 'calibration: E8 through the engine — 240 roots, 6720 contacts')
d4 = [[(s1 if k == a else (s2 if k == b else 0)) for k in range(4)] for a in range(4) for b in range(a + 1, 4) for s1 in (1, -1) for s2 in (1, -1)]
half = len(d4) // 2
r = engine.decide([fam('d4a', d4[:half]), fam('d4b', d4[half:])], (2, 0, 0, 0), log=quiet)
ok(r['verdict'] == 'CERTIFIED' and r['contacts'] == 96 and r['pairs'] == 276 and r['spotCheck']['disagreements'] == 0, 'calibration: D4 split in two families — 24 roots, 96 contacts, every pair accounted for')

# ---- the Leech shell built here: Golay code checked, signature on sampled rows, the claimants' owners inside ----
W, X, idx, ws = claims.kravatsky_shell()
ok(X.shape == (196560, 24), 'the Leech shell: 196,560 minimal vectors from the Golay code recovered from the published owners')
ok(all(s == leech.SIGNATURE for s in leech.signature_sample(X, [5, 50000, 150000])), 'its inner-product signature 1 / 4600 / 47104 / 93150 / 47104 / 4600 / 1 on sampled rows')
basis = claims._f2_basis([int(''.join(str(int(b)) for b in w), 2) for w in W])
rows_ok = [format(b, '024b') for b in basis]
ok(len(leech.golay_from_rows(rows_ok)) == 4096, 'the recovered basis rebuilds the same 4096-word code')
bad_rows = list(rows_ok)
bad_rows[3] = bad_rows[3][:5] + ('0' if bad_rows[3][5] == '1' else '1') + bad_rows[3][6:]
try:
    leech.golay_from_rows(bad_rows)
    r_ = False
except ValueError:
    r_ = True
red(r_, 'a Golay basis with one bit flipped is refused (weight distribution)')

# ---- bulk paths against plain integers on small mixed-field configurations ----
# d18 slice: 60 equator + 60 tiers + 6 poles + 60 tier B, every path exercised (rational, Z[sqrt3], Q(sqrt2,sqrt3))
c18 = claims.kravatsky_18()
small = []
for F in c18['families']:
    k = min(F.n, 60)
    small.append(engine.Family(F.name, F.C[:, :k, :]))
r = engine.decide(small, c18['N'], spot=50, log=quiet)
bv, bc = brute(small, c18['N'])
ok(r['violations'] == bv == 0 and r['contacts'] == bc and r['pairs'] == sum(F.n for F in small) * (sum(F.n for F in small) - 1) // 2,
   'd18 slice: the bulk paths and plain Python integers agree pair for pair (%d contacts)' % bc)
# a repeated vector, an off-norm vector
tb = c18['families'][3]
Cr = np.concatenate([tb.C[:, :5, :], tb.C[:, :1, :]], axis=1)
r = engine.decide([engine.Family('tb', Cr)], c18['N'], log=quiet)
red(r['verdict'] == 'REFUTED' and r['violations'] == 1, 'a repeated vector refutes, with exactly one violating pair')
Co = tb.C[:, :5, :].copy(); Co[0, 2, 0] += 1
try:
    engine.decide([engine.Family('tb', Co)], c18['N'], log=quiet)
    r_ = False
except AssertionError:
    r_ = True
red(r_, 'a vector off the common norm is refused before any pair is decided')
# the exactness guard
Cb = np.zeros((4, 3, 24), dtype=np.int64); Cb[0, :, 0] = [1 << 40, 3, 5]; Cb[0, :, 1] = [0, 1 << 40, 7]
try:
    engine.gram_components(Cb, Cb)
    r_ = False
except OverflowError:
    r_ = True
red(r_, 'a GEMM whose partial sums could reach 2^53 is refused, not rounded')
# a sabotaged block function is caught by the spot check (the spot check runs THE SAME block code)
real = engine._block


def sabotaged(F, G_, N, i0, i1, j0, j1, tri, fast, two=None):
    out = real(F, G_, N, i0, i1, j0, j1, tri, fast, two)
    if out['contacts']:
        out['contacts'] -= 1
    return out


engine._block = sabotaged
try:
    r = engine.decide(small, c18['N'], spot=50, log=quiet)
finally:
    engine._block = real
red(r['verdict'] == 'DISAGREEMENT' and r['spotCheck']['disagreements'] > 0, 'a block routine that drops a contact is caught by the plain-integer spot check')

# ---- the limb path for big numerators, against plain integers ----
rng = random.Random(7)
big_rows, dens = [], []
eq = X[:6000].astype(np.int64)
for t in range(6):
    # a shell vector written as a rational with a 10^19 denominator: the same direction, a repeated vector
    z = eq[rng.randrange(6000)]
    Dn = 10 ** 19 + rng.randrange(1000)
    row = np.zeros((4, 24), dtype=object)
    for k in range(24):
        row[0, k] = int(z[k]) * Dn
    big_rows.append(row); dens.append(Dn)
Fb = engine.Family('big', np.stack(big_rows, axis=1), den=dens)
Fe = fam('eq', eq)
r = engine.decide([Fe, Fb], (32, 0, 0, 0), spot=0, log=quiet)
blk = [b for b in r['blocks'] if b['a'] == 'eq' and b['b'] == 'big'][0]
v = c = 0
for i in range(Fb.n):
    x, dx = Fb.row(i)
    for j in range(Fe.n):
        y, _ = Fe.row(j)
        sg = QF.sign(*QF.sub(QF.scale((32, 0, 0, 0), dx), QF.scale(engine.dot_py(x, y), 2)))
        v += sg < 0; c += sg == 0
ok('digits' in blk.get('gemm', {}) and blk['violations'] == v and blk['contacts'] == c, 'the limb path (balanced 2^22 digits) agrees with plain integers on 36,000 big-numerator pairs (%d violations, %d contacts)' % (v, c))
red(v > 0, 'a vector repeated as a 10^19-denominator rational is a violation the limb path sees')

# ---- the pickle reader executes nothing and refuses what it does not know ----
class Boom:
    def __reduce__(self):
        return (os.system, ('touch ' + os.path.join(HERE, '.pwned'),))


raw = pickle.dumps({'rat': [Boom()]}, protocol=4)
obj, _ = pklread.read(raw)
call = obj['rat'][0]
red(isinstance(call, pklread.Call) and call.func.name == 'system' and not os.path.exists(os.path.join(HERE, '.pwned')),
    'a pickle that would run os.system is READ as an inert Call(Ref(posix.system)) and nothing runs')
try:
    pklread.read(pickle.dumps(set([1, 2]), protocol=4))
    r_ = False
except ValueError:
    r_ = True
red(r_, 'an opcode outside the whitelist (EMPTY_SET) refuses the whole file')
try:
    claims._parse_fraction(call)
    r_ = False
except ValueError:
    r_ = True
red(r_, 'the Fraction reader refuses anything but Fraction(str of an integer ratio)')

# ---- the record, walked ----
OUT = os.path.join(ROOT, 'certs', 'kissing-wave.json')
if os.path.exists(OUT):
    rec = json.load(open(OUT))
    msha = hashlib.sha256(open(os.path.join(ROOT, 'corpus', 'kissing', 'wave.meta.json'), 'rb').read()).hexdigest()
    ok(rec['pins']['manifestSha256'] == msha, 'the record was decided against the pinned manifest on disk')
    ok(all(c['ok'] for c in rec.get('calibrations', [])) and {c['id'] for c in rec.get('calibrations', [])} >= {'cal-e8-240', 'cal-leech-196560'},
       'record: E8 and the whole Leech shell (19,317,818,520 pairs) certified in the run')
    ok(all(rd['caught'] for rd in rec.get('reds', [])) and len(rec.get('reds', [])) >= 5, 'record: every red control of the run was caught')
    decided = [r_ for r_ in rec['rows'] if r_.get('engine')]
    # the runner writes after every claim so a long run can resume; a run that stops part-way therefore
    # leaves a well-formed record with rows missing, and every check below is happy with fewer rows
    # (2026-10-05: a crash at takhanov-yun-25 left exactly that, and this battery passed it 29/0)
    want, have = set(claims.BUILDERS), {r_['id'] for r_ in decided}
    ok(want <= have, 'record: every buildable claim was decided in the run (%d of %d)' % (len(want & have), len(want)))
    red(not (want <= (have - {sorted(want)[0]})), 'a record with one buildable claim missing is refused')
    ok(all(r_['engine']['pairs'] == r_['engine']['n'] * (r_['engine']['n'] - 1) // 2 for r_ in decided), 'record: every decided row accounts for all n(n-1)/2 pairs')
    ok(all(r_['engine']['spotCheck']['disagreements'] == 0 for r_ in decided), 'record: no plain-integer spot check disagreed')
    ok(all(r_.get('jsCheck', {}).get('agree') for r_ in decided), 'record: every decided row has a seeded sample decided whole in JavaScript (basis.js) that agrees with the Python engine')
    ok(all(r_['verdict'] == ('REPAIRED' if r_.get('decode') else 'WITNESSED') for r_ in decided if r_['engine']['verdict'] == 'CERTIFIED'),
       'record: WITNESSED exactly when no float decode was needed, REPAIRED otherwise')
    ok(all(r_['engine']['n'] == r_['claimed'] for r_ in decided if not r_.get('hunt')), 'record: every decided configuration has exactly the claimed number of points')
    nd = [r_ for r_ in rec['rows'] if r_['verdict'] == 'NEEDS DATA']
    ok(all(r_.get('detail') for r_ in nd), 'record: every NEEDS DATA row states what would decide it')
    # live: the d18 row re-decided here, every pair, by the Python engine
    r18 = [r_ for r_ in rec['rows'] if r_['id'] == 'kravatsky-18']
    if r18:
        rr = engine.decide(c18['families'], c18['N'], spot=20, log=quiet)
        ok(rr['pairs'] == r18[0]['engine']['pairs'] and rr['contacts'] == r18[0]['engine']['contacts'] and rr['verdict'] == 'CERTIFIED',
           'live: dimension 18 re-decided, every pair, with the recorded contact count')
else:
    print('note: certs/kissing-wave.json not present yet')

print('kissing wave battery: %d pass, %d fail, %d/%d red controls fired' % (passed, failed, fired, reds))
sys.exit(1 if failed else 0)
