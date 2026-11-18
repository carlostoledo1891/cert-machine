import IntegerMultBounds.MathlibTM2.Statement
import Lean

/-! Structural comparison of planted statement S1 (same) with the canonical proposition. -/
namespace IntegerMultBounds.MathlibTM2.IntakeMut.S1
open Turing Computability Asymptotics Filter
theorem s : ∃ T : TM2ComputableInTime pairEnc encodingNatBool.encode (fun q : ℕ × ℕ => q.1 * q.2),
    (fun m : ℕ => (T.time m : ℝ)) =O[atTop] fun m : ℕ => (m : ℝ) * Real.log m ^ (1 - (4222422970 / 2 ^ 46 : ℝ)) := by
  sorry
theorem t : IntegerMultBounds.MathlibTM2.MulInTime (4222422970 / 2 ^ 46 : ℝ) := by
  sorry
end IntegerMultBounds.MathlibTM2.IntakeMut.S1

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some s := env.find? `IntegerMultBounds.MathlibTM2.IntakeMut.S1.s | throwError "no s"
  let some t := env.find? `IntegerMultBounds.MathlibTM2.IntakeMut.S1.t | throwError "no t"
  let unfolded := (← unfoldDefinition? t.type).getD t.type
  IO.println s!"STRUCT S1 folded={s.type.eqv t.type} unfolded={s.type.eqv unfolded}"
