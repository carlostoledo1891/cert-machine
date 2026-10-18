# A lower bound for the Barnard–Steinerberger autocorrelation constant

Let C be the smallest constant such that, for every nonnegative f ∈ L¹(ℝ),

    min_{0 ≤ t ≤ 1} ∫ f(x) f(x+t) dx  ≤  C ‖f‖₁².

Barnard and Steinerberger [BS20] proved 0.37 ≤ C ≤ 1/(2(1+θ₀)) ≈ 0.4107675, where θ₀ = −min_x sin(x)/x. In Kravitz's notation [K21], τ = 1/√C. This is also problem 6 of the AlphaEvolve problem list [GGSWT25], which records 0.37 ≤ C ≤ 0.411.

This repository contains a certificate for

    C ≥ 21072342208353792 / 51354782902387969 = 0.41030287175…     (τ ≤ 1.56112)

## The certificate

`certificate.json` describes the step function f = Σᵢ wᵢ · 1[i/K, (i+1)/K):
- K = 6144;
- 6148 nonnegative integer weights wᵢ;
- support [0, 1.0005).

SHA-256 of `certificate.json`: `62ac49ddbbfc9aa1053406363d9df9c912022ab85b72a447cf73c94bb9c1fd0e`

An earlier certificate (K = 3072, C ≥ 0.41030211724) is kept in `previous/certificate_K3072.json`, SHA-256 `788527a6237837e8d5d441cfab3f8b39080165fc207ae6a69678cc5f3a0fdf58`.

## Why the check is exact

For equal-width steps, the autocorrelation t ↦ ∫ f(x)f(x+t) dx is linear between consecutive multiples of 1/K. This is the same computation as in the proof of [K21, Theorem 3.1]. So its minimum over [0, 1] is attained at some t = k/K, where it equals (1/K)·Σᵢ wᵢwᵢ₊ₖ. Since ‖f‖₁ = Σwᵢ / K,

    C  ≥  K · min_{0≤k≤K} Σᵢ wᵢ wᵢ₊ₖ / (Σᵢ wᵢ)²,

and this is a finite computation in integers.

## Verify

Requires Python 3 only; there are no dependencies.

    python3 verify.py certificate.json                  # exact integer/rational check, a few seconds
    python3 check_independent.py certificate.json 40    # second check, see below

`check_independent.py` does not assume the linearity above. It integrates the overlaps of the blocks directly in exact rational arithmetic, both at the claimed minimizer and at random off-grid shifts t ∈ [0, 1]. It checks that nothing falls below the bound.

## Remarks

- **How it was found.** The weights come from numerical optimization (L-BFGS on a soft-min of the correlations, with an upsampling ladder K = 12, 24, …, 3072). A total-variation penalty on the oscillation near the far end of the support then improved the bound slightly and removed the irregular spikes of the raw optimizer output. The certificate stands on its own; how it was found does not matter for its validity.
- **Shape.** The near-optimal functions have:
  - a concentrated block at one end, holding about 40% of the mass. About 21–22% of the total mass sits in a *single* grid cell at both K = 3072 and K = 6144, so the density there grows with K. When that mass is spread out and the function re-optimized, it collapses back (this is how the K = 6144 certificate was found);
  - an empty gap;
  - a smooth concave ramp;
  - a smooth rise at distance ≈ 1 from the block.

  This suggests the extremizer is unbounded at one end (compare [K21, Question 7.2]). Numerics like these cannot distinguish a point mass from a very sharp singularity.
- **Upper bound.** The Fourier/LP argument of [BS20] cannot give anything below 1/(2(1+θ₀)): the measure v·1_[−1,1] + (1−2v)·δ₀ satisfies all of its constraints. This is essentially [MR20, Thm 4.1].

## References

- [BS20] R. C. Barnard, S. Steinerberger, *Three convolution inequalities on the real line with connections to additive combinatorics*, J. Number Theory 207 (2020), 42–55. arXiv:1903.08731.
- [K21] N. Kravitz, *Generalized difference sets and autocorrelation integrals*, arXiv:2004.06611.
- [MR20] J. Madrid, J. P. G. Ramos, *On optimal autocorrelation inequalities on the real line*, arXiv:2003.06962.
- [GGSWT25] B. Georgiev, J. Gómez-Serrano, T. Tao, A. Z. Wagner, *Mathematical exploration and discovery at scale*, arXiv:2511.02864, problem 6.

## AI disclosure

The search and the verification code were developed with the help of an AI coding assistant (Claude, Anthropic). The certificate was checked independently by the two verifiers above.
