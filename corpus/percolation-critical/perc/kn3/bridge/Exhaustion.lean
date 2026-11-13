/-!
# Exhaustion.lean — R0 → RB: from finite graphs to countable graphs

A FRAGMENT (Mathlib + the sealed files + `Transport.lean`; nothing of the lab): compiled appended to
`… ++ Transport.lean`, or on the pod as the module `KN3.Exhaustion` behind `import KN3.Transport`.

`readingB_of_conjecture3 : Conjecture3 → Conjecture3_readingB`, with the SAME δ. This is not an encoding change:
it is the exhaustion argument that `READING.md` (A1) calls "a proof, not a reading". It uses σ-additivity
(continuity of a measure along a countable directed union) and the monotonicity of connection events in the
vertex set; it uses nothing about gluing.

For a countable graph `G`, edge probabilities `p`, a set `A` and vertices `o`, `b` with `P(o ↔ A) > 1 − δ` and
`P(a ↔ b) > 1 − δ` for all `a ∈ A`:

1. `{o ↔ A} = ⋃_B {o ↔ A ∩ B}` over the finite sets `B`: some finite `B` has `P(o ↔ A ∩ B) > 1 − δ`;
2. `{x ↔ y} = ⋃_S {x ↔ y by a path inside S}` over the finite vertex sets `S`: some `S₀` has
   `P(o ↔ A ∩ B inside S₀) > 1 − δ`, and each of the finitely many `a ∈ A ∩ B` has an `S_a` with
   `P(a ↔ b inside S_a) > 1 − δ` (the strict inequalities are what lets the same δ survive);
3. on `T := S₀ ∪ B ∪ {o, b} ∪ ⋃_{a ∈ B} S_a`, "joined inside `T`" is "joined in the induced graph on `T`", whose
   law is the restriction of the configuration (a sub-family of the independent coins): the finite statement
   applies and gives `P(o ↔ b inside T) > 1 − ε`;
4. `{o ↔ b inside T} ⊆ {o ↔ b}`.
-/

namespace KN3Exhaustion

open MeasureTheory KN3Printed

/-- Continuity from below along a countable directed family, in the form used here. -/
theorem exists_lt_of_lt_iUnion {Ω ι : Type*} [MeasurableSpace Ω] (μ : Measure Ω) [IsFiniteMeasure μ]
    [Countable ι] [Nonempty ι] (s : ι → Set Ω) (hd : Directed (· ⊆ ·) s) {c : ℝ}
    (h : c < (μ (⋃ i, s i)).toReal) : ∃ i, c < (μ (s i)).toReal := by
  rcases lt_or_ge c 0 with hc | hc
  · exact ⟨Classical.arbitrary ι, lt_of_lt_of_le hc ENNReal.toReal_nonneg⟩
  · have h' : ENNReal.ofReal c < μ (⋃ i, s i) :=
      (ENNReal.ofReal_lt_iff_lt_toReal hc (measure_ne_top _ _)).2 h
    rw [hd.measure_iUnion] at h'
    obtain ⟨i, hi⟩ := lt_iSup_iff.1 h'
    exact ⟨i, (ENNReal.ofReal_lt_iff_lt_toReal hc (measure_ne_top _ _)).1 hi⟩

section Induced

variable {V : Type} (G : SimpleGraph V)

/-- The graph induced by `G` on the finite vertex set `S`. -/
abbrev sub (S : Finset V) : SimpleGraph S := SimpleGraph.comap (Subtype.val : S → V) G

theorem map_val_mem_edgeSet {S : Finset V} {s : Sym2 S} (hs : s ∈ (sub G S).edgeSet) :
    Sym2.map Subtype.val s ∈ G.edgeSet := by
  induction s using Sym2.ind with
  | _ a b => exact hs

/-- An edge of the induced graph, as an edge of `G`. -/
def edgeIncl (S : Finset V) : (sub G S).edgeSet → G.edgeSet :=
  fun i => ⟨Sym2.map Subtype.val i.1, map_val_mem_edgeSet G i.2⟩

theorem edgeIncl_injective (S : Finset V) : Function.Injective (edgeIncl G S) :=
  fun _ _ h => Subtype.ext (Sym2.map.injective Subtype.val_injective (congrArg Subtype.val h))

/-- A configuration of `G`, restricted to the edges of the induced graph. -/
def restrict (S : Finset V) (ω : Config G) : Config (sub G S) := fun i => ω (edgeIncl G S i)

theorem measurable_restrict (S : Finset V) : Measurable (restrict G S) :=
  measurable_pi_lambda _ fun _ => measurable_pi_apply _

/-- The restriction of the percolation measure of `G` is the percolation measure of the induced graph. -/
theorem map_restrict (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) :
    (percolationMeasure G p).map (restrict G S) = percolationMeasure (sub G S) (fun i => p (edgeIncl G S i)) :=
  KN3Transport.infinitePi_map_comp_injective (fun e => coin (p e)) (edgeIncl G S) (edgeIncl_injective G S)

/-- `v` and `w` are joined by an open path of `G` all of whose vertices lie in `S`. -/
def JoinedIn (ω : Config G) (S : Finset V) (v w : V) : Prop :=
  ∃ (n : ℕ) (x : Fin (n + 1) → V), x 0 = v ∧ x (Fin.last n) = w ∧ (∀ i, x i ∈ S) ∧
    ∀ i : Fin n, ∃ h : s(x i.castSucc, x i.succ) ∈ G.edgeSet, ω ⟨s(x i.castSucc, x i.succ), h⟩ = true

theorem JoinedIn.joined {ω : Config G} {S : Finset V} {v w : V} (h : JoinedIn G ω S v w) : Joined G ω v w := by
  obtain ⟨n, x, h0, hl, -, hx⟩ := h
  exact ⟨n, x, h0, hl, hx⟩

theorem JoinedIn.mono {ω : Config G} {S T : Finset V} (hST : S ⊆ T) {v w : V} (h : JoinedIn G ω S v w) :
    JoinedIn G ω T v w := by
  obtain ⟨n, x, h0, hl, hS, hx⟩ := h
  exact ⟨n, x, h0, hl, fun i => hST (hS i), hx⟩

theorem JoinedIn.right_mem {ω : Config G} {S : Finset V} {v w : V} (h : JoinedIn G ω S v w) : w ∈ S := by
  obtain ⟨n, x, -, hl, hS, -⟩ := h
  exact hl ▸ hS (Fin.last n)

theorem joined_iff_exists_joinedIn (ω : Config G) (v w : V) :
    Joined G ω v w ↔ ∃ S : Finset V, JoinedIn G ω S v w := by
  classical
  constructor
  · rintro ⟨n, x, h0, hl, hx⟩
    exact ⟨Finset.univ.image x, n, x, h0, hl, fun i => Finset.mem_image_of_mem x (Finset.mem_univ i), hx⟩
  · rintro ⟨S, h⟩
    exact h.joined

/-- Inside `S`, "joined by a path inside `S`" is "joined in the induced graph, in the restricted configuration". -/
theorem joinedIn_iff (ω : Config G) (S : Finset V) {v w : V} (hv : v ∈ S) (hw : w ∈ S) :
    JoinedIn G ω S v w ↔ Joined (sub G S) (restrict G S ω) ⟨v, hv⟩ ⟨w, hw⟩ := by
  constructor
  · rintro ⟨n, x, h0, hl, hS, hx⟩
    refine ⟨n, fun i => ⟨x i, hS i⟩, Subtype.ext h0, Subtype.ext hl, fun i => ?_⟩
    obtain ⟨h, hω⟩ := hx i
    exact ⟨h, hω⟩
  · rintro ⟨n, x, h0, hl, hx⟩
    refine ⟨n, fun i => (x i).1, congrArg Subtype.val h0, congrArg Subtype.val hl, fun i => (x i).2, fun i => ?_⟩
    obtain ⟨h, hω⟩ := hx i
    exact ⟨h, hω⟩

/-- The event "`v ↔ w` inside `S`". -/
def connIn (S : Finset V) (v w : V) : Set (Config G) := {ω | JoinedIn G ω S v w}

/-- The event "`v ↔ A` inside `S`". -/
def connSetIn (S : Finset V) (v : V) (A : Set V) : Set (Config G) := {ω | ∃ a ∈ A, JoinedIn G ω S v a}

theorem connEvent_eq_iUnion (v w : V) : connEvent G v w = ⋃ S : Finset V, connIn G S v w := by
  ext ω
  simp only [connEvent, connIn, Set.mem_setOf_eq, Set.mem_iUnion]
  exact joined_iff_exists_joinedIn G ω v w

theorem connSetEvent_eq_iUnion (v : V) (A : Set V) :
    connSetEvent G v A = ⋃ S : Finset V, connSetIn G S v A := by
  ext ω
  simp only [connSetEvent, connSetIn, Set.mem_setOf_eq, Set.mem_iUnion]
  constructor
  · rintro ⟨a, ha, h⟩
    obtain ⟨S, hS⟩ := (joined_iff_exists_joinedIn G ω v a).1 h
    exact ⟨S, a, ha, hS⟩
  · rintro ⟨S, a, ha, h⟩
    exact ⟨a, ha, h.joined⟩

theorem connIn_mono {S T : Finset V} (hST : S ⊆ T) (v w : V) : connIn G S v w ⊆ connIn G T v w :=
  fun _ h => JoinedIn.mono G hST h

theorem connSetIn_mono {S T : Finset V} (hST : S ⊆ T) (v : V) (A : Set V) :
    connSetIn G S v A ⊆ connSetIn G T v A :=
  fun _ ⟨a, ha, h⟩ => ⟨a, ha, JoinedIn.mono G hST h⟩

theorem connIn_subset (S : Finset V) (v w : V) : connIn G S v w ⊆ connEvent G v w :=
  fun _ h => JoinedIn.joined G h

theorem directed_connIn (v w : V) : Directed (· ⊆ ·) (fun S : Finset V => connIn G S v w) := by
  classical
  exact directed_of_isDirected_le fun S T hST => connIn_mono G hST v w

theorem directed_connSetIn (v : V) (A : Set V) :
    Directed (· ⊆ ·) (fun S : Finset V => connSetIn G S v A) := by
  classical
  exact directed_of_isDirected_le fun S T hST => connSetIn_mono G hST v A

/-- The probability of "`v ↔ w` inside `S`" is the probability of `v ↔ w` in the induced graph. -/
theorem prob_connIn (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) {v w : V} (hv : v ∈ S) (hw : w ∈ S) :
    prob G p (connIn G S v w) =
      prob (sub G S) (fun i => p (edgeIncl G S i)) (connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩) := by
  have hpre : restrict G S ⁻¹' connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩ = connIn G S v w := by
    ext ω
    exact (joinedIn_iff G ω S hv hw).symm
  show ((percolationMeasure G p) (connIn G S v w)).toReal =
    ((percolationMeasure (sub G S) (fun i => p (edgeIncl G S i))) (connEvent (sub G S) ⟨v, hv⟩ ⟨w, hw⟩)).toReal
  rw [← map_restrict, Measure.map_apply (measurable_restrict G S) (measurableSet_connEvent _ _ _), hpre]

/-- The same for "`v ↔ A` inside `S`". -/
theorem prob_connSetIn (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (S : Finset V) {v : V} (hv : v ∈ S) (A : Set V) :
    prob G p (connSetIn G S v A) =
      prob (sub G S) (fun i => p (edgeIncl G S i))
        (connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A)) := by
  have hpre : restrict G S ⁻¹' connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A) = connSetIn G S v A := by
    ext ω
    simp only [Set.mem_preimage, connSetEvent, connSetIn, Set.mem_setOf_eq]
    constructor
    · rintro ⟨a, ha, h⟩
      exact ⟨a.1, ha, (joinedIn_iff G ω S hv a.2).2 h⟩
    · rintro ⟨a, ha, h⟩
      exact ⟨⟨a, JoinedIn.right_mem G h⟩, ha, (joinedIn_iff G ω S hv (JoinedIn.right_mem G h)).1 h⟩
  show ((percolationMeasure G p) (connSetIn G S v A)).toReal =
    ((percolationMeasure (sub G S) (fun i => p (edgeIncl G S i)))
      (connSetEvent (sub G S) ⟨v, hv⟩ (Subtype.val ⁻¹' A))).toReal
  rw [← map_restrict, Measure.map_apply (measurable_restrict G S) (measurableSet_connSetEvent _ _ _), hpre]

end Induced

/-- **R0 → RB.** The finite-graph statement implies the countable-graph statement, with the same δ. -/
theorem readingB_of_conjecture3 (h : Conjecture3) : Conjecture3_readingB := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  refine ⟨δ, hδ, ?_⟩
  intro V _ G p A o b h₁ h₂
  classical
  -- 1. a finite part of A is enough
  have hU1 : connSetEvent G o A = ⋃ B : Finset V, connSetEvent G o (A ∩ ↑B) := by
    ext ω
    simp only [connSetEvent, Set.mem_setOf_eq, Set.mem_iUnion]
    constructor
    · rintro ⟨a, ha, hj⟩
      exact ⟨{a}, a, ⟨ha, by simp⟩, hj⟩
    · rintro ⟨B, a, ha, hj⟩
      exact ⟨a, ha.1, hj⟩
  have hd1 : Directed (· ⊆ ·) (fun B : Finset V => connSetEvent G o (A ∩ ↑B)) :=
    directed_of_isDirected_le fun B B' hBB' _ ⟨a, ha, hj⟩ =>
      ⟨a, ⟨ha.1, Finset.coe_subset.2 hBB' ha.2⟩, hj⟩
  obtain ⟨B, hB⟩ : ∃ B : Finset V, 1 - δ < prob G p (connSetEvent G o (A ∩ ↑B)) := by
    have h₁' : 1 - δ < prob G p (connSetEvent G o A) := h₁
    rw [hU1] at h₁'
    exact exists_lt_of_lt_iUnion (percolationMeasure G p) _ hd1 h₁'
  -- 2. finite vertex sets are enough, for o ↔ A ∩ B and for each a ↔ b
  obtain ⟨S₀, hS₀⟩ : ∃ S : Finset V, 1 - δ < prob G p (connSetIn G S o (A ∩ ↑B)) := by
    rw [connSetEvent_eq_iUnion] at hB
    exact exists_lt_of_lt_iUnion (percolationMeasure G p) _ (directed_connSetIn G o _) hB
  have hS2 : ∀ a : V, ∃ S : Finset V, a ∈ A → 1 - δ < prob G p (connIn G S a b) := by
    intro a
    by_cases ha : a ∈ A
    · have h₂' : 1 - δ < prob G p (connEvent G a b) := h₂ a ha
      rw [connEvent_eq_iUnion] at h₂'
      obtain ⟨S, hS⟩ := exists_lt_of_lt_iUnion (percolationMeasure G p) _ (directed_connIn G a b) h₂'
      exact ⟨S, fun _ => hS⟩
    · exact ⟨∅, fun ha' => (ha ha').elim⟩
  choose Sf hSf using hS2
  -- 3. one finite vertex set for all of them
  let T : Finset V := S₀ ∪ B ∪ {o, b} ∪ B.biUnion Sf
  have hS₀T : S₀ ⊆ T := fun x hx => by simp [T, hx]
  have hoT : o ∈ T := by simp [T]
  have hbT : b ∈ T := by simp [T]
  have hSfT : ∀ a ∈ B, Sf a ⊆ T := fun a ha x hx => by
    have : x ∈ B.biUnion Sf := Finset.mem_biUnion.2 ⟨a, ha, hx⟩
    simp [T, this]
  have key := H (↥T) (sub G T) (fun i => p (edgeIncl G T i)) (Subtype.val ⁻¹' (A ∩ ↑B)) ⟨o, hoT⟩ ⟨b, hbT⟩
    (by
      rw [← prob_connSetIn G p T hoT (A ∩ ↑B)]
      exact lt_of_lt_of_le hS₀ (prob_mono G p (connSetIn_mono G hS₀T o _)))
    (by
      rintro ⟨a, haT⟩ ⟨haA, haB⟩
      rw [← prob_connIn G p T haT hbT]
      exact lt_of_lt_of_le (hSf a haA) (prob_mono G p (connIn_mono G (hSfT a haB) a b)))
  -- 4. back up
  rw [← prob_connIn G p T hoT hbT] at key
  exact lt_of_lt_of_le key (prob_mono G p (connIn_subset G T o b))

end KN3Exhaustion
