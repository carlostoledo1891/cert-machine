import OAI.Bridges.ETH.DecodeProgram
import OAI.Bridges.ETH.LexProgram
import OAI.Bridges.ETH.SerializeProgram

/-!
# ETH correspondence, component B2, milestone B2.5a: the assembled converter

`canonicalWordProgram : TreeProgram BitFormula (List Bool) canonicalWord` is one executable
program, assembled from the verified pieces of B2.1–B2.4, that computes OpenAI's canonical CNF
word from the bit-level formula.

**Stages.**

1. *Literal decoding* (`TreeProgram`, because decoding can expand exponentially, B2.0):
   `litPairProgram` decodes each literal's name once with `decodeProgram` and returns
   `litPair l = (literalNumber l, decodeName l.1 + 1)`. The literal code and the variable-count
   contribution share that single decoding. `mapProgram` (a time-explicit `TreeProgram` map,
   from `TreeProgram.foldl`) lifts it to clauses and formulas: `formulaPairsProgram`.
2. *Post-processing* (`postProgram`, a `PolyProgram` on the decoded unary data):
   * variable count: `listMax` of the second components (`natLe`/`ite` max, `foldlGrowing`);
   * clause normalization: ParityLifts' `dedup`, then `natSortProgram`;
   * formula normalization: `dedup` on clause lists, then `clauseListSortProgram`;
   * serialization: `wordProgram`.
3. `canonicalWordProgram` = stage 1, then stage 2.

**Deduplication order.** ParityLifts' `dedupList` keeps a different element order from
`List.dedup`. `insertionSort_dedupList` proves the sorted results agree, through duplicate-freedom,
equal element sets, and uniqueness of sorted lists; no definitional equality is assumed.

**Correctness.** `canonicalWordProgram_run` and `canonicalWordProgram_encodeCNF` hold for every
`BitFormula`; `canonicalWordProgram_rbeval` is the `RBEval` form.

**Time.** Every stage keeps an explicit time function. `canonicalWordProgram_time` splits the
total exactly as `formulaPairsProgram.time G + postProgram.program.time (pairs) + 1`;
`postProgram_time_le` bounds the second term by a polynomial in the tree size of the decoded
pairs; `mapProgram_time` exposes the map's `foldWork`, for `TreeProgram.foldWork_prefix`.
No bound in `N` is claimed here (milestone B2.5b).
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ## B2.5a.1 — Time-explicit map and literal decoding -/

section MapProgram

variable {α β : Type} [TreeCodec α] [TreeCodec β]

/-- `(a, acc) ↦ f a :: acc`. -/
def consStep {f : α → β} (P : TreeProgram α β f) :
    TreeProgram (α × List β) (List β) (fun x => f x.1 :: x.2) :=
  (((TreeProgram.fst α (List β)).comp P).pair (TreeProgram.snd α (List β))).comp
    (PolyProgram.cons β).program

/-- The map loop: reverse the list, then fold `consStep` from `[]`. -/
def mapCore {f : α → β} (P : TreeProgram α β f) :
    TreeProgram (List α)
      (List β)
      ((fun x : List α × List β => x.1.foldl (fun c a => f a :: c) x.2) ∘
        (fun l => (l.reverse, ([] : List β)))) :=
  ((PolyProgram.reverse α).program.pair (TreeProgram.const ([] : List β))).comp
    (consStep P).foldl

omit [TreeCodec α] [TreeCodec β] in
theorem map_eq_reverse_foldl (f : α → β) (l : List α) :
    l.map f = l.reverse.foldl (fun c a => f a :: c) [] := by
  rw [List.foldl_reverse]
  induction l with
  | nil => rfl
  | cons a l ih => simp only [List.map_cons, List.foldr_cons, ih]

/-- **Time-explicit map** of a `TreeProgram` over a list. -/
def mapProgram {f : α → β} (P : TreeProgram α β f) : TreeProgram (List α) (List β) (List.map f) where
  code := (mapCore P).code
  time := (mapCore P).time
  run := fun l => by
    rw [map_eq_reverse_foldl]
    exact (mapCore P).run l

/-- The map's time, unfolded: reversal, the empty accumulator, and the `consStep` loop. -/
theorem mapProgram_time {f : α → β} (P : TreeProgram α β f) (l : List α) :
    (mapProgram P).time l =
      ((PolyProgram.reverse α).program.time l + (TreeProgram.const ([] : List β)).time l + 1) +
        ((consStep P).foldWork l.reverse [] +
          (treeEncode (([] : List α), l.reverse.foldl (fun c a => f a :: c) [])).size + 1) + 1 :=
  rfl

end MapProgram

/-- A literal's code and its variable-count contribution, from one decoding. -/
def litPair (l : BitLiteral) : ℕ × ℕ := (literalNumber l, decodeName l.1 + 1)

/-- `(v, b) ↦ (2v + bit b, v + 1)` on unary data. -/
def litArithProgram :
    PolyProgram (ℕ × Bool) (ℕ × ℕ) (fun x => (2 * x.1 + if x.2 then 1 else 0, x.1 + 1)) := by
  let twice := ((PolyProgram.fst ℕ Bool).pair (PolyProgram.fst ℕ Bool)).comp PolyProgram.natAdd
  let code := (PolyProgram.snd ℕ Bool).ite (twice.comp PolyProgram.natSucc) twice
  let succ := (PolyProgram.fst ℕ Bool).comp PolyProgram.natSucc
  refine (code.pair succ).congr ?_
  rintro ⟨v, b⟩
  cases b <;> (simp only [Prod.mk.injEq]; constructor <;> (simp; try omega))

/-- Decode the name, keep the polarity. -/
def decodeLitCore : TreeProgram BitLiteral (ℕ × Bool)
    (fun x => ((decodeName ∘ Prod.fst) x, Prod.snd x)) :=
  ((TreeProgram.fst (List Bool) Bool).comp decodeProgram).pair (TreeProgram.snd (List Bool) Bool)

/-- **Literal decoding.** One decoding per literal. -/
def litPairProgram : TreeProgram BitLiteral (ℕ × ℕ) litPair where
  code := (decodeLitCore.comp litArithProgram.program).code
  time := (decodeLitCore.comp litArithProgram.program).time
  run := fun l => (decodeLitCore.comp litArithProgram.program).run l

theorem litPairProgram_run (l : BitLiteral) :
    BEval litPairProgram.code (treeEncode l) (litPairProgram.time l)
      (treeEncode (literalNumber l, decodeName l.1 + 1)) :=
  litPairProgram.run l

/-- Decoding of a clause and of a formula. -/
def clausePairsProgram : TreeProgram BitClause (List (ℕ × ℕ)) (List.map litPair) :=
  mapProgram litPairProgram

def formulaPairsProgram :
    TreeProgram BitFormula (List (List (ℕ × ℕ))) (List.map (List.map litPair)) :=
  mapProgram clausePairsProgram

/-! ## B2.5a.2 — Variable count and normalization -/

/-- Left-fold maximum, as computed by the program. -/
def listMax (l : List ℕ) : ℕ := l.foldl (fun b a => max a b) 0

theorem foldl_max_eq (l : List ℕ) (a : ℕ) :
    l.foldl (fun b x => max x b) a = max a (l.foldr max 0) := by
  induction l generalizing a with
  | nil => simp
  | cons x l ih =>
    rw [List.foldl_cons, ih, List.foldr_cons]
    omega

theorem listMax_eq_foldr (l : List ℕ) : listMax l = l.foldr max 0 := by
  rw [listMax, foldl_max_eq]
  simp

def maxStepProgram : PolyProgram (ℕ × ℕ) ℕ (fun x => max x.1 x.2) :=
  (PolyProgram.natLe.ite (PolyProgram.snd ℕ ℕ) (PolyProgram.fst ℕ ℕ)).congr
    (by intro x; simp only [decide_eq_true_eq, max_def])

def listMaxProgram : PolyProgram (List ℕ) ℕ listMax := by
  let F := maxStepProgram.foldlGrowing 1 1 (by
    intro a b
    simp only [treeEncode_nat, numTree_size, pow_one, one_mul]
    omega)
  refine (((PolyProgram.id (List ℕ)).pair (PolyProgram.const (0 : ℕ))).comp F).congr ?_
  intro l
  rfl

theorem dedupList_nodup {γ : Type} [DecidableEq γ] (xs : List γ) : (dedupList xs).Nodup := by
  unfold dedupList
  suffices ∀ acc : List γ, acc.Nodup →
      (xs.foldl (fun s a => if a ∈ s then s else a :: s) acc).Nodup from this [] List.nodup_nil
  induction xs with
  | nil => intro acc h; exact h
  | cons a xs ih =>
    intro acc h
    rw [List.foldl_cons]
    apply ih
    split
    · exact h
    · exact List.nodup_cons.mpr ⟨by assumption, h⟩

/-- **Deduplication order does not matter after sorting.** ParityLifts' `dedupList` and Lean's
`List.dedup` give the same sorted list. -/
theorem insertionSort_dedupList {γ : Type} [LinearOrder γ] [DecidableEq γ] (l : List γ) :
    (dedupList l).insertionSort (· ≤ ·) = l.dedup.insertionSort (· ≤ ·) := by
  have hperm : List.Perm (dedupList l) l.dedup :=
    List.perm_of_nodup_nodup_toFinset_eq (dedupList_nodup l) (List.nodup_dedup l) (by simp)
  apply List.Perm.eq_of_pairwise' (r := (· ≤ ·))
  · exact List.sortedLE_insertionSort.pairwise
  · exact List.sortedLE_insertionSort.pairwise
  · exact (List.perm_insertionSort _ _).trans (hperm.trans (List.perm_insertionSort _ _).symm)

/-- Clause normalization: deduplicate, then sort. -/
noncomputable def clauseNormProgram :
    PolyProgram (List ℕ) (List ℕ) (fun C => (dedupList C).insertionSort (· ≤ ·)) :=
  ((PolyProgram.dedup ℕ).comp natSortProgram).congr (by intro C; rfl)

/-- Formula normalization: normalize each clause, deduplicate the clause lists, then sort. -/
noncomputable def formulaNormProgram :
    PolyProgram (List (List ℕ)) (List (List ℕ))
      (fun L => (dedupList (L.map fun C => (dedupList C).insertionSort (· ≤ ·))).insertionSort
        (· ≤ ·)) :=
  ((clauseNormProgram.map.comp (PolyProgram.dedup (List ℕ))).comp clauseListSortProgram).congr
    (by intro L; rfl)

/-! ## B2.5a.3 — Serialization and the assembled program -/

/-- The post-processing function on decoded pairs. -/
noncomputable def postFun (P : List (List (ℕ × ℕ))) : List Bool :=
  Encoding.encodeNat (listMax (P.map (List.map Prod.snd)).flatten) ++
    Encoding.encodeList (Encoding.encodeList Encoding.encodeNat)
      ((dedupList ((P.map (List.map Prod.fst)).map fun C =>
        (dedupList C).insertionSort (· ≤ ·))).insertionSort (· ≤ ·))

noncomputable def postProgram : PolyProgram (List (List (ℕ × ℕ))) (List Bool) postFun := by
  let boundP := ((PolyProgram.snd ℕ ℕ).map.map.comp (PolyProgram.flatten ℕ)).comp listMaxProgram
  let normP := (PolyProgram.fst ℕ ℕ).map.map.comp formulaNormProgram
  refine ((boundP.pair normP).comp wordProgram).congr ?_
  intro P
  rfl

theorem listMax_pairs (G : BitFormula) :
    listMax ((G.map (List.map litPair)).map (List.map Prod.snd)).flatten = bitVarBound G := by
  rw [listMax_eq_foldr, bitVarBound, List.flatMap_def]
  simp [List.map_map, Function.comp_def, litPair]

theorem norm_pairs (G : BitFormula) :
    (dedupList (((G.map (List.map litPair)).map (List.map Prod.fst)).map fun C =>
        (dedupList C).insertionSort (· ≤ ·))).insertionSort (· ≤ ·) = formulaWordNumbers G := by
  have hcl : ((G.map (List.map litPair)).map (List.map Prod.fst)).map
      (fun C => (dedupList C).insertionSort (· ≤ ·)) = G.map clauseWordNumbers := by
    simp only [List.map_map, Function.comp_def]
    congr 1
    funext C
    rw [insertionSort_dedupList]
    simp [clauseWordNumbers, litPair]
  rw [hcl, insertionSort_dedupList]
  rfl

/-- The post-processing of the decoded pairs is `canonicalWord`. -/
theorem postFun_pairs (G : BitFormula) :
    postFun (G.map (List.map litPair)) = canonicalWord G := by
  rw [postFun, listMax_pairs, norm_pairs]
  rfl

noncomputable def canonicalWordCore :
    TreeProgram BitFormula (List Bool) (postFun ∘ List.map (List.map litPair)) :=
  formulaPairsProgram.comp postProgram.program

/-- **The assembled converter.** One executable `TreeProgram` computing `canonicalWord`. -/
noncomputable def canonicalWordProgram : TreeProgram BitFormula (List Bool) canonicalWord where
  code := canonicalWordCore.code
  time := canonicalWordCore.time
  run := fun G => by
    rw [← postFun_pairs]
    exact canonicalWordCore.run G

/-- **Executable correctness**, for every `BitFormula`. -/
theorem canonicalWordProgram_run (G : BitFormula) :
    BEval canonicalWordProgram.code (treeEncode G) (canonicalWordProgram.time G)
      (treeEncode (canonicalWord G)) :=
  canonicalWordProgram.run G

/-- **Connection to OpenAI's encoding.** -/
theorem canonicalWordProgram_encodeCNF (G : BitFormula) :
    BEval canonicalWordProgram.code (treeEncode G) (canonicalWordProgram.time G)
      (treeEncode (Encoding.encodeCNF (canonicalCNF (decodeFormula G)))) := by
  rw [← canonicalWord_eq]
  exact canonicalWordProgram_run G

/-- The `RBEval` form, for composition with `RBEval.seq` and `sat_code_rate`. -/
theorem canonicalWordProgram_rbeval (G : BitFormula) :
    RBEval canonicalWordProgram.code (treeEncode G) (canonicalWordProgram.time G : ℝ)
      (treeEncode (Encoding.encodeCNF (canonicalCNF (decodeFormula G)))) :=
  (canonicalWordProgram_encodeCNF G).real

/-! ## Time structure, for B2.5b -/

/-- The total time, split exactly into decoding and post-processing. -/
theorem canonicalWordProgram_time (G : BitFormula) :
    canonicalWordProgram.time G =
      formulaPairsProgram.time G + postProgram.program.time (G.map (List.map litPair)) + 1 :=
  rfl

/-- Post-processing is polynomial in the tree size of the decoded pairs. -/
theorem postProgram_time_le (P : List (List (ℕ × ℕ))) :
    postProgram.program.time P ≤
      postProgram.coefficient * ((treeEncode P).size + 1) ^ postProgram.degree :=
  postProgram.bound P

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.consStep
#print axioms OAI.Bridges.ETH.mapCore
#print axioms OAI.Bridges.ETH.map_eq_reverse_foldl
#print axioms OAI.Bridges.ETH.mapProgram
#print axioms OAI.Bridges.ETH.mapProgram_time
#print axioms OAI.Bridges.ETH.litArithProgram
#print axioms OAI.Bridges.ETH.decodeLitCore
#print axioms OAI.Bridges.ETH.litPairProgram
#print axioms OAI.Bridges.ETH.litPairProgram_run
#print axioms OAI.Bridges.ETH.clausePairsProgram
#print axioms OAI.Bridges.ETH.formulaPairsProgram
#print axioms OAI.Bridges.ETH.foldl_max_eq
#print axioms OAI.Bridges.ETH.listMax_eq_foldr
#print axioms OAI.Bridges.ETH.maxStepProgram
#print axioms OAI.Bridges.ETH.listMaxProgram
#print axioms OAI.Bridges.ETH.dedupList_nodup
#print axioms OAI.Bridges.ETH.insertionSort_dedupList
#print axioms OAI.Bridges.ETH.clauseNormProgram
#print axioms OAI.Bridges.ETH.formulaNormProgram
#print axioms OAI.Bridges.ETH.postProgram
#print axioms OAI.Bridges.ETH.listMax_pairs
#print axioms OAI.Bridges.ETH.norm_pairs
#print axioms OAI.Bridges.ETH.postFun_pairs
#print axioms OAI.Bridges.ETH.canonicalWordCore
#print axioms OAI.Bridges.ETH.canonicalWordProgram
#print axioms OAI.Bridges.ETH.canonicalWordProgram_run
#print axioms OAI.Bridges.ETH.canonicalWordProgram_encodeCNF
#print axioms OAI.Bridges.ETH.canonicalWordProgram_rbeval
#print axioms OAI.Bridges.ETH.canonicalWordProgram_time
#print axioms OAI.Bridges.ETH.postProgram_time_le
