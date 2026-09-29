# 147-point entropy certificate for the 4-slope sum-difference constant C_3c

Certified lower bound for `C_3c = SD({0,1,2,∞}; -1)`, the constant on
[problem 3c](https://teorth.github.io/optimizationproblems/constants/3c.html) of
teorth/optimizationproblems:

```
C_3c >= 1.674733895041405870063135756722213999136383713818148696811828
```

This supersedes the previously certified 1.674733895020824993378207577602265184970... from
[PR #93](https://github.com/teorth/optimizationproblems/pull/93) (95-point support), by 2.058e-11.

## What is here

| file | contents |
|---|---|
| `certificate_3c_147pt.json` | 147 support points on Z^2 with exact rational weights, common denominator 10^320, summing to exactly 1 |
| `check_cert.py` | verifier: exact rationals + mpmath interval arithmetic |
| `reproduce_3c.py` | 25-line independent reproduction using only the standard library and mpmath |

## Verify

Needs only `mpmath`; no other dependency and no virtualenv.

```bash
python3 check_cert.py certificate_3c_147pt.json
python3 reproduce_3c.py certificate_3c_147pt.json
```

Both recompute the bound from the integer weights alone and print agreeing values.

## The claim

For a distribution `mu` on Z^2, write `H_L` for the Shannon entropy (natural log) of the
pushforward of `mu` under a linear form `L`. The entropy formulation of the constant is that
`C_3c` is the least constant with `H(X-Y) <= C_3c * max(H(X), H(Y), H(X+Y), H(X+2Y))` for every
finitely supported pair, so any single distribution certifies a lower bound. For this one:

```
H(X-Y)                              = 1.90118266043426947934028635251294...
H(X) = H(Y) = H(X+Y) = H(X+2Y)      = 1.13521477415805507650977943618525...
ratio                              >= 1.674733895041405870063135756722213999136383713818148696811828
```

All four constrained entropies agree to 33 digits, so no constraint is slack. `X-Y` is injective
on the support, so `H(X-Y)` is the entropy of the distribution itself. The support spans
`x` in [-45, 43] and `y` in [-31, 39]; the four heaviest points, carrying 85% of the mass, are
`(-1,1)`, `(-1,-1)`, `(-3,1)`, `(1,-1)`.

Weights are exact rationals, so every pushforward is exact; only the logarithms are inexact and
those are enclosed in interval arithmetic rather than rounded. The reported bound is the exact
floor truncation of the lower endpoint of the enclosure.

## How it was found

At an interior optimum with all four constraints active, stationarity gives a product law
`p_g = prod_j m_j(L_j(g))^{mu_j}` with no normalising constant, where `m_j` is the pushforward of
`p` under `L_j`. Newton on `(log p, mu)` with the analytic Jacobian converges quadratically.
Candidate points to add are scored exactly: adding `g` gains `(1-sigma) * eps*` where `sigma` is
the total multiplier mass of the directions in which `g` opens a fresh value, so a gain exists iff
`sigma < 1`. Column generation against that criterion terminates when no lattice point in the
window has positive gain, which is what closes this support at 147 points.

Floating-point optimisation is adequate only to locate basins, not to rank them: re-solving 187
distinct supports exactly promoted a basin that scores worse in double precision. Notably, the
previous 95-point certificate is not converged; most of the improvement here is convergence rather
than a new configuration.

## Disclosure

This result was produced with AI assistance (Claude). The certificate is machine-checkable by the
two scripts above, which were written independently of each other, and the numbers were verified
before submission.
