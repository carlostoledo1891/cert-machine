#!/usr/bin/env python3
"""verify_strassen.py — independent verification of the detached fast-matmul
certificates, using NOTHING but the Python standard library.

Each certificate entry claims that integer factors U (nm x r), V (mp x r),
W (np x r) satisfy the matrix-multiplication tensor identity over the stated
ring and C-layout:

    sum_t U[a*m+b][t] * V[b'*p+c][t] * W[k][t]  =  [b == b'] * [k == idx(a,c)]

for ALL index triples (idx per the stated layout; mod 2 when ring is F2).
That single finite identity makes the factors a correct algorithm for every
pair of matrices, in r multiplications — with r below the naive n*m*p.

Python integers are exact, so every equation is decided, not approximated.
The script also re-checks itself: a RED CONTROL perturbs one coefficient
and requires the audit to FAIL; and it prints the sha256 of the certificate
file, so two transcripts naming the same hash provably checked the same
bytes.

usage: python3 verify_strassen.py certs/strassen-certificate.json [--sources DIR]
exit 0 iff every entry verifies AND the red control fires."""

import sys
import json
import hashlib
import os


def audit(entry):
    n, m, p = entry['dims']
    U, V, W = entry['U'], entry['V'], entry['W']
    r = entry['rank']
    mod2 = entry['ring'] == 'F2'
    layout = entry['layout']
    if len(U) != n * m or len(V) != m * p or len(W) != n * p:
        return False, 'factor shapes do not match dims'
    if any(len(row) != r for row in U + V + W):
        return False, 'rank claim does not match factor columns'
    for ab in range(n * m):
        a, b = divmod(ab, m)
        for bc in range(m * p):
            b2, c = divmod(bc, p)
            uv = [U[ab][t] * V[bc][t] for t in range(r)]
            kk = (a * p + c) if layout == 'AC' else (c * n + a)
            for k in range(n * p):
                s = sum(uv[t] * W[k][t] for t in range(r))
                want = 1 if (b == b2 and k == kk) else 0
                if (s - want) % 2 != 0 if mod2 else s != want:
                    return False, 'equation (ab=%d, bc=%d, k=%d): sum %d, target %d' % (ab, bc, k, s, want)
    if r >= n * m * p:
        return False, 'rank %d is not below naive %d' % (r, n * m * p)
    return True, '%dx%d times %dx%d in %d multiplications over %s (layout %s): all %d equations hold' % (
        n, m, m, p, r, entry['ring'], layout, (n * m) * (m * p) * (n * p))


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 2
    with open(args[0], 'rb') as f:
        raw = f.read()
    print('certificate %s  sha256 %s' % (args[0], hashlib.sha256(raw).hexdigest()))
    cert = json.loads(raw)

    failures = 0
    for entry in cert['entries']:
        okv, msg = audit(entry)
        print('%s  %-24s %s' % ('PASS' if okv else 'FAIL', entry['id'], msg))
        if not okv:
            failures += 1

    if '--sources' in args:
        d = args[args.index('--sources') + 1]
        for fn, sha in cert.get('sourcePins', {}).items():
            path = os.path.join(d, fn)
            if not os.path.exists(path):
                print('SKIP  source %s not present' % fn)
                continue
            with open(path, 'rb') as f:
                actual = hashlib.sha256(f.read()).hexdigest()
            okp = actual == sha
            print('%s  source %s %s' % ('PASS' if okp else 'FAIL', fn, 'sha256 matches pin' if okp else 'DRIFTED'))
            if not okp:
                failures += 1

    red = json.loads(json.dumps(cert['entries'][0]))
    red['W'][0][0] += 1
    okr, _ = audit(red)
    print('%s  RED control: one coefficient forged by +1 %s' % (
        'PASS' if not okr else 'FAIL', 'is refuted' if not okr else 'PASSED — verifier broken'))
    if okr:
        failures += 1

    print()
    print('verify_strassen: %d entries checked, %d failures' % (len(cert['entries']), failures))
    return 1 if failures or not cert['entries'] else 0


if __name__ == '__main__':
    sys.exit(main())
