#!/usr/bin/env python3
"""run-kissing-gram.py — a kissing configuration decided in Gram form (instruments/kissing/wave/gram.py).

Two uses:

  python3 tools/run-kissing-gram.py --manifest PATH [--procs 8]
      a claimant's Gram-form package: integer coefficient rows, the exact Gram matrix, the scale and the claim, every
      byte pinned in the manifest (the contract is gram.py's docstring). Prints the decision; writes nothing.

  python3 tools/run-kissing-gram.py qiushi 43|45 [--procs 8] [--tile 2048] [--limit K]
      the CALIBRATION: the Qiushi Engine's dimension-43 and -45 configurations, already decided pair by pair in
      Cartesian form (tools/run-kissing-sections.py), decided again in the form their construction states. From their
      published lattice data (corpus/sources/kissing/qiushi-lattice-*, pinned; read as data, none of their programs run)
      and the pinned release rows:
        43: G = the Gram matrix of P48n, B the integer basis with B B^T = 96 G, T5 the first five section rows. Every
            Cartesian row x is written as x = z B with z integer (a rounded solve, then z B = x checked exactly for every
            row), and z must satisfy z G z^T = 6 and T5 G z^T = 0 — the set their construction defines.
        45: G, T, B with B B^T = 12 G and H = T G T^T = 8 I - 2 J. Every row is x = n B with n integer, and
            n = 8 z - (e_i + 1) T for exactly one fibre i with z integer, z G z^T = 6 and z G T^T = e_i — the projected
            fibres their construction defines. The points are n / 8 in the basis: rows n, scale 8, norm 23/4.
      Then every pair in Gram form, Python integers on a sample, gramcheck.js on a sample, and the counts must equal the
      Cartesian record's (pairs, contacts, the nearest non-contact as a cosine). Recorded as gramCheck on the row of
      certs/kissing-wave.json.
"""
import importlib.util, json, os, sys, time, hashlib, platform, re
from fractions import Fraction
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'kissing', 'wave'))
import gram   # noqa: E402

SRC = os.path.join(ROOT, 'corpus', 'sources')
PINS = json.load(open(os.path.join(SRC, 'PINS.json')))
REPO = 'Oxelra-AI/Qiushi-Engine-Kissing-Number-Research'
COMMIT = '33fe9c1fe73b473a13dcd4a2870dbcb480728ab1'
FILES = {43: {'parent': 'kissing/qiushi-lattice-d43-parent-section_2026-10-11.txt', 'basis': 'kissing/qiushi-lattice-d43-euclidean-basis_2026-10-11.json'},
         45: {'gram': 'kissing/qiushi-lattice-d45-gram_2026-10-11.json', 'compact': 'kissing/qiushi-lattice-d45-compact_2026-10-11.json',
              'parent': 'kissing/qiushi-lattice-d45-parent_2026-10-11.json'}}


def arg(name, default):
    return type(default)(sys.argv[sys.argv.index(name) + 1]) if name in sys.argv else default


def pinned(rel):
    blob = open(os.path.join(SRC, rel), 'rb').read()
    if hashlib.sha256(blob).hexdigest() != PINS[rel]:
        sys.exit('GRAM REFUSED: %s does not match its pin' % rel)
    return blob.decode()


def int_rows(text, header, count):
    """the `count` bracketed integer rows that follow the line beginning with `header` in a describe_cert text file"""
    lines = text.splitlines()
    i = next(k for k, l in enumerate(lines) if l.startswith(header))
    rows = []
    for l in lines[i + 1:i + 1 + count]:
        rows.append([int(v) for v in re.sub(r'[\[\]]', ' ', l).split()])
    if len(rows) != count or len({len(r) for r in rows}) != 1:
        sys.exit('GRAM REFUSED: could not read %d rows after "%s"' % (count, header))
    return rows


def sections_tool():
    spec = importlib.util.spec_from_file_location('sections', os.path.join(ROOT, 'tools', 'run-kissing-sections.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


def coefficient_rows(X, B):
    """x = c B with c integer, for every row: a rounded float64 solve, then c B = x checked exactly in int64"""
    Bi = np.array(B, dtype=np.int64)
    inv = np.linalg.inv(Bi.astype(np.float64))
    C = np.empty(X.shape, dtype=np.int32)
    exact = True
    for c0 in range(0, X.shape[0], 1 << 18):
        Xc = X[c0:c0 + (1 << 18)].astype(np.int64)
        Cc = np.rint(Xc.astype(np.float64) @ inv).astype(np.int64)
        exact = exact and bool(np.array_equal(Cc @ Bi, Xc))
        C[c0:c0 + Cc.shape[0]] = Cc
    return C, exact


def qiushi(d):
    S = sections_tool()
    t0 = time.time()
    X = S.load_rows(d)                                     # the pinned release rows (int32, 48 columns)
    lim = arg('--limit', 0)                                # a dry run on the first rows: decides, compares nothing, writes nothing
    if lim:
        X = X[:lim]
    lattice = {}
    if d == 43:
        txt = pinned(FILES[43]['parent'])
        G = int_rows(txt, 'ambient Gram G (actual units)', 48)
        T = int_rows(txt, 'coefficient rows w.r.t. the P48n basis', 8)
        B = json.loads(pinned(FILES[43]['basis']))['basis_B']
        scaleBB = 96
    else:
        G = json.loads(pinned(FILES[45]['gram']))['ambient_G']
        T = json.loads(pinned(FILES[45]['compact']))['section_basis_T_rows']
        B = json.loads(pinned(FILES[45]['parent']))['basis_scaled_by_sqrt12']
        scaleBB = 12
    G64, T64, B64 = (np.array(a, dtype=np.int64) for a in (G, T, B))
    gf = gram.gram_facts(G)
    lattice['gram'] = gf
    lattice['basisMatchesGram'] = bool(np.array_equal(B64 @ B64.T, scaleBB * G64))
    lattice['basisIdentity'] = 'B B^T = %d G' % scaleBB
    C, exact = coefficient_rows(X, B)
    n = X.shape[0]
    del X
    lattice['everyRowInTheLattice'] = exact
    print('d=%d: G %s (det %s), %s: %s, every row an integer combination of B: %s (%.0f s)' % (
        d, 'positive definite' if gf['positiveDefinite'] else 'NOT positive definite', gf['det'], lattice['basisIdentity'],
        lattice['basisMatchesGram'], exact, time.time() - t0), flush=True)
    if d == 43:
        T5 = T64[:5]
        GT = G64 @ T5.T
        sec = True
        for c0 in range(0, n, 1 << 18):
            sec = sec and bool(np.all(C[c0:c0 + (1 << 18)].astype(np.int64) @ GT == 0))
        lattice['membership'] = {'what': 'z G z^T = 6 (checked as the norm below) and T5 G z^T = 0 for every row', 'sectionConditionsHold': sec}
        Z, scale, norm = C, 1, Fraction(6)
        ok_member = sec
    else:
        H = T64 @ G64 @ T64.T
        lattice['H'] = H.tolist()
        lattice['HisEightIMinusTwoJ'] = bool(np.array_equal(H, 8 * np.eye(3, dtype=np.int64) - 2))
        GT = G64 @ T64.T
        fib = np.full(n, -1, dtype=np.int8); member = True; counts = [0, 0, 0]
        for c0 in range(0, n, 1 << 18):
            Nc = C[c0:c0 + (1 << 18)].astype(np.int64)
            hits = np.zeros(Nc.shape[0], dtype=np.int64)
            for i in range(3):
                ci = T64.sum(axis=0) + T64[i]                       # (e_i + 1) T
                M = Nc + ci
                okm = np.all(M % 8 == 0, axis=1)
                if okm.any():
                    z = M[okm] // 8
                    zn = ((z @ G64) * z).sum(axis=1)
                    y = z @ GT
                    e = np.zeros(3, dtype=np.int64); e[i] = 1
                    good = (zn == 6) & np.all(y == e, axis=1)
                    member = member and bool(good.all())
                    idx = np.nonzero(okm)[0] + c0
                    fib[idx[good]] = i
                    counts[i] += int(good.sum())
                hits += okm
            member = member and bool(np.all(hits == 1))
        member = member and bool(np.all(fib >= 0))
        lattice['membership'] = {'what': 'n = 8 z - (e_i + 1) T for exactly one fibre i, z integer, z G z^T = 6, z G T^T = e_i', 'everyRowInOneFibre': member,
                                 'fibreCounts': counts}
        Z, scale, norm = C, 8, Fraction(23, 4)
        ok_member = member and lattice['HisEightIMinusTwoJ']
    print('d=%d: membership %s %s' % (d, ok_member, json.dumps(lattice['membership'])), flush=True)
    r = gram.decide(Z, G, 1, scale, norm, dim=None if lim else d, count=n, procs=arg('--procs', os.cpu_count() or 1), tile=arg('--tile', 2048),
                    log=lambda s: print(s, flush=True))
    js = gram.js_sample(Z, G, r['facts']['normInteger'])
    if lim:
        print('dry run on %d rows: %s, %d contacts, span %s; js %s' % (lim, r['verdict'], r['bulk']['contacts'], r['facts']['spanDimension'], js['agree']))
        return
    # the Cartesian record of the same configuration: the counts must be equal, the nearest non-contact the same cosine
    rec = json.load(open(S.OUT))
    row = next(x for x in rec['rows'] if x['id'] == 'qiushi-%d' % d)
    cb = row['bulk']
    same = (r['bulk']['pairs'] == cb['pairs'] and r['bulk']['contacts'] == cb['contacts'] and r['bulk']['violations'] == cb['violations'] == 0
            and Fraction(r['bulk']['nearestNonContactCos']) == Fraction(cb['nearestNonContactDot'], row['sectionFacts']['norm']))
    ok = r['verdict'] == 'WITNESSED' and lattice['basisMatchesGram'] and lattice['everyRowInTheLattice'] and gf['positiveDefinite'] and ok_member and js['agree'] and same
    out = {'verdict': 'WITNESSED' if ok else 'UNWITNESSED', 'agreesWithCartesian': same,
           'source': {'repository': REPO, 'commit': COMMIT, 'files': {k: {'path': v, 'sha256': PINS[v]} for k, v in FILES[d].items()}},
           'lattice': lattice, 'facts': r['facts'], 'bulk': r['bulk'], 'second': r['second'], 'jsCheck': js,
           'machine': {'platform': platform.platform(), 'cpus': os.cpu_count()}, 'seconds': round(time.time() - t0, 1),
           'decidedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}
    S.update_row(d, {'gramCheck': out})
    print('qiushi-%d in Gram form: %s — %d pairs, %d contacts, nearest non-contact cos %s; js %s; the same as the Cartesian record: %s (%.0f s)' % (
        d, out['verdict'], r['bulk']['pairs'], r['bulk']['contacts'], r['bulk']['nearestNonContactCos'], 'agrees' if js['agree'] else 'DISAGREES', same, time.time() - t0))
    if not ok:
        sys.exit(1)


if __name__ == '__main__':
    if '--manifest' in sys.argv:
        P = gram.load_manifest(sys.argv[sys.argv.index('--manifest') + 1])
        r = gram.decide(P['Z'], P['num'], P['den'], P['scale'], P['norm'], P['dim'], P['count'], procs=arg('--procs', os.cpu_count() or 1))
        js = gram.js_sample(P['Z'], P['num'], r['facts']['normInteger'])
        print(json.dumps({**r, 'jsCheck': js}, indent=1))
        sys.exit(0 if r['verdict'] == 'WITNESSED' and js['agree'] else 1)
    if len(sys.argv) >= 3 and sys.argv[1] == 'qiushi' and sys.argv[2] in ('43', '45'):
        qiushi(int(sys.argv[2]))
    else:
        sys.exit(__doc__)
