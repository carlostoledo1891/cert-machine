import SubNLogN.Challenge
import Lean

/-! Structural comparison of planted statement S1 (same) with the canonical proposition. -/
namespace SubNLogN.Challenge.IntakeMut.S1
open Computability
theorem s : ∃ T : Turing.TM2ComputableInTime encNatPair.encode encodingNatBool.encode
      (fun q : ℕ × ℕ => q.1 * q.2),
    (∀ j, Finite (T.tm.Γ j)) ∧
    ∃ c n₀ : ℕ, 0 < c ∧ ∀ n ≥ n₀,
      (T.time n) ^ (2 ^ 46) ≤ (c * n) ^ (2 ^ 46) * (Nat.log2 n) ^ (2 ^ 46 - 1) := by
  sorry
theorem t : SubNLogN.Challenge.IntMulSubNLogN := by
  sorry
end SubNLogN.Challenge.IntakeMut.S1

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `SubNLogN.Challenge.IntakeMut.S1.s | throwError "no s"
  let some t := env.find? `SubNLogN.Challenge.IntakeMut.S1.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT S1 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
