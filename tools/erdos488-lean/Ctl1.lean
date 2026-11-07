import FormalConjectures.ErdosProblems.«488»
import Plumb.Erdos488
import FormalConjecturesUtil.Deprecated.Answer
/-! Control 1 (must FAIL): the statement as it read before 2026-10-14, `answer(sorry) ↔ …`. -/
namespace PlumbCtl1
theorem old488 : answer(sorry) ↔ ∀ (A : Finset ℕ), A.Nonempty →
    0 ∉ A → 1 ∉ A →
    letI B := {n ≥ 1 | ∃ a ∈ A, a ∣ n}
    ∀ᵉ (n : ℕ) (m > n), A.max ≤ n →
      ((Finset.Icc 1 m).filter (· ∈ B)).card / (m : ℚ) <
        2 * ((Finset.Icc 1 n).filter (· ∈ B)).card / n := by
  sorry
theorem c : ¬ (type_of% @old488) := Erdos488ExactAdapter.refutation
end PlumbCtl1
