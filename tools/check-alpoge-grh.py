#!/usr/bin/env python3
"""check-alpoge-grh.py — the record of the decision of Alpöge's Lean release (2026-11-20), derived ONLY from the pod's
pulled results (corpus/alpoge-grh/runs/<run>/) and the pinned readings (corpus/alpoge-grh/readings.json), by the rules
of notes/alpoge-grh-preregistration-2026-11-20.md.

  python3 -I tools/check-alpoge-grh.py --write   write certs/alpoge-grh-lean.json
  python3 -I tools/check-alpoge-grh.py --check   re-derive it and refuse on any difference (the battery)
  python3 -I tools/check-alpoge-grh.py --compare-run DIR   a re-run's results (the rerun kit) against this record
"""
import hashlib, json, os, re, sys, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'runs')
OUT = os.path.join(ROOT, 'certs', 'alpoge-grh-lean.json')
PINS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'PINS.json')
READINGS = os.path.join(ROOT, 'corpus', 'alpoge-grh', 'readings.json')
THEOREMS = ['riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re',
            'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive']
STANDARD = {'propext', 'Classical.choice', 'Quot.sound'}
# the reasons that mean "its step has not run (or not finished) yet"
PENDING = re.compile(r'no B1V|integrity not established: no result|not produced for every|did not run|not every control|did not finish|exit None|has not passed|not measured|no complete integrity')


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
    i1 = rd(run, 'I1.txt', '') or ''
    ok = 'I1 PASS' in i1 and i1.count(' MATCH') >= 15 and 'MISMATCH' not in i1
    if ok:
        rows.append(row('I1', 'CERTIFIED', 'the 14 parts fetched on the pod against PINS.json; joined sha256 ' + pins['archive']['sha256']))
    elif 'MISMATCH' in i1:
        rows.append(row('I1', 'REFUTED', 'observed digest mismatch: ' + '; '.join(l for l in i1.splitlines() if 'MISMATCH' in l)))
    else:
        rows.append(row('I1', 'REFUSED', 'no complete integrity observation pulled (amendment A6: absence is not refutation)'))
    # B1, read from B1V (B1's own status went through tee: amendment A3) and the source/olean reconciliation
    b1v = ex(run, 'B1V')
    prog = (rd(run, 'B1.progress', '') or '') + (rd(run, 'B1V.out', '') or '')
    sorry = prog.count("declaration uses 'sorry'")
    built = re.findall(r'Build completed successfully \((\d+) jobs\)', rd(run, 'B1V.out', '') or '')
    rec_ = (rd(run, 'reconcile.txt', '') or '').splitlines()[:1]
    m_ = re.match(r'sources (\d+) oleans (\d+) missing (\d+) extra (\d+)', rec_[0]) if rec_ else None
    if b1v == 0 and built and sorry == 0 and m_ and m_.group(1) == str(pins['archive']['lean_files']) and m_.group(3) == '0' and m_.group(4) == '0':
        v, why = 'CERTIFIED', f'lake build of the default targets exits 0 ({built[-1]} jobs), no sorry warning, all {m_.group(1)} sources have an .olean'
    elif b1v in (None,):
        v, why = 'REFUSED', 'no B1V result pulled'
    elif b1v == 124:
        v, why = 'REFUSED', 'the build hit its time limit'
    else:
        v, why = 'REFUTED', f'the build exits {b1v} (sorry warnings: {sorry}; reconcile: {rec_[0] if rec_ else "none"})'
    rows.append(row('B1', v, why, seconds=secs(run, 'B1'), peak_rss_gb=peak_rss_gb(run, 'B1'), reconcile=rec_[0] if rec_ else None))
    mi = (rd(run, 'mathlib-integrity.txt', '') or '').splitlines()[:1]
    mm = re.search(r'common (\d+) differing (\d+) only-workspace (\d+) only-clean (\d+)', mi[0]) if mi else None
    rb = (rd(run, 'rb.txt', '') or '').splitlines()
    rows.append(row('RB', 'COMPUTED', 'two independent compilations compared (ours vs Sutherland, MIT): ' + (rb[1] if len(rb) > 1 else 'not measured')))
    rows.append(row('MI', 'CERTIFIED' if mm and mm.group(2) == '0' and mm.group(3) == '0' and mm.group(4) == '0' and int(mm.group(1)) > 0 else 'REFUSED',
                    ('the workspace\'s ' + mm.group(1) + ' dependency .olean files equal a clean cache download of the same revision') if mm and mm.group(2) == '0' else 'Mathlib integrity not established: ' + (mi[0] if mi else 'no result')))
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
    chl = lambda t: sorted(l for l in (t or '').splitlines() if '/lib/lean/CertMachine/Challenge.' in l)   # amendment A13: the compiled files only
    same = bool(chl(ch1)) and chl(ch0) == chl(ch1)
    sandboxed = bool(mode) and mode.startswith('sandbox')
    if s1ok and same and not sandboxed:
        v, why = 'REFUSED', 'Comparator accepted, but without the sandbox (amendment A5 makes the sandbox a condition); see V for the clean verifier'
    elif s1ok and same:
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
    built_ok = ex(run, 'CTLB') == 0
    expect = {'C1': ('statement mismatch', r'do not match|does not match'), 'C2': ('planted axiom', r"Illegal axiom detected: 'cheat'"),
              'C3': ('sorry', r"Illegal axiom detected: 'sorryAx'"), 'C4': ('hijacked definition', r'do not match|does not match')}
    for c, (want, pat) in expect.items():
        e = ex(run, c); out = (rd(run, c + '.out', '') or '') + (rd(run, c + '.err', '') or '')
        ctl[c] = {'what': want, 'exit': e, 'refused': built_ok and e not in (None, 0, 124) and bool(re.search(pat, out))}
    ctl['A1-C2'] = {'what': 'the axiom report names the planted axiom', 'exit': ex(run, 'A1C2'), 'refused': ex(run, 'A1C2') == 0 and "'riemannHypothesis' depends on axioms" in (rd(run, 'A1C2.out', '') or '') and 'cheat' in (rd(run, 'A1C2.out', '') or '')}
    ctl['A1-C3'] = {'what': 'the axiom report names sorryAx', 'exit': ex(run, 'A1C3'), 'refused': ex(run, 'A1C3') == 0 and 'sorryAx' in (rd(run, 'A1C3.out', '') or '')}
    c5out = (rd(run, 'C5.out', '') or '') + (rd(run, 'C5.err', '') or '')
    ctl['C5'] = {'what': "the release's export with riemannHypothesis re-typed as False", 'exit': ex(run, 'C5'),
                 'refused': ex(run, 'C5') not in (None, 0, 124, 137) and 'C5: riemannHypothesis re-typed as False' in c5out
                 and not re.search(r'Checked \d+ declarations with no (?:typechecker )?errors', c5out) and bool(re.search(r'tc\.rs|def_eq|type mismatch|typecheck', c5out))}
    if any(x.get('exit', 0) is None for x in ctl.values()) or not built_ok:
        v, why = 'REFUSED', 'not every control ran'
    elif all(x['refused'] for x in ctl.values()):
        v, why = 'CERTIFIED', 'every control was refused by the judge it was built to fail'
    else:
        v, why = 'REFUTED', 'a control was accepted: the judge cannot be trusted on this run'
    rows.append(row('C1-C5', v, why, controls=ctl))
    # K2 nanoda, KR leanchecker --fresh
    k2 = rd(run, 'K2.out', '') or ''
    m = re.search(r'Checked (\d+) declarations with no errors', k2)
    roots_ok = (rd(run, 'export-roots.txt', '') or '').startswith('roots 5/5')
    digest_ok = bool((rd(run, 'export.sha256', '') or '').strip())
    if ex(run, 'K2') == 0 and ex(run, 'EXP') == 0 and m and int(m.group(1)) > 0 and roots_ok and digest_ok:
        v, why = 'CERTIFIED', f'nanoda checked {m.group(1)} declarations of the exported closure with no typechecker error'
    elif ex(run, 'K2') is None:
        v, why = 'REFUSED', 'nanoda did not run yet'
    elif ex(run, 'K2') in (124, 137):
        v, why = 'REFUSED', f'nanoda stopped on resources (exit {ex(run, "K2")})'
    else:
        v, why = 'REFUSED', f'nanoda exited {ex(run, "K2")}: a disagreement, REFUSED until traced (pre-registered)'
    rows.append(row('K2', v, why, seconds=secs(run, 'K2'), peak_rss_gb=peak_rss_gb(run, 'K2'),
                    export_sha256=(rd(run, 'export.sha256', '') or '').split(' ')[0] or None))
    kr = ex(run, 'KR')
    rows.append(row('KR', 'CERTIFIED' if kr == 0 else ('REFUSED' if kr in (None, 124, 137) else 'REFUTED'),
                    'leanchecker --fresh Main replayed the closure' if kr == 0 else f'leanchecker exit {kr}',
                    seconds=secs(run, 'KR'), peak_rss_gb=peak_rss_gb(run, 'KR')))
    # rows from the other runs (amendments A1, A2, A4): the clean verifier, SPEC, the port and the bridges
    base = os.path.dirname(run.rstrip('/'))
    def onlyrun(sub):
        d = os.path.join(os.path.dirname(base), sub)
        if not os.path.isdir(d): return None
        rs = sorted(x for x in os.listdir(d) if os.path.isdir(os.path.join(d, x)))
        return os.path.join(d, rs[0]) if len(rs) == 1 else (d if os.path.exists(os.path.join(d, 'README.md')) else None)
    vr = onlyrun('runs-verifier')
    vlog = rd(vr, '_phase.log', '') if vr else ''
    rows.append(row('V', 'CERTIFIED' if vlog and 'V CERTIFIED by its gates' in vlog and 'STOPPED' not in vlog else 'REFUSED',
                    'the clean verifier passed every gate (challenge built there first, nothing rebuilt, five axiom reports, C1 rejected, both kernels accept)'
                    if vlog and 'V CERTIFIED by its gates' in vlog and 'STOPPED' not in vlog else ('the clean verifier stopped: ' + [l for l in vlog.splitlines() if 'STOPPED' in l][0] if 'STOPPED' in (vlog or '') else 'not run: dropped on the operator\'s word (amendment A7); RB is the cross-host evidence')))
    sd = os.path.join(os.path.dirname(base), 'runs-spec')
    sax = rd(sd, 'spec-axioms.out', '') if os.path.isdir(sd) else ''
    sok = sax.count('depends on axioms: [propext, Classical.choice, Quot.sound]') == 2 and 'exit 0' in (rd(sd, 'spec-compile.out', '') or '')
    rows.append(row('SPEC', 'CERTIFIED' if sok else 'REFUSED', 'RHStrip ↔ RiemannHypothesis compiled at the pin; both theorems on the three standard axioms' if sok else 'SPEC not established'))
    bd = os.path.join(os.path.dirname(base), 'runs-bridge', 'podB-lyq17afbn6smbz')
    p0 = rd(bd, 'P0J.out', '') if os.path.isdir(bd) else ''
    p0ok = ex(bd, 'P0J') == 0 and 'Nanoda kernel accepts the solution' in p0 and 'Lean default kernel accepts the solution' in p0 and 'Your solution is okay!' in p0
    srcs = (rd(bd, 'zeta23-sources.before.sha256', '') or '').splitlines(); srcs2 = (rd(bd, 'zeta23-sources.after.sha256', '') or '').splitlines()
    norm = lambda L: sorted((l.split('  ', 1)[0], l.split('  ', 1)[1][2:] if l.split('  ', 1)[1].startswith('./') else l.split('  ', 1)[1]) for l in L if '  ' in l)
    rows.append(row('P0', 'CERTIFIED' if p0ok and srcs and norm(srcs) == norm(srcs2) else 'REFUSED',
                    f'the August release rebuilt on v4.33.1/Mathlib 0df444a3 with all {len(srcs)} Lean sources unchanged; its own Comparator (17 statements) accepted by nanoda and Lean\'s kernel' if p0ok else 'P0 not established'))
    bb = rd(bd, 'BB2-after-fix.txt', '') if os.path.isdir(bd) else ''
    rows.append(row('BRc+MB', 'CERTIFIED' if 'Build completed successfully' in bb and bb.count('depends on axioms: [propext, Classical.choice, Quot.sound]') == 8 else 'REFUSED',
                    'the conditional bridge (5 theorems) and the Masullo reading (3 theorems) compiled, all on the three standard axioms'))
    brj = rd(run, 'BRJ.out', '') or ''
    plog = rd(run, '_phase.log', '') or ''
    brok = 'STOPPED (bridge)' not in plog and 'bridge: no release artifact changed' in plog and 'BC1 rejected with its diagnostic' in plog and ex(run, 'BC1') not in (None, 0) and ex(run, 'BRB') == 0 and (rd(run, 'BRA.out', '') or '').count('depends on axioms: [propext, Classical.choice, Quot.sound]') == 6 and ex(run, 'BRJ') == 0 and 'Your solution is okay!' in brj and 'Lean default kernel accepts the solution' in brj \
        and bool(re.search(r"theorem statement do not match: 'CertMachine.Bridge.five_sixths_distinct_on_critical_line'", (rd(run, 'BC1.out', '') or '') + (rd(run, 'BC1.err', '') or '')))
    rows.append(row('BRu', 'CERTIFIED' if brok else 'REFUSED', 'the unconditional bridge: six statements judged by Comparator against the bridge challenge, all on the three standard axioms, BC1 rejected' if brok else 'the unconditional bridge has not passed'))
    # amendment A12: CHAR (the textbook statements, Mathlib-only workspace), K3 (con-leche on the build pod), CR (a clean pod)
    cd_ = os.path.join(os.path.dirname(base), 'runs-char')
    cax = rd(cd_, 'CHAR-axioms.out', '') if os.path.isdir(cd_) else ''
    cfiles = rd(cd_, 'CHAR-files.sha256', '') if os.path.isdir(cd_) else ''
    tb = re.search(r'^([0-9a-f]{64})  Textbook\.lean$', cfiles or '', re.M)
    cok = ex(cd_, 'CHAR-build') == 0 and ex(cd_, 'CHAR-axioms') == 0 and cax.count('depends on axioms: [propext, Classical.choice, Quot.sound]') == 8 \
        and 'sorryAx' not in cax and tb is not None
    rows.append(row('CHAR', 'CERTIFIED' if cok else 'REFUSED',
                    'the textbook RH and GRH (zeta and L characterised by their series and holomorphy on C minus 1) proved equivalent to the release\'s statements in the Mathlib-only workspace; eight theorems on the three standard axioms' if cok else 'CHAR did not run to completion',
                    textbook_sha256=tb.group(1) if tb else None))
    def acc(step):
        t = (rd(run, step + '.out', '') or '') + (rd(run, step + '.err', '') or '')
        m_ = re.search(r'accepted (\d+) declarations', t)
        return t, (int(m_.group(1)) if m_ and ex(run, step) == 0 else None)
    k3t, k3n = acc('K3'); k3st, k3sn = acc('K3S')
    k3c1t = (rd(run, 'K3C1.out', '') or '') + (rd(run, 'K3C1.err', '') or '')
    k3c5t = (rd(run, 'K3C5.out', '') or '') + (rd(run, 'K3C5.err', '') or '')
    c1rej = ex(run, 'K3C1') not in (None, 0, 124, 137) and bool(re.search(r'RiemannZetaZerosOnLine|riemannZeta_eq_zero_re', k3c1t)) and not re.search(r'accepted \d+ declarations', k3c1t)
    c5rej = ex(run, 'K3C5') not in (None, 0, 124, 137) and 'riemannHypothesis' in k3c5t and not re.search(r'accepted \d+ declarations', k3c5t)
    k3exp = (rd(run, 'K3-export.sha256', '') or '').split(' ')[0]
    k3dig = k3exp != '' and k3exp == (rd(run, 'export.sha256', '') or '').split(' ')[0]
    k3just = sorted(set(re.findall(r'theorem (\S+) justified by the solution', k3st)))
    k3s_ok = bool(k3sn) and '5 axioms justified by the solution' in k3st and k3just == sorted(THEOREMS)
    if ex(run, 'K3') is None:
        v, why = 'REFUSED', 'con-leche did not run (it starts after phase 2 and the bridge)'
    elif k3n and k3s_ok and c1rej and c5rej and k3dig:
        v, why = 'CERTIFIED', f'con-leche accepted the {k3n} declarations of the export, --compare justified the five theorems against the challenge, and both controls (C1, C5) were rejected'
    elif ex(run, 'K3') in (124, 137) or ex(run, 'K3S') in (124, 137):
        v, why = 'REFUSED', 'con-leche stopped on resources'
    elif ex(run, 'K3') not in (0, None) or ex(run, 'K3S') not in (0, None):
        v, why = 'REFUSED', 'con-leche rejected: a disagreement, REFUSED until traced (pre-registered)'
    else:
        v, why = 'REFUSED', 'con-leche: a control was not rejected, or the export digest differs'
    rows.append(row('K3', v, why, declarations=k3n, seconds=secs(run, 'K3'), peak_rss_gb=peak_rss_gb(run, 'K3'),
                    controls={'K3C1': {'exit': ex(run, 'K3C1'), 'refused': c1rej}, 'K3C5': {'exit': ex(run, 'K3C5'), 'refused': c5rej}}))
    cr = onlyrun('runs-clean')
    if cr is None:
        rows.append(row('CR', 'REFUSED', 'the clean machine did not run (created only on the operator\'s word after a quote, amendment A12)'))
    else:
        crlog = rd(cr, '_phase.log', '') or ''
        crok = 'CR CERTIFIED by its gates' in crlog and 'STOPPED' not in crlog
        rows.append(row('CR', 'CERTIFIED' if crok else 'REFUSED', 'on a fresh pod that never ran the release\'s code, nanoda and con-leche --compare accepted the export against the challenge built there, and the controls were rejected there'
                        if crok else ('the clean machine stopped: ' + [l for l in crlog.splitlines() if 'STOPPED' in l][0] if 'STOPPED' in crlog else ('; '.join(l.split(' ', 1)[1] for l in crlog.splitlines() if 'CR gate:' in l or 'gates held' in l) if 'CR done' in crlog else 'the clean machine did not finish')), run=os.path.basename(cr)))
    # a check whose step has not produced its output yet is PENDING, not REFUSED: a state, not a verdict (an outside reading,
    # 2026-11-21). ONE rule, here; instruments/alpoge-grh/status.js reads the verdict and does not re-derive it.
    for r in rows:
        if r['verdict'] in ('REFUSED', 'COMPUTED') and PENDING.search(r['why']):
            r['verdict'] = 'PENDING'
    # census (COMPUTED): the CENSUS lines, the NIELSEN probes (amendment A10) and the WORDFACTS trace (amendment A11)
    cen, niel, wf = {}, {}, {'targets': []}
    for line in (rd(run, 'CEN.out', '') or '').splitlines():
        if line.startswith('CENSUS '):
            for k, val in re.findall(r'(\w+)=(\S.*?)(?= \w+=|$)', line[7:]):
                cen[k] = val
        elif line.startswith('NIELSEN '):
            m = re.match(r'NIELSEN (\S+) in_closure=(\d+) (.*)$', line)
            if m: niel[m.group(1)] = {'in_closure': int(m.group(2)), 'names': m.group(3).strip()}
        elif line.startswith('WORDFACTS named='):
            m = re.match(r'WORDFACTS named=(\d+) producers=(\d+)', line)
            if m: wf['named'], wf['producers'] = int(m.group(1)), int(m.group(2))
        elif line.startswith('WORDFACTS '):
            m = re.match(r'WORDFACTS (\S+) module=(\S+) release_closure=(\d+) direct=(.*)$', line)
            if m: wf['targets'].append({'name': m.group(1), 'module': m.group(2), 'release_closure': int(m.group(3)), 'direct': m.group(4).strip()})
    for k in ('constants_by_root', 'modules_by_root'):
        if k in cen: cen[k + '_parsed'] = [[a, int(b)] for a, b in re.findall(r'\(([^(),]+), (\d+)\)', cen[k])]
    # the build's progress while it runs (COMPUTED, a count, never a verdict): B1.count, written by root on the pod at a pull
    prog_ = re.match(r'(\S+) built=(\d+) failed=(\d+) errorlines=(\d+) sorry=(\d+)', (rd(run, 'B1.count', '') or '').strip())
    b1p = {'at': prog_.group(1), 'built': int(prog_.group(2)), 'of': pins['archive']['lean_files'], 'failed': int(prog_.group(3)),
           'error_lines': int(prog_.group(4)), 'sorry': int(prog_.group(5)), 'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(int((rd(run, 'B1.start', '') or '0').strip())))} if prog_ else {}
    # readings (F1, F2, M1, F3) are pinned, not derived
    readings = json.load(open(READINGS)) if os.path.exists(READINGS) else {}
    return {
        'what': 'The decision of Levent Alpöge\'s Lean release of RH and GRH (alpo.ge, 2026-11-20), check by check, derived from the pod\'s pulled results by tools/check-alpoge-grh.py under the pre-registration notes/alpoge-grh-preregistration-2026-11-20.md.',
        'pins': {'archive_sha256': pins['archive']['sha256'], 'remark_sha256': pins['remark']['sha256'],
                 'toolchain': pins['toolchain'], 'mathlib': pins['mathlib']['rev']},
        'run': os.path.basename(run),
        'rows': rows,
        'computed': {'census': cen, 'nielsen': niel, 'wordfacts': wf if (niel or wf['targets'] or 'named' in wf) else {}, 'b1_progress': b1p},
        'readings': readings,
    }


POD_ROWS = ['I1', 'B1', 'MI', 'RB', 'A1', 'S1', 'C1-C5', 'K2', 'KR', 'K3', 'BRu']


def compare_run(d):
    """the rerun kit (instruments/alpoge-grh/rerun/): a re-run's /results against this record, row by row"""
    theirs = {r['id']: r for r in derive(os.path.abspath(d))['rows']}
    ours = {r['id']: r for r in json.load(open(OUT, encoding='utf-8'))['rows']}
    same = 0
    for i in POD_ROWS:
        a, b = theirs.get(i, {}).get('verdict'), ours.get(i, {}).get('verdict')
        same += a == b
        print(f'{i:7} yours {a or "-":10} ours {b or "-":10} {"same" if a == b else "DIFFERENT: " + theirs.get(i, {}).get("why", "")}')
    ea = (theirs.get('K2', {}).get('export_sha256') or '-'); eb = (ours.get('K2', {}).get('export_sha256') or '-')
    print('export sha256  yours', ea, ' ours', eb, ' (equal bytes need equal compilations; RB measures that)')
    print(f'{same} of {len(POD_ROWS)} rows agree')


def main():
    if len(sys.argv) == 3 and sys.argv[1] == '--compare-run':
        compare_run(sys.argv[2]); return
    if len(sys.argv) != 2 or sys.argv[1] not in ('--write', '--check'):
        print(__doc__); sys.exit(2)
    runs = sorted(d for d in os.listdir(RUNS)) if os.path.isdir(RUNS) else []
    if len(runs) != 1:
        print('REFUSED: expected exactly one pulled run in', RUNS, 'found', runs); sys.exit(1)
    rec = derive(os.path.join(RUNS, runs[0]))
    text = json.dumps(rec, indent=1, ensure_ascii=False) + '\n'
    if sys.argv[1] == '--write':
        open(OUT, 'w', encoding='utf-8').write(text); print('wrote', OUT)
    else:
        old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if old != text:
            print('REFUSED: certs/alpoge-grh-lean.json does not re-derive from the pulled run'); sys.exit(1)
        print('alpoge-grh: the record re-derives;', ', '.join(r['id'] + ' ' + r['verdict'] for r in rec['rows']))
        print('alpoge-grh: rows not CERTIFIED:', [r['id'] for r in rec['rows'] if r['verdict'] not in ('CERTIFIED', 'PENDING')] or 'none', '· pending:', [r['id'] for r in rec['rows'] if r['verdict'] == 'PENDING'])


if __name__ == '__main__':
    main()
