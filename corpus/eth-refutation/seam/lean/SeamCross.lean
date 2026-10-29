/-
SeamCross — cert-machine, corpus/eth-refutation/seam (.github/workflows/eth-seam.yml, tools/record-eth-seam.js).

Reads an export SeamExport wrote in the OTHER environment ($SEAM_IN/<label>.jsonl) back into Exprs (our own parser of
our own printer: names, levels by position, the node table) and, for every constant of it, sets the foreign term
beside the local constant of the same name:
  same            the foreign type (and value) equal the local ones exactly (metadata dropped): the round trip of the
                  printer is checked on every such constant
  same-kernel     equal up to binder names and binder infos (Expr.eqv)
  defeq           different terms, but the foreign term type-checks HERE and is definitionally equal HERE to the local
                  term: the kernel accepts `theorem _ : @Eq T foreign local := @Eq.refl T local` (Lean.addDecl)
  not-defeq       the kernel refuses that theorem (its message is kept): the foreign term is ill-typed here, or the two
                  are not definitionally equal here, or the check ran out of heartbeats
  absent          no constant of that name here
  names-absent    the foreign term names constants that do not exist here, so it cannot even be read here
  shape           the kinds or the universe-parameter counts differ
Inductives are compared by their type and constructor list, constructors and recursors by their type (a recursor's
rules are determined by its inductive). Nothing here decides: the recorder classifies.
-/
import Lean
import SeamExport

open Lean Meta

namespace SeamCross

open SeamExport (jstr jarr namesJ nameStr unfoldIn)

def digitsVal (ds : List Char) : Nat := ds.foldl (fun n c => 10 * n + (c.toNat - '0'.toNat)) 0

def pushComp (n : Name) (c : List Char) (quoted : Bool) : Name :=
  match c with
  | '#' :: ds => if !quoted && !ds.isEmpty && ds.all Char.isDigit then .num n (digitsVal ds) else .str n c.asString
  | _ => .str n c.asString

/-- the inverse of SeamExport.nameStr -/
def parseName (s : String) : Name := Id.run do
  if s == "[anonymous]" then return .anonymous
  let mut n := Name.anonymous
  let mut cur : List Char := []
  let mut inQ := false
  let mut quoted := false
  for c in s.toList do
    if inQ then
      if c == '»' then
        inQ := false
      else
        cur := c :: cur
    else if c == '«' then
      inQ := true
      quoted := true
    else if c == '.' then
      n := pushComp n cur.reverse quoted
      cur := []
      quoted := false
    else
      cur := c :: cur
  return pushComp n cur.reverse quoted

def addSucc : Level → Nat → Level
  | l, 0 => l
  | l, k + 1 => .succ (addSucc l k)

def expectChar (c : Char) : List Char → Option (List Char)
  | d :: r => if c == d then some r else none
  | [] => none

/-- the inverse of SeamExport.levelStr -/
partial def parseLevel (ps : Array Name) : List Char → Option (Level × List Char)
  | '(' :: 'm' :: 'a' :: 'x' :: ' ' :: rest => do
    let (a, r1) ← parseLevel ps rest
    let r2 ← expectChar ' ' r1
    let (b, r3) ← parseLevel ps r2
    let r4 ← expectChar ')' r3
    pure (.max a b, r4)
  | '(' :: 'i' :: 'm' :: 'a' :: 'x' :: ' ' :: rest => do
    let (a, r1) ← parseLevel ps rest
    let r2 ← expectChar ' ' r1
    let (b, r3) ← parseLevel ps r2
    let r4 ← expectChar ')' r3
    pure (.imax a b, r4)
  | '(' :: rest => do
    let (a, r1) ← parseLevel ps rest
    let r2 ← expectChar '+' r1
    let (ds, r3) := r2.span Char.isDigit
    let r4 ← expectChar ')' r3
    pure (addSucc a (digitsVal ds), r4)
  | 'u' :: rest => do
    let (ds, r) := rest.span Char.isDigit
    let p ← ps[digitsVal ds]?
    pure (.param p, r)
  | c :: rest =>
    if c.isDigit then
      let (ds, r) := (c :: rest).span Char.isDigit
      some (addSucc .zero (digitsVal ds), r)
    else none
  | [] => none

def lvl (ps : Array Name) (s : String) : Except String Level :=
  match parseLevel ps s.toList with
  | some (l, []) => .ok l
  | _ => .error ("cannot read the level " ++ s)

def biOf : String → BinderInfo
  | "i" => .implicit
  | "s" => .strictImplicit
  | "x" => .instImplicit
  | _ => .default

def idx (es : Array Expr) (j : Json) : Except String Expr := do
  let i ← j.getNat?
  match es[i]? with
  | some e => pure e
  | none => throw s!"node index {i} out of range"

def jget (a : Array Json) (i : Nat) : Except String Json :=
  match a[i]? with
  | some j => pure j
  | none => throw s!"node field {i} missing"

/-- one node, its children already built; metadata nodes are dropped (only their keys were printed) -/
def node (ps : Array Name) (es : Array Expr) (a : Array Json) : Except String Expr := do
  let tag ← (← jget a 0).getStr?
  match tag with
  | "b" => return .bvar (← (← jget a 1).getNat?)
  | "s" => return .sort (← lvl ps (← (← jget a 1).getStr?))
  | "c" =>
    let ls ← (← (← jget a 2).getArr?).mapM fun l => do lvl ps (← l.getStr?)
    return .const (parseName (← (← jget a 1).getStr?)) ls.toList
  | "a" => return .app (← idx es (← jget a 1)) (← idx es (← jget a 2))
  | "l" => return .lam (parseName (← (← jget a 1).getStr?)) (← idx es (← jget a 3)) (← idx es (← jget a 4)) (biOf (← (← jget a 2).getStr?))
  | "p" => return .forallE (parseName (← (← jget a 1).getStr?)) (← idx es (← jget a 3)) (← idx es (← jget a 4)) (biOf (← (← jget a 2).getStr?))
  | "z" => return .letE (parseName (← (← jget a 1).getStr?)) (← idx es (← jget a 2)) (← idx es (← jget a 3)) (← idx es (← jget a 4)) (← (← jget a 5).getBool?)
  | "n" =>
    let s ← (← jget a 1).getStr?
    return .lit (.natVal (digitsVal s.toList))
  | "t" => return .lit (.strVal (← (← jget a 1).getStr?))
  | "m" => idx es (← jget a 2)
  | "j" => return .proj (parseName (← (← jget a 1).getStr?)) (← (← jget a 2).getNat?) (← idx es (← jget a 3))
  | t => throw s!"unknown node kind {t}"

def build (ps : Array Name) (tab : Json) : Except String Expr := do
  let mut es : Array Expr := #[]
  for nd in (← tab.getArr?) do
    es := es.push (← node ps es (← nd.getArr?))
  match es.back? with
  | some e => pure e
  | none => throw "an empty table"

partial def stripMData (e : Expr) : Expr :=
  e.replace fun s =>
    match s with
    | .mdata _ b => some (stripMData b)
    | _ => none

/-- the kernel's word on `foreign ≡ local` here: none when it accepts, the reason when it refuses -/
def kernelDefEq (lps : List Name) (foreign loc : Expr) (k : Nat) : MetaM (Option String) := do
  try
    withCurrHeartbeats do
      let eqT ← mkEq foreign loc
      let pf ← mkEqRefl loc
      let nm := Name.mkSimple ("_seam_check_" ++ toString k)
      withoutModifyingEnv do
        addDecl (Declaration.thmDecl { name := nm, levelParams := lps, type := eqT, value := pf })
      return none
  catch ex =>
    let msg ← ex.toMessageData.toString
    return some (if msg.length > 400 then (msg.toList.take 400).asString ++ "…" else msg)

structure Verdict where
  status : String
  part : String := ""
  detail : String := ""

def compareTerm (lps : List Name) (part : String) (foreign loc : Expr) (k : Nat) : MetaM Verdict := do
  let f := stripMData foreign
  let l := stripMData loc
  if f.equal l then return { status := "same", part }
  if f.eqv l then return { status := "same-kernel", part }
  let env ← getEnv
  let missing := f.getUsedConstants.filter fun c => !env.contains c
  if !missing.isEmpty then
    return { status := "names-absent", part, detail := ", ".intercalate (missing.toList.take 12 |>.map nameStr) }
  match (← kernelDefEq lps f l k) with
  | none => return { status := "defeq", part }
  | some why => return { status := "not-defeq", part, detail := why }

def rank : String → Nat
  | "same" => 0
  | "same-kernel" => 1
  | "defeq" => 2
  | _ => 3

/-- the worse of two verdicts on the parts of one constant -/
def worse (a b : Verdict) : Verdict := if rank b.status > rank a.status then b else a

def jsonLine (n k : String) (v : Verdict) (ms : Nat) : String :=
  "{\"n\":" ++ jstr n ++ ",\"k\":" ++ jstr k ++ ",\"status\":" ++ jstr v.status ++ ",\"part\":" ++ jstr v.part ++
  ",\"detail\":" ++ jstr v.detail ++ ",\"ms\":" ++ toString ms ++ "}"

/-- the foreign statement pseudo-entry against the local root with `inner` unfolded once -/
def checkUnfolded (j : Json) (rootN innerN : Name) (k : Nat) : MetaM Verdict := do
  let env ← getEnv
  let some (.defnInfo rv) := env.find? rootN | return { status := "absent", detail := "root" }
  let some (.defnInfo iv) := env.find? innerN | return { status := "absent", detail := "inner" }
  let .lam _ _ body _ := iv.value | return { status := "shape", detail := "the inner value is not a lambda" }
  match build #[] (j.getObjValD "t") with
  | .error e => return { status := "parse-error", detail := e }
  | .ok f => compareTerm [] "statement" f (unfoldIn rv.value innerN body) k

def ctorNames (m : Json) : List String :=
  match (m.getObjValD "ctors").getArr? with
  | .ok a => a.toList.map fun c => (c.getStr?.toOption.getD "")
  | .error _ => []

/-- one foreign constant against the local one of the same name -/
def checkConst (j : Json) (n kind : String) (k : Nat) : MetaM Verdict := do
  let env ← getEnv
  let some ci := env.find? (parseName n) | return { status := "absent" }
  if SeamExport.kindStr ci != kind then
    return { status := "shape", detail := "kind " ++ kind ++ ", here " ++ SeamExport.kindStr ci }
  let lpF := match j.getObjValD "lp" with
    | .arr a => a.size
    | _ => 0
  if lpF != ci.levelParams.length then
    return { status := "shape", detail := "universe parameters " ++ toString lpF ++ ", here " ++ toString ci.levelParams.length }
  let ps := ci.levelParams.toArray
  let tF ← match build ps (j.getObjValD "t") with
    | .error e => return { status := "parse-error", part := "type", detail := e }
    | .ok t => pure t
  let vt ← compareTerm ci.levelParams "type" tF ci.type k
  let mut v := vt
  if let .inductInfo iv := ci then
    let fc := ctorNames (j.getObjValD "meta")
    if fc != iv.ctors.map nameStr then
      v := worse v { status := "shape", part := "constructors", detail := ", ".intercalate fc }
  if let some vl := SeamExport.valueOf? ci then
    let vj := j.getObjValD "v"
    let vF? : Except String Expr := (match vj with
      | .arr _ => build ps vj
      | _ => .error "no foreign value")
    match vF? with
    | .error e => v := worse v { status := "parse-error", part := "value", detail := e }
    | .ok vF =>
      -- the value is compared only where the types agree here (else the equation is ill-typed)
      if rank vt.status ≤ 2 then
        v := worse v (← compareTerm ci.levelParams "value" vF vl (k + 1000000))
      else
        v := worse v { status := "not-defeq", part := "value", detail := "not compared: the types already differ" }
  return v

/-- `run label unfold` reads $SEAM_IN/<label>.jsonl, writes $SEAM_OUT/cross-<label>.jsonl -/
def run (label : String) (unfold : Option (Name × Name) := none) : MetaM Unit := do
  let inDir := (← IO.getEnv "SEAM_IN").getD "."
  let outDir := (← IO.getEnv "SEAM_OUT").getD "."
  let text ← IO.FS.readFile ⟨inDir ++ "/" ++ label ++ ".jsonl"⟩
  let mut out : Array String := #[]
  let mut counts : Std.HashMap String Nat := {}
  let mut k := 0
  let mut header := ""
  for line in text.splitOn "\n" do
    if line.isEmpty then continue
    let j ← match Json.parse line with
      | .ok j => pure j
      | .error e => throwError "SeamCross: unreadable line: {e}"
    if let .ok h := j.getObjValAs? String "header" then
      header := h
      continue
    let n ← match j.getObjValAs? String "n" with
      | .ok s => pure s
      | .error e => throwError "SeamCross: {e}"
    let kind := (j.getObjValAs? String "k").toOption.getD "?"
    k := k + 1
    let t0 ← IO.monoMsNow
    let v ← if kind == "typeOnly" then
        pure ({ status := "skipped" } : Verdict)
      else if kind == "unfolded" then
        (match unfold with
          | some (rootN, innerN) => checkUnfolded j rootN innerN k
          | none => pure { status := "skipped" })
      else checkConst j n kind k
    let t1 ← IO.monoMsNow
    counts := counts.insert v.status ((counts.getD v.status 0) + 1)
    out := out.push (jsonLine n kind v (t1 - t0))
  let summary := counts.toList.map fun (s, c) => jstr s ++ ":" ++ toString c
  let path : System.FilePath := ⟨outDir ++ "/cross-" ++ label ++ ".jsonl"⟩
  let h ← IO.FS.Handle.mk path .write
  h.putStrLn ("{\"cross\":" ++ jstr label ++ ",\"foreign\":" ++ jstr header ++ ",\"lean\":" ++ jstr Lean.versionString ++
    ",\"githash\":" ++ jstr Lean.githash ++ ",\"counts\":{" ++ ",".intercalate summary ++ "}}")
  for l in out do h.putStrLn l
  h.flush
  IO.println s!"SeamCross {label}: {k} constants read, {counts.toList}; {path}"

end SeamCross
