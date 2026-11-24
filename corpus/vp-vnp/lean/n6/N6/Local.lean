import N6B.Det
import N6R.Remark
import N6R.Control
import N6R.MatrixAnchors

/-! Phase 3, the parts that need Mathlib and the release's Statement.lean only, put together.
`remarkN6_of_main` still takes the release's main theorem as a hypothesis: the unconditional
`RemarkN6` needs `Solution.mainTheoremApprox`, that is, the whole release, on a machine that builds it. -/

namespace CertMachine.N6

universe u

theorem remarkN6_of_main (hmain : Statement.MainTheoremApprox.{u}) : RemarkN6.{u} :=
  remarkN6_of det_has_small_circuits hmain

theorem permCharTwo : PermCharTwo.{u} :=
  permCharTwo_of det_has_small_circuits

end CertMachine.N6

#print axioms CertMachine.N6.det_has_small_circuits
#print axioms CertMachine.N6.remarkN6_of_main
#print axioms CertMachine.N6.permCharTwo
#print axioms CertMachine.N6.approxByDet_det
#print axioms CertMachine.N6.approxByDet_mono
#print axioms CertMachine.N6.approximates_of_approxByDet
