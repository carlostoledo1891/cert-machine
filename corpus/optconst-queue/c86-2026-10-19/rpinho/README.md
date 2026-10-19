# A certificate for C<sub>86</sub> ≤ 1.8117251 (Schur–Siegel–Smyth trace constant)

This repository contains an explicit, exactly specified probability measure and an independent
checker proving

    C_86 = lambda^SSS <= 144938007612277893 / 79999999999994000 = 1.81172509515360... < 1.8117251,

where C<sub>86</sub> is the smallest limit point of tr(α)/deg(α) over totally positive algebraic
integers α (constant 86a in
[Tao's optimization-constants table](https://teorth.github.io/optimizationproblems/constants/86a.html)).
The previous best upper bound was 1.8216, due to Talebizadeh Sardari and Orloski [SO24].

## Method and credit

The construction is the method of [SO24] (B. Orloski and N. Talebizadeh Sardari, *A quantitative
converse of Fekete's theorem*, [arXiv:2304.10021](https://arxiv.org/abs/2304.10021)), which rests on
A. Smith's converse to Fekete's theorem [Smi24] (*Algebraic integers with conjugates in a prescribed
distribution*, Ann. of Math. 200 (2024), [arXiv:2111.12660](https://arxiv.org/abs/2111.12660)).
SO24 reach 1.8216 with the four polynomials {x, 1−x, x²−3x+1, x³−5x²+6x−1}. The only change here is
seven more small-trace integer polynomials, after which a discretised version of the SO24 primal
problem is solved and the solution is rounded to an exact rational certificate with a small safety
margin.

## The certificate

`cert_n1200_A11.json` (SHA-256 `722a287b74a9f84f8c6c2f505e7e6bb987ca634710b031287a5b01619bffe53d`)
holds, all as exact rationals in string form:

- `edges`: 1201 grid points 0, 1/200, …, 6;
- `densities`: 1200 cell densities d<sub>i</sub> ≥ 0 (629 nonzero, support in [1/20, 1037/200]); the
  measure is μ = Σ d<sub>i</sub> 1<sub>[e<sub>i</sub>, e<sub>i+1</sub>]</sub> dx, of mass
  m = 39999999999997/40000000000000;
- `A`: 11 integer polynomials (coefficient lists, constant term first);
- `b`: 11 weights b<sub>Q</sub> ≥ 0;
- `bound`: the claimed value ∫x dμ / m.

(`n`, `delta`, `bound_float` and `report` are metadata from the program that produced it.)

| Q ∈ A | b<sub>Q</sub> | |
| --- | --- | --- |
| x | 38759530583/1000000000000 | 0.038759530583 |
| 1 − x | 39934194061/500000000000 | 0.079868388122 |
| x² − 3x + 1 | 4631766723/100000000000 | 0.046317667230 |
| x³ − 5x² + 6x − 1 | 53369420893/1000000000000 | 0.053369420893 |
| x⁴ − 7x³ + 14x² − 8x + 1 | 77163819/3906250000 | 0.019753937664 |
| x⁴ − 7x³ + 13x² − 7x + 1 | 36545507753/1000000000000 | 0.036545507753 |
| x⁵ − 9x⁴ + 28x³ − 35x² + 15x − 1 | 8024683547/500000000000 | 0.016049367094 |
| x⁵ − 9x⁴ + 26x³ − 29x² + 11x − 1 | 9731525491/1000000000000 | 0.009731525491 |
| x⁵ − 9x⁴ + 27x³ − 32x² + 13x − 1 | 7106935573/1000000000000 | 0.007106935573 |
| x³ − 6x² + 9x − 1 | 18100957401/1000000000000 | 0.018100957401 |
| x⁵ − 9x⁴ + 27x³ − 31x² + 12x − 1 | 1446829237/500000000000 | 0.002893658474 |

The first four are the SO24 set; the other seven are the additions.

## Why the checks imply the bound

Write U<sub>μ</sub>(z) = ∫ log|z − y| dμ(y) and f = U<sub>μ</sub> − Σ b<sub>Q</sub> log|Q|.
`referee_check.py` verifies, in exact rational arithmetic and arb ball arithmetic:

| | Condition | Result |
| --- | --- | --- |
| E1 | d<sub>i</sub> ≥ 0, edges increasing, support in [1/20, 1037/200] (away from 0) | exact |
| E2 | each Q ∈ A is primitive, irreducible over ℤ, has only real roots; the Q are pairwise coprime | sympy, exact |
| E3 | Σ b<sub>Q</sub> deg Q < m | ratio 0.82978 |
| E4 | ∫ log\|Q\| dμ > 0 for each Q ∈ A | closed form in arb; all ≈ +1.0e-4 |
| E5 | f(x) ≥ 0 for **every** x in supp μ (not just samples) | adaptive bisection with rigorous arb lower bounds; 6,218 subintervals, worst certified lower bound 7.4e-8 |
| E6 | ∫x dμ / m equals `bound` exactly and is ≤ 1.8117251 | exact |

These suffice:

1. **E5 extends to all of ℂ.** Off supp μ, f is superharmonic (U<sub>μ</sub> is harmonic there and
   each −b<sub>Q</sub> log|Q| is superharmonic); f is lower semicontinuous because μ has bounded
   density; and f → +∞ at ∞ by E3. By the minimum principle, f ≥ 0 on supp μ implies f ≥ 0 on ℂ.
2. **μ/m is arithmetic.** With a<sub>Q</sub> = b<sub>Q</sub>/m, E2–E5 are the hypotheses of Smith's
   sufficient criterion [Smi24, Prop. 5.15 in v2] (cited as the key tool in SO24): for any other
   irreducible Q ∈ ℤ[x] the resultants Res(Q, Q<sub>i</sub>) are nonzero integers, which gives
   ∫ log|Q| d(μ/m) ≥ 0.
3. **Smith's theorem** [Smi24, Thm 1.5 in v2], applied on Σ = [1/20, 1037/200] (capacity
   (1037/200 − 1/20)/4 ≈ 1.284 > 1), then yields infinitely many distinct totally positive algebraic
   integers whose conjugate distributions converge to μ/m, so their tr/deg converges to
   ∫x dμ / m. Hence C<sub>86</sub> ≤ ∫x dμ / m.

This is the same chain of published results on which the 1.898 and 1.8216 table entries rest; it
does not need μ to be optimal.

## Running the check

Tested with Python 3.12.13 on macOS (arm64):

    python3 -m venv .venv
    .venv/bin/pip install -r requirements.txt
    .venv/bin/python -I referee_check.py cert_n1200_A11.json 4    # 4 = worker processes

The exit status is 0 if and only if every check passes; a JSON report is written to
`cert_n1200_A11.referee_report.json`. The run takes about 8 s wall-clock on an Apple M4 (about 3 s
of it is the check itself). Expected output, abridged:

    exact checks ok {
     "support_min": "1/20",
     "support_max": "1037/200",
     "mass": "39999999999997/40000000000000",
     "trace": "144938007612277893/80000000000000000",
     "bound_exact": "144938007612277893/79999999999994000",
     "bound_decimal": 1.8117250951536095,
     "bound_matches_claim": true,
     "bound_le_1.8117251": true,
     "sum_b_deg_over_mass": 0.8297796028750622
    }
       {'Q': 'x', 'irreducible': True, 'deg': 1, 'real_roots': 1, 'lc': 1}
       ... (11 rows, all irreducible with all roots real)
      E4 {'Q': 'x', 'lower': 0.00010000000006905452, ...}
       ... (11 rows, all positive)
    E4 ok
    E5 {'cells': 629, 'subintervals_proved': 6218, 'min_certified_lower_bound': 7.359790864206603e-08, 'max_depth': 5, 'failures': [], 'n_failures': 0}
    ALL_OK True time ...

Deliberately corrupted certificates are rejected: densities scaled by 0.98 (a certified point with
f < 0 is reported), weights scaled by 1.3 (E3 fails), extra mass near 0.05 (E4 and E5 fail), and a
tampered `bound` (E6 fails).

## AI assistance

The polynomial search, the certificate construction and the checker were developed with AI coding
assistance (Claude), under the author's direction. The mathematical argument above relies only on
the cited published results, and every numerical claim is checked by the code in this repository.

## License

MIT; see `LICENSE`.
