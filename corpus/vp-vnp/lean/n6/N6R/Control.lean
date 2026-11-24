import CertMachine.Anchors
import CertMachine.N6Statement

open MvPolynomial Statement CertMachine.Anchors

namespace CertMachine.N6

universe u

theorem perm_eq_det_charTwo (F : Type u) [Field F] [CharP F 2] (m : ℕ) :
    perm F m = det F m := by
  classical
  unfold perm det
  rw [Matrix.det_apply]
  apply Finset.sum_congr rfl
  intro σ _
  rcases Int.units_eq_one_or (Equiv.Perm.sign σ) with hs | hs <;>
    simp [hs, Units.smul_def, CharTwo.neg_eq]

theorem permCharTwo_of (hdet : DetHasSmallCircuits.{u}) : PermCharTwo.{u} := by
  obtain ⟨a, ha⟩ := hdet
  rintro F _ _ ⟨c, hc, m₀, hm₀⟩
  obtain ⟨m, hm, hb⟩ := not_beyond_poly c hc a m₀
  apply hb (hm₀ m hm _ ?_)
  rw [perm_eq_det_charTwo]
  exact ha F m

end CertMachine.N6
