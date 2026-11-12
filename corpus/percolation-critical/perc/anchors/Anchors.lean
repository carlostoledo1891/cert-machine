import ThetaAnchors

/-!
# P5 — what the anchors give the statement (PREREG-PERCOLATION.md, P5)

Mathlib only, over the sealed `Textbook` (sha256 4dc732f5…41ae) and `ThetaAnchors`.

* `pc_mem d`: p_c(d) ∈ [0, 1] for EVERY d, with no hypothesis — the set {p : θ(p) = 0} holds 0 and is bounded by 1, so
  the supremum is a true least upper bound, never the junk value `sSup` takes on an empty or unbounded set.
* `pc_lt_one_of_statement`: `Statement` ⇒ p_c(d) < 1 for every d ≥ 2, and `pc3_lt_one_of_statement3`: `Statement3` ⇒
  p_c(3) < 1. The statement the bridges prove is therefore not satisfied by the degenerate p_c = 1 (where θ = 1).
-/

namespace TextbookPercolation

/-- p_c(d) is a genuine supremum in [0, 1], in every dimension. -/
theorem pc_mem (d : ℕ) : pc d ∈ Set.Icc (0 : ℝ) 1 := by
  set S := {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, θ d ⟨p, h⟩ = 0} with hS
  have h0 : (0 : ℝ) ∈ S := ⟨⟨le_refl 0, zero_le_one⟩, theta_zero d⟩
  have hbdd : BddAbove S := ⟨1, fun p hp => hp.1.2⟩
  exact ⟨le_csSup hbdd h0, csSup_le ⟨0, h0⟩ fun p hp => hp.1.2⟩

/-- The statement forces p_c(d) < 1 for every d ≥ 2 (non-vacuity, with `theta_one`). -/
theorem pc_lt_one_of_statement (hS : Statement) {d : ℕ} (hd : 2 ≤ d) : pc d < 1 := by
  obtain ⟨h, h0⟩ := hS d hd
  refine lt_of_le_of_ne h.2 fun h1 => ?_
  have hone : (⟨pc d, h⟩ : unitInterval) = 1 := Subtype.ext h1
  rw [hone, theta_one (by omega)] at h0
  exact one_ne_zero h0

/-- The same at d = 3, for the statement bridge O proves. -/
theorem pc3_lt_one_of_statement3 (hS : Statement3) : pc 3 < 1 := by
  obtain ⟨h, h0⟩ := hS
  refine lt_of_le_of_ne h.2 fun h1 => ?_
  have hone : (⟨pc 3, h⟩ : unitInterval) = 1 := Subtype.ext h1
  rw [hone, theta_one (by norm_num)] at h0
  exact one_ne_zero h0

end TextbookPercolation
