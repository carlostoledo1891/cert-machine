import N6R.Affine
import N6R.Substitution
import CertMachine.N6Statement

open MvPolynomial Statement

namespace CertMachine.N6

universe u

/-- Evaluating the generic determinant at the entries of a polynomial matrix gives its determinant. -/
theorem aeval_det_entries {R : Type u} [CommRing R] {V : Type} {n : ℕ}
    (M : Matrix (Fin n) (Fin n) (MvPolynomial V R)) :
    aeval (fun ij : Fin n × Fin n => M ij.1 ij.2) (det R n) = M.det := by
  unfold det
  rw [AlgHom.map_det]
  congr 1
  ext i j : 1
  exact aeval_X _ _

theorem approximates_of_approxByDet (hdet : DetHasSmallCircuits.{u}) :
    ∃ a : ℕ, ∀ (F : Type u) [Field F] (V : Type) [Fintype V] (f : MvPolynomial V F) (n : ℕ),
      ApproxByDet f n →
      Approximates f ((n ^ a + a) + n * n * (4 * Fintype.card V + 4)) := by
  obtain ⟨a, ha⟩ := hdet
  refine ⟨a, ?_⟩
  rintro F _ V _ f n ⟨M, hdeg, hcoeff⟩
  refine ⟨M.det, ?_, hcoeff⟩
  have h := computes_substitute (fun ij : Fin n × Fin n => M ij.1 ij.2)
    (fun ij => computes_affine _ (hdeg ij.1 ij.2)) (ha (LaurentSeries F) n)
  simpa only [aeval_det_entries, Fintype.card_prod, Fintype.card_fin] using h

end CertMachine.N6
