#!/usr/bin/env python3
"""judge.py -- the blinking light: two-sided bounds on g(3/10, 2/25), decided from the pinned run.

Pre-registered in notes/blinking-light-preregistration-2026-11-19.md (committed before this file existed).
The question and the phenomenon are Dobrynin and Stroujkova's (arXiv:2611.24898). Decided here:
  U0  the start: the paper's four-state ring (sigma encloses 2 ln 3) and the eight-state record (g <= 0.497436)
  U1  an 84-state network with every rate rational reproduces C1 = 3/10, C2 = 2/25 exactly; two deciders agree
  U2  a 156-state network with two free rates: exactly one point of its box reproduces them; g <= 0.37712826127
  L1  the lower-bound certificate cert222g satisfies its finite conditions over the whole diamond, and its bound is
      l1 C1 + l2 C2 + mu exactly; the theorems that turn L1 into g >= 0.3657254 are NOT decided here
and eight controls that must be refused. Deciders: lamp.py (the run's checker, written by the control room before the
run), rational.py and lower.py (written for this record from the theorems' text and the format, without opening any
program of either track; see CHECKERS.md).

usage:  python3 instruments/blinking-light/judge.py --write     decide everything, write certs/blinking-light.json
        python3 instruments/blinking-light/judge.py --check     re-hash the pins, decide the quick statements again
"""
import copy, hashlib, importlib, json, os, sys, time
from fractions import Fraction as Q

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CORPUS = os.path.join(ROOT, 'corpus', 'blinking-light')
RUN = os.path.join(CORPUS, 'run')
RECORD = os.path.join(ROOT, 'certs', 'blinking-light.json')
PREREG = 'notes/blinking-light-preregistration-2026-11-19.md'
TARGET = (Q(3, 10), Q(2, 25))

SAYS_FIRST = ('The question and the phenomenon are Dobrynin and Stroujkova\'s (arXiv:2611.24898, 18 November 2026): a '
              'time-reversible binary record that still requires dissipation, and the least dissipation over all finite '
              'networks left open. This record decides a two-sided bound on one constant of a snapshot version of it. The '
              'upper bound is decided: a network that reproduces the two numbers exactly. The lower bound is a certificate '
              'whose finite conditions are decided here; the two theorems that turn it into a bound were proved by one AI '
              'model and read once by the other, and are not decided.')

NOT_DECIDED = [
    'Theorem D (weak duality, run/claude/lifting.md section 3) and Theorem C with Lemma S (locality, run/claude/locality.md), '
    'which turn L1 into g(3/10, 2/25) >= 0.3657254: proved by the Claude track, re-derived by the GPT track (g19, g39), READ ONCE',
    'Theorem L (the convex lifting): READ ONCE on C1 < 1, false as printed at C1 = 1 (g47, k54); INTERIOR',
    'the earlier lower bounds of the GPT track (GENBOUND, JOINT, POTENTIAL, AFFINE: READ ONCE; AUXCLOCK: unread)',
    'the conjecture g(3/10, 2/25) = 0.3769 and the optimality of a two-state telegraph plus a ring',
    'the function R(m) and g(C1, C2) away from the target',
    'the continuous-record question of the paper, any statement about a physical system or a finite recording',
    'novelty beyond the scout\'s reading of the literature (corpus/targets.json, row one-bit-dissipation-2026-11)',
]

PIN_FILES = ['instruments/blinking-light/judge.py', 'instruments/blinking-light/lamp.py',
             'instruments/blinking-light/rational.py', 'instruments/blinking-light/lower.py',
             'corpus/blinking-light/MANIFEST.json', 'corpus/blinking-light/series.json', PREREG,
             'corpus/blinking-light/run/inherited/baseline/ring.json', 'corpus/blinking-light/run/inherited/baseline/best8.json',
             'corpus/blinking-light/run/gpt/rational-mixture-84.json', 'corpus/blinking-light/run/claude/mix156.json',
             'corpus/blinking-light/run/claude/cert222g.json', 'corpus/blinking-light/run/claude/cert222f.json',
             'corpus/blinking-light/run/control/tests/CERT222G-k51.out', 'corpus/blinking-light/run/control/tests/CERT222G-k52.out']


def mod(name):
    """a decider of this folder, imported by its own name (lower.py's worker processes import it again by that name)"""
    if HERE not in sys.path: sys.path.insert(0, HERE)
    return importlib.import_module(name)


def load(rel): return json.load(open(os.path.join(RUN, rel)))
def sha(p): return hashlib.sha256(open(os.path.join(ROOT, p), 'rb').read()).hexdigest()
def pins(): return {p: sha(p) for p in PIN_FILES if os.path.exists(os.path.join(ROOT, p))}


def lampd(d):
    """the run's checker: (verdict, summary, [sigma_lo, sigma_hi] as 30-digit outward strings or None)"""
    L = mod('lamp')
    try:
        return L.decide(d)
    except L.Refuse as e:
        return 'REFUSED', str(e), None


def up(x, digits=12):
    """an exact rational printed with `digits` decimals, rounded up (for an upper end)"""
    import decimal
    x = Q(x); c = decimal.Context(prec=60, rounding=decimal.ROUND_CEILING)
    return str(c.divide(decimal.Decimal(x.numerator), decimal.Decimal(x.denominator)).quantize(decimal.Decimal(1).scaleb(-digits), rounding=decimal.ROUND_CEILING))


def dn(x, digits=12):
    """an exact rational printed with `digits` decimals, rounded down (for a lower end)"""
    import decimal
    x = Q(x); c = decimal.Context(prec=60, rounding=decimal.ROUND_FLOOR)
    return str(c.divide(decimal.Decimal(x.numerator), decimal.Decimal(x.denominator)).quantize(decimal.Decimal(1).scaleb(-digits), rounding=decimal.ROUND_FLOOR))


def two_ln3_inside(sig):
    from mpmath import mp, mpf, log
    mp.dps = 60
    v = 2 * log(mpf(3))
    return mpf(sig[0]) <= v <= mpf(sig[1]), mp.nstr(v, 20)


# ------------------------------------------------------------------------------------------------ statements
def U0():
    t = time.time()
    w1, s1, g1 = lampd(load('inherited/baseline/ring.json'))
    inside, v = two_ln3_inside(g1) if g1 else (False, None)
    w2, s2, g2 = lampd(load('inherited/baseline/best8.json'))
    ok = w1 == 'CERTIFIED' and inside and w2 == 'CERTIFIED' and Q(g2[1]) / 2 <= Q('0.497436')
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED',
            'text': 'the paper\'s four-state ring reproduces C1 = 3/10 and C2 = 2/25 exactly with sigma in [%s, %s], which holds 2 ln 3 = %s '
                    '(g = ln 3); the eight-state ring that was the record when the run began has g <= %s' % (
                        g1[0][:16] if g1 else '?', g1[1][:16] if g1 else '?', v, up(Q(g2[1]) / 2, 9) if g2 else '?'),
            'ring': {'verdict': w1, 'summary': s1}, 'best8': {'verdict': w2, 'summary': s2}, 'seconds': round(time.time() - t, 1)}


def U1():
    t = time.time()
    net = load('gpt/rational-mixture-84.json')
    w1, s1, g1 = lampd(net)
    R = mod('rational').decide(copy.deepcopy(net))
    agree = (w1 == 'CERTIFIED' and R.get('verdict') == 'CERTIFIED' and
             (Q(R['C1']), Q(R['C2'])) == TARGET and Q(R['r']) == 2 and Q(g1[0]) <= Q(R['sigma_hi']) and Q(R['sigma_lo']) <= Q(g1[1]))
    return {'verdict': 'CERTIFIED' if agree else 'REFUTED',
            'text': 'the 84-state network with every rate rational reproduces C1 = 3/10 and C2 = 2/25 exactly, by two deciders that agree: '
                    'lamp gives sigma in [%s, %s], rational gives [%s, %s]; so g <= %s' % (
                        g1[0][:16] if g1 else '?', g1[1][:16] if g1 else '?', R.get('sigma_lo', '?')[:16], R.get('sigma_hi', '?')[:16], R.get('g_hi', '?')),
            'lamp': {'verdict': w1, 'summary': s1}, 'rational': R, 'seconds': round(time.time() - t, 1)}


def U2():
    t = time.time()
    w, s, g = lampd(load('claude/mix156.json'))
    ok = w == 'CERTIFIED' and Q(g[1]) / 2 <= Q('0.37712826127')
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED',
            'text': 'in the box of the 156-state network exactly one value of the two free rates reproduces C1 = 3/10 and C2 = 2/25 exactly '
                    '(Krawczyk, 256-bit outward-rounded intervals), and there sigma is in [%s, %s]; hence g(3/10, 2/25) <= 0.37712826127' % (
                        g[0][:16] if g else '?', g[1][:16] if g else '?'),
            'lamp': {'verdict': w, 'summary': s, 'sigma': g}, 'seconds': round(time.time() - t, 1)}


def L1():
    t = time.time()
    cert = load('claude/cert222g.json')
    R = mod('lower').check(copy.deepcopy(cert), *TARGET)
    obj = Q(cert['l1']) * TARGET[0] + Q(cert['l2']) * TARGET[1] + Q(cert['mu'])     # the arithmetic, done here as well
    ok = R.get('verdict') == 'PROVED' and R.get('bound_matches') is True and obj == Q(cert['bound'])
    conc = concordance()
    return {'verdict': 'CERTIFIED' if ok else 'REFUTED',
            'text': 'cert222g satisfies (D1) for both lamp values, (LOC) and continuity over the whole diamond, with no symmetry assumed '
                    '(%s boxes), and l1 (3/10) + l2 (2/25) + mu = %s = %s... exactly, its stated bound' % (R.get('boxes'), obj, dn(obj, 10)),
            'lower': R, 'objective': str(obj), 'concordance': conc, 'seconds': round(time.time() - t, 1)}


def concordance():
    """the claimants' own verifiers, run by the control room in the run (k51, k52): concordance, not the decision"""
    a = open(os.path.join(RUN, 'control/tests/CERT222G-k51.out')).read()
    b = open(os.path.join(RUN, 'control/tests/CERT222G-k52.out')).read()
    return {'author (claude/verify_local.py, k51)': 'VERDICT: PROVED' in a and '1828627119/5000000000' in a,
            'reader (gpt/review_local_certificate.py, k52)': 'PASS: 61 strips' in b and '1828627119/5000000000' in b}


# ------------------------------------------------------------------------------------------------ controls
def field_eval(cert, h, d):
    """p, q, psi and their h- and d-derivatives at a point strictly inside a strip, from the format's definition alone"""
    knots = [Q(x) for x in cert['knots']]
    na, nk, npsi = cert['na'], cert['nk'], cert['npsi']
    F = [[Q(x) for x in row] for row in cert['functions']]
    s = -1 if h < 0 else 1
    a = abs(h)
    j = max(i for i in range(len(knots) - 1) if knots[i] <= a)
    if knots[j] == a and a != 0: raise ValueError('witness on a knot line')
    t0, t1 = knots[j], knots[j + 1]

    def lin(row, odd):                               # value and h-derivative of a function given at the knots
        slope = (row[j + 1] - row[j]) / (t1 - t0)
        val = row[j] + slope * (a - t0)
        if odd: return s * val, slope                  # f(-a) = -f(a): value odd, derivative even
        return val, s * slope                          # f(-a) = f(a): value even, derivative odd
    A = [lin(F[k], True) for k in range(na)]
    K = [lin(F[na + k], False) for k in range(nk)]
    P = [lin(F[na + nk + k], True) for k in range(npsi)]
    p = sum(A[k][0] * d ** (2 * k) for k in range(na)); p_h = sum(A[k][1] * d ** (2 * k) for k in range(na))
    p_d = sum(A[k][0] * 2 * k * d ** (2 * k - 1) for k in range(1, na))
    q = sum(K[k][0] * d ** (2 * k + 1) for k in range(nk)); q_h = sum(K[k][1] * d ** (2 * k + 1) for k in range(nk))
    q_d = sum(K[k][0] * (2 * k + 1) * d ** (2 * k) for k in range(nk))
    ps_h = sum(P[k][1] * d ** (2 * k + 1) for k in range(npsi))
    ps_d = sum(P[k][0] * (2 * k + 1) * d ** (2 * k) for k in range(npsi))
    return p, q, p_h, p_d, q_h, q_d, ps_h, ps_d


def condition_at(cert, h, d, f):
    """the least of (D1) and the three PSD minors at (h, d, f), each computed exactly; returns (name, value)"""
    p, q, p_h, p_d, q_h, q_d, ps_h, ps_d = field_eval(cert, h, d)
    l1, l2, mu = Q(cert['l1']), Q(cert['l2']), Q(cert['mu'])
    D1 = 2 * p * (h - f) + 2 * q * d - l1 * f * h - l2 * (h * h - d * d) - mu
    x1, x2 = 2 * q - ps_h, 2 * p - ps_d
    a, b, c = 8 * p_h - x1 * x1, 4 * (p_d + q_h) - x1 * x2, 8 * q_d - x2 * x2
    return min([('D1', D1), ('LOC a', a), ('LOC c', c), ('LOC det', a * c - b * b)], key=lambda x: x[1])


def control_lower(name, cert, why):
    R = mod('lower').check(copy.deepcopy(cert), *TARGET)
    refused = not (R.get('verdict') == 'PROVED' and R.get('bound_matches') is True)
    route = None
    W = R.get('witness')
    if W:
        try:
            h, d = Q(W['h']), Q(W['d']); f = 1 if W.get('f') in (None, 'None') else int(W['f'])       # a matrix witness has no lamp value
            assert abs(h) + abs(d) <= 1
            cname, v = condition_at(cert, h, d, f)
            route = 'at (h, d, f) = (%s, %s, %+d) the judge computes %s = %s exactly' % (h, d, f, cname, '%.6g' % float(v))
            route_ok = v < 0
        except Exception as e:
            route, route_ok = 'the witness could not be evaluated here: %s' % e, False
    else:
        route_ok = None
    return {'control': name, 'why': why, 'refused': refused, 'lower': {k: R.get(k) for k in ('verdict', 'bound_matches', 'witness', 'boxes', 'seconds')},
            'route': route, 'routeConfirms': route_ok}


def controls():
    K = []
    # KU1a: one rate raised by 10^-6 -- both deciders must refuse
    net = load('gpt/rational-mixture-84.json'); e = net['rates'][0]
    e[2] = str(Q(e[2]) + Q(1, 10 ** 6))
    w, s, _ = lampd(copy.deepcopy(net)); R = mod('rational').decide(copy.deepcopy(net))
    K.append({'control': 'KU1a: the 84-state network with the rate %d->%d raised by 10^-6' % (e[0], e[1]),
              'refused': w != 'CERTIFIED' and R.get('verdict') != 'CERTIFIED',
              'text': 'lamp: %s (%s); rational: %s, C1 = %s..., C2 = %s...' % (w, s[:120], R.get('verdict'), str(R.get('C1'))[:24], str(R.get('C2'))[:24])})
    # KU1b: the claim below the enclosure
    net = load('gpt/rational-mixture-84.json'); net['claim'] = {'sigma_at_most': '0.75575246'}
    w, s, _ = lampd(copy.deepcopy(net)); R = mod('rational').decide(copy.deepcopy(net))
    K.append({'control': 'KU1b: the 84-state network claiming sigma <= 0.75575246', 'refused': w != 'CERTIFIED' and R.get('verdict') != 'CERTIFIED',
              'text': 'lamp: %s; rational: %s' % (w, R.get('verdict'))})
    # KU2a: the 156-state network claiming sigma below its enclosure
    net = load('claude/mix156.json'); net['claim'] = {'sigma_at_most': '0.7542565225'}
    w, s, _ = lampd(net)
    K.append({'control': 'KU2a: the 156-state network claiming sigma <= 0.7542565225', 'refused': w != 'CERTIFIED', 'text': 'lamp: %s; %s' % (w, s[-160:])})
    # KU2b: the box moved by 10^-20; the route: one box holding both proves a single zero (and U2 puts it in the original box)
    net = load('claude/mix156.json'); box = [[Q(lo), Q(hi)] for lo, hi in net['box']]; eps = Q(1, 10 ** 20)
    moved = copy.deepcopy(net); moved['box'] = [[str(lo + eps), str(hi + eps)] for lo, hi in box]
    w, s, _ = lampd(moved)
    union = copy.deepcopy(net); union['box'] = [[str(lo - eps), str(hi + eps)] for lo, hi in box]; union.pop('claim', None)   # holds both, the zero near its centre
    wu, su, _ = lampd(union)
    K.append({'control': 'KU2b: the 156-state network with its box moved by 10^-20 (the box is 2 x 10^-45 wide)', 'refused': w != 'CERTIFIED',
              'text': 'lamp on the moved box: %s (%s)' % (w, s[:140]),
              'route': 'a box holding both, the original widened by 10^-20 on each side: %s (%s); a single zero there, which U2 places in the original box, disjoint from the moved one' % (wu, su[:110]),
              'routeConfirms': wu == 'CERTIFIED'})
    # KL1a-KL1d: certificates that must be refused
    K.append(control_lower('KL1a: cert222f, the unscaled search output', load('claude/cert222f.json'), 'the author reports it refused'))
    c = load('claude/cert222g.json'); c['mu'] = str(Q(c['mu']) + Q(1, 1000)); c['bound'] = str(Q(c['bound']) + Q(1, 1000))
    K.append(control_lower('KL1b: cert222g with mu raised by 1/1000 (and its bound with it)', c, 'the least (D1) slack seen in the run was about 1.9e-4'))
    c = load('claude/cert222g.json'); c['bound'] = str(Q(c['bound']) + Q(1, 10 ** 7))
    r = control_lower('KL1c: cert222g with its stated bound raised by 10^-7', c, 'l1, l2, mu unchanged')
    r['route'] = 'l1 (3/10) + l2 (2/25) + mu = %s, not %s' % (Q(c['l1']) * TARGET[0] + Q(c['l2']) * TARGET[1] + Q(c['mu']), c['bound'])
    r['routeConfirms'] = Q(c['l1']) * TARGET[0] + Q(c['l2']) * TARGET[1] + Q(c['mu']) != Q(c['bound'])
    K.append(r)
    c = load('claude/cert222g.json'); kn = [Q(x) for x in c['knots']]; j = kn.index(Q(3, 10)); row = c['na'] + c['nk']
    c['functions'][row][j] = str(Q(c['functions'][row][j]) + 1)
    K.append(control_lower('KL1d: cert222g with P_0 raised by 1 at the knot h = 3/10', c, 'a slope of 100 in psi beside that knot'))
    return K


def series_checked():
    """every value of the figure's series against the pinned message it cites"""
    S = json.load(open(os.path.join(CORPUS, 'series.json')))
    msgs = {}
    for f in ('gpt', 'claude', 'control'):
        for line in open(os.path.join(RUN, 'chat', f + '.jsonl')):
            m = json.loads(line); msgs[m['id']] = m
    bad = [e['claim'] for side in ('upper', 'lower') for e in S[side]
           if e['msg'] and not (msgs[e['msg']]['at'][11:19] == e['at'] and e['value'] in (msgs[e['msg']].get('text') or ''))]
    return {'entries': sum(1 for side in ('upper', 'lower') for e in S[side]), 'mismatched': bad}


def decide_all(only=None):
    t = time.time(); S = {}
    for name, fn in (('U0', U0), ('U1', U1), ('U2', U2), ('L1', L1)):
        if only and name not in only: continue
        S[name] = fn(); print('%s %s  %s' % (name, S[name]['verdict'], S[name]['text'][:150]), flush=True)
    K = [] if only else controls()
    for k in K: print('control %s: %s' % (k['control'][:60], 'refused' if k['refused'] else 'MISSED'), flush=True)
    return S, K, round(time.time() - t, 1)


def main():
    a = sys.argv[1:]
    if a[:1] == ['--only']:
        decide_all(set(a[1:])); return
    if a[:1] == ['--check']:
        rec = json.load(open(RECORD)); now = pins()
        moved = [p for p in rec['pins'] if now.get(p) != rec['pins'][p]]
        if moved: print('REFUSED: these files changed since the record was written: ' + ', '.join(moved)); sys.exit(1)
        quick = {'U0': U0(), 'L1': L1()}
        R = mod('rational').decide(load('gpt/rational-mixture-84.json'))
        quick['U1 (rational alone)'] = {'verdict': 'CERTIFIED' if R.get('verdict') == 'CERTIFIED' and (Q(R['C1']), Q(R['C2'])) == TARGET else 'REFUTED'}
        bad = [k for k in ('U0', 'L1') if quick[k]['verdict'] != rec['statements'][k]['verdict']]
        if quick['U1 (rational alone)']['verdict'] != rec['statements']['U1']['verdict']: bad.append('U1')
        if series_checked()['mismatched']: bad.append('series')
        print('pins intact (%d files); decided again now: %s; the record: %s; controls refused %d of %d' % (
            len(now), ', '.join('%s %s' % (k, v['verdict']) for k, v in quick.items()),
            ', '.join('%s %s' % (k, v['verdict']) for k, v in rec['statements'].items()),
            sum(k['refused'] for k in rec['controls']), len(rec['controls'])))
        sys.exit(1 if bad else 0)
    if a[:1] == ['--write']:
        S, K, secs = decide_all()
        gup = Q(S['U2']['lamp']['sigma'][1]) / 2 if S['U2']['verdict'] == 'CERTIFIED' else None
        rec = {'what': 'Two-sided bounds on the least dissipation g(3/10, 2/25) of a hidden finite-state network whose binary lamp, '
                       'read at Poisson times of rate 2, has C1 = 3/10 and C2 = 2/25: networks decided as upper bounds, and the finite '
                       'conditions of a lower-bound certificate, with the controls that must be refused.',
               'saysFirst': SAYS_FIRST, 'preregistration': PREREG, 'decidedOn': time.strftime('%Y-%m-%d', time.gmtime()),
               'source': {'paper': 'A. V. Dobrynin and A. Stroujkova, When Time-Reversible Sensor Records Require Hidden Dissipation, arXiv:2611.24898 v1 (18 Nov 2026)',
                          'run': 'multitrack run 3, blinking-light, 2026-11-19 11:04-17:48 UTC; GPT track gpt-6.2-astra (Codex, effort xhigh), Claude track claude-fable-5-2 (Claude Code, effort high), control room claude-opus-5-5 (Claude Code)'},
               'interval': {'upper': {'g_at_most': '0.37712826127', 'exact': None if gup is None else up(gup, 12), 'standing': 'DECIDED (U2)'},
                            'lower': {'g_at_least': '0.3657254238', 'exact': S['L1'].get('objective'),
                                      'standing': 'its finite conditions CERTIFIED (L1); Theorems D and C, which make it a bound, READ ONCE and not decided'},
                            'start': {'g_at_least': '0.02', 'g_at_most': '0.497436'}},
               'theorems': 'NOT DECIDED HERE: Theorems D and C were proved by the Claude track and re-derived by the GPT track; no machine and no reader outside the two families has checked them',
               'statements': S, 'controls': K, 'controlsMissed': [k['control'] for k in K if not k['refused']],
               'routesNotConfirming': [k['control'] for k in K if k.get('routeConfirms') is False],
               'series': series_checked(), 'notDecided': NOT_DECIDED,
               'plants': {'posted': 2, 'caught': {'gpt': '2 of 2', 'claude': '2 of 2'}, 'files': 'corpus/blinking-light/private/'},
               'pins': pins(), 'environment': {'python': sys.version.split()[0], 'mpmath': __import__('mpmath').__version__}, 'seconds': secs}
        json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False)
        print('\nwritten: certs/blinking-light.json  (%s; controls refused %d of %d; %.0f s)' % (
            ', '.join('%s %s' % (k, v['verdict']) for k, v in S.items()), sum(k['refused'] for k in K), len(K), secs))
        return
    print(__doc__)


if __name__ == '__main__':
    main()
