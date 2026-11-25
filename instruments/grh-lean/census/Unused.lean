import Main
open Lean

/-!
# D1 of the grh-lean lane (corpus/grh-lean-check/PREREG.md): the release's declarations outside the closure

Run in an edition's workspace after its build (`lake env lean <this file>`). It reads the environment of `Main` only
and writes to stdout; it changes nothing. A list, never a verdict: offered to the community as a cleanup aid.

- The closure: the five theorems of `Main.lean`, then every constant their types and values use
  (`ConstantInfo.getUsedConstantsAsSet`), repeated to a fixed point; an inductive type brings its whole block (its
  mutual types, constructors and recursor), a constructor or recursor brings its type, as lean4export exports them.
- The release: every constant whose module is `Main`, `Statements`, or under `Lib` or `New` (the edition's `src/`).
- Output: one line `D1<TAB>kind<TAB>class<TAB>module<TAB>name` per release constant outside the closure, sorted by
  module and name, where class is `aux` for compiler- or elaborator-made constants (a name component starting with
  `_`, constructors, recursors, and the usual generated suffixes) and `decl` for the rest; then one summary line
  `D1SUM …`. The module maps to the file `src/<module with / for .>.lean`.

The closure walk is the one of the earlier lane's census (tools/runpod-alpoge-grh-p2.sh, CEN), which compiled and ran at
Lean v4.33.1, with the inductive blocks added.
-/

def roots : List Name := [`riemannHypothesis, `riemannZeta_eq_zero_re, `LFunction_ne_zero_of_half_lt_re,
  `LFunction_eq_zero_re, `LFunction_eq_zero_re_of_isPrimitive]

def isReleaseModule (m : Name) : Bool :=
  m == `Main || m == `Statements || m.getRoot == `Lib || m.getRoot == `New

def auxSuffixes : List String := ["below", "ibelow", "brecOn", "binductionOn", "casesOn", "recOn", "noConfusion",
  "noConfusionType", "sizeOf_spec", "inj", "injEq", "ext_iff", "eq_def", "ctorIdx", "toCtorIdx"]

def isAux (n : Name) (ci : ConstantInfo) : Bool :=
  n.isInternal || ci.isCtor || (match ci with | .recInfo _ => true | _ => false) ||
    (match n with
     | .str _ s => auxSuffixes.contains s || s.startsWith "eq_" || s.startsWith "match_" || s.startsWith "proof_"
     | _ => false)

def kindOf : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"

#eval show CoreM Unit from do
  let env ← getEnv
  let modOf := fun (n : Name) => match env.getModuleIdxFor? n with
    | some idx => env.header.moduleNames[idx.toNat]!
    | none => `_current
  let mut seen : NameHashSet := {}
  let mut stack : Array Name := roots.toArray
  let mut missing : Array Name := #[]
  while !stack.isEmpty do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    match env.find? n with
    | none => missing := missing.push n
    | some ci =>
      for c in ci.getUsedConstantsAsSet do
        if !seen.contains c then stack := stack.push c
      match ci with
      | .inductInfo v =>
        for c in v.all ++ v.ctors do
          stack := stack.push c
        stack := stack.push (mkRecName n)
      | .ctorInfo v => stack := stack.push v.induct
      | .recInfo v =>
        for c in v.all do
          stack := stack.push c
      | _ => pure ()
  let mut total := 0
  let mut inClosure := 0
  let mut outside : Array (String × String × String × String) := #[]
  for (n, ci) in env.constants.toList do
    let m := modOf n
    if !isReleaseModule m then continue
    total := total + 1
    if seen.contains n then
      inClosure := inClosure + 1
    else
      outside := outside.push (m.toString, n.toString, kindOf ci, if isAux n ci then "aux" else "decl")
  let sorted := outside.qsort (fun a b => a.1 < b.1 || (a.1 == b.1 && a.2.1 < b.2.1))
  for (m, n, k, c) in sorted do
    IO.println s!"D1\t{k}\t{c}\t{m}\t{n}"
  let decls := (sorted.filter (fun x => x.2.2.2 == "decl")).size
  let mods := (sorted.map (fun x => x.1)).toList.eraseDups.length
  IO.println s!"D1SUM closure_constants={seen.size} missing={missing.size} release_constants={total} release_in_closure={inClosure} release_outside={sorted.size} outside_decl={decls} outside_aux={sorted.size - decls} outside_modules={mods}"
