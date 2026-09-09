# The companion theorem: OpenAI, *Finite time blowup for the Euler equation* (2026-09-08)

Record of 2026-09-09. Source: `papers/openai-euler.pdf` (57 pages, pinned in `MANIFEST.json`),
read in full by an independent reader; the Lean side from the same repository at 8937a8f4.

**Theorem 1.1.** There exists u₀ ∈ C^∞_{c,σ}(R³) with 0 < T*(u₀) < ∞; its smooth Euler solution
satisfies lim sup_{t↑T*} ‖∇u(t)‖_{L^∞} = ∞ and ∫₀^{T*} ‖curl u(t)‖_{L^∞} dt = ∞. Unforced,
smooth, compactly supported data on the whole space. No viscosity, no force, no boundary.

## Why this is the harder theorem, and the more interesting one

The Navier–Stokes result is Clay's problem, but it is a *forced* breakdown: the force is defined
as the residual of a constructed flow. The Euler result has nothing to hide behind — the datum is
smooth and compactly supported and the equation is unforced. If it stands it is the first proof
of finite-time blowup for smooth, compactly supported, finite-energy 3D Euler, a question open
since Leray's era and the subject of Elgindi's C^{1,α} theorem, Chen–Hou's computer-assisted
boundary result, and the DeepMind–Gómez-Serrano numerical program.

## The mechanism

Exact smooth *odd* Euler solutions U_j on nested time intervals, built by adding to the parent
flow U_{j−1} a localized high-frequency oscillation plus corrections, with t_j ↑ T_∞ < ∞ and

    |∇U_j(t_j, 0)| → ∞,     Σ_j ‖U_j(0) − U_{j−1}(0)‖_{H^m} < ∞  for every fixed m.

The wave is a Craik–Criminale-type exact solution over an affine background, whose quadratic
self-interaction cancels; Proposition 3.1 corrects it to an exact smooth Euler solution on the
whole space (this is where Le Dizès–Leblanc's objection to Fabijonas–Holm — that such waves solve
the equations only along one trajectory — is answered), and Proposition 4.1 shows the new
gradients amplify the next oscillation. The limit datum u₀ = lim U_j(0) is smooth and compactly
supported by the H^m summability.

## The transfer step, which is where such arguments die

The reader's brief singled this out in advance: the solution of the limiting datum is *not* the
limit of the U_j, and the usual Euler stability constant is exp(C∫‖∇U_j‖_∞), which is exactly the
quantity that diverges. **The paper's Section 6.2 avoids this, and the reason is structural.**

It never compares U_j with U_{j'}. It compares each U_j with the hypothetical smooth solution u
of the limiting datum, *under the contradiction hypothesis* T*(u₀) > T_∞. For w = U_j − u,

    ∂ₜw + u·∇w + w·∇u + w·∇w + ∇(p_j − p) = 0,

so the only linear coefficient is ∇u, bounded by the contradiction hypothesis; the transport by
(u + w)·∇ is skew in L² at every derivative order; the cubic term closes under a bootstrap y ≤ 1.
The Gronwall inequality (6.5) reads y′ ≤ C_u y + C y² with C_u = C·sup‖u‖_{H⁴} — **a single number
fixed before j is chosen**. Nothing about U_j enters: not ‖∇U_j‖_∞ ≍ h_j, not the frequency k_j,
not the Gevrey radius. The only j-dependence is y(0) = ‖U_j(0) − u₀‖_{H³} → 0. The contradiction
hypothesis is used exactly once, to make C_u finite; it is never used to control U_j. This is the
same device as in Córdoba–Martínez-Zoroa and in the norm-inflation literature.

**Verdict: the transfer step is complete as written.** Two presentational points, neither a gap:
the paper should name the class in which T*(u₀) and "the smooth Euler solution" are defined (the
H^m Kato class with the Leray pressure — with a free pressure and no decay, smooth solutions on
R³ are not unique, since u + c(t) with p − c′(t)·x is another one, and Section 6.3's uniqueness
silently uses finite energy); and the lower bound on ‖M_j(t_j,0)‖ uses (5.4) at a time inside its
stated interval. The whole weight of the theorem therefore rests on Sections 3–5.

## What was found in Sections 3–5

- **No error.** The three candidate gaps were run down and all three closed (below).
- The load-bearing inequality is the one-sided Hessian bound λ_max(H_j) ≤ K_B + 1 of (4.29),
  which makes every displacement boundary-value problem coercive. It requires the sign m·Mv > 0
  at every label for τ ≥ 1; a failure anywhere would give a positive increment of order
  h_j h_{j−1}, which is not summable. The margin that protects it is e∗Θ³³ ≪ β ≍ x_prev^{−2}.
- The novel analytic device is Claim 2's Gevrey bound on the new particle map, obtained *without*
  exponentiating a Lipschitz norm, by composing X with the flow of an O(k^{−1/2}) lifted field.
  If there is a flaw anywhere in this paper, that is the place to look.
- (3.17)'s "P^{cm} with c independent of m" is overstated — the derivation leaves ((m+1)!)²R^{m+1}
  — and harmless, because (6.1) uses a fixed m as j → ∞.

## The withdrawn finding, and why it matters

The reader's sharpest candidate was **G1**: equation (3.16) on page 13 appeared to print the
growth constant as (k·C∗)^{n+1} with C∗ = 10(s+2) = 80, which is false at n = 0 — the H⁶ norm of
the new particle map's time derivative is of order αk⁵ℓ^{−5}, far above 80k — while Section 5 uses
K_h = k_{j−1}^{C∗}, i.e. k *raised to* C∗. That would have been the first "false as printed"
statement found in either paper.

**It is not there.** The page was rendered at 150 dpi and read: the glyphs are (k^{C∗})^{n+1}(n!)²,
with C∗ in the exponent. `pdftotext` flattens the superscript and manufactures the error.

This is the **second** time in this audit that text extraction produced a false finding — the
first was the cutoff family φ_R⁴, φ_R⁸ on page 122 of the Navier–Stokes paper, which extracts as
the dilations φ_{4R}, φ_{8R} and makes three inequalities false. Both were caught by looking at
the rendered page. The lesson is recorded because an audit that reports a manufactured error
against a Millennium claim has done worse than no audit at all: **no inequality is a finding until
its glyphs have been seen.**

## The two Lean forms

- `Euler.exists_compact_smooth_euler_singularity` (Euler/Solution.lean:43) matches Theorem 1.1
  directly, and is in one respect *more* precise than the paper: it pins down the solution class
  that makes T* well defined. It asserts a nonzero smooth compactly supported datum, 0 < T* ≤ 1, a
  solution on [0,T*), **a uniform energy bound on the whole lifespan**, maximality as an
  equivalence (a solution on [0,T] exists iff T < T*), the C¹ norm finite on every shorter
  interval, its lim sup infinite at T*, the Beale–Kato–Majda integral infinite, and no global
  smooth finite-energy solution.
- `Euler.euler_breakdown_R3` (Euler/Solution.lean:33) is the strictly weaker non-existence form.
  Equating it with blowup needs uniqueness of finite-energy C¹ solutions — the same integration by
  parts that gives energy conservation — plus Beale–Kato–Majda. **That uniqueness fails without a
  decay condition**, and the Lean class does impose square integrability and bounded energy, so
  the two forms are equivalent for these data. A formalization that dropped the energy fields
  would make the non-existence statement true for a reason that has nothing to do with fluids.

## Checks worth running (not run here)

1. The frozen-frame WKB model as an exact ODE system: the sign of m·Mv, the exponential growth,
   a₂ ≈ a, β₂x_tar² ≈ 1, p₂·Mp₂ < 0.
2. Every scale inequality of §5.5 and (6.1)–(6.2) in exact logarithmic arithmetic.
3. The symbolic identities of §3, including the trace check that fixes the −2 in (3.14).
