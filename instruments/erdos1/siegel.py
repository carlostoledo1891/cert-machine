#!/usr/bin/env python
"""siegel.py — the Siegel's-lemma corollary, computed exactly from the certificates.

In the normalisation of Bloom's exposition (after Aliev), C_d is the least constant with:
for every nonzero a ∈ Z^d there is a nonzero x ∈ Z^d with a·x = 0 and ‖x‖_∞^{d−1} ≤ C_d ‖a‖_∞.
Our base weights a ∈ Z^d (d = r+1) are 2^k-relation-free: every nonzero integer x with a·x = 0
has ‖x‖_∞ ≥ 2^k. Hence 2^{k(d−1)} ≤ C_d ‖a‖_∞, i.e.  C_d ≥ 2^{kr} / max a  = 1 / f,
where f = N/2^{n−1} is the Bloom-normalised ratio of the instance (exact rational)."""
import sys, json, glob, os
getattr(sys, 'set_int_max_str_digits', lambda n: None)(0)   # absent before Python 3.11
from fractions import Fraction as Fr

def load_cert(path):
    """Read a certificate; .json.gz is accepted (the public repository stores them gzipped)."""
    import gzip as _gz, json as _json
    if str(path).endswith('.gz'):
        with _gz.open(path, 'rt', encoding='utf-8') as f: return _json.load(f)
    return _json.load(open(path))

def log_for(path):
    """verify-<same>.log for a certificate path, gz or not."""
    import os as _os
    base = _os.path.basename(str(path)); d = _os.path.dirname(str(path))
    base = base[:-3] if base.endswith('.gz') else base
    return _os.path.join(d, base.replace('cert-', 'verify-').replace('.json', '.log'))

def verified_ks(certpath):
    log = log_for(certpath)
    if not os.path.exists(log): return set()
    txt = open(log).read()
    if 'OVERALL: ALL CHECKS PASSED' not in txt or '[FAIL]' in txt.split(' instance k=')[0]: return set()
    ok = set()
    for block in txt.split(' instance k=')[1:]:
        k = int(block.split(':')[0])
        if 'skipped' in block.split('\n')[0]: continue
        if '[FAIL]' not in block and '[PASS]' in block and 'instance done' in block: ok.add(k)
    return ok

# cert-machine: the certificates live in certs/erdos1/ (first argument, default), and siegel.json is written beside them.
CERTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'certs', 'erdos1')
rows = []
for f in sorted(glob.glob(os.path.join(CERTS, 'cert-b*.json')) + glob.glob(os.path.join(CERTS, 'cert-b*.json.gz'))):
    C = load_cert(f); ok = verified_ks(f); d = C['d']; r = C['r']
    for I in C['instances']:
        if I['k'] not in ok: continue
        a = [int(x) for x in I['a']]; k = I['k']
        # sanity: the certificate's ratio equals max a / 2^{kr+1}
        assert Fr(max(a), 2 ** (k * r + 1)) == Fr(I['ratio'])
        bound = Fr(2 ** (k * r), max(a))          # = 1/f exactly
        rows.append((d, k, bound))
        print(f"d = {d:5d}  k = {k:2d}   C_d ≥ 2^(k(d-1))/max a = {float(bound):.6f}   (f = {float(1/bound):.6f})")
best = {}
for d, k, bnd in rows:
    if d not in best or bnd > best[d][1]: best[d] = (k, bnd)
print("\nbest verified bound per dimension:")
for d in sorted(best): print(f"  C_{d} ≥ {float(best[d][1]):.6f}  (k = {best[d][0]})")
print("\nfor comparison: Schinzel C_d ≥ 1 for all d; Bohman's sets give C_d ≥ 1/0.44004 = 2.2725 for all large d; Bombieri–Vaaler C_d ≪ √d.")
json.dump({str(d): {"k": best[d][0], "bound": str(best[d][1]), "bound_float": float(best[d][1])} for d in best}, open(os.path.join(CERTS, 'siegel.json'), 'w'), indent=1)
print("wrote", os.path.join(CERTS, 'siegel.json'))
