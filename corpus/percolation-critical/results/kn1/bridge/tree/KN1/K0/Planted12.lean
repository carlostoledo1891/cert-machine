import KN1.K0.Basic

/-!
# KN1.K0.Planted12 — the real-valued `⨅ a ∈ A` variant DECIDED: it is TRUE, with no percolation argument

K0 of PREREG-KN1.md, step 2 (f). Mathlib only; statement from the SEALED `Planted1.lean` (no repaired copy).

`planted12_true` uses of the model only: 0 ≤ P ≤ 1 and P(o ↔ A) = 1 for o ∈ A. Two sanity lemmas say what the
real `⨅ a ∈ A, P(a ↔ b)` is: it is 0 as soon as some vertex is outside A (`planted12_iInf_eq_zero`), and it is at
most P(o ↔ b) for EVERY vertex o, in A or not (`planted12_iInf_le`).
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

theorem planted12_inner_nonneg {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b a : V) : 0 ≤ ⨅ (_ : a ∈ A), prob G p (connEvent G a b) :=
  Real.iInf_nonneg fun _ => prob_nonneg G p _

theorem planted12_iInf_nonneg {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b : V) : 0 ≤ ⨅ a ∈ A, prob G p (connEvent G a b) :=
  Real.iInf_nonneg fun a => planted12_inner_nonneg G p A b a

theorem planted12_bddBelow {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b : V) :
    BddBelow (Set.range fun a : V => ⨅ (_ : a ∈ A), prob G p (connEvent G a b)) :=
  ⟨0, by rintro x ⟨a, rfl⟩; exact planted12_inner_nonneg G p A b a⟩

/-- The real `⨅ a ∈ A, P(a ↔ b)` is at most P(o ↔ b) for every vertex o — in A (the inner infimum is the value)
or not in A (the inner infimum is over an empty index: 0). -/
theorem planted12_iInf_le {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b o : V) :
    (⨅ a ∈ A, prob G p (connEvent G a b)) ≤ prob G p (connEvent G o b) := by
  refine le_trans (ciInf_le (planted12_bddBelow G p A b) o) ?_
  by_cases ho : o ∈ A
  · haveI : Nonempty (o ∈ A) := ⟨ho⟩
    exact le_of_eq ciInf_const
  · haveI : IsEmpty (o ∈ A) := ⟨ho⟩
    rw [Real.iInf_of_isEmpty]
    exact prob_nonneg G p _

/-- The real `⨅ a ∈ A, P(a ↔ b)` is 0 whenever some vertex is outside A. -/
theorem planted12_iInf_eq_zero {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b : V) (hA : A ≠ Set.univ) :
    (⨅ a ∈ A, prob G p (connEvent G a b)) = 0 := by
  obtain ⟨c, hc⟩ := (Set.ne_univ_iff_exists_notMem A).mp hA
  refine le_antisymm (le_trans (ciInf_le (planted12_bddBelow G p A b) c) ?_) (planted12_iInf_nonneg G p A b)
  haveI : IsEmpty (c ∈ A) := ⟨hc⟩
  exact le_of_eq (Real.iInf_of_isEmpty _)

/-- (f) OBLIGATIONS1 3.1: Planted 12 is TRUE. -/
theorem planted12_true : Planted12_realIInfOverMembership := by
  intro V _ G p A o b
  have hI0 := planted12_iInf_nonneg G p A b
  have hIo := planted12_iInf_le G p A b o
  have hX1 : prob G p (connSetEvent G o A) ≤ 1 := prob_le_one G p _
  calc prob G p (connSetEvent G o A) * (⨅ a ∈ A, prob G p (connEvent G a b))
      ≤ 1 * (⨅ a ∈ A, prob G p (connEvent G a b)) := mul_le_mul_of_nonneg_right hX1 hI0
    _ = ⨅ a ∈ A, prob G p (connEvent G a b) := one_mul _
    _ ≤ prob G p (connEvent G o b) := hIo

end KN1K0
