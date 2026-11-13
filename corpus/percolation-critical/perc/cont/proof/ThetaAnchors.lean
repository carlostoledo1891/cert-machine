import Textbook

/-!
# P5 — the anchors of θ, in OUR encoding (PREREG-PERCOLATION.md, P5)

Mathlib only; imports nothing but `Textbook` (the sealed statement file, sha256 4dc732f5…41ae). Proved by the
orchestrator, 2026-11-12, at both Mathlib pins (v4.32.0 / 81a5d257 and v4.34.1 / d13f23b7), the same bytes.

* `theta_zero d`: θ_d(0) = 0 (every edge closed, the origin's cluster is {0}).
* `theta_one hd`: θ_d(1) = 1 for d ≥ 1 (every edge open, the origin's cluster holds the whole first axis).

This file mentions θ only, never p_c, so it builds unchanged against the planted copy of `Textbook` used by red control
R4 (only p_c's body differs there).
-/

namespace TextbookPercolation

open MeasureTheory

/-- ℤ^d has countably many edges (a subtype of `Sym2` of a countable type). -/
instance (d : ℕ) : Countable (Edge d) := by
  unfold Edge
  infer_instance

/-- At p = 1 the product measure is the point mass at "every edge open". -/
theorem P_one (d : ℕ) : P d 1 = Measure.dirac (fun _ : Edge d => true) := by
  unfold P
  simp only [ProbabilityTheory.bernoulliMeasure_one]
  exact Measure.infinitePi_dirac (fun _ : Edge d => true)

/-- At p = 0 the product measure is the point mass at "every edge closed". -/
theorem P_zero (d : ℕ) : P d 0 = Measure.dirac (fun _ : Edge d => false) := by
  unfold P
  simp only [ProbabilityTheory.bernoulliMeasure_zero]
  exact Measure.infinitePi_dirac (fun _ : Edge d => false)

/-- With every edge closed, the cluster of x is {x}. -/
theorem cluster_all_closed {d : ℕ} (x : Vertex d) : cluster (fun _ : Edge d => false) x = {x} := by
  ext y
  show Relation.ReflTransGen (OpenEdge (fun _ : Edge d => false)) x y ↔ y = x
  constructor
  · intro h
    induction h with
    | refl => rfl
    | tail _ hstep _ =>
      obtain ⟨_, hfalse⟩ := hstep
      exact absurd hfalse (by simp)
  · rintro rfl
    exact Relation.ReflTransGen.refl

/-- Two points of one axis at distance one are adjacent. -/
theorem adjacent_single {d : ℕ} (i : Fin d) (k : ℤ) :
    Adjacent (Pi.single i k : Vertex d) (Pi.single i (k + 1)) := by
  unfold Adjacent
  rw [Finset.sum_eq_single i]
  · simp
  · intro j _ hj
    simp [hj]
  · intro hi
    exact absurd (Finset.mem_univ i) hi

/-- With every edge open, the origin reaches every point n·e_i, n ∈ ℕ, of an axis. -/
theorem reach_axis {d : ℕ} (i : Fin d) (n : ℕ) :
    (Pi.single i (n : ℤ) : Vertex d) ∈ cluster (fun _ : Edge d => true) 0 := by
  induction n with
  | zero => simpa [cluster] using (Relation.ReflTransGen.refl : Relation.ReflTransGen _ (0 : Vertex d) 0)
  | succ n ih =>
    have hstep : OpenEdge (fun _ : Edge d => true) (Pi.single i (n : ℤ)) (Pi.single i ((n : ℤ) + 1)) :=
      ⟨adjacent_single i n, rfl⟩
    have := Relation.ReflTransGen.tail ih hstep
    simpa [cluster, Nat.cast_succ] using this

/-- With every edge open and d ≥ 1, the origin's cluster is infinite. -/
theorem cluster_all_open_infinite {d : ℕ} (hd : 1 ≤ d) :
    (cluster (fun _ : Edge d => true) 0).Infinite := by
  let i : Fin d := ⟨0, hd⟩
  refine Set.infinite_of_injective_forall_mem (f := fun n : ℕ => (Pi.single i (n : ℤ) : Vertex d)) ?_ (reach_axis i)
  intro a b hab
  have := congrFun hab i
  simpa using this

/-- **θ_d(1) = 1** for every d ≥ 1. -/
theorem theta_one {d : ℕ} (hd : 1 ≤ d) : θ d 1 = 1 := by
  have hmem : (fun _ : Edge d => true) ∈ {ω : Edge d → Bool | (cluster ω 0).Infinite} :=
    cluster_all_open_infinite hd
  simp only [θ, P_one, Measure.dirac_apply_of_mem hmem, ENNReal.toReal_one]

/-- **θ_d(0) = 0** for every d. -/
theorem theta_zero (d : ℕ) : θ d 0 = 0 := by
  have hnot : (fun _ : Edge d => false) ∉ {ω : Edge d → Bool | (cluster ω 0).Infinite} := by
    simp [cluster_all_closed]
  simp only [θ, P_zero, Measure.dirac_apply, Set.indicator_of_notMem hnot, ENNReal.toReal_zero]

end TextbookPercolation
