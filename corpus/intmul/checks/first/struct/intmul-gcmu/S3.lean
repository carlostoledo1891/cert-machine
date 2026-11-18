import SubNLogN.Challenge
import Lean

/-! Structural comparison of planted statement S3 (same) with the canonical proposition. -/
namespace SubNLogN.Challenge.IntakeMut.S3
open Computability
theorem s : ∃ M : Turing.TM2ComputableInTime encodeNatPair encodingNatBool.encode
      (fun p : ℕ × ℕ => p.1 * p.2),
    (∀ k, Finite (M.tm.Γ k)) ∧
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1) := by
  sorry
theorem t : SubNLogN.Challenge.IntMulSubNLogN := by
  sorry
end SubNLogN.Challenge.IntakeMut.S3

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `SubNLogN.Challenge.IntakeMut.S3.s | throwError "no s"
  let some t := env.find? `SubNLogN.Challenge.IntakeMut.S3.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT S3 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
