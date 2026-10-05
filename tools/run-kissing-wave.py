#!/usr/bin/env python3
"""run-kissing-wave.py — decide the September 2026 wave of kissing-number claims and write
certs/kissing-wave.json.

Every row is rebuilt from bytes pinned in corpus/kissing/wave.meta.json (re-hashed at every read)
and the claimant's own construction table, then EVERY PAIR is decided exactly by
instruments/kissing/wave/engine.py — 2e10 pairs for a Leech-based configuration, about a minute
of BLAS each on an 8-core laptop, every partial sum under a checked 2^24 or 2^53 bound. Verdicts
follow the kissing ledger's grammar, per witness:

    WITNESSED     the published bytes are already an exact proof (integers, exact rationals, and
                  closed forms the claimant prints)
    REPAIRED      our exact witness built from their bytes; the float-to-exact distance printed
    UNWITNESSED   the bytes fail exactly and no repair was built — a finding about the bytes,
                  never a refutation of the bound
    NEEDS DATA    no vector list is published; what would decide the row is stated

Calibrations re-derived at every run: K(24) = 196560 (the whole Leech shell, every pair) and
K(8) = 240 (E8). The icosahedron's 12 is re-derived by the JavaScript side (fields.js).

    python3 tools/run-kissing-wave.py                 everything (about 20 minutes)
    python3 tools/run-kissing-wave.py --only kravatsky-18,qiushi-25
                                                      those rows only, merged into the record
"""
import argparse, json, os, re, subprocess, sys, time, platform, hashlib
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'kissing', 'wave'))
import claims, engine, leech, qfield as QF   # noqa: E402

OUT = os.path.join(ROOT, 'certs', 'kissing-wave.json')
CLAIMANTS = {
    'kravatsky': 'A. Kravatsky — github.com/alexlegeartis/KissingNumbers (no arXiv; joint work with H. Cohn and B. Lindow in dimensions 25–31 per its README)',
    'takhanov-yun': 'R. Takhanov and S. Yun — arXiv:2609.21591, github.com/k-nic/Leech_lifting',
    'qiushi': 'Qiushi Engine (Oxelra-AI) — arXiv:2609.35051',
}


def readme_tables():
    """the claimed and previously published values, read from the pinned READMEs (never typed here)"""
    out = {'kravatsky': {}, 'takhanov-yun': {}, 'qiushi': {}}
    txt = claims.Bytes.raw('kravatsky', 'RESULTS.md').decode('utf-8')
    for sp in ('\u2009', '\u202f', '\u00a0'):      # the table's digit groups are separated by thin spaces
        txt = txt.replace(sp, ' ')
    for m in re.finditer(r'^\| (\d+) \| ([\d ]+) \| \*\*([\d ]+)\*\* \| [\d.]+ \| `([\w-]+)` \| \[.*?\]\(([^)]+)\) \|$', txt, re.M):
        out['kravatsky'][int(m.group(1))] = {'claimed': int(m.group(3).replace(' ', '')), 'previous': int(m.group(2).replace(' ', '')),
                                             'status': m.group(4), 'package': m.group(5)}
    txt = claims.Bytes.raw('takhanov-yun', 'README.md').decode('utf-8')
    for m in re.finditer(r'^\| (\d+) \| (\d+) \| \*\*(\d+)\*\* \| (\d+) \| (.+?) \|$', txt, re.M):
        out['takhanov-yun'][int(m.group(1))] = {'claimed': int(m.group(3)), 'previous': int(m.group(2)), 'modification': m.group(5)}
    txt = claims.Bytes.raw('qiushi', 'README.md').decode('utf-8')
    for m in re.finditer(r'^\| (\d+) \| ([\d,]+) \| ([\d,]+) \| \+([\d,]+) \|$', txt, re.M):
        out['qiushi'][int(m.group(1))] = {'claimed': int(m.group(2).replace(',', '')), 'previous': int(m.group(3).replace(',', ''))}
    return out


def calibration_leech():
    W, X, idx, ws = claims.kravatsky_shell()
    C = np.zeros((4, len(X), 24), dtype=np.int64); C[0] = X
    r = engine.decide([engine.Family('Leech shell', C, note='the 196560 minimal vectors, Cohn units')], (32, 0, 0, 0))
    ok = r['verdict'] == 'CERTIFIED' and r['contacts'] == 196560 * 4600 // 2
    return {'id': 'cal-leech-196560', 'claim': 'K(24) = 196560 (Odlyzko–Sloane, Levenshtein 1979): the Leech minimal vectors',
            'expectContacts': 196560 * 4600 // 2, 'ok': ok, 'result': r}


def calibration_e8():
    rows = []
    for a in range(8):
        for b in range(a + 1, 8):
            for sa in (2, -2):
                for sb in (2, -2):
                    v = [0] * 8; v[a] = sa; v[b] = sb; rows.append(v)
    for m in range(256):
        if bin(m).count('1') % 2 == 0:
            rows.append([(-1 if m >> i & 1 else 1) for i in range(8)])
    C = np.zeros((4, 240, 8), dtype=np.int64); C[0] = np.array(rows)
    r = engine.decide([engine.Family('E8 roots', C)], (8, 0, 0, 0))
    return {'id': 'cal-e8-240', 'claim': 'K(8) = 240: the E8 roots, 6720 contacts', 'expectContacts': 6720,
            'ok': r['verdict'] == 'CERTIFIED' and r['contacts'] == 6720, 'result': r}


def red_controls():
    """each must be CAUGHT by the same engine the rows go through"""
    out = []
    c = claims.kravatsky_18()
    F = c['families']
    tb = [f for f in F if f.name == 'tier B'][0]
    # 1. one sign of one tier-B word flipped
    C = tb.C.copy(); C[0, 7, 3] = -C[0, 7, 3]
    r = engine.decide([f if f.name != 'tier B' else engine.Family('tier B', C) for f in F], c['N'], spot=0, log=lambda *a: None)
    out.append({'red': 'd18: one sign of one tier-B word flipped', 'caught': r['verdict'] == 'REFUTED', 'violations': r['violations']})
    # 2. one tier-B point rotated by 30 degrees (onto a tier angle)
    C = tb.C.copy()
    (ca, cb), (sa, sb) = claims.two_cos(0), claims.two_sin(0)
    C[1, 0, 16], C[3, 0, 16], C[1, 0, 17], C[3, 0, 17] = 2 * ca, 2 * cb, 2 * sa, 2 * sb
    r = engine.decide([f if f.name != 'tier B' else engine.Family('tier B', C) for f in F], c['N'], spot=0, log=lambda *a: None)
    out.append({'red': 'd18: a tier-B point rotated by 30 degrees, from 30 to 0', 'caught': r['verdict'] == 'REFUTED', 'violations': r['violations']})
    # 3. a repeated vector
    eq = [f for f in F if f.name == 'equator'][0]
    C = np.concatenate([eq.C, eq.C[:, :1, :]], axis=1)
    r = engine.decide([f if f.name != 'equator' else engine.Family('equator', C) for f in F], c['N'], spot=0, log=lambda *a: None)
    out.append({'red': 'd18: one equator vector listed twice', 'caught': r['verdict'] == 'REFUTED', 'violations': r['violations']})
    # 4. a vector off the common norm is refused before any pair is decided
    C = eq.C.copy(); C[0, 0, 0] += 1
    try:
        engine.decide([f if f.name != 'equator' else engine.Family('equator', C) for f in F], c['N'], spot=0, log=lambda *a: None)
        caught = False
    except AssertionError:
        caught = True
    out.append({'red': 'd18: one coordinate moved by 1/6, off the sphere', 'caught': caught})
    # 5. the impossible tie raises: p + q sqrt(m) with m a perfect square is a field the tower refuses,
    #    and if forced its tie p^2 = m q^2 must raise, not return a sign
    try:
        QF.sign_pm(2, -1, 4)
        caught = False
    except ArithmeticError:
        caught = True
    out.append({'red': 'a forced tie 2 - 1*sqrt4 raises instead of returning a sign', 'caught': caught})
    return out


def verdict_of(c, r):
    if r['verdict'] == 'CERTIFIED':
        return 'REPAIRED' if c.get('decode') else 'WITNESSED'
    if r['verdict'] == 'REFUTED':
        return 'UNWITNESSED'
    return r['verdict']


def run_claim(rid, tables, log):
    t0 = time.time()
    claims.Bytes.used = {}
    c = claims.BUILDERS[rid]()
    n = sum(F.n for F in c['families'])
    if n != c['claimed']:
        raise AssertionError('%s: rebuilt %d points, the claim is %d' % (rid, n, c['claimed']))
    log('  %s: %d points, %d families' % (rid, n, len(c['families'])))
    r = engine.decide(c['families'], c['N'], log=log)
    tab = tables[c['claimant']].get(c['dim'], {})
    if tab and tab['claimed'] != c['claimed']:
        raise AssertionError('%s: the README table says %d' % (rid, tab['claimed']))
    row = {
        'id': rid, 'claimant': c['claimant'], 'claimantName': CLAIMANTS[c['claimant']], 'dim': c['dim'],
        'claimed': c['claimed'], 'previous': tab.get('previous'),
        'verdict': verdict_of(c, r),
        'engine': {k: v for k, v in r.items() if k != 'blocks'}, 'blocks': r['blocks'],
        'facts': list(c['facts']), 'decode': c.get('decode'), 'choices': c.get('choices', []),
        'scale': c.get('scale'), 'counts': c.get('counts'),
        'bytes': dict(sorted(claims.Bytes.used.items())),
        'seconds': round(time.time() - t0, 1),
    }
    if c.get('decode'):
        row['delta'] = c['decode'].get('maxFloatResidual')
    return row


def needs_data_rows(tables):
    rows = []
    for d, t in sorted(tables['kravatsky'].items()):
        if d in (18, 25, 26, 27, 28, 29, 30, 31):
            continue
        if d >= 49:
            rows.append({'id': 'kravatsky-%d' % d, 'claimant': 'kravatsky', 'claimantName': CLAIMANTS['kravatsky'], 'dim': d,
                         'claimed': t['claimed'], 'previous': t['previous'], 'verdict': 'NEEDS DATA', 'status': t['status'], 'package': t['package'],
                         'detail': 'no vector list is published: the count is computed from a lattice, class-size tables or a moment LP (RESULTS.md status `%s`). '
                                   'What would decide it: the configuration\'s vectors in any exact form, or a generator file this lab can run without the claimant\'s code.' % t['status']})
        else:
            rows.append({'id': 'kravatsky-%d' % d, 'claimant': 'kravatsky', 'claimantName': CLAIMANTS['kravatsky'], 'dim': d,
                         'claimed': t['claimed'], 'previous': t['previous'], 'verdict': 'QUEUED', 'status': t['status'], 'package': t['package'],
                         'detail': 'the package ships data a configuration can be rebuilt from; not decided in this wave (dimensions 18 and 25–31 first).'})
    for d, t in sorted(tables['takhanov-yun'].items()):
        if d == 25:
            continue
        rows.append({'id': 'takhanov-yun-%d' % d, 'claimant': 'takhanov-yun', 'claimantName': CLAIMANTS['takhanov-yun'], 'dim': d,
                     'claimed': t['claimed'], 'previous': t['previous'], 'verdict': 'QUEUED', 'modification': t['modification'],
                     'detail': 'published as a float64 array (pinned by hash; the inner array matches the sha256 the README prints) whose '
                               'lifted-and-auxiliary block is turned by a generic rotation ("%s"). An exact witness needs that rotation as an '
                               'exactly orthogonal matrix, or the polar-factor interval argument of the paper re-derived; neither was built in '
                               'this wave. The bulk decodes to exact Leech vectors (dimension 25 shows the decode).' % t['modification']})
    for d in (43, 45):
        t = tables['qiushi'].get(d)
        if t:
            rows.append({'id': 'qiushi-%d' % d, 'claimant': 'qiushi', 'claimantName': CLAIMANTS['qiushi'], 'dim': d,
                         'claimed': t['claimed'], 'previous': t['previous'], 'verdict': 'NEEDS DATA',
                         'detail': 'the count comes from spherical-design moment identities over a lattice section; no vector list is published. What would decide it: the vectors, or the section generators and the selected sets in exact form.'})
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', default='')
    ap.add_argument('--no-calibration', action='store_true')
    ap.add_argument('--merge-hunt', action='store_true', help='only fold instruments/kissing/holes/proposals-wave.json into the record')
    a = ap.parse_args()
    if a.merge_hunt:
        rec = json.load(open(OUT))
        tables = readme_tables()
        rows = {r['id']: r for r in rec['rows']}
        for r in needs_data_rows(tables):
            if r['id'] not in rows or rows[r['id']]['verdict'] in ('NEEDS DATA', 'QUEUED'):
                rows[r['id']] = r
        rec['rows'] = sorted(rows.values(), key=lambda r: (r['dim'], r['claimant']))
        _write(rec, tables)
        print('merged the hunt into %s' % os.path.relpath(OUT, ROOT))
        return
    log = lambda *x: print(*x, flush=True)
    rec = json.load(open(OUT)) if os.path.exists(OUT) else {'rows': [], 'calibrations': []}
    tables = readme_tables()
    for k in ('kravatsky', 'takhanov-yun', 'qiushi'):
        log('README table %s: %s' % (k, sorted(tables[k])))
    if not a.no_calibration and not a.only:
        log('calibrations:')
        rec['calibrations'] = [calibration_e8(), calibration_leech()]
        for cal in rec['calibrations']:
            if not cal['ok']:
                sys.exit('KISSING WAVE REFUSED: calibration %s failed' % cal['id'])
        rec['reds'] = red_controls()
        for rd in rec['reds']:
            log('  red: %-70s %s' % (rd['red'], 'CAUGHT' if rd['caught'] else 'NOT CAUGHT'))
            if not rd['caught']:
                sys.exit('KISSING WAVE REFUSED: a red control did not fire')
    ids = a.only.split(',') if a.only else list(claims.BUILDERS)
    rows = {r['id']: r for r in rec.get('rows', [])}
    for rid in ids:
        log('deciding %s' % rid)
        rows[rid] = run_claim(rid, tables, log)
        log('  -> %s  %s pairs, %s contacts, %s violations, %.0f s' % (rows[rid]['verdict'], rows[rid]['engine']['pairs'], rows[rid]['engine']['contacts'], rows[rid]['engine']['violations'], rows[rid]['seconds']))
        rec['rows'] = sorted(rows.values(), key=lambda r: (r['dim'], r['claimant']))
        _write(rec, tables)
    for r in needs_data_rows(tables):
        if r['id'] not in rows or rows[r['id']]['verdict'] in ('NEEDS DATA', 'QUEUED'):
            rows[r['id']] = r
    rec['rows'] = sorted(rows.values(), key=lambda r: (r['dim'], r['claimant']))
    _write(rec, tables)
    log('wrote %s: %d rows' % (os.path.relpath(OUT, ROOT), len(rec['rows'])))


def _write(rec, tables):
    rec['what'] = ('The September 2026 wave of kissing-number lower-bound claims (dimensions 18 and 25–31, three claimants), '
                   'every published configuration rebuilt from pinned bytes and every pair decided exactly over Q(sqrt2, sqrt3).')
    rec['grammar'] = {'WITNESSED': 'the published bytes are already an exact proof', 'REPAIRED': 'our exact witness built from their bytes, the float-to-exact distance measured',
                      'UNWITNESSED': 'the bytes fail exactly and no repair was built — a finding about the bytes, never a refutation of the bound',
                      'NEEDS DATA': 'no vector list is published; the row states what would decide it', 'QUEUED': 'bytes exist; not decided in this wave'}
    rec['tables'] = {k: {str(d): v for d, v in t.items()} for k, t in tables.items()}
    HP = os.path.join(ROOT, 'instruments', 'kissing', 'holes', 'proposals-wave.json')
    if os.path.exists(HP):
        h = json.load(open(HP))
        rec['hunt'] = {'what': h['what'], 'file': os.path.relpath(HP, ROOT), 'sha256': hashlib.sha256(open(HP, 'rb').read()).hexdigest(),
                       'rows': {k: {kk: vv for kk, vv in v.items() if kk != 'top_holes'} | {'top_hole': v['top_holes'][0] if v.get('top_holes') else None}
                                for k, v in h['rows'].items()}}
    rec['pins'] = {'manifest': 'corpus/kissing/wave.meta.json', 'manifestSha256': hashlib.sha256(open(os.path.join(ROOT, 'corpus', 'kissing', 'wave.meta.json'), 'rb').read()).hexdigest()}
    rec['machine'] = {'platform': platform.platform(), 'python': platform.python_version(), 'numpy': np.__version__, 'cpus': os.cpu_count(),
                      'blas': 'Accelerate (numpy build config)'}
    rec['generated'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    try:
        rec['git'] = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT).decode().strip()
    except Exception:
        rec['git'] = 'unknown'
    tmp = OUT + '.tmp'
    json.dump(rec, open(tmp, 'w'), indent=1, default=lambda o: int(o) if isinstance(o, np.integer) else float(o))
    os.replace(tmp, OUT)


if __name__ == '__main__':
    main()
