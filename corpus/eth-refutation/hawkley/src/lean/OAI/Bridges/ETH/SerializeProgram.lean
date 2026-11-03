import OAI.Bridges.ETH.CanonicalWord

/-!
# ETH correspondence, component B2, milestone B2.4: serialization programs

OpenAI's input syntax (`OAI.Algorithms.SubexponentialSAT.Encoding`) has three functions:

* `encodeNat n = List.replicate n true ++ [false]`: unary, ended by `false`;
* `frame bits`: each bit `b` becomes `true, b`, and the frame ends with `false`;
* `encodeList enc`: `[]` becomes `[false]`; `a :: as` becomes
  `true :: (frame (enc a) ++ encodeList enc as)`.

So an empty list is `[false]`, an empty clause inside a formula is `true :: frame [false]`, and
every nested item is framed. This module proves each function equal to a flat form
(`encodeNat_eq_flat`, `frame_eq_flat`, `encodeList_eq_flat`) and builds a `PolyProgram` for each
from existing ParityLifts programs (`ticks`, `const`, `id`, `cons`, `map`, `flatten`, `append`):

* `oaiEncodeNatProgram : PolyProgram ℕ (List Bool) Encoding.encodeNat`;
* `frameProgram : PolyProgram (List Bool) (List Bool) Encoding.frame`;
* `encodeListProgram E : PolyProgram (List α) (List Bool) (Encoding.encodeList enc)`, for any
  element serializer `E : PolyProgram α (List Bool) enc`;
* `cnfBodyProgram`, the nested instance for clause code lists;
* `wordProgram : PolyProgram (ℕ × List (List ℕ)) (List Bool) _`, OpenAI's whole word
  `encodeNat n ++ encodeList (encodeList encodeNat) L`.

`wordProgram_spec` states that on `(bitVarBound G, formulaWordNumbers G)` the program outputs
`Encoding.encodeCNF (canonicalCNF (decodeFormula G))` exactly, through `canonicalWord_eq` (B1b).

Every program's cost is polynomial in its input tree size, through its `bound` field. Input tree
size and output length are related explicitly: `(encodeNat n).length = n + 1` while
`(treeEncode n).size = 2n + 1`; `(frame bits).length = 2 * bits.length + 1`;
`encodeList_length_le` gives `length ≤ (2k+2) * input size` whenever each item's code has
length at most `k` times its size, hence `cnfBody_length_le` (factor `10`).
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT

/-! ### Flat forms of OpenAI's serializers -/

theorem encodeNat_eq_flat (n : ℕ) :
    Encoding.encodeNat n = (List.replicate n false).map (fun _ => true) ++ [false] := by
  simp [Encoding.encodeNat, List.map_replicate]

theorem frame_eq_flat (bits : List Bool) :
    Encoding.frame bits = (bits.map (fun b => [true, b])).flatten ++ [false] := by
  induction bits with
  | nil => rfl
  | cons b bits ih => simp [ih]

theorem encodeList_eq_flat {α : Type} (enc : α → List Bool) (as : List α) :
    Encoding.encodeList enc as =
      (as.map (fun a => true :: Encoding.frame (enc a))).flatten ++ [false] := by
  induction as with
  | nil => rfl
  | cons a as ih => simp [Encoding.encodeList, ih]

/-! ### The programs -/

/-- OpenAI's unary `encodeNat`. -/
def oaiEncodeNatProgram : PolyProgram ℕ (List Bool) Encoding.encodeNat := by
  let ones := PolyProgram.ticks.comp (PolyProgram.const (α := Bool) true).map
  refine ((ones.pair (PolyProgram.const [false])).comp (PolyProgram.append Bool)).congr ?_
  intro n
  rw [encodeNat_eq_flat]
  rfl

/-- `b ↦ [true, b]`. -/
def escapeBitProgram : PolyProgram Bool (List Bool) (fun b => [true, b]) :=
  (((PolyProgram.const (α := Bool) true).pair
    (((PolyProgram.id Bool).pair (PolyProgram.const ([] : List Bool))).comp
      (PolyProgram.cons Bool))).comp (PolyProgram.cons Bool)).congr (by intro b; rfl)

/-- OpenAI's `frame`. -/
def frameProgram : PolyProgram (List Bool) (List Bool) Encoding.frame := by
  refine (((escapeBitProgram.map.comp (PolyProgram.flatten Bool)).pair
    (PolyProgram.const [false])).comp (PolyProgram.append Bool)).congr ?_
  intro bits
  rw [frame_eq_flat]
  rfl

/-- OpenAI's `encodeList`, for any element serializer. -/
def encodeListProgram {α : Type} [TreeCodec α] {enc : α → List Bool}
    (E : PolyProgram α (List Bool) enc) :
    PolyProgram (List α) (List Bool) (Encoding.encodeList enc) := by
  let item : PolyProgram α (List Bool) (fun a => true :: Encoding.frame (enc a)) :=
    (((PolyProgram.const (α := α) true).pair (E.comp frameProgram)).comp
      (PolyProgram.cons Bool)).congr (by intro a; rfl)
  refine (((item.map.comp (PolyProgram.flatten Bool)).pair
    (PolyProgram.const [false])).comp (PolyProgram.append Bool)).congr ?_
  intro as
  rw [encodeList_eq_flat]
  rfl

/-- OpenAI's payload syntax for clause code lists, `encodeList (encodeList encodeNat)`. -/
def cnfBodyProgram :
    PolyProgram (List (List ℕ)) (List Bool) (Encoding.encodeList (Encoding.encodeList Encoding.encodeNat)) :=
  encodeListProgram (encodeListProgram oaiEncodeNatProgram)

/-- OpenAI's full word: the unary variable count, then the payload. -/
def wordProgram :
    PolyProgram (ℕ × List (List ℕ)) (List Bool)
      (fun x => Encoding.encodeNat x.1 ++
        Encoding.encodeList (Encoding.encodeList Encoding.encodeNat) x.2) :=
  ((((PolyProgram.fst ℕ (List (List ℕ))).comp oaiEncodeNatProgram).pair
    ((PolyProgram.snd ℕ (List (List ℕ))).comp cnfBodyProgram)).comp
      (PolyProgram.append Bool)).congr (by intro x; rfl)

/-! ### Execution and cost specifications -/

/-- The run and cost statements every `PolyProgram` carries, spelled out. -/
theorem polyProgram_spec {α β : Type} [TreeCodec α] [TreeCodec β] {f : α → β}
    (P : PolyProgram α β f) (x : α) :
    BEval P.program.code (treeEncode x) (P.program.time x) (treeEncode (f x)) ∧
      P.program.time x ≤ P.coefficient * ((treeEncode x).size + 1) ^ P.degree :=
  ⟨P.program.run x, P.bound x⟩

theorem oaiEncodeNatProgram_spec (n : ℕ) :
    BEval oaiEncodeNatProgram.program.code (treeEncode n) (oaiEncodeNatProgram.program.time n)
        (treeEncode (Encoding.encodeNat n)) ∧
      oaiEncodeNatProgram.program.time n ≤
        oaiEncodeNatProgram.coefficient * (2 * n + 2) ^ oaiEncodeNatProgram.degree := by
  have h := polyProgram_spec oaiEncodeNatProgram n
  simp only [treeEncode_nat, numTree_size] at h
  exact h

theorem frameProgram_spec (bits : List Bool) :
    BEval frameProgram.program.code (treeEncode bits) (frameProgram.program.time bits)
        (treeEncode (Encoding.frame bits)) ∧
      frameProgram.program.time bits ≤
        frameProgram.coefficient * ((treeEncode bits).size + 1) ^ frameProgram.degree :=
  polyProgram_spec frameProgram bits

theorem cnfBodyProgram_spec (L : List (List ℕ)) :
    BEval cnfBodyProgram.program.code (treeEncode L) (cnfBodyProgram.program.time L)
        (treeEncode (Encoding.encodeList (Encoding.encodeList Encoding.encodeNat) L)) ∧
      cnfBodyProgram.program.time L ≤
        cnfBodyProgram.coefficient * ((treeEncode L).size + 1) ^ cnfBodyProgram.degree :=
  polyProgram_spec cnfBodyProgram L

/-- **Exact word.** On the explicit data of `canonicalWord`, `wordProgram` outputs OpenAI's
`encodeCNF` of the canonical CNF, bit for bit. -/
theorem wordProgram_spec (G : BitFormula) :
    BEval wordProgram.program.code (treeEncode (bitVarBound G, formulaWordNumbers G))
        (wordProgram.program.time (bitVarBound G, formulaWordNumbers G))
        (treeEncode (Encoding.encodeCNF (canonicalCNF (decodeFormula G)))) ∧
      wordProgram.program.time (bitVarBound G, formulaWordNumbers G) ≤
        wordProgram.coefficient *
          ((treeEncode (bitVarBound G, formulaWordNumbers G)).size + 1) ^ wordProgram.degree := by
  refine ⟨?_, wordProgram.bound _⟩
  rw [← canonicalWord_eq]
  exact wordProgram.program.run (bitVarBound G, formulaWordNumbers G)

/-! ### Output length against input size -/

theorem encodeNat_length (n : ℕ) : (Encoding.encodeNat n).length = n + 1 := by
  simp [Encoding.encodeNat]

theorem encodeNat_length_le_size (n : ℕ) :
    (Encoding.encodeNat n).length ≤ 1 * (treeEncode n).size := by
  rw [encodeNat_length, treeEncode_nat, numTree_size]
  omega

theorem frame_length (bits : List Bool) :
    (Encoding.frame bits).length = 2 * bits.length + 1 := by
  induction bits with
  | nil => rfl
  | cons b bits ih => simp [ih]; omega

/-- If each item's code has length at most `k` times its tree size, the list's code has length at
most `2k + 2` times the list's tree size. -/
theorem encodeList_length_le {α : Type} [TreeCodec α] {enc : α → List Bool} {k : ℕ}
    (as : List α) (h : ∀ a ∈ as, (enc a).length ≤ k * (treeEncode a).size) :
    (Encoding.encodeList enc as).length ≤ (2 * k + 2) * (treeEncode as).size := by
  induction as with
  | nil => simp [Encoding.encodeList, DataTree.size]
  | cons a as ih =>
    have ha := h a List.mem_cons_self
    have hs := ih (fun b hb => h b (List.mem_cons_of_mem a hb))
    simp only [Encoding.encodeList, List.length_cons, List.length_append, frame_length,
      treeEncode_cons, DataTree.size]
    nlinarith

theorem clauseCode_length_le (C : List ℕ) :
    (Encoding.encodeList Encoding.encodeNat C).length ≤ 4 * (treeEncode C).size :=
  encodeList_length_le (k := 1) C (fun n _ => encodeNat_length_le_size n)

/-- The payload's length is at most ten times the tree size of the clause code lists. -/
theorem cnfBody_length_le (L : List (List ℕ)) :
    (Encoding.encodeList (Encoding.encodeList Encoding.encodeNat) L).length ≤
      10 * (treeEncode L).size :=
  encodeList_length_le (k := 4) L (fun C _ => clauseCode_length_le C)

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.encodeNat_eq_flat
#print axioms OAI.Bridges.ETH.frame_eq_flat
#print axioms OAI.Bridges.ETH.encodeList_eq_flat
#print axioms OAI.Bridges.ETH.oaiEncodeNatProgram
#print axioms OAI.Bridges.ETH.escapeBitProgram
#print axioms OAI.Bridges.ETH.frameProgram
#print axioms OAI.Bridges.ETH.encodeListProgram
#print axioms OAI.Bridges.ETH.cnfBodyProgram
#print axioms OAI.Bridges.ETH.wordProgram
#print axioms OAI.Bridges.ETH.polyProgram_spec
#print axioms OAI.Bridges.ETH.oaiEncodeNatProgram_spec
#print axioms OAI.Bridges.ETH.frameProgram_spec
#print axioms OAI.Bridges.ETH.cnfBodyProgram_spec
#print axioms OAI.Bridges.ETH.wordProgram_spec
#print axioms OAI.Bridges.ETH.encodeNat_length
#print axioms OAI.Bridges.ETH.encodeNat_length_le_size
#print axioms OAI.Bridges.ETH.frame_length
#print axioms OAI.Bridges.ETH.encodeList_length_le
#print axioms OAI.Bridges.ETH.clauseCode_length_le
#print axioms OAI.Bridges.ETH.cnfBody_length_le
