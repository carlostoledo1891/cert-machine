/- CEN additions (cert-machine, ω = 9/4 lane; the control room's notes N2, N3 and the reader's note on `rigidity`,
   2026-11-25). Run in the release's environment after the two extra modules are built:  lake env lean CENX.lean
   For every OAI constant whose last name component is one of the targets below, or whose name mentions `rigidity`
   or `installations`: its kind, module, type, the axioms it depends on, and whether it lies on the route (the
   closure, proofs included) of the three Comparator theorems. Output lines start CENX. MIT -/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import OAI.LinearAlgebra.SpectralBooks.DivisionExponent
import OAI.LinearAlgebra.SpectralBooks.CircuitRankSpecialization
import Lean
open Lean Elab Command

def usedConstsX (ci : ConstantInfo) : Array Name :=
  match ci with
  | .thmInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .defnInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .opaqueInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .ctorInfo v => v.type.getUsedConstants.push v.induct
  | .recInfo v => v.type.getUsedConstants ++ v.all.toArray ++ (v.rules.toArray.map (·.ctor)) ++
      (v.rules.toArray.flatMap (·.rhs.getUsedConstants))
  | .inductInfo v => v.type.getUsedConstants ++ v.ctors.toArray ++ v.all.toArray
  | _ => ci.type.getUsedConstants

def kindX : ConstantInfo → String
  | .thmInfo _ => "theorem"
  | .defnInfo _ => "def"
  | .opaqueInfo _ => "opaque"
  | .axiomInfo _ => "axiom"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "ctor"
  | .recInfo _ => "rec"
  | .quotInfo _ => "quot"

def modOfX (env : Environment) (n : Name) : Name :=
  match env.getModuleIdxFor? n with
  | some idx => env.header.moduleNames[idx.toNat]!
  | none => `_current

run_cmd do
  let env ← getEnv
  let roots : Array Name := #[`OAI.LinearAlgebra.SpectralBooks.square_exponent,
    `OAI.LinearAlgebra.SpectralBooks.dual_exponent, `OAI.LinearAlgebra.SpectralBooks.rectangular_exponent]
  let mut seen : NameSet := {}
  let mut stack := roots
  while stack.size > 0 do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    if let some ci := env.find? n then
      for m in usedConstsX ci do
        unless seen.contains m do stack := stack.push m
  logInfo m!"CENX route of the three theorems: {seen.size} constants"
  let targets := ["divisionOmega_square_eq_formalOmega", "divisionOmega", "DivisionAdmissibleExponent",
    "algebraicClosure_rank_le_twice_cost", "algebraicClosure_rank_le_twice_productQuotientCount",
    "matrix_tensorRank_algebraicClosure_le_fractionRing", "omega_eq", "omega_eq_and_rigidity",
    "contact_of_installations", "formalOmega_square_eq_omega", "RationalMatrixAlgorithm", "omega"]
  let mut hits : Array (Name × ConstantInfo) := #[]
  for (n, ci) in env.constants.toList do
    if n.getRoot == `OAI && !n.isInternal then
      let last := match n with
        | .str _ s => s
        | _ => ""
      let s := n.toString.toLower
      if targets.contains last || (s.splitOn "rigidity").length > 1 || (s.splitOn "installations").length > 1 then
        hits := hits.push (n, ci)
  logInfo m!"CENX matching constants: {hits.size}"
  for (n, ci) in hits do
    let ax ← collectAxioms n
    logInfo m!"CENX {kindX ci} {n} in {modOfX env n} onRoute={seen.contains n} axioms={ax.toList} : {ci.type}"
