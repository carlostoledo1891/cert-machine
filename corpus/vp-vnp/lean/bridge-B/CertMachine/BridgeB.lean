import Solution
import CertMachine.BlindB

/-!
# Bridge: BlindB's five propositions from the release's Solution theorems

BlindB (writer B, sealed in SEAL-1B) states the claim with arithmetic circuits as DAGs, every vertex counted,
families indexed by an arity `ℕ → ℕ`, and polynomial bounds `t n ≤ a * (n + 1) ^ d`. The release
(`Statement.*`) uses gate lists `ℕ → MvPolynomial`, families indexed by finite types, and bounds `n ^ a + a`.
This file proves the conversions in both directions and assembles the five theorems from
`Solution.mainTheorem`, `Solution.mainTheoremApprox`, `Solution.separation`, `Solution.separationClosure`
and `Solution.permanent_over_real` (all at universe 0, the universe of BlindB's fields).
-/

namespace CertMachine.BridgeB

open MvPolynomial

noncomputable section

/-! ### Circuits: a BlindB circuit of size `s` gives a release gate list of length `s`, and back -/

/-- A BlindB circuit with `D.size` vertices computing `f` is a release gate list with `D.size` gates. -/
theorem computes_of_circuit {K V : Type} [Field K] {D : BlindB.Circuit K V} {f : MvPolynomial V K}
    (h : D.Computes f) : Statement.Computes f D.size := by
  obtain ⟨value, hv, hout⟩ := h
  refine ⟨fun k => if hk : k < D.size then value ⟨k, hk⟩ else 0, fun k hk => ?_,
    D.output.val, D.output.isLt, ?_⟩
  · simp only [dif_pos hk]
    have e := hv ⟨k, hk⟩
    rcases hg : D.gate ⟨k, hk⟩ with a | x | ⟨u, v⟩ | ⟨u, v⟩
    · rw [hg] at e
      exact Or.inr (Or.inl ⟨a, e⟩)
    · rw [hg] at e
      exact Or.inl ⟨x, e⟩
    · rw [hg] at e
      refine Or.inr (Or.inr (Or.inl ⟨u.val, u.isLt, v.val, v.isLt, ?_⟩))
      rw [dif_pos (lt_trans u.isLt hk), dif_pos (lt_trans v.isLt hk)]
      exact e
    · rw [hg] at e
      refine Or.inr (Or.inr (Or.inr ⟨u.val, u.isLt, v.val, v.isLt, ?_⟩))
      rw [dif_pos (lt_trans u.isLt hk), dif_pos (lt_trans v.isLt hk)]
      exact e
  · show (if hk : D.output.val < D.size then value ⟨D.output.val, hk⟩ else 0) = f
    rw [dif_pos D.output.isLt]
    exact hout

/-- A release gate list with `s` gates computing `f` is a BlindB circuit with exactly `s` vertices. -/
theorem circuit_of_computes {K V : Type} [Field K] {f : MvPolynomial V K} {s : ℕ}
    (h : Statement.Computes f s) : ∃ D : BlindB.Circuit K V, D.size = s ∧ D.Computes f := by
  classical
  obtain ⟨l, hl, k₀, hk₀, hf⟩ := h
  let g : (i : Fin s) → BlindB.Gate K V (Fin i.val) := fun i =>
    if h1 : ∃ v, l i = X v then .input h1.choose
    else if h2 : ∃ a, l i = C a then .scalar h2.choose
    else if h3 : ∃ j < i.val, ∃ k < i.val, l i = l j + l k then
      .add ⟨h3.choose, h3.choose_spec.1⟩ ⟨h3.choose_spec.2.choose, h3.choose_spec.2.choose_spec.1⟩
    else if h4 : ∃ j < i.val, ∃ k < i.val, l i = l j * l k then
      .mul ⟨h4.choose, h4.choose_spec.1⟩ ⟨h4.choose_spec.2.choose, h4.choose_spec.2.choose_spec.1⟩
    else .scalar 0
  refine ⟨⟨s, g, ⟨k₀, hk₀⟩⟩, rfl, fun i => l i.val, fun i => ?_, hf⟩
  show l i.val = (g i).eval _
  simp only [g]
  split_ifs with h1 h2 h3 h4
  · exact h1.choose_spec
  · exact h2.choose_spec
  · exact h3.choose_spec.2.choose_spec.2
  · exact h4.choose_spec.2.choose_spec.2
  · exfalso
    rcases hl i.val i.isLt with h | h | h | h
    · exact h1 h
    · exact h2 h
    · exact h3 h
    · exact h4 h

/-- More gates are allowed: pad with the constant `0`. -/
theorem computes_mono {R V : Type} [CommSemiring R] {f : MvPolynomial V R} {s t : ℕ}
    (h : Statement.Computes f s) (hst : s ≤ t) : Statement.Computes f t := by
  classical
  obtain ⟨l, hl, k, hk, hf⟩ := h
  refine ⟨fun i => if i < s then l i else C 0, fun i _ => ?_, k, lt_of_lt_of_le hk hst, ?_⟩
  · by_cases his : i < s
    · rcases hl i his with ⟨v, e⟩ | ⟨a, e⟩ | ⟨j, hj, j', hj', e⟩ | ⟨j, hj, j', hj', e⟩
      · exact Or.inl ⟨v, by simp only [if_pos his, e]⟩
      · exact Or.inr (Or.inl ⟨a, by simp only [if_pos his, e]⟩)
      · exact Or.inr (Or.inr (Or.inl ⟨j, hj, j', hj',
          by simp only [if_pos his, if_pos (hj.trans his), if_pos (hj'.trans his), e]⟩))
      · exact Or.inr (Or.inr (Or.inr ⟨j, hj, j', hj',
          by simp only [if_pos his, if_pos (hj.trans his), if_pos (hj'.trans his), e]⟩))
    · exact Or.inr (Or.inl ⟨0, by simp only [if_neg his]⟩)
  · simp only [if_pos hk, hf]

/-- Renaming the variables does not change the number of gates. -/
theorem computes_rename {R V W : Type} [CommSemiring R] (e : V → W) {f : MvPolynomial V R} {s : ℕ}
    (h : Statement.Computes f s) : Statement.Computes (rename e f) s := by
  obtain ⟨l, hl, k, hk, hf⟩ := h
  refine ⟨fun i => rename e (l i), fun i hi => ?_, k, hk, by simp only [hf]⟩
  rcases hl i hi with ⟨v, h⟩ | ⟨a, h⟩ | ⟨j, hj, j', hj', h⟩ | ⟨j, hj, j', hj', h⟩
  · exact Or.inl ⟨e v, by simp only [h, rename_X]⟩
  · exact Or.inr (Or.inl ⟨a, by simp only [h, rename_C]⟩)
  · exact Or.inr (Or.inr (Or.inl ⟨j, hj, j', hj', by simp only [h, map_add]⟩))
  · exact Or.inr (Or.inr (Or.inr ⟨j, hj, j', hj', by simp only [h, map_mul]⟩))

/-! ### Approximation -/

/-- BlindB's output condition (`f + ε g`, coefficients of `f` as constant series, `g` with power-series
coefficients, then embedded in the Laurent series) gives the release's coefficient condition. -/
theorem approximates_of_computes {K V : Type} [Field K] {f : MvPolynomial V K}
    {g : MvPolynomial V (PowerSeries K)} {s : ℕ}
    (h : Statement.Computes (MvPolynomial.map (HahnSeries.ofPowerSeries ℤ K)
      (MvPolynomial.map (PowerSeries.C : K →+* PowerSeries K) f +
        MvPolynomial.C (PowerSeries.X : PowerSeries K) * g)) s) :
    Statement.Approximates f s := by
  refine ⟨_, h, fun d i hi => ?_⟩
  rw [coeff_map, coeff_add, coeff_map, coeff_C_mul]
  rw [PowerSeries.coeff_coe (PowerSeries.C (coeff d f) + PowerSeries.X * coeff d g) i]
  rcases lt_or_eq_of_le hi with hlt | rfl
  · rw [if_pos hlt, if_neg hlt.ne]
  · simp

theorem approximates_mono {K V : Type} [Field K] {f : MvPolynomial V K} {s t : ℕ}
    (h : Statement.Approximates f s) (hst : s ≤ t) : Statement.Approximates f t := by
  obtain ⟨q, hq, hc⟩ := h
  exact ⟨q, computes_mono hq hst, hc⟩

/-- A BlindB approximating circuit with `D.size` vertices gives a release approximation with `D.size` gates. -/
theorem approximates_of_circuit {K V : Type} [Field K] {D : BlindB.Circuit (LaurentSeries K) V}
    {f : MvPolynomial V K} (h : D.Approximates f) : Statement.Approximates f D.size := by
  obtain ⟨g, hg⟩ := h
  exact approximates_of_computes (computes_of_circuit hg)

/-! ### The two matrix polynomials -/

/-- BlindB's permanent (`∏ i, X (i, σ i)`) equals the release's (`∏ i, X (σ i, i)`), at every `m`. -/
theorem PERM_eq (K : Type) [Field K] (m : ℕ) : BlindB.PERM K m = Statement.perm K m := by
  unfold BlindB.PERM Statement.perm BlindB.permMonomial
  refine Fintype.sum_equiv (Equiv.inv (Equiv.Perm (Fin m))) _ _ (fun σ => ?_)
  refine Fintype.prod_equiv σ _ _ (fun i => ?_)
  simp

/-- For `m ≥ 1`, "some index has every index in its orbit" is "one cycle through all points". -/
theorem isFullCycle_iff {m : ℕ} (hm : 1 ≤ m) (σ : Equiv.Perm (Fin m)) :
    BlindB.IsFullCycle σ ↔ σ.IsCycleOn Set.univ := by
  constructor
  · rintro ⟨i, hi⟩
    exact ⟨Set.bijOn_univ.2 σ.bijective, fun x _ y _ => (hi x).symm.trans (hi y)⟩
  · rintro ⟨_, h⟩
    exact ⟨⟨0, hm⟩, fun j => h (Set.mem_univ _) (Set.mem_univ _)⟩

/-- BlindB's Hamiltonian cycle polynomial equals the release's for `m ≥ 1`. (At `m = 0` they differ:
BlindB's `HC K 0 = 0`, the release's `hc K 0 = 1`.) -/
theorem HC_eq (K : Type) [Field K] {m : ℕ} (hm : 1 ≤ m) : BlindB.HC K m = Statement.hc K m := by
  classical
  unfold BlindB.HC Statement.hc BlindB.permMonomial
  rw [Finset.sum_filter]
  refine Finset.sum_congr rfl (fun σ _ => ?_)
  by_cases h : BlindB.IsFullCycle σ
  · rw [if_pos h, if_pos ((isFullCycle_iff hm σ).1 h)]
  · rw [if_neg h, if_neg (fun h' => h ((isFullCycle_iff hm σ).2 h'))]

/-! ### The three lower bounds -/

/-- BlindB's `MainTheorem`, from `Solution.mainTheorem` (same `c`; `m₀` raised to at least 1 so that
BlindB's `HC` and the release's `hc` agree). -/
theorem mainTheorem : BlindB.MainTheorem := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheorem.{0}
  refine ⟨c, hc, fun p _ => ?_⟩
  obtain ⟨m₀, hm₀⟩ := h p
  refine ⟨max m₀ 1, fun K _ _ m hm D hD => ?_⟩
  have h1 := hm₀ K m (le_of_max_le_left hm) D.size
  rcases hD with hD | ⟨hp2, hD⟩
  · have h2 := computes_of_circuit hD
    rw [HC_eq K (le_of_max_le_right hm)] at h2
    exact h1.1 h2
  · have h2 := computes_of_circuit hD
    rw [PERM_eq K m] at h2
    exact h1.2 hp2 h2

/-- BlindB's `MainTheoremApprox`, from `Solution.mainTheoremApprox`. -/
theorem mainTheoremApprox : BlindB.MainTheoremApprox := by
  obtain ⟨c, hc, h⟩ := Solution.mainTheoremApprox.{0}
  refine ⟨c, hc, fun p _ => ?_⟩
  obtain ⟨m₀, hm₀⟩ := h p
  refine ⟨max m₀ 1, fun K _ _ m hm D hD => ?_⟩
  have h1 := hm₀ K m (le_of_max_le_left hm) D.size
  rcases hD with hD | ⟨hp2, hD⟩
  · have h2 := approximates_of_circuit hD
    rw [HC_eq K (le_of_max_le_right hm)] at h2
    exact h1.1 h2
  · have h2 := approximates_of_circuit hD
    rw [PERM_eq K m] at h2
    exact h1.2 hp2 h2

/-- BlindB's `PermanentOverReal`, from `Solution.permanent_over_real`. -/
theorem permanentOverReal : BlindB.PermanentOverReal := by
  obtain ⟨c, hc, m₀, h⟩ := Solution.permanent_over_real
  refine ⟨c, hc, m₀, fun m hm D hD => ?_⟩
  have h2 := computes_of_circuit hD
  rw [PERM_eq ℝ m] at h2
  exact h m hm D.size h2

/-! ### Polynomial bounds: BlindB's `a * (n + 1) ^ d` and the release's `n ^ a + a` -/

theorem pbounded_of_le {t : ℕ → ℕ} (a : ℕ) (h : ∀ n, t n ≤ n ^ a + a) : BlindB.PBounded t := by
  refine ⟨a + 1, a, fun n => (h n).trans ?_⟩
  have h1 : n ^ a ≤ (n + 1) ^ a := Nat.pow_le_pow_left (Nat.le_succ n) a
  have h2 : 1 ≤ (n + 1) ^ a := Nat.one_le_pow _ _ (Nat.succ_pos n)
  have h3 : a ≤ a * (n + 1) ^ a := by simpa using Nat.mul_le_mul_left a h2
  calc n ^ a + a ≤ (n + 1) ^ a + a * (n + 1) ^ a := Nat.add_le_add h1 h3
    _ = (a + 1) * (n + 1) ^ a := by ring

theorem le_of_pbounded {t : ℕ → ℕ} (h : BlindB.PBounded t) : ∃ A, ∀ n, t n ≤ n ^ A + A := by
  obtain ⟨a, d, h⟩ := h
  refine ⟨a * 2 ^ d + d + a, fun n => (h n).trans ?_⟩
  rcases Nat.lt_or_ge n 2 with hn | hn
  · interval_cases n
    · simp only [zero_add, one_pow, mul_one]
      exact le_add_left (Nat.le_add_left a _)
    · simp only [one_pow, one_add_one_eq_two]
      lia
  · have e1 : (n + 1) ^ d ≤ (2 * n) ^ d := Nat.pow_le_pow_left (by lia) d
    have e2 : a * 2 ^ d ≤ n ^ (a * 2 ^ d) :=
      (Nat.lt_pow_self (n := a * 2 ^ d) (by lia : 1 < n)).le
    have e3 : n ^ (a * 2 ^ d + d) ≤ n ^ (a * 2 ^ d + d + a) :=
      Nat.pow_le_pow_right (by lia) (Nat.le_add_right _ _)
    calc a * (n + 1) ^ d ≤ a * (2 * n) ^ d := Nat.mul_le_mul_left a e1
      _ = a * 2 ^ d * n ^ d := by rw [mul_pow]; ring
      _ ≤ n ^ (a * 2 ^ d) * n ^ d := Nat.mul_le_mul_right _ e2
      _ = n ^ (a * 2 ^ d + d) := by rw [pow_add]
      _ ≤ n ^ (a * 2 ^ d + d + a) := e3
      _ ≤ n ^ (a * 2 ^ d + d + a) + (a * 2 ^ d + d + a) := Nat.le_add_right _ _

theorem pbounded_add {t u : ℕ → ℕ} (ht : BlindB.PBounded t) (hu : BlindB.PBounded u) :
    BlindB.PBounded (fun n => t n + u n) := by
  obtain ⟨a, d, ht⟩ := ht
  obtain ⟨b, e, hu⟩ := hu
  refine ⟨a + b, d + e, fun n => ?_⟩
  have h1 : (n + 1) ^ d ≤ (n + 1) ^ (d + e) := Nat.pow_le_pow_right (Nat.succ_pos n) (Nat.le_add_right _ _)
  have h2 : (n + 1) ^ e ≤ (n + 1) ^ (d + e) := Nat.pow_le_pow_right (Nat.succ_pos n) (Nat.le_add_left _ _)
  calc t n + u n ≤ a * (n + 1) ^ d + b * (n + 1) ^ e := Nat.add_le_add (ht n) (hu n)
    _ ≤ a * (n + 1) ^ (d + e) + b * (n + 1) ^ (d + e) :=
        Nat.add_le_add (Nat.mul_le_mul_left a h1) (Nat.mul_le_mul_left b h2)
    _ = (a + b) * (n + 1) ^ (d + e) := by ring

/-- Three BlindB bounds give one release exponent `A` for all three. -/
theorem le_of_pbounded₃ {t u v : ℕ → ℕ} (ht : BlindB.PBounded t) (hu : BlindB.PBounded u)
    (hv : BlindB.PBounded v) : ∃ A, ∀ n, t n ≤ n ^ A + A ∧ u n ≤ n ^ A + A ∧ v n ≤ n ^ A + A := by
  obtain ⟨A, hA⟩ := le_of_pbounded (pbounded_add (pbounded_add ht hu) hv)
  exact ⟨A, fun n => ⟨by have := hA n; lia, by have := hA n; lia, by have := hA n; lia⟩⟩

/-! ### Renaming by an equivalence -/

theorem rename_symm_rename {R α β : Type} [CommSemiring R] (e : α ≃ β) (p : MvPolynomial α R) :
    rename e.symm (rename e p) = p := by
  rw [rename_rename]
  simp

theorem totalDegree_rename_equiv {R α β : Type} [CommSemiring R] (e : α ≃ β) (p : MvPolynomial α R) :
    (rename e p).totalDegree = p.totalDegree := by
  refine le_antisymm (totalDegree_rename_le _ _) ?_
  conv_lhs => rw [← rename_symm_rename e p]
  exact totalDegree_rename_le _ _

/-- Substituting polynomials of total degree at most one does not raise the total degree. -/
theorem totalDegree_aeval_le {R σ τ : Type} [CommSemiring R] (φ : σ → MvPolynomial τ R)
    (hφ : ∀ i, (φ i).totalDegree ≤ 1) (p : MvPolynomial σ R) :
    (aeval φ p).totalDegree ≤ p.totalDegree := by
  conv_lhs => rw [p.as_sum]
  rw [map_sum]
  refine (totalDegree_finsetSum _ _).trans (Finset.sup_le fun d hd => ?_)
  rw [aeval_monomial, algebraMap_eq]
  refine (totalDegree_mul _ _).trans ?_
  rw [totalDegree_C, zero_add]
  refine (totalDegree_finsetProd _ _).trans ?_
  refine le_trans ?_ (le_totalDegree hd)
  refine Finset.sum_le_sum fun i _ => ?_
  refine (totalDegree_pow _ _).trans ?_
  simpa using Nat.mul_le_mul_left (d i) (hφ i)

theorem rename_approx_form {K α β : Type} [Field K] (e : α ≃ β) (p : MvPolynomial α K)
    (g : MvPolynomial β (PowerSeries K)) :
    rename e.symm (MvPolynomial.map (HahnSeries.ofPowerSeries ℤ K)
      (MvPolynomial.map (PowerSeries.C : K →+* PowerSeries K) (rename e p) +
        MvPolynomial.C (PowerSeries.X : PowerSeries K) * g)) =
    MvPolynomial.map (HahnSeries.ofPowerSeries ℤ K)
      (MvPolynomial.map (PowerSeries.C : K →+* PowerSeries K) p +
        MvPolynomial.C (PowerSeries.X : PowerSeries K) * rename e.symm g) := by
  rw [← map_rename]
  congr 1
  rw [map_add, map_mul, rename_C, ← map_rename, rename_symm_rename]

/-- A BlindB approximating circuit for a renamed polynomial gives a release approximation of the
original polynomial, with the same number of gates. -/
theorem approximates_of_circuit_rename {K α β : Type} [Field K] (e : α ≃ β) {p : MvPolynomial α K}
    {D : BlindB.Circuit (LaurentSeries K) β} (h : D.Approximates (rename e p)) :
    Statement.Approximates p D.size := by
  obtain ⟨g, hg⟩ := h
  have h1 := computes_rename e.symm (computes_of_circuit hg)
  rw [rename_approx_form] at h1
  exact approximates_of_computes h1

/-! ### Families -/

/-- A BlindB family as a release family (variables `Fin (arity n)`). -/
def toR {K : Type} [Field K] (F : BlindB.Family K) : Statement.Family K :=
  { vars := fun n => Fin (F.arity n), poly := F.poly }

/-- A release family as a BlindB family (variables renumbered by `Fintype.equivFin`). -/
def toB {K : Type} [Field K] (f : Statement.Family K) : BlindB.Family K :=
  { arity := fun n => Fintype.card (f.vars n)
    poly := fun n => rename (Fintype.equivFin (f.vars n)) (f.poly n) }

/-- If the renumbered family is in BlindB's VP, the family is in the release's VP. -/
theorem mem_VP_of_toB {K : Type} [Field K] {f : Statement.Family K} (h : toB f ∈ BlindB.VP K) :
    f ∈ Statement.VP K := by
  obtain ⟨⟨ha, hd⟩, s, hs, hc⟩ := h
  obtain ⟨A, hA⟩ := le_of_pbounded₃ ha hd hs
  refine ⟨A, fun n => ⟨(hA n).1, ?_, ?_⟩⟩
  · have := (hA n).2.1
    simp only [toB, totalDegree_rename_equiv] at this
    exact this
  · obtain ⟨D, hD, hDc⟩ := hc n
    have h1 := computes_rename (Fintype.equivFin (f.vars n)).symm (computes_of_circuit hDc)
    simp only [toB, rename_symm_rename] at h1
    exact computes_mono h1 (hD.trans (hA n).2.2)

/-- If the renumbered family is in BlindB's VP-bar, the family is in the release's VP-bar. -/
theorem mem_VPBar_of_toB {K : Type} [Field K] {f : Statement.Family K} (h : toB f ∈ BlindB.VPBar K) :
    f ∈ Statement.VPBar K := by
  obtain ⟨⟨ha, hd⟩, s, hs, hc⟩ := h
  obtain ⟨A, hA⟩ := le_of_pbounded₃ ha hd hs
  refine ⟨A, fun n => ⟨(hA n).1, ?_, ?_⟩⟩
  · have := (hA n).2.1
    simp only [toB, totalDegree_rename_equiv] at this
    exact this
  · obtain ⟨D, hD, hDc⟩ := hc n
    exact approximates_mono (approximates_of_circuit_rename (Fintype.equivFin (f.vars n)) hDc)
      (hD.trans (hA n).2.2)

/-- A release VNP family, renumbered, is in BlindB's VNP (witness width the release's `r`, witness the
release's `g` renumbered; its BlindB circuits come from the release's gate lists). -/
theorem toB_mem_VNP {K : Type} [Field K] {f : Statement.Family K} (h : f ∈ Statement.VNP K) :
    toB f ∈ BlindB.VNP K := by
  classical
  obtain ⟨r, g, ⟨a, ha⟩, hf⟩ := h
  have hcard : ∀ n, Fintype.card (f.vars n) + r n ≤ n ^ a + a := fun n => by
    have := (ha n).1
    simpa [Fintype.card_sum] using this
  have hdeg : ∀ n, (f.poly n).totalDegree ≤ n ^ a + a := fun n => by
    rw [hf n]
    refine (totalDegree_finsetSum _ _).trans (Finset.sup_le fun e _ => ?_)
    refine (totalDegree_aeval_le _ ?_ _).trans (ha n).2.1
    intro i
    rcases i with v | j
    · exact (totalDegree_X v).le
    · simp only [Sum.elim_inr]
      split_ifs <;> simp
  let ψ : ∀ n, f.vars n ⊕ Fin (r n) ≃ Fin (Fintype.card (f.vars n) + r n) := fun n =>
    (Equiv.sumCongr (Fintype.equivFin (f.vars n)) (Equiv.refl _)).trans finSumFinEquiv
  refine ⟨⟨pbounded_of_le a (fun n => le_trans (Nat.le_add_right _ _) (hcard n)),
      pbounded_of_le a (fun n => ?_)⟩,
    r, pbounded_of_le a (fun n => le_trans (Nat.le_add_left _ _) (hcard n)),
    fun n => rename (ψ n) (g n),
    ⟨⟨pbounded_of_le a hcard, pbounded_of_le a (fun n => ?_)⟩,
      fun n => n ^ a + a, pbounded_of_le a (fun n => le_rfl), fun n => ?_⟩, fun n => ?_⟩
  · show (rename (Fintype.equivFin (f.vars n)) (f.poly n)).totalDegree ≤ _
    rw [totalDegree_rename_equiv]
    exact hdeg n
  · show (rename (ψ n) (g n)).totalDegree ≤ _
    rw [totalDegree_rename_equiv]
    exact (ha n).2.1
  · obtain ⟨D, hD, hDc⟩ := circuit_of_computes (computes_rename (ψ n) (ha n).2.2)
    exact ⟨D, hD.le, hDc⟩
  · show rename (Fintype.equivFin (f.vars n)) (f.poly n) = BlindB.booleanSum (rename (ψ n) (g n))
    unfold BlindB.booleanSum
    rw [hf n, map_sum]
    refine Finset.sum_congr rfl (fun e _ => ?_)
    rw [comp_aeval_apply, aeval_def, algebraMap_eq, eval₂_rename]
    congr 1
    funext i
    rcases i with v | j
    · simp [ψ, finSumFinEquiv_apply_left, Fin.append_left]
    · simp only [ψ, Function.comp_apply, Equiv.trans_apply, Equiv.sumCongr_apply, Sum.map_inr,
        Equiv.refl_apply, finSumFinEquiv_apply_right, Fin.append_right, Sum.elim_inr]
      split_ifs <;> simp

/-- In BlindB's own definitions, VP ⊆ VNP (witness width zero). -/
theorem VP_sub_VNP (K : Type) [Field K] : BlindB.VP K ⊆ BlindB.VNP K := by
  intro F hF
  refine ⟨hF.1, fun _ => 0, ⟨0, 0, fun n => Nat.zero_le _⟩, F.poly, hF, fun n => ?_⟩
  unfold BlindB.booleanSum
  rw [Fintype.sum_unique]
  have e : ∀ v : Fin 0 → MvPolynomial (Fin (F.arity n)) K,
      Fin.append (fun i : Fin (F.arity n) => (X i : MvPolynomial (Fin (F.arity n)) K)) v =
        fun i => X i := by
    intro v
    funext i
    rw [Fin.append_right_nil _ _ rfl]
    rfl
  rw [e, eval₂_eta]

/-- BlindB's `Separation`, from `Solution.separation`. -/
theorem separation : BlindB.Separation := by
  intro K _
  refine ⟨VP_sub_VNP K, fun h => ?_⟩
  apply (Solution.separation.{0} K).2
  intro f hf
  exact mem_VP_of_toB (h (toB_mem_VNP hf))

/-- BlindB's `SeparationClosure`, from `Solution.separationClosure`. -/
theorem separationClosure : BlindB.SeparationClosure := by
  intro K _ h
  apply Solution.separationClosure.{0} K
  intro f hf
  exact mem_VPBar_of_toB (h (toB_mem_VNP hf))

end

end CertMachine.BridgeB
