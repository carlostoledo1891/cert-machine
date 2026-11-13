import KNConjectures.Statements
import KNConjectures.KN1Statement
import KN1.Bridge.Transport1
import KN1.K0.Required

/-!
# KN1.Bridge.Compare — K2: the three targets against the sealed R0

Third-party modules imported: `KNConjectures.Statements` (the definition `KNAll.Conjecture1`, T1) and
`KNConjectures.KN1Statement` (T2, Mathlib only). `KNConjectures.Statements` imports the lab's
`Percolation.Continuity.MainTheorem`, so the lab's proofs ARE in this file's import closure; what a theorem below
reaches is decided by the dependency walk (`KN1.Bridge.Walk`), not by the imports.
Ours: `KN1.Bridge.Transport1` → `KN1.Bridge.Transport3` → `KN1.K0.Frag` → `Printed`; `Printed1`; `KN1.K0.Required`
(K0's R0 ↔ RE, R0 ↔ RL), all with the SEALED statement bytes.

Every proof is in `KN1.Bridge.Transport1` / `Transport3`, with Mathlib only, about the mirror
`KN1Transport.LabForm1`. This file checks, in the third party's environment, that the mirror is each target
(`Iff.rfl`: definitional unfolding and nothing else) and names the implications. R0 is always written
`KN1Printed.Conjecture1` in full (red control KR1 replaces that one name).
-/

namespace KN1Compare

open KN3Transport KN1Transport

/-- The lab's measure is the mirror's, by unfolding. -/
theorem prodBernoulli_eq_setLaw {ι : Type} (w : ι → unitInterval) :
    Percolation.Literature.LatticeModels.prodBernoulli w = setLaw w :=
  rfl

/-- The lab's connection event is the mirror's, by unfolding. -/
theorem openConn_eq_conn {V : Type} (x y : V) : Percolation.Literature.openConn x y = conn x y :=
  rfl

/-- The third party's Mathlib-only copies are the mirror's, by unfolding. -/
theorem kn1_prodBernoulli_eq_setLaw {ι : Type} (w : ι → unitInterval) :
    KN1Statement.prodBernoulli w = setLaw w :=
  rfl

theorem kn1_openConn_eq_conn {V : Type} (x y : V) : KN1Statement.openConn x y = conn x y :=
  rfl

/-- **T3 as a closed proposition**: the type of `KN1Corollary.kozmaNitzan_conjecture1`, written out with the lab's
names (`KN1.Bridge.Targets` checks that it IS that theorem's type, without using the theorem). -/
def T3 : Prop :=
  ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
    (Percolation.Literature.LatticeModels.prodBernoulli w).real (⋃ a ∈ A, Percolation.Literature.openConn o a) *
        A.inf' hA (fun a => (Percolation.Literature.LatticeModels.prodBernoulli w).real
          (Percolation.Literature.openConn a b)) ≤
      (Percolation.Literature.LatticeModels.prodBernoulli w).real (Percolation.Literature.openConn o b)

/-! ## The mirror is each target -/

theorem T1_iff_mirror : KNAll.Conjecture1 ↔ LabForm1 := Iff.rfl

theorem T2_iff_mirror : KN1Statement.MultiplicativeGluing ↔ LabForm1 := Iff.rfl

theorem T3_iff_mirror : T3 ↔ LabForm1 := Iff.rfl

/-! ## T1 — the proposition proved by `KNAll.conjecture1_holds` -/

theorem T1_to_R0 (h : KNAll.Conjecture1) : KN1Printed.Conjecture1 :=
  conjecture1_of_labForm1 (T1_iff_mirror.1 h)

theorem R0_to_T1 (h : KN1Printed.Conjecture1) : KNAll.Conjecture1 :=
  T1_iff_mirror.2 (labForm1_of_conjecture1 h)

/-! ## T2 — `KN1Statement.MultiplicativeGluing` -/

theorem T2_to_R0 (h : KN1Statement.MultiplicativeGluing) : KN1Printed.Conjecture1 :=
  conjecture1_of_labForm1 (T2_iff_mirror.1 h)

theorem R0_to_T2 (h : KN1Printed.Conjecture1) : KN1Statement.MultiplicativeGluing :=
  T2_iff_mirror.2 (labForm1_of_conjecture1 h)

/-! ## T3 — the proposition proved by `KN1Corollary.kozmaNitzan_conjecture1` -/

theorem T3_to_R0 (h : T3) : KN1Printed.Conjecture1 :=
  conjecture1_of_labForm1 (T3_iff_mirror.1 h)

theorem R0_to_T3 (h : KN1Printed.Conjecture1) : T3 :=
  T3_iff_mirror.2 (labForm1_of_conjecture1 h)

/-! ## The required sealed readings, through K0's equivalences (for the record; none is needed above) -/

theorem T1_iff_RE : KNAll.Conjecture1 ↔ KN1Printed.Conjecture1_existsForm :=
  ⟨fun h => KN1K0.conjecture1_iff_existsForm.1 (T1_to_R0 h),
    fun h => R0_to_T1 (KN1K0.conjecture1_iff_existsForm.2 h)⟩

theorem T1_iff_RL : KNAll.Conjecture1 ↔ KN1Printed.Conjecture1_lowerBound :=
  ⟨fun h => KN1K0.conjecture1_iff_lowerBound.1 (T1_to_R0 h),
    fun h => R0_to_T1 (KN1K0.conjecture1_iff_lowerBound.2 h)⟩

theorem T1_to_RF (h : KNAll.Conjecture1) : KN1Printed.Conjecture1_onFin :=
  KN1K0.onFin_of_conjecture1 (T1_to_R0 h)

end KN1Compare
