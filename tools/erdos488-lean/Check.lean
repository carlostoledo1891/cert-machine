import Plumb.P1
import Lean
open Lean Meta

/-! P1, the syntactic half: DeepMind's statement and the adapter's restated `proposition`, compared as expressions. -/

def emit (j : Json) : IO Unit := do
  let p := (← IO.getEnv "P488_OUT").getD "/dev/stdout"
  IO.FS.withFile p .append fun h => h.putStrLn j.compress

#eval show MetaM Unit from do
  let env ← getEnv
  let some fc := env.find? `Erdos488.erdos_488 | throwError "no Erdos488.erdos_488"
  let some ad := env.find? `Erdos488ExactAdapter.proposition | throwError "no Erdos488ExactAdapter.proposition"
  let some p1 := env.find? `Plumb.p1 | throwError "no Plumb.p1"
  let some adv := ad.value? | throwError "proposition has no value"
  let fcT := fc.type
  let defeq ← isDefEq fcT adv
  emit <| Json.mkObj [
    ("fcStatement", Json.str s!"{← ppExpr fcT}"),
    ("adapterProposition", Json.str s!"{← ppExpr adv}"),
    ("equal", Json.bool (fcT.equal adv)),
    ("eqv", Json.bool (fcT.eqv adv)),
    ("defeq", Json.bool defeq),
    ("p1IsNotOfFC", Json.bool (p1.type.eqv (mkNot fcT))),
    ("fcLevelParams", toJson fc.levelParams.toArray), ("adapterLevelParams", toJson ad.levelParams.toArray)]
