/-
Two independent refutations of the Exponential Time Hypothesis, on one formal statement.

`MainResults.ethIsFalse` is Anthropic's proof (their `Solution`), and `Bridge.ethIsFalse_of_claim`
derives the same proposition from OpenAI's formal claim. Both are checked here by one kernel against
the same 150-line trusted file `MainResults.lean`.
-/
import Solution
import Bridge.Main

namespace Bridge

/-- Anthropic's proof and the bridge from OpenAI's claim, side by side. -/
theorem two_proofs_one_statement :
    MainResults.ETHIsFalse ∧ (OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.Claim → MainResults.ETHIsFalse) :=
  ⟨MainResults.ethIsFalse, ethIsFalse_of_claim⟩

end Bridge
