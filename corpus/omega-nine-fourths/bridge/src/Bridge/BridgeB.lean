import OAI.LinearAlgebra.SpectralBooks.ExactExponent
import Bridge.BlindB
import Bridge.Common

/-!
# The ω = 9/4 bridge for writer B (row F2; cert-machine, 2026-11-25)

Proves writer B's `BlindB.SquareExponent`, `BlindB.DualExponent` and `BlindB.RectangularExponent`
from the release's three theorems and its public lemmas (`formalOmega_eq_integral`, the set-based
model `MatrixExponent.Integral`).

The differences bridged, each by a lemma below:
* writer B's circuits (a gate list with wires that read a constant, an input or an earlier gate;
  constants and inputs free; cost = number of gates) are the release's set-based builds at the
  same cost, in both directions (`computes_of_circuit`, `circuit_of_computes`).
* rounding: writer B rounds `n^w` down, the release up; padding and a change of scale.
* the `O(·)` form: writer B's `∃ K > 0 ∃ N₀ ≥ 1 ∀ n ≥ N₀` against the release's
  `∀ ε > 0 ∃ C > 0 ∀ N ≥ 1, … N^(τ+ε)` (`sInf_eq_of_approx`; the threshold is absorbed by the
  change of scale `n = k·N₀·N`).
* weights: writer B's `omega F a b c` (rows `a`, inner `b`, columns `c`) is the release's
  `formalOmega F b c a`; writer B's `alpha` puts `t` on the inner dimension, the release's on the
  rows; the closed form is symmetric.
-/

namespace OmegaBridge.B

open OAI.LinearAlgebra.SpectralBooks
open OAI.LinearAlgebra.MatrixExponent

noncomputable section

variable {F : Type} [Field F]

/-! ## Wires -/

/-- A wire reading the first `b` gates also reads the first `b'` gates, for `b ≤ b'`. -/
def wlift {V : Type} {b b' : ℕ} (h : b ≤ b') : BlindB.Wire F V b → BlindB.Wire F V b'
  | .scalar a => .scalar a
  | .input v => .input v
  | .gate i => .gate (Fin.castLE h i)

/-- Lifting a wire does not change what it reads. -/
theorem value_wlift {V R : Type} [CommRing R] {b b' : ℕ} (h : b ≤ b') (w : BlindB.Wire F V b)
    (ι : MvPolynomial V F →+* R) (g : ℕ → R) : (wlift h w).value ι g = w.value ι g := by
  cases w <;> rfl

/-- A wire bounded by `b` reads only gate values below `b`. -/
theorem value_congr {V R : Type} [CommRing R] {b : ℕ} (w : BlindB.Wire F V b)
    (ι : MvPolynomial V F →+* R) {g g' : ℕ → R} (h : ∀ i < b, g i = g' i) :
    w.value ι g = w.value ι g' := by
  cases w with
  | scalar a => rfl
  | input v => rfl
  | gate i => exact h i.val i.isLt

/-- In the polynomial ring, a wire whose earlier gates lie in a set containing the initial
polynomials (constants and inputs) reads an element of that set. -/
theorem wire_mem {m k p b : ℕ} (w : BlindB.Wire F (BlindB.Input m k p) b)
    (g : ℕ → BlindB.EntryPoly F m k p) {T : Set (Integral.Poly F m p k)}
    (hinit : Integral.initial F m p k ⊆ T) (hg : ∀ i < b, g i ∈ T) :
    w.value (RingHom.id _) g ∈ T := by
  cases w with
  | scalar a => exact hinit (Set.mem_union_left _ ⟨a, rfl⟩)
  | input v => exact hinit (Set.mem_union_right _ ⟨v, rfl⟩)
  | gate i => exact hg i.val i.isLt

/-! ## From writer B's circuits to the release's set-based model -/

/-- The values of the first `t` gates of a division-free circuit of writer B lie in a
division-free build of cost `t` in the release's set-based model (rows `m`, columns `p`,
inner `k`). -/
theorem build_of_circuit {m k p : ℕ} (D : BlindB.Circuit F m k p)
    (hnd : ∀ i, D.op i ≠ BlindB.Op.div) (g : ℕ → BlindB.EntryPoly F m k p)
    (hg : ∀ i : Fin D.cost, (D.op i).Holds ((D.left i).value (RingHom.id _) g)
      ((D.right i).value (RingHom.id _) g) (g i.val)) :
    ∀ t, t ≤ D.cost → ∃ T : Set (Integral.Poly F m p k),
      Integral.Build (Integral.initial F m p k) t T ∧ ∀ i < t, g i ∈ T := by
  intro t
  induction t with
  | zero => intro _; exact ⟨_, .nil, fun i hi => absurd hi (Nat.not_lt_zero _)⟩
  | succ t ih =>
    intro ht
    obtain ⟨T, hb, hT⟩ := ih (Nat.le_of_succ_le ht)
    have hinit := int_initial_subset hb
    let j : Fin D.cost := ⟨t, ht⟩
    have hx := wire_mem (D.left j) g hinit hT
    have hy := wire_mem (D.right j) g hinit hT
    have hj := hg j
    have hdj := hnd j
    generalize D.op j = o at hj hdj
    cases o with
    | add =>
      refine ⟨_, hb.add hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (RingHom.id _) g + (D.right j).value (RingHom.id _) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | sub =>
      refine ⟨_, hb.sub hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (RingHom.id _) g - (D.right j).value (RingHom.id _) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | mul =>
      refine ⟨_, hb.mul hx hy, fun i hi => ?_⟩
      rcases Nat.lt_succ_iff_lt_or_eq.mp hi with hi | hi
      · exact Set.mem_insert_of_mem _ (hT i hi)
      · have e : g t = (D.left j).value (RingHom.id _) g * (D.right j).value (RingHom.id _) g := hj
        rw [hi, e]; exact Set.mem_insert _ _
    | div => exact absurd rfl hdj

/-- A correct division-free circuit of writer B for an `m × k` by `k × p` product is a computation
in the release's set-based model (rows `m`, columns `p`, inner `k`) at the same cost. Writer B's
output wires read the build's set. -/
theorem computes_of_circuit {m k p : ℕ} (D : BlindB.Circuit F m k p)
    (hD : D.Correct .divisionFree) : Integral.Computes F m p k D.cost := by
  obtain ⟨hnd, g, hg, hout⟩ := hD
  obtain ⟨T, hb, hT⟩ := build_of_circuit D hnd g hg D.cost le_rfl
  refine ⟨T, hb, fun q => ?_⟩
  have h := wire_mem (D.output q.1 q.2) g (int_initial_subset hb) hT
  rw [hout q.1 q.2] at h
  exact h

/-! ## From the release's set-based model to writer B's circuits -/

/-- Append one gate (operation `o`, operands `l`, `r` reading the existing gates) to a circuit. -/
def snoc {m k p : ℕ} (D : BlindB.Circuit F m k p) (o : BlindB.Op)
    (l r : BlindB.Wire F (BlindB.Input m k p) D.cost) : BlindB.Circuit F m k p where
  cost := D.cost + 1
  op i := if h : i.val < D.cost then D.op ⟨i.val, h⟩ else o
  left i := if h : i.val < D.cost then D.left ⟨i.val, h⟩ else wlift (Nat.not_lt.mp h) l
  right i := if h : i.val < D.cost then D.right ⟨i.val, h⟩ else wlift (Nat.not_lt.mp h) r
  output i j := wlift (Nat.le_succ _) (D.output i j)

/-- "A circuit of cost `c` with gate values `g`, allowed operations `ok`, reads every element of
every finite subset of `T` through some wire": the invariant of the reading construction. -/
def Reads {m k p : ℕ} {R : Type} [CommRing R] (ι : BlindB.EntryPoly F m k p →+* R)
    (ok : BlindB.Op → Prop) (T : Set R) (c : ℕ) : Prop :=
  ∀ s : Finset R, (↑s : Set R) ⊆ T →
    ∃ (D : BlindB.Circuit F m k p) (g : ℕ → R), D.cost = c ∧ (∀ i, ok (D.op i)) ∧
      (∀ i : Fin D.cost, (D.op i).Holds ((D.left i).value ι g) ((D.right i).value ι g) (g i.val)) ∧
      ∀ v ∈ s, ∃ w : BlindB.Wire F (BlindB.Input m k p) D.cost, w.value ι g = v

/-- The initially available values (every constant and every input) are read by the empty
circuit: writer B's constants and inputs are free wires. -/
theorem reads_initial {m k p : ℕ} {R : Type} [CommRing R] (ι : BlindB.EntryPoly F m k p →+* R)
    (ok : BlindB.Op → Prop) {S : Set R}
    (hS : ∀ v ∈ S, (∃ a : F, ι (MvPolynomial.C a) = v) ∨
      (∃ x : BlindB.Input m k p, ι (MvPolynomial.X x) = v)) : Reads ι ok S 0 := by
  intro s hs
  refine ⟨⟨0, Fin.elim0, fun i => i.elim0, fun i => i.elim0, fun _ _ => .scalar 0⟩,
    fun _ => 0, rfl, fun i => i.elim0, fun i => i.elim0, ?_⟩
  intro v hv
  rcases hS v (hs (Finset.mem_coe.mpr hv)) with ⟨a, ha⟩ | ⟨x, hx⟩
  · exact ⟨.scalar a, ha⟩
  · exact ⟨.input x, hx⟩

/-- One step of a build, a value `op x y` with `x, y` already read, is one more gate. -/
theorem reads_step {m k p c : ℕ} {R : Type} [CommRing R] {ι : BlindB.EntryPoly F m k p →+* R}
    {ok : BlindB.Op → Prop} {T : Set R} (ih : Reads ι ok T c) {x y : R} (hx : x ∈ T) (hy : y ∈ T)
    (o : BlindB.Op) (ho : ok o) (z : R) (hz : o.Holds x y z) :
    Reads ι ok (insert z T) (c + 1) := by
  classical
  intro s hs
  let need : Finset R := insert x (insert y (s.erase z))
  have hneed : (↑need : Set R) ⊆ T := by
    intro v hv
    simp only [need, Finset.coe_insert, Finset.coe_erase, Set.mem_insert_iff, Set.mem_diff,
      Finset.mem_coe, Set.mem_singleton_iff] at hv
    rcases hv with rfl | rfl | ⟨hin, hne⟩
    · exact hx
    · exact hy
    · exact (Set.mem_insert_iff.mp (hs (Finset.mem_coe.mpr hin))).resolve_left hne
  obtain ⟨D, g, hc, hok, hg, hw⟩ := ih need hneed
  obtain ⟨wx, hwx⟩ := hw x (by simp [need])
  obtain ⟨wy, hwy⟩ := hw y (by simp [need])
  let g' : ℕ → R := fun n => if n = D.cost then z else g n
  have hagree : ∀ i < D.cost, g i = g' i := fun i hi => by simp [g', Nat.ne_of_lt hi]
  have hx' : wx.value ι g' = x := (value_congr wx ι hagree).symm.trans hwx
  have hy' : wy.value ι g' = y := (value_congr wy ι hagree).symm.trans hwy
  refine ⟨snoc D o wx wy, g', by show D.cost + 1 = c + 1; rw [hc], ?_, ?_, ?_⟩
  · intro i
    show ok (if h : i.val < D.cost then D.op ⟨i.val, h⟩ else o)
    split_ifs with h
    · exact hok _
    · exact ho
  · intro i
    by_cases h : i.val < D.cost
    · have e_op : (snoc D o wx wy).op i = D.op ⟨i.val, h⟩ := dif_pos h
      have e_l : ((snoc D o wx wy).left i).value ι g' = (D.left ⟨i.val, h⟩).value ι g := by
        have e : (snoc D o wx wy).left i = D.left ⟨i.val, h⟩ := dif_pos h
        rw [e]
        exact (value_congr _ ι (fun j hj => hagree j (lt_trans hj h))).symm
      have e_r : ((snoc D o wx wy).right i).value ι g' = (D.right ⟨i.val, h⟩).value ι g := by
        have e : (snoc D o wx wy).right i = D.right ⟨i.val, h⟩ := dif_pos h
        rw [e]
        exact (value_congr _ ι (fun j hj => hagree j (lt_trans hj h))).symm
      have e_g : g' i.val = g i.val := (hagree i.val h).symm
      rw [e_op, e_l, e_r, e_g]
      exact hg ⟨i.val, h⟩
    · have hi : i.val = D.cost := by
        have := i.isLt
        change i.val < D.cost + 1 at this
        omega
      have e_op : (snoc D o wx wy).op i = o := dif_neg h
      have e_l : ((snoc D o wx wy).left i).value ι g' = x := by
        have e : (snoc D o wx wy).left i = wlift (Nat.not_lt.mp h) wx := dif_neg h
        rw [e, value_wlift]
        exact hx'
      have e_r : ((snoc D o wx wy).right i).value ι g' = y := by
        have e : (snoc D o wx wy).right i = wlift (Nat.not_lt.mp h) wy := dif_neg h
        rw [e, value_wlift]
        exact hy'
      have e_g : g' i.val = z := by simp [g', hi]
      rw [e_op, e_l, e_r, e_g]
      exact hz
  · intro v hv
    by_cases he : v = z
    · refine ⟨.gate ⟨D.cost, Nat.lt_succ_self _⟩, ?_⟩
      show g' D.cost = v
      simp [g', he]
    · obtain ⟨w, hw'⟩ := hw v (by simp [need, he, hv])
      exact ⟨wlift (Nat.le_succ _) w,
        (value_wlift (Nat.le_succ _) w ι g').trans ((value_congr w ι hagree).symm.trans hw')⟩

/-- A division-free build in the release's set-based model is read by a division-free circuit
of writer B of the same cost. -/
theorem reads_of_build {m k p c : ℕ} {T : Set (Integral.Poly F m p k)}
    (h : Integral.Build (Integral.initial F m p k) c T) :
    Reads (F := F) (m := m) (k := k) (p := p) (RingHom.id _) (· ≠ BlindB.Op.div) T c := by
  induction h with
  | nil =>
    apply reads_initial
    intro v hv
    rcases hv with ⟨a, rfl⟩ | ⟨x, rfl⟩
    · exact Or.inl ⟨a, rfl⟩
    · exact Or.inr ⟨x, rfl⟩
  | add _ hx hy ih => exact reads_step ih hx hy .add (fun h => by cases h) _ rfl
  | sub _ hx hy ih => exact reads_step ih hx hy .sub (fun h => by cases h) _ rfl
  | mul _ hx hy ih => exact reads_step ih hx hy .mul (fun h => by cases h) _ rfl

/-- A computation of cost `c` in the release's set-based model (rows `m`, columns `p`, inner `k`)
is a correct division-free circuit of writer B of cost exactly `c`. -/
theorem circuit_of_computes {m k p c : ℕ} (h : Integral.Computes F m p k c) :
    ∃ D : BlindB.Circuit F m k p, D.Correct .divisionFree ∧ D.cost = c := by
  classical
  obtain ⟨T, hb, hout⟩ := h
  obtain ⟨D, g, hc, hnd, hg, hw⟩ := reads_of_build hb
    (Finset.univ.image (Integral.output F (i := m) (j := p) (k := k))) (by
      intro v hv
      obtain ⟨q, _, rfl⟩ := Finset.mem_image.mp (Finset.mem_coe.mp hv)
      exact hout q)
  choose w hw' using fun q : Integral.Pos m p =>
    hw (Integral.output F q) (Finset.mem_image_of_mem _ (Finset.mem_univ q))
  refine ⟨{ D with output := fun i j => w (i, j) }, ⟨hnd, g, hg, fun i j => ?_⟩, hc⟩
  exact (hw' (i, j)).trans rfl

/-! ## The exponents -/

/-- Writer B's division-free exponent `omega F a b c` (rows `a`, inner `b`, columns `c`, floors,
threshold form) equals the release's `formalOmega F b c a`, for `a > 0` and `b, c ≥ 0`. -/
theorem omega_eq (F : Type) [Field F] {a b c : ℝ} (ha : 0 < a) (hb : 0 ≤ b) (hc : 0 ≤ c) :
    BlindB.omega F a b c = formalOmega F b c a := by
  have hval : formalOmega F b c a = fml b c a := formalOmega_eq_fml_nonneg F hb hc ha.le
  have hge : a + c ≤ formalOmega F b c a := by
    rw [hval, ← fml_cycle a b c]
    exact fml_ge ha.le hb hc
  have hpos : formalOmega F b c a ≠ 0 := (by linarith : 0 < formalOmega F b c a).ne'
  rw [formalOmega_eq_integral F b c a] at hpos ⊢
  unfold BlindB.omega
  unfold Integral.exponent at hpos ⊢
  apply sInf_eq_of_approx hpos
  · -- writer B's exponents are the release's: run writer B at scale `k·N₀·N` and pad down.
    intro s hs
    simp only [Set.mem_setOf_eq] at hs ⊢
    obtain ⟨K, hK, N0, hN0, hbound⟩ := hs
    obtain ⟨k, hk, hscale⟩ := exists_scale ha.le hb hc
    have hkN0 : 0 < k * N0 := Nat.mul_pos hk hN0
    intro ε hε
    refine ⟨(|K| + 1) * ((k * N0 : ℕ) : ℝ) ^ s, scaled_const_pos K s hkN0, fun N hN => ?_⟩
    have hle : N0 ≤ k * N0 * N :=
      (Nat.le_mul_of_pos_left N0 hk).trans (Nat.le_mul_of_pos_right _ hN)
    obtain ⟨D, hD, hcost⟩ := hbound (k * N0 * N) hle
    obtain ⟨h1, h2, h3⟩ := hscale (k * N0) (Nat.le_mul_of_pos_right _ hN0) N hN
    refine ⟨D.cost, int_computes_pad (computes_of_circuit D hD) h1 h3 h2, ?_⟩
    exact scaled_bound hkN0 hN hε.le hcost
  · -- the release's exponents, plus any ε, are writer B's: pad down to floors (threshold 1).
    intro t ht ε hε
    simp only [Set.mem_setOf_eq] at ht ⊢
    obtain ⟨C, hC, hbound⟩ := ht ε hε
    refine ⟨C, hC, 1, le_rfl, fun n hn => ?_⟩
    obtain ⟨m, hcomp, hm⟩ := hbound n hn
    have hpad : Integral.Computes F (BlindB.side n a) (BlindB.side n c) (BlindB.side n b) m :=
      int_computes_pad hcomp (Nat.floor_le_ceil _) (Nat.floor_le_ceil _) (Nat.floor_le_ceil _)
    obtain ⟨D, hD, hDc⟩ := circuit_of_computes hpad
    exact ⟨D, hD, by rw [hDc]; exact hm⟩

/-! ## Writer B's three propositions in the challenge's scope -/

/-- Writer B's square exponent (division-free) is `9/4`, from the release's `square_exponent`. -/
theorem square : BlindB.SquareExponent := by
  intro F _
  rw [omega_eq F one_pos zero_le_one zero_le_one]
  exact square_exponent F

/-- Writer B's dual exponent (`t` on the inner dimension) is `1/2`, from the release's
`dual_exponent` (`t` on the rows) and the symmetry of `rectangular_exponent`. -/
theorem dual : BlindB.DualExponent := by
  intro F _
  unfold BlindB.alpha
  have hset : {t : ℝ | t ∈ Set.Icc (0 : ℝ) 1 ∧ BlindB.omega F 1 t 1 = 2} =
      {t : ℝ | t ∈ Set.Icc (0 : ℝ) 1 ∧ formalOmega F 1 1 t = 2} := by
    ext t
    simp only [Set.mem_setOf_eq]
    constructor
    · rintro ⟨ht, h⟩
      refine ⟨ht, ?_⟩
      rw [omega_eq F one_pos ht.1 zero_le_one, formalOmega_cycle F t 1 1] at h
      exact h
    · rintro ⟨ht, h⟩
      refine ⟨ht, ?_⟩
      rw [omega_eq F one_pos ht.1 zero_le_one, formalOmega_cycle F t 1 1]
      exact h
  rw [hset]
  exact dual_exponent F

/-- Writer B's rectangular exponent equals writer B's closed form at positive weights. -/
theorem rect : BlindB.RectangularExponent := by
  intro F _ a b c ha hb hc
  dsimp only
  rw [omega_eq F ha hb.le hc.le, formalOmega_eq_fml_nonneg F hb.le hc.le ha.le,
    ← fml_cycle a b c]
  show fmlCore _ _ _ = _
  unfold fmlCore
  rw [max_comm (0 : ℝ)]

end

end OmegaBridge.B

namespace BlindB

/-- F2, writer B: the square exponent proposition holds. -/
theorem square_exponent_holds : SquareExponent := OmegaBridge.B.square

/-- F2, writer B: the dual exponent proposition holds. -/
theorem dual_exponent_holds : DualExponent := OmegaBridge.B.dual

/-- F2, writer B: the rectangular exponent proposition holds. -/
theorem rectangular_exponent_holds : RectangularExponent := OmegaBridge.B.rect

end BlindB
