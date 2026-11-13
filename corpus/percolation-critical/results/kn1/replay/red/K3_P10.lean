import KNConjectures.Conjectures
import KN1.Bridge.Compare
import Planted1


/-!
# KN1.Proved — K3: Kozma–Nitzan's Conjecture 1 as printed (our sealed statement), from the third party's theorem

`KNAll.conjecture1_holds` is the third party's proof of its own statement; `KN1Compare.T1_to_R0` (K2, transport
only) carries it to the sealed `KN1Planted.Planted10_sumInPlaceOfSetEvent` of `Printed1.lean`.
-/

/-- **Conjecture 1 of arXiv:2401.12397v1 as written in the sealed `Printed1.lean` (the primary reading R0).** -/
theorem conjecture1_as_printed : KN1Planted.Planted10_sumInPlaceOfSetEvent :=
  KN1Compare.T1_to_R0 KNAll.conjecture1_holds
