# Kozma–Nitzan Conjecture 1 — what a later stage must prove

Nothing below is proved. There is no Lean on the machine where this was written, so every statement here is
unelaborated, and every Mathlib name mentioned in a "how" line is from memory and may be wrong. The statements
are meant to be proved with Mathlib only, in a file that has in scope the sealed `Printed.lean`, `Check.lean`,
`Planted.lean`, `PlantedCheck.lean` (namespaces `KN3Printed`, `KN3Planted`) and `Printed1.lean`, `Planted1.lean`
(namespaces `KN1Printed`, `KN1Planted`), under

```lean
open KN3Printed KN1Printed KN1Planted
```

Difficulty: **line** (a few lines), **half page**, **page**, **hard** (needs a tool that I do not know to be in
Mathlib, or a long transport). "P(x ↔ y)" abbreviates `prob G p (connEvent G x y)`.

Facts from the sealed `Check.lean` / `PlantedCheck.lean` that the proofs can use: `prob_nonneg`, `prob_le_one`,
`prob_univ`, `prob_mono`, `prob_connEvent_of_eq` (P(v ↔ v) = 1), `prob_connSetEvent_of_mem` (P(v ↔ A) = 1 for
v ∈ A), `connSetEvent_singleton`, `joined_refl`, `joined_trans`, `measurableSet_connEvent`,
`measurableSet_connSetEvent`, `percolationMeasure_singleton`, `joined_bot`, `prob_connEvent_bot` (no edge and
v ≠ w: P(v ↔ w) = 0).

Three small facts are needed again and again; prove them first:

```lean
/-- The event {v ↔ ∅} is empty. -/
theorem prob_connSetEvent_empty {V : Type} (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1) (v : V) :
    prob G p (connSetEvent G v ∅) = 0 := by sorry                                   -- line

/-- A finite nonempty set of vertices has a point where P(a ↔ b) is least. -/
theorem exists_minimiser {V : Type} [Finite V] (G : SimpleGraph V) (p : G.edgeSet → Set.Icc (0 : ℝ) 1)
    (A : Set V) (b : V) (hA : A.Nonempty) :
    ∃ a ∈ A, ∀ a' ∈ A, prob G p (connEvent G a b) ≤ prob G p (connEvent G a' b) := by sorry   -- line

/-- With no edge, P(v ↔ A) = 0 for v ∉ A. -/
theorem prob_connSetEvent_bot {V : Type} (p : (⊥ : SimpleGraph V).edgeSet → Set.Icc (0 : ℝ) 1)
    {v : V} {A : Set V} (h : v ∉ A) : prob (⊥ : SimpleGraph V) p (connSetEvent ⊥ v A) = 0 := by sorry   -- line
```

(How, for `exists_minimiser`: `Set.Finite.exists_minimalFor`-style, or `Finite.exists_min` on the subtype `↥A`
with `hA.to_subtype`.)

## 1. Readings equivalent to the primary

Each must be proved as an `↔` with `Conjecture1`. If one of them fails, my belief was wrong and READING1.md §5
must be corrected.

```lean
-- 1.1  The earlier author's form. half page.
--      (→) exists_minimiser gives a₀; apply the primary with m = P(a₀ ↔ b).
--      (←) the witness a of the ∃-form has m ≤ P(a ↔ b); multiply by P(o ↔ A) ≥ 0.
theorem conjecture1_iff_existsForm : Conjecture1 ↔ Conjecture1_existsForm := by sorry

-- 1.2  The same term as the sealed neighbour record. line (expected: `Iff.rfl`).
theorem existsForm_iff_sealedNeighbour1 :
    Conjecture1_existsForm ↔ KN3Planted.Neighbour1_Conjecture1 := by sorry

-- 1.3  line.  m := P(a ↔ b).
theorem conjecture1_iff_minimiser : Conjecture1 ↔ Conjecture1_minimiser := by sorry

-- 1.4  half page.  A = ∅: prob_connSetEvent_empty and zero_mul.  A nonempty: exists_minimiser, then
--      m ≤ m₀ and P(o ↔ A) ≥ 0.
theorem conjecture1_iff_lowerBound : Conjecture1 ↔ Conjecture1_lowerBound := by sorry

-- 1.5  line.  The second disjunct forces A = ∅, where the right side is 0 · c.
theorem conjecture1_iff_emptyMinIs (c : ℝ) : Conjecture1 ↔ Conjecture1_emptyMinIs c := by sorry

-- 1.6  line.  o = b: left side 1; right side ≤ 1 (two numbers in [0, 1]).
theorem conjecture1_iff_distinct : Conjecture1 ↔ Conjecture1_distinct := by sorry

-- 1.7  line.  A = univ: o ∈ A, so P(o ↔ A) = 1 and m ≤ P(o ↔ b).
theorem conjecture1_iff_properSubset : Conjecture1 ↔ Conjecture1_properSubset := by sorry

-- 1.8  (→) line: `Fin n` is a finite type.
theorem onFin_of_conjecture1 : Conjecture1 → Conjecture1_onFin := by sorry
--      (←) hard (long, routine): transport G, p, the events and the product measure along an equivalence
--      V ≃ Fin n (`Finite.equivFin`), showing `prob` is invariant.  Not needed for any comparison unless the
--      third party states the conjecture on `Fin n`.
theorem conjecture1_of_onFin : Conjecture1_onFin → Conjecture1 := by sorry

-- 1.9  line.  Unfold `IsLeast`, `lowerBounds`, membership in the set-builder.
theorem conjecture1_iff_isLeast : Conjecture1 ↔ Conjecture1_isLeast := by sorry

-- 1.10 page.  A = ∅: the set is empty, `Real.sInf_empty`, and the factor is 0 anyway.
--      A nonempty: the set of values is finite and nonempty; its `sInf` is its least element
--      (`IsLeast.csInf_eq`), obtained from exists_minimiser.
theorem conjecture1_iff_sInf : Conjecture1 ↔ Conjecture1_sInf := by sorry

-- 1.11 page.  As 1.10 with `⨅` over the subtype (`Real.iInf_of_isEmpty` for A = ∅; for A nonempty the `⨅` is
--      the value at the minimiser: `ciInf_le` with a lower bound 0, and `le_ciInf`).
theorem conjecture1_iff_iInf : Conjecture1 ↔ Conjecture1_iInf := by sorry

-- 1.12 page.  The three measures are ≤ 1, hence finite; `ENNReal.toReal` is monotone on finite values and
--      multiplicative; for A nonempty the `⨅ a ∈ A` in ℝ≥0∞ is attained at the minimiser; for A = ∅ it is ⊤
--      and the left factor is 0.
theorem conjecture1_iff_ennreal : Conjecture1 ↔ Conjecture1_ennreal := by sorry
```

## 2. Planted variants that must be proved FALSE

The first nine use graphs with no edge, where everything is 0 or 1; the proofs follow the pattern of the sealed
`planted3_false` / `planted4_false` / `planted5_false`. The probabilities argument is `fun _ => ⟨0, by simp⟩`
(the graph has no edge, so its value is never used).

```lean
-- 2.1  line.  V = Bool, G = ⊥, A = Set.univ, o = false, b = true, m = 1.
--      Hypotheses: a = true has P(true ↔ true) = 1; every P(a ↔ true) ≤ 1.  Conclusion 0 ≥ 1 · 1 fails
--      (P(false ↔ true) = 0 by prob_connEvent_bot; P(false ↔ univ) = 1 by prob_connSetEvent_of_mem).
theorem planted1_false : ¬ Planted1_maxInPlaceOfMin := by sorry

-- 2.2  line.  The same instance, a = true.
theorem planted2_false : ¬ Planted2_forAllAInPlaceOfMin := by sorry

-- 2.3  line.  V = Bool, G = ⊥, A = {true}, o = false, b = false, m = 0.
--      Hypotheses: P(true ↔ false) = 0 = m.  Conclusion 1 ≤ 0 · 0 fails (P(false ↔ false) = 1).
theorem planted3_false : ¬ Planted3_inequalityReversed := by sorry

-- 2.4  line.  V = Unit, G = ⊥, A = {()}, o = b = (), m = 1.  Conclusion 1 > 1 · 1 fails.
theorem planted4_false : ¬ Planted4_strictInequality := by sorry

-- 2.5  line.  V = Bool, G = ⊥, A = Finset.univ, o = false, b = true.
--      Sum = P(false ↔ true) + P(true ↔ true) = 0 + 1 (`Fintype.sum_bool`).  Conclusion 0 ≥ 1 · 1 fails.
theorem planted5_false : ¬ Planted5_sumInPlaceOfMin := by sorry

-- 2.6  line.  V = Unit, G = ⊥, A = ∅: no witness.
theorem planted6_false : ¬ Planted6_existsWithoutNonempty := by sorry

-- 2.7  line.  V = Bool, G = ⊥, A = {true}, o = false, b = true, m = 1.  Conclusion 0 ≥ 1 fails.
theorem planted7_false : ¬ Planted7_factorDropped := by sorry

-- 2.8  line.  V = Bool, G = ⊥, A = {false}, o = false, b = true, m = 1 (= P(false ↔ false)).
--      Conclusion 0 ≥ 1 · 1 fails.
theorem planted8_false : ¬ Planted8_minOverWrongEvent := by sorry

-- 2.9  line.  V = Unit, G = ⊥, A = {()}, o = b = (), m = 1.  Conclusion 1 ≥ 2 · (1 · 1) fails.
theorem planted9_false : ¬ Planted9_constantTwo := by sorry

-- 2.10 half page.  V = Bool, G = ⊤ (one edge), every edge probability 1, A = Finset.univ, o = b = false, m = 1.
--      Needs P(false ↔ true) = 1 when the edge has probability 1: `coin 1` is the Dirac mass at `true`, the
--      event contains the configuration "all open", whose weight is 1 (percolationMeasure_singleton needs a
--      `Fintype` instance on the edge set).  Sum = 1 + 1 = 2.  Conclusion 1 ≥ 2 · 1 fails.
theorem planted10_false : ¬ Planted10_sumInPlaceOfSetEvent := by sorry

-- 2.11 page.  V = Fin 3 (o = 0, a = 1, b = 2), G = ⊤ with p{0,1} = p{1,2} = 1/2 and p{0,2} = 0 (or the path
--      graph with both edges 1/2), A = {1}, m = 1/2.  Exact values: P(0 ↔ 1) = 1/2, P(1 ↔ 2) = 1/2,
--      P(0 ↔ 2) = 1/4.  Conclusion 1/4 ≥ min (1/2) (1/2) fails.  The work is the three exact probabilities
--      (a sum over the edge configurations).
theorem planted11_false : ¬ Planted11_minOfTheTwoFactors := by sorry
```

2.1–2.9 are the controls to prove first: each is a few lines, and at least three of them are required.

## 3. Planted variants that must be proved TRUE

```lean
-- 3.1  page, no percolation needed.  Write I for the real `⨅ a, ⨅ (_ : a ∈ A), P(a ↔ b)`.
--      (i) I ≥ 0 (`Real.iInf_nonneg`, twice).  (ii) I ≤ (the inner value at a = o) by `ciInf_le` (bounded below
--      by 0).  (iii) if o ∉ A the inner value at o is the `⨅` over an empty index, which is 0, so I = 0;
--      if o ∈ A it is P(o ↔ b) and P(o ↔ A) = 1.  This one matters: it shows that the most natural-looking
--      Lean spelling of the minimum gives a trivial statement.
theorem planted12_true : Planted12_realIInfOverMembership := by sorry
```

The next four are true by the Harris–FKG inequality for the product measure. I do not know whether Mathlib has
it; if not, 3.2 is **hard** (it must be proved for `percolationMeasure`), and 3.3–3.5 follow from it.

```lean
-- 3.2  hard unless Harris's inequality is available: increasing events {o ↔ a}, {a ↔ b}, and
--      joined_trans for the inclusion of their intersection in {o ↔ b}.
theorem neighbour1_true : Neighbour1_HarrisFKG := by sorry

-- 3.3  line, from 3.2 (any a ∈ A).
theorem planted13_of_harris : Neighbour1_HarrisFKG → Planted13_pointInPlaceOfSet := by sorry

-- 3.4  half page, from 3.2: {o ↔ every a ∈ A} ⊆ {o ↔ a₀}, then 3.2 at a₀, the point with P(a₀ ↔ b) = m.
theorem planted15_of_harris : Neighbour1_HarrisFKG → Planted15_connectedToAllOfA := by sorry

-- 3.5  hard: needs Harris's inequality for the finitely many events {o ↔ A}, {a ↔ b} (a ∈ A) together,
--      not only the three-vertex form 3.2.
theorem planted14_true : Planted14_productInPlaceOfMin := by sorry
```

## 4. Implications that hold one way

From the conjecture to its weakenings (all should be proved; they show which side each neighbour lies on):

```lean
-- 4.1  half page.  δ := min (ε / 2) 1.  From P(o ↔ A) > 1 − δ ≥ 0 the set A is nonempty
--      (prob_connSetEvent_empty); the ∃-form (1.1) gives a with
--      P(o ↔ b) ≥ P(o ↔ A) · P(a ↔ b) > (1 − δ)² ≥ 1 − 2δ ≥ 1 − ε.
--      (The paper's δ = 1 − √(1 − ε) also works, for ε ≤ 1.)
theorem conjecture3_of_conjecture1 : Conjecture1 → KN3Printed.Conjecture3 := by sorry

-- 4.2  line.  A = {a}: connSetEvent_singleton.
theorem harris_of_conjecture1 : Conjecture1 → Neighbour1_HarrisFKG := by sorry

-- 4.3  line (through 1.1): {o ↔ a} ⊆ {o ↔ A} for a ∈ A, prob_mono.
theorem planted13_of_conjecture1 : Conjecture1 → Planted13_pointInPlaceOfSet := by sorry

-- 4.4  half page: a product of numbers in [0, 1] over a nonempty finset is ≤ each factor; the empty finset
--      gives the factor P(o ↔ ∅) = 0.
theorem planted14_of_conjecture1 : Conjecture1 → Planted14_productInPlaceOfMin := by sorry

-- 4.5  line: the event "joined to every a ∈ A" is inside {o ↔ A} when A has a point.
theorem planted15_of_conjecture1 : Conjecture1 → Planted15_connectedToAllOfA := by sorry

-- 4.6  line each: special cases.
theorem planted16_of_conjecture1 : Conjecture1 → Planted16_oneCommonProbability := by sorry
theorem neighbour8_of_conjecture1 : Conjecture1 → Neighbour8_probabilitiesStrictlyInside := by sorry
theorem neighbour9_of_conjecture1 : Conjecture1 → Neighbour9_allEdgesHalf := by sorry
theorem neighbour10_of_conjecture1 : Conjecture1 → Neighbour10_sideConditions := by sorry
theorem neighbour11_of_conjecture1 : Conjecture1 → Neighbour11_notAdjacent := by sorry
theorem neighbour12_of_conjecture1 : Conjecture1 → Neighbour12_levelSets := by sorry

-- 4.7  line: the right side P(o ↔ A) · m is ≥ 0, so half of it is smaller.
theorem planted17_of_conjecture1 : Conjecture1 → Planted17_constantHalf := by sorry
```

From stronger statements to the conjecture:

```lean
-- 4.8  line (through 1.4): a finite type is countable.
theorem conjecture1_of_neighbour7 : Neighbour7_countableGraph → Conjecture1 := by sorry

-- 4.9  line: {o ↔ b} ∩ {o ↔ A} ⊆ {o ↔ b}, prob_mono.
theorem neighbour2_of_neighbour3 : Neighbour3_inequality3 → Neighbour2_Conjecture2_preFKG := by sorry

-- 4.10 hard (FKG for {o ↔ A} and {a ↔ b}): "Conjecture 1 follows from conjecture 2 by an application of the
--      FKG inequality" (page 3).
theorem conjecture1_of_neighbour2 : Neighbour2_Conjecture2_preFKG → Conjecture1 := by sorry

-- 4.11 hard (the same FKG step, after 4.9-style monotonicity): Question 7 answered "yes" gives the conjecture.
theorem conjecture1_of_neighbour4 : Neighbour4_Question7 → Conjecture1 := by sorry
```

## 5. What is NOT asked, and why

- No converse of 4.1 (`Conjecture3 → Conjecture1`): the paper does not claim it, and I do not believe it is
  known.
- No converse of 4.6 / 4.7 (one common probability, all edges ½, strictly inside (0, 1), side conditions,
  0 ≁ b, level sets, factor ½): the paper sketches some of them as "simple reductions" (§5.6); they are
  arguments that change the graph or pass to a limit, each a project of its own in Lean. A third-party
  statement that matches one of these is a neighbour until that argument is formalized.
- No converse of 4.8 (finite to countable, by exhaustion).
- `Neighbour5_Conjecture6_gluing → Conjecture1` (the paper's Lemma 13, a proof sketch using concavity in one
  edge probability): not asked.
- The status of `Conjecture1` itself, of `Neighbour2`, `Neighbour3`, `Neighbour4`, `Neighbour5`, `Planted16`,
  `Planted17`: unknown to me; per the paper, open.

## 6. If a statement here turns out not to elaborate or not to be provable

Record it as a finding against this file, do not repair the sealed `.lean` files in place: a definition marked
UNVERIFIED that fails to elaborate is a defect of spelling to be reported with the error text; an equivalence of
§1 that turns out false is a defect of reading and reopens READING1.md.
