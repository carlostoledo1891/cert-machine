# Transcription — the two literature inputs of the ember chain

Source: `liu2018_arxiv-1808-08148.pdf` (pinned in PINS.json,
sha256 `fb867aa5ab937b922aac8894528bc0b10348fd7aa2f0184e0bbc23e69cb73c28`).
Chun'guang You, Hehu Xie, Xuefeng Liu, *Guaranteed eigenvalue bounds for
the Steklov eigenvalue problem*, arXiv:1808.08148v1 (24 Aug 2018).
Read at source 2026-09-02 for this transcription; the bench read it
2026-09-01 (PHASE2.md). These two statements are ASSUMPTIONS of the ember
certificate chain — named in every record's trust base, never absorbed.

## Input 1 — the framework theorem (p. 5)

**Theorem 2.4 (Lower eigenvalue bounds).** Suppose that there exists a
positive constant C_h such that

    (2.9)   ‖u − P_h u‖_N ≤ C_h ‖u − P_h u‖_M    ∀u ∈ V.

Let λ_k and λ_{h,k} be as defined in (2.2) and (2.4). Lower eigenvalue
bounds are then given by

    (2.10)  λ_k ≥ λ_{h,k} / (1 + C_h² λ_{h,k}),   k = 1, 2, …, min(n, d).

(P_h is the M-projection onto the finite-dimensional V_h; the theorem is
stated in the abstract (A1)–(A4) framework of §2 — an extension of Liu
[16], Xuefeng Liu, *A framework of verified eigenvalue bounds for
self-adjoint differential operators*, Appl. Math. Comput. 267 (2015).)

How the chain instantiates it (stage-spectrum): V = mean-zero H¹ on the
trapezoid, V_h = mean-zero Crouzeix–Raviart space, M = broken-gradient
inner product, N = L². Π_h is ∇_h-orthogonal by (3.11) of the same paper,
and P_h u = Π_h u − mean(Π_h u); subtracting a mean only decreases the L²
norm, so (2.9) holds with C_h = 0.1893·h_max by Input 2.

## Input 2 — the CR interpolation constant (p. 8)

**Lemma 3.2 (Liu [16]).** For any triangle element K, whose longest edge
length is denoted by h_K, we have

    (3.12)  ‖u − Π_h u‖_{0,K} ≤ 0.1893 h_K |u − Π_h u|_{1,K}   ∀u ∈ H¹(K).

(Π_h is the Crouzeix–Raviart interpolation operator, edge-mean matching,
(3.10); its ∇_h-orthogonality is (3.11), proved on p. 8.)

## Status

Both statements are quoted, not re-proved, here. The chain treats them as
its only literature inputs alongside classical facts (sector Neumann
separation + H¹ regularity, Green's identity, spectral theorem, Courant).
If either were false, stage-spectrum's LOWER bounds (and everything
downstream of the spectral gap) would lose their footing; the Galerkin
UPPER bounds are independent of both.
