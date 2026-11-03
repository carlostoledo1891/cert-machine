/-
RPI-378.3d Comparator challenge (trusted statement).

The definitions come from two trusted modules, each a byte-for-byte copy of pinned sources:

* `ComparatorChallenges.AnthropicETHCrossFormalization.ParityLifts`: slices of
  `OAI/Combinatorics/ParityLifts/Machines.lean` (lines 5-69), `SAT.lean` (lines 5-35) and
  `SATChoice.lean` (lines 24-35) of thinkthoughts/math at
  81ec97cd23d21675cee4ee76768fffba33a61e17 (unchanged from openai/math); imports Mathlib only.
* `ComparatorChallenges.AnthropicETHCrossFormalization.MainResults`: the whole of
  anthropics/formal-math@16a5ce41304fcdaea4e0be7c132e1c361dc26da5 `eth/MainResults.lean`
  (SHA-256 47f78a9550d95b37d8718dd1ee16ae824da893a5e17c319f737e6d0a5ed24944); imports Mathlib only.

`scripts/check_rpi378_challenge.py` re-derives all three files from those sources and fails on any
difference. The single theorem is the RPI-378.3d statement with `sorry`; the solution module
`OAI.Bridges.AnthropicETH.Main` proves it.
-/
import ComparatorChallenges.AnthropicETHCrossFormalization.ParityLifts
import ComparatorChallenges.AnthropicETHCrossFormalization.MainResults

/-- **RPI-378.3d.** OpenAI ParityLifts' `¬ PositiveRateETH` implies Anthropic's
`MainResults.ETHIsFalse`. -/
theorem OAI.Bridges.AnthropicETH.not_positiveRateETH_implies_ethIsFalse :
    ¬ OAI.ParityWL.Complexity.PositiveRateETH → MainResults.ETHIsFalse := by
  sorry
