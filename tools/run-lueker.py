#!/usr/bin/env python3
"""run-lueker.py — the registry's C_31 replayed: Lueker's automaton M_h rebuilt from the paper alone
(instruments/lueker/mh.py, the reference; instruments/lueker/mh.c, the fast implementation held to it),
calibrated on Lueker's own table for h = 2..8, run at h = 9 and h = 10 with OUR witness vectors, and the
registry's two printed bounds (0.825101 at h = 9, 0.824120 at h = 10, both asterisked) decided.
Writes certs/lueker-replay.json. Standard library only.

usage:
  python3 tools/run-lueker.py DATA_DIR         DATA_DIR holds keys_hH.bin, table_hH.bin, v_hH.bin and hH.log for
                                               H = 9 and 10, produced by `mh build` and `mh eigen` (hours); the
                                               runner compiles mh.c itself, re-runs every h ≤ 8 from nothing,
                                               re-runs the certificate pass at 9 and 10 from the stored vectors,
                                               re-derives sampled transitions in Python, and decides.
  python3 tools/run-lueker.py --check          re-derive everything that needs no large file (the reference at
                                               h = 2..4, every decision from the record's own hex values, the
                                               red controls, the pins) and compare with the record; exit 1 on
                                               any difference.

Words: CERTIFIED — our certificate (our automaton, our vector, outward rounding) reaches the printed bound;
REFUSED — it does not reach it (the claim may still hold), or an input is malformed; REFUTED — the claimant's
certified λ lies below our certified lower bound on the spectral radius, which no positive vector can do.
"""
import sys, os, re, json, time, hashlib, subprocess, shutil, platform, datetime, struct
from fractions import Fraction
from decimal import Decimal, ROUND_CEILING, ROUND_FLOOR, localcontext

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'instruments', 'lueker'))
import mh  # noqa: E402

RECORD = os.path.join(ROOT, 'certs', 'lueker-replay.json')
SRC = os.path.join(ROOT, 'instruments', 'lueker')
PINS_DIR = os.path.join(ROOT, 'corpus', 'optconst-queue', 'c31-2026-10-21')
PAPER = {
    'title': 'Improved bounds on the average length of longest common subsequences',
    'author': 'George S. Lueker', 'journal': 'J. ACM 56(3), Article 17 (2009)', 'doi': '10.1145/1516512.1516519',
    'readAs': "the author's extended version dated 2008-12-18 (41 pages), Wayback Machine capture of 2009-02-05; "
              "its Theorem 2, Figure 8 and Figure 9 are the journal's Theorem 3.3, Figure 7 and Table II",
    'url': 'https://web.archive.org/web/20090205160100id_/http://www.ics.uci.edu/~lueker/papers/lcs/lcs.pdf',
    'sha256': 'c662fc3b247307437876ec075da9ca376e4ca90de314a3a2b867d757c1692a7e',
}
# Lueker's table of upper bounds (Figure 9 of the extended version, Table II of the journal), as printed.
LUEKER = [(2, 7, '0.2118', '0.131204211', '0.845855'), (3, 98, '0.2422', '0.177752610', '0.839250'),
          (4, 1020, '0.2642', '0.217017510', '0.835072'), (5, 10160, '0.2828', '0.254100606', '0.831910'),
          (6, 89960, '0.2980', '0.287155609', '0.829530'), (7, 780368, '0.3104', '0.316022744', '0.827727'),
          (8, 6419109, '0.3209', '0.341832259', '0.826280')]
CLAIMANT_ACCEPTED_H8 = 91508397        # "91,508,397 accepted transitions at h = 8", the claimant's README


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 24), b''):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def hexf(s):
    return Fraction(float.fromhex(s))


def dec_up(x, k):
    """An upper bound printed at k places, rounded UP, so the printed digits never sit below the value they stand for.
    x is a Fraction (an exact double) or a Decimal."""
    with localcontext() as c:
        c.prec = 120
        v = Decimal(x.numerator) / Decimal(x.denominator) if isinstance(x, Fraction) else Decimal(x)
        return str(v.quantize(Decimal(1).scaleb(-k), rounding=ROUND_CEILING))


def dec_down(x, k):
    """A lower bound printed at k places, rounded DOWN."""
    with localcontext() as c:
        c.prec = 120
        v = Decimal(x.numerator) / Decimal(x.denominator) if isinstance(x, Fraction) else Decimal(x)
        return str(v.quantize(Decimal(1).scaleb(-k), rounding=ROUND_FLOOR))


def nowz():
    return datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')


# ---------------------------------------------------------------- the decision
def decide(z_hex, lam_hex, printed, claimant_lam_hex=None, rho_lower_hex=None):
    """Decide the printed upper bound from a certificate (z, λ) — both exact doubles — with the bound evaluated
    outward. Returns a dict with the word and why."""
    out = {'z': z_hex, 'lambda': lam_hex, 'printed': printed}
    try:
        z, lam = hexf(z_hex), hexf(lam_hex)
    except (ValueError, OverflowError):
        out.update(verdict='REFUSED', why='z or λ is not a finite double'); return out
    if not (0 < z < Fraction(1, 2)):
        out.update(verdict='REFUSED', why='z outside (0, 1/2): Theorem 2 needs 0 < z < 1/k with k = 2'); return out
    if not (0 < lam < 1):
        out.update(verdict='REFUSED', why='λ outside (0, 1): Theorem 2 needs λ(z) in (0, 1)'); return out
    lo, hi = mh.bound_from(z, lam)
    out['bound'] = [f'{lo:.40f}', f'{hi:.40f}']
    out['boundUp'] = dec_up(hi, 10)
    if rho_lower_hex is not None and claimant_lam_hex is not None:
        cl, rl = hexf(claimant_lam_hex), hexf(rho_lower_hex)
        out['claimantLambda'] = claimant_lam_hex
        out['claimantLambdaMinusOurs'] = f'{float(cl - lam):.3e}'
        out['claimantLambdaAboveOurLowerBound'] = cl >= rl
        if cl < rl:
            out.update(verdict='REFUTED', why=f'the claimant\'s certified λ = {float(cl):.17g} is below our certified lower '
                       f'bound {float(rl):.17g} on the spectral radius of A_z: no positive vector satisfies A_z v ≤ λ v')
            return out
    if hi <= Decimal(printed):
        out.update(verdict='CERTIFIED', why=f'γ₂ ≤ {dec_up(hi, 12)} by our certificate, at or below the printed {printed}')
    else:
        out.update(verdict='REFUSED', why=f'our certificate gives γ₂ ≤ {dec_up(hi, 12)}, above the printed {printed}: not reached by this certificate')
    return out


# ---------------------------------------------------------------- the binary
def compile_mh(data):
    cc = shutil.which('clang') or shutil.which('gcc') or sys.exit('no C compiler')
    flags = ['-O2', '-ffp-model=strict'] if 'clang' in cc else ['-O2', '-frounding-math', '-fno-fast-math']
    exe = os.path.join(data, 'mh-runner')
    cmd = [cc] + flags + ['-o', exe, os.path.join(SRC, 'mh.c'), '-lpthread', '-lm']
    subprocess.run(cmd, check=True, capture_output=True)
    ver = subprocess.run([cc, '--version'], capture_output=True, text=True).stdout.split('\n')[0]
    return exe, ' '.join(os.path.relpath(c, ROOT) if c.startswith(ROOT) else c for c in cmd), ver


def run(exe, *args, log=None):
    r = subprocess.run([exe] + [str(a) for a in args], capture_output=True, text=True)
    if log is not None:
        log.append({'cmd': ' '.join(str(a) for a in args), 'stderr_tail': r.stderr.strip().split('\n')[-1] if r.stderr.strip() else ''})
    return r


def kv(line):
    """'h=8 states=6419109 ... seconds=8.8' → dict."""
    return dict(m.split('=', 1) for m in line.split() if '=' in m)


def parse_certify(text):
    d = {}
    for line in text.split('\n'):
        if line.startswith('h='):
            d.update(kv(line.split(' (')[0]))
        for key in ('lambda_cert', 'lambda_free', 'ratio_min_down'):
            m = re.match(rf'{key}=(\S+) \(([^)]+)\)', line)
            if m:
                d[key] = m.group(1); d[key + 'Decimal'] = m.group(2)
        if line.startswith('weights_up:'):
            d['weightsUp'] = line.split(':', 1)[1].split()
        if line.startswith('seconds='):
            d['seconds'] = float(line.split('=')[1])
    for key in ('lambda_cert', 'lambda_free', 'ratio_min_down'):
        if key not in d:
            raise SystemExit('certify output lacks ' + key)
    return d


def sample_check(exe, h, data, k, seed):
    """K random states' rows by the binary (δ re-run from the key), re-derived by the Python reference."""
    r = run(exe, 'sample', h, data, k, seed)
    if r.returncode:
        raise SystemExit('sample failed: ' + r.stderr)
    ins = mh.inputs(h); m = (1 << h) - 1
    bits = lambda v: tuple((v >> (h - 1 - i)) & 1 for i in range(h))
    bad = n = 0
    for line in r.stdout.strip().split('\n'):
        parts = list(map(int, line.split())); key = parts[0]
        q = (bits((key >> (3 * h)) & m), bits((key >> (2 * h)) & m), bits((key >> h) & m), bits(key & m))
        n += 1
        for p, want in zip(ins, parts[1:]):
            t = mh.delta(h, q, p)
            got = -1 if t is None else mh.pack(h, mh.canon(h, t))
            if got != want:
                bad += 1
    return {'h': h, 'states': n, 'transitions': n * len(ins), 'seed': seed, 'mismatches': bad}


def reference_rows(hmax):
    """The Python reference at h = 2..hmax: orbit counts, exact λ at Lueker's z, Lueker's print."""
    rows = []
    for (h, n_l, z_s, lam_l, b_l) in LUEKER:
        if h > hmax:
            break
        t0 = time.time()
        states, succ = mh.build(h, orbits=True)
        z = Fraction(float(z_s))
        w = mh.weights(h, z)
        v = mh.power_iterate(succ, [float(x) for x in w], 300)
        lam_hi, lam_lo = mh.certify_exact(succ, w, v)
        lo, hi = mh.bound_from(z, lam_hi)
        rows.append({'h': h, 'states': len(states), 'luekerStates': n_l, 'z': z_s, 'lambdaExact': f'{float(lam_hi):.15f}',
                     'lambdaLowerExact': f'{float(lam_lo):.15f}', 'luekerLambda': lam_l, 'bound': [f'{lo:.12f}', f'{hi:.12f}'],
                     'luekerBound': b_l, 'reproduced': len(states) == n_l and f'{float(lam_hi):.9f}' == lam_l and hi <= Decimal(b_l),
                     'seconds': round(time.time() - t0, 1)})
    return rows


def red_controls_python(h8):
    """Decision-level and reading-level controls, every one must come out wrong."""
    rc = []
    # reading-level, at h = 4 in exact arithmetic: a wrong weight law would have failed the calibration
    h, z_s, lam_l = 4, '0.2642', '0.217017510'
    states, succ = mh.build(h, orbits=True); z = Fraction(float(z_s))
    for ident, what, w in [
        ('weights-off-by-one-power', 'the weights read as z^{a+1} instead of z^{a+2}',
         [z ** (a + 1) if a < h - 1 else z ** h / (1 - z) for (_, _, a) in mh.inputs(h)]),
        ('truncation-weight-not-summed', 'the truncated input weighted z^{h+1} instead of z^{h+1}/(1−z)',
         [z ** (a + 2) if a < h - 1 else z ** (h + 1) for (_, _, a) in mh.inputs(h)])]:
        v = mh.power_iterate(succ, [float(x) for x in w], 300)
        lam, _ = mh.certify_exact(succ, w, v)
        got = f'{float(lam):.9f}'
        rc.append({'id': ident, 'what': what + f' at h = {h}', 'expect': 'DIFFERS from Lueker', 'luekerLambda': lam_l, 'got': got,
                   'fired': got != lam_l})
    # decision-level, on the h = 8 certificate of this run
    z_hex, lam_hex, rho_hex = h8['z'], h8['lambda_cert'], h8['ratio_min_down']
    d = decide(z_hex, lam_hex, '0.826279')
    rc.append({'id': 'claim-below-the-certificate', 'what': 'Lueker\'s h = 8 certificate against a printed bound 10^-6 below his',
               'expect': 'REFUSED', 'got': d['verdict'], 'why': d['why'], 'fired': d['verdict'] == 'REFUSED'})
    below = float(hexf(rho_hex) * (1 - Fraction(1, 10 ** 9)))
    d = decide(z_hex, lam_hex, '0.826280', claimant_lam_hex=below.hex(), rho_lower_hex=rho_hex)
    rc.append({'id': 'lambda-below-the-spectral-radius', 'what': 'a claimant λ one part in 10^9 below our certified lower bound on ρ(A_z) at h = 8',
               'expect': 'REFUTED', 'got': d['verdict'], 'why': d['why'], 'fired': d['verdict'] == 'REFUTED'})
    d = decide((0.5).hex(), lam_hex, '0.826280')
    rc.append({'id': 'z-at-one-half', 'what': 'z = 1/2, outside Theorem 2\'s (0, 1/k)', 'expect': 'REFUSED', 'got': d['verdict'], 'why': d['why'],
               'fired': d['verdict'] == 'REFUSED'})
    d = decide(z_hex, (1.0).hex(), '0.826280')
    rc.append({'id': 'lambda-at-one', 'what': 'λ = 1, outside (0, 1)', 'expect': 'REFUSED', 'got': d['verdict'], 'why': d['why'],
               'fired': d['verdict'] == 'REFUSED'})
    return rc


def red_controls_binary(exe, data, h8):
    """Input-level controls on the binary's certificate pass, on the h = 5 and h = 8 data of this run."""
    rc = []
    n5 = os.path.getsize(os.path.join(data, 'keys_h5.bin')) // 8
    bad = os.path.join(data, 'v_h5_zero.bin')
    with open(bad, 'wb') as f:
        f.write(struct.pack('<d', 0.0)); f.write(struct.pack(f'<{n5 - 1}d', *([1.0] * (n5 - 1))))
    r = run(exe, 'certify', 5, data, '0.2828', bad, 2)
    rc.append({'id': 'vector-with-a-zero', 'what': 'a witness vector with one zero component (h = 5)', 'expect': 'REFUSED',
               'got': 'REFUSED' if r.returncode else 'ACCEPTED', 'why': r.stderr.strip(), 'fired': r.returncode != 0})
    short = os.path.join(data, 'v_h5_short.bin')
    with open(short, 'wb') as f:
        f.write(struct.pack(f'<{n5 - 1}d', *([1.0] * (n5 - 1))))
    r = run(exe, 'certify', 5, data, '0.2828', short, 2)
    rc.append({'id': 'vector-wrong-length', 'what': 'a witness vector one component short (h = 5)', 'expect': 'REFUSED',
               'got': 'REFUSED' if r.returncode else 'ACCEPTED', 'why': r.stderr.strip(), 'fired': r.returncode != 0})
    n8 = os.path.getsize(os.path.join(data, 'keys_h8.bin')) // 8
    ones = os.path.join(data, 'v_h8_ones.bin')
    with open(ones, 'wb') as f:
        for _ in range(n8 // 4096):
            f.write(struct.pack('<4096d', *([1.0] * 4096)))
        f.write(struct.pack(f'<{n8 % 4096}d', *([1.0] * (n8 % 4096))))
    r = run(exe, 'certify', 8, data, '0.3209', ones, os.cpu_count() or 4)
    c = parse_certify(r.stdout)
    d = decide(c['z'], c['lambda_cert'], '0.826280')
    rc.append({'id': 'all-ones-vector', 'what': 'the all-ones vector as the witness at h = 8: a valid certificate (λ = the largest row sum), too weak for the printed bound',
               'expect': 'REFUSED', 'got': d['verdict'], 'lambda': c['lambda_cert'], 'bound': d.get('bound'), 'why': d['why'], 'fired': d['verdict'] == 'REFUSED'})
    for p in (bad, short, ones):
        os.remove(p)
    return rc


def claim_rows():
    """The two printed rows, from the claimant's own certificate outputs and the registry page, both pinned."""
    rows = []
    page = open(os.path.join(PINS_DIR, 'upstream', '31a.md'), encoding='utf-8').read()
    for h in (9, 10):
        t = open(os.path.join(PINS_DIR, 'claimant', 'certificates', f'certify_h{h}.out'), encoding='utf-8').read()
        head = kv(t.split('\n')[0].split(' (')[0])
        lam = re.search(r'lambda_cert=(\S+) ', t).group(1)
        printed = re.search(r'CERTIFIED: gamma_2 <= (\d\.\d+)', t).group(1)
        asterisked = f'| ${printed}$* |' in page
        rows.append({'h': h, 'states': int(head['N']), 'z': head['z'], 'lambda': lam, 'printed': printed, 'asteriskedAtPin': asterisked})
    return rows


def machine():
    m = {'platform': platform.platform(), 'cpus': os.cpu_count(), 'python': platform.python_version()}
    try:
        m['model'] = subprocess.run(['sysctl', '-n', 'machdep.cpu.brand_string'], capture_output=True, text=True).stdout.strip()
        m['memoryBytes'] = int(subprocess.run(['sysctl', '-n', 'hw.memsize'], capture_output=True, text=True).stdout.strip())
    except (FileNotFoundError, ValueError):
        try:
            m['model'] = [l for l in open('/proc/cpuinfo') if 'model name' in l][0].split(':')[1].strip()
            m['memoryBytes'] = int([l for l in open('/proc/meminfo') if l.startswith('MemTotal')][0].split()[1]) * 1024
        except (FileNotFoundError, IndexError):
            pass
    return m


def pins_ok():
    pins = json.load(open(os.path.join(PINS_DIR, 'PINS.json')))
    bad = [rel for rel, f in pins['files'].items() if sha256_text(os.path.join(PINS_DIR, rel)) != f['sha256']]
    return pins, bad


# ---------------------------------------------------------------- the run
def main_run(data):
    t0 = time.time(); T = os.cpu_count() or 4
    pins, bad = pins_ok()
    if bad:
        sys.exit('pinned sources changed: ' + ', '.join(bad))
    exe, compile_cmd, cc_ver = compile_mh(data)
    log = []
    claims = claim_rows()
    print(f'compiled {compile_cmd} ({cc_ver})')
    # calibration: h = 2..8 from nothing, by the binary
    calib = []
    for (h, n_l, z_s, lam_l, b_l) in LUEKER:
        b = run(exe, 'build', h, data, T, log=log); bd = kv(b.stdout.strip())
        e = run(exe, 'eigen', h, data, z_s, 600, '1e-13', T, log=log); ed = kv(e.stdout.strip().split('\n')[-1])
        c = run(exe, 'certify', h, data, z_s, os.path.join(data, f'v_h{h}.bin'), T, log=log); cd = parse_certify(c.stdout)
        z = hexf(cd['z']); lam = hexf(cd['lambda_cert'])
        lo, hi = mh.bound_from(z, lam)
        row = {'h': h, 'states': int(bd['states']), 'luekerStates': n_l, 'accepted': int(bd['accepted']), 'rejected': int(bd['rejected']),
               'z': cd['z'], 'iters': int(ed['iters']), 'lambdaCert': cd['lambda_cert'], 'lambdaCertDecimal': cd['lambda_certDecimal'],
               'lambdaFree': cd['lambda_free'], 'rhoLower': cd['ratio_min_down'], 'luekerLambda': lam_l,
               'bound': [f'{lo:.12f}', f'{hi:.12f}'], 'lambdaCertUp': dec_up(lam, 12), 'boundUp': dec_up(hi, 6), 'luekerBound': b_l,
               'reproduced': int(bd['states']) == n_l and f'{float(lam):.9f}' == lam_l and hi <= Decimal(b_l),
               'seconds': {'build': float(bd['seconds']), 'eigen': float(ed['seconds']), 'certify': cd['seconds']}}
        if h == 8:
            row['claimantAccepted'] = CLAIMANT_ACCEPTED_H8; row['acceptedAgrees'] = int(bd['accepted']) == CLAIMANT_ACCEPTED_H8
        calib.append(row)
        print(f'h={h} states={row["states"]} (Lueker {n_l}) λ={row["lambdaCertDecimal"]} (Lueker {lam_l}) bound ≤ {hi:.6f} (Lueker {b_l}) {"reproduced" if row["reproduced"] else "DIFFERS"}')
    h8 = {'z': calib[-1]['z'], 'lambda_cert': calib[-1]['lambdaCert'], 'ratio_min_down': calib[-1]['rhoLower']}
    # the reference: exact at h = 2..5, the full tables compared, the symmetry, samples at h = 8
    ref = reference_rows(5)
    dumps = []
    for h in (2, 3, 4, 5):
        states, succ = mh.build(h, orbits=True)
        py = ''.join(f'{mh.pack(h, q)} ' + ' '.join(str(mh.pack(h, states[k]) if k >= 0 else -1) for k in row) + '\n'
                     for q, row in sorted(zip(states, succ), key=lambda t: mh.pack(h, t[0])))
        c = run(exe, 'dump', h, data)
        dumps.append({'h': h, 'rows': len(states), 'identical': c.stdout == py})
    sym = {'h': 4, 'violations': mh.symcheck(4, mh.build(4)[0])}
    samples = [sample_check(exe, 8, data, 2000, 20261021)]
    print('reference: ' + ', '.join(f'h={r["h"]} {"reproduced" if r["reproduced"] else "DIFFERS"}' for r in ref)
          + '; dumps ' + ', '.join(f'h={d["h"]} {"identical" if d["identical"] else "DIFFER"}' for d in dumps)
          + f'; symmetry violations {sym["violations"]}; h=8 sample mismatches {samples[0]["mismatches"]}')
    # the rows: h = 9 and h = 10 from the stored vectors
    rows = []
    for cl in claims:
        h = cl['h']
        need = [os.path.join(data, f'{n}_h{h}.bin') for n in ('keys', 'table', 'v')]
        if not all(os.path.exists(p) for p in need):
            print(f'h={h}: no data in {data} — row left out'); continue
        logtxt = open(os.path.join(data, f'h{h}.log'), encoding='utf-8').read() if os.path.exists(os.path.join(data, f'h{h}.log')) else ''
        bline = next((l for l in logtxt.split('\n') if l.startswith(f'h={h} states=') and 'accepted=' in l), '')
        eline = next((l for l in logtxt.split('\n') if l.startswith(f'h={h} states=') and 'iters=' in l), '')
        bd, ed = kv(bline), kv(eline)
        z_dec = float(hexf(cl['z']))
        c = run(exe, 'certify', h, data, repr(z_dec), os.path.join(data, f'v_h{h}.bin'), T, log=log)
        if c.returncode:
            sys.exit(f'certify h={h} failed: ' + c.stderr)
        cd = parse_certify(c.stdout)
        if cd['z'] != cl['z']:
            sys.exit(f'h={h}: z differs from the claimant\'s double')
        d = decide(cd['z'], cd['lambda_cert'], cl['printed'], claimant_lam_hex=cl['lambda'], rho_lower_hex=cd['ratio_min_down'])
        smp = sample_check(exe, h, data, 2000 if h == 9 else 1000, 20261021)
        samples.append(smp)
        row = {'h': h, 'constant': 'C_31', 'ref': 'J2026', 'claim': f'γ₂ ≤ {cl["printed"]} (Lueker\'s method at h = {h})',
               'asteriskedAtPin': cl['asteriskedAtPin'],
               'states': int(bd.get('states', os.path.getsize(need[0]) // 8)), 'claimantStates': cl['states'],
               'accepted': int(bd['accepted']) if 'accepted' in bd else None, 'rejected': int(bd['rejected']) if 'rejected' in bd else None,
               'files': {'keys': sha256_file(need[0]), 'table': sha256_file(need[1]), 'v': sha256_file(need[2])},
               'bytes': {'keys': os.path.getsize(need[0]), 'table': os.path.getsize(need[1]), 'v': os.path.getsize(need[2])},
               'z': cd['z'], 'zDecimal': cd['zDecimal'] if 'zDecimal' in cd else repr(z_dec),
               'iters': int(ed['iters']) if 'iters' in ed else None,
               'powerRatio': [ed.get('ratio_min'), ed.get('ratio_max')],
               'lambdaCert': cd['lambda_cert'], 'lambdaCertDecimal': cd['lambda_certDecimal'],
               'lambdaFree': cd['lambda_free'], 'lambdaFreeDecimal': cd['lambda_freeDecimal'],
               'rhoLower': cd['ratio_min_down'], 'rhoLowerDecimal': cd['ratio_min_downDecimal'],
               'weightsUp': cd['weightsUp'],
               'claimant': {'lambda': cl['lambda'], 'lambdaDecimal': f'{float(hexf(cl["lambda"])):.17g}', 'states': cl['states']},
               'bound': d['bound'], 'boundUp': d['boundUp'], 'lambdaCertUp': dec_up(hexf(cd['lambda_cert']), 15), 'rhoLowerDown': dec_down(hexf(cd['ratio_min_down']), 15), 'printed': cl['printed'], 'verdict': d['verdict'], 'why': d['why'],
               'claimantLambdaMinusOurs': d['claimantLambdaMinusOurs'], 'claimantLambdaAboveOurLowerBound': d['claimantLambdaAboveOurLowerBound'],
               'statesAgree': int(bd.get('states', os.path.getsize(need[0]) // 8)) == cl['states'],
               'sample': smp,
               'seconds': {'build': float(bd['seconds']) if 'seconds' in bd else None, 'eigen': float(ed['seconds']) if 'seconds' in ed else None, 'certify': cd['seconds']}}
        rows.append(row)
        print(f'h={h}: states {row["states"]} (claimant {cl["states"]}), λ_cert {row["lambdaCertDecimal"]} (claimant {row["claimant"]["lambdaDecimal"]}), '
              f'bound ≤ {d["bound"][1][:14]} vs printed {cl["printed"]}: {d["verdict"]}; sample mismatches {smp["mismatches"]}')
    rc = red_controls_python(h8) + red_controls_binary(exe, data, h8)
    fired = sum(1 for r in rc if r['fired'])
    rec = {
        'what': "The optimization-constants registry's C_31 rows of 2026-10-18 (PR #231, [J2026]: γ₂ ≤ 0.825101 at h = 9 and ≤ 0.824120 "
                "at h = 10, both asterisked), replayed: Lueker's automaton M_h rebuilt from his paper alone in two implementations that "
                "share no code with each other or with the claimant (instruments/lueker/mh.py, the reference; mh.c, held to it), calibrated "
                "on Lueker's own table for h = 2..8, run at h = 9 and h = 10 with our own witness vectors, the certificate pass under "
                "directed rounding, the bound evaluated outward, the printed rows decided.",
        'generated': nowz(), 'seconds': round(time.time() - t0, 1), 'machine': machine(),
        'compiler': {'command': compile_cmd, 'version': cc_ver},
        'code': {'mh.c': sha256_text(os.path.join(SRC, 'mh.c')), 'mh.py': sha256_text(os.path.join(SRC, 'mh.py')), 'runner': sha256_text(os.path.abspath(__file__))},
        'paper': PAPER,
        'sources': {'dir': os.path.relpath(PINS_DIR, ROOT), 'claimantCommit': pins['claimantCommit'], 'registryCommit': pins['registryCommit'], 'pr': pins['pr'],
                    'files': {k: v['sha256'] for k, v in pins['files'].items()}},
        'method': {'theorem': "Lueker's Theorem 2 (journal Theorem 3.3), after Dančík–Paterson: M covers Σ*, z ∈ (0, 1/2), λ ∈ (0, 1), v > 0 with "
                              "A_z v ≤ λ v component-wise ⇒ γ₂ ≤ 2 log(2z)/log λ; any positive v is a witness (eq. 41)",
                   'automaton': "Figure 8 (journal Figure 7), transition by transition; states (x, y, dx, dy); one representative per complement "
                                "orbit (x̄, ȳ, dx, dy), the symmetry Lueker names in §3.2 and checks here on every state at h = 4",
                   'weights': 'z^{a+2} for a < h−1, z^{h+1}/(1−z) at a = h−1 (eq. 36), rounded up from exact for the certificate',
                   'certificate': 'λ_cert = max_s (A_z v)_s / v_s with FE_UPWARD in every thread (self-tested); λ_free the same in round-to-nearest '
                                  'inflated by (1+2^-52)^(4h−1); ρ_lower = min_s with FE_DOWNWARD, a lower bound on the spectral radius; '
                                  'the bound 2 ln(2z)/ln λ in 60-digit decimal, widened outward',
                   'words': 'CERTIFIED: our certificate reaches the printed bound; REFUSED: it does not, or an input is malformed; '
                            "REFUTED: the claimant's λ below our certified lower bound on ρ(A_z)"},
        'calibration': calib, 'reference': {'exact': ref, 'dumpsIdentical': dumps, 'symmetry': sym, 'samples': samples},
        'counts': {w: sum(1 for r in rows if r['verdict'] == w) for w in ('CERTIFIED', 'REFUSED', 'REFUTED')},
        'rows': rows, 'redControls': rc, 'redControlsFired': f'{fired}/{len(rc)}', 'log': log,
    }
    json.dump(rec, open(RECORD, 'w'), indent=1, ensure_ascii=False); open(RECORD, 'a').write('\n')
    print(f'written {os.path.relpath(RECORD, ROOT)}: {len(rows)} rows {rec["counts"]}, calibration {sum(1 for r in calib if r["reproduced"])}/{len(calib)} reproduced, '
          f'red controls {fired}/{len(rc)} fired, {rec["seconds"]} s')


# ---------------------------------------------------------------- the check
def main_check():
    fails = []; checks = 0
    def ck(cond, what):
        nonlocal checks; checks += 1
        if not cond: fails.append(what)
    rec = json.load(open(RECORD))
    ck(rec['code']['mh.c'] == sha256_text(os.path.join(SRC, 'mh.c')) and rec['code']['mh.py'] == sha256_text(os.path.join(SRC, 'mh.py')),
       'the record was written from other code (mh.c / mh.py changed): re-run tools/run-lueker.py DATA_DIR')
    pins, bad = pins_ok(); ck(not bad, 'pinned sources changed: ' + ', '.join(bad))
    ck(rec['sources']['claimantCommit'] == pins['claimantCommit'] and rec['sources']['registryCommit'] == pins['registryCommit'], 'source commits')
    # the reference at h = 2..4 re-run exactly
    ref = reference_rows(4)
    for r, q in zip(ref, rec['reference']['exact']):
        ck(r['h'] == q['h'] and r['states'] == q['states'] and r['lambdaExact'] == q['lambdaExact'] and r['reproduced'] and q['reproduced'], f'reference h={r["h"]}')
    # every calibration row: the bound from the recorded hex values, Lueker reproduced
    for c in rec['calibration']:
        lo, hi = mh.bound_from(hexf(c['z']), hexf(c['lambdaCert']))
        ck([f'{lo:.12f}', f'{hi:.12f}'] == c['bound'] and c['reproduced'] and c['states'] == c['luekerStates']
           and f'{float(hexf(c["lambdaCert"])):.9f}' == c['luekerLambda'] and hi <= Decimal(c['luekerBound']), f'calibration h={c["h"]}')
        ck(c['lambdaCertUp'] == dec_up(hexf(c['lambdaCert']), 12) and c['boundUp'] == dec_up(hi, 6), f'calibration h={c["h"]}: printed digits outward')
        ck(hexf(c['rhoLower']) <= hexf(c['lambdaCert']) <= hexf(c['lambdaFree']), f'calibration h={c["h"]}: ρ_lower ≤ λ_cert ≤ λ_free')
    ck(any(c['h'] == 8 and c.get('acceptedAgrees') for c in rec['calibration']), 'h=8 accepted transitions equal the claimant\'s count')
    ck(all(d['identical'] for d in rec['reference']['dumpsIdentical']) and rec['reference']['symmetry']['violations'] == 0
       and all(s['mismatches'] == 0 for s in rec['reference']['samples']), 'reference agreement')
    # every row re-decided from its own hex values
    claims = {c['h']: c for c in claim_rows()}
    for r in rec['rows']:
        cl = claims[r['h']]
        d = decide(r['z'], r['lambdaCert'], r['printed'], claimant_lam_hex=r['claimant']['lambda'], rho_lower_hex=r['rhoLower'])
        ck(d['verdict'] == r['verdict'] and d['bound'] == r['bound'], f'row h={r["h"]} re-decided')
        ck(d['boundUp'] == r['boundUp'] and r['lambdaCertUp'] == dec_up(hexf(r['lambdaCert']), 15) and r['rhoLowerDown'] == dec_down(hexf(r['rhoLower']), 15), f'row h={r["h"]}: printed digits outward')
        ck(r['z'] == cl['z'] and r['claimant']['lambda'] == cl['lambda'] and r['printed'] == cl['printed'] and r['claimantStates'] == cl['states'], f'row h={r["h"]} claim as pinned')
        ck(r['statesAgree'] and r['sample']['mismatches'] == 0, f'row h={r["h"]} states and sample')
        ck(hexf(r['rhoLower']) <= hexf(r['lambdaCert']) <= hexf(r['lambdaFree']), f'row h={r["h"]}: ρ_lower ≤ λ_cert ≤ λ_free')
    ck(rec['counts'] == {w: sum(1 for r in rec['rows'] if r['verdict'] == w) for w in ('CERTIFIED', 'REFUSED', 'REFUTED')}, 'counts')
    # the red controls: the Python-level ones re-run, the binary ones as recorded
    h8 = next(c for c in rec['calibration'] if c['h'] == 8)
    rc = red_controls_python({'z': h8['z'], 'lambda_cert': h8['lambdaCert'], 'ratio_min_down': h8['rhoLower']})
    rec_rc = {r['id']: r for r in rec['redControls']}
    for r in rc:
        ck(r['fired'] and rec_rc.get(r['id'], {}).get('fired') and rec_rc[r['id']]['got'] == r['got'], f'red control {r["id"]}')
    ck(all(r['fired'] for r in rec['redControls']), 'every red control fired')
    fired = sum(1 for r in rec['redControls'] if r['fired'])
    line = f'lueker replay: {checks} checks, {len(fails)} fail, {fired}/{len(rec["redControls"])} red controls fired; rows {rec["counts"]}'
    print(line)
    for f in fails:
        print('  FAIL ' + f)
    sys.exit(1 if fails else 0)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        main_check()
    elif len(sys.argv) > 1:
        main_run(os.path.abspath(sys.argv[1]))
    else:
        sys.exit(__doc__)
