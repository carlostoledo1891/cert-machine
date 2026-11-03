import OAI.Bridges.ETH.ConverterSize

/-!
# ETH correspondence, component B2.5b.2: time of the nested decoding

`formulaPairsProgram` maps `clausePairsProgram` over the clauses, which maps `litPairProgram`
over the literals. This module bounds its time on `G = minimizeList F.bitList` by an explicit
function of `N`.

* `mapProgram_time_le` (generic): if the input list has tree size at most `X`, the mapped list at
  most `Y`, and each element's time is at most `B`, then the map's time is at most
  `mapTimeBound α β X Y B`, an explicit expression. The proof unfolds `mapProgram_time` and
  bounds the loop with `TreeProgram.foldWork_prefix`: every loop state `(rest, accumulator)` has
  size at most `X + Y + 1`, and every step costs at most `stepBound β X Y B`.
* `litPairProgram_time_le`: on a literal of `G`, at most `litTime N`. The decoding cost is
  `decodeProgram_time` at the measure `decodeMeasure ≤ 6N + 11`.
* `clausePairsProgram_time_le`: on a clause of `G`, at most `clauseTime N`.
* `formulaPairsProgram_time_le`: on `G`, at most `decodeTime N`.

The constants are the `coefficient` and `degree` fields of fixed programs (`decodePrep`,
`hornerStepProgram`, `litArithProgram`, `PolyProgram.reverse`, `PolyProgram.cons` at the two
element types), independent of `N` and `F`.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity

/-! ### Generic map time -/

section MapTime

variable {α β : Type} [TreeCodec α] [TreeCodec β]

theorem elem_size_le {l : List α} {a : α} (ha : a ∈ l) :
    (treeEncode a).size ≤ (treeEncode l).size := by
  have h := treeEncode_list_size_mono (List.singleton_sublist.mpr ha)
  simp only [treeEncode_cons, treeEncode_nil, DataTree.size] at h
  omega

omit [TreeCodec α] [TreeCodec β] in
theorem foldl_cons_map (f : α → β) (ys : List α) (acc : List β) :
    ys.foldl (fun c a => f a :: c) acc = (ys.map f).reverse ++ acc := by
  induction ys generalizing acc with
  | nil => rfl
  | cons a ys ih => simp [ih]

/-- The cost of one `consStep`. -/
def stepBound (β : Type) [TreeCodec β] (X Y B : ℕ) : ℕ :=
  (1 + X + Y) + B + 1 + (1 + X + Y) + 1 +
    (PolyProgram.cons β).coefficient * (2 * Y + 2) ^ (PolyProgram.cons β).degree + 1

/-- The explicit bound on `(mapProgram P).time`. -/
def mapTimeBound (α β : Type) [TreeCodec α] [TreeCodec β] (X Y B : ℕ) : ℕ :=
  (PolyProgram.reverse α).coefficient * (X + 1) ^ (PolyProgram.reverse α).degree + (X + 1) + 1 +
    X * (10 * (X + Y + 2) + stepBound β X Y B + 1) + (Y + 2) + 2

/-- **Generic time bound for `mapProgram`.** -/
theorem mapProgram_time_le {f : α → β} (P : TreeProgram α β f) (l : List α) (X Y B : ℕ)
    (hX : (treeEncode l).size ≤ X) (hY : (treeEncode (l.map f)).size ≤ Y)
    (hB : ∀ a ∈ l, P.time a ≤ B) :
    (mapProgram P).time l ≤ mapTimeBound α β X Y B := by
  rw [mapProgram_time]
  have hrevsize : (treeEncode l.reverse).size = (treeEncode l).size :=
    treeEncode_size_perm (List.reverse_perm l)
  have hmaprev : (treeEncode (l.reverse.map f)).size = (treeEncode (l.map f)).size := by
    rw [List.map_reverse]
    exact treeEncode_size_perm (List.reverse_perm _)
  -- reversal and the empty accumulator
  have hrev : (PolyProgram.reverse α).program.time l ≤
      (PolyProgram.reverse α).coefficient * (X + 1) ^ (PolyProgram.reverse α).degree :=
    ((PolyProgram.reverse α).bound l).trans
      (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left (by omega) _))
  have hconst : (TreeProgram.const ([] : List β)).time l ≤ X + 1 := by
    simp only [TreeProgram.const, treeEncode_nil, DataTree.size]
    omega
  -- the final state
  have hfinal : (treeEncode (([] : List α), l.reverse.foldl (fun c a => f a :: c) [])).size ≤
      Y + 2 := by
    rw [← map_eq_reverse_foldl]
    simp only [treeEncode_prod, treeEncode_nil, DataTree.size]
    omega
  -- loop states: the accumulator is a reversed prefix of the mapped list
  have hacc : ∀ ys zs, ys ++ zs = l.reverse →
      (treeEncode (ys.foldl (fun c a => f a :: c) [])).size ≤ Y := by
    intro ys zs hyz
    rw [foldl_cons_map, List.append_nil, treeEncode_size_perm (List.reverse_perm _)]
    calc
      (treeEncode (ys.map f)).size ≤ (treeEncode ((ys ++ zs).map f)).size :=
        treeEncode_list_size_mono ((List.sublist_append_left ys zs).map f)
      _ = (treeEncode (l.map f)).size := by rw [hyz, hmaprev]
      _ ≤ Y := hY
  have hwork : (consStep P).foldWork l.reverse [] ≤
      X * (10 * (X + Y + 2) + stepBound β X Y B + 1) := by
    have h := TreeProgram.foldWork_prefix (consStep P) l.reverse [] (X + Y + 1)
      (stepBound β X Y B)
      (by
        intro ys zs hyz
        have hz : (treeEncode zs).size ≤ X := by
          have := treeEncode_list_size_mono (List.sublist_append_right ys zs)
          rw [hyz, hrevsize] at this
          omega
        have ha := hacc ys zs hyz
        simp only [treeEncode_prod, DataTree.size]
        omega)
      (by
        intro ys a zs hyz
        have hal : a ∈ l := by
          have : a ∈ l.reverse := by rw [← hyz]; simp
          simpa using this
        have hasize := elem_size_le hal
        have hfa : (treeEncode (f a)).size ≤ Y :=
          (elem_size_le (List.mem_map_of_mem hal)).trans hY
        have hc := hacc ys (a :: zs) hyz
        have hcons := (PolyProgram.cons β).bound (f a, ys.foldl (fun c a => f a :: c) [])
        have hcons' : (PolyProgram.cons β).program.time (f a, ys.foldl (fun c a => f a :: c) []) ≤
            (PolyProgram.cons β).coefficient * (2 * Y + 2) ^ (PolyProgram.cons β).degree := by
          refine hcons.trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
          simp only [treeEncode_prod, DataTree.size]
          omega
        have hPa := hB a hal
        simp only [consStep, TreeProgram.comp, TreeProgram.pair, TreeProgram.fst,
          TreeProgram.snd, treeEncode_prod, DataTree.size, stepBound, Function.comp_apply]
        omega)
    refine h.trans ?_
    have hlen : l.reverse.length + 1 ≤ X := by
      have := treeEncode_list_length l.reverse
      omega
    exact Nat.mul_le_mul_right _ hlen
  unfold mapTimeBound
  omega

end MapTime

/-! ### Literals -/

/-- `decodeProgram_time`'s polynomial, as a function of the measure. -/
def decPoly (Y : ℕ) : ℕ :=
  decodePrep.coefficient * Y ^ decodePrep.degree +
    Y * (10 * Y + hornerStepProgram.coefficient * Y ^ hornerStepProgram.degree + 1) + Y + 2

theorem decPoly_mono {Y Z : ℕ} (h : Y ≤ Z) : decPoly Y ≤ decPoly Z := by
  unfold decPoly
  gcongr

theorem decodeProgram_time_decPoly (bs : List Bool) :
    decodeProgram.time bs ≤ decPoly (decodeMeasure bs) :=
  decodeProgram_time bs

theorem litPairProgram_time_eq (l : BitLiteral) :
    litPairProgram.time l =
      ((treeEncode l).size + decodeProgram.time l.1 + 1) + (treeEncode l).size + 1 +
        litArithProgram.program.time (decodeName l.1, l.2) + 1 :=
  rfl

/-- The per-literal time bound. -/
def litTime (N : ℕ) : ℕ :=
  (4 * N + 5) + decPoly (6 * N + 11) + 1 + (4 * N + 5) + 1 +
    litArithProgram.coefficient * (6 * N + 11) ^ litArithProgram.degree + 1

theorem litPairProgram_time_le {N : ℕ} {l : BitLiteral} (hsize : (treeEncode l).size ≤ 4 * N + 5)
    (hv : decodeName l.1 < N) : litPairProgram.time l ≤ litTime N := by
  rw [litPairProgram_time_eq]
  have hname : (treeEncode l.1).size + 1 ≤ (treeEncode l).size := by
    simp only [treeEncode_prod, DataTree.size]
    omega
  have hdec : decodeProgram.time l.1 ≤ decPoly (6 * N + 11) :=
    (decodeProgram_time_decPoly l.1).trans (decPoly_mono (by unfold decodeMeasure; omega))
  have harith : litArithProgram.program.time (decodeName l.1, l.2) ≤
      litArithProgram.coefficient * (6 * N + 11) ^ litArithProgram.degree := by
    refine (litArithProgram.bound _).trans (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
    have hb := bool_size_le l.2
    simp only [treeEncode_prod, DataTree.size, treeEncode_nat_size]
    omega
  unfold litTime
  omega

/-! ### Clauses and the formula -/

/-- The per-clause time bound. -/
def clauseTime (N : ℕ) : ℕ :=
  mapTimeBound BitLiteral (ℕ × ℕ) (inputBound N) ((6 * N + 6) * inputBound N) (litTime N)

/-- The whole decoding time bound. -/
def decodeTime (N : ℕ) : ℕ :=
  mapTimeBound BitClause (List (ℕ × ℕ)) (inputBound N) ((6 * N + 6) * inputBound N) (clauseTime N)

theorem clausePairsProgram_time_le {N : ℕ} {F : Formula N} {C : BitClause}
    (hC : C ∈ minimizeList F.bitList) : clausePairsProgram.time C ≤ clauseTime N := by
  apply mapProgram_time_le
  · exact (elem_size_le hC).trans (inputSize_le F)
  · have hmem : C.map litPair ∈ List.map (List.map litPair) (minimizeList F.bitList) :=
      List.mem_map_of_mem hC
    exact (elem_size_le hmem).trans (pairsSize_le F)
  · intro l hl
    exact litPairProgram_time_le (minimized_literal_size_le hC hl) (minimized_decode_lt hC hl)

/-- **Decoding time on the ETH front end's inputs.** -/
theorem formulaPairsProgram_time_le {N : ℕ} (F : Formula N) :
    formulaPairsProgram.time (minimizeList F.bitList) ≤ decodeTime N := by
  apply mapProgram_time_le
  · exact inputSize_le F
  · exact pairsSize_le F
  · intro C hC
    exact clausePairsProgram_time_le hC

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.elem_size_le
#print axioms OAI.Bridges.ETH.foldl_cons_map
#print axioms OAI.Bridges.ETH.stepBound
#print axioms OAI.Bridges.ETH.mapTimeBound
#print axioms OAI.Bridges.ETH.mapProgram_time_le
#print axioms OAI.Bridges.ETH.decPoly
#print axioms OAI.Bridges.ETH.decPoly_mono
#print axioms OAI.Bridges.ETH.decodeProgram_time_decPoly
#print axioms OAI.Bridges.ETH.litPairProgram_time_eq
#print axioms OAI.Bridges.ETH.litTime
#print axioms OAI.Bridges.ETH.litPairProgram_time_le
#print axioms OAI.Bridges.ETH.clauseTime
#print axioms OAI.Bridges.ETH.decodeTime
#print axioms OAI.Bridges.ETH.clausePairsProgram_time_le
#print axioms OAI.Bridges.ETH.formulaPairsProgram_time_le
