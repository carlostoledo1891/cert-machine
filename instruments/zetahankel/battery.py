#!/usr/bin/env python3
"""battery.py — the gate on instruments/zetahankel (the Hankel-determinant irrationality method, ported
from frontier-apps 2026-10-05). cert-machine's own file, not a port. A few seconds; every build:

  1. the pins       every lifted file and every pinned source hashes to instruments/zetahankel/PROVENANCE.json
  2. the ledger     certs/zeta-hankel-ledger.json read by THIS file's own rule: each row's lifted value is
                    re-read from the lifted record and must equal what the ledger says it is; agree is
                    recomputed from the ball; margin = logP/h² and its ball recomputed; the headline is
                    the top-h row of its family; the counts and the verdict follow from the rows; the
                    p-adic accounting is recomputed from the two v_p profiles; the test2 log and every
                    file the ledger names hash to the ledger's pins; the class reading is labelled an
                    extrapolation and the race context unverified
  3. the re-run     every headline-family row with h <= 14 re-run from the lifted engine: P's fingerprint
                    exact, the engine's float bit-identical, the ball containing the ledger's value
  4. the cross-check   crosscheck.py (stdlib, no shared code) on its six instances: P coefficient by
                    coefficient and the content equal to the engine's, the ζ(3) enclosures intersecting
  RED controls, each must fire: a forged pin, a tampered ledger margin, a lifted value that is not the
                    record's, a perturbed moment (mu(t) off by one part in 10^6), a perturbed node constant
                    (1/(2a) off by one part in 10^6), a class reading relabelled a theorem.

Runs under instruments/zetahankel/.venv (python-flint 0.9.0), or instruments/erdos1/.venv if that is the one
present. No model is called, nothing is fetched.
Prints: "zetahankel battery: N pass, 0 fail, R/R red controls fired"."""
import sys, os, json, copy, hashlib, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import rerun as R                        # re-execs under the venv if FLINT is absent
import hankel, hankel2, scan2
import crosscheck as XC
from flint import fmpq

ROOT = R.ROOT
npass = nfail = 0; reds = []
def check(name, ok, detail=''):
    global npass, nfail
    npass += bool(ok); nfail += (not ok)
    print(f"  {'ok  ' if ok else 'FAIL'}  {name}" + (f"   [{detail}]" if detail else ''), flush=True)
def red(name, fired, detail=''):
    reds.append(bool(fired))
    print(f"  {'RED ' if fired else 'DEAD'}  {name}" + (f"   [{detail}]" if detail else ''), flush=True)
sha_bytes = lambda b: hashlib.sha256(b).hexdigest()

# ---- 1. the pins ---------------------------------------------------------------------------------------
PROV = json.load(open(os.path.join(HERE, 'PROVENANCE.json')))
def pins_ok(prov, reader):
    bad = [f['file'] for f in prov['files'] + prov['sources'] if sha_bytes(reader(f['file'])) != f['sha256']]
    return bad
read_repo = lambda f: open(os.path.join(ROOT, f), 'rb').read()
bad = pins_ok(PROV, read_repo)
check('every lifted file and pinned source hashes to its PROVENANCE pin', not bad,
      f"{len(PROV['files'])} files, {len(PROV['sources'])} sources" + (f"; drifted: {bad[:3]}" if bad else ''))
check('no lifted file is declared patched', all(not f['patched'] and f['sha256'] == f['sourceSha256'] for f in PROV['files']))
victim = PROV['files'][0]['file']
forged = bytearray(read_repo(victim)); forged[len(forged) // 2] ^= 1
red('a forged pin is refused (one bit flipped in ' + victim + ')',
    pins_ok(PROV, lambda f: bytes(forged) if f == victim else read_repo(f)) == [victim])

# ---- 2. the ledger, by this file's own rule -------------------------------------------------------------
L = json.load(open(R.LEDGER))
def lifted_of(record, key, idx, field):
    for line in open(os.path.join(ROOT, record)):
        d = json.loads(line)
        if d.get(key) == idx:
            return d[field]
    return None
def ledger_faults(L):
    f = []
    rowsets = [(F['record'], 'm', 'logP_at_X', F['rows']) for F in L['families'].values()] + \
              [(C['record'], 'n', 'logP_at_zeta', C['rows']) for C in L['calegari'].values()]
    nrows = nagree = 0
    for record, key, field, rows in rowsets:
        if R.sha_file(os.path.join(ROOT, record)) != next((F['record_sha256'] for F in list(L['families'].values()) + list(L['calegari'].values()) if F['record'] == record), None):
            f.append('record sha ' + record)
        for r in rows:
            nrows += 1
            lv = lifted_of(record, key, r[key], field)
            if lv is None or r['lifted']['logP'] != lv:
                f.append(f'lifted value {record} {key}={r[key]}')
            ag = lv is not None and r['logP_lo'] - R.TOL_LIFTED <= lv <= r['logP_hi'] + R.TOL_LIFTED
            if ag != r['agree']:
                f.append(f'agree flag {record} {key}={r[key]}')
            nagree += ag
            if not (r['logP_lo'] <= r['logP'] <= r['logP_hi']) or r['margin'] != r['logP'] / r['h'] ** 2 \
                    or not (r['margin_lo'] <= r['logP_lo'] / r['h'] ** 2 and r['logP_hi'] / r['h'] ** 2 <= r['margin_hi']) \
                    or not (r['margin_lo'] <= r['margin'] <= r['margin_hi']):
                f.append(f'margin/ball {record} {key}={r[key]}')
    for H in L['headline']:
        F = L['families'][H['key']]; top = max(F['rows'], key=lambda r: r['h'])
        if (H['h'], H['margin'], H['margin_lo'], H['margin_hi'], H['agree']) != (top['h'], top['margin'], top['margin_lo'], top['margin_hi'], top['agree']) \
                or H['liftedMargin'] != top['lifted']['logP'] / top['h'] ** 2:
            f.append('headline ' + H['key'])
        sign = 'negative' if H['margin_hi'] < 0 else 'positive' if H['margin_lo'] > 0 else 'undecided'
        if H['sign'] != sign:
            f.append('headline sign ' + H['key'])
    if (L['counts']['rowsRerun'], L['counts']['agree']) != (nrows, nagree):
        f.append('counts')
    ok_all = nagree == nrows and L['counts']['crosscheckAgree'] == L['counts']['crosscheck'] == len(L['crosscheck']['rows']) \
        and all(r['agree'] for r in L['crosscheck']['rows']) and L['padic']['profilesEqual'] and L['padic']['resEqual'] and L['test2']['enginesAgree']
    if L['verdict'] != ('AGREE' if ok_all else 'DISAGREE'):
        f.append('verdict')
    P = L['padic']; d = R.padic_derived(P['here']['5']['prof'], P['here']['7']['prof'], 60)
    if abs(d['ratio'] - P['derived']['ratio']) > 1e-12 or d['rows'] != P['derived']['rows'] or abs(d['smallPrimesExtra'] - P['derived']['smallPrimesExtra']) > 1e-9:
        f.append('padic derived')
    lp = json.load(open(os.path.join(ROOT, P['record'])))
    if any({q: v for q, v in lp[k]['prof'].items() if v} != P['here'][k]['prof'] for k in ('5', '7')) != (not P['profilesEqual']):
        f.append('padic profiles flag')
    for x in L['files']:
        if R.sha_file(os.path.join(ROOT, x['file'])) != x['sha256']:
            f.append('file pin ' + x['file'])
    if R.sha_file(os.path.join(ROOT, L['test2']['log'])) != L['test2']['log_sha256'] or not (L['test2']['maxRelErr'] <= 1e-24):
        f.append('test2')
    C = L['classReading']
    if C.get('status') != 'extrapolation' or 'NOT a theorem' not in C.get('statement', ''):
        f.append('class reading not labelled an extrapolation')
    if L['raceContext'].get('status') != 'unverified':
        f.append('race context not labelled unverified')
    return f
faults = ledger_faults(L)
check('the ledger re-reads clean by this file\'s own rule', not faults, '; '.join(faults[:4]) if faults else
      f"{L['counts']['rowsRerun']} rows re-run here, {L['counts']['agree']} agree, {L['counts']['bitIdentical']} bit-identical; verdict {L['verdict']}")
check('the ledger verdict is AGREE', L['verdict'] == 'AGREE')
T = copy.deepcopy(L); T['headline'][2]['margin'] += 0.01
red('a tampered ledger margin (ζ(7) headline + 0.01) is refused', any(x.startswith('headline') for x in ledger_faults(T)))
T = copy.deepcopy(L); T['families']['zeta5']['rows'][-1]['lifted']['logP'] -= 1e-6
red('a lifted value that is not the record\'s is refused', any(x.startswith('lifted value') for x in ledger_faults(T)))
T = copy.deepcopy(L); T['classReading']['status'] = 'theorem'
red('a class reading relabelled a theorem is refused', 'class reading not labelled an extrapolation' in ledger_faults(T))

# ---- 3. the re-run of the small rows --------------------------------------------------------------------
def rerow(spec, m):
    weight, k, typ, a, b, r = spec
    den, num = scan2.nodes(typ, a * m, b * m, r)
    num = [x for x in num if x[1] > 0]
    res, P, D = hankel2.run(k, weight, den, num)
    ball, _ = R.ball_log(P, lambda: hankel2.const_ball(k, weight, den[0].q != 1))
    return res, P, ball
def row_matches(r, res, P, ball):
    return R.fingerprint(P) == r['P_sha256'] and res['logP_at_X'] == r['logP'] and ball['lo'] <= r['logP'] <= ball['hi']
n = ok = 0
for key in ('zeta3', 'zeta5', 'zeta7', 'catalan'):
    F = L['families'][key]
    for r in F['rows']:
        if r['h'] > 14: continue
        res, P, ball = rerow(tuple(F['spec']), r['m']); n += 1; ok += row_matches(r, res, P, ball)
check('every headline row with h <= 14 re-runs to the ledger: P exact, the float bit-identical, inside the ball', ok == n, f'{ok}/{n} rows')
# reds: perturb the functional, re-run ζ(3) at m = 2 (h = 6), and the ledger must refuse the result
spec3 = tuple(L['families']['zeta3']['spec']); r3 = next(r for r in L['families']['zeta3']['rows'] if r['m'] == 2)
orig_mono = hankel2.mu_mono
hankel2.mu_mono = lambda e, k, kind: orig_mono(e, k, kind) * (1 + fmpq(1, 10 ** 6) if e == 1 else 1)
try:
    res, P, ball = rerow(spec3, 2); fired = not row_matches(r3, res, P, ball)
finally:
    hankel2.mu_mono = orig_mono
red('a perturbed moment (mu(t) × (1 + 10^-6)) breaks agreement with the ledger', fired)
orig_node = hankel2.node_value
def bent(a, k, kind):
    al, be = orig_node(a, k, kind)
    return al, be + fmpq(1, 10 ** 6) / (2 * a)
hankel2.node_value = bent
try:
    res, P, ball = rerow(spec3, 2); fired = not row_matches(r3, res, P, ball)
finally:
    hankel2.node_value = orig_node
red('a perturbed node constant (1/(2a) off by 10^-6) breaks agreement with the ledger', fired)

# ---- 4. the cross-check ---------------------------------------------------------------------------------
ok = 0
for inst, row in zip(XC.INSTANCES, L['crosscheck']['rows']):
    x = XC.compute(inst)
    weight, k, typ, a, b, r, m = inst
    den, num = scan2.nodes(typ, a * m, b * m, r)
    res, P, D = hankel2.run(k, weight, den, [y for y in num if y[1] > 0])
    c = hankel.content(D)
    good = [int(q.p) for q in P.coeffs()] == x['P'] and (int(c.p), int(c.q)) == (x['content'].numerator, x['content'].denominator) \
        and XC.fingerprint(x['P']) == row['P_sha256_stdlib'] == row['P_sha256_engine']
    if 'vlo' in x:
        good = good and x['logP_lo'] - R.TOL_LIFTED <= res['logP_at_X'] <= x['logP_hi'] + R.TOL_LIFTED
    ok += good
check('crosscheck.py (stdlib, shared-nothing) gives the engine\'s P, content and ζ(3) value on its instances', ok == len(XC.INSTANCES), f'{ok}/{len(XC.INSTANCES)}')

print(f"zetahankel battery: {npass} pass, {nfail} fail, {sum(reds)}/{len(reds)} red controls fired")
sys.exit(0 if nfail == 0 and all(reds) else 1)
