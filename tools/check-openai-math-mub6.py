#!/usr/bin/env python3
"""check-openai-math-mub6.py — the N(6) = 3 saved run (openai/math family 266), read here: the records' consistency and
coverage, decided by a reader written in this repository from the release's own description, never from its code.

WHAT IT READS. On 2026-10-26 (commit 7ef5c0cc) openai/math published, beside the manuscript 'The maximum number of
mutually unbiased bases in dimension six', a saved run: verification/saved-run/execution/{commands.json, results/,
data/} — the command and result facts of the 100 native invocations and the numerical records (.bin) they wrote.
The audit's finding F-532 had been NEEDS DATA: the code and data the manuscript cites were absent.

WRITTEN FROM. verification/saved-run/VERIFY.md (the schedule and the list of checkable facts) and the manuscript's
build/sections/execution.tex (the record format, lines 48-61; the control flow and terminal conditions, 108-181; the
counts and hashes it prints, 297-376). The release's own checker, execution/check_records.py, was never opened, read
or run, and no C++ was compiled; both are pinned by sha256 only, as bytes the reader does not use.

WHAT IT CHECKS (each a row of the ledger, each a fact about bytes):
  P  every .bin parses: an eight-byte unsigned count, then records of a four-byte signed k (0 <= k <= 10), 36 binary64
     entries of p, k rows of 36 of T, and C, n0, id, ort, hor, mnorm, froot, r — 356 + 288k bytes each, finite, r > 0,
     the declared count reaching the exact end of file; a zero-count file is exactly eight bytes
  X  exactly 100 invocations (1 cover, 4 A, 2 B, 88 initial C, 1 fallback B, 4 final C), every argv the schedule
     VERIFY.md and execution.tex state, every one completed with an empty stderr
  S  the cover: centers.txt complete (its header count = its lines), the cover's own counters
  A  the four A shards: part i processes exactly the center indices = i (mod 4), terminal failedBalls0, the saved count
     equals the logged global count, the four bad text files empty
  B  B mid and B fine: every parent processed, the logged output count = the saved count, zero-count bad files, the
     radius bound (a B output's radius at most its target); B fine's 88 batches: consecutive groups of at most 256
     whose concatenation is fine.bin record for record, byte for byte, except the radius, which is the target .016
     and never smaller than the original; the completion marker agrees with both counts
  C  every initial C batch: done = its batch count, bad = its saved bad count, the four failure categories summing to
     it, exit 0 exactly when bad = 0 and 1 exactly when bad > 0, and every saved failure an unchanged, ordered
     subsequence of its batch
  F  the fallback B: its inputs are exactly the nonempty bad files in ASCII filename order, every parent processed,
     zero saved failures
  G  final C: four parts modulo 4 of the fallback output, done counts that partition it without omission, every exit 0,
     every saved bad file zero-count
  T  the counts and the eight sha256 digests the manuscript prints (Tables execute:counts and execute:hashes)
RED CONTROLS (each must make at least one named check fail): a dropped A shard, a dropped A command, a record moved
between two batches, two saved failures swapped, a fallback input dropped, a final C failure planted, a truncated
file, a batch radius enlarged.

WHAT IT DOES NOT ESTABLISH. These records record a search. They prove N(6) = 3 only through the manuscript's
finite-execution theorem (execution.tex, Theorem execute:finite-theorem), whose hypotheses this reader does not touch:
that the seed cover covers (Proposition seed:cover), that each A, B and C rejection is justified by its geometric
lemma under the stated binary64 arithmetic, that the seven C++ files implement them, that the compiled build obeyed
the arithmetic model, and that these bytes are what those programs wrote. CERTIFIED here is the finite chain's
consistency and complete coverage — the manuscript's terminal conditions, read off the records — and nothing more.

BYTES. From a clone of openai/math at the pin (MATH_CLONE, default ~/Projects/openai-math, HEAD read from .git/HEAD,
no program of the clone is run), else from raw.githubusercontent.com at the pin into ~/.cache/cert-machine/; every
file is checked against corpus/openai-math/mub6-7ef5c0cc/files.json before it is read.

usage: python3 tools/check-openai-math-mub6.py [--pin-files]    write the ledger (and, with --pin-files, the manifest)
       python3 tools/check-openai-math-mub6.py --check          re-derive and refuse on any difference
MIT"""
import hashlib
import json
import math
import os
import re
import struct
import sys
import urllib.request

ROOT = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
PIN = '7ef5c0cc5ca4b0e072b7a050fca09ab24bc6fa3a'
PAPER = 'preprints/The-maximum-number-of-mutually-unbiased-bases-in-dimension-six-September-24-2026'
SAVED = PAPER + '/verification/saved-run'
EXE = SAVED + '/execution'
MANIFEST = os.path.join(ROOT, 'corpus', 'openai-math', 'mub6-7ef5c0cc', 'files.json')
OUT = os.path.join(ROOT, 'certs', 'openai-math-mub6-records.json')
CLONE = os.environ.get('MATH_CLONE') or os.path.join(os.path.expanduser('~'), 'Projects', 'openai-math')
CACHE = os.path.join(os.path.expanduser('~'), '.cache', 'cert-machine', 'openai-math-mub6-' + PIN[:8])

# ---- what the manuscript and VERIFY.md state (the claims the records are compared with) -----------------------------
STATED = {
    'source': {'verify': SAVED + '/VERIFY.md', 'execution': PAPER + '/build/sections/execution.tex'},
    'cover': {'pairs': 151744086, 'centers': 249878, 'xs': 22829},                       # execution.tex 308-310, 325-326
    'A': {'inputs': [62470, 62470, 62469, 62469], 'outputs': [764, 774, 757, 788]},        # 311-314
    'Bmid': {'inputs': 3083, 'outputs': 600}, 'Bfine': {'inputs': 600, 'outputs': 22379},  # 315-316
    'batches': {'count': 88, 'full': 87, 'size': 256, 'last': 107},                       # 326-327
    'initialC': {'inputs': 22379, 'unresolved': 163, 'allGraphCaps': True, 'exit0': 73, 'exit1': 15},   # 299-300, 317
    'fallbackOrder': ['bad10.bin', 'bad3.bin', 'bad4.bin', 'bad5.bin', 'bad52.bin', 'bad53.bin', 'bad55.bin', 'bad56.bin',
                      'bad6.bin', 'bad7.bin', 'bad78.bin', 'bad79.bin', 'bad8.bin', 'bad80.bin', 'bad84.bin'],   # 333-336
    'fallback': {'inputs': 163, 'outputs': 1127},                                        # 318
    'final': [282, 282, 282, 281],                                                       # 319-322
    'invocations': 100,                                                                  # 292, 343-345
    'sha256': {                                                                          # 369-376
        'centers.txt': 'c48bc9a2be1eb2cdeea82ea1b030d7cb9f00a6c9563b63f0248dd115748a5789',
        'coarse0.bin': '77b0cda59484ffde0654db8d6008bcaab1daf1deefd00d4dc085d3d751418cd4',
        'coarse1.bin': '48ca7775dba57a87a10d154da8b172074b29c9a65b32e44ee169f23a48d24b8a',
        'coarse2.bin': '418b6d9cf338187c63635d26050940a13177515050a057b2bc67fd11a163e43e',
        'coarse3.bin': '8c23427e63e31cd18abbb80838e3289e646fd108fa850687ca7b857471376535',
        'mid.bin': 'e97c74dde90a0e758df2cb5d9708f5bd6bd660ed920b3299f5df92ff4de11be4',
        'fine.bin': '9b5b743b61907277fa6687a0ad45677bbcd0e4c9bd44a0d93d258253fb52923d',
        'fb1.bin': 'ef85ec73217ecb0c770d3c775396df88b60ca06918f77310df5dff2f6d9bf215',
    },
}
# the schedule (VERIFY.md 'Mathematical run schedule'; execution.tex 124-134 and 108-113)
C_ARGS = ['12', '4', '1', '.042', '1', '1', '5000000']
A_GLOBAL_TARGET = 0.125          # execution.tex 113: A's global target .125, the coarse radius bound
B_TARGETS = {'Bmid': 0.07, 'Bfine': 0.016, 'C.Bfallback': 0.011}
MAX_K, MAX_COUNT = 10, 2000000   # execution.tex 216-217: Root dimension at most 10; record file counts capped at 2,000,000


def sha(b):
    return hashlib.sha256(b).hexdigest()


# ---- bytes ----------------------------------------------------------------------------------------------------------
class Store:
    """the release's bytes at the pin, each checked against the manifest; `over` replaces or removes files (red controls)"""

    def __init__(self, manifest, over=None, base=None):
        self.m = manifest
        self.over = over or {}
        self.base = base
        self.cache = {} if base is None else base.cache

    def _raw(self, rel):
        if rel in self.cache:
            return self.cache[rel]
        want = self.m['files'].get(rel)
        if want is None:
            raise KeyError(rel)
        b = None
        head = _clone_head()
        if head == PIN and os.path.isfile(os.path.join(CLONE, rel)):
            with open(os.path.join(CLONE, rel), 'rb') as f:
                b = f.read()
        else:
            cp = os.path.join(CACHE, rel)
            if os.path.isfile(cp):
                with open(cp, 'rb') as f:
                    b = f.read()
            if b is None or sha(b) != want['sha256']:
                url = 'https://raw.githubusercontent.com/openai/math/' + PIN + '/' + '/'.join(urllib.request.quote(p) for p in rel.split('/'))
                with urllib.request.urlopen(url, timeout=120) as r:
                    b = r.read()
                os.makedirs(os.path.dirname(cp), exist_ok=True)
                with open(cp, 'wb') as f:
                    f.write(b)
        if sha(b) != want['sha256'] or len(b) != want['bytes']:
            raise SystemExit('MUB6 RECORDS REFUSED: ' + rel + ' differs from the pinned manifest')
        self.cache[rel] = b
        return b

    def exists(self, rel):
        if rel in self.over:
            return self.over[rel] is not None
        return rel in self.m['files']

    def get(self, rel):
        if rel in self.over:
            if self.over[rel] is None:
                raise KeyError(rel)
            return self.over[rel]
        return self._raw(rel)

    def names(self, prefix):
        out = {k for k in self.m['files'] if k.startswith(prefix)}
        for k, v in self.over.items():
            if k.startswith(prefix):
                (out.add if v is not None else out.discard)(k)
        return sorted(out)


def _clone_head():
    try:
        with open(os.path.join(CLONE, '.git', 'HEAD')) as f:
            h = f.read().strip()
        if h.startswith('ref: '):
            with open(os.path.join(CLONE, '.git', h[5:])) as f:
                h = f.read().strip()
        return h
    except OSError:
        return None


# ---- the record format (execution.tex 48-61) ------------------------------------------------------------------------
TAIL = ('C', 'n0', 'id', 'ort', 'hor', 'mnorm', 'froot', 'r')


def parse_bin(b):
    """(count, [(k, record bytes, tail dict)], error or None) — never raises on malformed input"""
    if len(b) < 8:
        return None, [], 'shorter than the eight-byte count'
    n = struct.unpack_from('<Q', b, 0)[0]
    if n > MAX_COUNT:
        return n, [], 'declared count %d above the stated cap %d' % (n, MAX_COUNT)
    off, recs = 8, []
    for i in range(n):
        if off + 4 > len(b):
            return n, recs, 'record %d: the file ends inside k' % i
        k = struct.unpack_from('<i', b, off)[0]
        if not 0 <= k <= MAX_K:
            return n, recs, 'record %d: k = %d outside 0..%d' % (i, k, MAX_K)
        size = 356 + 288 * k
        if off + size > len(b):
            return n, recs, 'record %d: the file ends inside the record (needs %d bytes)' % (i, size)
        vals = struct.unpack_from('<%dd' % (36 + 36 * k + 8), b, off + 4)
        if not all(math.isfinite(v) for v in vals):
            return n, recs, 'record %d: a non-finite field' % i
        tail = dict(zip(TAIL, vals[-8:]))
        if not tail['r'] > 0:
            return n, recs, 'record %d: radius %r not positive' % (i, tail['r'])
        recs.append((k, b[off:off + size], tail))
        off += size
    if off != len(b):
        return n, recs, 'the declared count ends at byte %d of %d' % (off, len(b))
    return n, recs, None


def last_line(text):
    lines = [l for l in text.splitlines() if l.strip()]
    return lines[-1] if lines else ''


# ---- the checks -----------------------------------------------------------------------------------------------------
_PARSED = {}


def run_checks(st):
    rows = []

    def check(cid, what, ok, detail=''):
        rows.append({'id': cid, 'what': what, 'pass': bool(ok), 'detail': detail})
        return ok

    D = EXE + '/data/'
    try:
        cmds = json.loads(st.get(EXE + '/commands.json').decode('utf-8'))['children']
    except Exception as e:  # noqa: BLE001 — a missing or malformed command file is a failed check, not a crash
        check('X1', 'the command record parses', False, repr(e))
        return rows, {}
    res = {}
    for k in cmds:
        p = EXE + '/results/' + k + '.txt'
        res[k] = st.get(p).decode('utf-8') if st.exists(p) else None
    parsed = {}

    def records(name):
        if name not in parsed:
            if not st.exists(D + name):
                parsed[name] = (None, [], 'missing')
            else:
                b = st.get(D + name)
                hit = _PARSED.get((name, id(b)))
                if hit is None or hit[0] is not b:   # the same bytes object parses once across the red controls
                    hit = _PARSED[(name, id(b))] = (b, parse_bin(b))
                parsed[name] = hit[1]
        return parsed[name]

    # X — the invocations
    stages = {}
    for k, v in cmds.items():
        stages.setdefault(v.get('stage'), []).append(k)
    want_stages = {'cov': 1, 'A': 4, 'Bmid': 1, 'Bfine': 1, 'C.initial': 88, 'C.fallback': 1, 'C.final': 4}
    check('X1', 'exactly 100 invocations: 1 cover, 4 A, 2 B, 88 initial C, 1 fallback B, 4 final C',
          len(cmds) == STATED['invocations'] and {s: len(v) for s, v in stages.items()} == want_stages,
          '%d invocations, by stage %s' % (len(cmds), json.dumps({s: len(v) for s, v in sorted(stages.items(), key=lambda x: str(x[0]))})))
    bad = [k for k, v in cmds.items() if v.get('completed') is not True or v.get('stderr_empty') is not True]
    check('X2', 'every invocation completed, with an empty stderr', not bad, ', '.join(sorted(bad)))
    missing_res = sorted(k for k in cmds if res[k] is None)
    extra_res = sorted(set(os.path.basename(p)[:-4] for p in st.names(EXE + '/results/')) - set(cmds))
    check('X3', 'one result file per invocation, and no other', not missing_res and not extra_res, 'missing %s; extra %s' % (missing_res, extra_res))

    argv = {k: v.get('argv') for k, v in cmds.items()}
    sched_bad = []
    if argv.get('covrun') != ['./build/covrun', 'centers.txt']:
        sched_bad.append('covrun')
    for i in range(4):
        if argv.get('A%d' % i) != ['./build/arun', 'centers.txt', str(i), '4', 'coarse%d.bin' % i, 'bad%d.txt' % i]:
            sched_bad.append('A%d' % i)
    if argv.get('Bmid') != ['./build/brun', '.07', '.013', 'mid.bin', 'midbad.bin', '-', 'coarse0.bin', 'coarse1.bin', 'coarse2.bin', 'coarse3.bin']:
        sched_bad.append('Bmid')
    if argv.get('Bfine') != ['./build/brun', '.016', '.005', 'fine.bin', 'finebad.bin', 'batches/f', 'mid.bin']:
        sched_bad.append('Bfine')
    initial = sorted((k for k in cmds if cmds[k].get('stage') == 'C.initial'), key=lambda k: int(re.sub(r'\D', '', k) or -1))
    for j, k in enumerate(initial):
        if k != 'C.batch%d' % j or argv[k] != ['./build/crun'] + C_ARGS + ['0', '1', 'batches/bad%d.bin' % j, 'batches/f%d.bin' % j]:
            sched_bad.append(k)
    for i in range(4):
        if argv.get('C.final%d' % i) != ['./build/crun'] + C_ARGS + [str(i), '4', 'fb1cbad%d.bin' % i, 'fb1.bin']:
            sched_bad.append('C.final%d' % i)
    fb = argv.get('C.Bfallback') or []
    if fb[:6] != ['./build/brun', '.011', '.0038', 'fb1.bin', 'fb1bad.bin', '-']:
        sched_bad.append('C.Bfallback')
    check('X4', 'every argv is the stated schedule (cover; A i of 4; B mid .07 .013 on the coarse files in part order; B fine '
          '.016 .005 into batches/f; C 12 4 1 .042 1 1 5000000 0 1 per batch; B fallback .011 .0038; final C i of 4)', not sched_bad, ', '.join(sched_bad))

    # S — the cover
    cb = st.get(D + 'centers.txt') if st.exists(D + 'centers.txt') else b''
    hit = _PARSED.get(('centers.txt', id(cb)))
    if hit is None or hit[0] is not cb:
        clines = cb.decode('ascii').split('\n')
        body = [l for l in clines[1:] if l.strip()]
        hit = _PARSED[('centers.txt', id(cb))] = (cb, (clines[0].split() if clines else [], len(body),
                                                      sum(1 for l in body if len(l.split()) != 10 or not all(t.lstrip('-').isdigit() for t in l.split()))))
    head, n_body, nonint = hit[1]
    body = range(n_body)
    cov = res.get('covrun') or ''
    mcov = re.search(r'checked(\d+) centers(\d+)', cov)
    mxs = re.search(r'^xs (\d+)$', cov, re.M)
    n_centers = len(body)
    check('S1', 'centers.txt is complete: its header count equals its center lines, ten integers each',
          len(head) == 2 and head[1].isdigit() and int(head[1]) == n_centers and nonint == 0 and cmds.get('covrun', {}).get('returncode') == 0,
          'header %s, %d lines, %d malformed' % (' '.join(head), n_centers, nonint))
    check('S2', 'the cover\'s own counters: centers written = centers.txt, completed_write printed',
          bool(mcov) and int(mcov.group(2)) == n_centers and 'completed_write' in cov,
          (mcov.group(0) if mcov else 'no counter line') + ('; xs ' + mxs.group(1) if mxs else ''))

    # A — the four shards
    a_counts, a_bad = [], []
    for i in range(4):
        n, recs, err = records('coarse%d.bin' % i)
        expect = len(range(i, n_centers, 4))
        m = re.fullmatch(r'total done(\d+) global(\d+) failedBalls(\d+)', last_line(res.get('A%d' % i) or ''))
        bt = st.get(D + 'bad%d.txt' % i) if st.exists(D + 'bad%d.txt' % i) else None
        ok = (err is None and m is not None and int(m.group(1)) == expect and int(m.group(2)) == n and int(m.group(3)) == 0
              and bt == b'' and cmds.get('A%d' % i, {}).get('returncode') == 0
              and all(t['r'] <= A_GLOBAL_TARGET for _, _, t in recs))
        if not ok:
            a_bad.append('A%d: %s; result %r; bad file %s' % (i, err or 'parsed', last_line(res.get('A%d' % i) or ''), 'empty' if bt == b'' else 'absent or nonempty'))
        a_counts.append(n)
    check('A1', 'the four A shards: part i processes exactly the centers = i (mod 4), terminal failedBalls0, logged global = saved '
          'records, radius at most the global target .125, exit 0, empty bad text file', not a_bad, ' | '.join(a_bad) or 'saved %s' % a_counts)

    # B — mid and fine
    def b_result(key):
        return re.fullmatch(r'result (\d+) bad (\d+) parent(\d+) .*\bbad(\d+) fail(\d+) .*', last_line(res.get(key) or ''))

    b_rows = []
    for key, inputs, out, badf in (('Bmid', ['coarse%d.bin' % i for i in range(4)], 'mid.bin', 'midbad.bin'),
                                   ('Bfine', ['mid.bin'], 'fine.bin', 'finebad.bin')):
        parents = sum((records(x)[0] or 0) for x in inputs)
        n, recs, err = records(out)
        nb, _, errb = records(badf)
        m = b_result(key)
        ok = (err is None and errb is None and m is not None and int(m.group(1)) == n and int(m.group(2)) == 0 and int(m.group(3)) == parents
              and int(m.group(5)) == 0 and nb == 0 and len(st.get(D + badf)) == 8 and cmds.get(key, {}).get('returncode') == 0
              and all(t['r'] <= B_TARGETS[key] for _, _, t in recs))
        b_rows.append((key, ok, '%s: %d parents -> %s saved records, bad file count %s%s' % (key, parents, n, nb, '' if ok else '; ' + (err or errb or 'result ' + last_line(res.get(key) or '')))))
    check('B1', 'B mid and B fine: every parent processed, logged output = saved records, zero saved failures (an eight-byte bad '
          'file), every output radius at most its target, exit 0', all(o for _, o, _ in b_rows), ' | '.join(d for _, _, d in b_rows))

    # the batches
    fine_n, fine_recs, _ = records('fine.bin')
    batch_names = [os.path.basename(p) for p in st.names(D + 'batches/') if re.fullmatch(r'f\d+\.bin', os.path.basename(p))]
    nbat = len(batch_names)
    expect_names = ['f%d.bin' % j for j in range(nbat)]
    cat, sizes, berr = [], [], []
    for j in range(nbat):
        n, recs, err = records('batches/f%d.bin' % j)
        if err:
            berr.append('f%d: %s' % (j, err))
        sizes.append(n or 0)
        cat.extend(recs)
    marker = (st.get(D + 'batches/fdone.txt').decode('ascii').split() if st.exists(D + 'batches/fdone.txt') else [])
    groups_ok = all(s == 256 for s in sizes[:-1]) and (0 < sizes[-1] <= 256 if sizes else False)
    check('B2', 'the batches are consecutive groups of at most 256 (every one full but the last), named f0..f%d, and the '
          'completion marker agrees with both the number of batches and the sum of their counts' % (nbat - 1),
          sorted(batch_names, key=lambda s: int(s[1:-4])) == expect_names and groups_ok and not berr and marker == [str(nbat), str(sum(sizes))],
          'marker %s; %d batches, sizes %s; %s' % (' '.join(marker), nbat, (str(sizes[:2])[:-1] + ', ..., ' + str(sizes[-1]) + ']') if sizes else '[]', '; '.join(berr) or 'all parse'))
    mism = []
    if len(cat) != len(fine_recs):
        mism.append('%d batch records vs %d in fine.bin' % (len(cat), len(fine_recs)))
    target = struct.pack('<d', 0.016)
    for i, ((k1, r1, t1), (k2, r2, t2)) in enumerate(zip(cat, fine_recs)):
        if r1[:-8] != r2[:-8]:
            mism.append('record %d differs before the radius' % i)
        elif r1[-8:] != target or not t2['r'] <= 0.016:
            mism.append('record %d: batch radius %r, fine radius %r' % (i, t1['r'], t2['r']))
        if len(mism) > 3:
            break
    check('B3', 'the concatenation of the batches equals fine.bin record for record, byte for byte, except the radius, which is '
          'the target .016 in every batch record and at least the original', not mism, '; '.join(mism) or '%d records compared' % len(cat))

    # C — the initial batches
    c_bad, c_seq, c_total, c_cap, exits = [], [], 0, 0, {0: 0, 1: 0}
    nonempty = []
    for j in range(nbat):
        key = 'C.batch%d' % j
        n, recs, _ = records('batches/f%d.bin' % j)
        nb, brecs, errb = records('batches/bad%d.bin' % j)
        m = re.fullmatch(r'result done(\d+) bad(\d+) \(graph(\d+) cap(\d+) over(\d+) cluster(\d+)\)', last_line(res.get(key) or ''))
        rc = cmds.get(key, {}).get('returncode')
        if rc in exits:
            exits[rc] += 1
        problems = []
        if errb:
            problems.append('bad file: ' + errb)
        if not m:
            problems.append('no result line')
        else:
            done, b, g, c, o, u = (int(x) for x in m.groups())
            if done != n:
                problems.append('done %d != batch %s' % (done, n))
            if b != nb:
                problems.append('logged bad %d != saved %s' % (b, nb))
            if g + c + o + u != b:
                problems.append('categories sum %d != bad %d' % (g + c + o + u, b))
            if rc != (0 if b == 0 else 1):
                problems.append('exit %s with bad %d' % (rc, b))
            c_total += b
            c_cap += c
        if nb and nb > 0:
            nonempty.append('bad%d.bin' % j)
        # an unchanged, ordered subsequence of the batch's records
        it = iter(r for _, r, _ in recs)
        if not all(any(br == r for r in it) for _, br, _ in brecs):
            c_seq.append(key + ': a saved failure is not an unchanged, ordered subsequence of its batch')
        if problems:
            c_bad.append(key + ': ' + ', '.join(problems))
    check('C1', 'every initial C batch processed once: done = its batch count, logged bad = saved bad, the four categories sum to '
          'it, exit 0 exactly when bad = 0 and 1 exactly when bad > 0', not c_bad,
          ' | '.join(c_bad[:4]) or '%d batches; %d unresolved (%d graph caps); exits 0/1: %d/%d' % (nbat, c_total, c_cap, exits[0], exits[1]))
    check('C2', 'every saved initial C failure is an unchanged, ordered subsequence of its batch',
          not c_seq, ' | '.join(c_seq[:4]) or '%d failures in %d files' % (c_total, len(nonempty)))

    # F — the fallback
    order = sorted(nonempty)   # ASCII (C-locale) filename order
    fb_inputs = [os.path.basename(x) for x in fb[6:]]
    parents = sum((records('batches/' + x)[0] or 0) for x in fb_inputs)
    n, recs, err = records('fb1.bin')
    nb, _, errb = records('fb1bad.bin')
    m = b_result('C.Bfallback')
    check('F1', 'the fallback B takes exactly the nonempty initial bad files, in ASCII filename order, processes every parent '
          '(= every unresolved record), saves zero failures, every output radius at most its target .011, exit 0',
          fb_inputs == order and all(x.startswith('batches/') for x in fb[6:]) and parents == c_total and err is None and errb is None
          and m is not None and int(m.group(1)) == n and int(m.group(2)) == 0 and int(m.group(3)) == parents and int(m.group(5)) == 0
          and nb == 0 and cmds.get('C.Bfallback', {}).get('returncode') == 0 and all(t['r'] <= B_TARGETS['C.Bfallback'] for _, _, t in recs),
          'inputs %s; parents %d -> %s records; bad file count %s' % (' '.join(fb_inputs), parents, n, nb))

    # G — final C
    g_bad, g_done = [], []
    for i in range(4):
        key = 'C.final%d' % i
        expect = len(range(i, n or 0, 4))
        m = re.fullmatch(r'result done(\d+) bad(\d+) \(graph(\d+) cap(\d+) over(\d+) cluster(\d+)\)', last_line(res.get(key) or ''))
        nb, _, errb = records('fb1cbad%d.bin' % i)
        ok = (m is not None and int(m.group(1)) == expect and int(m.group(2)) == 0 and sum(int(x) for x in m.groups()[2:]) == 0
              and errb is None and nb == 0 and cmds.get(key, {}).get('returncode') == 0)
        g_done.append(int(m.group(1)) if m else None)
        if not ok:
            g_bad.append('%s: result %r, saved bad %s%s' % (key, last_line(res.get(key) or ''), nb, ' (' + errb + ')' if errb else ''))
    check('G1', 'final C: part i processes exactly the fallback records = i (mod 4), the four parts partition all of them without '
          'omission, every exit 0, zero failures logged and saved (eight-byte bad files)',
          not g_bad and sum(x or 0 for x in g_done) == (n or 0), ' | '.join(g_bad) or 'done %s of %s' % (g_done, n))

    # every data file accounted for
    expected_files = ({'centers.txt', 'mid.bin', 'midbad.bin', 'fine.bin', 'finebad.bin', 'fb1.bin', 'fb1bad.bin', 'batches/fdone.txt'}
                      | {'coarse%d.bin' % i for i in range(4)} | {'bad%d.txt' % i for i in range(4)} | {'fb1cbad%d.bin' % i for i in range(4)}
                      | {'batches/f%d.bin' % j for j in range(nbat)} | {'batches/bad%d.bin' % j for j in range(nbat)})
    have = {p[len(D):] for p in st.names(D)}
    check('X5', 'the data directory holds exactly the files the schedule writes', have == expected_files,
          'missing %s; unexpected %s' % (sorted(expected_files - have)[:6], sorted(have - expected_files)[:6]))

    # the sources' identity: execution.tex 17-21 lists seven files whose lengths and digests are in verification/code/extraction.json;
    # the shipped copies are hashed here as bytes (never opened as code, never compiled)
    ext_p = PAPER + '/verification/code/extraction.json'
    try:
        ext = json.loads(st.get(ext_p).decode('utf-8'))['files']
        src_bad = []
        for e in ext:
            p = SAVED + '/compiled-build/source/' + e['file']
            if not st.exists(p):
                src_bad.append(e['file'] + ' not shipped')
            else:
                b = st.get(p)
                if len(b) != e['bytes'] or sha(b) != e['sha256']:
                    src_bad.append(e['file'] + ' differs')
        names = sorted(e['file'] for e in ext)
        check('X6', 'the seven C++ sources the manuscript names are shipped in compiled-build/source with the lengths and sha256 digests '
              'verification/code/extraction.json lists (hashed as bytes, never opened or compiled)',
              names == sorted(['seed.cpp', 'covout.cpp', 'ub.cpp', 'patchx.cpp', 'atlas.cpp', 'stageB.cpp', 'stageC.cpp']) and not src_bad,
              '; '.join(src_bad) or ', '.join(names))
    except KeyError as e:
        check('X6', 'the seven C++ sources match verification/code/extraction.json', False, 'missing ' + str(e))

    # T — what the manuscript prints
    t_bad = []
    got = {
        'cover': {'pairs': int(mcov.group(1)) if mcov else None, 'centers': n_centers, 'xs': int(mxs.group(1)) if mxs else None},
        'A': {'inputs': [len(range(i, n_centers, 4)) for i in range(4)], 'outputs': a_counts},
        'Bmid': {'inputs': sum(x or 0 for x in a_counts), 'outputs': records('mid.bin')[0]}, 'Bfine': {'inputs': records('mid.bin')[0], 'outputs': fine_n},
        'batches': {'count': nbat, 'full': sum(1 for s in sizes if s == 256), 'size': 256, 'last': sizes[-1] if sizes else None},
        'initialC': {'inputs': sum(sizes), 'unresolved': c_total, 'allGraphCaps': c_cap == c_total, 'exit0': exits[0], 'exit1': exits[1]},
        'fallbackOrder': fb_inputs, 'fallback': {'inputs': parents, 'outputs': n}, 'final': g_done, 'invocations': len(cmds),
    }
    for k, v in got.items():
        if STATED[k] != v:
            t_bad.append('%s: stated %s, records %s' % (k, json.dumps(STATED[k]), json.dumps(v)))
    check('T1', 'every count the manuscript prints (Table execute:counts, the batch arithmetic 87 x 256 + 107, the fallback order) '
          'is the count the records give', not t_bad, ' | '.join(t_bad))
    h_bad = [f for f, h in STATED['sha256'].items() if not st.exists(D + f) or sha(st.get(D + f)) != h]
    check('T2', 'the eight principal data files have the sha256 digests the manuscript prints (Table execute:hashes)', not h_bad, ', '.join(h_bad))
    parse_errs = sorted(k + ': ' + v[2] for k, v in parsed.items() if v[2] and v[2] != 'missing')
    check('P1', 'every record file read parses: count, k in 0..10, 356 + 288k bytes per record, finite fields, positive radius, '
          'the declared count reaching the exact end of file', not parse_errs, ' | '.join(parse_errs[:4]) or '%d files, %d records' % (len(parsed), sum(len(v[1]) for v in parsed.values())))
    return rows, got


# ---- red controls ---------------------------------------------------------------------------------------------------
def red_controls(base):
    D = EXE + '/data/'
    cmds = json.loads(base.get(EXE + '/commands.json').decode('utf-8'))

    def cmds_without(key):
        c = json.loads(json.dumps(cmds))
        del c['children'][key]
        return json.dumps(c).encode()

    def cmds_fallback_drop(name):
        c = json.loads(json.dumps(cmds))
        a = c['children']['C.Bfallback']
        a['argv'] = [x for x in a['argv'] if x != 'batches/' + name]
        a['inputs'] = [x for x in a['inputs'] if x != 'batches/' + name]
        return json.dumps(c).encode()

    def rec_bytes(name):
        return parse_bin(base.get(D + name))[1]

    def rebuild(recs):
        return struct.pack('<Q', len(recs)) + b''.join(recs)

    f10 = [r for _, r, _ in rec_bytes('batches/f10.bin')]
    f11 = [r for _, r, _ in rec_bytes('batches/f11.bin')]
    bad3 = [r for _, r, _ in rec_bytes('batches/bad3.bin')]
    f1 = [r for _, r, _ in rec_bytes('batches/f1.bin')]
    planted = rec_bytes('fb1.bin')[0][1]
    enlarged = f1[0][:-8] + struct.pack('<d', 0.017)
    fine = base.get(D + 'fine.bin')
    plans = [
        ('dropped A shard', 'coarse2.bin removed', {D + 'coarse2.bin': None}, ['A1']),
        ('dropped A command', 'the A3 invocation removed from commands.json', {EXE + '/commands.json': cmds_without('A3')}, ['X1']),
        ('record moved between batches', 'the last record of f10 and the first of f11 exchanged (counts unchanged)',
         {D + 'batches/f10.bin': rebuild(f10[:-1] + [f11[0]]), D + 'batches/f11.bin': rebuild([f10[-1]] + f11[1:])}, ['B3']),
        ('saved failures reordered', 'the two saved failures of bad3.bin swapped', {D + 'batches/bad3.bin': rebuild(bad3[::-1])}, ['C2']),
        ('fallback input dropped', 'batches/bad84.bin removed from the fallback\'s inputs', {EXE + '/commands.json': cmds_fallback_drop('bad84.bin')}, ['F1']),
        ('final C failure planted', 'one fallback record saved as a final C1 failure', {D + 'fb1cbad1.bin': rebuild([planted])}, ['G1']),
        ('truncated file', 'the last byte of fine.bin cut', {D + 'fine.bin': fine[:-1]}, ['P1']),
        ('batch radius enlarged', 'the radius of f1\'s first record set to .017', {D + 'batches/f1.bin': rebuild([enlarged] + f1[1:])}, ['B3']),
    ]
    out = []
    for name, mutation, over, must in plans:
        rows, _ = run_checks(Store(base.m, over=over, base=base))
        failed = [r['id'] for r in rows if not r['pass']]
        out.append({'control': name, 'mutation': mutation, 'mustFail': must, 'failed': failed, 'fired': all(m in failed for m in must)})
    return out


# ---- the manifest and the ledger ------------------------------------------------------------------------------------
def pin_files():
    if _clone_head() != PIN:
        raise SystemExit('MUB6 RECORDS REFUSED: --pin-files needs the clone at ' + PIN + ' (MATH_CLONE)')
    files = {}
    roots = [os.path.join(CLONE, SAVED), os.path.join(CLONE, PAPER, 'build', 'sections', 'execution.tex'), os.path.join(CLONE, PAPER, 'README.md'),
             os.path.join(CLONE, PAPER, 'verification', 'code', 'extraction.json')]
    for r in roots:
        walk = [(os.path.dirname(r), [], [os.path.basename(r)])] if os.path.isfile(r) else os.walk(r)
        for d, _, fs in walk:
            for f in fs:
                p = os.path.join(d, f)
                with open(p, 'rb') as fh:
                    b = fh.read()
                files[os.path.relpath(p, CLONE)] = {'bytes': len(b), 'sha256': sha(b)}
    m = {'what': 'The N(6) = 3 saved run of openai/math at ' + PIN + ' (published 2026-10-26), every file pinned by sha256: '
                 'verification/saved-run (VERIFY.md, execution/{commands.json, results, data}, the release\'s check_records.py and '
                 'compiled-build sources — those two pinned as bytes only, never opened or run here), the manuscript\'s '
                 'build/sections/execution.tex and README.md. The bytes are Apache-2.0 (openai/math LICENSE) and are not copied: '
                 'they resolve at https://github.com/openai/math/blob/' + PIN + '/<path>. Read by tools/check-openai-math-mub6.py.',
         'repository': 'https://github.com/openai/math', 'commit': PIN, 'count': len(files), 'totalBytes': sum(v['bytes'] for v in files.values()),
         'files': dict(sorted(files.items()))}
    os.makedirs(os.path.dirname(MANIFEST), exist_ok=True)
    with open(MANIFEST, 'w') as f:
        json.dump(m, f, indent=1, ensure_ascii=False)
        f.write('\n')
    return m


def build():
    with open(MANIFEST) as f:
        m = json.load(f)
    st = Store(m)
    rows, got = run_checks(st)
    reds = red_controls(st)
    all_pass = all(r['pass'] for r in rows)
    all_fire = all(r['fired'] for r in reds)
    word = 'CERTIFIED' if all_pass and all_fire else ('REFUSED' if not all_fire else 'REFUTED')
    return {
        'what': 'The N(6) = 3 saved run (openai/math family 266), its records\' consistency and coverage decided by an independent '
                'standard-library reader written from VERIFY.md and execution.tex (tools/check-openai-math-mub6.py; the release\'s '
                'check_records.py never opened, no C++ compiled). The audit\'s F-532 was NEEDS DATA (the code and data were absent); '
                'the artifacts were published on 2026-10-26.',
        'release': PIN, 'manifest': os.path.relpath(MANIFEST, ROOT), 'writtenFrom': {k: {'path': v, 'sha256': m['files'][v]['sha256']} for k, v in STATED['source'].items()},
        'neverOpenedAsCode': {p: m['files'][p]['sha256'] for p in sorted(m['files']) if p.endswith('check_records.py') or '/compiled-build/' in p},
        'neverOpenedAsCodeNote': 'the release\'s checker and build files: pinned by sha256; check_records.py and build.sh never read, the seven C++ sources hashed (check X6) and never opened or compiled',
        'word': word,
        'decides': 'the manuscript\'s terminal conditions read off the saved records: every record file parses to its exact end, the '
                   '100 invocations are the stated schedule and all completed, the A shards cover the centers modulo four with no '
                   'unresolved seed, both B refinements process every parent with no failure, the batches are fine.bin record for '
                   'record (radius enlarged to .016), every initial C failure is saved, in order, unchanged, and enters the fallback, '
                   'and the four final C parts partition the fallback output with no unresolved record; the printed counts and '
                   'hashes are those of the records',
        'doesNotDecide': 'that N(6) = 3. The records record a search; the manuscript\'s finite-execution theorem turns them into a '
                         'proof only under hypotheses this reader does not touch: the seed cover covers (Proposition seed:cover), each '
                         'A, B and C rejection is justified by its lemma under the binary64 model, the seven C++ files implement those '
                         'lemmas, the compiled build obeyed the arithmetic model, and these bytes are what those programs wrote (the '
                         'release says itself: "a numerical consistency check, not an authentication of the historical archive, a proof '
                         'of the C++ implementation, or a verification of compiler and hardware behavior"). Independent re-runs of the '
                         'search from the paper\'s text exist (maximusrufus, Jaswal); they are their authors\' results.',
        'checks': rows,
        'counts': got,
        'redControls': reds,
        'summary': {'checks': len(rows), 'passed': sum(r['pass'] for r in rows), 'redControls': len(reds), 'fired': sum(r['fired'] for r in reds)},
    }


def main():
    args = sys.argv[1:]
    if '--pin-files' in args:
        m = pin_files()
        print('corpus/openai-math/mub6-7ef5c0cc/files.json: %d files, %d bytes' % (m['count'], m['totalBytes']))
    led = build()
    text = json.dumps(led, indent=1, ensure_ascii=False) + '\n'
    s = led['summary']
    line = 'N(6) saved run at %s: %s — %d/%d checks pass, %d/%d red controls fire' % (PIN[:8], led['word'], s['passed'], s['checks'], s['fired'], s['redControls'])
    if '--check' in args:
        with open(OUT) as f:
            old = f.read()
        if old != text:
            print('MUB6 RECORDS CHECK FAILED: the re-derived ledger differs from ' + os.path.relpath(OUT, ROOT))
            sys.exit(1)
        if led['word'] != 'CERTIFIED':
            print('MUB6 RECORDS CHECK FAILED: ' + line)
            sys.exit(1)
        print('PASS ' + line)
        return
    with open(OUT, 'w') as f:
        f.write(text)
    print(line)
    for r in led['checks']:
        print('  %s %-3s %s' % ('PASS' if r['pass'] else 'FAIL', r['id'], r['detail'][:150]))
    for r in led['redControls']:
        print('  red %-5s %-32s failed %s' % ('FIRED' if r['fired'] else 'QUIET', r['control'], r['failed']))


if __name__ == '__main__':
    main()
