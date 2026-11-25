import RectProof.Lib
import RectProof.Rect

/-!
# Phase 5: proofs of the sealed rectangular statements (ω = 9/4 lane, cert-machine, 2026-11-25)

Proves the four propositions of the statement writer's sealed `Rect.lean` (amendment A16,
sha256 95340267…), imported here as the byte copy `RectProof.Rect`, from the release
(openai/math 92b516ef), the lemmas of `RectProof.Lib`, and lemmas of our own below.

* `Rect.AsymptoticRankRect` (row G3f): the sealed `tensorRank`, `matMulRect`, `tpow` are the release's
  `tensorRank`, `matrixTensor F b c a`, `Tensor.power`; the bound is `RectProof.rect_asymptotic_lower`
  (the paper's proof of Corollary 1.3 from the square theorem); the limit is the release's
  `tendsto_tensorRank_power_root`.
* `Rect.BorderRankRect` (row G3e): the sealed Zariski closure is the release's
  `GeometricBorderRankAtMost`, and `asymptoticRank_le_geometricBorderRank` (release) carries G3f.
* `Rect.DualExponentDiv` (row G2b) and `Rect.AlphaBounds` (row G2a): for `β ≤ 1/2` the release's
  division-free programs (exponent 2 at weights `(1/2,1,1)`, zero padding) are compiled into the sealed
  circuit model (`toCircuit`, `toCircuit_computes`, `opCount_toCircuit`); every sealed circuit with
  division gates has rank over `F(X,Y)` at most twice its number of operations (Lemma 2.4,
  `rank_le_ops`), and the release's rectangular exponent WITH division (`Rectangle.exponent_eq`,
  through `RectProof.rank_lower_U`) bounds that rank below at each size: exponent `2` for `β ≤ 1/2`
  and `> 2` for `β > 1/2`. So `α_F = 1/2`, hence `1/2 ≤ α_F ≤ 2/3`.
-/

noncomputable section

namespace RectProof

open OAI.LinearAlgebra.SpectralBooks
open OAI.MatrixMultiplication.Foundation
open OAI.MatrixMultiplication
open Filter

/-! ## The sealed tensor definitions against the release's -/

theorem hasRankLE_iff {K ι₁ ι₂ ι₃ : Type} [Field K] (T : Rect.Tensor3 K ι₁ ι₂ ι₃) (r : ℕ) :
    Rect.HasRankLE T r ↔ Tensor.RankAtMost (K := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T r := by
  constructor
  · rintro ⟨u, v, w, h⟩
    refine ⟨u, v, w, ?_⟩
    funext a b c
    simp only [Tensor.rankOne]
    exact h a b c
  · rintro ⟨u, v, w, h⟩
    refine ⟨u, v, w, fun a b c => ?_⟩
    have h' := congrFun (congrFun (congrFun h a) b) c
    simpa only [Tensor.rankOne] using h'

theorem tensorRank_eq {K ι₁ ι₂ ι₃ : Type} [Field K] [Fintype ι₁] [Fintype ι₂]
    (T : Rect.Tensor3 K ι₁ ι₂ ι₃) :
    Rect.tensorRank T = tensorRank (F := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T := by
  have hmem : tensorRank (F := K) (X := ι₁) (Y := ι₂) (Z := ι₃) T ∈
      {r : ℕ | Rect.HasRankLE T r} :=
    (hasRankLE_iff T _).mpr (rankAtMost_tensorRank _)
  have hne : {r : ℕ | Rect.HasRankLE T r}.Nonempty := ⟨_, hmem⟩
  apply le_antisymm
  · exact Nat.sInf_le hmem
  · apply tensorRank_le_of_rankAtMost
    exact (hasRankLE_iff T _).mp (Nat.sInf_mem hne)

/-- The sealed `T_{a,b,c}` is the release's `matrixTensor K b c a` (wire order `12, 23, 31`). -/
theorem matMulRect_eq (K : Type) [Field K] (a b c : ℕ) :
    Rect.matMulRect K a b c = matrixTensor K b c a := by
  funext x y z
  rfl

theorem toAlgebraicClosure_matrixTensor (F : Type) [Field F] (a b c : ℕ) :
    toAlgebraicClosure (matrixTensor F b c a) = Rect.matMulRect (AlgebraicClosure F) a b c := by
  rw [matMulRect_eq]
  funext x y z
  simp only [toAlgebraicClosure, matrixTensor, Tensor.matrixCoefficients]
  split_ifs <;> simp

/-! ## Asymptotic rank (row G3f) -/

theorem rankRoot_eq (F : Type) [Field F] (a b c k : ℕ) :
    Rect.rankRoot (Rect.matMulRect F a b c) k =
      (tensorRank (Tensor.power (matrixTensor F b c a) k) : ℝ) ^ ((k : ℝ)⁻¹) := by
  unfold Rect.rankRoot
  rw [matMulRect_eq, tensorRank_eq]
  rfl

theorem asymptoticRank_eq (F : Type) [Field F] (a b c : ℕ) :
    Rect.asymptoticRank (Rect.matMulRect F a b c) = asymptoticRank (matrixTensor F b c a) := by
  unfold Rect.asymptoticRank OAI.LinearAlgebra.SpectralBooks.asymptoticRank
  congr 1
  funext k
  simp only [rankRoot_eq, Nat.cast_add, Nat.cast_one]

theorem asymptoticRank_main (F : Type) [Field F] (a b c : ℕ) (ha : 1 ≤ a) (hb : 1 ≤ b)
    (hc : 1 ≤ c) :
    (∃ L : ℝ,
        Filter.Tendsto (fun k : ℕ => Rect.rankRoot (Rect.matMulRect F a b c) k) Filter.atTop
          (nhds L) ∧ Rect.rectBound a b c ≤ L) ∧
      Rect.rectBound a b c ≤ Rect.asymptoticRank (Rect.matMulRect F a b c) := by
  have hlow := rect_asymptotic_lower F (a := a) (b := b) (c := c) (by omega) (by omega) (by omega)
  refine ⟨⟨asymptoticRank (matrixTensor F b c a), ?_, ?_⟩, ?_⟩
  · exact (tendsto_tensorRank_power_root (matrixTensor F b c a)).congr
      (fun k => (rankRoot_eq F a b c k).symm)
  · unfold Rect.rectBound
    exact hlow
  · rw [asymptoticRank_eq]
    unfold Rect.rectBound
    exact hlow

/-! ## Geometric border rank (row G3e) -/

theorem mem_closure_iff (F : Type) [Field F] (a b c r : ℕ) :
    Rect.flat (Rect.matMulRect (AlgebraicClosure F) a b c) ∈
        Rect.zariskiClosure (Rect.rankLESet (AlgebraicClosure F) (Fin a × Fin b) (Fin b × Fin c)
          (Fin c × Fin a) r) ↔
      GeometricBorderRankAtMost (matrixTensor F b c a) r := by
  unfold Rect.zariskiClosure GeometricBorderRankAtMost
  rw [toAlgebraicClosure_matrixTensor]
  constructor
  · intro h p hp
    exact (MvPolynomial.mem_zeroLocus_iff.mp h) p (MvPolynomial.mem_vanishingIdeal_iff.mpr
      (by
        rintro x ⟨S, hS, rfl⟩
        exact hp S ((hasRankLE_iff S r).mp hS)))
  · intro h
    refine MvPolynomial.mem_zeroLocus_iff.mpr (fun p hp => ?_)
    exact h p (fun S hS =>
      (MvPolynomial.mem_vanishingIdeal_iff.mp hp) (Rect.flat S) ⟨S, (hasRankLE_iff S r).mpr hS, rfl⟩)

theorem geometricBorderRank_eq (F : Type) [Field F] (a b c : ℕ) :
    Rect.geometricBorderRank (Rect.matMulRect (AlgebraicClosure F) a b c) =
      geometricBorderRank (matrixTensor F b c a) := by
  have hset : {r : ℕ | Rect.flat (Rect.matMulRect (AlgebraicClosure F) a b c) ∈
      Rect.zariskiClosure (Rect.rankLESet (AlgebraicClosure F) (Fin a × Fin b) (Fin b × Fin c)
        (Fin c × Fin a) r)} = {r : ℕ | GeometricBorderRankAtMost (matrixTensor F b c a) r} :=
    Set.ext (fun r => mem_closure_iff F a b c r)
  have hne : {r : ℕ | GeometricBorderRankAtMost (matrixTensor F b c a) r}.Nonempty :=
    ⟨_, geometricBorderRankAtMost_geometricBorderRank _⟩
  unfold Rect.geometricBorderRank
  rw [hset]
  apply le_antisymm
  · exact Nat.sInf_le (s := {r : ℕ | GeometricBorderRankAtMost (matrixTensor F b c a) r})
      (geometricBorderRankAtMost_geometricBorderRank _)
  · exact geometricBorderRank_le_of_atMost (Nat.sInf_mem hne)

theorem borderRank_main (F : Type) [Field F] (a b c : ℕ) (ha : 1 ≤ a) (hb : 1 ≤ b)
    (hc : 1 ≤ c) :
    Rect.rectBound a b c ≤
      (Rect.geometricBorderRank (Rect.matMulRect (AlgebraicClosure F) a b c) : ℝ) := by
  rw [geometricBorderRank_eq F a b c]
  unfold Rect.rectBound
  exact rect_border_lower F (by omega) (by omega) (by omega)

/-! ## Lemma 2.4 on the sealed circuit model: rank over `F(X,Y)` at most twice the operations -/

section Gates

variable {F : Type} [Field F] {a b c : ℕ}

/-- The formal partial derivative in a left (first-matrix) entry. -/
def dL (p : Rect.RF F a b c) (x : Fin a × Fin b) : Rect.RF F a b c :=
  ratPartial (Sum.inl x : Rect.MatVar a b c) p

/-- The formal partial derivative in a right (second-matrix) entry. -/
def dR (p : Rect.RF F a b c) (y : Fin b × Fin c) : Rect.RF F a b c :=
  ratPartial (Sum.inr y : Rect.MatVar a b c) p

/-- The formal mixed second partial derivatives, as a function of the two entries. -/
def mixedFn (p : Rect.RF F a b c) : Fin a × Fin b → Fin b × Fin c → Rect.RF F a b c :=
  fun x y => ratMixed p x y

/-- The left factors of the two products a gate at position `m` may contribute. -/
def gateL (val : ℕ → Rect.RF F a b c) (m : ℕ) :
    Rect.Gate (Rect.MatVar a b c) F → Bool → Fin a × Fin b → Rect.RF F a b c
  | .mul p _, true => dL (val p)
  | .mul _ q, false => dL (val q)
  | .div _ _, true => dL (val m)
  | .div _ q, false => dL (val q)
  | _, _ => 0

/-- The right factors of the two products a gate at position `m` may contribute. -/
def gateR (val : ℕ → Rect.RF F a b c) (m : ℕ) :
    Rect.Gate (Rect.MatVar a b c) F → Bool → Fin b × Fin c → Rect.RF F a b c
  | .mul _ q, true => dR (val q)
  | .mul p _, false => dR (val p)
  | .div _ q, true => dR (val q)
  | .div _ _, false => dR (val m)
  | _, _ => 0

open scoped Classical in
/-- The operation positions, filtered exactly as in the sealed `Circuit.opCount`. -/
def opSet (C : Rect.Circuit (Rect.MatVar a b c) F) : Finset (Fin C.size) :=
  Finset.univ.filter (fun m : Fin C.size => Rect.Gate.IsOp (C.gate m))

omit [Field F] in
theorem opSet_card (C : Rect.Circuit (Rect.MatVar a b c) F) : (opSet C).card = C.opCount := rfl

/-- Two products per operation position. -/
abbrev OpIdx (C : Rect.Circuit (Rect.MatVar a b c) F) : Type := ↥(opSet C) × Bool

def famL (C : Rect.Circuit (Rect.MatVar a b c) F) (val : ℕ → Rect.RF F a b c) (i : OpIdx C) :
    Fin a × Fin b → Rect.RF F a b c :=
  gateL val i.1.1.val (C.gate i.1.1) i.2

def famR (C : Rect.Circuit (Rect.MatVar a b c) F) (val : ℕ → Rect.RF F a b c) (i : OpIdx C) :
    Fin b × Fin c → Rect.RF F a b c :=
  gateR val i.1.1.val (C.gate i.1.1) i.2

/-- The products of first derivatives contributed by the operation gates. -/
def fam (C : Rect.Circuit (Rect.MatVar a b c) F) (val : ℕ → Rect.RF F a b c) (i : OpIdx C) :
    Fin a × Fin b → Fin b × Fin c → Rect.RF F a b c :=
  fun x y => famL C val i x * famR C val i y

omit [Field F] in
theorem mem_opSet (C : Rect.Circuit (Rect.MatVar a b c) F) (m : ℕ) (hm : m < C.size)
    (h : Rect.Gate.IsOp (C.gate ⟨m, hm⟩)) : (⟨m, hm⟩ : Fin C.size) ∈ opSet C := by
  classical
  unfold opSet
  rw [Finset.mem_filter]
  exact ⟨Finset.mem_univ _, h⟩

/-- Every gate's mixed derivatives lie in the span of the operation gates' products. -/
theorem mixed_mem (C : Rect.Circuit (Rect.MatVar a b c) F) (val : ℕ → Rect.RF F a b c)
    (hWF : C.WellFormed) (hC : C.Consistent (Rect.ratVar F a b c) (Rect.ratConst F a b c) val) :
    ∀ m, m < C.size →
      mixedFn (val m) ∈ Submodule.span (Rect.RF F a b c) (Set.range (fam C val)) := by
  classical
  intro m
  induction m using Nat.strong_induction_on
  rename_i m ih
  intro hm
  have hg : Rect.Gate.Holds (Rect.ratVar F a b c) (Rect.ratConst F a b c) val m
      (C.gate ⟨m, hm⟩) := hC ⟨m, hm⟩
  have hwf : ∀ q ∈ Rect.Gate.args (C.gate ⟨m, hm⟩), q < m := hWF ⟨m, hm⟩
  have hop : Rect.Gate.IsOp (C.gate ⟨m, hm⟩) → (⟨m, hm⟩ : Fin C.size) ∈ opSet C :=
    mem_opSet C m hm
  generalize hgate : C.gate ⟨m, hm⟩ = g at hg hwf hop
  cases g with
  | input v =>
    simp only [Rect.Gate.Holds] at hg
    have h0 : mixedFn (val m) = 0 := by
      funext x y
      simp only [mixedFn, hg, Rect.ratVar, Pi.zero_apply]
      exact ratMixed_X _ _ _
    rw [h0]
    exact Submodule.zero_mem _
  | const e =>
    simp only [Rect.Gate.Holds] at hg
    have h0 : mixedFn (val m) = 0 := by
      funext x y
      simp only [mixedFn, hg, Rect.ratConst, Pi.zero_apply]
      exact ratMixed_C _ _ _
    rw [h0]
    exact Submodule.zero_mem _
  | add p q =>
    simp only [Rect.Gate.Holds] at hg
    have hp : p < m := hwf p (by simp [Rect.Gate.args])
    have hq : q < m := hwf q (by simp [Rect.Gate.args])
    have he : mixedFn (val m) = mixedFn (val p) + mixedFn (val q) := by
      funext x y
      simp only [mixedFn, hg, Pi.add_apply]
      exact ratMixed_add _ _ _ _
    rw [he]
    exact add_mem (ih p hp (by omega)) (ih q hq (by omega))
  | sub p q =>
    simp only [Rect.Gate.Holds] at hg
    have hp : p < m := hwf p (by simp [Rect.Gate.args])
    have hq : q < m := hwf q (by simp [Rect.Gate.args])
    have he : mixedFn (val m) = mixedFn (val p) - mixedFn (val q) := by
      funext x y
      simp only [mixedFn, hg, Pi.sub_apply]
      exact ratMixed_sub _ _ _ _
    rw [he]
    exact sub_mem (ih p hp (by omega)) (ih q hq (by omega))
  | mul p q =>
    simp only [Rect.Gate.Holds] at hg
    have hp : p < m := hwf p (by simp [Rect.Gate.args])
    have hq : q < m := hwf q (by simp [Rect.Gate.args])
    have he : mixedFn (val m) = val q • mixedFn (val p) + val p • mixedFn (val q) +
        ((fun x y => dL (val p) x * dR (val q) y) + (fun x y => dL (val q) x * dR (val p) y)) := by
      funext x y
      simp only [mixedFn, hg, Pi.add_apply, Pi.smul_apply, smul_eq_mul, dL, dR]
      rw [ratMixed_mul]
      ring
    rw [he]
    refine add_mem (add_mem (Submodule.smul_mem _ _ (ih p hp (by omega)))
      (Submodule.smul_mem _ _ (ih q hq (by omega)))) ?_
    have hmem : (⟨m, hm⟩ : Fin C.size) ∈ opSet C := hop True.intro
    have e1 : (fun x y => dL (val p) x * dR (val q) y) =
        fam C val ⟨⟨⟨m, hm⟩, hmem⟩, true⟩ := by
      funext x y
      simp only [fam, famL, famR, hgate, gateL, gateR]
    have e2 : (fun x y => dL (val q) x * dR (val p) y) =
        fam C val ⟨⟨⟨m, hm⟩, hmem⟩, false⟩ := by
      funext x y
      simp only [fam, famL, famR, hgate, gateL, gateR]
    rw [e1, e2]
    exact add_mem (Submodule.subset_span ⟨_, rfl⟩) (Submodule.subset_span ⟨_, rfl⟩)
  | div p q =>
    simp only [Rect.Gate.Holds] at hg
    obtain ⟨hq0, hval⟩ := hg
    have hp : p < m := hwf p (by simp [Rect.Gate.args])
    have hq : q < m := hwf q (by simp [Rect.Gate.args])
    have hmul : val m * val q = val p := by rw [hval, div_mul_cancel₀ _ hq0]
    have he : mixedFn (val m) = (val q)⁻¹ • (mixedFn (val p) - val m • mixedFn (val q) -
        ((fun x y => dL (val m) x * dR (val q) y) + (fun x y => dL (val q) x * dR (val m) y))) := by
      funext x y
      simp only [mixedFn, Pi.add_apply, Pi.sub_apply, Pi.smul_apply, smul_eq_mul, dL, dR]
      rw [eq_inv_mul_iff_mul_eq₀ hq0, ← hmul, ratMixed_mul]
      ring
    rw [he]
    refine Submodule.smul_mem _ _ (sub_mem (sub_mem (ih p hp (by omega))
      (Submodule.smul_mem _ _ (ih q hq (by omega)))) ?_)
    have hmem : (⟨m, hm⟩ : Fin C.size) ∈ opSet C := hop True.intro
    have e1 : (fun x y => dL (val m) x * dR (val q) y) =
        fam C val ⟨⟨⟨m, hm⟩, hmem⟩, true⟩ := by
      funext x y
      simp only [fam, famL, famR, hgate, gateL, gateR]
    have e2 : (fun x y => dL (val q) x * dR (val m) y) =
        fam C val ⟨⟨⟨m, hm⟩, hmem⟩, false⟩ := by
      funext x y
      simp only [fam, famL, famR, hgate, gateL, gateR]
    rw [e1, e2]
    exact add_mem (Submodule.subset_span ⟨_, rfl⟩) (Submodule.subset_span ⟨_, rfl⟩)

/-- Lemma 2.4 (bilinearization) for the sealed model, entrywise for rectangular products: a circuit
computing the `a × b` by `b × c` product gives a rank decomposition of `T_{a,b,c}` over `F(X,Y)`
with at most twice as many terms as the circuit has operations. -/
theorem rank_le_ops (C : Rect.Circuit (Rect.MatVar a b c) F) (hComp : Rect.Computes F a b c C) :
    tensorRank (matrixTensor (Rect.RF F a b c) b c a) ≤ 2 * C.opCount := by
  classical
  obtain ⟨hWF, val, out, hC, hout⟩ := hComp
  have hslice : ∀ z : Fin c × Fin a,
      (fun x y => matrixTensor (Rect.RF F a b c) b c a x y z) ∈
        Submodule.span (Rect.RF F a b c) (Set.range (fam C val)) := by
    rintro ⟨k, i⟩
    have h := mixed_mem C val hWF hC (out i k).val (out i k).isLt
    have heq : mixedFn (val (out i k).val) =
        fun x y => matrixTensor (Rect.RF F a b c) b c a x y (k, i) := by
      funext x y
      simp only [mixedFn, hout i k, Rect.ratX, Rect.ratY, Rect.ratVar]
      exact ratMixed_matrixEntry i k x y
    rw [heq] at h
    exact h
  choose co hco using fun z =>
    (Submodule.mem_span_range_iff_exists_fun (Rect.RF F a b c)).mp (hslice z)
  let e := Fintype.equivFin (OpIdx C)
  have hr : Tensor.RankAtMost (matrixTensor (Rect.RF F a b c) b c a) (Fintype.card (OpIdx C)) := by
    refine ⟨fun t => famL C val (e.symm t), fun t => famR C val (e.symm t),
      fun t z => co z (e.symm t), ?_⟩
    funext x y z
    have h : (∑ i, co z i • fam C val i) x y = matrixTensor (Rect.RF F a b c) b c a x y z :=
      congrFun (congrFun (hco z) x) y
    rw [← h]
    simp only [Finset.sum_apply, Pi.smul_apply, smul_eq_mul, fam, Tensor.rankOne]
    exact Fintype.sum_equiv e _ _ (fun i => by simp only [Equiv.symm_apply_apply]; ring)
  have hcard : Fintype.card (OpIdx C) = 2 * C.opCount := by
    rw [Fintype.card_prod, Fintype.card_coe, Fintype.card_bool, opSet_card]
    ring
  exact (tensorRank_le_of_rankAtMost hr).trans hcard.le

end Gates

/-! ## The release's division-free programs as sealed circuits -/

section Compile

variable {F : Type} [Field F] {a b c : ℕ}

/-- One gate of a release program (registers numbered newest first) as a sealed gate (positions
numbered oldest first): register `j` of a program with `r` registers is position `r - 1 - j`. -/
def convGate {r : ℕ} :
    OAI.MatrixMultiplication.Arithmetic.Gate F (OAI.MatrixMultiplication.Arithmetic.MatrixInput a b c) (Fin r) → Rect.Gate (Rect.MatVar a b c) F
  | .constant z => .const z
  | .input i => .input i
  | .add i j => .add (Fin.rev i).val (Fin.rev j).val
  | .sub i j => .sub (Fin.rev i).val (Fin.rev j).val
  | .mul i j => .mul (Fin.rev i).val (Fin.rev j).val

/-- The sealed gates of a release program, position `r` holding the gate of step `r`. -/
def gates : {r : ℕ} → OAI.MatrixMultiplication.Arithmetic.Program F (OAI.MatrixMultiplication.Arithmetic.MatrixInput a b c) r → Fin r → Rect.Gate (Rect.MatVar a b c) F
  | 0, .nil => fun m => Fin.elim0 m
  | _ + 1, .step p g => fun m =>
      Fin.lastCases (motive := fun _ => Rect.Gate (Rect.MatVar a b c) F) (convGate g) (gates p) m

/-- The value at each position: the release's formal polynomial of the matching register. -/
def valOf {r : ℕ} (p : OAI.MatrixMultiplication.Arithmetic.Program F (OAI.MatrixMultiplication.Arithmetic.MatrixInput a b c) r) (m : ℕ) : Rect.RF F a b c :=
  if h : m < r then algebraMap _ _ (registerPolynomial p (Fin.rev ⟨m, h⟩)) else 0

omit [Field F] in
theorem holds_congr {V K : Type} [Field K] {x : V → K} {cst : F → K} {val val' : ℕ → K} {m : ℕ}
    {g : Rect.Gate V F} (hm : val m = val' m) (hargs : ∀ q ∈ Rect.Gate.args g, val q = val' q) :
    Rect.Gate.Holds x cst val m g ↔ Rect.Gate.Holds x cst val' m g := by
  cases g with
  | input v => simp only [Rect.Gate.Holds, hm]
  | const e => simp only [Rect.Gate.Holds, hm]
  | add p q =>
    simp only [Rect.Gate.Holds, hm, hargs p (by simp [Rect.Gate.args]),
      hargs q (by simp [Rect.Gate.args])]
  | sub p q =>
    simp only [Rect.Gate.Holds, hm, hargs p (by simp [Rect.Gate.args]),
      hargs q (by simp [Rect.Gate.args])]
  | mul p q =>
    simp only [Rect.Gate.Holds, hm, hargs p (by simp [Rect.Gate.args]),
      hargs q (by simp [Rect.Gate.args])]
  | div p q =>
    simp only [Rect.Gate.Holds, hm, hargs p (by simp [Rect.Gate.args]),
      hargs q (by simp [Rect.Gate.args])]

theorem gates_ok : ∀ {r : ℕ} (p : OAI.MatrixMultiplication.Arithmetic.Program F (OAI.MatrixMultiplication.Arithmetic.MatrixInput a b c) r),
    (∀ m : Fin r, ∀ q ∈ Rect.Gate.args (gates p m), q < m.val) ∧
    (∀ m : Fin r, Rect.Gate.Holds (Rect.ratVar F a b c) (Rect.ratConst F a b c) (valOf p) m.val
      (gates p m))
  | 0, .nil => ⟨fun m => m.elim0, fun m => m.elim0⟩
  | r + 1, .step p g => by
    obtain ⟨hwf, hh⟩ := gates_ok p
    have hagree : ∀ q, q < r → valOf (p.step g) q = valOf p q := by
      intro q hq
      unfold valOf
      rw [dite_eq_left (show q < r + 1 by omega), dite_eq_left hq]
      have hrev : (Fin.rev (⟨q, by omega⟩ : Fin (r + 1))) = (Fin.rev (⟨q, hq⟩ : Fin r)).succ := by
        ext
        simp only [Fin.val_rev, Fin.val_succ]
        omega
      rw [hrev, registerPolynomial_succ]
    have hr : valOf (p.step g) r = algebraMap _ _ (gatePolynomial g (registerPolynomial p)) := by
      unfold valOf
      rw [dite_eq_left (show r < r + 1 by omega)]
      have h0 : Fin.rev (⟨r, by omega⟩ : Fin (r + 1)) = 0 := by
        ext
        simp [Fin.val_rev]
      rw [h0, registerPolynomial_zero]
    have hreg : ∀ j : Fin r,
        valOf (p.step g) (Fin.rev j).val = algebraMap _ _ (registerPolynomial p j) := by
      intro j
      rw [hagree _ (Fin.rev j).isLt]
      unfold valOf
      rw [dite_eq_left (Fin.rev j).isLt]
      simp only [Fin.eta, Fin.rev_rev]
    refine ⟨?_, ?_⟩
    · intro m
      induction m using Fin.lastCases with
      | last =>
        intro q hq
        simp only [gates, Fin.lastCases_last, Fin.val_last] at hq ⊢
        cases g with
        | constant z => simp [convGate, Rect.Gate.args] at hq
        | input v => simp [convGate, Rect.Gate.args] at hq
        | add i j =>
          simp only [convGate, Rect.Gate.args] at hq
          rcases List.mem_pair.mp hq with rfl | rfl
          · exact (Fin.rev i).isLt
          · exact (Fin.rev j).isLt
        | sub i j =>
          simp only [convGate, Rect.Gate.args] at hq
          rcases List.mem_pair.mp hq with rfl | rfl
          · exact (Fin.rev i).isLt
          · exact (Fin.rev j).isLt
        | mul i j =>
          simp only [convGate, Rect.Gate.args] at hq
          rcases List.mem_pair.mp hq with rfl | rfl
          · exact (Fin.rev i).isLt
          · exact (Fin.rev j).isLt
      | cast i =>
        intro q hq
        simp only [gates, Fin.lastCases_castSucc, Fin.val_castSucc] at hq ⊢
        exact hwf i q hq
    · intro m
      induction m using Fin.lastCases with
      | last =>
        simp only [gates, Fin.lastCases_last, Fin.val_last]
        cases g with
        | constant z =>
          simp only [convGate, Rect.Gate.Holds, hr, gatePolynomial, Rect.ratConst]
        | input v =>
          simp only [convGate, Rect.Gate.Holds, hr, gatePolynomial, Rect.ratVar]
        | add i j =>
          simp only [convGate, Rect.Gate.Holds, hr, hreg, gatePolynomial, map_add]
        | sub i j =>
          simp only [convGate, Rect.Gate.Holds, hr, hreg, gatePolynomial, map_sub]
        | mul i j =>
          simp only [convGate, Rect.Gate.Holds, hr, hreg, gatePolynomial, map_mul]
      | cast i =>
        simp only [gates, Fin.lastCases_castSucc, Fin.val_castSucc]
        rw [holds_congr (val' := valOf p) (hagree _ i.isLt)
          (fun q hq => hagree q ((hwf i q hq).trans i.isLt))]
        exact hh i

omit [Field F] in
open scoped Classical in
theorem opCount_le : ∀ {r : ℕ} (p : OAI.MatrixMultiplication.Arithmetic.Program F (OAI.MatrixMultiplication.Arithmetic.MatrixInput a b c) r),
    (Finset.univ.filter (fun m : Fin r => Rect.Gate.IsOp (gates p m))).card ≤ p.cost
  | 0, .nil => by simp
  | r + 1, .step p g => by
    have ih := opCount_le p
    have hsplit : (Finset.univ.filter
        (fun m : Fin (r + 1) => Rect.Gate.IsOp (gates (p.step g) m))).card =
        (Finset.univ.filter (fun m : Fin r => Rect.Gate.IsOp (gates p m))).card +
          (if Rect.Gate.IsOp (convGate (a := a) (b := b) (c := c) g) then 1 else 0) := by
      rw [Finset.card_filter, Finset.card_filter, Fin.sum_univ_castSucc]
      simp only [gates, Fin.lastCases_castSucc, Fin.lastCases_last]
    have hg : (if Rect.Gate.IsOp (convGate (a := a) (b := b) (c := c) g) then 1 else 0) ≤
        g.cost := by
      cases g <;> simp [convGate, Rect.Gate.IsOp, OAI.MatrixMultiplication.Arithmetic.Gate.cost]
    rw [hsplit]
    show _ ≤ p.cost + g.cost
    omega

/-- A release program as a sealed circuit. -/
def toCircuit (P : OAI.MatrixMultiplication.Arithmetic.MatrixAlgorithm F a b c) : Rect.Circuit (Rect.MatVar a b c) F :=
  ⟨P.registers, gates P.program⟩

omit [Field F] in
theorem opCount_toCircuit (P : OAI.MatrixMultiplication.Arithmetic.MatrixAlgorithm F a b c) : (toCircuit P).opCount ≤ P.cost :=
  opCount_le P.program

theorem toCircuit_computes (P : OAI.MatrixMultiplication.Arithmetic.MatrixAlgorithm F a b c) (hP : FormalCorrect P) :
    Rect.Computes F a b c (toCircuit P) := by
  obtain ⟨hwf, hh⟩ := gates_ok P.program
  refine ⟨fun m q hq => hwf m q hq, valOf P.program,
    fun i k => (Fin.rev (P.output i k) : Fin P.registers), fun m => hh m, ?_⟩
  intro i k
  unfold valOf
  rw [dite_eq_left (Fin.rev (P.output i k)).isLt]
  simp only [Fin.eta, Fin.rev_rev]
  rw [hP i k, map_sum]
  simp only [map_mul, Rect.ratX, Rect.ratY, Rect.ratVar]

end Compile

/-! ## The exponent of `n × ⌊n^β⌋ × n` with division gates -/

section Exponent

open OAI.LinearAlgebra.MatrixExponent

theorem le_of_eventually_rpow_le {t s D : ℝ}
    (h : ∀ᶠ n : ℕ in atTop, (n : ℝ) ^ t ≤ D * (n : ℝ) ^ s) : t ≤ s := by
  by_contra! hlt
  have ht : Tendsto (fun n : ℕ => (n : ℝ) ^ (t - s)) atTop atTop :=
    (tendsto_rpow_atTop (by linarith)).comp tendsto_natCast_atTop_atTop
  obtain ⟨n, hA, hB, hC⟩ :=
    (h.and ((eventually_ge_atTop 1).and (ht.eventually_gt_atTop D))).exists
  have hn0 : (0 : ℝ) < n := by exact_mod_cast hB
  have hsplit : (n : ℝ) ^ (t - s) * (n : ℝ) ^ s = (n : ℝ) ^ t := by
    rw [← Real.rpow_add hn0]
    congr 1
    ring
  have hpos : 0 < (n : ℝ) ^ s := Real.rpow_pos_of_pos hn0 s
  have := mul_lt_mul_of_pos_right hC hpos
  linarith

theorem side_le_innerDim_eventually {β c : ℝ} (hc0 : 0 ≤ c) (hcβ : c < β) :
    ∀ᶠ n : ℕ in atTop, Rectangle.side n c ≤ Rect.innerDim β n := by
  have ht : Tendsto (fun n : ℕ => (n : ℝ) ^ (β - c)) atTop atTop :=
    (tendsto_rpow_atTop (by linarith)).comp tendsto_natCast_atTop_atTop
  filter_upwards [ht.eventually_ge_atTop 3, eventually_ge_atTop 1] with n h3 hn1
  have hn : (1 : ℝ) ≤ n := by exact_mod_cast hn1
  have hn0 : (0 : ℝ) < n := by linarith
  have hc1 : 1 ≤ (n : ℝ) ^ c := Real.one_le_rpow hn hc0
  have hsplit : (n : ℝ) ^ c * (n : ℝ) ^ (β - c) = (n : ℝ) ^ β := by
    rw [← Real.rpow_add hn0]
    congr 1
    ring
  have hbig : (n : ℝ) ^ c + 2 ≤ (n : ℝ) ^ β := by
    have := mul_le_mul_of_nonneg_left h3 (by linarith : (0 : ℝ) ≤ (n : ℝ) ^ c)
    linarith
  unfold Rectangle.side Rect.innerDim
  have h1 : (⌈(n : ℝ) ^ c⌉₊ : ℝ) < (n : ℝ) ^ c + 1 := Nat.ceil_lt_add_one (by positivity)
  have h2 : (n : ℝ) ^ β < ⌊(n : ℝ) ^ β⌋₊ + 1 := Nat.lt_floor_add_one _
  have h3' : (⌈(n : ℝ) ^ c⌉₊ : ℝ) < ⌊(n : ℝ) ^ β⌋₊ := by linarith
  exact_mod_cast h3'.le

theorem side_zero_le_innerDim {β : ℝ} (hβ : 0 ≤ β) :
    ∀ᶠ n : ℕ in atTop, Rectangle.side n 0 ≤ Rect.innerDim β n := by
  filter_upwards [eventually_ge_atTop 1] with n hn
  unfold Rectangle.side Rect.innerDim
  rw [Real.rpow_zero, Nat.ceil_one]
  apply Nat.le_floor
  push_cast
  exact Real.one_le_rpow (by exact_mod_cast hn) hβ

theorem U_zero : Rectangle.U 1 1 0 = 2 := by
  norm_num [Rectangle.U, Rectangle.benchmark]

theorem two_lt_U {c : ℝ} (hc : 1 / 2 < c) (hc1 : c ≤ 1) : 2 < Rectangle.U 1 1 c := by
  rw [U_one_one (by linarith) hc1]
  have h1 : 0 < 2 * c - 1 := by linarith
  rw [max_eq_left h1.le]
  have : 0 < (2 * c - 1) ^ 2 / (4 * c) := div_pos (pow_pos h1 2) (by linarith)
  linarith

/-- Every exponent `s` with cost `O(n^s)` for `n × ⌊n^β⌋ × n`, division gates allowed, is at least
`U(1,1,c)` whenever `⌈n^c⌉ ≤ ⌊n^β⌋` for large `n`. -/
theorem U_le_of_costBigO (F : Type) [Field F] {β s c : ℝ} (hc0 : 0 ≤ c)
    (hside : ∀ᶠ n : ℕ in atTop, Rectangle.side n c ≤ Rect.innerDim β n)
    (h : Rect.CostBigO F β s) : Rectangle.U 1 1 c ≤ s := by
  obtain ⟨K, N, hN⟩ := h
  apply le_of_eventually_rpow_le (D := 2 * K)
  filter_upwards [hside, eventually_ge_atTop N, eventually_ge_atTop 2] with n hs hnN hn2
  obtain ⟨C, hC, hcost⟩ := hN n hnN
  have hr := rank_le_ops C hC
  have hlow := rank_lower_U (Rect.RF F n (Rect.innerDim β n) n) hn2 hc0 le_rfl le_rfl hs
    (rankLE_of_rankAtMost _ (rankAtMost_tensorRank _))
  calc (n : ℝ) ^ Rectangle.U 1 1 c ≤ _ := hlow
    _ ≤ ((2 * C.opCount : ℕ) : ℝ) := by exact_mod_cast hr
    _ ≤ 2 * K * (n : ℝ) ^ s := by push_cast; linarith

theorem two_le_of_costBigO (F : Type) [Field F] {β s : ℝ} (hβ : 0 ≤ β)
    (h : Rect.CostBigO F β s) : 2 ≤ s := by
  have := U_le_of_costBigO F le_rfl (side_zero_le_innerDim hβ) h
  rwa [U_zero] at this

theorem costBigO_upper (F : Type) [Field F] {β : ℝ} (hβ : β ≤ 1 / 2) {ε : ℝ} (hε : 0 < ε) :
    Rect.CostBigO F β (2 + ε) := by
  obtain ⟨C, _, hb⟩ := upper_programs F hβ hε
  refine ⟨C, 1, fun n hn => ?_⟩
  obtain ⟨P, hP, hcost⟩ := hb n hn
  exact ⟨toCircuit P, toCircuit_computes P hP, (Nat.cast_le.mpr (opCount_toCircuit P)).trans hcost⟩

theorem rectExponent_eq_two (F : Type) [Field F] {β : ℝ} (hβ0 : 0 ≤ β) (hβ : β ≤ 1 / 2) :
    Rect.rectExponent F β = 2 := by
  unfold Rect.rectExponent
  have hne : {s | Rect.CostBigO F β s}.Nonempty := ⟨2 + 1, costBigO_upper F hβ one_pos⟩
  have hbdd : BddBelow {s | Rect.CostBigO F β s} :=
    ⟨2, fun s hs => two_le_of_costBigO F hβ0 hs⟩
  apply le_antisymm
  · by_contra! hgt
    have hε : 0 < (sInf {s | Rect.CostBigO F β s} - 2) / 2 := by linarith
    have := csInf_le hbdd (costBigO_upper F hβ hε)
    linarith
  · exact le_csInf hne (fun s hs => two_le_of_costBigO F hβ0 hs)

theorem rectExponent_ne_two (F : Type) [Field F] {β : ℝ} (hβ : 1 / 2 < β) :
    Rect.rectExponent F β ≠ 2 := by
  set c := min ((β + 1 / 2) / 2) 1 with hcdef
  have hc1 : c ≤ 1 := min_le_right _ _
  have hchalf : 1 / 2 < c := lt_min (by linarith) (by norm_num)
  have hcβ : c < β := lt_of_le_of_lt (min_le_left _ _) (by linarith)
  have hU := two_lt_U hchalf hc1
  unfold Rect.rectExponent
  by_cases hne : {s | Rect.CostBigO F β s}.Nonempty
  · have hle := le_csInf hne (fun s hs => U_le_of_costBigO F (by linarith)
      (side_le_innerDim_eventually (by linarith) hcβ) hs)
    intro heq
    rw [heq] at hle
    linarith
  · rw [Set.not_nonempty_iff_eq_empty.mp hne, Real.sInf_empty]
    norm_num

/-- `α_F = 1/2` in the sealed model with division gates. -/
theorem alpha_eq (F : Type) [Field F] : Rect.alpha F = 1 / 2 := by
  unfold Rect.alpha
  apply IsGreatest.csSup_eq
  refine ⟨⟨by norm_num, rectExponent_eq_two F (by norm_num) le_rfl⟩, ?_⟩
  rintro β ⟨_, hβ⟩
  by_contra! hlt
  exact rectExponent_ne_two F hlt hβ

end Exponent

end RectProof

/-! ## The four sealed propositions -/

namespace Rect

theorem borderRankRect_holds : BorderRankRect := by
  unfold BorderRankRect
  intro F _ a b c ha hb hc
  exact RectProof.borderRank_main F a b c ha hb hc

theorem asymptoticRankRect_holds : AsymptoticRankRect := by
  unfold AsymptoticRankRect
  intro F _ a b c ha hb hc
  exact RectProof.asymptoticRank_main F a b c ha hb hc

theorem alphaBounds_holds : AlphaBounds := by
  unfold AlphaBounds
  intro F _
  rw [RectProof.alpha_eq F]
  norm_num

theorem dualExponentDiv_holds : DualExponentDiv := by
  unfold DualExponentDiv
  intro F _
  exact RectProof.alpha_eq F

end Rect

end
