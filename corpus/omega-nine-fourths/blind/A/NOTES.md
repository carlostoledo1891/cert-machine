# Blind statement writer A: notes to BlindA.lean

Written 2026-11-25, between about 03:00 and 03:05 UTC (`date -u` read at 03:00:33 and at 03:04:14), by a Claude
agent working as blind writer A. Lean was not run. The book is followed **from memory**: I had no copy of
Bürgisser–Clausen–Shokrollahi (BCS), *Algebraic Complexity Theory* (Springer, 1997), at hand, so every chapter,
section and definition reference below is from memory, and the numbering within a chapter is unverified.

## Mathlib names checked (source at d13f23b723b8a846827a245b89c10fc7d3f11612, ~/Projects/mathlib-src-d13f23b7)

- `FractionRing R` is an `abbrev` for `Localization (nonZeroDivisors R)`: `Mathlib/RingTheory/Localization/FractionRing.lean:733`.
- `FractionRing.field : Field (FractionRing A)` given `[IsDomain A]`: same file, line 754.
- `IsDomain (MvPolynomial σ R)` given `[IsCancelAdd R] [IsDomain R]`: `Mathlib/Algebra/MvPolynomial/Basic.lean:203`.
- `Algebra R₀ R[S⁻¹]` for the Ore localization (which gives `algebraMap R (FractionRing R)`): `Mathlib/RingTheory/OreLocalization/Ring.lean:112`.
  Mathlib itself uses `FractionRing (MvPolynomial σ F)` as the multivariate rational functions (`Mathlib/FieldTheory/MvRatFunc/Rank.lean:27`).
- `⌊a⌋₊` is notation for `Nat.floor a`: `Mathlib/Algebra/Order/Floor/Defs.lean:133`.
- `List.getD`: lemmas in `Mathlib/Data/List/GetD.lean`; the syntax `l[k]'h`: `Mathlib/Data/List/Basic.lean:500`.
- `∑ x, f x` is global notation (not scoped): `Mathlib/Algebra/BigOperators/Group/Finset/Defs.lean:181`.
- On `ℝ`, `sSup ∅ = 0`, and `sInf s = 0` when `s` is not bounded below (`Mathlib/Algebra/Order/Archimedean/Real/Basic.lean`, lines 168, 189, 200).
- I did not use `omega` as a name, because it is a tactic keyword; the exponents are `omegaSquare`, `omegaSquareDiv`
  and `omegaRect`.

Things that could still need a repair when the file is checked, because I did not run Lean: `prog[t]'h` inside a `∀`
binder; the named argument `(R := …)` passed to `runProg`; the coercion of the ring hom `toRatFn F σ` to a function;
the `CommRing` and `Div` instances on `RatFn F σ` (an `abbrev` of `FractionRing`); the leading-dot constructor
patterns (`.input s` and the rest) in `Op.args`, `Op.cost` and `Op.value`.

## Definition by definition

| Lean definition | What it follows | Choices and alternatives |
|---|---|---|
| `Op` | BCS Ch. 4 ("Models of Computation"), §4.1, straight-line programs over a k-algebra with the operation set Ω = {λᶜ : λ ∈ k} ∪ {λ* : λ ∈ k} ∪ {+, −, *, /} (from memory). | BCS puts the inputs at the front of the result sequence (indices −n+1, …, 0). I use a free instruction `input s` instead, so that the variables need no fixed order. The two are equivalent: put a BCS program's inputs in front as free reads, or move every read to the front. |
| `Op.args`, `WellFormed` | BCS §4.1: instruction ρ reads only entries of the result sequence with index below ρ (from memory). | Without `WellFormed`, a read past the end would return `0` through `getD`. That is harmless, but I excluded it anyway. |
| `Op.cost`, `cost` | BCS §4.1, total cost: c^tot(ω) = 1 for every ω ∈ Ω (from memory). Reading an input costs 0, as BCS's inputs do. | (i) The claimant's words ("counts additions, subtractions, and multiplications") may leave constants free. Charging them changes a cost by at most a factor of 3, because each charged instruction reads at most two constants and unused loads can be deleted. (ii) Scalar multiplication may be its own instruction (here `smul`, as BCS's λ*) or a constant times `mul`. (iii) The Ostrowski measure (only nonscalar * and / count), additive complexity, bilinear complexity, rank R and border rank are all used in the literature. All of these give the same ω: BCS Ch. 15, the proposition after the definition of ω (from memory, probably Prop. 15.1), plus Strassen's R ≤ 2L for bilinear maps (BCS Ch. 14, from memory) and the border-rank results in Ch. 15. |
| `DivisionFree` | The division-free programs of the claimant's formalization: BCS's Ω without "/", computing in k[X] (from memory). | — |
| `Op.value`, `runProg` | BCS's result sequence b₁, …, b_r. | Division is passed in as a function `dv`, because `MvPolynomial` has no field division. |
| `runPoly` | Computing in A = F[σ], the formal polynomial ring (`MvPolynomial σ F`). | Correctness is an identity of polynomials, never of functions Fᴺ → F. This matters only over finite fields, where the claimant's formalization says it "requires formal polynomial identities even over finite fields". |
| `RatFn`, `toRatFn`, `runRat` | Computing in A = F(σ), the field of rational functions, taken as the fraction field of F[σ]. | Lean's `u / 0 = 0` is neutralized by `Executable`. |
| `Executable` | BCS: Γ is executable on (A; a) when every divisor it meets is a unit of A (from memory). In a field, a unit is a nonzero element. | A divisor must be nonzero as a rational function. It may vanish at points of Fᴺ: over a finite field every nonconstant polynomial can vanish on all of Fᴺ, and that is allowed. |
| `MatVar`, `xVar`, `yVar`, `prodEntry` | BCS's format ⟨e, h, ℓ⟩: an e × h matrix times an h × ℓ matrix (Chs. 14–15, from memory). | Variable `Sum.inl (i, j)` is x_{ij} and `Sum.inr (j, k)` is y_{jk}. The entry (i, k) is Σ_j x_{ij} y_{jk}. |
| `IsMatMulProgram`, `IsMatMulProgramDiv` | BCS: Γ computes a set F of elements when F is contained in the result sequence (from memory). | The outputs are not assigned to particular instructions; each entry only has to occur somewhere among the results. In my model the inputs are among the results (they are read instructions), which is harmless because no entry is a variable. The program may use constants from F only, never from an extension field. |
| `omegaSquare` | BCS Ch. 15 ("Asymptotic Complexity of Matrix Multiplication", from memory), §15.1: ω(k) = inf{τ ∈ ℝ : L^tot(⟨h,h,h⟩) = O(h^τ)}. Then a proposition shows the same infimum with L^tot replaced by the rank R. From memory, I am not sure which of the two BCS takes as the definition and which as the proposition. | (i) "O(n^s)" is written ∃ C ∀ n ≥ 1, cost ≤ C·n^s. The form "for all sufficiently large n" is equivalent, because every n has a program of finite cost (the naive one) and n^s > 0. (ii) C is chosen after F and s, matching the claim's O_{F,s}. (iii) The family is non-uniform: one program for each n, with no uniformity required. (iv) The set is nonempty (s = 3: the naive program costs 2n³ − n² ≤ 2n³) and bounded below by 0 (for n ≥ 1 every correct program has cost ≥ 1, which rules out s < 0). So Lean's `sInf` is the true infimum, and the `sInf ∅ = 0` convention never applies. (v) The infimum need not be attained, and the claim does not say it is. (vi) It uses n directly. `omegaRect F 1 1 1` is the same number, but only by a lemma (⌊n^1⌋₊ = n, from `Real.rpow_one` and `Nat.floor_natCast`), not by definition. |
| `omegaSquareDiv` | The same, computing in F(σ) with division, closer to BCS's own setting (from memory). | Always omegaSquareDiv ≤ omegaSquare, because a division-free program is also an executable program with division (this needs the lemma runRat = map toRatFn ∘ runPoly). Over infinite fields the two are equal, by Strassen's elimination of divisions (BCS Ch. 7, from memory). Over finite fields that elimination needs an extension field. I flag this as an open point and do not settle it. |
| `roundDim` | ⌊n^a⌋, the rounding in Coppersmith's rectangular papers (n × ⌊n^α⌋; from memory). | Ceiling or nearest-integer rounding gives the same exponent for weights ≥ 0. Two facts give this. Cost is monotone in the dimensions: substitute 0 for the extra variables, which costs one constant. And cost grows only by a constant factor when each side doubles: block decomposition gives 8 block products plus block additions. A weight of 0 gives ⌊n⁰⌋ = 1. Negative weights are meaningless, since then ⌊n^a⌋ = 0 for n ≥ 2, but no claim uses them. |
| `omegaRect` | The rectangular exponent ω(a, b, c) of Lotti–Romani (1983), Coppersmith (1982, 1997), Huang–Pan (1998) and Le Gall (2012) (all from memory). From memory, I do not think BCS fixes a general ω(a, b, c) in its main text. Ch. 15 handles rectangular formats through ⟨e, h, ℓ⟩ and R, and its notes discuss Coppersmith's rectangular results. So the weight order and the rounding are my choices. | **Weights:** a weights the rows of the first matrix, b the inner dimension, c the columns of the second matrix. That is BCS's format ⟨n^a, n^b, n^c⟩. **Model:** division-free, the claimant's formalization model. Claims 2 and 3 do not name a model. Alternatives: with division, or rank-based, ω(a,b,c) = inf{τ : R(⟨⌊n^a⌋, ⌊n^b⌋, ⌊n^c⌋⟩) = O(n^τ)}. The rank of ⟨e,h,ℓ⟩ is invariant under every permutation of (e, h, ℓ) (BCS, from memory: cyclic symmetry plus transposition), so the rank-based ω(a,b,c) is symmetric. For the cost-based definition here, symmetry is a theorem (cost exponent = rank exponent), not built in. Claim 3's formula is symmetric in a, b, c, so the claim does not depend on the order; only the definitions do. |
| `alphaDual` | The claim's own wording: the supremum of t ∈ [0, 1] with ω(F; 1, 1, t) = 2. | **Dimension:** in my convention ω(F; 1, 1, t) is an n × n matrix times an n × ⌊n^t⌋ matrix. The textbook dual exponent (Coppersmith 1982, from memory) multiplies n × ⌊n^t⌋ by ⌊n^t⌋ × n, which is my ω(F; 1, t, 1). The two agree whenever the cost exponents equal the rank exponents, by rank symmetry. I followed the claim's wording. A reader who prefers the textbook version should replace `omegaRect F 1 1 t` with `omegaRect F 1 t 1`. **Conventions:** Mathlib sets `sSup ∅ = 0`, but the set here is nonempty and bounded above by 1. It is nonempty because ω(F; 1, 1, 0) = 2 holds outright: an n × n matrix times an n × 1 matrix costs at most 2n², and at least n²/2, because each x_{ij} must be an argument of some charged instruction. So `sSup` is the true supremum. If claim 3 holds, the set is [0, 1/2]. Note that α asks for ω = 2 exactly, not 2 + ε. |
| `rectFormula` | Claim 3's formula as written, with the weights sorted as x ≥ y ≥ z. | y = a + b + c − max − min, which is the median. Checks: (1, 1, 1) gives 2 + 1/4 = 9/4, agreeing with claim 1. (1, 1, t) gives 2 + max(0, 2t − 1)²/(4t), which equals 2 exactly when t ≤ 1/2, agreeing with claim 2. The formula is homogeneous of degree 1, as ω(λa, λb, λc) = λ·ω(a, b, c) requires. The division by 4xyz needs positive weights, which claim 3 assumes. |
| `SquareExponent` | Claim 1, division-free (the main proposition): ∀ F, omegaSquare F = 9/4. | Fields are quantified over `Type`, as the brief allows. A universe-polymorphic version would quantify over `Type u`. |
| `SquareExponentWithDivision` | Claim 1 with division gates: ∀ F, omegaSquareDiv F = 9/4. | See `omegaSquareDiv` for how this relates to the division-free version. |
| `DualExponent` | Claim 2: ∀ F, alphaDual F = 1/2. | Read through omegaRect, which is division-free. |
| `RectangularExponent` | Claim 3: ∀ F, ∀ a b c > 0, omegaRect F a b c = rectFormula a b c. | Read through omegaRect, which is division-free. |

## Ambiguities in the claim, and how I resolved them

1. **What counts as a "scalar operation".** I count every operation of BCS's Ω (constants, scalar multiplications,
   +, −, *, /) and do not count input reads. The alternatives are listed under `Op.cost`; none of them changes ω.
2. **The paper's model against the formalization's.** The paper's model allows division and the formalization's does
   not. Over finite fields I cannot settle from the textbook alone whether the two exponents coincide, so I wrote two
   propositions.
3. **"Formal identities" over finite fields.** Every check is made in F[σ] or F(σ), never at points of Fᴺ.
   Divisors must be nonzero rational functions, never nonvanishing functions.
4. **Which model claims 2 and 3 use.** Neither names one. I used the division-free model, the one the claimant's
   formalization states.
5. **α(F): ω(F; 1, 1, t) or ω(F; 1, t, 1).** I followed the claim's wording, ω(F; 1, 1, t), which in my weight order
   is n × n times n × ⌊n^t⌋. See the `alphaDual` row.
6. **"Rounded as your textbook does".** I used the floor, ⌊n^a⌋. Other roundings give the same exponent for
   nonnegative weights.
7. **Total cost or rank as the definition of ω.** I defined ω by total cost of straight-line programs, because the
   claim counts operations. Rank-based and border-rank-based definitions give the same number.
8. **Uniformity and attainment.** No uniformity is required of the family of programs, and the claim does not say
   whether the infimum is attained; the statement does not assert either.
9. **Constants from an extension field.** The claim says "over F". Only constants of F are allowed, never constants
   from an extension of F.

## Independence

I opened only the brief (`corpus/omega-nine-fourths/prompts/blind-writer.md`), my own output folder and the
Mathlib source files listed above, in the local checkout at commit d13f23b7. I did no web search and no web fetch,
and opened no other file of `corpus/omega-nine-fourths/`. I came across no forbidden material, by accident or
otherwise.

I did not see the claimant's Lean statement
