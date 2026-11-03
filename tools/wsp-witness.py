#!/usr/bin/env python3
"""wsp-witness.py — a PROPOSER, no authority: finds a rank-1 witness (u, α) for the Weight-Space Programming edit and
writes it as binary32 bit patterns to corpus/wsp/witness.json. The two deciders (instruments/wsp/weights.py,
tools/wsp-weights.js) CHECK the witness entry by entry in exact arithmetic; nothing here is trusted.

Method: an SVD of the delta on the changed columns gives the first guess; then alternating interval feasibility — every
edited entry W'[r,c] (bfloat16) fixes the binary32 interval that rounds to it, so u_r·α_c must lie in
J_rc = W[r,c] − that interval; with u fixed each α_c is chosen in ∩_r J_rc/u_r, with α fixed each u_r in ∩_c J_rc/α_c,
until every product lies inside its interval (or the count stops improving). A reading is written beside the witness:
the ratio α_c / (uᵀW[:,c]) per column, which says how much of the projection on u the edit removed.
usage: python3 tools/wsp-witness.py <base.safetensors> <edited.safetensors> <out.json>   MIT"""
import json, struct, sys
import numpy as np

def load(path):
    f = open(path, "rb"); n = struct.unpack("<Q", f.read(8))[0]; h = json.loads(f.read(n)); h.pop("__metadata__", None)
    mm = np.memmap(path, dtype=np.uint8, mode="r"); return h, 8 + n, mm

def bf16(h, s, mm, name):
    a, b = h[name]["data_offsets"]; bits = np.frombuffer(mm[s + a:s + b], dtype="<u2").reshape(h[name]["shape"])
    return bits, (bits.astype(np.uint32) << 16).view(np.float32)

def bf16_interval(bits):
    """the interval of binary32 values that round (nearest-even) to the bfloat16 bit pattern, as float64 [lo, hi],
    shrunk by 1/4096 of each ulp so a tie is never proposed. Neighbours are taken in VALUE order through a monotone
    integer key (sign-magnitude → two's-complement-like), so zeros and subnormals are handled too."""
    b = bits.astype(np.int64)
    key = np.where(b < 0x8000, b, 0x8000 - b)
    def val(k):
        bb = np.where(k >= 0, k, 0x8000 - k).astype(np.uint32)
        return (bb << 16).view(np.float32).astype(np.float64)
    v = val(key); below = val(key - 1); above = val(key + 1)
    lo_i = (v + below) / 2; hi_i = (v + above) / 2
    eps = (hi_i - lo_i) / 4096
    return lo_i + eps, hi_i - eps

def main(bp, ep, out):
    H0, S0, M0 = load(bp); H1, S1, M1 = load(ep); W = {}
    for n in sorted(H0):
        if H0[n]["dtype"] != "BF16" or H1.get(n, {}).get("dtype") != "BF16": continue
        b0, w0 = bf16(H0, S0, M0, n); b1, w1 = bf16(H1, S1, M1, n)
        if np.array_equal(b0, b1): continue
        cols = np.flatnonzero((b0 != b1).any(0))
        Wc = w0[:, cols].astype(np.float64); Dc = w1[:, cols].astype(np.float64) - Wc
        lo, hi = bf16_interval(b1[:, cols])
        Jlo, Jhi = Wc - hi, Wc - lo                      # u_r α_c ∈ [Jlo, Jhi]  (W' = W − u αᵀ)
        u, s, vt = np.linalg.svd(Dc, full_matrices=False)
        u1 = -u[:, 0]; alpha = u[:, 0] @ Dc            # Dc ≈ u0 (u0ᵀ Dc) = −u1 αᵀ
        resid = np.linalg.norm(Dc + np.outer(u1, alpha)) / np.linalg.norm(Dc)
        def infeasible(uu, aa):
            P = np.outer(uu, aa); return int(((P < Jlo) | (P > Jhi)).sum())
        best = infeasible(u1, alpha); hist = [best]
        def best_point(lo_m, hi_m, mask, cur):
            """per column of lo_m/hi_m (constraints along axis 0, masked): the point covered by the most intervals,
            the midpoint of the densest segment; cur where no constraint applies."""
            out = cur.copy()
            for j in range(lo_m.shape[1]):
                m = mask[:, j]
                if not m.any(): continue
                a = lo_m[m, j]; b = hi_m[m, j]
                pts = np.concatenate([a, b]); kind = np.concatenate([np.ones(len(a)), -np.ones(len(b))])
                order = np.lexsort((-kind, pts))        # at equal coordinates, openings before closings
                pts, kind = pts[order], kind[order]
                cov = np.cumsum(kind)
                k = int(np.argmax(cov))
                left = pts[k]; right = pts[k + 1] if k + 1 < len(pts) else pts[k]
                out[j] = (left + right) / 2
            return out
        for it in range(40):
            with np.errstate(divide="ignore", invalid="ignore"):
                A = Jlo / u1[:, None]; B = Jhi / u1[:, None]
            lo_a = np.where(u1[:, None] > 0, A, B); hi_a = np.where(u1[:, None] > 0, B, A)
            alpha = best_point(lo_a, hi_a, np.broadcast_to((u1 != 0)[:, None], lo_a.shape), alpha)
            with np.errstate(divide="ignore", invalid="ignore"):
                A = Jlo / alpha[None, :]; B = Jhi / alpha[None, :]
            lo_u = np.where(alpha[None, :] > 0, A, B).T; hi_u = np.where(alpha[None, :] > 0, B, A).T
            u1 = best_point(lo_u, hi_u, np.broadcast_to((alpha != 0)[:, None], lo_u.shape), u1)
            c = infeasible(u1, alpha); hist.append(c)
            if c == 0 or (len(hist) > 6 and hist[-1] == hist[-4]): break
        proj = u1 @ Wc
        ratio = alpha / proj
        uu = u1.astype(np.float32); aa = alpha.astype(np.float32)
        W[n] = {"columns": [int(c) for c in cols], "u_f32_bits": [int(x) for x in uu.view(np.uint32)],
                "alpha_f32_bits": [int(x) for x in aa.view(np.uint32)],
                "proposer": {"singular_values_first_three": [float(x) for x in s[:3]], "rank1_residual_fraction_svd": float(resid),
                             "infeasible_products_by_iteration": hist, "u_norm": float(np.linalg.norm(u1)),
                             "alpha_over_u_dot_Wc": {"mean": float(ratio.mean()), "std": float(ratio.std()), "min": float(ratio.min()), "max": float(ratio.max())}}}
        print(n, "cols", len(cols), "s", s[:3], "svd residual", resid, "infeasible", hist[0], "->", hist[-1], "ratio", ratio.mean(), "+-", ratio.std())
    json.dump(W, open(out, "w"))

if __name__ == "__main__": main(*sys.argv[1:4])
