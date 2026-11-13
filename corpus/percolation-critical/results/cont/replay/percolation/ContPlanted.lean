import ContStatement
import DimOne
import UnitAux

/-!
# The two planted variants of the continuity statement are FALSE (red control C4)

Mathlib, the sealed statement files and our earlier anchors only (`ThetaAnchors`: θ(0) = 0, θ(1) = 1;
`DimOne`: in dimension one θ = 0 below 1). Nothing of the lab's library is imported.
-/

namespace TextbookPercolation

/-- PLANTED 1 is false: in dimension one θ = 0 on [0, 1) and θ(1) = 1, so θ is not continuous at 1. -/
theorem not_planted_dimOne : ¬ Planted_dimOne := by
  intro h
  have hc : Continuous (θ 1) := h 1 le_rfl
  have h0 : θ 1 1 = 0 :=
    UnitAux.eq_zero_of_continuous_of_zero_below hc 1 (by simp)
      (fun q hq => theta_dim_one_eq_zero q (by have := Subtype.coe_lt_coe.2 hq; simpa using this))
  rw [theta_one le_rfl] at h0
  exact one_ne_zero h0

/-- PLANTED 2 is false: θ(0) = 0 and θ(1) = 1 in dimension two. -/
theorem not_planted_constant : ¬ Planted_constant := by
  intro h
  have h01 := h 2 le_rfl 0 1
  rw [theta_zero, theta_one (by norm_num)] at h01
  exact zero_ne_one h01

end TextbookPercolation
