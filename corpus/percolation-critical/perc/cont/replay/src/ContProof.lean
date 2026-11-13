import Mathlib
import Textbook
import ContStatement
import Bridge
import UnitAux
import Solution
import Percolation.Literature.UniformPercolation
import Percolation.Literature.HalfSpaceBGN
import Percolation.Literature.UniquenessInfiniteCluster
import Percolation.Literature.ConnectivityProofs
import Percolation.Literature.BernoulliPercolationProofs
import Percolation.Literature.CriticalContinuityProofs

/-!
# θ is continuous on [0, 1] for bond percolation on ℤ^d, d ≥ 2 — on top of Anthropic's library

The classical proof (Grimmett, *Percolation*, 2nd ed., §8.3; van den Berg–Keane 1984), joined from pieces of
the lab's library (anthropics/formal-math 795efb86, `percolation/`) and our bridge A:

1. **upper semicontinuity** (`theta_upper`): θ = lim θ_n with θ ≤ θ_n and θ_n continuous in p
   (the lab's `tendsto_real_siteToBoundary`, `theta_le_real_siteToBoundary`,
   `continuous_bondPercolation_real_of_determinedBy`, `determinedBy_siteToBoundary`); with the lab's
   monotonicity `theta_mono_holds` this is right-continuity (`theta_rightCont`);
2. **van den Berg–Keane** (`exists_lt_theta`, `theta_lower`): in the lab's uniform-label coupling
   (`labelMeasure`, `configOfLabels`, `map_configOfLabels_holds`), if θ(p₁) > 0 and p₁ < p then almost surely,
   on the event that the origin percolates at level p, it already percolates at some level q_k < p: the infinite
   cluster at level p₁ exists (the lab's zero–one law `Grimmett1999_prob_exists_percolatesAt_holds`), it is
   inside the unique infinite cluster at level p (the lab's uniqueness theorem
   `Grimmett1999_numInfiniteClusters_le_one_holds`), the origin is joined to it by a finite open path at
   level p, and a finite path whose labels are all ≠ p (almost surely no label equals p) is open at a level
   m < p (`reachable_below`);
3. **assembly** (`theta_contAt`): θ is continuous at every p such that θ(p) > 0 ⇒ p_c < p; with the lab's
   θ(p_c) = 0 (`BondPercolation.percolation_continuity`, d ≥ 2) that is every p;
4. **transport** to our hand-written encoding by bridge A (`BridgeA.θ_eq`, `BridgeA.pc_eq`).
-/

open MeasureTheory Filter Topology
open Percolation.Literature Percolation.Literature.LatticeModels Percolation.Literature.DCT16

namespace ContProof

/-- The lab's percolation probability of the origin on ℤ^d, as a function of p ∈ [0, 1]. -/
local notation "Θ[" d "]" =>
  Percolation.Literature.theta (Percolation.Literature.LatticeModels.zdGraph d)
    (0 : Percolation.Literature.LatticeModels.Site d)

/-- The lab's critical probability of ℤ^d (an infimum). -/
local notation "pcL[" d "]" =>
  Percolation.Literature.criticalProb (Percolation.Literature.LatticeModels.zdGraph d)
    (0 : Percolation.Literature.LatticeModels.Site d)

/-! ### 1. Upper semicontinuity and right-continuity -/

/-- θ is upper semicontinuous at every p, in every dimension. -/
theorem theta_upper (d : ℕ) (p : unitInterval) (a : ℝ) (ha : Θ[d] p < a) :
    ∀ᶠ q in 𝓝 p, Θ[d] q < a := by
  obtain ⟨n, hn⟩ := ((tendsto_order.1 (tendsto_real_siteToBoundary (d := d) p)).2 a ha).exists
  have hc : Continuous fun q : unitInterval =>
      (bondPercolation (zdGraph d) q).real (siteToBoundary d n) :=
    continuous_bondPercolation_real_of_determinedBy (zdGraph d) (determinedBy_siteToBoundary d n)
  have hev : ∀ᶠ q in 𝓝 p, (bondPercolation (zdGraph d) q).real (siteToBoundary d n) < a :=
    (hc.tendsto p).eventually (eventually_lt_nhds hn)
  filter_upwards [hev] with q hq
  exact lt_of_le_of_lt (theta_le_real_siteToBoundary q n) hq

/-- θ is right-continuous at every p, in every dimension. -/
theorem theta_rightCont (d : ℕ) (p : unitInterval) :
    ContinuousWithinAt (Θ[d]) (Set.Ici p) p := by
  unfold ContinuousWithinAt
  refine tendsto_order.2 ⟨fun a ha => ?_, fun a ha =>
    (theta_upper d p a ha).filter_mono nhdsWithin_le_nhds⟩
  filter_upwards [self_mem_nhdsWithin] with q hq
  exact lt_of_lt_of_le ha (theta_mono_holds (zdGraph d) 0 (Set.mem_Ici.1 hq))

/-! ### 2. van den Berg–Keane: the deterministic part -/

/-- A finite open path at level `p`, none of whose labels equals `p`, is open at some level `m < p`. -/
theorem reachable_below {V : Type*} (G : SimpleGraph V) (U : Sym2 V → ℝ) (p : ℝ)
    (hU : ∀ e, U e ≠ p) {x y : V} (h : (openGraph (configOfLabels p U G)).Reachable x y) :
    ∃ m, m < p ∧ (openGraph (configOfLabels m U G)).Reachable x y := by
  rw [SimpleGraph.reachable_iff_reflTransGen] at h
  induction h with
  | refl => exact ⟨p - 1, by linarith, SimpleGraph.Reachable.refl _⟩
  | @tail b c _ hbc ih =>
    obtain ⟨m, hm, hreach⟩ := ih
    rw [openGraph_adj] at hbc
    obtain ⟨⟨hG, hle⟩, hne⟩ := hbc
    have hlt : U s(b, c) < p := lt_of_le_of_ne hle (hU _)
    refine ⟨max m (U s(b, c)), max_lt hm hlt, ?_⟩
    have h1 : (openGraph (configOfLabels (max m (U s(b, c))) U G)).Reachable x b :=
      hreach.mono (openGraph_mono (configOfLabels_mono U G (le_max_left _ _)))
    have h2 : (openGraph (configOfLabels (max m (U s(b, c))) U G)).Adj b c := by
      rw [openGraph_adj]
      exact ⟨⟨hG, le_max_right _ _⟩, hne⟩
    exact h1.trans h2.reachable

/-- If x is joined to y and the cluster of y is infinite, the cluster of x is infinite. -/
theorem percolatesAt_of_reachable {V : Type*} {ω : BondConfig V} {x y : V}
    (h : (openGraph ω).Reachable x y) (hy : ω ∈ percolatesAt y) : ω ∈ percolatesAt x := by
  have hsub : openCluster ω y ⊆ openCluster ω x := fun z hz => h.trans hz
  exact Set.Infinite.mono hsub hy

/-! ### 2′. van den Berg–Keane: the almost-sure facts, in label space -/

/-- The event, in label space, that the origin percolates at level `q`. -/
def percAt (d : ℕ) (q : ℝ) : Set (Sym2 (Site d) → ℝ) :=
  {U | configOfLabels q U (zdGraph d) ∈ percolatesAt (0 : Site d)}

/-- θ(q) is the label-probability that the origin percolates at level q (the coupling). -/
theorem theta_label (d : ℕ) (q : unitInterval) :
    Θ[d] q = (labelMeasure (Site d)).real (percAt d (q : ℝ)) := by
  have hA : MeasurableSet (percolatesAt (0 : Site d) : Set (BondConfig (Site d))) :=
    measurableSet_percolatesAt_holds 0
  rw [theta, ← map_configOfLabels_holds (zdGraph d) q, measureReal_def, measureReal_def,
    Measure.map_apply (measurable_configOfLabels _ (zdGraph d)) hA]
  rfl

/-- Almost surely no label equals `p`. -/
theorem ae_label_ne (V : Type*) [Countable V] (p : ℝ) :
    ∀ᵐ U ∂(labelMeasure V), ∀ e : Sym2 V, U e ≠ p := by
  have := isProbabilityMeasure_volume_restrict_unitInterval
  rw [ae_all_iff]
  intro e
  have h0 : labelMeasure V ((fun U : Sym2 V → ℝ => U e) ⁻¹' {p}) = 0 := by
    rw [← Measure.map_apply (measurable_pi_apply e) (measurableSet_singleton p), labelMeasure,
      Measure.infinitePi_map_eval]
    exact le_antisymm ((Measure.restrict_apply_le _ _).trans_eq Real.volume_singleton) zero_le
  filter_upwards [measure_eq_zero_iff_ae_notMem.1 h0] with U hU
  exact fun h => hU h

/-- Uniqueness of the infinite cluster at level `p`, in label space (the lab's theorem, transported). -/
theorem ae_label_unique (d : ℕ) (p : unitInterval) :
    ∀ᵐ U ∂(labelMeasure (Site d)),
      numInfiniteClusters (configOfLabels (p : ℝ) U (zdGraph d)) ≤ 1 := by
  have h := Grimmett1999_numInfiniteClusters_le_one_holds d p
  rw [← map_configOfLabels_holds (zdGraph d) p] at h
  exact ae_of_ae_map (measurable_configOfLabels _ _).aemeasurable h

/-- Existence of an infinite cluster at a level with θ > 0, in label space (the lab's zero–one law). -/
theorem ae_label_exists (d : ℕ) (p₁ : unitInterval) (hpos : 0 < Θ[d] p₁) :
    ∀ᵐ U ∂(labelMeasure (Site d)),
      ∃ x : Site d, configOfLabels (p₁ : ℝ) U (zdGraph d) ∈ percolatesAt x := by
  have h1 := (Grimmett1999_prob_exists_percolatesAt_holds d p₁).2 hpos
  have hm : MeasurableSet {ω : BondConfig (Site d) | ∃ x : Site d, ω ∈ percolatesAt x} := by
    have hU : {ω : BondConfig (Site d) | ∃ x : Site d, ω ∈ percolatesAt x} =
        ⋃ x : Site d, percolatesAt x := by
      ext ω; simp
    rw [hU]
    exact MeasurableSet.iUnion fun x => measurableSet_percolatesAt_holds x
  rw [measureReal_def, ENNReal.toReal_eq_one_iff] at h1
  have h2 : ∀ᵐ ω ∂(bondPercolation (zdGraph d) p₁),
      ω ∈ {ω : BondConfig (Site d) | ∃ x : Site d, ω ∈ percolatesAt x} :=
    (mem_ae_iff_prob_eq_one hm).2 h1
  rw [← map_configOfLabels_holds (zdGraph d) p₁] at h2
  exact ae_of_ae_map (measurable_configOfLabels _ _).aemeasurable h2

/-! ### 2″. van den Berg–Keane: the measure step -/

/-- **van den Berg–Keane.** If θ(p₁) > 0 and p₁ < p, then θ(q) comes arbitrarily close to θ(p) from below p. -/
theorem exists_lt_theta (d : ℕ) (p₁ p : unitInterval) (h1 : p₁ < p) (hpos : 0 < Θ[d] p₁)
    (a : ℝ) (ha : a < Θ[d] p) : ∃ q : unitInterval, q < p ∧ a < Θ[d] q := by
  by_contra hcon
  have hcon' : ∀ q : unitInterval, q < p → Θ[d] q ≤ a := fun q hq =>
    not_lt.1 fun h => hcon ⟨q, hq, h⟩
  have hP := isProbabilityMeasure_labelMeasure (Site d)
  have h1' : (p₁ : ℝ) < (p : ℝ) := Subtype.coe_lt_coe.2 h1
  have ha0 : 0 ≤ a := le_trans measureReal_nonneg (hcon' p₁ h1)
  -- the levels q_k = max p₁ (p − 1/(k+1)): in [p₁, p), increasing to p
  have hqmem : ∀ k : ℕ, max (p₁ : ℝ) ((p : ℝ) - 1 / ((k : ℝ) + 1)) ∈ Set.Icc (0 : ℝ) 1 := fun k =>
    ⟨le_trans p₁.2.1 (le_max_left _ _),
      max_le (h1'.le.trans p.2.2) (by
        have := Nat.one_div_pos_of_nat (α := ℝ) (n := k)
        linarith [p.2.2])⟩
  obtain ⟨qk, hqk⟩ : ∃ qk : ℕ → unitInterval,
      ∀ k, ((qk k : unitInterval) : ℝ) = max (p₁ : ℝ) ((p : ℝ) - 1 / ((k : ℝ) + 1)) :=
    ⟨fun k => ⟨_, hqmem k⟩, fun _ => rfl⟩
  have hqlt : ∀ k, qk k < p := fun k => by
    have := Nat.one_div_pos_of_nat (α := ℝ) (n := k)
    refine Subtype.coe_lt_coe.1 ?_
    rw [hqk]
    exact max_lt h1' (by linarith)
  have hqmono : ∀ k l : ℕ, k ≤ l → ((qk k : unitInterval) : ℝ) ≤ ((qk l : unitInterval) : ℝ) :=
    fun k l hkl => by
      rw [hqk, hqk]
      exact max_le_max le_rfl (sub_le_sub_left (Nat.one_div_le_one_div hkl) _)
  have hAmono : ∀ q q' : ℝ, q ≤ q' → percAt d q ⊆ percAt d q' := fun q q' hqq' U hU =>
    percolatesAt_mono (configOfLabels_mono U (zdGraph d) hqq') 0 hU
  -- the almost-sure facts
  have hne := ae_label_ne (Site d) (p : ℝ)
  have huniq := ae_label_unique d p
  have hex := ae_label_exists d p₁ hpos
  have hae : ∀ᵐ U ∂(labelMeasure (Site d)),
      U ∈ percAt d (p : ℝ) → U ∈ ⋃ k, percAt d ((qk k : unitInterval) : ℝ) := by
    filter_upwards [hne, huniq, hex] with U hU1 hU2 hU3 hU
    obtain ⟨x, hx⟩ := hU3
    have hxp : configOfLabels (p : ℝ) U (zdGraph d) ∈ percolatesAt x :=
      percolatesAt_mono (configOfLabels_mono U (zdGraph d) h1'.le) x hx
    have hreach : (openGraph (configOfLabels (p : ℝ) U (zdGraph d))).Reachable 0 x :=
      (numInfiniteClusters_le_one_iff _).1 hU2 0 x hU hxp
    obtain ⟨m, hm, hmr⟩ := reachable_below (zdGraph d) U (p : ℝ) hU1 hreach
    obtain ⟨k, hk⟩ := exists_nat_one_div_lt (sub_pos.2 hm)
    refine Set.mem_iUnion.2 ⟨k, ?_⟩
    have hmk : m ≤ ((qk k : unitInterval) : ℝ) := by
      rw [hqk]
      exact le_trans (by linarith) (le_max_right _ _)
    have hpk : (p₁ : ℝ) ≤ ((qk k : unitInterval) : ℝ) := by
      rw [hqk]
      exact le_max_left _ _
    have hr : (openGraph (configOfLabels ((qk k : unitInterval) : ℝ) U (zdGraph d))).Reachable 0 x :=
      hmr.mono (openGraph_mono (configOfLabels_mono U (zdGraph d) hmk))
    have hxk : configOfLabels ((qk k : unitInterval) : ℝ) U (zdGraph d) ∈ percolatesAt x :=
      percolatesAt_mono (configOfLabels_mono U (zdGraph d) hpk) x hx
    exact percolatesAt_of_reachable hr hxk
  have hmonoS : Monotone fun k : ℕ => percAt d ((qk k : unitInterval) : ℝ) :=
    fun k l hkl => hAmono _ _ (hqmono k l hkl)
  have hle : labelMeasure (Site d) (percAt d (p : ℝ)) ≤ ENNReal.ofReal a := by
    calc labelMeasure (Site d) (percAt d (p : ℝ))
        ≤ labelMeasure (Site d) (⋃ k, percAt d ((qk k : unitInterval) : ℝ)) := measure_mono_ae hae
      _ = ⨆ k, labelMeasure (Site d) (percAt d ((qk k : unitInterval) : ℝ)) := hmonoS.measure_iUnion
      _ ≤ ENNReal.ofReal a := iSup_le fun k => by
          have hk := hcon' (qk k) (hqlt k)
          rw [theta_label, measureReal_def] at hk
          exact (ENNReal.le_ofReal_iff_toReal_le (measure_ne_top _ _) ha0).2 hk
  have hfin : Θ[d] p ≤ a := by
    rw [theta_label, measureReal_def]
    exact ENNReal.toReal_le_of_le_ofReal ha0 hle
  linarith

/-- θ is lower semicontinuous at every p above a point where θ > 0. -/
theorem theta_lower (d : ℕ) (p₁ p : unitInterval) (h1 : p₁ < p) (hpos : 0 < Θ[d] p₁)
    (a : ℝ) (ha : a < Θ[d] p) : ∀ᶠ q in 𝓝 p, a < Θ[d] q := by
  obtain ⟨q, hq, haq⟩ := exists_lt_theta d p₁ p h1 hpos a ha
  filter_upwards [eventually_gt_nhds hq] with r hr
  exact lt_of_lt_of_le haq (theta_mono_holds (zdGraph d) 0 hr.le)

/-! ### 3. Assembly, in the lab's encoding -/

/-- θ is continuous at every p such that θ(p) > 0 forces p_c < p: every p ≠ p_c, and p_c too if θ(p_c) = 0. -/
theorem theta_contAt (d : ℕ) (p : unitInterval) (h : 0 < Θ[d] p → pcL[d] < (p : ℝ)) :
    ContinuousAt (Θ[d]) p := by
  unfold ContinuousAt
  refine tendsto_order.2 ⟨fun a ha => ?_, fun a ha => theta_upper d p a ha⟩
  rcases (measureReal_nonneg : 0 ≤ Θ[d] p).eq_or_lt with h0 | hpos
  · have ha' : a < 0 := lt_of_lt_of_eq ha h0.symm
    exact Filter.Eventually.of_forall fun q => lt_of_lt_of_le ha' measureReal_nonneg
  · have hc : pcL[d] < (p : ℝ) := h hpos
    have hc0 : 0 ≤ pcL[d] := (criticalProb_mem_Icc _ _).1
    have hmem : (pcL[d] + (p : ℝ)) / 2 ∈ Set.Icc (0 : ℝ) 1 :=
      ⟨by linarith [p.2.1], by linarith [p.2.2]⟩
    have hp1 : (⟨(pcL[d] + (p : ℝ)) / 2, hmem⟩ : unitInterval) < p :=
      Subtype.coe_lt_coe.1 (show (pcL[d] + (p : ℝ)) / 2 < (p : ℝ) by linarith)
    have hpos1 : 0 < Θ[d] ⟨(pcL[d] + (p : ℝ)) / 2, hmem⟩ :=
      theta_pos_of_criticalProb_lt_holds (zdGraph d) 0 ⟨(pcL[d] + (p : ℝ)) / 2, hmem⟩
        (show pcL[d] < (pcL[d] + (p : ℝ)) / 2 by linarith)
    exact theta_lower d ⟨(pcL[d] + (p : ℝ)) / 2, hmem⟩ p hp1 hpos1 a ha

/-- If θ(p_c) = 0 then θ is continuous on [0, 1]. -/
theorem continuous_of_crit (d : ℕ) (hcrit : Θ[d] (criticalProbI d) = 0) : Continuous (Θ[d]) :=
  continuous_iff_continuousAt.2 fun p => theta_contAt d p fun hpos => by
    have hge : pcL[d] ≤ (p : ℝ) := not_lt.1 fun h =>
      hpos.ne' (theta_eq_zero_of_lt_criticalProb_holds (zdGraph d) 0 p h)
    have hne : pcL[d] ≠ (p : ℝ) := fun h => hpos.ne' (by
      have hp : p = criticalProbI d := Subtype.ext h.symm
      rw [hp]
      exact hcrit)
    exact lt_of_le_of_ne hge hne

/-- If θ is continuous on [0, 1] and d ≥ 1 (so p_c > 0), then θ(p_c) = 0. -/
theorem crit_of_continuous (d : ℕ) (hd : 1 ≤ d) (hc : Continuous (Θ[d])) :
    Θ[d] (criticalProbI d) = 0 :=
  UnitAux.eq_zero_of_continuous_of_zero_below hc (criticalProbI d) (criticalProb_zd_pos d hd)
    (fun q hq => theta_eq_zero_of_lt_criticalProb_holds (zdGraph d) 0 q (Subtype.coe_lt_coe.2 hq))

/-! ### 4. Transport to the hand-written encoding (bridge A) -/

theorem θ_eq' (d : ℕ) : TextbookPercolation.θ d = Θ[d] :=
  funext fun p => BridgeA.θ_eq d p

theorem pc_eq' (d : ℕ) : TextbookPercolation.pc d = pcL[d] :=
  BridgeA.pc_eq d

/-- **Stage 1.** θ is right-continuous at every p, in every dimension. -/
theorem right_continuity : TextbookPercolation.RightContinuity := by
  intro d p
  rw [θ_eq']
  exact theta_rightCont d p

/-- **Stage 2 (van den Berg–Keane).** θ is left-continuous at every p above p_c, in every dimension. -/
theorem left_continuity_above_pc : TextbookPercolation.LeftContinuityAbovePc := by
  intro d p hp
  rw [θ_eq']
  rw [pc_eq'] at hp
  exact (theta_contAt d p fun _ => hp).continuousWithinAt

/-- **Stage 3.** For d ≥ 1, θ is continuous on [0, 1] exactly when θ(p_c) = 0. -/
theorem continuity_iff_critical : TextbookPercolation.ContinuityIffCritical := by
  intro d hd
  have hmem : TextbookPercolation.pc d ∈ Set.Icc (0 : ℝ) 1 := by
    rw [pc_eq']
    exact criticalProb_mem_Icc _ _
  have hI : (⟨TextbookPercolation.pc d, hmem⟩ : unitInterval) = criticalProbI d :=
    Subtype.ext (pc_eq' d)
  rw [θ_eq']
  constructor
  · intro hc
    refine ⟨hmem, ?_⟩
    rw [hI]
    exact crit_of_continuous d hd hc
  · rintro ⟨h, h0⟩
    have hcrit : Θ[d] (criticalProbI d) = 0 := by
      rw [← hI]
      exact h0
    exact continuous_of_crit d hcrit

/-- **θ is continuous on [0, 1] in every dimension d ≥ 2.** -/
theorem theta_continuous : TextbookPercolation.ContinuityStatement := by
  intro d hd
  rw [θ_eq']
  exact continuous_of_crit d
    ((BondPercolation.bridge d).1 (BondPercolation.percolation_continuity d hd))

end ContProof

/-! ### The four statements of `Continuity.lean`, under root names (the names the Comparator challenge uses) -/

/-- **Stage 1** (`TextbookPercolation.RightContinuity`). -/
theorem theta_right_continuous : TextbookPercolation.RightContinuity :=
  ContProof.right_continuity

/-- **Stage 2** (`TextbookPercolation.LeftContinuityAbovePc`, van den Berg–Keane). -/
theorem theta_left_continuous_above_pc : TextbookPercolation.LeftContinuityAbovePc :=
  ContProof.left_continuity_above_pc

/-- **Stage 3** (`TextbookPercolation.ContinuityIffCritical`). -/
theorem theta_continuous_iff_critical : TextbookPercolation.ContinuityIffCritical :=
  ContProof.continuity_iff_critical

/-- **θ is continuous on [0, 1] in every dimension d ≥ 2** (`TextbookPercolation.ContinuityStatement`). -/
theorem theta_continuous : TextbookPercolation.ContinuityStatement :=
  ContProof.theta_continuous
