/-
NonVacuity.lean — an adversarial check written by cert-machine (2026-09-09), not part of
OpenAI's repository.

The two Comparator theorems have the shape  ∃ u₀ f, H(u₀) ∧ H(f) ∧ ¬ ∃ v p, S(v, p).
A negation is cheap if S is unsatisfiable for a trivial reason — a definition nobody can
meet.  This file shows the classes are inhabited: with zero force and zero datum, the zero
velocity and zero pressure satisfy every field of `NavierStokesExistenceAndSmoothnessRn`
and of `NavierStokesExistenceAndSmoothnessPeriodic`, and the zero data satisfy
`InitialVelocityConditionDecay`, `ForceConditionDecay`, `InitialVelocityConditionPeriodic`
and `ForceConditionPeriodic`.  So the classes the theorems negate contain at least the
fluid at rest, and the theorems say something.
-/
import ComparatorChallenges.NavierStokes

open ContDiff Set InnerProductSpace MeasureTheory
open scoped Laplacian

namespace NavierStokes.Comparator

local notation "ℝ³" => EuclideanSpace ℝ (Fin 3)

theorem zero_datum_decay : InitialVelocityConditionDecay (fun _ : ℝ³ => (0 : ℝ³)) := by
  refine ⟨⟨fun x => ?_, contDiff_const⟩, fun m K => ⟨0, fun x => ?_⟩⟩
  · simp [divergence]
  · simp

theorem zero_datum_periodic : InitialVelocityConditionPeriodic (fun _ : ℝ³ => (0 : ℝ³)) := by
  refine ⟨⟨fun x => ?_, contDiff_const⟩, fun x i => rfl⟩
  simp [divergence]

theorem zero_force_decay : ForceConditionDecay (fun (_ : ℝ³) (_ : ℝ) => (0 : ℝ³)) := by
  refine ⟨⟨?_⟩, fun m K => ⟨0, fun x t _ => ?_⟩⟩
  · exact contDiffOn_const
  · have h0 : (↿fun (_ : ℝ³) (_ : ℝ) => (0 : ℝ³)) = fun _ : ℝ³ × ℝ => (0 : ℝ³) := rfl
    simp [h0, iteratedFDerivWithin_fun_zero]

theorem zero_force_periodic : ForceConditionPeriodic (fun (_ : ℝ³) (_ : ℝ) => (0 : ℝ³)) := by
  refine ⟨⟨?_⟩, fun t _ x i => rfl, fun m K => ⟨0, fun x t _ => ?_⟩⟩
  · exact contDiffOn_const
  · have h0 : (↿fun (_ : ℝ³) (_ : ℝ) => (0 : ℝ³)) = fun _ : ℝ³ × ℝ => (0 : ℝ³) := rfl
    simp [h0, iteratedFDerivWithin_fun_zero]

/-- The fluid at rest is a member of the whole-space competitor class: the class Clay (C) and
the Lean theorem negate for the constructed data is not empty for trivial reasons. -/
theorem rest_is_a_solution_Rn (nu : ℝ) :
    NavierStokesExistenceAndSmoothnessRn nu (fun _ : ℝ³ => (0 : ℝ³)) (fun _ _ => 0)
      (fun _ _ => 0) (fun _ _ => 0) := by
  refine ⟨⟨fun x t _ => ?_, fun x t _ => ?_, fun x => rfl, ?_, ?_⟩, fun t _ => ?_, ⟨1, fun t _ => ?_⟩⟩
  · simp
  · simp [divergence]
  · exact contDiffOn_const
  · exact contDiffOn_const
  · simpa using (MemLp.zero : MemLp (fun _ : ℝ³ => (0 : ℝ)) 2 volume)
  · simp

/-- The fluid at rest is a member of the periodic competitor class. -/
theorem rest_is_a_solution_periodic (nu : ℝ) :
    NavierStokesExistenceAndSmoothnessPeriodic nu (fun _ : ℝ³ => (0 : ℝ³)) (fun _ _ => 0)
      (fun _ _ => 0) (fun _ _ => 0) := by
  refine ⟨⟨fun x t _ => ?_, fun x t _ => ?_, fun x => rfl, ?_, ?_⟩, fun t _ x i => rfl, fun t _ x i => rfl⟩
  · simp
  · simp [divergence]
  · exact contDiffOn_const
  · exact contDiffOn_const

/-- Hence the two breakdown theorems are not vacuous: their competitor classes are inhabited
for zero data (and the theorems assert emptiness only for the constructed data). -/
theorem classes_inhabited (nu : ℝ) :
    (∃ v p, NavierStokesExistenceAndSmoothnessRn nu (fun _ : ℝ³ => (0 : ℝ³)) (fun _ _ => 0) v p) ∧
    (∃ v p, NavierStokesExistenceAndSmoothnessPeriodic nu (fun _ : ℝ³ => (0 : ℝ³)) (fun _ _ => 0) v p) :=
  ⟨⟨_, _, rest_is_a_solution_Rn nu⟩, ⟨_, _, rest_is_a_solution_periodic nu⟩⟩

#print axioms classes_inhabited

end NavierStokes.Comparator
