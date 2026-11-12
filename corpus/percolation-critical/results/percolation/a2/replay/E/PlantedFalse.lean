import ThetaAnchors

/-!
# Red control R4 — the planted statement is FALSE, proved (amendment A1 of PREREG-PERCOLATION.md)

Built ONLY against the planted copy `Textbook.R4.lean` (renamed `Textbook.lean` in its own build directory), which differs
from the sealed statement in one line: p_c's body reads the supremum of the SUPERCRITICAL set,
`sSup {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, 0 < θ d ⟨p, h⟩}`, instead of Grimmett's supremum of {θ = 0}.
`ThetaAnchors` builds unchanged against it (it never mentions p_c). Here: that planted p_c is 1 in every d ≥ 1, so the
planted `Statement` and `Statement3` assert θ(1) = 0, which `theta_one` refutes. A bridge that built against the planted
file would prove a false statement; red control R4 requires both bridges to FAIL there.
-/

namespace TextbookPercolation

/-- In the planted file, p_c(d) = 1 for d ≥ 1: θ(1) = 1 > 0 puts 1 in the set, and the set lies in [0, 1]. -/
theorem planted_pc_eq_one {d : ℕ} (hd : 1 ≤ d) : pc d = 1 := by
  unfold pc
  apply IsGreatest.csSup_eq
  refine ⟨⟨⟨zero_le_one, le_refl 1⟩, ?_⟩, fun p hp => hp.1.2⟩
  have h1 : θ d ⟨1, ⟨zero_le_one, le_refl 1⟩⟩ = 1 := theta_one hd
  rw [h1]
  exact one_pos

/-- The planted `Statement` is false. -/
theorem planted_statement_false : ¬ Statement := by
  intro hS
  obtain ⟨h, h0⟩ := hS 2 le_rfl
  have hone : (⟨pc 2, h⟩ : unitInterval) = 1 := Subtype.ext (planted_pc_eq_one (by norm_num))
  rw [hone, theta_one (by norm_num)] at h0
  exact one_ne_zero h0

/-- The planted `Statement3` is false. -/
theorem planted_statement3_false : ¬ Statement3 := by
  intro hS
  obtain ⟨h, h0⟩ := hS
  have hone : (⟨pc 3, h⟩ : unitInterval) = 1 := Subtype.ext (planted_pc_eq_one (by norm_num))
  rw [hone, theta_one (by norm_num)] at h0
  exact one_ne_zero h0

end TextbookPercolation
