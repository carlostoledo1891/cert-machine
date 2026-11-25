# Phase 4 statement writer: notes on PerN.lean

Written 2026-11-25, 09:12 to 09:20 UTC, by the statement writer of amendment A13, under the brief
`corpus/omega-nine-fourths/prompts/pern-writer.md`. Lean was not run; the file is meant to be
elaborated against Lean v4.34.1 / Mathlib d13f23b7, and any repair is logged by the runner.

## What I read

- The brief.
- The paper's LaTeX: `proof-readers/astra/inputs/build/intro.tex` (Theorem `thm:square`, the definition
  of formal arithmetic circuits, `T_n`, the one-sentence definitions of geometric border rank and
  asymptotic rank, Corollary `cor:tight`), `obstruction.tex` (Lemma `lem:bilinearize`, the
  definition of a nonscalar gate, Lemma `lem:specialize`), `consequences.tex` (the proof of
  `cor:tight`). Nothing else in `corpus/omega-nine-fourths/`.
- Mathlib source at `~/Projects/mathlib-src-d13f23b7`, to check names and signatures:
  `Mathlib/RingTheory/Nullstellensatz.lean` (`MvPolynomial.zeroLocus`, `MvPolynomial.vanishingIdeal`),
  `Mathlib/RingTheory/Localization/FractionRing.lean` (`FractionRing`, `FractionRing.field`),
  `Mathlib/Algebra/MvPolynomial/Basic.lean` (the `IsDomain (MvPolynomial σ R)` instance),
  `Mathlib/FieldTheory/IsAlgClosed/AlgebraicClosure.lean` (`AlgebraicClosure`, its `Field` instance),
  `Mathlib/Analysis/Subadditive.lean` (Fekete's lemma, `Subadditive.tendsto_lim`),
  `Mathlib/Algebra/BigOperators/Group/Finset/Defs.lean` (the `∑` notation is global).
- One `ls` of the paper's build folder and of `phase4/` was refused by the permission system before
  it ran; nothing was listed. No web search, no fetch.

## The four propositions

| name | what it says | included |
|---|---|---|
| `GatesPerN` | every formal circuit over `F` for the `n × n` product has `≥ ⌈n^(9/4)/2⌉` nonscalar `×`/`÷` gates, every field `F : Type`, every `n ≥ 2` | yes |
| `GatesPerNAll` | the same bound on the number of all `×` and `÷` gates | yes (implied by `GatesPerN`, since every nonscalar gate is a `×` or `÷` gate) |
| `AsymptoticRank` | `R_F(T_n^{⊗k})^{1/k} → n^(9/4)` as `k → ∞`, and `inf_{k≥1} R_F(T_n^{⊗k})^{1/k} = n^(9/4)` | yes |
| `BorderRankLower` | the geometric border rank of `T_n` over `AlgebraicClosure F` is `≥ n^(9/4)` | yes: Mathlib's Nullstellensatz file defines `zeroLocus` and `vanishingIdeal` for points of `σ → K`, and `zeroLocus (vanishingIdeal S)` is, by definition of the Zariski topology on affine space, the Zariski closure of `S`; so the closure is stated faithfully without any new topology |

## Definitions, their textbook sources, and the choices made

Textbook references are from memory (I had no copy of Bürgisser–Clausen–Shokrollahi, *Algebraic
Complexity Theory*, Springer 1997, "BCS", nor of Bläser, *Fast Matrix Multiplication*, Theory of
Computing Graduate Surveys 5, 2013); chapter numbers are what I remember, section and theorem
numbers are not checked.

1. **Three-tensors in coordinates** (`Tensor3 K ι₁ ι₂ ι₃ := ι₁ → ι₂ → ι₃ → K`). Source: BCS ch. 14
   (tensors of `K^e ⊗ K^h ⊗ K^l` in coordinates, structural tensor of a bilinear map), from memory;
   Bläser 2013, the section on tensors, from memory. *Choice:* coordinate arrays, not Mathlib's
   `TensorProduct`. With fixed bases the two are the same space, and rank, power and Zariski closure
   are stated directly on coordinates. *Alternative:* `TensorProduct K (ι₁ → K) (TensorProduct K
   (ι₂ → K) (ι₃ → K))` with rank as the least number of pure tensors summing to `T`; equivalent, but
   it would add a basis isomorphism to every statement.

2. **Tensor rank** (`HasRankLE`, `tensorRank`). `T` has rank `≤ r` over `K` when `T = ∑_{l<r} u_l ⊗
   v_l ⊗ w_l` with all three vectors over `K`; the rank is the least such `r`. Source: BCS ch. 14
   (definition of rank `R(t)`), from memory; Bläser 2013, from memory. *Choice:* `sInf` on `ℕ`. The
   set is nonempty for finite index sets (`|ι₁|·|ι₂|·|ι₃|` simple tensors always suffice), so the
   junk value `sInf ∅ = 0` is never reached. Rank over `F` in `AsymptoticRank`; over `F̄` inside the
   border rank.

3. **The matrix multiplication tensor** (`matMul K n`). `T_n = ∑_{i,j,k} e_{ij} ⊗ e_{jk} ⊗ e_{ki}`,
   exactly the paper's convention (intro.tex: the third factor pairs output `(i,k)` with `e_{ki}`);
   coordinate at `((i,j),(j',k),(k',i'))` is `[j = j'][k = k'][i = i']`. Source: BCS ch. 14/15
   (`⟨n,n,n⟩`), from memory; Bläser 2013, from memory. *Alternative:* the convention with third factor
   `e_{ik}`; it differs by a permutation of the third index set, so ranks, border ranks and asymptotic
   ranks agree. I kept the paper's.

4. **Tensor power** (`tpow T k`). Kronecker power with corresponding factors grouped: index sets
   `Fin k → ιᵢ`, coordinate `∏_m T (a m) (b m) (c m)`. Source: BCS ch. 14 (tensor product of tensors,
   `⟨e,h,l⟩ ⊗ ⟨e',h',l'⟩ ≅ ⟨ee',hh',ll'⟩`), from memory. *Choice:* the power of `T_n` itself, as the
   paper's definition says ("ranks of the `j`-th tensor powers"), not `T_{n^k}`; the two are equal up
   to the index bijection `(Fin k → Fin n × Fin n) ≃ (Fin k → Fin n) × (Fin k → Fin n)`, which
   preserves rank.

5. **Asymptotic rank** (`rankRoot`, `asymptoticRank`, and the prop `AsymptoticRank`). The paper
   (intro.tex) defines it as the limit of the `j`-th roots of the ranks of the `j`-th powers; the
   textbook form is `R̃(t) = lim_N R(t^{⊗N})^{1/N} = inf_N R(t^{⊗N})^{1/N}`. Source: Strassen, "The
   asymptotic spectrum of tensors", J. reine angew. Math. 384 (1988), from memory; BCS ch. 15
   (asymptotic rank and `ω`; I recall it partly in the exercises), from memory; Bläser 2013, from
   memory. **Which:** both. `AsymptoticRank` is the conjunction of (a) `Tendsto (k ↦ R_F(T_n^{⊗k})^{1/k})
   atTop (𝓝 n^(9/4))`, the paper's limit, and (b) `asymptoticRank (matMul F n) = n^(9/4)`, with
   `asymptoticRank` defined as the infimum over `k ≥ 1`. **Why they agree:** rank is submultiplicative,
   `R(s ⊗ t) ≤ R(s) R(t)` (multiply decompositions term by term), so `a_k = log R(T^{⊗k})` is
   subadditive, and `a_k ≥ 0` because `T_n ≠ 0` forces every power to have rank `≥ 1`; Fekete's lemma
   (Mathlib: `Subadditive.tendsto_lim`) gives `a_k / k → inf_k a_k / k`, and `exp` is continuous and
   increasing. Stating both closes the question of which reading a prover should target, at the cost
   of the prover also proving Fekete (which Mathlib has). *Pitfall avoided:* the infimum starts at
   `k = 1`; with `k = 0` the term is `R(T^{⊗0})^{1/0} = 1^0 = 1` in Lean and the infimum would be
   `≤ 1`, making the statement false. In the limit the `k = 0` term is irrelevant.

6. **Geometric border rank** (`flat`, `rankLESet`, `zariskiClosure`, `geometricBorderRank`). The least
   `r` such that `T`, as a point of the affine space `K^(ι₁×ι₂×ι₃)`, lies in the Zariski closure of
   the set of tensors of rank `≤ r` over `K`; with `K = AlgebraicClosure F`, as the paper says
   ("the Zariski closure, over `F̄`, of tensors computed with a given number of products"). The
   closure is `MvPolynomial.zeroLocus K (MvPolynomial.vanishingIdeal K S)`: the common zeros of all
   polynomials vanishing on `S`, which is the smallest Zariski-closed set containing `S` (Hartshorne,
   *Algebraic Geometry*, I.1, from memory). Source for border rank: BCS ch. 15 (border rank by
   approximation over `K[ε]`, Bini–Capovani–Lotti–Romani 1979) and ch. 20 (degeneration; over an
   algebraically closed field the approximative border rank equals the Zariski-closure one, Strassen
   1987 / Alder 1984), from memory; Bläser 2013, the section on border rank, from memory.
   *Choice:* the geometric (Zariski) definition, because it is the one the paper names.
   *Alternatives:* (i) the algebraic border rank, `t_ε = ε^h T + O(ε^{h+1})` with a rank-`r`
   decomposition over `K[ε]`, equal over algebraically closed fields by the theorem just cited, and
   for `K = ℂ` (ii) the Euclidean closure, also equal; both would state a different-looking but
   mathematically equivalent proposition, and (i) is the form most proofs use. *Choice:* `sInf`, so the
   proposition also asserts the set is nonempty (it is: every `r ≥ tensorRank T_n` qualifies, since a
   set lies in its closure); it implies the "for every such `r`, `r ≥ n^(9/4)`" form.

7. **Formal arithmetic circuits** (`Gate`, `Circuit`, `WellFormed`, `Gate.Holds`, `Consistent`).
   A straight-line program: a list of instructions, each reading an input variable, reading a
   constant of `F`, or applying `+ − × ÷` to two earlier positions. Source: BCS ch. 4 (straight-line
   programs, computations in `k(X)`, the Ostrowski measure), from memory; the paper's own definition
   (intro.tex, and the brief). Choices:
   - *Values in the field of formal rational functions* `F(X,Y) = FractionRing (MvPolynomial V F)`
     with `V = (Fin n × Fin n) ⊕ (Fin n × Fin n)` the `2n²` independent entries. Equality there is
     identity of rational functions, also over a finite field, as the paper requires (never equality
     of functions on `F^{2n²}`).
   - *Constants* are `algebraMap (C c)` for `c : F`; constants from `F̄` are not allowed.
   - *Division* holds only when the divisor is a nonzero element of `F(X,Y)` (Lean's `x / 0 = 0`
     would otherwise make division by zero a free gate).
   - *Acyclicity* is the hypothesis `WellFormed`: position `m` reads only positions `< m`. Without it
     a cyclic "circuit" could take any value at an output (e.g. `o := o + z` with `z := x − x`), so it
     is essential.
   - *Evaluation by a hypothesis, not a recursive evaluator:* the statement quantifies over every
     assignment `val : ℕ → F(X,Y)` making every instruction hold. For a well-formed circuit such a
     `val` is unique on positions `< size` (induction on the position) and exists exactly when no
     divisor is zero, so this is the same as "the evaluation of every admissible circuit", and it
     avoids writing well-founded recursion without Lean at hand. *Alternative:* an evaluator by
     strong recursion with gates typed `Fin m`-dependently; equivalent, harder to write blind.
   - *Outputs* are a map `out : Fin n → Fin n → Fin size` with `val (out i k) = ∑_j X i j * Y j k`
     in `F(X,Y)`.

8. **Nonscalar gates** (`Gate.IsNonscalar`, `nonscalarCount`). As in the paper's Lemma
   `lem:bilinearize`: a multiplication with both arguments nonconstant, a division with nonconstant
   divisor. Source: BCS ch. 4 (Ostrowski measure: `+`, `−` and multiplication by scalars are free;
   other multiplications and divisions cost 1) and ch. 14 (Strassen's `R ≤ 2L` for bilinear maps,
   which the paper's Lemma `lem:bilinearize` reproves for this setting), from memory. *Choice:*
   "constant" is read on the **value** (an element of `F` inside `F(X,Y)`), not syntactically (a gate
   computed from constants only). A syntactically constant gate is semantically constant, so the
   semantic count is at most the syntactic count and at most the Ostrowski count of BCS; the semantic
   statement is therefore the strongest of the three readings, and it is the one the paper's proof
   supports (a constant operand has zero linear and mixed parts, so it adds no product of linear
   forms). *Choice:* all positions are counted, not only those an output depends on; for a lower bound
   this changes nothing.

9. **The bound** `⌈n^(9/4)/2⌉` is `Nat.ceil ((n : ℝ) ^ ((9 : ℝ) / 4) / 2)`, with `Real.rpow`.
   *Pitfall avoided:* the exponent is the real `(9 : ℝ) / 4`; an exponent `9/4` elaborated in `ℕ`
   would be `2`. For a natural count `q`, `⌈x⌉₊ ≤ q ↔ x ≤ q`, so the ceiling form and the real form
   are the same statement; I kept the paper's ceiling.

10. **Quantifiers.** Every field `F : Type` (universe 0, as the brief says), every `n ≥ 2` (the paper's
    range; at `n = 1` the gate bound `⌈1/2⌉ = 1` also holds, but it is not asked). `AsymptoticRank` is
    over `F` itself; `BorderRankLower` over `AlgebraicClosure F`; the gate statements over `F`, with
    rational functions over `F`.

## Relations between the statements (for the prover, not part of them)

- `GatesPerN → GatesPerNAll` directly (nonscalar `⊆` mul-or-div, `Finset.card_le_card`).
- The paper's route: `R_{F̄}(T_n) ≥ n^(9/4)` (from `ω_{F̄} ≥ 9/4`) and Lemma `lem:bilinearize`
  (`R_{F̄}(T_n) ≤ 2q`) give `GatesPerN`; rank of powers over `F` and the closure argument give the
  other two. `BorderRankLower` implies `R_{F̄}(T_n) ≥ n^(9/4)`, since rank `≥` border rank.
- The paper's "exact bilinear algorithm at side `n` uses at least `⌈n^(9/4)⌉` products" is not
  stated separately; it is `AsymptoticRank` at `k = 1` (or `BorderRankLower`), and was not asked.

I did not see the claimant's Lean statements
