import FormalConjectures.ErdosProblems.«488»
import Plumb.Erdos488
/-! Control 3 (must FAIL): `m > n` changed to `m ≥ n`. -/
namespace PlumbCtl3
theorem s : ∀ (A : Finset ℕ), A.Nonempty →
    0 ∉ A → 1 ∉ A →
    letI B := {n ≥ 1 | ∃ a ∈ A, a ∣ n}
    ∀ᵉ (n : ℕ) (m ≥ n), A.max ≤ n →
      ((Finset.Icc 1 m).filter (· ∈ B)).card / (m : ℚ) <
        2 * ((Finset.Icc 1 n).filter (· ∈ B)).card / n := by
  sorry
theorem c : ¬ (type_of% @s) := Erdos488ExactAdapter.refutation
end PlumbCtl3
