#!/usr/bin/env python3
"""witness_tensor.py — the self-audit's WITNESS for the tensor family: Python standard library, exact integers, no
code from this repository. It shares nothing with the deciders under test (families/strassen-audit.js,
instruments/strassen/tensor.js) and nothing with tools/verify_strassen.py either; it is written from the identity
as the certificate states it:

    for every A-index (a,b), B-index (b',c) and C-index k:
        sum_t U[a*m+b][t] * V[b'*p+c][t] * W[k][t]  =  scale * [b == b'] * [k == idx(a,c)]

with idx(a,c) = a*p + c under layout AC and c*n + a under layout CA; the sums taken mod 2 over F2; Gaussian integers
[re, im] over Z[i], the imaginary part of the target 0. A FALSE-class mutant is FALSE only if this script finds a
violated equation under BOTH layouts (the deciders try both); it prints the first violation per layout. A mutant whose
shape is not three integer matrices of uniform rank is reported malformed.

usage: python3 -I witness_tensor.py items.json      items: [{"id", "dims", "rank", "ring", "scale", "U", "V", "W"}, …]
prints a JSON list, one object per item: {"id", "malformed", "reason"?, "violated", "layouts": {"AC": …, "CA": …}}"""
import json
import sys


def shape_ok(it):
    try:
        n, m, p = it['dims']
        r = it['rank']
        U, V, W = it['U'], it['V'], it['W']
        zi = it['ring'] == 'Zi'
        if not (isinstance(r, int) and r >= 1):
            return False, 'rank is not a positive integer'
        if len(U) != n * m or len(V) != m * p or len(W) != n * p:
            return False, 'factor shapes do not match dims'
        for M in (U, V, W):
            for row in M:
                if len(row) != r:
                    return False, 'a factor row does not have rank-many entries'
                for x in row:
                    if zi:
                        if not (isinstance(x, list) and len(x) == 2 and all(isinstance(y, int) and not isinstance(y, bool) for y in x)):
                            return False, 'an entry is not a Gaussian integer pair'
                    elif not (isinstance(x, int) and not isinstance(x, bool)):
                        return False, 'an entry is not an integer'
        s = it.get('scale', 1)
        if not (isinstance(s, int) and s >= 1) or (it['ring'] == 'F2' and s != 1):
            return False, 'scale is not a positive integer (or not 1 over F2)'
        return True, None
    except (KeyError, TypeError, ValueError) as e:
        return False, 'unreadable: %s' % e


def first_violation(it, layout):
    n, m, p = it['dims']
    r = it['rank']
    U, V, W = it['U'], it['V'], it['W']
    ring = it['ring']
    scale = it.get('scale', 1)
    zi = ring == 'Zi'
    mod2 = ring == 'F2'
    for ab in range(n * m):
        a, b = divmod(ab, m)
        for bc in range(m * p):
            b2, c = divmod(bc, p)
            kk = a * p + c if layout == 'AC' else c * n + a
            if zi:
                uv = [(U[ab][t][0] * V[bc][t][0] - U[ab][t][1] * V[bc][t][1], U[ab][t][0] * V[bc][t][1] + U[ab][t][1] * V[bc][t][0]) for t in range(r)]
            else:
                uv = [U[ab][t] * V[bc][t] for t in range(r)]
            for k in range(n * p):
                want = scale if (b == b2 and k == kk) else 0
                if zi:
                    sre = sum(uv[t][0] * W[k][t][0] - uv[t][1] * W[k][t][1] for t in range(r))
                    sim = sum(uv[t][0] * W[k][t][1] + uv[t][1] * W[k][t][0] for t in range(r))
                    if sre != want or sim != 0:
                        return {'ab': ab, 'bc': bc, 'k': k, 'sum': [sre, sim], 'target': [want, 0]}
                else:
                    s = sum(uv[t] * W[k][t] for t in range(r))
                    bad = ((s - want) % 2 != 0) if mod2 else (s != want)
                    if bad:
                        return {'ab': ab, 'bc': bc, 'k': k, 'sum': s, 'target': want, 'mod': 2 if mod2 else None}
    return None


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        ok, why = shape_ok(it)
        if not ok:
            out.append({'id': it.get('id'), 'malformed': True, 'reason': why, 'violated': None, 'layouts': None})
            continue
        lay = {L: first_violation(it, L) for L in ('AC', 'CA')}
        out.append({'id': it['id'], 'malformed': False, 'violated': all(lay[L] is not None for L in lay), 'layouts': lay})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
