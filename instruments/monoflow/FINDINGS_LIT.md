# FINDINGS_LIT — instruments/monoflow (run 2026-09-06, before minting)

**Question: occupancy of the exact claim** — at a certified equilibrium of the
quadratic stationary MFG, the Lasry–Lions monotone flow (AFG 2017 §2.6) has a
certified non-real eigenvalue pair, hence is not a gradient flow under any
Riemannian metric near that equilibrium; and the linearised Lasry–Lions form
is exactly c∫δm² + ∫m(δu')².

## What is standard, and is cited rather than claimed

- **Monotonicity of the MFG operator** and the resulting uniqueness: Lasry–
  Lions (2006–07); the operator form and the monotone flow: Almulla–Ferreira–
  Gomes, DGA 7(4) 2017, §2.3 (Lemma 2.3), §2.6 (2.7)–(2.8); the chapter
  Ferreira–Gomes–Tada, *An introduction to monotonicity methods in mean-field
  games* (arXiv:2502.20091). The quadratic form c∫δm² + ∫m(δu')² is the
  linearisation of their monotonicity identity (AFG's proof of Lemma 2.3 is
  the same computation with ln m in place of c m). It is a one-line fact and
  the page calls it one.
- **MFG systems are forward–backward, not gradient.** That the HJB–FP pair
  is a coupled system "structurally distinct from a generalization of gradient
  flow" is stated in the literature (search of 2026-09-06 surfaced
  arXiv:2602.11999, *from gradient flows to linearly monotone games*, and
  arXiv:2603.10336, *a globally convergent flow for time-dependent MFG*, which
  build flows precisely because the system is not a gradient). Potential MFGs
  ARE variational (the system is the Euler–Lagrange condition of a functional;
  AFG §2.2 for this very model) — which is a saddle structure, J∇, not a
  gradient flow of the pair. None of this is new and none is claimed.
- **Real spectrum of a gradient flow's Jacobian at an equilibrium** under any
  metric: linear algebra (−G⁻¹H is similar to −G^{−1/2}HG^{−1/2}). The
  certificate form — a verified non-real pair rules out every (G, E) — is the
  house's own no-gradient certificate (sin-mfg research/emergent-geometry,
  2026-08-11, scouted against Maas–Mielke gradient structures and the
  Energy-Transformer line; its exact-rational Sturm route needs a rational
  Jacobian, which this one is not — π² enters — so the verified eigenpair
  route is used instead).

## What is not located (the narrow residue)

A **certified** statement, at a specific enclosed equilibrium, that the
monotone flow's linearisation has non-real spectrum, with the equilibrium and
the eigenpair both enclosed in interval arithmetic. Searched 2026-09-06 (one
query, eight results read at listing level): nothing at the intersection of
"validated numerics" and "mean-field game flow spectrum". The nearest
neighbours build monotone or globally convergent flows and prove convergence;
none decides the spectrum at an instance. Confidence: moderate (one query,
listing level). Falsifier: a rigorous-numerics paper on an MFG flow that
reports a verified eigenpair.

## Verdict: PARTIAL — a narrow claim is permitted

Write: "at these equilibria, enclosed, the monotone flow's Jacobian has a
certified non-real eigenvalue pair; therefore no metric makes it a gradient
flow near them; the Lasry–Lions form, evaluated from the same Jacobian, is
c∫δm² + ∫m(δu')² as the theory says."

Do not write: "MFG flows are not gradient flows" as a discovery (folklore and
structure); "monotonicity decided by computation" (the form decides it by
inspection; the computation checks the assembly); anything about R1 or H0
beyond NOT DECIDED (a real spectrum reached by iteration is not a proof of a
real spectrum, and a real spectrum would not prove a gradient structure).
