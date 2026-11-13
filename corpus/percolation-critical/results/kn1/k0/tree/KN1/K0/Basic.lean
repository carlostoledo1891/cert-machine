import KN1.K0.Frag
import Printed1
import Planted1

/-!
# KN1.K0.Basic — the three small facts of OBLIGATIONS1.md (preamble)

K0 of PREREG-KN1.md. Mathlib only. Imports: `Printed` (sealed bytes, through `KN1.K0.Frag`), `Printed1` and
`Planted1` (the SEALED bytes, no repaired copy), and `KN1.K0.Frag` (the sealed fragments Check ++ Planted ++
PlantedCheck of the sibling item, pasted after `import Mathlib` / `import Printed`). No file of the lab's library.
-/

namespace KN1K0

open KN3Printed KN1Printed KN1Planted

/-- The event {v ↔ ∅} is empty. -/
theorem prob_connSetEvent_empty {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (v : V) :
    prob G p (connSetEvent G v ∅) = 0 := by
  have : connSetEvent G v ∅ = ∅ := by
    ext ω; simp [connSetEvent]
  simp [prob, this]

/-- A finite nonempty set of vertices has a point where P(a ↔ b) is least. -/
theorem exists_minimiser {V : Type} [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b : V) (hA : A.Nonempty) :
    ∃ a ∈ A, ∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b) :=
  Set.exists_min_image A (fun a => prob G p (connEvent G a b)) A.toFinite hA

/-- With no edge, P(v ↔ A) = 0 for v ∉ A. -/
theorem prob_connSetEvent_bot {V : Type} (p : (⊥ : SimpleGraph V).edgeSet → Set.Icc (0 : ℝ) 1)
    {v : V} {A : Set V} (h : v ∉ A) : prob (⊥ : SimpleGraph V) p (connSetEvent ⊥ v A) = 0 := by
  have : connSetEvent (⊥ : SimpleGraph V) v A = ∅ := by
    refine Set.eq_empty_of_forall_notMem fun ω hω => ?_
    obtain ⟨a, ha, hj⟩ := hω
    have hva : v = a := KN3Planted.joined_bot ω hj
    subst hva
    exact h ha
  simp [prob, this]

end KN1K0
