import OAI.Algorithms.SubexponentialSAT.SqrtLog.StatementScale
import OAI.Combinatorics.ParityLifts.ExpBounds

/-!
# ETH correspondence, component A: subexponential asymptotics

This module is part of a bridge from the verified bounded-width SAT algorithm
(`OAI.Algorithms.SubexponentialSAT.SqrtLog.Statement.Feasible`) to the conventional
predicate `OAI.ParityWL.Complexity.PositiveRateETH`. It adds no algorithm and no
complexity claim. It proves one numerical fact: the runtime factor of the verified
bound, times any fixed polynomial, satisfies `ExpBound` at every positive rate.

The two other components of the bridge stay open research targets:

* **B (encoding).** An `FCode` that turns `treeEncode (minimizeList F.bitList)`, for
  `F : ParityWL.Complexity.Formula N`, into `Encoding.encodeCNF G` for some
  `G : SAT.CNF (Fin n')` with `n' ≤ N`, `SAT.WidthAtMost 3 G`, and
  `SAT.Satisfiable G ↔ F.Satisfiable`, within cost polynomial in `N`.
* **C (simulation).** An `FCode` that runs a fixed `Computation.PrimitiveMachine` from
  `machine.init w` until it halts in `Sum.inl b`, returns `treeEncode b`, and costs at
  most polynomially many steps in `T + w.length` when the machine halts within `T` steps.

With A, B, C in hand, `sat_code_rate` and the argument of `fixed_dimension_eth` give
`SqrtLog.Statement.Feasible 3 → ¬ ParityWL.Complexity.PositiveRateETH`. That theorem is
not proved here.
-/

namespace OAI.Bridges.ETH

open Filter Topology
open OAI.Algorithms.SubexponentialSAT.SqrtLog.Statement (runtimeScale runtimeScale_nonneg)

/-- The per-variable factor of `runtimeScale` tends to zero:
`(log log (n+16))² / √(log (n+16)) → 0`. -/
theorem runtimeScale_ratio_tendsto :
    Tendsto (fun n : ℕ => (Real.log (Real.log ((n : ℝ) + 16))) ^ 2 /
      Real.sqrt (Real.log ((n : ℝ) + 16))) atTop (𝓝 0) := by
  have h1 : Tendsto (fun y : ℝ => Real.log y ^ (2 : ℝ) / y ^ (1 / 2 : ℝ)) atTop (𝓝 0) :=
    (isLittleO_log_rpow_rpow_atTop 2 (by norm_num : (0 : ℝ) < 1 / 2)).tendsto_div_nhds_zero
  have h2 : Tendsto (fun n : ℕ => Real.log ((n : ℝ) + 16)) atTop atTop :=
    Real.tendsto_log_atTop.comp
      (tendsto_atTop_add_const_right _ 16 tendsto_natCast_atTop_atTop)
  refine (h1.comp h2).congr fun n => ?_
  simp only [Function.comp, Real.sqrt_eq_rpow, Real.rpow_two]

/-- `runtimeScale n = o(n)`, in the form used below: for every slope `c > 0`,
eventually `runtimeScale n ≤ c * n`. -/
theorem runtimeScale_eventually_le {c : ℝ} (hc : 0 < c) :
    ∀ᶠ n : ℕ in atTop, runtimeScale n ≤ c * n := by
  filter_upwards [runtimeScale_ratio_tendsto.eventually (eventually_le_nhds hc)] with n hn
  have h : runtimeScale n = (n : ℝ) * ((Real.log (Real.log ((n : ℝ) + 16))) ^ 2 /
      Real.sqrt (Real.log ((n : ℝ) + 16))) := by
    unfold runtimeScale
    rw [mul_div_assoc]
  rw [h, mul_comm c]
  exact mul_le_mul_of_nonneg_left hn (Nat.cast_nonneg n)

/-- **Component A.** For every constant `K ≥ 0`, every real `A`, every polynomial degree
`D`, and every rate `r > 0`, the runtime factor `K (N+1)^D 2^(A · runtimeScale N)` of the
verified bound satisfies `ExpBound _ r`: it is at most `C (N+1)^D 2^(r N)` for all `N`. -/
theorem runtimeFactor_expBound (K A : ℝ) (D : ℕ) (hK : 0 ≤ K) {r : ℝ} (hr : 0 < r) :
    ParityWL.Complexity.ExpBound
      (fun N => K * ((N : ℝ) + 1) ^ D * (2 : ℝ) ^ (A * runtimeScale N)) r := by
  -- Eventually `A * runtimeScale n ≤ r * n`.
  have hc : 0 < r / (|A| + 1) := div_pos hr (by positivity)
  obtain ⟨N₀, hN₀⟩ := eventually_atTop.mp (runtimeScale_eventually_le hc)
  have hlarge : ∀ n, N₀ ≤ n → A * runtimeScale n ≤ r * n := by
    intro n hn
    have hs := hN₀ n hn
    have hs0 := runtimeScale_nonneg n
    have hA1 : |A| ≤ |A| + 1 := by linarith
    calc
      A * runtimeScale n ≤ |A| * runtimeScale n :=
        mul_le_mul_of_nonneg_right (le_abs_self A) hs0
      _ ≤ |A| * (r / (|A| + 1) * n) := mul_le_mul_of_nonneg_left hs (abs_nonneg A)
      _ = (|A| / (|A| + 1)) * (r * n) := by ring
      _ ≤ 1 * (r * n) := by
          apply mul_le_mul_of_nonneg_right _ (by positivity)
          exact (div_le_one (by positivity)).mpr hA1
      _ = r * n := one_mul _
  -- The finitely many small inputs go into the constant.
  let S : ℝ := 1 + ∑ m ∈ Finset.range N₀, (2 : ℝ) ^ (A * runtimeScale m)
  have hS : 1 ≤ S := by
    have : 0 ≤ ∑ m ∈ Finset.range N₀, (2 : ℝ) ^ (A * runtimeScale m) :=
      Finset.sum_nonneg fun m _ => (Real.rpow_pos_of_pos (by norm_num) _).le
    dsimp only [S]; linarith
  have hexp : ∀ n : ℕ, (2 : ℝ) ^ (A * runtimeScale n) ≤ S * (2 : ℝ) ^ (r * n) := by
    intro n
    have hone : (1 : ℝ) ≤ (2 : ℝ) ^ (r * n) :=
      Real.one_le_rpow (by norm_num) (mul_nonneg hr.le (Nat.cast_nonneg n))
    by_cases hn : n < N₀
    · have hmem : (2 : ℝ) ^ (A * runtimeScale n) ≤
          ∑ m ∈ Finset.range N₀, (2 : ℝ) ^ (A * runtimeScale m) :=
        Finset.single_le_sum (f := fun m => (2 : ℝ) ^ (A * runtimeScale m))
          (fun m _ => (Real.rpow_pos_of_pos (by norm_num) _).le)
          (Finset.mem_range.mpr hn)
      calc
        (2 : ℝ) ^ (A * runtimeScale n) ≤ S := by dsimp only [S]; linarith
        _ = S * 1 := (mul_one S).symm
        _ ≤ S * (2 : ℝ) ^ (r * n) := mul_le_mul_of_nonneg_left hone (by linarith)
    · calc
        (2 : ℝ) ^ (A * runtimeScale n) ≤ (2 : ℝ) ^ (r * n) :=
          Real.rpow_le_rpow_of_exponent_le (by norm_num) (hlarge n (by omega))
        _ = 1 * (2 : ℝ) ^ (r * n) := (one_mul _).symm
        _ ≤ S * (2 : ℝ) ^ (r * n) :=
          mul_le_mul_of_nonneg_right hS (Real.rpow_pos_of_pos (by norm_num) _).le
  refine ⟨fun n => by positivity, (K + 1) * S, by positivity, D, ?_⟩
  intro n
  have hpoly : (0 : ℝ) ≤ ((n : ℝ) + 1) ^ D := by positivity
  calc
    K * ((n : ℝ) + 1) ^ D * (2 : ℝ) ^ (A * runtimeScale n)
        ≤ (K + 1) * ((n : ℝ) + 1) ^ D * (2 : ℝ) ^ (A * runtimeScale n) := by
          gcongr
          linarith
    _ ≤ (K + 1) * ((n : ℝ) + 1) ^ D * (S * (2 : ℝ) ^ (r * n)) :=
          mul_le_mul_of_nonneg_left (hexp n) (by positivity)
    _ = (K + 1) * S * ((n : ℝ) + 1) ^ D * (2 : ℝ) ^ (r * n) := by ring

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.runtimeScale_ratio_tendsto
#print axioms OAI.Bridges.ETH.runtimeScale_eventually_le
#print axioms OAI.Bridges.ETH.runtimeFactor_expBound
