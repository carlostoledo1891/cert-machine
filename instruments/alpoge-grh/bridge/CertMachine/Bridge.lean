import Main
import Solution
import CertMachine.BridgeConditional

/-!
# The unconditional bridge (cert-machine, 2026-11-20; pre-registration amendment A1)

One environment holding both releases: today's (`Main`: `riemannHypothesis`, `LFunction_eq_zero_re_of_isPrimitive`)
and August's (`Solution`: `five_sixths_distinct`, `montgomery_taylor_distinct_mult`, their cumulative forms, and the
Dirichlet ones). The conditional bridge (`CertMachine.BridgeConditional`) does the rest. The statements are those of
`CertMachine.BridgeChallenge`, judged by Comparator.
-/

noncomputable section

namespace CertMachine.Bridge

theorem five_sixths_distinct_on_critical_line :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount T (2 * T) : ℝ) ≤ N0star T (2 * T) :=
  five_sixths_on_line_of_RH riemannHypothesis five_sixths_distinct

theorem five_sixths_distinct_on_critical_line_cumulative :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (Ncount 0 T : ℝ) ≤ N0star 0 T :=
  five_sixths_on_line_cumulative_of_RH riemannHypothesis five_sixths_distinct_cumulative

theorem montgomery_taylor_distinct_on_critical_line :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount T (2 * T) : ℝ) ≤ N0star T (2 * T) :=
  montgomery_taylor_on_line_of_RH riemannHypothesis montgomery_taylor_distinct_mult

theorem montgomery_taylor_distinct_on_critical_line_cumulative :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (Ncount 0 T : ℝ) ≤ N0star 0 T :=
  montgomery_taylor_on_line_cumulative_of_RH riemannHypothesis montgomery_taylor_distinct_mult_cumulative

theorem dirichlet_five_sixths_distinct_on_critical_line
    {q : ℕ} [NeZero q] (χ : DirichletCharacter ℂ q) (hq : 1 < q) (hχ : χ.IsPrimitive) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (5 / 6 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ N0starL χ T (2 * T) :=
  dirichlet_five_sixths_on_line_of_L LFunction_eq_zero_re_of_isPrimitive χ hχ
    (dirichlet_five_sixths_distinct χ hq hχ)

theorem dirichlet_montgomery_taylor_distinct_on_critical_line
    {q : ℕ} [NeZero q] (χ : DirichletCharacter ℂ q) (hq : 1 < q) (hχ : χ.IsPrimitive) :
    ∀ ε > 0, ∃ T₀ : ℝ, ∀ T ≥ T₀, (3 / 2 - cMT⁻¹ / 2 - ε) * (NcountL χ T (2 * T) : ℝ) ≤ N0starL χ T (2 * T) :=
  dirichlet_montgomery_taylor_on_line_of_L LFunction_eq_zero_re_of_isPrimitive χ hχ
    (dirichlet_montgomery_taylor_distinct_mult χ hq hχ)

end CertMachine.Bridge

end
