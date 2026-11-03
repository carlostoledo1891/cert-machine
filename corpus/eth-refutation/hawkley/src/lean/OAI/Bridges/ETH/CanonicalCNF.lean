import OAI.Algorithms.SubexponentialSAT.SAT
import OAI.Combinatorics.ParityLifts.BitNormalize

/-!
# ETH correspondence, component B, milestone B1a: the semantic bridge

Component B connects two input conventions:

* `ParityWL.Complexity.Formula N`, a list of clauses with at most three literals each, read by
  the conventional ETH predicate through `encodeFormula`. The existing front end
  `normalizeProgram` turns that input into `minimizeList F.bitList : BitFormula`, where each
  variable index is written as its `Nat.bits` list.
* `SubexponentialSAT.SAT.CNF (Fin n)`, a finset of finsets of literals, read by the verified
  algorithm through `Encoding.encodeCNF`.

This module defines the pure conversion from the minimized bit-level formula to a canonical
`SAT.CNF`, and proves its semantics:

* `canonicalCNF_width` and `bitCanonical_width`: every clause has at most three literals;
* `varBound_le` and `bitCanonical_varBound_le`: the variable count is at most `N`;
* `canonicalCNF_satisfiable` and `bitCanonical_satisfiable`: satisfiability is preserved.

The variable count of the canonical formula is `varBound`, one more than the largest variable
index that occurs. The minimized input has lost `N`, so a converter that reads only that input
has to compute the count from the clauses.

Still open in component B, with their interfaces:

* **B1b (encoding equality).** A pure list function `canonicalWord : BitFormula → List Bool`,
  built from sorting and duplicate removal on explicit lists, with
  `canonicalWord G = Encoding.encodeCNF (canonicalCNF (decodeFormula G))`.
  Bit-level equality is required; semantic equivalence is not enough.
* **B2 (executable cost).** A `PolyProgram BitFormula (List Bool) canonicalWord`, or an `FCode`
  with an `RBEval` bound, on inputs `minimizeList F.bitList`, with cost polynomial in `N`.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### Decoding variable names -/

/-- Read a least-significant-bit-first name, as written by `Nat.bits`. -/
def decodeName (bs : List Bool) : ℕ := Nat.ofDigits 2 (bs.map fun b => cond b 1 0)

@[simp] theorem decodeName_bits (n : ℕ) : decodeName n.bits = n := by
  rw [decodeName, ← Nat.digits_two_eq_bits, Nat.ofDigits_digits]

/-- A bit-level literal as a pair of a natural-number variable and a polarity. -/
def decodeLiteral (l : BitLiteral) : ℕ × Bool := (decodeName l.1, l.2)

def decodeFormula (G : BitFormula) : ClauseList (ℕ × Bool) := List.map (List.map decodeLiteral) G

/-! ### The canonical CNF of a list formula over natural-number variables -/

/-- One more than the largest variable index that occurs; `0` for a formula without literals. -/
def varBound (G : ClauseList (ℕ × Bool)) : ℕ :=
  (G.flatMap (List.map fun l => l.1 + 1)).foldr max 0

theorem le_foldr_max {xs : List ℕ} {a : ℕ} (h : a ∈ xs) : a ≤ xs.foldr max 0 := by
  induction xs with
  | nil => simp at h
  | cons x xs ih =>
    rcases List.mem_cons.mp h with rfl | h
    · exact le_max_left _ _
    · exact (ih h).trans (le_max_right _ _)

theorem foldr_max_le {xs : List ℕ} {N : ℕ} (h : ∀ a ∈ xs, a ≤ N) : xs.foldr max 0 ≤ N := by
  induction xs with
  | nil => simp
  | cons x xs ih =>
    exact max_le (h x List.mem_cons_self) (ih fun a ha => h a (List.mem_cons_of_mem x ha))

theorem lt_varBound {G : ClauseList (ℕ × Bool)} {C : List (ℕ × Bool)} (hC : C ∈ G)
    {l : ℕ × Bool} (hl : l ∈ C) : l.1 < varBound G := by
  have h : l.1 + 1 ∈ G.flatMap (List.map fun l => l.1 + 1) :=
    List.mem_flatMap.mpr ⟨C, hC, List.mem_map.mpr ⟨l, hl, rfl⟩⟩
  exact le_foldr_max h

theorem varBound_le {G : ClauseList (ℕ × Bool)} {N : ℕ}
    (h : ∀ C ∈ G, ∀ l ∈ C, l.1 < N) : varBound G ≤ N := by
  apply foldr_max_le
  intro a ha
  obtain ⟨C, hC, ha⟩ := List.mem_flatMap.mp ha
  obtain ⟨l, hl, rfl⟩ := List.mem_map.mp ha
  exact h C hC l hl

/-- The literal on `Fin n` for an in-range natural-number literal. -/
def toLiteral (n : ℕ) (l : ℕ × Bool) : Option (SAT.Literal (Fin n)) :=
  if h : l.1 < n then some ⟨⟨l.1, h⟩, l.2⟩ else none

def toClause (n : ℕ) (C : List (ℕ × Bool)) : SAT.Clause (Fin n) :=
  (C.filterMap (toLiteral n)).toFinset

/-- The canonical CNF on `varBound G` variables: each clause becomes the set of its literals,
and the formula becomes the set of its clauses. -/
def canonicalCNF (G : ClauseList (ℕ × Bool)) : SAT.CNF (Fin (varBound G)) :=
  (List.map (toClause (varBound G)) G).toFinset

theorem mem_toClause {n : ℕ} {C : List (ℕ × Bool)} {l' : SAT.Literal (Fin n)} :
    l' ∈ toClause n C ↔ ∃ l ∈ C, toLiteral n l = some l' := by
  simp [toClause]

theorem toLiteral_eq_some {n : ℕ} {l : ℕ × Bool} {l' : SAT.Literal (Fin n)}
    (h : toLiteral n l = some l') : l'.variable.val = l.1 ∧ l'.positive = l.2 := by
  unfold toLiteral at h
  split_ifs at h with hl
  cases h
  exact ⟨rfl, rfl⟩

/-- Satisfiability of a list formula over natural-number variables. -/
def ListSatisfiable (G : ClauseList (ℕ × Bool)) : Prop :=
  ∃ a : ℕ → Bool, ∀ C ∈ G, ∃ l ∈ C, a l.1 = l.2

/-- **Width preservation**, list level. -/
theorem canonicalCNF_width {G : ClauseList (ℕ × Bool)} (h : ∀ C ∈ G, C.length ≤ 3) :
    SAT.WidthAtMost 3 (canonicalCNF G) := by
  intro D hD
  obtain ⟨C, hC, rfl⟩ := List.mem_map.mp (List.mem_toFinset.mp hD)
  exact (List.toFinset_card_le _).trans ((List.length_filterMap_le _ _).trans (h C hC))

/-- **Semantic preservation**, list level. -/
theorem canonicalCNF_satisfiable (G : ClauseList (ℕ × Bool)) :
    SAT.Satisfiable (canonicalCNF G) ↔ ListSatisfiable G := by
  simp only [SAT.Satisfiable, SAT.CNF.eval_eq_true, SAT.Clause.eval_eq_true,
    SAT.Literal.eval_eq_true, ListSatisfiable]
  constructor
  · rintro ⟨a, ha⟩
    refine ⟨fun v => if hv : v < varBound G then a ⟨v, hv⟩ else false, ?_⟩
    intro C hC
    have hD : toClause (varBound G) C ∈ canonicalCNF G :=
      List.mem_toFinset.mpr (List.mem_map.mpr ⟨C, hC, rfl⟩)
    obtain ⟨l', hl', hal⟩ := ha _ hD
    obtain ⟨l, hl, hsome⟩ := mem_toClause.mp hl'
    obtain ⟨hv, hp⟩ := toLiteral_eq_some hsome
    refine ⟨l, hl, ?_⟩
    have hlt : l.1 < varBound G := hv ▸ l'.variable.isLt
    simp only [hlt, dite_true]
    rw [← hp, ← hal]
    congr 1
    exact Fin.ext hv.symm
  · rintro ⟨a, ha⟩
    refine ⟨fun i => a i.val, ?_⟩
    intro D hD
    obtain ⟨C, hC, rfl⟩ := List.mem_map.mp (List.mem_toFinset.mp hD)
    obtain ⟨l, hl, hal⟩ := ha C hC
    have hlt := lt_varBound hC hl
    refine ⟨⟨⟨l.1, hlt⟩, l.2⟩, mem_toClause.mpr ⟨l, hl, by simp [toLiteral, hlt]⟩, ?_⟩
    exact hal

/-! ### The bridge from a conventional formula -/

/-- The canonical list formula reached from `F` through the existing front end
`minimizeList F.bitList`. -/
noncomputable def bitCanonical {N : ℕ} (F : Formula N) : ClauseList (ℕ × Bool) :=
  decodeFormula (minimizeList F.bitList)

theorem mem_minimizeList {α : Type} [DecidableEq α] {X : ClauseList α} {C : List α}
    (h : C ∈ minimizeList X) : C ∈ X :=
  dedupBy_subset List.toFinset X (List.mem_filter.mp h).1

theorem mem_bitList {N : ℕ} {F : Formula N} {C : BitClause} (h : C ∈ F.bitList) :
    ∃ D ∈ F, C = D.literals.map literalBits := by
  simp only [Formula.bitList, Formula.literalLists, List.map_map, List.mem_map,
    Function.comp] at h
  obtain ⟨D, hD, rfl⟩ := h
  exact ⟨D, hD, rfl⟩

@[simp] theorem decodeLiteral_literalBits {N : ℕ} (l : Literal N) :
    decodeLiteral (literalBits l) = (l.1.val, l.2) := by
  simp [decodeLiteral, literalBits]

/-- Every clause of `bitCanonical F` comes, up to decoding, from a clause of `F`. -/
theorem mem_bitCanonical {N : ℕ} {F : Formula N} {C : List (ℕ × Bool)}
    (h : C ∈ bitCanonical F) :
    ∃ D ∈ F, C = D.literals.map fun l => (l.1.val, l.2) := by
  obtain ⟨B, hB, rfl⟩ := List.mem_map.mp h
  obtain ⟨D, hD, rfl⟩ := mem_bitList (mem_minimizeList hB)
  exact ⟨D, hD, by simp [List.map_map, Function.comp_def]⟩

/-- **Variable-count bound.** -/
theorem bitCanonical_varBound_le {N : ℕ} (F : Formula N) : varBound (bitCanonical F) ≤ N := by
  apply varBound_le
  intro C hC l hl
  obtain ⟨D, _, rfl⟩ := mem_bitCanonical hC
  obtain ⟨m, _, rfl⟩ := List.mem_map.mp hl
  exact m.1.isLt

/-- **Width preservation.** -/
theorem bitCanonical_width {N : ℕ} (F : Formula N) :
    SAT.WidthAtMost 3 (canonicalCNF (bitCanonical F)) := by
  apply canonicalCNF_width
  intro C hC
  obtain ⟨D, _, rfl⟩ := mem_bitCanonical hC
  simpa using D.width

theorem listSatisfiable_bitCanonical {N : ℕ} (F : Formula N) :
    ListSatisfiable (bitCanonical F) ↔ F.Satisfiable := by
  -- For a fixed assignment, minimization preserves truth of the bit-level formula.
  have key : ∀ a : ℕ → Bool,
      (∀ C ∈ bitCanonical F, ∃ l ∈ C, a l.1 = l.2) ↔
        ∀ D ∈ F, ∃ l ∈ D.literals, a l.1.val = l.2 := by
    intro a
    let v : BitLiteral → Prop := fun l => a (decodeName l.1) = l.2
    have hm : (∀ C ∈ minimizeList F.bitList, ∃ l ∈ C, v l) ↔
        ∀ C ∈ F.bitList, ∃ l ∈ C, v l := by
      rw [← listCNF_holds, ← listCNF_holds, listCNF_minimize, Sparsification.minimize_holds]
    have h1 : (∀ C ∈ bitCanonical F, ∃ l ∈ C, a l.1 = l.2) ↔
        ∀ C ∈ minimizeList F.bitList, ∃ l ∈ C, v l := by
      simp [bitCanonical, decodeFormula, decodeLiteral, v]
    have h2 : (∀ C ∈ F.bitList, ∃ l ∈ C, v l) ↔
        ∀ D ∈ F, ∃ l ∈ D.literals, a l.1.val = l.2 := by
      simp [Formula.bitList, Formula.literalLists, v, literalBits]
    exact h1.trans (hm.trans h2)
  constructor
  · rintro ⟨a, ha⟩
    exact ⟨fun i => a i.val, fun D hD => (key a).mp ha D hD⟩
  · rintro ⟨b, hb⟩
    let a : ℕ → Bool := fun v => if hv : v < N then b ⟨v, hv⟩ else false
    refine ⟨a, (key a).mpr ?_⟩
    intro D hD
    obtain ⟨l, hl, hbl⟩ := hb D hD
    exact ⟨l, hl, by simpa [a, l.1.isLt] using hbl⟩

/-- **Semantic preservation.** -/
theorem bitCanonical_satisfiable {N : ℕ} (F : Formula N) :
    SAT.Satisfiable (canonicalCNF (bitCanonical F)) ↔ F.Satisfiable :=
  (canonicalCNF_satisfiable _).trans (listSatisfiable_bitCanonical F)

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.decodeName_bits
#print axioms OAI.Bridges.ETH.canonicalCNF_width
#print axioms OAI.Bridges.ETH.canonicalCNF_satisfiable
#print axioms OAI.Bridges.ETH.bitCanonical_varBound_le
#print axioms OAI.Bridges.ETH.bitCanonical_width
#print axioms OAI.Bridges.ETH.bitCanonical_satisfiable
