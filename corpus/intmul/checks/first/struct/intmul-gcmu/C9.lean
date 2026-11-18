import SubNLogN.Challenge
import Lean

/-! Structural comparison of planted statement C9 (equivalent) with the canonical proposition. -/
namespace SubNLogN.Challenge.IntakeMut.C9
open Computability
theorem s : ∃ M : Turing.TM2ComputableInTime encNatPair.encode encodingNatBool.encode
      (fun p : ℕ × ℕ => p.2 * p.1),
    (∀ k, Finite (M.tm.Γ k)) ∧
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1) := by
  sorry
theorem t : SubNLogN.Challenge.IntMulSubNLogN := by
  sorry
end SubNLogN.Challenge.IntakeMut.C9

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `SubNLogN.Challenge.IntakeMut.C9.s | throwError "no s"
  let some t := env.find? `SubNLogN.Challenge.IntakeMut.C9.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT C9 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
