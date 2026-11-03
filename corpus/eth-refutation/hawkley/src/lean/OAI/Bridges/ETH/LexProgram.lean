import OAI.Bridges.ETH.SortProgram
import OAI.Bridges.ETH.CanonicalWord

/-!
# ETH correspondence, component B2, milestone B2.2: lexicographic comparison

`canonicalWord` (milestone B1b) sorts its clause code lists with `List.insertionSort (· ≤ ·)` on
`List ℕ`. That `≤` is the lexicographic order:

* `[] ≤ l` for every `l`;
* `a :: l ≤ []` never holds;
* `a :: l₁ ≤ b :: l₂ ↔ a < b ∨ a = b ∧ l₁ ≤ l₂`;

so a proper prefix comes first. This `≤` is Mathlib's instance `List.LE'`, which overrides core's
`List.instLE`; `listLe_iff` unfolds it to `Lex (· < ·)` or equality, and `lexLe_nil_left`,
`lexLe_cons_nil` and `lexLe_cons_cons` prove the three facts for it, and `formulaWordNumbers_eq_sort` checks by
`rfl` that it is the order `canonicalWord` uses.

The comparison program has two stages, both built from existing ParityLifts programs:

1. `stripProgram`: a `foldlGrowing` loop, run once per element of the first list, whose step
   `stripStep` removes equal heads from both lists;
2. `decideProgram`: on the stripped pair, `true` if the first list is empty, `false` if only the
   second is, and otherwise `a < b` on the two (now different) heads, computed as `a + 1 ≤ b`
   with `natSucc` and `natLe`.

`lexLeProgram : PolyProgram (List ℕ × List ℕ) Bool (fun x => decide (x.1 ≤ x.2))` composes them.
Its cost is polynomial in the size of the serialized pair, which is one more than the sum of the
sizes of the two lists. `clauseListSortProgram` feeds it to the generic `sortByProgram` of B2.1.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity

/-! ### Order semantics -/

/-- Mathlib's `≤` on `List ℕ` (`List.LE'`, which overrides core's `List.instLE`) is
`Lex (· < ·)` or equality. -/
theorem listLe_iff (l₁ l₂ : List ℕ) : l₁ ≤ l₂ ↔ List.Lex (· < ·) l₁ l₂ ∨ l₁ = l₂ := by
  rw [le_iff_lt_or_eq]
  rfl

theorem lexLe_nil_left (l : List ℕ) : ([] : List ℕ) ≤ l := by
  rw [listLe_iff]
  cases l with
  | nil => exact Or.inr rfl
  | cons a t => exact Or.inl List.Lex.nil

theorem lexLe_cons_nil (a : ℕ) (l : List ℕ) : ¬ (a :: l ≤ []) := by
  rw [listLe_iff]
  rintro (h | h)
  · cases h
  · cases h

theorem lexLe_cons_cons (a b : ℕ) (l₁ l₂ : List ℕ) :
    a :: l₁ ≤ b :: l₂ ↔ a < b ∨ a = b ∧ l₁ ≤ l₂ := by
  rw [listLe_iff, listLe_iff, List.cons_lex_cons_iff, List.cons.injEq]
  constructor
  · rintro ((h | ⟨h, h'⟩) | ⟨h, h'⟩)
    · exact Or.inl h
    · exact Or.inr ⟨h, Or.inl h'⟩
    · exact Or.inr ⟨h, Or.inr h'⟩
  · rintro (h | ⟨h, h' | h'⟩)
    · exact Or.inl (Or.inl h)
    · exact Or.inl (Or.inr ⟨h, h'⟩)
    · exact Or.inr ⟨h, h'⟩

/-- The clause order in `canonicalWord` is `List.insertionSort (· ≤ ·)` for this `≤`. -/
theorem formulaWordNumbers_eq_sort (G : BitFormula) :
    formulaWordNumbers G = ((G.map clauseWordNumbers).dedup).insertionSort (· ≤ ·) := rfl

/-! ### The functions -/

/-- Remove equal heads from both lists; otherwise leave the pair as it is. -/
def stripStep (p : List ℕ × List ℕ) : List ℕ × List ℕ :=
  if (!p.1.isEmpty && !p.2.isEmpty) && decide (p.1.headD 0 = p.2.headD 0) then
    (p.1.tail, p.2.tail)
  else p

/-- Run `stripStep` once per element of the first list. -/
def strip (p : List ℕ × List ℕ) : List ℕ × List ℕ := p.1.foldl (fun q _ => stripStep q) p

/-- The decision on a stripped pair. -/
def decideStripped (q : List ℕ × List ℕ) : Bool :=
  if q.1.isEmpty then true
  else if q.2.isEmpty then false
  else decide (q.1.headD 0 < q.2.headD 0)

/-! ### Correctness -/

theorem foldl_const_iterate {α β : Type} (f : β → β) (l : List α) (q : β) :
    l.foldl (fun q _ => f q) q = f^[l.length] q := by
  induction l generalizing q with
  | nil => rfl
  | cons a l ih => simp [ih, Function.iterate_succ_apply]

theorem decideStripped_iterate (as bs : List ℕ) (k : ℕ) (hk : as.length ≤ k) :
    decideStripped (stripStep^[k] (as, bs)) = decide (as ≤ bs) := by
  induction as generalizing bs k with
  | nil =>
    have hfix : stripStep ([], bs) = ([], bs) := by simp [stripStep]
    rw [Function.iterate_fixed hfix]
    simp [decideStripped, lexLe_nil_left]
  | cons a as ih =>
    cases bs with
    | nil =>
      have hfix : stripStep (a :: as, []) = (a :: as, []) := by simp [stripStep]
      rw [Function.iterate_fixed hfix]
      simp [decideStripped, lexLe_cons_nil]
    | cons b bs =>
      obtain ⟨k, rfl⟩ : ∃ k', k = k' + 1 := ⟨k - 1, by simp at hk; omega⟩
      by_cases hab : a = b
      · subst hab
        have hstep : stripStep (a :: as, a :: bs) = (as, bs) := by simp [stripStep]
        rw [Function.iterate_succ_apply, hstep, ih bs k (by simp at hk; omega)]
        simp [lexLe_cons_cons]
      · have hfix : stripStep (a :: as, b :: bs) = (a :: as, b :: bs) := by
          simp [stripStep, hab]
        rw [Function.iterate_fixed hfix]
        simp [decideStripped, lexLe_cons_cons, hab]

/-- **Correctness of the two-stage comparison.** -/
theorem decideStripped_strip (x : List ℕ × List ℕ) :
    decideStripped (strip x) = decide (x.1 ≤ x.2) := by
  unfold strip
  rw [foldl_const_iterate]
  exact decideStripped_iterate x.1 x.2 _ le_rfl

/-! ### Size -/

theorem tail_size_le {α : Type} [TreeCodec α] (l : List α) :
    (treeEncode l.tail).size ≤ (treeEncode l).size := by
  cases l <;> simp [DataTree.size]

theorem stripStep_size (p : List ℕ × List ℕ) :
    (treeEncode (stripStep p)).size ≤ (treeEncode p).size := by
  unfold stripStep
  split
  · simp only [treeEncode_prod, DataTree.size]
    have h1 := tail_size_le p.1
    have h2 := tail_size_le p.2
    omega
  · exact le_rfl

/-! ### The programs -/

noncomputable def stripStepProgram :
    PolyProgram (List ℕ × List ℕ) (List ℕ × List ℕ) stripStep := by
  let fstP := PolyProgram.fst (List ℕ) (List ℕ)
  let sndP := PolyProgram.snd (List ℕ) (List ℕ)
  let ne1 := (fstP.comp (PolyProgram.null ℕ)).comp PolyProgram.not
  let ne2 := (sndP.comp (PolyProgram.null ℕ)).comp PolyProgram.not
  let eqH := ((fstP.comp (PolyProgram.head ℕ 0)).pair (sndP.comp (PolyProgram.head ℕ 0))).comp
    (PolyProgram.equal ℕ)
  let test := (((ne1.pair ne2).comp PolyProgram.and).pair eqH).comp PolyProgram.and
  let tails := (fstP.comp (PolyProgram.tail ℕ)).pair (sndP.comp (PolyProgram.tail ℕ))
  refine (test.ite tails (PolyProgram.id _)).congr ?_
  intro p
  rfl

noncomputable def stripProgram : PolyProgram (List ℕ × List ℕ) (List ℕ × List ℕ) strip := by
  let P : PolyProgram (ℕ × (List ℕ × List ℕ)) (List ℕ × List ℕ) (fun x => stripStep x.2) :=
    (PolyProgram.snd ℕ (List ℕ × List ℕ)).comp stripStepProgram
  let F := P.foldlGrowing 1 0 (by
    intro a b
    have := stripStep_size b
    simp only [pow_zero, mul_one]
    omega)
  refine (((PolyProgram.fst (List ℕ) (List ℕ)).pair (PolyProgram.id _)).comp F).congr ?_
  intro p
  rfl

noncomputable def decideProgram : PolyProgram (List ℕ × List ℕ) Bool decideStripped := by
  let fstP := PolyProgram.fst (List ℕ) (List ℕ)
  let sndP := PolyProgram.snd (List ℕ) (List ℕ)
  -- `a < b` as `a + 1 ≤ b`, the construction of `PolyProgram.natLt`
  let lt : PolyProgram (List ℕ × List ℕ) Bool (fun q => decide (q.1.headD 0 < q.2.headD 0)) :=
    ((((fstP.comp (PolyProgram.head ℕ 0)).comp PolyProgram.natSucc).pair
      (sndP.comp (PolyProgram.head ℕ 0))).comp PolyProgram.natLe).congr (by intro q; rfl)
  let inner := (sndP.comp (PolyProgram.null ℕ)).ite (PolyProgram.const false) lt
  refine ((fstP.comp (PolyProgram.null ℕ)).ite (PolyProgram.const true) inner).congr ?_
  intro q
  rfl

/-- **Lexicographic comparison program** on `List ℕ`, for the order used by `canonicalWord`. -/
noncomputable def lexLeProgram : PolyProgram (List ℕ × List ℕ) Bool (fun x => decide (x.1 ≤ x.2)) :=
  (stripProgram.comp decideProgram).congr (fun x => decideStripped_strip x)

/-- The run and cost statements carried by `lexLeProgram`, spelled out. -/
theorem lexLeProgram_spec (x : List ℕ × List ℕ) :
    BEval lexLeProgram.program.code (treeEncode x) (lexLeProgram.program.time x)
        (treeEncode (decide (x.1 ≤ x.2))) ∧
      lexLeProgram.program.time x ≤
        lexLeProgram.coefficient *
          ((treeEncode x.1).size + (treeEncode x.2).size + 2) ^ lexLeProgram.degree := by
  refine ⟨lexLeProgram.program.run x, ?_⟩
  have h := lexLeProgram.bound x
  simp only [treeEncode_prod, DataTree.size] at h
  convert h using 3
  omega

/-- **Clause-list sorting program**: `List.insertionSort (· ≤ ·)` on `List (List ℕ)`, the clause
sort of `canonicalWord`, built from `sortByProgram` and `lexLeProgram`. -/
noncomputable def clauseListSortProgram :
    PolyProgram (List (List ℕ)) (List (List ℕ)) (fun l => l.insertionSort (· ≤ ·)) :=
  (sortByProgram (le := fun a b => decide (a ≤ b)) lexLeProgram).congr
    (fun l => sortBy_eq_insertionSort l)

/-- The clause sort of `canonicalWord` is the function `clauseListSortProgram` computes. -/
theorem formulaWordNumbers_eq_clauseListSort (G : BitFormula) :
    formulaWordNumbers G =
      (fun l : List (List ℕ) => l.insertionSort (· ≤ ·)) ((G.map clauseWordNumbers).dedup) :=
  formulaWordNumbers_eq_sort G

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.listLe_iff
#print axioms OAI.Bridges.ETH.lexLe_nil_left
#print axioms OAI.Bridges.ETH.lexLe_cons_nil
#print axioms OAI.Bridges.ETH.lexLe_cons_cons
#print axioms OAI.Bridges.ETH.formulaWordNumbers_eq_sort
#print axioms OAI.Bridges.ETH.foldl_const_iterate
#print axioms OAI.Bridges.ETH.decideStripped_iterate
#print axioms OAI.Bridges.ETH.decideStripped_strip
#print axioms OAI.Bridges.ETH.tail_size_le
#print axioms OAI.Bridges.ETH.stripStep_size
#print axioms OAI.Bridges.ETH.stripStepProgram
#print axioms OAI.Bridges.ETH.stripProgram
#print axioms OAI.Bridges.ETH.decideProgram
#print axioms OAI.Bridges.ETH.lexLeProgram
#print axioms OAI.Bridges.ETH.lexLeProgram_spec
#print axioms OAI.Bridges.ETH.clauseListSortProgram
#print axioms OAI.Bridges.ETH.formulaWordNumbers_eq_clauseListSort
