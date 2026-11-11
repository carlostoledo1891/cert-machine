# The Lean intake's spec — the format, written down once

`corpus/lean-intake/<id>/spec.json` is the pre-registration of one Lean intake: the pins, the claimant's
declaration, the planted statements with what is predicted of each, the planted defects. It is committed before the
run. `tools/lean-intake.js` reads it and nothing else; `instruments/intake/spec.schema.json` is this page as a
schema, and `tools/check-intake-specs.js` (a battery) holds every spec on disk to it.

The receiver owns the format. A spec may be written by hand or by claimbox (`python3 -m claimbox intake spec`); both
write this.

## Two formats

- **No `format` field — the first format** (9 to 11 November 2026). Decided exactly as it was, so its twelve records
  re-derive byte for byte. Its known misstatements are listed at the end of this page.
- **`"format": 2`** (from 11 November 2026). The same fields; the differences are in what the record says and are
  marked **[2]** below.

## The fields

| field | required | what it is |
|---|---|---|
| `format` | | absent, or `2` |
| `id`, `what` | yes | the id (the folder's name) and one sentence saying what is checked |
| `polarity` | yes | `proves` or `refutes`: the claimant's term proves the canonical statement or its negation |
| `canonical` | yes | the statement someone else wrote: `url`, `commit`, `path`, `sha256` (of the file), `module`, `decl`, `toolchain`, `what` |
| `canonical.selfContained` | | `true`: the claimant's file declares the same names, so F1 reads a copy of the canonical file with one line added (`namespace IntakeCanon`), shown to be the original constant by constant |
| `canonical.axioms` | | axioms the canonical file itself declares and the proof may rest on (names, or `{canonical, claim}` pairs). Needs `selfContained`. The verdict is then conditional on them |
| `claim` | yes | the claimant's proof: `url`, `commit`, `file`, `sha256`, `decl`, `what`; `kind` and `license` are notes |
| `claim.module` | | the claimant's file is a module of the canonical repository at the same commit: built in place, never copied |
| `intakeImports` | | modules the generated meta-programs import first (a package that sets a library option for every module) |
| `f3` | yes | non-vacuity: `tactic` proves the canonical hypotheses have a model, `what` says the witness; `withClaim` (self-contained files) reads the hypotheses from the copy |
| `mutants` | yes | the planted statements (next section) |
| `mutantNamespace`, `mutantOpen` | | the namespace the planted statements are written in, and what they open |
| `claimReds` | | planted defects of the claimant's file: `id`, `why`, `find`, `replace`, `all`, `expect`, `rule`. Each must be caught by a failed build or a non-standard axiom |
| `f2` | | instance agreement (below). Without it, `f2NotApplicable` gives the reason in words |
| `amendments` | yes | dated changes after the first commit of the spec: `date`, `what`, `before`. Empty when there are none |
| `reproduces` | | a hand record this intake is compared with: `record`, `map` |
| `tools.lean4export` | | the lean4export revision, when the toolchain's tag is not the one to use |
| `writer`, `vocabulary`, `predictions` | | claimbox's: the command and the pinned inputs it wrote the spec from, its words, its counts. **[2]** every path is relative to its repository: no home directory, no leading `/`, no `..` |
| `kernels`, `notInScope`, `success`, `timing`, `expectF1` | | notes for the reader; the tool does not read them |

## A planted statement

`id`, `kind`, `statement` (Lean, as it would stand after `theorem s :`), `why`, `expect`; optional `imports`,
`rule` (the fixed rule that wrote it), `aligned` (its parts line up with the canonical's, for F2 ⇒ F1), `certain`,
`amendment`, `preregistered`.

- `kind`: `same` (the same statement in other words), `wrong`, `equivalent` (logically equivalent, not
  definitionally), `changed` (a rule that can change the meaning), `type` (a type changed), `answer` (claimbox's rule set 2:
  `answer(True)` for `answer(False)` or the reverse; format 2 only).
- `expect`: `ACCEPTED`, `REFUSED by type mismatch`, `NOT ACCEPTED`, or `kernel decides` (nothing predicted; the
  outcome is recorded and is never a miss).

The outcome of a planted statement is one of:

| outcome | meaning |
|---|---|
| `ACCEPTED` | the claimant's term is accepted as a proof of it |
| `REFUSED by type mismatch` | every error is a type mismatch at the claimant's term |
| `DID NOT ELABORATE` **[2]** | an error in the planted statement itself: it never reached the check |
| `FAILED elsewhere` | anything else (a timeout, another error at the claimant's term). In the first format this also covers a statement that did not elaborate |

**[2]** A statement that did not reach the check has `tested: false` and `asExpected: null`. It is named under
`words.F1controls.notTested` and counted neither as a refusal nor as a miss. `NOT ACCEPTED` is met only by
`REFUSED by type mismatch`. The controls are CERTIFIED when, among the statements that reached the check, every
predicted outcome is met, at least one changed, retyped, wrong or equivalent statement is refused, and at least one
rewording is accepted.

## F2

Two shapes. With a JS decider written from the informal sentence: `decider`, `componentMap`, `expect`. With
claimbox's blind reading: `reading` (path, sha256, who proposed it, the readings) and `table` (path and sha256 of
`reading.json` beside the spec; a spec may name a table recorded for another target of the same sentence and
instances — the lift copies those bytes beside it and the sha256 holds them). Both: `informal`, `instanceType`, `instances`, `instanceJson`, `apply`, `chunk`,
`binders`, `what`.

## What a run writes, and the record **[2]**

`run` writes one `.log`, `.exit` and `.seconds` per step under `corpus/lean-intake/<id>/runs/<day>/`, plus
`pin.json`, `assemble.json` and `machine.json`. `record` decides from those facts alone.

- `run.machine`: `cpus` and `memGB` are the smallest of the host's numbers, the container's limits (cgroup) and the
  provider's declared size; each source is kept beside them (`host`, `limit`, `declared`).
- `run.cost`: `{usd, what}` from `cost.json`, written by `node tools/lean-intake.js cost <id> --usd … --what …`.
  Without it the record says `null` and `costNote`. The tool never writes a cost of its own.
- `run.stepSeconds`: the sum over the steps the spec names.
- `notRunHere`: the kernels this run did not run. Another record of the same proof may have run them.
- A spec without `f2` runs no `f2` step.
- No text in the record names a plan or a phase.

## Preflight

`node tools/lean-intake.js preflight <id>` elaborates each planted statement alone (its `theorem s`, without the
claimant's term) against the pinned canonical file and writes
`corpus/lean-intake/<id>/preflight/<day>/preflight.json`. It is run before the pre-registration is committed, so a
statement that cannot elaborate is rewritten or kept knowingly. It runs no identity check and reveals no outcome of
one.

## What the first format's records misstate (erratum, 2026-11-11)

The twelve records in this repository written from 9 to 11 November 2026, and the six records of the prime-gap 186
audit made with the same tool, are kept byte for byte. Read them with these corrections:

1. **A planted statement that did not reach the identity check was counted as if it had been refused.** Its outcome
   in the record is `FAILED elsewhere`. Twelve statements in nine records:
   - counted as a met prediction "NOT ACCEPTED" (ten): N1 and N2 of Erdős #488 from claimbox's spec — its "8 of 8
     certain predictions met" is 6 of 6 tested and 2 not tested; N1 of erdos-669, giuga-weak, giuga-strong and
     sqtuples; N1 of pg186-ax1 and pg186-ax2; N1 and N2 of pg186-dhl;
   - counted as "refused" among the changed statements (two): C01 and C04 of pg186-tuple-x.

   No verdict changes: counted on the tested statements alone, each of the eighteen records still has every
   prediction met, at least three refusals and at least one accepted rewording.
2. **`run.costUSD: 0` was a constant in the code.** It is true of the twelve runs made on a desk machine. It is
   false of the six prime-gap 186 runs, which were made on a rented machine; their cost is in that audit's own
   ledger.
3. **`run.machine` gives the host's processors and memory.** On a rented container (the prime-gap 186 runs: 48
   processors and 377 GB reported) the container had fewer (16 virtual processors).
4. **`notRun` is a fixed list** (leanchecker-paranoid, lean4lean, con-leche, con-ron) meaning "not run by this
   tool". In the prime-gap 186 audit lean4lean was run, and accepted, by another step of the same audit.
5. **`what` names "phase P1 of notes/lean-fidelity-plan-2026-11-09.md"**, a private working note, and `notDecided`
   says "F2 … is phase P2". Neither is part of what was decided.
6. **A spec without F2 still ran an `f2` step, which failed**, and `run.stepSeconds` sums every `.seconds` file in
   the run's folder, including that step and any copy kept from a retried step.
7. **Three records carry a local path.** `spec.writer` in pg186-dhl, pg186-tuple and pg186-liminf names a directory
   of the machine the spec was written on. It identifies nothing a reader can open; the spec's sha256 beside it does.
