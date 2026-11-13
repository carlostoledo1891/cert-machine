import Percolation.Literature.KozmaNitzanReduction
import Percolation.Continuity.Statements
import KN3.Exhaustion

/-!
# Compare.lean — K2: the lab's statement of Conjecture 3 against the sealed readings

Lab modules imported: `Percolation.Literature.KozmaNitzanReduction` (the statement
`Percolation.Literature.KozmaNitzan2024_conjecture3`) and `Percolation.Continuity.Statements` (`NearOneGluing`).
Their import closure inside `Percolation` is 11 modules, none on the path of a proof of the conjecture
(STATEMENT-DIFF.md §5). Ours: `KN3.Exhaustion` → `KN3.Transport` → `KN3.Frag` (= the sealed `Check.lean ++
Planted.lean ++ PlantedCheck.lean` behind an import header) → `Printed` (the sealed bytes).

Everything that is a proof is in `KN3.Transport` / `KN3.Exhaustion`, with Mathlib only, about the MIRROR
`KN3Transport.LabForm`. This file checks, in the lab's environment, that the mirror is the lab's statement
(`lab_iff_labForm`, by `Iff.rfl`: definitional unfolding and nothing else), and names the implications.

`N2 → Lab` is not stated: STATEMENT-DIFF.md §4 (N2).
-/

namespace KN3Compare

open KN3Printed KN3Planted KN3Transport

/-- The lab's `NearOneGluing` is the lab's `KozmaNitzan2024_conjecture3` (re-checked by our own `Iff.rfl`; the
lab's `nearOneGluing_iff_conjecture3` is not imported). -/
theorem lab_iff_nearOneGluing :
    Percolation.Continuity.Statements.NearOneGluing ↔ Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  Iff.rfl

/-- The lab's measure is the mirror's, by unfolding. -/
theorem prodBernoulli_eq_setLaw {ι : Type} (w : ι → unitInterval) :
    Percolation.Literature.LatticeModels.prodBernoulli w = setLaw w :=
  rfl

/-- The lab's connection event is the mirror's, by unfolding. -/
theorem openConn_eq_conn {V : Type} (x y : V) : Percolation.Literature.openConn x y = conn x y :=
  rfl

/-- **The mirror is the lab's statement.** -/
theorem lab_iff_labForm : Percolation.Literature.KozmaNitzan2024_conjecture3 ↔ LabForm :=
  Iff.rfl

/-! ## R0 — `KN3Printed.Conjecture3` -/

theorem lab_to_R0 (h : Percolation.Literature.KozmaNitzan2024_conjecture3) : Conjecture3 :=
  conjecture3_of_labForm (lab_iff_labForm.1 h)

theorem R0_to_lab (h : Conjecture3) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  lab_iff_labForm.2 (labForm_of_conjecture3 h)

/-! ## RB — `KN3Printed.Conjecture3_readingB` (countable graphs) -/

theorem lab_to_RB (h : Percolation.Literature.KozmaNitzan2024_conjecture3) : Conjecture3_readingB :=
  KN3Exhaustion.readingB_of_conjecture3 (lab_to_R0 h)

theorem RB_to_lab (h : Conjecture3_readingB) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  R0_to_lab (conjecture3_of_readingB h)

/-! ## N2 — `KN3Planted.Neighbour2_constantProbability` (one direction only) -/

theorem lab_to_N2 (h : Percolation.Literature.KozmaNitzan2024_conjecture3) : Neighbour2_constantProbability :=
  neighbour2_of_conjecture3 (lab_to_R0 h)

/-! ## N3 — `KN3Planted.Neighbour3_properSubset` -/

theorem lab_to_N3 (h : Percolation.Literature.KozmaNitzan2024_conjecture3) : Neighbour3_properSubset :=
  neighbour3_of_conjecture3 (lab_to_R0 h)

theorem N3_to_lab (h : Neighbour3_properSubset) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  lab_iff_labForm.2 (labForm_of_neighbour3 h)

/-! ## N4 — `KN3Planted.Neighbour4_nonemptyA` -/

theorem lab_to_N4 (h : Percolation.Literature.KozmaNitzan2024_conjecture3) : Neighbour4_nonemptyA :=
  conjecture3_iff_neighbour4.1 (lab_to_R0 h)

theorem N4_to_lab (h : Neighbour4_nonemptyA) : Percolation.Literature.KozmaNitzan2024_conjecture3 :=
  R0_to_lab (conjecture3_iff_neighbour4.2 h)

end KN3Compare
