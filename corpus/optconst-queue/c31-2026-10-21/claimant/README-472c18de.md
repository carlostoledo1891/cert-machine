# An improved upper bound on the binary Chvátal–Sankoff constant

For two independent uniformly random binary strings of length n, the expected length of
their longest common subsequence is γ₂·n + o(n), where γ₂ is the binary Chvátal–Sankoff
constant. Its exact value is unknown (simulations suggest about 0.812). The best upper bound
since 2009 has been **γ₂ ≤ 0.826280**, due to Lueker [L2009], obtained with his automaton at
history length h = 8.

Running Lueker's method at history lengths h = 9 and h = 10 gives

| h | accepting states | z | λ(z) ≤ | upper bound on γ₂ |
|---|---|---|---|---|
| 8 (Lueker 2009, Table II) | 6,419,109 | 0.3209 | 0.341832259 | 0.826280 |
| 9 | 51,425,006 | 0.3298 | 0.364708361184292 | **0.825101** |
| 10 | 400,253,317 | 0.3376 | 0.385532705434511 | **0.824120** |

so **γ₂ ≤ 0.824120**. The λ values for h = 9 and 10 are the certified ones (decimal values rounded
up; exact doubles `0x1.75761bcf75075p-2` and `0x1.8ac915e584bc4p-2`), and each z is the exact
double nearest to the decimal shown.

## The method (Lueker 2009, Section 3)

Theorem 3.3 of [L2009] (after Dančík and Paterson [DP1995]): let M be a finite automaton that
reads lists of minimal match pairs and never rejects the canonical decomposition of a pair of
strings. If, for some z in (0, 1/2), the weighted transition matrix A_z of M satisfies
A_z v ≤ λ v for a positive vector v and some λ in (0, 1), then γ₂ ≤ 2 log(2z) / log λ.

Lueker's automaton M_h remembers the last h characters of each string and the last h
differences in the last row and column of the dynamic-programming table (Figure 7 of the
paper), and his proof that M_h has the covering property holds for every h. The weight of the
input T_{c,l} is z^{|l|+2} for |l| < h − 1 and z^{h+1}/(1 − z) for |l| = h − 1. Nothing in the
method is new here; what is new is the size of the computation. Lueker's paper stops at
h = 8.

## What was checked

1. **Lueker's own programs.** His 2009 Java code (https://ics.uci.edu/~lueker/papers/lcs/code/),
   compiled unmodified with Java 27, builds tables identical to ours transition for transition
   for h = 2, …, 8 (91,508,397 accepted transitions at h = 8, no mismatch), and his `GenFn` gives
   λ(0.3209) = 0.341832258734487 at h = 8, the same 15 digits as `lcs_upper`, and certifies his
   0.826280. His unmodified `State.transition` agrees with our h = 9 table on 200,000 random
   states (6.8 million transitions) and with our h = 10 table on 200,000 random states
   (7.6 million transitions), with no mismatch.
2. **Lueker's Table II.** `lcs_upper` gives exactly his numbers of accepting states for
   h = 2, …, 8 (7, 98, 1020, 10160, 89960, 780368, 6419109) and the same λ(z) to all nine printed
   digits at his values of z, hence the same bounds (0.845855 … 0.826280).
3. **Every transition re-derived.** `review/fullcheck.c`, a separate implementation of
   Figure 7 written separately in a fresh review pass (not by an independent person; it is part
   of my own checking), re-derived all 1,748,450,204 transitions of the
   h = 9 table and all 15,209,626,046 transitions of the h = 10 table, with no mismatch.
4. **Covering property, directly.** For random binary string pairs the canonical decomposition,
   computed by the full dynamic program, is a list of minimal match pairs followed by a null
   pair, and the automaton never rejects it (`src/check_cover.py`; and `review/covertest.c`, which
   biases the strings toward long runs so that the truncation μ is exercised: about 3.4 million
   canonical steps for h = 2, …, 10, including 189,000 truncated inputs, no rejection).
5. **Two builders, identical tables.** `lcs_upper_big` (parallel, low memory) writes tables
   byte-identical to those of `lcs_upper`. The compact format used for the h = 10 power
   iteration is produced by `lcs_compact convert`, which also checks that for every state the
   accepted paddings form one interval containing 0.
6. **Rigorous certificate.** `verify_cert` (in memory) and `verify_cert_stream` read the raw
   table and a vector v (taken as exact doubles, all positive), set the rounding mode upward in
   every worker thread (with a self-test), and compute λ_cert = max_s (A_z v)_s / v_s using
   weights rounded upward from 80-digit values. `certify.py` then evaluates
   2 log(2z)/log λ_cert in interval arithmetic and rounds up to six decimals. It re-certifies
   Lueker's h = 5, …, 8 bounds. The review pass's single-threaded `review/myverify.c` gives the
   same λ_cert bit for bit, and a version that does not depend on the rounding mode at all
   (round to nearest, then inflate by (1 − 2⁻⁵³)⁻³⁶) gives λ ≤ 0.38553270543451351 at h = 10,
   whose bound 0.824119783256… (`review/finalbound.py`, 60-digit arithmetic) is still below
   0.824120.

## Reproducing

```
make
mkdir -p data
./lcs_upper build 9 data                      # 7.4 GB table, about 7 minutes
./lcs_upper eigen 9 data 0.3298               # power iteration, about 5 minutes
VERIFIER=./verify_cert_stream python3 src/certify.py 9 data
# prints CERTIFIED: gamma_2 <= 0.825101  (needs mpmath)
```

For h = 10 (64 GB of disk for the raw table and 27 GB for the compact one; about 10 GB of memory):

```
./lcs_upper_big build 10 data 30              # about 35 minutes on 10 cores
./lcs_compact convert 10 data
./lcs_compact_f32 eigen 10 data - 0.3376      # about 90 minutes; float storage, double sums
VERIFIER=./verify_cert_stream python3 src/certify.py 10 data
# prints CERTIFIED: gamma_2 <= 0.824120
```

The tables are deterministic; their SHA-256 sums are in `certificates/SHA256SUMS.txt`. Any
positive vector gives a valid certificate (the power iteration only has to make it good), so the
vectors are not needed to check the claim; their checksums are listed for reference, and they
are available on request (0.4 GB and 3.2 GB). `certificates/` also holds the upward-rounded
weights and the full output of `certify.py` for both runs.

## References

- [L2009] G. S. Lueker, Improved bounds on the average length of longest common
  subsequences, *J. ACM* 56(3), Article 17 (2009). https://doi.org/10.1145/1516512.1516519
- [DP1995] V. Dančík and M. Paterson, Upper bounds for the expected length of a longest
  common subsequence of two binary sequences, *Random Structures & Algorithms* 6(4) (1995),
  449–458.
- [CS1975] V. Chvátal and D. Sankoff, Longest common subsequences of two random sequences,
  *J. Appl. Probab.* 12(2) (1975), 306–315.

I use a large language model to help write and check this code. Every number above was checked
as described in "What was checked", including against Lueker's own programs.
