import SubNLogN.Challenge
import Lean

/-! Structural comparison of planted statement C1 (changed) with the canonical proposition. -/
namespace SubNLogN.Challenge.IntakeMut.C1
open Computability
theorem s : ∃ M : Turing.TM2ComputableInTime encNatPair.encode encodingNatBool.encode
      (fun p : ℕ × ℕ => p.1 * p.2),
    (∀ k, Finite (M.tm.Γ k)) ∧
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (M.time L) ^ (2 ^ 45) ≤ (C * L) ^ (2 ^ 45) * (Nat.log2 L) ^ (2 ^ 45 - 1) := by
  sorry
theorem t : SubNLogN.Challenge.IntMulSubNLogN := by
  sorry
end SubNLogN.Challenge.IntakeMut.C1

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `SubNLogN.Challenge.IntakeMut.C1.s | throwError "no s"
  let some t := env.find? `SubNLogN.Challenge.IntakeMut.C1.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT C1 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
