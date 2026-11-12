import Mathlib
import Textbook
import Solution

/-!
# Bridge A: Anthropic's `percolation_continuity` implies the hand-written `TextbookPercolation.Statement`

The two encodings of Bernoulli bond percolation on `ℤ^d` are shown to agree:

1. adjacency: `TextbookPercolation.Adjacent x y ↔ (BondPercolation.zdGraph d).Adj x y` (`adjacent_iff`);
2. the measure: our `P d p` on `Edge d → Bool`, pushed forward along `ω ↦ {e | ∃ h, ω ⟨e, h⟩ = true}`, is
   `setBernoulli (zdGraph d).edgeSet p` (`map_toSet`, by `Measure.eq_infinitePi` on boxes);
3. the clusters agree under that map (`cluster_eq`), so `θ d p = theta (zdGraph d) 0 p` for every `p` (`θ_eq`);
4. the two critical points agree (`pc_eq`): the supremum of `{θ = 0}` is the infimum of `{θ > 0} ∪ {1}`, by the
   monotonicity of `θ` (`Percolation.Literature.theta_mono_holds`), `θ ≥ 0` and `θ(0) = 0`
   (`Percolation.Literature.theta_bot`);
5. conclusion (`bridgeA`, `statement_from_anthropic`).
-/

open MeasureTheory ProbabilityTheory

namespace BridgeA

open TextbookPercolation

/-- The edge predicate of the textbook encoding, on unordered pairs. -/
abbrev IsEdge {d : ℕ} (e : Sym2 (Vertex d)) : Prop :=
  Sym2.lift ⟨fun x y => Adjacent x y, adjacent_comm⟩ e

/-! ### Step 1: adjacency -/

theorem adjacent_iff {d : ℕ} (x y : Vertex d) :
    Adjacent x y ↔ (BondPercolation.zdGraph d).Adj x y := by
  rw [show (BondPercolation.zdGraph d).Adj x y ↔
      (Percolation.Literature.LatticeModels.zdGraph d).Adj x y from Iff.rfl,
    Percolation.Literature.LatticeModels.zdGraph_adj_iff]
  unfold Adjacent
  constructor
  · intro h
    have hne : ∃ i, x i ≠ y i := by
      by_contra hcon
      push Not at hcon
      simp [hcon] at h
    obtain ⟨i, hi⟩ := hne
    have hsplit := Finset.add_sum_erase Finset.univ (fun j => |x j - y j|) (Finset.mem_univ i)
    rw [h] at hsplit
    have hpos : 1 ≤ |x i - y i| := Int.one_le_abs (sub_ne_zero.mpr hi)
    have hrest_nonneg : 0 ≤ ∑ j ∈ Finset.univ.erase i, |x j - y j| :=
      Finset.sum_nonneg (fun j _ => abs_nonneg _)
    have hi1 : |x i - y i| = 1 := by omega
    have hrest : ∑ j ∈ Finset.univ.erase i, |x j - y j| = 0 := by omega
    rw [Finset.sum_eq_zero_iff_of_nonneg (fun j _ => abs_nonneg _)] at hrest
    have hothers : ∀ j, j ≠ i → x j = y j := fun j hj => by
      have := hrest j (Finset.mem_erase.mpr ⟨hj, Finset.mem_univ j⟩)
      exact sub_eq_zero.mp (abs_eq_zero.mp this)
    refine ⟨i, ?_⟩
    rcases (abs_eq (zero_le_one' ℤ)).mp hi1 with h1 | h1
    · right
      funext j
      rcases eq_or_ne j i with rfl | hj
      · simp only [Pi.add_apply, Pi.single_eq_same]; omega
      · simp [hj, hothers j hj]
    · left
      funext j
      rcases eq_or_ne j i with rfl | hj
      · simp only [Pi.add_apply, Pi.single_eq_same]; omega
      · simp [hj, hothers j hj]
  · rintro ⟨i, h | h⟩
    · subst h
      rw [Finset.sum_eq_single i (fun j _ hj => by simp [hj]) (by simp)]
      simp
    · subst h
      rw [Finset.sum_eq_single i (fun j _ hj => by simp [hj]) (by simp)]
      simp

theorem isEdge_iff {d : ℕ} (e : Sym2 (Vertex d)) :
    IsEdge e ↔ e ∈ (BondPercolation.zdGraph d).edgeSet := by
  refine Sym2.ind (fun x y => ?_) e
  rw [SimpleGraph.mem_edgeSet]
  exact adjacent_iff x y

theorem ne_of_adjacent {d : ℕ} {x y : Vertex d} (h : Adjacent x y) : x ≠ y := by
  rintro rfl
  simp [Adjacent] at h

/-! ### Step 2: the measure -/

/-- The open pairs of a configuration, as a predicate on `Sym2`. -/
def toProp {d : ℕ} (ω : Edge d → Bool) : Sym2 (Vertex d) → Prop :=
  fun e => ∃ h : IsEdge e, ω ⟨e, h⟩ = true

/-- The open pairs of a configuration, as a set of unordered pairs (a bond configuration). -/
def toSet {d : ℕ} (ω : Edge d → Bool) : Set (Sym2 (Vertex d)) := {e | toProp ω e}

theorem mem_toSet {d : ℕ} (ω : Edge d → Bool) (e : Sym2 (Vertex d)) :
    e ∈ toSet ω ↔ ∃ h : IsEdge e, ω ⟨e, h⟩ = true := Iff.rfl

theorem toProp_of_isEdge {d : ℕ} (ω : Edge d → Bool) {e : Sym2 (Vertex d)} (h : IsEdge e) :
    toProp ω e = (ω ⟨e, h⟩ = true) :=
  propext ⟨fun ⟨_, h'⟩ => h', fun h' => ⟨h, h'⟩⟩

theorem toProp_of_not_isEdge {d : ℕ} (ω : Edge d → Bool) {e : Sym2 (Vertex d)} (h : ¬ IsEdge e) :
    toProp ω e = False :=
  propext ⟨fun ⟨h', _⟩ => h h', False.elim⟩

theorem measurable_toProp {d : ℕ} : Measurable (toProp (d := d)) := by
  refine measurable_pi_lambda _ fun e => ?_
  refine measurableSet_setOf.mp ?_
  by_cases h : IsEdge e
  · have : {ω : Edge d → Bool | toProp ω e} = (fun ω => ω ⟨e, h⟩) ⁻¹' {true} := by
      ext ω; simp [toProp_of_isEdge ω h]
    rw [this]
    exact measurable_pi_apply _ (measurableSet_singleton true)
  · have : {ω : Edge d → Bool | toProp ω e} = ∅ := by
      ext ω; simp [toProp_of_not_isEdge ω h]
    rw [this]
    exact MeasurableSet.empty

theorem measurable_toSet {d : ℕ} : Measurable (toSet (d := d)) :=
  measurable_setOf.comp measurable_toProp

/-- The factor measures of Mathlib's `setBernoulli (zdGraph d).edgeSet p`. -/
noncomputable def ν {d : ℕ} (p : unitInterval) (e : Sym2 (Vertex d)) : Measure Prop :=
  unitInterval.toNNReal p • Measure.dirac (e ∈ (BondPercolation.zdGraph d).edgeSet) +
    unitInterval.toNNReal (unitInterval.symm p) • Measure.dirac False

instance {d : ℕ} (p : unitInterval) (e : Sym2 (Vertex d)) : IsProbabilityMeasure (ν p e) := by
  unfold ν
  exact (inferInstance : IsProbabilityMeasure (bernoulliMeasure _ False p))

theorem map_toProp {d : ℕ} (p : unitInterval) :
    (P d p).map toProp = Measure.infinitePi (ν (d := d) p) := by
  classical
  refine Measure.eq_infinitePi _ fun s t ht => ?_
  rw [Measure.map_apply measurable_toProp (MeasurableSet.pi s.countable_toSet fun i _ => ht i)]
  by_cases C : ∀ i ∈ s, ¬ IsEdge i → False ∈ t i
  · -- the preimage is a box over the edges of `s`
    obtain ⟨s', hs'⟩ : ∃ s' : Finset (Edge d), s' = s.subtype IsEdge := ⟨_, rfl⟩
    have hmem : ∀ j : Edge d, j ∈ s' ↔ j.1 ∈ s := fun j => by
      rw [hs']; exact Finset.mem_subtype
    have hpre : toProp ⁻¹' (Set.pi (↑s) t) =
        Set.pi (↑s') (fun j : Edge d => (fun b : Bool => b = true) ⁻¹' t j.1) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, hmem]
      constructor
      · intro hω j hj
        have := hω j.1 hj
        rwa [toProp_of_isEdge ω j.2] at this
      · intro hω i hi
        by_cases hE : IsEdge i
        · rw [toProp_of_isEdge ω hE]
          exact hω ⟨i, hE⟩ hi
        · rw [toProp_of_not_isEdge ω hE]
          exact C i hi hE
    have hnon : ∏ i ∈ s with ¬ IsEdge i, ν (d := d) p i (t i) = 1 := by
      refine Finset.prod_eq_one fun i hi => ?_
      rw [Finset.mem_filter] at hi
      have hF : (i ∈ (BondPercolation.zdGraph d).edgeSet) = False :=
        propext ⟨fun h' => hi.2 ((isEdge_iff i).mpr h'), False.elim⟩
      have hFt : False ∈ t i := C i hi.1 hi.2
      simp only [ν, hF, Measure.add_apply, Measure.smul_apply, Measure.dirac_apply_of_mem hFt,
        ENNReal.smul_def, smul_eq_mul, mul_one]
      rw [← ENNReal.coe_add, unitInterval.toNNReal_add_toNNReal_symm, ENNReal.coe_one]
    have hprod : ∏ i ∈ s with IsEdge i, ν (d := d) p i (t i) = ∏ j ∈ s', ν (d := d) p j.1 (t j.1) := by
      rw [hs']; exact (Finset.prod_subtype_eq_prod_filter _).symm
    rw [hpre, P, Measure.infinitePi_pi _ (fun _ _ => MeasurableSet.of_discrete),
      ← Finset.prod_filter_mul_prod_filter_not s IsEdge, hnon, mul_one, hprod]
    refine Finset.prod_congr rfl fun j _ => ?_
    have hb : MeasurableSet (t j.1) := ht j.1
    rw [← Measure.map_apply (measurable_of_countable (fun b : Bool => b = true)) hb,
      map_bernoulliMeasure' _ _ (measurable_of_countable (fun b : Bool => b = true))]
    have hT : (j.1 ∈ (BondPercolation.zdGraph d).edgeSet) = True :=
      propext ⟨fun _ => trivial, fun _ => (isEdge_iff j.1).mp j.2⟩
    have hν : ν (d := d) p j.1 = bernoulliMeasure True False p := by
      unfold ν; rw [hT, bernoulliMeasure_def]
    have hF : (false = true) = False := propext ⟨Bool.false_ne_true, False.elim⟩
    simp only [hF]
    rw [hν]
  · -- some non-edge of `s` is asked to be open: the preimage is empty, and so is a factor
    push Not at C
    obtain ⟨i, hi, hE, hFt⟩ := C
    have hpre : toProp ⁻¹' (Set.pi (↑s) t) = (∅ : Set (Edge d → Bool)) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Set.mem_empty_iff_false, iff_false]
      intro hω
      have := hω i hi
      rw [toProp_of_not_isEdge ω hE] at this
      exact hFt this
    rw [hpre, measure_empty]
    refine (Finset.prod_eq_zero hi ?_).symm
    have hF : (i ∈ (BondPercolation.zdGraph d).edgeSet) = False :=
      propext ⟨fun h' => hE ((isEdge_iff i).mpr h'), False.elim⟩
    simp only [ν, hF, Measure.add_apply, Measure.smul_apply, Measure.dirac_apply,
      Set.indicator_of_notMem hFt, ENNReal.smul_def, smul_eq_mul, mul_zero, add_zero]

/-- **Step 2.** Our product measure, read as a random set of unordered pairs, is Mathlib's `setBernoulli` on the
edge set of `zdGraph d`, i.e. Anthropic's `bondPercolation (zdGraph d) p`. -/
theorem map_toSet {d : ℕ} (p : unitInterval) :
    (P d p).map toSet = BondPercolation.bondPercolation (BondPercolation.zdGraph d) p := by
  unfold BondPercolation.bondPercolation
  rw [setBernoulli_eq_map, show (toSet (d := d)) = (fun q : Sym2 (Vertex d) → Prop => {e | q e}) ∘ toProp
    from rfl, ← Measure.map_map measurable_setOf measurable_toProp, map_toProp]
  rfl

/-! ### Step 3: clusters and θ -/

theorem openEdge_eq {d : ℕ} (ω : Edge d → Bool) :
    OpenEdge ω = (BondPercolation.openGraph (toSet ω)).Adj := by
  funext a b
  apply propext
  unfold OpenEdge
  rw [BondPercolation.openGraph, SimpleGraph.fromEdgeSet_adj, mem_toSet]
  constructor
  · rintro ⟨h, hω⟩
    exact ⟨⟨h, hω⟩, ne_of_adjacent h⟩
  · rintro ⟨⟨h, hω⟩, -⟩
    exact ⟨h, hω⟩

theorem cluster_eq {d : ℕ} (ω : Edge d → Bool) (x : Vertex d) :
    cluster ω x = BondPercolation.openCluster (toSet ω) x := by
  ext y
  simp only [cluster, BondPercolation.openCluster, Set.mem_setOf_eq,
    SimpleGraph.reachable_iff_reflTransGen, openEdge_eq]

/-- **Step 3.** The two percolation probabilities agree at every `p`. -/
theorem θ_eq (d : ℕ) (p : unitInterval) :
    θ d p = BondPercolation.theta (BondPercolation.zdGraph d) (0 : Vertex d) p := by
  have hmeas : MeasurableSet (BondPercolation.percolatesAt (0 : Vertex d)) :=
    Percolation.Literature.measurableSet_percolatesAt_holds (V := Vertex d) 0
  rw [θ, BondPercolation.theta, measureReal_def, ← map_toSet p,
    Measure.map_apply measurable_toSet hmeas]
  congr 2
  ext ω
  simp only [Set.mem_setOf_eq, Set.mem_preimage, BondPercolation.percolatesAt, cluster_eq]

/-! ### Step 4: the critical points -/

/-- **Step 4.** Grimmett's `sup {θ = 0}` equals Anthropic's `inf ({θ > 0} ∪ {1})`. -/
theorem pc_eq (d : ℕ) : pc d = BondPercolation.criticalProb (BondPercolation.zdGraph d) (0 : Vertex d) := by
  unfold pc BondPercolation.criticalProb
  simp_rw [θ_eq d]
  set f := BondPercolation.theta (BondPercolation.zdGraph d) (0 : Vertex d) with hf
  have hmono : Monotone f :=
    Percolation.Literature.theta_mono_holds (V := Vertex d) (BondPercolation.zdGraph d) 0
  have hnn : ∀ q, 0 ≤ f q := fun _ => measureReal_nonneg
  have hf0 : f 0 = 0 := Percolation.Literature.theta_bot (BondPercolation.zdGraph d) (0 : Vertex d)
  set Z := {p : ℝ | ∃ h : p ∈ Set.Icc (0 : ℝ) 1, f ⟨p, h⟩ = 0} with hZ
  set Q := {p : ℝ | ∃ h : p ∈ unitInterval, 0 < f ⟨p, h⟩} ∪ {1} with hQ
  have h0Z : (0 : ℝ) ∈ Z := ⟨⟨le_refl 0, zero_le_one⟩, hf0⟩
  have hZne : Z.Nonempty := ⟨0, h0Z⟩
  have hZbdd : BddAbove Z := ⟨1, fun p ⟨h, _⟩ => h.2⟩
  have hQne : Q.Nonempty := ⟨1, Or.inr rfl⟩
  have hQbdd : BddBelow Q := ⟨0, fun p hp => by
    rcases hp with ⟨h, _⟩ | hp
    · exact h.1
    · rw [Set.mem_singleton_iff.mp hp]; exact zero_le_one⟩
  have hZQ : ∀ z ∈ Z, ∀ q ∈ Q, z ≤ q := by
    rintro z ⟨hz, hz0⟩ q hq
    rcases hq with ⟨hq, hqpos⟩ | hq
    · by_contra hzq
      push Not at hzq
      have := hmono (show (⟨q, hq⟩ : unitInterval) ≤ ⟨z, hz⟩ from hzq.le)
      linarith
    · rw [Set.mem_singleton_iff.mp hq]; exact hz.2
  apply le_antisymm
  · exact csSup_le hZne fun z hz => le_csInf hQne (hZQ z hz)
  · by_contra hlt
    push Not at hlt
    have ha0 : 0 ≤ sSup Z := le_csSup hZbdd h0Z
    have hb1 : sInf Q ≤ 1 := csInf_le hQbdd (Or.inr rfl)
    have hm : (sSup Z + sInf Q) / 2 ∈ Set.Icc (0 : ℝ) 1 := ⟨by linarith, by linarith⟩
    have hmZ : (sSup Z + sInf Q) / 2 ∉ Z := fun hmZ => by
      have := le_csSup hZbdd hmZ
      linarith
    have hpos : 0 < f ⟨_, hm⟩ := lt_of_le_of_ne (hnn _) (fun h0 => hmZ ⟨hm, h0.symm⟩)
    have : sInf Q ≤ (sSup Z + sInf Q) / 2 := csInf_le hQbdd (Or.inl ⟨hm, hpos⟩)
    linarith

end BridgeA

/-! ### Step 5: the bridge -/

open TextbookPercolation in
/-- **Bridge A.** Anthropic's compared statement, for every `d ≥ 2`, implies the hand-written textbook statement. -/
theorem bridgeA (h : ∀ d, 2 ≤ d → BondPercolation.PercolationContinuity d) :
    TextbookPercolation.Statement := by
  intro d hd
  have hpc := BridgeA.pc_eq d
  have hmem : pc d ∈ Set.Icc (0 : ℝ) 1 :=
    hpc ▸ BondPercolation.criticalProb_mem_Icc (BondPercolation.zdGraph d) (0 : Vertex d)
  refine ⟨hmem, ?_⟩
  rw [BridgeA.θ_eq]
  have hI : (⟨pc d, hmem⟩ : unitInterval) = BondPercolation.criticalProbI d := Subtype.ext hpc
  rw [hI]
  exact h d hd

/-- The textbook statement, from Anthropic's proved theorem. -/
theorem statement_from_anthropic : TextbookPercolation.Statement :=
  bridgeA (fun d hd => BondPercolation.percolation_continuity d hd)
