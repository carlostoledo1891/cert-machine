/- Census of the five theorems' closure (cert-machine, VP ≠ VNP lane; rows CEN and T3 of corpus/vp-vnp/PREREG.md).
   Run in the release's environment:  lake env lean Census.lean
   Walks every constant the five Solution theorems use (types, values, constructors), maps each to its module, and
   checks the Lean names of the paper's Table 3 (Appendix Q, prefix Paper.): does each exist, is it on the route. MIT -/
import Solution
open Lean Elab Command

def table3 : List String := ["cor_allclasses", "cor_classes", "cor_clauses", "cor_clauses_hc", "def_acc", "def_approx", "def_cases", "def_cut", "def_law", "def_price", "def_spectral", "def_spectral_congr", "eq_Q", "eq_window", "exists_setting", "lem_angle", "lem_balanced", "lem_circuit", "lem_circuit_perm", "lem_convex", "lem_count", "lem_exponents", "lem_few", "lem_few_approx", "lem_first", "lem_fkl_perm", "lem_fkl_perm_printed", "lem_growth", "lem_hubs", "lem_hubs_further", "lem_lowdeg", "lem_means", "lem_postpone", "lem_runnet", "lem_tele", "lem_toolkit", "lem_toolkit_a", "lem_toolkit_b", "lem_toolkit_c", "lem_toolkit_d", "lem_toolkit_e", "lem_toolkit_f", "lem_toolkit_c_minimizer", "lem_transfer", "lem_transfer_approx", "lem_words", "projection_nearest", "prop_approx_acc", "prop_approx_acc_setting", "prop_crossing", "prop_cube", "prop_extend", "prop_flat_lower", "prop_flat_lower_printed", "prop_flat_rate", "prop_flat_rate_printed", "prop_gauge", "prop_grid", "prop_hc_grid", "prop_identity", "prop_next", "prop_pieces", "prop_pieces_identity", "prop_random", "prop_space", "prop_tower", "prop_tower_representatives", "prop_universal", "scales_setting", "thm_allfields", "thm_alt", "thm_approx", "thm_cn", "thm_contracting", "thm_cut", "thm_duality", "thm_flat_rate", "thm_flat_simple", "thm_laws", "thm_main", "thm_main_form", "thm_noacc", "thm_onecut", "thm_poincare", "thm_simple", "thm_tree", "thm_tree_good"]

/-- Theorems L.2, Corollary L.3, Proposition E.5, Theorem E.6: "not on that route" by Appendix Q.3. -/
def offRouteClaimed : List String := ["thm_simple", "cor_classes", "prop_flat_lower", "thm_flat_simple"]

def projectRoots : List String := ["Statement", "Solution", "Challenge", "Paper", "Nc", "NS1", "Ov"]

run_cmd do
  let env ← getEnv
  let roots : Array Name := #[`Solution.mainTheorem, `Solution.mainTheoremApprox, `Solution.separation,
    `Solution.separationClosure, `Solution.permanent_over_real]
  let mut seen : NameSet := {}
  let mut stack : Array Name := roots
  let mut missing : Array Name := #[]
  while stack.size > 0 do
    let n := stack.back!
    stack := stack.pop
    if seen.contains n then continue
    seen := seen.insert n
    match env.find? n with
    | some ci =>
      for m in ci.getUsedConstants do
        unless seen.contains m do stack := stack.push m
      if let .inductInfo v := ci then
        for c in v.ctors do
          unless seen.contains c do stack := stack.push c
    | none => missing := missing.push n
  let mods := env.header.moduleNames
  let mut reached : NameSet := {}
  let mut nProject := 0
  for n in seen.toList do
    if let some idx := env.getModuleIdxFor? n then
      let mn := mods[idx.toNat]!
      reached := reached.insert mn
      if projectRoots.contains mn.getRoot.toString then nProject := nProject + 1
  let isProj (mn : Name) : Bool := projectRoots.contains mn.getRoot.toString
  let projAll := mods.filter isProj
  let projReached := reached.toList.filter isProj
  logInfo m!"CEN constants in the closure: {seen.size}; of them in project modules: {nProject}; missing: {missing.size}"
  logInfo m!"CEN modules reached: {reached.size} of {mods.size} imported; project modules reached: {projReached.length} of {projAll.size}"
  for r in projectRoots do
    let a := (projAll.filter (fun m => m.getRoot.toString == r)).size
    let b := (projReached.filter (fun m => m.getRoot.toString == r)).length
    logInfo m!"CEN by root {r}: {b} of {a} modules reached"
  let unreached := projAll.filter (fun m => !reached.contains m)
  logInfo m!"CEN project modules NOT reached: {unreached.toList}"
  for r in roots do
    if let some ci := env.find? r then
      let ps := ci.getUsedConstants.filter (fun m => m.getRoot == `Paper)
      logInfo m!"T3 direct Paper constants of {r}: {ps.toList}"
  let mut exist := 0
  let mut onRoute := 0
  for t in table3 do
    let nm := Name.mkStr `Paper t
    let e := env.contains nm
    let o := seen.contains nm
    if e then exist := exist + 1
    if o then onRoute := onRoute + 1
    logInfo m!"T3 Paper.{t} exists={e} onRoute={o}"
  logInfo m!"T3 summary: {exist} of {table3.length} Table 3 names exist, {onRoute} on the route"
  for t in offRouteClaimed do
    logInfo m!"T3 claimed off the route: Paper.{t} exists={env.contains (Name.mkStr `Paper t)} onRoute={seen.contains (Name.mkStr `Paper t)}"
