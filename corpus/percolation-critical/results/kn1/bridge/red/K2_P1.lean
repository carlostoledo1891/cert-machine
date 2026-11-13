import KNConjectures.Conjectures
import KNConjectures.KN1Statement
import KN1.Bridge.Transport3
import KN1.K0.Required
import Planted1


/-!
# KN1.Bridge.Transport1 — the mirror of the third party's statement, and the two implications with R0

Mathlib only: imports `KN1.Bridge.Transport3` (the sibling item's `Transport.lean`, byte for byte, behind one
there with Mathlib alone) and the SEALED `Printed1.lean`. No name of the lab's library or of the third party's
occurs in this file.

* `LabForm1` — the body of the third party's `KNAll.Conjecture1` (= the type of
  `KN1Corollary.kozmaNitzan_conjecture1` = the body of `KN1Statement.MultiplicativeGluing`), typed over the mirror
  `KN3Transport.setLaw` / `KN3Transport.conn`. That the mirror IS their statement is not claimed here: it is
  checked in their environment by `Iff.rfl` (`KN1.Bridge.Compare`).
* `conjecture1_of_labForm1` — T → R0: relabel the finite vertex type by `Fin n`, weight 0 on every pair that is
  not an edge.
* `labForm1_of_conjecture1` — R0 → T: the complete graph on `Fin n` with the weights on its edges; the diagonal
  weights are dropped.

Both are changes of encoding. Neither uses the truth of the inequality. R0 is always written
`KN1Planted.Planted1_maxInPlaceOfMin`, in full, so that red control KR1 can replace that one name.
-/

namespace KN1Transport

open MeasureTheory KN3Printed KN3Transport

/-- The mirror of the third party's statement of Conjecture 1. -/
def LabForm1 : Prop :=
  ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
    (setLaw w).real (⋃ a ∈ A, conn o a) * A.inf' hA (fun a => (setLaw w).real (conn a b)) ≤
      (setLaw w).real (conn o b)

/-- **T → R0.** -/
theorem conjecture1_of_labForm1 (h : LabForm1) : KN1Planted.Planted1_maxInPlaceOfMin := by
  intro V _ G p A o b m hex hlow
  classical
  obtain ⟨n, ⟨e⟩⟩ := Finite.exists_equiv_fin V
  obtain ⟨a₀, ha₀, -⟩ := hex
  have hA : ∀ a, e a ∈ (Finset.univ.filter fun i => e.symm i ∈ A) ↔ a ∈ A := fun a => by simp
  have hne : (Finset.univ.filter fun i => e.symm i ∈ A).Nonempty := ⟨e a₀, (hA a₀).2 ha₀⟩
  have H := h n (weightOf G p e) (Finset.univ.filter fun i => e.symm i ∈ A) hne (e o) (e b)
  have hm : m ≤ (Finset.univ.filter fun i => e.symm i ∈ A).inf' hne
      (fun a => (setLaw (weightOf G p e)).real (conn a (e b))) := by
    refine Finset.le_inf' hne _ fun a ha => ?_
    have ha' : e.symm a ∈ A := (hA (e.symm a)).1 (by rwa [e.apply_symm_apply])
    have h₃ := hlow (e.symm a) ha'
    rw [prob_connEvent_eq_real G p e (e.symm a) b, e.apply_symm_apply] at h₃
    exact h₃
  rw [prob_connEvent_eq_real G p e o b,
    prob_connSetEvent_eq_real G p e A (Finset.univ.filter fun i => e.symm i ∈ A) hA o]
  exact le_trans (mul_le_mul_of_nonneg_left hm measureReal_nonneg) H

/-- **R0 → T.** -/
theorem labForm1_of_conjecture1 (h : KN1Planted.Planted1_maxInPlaceOfMin) : LabForm1 := by
  intro n w A hA o b
  have hr : Function.LeftInverse (id : Fin n → Fin n) id := fun _ => rfl
  obtain ⟨a₀, ha₀, hinf⟩ := Finset.exists_mem_eq_inf' hA (fun a => (setLaw w).real (conn a b))
  have hX : (setLaw w).real (⋃ a ∈ A, conn o a) =
      prob (completeOn id) (fun i => w (edgeMap (completeOn id) id i))
        (connSetEvent (completeOn id) o (id '' (↑A : Set (Fin n)))) :=
    real_connSet_eq_prob id id hr w o ↑A
  have hY : ∀ x : Fin n, (setLaw w).real (conn x b) =
      prob (completeOn id) (fun i => w (edgeMap (completeOn id) id i)) (connEvent (completeOn id) x b) :=
    fun x => real_conn_eq_prob id id hr w x b
  have H := h (Fin n) (completeOn id) (fun i => w (edgeMap (completeOn id) id i)) (id '' (↑A : Set (Fin n))) o b
    (A.inf' hA (fun a => (setLaw w).real (conn a b)))
    ⟨a₀, ⟨a₀, Finset.mem_coe.2 ha₀, rfl⟩, (hY a₀).symm.trans hinf.symm⟩
    (by
      rintro _ ⟨a, ha, rfl⟩
      exact le_of_le_of_eq (Finset.inf'_le _ (Finset.mem_coe.1 ha)) (hY a))
  rw [hX, hY o]
  exact H

end KN1Transport


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
`KN1Planted.Planted1_maxInPlaceOfMin` in full (red control KR1 replaces that one name).
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

theorem T1_to_R0 (h : KNAll.Conjecture1) : KN1Planted.Planted1_maxInPlaceOfMin :=
  conjecture1_of_labForm1 (T1_iff_mirror.1 h)

theorem R0_to_T1 (h : KN1Planted.Planted1_maxInPlaceOfMin) : KNAll.Conjecture1 :=
  T1_iff_mirror.2 (labForm1_of_conjecture1 h)

/-! ## T2 — `KN1Statement.MultiplicativeGluing` -/

theorem T2_to_R0 (h : KN1Statement.MultiplicativeGluing) : KN1Planted.Planted1_maxInPlaceOfMin :=
  conjecture1_of_labForm1 (T2_iff_mirror.1 h)

theorem R0_to_T2 (h : KN1Planted.Planted1_maxInPlaceOfMin) : KN1Statement.MultiplicativeGluing :=
  T2_iff_mirror.2 (labForm1_of_conjecture1 h)

/-! ## T3 — the proposition proved by `KN1Corollary.kozmaNitzan_conjecture1` -/

theorem T3_to_R0 (h : T3) : KN1Planted.Planted1_maxInPlaceOfMin :=
  conjecture1_of_labForm1 (T3_iff_mirror.1 h)

theorem R0_to_T3 (h : KN1Planted.Planted1_maxInPlaceOfMin) : T3 :=
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
