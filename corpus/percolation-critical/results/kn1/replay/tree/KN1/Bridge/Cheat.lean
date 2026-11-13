import KNConjectures.Conjectures
import KNConjectures.KN1Bridge
import KN1.Bridge.Compare

/-!
# KN1.Bridge.Cheat — red control KR2: implications "proved" from the truth of the conjecture

Every statement here is a theorem of the third party's tree, so `R0 → T` follows from their proof of `T` with no
transport at all. The dependency walk must flag each of these.
-/

namespace KN1Cheat

/-- `R0 → T1`, ignoring the hypothesis (the cheat named in the rule sheet). -/
theorem cheat_R0_to_T1 (_ : KN1Printed.Conjecture1) : KNAll.Conjecture1 :=
  KNAll.conjecture1_holds

/-- `R0 → T2`, ignoring the hypothesis. -/
theorem cheat_R0_to_T2 (_ : KN1Printed.Conjecture1) : KN1Statement.MultiplicativeGluing :=
  KN1Statement.multiplicativeGluing_holds

/-- A cheat one step removed: `R0 → T1` through the OTHER route's theorem and the mirror, never naming a proof of
T1 itself. -/
theorem cheat_T1_via_T2 (_ : KN1Printed.Conjecture1) : KNAll.Conjecture1 :=
  KN1Compare.T1_iff_mirror.2 (KN1Compare.T2_iff_mirror.1 KN1Statement.multiplicativeGluing_holds)

/-- A cheat that names no `_holds` and no theorem whose type is a target: the lower-bound theorem of the second
route, applied by hand. -/
theorem cheat_via_lowerBound (_ : KN1Printed.Conjecture1) : KN1Compare.T3 := fun n w A _ o b =>
  (mul_comm _ _).le.trans
    (KN1Corollary.multiplicativeGluing_all n w A o b _ (fun _ ha => Finset.inf'_le _ ha))

/-- A cheat in the direction `T1 → R0`: our own K3 theorem, ignoring the hypothesis. -/
theorem cheat_T1_to_R0 (_ : KNAll.Conjecture1) : KN1Printed.Conjecture1 :=
  KN1Compare.T1_to_R0 KNAll.conjecture1_holds

end KN1Cheat
