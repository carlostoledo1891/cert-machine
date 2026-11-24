import Solution
import CertMachine.Anchors

/-!
# A6 on the release's own proof

`CertMachine.Anchors.A6` derives the two non-memberships from `Statement.MainTheorem` alone; here it
is applied to the release's `Solution.mainTheorem`.
-/

open Statement

namespace CertMachine.AnchorsRelease

universe u

open CertMachine.Anchors in
/-- **A6, unconditional** (from the release's proof of `MainTheorem`). -/
theorem A6_release (F : Type u) [Field F] :
    ({ vars := fun n => Fin n × Fin n, poly := fun n => hc F n } : Family F) ∉ VP F ∧
      (ringChar F ≠ 2 →
        ({ vars := fun n => Fin n × Fin n, poly := fun n => perm F n } : Family F) ∉ VP F) :=
  A6 Solution.mainTheorem F

end CertMachine.AnchorsRelease

#print axioms CertMachine.AnchorsRelease.A6_release
