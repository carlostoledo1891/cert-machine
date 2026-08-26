/-
  Erdos852/Basic.lean — a kernel-evaluable primality certifier, with its
  correctness THEOREM against Mathlib's `Nat.Prime`.

  Why not Mathlib's own decidability instance: it is documented as usable
  only for small numbers, and `norm_num` does one literal at a time — this
  project must certify a list of 33,860 primes in one kernel evaluation.
  So: a ten-line trial division the kernel can run fast, plus a proof —
  checked by the same kernel — that `isPrime n = true` really implies
  `Nat.Prime n`. `false` certifies nothing (the refusal direction is free:
  a missing or rejected prime only WEAKENS the partial product below).
-/
import Mathlib.Data.Nat.Prime.Defs
import Mathlib.Data.Nat.Sqrt

namespace Erdos852

/-- `noDivisorIn n d fuel = true` certifies: no `m` with `d ≤ m` and
`m * m ≤ n` divides `n`. Fuel-bounded structural recursion so the kernel
can evaluate it; exhausted fuel returns `false` — a refusal, never a lie. -/
def noDivisorIn (n d : Nat) : Nat → Bool
  | 0 => false
  | fuel + 1 =>
    if n < d * d then true
    else if n % d == 0 then false
    else noDivisorIn n (d + 1) fuel

/-- `isPrime n = true` certifies `Nat.Prime n` (theorem below). -/
def isPrime (n : Nat) : Bool :=
  decide (2 ≤ n) && noDivisorIn n 2 n

theorem noDivisorIn_sound :
    ∀ (fuel n d : Nat), noDivisorIn n d fuel = true →
      ∀ m, d ≤ m → m * m ≤ n → ¬ m ∣ n := by
  intro fuel
  induction fuel with
  | zero => intro n d h; simp [noDivisorIn] at h
  | succ fuel ih =>
    intro n d h m hdm hmn hdvd
    unfold noDivisorIn at h
    split at h
    · -- n < d * d, yet d ≤ m and m * m ≤ n: impossible
      rename_i hlt
      have : d * d ≤ m * m := Nat.mul_le_mul hdm hdm
      omega
    · rename_i hge
      split at h
      · exact absurd h (by simp)
      · rename_i hmod
        rcases Nat.eq_or_lt_of_le hdm with heq | hlt
        · -- m = d divides n, but n % d ≠ 0
          subst heq
          simp [Nat.mod_eq_zero_of_dvd hdvd] at hmod
        · exact ih n (d + 1) h m hlt hmn hdvd

/-- The certifier is sound: a `true` from `isPrime` is a prime, by
Mathlib's definition. (The converse is not needed and not claimed.) -/
theorem isPrime_correct {n : Nat} (h : isPrime n = true) : Nat.Prime n := by
  unfold isPrime at h
  rw [Bool.and_eq_true] at h
  obtain ⟨h2, hnd⟩ := h
  have h2' : 2 ≤ n := of_decide_eq_true h2
  refine Nat.prime_def_le_sqrt.mpr ⟨h2', fun m hm hms => ?_⟩
  exact noDivisorIn_sound n n 2 hnd m hm (Nat.le_sqrt.mp hms)

/-- `ascending l = true` certifies the list is strictly increasing —
adjacent pairs only, so the kernel checks it in one linear pass. -/
def ascending : List Nat → Bool
  | a :: b :: t => decide (a < b) && ascending (b :: t)
  | _ => true

/-- Soundness: the adjacent-pair check implies full pairwise `<` — in
particular the list has no repeated element. -/
theorem ascending_sound : ∀ (l : List Nat), ascending l = true →
    List.Pairwise (· < ·) l := by
  intro l
  induction l with
  | nil => intro _; exact List.Pairwise.nil
  | cons a t ih =>
    cases t with
    | nil => intro _; simp
    | cons b t2 =>
      intro h
      unfold ascending at h
      rw [Bool.and_eq_true] at h
      obtain ⟨hab, ht⟩ := h
      have hp := ih ht
      refine List.Pairwise.cons (fun x hx => ?_) hp
      rcases List.mem_cons.mp hx with rfl | hx2
      · exact of_decide_eq_true hab
      · exact Nat.lt_trans (of_decide_eq_true hab) (List.rel_of_pairwise_cons hp hx2)

end Erdos852
