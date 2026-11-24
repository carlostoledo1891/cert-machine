import CertMachine.Anchors
import CertMachine.BlindB

/-!
# Anchors A1–A3 on BlindB's model (DAG circuits, every vertex counted)

Author C, cert-machine VP ≠ VNP lane, 2026-11-24. The statements mention only `BlindB`'s
definitions; A1 and A3 are proved by translating a release circuit vertex for gate (same size).
-/

open MvPolynomial

namespace CertMachine.AnchorsBlindB

variable {K V : Type} [Field K]

theorem exists_gate {l : ℕ → MvPolynomial V K} {k : ℕ} (hk : Anchors.Gate l k) :
    ∃ g : BlindB.Gate K V (Fin k), l k = g.eval (fun j => l j.val) := by
  rcases hk with ⟨w, hw⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, h⟩ | ⟨i, hi, j, hj, h⟩
  · exact ⟨.input w, by simp [BlindB.Gate.eval, hw]⟩
  · exact ⟨.scalar a, by simp [BlindB.Gate.eval, ha]⟩
  · exact ⟨.add ⟨i, hi⟩ ⟨j, hj⟩, by simp [BlindB.Gate.eval, h]⟩
  · exact ⟨.mul ⟨i, hi⟩ ⟨j, hj⟩, by simp [BlindB.Gate.eval, h]⟩

/-- The DAG read off a release circuit, one vertex per gate. -/
noncomputable def ofCircuit (l : ℕ → MvPolynomial V K) (s : ℕ) (hl : Anchors.Valid l s) (k : ℕ)
    (hk : k < s) : BlindB.Circuit K V where
  size := s
  gate i := (exists_gate (hl i.val i.isLt)).choose
  output := ⟨k, hk⟩

theorem computes_of_circuit {f : MvPolynomial V K} {s : ℕ} (h : Statement.Computes f s) :
    ∃ D : BlindB.Circuit K V, D.size = s ∧ D.Computes f := by
  obtain ⟨l, hl, k, hk, rfl⟩ := h
  exact ⟨ofCircuit l s hl k hk, rfl, fun i => l i.val,
    fun i => (exists_gate (hl i.val i.isLt)).choose_spec, rfl⟩

/-- **A1 (BlindB).** Every polynomial over a field has a circuit. -/
theorem A1_B (f : MvPolynomial V K) : ∃ D : BlindB.Circuit K V, D.Computes f := by
  obtain ⟨s, hs⟩ := Anchors.A1_any f
  obtain ⟨D, -, hD⟩ := computes_of_circuit hs
  exact ⟨D, hD⟩

/-- **A2 (BlindB).** Padding: a circuit with `size` vertices computing `f` gives one with
`size + 1` (an unused scalar vertex). -/
theorem A2_B {f : MvPolynomial V K} (D : BlindB.Circuit K V) (h : D.Computes f) :
    ∃ D' : BlindB.Circuit K V, D'.size = D.size + 1 ∧ D'.Computes f := by
  obtain ⟨val, hval, hout⟩ := h
  refine ⟨⟨D.size + 1, fun i => if hi : i.val < D.size then D.gate ⟨i.val, hi⟩ else .scalar 0,
    ⟨D.output.val, by omega⟩⟩, rfl,
    fun i => if hi : i.val < D.size then val ⟨i.val, hi⟩ else 0, fun i => ?_, ?_⟩
  · by_cases hi : i.val < D.size
    · simp only [dif_pos hi]
      rw [hval ⟨i.val, hi⟩]
      congr 1
      funext j
      rw [dif_pos (by omega)]
    · simp [dif_neg hi, BlindB.Gate.eval]
  · simp only [Fin.is_lt, dif_pos]
    exact hout

/-- **A3 (BlindB).** Reuse: `X v ^ 2 ^ k` has a circuit with `k + 1` vertices (one input vertex
and `k` squarings). -/
theorem A3_B (v : V) (k : ℕ) :
    ∃ D : BlindB.Circuit K V, D.size = k + 1 ∧ D.Computes (X v ^ 2 ^ k) :=
  computes_of_circuit (Anchors.A3 v k)


/-! ### Transforming circuits: renaming variables, mapping scalars -/

/-- A vertex label with its variable renamed by `g` and its scalar mapped by `φ`. -/
def tGate {X₁ X₂ K₁ K₂ W : Type} [Field K₁] [Field K₂] (g : X₁ → X₂) (φ : K₁ →+* K₂) :
    BlindB.Gate K₁ X₁ W → BlindB.Gate K₂ X₂ W
  | .scalar a => .scalar (φ a)
  | .input x => .input (g x)
  | .add u w => .add u w
  | .mul u w => .mul u w

/-- The circuit with every vertex label transformed; same size, same output. -/
def tCircuit {X₁ X₂ K₁ K₂ : Type} [Field K₁] [Field K₂] (g : X₁ → X₂) (φ : K₁ →+* K₂)
    (D : BlindB.Circuit K₁ X₁) : BlindB.Circuit K₂ X₂ where
  size := D.size
  gate i := tGate g φ (D.gate i)
  output := D.output

section Transform

variable {X₁ X₂ K₁ K₂ : Type} [Field K₁] [Field K₂] (g : X₁ → X₂) (φ : K₁ →+* K₂)
  (ψ : MvPolynomial X₁ K₁ →+* MvPolynomial X₂ K₂) (hX : ∀ i, ψ (X i) = X (g i))
  (hC : ∀ c, ψ (C c) = C (φ c))
include hX hC

theorem tGate_eval {W : Type} (gt : BlindB.Gate K₁ X₁ W) (value : W → MvPolynomial X₁ K₁) :
    (tGate g φ gt).eval (fun w => ψ (value w)) = ψ (gt.eval value) := by
  cases gt <;> simp [tGate, BlindB.Gate.eval, hX, hC]

theorem tCircuit_computes (D : BlindB.Circuit K₁ X₁) {f : MvPolynomial X₁ K₁}
    (h : D.Computes f) : (tCircuit g φ D).Computes (ψ f) := by
  obtain ⟨val, hval, hout⟩ := h
  refine ⟨fun i => ψ (val i), fun i => ?_, by simp [tCircuit, hout]⟩
  obtain ⟨i, hi⟩ := i
  have e := tGate_eval g φ ψ hX hC (D.gate ⟨i, hi⟩)
    (fun j => val ⟨j.val, Nat.lt_trans j.isLt hi⟩)
  rw [← hval ⟨i, hi⟩] at e
  exact e.symm

end Transform

/-! ### A4–A6 and R1 on BlindB's definitions -/

/-- **A4 (BlindB).** An exact circuit over `K` gives an approximating circuit over `K((ε))` of
the same size (scalars mapped into the constant series, `g = 0`). -/
theorem A4_B {f : MvPolynomial V K} (D : BlindB.Circuit K V) (h : D.Computes f) :
    ∃ D' : BlindB.Circuit (LaurentSeries K) V, D'.size = D.size ∧ D'.Approximates f := by
  refine ⟨tCircuit id ((HahnSeries.ofPowerSeries ℤ K).comp (PowerSeries.C : K →+* PowerSeries K)) D,
    rfl, 0, ?_⟩
  have h' := tCircuit_computes id
    ((HahnSeries.ofPowerSeries ℤ K).comp (PowerSeries.C : K →+* PowerSeries K))
    (MvPolynomial.map ((HahnSeries.ofPowerSeries ℤ K).comp (PowerSeries.C : K →+* PowerSeries K)))
    (fun i => by simp) (fun c => by simp) D h
  convert h' using 1
  simp [MvPolynomial.map_map]

/-- **A5 (BlindB).** `gateBound c m` eventually exceeds every power `m ^ k`. -/
theorem A5_B (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < BlindB.gateBound c m := by
  obtain ⟨m₀, h⟩ := Anchors.A5 c hc k
  refine ⟨m₀, fun m hm => ?_⟩
  unfold BlindB.gateBound
  simpa only [Real.rpow_eq_pow] using h m hm

/-- A polynomially bounded function is eventually within `gateBound`. -/
theorem pbounded_le_bound (c : ℝ) (hc : 0 < c) (t : ℕ → ℕ) (ht : BlindB.PBounded t) (m₀ : ℕ) :
    ∃ n ≥ m₀, (t n : ℝ) ≤ BlindB.gateBound c n := by
  obtain ⟨a, d, ht⟩ := ht
  obtain ⟨n₁, hn₁⟩ := A5_B c hc (d + 1)
  refine ⟨max m₀ (max n₁ (max 1 (a * 2 ^ d))), le_max_left _ _, ?_⟩
  set n := max m₀ (max n₁ (max 1 (a * 2 ^ d)))
  have h1 : 1 ≤ n := le_max_of_le_right (le_max_of_le_right (le_max_left _ _))
  have ha : a * 2 ^ d ≤ n := le_max_of_le_right (le_max_of_le_right (le_max_right _ _))
  have h2 : t n ≤ n ^ (d + 1) :=
    calc t n ≤ a * (n + 1) ^ d := ht n
      _ ≤ a * (2 * n) ^ d := Nat.mul_le_mul_left _ (Nat.pow_le_pow_left (by omega) d)
      _ = (a * 2 ^ d) * n ^ d := by rw [mul_pow, mul_assoc]
      _ ≤ n * n ^ d := Nat.mul_le_mul_right _ ha
      _ = n ^ (d + 1) := by rw [pow_succ, mul_comm]
  have h3 := hn₁ n (le_max_of_le_right (le_max_left _ _))
  calc (t n : ℝ) ≤ ((n ^ (d + 1) : ℕ) : ℝ) := by exact_mod_cast h2
    _ = (n : ℝ) ^ (d + 1) := by push_cast; rfl
    _ ≤ _ := h3.le

/-- Renaming the variables of a circuit back along `finProdFinEquiv`. -/
theorem computes_unrename {K : Type} [Field K] {n : ℕ} (f : MvPolynomial (Fin n × Fin n) K)
    (D : BlindB.Circuit K (Fin (n * n)))
    (h : D.Computes (rename (fun ij : Fin n × Fin n => finProdFinEquiv ij) f)) :
    ∃ D' : BlindB.Circuit K (Fin n × Fin n), D'.size = D.size ∧ D'.Computes f := by
  refine ⟨tCircuit finProdFinEquiv.symm (RingHom.id K) D, rfl, ?_⟩
  have h' := tCircuit_computes finProdFinEquiv.symm (RingHom.id K)
    (rename finProdFinEquiv.symm).toRingHom (fun i => by simp) (fun c => by simp) D h
  convert h' using 1
  simp [rename_rename]

/-- **A6 (BlindB).** From `BlindB.MainTheorem` alone: over every field the Hamiltonian-cycle
family (`n²` variables, `HC` renamed by `finProdFinEquiv`) is not in VP, and over every field of
characteristic `≠ 2` the permanent family is not in VP. -/
theorem A6_B (h : BlindB.MainTheorem) (K : Type) [Field K] :
    (⟨fun n => n * n, fun n => rename (fun ij : Fin n × Fin n => finProdFinEquiv ij)
        (BlindB.HC K n)⟩ : BlindB.Family K) ∉ BlindB.VP K ∧
      (ringChar K ≠ 2 →
        (⟨fun n => n * n, fun n => rename (fun ij : Fin n × Fin n => finProdFinEquiv ij)
          (BlindB.PERM K n)⟩ : BlindB.Family K) ∉ BlindB.VP K) := by
  obtain ⟨c, hc0, hmain⟩ := h
  have hp : ringChar K = 0 ∨ (ringChar K).Prime :=
    (CharP.char_is_prime_or_zero K (ringChar K)).symm
  obtain ⟨m₀, hm₀⟩ := hmain (ringChar K) hp
  have := ringChar.charP K
  refine ⟨fun ⟨_, s, hs, hD⟩ => ?_, fun h2 ⟨_, s, hs, hD⟩ => ?_⟩
  · obtain ⟨n, hn, hle⟩ := pbounded_le_bound c hc0 s hs m₀
    obtain ⟨D, hsize, hcomp⟩ := hD n
    obtain ⟨D', hsize', hcomp'⟩ := computes_unrename _ D hcomp
    have h1 := hm₀ K n hn D' (Or.inl hcomp')
    have h3 : (D'.size : ℝ) ≤ (s n : ℝ) := by exact_mod_cast hsize' ▸ hsize
    linarith
  · obtain ⟨n, hn, hle⟩ := pbounded_le_bound c hc0 s hs m₀
    obtain ⟨D, hsize, hcomp⟩ := hD n
    obtain ⟨D', hsize', hcomp'⟩ := computes_unrename _ D hcomp
    have h1 := hm₀ K n hn D' (Or.inr ⟨h2, hcomp'⟩)
    have h3 : (D'.size : ℝ) ≤ (s n : ℝ) := by exact_mod_cast hsize' ▸ hsize
    linarith

/-- **R1 (BlindB), proved false.** The planted claim for BlindB's model: over `ℚ` every circuit for
the dense power `(Σ_{i,j} X (i, j)) ^ m` has more than `gateBound c m` vertices for all large `m`. -/
theorem R1_B : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    ∀ D : BlindB.Circuit ℚ (Fin m × Fin m),
      D.Computes ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) →
        BlindB.gateBound c m < (D.size : ℝ) := by
  rintro ⟨c, hc, m₀, h⟩
  obtain ⟨k, hmk, hle⟩ := Anchors.exists_dense_size_le c hc m₀
  obtain ⟨D, hsize, hD⟩ := computes_of_circuit (Anchors.dense_power_computes ℚ k)
  have h1 := h (2 ^ k) hmk D hD
  rw [hsize] at h1
  unfold BlindB.gateBound at h1
  simp only [Real.rpow_eq_pow] at h1
  exact absurd h1 (not_lt.mpr hle)

end CertMachine.AnchorsBlindB

#print axioms CertMachine.AnchorsBlindB.A1_B
#print axioms CertMachine.AnchorsBlindB.A2_B
#print axioms CertMachine.AnchorsBlindB.A3_B
#print axioms CertMachine.AnchorsBlindB.A4_B
#print axioms CertMachine.AnchorsBlindB.A5_B
#print axioms CertMachine.AnchorsBlindB.A6_B
#print axioms CertMachine.AnchorsBlindB.R1_B
