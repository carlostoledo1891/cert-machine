/-!
# PlantedCheck.lean — the status of four planted variants, proved

A FRAGMENT: compiled as `tmp/All.lean = Printed.lean ++ Check.lean ++ Planted.lean ++ PlantedCheck.lean`
(`combine.sh`). It uses the sanity lemmas of `Check.lean`.

Proved here: Planted 2 is TRUE (vacuously); Planted 3, 4 and 5 are FALSE. Also the easy implications
`Conjecture3 → Planted1`, `Conjecture3 → Neighbour2`, `Conjecture3 → Neighbour3`, which say only that these are
weakenings, and the equivalence `Conjecture3 ↔ Neighbour4` (A nonempty or not makes no difference).
Planted 1 (true) and Planted 6 (false) are argued in comments in `Planted.lean`, not proved.
-/

namespace KN3Planted

open KN3Printed

/-- In the graph with no edges, joined vertices are equal. -/
theorem joined_bot {V : Type} (ω : Config (⊥ : SimpleGraph V)) {v w : V}
    (h : Joined (⊥ : SimpleGraph V) ω v w) : v = w := by
  obtain ⟨n, x, rfl, rfl, hx⟩ := h
  cases n with
  | zero => rfl
  | succ n =>
    obtain ⟨hE, -⟩ := hx 0
    simp at hE

/-- In the graph with no edges, P(v ↔ w) = 0 for v ≠ w. -/
theorem prob_connEvent_bot {V : Type} (p : (⊥ : SimpleGraph V).edgeSet → Set.Icc (0 : ℝ) 1)
    {v w : V} (h : v ≠ w) : prob (⊥ : SimpleGraph V) p (connEvent ⊥ v w) = 0 := by
  have : connEvent (⊥ : SimpleGraph V) v w = ∅ :=
    Set.eq_empty_of_forall_notMem fun ω hω => h (joined_bot ω hω)
  simp [prob, this]

/-- Planted 2 (no `0 < δ`) is true: δ = −1. -/
theorem planted2_true : Planted2_deltaNotPositive := by
  intro ε _
  refine ⟨-1, ?_⟩
  intro V _ G p A o b h₁ _
  have := prob_le_one G p (connSetEvent G o A)
  linarith

/-- Planted 3 (conclusion reversed) is false: one vertex. -/
theorem planted3_false : ¬ Planted3_conclusionReversed := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Unit ⊥ (fun _ => ⟨0, by simp⟩) {()} () ()
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_singleton ())]; linarith)
    (fun a _ => by rw [prob_connEvent_of_eq _ _ rfl]; linarith)
  rw [prob_connEvent_of_eq _ _ rfl] at key
  linarith

/-- Planted 4 (the hypothesis on A ↔ b dropped) is false: two vertices, no edge, A = {o}. -/
theorem planted4_false : ¬ Planted4_hypothesisDropped := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Bool ⊥ (fun _ => ⟨0, by simp⟩) {false} false true
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_singleton false)]; linarith)
  rw [prob_connEvent_bot _ (by decide)] at key
  linarith

/-- Planted 5 ("for some a ∈ A") is false: two vertices, no edge, A = everything. -/
theorem planted5_false : ¬ Planted5_existsInsteadOfForall := by
  intro h
  obtain ⟨δ, hδ, H⟩ := h 1 one_pos
  have key := H Bool ⊥ (fun _ => ⟨0, by simp⟩) Set.univ false true
    (by rw [prob_connSetEvent_of_mem _ _ (Set.mem_univ false)]; linarith)
    ⟨true, Set.mem_univ true, by rw [prob_connEvent_of_eq _ _ rfl]; linarith⟩
  rw [prob_connEvent_bot _ (by decide)] at key
  linarith

/-- Planted 1 is a weakening of the conjecture (δ may be chosen after the graph). -/
theorem planted1_of_conjecture3 (h : Conjecture3) : Planted1_deltaAfterGraph := by
  intro ε hε V _ G p A o b
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, H V G p A o b⟩

/-- Neighbour 2 (constant probability) is a special case of the conjecture. -/
theorem neighbour2_of_conjecture3 (h : Conjecture3) : Neighbour2_constantProbability := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, fun V _ G q A o b => H V G (fun _ => q) A o b⟩

/-- Neighbour 3 (A a proper subset) is a special case of the conjecture. -/
theorem neighbour3_of_conjecture3 (h : Conjecture3) : Neighbour3_properSubset := by
  intro ε hε
  obtain ⟨δ, hδ, H⟩ := h ε hε
  exact ⟨δ, hδ, fun V _ G p A o b _ => H V G p A o b⟩

/-- Assuming A nonempty changes nothing: Conjecture 3 ↔ Neighbour 4. -/
theorem conjecture3_iff_neighbour4 : Conjecture3 ↔ Neighbour4_nonemptyA := by
  constructor
  · intro h ε hε
    obtain ⟨δ, hδ, H⟩ := h ε hε
    exact ⟨δ, hδ, fun V _ G p A o b _ => H V G p A o b⟩
  · intro h ε hε
    obtain ⟨δ, hδ, H⟩ := h ε hε
    refine ⟨min δ 1, lt_min hδ one_pos, ?_⟩
    intro V _ G p A o b h₁ h₂
    have hδ' : min δ 1 ≤ δ := min_le_left _ _
    rcases A.eq_empty_or_nonempty with hA | hA
    · exfalso
      have h0 : prob G p (connSetEvent G o A) = 0 := by
        have : connSetEvent G o A = ∅ := by
          ext ω; simp [connSetEvent, hA]
        simp [prob, this]
      have : min δ 1 ≤ 1 := min_le_right _ _
      linarith
    · exact H V G p A o b hA (by linarith) (fun a ha => by have := h₂ a ha; linarith)

#print axioms conjecture3_iff_neighbour4
#print axioms planted2_true
#print axioms planted3_false
#print axioms planted4_false
#print axioms planted5_false
#print axioms planted1_of_conjecture3
#print axioms neighbour2_of_conjecture3
#print axioms neighbour3_of_conjecture3

end KN3Planted
