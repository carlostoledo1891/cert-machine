import N6R.Bridge
import N6R.Growth

open MvPolynomial Statement

namespace CertMachine.N6

universe u

theorem remarkN6_of (hdet : DetHasSmallCircuits.{u}) (hmain : Statement.MainTheoremApprox.{u}) :
    RemarkN6.{u} := by
  obtain ⟨a, hbridge⟩ := approximates_of_approxByDet hdet
  obtain ⟨c, hc, hmain⟩ := hmain
  obtain ⟨c', hc', M, htransfer⟩ := beyond_size_transfer a c hc
  refine ⟨c', hc', ?_⟩
  intro p hp
  obtain ⟨m₀, hm₀⟩ := hmain p
  refine ⟨max M m₀, ?_⟩
  intro F _ _ m hm n h
  apply htransfer m ((le_max_left _ _).trans hm) n
  apply (hm₀ F m ((le_max_right _ _).trans hm) _).2 hp
  simpa only [Fintype.card_prod, Fintype.card_fin] using hbridge F _ _ n h

end CertMachine.N6
