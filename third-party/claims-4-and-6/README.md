# Claims #4 and #6, rechecked outside the engine

A third-party recheck of two open claims in this repository, decided from the pinned bytes in exact
rational arithmetic and an independent implementation:

- **#4** the second autocorrelation inequality, entry `8B-w_RL@65` of the ThetaEvolve step functions
- **#6** EinsteinArena solution 2506 to "The Prime Number Theorem"

Both come back **REFUTED as stated**, with the exact value in place of the decimal, and with one
number that is sharper than the published record: the #6 constraint fails **6 695 integers past the
end of the platform's sampled window**, and it can be shown to fail at a seven-digit integer rather
than at the 2117-digit integer the register used.

## Independence

`verify_claims.py` shares no code with `tools/claims-intake-deciders.js` and none with
`corpus/claims-intake/{autocorr2,pnt}/check.py`. It reads the two witnesses from this repository's
own pins, refuses them if a byte changed, and uses its own algorithms:

- for #4 a schoolbook integer autoconvolution over one power of ten, with the three norms integrated
  exactly on the knot grid (the closed form is checked by a subdivision test, below);
- for #6 an exact normalisation, a divisor difference array that accumulates
  `B(n) = sum_k a_k floor(n/k)`, and 100-digit decimal comparisons, every reported value then
  recomputed as an exact fraction at its own `n`.

Standard library only, `python3 -I`, no network.

## Pinned inputs

| input | pin | sha256 |
| --- | --- | --- |
| `corpus/claims-intake/inputs/thetaevolve-7c12898-SecondAutoCorrIneq-data.json` | `ypwang61/ThetaEvolve@7c12898`, `Results/SecondAutoCorrIneq/data.json`, Apache-2.0 | `3d453b729f5913e7f686e1386c5351fb90a2f434910604c6199ad39905a3cb4b` |
| `corpus/einstein-arena/best-7.json` | the platform's API record of solution 2506, created 2026-08-15 | `5382b697a7920edd92edc8c4770441925042bde3d3719456e84f248fbb8bd333` |
| `corpus/claims-intake/inputs/einstein-arena-api-problems-prime-number-theorem_2026-11-08.json` | the problem statement, read for its constraint only | `5e97cd89a653836230688934cdf92681e546ade47f0e2b2fad18b79ac3d2e20d` |

Every sha256 matches the one the issue states.

## Claim #4

The claim: the 3072-cell step function stored under `8B-w_RL@65` gives `C2 >= 0.9469`, where `C2` is
the least constant with `||f*f||_2^2 <= C2 ||f*f||_1 ||f*f||_inf` for every non-negative `f`.

On the knot grid `t = 0, h, ..., 2n h` the autoconvolution is `[0] + c + [0]` with `c` its exact
discrete convolution, and it is linear between knots, so
`Q = [sum_m (e_m^2 + e_m e_{m+1} + e_{m+1}^2)/3] / [(sum_k c_k) max e]`, a rational.

- every one of the 3072 values is non-negative, so the object is in the inequality's domain;
- `Q` lies in `[0.946897013157296546656800171244, 0.946897013157296546656800171245]`, i.e.
  `Q = 0.946897013157296546656800171244…`, with the rational's own numerator and denominator printed
  by the script (identical, digit for digit, to the ones in `certs/claims-intake-2026-11-08.json`);
- `Q - 0.9469` lies in `[-0.000002986842703453343199828756, -0.000002986842703453343199828755]`.

Verdict, in the two readings the register already separates:

- **literal threshold: REFUTED.** `0.9469` is above `Q` by `2.9868427e-6`, so the bytes prove
  `C2 >= 0.9468`, not `C2 >= 0.9469`;
- **display: 0.9469 is `Q` rounded to four decimals**, and `0.9468` is certified.

Calibrations on the same bytes, as a check of the implementation rather than of the claim:

| entry | cells | exact Q | printed | relation |
| --- | --- | --- | --- | --- |
| `AlphaEvolve-v1` | 50 | 0.896279944155… | 0.8962 | truncated |
| `StrongInit` | 1024 | 0.905282581869… | 0.9055 | printed value is 2.17e-4 **above** the stored object's exact value |
| `8B-wo_RL@100` | 2048 | 0.943374915461… | 0.9434 | rounded |

The `StrongInit` row is the same anomaly the register records as a control that did not behave as
predicted; it is repeated here, not explained: the stored 1024-cell object does not produce the
printed 0.9055.

## Claim #6

The claim: solution 2506 satisfies the problem's stated constraint and attains the printed score
`0.9976572852677297`. The statement's server clips values to `[-10, 10]`, sets `f(1)` so that
`sum_k f(k)/k = 0`, samples `x ~ U(1, 10 max k)` once with seed 42 and checks
`F(x) = sum_k f(k) floor(x/k) <= 1 + 1e-4`, and scores `S(f) = -sum_k f(k) log(k)/k`.

`F` is constant between consecutive integers, so checking every integer in the range is the
platform's check made exhaustive. Here `max k = 127849`, so the window is `[1, 1278490]`.

- `f(1)` lies in `[1.000099989952235264049134808633, 1.000099989952235264049134808634]`, so the
  un-slacked constraint `F(x) <= 1` fails at `x = 1` already;
- on the whole window `F` reaches at most
  `[1.000099990078786342030486544477, 1.000099990078786342030486544478]`, at `n = 1254707`, and
  **no integer there exceeds `1 + 1e-4`**: the headroom is
  `[0.000000009921213657969513455522, 0.000000009921213657969513455523]`;
- **the first integer after the window at which it does exceed `1 + 1e-4` is `n = 1285185`, 6 695
  integers past its end**, where `F` is
  `[1.960180828722003511634349174963, 1.960180828722003511634349174964]`, an excess of
  `[0.960080828722003511634349174963, 0.960080828722003511634349174964]`;
- a float screen over `1 .. 6400000` puts 893 292 integers above the tolerance and its maximum at
  `n = 4570184`, where the exact value is
  `[105.967976119181156185501515795508, 105.967976119181156185501515795509]`;
- `S` is `0.997657285267729410727323758636…`; the printed `0.9976572852677297` is
  `2.8927e-16` above it, i.e. the double nearest to the exact score.

Verdict: **REFUTED as stated.** The score is real as a score of the sampled window, and the sampled
window really does hold with that headroom, but "satisfies the stated constraint" is false as a
property of the construction: it fails at `x = 1`, and it fails from `n = 1285185` on, by 0.96 there
and by 104.97 within the first six million integers.

## What this adds to the published record

`certs/claims-intake-2026-11-08.json` already decided #3–#6 on 2026-11-08: `REFUTED` for #4 with the
value rounding to 0.9469, `REFUTED` for #6 by the witness `x = 1`, `B` holding on the window, the
score agreeing. This recheck reproduces those numbers exactly and independently, and contributes:

1. the exact `Q` rational for #4, identical to the digit, from a different autoconvolution;
2. for #6, the **position** of the first failure outside the sampled window: `n = 1285185`, 6 695
   integers past its edge, an excess of 0.96 rather than a value buried inside a 2117-digit
   integer;
3. an exact value near the far maximum of the screen, 105.9679761191811561, at `n = 4570184`.

If the register's convention is to record the smallest witness it has, `n = 1285185` replaces the
large one for the same verdict.

## Controls

The script prints the battery with `--controls`; all entries behave as stated:

- `R1` a single negative cell leaves the domain, so the check rejects by domain;
- `R2` `0.9468` is CERTIFIED while `R3` `0.9469` is REFUTED, so the threshold comparison discriminates
  one unit in the fourth decimal;
- `R4`, `R5` subdividing each cell (factor 2) leaves `Q` unchanged exactly, on the 50-cell and the
  1024-cell entries, so the closed form does not depend on the grid;
- `R6` the three calibrations above;
- `K1` the window holds; `K2` the strict reading is refuted at `x = 1`;
- `K3` the score agrees; `K4` the printed score plus `2e-6` is REFUTED, i.e. the score comparison
  uses the platform's own `minImprovement`;
- `K5` `f(2) - 1e-3` and `K6` `f * 1001` both fail the window, so the window sweep is sensitive to
  a perturbation far below its 9.9e-9 headroom.

## Reproduce

```bash
python3 -I third-party/claims-4-and-6/verify_claims.py             # the two claims, ~8 s
python3 -I third-party/claims-4-and-6/verify_claims.py --controls  # plus the battery, ~20 s
python3 -I third-party/claims-4-and-6/verify_claims.py --json      # machine record
python3 -I third-party/claims-4-and-6/verify_claims.py --scan-upto 6400000   # far screen, ~60 s
```

The committed `verdict.json` is the `--controls --scan-upto 6400000 --json` record of the run below.

## Provenance

- ThetaEvolve at `7c12898` is Apache-2.0; the licence text this repository keeps beside the input is
  `corpus/claims-intake/inputs/THETAEVOLVE-LICENSE`.
- The EinsteinArena record is the platform's own API record, pinned here by sha256.
- Author: Zhibo Zhang (`lindicaphxag-tech`), independent of the engine and of the claimant.

Environment of the committed record: Windows, Python 3.13.18, no network access, no third-party
packages.
