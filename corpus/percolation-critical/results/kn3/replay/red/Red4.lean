import KN3.Frag

/-!
# Transport.lean — everything the bridge needs that Mathlib alone can prove

A FRAGMENT: it has no `import` line and is compiled appended to
`Printed.lean ++ Check.lean ++ Planted.lean ++ PlantedCheck.lean` (`bridge/combine.sh` writes
`bridge/tmp/AllTransport.lean`). It uses the sealed definitions of `Printed.lean`, the sanity lemmas of `Check.lean`
and the sealed implications of `PlantedCheck.lean`. It imports nothing of the lab's library and mentions none of its
names.

What it contains.

1. **The mirror.** `setLaw`, `conn` and `LabForm` are the bodies of the lab's `prodBernoulli`, `openConn` (with
   `openGraph` unfolded) and `KozmaNitzan2024_conjecture3`, typed here with Mathlib only. That the mirror IS the
   lab's statement is not claimed here: it is checked in the lab's environment by `Iff.rfl` (`Compare.lean`).
2. **The measure transports**, as statements about products of two-point measures along an injection of index
   types: `map_pushProp` (our coins, read as a random set, are the set law) and `map_pull` (the set law, read on a
   sub-family of coordinates, is our coin product).
3. **The dictionary of connections**: reachability in `SimpleGraph.fromEdgeSet ω` against `Joined`.
4. **The implications**: `conjecture3_of_labForm` (Lab → R0), `labForm_of_conjecture3` (R0 → Lab),
   `labForm_of_neighbour3` (N3 → Lab, by one isolated vertex), `readingB_of_conjecture3` (R0 → RB, by exhaustion)
   and the corollaries for RB, N2, N3, N4.
-/

namespace KN3Red4

open MeasureTheory KN3Printed KN3Planted

/-! ## 1. The mirror of the lab's definitions -/

/-- The body of the lab's `prodBernoulli`: each index `i` is in the random set independently with probability
`p i`. The pullback along `s ↦ (i ↦ i ∈ s)` of the product of the two-point measures on `Prop`. -/
noncomputable def setLaw {ι : Type*} (p : ι → unitInterval) : Measure (Set ι) :=
  .comap (fun s i => i ∈ s) <| Measure.infinitePi fun i : ι =>
    unitInterval.toNNReal (p i) • Measure.dirac True +
      unitInterval.toNNReal (unitInterval.symm (p i)) • Measure.dirac False

/-- The body of the lab's `openConn`, with `openGraph ω = SimpleGraph.fromEdgeSet ω` unfolded: `x` and `y` are joined
in the simple graph whose edges are the non-diagonal pairs of `ω`. -/
def conn {V : Type*} (x y : V) : Set (Set (Sym2 V)) := {ω | (SimpleGraph.fromEdgeSet ω).Reachable x y}

/-- The body of the lab's `KozmaNitzan2024_conjecture3`, over `setLaw` and `conn`. -/
def LabForm : Prop :=
  ∀ ε : ℝ, 0 < ε → ∃ δ : ℝ, 0 < δ ∧ ∀ (n : ℕ) (w : Sym2 (Fin n) → unitInterval) (A : Finset (Fin n))
    (o b : Fin n),
    1 - δ < (setLaw w).real (⋃ a ∈ A, conn o a) →
      (∀ a ∈ A, 1 - δ < (setLaw w).real (conn a b)) →
        1 - ε < (setLaw w).real (conn o b)

/-! ## 2. The two-point measures -/

/-- The factor of `setLaw`: `True` with probability `q`, `False` with probability `1 − q`. -/
noncomputable def ν (q : unitInterval) : Measure Prop :=
  unitInterval.toNNReal q • Measure.dirac True + unitInterval.toNNReal (unitInterval.symm q) • Measure.dirac False

instance ν_isProbabilityMeasure (q : unitInterval) : IsProbabilityMeasure (ν q) := by
  constructor
  simp only [ν, Measure.coe_add, Measure.coe_smul, Pi.add_apply, Pi.smul_apply, measure_univ,
    ENNReal.smul_def, smul_eq_mul, mul_one]
  rw [← ENNReal.coe_add, unitInterval.toNNReal_add_toNNReal_symm, ENNReal.coe_one]

theorem setLaw_eq_map {ι : Type*} (p : ι → unitInterval) :
    setLaw p = (Measure.infinitePi fun i => ν (p i)).map (fun q : ι → Prop => {i | q i}) :=
  MeasurableEquiv.setOf.comap_symm

theorem coe_toNNReal (q : unitInterval) : ((unitInterval.toNNReal q : NNReal) : ENNReal) = ENNReal.ofReal q := by
  rw [ENNReal.ofReal_eq_coe_nnreal q.2.1]
  rfl

theorem coe_toNNReal_symm (q : unitInterval) :
    ((unitInterval.toNNReal (unitInterval.symm q) : NNReal) : ENNReal) = ENNReal.ofReal (1 - q) := by
  rw [coe_toNNReal, unitInterval.coe_symm_eq]

/-- Our coin, read as a proposition ("the edge is open"), is the factor of the set law. -/
theorem coin_map (q : Set.Icc (0 : ℝ) 1) : (coin q).map (fun b : Bool => b = true) = ν q := by
  have hT : (true = true) = True := propext ⟨fun _ => trivial, fun _ => rfl⟩
  have hF : (false = true) = False := propext ⟨Bool.false_ne_true, False.elim⟩
  have hm : Measurable (fun b : Bool => b = true) := measurable_of_countable _
  rw [coin, ν, Measure.map_add _ _ hm, Measure.map_smul, Measure.map_smul, Measure.map_dirac' hm,
    Measure.map_dirac' hm, hT, hF, ENNReal.smul_def, ENNReal.smul_def, coe_toNNReal, coe_toNNReal_symm]

/-- A proposition as a bit. -/
noncomputable def bit (P : Prop) : Bool := by classical exact decide P

theorem bit_eq_true {P : Prop} : bit P = true ↔ P := by
  classical
  simp [bit]

theorem measurable_bit : Measurable bit := Measurable.of_discrete

/-- The factor of the set law, read as a bit, is our coin. -/
theorem ν_map_bit (q : unitInterval) : (ν q).map bit = coin q := by
  have hT : bit True = true := bit_eq_true.2 trivial
  have hF : bit False = false := by
    cases h : bit False
    · rfl
    · exact (bit_eq_true.1 h).elim
  rw [coin, ν, Measure.map_add _ _ measurable_bit, Measure.map_smul, Measure.map_smul,
    Measure.map_dirac' measurable_bit, Measure.map_dirac' measurable_bit, hT, hF, ENNReal.smul_def,
    ENNReal.smul_def, coe_toNNReal, coe_toNNReal_symm]

theorem ν_zero : ν 0 = Measure.dirac False := by
  simp [ν]

/-! ## 3. Products along an injection of index types -/

/-- A sub-family of independent coordinates is independent with the same laws: the product measure, read on the
coordinates `f i` for an injective `f`, is the product of the measures `μ (f i)`. -/
theorem infinitePi_map_comp_injective {I J X : Type*} [MeasurableSpace X] (μ : J → Measure X)
    [∀ j, IsProbabilityMeasure (μ j)] (f : I → J) (hf : Function.Injective f) :
    (Measure.infinitePi μ).map (fun (x : J → X) (i : I) => x (f i)) = Measure.infinitePi fun i => μ (f i) := by
  classical
  refine Measure.eq_infinitePi _ fun s t ht => ?_
  rw [Measure.map_apply (by fun_prop) (MeasurableSet.pi s.countable_toSet fun i _ => ht i)]
  have ht' : ∀ i, {y : X | ∀ i', f i' = f i → y ∈ t i'} = t i := by
    intro i
    ext y
    constructor
    · intro h
      exact h i rfl
    · intro h _ hi'
      rw [hf hi']
      exact h
  have hpre : (fun (x : J → X) (i : I) => x (f i)) ⁻¹' (Set.pi ↑s t) =
      Set.pi ↑(s.map ⟨f, hf⟩) (fun j => {y : X | ∀ i, f i = j → y ∈ t i}) := by
    ext x
    simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Finset.mem_map, Function.Embedding.coeFn_mk,
      Set.mem_setOf_eq]
    constructor
    · rintro h j ⟨i, hi, rfl⟩ _ hi'
      rw [hf hi']
      exact h i hi
    · intro h i hi
      exact h (f i) ⟨i, hi, rfl⟩ i rfl
  rw [hpre, Measure.infinitePi_pi, Finset.prod_map]
  · refine Finset.prod_congr rfl fun i _ => ?_
    simp only [Function.Embedding.coeFn_mk]
    rw [ht']
  · intro j hj
    obtain ⟨i, -, rfl⟩ := Finset.mem_map.1 hj
    simp only [Function.Embedding.coeFn_mk]
    rw [ht']
    exact ht i

/-- The open coordinates of a Bool-valued configuration on `I`, as a predicate on `J`, along `f : I → J`. -/
def pushProp {I J : Type*} (f : I → J) (ω : I → Bool) : J → Prop := fun j => ∃ i, f i = j ∧ ω i = true

/-- The same, as a set. -/
def push {I J : Type*} (f : I → J) (ω : I → Bool) : Set J := {j | pushProp f ω j}

theorem pushProp_apply {I J : Type*} {f : I → J} (hf : Function.Injective f) (ω : I → Bool) (i : I) :
    pushProp f ω (f i) = (ω i = true) :=
  propext ⟨fun ⟨_, hi', h⟩ => hf hi' ▸ h, fun h => ⟨i, rfl, h⟩⟩

theorem pushProp_of_notMem_range {I J : Type*} {f : I → J} (ω : I → Bool) {j : J} (hj : j ∉ Set.range f) :
    pushProp f ω j = False :=
  propext ⟨fun ⟨i, hi, _⟩ => hj ⟨i, hi⟩, False.elim⟩

theorem measurable_pushProp {I J : Type*} {f : I → J} (hf : Function.Injective f) :
    Measurable (pushProp f) := by
  refine measurable_pi_lambda _ fun j => ?_
  refine measurableSet_setOf.mp ?_
  by_cases hj : j ∈ Set.range f
  · obtain ⟨i, rfl⟩ := hj
    have : {ω : I → Bool | pushProp f ω (f i)} = (fun ω => ω i) ⁻¹' {true} := by
      ext ω
      simp [pushProp_apply hf ω i]
    rw [this]
    exact measurable_pi_apply _ (measurableSet_singleton true)
  · have : {ω : I → Bool | pushProp f ω j} = ∅ := by
      ext ω
      simp [pushProp_of_notMem_range ω hj]
    rw [this]
    exact MeasurableSet.empty

theorem measurable_push {I J : Type*} {f : I → J} (hf : Function.Injective f) : Measurable (push f) :=
  measurable_setOf.comp (measurable_pushProp hf)

/-- **Our coins, read as a random set.** If `w` is `p` along the injection `f` and `0` off its range, the product of
the coins `coin (p i)`, pushed to predicates on `J`, is the product of the two-point measures `ν (w j)`. -/
theorem map_pushProp {I J : Type*} {f : I → J} (hf : Function.Injective f) (p : I → Set.Icc (0 : ℝ) 1)
    (w : J → unitInterval) (hw : ∀ i, w (f i) = p i) (hw0 : ∀ j, j ∉ Set.range f → w j = 0) :
    (Measure.infinitePi fun i => coin (p i)).map (pushProp f) = Measure.infinitePi fun j => ν (w j) := by
  classical
  refine Measure.eq_infinitePi _ fun s t ht => ?_
  rw [Measure.map_apply (measurable_pushProp hf) (MeasurableSet.pi s.countable_toSet fun i _ => ht i)]
  by_cases C : ∀ j ∈ s, j ∉ Set.range f → False ∈ t j
  · -- the preimage is a box over the coordinates of `I` that land in `s`
    have hpre : pushProp f ⁻¹' (Set.pi ↑s t) =
        Set.pi ↑(s.preimage f hf.injOn) (fun i => (fun b : Bool => b = true) ⁻¹' t (f i)) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Finset.mem_preimage]
      constructor
      · intro h i hi
        have := h (f i) hi
        rwa [pushProp_apply hf] at this
      · intro h j hj
        by_cases hr : j ∈ Set.range f
        · obtain ⟨i, rfl⟩ := hr
          rw [pushProp_apply hf]
          exact h i hj
        · rw [pushProp_of_notMem_range ω hr]
          exact C j hj hr
    rw [hpre, Measure.infinitePi_pi _ (fun _ _ => MeasurableSet.of_discrete)]
    rw [← Finset.prod_preimage f s hf.injOn (fun j => ν (w j) (t j))]
    · refine Finset.prod_congr rfl fun i _ => ?_
      rw [← Measure.map_apply (measurable_of_countable _) (ht (f i)), coin_map, hw]
    · intro j hj hr
      rw [hw0 j hr, ν_zero]
      exact Measure.dirac_apply_of_mem (C j hj hr)
  · -- a coordinate off the range of `f` is asked to be open: the preimage is empty, and so is a factor
    push Not at C
    obtain ⟨j, hj, hr, hF⟩ := C
    have hpre : pushProp f ⁻¹' (Set.pi ↑s t) = (∅ : Set (I → Bool)) := by
      ext ω
      simp only [Set.mem_preimage, Set.mem_pi, Finset.mem_coe, Set.mem_empty_iff_false, iff_false]
      intro h
      have := h j hj
      rw [pushProp_of_notMem_range ω hr] at this
      exact hF this
    rw [hpre, measure_empty]
    refine (Finset.prod_eq_zero hj ?_).symm
    rw [hw0 j hr, ν_zero, Measure.dirac_apply, Set.indicator_of_notMem hF]

/-- **Our coins, read as a random set, have the set law.** -/
theorem map_push {I J : Type*} {f : I → J} (hf : Function.Injective f) (p : I → Set.Icc (0 : ℝ) 1)
    (w : J → unitInterval) (hw : ∀ i, w (f i) = p i) (hw0 : ∀ j, j ∉ Set.range f → w j = 0) :
    (Measure.infinitePi fun i => coin (p i)).map (push f) = setLaw w := by
  rw [setLaw_eq_map, ← map_pushProp hf p w hw hw0, Measure.map_map measurable_setOf (measurable_pushProp hf)]
  rfl

/-- A random set of `J`, read as a Bool-valued configuration on `I` along `f : I → J`. -/
noncomputable def pull {I J : Type*} (f : I → J) (ω : Set J) : I → Bool := fun i => bit (f i ∈ ω)

theorem measurable_pull {I J : Type*} (f : I → J) : Measurable (pull f) :=
  measurable_pi_lambda _ fun i => measurable_bit.comp (measurable_set_mem (f i))

/-- **The set law, read on a sub-family of coordinates, is our coin product.** No hypothesis on `w` off the range
of `f`: those coordinates are forgotten. -/
theorem map_pull {I J : Type*} {f : I → J} (hf : Function.Injective f) (w : J → unitInterval) :
    (setLaw w).map (pull f) = Measure.infinitePi fun i => coin (w (f i)) := by
  have h1 : Measurable (fun (x : J → Prop) (i : I) => x (f i)) := by fun_prop
  have h2 : Measurable (fun (x : I → Prop) (i : I) => bit (x i)) :=
    measurable_pi_lambda _ fun i => measurable_bit.comp (measurable_pi_apply i)
  rw [setLaw_eq_map, Measure.map_map (measurable_pull f) measurable_setOf]
  have hcomp : pull f ∘ (fun q : J → Prop => {j | q j}) =
      (fun (x : I → Prop) (i : I) => bit (x i)) ∘ (fun (x : J → Prop) (i : I) => x (f i)) := rfl
  rw [hcomp, ← Measure.map_map h2 h1, infinitePi_map_comp_injective (fun j => ν (w j)) f hf,
    Measure.infinitePi_map_pi _ (fun _ => measurable_bit)]
  congr 1
  funext i
  exact ν_map_bit (w (f i))

/-! ## 4. Connections: `SimpleGraph.fromEdgeSet … .Reachable` against `Joined` -/

/-- The edges of `G`, as unordered pairs of `W`, along a map of vertices `e : V → W`. -/
def edgeMap {V W : Type} (G : SimpleGraph V) (e : V → W) : G.edgeSet → Sym2 W := fun i => Sym2.map e i.1

theorem edgeMap_injective {V W : Type} (G : SimpleGraph V) {e : V → W} (he : Function.Injective e) :
    Function.Injective (edgeMap G e) :=
  fun _ _ hij => Subtype.ext (Sym2.map.injective he hij)

/-! ### From our encoding to the lab's (used for Lab → R0) -/

/-- The open edges of a configuration of `G`, relabelled by `e : V ≃ W`, are a set of pairs of `W`; `e x` and `e y`
are joined in it exactly when `x` and `y` are joined in the configuration. -/
theorem push_mem_conn {V W : Type} (G : SimpleGraph V) (e : V ≃ W) (ω : Config G) (x y : V) :
    push (edgeMap G e) ω ∈ conn (e x) (e y) ↔ Joined G ω x y := by
  have hadj : ∀ u v : V,
      (SimpleGraph.fromEdgeSet (push (edgeMap G e) ω)).Adj (e u) (e v) ↔ OpenStep G ω u v := by
    intro u v
    rw [SimpleGraph.fromEdgeSet_adj]
    constructor
    · rintro ⟨⟨⟨s, hs⟩, hi, hω⟩, -⟩
      have hi' : s = s(u, v) := Sym2.map.injective e.injective hi
      subst hi'
      exact ⟨hs, hω⟩
    · rintro ⟨h, hω⟩
      exact ⟨⟨⟨s(u, v), h⟩, rfl, hω⟩, fun huv => G.ne_of_adj h (e.injective huv)⟩
  show (SimpleGraph.fromEdgeSet (push (edgeMap G e) ω)).Reachable (e x) (e y) ↔ _
  rw [SimpleGraph.reachable_iff_reflTransGen, joined_iff_reflTransGen]
  constructor
  · intro h
    have h' : Relation.ReflTransGen (OpenStep G ω) (e.symm (e x)) (e.symm (e y)) := by
      refine Relation.ReflTransGen.lift e.symm (fun a b hab => ?_) _ _ h
      refine (hadj (e.symm a) (e.symm b)).1 ?_
      rw [e.apply_symm_apply, e.apply_symm_apply]
      exact hab
    rwa [e.symm_apply_apply, e.symm_apply_apply] at h'
  · intro h
    exact Relation.ReflTransGen.lift e (fun u v huv => (hadj u v).2 huv) _ _ h

theorem push_preimage_conn {V W : Type} (G : SimpleGraph V) (e : V ≃ W) (x y : V) :
    push (edgeMap G e) ⁻¹' conn (e x) (e y) = connEvent G x y := by
  ext ω
  exact push_mem_conn G e ω x y

/-- The weight function of the lab's encoding for a graph `G` with edge probabilities `p`, relabelled by `e`: `p` on
the images of the edges of `G`, and `0` on every other pair (non-edges and the diagonal). -/
noncomputable def weightOf {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V → W) :
    Sym2 W → unitInterval := fun j => by
  classical exact if h : ∃ i, edgeMap G e i = j then p h.choose else 0

theorem weightOf_apply {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) {e : V → W}
    (he : Function.Injective e) (i : G.edgeSet) : weightOf G p e (edgeMap G e i) = p i := by
  have h : ∃ i', edgeMap G e i' = edgeMap G e i := ⟨i, rfl⟩
  simp only [weightOf]
  rw [dif_pos h, edgeMap_injective G he h.choose_spec]

theorem weightOf_of_notMem_range {V W : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (e : V → W) (j : Sym2 W) (hj : j ∉ Set.range (edgeMap G e)) : weightOf G p e j = 0 := by
  simp only [weightOf]
  rw [dif_neg (show ¬ ∃ i, edgeMap G e i = j from hj)]

/-! ### From the lab's encoding to ours (used for R0 → Lab, N3 → Lab, and for measurability) -/

/-- The complete graph on the image of `g : W → V`: two distinct vertices of the image are neighbours; a vertex off
the image is isolated. For `g = id` it is the complete graph. -/
def completeOn {W V : Type} (g : W → V) : SimpleGraph V :=
  SimpleGraph.fromRel fun a b => a ∈ Set.range g ∧ b ∈ Set.range g

theorem completeOn_adj {W V : Type} (g : W → V) (a b : V) :
    (completeOn g).Adj a b ↔ a ≠ b ∧ a ∈ Set.range g ∧ b ∈ Set.range g := by
  rw [completeOn, SimpleGraph.fromRel_adj]
  tauto

section Pull

variable {W V : Type} (g : W → V) (r : V → W) (hr : Function.LeftInverse r g)

include hr in
theorem map_map_of_mem_edgeSet {s : Sym2 V} (hs : s ∈ (completeOn g).edgeSet) :
    Sym2.map g (Sym2.map r s) = s := by
  induction s using Sym2.ind with
  | _ a b =>
    obtain ⟨-, ⟨a', rfl⟩, ⟨b', rfl⟩⟩ := (completeOn_adj g a b).1 hs
    show s(g (r (g a')), g (r (g b'))) = s(g a', g b')
    rw [hr a', hr b']

include hr in
theorem edgeMap_completeOn_injective : Function.Injective (edgeMap (completeOn g) r) := by
  intro i j hij
  refine Subtype.ext ?_
  rw [← map_map_of_mem_edgeSet g r hr i.2, ← map_map_of_mem_edgeSet g r hr j.2]
  exact congrArg (Sym2.map g) hij

include hr in
/-- A set `ω` of pairs of `W`, read as a configuration of the complete graph on the image of `g`: `g x` and `g y` are
joined in it exactly when `x` and `y` are joined in `SimpleGraph.fromEdgeSet ω`. The diagonal pairs of `ω` play no
part on either side. -/
theorem joined_pull_iff (ω : Set (Sym2 W)) (x y : W) :
    Joined (completeOn g) (pull (edgeMap (completeOn g) r) ω) (g x) (g y) ↔
      (SimpleGraph.fromEdgeSet ω).Reachable x y := by
  rw [SimpleGraph.reachable_iff_reflTransGen, joined_iff_reflTransGen]
  have h1 : ∀ u v : W, (SimpleGraph.fromEdgeSet ω).Adj u v →
      OpenStep (completeOn g) (pull (edgeMap (completeOn g) r) ω) (g u) (g v) := by
    intro u v huv
    rw [SimpleGraph.fromEdgeSet_adj] at huv
    have hE : s(g u, g v) ∈ (completeOn g).edgeSet :=
      (completeOn_adj g (g u) (g v)).2 ⟨fun h => huv.2 (hr.injective h), ⟨u, rfl⟩, ⟨v, rfl⟩⟩
    refine ⟨hE, ?_⟩
    show bit (s(r (g u), r (g v)) ∈ ω) = true
    rw [bit_eq_true, hr u, hr v]
    exact huv.1
  have h2 : ∀ a b : V, OpenStep (completeOn g) (pull (edgeMap (completeOn g) r) ω) a b →
      (SimpleGraph.fromEdgeSet ω).Adj (r a) (r b) := by
    rintro a b ⟨hE, hω⟩
    have hω' : s(r a, r b) ∈ ω := bit_eq_true.1 hω
    obtain ⟨hne, ⟨a', rfl⟩, ⟨b', rfl⟩⟩ := (completeOn_adj g a b).1 hE
    rw [SimpleGraph.fromEdgeSet_adj]
    refine ⟨hω', ?_⟩
    rw [hr a', hr b']
    exact fun h => hne (congrArg g h)
  constructor
  · intro h
    have h' : Relation.ReflTransGen (SimpleGraph.fromEdgeSet ω).Adj (r (g x)) (r (g y)) :=
      Relation.ReflTransGen.lift r h2 _ _ h
    rwa [hr x, hr y] at h'
  · intro h
    exact Relation.ReflTransGen.lift g h1 _ _ h

include hr in
/-- The lab's probability of `{x ↔ y}` under the weights `w` is our probability of `{g x ↔ g y}` in the complete
graph on the image of `g`, with the probabilities `w` on its edges. -/
theorem real_conn_eq_prob [Countable V] (w : Sym2 W → unitInterval) (x y : W) :
    (setLaw w).real (conn x y) =
      prob (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) (connEvent (completeOn g) (g x) (g y)) := by
  have hmap : (setLaw w).map (pull (edgeMap (completeOn g) r)) =
      percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) :=
    map_pull (edgeMap_completeOn_injective g r hr) w
  have hpre : pull (edgeMap (completeOn g) r) ⁻¹' connEvent (completeOn g) (g x) (g y) = conn x y := by
    ext ω
    exact joined_pull_iff g r hr ω x y
  show ((setLaw w) (conn x y)).toReal =
    ((percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)))
      (connEvent (completeOn g) (g x) (g y))).toReal
  rw [← hmap, Measure.map_apply (measurable_pull _) (measurableSet_connEvent _ _ _), hpre]

include hr in
/-- The same for the event `{x ↔ A}`. -/
theorem real_connSet_eq_prob [Countable V] (w : Sym2 W → unitInterval) (x : W) (A : Set W) :
    (setLaw w).real (⋃ a ∈ A, conn x a) =
      prob (completeOn g) (fun i => w (edgeMap (completeOn g) r i))
        (connSetEvent (completeOn g) (g x) (g '' A)) := by
  have hmap : (setLaw w).map (pull (edgeMap (completeOn g) r)) =
      percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)) :=
    map_pull (edgeMap_completeOn_injective g r hr) w
  have hpre : pull (edgeMap (completeOn g) r) ⁻¹' connSetEvent (completeOn g) (g x) (g '' A) =
      ⋃ a ∈ A, conn x a := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion, exists_prop]
    constructor
    · rintro ⟨_, ⟨a, ha, rfl⟩, h⟩
      exact ⟨a, ha, (joined_pull_iff g r hr ω x a).1 h⟩
    · rintro ⟨a, ha, h⟩
      exact ⟨g a, ⟨a, ha, rfl⟩, (joined_pull_iff g r hr ω x a).2 h⟩
  show ((setLaw w) (⋃ a ∈ A, conn x a)).toReal =
    ((percolationMeasure (completeOn g) (fun i => w (edgeMap (completeOn g) r i)))
      (connSetEvent (completeOn g) (g x) (g '' A))).toReal
  rw [← hmap, Measure.map_apply (measurable_pull _) (measurableSet_connSetEvent _ _ _), hpre]

end Pull

/-- On a countable vertex type the lab's event `{x ↔ y}` is measurable (it is the preimage of ours). -/
theorem measurableSet_conn {W : Type} [Countable W] (x y : W) : MeasurableSet (conn x y) := by
  have hpre : pull (edgeMap (completeOn (id : W → W)) id) ⁻¹' connEvent (completeOn id) x y = conn x y := by
    ext ω
    exact joined_pull_iff id id (fun _ => rfl) ω x y
  rw [← hpre]
  exact measurable_pull _ (measurableSet_connEvent _ _ _)

/-- Our probability of `{x ↔ y}` in `(G, p)` is the lab's probability of `{e x ↔ e y}` under the weights
`weightOf G p e`. -/
theorem prob_connEvent_eq_real {V W : Type} [Countable W] (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V ≃ W) (x y : V) :
    prob G p (connEvent G x y) = (setLaw (weightOf G p e)).real (conn (e x) (e y)) := by
  have hf := edgeMap_injective G e.injective
  have hmap : (percolationMeasure G p).map (push (edgeMap G e)) = setLaw (weightOf G p e) :=
    map_push hf p _ (weightOf_apply G p e.injective) (weightOf_of_notMem_range G p e)
  show ((percolationMeasure G p) (connEvent G x y)).toReal =
    ((setLaw (weightOf G p e)) (conn (e x) (e y))).toReal
  rw [← hmap, Measure.map_apply (measurable_push hf) (measurableSet_conn _ _), push_preimage_conn]

/-- The same for the event `{o ↔ A}`, with `A'` the finset of the images of `A`. -/
theorem prob_connSetEvent_eq_real {V W : Type} [Countable W] (G : SimpleGraph V)
    (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (e : V ≃ W) (A : Set V) (A' : Finset W) (hA : ∀ a, e a ∈ A' ↔ a ∈ A)
    (o : V) :
    prob G p (connSetEvent G o A) = (setLaw (weightOf G p e)).real (⋃ a ∈ A', conn (e o) a) := by
  have hf := edgeMap_injective G e.injective
  have hmap : (percolationMeasure G p).map (push (edgeMap G e)) = setLaw (weightOf G p e) :=
    map_push hf p _ (weightOf_apply G p e.injective) (weightOf_of_notMem_range G p e)
  have hpre : push (edgeMap G e) ⁻¹' (⋃ a ∈ A', conn (e o) a) = connSetEvent G o A := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion, exists_prop]
    constructor
    · rintro ⟨a', ha', h⟩
      refine ⟨e.symm a', (hA _).1 (by rwa [e.apply_symm_apply]), ?_⟩
      rw [← e.apply_symm_apply a'] at h
      exact (push_mem_conn G e ω o (e.symm a')).1 h
    · rintro ⟨a, ha, h⟩
      exact ⟨e a, (hA a).2 ha, (push_mem_conn G e ω o a).2 h⟩
  show ((percolationMeasure G p) (connSetEvent G o A)).toReal =
    ((setLaw (weightOf G p e)) (⋃ a ∈ A', conn (e o) a)).toReal
  rw [← hmap, Measure.map_apply (measurable_push hf)
    (Finset.measurableSet_biUnion _ fun a _ => measurableSet_conn _ _), hpre]

/-! ## 5. The implications between the lab's form and R0, N3 -/

/-- **Lab → R0.** Relabel the finite vertex type by `Fin n`, give weight `0` to every pair that is not an edge. -/
theorem conjecture3_of_labForm (h : LabForm) : KN3Planted.Planted4_hypothesisDropped := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro V _ G p A o b h₁ h₂
  classical
  obtain ⟨n, ⟨e⟩⟩ := Finite.exists_equiv_fin V
  have hA : ∀ a, e a ∈ (Finset.univ.filter fun i => e.symm i ∈ A) ↔ a ∈ A := fun a => by simp
  rw [prob_connEvent_eq_real G p e o b]
  refine H n (weightOf G p e) (Finset.univ.filter fun i => e.symm i ∈ A) (e o) (e b) ?_ ?_
  · rw [← prob_connSetEvent_eq_real G p e A _ hA o]
    exact h₁
  · intro a ha
    have ha' : e.symm a ∈ A := (hA (e.symm a)).1 (by rwa [e.apply_symm_apply])
    have h₃ := h₂ (e.symm a) ha'
    rw [prob_connEvent_eq_real G p e (e.symm a) b, e.apply_symm_apply] at h₃
    exact h₃

/-- **R0 → Lab.** The complete graph on `Fin n` with the probabilities `w` on its edges; the diagonal weights of
`w` are dropped (they change no connection). -/
theorem labForm_of_conjecture3 (h : KN3Planted.Planted4_hypothesisDropped) : LabForm := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro n w A o b h₁ h₂
  have hr : Function.LeftInverse (id : Fin n → Fin n) id := fun _ => rfl
  refine lt_of_lt_of_eq ?_ (real_conn_eq_prob id id hr w o b).symm
  refine H (Fin n) (completeOn id) _ (id '' (↑A : Set (Fin n))) o b ?_ ?_
  · exact lt_of_lt_of_eq h₁ (real_connSet_eq_prob id id hr w o ↑A)
  · rintro _ ⟨a, ha, rfl⟩
    exact lt_of_lt_of_eq (h₂ a ha) (real_conn_eq_prob id id hr w a b)

/-- **N3 → Lab.** One more vertex, isolated: the vertex type `Option (Fin n)`, the complete graph on the `some`
vertices. The image of `A` is then a proper subset, whatever `A` is. -/
theorem labForm_of_neighbour3 (h : Neighbour3_properSubset) : LabForm := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro n w A o b h₁ h₂
  have hr : Function.LeftInverse (fun v : Option (Fin n) => v.getD o) some := fun _ => rfl
  refine lt_of_lt_of_eq ?_ (real_conn_eq_prob some _ hr w o b).symm
  refine H (Option (Fin n)) (completeOn some) _ (some '' (↑A : Set (Fin n))) (some o) (some b) ?_ ?_ ?_
  · intro hA
    have hnone : (none : Option (Fin n)) ∈ some '' (↑A : Set (Fin n)) := hA ▸ Set.mem_univ _
    obtain ⟨a, -, ha⟩ := hnone
    exact Option.some_ne_none a ha
  · exact lt_of_lt_of_eq h₁ (real_connSet_eq_prob some _ hr w o ↑A)
  · rintro _ ⟨a, ha, rfl⟩
    exact lt_of_lt_of_eq (h₂ a ha) (real_conn_eq_prob some _ hr w a b)

/-- **Lab ↔ R0.** -/
theorem labForm_iff_conjecture3 : LabForm ↔ KN3Planted.Planted4_hypothesisDropped :=
  ⟨conjecture3_of_labForm, labForm_of_conjecture3⟩

end KN3Red4
