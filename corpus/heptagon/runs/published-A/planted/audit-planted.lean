/-
  checks/audit.lean — the axiom audit of the six final theorems (Lean v4.34.1).

  For EACH target, two computations of what it rests on:
    ours  a fresh traversal of the dependency graph from the target (every constant's type, value, constructors and
          recursor rules), read from the private view of the environment, ignoring every precomputed table; it yields
          the target's transitive constants and, among them, the axioms;
    lean  `Lean.collectAxioms`.
  The audit REFUSES (the JSON is written first, then `lean` exits 1) when, for any target:
    - the target is absent or not a theorem;
    - sorryAx, Lean.ofReduceBool, Lean.ofReduceNat or Lean.trustCompiler is among its transitive constants;
    - an axiom other than propext, Classical.choice, Quot.sound is among them (in v4.34.1 `native_decide` no longer
      goes through Lean.ofReduceBool: it adds an auxiliary axiom `<decl>._native.native_decide.ax_…`, refused here);
    - a constant of ours (defining module under `HeptagonRamsey`, or this file) among them carries @[implemented_by]
      or @[extern];
    - a referenced constant is missing from the environment;
    - the two computations of the axioms disagree.
  Information only (never a refusal): the closure's size, its modules by top-level prefix, and how many constants
  outside our modules carry implemented_by / extern / unsafe / partial (core's Nat and Array primitives do; the kernel
  never runs compiled code).

  usage (in openai/math's lean/ directory, after `lake build HeptagonRamsey`):
    AUDIT_OUT=/path/audit.json [AUDIT_TARGETS=a,b,...] lake env lean /path/to/checks/audit.lean
  The planted-control run (checks/audit-planted.sh) inserts deliberately bad declarations above the last line of a copy
  of this file and names them in AUDIT_TARGETS; each must be refused, and the one clean control must pass.
-/
import HeptagonRamsey.Heptagon.Transport
import HeptagonRamsey.Generic.Seven
import Lean

open Lean

namespace HeptagonRamseyAudit

def allowed : List Name := [``propext, ``Quot.sound, ``Classical.choice]

def forbidden : List Name := [``sorryAx, ``Lean.ofReduceBool, ``Lean.ofReduceNat, ``Lean.trustCompiler]

def defaultTargets : List Name :=
  [``HeptagonRamsey.Heptagon.not_fieldCriterion, ``HeptagonRamsey.Heptagon.not_ramsey,
   ``HeptagonRamsey.Heptagon.graham_false, ``HeptagonRamsey.Heptagon.graham_false',
   ``HeptagonRamsey.Generic.generic_seven_not_ramsey, ``HeptagonRamsey.Generic.seven_circle_configuration]

def kindOf : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"

/-- every constant a constant mentions: type, value, constructors, recursor rules (as in zq-lean-audit.lean) -/
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

def sortNames (xs : Array Name) : Array Name := xs.qsort fun a b => a.toString < b.toString

def namesJson (xs : Array Name) : Json := Json.arr ((sortNames xs).map fun n => Json.str n.toString)

/-- the transitive constants of `root` (root included) and the referenced names absent from the environment -/
def closure (env : Environment) (root : Name) : Array Name × Array Name := Id.run do
  let mut seen : Std.HashSet Name := {}
  let mut stack : Array Name := #[root]
  let mut order : Array Name := #[]
  let mut missing : Array Name := #[]
  while !stack.isEmpty do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    order := order.push n
    match env.find? n with
    | none => missing := missing.push n
    | some ci =>
      for d in depsOf ci do
        if !seen.contains d then stack := stack.push d
  return (order, missing)

def run : CoreM Unit := do
  let some out ← IO.getEnv "AUDIT_OUT" | throwError "audit: set AUDIT_OUT"
  let targets : List Name ← match ← IO.getEnv "AUDIT_TARGETS" with
    | some s => pure ((s.splitOn ",").filter (· ≠ "") |>.map String.toName)
    | none => pure defaultTargets
  let env := (← getEnv).setExporting false
  let mods := env.header.moduleNames
  let modOf (n : Name) : Option Name := (env.getModuleIdxFor? n).map fun i => mods[i.toNat]!
  let isOurs (n : Name) : Bool := match modOf n with
    | some m => (`HeptagonRamsey).isPrefixOf m
    | none => true  -- defined in this file (only the planted-control run has such targets)
  let mut results : Array Json := #[]
  let mut allPass := true
  for t in targets do
    let mut reasons : Array String := #[]
    match env.find? t with
    | none =>
      reasons := reasons.push "target absent from the environment"
      results := results.push (Json.mkObj [("target", t.toString), ("verdict", "REFUSED"),
        ("reasons", toJson reasons)])
      allPass := false
    | some tci =>
      if kindOf tci != "theorem" then reasons := reasons.push s!"target is a {kindOf tci}, not a theorem"
      let typeStr := toString (← (Meta.ppExpr tci.type).run')
      let (cl, missing) := closure env t
      let mut axs : Array Name := #[]
      let mut forb : Array Name := #[]
      let mut oursFlagged : Array Json := #[]
      let mut oursInClosure : Array Name := #[]
      let mut extImpl : Nat := 0
      let mut extExtern : Nat := 0
      let mut extUnsafe : Nat := 0
      let mut extPartial : Nat := 0
      let mut prefixes : Std.HashMap String Nat := {}
      let mut modsSeen : Std.HashSet Name := {}
      for n in cl do
        if forbidden.contains n then forb := forb.push n
        let some ci := env.find? n | continue
        if let .axiomInfo _ := ci then axs := axs.push n
        let impl := (Compiler.getImplementedBy? env n).isSome
        let ext := isExtern env n
        match modOf n with
        | some m =>
          modsSeen := modsSeen.insert m
          let p := m.getRoot.toString
          prefixes := prefixes.insert p (prefixes.getD p 0 + 1)
        | none => prefixes := prefixes.insert "(this file)" (prefixes.getD "(this file)" 0 + 1)
        if isOurs n then
          oursInClosure := oursInClosure.push n
          if impl || ext then
            oursFlagged := oursFlagged.push (Json.mkObj [("name", n.toString),
              ("implementedBy", impl), ("extern", ext)])
        else
          if impl then extImpl := extImpl + 1
          if ext then extExtern := extExtern + 1
          if ci.isUnsafe then extUnsafe := extUnsafe + 1
          if isPartialDef ci then extPartial := extPartial + 1
      let leanAx ← collectAxioms t
      let oursAx := sortNames axs
      let leanAxS := sortNames leanAx
      let nonstandard := sortNames ((Std.HashSet.ofList (oursAx ++ leanAxS).toList).toArray.filter fun a => !allowed.contains a)
      if !forb.isEmpty then reasons := reasons.push s!"forbidden constants in the closure: {sortNames forb}"
      if !nonstandard.isEmpty then
        reasons := reasons.push s!"axioms outside propext/Classical.choice/Quot.sound: {sortNames nonstandard}"
      if !oursFlagged.isEmpty then reasons := reasons.push "a constant of ours carries implemented_by or extern"
      if !missing.isEmpty then reasons := reasons.push s!"missing references: {sortNames missing}"
      if oursAx != leanAxS then reasons := reasons.push s!"the two computations disagree: ours {oursAx}, lean {leanAxS}"
      let verdict := if reasons.isEmpty then "PASS" else "REFUSED"
      if !reasons.isEmpty then allPass := false
      let sortedPairs (m : Std.HashMap String Nat) : Json :=
        Json.mkObj ((m.toList.toArray.qsort fun a b => a.1 < b.1).toList.map fun (k, v) => (k, toJson v))
      results := results.push (Json.mkObj [
        ("target", t.toString), ("verdict", verdict), ("reasons", toJson reasons),
        ("kind", kindOf tci), ("type", typeStr), ("module", toJson ((modOf t).map (·.toString))),
        ("closureConstants", cl.size), ("closureModules", modsSeen.size), ("closureByPrefix", sortedPairs prefixes),
        ("axiomsOurs", namesJson oursAx), ("axiomsLean", namesJson leanAxS),
        ("forbiddenFound", namesJson forb), ("missingReferences", namesJson missing),
        ("oursInClosure", oursInClosure.size), ("oursFlagged", Json.arr oursFlagged),
        ("outsideOurs", Json.mkObj [("implementedBy", extImpl), ("extern", extExtern), ("unsafe", extUnsafe),
          ("partial", extPartial)])])
  let summary := Json.mkObj [
    ("audit", "checks/audit.lean"), ("lean", Lean.versionString), ("githash", Lean.githash),
    ("allowedAxioms", namesJson allowed.toArray), ("forbidden", namesJson forbidden.toArray),
    ("targets", Json.arr results), ("verdict", if allPass then "PASS" else "REFUSED")]
  IO.FS.writeFile out (summary.pretty ++ "\n")
  if !allPass then throwError "audit: REFUSED (see {out})"

end HeptagonRamseyAudit


-- PLANTED (checks/audit-planted.sh): each of these targets must be REFUSED by the audit, except the clean control
theorem planted_sorry : (1 : Nat) = 2 := sorry
axiom plantedAxiom : (1 : Nat) = 2
theorem planted_axiom : (1 : Nat) = 2 := plantedAxiom
theorem planted_native : (2 : Nat) + 2 = 4 := by native_decide
theorem planted_trust : True := Lean.trustCompiler
def plantedImplReal (n : Nat) : Nat := n + 1
@[implemented_by plantedImplReal] def plantedImpl (n : Nat) : Nat := n
theorem planted_implby : plantedImpl 0 = 0 := rfl
@[extern "planted_extern_symbol"] def plantedExt (n : Nat) : Nat := n
theorem planted_extern : plantedExt 0 = 0 := rfl
def planted_def : Nat := 4
theorem planted_clean : (2 : Nat) + 2 = 4 := rfl

#eval HeptagonRamseyAudit.run
