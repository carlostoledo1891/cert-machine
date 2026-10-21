#!/usr/bin/env python3
"""floatcheck_tensor.py — the self-audit's CONVENTIONAL CHECK (M5) for the tensor family: double precision, no exact
arithmetic, a tolerance τ — what a numpy-style `allclose(reconstructed, target, atol=τ)` does. Every factor entry is
read as a float; the identity's left side is summed in floats and divided by the scale; over F2 the residual is the
distance of the sum to the nearest even integer (the way a float check of a mod-2 identity is written); over Z[i]
complex floats. The check ACCEPTS at τ when the largest residual over all equations under the stated layout is at
most τ. Python standard library only; shares nothing with the deciders. It measures a tolerance, not a named grader.

usage: python3 -I floatcheck_tensor.py items.json   items: [{"id", "dims", "rank", "ring", "layout", "scale", "U", "V", "W"}, …]
prints a JSON list: {"id", "maxResidual", "accept": {"1e-6": bool, "1e-9": bool, "1e-12": bool}} — or {"id", "error"}"""
import json
import math
import sys

TAUS = [('1e-6', 1e-6), ('1e-9', 1e-9), ('1e-12', 1e-12)]


def residual(it):
    n, m, p = it['dims']
    r = it['rank']
    U, V, W = it['U'], it['V'], it['W']
    ring = it['ring']
    layout = it['layout']
    scale = float(it.get('scale', 1))
    zi = ring == 'Zi'
    mod2 = ring == 'F2'
    worst = 0.0
    for ab in range(n * m):
        a, b = divmod(ab, m)
        for bc in range(m * p):
            b2, c = divmod(bc, p)
            kk = a * p + c if layout == 'AC' else c * n + a
            if zi:
                uv = [complex(float(U[ab][t][0]), float(U[ab][t][1])) * complex(float(V[bc][t][0]), float(V[bc][t][1])) for t in range(r)]
            else:
                uv = [float(U[ab][t]) * float(V[bc][t]) for t in range(r)]
            for k in range(n * p):
                want = 1.0 if (b == b2 and k == kk) else 0.0
                if zi:
                    s = sum(uv[t] * complex(float(W[k][t][0]), float(W[k][t][1])) for t in range(r)) / scale
                    res = abs(s - want)
                elif mod2:
                    s = sum(uv[t] * float(W[k][t]) for t in range(r))
                    d = math.fmod(abs(s - want), 2.0)
                    res = min(d, 2.0 - d)
                else:
                    s = sum(uv[t] * float(W[k][t]) for t in range(r)) / scale
                    res = abs(s - want)
                if not (res <= worst):
                    worst = res if res == res else float('inf')
    return worst


def main():
    items = json.load(open(sys.argv[1]))
    out = []
    for it in items:
        try:
            w = residual(it)
            out.append({'id': it['id'], 'maxResidual': w if math.isfinite(w) else 'inf', 'accept': {name: bool(w <= tau) for name, tau in TAUS}})
        except Exception as e:  # a malformed item is not accepted at any tolerance
            out.append({'id': it.get('id'), 'error': str(e)[:200], 'accept': {name: False for name, _ in TAUS}})
    print(json.dumps(out))


if __name__ == '__main__':
    main()
