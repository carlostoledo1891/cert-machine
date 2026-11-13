import KN1.K0.Required
import KN1.K0.PlantedFalse
import KN1.K0.Planted12
import KN1.K0.Readings
import KN1.K0.Weakenings
import KN1.K0.PlantedFalse10
import KN1.K0.PlantedFalse11

/-!
# KN1.K0.Axioms — `#print axioms` for every K0 theorem (no proof in this file)

Every line must be within [propext, Classical.choice, Quot.sound].
-/

-- the three small facts
#print axioms KN1K0.prob_connSetEvent_empty
#print axioms KN1K0.exists_minimiser
#print axioms KN1K0.prob_connSetEvent_bot
-- REQUIRED (a)–(d)
#print axioms KN1K0.conjecture1_iff_existsForm
#print axioms KN1K0.conjecture1_iff_lowerBound
#print axioms KN1K0.onFin_of_conjecture1
#print axioms KN1K0.existsForm_iff_sealedNeighbour1
-- REQUIRED (e): planted variants proved false
#print axioms KN1K0.planted1_false
#print axioms KN1K0.planted2_false
#print axioms KN1K0.planted3_false
#print axioms KN1K0.planted4_false
#print axioms KN1K0.planted5_false
#print axioms KN1K0.planted6_false
#print axioms KN1K0.planted7_false
#print axioms KN1K0.planted8_false
#print axioms KN1K0.planted9_false
#print axioms KN1K0.prob_connEvent_of_adj_of_one
#print axioms KN1K0.planted10_false
#print axioms KN1K0.prob_allOpen
#print axioms KN1K0.joined_mem_of_closed
#print axioms KN1K0.path3_adj
#print axioms KN1K0.path3_mem
#print axioms KN1K0.path3_of_mem
#print axioms KN1K0.path3_from0
#print axioms KN1K0.path3_to2
#print axioms KN1K0.le_prob_connEvent_of_adj
#print axioms KN1K0.planted11_false
-- REQUIRED (f): Planted 12 decided
#print axioms KN1K0.planted12_inner_nonneg
#print axioms KN1K0.planted12_iInf_nonneg
#print axioms KN1K0.planted12_bddBelow
#print axioms KN1K0.planted12_iInf_le
#print axioms KN1K0.planted12_iInf_eq_zero
#print axioms KN1K0.planted12_true
-- OPTIONAL: the other readings
#print axioms KN1K0.conjecture1_iff_minimiser
#print axioms KN1K0.conjecture1_iff_emptyMinIs
#print axioms KN1K0.conjecture1_iff_distinct
#print axioms KN1K0.conjecture1_iff_properSubset
#print axioms KN1K0.conjecture1_iff_isLeast
#print axioms KN1K0.conjecture1_iff_sInf
#print axioms KN1K0.iInf_subtype_eq
#print axioms KN1K0.conjecture1_iff_iInf
#print axioms KN1K0.conjecture1_iff_ennreal
-- OPTIONAL: one-way implications
#print axioms KN1K0.planted13_of_harris
#print axioms KN1K0.planted15_of_harris
#print axioms KN1K0.conjecture3_of_conjecture1
#print axioms KN1K0.harris_of_conjecture1
#print axioms KN1K0.planted13_of_conjecture1
#print axioms KN1K0.planted14_of_conjecture1
#print axioms KN1K0.planted15_of_conjecture1
#print axioms KN1K0.planted16_of_conjecture1
#print axioms KN1K0.neighbour8_of_conjecture1
#print axioms KN1K0.neighbour9_of_conjecture1
#print axioms KN1K0.neighbour10_of_conjecture1
#print axioms KN1K0.neighbour11_of_conjecture1
#print axioms KN1K0.neighbour12_of_conjecture1
#print axioms KN1K0.planted17_of_conjecture1
#print axioms KN1K0.conjecture1_of_neighbour7
#print axioms KN1K0.neighbour2_of_neighbour3
