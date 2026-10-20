# A certificate for C<sub>82</sub> < 0.2534449 (essential minimum of the Zhang–Zagier height)

This repository contains an explicit construction and two independently written rigorous checkers proving

    C_82 = ess. min. of h(α) + h(1 − α)  <  0.2534449,

where h is the absolute logarithmic Weil height and C<sub>82</sub> is constant 82a in
[Tao's optimization-constants table](https://teorth.github.io/optimizationproblems/constants/82a.html).

Previous upper bounds: 0.2536331090… on the table (M. Grinsztajn, June 2026,
[maaxgrin/zhang-zagier-c82-bound](https://github.com/maaxgrin/zhang-zagier-c82-bound)), and **0.2535744749…** reported by the
Épi project in September 2026 ([BakeLab/Epi-results](https://github.com/BakeLab/Epi-results/tree/main/records/zhang-zagier/zhang_zagier_c82);
not yet on the table; we re-evaluate its construction at 0.25356893…). The best lower bound is 0.24874.

## Method and credit

The construction is C. Doche's limit-point method (C. Doche, *Zhang–Zagier heights of perturbed polynomials*,
J. Théor. Nombres Bordeaux 13 (2001) 103–110, eq. (9)). It builds on the factor library of Doche and Grinsztajn and, decisively,
on **Épi's construction, which introduced unequal denominator multiplicities and the extra factors Ed5 and En6**. This
certificate keeps Épi's denominator factors, adds Doche's P7 to the denominator, and adds **25 new numerator factors** found by
LP-dual-weighted evaluation lattices with LLL reduction; all multiplicities and exponents are re-optimised jointly by a linear program before exact
rational rounding.

Earlier versions: `v1/` claimed 0.25360615 using unequal multiplicities on Grinsztajn's factors (not new: Épi had already done it);
`alternatives/round2_certificate_0.25353524.json` is an independent intermediate result (< 0.25353524). Both are superseded.

| Denominator factor | degree | multiplicity | origin |
| --- | ---: | ---: | --- |
| Q1 | 28 | 9,297,152 | Doche |
| Q2 | 28 | 5,575,669 | Doche |
| R0 | 28 | 3,376,055 | Grinsztajn |
| R2 | 28 | 854,210 | Grinsztajn |
| P7 | 12 | 4,177,785 | Doche |
| P9 | 16 | 14,295,157 | Doche |
| Ed5 | 28 | 6,652,059 | Épi |

deg Q = 999,999,992.

| Numerator factor (active) | degree | exponent ≈ | origin |
| --- | ---: | ---: | --- |
| P1 | 1 | 7.38361e+07 | Doche |
| P2 | 1 | 7.19007e+07 | Doche |
| P3 | 3 | 2.63924e+06 | Doche |
| P4 | 4 | 7.04403e+06 | Doche |
| P6 | 8 | 9.15272e+06 | Doche |
| P8 | 12 | 399610 | Doche |
| select2_1 | 34 | 199779 | new (this work) |
| select2_11 | 24 | 354014 | new (this work) |
| select2_15 | 27 | 48639.6 | new (this work) |
| select2_22 | 28 | 660352 | new (this work) |
| select2_25 | 32 | 248385 | new (this work) |
| select2_36 | 18 | 352721 | new (this work) |
| select3_7 | 28 | 890467 | new (this work) |
| select4_0 | 24 | 457596 | new (this work) |
| select4_1 | 42 | 1.96538e+06 | new (this work) |
| select4_3 | 38 | 1.02685e+06 | new (this work) |
| select5_0 | 39 | 1.15396e+06 | new (this work) |
| select5_7 | 34 | 475532 | new (this work) |
| select5_9 | 32 | 498762 | new (this work) |
| select5_10 | 35 | 761373 | new (this work) |
| select7_0 | 42 | 2.91629e+06 | new (this work) |
| select8_0 | 22 | 1.10357e+06 | new (this work) |
| select9_1 | 24 | 349767 | new (this work) |
| select9_2 | 37 | 532982 | new (this work) |
| select9_3 | 42 | 691442 | new (this work) |
| select9_5 | 42 | 92495 | new (this work) |
| select9_6 | 36 | 1.32266e+06 | new (this work) |
| select9_7 | 39 | 120459 | new (this work) |
| select10_0 | 41 | 1.21778e+06 | new (this work) |
| select11_0 | 42 | 1.11039e+06 | new (this work) |
| merged_0 | 30 | 582718 | new (this work) |

deg A ≈ 944,662,258.83 < deg Q. Exact integer coefficients and rational exponents are in `certificate.json`
(SHA-256 `b33626f367b6f52922746c0fee7bb008449cd0bb18efcb983ab20ff073350fce`).

## Why the certificate implies the bound

All logarithms are natural. Integer coefficient arrays in the JSON are in descending order.
Write T(z)=z(1-z), D=deg Q, and

    Q(X) = product_j R_j(X)^m_j,
    A(X) = product_i S_i(X)^q_i,       q_i >= 0 rational.

The verifier checks that each R_j is monic up to sign, m_j is a positive
integer, deg A < D, and gcd(S_i,R_j)=1 whenever q_i>0. Here A denotes a
formal product with rational exponents; no branch of a complex power is used.
Only log|A|=sum q_i log|S_i| appears.

The upper-bound formula is

    B = [ log M(Q(T(z)))
          + integral_0^1 max(0, sum_i q_i log|S_i(T(exp(2 pi i t)))|
                                   - log|Q(T(exp(2 pi i t)))|) dt ] / D.

This is the logarithm of Doche 2001b, equation (9). The following direct
argument also verifies the infinite-sequence step without requiring a
numerical sequence of huge irreducible polynomials.

Take a common denominator b of the q_i and put

    U(z)=product_i S_i(T(z))^(b q_i),   W(z)=Q(T(z))^b.

These are coprime integer polynomials, deg U < deg W=2bD, and W is monic
up to sign. In particular U/W is not constant. For n>=1, set

    F_n(z)=U(z)^n-W(z)^n.

Its leading coefficient has modulus 1 and its degree is 2bDn. Factorization
using the n-th roots of unity and multiplicativity of Mahler measure give

    log M(F_n)/n = (1/n) sum_{k=1}^n log M(U-exp(2 pi i k/n) W).

The function of the phase on the right is continuous: polynomial degree
and leading-coefficient modulus stay fixed, roots vary continuously as a
multiset, and log M is the sum of log max(1,|root|). Thus this Riemann sum
converges. Jensen's formula, first in z and then in the phase, gives

    lim_n log M(F_n)/n
      = integral_0^1 log max(|U(exp(2 pi i t))|,|W(exp(2 pi i t))|) dt
      = b D B.

The exchange of integrals is valid. The positive part of log|U-yW| is
uniformly bounded on the two circles, while Jensen's phase integral is
log max(|U|,|W|), bounded below because U and W have no common zero.
Consequently the negative part is integrable as well.

For each prime p, use the integer polynomial

    G_p(z) = F_p(z)/(U(z)-W(z)).

It is monic up to sign, symmetric under z -> 1-z, and has degree
2bD(p-1). For distinct primes p and r, G_p and G_r are coprime. Indeed,
a common root cannot be a zero of W by coprimality of U,W. Its ratio U/W
would have to be both a nontrivial p-th and a nontrivial r-th root of
unity, which is impossible. (At U/W=1 the quotient evaluates to
p W^(p-1), so this is not a root.) This remains valid in the presence of
ramification or repeated roots of individual G_p.

As G_p is symmetric and monic up to sign, the average of h(alpha)+h(1-alpha)
over its roots, counted with multiplicities, equals

    2 log M(G_p)/deg G_p.

To justify this even for reducible G_p, factor into primitive irreducible
integer polynomials; the leading coefficients of all factors have modulus
1. Each factor contributes its degree times h(alpha), and the same applies
to h(1-alpha). Symmetry makes the two aggregate sums equal.

The displayed averages tend to B, since subtracting the fixed
log M(U-W) does not affect the normalized limit. Each G_p therefore has
an irreducible factor whose roots have Zhang-Zagier height no greater than
that average. Coprimality for distinct primes makes these algebraic numbers
distinct. Hence C82 <= B. No assumption that the search LP is optimal,
no measure-approximation theorem, and no irreducibility of the R_j is needed.

## The two checkers

**`verify.py`** composes each factor with T(z) = z(1 − z) exactly in ℤ[z], encloses every root with FLINT/Arb and bounds the
integral on dyadic panels with rigorous Taylor majorants:

The code composes each input polynomial exactly with T in Z[z], then uses
FLINT/Arb to enclose its complete root multiset (including multiplicities).
It never imports the search module or upstream code.

For a composed polynomial a product(z-r), log modulus on the unit circle
is log|a| + sum_r log|u(t)-r|, where u(t)=exp(2 pi i t).
On a dyadic panel of width w and midpoint c,

    |u(t)-u(c)| <= 2 pi |t-c| <= pi w.

Triangle inequalities with Arb root balls give whole-panel lower and upper
distance bounds. Upper bounds for numerator log terms and lower bounds for
denominator log terms give a rigorous upper bound g_upper on g. If this is
negative, max(0,g) is zero throughout the panel, including any numerator
zeros. This avoids taking logs at the endpoint t=0.

Otherwise all root distances must be separated from zero before using a
Taylor estimate; panels failing this requirement are bisected. With signed
weights w_r for numerator/denominator roots,

    g'(c) = Re sum_r w_r 2 pi i u(c)/(u(c)-r),
    |g''(t)| <= M = (2 pi)^2 sum_r |w_r| |r| / d_r^2,

where d_r is a rigorous positive lower distance on the whole panel. Put
h=w/2 and reach=|g'(c)|h+M h^2/2. If g(c)-reach>0, integrate the linear
Taylor polynomial exactly and add M w^3/24. If g(c)+reach<0, the integral
is zero. Otherwise use the Lipschitz property of the positive part to bound

    integral_panel max(0,g)
      <= w max(0,g(c)) + |g'(c)| w^2/4 + M w^3/24.

Arb balls enclose every evaluation and comparison. The tolerance chooses
when to stop subdividing; correctness does not depend on meeting a target
error estimate. The final bound uses the upper endpoint of the accumulated
majorant and is compared with an exact rational target.

Binary recursion tiles [0,1/2] exactly with rational endpoints; real
coefficients imply g(1-t)=g(t). Doubling covers the entire circle. There are
no omitted pilot-grid gaps and no floating endpoints in the proof.

Mahler measure is separately enclosed by the complete composed root
multisets using log|leading coefficient|+sum log max(1,|root|).
The JSON field integral_upper_ball encloses a computed upper estimate,
not necessarily the true integral on both sides. The analogous convention
applies to bound_upper_ball.

The checker aborts after depth 48 if a panel cannot be resolved. In
particular it is not a general-purpose integrator for denominator roots
on the unit circle. This certificate resolves every panel successfully.

**`independent_check.py`** was written separately, without access to `verify.py`, by an adversarial referee: certified roots,
Jensen's formula for the Mahler term and an analytic enclosure of the integral.

## Results

| Checker | Certified upper bound on B |
| --- | --- |
| `verify.py` | 0.25344468733362658… |
| `independent_check.py` | 0.25344468733741928… |
| adversarial referee's own evaluator | below 0.253444687331849 |

Controls: `controls/epi2026.json` reproduces Épi's construction (≈ 0.2535689), `controls/grinsztajn2026.json` and
`controls/doche2001.json` reproduce the older bounds, and `controls/mutated_should_fail.json` / `controls/mutated_v2_should_fail.json`
fail the target.

```sh
pip install -r requirements.txt          # python-flint 0.9.0
python verify.py certificate.json --tol 1e-10 --out verification.json
python independent_check.py certificate.json independent.json 1e-8
```

## Priority

As of 16 Oct 2026 we found no smaller published upper bound (Tao table and open PRs, Épi's repository history, DeepMind's
AlphaEvolve result repositories, arXiv). A 2025 CIRM talk mentioned progress without a number we could check.

## AI assistance

The construction search, the proof write-up and the checkers were developed with AI coding assistants (OpenAI Codex and Claude)
under the author's direction, and the author checked the argument. Every numerical claim is checked by the code in this repository.

## License

MIT; see `LICENSE`.
