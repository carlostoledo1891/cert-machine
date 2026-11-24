import CertMachine.BlindA

/-!
# Challenge for `CertMachine.AnchorsBlindA` (author C): statements only, proofs `sorry`
-/

open MvPolynomial BlindA

namespace CertMachine.AnchorsBlindA

variable {σ F : Type} [Field F]

theorem A1_A (f : MvPolynomial σ F) : ∃ ℓ : ℕ, ∃ P : SLP σ F ℓ, f ∈ P.computed :=
  sorry

theorem A1_A_min (f : MvPolynomial σ F) : ∃ P : SLP σ F (complexity F f), f ∈ P.computed :=
  sorry

theorem complexity_gt_iff (f : MvPolynomial σ F) (B : ℝ) :
    B < (complexity F f : ℝ) ↔ ∀ (ℓ : ℕ) (P : SLP σ F ℓ), f ∈ P.computed → B < ℓ :=
  sorry

theorem A2_A {f : MvPolynomial σ F} {ℓ : ℕ} (P : SLP σ F ℓ) (h : f ∈ P.computed) :
    ∃ P' : SLP σ F (ℓ + 1), f ∈ P'.computed :=
  sorry

theorem A3_A (v : σ) (k : ℕ) : ∃ P : SLP σ F k, (X v ^ 2 ^ k : MvPolynomial σ F) ∈ P.computed :=
  sorry

theorem A3_A_complexity (v : σ) (k : ℕ) : complexity F (X v ^ 2 ^ k : MvPolynomial σ F) ≤ k :=
  sorry

theorem A4_A {K : Type} [Field K] {f : MvPolynomial σ K} {ℓ : ℕ} (P : SLP σ K ℓ)
    (h : f ∈ P.computed) :
    ∃ P' : SLP σ (LaurentSeries K) ℓ, ∃ G ∈ P'.computed, Approximates K G f :=
  sorry

theorem A4_A_complexity {K : Type} [Field K] (f : MvPolynomial σ K) :
    approxComplexity K f ≤ complexity K f :=
  sorry

theorem A5_A (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < claimedBound c m :=
  sorry

theorem A6_A (h : BlindA.MainTheorem) (K : Type) [Field K] :
    hcFamily K ∉ VP K ∧ (ringChar K ≠ 2 → permFamily K ∉ VP K) :=
  sorry

theorem R1_A : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    claimedBound c m <
      (complexity ℚ ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) :
        ℝ) :=
  sorry

end CertMachine.AnchorsBlindA
