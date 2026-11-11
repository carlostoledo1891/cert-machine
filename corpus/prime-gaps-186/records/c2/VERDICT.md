# Prime gaps 186 — C2, the three cap bounds, clean-room: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14) and the brief pg186/c2/BRIEF.md, sealed with it. The author: a separate session
given only `Challenge.lean`, the numerics note and the paper. **This decides three inequalities of the axiom. It does
not touch the other 149, and it does not verify the bound 186.**

## Gaps first

1. **The first-hour rule was not followed to the letter.** The author's first estimate of I_H was 2.36057·10⁻¹⁴
   (0.34% off; the rule asked for five digits and said STOP). It did not stop: it diagnosed truncation in a 128-bit
   fixed-point convolution, checked its coefficient table against the Lean text and its engine against brute force
   on a small analogue, raised the width to 288 bits WITHOUT changing its reading, got 2.3685317853330·10⁻¹⁴, and went
   on. It disclosed all of it. I accept the result; the deviation stands in the record.
2. **Measurability is assumed, not checked.** The enclosures are of the intended mathematical objects. In Lean,
   `Measure.map` of a non-measurable map and the integral of a non-integrable function are 0 by convention; that the
   maps in `fragmentLaw` and the integrands are measurable for Mathlib's σ-algebra on `FiniteMeasure ℝ` was not
   verified by anyone here.
3. One identity is proved by the author only in sketch (the total mass of the capped process has Dickman density);
   the note states it (pp. 1, 12) and it is classical.
4. The independence rests on the author's own account of what it read (its list: the brief, `Challenge.lean`, the
   note; the paper not opened). The harness also showed it this repository's instructions and a memory index, one
   line of which names the project with no technical content.
5. One author, one program. The orchestrator replayed it; nobody re-derived it.

## Verdict: CERTIFIED — all three inequalities, on the points named in gaps 2 and 3

Units of 10⁻²⁴; lower ends rounded down, upper ends up.

| quantity | enclosure | the axiom's bound | margin |
|---|---|---|---|
| `trialIH` | [23685317853.330202720169676610805381440399621412, …637335] (width < 1.6·10⁻³²) | ≥ 23685317816 | 37.33 |
| `trialIH` | the same | ≤ 23685317890 | 36.67 |
| `trialJLambdaH` | [90248755654.713130346416300956888370046870733480, …798757] | ≥ 90248755123 | 531.71 |

- Python standard library only (`int`, `fractions`, `decimal`); no floating point in the deciding path; Dickman cell
  masses by closed forms and series with explicit tails, not the note's recurrence; 1,764 large products each
  re-checked modulo 2⁶¹ − 1. Program `pg186_c2.py` sha256 `f61c20dc…4804`; 12 min 50 s on the Mac.
- **Replayed by the orchestrator** from a clean copy holding only that file: exit 0, the five enclosures and the mesh
  control identical to the author's.
- **Against the claimant's own run (C1):** each of our enclosures lies inside the enclosure the replayed certificate
  prints for the same quantity (results/pg186/c1/crosscheck-c2.txt).

## Red controls

| planted | predicted | result |
|---|---|---|
| the mesh denominator 98304 made 98305 | leaves the window | leaves it: I_H ≈ 23690795402 (relative +2.3·10⁻⁴) |
| one coefficient changed by one unit (entry (0,0)) | leaves the window | **does NOT leave it** — my prediction was wrong. The value moves by −0.84 units and the two enclosures are disjoint (the program sees the change), but the window is ±37 units wide. None of the 154 single-unit changes leaves it; entry (0,0) must move by +45 or −44. |

A finding, small but real: **the cap bounds do not pin the 77 coefficients.** They are pinned elsewhere (the Lean
table is the definition), so nothing is wrong; but the window is a statement about the trial to about nine digits,
not an identity check of its data.

## Predictions, graded

The first-hour check passes (70%) — on the second attempt (see gap 1). CERTIFIED in this session (35%) — yes.
REFUTED (under 2%) — no.

## Files

`../../../pg186/c2/work/` (the program with its derivation as its head comment, `results.json`, the first-hour runs,
the checks, `run_all.log`); the 2.6 GB of intermediates were deleted by the author and regenerate with
`python3 pg186_c2.py all`.
