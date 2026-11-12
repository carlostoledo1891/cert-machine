import DimOne
-- The three fixed statements, restated outside the namespace with full names; each must be closed by the theorem as is.
example : ∀ p : unitInterval, (p : ℝ) < 1 → TextbookPercolation.θ 1 p = 0 :=
  TextbookPercolation.theta_dim_one_eq_zero
example : TextbookPercolation.pc 1 = 1 := TextbookPercolation.pc_dim_one
example : ¬ ∃ h : TextbookPercolation.pc 1 ∈ Set.Icc (0 : ℝ) 1, TextbookPercolation.θ 1 ⟨TextbookPercolation.pc 1, h⟩ = 0 :=
  TextbookPercolation.statement_body_false_at_dim_one
-- The last one is the body of `Statement` at d = 1: `Statement` with `1 ≤ d` in place of `2 ≤ d` would be false.
example : ¬ ∀ d : ℕ, 1 ≤ d → ∃ h : TextbookPercolation.pc d ∈ Set.Icc (0 : ℝ) 1,
    TextbookPercolation.θ d ⟨TextbookPercolation.pc d, h⟩ = 0 :=
  fun H => TextbookPercolation.statement_body_false_at_dim_one (H 1 le_rfl)
