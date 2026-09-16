#!/usr/bin/env python
"""report.py — human summary of a certificate (writes RESULTS-b{b}-s{s}.md)."""
import sys, json, hashlib
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

def report(path):
    C = load_cert(path); b, s, d, r, D = C['b'], C['s'], C['d'], C['r'], C['D']
    lines = [f"# Explicit dissociated sets from Λ_{s} (b={b}, tilt α={C.get('alpha', '1/2')}), d={d}", ""]
    lines.append(f"Δ_s = {C['delta_formula']} ≈ {float(Fr(C['delta_formula'])):.6f}; D = {D}; buffer K = {float(Fr(C['K'])):.6g}")
    lines.append(f"|det A| has {C['detA'].bit_length() if isinstance(C['detA'], int) else int(C['detA']).bit_length()} bits.")
    lines.append("")
    lines.append("| k | n = |A| | t | bits of N | N / 2^n | Bloom f = N/2^(n−1) | vs Bohman 0.22002 |")
    lines.append("|---|---|---|---|---|---|---|")
    for inst in C['instances']:
        rho = Fr(inst['ratio'])
        lines.append(f"| {inst['k']} | {inst['n']} | {inst['t']} | {inst['N_bits']} | {float(rho):.6f} | {float(2*rho):.6f} | {'BELOW' if rho < Fr(22002,100000) else 'above'} |")
    best = min(C['instances'], key=lambda I: Fr(I['ratio']))
    a = [int(x) for x in best['a']]
    k = best['k']
    elems = sorted(x * 2**j for x in a for j in range(k))
    assert len(elems) == len(set(elems)) == (r + 1) * k
    N = elems[-1]
    h = hashlib.sha256("\n".join(map(str, elems)).encode()).hexdigest()
    lines += ["", f"## Best instance: k={k}", "",
              f"- |A| = n = {len(elems)}; N = max A has {N.bit_length()} bits ({len(str(N))} decimal digits)",
              f"- N / 2^n = {float(Fr(best['ratio'])):.6f} (Bohman: 0.22002); Bloom-normalized f(n) ≤ {float(2*Fr(best['ratio'])):.6f} (Bohman: 0.44004)",
              f"- smallest element: {elems[0]}", f"- second smallest: {elems[1]}",
              f"- min a_i / max a_i = {float(Fr(min(a), max(a))):.9f}",
              f"- sha256 of the sorted element list (decimal, newline-separated): {h}",
              f"- the base weights a_0..a_{r} are in {path} (field instances[k={k}].a); A = {{ a_i·2^j : 0≤i≤{r}, 0≤j<{k} }}"]
    import os as _os
    # cert-machine: the summary is named after the certificate FILE (cert-X.json[.gz] -> RESULTS-X.md), so a second
    # certificate for the same lattice (cert-b9-s2-a3_5-k21.json) cannot overwrite the first one's summary.
    base = _os.path.basename(path); base = base[:-3] if base.endswith('.gz') else base
    out = _os.path.join(_os.path.dirname(path), base.replace('cert-', 'RESULTS-').replace('.json', '.md'))
    open(out, 'w').write("\n".join(lines) + "\n")
    print("\n".join(lines))
    print("wrote", out)

if __name__ == "__main__":
    for p in sys.argv[1:]: report(p)
