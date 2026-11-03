import OAI.Bridges.ETH.CanonicalCNF
import OAI.Algorithms.SubexponentialSAT.Encoding

/-!
# ETH correspondence, component B, milestone B1b: exact encoding equality

`canonicalWord : BitFormula → List Bool` is an explicit list computation on the bit-level
formula that ParityLifts' front end produces. It decodes each variable name, forms OpenAI's
literal code `2v + (1 if positive else 0)`, removes duplicates and sorts the codes in each
clause, removes duplicates and sorts the clause lists lexicographically, and writes the result
with OpenAI's syntax primitives `Encoding.encodeNat` and `Encoding.encodeList`.

The principal theorem `canonicalWord_eq` proves that this word equals, bit for bit,
`Encoding.encodeCNF` of the canonical CNF from milestone B1a. It holds for every `BitFormula`,
so the input domain carries no restriction. In particular:

* names with trailing `false` bits decode through `decodeName` exactly as B1a does, and two
  names with the same value give the same literal code;
* duplicate literals and duplicate clauses collapse through `List.dedup`, matching `Finset`;
* an empty clause gives `[]`, an empty formula gives `encodeNat 0 ++ [false]`;
* the variable count is one more than the largest decoded index, so unused variables below that
  index stay counted, as in B1a's `varBound`.

Sorting uses `List.insertionSort` here; `Finset.sort` uses merge sort. The proof never compares
the two algorithms: both outputs are duplicate-free, sorted by the same linear order, and have the
same elements, hence equal (`sort_eq_insertionSort_dedup`).

Still open: **B2**, a polynomial-cost executable version of `canonicalWord` in the ParityLifts
model, and **C**, the machine simulation.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### The explicit word -/

/-- OpenAI's literal code of a bit-level literal. -/
def literalNumber (l : BitLiteral) : ℕ := 2 * decodeName l.1 + if l.2 then 1 else 0

/-- The literal codes of a clause, without duplicates, in increasing order. -/
def clauseWordNumbers (C : BitClause) : List ℕ :=
  ((C.map literalNumber).dedup).insertionSort (· ≤ ·)

/-- The clause code lists of a formula, without duplicates, in lexicographic order. -/
def formulaWordNumbers (G : BitFormula) : List (List ℕ) :=
  ((G.map clauseWordNumbers).dedup).insertionSort (· ≤ ·)

/-- One more than the largest decoded variable index; `0` for a formula without literals. -/
def bitVarBound (G : BitFormula) : ℕ :=
  (G.flatMap (List.map fun l => decodeName l.1 + 1)).foldr max 0

/-- The canonical input word for the verified SAT machine, computed from a `BitFormula`. -/
def canonicalWord (G : BitFormula) : List Bool :=
  Encoding.encodeNat (bitVarBound G) ++
    Encoding.encodeList (Encoding.encodeList Encoding.encodeNat) (formulaWordNumbers G)

/-! ### Canonical ordering -/

/-- Duplicate removal followed by insertion sort gives `Finset.sort` of any finset with the same
elements. -/
theorem sort_eq_insertionSort_dedup {α : Type*} [LinearOrder α] [DecidableEq α]
    (s : Finset α) (l : List α)
    (h : ∀ a, a ∈ l ↔ a ∈ s) :
    (l.dedup).insertionSort (· ≤ ·) = s.sort (· ≤ ·) := by
  apply List.Perm.eq_of_pairwise' (r := (· ≤ ·))
  · exact List.sortedLE_insertionSort.pairwise
  · exact Finset.pairwise_sort s _
  · refine (List.perm_insertionSort _ _).trans ?_
    apply List.perm_of_nodup_nodup_toFinset_eq (List.nodup_dedup l) (Finset.sort_nodup s _)
    ext a
    simp [h]

/-! ### Literal and clause level -/

theorem bitVarBound_eq (G : BitFormula) : bitVarBound G = varBound (decodeFormula G) := by
  simp [bitVarBound, varBound, decodeFormula, decodeLiteral, List.flatMap_map,
    Function.comp_def]

theorem literalCode_toLiteral {n : ℕ} {l : BitLiteral} {l' : SAT.Literal (Fin n)}
    (h : toLiteral n (decodeLiteral l) = some l') :
    Encoding.literalCode l' = literalNumber l := by
  obtain ⟨hv, hp⟩ := toLiteral_eq_some h
  simp only [Encoding.literalCode, literalNumber, hv, hp, decodeLiteral]

/-- **Clause normalization.** For a clause whose decoded indices are below `n`, the explicit
code list equals OpenAI's `clauseNumbers` of the B1a clause. -/
theorem clauseWordNumbers_eq {n : ℕ} {C : BitClause} (h : ∀ l ∈ C, decodeName l.1 < n) :
    clauseWordNumbers C = Encoding.clauseNumbers (toClause n (C.map decodeLiteral)) := by
  unfold clauseWordNumbers Encoding.clauseNumbers
  apply sort_eq_insertionSort_dedup
  intro a
  simp only [List.mem_map, Finset.mem_image]
  constructor
  · rintro ⟨l, hl, rfl⟩
    have hlt := h l hl
    refine ⟨⟨⟨decodeName l.1, hlt⟩, l.2⟩,
      mem_toClause.mpr ⟨decodeLiteral l, List.mem_map.mpr ⟨l, hl, rfl⟩, ?_⟩, ?_⟩
    · simp [toLiteral, decodeLiteral, hlt]
    · simp [Encoding.literalCode, literalNumber]
  · rintro ⟨l', hl', rfl⟩
    obtain ⟨x, hx, hsome⟩ := mem_toClause.mp hl'
    obtain ⟨l, hl, rfl⟩ := List.mem_map.mp hx
    exact ⟨l, hl, (literalCode_toLiteral hsome).symm⟩

/-! ### Formula level and framing -/

theorem mem_canonicalCNF {G : ClauseList (ℕ × Bool)} {D : SAT.Clause (Fin (varBound G))} :
    D ∈ canonicalCNF G ↔ ∃ C ∈ G, toClause (varBound G) C = D := by
  unfold canonicalCNF
  simp

/-- **Canonical clause ordering.** -/
theorem formulaWordNumbers_eq (G : BitFormula) :
    formulaWordNumbers G = Encoding.cnfNumbers (canonicalCNF (decodeFormula G)) := by
  have hrange : ∀ C ∈ G, ∀ l ∈ C, decodeName l.1 < varBound (decodeFormula G) := by
    intro C hC l hl
    have h := lt_varBound (G := decodeFormula G) (C := C.map decodeLiteral)
      (List.mem_map.mpr ⟨C, hC, rfl⟩) (l := decodeLiteral l) (List.mem_map.mpr ⟨l, hl, rfl⟩)
    simpa [decodeLiteral] using h
  unfold formulaWordNumbers Encoding.cnfNumbers
  apply sort_eq_insertionSort_dedup
  intro X
  simp only [List.mem_map, Finset.mem_image, mem_canonicalCNF]
  constructor
  · rintro ⟨C, hC, rfl⟩
    exact ⟨_, ⟨C.map decodeLiteral, List.mem_map.mpr ⟨C, hC, rfl⟩, rfl⟩,
      (clauseWordNumbers_eq (hrange C hC)).symm⟩
  · rintro ⟨D, ⟨E, hE, rfl⟩, rfl⟩
    obtain ⟨C, hC, rfl⟩ := List.mem_map.mp hE
    exact ⟨C, hC, clauseWordNumbers_eq (hrange C hC)⟩

/-- **Exact encoding equality (B1b).** The explicit word computed from a `BitFormula` is OpenAI's
`encodeCNF` of the B1a canonical CNF, bit for bit, for every `BitFormula`. -/
theorem canonicalWord_eq (G : BitFormula) :
    canonicalWord G = Encoding.encodeCNF (canonicalCNF (decodeFormula G)) := by
  unfold canonicalWord Encoding.encodeCNF Encoding.encodeCNFBody
  rw [bitVarBound_eq, formulaWordNumbers_eq]

/-- **B1a + B1b on the ETH front end.** For a conventional formula `F`, the explicit word computed
from `minimizeList F.bitList` is OpenAI's canonical encoding of a width-3 CNF on at most `N`
variables that is satisfiable exactly when `F` is. -/
theorem canonicalWord_bridge {N : ℕ} (F : Formula N) :
    canonicalWord (minimizeList F.bitList) =
        Encoding.encodeCNF (canonicalCNF (bitCanonical F)) ∧
      varBound (bitCanonical F) ≤ N ∧
      SAT.WidthAtMost 3 (canonicalCNF (bitCanonical F)) ∧
      (SAT.Satisfiable (canonicalCNF (bitCanonical F)) ↔ F.Satisfiable) :=
  ⟨canonicalWord_eq _, bitCanonical_varBound_le F, bitCanonical_width F,
    bitCanonical_satisfiable F⟩

/-! ### Edge cases, checked by evaluation -/

/-- Empty formula: zero variables, empty clause list. -/
example : canonicalWord [] = [false, false] := by decide

/-- One empty clause: zero variables, then the list `[[]]`, framed as
`true :: frame [false] ++ [false]` with `frame [false] = [true, false, false]`. -/
example : canonicalWord [[]] = [false, true, true, false, false, false] := by decide

/-- Duplicate literals, duplicate clauses, and a noncanonical name (`[true, false]` decodes to 1,
like `[true]`) all collapse to the single clause `{x₁}`, code `3`. -/
example : canonicalWord [[([true], true), ([true, false], true)], [([true], true)]] =
    canonicalWord [[([true], true)]] := by decide

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.sort_eq_insertionSort_dedup
#print axioms OAI.Bridges.ETH.bitVarBound_eq
#print axioms OAI.Bridges.ETH.literalCode_toLiteral
#print axioms OAI.Bridges.ETH.clauseWordNumbers_eq
#print axioms OAI.Bridges.ETH.mem_canonicalCNF
#print axioms OAI.Bridges.ETH.formulaWordNumbers_eq
#print axioms OAI.Bridges.ETH.canonicalWord_eq
#print axioms OAI.Bridges.ETH.canonicalWord_bridge
