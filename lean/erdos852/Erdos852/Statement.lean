/-
  Erdos852/Statement.lean — a formalised STATEMENT of Erdős problem #852.

  The problem page at erdosproblems.com/852 carries the field
  "Formalised statement? No (create one)". This file is that: the problem as
  published, written in Lean 4 + Mathlib, with nothing proved about it beyond
  what is cheap and honest.

  As published, #852 reads:

    Let dₙ = pₙ₊₁ − pₙ, where pₙ is the nth prime. Let h(x) be maximal such
    that for some n < x the numbers dₙ, dₙ₊₁, …, dₙ₊ₕ₍ₓ₎₋₁ are all distinct.
    Estimate h(x). In particular, is it true that h(x) > (log x)^c for some
    constant c > 0, and h(x) = o(log x)?

  TWO THINGS THIS FILE IS CAREFUL ABOUT.

  1. The bound is on `n`, and `n` INDEXES a prime. So `x` counts primes; it
     does not measure size. That reading is what the statement says, and it is
     the one formalised here. It matters: the companion report
     reports/erdos852-h.html shows the two readings give visibly different
     answers against the same exact data.

  2. `h` is a supremum, and `Nat.sSup` of an UNBOUNDED set is junk (`0`). That
     the set is bounded is not free — a run stops only when some gap value
     repeats, and "some gap value recurs infinitely often" is itself a
     consequence of bounded-gaps results, not an triviality. So this file does
     not quietly assume it: `DistinctRunSetBddAbove` is stated as the
     side-condition it is, and every claim that needs it takes it as a
     hypothesis. A formalisation that hid this would be stating a different,
     easier problem.

  Nothing here is a proof of anything Erdős asked. It is the statement, so
  that someone can attach a proof to it.
-/
import Mathlib.Data.Nat.Nth
import Mathlib.Data.Nat.Prime.Basic
import Mathlib.Analysis.SpecialFunctions.Log.Basic
import Mathlib.Analysis.SpecialFunctions.Pow.Real
import Mathlib.Order.Filter.AtTopBot.Basic
import Mathlib.Analysis.Asymptotics.Defs

namespace Erdos852

open Filter

/-- `p n` is the `n`th prime, indexed from `0`: `p 0 = 2`. -/
noncomputable def p (n : ℕ) : ℕ := Nat.nth Nat.Prime n

/-- `d n = pₙ₊₁ − pₙ`, the `n`th prime gap. -/
noncomputable def d (n : ℕ) : ℕ := p (n + 1) - p n

/-- `DistinctRun n k` : the `k` gaps `d n, d (n+1), …, d (n+k-1)` are pairwise
distinct. This is the predicate the problem's "are all distinct" names. -/
def DistinctRun (n k : ℕ) : Prop :=
  ∀ i j, i < k → j < k → i ≠ j → d (n + i) ≠ d (n + j)

/-- The set of run lengths available to `h x`: those `k` for which some
starting index `n < x` carries `k` pairwise-distinct gaps. -/
def runLengths (x : ℕ) : Set ℕ := {k | ∃ n < x, DistinctRun n k}

/-- `h x` — "maximal `k` such that for some `n < x` the gaps `d n … d (n+k-1)`
are all distinct". Read as a supremum over `runLengths x`.

CAVEAT, stated rather than hidden: `Nat.sSup` returns `0` on an unbounded set,
so this definition means what the problem means only when `runLengths x` is
bounded above — see `DistinctRunSetBddAbove`. -/
noncomputable def h (x : ℕ) : ℕ := sSup (runLengths x)

/-- The side-condition `h` needs in order to mean what the problem means: for
each `x`, only finitely many run lengths are achievable below `x`.

This is NOT free. A run at `n` terminates exactly when some gap value repeats
among `d n, d (n+1), …`; that every start eventually repeats a gap follows
from the existence of a gap value occurring infinitely often, which is a
bounded-gaps statement, not an observation. It is recorded here as a named
hypothesis so that anything depending on it says so. -/
def DistinctRunSetBddAbove : Prop := ∀ x : ℕ, BddAbove (runLengths x)

/-! ### The two questions Erdős asks -/

/-- **Erdős #852, question 1.** Is `h(x) > (log x)^c` for some `c > 0`?
Stated eventually-in-`x`, which is what "estimate h(x)" asks for. -/
def Question1 : Prop :=
  ∃ c : ℝ, 0 < c ∧ ∀ᶠ x : ℕ in atTop, ((Real.log x) ^ c) < (h x : ℝ)

/-- **Erdős #852, question 2.** Is `h(x) = o(log x)`? -/
def Question2 : Prop :=
  Asymptotics.IsLittleO atTop (fun x : ℕ => (h x : ℝ)) (fun x : ℕ => Real.log x)

/-- The conjecture stated in the problem's discussion thread — `h(x) ∼ c₀ log x`
for the constant `c₀` this repository certified to 61 decimal digits. It is
recorded here because it is *incompatible* with `Question2`: a positive
asymptotic constant is not `o(log x)`. -/
def ThreadConjecture (c₀ : ℝ) : Prop :=
  0 < c₀ ∧ Tendsto (fun x : ℕ => (h x : ℝ) / Real.log x) atTop (nhds c₀)

/-! ### Cheap sanity lemmas

Enough to show the definitions are not vacuous, and no more. Nothing below
touches either question. -/

/-- A run of length `0` is vacuously distinct. -/
theorem distinctRun_zero (n : ℕ) : DistinctRun n 0 := by
  intro i j hi _ _
  exact absurd hi (Nat.not_lt_zero i)

/-- A run of length `1` is distinct: there is no second index to collide with. -/
theorem distinctRun_one (n : ℕ) : DistinctRun n 1 := by
  intro i j hi hj hij
  exact absurd (by omega : i = j) hij

/-- So for any `x > 0`, both `0` and `1` are achievable run lengths. -/
theorem one_mem_runLengths {x : ℕ} (hx : 0 < x) : 1 ∈ runLengths x :=
  ⟨0, hx, distinctRun_one 0⟩

/-- `runLengths` is downward closed: a prefix of a pairwise-distinct run is
pairwise distinct. -/
theorem distinctRun_mono {n k k' : ℕ} (hk : k' ≤ k) (H : DistinctRun n k) :
    DistinctRun n k' := by
  intro i j hi hj hij
  exact H i j (lt_of_lt_of_le hi hk) (lt_of_lt_of_le hj hk) hij

/-- Under the boundedness side-condition, `h x ≥ 1` for `x > 0`. -/
theorem one_le_h (H : DistinctRunSetBddAbove) {x : ℕ} (hx : 0 < x) : 1 ≤ h x :=
  le_csSup (H x) (one_mem_runLengths hx)

end Erdos852
