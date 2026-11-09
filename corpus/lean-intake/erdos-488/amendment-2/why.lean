import FormalConjectures.ErdosProblems.«488»
/-! Why W08 is the same statement: 0 is not in B, and the kernel sees it by reduction (rfl, no tactic). -/
example (A : Finset ℕ) (m : ℕ) :
    (Finset.Icc 0 m).filter (· ∈ {n ≥ 1 | ∃ a ∈ A, a ∣ n}) = (Finset.Icc 1 m).filter (· ∈ {n ≥ 1 | ∃ a ∈ A, a ∣ n}) := rfl
/-! And the contrast: dropping 1 (which is not in B only BECAUSE 1 ∉ A, a hypothesis) is not definitional. -/
example (A : Finset ℕ) (m : ℕ) :
    (Finset.Icc 1 m).filter (· ∈ {n ≥ 1 | ∃ a ∈ A, a ∣ n}) = (Finset.Icc 2 m).filter (· ∈ {n ≥ 1 | ∃ a ∈ A, a ∣ n}) := rfl
