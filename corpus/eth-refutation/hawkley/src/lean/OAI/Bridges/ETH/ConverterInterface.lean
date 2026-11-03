import OAI.Bridges.ETH.CanonicalWord

/-!
# ETH correspondence, component B2: the converter's interface

**Finding.** In the ParityLifts model a natural number is the unary tree `numTree n`, of size
`2n+1`, and `Encoding.encodeNat` writes the variable count in unary. A `BitFormula` names its
variables in binary. So `canonicalWord G` can be exponentially longer than the encoding of `G`:
one literal on the variable `2^k` has an input of size `O(k)` and an output of length `> 2^k`.

`no_polyProgram_canonicalWord` turns this into a theorem: no
`PolyProgram BitFormula (List Bool) canonicalWord` exists, since a `PolyProgram` bounds its cost
by a polynomial in the serialized input size and its cost bounds its output size.

**Consequence for B2.** The converter's interface follows the composition point of
`sat_code_rate`, which asks for an `FCode` `p` with
`RBEval p (treeEncode (minimizeList F.bitList)) (R N) (treeEncode b)` and a budget `R N` in the
variable count `N`. So the converter is a
`TreeProgram BitFormula (List Bool) canonicalWord` (an `FCode`, its exact `BEval` run, and an
explicit `time`), together with a proved bound on `time` polynomial in
`(treeEncode G).size + bitVarBound G`. On the front end's inputs `minimizeList F.bitList`, both
measures are bounded by polynomials in `N` (`bitCanonical_varBound_le`, `Formula.controlled`).
Its stages after name decoding run on unary data of size polynomial in `N`, so they can be
`PolyProgram`s, such as `natSortProgram`, composed through `TreeProgram.comp`.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity
open OAI.Algorithms.SubexponentialSAT
open Filter Topology

/-- One clause with one positive literal on the variable `2^k`, named in binary. -/
def hardFormula (k : ℕ) : BitFormula := [[(List.replicate k false ++ [true], true)]]

theorem decodeName_cons_false (bs : List Bool) :
    decodeName (false :: bs) = 2 * decodeName bs := by
  simp [decodeName, Nat.ofDigits_cons]

theorem decodeName_hard (k : ℕ) : decodeName (List.replicate k false ++ [true]) = 2 ^ k := by
  induction k with
  | zero => simp [decodeName]
  | succ k ih =>
    rw [List.replicate_succ, List.cons_append, decodeName_cons_false, ih, pow_succ]
    ring

theorem bitVarBound_hard (k : ℕ) : bitVarBound (hardFormula k) = 2 ^ k + 1 := by
  simp [bitVarBound, hardFormula, decodeName_hard]

theorem canonicalWord_hard_length (k : ℕ) : 2 ^ k < (canonicalWord (hardFormula k)).length := by
  simp only [canonicalWord, List.length_append, Encoding.encodeNat, List.length_replicate,
    bitVarBound_hard]
  simp
  omega

theorem hardFormula_size (k : ℕ) : (treeEncode (hardFormula k)).size ≤ 4 * k + 16 := by
  have hb := treeEncode_bits_size (List.replicate k false ++ [true])
  simp only [List.length_append, List.length_replicate, List.length_singleton] at hb
  simp only [hardFormula, treeEncode_cons, treeEncode_nil, treeEncode_pair, DataTree.size,
    treeEncode_true]
  omega

/-- **Interface obstruction.** No polynomial program, in the sense of `PolyProgram` (cost
polynomial in the size of the serialized input), computes `canonicalWord`. -/
theorem no_polyProgram_canonicalWord
    (P : PolyProgram BitFormula (List Bool) canonicalWord) : False := by
  let c := P.coefficient
  let d := P.degree
  have hpos : (0 : ℝ) < 1 / ((c : ℝ) * 21 ^ d + 1) := by positivity
  obtain ⟨K, hK⟩ := eventually_atTop.mp
    ((tendsto_pow_const_div_const_pow_of_one_lt d (one_lt_two : (1 : ℝ) < 2)).eventually
      (gt_mem_nhds hpos))
  let k := K + 1
  have hk : ((k : ℝ) ^ d) / 2 ^ k < 1 / ((c : ℝ) * 21 ^ d + 1) := hK k (by omega)
  -- The run produces the whole word, so its cost is at least the word's length.
  have h1 := canonicalWord_hard_length k
  have h2 := treeEncode_list_length (canonicalWord (hardFormula k))
  have h3 := (P.program.run (hardFormula k)).bounds.2.1
  have h4 := P.bound (hardFormula k)
  have h5 : (treeEncode (hardFormula k)).size + 1 ≤ 21 * k := by
    have := hardFormula_size k
    omega
  have h6 : ((treeEncode (hardFormula k)).size + 1) ^ d ≤ (21 * k) ^ d :=
    Nat.pow_le_pow_left h5 d
  have hnat : 2 ^ k < c * 21 ^ d * k ^ d := by
    calc
      2 ^ k < (canonicalWord (hardFormula k)).length + 1 := by omega
      _ ≤ P.program.time (hardFormula k) := h2.trans h3
      _ ≤ c * ((treeEncode (hardFormula k)).size + 1) ^ d := h4
      _ ≤ c * (21 * k) ^ d := Nat.mul_le_mul_left c h6
      _ = c * 21 ^ d * k ^ d := by rw [mul_pow, mul_assoc]
  have hreal : (2 : ℝ) ^ k < (c : ℝ) * 21 ^ d * (k : ℝ) ^ d := by exact_mod_cast hnat
  have h2pos : (0 : ℝ) < 2 ^ k := by positivity
  rw [div_lt_div_iff₀ h2pos (by positivity)] at hk
  have hkd : (0 : ℝ) ≤ (k : ℝ) ^ d := by positivity
  nlinarith

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.decodeName_hard
#print axioms OAI.Bridges.ETH.bitVarBound_hard
#print axioms OAI.Bridges.ETH.canonicalWord_hard_length
#print axioms OAI.Bridges.ETH.hardFormula_size
#print axioms OAI.Bridges.ETH.no_polyProgram_canonicalWord
