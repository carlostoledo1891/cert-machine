import Percolation.Continuity.MainTheorem
import KN3.Compare

/-!
# Cheat.lean — red control KR2: an implication "proved" from the truth of the conjecture

Both statements are theorems, so `X → Lab` follows from the lab's proof of `Lab` with no transport at all. The
dependency walk must flag these.
-/

namespace KN3Cheat

/-- `R0 → Lab`, ignoring the hypothesis. -/
theorem cheat_R0_to_lab (_ : KN3Printed.Conjecture3) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds

/-- `N2 → Lab` (the implication that transport does not give), ignoring the hypothesis. -/
theorem cheat_N2_to_lab (_ : KN3Planted.Neighbour2_constantProbability) :
    Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  Percolation.Continuity.CSH.kozmaNitzan_conjecture3_holds

/-- A cheat one step removed: through additive gluing, never naming the forbidden theorem. -/
theorem cheat_via_additive (_ : KN3Printed.Conjecture3) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  KN3Compare.lab_iff_nearOneGluing.1
    (Percolation.Continuity.additiveGluingGlue_proof Percolation.Continuity.CSH.additiveGluing_holds)

end KN3Cheat
