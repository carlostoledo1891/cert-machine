#!/usr/bin/env python3
"""pilot.py — a measurement pilot for an explicit Sidorenko counterexample kernel (corpus/sidorenko/preregistration.json).

H is the incidence graph of OpenAI's 22 triples on 13 points (35 vertices, 66 edges; openai/math family 161, Table 1 of
the preprint and `faces` in lean/ComparatorChallenges/SidorenkoCounterexample.lean — see SOURCE). For a bipartite kernel
W (N x M, entries in [0,1]; points sampled from [N], faces from [M])

    t(H,W) = E_{x in [N]^13} prod_T f(x_T),     f(a,b,c) = E_{y in [M]} W[a,y] W[b,y] W[c,y],
    p(W)   = E W,                               margin = log t(H,W) - 66 log p(W)      (< 0  <=>  counterexample).

The margin is invariant under W -> cW, so the search works with U = W / mean(W) (p = 1) and reads margin = log t(H,U).
The 13 point variables are summed out by bucket elimination along an elimination order found by an exact subset DP
(width 6: every pairwise contraction touches at most 6 point indices and keeps at most 5, so one evaluation costs about
6 N^6 multiply-adds and N^5 memory).

FLOAT SCREEN, EXACT CERTIFY. The float search never decides anything. The best kernel of each cell is rationalised to
A / Q (integers 0..Q, max entry Q) and decided exactly: S = sum_x prod_T F(x_T) with F = sum_y A A A is computed
modulo a set of primes (each pairwise contraction in float64 below 2^53, so every residue is exact), recombined by the
CRT under the bound S <= N^13 prod_T (M max(A)^3), and re-checked against one extra prime. Then, with integers only,

    t(H,A/Q) < p^66   <=>   S * N^(66-13) * M^(66-22) < (sum A)^66.

A kernel whose exact margin is negative is reported loudly (COUNTEREXAMPLE-CANDIDATE.json); a negative float margin
with a nonnegative exact margin is a slip, never a refutation.

  python3 pilot.py search --prereg corpus/sidorenko/preregistration.json --budget-hours H --out DIR [--backend auto]
  python3 pilot.py certify DIR [--backend torch]   re-decide every saved kernel exactly on this machine (CPU)
  python3 pilot.py time --n 4,6,8           one forward+backward per N, for the budget projection

numpy is required; torch (CUDA if present) is used when available. Python 3.9+.
"""
import argparse
import hashlib
import json
import math
import os
import random
import sys
import time

import numpy as np

# ---------------------------------------------------------------------------------------------------------- H itself
FACES = (
    (0, 1, 3), (0, 1, 9), (0, 2, 3), (0, 2, 9), (1, 3, 10), (1, 7, 10),
    (1, 7, 12), (1, 9, 12), (2, 3, 4), (2, 4, 9), (3, 4, 11), (3, 10, 11),
    (4, 8, 9), (4, 8, 11), (5, 6, 7), (5, 6, 11), (5, 7, 10), (5, 10, 11),
    (6, 7, 12), (6, 8, 11), (6, 8, 12), (8, 9, 12))
N_POINTS = 13
SOURCE = {
    "repository": "github.com/openai/math at fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb (the commit pinned in corpus/openai-math/release.json)",
    "lean": {"path": "lean/ComparatorChallenges/SidorenkoCounterexample.lean", "definition": "faces : Fin 22 -> Finset (Fin 13)",
             "sha256": "489688f5c4eb60c6dd8cfe0ef69663aaf11e795d6252e9626972764a50187de9"},
    "tex": {"path": "preprints/A-counterexample-to-Sidorenkos-conjecture-September-23-2026/build/sections/complex.tex",
            "definition": "Table tab:complex (columns i1 i2 i3)",
            "sha256": "b7023c77ec390b3392617c51b1ca3d3ee70d707af6c71e82b0b56547513bbe8a"},
}
LETTERS = "abcdefghijklmnopqrstuvwxy"   # point indices; 'z' is the batch index


def validate_H(faces, n_points, expect_paper=False):
    """Structural checks. With expect_paper, the facts the preprint states for its complex (Prop. prop:complex (1))."""
    problems = []
    for j, f in enumerate(faces):
        if len(set(f)) != len(f):
            problems.append("face %d %s repeats a point" % (j, f))
        if any((not isinstance(i, int)) or i < 0 or i >= n_points for i in f):
            problems.append("face %d %s leaves the point set" % (j, f))
    if len(set(tuple(sorted(f)) for f in faces)) != len(faces):
        problems.append("two faces coincide")
    if expect_paper:
        if len(faces) != 22 or n_points != 13:
            problems.append("expected 22 faces on 13 points, got %d on %d" % (len(faces), n_points))
        if any(len(f) != 3 for f in faces):
            problems.append("a face is not a triple")
        if sum(len(f) for f in faces) != 66:
            problems.append("expected 66 incidences")
        cover = {}
        for f in faces:
            for a in f:
                for b in f:
                    if a < b:
                        cover[(a, b)] = cover.get((a, b), 0) + 1
        if len(cover) != 33 or any(c != 2 for c in cover.values()):
            problems.append("expected 33 covered pairs, each in exactly two faces (got %d pairs, counts %s)"
                            % (len(cover), sorted(set(cover.values()))))
        if set(i for f in faces for i in f) != set(range(n_points)):
            problems.append("a point lies in no face")
        # the incidence graph is connected
        seen, todo = {0}, [0]
        while todo:
            u = todo.pop()
            for f in faces:
                if u in f:
                    for w in f:
                        if w not in seen:
                            seen.add(w)
                            todo.append(w)
        if len(seen) != n_points:
            problems.append("the incidence graph is disconnected")
    if problems:
        raise ValueError("H refused: " + "; ".join(problems))
    return {"faces": len(faces), "points": n_points, "edges": sum(len(f) for f in faces)}


def lean_faces(text):
    """Read the `faces` table of the Lean statement as text (never executed)."""
    i = text.index("def faces")
    j = text.index("![", i)
    k = text.index("]", j)
    body = text[j + 2:k]
    out = []
    for chunk in body.split("}")[:-1]:
        nums = chunk.split("{")[-1]
        out.append(tuple(int(s) for s in nums.split(",")))
    return tuple(out)


# ------------------------------------------------------------------------------------------------- the contraction plan
def plan(faces, n_points, n_ref=16):
    """Bucket elimination along the order minimising sum N^|bucket| (exact DP over subsets), then pairwise contractions
    inside each bucket, smallest union first. Returns steps on a growing tensor list (the faces are tensors 0..F-1):
    {"a", "b" (or None), "sa", "sb", "out", "sum"} with scopes as tuples of point indices."""
    n = n_points
    adj = [0] * n
    for f in faces:
        for a in f:
            for b in f:
                if a != b:
                    adj[a] |= 1 << b

    def reach(S, v):          # vertices outside S u {v} reachable from v through S: the bucket scope after S
        seen, stack, out = 1 << v, [v], 0
        while stack:
            u = stack.pop()
            for w in range(n):
                if adj[u] >> w & 1 and not seen >> w & 1:
                    seen |= 1 << w
                    if S >> w & 1:
                        stack.append(w)
                    else:
                        out |= 1 << w
        return out

    best = {0: (0, ())}
    for S in sorted(range(1, 1 << n), key=lambda s: (bin(s).count("1"), s)):
        cand = None
        for v in range(n):
            if S >> v & 1:
                P = S & ~(1 << v)
                c, o = best[P]
                val = (c + n_ref ** (bin(reach(P, v)).count("1") + 1), o + (v,))
                if cand is None or val < cand:
                    cand = val
        best[S] = cand
    order = best[(1 << n) - 1][1]

    scopes = [tuple(sorted(f)) for f in faces]
    live = list(range(len(faces)))
    steps = []
    for v in order:
        bucket = [t for t in live if v in scopes[t]]
        rest = [t for t in live if v not in scopes[t]]
        while len(bucket) > 1:
            pick = None
            for i in range(len(bucket)):
                for j in range(i + 1, len(bucket)):
                    u = set(scopes[bucket[i]]) | set(scopes[bucket[j]])
                    others = [bucket[k] for k in range(len(bucket)) if k not in (i, j)] + rest
                    keep = tuple(sorted(x for x in u if any(x in scopes[o] for o in others)))
                    key = (len(u), len(keep), i, j)
                    if pick is None or key < pick[0]:
                        pick = (key, i, j, keep, u)
            _, i, j, keep, u = pick
            a, b = bucket[i], bucket[j]
            scopes.append(keep)
            steps.append({"a": a, "b": b, "sa": scopes[a], "sb": scopes[b], "out": keep,
                          "sum": tuple(sorted(set(u) - set(keep)))})
            bucket = [bucket[k] for k in range(len(bucket)) if k not in (i, j)] + [len(scopes) - 1]
        if bucket:
            t = bucket[0]
            if v in scopes[t]:
                others = rest
                keep = tuple(x for x in scopes[t] if any(x in scopes[o] for o in others))
                scopes.append(keep)
                steps.append({"a": t, "b": None, "sa": scopes[t], "sb": None, "out": keep,
                              "sum": tuple(sorted(set(scopes[t]) - set(keep)))})
                bucket = [len(scopes) - 1]
        live = rest + bucket
    final = [t for t in live]
    assert all(scopes[t] == () for t in final), "plan left an index unsummed"
    covered = set(i for f in faces for i in f)
    return {"order": order, "steps": steps, "final": final, "n_faces": len(faces), "n_points": n_points,
            "isolated": n_points - len(covered),
            "max_union": max(len(set(s["sa"]) | set(s["sb"] or ())) for s in steps),
            "max_out": max(len(s["out"]) for s in steps)}


def step_flops(pl, N, M):
    """Floating-point operations of one forward+backward per kernel (forward multiply-adds x 2 flops x 3)."""
    mac = N * N * M + N ** 3 * M
    for st in pl["steps"]:
        mac += N ** len(set(st["sa"]) | set(st["sb"] or ()))
    return 6 * mac


def _l(scope):
    return "".join(LETTERS[i] for i in scope)


def _arity_spec(k, batch):
    z = "z" if batch else ""
    ins = ",".join(z + LETTERS[i] + "y" for i in range(k))
    return ins + "->" + z + LETTERS[:k]


# ---------------------------------------------------------------------------------------- float: numpy, with gradient
def _np_logt(U, faces, pl, tape=None):
    """log t(H,U) for a batch U (B,N,M), numpy float64. With tape (a dict) the forward is recorded for backward."""
    B, N, M = U.shape
    fs = {}
    for k in sorted(set(len(f) for f in faces)):
        fs[k] = np.einsum(_arity_spec(k, True), *([U] * k), optimize=True) / M
    tensors = [fs[len(f)] for f in faces]
    logscale = np.zeros(B)
    rec = []
    for st in pl["steps"]:
        A = tensors[st["a"]]
        if st["b"] is None:
            raw = np.einsum("z" + _l(st["sa"]) + "->z" + _l(st["out"]), A)
        else:
            raw = np.einsum("z" + _l(st["sa"]) + ",z" + _l(st["sb"]) + "->z" + _l(st["out"]), A, tensors[st["b"]],
                            optimize=True)
        div = float(N) ** len(st["sum"])
        s = np.abs(raw).reshape(B, -1).max(axis=1) / div
        s = np.where(s > 0, s, 1.0)
        out = raw / (div * s.reshape((B,) + (1,) * len(st["out"])))
        logscale += np.log(s)
        tensors.append(out)
        rec.append(div * s)
    vals = [tensors[t] for t in pl["final"]]
    logt = logscale + sum(np.log(v) for v in vals)
    if tape is not None:
        tape.update(U=U, fs=fs, tensors=tensors, rec=rec, vals=vals)
    return logt


def _bcast_grad(g_part, part_scope, full_scope, N):
    """Insert broadcast axes so a gradient over part_scope (batch first) covers full_scope."""
    shape = [g_part.shape[0]]
    src = list(part_scope)
    for x in full_scope:
        shape.append(N)
    out = g_part
    for pos, x in enumerate(full_scope):
        if x not in src:
            out = np.expand_dims(out, pos + 1)
    return np.broadcast_to(out, tuple(shape))


def np_margin_grad(Z, faces, pl, delta0=None, lam=0.0, want_grad=True):
    """W = sigmoid(Z), U = W/mean W; returns (margin (B,), delta (B,), objective (B,), dObjective/dZ or None)."""
    B, N, M = Z.shape
    K = N * M
    e = sum(len(f) for f in faces)
    W = 1.0 / (1.0 + np.exp(-Z))
    m = W.mean(axis=(1, 2))
    U = W / m.reshape(B, 1, 1)
    tape = {}
    logt = _np_logt(U, faces, pl, tape if want_grad else None)
    margin = logt - e * np.log(U.mean(axis=(1, 2)))
    delta = np.sqrt(((U - 1.0) ** 2).mean(axis=(1, 2)))
    obj = margin.copy()
    if delta0 is not None and lam:
        obj = obj + lam * ((delta - delta0) / delta0) ** 2
    if not want_grad:
        return margin, delta, obj, None
    tensors, rec = tape["tensors"], tape["rec"]
    grads = {}

    def acc(i, g):
        grads[i] = grads[i] + g if i in grads else g

    for i, t in enumerate(pl["final"]):
        acc(t, 1.0 / tape["vals"][i])
    nf = len(faces)
    for si in range(len(pl["steps"]) - 1, -1, -1):
        st = pl["steps"][si]
        tid = nf + si
        if tid not in grads:
            continue
        g = grads.pop(tid) / rec[si].reshape((B,) + (1,) * len(st["out"]))
        A = tensors[st["a"]]
        if st["b"] is None:
            acc(st["a"], _bcast_grad(g, st["out"], st["sa"], N))
            continue
        Bt = tensors[st["b"]]
        for (me, ms, other, os_) in ((st["a"], st["sa"], Bt, st["sb"]), (st["b"], st["sb"], A, st["sa"])):
            part = tuple(x for x in ms if x in st["out"] or x in os_)
            gp = np.einsum("z" + _l(st["out"]) + ",z" + _l(os_) + "->z" + _l(part), g, other, optimize=True)
            acc(me, np.ascontiguousarray(_bcast_grad(gp, part, ms, N)))
    # leaves: face j's tensor is f_k with axes in sorted-face order; f_k is symmetric, so each leaf gradient is a
    # gradient of f_k in its own axis order
    dU = np.zeros_like(U)
    dfs = {}
    for j, f in enumerate(faces):
        if j in grads:
            k = len(f)
            dfs[k] = dfs[k] + grads[j] if k in dfs else grads[j].copy()
    for k, df in dfs.items():
        for pos in range(k):
            others = [i for i in range(k) if i != pos]
            spec = "z" + LETTERS[:k] + "," + ",".join("z" + LETTERS[i] + "y" for i in others) + "->z" + LETTERS[pos] + "y"
            dU += np.einsum(spec, df, *([U] * len(others)), optimize=True) / M
    # the p-term
    dU += -e / U.mean(axis=(1, 2)).reshape(B, 1, 1) / K
    if delta0 is not None and lam:
        dd = lam * 2 * (delta - delta0) / delta0 ** 2
        dU += (dd / (K * np.where(delta > 0, delta, 1.0))).reshape(B, 1, 1) * (U - 1.0)
    dW = (dU - (dU * U).sum(axis=(1, 2)).reshape(B, 1, 1) / K) / m.reshape(B, 1, 1)
    dZ = dW * W * (1.0 - W)
    return margin, delta, obj, dZ


def np_margin_W(W, faces, pl):
    """Float64 margin of nonnegative kernels W (B,N,M) directly (no sigmoid)."""
    W = np.asarray(W, dtype=np.float64)
    if W.ndim == 2:
        W = W[None]
    e = sum(len(f) for f in faces)
    p = W.mean(axis=(1, 2))
    U = W / p.reshape(-1, 1, 1)
    return _np_logt(U, faces, pl) - e * np.log(U.mean(axis=(1, 2)))


# ---------------------------------------------------------------------------------------------------- float: torch
def torch_objective(torch, Z, faces, pl, delta0=None, lam=0.0, symmetric=False):
    if symmetric:
        Z = 0.5 * (Z + Z.transpose(1, 2))
    B, N, M = Z.shape
    e = sum(len(f) for f in faces)
    W = torch.sigmoid(Z)
    U = W / W.mean(dim=(1, 2), keepdim=True)
    fs = {}
    for k in sorted(set(len(f) for f in faces)):
        fs[k] = torch.einsum(_arity_spec(k, True), *([U] * k)) / M
    tensors = [fs[len(f)] for f in faces]
    logscale = torch.zeros(B, dtype=U.dtype, device=U.device)
    for st in pl["steps"]:
        A = tensors[st["a"]]
        if st["b"] is None:
            raw = torch.einsum("z" + _l(st["sa"]) + "->z" + _l(st["out"]), A)
        else:
            raw = torch.einsum("z" + _l(st["sa"]) + ",z" + _l(st["sb"]) + "->z" + _l(st["out"]), A, tensors[st["b"]])
        div = float(N) ** len(st["sum"])
        s = (raw.detach().abs().reshape(B, -1).amax(dim=1) / div).clamp_min(1e-300 if U.dtype == torch.float64 else 1e-30)
        tensors.append(raw / (div * s.reshape((B,) + (1,) * len(st["out"]))))
        logscale = logscale + torch.log(s)
    logt = logscale
    for t in pl["final"]:
        logt = logt + torch.log(tensors[t])
    margin = logt - e * torch.log(U.mean(dim=(1, 2)))
    delta = torch.sqrt(((U - 1.0) ** 2).mean(dim=(1, 2)))
    obj = margin
    if delta0 is not None and lam:
        obj = obj + lam * ((delta - delta0) / delta0) ** 2
    return margin, delta, obj, W


# ----------------------------------------------------------------------------------------------------- exact certify
def _is_prime(n):
    if n < 2:
        return False
    for p in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        if n % p == 0:
            return n == p
    d, s = n - 1, 0
    while d % 2 == 0:
        d //= 2
        s += 1
    for a in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        x = pow(a, d, n)
        if x in (1, n - 1):
            continue
        for _ in range(s - 1):
            x = x * x % n
            if x == n - 1:
                break
        else:
            return False
    return True


def _primes_below(top, count):
    out, q = [], top - 1
    while len(out) < count:
        if _is_prime(q):
            out.append(q)
        q -= 1
    return out


def _exact_leaves(A, faces):
    """F_k = sum_y prod A[x_i,y], exactly, as int64 (refuses if int64 could overflow)."""
    A = np.asarray(A, dtype=np.int64)
    N, M = A.shape
    amax = int(A.max()) if A.size else 0
    out = {}
    for k in sorted(set(len(f) for f in faces)):
        if M * amax ** k >= 2 ** 62:
            raise ValueError("F_%d would overflow int64" % k)
        out[k] = np.einsum(_arity_spec(k, False), *([A] * k))
    return out


def exact_S(A, faces, pl, backend="numpy", device="cpu", n_primes=None, prime_bits=None, extra_check=True, _tamper=False):
    """S = sum_{x in [N]^n} prod_faces F(x_face), exactly (CRT over primes, every residue exact in float64).
    Returns (S, info). n_primes / prime_bits / _tamper exist so the battery can break the CRT on purpose."""
    A = np.asarray(A, dtype=np.int64)
    N, M = A.shape
    amax = int(A.max())
    n = pl["n_points"]
    bound = N ** n
    for f in faces:
        bound *= M * amax ** len(f)
    # every pairwise step sums N^|sum| products of two residues; a single-tensor step sums N^|sum| residues
    terms_max = max(N ** len(st["sum"]) for st in pl["steps"])
    if prime_bits is None:
        prime_bits = min(26, int((53 - math.log2(terms_max)) // 2) - 1)
    top = 1 << prime_bits
    for st in pl["steps"]:
        terms = N ** len(st["sum"])
        lim = terms * (top - 1) ** (1 if st["b"] is None else 2)
        if lim >= 2 ** 53:
            raise ValueError("float64 exactness bound fails at a step (%d terms, primes < 2^%d)" % (terms, prime_bits))
    need = 1
    cnt = 0
    primes_all = _primes_below(top, 400)
    while need <= bound:
        need *= primes_all[cnt]
        cnt += 1
    if n_primes is None:
        n_primes = cnt
    primes = primes_all[:n_primes]
    extra = primes_all[n_primes]
    prod = 1
    for q in primes:
        prod *= q
    if prod <= bound:
        raise ValueError("CRT refused: product of %d primes does not exceed the bound on S" % len(primes))
    leaves = _exact_leaves(A, faces)
    if backend == "torch":
        import torch

    def residue(q):
        if backend == "torch":
            fs = {k: torch.tensor(np.remainder(v, q).astype(np.float64), dtype=torch.float64, device=device)
                  for k, v in leaves.items()}
            ein, rem = torch.einsum, torch.remainder
        else:
            fs = {k: np.remainder(v, q).astype(np.float64) for k, v in leaves.items()}
            ein = lambda spec, *ops: np.einsum(spec, *ops, optimize=True)
            rem = np.remainder
        tensors = [fs[len(f)] for f in faces]
        for st in pl["steps"]:
            if st["b"] is None:
                raw = ein(_l(st["sa"]) + "->" + _l(st["out"]), tensors[st["a"]])
            else:
                raw = ein(_l(st["sa"]) + "," + _l(st["sb"]) + "->" + _l(st["out"]), tensors[st["a"]], tensors[st["b"]])
            tensors.append(rem(raw, q))
        r = pow(N, pl["isolated"], q)        # a point in no face contributes a free factor N to the sum
        for t in pl["final"]:
            v = tensors[t]
            v = float(v.item()) if hasattr(v, "item") else float(v)
            assert v == int(v)
            r = r * int(v) % q
        return r

    residues = [residue(q) for q in primes]
    if _tamper:
        residues[0] = (residues[0] + 1) % primes[0]
    S = 0
    for q, r in zip(primes, residues):
        Mq = prod // q
        S = (S + r * Mq * pow(Mq, -1, q)) % prod
    info = {"primes": len(primes), "prime_bits": prime_bits, "bound_bits": bound.bit_length(), "backend": backend}
    if extra_check:
        rx = residue(extra)
        info["extra_prime"] = extra
        if S % extra != rx:
            raise ValueError("CRT refused: the extra prime %d disagrees (S mod p = %d, residue %d)" % (extra, S % extra, rx))
    if S > bound:
        raise ValueError("CRT refused: S exceeds its bound")
    return S, info


def exact_margin(A, faces, pl, exponent=None, Q=None, **kw):
    """Decide t(H, A/Q) versus p^e exactly; Q defaults to max(A). For the true exponent e = sum of face sizes the
    margin does not depend on Q; a wrong exponent makes it depend on Q (the battery uses that). Returns a certificate."""
    A = np.asarray(A, dtype=np.int64)
    N, M = A.shape
    if A.min() < 0 or A.max() <= 0:
        raise ValueError("kernel refused: needs nonnegative integers with a positive entry")
    e = sum(len(f) for f in faces) if exponent is None else exponent
    n, F = pl["n_points"], len(faces)
    # t = S / (N^n prod_faces (M Q^k)),  p = sumA / (N M Q):  t < p^e  <=>  S N^(e-n) M^(e-F) Q^(e - sum k) < sumA^e
    S, info = exact_S(A, faces, pl, **kw)
    sumA = int(A.sum())
    qexp = e - sum(len(f) for f in faces)   # 0 for the true exponent; Q matters only for a wrong one
    lhs = S * N ** (e - n) * M ** (e - F) if e >= n and e >= F else None
    if lhs is None:
        raise ValueError("exponent below the vertex counts is not supported")
    Q = int(A.max()) if Q is None else int(Q)
    if Q < int(A.max()):
        raise ValueError("Q below the largest entry: the kernel would leave [0,1]")
    if qexp >= 0:
        lhs *= Q ** qexp
        rhs = sumA ** e
    else:
        rhs = sumA ** e * Q ** (-qexp)
    sign = (lhs > rhs) - (lhs < rhs)
    value = (math.log(S) + (e - n) * math.log(N) + (e - F) * math.log(M) + qexp * math.log(Q) - e * math.log(sumA)) if S > 0 else float("-inf")
    return {"sign": sign, "verdict": {1: "Sidorenko holds (margin > 0)", 0: "equality (margin = 0)",
                                      -1: "VIOLATED (margin < 0): counterexample kernel"}[sign],
            "margin": value, "exponent": e, "S": str(S), "sumA": sumA, "Q": Q, "N": N, "M": M, **info}


def rationalise(W, Q):
    W = np.asarray(W, dtype=np.float64)
    A = np.rint(Q * W / W.max()).astype(np.int64)
    return A


# ------------------------------------------------------------------------------------------------------------ search
def _load_torch():
    try:
        import torch
        return torch
    except Exception:
        return None


def _inits(rng, B, N, M, kinds):
    Z = np.empty((B, N, M))
    used = []
    for b in range(B):
        kind = kinds[rng.randrange(len(kinds))]
        s = rng.choice((0.5, 1.0, 2.0, 4.0))
        c = rng.choice((-2.0, 0.0, 2.0))
        g = np.random.default_rng(rng.randrange(2 ** 63))
        if kind == "gauss":
            Z[b] = c + s * g.standard_normal((N, M))
        elif kind == "block":
            kr, kc = rng.choice((2, 3, 4)), rng.choice((2, 3, 4))
            rows, cols = g.integers(0, kr, N), g.integers(0, kc, M)
            vals = c + s * g.standard_normal((kr, kc))
            Z[b] = vals[rows][:, cols] + 0.1 * g.standard_normal((N, M))
        else:   # lowrank
            r = rng.choice((1, 2, 3))
            Z[b] = c + s * (g.standard_normal((N, r)) @ g.standard_normal((r, M))) / math.sqrt(r)
        used.append(kind)
    return Z, used


class Searcher:
    def __init__(self, faces, pl, backend, cfg, log):
        self.faces, self.pl, self.cfg, self.log = faces, pl, cfg, log
        self.torch = _load_torch() if backend in ("auto", "torch") else None
        if backend == "torch" and self.torch is None:
            raise SystemExit("torch requested but not importable")
        if self.torch is not None:
            self.device = "cuda" if self.torch.cuda.is_available() else "cpu"
            if self.device == "cuda":
                self.torch.backends.cuda.matmul.allow_tf32 = False
                self.torch.backends.cudnn.allow_tf32 = False
            self.name = "torch-" + self.device
        else:
            self.device = "cpu"
            self.name = "numpy"
        self.cap = {}

    def batch_for(self, N, M):
        if self.cfg.get("batch"):
            return int(self.cfg["batch"])
        if self.device == "cuda":
            free = self.torch.cuda.mem_get_info()[0]
            per = 4 * sum(N ** len(st["out"]) for st in self.pl["steps"]) * 4 + 4 * N ** 3 * M * 8   # saves, grads
            return max(1, min(64, int(0.6 * free // per)))
        return max(1, min(8, int(2e8 // (8 * N ** 5 * 48))))

    def round(self, N, M, delta0, symmetric, seed, steps):
        B = self.cap.get((N, M)) or self.batch_for(N, M)
        while True:
            try:
                return self._round(N, M, delta0, symmetric, seed, steps, B)
            except RuntimeError as ex:      # CUDA out of memory: halve the batch and retry the same seed
                if "out of memory" not in str(ex) or B == 1:
                    raise
                B = max(1, B // 2)
                self.cap[(N, M)] = B
                self.torch.cuda.empty_cache()

    def _round(self, N, M, delta0, symmetric, seed, steps, B):
        cfg = self.cfg
        rng = random.Random(seed)
        Z0, kinds = _inits(rng, B, N, M, cfg["inits"])
        lr, sig0 = cfg["lr"], cfg["noise"]
        lam0, lam1 = cfg["lambda"]

        def lam_at(it):                     # continuation: the delta constraint tightens geometrically
            return lam0 * (lam1 / lam0) ** (it / max(1, steps - 1))
        if self.torch is not None:
            torch = self.torch
            gen = torch.Generator(device=self.device).manual_seed(seed)
            Z = torch.tensor(Z0, dtype=torch.float32, device=self.device, requires_grad=True)
            opt = torch.optim.Adam([Z], lr=lr)
            for it in range(steps):
                opt.zero_grad()
                _, _, obj, _ = torch_objective(torch, Z, self.faces, self.pl, delta0, lam_at(it), symmetric)
                obj.sum().backward()
                opt.step()
                frac = it / steps
                if frac < 0.8 and sig0 > 0:
                    with torch.no_grad():
                        Z.add_(sig0 * (1 - frac / 0.8) * torch.randn(Z.shape, generator=gen, device=self.device))
            with torch.no_grad():
                Zf = Z.detach()
                if symmetric:
                    Zf = 0.5 * (Zf + Zf.transpose(1, 2))
                Zf = Zf.double().cpu().numpy()
        else:
            Z = Z0.copy()
            if symmetric:
                Z = 0.5 * (Z + Z.transpose(0, 2, 1))
            g = np.random.default_rng(seed)
            mom, vel = np.zeros_like(Z), np.zeros_like(Z)
            b1, b2 = 0.9, 0.999
            for it in range(steps):
                _, _, _, dZ = np_margin_grad(Z, self.faces, self.pl, delta0, lam_at(it))
                if symmetric:
                    dZ = 0.5 * (dZ + dZ.transpose(0, 2, 1))
                mom = b1 * mom + (1 - b1) * dZ
                vel = b2 * vel + (1 - b2) * dZ * dZ
                Z = Z - lr * (mom / (1 - b1 ** (it + 1))) / (np.sqrt(vel / (1 - b2 ** (it + 1))) + 1e-8)
                frac = it / steps
                if frac < 0.8 and sig0 > 0:
                    noise = g.standard_normal(Z.shape)
                    if symmetric:
                        noise = 0.5 * (noise + noise.transpose(0, 2, 1))
                    Z = Z + sig0 * (1 - frac / 0.8) * noise
            Zf = Z
        # float64 re-reading of every final kernel
        W = 1.0 / (1.0 + np.exp(-Zf))
        margin = np_margin_W(W, self.faces, self.pl)
        U = W / W.mean(axis=(1, 2), keepdims=True)
        delta = np.sqrt(((U - 1.0) ** 2).mean(axis=(1, 2)))
        return W, margin, delta, kinds, B


def certify_kernel(W, faces, pl, Qs, backend="numpy", device="cpu"):
    out = []
    for Q in Qs:
        A = rationalise(W, Q)
        if A.max() <= 0:
            continue
        t0 = time.time()
        c = exact_margin(A, faces, pl, backend=backend, device=device)
        c["seconds"] = round(time.time() - t0, 2)
        c["A"] = A.tolist()
        out.append(c)
    return out


def _write(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(obj, fh, indent=1)
    os.replace(tmp, path)


def cmd_search(args):
    prereg = json.load(open(args.prereg))
    sp = prereg["searchSpace"]
    cfg = {"lr": sp["adam"]["lr"], "lambda": (sp["deltaPenalty"]["lambda0"], sp["deltaPenalty"]["lambda1"]),
           "noise": sp["anneal"]["noise0"],
           "inits": sp["inits"], "batch": args.batch}
    faces = FACES
    validate_H(faces, N_POINTS, expect_paper=True)
    pl = plan(faces, N_POINTS)
    os.makedirs(args.out, exist_ok=True)
    budget = args.budget_hours * 3600.0
    reserve = sp["reserveFraction"] * budget
    t_start = time.time()
    s = Searcher(faces, pl, args.backend, cfg, print)
    ns = [int(x) for x in (args.n.split(",") if args.n else sp["N"])]
    cells = [(arm, N, d) for N in ns for arm in sp["arms"] for d in sp["deltas"]]
    steps = args.steps or sp["stepsPerRestart"]
    plateau = sp["plateau"]
    summary = {"what": "Sidorenko measurement pilot — float screen, exact certify", "prereg": args.prereg,
               "prereg_sha256": hashlib.sha256(open(args.prereg, "rb").read()).hexdigest(),
               "pilot_sha256": hashlib.sha256(open(__file__, "rb").read()).hexdigest(),
               "backend": s.name, "device": (s.torch.cuda.get_device_name(0) if s.device == "cuda" else "cpu"),
               "torch": (s.torch.__version__ if s.torch is not None else None), "numpy": np.__version__,
               "plan": {"order": pl["order"], "max_union": pl["max_union"], "max_out": pl["max_out"]},
               "budget_hours": args.budget_hours, "cells": [], "started": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    status_path = os.path.join(args.out, "_status.json")
    for ci, (arm, N, d0) in enumerate(cells):
        M = N
        symmetric = arm == "symmetric"
        elapsed = time.time() - t_start
        remaining = budget - reserve - elapsed
        if remaining <= 0:
            summary["cells"].append({"arm": arm, "N": N, "delta0": d0, "skipped": "budget exhausted"})
            continue
        slice_s = remaining / (len(cells) - ci)
        t_cell = time.time()
        best = None
        rounds = restarts = 0
        hist = []
        while True:
            seed = int(hashlib.sha256(("%s|%d|%s|%d|%d" % (arm, N, d0, rounds, sp["seed"])).encode()).hexdigest()[:15], 16)
            W, margin, delta, kinds, B = s.round(N, M, d0, symmetric, seed, steps)
            rounds += 1
            restarts += B
            ok = np.abs(delta / d0 - 1.0) <= sp["deltaPenalty"]["accept"]
            for b in range(B):
                if ok[b] and np.isfinite(margin[b]) and (best is None or margin[b] < best["margin_float"]):
                    best = {"margin_float": float(margin[b]), "delta": float(delta[b]), "init": kinds[b],
                            "round": rounds - 1, "seed": seed, "W": W[b]}
            hist.append(best["margin_float"] if best else None)
            _write(status_path, {"phase": "searching", "cell": "%s N=%d delta=%s" % (arm, N, d0), "cellIndex": ci,
                                 "cells": len(cells), "rounds": rounds, "restarts": restarts,
                                 "best": best["margin_float"] if best else None,
                                 "elapsedHours": round((time.time() - t_start) / 3600, 3),
                                 "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
            if time.time() - t_cell >= slice_s:
                stop = "slice"
                break
            k = plateau["rounds"]
            if best and len(hist) > k and hist[-k - 1] is not None:
                old, new = hist[-k - 1], hist[-1]
                if old - new <= max(plateau["abs"], plateau["rel"] * abs(old)) and new > plateau["floor"]:
                    stop = "plateau"
                    break
        rec = {"arm": arm, "N": N, "M": M, "delta0": d0, "rounds": rounds, "restarts": restarts,
               "stepsPerRestart": steps, "seconds": round(time.time() - t_cell, 1), "stop": stop, "backend": s.name}
        if best:
            Qs = list(sp["exact"]["Q"])
            if best["margin_float"] < sp["exact"]["fineBelow"]:
                Qs += list(sp["exact"]["Qfine"])
            _write(status_path, {"phase": "certifying", "cell": "%s N=%d delta=%s" % (arm, N, d0),
                                 "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
            eb = "torch" if (s.torch is not None and s.device == "cuda") else "numpy"
            certs = certify_kernel(best["W"], faces, pl, Qs, backend=eb, device=s.device)
            rec.update({"best_margin_float": best["margin_float"], "delta": best["delta"],
                        "margin_over_delta4": best["margin_float"] / best["delta"] ** 4, "init": best["init"],
                        "seed": best["seed"], "round": best["round"], "exact": certs,
                        "best_margin_exact": min(c["margin"] for c in certs) if certs else None,
                        "W_float": best["W"].tolist()})
            for c in certs:
                if c["sign"] < 0:
                    print("!" * 100 + "\nEXACT MARGIN < 0 — CANDIDATE COUNTEREXAMPLE KERNEL: %s N=%d delta=%s Q=%d margin=%.6g\n"
                          % (arm, N, d0, c["Q"], c["margin"]) + "!" * 100, flush=True)
                    _write(os.path.join(args.out, "COUNTEREXAMPLE-CANDIDATE-%s-N%d-d%s-Q%d.json" % (arm, N, d0, c["Q"])),
                           {"cell": rec, "certificate": c})
            if best["margin_float"] < 0 and all(c["sign"] >= 0 for c in certs):
                rec["slip"] = "float margin negative, every exact margin nonnegative: a slip, not a refutation"
        _write(os.path.join(args.out, "cell-%s-N%d-d%s.json" % (arm, N, d0)), rec)
        row = {k: v for k, v in rec.items() if k not in ("W_float", "exact")}
        row["exact_signs"] = [c["sign"] for c in rec.get("exact", [])]
        summary["cells"].append(row)
        print("%-10s N=%-3d delta=%-5s rounds=%-4d restarts=%-6d best float %+.6f exact %s  (%.0fs, %s)"
              % (arm, N, d0, rounds, restarts, rec.get("best_margin_float", float("nan")),
                 rec.get("best_margin_exact"), rec["seconds"], stop), flush=True)
        _write(os.path.join(args.out, "summary.json"), summary)
    summary["finished"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    summary["hours"] = round((time.time() - t_start) / 3600, 3)
    _write(os.path.join(args.out, "summary.json"), summary)
    _write(status_path, {"phase": "complete", "hours": summary["hours"],
                         "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())})
    neg = [c for c in summary["cells"] if any(x < 0 for x in c.get("exact_signs", []))]
    print("pilot: %d cells, %d with an exact negative margin" % (len(summary["cells"]), len(neg)))


def cmd_certify(args):
    """Re-decide every saved kernel on this machine (CPU) — a second reading of the pod's exact checks."""
    faces = FACES
    validate_H(faces, N_POINTS, expect_paper=True)
    pl = plan(faces, N_POINTS)
    agree = disagree = 0
    for name in sorted(os.listdir(args.dir)):
        if not (name.startswith("cell-") and name.endswith(".json")):
            continue
        rec = json.load(open(os.path.join(args.dir, name)))
        for c in rec.get("exact", []):
            again = exact_margin(np.array(c["A"], dtype=np.int64), faces, pl, backend=args.backend, device="cpu")
            same = again["S"] == c["S"] and again["sign"] == c["sign"]
            agree += same
            disagree += not same
            print("%s Q=%d sign %+d margin %.6g %s" % (name, c["Q"], again["sign"], again["margin"],
                                                       "agrees" if same else "DISAGREES with the pod"))
    print("certify: %d agree, %d disagree" % (agree, disagree))
    sys.exit(1 if disagree else 0)


def cmd_time(args):
    faces = FACES
    pl = plan(faces, N_POINTS)
    torch = _load_torch() if args.backend in ("auto", "torch") else None
    out = []
    for N in [int(x) for x in args.n.split(",")]:
        B = args.batch or 1
        Z = np.random.default_rng(0).standard_normal((B, N, N))
        reps = args.reps
        if torch is not None:
            dev = "cuda" if torch.cuda.is_available() else "cpu"
            Zt = torch.tensor(Z, dtype=torch.float32, device=dev, requires_grad=True)
            for r in range(reps + 1):
                if r == 1:
                    if dev == "cuda":
                        torch.cuda.synchronize()
                    t0 = time.time()
                _, _, obj, _ = torch_objective(torch, Zt, faces, pl, 0.5, 10.0)
                obj.sum().backward()
            if dev == "cuda":
                torch.cuda.synchronize()
            name = "torch-" + dev
        else:
            for r in range(reps + 1):
                if r == 1:
                    t0 = time.time()
                np_margin_grad(Z, faces, pl, 0.5, 10.0)
            name = "numpy"
            dev = "cpu"
        dt = (time.time() - t0) / reps
        t1 = time.time()
        A = rationalise(1.0 / (1.0 + np.exp(-Z[0])), 64)
        eb, ed = ("torch", dev) if torch is not None else ("numpy", "cpu")
        c = exact_margin(A, faces, pl, backend=eb, device=ed)
        dte = time.time() - t1
        row = {"N": N, "batch": B, "backend": name, "step_seconds": dt, "per_kernel_step_seconds": dt / B,
               "flops_per_kernel_step": step_flops(pl, N, N), "gflops_sustained": round(step_flops(pl, N, N) * B / dt / 1e9, 2),
               "exact_seconds": round(dte, 3), "exact_backend": eb + "-" + ed, "exact_primes": c["primes"]}
        out.append(row)
        print(json.dumps(row), flush=True)
    if args.json:
        _write(args.json, out)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("search")
    a.add_argument("--prereg", required=True)
    a.add_argument("--budget-hours", type=float, required=True)
    a.add_argument("--out", required=True)
    a.add_argument("--backend", default="auto", choices=("auto", "torch", "numpy"))
    a.add_argument("--n", default=None, help="override the pre-registered N list (smoke tests only)")
    a.add_argument("--steps", type=int, default=None, help="override steps per restart (smoke tests only)")
    a.add_argument("--batch", type=int, default=None)
    a.set_defaults(func=cmd_search)
    c = sub.add_parser("certify")
    c.add_argument("dir")
    c.add_argument("--backend", default="numpy", choices=("numpy", "torch"), help="torch = float64 residues on the CPU")
    c.set_defaults(func=cmd_certify)
    t = sub.add_parser("time")
    t.add_argument("--n", default="4,6,8")
    t.add_argument("--batch", type=int, default=None)
    t.add_argument("--reps", type=int, default=3)
    t.add_argument("--backend", default="auto", choices=("auto", "torch", "numpy"))
    t.add_argument("--json", default=None)
    t.set_defaults(func=cmd_time)
    args = ap.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
