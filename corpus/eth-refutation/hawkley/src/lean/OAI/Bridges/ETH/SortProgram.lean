import OAI.Combinatorics.ParityLifts.BitNormalize

/-!
# ETH correspondence, component B2, milestone B2.1: a sorting program

Component B2 needs an executable version of `canonicalWord` (milestone B1b) in the ParityLifts
model. The ParityLifts library already supplies verified polynomial programs for `dedup`,
`filter`, `map`, `append`, `foldl`, and unary arithmetic (`natLe`, `natAdd`, …). It supplies no
sorting program. This module adds one, generic in the comparison:

* `sortBy le l`, an insertion sort written as a fold of `insertBy`, which splits the sorted
  accumulator at the inserted element with two filters;
* `sortByProgram P : PolyProgram (List α) (List α) (sortBy le)` for any comparison program
  `P : PolyProgram (α × α) Bool (fun x => le x.1 x.2)`, built only from existing programs
  (`filterWith`, `swap`, `not`, `cons`, `append`, `foldlGrowing`);
* `sortBy_eq_insertionSort`: for a linear order, `sortBy` agrees with
  `List.insertionSort (· ≤ ·)`, the sort used by `canonicalWord`;
* `natSortProgram : PolyProgram (List ℕ) (List ℕ) (List.insertionSort (· ≤ ·))`, from the
  existing `PolyProgram.natLe`.

The same `sortByProgram` serves the clause level of `canonicalWord` once a comparison program for
the lexicographic order on `List ℕ` exists.

The cost of each `PolyProgram` is polynomial in the size of its serialized input tree, through
the `bound` field; no cost is estimated outside Lean.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity

/-! ### The functions -/

/-- Insert `a` into a list by splitting at `a`: the elements strictly before `a`, then `a`,
then the rest. On a sorted list this is ordered insertion. -/
def insertBy {α : Type} (le : α → α → Bool) (a : α) (l : List α) : List α :=
  l.filter (fun b => !le a b) ++ a :: l.filter (fun b => le a b)

/-- Insertion sort as a left fold of `insertBy`. -/
def sortBy {α : Type} (le : α → α → Bool) (l : List α) : List α :=
  l.foldl (fun acc a => insertBy le a acc) []

/-! ### Permutation and ordering -/

theorem insertBy_perm {α : Type} (le : α → α → Bool) (a : α) (l : List α) :
    List.Perm (insertBy le a l) (a :: l) := by
  unfold insertBy
  refine List.perm_middle.trans (List.Perm.cons a ?_)
  refine List.perm_append_comm.trans ?_
  simpa [Function.comp_def] using List.filter_append_perm (fun b => le a b) l

theorem foldl_insertBy_perm {α : Type} (le : α → α → Bool) (l acc : List α) :
    List.Perm (l.foldl (fun acc a => insertBy le a acc) acc) (l ++ acc) := by
  induction l generalizing acc with
  | nil => simp
  | cons a l ih =>
    rw [List.foldl_cons]
    refine (ih _).trans ?_
    refine (List.Perm.append_left l (insertBy_perm le a acc)).trans ?_
    exact List.perm_middle

theorem sortBy_perm {α : Type} (le : α → α → Bool) (l : List α) : List.Perm (sortBy le l) l := by
  simpa [sortBy] using foldl_insertBy_perm le l []

theorem pairwise_insertBy {α : Type} [LinearOrder α] (a : α) {l : List α}
    (h : l.Pairwise (· ≤ ·)) :
    (insertBy (fun a b => decide (a ≤ b)) a l).Pairwise (· ≤ ·) := by
  unfold insertBy
  rw [List.pairwise_append, List.pairwise_cons]
  refine ⟨h.filter _, ⟨?_, h.filter _⟩, ?_⟩
  · intro b hb
    simpa using (List.mem_filter.mp hb).2
  · intro x hx y hy
    have hxa : x < a := by simpa using (List.mem_filter.mp hx).2
    rcases List.mem_cons.mp hy with rfl | hy
    · exact hxa.le
    · have hay : a ≤ y := by simpa using (List.mem_filter.mp hy).2
      exact (hxa.trans_le hay).le

theorem pairwise_sortBy {α : Type} [LinearOrder α] (l : List α) :
    (sortBy (fun a b => decide (a ≤ b)) l).Pairwise (· ≤ ·) := by
  unfold sortBy
  suffices ∀ acc : List α, acc.Pairwise (· ≤ ·) →
      (l.foldl (fun acc a => insertBy (fun a b => decide (a ≤ b)) a acc) acc).Pairwise (· ≤ ·) from
    this [] List.Pairwise.nil
  induction l with
  | nil => intro acc h; simpa using h
  | cons a l ih =>
    intro acc h
    rw [List.foldl_cons]
    exact ih _ (pairwise_insertBy a h)

/-- For a linear order, `sortBy` computes `List.insertionSort (· ≤ ·)`. -/
theorem sortBy_eq_insertionSort {α : Type} [LinearOrder α] (l : List α) :
    sortBy (fun a b => decide (a ≤ b)) l = l.insertionSort (· ≤ ·) :=
  List.Perm.eq_of_pairwise' (r := (· ≤ ·)) (pairwise_sortBy l)
    List.sortedLE_insertionSort.pairwise
    ((sortBy_perm _ l).trans (List.perm_insertionSort _ l).symm)

/-! ### Encoded size -/

theorem treeEncode_size_perm {α : Type} [TreeCodec α] {l l' : List α} (h : List.Perm l l') :
    (treeEncode l).size = (treeEncode l').size := by
  rw [treeEncode_list_size, treeEncode_list_size, (h.map _).sum_eq]

theorem insertBy_size {α : Type} [TreeCodec α] (le : α → α → Bool) (a : α) (l : List α) :
    (treeEncode (insertBy le a l)).size ≤ (treeEncode l).size + 1 * ((treeEncode a).size + 1) ^ 1 := by
  rw [treeEncode_size_perm (insertBy_perm le a l)]
  simp [DataTree.size]
  omega

/-! ### The programs -/

/-- `insertBy` as a polynomial program, for any comparison program. -/
def insertByProgram {α : Type} [TreeCodec α] {le : α → α → Bool}
    (P : PolyProgram (α × α) Bool (fun x => le x.1 x.2)) :
    PolyProgram (α × List α) (List α) (fun x => insertBy le x.1 x.2) := by
  -- `swapped` turns `(a, l)` into `(l, a)`, the input shape of `filterWith`.
  let swapped := PolyProgram.swap α (List α)
  -- the test `le a b` on an (element, parameter) pair `(b, a)`
  let leP : PolyProgram (α × α) Bool (fun y => le y.2 y.1) :=
    ((PolyProgram.swap α α).comp P).congr (by intro y; rfl)
  let notLeP : PolyProgram (α × α) Bool (fun y => !le y.2 y.1) :=
    (leP.comp PolyProgram.not).congr (by intro y; rfl)
  let hi := swapped.comp leP.filterWith
  let lo := swapped.comp notLeP.filterWith
  let mid := ((PolyProgram.fst α (List α)).pair hi).comp (PolyProgram.cons α)
  refine ((lo.pair mid).comp (PolyProgram.append α)).congr ?_
  intro x
  rfl

/-- **Generic sorting program.** Insertion sort in the ParityLifts model, polynomial in the
size of the encoded input list, for any polynomial comparison program. -/
def sortByProgram {α : Type} [TreeCodec α] {le : α → α → Bool}
    (P : PolyProgram (α × α) Bool (fun x => le x.1 x.2)) :
    PolyProgram (List α) (List α) (sortBy le) := by
  let F := (insertByProgram P).foldlGrowing 1 1 (by intro a b; exact insertBy_size le a b)
  refine (((PolyProgram.id (List α)).pair (PolyProgram.const ([] : List α))).comp F).congr ?_
  intro l
  rfl

/-- **Sorting natural numbers.** `List.insertionSort (· ≤ ·)` on `List ℕ` as a polynomial
program, from the existing comparison program `PolyProgram.natLe`. -/
def natSortProgram : PolyProgram (List ℕ) (List ℕ) (fun l => l.insertionSort (· ≤ ·)) :=
  (sortByProgram (le := fun a b => decide (a ≤ b)) PolyProgram.natLe).congr
    (fun l => sortBy_eq_insertionSort l)

/-- The run and cost statements carried by `natSortProgram`, spelled out. -/
theorem natSortProgram_spec (l : List ℕ) :
    BEval natSortProgram.program.code (treeEncode l) (natSortProgram.program.time l)
        (treeEncode (l.insertionSort (· ≤ ·))) ∧
      natSortProgram.program.time l ≤
        natSortProgram.coefficient * ((treeEncode l).size + 1) ^ natSortProgram.degree :=
  ⟨natSortProgram.program.run l, natSortProgram.bound l⟩

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.insertBy_perm
#print axioms OAI.Bridges.ETH.sortBy_perm
#print axioms OAI.Bridges.ETH.pairwise_sortBy
#print axioms OAI.Bridges.ETH.sortBy_eq_insertionSort
#print axioms OAI.Bridges.ETH.insertBy_size
#print axioms OAI.Bridges.ETH.insertByProgram
#print axioms OAI.Bridges.ETH.sortByProgram
#print axioms OAI.Bridges.ETH.natSortProgram
#print axioms OAI.Bridges.ETH.natSortProgram_spec
