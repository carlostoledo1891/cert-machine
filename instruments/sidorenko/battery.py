#!/usr/bin/env python3
"""battery.py — the Sidorenko pilot's battery: H as stated, the contraction against brute force (exact integers and
Fractions, no shared code path), the exact certificate's identities, the float gradient, and red controls that must
fire. Prints "sidorenko battery: X pass, Y fail, R/R red controls fired"; exits nonzero on any failure.

  python3 battery.py [--source DIR]     DIR: a local clone of github.com/openai/math, read as text (optional)
"""
import argparse
import hashlib
import itertools
import math
import os
import random
import sys
from fractions import Fraction

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pilot as P  # noqa: E402

PASS, FAIL, RED, RED_FIRED, SKIP = [0], [0], [0], [0], [0]


def check(name, ok, detail=""):
    if ok:
        PASS[0] += 1
        print("  pass  " + name)
    else:
        FAIL[0] += 1
        print("  FAIL  " + name + ("  — " + detail if detail else ""))


def red(name, fired, detail=""):
    RED[0] += 1
    if fired:
        RED_FIRED[0] += 1
        print("  red   " + name + " — fired")
    else:
        FAIL[0] += 1
        print("  FAIL  red control did NOT fire: " + name + ("  — " + detail if detail else ""))


def raises(fn):
    try:
        fn()
    except Exception:
        return True
    return False


# ------------------------------------------------------------------------------------------- brute force, independent
def brute_S(A, faces, n_points):
    """S = sum over x in [N]^n of prod_faces F(x_face), F(x) = sum_y prod_i A[x_i][y]; pure Python integers."""
    A = [[int(v) for v in row] for row in A]
    N, M = len(A), len(A[0])
    cache = {}

    def F(xs):
        if xs not in cache:
            tot = 0
            for y in range(M):
                pr = 1
                for x in xs:
                    pr *= A[x][y]
                tot += pr
            cache[xs] = tot
        return cache[xs]

    S = 0
    for x in itertools.product(range(N), repeat=n_points):
        pr = 1
        for f in faces:
            pr *= F(tuple(x[i] for i in f))
            if pr == 0:
                break
        S += pr
    return S


def brute_full_t(Wq, faces, n_points):
    """t(H,W) from the definition: every map of all n + F vertices, Fractions."""
    N, M = len(Wq), len(Wq[0])
    F = len(faces)
    tot = Fraction(0)
    for x in itertools.product(range(N), repeat=n_points):
        for y in itertools.product(range(M), repeat=F):
            pr = Fraction(1)
            for j, f in enumerate(faces):
                for i in f:
                    pr *= Wq[x[i]][y[j]]
            tot += pr
    return tot / (N ** n_points * M ** F)


def t_from_S(S, A, faces, n_points):
    N, M = len(A), len(A[0])
    Q = max(max(r) for r in A)
    den = N ** n_points
    for f in faces:
        den *= M * Q ** len(f)
    return Fraction(S, den)


def rand_A(rng, N, M, Q):
    A = [[rng.randint(0, Q) for _ in range(M)] for _ in range(N)]
    A[rng.randrange(N)][rng.randrange(M)] = Q          # max entry is Q
    return np.array(A, dtype=np.int64)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=os.environ.get("OPENAI_MATH_CLONE", "/Users/carlostoledo/Projects/openai-math"))
    args = ap.parse_args()
    rng = random.Random(20261012)
    H, n = P.FACES, P.N_POINTS
    e = sum(len(f) for f in H)

    print("H as stated")
    st = P.validate_H(H, n, expect_paper=True)
    check("H: 22 faces, 13 points, 66 edges, 33 pairs each in two faces, connected", st == {"faces": 22, "points": 13, "edges": 66})
    lean = os.path.join(args.source, P.SOURCE["lean"]["path"])
    if os.path.isfile(lean):
        raw = open(lean, "rb").read()
        check("source: the Lean file's sha256 is the pinned one", hashlib.sha256(raw).hexdigest() == P.SOURCE["lean"]["sha256"])
        check("source: FACES equal the Lean `faces` table, in order", P.lean_faces(raw.decode()) == H)
        tex = os.path.join(args.source, P.SOURCE["tex"]["path"])
        traw = open(tex, "rb").read()
        check("source: the tex file's sha256 is the pinned one", hashlib.sha256(traw).hexdigest() == P.SOURCE["tex"]["sha256"])
        rows = []
        for line in traw.decode().splitlines():
            cells = [c.strip() for c in line.split("&")]
            if len(cells) == 8 and cells[0].isdigit():
                rows.append((int(cells[0]), (int(cells[1]), int(cells[2]), int(cells[3]))))
        check("source: FACES equal Table tab:complex, in order", [r[1] for r in sorted(rows)] == list(H) and [r[0] for r in sorted(rows)] == list(range(22)))
    else:
        SKIP[0] += 1
        print("  skip  source files (no clone at %s; the pinned sha256 values are in pilot.SOURCE)" % args.source)

    pl = P.plan(H, n)
    check("plan: width 6 (no pairwise contraction touches more than 6 indices, none keeps more than 5)",
          pl["max_union"] == 6 and pl["max_out"] == 5, "union %d out %d" % (pl["max_union"], pl["max_out"]))
    check("plan: every point summed exactly once", sorted(i for s in pl["steps"] for i in s["sum"]) == list(range(n)))

    print("contraction against brute force (exact)")
    for (N, M, Q) in ((2, 2, 3), (2, 3, 5), (2, 2, 1)):
        A = rand_A(rng, N, M, Q)
        S, info = P.exact_S(A, H, pl)
        Sb = brute_S(A.tolist(), H, n)
        check("H, N=%d M=%d Q=%d: CRT contraction S = brute-force S (%d primes)" % (N, M, Q, info["primes"]), S == Sb, "%d vs %d" % (S, Sb))
    sub = H[:8]
    nsub = 13
    subpl = P.plan(sub, nsub)
    A = rand_A(rng, 3, 2, 4)
    check("first 8 faces of H on 13 points, N=3 M=2: S = brute force", P.exact_S(A, sub, subpl)[0] == brute_S(A.tolist(), sub, nsub))
    # the face function itself, against every map of all vertices (points AND faces), Fractions
    small = ((0, 1, 2), (0, 1), (1, 3), (2, 3, 0))
    spl = P.plan(small, 4)
    A = rand_A(rng, 2, 2, 3)
    Wq = [[Fraction(int(v), 3) for v in r] for r in A.tolist()]
    tb = brute_full_t(Wq, small, 4)
    te = t_from_S(P.exact_S(A, small, spl)[0], A.tolist(), small, 4)
    check("mixed-arity hypergraph, every vertex map (Fractions) = contraction", tb == te, "%s vs %s" % (tb, te))
    # K_{2,2}: t = tr((W W^T)^2) / (N^2 M^2)
    k22 = ((0, 1), (0, 1))
    kpl = P.plan(k22, 2)
    A = rand_A(rng, 5, 4, 7)
    G = A @ A.T
    closed = Fraction(int(np.trace(G @ G)), 25 * 16 * 7 ** 4)
    check("K_{2,2}: contraction = tr((W W^T)^2)/(N^2 M^2) exactly", t_from_S(P.exact_S(A, k22, kpl)[0], A.tolist(), k22, 2) == closed)
    path = ((0, 1), (1, 2), (2, 3))
    ppl = P.plan(path, 4)
    A = rand_A(rng, 2, 3, 2)
    Wq = [[Fraction(int(v), 2) for v in r] for r in A.tolist()]
    check("path (7 vertices): contraction = every vertex map (Fractions)",
          t_from_S(P.exact_S(A, path, ppl)[0], A.tolist(), path, 4) == brute_full_t(Wq, path, 4))

    print("the exact certificate")
    for (N, M, a) in ((4, 4, 1), (5, 3, 3), (6, 6, 2)):
        A = np.full((N, M), a, dtype=np.int64)
        c = P.exact_margin(A, H, pl)
        check("constant kernel %dx%d: exact margin is exactly 0 (sign 0)" % (N, M), c["sign"] == 0 and abs(c["margin"]) < 1e-9, str(c["sign"]))
    A = rand_A(rng, 4, 4, 16)
    c1, c2 = P.exact_margin(A, H, pl), P.exact_margin(2 * A, H, pl)
    check("scale invariance: A and 2A give the same exact margin", c1["sign"] == c2["sign"] and abs(c1["margin"] - c2["margin"]) < 1e-9)
    check("random 4x4 kernel: exact sign is +1 (Sidorenko holds there)", c1["sign"] == 1, str(c1["sign"]))
    # exact sign versus a Fraction evaluation of t and p
    A = rand_A(rng, 2, 3, 3)
    S = brute_S(A.tolist(), H, n)
    t = t_from_S(S, A.tolist(), H, n)
    p = Fraction(int(A.sum()), 2 * 3 * 3)
    c = P.exact_margin(A, H, pl)
    check("exact sign = sign(t - p^66) evaluated in Fractions", c["sign"] == ((t > p ** 66) - (t < p ** 66)))
    check("exact margin value = log t - 66 log p from Fractions", abs(c["margin"] - (math.log(t.numerator) - math.log(t.denominator) - 66 * (math.log(p.numerator) - math.log(p.denominator)))) < 1e-9)

    print("float screen")
    A = rand_A(rng, 5, 5, 9)
    mf = float(P.np_margin_W(A / 9.0, H, pl)[0])
    ce = P.exact_margin(A, H, pl)
    check("float64 margin = exact margin (|diff| < 1e-9) at 5x5", abs(mf - ce["margin"]) < 1e-9, "%r vs %r" % (mf, ce["margin"]))
    Z = np.random.default_rng(1).standard_normal((2, 3, 4))
    _, _, obj, g = P.np_margin_grad(Z, H, pl, 0.7, 5.0)
    h = 1e-6
    worst = 0.0
    for idx in [(0, 0, 0), (0, 2, 3), (1, 1, 2), (1, 0, 1)]:
        Zp, Zm = Z.copy(), Z.copy()
        Zp[idx] += h
        Zm[idx] -= h
        fd = (P.np_margin_grad(Zp, H, pl, 0.7, 5.0, want_grad=False)[2][idx[0]] -
              P.np_margin_grad(Zm, H, pl, 0.7, 5.0, want_grad=False)[2][idx[0]]) / (2 * h)
        worst = max(worst, abs(fd - g[idx]) / max(1e-8, abs(fd)))
    check("numpy gradient of the objective = central differences (rel < 1e-5)", worst < 1e-5, "worst rel %.2e" % worst)
    U1 = np.ones((1, 4, 4)) * 0.37
    check("constant kernel: float margin 0 to 1e-12", abs(float(P.np_margin_W(U1, H, pl)[0])) < 1e-12)
    torch = P._load_torch()
    if torch is not None:
        Zt = torch.tensor(Z, dtype=torch.float64, requires_grad=True)
        m_t, _, o_t, _ = P.torch_objective(torch, Zt, H, pl, 0.7, 5.0)
        o_t.sum().backward()
        m_n = P.np_margin_grad(Z, H, pl, 0.7, 5.0)[0]
        check("torch float64 margin = numpy margin", np.allclose(m_t.detach().numpy(), m_n, atol=1e-10))
        check("torch autograd = numpy gradient", np.allclose(Zt.grad.numpy(), g, rtol=1e-7, atol=1e-10))
        A = rand_A(rng, 6, 6, 32)
        Sn, _ = P.exact_S(A, H, pl, backend="numpy")
        St, _ = P.exact_S(A, H, pl, backend="torch", device="cpu")
        check("exact S: torch float64 residues = numpy residues (6x6)", Sn == St)
        if torch.cuda.is_available():     # the pod's GPU paths, against numpy on the same kernels
            Zc = torch.tensor(Z, dtype=torch.float32, device="cuda")
            m_c = P.torch_objective(torch, Zc, H, pl, 0.7, 5.0)[0].double().cpu().numpy()
            check("CUDA float32 margin = numpy float64 margin (|diff| < 1e-4)", np.allclose(m_c, m_n, atol=1e-4), str(m_c - m_n))
            for (N, Q) in ((8, 64), (12, 1024)):
                A = rand_A(rng, N, N, Q)
                check("exact S: CUDA float64 residues = numpy residues (%dx%d, Q=%d)" % (N, N, Q),
                      P.exact_S(A, H, pl, backend="torch", device="cuda")[0] == P.exact_S(A, H, pl, backend="numpy")[0])
        else:
            SKIP[0] += 1
            print("  skip  no CUDA here (on the pod: CUDA margins and exact residues against numpy)")
    else:
        SKIP[0] += 1
        print("  skip  torch not importable here (the pod checks torch against numpy in this same battery)")

    print("red controls (each must fire)")
    bad = list(H)
    bad[0] = (0, 0, 3)
    red("a triple with a repeated point is refused", raises(lambda: P.validate_H(tuple(bad), n, expect_paper=True)))
    bad = list(H)
    bad[0] = (0, 1, 4)
    red("a moved point (a pair no longer in exactly two faces) is refused", raises(lambda: P.validate_H(tuple(bad), n, expect_paper=True)))
    A = np.full((4, 4), 1, dtype=np.int64)
    c66 = P.exact_margin(A, H, pl, Q=2)
    c65 = P.exact_margin(A, H, pl, exponent=65, Q=2)
    check("constant kernel W = 1/2: exact margin 0 with the true exponent", c66["sign"] == 0)
    red("a wrong exponent (65) breaks the constant-kernel identity at W = 1/2", c65["sign"] != 0, str(c65["sign"]))
    A = rand_A(rng, 2, 2, 3)
    wrongpl = P.plan(H[:21], n)
    red("a contraction that drops a face disagrees with brute force", P.exact_S(A, H[:21], wrongpl)[0] != brute_S(A.tolist(), H, n))
    A = rand_A(rng, 3, 3, 8)
    red("a starved CRT (too few primes for the bound) is refused", raises(lambda: P.exact_S(A, H, pl, n_primes=2)))
    red("a corrupted residue is caught by the extra prime", raises(lambda: P.exact_S(A, H, pl, _tamper=True)))
    # the sign path can say VIOLATED: C4 with exponent 3 on a sparse kernel (t(C4) ~ p^4 < p^3)
    A = np.eye(6, dtype=np.int64) + np.roll(np.eye(6, dtype=np.int64), 1, axis=1)   # 2-regular: t(C4) = 1/36 < 1/27 = p^3
    c = P.exact_margin(A, k22, kpl, exponent=3)
    red("the exact check reports a negative margin when there is one (C4 vs p^3 on a 2-regular 6x6)", c["sign"] == -1, str(c["sign"]))

    total = PASS[0]
    print("sidorenko battery: %d pass, %d fail, %d/%d red controls fired%s"
          % (total, FAIL[0], RED_FIRED[0], RED[0], (", %d skipped" % SKIP[0]) if SKIP[0] else ""))
    sys.exit(1 if FAIL[0] or RED_FIRED[0] != RED[0] else 0)


if __name__ == "__main__":
    main()
