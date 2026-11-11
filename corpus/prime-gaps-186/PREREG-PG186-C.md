# Pre-registration — prime gaps 186, phase C: the numerical axiom (plumb, private), 2026-11-10

Written and committed BEFORE any pod of phase C exists, before FLINT is built anywhere, before the certificate is
executed, and before any decider of ours for these numbers exists. Sealed as seal 14. The operator's answers
(2026-11-10): FLINT may be built from source ON A RENTED POD, never on the Mac; phase C is all three parts below; pod
limit US$25. Everything PREREG-PG186.md and PREREG-PG186-B.md say first applies unchanged.

## What every artifact says first

"The bound liminf (p_{n+1} − p_n) ≤ 186 and its proof are OpenAI's (`openai/PrimeGaps186` at `61340d0b`). The third
axiom of the Lean proof, `physical_integral_bounds`, asserts 149 upper bounds for integrals over a Poisson fragment
law and three cap bounds. The release's certificate computes MAJORANTS of the 149 integrals; that each integral is at
most its majorant is argued in the numerics note (Lemmas 1.5–1.7, 2.2–2.4; Remark 2.7: 'not identified by
definition') and is in no program and not in Lean. **Phase C decides numbers. It does not prove that step, so it
cannot prove the axiom, and it does not verify the bound 186.**"

## Pins

- `prime_gap_186_certificate.py` sha256 `7f71bdef…5de4`; `short_gaps_numerics.pdf` `79190b2c…0031`; the paper
  `456f05e0…0930`; `Challenge.lean` `b99a403b…e1f0` (PINS-PG186.txt).
- FLINT `v3.6.0` plus exactly commit `7ad753d51c82fdec115cb179b41d0e581f1cb0ec` (flintlib/flint#2790) — the correction
  the numerics note itself cites as [5]. python-flint 0.9.0 at commit `572c8a213a88c0f92feb1bdb938ce4622f4517fa` (the
  note's [6]) built against that FLINT. NumPy 2.2.6 (the README). Python 3.12 as the pod has it (the README says
  3.12.13; the patch level is recorded, not matched).
- The scout: scout/PHASEC-PG186.md (a read-only session's report; four of its claims spot-checked, the rest
  unverified; its estimates are estimates).

## C1 — the claimant's certificate, replayed

A replay of the claimant's program is never an independent decision of anything.

- **C1a, the stack.** On the pod: FLINT built from the pinned source, python-flint built against it, the versions
  printed. Then (i) the certificate's own startup regression (`c0a.py`, unchanged) must PASS; (ii) our three-line
  witness (`reveal/flint/repro.py`) must print the correct product; (iii) the same two on the stock wheel in a second
  environment must still fail (the control that the build, not the machine, makes the difference).
- **C1b, the run.** The pinned script, unmodified, in an empty directory:
  `python -I -B prime_gap_186_certificate.py --workers 4 --output fresh.json` (`-I` added, nothing else), `PYTHONOPTIMIZE`
  unset. Wall time, peak memory and the receipt's sha256 recorded.
- **C1c, the comparison, ours.** The receipt's three cap integers and 149 row integers against the integers printed
  in `Challenge.lean`, by a script written before the receipt is opened (the mapping: the receipt's rows by group and
  order against the six Lean tables in their order; outer rows carry two integers, inner rows one).
- **Words.** REPRODUCED: the receipt says `passed: true` and all 152 integers equal the printed ones. REPRODUCED
  (margin only): `passed: true` but some integers differ — each difference listed with its size; the note then
  matters: the script never compares its own output with the printed numbers, and the 149 rows are relative to the
  run's own floor of I_H. A receipt with `passed: false`, or an arithmetic error, is reported as it is and stops for
  the operator. REFUSED (resources): not finished when the pod's spend reaches US$15. REFUSED (environment): the
  stack cannot be built as pinned.
- **Predictions.** The built stack passes (i) and (ii) (90%). The run finishes inside the budget (65%). If it
  finishes, `passed: true` (90%); all 152 integers equal (60% — the risks the scout named: floating summation order
  across CPUs, the floor of I_H).

## C2 — the three cap bounds, clean-room

The axiom's last three lines: 23685317816·10⁻²⁴ ≤ `trialIH` ≤ 23685317890·10⁻²⁴ and 90248755123·10⁻²⁴ ≤
`trialJLambdaH`.

- **Who writes it.** A session that has never seen the certificate, the scout's report, C1's output or this
  conversation. It is given ONLY: `Challenge.lean`, the numerics note, the main paper, the three inequalities, and the
  rules of rigor below. The orchestrator (who has read the scout's report and nine lines of the certificate) writes no
  decider code and gives no hint about method.
- **What it must produce.** Exact or outward-rounded enclosures [I⁻, I⁺] ∋ I_H and [J⁻, J⁺] ∋ J_{λ,H} as the Lean
  file defines them, by integer/rational or interval arithmetic it controls itself (no FLINT, no Arb, no numpy in the
  deciding path; floats for a sanity estimate only), with a written derivation of every identity it uses to turn the
  Lean definitions into finite sums, each identity either proved in its notes or cited to a page of the note.
- **The first-hour check (a kill criterion).** Before any rigorous work: a plain floating-point estimate of I_H from
  the Lean definitions. If it does not agree with 2.36853178·10⁻¹⁴ to five significant digits, the reading of the
  definitions is wrong: stop, report, and the orchestrator returns to the operator.
- **Words.** CERTIFIED (on the cited identities): 23685317816·10⁻²⁴ ≤ I⁻, I⁺ ≤ 23685317890·10⁻²⁴ and
  90248755123·10⁻²⁴ ≤ J⁻ — each identity that is cited and not proved is named beside the word. REFUTED: an enclosure
  lies strictly outside a stated bound (I⁺ < 23685317816·10⁻²⁴, or I⁻ > 23685317890·10⁻²⁴, or J⁺ <
  90248755123·10⁻²⁴) — reported to the operator before anything else, and checked by a second run. REFUSED: the
  enclosures straddle a bound (too wide), or the work does not finish; what was reached is reported (for instance
  "agrees to 7 digits").
- **Red controls, from the same program:** the trial with one coefficient changed by one unit, and the mesh
  denominator 98304 made 98305 — each must move I_H outside the printed window (predicted: yes for both; "the decider
  decides").
- **Predictions.** The first-hour check passes (70%). CERTIFIED in this session (35%); REFUSED with agreement to at
  least 6 digits (40%); stopped by the first-hour check or not started (25%). REFUTED (under 2%).

## C3 — the 149 rows, clean-room

Started only after C2's first-hour check has passed. The same independence rules; the same author session as C2 if it
can continue, otherwise a new one given C2's code and notes and nothing of the claimant's.

- **What is decided.** For each of the 149 forms, the note's computational form ((2.17), (2.19), (2.21)) evaluated by
  our own program, as an outward enclosure [m⁻, m⁺] of the majorant, relative to 23685317816·10⁻²⁴, in units of 10⁻¹⁸.
- **Words, per row.** AGREES: m⁺ ≤ the printed integer. UNDECIDED: m⁻ ≤ printed < m⁺ (too wide), or the note leaves a
  convention open that moves the row — named. DIFFERS: m⁻ > printed: our value of the note's form exceeds the printed
  bound — NOT a refutation of the axiom (the axiom is about the integral, and a majorant may be chosen in many ways);
  it is a finding about the note against the printed table, reported with the row.
- **The fallback the proof actually needs.** With our own enclosures, the margin ρ*(J⁻ − L⁺)/I⁺ − 1 > 1/50000 of the
  main paper's (4.45), by the Lean file's own Young combination: CERTIFIED (on the note's majorant lemmas) or not.
- **Stages, each recorded when reached:** (i) the 12 rank-two rows of the outer five-halves group (the scout: 79% of
  the loss); (ii) the rest of the outer groups; (iii) the inner groups; (iv) the margin.
- **Predictions.** Stage (i) reached in the first working session (30%); all 149 rows decided within three sessions
  (25%); at least one row UNDECIDED for a convention (70%); the margin CERTIFIED on our own numbers, if all rows are
  reached (60%).
- **Honest size.** The scout estimates 6–10 working days. This pre-registration does not promise C3 in one session;
  it fixes the rules so that every session's partial result is recorded under them.

## Compute and money

Pods: at most US$25 in all for phase C (the operator's limit). C1: one CPU pod, 16 vCPU / 64 GB, at most US$0.80/h,
stopped and deleted when its spend reaches US$15 whatever its state; a guard on the pod removes it at that deadline
if the session is gone, when the pod can do that itself (recorded either way). C2 runs on the Mac. C3: the Mac first;
a pod only inside the remaining money. Every pod's line in POD.txt; every deletion confirmed (404).
Nothing is posted. The target stays private.

## What is sealed with this file

This file; scout/PHASEC-PG186.md; reveal/flint/ (the witnesses and the unsent draft); the brief given to the
clean-room author (pg186/c2/BRIEF.md), word for word.

## Amendments (dated; each written before the work it changes)

**A (2026-11-10 ~17:00 UTC; the operator: "Pod + two more authors", "up to US$10").** C3 is parallelised. The first
clean-room author keeps the rows labelled P (stage (ii), in flight). TWO MORE clean-room authors start now, under the
same independence rule and the same words per row: one for the rows labelled H (6 rows, 8 integers), one for the rows
labelled L (61 rows, 93 integers). Each is given the three spec files and, read-only, the first author's own programs
of C2 and stage (i) — our code, written under the rule — and nothing of the claimant's, nothing of the scout's report,
nothing of C1's output, nothing of this conversation. Their briefs are committed word for word before they start
(pg186/c3/BRIEF-H.md, BRIEF-L.md). ONE shared CPU pod, 32 vCPU / 128 GB at US$1.472/h, holds only the authors' own
files and runs only their programs; it is deleted when the authors hand back or when its spend reaches US$10,
whichever comes first, and the orchestrator's owed replay of stage (i) runs there too. The pre-registration's
"UNDECIDED" for an open convention applies with full force to the L rows: an author who finds the note's form not
determined by the note says so and stops there for that row; nothing is tuned to a printed number.
What I told the operator before this amendment was miscounted: the H rows carry 8 integers (not 12) and the L rows 93
(not 89); the P rows 48, of which 24 are done.
