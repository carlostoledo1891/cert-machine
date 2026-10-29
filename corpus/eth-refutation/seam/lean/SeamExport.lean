/-
SeamExport — cert-machine, corpus/eth-refutation/seam (.github/workflows/eth-seam.yml, tools/record-eth-seam.js).

The question: OpenAI's challenge text (lean/ComparatorChallenges/SubexponentialSAT.lean at openai/math 7ef5c0cc) is
elaborated on Lean v4.34.1 with Mathlib d13f23b7 where OpenAI proved it, and on Lean v4.33.1 with Mathlib 0df444a3
where TSavo's bridge uses it. The bytes are the same; is the elaborated statement the same term, and so is every
definition it can unfold to?

`run` writes, for a root constant, the transitive closure of the constants its type and value depend on:
  definitions and opaques: type and value; theorems: type only (their proofs are never followed); axioms and Quot:
  type; inductives: type, constructors, recursor, mutual block, and, for a structure, its projection functions;
  constructors: type and their inductive; recursors: type and the right-hand side of every rule.
Every constant is written as a canonical node table: our own printer, independent of Lean's pretty-printer, of the
Expr structure itself (de Bruijn indices, constant names, universe levels with each parameter as its position,
literals, projections), with binder names, binder infos and metadata keys kept so the reader can drop them.
Nodes are hash-consed by their text and numbered in post order, so a table is a function of the term alone.

A second, proof-erased closure is written beside the first: every subterm that is a proof (its type is a
proposition, decided by Meta.isProof) is replaced by the marker constant ⟨proof⟩, and the closure follows only what
remains, so no theorem is ever reached. Two closures equal after erasure differ at most inside proofs, which the
kernel identifies (proof irrelevance).

Nothing here decides: the recorder compares two exports and writes the verdict.
-/
import Lean
import Std.Data.HashMap
import Std.Data.HashSet

open Lean Meta

namespace SeamExport

/-! ## Canonical text, by our own rules -/

def escComp (s : String) : String :=
  if s.isEmpty || s.any (fun c => c == '.' || c == '«' || c == '»' || c == '#') then "«" ++ s ++ "»" else s

partial def nameStr : Name → String
  | .anonymous => "[anonymous]"
  | .str .anonymous s => escComp s
  | .str p s => nameStr p ++ "." ++ escComp s
  | .num .anonymous k => "#" ++ toString k
  | .num p k => nameStr p ++ ".#" ++ toString k

def jstr (s : String) : String := (Json.str s).compress

def jarr (xs : List String) : String := "[" ++ ",".intercalate xs ++ "]"

def namesJ (ns : List Name) : String := jarr (ns.map fun n => jstr (nameStr n))

def boolJ (b : Bool) : String := if b then "true" else "false"

def paramStr (ps : Array Name) (n : Name) : String :=
  match ps.findIdx? (· == n) with
  | some i => "u" ++ toString i
  | none => "?param:" ++ nameStr n

def peelSucc : Level → Nat → Level × Nat
  | .succ l, k => peelSucc l (k + 1)
  | l, k => (l, k)

def isZeroLevel : Level → Bool
  | .zero => true
  | _ => false

partial def levelStr (ps : Array Name) (l : Level) : String :=
  let (b, k) := peelSucc l 0
  let base : String :=
    match b with
    | .zero => "0"
    | .succ _ => "?succ"
    | .max x y => "(max " ++ levelStr ps x ++ " " ++ levelStr ps y ++ ")"
    | .imax x y => "(imax " ++ levelStr ps x ++ " " ++ levelStr ps y ++ ")"
    | .param n => paramStr ps n
    | .mvar _ => "?mvar"
  if k == 0 then base
  else if isZeroLevel b then toString k
  else "(" ++ base ++ "+" ++ toString k ++ ")"

def biStr : BinderInfo → String
  | .default => "d"
  | .implicit => "i"
  | .strictImplicit => "s"
  | .instImplicit => "x"

/-! ## The node table -/

/-- an Expr compared strictly (binder names and infos included) -/
structure Key where
  e : Expr

instance : BEq Key := ⟨fun a b => a.e.equal b.e⟩
instance : Hashable Key := ⟨fun a => hash a.e⟩

structure SerState where
  nodes : Array String := #[]
  byText : Std.HashMap String Nat := {}
  memo : Std.HashMap Key Nat := {}

def intern (node : String) : StateM SerState Nat :=
  modifyGet fun st =>
    match st.byText[node]? with
    | some i => (i, st)
    | none =>
      let i := st.nodes.size
      (i, { st with nodes := st.nodes.push node, byText := st.byText.insert node i })

partial def ser (ps : Array Name) (e : Expr) : StateM SerState Nat := do
  if let some i := (← get).memo[Key.mk e]? then return i
  let node ← match e with
    | .bvar i => pure (jarr ["\"b\"", toString i])
    | .fvar id => pure (jarr ["\"f\"", jstr (nameStr id.name)])
    | .mvar id => pure (jarr ["\"?\"", jstr (nameStr id.name)])
    | .sort l => pure (jarr ["\"s\"", jstr (levelStr ps l)])
    | .const n ls => pure (jarr ["\"c\"", jstr (nameStr n), jarr (ls.map fun l => jstr (levelStr ps l))])
    | .app f a => do
      let i ← ser ps f
      let j ← ser ps a
      pure (jarr ["\"a\"", toString i, toString j])
    | .lam n t b bi => do
      let i ← ser ps t
      let j ← ser ps b
      pure (jarr ["\"l\"", jstr (nameStr n), jstr (biStr bi), toString i, toString j])
    | .forallE n t b bi => do
      let i ← ser ps t
      let j ← ser ps b
      pure (jarr ["\"p\"", jstr (nameStr n), jstr (biStr bi), toString i, toString j])
    | .letE n t v b nd => do
      let i ← ser ps t
      let j ← ser ps v
      let k ← ser ps b
      pure (jarr ["\"z\"", jstr (nameStr n), toString i, toString j, toString k, boolJ nd])
    | .lit (.natVal k) => pure (jarr ["\"n\"", jstr (toString k)])
    | .lit (.strVal s) => pure (jarr ["\"t\"", jstr s])
    | .mdata d b => do
      let i ← ser ps b
      pure (jarr ["\"m\"", jarr (d.entries.map fun kv => jstr (nameStr kv.1)), toString i])
    | .proj s idx b => do
      let i ← ser ps b
      pure (jarr ["\"j\"", jstr (nameStr s), toString idx, toString i])
  let i ← intern node
  modify fun st => { st with memo := st.memo.insert (Key.mk e) i }
  return i

/-- the node table of one term: a JSON array of nodes, children before parents, the root last -/
def table (ps : Array Name) (e : Expr) : String :=
  let st := (Id.run ((ser ps e).run {})).2
  jarr st.nodes.toList

/-! ## Proof erasure -/

def proofName : Name := Name.mkSimple "⟨proof⟩"
def proofMarker : Expr := .const proofName []

/-- Meta.isProof, an error counted and read as "not a proof" (the subterm is then kept, never erased) -/
def safeIsProof (errs : IO.Ref Nat) (e : Expr) : MetaM Bool := do
  try
    isProof e
  catch _ =>
    errs.modify (· + 1)
    return false

partial def erase (cache : IO.Ref (Std.HashMap Key Expr)) (errs : IO.Ref Nat) (e : Expr) : MetaM Expr := do
  match e with
  | .sort .. => return e
  | .lit .. => return e
  | .bvar .. => return e
  | .mvar .. => return e
  | _ => pure ()
  if let some r := (← cache.get)[Key.mk e]? then return r
  if (← safeIsProof errs e) then
    cache.modify fun c => c.insert (Key.mk e) proofMarker
    return proofMarker
  let r ← match e with
    | .app .. => do
      let f' ← erase cache errs e.getAppFn
      let args' ← e.getAppArgs.mapM (erase cache errs)
      pure (mkAppN f' args')
    | .lam n t b bi => do
      let t' ← erase cache errs t
      withLocalDecl n bi t fun x => do
        let b' ← erase cache errs (b.instantiate1 x)
        pure (.lam n t' (b'.abstract #[x]) bi)
    | .forallE n t b bi => do
      let t' ← erase cache errs t
      withLocalDecl n bi t fun x => do
        let b' ← erase cache errs (b.instantiate1 x)
        pure (.forallE n t' (b'.abstract #[x]) bi)
    | .letE n t v b nd => do
      let t' ← erase cache errs t
      let v' ← erase cache errs v
      withLetDecl n t v fun x => do
        let b' ← erase cache errs (b.instantiate1 x)
        pure (.letE n t' v' (b'.abstract #[x]) nd)
    | .mdata d b => do
      let b' ← erase cache errs b
      pure (.mdata d b')
    | .proj s i b => do
      let b' ← erase cache errs b
      pure (.proj s i b')
    | _ => pure e
  cache.modify fun c => c.insert (Key.mk e) r
  return r

/-! ## Constants -/

def kindStr : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "thm"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "induct"
  | .ctorInfo _ => "ctor"
  | .recInfo _ => "rec"

def safetyStr : DefinitionSafety → String
  | .unsafe => "unsafe"
  | .safe => "safe"
  | .partial => "partial"

def hintsStr : ReducibilityHints → String
  | .opaque => "opaque"
  | .abbrev => "abbrev"
  | .regular h => "regular " ++ toString h

def quotStr : QuotKind → String
  | .type => "type"
  | .ctor => "ctor"
  | .lift => "lift"
  | .ind => "ind"

/-- the kernel-relevant facts of a constant beyond its type and value -/
def metaJ : ConstantInfo → String
  | .axiomInfo v => "{\"unsafe\":" ++ boolJ v.isUnsafe ++ "}"
  | .defnInfo v => "{\"safety\":" ++ jstr (safetyStr v.safety) ++ ",\"all\":" ++ namesJ v.all ++ "}"
  | .thmInfo v => "{\"all\":" ++ namesJ v.all ++ "}"
  | .opaqueInfo v => "{\"unsafe\":" ++ boolJ v.isUnsafe ++ ",\"all\":" ++ namesJ v.all ++ "}"
  | .quotInfo v => "{\"quot\":" ++ jstr (quotStr v.kind) ++ "}"
  | .inductInfo v =>
    "{\"numParams\":" ++ toString v.numParams ++ ",\"numIndices\":" ++ toString v.numIndices ++
    ",\"all\":" ++ namesJ v.all ++ ",\"ctors\":" ++ namesJ v.ctors ++ ",\"isRec\":" ++ boolJ v.isRec ++
    ",\"unsafe\":" ++ boolJ v.isUnsafe ++ ",\"isReflexive\":" ++ boolJ v.isReflexive ++ "}"
  | .ctorInfo v =>
    "{\"induct\":" ++ jstr (nameStr v.induct) ++ ",\"cidx\":" ++ toString v.cidx ++ ",\"numParams\":" ++
    toString v.numParams ++ ",\"numFields\":" ++ toString v.numFields ++ ",\"unsafe\":" ++ boolJ v.isUnsafe ++ "}"
  | .recInfo v =>
    "{\"all\":" ++ namesJ v.all ++ ",\"numParams\":" ++ toString v.numParams ++ ",\"numIndices\":" ++
    toString v.numIndices ++ ",\"numMotives\":" ++ toString v.numMotives ++ ",\"numMinors\":" ++
    toString v.numMinors ++ ",\"k\":" ++ boolJ v.k ++ ",\"unsafe\":" ++ boolJ v.isUnsafe ++ "}"

/-- the edges that do not come from a term: constructors, recursor, mutual block, projections, inductive -/
def structuralRefs (env : Environment) (ci : ConstantInfo) : Array (Name × String) := Id.run do
  let mut out : Array (Name × String) := #[]
  match ci with
  | .defnInfo v => out := out ++ (v.all.toArray.map fun n => (n, "all"))
  | .opaqueInfo v => out := out ++ (v.all.toArray.map fun n => (n, "all"))
  | .inductInfo v =>
    out := out ++ (v.ctors.toArray.map fun n => (n, "ctor"))
    out := out ++ (v.all.toArray.map fun n => (n, "all"))
    out := out.push (mkRecName v.name, "rec")
    if let some si := getStructureInfo? env v.name then
      out := out ++ (si.fieldInfo.map fun f => (f.projFn, "proj"))
  | .ctorInfo v => out := out.push (v.induct, "induct")
  | .recInfo v =>
    out := out ++ (v.all.toArray.map fun n => (n, "all"))
    for r in v.rules do
      out := out ++ (r.rhs.getUsedConstants.map fun n => (n, "rule"))
  | _ => pure ()
  return out

/-- the edges of the full closure: the type, the value of a definition or opaque (never a theorem's proof) -/
def fullRefs (env : Environment) (ci : ConstantInfo) : Array (Name × String) := Id.run do
  let mut out : Array (Name × String) := ci.type.getUsedConstants.map fun n => (n, "type")
  match ci with
  | .defnInfo v => out := out ++ (v.value.getUsedConstants.map fun n => (n, "value"))
  | .opaqueInfo v => out := out ++ (v.value.getUsedConstants.map fun n => (n, "value"))
  | _ => pure ()
  return out ++ structuralRefs env ci

def termRefs (e : Expr) (edge : String) : Array (Name × String) :=
  (e.getUsedConstants.filter (· != proofName)).map fun n => (n, edge)

def valueOf? : ConstantInfo → Option Expr
  | .defnInfo v => some v.value
  | .opaqueInfo v => some v.value
  | _ => none

def moduleOf (n : Name) : MetaM String := do
  try
    match ← findModuleOf? n with
    | some m => pure (nameStr m)
    | none => pure ""
  catch _ => pure ""

/-- a BFS from the roots; `refs` gives the edges of a constant; at most `cap` constants -/
def bfs (roots : Array Name) (cap : Nat) (refs : Name → ConstantInfo → MetaM (Array (Name × String))) :
    MetaM (Array (Name × Name × String) × Array Name × Bool) := do
  let env ← getEnv
  let mut seen : Std.HashSet Name := {}
  let mut order : Array (Name × Name × String) := #[]
  let mut missing : Array Name := #[]
  let mut queue : Array (Name × Name × String) := roots.map fun r => (r, Name.anonymous, "root")
  let mut qi := 0
  let mut truncated := false
  while qi < queue.size do
    let (n, p, edge) := queue[qi]!
    qi := qi + 1
    if seen.contains n then continue
    if order.size ≥ cap then
      truncated := true
      break
    seen := seen.insert n
    order := order.push (n, p, edge)
    match env.find? n with
    | none => missing := missing.push n
    | some ci =>
      for (m, k) in (← refs n ci) do
        unless seen.contains m do queue := queue.push (m, n, k)
  return (order, missing, truncated)

/-- the erased forms of one constant: "same" where erasure changed nothing -/
def erJ (ci : ConstantInfo) (ps : Array Name) (er : Option (Expr × Option Expr)) (fr : Option (Name × String)) :
    String :=
  match er, fr with
  | some (t', v'), some (pe, ee) =>
    let te := if t'.equal ci.type then "\"same\"" else table ps t'
    let ve := (match v', valueOf? ci with
      | some v'', some v => if v''.equal v then "\"same\"" else table ps v''
      | _, _ => "null")
    "{\"from\":" ++ jarr [jstr (nameStr pe), jstr ee] ++ ",\"t\":" ++ te ++ ",\"v\":" ++ ve ++ "}"
  | _, _ => "null"

/-- the root's value with every `inner a` replaced by the body of `inner` at `a` (one delta step, then beta) -/
def unfoldIn (value : Expr) (inner : Name) (body : Expr) : Expr :=
  value.replace fun s =>
    match s with
    | .app (.const c _) a => if c == inner then some (body.instantiate1 a) else none
    | _ => none

/-- `run label roots unfold typesOnly` writes `$SEAM_OUT/<label>.jsonl`: a header line, then one line per constant
of the full closure of `roots` (BFS order), then the pseudo-entries (the root with `unfold.2` delta-expanded, and
the type of every name in `typesOnly`, without closure). -/
def run (label : String) (roots : Array Name) (unfold : Option (Name × Name)) (typesOnly : Array Name)
    (cap : Nat := 400000) : MetaM Unit := do
  let dir := (← IO.getEnv "SEAM_OUT").getD "."
  let env ← getEnv
  for r in roots ++ typesOnly do
    unless env.contains r do throwError "SeamExport: {r} is not in the environment"
  let t0 ← IO.monoMsNow
  -- the full closure
  let (order, missing, truncated) ← bfs roots cap fun _ ci => pure (fullRefs env ci)
  let t1 ← IO.monoMsNow
  -- the proof-erased closure
  let errs ← IO.mkRef 0
  let erased ← IO.mkRef ({} : Std.HashMap Name (Expr × Option Expr))
  let (orderE, missingE, truncatedE) ← bfs roots cap fun n ci => do
    let cache ← IO.mkRef ({} : Std.HashMap Key Expr)
    let t' ← erase cache errs ci.type
    let v' ← match valueOf? ci with
      | some v => some <$> erase cache errs v
      | none => pure none
    erased.modify fun m => m.insert n (t', v')
    let mut out := termRefs t' "type"
    if let some v := v' then out := out ++ termRefs v "value"
    return out ++ structuralRefs env ci
  let t2 ← IO.monoMsNow
  let erasedMap ← erased.get
  let fromE : Std.HashMap Name (Name × String) :=
    orderE.foldl (fun m (n, p, e) => m.insert n (p, e)) {}
  let mut lines : Array String := #[]
  for (n, p, edge) in order do
    let some ci := env.find? n | continue
    let ps := ci.levelParams.toArray
    let value := match valueOf? ci with
      | some v => table ps v
      | none => "null"
    let rules := match ci with
      | .recInfo v => jarr (v.rules.map fun r =>
          jarr [jstr (nameStr r.ctor), toString r.nfields, table ps r.rhs])
      | _ => "null"
    let hints := match ci with
      | .defnInfo v => jstr (hintsStr v.hints)
      | _ => "null"
    let er := erJ ci ps erasedMap[n]? fromE[n]?
    let mod ← moduleOf n
    lines := lines.push ("{\"n\":" ++ jstr (nameStr n) ++ ",\"k\":" ++ jstr (kindStr ci) ++
      ",\"lp\":" ++ namesJ ci.levelParams ++ ",\"mod\":" ++ jstr mod ++
      ",\"from\":" ++ jarr [jstr (nameStr p), jstr edge] ++ ",\"meta\":" ++ metaJ ci ++
      ",\"hints\":" ++ hints ++ ",\"t\":" ++ table ps ci.type ++ ",\"v\":" ++ value ++
      ",\"rules\":" ++ rules ++ ",\"e\":" ++ er ++ "}")
  -- the pseudo-entries
  if let some (rootN, innerN) := unfold then
    let some (.defnInfo rv) := env.find? rootN | throwError "SeamExport: {rootN} is not a definition"
    let some (.defnInfo iv) := env.find? innerN | throwError "SeamExport: {innerN} is not a definition"
    unless rv.levelParams.isEmpty && iv.levelParams.isEmpty do throwError "SeamExport: universe parameters"
    let body ← match iv.value with
      | .lam _ _ b _ => pure b
      | _ => throwError "SeamExport: the value of {innerN} is not a lambda"
    let u := unfoldIn rv.value innerN body
    if u.getUsedConstants.contains innerN then throwError "SeamExport: {innerN} survives the unfolding"
    let cache ← IO.mkRef ({} : Std.HashMap Key Expr)
    let ue ← erase cache errs u
    let te := if ue.equal u then "\"same\"" else table #[] ue
    lines := lines.push ("{\"n\":" ++ jstr ("⟨unfolded⟩ " ++ nameStr rootN) ++ ",\"k\":\"unfolded\",\"lp\":[]" ++
      ",\"unfolds\":" ++ jstr (nameStr innerN) ++ ",\"t\":" ++ table #[] u ++
      ",\"e\":{\"t\":" ++ te ++ "}}")
  for n in typesOnly do
    let some ci := env.find? n | continue
    lines := lines.push ("{\"n\":" ++ jstr ("⟨type⟩ " ++ nameStr n) ++ ",\"k\":\"typeOnly\",\"of\":" ++
      jstr (nameStr n) ++ ",\"ofKind\":" ++ jstr (kindStr ci) ++ ",\"lp\":" ++ namesJ ci.levelParams ++
      ",\"mod\":" ++ jstr (← moduleOf n) ++ ",\"t\":" ++ table ci.levelParams.toArray ci.type ++ "}")
  let t3 ← IO.monoMsNow
  let rootMods ← roots.mapM moduleOf
  let header := "{\"header\":" ++ jstr label ++ ",\"lean\":" ++ jstr Lean.versionString ++
    ",\"githash\":" ++ jstr Lean.githash ++ ",\"roots\":" ++ namesJ roots.toList ++
    ",\"rootModules\":" ++ jarr (rootMods.toList.map jstr) ++
    ",\"unfold\":" ++ (match unfold with | some (a, b) => namesJ [a, b] | none => "null") ++
    ",\"typesOnly\":" ++ namesJ typesOnly.toList ++
    ",\"modulesImported\":" ++ toString env.header.moduleNames.size ++
    ",\"full\":" ++ toString order.size ++ ",\"erased\":" ++ toString orderE.size ++
    ",\"missing\":" ++ namesJ missing.toList ++ ",\"missingErased\":" ++ namesJ missingE.toList ++
    ",\"truncated\":" ++ boolJ (truncated || truncatedE) ++ ",\"cap\":" ++ toString cap ++
    ",\"eraseErrors\":" ++ toString (← errs.get) ++
    ",\"ms\":{\"full\":" ++ toString (t1 - t0) ++ ",\"erased\":" ++ toString (t2 - t1) ++
    ",\"write\":" ++ toString (t3 - t2) ++ "}}"
  let path : System.FilePath := ⟨dir ++ "/" ++ label ++ ".jsonl"⟩
  let h ← IO.FS.Handle.mk path .write
  h.putStrLn header
  for line in lines do h.putStrLn line
  h.flush
  IO.println s!"SeamExport {label}: {order.size} constants in the closure, {orderE.size} after proof erasure, {missing.size} missing, truncated {truncated || truncatedE}, erase errors {← errs.get}; {path}"

end SeamExport
