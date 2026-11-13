import KN1.Bridge.Transport3
import Printed1

/-!
# KN1.Bridge.Transport1 — the mirror of the third party's statement, and the two implications with R0

Mathlib only: imports `KN1.Bridge.Transport3` (the sibling item's `Transport.lean`, byte for byte, behind one
import line: the measure transports and the dictionary of connections between our encoding and the lab's, proved
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
`KN1Printed.Conjecture1`, in full, so that red control KR1 can replace that one name.
-/

namespace KN1Transport

open MeasureTheory KN3Printed KN3Transport

/-- The mirror of the third party's statement of Conjecture 1. -/
def LabForm1 : Prop :=
  ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n)) (hA : A.Nonempty) (o b : Fin n),
    (setLaw w).real (⋃ a ∈ A, conn o a) * A.inf' hA (fun a => (setLaw w).real (conn a b)) ≤
      (setLaw w).real (conn o b)

/-- **T → R0.** -/
theorem conjecture1_of_labForm1 (h : LabForm1) : KN1Printed.Conjecture1 := by
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
theorem labForm1_of_conjecture1 (h : KN1Printed.Conjecture1) : LabForm1 := by
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
