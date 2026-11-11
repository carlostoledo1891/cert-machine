# Prime gaps 186 — C3, the 61 L rows, clean-room: the record (2026-11-10)

Rules: PREREG-PG186-C.md (seal 14) with amendment A; the brief pg186/c3/BRIEF-L.md, committed before the author
started. The author: a third clean-room session, given the three spec files and, read-only, the first author's two
programs. **This decides 93 of the 149 row bounds, for the note's MAJORANT, not for the Lean integral. It does not
prove the axiom and does not verify the bound 186.**

## Gaps first

1. **One ingredient is chosen by a test whose outcome the note does not print** (the Dickman majorant d*: the delay
   recurrence "when its acceptance tests pass", otherwise the renewal recurrence). The author fixed a reading BEFORE
   any comparison — the acceptance sentence of Lemma 2.2 taken literally and computed on the exact sequences — which
   puts 41 rows on renewal and 20 on delay. Every admissible choice gives a valid upper bound, but the WORD depends
   on it for some rows: under the other branch two of the five rows it tried would be DIFFERS (O₂ L5 root, I₂ old L4),
   by 4·10⁻⁸ and 7·10⁻⁸. So "AGREES ×93" is a statement under that reading. Evidence that it is the authors' reading:
   the cross-check below (all 93 inside the claimant's intervals, the root and inner values at or near their
   midpoints on both sides of the threshold). Evidence, not proof.
2. **The 32 face integers test the reading only weakly.** The printed face bounds exceed the ideal value by an
   absolute floor of 7 to 39,000 units, even where the value is essentially zero; the author's float diagnostic
   attributes it to the 192-bit fixed point of the claimant's source moments (the note's own figure). On most L rows
   an upper bound that generous would agree with almost any reading. They carry real information only on about eight
   rows where the value dominates the floor.
3. The object, as in the other stages: the note's majorant in its ideal form. Links from the Lean integral: Lemma 2.2
   (the delay enclosure of the Dickman function) is RELIED ON; Lemma 2.3 and (2.18)–(2.21) are proved by the author
   "in outline"; the rest proved by hand; none formalized, none reviewed. Measurability assumed (C2).
4. Not replayed by the orchestrator (18 core-hours). The cross-check stands in its place.
5. The sanity step was a full rigorous run of one row, not a quick estimate, and its first attempt was lost to a
   storage failure and rerun; by the time it arrived the first rows of another table had already agreed. The order
   the brief asked for (sanity first) was not kept in time, though the row chosen involves no open choice.
6. The rows were computed by earlier revisions of the main program that differ, by the author's account, only in
   storage, diagnostics and comments; the two kernel files were unchanged throughout. Not independently diffed.

## The answer to stage L-0: is the form determined?

Yes, except for (a) the d* choice of gap 1; (b) an optional constant tail "which may be set to 10⁻⁴⁰" (bounded
rigorously by the author: at most 1.3·10⁻³¹ relative, included in every upper end); (c) the hard cap of a low bin,
never written out as the group's cap but implied; (d) the authors' outward rounding, which a reader cannot
reproduce — so only the one-sided word is available to anyone working from the note. Lean and the note agree on all
61 windows.

## Verdict: AGREES — 93 of 93, under the literal reading of gap 1

Enclosure widths ≤ 4·10⁻³³ relative. Margins: roots 5·10⁻¹⁰ to 1.5·10⁻⁹ where the integer is large, inner 10⁻¹¹ to
3·10⁻¹⁰, otherwise inside the last unit. The full table is `pg186/c3l/work/results_L.json` (sha256 `662b9bcb…1bdc`);
programs `pg186_c3l.py` (`a7712357…`), `kern.py`, `geom.py`; 18.3 core-hours on the shared pod.

**Against the claimant's own run (C1), `crosscheck-c1-L.txt`:** all 93 values lie inside the raw interval the
replayed certificate prints for the same form, and each printed integer is the ceiling of that interval's upper end.
Root (32): median position 0.45, 14 at the exact midpoint. Inner (29): median 0.50, 18 at the exact midpoint. Face
(32): median 0.07 — low in a wide interval, as gap 2 says.

## Red control (two-sided, predictions written before the runs)

One more cell in the designated fragment's range: above the printed integer (+0.84%) — as predicted. One fewer:
below (−0.86%) — as predicted.

## Findings worth keeping

- The note's "M ≥ 64" threshold never acts in this schedule: under the literal test the delay recurrence is first
  accepted at L = 11704.
- The face column of the tables is not a tight image of the note's form on most L rows (gap 2); one root (O₅⸝₂ L12)
  is one unit above the ceiling of the ideal value.
- An upper table entry that is too generous cannot be detected by anyone: the check is one-sided by nature.
