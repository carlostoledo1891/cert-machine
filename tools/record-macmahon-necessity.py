#!/usr/bin/env python3
"""record-macmahon-necessity.py — certs/macmahon-necessity.json: the NECESSITY half of the MacMahon classification (no
universal collection of 11 cubes or fewer, and no collection of 12 beyond the ten released sets, repeats allowed),
decided by exhaustive search twice with no shared code, under the rules of corpus/macmahon-necessity/RULES.md (written,
sealed and pushed before either search was run here).

THE ONE PLACE this lane's facts become a word. It reads:
  route R  corpus/macmahon-necessity/route-r/replay.json   the facts a reader's search printed when replayed here,
           unchanged and under the red controls (the reader's bytes are named by sha256 and not published);
  route A  instruments/macmahon/necessity.py               our own search, written clean-room, RUN here;
  C6       corpus/macmahon-necessity/kernel-plant-run/     the saved output of one run of the kernel workflow with a
           planted false theorem ("exactly nine");
  the pins corpus/macmahon/Challenge.lean (the table of names) and results/universal_witnesses.json (the released sets).
and decides each numbered item of the rules (R1-R5, A1-A2, X1-X2, C1-C6). CERTIFIED only when every one passes.
Not a proof in the kernel's sense: each search is complete by a written argument and a program, neither machine-checked.

usage: python3 tools/record-macmahon-necessity.py              run route A's five variants, decide, write the record
       python3 tools/record-macmahon-necessity.py --check      re-run route A's base variant and every variant that took
                                                               under 30 seconds, re-derive every decision, compare
       python3 tools/record-macmahon-necessity.py --check --full   re-run all five variants
Python standard library only.                                                                                    MIT"""
import hashlib
import itertools
import json
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = lambda *p: os.path.join(ROOT, *p)
OUT = J('certs', 'macmahon-necessity.json')
KEEP = J('corpus', 'macmahon-necessity')
CHECK, FULL = '--check' in sys.argv, '--full' in sys.argv
VARIANTS = ['base', 'reflections', 'shared', 'useless', 'required']
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PINS = json.load(open(J('corpus', 'macmahon', 'PINS.json')))

# the reader's files, as the rules name them
READER = {
    'README.md': 'dbd83c1599e1709341b99e85db233ed982e1c0b47035e63f168de97560b0c482',
    'gen.py': 'aeb04fb942cbbf9b18912ad84847ca1655f7f1611d0e51138aee3732e820ff03',
    'dfs.c': '4cee536cb41e330e702f3e4bb9c32e2a376d3ff29a4bf5162fba5a1d318277c1',
    'describe.py': '99d5ec3ebdf2dfa11c86d98a4401309336302497f6cc5824d8801d67fa54fb09',
    'leaves.txt': '5b605839b4beec94ecf3cf3302145c0125c2b850ef2b7d8bedb6a62905572ba2',
}
READER_ARCHIVE = '2b33347f2db8d1c72db06f4d23746efc20b03b800211b9a51d96cd07147b2f5e'
C0 = (0, 1)   # the variety labelled (A, b)


def canon_inv(inv):
    return tuple(sorted((int(i), int(j), int(c)) for i, j, c in inv))


def canon_list(U):
    return sorted({canon_inv(inv) for inv in U})


def list_sha(U):
    """sha256 of the text with one line per inventory, lines sorted, each line the entries 'i,j,count' sorted and joined
    by ';', a newline after every line (the same rule route R's facts were hashed with)"""
    return hashlib.sha256(''.join(';'.join('%d,%d,%d' % x for x in inv) + '\n' for inv in canon_list(U)).encode()).hexdigest()


def two_triangles():
    """the ten two-triangle inventories, in Lean pairs, from the definition `twoTriangles` of the pinned Challenge.lean:
    count 1 on (i, j), i != j, when i and j lie on the same side of a split of the six labels into two triples"""
    out = {}
    for s in itertools.combinations(range(6), 3):
        if 0 not in s:
            continue
        inv = canon_inv((i, j, 1) for i in range(6) for j in range(6) if i != j and ((i in s) == (j in s)))
        out[''.join('ABCDEF'[k] for k in s) + ' | ' + ''.join('ABCDEF'[k] for k in range(6) if k not in s)] = inv
    return out


def released_sets():
    p = J('corpus', 'macmahon', 'results', 'universal_witnesses.json')
    assert sha(p) == PINS['files']['results/universal_witnesses.json'], 'the pinned witness file moved'
    W = json.load(open(p))
    return [canon_inv(('ABCDEF'.index(c[0]), 'ABCDEF'.index(c[1].upper()), 1) for c in w['cubes']) for w in W]


def run_route_a(variant):
    t0 = time.time()
    r = subprocess.run([sys.executable, '-I', J('instruments', 'macmahon', 'necessity.py'), variant], cwd=ROOT, capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit('route A refused on ' + variant + ': ' + r.stderr[-800:])
    d = json.loads(r.stdout)
    assert d['variant'] == variant
    U = canon_list(d['universal'])
    row = {'m_star': d['m_star'], 'count': len(U), 'list_sha256': list_sha(U), 'levels': {str(k): v for k, v in sorted(d['levels'].items(), key=lambda kv: int(kv[0]))},
           'nodes': d['nodes'], 'seconds': round(time.time() - t0, 1)}
    if len(U) <= 100:
        row['universal'] = [[list(x) for x in inv] for inv in U]
    return row


def main():
    fails, items = [], {}

    def item(key, ok, what):
        items[key] = {'pass': bool(ok), 'what': what}
        if not ok:
            fails.append(key)

    assert sha(J('corpus', 'macmahon', 'Challenge.lean')) == PINS['files']['Challenge.lean'], 'the pinned Challenge.lean moved'
    R = json.load(open(os.path.join(KEEP, 'route-r', 'replay.json')))
    RV = R['variants']
    old = json.load(open(OUT)) if os.path.exists(OUT) else None
    if CHECK and old is None:
        print('FAIL  no record'); return 1

    # ---- route A, run here (in --check: the base variant and every variant that took under 30 seconds, unless --full)
    A = {}
    for v in VARIANTS:
        kept = os.path.join(KEEP, 'route-a', v + '.json')
        if CHECK and not FULL and v != 'base' and os.path.exists(kept) and json.load(open(kept))['seconds'] >= 30:
            A[v] = json.load(open(kept)); A[v]['rerun_in_check'] = False
            continue
        A[v] = run_route_a(v)
        if CHECK:
            k = json.load(open(kept))
            same = all(A[v][f] == k[f] for f in ('m_star', 'count', 'list_sha256', 'levels', 'nodes'))
            if not same:
                print('FAIL  route A, variant ' + v + ', no longer gives the kept output'); return 1
            A[v]['seconds'] = k['seconds']
        else:
            os.makedirs(os.path.join(KEEP, 'route-a'), exist_ok=True)
            json.dump(A[v], open(kept, 'w'), indent=1); open(kept, 'a').write('\n')
    for v in VARIANTS:
        A[v].pop('rerun_in_check', None)

    TT = two_triangles()
    REL = released_sets()
    with_c0 = sorted(inv for inv in TT.values() if (C0[0], C0[1], 1) in inv)
    without_c0 = sorted(inv for inv in TT.values() if (C0[0], C0[1], 1) not in inv)
    baseR = canon_list(RV['base']['universal'])
    baseA = canon_list(A['base']['universal'])

    # ---- route R
    item('R1', R['shipped_sha256'] == READER and R['archive_sha256'] == READER_ARCHIVE, 'the five files and the archive have the sha256 the rules name')
    u = R['unchanged_run']
    g = re.fullmatch(r'types 30 signatures 40 constraints raw (\d+) kept (\d+)', u['gen.py'])
    item('R2', bool(g) and '6290' in g.groups(), 'gen.py, unchanged, printed: ' + u['gen.py'])
    item('R3', u['dfs (cc -O2)'] == 'nodes 156751 leaves 10' and u['leaves.txt written'].startswith('byte-identical to the shipped leaves.txt') and READER['leaves.txt'] in u['leaves.txt written'],
         'dfs, unchanged, printed "' + u['dfs (cc -O2)'] + '"; the leaves.txt it wrote is ' + u['leaves.txt written'])
    item('R4', u['describe.py'].startswith('leaves: 10 | all of size 12 with no repeats | distinct splits matched: 10 of 10'), 'describe.py passed its assertions and printed: ' + u['describe.py'])
    k5 = 'dfs (cc -O0 -g -fsanitize=address,undefined)'
    item('R5', u[k5].startswith('nodes 156751 leaves 10, no sanitizer report'), 'the sanitizer build: ' + u[k5])

    # ---- route A
    lv = A['base']['levels']
    item('A1', A['base']['m_star'] == 12 and all(lv[str(t)] == 0 for t in range(12)) and lv['12'] == 10 and len(baseA) == 10 and all(c == 1 for inv in baseA for _, _, c in inv) and all(len(inv) == 12 for inv in baseA),
         'route A: no universal inventory at totals 0 to 11, exactly %d at total 12, every count 1 (%s search nodes)' % (lv.get('12', -1), format(A['base']['nodes'], ',')))
    src = open(J('instruments', 'macmahon', 'necessity.py'), encoding='utf-8').read()
    item('A2', 'WHY THE SEARCH IS EXHAUSTIVE' in src and 'The ONE pruning rule' in src and 'Nothing else is pruned' in src,
         'route A states in its header why the search is exhaustive, with its one pruning rule and why that rule can never discard a universal inventory (READ, not machine-checked)')

    # ---- the two against each other and against the release
    item('X1', baseR == baseA and RV['base']['m_star'] == A['base']['m_star'] == 12, 'route R\'s ten leaves and route A\'s ten inventories are the same ten sets')
    item('X2', baseA == sorted(TT.values()) and sorted(REL) == sorted(TT.values()) and len(set(REL)) == 10,
         'the ten are twoTriangles s for the ten splits, and are the ten released sets of the pinned universal_witnesses.json, set for set')

    # ---- red controls
    def agree(v):
        return RV[v]['m_star'] == A[v]['m_star'] and RV[v]['count'] == A[v]['count'] and RV[v]['list_sha256'] == A[v]['list_sha256']

    def differs(v):
        return (A[v]['m_star'], A[v]['list_sha256']) != (A['base']['m_star'], A['base']['list_sha256'])
    for key, v, words in (('C1', 'reflections', 'reflections allowed (48 signed axis permutations)'), ('C2', 'shared', 'the distinct-cubes rule dropped')):
        item(key, agree(v) and differs(v), '%s: both routes report m* = %s with %s universal inventories (the same list, by its sha256); the base result is m* = 12 with 10'
             % (words, A[v]['m_star'], format(A[v]['count'], ',')))
    item('C3', agree('useless') and A['useless']['m_star'] == 12 and canon_list(A['useless']['universal']) == without_c0 and canon_list(RV['useless']['universal']) == without_c0 and len(without_c0) == 6,
         'variety (A, b) made useless: both routes report m* = 12 and exactly the six two-triangle sets without it')
    item('C4', agree('required') and A['required']['m_star'] == 12 and canon_list(A['required']['universal']) == with_c0 and canon_list(RV['required']['universal']) == with_c0 and len(with_c0) == 4,
         'variety (A, b) required: both routes report m* = 12 and exactly the four two-triangle sets with it')
    cap = RV['base']['leaves_by_cap']
    item('C5', all(cap[str(t)] == 0 for t in range(12)) and cap['12'] == 10 and all(lv[str(t)] == 0 for t in range(12)),
         'the cap at 11: route R built with every cap 0 to 11 prints 0 leaves; route A\'s totals 0 to 11 are empty')

    # ---- C6, the planted false theorem on the kernel route
    kd = os.path.join(KEEP, 'kernel-plant-run')
    res = json.load(open(os.path.join(kd, 'result.json')))
    plant = open(os.path.join(kd, 'plant.txt')).read().split('\n')
    diff = [l for l in open(os.path.join(kd, 'plant.diff')).read().split('\n') if l[:1] in '<>' and l]
    run_id = open(os.path.join(kd, 'RUN')).read().strip()
    planted_ok = (plant[0] == 'exactly-nine' and len(diff) == 2
                  and diff[0] == '< theorem physical_exactly_ten : Nat.card MinimumPhysicalInventory = 10 := by sorry'
                  and diff[1] == '> theorem physical_exactly_ten : Nat.card MinimumPhysicalInventory = 9 := by sorry')
    sol_line = [l for l in plant if l.endswith('Solution.lean')]
    solution_unchanged = bool(sol_line) and sol_line[0].split()[0] == PINS['files']['Solution.lean']
    refused = res['ran'] is True and res['exit'] not in (0, None) and res['okay'] is False
    item('C6', planted_ok and solution_unchanged and refused,
         'a planted false theorem (physical_exactly_ten changed to "= 9" in Challenge.lean, the Solution the pinned bytes): Comparator exit %s, "Your solution is okay!" %s (run %s)'
         % (res['exit'], 'printed' if res['okay'] else 'not printed', run_id))

    # ---- beyond the rules: route A with its one pruning rule switched off (kept output of one run; not re-run by --check)
    extra = None
    up = os.path.join(KEEP, 'route-a', 'base-unpruned.json')
    if os.path.exists(up):
        d = json.load(open(up))
        ok = d['m_star'] == 12 and canon_list(d['universal']) == baseA and all(d['levels'][str(t)] == 0 for t in range(12)) and d['levels']['12'] == 10
        extra = {'what': 'beyond the rules: route A run once with its pruning rule switched off (python3 instruments/macmahon/necessity.py base --unpruned), so every inventory of every total 0 to 12 is visited and judged by the explicit matching; the argument that nothing is missed is then the enumeration alone',
                 'kept': 'corpus/macmahon-necessity/route-a/base-unpruned.json', 'sha256': sha(up), 'nodes': d['nodes'], 'seconds': d['seconds'], 'm_star': d['m_star'], 'count': len(d['universal']),
                 'same_ten_as_the_pruned_run': bool(ok)}
        if not ok:
            fails.append('the unpruned run disagrees with the pruned one')

    dead = [k for k in ('C1', 'C2', 'C3', 'C4', 'C5', 'C6') if not items[k]['pass']]
    verdict = 'CERTIFIED' if not fails else 'REFUSED'
    rules = os.path.join(KEEP, 'RULES.md')
    rec = {
        'what': 'The MacMahon minimum-universal-sets claim (Jason Davies, 2026-11-01), the NECESSITY half: in the model of the pinned Challenge.lean, every universal inventory of total at most 12 has total exactly 12 and no repeated variety, and there are exactly ten, the ten released two-triangle sets. Decided by exhaustive search twice with no shared code and two different methods, under rules written, sealed and pushed before either search was run here: route R, a reader\'s search (Hall\'s theorem as counting constraints, a depth-first search over violated constraints), replayed unchanged from five files named by sha256 and not published; route A, our own program written clean-room (instruments/macmahon/necessity.py: an explicit matching of slots to physical cubes, pruning by monotonicity only), run by this recorder. Not a proof in the kernel\'s sense: each search is complete by a written argument and a program, and neither is machine-checked; the Lean proof (certs/macmahon-kernel.json) stays the only formal route.',
        'claim': 'no collection of 11 MacMahon cubes or fewer is universal, and the only universal collections of 12, repeats allowed, are the ten two-triangle sets',
        'rules': {'file': 'corpus/macmahon-necessity/RULES.md', 'sha256': sha(rules), 'brief': 'corpus/macmahon-necessity/BRIEF-clean-room.md', 'brief_sha256': sha(os.path.join(KEEP, 'BRIEF-clean-room.md')),
                  'sealed': {'digest': 'c428510e70d371808f75f3aaaf8cc02be8d14189aabd761da6cff5acddd9d5f5', 'registry_commit': '77d9855b36b99468e512e1d116fba77adc3ced08', 'rules_commit': '603e093a81c61ba272fd85fcf2ade55380d5d108'}},
        'source': {'repo': PINS['repo'], 'registered_commit': PINS['registered_commit'], 'commit': PINS['commit'],
                   'pins': {f: PINS['files'][f] for f in ('Challenge.lean', 'Solution.lean', 'results/universal_witnesses.json')}},
        'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'route_R': {'who': 'a reader (unnamed; the files carry no licence line and are not copied here)', 'files_sha256': READER, 'archive_sha256': READER_ARCHIVE,
                    'facts': 'corpus/macmahon-necessity/route-r/replay.json', 'facts_sha256': sha(os.path.join(KEEP, 'route-r', 'replay.json')), 'ran': R['ran'], 'machine': R['machine'],
                    'unchanged_run': R['unchanged_run'], 'cap_patch': R['cap_patch'],
                    'variants': {v: {k: RV[v][k] for k in ('patch', 'gen_line', 'm_star', 'count', 'list_sha256', 'leaves_by_cap', 'nodes_by_cap')} for v in VARIANTS}},
        'route_A': {'program': 'instruments/macmahon/necessity.py', 'sha256': {f: sha(J('instruments', 'macmahon', f)) for f in sorted(os.listdir(J('instruments', 'macmahon'))) if f.startswith('necessity.')},
                    'variants': {v: {k: A[v][k] for k in ('m_star', 'count', 'list_sha256', 'levels', 'nodes', 'seconds')} for v in VARIANTS}},
        'the_ten': [{'split': name, 'cubes': ['ABCDEF'[i] + 'abcdef'[j] for i, j, _ in inv]} for name, inv in sorted(TT.items())],
        'kernel_plant': {'workflow': '.github/workflows/macmahon-kernel.yml', 'input': 'plant=exactly-nine', 'run': run_id, 'kept': 'corpus/macmahon-necessity/kernel-plant-run',
                         'exit': res['exit'], 'okay': res['okay'], 'kernels': res.get('kernels'), 'seconds': res.get('seconds'), 'buildSeconds': res.get('buildSeconds')},
        'items': items,
        'beyond_the_rules': extra,
        'decided': {'necessity': verdict, 'how': 'exhaustive search, twice, no shared code; not a kernel proof'},
        'verdict': verdict, 'failed': fails, 'reds_dead': dead,
        'not_said': [
            'Not a proof in the kernel\'s sense: each search is complete by a written argument and a program, and neither is machine-checked.',
            'Not that the public can re-run route R: its bytes are not published. Route A and this recorder are.',
            'Not more than the model: physical cubes enter through the discrete model the paper declares.',
            'Nothing about Johnson and Roldán\'s own wording: a statement written by hand from their paper is a later item.',
            'The numbers six and four in C3 and C4 are consequences of the claim: they test that each search responds to the model, and are not evidence for the claim by themselves.',
        ],
    }
    line = '%s  necessity %s: %d of %d rule items pass (R1-R5, A1-A2, X1-X2, C1-C6); route R %s nodes, route A %s nodes; both: 10 at total 12, none below' % (
        'PASS' if verdict == 'CERTIFIED' else 'FAIL', verdict, sum(1 for v in items.values() if v['pass']), len(items),
        format(RV['base']['nodes_by_cap']['12'], ','), format(A['base']['nodes'], ','))
    strip = lambda r: json.dumps({k: v for k, v in r.items() if k != 'generated'}, sort_keys=True)
    if CHECK:
        if strip(old) != strip(rec) or verdict != 'CERTIFIED':
            print('FAIL  the record differs on re-derivation or the verdict is not CERTIFIED: ' + line); return 1
        print(line); return 0
    json.dump(rec, open(OUT, 'w'), indent=1, ensure_ascii=False); open(OUT, 'a').write('\n')
    print(line + ' -> ' + os.path.relpath(OUT, ROOT))
    for k, v in items.items():
        print('  %s %s  %s' % (k, 'pass' if v['pass'] else 'FAIL', v['what']))
    return 0 if verdict == 'CERTIFIED' else 1


if __name__ == '__main__':
    sys.exit(main())
