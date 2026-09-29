# Certified MathBench v0 — pre-registration, 2026-09-29

Written before the first model call (attack plan A1, notes/attack-plan-2026-09-29.md; the operator's
ceiling is US$100 for everything that costs money, and this run takes at most US$30 of it).

## What is asked

Seven construction families (instruments/mathbench/families.py), each asking for an exhibited object and
deciding it exactly — no answer key, no judge, no tolerance:

| family | the object | the ladder (rungs) | beyond the record |
|---|---|---|---|
| golomb | a Golomb ruler with n marks and length ≤ L | n = 6, 8, 10, 11, 12, 13 at the optimal lengths | — (all optimal) |
| capset | a cap of size k in F_3^n | (3,9) (4,20) (5,45) (6,112) (7,236) (7,237) | 237 in dimension 7 |
| code | a binary code (n, M, d) | (7,16,3) (8,20,3) (10,72,3) (12,144,4) (16,256,6) (10,73,3) | 73 words, length 10, distance 3 |
| ramsey | a graph with no K_s and no independent t-set on n vertices | R(3,4)>8, R(3,5)>13, R(4,4)>17, R(3,6)>17, R(4,5)>24, R(3,9)>35, R(4,6)>36 | R(4,6) > 36 |
| sumdiff3b | a law on Z² with H(X−Y) ≥ c·max(H(X),H(Y),H(X+Y)) | c = 1.6 … 1.77898884 (the record), 1.7789889 | c = 1.7789889 |
| kissing | k equal-norm integer vectors, pairwise ≥ 60°, span ≤ n | K(3..8) = 12, 24, 40, 72, 126, 240; 41 in dimension 5 | 41 in dimension 5 |
| polymulF2 | a rank-R bilinear algorithm for n-term polynomial products over F2 | (n, R) = (2,3) (3,6) (4,9) (5,13) (6,17) (7,22) | — (the published ranks) |

Every rung with a witness on record carries a GREEN control that must certify, and near-misses forged from
it (RED controls) that must refute, before any model is asked (instruments/mathbench/battery.py: 28 green,
20 red).

## Who is asked

- **baseline**: each family's `baseline()` — the textbook first try (greedy ruler, lexicographic cap,
  lexicode, quadratic-residue circulant, uniform law on {0,1,2}², the D_n roots, schoolbook
  multiplication), decided like any proposal. A rung the baseline certifies measures nothing about a model.
- **claude-haiku-4-5-20251001**, **claude-sonnet-5**, **claude-opus-5**, in that order, ONE sample per
  rung, at the API's default thinking and effort, streaming, max_tokens 24,000. The keys on this machine
  reach Anthropic's models only; no other lab is asked in v0.

## What is measured, per model

certified / graded; refuted (a proposal the certificate proves wrong) apart from malformed (no object
parsed) and budget-exhausted (the output cap reached before an object: recorded, never graded); certified
rungs the baseline does not certify; output tokens and dollars per certified rung; seconds per rung.

## The ceiling and the stop

US$30 for the campaign (tools/run-mathbench.py): before every harness run the dollars already spent under
tag v0 are summed from the ledger's own usage rows, and each call reserves its worst case (24,000 output
tokens at the model's rate, plus 4,000 input) against what is left; a call that would pass the ceiling is not
made, and the stop is printed. Rates: the claude-api skill's table cached 2026-06-24.

## What would count as a null

If no model certifies a rung the baseline does not, v0 says so: the families' easy rungs are recall and the
hard ones out of reach at one sample. A certified row on a "beyond the record" rung is NOT announced from
this run: it is re-decided by a second implementation first.
