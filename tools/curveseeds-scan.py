#!/usr/bin/env python3
"""curveseeds-scan.py — the optional lane (R1): every candidate below the published index of a prime-curve run, derived
by X9.62 and point-counted with PARI/GP (SEA; needs the seadata tables). Counted APART from the certificate.

For each candidate n = 1 … N of a run (clock t, field p): seed_n = the n-th 20-byte block of srand48(t)'s lrand48
stream; c by the X9.62 chain (leftmost bit cleared); the candidate is VIABLE when c ≢ 0, 4c + 27 ≢ 0 and −27·c⁻¹ is a
square mod p — then b = ±sqrt(−27/c), two curves y² = x³ − 3x ± b. PARI counts the points of the '+' curve; when
p ≡ 3 (mod 4) the '−' curve is its quadratic twist with 2p + 2 − N points, when p ≡ 1 (mod 4) the two are isomorphic.
A candidate is PRIME-ORDER under a root when that curve's order is prime (PARI isprime, APR-CL). Curves that share a
clock and a field (the X9.62 runs of 1997-05-15 and 1997-05-18) share one scan. The published candidate of every curve
must come out prime-order (the lane's calibration). Writes corpus/curveseeds/scan.json (merging runs).

usage: python3 tools/curveseeds-scan.py [--jobs N] [--out FILE] [--limit K] P-256 P-224 prime239v3 prime192v2 P-384 P-521\n       a group is scanned to its largest published index; --jobs splits the point counts over N gp processes (the pod);\n       --limit K scans the first K candidates only (a smoke test; curves whose published index is beyond K get no summary)
"""
import json, os, subprocess, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'instruments', 'curveseeds'))
import decide as D                                                     # the standard-library decider, the same chain

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GP = '/opt/homebrew/bin/gp'

def legendre(a, p): return pow(a % p, (p - 1) // 2, p)
def sqrt_mod(a, p):
    """Tonelli–Shanks; a a quadratic residue mod the odd prime p"""
    a %= p
    if p % 4 == 3: return pow(a, (p + 1) // 4, p)
    q, s = p - 1, 0
    while q % 2 == 0: q //= 2; s += 1
    z = 2
    while legendre(z, p) != p - 1: z += 1
    m, c, t, r = s, pow(z, q, p), pow(a, q, p), pow(a, (q + 1) // 2, p)
    while t != 1:
        i, t2 = 0, t
        while t2 != 1: t2 = t2 * t2 % p; i += 1
        b = pow(c, 1 << (m - i - 1), p); m, c, t, r = i, b * b % p, t * b * b % p, r * b % p
    return r

JOBS = 1
def gp(script, timeout):
    """run a gp script; with JOBS > 1 the print-lines after the first (the shared prelude) are split across JOBS processes"""
    lines = script.split('\n'); prelude, body = [l for l in lines if not l.startswith('print(')], [l for l in lines if l.startswith('print(')]
    chunks = [body[i::JOBS] for i in range(JOBS)] if JOBS > 1 else [body]
    procs = [subprocess.Popen([GP, '-q'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True) for c in chunks if c]
    outs = []
    for pr, c in zip(procs, [c for c in chunks if c]):
        pr.stdin.write('default(parisizemax, 2000000000);\n' + '\n'.join(prelude) + '\n' + '\n'.join(c) + '\nquit;\n'); pr.stdin.close(); pr.stdin = None   # communicate() must not touch the closed pipe
    for pr in procs:
        so, se = pr.communicate(timeout=timeout)
        errors = [l for l in se.split('\n') if l.strip().startswith('***') and 'Warning' not in l]   # PARI prints stack-growth WARNINGS with the same prefix as errors
        if pr.returncode != 0 or errors: raise SystemExit('gp failed: ' + '\n'.join(errors)[-600:] + se[-300:])
        outs.append(so)
    return '\n'.join(outs)

def scan_group(names):
    pre, pub = D.load(); T = pre['claim']['table']['prime']
    when = T[names[0]][0]; t = D.utc(when)
    P = {n: D.published_prime(pub, n) for n in names}; p = P[names[0]]['p']
    for n in names:
        if T[n][0] != when or P[n]['p'] != p: raise SystemExit('a group must share clock and field: ' + ', '.join(names))
    N = max(T[n][1] for n in names)
    if LIMIT: N = min(N, LIMIT)                                        # a smoke test scans the first LIMIT candidates only
    t0 = time.time()
    cands = []
    for n in range(1, N + 1):
        seed = D.seed_prime(t, n)
        c = D.x962_chain(seed, p.bit_length(), clear_top=True)
        viable = c % p != 0 and (4 * c + 27) % p != 0 and legendre(-27 * pow(c, -1, p), p) == 1
        b = sqrt_mod(-27 * pow(c, -1, p), p) if viable else None
        cands.append({'n': n, 'seed': seed, 'viable': viable, 'bPlus': b, 'bMinus': (p - b) if b is not None else None})
    viable = [x for x in cands if x['viable']]
    print('  %s: %d candidates, %d viable; counting points…' % ('/'.join(names), N, len(viable)), flush=True)
    script = 'p = %d;\n' % p + '\n'.join('print(%d, " ", ellcard(ellinit([-3, %d], p)));' % (x['n'], x['bPlus']) for x in viable)
    orders = {}
    for line in gp(script, 24 * 3600).split('\n'):
        parts = line.split()
        if len(parts) == 2 and parts[0].isdigit(): orders[int(parts[0])] = int(parts[1])
    if len(orders) != len(viable): raise SystemExit('gp returned %d orders for %d viable candidates' % (len(orders), len(viable)))
    same = p % 4 == 1                                                   # the two roots give isomorphic curves
    pr = {}
    for line in gp('\n'.join('print(%d, " ", isprime(%d), " ", isprime(%d));' % (n, o, o if same else 2 * p + 2 - o) for n, o in orders.items()), 3600).split('\n'):
        parts = line.split()
        if len(parts) == 3: pr[int(parts[0])] = (parts[1] == '1', parts[2] == '1')
    rows = [{'n': x['n'], 'orderPlus': str(orders[x['n']]), 'orderMinus': str(orders[x['n']] if same else 2 * p + 2 - orders[x['n']]), 'primePlus': pr[x['n']][0], 'primeMinus': pr[x['n']][1]} for x in viable]
    byN = {r['n']: r for r in rows}; cand = {x['n']: x for x in cands}
    seconds = round(time.time() - t0, 1)
    out = {}
    for name in names:
        Np = T[name][1]
        if Np > N: print('  %s: published candidate %d beyond the %d scanned (smoke test) — summary skipped' % (name, Np, N)); continue
        x = cand[Np]
        root = '+' if x['bPlus'] == P[name]['b'] else '-' if x['bMinus'] == P[name]['b'] else None
        if root is None: raise SystemExit(name + ': the published b is neither root of −27/c for its candidate — the derivation disagrees with the certificate')
        primeAny = [r['n'] for r in rows if r['n'] <= Np and (r['primePlus'] or r['primeMinus'])]
        primeRoot = [r['n'] for r in rows if r['n'] <= Np and (r['primePlus'] if root == '+' else r['primeMinus'])]
        out[name] = {'curve': name, 'clock': when, 'unix': t, 'bits': p.bit_length(), 'pMod4': p % 4, 'publishedCandidate': Np, 'candidatesScanned': Np,
                     'viable': sum(1 for r in rows if r['n'] <= Np), 'publishedRoot': root,
                     'publishedIsPrimeOrder': (byN[Np]['primePlus'] if root == '+' else byN[Np]['primeMinus']),
                     'primeOrderUnderThePublishedRoot': primeRoot, 'primeOrderUnderEitherRoot': primeAny,
                     'skippedUnderThePublishedRoot': [n for n in primeRoot if n < Np], 'skippedUnderEitherRoot': [n for n in primeAny if n < Np],
                     'groupScannedTo': N, 'group': names, 'secondsForTheGroup': seconds, 'rows': [r for r in rows if r['n'] <= Np]}
    return out

GROUPS = {'1997-05-15 15:49:03': ['prime239v1', 'prime239v2', 'prime239v3'], '1997-05-18 14:45:34': ['P-192', 'prime192v3', 'prime192v2']}

LIMIT = 0
if __name__ == '__main__':
    args = sys.argv[1:]
    dst = os.path.join(ROOT, 'corpus', 'curveseeds', 'scan.json')
    if '--jobs' in args: i = args.index('--jobs'); JOBS = int(args[i + 1]); del args[i:i + 2]
    if '--out' in args: i = args.index('--out'); dst = args[i + 1]; del args[i:i + 2]
    if '--limit' in args: i = args.index('--limit'); LIMIT = int(args[i + 1]); del args[i:i + 2]
    sys.argv = [sys.argv[0]] + args
    S = json.load(open(dst)) if os.path.exists(dst) else {'what': 'The optional lane of the NIST curve-seeds audit: every candidate below the published index of a prime-curve run derived by X9.62 and point-counted with PARI/GP (SEA, seadata). Counted apart from the certificate; a candidate is prime-order under a root when that curve\'s order is prime.', 'runs': {}}
    pre, _ = D.load(); T = pre['claim']['table']['prime']
    done = set()
    for name in sys.argv[1:]:
        if name in done: continue
        group = next((g for g in GROUPS.values() if name in g), [name])
        print('scanning', '/'.join(group), flush=True)
        for k, v in scan_group(group).items():
            S['runs'][k] = v; done.add(k)
            print('  %s: published %d prime-order: %s (root %s) · skipped under the published root: %s · under either root: %s' % (k, v['publishedCandidate'], v['publishedIsPrimeOrder'], v['publishedRoot'], v['skippedUnderThePublishedRoot'] or 'none', v['skippedUnderEitherRoot'] or 'none'), flush=True)
        S['summary'] = {'runs': {k: {kk: v[kk] for kk in ('publishedCandidate', 'viable', 'publishedIsPrimeOrder', 'publishedRoot', 'skippedUnderThePublishedRoot', 'skippedUnderEitherRoot', 'bits', 'pMod4', 'secondsForTheGroup')} for k, v in S['runs'].items()}}
        S['summary']['text'] = ' · '.join('%s: %d of %d candidates viable; the published candidate %d is prime-order; prime-order candidates skipped before it under the published root of b: %s; under either root: %s' % (
            k, v['viable'], v['publishedCandidate'], v['publishedCandidate'], ', '.join(map(str, v['skippedUnderThePublishedRoot'])) or 'none', ', '.join(map(str, v['skippedUnderEitherRoot'])) or 'none') for k, v in S['runs'].items())
        json.dump(S, open(dst, 'w'), indent=1); open(dst, 'a').write('\n')
    print(dst + ' written:', len(S['runs']), 'runs')
