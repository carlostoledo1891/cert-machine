#!/usr/bin/env python3
"""check-grh-lean.py — the record of the grh-lean lane (lsernau/grh-lean at 72fead10), derived ONLY from the pulled
results of the pod (tools/runpod-grh-lean.sh: /results, pulled into corpus/grh-lean-check/runs/<run>/) and of CHAR
(amendment A2: corpus/grh-lean-check/runs/char-<pod>/), by the rules of corpus/grh-lean-check/PREREG.md and
AMENDMENTS.md.

  python3 -I tools/check-grh-lean.py                 print the rows (RUN_DIR: the one run folder that is not char-*)
  python3 -I tools/check-grh-lean.py --write [DIR]   write corpus/grh-lean-check/record.json
  python3 -I tools/check-grh-lean.py --check [DIR]   re-derive it and refuse on any difference (the battery)

Words. A row is CERTIFIED (it passes as the PREREG states), REFUSED (it refuses, with the reason: rejected, a control
accepted, resources, cost, not run), PENDING (its step has not produced its output yet: a state, not a verdict) or
COMPUTED (D1 and the tool facts: a list, never a verdict). The formal claim reads CERTIFIED, OPEN (a rejection not yet
traced), REFUSED (with the rows it rests on) or PENDING. An output that cannot be read gives NO verdict
(`"verdict": null`, state "unreadable"): this recorder never guesses. It never writes REFUTED: the PREREG reserves that
for a reproduced rejection traced to an ill-typed term or an extra axiom, which a person traces and a dated amendment
records; until then a rejection leaves the formal claim OPEN.
"""
import hashlib, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LANE = os.path.join(ROOT, 'corpus', 'grh-lean-check')
RUNS = os.path.join(LANE, 'runs')
OUT = os.path.join(LANE, 'record.json')
COMMIT = '72fead102f663d5c7a407964a13dc0cf9d977207'
TREE = '5eb1240f03e791edd3fc7aa84a3a7d8dc3997b7f'
NFILES = 1627
MATHLIB = '56a005855ea17e0b0958f73ec801ae140b0a1679'
THEOREMS = ['riemannHypothesis', 'riemannZeta_eq_zero_re', 'LFunction_ne_zero_of_half_lt_re',
            'LFunction_eq_zero_re', 'LFunction_eq_zero_re_of_isPrimitive']
STANDARD = {'propext', 'Classical.choice', 'Quot.sound'}
SOURCES = {'grh': 803, 'compact': 794}           # the .lean files under each edition's src/ at the commit (GitHub tree)
PINS_I1 = 14                                     # PIN lines step I1 prints: six per edition, Main.lean of each
CHAR_FILES = {'Challenge.lean': 'instruments/alpoge-grh/Challenge.lean', 'Spec.lean': 'instruments/alpoge-grh/spec/Spec.lean',
              'Textbook.lean': 'instruments/alpoge-grh/spec/Textbook.lean', 'TextbookAx.lean': 'instruments/alpoge-grh/spec/TextbookAx.lean'}
CHAR_THEOREMS = ['isTextbookZeta_riemannZeta', 'isTextbookL_LFunction', 'eqOn_riemannZeta', 'eqOn_LFunction',
                 'textbookRH_of_riemannHypothesis', 'textbookGRH_of', 'riemannHypothesis_of_textbookRH',
                 'dirichletLZerosOnLine_of_textbookGRH']
AXIOMS_LINE = 'depends on axioms: [propext, Classical.choice, Quot.sound]'


class Unreadable(Exception):
    """an output exists but cannot be read: the row gets no verdict"""


def sha_file(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


class Run:
    def __init__(self, d):
        self.d = d

    def has(self, name):
        return self.d is not None and os.path.exists(os.path.join(self.d, name))

    def rd(self, name):
        p = os.path.join(self.d, name) if self.d else None
        if not p or not os.path.exists(p):
            return None
        try:
            return open(p, encoding='utf-8', errors='strict').read()
        except (OSError, UnicodeDecodeError) as e:
            raise Unreadable('%s: %s' % (name, e))

    def exit(self, step):
        v = self.rd(step + '.exit')
        if v is None:
            return None
        if not re.fullmatch(r'\s*\d+\s*', v):
            raise Unreadable('%s.exit is not an exit status: %r' % (step, v[:40]))
        return int(v)

    def out(self, step, need=True):
        """stdout and stderr of a step: <step>.out, else its tail <step>.out.tail (the seal makes one for files over
        5 MB, listed in LARGE.txt); a step with an exit and neither file is unreadable"""
        o = self.rd(step + '.out')
        if o is None:
            o = self.rd(step + '.out.tail')
        e = self.rd(step + '.err') or ''
        if o is None and need and self.exit(step) is not None:
            raise Unreadable('%s has an exit but no .out or .out.tail' % step)
        return (o or '') + '\n' + e

    def state(self, step):
        if self.d is None:
            return 'absent', None
        e = self.exit(step)
        if e is not None:
            return 'done', e
        nr = self.rd(step + '.not-run')
        if nr is not None:
            return 'not-run', nr.strip()
        if self.has(step + '.start'):
            return 'running', None
        return 'absent', None

    def secs(self, step):
        a, b = self.rd(step + '.start'), self.rd(step + '.end')
        try:
            return None if a is None or b is None else int(b) - int(a)
        except ValueError:
            raise Unreadable('%s.start/.end are not times' % step)

    def peak_rss_gb(self, step):
        m = re.search(r'Maximum resident set size \(kbytes\): (\d+)', self.rd(step + '.err') or '')
        return None if not m else round(int(m.group(1)) / 1048576, 1)

    def memmax_gb(self, step):
        v = (self.rd(step + '.memmax') or '').strip()
        return round(int(v) / 1e9, 1) if v.isdigit() else None

    def oom_delta(self, step):
        m = re.search(r'oom_kill_before (\d+) oom_kill_after (\d+)', self.rd(step + '.mem') or '')
        return None if not m else int(m.group(2)) - int(m.group(1))

    def measures(self, step):
        return {'seconds': self.secs(step), 'peak_rss_gb': self.peak_rss_gb(step), 'cgroup_peak_gb': self.memmax_gb(step)}


def row(id_, verdict, why, state=None, **kw):
    r = {'id': id_, 'verdict': verdict, 'why': why}
    if state:
        r['state'] = state
    r.update({k: v for k, v in kw.items() if v is not None})
    return r


def stopped(run, step):
    """(reason, words) for a step that ended without its own verdict, else None: cost, time limit, memory, killed"""
    st, e = run.state(step)
    if st != 'done':
        return None
    if e == 124 and run.has(step + '.deadline'):
        return 'cost', 'stopped at the lane\'s deadline (amendment A1 ceiling): ' + run.rd(step + '.deadline').strip()
    if e == 124:
        return 'resources', 'hit its time limit (%s s)' % (run.rd(step + '.timeout') or '?').strip()
    if e == 137:
        d = run.oom_delta(step)
        if d is not None and d > 0:
            return 'resources', 'killed for memory (oom_kill rose by %d during the step)' % d
        return 'killed', 'killed (exit 137) with no out-of-memory record: the cause is not established'
    return None


def not_yet(run, step, what):
    """the row for a step that has no result: PENDING while it may still come, REFUSED (not run) when it was not started"""
    st, info = run.state(step)
    if st == 'not-run':
        return row(what, 'REFUSED', '%s was not started: %s' % (step, info), state='not run')
    if st == 'running':
        return row(what, 'PENDING', '%s is running' % step, state='running')
    return row(what, 'PENDING', '%s has not run yet' % step, state='pending')


def nanoda_accepts(out):
    """the declaration count if nanoda's output is one of its two acceptance lines, else None (the earlier lane's A18:
    the one function that reads nanoda's acceptance). With print_axioms off or a pretty-printer destination:
    `Checked N declarations with no errors`. With this configuration (print_axioms at its default, no destination):
    `Checked N declarations with no typechecker errors, 1 pretty printer errors: ["Unable to print axioms"]`. Any other
    pretty-printer error is not an acceptance here."""
    t = ' '.join((out or '').split())
    a = re.search(r'Checked (\d+) declarations with no errors', t)
    b = re.search(r'Checked (\d+) declarations with no typechecker errors, 1 pretty printer errors: \[ ?"Unable to print axioms",? ?\]', t)
    m_ = a or b
    return int(m_.group(1)) if m_ else None


def sandbox(run):
    """the Landlock gate: landrun with Comparator's flags ran (LL1) and refused a write outside its paths (LL2)"""
    try:
        ok = run.exit('LL1') == 0 and run.exit('LL2') not in (None, 0) and (run.rd('LL2-probe.txt') or '').strip() == 'probe file absent'
    except Unreadable:
        return False, None
    abi = re.search(r'landlock ABI (\S+)', run.rd('setup.out') or '')
    return ok, abi.group(1) if abi else None


# ------------------------------------------------------------------------------------------------ the rows
def r_I1(run):
    st, e = run.state('I1')
    if st != 'done':
        return not_yet(run, 'I1', 'I1')
    o = run.out('I1')
    lst = run.rd('I1-files.sha256')
    pins = re.findall(r'^PIN (\S+) ([0-9a-f]{64}) (MATCH|MISMATCH)', o, re.M)
    checks = {k: bool(re.search(r'^%s \S+ MATCH$' % k, o, re.M)) for k in ('HEAD', 'TREE', 'FILES')}
    checks['worktree'] = 'WORKTREE clean' in o
    checks['lakefile_guard'] = 'LAKEFILE GUARD clean' in o and 'LAKEFILE.LEAN present' not in o
    checks['pins'] = len(pins) == PINS_I1 and all(p[2] == 'MATCH' for p in pins)
    checks['list'] = lst is not None and len(lst.splitlines()) == NFILES
    lsha = hashlib.sha256(lst.encode()).hexdigest() if lst is not None else None
    if lst is not None and ('LIST %s %d files' % (lsha, NFILES)) not in o:
        raise Unreadable('I1-files.sha256 does not hash to the LIST line I1 printed')
    if e == 0 and all(checks.values()):
        return row('I1', 'CERTIFIED', 'the clone at %s (tree %s) hashes to one list of %d files, pinned before any build; the %d registered pins match; no cache service, executable or lakefile.lean' % (COMMIT[:8], TREE[:8], NFILES, PINS_I1),
                   list_sha256=lsha)
    bad = [k for k, v in checks.items() if not v] + ['%s %s' % (p[0], p[2]) for p in pins if p[2] != 'MATCH']
    return row('I1', 'REFUSED', 'integrity not established: ' + ', '.join(bad or ['exit %s' % e]), state='mismatch', checks=checks)


def r_build(run, n, e_):
    rid = n
    st, e = run.state(n)
    if st != 'done':
        return not_yet(run, n, rid)
    s = stopped(run, n)
    meas = run.measures(n)
    if s:
        return row(rid, 'REFUSED', 'the build ' + s[1], state=s[0], **meas)
    o = run.out(n)
    facts = run.rd(n + '-facts.txt')
    rec = (run.rd(n + '-reconcile.txt') or '').splitlines()
    pre = re.search(r'release \.olean files before \S+: (\d+)', run.rd(n + '-pre.txt') or '')
    if facts is None or not rec or pre is None:
        raise Unreadable('%s: the facts, the reconciliation or the pre-build count was not written' % n)
    f = dict(re.findall(r'^(\w+) (\S*)', facts, re.M))
    m = re.match(r'sources (\d+) oleans (\d+) missing (\d+) extra (\d+)', rec[0])
    if not m or 'sorry_warnings' not in f or 'built_release_modules' not in f:
        raise Unreadable('%s: the facts are not in the form the script writes' % n)
    sources, oleans, missing, extra = (int(x) for x in m.groups())
    sorry = int(f['sorry_warnings'])
    # the full log, when it is home, is re-counted here in both spellings of the warning (the earlier lane's A24)
    if run.has(n + '.out'):
        sorry = max(sorry, len(re.findall(r"declaration uses .sorry.", o)))
    built = int(f['built_release_modules'])
    kw = dict(meas, sources=sources, oleans=oleans, missing=missing, extra=extra, sorry_warnings=sorry,
              built_release_modules=built, release_oleans_before=int(pre.group(1)), fetch_lines=int(f.get('fetch_lines', '0') or 0))
    if e != 0:
        return row(rid, 'REFUSED', 'lake build exits %d (error lines: %s)' % (e, f.get('error_lines')), state='rejected', **kw)
    if sorry:
        return row(rid, 'REFUSED', 'the build reports %d `sorry` warnings' % sorry, state='rejected', **kw)
    if 'Build completed successfully' not in o:
        raise Unreadable('%s exits 0 but its output has no "Build completed successfully" line' % n)
    if int(pre.group(1)) != 0 or sources != SOURCES[e_] or missing or extra or oleans != sources:
        return row(rid, None, 'the build exits 0, but from source is not established: %d release .olean files before it, %d of %d sources, %d missing, %d extra' % (int(pre.group(1)), sources, SOURCES[e_], missing, extra), state='unreadable', **kw)
    if built != sources:
        return row(rid, None, 'the build exits 0, but its log shows %d release modules compiled here, not %d: read the log' % (built, sources), state='unreadable', **kw)
    return row(rid, 'CERTIFIED', 'lake build of %s exits 0 from source (Mathlib\'s official cache only): all %d release modules compiled here, none present before, no `sorry`' % ('grh/' if e_ == 'grh' else 'grh-compact/', sources), **kw)


def r_A1(run):
    found, eds = {}, {}
    for e_ in ('grh', 'compact'):
        st, e = run.state('A1-' + e_)
        if st != 'done':
            r = not_yet(run, 'A1-' + e_, 'A1')
            r['why'] = '[%s] ' % e_ + r['why']
            return r
        o = run.out('A1-' + e_)
        f = {}
        for t in THEOREMS:
            m = re.search(r"'" + re.escape(t) + r"' depends on axioms: \[([^\]]*)\]", o)
            f[t] = None if not m else sorted(x.strip() for x in m.group(1).split(',') if x.strip())
        found[e_], eds[e_] = f, e
    extra = {e_: {t: a for t, a in f.items() if a is not None and not set(a) <= STANDARD} for e_, f in found.items()}
    if any(extra.values()):
        return row('A1', 'REFUSED', 'an axiom outside the three: %s' % {k: v for k, v in extra.items() if v}, state='extra axiom', axioms=found)
    if all(eds[e_] == 0 and all(found[e_][t] is not None for t in THEOREMS) for e_ in eds):
        return row('A1', 'CERTIFIED', 'in both editions each of the five theorems depends only on propext, Classical.choice, Quot.sound', axioms=found)
    raise Unreadable('A1: an axiom report is missing (exits %s)' % eds)


def judge_eval(run, step, edition, nanoda=False):
    """one Comparator run: (verdict, state, why) under the PREREG's S1 rule"""
    st, e = run.state(step)
    if st != 'done':
        r = not_yet(run, step, step)
        return r['verdict'], r.get('state'), r['why']
    ok_box, abi = sandbox(run)
    gate = run.rd(step + '-gate.txt') or ''
    s = stopped(run, step)
    if s:
        return 'REFUSED', s[0], 'Comparator ' + s[1]
    o = run.out(step)
    acc = 'Your solution is okay!' in o and 'Lean default kernel accepts the solution' in o
    nan = bool(re.search(r'nanoda kernel accepts the solution', o, re.I))
    rej = re.findall(r'^.*(?:uncaught exception|kernel rejected the solution|kernel rejects the solution|post-check rejects).*$', o, re.M | re.I)
    if e == 0 and acc and not rej and (nan or not nanoda):
        if not ok_box:
            return None, 'unreadable', 'Comparator accepted, but the Landlock gate is not established (LL1, LL2): not the real sandbox the PREREG names'
        if 'challenge unchanged since CHB-%s-seal' % edition not in gate:
            return None, 'unreadable', 'Comparator accepted, but the challenge gate before it is not in %s-gate.txt' % step
        return 'CERTIFIED', None, 'Comparator v4.35.0 accepted%s, in its Landlock sandbox (ABI %s), the challenge unchanged since it was built before the release' % (
            ' (Lean\'s kernel and nanoda)' if nanoda else ' (Lean\'s kernel)', abi)
    if e == 0:
        raise Unreadable('%s exits 0 without Comparator\'s acceptance lines' % step)
    if rej and all(re.search(r'uncaught exception: Child exited with', x) for x in rej):
        # the sandboxed `lake build` or lean4export of Comparator failed: a tool failure, not a statement verdict
        return None, 'unreadable', 'Comparator stopped because its sandboxed child failed (%s): not a verdict on the statements; read %s.out' % (rej[0].strip(), step)
    return 'REFUSED', 'rejected', 'Comparator rejected (exit %d): %s; REFUSED until traced (PREREG)' % (e, ' | '.join(x.strip() for x in rej[:3]) or 'no diagnostic line')


def r_judge(run, rid, step, edition, nanoda=False, pre=None):
    if pre:
        for p in pre:
            st, e = run.state(p)
            if st == 'done' and e != 0:
                return row(rid, 'REFUSED', '%s exits %d, so %s did not run' % (p, e, step), state='not run')
    v, st, why = judge_eval(run, step, edition, nanoda)
    return row(rid, v, why, state=st, **(run.measures(step) if run.state(step)[0] == 'done' else {}))


def conleche_accepts(out):
    m = re.search(r'con-leche: accepted (\d+) declarations', out)
    return int(m.group(1)) if m else None


def r_K1(run):
    st, e = run.state('K1')
    if st != 'done':
        return not_yet(run, 'K1', 'K1')
    s = stopped(run, 'K1')
    meas = run.measures('K1')
    if s:
        return row('K1', 'REFUSED', 'nanoda ' + s[1], state=s[0], **meas)
    o = run.out('K1')
    n = nanoda_accepts(o)
    ef = run.rd('export-facts.txt') or ''
    dg = (run.rd('export.sha256') or '').split(' ')[0]
    if e == 0 and n and run.exit('EXP') == 0 and ef.startswith('roots 5/5') and re.fullmatch(r'[0-9a-f]{64}', dg or ''):
        return row('K1', 'CERTIFIED', 'nanoda %s checked %d declarations of the exported closure of the five with no typechecker error' % ('0da9f98f', n),
                   declarations=n, export_sha256=dg, **meas)
    if e == 0:
        raise Unreadable('K1 exits 0 but the acceptance line, the export digest or the five roots are not established')
    return row('K1', 'REFUSED', 'nanoda exited %d: a rejection, REFUSED until traced (PREREG)' % e, state='rejected', **meas)


def r_K2(run):
    for s_ in ('K2V', 'K2C'):
        st, e = run.state(s_)
        if st != 'done':
            r = not_yet(run, s_, 'K2')
            return r
        s = stopped(run, s_)
        if s:
            return row('K2', 'REFUSED', 'con-leche (%s) %s' % (s_, s[1]), state=s[0], **run.measures(s_))
    v, c = run.out('K2V'), run.out('K2C')
    nv, nc = conleche_accepts(v), conleche_accepts(c)
    just = sorted(set(re.findall(r'con-leche: theorem (\S+) justified by the solution', c)))
    ev, ec = run.exit('K2V'), run.exit('K2C')
    if ev == 0 and ec == 0 and nv and nc and '5 axioms justified by the solution' in c and just == sorted(THEOREMS):
        return row('K2', 'CERTIFIED', 'con-leche 5ea446d5 --verified accepted the %d declarations of the export, and --compare justified the five theorems against the challenge\'s export' % nv,
                   declarations=nv, K2V=run.measures('K2V'), K2C=run.measures('K2C'))
    if ev == 0 and ec == 0:
        raise Unreadable('K2: con-leche exits 0 but its acceptance or the five justifications are not in its output')
    bad = [x for x, ee in (('K2V', ev), ('K2C', ec)) if ee != 0]
    inv = re.findall(r'con-leche: invalid: .*', v + c)
    return row('K2', 'REFUSED', 'con-leche rejected (%s): %s; REFUSED until traced (PREREG)' % (', '.join(bad), (inv[0][:300] if inv else 'no diagnostic line')), state='rejected')


def r_KR(run):
    st, e = run.state('KR')
    if st != 'done':
        return not_yet(run, 'KR', 'KR')
    meas = run.measures('KR')
    s = stopped(run, 'KR')
    if s:
        return row('KR', 'REFUSED', 'leanchecker ' + s[1], state=s[0], **meas)
    if e == 0:
        return row('KR', 'CERTIFIED', 'leanchecker --fresh Main replayed the environment of Main (the readable edition) through Lean\'s kernel and exits 0', **meas)
    return row('KR', 'REFUSED', 'leanchecker --fresh Main exits %d: a rejection, REFUSED until traced (PREREG)' % e, state='rejected', **meas)


# a control's check: (step, what must be named, judge kind). Refused = an exit that is not 0, 124 or 137, the planted
# thing named, and no acceptance line. Accepted (exit 0 with an acceptance) = the instrument is broken.
CONTROLS = {
    'C1': [('C1S', r"Illegal axiom detected: 'CertMachine\.plantedAxiomC1'", 'comparator'),
           ('C1K', r'plantedAxiomC1', 'conleche'), ('C1KC', r'plantedAxiomC1|LFunction_eq_zero_re_of_isPrimitive', 'conleche')],
    'C2': [('C2S', r"Illegal axiom detected: 'sorryAx'", 'comparator'),
           ('C2K', r'sorry|LFunction_ne_zero_of_half_lt_re', 'conleche'), ('C2KC', r'sorry|LFunction_ne_zero_of_half_lt_re', 'conleche')],
    'C3': [('C3S', r"(?:does not match|do not match)[^\n]*'(?:DirichletLZerosOnLine|LFunction_eq_zero_re)'", 'comparator'),
           ('C3K', r'DirichletLZerosOnLine|LFunction_eq_zero_re\b', 'conleche')],
}


def control_check(run, step, named, kind):
    st, e = run.state(step)
    if st != 'done':
        return {'state': st, 'refused': None, 'info': run.state(step)[1]}
    s = stopped(run, step)
    if s:
        return {'state': s[0], 'exit': e, 'refused': None, 'info': s[1]}
    o = run.out(step)
    if kind == 'comparator':
        accepted = 'Your solution is okay!' in o
    else:
        accepted = conleche_accepts(o) is not None or bool(re.search(r'con-leche: theorem \S+ justified by the solution', o) and e == 0)
    if e == 0 and accepted:
        return {'state': 'accepted', 'exit': e, 'refused': False}
    if e == 0:
        raise Unreadable('control step %s exits 0 without an acceptance line' % step)
    if re.search(named, o) and not accepted:
        return {'state': 'refused', 'exit': e, 'refused': True}
    return {'state': 'rejected without naming the plant: read it', 'exit': e, 'refused': None}


def r_controls(run):
    det, bad, open_ = {}, [], []
    for c, checks in CONTROLS.items():
        det[c] = {}
        for step, named, kind in checks:
            try:
                x = control_check(run, step, named, kind)
            except Unreadable as u:
                x = {'state': 'unreadable', 'refused': None, 'info': str(u)}
            det[c][step] = x
            if x['refused'] is False:
                bad.append(step)
            elif x['refused'] is None:
                open_.append((step, x['state']))
    if bad:
        return row('C1-C3', 'REFUSED', 'a control was ACCEPTED (%s): the instrument, not the release, is broken on this run' % ', '.join(bad), state='control accepted', controls=det)
    if not open_:
        return row('C1-C3', 'CERTIFIED', 'each control was refused by S1\'s check (Comparator) and by K2\'s (con-leche), naming the planted axiom, sorry or statement', controls=det)
    if any(s in ('unreadable', 'rejected without naming the plant: read it') for _, s in open_):
        return row('C1-C3', None, 'no verdict: ' + ', '.join('%s %s' % x for x in open_ if x[1] in ('unreadable', 'rejected without naming the plant: read it')), state='unreadable', controls=det)
    if any(s == 'not-run' for _, s in open_):
        return row('C1-C3', 'REFUSED', 'a control check was not started: ' + ', '.join(s for s, st in open_ if st == 'not-run'), state='not run', controls=det)
    if any(s in ('cost', 'resources', 'killed') for _, s in open_):
        return row('C1-C3', 'REFUSED', 'a control check ended without its result: ' + ', '.join('%s %s' % x for x in open_), state='resources', controls=det)
    return row('C1-C3', 'PENDING', 'control checks without a result yet: ' + ', '.join(s for s, _ in open_), state='pending', controls=det)


def r_CHAR(run, char_dir):
    """CHAR, amendment A2: read from the Lean-bridge pod's run (runs/char-<pod>/); this pod's optional CHAR is reported beside it"""
    c = Run(char_dir)
    if char_dir is None:
        return row('CHAR', 'PENDING', 'no CHAR run folder (runs/char-*) is home', state='pending')
    inputs = c.rd('inputs.sha256') or ''
    log = c.rd('CHAR.log') or ''
    ax = c.rd('TextbookAx.out') or ''
    rev = (c.rd('mathlib-rev.txt') or '').strip()
    script = c.rd('run.sh') or ''
    have = dict((l.split('  ', 1)[1].strip().split('/')[-1], l.split('  ', 1)[0]) for l in inputs.splitlines() if '  ' in l)
    want = {}
    for base, rel in CHAR_FILES.items():
        try:
            want[base] = subprocess.run(['git', '-C', ROOT, 'show', 'HEAD:' + rel], capture_output=True, check=True).stdout
        except (OSError, subprocess.CalledProcessError):
            want[base] = open(os.path.join(ROOT, rel), 'rb').read() if os.path.exists(os.path.join(ROOT, rel)) else None
    same = {b: (want[b] is not None and have.get(b) == hashlib.sha256(want[b]).hexdigest()) for b in CHAR_FILES}
    exits = dict(re.findall(r'^(Spec|Challenge|Textbook|TextbookAx) exit (\d+)', log, re.M))
    lines = {t: bool(re.search(r"'CertMachine\.Textbook\.%s' %s" % (re.escape(t), re.escape(AXIOMS_LINE)), ax)) for t in CHAR_THEOREMS}
    ok = (all(same.values()) and rev == MATHLIB and 'leanprover/lean4:v4.35.0' in script and len(exits) == 4
          and all(v == '0' for v in exits.values()) and all(lines.values()) and 'sorryAx' not in ax)
    kw = {'where': os.path.basename(char_dir), 'inputs_equal_repository': same, 'mathlib': rev or None}
    if ok:
        return row('CHAR', 'CERTIFIED', 'the textbook RH and GRH (zeta and L characterised by their Dirichlet series and holomorphy on C minus 1, without Mathlib\'s definitions) proved equivalent to the release\'s statements at Lean v4.35.0 and Mathlib %s, the four files unchanged; the eight theorems on the three standard axioms (amendment A2)' % MATHLIB[:8], **kw)
    if len(exits) == 4 and any(v != '0' for v in exits.values()):
        return row('CHAR', 'REFUSED', 'a CHAR file did not compile: %s' % exits, state='failed', **kw)
    return row('CHAR', None, 'the CHAR run is not complete or not readable (inputs %s, exits %s, axiom lines %d of 8)' % (same, exits, sum(lines.values())), state='unreadable', **kw)


def r_D1(run):
    res = {}
    for e_ in ('grh', 'compact'):
        st, e = run.state('D1-' + e_)
        if st != 'done' or e != 0:
            res[e_] = {'state': st if st != 'done' else 'exit %d' % e}
            continue
        o = run.out('D1-' + e_)
        lines = [l.split('\t') for l in o.splitlines() if l.startswith('D1\t')]
        if any(len(l) != 5 for l in lines):
            raise Unreadable('D1-%s: a line not of five fields' % e_)
        m = re.search(r'^D1SUM (.*)$', o, re.M)
        if not m:
            raise Unreadable('D1-%s: no D1SUM line' % e_)
        summ = dict(kv.split('=', 1) for kv in m.group(1).split())
        decl = [{'name': l[4], 'module': l[3], 'file': 'src/' + l[3].replace('.', '/') + '.lean', 'kind': l[1]} for l in lines if l[2] == 'decl']
        if int(summ.get('release_outside', -1)) != len(lines):
            raise Unreadable('D1-%s: the summary counts %s lines, the output has %d' % (e_, summ.get('release_outside'), len(lines)))
        res[e_] = {'state': 'done', 'summary': summ, 'outside_decl': decl}
    if all(v.get('state') == 'done' for v in res.values()):
        why = 'the release\'s declarations outside the closure of the five theorems: %s (grh), %s (compact) user-written, beside generated ones (a list, never a verdict)' % (
            res['grh']['summary'].get('outside_decl'), res['compact']['summary'].get('outside_decl'))
        return row('D1', 'COMPUTED', why, editions=res)
    return row('D1', 'PENDING', 'D1 not complete: %s' % {k: v['state'] for k, v in res.items()}, state='pending', editions=res)


def tools(run):
    """facts about the judges and the host (COMPUTED, not rows)"""
    s = run.rd('setup.out') or ''
    j = run.rd('judges.txt') or ''
    d = run.rd('DERISK.out') or ''
    der = dict(re.findall(r'^DERISK (\S+) exit (\d+)', d, re.M))
    expect = {'comparator-So': lambda x: x == '0', 'comparator-Bad': lambda x: x != '0', 'export': lambda x: x == '0',
              'nanoda-e': lambda x: x == '0', 'nanoda-bad': lambda x: x != '0', 'conleche-e': lambda x: x == '0',
              'conleche-bad': lambda x: x != '0', 'conleche-compare': lambda x: x == '0'}
    return {
        'audit_commit': (re.search(r'^audit commit (\S+)', s, re.M) or [None, None])[1],
        'judges': dict((m[0], m[1]) for m in re.findall(r'^JUDGE (\S+) ([0-9a-f]{40})', j, re.M)),
        'toolchains': re.findall(r'^toolchain (\S+) archive ([0-9a-f]{64})', s, re.M),
        'landlock': (re.search(r'^landlock ABI (.*)$', s, re.M) or [None, None])[1],
        'systemd_run': (re.search(r'^systemd-run: (.*)$', s, re.M) or [None, None])[1],
        'cache_host_blocked': 'cache host blocked' in s,
        'sandbox_gate': sandbox(run)[0],
        'derisk': der, 'derisk_as_expected': bool(der) and all(k in der and f(der[k]) for k, f in expect.items()),
    }


def instruments_check(run):
    """the instruments the pod fetched against the repository at the audit commit (git), file by file"""
    lst = run.rd('audit-files.sha256') or ''
    ac = tools(run)['audit_commit']
    out = {}
    for l in lst.splitlines():
        if '  ' not in l:
            continue
        h, p = l.split('  ', 1)
        p = p.strip()[2:] if p.strip().startswith('./') else p.strip()
        try:
            b = subprocess.run(['git', '-C', ROOT, 'show', '%s:%s' % (ac, p)], capture_output=True, check=True).stdout if ac else None
        except (OSError, subprocess.CalledProcessError):
            b = None
        out[p] = None if b is None else hashlib.sha256(b).hexdigest() == h
    return out


def derive(run_dir, char_dir):
    run = Run(run_dir)
    rows = []

    def guarded(rid, f, *a):
        try:
            rows.append(f(*a))
        except Unreadable as u:
            rows.append(row(rid, None, 'no verdict: ' + str(u), state='unreadable'))

    guarded('I1', r_I1, run)
    guarded('B1', r_build, run, 'B1', 'grh')
    guarded('B2', r_build, run, 'B2', 'compact')
    guarded('A1', r_A1, run)
    guarded('S1', r_judge, run, 'S1', 'S1', 'grh', False)
    guarded('S2', r_judge, run, 'S2', 'S2', 'grh', True, ['S2-install'])
    guarded('K1', r_K1, run)
    guarded('K2', r_K2, run)
    guarded('KR', r_KR, run)
    guarded('C1-C3', r_controls, run)
    guarded('E1', r_judge, run, 'E1', 'E1', 'compact', False)
    guarded('CHAR', r_CHAR, run, char_dir)
    guarded('D1', r_D1, run)
    by = {r['id']: r for r in rows}
    need = ['B1', 'A1', 'S1', 'K1', 'K2', 'KR', 'C1-C3']
    vs = {k: by[k]['verdict'] for k in need}
    if all(v == 'CERTIFIED' for v in vs.values()):
        claim = row('claim', 'CERTIFIED', 'Lean accepts proofs of the five stated theorems from propext, Classical.choice and Quot.sound: B1, A1, S1, K1, K2 and KR pass and C1-C3 are refused (PREREG verdict rule). Nothing is said about the mathematics beyond what the kernels check.')
    elif any(v is None for v in vs.values()):
        claim = row('claim', None, 'no verdict: %s gave no readable result' % ', '.join(k for k, v in vs.items() if v is None), state='unreadable')
    elif any(by[k].get('state') in ('rejected', 'extra axiom', 'control accepted', 'mismatch') for k in need):
        ks = [k for k in need if by[k].get('state') in ('rejected', 'extra axiom', 'control accepted', 'mismatch')]
        claim = row('claim', 'OPEN', 'a rejection on %s: OPEN until it is reproduced and traced (REFUTED needs a traced ill-typed term or extra axiom, by amendment)' % ', '.join(ks), state='open')
    elif any(v == 'PENDING' for v in vs.values()):
        claim = row('claim', 'PENDING', 'rows still pending: ' + ', '.join(k for k, v in vs.items() if v == 'PENDING'), state='pending')
    else:
        claim = row('claim', 'REFUSED', 'REFUSED on the rows it rests on: ' + '; '.join('%s (%s)' % (k, by[k].get('state') or by[k]['verdict']) for k, v in vs.items() if v != 'CERTIFIED'), state='refused')
    try:
        ins = instruments_check(run) if run_dir else {}
    except Unreadable as u:
        ins = {'unreadable': str(u)}
    try:
        tl = tools(run) if run_dir else {}
    except Unreadable as u:
        tl = {'unreadable': str(u)}
    return {
        'what': 'The grh-lean lane: lsernau/grh-lean at %s, checked row by row on the pod and derived by tools/check-grh-lean.py under corpus/grh-lean-check/PREREG.md and AMENDMENTS.md.' % COMMIT,
        'target': {'commit': COMMIT, 'tree': TREE, 'files': NFILES, 'lean': 'v4.35.0', 'mathlib': MATHLIB},
        'run': os.path.basename(run_dir) if run_dir else None, 'char_run': os.path.basename(char_dir) if char_dir else None,
        'claim': claim,
        'rows': rows,
        'tools': tl,
        'instruments_equal_audit_commit': ins,
        'words': 'REFUTED is never written by this recorder (PREREG verdict rule); a verdict null is an output that could not be read.',
    }


def pick(argv):
    runs = sorted(x for x in os.listdir(RUNS) if os.path.isdir(os.path.join(RUNS, x))) if os.path.isdir(RUNS) else []
    chars = [x for x in runs if x.startswith('char-')]
    others = [x for x in runs if not x.startswith('char-')]
    char_dir = os.path.join(RUNS, chars[0]) if len(chars) == 1 else None
    if argv:
        return os.path.abspath(argv[0]), char_dir
    if len(others) > 1:
        raise SystemExit('REFUSED: more than one pod run in %s (%s); name the one to read' % (RUNS, others))
    return (os.path.join(RUNS, others[0]) if others else None), char_dir


def main():
    args = sys.argv[1:]
    mode = args.pop(0) if args and args[0] in ('--write', '--check') else None
    if args and args[0].startswith('-'):
        print(__doc__); sys.exit(2)
    run_dir, char_dir = pick(args)
    rec = derive(run_dir, char_dir)
    text = json.dumps(rec, indent=1, ensure_ascii=False) + '\n'
    if mode == '--write':
        open(OUT, 'w', encoding='utf-8').write(text); print('wrote', OUT)
    elif mode == '--check':
        old = open(OUT, encoding='utf-8').read() if os.path.exists(OUT) else ''
        if old != text:
            print('REFUSED: corpus/grh-lean-check/record.json does not re-derive from the pulled runs'); sys.exit(1)
        print('grh-lean: the record re-derives')
    for r in [rec['claim']] + rec['rows']:
        print('%-6s %-10s %s' % (r['id'], r['verdict'], r['why'][:150]))


if __name__ == '__main__':
    main()
