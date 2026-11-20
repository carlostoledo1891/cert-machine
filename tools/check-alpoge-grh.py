#!/usr/bin/env python3
"""check-alpoge-grh.py — the record of the decision of Alpöge's Lean release (2026-11-20), derived ONLY from the pod's
pulled results (corpus/alpoge-grh/runs/<run>/) and the pinned readings (corpus/alpoge-grh/readings.json), by the rules
of notes/alpoge-grh-preregistration-2026-11-20.md.

  python3 -I tools/check-alpoge-grh.py --write   write certs/alpoge-grh-lean.json
  python3 -I tools/check-alpoge-grh.py --check   re-derive it and refuse on any difference (the battery)
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'runs')
OUT = os.path.join(ROOT, 'certs', 'alpoge-grh-lean.json')
PINS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'PINS.json')
READINGS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'readings.json')
THEOREMS = ['riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re',
            'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive']
STANDARD = {'propext', 'Classical.choice', 'Quot.sound'}


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def rd(run, name, default=None):
    p = os.path.join(run, name)
    return open(p, encoding='utf-8', errors='replace').read() if os.path.exists(p) else default


def ex(run, step):
    v = rd(run, step + '.exit')
    return None if v is None else int(v.strip())


def secs(run, step):
    a, b = rd(run, step + '.start'), rd(run, step + '.end')
    return None if a is None or b is None else int(b) - int(a)


def peak_rss_gb(run, step):
    m = re.search(r'Maximum resident set size \(kbytes\): (\d+)', rd(run, step + '.err', '') or '')
    return None if not m else round(int(m.group(1)) / 1048576, 1)


def row(id_, verdict, why, **kw):
    r = {'id': id_, 'verdict': verdict, 'why': why}
    r.update({k: v for k, v in kw.items() if v is not None})
    return r


def derive(run):
    pins = json.load(open(PINS))
    rows = []
    # I1
    i1 = rd(run, 'I1.txt', '')
    ok = 'I1 PASS' in i1 and i1.count('MATCH') >= 15 and 'MISMATCH' not in i1
    rows.append(row('I1', 'CERTIFIED' if ok else 'REFUTED', 'the 14 parts fetched on the pod against PINS.json; joined sha256 '
                    + pins['archive']['sha256'] if ok else 'a part or the joined archive differs from its pin'))
    # B1
    b1 = ex(run, 'B1')
    prog = rd(run, 'B1.progress', '') or ''
    sorry = prog.count("declaration uses 'sorry'")
    built = re.findall(r'Build completed successfully \((\d+) jobs\)', prog)
    if b1 == 0 and built and sorry == 0:
        v, why = 'CERTIFIED', f'lake build of the default targets exited 0 ({built[-1]} jobs), no sorry warning'
    elif b1 == 124:
        v, why = 'REFUSED', 'the build hit its time limit'
    elif b1 is None:
        v, why = 'REFUSED', 'no build result pulled'
    else:
        v, why = 'REFUTED', f'the build exited {b1} (sorry warnings: {sorry})'
    rows.append(row('B1', v, why, seconds=secs(run, 'B1'), peak_rss_gb=peak_rss_gb(run, 'B1')))
    # A1
    a1 = rd(run, 'A1.out', '') or ''
    found = {}
    for t in THEOREMS:
        m = re.search(r"'" + re.escape(t) + r"' depends on axioms: \[([^\]]*)\]", a1)
        found[t] = None if not m else sorted(x.strip() for x in m.group(1).split(',') if x.strip())
    if ex(run, 'A1') == 0 and all(found[t] is not None and set(found[t]) <= STANDARD for t in THEOREMS):
        v, why = 'CERTIFIED', 'each of the five theorems depends only on propext, Classical.choice, Quot.sound'
    elif any(found[t] is not None and not set(found[t]) <= STANDARD for t in THEOREMS):
        v, why = 'REFUTED', 'a theorem depends on a non-standard axiom'
    else:
        v, why = 'REFUSED', 'the axiom report was not produced for every theorem'
    rows.append(row('A1', v, why, axioms=found))
    # S1 and the controls
    mode = (rd(run, 'S1.mode', '') or '').strip() or None
    s1 = rd(run, 'S1.out', '') or ''
    s1ok = ex(run, 'S1') == 0 and 'Your solution is okay!' in s1 and 'Lean default kernel accepts the solution' in s1
    ch0 = rd(run, 'challenge-build.sha256', '')
    ch1 = rd(run, 'challenge-build.before-S1.sha256', '')
    same = bool(ch0) and bool(ch1) and all(l in ch0 for l in ch1.splitlines() if l.strip())
    if s1ok and same:
        v, why = 'CERTIFIED', 'Comparator accepted Main against cert-machine\'s challenge (five theorems, four definitions, three axioms); the challenge build unchanged since before B1'
    elif ex(run, 'S1') is None:
        v, why = 'REFUSED', 'Comparator did not run'
    elif ex(run, 'S1') == 124 or 'out of memory' in s1.lower():
        v, why = 'REFUSED', 'Comparator stopped on resources'
    elif not same:
        v, why = 'REFUSED', 'the challenge build changed before S1, so the judge\'s premise failed'
    else:
        v, why = 'REFUTED', 'Comparator rejected the release against the challenge'
    rows.append(row('S1', v, why, mode=mode, seconds=secs(run, 'S1')))
    ctl = {}
    for c, want in [('C1', 'statement mismatch'), ('C2', 'planted axiom'), ('C3', 'sorry'), ('C4', 'hijacked definition')]:
        e = ex(run, c)
        ctl[c] = {'what': want, 'exit': e, 'refused': e not in (None, 0)}
    d = rd(run, 'derisk.txt', '') or ''
    ctl['C5'] = {'what': 'corrupted export (a literal 4 -> 5), small project', 'refused': 'nanoda-bad exit 101' in d}
    if any(c != 'C5' and x['exit'] is None for c, x in ctl.items()):
        v, why = 'REFUSED', 'not every control ran'
    elif all(x['refused'] for x in ctl.values()):
        v, why = 'CERTIFIED', 'every control was refused by the judge it was built to fail'
    else:
        v, why = 'REFUTED', 'a control was accepted: the judge cannot be trusted on this run'
    rows.append(row('C1-C5', v, why, controls=ctl))
    # K2 nanoda, KR leanchecker --fresh
    k2 = rd(run, 'K2.out', '') or ''
    m = re.search(r'Checked (\d+) declarations with no typechecker errors', k2)
    if ex(run, 'K2') == 0 and m:
        v, why = 'CERTIFIED', f'nanoda checked {m.group(1)} declarations of the exported closure with no typechecker error'
    elif ex(run, 'K2') in (None, 124, 137):
        v, why = 'REFUSED', 'nanoda did not finish (resources or not run)'
    else:
        v, why = 'REFUSED', f'nanoda exited {ex(run, "K2")}: a disagreement, REFUSED until traced (pre-registered)'
    rows.append(row('K2', v, why, seconds=secs(run, 'K2'), peak_rss_gb=peak_rss_gb(run, 'K2'),
                    export_sha256=(rd(run, 'export.sha256', '') or '').split(' ')[0] or None))
    kr = ex(run, 'KR')
    rows.append(row('KR', 'CERTIFIED' if kr == 0 else ('REFUSED' if kr in (None, 124, 137) else 'REFUTED'),
                    'leanchecker --fresh Main replayed the closure' if kr == 0 else f'leanchecker exit {kr}',
                    seconds=secs(run, 'KR'), peak_rss_gb=peak_rss_gb(run, 'KR')))
    # census (COMPUTED)
    cen = {}
    for line in (rd(run, 'CEN.out', '') or '').splitlines():
        if line.startswith('CENSUS '):
            for k, val in re.findall(r'(\w+)=(\S.*?)(?= \w+=|$)', line[7:]):
                cen[k] = val
    # readings (F1, F2, M1, F3) are pinned, not derived
    readings = json.load(open(READINGS)) if os.path.exists(READINGS) else {}
    return {
        'what': 'The decision of Levent Alpöge\'s Lean release of RH and GRH (alpo.ge, 2026-11-20), check by check, derived from the pod\'s pulled results by tools/check-alpoge-grh.py under the pre-registration notes/alpoge-grh-preregistration-2026-11-20.md.',
        'pins': {'archive_sha256': pins['archive']['sha256'], 'remark_sha256': pins['remark']['sha256'],
                 'toolchain': pins['toolchain'], 'mathlib': pins['mathlib']['rev']},
        'run': os.path.basename(run),
        'rows': rows,
        'computed': {'census': cen},
        'readings': readings,
    }


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in ('--write', '--check'):
        print(__doc__); sys.exit(2)
    runs = sorted(d for d in os.listdir(RUNS)) if os.path.isdir(RUNS) else []
    if not runs:
        print('REFUSED: no pulled run in', RUNS); sys.exit(1)
    rec = derive(os.path.join(RUNS, runs[-1]))
    text = json.dumps(rec, indent=1, ensure_ascii=False) + '\n'
    if sys.argv[1] == '--write':
        open(OUT, 'w', encoding='utf-8').write(text); print('wrote', OUT)
    else:
        old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if old != text:
            print('REFUSED: certs/alpoge-grh-lean.json does not re-derive from the pulled run'); sys.exit(1)
        print('alpoge-grh: the record re-derives;', ', '.join(r['id'] + ' ' + r['verdict'] for r in rec['rows']))


if __name__ == '__main__':
    main()
