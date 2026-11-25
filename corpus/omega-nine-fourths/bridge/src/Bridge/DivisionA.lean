import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import Bridge.BlindA
import Bridge.Common
import Bridge.BridgeA

/-!
# The ω = 9/4 bridge for writer A, with division (row F2, reported separately; cert-machine)

Writer A's `BlindA.SquareExponentWithDivision` (programs that may divide by a nonzero rational
function; correctness an identity of rational functions) from the release's
`OAI.LinearAlgebra.MatrixExponent.omega_eq : omega F = 9 / 4`, whose model
(`MatrixExponent/RationalCircuits.lean`) is the set-based model with a division rule tested in the
field of rational functions. The release's Comparator challenge does not pin this theorem; it is
reached here only through the solution module's closure.
-/

namespace OmegaBridge.ADiv

open BlindA
open OAI.LinearAlgebra.MatrixExponent
open OmegaBridge.A (runProg_append length_runProg cost_append getD_mem wellFormed_append
  wellFormed_of_append)

noncomputable section

variable {F : Type} [Field F] {σ : Type}

/-- `runRat` of `l ++ [o]`. -/
theorem runRat_append (l : List (Op F σ)) (o : Op F σ) :
    runRat F (l ++ [o]) = runRat F l ++
      [Op.value (fun s => toRatFn F σ (MvPolynomial.X s)) (fun c => toRatFn F σ (MvPolynomial.C c))
        (fun u w => u / w) (runRat F l) o] :=
  runProg_append _ _ _ l o

/-- A constant of `F` in the field of rational functions is the image of the constant polynomial. -/
theorem algebraMap_C (c : F) :
    algebraMap F (RatFn F σ) c = toRatFn F σ (MvPolynomial.C c) := by
  first
  | rfl
  | (rw [IsScalarTower.algebraMap_apply F (MvPolynomial σ F) (RatFn F σ),
      MvPolynomial.algebraMap_eq]; rfl)

/-- Reading an earlier result is unchanged by appending an instruction. -/
theorem runRat_getD_append (l : List (Op F σ)) (o : Op F σ) (j : ℕ) (hj : j < l.length) :
    (runRat F (l ++ [o])).getD j 0 = (runRat F l).getD j 0 := by
  have hlen : (runRat F l).length = l.length := length_runProg _ _ _ l
  rw [runRat_append, List.getD_append _ _ _ _ (by rw [hlen]; exact hj)]

/-- An executable well-formed `l ++ [o]` has an executable `l`, and a division `o` divides by a
nonzero earlier result. -/
theorem executable_of_append {l : List (Op F σ)} {o : Op F σ} (hw : WellFormed (l ++ [o]))
    (he : Executable F (l ++ [o])) :
    Executable F l ∧ ∀ i j : ℕ, o = Op.div i j → (runRat F l).getD j 0 ≠ 0 := by
  obtain ⟨hwl, hwo⟩ := wellFormed_of_append hw
  constructor
  · intro t ht i j hdiv
    have ht' : t < (l ++ [o]).length := by
      simp only [List.length_append, List.length_singleton]; omega
    have h1 := he t ht' i j (by rw [List.getElem_append, dif_pos ht]; exact hdiv)
    have hjt : j < t := hwl t ht j (by rw [hdiv]; simp [Op.args])
    rwa [runRat_getD_append l o j (by omega)] at h1
  · intro i j hdiv
    have ht' : l.length < (l ++ [o]).length := by simp
    have h1 := he l.length ht' i j (by
      rw [List.getElem_append, dif_neg (lt_irrefl _)]
      simp only [List.getElem_singleton]
      exact hdiv)
    have hjl : j < l.length := hwo j (by rw [hdiv]; simp [Op.args])
    rwa [runRat_getD_append l o j hjl] at h1

/-- Appending an instruction that divides only by a nonzero earlier result keeps a program
executable. -/
theorem executable_append {l : List (Op F σ)} {o : Op F σ} (hw : WellFormed l)
    (he : Executable F l) (ho : ∀ i ∈ o.args, i < l.length)
    (hdo : ∀ i j : ℕ, o = Op.div i j → (runRat F l).getD j 0 ≠ 0) :
    Executable F (l ++ [o]) := by
  intro t ht i j hdiv
  rw [List.getElem_append] at hdiv
  split_ifs at hdiv with h
  · have h1 := he t h i j hdiv
    have hjt : j < t := hw t h j (by rw [hdiv]; simp [Op.args])
    rwa [runRat_getD_append l o j (by omega)]
  · simp only [List.getElem_singleton] at hdiv
    have hjl : j < l.length := ho j (by rw [hdiv]; simp [Op.args])
    rw [runRat_getD_append l o j hjl]
    exact hdo i j hdiv

/-- Every set reached by a build with division contains the initial set. -/
theorem rat_initial_subset {K : Type*} [Field K] {S : Set K} {m : ℕ} {T : Set K}
    (h : Build S m T) : S ⊆ T := by
  induction h with
  | nil => exact subset_rfl
  | add _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | sub _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | mul _ _ _ ih => exact ih.trans (Set.subset_insert _ _)
  | div _ _ _ _ ih => exact ih.trans (Set.subset_insert _ _)

/-- The product entry of writer A, read in the field of rational functions, is the release's
output entry. -/
theorem toRatFn_prodEntry {n : ℕ} (i k : Fin n) :
    toRatFn F (MatVar n n n) (prodEntry F n n n i k) = output F (i, k) := by
  simp [prodEntry, xVar, yVar, output, input, toRatFn, map_sum, map_mul]

/-! ## From writer A's programs with division to the release's rational model -/

/-- A well-formed executable program of writer A gives a build with division in the release's
rational model of no greater cost that contains every result. -/
theorem build_of_prog {n : ℕ} :
    ∀ l : List (Op F (MatVar n n n)), WellFormed l → Executable F l →
      ∃ c, c ≤ cost l ∧ ∃ T, Build (initial F n) c T ∧ ∀ v ∈ runRat F l, v ∈ T := by
  intro l
  induction l using List.reverseRecOn with
  | nil =>
    intro _ _
    exact ⟨0, le_refl _, _, .nil, fun v hv => by simp [runRat, runProg] at hv⟩
  | append_singleton l o ih =>
    intro hw he
    obtain ⟨hwl, hwo⟩ := wellFormed_of_append hw
    obtain ⟨hel, heo⟩ := executable_of_append hw he
    obtain ⟨c, hc, T, hb, hT⟩ := ih hwl hel
    have hinit := rat_initial_subset hb
    have hlen : (runRat F l).length = l.length := length_runProg _ _ _ l
    have hget : ∀ i ∈ o.args, (runRat F l).getD i 0 ∈ T :=
      fun i hi => hT _ (getD_mem _ (by rw [hlen]; exact hwo i hi))
    rw [runRat_append, cost_append]
    have hlast : ∀ {x : RatFn F (MatVar n n n)} {T' : Set (RatFn F (MatVar n n n))},
        T ⊆ T' → x ∈ T' → ∀ v ∈ runRat F l ++ [x], v ∈ T' := by
      intro x T' hTT' hx v hv
      rcases List.mem_append.mp hv with hv | hv
      · exact hTT' (hT v hv)
      · rw [List.mem_singleton] at hv; rw [hv]; exact hx
    cases o with
    | input s =>
      exact ⟨c, Nat.le_add_right_of_le hc, T, hb, hlast subset_rfl
        (hinit (Set.mem_union_right _ ⟨s, rfl⟩))⟩
    | const a =>
      exact ⟨c, Nat.le_add_right_of_le hc, T, hb, hlast subset_rfl
        (hinit (Set.mem_union_left _ ⟨a, algebraMap_C a⟩))⟩
    | smul a i =>
      have hi := hget i (by simp [Op.args])
      have ha : toRatFn F (MatVar n n n) (MvPolynomial.C a) ∈ T :=
        hinit (Set.mem_union_left _ ⟨a, algebraMap_C a⟩)
      exact ⟨c + 1, Nat.add_le_add_right hc _, _, hb.mul ha hi,
        hlast (Set.subset_insert _ _) (Set.mem_insert _ _)⟩
    | add i j =>
      exact ⟨c + 1, Nat.add_le_add_right hc _, _,
        hb.add (hget i (by simp [Op.args])) (hget j (by simp [Op.args])),
        hlast (Set.subset_insert _ _) (Set.mem_insert _ _)⟩
    | sub i j =>
      exact ⟨c + 1, Nat.add_le_add_right hc _, _,
        hb.sub (hget i (by simp [Op.args])) (hget j (by simp [Op.args])),
        hlast (Set.subset_insert _ _) (Set.mem_insert _ _)⟩
    | mul i j =>
      exact ⟨c + 1, Nat.add_le_add_right hc _, _,
        hb.mul (hget i (by simp [Op.args])) (hget j (by simp [Op.args])),
        hlast (Set.subset_insert _ _) (Set.mem_insert _ _)⟩
    | div i j =>
      exact ⟨c + 1, Nat.add_le_add_right hc _, _,
        hb.div (hget i (by simp [Op.args])) (hget j (by simp [Op.args])) (heo i j rfl),
        hlast (Set.subset_insert _ _) (Set.mem_insert _ _)⟩

/-- A correct program of writer A with division gives a computation in the release's rational
model of no greater cost. -/
theorem computes_of_prog {n : ℕ} {l : List (Op F (MatVar n n n))}
    (h : IsMatMulProgramDiv F n n n l) : ∃ c, c ≤ cost l ∧ Computes F n c := by
  obtain ⟨hw, he, hout⟩ := h
  obtain ⟨c, hc, T, hb, hT⟩ := build_of_prog l hw he
  refine ⟨c, hc, T, hb, fun q => ?_⟩
  have := hT _ (hout q.1 q.2)
  rwa [toRatFn_prodEntry] at this

/-! ## From the release's rational model to writer A's programs with division -/

/-- The reading invariant: every finite subset of `T` is read by a well-formed executable program
of cost at most `3c + |s|`. -/
def ReadsA (n : ℕ) (T : Set (RatFn F (MatVar n n n))) (c : ℕ) : Prop :=
  ∀ s : Finset (RatFn F (MatVar n n n)), (↑s : Set _) ⊆ T →
    ∃ l : List (Op F (MatVar n n n)), WellFormed l ∧ Executable F l ∧ cost l ≤ 3 * c + s.card ∧
      ∀ v ∈ s, v ∈ runRat F l

/-- The initial set (constants cost 1, inputs 0) is read at cost at most its size. -/
theorem reads_initial {n : ℕ} : ReadsA (F := F) n (initial F n) 0 := by
  classical
  intro s hs
  induction s using Finset.induction_on with
  | empty =>
    exact ⟨[], fun t ht => by simp at ht, fun t ht => by simp at ht, by simp [cost],
      fun v hv => by simp at hv⟩
  | insert a s ha ih =>
    obtain ⟨l, hw, he, hc, hmem⟩ :=
      ih (fun v hv => hs (by simp only [Finset.coe_insert]; exact Set.mem_insert_of_mem _ hv))
    have haI : a ∈ initial F n := hs (by simp)
    obtain ⟨o, ho_args, ho_cost, ho_div, ho_val⟩ : ∃ o : Op F (MatVar n n n), o.args = [] ∧
        o.cost ≤ 1 ∧ (∀ i j : ℕ, o ≠ Op.div i j) ∧
        ∀ v : List (RatFn F (MatVar n n n)),
          Op.value (fun s => toRatFn F (MatVar n n n) (MvPolynomial.X s))
            (fun c => toRatFn F (MatVar n n n) (MvPolynomial.C c)) (fun u w => u / w) v o = a := by
      rcases haI with ⟨c, rfl⟩ | ⟨x, rfl⟩
      · exact ⟨.const c, rfl, le_refl _, fun _ _ h => (by cases h), fun _ => (algebraMap_C c).symm⟩
      · exact ⟨.input x, rfl, zero_le_one, fun _ _ h => (by cases h), fun _ => rfl⟩
    refine ⟨l ++ [o], wellFormed_append hw (by simp [ho_args]),
      executable_append hw he (by simp [ho_args]) (fun i j h => absurd h (ho_div i j)), ?_, ?_⟩
    · rw [cost_append, Finset.card_insert_of_notMem ha]
      omega
    · intro v hv
      rw [runRat_append, ho_val]
      rcases Finset.mem_insert.mp hv with rfl | hv
      · exact List.mem_append_right _ (List.mem_singleton_self _)
      · exact List.mem_append_left _ (hmem v hv)

/-- One step `op x y` of a build is one more instruction of writer A; a division step divides by
the nonzero `y`. -/
theorem reads_step {n c : ℕ} {T : Set (RatFn F (MatVar n n n))} (ih : ReadsA n T c)
    {x y : RatFn F (MatVar n n n)} (hx : x ∈ T) (hy : y ∈ T)
    (op : RatFn F (MatVar n n n) → RatFn F (MatVar n n n) → RatFn F (MatVar n n n))
    (mk : ℕ → ℕ → Op F (MatVar n n n)) (hargs : ∀ i j, (mk i j).args = [i, j])
    (hcost : ∀ i j, (mk i j).cost = 1)
    (hexec : ∀ i j a b, mk i j = Op.div a b → b = j ∧ y ≠ 0)
    (hval : ∀ i j (v : List (RatFn F (MatVar n n n))),
      Op.value (fun s => toRatFn F (MatVar n n n) (MvPolynomial.X s))
        (fun c => toRatFn F (MatVar n n n) (MvPolynomial.C c)) (fun u w => u / w) v (mk i j)
        = op (v.getD i 0) (v.getD j 0)) :
    ReadsA n (insert (op x y) T) (c + 1) := by
  classical
  intro s hs
  let need : Finset (RatFn F (MatVar n n n)) := insert x (insert y (s.erase (op x y)))
  have hneed : (↑need : Set _) ⊆ T := by
    intro v hv
    simp only [need, Finset.coe_insert, Finset.coe_erase, Set.mem_insert_iff, Set.mem_diff,
      Finset.mem_coe, Set.mem_singleton_iff] at hv
    rcases hv with rfl | rfl | ⟨hin, hne⟩
    · exact hx
    · exact hy
    · exact (Set.mem_insert_iff.mp (hs (Finset.mem_coe.mpr hin))).resolve_left hne
  obtain ⟨l, hw, he, hc, hmem⟩ := ih need hneed
  have hlen : (runRat F l).length = l.length := length_runProg _ _ _ l
  obtain ⟨ix, hix, hgx⟩ := List.mem_iff_getElem.mp (hmem x (by simp [need]))
  obtain ⟨iy, hiy, hgy⟩ := List.mem_iff_getElem.mp (hmem y (by simp [need]))
  have hcard : need.card ≤ s.card + 2 := by
    have h1 := Finset.card_insert_le x (insert y (s.erase (op x y)))
    have h2 := Finset.card_insert_le y (s.erase (op x y))
    have h3 := Finset.card_erase_le (s := s) (a := op x y)
    simp only [need]
    omega
  have hargs' : ∀ i ∈ (mk ix iy).args, i < l.length := by
    rw [hargs]
    intro i hi
    simp at hi
    rcases hi with rfl | rfl <;> omega
  refine ⟨l ++ [mk ix iy], wellFormed_append hw hargs', executable_append hw he hargs' ?_, ?_, ?_⟩
  · intro a b hab
    obtain ⟨rfl, hy0⟩ := hexec ix iy a b hab
    rw [List.getD_eq_getElem _ _ hiy, hgy]
    exact hy0
  · rw [cost_append, hcost]
    omega
  · intro v hv
    rw [runRat_append, hval, List.getD_eq_getElem _ _ hix, List.getD_eq_getElem _ _ hiy, hgx, hgy]
    by_cases he' : v = op x y
    · rw [he']
      exact List.mem_append_right _ (List.mem_singleton_self _)
    · exact List.mem_append_left _ (hmem v (by simp [need, he', hv]))

/-- A build with division in the release's rational model is read by a program of writer A of cost
at most `3c + |s|`. -/
theorem reads_of_build {n c : ℕ} {T : Set (RatFn F (MatVar n n n))}
    (h : Build (initial F n) c T) : ReadsA n T c := by
  induction h with
  | nil => exact reads_initial
  | add _ hx hy ih =>
    exact reads_step ih hx hy (· + ·) Op.add (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)
  | sub _ hx hy ih =>
    exact reads_step ih hx hy (· - ·) Op.sub (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)
  | mul _ hx hy ih =>
    exact reads_step ih hx hy (· * ·) Op.mul (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)
  | div _ hx hy hy0 ih =>
    exact reads_step ih hx hy (· / ·) Op.div (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h; exact ⟨rfl, hy0⟩) (fun _ _ _ => rfl)

/-- A computation of cost `c` in the release's rational model gives a correct program of writer A
with division of cost at most `3c + n²`. -/
theorem prog_of_computes {n c : ℕ} (h : Computes F n c) :
    ∃ l : List (Op F (MatVar n n n)), IsMatMulProgramDiv F n n n l ∧ cost l ≤ 3 * c + n * n := by
  classical
  obtain ⟨T, hb, hout⟩ := h
  let s : Finset (RatFn F (MatVar n n n)) := Finset.univ.image (output F (n := n))
  obtain ⟨l, hw, he, hc, hmem⟩ := reads_of_build hb s (by
    intro v hv
    obtain ⟨q, _, rfl⟩ := Finset.mem_image.mp (Finset.mem_coe.mp hv)
    exact hout q)
  refine ⟨l, ⟨hw, he, fun i k => ?_⟩, ?_⟩
  · rw [toRatFn_prodEntry]
    exact hmem _ (Finset.mem_image_of_mem _ (Finset.mem_univ (i, k)))
  · have hs : s.card ≤ n * n := by
      calc s.card ≤ (Finset.univ : Finset (Pos n)).card := Finset.card_image_le
        _ = n * n := by simp
    omega

/-! ## The exponent -/

/-- Writer A's square exponent with division equals the release's rational-model exponent. -/
theorem omegaSquareDiv_eq (F : Type) [Field F] : omegaSquareDiv F = omega F := by
  have hval : omega F = 9 / 4 := omega_eq F
  have hpos : omega F ≠ 0 := by rw [hval]; norm_num
  have hval' : sInf {s : ℝ | Admissible F s} = 9 / 4 := hval
  unfold omegaSquareDiv
  unfold OAI.LinearAlgebra.MatrixExponent.omega at hpos ⊢
  apply sInf_eq_of_approx hpos
  · intro s hs
    simp only [Set.mem_setOf_eq] at hs ⊢
    obtain ⟨C, hC⟩ := hs
    intro ε hε
    refine ⟨|C| + 1, by positivity, fun n hn => ?_⟩
    obtain ⟨prog, hprog, hcost⟩ := hC n hn
    obtain ⟨m, hm, hcomp⟩ := computes_of_prog hprog
    refine ⟨m, hcomp, ?_⟩
    have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
    have hNs0 : 0 ≤ (n : ℝ) ^ s := Real.rpow_nonneg (Nat.cast_nonneg _) _
    calc (m : ℝ) ≤ cost prog := by exact_mod_cast hm
      _ ≤ C * (n : ℝ) ^ s := hcost
      _ ≤ (|C| + 1) * (n : ℝ) ^ s :=
          mul_le_mul_of_nonneg_right ((le_abs_self C).trans (by linarith)) hNs0
      _ ≤ (|C| + 1) * (n : ℝ) ^ (s + ε) :=
          mul_le_mul_of_nonneg_left (Real.rpow_le_rpow_of_exponent_le hn1 (by linarith))
            (by positivity)
  · intro t ht ε hε
    have h94 : (9 : ℝ) / 4 ≤ t := by
      rw [← hval']
      exact sInf_le_of_mem hpos ht
    simp only [Set.mem_setOf_eq] at ht ⊢
    obtain ⟨C, hC, hbound⟩ := ht ε hε
    refine ⟨3 * C + 1, fun n hn => ?_⟩
    obtain ⟨m, hcomp, hm⟩ := hbound n hn
    obtain ⟨prog, hprog, hcost⟩ := prog_of_computes hcomp
    refine ⟨prog, hprog, ?_⟩
    have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
    have hsq : (n : ℝ) * n ≤ (n : ℝ) ^ (t + ε) := by
      calc (n : ℝ) * n = (n : ℝ) ^ (2 : ℝ) := by
            rw [show (2 : ℝ) = ((2 : ℕ) : ℝ) by norm_num, Real.rpow_natCast]; ring
        _ ≤ (n : ℝ) ^ (t + ε) := Real.rpow_le_rpow_of_exponent_le hn1 (by linarith)
    have hcost' : (cost prog : ℝ) ≤ 3 * (m : ℝ) + (n : ℝ) * n := by exact_mod_cast hcost
    calc (cost prog : ℝ) ≤ 3 * (m : ℝ) + (n : ℝ) * n := hcost'
      _ ≤ 3 * (C * (n : ℝ) ^ (t + ε)) + (n : ℝ) ^ (t + ε) := by linarith
      _ = (3 * C + 1) * (n : ℝ) ^ (t + ε) := by ring

/-- Writer A's square exponent with division is `9/4`, from the release's `omega_eq`. -/
theorem squareDiv : BlindA.SquareExponentWithDivision := by
  intro F _
  rw [omegaSquareDiv_eq F]
  exact omega_eq F

end

end OmegaBridge.ADiv

namespace BlindA

/-- F2 (division, reported separately), writer A: the square exponent with division holds. -/
theorem square_exponent_with_division_holds : SquareExponentWithDivision :=
  OmegaBridge.ADiv.squareDiv

end BlindA
