/- Control C1 (cert-machine, VP ≠ VNP lane, corpus/vp-vnp/PREREG.md): the special-case theorem of Challenge.lean with
   the exponent 1/3 of the bound changed to 1/2. Placed in the release's tree on the pod as Challenge/C1.lean (module
   Challenge.C1) for the control only. Comparator and con-leche --compare must REFUSE it against the release's
   Solution.permanent_over_real. MIT -/
import Statement

namespace Solution

open Statement

theorem permanent_over_real : ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m ≥ m₀, ∀ s : ℕ,
    Computes (perm ℝ m) s → (m : ℝ) ^ (c * Real.logb 2 m ^ (1 / 2 : ℝ)) < s := by
  sorry

end Solution
