# Row NC — what the theorem says in numbers

Read by the control room from the release's Lean files at 918c8e27 and from the paper's text (pdftotext -layout of
paper.pdf; line numbers are that text's). A reading, not a machine check: the facts below are lines anyone can open.

## The constant c

The statement only says "there is c > 0" (Statement.lean, `MainTheorem`, `MainTheoremApprox`). The proof supplies one
value, the same in both theorems:

- `Paper/Fields.lean`, line 87, in `thm_allfields`: `refine ⟨1 / 1600 ^ 2, by norm_num, fun p hp => ?_⟩`
- `Paper/Approximate.lean`, line 295, in `thm_approx`: `refine ⟨⟨1 / 1600 ^ 2, by norm_num, main⟩, fun F _ h => ?_⟩`

So c = 1/1600² = 1/2,560,000. The paper says the flat case gives the bound "with an explicit constant c" (lines
428–430) and does not print the value in that sentence; the value is the Lean's.

What that value means. The bound is m^(c·(log₂ m)^(1/3)) gates. It exceeds m² — a size any circuit that reads its m²
inputs already has — only when c·(log₂ m)^(1/3) > 2, that is when log₂ m > (2·1600²)³ = 134,217,728,000,000,000,000
≈ 1.3·10²⁰. Such an m has more than 10²⁰ binary digits; for every smaller m the bound as proved is below m². The
theorem is a statement
about growth: for each fixed k the bound eventually exceeds m^k (anchor A5 of row F3 proves this), and "eventually"
is far away.

## The threshold m₀

The statement says "for each characteristic p there is m₀". The proof gives no value:

- In Lean, m₀ is `M₁ + M₂ + 2` (`Paper/Fields.lean`, line 102; `Paper/Approximate.lean`, line 286), where M₁ and M₂
  are obtained from existence statements (`flat_rate_hc`, `thm_allfields_exceeds`, `thm_flat_rate`,
  `thm_contracting`, `approx_rate_closed`), each of which only says "there is such a number".
- The paper says so itself (lines 430–433): "In the contracting case the constants, among them m₀, depend on the
  integer μ, for which the proof gives no value, and this is why Theorem 1.1 comes with no value for m₀." And of the
  theorem the contracting case rests on (line 1789): "Theorem D.2 is not effective".

So the theorem does not say from which m the bound holds, in any characteristic. Nothing in the Lean or the paper
bounds m₀ from above.

## What this row does not do

It does not improve either number. A better c, or any value of m₀, would be new mathematics.
