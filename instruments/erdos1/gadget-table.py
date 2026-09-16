#!/usr/bin/env python
"""Δ_s for the one-parameter gadget T = I + αP (odd b): h = 1+α, c = 1+α^b (Bloom: α = 1/2). Float/log-space,
exploratory only (certificates are exact elsewhere). Admissibility must be checked separately (gadget.py)."""
import math
def logdelta(alpha, b, s):
    return ((b ** s - 1) // (b - 1)) * math.log1p(alpha ** b) - s * math.log1p(alpha)
B = 0.44004
alphas = [0.5, 0.55, 0.56, 0.58, 0.6, 0.62, 0.64, 0.65, 2/3, 0.7, 0.75, 0.8, 0.85, 0.9]
print("smallest dimension beating Bohman (f < 0.44004) per (α, s):")
for a in alphas:
    row = f"α={a:.3f} h={1+a:.2f}:"
    for s in [2, 3, 4]:
        best = None
        for b in range(3, 400, 2):
            ld = logdelta(a, b, s)
            if ld > 50: continue
            D = math.exp(ld)
            if D < B: best = (b, D); break
        row += f"  s={s}: " + (f"b={best[0]:3d} d={best[0]**s:8d} Δ={best[1]:.4f}" if best else "   none<400        ")
    print(row)
print("\nbest Δ under a dimension budget (grid α, odd b, s ≤ 5) vs Bloom's α = 1/2:")
for budget in [100, 200, 500, 1000, 3000, 10000, 100000, 1000000]:
    best = None; bloom = None
    for a in alphas:
        for s in [2, 3, 4, 5]:
            for b in range(3, 400, 2):
                d = b ** s
                if d > budget: break
                ld = logdelta(a, b, s)
                if ld > 50: continue
                D = math.exp(ld)
                if best is None or D < best[0]: best = (D, a, b, s, d)
                if a == 0.5 and (bloom is None or D < bloom[0]): bloom = (D, a, b, s, d)
    D, a, b, s, d = best
    print(f"  d ≤ {budget:7d}: Δ={D:.4f} (ρ={D/2:.4f}) at α={a:.3f} b={b} s={s} d={d}    Bloom: Δ={bloom[0]:.4f} at b={bloom[2]} s={bloom[3]} d={bloom[4]}")
