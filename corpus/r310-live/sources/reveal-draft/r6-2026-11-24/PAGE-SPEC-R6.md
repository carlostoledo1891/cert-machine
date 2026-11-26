# Page specification: box 3 opened on /r310/ (PRIVATE DRAFT, 2026-11-24)

A specification of words and data, not code. Nothing in `tools/r310-live-records.js`, `tools/build-r310-live.js` or
`corpus/r310-live/` was edited. Every number below is in `REVEAL-R6.md` (section given in brackets where it is not
obvious). `<OPENED_UTC>` and `<RECORD_URL>` are filled at publication (`<RECORD_URL>` = the commit-pinned link to
`corpus/r310-r6/`). Voice: the page's own, as box 2 reads (`tools/build-r310-live.js:243–262`).

## 1. The box, in the order it is drawn

**Head:** `box 3 · opened` (the open padlock of boxes 1 and 2).

**Title:** Case R(6), the three-edge branch

**First paragraph (the place box 2 gives to "Closed first by Zhiyang Chen's own AI run"):**

> **One branch of the case, not the case.** Zhiyang Chen splits Case R(6) by the number of cross-edges of a marked
> pair, from three to nine. This box is the branch with exactly three. The four-edge branch is open and has not been
> run. Five to nine are open. Case R(6) is not closed, and nothing here decides R(3,10).

**Second paragraph, the limits (before any number):**

> **Not established, first.**
> - **A second program checked the counting, not the verdicts.** It counts the same records as ours and has no
>   verdict. Every "excluded" below rests on our own tests; no second program touched them.
> - **No single version of that program agrees with ours on every core.** Version 1 ran on all 23,409 cores and
>   differs from ours on 32. A corrected version 2 agrees on those 32; it ran on 129 cores, on a laptop, in no
>   registered run.
> - **It was not written blind.** Its track had read and patched our counting program before writing its own. The
>   correction that makes version 2 is ours. An omission shared by both programs would not show.
> - **The chain from a graph to a verdict is partly prose.** The conditions the tests rest on are proved in Lean.
>   That the C programs test exactly those conditions is prose, read by our own agents and tried on samples. There
>   is no proof file per record.
> - **The list of cores is complete only if a published count is right:** 23,409, from Goedgebeur and Radziszowski's
>   Table 13. Our file has 23,409 valid graphs, no two isomorphic. Nobody here re-derived the count.
> - **The run did not follow its registration in every step.** It was stopped at 16,927 cores and finished on a
>   second machine. Its time estimate was wrong. A recheck of 12 cores on a second kind of machine, registered for
>   after the run, has no record. The machine's own hash list was not kept. Our separate tally kept no program.
> - **The rules are in Bitcoin from seven minutes after the run began,** not from before it (anchors, below).
> - **Nobody outside has read it.** One person, models of two families, our own audits.

**Third paragraph:**

> It holds only under six premises:

**The premise list (same form as box 2's):**

| id | text | checked |
|---|---|---|
| P1 | there are exactly 23,409 triangle-free graphs on 26 vertices with 75 edges and no independent 8-set (Goedgebeur–Radziszowski, Table 13) | from the literature; not checked here |
| P2 | our catalogue file holds 23,409 such graphs, no two isomorphic | computed twice: our own code without nauty, and nauty three ways |
| P3 | the reduction: in a graph of the branch, the 26 vertices adjacent to neither marked vertex form such a graph, and the conditions the tests use hold | proved in Lean 4.35.0 with Mathlib, the three standard axioms only; built and read by the control room; it rests on Zhiyang Chen's Lean library as compiled; leanchecker --fresh not run; no graph of the branch is exhibited |
| P4 | the programs test exactly those conditions and drop no completion | prose, in 25 conditions, each read against the code by our agents; a second implementation agrees on 477 + 30 records; no Lean about the C |
| P5 | the two machines ran the pinned programs, and the ledger says what they computed | the run itself: pins checked and the gate passed on each machine; a second program gives the same enumeration, within the limits above |
| P6 | the tools: gcc 13.3.0, Python 3.12.3, Lean's kernel and Mathlib, nauty | trusted as tools |

**The numbers:**

> Then: 23,409 of 23,409 cores excluded, 0 open, 0 with a completion. A core is the graph on the 26 vertices
> adjacent to neither marked vertex. For each core the run lists every admissible choice of the six side rows:
> 101,564,232,221 in all. A screen leaves 92,080,292,598. Two tests refute 92,080,264,258 of those. The 28,340
> left, on 4,192 cores, are each shown infeasible by an exhaustive search that uses neither test. The same search
> also took a sample of 256 records on every core, 5,992,486 in all: none completes, and none contradicts the tests.
> That sample is 0.0065% of the screened records: it can catch an unsound test, not one false refutation among
> millions.

> Two rented machines, 32 vCPU each: 16,927 cores on one (22 November 18:10 UTC to 23 November 16:25 UTC), then 6,482
> on the other (to 24 November 00:45 UTC). About 961 CPU-hours.

**The statement (in the `said(...)` block, as box 2's):**

> If P1–P6 hold: no 9-regular triangle-free graph on 40 vertices with no independent set of size 10 has two
> non-adjacent vertices with exactly six common neighbours and exactly three edges between their other neighbours.

**The second program:**

> **A second program, and where it stops.** A counter written by the other model family lists the same records.
> Version 1 ran on all 23,409 cores: on 23,377 it wrote the same screened records as ours, byte for byte by
> hash. On 32 it wrote more, 14,895 records in all: it applied one of the screen's three side conditions. Ours
> applies all three, and our tests refute every one of the 14,895 anyway, so no verdict depends on which program is
> right. With our correction it agrees with ours on those 32 and on 97 other cores tried. It was not run again on
> the rest.

**Chen:**

> **The branch is Zhiyang Chen's.** His notes define it and parked it in October. As we last read his repository
> (23 November, commit 055ae277), his AI run r310_ralph has a scout note on the same branch, with the same two
> tests in other words: no assignment survived on 16 pilot inputs, no production run, and an inventory of 23,037 of
> the 23,409 cores, 372 missing. It says of itself that it changes the status of no case. Ours is a run over all
> 23,409, with tests that do not assume Case R(7). We have not run his scout. Ours was private until now.

**Anchors (replacing the sealed box's list):**

> **In Bitcoin**
> - block 977085, 22 November 2026, 18:17:27 UTC — the rules of the run
> - block 977301, 24 November 2026, 01:10:46 UTC — the final record
>
> The rules were stamped at 18:07 UTC by our clock, before the machine existed. Bitcoin confirms that stamp from
> 18:17:27 UTC, seven minutes after the run began: by then 87 of the 23,409 cores had a result. So the chain shows
> the rules before the other 23,322 results, not before the run. The final record is confirmed 25 minutes after
> the run ended; the chain shows it was not changed after that. A stamp proves a date, nothing else.

**Opened line:** `Opened <OPENED_UTC>` (as boxes 1 and 2).

**The record:**

> The record is public: the rules and their receipt, the programs and the catalogue as run, the full ledger (one
> row per core), the second program with its ledger, the join, the Lean files and the prose proofs:
> <RECORD_URL>. Three of its files are copies with lines reworded, and its README says which.

**A correction beside the record (the place of box 2's "A correction beside the seal"):**

> **Corrections beside the record.** A derivation note in it says "R(7), not yet closed": Chen's run had closed
> R(7) the day before it was written. The rules say "Timestamped before the pod exists": the chain shows them only
> from seven minutes after the run began. Stamped and pinned files cannot change, so both are corrected here.

**What stays sealed (new, last paragraph of the box, or a small sealed stub under it):**

> **What stays sealed: the rest of Case R(6).** Its four-edge branch is open and has not been run. Two anchors shown
> here while the box was sealed, blocks 977089 (further derivations) and 977108 (a draw registration), are not of
> this branch's run; they stay with the rest. It opens only after audit, on my word.

(See OPEN-QUESTIONS 1 and 3 before this paragraph is used: the words "has not been run" and the fate of the two
anchors are the operator's decisions.)

## 2. The page's other places that name box 3

- **Section title** "Two boxes opened, one sealed" → "Three boxes opened". Its lead sentence ("These are the first
  two to open") → "A box opens only after its audit. Three have opened; the rest of Case R(6) stays sealed."
- **"What is not established, first" (the page's top list, `build-r310-live.js:422–428`).** Replace the item "The
  sealed box claims nothing" by:
  > **Case R(6) is not closed.** One of its branches, three cross-edges, is computed here under six premises, with a
  > second program for the counting only. The four-edge branch is open and has not been run.

  and in the item "Nobody outside has read any of it" nothing changes.
- **The description / share text** ("two opened results … one sealed"): "three opened results (Theorem C35, a
  second computation of Case R(7), the three-edge branch of Case R(6))". The share card draws the case sealed: it
  needs a new render (the card is a light illustrated one, as before).
- **The machine at work:** `now.rented.for` "box 3, the sealed computation" → "box 3"; the audit counts move (the
  notes on this branch leave the sealed count). The money line for box 3 is not in REVEAL-R6.md: OPEN-QUESTIONS 25.
- **The trust layer:** the sentence "The sealed box's corrections cite their source line by the first 16 hex digits"
  stays for the rows that stay sealed. Add the record link and the two receipts' file hashes (b23f918c…767f for the
  rules; e7769301…fb0a for the final hash list; the ledger 34a67324…5d7b).
- **What the build refuses:** the rules "the sealed box's record holds anything beyond its name, its three anchors
  and a whole percent" and "the case number of the sealed box appears anywhere but in its name" no longer apply to
  box 3. In their place: the box's tally must sum (refuted + open = screened; first machine + second machine =
  23,409; equal + different = 23,409); its verdicts must be 23,409 EXCLUDED; the map's node for the case must not be
  "decided".

## 3. The case map

Node `c6` (one node, as now):

| field | now | proposed |
|---|---|---|
| label | Case R(6): codegree six | unchanged |
| state | sealed | **open** |
| sub | running, sealed | one branch computed; open |
| map line 2 | running, sealed | one branch computed; open (25 characters; box 2's line has 26) |
| box | 3 | 3 |
| note | Worked on now, under seal… | Split by the number of cross-edges of a marked pair, three to nine (Chen's Lemma F). The three-edge branch is computed here, under six premises (box 3). The four-edge branch is open and has not been run; five to nine are open. Not closed. |
| credits | chenReport('open'), chenRun('partial results; not closed'), ours('a sealed box, running') | chenReport('open'); chenRun('partial results; not closed; a scout note on the three-edge branch, 16 pilot inputs, no production'); ours('the three-edge branch, computed over all 23,409 cores under six premises (box 3); the case is not closed') |

The node's mark becomes the open circle, not the filled one. The map's header text ("States: decided, sealed
(running under seal), open, refused") keeps its four states; after this change no node is "sealed" unless the
operator wants a child node for the rest of the case (OPEN-QUESTIONS 4).

## 4. One new line for the change log

> `<OPENED_UTC>` — Box 3 opened: Case R(6), the three-edge branch. All 23,409 cores of that branch are excluded by
> our run, under six premises, with what is not established printed first: it is one branch of the case, a second
> program checked the counting and not the verdicts, and the four-edge branch is open and has not been run. Case
> R(6) is not closed. The record is at corpus/r310-r6/. Corrections added to the ledger.

(The builder prints "(Box 3 at N%; M corrections.)" after each entry: for this entry and later ones the
"Box 3 at N%" part should go, or read "Box 3 opened".)

## 5. Corrections ledger

**New rows** (`where`: a new value for the opened box 3, e.g. `r6-3`; `whose` and `caught_by` name a track or a
tool, never a person):

| at | whose | caught by | how | what | outcome |
|---|---|---|---|---|---|
| 2026-11-24T03:24Z | cert-machine | an agent of the control room | the final join | This ledger said the second program would be corrected and compared again over every input when the run ended. The corrected version was compared on 129 of the 23,409 cores; the uncorrected one on every core. | said in box 3; a full run of the corrected version was priced at about 2.1 machine-hours and not done |
| 2026-11-24T03:24Z | cert-machine | an agent of the control room | the final join | This ledger called the second program independent. Its counting path was written after its track had read and patched ours: separately written, not blind. | reworded |
| `<OPENED_UTC>` | cert-machine | an agent preparing the opening | reading the registration against the files | Three steps registered for after the run have no record or not the registered form: the same programs on 12 cores on a second kind of machine; the machine's own hash list; a separate tally with its program kept. | listed in box 3 as limits |
| `<OPENED_UTC>` | cert-machine | an agent preparing the opening | reading the registration against the files | The file of deviations lists one. The stop at 16,927 cores, the second machine and a start by hand were recorded in the log only. | listed in box 3 |
| `<OPENED_UTC>` | the Claude track | an agent preparing the opening | reading the record before it opened | A derivation note in the record says "R(7), not yet closed". Chen's run had closed it the day before. | corrected beside the file |

**Rows that open** (now `where: 'sealed'`, one line each; they are wholly about this branch, so they can carry a
source and their full words). By date and present text:
2026-11-22T15:25Z (a step worded ambiguously); 16:06Z and 16:43Z (two claims of registration backed by local clocks);
16:43Z (a check described as separate); 18:21Z (our time estimate); 18:50Z (figures with no file behind them);
2026-11-23T03:14Z (a machine presented as independent); 03:14Z (two statements refuted); 03:14Z (a wrong reason in
our audit note); 04:30Z (three wording slips); 04:45Z (a receipt read in part); 07:31Z (the second program's
disagreement). Twelve rows. A thirteenth, 2026-11-22T18:50Z (audited files edited in place), is about this branch's
records but was found in a reading of other work: open it only if its cited line names nothing outside the branch.

**The 07:31Z row, in full when it opens:**

> A second program, run over every core, disagreed with ours on 16 of the 10,425 cores then compared (32 of 23,409
> in the end): it wrote more records after one screen. It was the one in error: it applied one of the screen's
> three side conditions, ours all three. 14,895 extra records in all; our tests refute every one, and our second
> method finds every one infeasible. No verdict changed. Found 07:31 UTC, resolved 08:01 UTC, 23 November.

**Rows that stay sealed** (ten: they concern the rest of the case or the tools around it): 2026-11-22T18:50Z (an
earlier formula carried into a new setting; a safeguard claimed for a future test), 19:20Z, 19:29Z, 20:39Z (both),
22:06Z, 2026-11-23T03:14Z (the User-Agent; a slip carried into a model's text), 04:30Z (a cost estimate).

This sorting is by reading the log; the records tool's line hashes were not resolved (OPEN-QUESTIONS 24).

## 6. Fields the records tool needs (data, not code)

Box 3's record, replacing `{n, id, state:'sealed', label, stamps, progress_percent, as_of, open_discrepancies}`:

```
n: 3
id: c6
state: opened
label: "Case R(6), the three-edge branch"
branch: { cross_edges: 3, of: [3, 9], four_edge: "open, not run", case_closed: false }
statement: "If P1–P6 hold: no 9-regular triangle-free graph on 40 vertices with no independent set of size 10 has two
            non-adjacent vertices with exactly six common neighbours and exactly three edges between their other neighbours."
limits: [ the eight items of section 1, in that order ]
premises: [ {id: P1..P6, text, checked} as in section 1 ]
catalogue: { cores: 23409, sha256: 0d3d2caf830c9d5af9ad64ce6da120c83cd12600bc0acf70ae90f747dfab208d }
bundle_sha256: 3c3e0b08b1a2c6b411dd43aa86a65de02adf8e56b64320fd82b2061016c26dd2
limits_per_record: { nodes: 2000, core_seconds: 3600, sample: 256 }
tally: { cores: 23409, excluded: 23409, open: 0, witness: 0,
         baseline: 101564232221, screened: 92080292598, refuted_by_tests: 92080264258,
         open_by_tests: 28340, open_cores: 4192, infeasible_by_search: 28340, at_node_limit: 0,
         sampled: 5992486, sample_infeasible: 5992486, sample_undecided: 0, completions: 0, contradictions: 0,
         sample_share_percent: "0.0065" }
run: { machines: 2, vcpu: 32, cpu_s: 3460429, cpu_hours: 961,
       first:  { start: 2026-11-22T18:10:23Z, stop: 2026-11-23T16:25Z, cores: 16927, cpu: "AMD EPYC 7713" },
       second: { start: 2026-11-23T16:35:29Z, end: 2026-11-24T00:45:09Z, cores: 6482, cpu: "AMD EPYC 7713P" },
       ended: 2026-11-24T00:45:10Z }
final: { ledger: "run/final/out/cores.jsonl", ledger_sha256: 34a673241985acea10af966013674de834ff89295303621f2d0ac43f8b6a5d7b,
         final_list_sha256: e77693016f554bfdd407b6a0d2b3803cdd1e0beb9cd3fd5dc93b52630e45fb0a }
stamps: [ { block: 977085, at: 2026-11-22T18:17:27Z, what: "the rules of the run", file_sha256: b23f918c…767f,
            submitted: 2026-11-22T18:07Z, run_began: 2026-11-22T18:10:23Z, results_before_block: 87, results_after_block: 23322 },
          { block: 977301, at: 2026-11-24T01:10:46Z, what: "the final record", file_sha256: e7769301…fb0a,
            run_ended: 2026-11-24T00:45:10Z } ]
second_program: { by: "GPT-6.2-astra", blind: false, has_verdict: false,
                  v1: { cores: 23409, equal: 23377, different: 32, extra_records: 14895, unpredicted: 0 },
                  v2: { cores: 129, equal_to_ours: 129, affected: 32, controls: 97, where: "a laptop", registered: false,
                        full_run_priced_machine_hours: "2.1" },
                  first_join: { at: 2026-11-23T07:31Z, compared: 10425, different: 16, resolved: 2026-11-23T08:01Z } }
chen: { read: 2026-11-23, commit: 055ae277, scout: "review/ideas/r024_R.md", pilot_inputs: 16, inventory: 23037,
        missing: 372, production: false }
corrections_beside: [ the two sentences of section 1 ]
record: { path: "corpus/r310-r6/", url: <RECORD_URL>, redacted_copies: 3 }
opened: <OPENED_UTC>
still_sealed: { label: "the rest of Case R(6)", four_edge: "open, not run",
                stamps: [ { block: 977089, at: 2026-11-22T19:03:33Z, what: "further derivations" },
                          { block: 977108, at: 2026-11-22T22:02:41Z, what: "a draw registration" } ] }
```

Also: `cases.json` node `c6` as in section 3; `corrections.json` as in section 5 (its counts change: rows in all,
sealed, opened); `page-log.json` gains the entry of section 4 (its `progress_percent` field has no meaning after the
opening); `machine.json` as in section 2; credits gain this branch's lines (REVEAL-R6.md section 7).

The records tool should refuse when: TALLY.txt does not read "EXCLUDED 23409, OPEN 0, WITNESS 0"; the ledger's sha256
is not the one in FINAL.sha256; the join's last line is not "JOIN: 23377 equal, 32 predicted differences, 0 unexpected,
v2 agrees on 32 of 32"; the two receipts do not commit to the two file hashes above.

## 7. Words the opened box must not use

"first"; "closes", "closed" or "decided" for Case R(6); "independent" for the second program without "not blind";
"verified" or "confirmed" for anything of Chen's; "the second program agrees on every core"; "proved" or "a theorem"
for the statement without "if P1–P6 hold"; any sentence that moves the value of R(3,10); anything about the
four-edge branch beyond "open" and "not run".
