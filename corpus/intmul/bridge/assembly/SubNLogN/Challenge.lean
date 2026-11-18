import Mathlib.Computability.TuringMachine.Computable
import Mathlib.Computability.Encoding

/-!
# Minimal Challenge Specification: Unconditional Sub-`n log n` Integer Multiplication on `TM2`

Self-contained specification file for `comparator` (Lean kernel + `nanoda`), identical in model and
input/output encodings to `IntMulTM/Spec.lean`, with the sub-`n log n` time bound
`O(L · (log₂ L)^{1 - 2^{-46}})` stated in pure `ℕ`:
  `(M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)`.
-/

namespace SubNLogN.Challenge

open Computability

/-- Input alphabet: a bit, or the separator between the two operands. -/
inductive PairSym
  | bit (b : Bool)
  | sep
  deriving DecidableEq, Fintype

/-- Read a bit back (the separator has none). -/
def PairSym.toBool? : PairSym → Option Bool
  | .bit b => some b
  | .sep => none

/-- `encodeNatPair (a, b) = bits(a) ++ sep :: bits(b)`, with Mathlib's little-endian `encodeNat`. -/
def encodeNatPair (p : ℕ × ℕ) : List PairSym :=
  (encodeNat p.1).map PairSym.bit ++ PairSym.sep :: (encodeNat p.2).map PairSym.bit

/-- Split a word at its first separator. -/
def splitSep : List PairSym → Option (List Bool × List Bool)
  | [] => none
  | .sep :: rest => some ([], rest.filterMap PairSym.toBool?)
  | .bit b :: rest => (splitSep rest).map fun xy => (b :: xy.1, xy.2)

/-- Decoder for `encodeNatPair`. -/
def decodeNatPair (l : List PairSym) : Option (ℕ × ℕ) :=
  (splitSep l).map fun xy => (decodeNat xy.1, decodeNat xy.2)

theorem filterMap_toBool?_map_bit (R : List Bool) :
    (R.map PairSym.bit).filterMap PairSym.toBool? = R := by
  induction R with
  | nil => rfl
  | cons b R ih => simp [PairSym.toBool?, ih]

theorem splitSep_append (L R : List Bool) :
    splitSep (L.map PairSym.bit ++ PairSym.sep :: R.map PairSym.bit) = some (L, R) := by
  induction L with
  | nil => simp only [List.map_nil, List.nil_append, splitSep, filterMap_toBool?_map_bit]
  | cons b L ih => simp [splitSep, ih]

theorem decodeNatPair_encodeNatPair (p : ℕ × ℕ) :
    decodeNatPair (encodeNatPair p) = some p := by
  simp [decodeNatPair, encodeNatPair, splitSep_append, decode_encodeNat]

/-- The input encoding as a Mathlib `Encoding`: binary `a`, separator, binary `b`, over the
3-symbol alphabet `PairSym`. -/
def encNatPair : Encoding (ℕ × ℕ) PairSym where
  encode := encodeNatPair
  decode := decodeNatPair
  decode_encode := decodeNatPair_encodeNatPair

/-- **Unconditional sub-`n log n` acceptance statement (`κ = 2^{-46}`).**
Some multi-stack Turing machine with finite alphabets maps `encodeNatPair (a, b)` to the binary
code of `a * b`, and on every input of length `L ≥ N₀` it halts within `O(L · (log₂ L)^{1 - 2^{-46}})`
steps, expressed in pure `ℕ` as
  `(M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)`. -/
def IntMulSubNLogN : Prop :=
  ∃ M : Turing.TM2ComputableInTime encNatPair.encode encodingNatBool.encode
      (fun p : ℕ × ℕ => p.1 * p.2),
    (∀ k, Finite (M.tm.Γ k)) ∧
    ∃ C N₀ : ℕ, 0 < C ∧ ∀ L ≥ N₀,
      (M.time L) ^ (2 ^ 46) ≤ (C * L) ^ (2 ^ 46) * (Nat.log2 L) ^ (2 ^ 46 - 1)

#guard encodeNatPair (5, 3) == [.bit true, .bit false, .bit true, .sep, .bit true, .bit true]
#guard decodeNatPair (encodeNatPair (123456789, 987654321)) == some (123456789, 987654321)

end SubNLogN.Challenge
