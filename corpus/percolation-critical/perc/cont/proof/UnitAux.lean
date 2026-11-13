import Mathlib

/-!
# A Mathlib-only lemma on functions on the unit interval

A continuous real function on `[0, 1]` that vanishes on `[0, c)`, with `c > 0`, vanishes at `c`.
Used twice: for "θ continuous ⇒ θ(p_c) = 0" and for the refutation of the planted `d ≥ 1` variant.
-/

namespace UnitAux

open Filter Topology

theorem eq_zero_of_continuous_of_zero_below {f : unitInterval → ℝ} (hf : Continuous f)
    (c : unitInterval) (hc : 0 < (c : ℝ)) (h0 : ∀ q : unitInterval, q < c → f q = 0) : f c = 0 := by
  by_contra hne
  have hev : ∀ᶠ q in 𝓝 c, f q ≠ 0 := hf.continuousAt.eventually_ne hne
  obtain ⟨ε, hε, hball⟩ := Metric.eventually_nhds_iff.1 hev
  have h1 : (c : ℝ) - ε / 2 ≤ max 0 ((c : ℝ) - ε / 2) := le_max_right _ _
  have h2 : max 0 ((c : ℝ) - ε / 2) < c := max_lt hc (by linarith)
  have hmem : max 0 ((c : ℝ) - ε / 2) ∈ Set.Icc (0 : ℝ) 1 := ⟨le_max_left _ _, h2.le.trans c.2.2⟩
  have hlt : (⟨_, hmem⟩ : unitInterval) < c := Subtype.coe_lt_coe.1 h2
  have hd : dist (⟨_, hmem⟩ : unitInterval) c < ε := by
    rw [Subtype.dist_eq, Real.dist_eq, abs_lt]
    show -ε < max 0 ((c : ℝ) - ε / 2) - c ∧ max 0 ((c : ℝ) - ε / 2) - c < ε
    exact ⟨by linarith, by linarith⟩
  exact hball hd (h0 _ hlt)

end UnitAux
