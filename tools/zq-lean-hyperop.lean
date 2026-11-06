/-
  zq-lean-hyperop.lean — cert-machine, Track A lane 4 on the claim "ℤ is Diophantine in ℚ" (Glazer et al.,
  2026-11-05): Mathlib's `hyperoperation 4 2` is the tower 2↑↑k of the manuscript (2↑↑1 = 2, 2↑↑(r+1) = 2^(2↑↑r)),
  so the frozen target's bounds `hyperoperation 4 2 7` and `hyperoperation 4 2 8` are 2↑↑7 and 2↑↑8 exactly.

  THE THEOREM IS UNDECIDED HERE. This file says what two numbers in the unproved target's statement are; it says
  nothing about whether the statement is true.

  tools/runpod-zq-lane4.sh puts this body (without its import line) into the frozen-target check, after
  `import Frozen.BoundedIntegerPolynomial`, so the `hyperoperation` below is the very constant the statement uses
  (the audit there lists the statement's constants with their modules).
-/
import Mathlib.Data.Nat.Hyperoperation

/-- 2↑↑k with 2↑↑0 = 1, so 2↑↑1 = 2 and 2↑↑(k+1) = 2^(2↑↑k): the manuscript's tower -/
def zqTower : Nat → Nat
  | 0 => 1
  | k + 1 => 2 ^ zqTower k

theorem zq_hyperoperation_four_two (k : Nat) : hyperoperation 4 2 k = zqTower k := by
  induction k with
  | zero => exact hyperoperation_ge_three_eq_one 1 2
  | succ k ih =>
    calc hyperoperation 4 2 (k + 1) = hyperoperation 3 2 (hyperoperation 4 2 k) := hyperoperation_recursion 3 2 k
      _ = 2 ^ hyperoperation 4 2 k := hyperoperation_three 2 _
      _ = zqTower (k + 1) := by rw [ih]; rfl

theorem zq_hyperoperation_seven : hyperoperation 4 2 7 = zqTower 7 := zq_hyperoperation_four_two 7
theorem zq_hyperoperation_eight : hyperoperation 4 2 8 = zqTower 8 := zq_hyperoperation_four_two 8
theorem zq_tower_one : zqTower 1 = 2 := by decide
theorem zq_tower_succ (k : Nat) : zqTower (k + 1) = 2 ^ zqTower k := rfl
theorem zq_hyperoperation_small :
    hyperoperation 4 2 1 = 2 ∧ hyperoperation 4 2 2 = 4 ∧ hyperoperation 4 2 3 = 16 ∧ hyperoperation 4 2 4 = 65536 := by
  simp only [zq_hyperoperation_four_two]; decide

-- Mathlib's `hyperoperation` is well-founded recursion, so `decide` cannot unfold it directly; the small values are
-- decided above through the kernel-checked tower theorem, and also evaluated here by the compiled definition:
#eval (hyperoperation 4 2 1, hyperoperation 4 2 2, hyperoperation 4 2 3, hyperoperation 4 2 4)

#print axioms zq_hyperoperation_four_two
#print axioms zq_hyperoperation_seven
#print axioms zq_hyperoperation_eight
#print axioms zq_hyperoperation_small
