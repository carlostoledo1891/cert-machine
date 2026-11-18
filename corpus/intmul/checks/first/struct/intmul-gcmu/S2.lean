import SubNLogN.Challenge
import Lean

/-! Structural comparison of planted statement S2 (same) with the canonical proposition. -/
namespace SubNLogN.Challenge.IntakeMut.S2
open Computability
theorem s : IntMulSubNLogN := by
  sorry
theorem t : SubNLogN.Challenge.IntMulSubNLogN := by
  sorry
end SubNLogN.Challenge.IntakeMut.S2

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `SubNLogN.Challenge.IntakeMut.S2.s | throwError "no s"
  let some t := env.find? `SubNLogN.Challenge.IntakeMut.S2.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT S2 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
