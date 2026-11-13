import Mathlib

/-!
# DepWalk — the dependency walk of the sealed rules (K2 "transport only", KR2)

`#depwalk thm f₁ f₂ … [proofsOf S₁ S₂ …]`

collects every constant that the declaration `thm` reaches transitively, through the TYPE and the VALUE of every
constant on the way (definitions, theorems, opaque constants; for an inductive type its constructors; for a
constructor or a recursor its type and its inductive type), and reports

* how many constants were reached, by kind;
* how many reached constants the environment presents as AXIOMS other than `propext`, `Classical.choice`,
  `Quot.sound` (the walk cannot look inside an axiom; a theorem whose proof term were hidden from this file would
  show up here, and so does `sorryAx`). In a plain (non-`module`) file such as this one, Mathlib's proof terms
  are visible: the self-test at the end walks into them;
* every reached constant declared in a module whose name starts with the prefix (default `Percolation`; change it
  with `#depwalk (prefix := Foo) thm …`), with its kind and its module;
* the axioms reached;
* `FLAGGED` if a forbidden name `fᵢ` is reached (with one chain of references from `thm` to it), or if a reached
  constant other than `thm` has for TYPE one of the statements `Sⱼ` (the constant `Sⱼ` itself, or the body of
  its definition) — "any other proof of the statement"; `CLEAN` otherwise.

`#depwalk_expect CLEAN thm …` and `#depwalk_expect FLAGGED thm …` do the same and raise an ERROR when the verdict is
not the expected one, so that a file of walks fails to compile when a walk goes the wrong way.

Reaching a statement `Sⱼ` is not flagged (an implication `Lab → X` must mention `Lab`); reaching a PROOF of it is.
The walk is syntactic: it follows names occurring in terms. It reads the environment and nothing else.
-/

open Lean Elab Command

namespace KN3DepWalk

/-- The kind of a constant, as a word. -/
def kindOf : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"

/-- The names a constant refers to directly: through its type, its value when it has one, and (so that nothing is
hidden behind an inductive type) its constructors / its inductive type. -/
def directRefs (ci : ConstantInfo) : Array Name :=
  let t := ci.type.getUsedConstants
  match ci with
  | .defnInfo v => t ++ v.value.getUsedConstants
  | .thmInfo v => t ++ v.value.getUsedConstants
  | .opaqueInfo v => t ++ v.value.getUsedConstants
  | .inductInfo v => t ++ v.ctors.toArray
  | .ctorInfo v => t.push v.induct
  | .recInfo v => t ++ v.all.toArray
  | .axiomInfo _ => t
  | .quotInfo _ => t

/-- The result of a walk. -/
structure Walk where
  /-- every reached name, with the name through which it was first reached (the root points to itself) -/
  parent : Std.HashMap Name Name := {}
  /-- reached names that are not in the environment (should be empty) -/
  missing : Array Name := #[]

/-- Walk from `root` (depth-first, iterative). -/
def walk (env : Environment) (root : Name) : Walk := Id.run do
  let mut parent : Std.HashMap Name Name := {}
  let mut missing : Array Name := #[]
  let mut stack : Array (Name × Name) := #[(root, root)]
  while h : 0 < stack.size do
    let (n, from_) := stack[stack.size - 1]
    stack := stack.pop
    if parent.contains n then continue
    parent := parent.insert n from_
    match env.find? n with
    | none => missing := missing.push n
    | some ci =>
      for c in directRefs ci do
        unless parent.contains c do
          stack := stack.push (c, n)
  return { parent, missing }

/-- One chain of references `root → … → n`. -/
def chain (w : Walk) (n : Name) : List Name := Id.run do
  let mut out : List Name := [n]
  let mut cur := n
  let mut fuel := w.parent.size + 1
  while fuel > 0 do
    fuel := fuel - 1
    match w.parent[cur]? with
    | none => break
    | some p =>
      if p == cur then break
      out := p :: out
      cur := p
  return out

/-- The module in which a constant is declared (`none`: the current file). -/
def moduleOf (env : Environment) (n : Name) : Option Name :=
  (env.getModuleIdxFor? n).map fun i => env.header.moduleNames[i.toNat]!

/-- Does the constant `ci` have for type the statement `s` (the constant itself, or the body of its definition)? -/
def provesStatement (env : Environment) (ci : ConstantInfo) (s : Name) : Bool :=
  match ci.type with
  | .const c _ => c == s
  | t =>
    match env.find? s with
    | some (.defnInfo v) => t == v.value
    | _ => false

/-- Run the walk and build the report. Returns the verdict (`true` = FLAGGED) and the text. -/
def report (env : Environment) (root : Name) (pfx : String) (forbidden statements : Array Name) :
    Bool × String := Id.run do
  let w := walk env root
  let names := w.parent.keys.toArray.qsort (fun a b => a.toString < b.toString)
  let mut kinds : Std.HashMap String Nat := {}
  let mut noProof : Nat := 0
  let mut inPrefix : Array String := #[]
  let mut prefixTheorems : Nat := 0
  let mut axioms : Array Name := #[]
  let mut flags : Array String := #[]
  for n in names do
    match env.find? n with
    | none => pure ()
    | some ci =>
      let k := kindOf ci
      kinds := kinds.insert k (kinds.getD k 0 + 1)
      if k == "axiom" then axioms := axioms.push n
      let modName := moduleOf env n
      let modStr := match modName with
        | some m => m.toString
        | none => "(this file)"
      if modStr.startsWith pfx then
        inPrefix := inPrefix.push s!"    {n}  ({k})  [{modStr}]"
        if k == "theorem" || k == "axiom" || k == "opaque" then prefixTheorems := prefixTheorems + 1
      if n != root then
        for s in statements do
          if provesStatement env ci s then
            flags := flags.push s!"    {n} has for type the statement {s}: {chain w n}"
  -- constants the environment presents as axioms, other than the three standard ones
  for a in axioms do
    unless a == ``propext || a == ``Classical.choice || a == ``Quot.sound do
      noProof := noProof + 1
  for f in forbidden do
    if w.parent.contains f then
      flags := flags.push s!"    forbidden {f} is reached: {chain w f}"
  let flagged := !flags.isEmpty
  let kindLine := ", ".intercalate
    ((kinds.toArray.qsort (fun a b => a.1 < b.1)).toList.map fun (k, c) => s!"{c} {k}")
  let mut out := s!"depwalk {root}: {names.size} constants reached through types and values\n"
  out := out ++ s!"  by kind: {kindLine}\n"
  out := out ++ s!"  axioms reached: {axioms.toList}\n"
  out := out ++ s!"  reached constants presented as axioms other than the three standard ones: {noProof}\n"
  out := out ++ s!"  names not found in the environment: {w.missing.toList}\n"
  out := out ++ s!"  declared in a module whose name starts with \"{pfx}\": {inPrefix.size}\n"
  out := out ++ s!"  of which theorems, axioms or opaque constants: {prefixTheorems}\n"
  for l in inPrefix do out := out ++ l ++ "\n"
  out := out ++ s!"  forbidden names: {forbidden.toList}\n"
  out := out ++ s!"  statements whose proofs are forbidden: {statements.toList}\n"
  if flagged then
    out := out ++ "  flags:\n"
    for l in flags do out := out ++ l ++ "\n"
  out := out ++ s!"  verdict: {if flagged then "FLAGGED" else "CLEAN"}"
  return (flagged, out)

/-- Resolve an identifier to a constant of the environment, or throw. -/
def resolve (id : Syntax) : CommandElabM Name := do
  liftCoreM <| realizeGlobalConstNoOverloadWithInfo id

syntax depwalkPrefix := "(" &"prefix" ":=" ident ")"
syntax depwalkProofs := "proofsOf" (ppSpace ident)+

/-- `#depwalk thm f₁ f₂ … [proofsOf S₁ …]`: see the module docstring. -/
syntax (name := depwalkCmd) "#depwalk " (depwalkPrefix)? ident (ppSpace ident)* (ppSpace depwalkProofs)? : command

/-- `#depwalk_expect CLEAN|FLAGGED thm f₁ f₂ … [proofsOf S₁ …]`: an error when the verdict differs. -/
syntax (name := depwalkExpectCmd) "#depwalk_expect " (&"CLEAN" <|> &"FLAGGED") (depwalkPrefix)? ident
  (ppSpace ident)* (ppSpace depwalkProofs)? : command

/-- Shared implementation. -/
def run (pfx? : Option Syntax) (root : Syntax) (forb : Array Syntax) (proofs? : Option Syntax) :
    CommandElabM (Bool × String) := do
  let pfx : String := match pfx? with
    | some stx => stx[3].getId.toString
    | none => "Percolation"
  let rootName ← resolve root
  let forbidden ← forb.mapM resolve
  let statements ← match proofs? with
    | some stx => stx[1].getArgs.mapM resolve
    | none => pure #[]
  return report (← getEnv) rootName pfx forbidden statements

@[command_elab depwalkCmd] def elabDepwalk : CommandElab := fun stx => do
  let pfx? := stx[1].getOptional?
  let (_, out) ← run pfx? stx[2] stx[3].getArgs stx[4].getOptional?
  logInfo out

@[command_elab depwalkExpectCmd] def elabDepwalkExpect : CommandElab := fun stx => do
  let want : Bool := stx[1].getAtomVal == "FLAGGED" || stx[1][0].getAtomVal == "FLAGGED"
  let pfx? := stx[2].getOptional?
  let (flagged, out) ← run pfx? stx[3] stx[4].getArgs stx[5].getOptional?
  logInfo out
  unless flagged == want do
    throwError "depwalk: expected {if want then "FLAGGED" else "CLEAN"}, got {if flagged then "FLAGGED" else "CLEAN"}"

end KN3DepWalk

/-! ## Self-test -/

namespace KN3DepWalk.Test

/-- A lemma. -/
theorem lemmaA (n : ℕ) : n + 0 = n := Nat.add_zero n

/-- A theorem that uses `lemmaA`. -/
theorem usesA (n : ℕ) : n + 0 + 0 = n := (lemmaA (n + 0)).trans (lemmaA n)

/-- A theorem that does not. -/
theorem avoidsA (n : ℕ) : 0 + n = n := Nat.zero_add n

/-- A statement, its proof, and a theorem that goes through the proof / only through the statement. -/
def Stmt : Prop := ∀ n : ℕ, n + 0 = n
theorem stmt_holds : Stmt := fun n => Nat.add_zero n
theorem cheat : Stmt → Stmt := fun _ => stmt_holds
theorem honest : Stmt → Stmt := fun h => h
/-- The same statement proved under its unfolded body: still "a proof of `Stmt`". -/
theorem stmt_holds_unfolded : ∀ n : ℕ, n + 0 = n := fun n => Nat.add_zero n
theorem cheat2 : Stmt → Stmt := fun _ => stmt_holds_unfolded

-- a theorem that uses a lemma is FLAGGED when that lemma is forbidden
#depwalk_expect FLAGGED usesA lemmaA
-- … and CLEAN when another name is forbidden
#depwalk_expect CLEAN usesA avoidsA
#depwalk_expect CLEAN avoidsA lemmaA
-- the cheating implication is FLAGGED by name …
#depwalk_expect FLAGGED cheat stmt_holds
-- … and by type, without naming the proof
#depwalk_expect FLAGGED cheat proofsOf Stmt
#depwalk_expect FLAGGED cheat2 proofsOf Stmt
-- the honest implication mentions the statement and no proof of it
#depwalk_expect CLEAN honest stmt_holds proofsOf Stmt

-- on Mathlib: a theorem of this file that uses a Mathlib theorem reaches it
theorem usesMathlib (a b : ℝ) (h : a < b) : a ≤ b := le_of_lt h
#depwalk_expect FLAGGED (prefix := Mathlib.Probability) usesMathlib le_of_lt
#depwalk_expect CLEAN (prefix := Mathlib.Probability) usesMathlib Nat.Prime.two_le

-- the walk sees INSIDE Mathlib's proofs: `infinitePi_map_pi` is proved with `eq_infinitePi` and `infinitePi_pi`
-- (Mathlib/Probability/ProductMeasure.lean), names that do not occur in its statement
#depwalk_expect FLAGGED (prefix := Mathlib.Probability) MeasureTheory.Measure.infinitePi_map_pi
  MeasureTheory.Measure.eq_infinitePi
#depwalk_expect FLAGGED (prefix := Mathlib.Probability) MeasureTheory.Measure.infinitePi_map_pi
  MeasureTheory.Measure.infinitePi_pi
-- … and does not reach what the proof does not use
#depwalk_expect CLEAN (prefix := Mathlib.Probability) MeasureTheory.Measure.infinitePi_map_pi
  MeasureTheory.Measure.infinitePi_map_piCongrLeft

end KN3DepWalk.Test
