/- Census of the three theorems' closure (cert-machine, ω = 9/4 lane; row CEN of corpus/omega-nine-fourths/PREREG.md).
   Run in the release's environment:  lake env lean Census.lean
   The VP ≠ VNP lane's census (instruments/vp-vnp/census/Census.lean) for this release: walks every constant the three
   theorems use (types and values; constructors and recursors of inductives), maps each to its module; walks the
   STATEMENT base alone (types of theorems, types and bodies of definitions — never a proof); lists the axioms and
   opaque constants reached; prints the imported modules (compared, outside Lean, with the sealed A1 closure); and lists
   every constant of the environment under OAI whose name mentions border rank, asymptotic rank or division, with its
   type (G2, G3: is any such theorem in the closure at all). Output lines start CEN / CENMOD / CENIMP / CENSTMT / CENAX
   / CENOPQ / CENG. MIT -/
import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import Lean
open Lean Elab Command

/-- The constants a declaration mentions: its type and, if any, its value (a theorem's proof included). -/
def usedConsts (ci : ConstantInfo) : Array Name :=
  match ci with
  | .thmInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .defnInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .opaqueInfo v => v.type.getUsedConstants ++ v.value.getUsedConstants
  | .ctorInfo v => v.type.getUsedConstants.push v.induct
  | .recInfo v => v.type.getUsedConstants ++ v.all.toArray ++ (v.rules.toArray.map (·.ctor)) ++
      (v.rules.toArray.flatMap (·.rhs.getUsedConstants))
  | .inductInfo v => v.type.getUsedConstants ++ v.ctors.toArray ++ v.all.toArray
  | _ => ci.type.getUsedConstants

/-- The constants needed to STATE a declaration: a theorem contributes its type only, never its proof. -/
def stmtConsts (ci : ConstantInfo) : Array Name :=
  match ci with
  | .thmInfo v => v.type.getUsedConstants
  | _ => usedConsts ci

def walk (env : Environment) (roots : Array Name) (f : ConstantInfo → Array Name) : NameSet × Array Name := Id.run do
  let mut seen : NameSet := {}
  let mut stack := roots
  let mut missing : Array Name := #[]
  while stack.size > 0 do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    match env.find? n with
    | some ci =>
      for m in f ci do
        unless seen.contains m do stack := stack.push m
      if let .inductInfo v := ci then
        for c in v.ctors do
          unless seen.contains c do stack := stack.push c
    | none => missing := missing.push n
  return (seen, missing)

def kind : ConstantInfo → String
  | .thmInfo _ => "theorem"
  | .defnInfo _ => "def"
  | .opaqueInfo _ => "opaque"
  | .axiomInfo _ => "axiom"
  | .inductInfo _ => "inductive"
  | .ctorInfo _ => "ctor"
  | .recInfo _ => "rec"
  | .quotInfo _ => "quot"

def modOf (env : Environment) (n : Name) : Name :=
  match env.getModuleIdxFor? n with
  | some idx => env.header.moduleNames[idx.toNat]!
  | none => `_current

run_cmd do
  let env ← getEnv
  let roots : Array Name := #[`OAI.LinearAlgebra.SpectralBooks.square_exponent,
    `OAI.LinearAlgebra.SpectralBooks.dual_exponent, `OAI.LinearAlgebra.SpectralBooks.rectangular_exponent]
  let (seen, missing) := walk env roots usedConsts
  let (stmt, smissing) := walk env roots stmtConsts
  let mods := env.header.moduleNames
  let modOf := modOf env
  -- counts per module
  let mut perMod : Std.HashMap Name Nat := {}
  let mut nOAI : Nat := 0
  for n in seen.toList do
    let mn := modOf n
    perMod := perMod.insert mn (perMod.getD mn 0 + 1)
    if mn.getRoot == `OAI then nOAI := nOAI + 1
  logInfo m!"CEN constants in the closure of the three theorems: {seen.size}; in OAI modules: {nOAI}; missing: {missing.size} {missing.toList.take 20}"
  logInfo m!"CEN modules imported: {mods.size}; modules reached by the closure: {perMod.size}"
  for (mn, c) in perMod.toList do
    logInfo m!"CENMOD {mn} {c}"
  for mn in mods do
    logInfo m!"CENIMP {mn}"
  -- the statement base
  let mut sPerRoot : Std.HashMap Name Nat := {}
  for n in stmt.toList do
    let r := (modOf n).getRoot
    sPerRoot := sPerRoot.insert r (sPerRoot.getD r 0 + 1)
  logInfo m!"CEN statement base (types of theorems, types and bodies of definitions): {stmt.size} constants; missing {smissing.size}; by module root: {sPerRoot.toList}"
  for n in stmt.toList do
    if (modOf n).getRoot == `OAI then
      if let some ci := env.find? n then
        logInfo m!"CENSTMT {kind ci} {n} in {modOf n}"
  -- axioms and opaque constants reached
  for n in seen.toList do
    if let some ci := env.find? n then
      match ci with
      | .axiomInfo _ => logInfo m!"CENAX {n} in {modOf n}"
      | .opaqueInfo _ => logInfo m!"CENOPQ {n} in {modOf n} inStatementBase={stmt.contains n}"
      | _ => pure ()
  -- G2/G3: every OAI constant in this environment whose name mentions border rank, asymptotic rank or division
  let keys := ["border", "asymptot", "division", "divgate", "withdiv", "perN", "ceil"]
  let mut g : Nat := 0
  for (n, ci) in env.constants.toList do
    if n.getRoot == `OAI && !n.isInternal then
      let s := n.toString.toLower
      if keys.any (fun k => (s.splitOn k.toLower).length > 1) then
        g := g + 1
        if g ≤ 400 then
          logInfo m!"CENG {kind ci} {n} in {modOf n} onRoute={seen.contains n} : {ci.type}"
  logInfo m!"CEN G2/G3 names in OAI constants of this environment: {g}"
