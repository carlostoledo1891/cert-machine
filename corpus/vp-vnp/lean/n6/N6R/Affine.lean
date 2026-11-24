import CertMachine.Anchors

open MvPolynomial Statement CertMachine.Anchors

namespace CertMachine.N6

universe u

variable {R : Type u} [CommSemiring R] {V : Type}

/-- A polynomial of degree at most one is determined by its constant and linear coefficients. -/
theorem affine_normal_form [Fintype V] (f : MvPolynomial V R) (hf : f.totalDegree ≤ 1) :
    f = C (coeff 0 f) + ∑ v : V, C (coeff (Finsupp.single v 1) f) * X v := by
  classical
  apply MvPolynomial.ext
  intro d
  by_cases hd : d = 0
  · subst d
    simp [coeff_sum, coeff_X]
  by_cases hlin : ∃ v : V, d = Finsupp.single v 1
  · obtain ⟨v, rfl⟩ := hlin
    simp [coeff_sum, coeff_X, Finsupp.single_left_inj (one_ne_zero : (1 : ℕ) ≠ 0),
      mul_ite, Ne.symm hd]
  · have hmiss : d ∉ f.support := by
      intro hmem
      have hle : d.degree ≤ 1 := (le_totalDegree hmem).trans hf
      have hpos : d.degree ≠ 0 := fun h => hd ((Finsupp.degree_eq_zero_iff d).mp h)
      exact hlin ((Finsupp.sum_eq_one_iff d).mp (show d.degree = 1 by omega))
    have hneq (v : V) : Finsupp.single v 1 ≠ d := fun e => hlin ⟨v, e.symm⟩
    simp [notMem_support_iff.mp hmiss, coeff_sum, coeff_X, hneq, Ne.symm hd]

/-- Start with the constant and append one three-gate linear term and one sum gate per variable. -/
theorem computes_affine_sum (b : R) (w : V → R) (s : Finset V) :
    Computes (C b + ∑ v ∈ s, C (w v) * X v) (4 * s.card + 1) := by
  classical
  induction s using Finset.induction_on with
  | empty => simpa using (computes_C (V := V) b)
  | @insert v s hv ih =>
    have h := computes_add ih (computes_mul (computes_C (w v)) (computes_X v))
    rw [Finset.card_insert_of_notMem hv, Finset.sum_insert hv]
    rw [show 4 * (s.card + 1) + 1 = 4 * s.card + 1 + (1 + 1 + 1) + 1 by omega]
    simpa only [add_assoc, add_left_comm, add_comm] using h

theorem computes_affine [Fintype V] (f : MvPolynomial V R) (hf : f.totalDegree ≤ 1) :
    Computes f (4 * Fintype.card V + 4) := by
  have h := computes_affine_sum (coeff 0 f) (fun v => coeff (Finsupp.single v 1) f) Finset.univ
  rw [← affine_normal_form f hf, Finset.card_univ] at h
  exact computes_mono h (by omega)

end CertMachine.N6
