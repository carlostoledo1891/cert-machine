import Mathlib
-- control C1: the challenge with 1 / 2 replaced by 1 / 3; the release's theorem must NOT match it
def RiemannZetaZerosOnLine : Prop :=
  ∀ s : ℂ, riemannZeta s = 0 → (¬∃ n : ℕ, s = -2 * ((n : ℂ) + 1)) → s ≠ 1 → s.re = 1 / 3
theorem riemannZeta_eq_zero_re : RiemannZetaZerosOnLine := sorry
