/-
  zq-lean-audit.lean — cert-machine's own axiom audit for Track A lane 4 on the claim "ℤ is Diophantine in ℚ"
  (Elliot Glazer with AI agents, 2026-11-05; github.com/elliotglazer/diophantine-z-q @ 97cec7fd, lean/, the 48
  modules of integration 31).

  THE THEOREM IS UNDECIDED HERE. The main Lean target (lean/Frozen/BoundedIntegerPolynomial.lean) is `sorry`; this
  file lists the declarations of the helper library and the axioms each one reaches, and decides nothing else.

  For EVERY constant whose defining module (the environment's constant-to-module map; never a name prefix) is the
  root module or one under it (`ZInQ`, `ZInQ.*` by default; ZQ_AUDIT_ROOT selects another), one JSON line with its
  name, module, kind, flags and its axioms computed TWO ways:
    ours  a fresh traversal of the dependency graph from every constant's own type, value, constructors and
          recursor rules, through Mathlib and core, read from the private view of the environment, ignoring
          every precomputed table: a depth-first order, then a bitmask fixpoint (exact on the cycles of inductive
          families);
    lean  `Lean.collectAxioms`, which in v4.35.0 takes an imported constant's axioms from the table its `.olean`
          stored at export time (`exportedAxiomsExt`, Lean/Util/CollectAxioms.lean) and walks bodies only for
          constants without an entry.
  Written for this lane from the Lean v4.35.0 sources; the claimant's lean/Checks/Axioms.lean was not opened.
  The pod script swaps the single line `import ZInQ` below for the frozen-target and toy runs.

  usage (in the claimant's lean/ directory, after `lake build ZInQ`):
    ZQ_AUDIT_OUT=/path/audit.jsonl [ZQ_AUDIT_ROOT=ZInQ] [ZQ_AUDIT_TYPECONSTS=1] lake env lean zq-lean-audit.lean
-/
import ZInQ
import Lean

open Lean

namespace ZqLane4Audit

def allowed : List Name := [``propext, ``Quot.sound, ``Classical.choice]

def kindOf : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"

/-- every constant a constant mentions: type, value, constructors, recursor rules -/
def depsOf : ConstantInfo → Array Name
  | .axiomInfo v => v.type.getUsedConstants
  | .defnInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .thmInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .opaqueInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .quotInfo v => v.type.getUsedConstants
  | .inductInfo v => v.type.getUsedConstants ++ v.ctors.toArray
  | .ctorInfo v => v.type.getUsedConstants
  | .recInfo v => v.rules.foldl (fun acc r => acc ++ r.rhs.getUsedConstants) v.type.getUsedConstants

def isPartialDef : ConstantInfo → Bool
  | .defnInfo v => v.safety == .partial
  | _ => false

def namesJson (xs : Array Name) : Json := Json.arr (xs.map fun n => Json.str n.toString)

def sortNames (xs : Array Name) : Array Name := xs.qsort fun a b => a.toString < b.toString

def run : CoreM Unit := do
  let some out ← IO.getEnv "ZQ_AUDIT_OUT" | throwError "zq-lean-audit: set ZQ_AUDIT_OUT"
  let root := ((← IO.getEnv "ZQ_AUDIT_ROOT").getD "ZInQ").toName
  let typeConsts := (← IO.getEnv "ZQ_AUDIT_TYPECONSTS") == some "1"
  let env := (← getEnv).setExporting false
  let mods := env.header.moduleNames
  let isOurs (i : Nat) : Bool := root.isPrefixOf mods[i]!
  let modOf (n : Name) : Name := match env.getModuleIdxFor? n with
    | some i => mods[i.toNat]!
    | none => `«(this file)»
  let h ← IO.FS.Handle.mk out .write
  let line (j : Json) : IO Unit := h.putStrLn j.compress
  -- 1. our modules, and what each module's data carries
  let mut fromData : Array Name := #[]
  let mut extra : Array Name := #[]
  for i in [0:mods.size] do
    if isOurs i then
      let d := env.header.moduleData[i]!
      fromData := fromData ++ d.constNames
      extra := extra ++ d.extraConstNames
      line <| Json.mkObj [("type", "module"), ("module", mods[i]!.toString), ("isModule", d.isModule),
        ("constNames", d.constNames.size), ("extraConstNames", d.extraConstNames.size),
        ("imports", Json.arr (d.imports.map fun im => Json.str im.module.toString))]
  -- 2. the same set by the constant-to-module map
  let byMap : Array Name := env.const2ModIdx.fold (init := #[]) fun acc n i =>
    if isOurs i.toNat then acc.push n else acc
  let roots := sortNames (byMap.filter fun n => (env.find? n).isSome)
  let noInfo := sortNames (byMap.filter fun n => (env.find? n).isNone)
  -- 3. our traversal: a depth-first finishing order over the closure, then a bitmask fixpoint
  let mut deps : Std.HashMap Name (Array Name) := {}
  let mut order : Array Name := #[]
  let mut missing : Array Name := #[]
  let mut visited : Std.HashSet Name := {}
  let mut stack : Array (Name × Bool) := roots.reverse.map fun n => (n, false)
  while !stack.isEmpty do
    let (n, done) := stack.back!
    stack := stack.pop
    if done then
      order := order.push n
      continue
    if visited.contains n then continue
    visited := visited.insert n
    match env.find? n with
    | none =>
      missing := missing.push n
      deps := deps.insert n #[]
      order := order.push n
    | some ci =>
      let ds := depsOf ci
      deps := deps.insert n ds
      stack := stack.push (n, true)
      for d in ds do
        if !visited.contains d then stack := stack.push (d, false)
  let mut axIdx : Std.HashMap Name Nat := {}
  let mut axNames : Array Name := #[]
  for n in order do
    if let some (.axiomInfo _) := env.find? n then
      axIdx := axIdx.insert n axNames.size
      axNames := axNames.push n
  let mut mask : Std.HashMap Name Nat := {}
  let mut changed := true
  let mut passes : Nat := 0
  while changed do
    changed := false
    passes := passes + 1
    for n in order do
      let own := match axIdx[n]? with
        | some i => 1 <<< i
        | none => 0
      let m := (deps.getD n #[]).foldl (fun acc d => acc ||| mask.getD d 0) own
      if m != mask.getD n 0 then
        mask := mask.insert n m
        changed := true
  let decode (m : Nat) : Array Name := sortNames <| (List.range axNames.size).toArray.filterMap fun i =>
    if (m >>> i) % 2 == 1 then some axNames[i]! else none
  -- 4. one line per declaration
  let mut kinds : Std.HashMap String Nat := {}
  let mut perModule : Std.HashMap String Nat := {}
  let mut unionOurs : Std.HashSet Name := {}
  let mut unionLean : Std.HashSet Name := {}
  let mut nonstandard : Array Json := #[]
  let mut disagree : Array Json := #[]
  for n in roots do
    let some ci := env.find? n | continue
    let ours := decode (mask.getD n 0)
    let leanAx := sortNames (← collectAxioms n)
    for a in ours do unionOurs := unionOurs.insert a
    for a in leanAx do unionLean := unionLean.insert a
    let k := kindOf ci
    kinds := kinds.insert k (kinds.getD k 0 + 1)
    let m := (modOf n).toString
    perModule := perModule.insert m (perModule.getD m 0 + 1)
    let bad := sortNames (Std.HashSet.ofList ((ours ++ leanAx).filter fun a => !allowed.contains a).toList).toArray
    if !bad.isEmpty then nonstandard := nonstandard.push (Json.mkObj [("name", n.toString), ("axioms", namesJson bad)])
    if ours != leanAx then disagree := disagree.push (Json.mkObj [("name", n.toString), ("ours", namesJson ours), ("lean", namesJson leanAx)])
    let flags := #[
        (isPrivateName n, "private"), (n.isInternal, "internal"), (isAuxRecursor env n, "auxRecursor"),
        (isNoConfusion env n, "noConfusion"), (Meta.isMatcherCore env n, "matcher"),
        (Meta.isInstanceCore env n, "instance"), (ci.isUnsafe, "unsafe"), (isPartialDef ci, "partial"),
        ((Compiler.getImplementedBy? env n).isSome, "implementedBy"), (isExtern env n, "extern")
      ].filterMap fun (b, s) => if b then some (Json.str s) else none
    let base := [("type", Json.str "decl"), ("name", Json.str n.toString), ("module", Json.str m), ("kind", Json.str k),
      ("ours", namesJson ours), ("lean", namesJson leanAx), ("flags", Json.arr flags)]
    let tc := if typeConsts then
        [("typeConsts", Json.arr ((sortNames ci.type.getUsedConstants).map fun c =>
          Json.arr #[Json.str c.toString, Json.str (modOf c).toString]))]
      else []
    line (Json.mkObj (base ++ tc))
  for n in noInfo do
    line <| Json.mkObj [("type", "extraName"), ("name", n.toString), ("module", (modOf n).toString)]
  let sortedPairs (m : Std.HashMap String Nat) : Json :=
    Json.mkObj ((m.toList.toArray.qsort fun a b => a.1 < b.1).toList.map fun (k, v) => (k, toJson v))
  line <| Json.mkObj [
    ("type", "summary"), ("root", root.toString), ("lean", Lean.versionString), ("githash", Lean.githash),
    ("skipKernelTCDefault", debug.skipKernelTC.defValue),
    ("modules", toJson ((List.range mods.size).filter isOurs).length),
    ("declarations", roots.size), ("fromModuleData", fromData.size), ("extraConstNames", extra.size),
    ("mapEntriesWithoutDeclaration", noInfo.size), ("kinds", sortedPairs kinds), ("perModule", sortedPairs perModule),
    ("closure", order.size), ("fixpointPasses", toJson passes), ("missingReferences", namesJson (sortNames missing)),
    ("axiomsInClosure", namesJson (sortNames axNames)),
    ("unionOurs", namesJson (sortNames unionOurs.toArray)), ("unionLean", namesJson (sortNames unionLean.toArray)),
    ("nonstandard", Json.arr nonstandard), ("traversalDisagreements", Json.arr disagree)]
  h.flush

end ZqLane4Audit

#eval ZqLane4Audit.run
