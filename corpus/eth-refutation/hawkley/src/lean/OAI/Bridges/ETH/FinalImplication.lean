import OAI.Bridges.ETH.MachineRunnerCost
import OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Final

/-!
# ETH correspondence, component C2: the unconditional formal implication

`not_positiveRateETH_of_mainTheorem` (component C1b.2) proves
`SqrtLog.Statement.MainTheorem → ¬ OAI.ParityWL.Complexity.PositiveRateETH` with no further
premise. OpenAI's verified proof supplies `SqrtLogSpace.original_sat_main : MainTheorem`.

**Scope of the statement.** `PositiveRateETH` is ParityLifts' formal predicate: some `δ > 0` such
that no `ParityWL.Complexity.Machine` decides 3-SAT (as `Formula N`, encoded by `encodeFormula`)
within `C (L+1)^d 2^(δN)` steps. This theorem refutes that predicate. Reading it as a refutation
of the Exponential Time Hypothesis as mathematicians state it also requires accepting that
predicate, and OpenAI's `MainTheorem`, as faithful formalizations; the theorem's trust base
includes OpenAI's proof of `original_sat_main`.
-/

namespace OAI.Bridges.ETH

/-- **`¬ PositiveRateETH`**, from OpenAI's verified main theorem. -/
theorem not_positiveRateETH : ¬ OAI.ParityWL.Complexity.PositiveRateETH :=
  not_positiveRateETH_of_mainTheorem OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.not_positiveRateETH
