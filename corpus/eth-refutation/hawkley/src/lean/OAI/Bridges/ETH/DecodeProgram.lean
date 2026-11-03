import OAI.Bridges.ETH.SortProgram
import OAI.Bridges.ETH.CanonicalCNF

/-!
# ETH correspondence, component B2, milestone B2.3: binary-to-unary decoding

`decodeName` (milestone B1a) reads a variable name least-significant bit first:
`decodeName (b :: bs) = bit b + 2 * decodeName bs` (`decodeName_cons`). In the ParityLifts model
the result is the unary tree `numTree v`, of size `2v + 1`, so the output can be exponentially
larger than the input; milestone B2.0 shows this rules out a `PolyProgram`.

`decodeProgram : TreeProgram (List Bool) ℕ decodeName` evaluates the name by Horner's rule, from
the most significant bit:

1. `decodePrep` (a `PolyProgram`): `bs ↦ (bs.reverse, 0)`;
2. `hornerStepProgram.program.foldl`: the loop `c ↦ 2c + bit b` over the reversed bits, with
   `hornerStepProgram : PolyProgram (Bool × ℕ) ℕ hornerStep` built from `natAdd` and `natSucc`.

Correctness (`decodeProgram_run`) holds for every `List Bool`: empty names, trailing `false` bits
(leading zeros of the number), and any other noncanonical name.

Cost (`decodeProgram_time`) is stated through the measure

  `Y bs = (treeEncode bs).size + 2 * decodeName bs + 6`,

which equals input tree size + unary output size (`2v + 1`) + 5. Five measures stay separate:
the name length `bs.length` (at most the input tree size minus one), the input tree size, the
value `decodeName bs`, the unary output size `2 * decodeName bs + 1`, and the time
`decodeProgram.time bs`. The bound is the explicit polynomial

  `decodePrep.coefficient * Y ^ decodePrep.degree
     + Y * (10 * Y + hornerStepProgram.coefficient * Y ^ hornerStepProgram.degree + 1) + Y + 2`.

`decodeProgram_rbeval` restates run and cost as `RBEval`, the form `sat_code_rate` consumes.
-/

namespace OAI.Bridges.ETH

open OAI.ParityWL.Complexity

/-! ### Horner's rule for `decodeName` -/

/-- One Horner step: shift in a bit as the new least significant digit. -/
def hornerStep (x : Bool × ℕ) : ℕ := if x.1 then (x.2 + x.2) + 1 else x.2 + x.2

theorem decodeName_nil : decodeName [] = 0 := rfl

theorem decodeName_cons (b : Bool) (bs : List Bool) :
    decodeName (b :: bs) = (if b then 1 else 0) + 2 * decodeName bs := by
  cases b <;> simp [decodeName, Nat.ofDigits_cons]

/-- `decodeName` is Horner's rule over the reversed (most significant first) bits. -/
theorem decodeName_eq_horner (bs : List Bool) :
    decodeName bs = bs.reverse.foldl (fun c a => hornerStep (a, c)) 0 := by
  rw [List.foldl_reverse]
  induction bs with
  | nil => rfl
  | cons b bs ih =>
    rw [decodeName_cons, List.foldr_cons, ← ih]
    cases b <;> (simp [hornerStep]; omega)

theorem le_foldl_hornerStep (zs : List Bool) (c : ℕ) :
    c ≤ zs.foldl (fun c a => hornerStep (a, c)) c := by
  induction zs generalizing c with
  | nil => exact le_rfl
  | cons a zs ih =>
    rw [List.foldl_cons]
    refine le_trans ?_ (ih _)
    cases a <;> (simp only [hornerStep, Bool.false_eq_true, ↓reduceIte]; omega)

/-- Every intermediate Horner value is at most the final value. -/
theorem horner_prefix_le {ys zs bs : List Bool} (h : ys ++ zs = bs.reverse) :
    ys.foldl (fun c a => hornerStep (a, c)) 0 ≤ decodeName bs := by
  rw [decodeName_eq_horner, ← h, List.foldl_append]
  exact le_foldl_hornerStep _ _

/-! ### Edge cases of the bit order, checked by evaluation -/

example : decodeName [] = 0 := by decide
/-- Least significant bit first: `[false, true]` is `2`. -/
example : decodeName [false, true] = 2 := by decide
/-- A noncanonical name: trailing `false` bits are leading zeros and change nothing. -/
example : decodeName [true, false, false] = decodeName [true] := by decide
example : decodeName [false, false, false] = 0 := by decide

/-! ### The programs -/

def hornerStepProgram : PolyProgram (Bool × ℕ) ℕ hornerStep := by
  let dbl := ((PolyProgram.snd Bool ℕ).pair (PolyProgram.snd Bool ℕ)).comp PolyProgram.natAdd
  refine ((PolyProgram.fst Bool ℕ).ite (dbl.comp PolyProgram.natSucc) dbl).congr ?_
  intro x
  rfl

def decodePrep : PolyProgram (List Bool) (List Bool × ℕ) (fun bs => (bs.reverse, 0)) :=
  (PolyProgram.reverse Bool).pair (PolyProgram.const (0 : ℕ))

/-- The unrestricted composite, before its function is identified with `decodeName`. -/
def decodeCore : TreeProgram (List Bool) ℕ
    ((fun x : List Bool × ℕ => x.1.foldl (fun c a => hornerStep (a, c)) x.2) ∘
      (fun bs => (bs.reverse, 0))) :=
  decodePrep.program.comp hornerStepProgram.program.foldl

/-- **The decoder.** A `TreeProgram` computing `decodeName`. -/
def decodeProgram : TreeProgram (List Bool) ℕ decodeName where
  code := decodeCore.code
  time := decodeCore.time
  run := fun bs => by
    rw [decodeName_eq_horner]
    exact decodeCore.run bs

/-- **Functional correctness.** For every binary name, the decoder's code runs within
`decodeProgram.time bs` and outputs the unary tree of `decodeName bs`. -/
theorem decodeProgram_run (bs : List Bool) :
    BEval decodeProgram.code (treeEncode bs) (decodeProgram.time bs)
      (treeEncode (decodeName bs)) :=
  decodeProgram.run bs

/-! ### Cost -/

/-- The cost measure: input tree size plus unary output size plus five. -/
def decodeMeasure (bs : List Bool) : ℕ := (treeEncode bs).size + 2 * decodeName bs + 6

theorem treeEncode_nat_size (n : ℕ) : (treeEncode n).size = 2 * n + 1 := by
  simp only [treeEncode_nat, numTree_size]

theorem decodeMeasure_eq (bs : List Bool) :
    decodeMeasure bs = (treeEncode bs).size + (treeEncode (decodeName bs)).size + 5 := by
  rw [decodeMeasure, treeEncode_nat_size]
  omega

theorem bool_size_le (b : Bool) : (treeEncode b).size ≤ 3 := by
  cases b <;> simp [DataTree.size]

/-- **Explicit time bound.** With `Y = decodeMeasure bs`. -/
theorem decodeProgram_time (bs : List Bool) :
    decodeProgram.time bs ≤
      decodePrep.coefficient * decodeMeasure bs ^ decodePrep.degree +
        decodeMeasure bs * (10 * decodeMeasure bs +
          hornerStepProgram.coefficient * decodeMeasure bs ^ hornerStepProgram.degree + 1) +
        decodeMeasure bs + 2 := by
  set Y := decodeMeasure bs with hY
  set V := decodeName bs
  set sb := (treeEncode bs).size
  have hYdef : Y = sb + 2 * V + 6 := rfl
  have hrev : (treeEncode bs.reverse).size = sb := treeEncode_size_perm (List.reverse_perm bs)
  have hlen : bs.reverse.length + 1 ≤ sb := by
    have := treeEncode_list_length bs.reverse
    omega
  -- the preparation stage
  have hprep : decodePrep.program.time bs ≤ decodePrep.coefficient * Y ^ decodePrep.degree :=
    (decodePrep.bound bs).trans
      (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left (by omega) _))
  -- the loop
  have hwork : hornerStepProgram.program.foldWork bs.reverse 0 ≤
      Y * (10 * Y + hornerStepProgram.coefficient * Y ^ hornerStepProgram.degree + 1) := by
    have h := TreeProgram.foldWork_prefix hornerStepProgram.program bs.reverse 0
      (sb + 2 * V + 3) (hornerStepProgram.coefficient * Y ^ hornerStepProgram.degree)
      (by
        intro ys zs hyz
        have hv := horner_prefix_le hyz
        have hz : (treeEncode zs).size ≤ sb := by
          rw [← hrev, ← hyz]
          exact treeEncode_list_size_mono (List.sublist_append_right ys zs)
        simp only [treeEncode_prod, DataTree.size, treeEncode_nat_size]
        omega)
      (by
        intro ys a zs hyz
        have hv := horner_prefix_le hyz
        have ha := bool_size_le a
        refine (hornerStepProgram.bound _).trans
          (Nat.mul_le_mul_left _ (Nat.pow_le_pow_left ?_ _))
        simp only [treeEncode_prod, DataTree.size, treeEncode_nat_size]
        omega)
    refine h.trans ?_
    have h1 : bs.reverse.length + 1 ≤ Y := by omega
    have h2 : 10 * (sb + 2 * V + 3 + 1) ≤ 10 * Y := by omega
    calc
      _ ≤ Y * (10 * (sb + 2 * V + 3 + 1) +
            hornerStepProgram.coefficient * Y ^ hornerStepProgram.degree + 1) :=
        Nat.mul_le_mul_right _ h1
      _ ≤ _ := Nat.mul_le_mul_left _ (by omega)
  -- the final state `([], V)`
  have hfinal : (treeEncode (([] : List Bool),
      bs.reverse.foldl (fun c a => hornerStep (a, c)) 0)).size ≤ Y := by
    rw [← decodeName_eq_horner]
    simp only [treeEncode_prod, treeEncode_nil, DataTree.size, treeEncode_nat_size]
    omega
  show decodePrep.program.time bs +
      (hornerStepProgram.program.foldWork bs.reverse 0 +
        (treeEncode (([] : List Bool),
          bs.reverse.foldl (fun c a => hornerStep (a, c)) 0)).size + 1) + 1 ≤ _
  omega

/-- **`RBEval` form**, as consumed by `sat_code_rate` and `RBEval.seq`. -/
theorem decodeProgram_rbeval (bs : List Bool) :
    RBEval decodeProgram.code (treeEncode bs)
      ((decodePrep.coefficient * decodeMeasure bs ^ decodePrep.degree +
        decodeMeasure bs * (10 * decodeMeasure bs +
          hornerStepProgram.coefficient * decodeMeasure bs ^ hornerStepProgram.degree + 1) +
        decodeMeasure bs + 2 : ℕ) : ℝ)
      (treeEncode (decodeName bs)) :=
  (decodeProgram_run bs).real.mono (by exact_mod_cast decodeProgram_time bs)

/-- **Standalone decoder theorem.** On the binary name of any `n`, the decoder outputs `n` within
the explicit bound. This is the case the bridge uses: ParityLifts writes a variable `v` as
`v.bits`. -/
theorem decodeProgram_bits (n : ℕ) :
    BEval decodeProgram.code (treeEncode n.bits) (decodeProgram.time n.bits) (treeEncode n) ∧
      decodeProgram.time n.bits ≤
        decodePrep.coefficient * decodeMeasure n.bits ^ decodePrep.degree +
          decodeMeasure n.bits * (10 * decodeMeasure n.bits +
            hornerStepProgram.coefficient * decodeMeasure n.bits ^ hornerStepProgram.degree + 1) +
          decodeMeasure n.bits + 2 := by
  refine ⟨?_, decodeProgram_time n.bits⟩
  simpa using decodeProgram_run n.bits

end OAI.Bridges.ETH

#print axioms OAI.Bridges.ETH.decodeName_nil
#print axioms OAI.Bridges.ETH.decodeName_cons
#print axioms OAI.Bridges.ETH.decodeName_eq_horner
#print axioms OAI.Bridges.ETH.le_foldl_hornerStep
#print axioms OAI.Bridges.ETH.horner_prefix_le
#print axioms OAI.Bridges.ETH.hornerStepProgram
#print axioms OAI.Bridges.ETH.decodePrep
#print axioms OAI.Bridges.ETH.decodeCore
#print axioms OAI.Bridges.ETH.decodeProgram
#print axioms OAI.Bridges.ETH.decodeProgram_run
#print axioms OAI.Bridges.ETH.treeEncode_nat_size
#print axioms OAI.Bridges.ETH.decodeMeasure_eq
#print axioms OAI.Bridges.ETH.bool_size_le
#print axioms OAI.Bridges.ETH.decodeProgram_time
#print axioms OAI.Bridges.ETH.decodeProgram_rbeval
#print axioms OAI.Bridges.ETH.decodeProgram_bits
