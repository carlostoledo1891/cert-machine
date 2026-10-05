"""claims.py — each September-2026 claim, rebuilt from its pinned bytes and the claimant's own
construction table, as engine families in exact coordinates.

Every builder returns a dict:
    id, claimant, dim, claimed            the row and the number the claimant prints
    N                                     the common exact norm of every vector (a, b, c, d)
    families                              engine.Family list
    facts                                 statements about the bytes, each CHECKED here (a failed one raises)
    decode                                for float-stored coordinates: how the exact point was recovered and the
                                          largest distance between the published float and the exact value
    choices                               anything the claimant's text leaves free that the rebuild had to fix
                                          (with the reason it cannot change the verdict's meaning)
Coordinates are integer combinations of {1, sqrt2, sqrt3, sqrt6} (engine order c1, c2, c3, c6).

Units: every Leech-based claim is written in the claimants' "Cohn units" (coordinates of the norm-4
picture times sqrt8: minimal vectors are integer vectors of norm 32), then scaled by a small integer
so that every coordinate is integral. Nothing here imports, runs or copies claimant code; the
Leech shell comes from leech.py with the Golay code recovered from the claimants' own owner vectors.
"""
import io, json, hashlib, os, math, itertools
from fractions import Fraction
import numpy as np
import leech, pklread
import qfield as QF
from engine import Family

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
WAVE = os.path.join(ROOT, 'corpus', 'kissing', 'wave')
META = json.load(open(os.path.join(ROOT, 'corpus', 'kissing', 'wave.meta.json')))
KRAV = 'verifications/improved/'
S2, S3, S6 = math.sqrt(2), math.sqrt(3), math.sqrt(6)


class Bytes:
    """pinned bytes, re-hashed at every read"""
    used = {}

    @staticmethod
    def raw(src, rel):
        f = META['sources'][src]['files'][rel]
        p = os.path.join(WAVE, '.cache', src, rel) if f['cached'] else os.path.join(WAVE, src, rel)
        if not os.path.exists(p):
            raise FileNotFoundError('not fetched: %s %s (python3 tools/pin-kissing-wave.py --fetch)' % (src, rel))
        b = open(p, 'rb').read()
        h = hashlib.sha256(b).hexdigest()
        if h != f['sha256']:
            raise AssertionError('DRIFT %s %s: %s != pinned %s' % (src, rel, h, f['sha256']))
        Bytes.used[src + ':' + rel] = h
        return b


def npy(src, rel):
    return np.load(io.BytesIO(Bytes.raw(src, rel)), allow_pickle=False)


def jsn(src, rel):
    return json.loads(Bytes.raw(src, rel).decode('utf-8'))


class Facts(list):
    def check(self, cond, what):
        if not cond:
            raise AssertionError('FACT FAILED: ' + what)
        self.append(what)


def zeros(n, dim):
    return np.zeros((4, n, dim), dtype=np.int64)


# ---------------------------------------------------------------- the Leech shell, in the claimants' coordinates
_SHELL = {}


def _f2_basis(words):
    basis = []
    for v in words:
        for b in basis:
            v = min(v, v ^ b)
        if v:
            basis.append(v)
    return basis


def golay_from_owners(arrays):
    """the Golay code as the F2-span of the octads and odd-vector residue sets of published Leech vectors"""
    words = []
    for A in arrays:
        for r in np.asarray(A):
            a = np.abs(r)
            if a.max() == 2 and (a > 0).sum() == 8:
                words.append(int(''.join('1' if x else '0' for x in (a > 0)), 2))
            elif a.max() == 3:
                words.append(int(''.join('1' if int(x) % 4 == 3 else '0' for x in r), 2))
    basis = _f2_basis(words)
    if len(basis) != 12:
        raise AssertionError('owner supports span a code of dimension %d, not 12' % len(basis))
    return leech.golay_from_rows([format(b, '024b') for b in basis])


def kravatsky_shell():
    if 'K' not in _SHELL:
        arrays = [npy('kravatsky', KRAV + 'dim25-lens-heads/data/heads_U.npy'),
                  npy('kravatsky', KRAV + 'dim26-27-iota-triangles/data/heads27_layer2_u.npy'),
                  npy('kravatsky', KRAV + 'dim28-norm8-frame-layer/data/classes.npy').reshape(-1, 24),
                  npy('kravatsky', KRAV + 'dim29-30-frame-layer/data/owners29.npy'),
                  npy('kravatsky', KRAV + 'dim29-30-frame-layer/data/owners30.npy'),
                  npy('kravatsky', KRAV + 'dim31-frame-layer/data/owners31.npy')]
        W = golay_from_owners(arrays)
        X = leech.shell(W)
        sig = leech.signature_sample(X, [0, 1103, 1104, 98255, 98256, 196559])
        if any(s != leech.SIGNATURE for s in sig):
            raise AssertionError('Leech signature failed')
        _SHELL['K'] = (W, X, leech.index(X), {w.tobytes() for w in W})
    return _SHELL['K']


def in_shell(rows, idx):
    return [idx.get(np.asarray(r, dtype=np.int8).tobytes()) for r in rows]


# ---------------------------------------------------------------- 2 cos(30 m deg) = alpha + beta sqrt3
TWO_COS = [(2, 0), (0, 1), (1, 0), (0, 0), (-1, 0), (0, -1), (-2, 0), (0, -1), (-1, 0), (0, 0), (1, 0), (0, 1)]


def two_cos(m):
    return TWO_COS[m % 12]


def two_sin(m):
    return TWO_COS[(m - 3) % 12]


# ================================================================ Kravatsky, dimension 18
def kravatsky_18():
    P = KRAV + 'dim18-bent-hexagon/data/'
    octads = jsn('kravatsky', P + 'octads.json')['octads']
    F = jsn('kravatsky', P + 'families.json')
    fams = F['families_at_angles_0_60_120']
    T = jsn('kravatsky', P + 'tierB.json')
    facts = Facts()
    facts.check(len(octads) == 30 and all(len(set(o)) == 8 for o in octads), '30 octads of 8 coordinates')
    facts.check(len(fams) == 3 and all(len(f) == 16 and all(len(set(S)) == 6 for S in f) for f in fams), 'three families of sixteen 6-sets')
    facts.check(F['pattern_parity'] == 'odd' and T['radius_squared_norm8_units'] == '8/9', 'odd sign patterns; tier-B radius^2 = 8/9')
    facts.check('bit 15-i is coordinate i' in T['encoding'], "tier-B bit order as tierB.json states it: 'bit 15-i is coordinate i'")
    slots = T['slots_deg_to_words']
    facts.check(sorted(int(k) for k in slots) == [30, 90, 150, 210, 270, 330] and all(len(w) == 160 for w in slots.values()), '160 words at each of 30, 90, ..., 330 degrees')
    rows = []   # (v16 ints scaled by 6, r, m): p = r sqrt2 (cos 30m, sin 30m)

    def odd(S, mag):
        for bits in range(1 << len(S)):
            if bin(bits).count('1') % 2:
                v = [0] * 16
                for t, i in enumerate(S):
                    v[i] = -mag if bits >> t & 1 else mag
                yield v
    for i in range(16):
        for j in range(i + 1, 16):
            for si in (12, -12):
                for sj in (12, -12):
                    v = [0] * 16; v[i] = si; v[j] = sj
                    rows.append((v, 0, 0, 'equator'))
    for o in octads:
        for v in odd(o, 6):
            rows.append((v, 0, 0, 'equator'))
    for k in range(6):
        for S in fams[k % 3]:
            for v in odd(S, 6):
                rows.append((v, 6, 2 * k, 'tiers'))
    for k in range(6):
        rows.append(([0] * 16, 12, 2 * k, 'poles'))
    for deg in sorted(int(k) for k in slots):
        for w in slots[str(deg)]:
            rows.append(([(-4 if (w >> (15 - i)) & 1 else 4) for i in range(16)], 4, deg // 30, 'tier B'))
    out = []
    for name in ('equator', 'tiers', 'poles', 'tier B'):
        R = [r for r in rows if r[3] == name]
        C = zeros(len(R), 18)
        for q, (v, r, m, _) in enumerate(R):
            C[0, q, :16] = v
            if r:
                (ca, cb), (sa, sb) = two_cos(m), two_sin(m)
                C[1, q, 16], C[3, q, 16] = (r // 2) * ca, (r // 2) * cb
                C[1, q, 17], C[3, q, 17] = (r // 2) * sa, (r // 2) * sb
        out.append(Family(name, C))
    return {'id': 'kravatsky-18', 'claimant': 'kravatsky', 'dim': 18, 'claimed': 8358, 'N': (288, 0, 0, 0),
            'families': out, 'facts': facts, 'decode': None,
            'scale': 'norm-8 units of the README times 6: every coordinate an integer combination of 1, sqrt2, sqrt6',
            'choices': []}


# ================================================================ Kravatsky, dimension 25 (and its decode)
def _parse_fraction(call):
    if not (isinstance(call, pklread.Call) and call.func.module == 'fractions' and call.func.name == 'Fraction'
            and len(call.args) == 1 and isinstance(call.args[0], str)):
        raise ValueError('not a Fraction(str) call: %r' % (call,))
    s = call.args[0]
    num, _, den = s.partition('/')
    if not num.lstrip('-').isdigit() or (den and not den.isdigit()):
        raise ValueError('not an integer ratio: %r' % s)
    return Fraction(int(num), int(den or '1'))


def kravatsky_25_data():
    """the decode of the dimension-25 bytes: owners, leans, rational heads, extra lean — shared by
    the Kravatsky row and the Qiushi cross-check"""
    P = KRAV + 'dim25-lens-heads/data/'
    W, X, idx, ws = kravatsky_shell()
    U = npy('kravatsky', P + 'heads_U.npy').astype(np.int64)
    HX = npy('kravatsky', P + 'heads_X.npy')
    EP = npy('kravatsky', P + 'extra_P.npy')
    obj, nops = pklread.read(Bytes.raw('kravatsky', P + 'heads_exact.pkl'))
    facts = Facts()
    facts.check(set(obj) == {'rat', 'cls', 'U'}, 'the pickle (read opcode by opcode, %d opcodes, never unpickled) holds rat, cls, U' % nops)
    st = obj['U'].state
    dt = st[2]
    facts.check(isinstance(dt, pklread.Call) and dt.func.name == 'dtype' and dt.args[0] == 'i8' and dt.state[1] == '<' and st[1] == (1016, 24),
                "its U is a 1016 x 24 little-endian int64 array")
    Up = np.frombuffer(st[4], dtype='<i8').reshape(1016, 24)
    facts.check(np.array_equal(Up, U), 'its U equals heads_U.npy entry for entry')
    rat = {int(i): [_parse_fraction(c) for c in coords] for (i, coords) in obj['rat']}
    cls = [int(i) for i in obj['cls']]
    facts.check(len(rat) == 44 and len(cls) == 972 and sorted(cls + list(rat)) == list(range(1016)), '972 class heads and 44 rational heads partition the 1016')
    pos = in_shell(U, idx)
    facts.check(all(p is not None for p in pos) and len(set(pos)) == 1016, 'the 1016 owners are distinct Leech minimal vectors')
    t = (3 - S3) / 6
    leans, resid = {}, 0.0
    for i in cls:
        xc = S2 * 2 * HX[i]                       # Cohn units: sqrt8 times the norm-4 float
        v = np.rint((xc - U[i]) / t).astype(np.int64)
        exact = (U[i] + t * v) / (2 * S2)
        resid = max(resid, float(np.abs(exact - HX[i]).max()))
        leans[i] = v
    L = np.array([leans[i] for i in cls])
    Uc = U[cls]
    facts.check(np.all((L * L).sum(1) == 48) and np.all((L * Uc).sum(1) == -24), 'every class head decodes to x = u + t v with v of norm 48 (norm 6) and <u, v> = -24 (-3)')
    facts.check(all(leech.is_leech(v, ws) for v in L), 'every decoded lean is a Leech vector (Conway-Sloane test)')
    Wv = Uc + L
    facts.check(all(p is not None for p in in_shell(Wv, idx)), 'w = u + v is minimal for every class head')
    rres = 0.0
    for i, xs in rat.items():
        rres = max(rres, max(abs(float(x) - S2 * 2 * HX[i][k]) / (2 * S2) for k, x in enumerate(xs)))
    facts.check(all(sum(x * x for x in xs) == 24 for xs in rat.values()), 'all 44 rational heads have |x|^2 = 24 exactly (3 in norm-4 units)')
    ve = np.rint(-2 * S3 * EP[0]).astype(np.int64)
    eres = float(np.abs(-ve / (2 * S3) - EP[0]).max())
    facts.check(int((ve * ve).sum()) == 48 and leech.is_leech(ve, ws), 'the extra point decodes to p = -(2/sqrt6) v with v a norm-6 Leech vector')
    facts.check(any(np.array_equal(ve, l) for l in L), 'its v is one of the leans of the class heads')
    block = np.nonzero((X.astype(np.int64) @ ve) == -24)[0]
    Dset = set(pos)
    facts.check(len(block) == 552 and all(int(b) in Dset for b in block), 'the block {z : <z, v> = -24} has 552 members, all removed')
    return {'U': U, 'cls': cls, 'leans': leans, 'rat': rat, 'extra': ve, 'pos': pos, 'facts': facts,
            'decode': {'classHeads': 972, 'maxFloatResidual': max(resid, eres),
                       'rationalVsFloat': rres,
                       'how': 'class heads x = u + ((3 - sqrt3)/6) v: v rounded from the float64 heads (README: "(x - u)/t is an integral vector of norm 6"); the extra point p = -(2/sqrt6) v likewise; the 44 interior heads are exact rationals from the pickle; owners are exact integers'}}


def _cap_rational(xs, sign, scale, hcoef, dim):
    """a rational head (24 Fractions, Cohn units) at height sign*hcoef*sqrt2 (already scaled): returns
    integer numerators (4, dim) and the denominator"""
    D = 1
    for x in xs:
        D = D * x.denominator // math.gcd(D, x.denominator)
    row = np.zeros((4, dim), dtype=object)
    for k, x in enumerate(xs):
        row[0, k] = int(x * D * scale)
    row[1, 24] = sign * hcoef * D
    return row, D


def kravatsky_25():
    d = kravatsky_25_data()
    W, X, idx, ws = kravatsky_shell()
    keep = np.ones(len(X), dtype=bool); keep[d['pos']] = False
    E = X[keep].astype(np.int64)
    fam = []
    C = zeros(len(E), 25); C[0, :, :24] = 6 * E
    fam.append(Family('equator', C, note='Leech minimal vectors that are not owners'))
    C = zeros(1, 25); C[3, 0, :24] = -2 * d['extra']
    fam.append(Family('extra point', C, note='-(2/sqrt6) v, the one non-lattice equator point'))
    cls = d['cls']
    C = zeros(2 * len(cls), 25)
    for q, i in enumerate(cls):
        for s, sg in enumerate((1, -1)):
            C[0, 2 * q + s, :24] = 6 * d['U'][i] + 3 * d['leans'][i]
            C[2, 2 * q + s, :24] = -d['leans'][i]
            C[1, 2 * q + s, 24] = 12 * sg
    fam.append(Family('class caps', C, note='(u + ((3 - sqrt3)/6) v, +-1), two per class head'))
    rows, dens = [], []
    for i in sorted(d['rat']):
        for sg in (1, -1):
            r, D = _cap_rational(d['rat'][i], sg, 6, 12, 25)
            rows.append(r); dens.append(D)
    fam.append(Family('rational caps', np.stack(rows, axis=1), den=dens, note='(x, +-1), x one of the 44 exact rational heads'))
    C = zeros(2, 25); C[1, 0, 24] = 24; C[1, 1, 24] = -24
    fam.append(Family('poles', C, note='(0, +-2)'))
    return {'id': 'kravatsky-25', 'claimant': 'kravatsky', 'dim': 25, 'claimed': 197579, 'N': (1152, 0, 0, 0),
            'families': fam, 'facts': d['facts'], 'decode': d['decode'],
            'scale': 'Cohn units (norm-4 picture times sqrt8) times 6', 'choices': []}


# ================================================================ Qiushi, dimension 25 (+1 on Kravatsky)
def qiushi_25():
    B = jsn('qiushi', 'constructions/d25/baseline-heads.json')
    R = jsn('qiushi', 'constructions/d25/repair-points.json')
    W, X, idx, ws = kravatsky_shell()
    facts = Facts()
    heads = B['heads']
    facts.check(len(heads) == 1016 and [h['index'] for h in heads] == list(range(1016)), 'baseline-heads.json lists the 1016 heads in order')
    U = np.array([h['owner'] for h in heads], dtype=np.int64)
    pos = in_shell(U, idx)
    facts.check(all(p is not None for p in pos) and len(set(pos)) == 1016, 'its owners are 1016 distinct Leech minimal vectors')
    # cross-check against Kravatsky's own bytes, decoded independently
    kd = kravatsky_25_data()
    facts.check(np.array_equal(U, kd['U']), "its owners equal Kravatsky's heads_U.npy")
    same_lean = all(np.array_equal(np.array(h['lean']), kd['leans'][h['index']]) for h in heads if h['kind'] == 'class')
    same_rat = all([Fraction(c) for c in h['coordinates']] == kd['rat'][h['index']] for h in heads if h['kind'] != 'class')
    facts.check(sum(h['kind'] == 'class' for h in heads) == 972 and same_lean, "its 972 integer leans equal the leans decoded here from Kravatsky's float heads")
    facts.check(same_rat, "its 44 rational heads equal Kravatsky's pickle, fraction for fraction")
    V = np.array(B['extra_equator_lean'], dtype=np.int64)
    facts.check(np.array_equal(V, kd['extra']), "its extra-equator lean equals the one decoded from Kravatsky's extra_P.npy")
    k = np.array(R['points']['upper']['integer_vector'], dtype=np.int64)
    l = np.array(R['points']['lower']['integer_vector'], dtype=np.int64)
    facts.check(int((k * k).sum()) == R['points']['upper']['squared_norm'] == 1007176 and int((l * l).sum()) == R['points']['lower']['squared_norm'] == 10209,
                'the repair vectors have squared norms 1007176 and 10209 as stated')
    blk = np.nonzero((X.astype(np.int64) @ V) == -24)[0]
    facts.check(len(blk) == 552 and all(int(b) in set(pos) for b in blk), 'the block U = {u : <u, v> = -24} has 552 members, all owners')
    Ub = X[blk].astype(np.int64)
    Wb = Ub + V
    wpos = in_shell(Wb, idx)
    facts.check(all(p is not None and p not in set(pos) for p in wpos), 'each w = u + v is a kept minimal vector')
    keep = np.ones(len(X), dtype=bool); keep[pos] = False; keep[wpos] = False
    E = X[keep].astype(np.int64)
    S = 12
    fam = []
    C = zeros(len(E), 25); C[0, :, :24] = S * E
    fam.append(Family('equator', C, note='Leech minimal vectors that are neither owners nor moved'))
    C = zeros(1, 25); C[3, 0, :24] = -4 * V
    fam.append(Family('extra point', C))
    C = zeros(len(Ub), 25)
    C[0, :, :24] = 12 * Ub + 6 * V; C[1, :, :24] = 3 * V; C[2, :, :24] = V
    C[2, :, 24] = 12; C[1, :, 24] = -12
    fam.append(Family('moved', C, note='W(r) = (r + a n, b), a = sqrt3/2 + sqrt2/4, b = (sqrt6 - 2)/4, one per block owner'))
    C = zeros(1, 25); C[1, 0, :24] = 6 * V; C[1, 0, 24] = -24
    fam.append(Family('Q', C, note='(sqrt3 n, -1) = (V/4, -1): the added point'))
    removed = {(984, 1), (1008, -1)}
    cls = [h['index'] for h in heads if h['kind'] == 'class']
    caps = [(i, sg) for i in cls for sg in (1, -1) if (i, sg) not in removed]
    C = zeros(len(caps), 25)
    for q, (i, sg) in enumerate(caps):
        lean = np.array(heads[i]['lean'], dtype=np.int64)
        C[0, q, :24] = 12 * U[i] + 6 * lean
        C[2, q, :24] = -2 * lean
        C[1, q, 24] = 24 * sg
    fam.append(Family('class caps', C))
    rows, dens = [], []
    for h in heads:
        if h['kind'] == 'class':
            continue
        for sg in (1, -1):
            if (h['index'], sg) in removed:
                continue
            r, D = _cap_rational([Fraction(c) for c in h['coordinates']], sg, 12, 24, 25)
            rows.append(r); dens.append(D)
    fam.append(Family('rational caps', np.stack(rows, axis=1), den=dens))
    C = zeros(2, 25); C[1, 0, 24] = 48; C[1, 1, 24] = -48
    fam.append(Family('poles', C))
    C = zeros(2, 25); C[0, 0] = k; C[0, 1] = l
    fam.append(Family('repair points', C, free_norm=True, note='R+ = 2k/sqrt(1007176), R- = 2l/sqrt(10209), decided by the scale-invariant test'))
    removed_kinds = sorted('class' if any(h['index'] == i and h['kind'] == 'class' for h in heads) else 'rational' for (i, _) in removed)
    facts.check(len(removed_kinds) == 2, 'the two replaced cap points are (x_984, +1) and (x_1008, -1) (construction.tex)')
    return {'id': 'qiushi-25', 'claimant': 'qiushi', 'dim': 25, 'claimed': 197580, 'N': (4608, 0, 0, 0),
            'families': fam, 'facts': facts, 'decode': None,
            'scale': 'Cohn units times 12', 'choices': [], 'replacedCapKinds': removed_kinds}


# ================================================================ Kravatsky, dimensions 26 and 27
def _owners_of(Y, X, ws):
    """for each head Y: the shell indices u with Y = 3u + v, v a norm-48 Leech vector at <u, v> = -24
    (a class head has exactly one; a free head Y = +-2v has none). <Y, u> = 72 is necessary; the
    products are exact in float32 (|entries| <= 11 * 4 * 24 < 2^24)."""
    Xf = X.astype(np.float32)
    out = []
    for b0 in range(0, len(Y), 256):
        G = Xf @ Y[b0:b0 + 256].astype(np.float32).T
        for q in range(G.shape[1]):
            y = Y[b0 + q]
            owners = []
            for c in np.nonzero(G[:, q] == 72)[0]:
                u = X[c].astype(np.int64)
                v = y - 3 * u
                if int(v @ v) == 48 and int(u @ v) == -24 and leech.is_leech(v, ws):
                    owners.append(int(c))
            out.append(owners)
    return out


def _layered(dim, Yfile, sidefile, l2ufile, l2linefile, src, claimed, rid):
    W, X, idx, ws = kravatsky_shell()
    Y = npy(src, Yfile).astype(np.int64)
    side = npy(src, sidefile).astype(np.int64)
    L2 = npy(src, l2ufile).astype(np.int64)
    line = npy(src, l2linefile).astype(np.int64)
    k = dim - 24
    facts = Facts()
    facts.check(np.all((Y * Y).sum(1) == 192), 'every first-layer head Y has norm 192 (x = Y/3 at |x|^2 = 8/3)')
    owners, free = [], 0
    for y, o in zip(Y, _owners_of(Y, X, ws)):
        if len(o) == 1:
            owners.append(o[0])
        elif len(o) == 0 and np.all(y % 2 == 0) and int((y // 2) @ (y // 2)) == 48 and leech.is_leech(y // 2, ws):
            free += 1
        else:
            raise AssertionError('head %s is neither a class head 3u + v nor a free head 2v' % y[:4])
    facts.check(len(set(owners)) == len(owners), '%d class heads Y = 3u + v with distinct owners u, %d free heads Y = 2v' % (len(owners), free))
    p2 = in_shell(L2, idx)
    facts.check(all(p is not None for p in p2) and len(set(p2)) == len(p2) and not (set(p2) & set(owners)),
                'the %d second-layer owners are distinct minimal vectors, disjoint from the first-layer owners' % len(p2))
    keep = np.ones(len(X), dtype=bool); keep[owners] = False; keep[p2] = False
    E = X[keep].astype(np.int64)
    fam = []
    C = zeros(len(E), dim); C[0, :, :24] = 6 * E
    fam.append(Family('equator', C))
    if k == 2:
        tri = {0: [1, 5, 9], 1: [3, 7, 11]}      # directions at 30 m degrees: {30,150,270} and {90,210,330}
        facts.check(sorted(np.unique(side).tolist()) == [0, 1] and sorted(np.unique(line).tolist()) == [0, 1, 2], 'two sides, three second-layer lines')
        C = zeros(3 * len(Y), dim)
        for q, (y, s) in enumerate(zip(Y, side)):
            for t, m in enumerate(tri[int(s)]):
                r = 3 * q + t
                C[0, r, :24] = 2 * y
                (ca, cb), (sa, sb) = two_cos(m), two_sin(m)
                C[3, r, 24], C[1, r, 24] = 4 * ca, 12 * cb
                C[3, r, 25], C[1, r, 25] = 4 * sa, 12 * sb
        fam.append(Family('caps', C, note='(Y/3, (2/sqrt3) z), z the three edge-midpoint directions of the head\'s triangle'))
        C = zeros(6, dim)
        for m6 in range(6):
            (ca, cb), (sa, sb) = two_cos(2 * m6), two_sin(2 * m6)
            C[1, m6, 24], C[3, m6, 24] = 12 * ca, 12 * cb
            C[1, m6, 25], C[3, m6, 25] = 12 * sa, 12 * sb
        fam.append(Family('axis', C, note='(0, a), the hexagon |a| = 2 at 0, 60, ..., 300 degrees'))
        C = zeros(2 * len(L2), dim)
        for q, (u, li) in enumerate(zip(L2, line)):
            (ca, cb), (sa, sb) = two_cos(2 * int(li)), two_sin(2 * int(li))
            for s, sg in enumerate((1, -1)):
                r = 2 * q + s
                C[2, r, :24] = 3 * u
                C[1, r, 24], C[3, r, 24] = sg * 6 * ca, sg * 6 * cb
                C[1, r, 25], C[3, r, 25] = sg * 6 * sa, sg * 6 * sb
        fam.append(Family('second layer', C, note='((sqrt3/2) u, +-y), y the unit vector of line 0/1/2 at 0/60/120 degrees'))
        choices = ['side 0 carries the directions at 30/150/270 degrees and side 1 those at 90/210/330; second-layer line l is the axis line at 60 l degrees. The README fixes the hexagon and its edge midpoints; a 60-degree rotation of the plane exchanges the two triangles and permutes the lines, so the labelling is a symmetry.']
    else:
        # the cuboctahedron (+-1, +-1, 0) and permutations: four zero-sum triangles, first by a fixed search
        V = [v for v in itertools.product((-1, 0, 1), repeat=3) if sum(x * x for x in v) == 2]
        tris = []

        def search(left, acc):
            if not left:
                return acc
            a = left[0]
            for b in left[1:]:
                c = tuple(-x - y for x, y in zip(a, b))
                if c in left and c != b and sum(x * y for x, y in zip(a, b)) == -1:
                    rest = [z for z in left if z not in (a, b, c)]
                    r = search(rest, acc + [(a, b, c)])
                    if r:
                        return r
            return None
        tris = search(sorted(V), [])
        facts.check(tris is not None and len(tris) == 4, 'the twelve cuboctahedral directions split into four zero-sum triangles')
        facts.check(sorted(np.unique(side).tolist()) == [0, 1, 2, 3] and sorted(np.unique(line).tolist()) == [0, 1, 2], 'four sides, three second-layer lines')
        C = zeros(3 * len(Y), dim)
        for q, (y, s) in enumerate(zip(Y, side)):
            for t, v in enumerate(tris[int(s)]):
                r = 3 * q + t
                C[0, r, :24] = 2 * y
                C[2, r, 24:27] = [8 * x for x in v]
        fam.append(Family('caps', C, note="(Y/3, (2/sqrt3) z), z the three cuboctahedral directions of the head's triangle"))
        C = zeros(12, dim)
        for q, v in enumerate(sorted(V)):
            C[1, q, 24] = 12 * (v[0] - v[1]); C[1, q, 25] = 12 * (v[0] + v[1]); C[0, q, 26] = 24 * v[2]
        fam.append(Family('axis', C, note='(0, a), the cuboctahedron of radius 2 rotated by 45 degrees about the third coordinate axis'))
        C = zeros(2 * len(L2), dim)
        for q, (u, li) in enumerate(zip(L2, line)):
            for s, sg in enumerate((1, -1)):
                r = 2 * q + s
                C[2, r, :24] = 3 * u
                C[1, r, 24 + int(li)] = 12 * sg
        fam.append(Family('second layer', C, note='((sqrt3/2) u, +-e_l), l the line of the head'))
        choices = ['side s carries the s-th triangle of the first zero-sum partition of the cuboctahedron found by a fixed lexicographic search %s; the README fixes only that the four sides are the four triangles. Any partition gives the same thresholds (same side 2/3, across sides 4/3 in norm-4 units), and the exact decision below is made on this one.' % [list(map(list, t)) for t in tris],
                   'the axis is rotated about the THIRD coordinate axis; the README says "about a coordinate axis".',
                   'second-layer line l is e_(l+1).']
    n = sum(F.n for F in fam)
    return {'id': rid, 'claimant': src, 'dim': dim, 'claimed': claimed, 'N': (1152, 0, 0, 0), 'families': fam, 'facts': facts,
            'decode': None, 'scale': 'Cohn units times 6', 'choices': choices,
            'counts': {'classHeads': len(owners), 'freeHeads': free, 'secondLayer': len(L2)}}


def kravatsky_26():
    P = KRAV + 'dim26-27-iota-triangles/data/'
    return _layered(26, P + 'heads26_Y.npy', P + 'heads26_side.npy', P + 'heads26_layer2_u.npy', P + 'heads26_layer2_line.npy', 'kravatsky', 199806, 'kravatsky-26')


def kravatsky_27():
    P = KRAV + 'dim26-27-iota-triangles/data/'
    return _layered(27, P + 'heads27_Y.npy', P + 'heads27_side.npy', P + 'heads27_layer2_u.npy', P + 'heads27_layer2_line.npy', 'kravatsky', 201566, 'kravatsky-27')


def qiushi_27():
    P = 'constructions/d27/data/'
    r = _layered(27, P + 'heads27_Y.npy', P + 'heads27_side.npy', P + 'heads27_layer2_u.npy', P + 'heads27_layer2_line.npy', 'qiushi', 201567, 'qiushi-27')
    r['facts'].check(Bytes.raw('qiushi', P + 'heads27_Y.npy') == Bytes.raw('kravatsky', KRAV + 'dim26-27-iota-triangles/data/heads27_Y.npy')
                     and Bytes.raw('qiushi', P + 'heads27_side.npy') == Bytes.raw('kravatsky', KRAV + 'dim26-27-iota-triangles/data/heads27_side.npy'),
                     "the first layer is Kravatsky's (Lindow's) byte for byte")
    return r


# ================================================================ Kravatsky, dimensions 28-31: the norm-8 frame layer
def kravatsky_28():
    P = KRAV + 'dim28-norm8-frame-layer/data/'
    W, X, idx, ws = kravatsky_shell()
    cl = npy('kravatsky', P + 'classes.npy').astype(np.int64)
    H = npy('kravatsky', P + 'heads.npy').astype(np.int64)
    facts = Facts()
    facts.check(cl.shape == (8, 248, 24) and H.shape == (24, 24), '8 classes of 248 owner lines; 24 frame heads')
    lines = cl.reshape(-1, 24)
    own = np.concatenate([lines, -lines])
    pos = in_shell(own, idx)
    facts.check(all(p is not None for p in pos) and len(set(pos)) == 3968, 'the 1984 owner lines give 3968 distinct minimal vectors')
    facts.check(np.all((H * H).sum(1) == 64) and np.array_equal(H @ H.T, 64 * np.eye(24, dtype=np.int64)) and all(leech.is_leech(h, ws) for h in H),
                'the heads are 24 mutually orthogonal norm-64 Leech vectors: a frame')
    roots = sorted(v for v in itertools.product((-1, 0, 1), repeat=4) if sum(x * x for x in v) == 2)

    def search(left, acc):
        if not left:
            return acc
        a = left[0]
        for b in left[1:]:
            c = tuple(-x - y for x, y in zip(a, b))
            if c in left and c != b and sum(x * y for x, y in zip(a, b)) == -1:
                r = search([z for z in left if z not in (a, b, c)], acc + [(a, b, c)])
                if r:
                    return r
        return None
    tris = search(roots, [])
    facts.check(tris is not None and len(tris) == 8, 'the 24 roots of D4 split into eight zero-sum triangles')
    keep = np.ones(len(X), dtype=bool); keep[pos] = False
    E = X[keep].astype(np.int64)
    fam = []
    C = zeros(len(E), 28); C[0, :, :24] = 6 * E
    fam.append(Family('equator', C))
    caps = []
    for kcl in range(8):
        for u in np.concatenate([cl[kcl], -cl[kcl]]):
            for r in tris[kcl]:
                caps.append((u, r))
    C = zeros(len(caps), 28)
    for q, (u, r) in enumerate(caps):
        C[3, q, :24] = 2 * u
        C[2, q, 24:28] = [8 * x for x in r]
    fam.append(Family('caps', C, note='(sqrt(2/3) u, (2/sqrt3) z), z the three directions of the class triangle'))
    halves = list(itertools.product((1, -1), repeat=4))
    C = zeros(16, 28)
    for q, h in enumerate(halves):
        C[1, q, 24:28] = [12 * x for x in h]
    fam.append(Family('axis', C, note='(0, 2z), z the 16 half-vectors (+-1/2)^4 of the dual 24-cell'))
    lay = []
    for h in np.concatenate([H, -H]):
        for i in range(4):
            for sg in (1, -1):
                lay.append((h, i, sg))
    C = zeros(len(lay), 28)
    for q, (h, i, sg) in enumerate(lay):
        C[0, q, :24] = 3 * h
        C[0, q, 24 + i] = 24 * sg
    fam.append(Family('layer', C, note='(v/2, sqrt2 w), v one of the 48 frame vectors, w one of +-e1..+-e4'))
    return {'id': 'kravatsky-28', 'claimant': 'kravatsky', 'dim': 28, 'claimed': 204896, 'N': (1152, 0, 0, 0), 'families': fam,
            'facts': facts, 'decode': None, 'scale': 'Cohn units times 6',
            'choices': ['class k carries the k-th triangle of the first zero-sum partition of the D4 roots found by a fixed lexicographic search %s. The README fixes the 24-cell directions (D4 roots), the axis (the 16 half-vectors) and the layer (+-e_i) but not which partition; any two distinct roots meet at cosine <= 1/2, so every partition gives the same thresholds, and the exact decision is made on this one.' % [list(map(list, t)) for t in tris]]}


def _quad(q):
    """a geom-JSON quadruple [a, b, c, d] meaning (a + b sqrt2 + c sqrt3 + d sqrt6)/24"""
    return tuple(int(x) for x in q)


def _frame_layer(dim):
    k = dim - 24
    if dim in (29, 30):
        P = KRAV + 'dim29-30-frame-layer/data/'
    else:
        P = KRAV + 'dim31-frame-layer/data/'
    g = jsn('kravatsky', P + 'geom%d.json' % dim)
    own = npy('kravatsky', P + 'owners%d.npy' % dim).astype(np.int64)
    bounds = npy('kravatsky', P + 'bounds%d.npy' % dim).astype(np.int64)
    W, X, idx, ws = kravatsky_shell()
    facts = Facts()
    facts.check(g['dim'] == dim and g['k'] == k and g['denominator'] == 24, 'geom%d.json: k = %d, quadruples over 24' % (dim, k))
    dirs = [[_quad(c) for c in v] for v in g['directions']]
    frame = [[_quad(c) for c in v] for v in g['frame']]
    axis = [[_quad(c) for c in v] for v in g['axis']]

    def norm24sq(v):
        acc = (0, 0, 0, 0)
        for c in v:
            acc = QF.add(acc, QF.mul(c, c))
        return acc
    facts.check(all(norm24sq(v) == (576, 0, 0, 0) for v in dirs + frame + axis), 'every direction, frame vector and axis point is a unit vector, exactly')
    groups = g['groups']
    nclass = len(bounds) - 1
    facts.check(len(groups) == nclass and sorted(i for gr in groups for i in gr) == list(range(len(dirs))), '%d classes, %d direction groups partitioning the %d directions' % (nclass, len(groups), len(dirs)))
    facts.check(len(frame) == k and all(dot == (0, 0, 0, 0) for dot in [_dot24(frame[i], frame[j]) for i in range(k) for j in range(i + 1, k)]), 'the layer frame is %d orthonormal vectors' % k)
    lines = own
    allown = np.concatenate([lines, -lines])
    pos = in_shell(allown, idx)
    facts.check(all(p is not None for p in pos) and len(set(pos)) == 2 * len(lines), 'the %d owner lines give %d distinct minimal vectors' % (len(lines), 2 * len(lines)))
    keep = np.ones(len(X), dtype=bool); keep[pos] = False
    E = X[keep].astype(np.int64)
    fam = []
    C = zeros(len(E), dim); C[0, :, :24] = 18 * E
    fam.append(Family('equator', C))
    caps = []
    for c in range(nclass):
        cl = lines[bounds[c]:bounds[c + 1]]
        for u in np.concatenate([cl, -cl]):
            for di in groups[c]:
                caps.append((u, dirs[di]))
    C = zeros(len(caps), dim)
    for q, (u, z) in enumerate(caps):
        C[3, q, :24] = 6 * u
        for j, (a, b, c_, d_) in enumerate(z):     # 24 sqrt6 z = a sqrt6 + 2b sqrt3 + 3c sqrt2 + 6d
            C[0, q, 24 + j] = 6 * d_; C[1, q, 24 + j] = 3 * c_; C[2, q, 24 + j] = 2 * b; C[3, q, 24 + j] = a
    fam.append(Family('caps', C, note='(sqrt(2/3) u, (2/sqrt3) z), z a direction of the class group'))
    C = zeros(len(axis), dim)
    for q, a_ in enumerate(axis):
        for j, (a, b, c_, d_) in enumerate(a_):    # 3 sqrt2 (a + b sqrt2 + c sqrt3 + d sqrt6)
            C[0, q, 24 + j] = 6 * b; C[1, q, 24 + j] = 3 * a; C[2, q, 24 + j] = 6 * d_; C[3, q, 24 + j] = 3 * c_
    fam.append(Family('axis', C, note='(0, 2a)'))
    lay = []
    for i in range(24):
        for sv in (1, -1):
            for w in frame:
                for sw in (1, -1):
                    lay.append((i, sv, w, sw))
    C = zeros(len(lay), dim)
    for q, (i, sv, w, sw) in enumerate(lay):
        C[0, q, i] = 72 * sv
        for j, (a, b, c_, d_) in enumerate(w):     # 72 w = 3 (a + b sqrt2 + c sqrt3 + d sqrt6)
            C[0, q, 24 + j] += 3 * a * sw; C[1, q, 24 + j] = 3 * b * sw; C[2, q, 24 + j] = 3 * c_ * sw; C[3, q, 24 + j] = 3 * d_ * sw
    fam.append(Family('layer', C, note='(v/2, sqrt2 w), v = +-8 e_i (a Leech frame), w = +- a frame vector of R^%d' % k))
    claimed = {29: 209968, 30: 221012, 31: 238662}[dim]
    facts.check(g['total'] == claimed, 'geom%d.json states the total %d' % (dim, claimed))
    return {'id': 'kravatsky-%d' % dim, 'claimant': 'kravatsky', 'dim': dim, 'claimed': claimed, 'N': (10368, 0, 0, 0), 'families': fam,
            'facts': facts, 'decode': None, 'scale': 'Cohn units times 18', 'choices': [],
            'counts': {'ownerLines': int(len(lines)), 'classes': nclass}}


def _dot24(u, v):
    acc = (0, 0, 0, 0)
    for a, b in zip(u, v):
        acc = QF.add(acc, QF.mul(a, b))
    return acc


def kravatsky_29():
    return _frame_layer(29)


def kravatsky_30():
    return _frame_layer(30)


def kravatsky_31():
    return _frame_layer(31)


# ================================================================ Takhanov-Yun: the float64 archives
def ty_array(zipname):
    """the one .npy inside a pinned zip archive, read with allow_pickle=False; its sha256 is checked
    against the value the claimants' README prints for it"""
    import zipfile, re as _re
    z = zipfile.ZipFile(io.BytesIO(Bytes.raw('takhanov-yun', zipname)))
    names = [n for n in z.namelist() if n.endswith('.npy')]
    if len(names) != 1:
        raise AssertionError('%s holds %d arrays' % (zipname, len(names)))
    b = z.read(names[0])
    h = hashlib.sha256(b).hexdigest()
    readme = Bytes.raw('takhanov-yun', 'README.md').decode('utf-8')
    m = _re.search(_re.escape(names[0].split('/')[-1]) + r'\s*\n\s*([0-9a-f]{64})', readme)
    return np.load(io.BytesIO(b), allow_pickle=False), names[0], h, (m.group(1) if m else None)


def takhanov_yun_25():
    X, inner, h, printed = ty_array('kissing_r25_197058_float64.zip')
    facts = Facts()
    facts.check(printed == h, 'the inner array %s hashes to the sha256 the README prints for it' % inner)
    facts.check(X.shape == (197058, 25) and X.dtype == np.float64, '197058 rows of 25 float64 coordinates')
    ext = X[:, 24]
    bulk = np.abs(ext) == 0
    lift = np.abs(np.abs(ext) - 0.5) < 1e-12
    pole = np.abs(np.abs(ext) - 1.0) < 1e-12
    facts.check(int(bulk.sum()) == 196064 and int(lift.sum()) == 992 and int(pole.sum()) == 2 and int((bulk | lift | pole).sum()) == 197058,
                'rows split as 196064 bulk (height 0), 992 lifted (height +-1/2), 2 poles (+-e25)')
    s32 = math.sqrt(32.0)
    Zb = np.rint(X[bulk, :24] * s32).astype(np.int64)
    Zl = np.rint(X[lift, :24] * s32 / (S3 / 2)).astype(np.int64)
    W = golay_from_owners([Zb])
    ws = {w.tobytes() for w in W}
    shell = leech.shell(W)
    idx = leech.index(shell)
    facts.check(all(p is not None for p in in_shell(Zb, idx)) and all(p is not None for p in in_shell(Zl, idx)),
                "every bulk row decodes to u = z/sqrt32 and every lifted row to ((sqrt3/2) u, +-1/2), z a Leech minimal vector of B's own Golay code (recovered from its bulk)")
    S1 = {r.tobytes() for r in Zl.astype(np.int8)}
    facts.check(len(S1) == 496 and len({r.tobytes() for r in Zb.astype(np.int8)} | S1) == 196560 and not (S1 & {r.tobytes() for r in Zb.astype(np.int8)}),
                'the 496 lifted directions are exactly the shell vectors missing from the bulk; each is lifted at both heights')
    hl = np.sign(ext[lift]).astype(np.int64)
    # exact rows, Cohn units times 2: bulk (2z, 0); lifted (sqrt3 z, +-4 sqrt2); poles (0, +-8 sqrt2); N = 128
    fam = []
    C = zeros(len(Zb), 25); C[0, :, :24] = 2 * Zb
    fam.append(Family('bulk', C, note='the Leech minimal vectors outside S1'))
    C = zeros(len(Zl), 25); C[2, :, :24] = Zl; C[1, :, 24] = 4 * hl
    fam.append(Family('lifted', C, note='((sqrt3/2) u, +-1/2), u in the 496-point subset S1'))
    C = zeros(2, 25); C[1, 0, 24] = 8; C[1, 1, 24] = -8
    fam.append(Family('poles', C, note='+-e25'))
    # the float-to-exact distance, row by row, in the published units (unit vectors)
    ex_b = Zb / s32
    ex_l = np.concatenate([Zl * (S3 / 2) / s32, (hl / 2.0)[:, None]], 1)
    delta = max(float(np.abs(X[bulk, :24] - ex_b).max()), float(np.abs(X[lift] - ex_l).max()),
                float(np.abs(X[pole, :24]).max()))
    return {'id': 'takhanov-yun-25', 'claimant': 'takhanov-yun', 'dim': 25, 'claimed': 197058, 'N': (128, 0, 0, 0), 'families': fam,
            'facts': facts, 'scale': 'unit vectors times 8 sqrt2 (Cohn units times 2)', 'choices': [],
            'decode': {'maxFloatResidual': delta, 'rows': 197058,
                       'how': 'every row snapped to the README\'s construction: bulk z/sqrt32, lifted ((sqrt3/2) z/sqrt32, +-1/2), poles +-e25, z an integer Leech vector recovered by rounding sqrt32 times the float'}}


BUILDERS = {
    'kravatsky-18': kravatsky_18, 'kravatsky-25': kravatsky_25, 'qiushi-25': qiushi_25,
    'kravatsky-26': kravatsky_26, 'kravatsky-27': kravatsky_27, 'qiushi-27': qiushi_27,
    'kravatsky-28': kravatsky_28, 'kravatsky-29': kravatsky_29, 'kravatsky-30': kravatsky_30, 'kravatsky-31': kravatsky_31,
    'takhanov-yun-25': takhanov_yun_25,
}
