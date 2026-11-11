# Prime gaps 186 — C3 stage (ii), the remaining P rows, clean-room: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14) with amendment A; the brief pg186/c3/BRIEF-STAGE-II.md (committed before the
stage). The author: the first clean-room session (C2, stage (i)). **This decides 24 more of the 149 row bounds, for
the note's MAJORANT, not for the Lean integral. It does not prove the axiom and does not verify the bound 186.**

## Gaps first

1. **Two of the 24 values are NOT inside the claimant's own interval** (the cross-check below): they lie just BELOW
   its lower end. All 24 are below its upper end and below the printed integer, so the pre-registered word is AGREES
   for all 24; but for those two rows the two computations do not enclose the same number, and why is not
   established. Until it is, those two are "AGREES, not concordant".
2. The object, the links and their status are as in stage (i): the note's majorant in its ideal form; the Mecke
   formula relied on; the other links proved by the author by hand, unreviewed; measurability assumed.
3. Two new readings taken literally and not tested the other way: the "largest group cap" for the order-two outer
   rows (the note's remark after (2.17)), and P(0, z_G) = {2, 3} there.
4. Not replayed by the orchestrator (stage (i)'s replay does not cover this program, `pg186_c3ii.py`). Owed.
5. The author did not use the shared pod; it ran on the Mac inside the six-worker limit.

## Verdict: AGREES — 24 of 24 (with gap 1)

The six P rows of the order-two outer table (root and face: 12 integers) and the twelve P rows of the four inner
tables (12 integers): every enclosure (width ≤ 6.1·10⁻²⁸) lies below the printed integer, by 5·10⁻¹⁰ to 5·10⁻⁹
relative. With stage (i), **all 48 integers of the 30 P rows are decided AGREES.** Program `pg186_c3ii.py` sha256
`6214f703…f1ea`; results `results_iia.json` (`76dc4dfc…`), `results_iib.json` (`c7e53085…`).

## Against the claimant's own run (C1), `crosscheck-c1-stage-ii.txt`

- 22 of 24 inside the claimant's raw interval for the same form; each printed integer is the ceiling of that
  interval's upper end (24 of 24).
- **Outside, below the lower end:** I₂ old P1: ours 4871216697400.82, theirs [4871216697487.60, …699916.71] — 86.8
  units below (1.8·10⁻¹¹ relative). I₅⸝₂ new P1: ours 4234127550624.30, theirs [4234127552798.35, …556193.60] —
  2,174 units below (5.1·10⁻¹⁰ relative).
- What I can and cannot say. The claimant's interval encloses the form as ITS program evaluates it, with its own
  outward-rounded ingredients; ours is the ideal value. If the claimant's ingredients are majorants (the note's
  "chosen" Dickman upper sequence, for one), its whole interval can sit above the ideal, and "inside" was never
  guaranteed — in the 46 other P integers and the 8 H integers ours sits at 10% to 50% of the way up. That is a
  hypothesis, NOT a finding. The other possibility is that our value is slightly low on these two rows, which the
  word AGREES cannot detect. A follow-up is ordered: the same form on those two rows with the note's recurrence in
  place of the exact Dickman values.

## The controls (two-sided, predictions written into the program before the runs)

| part | planted | predicted | result |
|---|---|---|---|
| (ii-a) O₂ P1 | mesh 98303 | above printed | BELOW — the prediction was wrong in direction |
| (ii-a) O₂ P1 | mesh 98305 | not above | ABOVE (by 9.7·10⁻⁴ and 1.0·10⁻³) |
| (ii-b) I₅⸝₂ old P1 | mesh 98303 | above printed | above (by 1.0·10⁻³) — as predicted |
| (ii-b) I₅⸝₂ old P1 | mesh 98305 | not above | below — as predicted |

Both controls turn red on one side and not on the other; for the order-two outer row the side is the opposite of the
one the author predicted, and of the five-halves rows. The author did not analyse why.

## The author's notes worth keeping

Margins have a pattern (inner rows 5–7·10⁻¹⁰, I₅⸝₂ new P1 an outlier at 1.3·10⁻⁹; outer roots about 2·10⁻⁹; outer
faces 2.7–5.3·10⁻⁹) — the outlier is one of the two rows of gap 1. The Lean file and the note agree on every
geometric number used.

## Addendum (2026-11-10 19:25 UTC): gap 1 is explained — the benign reading holds

The H-row author, given only the question "how far does the value move" and no target, recomputed the two rows
(`pg186/c3h/work/results_followup.json`; `crosscheck-c1-followup.txt`):

- It reproduces the first author's exact-Dickman values to all printed decimals.
- With the Dickman values taken from the note's recurrence (2.1) AS (2.9) WRITES THEM (the upper sequence d̄ in the
  upper slots, the lower sequence d in the subtracted ones), the values rise by 2.67·10⁻¹⁰ and 9.14·10⁻¹⁰ relative
  and land **at the exact midpoint of the claimant's interval, position 0.5000, in both rows**; both stay below the
  printed integers.
- So the claimant's interval encloses the note's form as the note writes it, with the recurrence's sequences; the
  first author enclosed a slightly smaller quantity, the same form with the exact function ("ideal"). Both are upper
  estimates below the printed number. The two rows are concordant once the same form is computed. The "inside"
  positions of 10% to 47% seen on the other P integers are the same effect, smaller.
- Kept honest: this was checked on TWO rows. That the exact-function form is itself a valid majorant is the first
  author's argument (monotone positive combination), unreviewed. The renewal majorant, the note's other upper
  sequence, would put one of the two rows 1.5·10⁻⁵ ABOVE its printed integer: the table was not computed with it
  there, as the note's own rule says it should not be.
- A by-product, an estimate and not a decision: for these two rows the distance from the ideal value to the printed
  integer is accounted for, to about half a percent, by two sources only — the recurrence's slack and the
  double-precision error term of the final sums.

The word for all 24 stays AGREES; "not concordant" is withdrawn for the two rows.
