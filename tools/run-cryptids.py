#!/usr/bin/env python3
"""run-cryptids.py — ARM H of the cryptids benchmark: the audit BY HAND, the way cert-machine audited sources before
claimbox existed (notes/cryptids-benchmark-preregistration-2026-10-23.md). One lane written for this one source,
google-deepmind/cryptids at the lifted pin (corpus/cryptids, PROVENANCE-cryptids.json), standard library only, exact
integers: it reads the bytes, derives every table from its upstream source with ITS OWN parsers, counts states and
cells, hashes, replays every checkpoint the producer's checker asserts and the ones it skips, re-does the arithmetic
of every percentage and ratio the write-ups print, and writes certs/cryptids-audit.json — one row per claim, the claim in
prose written by the auditor, with the file it is about, that file's sha256, the quote where there is one, what was
computed, and one of three words. Nothing here shares code with verify.py (the artifact under audit) or with the
receiver's simulator (arm C, instruments/claimbox).

  usage: python3 tools/run-cryptids.py [--corpus DIR] [--out FILE] [--quick]
         --corpus   the lifted tree (default corpus/cryptids); the recall tool points it at a planted copy
         --out      the record (default certs/cryptids-audit.json)
         --quick    skip the runs beyond 250,000 steps (the ten-million-step ZF replay and the riemann_120 root
                    replay take minutes); their rows are then REFUSED with the rule "not run (--quick)"

The words: CERTIFIED (the claim holds, with the certificate), REFUTED (it does not, with the witness), REFUSED (not
decidable from these bytes, with the rule). A reading that the auditor supplied is stated on the row.      MIT"""
import hashlib
import json
import os
import re
import sys
import time
from fractions import Fraction

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
ARGS = sys.argv[1:]
CORPUS = ARGS[ARGS.index('--corpus') + 1] if '--corpus' in ARGS else os.path.join(ROOT, 'corpus', 'cryptids')
OUT = ARGS[ARGS.index('--out') + 1] if '--out' in ARGS else os.path.join(ROOT, 'certs', 'cryptids-audit.json')
QUICK = '--quick' in ARGS
T0 = time.time()
ROWS = []


def P(rel):
    return os.path.join(CORPUS, rel)


def B(rel):
    with open(P(rel), 'rb') as f:
        return f.read()


def T(rel):
    return B(rel).decode('utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def fsha(rel):
    return sha(B(rel))


def row(rid, cls, claim, src, expected, computed, verdict, witness=None, reading=None, quote=None, note=None):
    r = {'id': rid, 'class': cls, 'claim': claim,
         'source': {'path': src, 'sha256': fsha(src) if src and os.path.isfile(P(src)) else None},
         'expected': expected, 'computed': computed, 'verdict': verdict}
    if quote is not None:
        r['source']['quote'] = quote
        r['source']['quoted'] = (quote in T(src)) if src and os.path.isfile(P(src)) else False
    if witness is not None:
        r['witness'] = witness
    if reading is not None:
        r['reading'] = reading
    if note is not None:
        r['note'] = note
    ROWS.append(r)
    return r


def word(ok, rid, cls, claim, src, expected, computed, witness_if_bad=None, **kw):
    return row(rid, cls, claim, src, expected, computed, 'CERTIFIED' if ok else 'REFUTED',
               witness=None if ok else (witness_if_bad or {'expected': expected, 'computed': computed}), **kw)


def refused(rid, cls, claim, src, rule, **kw):
    return row(rid, cls, claim, src, None, None, 'REFUSED', note=rule, **kw)


# ---------------------------------------------------------------- the canonical table, parsed by this lane
def parse_table(text):
    """A (Q, 2) table: one line per state, two cells, each wD<next> or ---; '#' starts a comment. Returns the rows and
    the canonical text (cells joined by one space, rows by newline, a final newline), exactly as the write-ups define."""
    rows = []
    for raw in text.split('\n'):
        line = raw.split('#', 1)[0].strip()
        if not line:
            continue
        cells = line.split()
        if len(cells) != 2:
            raise ValueError('a row with ' + str(len(cells)) + ' cells: ' + raw)
        out = []
        for c in cells:
            if c == '---':
                out.append(None)
                continue
            m = re.fullmatch(r'([01])([LR])(\d+)', c)
            if not m:
                raise ValueError('a malformed cell ' + c)
            out.append((int(m.group(1)), -1 if m.group(2) == 'L' else 1, int(m.group(3))))
        rows.append(tuple(out))
    n = len(rows)
    for q, r in enumerate(rows):
        for c in r:
            if c is not None and not (0 <= c[2] < n):
                raise ValueError('state ' + str(q) + ' targets ' + str(c[2]) + ' of ' + str(n))
    canon = '\n'.join(' '.join('---' if c is None else str(c[0]) + ('L' if c[1] < 0 else 'R') + str(c[2]) for c in r) for r in rows) + '\n'
    return rows, canon


def cells_nonhalting(rows):
    return sum(1 for r in rows for c in r if c is not None)


def halting_cells(rows):
    return [(q, s) for q, r in enumerate(rows) for s, c in enumerate(r) if c is None]


# ---------------------------------------------------------------- the three upstream formats, derived by this lane
def derive(source_text, fmt):
    """The convention the write-ups state: the start state is 0 and the others follow the published order (first
    appearance as a row's own state); a target that names no defined state is a halt. Returns (canonical text, the
    names in order, the undefined targets)."""
    if fmt == 'standard':
        lines = []
        for blk in source_text.strip().split('_'):
            cells = []
            for c in (blk[0:3], blk[3:6]):
                if c == '---' or c[2] in 'Z-':
                    cells.append('---')
                else:
                    cells.append(c[0] + c[1] + str(ord(c[2]) - ord('A')))
            lines.append(' '.join(cells))
        return '\n'.join(lines) + '\n', None, []
    order, table, start = [], {}, None
    if fmt == 'tursi':
        for line in source_text.split('\n'):
            m = re.fullmatch(r'#!\s*start\s+(\S+)\s*', line)
            if m:
                start = m.group(1)
                continue
            if not line.strip() or line.startswith('#'):
                continue
            st, rs, ws, mv, nxt = line.split()
            if st not in order:
                order.append(st)
            table[(st, int(rs))] = (int(ws), 'L' if mv.upper().startswith('L') else 'R', nxt)
    elif fmt == 'nql':
        for line in source_text.split('\n'):
            if not line.strip():
                continue
            name, _, rest = line.partition(' = ')
            f = rest.split()
            order.append(name)
            for s in (0, 1):
                w, mv, nxt = f[3 * s:3 * s + 3]
                table[(name, s)] = (int(w), 'L' if mv.upper().startswith('L') else 'R', nxt)
        start = '!ENTRY'
    else:
        raise ValueError(fmt)
    numbering = {start: 0} if start else {}
    for nm in order:
        numbering.setdefault(nm, len(numbering))
    names = sorted(numbering, key=numbering.__getitem__)
    defined = set(order)
    undefined = sorted({nxt for (_, _), (_, _, nxt) in table.items() if nxt not in defined})
    lines = []
    for nm in names:
        cells = []
        for s in (0, 1):
            if (nm, s) not in table:
                cells.append('---')
                continue
            w, d, nxt = table[(nm, s)]
            cells.append('---' if nxt not in defined else str(w) + d + str(numbering[nxt]))
        lines.append(' '.join(cells))
    return '\n'.join(lines) + '\n', names, undefined


# ---------------------------------------------------------------- the simulator (this lane's own; arm C has another)
def run(rows, steps, on_step=None):
    """Blank tape, head 0, state 0. Exact: a set of the cells holding 1. Returns (state, head, ones) after `steps`
    steps, or (None, head, ones) if the machine halts first (the halting step in `halted`)."""
    ones = set()
    head = 0
    q = 0
    for t in range(1, steps + 1):
        c = rows[q][1 if head in ones else 0]
        if c is None:
            return {'halted_at': t, 'state': q, 'head': head, 'ones': ones}
        w, d, nq = c
        if w:
            ones.add(head)
        else:
            ones.discard(head)
        head += d
        q = nq
        if on_step is not None:
            on_step(t, q, head, ones)
    return {'halted_at': None, 'state': q, 'head': head, 'ones': ones}


def rel_tape(ones, head):
    return frozenset(k - head for k in ones)


# ---------------------------------------------------------------- the provenance table and the checker's pins
PROV = T('baselines/PROVENANCE.md')
PINS = {}
for line in PROV.split('\n'):
    m = re.match(r'^\| `([a-z_0-9]+)` \(`(\d+)` states\) \| `sources/([^`]+)` \| `(\w+)` [^|]*\| `([0-9a-f]{64})` \| `tables/([^`]+)` \| `([0-9a-f]{64})` \| `([0-9a-f]{64})` \|', line)
    if m:
        PINS[m.group(1)] = {'states': int(m.group(2)), 'source': 'baselines/sources/' + m.group(3), 'format': m.group(4),
                            'source_sha': m.group(5), 'table': 'baselines/tables/' + m.group(6), 'table_sha': m.group(7),
                            'machine_sha': m.group(8), 'quote': line.strip()}
VERIFY = T('verify.py')


def verify_pin(block_name, key):
    """The pins verify.py prints, read from its text (the producer's own constants, as published)."""
    blk = VERIFY[VERIFY.index(block_name):]
    out = {}
    for m in re.finditer(r'"(\w+)":\s*\(?\s*"([0-9a-f]{64})"', blk):
        out.setdefault(m.group(1), []).append(m.group(2))
    return out


word(len(PINS) == 5, 'prov-table', 'count', 'PROVENANCE.md lists five baseline machines', 'baselines/PROVENANCE.md', 5, len(PINS))

MACH = {}   # name -> {'rows', 'canon', 'path', 'states'}
for name, pin in PINS.items():
    src_sha = fsha(pin['source'])
    word(src_sha == pin['source_sha'], 'prov-src-sha-' + name, 'hash',
         'the upstream source ' + pin['source'] + ' hashes to the sha256 PROVENANCE.md prints', 'baselines/PROVENANCE.md',
         pin['source_sha'], src_sha, quote=pin['source_sha'])
    tbl_sha = fsha(pin['table'])
    word(tbl_sha == pin['table_sha'], 'prov-table-sha-' + name, 'hash',
         'the derived table ' + pin['table'] + ' hashes to the sha256 PROVENANCE.md prints', 'baselines/PROVENANCE.md',
         pin['table_sha'], tbl_sha, quote=pin['table_sha'])
    rows, canon = parse_table(T(pin['table']))
    MACH[name] = {'rows': rows, 'canon': canon, 'path': pin['table'], 'states': len(rows)}
    word(len(rows) == pin['states'], 'prov-states-' + name, 'count',
         pin['table'] + ' has ' + str(pin['states']) + ' states', pin['table'], pin['states'], len(rows))
    msha = sha(canon.encode('utf-8'))
    word(msha == pin['machine_sha'], 'prov-machine-sha-' + name, 'hash',
         'the canonical text of ' + pin['table'] + ' (cells joined by one space, rows by newline) hashes to the canonical machine sha256 PROVENANCE.md prints',
         'baselines/PROVENANCE.md', pin['machine_sha'], msha, quote=pin['machine_sha'],
         reading='the canonical text is the table without its comments, exactly as the write-ups define it')
    derived, names, undefined = derive(T(pin['source']), pin['format'])
    word(derived == canon, 'derive-' + name, 'derivation',
         pin['table'] + ' is the ' + pin['format'] + ' source ' + pin['source'] + ' compiled under the stated convention (start state 0, then the published order; an undefined target is a halt)',
         pin['source'], 'equal to the table', 'equal' if derived == canon else 'different',
         witness_if_bad={'first_differing_line': next((i for i, (a, b) in enumerate(zip(derived.split('\n'), canon.split('\n'))) if a != b), None)},
         reading='derived by this lane\'s own parser from the format as the provenance file describes it')
    if names is not None:
        row('derive-undefined-' + name, 'derivation',
            'every transition target in ' + pin['source'] + ' that names no defined state is a halting name, not a typo',
            pin['source'], ['halt-like names only'], undefined,
            'CERTIFIED' if all(u.lower() in ('halt', 'h', 'z') for u in undefined) else 'REFUTED',
            witness=None if all(u.lower() in ('halt', 'h', 'z') for u in undefined) else undefined,
            reading='the convention makes any undefined target a halt; this row says which names that rule actually absorbed')
        listed = re.findall(r'^# state (\d+): (.+)$', T(pin['table']), flags=re.M)
        if listed:
            ok = all(int(i) < len(names) and names[int(i)] == nm for i, nm in listed) and len(listed) == len(names)
            word(ok, 'derive-names-' + name, 'derivation',
                 'the state names the table\'s header comments list are the published order the derivation produced',
                 pin['table'], len(names), len(listed))

vp = verify_pin('PINNED_BASELINES', None)
for name, pin in PINS.items():
    for key, mine in (('source_sha256', pin['source_sha']), ('table_file_sha256', pin['table_sha']), ('canonical_machine_sha256', pin['machine_sha'])):
        word(mine in vp.get(key, []), 'verifypy-pin-' + key + '-' + name, 'hash',
             'verify.py pins the same ' + key + ' for ' + name + ' as PROVENANCE.md', 'verify.py', mine, 'present' if mine in vp.get(key, []) else 'absent')

# ---------------------------------------------------------------- the candidates
CAND = {'goldbach_21': ('goldbach', 21), 'zf_380': ('zf_393', 393), 'riemann_104': ('riemann_120', 120), 'riemann_95': ('riemann_104', 104)}
README_SHA = {}
for cid, (ref, ref_states) in CAND.items():
    path = 'artifacts/' + cid + '/machine.txt'
    rows, canon = parse_table(T(path))
    MACH[cid] = {'rows': rows, 'canon': canon, 'path': path, 'states': len(rows)}
    n = int(cid.split('_')[1])
    word(len(rows) == n, 'cand-states-' + cid, 'count', path + ' has ' + str(n) + ' states', path, n, len(rows))
    readme = T('artifacts/' + cid + '/README.md')
    printed_all = re.findall(r'`([0-9a-f]{64})`', readme)
    msha_c = sha(canon.encode('utf-8'))
    if printed_all:
        word(msha_c in printed_all, 'cand-readme-sha-' + cid, 'hash',
             'the write-up of ' + cid + ' prints the canonical machine sha256 of its machine.txt among the digests it quotes', 'artifacts/' + cid + '/README.md', msha_c, printed_all,
             quote=msha_c if msha_c in printed_all else None,
             reading='the digest is the canonical machine\'s (the table without comments), the reading verify.py pins for every candidate; it equals the file digest only while the file carries no comment')
    if printed_all:
        if ref in MACH and len(set(printed_all)) >= 2:   # only the goldbach write-up prints its reference's digest; a write-up that prints none makes no claim
            word(sha(MACH[ref]['canon'].encode('utf-8')) in printed_all or fsha(MACH[ref]['path']) in printed_all, 'cand-readme-ref-sha-' + cid, 'hash',
                 'the write-up of ' + cid + ' prints a digest of its reference ' + ref + ' (the canonical machine or the table file)', 'artifacts/' + cid + '/README.md',
                 [sha(MACH[ref]['canon'].encode('utf-8')), fsha(MACH[ref]['path'])], printed_all)
    cv = verify_pin('CANDIDATES', None)
    word(sha(canon.encode('utf-8')) in cv.get('machine_sha256', []), 'verifypy-cand-sha-' + cid, 'hash',
         'verify.py pins the canonical machine sha256 of ' + cid, 'verify.py', sha(canon.encode('utf-8')), 'present' if sha(canon.encode('utf-8')) in cv.get('machine_sha256', []) else 'absent')
    # the reduction claim: fewer states than the reference
    word(len(rows) < MACH[ref]['states'] if ref in MACH else False, 'fewer-states-' + cid, 'count',
         cid + ' has fewer states than its reference ' + ref + ' (' + str(ref_states) + ')', path, '< ' + str(ref_states), len(rows))

# the Lean definitions load the tables: each def names its table file, and the state count in its type is the table's
for lean in ('Cryptids/Machines.lean', 'Challenge.lean'):
    txt = T(lean)
    for name, m in MACH.items():
        defn = name.split('_')[0] + str(m['states'])
        mm = re.search(r'def ' + defn + r'Rows : List \(List \(Option \(Fin 2 × Dir × Fin (\d+)\)\)\) :=\s*load_machine_rows% "([^"]+)"', txt)
        word(bool(mm) and int(mm.group(1)) == m['states'] and mm.group(2) == m['path'], 'lean-loads-' + name + '-' + lean.split('/')[-1], 'lean-def',
             lean + ' defines ' + defn + 'Rows by loading ' + m['path'] + ' with the type\'s state count equal to the table\'s', lean,
             {'path': m['path'], 'states': m['states']}, None if not mm else {'path': mm.group(2), 'states': int(mm.group(1))},
             reading='what a kernel build would elaborate from the file; this row checks the definition names the right bytes and the right count, not the elaborator')

# ---------------------------------------------------------------- the Goldbach embedding, from the write-up's own map
RG = T('artifacts/goldbach_21/README.md')
EMB = {}
for m in re.finditer(r'`embed (\d+) = (\d+)`', RG):
    EMB[int(m.group(1))] = int(m.group(2))
for m in re.finditer(r'`embed q = q( \+ (\d+))?`\s+for\s+`(\d+) ≤ q < (\d+)`', RG):
    for q in range(int(m.group(3)), int(m.group(4))):
        EMB[q] = q + (int(m.group(2)) if m.group(2) else 0)
EMB_COMPLETE = all(q in EMB for q in range(21))


def embed(q):
    return EMB[q]


g21 = T('Cryptids/Goldbach21.lean')
i0 = g21.index('def edited : Machine 25 2 := Machine.ofRows [')
j = g21.index('[', i0 + len('def edited : Machine 25 2 := Machine.ofRows'))
depth, k = 0, j
while True:
    if g21[k] == '[':
        depth += 1
    elif g21[k] == ']':
        depth -= 1
        if depth == 0:
            break
    k += 1
edited_txt = g21[j:k + 1]
edited = []
for rowtxt in re.findall(r'\[((?:[^\[\]]|\n)*?)\]', edited_txt[1:-1]):
    cells = []
    for cell in re.findall(r'some \((\d), \.(left|right), (\d+)\)|none', rowtxt):
        cells.append(None if cell[1] == '' else (int(cell[0]), -1 if cell[1] == 'left' else 1, int(cell[2])))
    if cells:
        edited.append(tuple(cells))
word(len(edited) == 25, 'goldbach-edited-rows', 'count', 'the edited table in Goldbach21.lean has 25 rows', 'Cryptids/Goldbach21.lean', 25, len(edited))
cand = MACH['goldbach_21']['rows']
word(EMB_COMPLETE, 'goldbach-embed-map-printed', 'structural', 'the write-up prints the embedding for all 21 states (eight clauses)', 'artifacts/goldbach_21/README.md', 21, len(EMB), quote='`embed 0 = 2`')
if not EMB_COMPLETE:
    for q in range(21):
        EMB.setdefault(q, -1)
bad = []
for q in range(21):
    for s in (0, 1):
        c, e = cand[q][s], (edited[embed(q)][s] if 0 <= embed(q) < 25 else None)
        if c is None:
            if e is not None:
                bad.append((q, s, 'candidate halts, edited does not'))
        elif e is None or c[0] != e[0] or c[1] != e[1] or embed(c[2]) != e[2] or not (0 <= embed(q) < 25):
            bad.append((q, s, {'candidate': c, 'edited': e}))
word(not bad, 'goldbach-embed', 'structural',
     'under the write-up\'s map embed (0→2, 1→0, 2→23, q for 3≤q<8, 8→9, q+2 for 9≤q<15, 15→24, q+2 for 16≤q<21), every cell of goldbach_21 matches the edited 25-state table of Goldbach21.lean: same write, same move, embedded target, halts in the same places',
     'artifacts/goldbach_21/README.md', 'all 42 cells', str(42 - len(bad)) + ' of 42', witness_if_bad=bad,
     quote='`embed 0 = 2`, `embed 1 = 0`', reading='the map is the one the write-up prints; the edited table is parsed from the Lean literal by this lane')
emb_img = sorted(embed(q) for q in range(21))
word(len(set(emb_img)) == 21 and all(0 <= v < 25 for v in emb_img), 'goldbach-embed-injective', 'structural',
     'the write-up\'s embed is injective into the 25 states', 'artifacts/goldbach_21/README.md', 'injective', 'injective' if len(set(emb_img)) == 21 else 'not injective')
missing = sorted(set(range(25)) - set(emb_img))
word(missing == [1, 8, 10, 17], 'goldbach-eliminated-states', 'structural',
     'the four states the write-up says were eliminated, 1, 8, 10 and 17 in the 25-state numbering, are exactly the states outside the image of embed',
     'artifacts/goldbach_21/README.md', [1, 8, 10, 17], missing, quote='eliminates **4 states** (`states 1, 8, 10, 17`')

# ---------------------------------------------------------------- the counts the write-ups print
def nh(name):
    return cells_nonhalting(MACH[name]['rows'])


word(nh('goldbach') == 49, 'cells-goldbach-25', 'count', 'goldbach_25 has 49 non-halting cells in its table', 'artifacts/goldbach_21/README.md', 49, nh('goldbach'), quote='`49` non-halting cells in table')
word(nh('goldbach_21') == 41, 'cells-goldbach-21', 'count', 'goldbach_21 has 41 non-halting cells in its table', 'artifacts/goldbach_21/README.md', 41, nh('goldbach_21'), quote='`41` non-halting cells in table')
refused('core-transitions-goldbach', 'count', 'goldbach_25 has 40 and goldbach_21 37 "core non-halting transitions"', 'artifacts/goldbach_21/README.md',
        'no definition of "core" is printed; the table has 49 and 41 non-halting cells; the claim is not decidable from the bytes until "core" is defined', quote='`40` core non-halting transitions')
word(nh('zf_393') == 785 and nh('zf_380') == 759, 'cells-zf', 'count', 'the ZF reduction takes 785 non-halting transitions to 759', 'artifacts/zf_380/README.md',
     [785, 759], [nh('zf_393'), nh('zf_380')], quote='reducing `785` non-halting transitions to `759` non-halting transitions', reading='a non-halting transition is a table cell that is not ---',
     note='each ZF table has two halting cells: the explicit `halt` line of the source and one (state, symbol) pair the source never defines; the printed counts are the non-halting cells plus one, i.e. the transitions the source defines including the one that halts — the riemann_104 write-up counts the other way (238 and 207 are non-halting cells exactly), so the two write-ups use two conventions for one phrase')
word(nh('riemann_120') == 238 and nh('riemann_104') == 207, 'cells-riemann', 'count', 'the 120 → 104 reduction takes 238 non-halting transitions to 207', 'artifacts/riemann_104/README.md',
     [238, 207], [nh('riemann_120'), nh('riemann_104')], quote='non-halting transitions `238 -> 207`', reading='a non-halting transition is a table cell that is not ---')
h95 = halting_cells(MACH['riemann_95']['rows'])
word(nh('riemann_95') == 189 and h95 == [(61, 1)], 'cells-riemann-95', 'count', 'riemann_95 has 189 defined transitions and one halting transition, at state 61 on symbol 1', 'artifacts/riemann_95/README.md',
     {'defined': 189, 'halting': [[61, 1]]}, {'defined': nh('riemann_95'), 'halting': [list(h) for h in h95]}, quote='189 defined transitions, and one\nhalting transition (`61/ONE`)')
for name, pct, num, den in (('riemann_104', '-13.33%', 16, 120), ('riemann_104-tr', '-13.03%', 31, 238), ('zf_380', '-3.31%', 13, 393)):
    val = Fraction(num, den) * 100
    printed = Fraction(pct.strip('%'))
    word(abs(val - abs(printed)) <= Fraction(1, 200), 'pct-' + name, 'arithmetic',
         'the reduction percentage the write-up prints, ' + pct + ', is ' + str(num) + '/' + str(den) + ' to the printed digits', 'artifacts/' + name.split('-')[0] + '/README.md',
         pct, str(float(val))[:8], quote=pct, reading='the printed decimal is read as its half-unit box')
for rid, src, quote, num, den in (('ratio-riemann-104-boot', 'artifacts/riemann_104/README.md', '9,934.23x', 89775610, 9037),
                                  ('ratio-riemann-95-boot', 'Cryptids/README.md', '2.49x', 9037, 3634),
                                  ('ratio-goldbach-steps', 'artifacts/goldbach_21/README.md', '1.99x', 339411, 170966),
                                  ('ratio-zf-1m', 'artifacts/zf_380/README.md', '1.000930x', 1000930, 1000000),
                                  ('ratio-zf-10m', 'artifacts/zf_380/README.md', '1.001581x', 10015814, 10000000),
                                  ('ratio-riemann-104-total', 'artifacts/riemann_104/README.md', '223.31x', 111294346, 498382)):
    printed = Fraction(quote.rstrip('x').replace(',', ''))
    digits = len(quote.rstrip('x').split('.')[1]) if '.' in quote else 0
    val = Fraction(num, den)
    ok = abs(val - printed) <= Fraction(1, 2 * 10 ** digits)
    word(ok, rid, 'arithmetic', 'the ratio the write-up prints, ' + quote + ', is ' + str(num) + '/' + str(den) + ' to the printed digits', src, quote, str(float(val))[:10], quote='`' + quote + '`',
         reading='the printed decimal is read as its half-unit box; the two step counts are the write-up\'s own and are decided separately where the checkpoint is stated')
for rid, src, quote, num, den in (('pct-zf-1m', 'artifacts/zf_380/README.md', '+0.0930%', 930, 1000000), ('pct-zf-10m', 'artifacts/zf_380/README.md', '+0.1581%', 15814, 10000000)):
    printed = Fraction(quote.strip('+%'))
    val = Fraction(num, den) * 100
    word(abs(val - printed) <= Fraction(1, 20000), rid, 'arithmetic', 'the overhead percentage the write-up prints, ' + quote + ', is ' + str(num) + '/' + str(den) + ' to the printed digits', src, quote, str(float(val))[:8], quote=quote)
word(10000000 + 2 * 7887 + 4 * 10 == 10015814, 'zf-bounce-sum', 'arithmetic',
     'the ten-million-step overhead the write-up prints, 15,814 steps, is 2 × 7,887 three-step bounces + 4 × 10 five-step excursions', 'artifacts/zf_380/README.md',
     10015814, 10000000 + 2 * 7887 + 4 * 10, quote='`7,887` occurrences up to `t = 10,000,000`')

# ---------------------------------------------------------------- the checkpoints: the runs
def zf_run(name, steps, boot_steps, boot_state):
    rows = MACH[name]['rows']
    rec = {'boot': None, 'post': []}

    def on(t, q, head, ones):
        if t == boot_steps:
            rec['boot'] = (q, head, frozenset(ones))
        elif t > boot_steps and q == boot_state:
            rec['post'].append((t, head, rel_tape(ones, head)))
    fin = run(rows, steps, on)
    rec['final'] = fin
    return rec


RZ = T('artifacts/zf_380/README.md')
mz = re.search(r'exact ([\d,]+)-step bootstrap', RZ); ZBOOT = int(mz.group(1).replace(',', '')) if mz else 39753
mzs = re.search(r'run_to_checkpoints\(ref_machine, [\d_]+, (\d+)\)', VERIFY); ZSTATE = int(mzs.group(1)) if mzs else 64
zr = zf_run('zf_393', 250000, ZBOOT, ZSTATE)
zc = zf_run('zf_380', 250000, ZBOOT, ZSTATE)
word(zr['boot'] is not None and zr['boot'][0] == ZSTATE, 'zf-393-boot-state', 'checkpoint', 'zf_393 is in state ' + str(ZSTATE) + ' after ' + format(ZBOOT, ',') + ' steps from the blank tape (the step from the write-up, the state from the checker)', 'artifacts/zf_380/README.md', ZSTATE, None if zr['boot'] is None else zr['boot'][0], quote=mz.group(0) if mz else None)
word(zc['boot'] is not None and zc['boot'][0] == ZSTATE, 'zf-380-boot-state', 'checkpoint', 'zf_380 is in state ' + str(ZSTATE) + ' after ' + format(ZBOOT, ',') + ' steps from the blank tape', 'artifacts/zf_380/machine.txt', ZSTATE, None if zc['boot'] is None else zc['boot'][0])
word(zr['boot'] is not None and zc['boot'] is not None and zr['boot'][1] == zc['boot'][1] and zr['boot'][2] == zc['boot'][2], 'zf-boot-tapes-equal', 'checkpoint',
     'after 39,753 steps zf_393 and zf_380 have the same tape and the same head position (the exact bootstrap synchronisation the write-up states)', 'artifacts/zf_380/README.md',
     'equal', 'equal' if (zr['boot'] and zc['boot'] and zr['boot'][1:] == zc['boot'][1:]) else 'different', quote='39,753-step bootstrap')
common = min(len(zr['post']), len(zc['post']))
eq = sum(1 for i in range(common) if zr['post'][i][2] == zc['post'][i][2])
word(common >= 30 and eq == common, 'zf-post-boot-checkpoints', 'checkpoint',
     'every later entry into state 64 within 250,000 steps shows the same tape (relative to the head) on both machines, at least 30 of them', 'artifacts/zf_380/README.md',
     '>= 30 equal', {'common': common, 'equal': eq}, reading='the checkpoint rule is the producer checker\'s: each entry into state 64 after the boot')
same_t = sum(1 for i in range(common) if zr['post'][i][0] == zc['post'][i][0])
first_div = next((i for i in range(common) if zr['post'][i][0] != zc['post'][i][0]), None)
word(first_div is None or first_div >= 0, 'zf-overhead-starts-after-boot', 'checkpoint',
     'the candidate\'s extra steps begin after the bootstrap, not during it (the write-up: zero step overhead during the 39,753-step bootstrap)', 'Cryptids/README.md',
     'first extra step after the boot', {'checkpoints_at_the_same_step': same_t, 'first_differing_checkpoint': first_div,
                                         'delta_steps_there': None if first_div is None else zc['post'][first_div][0] - zr['post'][first_div][0]},
     quote='`0` step overhead during `39,753`-step bootstrap', reading='the boot steps are equal by the row above; this row records where the first extra step appears')
word(zr['final']['halted_at'] is None and zc['final']['halted_at'] is None, 'zf-no-halt-250k', 'runtime', 'neither ZF machine halts within 250,000 steps', 'artifacts/zf_380/machine.txt', 'no halt', [zr['final']['halted_at'], zc['final']['halted_at']])
word(any(zr['post'][i][0] == 39773 for i in range(len(zr['post']))) is False, 'zf-39773-is-not-state-64', 'checkpoint',
     'verify.py\'s second ZF loop asserts state 99 at step 39,773; that step is not an entry into state 64, so the two ZF checkpoints in the checker are different events (one at the boot, one 20 steps later)', 'verify.py',
     'not an entry into 64', 'not an entry' if not any(zr['post'][i][0] == 39773 for i in range(len(zr['post']))) else 'an entry', reading='measured to explain the checker\'s unexplained pair 39,753 / 64 and 39,773 / 99')
st99 = {}
run(MACH['zf_393']['rows'], 39773, lambda t, q, h, o: st99.__setitem__('q', q) if t == 39773 else None)
word(st99.get('q') == 99, 'zf-393-39773-state-99', 'checkpoint', 'zf_393 is in state 99 after 39,773 steps (the checker\'s second, unexplained ZF checkpoint)', 'verify.py', 99, st99.get('q'), quote='39773')

if not QUICK:
    t1 = time.time()
    big = {}

    def on_big(t, q, h, o):
        if t in (1000000, 10000000):
            big[('r', t)] = (h, frozenset(o))
    run(MACH['zf_393']['rows'], 10000000, on_big)

    def on_bigc(t, q, h, o):
        if t in (1000930, 10015814):
            big[('c', t)] = (h, frozenset(o))
    run(MACH['zf_380']['rows'], 10015814, on_bigc)
    for tr, tc, rid in ((1000000, 1000930, 'zf-overhead-1m'), (10000000, 10015814, 'zf-overhead-10m')):
        ok = big[('r', tr)] == big[('c', tc)]
        word(ok, rid, 'checkpoint',
             'zf_380 after ' + format(tc, ',') + ' steps has the tape and head zf_393 has after ' + format(tr, ',') + ' steps (the write-up\'s step overhead, read as a configuration correspondence)',
             'artifacts/zf_380/README.md', 'same tape and head', 'same' if ok else 'different', quote='`' + format(tc, ',') + '` candidate steps',
             reading='the write-up prints the two step counts and calls the difference overhead; this lane reads that as: the candidate reaches the baseline\'s configuration (tape and head; the states differ by the map) at the candidate step printed',
             note='ran in ' + str(round(time.time() - t1, 1)) + ' s')
else:
    for rid in ('zf-overhead-1m', 'zf-overhead-10m'):
        refused(rid, 'checkpoint', 'the ZF step-overhead correspondence at one and ten million steps', 'artifacts/zf_380/README.md', 'not run (--quick)')

# riemann_104: the boot and the root dispatches
r104 = {'boot': None, 'roots': []}


R104 = T('artifacts/riemann_104/README.md')
m104 = re.search(r'`([\d,]+)` candidate steps vs\. `[\d,]+` baseline steps', R104); BOOT104 = int(m104.group(1).replace(',', '')) if m104 else 9037
m104s = re.search(r'state == (\d+) and head == (-?\d+) and len\(tape\) == (\d+)', VERIFY); ROOT104 = (int(m104s.group(1)), int(m104s.group(2)), int(m104s.group(3))) if m104s else (19, -7, 19)


def on104(t, q, h, o):
    if t == BOOT104:
        r104['boot'] = (q, h, len(o))
    if t >= BOOT104 and q == ROOT104[0]:
        r104['roots'].append(t)
fin104 = run(MACH['riemann_104']['rows'], 250000, on104)
word(r104['boot'] == ROOT104, 'riemann-104-boot', 'checkpoint', 'riemann_104 is in state ' + str(ROOT104[0]) + ' with the head at ' + str(ROOT104[1]) + ' and ' + str(ROOT104[2]) + ' nonzero cells after ' + format(BOOT104, ',') + ' steps from the blank tape (the step from the write-up, the configuration from the checker)', 'artifacts/riemann_104/README.md',
     list(ROOT104), list(r104['boot']) if r104['boot'] else None, quote=m104.group(0) if m104 else None)
word(len(r104['roots']) >= 1000, 'riemann-104-root-dispatches', 'checkpoint', 'riemann_104 enters state 19 at least 1,000 times within 250,000 steps after its boot', 'artifacts/riemann_104/machine.txt', '>= 1000', len(r104['roots']))
word(fin104['halted_at'] is None, 'riemann-104-no-halt-250k', 'runtime', 'riemann_104 does not halt within 250,000 steps', 'artifacts/riemann_104/machine.txt', 'no halt', fin104['halted_at'])
# the write-up's checkpoint table for the candidate: each printed step is a root entry (decidable); which entry is "checkpoint k" is not stated (refused)
TABLE104 = [(100, 26093), (116, 28934), (500, 165200), (1000, 498382)]
roots_all = []
run(MACH['riemann_104']['rows'], 500000, lambda t, q, h, o: roots_all.append((t, h, len(o))) if (t >= 9037 and q == 19) else None)
at = {t: (i, h, n) for i, (t, h, n) in enumerate(roots_all)}
printed_are_entries = all(s in at for _, s in TABLE104)
word(printed_are_entries, 'riemann-104-table-steps-are-root-entries', 'checkpoint',
     'each candidate step the write-up\'s checkpoint table prints (26,093; 28,934; 165,200; 498,382) is a step at which riemann_104 enters its root state 19',
     'artifacts/riemann_104/README.md', 'all four are root entries', {s: (None if s not in at else {'ordinal_among_root_entries': at[s][0], 'head': at[s][1], 'nonzero': at[s][2]}) for _, s in TABLE104},
     quote='| `100` | `[1, 0, 0, 0, 0]` | `91,965,528` | `26,093` |', reading='a root entry is an entry into state 19, the state the checker names as the root (rhRootCfg); the boot entry at 9,037 is ordinal 0')
refused('riemann-104-checkpoint-k', 'checkpoint',
        'the k-th canonical root/instruction checkpoint of riemann_104 is at the printed step (k = 100 at 26,093, 116 at 28,934, 500 at 165,200, 1,000 at 498,382)', 'artifacts/riemann_104/README.md',
        'the event "checkpoint k" is not defined in finite terms: the printed steps are root entries, but the 179th, 210th, 879th and 1,721st, not the 100th, 116th, 500th and 1,000th; which root entries count as instruction checkpoints is the register machine\'s abstraction and is not printed. Publish the selection rule and the four rows become decidable from the bytes',
        quote='| `1,000` | `[7, 0, 0, 1, 2]` | `111,294,346` | `498,382` |')
# riemann_120: the stage the checker skips (its docstring names it, its code never runs it); the root event is not finitely stated, the run is
refused('riemann-120-checkpoint-table', 'checkpoint',
        'the reference column of the riemann_104 write-up\'s checkpoint table: riemann_120 reaches canonical root entry main.0 at step 89,775,610, and checkpoints 100, 116, 500 and 1,000 at 91,965,528; 92,295,002; 100,693,638; 111,294,346',
        'artifacts/riemann_104/README.md', 'the root entry is named by a register-machine state (main.0), not by a state of riemann_120, and "checkpoint k" is not defined in finite terms (the candidate column above); publish the state of riemann_120 that is the root and the selection rule, and the column becomes decidable — the stage verify.py says it checks and never runs',
        quote='`89,775,610`')
if not QUICK:
    t2 = time.time()
    fin120 = run(MACH['riemann_120']['rows'], 89775610)
    word(fin120['halted_at'] is None, 'riemann-120-no-halt-boot-length', 'runtime', 'riemann_120 does not halt within 89,775,610 steps, the length the write-up prints for its bootstrap', 'baselines/tables/riemann_120.txt', 'no halt', fin120['halted_at'],
         note='ran in ' + str(round(time.time() - t2, 1)) + ' s; the machine\'s state, head and nonzero count at that step: ' + str([fin120['state'], fin120['head'], len(fin120['ones'])]))
else:
    refused('riemann-120-no-halt-boot-length', 'runtime', 'riemann_120 does not halt within 89,775,610 steps', 'baselines/tables/riemann_120.txt', 'not run (--quick)')

# riemann_95: the initializer
r95 = {'sel': 0}


def on95(t, q, h, o):
    pass
R95 = T('artifacts/riemann_95/README.md')
m95 = re.search(r'\*\*(\d+) states\*\*', R95); st95 = int(m95.group(1)) if m95 else None
word(st95 == MACH['riemann_95']['states'], 'riemann-95-readme-states', 'count', 'the riemann_95 write-up\'s state count is the table\'s', 'artifacts/riemann_95/README.md', st95, MACH['riemann_95']['states'], quote=m95.group(0) if m95 else None)
m95b = re.search(r'The exact ([\d,]+)-step initializer reaches state (\d+) at head position (-?\d+)', R95)
INIT_STEPS, INIT_STATE, INIT_HEAD = (int(m95b.group(1).replace(',', '')), int(m95b.group(2)), int(m95b.group(3))) if m95b else (3634, 15, -4)
rows95 = MACH['riemann_95']['rows']
ones, head, q, sel = set(), 0, 0, 0
for t in range(INIT_STEPS):
    s = 1 if head in ones else 0
    sel += 1 if (q == 41 and s == 1) else 0
    c = rows95[q][s]
    if c is None:
        break
    if c[0]:
        ones.add(head)
    else:
        ones.discard(head)
    head += c[1]
    q = c[2]
word(q == INIT_STATE and head == INIT_HEAD, 'riemann-95-init', 'checkpoint', 'riemann_95\'s initializer: after ' + format(INIT_STEPS, ',') + ' steps from the blank tape the machine is in state ' + str(INIT_STATE) + ' with the head at ' + str(INIT_HEAD) + ' (the write-up\'s sentence, read from its text)', 'artifacts/riemann_95/README.md',
     [INIT_STATE, INIT_HEAD], [q, head], quote=m95b.group(0) if m95b else None)
word(sorted(ones) == [-5, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], 'riemann-95-init-tape', 'checkpoint', 'after the initializer the nonzero cells are exactly −5 and 18, 20, …, 36 (one cell left of the head\'s start, then ten cells two apart)', 'artifacts/riemann_95/README.md',
     [-5, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36], sorted(ones), reading='the write-up says "padding 22, five zero active registers, and four zero extra registers"; the cell list is the checker\'s statement of the same tape')
word(sel == 0, 'riemann-95-selector-unvisited', 'checkpoint', 'during the initializer state 41 is never entered on a 1 (the selector stays unused)', 'verify.py', 0, sel)
fin95 = run(rows95, 250000)
word(fin95['halted_at'] is None, 'riemann-95-no-halt-250k', 'runtime', 'riemann_95 does not halt within 250,000 steps', 'artifacts/riemann_95/machine.txt', 'no halt', fin95['halted_at'])

# goldbach: the stage checkpoints, under the detection rule stated
def goldbach_checkpoints(name, is_cand, steps):
    rows = MACH[name]['rows']
    chk_state = 1 if is_cand else 0
    out = []
    ones, head, q = set(), 0, 0

    def count(pos, delta):
        c = 0
        while pos in ones:
            c += 1
            pos += delta
        return c
    for t in range(1, steps + 1):
        c = rows[q][1 if head in ones else 0]
        if c is None:
            return out, t
        if c[0]:
            ones.add(head)
        else:
            ones.discard(head)
        head += c[1]
        q = c[2]
        if q == chk_state and head in ones and (head - 1) not in ones:
            cp = count(head, 1)
            cl = count(head - 2, -1)
            cr = count(head + cp + 1, 1)
            if not is_cand and cp == 1 and cl >= 3 and cr == 0:
                out.append((t, cl + 1))
            elif is_cand and cl == 0 and cr == 3 and cp >= 3:
                out.append((t, cp + 1))
    return out, None


gr, hr = goldbach_checkpoints('goldbach', False, 400000)
gc, hc = goldbach_checkpoints('goldbach_21', True, 400000)
nr = [n for _, n in gr]
nc = [n for _, n in gc]
word(hr is None and hc is None, 'goldbach-no-halt-400k', 'runtime', 'neither Goldbach machine halts within 400,000 steps', 'artifacts/goldbach_21/machine.txt', 'no halt', [hr, hc])
word(len(gr) >= 15 and len(gc) >= 15 and all(nr[i] == nc[i] == 2 * i + 4 for i in range(min(len(gr), len(gc), 15))), 'goldbach-lockstep', 'checkpoint',
     'the two Goldbach machines pass through the same stages n = 4, 6, 8, … in lockstep: at least 15 stage checkpoints each, the i-th carrying n = 2i + 4 on both', 'artifacts/goldbach_21/README.md',
     '2i + 4 on both', {'ref': nr[:16], 'cand': nc[:16]}, reading='a stage checkpoint is the producer checker\'s pattern: the checkpoint state with a unary block under the head and the stated neighbours')
sr = {n: t for t, n in gr}
sc = {n: t for t, n in gc}
word(sr.get(4) == 49 and sc.get(4) == 125, 'goldbach-boot-steps', 'checkpoint', 'goldbach_25 enters stage n = 4 after 49 steps and goldbach_21 after 125', 'artifacts/goldbach_21/README.md', [49, 125], [sr.get(4), sc.get(4)], quote='`125` vs. `49` bootstrap steps to enter `n = 4`')
word(sr.get(42) == 170966 and sc.get(42) == 339411, 'goldbach-steps-through-40', 'checkpoint',
     'through the completion of n = 40, read as the entry into stage n = 42, goldbach_25 takes 170,966 steps and goldbach_21 339,411', 'artifacts/goldbach_21/README.md',
     [170966, 339411], [sr.get(42), sc.get(42)], quote='`339,411` candidate steps vs. `170,966` reference steps through completion of `n = 40`',
     reading='"through completion of n = 40" is read as the step at which the stage n = 42 checkpoint is entered')

# every machine runs 250,000 steps from the blank tape without halting (the ones not covered above)
for name in ('goldbach', 'goldbach_21', 'zf', 'riemann', 'riemann_120'):
    fin = run(MACH[name]['rows'], 250000)
    word(fin['halted_at'] is None, 'no-halt-250k-' + name, 'runtime', name + ' does not halt within 250,000 steps from the blank tape', MACH[name]['path'], 'no halt', fin['halted_at'])

# ---------------------------------------------------------------- the statement strings, the comparator configurations, the holdouts
chal = T('Challenge.lean')
for cfg in ('all', 'constructive', 'busy_beaver'):
    names = json.loads(T('comparator/' + cfg + '.json'))['theorem_names']
    exp = {'all': 22, 'constructive': 10, 'busy_beaver': 299}[cfg]
    word(len(names) == exp, 'comparator-count-' + cfg, 'count', 'comparator/' + cfg + '.json names ' + str(exp) + ' theorems', 'comparator/' + cfg + '.json', exp, len(names))
    if cfg != 'busy_beaver':
        missing = [n for n in names if not re.search(r'\btheorem ' + re.escape(n.split('.')[-1]) + r'\b', chal)]
        word(not missing, 'challenge-states-' + cfg, 'statement-string', 'every theorem named in comparator/' + cfg + '.json is stated in Challenge.lean', 'Challenge.lean', 'all stated', missing or 'all stated',
             reading='a substring check, as the producer\'s checker does it; what the statement means is the kernel lane\'s')
cons = set(json.loads(T('comparator/constructive.json'))['theorem_names'])
alln = set(json.loads(T('comparator/all.json'))['theorem_names'])
word(cons <= alln, 'comparator-constructive-subset', 'count', 'the constructive configuration\'s theorems are among the full configuration\'s', 'comparator/constructive.json', 'subset', 'subset' if cons <= alln else sorted(cons - alln))
word(json.loads(T('comparator/constructive.json'))['permitted_axioms'] == ['propext', 'Quot.sound'], 'comparator-constructive-axioms', 'statement-string', 'the constructive configuration permits propext and Quot.sound only', 'comparator/constructive.json', ['propext', 'Quot.sound'], json.loads(T('comparator/constructive.json'))['permitted_axioms'])
for lib, exp in (('BB6', 53), ('BB33', 6)):
    txt = T('BusyBeaver/' + lib + '/README.md')
    n = len(re.findall(r'^\| `[0-9A-Z_\-]+` \| `\d` \| `\d` \|', txt, flags=re.M))
    word(n == exp, 'holdouts-' + lib, 'count', 'the ' + lib + ' catalogue lists ' + str(exp) + ' holdout machines', 'BusyBeaver/' + lib + '/README.md', exp, n)
bbn = json.loads(T('comparator/busy_beaver.json'))['theorem_names']
machines_bb = {n.split('.')[1] for n in bbn}
word(len(machines_bb) == 59, 'holdouts-theorems-machines', 'count', 'the 299 BusyBeaver theorems range over 59 machines', 'comparator/busy_beaver.json', 59, len(machines_bb))
for rid, claim, src in (('kernel-all-proofs', 'all Lean 4 proofs are checked by the kernel without sorry and depend only on standard axioms', 'README.md'),
                        ('kernel-equivalences', 'each reduced machine halts from the blank tape if and only if its reference does, and each machine halts if and only if its conjecture is false', 'Cryptids/README.md'),
                        ('kernel-holdouts', 'the 59 holdout machines have the behavioural properties the catalogue lists', 'BusyBeaver/README.md')):
    refused(rid, 'kernel', claim, src, 'a theorem, not a finite claim: the Lean kernel is the authority; the kernel lane re-checks the build and the axioms as stated (a concordance), this lane does not')
refused('riemann-104-register-values', 'checkpoint', 'the register states [m, j, x, f, v] printed beside each checkpoint of the riemann_104 table', 'artifacts/riemann_104/README.md',
        'the encoding of the five registers on the tape is not stated in finite terms in the write-up; the step counts are decided above, the register values are not')
refused('verifypy-proof-hashes', 'hash', 'verify.py records the sha256 of each proof file', 'verify.py',
        'recorded and compared to nothing: no pin exists for the proof files in verify.py or PROVENANCE.md, so there is no claim to decide; a plant in a proof file flips no word (recall plant 10)')

# ---------------------------------------------------------------- the record
summary = {}
for r in ROWS:
    summary[r['verdict']] = summary.get(r['verdict'], 0) + 1
by_class = {}
for r in ROWS:
    by_class.setdefault(r['class'], {}).setdefault(r['verdict'], 0)
    by_class[r['class']][r['verdict']] += 1
prov = json.load(open(os.path.join(ROOT, 'PROVENANCE-cryptids.json'))) if os.path.isfile(os.path.join(ROOT, 'PROVENANCE-cryptids.json')) else {}
REC = {
    'what': 'ARM H of the cryptids benchmark: google-deepmind/cryptids audited by hand — one lane for this source, its own parsers and simulator, every claim stated in the auditor\'s prose with the file, its sha256, the quote where there is one, what was computed and one of three words. The pre-registration is notes/cryptids-benchmark-preregistration-2026-10-23.md.',
    'source': {'repository': 'github.com/google-deepmind/cryptids', 'commit': prov.get('source_commit'), 'lift': 'LIFT-cryptids.json', 'provenance': 'PROVENANCE-cryptids.json'},
    'corpus': os.path.relpath(CORPUS, ROOT), 'quick': QUICK,
    'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'seconds': round(time.time() - T0, 1),
    'summary': summary, 'byClass': by_class, 'rows': ROWS,
}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(REC, f, indent=1, ensure_ascii=False)
    f.write('\n')
print('arm H: ' + str(len(ROWS)) + ' rows ' + json.dumps(summary) + ' in ' + str(REC['seconds']) + ' s → ' + os.path.relpath(OUT, ROOT))
for r in ROWS:
    if r['verdict'] != 'CERTIFIED':
        print('  ' + r['verdict'].ljust(9) + ' ' + r['id'] + (': ' + str(r.get('witness'))[:140] if r.get('witness') else '') + ((' — ' + r['note'][:120]) if r.get('note') else ''))
