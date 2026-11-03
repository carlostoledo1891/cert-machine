import OAI.Bridges.ETH.Converter

/-!
# ETH correspondence, component B2.5b.1: input and decoded-pair size bounds

For `F : Formula N` the converter runs on `G = minimizeList F.bitList`. This module bounds, by
explicit polynomials in `N`:

* the whole input: `inputSize_le`,
  `(treeEncode G).size ≤ inputBound N = 1 + 4 * (2N+1)^3 * (2 + 3 * (4N+6))`.
  The proof transfers `G` to the literal level (`minimizeList_bitList`, from
  `minimizeList_map_encode`), where `Formula.controlled` and `ListControlled.size` apply with
  `Fintype.card (Literal N) = 2N`. That bound counts clauses (at most `4 (2N+1)^3` after
  minimization, by `cnf_card_bound`), literals per clause (at most `3`) and literal size (at most
  `4N+5`) together;
* each literal of `G`: `minimized_literal_size_le` (tree size at most `4N+5`),
  `minimized_decode_lt` (decoded index below `N`), `minimized_clause_length_le` (at most three
  literals);
* the decoded pairs: `litPair_size_le` (each pair has tree size at most `6N+6`) and
  `pairsSize_le`, `(treeEncode (List.map (List.map litPair) G)).size ≤ (6N+6) * inputBound N`, from the
  generic scaling lemma `map_size_le`.

These bounds hold for every `F : Formula N` with no extra hypothesis: the type `Formula N`
fixes the variable range (`Fin N`) and the clause width (at most `3`), and `minimizeList` removes
repeated clauses. They do not contradict B2.0, which concerns arbitrary `BitFormula` inputs.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity

/-- The explicit input-size polynomial. -/
def inputBound (N : ℕ) : ℕ := 1 + 4 * (2 * N + 1) ^ 3 * (2 + 3 * (4 * N + 6))

/-! ### The whole input -/

/-- The minimized bit-level formula is the bit image of the minimized literal-level formula. -/
theorem minimizeList_bitList {N : ℕ} (F : Formula N) :
    minimizeList F.bitList = ClauseList.map literalBits (minimizeList F.literalLists) := by
  let _ := literalCodec N
  exact minimizeList_map_encode literalBits (fun _ => rfl) F.literalLists

theorem card_literal (N : ℕ) : Fintype.card (Literal N) = 2 * N := by
  simp only [Literal, Fintype.card_prod, Fintype.card_fin, Fintype.card_bool]
  omega

/-- **Input-size bound.** -/
theorem inputSize_le {N : ℕ} (F : Formula N) :
    (treeEncode (minimizeList F.bitList)).size ≤ inputBound N := by
  let _ := literalCodec N
  rw [minimizeList_bitList, ClauseList.map_encode literalBits (fun _ => rfl)]
  have h := (Formula.controlled F).size
  rw [card_literal] at h
  simpa [inputBound] using h

/-! ### Each literal and clause -/

theorem mem_minimized {N : ℕ} {F : Formula N} {C : BitClause}
    (hC : C ∈ minimizeList F.bitList) : ∃ D ∈ F, C = D.literals.map literalBits :=
  mem_bitList (mem_minimizeList hC)

theorem minimized_decode_lt {N : ℕ} {F : Formula N} {C : BitClause}
    (hC : C ∈ minimizeList F.bitList) {l : BitLiteral} (hl : l ∈ C) : decodeName l.1 < N := by
  obtain ⟨D, _, rfl⟩ := mem_minimized hC
  obtain ⟨m, _, rfl⟩ := List.mem_map.mp hl
  simp [literalBits, m.1.isLt]

theorem minimized_literal_size_le {N : ℕ} {F : Formula N} {C : BitClause}
    (hC : C ∈ minimizeList F.bitList) {l : BitLiteral} (hl : l ∈ C) :
    (treeEncode l).size ≤ 4 * N + 5 := by
  obtain ⟨D, _, rfl⟩ := mem_minimized hC
  obtain ⟨m, _, rfl⟩ := List.mem_map.mp hl
  exact literalBits_size m

theorem minimized_clause_length_le {N : ℕ} {F : Formula N} {C : BitClause}
    (hC : C ∈ minimizeList F.bitList) : C.length ≤ 3 := by
  obtain ⟨D, _, rfl⟩ := mem_minimized hC
  simpa using D.width

/-! ### Decoded pairs -/

/-- If `f` multiplies the size of each element by at most `K ≥ 1`, it multiplies the size of the
list by at most `K`. -/
theorem map_size_le {α β : Type} [TreeCodec α] [TreeCodec β] {f : α → β} {K : ℕ} (hK : 1 ≤ K)
    (l : List α) (h : ∀ a ∈ l, (treeEncode (f a)).size ≤ K * (treeEncode a).size) :
    (treeEncode (l.map f)).size ≤ K * (treeEncode l).size := by
  induction l with
  | nil => simp [DataTree.size]; omega
  | cons a l ih =>
    have ha := h a List.mem_cons_self
    have hl := ih (fun b hb => h b (List.mem_cons_of_mem a hb))
    simp only [List.map_cons, treeEncode_cons, DataTree.size]
    nlinarith

theorem litPair_size_le {N : ℕ} {l : BitLiteral} (hl : decodeName l.1 < N) :
    (treeEncode (litPair l)).size ≤ 6 * N + 6 := by
  simp only [litPair, literalNumber, treeEncode_prod, DataTree.size, treeEncode_nat_size]
  split <;> omega

/-- **Decoded-pair size bound.** -/
theorem pairsSize_le {N : ℕ} (F : Formula N) :
    (treeEncode (List.map (List.map litPair) (minimizeList F.bitList))).size ≤
      (6 * N + 6) * inputBound N := by
  have hK : 1 ≤ 6 * N + 6 := by omega
  refine (map_size_le hK _ ?_).trans (Nat.mul_le_mul_left _ (inputSize_le F))
  intro C hC
  refine map_size_le hK C ?_
  intro l hl
  have hpos := DataTree.size_pos (treeEncode l)
  calc
    (treeEncode (litPair l)).size ≤ 6 * N + 6 := litPair_size_le (minimized_decode_lt hC hl)
    _ = (6 * N + 6) * 1 := (mul_one _).symm
    _ ≤ (6 * N + 6) * (treeEncode l).size := Nat.mul_le_mul_left _ hpos

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.inputBound
#print axioms OAI.Bridges.ETH.minimizeList_bitList
#print axioms OAI.Bridges.ETH.card_literal
#print axioms OAI.Bridges.ETH.inputSize_le
#print axioms OAI.Bridges.ETH.mem_minimized
#print axioms OAI.Bridges.ETH.minimized_decode_lt
#print axioms OAI.Bridges.ETH.minimized_literal_size_le
#print axioms OAI.Bridges.ETH.minimized_clause_length_le
#print axioms OAI.Bridges.ETH.map_size_le
#print axioms OAI.Bridges.ETH.litPair_size_le
#print axioms OAI.Bridges.ETH.pairsSize_le
