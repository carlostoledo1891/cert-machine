# BilinearBombieriVinogradov — the Lean statement read against the source

Lean pin and shared definitions: `lean-common.reading.md`. Source reading: `BilinearBombieriVinogradov.source.md`
(commit `c777708`). A reading, not a decision.

## The Lean statement (lines 664-679), quoted

```lean
/-- **Bilinear Bombieri–Vinogradov, [1, Theorem 2.9], with unrestricted discrepancy.**
Both factor scales must be at least `x^ξ`, and at least one factor must have Siegel–Walfisz.
The bound is uniform over the coefficients and scales controlled by `K`. All positive moduli
up to the cutoff are included, with the maximum over primitive residue classes — a finite
supremum over `a < q` with `Coprime a q` — inside the sum. There is no squarefree filter and no
`CoprimeBelow` hypothesis. -/
def BilinearBombieriVinogradov : Prop :=
  ∀ K : ConstantBundle, ∀ ξ > (0 : ℝ), ∀ A > (0 : ℝ), ∃ B > (0 : ℝ), ∃ C : ℝ,
  ∀ x ≥ (3 : ℝ), ∀ α β : ℕ → ℂ, ∀ M ≥ (1 : ℝ), ∀ N ≥ (1 : ℝ),
  K.IsCoefficientSequence α → K.IsCoefficientSequence β →
  K.LocatedAtScale α M → K.LocatedAtScale β N → K.asympEq (M * N) x →
  x ^ ξ ≤ M → x ^ ξ ≤ N →
  (K.HasSiegelWalfisz α M ∨ K.HasSiegelWalfisz β N) →
  ∑ q ∈ Finset.Icc 1 ⌊x ^ (1 / 2 : ℝ) / (log x) ^ B⌋₊,
    (({a ∈ Finset.range q | Nat.Coprime a q}.sup
      fun a ↦ ‖sumError (dconv α β) q a‖₊ : NNReal) : ℝ) ≤ C * x / (log x) ^ A
```

Unfolds to `sumError`, `dconv` and the coefficient predicates (`lean-common.reading.md`).

## READING against [1] Theorem 2.9: MISMATCH

**Clause that differs: `x ^ ξ ≤ M`.** [1] Theorem 2.9 asks $N\ge x^\varepsilon$ of the Siegel-Walfisz factor only, with
$M\gg1$; the Lean also requires the other scale $M\ge x^\xi$. **Judgement: on this clause the Lean is weaker** — it says
nothing for $M=x^{o(1)}$ (e.g. $M=(\log x)^{10}$, $N=x/M$), which [1] covers. With both scales bounded below by the same
$x^\xi$, the disjunction "Siegel-Walfisz on $\alpha$ or on $\beta$" is only the symmetric closure of [1]'s "on $\beta$"
($\alpha\star\beta=\beta\star\alpha$), so it adds nothing beyond [1].

Clauses that match (as read): every $q\in[1,\lfloor x^{1/2}/(\log x)^B\rfloor]$, no squarefree filter; the supremum over
primitive classes inside the sum (`a < q`, `Coprime a q`; for $q=1$ the class $0$); the unrestricted discrepancy (1.1);
the quantifier order $\forall A\ \exists B\ \exists C$, with `B` and `C` allowed to depend on `K` and `ξ` (= [1]'s fixed
$\varepsilon$ and the fixed implied constants); $MN\sim x$ as `asympEq`; coefficient sequences located at the two scales.

Harmless differences (my reasoning): `x ≥ 3` instead of "$x$ large"; complex coefficients; `1 + log n` / `1 + log N` in
place of $\log x$ (equivalent because both scales are $\ge x^\xi$ — the very reason, as read, for the extra clause).
[1] does not prove Theorem 2.9 ("See [bfi, Theorem 0]"); the reading compares statements only.
