import OAI.LinearAlgebra.SpectralBooks.ExactExponent

/-!
# Row F3: anchors on the challenge's own definitions (ω = 9/4 audit, cert-machine, 2026-11-25)

Every statement below is about the definitions of `ComparatorChallenges.MatrixExponent`
(`MatrixAlgorithm`, `FormalCorrect`, `MatrixAlgorithm.cost`, `FormalAdmissibleExponent`,
`formalOmega`); the Comparator config `F3.json` checks them against a byte copy of that challenge
file with these statements appended. Release lemmas used: `naiveAlgorithm`,
`formalCorrect_naiveAlgorithm`, `naiveAlgorithm_cost` (schoolbook); `formalAdmissibleExponent_naive`
(τ = sum of the weights is admissible); `FormalAdmissibleExponent.load_le` and `unit_weight_loads`
(every admissible τ dominates the output area); `MatrixAlgorithm.pad`, `FormalCorrect.pad`,
`MatrixAlgorithm.pad_cost_eq` (padding); `formalOmega_one_one_zero` (an independent `(1,1,0)`
value); `rectangular_exponent` (the closed form's values).
-/

namespace OAI.LinearAlgebra.SpectralBooks.F3

open OAI.MatrixMultiplication.Arithmetic
open OAI.LinearAlgebra.SpectralBooks

noncomputable section

/-- F3 (a): the schoolbook algorithm is a correct `N × N` by `N × N` algorithm of cost `2N³`
at every size, over every field. -/
theorem schoolbook (F : Type*) [Field F] (N : ℕ) :
    ∃ P : MatrixAlgorithm F N N N, FormalCorrect P ∧ P.cost = 2 * N * N * N :=
  ⟨naiveAlgorithm N N N, formalCorrect_naiveAlgorithm F N N N, naiveAlgorithm_cost N N N⟩

/-- F3 (a): so the admissible set at `(1,1,1)` is nonempty: `τ = 3` is admissible. -/
theorem admissible_three (F : Type*) [Field F] : FormalAdmissibleExponent F 1 1 1 3 := by
  have h := formalAdmissibleExponent_naive F (w12 := 1) (w23 := 1) (w31 := 1)
    zero_le_one zero_le_one zero_le_one
  have e : (1 : ℝ) + 1 + 1 = 3 := by norm_num
  rw [e] at h
  exact h

/-- F3 (b): every admissible exponent at `(1,1,1)` is at least `2`. -/
theorem two_le_of_admissible (F : Type*) [Field F] {τ : ℝ}
    (h : FormalAdmissibleExponent F 1 1 1 τ) : 2 ≤ τ := by
  have h0 := h.load_le 0
  simp only [unit_weight_loads] at h0
  exact h0

/-- F3 (a, b): hence `formalOmega F 1 1 1` is the infimum of a nonempty set bounded below by `2`,
so it lies in `[2, 3]` and is not Lean's junk value `0` for `sInf` of an empty or unbounded set. -/
theorem formalOmega_square_mem_Icc (F : Type*) [Field F] :
    formalOmega F 1 1 1 ∈ Set.Icc (2 : ℝ) 3 := by
  unfold formalOmega
  exact ⟨le_csInf ⟨3, admissible_three F⟩ (fun τ hτ => two_le_of_admissible F hτ),
    csInf_le ⟨2, fun τ hτ => two_le_of_admissible F hτ⟩ (admissible_three F)⟩

/-- F3 (c): padding: a correct algorithm at a larger size gives a correct algorithm at every
smaller size, of no greater cost. -/
theorem padding (F : Type*) [Field F] {a b c A B C : ℕ} (ha : a ≤ A) (hb : b ≤ B) (hc : c ≤ C)
    (P : MatrixAlgorithm F A B C) (hP : FormalCorrect P) :
    ∃ Q : MatrixAlgorithm F a b c, FormalCorrect Q ∧ Q.cost ≤ P.cost :=
  ⟨P.pad ha hb hc, hP.pad ha hb hc, (MatrixAlgorithm.pad_cost_eq ha hb hc P).le⟩

/-- F3 (d): the closed form of `rectangular_exponent` at `(1,1,0)` (a `1 × N` row times an `N × N`
matrix in the release's wire order) is the trivial exponent `2`. -/
theorem formula_one_one_zero (F : Type*) [Field F] : formalOmega F 1 1 0 = 2 := by
  rw [rectangular_exponent F 1 1 0]
  norm_num [max_def, min_def]

/-- F3 (d): the same value from the release's independent `formalOmega_one_one_zero` (schoolbook
and the area bound, without the closed form). -/
theorem independent_one_one_zero (F : Type*) [Field F] : formalOmega F 1 1 0 = 2 :=
  formalOmega_one_one_zero F

/-- F3 (d): the closed form at `(1,0,0)` (a `1 × N` row times an `N × 1` column, the inner
product) is the trivial exponent `1`. -/
theorem formula_one_zero_zero (F : Type*) [Field F] : formalOmega F 1 0 0 = 1 := by
  rw [rectangular_exponent F 1 0 0]
  norm_num [max_def, min_def]

/-- F3 (d): the same value without the closed form: the schoolbook gives `τ = 1`, and every
admissible `τ` dominates the load `w31 + w12 = 1` of the inner product. -/
theorem independent_one_zero_zero (F : Type*) [Field F] : formalOmega F 1 0 0 = 1 := by
  let S := {τ : ℝ | FormalAdmissibleExponent F 1 0 0 τ}
  have hmem : FormalAdmissibleExponent F 1 0 0 1 := by
    have h := formalAdmissibleExponent_naive F (w12 := 1) (w23 := 0) (w31 := 0)
      zero_le_one le_rfl le_rfl
    have e : (1 : ℝ) + 0 + 0 = 1 := by norm_num
    rw [e] at h
    exact h
  have hbound : ∀ τ ∈ S, (1 : ℝ) ≤ τ := by
    intro τ hτ
    have h := FormalAdmissibleExponent.load_le (F := F) (w12 := 1) (w23 := 0) (w31 := 0) hτ 0
    norm_num [loads] at h
    exact h
  exact le_antisymm (csInf_le ⟨1, hbound⟩ hmem) (le_csInf ⟨1, hmem⟩ hbound)

end

end OAI.LinearAlgebra.SpectralBooks.F3
