# bgp212-witness: the certificate premise of the 212, decided for a published witness

Axiom Math's Lean proof of H_1 <= 212 ([AxiomMath/BGP212](https://github.com/AxiomMath/BGP212), commit `6641780`) is
conditional on `Gap212Certificate` in `Gap212Challenge/Basic.lean`: a symmetric, square-integrable F supported on
T_45 of `gap212Params` with 0 < Iint(F) < 45 * Jint(F). No witness was published with it (our question,
[issue #2](https://github.com/AxiomMath/BGP212/issues/2), 2026-11-12). On 2026-11-15 Fredrik Prüzelius published one
there (pruzze/bounded-gaps-witnesses). This folder decides his F with code written from scratch.

**Verdict: CERTIFIED** for his degree-21 witness: I(F) > 0 and 45·J(F) − I(F) > 0, both exact rationals.
45·J(F)/I(F) = 1.0010960245836503300623348951022271989430895579684896438083… (387-digit numerator and denominator), and
his exact fraction (a dilated value, x = 4t) equals our 45·J(F~)/I(F~) digit for digit. His degree-20 witness gives
1.00060034425677288922891949831393627888…, also above 1. The record is `certs/bgp212-witness.json`; the inputs and
outputs are pinned in `corpus/bgp212-witness/PROVENANCE.json`.

## What this is not

- Not a Lean proof of `Gap212Certificate`, and not the authors' own F (their P* of Theorem 11.1 is unpublished).
- Nothing about the analytic premises of the 212 ([issue #1](https://github.com/AxiomMath/BGP212/issues/1)).
- Symmetric, MemLp 2 and vanishing off T are argued (F is the indicator of T times a symmetric polynomial), not computed.

## Independence

Written with Claude in one session, from the Lean definitions, his README's coordinates and form of F~, and the
witness files. Nothing under his `witnesses/src/` was opened, searched or run, and no other implementation was
consulted. What the two computations share is the input, not the method.

## How

- F~² is expanded in monomial symmetric functions (`core.py`, a structure-constant counter checked by brute force).
- I = I0 − I1: the plain simplex by the Dirichlet formula, minus the part where m large coordinates break the cap C(m).
- J = J0 − J1 + J2 + J3: the marginal over the simplex; minus the q that break their own cap; plus the regions where
  the cap (C(m+1) − U) and the threshold g cut the x-range (`decomp.py`).
- Each group of coordinates goes through transforms in w = 1/p and z = e^(−gp); the bound g on small coordinates by
  inclusion–exclusion, the window on U by a tail shift (`prep.py`).
- The heavy sums run in C modulo 92 primes below 2³¹ with scalar operations only (`kernel.c`, GMP; no FLINT), and are
  combined by the Chinese remainder theorem (`crt.py`) with a denominator multiple derived from the formulas and the
  bounds 0 ≤ I ≤ I0, 0 ≤ J ≤ L·I. Twelve spare primes reproduce the same integers. No floating point enters the decision.

## Validation (does not use the decomposition)

- `polytope_check.py`: at k = 2 and 3, I and J by exact integration over explicitly enumerated polytopes from the
  pointwise definitions: 12 cases, equal as rationals.
- `test_mc.py`, `test_mc45.py`: Monte Carlo from the pointwise Lean definitions at k = 2, 3, 4, 5 and 45: |z| ≤ 1.8.
- `test_kernel.py`: the C kernel against the exact reference, piece by piece, at k up to 45 (15 cases).
- `test_units.py`: the whole d21 run in units of 1/2500 instead of 1/1250 gives the identical fraction.
- `mc_strat.py`, `mc_corr.py`: the real witness in 45 dimensions, stratified by the number of large coordinates; the
  cap corrections alone, importance-sampled. Plain uniform Monte Carlo failed in 45 dimensions (the witness has almost
  no mass where the uniform measure sits) and was not used; the failures are kept in the outputs.

## Re-running (about 2 minutes on 4 cores, Python 3 with mpmath, a C compiler and GMP)

```
cd instruments/bgp212-witness && mkdir -p logs work
cc -O3 -o kernel kernel.c -I/opt/homebrew/include -L/opt/homebrew/lib -lgmp
python3 run_real.py ../../corpus/bgp212-witness/witnesses/axiom212_k45_d21.json d21
./run_kernel.sh d21 4
python3 crt.py d21 ../../corpus/bgp212-witness/witnesses/axiom212_k45_d21_exact_ratio.txt
```

`work/d21/crt_result.json` then says `his_ratio_equals_our_dilated: true`. `node tools/record-bgp212-witness.js --check`
re-checks the record's exact claims in BigInt arithmetic from the pinned outputs, without the kernel.
