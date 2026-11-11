# Prime gaps 186 — phase C, the numerical axiom: where it stands (2026-11-10, end of day)

Rules: PREREG-PG186-C.md (seal 14), amendment A. Records: `../c1/VERDICT.md`, `../c2/VERDICT.md`, and in this folder
`VERDICT-STAGE-I.md`, `VERDICT-STAGE-II.md`, `VERDICT-H.md`, `VERDICT-L.md`. **Phase C decided numbers. It does not
prove the axiom, and it does not verify the bound 186.**

## What no computation here closes (read this first)

1. **"Integral ≤ majorant."** The axiom bounds 149 integrals. Every program — the claimant's and ours — computes the
   note's upper estimates of them. That each integral is at most its estimate is the note's Lemmas 1.5–1.7 and
   2.2–2.4; our three authors report proving most links by hand and relying on two (the Palm/Mecke formula; the
   delay enclosure of the Dickman function). Nothing is formalized; nobody reviewed the hand proofs.
2. **Measurability.** All enclosures are of the intended mathematical objects; that Lean's `Measure.map` and `∫`
   are not the zero conventions here was checked by nobody.
3. **Readings.** One ingredient of the L rows is selected by a test the note does not print (VERDICT-L, gap 1); a
   few conventions of the P rows were read one way and not tested the other. The agreement with the claimant's own
   intervals supports the readings; it does not prove them.
4. **One-sidedness.** For the 149 rows only "our value ≤ the printed bound" can be decided from the note. A printed
   bound that is too generous cannot be detected, and on most L-row face integers the bound is generous by a floor
   of thousands of units.
5. **Independence is by construction and by the authors' own accounts**: three sessions given a folder with the
   Lean file, the note and the paper, a sealed brief, and later each other's programs; never the claimant's program,
   the scout's report or the replay's output. They share one orchestrator and one product engine (the first
   author's), re-checked product by product modulo 2⁶¹ − 1.
6. The first two axioms (phases A, A′) remain decided on primes below 2,000 only.

## The table

| part | what | result |
|---|---|---|
| C1 | the claimant's certificate, unmodified, on FLINT 3.6.0 + the one cited correction | REPRODUCED: passed; 152 of 152 integers equal the Lean tables |
| C2 | the three cap bounds, clean-room | CERTIFIED (on the points above); replayed twice, identical; inside the claimant's enclosures |
| C3 P rows (30 rows, 48 integers) | clean-room | AGREES 48/48; stage (i) replayed identical; concordant with the claimant's intervals (two rows only after computing the note's form as written) |
| C3 H rows (6 rows, 8 integers) | clean-room, second author | AGREES 8/8; all inside the claimant's intervals, seven at the midpoint |
| C3 L rows (61 rows, 93 integers) | clean-room, third author | AGREES 93/93 under the literal reading of one unprinted test; all inside the claimant's intervals |

**All 149 row bounds and the three caps are now decided by programs that share no code with the claimant's, and
every one of the 152 values lies inside the interval the claimant's own replayed run prints for it.** Each printed
row integer is the ceiling of that interval's upper end (149 of 149).

## Not done

- **The margin on our own numbers** (the pre-registration's "fallback the proof actually needs":
  ρ*(J⁻ − L⁺)/I⁺ − 1 > 1/50000 with our enclosures and the Lean file's Young combination). All the inputs now exist;
  the assembly was not run.
- Replays by the orchestrator of stage (ii), the H rows and the L rows.
- A review, by anyone, of the three authors' hand proofs of the links.

## Money

Pods of phase C: US$0.87 (C1) + US$4.62 (C3) = US$5.49 of the US$25 limit. Both deleted, 404 confirmed.

## Addendum (2026-11-10, night; nothing above is edited)

The three items of "Not done" are now done, each with its own record and its own gaps:

- **The margin on our own numbers: CERTIFIED** under the rule as the note and the paper state it —
  `../c4/VERDICT-MARGIN.md` (total loss 696,075,106 against the printed 696,075,110; room 12.8% to positivity).
- **The orchestrator's replays: every recorded number came back** — `REPLAY-2.md` (one difference of form in the
  L author's row files, named there).
- **A review of the hand derivations: no link found wrong; 2 of 33 not re-derived** — `../c4/VERDICT-REVIEW.md`.
  Point 1 above ("nobody reviewed the hand proofs") and point 2 ("measurability … checked by nobody") are
  superseded by that record: a fourth session reviewed them, and the claimant's own Lean proves that the fragment
  law is a probability measure. Point 1's substance stands: nothing is formalized end to end, and no human has
  read the derivations.

Money, phase C: US$0.87 + US$4.62 + US$2.92 = US$8.41 of the US$25 limit. All three pods deleted, 404 confirmed.
