import Solution
import CertMachine.BlindA

/-!
# Bridge A: the five propositions of BlindA from the release's Solution theorems

Cert-machine VP ≠ VNP lane, row F2, author A, 2026-11-24. Proved in the release's environment (Lean v4.33.1,
Mathlib 0df444a3, the release built). Nothing of the release is edited; `CertMachine/BlindA.lean` is the sealed
blind statement unchanged (sha256 d8891151…, SEAL-1A).

* `mainTheorem` from `Solution.mainTheorem`, `mainTheoremApprox` from `Solution.mainTheoremApprox`,
  `permanentOverReal` from `mainTheorem` at `p = 0`, `K = ℝ` (and `permanentOverReal_of_release` from
  `Solution.permanent_over_real`), `separation` from `Solution.separation`, `separationClosure` from
  `Solution.separationClosure`.
* The size measures: a BlindA program of length `ℓ` gives a release circuit of `4ℓ + 2` gates (§2); a release
  circuit of `s` gates gives a BlindA program of length `s` (§3); every polynomial has one (§4), so BlindA's
  `sInf` is attained. The release's bound with constant `c` at size `4L + 2` gives BlindA's bound with `c / 2`
  at `L` for `m ≥ m₁(c)` (§7).
* Release lemmas used besides the five Solution theorems: `Nc.Computes.{mono, rename, join}`,
  `Nc.CSize.{var, const}`, `Nc.coeff_mul_eq_zero` (all on the release's `Nc.Computes`, which is
  `Statement.Computes` by definition).
-/

open MvPolynomial

namespace CertMachine.BridgeA

open BlindA

/-! ## 1. Straight-line programs: the recursion of `SLP.vals` -/

section SLPLemmas

variable {σ F R : Type} [CommRing F] [CommRing R] [Algebra F R] {ℓ : ℕ}

theorem vals_succ_eq (P : SLP σ F ℓ) (x : σ → R) :
    ∀ (r : ℕ) (h : r ≤ ℓ) (j : ℕ) (hj : j < r),
      SLP.vals P x r h ⟨j, hj⟩ = (P.instr ⟨j, by omega⟩).eval x (SLP.vals P x j (by omega)) := by
  intro r
  induction r with
  | zero => intro h j hj; exact absurd hj (Nat.not_lt_zero _)
  | succ r ih =>
    intro h j hj
    rw [SLP.vals]
    dsimp only
    by_cases hjr : j < r
    · rw [dif_pos hjr]
      exact ih _ j hjr
    · have hjr' : j = r := by omega
      subst hjr'
      rw [dif_neg hjr]

theorem vals_eq_result (P : SLP σ F ℓ) (x : σ → R) (j : ℕ) (h : j ≤ ℓ) (i : Fin j) :
    SLP.vals P x j h i = SLP.result P x ⟨i, by omega⟩ := by
  obtain ⟨i, hi⟩ := i
  rw [SLP.result, vals_succ_eq P x j h i hi, vals_succ_eq P x ℓ le_rfl i (by omega)]

theorem result_eq (P : SLP σ F ℓ) (x : σ → R) (r : ℕ) (hr : r < ℓ) :
    SLP.result P x ⟨r, hr⟩ =
      (P.instr ⟨r, hr⟩).eval x (fun i : Fin r => SLP.result P x ⟨i, by omega⟩) := by
  rw [SLP.result, vals_succ_eq P x ℓ le_rfl r hr]
  congr 1
  funext i
  exact vals_eq_result P x r _ i

end SLPLemmas

/-! ## 2. Forward: a program of length `ℓ` gives a release circuit with `4ℓ + 2` gates

Gate 0 is the constant `0`, gate 1 the constant `−1`. Instruction `r` occupies the gates `2 + 4r + q`, `q < 4`:
its left operand (`q = 0`), its right operand (`q = 1`), the product `(−1)·right` when the instruction is a
subtraction and the constant `0` otherwise (`q = 2`), its result (`q = 3`). A variable or constant operand is a
variable or constant gate; an operand that is the result of instruction `j < r` is the sum of gate `2 + 4j + 3`
and gate 0. Subtraction is not a gate of the release: `a − b = a + (−1)·b`. -/

section Forward

variable {σ F : Type} [CommRing F] {ℓ : ℕ}

/-- The results of `P` on the variables, indexed by `ℕ` (zero past the end). -/
noncomputable def res (P : SLP σ F ℓ) (i : ℕ) : MvPolynomial σ F :=
  if h : i < ℓ then SLP.result (R := MvPolynomial σ F) P (fun v => X v) ⟨i, h⟩ else 0

/-- The value of an operand of instruction number `r`. -/
noncomputable def opVal (P : SLP σ F ℓ) {r : ℕ} (a : Operand σ F r) : MvPolynomial σ F :=
  a.eval (fun v => X v) (fun i : Fin r => res P i)

theorem res_eq (P : SLP σ F ℓ) (r : ℕ) (hr : r < ℓ) :
    res P r = (P.instr ⟨r, hr⟩).op.apply (opVal P (P.instr ⟨r, hr⟩).left)
      (opVal P (P.instr ⟨r, hr⟩).right) := by
  rw [res, dif_pos hr, result_eq P _ r hr]
  have hu : (fun i : Fin r => SLP.result (R := MvPolynomial σ F) P (fun v => X v) ⟨i, by omega⟩) =
      (fun i : Fin r => res P i) := by
    funext i
    rw [res, dif_pos (by omega)]
  rw [hu]
  rfl

/-- The auxiliary gate of an instruction: `(−1)·b` for a subtraction, the constant `0` otherwise. -/
noncomputable def auxVal : Op → MvPolynomial σ F → MvPolynomial σ F
  | Op.sub, b => C (-1) * b
  | Op.add, _ => C 0
  | Op.mul, _ => C 0

/-- The four gates of instruction `r`. -/
noncomputable def blk (P : SLP σ F ℓ) (r : Fin ℓ) : ℕ → MvPolynomial σ F
  | 0 => opVal P (P.instr r).left
  | 1 => opVal P (P.instr r).right
  | 2 => auxVal (P.instr r).op (opVal P (P.instr r).right)
  | _ => res P r

/-- The release circuit of `P`. -/
noncomputable def fwdList (P : SLP σ F ℓ) (k : ℕ) : MvPolynomial σ F :=
  if k = 0 then C 0 else if k = 1 then C (-1) else
    if h : (k - 2) / 4 < ℓ then blk P ⟨(k - 2) / 4, h⟩ ((k - 2) % 4) else C 0

theorem fwdList_zero (P : SLP σ F ℓ) : fwdList P 0 = C 0 := by
  rw [fwdList, if_pos rfl]

theorem fwdList_one (P : SLP σ F ℓ) : fwdList P 1 = C (-1) := by
  rw [fwdList, if_neg (by omega), if_pos rfl]

theorem fwdList_blk (P : SLP σ F ℓ) (r : ℕ) (hr : r < ℓ) (q : ℕ) (hq : q < 4) :
    fwdList P (2 + 4 * r + q) = blk P ⟨r, hr⟩ q := by
  rw [fwdList, if_neg (by omega), if_neg (by omega), dif_pos (by omega)]
  congr 1
  · exact Fin.ext (by simp only; omega)
  · omega

theorem step_operand (P : SLP σ F ℓ) (r : ℕ) (hr : r < ℓ) (a : Operand σ F r) (k : ℕ)
    (hk : 2 + 4 * r ≤ k) (hl : fwdList P k = opVal P a) : Nc.IsStep (fwdList P) k := by
  unfold Nc.IsStep
  rw [hl]
  cases a with
  | var v => exact Or.inl ⟨v, rfl⟩
  | const c => exact Or.inr (Or.inl ⟨c, by simp [opVal, Operand.eval, MvPolynomial.algebraMap_eq]⟩)
  | prev j =>
    have hj : (j : ℕ) < ℓ := by omega
    refine Or.inr (Or.inr (Or.inl ⟨2 + 4 * j + 3, by omega, 0, by omega, ?_⟩))
    rw [fwdList_blk P j hj 3 (by norm_num), fwdList_zero]
    simp [opVal, Operand.eval, blk]

theorem fwdList_steps (P : SLP σ F ℓ) : ∀ k < 4 * ℓ + 2, Nc.IsStep (fwdList P) k := by
  intro k hk
  rcases (show k = 0 ∨ k = 1 ∨ 2 ≤ k by omega) with rfl | rfl | h2
  · exact Or.inr (Or.inl ⟨0, fwdList_zero P⟩)
  · exact Or.inr (Or.inl ⟨-1, fwdList_one P⟩)
  obtain ⟨r, q, hq, hr, rfl⟩ : ∃ r q, q < 4 ∧ r < ℓ ∧ k = 2 + 4 * r + q :=
    ⟨(k - 2) / 4, (k - 2) % 4, by omega, by omega, by omega⟩
  have e0 : fwdList P (2 + 4 * r + 0) = opVal P (P.instr ⟨r, hr⟩).left :=
    fwdList_blk P r hr 0 (by norm_num)
  have e1 : fwdList P (2 + 4 * r + 1) = opVal P (P.instr ⟨r, hr⟩).right :=
    fwdList_blk P r hr 1 (by norm_num)
  have e2 : fwdList P (2 + 4 * r + 2) =
      auxVal (P.instr ⟨r, hr⟩).op (opVal P (P.instr ⟨r, hr⟩).right) :=
    fwdList_blk P r hr 2 (by norm_num)
  have e3 : fwdList P (2 + 4 * r + 3) = (P.instr ⟨r, hr⟩).op.apply
      (opVal P (P.instr ⟨r, hr⟩).left) (opVal P (P.instr ⟨r, hr⟩).right) := by
    rw [fwdList_blk P r hr 3 (by norm_num)]
    exact res_eq P r hr
  rcases (show q = 0 ∨ q = 1 ∨ q = 2 ∨ q = 3 by omega) with rfl | rfl | rfl | rfl
  · exact step_operand P r hr _ _ (by omega) e0
  · exact step_operand P r hr _ _ (by omega) e1
  · unfold Nc.IsStep
    rw [e2]
    cases (P.instr ⟨r, hr⟩).op with
    | add => exact Or.inr (Or.inl ⟨0, rfl⟩)
    | mul => exact Or.inr (Or.inl ⟨0, rfl⟩)
    | sub =>
      exact Or.inr (Or.inr (Or.inr ⟨1, by omega, 2 + 4 * r + 1, by omega, by
        rw [fwdList_one, e1]; rfl⟩))
  · unfold Nc.IsStep
    rw [e3]
    rcases hop : (P.instr ⟨r, hr⟩).op with _ | _ | _
    · exact Or.inr (Or.inr (Or.inl ⟨2 + 4 * r + 0, by omega, 2 + 4 * r + 1, by omega, by
        rw [e0, e1]; rfl⟩))
    · refine Or.inr (Or.inr (Or.inl ⟨2 + 4 * r + 0, by omega, 2 + 4 * r + 2, by omega, ?_⟩))
      rw [e0, e2, hop]
      simp [Op.apply, auxVal, sub_eq_add_neg]
    · exact Or.inr (Or.inr (Or.inr ⟨2 + 4 * r + 0, by omega, 2 + 4 * r + 1, by omega, by
        rw [e0, e1]; rfl⟩))

/-- **Forward conversion.** A program of length `ℓ` computing `f` gives a release circuit for `f` with
`4ℓ + 2` gates. -/
theorem fwd_computes (P : SLP σ F ℓ) {f : MvPolynomial σ F} (hf : f ∈ P.computed) :
    Statement.Computes f (4 * ℓ + 2) := by
  rcases hf with (⟨v, rfl⟩ | ⟨c, rfl⟩) | ⟨r, rfl⟩
  · exact (Nc.CSize.var v).1.mono (by omega)
  · exact (Nc.CSize.const c).1.mono (by omega)
  · refine ⟨fwdList P, fwdList_steps P, 2 + 4 * r + 3, by omega, ?_⟩
    rw [fwdList_blk P r r.2 3 (by norm_num)]
    show res P r = _
    rw [res, dif_pos r.2]

end Forward

/-! ## 3. Reverse: a release circuit with `s` gates gives a program of length `s` -/

section Reverse

variable {σ F : Type} [CommRing F]

theorem exists_instr (l : ℕ → MvPolynomial σ F) (r : ℕ) (h : Nc.IsStep l r) :
    ∃ I : Instr σ F r, ∀ u : Fin r → MvPolynomial σ F, (∀ i : Fin r, u i = l i) →
      I.eval (fun v => X v) u = l r := by
  rcases h with ⟨v, hv⟩ | ⟨a, ha⟩ | ⟨i, hi, j, hj, hij⟩ | ⟨i, hi, j, hj, hij⟩
  · exact ⟨⟨Op.add, Operand.var v, Operand.const 0⟩, fun u _ => by
      simp [Instr.eval, Operand.eval, Op.apply, hv]⟩
  · exact ⟨⟨Op.add, Operand.const a, Operand.const 0⟩, fun u _ => by
      simp [Instr.eval, Operand.eval, Op.apply, ha, MvPolynomial.algebraMap_eq]⟩
  · exact ⟨⟨Op.add, Operand.prev ⟨i, hi⟩, Operand.prev ⟨j, hj⟩⟩, fun u hu => by
      simp [Instr.eval, Operand.eval, Op.apply, hu, hij]⟩
  · exact ⟨⟨Op.mul, Operand.prev ⟨i, hi⟩, Operand.prev ⟨j, hj⟩⟩, fun u hu => by
      simp [Instr.eval, Operand.eval, Op.apply, hu, hij]⟩

/-- **Reverse conversion.** A release circuit for `f` with `s` gates gives a program of length `s`
computing `f`: each gate becomes one instruction (a variable or constant gate `g` becomes `g + 0`). -/
theorem rev_computes {f : MvPolynomial σ F} {s : ℕ} (h : Statement.Computes f s) :
    ∃ P : SLP σ F s, f ∈ P.computed := by
  obtain ⟨l, hl, k, hk, rfl⟩ := h
  have hI : ∀ r : Fin s, ∃ I : Instr σ F r, ∀ u : Fin r → MvPolynomial σ F,
      (∀ i : Fin r, u i = l i) → I.eval (fun v => X v) u = l r :=
    fun r => exists_instr l r (hl r r.2)
  choose I hI using hI
  let P : SLP σ F s := ⟨I⟩
  have key : ∀ r (hr : r < s), SLP.result (R := MvPolynomial σ F) P (fun v => X v) ⟨r, hr⟩ = l r := by
    intro r
    induction r using Nat.strong_induction_on with
    | _ r ih =>
      intro hr
      rw [result_eq P _ r hr]
      exact hI ⟨r, hr⟩ _ (fun i => ih i i.2 _)
  exact ⟨P, Or.inr ⟨⟨k, hk⟩, key k hk⟩⟩

end Reverse

/-! ## 4. Every polynomial has a circuit, so the minima exist -/

section Exist

theorem exists_computes {R : Type} [CommSemiring R] {V : Type} (f : MvPolynomial V R) :
    ∃ s, Statement.Computes f s := by
  refine MvPolynomial.induction_on (motive := fun f => ∃ s, Statement.Computes f s) f ?_ ?_ ?_
  · intro a
    exact ⟨1, (Nc.CSize.const a).1⟩
  · rintro p q ⟨s, hs⟩ ⟨t, ht⟩
    exact ⟨s + t + 1, Nc.Computes.join hs ht (Or.inl rfl)⟩
  · rintro p v ⟨s, hs⟩
    exact ⟨s + 1 + 1, Nc.Computes.join hs (Nc.CSize.var v).1 (Or.inr rfl)⟩

variable {σ : Type}

theorem slp_exists {F : Type} [CommRing F] (f : MvPolynomial σ F) :
    ∃ ℓ, ∃ P : SLP σ F ℓ, f ∈ P.computed :=
  let ⟨s, hs⟩ := exists_computes f
  ⟨s, rev_computes hs⟩

theorem complexity_spec (K : Type) [Field K] (f : MvPolynomial σ K) :
    ∃ P : SLP σ K (complexity K f), f ∈ P.computed :=
  Nat.sInf_mem (slp_exists f)

theorem approx_self (K : Type) [Field K] (f : MvPolynomial σ K) :
    Approximates K (MvPolynomial.map (algebraMap K (LaurentSeries K)) f) f :=
  ⟨0, by simp⟩

theorem approxComplexity_spec (K : Type) [Field K] (f : MvPolynomial σ K) :
    ∃ P : SLP σ (LaurentSeries K) (approxComplexity K f), ∃ G ∈ P.computed, Approximates K G f := by
  refine Nat.sInf_mem (s := {ℓ : ℕ | ∃ P : SLP σ (LaurentSeries K) ℓ, ∃ G ∈ P.computed,
    Approximates K G f}) ?_
  obtain ⟨ℓ, P, hP⟩ := slp_exists (MvPolynomial.map (algebraMap K (LaurentSeries K)) f)
  exact ⟨ℓ, P, _, hP, approx_self K f⟩

end Exist

/-! ## 5. Approximation: BlindA's `G = f + ε·g` gives the release's coefficient condition -/

section Approx

variable {σ : Type}

theorem approx_coeff {K : Type} [Field K] {G : MvPolynomial σ (LaurentSeries K)} {f : MvPolynomial σ K}
    (h : Approximates K G f) :
    ∀ (d : σ →₀ ℕ) (i : ℤ), i ≤ 0 → (coeff d G).coeff i = if i = 0 then coeff d f else 0 := by
  obtain ⟨g, rfl⟩ := h
  intro d i hi
  have h2 : (eps K * HahnSeries.ofPowerSeries ℤ K (coeff d g)).coeff i = 0 := by
    refine Nc.coeff_mul_eq_zero (m := 1) (n := 0) ?_ ?_ (by omega)
    · intro j hj
      simp only [eps, HahnSeries.coeff_single]
      rw [if_neg (by omega)]
    · intro j hj
      rw [PowerSeries.coeff_coe, if_pos hj]
  rw [coeff_add, coeff_map, coeff_C_mul, coeff_map, HahnSeries.coeff_add, h2, add_zero]
  -- the instance `Algebra K K((ε))` found here is the composite `K → K[[ε]] → K((ε))`
  have hA : (algebraMap K (LaurentSeries K)) (coeff d f) =
      HahnSeries.ofPowerSeries ℤ K (PowerSeries.C (coeff d f)) := rfl
  rw [hA, PowerSeries.coeff_coe]
  rcases lt_or_eq_of_le hi with h | h
  · rw [if_pos h, if_neg (by omega)]
  · subst h
    simp

theorem approx_rename {K : Type} [Field K] {τ : Type} (e : σ ≃ τ) {G : MvPolynomial τ (LaurentSeries K)}
    {f : MvPolynomial σ K} (h : Approximates K G (rename e f)) :
    Approximates K (rename e.symm G) f := by
  obtain ⟨g, rfl⟩ := h
  refine ⟨rename e.symm g, ?_⟩
  rw [map_add, map_mul, rename_C, map_rename, rename_rename]
  simp only [Equiv.symm_comp_self, rename_id, AlgHom.id_apply]
  rw [map_rename]

/-- A program over `K((ε))` of length `ℓ` approximating `f` gives the release's `Approximates f (4ℓ + 2)`. -/
theorem fwd_approximates {K : Type} [Field K] {ℓ : ℕ} (P : SLP σ (LaurentSeries K) ℓ)
    {G : MvPolynomial σ (LaurentSeries K)} (hG : G ∈ P.computed) {f : MvPolynomial σ K}
    (h : Approximates K G f) : Statement.Approximates f (4 * ℓ + 2) :=
  ⟨G, fwd_computes P hG, approx_coeff h⟩

end Approx

/-! ## 6. The permanent and the Hamiltonian cycle polynomial are the release's -/

section Polys

theorem perm_eq (K : Type) [CommRing K] (m : ℕ) : BlindA.perm K m = Statement.perm K m := by
  unfold BlindA.perm Statement.perm
  rw [← Equiv.sum_comp (Equiv.inv (Equiv.Perm (Fin m)))]
  refine Finset.sum_congr rfl fun π _ => ?_
  rw [← Equiv.prod_comp π]
  simp

theorem isFullCycle_iff {m : ℕ} (π : Equiv.Perm (Fin m)) : IsFullCycle π ↔ π.IsCycleOn Set.univ := by
  constructor
  · intro h
    exact ⟨Set.bijOn_univ.2 π.bijective, fun x _ y _ => h x y⟩
  · intro h x y
    exact h.2 (Set.mem_univ x) (Set.mem_univ y)

theorem hc_eq (K : Type) [CommRing K] (m : ℕ) : BlindA.hc K m = Statement.hc K m := by
  unfold BlindA.hc Statement.hc
  congr 1
  ext π
  simp only [Finset.mem_filter, Finset.mem_univ, true_and]
  exact isFullCycle_iff π

end Polys

/-! ## 7. The constant absorbs a linear change of size -/

section Real

theorem claimedBound_sq (c : ℝ) (m : ℕ) : claimedBound c m = claimedBound (c / 2) m ^ 2 := by
  unfold claimedBound
  rw [← Real.rpow_natCast, ← Real.rpow_mul (Nat.cast_nonneg m)]
  congr 1
  push_cast
  ring

theorem claimedBound_ge (c : ℝ) (hc : 0 < c) : ∃ m₁ : ℕ, ∀ m ≥ m₁, (5 : ℝ) ≤ claimedBound (c / 2) m := by
  refine ⟨max 2 ⌈(5 : ℝ) ^ (2 / c)⌉₊, fun m hm => ?_⟩
  have hm2 : (2 : ℝ) ≤ m := by exact_mod_cast le_of_max_le_left hm
  have hm5 : (5 : ℝ) ^ (2 / c) ≤ m := (Nat.le_ceil _).trans (by exact_mod_cast le_of_max_le_right hm)
  have hlog : 1 ≤ Real.logb 2 m := by
    rw [Real.le_logb_iff_rpow_le (by norm_num) (by linarith)]
    simpa using hm2
  have ht : 1 ≤ Real.logb 2 m ^ ((1 : ℝ) / 3) := Real.one_le_rpow hlog (by norm_num)
  unfold claimedBound
  calc (5 : ℝ) = ((5 : ℝ) ^ (2 / c)) ^ (c / 2) := by
        rw [← Real.rpow_mul (by norm_num)]
        field_simp
        simp
    _ ≤ (m : ℝ) ^ (c / 2) := Real.rpow_le_rpow (by positivity) hm5 (by positivity)
    _ ≤ (m : ℝ) ^ (c / 2 * Real.logb 2 m ^ ((1 : ℝ) / 3)) :=
        Real.rpow_le_rpow_of_exponent_le (by linarith) (by nlinarith)

/-- **The real-analysis lemma.** If every circuit bound with constant `c` holds at size `4L + 2`, the bound with
constant `c / 2` holds at `L`, for every `m ≥ m₁(c)`. -/
theorem bound_halve (c : ℝ) (hc : 0 < c) :
    ∃ m₁ : ℕ, ∀ m ≥ m₁, ∀ L : ℕ, Statement.Beyond c m (4 * L + 2) → claimedBound (c / 2) m < L := by
  obtain ⟨m₁, hm₁⟩ := claimedBound_ge c hc
  refine ⟨m₁, fun m hm L hB => ?_⟩
  have h5 := hm₁ m hm
  have hB' : claimedBound c m < (4 * L + 2 : ℕ) := hB
  rw [claimedBound_sq] at hB'
  push_cast at hB'
  by_contra hcon
  have hcon' : (L : ℝ) ≤ claimedBound (c / 2) m := not_lt.1 hcon
  nlinarith

end Real

/-! ## 8. The main theorems -/

theorem computes_of_eq {σ R : Type} [CommSemiring R] {f g : MvPolynomial σ R} (h : f = g) {s : ℕ}
    (hf : Statement.Computes f s) : Statement.Computes g s := h ▸ hf

theorem approximates_of_eq {σ K : Type} [Field K] {f g : MvPolynomial σ K} (h : f = g) {s : ℕ}
    (hf : Statement.Approximates f s) : Statement.Approximates g s := h ▸ hf

/-- **Claim 1** of BlindA, from `Solution.mainTheorem` (constant `c / 2` for the release's `c`). -/
theorem mainTheorem : BlindA.MainTheorem := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheorem.{0}
  obtain ⟨m₁, hm₁⟩ := bound_halve c hc
  refine ⟨c / 2, by positivity, fun p _ => ?_⟩
  obtain ⟨m₀, hm₀⟩ := h p
  refine ⟨max m₀ m₁, fun K _ _ m hm => ⟨?_, fun hp2 => ?_⟩⟩
  · obtain ⟨P, hP⟩ := complexity_spec K (BlindA.hc K m)
    have hC := computes_of_eq (hc_eq K m) (fwd_computes P hP)
    exact hm₁ m (le_of_max_le_right hm) _ ((hm₀ K m (le_of_max_le_left hm) _).1 hC)
  · obtain ⟨P, hP⟩ := complexity_spec K (BlindA.perm K m)
    have hC := computes_of_eq (perm_eq K m) (fwd_computes P hP)
    exact hm₁ m (le_of_max_le_right hm) _ ((hm₀ K m (le_of_max_le_left hm) _).2 hp2 hC)

/-- **Claim 3** of BlindA, from `Solution.mainTheoremApprox` (constant `c / 2`). -/
theorem mainTheoremApprox : BlindA.MainTheoremApprox := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheoremApprox.{0}
  obtain ⟨m₁, hm₁⟩ := bound_halve c hc
  refine ⟨c / 2, by positivity, fun p _ => ?_⟩
  obtain ⟨m₀, hm₀⟩ := h p
  refine ⟨max m₀ m₁, fun K _ _ m hm => ⟨?_, fun hp2 => ?_⟩⟩
  · obtain ⟨P, G, hG, hA⟩ := approxComplexity_spec K (BlindA.hc K m)
    have hC := approximates_of_eq (hc_eq K m) (fwd_approximates P hG hA)
    exact hm₁ m (le_of_max_le_right hm) _ ((hm₀ K m (le_of_max_le_left hm) _).1 hC)
  · obtain ⟨P, G, hG, hA⟩ := approxComplexity_spec K (BlindA.perm K m)
    have hC := approximates_of_eq (perm_eq K m) (fwd_approximates P hG hA)
    exact hm₁ m (le_of_max_le_right hm) _ ((hm₀ K m (le_of_max_le_left hm) _).2 hp2 hC)

/-- **Claim 5** of BlindA, from `mainTheorem` above at `p = 0`, `K = ℝ` (so from `Solution.mainTheorem`). -/
theorem permanentOverReal : BlindA.PermanentOverReal := by
  obtain ⟨c, hc, h⟩ := mainTheorem
  obtain ⟨m₀, hm₀⟩ := h 0 (Or.inl rfl)
  exact ⟨c, hc, m₀, fun m hm => (hm₀ ℝ m hm).2 (by norm_num)⟩

/-- Claim 5 a second way, from the release's own special case `Solution.permanent_over_real` (Paper.thm_main)
instead of the main theorem. Not one of the five; it shows the bridge does not depend on which route is used. -/
theorem permanentOverReal_of_release : BlindA.PermanentOverReal := by
  obtain ⟨c, hc, m₀, h⟩ := Solution.permanent_over_real
  obtain ⟨m₁, hm₁⟩ := bound_halve c hc
  refine ⟨c / 2, by positivity, max m₀ m₁, fun m hm => ?_⟩
  obtain ⟨P, hP⟩ := complexity_spec ℝ (BlindA.perm ℝ m)
  exact hm₁ m (le_of_max_le_right hm) _
    (h m (le_of_max_le_left hm) _ (computes_of_eq (perm_eq ℝ m) (fwd_computes P hP)))

/-! ## 9. Polynomial bounds -/

section PBound

theorem pb_of_le {t : ℕ → ℕ} (a : ℕ) (h : ∀ n, t n ≤ n ^ a + a) : PBounded t :=
  ⟨Polynomial.X ^ a + Polynomial.C a, fun n => by simpa using h n⟩

theorem pow_add_mono {a b : ℕ} (hab : a ≤ b) (n : ℕ) : n ^ a + a ≤ n ^ b + b := by
  rcases Nat.eq_zero_or_pos n with rfl | hn
  · rcases Nat.eq_zero_or_pos a with rfl | ha
    · rcases Nat.eq_zero_or_pos b with rfl | hb
      · simp
      · rw [Nat.zero_pow hb]
        simp
        omega
    · rw [Nat.zero_pow ha, Nat.zero_pow (by omega)]
      omega
  · have := Nat.pow_le_pow_right hn hab
    omega

theorem exists_pow_bound (q : Polynomial ℕ) : ∃ a, ∀ n, q.eval n ≤ n ^ a + a := by
  have hS : q.eval 1 = ∑ i ∈ Finset.range (q.natDegree + 1), q.coeff i := by
    rw [Polynomial.eval_eq_sum_range]
    simp
  have h1 : ∀ n, 1 ≤ n → q.eval n ≤ q.eval 1 * n ^ q.natDegree := by
    intro n hn
    rw [Polynomial.eval_eq_sum_range, hS, Finset.sum_mul]
    refine Finset.sum_le_sum fun i hi => ?_
    exact Nat.mul_le_mul_left _ (Nat.pow_le_pow_right hn (by simp at hi; omega))
  have h0 : q.eval 0 ≤ q.eval 1 := by
    rw [Polynomial.eval_eq_sum_range, hS]
    refine Finset.sum_le_sum fun i _ => ?_
    rcases Nat.eq_zero_or_pos i with rfl | hi
    · simp
    · simp [Nat.zero_pow hi]
  refine ⟨q.natDegree + q.eval 1 + 1, fun n => ?_⟩
  rcases Nat.lt_or_ge n 2 with hn | hn
  · interval_cases n
    · omega
    · simp only [one_pow]
      omega
  · calc q.eval n ≤ q.eval 1 * n ^ q.natDegree := h1 n (by omega)
      _ ≤ n ^ q.eval 1 * n ^ q.natDegree := Nat.mul_le_mul_right _ (Nat.lt_pow_self (by omega)).le
      _ = n ^ (q.eval 1 + q.natDegree) := (pow_add _ _ _).symm
      _ ≤ n ^ (q.natDegree + q.eval 1 + 1) := Nat.pow_le_pow_right (by omega) (by omega)
      _ ≤ _ := Nat.le_add_right _ _

theorem exists_common_bound {t₁ t₂ t₃ : ℕ → ℕ} (h₁ : PBounded t₁) (h₂ : PBounded t₂) (h₃ : PBounded t₃) :
    ∃ a, ∀ n, t₁ n ≤ n ^ a + a ∧ t₂ n ≤ n ^ a + a ∧ 4 * t₃ n + 2 ≤ n ^ a + a := by
  obtain ⟨q₁, hq₁⟩ := h₁
  obtain ⟨q₂, hq₂⟩ := h₂
  obtain ⟨q₃, hq₃⟩ := h₃
  obtain ⟨a₁, ha₁⟩ := exists_pow_bound q₁
  obtain ⟨a₂, ha₂⟩ := exists_pow_bound q₂
  obtain ⟨a₃, ha₃⟩ := exists_pow_bound (Polynomial.C 4 * q₃ + Polynomial.C 2)
  refine ⟨max a₁ (max a₂ a₃), fun n => ⟨?_, ?_, ?_⟩⟩
  · exact (hq₁ n).trans ((ha₁ n).trans (pow_add_mono (by omega) n))
  · exact (hq₂ n).trans ((ha₂ n).trans (pow_add_mono (by omega) n))
  · have h := ha₃ n
    simp only [Polynomial.eval_add, Polynomial.eval_mul, Polynomial.eval_C] at h
    have := hq₃ n
    exact le_trans (by omega) (h.trans (pow_add_mono (by omega) n))

theorem totalDegree_aeval_le {R : Type} [CommSemiring R] {σ τ : Type} (h : σ → MvPolynomial τ R)
    (hh : ∀ i, (h i).totalDegree ≤ 1) (p : MvPolynomial σ R) :
    (aeval h p).totalDegree ≤ p.totalDegree := by
  rw [aeval_eq_eval₂Hom, coe_eval₂Hom, eval₂_eq]
  refine (totalDegree_finsetSum _ _).trans (Finset.sup_le fun d hd => ?_)
  refine (totalDegree_mul _ _).trans ?_
  rw [algebraMap_eq, totalDegree_C, zero_add]
  refine (totalDegree_finsetProd _ _).trans (le_trans ?_ (le_totalDegree hd))
  rw [Finsupp.sum]
  refine Finset.sum_le_sum fun i _ => ?_
  refine (totalDegree_pow _ _).trans ?_
  have := hh i
  nlinarith

end PBound

/-! ## 10. The classes: BlindA's families and the release's -/

section Classes

variable {K : Type} [Field K]

/-- A release family as a BlindA family: the variables of the `n`-th polynomial numbered by
`Fintype.equivFin`. -/
noncomputable def toA (f : Statement.Family K) : BlindA.Family K :=
  ⟨fun n => Fintype.card (f.vars n), fun n => rename (Fintype.equivFin (f.vars n)) (f.poly n)⟩

theorem toA_poly (f : Statement.Family K) (n : ℕ) :
    f.poly n = rename (Fintype.equivFin (f.vars n)).symm ((toA f).poly n) := by
  simp [toA, rename_rename]

theorem vpA_of_bound {f : BlindA.Family K} (a : ℕ)
    (h : ∀ n, f.nvars n ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a ∧
      Statement.Computes (f.poly n) (n ^ a + a)) : f ∈ BlindA.VP K := by
  refine ⟨⟨pb_of_le a fun n => (h n).1, pb_of_le a fun n => (h n).2.1⟩, pb_of_le a fun n => ?_⟩
  obtain ⟨P, hP⟩ := rev_computes (h n).2.2
  exact Nat.sInf_le ⟨P, hP⟩

theorem bound_of_vpA {f : BlindA.Family K} (hf : f ∈ BlindA.VP K) :
    ∃ a, ∀ n, f.nvars n ≤ n ^ a + a ∧ (f.poly n).totalDegree ≤ n ^ a + a ∧
      Statement.Computes (f.poly n) (n ^ a + a) := by
  obtain ⟨⟨h₁, h₂⟩, h₃⟩ := hf
  obtain ⟨a, ha⟩ := exists_common_bound h₁ h₂ h₃
  refine ⟨a, fun n => ⟨(ha n).1, (ha n).2.1, ?_⟩⟩
  obtain ⟨P, hP⟩ := complexity_spec K (f.poly n)
  exact Nc.Computes.mono (fwd_computes P hP) (ha n).2.2

/-- BlindA's VP is contained in BlindA's VNP (`w = 0`). -/
theorem vp_sub_vnp (f : BlindA.Family K) (hf : f ∈ BlindA.VP K) : f ∈ BlindA.VNP K := by
  refine ⟨hf.1, fun _ => 0, fun n => f.poly n, hf, fun n => ?_⟩
  show f.poly n = ∑ e : Fin 0 → Bool, MvPolynomial.aeval (R := K)
    (Fin.append (fun i : Fin (f.nvars n) => (X i : MvPolynomial (Fin (f.nvars n)) K))
      (fun j : Fin 0 => if e j = true then (1 : MvPolynomial (Fin (f.nvars n)) K) else 0)) (f.poly n)
  have hX : ∀ v : Fin 0 → MvPolynomial (Fin (f.nvars n)) K,
      Fin.append (fun i : Fin (f.nvars n) => (X i : MvPolynomial (Fin (f.nvars n)) K)) v = fun i => X i :=
    fun v => funext fun i => Fin.append_left _ v i
  simp only [hX, aeval_X_left_apply, Finset.sum_const, Finset.card_univ, Fintype.card_unique, one_smul]

/-- A release VNP family gives a BlindA VNP family. -/
theorem toA_vnp {f : Statement.Family K} (hf : f ∈ Statement.VNP K) : toA f ∈ BlindA.VNP K := by
  obtain ⟨r, g, ⟨a, ha⟩, hsum⟩ := hf
  let e : ∀ n, (f.vars n ⊕ Fin (r n)) ≃ Fin (Fintype.card (f.vars n) + r n) := fun n =>
    (Equiv.sumCongr (Fintype.equivFin _) (Equiv.refl _)).trans finSumFinEquiv
  have hcard : ∀ n, Fintype.card (f.vars n) + r n ≤ n ^ a + a := fun n => by
    have := (ha n).1
    simpa [Fintype.card_sum] using this
  have hdeg : ∀ n (b : Fin (r n) → Bool),
      (aeval (Sum.elim (fun x => (X x : MvPolynomial (f.vars n) K))
        fun i => if b i then (1 : MvPolynomial (f.vars n) K) else 0) (g n)).totalDegree ≤ n ^ a + a := by
    intro n b
    refine (totalDegree_aeval_le _ ?_ _).trans (ha n).2.1
    intro i
    cases i with
    | inl x =>
      simp only [Sum.elim_inl]
      exact (totalDegree_X x).le
    | inr i =>
      simp only [Sum.elim_inr]
      split_ifs <;> simp
  refine ⟨⟨pb_of_le a fun n => ?_, pb_of_le a fun n => ?_⟩, r, fun n => rename (e n) (g n),
    vpA_of_bound a fun n => ⟨hcard n, (totalDegree_rename_le _ _).trans (ha n).2.1,
      Nc.Computes.rename (e n) (ha n).2.2⟩, fun n => ?_⟩
  · show Fintype.card (f.vars n) ≤ _
    have := hcard n
    omega
  · show (rename _ (f.poly n)).totalDegree ≤ _
    refine (totalDegree_rename_le _ _).trans ?_
    rw [hsum n]
    exact (totalDegree_finsetSum _ _).trans (Finset.sup_le fun b _ => hdeg n b)
  · show rename (Fintype.equivFin (f.vars n)) (f.poly n) = booleanSum _ _ (rename (e n) (g n))
    rw [hsum n, map_sum]
    unfold booleanSum
    refine Finset.sum_congr rfl fun b _ => ?_
    rw [aeval_rename, ← AlgHom.comp_apply, comp_aeval]
    congr 1
    congr 1
    funext v
    cases v with
    | inl x => simp [e]
    | inr i =>
      simp only [Sum.elim_inr, Function.comp_apply, e, Equiv.trans_apply, Equiv.sumCongr_apply,
        Sum.map_inr, Equiv.refl_apply, finSumFinEquiv_apply_right, Fin.append_right]
      split_ifs <;> simp

/-- A release family whose BlindA form is in BlindA's VP is in the release's VP. -/
theorem toA_vp {f : Statement.Family K} (hf : toA f ∈ BlindA.VP K) : f ∈ Statement.VP K := by
  obtain ⟨a, ha⟩ := bound_of_vpA hf
  refine ⟨a, fun n => ⟨(ha n).1, ?_, ?_⟩⟩
  · rw [toA_poly f n]
    exact (totalDegree_rename_le _ _).trans (ha n).2.1
  · rw [toA_poly f n]
    exact Nc.Computes.rename _ (ha n).2.2

/-- A release family whose BlindA form is in BlindA's VP-bar is in the release's VP-bar. -/
theorem toA_vpbar {f : Statement.Family K} (hf : toA f ∈ BlindA.VPbar K) : f ∈ Statement.VPBar K := by
  obtain ⟨⟨h₁, h₂⟩, h₃⟩ := hf
  obtain ⟨a, ha⟩ := exists_common_bound h₁ h₂ h₃
  refine ⟨a, fun n => ⟨(ha n).1, ?_, ?_⟩⟩
  · rw [toA_poly f n]
    exact (totalDegree_rename_le _ _).trans (ha n).2.1
  · obtain ⟨P, G, hG, hA⟩ := approxComplexity_spec K ((toA f).poly n)
    refine ⟨rename (Fintype.equivFin (f.vars n)).symm G,
      Nc.Computes.mono (Nc.Computes.rename _ (fwd_computes P hG)) (ha n).2.2, ?_⟩
    exact approx_coeff (approx_rename (Fintype.equivFin (f.vars n)) hA)

end Classes

/-- **Claim 2** of BlindA, from `Solution.separation`. -/
theorem separation : BlindA.Separation := by
  intro K _
  refine ⟨fun f hf => vp_sub_vnp f hf, fun h => ?_⟩
  exact (Solution.separation.{0} K).2 fun f hf => toA_vp (h (toA_vnp hf))

/-- **Claim 4** of BlindA, from `Solution.separationClosure`. -/
theorem separationClosure : BlindA.SeparationClosure := by
  intro K _ h
  exact Solution.separationClosure.{0} K fun f hf => toA_vpbar (h (toA_vnp hf))

end CertMachine.BridgeA

