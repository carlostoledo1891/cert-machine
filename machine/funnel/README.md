# The Certified Funnel Machine

Engine tooling under `research/_engine/funnel/` — the house's standard
generate-and-verify infrastructure. It ships nowhere, mints nothing, sends
nothing, and never writes outside a funnel instance's own directory. Zero npm
dependencies, pure Node (>= 18 for the live LLM engine; the rest runs on any
current Node), deterministic seeds.

Born from the autoresearch audit (`brain/AUTORESEARCH_AUDIT_2026-08-20.md`):
the fixed-harness seam, per-experiment records with the two fields they lacked
(hypothesis line, harness sha), best.json steering, and a governor — welded to
this house's verification discipline, which is exactly what that repo lacked.

## The two adopted rules, verbatim from research/probes/PROBES.md

This machine ENFORCES both in code (the claim constructors and the start/end
controls in `funnel.js`), not in prose:

> 1. QUANTIFIER SHAPE — every claim born from a search declares itself: a HIT
>    (∃ — witness attached, certificate attached, absolute, no reference to
>    the search that found it) or a RECORD (superlative — the searched box
>    named IN THE CLAIM TEXT, carrying either a completeness certificate for
>    that box or the explicit downgrade "best known to this search"). Bare
>    superlatives from a search are forbidden.
> 2. SCREEN CONTROLS — a float screen may prune, never admit. Before its
>    rejections count for anything, it passes a RECALL control (planted
>    known-certified hits must survive it every run) and a REJECT AUDIT (a
>    random sample of its rejects is certified each run; the measured
>    false-negative rate is reported, never assumed zero). A score function is
>    untrusted until its own battery passes: known-bad scores low,
>    scale/amplitude inflation does not move it, and its sha is pinned into
>    every experiment record.

## The seam

```
research/_engine/funnel/          the machine (shared, tested by selftest/)
  funnel.js                       runner: generate -> validate -> score ->
                                  screen -> certify -> chained jsonl ->
                                  best.json -> checkpoint per batch
  stats.js                        provenance-at-write memos + a stats reader
                                  that REFUSES unprovenanced lines and
                                  undefined metrics (machine rule 3 / M2 —
                                  instances stop hand-rolling
                                  instrument-log.jsonl appends)
  governor.js                     decade budgets, wall clock, equal-budget
                                  caps, the dumb-baseline predicate
  generators/{enum,evolve,llm}.js engines behind ONE interface, all executed
                                  inside the write-fence
  selftest/                       the battery (below) + synthetic target +
                                  sabotage variants + the evil generator
  skeleton/                       copyable instance skeleton

research/probes/<slug>/           a funnel INSTANCE (a probe)
  program.md                      briefing — documentation, loaded by NO code
  target.js                       the problem adapter (contract below)
  experiments/run-<seed>.jsonl    one chained line per candidate + header +
                                  summary; hash-chained, tamper-evident
  experiments/checkpoint-<seed>.json   resumable state (atomic)
  experiments/session-<seed>.json      main + dumb-baseline, side by side —
                                  BOTH counters (certified HITs · new-to-board
                                  admissions), definitions attached (M3);
                                  checkSessionSummary() refuses a summary
                                  that drops either
  experiments/llm-log.jsonl       live-mode requests/responses, verbatim, each
                                  entry stamped promptSha = sha256(request
                                  body); verifyLlmLog() checks the chain
  best.json                       the leaderboard — certified HITs ONLY,
                                  one champion per canonical key, region-
                                  floored when the target declares regionOf
  mute.json                       the mute archive (Graffiti, 1991): board
                                  entries displaced or superseded, kept
                                  revivable — nothing admitted is ever
                                  silently deleted (Phase 3)
```

### target.js contract

`candidateSchema` (declarative validation) · `score(c) -> number` (float,
steering only) · `screen(c) -> {pass, why}` (cheap float prune) ·
`certify(c) -> {verdict: 'HIT'|'REJECT'|'REFUSED', certificate?, why}` (the
ONLY authority — ride the house instruments) · `recheckCertificate(c, cert) ->
bool` (independent recompute; without it a sabotaged certifier is uncatchable
— declare one) · `plantedHits` (known-certified, for the recall control) ·
`knownBad` + `scaleInflate(c)` (for the score battery) · `enumSpec` (the
enumerable box — required, because the mandatory baseline is enum) ·
`emptyBox` (optional: `{box, exhaust(box)}` for certified-empty-box RECORDs) ·
`canonicalKey(c) -> string` (optional, Phase 3: collapses representations of
the same object so permutation duplicates die at the board; default
stableStringify) · `regionOf(c) -> string` (optional, Phase 3: keys champions
per region of the search space — MAP-Elites-lite; per-region cap `regionCap`,
default 8; without it one region with `boardCap`, default 50) ·
`screens: [{name, screen(c)}, ...]` (optional, Phase 4: the CASCADE — staged
float prunes, cheapest first, replacing the single `screen`; planted hits must
survive every stage, the reject audit reports false negatives per stage, and
the summary carries the conservation table in = rejected + passed for every
stage, checked at write; the stage name "(score)" is reserved). Run opts:
`bingoDry: N` stops the run after N consecutive candidates add nothing to the
board (Graffiti's halt, dryness form; off by default).

### Generator interface

`{name, init(ctx), next(state, rng) -> {candidate, state, hypothesis, mock?,
done?}}` — `{candidate: null, done: true}` signals exhaustion. The runner
injects `state.leaderboard` (top certified HITs, deep-copied) and
`state.recent` before every call; both are context, not checkpointed state (a
generator that steers off `state.recent` loses that context across a resume —
the shipped three do not). Generators run in a bare `vm` context: no
`require`, no `process`, no `fs`, no network — a generator's only output is
its return value, and reaching outside aborts the run as FENCE-VIOLATION.
(The vm fence is a write-fence against honest-but-wrong code, not a security
sandbox against a deliberately hostile generator — generators are engine code,
reviewed like the rest of the tree.) The shipped `evolve`, `searcher` and `llm`-mock
engines understand the house candidate shape (one integer-vector field); an
instance with a different shape supplies its own generator file via
`generatorPath` — the interface is the contract, not the shipped files.

**`searcher` (Phase 4) — evolve the SEARCHER, not the object.** The genome is
a program in a tiny bounded DSL (range/append/remove/add/set over a vector
being built), interpreted inside the generator under hard step and size caps —
no eval, no Function constructor, the vm fence exactly as strong as before. A
program is a legible family: the hypothesis line carries its source, so a
hit's record shows the generating law, not only the instance. Programs are
credited by their candidates' measured outcomes (score + certified-HIT bonus)
via state.recent, and bred by tournament. Seed variance is real (the
FunSearch-documented failure mode); the selftest pins a productive seed and
says so.

**llm steering (Phase 4):** the prompt carries FunSearch's best-shot pair —
two boarded hits sorted worse-to-better as v0/v1, propose v2 — once the board
can supply it, and state.recent now carries WHY each recent candidate died
(cascade stage + reason, or the certifier's why), rendered in the prompt so
rejected patterns are not re-proposed blind. Both are steering decisions and
both are recorded: promptSha chains every request to its candidate.

## Enforced rules, as implemented

1. **Certify admits; nothing else can.** `admitHit()` is the only writer of
   `best.json`; it requires `verdict === 'HIT'` and re-verifies the
   certificate against `recheckCertificate` before admitting. Screen and
   score outputs are recorded, never admitted.
2. **Recall control at start, reject audit at end.** Every run begins by
   passing all `plantedHits` through screen AND certify (certificates
   re-checked against the independent recompute, stored ones included) — else
   the run REFUSES to start and writes nothing. Every run ends by certifying
   a seeded sample of its screen-rejects (default 5%, minimum 1 when any
   exist); the measured false-negative count is in the run summary. Audit
   discoveries hold real certificates and are admitted, flagged
   `via: 'reject-audit'`.
3. **Score battery at start.** `score(knownBad)` must rank strictly below
   every planted hit, and `score(scaleInflate(c))` must not exceed `score(c)`
   on any probe point — else REFUSED-TO-START. (Their NLS metric was gamed by
   a 159x amplitude inflation; this is that incident, generalized into a
   gate.) The harness sha — sha256 of target.js + funnel.js + the generator
   source — rides every record, so a mid-campaign harness edit is visible.
4. **Two legal claim shapes.** Summaries emit HIT lines (witness +
   certificate ref) and RECORD lines (box named in the text, carrying either
   an `exhaustionCertificate` or the literal string "best known to this
   search"). The claim constructors and the free-text guard throw on any
   other superlative. An enum run earns a completeness certificate only when
   the whole declared box was enumerated AND every screen-reject was audited
   (`rejectAuditRate: 1`) with no REFUSED verdicts — completeness is earned,
   never asserted.
5. **Governor.** Candidates are budgeted per decade (10^2, 10^3, ...); the
   run stops at the largest PRE-authorized decade, printing hit statistics at
   each boundary. Wall-clock cap independent of count. And the dumb-baseline
   rule: any non-enum generator triggers an equal-budget enum control run in
   the same session, automatically, with both in `session-<seed>.json` — no
   opt-out flag exists.
6. **Tamper-evident records.** Every jsonl line carries
   `sha256(prev-chain + content)`; editing, deleting, or reordering a line
   breaks the chain and resume refuses (`verifyChainFile` finds the line).
   Checkpoints are atomic; a torn mid-batch write is truncated back to the
   checkpointed prefix on resume, and same seed + checkpoint reproduces the
   uninterrupted run byte-for-byte.
7. **Two counters, never one** (M3, adopted 2026-08-20 after the board-novelty
   misread). Every session summary prints BOTH `certifiedHits` (certify()
   HIT count this run — order-independent) and `admittedHits` (new entries
   added to the persistent board — order-dependent novelty), with their
   definitions in a `metrics` block copied from one source (METRIC_DEFS).
   `checkSessionSummary()` refuses a summary missing either counter or
   carrying a drifted definition. Candidate records carry `seed` per line and,
   for live llm candidates, `promptSha` — the sha256 of the verbatim request
   that produced the candidate, matching the llm-log entry, so the prompt (a
   steering decision) is a recorded experimental input. `verifyLlmLog()`
   catches a tampered or sha-less log entry by line.
8. **The board never deletes** (Phase 3, 2026-08-20). One champion per
   canonical key; a better instance of a boarded object improves the entry in
   place (discoverer's runSeed kept, superseded version archived); a full
   region refuses weaker hits by name (`refused-region-floor` on the record)
   and archives displaced champions to mute.json with the reason and the
   displacer. `admitted` on a candidate record now means exactly what
   METRIC_DEFS says — NEW to the board — and the `board` field names what the
   board did with every certified HIT.

## Phase 5 — referee-grade artifacts

**statement.json — one pinned source for what is being searched.** Optional
per-instance file `{name, statement, candidateSchema?, enumSpec?, emptyBox?}`.
When present, the runner REFUSES (STATEMENT-MISMATCH, field named) if the
target's exports disagree with it; the run header and every claim then carry
`statementSha`. This is the SAT community's 2026 lesson (the Keller
end-to-end verification: the encoding, not the proof, is the trust frontier)
applied to the funnel: the claim text, the schema and the box cannot drift
apart across files, because one file owns them.

**Sharded exhaustion + cover certificate.** `runExhaustSharded(dir,
{windows: K})` splits the declared empty box's first dimension into K
contiguous windows, collects one certificate PER WINDOW, and mints a
cover-tiling certificate; the RECORD claim is their mechanical conjunction
(LRAT-Catcher's cube-merge move, ported to numerics). `verifyShardedExhaust`
is the deliberately tiny checker: tiling geometry (contiguous integer
intervals — disjoint AND complete), every window certificate re-hashed
against its pinned sha, checked-count conservation — everything it needs is
in the record, so a third party re-verifies one window without trusting us.
A window that does not come back exhausted-with-certificate refuses the WHOLE
record by window id (C6: a failed shard is never a silent gap). Checkpointed
per window; kill-and-resume reproduces the record byte for byte.

## The LLM engine — honest line

`generators/llm.js` requires `ANTHROPIC_API_KEY` in the environment at
runtime; **without it, mock mode only** — a deterministic seeded stub, labeled
`mock: true` and `[mock]` in every record it produces. With a key, it POSTs to
the Anthropic Messages API (`claude-sonnet-5` by default, small `max_tokens`,
candidate output constrained by a forced tool call carrying the instance's
`candidateSchema`); the key lives in a host-side closure — never in the
sandbox, never in a record, never printed — and every request/response body is
logged verbatim to `experiments/llm-log.jsonl`. Live responses are not
replay-deterministic; the log is the record of what actually happened. The
selftest battery never touches the network: it forces mock mode by passing an
empty env.

## Running

```
node research/_engine/funnel/funnel.js <instance-dir> --seed S \
  [--generator enum|evolve|llm] [--decades 2,3] [--batch 32] [--audit 0.05]
node research/_engine/funnel/funnel.js <instance-dir> --exhaust
node research/_engine/funnel/selftest/battery.js        # the machine's own gate
```

Programmatic: `require('funnel.js').runFunnel(dir, {seed, generator, decades,
batchSize, rejectAuditRate, wallClockMs, targetPath?, generatorPath?, env?,
quiet?})` (async). Instantiate a new probe by copying `skeleton/` into
`research/probes/<slug>/` and filling the TODOs.

## What the machine never does

- It **mints nothing**: no ledger entry, no claim outside the two shapes, and
  probe output is not ledger-admissible — numbers that ship are re-derived
  inside the gated mission (C4).
- It **sends nothing**: no email, no PR, no submission; the only network call
  is the opt-in LLM proposer, to the Anthropic API, logged verbatim.
- It **never exceeds its directory**: all writes land under the instance dir
  (`experiments/`, `best.json`); generators cannot write at all.
- It **never lets a score admit**: certification or nothing.

Shipping is unchanged by this machine: gates, batteries, forbidden lists, and
the two blocking rules bind at the claim boundary exactly as before
(CLAUDE.md §Probes — curiosity free, claims pay).
