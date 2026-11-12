# TypeIIPolymath — reading (Lean l.222–238 against `TypeIIPolymath.source.md`)

**READING: MISMATCH** against [2] Lemma 3, and a different statement from [1] Theorem 2.8(iv).
**Direction: incomparable.**

## The differing clause
`HasEquidistribution x (moduliIIa x ω N δ ε) (dconv α β) a A C` unfolds (l.149–150, l.142–144) to a sum of
`‖sumError (dconv α β) d a‖`, and `sumError` sums over **all n ∈ ℕ**. [2] Lemma 3 concludes Definition 7, which sums
over **n ∈ [x, 2x]**. The support does not make the range irrelevant, and neither statement implies the other by a
short argument. Argument and counterexample are in `conventions.reading.md` §D.

## Clause by clause against [2] Lemma 3
| [2] Lemma 3 | Lean | verdict |
|---|---|---|
| α coefficient seq. at scale M | `K.IsCoefficientSequence α`, `K.LocatedAtScale α M`, M ≥ 1 | match (H2, H4, H6) |
| β coefficient seq. at scale N, Siegel–Walfisz | same + `K.HasSiegelWalfisz β N` | match (H3) |
| M(x)N(x) ≍ x | `K.asympEq (M * N) x` = asympLo·x ≤ MN ≤ asympHi·x | match |
| N(x) ≤ x^{1/2}, N = x^γ | `x^γ₁ ≤ N ≤ x^γ₂`, 0 < γ₁ ≤ γ₂ ≤ 1/2, γ := log N / log x | match (H9; γ > 8ω+3δ > 0 forces γ₁ > 0 to lose nothing) |
| 24ω + 7δ − 5γ < −2, 8ω + 3δ − γ < 0 | same with `+ θ ≤`, ∀ θ > 0 | match (H10) |
| D_IIa: d ∈ [1, x^{1/2+2ω}] ∩ ℕ, ∃ r ∣ d, x^{γ−3ε−δ} < r < x^{γ−3ε} | `moduliIIa` (l.164–165): `moduliRange`, ∃ r ∣ d, N·x^{−δ−3ε} < r < N·x^{−3ε} | exact (N = x^γ) |
| squarefree d | `with Squarefree d` | exact |
| a ∈ ℤ, (a,p)=1 ∀ p ≤ x | a : ℕ, `CoprimeBelow a x` | match (H7) |
| main term (1/φ(d)) Σ_{(n,d)=1} | same (over all n) | exact up to §D |
| for all sufficiently small ε, all x > 1, A > 0: ≪_{A,ε} x/log^A x | ∃ ε₀ ∀ ε ∈ (0,ε₀) ∀ A ∃ C ∀ δ x … ≤ C x/(log x)^A, x ≥ 3 | match (H5, H9) |
| n ∈ [x, 2x] | all n | **MISMATCH (§D)** |
| no range on ω | ω ∈ (0, 1/4) | Lean weaker (§R); the conditions force ω < 1/48 anyway; ω ≤ 0 excluded |
| real-valued | ℂ-valued | harmless (H1) |

## Against [1] Theorem 2.8(iv)
The Lean is not 2.8(iv). It has [2]'s two γ-dependent conditions instead of 68ϖ + 14δ < 1, [2]'s N-range
(N ≤ x^{1/2}, any γ meeting the conditions) instead of x^{1/2−2ϖ−c} ≲ N ≲ x^{1/2}, and [2]'s moduli (one divisor in a
window of width x^δ) instead of squarefree, prime factors in I, x^δ-densely divisible q ≤ Q ≲ x^{1/2+2ϖ}. Its
residue is coprime to every p ≤ x, not to P_I. Only the n-range (all n) is [1]'s. On the moduli axis the Lean's set
is larger than [1]'s: a densely divisible q has a divisor in every window of width x^δ below x^δ q. So [1] alone
does not supply the Lean statement. That is [2]'s point in proving a variant.

## Net
Everything except the n-range matches [2] Lemma 3, up to the harmless conventions listed. The one exception is
ω ≤ 0, which the Lean excludes (weaker). The n-range makes the Lean incomparable with what [2] states.
