/-
  zq-trackb-check.lean — cert-machine's own checks for the Track B decision on the claim "ℤ is Diophantine in ℚ"
  (Elliot Glazer with AI agents, 2026-11-05): claimbox's conditional theorem at 125509a1 (lean/zinq).
  Pre-registered in notes/zq-trackb-preregistration-2026-11-06.md (B5 a–d).

  THE THEOREM IS UNDECIDED HERE. These checks read types and definition values syntactically (never unfolding a tower;
  the constants are 2↑↑7-sized) and decide: that each target's type is exactly the pinned hypotheses followed by Glazer's
  frozen statement F (alpha-equivalence, `Expr.eqv`); that F mentions nothing of claimbox's or ours; a screen of each
  hypothesis against circularity (not a decision of its meaning); and what HypG says, with the six rationals of the
  point and the curve computed by Lean for the desk to compare with the manuscript.

  One JSON line per fact into $ZQ_TRACKB_OUT. $ZQ_TRACKB_TARGETS, a comma-separated list of name:mode (mode 8, 9 or G),
  replaces the pinned targets for the planted controls; the G-meaning lines are written only for the pinned run.
  tools/runpod-zq-trackb.sh swaps the import lines below for the controls.

  usage (in the copy of claimbox's project, after `lake build CertMachineZQ`):
    ZQ_TRACKB_OUT=/path/check.jsonl [ZQ_TRACKB_TARGETS=…] lake env lean zq-trackb-check.lean
-/
import CertMachineZQ
import Lean

open Lean Meta

namespace ZqTrackBCheck

def frozen : Name := `ZInQ.exists_bounded_integer_polynomial_defining_integers
def hypG : Name := `CondZQ.HypG
def hyps8 : List Name :=
  [`CondZQ.HypM, `CondZQ.HypH, `CondZQ.HypPC, `CondZQ.HypC, `CondZQ.HypLT, `CondZQ.HypCC, `CondZQ.HypH1, `CondZQ.HypH2]

def pinned : List (Name × String) := [
  (`CondZQ.exists_bounded_integer_polynomial_defining_integers_of_eight_hypotheses, "8"),
  (`CondZQ.exists_bounded_integer_polynomial_defining_integers_of_hypotheses, "9"),
  (`CondZQ.hypG_holds, "G"),
  (`CertMachineZQ.trackB_eight, "8"), (`CertMachineZQ.trackB_nine, "9"), (`CertMachineZQ.trackB_G, "G")]

/-- the module roots that are claimbox's or ours (never Glazer's, Mathlib's or core's) -/
def localRoots : List Name := [`CondZQ, `Checks, `Planted, `CertMachineZQ, `CertMachineZQPlant]

def kindOf : ConstantInfo → String
  | .axiomInfo _ => "axiom"
  | .defnInfo _ => "def"
  | .thmInfo _ => "theorem"
  | .opaqueInfo _ => "opaque"
  | .quotInfo _ => "quot"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "constructor"
  | .recInfo _ => "recursor"

def modOf (env : Environment) (n : Name) : Name :=
  match env.getModuleIdxFor? n with
  | some i => env.header.moduleNames[i.toNat]!
  | none => `«(this file)»

def isLocal (env : Environment) (n : Name) : Bool :=
  let m := modOf env n
  m == `«(this file)» || localRoots.any (·.isPrefixOf m)

/-- exactly `n` leading ∀ binders: their domains and the body (with the binders' bound variables loose) -/
def peelN : Nat → Expr → Option (Array Expr × Expr)
  | 0, e => some (#[], e)
  | n + 1, .forallE _ d b _ => (peelN n b).map fun (ds, body) => (#[d] ++ ds, body)
  | _ + 1, _ => none

/-- every leading ∀ binder's domain (at most 64) -/
def peelAll : Nat → Expr → Array Expr
  | 0, _ => #[]
  | n + 1, .forallE _ d b _ => #[d] ++ peelAll n b
  | _ + 1, _ => #[]

def namesJson (xs : Array Name) : Json := Json.arr (xs.map fun n => Json.str n.toString)
def sortNames (xs : Array Name) : Array Name := xs.qsort fun a b => a.toString < b.toString

def exprJson (e : Expr) : MetaM Json := do
  if e.isConst then return Json.str e.constName!.toString
  return Json.str s!"{← ppExpr e}"

/-- the constants an expression uses, grouped by the root of their defining module -/
def byRoot (env : Environment) (e : Expr) : Json :=
  let cs := sortNames e.getUsedConstants
  let roots := (cs.map fun c => (modOf env c).getRoot.toString).toList.eraseDups
  Json.mkObj (roots.map fun r => (r, namesJson (cs.filter fun c => (modOf env c).getRoot.toString == r)))

/-- a value as Lean prints it, or null -/
def prettyOf (value? : Option Expr) : MetaM Json := do
  match value? with
  | some v => return Json.str s!"{← ppExpr v}"
  | none => return Json.null

/-- B5(c): the screen of one hypothesis constant against circularity -/
def screen (fType : Expr) (h : Name) : MetaM Json := do
  let env ← getEnv
  let some ci := env.find? h | return Json.mkObj [("type", "screen"), ("name", h.toString), ("found", false)]
  let isProp := ci.type == mkSort Level.zero
  let value? := match ci with | .defnInfo v => some v.value | _ => none
  let isFalse := value?.any (·.isConstOf ``False)
  -- the definitions of claimbox's or our modules reached through definition values
  let mut todo : Array Name := #[h]
  let mut seen : NameSet := {}
  let mut reached : Array Name := #[]
  let mut containsF : Array Name := #[]
  let mut mentionsFrozen : Array Name := #[]
  while !todo.isEmpty do
    let c := todo.back!
    todo := todo.pop
    if seen.contains c then continue
    seen := seen.insert c
    if let some (.defnInfo v) := env.find? c then
      reached := reached.push c
      if (v.value.find? (·.eqv fType)).isSome then containsF := containsF.push c
      let used := v.value.getUsedConstants
      if used.contains frozen then mentionsFrozen := mentionsFrozen.push c
      for d in used do
        if isLocal env d && !seen.contains d then todo := todo.push d
  let flagged := !(ci matches .defnInfo _) || !isProp || isFalse || !containsF.isEmpty || !mentionsFrozen.isEmpty
  -- the hypothesis as Lean prints it, recorded beside the screen (informational, amendment A; its own function since
  -- amendment C: a `return` in a `match` arm here returned from the whole of `screen`)
  let pretty ← prettyOf value?
  return Json.mkObj [
    ("type", "screen"), ("name", h.toString), ("found", true), ("module", (modOf env h).toString),
    ("kind", kindOf ci), ("isProp", isProp), ("valueIsFalse", isFalse),
    ("reachedDefinitions", reached.size), ("containsF", namesJson (sortNames containsF)),
    ("mentionsFrozen", namesJson (sortNames mentionsFrozen)), ("flagged", flagged),
    ("valueConstants", match value? with | some v => byRoot env v | none => Json.null),
    ("pretty", pretty)]

/-- B5(a): one target's type against the pinned hypotheses and F (or HypG) -/
def checkTarget (fType : Expr) (n : Name) (mode : String) : MetaM (Json × Array Name) := do
  let env ← getEnv
  let some ci := env.find? n | return (Json.mkObj [("type", "target"), ("name", n.toString), ("found", false)], #[])
  let expect : List Name := if mode == "9" then hypG :: hyps8 else if mode == "8" then hyps8 else []
  let goal : Expr := if mode == "G" then mkConst hypG else fType
  let (doms, body, peeled) := match peelN expect.length ci.type with
    | some (ds, b) => (ds, b, true)
    | none => (#[], ci.type, false)
  let domsOk := peeled && doms.size == expect.length &&
    (doms.toList.zip expect).all fun (d, h) => d.equal (mkConst h)
  let closed := !body.hasLooseBVars
  let eqv := closed && body.eqv goal
  let equal := closed && body.equal goal
  let all := peelAll 64 ci.type
  let domainConsts := all.filterMap fun d => if d.isConst && !d.hasLooseBVars then some d.constName! else none
  let pass := kindOf ci == "theorem" && ci.levelParams.isEmpty && domsOk && closed && eqv
  let axs ← collectAxioms n
  return (Json.mkObj [
    ("type", "target"), ("name", n.toString), ("found", true), ("mode", mode), ("module", (modOf env n).toString),
    ("kind", kindOf ci), ("levelParams", ci.levelParams.length), ("binders", all.size),
    ("domains", Json.arr (← all.mapM exprJson)), ("expected", namesJson expect.toArray),
    ("domainsOk", domsOk), ("bodyClosed", closed), ("conclusionEqv", eqv), ("conclusionEqual", equal),
    ("conclusionHash", toString body.hash), ("goalHash", toString goal.hash),
    ("leanAxioms", namesJson (sortNames axs)), ("pass", pass)], domainConsts)

def ratJson (q : ℚ) : Json := Json.mkObj [("num", toString q.num), ("den", toString q.den)]

/-- our own elaborations of what B5(d) compares claimbox's definitions with -/
noncomputable def ourG : Prop := addOrderOf CondZQ.P0 = 0
noncomputable def ourPt : Type := CondZQ.E.toAffine.Point
noncomputable def ourE : WeierstrassCurve CondZQ.K0 :=
  { a₁ := 0, a₂ := 0, a₃ := 0, a₄ := -(CondZQ.dco * CondZQ.dco), a₆ := 0 }
noncomputable def ourK0 : Type := QuadraticAlgebra ℚ 2 0

def valueOf (n : Name) : MetaM (Option Expr) := do
  match (← getEnv).find? n with
  | some (.defnInfo v) => return some v.value
  | _ => return none

/-- an auxiliary proof constant the elaborator abstracts out of a definition (`<def>._proof_<i>`) -/
def isAuxProof : Name → Bool
  | .str _ s => s.startsWith "_proof_"
  | _ => false

/-- amendment A (B5(d)): each auxiliary proof constant replaced by `auxProof <its type>`, so two elaborations that
differ only in the NAMES of their abstracted proofs, of alpha-equivalent statements, compare equal; still syntactic -/
def normAux (e : Expr) : MetaM (Expr × Array Name) := do
  let env ← getEnv
  let aux := sortNames (e.getUsedConstants.filter isAuxProof)
  let tys := aux.filterMap fun n => (env.find? n).map fun ci => (n, ci.type)
  let e' := e.replace fun s => match s with
    | .const n _ => (tys.find? (·.1 == n)).map fun (_, t) => mkApp (mkConst `ZqTrackBCheck.auxProof) t
    | _ => none
  return (e', aux)

/-- B5(d): what HypG says -/
def gMeaning : MetaM Json := do
  let pair (a b : Name) : MetaM Json := do
    let (some x, some y) := (← valueOf a, ← valueOf b) | return Json.mkObj [("theirs", a.toString), ("found", false)]
    let (x', ax) ← normAux x
    let (y', ay) ← normAux y
    return Json.mkObj [("theirs", a.toString), ("ours", b.toString), ("found", true), ("eqv", x.eqv y),
      ("eqvUpToAuxProofNames", x'.eqv y'), ("auxProofsTheirs", namesJson ax), ("auxProofsOurs", namesJson ay),
      ("theirsPretty", s!"{← ppExpr x}")]
  let p0 ← getConstInfo `CondZQ.P0
  let p0v := match p0 with | .defnInfo v => some v.value | _ => none
  let args := (p0v.map Expr.getAppArgs).getD #[]
  let some_ := p0v.any (·.isAppOf ``WeierstrassCurve.Affine.Point.some)
  let xy := args.size ≥ 3 && args[args.size - 3]!.isConstOf `CondZQ.P0x && args[args.size - 2]!.isConstOf `CondZQ.P0y
  return Json.mkObj [
    ("type", "gMeaning"),
    ("HypG", ← pair `CondZQ.HypG ``ourG), ("Pt", ← pair `CondZQ.Pt ``ourPt),
    ("E", ← pair `CondZQ.E ``ourE), ("K0", ← pair `CondZQ.K0 ``ourK0),
    ("P0", Json.mkObj [("type", ← exprJson p0.type), ("typeIsPt", p0.type.isConstOf `CondZQ.Pt),
      ("isPointSome", some_), ("argsAreP0xP0y", xy), ("pretty", s!"{← ppExpr (p0v.getD (mkConst ``True))}")]),
    ("rationals", Json.mkObj [
      ("dco", Json.arr #[ratJson CondZQ.dco.re, ratJson CondZQ.dco.im]),
      ("P0x", Json.arr #[ratJson CondZQ.P0x.re, ratJson CondZQ.P0x.im]),
      ("P0y", Json.arr #[ratJson CondZQ.P0y.re, ratJson CondZQ.P0y.im])])]

def run : MetaM Unit := do
  let some out ← IO.getEnv "ZQ_TRACKB_OUT" | throwError "zq-trackb-check: set ZQ_TRACKB_OUT"
  let targetsEnv ← IO.getEnv "ZQ_TRACKB_TARGETS"
  let targets : List (Name × String) := match targetsEnv with
    | some s => (s.splitOn ",").filterMap fun t => match t.splitOn ":" with
        | [n, m] => some (n.toName, m)
        | _ => none
    | none => pinned
  let env ← getEnv
  let h ← IO.FS.Handle.mk out .write
  let line (j : Json) : IO Unit := h.putStrLn j.compress
  let fci ← getConstInfo frozen
  let fType := fci.type
  -- B5(b): F, and what it is built from
  let fConsts := sortNames fType.getUsedConstants
  let localInF := fConsts.filter (isLocal env)
  line <| Json.mkObj [
    ("type", "frozen"), ("name", frozen.toString), ("module", (modOf env frozen).toString), ("kind", kindOf fci),
    ("levelParams", fci.levelParams.length), ("hash", toString fType.hash),
    ("leanAxioms", namesJson (sortNames (← collectAxioms frozen))),
    ("constants", Json.arr (fConsts.map fun c => Json.arr #[Json.str c.toString, Json.str (modOf env c).toString])),
    ("localConstants", namesJson localInF), ("pass", localInF.isEmpty && fci.levelParams.isEmpty)]
  -- B5(a), then B5(c) on every hypothesis constant a target binds
  let mut hyps : Array Name := #[]
  for (n, m) in targets do
    let (j, ds) ← checkTarget fType n m
    line j
    for d in ds do
      if !hyps.contains d then hyps := hyps.push d
  for d in hyps do
    line (← screen fType d)
  -- B5(d), the pinned run only
  if targetsEnv.isNone then line (← gMeaning)
  line <| Json.mkObj [("type", "summary"), ("lean", Lean.versionString), ("githash", Lean.githash),
    ("targets", targets.length), ("screened", hyps.size)]
  h.flush

end ZqTrackBCheck

#eval ZqTrackBCheck.run
