# δ₃ = 117/2192: the twelve-block colouring is optimal (computer-assisted proof)

**Status:** the certificates below are verified by `vcheck.py`, which was written separately from the
generators, and forged certificates are rejected (`vred.py`). The proof has not been refereed by
anyone else. Carlos decides what happens to it; the bench sends nothing anywhere.

## Statement

Let V(n) be the minimum, over all 2-colourings of {1,…,n}, of the number of monochromatic 3-term
arithmetic progressions, and let δ₃ = liminf V(n)/n². Graham asked for δ₃ ($100); this is Erdős
Problem #1186 with k = 3.

**Theorem.** δ₃ = 117/2192 = 0.0533759…

**Upper bound.** Parrilo–Robertson–Saracino (2008) give a twelve-block colouring. In units of
n/548 its blocks are 28, 6, 28, 37, 59, 116, 116, 59, 37, 28, 6, 28, with colours alternating.

**Lower bound (new).** It follows from

**Theorem A.** For every measurable φ:[0,1]→[−1,1],
  Q(φ) := ∬_R φ(a)φ(b) da db ≥ −5/137,  where R = {(a,b) ∈ [0,1]² : a/2 ≤ b ≤ (1+a)/2}.

The PRS reduction (their Lemma 1; re-derived in ../THEOREM.md §1) works as follows:
- 2V = n²/2 − |N⁺| − |T| + o(n²), with |T| ≤ n²/8.
- For φ = ±1, the colouring's step function, |N⁺| = n²(1/2 − Q(φ))/2 + O(n).
- Hence V(n)/n² ≥ 1/16 + Q*/4 − O(1/n), where Q* = inf Q.

So δ₃ ≥ 1/16 − 5/548 = 117/2192. The colouring φ* attains Q(φ*) = −5/137.

## Proof of Theorem A

### 1. Centring at φ*

Put σ = (1 − φφ*)/2. This is the part of φ flipped against φ*, so σ ∈ [0,1] and
m := ∫σ = ½‖φ − φ*‖₁. Let g* = Kφ*, where K is the kernel of R symmetrised, so that
g*(a) = ½(∫_{a/2}^{(1+a)/2} φ* + ∫_{[2a−1,2a]∩[0,1]} φ*). Let h = −φ* g*.

Expanding Q around φ* gives, exactly and for every φ:

  E(σ) := (Q(φ) − Q(φ*))/4 = ∫₀¹ h σ + Q(φ* σ).

`vcheck.py` re-checks this identity in exact arithmetic on random step functions.

Properties of h:
- h is continuous and piecewise linear, with nodes at the multiples of 1/1096. Every kink of g* sits
  where a/2, (1+a)/2, 2a or 2a−1 meets an edge of φ*, and every edge is a multiple of 2/1096.
- h ≥ 0, and its zeros are exactly the 11 breakpoints of φ*.
- Its one-sided slopes at the breakpoints are 1 or 3/2, and ∫h = 5/137.

Theorem A is the statement E ≥ 0. Because φ → −φ maps σ to 1 − σ and leaves Q unchanged, it is
enough to prove E ≥ 0 when m ≤ 1/2.

### 2. The discretisation lemma

Take a partition of [0,1] into cells I_i whose endpoints include every edge of φ*. On cell I_i, φ*
takes the constant sign s_i; write w_i = |I_i| and y_i for the average of σ on I_i. Then
E(σ) ≥ L(y), where L is the sum of three kinds of term:

- **Each cell (bathtub).** ∫_{I_i} hσ ≥ a_i y_i + b_i y_i², with a_i = w_i·min_{I_i} h and
  b_i = (w_i²/2)/max m_i′.
  - Here m_i(v) = |{a ∈ I_i : h(a) < v}|. The bathtub function y ↦ min{∫_{I_i} hσ : avg σ = y}
    has value 0 and slope a_i at y = 0, and its second derivative is w_i²/m_i′ ≥ 2b_i.
- **Pairs I_i × I_j inside R:** contribute exactly s_i s_j w_i w_j y_i y_j.
- **Pairs I_i × I_j cut by ∂R**, with inside area A_in and outside area A_out:
  - if s_i s_j = +1: ∬_in σσ ≥ max(0, w_i w_j y_i y_j − A_out);
  - if s_i s_j = −1: −∬_in σσ ≥ max(−A_in, −w_i w_j y_i y_j).
  - Both hold because 0 ≤ σ ≤ 1.

Note that L(0) = 0 and L is exact to first order at y = 0: no information is lost at φ* itself.

### 3. The region cover

The region m ∈ [0, 1/2] is covered by five pieces, each with its own certificate. Here
m = Σ w_i y_i, and each piece may use its own grid.

| region (m = ∫σ) | grid | certificate | bound on E |
|---|---|---|---|
| [0, 1/5] | 130 cells | inner (zero gap) | E ≥ 0, equality at φ* |
| [1/5, 3/10] | 130 cells | slab | E ≥ 2.78e-4 |
| [3/10, 2/5] | 130 cells | slab | E ≥ 3.03e-4 |
| [2/5, 9/20] | 146 cells | slab | E ≥ 2.74e-4 |
| [9/20, 1/2] | 146 cells | slab | E ≥ 4.63e-4 |

The two grids:
- 130 cells: multiples of 24/1096, plus 4/1096 steps within 8/1096 of each breakpoint, plus mirror
  images.
- 146 cells: multiples of 8/1096, plus the breakpoints.

**Slab certificate.** On the region R_k = [0,1]^n ∩ {lo ≤ m ≤ hi} it is an exact polynomial identity

  L_θ(y) − B = vᵀ S v + Σ_f μ_f f(y),  v = (1, y),  μ ≥ 0,  θ ∈ [0,1],  S + εI ⪰ 0,

where:
- L_θ ≤ L takes, per cut pair, the convex combination θ·(bound 1) + (1−θ)·(bound 2).
- Each form f is a product of two factors that are nonnegative on R_k. The factors are y_i, 1−y_i,
  m − lo and hi − m. The other admissible form is a triangle inequality
  1 + s₁z_iz_j + s₂z_jz_k + s₃z_iz_k with s₁s₂s₃ = 1 and z = 1 − 2y.
- Hence L ≥ B − ε(1+n) on R_k.
- The multipliers are float duals rounded to rationals. S is recomputed exactly and checked exactly.

**Inner certificate.** On {m ≤ 1/5} it is an exact identity in which every term vanishes at y = 0:

  L₀(y) = yᵀPy + Σ λ_ij y_i(1−y_j) + Σ ν_j y_j(1/5 − m) + κ m(1/5 − m) + Σ N_ij y_i y_j + Σ c_i y_i,

with P ≻ 0 (proved exactly) and every multiplier ≥ 0. L₀ ≤ L because it uses the cut-pair bounds
that vanish at 0. So E ≥ L₀ ≥ 0 on the region.

In particular, φ* minimises Q on the whole L¹-ball ‖φ − φ*‖₁ ≤ 2/5, fractional (non-±1)
perturbations included.

Since the five regions cover m ∈ [0, 1/2], E ≥ 0 everywhere, which proves Theorem A. ∎

## Why this works where the 2008 relaxation (and s34's L = 256 bound) stopped short

1. **The first-order term is exact.** The old cell discretisation in x = φ loses first-order
   information at every cut pair. That loss of order 1/L is the "boundary loss", and it caps the
   bound below 117/2192 at every grid. In σ the first-order part is ∫hσ, which is bounded per cell
   by the exact bathtub, and the remaining loss is second order in σ.
2. **The ±φ* symmetry is broken on purpose.** The constraint m ≤ 1/2 and its RLT products stop the
   relaxation from mixing the two optima. Slabs in m localise it further: in a mixture, every
   component must keep (m − lo)(hi − m) ≥ 0 on average.
3. **Near φ* the relaxation is exact.** The forms y_i(1 − y_j) turn the linear budget a_i y_i into
   exactly the bathtub's quadratic cost (Σ_j j y_j − Σ_{i<j} y_i y_j = Σ_{i<j} y_j(1−y_i)). Combined
   with the positive-definite breakpoint Hessian (smallest eigenvalue 0.1266), this gives a strictly
   feasible zero-gap certificate.

## Supporting computations (not part of the proof)

- **Landscape** (landscape.py, 1096-cell grid, 800 descents): no colouring found below φ*. The
  nearest other genuine local minimum found has excess 1.76e-3 (17 blocks). All other low minima are
  grid neighbours of φ* in its soft breakpoint direction.
- **Discretised model** (dslab.py): its minimum on m ∈ [0.4, 0.5] is about +7.8e-4 on the 130-cell
  grid. So the negative relaxation values on that grid were relaxation gaps, which the finer grid
  removes.

## Verification record (2026-10-05)

`vcheck.log`:
- φ* has Q = −5/137, and the identity checks pass.
- inner [0, 1/5] is VERIFIED.
- The four slabs are VERIFIED, with E ≥ 2.784897e-4, 3.035513e-4, 2.747055e-4 and 4.638341e-4.
- The cover is COMPLETE, so the THEOREM is VERIFIED (37 s).

`vred.log` (each forgery is put into the full set and rejected on its own line). The forgeries are:
- the bound raised by 1e-3;
- the triangle multipliers dropped;
- the cut θ all set to 1;
- the grid missing a breakpoint;
- the slab widened;
- the inner radius doubled;
- the inner linear budget overspent;
- the inner RLT multipliers dropped;
- a slab removed from the cover.

The genuine set is accepted.

`vmut.log` (one-line edits of the verifier, each run against the genuine set plus three planted
forgeries):
- The alteration of φ*, the flip of h's sign, an optimistic cut bound, the cut bound dropped,
  bathtub curvature ×2, the bathtub slope taken from max h, and R mirrored are all DETECTED by the
  genuine set.
- "ε ignored" and "triangle sign rule relaxed" are DETECTED by the planted forgeries.
- "PD test accepts zero pivots" is EQUIVALENT: a zero last pivot after positive ones still means
  PSD, and an earlier zero pivot divides by zero.

SHA256SUMS pins the five certificates and vcheck.py.

## Reproduce

See README.md. Verification: `../.venv/bin/python vcheck.py inner-r20-g24_4_8.json slab-*.json`;
forgeries: `vred.py`.
