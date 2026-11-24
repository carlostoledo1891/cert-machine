import N6B.Layers
import CertMachine.N6Statement

open MvPolynomial CertMachine.Anchors

namespace N6B

universe u

/-- Allocate one gate per variable, including all entries needed by later iterations. -/
theorem inputs (R : Type u) [CommRing R] (n : ℕ) :
    ∃ t : Tape (Fin n × Fin n) R, t.size ≤ n * n ∧ ∀ i j : Fin n, t.Has (X (i, j)) := by
  let e : Tape (Fin n × Fin n) R := Tape.empty
  obtain ⟨t, ht, hall⟩ := Cost.family (S := e.Has) Finset.univ (X (R := R)) e
    (fun h => h) (fun ij _ => Cost.var ij)
  exact ⟨t, by simpa [e, Tape.empty] using ht.bound, fun i j => hall (i, j) (Finset.mem_univ _)⟩

/-- At positive dimension the algorithm takes n − 1 layers followed by a constant and a product. -/
theorem det_succ_circuit (R : Type u) [CommRing R] (k : ℕ) :
    Statement.Computes (CertMachine.N6.det R (k + 1))
      ((k + 1) * (k + 1) + k * layerBudget (k + 1) + 2) := by
  let n := k + 1
  let A : Matrix (Fin n) (Fin n) (MvPolynomial (Fin n × Fin n) R) :=
    Matrix.of fun i j => X (i, j)
  obtain ⟨t, ht, hx⟩ := inputs R n
  have hA : Entries t.Has n (BirdDet.get n (flatten A)) := by
    intro i j
    rw [get_flatten]
    exact hx i j
  obtain ⟨v, hv, hF⟩ := build_iterate (flatten A) t hA k
  have htop := hF 0 0
  have hsign := Cost.constant (S := v.Has) ((-1 : R) ^ k)
  have hlast := hsign.mul (Cost.read htop)
  obtain ⟨w, hw, hdet⟩ := hlast v (fun h => h)
  have heq : CertMachine.N6.det R n =
      C ((-1 : R) ^ k) * ((BirdDet.stepEntry n (flatten A))^[k] (BirdDet.get n (flatten A))) 0 0 := by
    change A.det = _
    rw [det_flatten, BirdDet.birdDet_succ]
    simp [n]
  rw [show k + 1 = n from rfl, heq]
  apply computes_mono (s := w.size)
  · exact ⟨w.line, w.valid, hdet⟩
  · have h₁ := hv.bound
    have h₂ := hw.bound
    omega

theorem budget_bound (n : ℕ) : n * n + n * layerBudget n + 2 ≤ n ^ 12 + 12 := by
  rcases n with _ | _ | k
  · decide
  · decide
  · change (k + 2) * (k + 2) + (k + 2) * layerBudget (k + 2) + 2 ≤ (k + 2) ^ 12 + 12
    unfold layerBudget
    ring_nf
    omega

end N6B

namespace CertMachine.N6

universe u

theorem det_has_small_circuits : DetHasSmallCircuits.{u} := by
  refine ⟨12, fun R _ n => ?_⟩
  cases n with
  | zero =>
    have h : Statement.Computes (det R 0) 1 := by simpa [det] using
      (computes_C (V := Fin 0 × Fin 0) (1 : R))
    exact computes_mono h (by decide)
  | succ k =>
    apply computes_mono (N6B.det_succ_circuit R k)
    apply le_trans _ (N6B.budget_bound (k + 1))
    have h := Nat.mul_le_mul_right (N6B.layerBudget (k + 1)) (Nat.le_succ k)
    exact Nat.add_le_add_right (Nat.add_le_add_left h _) 2

end CertMachine.N6
