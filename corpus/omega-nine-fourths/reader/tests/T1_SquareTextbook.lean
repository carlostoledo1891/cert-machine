/-
Reader test T1 (omega = 9/4 lane, row F4; items I12, I13, I14).
Uses ONLY the challenge's definitions and the theorem `square_exponent`; no other release lemma.
Build inside the release's lean/ at 92b516ef: `lake env lean ReaderTests/T1_SquareTextbook.lean`.

DECIDES: green = elaborates with no error and no `sorry`, and every `#print axioms` line lists only
propext, Quot.sound, Classical.choice. Green means:
  * the admissible set at (1,1,1) is non-empty and bounded below, so `formalOmega F 1 1 1` is a
    genuine infimum and not Lean's junk value 0 (item I14);
  * it is exactly [9/4, ∞) (reader_square_admissible_iff);
  * in textbook words, with no sInf and no wireDimension left: N × N products cost O(N^(9/4+δ)) for
    every δ > 0, and for no δ > 0 are they O(N^(9/4−δ)) (reader_square_upper, reader_square_lower).
A failure of a TACTIC (not of a statement) is a repair for the control room, not a finding; say so.
-/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent

namespace OAI.LinearAlgebra.SpectralBooks

open OAI.MatrixMultiplication.Arithmetic

/-- A larger exponent is admissible whenever a smaller one is (base N ≥ 1). -/
theorem reader_admissible_mono {F : Type*} [Field F] {w12 w23 w31 σ τ : ℝ}
    (hσ : FormalAdmissibleExponent F w12 w23 w31 σ) (hle : σ ≤ τ) :
    FormalAdmissibleExponent F w12 w23 w31 τ := by
  intro ε hε
  obtain ⟨C, hC, hb⟩ := hσ ε hε
  refine ⟨C, hC, fun N hN => ?_⟩
  obtain ⟨P, hP, hc⟩ := hb N hN
  refine ⟨P, hP, hc.trans (mul_le_mul_of_nonneg_left ?_ hC.le)⟩
  exact Real.rpow_le_rpow_of_exponent_le (by exact_mod_cast hN) (by linarith)

/-- The value 9/4 ≠ 0 rules out Lean's junk infimum: the set is non-empty and bounded below. -/
theorem reader_square_nonjunk (F : Type*) [Field F] :
    ({σ : ℝ | FormalAdmissibleExponent F 1 1 1 σ}).Nonempty ∧
      BddBelow {σ : ℝ | FormalAdmissibleExponent F 1 1 1 σ} := by
  have hω : sInf {σ : ℝ | FormalAdmissibleExponent F 1 1 1 σ} = (9 : ℝ) / 4 := square_exponent F
  refine ⟨?_, ?_⟩
  · by_contra h
    rw [Set.not_nonempty_iff_eq_empty] at h
    rw [h, Real.sInf_empty] at hω
    norm_num at hω
  · by_contra h
    rw [Real.sInf_of_not_bddBelow h] at hω
    norm_num at hω

/-- The admissible set at unit weights is exactly [9/4, ∞). -/
theorem reader_square_admissible_iff (F : Type*) [Field F] (τ : ℝ) :
    FormalAdmissibleExponent F 1 1 1 τ ↔ (9 : ℝ) / 4 ≤ τ := by
  obtain ⟨hne, hbdd⟩ := reader_square_nonjunk F
  have hω : sInf {σ : ℝ | FormalAdmissibleExponent F 1 1 1 σ} = (9 : ℝ) / 4 := square_exponent F
  constructor
  · intro h
    rw [← hω]
    exact csInf_le hbdd h
  · intro h ε hε
    obtain ⟨σ, hσ, hlt⟩ := exists_lt_of_csInf_lt hne
      (show sInf {σ : ℝ | FormalAdmissibleExponent F 1 1 1 σ} < (9 : ℝ) / 4 + ε / 2 by
        rw [hω]; linarith)
    have hσ' : FormalAdmissibleExponent F 1 1 1 σ := hσ
    obtain ⟨C, hC, hb⟩ := hσ' (ε / 2) (half_pos hε)
    refine ⟨C, hC, fun N hN => ?_⟩
    obtain ⟨P, hP, hc⟩ := hb N hN
    refine ⟨P, hP, hc.trans (mul_le_mul_of_nonneg_left ?_ hC.le)⟩
    exact Real.rpow_le_rpow_of_exponent_le (by exact_mod_cast hN) (by linarith)

theorem reader_wd_one (N : ℕ) : wireDimension N 1 = N := by
  simp [wireDimension]

/-- Textbook upper bound: N × N products in O(N^(9/4+δ)) total operations, for every δ > 0. -/
theorem reader_square_upper (F : Type*) [Field F] {δ : ℝ} (hδ : 0 < δ) :
    ∃ C : ℝ, 0 < C ∧ ∀ N : ℕ, 1 ≤ N → ∃ P : MatrixAlgorithm F N N N,
      FormalCorrect P ∧ (P.cost : ℝ) ≤ C * (N : ℝ) ^ ((9 : ℝ) / 4 + δ) := by
  obtain ⟨C, hC, hb⟩ := (reader_square_admissible_iff F ((9 : ℝ) / 4)).mpr le_rfl δ hδ
  refine ⟨C, hC, fun N hN => ?_⟩
  have h := hb N hN
  rw [reader_wd_one] at h
  exact h

/-- Textbook lower bound: for no δ > 0 is the cost O(N^(9/4−δ)) (one constant for all N ≥ 1). -/
theorem reader_square_lower (F : Type*) [Field F] {δ : ℝ} (hδ : 0 < δ) :
    ¬ ∃ C : ℝ, 0 < C ∧ ∀ N : ℕ, 1 ≤ N → ∃ P : MatrixAlgorithm F N N N,
      FormalCorrect P ∧ (P.cost : ℝ) ≤ C * (N : ℝ) ^ ((9 : ℝ) / 4 - δ) := by
  rintro ⟨C, hC, hb⟩
  have hadm : FormalAdmissibleExponent F 1 1 1 ((9 : ℝ) / 4 - δ) := by
    intro ε hε
    refine ⟨C, hC, fun N hN => ?_⟩
    rw [reader_wd_one]
    obtain ⟨P, hP, hc⟩ := hb N hN
    refine ⟨P, hP, hc.trans (mul_le_mul_of_nonneg_left ?_ hC.le)⟩
    exact Real.rpow_le_rpow_of_exponent_le (by exact_mod_cast hN) (by linarith)
  have := (reader_square_admissible_iff F _).mp hadm
  linarith

end OAI.LinearAlgebra.SpectralBooks

#print axioms OAI.LinearAlgebra.SpectralBooks.reader_square_nonjunk
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_square_admissible_iff
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_square_upper
#print axioms OAI.LinearAlgebra.SpectralBooks.reader_square_lower
