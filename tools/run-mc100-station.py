#!/usr/bin/env python3
"""run-mc100-station.py — the hundred pre-registered machine claims, phase 4b wave 1: the Station's Jacobian construction.
tools/ · cert-machine

WHAT IT DECIDES. Of the station-v2 pool's ten rows (corpus/machine-claims-100.json), the one a decider already exists
for: `st-jacobian`, the Station's corpus/station-v2/jacobian/construction.json (dualverse-ai/station_data_v2 @
a4ae9192fa75). The file prints ONE polynomial map of Q^3 in full (`reconstructed_map`: sparse rational coefficients,
16 terms) and claims det JF = -6 identically and three distinct rational points with one image — a non-injective
Keller map, i.e. a counterexample to the Jacobian conjecture in dimension 3. instruments/polymaps decides that claim
with the code path the register's Gao rows were decided with (decide.keller: the Jacobian determinant expanded
symbolically over Q, the witnesses only evaluated), and this run adds what the file itself prints beside it (the
term counts, every printed image, the spot check the map belongs to).

The file's `family_checks` (a = 3, 1, 2, -3) list points and images of OTHER maps of a one-parameter family whose
polynomials the file does not print (its `normalized_ansatz_certificate` carries the determinant's terms, not the
map's): those are not objects here and are not decided; the row says so. The Station's verification notebook and Lean
folder are never run. The other nine rows of the pool need instruments that do not exist yet; they are listed in the
ledger's `undecided` with what they need.

usage: python3 tools/run-mc100-station.py        writes certs/mc100-station-v2.json"""
import hashlib
import json
import os
import sys
import time
from fractions import Fraction as Fr

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'polymaps'))
import decide as D  # noqa: E402
from poly import P  # noqa: E402

POOL = 'station-v2'
OUT = os.path.join(ROOT, 'certs', 'mc100-station-v2.json')
LATER = {
    'st-kakeya-f3-d3-13': 'a new finite exact check (every direction of F3^3 on a line inside the set)',
    'st-kakeya-f3-d4-27': 'a new finite exact check (Kakeya in F3^4)',
    'st-kakeya-f3-d5-53': 'a new finite exact check (Kakeya in F3^5)',
    'st-difference-basis-q89': 'a new finite exact check (every nonzero element of the group of order 89² a difference of two marks)',
    'st-kakeya-needle': 'a new exact scorer (the discretized Kakeya needle bound)',
    'st-flat-autoconvolution': 'a new exact scorer (the flat autoconvolution bound)',
    'st-peak-autoconvolution': 'a new exact scorer (the peak bound and its local-minimum certificate)',
    'st-min-overlap': 'a new exact scorer for the upper-bound step function and a decider for the lower-bound certificate data',
    'st-sign-uncertainty': 'the 14.6 MB witness is pinned by hash only (not stored); fetch it at the pinned commit, then a new exact scorer',
}


def sha_file(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def git():
    try:
        import subprocess
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD'], cwd=ROOT).decode().strip()
    except Exception:
        return 'unknown'


def to_map(polys):
    return [P(3, {tuple(t['powers']): Fr(t['coefficient']) for t in comp}) for comp in polys]


def decide_jacobian(C):
    """the decision of one construction.json (already parsed); returns (verdict, kind, scope, decision)"""
    rm = C['reconstructed_map']
    exp = rm['expected']
    if rm['variables'] != ['x', 'y', 'z'] or C.get('arithmetic_domain') != 'QQ':
        return 'REFUSED', 'none', 'not a map of Q^3 over QQ as the file\'s schema says', {}
    F = to_map(rm['polynomials'])
    pts = [tuple(Fr(v) for v in w['point']) for w in rm['witnesses']]
    t0 = time.time()
    checks = D.keller(F, 3, exp['jacobian_determinant'], exp['component_degrees'], [w['point'] for w in rm['witnesses']], 'station')
    seconds = round(time.time() - t0, 3)
    counts = [len(f.t) for f in F]
    terms_in_file = [len(c) for c in rm['polynomials']]
    checks.append({'name': 'term counts are the printed %s (total %d)' % (exp['component_term_counts'], exp['total_terms']),
                   'ok': counts == exp['component_term_counts'] == terms_in_file and sum(counts) == exp['total_terms'], 'detail': str(counts)})
    imgs = [tuple(f.ev(p) for f in F) for p in pts]
    printed = [tuple(Fr(v) for v in w['image']) for w in rm['witnesses']]
    common = tuple(Fr(v) for v in exp['common_image'])
    checks.append({'name': 'every printed image is the exact image of its point, and all equal the printed common image',
                   'ok': imgs == printed and all(i == common for i in imgs), 'detail': '(' + ', '.join(str(v) for v in common) + ')'})
    spots = C.get('family_checks', {}).get('spot_checks', [])
    same = [s for s in spots if [tuple(Fr(v) for v in p) for p in s['points']] == pts]
    checks.append({'name': 'the map is the family member of one spot check (its points and image are the witnesses\')',
                   'ok': len(same) == 1 and tuple(Fr(v) for v in same[0]['common_image']) == common if same else False,
                   'detail': ('a = %s' % same[0]['a']) if same else 'no spot check matches'})
    others = [s['a'] for s in spots if s not in same] + (['%s (a3_transfer)' % C['family_checks']['a3_transfer']['a']] if 'a3_transfer' in C.get('family_checks', {}) else [])
    ok = all(c['ok'] for c in checks)
    decision = {'map': {'components': [str(len(f.t)) + ' terms, degree ' + str(f.deg()) for f in F],
                        'polynomials': rm['polynomials']},
                'checks': checks, 'seconds': seconds,
                'jacobianDeterminant': exp['jacobian_determinant'], 'commonImage': exp['common_image'],
                'witnesses': [w['point'] for w in rm['witnesses']],
                'notDecided': 'family_checks for a = ' + ', '.join(str(a) for a in others) + ': points and images of maps the file does not print (no object to decide)'}
    if ok:
        scope = ('every fact the claim needs, as an exact identity or evaluation: det JF = ' + exp['jacobian_determinant'] + ' identically (the 3×3 Jacobian determinant expanded over Q), components of degrees '
                 + ', '.join(str(d) for d in exp['component_degrees']) + ' with ' + ', '.join(str(c) for c in counts) + ' terms, and three distinct rational points with the one image ('
                 + ', '.join(exp['common_image']) + ') — a non-injective Keller map of C^3, a counterexample to the Jacobian conjecture in dimension 3 (the claim the register already certifies for Gao\'s G, here with 16 terms and degrees 4, 6, 7); '
                 + 'the file\'s family checks for a = ' + ', '.join(str(a) for a in others) + ' name points of maps it does not print and are not decided here')
        return 'CERTIFIED', 'none', scope, decision
    failed = [c['name'] for c in checks if not c['ok']]
    return 'REFUTED', 'arithmetic-slip', 'fails: ' + '; '.join(failed), decision


def main():
    M = json.load(open(os.path.join(ROOT, 'corpus', 'machine-claims-100.json')))
    mrows = [r for r in M['rows'] if r['pool'] == POOL]
    if len(mrows) != M['caps'][POOL]:
        sys.exit('MC100 STATION REFUSED: the manifest holds %d rows in %s' % (len(mrows), POOL))
    rows, undecided = [], []
    t_run = time.time()
    for mr in mrows:
        if mr['id'] != 'st-jacobian':
            if mr['id'] not in LATER:
                sys.exit('MC100 STATION REFUSED: ' + mr['id'] + ' neither decided here nor given a reason')
            undecided.append({'id': mr['id'], 'needs': LATER[mr['id']]})
            continue
        f = mr['source'].split(' ')[0]
        raw = open(os.path.join(ROOT, f), 'rb').read()
        h = hashlib.sha256(raw).hexdigest()
        if h != mr['sha256']:
            sys.exit('MC100 STATION REFUSED: ' + f + ' does not hash to the manifest\'s pin')
        t0 = time.time()
        verdict, kind, scope, decision = decide_jacobian(json.loads(raw.decode('utf-8')))
        rows.append({'id': mr['id'], 'pool': POOL, 'claimant': mr['claimant'], 'claim': mr['claim'], 'source': f, 'sha256': h,
                     'verdict': verdict, 'kind': kind, 'scope': scope, 'decision': decision, 'ms': round((time.time() - t0) * 1000, 1)})
        print('  %s %s (%.1f ms)' % (mr['id'], verdict, rows[-1]['ms']))
    by_v, by_k = {}, {}
    for r in rows:
        by_v[r['verdict']] = by_v.get(r['verdict'], 0) + 1
        by_k[r['kind']] = by_k.get(r['kind'], 0) + 1
    L = {'what': 'The station-v2 pool of the hundred pre-registered machine claims (corpus/machine-claims-100.json, registered 2026-10-02 before any was decided), WAVE 1: the one row a decider already existed for (st-jacobian, through instruments/polymaps), decided by tools/run-mc100-station.py from the pinned bytes. The other nine rows are listed in `undecided` with what they need; nothing is dropped. The Station\'s notebooks and Lean folders are never run.',
         'pool': POOL, 'wave': 1, 'manifest': 'corpus/machine-claims-100.json', 'registered': M['registered'],
         'decider': 'instruments/polymaps/decide.py (keller: det JF expanded symbolically over Q; the witnesses only evaluated) + poly.py; code sha256 ' + ', '.join(n + ' ' + sha_file(os.path.join(ROOT, 'instruments', 'polymaps', n))[:12] for n in ('decide.py', 'poly.py')),
         'rows': rows, 'count': len(rows), 'byVerdict': by_v, 'byKind': by_k, 'undecided': undecided,
         'timing': {'runMs': round((time.time() - t_run) * 1000, 1)},
         'generated': time.strftime('%Y-%m-%dT%H:%M:%S'), 'git': git(), 'python': sys.version.split()[0]}
    with open(OUT, 'w') as fh:
        json.dump(L, fh, indent=1, ensure_ascii=False)
        fh.write('\n')
    print('certs/mc100-station-v2.json · %d row decided (%s), %d undecided with reasons' % (len(rows), ', '.join('%d %s' % (v, k) for k, v in by_v.items()), len(undecided)))


if __name__ == '__main__':
    main()
