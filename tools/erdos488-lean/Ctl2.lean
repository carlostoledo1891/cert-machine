import FormalConjectures.ErdosProblems.«488»
import Plumb.Erdos488
/-! Control 2 (must FAIL): the constant 2 changed to 3. -/
namespace PlumbCtl2
theorem s : ∀ (A : Finset ℕ), A.Nonempty →
    0 ∉ A → 1 ∉ A →
    letI B := {n ≥ 1 | ∃ a ∈ A, a ∣ n}
    ∀ᵉ (n : ℕ) (m > n), A.max ≤ n →
      ((Finset.Icc 1 m).filter (· ∈ B)).card / (m : ℚ) <
        3 * ((Finset.Icc 1 n).filter (· ∈ B)).card / n := by
  sorry
theorem c : ¬ (type_of% @s) := Erdos488ExactAdapter.refutation
end PlumbCtl2
