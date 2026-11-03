import OAI.Combinatorics.ParityLifts.SATChoice
import MainResults

/-!
# RPI-378.3a, part 1: formulas and encoding lengths

Anthropic's `MainResults` and OpenAI's ParityLifts use the same literals (`Fin n × Bool`, true
meaning the positive literal) and the same satisfaction relation. They differ in how a clause is
typed and how a formula is written as bits:

* Anthropic: a clause is any `List (Lit n)`; an instance of 3-SAT also satisfies `IsKCNF 3`
  (clauses of length at most 3, and `Nodup`). The input word `encClauses 3 φ` is `1ⁿ0` followed by
  three fixed-width slots per clause.
* ParityLifts: a `Clause n` carries a proof that its length is at most 3; a `Formula n` is any
  list of clauses. The input word `encodeFormula F` writes `n`, the clause count, and each clause
  in self-delimiting binary.

This file defines the translation `toFormula`, proves that it preserves satisfiability on 3-CNFs,
and proves that both input words have length at most a fixed polynomial in `n` on Anthropic's
instances. The polynomial bound rests on `Nodup`: a 3-CNF on `n` variables has at most
`(2n+1)^3` clauses (`length_le_of_isKCNF`).

Everything here is unconditional and depends only on the two sets of definitions.
-/

namespace OAI.Bridges.AnthropicETH

open OAI.ParityWL.Complexity

/-! ## The translation -/

/-- An Anthropic clause as a ParityLifts clause: its first three literals. On a 3-CNF this keeps
the whole clause (`toClause_literals`). -/
def toClause {n : ℕ} (C : List (MainResults.Lit n)) : Clause n :=
  ⟨C.take 3, by simp⟩

/-- An Anthropic formula as a ParityLifts formula, clause by clause, in the same order. -/
def toFormula {n : ℕ} (φ : MainResults.CNF n) : Formula n :=
  φ.map toClause

theorem toClause_literals {n : ℕ} {C : List (MainResults.Lit n)} (h : C.length ≤ 3) :
    (toClause C).literals = C :=
  List.take_of_length_le h

@[simp] theorem toFormula_length {n : ℕ} (φ : MainResults.CNF n) :
    (toFormula φ).length = φ.length := by
  simp [toFormula]

/-- On a 3-CNF the translation preserves satisfiability. -/
theorem satisfiable_toFormula_iff {n : ℕ} {φ : MainResults.CNF n}
    (hφ : MainResults.IsKCNF 3 φ) :
    (toFormula φ).Satisfiable ↔ MainResults.Satisfiable φ := by
  unfold Formula.Satisfiable Formula.Satisfied Clause.Satisfied MainResults.Satisfiable
  constructor
  · rintro ⟨a, ha⟩
    refine ⟨a, fun C hC => ?_⟩
    have := ha (toClause C) (List.mem_map.2 ⟨C, hC, rfl⟩)
    rwa [toClause_literals (hφ.1 C hC)] at this
  · rintro ⟨a, ha⟩
    refine ⟨a, fun D hD => ?_⟩
    obtain ⟨C, hC, rfl⟩ := List.mem_map.1 hD
    rw [toClause_literals (hφ.1 C hC)]
    exact ha C hC

/-! ## The number of clauses -/

/-- The first three positions of a list, as a function. -/
def firstThree {α : Type} (C : List α) : Fin 3 → Option α := fun j => C[j.val]?

theorem firstThree_injOn {α : Type} :
    Set.InjOn (firstThree (α := α)) {C | C.length ≤ 3} := by
  intro C hC D hD h
  apply List.ext_getElem?
  intro i
  by_cases hi : i < 3
  · exact congrFun h ⟨i, hi⟩
  · rw [List.getElem?_eq_none (by simp at hC; omega), List.getElem?_eq_none (by simp at hD; omega)]

/-- A 3-CNF on `n` variables (no clause written twice) has at most `(2n+1)^3` clauses. -/
theorem length_le_of_isKCNF {n : ℕ} {φ : MainResults.CNF n} (hφ : MainResults.IsKCNF 3 φ) :
    φ.length ≤ (2 * n + 1) ^ 3 := by
  classical
  rw [← List.toFinset_card_of_nodup hφ.2]
  have hcard := Finset.card_le_card_of_injOn (s := φ.toFinset)
    (t := (Finset.univ : Finset (Fin 3 → Option (MainResults.Lit n)))) firstThree
    (fun _ _ => Finset.mem_coe.2 (Finset.mem_univ _))
    (firstThree_injOn.mono fun C hC => hφ.1 C (List.mem_toFinset.1 hC))
  refine hcard.trans (le_of_eq ?_)
  simp [Fintype.card_option, Fintype.card_prod]
  ring

/-! ## Anthropic's input word -/

theorem encClauses_length {n : ℕ} (φ : MainResults.CNF n) :
    (MainResults.encClauses 3 φ).length = n + 1 + φ.length * (3 * (Nat.log2 (2 * n) + 1)) := by
  simp [MainResults.encClauses, List.length_flatMap]
  ring

/-- Anthropic's input word for a 3-CNF on `n` variables has length at most `4 (2n+1)^4`. -/
theorem encClauses_length_le {n : ℕ} {φ : MainResults.CNF n} (hφ : MainResults.IsKCNF 3 φ) :
    (MainResults.encClauses 3 φ).length ≤ 4 * (2 * n + 1) ^ 4 := by
  rw [encClauses_length]
  have hm := length_le_of_isKCNF hφ
  have hw : Nat.log2 (2 * n) + 1 ≤ 2 * n + 1 := by have := Nat.log2_le_self (2 * n); omega
  set X := 2 * n + 1
  have hX : 1 ≤ X := by omega
  calc n + 1 + φ.length * (3 * (Nat.log2 (2 * n) + 1))
      ≤ X + X ^ 3 * (3 * X) := by gcongr; omega
    _ ≤ X ^ 4 + 3 * X ^ 4 := by
        have : X ≤ X ^ 4 := Nat.le_self_pow (by norm_num) X
        nlinarith [this]
    _ = 4 * X ^ 4 := by ring

/-! ## ParityLifts' input word -/

theorem length_flatMap_le {α β : Type} (l : List α) (f : α → List β) (B : ℕ)
    (h : ∀ a ∈ l, (f a).length ≤ B) : (l.flatMap f).length ≤ l.length * B := by
  induction l with
  | nil => simp
  | cons a l ih =>
    simp only [List.flatMap_cons, List.length_append, List.length_cons]
    have h1 := h a List.mem_cons_self
    have h2 := ih fun b hb => h b (List.mem_cons_of_mem a hb)
    nlinarith

theorem encodeNat_length_le (k : ℕ) : (encodeNat k).length ≤ 2 * k + 1 := by
  have hs : k.bits.length ≤ k := by
    rw [Nat.size_eq_bits_len]
    exact Nat.size_le.2 Nat.lt_two_pow_self
  simp [encodeNat]
  omega

theorem encodeClause_toClause_length_le {n : ℕ} (C : List (MainResults.Lit n)) :
    (encodeClause (toClause C)).length ≤ 13 * (2 * n + 1) := by
  unfold encodeClause
  have hw : (toClause C).literals.length ≤ 3 := (toClause C).width
  have h1 := encodeNat_length_le (toClause C).literals.length
  have h2 := length_flatMap_le (toClause C).literals
    (fun l => encodeNat l.1.val ++ [l.2]) (2 * n + 2) (fun l _ => by
      have := encodeNat_length_le l.1.val
      have := l.1.isLt
      simp; omega)
  rw [List.length_append]
  nlinarith

/-- ParityLifts' input word for the translation of a 3-CNF on `n` variables has length at most
`20 (2n+1)^4`. -/
theorem encodeFormula_toFormula_length_le {n : ℕ} {φ : MainResults.CNF n}
    (hφ : MainResults.IsKCNF 3 φ) :
    (encodeFormula (toFormula φ)).length ≤ 20 * (2 * n + 1) ^ 4 := by
  have hm := length_le_of_isKCNF hφ
  have h1 := encodeNat_length_le n
  have h2 := encodeNat_length_le (toFormula φ).length
  have h3 := length_flatMap_le (toFormula φ) encodeClause (13 * (2 * n + 1)) (fun D hD => by
    obtain ⟨C, -, rfl⟩ := List.mem_map.1 hD
    exact encodeClause_toClause_length_le C)
  simp only [toFormula_length] at h2 h3
  unfold encodeFormula
  simp only [List.length_append, toFormula_length]
  set X := 2 * n + 1
  set m := φ.length
  have hX : 1 ≤ X := by omega
  have hX3 : X ^ 3 ≤ X ^ 4 := Nat.pow_le_pow_right hX (by norm_num)
  have hX1 : X ≤ X ^ 4 := Nat.le_self_pow (by norm_num) X
  have hmX : m * (13 * X) ≤ 13 * X ^ 4 := by
    calc m * (13 * X) ≤ X ^ 3 * (13 * X) := Nat.mul_le_mul_right _ hm
      _ = 13 * X ^ 4 := by ring
  omega

end OAI.Bridges.AnthropicETH
