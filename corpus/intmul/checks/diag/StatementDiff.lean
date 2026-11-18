import IntegerMultBounds.MathlibTM2.Theorem
import Lean

/-! Diagnostic (2026-11-18): the proposition typed in a fresh file against the type of the release's theorem.
The intake's F1 report said `equal: false, defeq: true` for the two. Where do they differ as expressions? -/
namespace IntMulDiag
open IntegerMultBounds.MathlibTM2
def canon : Prop := MulInTime (4222422970 / 2 ^ 46 : ℝ)
end IntMulDiag

open Lean Meta in
#eval show MetaM Unit from do
  let env ← getEnv
  let some c := env.find? `IntMulDiag.canon | throwError "no canon"
  let some t := env.find? `IntegerMultBounds.MathlibTM2.mulInTime | throwError "no theorem"
  let a := c.value!
  let b := t.type
  IO.println s!"DIAG equal={a == b} eqv={a.eqv b} defeq={← isDefEq a b}"
  let fa ← withOptions (fun o => o.setBool `pp.all true) (ppExpr a)
  let fb ← withOptions (fun o => o.setBool `pp.all true) (ppExpr b)
  IO.println s!"CANON {fa}"
  IO.println s!"CLAIM {fb}"
  IO.println s!"CANON-RAW {a}"
  IO.println s!"CLAIM-RAW {b}"
