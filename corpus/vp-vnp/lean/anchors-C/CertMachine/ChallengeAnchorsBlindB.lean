import CertMachine.BlindB

/-!
# Challenge for `CertMachine.AnchorsBlindB` (author C): statements only, proofs `sorry`
-/

open MvPolynomial

namespace CertMachine.AnchorsBlindB

variable {K V : Type} [Field K]

theorem A1_B (f : MvPolynomial V K) : ∃ D : BlindB.Circuit K V, D.Computes f :=
  sorry

theorem A2_B {f : MvPolynomial V K} (D : BlindB.Circuit K V) (h : D.Computes f) :
    ∃ D' : BlindB.Circuit K V, D'.size = D.size + 1 ∧ D'.Computes f :=
  sorry

theorem A3_B (v : V) (k : ℕ) :
    ∃ D : BlindB.Circuit K V, D.size = k + 1 ∧ D.Computes (X v ^ 2 ^ k) :=
  sorry

theorem A4_B {f : MvPolynomial V K} (D : BlindB.Circuit K V) (h : D.Computes f) :
    ∃ D' : BlindB.Circuit (LaurentSeries K) V, D'.size = D.size ∧ D'.Approximates f :=
  sorry

theorem A5_B (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < BlindB.gateBound c m :=
  sorry

theorem A6_B (h : BlindB.MainTheorem) (K : Type) [Field K] :
    (⟨fun n => n * n, fun n => rename (fun ij : Fin n × Fin n => finProdFinEquiv ij)
        (BlindB.HC K n)⟩ : BlindB.Family K) ∉ BlindB.VP K ∧
      (ringChar K ≠ 2 →
        (⟨fun n => n * n, fun n => rename (fun ij : Fin n × Fin n => finProdFinEquiv ij)
          (BlindB.PERM K n)⟩ : BlindB.Family K) ∉ BlindB.VP K) :=
  sorry

theorem R1_B : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    ∀ D : BlindB.Circuit ℚ (Fin m × Fin m),
      D.Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) →
        BlindB.gateBound c m < (D.size : ℝ) :=
  sorry

end CertMachine.AnchorsBlindB
