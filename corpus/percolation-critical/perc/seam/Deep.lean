import Textbook
open Lean Elab Command Meta

/-- Every constant reachable from `root` through types and DEFINITION values (theorem proofs are not followed:
a proof may change between versions without changing what is stated). One line per constant: name, kind, hash of the
type, hash of the value for definitions. -/
partial def depClosure (env : Environment) (root : Name) : Array Name := Id.run do
  let mut seen : NameSet := {}
  let mut todo : Array Name := #[root]
  let mut out : Array Name := #[]
  while h : todo.size > 0 do
    let n := todo.back
    todo := todo.pop
    if seen.contains n then continue
    seen := seen.insert n
    out := out.push n
    match env.find? n with
    | none => pure ()
    | some ci =>
      let mut refs := ci.type.getUsedConstants
      match ci with
      | .defnInfo d => refs := refs ++ d.value.getUsedConstants
      | .inductInfo i => refs := refs ++ i.ctors.toArray
      | .ctorInfo c => refs := refs.push c.induct
      | _ => pure ()
      for r in refs do
        if !seen.contains r then todo := todo.push r
  return out

elab "#deep " id:ident : command => do
  let env ← getEnv
  let names := (depClosure env id.getId).qsort (fun a b => decide (a.toString < b.toString))
  for n in names do
    match env.find? n with
    | none => logInfo m!"{n} MISSING"
    | some ci =>
      let kind := match ci with
        | .defnInfo _ => "def" | .thmInfo _ => "thm" | .axiomInfo _ => "axiom" | .opaqueInfo _ => "opaque"
        | .quotInfo _ => "quot" | .inductInfo _ => "induct" | .ctorInfo _ => "ctor" | .recInfo _ => "rec"
      let v := match ci with | .defnInfo d => toString d.value.hash | _ => "-"
      IO.println s!"{n} {kind} {ci.type.hash} {v}"

#deep TextbookPercolation.Statement
