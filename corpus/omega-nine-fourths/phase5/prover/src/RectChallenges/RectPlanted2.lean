import Mathlib

/-!
# Phase 5: Corollary 1.3 (rectangular products) and the dual exponent, as statements only

Written 2026-11-25 (UTC) from the paper's words (intro.tex: the definition of formal arithmetic
circuits after Theorem `thm:square`, the paragraph defining `T_{a,b,c}` and `α_F`, and Corollary
`cor:rectangular`; consequences.tex: the proof of `cor:rectangular`; obstruction.tex: Lemma
`lem:bilinearize`) and from the textbooks, with Mathlib only. Nothing is proved here, and this file
was written without running Lean.

Four propositions, each a `def … : Prop` in namespace `Rect`:

* `BorderRankRect`: for every field `F` and all `a, b, c ≥ 1`, the geometric border rank of
  `T_{a,b,c}` over the algebraic closure of `F` is at least `max{ab, bc, ca, (abc)^(3/4)}`;
* `AsymptoticRankRect`: for every field `F` and all `a, b, c ≥ 1`, the asymptotic rank of
  `T_{a,b,c}` over `F` is at least the same bound, stated both for the limit of the `k`-th roots of
  the ranks of the tensor powers (the paper's definition) and for their infimum over `k ≥ 1`;
* `AlphaBounds`: for every field `F`, `1/2 ≤ α_F ≤ 2/3`, where `α_F` is the supremum of the
  `β ≥ 0` for which multiplying an `n × ⌊n^β⌋` matrix by a `⌊n^β⌋ × n` matrix has exponent two in
  `n`, cost counted in the paper's formal arithmetic circuits WITH division gates;
* `DualExponentDiv`: for every field `F`, `α_F = 1/2` in the same model (not claimed by the paper;
  stated on its own so that it can be proved or reported not proved by itself).

The definitions shared with Phase 4 are copied from our own `phase4/writer/PerN.lean` (sealed in
amendment A14), either unchanged or generalised from `n × n` by `n × n` to `a × b` by `b × c`;
nothing is imported from that file. Everywhere real exponents are `Real.rpow`.
-/

noncomputable section

namespace Rect

/-! ## Three-tensors in coordinates (copied from PerN) -/

/-- A three-tensor over `K` with (finite) index sets `ι₁, ι₂, ι₃`, given by its coordinates:
`T` stands for `∑ T a b c • e_a ⊗ e_b ⊗ e_c` in `K^ι₁ ⊗ K^ι₂ ⊗ K^ι₃`. -/
abbrev Tensor3 (K ι₁ ι₂ ι₃ : Type) : Type := ι₁ → ι₂ → ι₃ → K

/-- `T` has rank at most `r` over `K`: it is a sum of `r` simple tensors `u ⊗ v ⊗ w` whose
three vectors have coordinates in `K`. -/
def HasRankLE {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) (r : ℕ) : Prop :=
  ∃ (u : Fin r → ι₁ → K) (v : Fin r → ι₂ → K) (w : Fin r → ι₃ → K),
    ∀ (a : ι₁) (b : ι₂) (c : ι₃), T a b c = ∑ l : Fin r, u l a * v l b * w l c

/-- The tensor rank of `T` over `K`: the least `r` with `HasRankLE T r`. For finite index sets
the set is nonempty (the coordinate expansion is a decomposition), so this is a minimum. -/
def tensorRank {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) : ℕ :=
  sInf {r : ℕ | HasRankLE T r}

/-- The rectangular matrix multiplication tensor `T_{a,b,c} = ∑_{i<a, j<b, k<c} e_{ij} ⊗ e_{jk} ⊗
e_{ki}`, for the product of an `a × b` matrix by a `b × c` matrix, in the paper's convention for
`T_n` (the third factor pairs the output at position `(i,k)` with `e_{ki}`). The three index sets
are `Fin a × Fin b`, `Fin b × Fin c`, `Fin c × Fin a`; the coordinate at `((i,j), (j',k), (k',i'))`
is `1` when `j = j'`, `k = k'` and `i = i'`, and `0` otherwise. At `a = b = c = n` this is, symbol
for symbol, Phase 4's `matMul K n`. -/
def matMulRect (K : Type) [CommSemiring K] (a b c : ℕ) :
    Tensor3 K (Fin a × Fin b) (Fin b × Fin c) (Fin c × Fin a) :=
  fun (x : Fin a × Fin b) (y : Fin b × Fin c) (z : Fin c × Fin a) =>
    if x.2 = y.1 ∧ y.2 = z.1 ∧ z.2 = x.1 then 1 else 0

/-- The `k`-th tensor power `T^{⊗k}`, with corresponding factors grouped: its three index sets
are the `k`-tuples of indices, and its coordinate at `(a, b, c)` is `∏_m T (a m) (b m) (c m)`.
For `T = T_{a,b,c}` this is `T_{a^k, b^k, c^k}` up to a renaming of the indices. -/
def tpow {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) (k : ℕ) :
    Tensor3 K (Fin k → ι₁) (Fin k → ι₂) (Fin k → ι₃) :=
  fun (a : Fin k → ι₁) (b : Fin k → ι₂) (c : Fin k → ι₃) => ∏ m : Fin k, T (a m) (b m) (c m)

/-- The `k`-th root of the rank over `K` of the `k`-th tensor power, `R(T^{⊗k})^{1/k}`, as a
real number. (At `k = 0` Lean gives `x ^ 0 = 1`; that value is never used: the limit ignores it
and the infimum below starts at `k = 1`.) -/
def rankRoot {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) (k : ℕ) : ℝ :=
  (tensorRank (tpow T k) : ℝ) ^ ((k : ℝ)⁻¹)

/-- The asymptotic rank of `T` over `K` as the infimum over `k ≥ 1` of `R(T^{⊗k})^{1/k}`.
Rank is submultiplicative under the tensor product, so by Fekete's lemma this infimum is also
the limit of the same sequence; `AsymptoticRankRect` below states both. -/
def asymptoticRank {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) : ℝ :=
  ⨅ k : ℕ, rankRoot T (k + 1)

/-! ## Geometric border rank (copied from PerN) -/

/-- A three-tensor as a point of the affine space `K^(ι₁ × ι₂ × ι₃)` of all such tensors. -/
def flat {K ι₁ ι₂ ι₃ : Type} (T : Tensor3 K ι₁ ι₂ ι₃) : ι₁ × ι₂ × ι₃ → K :=
  fun x => T x.1 x.2.1 x.2.2

/-- The set of tensors of rank at most `r` over `K`, as points of the affine tensor space. -/
def rankLESet (K : Type) [Field K] (ι₁ ι₂ ι₃ : Type) (r : ℕ) : Set (ι₁ × ι₂ × ι₃ → K) :=
  {p | ∃ T : Tensor3 K ι₁ ι₂ ι₃, HasRankLE T r ∧ p = flat T}

/-- The Zariski closure of a set `S` of points of the affine space `K^σ`: the common zeros of
all polynomials over `K` that vanish on `S`, written with Mathlib's Nullstellensatz definitions
`MvPolynomial.vanishingIdeal` and `MvPolynomial.zeroLocus`. -/
def zariskiClosure {K σ : Type} [Field K] (S : Set (σ → K)) : Set (σ → K) :=
  MvPolynomial.zeroLocus K (MvPolynomial.vanishingIdeal K S)

/-- The geometric border rank of `T` over `K`: the least `r` such that `T` lies in the Zariski
closure of the tensors of rank at most `r`. (Every `r ≥ tensorRank T` qualifies, so for finite
index sets the set is nonempty and this is a minimum.) -/
def geometricBorderRank {K ι₁ ι₂ ι₃ : Type} [Field K] (T : Tensor3 K ι₁ ι₂ ι₃) : ℕ :=
  sInf {r : ℕ | flat T ∈ zariskiClosure (rankLESet K ι₁ ι₂ ι₃ r)}

/-! ## The bound of Corollary 1.3 -/

/-- The bound `max{ab, bc, ca, (abc)^(3/4)}` of Corollary `cor:rectangular`, as a real number:
the three products and `abc` are taken in `ℝ`, and the power `3/4` is `Real.rpow` with the real
exponent `(3 : ℝ) / 4`. -/
def rectBound (a b c : ℕ) : ℝ :=
  max (max (max ((a : ℝ) * b) ((b : ℝ) * c)) ((c : ℝ) * a)) (((a : ℝ) * b * c) ^ ((3 : ℝ) / 3))

/-! ## Formal arithmetic circuits (copied from PerN) -/

/-- One instruction of a formal arithmetic circuit (a straight-line program): read an input
variable, read a constant of `F`, or apply `+`, `−`, `×`, `÷` to the values of two earlier
instructions, referred to by their positions. -/
inductive Gate (V F : Type) : Type where
  | input (v : V)
  | const (c : F)
  | add (a b : ℕ)
  | sub (a b : ℕ)
  | mul (a b : ℕ)
  | div (a b : ℕ)

/-- The positions an instruction reads. -/
def Gate.args {V F : Type} : Gate V F → List ℕ
  | Gate.input _ => []
  | Gate.const _ => []
  | Gate.add a b => [a, b]
  | Gate.sub a b => [a, b]
  | Gate.mul a b => [a, b]
  | Gate.div a b => [a, b]

/-- A formal arithmetic circuit: `size` instructions at positions `0, …, size - 1`. -/
structure Circuit (V F : Type) where
  size : ℕ
  gate : Fin size → Gate V F

/-- The circuit is acyclic in the strict sense of a straight-line program: the instruction at
position `m` reads only positions `< m`. -/
def Circuit.WellFormed {V F : Type} (C : Circuit V F) : Prop :=
  ∀ m : Fin C.size, ∀ a ∈ Gate.args (C.gate m), a < m.val

/-- The instruction at position `m` holds of the assignment `val` of values in the field `K`,
where the input variables take the values `x` and the constants are embedded by `c`. A division
holds only when its divisor is nonzero in `K`. -/
def Gate.Holds {V F K : Type} [Field K] (x : V → K) (c : F → K) (val : ℕ → K) (m : ℕ) :
    Gate V F → Prop
  | Gate.input v => val m = x v
  | Gate.const a => val m = c a
  | Gate.add a b => val m = val a + val b
  | Gate.sub a b => val m = val a - val b
  | Gate.mul a b => val m = val a * val b
  | Gate.div a b => val b ≠ 0 ∧ val m = val a / val b

/-- `val` is the evaluation of the circuit: every instruction holds. For a well-formed circuit
this determines `val` at every position `< size` (by induction on the position), and it exists
exactly when no division is by zero; so "for every consistent `val`" quantifies over the one
evaluation of every admissible circuit. -/
def Circuit.Consistent {V F K : Type} [Field K] (C : Circuit V F) (x : V → K) (c : F → K)
    (val : ℕ → K) : Prop :=
  ∀ m : Fin C.size, Gate.Holds x c val m.val (C.gate m)

/-! ## The cost of a circuit -/

/-- A scalar operation: an addition, subtraction, multiplication or division gate. Reading an
input variable or a constant is not an operation. -/
def Gate.IsOp {V F : Type} : Gate V F → Prop
  | Gate.input _ => False
  | Gate.const _ => False
  | Gate.add _ _ => True
  | Gate.sub _ _ => True
  | Gate.mul _ _ => True
  | Gate.div _ _ => True

open scoped Classical in
/-- The cost of a circuit: its number of scalar operations (`+`, `−`, `×`, `÷`), every position
counted (not only those an output depends on), every operation counting one whatever its
arguments (a multiplication by a constant counts, as do additions). -/
def Circuit.opCount {V F : Type} (C : Circuit V F) : ℕ :=
  (Finset.univ.filter (fun m : Fin C.size => Gate.IsOp (C.gate m))).card

/-! ## Rectangular products as rational functions (generalised from PerN) -/

/-- The `ab + bc` input variables of an `a × b` by `b × c` product: `Sum.inl (i, j)` is the entry
`X i j` of the first matrix and `Sum.inr (j, k)` the entry `Y j k` of the second. -/
abbrev MatVar (a b c : ℕ) : Type := (Fin a × Fin b) ⊕ (Fin b × Fin c)

/-- The field `F(X, Y)` of formal rational functions over `F` in the independent entries.
Identities here are identities of rational functions, also when `F` is finite. -/
abbrev RF (F : Type) [Field F] (a b c : ℕ) : Type := FractionRing (MvPolynomial (MatVar a b c) F)

/-- An input variable as a rational function. -/
def ratVar (F : Type) [Field F] (a b c : ℕ) (v : MatVar a b c) : RF F a b c :=
  algebraMap (MvPolynomial (MatVar a b c) F) (RF F a b c) (MvPolynomial.X v)

/-- A constant of `F` as a (constant) rational function. -/
def ratConst (F : Type) [Field F] (a b c : ℕ) (e : F) : RF F a b c :=
  algebraMap (MvPolynomial (MatVar a b c) F) (RF F a b c) (MvPolynomial.C e)

/-- The entry `X i j` of the first (`a × b`) matrix. -/
def ratX (F : Type) [Field F] (a b c : ℕ) (i : Fin a) (j : Fin b) : RF F a b c :=
  ratVar F a b c (Sum.inl (i, j))

/-- The entry `Y j k` of the second (`b × c`) matrix. -/
def ratY (F : Type) [Field F] (a b c : ℕ) (j : Fin b) (k : Fin c) : RF F a b c :=
  ratVar F a b c (Sum.inr (j, k))

/-- The circuit `C` over `F` computes the product of an `a × b` matrix by a `b × c` matrix in the
paper's model: it is acyclic; its evaluation in `F(X, Y)` exists (inputs are the independent
variables, constants lie in `F`, no division is by the zero rational function); and for every
`i < a`, `k < c` some position holds `∑_j X i j * Y j k` as an identity of rational functions.
(For a well-formed circuit the consistent `val` is unique on positions `< size`, so "some
consistent `val`" is "the evaluation".) -/
def Computes (F : Type) [Field F] (a b c : ℕ) (C : Circuit (MatVar a b c) F) : Prop :=
  Circuit.WellFormed C ∧
    ∃ (val : ℕ → RF F a b c) (out : Fin a → Fin c → Fin C.size),
      Circuit.Consistent C (ratVar F a b c) (ratConst F a b c) val ∧
        ∀ (i : Fin a) (k : Fin c),
          val (out i k).val = ∑ j : Fin b, ratX F a b c i j * ratY F a b c j k

/-! ## The exponent of the `n × ⌊n^β⌋ × n` product and the dual exponent `α_F` -/

/-- The inner dimension `⌊n^β⌋`: the real power `(n : ℝ) ^ β` (`Real.rpow`), rounded down to a
natural number by `Nat.floor`. For `n ≥ 1` and `β ≥ 0` it is at least `1`. -/
def innerDim (β : ℝ) (n : ℕ) : ℕ := Nat.floor ((n : ℝ) ^ β)

/-- Multiplying an `n × ⌊n^β⌋` matrix by a `⌊n^β⌋ × n` matrix over `F` costs `O(n^s)`: there are
a real constant `K` and a threshold `N` such that for every `n ≥ N` some formal arithmetic circuit
over `F` (with division gates) computes that product with at most `K · n^s` scalar operations.
The circuit may depend on `n` (a non-uniform family, as in the definition of `ω_F`). -/
def CostBigO (F : Type) [Field F] (β s : ℝ) : Prop :=
  ∃ (K : ℝ) (N : ℕ), ∀ n : ℕ, N ≤ n →
    ∃ C : Circuit (MatVar n (innerDim β n) n) F,
      Computes F n (innerDim β n) n C ∧ (Circuit.opCount C : ℝ) ≤ K * (n : ℝ) ^ s

/-- The exponent in `n` of the `n × ⌊n^β⌋` by `⌊n^β⌋ × n` product over `F`: the infimum of the
real `s` with cost `O(n^s)`. (For `β ≥ 0` the set is nonempty, since the schoolbook circuit has at
most `2 n^(2+β)` operations, and bounded below by `2`, since the `n²` outputs are distinct
operation gates; so `Real.sInf`'s junk value `0` is not reached. If it were, `0 ≠ 2` would only
exclude `β` from the set defining `alpha`.) -/
def rectExponent (F : Type) [Field F] (β : ℝ) : ℝ :=
  sInf {s : ℝ | CostBigO F β s}

/-- The dual exponent `α_F`: the supremum of the `β ≥ 0` for which the `n × ⌊n^β⌋` by
`⌊n^β⌋ × n` product over `F` has exponent two in `n`. (The set contains `β = 0`, and it is
bounded above, by `1` from counting the input variables an operation must read; so `Real.sSup`'s
junk value `0` is not reached. If it were, `AlphaBounds` and `DualExponentDiv` would be false,
not vacuous.) -/
def alpha (F : Type) [Field F] : ℝ :=
  sSup {β : ℝ | 0 ≤ β ∧ rectExponent F β = 2}

/-! ## The four propositions -/

/-- **Geometric border rank of `T_{a,b,c}`.** For every field `F` and all positive integers
`a, b, c`, the geometric border rank of `T_{a,b,c}` over the algebraic closure `F̄` is at least
`max{ab, bc, ca, (abc)^(3/4)}`: whenever `T_{a,b,c}` lies in the Zariski closure, in the affine
space of tensors over `F̄`, of the set of tensors of rank at most `r` over `F̄`, then `r` is at
least each of `ab`, `bc`, `ca` and `(abc)^(3/4)` (compared as real numbers). -/
def BorderRankRect : Prop :=
  ∀ (F : Type) [Field F] (a b c : ℕ), 1 ≤ a → 1 ≤ b → 1 ≤ c →
    rectBound a b c ≤ (geometricBorderRank (matMulRect (AlgebraicClosure F) a b c) : ℝ)

/-- **Asymptotic rank of `T_{a,b,c}`.** For every field `F` and all positive integers `a, b, c`,
the asymptotic rank of `T_{a,b,c}` over `F` is at least `max{ab, bc, ca, (abc)^(3/4)}`, in both
forms: (a) the paper's definition, a limit: the `k`-th roots `R_F(T_{a,b,c}^{⊗k})^{1/k}` of the
ranks over `F` of the tensor powers converge, as `k → ∞`, to a real number `L` that is at least the
bound; and (b) the textbook's equivalent form, by Fekete's lemma: their infimum over `k ≥ 1` is at
least the bound. -/
def AsymptoticRankRect : Prop :=
  ∀ (F : Type) [Field F] (a b c : ℕ), 1 ≤ a → 1 ≤ b → 1 ≤ c →
    (∃ L : ℝ,
        Filter.Tendsto (fun k : ℕ => rankRoot (matMulRect F a b c) k) Filter.atTop (nhds L) ∧
          rectBound a b c ≤ L) ∧
      rectBound a b c ≤ asymptoticRank (matMulRect F a b c)

/-- **Bounds on the dual exponent, with division gates.** For every field `F`,
`1/2 ≤ α_F ≤ 2/3`, where `α_F` is the supremum of the `β ≥ 0` such that the exponent in `n` of
multiplying an `n × ⌊n^β⌋` matrix by a `⌊n^β⌋ × n` matrix is two; the exponent is the infimum of
the `s` such that, for all large `n`, some formal arithmetic circuit over `F` computes the product
with at most `K · n^s` scalar operations; the circuits take the entries as independent variables,
constants in `F`, and gates `+`, `−`, `×` and division by a nonzero rational function, and each
output equals its entry of the product as an identity of rational functions. -/
def AlphaBounds : Prop :=
  ∀ (F : Type) [Field F], (1 : ℝ) / 2 ≤ alpha F ∧ alpha F ≤ (2 : ℝ) / 3

/-- **The dual exponent is one half, with division gates.** For every field `F`, `α_F = 1/2`, with
`α_F` exactly as in `AlphaBounds` (the paper's circuit model, division gates allowed). The paper
does not claim this; it is stated by itself so that it can be proved, or reported not proved,
independently of `AlphaBounds`. -/
def DualExponentDiv : Prop :=
  ∀ (F : Type) [Field F], alpha F = (1 : ℝ) / 2

end Rect

end

/-! ## Phase 5 challenge statements (appended by the Phase 5 prover, cert-machine, 2026-11-25;
the file above is the statement writer's sealed Rect.lean, byte for byte, sha256 95340267…) -/

namespace Rect

theorem borderRankRect_holds : BorderRankRect := by sorry

theorem asymptoticRankRect_holds : AsymptoticRankRect := by sorry

theorem alphaBounds_holds : AlphaBounds := by sorry

theorem dualExponentDiv_holds : DualExponentDiv := by sorry

end Rect
