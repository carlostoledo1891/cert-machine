#!/usr/bin/env python3
"""run-aerp-ledger.py — the record of the AlphaEvolve-repository community-certificate audit, certs/aerp-ledger.json,
re-derived from the pinned inputs every run: every pin re-hashed, every claim decided again by instruments/aerp/*
(exact integers and rationals), the repository's own constructions decided as controls, and the verdict composed by the
grammar (CERTIFIED / REFUTED / REFUSED, with the scope beside it).

    python3 -I tools/run-aerp-ledger.py            (~10 min without numpy, ~1 min with; the big P60 sets dominate)
"""
import hashlib, json, os, re, sys, time
from fractions import Fraction as F

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'aerp'))
import p59, p60, p61, p42

SRC = os.path.join(ROOT, 'corpus', 'aerp', 'sources')
J = lambda rel: json.load(open(os.path.join(ROOT, rel)))
sha = lambda rel: hashlib.sha256(open(os.path.join(ROOT, rel), 'rb').read()).hexdigest()


def die(m):
    sys.exit('AERP LEDGER REFUSED: ' + m)


pins = J('corpus/aerp/PINS.json')
for rel, h in pins['pins'].items():
    if sha('corpus/aerp/sources/' + rel) != h: die(rel + ' moved from its pin')
t0 = time.time()
rows = []; controls = []


def row(id, claim, where, verdict, how, **extra):
    r = {'id': id, 'claim': claim, 'where': where, 'verdict': verdict, 'how': how}; r.update(extra); rows.append(r); return r


def nb_code(name):
    nb = json.load(open(os.path.join(SRC, 'notebooks', name + '.ipynb')))
    return ''.join(''.join(c['source']) for c in nb['cells'] if c['cell_type'] == 'code')


def py_list(text, name):
    m = re.search(r'\b' + re.escape(name) + r'\s*=\s*(\[.*?\])\s*\n(?=\s*\n|\S)', text, re.S)
    if not m: die('no list ' + name)
    return [tuple(int(t) for t in re.findall(r'-?\d+', item)) for item in re.findall(r'\(([^()]*)\)', m.group(1))] or [tuple(int(t) for t in re.findall(r'-?\d+', item)) for item in re.findall(r'\[([^\[\]]*)\]', m.group(1))]


issue = lambda n: J('corpus/aerp/sources/issues/issue-%d.json' % n)

# ---- P59: no isosceles triangles --------------------------------------------------------------------------------
code59 = nb_code('subsets_of_the_grid_with_no_isosceles_triangles')
for name, n in (('sol_64', 64), ('sol_100', 100)):
    pts = py_list(code59, name); r = p59.decide(pts, n, check_maximal=False)
    controls.append({'id': 'p59-notebook-' + name, 'n': n, 'size': r['size'], 'verdict': r['verdict'], 'isoscelesTriples': r['isoscelesTriples'], 'expected': 'the notebook reports %d points admissible' % r['size']})
    if r['verdict'] != 'CERTIFIED': die('control ' + name + ' fails')
b10 = issue(10)['body']
for name in ('set_a', 'set_b'):
    pts = py_list(b10, name); r = p59.decide(pts, 32)
    row('aerp-p59-c32-58-' + name[-1], 'C(32) >= 58: the %s of #10 is a 58-point subset of the 32 x 32 grid with no isosceles triangle (the collinear midpoint case included)' % name,
        '#10 hashkanna, 2026-10-04 (the published value is 56: PatternBoost arXiv:2411.00566 §4.1, AlphaEvolve paper §6.39)',
        r['verdict'], 'every one of the %s triples examined in integer squared distances; %d isosceles; maximal: %s' % (format(r['triples'], ','), r['isoscelesTriples'], r['maximal']),
        size=r['size'], n=32, triples=r['triples'], maximal=r['maximal'])
ext = p59.load_points(J('corpus/aerp/sources/hashkanna-noisosceles/n32_58.json'))
rows[-2]['externalFileEqualsSetA'] = sorted(ext) == sorted(py_list(b10, 'set_a'))

# ---- P60: no 5 on a sphere ----------------------------------------------------------------------------------------
code60 = nb_code('no_5_on_a_sphere')
for n in (7, 8, 9, 10, 11, 12):
    m = re.search(r'construction_n_%d_%d_%d\s*=\s*(\[.*?\])\s*\n' % (n, n, n), code60, re.S)
    if not m: continue
    pts = [tuple(int(t) for t in re.findall(r'-?\d+', it)) for it in re.findall(r'\(([^()]*)\)', m.group(1))]
    r = p60.decide(pts, n, want_reference=True)
    controls.append({'id': 'p60-notebook-n%d' % n, 'n': n, 'size': r['size'], 'verdict': r['verdict'], 'minAbsDet': r['reference']['minAbsDet'], 'expected': 'the notebook reports it admissible'})
    if r['verdict'] != 'CERTIFIED': die('control p60 n=%d fails' % n)
REF_MAX = 45   # the 5-subset cross-check runs up to this size (C(45,5) = 1.2M); above it the keyed decider alone decides


def p60_row(id, claim, where, pts, n, **extra):
    r = p60.decide(pts, n, want_reference=len(pts) <= REF_MAX)
    how = 'every 4-subset (%s) keyed by its exact hyperplane: %d dependent, %d duplicate' % (format(r['quadruples'], ','), r['keyed']['dependentQuadruples'], r['keyed']['duplicateKeys'])
    if 'reference' in r: how += '; every 5-subset (%s) by integer determinant: %d zero, min |det| %s' % (format(r['reference']['quintuples'], ','), r['reference']['zeroDeterminants'], r['reference']['minAbsDet'])
    out = row(id, claim, where, r['verdict'], how, size=len(pts), n=n, engine=r['keyed']['engine'], **extra)
    if 'witness' in r: out['witness'] = r['witness']
    return out


b4 = issue(4)['body']
m = re.search(r'```json\s*(\[\[.*?\]\])\s*```', b4, re.S)
p60_row('aerp-p60-c13-36', 'C(13) >= 36: the 36 points of #4 in {0..12}^3 have no five on a sphere or plane', '#4 Harmenszoon, 2026-06-13 (the repository ends at n = 12 with 33)', p60.load_points(json.loads(m.group(1))), 13)
for f in sorted(os.listdir(os.path.join(SRC, 'milesandmistakes-v1.1.1'))):
    mm = re.match(r'RECORD_(\d+)_points_n(\d+)\.json$', f)
    if not mm: continue
    k, n = int(mm.group(1)), int(mm.group(2))
    p60_row('aerp-p60-mm-n%d-%d' % (n, k), 'C(%d) >= %d: %s' % (n, k, f), '#6 milesandmistakes, release v1.1.1 (cffabd12)', p60.load_points(J('corpus/aerp/sources/milesandmistakes-v1.1.1/' + f)), n, file='milesandmistakes-v1.1.1/' + f)
fr = J('corpus/aerp/sources/hraness-algal-lab/no-five-on-sphere-frontier.json')
for c in fr['claims']:
    n = int(c['parameters']['n']); k = int(c['value'])
    pts = p60.load_points(c['construction']['points'])
    if len(pts) != k: die('0thernet n=%d: %d points, value %d' % (n, len(pts), k))
    p60_row('aerp-p60-0thernet-n%d-%d' % (n, k), 'C(%d) >= %d: the %s set of hraness/algal-lab' % (n, k, c['target']), '#6 0thernet, 2026-09-25 (d881f970)', pts, n, file='hraness-algal-lab/no-five-on-sphere-frontier.json#' + c['target'], recordedBestTheyCite=c.get('recorded_best'))
for f in sorted(os.listdir(os.path.join(SRC, 'hashkanna-no5sphere')), key=lambda s: (int(re.match(r'n(\d+)_(\d+)', s).group(1)), int(re.match(r'n(\d+)_(\d+)', s).group(2)))):
    mm = re.match(r'n(\d+)_(\d+)(\w*)\.json$', f); n, k = int(mm.group(1)), int(mm.group(2))
    j = J('corpus/aerp/sources/hashkanna-no5sphere/' + f); pts = p60.load_points(j)
    if int(j['instance']['n']) != n or len(pts) != k: die('hashkanna %s: header disagrees with the file name' % f)
    p60_row('aerp-p60-hashkanna-n%d-%d%s' % (n, k, mm.group(3)), 'C(%d) >= %d: %s' % (n, k, f), '#6 hashkanna, 2026-10-03 (5a3b9668)', pts, n, file='hashkanna-no5sphere/' + f)

# ---- P61: ring loading ------------------------------------------------------------------------------------------------
u = [F(33, 35), F(19, 42), F(10, 21), F(1, 3), F(11, 42), F(25, 84), F(16, 21), F(1, 2), F(5, 42), F(59, 84), F(5, 21), F(2, 3), F(3, 7), F(23, 42), F(23, 210)]
v = [F(1, 105), F(23, 42), F(3, 7), F(2, 3), F(5, 21), F(59, 84), F(5, 42), F(1, 2), F(16, 21), F(25, 84), F(11, 42), F(1, 3), F(10, 21), F(19, 42), F(59, 70)]
b11 = issue(11)['body']
for part, lst in (('u', u), ('v', v)):     # the instance is transcribed above; it must equal the issue's text
    txt = re.search(part + r'\s*=\s*\[(.*?)\]', b11, re.S).group(1)
    got = [F(int(a), int(b)) for a, b in re.findall(r'F\((\d+),\s*(\d+)\)', txt)]
    if got != lst: die('#11 transcription of ' + part + ' differs from the issue')


def p61_row(id, u, v, claimed, claim, where, **extra):
    r = p61.decide(u, v, claimed)
    verdict = 'CERTIFIED' if (r['admissible'] and (r['holdsFull'] or r['holdsNotebook'])) else 'REFUTED'
    return row(id, claim, where, verdict, 'all 2^%d sign patterns in exact rationals: alpha = %s under k = 1..m-1 (the notebook), %s under k = 1..m, %s padded with (0,0) at both ends under the notebook convention (m = %d)' % (r['m'], r['alphaNotebook'], r['alphaFull'], r['alphaPaddedNotebook'], r['paddedM']),
               m=r['m'], alphaNotebook=r['alphaNotebook'], alphaFull=r['alphaFull'], alphaPaddedNotebook=r['alphaPaddedNotebook'], attainedFull=r['alphaFullAttained'], claimed=r['claimed'], **extra)


p61_row('aerp-p61-47-42', u, v, '47/42', 'C >= 47/42: the m = 15 rational instance of #11 has alpha = 47/42 exactly (under either k-range)', '#11 VividhDesign, 2026-10-06 (the notebook\'s float instance: 1.11904756...)')
rd = lambda f, D: [tuple(map(int, l.split())) for l in open(os.path.join(SRC, 'attachments', 'ring_loading_98', f)) if l.strip()]
for f, D, id, claim, where in (('min98_m14_D16.txt', 16, 'aerp-p61-9-8-m14', 'C >= 9/8: the m = 14 instance of #12 (entries in Z/16) has alpha = 9/8 under k = 1..m, 3/4 under the notebook\'s k = 1..m-1, and 9/8 padded to m = 16 under the notebook\'s convention', '#12 Maks23, 2026-10-08'),
                                ('rec98_D16.txt', 16, 'aerp-p61-9-8-m15', 'C >= 9/8: the m = 15 instance of #12\'s zip', '#12 Maks23 (ring_loading_98.zip)'),
                                ('A17_exact_D560.txt', 560, 'aerp-p61-9-8-m17', 'C >= 9/8 under the notebook\'s own k = 1..m-1 without padding: the m = 17 instance of #12\'s zip (denominator 560)', '#12 Maks23 (ring_loading_98.zip)')):
    rows_ = rd(f, D); p61_row(id, [F(a, D) for a, b in rows_], [F(b, D) for a, b in rows_], '9/8', claim, where, file='attachments/ring_loading_98/' + f)
p61_row('aerp-p61-9-8-daeubel-12', [F(a, 16) for a in [4, 5, 12, 8, 2, 11, 4, 5, 12, 8, 2, 11]], [F(b, 16) for b in [4, 11, 2, 8, 12, 5, 4, 11, 2, 8, 12, 5]], '9/8',
        'C >= 9/8 with 12 pairs: karldaeubel\'s instance in the #12 thread (two identical six-pair blocks)', '#12 comment, karldaeubel, 2026-10-13')
c12 = [c for c in issue(12)['comments'] if c['author']['login'] == 'karldaeubel']
if not c12 or 'u = [4,5,12,8,2,11, 4,5,12,8,2,11]' not in c12[0]['body']: die('the Däubel instance is not in the pinned thread as transcribed')

# ---- P42: sums and differences -------------------------------------------------------------------------------------
code42 = nb_code('sums_differences_problems')
B = p42.parse_int_list(re.search(r'best_list\s*=\s*(\[[^\]]*\])', code42, re.S).group(1))
rb = p42.decide_set(B)
controls.append({'id': 'p42-notebook-best_list', 'size': rb['size'], 'sumset': rb['sumset'], 'differenceSet': rb['differenceSet'], 'g': rb['g'], 'expected': 'the notebook prints 1.1219357...'})
if abs(rb['g'] - 1.1219357374860444) > 1e-12: die('best_list control')
A, meta = p42.far_block(); rf = p42.decide_set(A, '1163/1000')
row('aerp-p42-far-block-1163', 'C >= g(A) > 1.163 for the explicit far-block set A of #5\'s certificate script at L = 100000 (|A| = %d), rebuilt here from its stated rule' % rf['size'],
    '#5 there4iam, 2026-07-31 (materials.zip, 3_CERTIFICATE.py read as text; Penman--Wells 2013 give 1.12594, the repository 1.12194)',
    'CERTIFIED' if rf['exceedsClaimed'] else 'REFUTED', '|A+A| = %s and |A-A| = %s by exact bitset sumsets; g > 1163/1000 decided as the integer inequality |A+A|^1000 |A|^163 > |A-A|^1163' % (format(rf['sumset'], ','), format(rf['differenceSet'], ',')),
    size=rf['size'], sumset=rf['sumset'], differenceSet=rf['differenceSet'], g=rf['g'], rule=meta)
txt = open(os.path.join(SRC, 'attachments', 'materials_bundle', '4_STRONG_conjecture_counterexample.txt')).read()
S5 = p42.parse_int_list('\n'.join(l for l in txt.splitlines() if not l.startswith('#'))); r5 = p42.decide_set(S5)
slack = r5['sumset'] + r5['size'] - r5['differenceSet'] - r5['diameter'] - 1
row('aerp-p42-strong-form-counterexample', 'the explicit 23,646-integer set of #5 §5 violates |A+A| + |A| <= |A-A| + diam(A) + 1 (the strong form of its own conjecture), by 89',
    '#5 there4iam (materials.zip, 4_STRONG_conjecture_counterexample.txt, one integer per line)',
    'CERTIFIED' if slack > 0 and slack == 89 and r5['size'] == 23646 else 'REFUTED', '|A| = %d, |A+A| = %s, |A-A| = %s, diam = %s by exact bitset sumsets; |A+A| + |A| - |A-A| - diam - 1 = %d' % (r5['size'], format(r5['sumset'], ','), format(r5['differenceSet'], ','), format(r5['diameter'], ','), slack),
    size=r5['size'], sumset=r5['sumset'], differenceSet=r5['differenceSet'], diameter=r5['diameter'], g=r5['g'], slack=slack)
row('aerp-p42-c-ge-1.6269', 'C >= 1.6269 by the "hollow bridge" instance of #5 (43 gadgets, an 86-digit modulus)', '#5 there4iam (1_WRITEUP.md §2)', 'REFUSED',
    'the set is not enumerable (modulus ~10^86); its count rests on the write-up\'s own argument, which is machine-generated and unreviewed by its authors\' statement; nothing finite to decide here',
    note='C = 2 itself is now a theorem: Lin--Li, arXiv:2607.27199 (29 Jul 2026), which #5\'s author acknowledges in the thread; cited, not decided here')
# ---- P64: the 3-D moving sofa ---------------------------------------------------------------------------------------
row('aerp-p64-sofa-1.8558', 'a 3-D moving sofa of volume >= 1.8558404 (#8; the repository records >= 1.81)', '#8 Lomnus-ai, 2026-08-21 (gist: pose paths, JAX notebooks)', 'REFUSED',
    'the certificate is a floating-point cube count under stated position and angle tolerances (0.005, 0.05 degrees; the author\'s own note: 1.7701 at the quick-start tolerances); no exact object is published. To decide it an interval instrument would have to enclose every pose, prove the swept region contains each counted cube and sum a rational lower bound — not built here',
    note='the repository\'s own pipeline (JAX, GPU) is what was run; a measurement, not a certificate')

# ---- the record ----------------------------------------------------------------------------------------------------
best = {}
for r in rows:
    if r['id'].startswith('aerp-p60-') and r['verdict'] == 'CERTIFIED':
        best[r['n']] = max(best.get(r['n'], 0), r['size'])
rec = {
    'what': "the community certificate issues on google-deepmind/alphaevolve_repository_of_problems (#4-#12; the owners have answered none), decided one by one in exact arithmetic from the pinned notebooks' definitions",
    'preregistration': 'corpus/aerp/preregistration.json', 'pins': 'corpus/aerp/PINS.json', 'repositoryCommit': '8f447457957deac61e28bf1676746f0753b3b2f8',
    'rows': rows, 'controls': controls,
    'p60BestCertifiedPerN': {str(n): best[n] for n in sorted(best)},
    'p60RepositoryBest': {'7': 21, '8': 23, '9': 26, '10': 28, '11': 31, '12': 33},
    'counts': {v: sum(1 for r in rows if r['verdict'] == v) for v in ('CERTIFIED', 'REFUTED', 'REFUSED')},
    'decider': {f: sha('instruments/aerp/' + f) for f in ('p59.py', 'p60.py', 'p61.py', 'p42.py')}, 'python': sys.version.split()[0], 'numpy': p60.np is not None,
    'seconds': round(time.time() - t0, 1), 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
}
out = os.path.join(ROOT, 'certs', 'aerp-ledger.json')
json.dump(rec, open(out, 'w'), indent=1, default=str); open(out, 'a').write('\n')
print('wrote certs/aerp-ledger.json — %d rows: %s (%.0f s)' % (len(rows), ', '.join('%s %d' % (k, v) for k, v in rec['counts'].items()), rec['seconds']))
