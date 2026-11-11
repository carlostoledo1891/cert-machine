# Prime gaps 186 — C3 stage (i), the 12 heaviest rows, clean-room: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14); the stage's brief pg186/c3/BRIEF-STAGE-I.md (sealed with C1/C2's results, seal
15, before this stage's result existed). The author: the same clean-room session as C2, working only from
`Challenge.lean`, the numerics note and its own C2 files. **This decides 24 of the 149 row bounds, for the note's
MAJORANT, not for the Lean integral. It does not prove the axiom and does not verify the bound 186.**

## Gaps first

1. **The object.** What is enclosed is the ideal value of the note's computational form ((2.17) root, (2.21) face).
   That the Lean-defined integral is at most that form is a chain of statements of the note; the author reports
   proving each link itself EXCEPT the Palm/Mecke formula for the largest fragment ((1.39)–(1.40), cited by the note
   to Last–Penrose, Theorem 4.5), which is relied on, and the measurability assumption already named in C2. Nobody
   checked the author's proofs of the other links: they are in the head comment of `pg186_c3.py`, unreviewed.
2. **Three conventions were read one way and not tested the other way** (the author's list): point values against
   cell integrals in (2.9); the "may be multiplied / may be capped" fractions of Lemmas 1.7 and 2.4 (applied);
   β_j = 0 below the bin (taken literally). The nine-digit agreement supports each reading; it does not prove it.
3. **Not replayed by the orchestrator** (40 minutes and 6 GB on a Mac that was swapping). Owed. In its place: the
   cross-check below against the claimant's own intervals, which is evidence of a different and stronger kind.
4. **The main run was interrupted once** (memory thrash after 27 minutes; the author stopped its own processes,
   patched orchestration only — resume, a fresh process per task — and resumed; 13 base stages and 63 of 364 task
   files come from the first run; three of them reproduced byte for byte by the patched program).
5. The independence rests on the author's own list of what it read (the brief, `Challenge.lean` lines 464–895, the
   note; the paper not opened; nothing else).

## Verdict: AGREES — 24 of 24

For each of the 12 rows labelled P of the outer five-halves table, root and face: the enclosure [m⁻, m⁺] of the note's
form (width ≤ 1.7·10⁻²⁸ in table units) lies below the printed integer, by 1.4·10⁻⁹ to 2.3·10⁻⁹ relative. No row is
UNDECIDED and none DIFFERS. These 12 rows carry 79% of the proof's loss. The table is in
`pg186/c3/work/results.json`; program `pg186_c3.py` sha256 `75bec4be…616a` (it imports the unchanged C2 program).

**Against the claimant's own run (C1), `crosscheck-c1-stage-i.txt`:** for all 24, the clean-room value lies INSIDE
the raw interval the replayed certificate prints for the same form (at 10% to 43% of the way up it), and the printed
integer is the ceiling of that interval's upper end in all 24. Two computations that share no code and no library
agree on the 12 rows that matter most, and the way the printed numbers were rounded is confirmed.

## The red control

| planted | result |
|---|---|
| mesh denominator 98304 made 98305 (as the brief asked), row P1 | does NOT exceed: the values move DOWN by 3.3·10⁻⁴ and 4.2·10⁻⁴. An upper-bound test cannot see this change. |
| mesh denominator 98303 (the author's addition) | both integers EXCEEDED, by 3.3·10⁻⁴ and 4.2·10⁻⁴: would be DIFFERS. |

The control as I wrote it was one-sided and could not turn red. The author noticed and ran the mirror. The program
moves by about 3·10⁻⁴ for a 10⁻⁵ change of mesh, against margins of 2·10⁻⁹.

## Findings worth keeping

- **The printed integers are not reproducible from the note alone to their last digits**: they sit 1.4–2.3·10⁻⁹ above
  the ideal form, because they are the ceiling of the authors' own outward-rounded endpoint (confirmed by C1's
  receipt). A reader with only the note can confirm them as upper bounds, not regenerate them.
- The sanity estimate (row P1, doubles, before any rigorous code) agreed to 8 digits on the first attempt.
- The author's estimate for the rest: the 6 P rows of the order-two outer table, half a session; the 12 inner P
  rows, half to one; the 6 H rows, one; the 61 L rows, two or more, and likely UNDECIDED by convention (the note's
  "chosen exact majorant" for the low rows depends on an acceptance test between two recurrences).

## Predictions, graded

Stage (i) reached in the first working session (30%) — yes. At least one row UNDECIDED for a convention (70%) — not in
this stage; the author expects it in the L rows.

## Addendum (2026-11-10 18:40 UTC): the owed replay is done

Gap 3 is closed. On the shared pod (Linux x86-64, Python 3.12.3), from empty directories, the two programs unmodified
at the absolute paths they hard-code: the C2 program (12 min 42 s) gives the five enclosures and the mesh control
identical to the author's; the stage (i) program (`prep`, then `all 0`; 49 min 39 s) gives **24 of 24 enclosures
identical to the author's, words included**, and the same 98305 control (`replay-stage-i.txt`). The author's run was
on macOS arm64 under Python 3.9; the replay shows the result does not depend on the interrupted-and-resumed run.
