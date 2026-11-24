import CertMachine.Anchors
import CertMachine.BlindA

/-!
# Anchors A1–A3 on BlindA's model (straight-line programs, operations counted)

Author C, cert-machine VP ≠ VNP lane, 2026-11-24. The statements mention only `BlindA`'s
definitions; A1 is proved by translating a release circuit (from `Anchors.A1_any`) gate for gate.
-/

open MvPolynomial BlindA

namespace CertMachine.AnchorsBlindA

variable {σ F : Type} [Field F]

/-- The `j`-th result, read from any longer prefix, is the `j`-th instruction applied to the
first `j` results. -/
theorem vals_apply {R : Type} [CommRing R] [Algebra F R] {ℓ : ℕ} (P : SLP σ F ℓ) (x : σ → R) :
    ∀ (r : ℕ) (hr : r ≤ ℓ) (j : ℕ) (hj : j < r),
      P.vals x r hr ⟨j, hj⟩ = (P.instr ⟨j, by omega⟩).eval x (P.vals x j (by omega)) := by
  intro r
  induction r with
  | zero => intro _ j hj; omega
  | succ r ih =>
    intro hr j hj
    rw [SLP.vals]
    dsimp only
    split
    · next h => exact ih _ j h
    · next h =>
      have : j = r := by simp at h; omega
      subst this
      rfl

theorem result_apply {R : Type} [CommRing R] [Algebra F R] {ℓ : ℕ} (P : SLP σ F ℓ) (x : σ → R)
    (j : ℕ) (hj : j < ℓ) :
    P.result x ⟨j, hj⟩ = (P.instr ⟨j, hj⟩).eval x (P.vals x j hj.le) :=
  vals_apply P x ℓ le_rfl j hj

/-! ### From a release circuit to a program of the same length -/

theorem exists_instr {l : ℕ → MvPolynomial σ F} {k : ℕ} (hk : Anchors.Gate l k) :
    ∃ I : Instr σ F k, ∀ u : Fin k → MvPolynomial σ F, (∀ j : Fin k, u j = l j) →
      I.eval (fun i => X i) u = l k := by
  rcases hk with ⟨w, hw⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, h⟩ | ⟨i, hi, j, hj, h⟩
  · exact ⟨⟨Op.add, Operand.var w, Operand.const 0⟩, fun u _ => by
      simp [Instr.eval, Op.apply, Operand.eval, hw]⟩
  · exact ⟨⟨Op.add, Operand.const a, Operand.const 0⟩, fun u _ => by
      simp [Instr.eval, Op.apply, Operand.eval, ha, MvPolynomial.algebraMap_eq]⟩
  · exact ⟨⟨Op.add, Operand.prev ⟨i, hi⟩, Operand.prev ⟨j, hj⟩⟩, fun u hu => by
      simp [Instr.eval, Op.apply, Operand.eval, hu, h]⟩
  · exact ⟨⟨Op.mul, Operand.prev ⟨i, hi⟩, Operand.prev ⟨j, hj⟩⟩, fun u hu => by
      simp [Instr.eval, Op.apply, Operand.eval, hu, h]⟩

/-- The program read off a release circuit, one instruction per gate. -/
noncomputable def ofCircuit (l : ℕ → MvPolynomial σ F) (s : ℕ) (hl : Anchors.Valid l s) :
    SLP σ F s :=
  ⟨fun r => (exists_instr (hl r.val r.isLt)).choose⟩

theorem ofCircuit_eval (l : ℕ → MvPolynomial σ F) (s : ℕ) (hl : Anchors.Valid l s) :
    ∀ k (hk : k < s), ((ofCircuit l s hl).instr ⟨k, hk⟩).eval (fun i => X i)
      ((ofCircuit l s hl).vals (fun i => X i) k hk.le) = l k := by
  intro k
  induction k using Nat.strong_induction_on with
  | _ k ih =>
    intro hk
    refine (exists_instr (hl k hk)).choose_spec _ fun j => ?_
    obtain ⟨j, hj⟩ := j
    rw [vals_apply _ _ k hk.le j hj]
    exact ih j hj (by omega)

theorem computes_of_circuit {f : MvPolynomial σ F} {s : ℕ} (h : Statement.Computes f s) :
    ∃ P : SLP σ F s, f ∈ P.computed := by
  obtain ⟨l, hl, k, hk, rfl⟩ := h
  refine ⟨ofCircuit l s hl, Or.inr ⟨⟨k, hk⟩, ?_⟩⟩
  rw [result_apply]
  exact ofCircuit_eval l s hl k hk

/-! ### Padding -/

/-- `P` followed by one more instruction, `0 + 0`. -/
def pad {ℓ : ℕ} (P : SLP σ F ℓ) : SLP σ F (ℓ + 1) :=
  ⟨fun r => if h : r.val < ℓ then P.instr ⟨r.val, h⟩ else ⟨Op.add, Operand.const 0, Operand.const 0⟩⟩

theorem pad_vals {R : Type} [CommRing R] [Algebra F R] {ℓ : ℕ} (P : SLP σ F ℓ) (x : σ → R) :
    ∀ j (hj : j ≤ ℓ), (pad P).vals x j (Nat.le_succ_of_le hj) = P.vals x j hj := by
  intro j
  induction j using Nat.strong_induction_on with
  | _ j ih =>
    intro hj
    funext ⟨i, hi⟩
    rw [vals_apply _ _ j _ i hi, vals_apply _ _ j hj i hi, ih i hi (by omega)]
    have e : (pad P).instr ⟨i, by omega⟩ = P.instr ⟨i, by omega⟩ := by
      simp [pad, show i < ℓ by omega]
    rw [e]

theorem pad_result {R : Type} [CommRing R] [Algebra F R] {ℓ : ℕ} (P : SLP σ F ℓ) (x : σ → R)
    (j : ℕ) (hj : j < ℓ) : (pad P).result x ⟨j, by omega⟩ = P.result x ⟨j, hj⟩ := by
  rw [result_apply, result_apply, pad_vals P x j hj.le]
  have e : (pad P).instr ⟨j, by omega⟩ = P.instr ⟨j, hj⟩ := by simp [pad, hj]
  rw [e]

/-! ### Squaring -/

/-- Instruction `r` of the squaring program: `x_v · x_v`, then the previous result squared. -/
def sqInstr (v : σ) : (r : ℕ) → Instr σ F r
  | 0 => ⟨Op.mul, Operand.var v, Operand.var v⟩
  | r + 1 => ⟨Op.mul, Operand.prev ⟨r, Nat.lt_succ_self r⟩, Operand.prev ⟨r, Nat.lt_succ_self r⟩⟩

/-- `k` squarings of the variable `X v`. -/
def sqProg (v : σ) (k : ℕ) : SLP σ F k := ⟨fun r => sqInstr v r.val⟩

theorem sqProg_eval (v : σ) (k : ℕ) : ∀ r (hr : r < k),
    ((sqProg (F := F) v k).instr ⟨r, hr⟩).eval (fun i => (X i : MvPolynomial σ F))
      ((sqProg (F := F) v k).vals (fun i => (X i : MvPolynomial σ F)) r hr.le) =
        X v ^ 2 ^ (r + 1) := by
  intro r
  induction r with
  | zero =>
    intro _
    simp [sqProg, sqInstr, Instr.eval, Op.apply, Operand.eval, pow_two]
  | succ r ih =>
    intro hr
    have h1 := vals_apply (sqProg (F := F) v k) (fun i => (X i : MvPolynomial σ F)) (r + 1) hr.le r
      (by omega)
    rw [ih (by omega)] at h1
    show (Op.mul.apply
      ((sqProg (F := F) v k).vals (fun i => (X i : MvPolynomial σ F)) (r + 1) hr.le ⟨r, _⟩)
      ((sqProg (F := F) v k).vals (fun i => (X i : MvPolynomial σ F)) (r + 1) hr.le ⟨r, _⟩)) = _
    rw [h1]
    simp only [Op.apply]
    rw [← pow_two, ← pow_mul, ← pow_succ]

/-! ### The anchors -/

/-- **A1 (BlindA).** Every polynomial over a field is computed by some straight-line program, so
the set under `sInf` in `BlindA.complexity` is nonempty. -/
theorem A1_A (f : MvPolynomial σ F) : ∃ ℓ : ℕ, ∃ P : SLP σ F ℓ, f ∈ P.computed := by
  obtain ⟨s, hs⟩ := Anchors.A1_any f
  exact ⟨s, computes_of_circuit hs⟩

/-- A1, consequence: the minimum is attained, a program of length `complexity F f` computes `f`. -/
theorem A1_A_min (f : MvPolynomial σ F) : ∃ P : SLP σ F (complexity F f), f ∈ P.computed :=
  Nat.sInf_mem (A1_A f)

/-- A1, consequence: `B < complexity F f` says exactly that every program computing `f` has more
than `B` operations (the reading of BlindA's main theorem). -/
theorem complexity_gt_iff (f : MvPolynomial σ F) (B : ℝ) :
    B < (complexity F f : ℝ) ↔ ∀ (ℓ : ℕ) (P : SLP σ F ℓ), f ∈ P.computed → B < ℓ := by
  constructor
  · intro h ℓ P hP
    have hle : complexity F f ≤ ℓ := Nat.sInf_le ⟨P, hP⟩
    exact lt_of_lt_of_le h (by exact_mod_cast hle)
  · intro h
    obtain ⟨P, hP⟩ := A1_A_min f
    exact h _ P hP

/-- **A2 (BlindA).** Padding: a program of length `ℓ` computing `f` gives one of length `ℓ + 1`. -/
theorem A2_A {f : MvPolynomial σ F} {ℓ : ℕ} (P : SLP σ F ℓ) (h : f ∈ P.computed) :
    ∃ P' : SLP σ F (ℓ + 1), f ∈ P'.computed := by
  refine ⟨pad P, ?_⟩
  rcases h with h | ⟨⟨j, hj⟩, rfl⟩
  · exact Or.inl h
  · exact Or.inr ⟨⟨j, by omega⟩, pad_result P _ j hj⟩

/-- **A3 (BlindA).** Reuse: `X v ^ 2 ^ k` is computed by a program of length `k` (`k` squarings). -/
theorem A3_A (v : σ) (k : ℕ) : ∃ P : SLP σ F k, (X v ^ 2 ^ k : MvPolynomial σ F) ∈ P.computed := by
  refine ⟨sqProg v k, ?_⟩
  cases k with
  | zero => exact Or.inl (Or.inl ⟨v, by simp⟩)
  | succ r =>
    refine Or.inr ⟨⟨r, by omega⟩, ?_⟩
    rw [result_apply]
    exact sqProg_eval v (r + 1) r (by omega)

/-- A3, consequence: `complexity F (X v ^ 2 ^ k) ≤ k`. -/
theorem A3_A_complexity (v : σ) (k : ℕ) : complexity F (X v ^ 2 ^ k : MvPolynomial σ F) ≤ k :=
  Nat.sInf_le (A3_A v k)


/-! ### Transforming programs: renaming variables, mapping constants -/

/-- An operand with its variable renamed by `g` and its constant mapped by `φ`. -/
def tOperand {σ₁ σ₂ F₁ F₂ : Type} [Field F₁] [Field F₂] (g : σ₁ → σ₂) (φ : F₁ →+* F₂) {r : ℕ} :
    Operand σ₁ F₁ r → Operand σ₂ F₂ r
  | .var i => .var (g i)
  | .const c => .const (φ c)
  | .prev j => .prev j

/-- The program with every operand transformed; same length. -/
def transform {σ₁ σ₂ F₁ F₂ : Type} [Field F₁] [Field F₂] (g : σ₁ → σ₂) (φ : F₁ →+* F₂) {ℓ : ℕ}
    (P : SLP σ₁ F₁ ℓ) : SLP σ₂ F₂ ℓ :=
  ⟨fun r => ⟨(P.instr r).op, tOperand g φ (P.instr r).left, tOperand g φ (P.instr r).right⟩⟩

section Transform

variable {σ₁ σ₂ F₁ F₂ : Type} [Field F₁] [Field F₂] (g : σ₁ → σ₂) (φ : F₁ →+* F₂)
  (ψ : MvPolynomial σ₁ F₁ →+* MvPolynomial σ₂ F₂) (hX : ∀ i, ψ (X i) = X (g i))
  (hC : ∀ c, ψ (C c) = C (φ c))
include hX hC

theorem tOperand_eval {r : ℕ} (a : Operand σ₁ F₁ r) (u : Fin r → MvPolynomial σ₁ F₁) :
    (tOperand g φ a).eval (fun i => (X i : MvPolynomial σ₂ F₂)) (fun j => ψ (u j)) =
      ψ (a.eval (fun i => X i) u) := by
  cases a with
  | var i => simp [tOperand, Operand.eval, hX]
  | const c => simp [tOperand, Operand.eval, MvPolynomial.algebraMap_eq, hC]
  | prev j => simp [tOperand, Operand.eval]

theorem tInstr_eval {r : ℕ} (I : Instr σ₁ F₁ r) (u : Fin r → MvPolynomial σ₁ F₁) :
    (⟨I.op, tOperand g φ I.left, tOperand g φ I.right⟩ : Instr σ₂ F₂ r).eval
      (fun i => (X i : MvPolynomial σ₂ F₂)) (fun j => ψ (u j)) = ψ (I.eval (fun i => X i) u) := by
  obtain ⟨op, a, b⟩ := I
  simp only [Instr.eval, tOperand_eval g φ ψ hX hC]
  cases op <;> simp [Op.apply]

theorem transform_vals {ℓ : ℕ} (P : SLP σ₁ F₁ ℓ) : ∀ j r (hr : r ≤ ℓ) (hj : j < r),
    (transform g φ P).vals (fun i => (X i : MvPolynomial σ₂ F₂)) r hr ⟨j, hj⟩ =
      ψ (P.vals (fun i => (X i : MvPolynomial σ₁ F₁)) r hr ⟨j, hj⟩) := by
  intro j
  induction j using Nat.strong_induction_on with
  | _ j ih =>
    intro r hr hj
    rw [vals_apply _ _ r hr j hj, vals_apply _ _ r hr j hj]
    have hv : (transform g φ P).vals (fun i => (X i : MvPolynomial σ₂ F₂)) j (by omega) =
        fun i => ψ (P.vals (fun i => (X i : MvPolynomial σ₁ F₁)) j (by omega) i) := by
      funext ⟨i, hi⟩
      exact ih i hi j (by omega) hi
    rw [hv]
    exact tInstr_eval g φ ψ hX hC (P.instr ⟨j, by omega⟩) _

theorem transform_computed {ℓ : ℕ} (P : SLP σ₁ F₁ ℓ) {f : MvPolynomial σ₁ F₁}
    (h : f ∈ P.computed) : ψ f ∈ (transform g φ P).computed := by
  rcases h with (⟨i, rfl⟩ | ⟨c, rfl⟩) | ⟨⟨j, hj⟩, rfl⟩
  · exact Or.inl (Or.inl ⟨g i, (hX i).symm⟩)
  · exact Or.inl (Or.inr ⟨φ c, (hC c).symm⟩)
  · exact Or.inr ⟨⟨j, hj⟩, transform_vals g φ ψ hX hC P j ℓ le_rfl hj⟩

end Transform

/-- Renaming the variables by a bijection does not lower the complexity. -/
theorem complexity_le_rename {σ₁ σ₂ K : Type} [Field K] (e : σ₁ ≃ σ₂) (f : MvPolynomial σ₁ K) :
    complexity K f ≤ complexity K (rename e f) := by
  obtain ⟨P, hP⟩ := A1_A_min (rename e f)
  have h := transform_computed e.symm (RingHom.id K) (rename e.symm).toRingHom
    (fun i => by simp) (fun c => by simp) P hP
  have e2 : (rename e.symm).toRingHom (rename e f) = f := by
    simp [rename_rename]
  rw [e2] at h
  exact Nat.sInf_le ⟨_, h⟩

/-- A polynomial with natural coefficients is at most `q(1) · n ^ deg q` at `n ≥ 1`. -/
theorem poly_eval_le (q : Polynomial ℕ) (n : ℕ) (hn : 1 ≤ n) :
    q.eval n ≤ q.eval 1 * n ^ q.natDegree := by
  rw [Polynomial.eval_eq_sum_range, Polynomial.eval_eq_sum_range, Finset.sum_mul]
  refine Finset.sum_le_sum fun i hi => ?_
  rw [one_pow, mul_one]
  exact Nat.mul_le_mul_left _ (Nat.pow_le_pow_right hn (by simp at hi; omega))

/-! ### A4–A6 and R1 on BlindA's definitions -/

/-- **A4 (BlindA).** An exact program over `K` gives an approximating program over `K((ε))` of
the same length (constants mapped into the constant series, `g = 0`). -/
theorem A4_A {K : Type} [Field K] {f : MvPolynomial σ K} {ℓ : ℕ} (P : SLP σ K ℓ)
    (h : f ∈ P.computed) :
    ∃ P' : SLP σ (LaurentSeries K) ℓ, ∃ G ∈ P'.computed, Approximates K G f :=
  ⟨transform id (algebraMap K (LaurentSeries K)) P, _,
    transform_computed id (algebraMap K (LaurentSeries K))
      (MvPolynomial.map (algebraMap K (LaurentSeries K))) (fun i => by simp) (fun c => by simp) P h,
    0, by simp⟩

/-- A4, consequence: `approxComplexity K f ≤ complexity K f`. -/
theorem A4_A_complexity {K : Type} [Field K] (f : MvPolynomial σ K) :
    approxComplexity K f ≤ complexity K f := by
  obtain ⟨P, hP⟩ := A1_A_min f
  obtain ⟨P', G, hG, hA⟩ := A4_A P hP
  exact Nat.sInf_le ⟨P', G, hG, hA⟩

/-- **A5 (BlindA).** `claimedBound c m` eventually exceeds every power `m ^ k`. -/
theorem A5_A (c : ℝ) (hc : 0 < c) (k : ℕ) :
    ∃ m₀ : ℕ, ∀ m ≥ m₀, (m : ℝ) ^ k < claimedBound c m := by
  obtain ⟨m₀, h⟩ := Anchors.A5 c hc k
  exact ⟨m₀, fun m hm => h m hm⟩

/-- A p-bounded function is eventually within `claimedBound`. -/
theorem pbounded_le_bound (c : ℝ) (hc : 0 < c) (t : ℕ → ℕ) (ht : PBounded t) (m₀ : ℕ) :
    ∃ n ≥ m₀, (t n : ℝ) ≤ claimedBound c n := by
  obtain ⟨q, hq⟩ := ht
  obtain ⟨n₁, hn₁⟩ := A5_A c hc (q.natDegree + 1)
  refine ⟨max m₀ (max n₁ (max 1 (q.eval 1))), le_max_left _ _, ?_⟩
  set n := max m₀ (max n₁ (max 1 (q.eval 1)))
  have h1 : 1 ≤ n := le_max_of_le_right (le_max_of_le_right (le_max_left _ _))
  have hq1 : q.eval 1 ≤ n := le_max_of_le_right (le_max_of_le_right (le_max_right _ _))
  have h2 : t n ≤ n ^ (q.natDegree + 1) :=
    calc t n ≤ q.eval n := hq n
      _ ≤ q.eval 1 * n ^ q.natDegree := poly_eval_le q n h1
      _ ≤ n * n ^ q.natDegree := Nat.mul_le_mul_right _ hq1
      _ = n ^ (q.natDegree + 1) := by rw [pow_succ, mul_comm]
  have h3 := hn₁ n (le_max_of_le_right (le_max_left _ _))
  calc (t n : ℝ) ≤ ((n ^ (q.natDegree + 1) : ℕ) : ℝ) := by exact_mod_cast h2
    _ = (n : ℝ) ^ (q.natDegree + 1) := by push_cast; rfl
    _ ≤ _ := h3.le

/-- **A6 (BlindA).** From `BlindA.MainTheorem` alone: over every field `hcFamily` is not in VP,
and over every field of characteristic `≠ 2` `permFamily` is not in VP. -/
theorem A6_A (h : BlindA.MainTheorem) (K : Type) [Field K] :
    hcFamily K ∉ VP K ∧ (ringChar K ≠ 2 → permFamily K ∉ VP K) := by
  obtain ⟨c, hc0, hmain⟩ := h
  have hp : ringChar K = 0 ∨ (ringChar K).Prime :=
    (CharP.char_is_prime_or_zero K (ringChar K)).symm
  obtain ⟨m₀, hm₀⟩ := hmain (ringChar K) hp
  have := ringChar.charP K
  refine ⟨fun hv => ?_, fun h2 hv => ?_⟩
  · obtain ⟨n, hn, hle⟩ := pbounded_le_bound c hc0 _ hv.2 m₀
    have h1 := (hm₀ K n hn).1
    have h3 : complexity K (BlindA.hc K n) ≤ complexity K ((hcFamily K).poly n) :=
      complexity_le_rename finProdFinEquiv (BlindA.hc K n)
    have h4 : (complexity K (BlindA.hc K n) : ℝ) ≤ (complexity K ((hcFamily K).poly n) : ℝ) := by
      exact_mod_cast h3
    linarith
  · obtain ⟨n, hn, hle⟩ := pbounded_le_bound c hc0 _ hv.2 m₀
    have h1 := (hm₀ K n hn).2 h2
    have h3 : complexity K (perm K n) ≤ complexity K ((permFamily K).poly n) :=
      complexity_le_rename finProdFinEquiv (perm K n)
    have h4 : (complexity K (perm K n) : ℝ) ≤ (complexity K ((permFamily K).poly n) : ℝ) := by
      exact_mod_cast h3
    linarith

/-- **R1 (BlindA), proved false.** The planted claim for BlindA's model: over `ℚ` the dense power
`(Σ_{i,j} X (i, j)) ^ m` has complexity above `claimedBound c m` for all large `m`. -/
theorem R1_A : ¬ ∃ c : ℝ, 0 < c ∧ ∃ m₀ : ℕ, ∀ m : ℕ, m₀ ≤ m →
    claimedBound c m <
      (complexity ℚ ((∑ i : Fin m, ∑ j : Fin m, X (i, j) : MvPolynomial (Fin m × Fin m) ℚ) ^ m) :
        ℝ) := by
  rintro ⟨c, hc, m₀, h⟩
  obtain ⟨k, hmk, hle⟩ := Anchors.exists_dense_size_le c hc m₀
  obtain ⟨P, hP⟩ := computes_of_circuit (Anchors.dense_power_computes ℚ k)
  have h1 := Nat.sInf_le (s := {ℓ : ℕ | ∃ P : SLP (Fin (2 ^ k) × Fin (2 ^ k)) ℚ ℓ,
    ((∑ i : Fin (2 ^ k), ∑ j : Fin (2 ^ k), X (i, j) :
      MvPolynomial (Fin (2 ^ k) × Fin (2 ^ k)) ℚ) ^ (2 ^ k)) ∈ P.computed}) ⟨P, hP⟩
  have h3 : (complexity ℚ ((∑ i : Fin (2 ^ k), ∑ j : Fin (2 ^ k), X (i, j) :
      MvPolynomial (Fin (2 ^ k) × Fin (2 ^ k)) ℚ) ^ (2 ^ k)) : ℝ) ≤
        ((2 * (2 ^ k) ^ 2 - 1 + k : ℕ) : ℝ) := by exact_mod_cast h1
  exact lt_irrefl (claimedBound c (2 ^ k)) (lt_of_lt_of_le (h (2 ^ k) hmk) (h3.trans hle))

end CertMachine.AnchorsBlindA

#print axioms CertMachine.AnchorsBlindA.A1_A
#print axioms CertMachine.AnchorsBlindA.A1_A_min
#print axioms CertMachine.AnchorsBlindA.complexity_gt_iff
#print axioms CertMachine.AnchorsBlindA.A2_A
#print axioms CertMachine.AnchorsBlindA.A3_A
#print axioms CertMachine.AnchorsBlindA.A3_A_complexity
#print axioms CertMachine.AnchorsBlindA.A4_A
#print axioms CertMachine.AnchorsBlindA.A4_A_complexity
#print axioms CertMachine.AnchorsBlindA.A5_A
#print axioms CertMachine.AnchorsBlindA.A6_A
#print axioms CertMachine.AnchorsBlindA.R1_A
