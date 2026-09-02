# Gain-weighted well-counting in a congestion mean-field game

**Certified equilibria whose density carries more local maxima than the potential has wells — two theorems, a seven-row bracket table, and an exact, gamma-independent crossover constant.**

Draft v0.1 (machine-generated) · 2026-09-02 · repository cert-machine @ git fac3b8a

[OPERATOR] author line · [OPERATOR] venue · [OPERATOR] acknowledgments · [OPERATOR] AI-involvement disclosure wording

## Status and provenance

Every number in this document is interpolated at build time from machine-written
certificates in `certs/` (named where used); the build refuses to render if any
certificate is missing, refused, or structurally moved. The finding originated on
the author's frontier-apps bench and was **re-proved end to end inside
cert-machine**: an independent verifier lineage (a bit-for-bit-calibrated
extension of the frozen stdlib Python verifier), independently computed
approximate inverses, a fresh critical-point counter, and falsifier batteries
whose red controls fire. Nothing here has been published or sent anywhere.
Priority note: the companion enclosure of the base instance (sigma = 1/2,
single-harmonic potential; the page `reports/mfg-congest.html`) was never
published either — it is the same author's unpublished base instance and is the
frozen calibration gate of the present verification, not prior art.

## Abstract

We prove, by validated numerics, that a stationary discounted congestion
mean-field game on the torus admits equilibria whose population density has
strictly more local maxima than the cost potential has wells. With
V(x) = A1 cos 2πx + A2 cos 4πx and A1 > 4A2 — exactly ONE well — the certified
equilibrium density at our main instance has EXACTLY 2 strict local
maxima (Theorem 1); a third-harmonic instance yields EXACTLY 3
(Theorem 2). The honest mechanism is elementary and we state it as such: the
equilibrium re-weights harmonics **the potential already contains** through the
band-pass linear-response gain c(κ) = κ/[(1+σκ)² + γκ], so the density counts
wells with gain-weighted amplitudes while the potential counts them flat. The
second-vs-first harmonic crossover σ* = 1/(8π²) is INDEPENDENT of the coupling
γ — decided here as an exact-rational polynomial identity (the γ-coefficient of
the crossover polynomial is identically zero), not by float agreement — and the
limiting splitting window is the exact rational interval (1/16, 1/4)
(third harmonic: (1/27, 1/3), the Chebyshev U_{k−1} law). Around each theorem
sit five further certified instances forming a bracket table: negatives below
the amplitude threshold and above σ*, replications, and a threshold pin — the
splitting threshold at σ = 0.002, γ = 0.01 lies in [0.13, 0.14] by certified
counts, with the exact-rational linear-response prediction
r_c = 0.132725 inside. All enclosures are
radii-polynomial certificates at radius ~2.52e-13 with local
uniqueness in the full sequence-space ball (even AND odd blocks) and both
positivity walls certified. This document is generated from those certificates.

## 1. The model and the exact instances

Stationary discounted congestion MFG on the unit torus (congestion exponent
a = 1/2):

    u − σu″ + ½ (u′)²/√m = V(x) + γ m
    m − σm″ − (√m · u′)′ = 1,   m > 0,

V(x) = A1 cos 2πx + A2 cos 4πx + A3 cos 6πx, augmented with the branch variable
w = m^{−1/2} and the reciprocal constraint m·w² = 1, solved in even cosine
Fourier space with the derivative field p = u′ carried odd.

**Coefficient honesty.** Each theorem is a statement about specific binary64
doubles, not about the decimal strings that name them. Main instance (T1):
σ = 0.002 (0x1.0624dd2f1a9fcp-9),
γ = 0.01 (0x1.47ae147ae147bp-7),
A1 = 0.003 (0x1.89374bc6a7efap-9),
A2 = 0.0006000000000000001 (0x1.3a92a30553262p-11), N = 96,
ν = 1.02. Three-peak instance (T6): A3 = 0.00075
(0x1.89374bc6a7efap-11), A2 = 0, same σ, γ, N, ν.

## 2. Linear response: the band-pass gain and the exact crossover

At first order in the potential amplitudes the congestion term drops and each
harmonic responds independently: m̂_k = −c(κ_k) A_k with κ_k = (2πk)² and

    c(κ) = κ / [ (1 + σκ)² + γκ ].                                   (†)

Three facts about (†) are decided in EXACT RATIONALS
(`certs/terra-sigmastar.json`; stdlib fractions, no floats in any verdict):

**Proposition 1 (band-pass).** As polynomials in Q[σ, κ, γ]:
D − κ ∂D/∂κ = (1 + σκ)(1 − σκ), where D is c's denominator. The γ-term cancels
identically, so sign(dc/dκ) = sign(1 − σκ) for every γ: the gain peaks at
κ = 1/σ.

**Proposition 2 (γ-free crossover).** With s = σκ₁, g = γκ₁, the k-th-vs-first
crossover polynomial N_k(s, g) = k²[(1+s)² + g] − [(1+k²s)² + k²g] factors as
(k² − 1)(1 − k²s²): its g-coefficient is the ZERO polynomial and its positive
root is s = 1/k exactly (decided for k = 2..12). Hence c_k = c_1 exactly at
σ = 1/(4π²k); at k = 2,

    σ* = 1/(8π²) ∈ [0.012665147955292222, 0.012665147955292222]

(rational bracket via Machin's formula, width 1.26e-44;
the rational endpoints are in the certificate). The γ-independence is an exact
cancellation, not numerical smallness.

**Proposition 3 (the splitting windows).** sin 2πkx = sin 2πx · U_{k−1}(cos 2πx),
so V acquires interior critical points beyond x = 0, ½ iff k·r·|min U_{k−1}| > 1
(r = A_k/A1). The flat thresholds are exact rationals from the ranges of
U₁ = 2c and U₂ = 4c² − 1: threshold 1/4 at k = 2 and 1/3 at k = 3. The
equilibrium obeys the SAME criterion with gain-weighted amplitudes, and
c_k/c_1 → k² as (σ, γ) → 0, so the limiting splitting windows are exactly
(1/16, 1/4) and (1/27, 1/3).

**One sentence, stated honestly:** between the gain-weighted count and the flat
count, the crowd splits at the bottom of a single well. The mechanism —
non-flat linear gain changing the critical-point count of a two-harmonic
signal — is elementary [CITE NEEDED: a textbook-level reference; stating this
as elementary isolates the actual contribution, which is the MFG setting, the
exact γ-free constant, and the nonlinear certificates below]. Linear response
PREDICTS; only the certificates PROVE.

## 3. Theorem 1 — two peaks over one well

**Theorem 1.** At the T1 instance of §1 (A1 > 4A2: V has exactly one well),
there is an exact equilibrium (u, m, w) of the full congestion system within
ℓ¹_ν distance 2.520e-13 of the stored candidate, locally unique in the
full sequence-space ball — even (cosine) AND odd (sine) blocks — with
m ≥ 0.8944 and w ≥ 0.9743 over the WHOLE ball,
and EVERY density in that ball has EXACTLY 2 strict local maxima
and 2 strict local minima on the torus, while V has exactly
1 well. (`certs/terra-recert-t1.json`,
`certs/terra-peakcount-t1.json`.)

Proof numbers (radii-polynomial / Newton–Kantorovich, all bounds in
outward-rounded interval arithmetic): Y0 = 2.472e-14,
Z1 = 0.8970 (even 0.8970 / odd 0.8970),
Z2 = 1131.8243, closure margin 4.690e-6. The
peak count derives ONLY from certified region signs: an alternating chain of
curvature and slope regions covering [0, ½], each sign certified over the whole
ball with the ball's derivative pads folded into every cell bound
(sup|δm′| ≤ 2.941e-11, sup|δm″| ≤ 1.373e-8), with the
smallest certified margin 6.72e-2 — more than six orders above the
pads.

## 4. Theorem 2 — three peaks over one well

**Theorem 2.** At the T6 instance (third harmonic, A3/A1 = 0.25,
one well), the analogous statement holds with radius 2.731e-13,
m ≥ 0.8823, and EXACTLY 3 strict local maxima
(3 minima); V has exactly 1 well.
(`certs/terra-recert-t6.json`, `certs/terra-peakcount-t6.json`.)

## 5. The bracket table — seven certified instances under one theorem

Honest counting: the finding is the two theorems above plus THIS TABLE — rows
of a table are rows of a table, not further theorems.

| instance | σ | ratio | N | radius r | Z1 | min m | peaks / wells |
|---|---|---|---|---|---|---|---|
| T1 | 0.002 | A2/A1 = 0.2 | 96 | 2.52e-13 | 0.8970 | 0.8944 | 2 / 1 |
| T2 | 0.002 | A2/A1 = 0.12 | 96 | 2.25e-13 | 0.8889 | 0.9059 | 1 / 1 |
| T3 | 0.02 | A2/A1 = 0.2 | 64 | 2.97e-14 | 0.5235 | 0.9621 | 1 / 1 |
| T4 | 0.002 | A2/A1 = 0.15 | 96 | 2.37e-13 | 0.8919 | 0.9016 | 2 / 1 |
| T6 | 0.002 | A3/A1 = 0.25 | 96 | 2.73e-13 | 0.9046 | 0.8823 | 3 / 1 |
| T7 | 0.002 | A2/A1 = 0.13 | 96 | 2.30e-13 | 0.8899 | 0.9044 | 1 / 1 |
| T8 | 0.002 | A2/A1 = 0.14 | 96 | 2.32e-13 | 0.8909 | 0.9030 | 2 / 1 |

T2 (r = 0.12) and T3 (σ = 0.02 > σ*) are one-peak negatives exactly where the
linear response predicts none; T4 replicates the split at r = 0.15; T7/T8 pin
the splitting threshold at σ = 0.002, γ = 0.01 inside **[0.13, 0.14]** by
certified counts, and the exact-rational prediction
r_c = [(1+4s)² + 4g]/(16[(1+s)² + g]) = 0.132725…
(rational bracket in `certs/terra-bracket-table.json`) lands inside the pin.

## 6. Companion result — an exact solution count

For the ergodic mfg-cap system (V ≡ 0, monotone coupling c = −12, σ = 1/2), a
Krawczyk exhaustion census proves the N-mode even Galerkin truncation has
EXACTLY 3 solutions in an explicit printed box for
N = 2, 3, 4, 5 (N = 5: 6,954,073
boxes; every subbox eliminated by interval-residual or Krawczyk exclusion, each
solution isolated by Moore–Krawczyk K(X) ⊂ int(X)). The claim is stated
box-bounded and truncation-level; the PDE-level count is an open problem.
(`certs/mfg-cap-census-N{2..5}-c-12.json`.)

Its FUNCTION-SPACE companion: at each of six couplings c = -11, -12, -14, -16, -20, -24
— past the Lasry–Lions monotonicity wall c* = −σ²(2π)² — the constant solution,
the symmetry-broken branch and its half-shift mirror are enclosed in PAIRWISE
DISJOINT ℓ¹_ν uniqueness balls with certified positive density (deepest floor
min m ≥ 4.45e-4 at c = −24): AT LEAST THREE distinct exact
solutions of the SYSTEM at every listed coupling, and the half-shift symmetry
provably produces a different solution, not a relabeling. At c = −9.5, inside
the monotone regime, the branch collapses onto the constant and no claim is
made. (`certs/mfg-cap-multiplicity.json`.)

## 7. Method and verification posture

The enclosures are radii-polynomial certificates on the augmented (a₀, p, m, w)
system with the reciprocal constraint, ℓ¹_ν Banach-algebra tail bounds (the
enclosed object solves the SYSTEM, not an N-mode approximation), and both
blocks of the linearization certified — the odd block is where a
symmetry-breaking solution would live. Two independent implementations agree:
the certified T1 radius here equals the originating bench's record to the last
digit, with independently computed approximate inverses on each side. The
verifier's falsifier battery (nine controls per instance) includes two that
attack the extension's own new lines: zeroing the instance's harmonic data term
and moving it to the wrong mode must each explode the residual — and do.
Positivity of m and of the branch selector w is certified over the whole ball,
never observed on a plot. Peak counts never trust a float sign: floats propose,
certified region chains decide, and anything uncertifiable REFUSES.

The falsified prior worth naming: the belief that equilibrium peaks cannot
exceed potential wells was THIS LAB'S OWN working assumption, formed on an
unreproduced ~508-sample float campaign — not folk belief, and not literature.
The certificates above refute it.

## 8. Related work and fences

- Karuturi, arXiv:2605.20213 — THE MANDATORY FENCE: spontaneous instability of
  the uniform state under an interaction kernel with NO potential, with a
  cognate 8π²ν² constant for a different quantity. Ours is the driven response
  to a structured cost under a fixed potential, inside the uniqueness regime.
- Cesaroni–Cirant, arXiv:1705.10741 — the foil: there, density peaks mirror
  the potential's wells; here they certifiably exceed them.
- Osborne–Smears, arXiv:2502.14687 — different in kind (FEM a-posteriori
  analysis, not equilibrium enclosures).
- Cecchin–Dai Pra–Fischer–Pelino, arXiv:1810.05492 — non-uniqueness via a
  different mechanism (finite state space).
- van den Berg–Lessard (radii polynomials) and Rump (Krawczyk / interval
  verification) — the CAP lineage this work instantiates. [OPERATOR/CITE:
  exact reference strings before submission.]

## 9. Open problems

PDE-level census (rung b); k-peak uniformity in k; sharper r_c digits;
non-even branches as γ → 0; the time-dependent forward–backward CAP.

---
*Generated by tools/build-terra-writeup.js from the named certificates; the
build refuses if any input is missing, refused, or moved. Draft v0.1 wants a
human read [OPERATOR] before anything further; nothing is sent anywhere without
explicit operator release.*
