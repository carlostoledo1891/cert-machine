# Outreach plan for the three audits (and the Bandeira follow-up) — 2026-10-15

Nothing here is sent. Every item is posted only on the operator's word, one at a time, after its pre-send checks.
The fifteen thread comments are in `three-campaigns-2026-10-15.md` (blocks A1–A5, B1–B5, C1–C5); the drafts that are
NEW in this plan (a PR to DeepMind's repository, five PR one-liners, the Bandeira follow-up, the registry follow-up PR,
the operator's own post) are written out below.

## What we are trying to get

| Venue | The outcome we want | The outcome we can get by default |
|---|---|---|
| google-deepmind/alphaevolve_repository_of_problems | DeepMind acknowledges an outside decider and updates its table; the contributors point at our page as "the check" | Four claimants engaged in one thread (the Qiushi pattern), our page linked from their READMEs |
| teorth/optimizationproblems | Tao/maintainers treat cert-machine as the queue's reviewer; our PR #216 and the new replays merged; Mosaic's #210 either supplies the bank or stalls on the record | Three claimants thanked and citing us; #210 publicly shown to be undecidable as filed |
| google-deepmind/formal-conjectures | The maintainers use our decisions to triage the sixty filings; the author restores the links and fixes the two statements | The author engages (he answers reviewers within hours) and fixes the links |
| Oxelra-AI/Bandeira-0.2a-open-source | A reply from the Qiushi team on the two gaps; a second exchange like the kissing one | The promise kept publicly (the axiom list) |

## Tone rules (the same as the Qiushi thread, which worked)
- Lead with what holds. Name the gap only after the confirmation, in the claimant's own terms, with the exact number.
- Never "you are wrong"; always "the object decides to X under definition Y; here is the file and the hash".
- One link to the page, one to the decider. No adjectives about ourselves.
- A refusal is a verdict on the evidence: say what would move it.
- Disclose: "no code of yours was run; the definitions are the registry's".

## Sequence and timing

**Day 1 (first batch, the confirmations):**
1. AE A1 (#6, the sphere thread) — the flagship; four contributors, zero replies so far.
2. T C1 (#225), C2 (#221), C3 (#226) — three thank-yous to earn before the refusal.
3. W B1–B5 (the five issues) — in one sitting, so the maintainers see the pattern.
4. Bandeira F1 (the axiom list on issue #1).

**Day 2 (second batch, after the first has been seen):**
5. AE A2 (#10), A3 (#12), A4 (#5); A5 optional.
6. T C5 (#210, the refusal) — the operator reads it first; post only once C1–C3 are up.
7. W P1–P5 (the one-liners on the PRs) — pointing at the issue comments.

**Week 2 (follow-ups, each conditional):**
8. AE PR (below) — needs Google's CLA signed by the operator first; file only if A1 drew any reply from DeepMind or a contributor asked for it.
9. T PR (below) — only after #225/#221 are merged; amends our #216 or is a fresh one-line PR.
10. The operator's own post (below) — after the first batch, pointing at the three pages.

**If silence after two weeks:** one follow-up per venue at most, short, adding only new facts (another page, a new row).

## After each send (the record)
`outreach/SEND-QUEUE.md` lane line → POSTED + URL; `outreach/GITHUB-OUTREACH.md` §C; the draft file's header;
`tools/sweep-claims` or the equivalent check that nothing on the pages contradicts what was posted; HANDOFF.

## What we offer if they answer
- AlphaEvolve: a standing decided table per problem (we re-derive the ledger; they link it), and the hyperplane-key decider as a drop-in replacement for the float verifier.
- Optimization constants: to decide the remaining ten open PRs in the same way (a week), and to re-run any PR on request.
- formal-conjectures: our standard-library deciders as the Lean-free check for the author's other fifty-five filings, five a day.
- Oxelra: the sum-of-squares certificate under their own verifier (already offered), and the next target from their results page.

────────────────────────────────────────────────────────────────────────────────────────────────
## NEW DRAFTS

### F1 — Bandeira follow-up on Oxelra-AI/Bandeira-0.2a-open-source#1 (keeps the promise made in the issue)
---- PASTE ----
Follow-up, as promised: the default Lake target built here at your pins (3,759 jobs, Lean v4.29.1 + your Mathlib revision; the two NativeSplitB1Entry modules took most of the fifteen hours). The kernel's axiom lists: `negM_full_posSemidef`, `no_native_farkas_feasible`, `no_lailim_feasible_from_certificate_semantics`, `block1_Q_posSemidef`, `spectralNormPSD_pow_full` and `m00_reconstructed` depend on `propext`, `Classical.choice`, `Quot.sound` only; `rrnn_iff_bandeira02a` and `exists_not_bandeira02a_of_exists_not_rrnn` on no axiom at all; `qiushi_lailim_int_bound` (144 > 5!) on its `native_decide` axiom — the only one, and not load-bearing. `#print` of `NativeFarkasFeasible` shows `hNSD`, `hTrace`, `hStandard`, `hBound`, `hScalar` as fields, which is the reading in my first note. Record: corpus/bandeira/lean-build.json in the repository; page §4 updated. Nothing changes in the verdicts.
---- END ----

### P1–P5 — one line on each formal-conjectures PR (after B1–B5 are posted; replace {ISSUE-URL})
---- PASTE (PR #7310) ----
Decided independently in exact arithmetic (standard library, no Lean): the 25-vertex witness refutes WOWII 353 as the archive states it, γ_t = 10 < 21/2 — details and the pinned copy of the witness (the linked commit now 404s) at {ISSUE-URL}.
---- END ----
---- PASTE (PR #7321) ----
Decided independently: the 41-vertex witness refutes WOWII 360 under both readings of the ½ (the ½ is original in the 2010/2016 archive bytes); γ_t = 6 against 961/160 — {ISSUE-URL}.
---- END ----
---- PASTE (PR #7322) ----
Decided independently: the 150-vertex witness refutes WOWII 373, γ_t = 12 against 19676/1639 — {ISSUE-URL}.
---- END ----
---- PASTE (PR #7320) ----
Decided independently: the 39-vertex witness refutes WOWII 396, γ₂ = 12 against 10; one note on `(degreeModes G).card` for a unique mode (definition 45 is silent there) — {ISSUE-URL}.
---- END ----
---- PASTE (PR #7337) ----
Decided independently: the 15-vertex witness refutes WOWII 395b by exhaustion, γ₂ = 6 against 5; note that `(remaining G).Nonempty` is a hypothesis the archive's statement does not carry — {ISSUE-URL}.
---- END ----

### AE-PR — a pull request to google-deepmind/alphaevolve_repository_of_problems (week 2; CLA first)
Scope: the smallest possible change — a sentence in the Comments box of problems/59.html, 60.html, 61.html and 42.html pointing
at the issues and the decided record, and a line in README.md under the contributions paragraph. No change to status.json (the
"world_record" labels are theirs to re-assess). Title and body:

Title: Point the Comments of problems 42, 59, 60, 61 at the community constructions decided in the issue tracker

---- BODY ----
Issues #4–#12 offer explicit constructions beyond the repository's recorded bests for four problems. Every finite object among them was re-decided in exact arithmetic from the notebooks' definitions (no code of the contributors' or of this repository's verifiers), with the files pinned by sha256: no-5-on-a-sphere sets to n = 40 (best certified 36 … 104 for n = 13 … 40), two 58-point isosceles-free sets at n = 32, ring-loading instances at 47/42 and 9/8 (under both k-ranges in use), and a sum-difference set with g > 1.163. Record and method: https://carlostoledo.co/reports/alphaevolve-community.html; code: github.com/carlostoledo1891/cert-machine (`instruments/aerp/`).

This PR only adds one sentence per problem page pointing readers to the issues and that record, and one line to the README. It does not change status.json: whether the "world record" labels should move is the owners' call. Happy to reduce it further or to turn it into a table if you prefer.
---- END ----
Comment-box sentences (one per page):
- 59: "Community constructions beyond the recorded best are discussed in issue #10 (58 points at n = 32); decided independently in exact arithmetic at carlostoledo.co/reports/alphaevolve-community.html."
- 60: "Community constructions for n = 13 … 40 are collected in issues #4, #6, #7 (best certified sizes 36 … 104); decided independently at carlostoledo.co/reports/alphaevolve-community.html."
- 61: "Exact rational instances with alpha = 47/42 and 9/8 are given in issues #11 and #12 (note the k-range: the notebook uses k = 1..m−1, the issues k = 1..m); decided independently at carlostoledo.co/reports/alphaevolve-community.html."
- 42: "Issue #5 gives an explicit set with g > 1.163 (Penman–Wells 2013 give 1.12594); decided independently at carlostoledo.co/reports/alphaevolve-community.html. C = 2 is now a theorem (Lin–Li, arXiv:2607.27199)."

### T-PR — the registry follow-up (after #225 and #221 merge)
Title: Remove the asterisk from the 1a, 1b and 3c rows merged from #225 and #221: certificates independently replayed
---- BODY ----
Follows #216 (same method, same disclosure). The two step functions of #225 were re-decided exactly — the autoconvolution and the overlap correlation as single exact integer products, the maximum over every grid shift — and give the submitted fractions digit for digit; the two-law certificate of #221 was re-decided with exact pushforwards and directed-rounding interval entropies after checking the digit map injective (max |L| = 27 ≤ 27), ρ ∈ [1.674894211307116228764343737060, …061]. No code of the submitters was run. Record: https://carlostoledo.co/reports/optconst-queue.html; re-derive: `python3 -I tools/run-optq-ledger.py` in github.com/carlostoledo1891/cert-machine.
---- END ----

### POST — the operator's own post (Mathstodon / LinkedIn; by hand; ≤ 500 characters)
---- PASTE ----
Three registries of machine-generated mathematics, one day of exact checking: DeepMind's AlphaEvolve problems (70 community claims hold; the table is far behind its issue tracker), Tao's optimization constants (two step functions and an entropy certificate confirmed exactly; a "certified record package" for the de Bruijn–Newman constant refused — its checkers verify assembly, not analysis), and five Graffiti.pc conjectures refuted by AI-found witnesses, verified. Pages and records: carlostoledo.co/reports
---- END ----
