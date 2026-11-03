import OAI.Bridges.AnthropicETH.Reduction
import OAI.Bridges.AnthropicETH.Simulation
import OAI.Bridges.AnthropicETH.Converter
import OAI.Bridges.AnthropicETH.Main

/-!
# RPI-378.3 audit

Building this module **fails** unless every check below passes; on success it reports the counts
and prints the axioms.

1. **Module check.** No module whose name starts with `OAI.Algorithms`, `OAI.Bridges.ETH`,
   `Solution`, `Challenge`, `WidthThree`, `PaddedDescent`, `Groundwork`, `ToTuring` or `Bridge` is
   loaded.
2. **Constant check**, for each audited theorem: every constant reachable from its statement and
   proof avoids the forbidden prefixes (`OAI.Algorithms`, `OAI.Bridges.ETH`,
   `MainResults.ethIsFalse`, `MainResults.mainTheorem`, `Sat3`, `WidthThree`, `Groundwork`,
   `Bridge`), and every reachable `OAI.*` constant lies in `OAI.ParityWL`,
   `OAI.Combinatorics.ParityLifts` or `OAI.Bridges.AnthropicETH`.
3. **Axiom check**, for each audited theorem: its axioms are among `propext`,
   `Classical.choice`, `Quot.sound` (this also rules out `sorryAx`).
-/

open Lean Meta Elab Command

namespace OAI.Bridges.AnthropicETH.Audit

/-- Module-name prefixes that must be absent from the environment. -/
def forbiddenModulePrefixes : List Name :=
  [`OAI.Algorithms, `OAI.Bridges.ETH, `Solution, `Challenge, `WidthThree, `PaddedDescent,
    `Groundwork, `ToTuring, `Bridge]

/-- Constant-name prefixes that must be absent from the dependency closure. -/
def forbiddenConstPrefixes : List Name :=
  [`OAI.Algorithms, `OAI.Bridges.ETH, `MainResults.ethIsFalse, `MainResults.mainTheorem,
    `Sat3, `WidthThree, `Groundwork, `Bridge]

/-- The only `OAI` namespaces an audited theorem may depend on. -/
def permittedOAIPrefixes : List Name :=
  [`OAI.ParityWL, `OAI.Combinatorics.ParityLifts, `OAI.Bridges.AnthropicETH]

/-- The only axioms an audited theorem may depend on. -/
def permittedAxioms : List Name := [`propext, `Classical.choice, `Quot.sound]

/-- The theorems under audit. -/
def auditedTheorems : List Name :=
  [`OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse,
   `OAI.Bridges.AnthropicETH.ethIsFalse_of_not_positiveRateETH,
   `OAI.Bridges.AnthropicETH.simulationHypothesis_proved,
   `OAI.Bridges.AnthropicETH.Sim.toTM2_outputsInTime,
   `OAI.Bridges.AnthropicETH.ethIsFalse_of_not_positiveRateETH_of_converter,
   `OAI.Bridges.AnthropicETH.converterHypothesis_proved,
   `OAI.Bridges.AnthropicETH.Conv.conv_encClauses,
   `OAI.Bridges.AnthropicETH.Conv.convProgram]

/-- The three upstream results the final theorem must not use, named explicitly. -/
def namedExclusions : List Name :=
  [`MainResults.ethIsFalse,
   `OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main,
   `OAI.Bridges.ETH.not_positiveRateETH]

/-- All constants reachable from `c` through types and values. -/
partial def closure (env : Environment) (c : Name) : NameSet := Id.run do
  let mut seen : NameSet := {}
  let mut todo : Array Name := #[c]
  while h : todo.size > 0 do
    let n := todo.back
    todo := todo.pop
    if seen.contains n then continue
    seen := seen.insert n
    if let some ci := env.find? n then
      for m in ci.type.getUsedConstants do todo := todo.push m
      if let some v := ci.value? (allowOpaque := true) then
        for m in v.getUsedConstants do todo := todo.push m
  return seen

/-- Constant and axiom checks for one theorem; throws on any violation. -/
def auditTarget (target : Name) : CommandElabM Unit := do
  let env ← getEnv
  unless env.contains target do throwError "AUDIT FAILED: {target} not found"
  let cl := closure env target
  let badC := cl.toList.filter fun n => forbiddenConstPrefixes.any (·.isPrefixOf n)
  unless badC.isEmpty do
    throwError "AUDIT FAILED: forbidden constants in the closure of {target}: {badC}"
  let stray := cl.toList.filter fun n =>
    (`OAI).isPrefixOf n && !(permittedOAIPrefixes.any (·.isPrefixOf n))
  unless stray.isEmpty do
    throwError "AUDIT FAILED: unexpected OAI constants in the closure of {target}: {stray}"
  let axs ← collectAxioms target
  let badAx := axs.toList.filter fun a => !(permittedAxioms.contains a)
  unless badAx.isEmpty do
    throwError "AUDIT FAILED: {target} depends on non-permitted axioms {badAx}"
  logInfo m!"checks passed for {target}: {cl.size} constants reachable; axioms {axs}"

/-- Module check; throws on any forbidden module. -/
def auditModules : CommandElabM Unit := do
  let mods := (← getEnv).header.moduleNames
  let bad := mods.filter fun m => forbiddenModulePrefixes.any (·.isPrefixOf m)
  unless bad.isEmpty do throwError "AUDIT FAILED: forbidden modules loaded: {bad}"
  logInfo m!"module check passed: {mods.size} modules loaded, none forbidden"

end OAI.Bridges.AnthropicETH.Audit

open OAI.Bridges.AnthropicETH.Audit in
/-- For each named exclusion: absent from the closure of `target` (else throw), and report
whether the constant exists in the environment at all. -/
def auditNamedExclusions (target : Name) : CommandElabM Unit := do
  let env ← getEnv
  let cl := closure env target
  for n in namedExclusions do
    if cl.contains n then
      throwError "AUDIT FAILED: {target} depends on the excluded result {n}"
    logInfo m!"exclusion check passed for {target}: {n} not in closure \
      (present in environment: {env.contains n})"

open OAI.Bridges.AnthropicETH.Audit in
run_cmd do
  auditModules
  for target in auditedTheorems do auditTarget target
  auditNamedExclusions `OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse

#print axioms OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse
#print axioms OAI.Bridges.AnthropicETH.ethIsFalse_of_not_positiveRateETH
#print axioms OAI.Bridges.AnthropicETH.simulationHypothesis_proved
#print axioms OAI.Bridges.AnthropicETH.Sim.toTM2_outputsInTime
#print axioms OAI.Bridges.AnthropicETH.ethIsFalse_of_not_positiveRateETH_of_converter
#print axioms OAI.Bridges.AnthropicETH.converterHypothesis_proved
#print axioms OAI.Bridges.AnthropicETH.Conv.conv_encClauses
#print axioms OAI.Bridges.AnthropicETH.Conv.convProgram
#print axioms OAI.Bridges.AnthropicETH.Conv.capVal_eq
#print axioms OAI.Bridges.AnthropicETH.Conv.chunks_flatten
#print axioms OAI.Bridges.AnthropicETH.inTime_of_not_positiveRateETH
#print axioms OAI.Bridges.AnthropicETH.ethIsFalse_of_forall_inTime
#print axioms OAI.Bridges.AnthropicETH.length_le_of_isKCNF
#print axioms OAI.Bridges.AnthropicETH.encClauses_length_le
#print axioms OAI.Bridges.AnthropicETH.encodeFormula_toFormula_length_le
#print axioms OAI.Bridges.AnthropicETH.satisfiable_toFormula_iff
#print axioms OAI.Bridges.AnthropicETH.PolyBound.absorb
#print axioms OAI.Bridges.AnthropicETH.Sim.rep_step
#print axioms OAI.Bridges.AnthropicETH.Sim.sim_step
#print axioms OAI.Bridges.AnthropicETH.Sim.clean_spec
