#!/usr/bin/env python3
"""pin-kissing-wave.py — the September 2026 wave of kissing-number claims, pinned by commit and sha256.

Three public repositories made lower-bound claims in dimensions 18 and 25-31 in September 2026.
This tool fetches the files the ledger reads, byte for byte, from raw.githubusercontent.com at
ONE pinned commit per repository, and records for each file its upstream path, git blob id, size
and sha256 in corpus/kissing/wave.meta.json. Small files live in corpus/kissing/wave/<claimant>/
at their upstream paths; files over CACHE_BYTES (the Takhanov-Yun coordinate archives, up to
9 MB each, published with no license) go to the git-ignored corpus/kissing/wave/.cache/ and are
pinned by hash only.

Nothing fetched here is executed. Python files are not fetched at all; the one pickle
(heads_exact.pkl) is stored as bytes and read elsewhere by a non-executing opcode reader.

    python3 tools/pin-kissing-wave.py --init     fetch everything, write the manifest
    python3 tools/pin-kissing-wave.py --fetch    fetch what is missing (cache included), verify
    python3 tools/pin-kissing-wave.py            re-hash every file on disk against the manifest;
                                                 a cache file that is absent is reported, not failed
"""
import hashlib, json, os, sys, urllib.request

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
WAVE = os.path.join(ROOT, 'corpus', 'kissing', 'wave')
META = os.path.join(ROOT, 'corpus', 'kissing', 'wave.meta.json')
CACHE_BYTES = 3 * 1024 * 1024
UA = {'User-Agent': 'cert-machine-kissing-ledger'}

SOURCES = {
    'kravatsky': {
        'claimant': 'A. Kravatskiy (github.com/alexlegeartis/KissingNumbers)',
        'repo': 'alexlegeartis/KissingNumbers',
        'commit': '86b7de10c69b762ac9403c6db455eabaeba5b68e',
        'commit_date': '2026-09-27T20:41:27Z',
        'repo_created': '2026-08-21T21:23:45Z',
        'license': 'MIT (LICENSE at the pinned commit)',
        'paper': 'none on arXiv; the write-up, paper/kissing46.pdf (47 pp.), is in the repository (README, "The write-up"; its opening paragraph still says "outside this repository")',
        'files': [
            'LICENSE', 'README.md', 'RESULTS.md', 'common/data/golay_basis.txt',
            'verifications/improved/dim18-bent-hexagon/README.md',
            'verifications/improved/dim18-bent-hexagon/data/octads.json',
            'verifications/improved/dim18-bent-hexagon/data/families.json',
            'verifications/improved/dim18-bent-hexagon/data/tierB.json',
            'verifications/improved/dim25-lens-heads/README.md',
            'verifications/improved/dim25-lens-heads/data/heads_X.npy',
            'verifications/improved/dim25-lens-heads/data/heads_U.npy',
            'verifications/improved/dim25-lens-heads/data/heads_exact.pkl',
            'verifications/improved/dim25-lens-heads/data/extra_P.npy',
            'verifications/improved/dim26-27-iota-triangles/README.md',
            'verifications/improved/dim26-27-iota-triangles/data/heads26_Y.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads26_side.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads26_layer2_u.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads26_layer2_line.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads27_Y.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads27_side.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads27_layer2_u.npy',
            'verifications/improved/dim26-27-iota-triangles/data/heads27_layer2_line.npy',
            'verifications/improved/dim28-norm8-frame-layer/README.md',
            'verifications/improved/dim28-norm8-frame-layer/data/classes.npy',
            'verifications/improved/dim28-norm8-frame-layer/data/heads.npy',
            'verifications/improved/dim29-30-frame-layer/README.md',
            'verifications/improved/dim29-30-frame-layer/data/geom29.json',
            'verifications/improved/dim29-30-frame-layer/data/geom30.json',
            'verifications/improved/dim29-30-frame-layer/data/owners29.npy',
            'verifications/improved/dim29-30-frame-layer/data/owners30.npy',
            'verifications/improved/dim29-30-frame-layer/data/bounds29.npy',
            'verifications/improved/dim29-30-frame-layer/data/bounds30.npy',
            'verifications/improved/dim31-frame-layer/README.md',
            'verifications/improved/dim31-frame-layer/data/geom31.json',
            'verifications/improved/dim31-frame-layer/data/owners31.npy',
            'verifications/improved/dim31-frame-layer/data/bounds31.npy',
        ],
    },
    'takhanov-yun': {
        'claimant': 'R. Takhanov and S. Yun (arXiv:2609.21591; github.com/k-nic/Leech_lifting)',
        'repo': 'k-nic/Leech_lifting',
        'commit': '12a06bc252f865ae7dcaf746c53774c4a827275b',
        'commit_date': '2026-09-24T05:05:31Z',
        'repo_created': '2026-09-16T10:30:07Z',
        'license': 'none (no license file upstream); the coordinate archives are pinned by hash and kept in the git-ignored cache, never redistributed',
        'paper': 'arXiv:2609.21591 (v1 2026-09-18, v2 2026-09-23)',
        'files': [
            'README.md',
            'kissing_r25_197058_float64.zip', 'kissing26_coord.zip', 'kissing27_coord.zip',
            'kissing28_coord.zip', 'kissing29_coord.zip', 'kissing30_coord.zip',
            'kissing_r31_238354.zip', 'certificate_D30.zip', 'certificate_D31.zip',
        ],
        'cache_all_but': ['README.md'],
    },
    'qiushi': {
        'claimant': 'Qiushi Engine (Oxelra-AI; arXiv:2609.35051)',
        'repo': 'Oxelra-AI/Qiushi-Engine-Kissing-Number-Research',
        'commit': 'f3060ec861370a896dd7d1b45701139266b66085',
        'commit_date': '2026-09-29T05:16:42Z',
        'repo_created': '2026-09-25T16:13:22Z',
        'license': 'code MIT; reports, notes and original data CC BY 4.0 (LICENSE, RIGHTS.md); the inherited Kravatskiy data under its MIT notice (constructions/d25/THIRD_PARTY_LICENSE.txt)',
        'paper': 'arXiv:2609.35051 (v1 2026-09-28)',
        'files': [
            'LICENSE', 'RIGHTS.md', 'README.md',
            'constructions/d25/README.md', 'constructions/d25/construction.tex',
            'constructions/d25/baseline-heads.json', 'constructions/d25/repair-points.json',
            'constructions/d25/source-manifest.json', 'constructions/d25/verification.json',
            'constructions/d25/THIRD_PARTY_LICENSE.txt',
            'constructions/d27/README.md', 'constructions/d27/verification.json',
            'constructions/d27/data/heads27_Y.npy', 'constructions/d27/data/heads27_side.npy',
            'constructions/d27/data/heads27_layer2_u.npy', 'constructions/d27/data/heads27_layer2_line.npy',
        ],
    },
}


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def git_blob(b):
    return hashlib.sha1(b'blob %d\x00' % len(b) + b).hexdigest()


def fetch(repo, commit, path):
    u = 'https://raw.githubusercontent.com/%s/%s/%s' % (repo, commit, path)
    return urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=300).read()


def local_path(key, path, cached):
    return os.path.join(WAVE, '.cache' if cached else '', key, path) if cached else os.path.join(WAVE, key, path)


def init():
    meta = {
        'what': 'The September 2026 wave of kissing-number lower-bound claims: every file the kissing ledger reads, '
                'byte for byte from one pinned commit per repository. sha256 is ours; blob is the git blob id, so a pin '
                'can be checked against the upstream commit without trusting this file.',
        'fetched': '2026-10-05',
        'scouted': '2026-10-04 (a research scout; every URL, commit and number re-verified here before use)',
        'executed': 'nothing: no claimant code was fetched or run; the pickle is read by a non-executing opcode reader',
        'cache': 'corpus/kissing/wave/.cache (git-ignored): files over %d bytes, pinned by hash only' % CACHE_BYTES,
        'sources': {},
    }
    for key, s in SOURCES.items():
        ent = {k: v for k, v in s.items() if k not in ('files', 'cache_all_but')}
        ent['url'] = 'https://github.com/%s/tree/%s' % (s['repo'], s['commit'])
        ent['files'] = {}
        for p in s['files']:
            b = fetch(s['repo'], s['commit'], p)
            cached = len(b) > CACHE_BYTES or ('cache_all_but' in s and p not in s['cache_all_but'])
            dst = local_path(key, p, cached)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            open(dst, 'wb').write(b)
            ent['files'][p] = {'sha256': sha256(b), 'blob': git_blob(b), 'bytes': len(b), 'cached': cached}
            print('  %-14s %-70s %9d %s%s' % (key, p[-70:], len(b), sha256(b)[:16], '  (cache)' if cached else ''))
        meta['sources'][key] = ent
    json.dump(meta, open(META, 'w'), indent=1)
    open(META, 'a').write('\n')
    print('wrote', os.path.relpath(META, ROOT))


def check(fetch_missing=False):
    meta = json.load(open(META))
    bad = missing = good = 0
    for key, ent in meta['sources'].items():
        for p, f in ent['files'].items():
            dst = local_path(key, p, f['cached'])
            if not os.path.exists(dst):
                if f['cached'] and fetch_missing:
                    b = fetch(ent['repo'], ent['commit'], p)
                    os.makedirs(os.path.dirname(dst), exist_ok=True)
                    open(dst, 'wb').write(b)
                elif f['cached']:
                    missing += 1
                    print('  not fetched (cache):', key, p)
                    continue
                else:
                    bad += 1
                    print('  MISSING', key, p)
                    continue
            b = open(dst, 'rb').read()
            if sha256(b) != f['sha256'] or git_blob(b) != f['blob'] or len(b) != f['bytes']:
                bad += 1
                print('  DRIFT', key, p)
            else:
                good += 1
    print('kissing wave pins: %d verified, %d drift/missing, %d cache files not fetched' % (good, bad, missing))
    return 1 if bad else 0


if __name__ == '__main__':
    if '--init' in sys.argv:
        init()
        sys.exit(check())
    sys.exit(check(fetch_missing='--fetch' in sys.argv))
