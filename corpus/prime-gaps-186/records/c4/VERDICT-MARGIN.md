# Prime gaps 186 — the margin on our own numbers: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14), "the fallback the proof actually needs"; the brief pg186/c4/BRIEF-MARGIN.md,
committed before the author started. The author: a fourth clean-room session, given the three spec files and the
result files of C2 and C3. **This assembles numbers. It says nothing about whether the Lean integrals are below the
note's forms, and it does not verify the bound 186.**

## Gaps first

1. **The combination rule is not in `Challenge.lean`.** The Lean statement file gives the tables, the units, the
   words "upward-rounded" and "weighted", the reference value and the axiom; the formulas (the Young combination of
   an outer row, the two inner weights, the final inequality) are in the note and the paper, and the Lean proof that
   uses them is in the proof file, which the clean-room author was not given. So the word is "certified under the
   rule as the note and the paper state it", cross-checked as below — not "as the Lean file states it", which is
   what the brief asked.
2. The inputs are the 149 clean-room upper ends and the cap enclosures, with every caveat of their own records (the
   object is the note's majorant; one unprinted test read literally for the L rows; hand proofs unreviewed at the
   time of writing; measurability assumed).
3. The author used `pdftotext` on the two permitted PDFs, beside the Read tool — a departure from the brief it
   flagged itself; the files were permitted, the tool was not named.
4. Not replayed by the orchestrator (a few seconds of exact arithmetic; the program and its inputs' hashes are in
   the results file).

## Verdict: MARGIN CERTIFIED on our numbers (under the rule of the note and the paper)

| | total loss T (units of 10⁻¹² of the reference value) | normalised margin | against the stated 1/50000 | against the required 0 |
|---|---|---|---|---|
| the printed integers (the paper's own check, re-derived) | 696,075,110 | 2.3360452297·10⁻⁵ | holds (×1.168) | holds |
| **our 152 numbers** | **696,075,106** | **2.3367894445·10⁻⁵** | **holds (×1.168)** | **holds** |
| ours, the worst case over the readings not adopted | 696,075,106 | 2.3367894445·10⁻⁵ | holds | holds |

- **The rule reproduces the claimant's arithmetic exactly.** All 97 printed budgets equal the rule's ceiling; the
  group totals and T match the note's Table 2.7; and the margin re-derived from the printed integers,
  2.3360452297044097·10⁻⁵, is the margin the replayed certificate prints (C1's receipt), digit for digit — by a
  session that never saw the certificate. The inner weights are forced by the data (45 of 45 rows with the note's
  assignment, 7 of 45 with the two swapped).
- With our numbers four budgets drop by one unit and none rises. The readings in dispute upstream cannot touch the
  result: taking the larger value wherever a reading was open changes seven row numbers and leaves T where it is.
- **Room.** Against the threshold the proof needs (the margin positive), the total loss could grow by 12.8% before
  failing; against the 1/50000 the papers state, by 1.84%. The same figures are the uniform factor by which every
  row bound could be inflated.
- The threshold: the paper's Proposition 4.6 needs only positivity; 1/50000 is what the note and the paper state
  and prove through a coarser chain (230382667/10¹³).

Program `pg186_c4_margin.py` sha256 `d533d7fe…ce0f`; results `results_margin.json` `82ff119b…50c3`
(`pg186/c4/work/`).
