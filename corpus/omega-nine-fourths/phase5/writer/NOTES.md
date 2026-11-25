# Phase 5 statement writer: notes on Rect.lean

Written 2026-11-25, 13:32 to 13:39 UTC (read from `date -u`), by the statement writer of Phase 5, under the brief
`corpus/omega-nine-fourths/prompts/rect-writer.md` (sha256 `5ac776c7a0800f69c6e40a6137729297a81a56179cc02f02ec57eddd9cccb24b`
when I read it, the file sealed in A15). Lean was not run; the file is meant to be elaborated against Lean v4.34.1 /
Mathlib d13f23b7, and any repair is logged by the runner.

## What I read

- The brief.
- Our own Phase 4 statements, `phase4/writer/PerN.lean` and `phase4/writer/NOTES.md` (sealed in A14).
- The paper's LaTeX in `proof-readers/astra/inputs/build/`: `intro.tex` (Theorem `thm:square`, the definition of formal
  arithmetic circuits, `T_n`, the definitions of geometric border rank and asymptotic rank, Corollary `cor:tight`, the
  paragraph defining `T_{a,b,c}` and `α_F`, Corollary `cor:rectangular`), `consequences.tex` (the proofs of `cor:tight`
  and `cor:rectangular`), `obstruction.tex` (Lemma `lem:bilinearize`, Lemma `lem:specialize`). Nothing else in
  `corpus/omega-nine-fourths/`.
- Mathlib source at `~/Projects/mathlib-src-d13f23b7`, to check names and signatures: `Mathlib/RingTheory/Nullstellensatz.lean`
  (`zeroLocus` takes `(K)` explicit and an ideal over `k` with `[Algebra k K]`; `vanishingIdeal` takes `(k)` explicit; with
  `k = K` the PerN form `zeroLocus K (vanishingIdeal K S)` stands), `Mathlib/FieldTheory/IsAlgClosed/AlgebraicClosure.lean`
  (`instField`), `Mathlib/Analysis/Subadditive.lean` (`Subadditive`, `Subadditive.tendsto_lim`),
  `Mathlib/Algebra/Order/Floor/Defs.lean` (`Nat.floor` over a `FloorSemiring`), and a grep that no Mathlib declaration or
  namespace is called `Rect`.
- One `ls` of the paper's build folder and of `phase5/` was refused by the permission system before it ran; nothing was
  listed. No web search, no fetch. Nothing under github.com/openai/math/lean/ was opened.

## The four propositions

| name | what it says | form |
|---|---|---|
| `BorderRankRect` | every field `F : Type`, all `a, b, c ≥ 1`: `max{ab, bc, ca, (abc)^(3/4)} ≤ geometricBorderRank (T_{a,b,c} over AlgebraicClosure F)`, as reals | one inequality, the bound as `rectBound a b c` |
| `AsymptoticRankRect` | every field `F`, all `a, b, c ≥ 1`: the asymptotic rank of `T_{a,b,c}` over `F` is `≥ rectBound a b c` | BOTH: (a) `∃ L, Tendsto (k ↦ R_F(T^{⊗k})^{1/k}) atTop (𝓝 L) ∧ rectBound ≤ L`; (b) `rectBound ≤ inf_{k≥1} R_F(T^{⊗k})^{1/k}` |
| `AlphaBounds` | every field `F`: `1/2 ≤ α_F ∧ α_F ≤ 2/3`, `α_F` in the paper's circuit model with division gates | `alpha F` a real defined by `sSup`/`sInf` |
| `DualExponentDiv` | every field `F`: `α_F = 1/2`, same `α_F` | standalone; it does not mention `AlphaBounds` |

## Definitions: copied, generalised, new

**Copied from PerN with the same Lean body** (docstrings adapted only where they named `T_n` or the Phase 4
propositions): `Tensor3`, `HasRankLE`, `tensorRank`, `tpow`, `rankRoot`, `asymptoticRank`, `flat`, `rankLESet`,
`zariskiClosure`, `geometricBorderRank`, `Gate`, `Gate.args`, `Circuit`, `Circuit.WellFormed`, `Gate.Holds`,
`Circuit.Consistent`.

**Generalised from PerN** (from `n × n` by `n × n` to `a × b` by `b × c`; each reduces to the PerN one symbol for symbol at
`a = b = c = n`):
- `matMul K n` → `matMulRect K a b c` (index sets `Fin a × Fin b`, `Fin b × Fin c`, `Fin c × Fin a`, same coordinate formula);
- `MatVar n` → `MatVar a b c := (Fin a × Fin b) ⊕ (Fin b × Fin c)`;
- `RF F n` → `RF F a b c`; `ratVar`, `ratConst`, `ratX`, `ratY` likewise (in `ratConst` the constant is renamed `e`, since
  `c` is now a dimension).

**Not copied** (not needed here): `Gate.IsNonscalar`, `Gate.IsMulOrDiv`, `Circuit.nonscalarCount`, `Circuit.mulDivCount`,
`IsConstRF`, `matMul`, and the four PerN propositions.

**New**: `rectBound`, `Gate.IsOp`, `Circuit.opCount`, `Computes`, `innerDim`, `CostBigO`, `rectExponent`, `alpha`, and the
four propositions.

## Sources and choices, definition by definition

Textbook references are from memory (I had no copy of Bürgisser–Clausen–Shokrollahi, *Algebraic Complexity Theory*,
Springer 1997, "BCS", nor of Bläser, *Fast Matrix Multiplication*, Theory of Computing Graduate Surveys 5, 2013); chapter
numbers are what I remember, section and theorem numbers are not checked.

1. **Tensors, rank, tensor power, asymptotic rank, geometric border rank** (copied). Sources and choices as in Phase 4's
   NOTES items 1, 2, 4, 5, 6: BCS ch. 14 (tensors in coordinates, rank) and ch. 15 (border rank, asymptotic rank), Strassen
   1988 (asymptotic spectrum), Bläser 2013, all from memory; coordinate arrays rather than Mathlib's `TensorProduct`;
   `sInf` on `ℕ` with nonempty sets; Zariski closure as `zeroLocus (vanishingIdeal S)`.

2. **The rectangular tensor** `matMulRect K a b c = T_{a,b,c} = ∑_{i<a,j<b,k<c} e_{ij} ⊗ e_{jk} ⊗ e_{ki}`. Source: BCS ch.
   14/15 (the tensor `⟨e,h,l⟩` of `e × h` by `h × l` matrix multiplication), from memory; Bläser 2013, from memory; the
   paper's convention for `T_n` (intro.tex: "the third factor pairs the output at position `(i,k)` with `e_{ki}`"), which
   is also the convention under which the paper's `T_{a,b,c} ⊗ T_{b,c,a} ⊗ T_{c,a,b} ≃ T_{abc}` reads correctly.
   *Choice:* the paper says only "the multiplication tensor of an `a×b` matrix and a `b×c` matrix"; I extended the
   square convention. *Alternative:* third factor `e_{ik}` (index set `Fin a × Fin c`); it differs by a bijection of the
   third index set, so rank, border rank and asymptotic rank are the same.

3. **The bound** `rectBound a b c = max (max (max (a·b) (b·c)) (c·a)) ((a·b·c)^(3/4))` in `ℝ`, the power `Real.rpow` with the
   real exponent `(3 : ℝ) / 4` (in `ℕ`, `3/4` would be `0`). *Alternative:* four separate inequalities; equivalent by
   `max_le_iff`. The corollary's "at least" is compared as reals, as the brief says.

4. **Quantifiers.** Every field `F : Type` (universe 0); `a, b, c ≥ 1` as hypotheses (the paper's "positive integers"; at a
   zero dimension the tensor is zero and the bound is `0`, so nothing is lost). Border rank over `AlgebraicClosure F` (the
   paper's definition of geometric border rank: "Zariski closure, over `F̄`"; the corollary does not repeat "over `F̄`" for
   `T_{a,b,c}`, and I read it with the definition). Asymptotic rank over `F` itself ("its asymptotic rank over `F`").

5. **Asymptotic rank: limit and infimum, both.** (a) is the paper's definition, a limit; since a lower bound on a limit
   needs the limit to exist, (a) is written `∃ L, Tendsto … (𝓝 L) ∧ rectBound ≤ L` (not `limUnder`, whose junk value would
   make the statement mean something else if the sequence did not converge). (b) is the textbook infimum over `k ≥ 1`.
   **Why they agree:** rank is submultiplicative, `R(s ⊗ t) ≤ R(s)·R(t)` (multiply decompositions term by term, and
   `T^{⊗(k+l)}` is `T^{⊗k} ⊗ T^{⊗l}` up to the index bijection `Fin (k+l) → ι ≃ (Fin k → ι) × (Fin l → ι)`); every power of
   `T_{a,b,c} ≠ 0` has rank `≥ 1`, so `u_k = log R(T^{⊗k}) ≥ 0` is subadditive; Fekete's lemma (Mathlib:
   `Subadditive.tendsto_lim`) gives `u_k / k → inf_k u_k / k`, and `exp` is continuous and increasing. So the limit
   exists and equals the infimum, and each of (a), (b) implies the other once Fekete is proved. Stating both closes the
   question of which reading a prover targets. *Pitfall avoided* (as in Phase 4): the infimum starts at `k = 1`; at
   `k = 0` Lean's term is `1^0 = 1`.

6. **Formal arithmetic circuits** (copied: `Gate`, `Circuit`, `WellFormed`, `Gate.Holds`, `Consistent`). Source: BCS ch. 4
   (straight-line programs, computations in `k(X)`), from memory; the paper's definition (intro.tex lines 17–23). Choices as
   in Phase 4's NOTES item 7: values in `F(X,Y) = FractionRing (MvPolynomial V F)` so that outputs are identities of
   rational functions also over finite fields; constants from `F` only (not `F̄`); a division holds only with a nonzero
   divisor; acyclicity as positions reading only earlier positions; evaluation by a consistency hypothesis rather than a
   recursive evaluator.

7. **`Computes F a b c C`** (new): `WellFormed C ∧ ∃ val out, Consistent C … val ∧ ∀ i k, val (out i k) = ∑_j X i j * Y j k`.
   *Choice:* `∃ val` inside, because this predicate is used for upper bounds (existence of a circuit) as well as for
   lower bounds; for a well-formed circuit the consistent `val` is unique on positions `< size` and exists exactly when no
   division is by zero, so `∃ val` is "the evaluation exists and is right". Under a `∀ C` (the lower-bound direction) the
   existential in the hypothesis is the same as Phase 4's `∀ val`.

8. **Cost of a circuit** `Circuit.opCount` (new): the number of positions holding `+`, `−`, `×` or `÷`; reading an input or
   a constant is free; every position counts (also dead ones); a multiplication by a constant counts. Source: the paper's
   "`O_{F,s}(n^s)` scalar operations" (intro.tex, the definition of `ω_F`); BCS ch. 4 (the total-complexity measure, every
   arithmetic operation of cost one), from memory. *Alternatives:* (i) `C.size`, all instructions including inputs and
   constants; (ii) only the operations an output depends on. Both give the same `CostBigO` and the same exponent: dead
   positions can be deleted from a witness circuit, and in a circuit without dead positions every input or constant
   position is read by some operation (outputs are operations, being degree-2 rational functions), so `size ≤ 3·opCount`.
   (iii) the Ostrowski count (nonscalar `×`/`÷` only, BCS ch. 4/14): cheaper, so its exponent is at most ours; for matrix
   products the literature identifies the exponents defined by total cost and by rank (BCS ch. 15 for the square case;
   for rectangular shapes I recall it from Lotti–Romani 1983 and Coppersmith 1982, from memory, unchecked). I chose the
   total count because the paper's words are "scalar operations".

9. **`O(n^s)`** (`CostBigO F β s`, new): `∃ (K : ℝ) (N : ℕ), ∀ n ≥ N, ∃ C, Computes F n ⌊n^β⌋ n C ∧ opCount C ≤ K·n^s`. A
   non-uniform family (one circuit per `n`), the constant depending on `F`, `β`, `s`, as in the paper's `O_{F,s}`.
   *Alternative:* Mathlib's `Asymptotics.IsBigO atTop` applied to a minimum-cost function `n ↦ sInf {opCount C | …}`;
   equivalent, but it would add a second `sInf` with a junk value; the explicit existential has none.

10. **The floor** (`innerDim β n = Nat.floor ((n : ℝ) ^ β)`, new): exactly the paper's `⌊n^β⌋`, with `Real.rpow` then
    `Nat.floor`. For `n ≥ 1` and `β ≥ 0` it is `≥ 1`; at `n = 0` Lean's `0^0 = 1` and `0^β = 0` (`β > 0`) do not matter
    because only `n ≥ N` is constrained and the prover chooses `N`. *Alternatives:* `⌈n^β⌉`, rounding, or any `m ≍ n^β`.
    I kept the floor exactly: passing between these needs monotonicity of the cost in the inner dimension, and with
    division gates that is not free (substituting `0` for the extra variables can make a divisor vanish).

11. **The exponent** (`rectExponent F β = sInf {s | CostBigO F β s}`, new) and **"has exponent two"** (`rectExponent F β = 2`).
    *Empty set and junk:* `Real.sInf` of an empty or not-bounded-below set is `0`. For `β ≥ 0` neither happens: the
    schoolbook circuit has `(2m − 1)n² ≤ 2n^(2+β)` operations, so `2 + β` is in the set; and every circuit has at least `n²`
    operations (the `n²` outputs are distinct nonconstant rational functions, so distinct operation positions), so every
    element is `≥ 2`. If junk did occur, `0 ≠ 2` would only drop `β` from the set defining `α_F`. (For `β < 0`, `⌊n^β⌋ = 0`
    for large `n` and the set is all of `ℝ`, so `rectExponent = 0`; such `β` are excluded anyway by `0 ≤ β`.)
    *Alternative:* "has exponent two" as `∀ s > 2, CostBigO F β s` (exponent `≤ 2`); equivalent here by the `n²` lower bound,
    and easier for a prover of `1/2 ≤ α_F`. I kept the paper's "exponent two", i.e. equality, as the brief asks.

12. **`α_F`** (`alpha F = sSup {β | 0 ≤ β ∧ rectExponent F β = 2}`, new). *Empty set and junk:* `Real.sSup` of an empty or
    not-bounded-above set is `0`. Neither happens: `β = 0` is in the set (`⌊n^0⌋ = 1`: the outer product, exactly `n²`
    multiplications), and the set is bounded above by `1` (for `β > 1` each of the `2n⌊n^β⌋` input variables must be read by
    some operation, an operation reads at most two positions, so the cost is `≥ n⌊n^β⌋` and the exponent is `≥ 1 + β > 2`).
    Even if junk occurred, `AlphaBounds` would be false (`1/2 ≤ 0` fails) and `DualExponentDiv` false (`0 ≠ 1/2`), never
    vacuously true. The upper half `α_F ≤ 2/3` alone is also meaningful: since the set is provably nonempty and bounded
    above, `sSup ≤ 2/3` is equivalent to "every admissible `β` is `≤ 2/3`" (`Real.sSup_le` needs exactly that).

13. **`DualExponentDiv`**: `∀ F, alpha F = 1/2`, standalone, with the same `alpha` (division gates allowed). The brief says
    the release states `α = 1/2` for division-free programs and the paper does not claim it. I did not state the
    division-free version. Between the two models lies Strassen's elimination of divisions (BCS ch. 7, from memory), which
    for these degree-2 outputs costs a constant factor over infinite fields; over a finite field it needs a passage to an
    extension field, so the two `α`'s are not equal by definition, and a prover must argue it.

## Choices a reader could dispute (summary)

1. `T_{a,b,c}` with the cyclic third factor `e_{ki}` (index set `Fin c × Fin a`), extended from the paper's square convention.
2. `a, b, c ≥ 1` as hypotheses; fields in `Type` only.
3. Border rank over `AlgebraicClosure F` (from the definition paragraph, not repeated in the corollary); asymptotic rank over `F`.
4. Asymptotic rank stated in both forms, the limit as `∃ L` with `Tendsto`.
5. Cost = number of `+ − × ÷` positions, all counted, inputs and constants free (not the Ostrowski count, not `C.size`).
6. `O(n^s)` as `∃ K N, ∀ n ≥ N, ∃ circuit`, non-uniform.
7. The floor `⌊n^β⌋` kept exactly (`Nat.floor` of `Real.rpow`).
8. "Exponent two" as `sInf = 2`, not `≤ 2`.
9. `α_F` as `Real.sSup` over `β ≥ 0`, with the junk-value analysis above.
10. `DualExponentDiv` in the division model only; the release's division-free statement is not written here.
11. Constants of the circuit from `F` only, not from `F̄`.

## Relations between the statements (for the prover, not part of them)

- `BorderRankRect`: flattening ranks `ab, bc, ca` are lower bounds for border rank (rank of a matrix is lower
  semicontinuous: minors are polynomials), BCS ch. 14/15, from memory; and `T_{a,b,c} ⊗ T_{b,c,a} ⊗ T_{c,a,b} ≃ T_{abc}`
  with cyclic invariance and submultiplicativity of border rank gives `(border rank)^3 ≥ (abc)^(9/4)` from Phase 4's
  `BorderRankLower` at `n = abc` (and `abc = 1` directly).
- `AsymptoticRankRect`: the same argument with asymptotic rank and Phase 4's `AsymptoticRank`; flattening ranks are
  multiplicative under tensor powers.
- `AlphaBounds`, upper half: the paper's route is `BorderRankRect` at `(n, ⌊n^β⌋, n)`, rank `≥` border rank, and Lemma
  `lem:bilinearize` for rectangular products (`R_{F̄}(T_{n,m,n}) ≤ 2 × nonscalar gates ≤ 2 × opCount`), so the exponent is
  `≥ 3(2+β)/4`, which exceeds `2` when `β > 2/3`. Lower half: an algorithm for inner dimension `⌊√n⌋` with `O(n^(2+ε))`
  operations (the paper cites Uznański and Amanov–van den Berg–Zuiddam), written as formal circuits.
- `DualExponentDiv` implies `AlphaBounds` (`1/2 ≤ 1/2 ≤ 2/3`); the converse does not follow, so `AlphaBounds` proved and
  `DualExponentDiv` NOT PROVED is a coherent outcome.

I did not see the claimant's Lean statements
