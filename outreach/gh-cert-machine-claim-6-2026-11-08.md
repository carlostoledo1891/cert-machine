<!-- draft reply for carlostoledo1891/cert-machine#6 — NOT posted; posting is the operator's word. Replace c4d8a80a with the merge commit. -->
**REFUTED: the constraint fails; the printed score is right.** I decided this claim exactly, with Claude agents who wrote the two deciders under my direction. The constraint Σ_k f(k)⌊x/k⌋ ≤ 1 fails at the very first point, x = 1. Even granting the platform's 10⁻⁴ tolerance, it fails by a factor of 73 at a point outside the sampled range. The score 0.9976572852677297 is the float64 value of the exact S.

**What this does not say.**
- I did not decide anything about π(x): the step from the constraint to C⁻ is the problem's mathematics, and it needs the constraint, which fails.
- I did not decide the platform's own sampled run, because its 10⁷ samples are not published. What I decided is the check those samples approximate, made exhaustive (below), and it passes.
- I read only the problem's statement (the API record's `description` field). I never read or ran the platform's verifier.

**What was decided.** best-7.json's sha256 matched the issue's `5382b697…`. Every f(k) is the rational its literal denotes. The statement's steps 1–2 were applied exactly:
- no value is clipped;
- f(1) := −Σ_{k≥2} f(k)/k, an exact rational. There is no key 1 in the submission, so f(1) is the platform's own normalisation.

Writing F(x) = Σ_k f(k)⌊x/k⌋ (constant on [n, n+1)):

| | exact |
| --- | --- |
| F(x) = f(1) for 1 ≤ x < 2 | 1.00009998995223526404… > 1 (above 1 by 9.99899522 · 10⁻⁵, inside the 10⁻⁴ tolerance) |
| integers 1 ≤ n < 1,278,490 (= 10 · max k, the sampled range) with F(n) > 1 | 3,754 |
| … with F(n) > 1 + 10⁻⁴ | 0 — the platform's check, run on every integer of its range, passes |
| max of F on the range | n = 1,254,707: below 1 + 10⁻⁴ by more than 9.9212136 · 10⁻⁹ |
| F at x = lcm(keys) − 1 − 299,856 (a 2,117-digit integer) | 73.3952851982928870371… |
| S = −Σ f(k) ln(k)/k, logs enclosed rigorously | ∈ [0.99765728526772941072732, 0.99765728526772941072733]; the printed double is 2.893 · 10⁻¹⁶ above |

Why the last F row: Σ f(k)/k = 0 makes F periodic with period L = lcm(keys), and F(L − 1 − m) = −Σ_k f(k) − F(m). Here −Σ_k f(k) ≈ −67.974, and the range minimum is F(299,856) ≈ −141.369, so the reflection gives F ≈ 73.395. Both checkers evaluate F at that x directly, as Σ_k f(k)⌊x/k⌋, with no identity used. This is the case the platform's own banner warns about: a passing solution "may exceed 1 at unsampled points, outside the sampled range, or by up to the 10⁻⁴ tolerance". This solution does the last at x = 1 and the second far beyond the range.

**Re-run it** with stock Python, without cert-machine (about 7 s):
```
git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine && git checkout c4d8a80a
python3 -I corpus/claims-intake/pnt/check.py
```
The Python scans the range in exact integers. The second implementation (JavaScript BigInt, sharing no code with it) uses 10⁻⁶⁰ enclosures with an exact fallback, and the two agree on every number. The logarithms are checked against published digits and against Python's correctly rounded `decimal` ln. Controls came back as predicted:
- the score claim moved by 2 · 10⁻⁶: REFUTED;
- f scaled by 1.001: the platform's check fails;
- f = μ on 1..2000: F ≡ 1 there, the Möbius identity;
- a planted 11: clipped to 10.

Pre-registration (committed before any decider ran): `notes/claims-intake-preregistration-2026-11-08.md`; record: `certs/claims-intake-2026-11-08.json`.
