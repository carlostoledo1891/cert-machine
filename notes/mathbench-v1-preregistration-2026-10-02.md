# Certified MathBench v1 — pre-registration, 2026-10-02

Written before any model call (the rerun program's phase 3; the operator's ceiling for everything that costs
money is US$100 in total, of which US$22.30 was spent by v0 on 2026-09-29, so US$77.70 remains). THE RUN IS
HELD: it starts only on the operator's word, after `ant auth login`.

## What v0 measured, and why v1 exists

v0 (notes/mathbench-v0-preregistration-2026-09-29.md; reports/mathbench.html; certs/mathbench-ledger.jsonl, tag
`v0`) asked three models for one object per rung at a cap of 24,000 output tokens. Certified of graded:
claude-haiku-4-5 5/46, claude-sonnet-5 18/21, claude-opus-5 21/23. The last column of the ledger is the finding:
Sonnet ran out of tokens before returning an object on 25 rungs and Opus on 23; Haiku never did (0). Among the
rungs the two stronger models DID finish, almost every object certified. So v0 measured finishing, not
correctness, for the models that matter, and the open question is which of the two the cap was hiding.

## What changes, and what does not

| | v0 | v1 |
|---|---|---|
| families, rungs, prompts, parser, certifier | instruments/mathbench/families.py | THE SAME FILE — pinned by sha256 in environments/certified_mathbench/PROVENANCE.json (the hub environment carries a byte-identical copy); its only edit since v0 is the record loader's second lookup path (no decision touched) |
| models | haiku-4-5, sonnet-5, opus-5 | **sonnet-5, then opus-5**. Haiku is dropped: it was never out of tokens in v0, so a larger cap changes nothing it would measure |
| output cap | 24,000 | **48,000** (double) |
| samples | one per rung | one per rung, same seed, same order |
| thinking / effort | the API's defaults | the API's defaults (unchanged, so the cap is the only variable) |
| ceiling | US$30 | **US$50** (of the US$77.70 left) |
| tag | v0 | v1 |

The command, exactly:

    python3 tools/run-mathbench.py --tag v1 --max-tokens 48000 --models claude-sonnet-5,claude-opus-5 --cap 50

## The ceiling and the stop

Before every harness run the dollars already spent under tag v1 are summed from the ledger's own usage rows; each
call reserves its worst case (48,000 output tokens at the model's rate, plus 4,000 input) against what is left,
and a call that would pass the ceiling is not made. Worst case per call: Sonnet US$0.488, Opus US$1.22; worst
case for all 92 calls US$78.57, which the US$50 ceiling WILL cut if the models use their whole cap — Sonnet runs
first because it is cheaper and will complete (46 × 0.488 = 22.45), leaving at least US$27.5 for Opus, i.e. at
least 22 of its 46 rungs in the worst case. v0's actual spend was far below its worst case (Sonnet US$6.79 for
677k output tokens; Opus US$15.31 for 611k), so the realistic expectation is that both complete under about
US$45. If Opus is cut, the ledger says at which rung, and the rungs it did not reach are reported as NOT RUN, never
as failures.

## What is measured, per model

certified / graded; refuted apart from malformed (no object parsed) and budget-exhausted (the cap reached before an
object: recorded, never graded); certified rungs the baseline (6 of 46) does not certify; output tokens and dollars
per certified rung; seconds per rung. Beside each v0 number.

## The pre-registered reading

- If budget-exhausted FALLS substantially at 48,000 and certified/graded STAYS near v0's rate, the cap was hiding
  finishing: v0's gap was room, and the models' constructions are mostly right when they finish.
- If budget-exhausted falls and certified/graded falls with it, the cap was hiding wrong answers: the longer the
  model works, the more often it returns an object the certificate refutes.
- If budget-exhausted does NOT fall, 48,000 is still not room, and v2 would need the effort setting or a different
  ask (a construction procedure rather than the object), not a larger cap.

## What would count as a null

No beyond-the-record rung certified (capset 237 in dimension 7; 73 words of length 10 at distance 3; R(4,6) > 36;
c = 1.7789889; 41 kissing spheres in dimension 5). A certified row on any of those is NOT announced from this run:
it is re-decided by a second, independent implementation first, and the page says so only then.

## Deviations

None yet. Any deviation during the run is written here, dated, before the results are read.
