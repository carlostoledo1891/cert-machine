import KN1.Bridge.DepWalk
import KN1.Bridge.Cheat
import KN1.Bridge.Targets
import KN1.Proved
import KNConjectures
import Hypergraph.BondRepresentation
import Hypergraph.FiniteHyperGluingClosed

/-!
# KN1.Bridge.Walk — the dependency walks of K2, and red control KR2

The walk itself (`KN3DepWalk.walk`, `chain`, `kindOf`, `moduleOf`, `provesStatement`) is the sibling item's
`DepWalk.lean`, unchanged. This file adds what the rule sheet of THIS item asks for:

* the report lists every reached constant declared OUTSIDE Mathlib (with its dependencies) and OUTSIDE our own
  files — that is, in the lab's library or in the third party's — with its kind and module;
* the forbidden NAMES are fixed here once (`forbiddenNames`), the forbidden STATEMENTS too (`statements`); a name
  of either list that is not in the environment is reported (a misspelt name would otherwise never flag);
* a reached constant other than the root whose TYPE is a forbidden statement is FLAGGED — syntactically as in the
  sibling's walk (the constant itself, or the body of its definition), and, for every reached constant that is not
  Mathlib's, also up to definitional equality with the body of each statement;
* every THEOREM of either library that a CLEAN walk reaches gets its own walk, printed after it.

This file imports the whole of `KNConjectures`, two modules of `Hypergraph` and the proofs (through
`KN1.Bridge.Cheat`, `KN1.Proved`) only so that the forbidden names exist; what a theorem of `KN1.Bridge.Compare`
reaches does not depend on what is imported here.
-/

open Lean Elab Command Meta

namespace KN1Walk

open KN3DepWalk

/-- First components of the module names of Mathlib and of what Mathlib depends on. -/
def familyRoots : List String :=
  ["Init", "Lean", "Std", "Mathlib", "Batteries", "Aesop", "Qq", "ProofWidgets", "Plausible", "ImportGraph",
    "LeanSearchClient", "Cli"]

/-- First components of the module names of our own files. -/
def ourRoots : List String := ["KN1", "Printed", "Printed1", "Planted1", "OurChallenge"]

/-- "mathlib", "ours" or "library" (the lab's or the third party's), and the module. -/
def classOf (env : Environment) (n : Name) : String × String :=
  match moduleOf env n with
  | none => ("ours", "(this file)")
  | some m =>
    let s := m.toString
    let r := (s.splitOn ".").headD ""
    if familyRoots.contains r then ("mathlib", s)
    else if ourRoots.contains r then ("ours", s)
    else ("library", s)

/-- The forbidden names. Third party: the proofs of T1, T2, T3 and of the paper's Conjectures 1–4, 6 and Questions
7, 9 in its encoding, the theorems of its three routes to the inequality that conclude it or a form of it, and the
implications that conclude a target. Lab: the sibling item's list (its proof of Conjecture 3 and the theorems on
its way, its Conjecture 1 for three relays, its own transports of the statement). Ours: the K3 theorem. -/
def forbiddenNames : Array Name := #[
  -- third party, KNConjectures/Conjectures.lean
  `KNAll.conjecture1_holds, `KNAll.conjecture3_holds, `KNAll.conjecture4Fixed_holds, `KNAll.conjecture4_holds,
  `KNAll.conjecture2Strong_holds, `KNAll.conjecture2_holds, `KNAll.question7_holds, `KNAll.genY_all,
  -- third party, KN1Bridge.lean and KozmaNitzanConjecture1.lean (the second route)
  `KN1Statement.multiplicativeGluing_holds, `KN1Corollary.kozmaNitzan_conjecture1,
  `KN1Corollary.multiplicativeGluing_all, `KN1Corollary.gen_all, `KN1Corollary.surplusTransfer_all,
  -- third party, Conjecture 6, Conjecture 4's corollaries, Question 9
  `KNAll.Guarded.conjecture6Strong_holds, `KNAll.Guarded.conjecture6_holds,
  `KNAll.conjecture6_of_conjecture6Strong, `KNAll.conjecture6Strong_of_forceOpen_min,
  `KNAll.conjecture4_clusterProperty, `KNAll.conjecture4_clusterProperty_holds, `KNAll.conjecture4_size,
  `KNAll.conjecture4_sizeGE, `KNAll.setSourceFixedMin_holds, `KNAll.question9_holds,
  `KNAll.question9_of_setSourceFixedMin,
  -- third party, the hypergraph route (Hypergraph/BondRepresentation.lean:105, FiniteHyperGluingClosed.lean:501)
  `KNAll.Bond.conjecture1_of_hyperedgeGluing, `KNAll.Site.FiniteHyperGluingClosed.hyperedgeGluing,
  -- the lab (the sibling item's list)
  `Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds, `Percolation.Continuity.CSH.conjecture3_of_csh,
  `Percolation.Continuity.CSH.additiveGluing_holds, `Percolation.Continuity.CSH.additiveGluing_of_csh,
  `Percolation.Continuity.CSH.cshHolds, `Percolation.Continuity.CSH.cshAll,
  `Percolation.Continuity.CSH.additiveGluing_of_surplusTransfer_nondegenerate,
  `Percolation.Continuity.CSH.additiveGluing_of_surplusMargin_nondegenerate,
  `Percolation.Continuity.AGloc.additiveGluing_of_surplusTransfer,
  `Percolation.Continuity.AGloc.additiveGluing_of_agloc_firstRank,
  `Percolation.Continuity.additiveGluingGlue_proof, `Percolation.Continuity.additiveGluingSuffices_proof,
  `Percolation.Continuity.nearOneGluing_iff_conjecture3, `Percolation.Continuity.CovTau.kn_conj1_three,
  `Percolation.Literature.KozmaNitzan2024_conjecture3.fintype,
  `Percolation.Literature.KozmaNitzan2024_conjecture3.finSupp,
  `Percolation.Literature.KozmaNitzan2024_conjecture3.openConn_set,
  -- ours
  `conjecture1_as_printed]

/-- The forbidden statements: a reached constant (other than the root) with one of these for type is FLAGGED. -/
def statements : Array Name := #[
  `KNAll.Conjecture1, `KN1Statement.MultiplicativeGluing, `KN1Compare.T3, `KN1Transport.LabForm1,
  `KN1Printed.Conjecture1, `KN1Printed.Conjecture1_existsForm, `KN1Printed.Conjecture1_lowerBound,
  `KNAll.Conjecture2, `KNAll.Conjecture2Strong, `KNAll.Conjecture4, `KNAll.Conjecture4Fixed, `KNAll.Question7,
  `KNAll.Conjecture6, `KNAll.Conjecture6Strong, `KNAll.Question9, `KNAll.SetSourceFixedMin,
  `KNAll.Site.HyperedgeGluing,
  `Percolation.Literature.KozmaNitzan2024_conjecture3, `Percolation.Continuity.Statements.NearOneGluing,
  `Percolation.Continuity.Statements.AdditiveGluing, `KN3Printed.Conjecture3, `KN3Transport.LabForm]

structure Rep where
  flagged : Bool
  text : String
  libTheorems : Array Name

/-- Walk from `root` and build the report. -/
def runWalk (root : Name) : CommandElabM Rep := do
  let env ← getEnv
  let w := walk env root
  let names := w.parent.keys.toArray.qsort (fun a b => a.toString < b.toString)
  let mut kinds : Std.HashMap String Nat := {}
  let mut lib : Array String := #[]
  let mut libThms : Array Name := #[]
  let mut ours : Nat := 0
  let mut axioms : Array Name := #[]
  let mut flags : Array String := #[]
  let mut cands : Array (Name × ConstantInfo) := #[]
  for n in names do
    match env.find? n with
    | none => pure ()
    | some ci =>
      let k := kindOf ci
      kinds := kinds.insert k (kinds.getD k 0 + 1)
      if k == "axiom" then axioms := axioms.push n
      let (cls, modStr) := classOf env n
      if cls == "library" then
        lib := lib.push s!"    {n}  ({k})  [{modStr}]"
        if k == "theorem" || k == "axiom" || k == "opaque" then libThms := libThms.push n
      if cls == "ours" then ours := ours + 1
      if n != root then
        if cls != "mathlib" then cands := cands.push (n, ci)
        for s in statements do
          if provesStatement env ci s then
            flags := flags.push s!"    {n} has for type the statement {s}: {chain w n}"
  for f in forbiddenNames do
    if w.parent.contains f then
      flags := flags.push s!"    forbidden {f} is reached: {chain w f}"
  -- the same test up to definitional equality, on the reached constants that are not Mathlib's; made only when
  -- nothing is flagged yet (a walk already FLAGGED by a name or by a syntactic match stays FLAGGED)
  let mut defeqNote := s!"made on {cands.size} reached constants that are not Mathlib's"
  if flags.isEmpty then
    let found ← liftTermElabM do
      let mut found : Array String := #[]
      for (n, ci) in cands do
        if ci.levelParams.isEmpty then
          for s in statements do
            if let some (.defnInfo v) := env.find? s then
              let b ← Meta.withNewMCtxDepth do
                try Meta.isDefEq ci.type v.value catch _ => pure false
              if b then
                found := found.push
                  s!"    {n} has a type definitionally equal to the body of the statement {s}: {chain w n}"
      return found
    flags := flags ++ found
  else
    defeqNote := s!"not made (already FLAGGED; {cands.size} candidates)"
  let mut noProof : Nat := 0
  for a in axioms do
    unless a == ``propext || a == ``Classical.choice || a == ``Quot.sound do
      noProof := noProof + 1
  let flagged := !flags.isEmpty
  let kindLine := ", ".intercalate
    ((kinds.toArray.qsort (fun a b => a.1 < b.1)).toList.map fun (k, c) => s!"{c} {k}")
  let mut out := s!"kn1walk {root}: {names.size} constants reached through types and values\n"
  out := out ++ s!"  by kind: {kindLine}\n"
  out := out ++ s!"  axioms reached: {axioms.toList}\n"
  out := out ++ s!"  reached constants presented as axioms other than the three standard ones: {noProof}\n"
  out := out ++ s!"  names not found in the environment: {w.missing.toList}\n"
  out := out ++ s!"  declared in our own files: {ours}\n"
  out := out ++ s!"  declared outside Mathlib (and its dependencies) and outside our own files: {lib.size}\n"
  out := out ++ s!"  of which theorems, axioms or opaque constants: {libThms.size}\n"
  if lib.size ≤ 60 then
    for l in lib do out := out ++ l ++ "\n"
  else
    out := out ++ s!"    (not listed: {lib.size} constants; the first is {lib[0]!.trimAscii})\n"
  out := out ++ s!"  forbidden names: {forbiddenNames.size}, of which not in this environment: {(forbiddenNames.filter fun f => !env.contains f).toList}\n"
  out := out ++ s!"  forbidden statements: {statements.size}, of which not in this environment: {(statements.filter fun f => !env.contains f).toList}\n"
  out := out ++ s!"  test of the types up to definitional equality: {defeqNote}\n"
  if flagged then
    out := out ++ "  flags:\n"
    for l in flags do out := out ++ l ++ "\n"
  out := out ++ s!"  verdict: {if flagged then "FLAGGED" else "CLEAN"}"
  return { flagged, text := out, libTheorems := libThms }

/-- `#kn1_walk CLEAN|FLAGGED thm`: the walk of `thm` against the fixed lists; an ERROR when the verdict differs.
After a CLEAN walk, every library theorem it reached gets its own walk. -/
syntax (name := kn1walkCmd) "#kn1_walk " (&"CLEAN" <|> &"FLAGGED") ident : command

@[command_elab kn1walkCmd] def elabKn1Walk : CommandElab := fun stx => do
  let want : Bool := stx[1].getAtomVal == "FLAGGED" || stx[1][0].getAtomVal == "FLAGGED"
  let root ← liftCoreM <| realizeGlobalConstNoOverloadWithInfo stx[2]
  let r ← runWalk root
  logInfo r.text
  unless r.flagged do
    for t in r.libTheorems do
      let r' ← runWalk t
      logInfo s!"own walk of the library theorem {t}, reached by {root}:\n{r'.text}"
  unless r.flagged == want do
    throwError "kn1walk: expected {if want then "FLAGGED" else "CLEAN"}, got {if r.flagged then "FLAGGED" else "CLEAN"}"

/-- The two lists against the environment of this file: every name must exist. -/
syntax (name := kn1listsCmd) "#kn1_lists" : command

@[command_elab kn1listsCmd] def elabKn1Lists : CommandElab := fun _ => do
  let env ← getEnv
  let mf := forbiddenNames.filter fun f => !env.contains f
  let ms := statements.filter fun f => !env.contains f
  let mut out := s!"forbidden names: {forbiddenNames.size}; forbidden statements: {statements.size}\n"
  for f in forbiddenNames do
    if let some ci := env.find? f then
      out := out ++ s!"  {f}  ({kindOf ci})  [{(classOf env f).2}]\n"
  out := out ++ s!"not in this environment: names {mf.toList}, statements {ms.toList}"
  logInfo out
  unless mf.isEmpty && ms.isEmpty do throwError "kn1walk: a listed name is not in the environment"

end KN1Walk

#kn1_lists

/-! ## The checks that the mirror is each target, and that each target is the type of its theorem -/

#kn1_walk CLEAN KN1Compare.T1_iff_mirror
#kn1_walk CLEAN KN1Compare.T2_iff_mirror
#kn1_walk CLEAN KN1Compare.T3_iff_mirror
#kn1_walk CLEAN KN1Targets.T1_is_the_type
#kn1_walk CLEAN KN1Targets.T2_is_the_type
#kn1_walk CLEAN KN1Targets.T3_is_the_type

/-! ## K2: the six implications -/

#kn1_walk CLEAN KN1Compare.T1_to_R0
#kn1_walk CLEAN KN1Compare.R0_to_T1
#kn1_walk CLEAN KN1Compare.T2_to_R0
#kn1_walk CLEAN KN1Compare.R0_to_T2
#kn1_walk CLEAN KN1Compare.T3_to_R0
#kn1_walk CLEAN KN1Compare.R0_to_T3
#kn1_walk CLEAN KN1Compare.T1_iff_RE
#kn1_walk CLEAN KN1Compare.T1_iff_RL
#kn1_walk CLEAN KN1Compare.T1_to_RF

/-! ## KR2: the cheating proofs must be FLAGGED -/

#kn1_walk FLAGGED KN1Cheat.cheat_R0_to_T1
#kn1_walk FLAGGED KN1Cheat.cheat_R0_to_T2
#kn1_walk FLAGGED KN1Cheat.cheat_T1_via_T2
#kn1_walk FLAGGED KN1Cheat.cheat_via_lowerBound
#kn1_walk FLAGGED KN1Cheat.cheat_T1_to_R0

/-! ## K3 goes through the third party's proof, as it must: FLAGGED is the expected verdict here -/

#kn1_walk FLAGGED conjecture1_as_printed
