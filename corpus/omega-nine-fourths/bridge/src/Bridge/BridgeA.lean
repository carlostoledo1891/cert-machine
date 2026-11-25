import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import Bridge.BlindA
import Bridge.Common

/-!
# The ω = 9/4 bridge for writer A (row F2; cert-machine, 2026-11-25)

Proves writer A's `BlindA.SquareExponent`, `BlindA.DualExponent` and `BlindA.RectangularExponent`
from the release's three theorems (`square_exponent`, `dual_exponent`, `rectangular_exponent`) and
its public lemmas (`formalOmega_eq_integral`, the set-based model `MatrixExponent.Integral`).

The differences bridged, each by a lemma below:
* constants: writer A charges 1 for a constant (and for a scalar multiplication); the release's
  set-based model has every constant and input for free. A program of writer A becomes a build of
  no greater cost (`computes_of_prog`); a build of cost `m` becomes a program of cost at most
  `3m + rows·columns` (`prog_of_computes`), and `rows·columns ≤ n^(a+c) ≤ n^τ` for every admissible
  `τ` (the closed form is at least `a + c`).
* outputs: writer A asks that each entry occur among the results; the release names a register.
* rounding: writer A rounds `n^w` down, the release up; padding (`int_computes_pad`) and a change
  of scale `n = kN` (`exists_scale`) carry one to the other.
* the `O(·)` form: writer A's `∃ C ∀ n ≥ 1, cost ≤ C n^s` against the release's
  `∀ ε > 0 ∃ C > 0 ∀ N ≥ 1, cost ≤ C N^(τ+ε)`; the two sets have the same infimum
  (`sInf_eq_of_approx`).
* weights: writer A's `omegaRect F a b c` (rows `a`, inner `b`, columns `c`) is the release's
  `formalOmega F b c a` (`omegaRect_eq`); the closed form is symmetric (`fml_cycle`, `fml_swap`).
-/

namespace OmegaBridge.A

open BlindA
open OAI.LinearAlgebra.SpectralBooks
open OAI.LinearAlgebra.MatrixExponent

noncomputable section

variable {F : Type} [Field F] {σ : Type}

/-! ## Writer A's result sequence, one instruction at a time -/

/-- Running `l ++ [o]` runs `l` and then appends the value of `o`. -/
theorem runProg_append {R : Type} [CommRing R] (x : σ → R) (cst : F → R) (dv : R → R → R)
    (l : List (Op F σ)) (o : Op F σ) :
    runProg x cst dv (l ++ [o]) =
      runProg x cst dv l ++ [Op.value x cst dv (runProg x cst dv l) o] := by
  simp only [runProg, List.foldl_append, List.foldl_cons, List.foldl_nil]

/-- The result sequence has one entry per instruction. -/
theorem length_runProg {R : Type} [CommRing R] (x : σ → R) (cst : F → R) (dv : R → R → R)
    (l : List (Op F σ)) : (runProg x cst dv l).length = l.length := by
  induction l using List.reverseRecOn with
  | nil => rfl
  | append_singleton l o ih => simp [runProg_append, ih]

/-- `runPoly` of `l ++ [o]`. -/
theorem runPoly_append (l : List (Op F σ)) (o : Op F σ) :
    runPoly F (l ++ [o]) = runPoly F l ++
      [Op.value (fun s => MvPolynomial.X s) (fun c => MvPolynomial.C c) (fun _ _ => 0)
        (runPoly F l) o] :=
  runProg_append _ _ _ l o

/-- The cost of `l ++ [o]`. -/
theorem cost_append (l : List (Op F σ)) (o : Op F σ) : cost (l ++ [o]) = cost l + o.cost := by
  simp [cost]

/-- An entry read by index is a member of the list. -/
theorem getD_mem {α : Type} {l : List α} {i : ℕ} (d : α) (h : i < l.length) : l.getD i d ∈ l := by
  rw [List.getD_eq_getElem _ _ h]
  exact List.getElem_mem h

/-- Appending one instruction whose arguments are earlier results keeps a program well formed. -/
theorem wellFormed_append {l : List (Op F σ)} {o : Op F σ} (hl : WellFormed l)
    (ho : ∀ i ∈ o.args, i < l.length) : WellFormed (l ++ [o]) := by
  intro t ht i hi
  rw [List.getElem_append] at hi
  split_ifs at hi with h
  · exact hl t h i hi
  · simp only [List.getElem_singleton] at hi
    have h1 := ho i hi
    simp only [List.length_append, List.length_singleton] at ht
    omega

/-- A well-formed `l ++ [o]` has a well-formed `l`, and `o` reads earlier results only. -/
theorem wellFormed_of_append {l : List (Op F σ)} {o : Op F σ} (h : WellFormed (l ++ [o])) :
    WellFormed l ∧ ∀ i ∈ o.args, i < l.length := by
  constructor
  · intro t ht i hi
    have ht' : t < (l ++ [o]).length := by
      simp only [List.length_append, List.length_singleton]; omega
    have := h t ht' i
    rw [List.getElem_append, dif_pos ht] at this
    exact this hi
  · intro i hi
    have ht' : l.length < (l ++ [o]).length := by simp
    have := h l.length ht' i
    rw [List.getElem_append, dif_neg (lt_irrefl _)] at this
    simp only [List.getElem_singleton] at this
    exact this hi

/-- Division-freeness of `l ++ [o]`. -/
theorem divisionFree_append {l : List (Op F σ)} {o : Op F σ} (hl : DivisionFree l)
    (ho : ∀ i j : ℕ, o ≠ Op.div i j) : DivisionFree (l ++ [o]) := by
  intro o' ho' i j
  rcases List.mem_append.mp ho' with h | h
  · exact hl o' h i j
  · rw [List.mem_singleton] at h
    subst h
    exact ho i j

/-- And its converse. -/
theorem divisionFree_of_append {l : List (Op F σ)} {o : Op F σ} (h : DivisionFree (l ++ [o])) :
    DivisionFree l ∧ ∀ i j : ℕ, o ≠ Op.div i j :=
  ⟨fun o' ho' => h o' (List.mem_append_left _ ho'),
    fun i j => h o (List.mem_append_right _ (List.mem_singleton_self _)) i j⟩

/-! ## From writer A's programs to the release's set-based model -/

/-- A well-formed division-free program of writer A gives a division-free build in the release's
set-based model (rows `m`, columns `p`, inner `n`) of no greater cost that contains every result:
constants and inputs are free there, a scalar multiplication is a product with a constant. -/
theorem build_of_prog {m n p : ℕ} :
    ∀ l : List (Op F (MatVar m n p)), WellFormed l → DivisionFree l →
      ∃ c, c ≤ cost l ∧ ∃ T, Integral.Build (Integral.initial F m p n) c T ∧
        ∀ v ∈ runPoly F l, v ∈ T := by
  intro l
  induction l using List.reverseRecOn with
  | nil =>
    intro _ _
    exact ⟨0, le_refl _, _, .nil, fun v hv => by simp [runPoly, runProg] at hv⟩
  | append_singleton l o ih =>
    intro hw hd
    obtain ⟨hwl, hwo⟩ := wellFormed_of_append hw
    obtain ⟨hdl, hdo⟩ := divisionFree_of_append hd
    obtain ⟨c, hc, T, hb, hT⟩ := ih hwl hdl
    have hinit := int_initial_subset hb
    have hlen : (runPoly F l).length = l.length := length_runProg _ _ _ l
    have hget : ∀ i ∈ o.args, (runPoly F l).getD i 0 ∈ T :=
      fun i hi => hT _ (getD_mem _ (by rw [hlen]; exact hwo i hi))
    rw [runPoly_append, cost_append]
    cases o with
    | input s =>
      refine ⟨c, Nat.le_add_right_of_le hc, T, hb, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact hT v hv
      · rw [List.mem_singleton] at hv
        subst hv
        exact hinit (Set.mem_union_right _ ⟨s, rfl⟩)
    | const a =>
      refine ⟨c, Nat.le_add_right_of_le hc, T, hb, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact hT v hv
      · rw [List.mem_singleton] at hv
        subst hv
        exact hinit (Set.mem_union_left _ ⟨a, rfl⟩)
    | smul a i =>
      have hi := hget i (by simp [Op.args])
      have ha : (MvPolynomial.C a : MvPolynomial (MatVar m n p) F) ∈ T :=
        hinit (Set.mem_union_left _ ⟨a, rfl⟩)
      refine ⟨c + 1, Nat.add_le_add_right hc _, _, hb.mul ha hi, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact Set.mem_insert_of_mem _ (hT v hv)
      · rw [List.mem_singleton] at hv
        subst hv
        exact Set.mem_insert _ _
    | add i j =>
      have hi := hget i (by simp [Op.args])
      have hj := hget j (by simp [Op.args])
      refine ⟨c + 1, Nat.add_le_add_right hc _, _, hb.add hi hj, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact Set.mem_insert_of_mem _ (hT v hv)
      · rw [List.mem_singleton] at hv
        subst hv
        exact Set.mem_insert _ _
    | sub i j =>
      have hi := hget i (by simp [Op.args])
      have hj := hget j (by simp [Op.args])
      refine ⟨c + 1, Nat.add_le_add_right hc _, _, hb.sub hi hj, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact Set.mem_insert_of_mem _ (hT v hv)
      · rw [List.mem_singleton] at hv
        subst hv
        exact Set.mem_insert _ _
    | mul i j =>
      have hi := hget i (by simp [Op.args])
      have hj := hget j (by simp [Op.args])
      refine ⟨c + 1, Nat.add_le_add_right hc _, _, hb.mul hi hj, fun v hv => ?_⟩
      rcases List.mem_append.mp hv with hv | hv
      · exact Set.mem_insert_of_mem _ (hT v hv)
      · rw [List.mem_singleton] at hv
        subst hv
        exact Set.mem_insert _ _
    | div i j => exact absurd rfl (hdo i j)

/-- A correct division-free program of writer A for an `m × n` by `n × p` product gives a
computation in the release's set-based model (rows `m`, columns `p`, inner `n`) of no greater
cost. Writer A's "entry occurs among the results" is the release model's "entry is in the set". -/
theorem computes_of_prog {m n p : ℕ} {l : List (Op F (MatVar m n p))}
    (h : IsMatMulProgram F m n p l) : ∃ c, c ≤ cost l ∧ Integral.Computes F m p n c := by
  obtain ⟨hw, hd, hout⟩ := h
  obtain ⟨c, hc, T, hb, hT⟩ := build_of_prog l hw hd
  exact ⟨c, hc, T, hb, fun q => hT _ (hout q.1 q.2)⟩

/-! ## From the release's set-based model to writer A's programs -/

/-- Every finite set of initially available polynomials (constants and inputs) is loaded by a
well-formed division-free program of writer A of cost at most its size (a constant costs 1, an
input 0). -/
theorem load_initial {m n p : ℕ} (s : Finset (Integral.Poly F m p n))
    (hs : (↑s : Set _) ⊆ Integral.initial F m p n) :
    ∃ l : List (Op F (MatVar m n p)), WellFormed l ∧ DivisionFree l ∧ cost l ≤ 3 * 0 + s.card ∧
      ∀ v ∈ s, v ∈ runPoly F l := by
  classical
  induction s using Finset.induction_on with
  | empty =>
    exact ⟨[], fun t ht => by simp at ht, fun o ho => by simp at ho, by simp [cost],
      fun v hv => by simp at hv⟩
  | insert a s ha ih =>
    obtain ⟨l, hw, hd, hc, hmem⟩ :=
      ih (fun v hv => hs (by simp only [Finset.coe_insert]; exact Set.mem_insert_of_mem _ hv))
    have haI : a ∈ Integral.initial F m p n := hs (by simp)
    obtain ⟨o, ho_args, ho_cost, ho_div, ho_val⟩ : ∃ o : Op F (MatVar m n p), o.args = [] ∧
        o.cost ≤ 1 ∧ (∀ i j : ℕ, o ≠ Op.div i j) ∧
        ∀ v : List (MvPolynomial (MatVar m n p) F),
          Op.value (fun s => MvPolynomial.X s) (fun c => MvPolynomial.C c) (fun _ _ => 0) v o
            = a := by
      rcases haI with ⟨c, rfl⟩ | ⟨x, rfl⟩
      · exact ⟨.const c, rfl, le_refl _, fun _ _ h => (by cases h), fun _ => rfl⟩
      · exact ⟨.input x, rfl, zero_le_one, fun _ _ h => (by cases h), fun _ => rfl⟩
    refine ⟨l ++ [o], wellFormed_append hw (by simp [ho_args]), divisionFree_append hd ho_div,
      ?_, ?_⟩
    · rw [cost_append, Finset.card_insert_of_notMem ha]
      omega
    · intro v hv
      rw [runPoly_append, ho_val]
      rcases Finset.mem_insert.mp hv with rfl | hv
      · exact List.mem_append_right _ (List.mem_singleton_self _)
      · exact List.mem_append_left _ (hmem v hv)

/-- One step of a build, `op x y` added at cost 1, is one more instruction of writer A, which
reads the two earlier results `x` and `y` by index. -/
theorem read_step {m n p c : ℕ} {T : Set (Integral.Poly F m p n)}
    (ih : ∀ s : Finset (Integral.Poly F m p n), (↑s : Set _) ⊆ T →
      ∃ l : List (Op F (MatVar m n p)), WellFormed l ∧ DivisionFree l ∧ cost l ≤ 3 * c + s.card ∧
        ∀ v ∈ s, v ∈ runPoly F l)
    {x y : Integral.Poly F m p n} (hx : x ∈ T) (hy : y ∈ T)
    (op : Integral.Poly F m p n → Integral.Poly F m p n → Integral.Poly F m p n)
    (mk : ℕ → ℕ → Op F (MatVar m n p)) (hargs : ∀ i j, (mk i j).args = [i, j])
    (hcost : ∀ i j, (mk i j).cost = 1) (hdiv : ∀ i j a b, mk i j ≠ Op.div a b)
    (hval : ∀ i j (v : List (MvPolynomial (MatVar m n p) F)),
      Op.value (fun s => MvPolynomial.X s) (fun c => MvPolynomial.C c) (fun _ _ => 0) v (mk i j)
        = op (v.getD i 0) (v.getD j 0)) :
    ∀ s : Finset (Integral.Poly F m p n), (↑s : Set _) ⊆ insert (op x y) T →
      ∃ l : List (Op F (MatVar m n p)), WellFormed l ∧ DivisionFree l ∧
        cost l ≤ 3 * (c + 1) + s.card ∧ ∀ v ∈ s, v ∈ runPoly F l := by
  classical
  intro s hs
  let need : Finset (Integral.Poly F m p n) := insert x (insert y (s.erase (op x y)))
  have hneed : (↑need : Set _) ⊆ T := by
    intro v hv
    simp only [need, Finset.coe_insert, Finset.coe_erase, Set.mem_insert_iff, Set.mem_diff,
      Finset.mem_coe, Set.mem_singleton_iff] at hv
    rcases hv with rfl | rfl | ⟨hin, hne⟩
    · exact hx
    · exact hy
    · exact (Set.mem_insert_iff.mp (hs hin)).resolve_left hne
  obtain ⟨l, hw, hd, hc, hmem⟩ := ih need hneed
  have hlen : (runPoly F l).length = l.length := length_runProg _ _ _ l
  obtain ⟨ix, hix, hgx⟩ := List.mem_iff_getElem.mp (hmem x (by simp [need]))
  obtain ⟨iy, hiy, hgy⟩ := List.mem_iff_getElem.mp (hmem y (by simp [need]))
  have hcard : need.card ≤ s.card + 2 := by
    have h1 := Finset.card_insert_le x (insert y (s.erase (op x y)))
    have h2 := Finset.card_insert_le y (s.erase (op x y))
    have h3 := Finset.card_erase_le (s := s) (a := op x y)
    simp only [need]
    omega
  refine ⟨l ++ [mk ix iy], wellFormed_append hw ?_, divisionFree_append hd (hdiv ix iy), ?_, ?_⟩
  · rw [hargs]
    intro i hi
    simp only [List.mem_cons, List.not_mem_nil, or_false] at hi
    rcases hi with rfl | rfl <;> omega
  · rw [cost_append, hcost]
    omega
  · intro v hv
    rw [runPoly_append, hval, List.getD_eq_getElem _ _ hix, List.getD_eq_getElem _ _ hiy, hgx, hgy]
    by_cases he : v = op x y
    · subst he
      exact List.mem_append_right _ (List.mem_singleton_self _)
    · exact List.mem_append_left _ (hmem v (by simp [need, he, hv]))

/-- A division-free build of cost `c` in the release's set-based model can be read by a program of
writer A of cost at most `3c + |s|`, for every finite set `s` of its polynomials. -/
theorem prog_of_build {m n p c : ℕ} {T : Set (Integral.Poly F m p n)}
    (h : Integral.Build (Integral.initial F m p n) c T) :
    ∀ s : Finset (Integral.Poly F m p n), (↑s : Set _) ⊆ T →
      ∃ l : List (Op F (MatVar m n p)), WellFormed l ∧ DivisionFree l ∧ cost l ≤ 3 * c + s.card ∧
        ∀ v ∈ s, v ∈ runPoly F l := by
  induction h with
  | nil => exact load_initial
  | add _ hx hy ih =>
    exact read_step ih hx hy (· + ·) Op.add (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)
  | sub _ hx hy ih =>
    exact read_step ih hx hy (· - ·) Op.sub (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)
  | mul _ hx hy ih =>
    exact read_step ih hx hy (· * ·) Op.mul (fun _ _ => rfl) (fun _ _ => rfl)
      (fun _ _ _ _ h => by cases h) (fun _ _ _ => rfl)

/-- A computation of cost `c` in the release's set-based model (rows `m`, columns `p`, inner `n`)
gives a correct division-free program of writer A of cost at most `3c + m·p`: the `m·p` pays for
constants that the release loads for free. -/
theorem prog_of_computes {m n p c : ℕ} (h : Integral.Computes F m p n c) :
    ∃ l : List (Op F (MatVar m n p)), IsMatMulProgram F m n p l ∧ cost l ≤ 3 * c + m * p := by
  classical
  obtain ⟨T, hb, hout⟩ := h
  let s : Finset (Integral.Poly F m p n) :=
    Finset.univ.image (Integral.output F (i := m) (j := p) (k := n))
  obtain ⟨l, hw, hd, hc, hmem⟩ := prog_of_build hb s (by
    intro v hv
    obtain ⟨q, _, rfl⟩ := Finset.mem_image.mp (Finset.mem_coe.mp hv)
    exact hout q)
  have hentry : ∀ (i : Fin m) (k : Fin p), prodEntry F m n p i k = Integral.output F (i, k) :=
    fun _ _ => rfl
  refine ⟨l, ⟨hw, hd, fun i k => ?_⟩, ?_⟩
  · rw [hentry]
    exact hmem _ (Finset.mem_image_of_mem _ (Finset.mem_univ (i, k)))
  · have hs : s.card ≤ m * p := by
      calc s.card ≤ (Finset.univ : Finset (Integral.Pos m p)).card := Finset.card_image_le
        _ = m * p := by simp
    omega

/-! ## The exponents -/

/-- Writer A's rectangular exponent (rows `a`, inner `b`, columns `c`, floors, constants charged)
equals the release's `formalOmega F b c a` (inner, columns, rows; ceilings; constants free), for
`a > 0` and `b, c ≥ 0`. -/
theorem omegaRect_eq (F : Type) [Field F] {a b c : ℝ} (ha : 0 < a) (hb : 0 ≤ b) (hc : 0 ≤ c) :
    omegaRect F a b c = formalOmega F b c a := by
  have hval : formalOmega F b c a = fml b c a := formalOmega_eq_fml_nonneg F hb hc ha.le
  have hge : a + c ≤ formalOmega F b c a := by
    rw [hval, ← fml_cycle a b c]
    exact fml_ge ha.le hb hc
  have hpos : formalOmega F b c a ≠ 0 := (by linarith : 0 < formalOmega F b c a).ne'
  rw [formalOmega_eq_integral F b c a] at hge hpos ⊢
  unfold omegaRect
  unfold Integral.exponent at hge hpos ⊢
  apply sInf_eq_of_approx hpos
  · -- writer A's exponents are the release's: run writer A at scale `kN` and pad down.
    intro s hs
    simp only [Set.mem_setOf_eq] at hs ⊢
    obtain ⟨C, hC⟩ := hs
    obtain ⟨k, hk, hscale⟩ := exists_scale ha.le hb hc
    intro ε hε
    refine ⟨(|C| + 1) * (k : ℝ) ^ s, scaled_const_pos C s hk, fun N hN => ?_⟩
    obtain ⟨prog, hprog, hcost⟩ :=
      hC (k * N) (Nat.one_le_iff_ne_zero.mpr (Nat.mul_ne_zero hk.ne' (Nat.pos_iff_ne_zero.mp hN)))
    obtain ⟨m, hm, hcomp⟩ := computes_of_prog hprog
    obtain ⟨h1, h2, h3⟩ := hscale k le_rfl N hN
    refine ⟨m, int_computes_pad hcomp h1 h3 h2, ?_⟩
    have hm' : (m : ℝ) ≤ C * ((k * N : ℕ) : ℝ) ^ s :=
      (Nat.cast_le.mpr hm).trans hcost
    exact scaled_bound hk hN hε.le hm'
  · -- the release's exponents, plus any ε, are writer A's: pad down to floors, then pay for
    -- constants with `3m + rows·columns ≤ (3C + 1) n^(τ+ε)`.
    intro t ht ε hε
    have hat : a + c ≤ t := hge.trans (sInf_le_of_mem hpos ht)
    simp only [Set.mem_setOf_eq] at ht ⊢
    obtain ⟨C, hC, hbound⟩ := ht ε hε
    refine ⟨3 * C + 1, fun n hn => ?_⟩
    obtain ⟨m, hcomp, hm⟩ := hbound n hn
    have hpad : Integral.Computes F (roundDim n a) (roundDim n c) (roundDim n b) m :=
      int_computes_pad hcomp (Nat.floor_le_ceil _) (Nat.floor_le_ceil _) (Nat.floor_le_ceil _)
    obtain ⟨prog, hprog, hcost⟩ := prog_of_computes hpad
    refine ⟨prog, hprog, ?_⟩
    have hn1 : (1 : ℝ) ≤ n := by exact_mod_cast hn
    have hra : (roundDim n a : ℝ) ≤ (n : ℝ) ^ a :=
      Nat.floor_le (Real.rpow_nonneg (Nat.cast_nonneg _) _)
    have hrc : (roundDim n c : ℝ) ≤ (n : ℝ) ^ c :=
      Nat.floor_le (Real.rpow_nonneg (Nat.cast_nonneg _) _)
    have hprod : (roundDim n a : ℝ) * (roundDim n c : ℝ) ≤ (n : ℝ) ^ (t + ε) := by
      calc (roundDim n a : ℝ) * (roundDim n c : ℝ) ≤ (n : ℝ) ^ a * (n : ℝ) ^ c :=
            mul_le_mul hra hrc (Nat.cast_nonneg _) (Real.rpow_nonneg (Nat.cast_nonneg _) _)
        _ = (n : ℝ) ^ (a + c) := (Real.rpow_add (by linarith) a c).symm
        _ ≤ (n : ℝ) ^ (t + ε) := Real.rpow_le_rpow_of_exponent_le hn1 (by linarith)
    have hcost' : (cost prog : ℝ) ≤ 3 * (m : ℝ) + (roundDim n a : ℝ) * (roundDim n c : ℝ) := by
      exact_mod_cast hcost
    calc (cost prog : ℝ) ≤ 3 * (m : ℝ) + (roundDim n a : ℝ) * (roundDim n c : ℝ) := hcost'
      _ ≤ 3 * (C * (n : ℝ) ^ (t + ε)) + (n : ℝ) ^ (t + ε) := by linarith
      _ = (3 * C + 1) * (n : ℝ) ^ (t + ε) := by ring

/-- `⌊n^1⌋ = n`. -/
theorem roundDim_one (n : ℕ) : roundDim n 1 = n := by
  simp [roundDim]

/-- Writer A's square exponent is its rectangular exponent at weights `(1, 1, 1)`. -/
theorem omegaSquare_eq_omegaRect (F : Type) [Field F] : omegaSquare F = omegaRect F 1 1 1 := by
  unfold omegaSquare omegaRect
  congr 1
  ext s
  constructor
  · rintro ⟨C, hC⟩
    exact ⟨C, fun n hn => by rw [roundDim_one]; exact hC n hn⟩
  · rintro ⟨C, hC⟩
    exact ⟨C, fun n hn => by have h := hC n hn; rw [roundDim_one] at h; exact h⟩

/-- Writer A's closed form is the release's at the same weights (`max 0 u = max u 0`). -/
theorem rectFormula_eq (a b c : ℝ) : rectFormula a b c = fml a b c := by
  show _ = fmlCore _ _ _
  unfold rectFormula fmlCore
  dsimp only
  rw [max_comm (0 : ℝ)]

/-! ## Writer A's three propositions in the challenge's scope -/

/-- Writer A's square exponent (division-free) is `9/4`, from the release's `square_exponent`. -/
theorem square : BlindA.SquareExponent := by
  intro F _
  rw [omegaSquare_eq_omegaRect, omegaRect_eq F one_pos zero_le_one zero_le_one]
  exact square_exponent F

/-- Writer A's dual exponent (the claim's `ω(F; 1, 1, t)`, the columns of the second matrix) is
`1/2`, from the release's `dual_exponent` (rows) and the symmetry of `rectangular_exponent`. -/
theorem dual : BlindA.DualExponent := by
  intro F _
  unfold alphaDual
  have hset : {t : ℝ | 0 ≤ t ∧ t ≤ 1 ∧ omegaRect F 1 1 t = 2} =
      {t : ℝ | t ∈ Set.Icc (0 : ℝ) 1 ∧ formalOmega F 1 1 t = 2} := by
    ext t
    simp only [Set.mem_setOf_eq, Set.mem_Icc]
    constructor
    · rintro ⟨h0, h1, h⟩
      refine ⟨⟨h0, h1⟩, ?_⟩
      rw [omegaRect_eq F one_pos zero_le_one h0, formalOmega_swap F 1 t 1,
        formalOmega_cycle F t 1 1] at h
      exact h
    · rintro ⟨⟨h0, h1⟩, h⟩
      refine ⟨h0, h1, ?_⟩
      rw [omegaRect_eq F one_pos zero_le_one h0, formalOmega_swap F 1 t 1,
        formalOmega_cycle F t 1 1]
      exact h
  rw [hset]
  exact dual_exponent F

/-- Writer A's rectangular exponent equals writer A's closed form at positive weights, from the
release's `rectangular_exponent` and the symmetry of the closed form. -/
theorem rect : BlindA.RectangularExponent := by
  intro F _ a b c ha hb hc
  rw [omegaRect_eq F ha hb.le hc.le, formalOmega_eq_fml_nonneg F hb.le hc.le ha.le,
    ← fml_cycle a b c, rectFormula_eq]

end

end OmegaBridge.A

namespace BlindA

/-- F2, writer A: the square exponent proposition holds. -/
theorem square_exponent_holds : SquareExponent := OmegaBridge.A.square

/-- F2, writer A: the dual exponent proposition holds. -/
theorem dual_exponent_holds : DualExponent := OmegaBridge.A.dual

/-- F2, writer A: the rectangular exponent proposition holds. -/
theorem rectangular_exponent_holds : RectangularExponent := OmegaBridge.A.rect

end BlindA
