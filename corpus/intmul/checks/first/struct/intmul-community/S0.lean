import IntegerMultBounds.MathlibTM2.Statement
import Lean

/-! Structural comparison of planted statement S0 (same) with the canonical proposition. -/
namespace IntegerMultBounds.MathlibTM2.IntakeMut.S0
open Turing Computability Asymptotics Filter
theorem s : ∃ M : TM2ComputableInTime pairEnc encodingNatBool.encode (fun p : ℕ × ℕ => p.1 * p.2),
    (fun n : ℕ => (M.time n : ℝ)) =O[atTop] fun n : ℕ => (n : ℝ) * Real.log n ^ (1 - (4222422970 / 2 ^ 46 : ℝ)) := by
  sorry
theorem t : IntegerMultBounds.MathlibTM2.MulInTime (4222422970 / 2 ^ 46 : ℝ) := by
  sorry
end IntegerMultBounds.MathlibTM2.IntakeMut.S0

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `IntegerMultBounds.MathlibTM2.IntakeMut.S0.s | throwError "no s"
  let some t := env.find? `IntegerMultBounds.MathlibTM2.IntakeMut.S0.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT S0 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
