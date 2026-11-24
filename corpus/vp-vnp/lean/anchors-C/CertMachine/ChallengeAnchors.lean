import Statement

/-!
# Challenge for `CertMachine.Anchors` (author C): the anchor statements, proofs replaced by `sorry`

Same names, binders and `open`s as the proof module, so Comparator can run with this file as the
challenge and `CertMachine.Anchors` as the solution.
-/

open MvPolynomial Statement Filter

namespace CertMachine.Anchors

universe u v

theorem A1_any {R : Type u} [CommSemiring R] {V : Type} (f : MvPolynomial V R) :
    ∃ s : ℕ, Computes f s :=
  sorry

theorem A1 {R : Type u} [CommSemiring R] {V : Type} [Fintype V] (f : MvPolynomial V R) :
    ∃ s : ℕ, Computes f s :=
  sorry

theorem A2 {R : Type u} [CommSemiring R] {V : Type} {f : MvPolynomial V R} {s : ℕ}
    (h : Computes f s) : Computes f (s + 1) :=
  sorry

theorem A3 {R : Type u} [CommSemiring R] {V : Type} (w : V) (k : ℕ) :
    Computes (X w ^ 2 ^ k : MvPolynomial V R) (k + 1) :=
  sorry

theorem A4 {F : Type u} [Field F] {V : Type} {f : MvPolynomial V F} {s : ℕ}
    (h : Computes f s) : Approximates f s :=
  sorry

theorem A5_real (c : ℝ) (hc : 0 < c) (k : ℝ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) :=
  sorry

theorem A5 (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 3 : ℝ)) :=
  sorry

theorem A6 (h : MainTheorem.{u}) (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := fun n => hc F n } : Family F) ∉ VP F ∧
      (ringChar F ≠ 2 →
        ({ vars := fun n => Fin n × Fin n, poly := fun n => perm F n } : Family F) ∉ VP F) :=
  sorry

theorem R1_general (R : Type u) [CommSemiring R] : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) R) ^ m) s →
      Beyond c m s :=
  sorry

theorem R1 : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) s →
      Beyond c m s :=
  sorry

theorem R1_shape : ¬ ∃ c : ℝ, 0 < c ∧ ∀ p : ℕ, ∃ m₀ : ℕ, ∀ (F : Type u) [Field F] [CharP F p],
    ∀ m ≥ m₀, ∀ s : ℕ,
      Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) F) ^ m) s →
        Beyond c m s :=
  sorry

end CertMachine.Anchors
