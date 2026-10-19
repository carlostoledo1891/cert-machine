#!/usr/bin/env python3
"""audit-entropy-arb.py — the two Python stages of tools/audit-entropy-arb.js.

  impl    (python3 -I, the standard library only — the interpreter the batteries use): runs the Python deciders' REAL
          functions on the cases the JavaScript stage wrote, imported exactly as the deciders import them —
          tools/verify_sumdiff.py (outward, ln_out, the DOWN/UP contexts, entropy, ratio, decide, read, main),
          tools/verify_twolaw.py (decide, main) and instruments/fei/fei.py (ln_iv, the DN/UP contexts, decide) — and
          appends their enclosures. The default decimal context is made unusable first (prec 1, no traps), as
          verify_sumdiff.main and verify_twolaw.main leave it, so an operation that rounded in it would show.
          fei.decide computes its enclosures inline and returns them printed outward by fei.outward (43 significant
          digits for the ratio, 29 for H); its full-precision ends are read through a pass-through recorder on its DN
          and UP contexts (every call goes to the real context and returns the real result). The recorder's ends,
          printed by fei.outward, must equal the strings decide returned — a mismatch FAILS the run (the impl stage exits), since a
          recorder reading the wrong values would put the wrong numbers before Arb; it is never booked as a refusal.

  decide  (instruments/zetahankel/.venv/bin/python -I, python-flint): decides every case. The exact value is an Arb ball
          at 256 bits (retried at 1024 and 4096 when Arb cannot separate it from an end), computed from the exact inputs
          with readers and pushforwards of this file's own; when the value is rational (p itself, a sum, a product, a
          quotient, a printed interval) the decision is exact in FLINT's rationals. An enclosure CONTAINS the value when
          lo <= every point of the ball and every point <= hi, decided exactly against the ball's rational ends; a case
          Arb cannot separate at 4096 bits is UNDECIDED, never contained. Writes certs/entropy-arb-audit.json.

usage: (run by tools/audit-entropy-arb.js)
       python3 -I tools/audit-entropy-arb.py impl cases.jsonl out.jsonl ROOT
       .venv/bin/python -I tools/audit-entropy-arb.py decide cases.jsonl out.json '<meta json>'
MIT"""
import contextlib
import io
import json
import math
import os
import re
import sys
import time
from collections import defaultdict
from fractions import Fraction

# ======================================================================================================================
# impl — the Python implementations, run as the deciders run them
# ======================================================================================================================


class Tap:
    """a pass-through recorder on a decimal Context: every method call goes to the real context and returns its result"""

    def __init__(self, ctx):
        self._ctx = ctx
        self.log = []

    def __getattr__(self, name):
        f = getattr(self._ctx, name)
        if not callable(f):
            return f

        def g(*a, **k):
            r = f(*a, **k)
            self.log.append((name, r))
            return r
        return g


def impl(src, dst, root):
    from decimal import Context, Decimal, setcontext
    import decimal
    sys.dont_write_bytecode = True                  # importing the deciders writes nothing into the tree
    sys.path.insert(0, os.path.join(root, 'tools'))
    sys.path.insert(0, os.path.join(root, 'instruments', 'fei'))
    import verify_sumdiff as V      # noqa: E402
    import verify_twolaw as VT      # noqa: E402
    import fei                      # noqa: E402
    setcontext(Context(prec=1, traps=[]))
    t0 = time.time()
    tmp_cert = os.path.join(os.path.dirname(os.path.abspath(dst)), 'cert.json')
    laws, tls, feis, mus = {}, {}, {}, {}
    out = open(dst, 'w')
    n_tasks = 0

    def emit(o):
        out.write(json.dumps(o) + '\n')

    def S(x):
        return str(x)

    def frac(q):
        n, d = q.split('/')
        return Fraction(int(n), int(d))

    def mu_of(law_id):
        if law_id not in mus:
            L = laws[law_id]
            if 'file' in L:
                mus[law_id] = V.read(os.path.join(root, L['file']))
            else:
                open(tmp_cert, 'w').write(L['text'])
                mus[law_id] = V.read(tmp_cert)
        return mus[law_id]

    def result(c, op, truth, res, threw, u, **extra):
        o = {'op': op, 'kind': c.get('kind'), 'truth': truth, 'u': u, 'res': res, 'threw': threw}
        o.update(extra)
        emit(o)

    def attempt(f):
        try:
            return f(), None
        except Exception as e:  # noqa: BLE001 — a refusal is any exception the implementation raises
            return None, (type(e).__name__ + ': ' + str(e))[:160]

    def fei_tapped(art, threshold, record=None):
        """fei.decide with its DN and UP contexts recorded: (result, (H_lo, H_hi), (r_lo, r_hi) or None) at full precision.
        H is the last add in each context, the ratio the last divide (fei.decide computes nothing in them afterwards); a
        result without H came from decide's early return (an unreadable table) and carries no ends. The ends printed by
        fei.outward must be the strings decide returned, or the run fails."""
        dn, up = fei.DN, fei.UP
        tdn, tup = Tap(dn), Tap(up)
        fei.DN, fei.UP = tdn, tup
        try:
            r = fei.decide(art, threshold, record)
        finally:
            fei.DN, fei.UP = dn, up
        if r['H'] is None:
            return r, None, None
        last = lambda log, name: [v for k, v in log if k == name][-1]   # noqa: E731
        H = (last(tdn.log, 'add'), last(tup.log, 'add'))
        R = (last(tdn.log, 'divide'), last(tup.log, 'divide')) if r['ratio'] is not None else None
        printed_H = [fei.outward(H[0], fei.H_DIGITS, False), fei.outward(H[1], fei.H_DIGITS, True)]
        printed_R = [fei.outward(R[0], fei.RATIO_DIGITS, False), fei.outward(R[1], fei.RATIO_DIGITS, True)] if R else None
        if printed_H != r['H'] or printed_R != r['ratio']:
            sys.exit('audit-entropy-arb impl: the recorder did not read the values fei.decide printed — recorded %s / %s, decide returned %s / %s'
                     % (printed_H, printed_R, r['H'], r['ratio']))
        return r, H, R

    ctx_of = {'py': (V.DOWN, V.UP, V.PREC), 'fei': (fei.DN, fei.UP, fei.PREC)}
    range_f = {'multiply': 'mul', 'add': 'add', 'subtract': 'sub', 'divide': 'div'}
    U = {'d': V.PREC}
    for line in open(src):
        c = json.loads(line)
        if not c.get('task'):
            if 'op' not in c:
                if 'law' in c:
                    laws[c['law']] = c
                elif 'tl' in c:
                    tls[c['tl']] = c
                elif 'fei' in c:
                    feis[c['fei']] = c
            out.write(line)
            continue
        n_tasks += 1
        op = c['op']
        if op == 'py.outward':
            r, e = attempt(lambda: V.outward(frac(c['q'])))
            result(c, op, {'t': 'rat', 'x': c['q']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'py.ln_out':
            if 'q' in c:
                p = V.outward(frac(c['q']))
                r, e = attempt(lambda: V.ln_out(*p))
                result(c, op, {'t': 'ln', 'x': [S(p[0]), S(p[1])]}, [S(r[0]), S(r[1])] if r else None, e, U)
            else:
                X = Decimal(c['x'])
                r, e = attempt(lambda: V.ln_out(X, X))
                result(c, op, {'t': 'ln', 'x': [c['x'], c['x']]}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op.startswith('py.ctx.') or op.startswith('fei.ctx.'):
            DOWN, UP, prec = ctx_of[op.split('.')[0]]
            A, Bd = Decimal(c['a']), Decimal(c['b'])
            r, e = attempt(lambda: (getattr(DOWN, c['f'])(A, Bd), getattr(UP, c['f'])(A, Bd)))
            result(c, op, {'t': 'range', 'f': range_f[c['f']], 'a': [c['a'], c['a']], 'b': [c['b'], c['b']]}, [S(r[0]), S(r[1])] if r else None, e, {'d': prec})
        elif op in ('py.plnp', 'py.plnp>1'):
            r, e = attempt(lambda: V.entropy({(0, 0): frac(c['q'])}, (1, 0)))
            result(c, op, {'t': 'plnp', 'q': c['q']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'py.entropy':
            r, e = attempt(lambda: V.entropy(mu_of(c['law'])[1], tuple(c['form'])))
            result(c, op, {'t': 'H', 'law': c['law'], 'form': c['form']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'py.ratio':
            r, e = attempt(lambda: V.ratio(*mu_of(c['law'])))
            result(c, op, {'t': 'rho', 'law': c['law']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'py.twolaw':
            r, e = attempt(lambda: VT.decide(json.loads(tls[c['tl']]['text']))['ratio'])
            result(c, op, {'t': 'mixRho', 'tl': c['tl']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'fei.ln_iv':
            r, e = attempt(lambda: fei.ln_iv(int(c['k'])))
            result(c, op, {'t': 'lnk', 'k': c['k']}, [S(r[0]), S(r[1])] if r else None, e, {'d': fei.PREC})
        elif op == 'fei.decide':
            F = feis[c['f']]
            art = json.load(open(os.path.join(root, c['file']))) if 'file' in c else json.loads(F['art'])
            rec = art.get('record_dec') if 'file' in c else None
            r, e = attempt(lambda: fei_tapped(art, c['threshold'], rec))
            u = {'d': fei.PREC}
            tH, tR = {'t': 'feiH', 'f': c['f']}, {'t': 'feiRho', 'f': c['f']}
            if r is None:                            # fei.decide raised: a refusal with the exception's reason
                result(c, 'fei.H', tH, None, e, u)
                result(c, 'fei.ratio', tR, None, e, u)
            else:                                    # fei.decide returned: a REFUSED word carries its reason as the refusal
                out_, H, R = r
                gate = next((c for c in out_['checks'] if c['verdict'] != 'CERTIFIED' and c['name'][:5] in ('H > 0', 'I > 1')), None)
                why = 'fei.decide: ' + (gate['name'] + ': ' + gate['why'] if gate else str(out_['why']))[:140]   # the check that withheld the ratio
                if H is None:
                    result(c, 'fei.H', tH, None, why, u)
                else:
                    result(c, 'fei.H', tH, [S(H[0]), S(H[1])], None, u)
                    result(c, 'fei.printed', tH, out_['H'], None, None, name='decide()["H"]')
                if R is None:
                    result(c, 'fei.ratio', tR, None, why, u)
                else:
                    result(c, 'fei.ratio', tR, [S(R[0]), S(R[1])], None, u)
                    result(c, 'fei.printed', tR, out_['ratio'], None, None, name='decide()["ratio"]')
        # ---- red controls: planted wrong functions, judged against the operation they replace ----------------------
        elif op == 'red:py.ln_out.nearest':          # ln_out without its outward step: the correctly rounded ln at each end
            X = Decimal(c['x'])
            r = (V.LN.ln(X), V.LN.ln(X))
            result(c, op, {'t': 'ln', 'x': [c['x'], c['x']]}, [S(r[0]), S(r[1])], None, U)
        elif op == 'red:py.outward.shrunk':          # outward(q) shrunk by one unit in the last place at each end
            p = V.outward(frac(c['q']))
            r = (V.DOWN.next_plus(p[0]), V.DOWN.next_minus(p[1]))
            result(c, op, {'t': 'rat', 'x': c['q']}, [S(r[0]), S(r[1])], None, U)
        elif op == 'red:py.entropy.lnnearest':       # the REAL verify_sumdiff.entropy with ln_out replaced by the nearest one
            real = V.ln_out
            V.ln_out = lambda lo, hi: (V.LN.ln(lo), V.LN.ln(hi))
            try:
                r = V.entropy({(0, 0): frac(c['q'])}, (1, 0))
            finally:
                V.ln_out = real
            result(c, op, {'t': 'plnp', 'q': c['q']}, [S(r[0]), S(r[1])], None, U)
        elif op == 'red:fei.ln_iv.nearest':          # ln_iv without its outward step
            v = fei.NE.ln(Decimal(int(c['k'])))
            result(c, op, {'t': 'lnk', 'k': c['k']}, [S(v), S(v)], None, {'d': fei.PREC})
        # ---- malformed inputs: each must be refused; each baseline must decide -------------------------------------
        elif op == 'bad':
            imp = c['impl']
            if imp == 'verify_sumdiff':
                def go():
                    open(tmp_cert, 'w').write(c['text'])
                    prob, mu = V.read(tmp_cert)
                    r = V.ratio(prob, mu)
                    return V.decide(r, c['claim']), r
            elif imp == 'verify_twolaw':
                def go():
                    r = VT.decide(json.loads(c['text']))['ratio']
                    return V.decide(r, c['claim']), r
            elif imp == 'fei':
                def go():
                    r = fei.decide(json.loads(c['art']), c['threshold'])
                    return r['verdict'], r['ratio']
            elif imp == 'fei.ln_iv':
                def go():
                    return 'returned', fei.ln_iv(int(c['k']))
            else:
                def go():
                    X = Decimal(c['x'])
                    return 'returned', V.ln_out(X, X)
            r, e = attempt(go)
            decided = r is not None and r[0] not in ('UNDECIDED', 'REFUSED') and not (imp == 'fei' and r[0] != 'CERTIFIED')
            emit({'op': 'bad', 'impl': imp, 'name': c['name'], 'expectRefusal': c['expectRefusal'],
                  'threw': e if e else (None if decided else 'verdict ' + r[0]),
                  'res': ('verdict ' + r[0] + ', ' + ', '.join(str(x)[:40] for x in r[1])) if decided else None})
        # ---- the real inputs ---------------------------------------------------------------------------------------
        elif op == 'real.py':
            prob, mu = mu_of(c['law'])
            for f in V.FORMS[prob] + [(1, -1)]:
                r, e = attempt(lambda: V.entropy(mu, f))
                result(c, 'py.entropy', {'t': 'H', 'law': c['law'], 'form': list(f)}, [S(r[0]), S(r[1])] if r else None, e, U)
            r, e = attempt(lambda: V.ratio(prob, mu))
            result(c, 'py.ratio', {'t': 'rho', 'law': c['law']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'real.py.twolaw':
            r, e = attempt(lambda: VT.decide(json.load(open(os.path.join(root, c['file']))))['ratio'])
            result(c, 'py.twolaw', {'t': 'mixRho', 'tl': c['tl']}, [S(r[0]), S(r[1])] if r else None, e, U)
        elif op == 'py.main':                        # the lines the deciders PRINT (run-optq-ledger.py records verify_twolaw's)
            saved = sys.argv
            try:
                for mod, name, truths in ((V, 'verify_sumdiff.py', [{'t': 'rho', 'law': x} for x in c['laws']]),
                                          (VT, 'verify_twolaw.py', [{'t': 'mixRho', 'tl': c['tl']}])):
                    sys.argv = [name]
                    buf = io.StringIO()
                    with contextlib.redirect_stdout(buf):
                        rc = mod.main()
                    found = re.findall(r'ratio in \[([^,\]]+), ([^\]]+)\]', buf.getvalue())
                    if rc != 0 or len(found) != len(truths):
                        raise RuntimeError(name + ' main() returned %s with %d ratio lines' % (rc, len(found)))
                    for (lo, hi), t in zip(found, truths):
                        result(c, 'py.printed', t, [lo, hi], None, None, name=name + ' main(): "ratio in [...]"')
            finally:
                sys.argv = saved
        else:
            raise ValueError('unknown task ' + op)
    out.close()
    print(json.dumps({'python': sys.version.split()[0], 'executable': sys.executable, 'libmpdec': decimal.__libmpdec_version__,
                      'tasks': n_tasks, 'seconds': round(time.time() - t0, 1)}))


# ======================================================================================================================
# decide — every case in Arb (python-flint)
# ======================================================================================================================

PRECS = (256, 1024, 4096, 16384)
# DECLARED FINDINGS: each would name a class of misses this audit found and reported, in a module it does not edit, so
# the run stays green only while it still reproduces exactly where declared and nowhere else; when the module is fixed
# the entry stops reproducing and must be removed (the list only turns down). EMPTY since phase 2 (2026-10-19): the
# seventeen findings of the first run were fixed — they are kept, with their witnesses and the fixes, in
# tools/audit-entropy-arb-pin.json and written into the record as foundAtPin.
KNOWN = {'printed': {}, 'malformed': {}}
PIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audit-entropy-arb-pin.json')
CLASS = {'bf.digits': 'printed', 'bf.toDecimal': 'printed', 'fei.printed': 'printed', 'py.printed': 'printed',
         'bf.plnp>1': 'beyond', 'py.plnp>1': 'beyond'}
IMPL = [('bf.', 'instruments/bigfloat (+ instruments/sumdiff, instruments/optq/twolaw.js)'), ('py.', 'tools/verify_sumdiff.py, tools/verify_twolaw.py'),
        ('fei.', 'instruments/fei/fei.py'), ('rec.', 'certs/*.json (recorded)'), ('red:', 'planted')]


def op_class(op):
    if op.startswith('red:'):
        return 'red'
    if op.startswith('rec.'):
        return 'printed'
    return CLASS.get(op, 'arith')


class Undecidable(Exception):
    pass


def found_at_pin(problems):
    """the first run's findings, fixed since (tools/audit-entropy-arb-pin.json); a finding there that is also declared
    in KNOWN, or whose fix is unnamed, is a problem"""
    pin = json.load(open(PIN))
    for f in pin['findings']:
        key = (f['op'], f['name']) if f['class'] == 'printed' and (f['op'], f['name']) in KNOWN['printed'] else f.get('op') or f['name']
        if key in KNOWN[f['class']]:
            problems.append('a finding fixed at the pin is still declared in KNOWN: %s' % (key,))
        if not f.get('fixedIn'):
            problems.append('a finding at the pin names no fix: %s' % f['name'])
    return pin


def decide(src, out_path, meta):
    import flint
    from flint import arb, fmpq, fmpz, ctx
    if hasattr(sys, 'set_int_max_str_digits'):
        sys.set_int_max_str_digits(0)
    DEC = re.compile(r'^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$')
    INF, NINF, NAN = 'inf', '-inf', 'nan'
    P10 = {}

    def p10(k):
        if k not in P10:
            P10[k] = fmpz(10) ** k
        return P10[k]

    def q2(m, e):
        m, e = int(m), int(e)
        return fmpq(m << e) if e >= 0 else fmpq(m, 1 << -e)

    def Q(s):
        """an exact number from its crossing: m*2^e (bigfloat), n/d, or a decimal string (decimal's str, sumdiff's digits)"""
        s = s.strip()
        if '*2^' in s:
            m, e = s.split('*2^')
            return q2(m, e)
        if '/' in s:
            n, d = s.split('/')
            return fmpq(int(n), int(d))
        low = s.lower().lstrip('+')
        if low in ('infinity', 'inf'):
            return INF
        if low in ('-infinity', '-inf'):
            return NINF
        if 'nan' in low:
            return NAN
        m = DEC.match(s)
        if not m or not ((m.group(2) or '') + (m.group(3) or '')):
            raise ValueError('not a number: ' + s[:60])
        sign, ip, fp, ex = m.groups()
        v = int((ip or '') + (fp or ''))
        e = int(ex or 0) - len(fp or '')
        v = fmpz(-v if sign == '-' else v)
        return fmpq(v * p10(e)) if e >= 0 else fmpq(v, p10(-e))

    def ends(b):
        """the exact rational ends of an Arb ball"""
        if not b.is_finite():
            raise Undecidable('Arb returned a non-finite ball')
        mid, rad = q2(*b.mid().man_exp()), q2(*b.rad().man_exp())
        return mid - rad, mid + rad

    # ---- the laws, read by this file's own readers --------------------------------------------------------------
    laws, tls, feis = {}, {}, {}
    atoms_cache, ball_cache, fei_cache = {}, {}, {}

    def read_cert_file(path):
        d = json.load(open(path))
        if 'weights' in d:
            pts = [(int(w['x']), int(w['y']), fmpq(int(w['num']), int(w['den']))) for w in d['weights']]
        elif 'distribution_x_y_numden' in d:
            pts = [(int(x), int(y), fmpq(int(n), int(q))) for x, y, (n, q) in d['distribution_x_y_numden']]
        else:
            k = int(re.fullmatch(r'10\^(\d+)', d['denominator']).group(1))
            pts = [(int(x), int(y), fmpq(int(n), 10 ** k)) for x, y, n in d['distribution_x_y_num']]
        if sum((w for _, _, w in pts), fmpq(0)) != 1 or any(w <= 0 for _, _, w in pts):
            raise ValueError('the audit\'s reader: ' + path + ' is not a probability law')
        return pts

    def law_pts(law_id):
        L = laws[law_id]
        if 'pts_q' not in L:
            if 'file' in L:
                L['pts_q'] = read_cert_file(os.path.join(meta['root'], L['file']))
            else:
                den = int(L['den'])
                L['pts_q'] = [(int(x), int(y), fmpq(int(n), den)) for x, y, n in L['pts']]
        return L['pts_q']

    def tl_laws(tl_id):
        T = tls[tl_id]
        if 'laws_q' not in T:
            if 'file' in T:
                d = json.load(open(os.path.join(meta['root'], T['file'])))
                T['laws_q'] = [[(int(x), int(y), fmpq(int(n), int(q))) for (x, y), (n, q) in zip(L['points'], L['weights'])] for L in d['laws']]
                T['counts_q'] = [int(c) for c in d['counts']]
            else:
                T['laws_q'] = [[(int(x), int(y), fmpq(int(n), int(L['den']))) for x, y, n in L['pts']] for L in T['laws']]
                T['counts_q'] = [int(c) for c in T['counts']]
        return T['laws_q'], T['counts_q']

    def atoms(key, pts, form):
        k = (key, tuple(form))
        if k not in atoms_cache:
            a, b = form
            g = defaultdict(lambda: fmpq(0))
            for x, y, w in pts:
                g[a * x + b * y] += w
            atoms_cache[k] = list(g.values())
        return atoms_cache[k]

    def lnq(q):
        """ln of a positive rational as an Arb ball; near 1 through log1p of the exact q - 1, so ln(1 - 10^-3000) keeps its digits"""
        d = q - 1
        if 2 * abs(d) < 1:
            return arb(d).log1p()
        return arb(q).log()

    def H_ball(key, pts, form):
        k = (key, tuple(form), ctx.prec)
        if k not in ball_cache:
            s = arb(0)
            for q in atoms(key, pts, form):
                if q != 1:
                    s -= arb(q) * lnq(q)
            ball_cache[k] = s
        return ball_cache[k]

    def quotient(t, ms):
        """exact rational ends of T / max(M_i) from the balls' ends (every M_i > 0)"""
        tL, tH = ends(t)
        mE = [ends(m) for m in ms]
        mL, mH = max(e[0] for e in mE), max(e[1] for e in mE)
        if mL <= 0:
            raise Undecidable('the denominator is not separated from 0')
        return min(tL / mL, tL / mH), max(tH / mL, tH / mH)

    def forms_of(problem):
        return [(1, 0), (0, 1), (1, 1)] + ([(1, 2)] if problem == '3c' else [])

    def walsh(t):                                   # a_S = sum_x t(x) (-1)^{S.x}, by halves on the top bit
        if len(t) == 1:
            return t
        h = len(t) // 2
        a, b = walsh(t[:h]), walsh(t[h:])
        return [u + v for u, v in zip(a, b)] + [u - v for u, v in zip(a, b)]

    def fei_parts(fid):
        if fid not in fei_cache:
            F = feis[fid]
            art = json.load(open(os.path.join(meta['root'], F['file']))) if 'file' in F else json.loads(F['art'])
            n = int(art['n'])
            bits = bin(int(art['true_hex'], 16))[2:].zfill(1 << n)[::-1]
            a = walsh([-1 if ch == '1' else 1 for ch in bits])
            counts = defaultdict(int)
            I_num = 0
            for S, v in enumerate(a):
                if v:
                    counts[abs(v)] += 1
                    I_num += bin(S).count('1') * v * v
            fei_cache[fid] = (n, dict(counts), fmpq(I_num, 4 ** n))
        return fei_cache[fid]

    def fei_H(fid):
        """H = sum_S w_S log2(1/w_S), w_S = a_S^2/4^n, grouped by |a|: an exact rational when every |a| is a power of two"""
        n, counts, _ = fei_parts(fid)
        if all(k & (k - 1) == 0 for k in counts):
            return sum((fmpq(cnt * k * k, 4 ** n) * (2 * n - 2 * (k.bit_length() - 1)) for k, cnt in counts.items()), fmpq(0))
        s = arb(0)
        ln2 = arb(2).log()
        for k, cnt in counts.items():
            if k != 1 << n:
                s += arb(fmpq(cnt * k * k, 4 ** n)) * (2 * n - 2 * arb(fmpz(k)).log() / ln2)
        return s

    def pt(L, H, exact=False):
        return L, H, L, H, exact

    def truth(t):
        """(L1, H1, L2, H2, exact): the rational ends of the ball at the low end of the exact range (L1, H1) and at its high
        end (L2, H2) — one ball twice for a point value — or the exact range itself"""
        kind = t['t']
        if kind == 'rat':
            x = Q(t['x'])
            return pt(x, x, True)
        if kind == 'iv':
            a, b = Q(t['x'][0]), Q(t['x'][1])
            return a, a, b, b, True
        if kind == 'range':
            a0, a1 = Q(t['a'][0]), Q(t['a'][1])
            b0, b1 = Q(t['b'][0]), Q(t['b'][1])
            f = t['f']
            if f == 'add':
                lo, hi = a0 + b0, a1 + b1
            elif f == 'sub':
                lo, hi = a0 - b1, a1 - b0
            else:
                v = [x * y for x in (a0, a1) for y in (b0, b1)] if f == 'mul' else [x / y for x in (a0, a1) for y in (b0, b1)]
                lo, hi = min(v), max(v)
            return lo, lo, hi, hi, True
        if kind == 'ln':                               # increasing: the range is [ln a, ln b]
            a, b = Q(t['x'][0]), Q(t['x'][1])
            if a <= 0:
                raise Undecidable('ln at or below 0')
            return ends(lnq(a)) + ends(lnq(b)) + (False,)
        if kind == 'lnk':
            k = int(t['k'])
            return pt(fmpq(0), fmpq(0), True) if k == 1 else pt(*ends(arb(fmpz(k)).log()))
        if kind == 'ln2':
            return pt(*ends(arb(2).log()))
        if kind == 'plnp':
            q = Q(t['q'])
            if q == 1:
                return pt(fmpq(0), fmpq(0), True)
            return pt(*ends(-arb(q) * lnq(q)))
        if kind == 'H':
            return pt(*ends(H_ball(t['law'], law_pts(t['law']), t['form'])))
        if kind == 'rho':
            pts, prob = law_pts(t['law']), laws[t['law']]['problem']
            return pt(*quotient(H_ball(t['law'], pts, (1, -1)), [H_ball(t['law'], pts, f) for f in forms_of(prob)]))
        if kind in ('mixH', 'mixRho'):
            Ls, cs = tl_laws(t['tl'])
            n = sum(cs)
            mix = lambda f: sum((arb(fmpq(c, n)) * H_ball((t['tl'], i), L, f) for i, (c, L) in enumerate(zip(cs, Ls))), arb(0))   # noqa: E731
            if kind == 'mixH':
                return pt(*ends(mix(t['form'])))
            return pt(*quotient(mix((1, -1)), [mix(f) for f in forms_of('3c')]))
        if kind in ('feiH', 'feiRho'):
            _, _, I = fei_parts(t['f'])
            h = fei_H(t['f'])
            exact = isinstance(h, fmpq)
            L, H = (h, h) if exact else ends(h)
            if kind == 'feiH':
                return pt(L, H, exact)
            if I <= 1:
                raise Undecidable('I <= 1')
            return pt(L / (I - 1), H / (I - 1), exact)
        raise ValueError('unknown truth ' + kind)

    def judge(lo, hi, L1, H1, L2, H2):
        """'in' when lo <= the low end and the high end <= hi, both proved; 'out' when either is disproved; else None"""
        if lo is NAN or hi is NAN:
            return 'out'
        low_in = lo is NINF or (lo is not INF and lo <= L1)
        high_in = hi is INF or (hi is not NINF and H2 <= hi)
        if low_in and high_in:
            return 'in'
        if lo is INF or hi is NINF or (lo is not NINF and lo > H1) or (hi is not INF and hi < L2):
            return 'out'
        return None

    def inputs_of(t):
        """the inputs a truth spec names (a law, a two-law certificate, a Boolean function), so a witness reproduces alone"""
        if 'law' in t:
            L = laws[t['law']]
            return {k: L[k] for k in ('problem', 'file', 'pts', 'den', 'shape', 'enc') if k in L}
        if 'tl' in t:
            T = tls[t['tl']]
            return {k: T[k] for k in ('file', 'laws', 'counts', 'text') if k in T}
        if 'f' in t:
            F = feis[t['f']]
            return {k: F[k] for k in ('file', 'n', 'hex', 'shape') if k in F}
        return None

    def clip(o):
        if isinstance(o, str):
            return o if len(o) <= 240 else o[:160] + '...(' + str(len(o)) + ' chars)...' + o[-40:]
        if isinstance(o, list):
            return [clip(x) for x in o]
        if isinstance(o, dict):
            return {k: clip(v) for k, v in o.items()}
        return o

    def log2q(w):
        """log2 of a positive rational (math.log2 takes integers of any size)"""
        return math.log2(int(w.p)) - math.log2(int(w.q))

    def show(x):
        if isinstance(x, str):
            return x
        s = str(arb(x))
        return s if len(s) < 120 else s[:117] + '...'

    POINT = ('rat', 'plnp', 'H', 'rho', 'mixH', 'mixRho', 'feiH', 'feiRho', 'lnk', 'ln2')
    per = defaultdict(lambda: {'cases': 0, 'contained': 0, 'violations': 0, 'undecided': 0, 'refused': 0, 'retried': 0,
                               'byKind': defaultdict(int), 'widths': [], 'widest': (-1e9, None), 'violationsByName': defaultdict(int), 'casesByName': defaultdict(int), 'refusedBy': defaultdict(int), 'refusedOutsideRule': 0})
    witnesses = defaultdict(list)
    bad = []
    n_lines = 0
    for line in open(src):
        c = json.loads(line)
        n_lines += 1
        if 'op' not in c:
            if 'law' in c:
                laws[c['law']] = c
            elif 'tl' in c:
                tls[c['tl']] = c
            elif 'fei' in c:
                feis[c['fei']] = c
            continue
        op = c['op']
        if op == 'bad':
            bad.append(c)
            continue
        r = per[op]
        r['cases'] += 1
        r['byKind'][c.get('kind')] += 1
        r['casesByName'][c.get('name')] += 1
        if c['res'] is None:
            r['refused'] += 1
            r['refusedBy'][(c['threw'] or '?')[:70]] += 1
            if op in ('fei.H', 'fei.ratio'):           # the rule needs H > 0 and I > 1: a refusal outside it is the right answer
                n_, counts_, I_ = fei_parts(c['truth']['f'])
                r['refusedOutsideRule'] += set(counts_) == {1 << n_} or I_ <= 1
            if len(witnesses[op + ':refused']) < 5:
                witnesses[op + ':refused'].append({'truth': c['truth'], 'threw': c['threw']})
            continue
        lo, hi = Q(c['res'][0]), Q(c['res'][1])
        verdict, T = None, None
        for i, prec in enumerate(PRECS):
            ctx.prec = prec
            try:
                T = truth(c['truth'])
            except Undecidable:
                continue
            verdict = judge(lo, hi, *T[:4])
            if verdict or T[4]:
                break
        ctx.prec = PRECS[0]
        if verdict == 'in':
            r['contained'] += 1
            r['retried'] += i > 0
            t = c['truth']
            point = t['t'] in POINT or (t['t'] == 'ln' and t['x'][0] == t['x'][1]) or (t['t'] == 'range' and t['a'][0] == t['a'][1] and t['b'][0] == t['b'][1])
            u = c.get('u')
            mag = max(abs(T[0]), abs(T[3]))
            if u and point and not isinstance(lo, str) and not isinstance(hi, str) and mag > 0 and hi > lo:
                lg = log2q((hi - lo) / mag) + (u['b'] if 'b' in u else (u['d'] - 1) * math.log2(10))
                r['widths'].append(lg)
                if lg > r['widest'][0]:
                    r['widest'] = (lg, clip({'kind': c.get('kind'), 'truthSpec': c['truth'], 'u': u, 'res': c['res']}))
        elif verdict == 'out':
            r['violations'] += 1
            r['violationsByName'][c.get('name')] += 1
            if len(witnesses[op]) < 12:
                witnesses[op].append({'kind': c.get('kind'), 'name': c.get('name'), 'truthSpec': c['truth'], 'inputs': inputs_of(c['truth']), 'u': c.get('u'), 'res': c['res'],
                                      'exact': [show(T[0]), show(T[1])] if T[:2] == T[2:4] else {'lowEnd': [show(T[0]), show(T[1])], 'highEnd': [show(T[2]), show(T[3])]}})
        else:
            r['undecided'] += 1
            if len(witnesses[op + ':undecided']) < 5:
                witnesses[op + ':undecided'].append({'truthSpec': c['truth'], 'res': c['res']})

    # ---- the summary --------------------------------------------------------------------------------------------
    byop = {}
    for op in sorted(per):
        r = per[op]
        w = sorted(r.pop('widths'))
        widest = r.pop('widest')[1]
        vbn = {str(k): v for k, v in r.pop('violationsByName').items()}
        cbn = {str(k): v for k, v in r.pop('casesByName').items()}
        r['byKind'] = dict(r['byKind'])
        r['refusedBy'] = dict(r['refusedBy'])
        if op not in ('fei.H', 'fei.ratio'):
            r.pop('refusedOutsideRule')
        r['class'] = op_class(op)
        r['impl'] = next((v for k, v in IMPL if op.startswith(k)), '?')
        ulps = lambda lg: None if lg is None else (round(2 ** lg, 3) if lg < 60 else '2^%d' % round(lg))   # noqa: E731
        r['widthUlps'] = {'median': ulps(w[len(w) // 2] if w else None), 'p99': ulps(w[int(len(w) * 0.99)] if w else None), 'max': ulps(w[-1] if w else None), 'n': len(w),
                          'note': 'the enclosure width over |value| in units of the last place at the case\'s precision (2^-bits, or 10^-(digits-1)); point values only, ties of width 0 left out', 'widest': widest}
        if r['violations']:
            r['violationsByName'] = vbn
            r['casesByName'] = cbn
        byop[op] = r

    def tot(cls):
        rows = [r for r in byop.values() if r['class'] == cls]
        return {k: sum(r[k] for r in rows) for k in ('cases', 'contained', 'violations', 'undecided', 'refused')}
    arith, printed, beyond = tot('arith'), tot('printed'), tot('beyond')
    reds = {op: {'cases': r['cases'], 'violationsCaught': r['violations']} for op, r in byop.items() if r['class'] == 'red'}

    # ---- findings: printed misses and decided malformed inputs, against the declared list -------------------------
    findings, problems = [], []
    seen_known = set()
    for op, r in byop.items():
        if r['class'] != 'printed' or not r['violations']:
            continue
        for name, n in r.get('violationsByName', {}).items():
            key = (op, name) if (op, name) in KNOWN['printed'] else op
            why = KNOWN['printed'].get(key)
            findings.append({'class': 'printed', 'op': op, 'name': None if name == 'None' else name, 'misses': n, 'of': r['casesByName'][name], 'declared': why is not None, 'why': why,
                             'witness': next((w for w in witnesses[op] if str(w['name']) == name), None)})
            if why is None:
                problems.append('an undeclared printed miss: %s %s' % (op, name))
            else:
                seen_known.add(('printed', key))
    malformed = {'cases': 0, 'refused': 0, 'baselines': 0, 'baselinesDecided': 0, 'byImpl': defaultdict(lambda: {'cases': 0, 'refused': 0})}
    for b in bad:
        if not b['expectRefusal']:
            malformed['baselines'] += 1
            ok = b['res'] is not None
            malformed['baselinesDecided'] += ok
            if not ok:
                problems.append('a baseline did not decide: ' + b['name'] + ' (' + str(b['threw']) + ')')
            continue
        malformed['cases'] += 1
        imp = malformed['byImpl'][b['impl']]
        imp['cases'] += 1
        if b['res'] is None:
            malformed['refused'] += 1
            imp['refused'] += 1
        else:
            why = KNOWN['malformed'].get(b['name'])
            findings.append({'class': 'malformed', 'name': b['name'], 'impl': b['impl'], 'decided': b['res'], 'declared': why is not None, 'why': why})
            if why is None:
                problems.append('an undeclared malformed input decided: ' + b['name'])
            else:
                seen_known.add(('malformed', b['name']))
    malformed['byImpl'] = dict(malformed['byImpl'])
    for cls in ('printed', 'malformed'):
        for key in KNOWN[cls]:
            if (cls, key) not in seen_known:
                problems.append('a declared finding no longer reproduces (remove it from KNOWN): %s %s' % (cls, key))
    if arith['violations']:
        problems.append('%d arithmetic violations' % arith['violations'])
    if len(reds) < 2 or not all(r['violationsCaught'] for r in reds.values()):
        problems.append('a red control did not fire')

    rec = {
        'what': 'The entropy deciders\' arithmetic checked against Arb (python-flint): instruments/bigfloat as instruments/sumdiff and instruments/optq/twolaw.js call it, and the Python standard library\'s decimal as tools/verify_sumdiff.py, tools/verify_twolaw.py and instruments/fei/fei.py call it, each run through its REAL functions on seeded random and adversarial inputs and on the registry\'s own certificates; every enclosure required to contain the exact value, decided in Arb at 256 bits and up from the exact inputs (exactly, in FLINT\'s rationals, when the value is rational); every malformed input required to be refused; planted wrong functions required to be caught. Written by tools/audit-entropy-arb.js with tools/audit-entropy-arb.py.',
        'generated': __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(timespec='seconds'),
        'seconds': round(time.time() - meta['t0'] / 1000, 1), 'secondsJs': round(meta['jsSeconds'], 1), 'secondsPython': meta['py']['seconds'],
        'seed': meta['seed'], 'n': meta['n'], 'node': meta['node'],
        'python': {'impl': meta['py']['python'], 'libmpdec': meta['py']['libmpdec'], 'arb': sys.version.split()[0], 'pythonFlint': flint.__version__},
        'arbPrec': list(PRECS), 'implPrecision': {'bigfloat': 'bits per case (u.b): 128, 256, 512, 1024 as sumdiff/twolaw escalate; ln2 also 24..4096', 'verify_sumdiff/verify_twolaw': '120 digits', 'fei': '60 digits'},
        'modules': meta['modules'], 'inputs': meta['inputs'],
        'counts': {'cases': sum(r['cases'] for r in byop.values()), 'arithmetic': arith, 'printed': printed, 'beyondTheDoor': beyond,
                   'malformed': malformed['cases'], 'malformedRefused': malformed['refused'], 'baselines': malformed['baselines'], 'baselinesDecided': malformed['baselinesDecided']},
        'redControls': reds,
        'findings': findings,
        'byOp': byop,
        'malformed': dict(malformed, list=[{k: b[k] for k in ('impl', 'name', 'expectRefusal', 'threw', 'res')} for b in bad]),
        'witnesses': {k: v for k, v in witnesses.items() if v},
        'beyondTheDoor': 'bf.plnp>1 and py.plnp>1 feed the bare -p ln p routines a p > 1, which no door admits (sumdiff.door, verify_sumdiff.read and verify_twolaw.laws require a law summing to 1). They are a measurement of how load-bearing the door is, not a requirement: verify_sumdiff.entropy takes p_lo·(−ln_hi) as its lower end, which holds only while −ln p >= 0.',
        'foundAtPin': found_at_pin(problems),
        'problems': problems,
    }
    json.dump(rec, open(out_path, 'w'), indent=1)
    open(out_path, 'a').write('\n')
    a = arith
    print('entropy deciders vs Arb: %d cases — arithmetic %d: %d contained, %d VIOLATIONS, %d undecided, %d refused (fei: outside its rule, %d); printed %d: %d contained, %d misses; malformed %d/%d refused, baselines %d/%d decided'
          % (rec['counts']['cases'], a['cases'], a['contained'], a['violations'], a['undecided'], a['refused'],
             sum(r.get('refusedOutsideRule', 0) for r in byop.values()), printed['cases'], printed['contained'], printed['violations'],
             malformed['refused'], malformed['cases'], malformed['baselinesDecided'], malformed['baselines']))
    for op, r in byop.items():
        if r['class'] in ('arith', 'printed', 'beyond'):
            print('  %-8s %-18s %7d  contained %7d  violations %d  undecided %d  refused %d  width (ulps) median %s max %s'
                  % (r['class'], op, r['cases'], r['contained'], r['violations'], r['undecided'], r['refused'],
                     r['widthUlps']['median'], r['widthUlps']['max']))
    for op, r in reds.items():
        print('  RED %-26s planted: %d of %d cases caught — %s' % (op, r['violationsCaught'], r['cases'], 'fired' if r['violationsCaught'] else 'DID NOT FIRE'))
    for f in findings:
        print('  FINDING%s %s' % (' (declared)' if f['declared'] else '', json.dumps({k: f[k] for k in f if k in ('class', 'op', 'name', 'misses', 'of', 'impl', 'decided')}, ensure_ascii=False)))
    print('  found at the pin %s: %d findings, each fixed since; none declared now' % (rec['foundAtPin']['commit'][:8], len(rec['foundAtPin']['findings'])))
    for p in problems:
        print('  PROBLEM ' + p)
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    if sys.argv[1] == 'impl':
        impl(sys.argv[2], sys.argv[3], sys.argv[4])
    elif sys.argv[1] == 'decide':
        decide(sys.argv[2], sys.argv[3], json.loads(sys.argv[4]))
    else:
        sys.exit('usage: audit-entropy-arb.py impl|decide ...')
