# Round 4 — workarounds for 40 (PRIVATE; written 2026-11-24 10:03 UTC, before any round-4 run)

Operator, 2026-11-24 about 10:00 UTC: "I want to stop spending on pods that will not close the problem. We talked
yesterday about use Astra's collaboration to find workarounds to define the 40. We did some of this. Why did you
stopped?" So: no pods; Astra works on routes to R(3,10) = 40 without a pause between rounds; the control room does
not wait for a go between a failed gate and the next attempt.

## What round 3 measured (round2/astra/REPORT-3.md)
Gate G3 FAILED, 0 of 10: no frozen 40-vertex board closes within 2 CPU-hours by trace-partition cubes with lazy
independent-10 clauses and Hall constraints; 175 to 1,104 cubes per board stayed open. Deep restrictions (eight
incidence rows fixed) close in under a second; shallow ones (three rows) do not.

## Two lines, two gates
LINE A — close ONE whole board (Astra, the round-2/3 session continued; work/solver4/).
  Gate G4a: PASS when at least one of the ten pilot-2 boards is certified excluded as a whole (every leaf's LRAT
  accepted by tools-bin/lrat-check AND tools-bin/cake_lpr/cake_lpr, plus a checked proof that the leaves cover the
  board), with the total CPU spent on that board reported. No per-board time limit: the question is whether a board
  can be closed AT ALL on this machine, and at what cost. FAIL when the budget ends with no board closed; the report
  then gives the smallest fraction left open and why it resists.
  Budget: at most 3 processes, 20 core-hours, 10 hours of wall time.

LINE B — a route that does not need 4,443 board completions (Astra, a fresh session; round4/astra-workarounds/).
  Gate G4b: PASS when the report contains at least one route for which (i) a written argument shows it would decide
  ALL remaining cases (or names exactly which it leaves), (ii) its first non-trivial step has been RUN on this Mac
  and its output is in the folder, and (iii) the measured cost of that step gives a finite projected total under
  5,000 core-hours with the arithmetic shown. An idea with no run is not a pass. FAIL otherwise; the report then
  ranks what was tried by how it died.
  Budget: at most 2 processes, 12 core-hours, 8 hours of wall time.

A Claude agent reads the literature for line B (round4/scout/): how the bound 41 was proved, the tables of minimum
edge numbers e(3,k,n), and which unproved bound would remove the most cases.

Nothing is rented in round 4, whatever the gates say. A PASS is a reason to ask the operator, with the number.

## Added 10:52 UTC (the control room), before line B's second attempt
G4b ruled FAIL by its own terms (LEDGER.md, the block of this time). Gate G5 for the second attempt is in
round4/FOLLOWUP-B2.md: PASS = a certified lemma that excludes a whole c* stratum of the 9-regular case, or brings a
whole stratum's projected cost under 5,000 core-hours by the ledger's price table, with a control showing the
argument does not exclude a graph that exists.

## Added 11:50 UTC (the control room), before line B's third attempt
G5: FAIL as reported (round4/astra-workarounds/REPORT-2.md): c* = 3 reduced to seven rooted configurations by a
certified cover; none closed. Gate G6 is in round4/FOLLOWUP-B3.md: PASS(k) = k whole profiles excluded with certified
refutations and a twice-regenerated enumeration, and a control that the pipeline does not refute graphs that exist.
