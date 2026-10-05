# δ₄: does the δ₃ centring method carry over? — scout, 2026-10-05

**Verdict for `delta4-centring-transfer`: BLOCKED**, for two independent reasons. Either one is enough.

1. **The candidate is wrong.** BCG's 36-block colouring is not the best known δ₄ upper bound.
   - Lu–Peng (arXiv:1107.2888, JCTA 2012) give c₄ ≤ **1/72 ≈ 0.0138889**. Butler–Graham–Lu (arXiv:1209.2687) restate it as the best known.
   - That is 19.3% below BCG's 0.0172203.
   - Their colouring is arithmetic, not a block colouring: colour ℓ by whether the first nonzero base-11 digit of ℓ is a quadratic residue mod 11.
   - No functional of a block function φ can represent it.
2. **There is no PRS-type reduction for k = 4.**
   - The indicator of a monochromatic 4-AP carries a quartic term x₁x₂x₃x₄.
   - That term is not determined by local densities.
   - The only relaxation that keeps it — the minimum over local 4-point laws with the exact pair statistics — evaluates to **0**.

What does carry over is narrower. Among block colourings, BCG's φ\* passes every local test the δ₃ proof used, exactly. "BCG is optimal among block colourings" is a well-posed open question, but it is not δ₄.

Everything below is exact (BigInt / rationals) unless marked *float*. Code: `instruments/delta4/`. Record: `certs/delta4-probe.json`. Battery: `node instruments/delta4/battery.js` (29/29 PASS, 7 red controls refused, ~9 s).

## 1. The functional

For the colouring a ↦ φ(a/n), put x = a/n, t = d/n and Δ = {x, t ≥ 0, x + 3t ≤ 1} (|Δ| = 1/6). Then

F(φ) = lim #mono 4-APs / n²
     = 1/48 + (1/8)[∬_{R01} + ∬_{R12} + ∬_{R23} + ½∬_{R02} + ½∬_{R13}] φ(u)φ(v) + (1/48)(∫φ)² + (1/8)∬_Δ φ(x)φ(x+t)φ(x+2t)φ(x+3t).

The pair regions, with (u, v) = (x+it, x+jt) and area g/6 for gap g = j − i:

| pair | gap | region | area |
|---|---|---|---|
| 01 | 1 | 0 ≤ u ≤ v, 3v − 2u ≤ 1 | 1/6 |
| 12 | 1 | u ≤ v ≤ 2u, 2v − u ≤ 1 | 1/6 |
| 23 | 1 | u ≤ v ≤ 1, 2v ≤ 3u | 1/6 |
| 02 | 2 | 0 ≤ u ≤ v, 3v − u ≤ 2 | 1/3 |
| 13 | 2 | u ≤ v ≤ 1, v ≤ 3u | 1/3 |
| 03 | 3 | the full triangle | 1/2 |

One sweep code computes every term exactly. It is the section length on the kink list τ = 6(E − E′)/g, trapezoid-exact.

Checks:
- The decomposition F = (|Δ| + ΣP + T₄)/8 holds exactly.
- **Block colourings:** brute-force counts agree with F term by term to O(1/n).
  - Each term's gap, multiplied by n, tends to −1/2.
  - This holds for BCG rounded at n = 2000–16000 and for a random 9-block colouring at n = 100·W, 200·W and 400·W.
- **Colourings with arithmetic structure:** F does not agree.
  - **Parity colouring (−1)^a.** The gap-1 terms agree (0). The gap-2 term and the quartic (1/6 each) do not. The count is 1/12, while F of its step function is 1/36.
  - **Quadratic phase sign cos(2π√2 a²)** (*float*): every pair term tends to 0, as for a random colouring. The quartic tends to about 1/162 (predicted ∫A(u)A(3u)du/6), not 0.

Which terms reduce:
- **Gap 1:** exact for every colouring. Each ordered pair is consecutive in exactly one 4-AP per position, so these are quadratic forms of the step function, like N⁺ for k = 3.
- **Gap 3:** Σχ(a)χ(a+3d) = ½[Σ_{c mod 3}(class sum)² − n] ≥ −n/2. It is a sum of squares, the exact analogue of PRS's T ≤ n²/8, and can be dropped.
  - Dropping it is not free. BCG's φ\* is unbalanced: ∫φ\* = −8.38·10⁻⁴ exactly, because the pattern is not antisymmetric.
- **Gap 2:** exact only per parity class (two functions); the kernel is not PSD.
- **The quartic:** no reduction.
  - The law uniform on the 8 odd tuples of {±1}⁴ has every first and second moment 0 and no monochromatic tuple.
  - So "min over local laws with the exact pair moments" is 0.
  - For k = 3 the indicator has no cubic term, so that relaxation is exact.
- No quadratic minorant with fixed multipliers is tight to first order at an odd (3–1) tuple (short proof in the record). φ\* has 3–1 splits on **54.3%** of Δ.

## 2. The candidate

- F(BCG 36 blocks) equals their printed fraction 1793962930221810091247020524013365938030467437975 / 104177418768222598213753754515890676996254443021344 **exactly**. The denominator is 4W.
- One block length +1 breaks the match (red control).
- BCG is 17.3% below random (1/48).

Search for a better block colouring (*float*, `search.js`, basin hopping with merge / split / jiggle and Newton polish on F):
- Two runs started at BCG accepted no move in 80 hops each.
- Five random 20–49-block starts ended 2.9–6.1% above BCG.
- No better block colouring was found. That is weak evidence, nothing more.

**The real record is arithmetic** (Lu–Peng, re-verified here):

| colouring | value | how checked |
|---|---|---|
| Z₁₁ quadratic-residue colouring, solid residue classes | 1/66 | exact, multi-class sweep |
| two-level unrolling mod 121 | 37/2662 | exact |
| full unrolling at n = 16000 | count/n² = 0.0138586 | exact integer count; n·gap = −0.484 → 1/72 |

- In this colouring every 4-AP with d ≢ 0 (mod 11) is non-monochromatic.
- Sampled single flips (n = 16000, 15 sample points, exact integer flip deltas) all raise the count, so it is first-order stable under local flips. That is evidence, not a proof.
- Exhaustive search of Z_m (m ≤ 40) for colourings with no mono 4-AP on four distinct residues:
  - avoiders exist exactly for m ∈ {5–12, 14, 15, 18, 21, 22, 33} and for no other m up to 40;
  - this reproduces W_c(4,2) = 34 (Irawan, arXiv:2509.14595);
  - no solid residue colouring for any of these m beats m = 11 (m = 33 leaves 10 of 11 cosets {r, r+11, r+22} monochromatic).
- Lu–Peng conjecture that for k ≥ 4 the [n] limit equals the Z_n limit, i.e. position plays no role. Their conjectures 1–2 point to 1/72 being sharp, up to a 4 | n caveat.

## 3. First order and the Hessian at φ\* (the block subproblem)

h₄:
- h₄ is continuous and piecewise linear. It is linear between the candidates a = (dE′ − d′E)/(d − d′), d ≠ d′ ∈ ±{1,2,3}: 6191 points, exact midpoint linearity on 716 intervals.
- **h₄ ≥ 0, min 0, zero exactly at the 35 edges and nowhere else, no jumps.**
- One-sided slopes are equal at every edge, all small rationals, minimum 7/6.
- ∫h₄ = −(ΣP + 2T₄)/2 exactly. Exact finite differences of F (ε = 10⁻¹²) agree with h₄ to within 4·10⁻¹², i.e. O(ε).

Edge-shift Hessian H:
- **H = diag(κ_j + 2U) + X¹ + X² + X³**, where U = 17/12 is the universal local self-interaction of a sliver.
- It matches exact second differences of F entry by entry.
- **H ≻ 0** exactly (LDLᵀ), with **λ_min ∈ [411/5000, 823/10000]**, about 0.0822 (δ₃: about 0.1266).
- U = Q₂ 7/4 + C₃ (−2/3) + Q₄ 1/3. The cubic and quartic local terms enter at Hessian order; dropping them is a red control.

Residue-class splits:
- The second-order form is block-diagonal by characters of Z_m. Order 2 sees only gap-2 pairs, order 3 only gap-3, order ≥ 4 none.
- Local terms: u₂ = 5/12, u₃ = 1/6, u₄ = 1/12, u₆ = 11/108.
- All split Hessians are PD exactly: parity λ_min ≈ 0.53, mod 3 ≈ 1.07, order ≥ 4 ≥ 7/6.
- The model matches exact two- and three-class F.
- So φ\* is a **strict local minimiser** to second order even against residue splits — and it is still beaten by 19% globally. Local tests are far from sufficient for k = 4.

## 4. Certificate feasibility

**For δ₄: none of this kind can exist** (§1: the reduction is vacuous; §2: the optimum is not a block function).

**For the block-only theorem** ("BCG minimises F among block colourings"): the inner zero-gap logic has its two inputs (h₄ ✓, PD Hessian ✓), but:
- ∬σσσσ over a cell 4-tuple is not a function of cell averages. On a 1/128 grid plus the edges (163 cells), 34,361 cell 4-tuples carry quartic mass.
- A dense degree-4 moment relaxation would need a 13,530 × 13,530 PSD block (3.1·10⁷ moments). That is out of reach for exact certification; even a float solve is at the limit.
- The local C₃ + Q₄ must be carried at edge resolution.
- The [−1,1] relaxation of F is not the weak-\* closure of ±1 colourings: the quartic is not weakly continuous.

Estimate: a new relaxation plus heavy SDP engineering — weeks, uncertain. It proves a statement about block colourings only.

## 5. The F_p analogue

- For every colouring of Z_p, exactly, #mono/p² = (1/8)(1 + 6μ² + Λ₄). Every pair term is μ², so the quartic is the entire problem.
- There is no position to expand in, and the pointwise relaxation is again 0.
- Circle blocks are weak: 11 equal blocks in the quadratic-residue pattern give 15/121 exactly, only 0.8% below random (brute force in Z₃₀₀₁ agrees).
- The Lu–Peng bounds 7/96 ≤ m₄(Z_p) ≤ 17/150 (= 7/192 ≤ δ̃₄ ≤ 17/300 in erdosproblems' normalisation) were read at source:
  - 17/150 comes from their B20-periodic word (*float*: 0.113327 at p = 4001);
  - m₄(Z₂₀, B20) = 36/400 and m₄(Z₂₂, B22) = 42/484 are exact here;
  - the 7/96 lower bound is not checked here.
- Not set up further: the δ₃ method has nothing to centre on.

## For the operator

**The targets row's finding text is wrong.** It says "BCG 2010 give a 36-block colouring (the δ₄ upper bound)". It should say Lu–Peng 2011, c₄ ≤ 1/72.

**The erdosproblems #1186 page** (snapshot 2026-10-05) lists no [n] bound for k = 4. A comment citing Lu–Peng's 1/72 would be a correct, small contribution. It is gated, like every send.

**A real δ₄ attack** would have to be arithmetic on both sides:
- upper bounds from residue/unrolling searches;
- lower bounds by Fourier/U³ counting (Wolf, Lu–Peng in Z_n) or SDPs over windows.

That is a different target from the δ₃ port.
