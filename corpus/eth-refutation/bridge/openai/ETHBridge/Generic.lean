import Mathlib

/-!
# The Exponential Time Hypothesis, stated once over an abstract model of computation

cert-machine, `corpus/eth-refutation/bridge`. This file is byte-identical in the two Lake projects
(`openai/` and `anthropic/`); `tools/eth-bridge-gates.js` refuses a build in which the two copies
differ. Nothing in it is taken from either claimant's proof.

Impagliazzo and Paturi, "Complexity of k-SAT", CCC 1999, p. 1: "Define s_k (for k ≥ 3) to be the
infimum of {δ : there exists an O(2^{δn}) algorithm for solving k-SAT}. Define ETH […] as follows:
for k ≥ 3, s_k > 0." The source names no model of computation. A `Model` supplies one:

* what a machine is, and which machines count (`Admissible`: for instance, every alphabet finite);
* what a formula on the variables x₀ … x_{n−1} is, when it is an instance of k-SAT (`IsKCNF`) and
  when it is satisfiable;
* the word of bits a machine is started on for k-SAT (`encode`);
* what it means for a machine started on a word to halt within t steps with a one-bit answer
  (`OutputsInTime`).

The four definitions below then read the same in every model. Their shape is the shape of
Anthropic's `eth/MainResults.lean` (`DecidesKSat`, `InTime`, `s`, `ETH`), so that the two
instantiations can be read side by side; `ETH` here is the textbook statement, for every k ≥ 3.

The second half of the file states the counting hypothesis #ETH the same way, over a
`CountModel`: `numSat`, `CountsKSat`, `CountInTime`, `sharpS`, `SharpETH`, each the mirror of the
ETH definition of the same shape.
-/

namespace ETHBridge

open scoped NNReal ENNReal

universe u

/-- A model of computation for k-SAT: machines, formulas, their encoding as input words, and the
meaning of "halts within t steps with answer b". -/
structure Model where
  /-- The machines. -/
  Machine : Type u
  /-- The formulas on the variables x₀ … x_{n−1}. -/
  CNF : ℕ → Type
  /-- `IsKCNF k n φ`: φ is an instance of k-SAT (each clause has at most k literals). -/
  IsKCNF : ℕ → (n : ℕ) → CNF n → Prop
  /-- `Satisfiable n φ`: some assignment of x₀ … x_{n−1} makes every clause of φ true. -/
  Satisfiable : (n : ℕ) → CNF n → Prop
  /-- `encode k n φ`: the input word of φ for k-SAT. -/
  encode : ℕ → (n : ℕ) → CNF n → List Bool
  /-- The machines the hypothesis speaks of. -/
  Admissible : Machine → Prop
  /-- `OutputsInTime M w b t`: M, started on the word w, halts within t steps with answer b. -/
  OutputsInTime : Machine → List Bool → Bool → ℕ → Prop

variable (Mo : Model.{u})

/-- `M` decides k-SAT within t(n) steps: on every k-SAT instance φ on n variables it halts within
t(n) steps with one bit, which is true if and only if φ is satisfiable. -/
def DecidesKSat (k : ℕ) (M : Mo.Machine) (t : ℕ → ℕ) : Prop :=
  ∀ (n : ℕ) (φ : Mo.CNF n), Mo.IsKCNF k n φ → ∃ b : Bool, (b = true ↔ Mo.Satisfiable n φ) ∧
    Mo.OutputsInTime M (Mo.encode k n φ) b (t n)

/-- "k-SAT has an O(2^{δn}) algorithm": one admissible machine and one constant c ∈ ℕ such that the
machine decides k-SAT within ⌊c·2^{δn}⌋ steps for every n. -/
def InTime (k : ℕ) (δ : ℝ≥0) : Prop :=
  ∃ (M : Mo.Machine) (c : ℕ), Mo.Admissible M ∧
    DecidesKSat Mo k M fun n => ⌊(c : ℝ) * (2 : ℝ) ^ ((δ : ℝ) * n)⌋₊

/-- s_k, the infimum of all δ ≥ 0 such that k-SAT has an O(2^{δn}) algorithm; ∞ if there is none. -/
noncomputable def s (k : ℕ) : ℝ≥0∞ := ⨅ (δ : ℝ≥0) (_ : InTime Mo k δ), (δ : ℝ≥0∞)

/-- **The Exponential Time Hypothesis** (Impagliazzo–Paturi): for every k ≥ 3, s_k > 0. -/
def ETH : Prop := ∀ k : ℕ, 3 ≤ k → 0 < s Mo k

/-- If k-SAT has an O(2^{δn}) algorithm for every δ > 0, then s_k = 0. -/
theorem s_eq_zero_of_forall_inTime (k : ℕ) (h : ∀ δ : ℝ≥0, 0 < δ → InTime Mo k δ) :
    s Mo k = 0 := by
  refine nonpos_iff_eq_zero.mp ?_
  refine ENNReal.le_of_forall_pos_le_add fun ε hε _ => ?_
  rw [zero_add]
  unfold s
  exact iInf₂_le (f := fun (δ : ℝ≥0) (_ : InTime Mo k δ) => (δ : ℝ≥0∞)) ε (h ε hε)

/-- ETH fails exactly when s_k = 0 for some k ≥ 3. -/
theorem not_eth_iff : ¬ ETH Mo ↔ ∃ k : ℕ, 3 ≤ k ∧ s Mo k = 0 := by
  unfold ETH
  constructor
  · intro h
    by_contra hne
    apply h
    intro k hk
    exact pos_iff_ne_zero.mpr fun h0 => hne ⟨k, hk, h0⟩
  · rintro ⟨k, hk, h0⟩ hE
    exact (hE k hk).ne' h0

/-- If, for one k ≥ 3, k-SAT has an O(2^{δn}) algorithm for every δ > 0, then ETH is false. -/
theorem not_eth_of_forall_inTime (k : ℕ) (hk : 3 ≤ k)
    (h : ∀ δ : ℝ≥0, 0 < δ → InTime Mo k δ) : ¬ ETH Mo :=
  (not_eth_iff Mo).mpr ⟨k, hk, s_eq_zero_of_forall_inTime Mo k h⟩

/-! ## The counting hypothesis #ETH

Dell, Husfeldt, Marx, Taslaman and Wahlén, "Exponential time complexity of the permanent and the
Tutte polynomial", ACM Transactions on Algorithms 10(4), 2014, art. 21: the counting analogue of
ETH, #ETH, says that counting the satisfying assignments of a 3-CNF on n variables (#3-SAT) takes
time 2^{cn} for some c > 0. It is set up here exactly as ETH above, with "decides" replaced by
"counts": s#_k is the infimum of the δ such that some admissible machine outputs the number of
satisfying assignments of every k-CNF on n variables within ⌊c·2^{δn}⌋ steps, and #ETH says s#_k > 0
for every k ≥ 3. A factor polynomial in n changes no infimum (it is at most c'·2^{εn} for every
ε > 0), so 2^{δn} and 2^{δn}·poly(n) give the same s#_k; and s#_3 = 0 refutes the k = 3 form too.

A `CountModel` supplies the model, field for field as a `Model` does, with two changes. In place of
"φ is satisfiable" it says which assignments satisfy φ (`Satisfies`), so that the number of
satisfying assignments (`numSat`) is defined once, here, and not by the model. In place of a
one-bit answer it says what it means for a machine to halt within t steps with a number written on
its output (`OutputsCountInTime`), in the model's own convention. Its machines, instances and input
words are the model's own, so they may differ from those of the same claimant's `Model` for ETH;
each instantiation says how, and why.
-/

/-- A model of computation for #k-SAT, field for field as a `Model`: machines, formulas, which
assignments satisfy a formula, the input word, and the meaning of "halts within t steps with the
number c written on its output". -/
structure CountModel where
  /-- The machines. -/
  Machine : Type u
  /-- The formulas on the variables x₀ … x_{n−1}. -/
  CNF : ℕ → Type
  /-- `IsKCNF k n φ`: φ is an instance of #k-SAT (each clause has at most k literals). -/
  IsKCNF : ℕ → (n : ℕ) → CNF n → Prop
  /-- `Satisfies n φ a`: the assignment a of x₀ … x_{n−1} makes every clause of φ true. -/
  Satisfies : (n : ℕ) → CNF n → (Fin n → Bool) → Prop
  /-- `encode k n φ`: the input word of φ for #k-SAT. -/
  encode : ℕ → (n : ℕ) → CNF n → List Bool
  /-- The machines the hypothesis speaks of. -/
  Admissible : Machine → Prop
  /-- `OutputsCountInTime M n w c t`: M, started on the word w of a formula on n variables, halts
  within t steps with the number c written on its output. -/
  OutputsCountInTime : Machine → ℕ → List Bool → ℕ → ℕ → Prop

variable (Co : CountModel.{u})

/-- The number of satisfying assignments of φ: of the 2ⁿ assignments of x₀ … x_{n−1}, the number
that make every clause of φ true. -/
noncomputable def numSat (n : ℕ) (φ : Co.CNF n) : ℕ :=
  Nat.card {a : Fin n → Bool // Co.Satisfies n φ a}

/-- `M` counts #k-SAT within t(n) steps: on every #k-SAT instance φ on n variables it halts within
t(n) steps with the number of satisfying assignments of φ written on its output. -/
def CountsKSat (k : ℕ) (M : Co.Machine) (t : ℕ → ℕ) : Prop :=
  ∀ (n : ℕ) (φ : Co.CNF n), Co.IsKCNF k n φ →
    Co.OutputsCountInTime M n (Co.encode k n φ) (numSat Co n φ) (t n)

/-- "#k-SAT has an O(2^{δn}) algorithm": one admissible machine and one constant c ∈ ℕ such that
the machine counts #k-SAT within ⌊c·2^{δn}⌋ steps for every n. -/
def CountInTime (k : ℕ) (δ : ℝ≥0) : Prop :=
  ∃ (M : Co.Machine) (c : ℕ), Co.Admissible M ∧
    CountsKSat Co k M fun n => ⌊(c : ℝ) * (2 : ℝ) ^ ((δ : ℝ) * n)⌋₊

/-- s#_k, the infimum of all δ ≥ 0 such that #k-SAT has an O(2^{δn}) algorithm; ∞ if there is
none. -/
noncomputable def sharpS (k : ℕ) : ℝ≥0∞ := ⨅ (δ : ℝ≥0) (_ : CountInTime Co k δ), (δ : ℝ≥0∞)

/-- **The counting Exponential Time Hypothesis #ETH** (Dell–Husfeldt–Marx–Taslaman–Wahlén): for
every k ≥ 3, s#_k > 0. -/
def SharpETH : Prop := ∀ k : ℕ, 3 ≤ k → 0 < sharpS Co k

/-- If #k-SAT has an O(2^{δn}) algorithm for every δ > 0, then s#_k = 0. -/
theorem sharpS_eq_zero_of_forall_countInTime (k : ℕ)
    (h : ∀ δ : ℝ≥0, 0 < δ → CountInTime Co k δ) : sharpS Co k = 0 := by
  refine nonpos_iff_eq_zero.mp ?_
  refine ENNReal.le_of_forall_pos_le_add fun ε hε _ => ?_
  rw [zero_add]
  unfold sharpS
  exact iInf₂_le (f := fun (δ : ℝ≥0) (_ : CountInTime Co k δ) => (δ : ℝ≥0∞)) ε (h ε hε)

/-- #ETH fails exactly when s#_k = 0 for some k ≥ 3. -/
theorem not_sharpEth_iff : ¬ SharpETH Co ↔ ∃ k : ℕ, 3 ≤ k ∧ sharpS Co k = 0 := by
  unfold SharpETH
  constructor
  · intro h
    by_contra hne
    apply h
    intro k hk
    exact pos_iff_ne_zero.mpr fun h0 => hne ⟨k, hk, h0⟩
  · rintro ⟨k, hk, h0⟩ hE
    exact (hE k hk).ne' h0

/-- If, for one k ≥ 3, #k-SAT has an O(2^{δn}) algorithm for every δ > 0, then #ETH is false. -/
theorem not_sharpEth_of_forall_countInTime (k : ℕ) (hk : 3 ≤ k)
    (h : ∀ δ : ℝ≥0, 0 < δ → CountInTime Co k δ) : ¬ SharpETH Co :=
  (not_sharpEth_iff Co).mpr ⟨k, hk, sharpS_eq_zero_of_forall_countInTime Co k h⟩

end ETHBridge
