import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import Bridge.BlindB
import Bridge.Common
import Bridge.BridgeB

/-!
# The ω = 9/4 bridge for writer B, with division (row F2, reported separately; cert-machine)

Writer B's `BlindB.SquareExponentWithDivision` (circuits with division gates checked in the field
of rational functions) from the release's `OAI.LinearAlgebra.MatrixExponent.omega_eq`, whose model
(`MatrixExponent/RationalCircuits.lean`) has a division rule tested in the same field. Writer B's
circuits and the release's rational builds have the same cost in both directions. Writer B's
`O(·)` threshold `n ≥ N₀` cannot be removed by padding here (substituting `0` can make a divisor
vanish), so the sizes below `N₀` are covered by any admissible exponent of the release's rational
model, which exists because `omega F = 9/4 ≠ 0`.
-/

namespace OmegaBridge.BDiv

open OAI.LinearAlgebra.MatrixExponent
open OmegaBridge.B (Reads reads_initial reads_step)

noncomputable section

variable {F : Type} [Field F]

/-- The field of rational functions in writer B's square input variables. -/
abbrev RF (F : Type) [Field F] (n : ℕ) := FractionRing (BlindB.EntryPoly F n n n)

/-- Writer B's interpretation map with division. -/
abbrev ιd (F : Type) [Field F] (n : ℕ) : BlindB.EntryPoly F n n n →+* RF F n :=
  algebraMap (BlindB.EntryPoly F n n n) (RF F n)

/-- A constant of `F` in the field of rational functions is the image of the constant polynomial. -/
theorem algebraMap_C {n : ℕ} (c : F) : algebraMap F (RF F n) c = ιd F n (MvPolynomial.C c) := by
  first
  | rfl
  | (rw [IsScalarTower.algebraMap_apply F (BlindB.EntryPoly F n n n) (RF F n),
      MvPolynomial.algebraMap_eq])

/-- Writer B's product entry, read in the field of rational functions, is the release's output
entry. -/
theorem ιd_productEntry {n : ℕ} (i j : Fin n) :
    ιd F n (BlindB.productEntry F (k := n) i j) = output F (i, j) := by
  simp [ιd, BlindB.productEntry, output, input, map_sum, map_mul]

/-- `⌊n^1⌋ = n`. -/
theorem side_one (n : ℕ) : BlindB.side n 1 = n := by
  simp [BlindB.side]

/-- In the field of rational functions, a wire whose earlier gates lie in a set containing the
initial values reads an element of that set. -/
theorem wire_mem {n b : ℕ} (w : BlindB.Wire F (BlindB.Input n n n) b) (g : ℕ → RF F n)
    {T : Set (RF F n)} (hinit : initial F n ⊆ T) (hg : ∀ i < b, g i ∈ T) :
    w.value (ιd F n) g ∈ T := by
  cases w with
  | scalar a => exact hinit (Set.mem_union_left _ ⟨a, algebraMap_C a⟩)
  | input v => exact hinit (Set.mem_union_right _ ⟨v, rfl⟩)
  | gate i => exact hg i.val i.isLt

/-- Every set reached by a build with division contains the initial set. -/
theorem rat_initial_subset {K : Type*} [Field K] {S : Set K} {m : ℕ} {T : Set K}
    (h : Build S m T) : S ⊆ T := by
  induction h with
  | nil => exact subset_rfl
  | add _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | sub _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | mul _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | div _ _ _ _ ih => exact ih.trans (Set.subset_insert _ _)

/-- The values of the first `t` gates of a circuit of writer B with division lie in a build with
division of cost `t` in the release's rational model (a division gate's `z·y = x, y ≠ 0` is
`z = x / y`). -/
theorem build_of_circuit {n : ℕ} (D : BlindB.Circuit F n n n) (g : ℕ → RF F n)
    (hg : ∀ i : Fin D.cost, (D.op i).Holds ((D.left i).value (ιd F n) g)
      ((D.right i).value (ιd F n) g) (g i.val)) :
    ∀ t, t ≤ D.cost → ∃ T : Set (RF F n), Build (initial F n) t T ∧ ∀ i < t, g i ∈ T := by
  intro t
  induction t with
  | zero => intro _; exact ⟨_, .nil, fun i hi => absurd hi (Nat.not_lt_zero _)⟩
  | succ t ih =>
    intro ht
    obtain ⟨T, hb, hT⟩ := ih (Nat.le_of_succ_le ht)
    have hinit := rat_initial_subset hb
    let j : Fin D.cost := ⟨t, ht⟩
    have hx := wire_mem (D.left j) g hinit hT
    have hy := wire_mem (D.right j) g hinit hT
    have hj := hg j
    generalize D.op j = o at hj
    cases o with
    | add =>
      refine ⟨_, hb.add hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (ιd F n) g + (D.right j).value (ιd F n) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | sub =>
      refine ⟨_, hb.sub hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (ιd F n) g - (D.right j).value (ιd F n) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | mul =>
      refine ⟨_, hb.mul hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (ιd F n) g * (D.right j).value (ιd F n) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | div =>
      obtain ⟨hy0, hmul⟩ := hj
      refine ⟨_, hb.div hx hy hy0, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (ιd F n) g / (D.right j).value (ιd F n) g :=
          eq_div_of_mul_eq hy0 hmul
        rw [hi, e]; exact Set.mem_insert _ _

/-- A correct circuit of writer B with division is a computation in the release's rational model
at the same cost. -/
theorem computes_of_circuit {n : ℕ} (D : BlindB.Circuit F n n n)
    (hD : D.Correct .withDivision) : Computes F n D.cost := by
  obtain ⟨g, hg, hout⟩ := hD
  obtain ⟨T, hb, hT⟩ := build_of_circuit D g hg D.cost le_rfl
  refine ⟨T, hb, fun q => ?_⟩
  have h := wire_mem (D.output q.1 q.2) g (rat_initial_subset hb) hT
  rw [hout q.1 q.2, ιd_productEntry] at h
  exact h

/-- A build with division in the release's rational model is read by a circuit of writer B with
division of the same cost. -/
theorem reads_of_build {n c : ℕ} {T : Set (RF F n)} (h : Build (initial F n) c T) :
    Reads (ιd F n) (fun _ => True) T c := by
  induction h with
  | nil =>
    apply reads_initial
    intro v hv
    rcases hv with ⟨a, rfl⟩ | ⟨x, rfl⟩
    · exact Or.inl ⟨a, (algebraMap_C a).symm⟩
    · exact Or.inr ⟨x, rfl⟩
  | add _ hx hy ih => exact reads_step ih hx hy .add trivial _ rfl
  | sub _ hx hy ih => exact reads_step ih hx hy .sub trivial _ rfl
  | mul _ hx hy ih => exact reads_step ih hx hy .mul trivial _ rfl
  | div _ hx hy hy0 ih => exact reads_step ih hx hy .div trivial _ ⟨hy0, div_mul_cancel₀ _ hy0⟩

/-- A computation of cost `c` in the release's rational model is a correct circuit of writer B
with division of cost exactly `c`. -/
theorem circuit_of_computes {n c : ℕ} (h : Computes F n c) :
    ∃ D : BlindB.Circuit F n n n, D.Correct .withDivision ∧ D.cost = c := by
  classical
  obtain ⟨T, hb, hout⟩ := h
  obtain ⟨D, g, hc, _, hg, hw⟩ := reads_of_build hb (Finset.univ.image (output F (n := n))) (by
    intro v hv
    obtain ⟨q, _, rfl⟩ := Finset.mem_image.mp (Finset.mem_coe.mp hv)
    exact hout q)
  choose w hw' using fun q : Pos n =>
    hw (output F q) (Finset.mem_image_of_mem _ (Finset.mem_univ q))
  refine ⟨{ D with output := fun i j => w (i, j) }, ⟨g, hg, fun i j => ?_⟩, hc⟩
  exact (hw' (i, j)).trans (ιd_productEntry i j).symm

/-- For `1 ≤ n ≤ N₀`, a bound `C₀·n^(τ₀+1)` is a bound `C₀·N₀^|τ₀+1|·N₀^|x| · n^x`. -/
theorem small_bound {n N0 : ℕ} (hn : 1 ≤ n) (hnN : n ≤ N0) {C0 τ0 x : ℝ} (hC0 : 0 ≤ C0) :
    C0 * (n : ℝ) ^ (τ0 + 1) ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |x| * (n : ℝ) ^ x := by
  have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
  have hnN' : (n : ℝ) ≤ N0 := by exact_mod_cast hnN
  have hn0 : (0 : ℝ) ≤ n := Nat.cast_nonneg _
  have ha : (n : ℝ) ^ (τ0 + 1) ≤ (N0 : ℝ) ^ |τ0 + 1| :=
    (Real.rpow_le_rpow_of_exponent_le hn1 (le_abs_self _)).trans
      (Real.rpow_le_rpow hn0 hnN' (abs_nonneg _))
  have e1 : (n : ℝ) ^ |x| * (n : ℝ) ^ (-|x|) = 1 := by
    rw [← Real.rpow_add (by linarith)]
    simp
  have e2 : (n : ℝ) ^ (-|x|) ≤ (n : ℝ) ^ x := Real.rpow_le_rpow_of_exponent_le hn1 (neg_abs_le x)
  have e3 : (n : ℝ) ^ |x| ≤ (N0 : ℝ) ^ |x| := Real.rpow_le_rpow hn0 hnN' (abs_nonneg _)
  have hc : 1 ≤ (N0 : ℝ) ^ |x| * (n : ℝ) ^ x :=
    calc (1 : ℝ) = (n : ℝ) ^ |x| * (n : ℝ) ^ (-|x|) := e1.symm
      _ ≤ (N0 : ℝ) ^ |x| * (n : ℝ) ^ x :=
          mul_le_mul e3 e2 (Real.rpow_nonneg hn0 _) (Real.rpow_nonneg (Nat.cast_nonneg _) _)
  have hA : 0 ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| :=
    mul_nonneg hC0 (Real.rpow_nonneg (Nat.cast_nonneg _) _)
  calc C0 * (n : ℝ) ^ (τ0 + 1) ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| := mul_le_mul_of_nonneg_left ha hC0
    _ = C0 * (N0 : ℝ) ^ |τ0 + 1| * 1 := (mul_one _).symm
    _ ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| * ((N0 : ℝ) ^ |x| * (n : ℝ) ^ x) :=
        mul_le_mul_of_nonneg_left hc hA
    _ = C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |x| * (n : ℝ) ^ x := by ring

/-- Writer B's square exponent with division equals the release's rational-model exponent. -/
theorem omegaDiv_eq (F : Type) [Field F] : BlindB.omega F 1 1 1 .withDivision = omega F := by
  have hval : omega F = 9 / 4 := omega_eq F
  have hpos : omega F ≠ 0 := by rw [hval]; norm_num
  unfold BlindB.omega
  unfold OAI.LinearAlgebra.MatrixExponent.omega at hpos ⊢
  obtain ⟨τ0, hτ0⟩ := nonempty_of_sInf_ne_zero hpos
  apply sInf_eq_of_approx hpos
  · intro s hs
    simp only [Set.mem_setOf_eq] at hs hτ0 ⊢
    obtain ⟨K, hK, N0, hN0, hbound⟩ := hs
    intro ε hε
    obtain ⟨C0, hC0, hsmall⟩ := hτ0 1 one_pos
    have hB : 0 ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |s + ε| :=
      mul_nonneg (mul_nonneg hC0.le (Real.rpow_nonneg (Nat.cast_nonneg _) _))
        (Real.rpow_nonneg (Nat.cast_nonneg _) _)
    refine ⟨K + C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |s + ε|,
      add_pos_of_pos_of_nonneg hK hB, fun n hn => ?_⟩
    have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
    have hpow : 0 ≤ (n : ℝ) ^ (s + ε) := Real.rpow_nonneg (Nat.cast_nonneg _) _
    by_cases hnN : N0 ≤ n
    · have h := hbound n hnN
      rw [side_one] at h
      obtain ⟨D, hD, hcost⟩ := h
      refine ⟨D.cost, computes_of_circuit D hD, ?_⟩
      calc (D.cost : ℝ) ≤ K * (n : ℝ) ^ s := hcost
        _ ≤ K * (n : ℝ) ^ (s + ε) :=
            mul_le_mul_of_nonneg_left (Real.rpow_le_rpow_of_exponent_le hn1 (by linarith)) hK.le
        _ ≤ (K + C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |s + ε|) * (n : ℝ) ^ (s + ε) := by
            rw [add_mul]; exact le_add_of_nonneg_right (mul_nonneg hB hpow)
    · obtain ⟨m, hcomp, hm⟩ := hsmall n hn
      refine ⟨m, hcomp, ?_⟩
      have h1 : (m : ℝ) ≤ C0 * (n : ℝ) ^ (τ0 + 1) := hm
      have h2 := small_bound (n := n) (N0 := N0) (C0 := C0) (τ0 := τ0) (x := s + ε) hn
        (by omega) hC0.le
      calc (m : ℝ) ≤ C0 * (n : ℝ) ^ (τ0 + 1) := h1
        _ ≤ C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |s + ε| * (n : ℝ) ^ (s + ε) := h2
        _ ≤ (K + C0 * (N0 : ℝ) ^ |τ0 + 1| * (N0 : ℝ) ^ |s + ε|) * (n : ℝ) ^ (s + ε) := by
            rw [add_mul]; exact le_add_of_nonneg_left (mul_nonneg hK.le hpow)
  · intro t ht ε hε
    simp only [Set.mem_setOf_eq] at ht ⊢
    obtain ⟨C, hC, hbound⟩ := ht ε hε
    refine ⟨C, hC, 1, le_rfl, fun n hn => ?_⟩
    obtain ⟨m, hcomp, hm⟩ := hbound n hn
    obtain ⟨D, hD, hDc⟩ := circuit_of_computes hcomp
    rw [side_one]
    exact ⟨D, hD, by rw [hDc]; exact hm⟩

/-- Writer B's square exponent with division is `9/4`, from the release's `omega_eq`. -/
theorem squareDiv : BlindB.SquareExponentWithDivision := by
  intro F _
  rw [omegaDiv_eq F]
  exact omega_eq F

end

end OmegaBridge.BDiv

namespace BlindB

/-- F2 (division, reported separately), writer B: the square exponent with division holds. -/
theorem square_exponent_with_division_holds : SquareExponentWithDivision :=
  OmegaBridge.BDiv.squareDiv

end BlindB
