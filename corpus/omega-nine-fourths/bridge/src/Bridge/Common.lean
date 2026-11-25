import OAI.LinearAlgebra.SpectralBooks.ExactExponent

/-!
# The ω = 9/4 bridge: lemmas shared by both writers (rows F2, F3; cert-machine, 2026-11-25)

Written by the bridge author (a Claude agent). Everything here is proved from the release's own
definitions and lemmas at github.com/openai/math @ 92b516ef. The route between a writer's model and
the release's `formalOmega` goes through the release's set-based division-free model
`OAI.LinearAlgebra.MatrixExponent.Integral` and its public lemma `formalOmega_eq_integral`.
-/

namespace OmegaBridge

open OAI.LinearAlgebra.SpectralBooks
open OAI.LinearAlgebra.MatrixExponent

noncomputable section

/-! ## Infima of two sets that approximate each other -/

/-- If `S ⊆ T`, every `t ∈ T` lands in `S` after adding any `ε > 0`, and the infimum of `T` is not
Lean's junk value `0` (so `T` is nonempty and bounded below), then `S` and `T` have the same
infimum. This is how two definitions of an exponent with different `O(·)` forms are compared. -/
theorem sInf_eq_of_approx {S T : Set ℝ} (hT : sInf T ≠ 0) (h1 : S ⊆ T)
    (h2 : ∀ t ∈ T, ∀ ε : ℝ, 0 < ε → t + ε ∈ S) : sInf S = sInf T := by
  have hTne : T.Nonempty := by
    rcases T.eq_empty_or_nonempty with h | h
    · exact (hT (by rw [h, Real.sInf_empty])).elim
    · exact h
  have hTbdd : BddBelow T := by
    by_contra h
    exact hT (Real.sInf_of_not_bddBelow h)
  obtain ⟨t0, ht0⟩ := hTne
  have hSne : S.Nonempty := ⟨t0 + 1, h2 t0 ht0 1 one_pos⟩
  have hSbdd : BddBelow S := BddBelow.mono h1 hTbdd
  apply le_antisymm
  · apply le_csInf ⟨t0, ht0⟩
    intro t ht
    exact le_of_forall_pos_le_add fun ε hε => csInf_le hSbdd (h2 t ht ε hε)
  · exact csInf_le_csInf hTbdd hSne h1

/-- A set of reals whose infimum is not `0` is nonempty. -/
theorem nonempty_of_sInf_ne_zero {T : Set ℝ} (hT : sInf T ≠ 0) : T.Nonempty := by
  rcases T.eq_empty_or_nonempty with h | h
  · exact (hT (by rw [h, Real.sInf_empty])).elim
  · exact h

/-- A set of reals whose infimum is not `0` is bounded below, so its infimum is a lower bound. -/
theorem sInf_le_of_mem {T : Set ℝ} (hT : sInf T ≠ 0) {t : ℝ} (ht : t ∈ T) : sInf T ≤ t :=
  csInf_le (by by_contra h; exact hT (Real.sInf_of_not_bddBelow h)) ht

/-! ## The closed form, with the weights already nonnegative -/

/-- The release's right side with `x` the largest weight, `z` the smallest, `s` the sum of the
three, and `s - x - z` the middle one (no `let`s, so that it can be rewritten). -/
def fmlCore (x z s : ℝ) : ℝ :=
  x + (s - x - z) +
    (max ((x + (s - x - z)) * z - x * (s - x - z)) 0) ^ 2 / (4 * x * (s - x - z) * z)

/-- The release's right side of `rectangular_exponent` at already-clipped weights. -/
def fml (a b c : ℝ) : ℝ := fmlCore (max a (max b c)) (min a (min b c)) (a + b + c)

/-- The right side of the release's `rectangular_exponent` is `fml` of the clipped weights:
the release's `let`s unfold to exactly this term. -/
theorem formalOmega_eq_fml (F : Type*) [Field F] (a b c : ℝ) :
    formalOmega F a b c = fml (max a 0) (max b 0) (max c 0) := by
  rw [rectangular_exponent F a b c]
  rfl

/-- At nonnegative weights the clipping does nothing. -/
theorem formalOmega_eq_fml_nonneg (F : Type*) [Field F] {a b c : ℝ} (ha : 0 ≤ a) (hb : 0 ≤ b)
    (hc : 0 ≤ c) : formalOmega F a b c = fml a b c := by
  rw [formalOmega_eq_fml, max_eq_left ha, max_eq_left hb, max_eq_left hc]

/-- The largest of three numbers does not depend on their cyclic order. -/
theorem max3_cycle (a b c : ℝ) : max a (max b c) = max b (max c a) := by
  apply le_antisymm
  · exact max_le (le_max_of_le_right (le_max_right _ _))
      (max_le (le_max_left _ _) (le_max_of_le_right (le_max_left _ _)))
  · exact max_le (le_max_of_le_right (le_max_left _ _))
      (max_le (le_max_of_le_right (le_max_right _ _)) (le_max_left _ _))

/-- The smallest of three numbers does not depend on their cyclic order. -/
theorem min3_cycle (a b c : ℝ) : min a (min b c) = min b (min c a) := by
  apply le_antisymm
  · exact le_min ((min_le_right _ _).trans (min_le_left _ _))
      (le_min ((min_le_right _ _).trans (min_le_right _ _)) (min_le_left _ _))
  · exact le_min ((min_le_right _ _).trans (min_le_right _ _))
      (le_min (min_le_left _ _) ((min_le_right _ _).trans (min_le_left _ _)))

/-- The closed form is invariant under the cyclic shift of the weights. -/
theorem fml_cycle (a b c : ℝ) : fml a b c = fml b c a := by
  unfold fml
  rw [max3_cycle a b c, min3_cycle a b c, show a + b + c = b + c + a by ring]

/-- The closed form is invariant under swapping the first two weights. -/
theorem fml_swap (a b c : ℝ) : fml a b c = fml b a c := by
  unfold fml
  rw [max_left_comm a b c, min_left_comm a b c, show a + b + c = b + a + c by ring]

/-- So the release's rectangular exponent is invariant under the cyclic shift of its weights. -/
theorem formalOmega_cycle (F : Type*) [Field F] (a b c : ℝ) :
    formalOmega F a b c = formalOmega F b c a := by
  rw [formalOmega_eq_fml, formalOmega_eq_fml, fml_cycle]

/-- And under swapping its first two weights. -/
theorem formalOmega_swap (F : Type*) [Field F] (a b c : ℝ) :
    formalOmega F a b c = formalOmega F b a c := by
  rw [formalOmega_eq_fml, formalOmega_eq_fml, fml_swap]

/-- For nonnegative weights the middle one, `sum − max − min`, is nonnegative. -/
theorem median_nonneg {a b c : ℝ} (ha : 0 ≤ a) (hb : 0 ≤ b) (hc : 0 ≤ c) :
    0 ≤ a + b + c - max a (max b c) - min a (min b c) := by
  have h1 : min a (min b c) ≤ a := min_le_left _ _
  have h2 : min a (min b c) ≤ b := (min_le_right _ _).trans (min_le_left _ _)
  have h3 : min a (min b c) ≤ c := (min_le_right _ _).trans (min_le_right _ _)
  rcases max_choice a (max b c) with h | h <;> rw [h]
  · linarith
  · rcases max_choice b c with h' | h' <;> rw [h'] <;> linarith

/-- The core of the closed form is at least `sum − min` when the three parts are nonnegative
(its correction term is a square over a nonnegative number). -/
theorem fmlCore_ge {x z s : ℝ} (hx : 0 ≤ x) (hz : 0 ≤ z) (hy : 0 ≤ s - x - z) :
    s - z ≤ fmlCore x z s := by
  unfold fmlCore
  have hq : 0 ≤ (max ((x + (s - x - z)) * z - x * (s - x - z)) 0) ^ 2 /
      (4 * x * (s - x - z) * z) :=
    div_nonneg (sq_nonneg _) (mul_nonneg (mul_nonneg (mul_nonneg (by norm_num) hx) hy) hz)
  linarith

/-- The closed form at nonnegative weights is at least the sum of the first and the third weight
(the area of the output matrix, in the order rows, inner, columns). -/
theorem fml_ge {a b c : ℝ} (ha : 0 ≤ a) (hb : 0 ≤ b) (hc : 0 ≤ c) : a + c ≤ fml a b c := by
  have h := fmlCore_ge (x := max a (max b c)) (z := min a (min b c)) (s := a + b + c)
    (ha.trans (le_max_left _ _)) (le_min ha (le_min hb hc)) (median_nonneg ha hb hc)
  have hzb : min a (min b c) ≤ b := (min_le_right _ _).trans (min_le_left _ _)
  unfold fml
  linarith

/-! ## The release's set-based division-free model: initial set, ring maps, padding -/

/-- Every set reached by a division-free build contains the initial set. -/
theorem int_initial_subset {K : Type*} [CommRing K] {S : Set K} {m : ℕ} {T : Set K}
    (h : Integral.Build S m T) : S ⊆ T := by
  induction h with
  | nil => exact subset_rfl
  | add _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | sub _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | mul _ _ _ ih => exact ih.trans (Set.subset_insert _ _)

/-- A ring map carries a division-free build of cost `m` to one of the same cost, provided it
carries the initial set into the new initial set. -/
theorem int_build_map {K L : Type*} [CommRing K] [CommRing L] (f : K →+* L)
    {S : Set K} {S' : Set L} (hS : ∀ s ∈ S, f s ∈ S') {m : ℕ} {T : Set K}
    (h : Integral.Build S m T) : ∃ T' : Set L, Integral.Build S' m T' ∧ ∀ t ∈ T, f t ∈ T' := by
  induction h with
  | nil => exact ⟨S', .nil, hS⟩
  | add _ hx hy ih =>
    obtain ⟨T', hb, hT⟩ := ih
    refine ⟨_, hb.add (hT _ hx) (hT _ hy), fun t ht => ?_⟩
    rcases Set.mem_insert_iff.mp ht with rfl | ht
    · rw [map_add]; exact Set.mem_insert _ _
    · exact Set.mem_insert_of_mem _ (hT t ht)
  | sub _ hx hy ih =>
    obtain ⟨T', hb, hT⟩ := ih
    refine ⟨_, hb.sub (hT _ hx) (hT _ hy), fun t ht => ?_⟩
    rcases Set.mem_insert_iff.mp ht with rfl | ht
    · rw [map_sub]; exact Set.mem_insert _ _
    · exact Set.mem_insert_of_mem _ (hT t ht)
  | mul _ hx hy ih =>
    obtain ⟨T', hb, hT⟩ := ih
    refine ⟨_, hb.mul (hT _ hx) (hT _ hy), fun t ht => ?_⟩
    rcases Set.mem_insert_iff.mp ht with rfl | ht
    · rw [map_mul]; exact Set.mem_insert _ _
    · exact Set.mem_insert_of_mem _ (hT t ht)

/-- The padding substitution: an input variable of the large format whose indices lie in the small
format goes to the small variable, every other one to `0`. -/
def padVar (F : Type*) [Field F] {i j k i' j' k' : ℕ} :
    Integral.Var i j k → MvPolynomial (Integral.Var i' j' k') F
  | .inl (r, l) =>
    if hr : r.val < i' then
      if hl : l.val < k' then MvPolynomial.X (.inl (⟨r.val, hr⟩, ⟨l.val, hl⟩)) else 0
    else 0
  | .inr (l, c) =>
    if hl : l.val < k' then
      if hc : c.val < j' then MvPolynomial.X (.inr (⟨l.val, hl⟩, ⟨c.val, hc⟩)) else 0
    else 0

/-- Padding in the release's set-based division-free model (rows `i`, columns `j`, inner `k`): a
computation of the large format gives one of every smaller format at the same cost (substitute
`0` for the extra input variables). -/
theorem int_computes_pad {F : Type*} [Field F] {i j k i' j' k' m : ℕ}
    (h : Integral.Computes F i j k m) (hi : i' ≤ i) (hj : j' ≤ j) (hk : k' ≤ k) :
    Integral.Computes F i' j' k' m := by
  classical
  obtain ⟨T, hb, hout⟩ := h
  let φ : Integral.Poly F i j k →+* Integral.Poly F i' j' k' :=
    (MvPolynomial.aeval (padVar F (i := i) (j := j) (k := k) (i' := i') (j' := j') (k' := k'))).toRingHom
  have hφX : ∀ x, φ (MvPolynomial.X x) = padVar F x := fun x => by
    simp [φ, MvPolynomial.aeval_X]
  have hφC : ∀ a : F, φ (algebraMap F _ a) = algebraMap F _ a := fun a => by
    simp [φ]
  obtain ⟨T', hb', hT'⟩ := int_build_map φ (S' := Integral.initial F i' j' k') (fun s hs => by
    rcases hs with ⟨a, rfl⟩ | ⟨x, rfl⟩
    · exact Set.mem_union_left _ ⟨a, (hφC a).symm⟩
    · change φ (MvPolynomial.X x) ∈ _
      rw [hφX]
      rcases x with ⟨r, l⟩ | ⟨l, c⟩
      · simp only [padVar]
        split_ifs <;> first
          | exact Set.mem_union_right _ ⟨_, rfl⟩
          | exact Set.mem_union_left _ ⟨0, map_zero _⟩
      · simp only [padVar]
        split_ifs <;> first
          | exact Set.mem_union_right _ ⟨_, rfl⟩
          | exact Set.mem_union_left _ ⟨0, map_zero _⟩) hb
  refine ⟨T', hb', fun p => ?_⟩
  have hp := hT' _ (hout (Fin.castLE hi p.1, Fin.castLE hj p.2))
  convert hp using 1
  simp only [Integral.output, Integral.input, map_sum, map_mul, hφX]
  refine Fintype.sum_of_injective (Fin.castLE hk) (Fin.castLE_injective hk) _ _ ?_ ?_
  · intro l hl
    have hlarge : ¬ l.val < k' := fun hs => hl ⟨⟨l.val, hs⟩, Fin.ext rfl⟩
    simp [padVar, hlarge]
  · intro l
    simp [padVar, p.1.isLt, p.2.isLt, l.isLt]

/-! ## Rounding down at a larger scale dominates rounding up -/

/-- If `k^w ≥ 3` (or `w = 0`) then `⌈N^w⌉ ≤ ⌊(kN)^w⌋` for every `N ≥ 1`: a floor-rounded format at
scale `kN` contains the ceiling-rounded format at scale `N`. -/
theorem ceil_le_floor_scale {w : ℝ} (hw : 0 ≤ w) {k : ℕ} (hk : w = 0 ∨ (3 : ℝ) ≤ (k : ℝ) ^ w)
    {N : ℕ} (hN : 1 ≤ N) : ⌈(N : ℝ) ^ w⌉₊ ≤ ⌊((k * N : ℕ) : ℝ) ^ w⌋₊ := by
  rcases hk with rfl | hk
  · simp
  · have hN' : (1 : ℝ) ≤ N := by exact_mod_cast hN
    have hx : 1 ≤ (N : ℝ) ^ w := Real.one_le_rpow hN' hw
    have hy : ((k * N : ℕ) : ℝ) ^ w = (k : ℝ) ^ w * (N : ℝ) ^ w := by
      rw [Nat.cast_mul, Real.mul_rpow (Nat.cast_nonneg _) (Nat.cast_nonneg _)]
    apply Nat.ceil_le.mpr
    have hfl := Nat.lt_floor_add_one (((k * N : ℕ) : ℝ) ^ w)
    rw [hy] at hfl ⊢
    have h3 : 3 * (N : ℝ) ^ w ≤ (k : ℝ) ^ w * (N : ℝ) ^ w :=
      mul_le_mul_of_nonneg_right hk (zero_le_one.trans hx)
    linarith

/-- One scale factor serves three nonnegative weights at once, and so does every larger one. -/
theorem exists_scale {a b c : ℝ} (ha : 0 ≤ a) (hb : 0 ≤ b) (hc : 0 ≤ c) :
    ∃ k : ℕ, 0 < k ∧ ∀ k' : ℕ, k ≤ k' → ∀ N : ℕ, 1 ≤ N →
      ⌈(N : ℝ) ^ a⌉₊ ≤ ⌊((k' * N : ℕ) : ℝ) ^ a⌋₊ ∧
      ⌈(N : ℝ) ^ b⌉₊ ≤ ⌊((k' * N : ℕ) : ℝ) ^ b⌋₊ ∧
      ⌈(N : ℝ) ^ c⌉₊ ≤ ⌊((k' * N : ℕ) : ℝ) ^ c⌋₊ := by
  obtain ⟨K, hK⟩ : ∃ K : ℝ, K = (3 : ℝ) ^ a⁻¹ + (3 : ℝ) ^ b⁻¹ + (3 : ℝ) ^ c⁻¹ := ⟨_, rfl⟩
  have h3 : ∀ w : ℝ, 0 ≤ (3 : ℝ) ^ w⁻¹ := fun w => Real.rpow_nonneg (by norm_num) _
  have h3a : 0 < (3 : ℝ) ^ a⁻¹ := Real.rpow_pos_of_pos (by norm_num) _
  have hKpos : 0 < K := by linarith [h3 b, h3 c]
  refine ⟨⌈K⌉₊, Nat.ceil_pos.mpr hKpos, fun k' hk' N hN => ?_⟩
  have key : ∀ w : ℝ, 0 ≤ w → (3 : ℝ) ^ w⁻¹ ≤ K → w = 0 ∨ (3 : ℝ) ≤ (k' : ℝ) ^ w := by
    intro w hw hwK
    rcases eq_or_lt_of_le hw with h | h
    · exact Or.inl h.symm
    · right
      have hk'K : K ≤ (k' : ℝ) := (Nat.le_ceil K).trans (by exact_mod_cast hk')
      calc (3 : ℝ) = ((3 : ℝ) ^ w⁻¹) ^ w := (Real.rpow_inv_rpow (by norm_num) h.ne').symm
        _ ≤ (k' : ℝ) ^ w := Real.rpow_le_rpow (h3 w) (hwK.trans hk'K) hw
  exact ⟨ceil_le_floor_scale ha (key a ha (by linarith [h3 b, h3 c])) hN,
    ceil_le_floor_scale hb (key b hb (by linarith [h3 a, h3 c])) hN,
    ceil_le_floor_scale hc (key c hc (by linarith [h3 a, h3 b])) hN⟩

/-- A cost bound `C·(kN)^s` is a bound `C'·N^(s+ε)` with `C' = (|C|+1)·k^s > 0`, for `N ≥ 1`. -/
theorem scaled_bound {C s ε x : ℝ} {k N : ℕ} (hk : 0 < k) (hN : 1 ≤ N) (hε : 0 ≤ ε)
    (hx : x ≤ C * ((k * N : ℕ) : ℝ) ^ s) :
    x ≤ ((|C| + 1) * (k : ℝ) ^ s) * (N : ℝ) ^ (s + ε) := by
  have hN1 : (1 : ℝ) ≤ N := by exact_mod_cast hN
  have hX : ((k * N : ℕ) : ℝ) ^ s = (k : ℝ) ^ s * (N : ℝ) ^ s := by
    rw [Nat.cast_mul, Real.mul_rpow (Nat.cast_nonneg _) (Nat.cast_nonneg _)]
  have hks : 0 ≤ (k : ℝ) ^ s := Real.rpow_nonneg (Nat.cast_nonneg _) _
  have hNs : (N : ℝ) ^ s ≤ (N : ℝ) ^ (s + ε) := Real.rpow_le_rpow_of_exponent_le hN1 (by linarith)
  have hNs0 : 0 ≤ (N : ℝ) ^ s := Real.rpow_nonneg (Nat.cast_nonneg _) _
  have hC' : C ≤ |C| + 1 := (le_abs_self C).trans (by linarith)
  have hC1 : 0 ≤ |C| + 1 := by positivity
  calc x ≤ C * ((k * N : ℕ) : ℝ) ^ s := hx
    _ = C * ((k : ℝ) ^ s * (N : ℝ) ^ s) := by rw [hX]
    _ ≤ (|C| + 1) * ((k : ℝ) ^ s * (N : ℝ) ^ s) :=
        mul_le_mul_of_nonneg_right hC' (mul_nonneg hks hNs0)
    _ ≤ (|C| + 1) * ((k : ℝ) ^ s * (N : ℝ) ^ (s + ε)) :=
        mul_le_mul_of_nonneg_left (mul_le_mul_of_nonneg_left hNs hks) hC1
    _ = ((|C| + 1) * (k : ℝ) ^ s) * (N : ℝ) ^ (s + ε) := by ring

/-- The constant of `scaled_bound` is positive. -/
theorem scaled_const_pos (C s : ℝ) {k : ℕ} (hk : 0 < k) : 0 < (|C| + 1) * (k : ℝ) ^ s :=
  mul_pos (by positivity) (Real.rpow_pos_of_pos (by exact_mod_cast hk) _)

end

end OmegaBridge
