/-
Reader test T5 (omega = 9/4 lane, row F4; item I12: "can a finite set of small N matter?").
Uses the challenge's definitions and two release facts about the schoolbook algorithm:
  naiveAlgorithm (MatrixMultiplication/Arithmetic/NaiveAlgorithm.lean, not read by the reader)
  formalCorrect_naiveAlgorithm (SpectralBooks/FormalCircuit.lean l.108)
Build inside the release's lean/ at 92b516ef: `lake env lean ReaderTests/T5_Eventually.lean`.

DECIDES: green = no error, no `sorry`, axioms only the three. Then "for all N ≥ 1 with one constant C"
in FormalAdmissibleExponent is equivalent to the textbook "for all sufficiently large N", at every
weight triple and every τ (negative τ + ε included): no finite set of small N can change formalOmega.
A tactic failure is a repair, not a finding.
-/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.FormalCircuit

namespace OAI.LinearAlgebra.SpectralBooks

open OAI.MatrixMultiplication.Arithmetic

theorem reader_admissible_iff_eventually (F : Type*) [Field F] (w12 w23 w31 τ : ℝ) :
    FormalAdmissibleExponent F w12 w23 w31 τ ↔
      ∀ ε : ℝ, 0 < ε → ∃ C : ℝ, 0 < C ∧ ∃ N₀ : ℕ, ∀ N : ℕ, N₀ ≤ N → 1 ≤ N →
        ∃ P : MatrixAlgorithm F (wireDimension N w31) (wireDimension N w12) (wireDimension N w23),
          FormalCorrect P ∧ (P.cost : ℝ) ≤ C * (N : ℝ) ^ (τ + ε) := by
  constructor
  · intro h ε hε
    obtain ⟨C, hC, hb⟩ := h ε hε
    exact ⟨C, hC, 0, fun N _ hN => hb N hN⟩
  · intro h ε hε
    obtain ⟨C, hC, N₀, hb⟩ := h ε hε
    -- the schoolbook cost at N, divided by N^(τ+ε)
    let q : ℕ → ℝ := fun N =>
      ((naiveAlgorithm (F := F) (wireDimension N w31) (wireDimension N w12)
          (wireDimension N w23)).cost : ℝ) / (N : ℝ) ^ (τ + ε)
    have hq : ∀ N, 0 ≤ q N := fun N =>
      div_nonneg (Nat.cast_nonneg _) (Real.rpow_nonneg (Nat.cast_nonneg _) _)
    have hsum : 0 ≤ ∑ M ∈ Finset.range N₀, q M := Finset.sum_nonneg fun M _ => hq M
    refine ⟨C + ∑ M ∈ Finset.range N₀, q M, by linarith, fun N hN => ?_⟩
    have hpos : 0 < (N : ℝ) ^ (τ + ε) := Real.rpow_pos_of_pos (by exact_mod_cast hN) _
    by_cases hN0 : N₀ ≤ N
    · obtain ⟨P, hP, hc⟩ := hb N hN0 hN
      exact ⟨P, hP, hc.trans (mul_le_mul_of_nonneg_right (by linarith) hpos.le)⟩
    · push_neg at hN0
      refine ⟨naiveAlgorithm (F := F) _ _ _, formalCorrect_naiveAlgorithm F _ _ _, ?_⟩
      have hmem : q N ≤ ∑ M ∈ Finset.range N₀, q M :=
        Finset.single_le_sum (fun M _ => hq M) (Finset.mem_range.mpr hN0)
      have hkey : ((naiveAlgorithm (F := F) (wireDimension N w31) (wireDimension N w12)
          (wireDimension N w23)).cost : ℝ) = q N * (N : ℝ) ^ (τ + ε) :=
        (div_mul_cancel₀ _ hpos.ne').symm
      rw [hkey]
      exact mul_le_mul_of_nonneg_right (by linarith) hpos.le

end OAI.LinearAlgebra.SpectralBooks

#print axioms OAI.LinearAlgebra.SpectralBooks.reader_admissible_iff_eventually
