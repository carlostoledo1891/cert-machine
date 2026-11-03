# An improved lower bound for the Barnard–Steinerberger autocorrelation constant

Let $C_{1c}$ be the smallest constant such that, for every non-negative $f \in L^1(\mathbb R)$,

    min_{0 ≤ t ≤ 1} ∫ f(x) f(x+t) dx  ≤  C_{1c} · (∫ f)²

(Barnard–Steinerberger [BS2020]; constant 1c of T. Tao et al., *Optimization constants in mathematics*,
https://github.com/teorth/optimizationproblems). This repository contains a certificate for

    C_{1c}  ≥  134648548624804778248790016 / 328144294688458468928334649  =  0.41033335274849…  ≥  0.4103333

Equivalently, in Kravitz's notation [K2021], τ = C_{1c}^{-1/2} ≤ 1.56111. This improves the previous bound,
21072342208353792/51354782902387969 = 0.41032871754… of rozetyp [R2026], by 4.6352·10⁻⁶.

## The certificate

`K24576_0.4103333.json` describes the step function f = Σᵢ wᵢ · 1[i/K, (i+1)/K) with
- K = 24576;
- 24592 non-negative integer weights wᵢ (key `weights_int`), the last 8 of them zero, so the support is [0, 3073/3072).

The format and the exact scoring rule are specified in `FORMAT.md`; the argument is in `PROOF.md`. In short, for
equal-width steps the autocorrelation is linear in t between consecutive multiples of 1/K, so

    C_{1c}  ≥  K · min_{0≤k≤K} Σᵢ wᵢ wᵢ₊ₖ / (Σᵢ wᵢ)²,

a finite computation in integers. The minimum is attained at k = 21264. The keys `score_num`, `score_den`,
`argmin_k` and `note` record the claim and are not used to compute the score. (The `note` field's path,
`problems/autocorr_1c/FORMAT.md`, refers to our working repository; the same file is `FORMAT.md` here.)

SHA-256 of `K24576_0.4103333.json`: `963cb7273062e7360fdfa460bb19c1cf37729364b8f708b09580b6655b783c9e`.

## Verify

```
sha256sum -c SHA256SUMS
python3 verify.py K24576_0.4103333.json             # exact, standard library only, about a second
python3 verify.py --selftest                        # controls
python3 verify.py K24576_0.4103333.json --direct    # also re-sums every lag term by term, 1-2 min
python3 verify_independent.py --beat 21072342208353792/51354782902387969 K24576_0.4103333.json
python3 score_exact.py K24576_0.4103333.json        # needs numpy; about 10 s
```

- `verify.py` (Python 3 standard library only). It computes every lag Aₖ = Σᵢ wᵢwᵢ₊ₖ at once and exactly, by
  Kronecker substitution: one big-integer product, with byte-aligned slots wide enough that no carry crosses a
  slot. It then checks that the result equals the fraction stored in the certificate. `--selftest` runs the controls:
  - the ruler {0,1,4,6} gives exactly 3/8;
  - a claim 10⁻¹⁵ too high is refused;
  - 200 random cases agree with direct sums;
  - negative, fractional, boolean, string and all-zero weights are refused.

  On rozetyp's certificate it prints that certificate's stated fraction.
- `verify_independent.py` (standard library only) was written by a separate Claude agent from the definition of the
  constant and `FORMAT.md` alone, with no access to the construction code. It prints `VALID`, the exact fraction,
  `CLAIM_OK`, and `BEATS` for the previous bound. Its exit codes: 0 valid (and beats), 1 invalid, 2 does not
  beat, 3 usage error.
- `score_exact.py` (numpy). It splits each weight into 15-bit limbs and correlates them with int64 `numpy.correlate`.
- rozetyp's own verifiers, `verify.py` and `check_independent.py` at
  https://github.com/rozetyp/barnard-steinerberger-lower-bound/tree/19f3971 (MIT licence; not copied here), also
  accept this file. Run them with `python3 verify.py K24576_0.4103333.json` and
  `python3 check_independent.py K24576_0.4103333.json 10`. The second integrates block overlaps directly, in exact
  rational arithmetic, at the minimiser, at random off-grid shifts and at shifts just either side of the
  minimiser, and finds nothing below the bound.

## How it was found

We split each cell of rozetyp's K = 6144 certificate in two (K = 12288). We then maximised a soft-min of the K + 1
normalised correlations with L-BFGS-B, with gradients by FFT. We split again (K = 24576), optimised for about 25
more minutes, then scaled the weights to a maximum of 10¹² and rounded them to integers. The search code is not
part of this repository: the certificate stands on its own.

The near-extremiser keeps the shape described in [R2026]. About 22% of the mass sits in the interval [1/6144, 2/6144),
next to the left end, now as four nearly equal cells. Re-optimising rozetyp's certificate at its own K = 6144
already gives 0.4103327, so part of the gain is convergence and part is resolution.

## Credits

- rozetyp [R2026], for the step-function certificate refined here and its exact scoring.
- N. Kravitz [K2021], for the piecewise-linearity argument.
- C. Toledo, for the replay conventions of teorth/optimizationproblems#243, followed here.
- T. Tao and contributors, for the table of optimization constants.

## AI disclosure

This certificate was found and prepared with Claude (Anthropic, Claude Opus 5.5), directed by Dennis Koshta, who
takes responsibility for it. Claude wrote the numerical re-optimisation, the certificate, `verify.py`,
`score_exact.py`, `PROOF.md` and this text. The independent check (`verify_independent.py`) was done by a separate
Claude agent with its own verifier, written from the definition and the certificate format only. No human
mathematician has checked the argument.

## References

- [BS2020] R. C. Barnard, S. Steinerberger, *Three convolution inequalities on the real line with connections to
  additive combinatorics*, J. Number Theory 207 (2020), 42–55. arXiv:1903.08731.
- [K2021] N. Kravitz, *Generalized difference sets and autocorrelation integrals*, arXiv:2004.06611.
- [R2026] rozetyp, *A lower bound for the Barnard–Steinerberger autocorrelation constant*,
  https://github.com/rozetyp/barnard-steinerberger-lower-bound (commit `19f3971`).

## Licence

MIT; see `LICENSE`.
