# The Apéry/Sturm irrationality-race decider — requisites, READ from the literature

Status: requisites acquired (2026-08-26, session research pass; papers read at
full text, bytes pinned below). The instrument is NOT yet built. The sin-mfg
spec (research/challenges/apery-obstruction.html, read-only) warned that the
two requisites "must be read out of the literature, not remembered" — this
file is that reading, with sources.

## The instrument

Input: an Apéry-like recurrence (integer characteristic polynomial + a
denominator-growth exponent β, an INPUT consumed from the literature, never
derived). Decide the irrationality-criterion inequality by certified
real-root isolation (Sturm over exact rationals). Verdict PROVED or REFUSED
with the miss margin.

- GREEN control: ζ(3)/Apéry must PROVE.
- RED control: ζ(5)/Zudilin must REFUSE (ζ(5) is open; an instrument that
  proves it is broken — the paper itself says the inclusions do not suffice).

## Requisite (a) — the criterion

van der Poorten, "A proof that Euler missed…", Math. Intelligencer 1 (1978/79)
195–203, §2 p. 196, verbatim: "If there is a δ > 0 and a sequence {pₙ/qₙ} of
rational numbers such that pₙ/qₙ ≠ β and |β − pₙ/qₙ| < 1/qₙ^(1+δ), n = 1, 2, …,
then β is irrational." Applied in §5 p. 199 with δ = (log α − 3)/(log α + 3):
**the inequality is log α > β**, α the dominant characteristic root, β the
denominator exponent (lcm(1..n)^β; lcm(1..n) ≤ e^{n(1+ε)} by PNT, §4 p. 198).

Integer form needing no PNT — Zudilin, "An elementary proof of Apéry's
theorem" (arXiv:math/0202159), eq. (15): a nonzero integer forced into (0,1);
the sufficient rational bar is Dₙ < 3ⁿ, so the PROVE side reduces to the
EXACT RATIONAL comparison |μ_small| < 3^(−β) — for ζ(3):
17 − 12√2 = 0.0294… < 1/27. **This is the form the instrument should decide
(Sturm-friendly, no transcendental bar).** On the REFUSE side an interval
enclosure of e^(−β) suffices (the ζ(5) margin is e^3.9).

## Requisite (b) — the two instances

ζ(3)/Apéry (GREEN, must PROVE):
- recurrence: n³uₙ + (n−1)³uₙ₋₂ = (34n³−51n²+27n−5)uₙ₋₁ (vdP §1 eq. (2))
- char poly: x² − 34x + 1, roots 17 ± 12√2 = (1±√2)^±4 (vdP §5 p. 199)
- β = 3 (2·lcm(1..n)³·aₙ ∈ ℤ; the ζ(3)-coefficient bₙ is already integral —
  vdP §4 Lemma. NOTE: the constant term carries the denominator, not the
  ζ(3) coefficient; state it that way.)
- instance: ln(17+12√2) = 3.5254943480781717 > 3, margin 0.5255
  (NOT 3.489 — a remembered value from an earlier draft was wrong; vdP's
  printed δ = 0.080529 reproduces only from 3.52549…). PNT-free form:
  17−12√2 < 1/27 exactly, or 3³(√2−1)⁴ = 0.7948… < 1 (Zudilin eq. (15)).

ζ(5)/Zudilin (RED, must REFUSE):
- Zudilin, "A third-order Apéry-like recursion for ζ(5)" (arXiv:math/0206178;
  Mat. Zametki 72:5 (2002) 796–800): third-order recurrence eq. (1);
- char poly CONFIRMED verbatim (p. 2, after eq. (5)): μ³ + 2368μ² − 752μ − 16,
  roots μ₁ = −0.02001512…, μ₂ = 0.33753726…, μ₃ = −2368.31752213….
- SUBTLETY the instrument must encode: the linear form's decay is governed by
  **μ₂, the second-smallest root** (Theorem 1 eq. (4): lim log|ℓₙ|/n = log|μ₂|),
  not μ₁ and not 1/μ₃ — the cubic's constant term ≠ ±1, roots are not
  reciprocal, unlike Apéry's quadratic where the distinction vanishes.
- β = 5 (eq. (6): qₙ ∈ ℤ, 2Dₙ⁵pₙ ∈ ℤ). Paper verbatim: "The inclusions (6)
  do not allow oneself to prove the irrationality of the number ζ(5)".
- instance: need −log|μ₂| > 5; actual 1.08607936 < 5 — REFUSED, margin 3.914.
  Robust: even −log|μ₁| = 3.9113 < 5, so REFUSED under every root assignment.
- TRAP: the same paper's auxiliary recursions (8),(9) have char poly
  λ³ − 188λ² − 2368λ + 4 (with μᵢ = λⱼλₖ) — do not confuse the two cubics.

## Pinned bytes (in corpus/sources/, hashes verified locally)

| file | source | sha256 |
|---|---|---|
| zudilin_zeta5_0206178.pdf | https://arxiv.org/pdf/math/0206178 | 84489ad052fd7dd5c8bbb9516678d8320126d06d434d4f77941f4a25cc743dc1 |
| zudilin_apery_0202159.pdf | https://arxiv.org/pdf/math/0202159 | 1911eb1caf7cb4160929f48bc3900c45ce1fa9265b794c7f330df133ab88e680 |
| poorten_1979_apery.pdf | https://mwolf.pracownicy.uksw.edu.pl/Poorten_MI_195_0.pdf (third-party scan; canonical identity is DOI 10.1007/BF03028234) | 5769ed79b3a832e12077d3005bcbe67c4323fb66800a4b147a21d20c3b8c0c11 |

Known transcription typo in math/0202159's eq. (7) (n³uₙ printed for n³uₙ₋₁;
identity (6) there is right) — transcribe from vdP's eq. (2), pin both.
