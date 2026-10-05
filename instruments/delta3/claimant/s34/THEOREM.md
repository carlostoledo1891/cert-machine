# Erdős #1186 — monochromatic 3-term progressions in 2-colourings of [n]

> **SUPERSEDED (session 35, 2026-10-05): δ₃ = 117/2192 is PROVED.** See exact/THEOREM-EXACT.md.
> That proof centres the problem at the twelve-block colouring: σ-coordinates, a bathtub
> discretisation that is exact to first order, and five exact certificates checked by
> exact/vcheck.py. The lower-bound ladder below is the session-34 work. Its §1 reduction is
> still used.

Let V(n) be the minimum, over 2-colourings of {1,…,n}, of the number of monochromatic 3-term
arithmetic progressions, and δ₃ = liminf V(n)/n² (Graham's $100 question asks for δ₃).
Known before this work: 1675/32768 ≈ 0.051117 ≤ δ₃ ≤ 117/2192 ≈ 0.053376
(Parrilo–Robertson–Saracino 2008; the upper bound is a 12-block colouring, conjectured optimal).
A stronger relaxation was reported numerically at ≈ 0.052341, with no certificate.

## 1. The counting identity (re-derived)

In a 2-colouring, a non-monochromatic triple {a < c < b} (a + b = 2c) has exactly two
bichromatic pairs among (a,c), (c,b), (a,b). Counting (triple, bichromatic pair) incidences:

- outer pairs: T = #{a < b : a ≡ b (mod 2), χ(a) ≠ χ(b)};
- inner pairs: N⁺ = #{ordered (u,v) : χ(u) ≠ χ(v), 2v − u ∈ [1,n]}. Each unordered inner pair
  {u < v} is inner to (u, v, 2v−u) and to (2u−v, u, v), whenever those exist.

So V = #APs − (T + N⁺)/2 = n²/4 − (T + N⁺)/2 + O(n). Moreover T ≤ n²/8 + O(n), because
T = r_o b_o + r_e b_e is at most (n/2)²/4 + (n/2)²/4.

In the continuum, with u the density of colour 0 and φ = 2u − 1 ∈ [−1, 1]:

N⁺/n² = F(φ) + O(1/n),  F = ∫∫_R ½(1 − φ(a)φ(b)) = ½(½ − Q(φ)),
Q(φ) = ∫∫_R φ(a)φ(b) da db,  R = {(a,b) ∈ [0,1]² : a/2 ≤ b ≤ (1+a)/2}.

Hence **δ₃ ≥ 1/16 + Q\*/4, where Q\* = inf_φ Q(φ)**. Equality holds when the minimiser is
parity-balanced; the 12-block colouring is.

The 12-block colouring has Q = −5/137 exactly (model.py), which gives 117/2192. So
**δ₃ = 117/2192 ⇔ Q\* = −5/137.**

Checks:
- brute.py: the 12-block value at n = 3288 is 0.053224, approaching 117/2192.
- check_reduction.py: V/n² − (1/16 + Q/4) = −0.45/n ± 0.06/n, across random, block and smooth colourings.

## 2. The discretisation lemma (a valid lower bound)

Take cells I_i = [i/L, (i+1)/L) and averages x_i = L ∫_{I_i} φ ∈ [−1, 1]. For each cell pair (i, j):

- **fully inside R:** the integral of φ(a)φ(b) over I_i × I_j is exactly x_i x_j / L².
- **fully outside R:** the pair contributes 0.
- **cut by ∂R**, with A_in and A_out the inside and outside areas: the integral over the inside part is
  - ≥ −A_in, because φφ ≥ −1;
  - and also = (full) − (outside part) ≥ x_i x_j / L² − A_out.

Therefore

  Q(φ) ≥ f(x) := Σ_inside x_i x_j / L² + Σ_cut max(−A_in, x_i x_j/L² − A_out).

The second option halves the boundary loss relative to the 2008 treatment. check_reduction.py
confirms the lemma numerically on 12 random step functions.

## 3. The certificate (cert.py, cert_sym.py) and its independent check (verify.py)

For θ ∈ [0,1] per cut pair, max(u, v) ≥ θu + (1−θ)v. The claim f ≥ B on [−1,1]^L is certified by
the identity, in y = (1, x):

  f_θ(x) − B = yᵀ S y + Σ μ_t (x_i x_j s₁ + x_j x_k s₂ + x_i x_k s₃ + 1) + Σ d_i (1 − x_i²),

where:
- S + εI ⪰ 0, and μ, d ≥ 0;
- each triangle form has s₁ s₂ s₃ = +1. It is ≥ 0 at every vertex of the box, and it is
  multilinear, so it is ≥ 0 on the whole box.

On the box, yᵀ y ≤ L + 1, so Q\* ≥ B − ε(L+1).

The multipliers come from a floating-point SDP (CVXPY/Clarabel, triangle inequalities added by
cutting planes, mirror symmetry a → 1−a used to block-diagonalise). They are then rounded to
rationals. S is rebuilt exactly and its positive semidefiniteness is checked exactly:
- cert.py uses LDLᵀ over the rationals;
- verify.py, written separately, uses Sylvester's criterion with FLINT and recomputes the cut
  areas by polygon clipping.

red.py checks that forged certificates fail: the bound raised by 1e-3, the triangle multipliers
dropped, and the boundary loss ignored.

## 4. Results

| L | float relaxation | certified δ₃ ≥ | verify.py |
|---|---|---|---|
| 32 | 0.050206 | 0.0502059 | VERIFIED |
| 64 | 0.052193 | 0.05219317 | VERIFIED |
| 128 | 0.052962 | 0.05296151 | VERIFIED |
| 192 | 0.053175 | 0.05317533 | VERIFIED |
| 256 | 0.053249 (round 9 of the cutting planes) | **0.05324921** | VERIFIED |

The 2008 certified bound is 0.051117.

## 5. The twelve-block colouring is a strict first-order optimum (kkt.py)

For φ* the twelve-block function, the first-order field is g(a) = ∂Q/∂φ(a) / 2. It equals half
the sum of ∫ φ* over [a/2, (1+a)/2] and over [2a−1, 2a] ∩ [0,1].

Computed exactly at 4,384 rational sample points:
- φ*(a)·g(a) < 0 at every sample, so no small interval flip lowers Q;
- the smallest margins are at the breakpoints, where g changes sign;
- away from the breakpoints (more than 2/548 from one) the margin is at least 0.0148.

So 117/2192 cannot be beaten by a local modification of the twelve blocks. This complements the
breakpoint-only local check of 2008. It does not rule out a different global structure, which is
what the lower bound addresses.
