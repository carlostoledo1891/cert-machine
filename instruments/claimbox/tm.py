#!/usr/bin/env python3
"""instruments/claimbox/tm.py — the receiver's decider for claims about small Turing machines, named by claimbox objects as
`where: instruments/claimbox/tm.py` (ARM C of the cryptids benchmark, notes/cryptids-benchmark-preregistration-2026-10-23.md).
Standard library only; exact integers; nothing here shares code with tools/run-cryptids.py (arm H) or with the producer.

A (Q, 2) machine is a table: one line per state, two cells `wD<next>` or `---`, '#' comments; the canonical text is the
table without comments, cells joined by one space, rows by newline, a final newline. The blank tape is all zeros, the head
at 0, the state 0. The decider reads a claimbox object whose predicates are `holds` over named functions of the pinned
machine M (the object's domain pin), and writes a record row with the word.

The named functions (the expectation is written in the name, as the quote prints it):
  sha256(M) = <hex>                                  the pinned file's bytes
  canonical_sha256(M) = <hex>                        the canonical text's digest
  states(M) = N          states(M) < N               the number of rows
  nonhalting_cells(M) = N                            cells that are not ---
  halting_cells(M) = [[q, s], ...]                   the --- cells, in row order
  derived(FMT) canonical_sha256(M) = <hex>           M is an upstream source in FMT (standard | tursi | nql); the table it
                                                     compiles to under the stated convention hashes to <hex>
  derived(FMT) undefined_targets(M) ⊆ [names]        the targets that name no defined state are all in the list
  after(M, T) = state Q, head H                      the configuration after T steps from the blank tape
  after(M, T) = state Q, head H, nonzero N
  after(M, T) ones = [cells]                         the cells holding 1 after T steps, sorted
  no_halt(M, T)                                      the machine does not halt within T steps
  entries(M, state Q, after T, within T2) >= N       entries into Q at steps in [T, T2]
  entries(M, state Q, after T, within T2) at steps [s1, s2, ...]   each listed step is an entry into Q
  same_tape_and_head(M, T; PATH@SHA, T2)             after T steps M has the tape and head the pinned machine at PATH has after T2
  same_tape_and_head_at_entries(M; PATH@SHA; state Q, after T, within T2) >= N   the first N entries into Q after T match
  stage_entry(M, candidate|reference, n = K) = T     the Goldbach stage checkpoint for n = K is entered at step T
  embeds_into(M; lean PATH@SHA def NAME; map CLAUSES) every cell of M matches the Lean literal table under the map

     python3 instruments/claimbox/tm.py --decide --record <out.json> <object.json>...      decide, write the rows
     python3 instruments/claimbox/tm.py --list                                              the functions
MIT"""
import hashlib
import json
import os
import re
import sys
import time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))


class Refuse(Exception):
    pass


# ---------------------------------------------------------------- tables
def parse_table(text):
    rows = []
    for raw in text.split('\n'):
        line = raw.split('#', 1)[0].strip()
        if not line:
            continue
        cells = line.split()
        if len(cells) != 2:
            raise Refuse('malformed table: a row with ' + str(len(cells)) + ' cells')
        out = []
        for c in cells:
            if c == '---':
                out.append(None)
                continue
            m = re.fullmatch(r'([01])([LR])(\d+)', c)
            if not m:
                raise Refuse('malformed table: cell ' + c)
            out.append((int(m.group(1)), -1 if m.group(2) == 'L' else 1, int(m.group(3))))
        rows.append(tuple(out))
    n = len(rows)
    for q, r in enumerate(rows):
        for c in r:
            if c is not None and not (0 <= c[2] < n):
                raise Refuse('malformed table: state ' + str(q) + ' targets ' + str(c[2]) + ' of ' + str(n))
    canon = '\n'.join(' '.join('---' if c is None else str(c[0]) + ('L' if c[1] < 0 else 'R') + str(c[2]) for c in r) for r in rows) + '\n'
    return rows, canon


def compile_source(text, fmt):
    """The convention the cryptids provenance states: the start state is 0, the others follow the order of first appearance
    as a row's own state; a target naming no defined state is a halt. Returns (canonical text, undefined targets)."""
    if fmt == 'standard':
        lines = []
        for blk in text.strip().split('_'):
            cells = []
            for c in (blk[0:3], blk[3:6]):
                cells.append('---' if (c == '---' or c[2] in 'Z-') else c[0] + c[1] + str(ord(c[2]) - ord('A')))
            lines.append(' '.join(cells))
        return '\n'.join(lines) + '\n', []
    order, table, start = [], {}, None
    if fmt == 'tursi':
        for line in text.split('\n'):
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
        for line in text.split('\n'):
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
        raise Refuse('unknown format ' + fmt)
    numbering = {start: 0} if start else {}
    for nm in order:
        numbering.setdefault(nm, len(numbering))
    names = sorted(numbering, key=numbering.__getitem__)
    defined = set(order)
    undefined = sorted({v[2] for v in table.values() if v[2] not in defined})
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
    return '\n'.join(lines) + '\n', undefined


def simulate(rows, steps, probe=None):
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
        if probe:
            probe(t, q, head, ones)
    return {'halted_at': None, 'state': q, 'head': head, 'ones': ones}


def sha(b):
    return hashlib.sha256(b).hexdigest()


def pinned(ref):
    """PATH@SHA → the bytes, held to the digest."""
    m = re.fullmatch(r'(\S+)@([0-9a-f]{64})', ref)
    if not m:
        raise Refuse('a pinned reference is PATH@SHA: ' + ref)
    p = os.path.join(ROOT, m.group(1))
    if not os.path.isfile(p):
        raise Refuse('pinned file missing: ' + m.group(1))
    b = open(p, 'rb').read()
    if sha(b) != m.group(2):
        raise Refuse('pinned file moved: ' + m.group(1))
    return b


def lean_literal_table(text, name):
    i0 = text.index('def ' + name + ' : Machine')
    j = text.index('[', text.index('Machine.ofRows', i0))
    depth, k = 0, j
    while True:
        if text[k] == '[':
            depth += 1
        elif text[k] == ']':
            depth -= 1
            if depth == 0:
                break
        k += 1
    rows = []
    for rowtxt in re.findall(r'\[((?:[^\[\]]|\n)*?)\]', text[j + 1:k]):
        cells = []
        for cell in re.findall(r'some \((\d), \.(left|right), (\d+)\)|none', rowtxt):
            cells.append(None if cell[1] == '' else (int(cell[0]), -1 if cell[1] == 'left' else 1, int(cell[2])))
        if cells:
            rows.append(tuple(cells))
    return rows


def parse_map(clauses):
    """'0→2, 1→0, 2→23, 3..7→q, 8→9, 9..14→q+2, 15→24, 16..20→q+2' → a dict."""
    out = {}
    for cl in clauses.split(','):
        cl = cl.strip()
        m = re.fullmatch(r'(\d+)\.\.(\d+)→q(?:\+(\d+))?', cl) or re.fullmatch(r'(\d+)→(\d+)', cl)
        if not m:
            raise Refuse('unreadable map clause ' + cl)
        if '..' in cl:
            lo, hi, add = int(m.group(1)), int(m.group(2)), int(m.group(3) or 0)
            for q in range(lo, hi + 1):
                out[q] = q + add
        else:
            out[int(m.group(1))] = int(m.group(2))
    return out


# ---------------------------------------------------------------- the named functions
def decide_named(name, M_bytes, M_text):
    """Returns (holds: bool, computed, witness)."""
    rows = None
    try:
        rows, canon = parse_table(M_text)
    except Refuse:
        rows, canon = None, None
    m = re.fullmatch(r'sha256\(M\) = ([0-9a-f]{64})', name)
    if m:
        got = sha(M_bytes)
        return got == m.group(1), got, None
    m = re.fullmatch(r'canonical_sha256\(M\) = ([0-9a-f]{64})', name)
    if m:
        if rows is None:
            raise Refuse('M is not a table')
        got = sha(canon.encode('utf-8'))
        return got == m.group(1), got, None
    m = re.fullmatch(r'states\(M\) (=|<) (\d+)', name)
    if m:
        if rows is None:
            raise Refuse('M is not a table')
        n = len(rows)
        return (n == int(m.group(2))) if m.group(1) == '=' else (n < int(m.group(2))), n, None
    m = re.fullmatch(r'nonhalting_cells\(M\) = (\d+)', name)
    if m:
        n = sum(1 for r in rows for c in r if c is not None)
        return n == int(m.group(1)), n, None
    m = re.fullmatch(r'halting_cells\(M\) = (\[.*\])', name)
    if m:
        got = [[q, s] for q, r in enumerate(rows) for s, c in enumerate(r) if c is None]
        return got == json.loads(m.group(1)), got, None
    m = re.fullmatch(r'derived\((standard|tursi|nql)\) canonical_sha256\(M\) = ([0-9a-f]{64})', name)
    if m:
        canon2, _ = compile_source(M_text, m.group(1))
        got = sha(canon2.encode('utf-8'))
        return got == m.group(2), got, None
    m = re.fullmatch(r'derived\((standard|tursi|nql)\) undefined_targets\(M\) ⊆ (\[.*\])', name)
    if m:
        _, und = compile_source(M_text, m.group(1))
        allowed = json.loads(m.group(2))
        return all(u in allowed for u in und), und, [u for u in und if u not in allowed] or None
    m = re.fullmatch(r'after\(M, (\d+)\) = state (\d+), head (-?\d+)(?:, nonzero (\d+))?', name)
    if m:
        fin = simulate(rows, int(m.group(1)))
        got = [fin['state'], fin['head']] + ([len(fin['ones'])] if m.group(4) else [])
        want = [int(m.group(2)), int(m.group(3))] + ([int(m.group(4))] if m.group(4) else [])
        if fin['halted_at'] is not None:
            return False, {'halted_at': fin['halted_at']}, 'halted'
        return got == want, got, None
    m = re.fullmatch(r'after\(M, (\d+)\) ones = (\[.*\])', name)
    if m:
        fin = simulate(rows, int(m.group(1)))
        got = sorted(fin['ones'])
        return got == json.loads(m.group(2)), got, None
    m = re.fullmatch(r'no_halt\(M, (\d+)\)', name)
    if m:
        fin = simulate(rows, int(m.group(1)))
        return fin['halted_at'] is None, fin['halted_at'], None
    m = re.fullmatch(r'entries\(M, state (\d+), after (\d+), within (\d+)\) >= (\d+)', name)
    if m:
        Q, T, T2, N = (int(x) for x in m.groups())
        ent = []
        simulate(rows, T2, lambda t, q, h, o: ent.append(t) if (t >= T and q == Q) else None)
        return len(ent) >= N, len(ent), None
    m = re.fullmatch(r'entries\(M, state (\d+), after (\d+), within (\d+)\) at steps (\[.*\])', name)
    if m:
        Q, T, T2 = int(m.group(1)), int(m.group(2)), int(m.group(3))
        want = json.loads(m.group(4))
        ent = {}
        simulate(rows, T2, lambda t, q, h, o: ent.__setitem__(t, len(ent)) if (t >= T and q == Q) else None)
        got = {str(s): (ent[s] if s in ent else None) for s in want}
        return all(s in ent for s in want), got, [s for s in want if s not in ent] or None
    m = re.fullmatch(r'same_tape_and_head\(M, (\d+); (\S+@[0-9a-f]{64}), (\d+)\)', name)
    if m:
        T1, ref, T2 = int(m.group(1)), m.group(2), int(m.group(3))
        rows2, _ = parse_table(pinned(ref).decode('utf-8'))
        a = simulate(rows, T1)
        b = simulate(rows2, T2)
        ok = a['halted_at'] is None and b['halted_at'] is None and a['head'] == b['head'] and a['ones'] == b['ones']
        return ok, {'M': [a['head'], len(a['ones'])], 'other': [b['head'], len(b['ones'])]}, None
    m = re.fullmatch(r'same_tape_and_head_at_entries\(M; (\S+@[0-9a-f]{64}); state (\d+), after (\d+), within (\d+)\) >= (\d+)', name)
    if m:
        ref, Q, T, T2, N = m.group(1), int(m.group(2)), int(m.group(3)), int(m.group(4)), int(m.group(5))
        rows2, _ = parse_table(pinned(ref).decode('utf-8'))

        def entries(rr):
            out = []
            simulate(rr, T2, lambda t, q, h, o: out.append(frozenset(k - h for k in o)) if (t > T and q == Q) else None)
            return out
        e1, e2 = entries(rows), entries(rows2)
        common = min(len(e1), len(e2))
        eq = sum(1 for i in range(common) if e1[i] == e2[i])
        return common >= N and eq == common, {'common': common, 'equal': eq}, None
    m = re.fullmatch(r'stage_entry\(M, (candidate|reference), n = (\d+)\) = (\d+)', name)
    if m:
        cand = m.group(1) == 'candidate'
        K, want = int(m.group(2)), int(m.group(3))
        ones, head, q, chk = set(), 0, 0, (1 if cand else 0)
        found = None

        def count(p, d):
            c = 0
            while p in ones:
                c += 1
                p += d
            return c
        for t in range(1, want + 200001):
            c = rows[q][1 if head in ones else 0]
            if c is None:
                break
            if c[0]:
                ones.add(head)
            else:
                ones.discard(head)
            head += c[1]
            q = c[2]
            if q == chk and head in ones and (head - 1) not in ones:
                cp, cl = count(head, 1), count(head - 2, -1)
                cr = count(head + cp + 1, 1)
                n = None
                if not cand and cp == 1 and cl >= 3 and cr == 0:
                    n = cl + 1
                elif cand and cl == 0 and cr == 3 and cp >= 3:
                    n = cp + 1
                if n == K:
                    found = t
                    break
        return found == want, found, None
    m = re.fullmatch(r'embeds_into\(M; lean (\S+@[0-9a-f]{64}) def (\w+); map (.+)\)', name)
    if m:
        edited = lean_literal_table(pinned(m.group(1)).decode('utf-8'), m.group(2))
        emb = parse_map(m.group(3))
        bad = []
        for q in range(len(rows)):
            if q not in emb or not (0 <= emb[q] < len(edited)):
                bad.append([q, 'no image'])
                continue
            for s in (0, 1):
                c, e = rows[q][s], edited[emb[q]][s]
                if c is None:
                    if e is not None:
                        bad.append([q, s])
                elif e is None or c[0] != e[0] or c[1] != e[1] or emb.get(c[2]) != e[2]:
                    bad.append([q, s])
        return not bad, str(2 * len(rows) - len(bad)) + ' of ' + str(2 * len(rows)), bad or None
    raise Refuse('no such function: ' + name)


# ---------------------------------------------------------------- the runner over claimbox objects
def decide_object(o):
    d = o['domain']
    if d.get('kind') != 'finite':
        raise Refuse('tm.py decides finite domains (a pinned machine)')
    p = os.path.join(ROOT, d['pin']['path'])
    if not os.path.isfile(p):
        raise Refuse('pinned file missing: ' + d['pin']['path'])
    b = open(p, 'rb').read()
    if sha(b) != d['pin']['sha256']:
        raise Refuse('pinned file moved: ' + d['pin']['path'])
    text = b.decode('utf-8')
    words, computed, witnesses = [], [], []
    for i, pr in enumerate(o['predicate']):
        g = pr['g']
        if pr.get('rel') != 'holds' or not isinstance(g, dict) or g.get('where') != 'instruments/claimbox/tm.py':
            raise Refuse('predicate[' + str(i) + '] is not a holds over a tm.py function')
        ok, comp, wit = decide_named(g['named'], b, text)
        words.append('CERTIFIED' if ok else 'REFUTED')
        computed.append(comp)
        witnesses.append(wit)
    word = 'REFUTED' if 'REFUTED' in words else 'CERTIFIED'
    return {'id': o['id'], 'claim': o['text'], 'sha256': d['pin']['sha256'], 'path': d['pin']['path'],
            'named': [pr['g']['named'] for pr in o['predicate']], 'computed': computed, 'words': words,
            'witness': [w for w in witnesses if w] or None, 'verdict': word}


def main(argv):
    if '--list' in argv:
        print(__doc__)
        return 0
    if '--decide' not in argv or '--record' not in argv:
        print('usage: tm.py --decide --record <out.json> <object.json>...')
        return 2
    out = argv[argv.index('--record') + 1]
    paths = [a for a in argv if a.endswith('.json') and a != out]
    rows = []
    t0 = time.time()
    for p in paths:
        o = json.load(open(p, encoding='utf-8'))
        t1 = time.time()
        try:
            r = decide_object(o)
        except Refuse as e:
            r = {'id': o.get('id'), 'claim': o.get('text'), 'verdict': 'REFUSED', 'rule': str(e)}
        r['ms'] = int((time.time() - t1) * 1000)
        rows.append(r)
        print('  ' + r['verdict'].ljust(9) + ' ' + str(r['id']) + ('  ' + r.get('rule', '') if r['verdict'] == 'REFUSED' else ''))
    summary = {}
    for r in rows:
        summary[r['verdict']] = summary.get(r['verdict'], 0) + 1
    rec = {'what': 'the receiver\'s decisions of claimbox objects about small Turing machines, by instruments/claimbox/tm.py (arm C of the cryptids benchmark): one row per object, the named functions, what was computed, the word',
           'decider': 'instruments/claimbox/tm.py', 'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'seconds': round(time.time() - t0, 1),
           'summary': summary, 'rows': rows}
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(rec, f, indent=1, ensure_ascii=False)
        f.write('\n')
    print('tm.py: ' + str(len(rows)) + ' objects ' + json.dumps(summary) + ' → ' + os.path.relpath(out, ROOT))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
