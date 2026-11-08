<!-- draft reply for carlostoledo1891/cert-machine#4 — NOT posted; posting is the operator's word. Replace {{COMMIT}} with the merge commit. -->
**REFUTED as filed, by 2.99 · 10⁻⁶.** I decided this claim exactly, with Claude agents who wrote the two deciders under my direction. The step function is a valid witness: all 3072 values are ≥ 0. But it gives Q = ‖f∗f‖₂² / (‖f∗f‖₁ ‖f∗f‖∞) = 0.94689701315729654665…, which is below 0.9469. What these bytes prove is **C2 ≥ 0.9468970131** (rounded down).

**What this does not say.**
- It is not an error in the paper. Table 2 and §4 print a *score*, 0.9469, and that is this Q rounded to four decimals. The refutation is of "C2 ≥ 0.9469" as a lower bound.
- I did not read or run ThetaEvolve's scorer, so I don't know what it computes internally. The definition decided is the paper's (App. A.3) and AlphaEvolve's: the least C2 with ‖f∗f‖₂² ≤ C2 ‖f∗f‖₁ ‖f∗f‖∞ over non-negative f.
- One of my three calibrations did not come out as I predicted. The file's `StrongInit` (1024 cells) decides to 0.9052826…, where Table 2 prints 0.9055 for "Initial". I can't tell whether that list is the object behind Table 2's "Initial" without running their code.

**What was decided.** The file's sha256 matched the issue's `3d453b72…`. Every value is the rational its decimal literal denotes, scaled to an integer over 10²⁰. For n equal cells, f∗f is piecewise linear with knots at the cell edges. So with c_k = Σ_{i+j=k} a_i a_j (exact) and c₋₁ = c₂ₙ₋₁ = 0:

  Q = Σ_{m=0}^{2n−1} (c_{m−1}² + c_{m−1}c_m + c_m²) / (3 (Σa)² max c)

Q is exact for a step function. It is a rational with a 91-digit numerator and denominator, and the maximum of c is at k = 5771.

| | |
| --- | --- |
| Q | ∈ [0.94689701315729654665, 0.94689701315729654666] |
| 0.9469 − Q | ∈ [2.98684270345 · 10⁻⁶, 2.98684270346 · 10⁻⁶] |
| 0.9469 as a reading of Q | rounding: yes · truncation: no |

**Calibration of the definition.**
- The file's `AlphaEvolve-v1` entry is AlphaEvolve's 50 heights, literal for literal (their B.2 notebook). It gives Q = 0.8962799441…, which is ≥ 0.8962, as AlphaEvolve states.
- `8B-wo_RL@100` gives 0.9433749…, which rounds to Table 2's 0.9434 and is likewise below it.
- The definition also gives 2/3 exactly on one cell.

A corrected claim, C2 ≥ 0.9468, is CERTIFIED (one of the controls).

**Re-run it** with stock Python, without cert-machine:
```
git clone https://github.com/carlostoledo1891/cert-machine && cd cert-machine && git checkout {{COMMIT}}
python3 -I corpus/claims-intake/autocorr2/check.py
```
It prints Q and the falsifying margin. It computes c by one big-integer square (Kronecker substitution); the second implementation (JavaScript BigInt, sharing no code with it) uses the schoolbook sum, and the two agree to every digit. Controls came back as predicted:
- one cell set to −10⁻⁶: REFUTED;
- the largest cell ×100: REFUTED (Q = 0.0923…);
- 0.9469 REFUTED and 0.9468 CERTIFIED.

Pre-registration (committed before any decider ran): `notes/claims-intake-preregistration-2026-11-08.md`; record: `certs/claims-intake-2026-11-08.json`.
