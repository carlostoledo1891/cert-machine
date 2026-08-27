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
import Mathlib.Algebra.BigOperators.Group.List.Basic

namespace Erdos852

/-- `noDivisorIn n d fuel = true` certifies: no `m` with `d ≤ m` and
`m * m ≤ n` divides `n`. Fuel-bounded structural recursion so the kernel
can evaluate it; exhausted fuel returns `false` — a refusal, never a lie.

Written in Bool primitives (`Nat.blt`, `Nat.beq`, `||`, `&&`) on purpose:
the kernel accelerates literal Nat arithmetic and reduces Bool
connectives by cases, whereas an `if`-chain drags `Decidable` instance
terms through every one of the ~15 million evaluation steps of the full
prime list — measured as an hours-long type_checker cache blowup before
this rewrite. -/
def noDivisorIn (n d : Nat) : Nat → Bool
  | 0 => false
  | fuel + 1 =>
    Nat.blt n (d * d) || (!(n % d == 0) && noDivisorIn n (d + 1) fuel)

/-- `isPrime n = true` certifies `Nat.Prime n` (theorem below). -/
def isPrime (n : Nat) : Bool :=
  Nat.ble 2 n && noDivisorIn n 2 n

theorem noDivisorIn_sound :
    ∀ (fuel n d : Nat), noDivisorIn n d fuel = true →
      ∀ m, d ≤ m → m * m ≤ n → ¬ m ∣ n := by
  intro fuel
  induction fuel with
  | zero => intro n d h; simp [noDivisorIn] at h
  | succ fuel ih =>
    intro n d h m hdm hmn hdvd
    unfold noDivisorIn at h
    rw [Bool.or_eq_true, Bool.and_eq_true] at h
    rcases h with hlt | ⟨hmod, hrec⟩
    · -- n < d * d, yet d ≤ m and m * m ≤ n: impossible
      have hlt' : n < d * d := by simpa [Nat.blt_eq] using hlt
      have : d * d ≤ m * m := Nat.mul_le_mul hdm hdm
      omega
    · rcases Nat.eq_or_lt_of_le hdm with heq | hlt
      · -- m = d divides n, but n % d ≠ 0
        subst heq
        simp [Nat.mod_eq_zero_of_dvd hdvd] at hmod
      · exact ih n (d + 1) hrec m hlt hmn hdvd

/-- The certifier is sound: a `true` from `isPrime` is a prime, by
Mathlib's definition. (The converse is not needed and not claimed.) -/
theorem isPrime_correct {n : Nat} (h : isPrime n = true) : Nat.Prime n := by
  unfold isPrime at h
  rw [Bool.and_eq_true] at h
  obtain ⟨h2, hnd⟩ := h
  have h2' : 2 ≤ n := Nat.le_of_ble_eq_true h2
  refine Nat.prime_def_le_sqrt.mpr ⟨h2', fun m hm hms => ?_⟩
  exact noDivisorIn_sound n n 2 hnd m hm (Nat.le_sqrt.mp hms)

/-- Combining chunk facts without ever materializing the flat list in a
proof term: `all` over a flattened list-of-chunks is `all` of per-chunk
`all`s. Generic, proved once by induction — the 240-chunk instance is then
a rewrite over chunk REFERENCES, never over 33,859 literals. -/
theorem all_flatten (p : Nat → Bool) :
    ∀ (L : List (List Nat)), L.flatten.all p = L.all (fun c => c.all p) := by
  intro L
  induction L with
  | nil => rfl
  | cons c t ih => simp [List.all_append, ih]

/-- Same architecture for products: the product of `f` over a flattened
list-of-chunks is the product of per-chunk products. This is what lets the
kernel evaluate the 33,859-factor product as a TREE of chunk subproducts —
the linear fold held every growing partial in its cache and thrashed. -/
theorem prod_map_flatten (f : Nat → Nat) :
    ∀ (L : List (List Nat)),
      (L.flatten.map f).prod = (L.map (fun c => (c.map f).prod)).prod := by
  intro L
  induction L with
  | nil => rfl
  | cons c t ih =>
    rw [List.flatten_cons, List.map_append, List.prod_append, List.map_cons,
        List.prod_cons, ih]

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
