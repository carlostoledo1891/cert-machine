import Textbook
import OAI.Probability.CriticalZ3.Main

/-!
# Bridge O: OpenAI's critical bond percolation on ℤ³ implies the hand-written textbook statement at d = 3

`bridgeO` takes as its only hypothesis the bond conjunct of `OAI.CriticalZ3.critical_no_infinite`, written as in
`ComparatorChallenges/CriticalZ3.lean`, and proves `TextbookPercolation.Statement3`. Inside `bridgeO` only elementary
facts of OpenAI's development are used (the definitions, measurability of the infinite-cluster event, the product
reindexing lemma, `bondCritical ∈ [0, 1]`, nonemptiness of the supercritical set); their critical theorem enters only
through the hypothesis. `statement3_from_openai` then applies `bridgeO` to their theorem.

The steps:
1. a bijection `Bond ≃ Edge 3`, (x, i) ↦ {x, step x i}, and `Adjacent x y ↔ NearestNeighbor x y`;
2. `P 3 p` pushed forward along that bijection is `bondLaw p` (for p ∈ [0, 1], `parameter p = p`);
3. the open clusters agree, so θ(p) is their `bondLaw p (bondInfiniteAt 0)`;
4. monotonicity of p ↦ `bondLaw p (bondInfiniteAt 0)`, by the standard coupling (proved here: OpenAI's ℤ³ library
   does not state it): `bondLaw p` is the image of i.i.d. uniform labels U under `U_b ≤ parameter p`;
5. Grimmett's p_c = sup {θ = 0} equals OpenAI's `bondCritical` = inf {θ > 0}, and θ(p_c) = 0.
-/

namespace BridgeO

open MeasureTheory ProbabilityTheory
open OAI.CriticalZ3

/-! ## 1. Edges: `Bond ≃ Edge 3` -/

theorem adjacent_step (x : Vertex) (i : Fin 3) : TextbookPercolation.Adjacent x (step x i) := by
  unfold TextbookPercolation.Adjacent
  fin_cases i <;> simp [Fin.sum_univ_three, step]

theorem abs_sum_three {a b c : ℤ} (h : |a| + |b| + |c| = 1) :
    (a = 1 ∨ a = -1) ∧ b = 0 ∧ c = 0 ∨ a = 0 ∧ (b = 1 ∨ b = -1) ∧ c = 0 ∨
      a = 0 ∧ b = 0 ∧ (c = 1 ∨ c = -1) := by
  rcases abs_cases a with ⟨ha, _⟩ | ⟨ha, _⟩ <;> rcases abs_cases b with ⟨hb, _⟩ | ⟨hb, _⟩ <;>
    rcases abs_cases c with ⟨hc, _⟩ | ⟨hc, _⟩ <;> rw [ha, hb, hc] at h <;> omega

/-- y is the i-th forward neighbour of x when it differs from x by one in coordinate i only. -/
theorem eq_step_of {x y : Vertex} (i : Fin 3) (hi : y i - x i = 1)
    (ho : ∀ j, j ≠ i → y j - x j = 0) : y = step x i := by
  funext j
  by_cases hj : i = j
  · subst hj
    simp only [step, ite_true]
    omega
  · have := ho j (Ne.symm hj)
    simp only [step, hj, ite_false]
    omega

theorem adjacent_iff (x y : Vertex) :
    TextbookPercolation.Adjacent x y ↔ ∃ i : Fin 3, y = step x i ∨ x = step y i := by
  constructor
  · intro h
    have h3 : |x 0 - y 0| + |x 1 - y 1| + |x 2 - y 2| = 1 := by
      have h' := h
      unfold TextbookPercolation.Adjacent at h'
      rwa [Fin.sum_univ_three] at h'
    have hfin : ∀ j : Fin 3, j = 0 ∨ j = 1 ∨ j = 2 := by decide
    rcases abs_sum_three h3 with ⟨h0 | h0, h1, h2⟩ | ⟨h0, h1 | h1, h2⟩ | ⟨h0, h1, h2 | h2⟩
    · refine ⟨0, Or.inr (eq_step_of 0 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
    · refine ⟨0, Or.inl (eq_step_of 0 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
    · refine ⟨1, Or.inr (eq_step_of 1 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
    · refine ⟨1, Or.inl (eq_step_of 1 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
    · refine ⟨2, Or.inr (eq_step_of 2 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
    · refine ⟨2, Or.inl (eq_step_of 2 (by omega) fun j hj => ?_)⟩
      rcases hfin j with rfl | rfl | rfl <;> first | exact absurd rfl hj | omega
  · rintro ⟨i, rfl | rfl⟩
    · exact adjacent_step x i
    · rw [TextbookPercolation.adjacent_comm]
      exact adjacent_step y i

/-- The bond (x, i) of OpenAI's encoding is the textbook edge {x, step x i}. -/
def toEdge (b : Bond) : TextbookPercolation.Edge 3 :=
  ⟨s(b.1, step b.1 b.2), adjacent_step b.1 b.2⟩

theorem step_inj {x : Vertex} {i j : Fin 3} (h : step x i = step x j) : i = j := by
  by_contra hij
  have := congrFun h i
  simp [step, Ne.symm hij] at this

theorem step_step_ne (x : Vertex) (i j : Fin 3) : step (step x i) j ≠ x := by
  intro h
  have := congrFun h i
  simp only [step] at this
  split_ifs at this <;> omega

theorem toEdge_injective : Function.Injective toEdge := by
  rintro ⟨x, i⟩ ⟨y, j⟩ h
  have h' : s(x, step x i) = s(y, step y j) := congrArg Subtype.val h
  rcases Sym2.eq_iff.mp h' with ⟨rfl, h2⟩ | ⟨h1, h2⟩
  · rw [step_inj h2]
  · subst h1
    exact absurd h2 (step_step_ne y j i)

theorem toEdge_surjective : Function.Surjective toEdge := by
  rintro ⟨e, he⟩
  revert he
  refine Sym2.ind (fun x y he => ?_) e
  have hxy : TextbookPercolation.Adjacent x y := he
  obtain ⟨i, rfl | rfl⟩ := (adjacent_iff x y).mp hxy
  · exact ⟨(x, i), rfl⟩
  · exact ⟨(y, i), Subtype.ext (show s(y, step y i) = s(step y i, y) from Sym2.eq_swap)⟩

/-- OpenAI's bonds and the textbook edges of ℤ³ are in bijection. -/
noncomputable def bondEquiv : Bond ≃ TextbookPercolation.Edge 3 :=
  Equiv.ofBijective toEdge ⟨toEdge_injective, toEdge_surjective⟩

/-! ## 2–3. The laws and the clusters agree -/

/-- A textbook configuration read as an OpenAI bond configuration. -/
noncomputable def pull (ω : TextbookPercolation.Edge 3 → Bool) : BondConfig := fun b => ω (bondEquiv b)

theorem measurable_pull : Measurable pull :=
  measurable_pi_lambda _ fun b => measurable_pi_apply (bondEquiv b)

theorem openEdge_iff (ω : TextbookPercolation.Edge 3 → Bool) (x y : Vertex) :
    TextbookPercolation.OpenEdge ω x y ↔ BondOpen (pull ω) x y := by
  constructor
  · rintro ⟨h, hω⟩
    obtain ⟨i, rfl | rfl⟩ := (adjacent_iff x y).mp h
    · exact Or.inl ⟨i, rfl, hω⟩
    · refine Or.inr ⟨i, rfl, ?_⟩
      have he : bondEquiv (y, i) = ⟨s(step y i, y), h⟩ :=
        Subtype.ext (show s(y, step y i) = s(step y i, y) from Sym2.eq_swap)
      show ω (bondEquiv (y, i)) = true
      rw [he]
      exact hω
  · rintro (⟨i, rfl, hω⟩ | ⟨i, rfl, hω⟩)
    · exact ⟨adjacent_step x i, hω⟩
    · have h : TextbookPercolation.Adjacent (step y i) y := by
        rw [TextbookPercolation.adjacent_comm]
        exact adjacent_step y i
      refine ⟨h, ?_⟩
      have he : bondEquiv (y, i) = ⟨s(step y i, y), h⟩ :=
        Subtype.ext (show s(y, step y i) = s(step y i, y) from Sym2.eq_swap)
      rw [← he]
      exact hω

theorem cluster_eq (ω : TextbookPercolation.Edge 3 → Bool) (x : Vertex) :
    TextbookPercolation.cluster ω x = bondCluster (pull ω) x := by
  have hr : TextbookPercolation.OpenEdge ω = BondOpen (pull ω) := by
    funext a b
    exact propext (openEdge_iff ω a b)
  ext y
  show Relation.ReflTransGen (TextbookPercolation.OpenEdge ω) x y ↔
    Relation.ReflTransGen (BondOpen (pull ω)) x y
  rw [hr]

theorem event_eq :
    {ω : TextbookPercolation.Edge 3 → Bool | (TextbookPercolation.cluster ω 0).Infinite} =
      pull ⁻¹' bondInfiniteAt 0 := by
  ext ω
  show (TextbookPercolation.cluster ω 0).Infinite ↔ (bondCluster (pull ω) 0).Infinite
  rw [cluster_eq]

theorem parameter_unit (p : unitInterval) : parameter (p : ℝ) = p :=
  Subtype.ext (parameter_coe p.2)

theorem P_map_pull (p : unitInterval) : (TextbookPercolation.P 3 p).map pull = bondLaw (p : ℝ) := by
  have h := OAI.ProductCylinder.map_reindex bondEquiv (fun _ => p)
  have hb : bondLaw (p : ℝ) = OAI.ProductCylinder.law (fun _ : Bond => parameter (p : ℝ)) := rfl
  rw [hb, parameter_unit]
  exact h

/-- Our θ(p) is OpenAI's probability that the origin's bond cluster is infinite. -/
theorem theta_eq (p : unitInterval) :
    TextbookPercolation.θ 3 p = (bondLaw (p : ℝ) (bondInfiniteAt 0)).toReal := by
  have h : TextbookPercolation.P 3 p
      {ω : TextbookPercolation.Edge 3 → Bool | (TextbookPercolation.cluster ω 0).Infinite} =
      bondLaw (p : ℝ) (bondInfiniteAt 0) := by
    rw [event_eq, ← P_map_pull p, Measure.map_apply measurable_pull (measurableSet_bondInfiniteAt 0)]
  unfold TextbookPercolation.θ
  rw [h]

theorem theta_zero_iff (p : unitInterval) :
    TextbookPercolation.θ 3 p = 0 ↔ bondLaw (p : ℝ) (bondInfiniteAt 0) = 0 := by
  rw [theta_eq, ENNReal.toReal_eq_zero_iff]
  simp [measure_ne_top]

/-! ## 4. Monotonicity in p, by the uniform coupling -/

/-- A uniform label t opens a bond at level p when t ≤ p. -/
noncomputable def thr (p : unitInterval) (t : unitInterval) : Bool := decide (t ≤ p)

theorem measurable_thr (p : unitInterval) : Measurable (thr p) := by
  apply measurable_to_bool
  have : thr p ⁻¹' {true} = Set.Iic p := by
    ext t
    simp [thr]
  rw [this]
  exact measurableSet_Iic

theorem map_thr (p : unitInterval) :
    (volume : Measure unitInterval).map (thr p) = bernoulliMeasure true false p := by
  apply Measure.ext_of_singleton
  intro b
  rw [Measure.map_apply (measurable_thr p) (measurableSet_singleton b)]
  cases b
  · have : thr p ⁻¹' {false} = Set.Ioi p := by
      ext t
      simp [thr]
    rw [this, unitInterval.volume_Ioi,
      bernoulliMeasure_apply_of_notMem_of_mem p (measurableSet_singleton false) (by simp) (by simp),
      ← unitInterval.coe_symm_eq, ← unitInterval.coe_toNNReal (unitInterval.symm p),
      ENNReal.ofReal_coe_nnreal]
  · have : thr p ⁻¹' {true} = Set.Iic p := by
      ext t
      simp [thr]
    rw [this, unitInterval.volume_Iic,
      bernoulliMeasure_apply_of_mem_of_notMem p (measurableSet_singleton true) (by simp) (by simp),
      ← unitInterval.coe_toNNReal p, ENNReal.ofReal_coe_nnreal]

/-- The law of i.i.d. uniform labels on the bonds. -/
noncomputable def labels : Measure (Bond → unitInterval) :=
  Measure.infinitePi fun _ => (volume : Measure unitInterval)

/-- The bonds open at level p under the labels u. -/
noncomputable def thrConfig (p : unitInterval) (u : Bond → unitInterval) : BondConfig :=
  fun b => thr p (u b)

theorem measurable_thrConfig (p : unitInterval) : Measurable (thrConfig p) :=
  measurable_pi_lambda _ fun b => (measurable_thr p).comp (measurable_pi_apply b)

theorem bondLaw_eq_map (p : ℝ) : bondLaw p = labels.map (thrConfig (parameter p)) := by
  unfold bondLaw labels thrConfig
  rw [Measure.infinitePi_map_pi _ (fun _ => measurable_thr (parameter p))]
  simp only [map_thr]

theorem bondOpen_mono {ω ω' : BondConfig} (h : ∀ b, ω b = true → ω' b = true) {x y : Vertex}
    (hxy : BondOpen ω x y) : BondOpen ω' x y := by
  rcases hxy with ⟨i, hy, hi⟩ | ⟨i, hx, hi⟩
  · exact Or.inl ⟨i, hy, h _ hi⟩
  · exact Or.inr ⟨i, hx, h _ hi⟩

theorem bondCluster_mono {ω ω' : BondConfig} (h : ∀ b, ω b = true → ω' b = true) (x : Vertex) :
    bondCluster ω x ⊆ bondCluster ω' x := by
  intro y hy
  exact Relation.ReflTransGen.mono (fun a b hab => bondOpen_mono h hab) x y hy

theorem thr_mono {p q : unitInterval} (hpq : p ≤ q) (t : unitInterval) (h : thr p t = true) :
    thr q t = true := by
  simp only [thr, decide_eq_true_eq] at h ⊢
  exact h.trans hpq

theorem parameter_mono {p q : ℝ} (hpq : p ≤ q) : parameter p ≤ parameter q := by
  show max 0 (min 1 p) ≤ max 0 (min 1 q)
  exact max_le_max le_rfl (min_le_min le_rfl hpq)

/-- θ is monotone in p (in OpenAI's encoding, for every real p, through `parameter`). -/
theorem bondLaw_infinite_mono {p q : ℝ} (hpq : p ≤ q) :
    bondLaw p (bondInfiniteAt 0) ≤ bondLaw q (bondInfiniteAt 0) := by
  rw [bondLaw_eq_map p, bondLaw_eq_map q,
    Measure.map_apply (measurable_thrConfig _) (measurableSet_bondInfiniteAt 0),
    Measure.map_apply (measurable_thrConfig _) (measurableSet_bondInfiniteAt 0)]
  apply measure_mono
  intro u hu
  exact Set.Infinite.mono
    (bondCluster_mono (fun b => thr_mono (parameter_mono hpq) (u b)) 0) hu

/-! ## 5. Grimmett's p_c is OpenAI's `bondCritical`, and θ(p_c) = 0 -/

theorem pc_eq (hcrit : bondLaw bondCritical (bondInfiniteAt 0) = 0) :
    TextbookPercolation.pc 3 = bondCritical := by
  unfold TextbookPercolation.pc
  apply IsGreatest.csSup_eq
  constructor
  · exact ⟨bondCritical_mem, (theta_zero_iff ⟨bondCritical, bondCritical_mem⟩).mpr hcrit⟩
  · rintro p ⟨hp, h0⟩
    by_contra hlt
    push Not at hlt
    obtain ⟨q, ⟨_, hqpos⟩, hqp⟩ := exists_lt_of_csInf_lt bond_supercritical_nonempty hlt
    have h0' : bondLaw p (bondInfiniteAt 0) = 0 := (theta_zero_iff ⟨p, hp⟩).mp h0
    have h1 : 0 < bondLaw p (bondInfiniteAt 0) := hqpos.trans_le (bondLaw_infinite_mono hqp.le)
    rw [h0'] at h1
    exact lt_irrefl _ h1

/-- **The bridge.** The bond conjunct of `OAI.CriticalZ3.critical_no_infinite`, as written in the challenge, implies
the textbook statement θ(p_c) = 0 at d = 3. -/
theorem bridgeO
    (h : ∀ᵐ ω ∂bondLaw bondCritical, ∀ x : Vertex, (bondCluster ω x).Finite) :
    TextbookPercolation.Statement3 := by
  have hcrit : bondLaw bondCritical (bondInfiniteAt 0) = 0 := by
    rw [ae_iff] at h
    apply measure_mono_null _ h
    intro ω hω
    simp only [Set.mem_setOf_eq]
    intro hall
    exact (show (bondCluster ω 0).Infinite from hω) (hall 0)
  unfold TextbookPercolation.Statement3
  rw [pc_eq hcrit]
  exact ⟨bondCritical_mem, (theta_zero_iff ⟨bondCritical, bondCritical_mem⟩).mpr hcrit⟩

/-- OpenAI's theorem, through the bridge. -/
theorem statement3_from_openai : TextbookPercolation.Statement3 :=
  bridgeO OAI.CriticalZ3.critical_no_infinite.1

end BridgeO

#print axioms BridgeO.bridgeO
#print axioms BridgeO.statement3_from_openai
