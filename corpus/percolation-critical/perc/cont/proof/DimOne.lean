import ThetaAnchors

/-!
# P5′ — the body of the statement is FALSE at d = 1 (PREREG-PERCOLATION.md, amendment A2)

Mathlib only, over the sealed `Textbook` (sha256 4dc732f5…41ae, unchanged) and `ThetaAnchors` (`theta_zero`,
`theta_one`). The same bytes at both Mathlib pins (v4.32.0 / 81a5d257 and v4.34.1 / d13f23b7).

* `theta_dim_one_eq_zero`: θ₁(p) = 0 for every p < 1. In ℤ¹ an open path from 0 to a vertex m crosses every edge
  between 0 and m, and an infinite set of integers holds points of arbitrarily large absolute value; so an infinite
  cluster at 0 forces, for every n, the n edges {0,1},…,{n−1,n} all open or the n edges {−n,−n+1},…,{−1,0} all open.
  Each of the two cylinders has probability pⁿ under the product measure, hence θ₁(p) ≤ 2pⁿ → 0.
* `pc_dim_one`: p_c(1) = 1 (the set {p ∈ [0,1] : θ₁(p) = 0} holds [0,1) and lies in [0,1]).
* `statement_body_false_at_dim_one`: the body of `Statement` at d = 1 fails, because θ₁(p_c) = θ₁(1) = 1.

So the hypothesis `2 ≤ d` of `Statement` is load-bearing.
-/

namespace TextbookPercolation

open MeasureTheory Filter

/-! ### The line ℤ¹: vertices, edges -/

/-- The vertex k of ℤ¹. -/
def vtx (k : ℤ) : Vertex 1 := fun _ => k

/-- A vertex of ℤ¹ is its only coordinate. -/
theorem vtx_coord (x : Vertex 1) : x = vtx (x 0) := by
  funext i
  have hi : i = 0 := Subsingleton.elim i 0
  subst hi
  rfl

/-- In ℤ¹, adjacency is: the coordinates differ by one. -/
theorem adjacent_one_iff (x y : Vertex 1) : Adjacent x y ↔ |x 0 - y 0| = 1 := by
  unfold Adjacent
  rw [Fin.sum_univ_one]

theorem adjacent_vtx (k : ℤ) : Adjacent (vtx k) (vtx (k + 1)) := by
  rw [adjacent_one_iff]
  show |k - (k + 1)| = 1
  have h : k - (k + 1) = -1 := by ring
  rw [h, abs_neg, abs_one]

/-- The edge {k, k+1} of ℤ¹. -/
def edg (k : ℤ) : Edge 1 := ⟨s(vtx k, vtx (k + 1)), adjacent_vtx k⟩

theorem edg_injective : Function.Injective edg := by
  intro k l h
  have h' : s(vtx k, vtx (k + 1)) = s(vtx l, vtx (l + 1)) := congrArg Subtype.val h
  rw [Sym2.eq_iff] at h'
  rcases h' with ⟨h1, _⟩ | ⟨h1, h2⟩
  · exact congrFun h1 0
  · have a : k = l + 1 := congrFun h1 0
    have b : k + 1 = l := congrFun h2 0
    omega

/-- The edges {k, k+1}, k = 0, 1, 2, … (to the right of the origin). -/
def embR : ℕ ↪ Edge 1 :=
  ⟨fun k => edg (k : ℤ), fun a b h => by
    have h' : (a : ℤ) = (b : ℤ) := edg_injective h
    omega⟩

/-- The edges {−k−1, −k}, k = 0, 1, 2, … (to the left of the origin). -/
def embL : ℕ ↪ Edge 1 :=
  ⟨fun k => edg (-(k : ℤ) - 1), fun a b h => by
    have h' : -(a : ℤ) - 1 = -(b : ℤ) - 1 := edg_injective h
    omega⟩

/-! ### An open path crosses every edge between its ends -/

/-- An open path from x to y, with x ≤ k < y, uses the edge {k, k+1}. -/
theorem open_of_cross_right {ω : Edge 1 → Bool} {x y : Vertex 1}
    (h : Relation.ReflTransGen (OpenEdge ω) x y) :
    ∀ k : ℤ, x 0 ≤ k → k < y 0 → ω (edg k) = true := by
  induction h with
  | refl => intro k h1 h2; exact absurd h2 (not_lt.mpr h1)
  | @tail b c _ hstep ih =>
    intro k h1 h2
    obtain ⟨hadj, hopen⟩ := hstep
    have habs : |b 0 - c 0| = 1 := (adjacent_one_iff b c).mp hadj
    have hor : b 0 - c 0 = 1 ∨ b 0 - c 0 = -1 := (abs_eq zero_le_one).mp habs
    by_cases hb : k < b 0
    · exact ih k h1 hb
    · have hbk : b 0 = k := by omega
      have hck : c 0 = k + 1 := by omega
      have hb' : b = vtx k := (vtx_coord b).trans (congrArg vtx hbk)
      have hc' : c = vtx (k + 1) := (vtx_coord c).trans (congrArg vtx hck)
      have hE : (⟨s(b, c), hadj⟩ : Edge 1) = edg k :=
        Subtype.ext (by show s(b, c) = s(vtx k, vtx (k + 1)); rw [hb', hc'])
      rw [← hE]
      exact hopen

/-- An open path from x to y, with y ≤ k < x, uses the edge {k, k+1}. -/
theorem open_of_cross_left {ω : Edge 1 → Bool} {x y : Vertex 1}
    (h : Relation.ReflTransGen (OpenEdge ω) x y) :
    ∀ k : ℤ, y 0 ≤ k → k < x 0 → ω (edg k) = true := by
  induction h with
  | refl => intro k h1 h2; exact absurd h2 (not_lt.mpr h1)
  | @tail b c _ hstep ih =>
    intro k h1 h2
    obtain ⟨hadj, hopen⟩ := hstep
    have habs : |b 0 - c 0| = 1 := (adjacent_one_iff b c).mp hadj
    have hor : b 0 - c 0 = 1 ∨ b 0 - c 0 = -1 := (abs_eq zero_le_one).mp habs
    by_cases hb : b 0 ≤ k
    · exact ih k hb h2
    · have hck : c 0 = k := by omega
      have hbk : b 0 = k + 1 := by omega
      have hb' : b = vtx (k + 1) := (vtx_coord b).trans (congrArg vtx hbk)
      have hc' : c = vtx k := (vtx_coord c).trans (congrArg vtx hck)
      have hE : (⟨s(b, c), hadj⟩ : Edge 1) = edg k :=
        Subtype.ext (by show s(b, c) = s(vtx k, vtx (k + 1)); rw [hb', hc']; exact Sym2.eq_swap)
      rw [← hE]
      exact hopen

/-- An infinite set of vertices of ℤ¹ holds points of arbitrarily large absolute value. -/
theorem exists_far {S : Set (Vertex 1)} (hS : S.Infinite) (n : ℕ) : ∃ y ∈ S, (n : ℤ) ≤ |y 0| := by
  by_contra hcon
  have hcon' : ∀ y ∈ S, |y 0| < (n : ℤ) := fun y hy => not_le.mp fun hge => hcon ⟨y, hy, hge⟩
  refine hS (((Set.finite_Icc (-(n : ℤ)) n).image vtx).subset fun y hy => ?_)
  have hlt := abs_lt.mp (hcon' y hy)
  exact ⟨y 0, ⟨hlt.1.le, hlt.2.le⟩, (vtx_coord y).symm⟩

/-- An infinite cluster at the origin of ℤ¹ forces, for every n, the first n edges to the right all open or the first
n edges to the left all open. -/
theorem infinite_subset (n : ℕ) :
    {ω : Edge 1 → Bool | (cluster ω 0).Infinite} ⊆
      Set.pi (↑((Finset.range n).map embR)) (fun _ => {true}) ∪
        Set.pi (↑((Finset.range n).map embL)) (fun _ => {true}) := by
  intro ω hω
  obtain ⟨y, hy, hfar⟩ := exists_far hω n
  have hpath : Relation.ReflTransGen (OpenEdge ω) 0 y := hy
  rcases le_abs.mp hfar with hpos | hneg
  · left
    intro e he
    obtain ⟨k, hk, rfl⟩ := Finset.mem_map.mp (Finset.mem_coe.mp he)
    have hkn : k < n := Finset.mem_range.mp hk
    exact open_of_cross_right hpath (k : ℤ) (by show (0 : ℤ) ≤ (k : ℤ); omega) (by omega)
  · right
    intro e he
    obtain ⟨k, hk, rfl⟩ := Finset.mem_map.mp (Finset.mem_coe.mp he)
    have hkn : k < n := Finset.mem_range.mp hk
    exact open_of_cross_left hpath (-(k : ℤ) - 1) (by omega) (by show -(k : ℤ) - 1 < (0 : ℤ); omega)

/-! ### The measure of the two cylinders -/

/-- Under P_p, a finite set s of edges is entirely open with probability p^|s|. -/
theorem P_cyl (p : unitInterval) (s : Finset (Edge 1)) :
    P 1 p (Set.pi (↑s) fun _ => {true}) = (unitInterval.toNNReal p : ENNReal) ^ s.card := by
  unfold P
  rw [Measure.infinitePi_pi _ (fun _ _ => measurableSet_singleton true), Finset.prod_const,
    ProbabilityTheory.bernoulliMeasure_apply_of_mem_of_notMem p (measurableSet_singleton true)
      (Set.mem_singleton true) (by simp)]

/-- P_p(|C(0)| = ∞) ≤ 2pⁿ in ℤ¹, for every n. -/
theorem P_infinite_le (p : unitInterval) (n : ℕ) :
    P 1 p {ω | (cluster ω 0).Infinite} ≤ 2 * (unitInterval.toNNReal p : ENNReal) ^ n := by
  calc P 1 p {ω | (cluster ω 0).Infinite}
      ≤ P 1 p (Set.pi (↑((Finset.range n).map embR)) (fun _ => {true}) ∪
          Set.pi (↑((Finset.range n).map embL)) (fun _ => {true})) := measure_mono (infinite_subset n)
    _ ≤ P 1 p (Set.pi (↑((Finset.range n).map embR)) fun _ => {true}) +
          P 1 p (Set.pi (↑((Finset.range n).map embL)) fun _ => {true}) := measure_union_le _ _
    _ = 2 * (unitInterval.toNNReal p : ENNReal) ^ n := by
      simp only [P_cyl, Finset.card_map, Finset.card_range, two_mul]

/-! ### The three theorems -/

/-- **θ₁(p) = 0 for every p < 1.** -/
theorem theta_dim_one_eq_zero : ∀ p : unitInterval, (p : ℝ) < 1 → θ 1 p = 0 := by
  intro p hp
  have hr' : unitInterval.toNNReal p < 1 := by
    rw [← NNReal.coe_lt_coe, unitInterval.coe_toNNReal, NNReal.coe_one]
    exact hp
  have hr : (unitInterval.toNNReal p : ENNReal) < 1 := ENNReal.coe_lt_one_iff.mpr hr'
  have hlim : Tendsto (fun n : ℕ => 2 * (unitInterval.toNNReal p : ENNReal) ^ n) atTop (nhds (2 * 0)) :=
    ENNReal.Tendsto.const_mul (ENNReal.tendsto_pow_atTop_nhds_zero_of_lt_one hr) (Or.inr ENNReal.ofNat_ne_top)
  rw [mul_zero] at hlim
  have hzero : P 1 p {ω | (cluster ω 0).Infinite} = 0 :=
    le_antisymm (ge_of_tendsto' hlim (P_infinite_le p)) zero_le
  simp only [θ, hzero, ENNReal.toReal_zero]

/-- **p_c(1) = 1.** -/
theorem pc_dim_one : pc 1 = 1 := by
  unfold pc
  refine csSup_eq_of_forall_le_of_forall_lt_exists_gt ⟨0, ⟨le_refl 0, zero_le_one⟩, theta_zero 1⟩
    (fun p hp => hp.1.2) fun w hw => ?_
  have hmax : max w 0 < 1 := max_lt hw zero_lt_one
  have h0 : (0 : ℝ) ≤ max w 0 := le_max_right w 0
  have hw' : w ≤ max w 0 := le_max_left w 0
  have hmem : (max w 0 + 1) / 2 ∈ Set.Icc (0 : ℝ) 1 := ⟨by linarith, by linarith⟩
  have hlt : (max w 0 + 1) / 2 < 1 := by linarith
  exact ⟨(max w 0 + 1) / 2, ⟨hmem, theta_dim_one_eq_zero ⟨_, hmem⟩ hlt⟩, by linarith⟩

/-- **The body of `Statement` is false at d = 1**: p_c(1) = 1 and θ₁(1) = 1 ≠ 0. -/
theorem statement_body_false_at_dim_one : ¬ ∃ h : pc 1 ∈ Set.Icc (0 : ℝ) 1, θ 1 ⟨pc 1, h⟩ = 0 := by
  rintro ⟨h, h0⟩
  have hone : (⟨pc 1, h⟩ : unitInterval) = 1 := Subtype.ext pc_dim_one
  rw [hone, theta_one le_rfl] at h0
  exact one_ne_zero h0

end TextbookPercolation
