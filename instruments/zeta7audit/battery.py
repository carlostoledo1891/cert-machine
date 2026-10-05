#!/usr/bin/env python3
"""battery.py — the gate on certs/zeta7-anand-audit.json (the audit of Anand's "Zeta 7 is Irrational" and of
issue #1 on gmDevi/zeta-7-21-lean). cert-machine's own file. About 15 s; every build:

  1. the pins        every committed source hashes to instruments/zeta7audit/PROVENANCE.json; the cached ones
                     (Fauzan's paper, the Lean clone) too when present; every instrument file to the record's pins
  2. the outer integral   re-derived here: Table 5's integral equals the printed (122); I_out from (54), (58),
                     (59), (62) under both readings equals the record and is NOT the printed value; the record's
                     affine pieces re-verified piece by piece by the certifying evaluator; the last row; Fauzan's
                     printed 127751/96000 reproduced by both of his routes (the calibration)
  3. the finite-K routes   the exact integer sums at n = 100, 1000 and the arb prime sum at n = 1000 recomputed
  4. the constants   (121) from (64)-(69); A0 = Fauzan's A* = his I_out + (5.18) + (5.16); the (85) tail bound and
                     Fauzan's (5.16) by the same function; I(rho) both ways and C* in arb
  5. the margins     every scenario recomputed from its components; the printed chain; the signs; the cutoff
  6. the verdicts    each verdict word follows from the numbers it names, and the scope stays the proof route:
                     Theorem 1.1 REFUSED (not refuted), the issue credited to its third-party author
  7. the measured family   n = 1, 2 re-run through instruments/zetahankel/hankel.py: P's fingerprint, the ball,
                     Lemma 2.3, Proposition 4.6, Proposition 6.3; the record's pin on measure.json
  8. the Lean census  re-run at the pinned commit when the clone is present
  RED controls, each must fire: a forged pin, a tampered I_out in the record, a perturbed constant in (59)
                     (9 -> 9 + 10^-6), Table 5's last row "corrected", a perturbed constant in Fauzan's (4.14),
                     a forged affine piece, (118) relabelled CERTIFIED, the theorem itself called refuted, a forged
                     fingerprint in the measured record.
Prints "zeta7audit battery: N pass, 0 fail, R/R red controls fired"; exits nonzero on any FAIL or DEAD.
usage: python3 instruments/zeta7audit/battery.py   (re-execs under instruments/zetahankel/.venv)"""
import sys, os, json, copy, hashlib, math
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
VENV = os.path.join(ROOT, 'instruments', 'zetahankel', '.venv', 'bin', 'python')
try:
    import flint  # noqa
except ImportError:
    if os.path.exists(VENV) and os.path.realpath(sys.executable) != os.path.realpath(VENV):
        os.execv(VENV, [VENV] + sys.argv)
    print('zeta7audit battery: python-flint is not importable; run `make zetahankel-venv`')
    sys.exit(2)
sys.path.insert(0, HERE)
sys.set_int_max_str_digits(0)
from fractions import Fraction as Q
from flint import arb, ctx, fmpq
import pwaff, formulas as F, inner as INNER
import decide as D
import measure as MEAS

npass = nfail = 0; reds = []
def check(name, ok, detail=''):
    global npass, nfail
    npass += bool(ok); nfail += (not ok)
    print(f"  {'ok  ' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ''), flush=True)
def red(name, fired, detail=''):
    reds.append(bool(fired))
    print(f"  {'RED ' if fired else 'DEAD'}  {name}" + (f"   [{detail}]" if detail else ''), flush=True)
def note(name):
    print(f"  skip  {name}", flush=True)
sha = lambda b: hashlib.sha256(b).hexdigest()
readf = lambda p: open(os.path.join(ROOT, p), 'rb').read()
q = lambda s: Q(s['q'] if isinstance(s, dict) else s)

PROV = json.load(open(os.path.join(HERE, 'PROVENANCE.json')))
REC = json.load(open(D.OUT))

# ---- 1. the pins ----------------------------------------------------------------------------------------
def pin_faults(prov, reader):
    bad = []
    for s in prov['sources']:
        if sha(reader(s['file'])) != s['sha256']:
            bad.append(s['file'])
    return bad
bad = pin_faults(PROV, readf)
check('every committed source hashes to its PROVENANCE pin', not bad, f"{len(PROV['sources'])} sources" + (f'; drifted: {bad}' if bad else ''))
victim = PROV['sources'][0]['file']
forged = bytearray(readf(victim)); forged[len(forged) // 2] ^= 1
red('a forged pin is refused (one bit flipped in the paper PDF)', pin_faults(PROV, lambda f: bytes(forged) if f == victim else readf(f)) == [victim])
for c in PROV['cache']:
    p = os.path.join(ROOT, c['file'])
    if os.path.exists(p):
        check('cached source hashes to its pin: ' + os.path.basename(c['file']), sha(readf(c['file'])) == c['sha256'])
    else:
        note('cached source absent (git-ignored): ' + c['file'])
for f in REC['files']:
    if f['file'].endswith('battery.py') or f['file'].endswith('decide.py'):
        continue                                   # these two are pinned below against the live tree, after edits
    check('instrument file hashes to the record\'s pin: ' + os.path.basename(f['file']), sha(readf(f['file'])) == f['sha256'])
live = {f['file']: f['sha256'] for f in REC['files']}
check('decide.py and battery.py are the ones that wrote and gate this record',
      all(sha(readf(k)) == live.get(k) for k in ['instruments/zeta7audit/decide.py', 'instruments/zeta7audit/battery.py']),
      'rerun decide.py after editing either')

# ---- 2. the outer integral --------------------------------------------------------------------------------
O = REC['outer']
tab = pwaff.integrate_pieces(F.ANAND_TABLE5)
check('Table 5 integrates to the printed (122), exactly', tab == F.ANAND['Iout'] == q(O['table5']['printed122']) and O['table5']['equal'])
R2, p2 = pwaff.integrate(F.anand_T_R2, F.Y0, F.Y1)
R1, p1 = pwaff.integrate(F.anand_T_R1, F.Y0, F.Y1)
def record_faults(rec):
    """The record's decided values against the ones recomputed here (one rule for the green check and the red)."""
    o = rec['outer']; f = []
    for k, v in (('R2', R2), ('R1', R1)):
        if q(o['formula'][k]['value']) != v:
            f.append('I_out ' + k)
    if q(o['table5']['integral']) != tab or q(o['lastRow']['delta']) != Q(289, 800) - Q(-629, 50):
        f.append('Table 5')
    if q(rec['inner']['fromDefinitions']) != F.ANAND['inner'] or q(rec['constants']['A0']['printed87']) != F.ANAND['A0']:
        f.append('constants')
    return f
rf = record_faults(REC)
check('I_out under both readings, Table 5, its last row, (121) and A0 equal the record', not rf, f'R2 {R2}, R1 {R1}' + (f'; {rf}' if rf else ''))
check('the issue\'s value 453803/288000 is reading R2', R2 == Q(453803, 288000))
check('neither reading gives the printed (122); both are positive', R2 != F.ANAND['Iout'] and R1 != F.ANAND['Iout'] and R1 > 0 and R2 > 0)
check('the scalar from Legendre equals the printed form of (73)', pwaff.integrate(F.anand_T_R2_legendre, F.Y0, F.Y1)[0] == R2)

def verify_pieces(f, pieces):
    """Each stored piece re-evaluated on its own cell by the certifying evaluator: no branch may split, and the
    affine form must be the stored one; the pieces must tile [1/3, 37/20]."""
    def on(lo, hi, b, c, depth=0):
        # a stored piece may be the merge of cells whose branches differ but whose affine forms agree:
        # where a branch flips inside, both sides must carry the stored form
        try:
            v = f(pwaff.Aff.y(pwaff.Cell(lo, hi)))
        except pwaff.Split as s:
            if depth > 60:
                return f'({lo}, {hi}): too many splits'
            return on(lo, s.y, b, c, depth + 1) or on(s.y, hi, b, c, depth + 1)
        if (v.c0, v.c1) != (b, c):
            return f'({lo}, {hi}): evaluator gives {v.c0} + {v.c1} y, stored {b} + {c} y'
        return None
    prev = F.Y0
    for pc in pieces:
        lo, hi, b, c = Q(pc['lo']), Q(pc['hi']), Q(pc['b']), Q(pc['c'])
        if lo != prev:
            return f'gap at {lo}'
        err = on(lo, hi, b, c)
        if err:
            return err
        prev = hi
    return None if prev == F.Y1 else 'does not reach 37/20'
e2 = verify_pieces(F.anand_T_R2, O['formula']['R2']['pieces'])
check('the record\'s R2 pieces are each proved affine on their cell and tile the range', e2 is None, e2 or f"{len(O['formula']['R2']['pieces'])} pieces")
e1 = verify_pieces(F.anand_T_R1, O['formula']['R1']['pieces'])
check('the record\'s R1 pieces likewise', e1 is None, e1 or '')
forged_pcs = copy.deepcopy(O['formula']['R2']['pieces'])
a_, b_ = forged_pcs[0], forged_pcs.pop(1)
a_['hi'] = b_['hi']
red('a forged affine piece (two merged into one) is refused', verify_pieces(F.anand_T_R2, forged_pcs) is not None)
last, plast = pwaff.integrate(F.anand_T_R2, 1, Q(37, 20))
check('on [1, 37/20] the integrand is 37/20 - y under both readings (gamma = 0 for p > K, d = 0)',
      plast == [(Q(1), Q(37, 20), Q(37, 20), Q(-1))] and pwaff.integrate(F.anand_T_R1, 1, Q(37, 20))[0] == last == Q(289, 800)
      and q(O['lastRow']['formulaIntegral']) == last and q(O['lastRow']['tableIntegral']) == Q(-629, 50))
fz = F.FAUZAN['Iout']
check('calibration: Fauzan\'s printed I_out reproduced from his (4.14) and from his printed (5.8)-(5.10), and his Table 4',
      pwaff.integrate(F.fauzan_T_from_gamma, F.Y0, F.Y1)[0] == fz == pwaff.integrate(F.fauzan_T_printed_R0, F.Y0, F.Y1)[0]
      == pwaff.integrate_pieces(F.FAUZAN_TABLE4) and O['fauzan']['allEqual'])

# red: a perturbed constant in (59): 9 -> 9 + 10^-6 on y <= 1, i.e. + 10^-6 (1 - y)
_orig = F.anand_neg_gamma
def _pert(y):
    v = _orig(y)
    return v if pwaff.above(y.cell, 1) else v + Q(1, 10 ** 6) * (1 - y)
F.anand_neg_gamma = _pert
try:
    R2p = pwaff.integrate(F.anand_T_R2, F.Y0, F.Y1)[0]
finally:
    F.anand_neg_gamma = _orig
red('a perturbed constant in (59) (9 -> 9 + 10^-6) moves I_out off the record', R2p != q(O['formula']['R2']['value']), f'moved by {float(R2p - R2):.3e}')
# red: Fauzan's (4.14) perturbed the same way must stop reproducing his printed value
_origf = F.fauzan_neg_gamma
def _pertf(y):
    v = _origf(y)
    return v if pwaff.above(y.cell, 1) else v + Q(1, 10 ** 6) * (1 - y)
F.fauzan_neg_gamma = _pertf
try:
    fzp = pwaff.integrate(F.fauzan_T_from_gamma, F.Y0, F.Y1)[0]
finally:
    F.fauzan_neg_gamma = _origf
red('the calibration is live: Fauzan\'s (4.14) with 7 -> 7 + 10^-6 no longer gives his printed 127751/96000', fzp != fz)
# red: Table 5 with its last row corrected no longer integrates to the printed (122)
t5c = F.ANAND_TABLE5[:-1] + [(Q(1), Q(37, 20), Q(37, 20), Q(-1))]
red('Table 5 with its last row corrected no longer gives the printed (122) — the equality is the printed table\'s',
    pwaff.integrate_pieces(t5c) != F.ANAND['Iout'], f'it gives {float(pwaff.integrate_pieces(t5c)):.6f}')

# ---- 3. the finite-K routes -------------------------------------------------------------------------------
FK = {r['n']: r for r in REC['finiteK']['rows']}
for n in (100, 1000):
    ia = D.integer_sum(n, F.anand_Lp)
    ifz = D.integer_sum(n, F.fauzan_Lp)
    check(f'exact integer sum at n = {n} (K = {40 * n}) recomputed: Anand and Fauzan', ia == q(FK[n]['anandIntegerSum']) and ifz == q(FK[n]['fauzanIntegerSum']),
          f'Anand {float(ia):.6f} vs limit {float(R2):.6f}; Fauzan {float(ifz):.6f} vs {float(fz):.6f}')
check('the integer sums close on the limits at rate 1/K (n = 100 -> 10000)',
      all(abs(FK[n]['anandIntegerSumMinusLimit']) < 0.1 / n and abs(FK[n]['fauzanIntegerSumMinusLimit']) < 0.1 / n for n in FK))
pa, _ = D.prime_sum(1000, F.anand_Lp, D.primes_upto(2 * 37 * 1000))
check('the arb prime sum at n = 1000 recomputed (the outer part of log m_{K,M}/K^2)', pa[0] <= FK[1000]['anandPrimeSum'][1] and FK[1000]['anandPrimeSum'][0] <= pa[1], str(pa))
check('every prime sum is positive, far from the printed -15.28', all(FK[n]['anandPrimeSum'][0] > 1 for n in FK))

# ---- 4. the constants ---------------------------------------------------------------------------------------
iv, _ = INNER.inner_integral()
check('(121) from (64)-(69), exactly, equals the printed value and the record', iv == F.ANAND['inner'] == q(REC['inner']['fromDefinitions']))
C = REC['constants']
fs = F.FAUZAN['Iout'] + F.FAUZAN['inner'] + F.FAUZAN['tail']
check('A0 (87) is Fauzan\'s A* (5.19), and equals his I_out + (5.18) + (5.16)', F.ANAND['A0'] == F.FAUZAN['Astar'] == fs and C['A0']['equalsFauzanAstar'] and C['A0']['equalsFauzanSum'])
tb = F.tail_bound_85(20, F.LAM, F.anand_P(20), F.ANAND['P_mean'], F.anand_C(20), F.ANAND['C_bound'], F.ANAND['Q_hi'])
ftb = F.tail_bound_85(20, F.LAM, F.fauzan_P(20), F.FAUZAN['P_mean'], Q(0), F.FAUZAN['C_bound'], F.FAUZAN['Q_hi'])
check('the (85) tail bound at T = 20 recomputed; the same function returns Fauzan\'s printed (5.16)',
      tb == q(C['tail85']['bound']) and ftb == F.FAUZAN['tail'] and F.anand_P(20) == Q(74, 3) and F.anand_C(20) == 0, f'{float(tb):.6f}')
old = ctx.prec; ctx.prec = 200
try:
    Ls = [Q(x, 10 ** 12) for x in D.TABLE1_L]; cs = [Q(x, 10 ** 12) for x in D.TABLE1_C]
    S = [Q(0)]
    for c in cs:
        S.append(S[-1] + c)
    lg = lambda x: (D.A(x) / 4).log()
    I110 = sum((D.A(S[j + 1] ** 2 - S[j] ** 2) * lg(Ls[j]) for j in range(16)), arb(0))
    Inest = sum((D.A(cs[i]) * D.A(cs[j]) * lg(Ls[min(i, j)]) for i in range(16) for j in range(16)), arb(0))
    ov = lambda b, x: b[0] <= float(x.upper()) and float(x.lower()) <= b[1]
    check('I(rho) by the printed (110) is the printed -3.1433; the nested energy is -1.9482 (both re-run in arb)',
          ov(C['U']['I110asPrinted'], I110) and ov(C['U']['Inested'], Inest) and abs(float(I110.mid()) - float(F.ANAND['I_rho_decimal'])) < 1e-14)
    check('the sum lambda M0 - I(rho) + C* with the nested energy is below its rational upper bound and below 44/25',
          q(C['U']['sumNestedRationalUpper']) > Q(C['U']['sumNested'][1]) and q(C['U']['sumNestedRationalUpper']) < F.ANAND['U'])
finally:
    ctx.prec = old

# ---- 5. the margins -----------------------------------------------------------------------------------------
M = REC['margins']
pc = M['printedChain']
check('the printed chain is internally consistent: A200, A100000 recompute exactly from A0, I_out, (121)',
      F.anand_AM(200, F.ANAND['A0'], F.ANAND['Iout'], F.ANAND['inner']) == F.ANAND['A200'] and
      F.anand_AM(100000, F.ANAND['A0'], F.ANAND['Iout'], F.ANAND['inner']) == F.ANAND['A100000'] and pc['A200equal'] and pc['A100000equal'])
def scen_faults(scens):
    f = []
    for s in scens:
        iv_, av, uv = q(s['IoutValue']), q(s['A0Value']), q(s['UValue'])
        a200 = F.anand_AM(200, av, iv_, F.ANAND['inner']) + uv
        b0 = av + iv_ + F.ANAND['inner'] + uv
        if a200 != q(s['A200plusU']) or b0 != q(s['B0plusU']) or s['negative118'] != (a200 < 0) or q(s['decayPerN2']) != 1600 * a200:
            f.append(s['key'])
    return f
sf = scen_faults(M['scenarios'])
check('every margin scenario recomputed from its components', not sf, f"{len(M['scenarios'])} scenarios" + (f'; wrong: {sf}' if sf else ''))
src = {'printed': F.ANAND['Iout'], 'R2': R2, 'R1': R1}
check('each scenario\'s I_out is the one its label names', all(q(s['IoutValue']) == src[s['Iout']] for s in M['scenarios'] if s['Iout'] in src))
dec = [s for s in M['scenarios'] if s['Iout'] in ('R2', 'R1') and s['U'] != 'measured']
check('A200 + U > 0 and B0 + U > 0 in every decided scenario (both readings, printed or corrected A0 and U)',
      all(q(s['A200plusU']) > 0 and q(s['B0plusU']) > 0 for s in dec) and q(M['decidedMinB0plusU']) == min(q(s['B0plusU']) for s in dec),
      f"min A200+U {M['decidedMinA200plusU']['dec'][:7]}, min B0+U {M['decidedMinB0plusU']['dec'][:7]}")
disc = Q(11549, 720) ** 2 - 4 * 9 * F.LAM * 44
check('no cutoff M rescues it: A_M > B0 for every M > 0 (negative discriminant)', disc < 0 and M['anyCutoff']['AMexceedsB0ForEveryM'])
tampered = copy.deepcopy(REC)
tq = Q(tampered['outer']['formula']['R2']['value']['q']) + Q(1, 288000)
tampered['outer']['formula']['R2']['value']['q'] = f'{tq.numerator}/{tq.denominator}'
red('a tampered I_out in the record (+1/288000) is refused by the same rule', record_faults(tampered) == ['I_out R2'])

# ---- 6. the verdicts ---------------------------------------------------------------------------------------
def verdict_faults(rec):
    f = []
    V = {v['id']: v for v in rec['verdicts']}
    need = {'table5-is-the-integral': 'CERTIFIED', 'issue-point-1': 'CERTIFIED', 'issue-point-2': 'CERTIFIED', 'issue-point-3': 'CERTIFIED',
            'issue-final': 'CERTIFIED', 'paper-122': 'REFUTED', 'table5-last-row': 'REFUTED', 'paper-121': 'CERTIFIED', 'paper-96': 'CERTIFIED',
            'paper-118': 'REFUTED', 'paper-119': 'REFUTED', 'paper-thm12': 'REFUTED', 'paper-thm11': 'REFUSED', 'paper-cor13': 'REFUSED',
            'paper-prop46': 'PARTIAL', 'paper-prop63': 'PARTIAL', 'lean-statement': 'PARTIAL'}
    for k, w in need.items():
        if k not in V or V[k]['verdict'] != w:
            f.append(f'{k}: {V.get(k, {}).get("verdict")} != {w}')
    if rec['verdict'] != 'REFUTED' or 'not the theorem' not in rec['verdictLine'] or 'untouched' not in rec['verdictLine']:
        f.append('the overall verdict must refute the route and leave the theorem untouched')
    if 'open' not in rec['scope'] or not any('open' in x for x in rec['notDecided']):
        f.append('the scope must say ζ(7)\'s irrationality is open')
    if 'scope' not in V.get('paper-thm12', {}) or 'not the asymptotic statement' not in V['paper-thm12']['scope']:
        f.append('Theorem 1.2: only the derivation is refuted')
    if rec['issue']['author'] != 'huntrontrakkr' or rec['issue']['authorIsThisLab']:
        f.append('the issue is credited to its third-party author')
    return f
vf = verdict_faults(REC)
check('every verdict word is the one its numbers give; the theorem is REFUSED, not refuted; the issue is credited to huntrontrakkr', not vf, '; '.join(vf))
bad118 = copy.deepcopy(REC)
next(v for v in bad118['verdicts'] if v['id'] == 'paper-118')['verdict'] = 'CERTIFIED'
red('(118) relabelled CERTIFIED is refused', bool(verdict_faults(bad118)))
over = copy.deepcopy(REC)
next(v for v in over['verdicts'] if v['id'] == 'paper-thm11')['verdict'] = 'REFUTED'
over['verdictLine'] = 'ζ(7) is not proved irrational; the theorem is refuted.'
red('an overreach — "the theorem is refuted" — is refused', bool(verdict_faults(over)))

# ---- 7. the measured family -------------------------------------------------------------------------------
MR = json.load(open(D.MEASURE))
check('the measured record hashes to the audit record\'s pin', sha(open(D.MEASURE, 'rb').read()) == REC['measured']['sha256'])
check('the engine the measurement used is the pinned one', sha(readf(MR['engine']['file'])) == MR['engine']['sha256'])
byn = {r['n']: r for r in MR['rows']}
def meas_faults(rowrec, fresh):
    f = []
    if fresh['P_sha256'] != rowrec['P_sha256']:
        f.append('P fingerprint')
    if not (fresh['logP'][0] <= rowrec['logP'][1] and rowrec['logP'][0] <= fresh['logP'][1]):
        f.append('log P ball')
    for k in ('lemma23_leading_coefficient', 'prop63_holds'):
        if fresh[k] != rowrec[k]:
            f.append(k)
    if [(v['p'], v['vp_content'], v.get('prop46')) for v in fresh['vp']] != [(v['p'], v['vp_content'], v.get('prop46')) for v in rowrec['vp']]:
        f.append('v_p profile')
    return f
for n in (1, 2):
    fr = MEAS.measure(n)
    mf = meas_faults(byn[n], fr)
    check(f'n = {n} (K = {40 * n}, h = {37 * n}) re-run: P exact, log P(ζ(7)) in the ball, Lemma 2.3, Prop 4.6, Prop 6.3 as recorded', not mf,
          f"log P/K^2 = {fr['logP_per_K2'][0]:.6f}; {fr['secs']} s" + (f'; {mf}' if mf else ''))
    if n == 1:
        fake = copy.deepcopy(byn[1]); fake['P_sha256'] = fake['P_sha256'][::-1]
        red('a forged fingerprint in the measured record is refused', bool(meas_faults(fake, fr)))
check('the measured margins are positive at n = 1, 2, 3, and Prop 4.6 holds at every prime tested',
      all(r['logP_per_K2'][0] > 0 and all(v['prop46'] is not False for v in r['vp']) for r in MR['rows']) and len(MR['rows']) >= 3)
check('at every prime in (K, 2h], v_p(cont Delta_K) = 0 — where Table 5\'s last row would need about 15K',
      all(v['vp_content'] == 0 for r in MR['rows'] for v in r['vp'] if v['p'] > r['K']))

# ---- 8. the Lean census -----------------------------------------------------------------------------------
if os.path.isdir(D.LEAN):
    LC = D.lean_census(D.LEAN)
    check('the Lean clone is at the pinned commit', LC['commit'] == PROV['leanRepository']['commit'] == REC['lean']['commit'], LC['commit'][:12])
    check('the Lean census re-run equals the record (1 sorry, the Challenge stub; 0 axiom, 0 native_decide)',
          LC['counts'] == REC['lean']['counts'] and LC['counts']['sorry'] == 1 and LC['sorryIsTheChallengeStub'] and LC['counts']['axiom declaration'] == 0
          and LC['counts']['native_decide'] == 0 and LC['mainTheorem'] == REC['lean']['mainTheorem'])
    for f in PROV['leanRepository']['files']:
        if sha(open(os.path.join(D.LEAN, f['file']), 'rb').read()) != f['sha256']:
            check('Lean file hashes to its pin: ' + f['file'], False)
            break
    else:
        check('every quoted Lean file hashes to its pin', True, f"{len(PROV['leanRepository']['files'])} files")
else:
    note('the Lean clone is absent (git-ignored): census not re-run — clone gmDevi/zeta-7-21-lean at the pinned commit into corpus/sources/zeta7-anand/.cache/')

fired = sum(reds)
print(f"zeta7audit battery: {npass} pass, {nfail} fail, {fired}/{len(reds)} red controls fired")
sys.exit(0 if nfail == 0 and fired == len(reds) else 1)
