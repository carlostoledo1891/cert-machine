import ChallengeDeps

/-!
# The conditional bridge (cert-machine, 2026-11-20; pre-registration amendment A1)

Mathlib and the August release's Mathlib-only definition layer (`ChallengeDeps`, formal-math/zeta23) only: no proof
from either release is used here. Given the Riemann Hypothesis in Mathlib's form (`RiemannHypothesis`), every
nontrivial zero in zeta23's sense (ζ(ρ) = 0, 0 < Re ρ < 1) lies on the critical line, so zeta23's count of DISTINCT
zeros on the line, `N0star`, equals its count of distinct zeros, `Ndist`, on every window; a lower bound for the
proportion of distinct zeros therefore becomes the same lower bound for distinct zeros on the critical line. The same
for primitive Dirichlet characters, given that their zeros in the open strip lie on the line.
-/

namespace CertMachine.Bridge

/-- RH puts every nontrivial zero (zeta23's `IsNontrivialZero`) on the critical line. -/
theorem re_eq_half_of_isNontrivialZero (hRH : RiemannHypothesis) {ρ : ℂ} (h : IsNontrivialZero ρ) :
    ρ.re = 1 / 2 := by
  obtain ⟨hz, h0, h1⟩ := h
  refine hRH ρ hz ?_ ?_
  · rintro ⟨n, rfl⟩
    have hre : ((-2 : ℂ) * ((n : ℂ) + 1)).re = -2 * ((n : ℝ) + 1) := by simp
    rw [hre] at h0
    have : (0 : ℝ) ≤ n := Nat.cast_nonneg n
    linarith
  · rintro rfl
    simp at h1

/-- Under RH, distinct zeros on the line and distinct zeros are the same count, on every window. -/
theorem N0star_eq_Ndist (hRH : RiemannHypothesis) (T₁ T₂ : ℝ) : N0star T₁ T₂ = Ndist T₁ T₂ := by
  unfold N0star Ndist
  congr 1
  ext ρ
  constructor
  · exact fun h => h.1
  · intro h
    exact ⟨h, re_eq_half_of_isNontrivialZero hRH h.1⟩

/-- The hypothesis on primitive characters, written out (it is the release's `PrimitiveDirichletLZerosOnLine`). -/
def PrimitiveZerosOnLine : Prop :=
  ∀ (N : ℕ) [NeZero N] (χ : DirichletCharacter ℂ N), χ.IsPrimitive →
    ∀ s : ℂ, 0 < s.re → s.re < 1 → DirichletCharacter.LFunction χ s = 0 → s.re = 1 / 2

theorem N0starL_eq_NdistL (hL : PrimitiveZerosOnLine) {q : ℕ} [NeZero q] (χ : DirichletCharacter ℂ q)
    (hχ : χ.IsPrimitive) (T₁ T₂ : ℝ) : N0starL χ T₁ T₂ = NdistL χ T₁ T₂ := by
  unfold N0starL NdistL
  congr 1
  ext ρ
  constructor
  · exact fun h => h.1
  · intro h
    obtain ⟨⟨hz, h0, h1⟩, -⟩ := id h
    exact ⟨h, hL q χ hχ ρ h0 h1 hz⟩

/-- The shape shared by all the bounds: for every ε > 0, eventually (c − ε)·N ≤ X. -/
theorem transfer {c : ℝ} {N X Y : ℝ → ℕ} (hXY : ∀ T, X T = Y T)
    (h : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (c - ε) * (N T : ℝ) ≤ X T) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (c - ε) * (N T : ℝ) ≤ Y T := by
  intro ε hε
  obtain ⟨T₀, hT⟩ := h ε hε
  exact ⟨T₀, fun T hT' => by rw [← hXY T]; exact hT T hT'⟩

theorem five_sixths_on_line_of_RH (hRH : RiemannHypothesis)
    (hC : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount T (2 * T) : ℝ) ≤ Ndist T (2 * T)) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount T (2 * T) : ℝ) ≤ N0star T (2 * T) :=
  transfer (N := fun T => Ncount T (2 * T)) (X := fun T => Ndist T (2 * T)) (Y := fun T => N0star T (2 * T))
    (fun T => (N0star_eq_Ndist hRH T (2 * T)).symm) hC

theorem five_sixths_on_line_cumulative_of_RH (hRH : RiemannHypothesis)
    (hC : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount 0 T : ℝ) ≤ Ndist 0 T) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount 0 T : ℝ) ≤ N0star 0 T :=
  transfer (N := fun T => Ncount 0 T) (X := fun T => Ndist 0 T) (Y := fun T => N0star 0 T)
    (fun T => (N0star_eq_Ndist hRH 0 T).symm) hC

theorem montgomery_taylor_on_line_of_RH (hRH : RiemannHypothesis)
    (hD : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount T (2 * T) : ℝ) ≤ Ndist T (2 * T)) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount T (2 * T) : ℝ) ≤ N0star T (2 * T) :=
  transfer (N := fun T => Ncount T (2 * T)) (X := fun T => Ndist T (2 * T)) (Y := fun T => N0star T (2 * T))
    (fun T => (N0star_eq_Ndist hRH T (2 * T)).symm) hD

theorem montgomery_taylor_on_line_cumulative_of_RH (hRH : RiemannHypothesis)
    (hD : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount 0 T : ℝ) ≤ Ndist 0 T) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount 0 T : ℝ) ≤ N0star 0 T :=
  transfer (N := fun T => Ncount 0 T) (X := fun T => Ndist 0 T) (Y := fun T => N0star 0 T)
    (fun T => (N0star_eq_Ndist hRH 0 T).symm) hD

theorem dirichlet_five_sixths_on_line_of_L (hL : PrimitiveZerosOnLine)
    {q : ℕ} [NeZero q] (χ : DirichletCharacter ℂ q) (hχ : χ.IsPrimitive)
    (hC : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ NdistL χ T (2 * T)) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ N0starL χ T (2 * T) :=
  transfer (N := fun T => NcountL χ T (2 * T)) (X := fun T => NdistL χ T (2 * T))
    (Y := fun T => N0starL χ T (2 * T)) (fun T => (N0starL_eq_NdistL hL χ hχ T (2 * T)).symm) hC

theorem dirichlet_montgomery_taylor_on_line_of_L (hL : PrimitiveZerosOnLine)
    {q : ℕ} [NeZero q] (χ : DirichletCharacter ℂ q) (hχ : χ.IsPrimitive)
    (hD : ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ NdistL χ T (2 * T)) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ N0starL χ T (2 * T) :=
  transfer (N := fun T => NcountL χ T (2 * T)) (X := fun T => NdistL χ T (2 * T))
    (Y := fun T => N0starL χ T (2 * T)) (fun T => (N0starL_eq_NdistL hL χ hχ T (2 * T)).symm) hD

end CertMachine.Bridge
