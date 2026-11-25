import Mathlib

/-!
# Phase 4: the per-n corollaries of ω = 9/4, as statements only

Written 2026-11-25 (UTC) from the paper's words (intro.tex, Corollary `cor:tight` and the
paragraphs before it; obstruction.tex, Lemma `lem:bilinearize`; consequences.tex, the proof of
`cor:tight`) and from the textbooks, with Mathlib only. Nothing is proved here, and this file
was written without running Lean.

Four propositions, each a `def … : Prop` in namespace `PerN`:

* `GatesPerN`: every formal arithmetic circuit over `F` for the `n × n` matrix product has at
  least `⌈n^(9/4) / 2⌉` nonscalar multiplication or division gates;
* `GatesPerNAll`: the same bound for the number of all multiplication and division gates
  (a weaker statement, implied by `GatesPerN`);
* `AsymptoticRank`: the asymptotic rank of `T_n` over `F` equals `n^(9/4)`, stated both as the
  limit of the k-th roots of the ranks of the tensor powers and as their infimum;
* `BorderRankLower`: the geometric border rank of `T_n` over the algebraic closure of `F` is at
  least `n^(9/4)`, with the Zariski closure written as Mathlib's
  `MvPolynomial.zeroLocus (MvPolynomial.vanishingIdeal S)`.

Everywhere the exponent is the real number `(9 : ℝ) / 4` and powers are `Real.rpow`.
-/

noncomputable section

namespace PerN

/-! ## Three-tensors in coordinates -/

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

/-- The matrix multiplication tensor `T_n = ∑_{i,j,k} e_{ij} ⊗ e_{jk} ⊗ e_{ki}` (the paper's
convention: the third factor pairs the output at position `(i,k)` with `e_{ki}`). Its coordinate
at `((i,j), (j',k), (k',i'))` is `1` when `j = j'`, `k = k'` and `i = i'`, and `0` otherwise. -/
def matMul (K : Type) [CommSemiring K] (n : ℕ) :
    Tensor3 K (Fin n × Fin n) (Fin n × Fin n) (Fin n × Fin n) :=
  fun (a b c : Fin n × Fin n) => if a.2 = b.1 ∧ b.2 = c.1 ∧ c.2 = a.1 then 1 else 0

/-- The `k`-th tensor power `T^{⊗k}`, with corresponding factors grouped: its three index sets
are the `k`-tuples of indices, and its coordinate at `(a, b, c)` is `∏_m T (a m) (b m) (c m)`.
For `T = T_n` this is `T_{n^k}` up to a renaming of the indices. -/
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
the limit of the same sequence; `AsymptoticRank` below states both. -/
def asymptoticRank {K ι₁ ι₂ ι₃ : Type} [CommSemiring K] (T : Tensor3 K ι₁ ι₂ ι₃) : ℝ :=
  ⨅ k : ℕ, rankRoot T (k + 1)

/-! ## Geometric border rank -/

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

/-! ## Formal arithmetic circuits -/

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

/-- A nonscalar gate (paper, Lemma `lem:bilinearize`): a multiplication both of whose arguments
are nonconstant, or a division whose divisor is nonconstant. "Constant" is read on the value:
an element of `F` inside the field of rational functions (`isConst`). -/
def Gate.IsNonscalar {V F K : Type} (isConst : K → Prop) (val : ℕ → K) : Gate V F → Prop
  | Gate.mul a b => ¬ isConst (val a) ∧ ¬ isConst (val b)
  | Gate.div _ b => ¬ isConst (val b)
  | _ => False

/-- A multiplication or a division gate, whatever its arguments. -/
def Gate.IsMulOrDiv {V F : Type} : Gate V F → Prop
  | Gate.mul _ _ => True
  | Gate.div _ _ => True
  | _ => False

open scoped Classical in
/-- The number of nonscalar multiplication and division gates of the circuit, all positions
counted (not only those an output depends on). -/
def Circuit.nonscalarCount {V F : Type} (C : Circuit V F) {K : Type} (isConst : K → Prop)
    (val : ℕ → K) : ℕ :=
  (Finset.univ.filter (fun m : Fin C.size => Gate.IsNonscalar isConst val (C.gate m))).card

open scoped Classical in
/-- The number of all multiplication and division gates of the circuit. -/
def Circuit.mulDivCount {V F : Type} (C : Circuit V F) : ℕ :=
  (Finset.univ.filter (fun m : Fin C.size => Gate.IsMulOrDiv (C.gate m))).card

/-- The `2n²` input variables: `Sum.inl (i, j)` is the entry `X i j` of the first matrix and
`Sum.inr (j, k)` the entry `Y j k` of the second. -/
abbrev MatVar (n : ℕ) : Type := (Fin n × Fin n) ⊕ (Fin n × Fin n)

/-- The field `F(X, Y)` of formal rational functions over `F` in the `2n²` independent entries.
Identities here are identities of rational functions, also when `F` is finite. -/
abbrev RF (F : Type) [Field F] (n : ℕ) : Type := FractionRing (MvPolynomial (MatVar n) F)

/-- An input variable as a rational function. -/
def ratVar (F : Type) [Field F] (n : ℕ) (v : MatVar n) : RF F n :=
  algebraMap (MvPolynomial (MatVar n) F) (RF F n) (MvPolynomial.X v)

/-- A constant of `F` as a (constant) rational function. -/
def ratConst (F : Type) [Field F] (n : ℕ) (c : F) : RF F n :=
  algebraMap (MvPolynomial (MatVar n) F) (RF F n) (MvPolynomial.C c)

/-- The entry `X i j` of the first matrix. -/
def ratX (F : Type) [Field F] (n : ℕ) (i j : Fin n) : RF F n := ratVar F n (Sum.inl (i, j))

/-- The entry `Y j k` of the second matrix. -/
def ratY (F : Type) [Field F] (n : ℕ) (j k : Fin n) : RF F n := ratVar F n (Sum.inr (j, k))

/-- A rational function is constant when it is an element of `F`. -/
def IsConstRF (F : Type) [Field F] (n : ℕ) (f : RF F n) : Prop :=
  f ∈ Set.range (ratConst F n)

/-! ## The four propositions -/

/-- **Nonscalar gates, per n.** For every field `F` and every `n ≥ 2`: every formal arithmetic
circuit over `F` for the product of two `n × n` matrices has at least `⌈n^(9/4) / 2⌉`
nonscalar multiplication or division gates.

In words: the inputs are the `2n²` entries as independent variables, the constants lie in `F`,
the gates add, subtract, multiply, or divide by a nonzero rational function, each reading only
earlier gates; for each `i, k` some gate equals `∑_j X i j * Y j k` as an identity in `F(X, Y)`.
Then the number of multiplications with both arguments nonconstant plus the number of divisions
with a nonconstant divisor is at least `⌈n^(9/4) / 2⌉`. -/
def GatesPerN : Prop :=
  ∀ (F : Type) [Field F] (n : ℕ), 2 ≤ n →
    ∀ (C : Circuit (MatVar n) F) (val : ℕ → RF F n) (out : Fin n → Fin n → Fin C.size),
      Circuit.WellFormed C →
      Circuit.Consistent C (ratVar F n) (ratConst F n) val →
      (∀ i k : Fin n, val (out i k).val = ∑ j : Fin n, ratX F n i j * ratY F n j k) →
      Nat.ceil ((n : ℝ) ^ ((9 : ℝ) / 4) / 2) ≤ Circuit.nonscalarCount C (IsConstRF F n) val

/-- **All multiplication and division gates, per n** (weaker than `GatesPerN`). For every
field `F` and every `n ≥ 2`, every formal arithmetic circuit over `F` for the product of two
`n × n` matrices (as in `GatesPerN`) has at least `⌈n^(9/4) / 2⌉` gates that are
multiplications or divisions, every such gate counted whatever its arguments. -/
def GatesPerNAll : Prop :=
  ∀ (F : Type) [Field F] (n : ℕ), 2 ≤ n →
    ∀ (C : Circuit (MatVar n) F) (val : ℕ → RF F n) (out : Fin n → Fin n → Fin C.size),
      Circuit.WellFormed C →
      Circuit.Consistent C (ratVar F n) (ratConst F n) val →
      (∀ i k : Fin n, val (out i k).val = ∑ j : Fin n, ratX F n i j * ratY F n j k) →
      Nat.ceil ((n : ℝ) ^ ((9 : ℝ) / 4) / 2) ≤ Circuit.mulDivCount C

/-- **Asymptotic rank.** For every field `F` and every `n ≥ 2`, the asymptotic rank of `T_n`
over `F` equals `n^(9/4)`: the `k`-th roots `R_F(T_n^{⊗k})^{1/k}` of the ranks over `F` of the
tensor powers converge to `n^(9/4)` as `k → ∞` (the paper's definition, a limit), and their
infimum over `k ≥ 1` (the textbook's equivalent form, by Fekete's lemma) equals `n^(9/4)`. -/
def AsymptoticRank : Prop :=
  ∀ (F : Type) [Field F] (n : ℕ), 2 ≤ n →
    Filter.Tendsto (fun k : ℕ => rankRoot (matMul F n) k) Filter.atTop
        (nhds ((n : ℝ) ^ ((9 : ℝ) / 4))) ∧
      asymptoticRank (matMul F n) = (n : ℝ) ^ ((9 : ℝ) / 4)

/-- **Geometric border rank, lower bound.** For every field `F` and every `n ≥ 2`, the geometric
border rank of `T_n` over the algebraic closure `F̄` is at least `n^(9/4)`: whenever `T_n` lies
in the Zariski closure, in the affine space of tensors over `F̄`, of the set of tensors of rank
at most `r` over `F̄`, then `r ≥ n^(9/4)`. -/
def BorderRankLower : Prop :=
  ∀ (F : Type) [Field F] (n : ℕ), 2 ≤ n →
    (n : ℝ) ^ ((9 : ℝ) / 4) ≤ (geometricBorderRank (matMul (AlgebraicClosure F) n) : ℝ)

end PerN

end

/-! ## Phase 4 challenge statements (appended by the Phase 4 prover, cert-machine, 2026-11-25;
the file above is the statement writer's sealed PerN.lean, byte for byte, sha256 71a4378d…) -/

namespace PerN

theorem gatesPerNAll_holds : GatesPerNAll := by sorry

theorem gatesPerN_holds : GatesPerN := by sorry

theorem asymptoticRank_holds : AsymptoticRank := by sorry

theorem borderRankLower_holds : BorderRankLower := by sorry

end PerN
