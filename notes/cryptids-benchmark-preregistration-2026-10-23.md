# The cryptids audit, run twice: a pre-registered benchmark of the process with and without claimbox

Written 2026-10-23 before any run, on the operator's "Proceed. Can we benchmark the process using claimbox vs not
using? To have more information to the paper?" Nothing below was measured when this was written. Changes after a run
are amendments, dated, below the line.

## The target

google-deepmind/cryptids at commit `664cd03904a870e9a8796476dbf9dbc13a72a37b` (2026-10-22T15:52:03+01:00), cloned
2026-10-23 into the scratchpad, lifted into `corpus/cryptids/` by `LIFT-cryptids.json` with every sha256 in
`PROVENANCE-cryptids.json`. The target memory row is `cryptids-deepmind-2026-10` (OPEN, 2026-10-23).

The repository's finite layer, as read before the run: four candidate transition tables (`artifacts/*/machine.txt`),
five baseline tables derived from five verbatim upstream sources in three formats (`standard`, `tursi`, `nql`), the
state counts of all nine machines, the sha256 pins in `baselines/PROVENANCE.md` and in `verify.py`, the structural
embedding map 21 → 25 for Goldbach, and the simulation checkpoints `verify.py` asserts: both ZF machines at state 64
after 39,753 steps with equal tapes; `riemann_104` at state 19, head −7, 19 nonzero cells after 9,037 steps;
`riemann_95`'s 3,634-step initializer ending in state 15, head −4, nonzero cells at −5 and 18, 20, …, 36; the
Goldbach lockstep checkpoints with `r_even = c_even = 2i + 4`. The repository's theorems (halting equivalences,
non-halting of the holdouts, the semantics) are the Lean kernel's and are OUT OF SCOPE for both arms by construction;
the kernel lane (below) re-checks the build and the axioms as stated, which is a concordance, not a verification.

## The two arms

**Arm H, by hand** — the way cert-machine audited sources before claimbox existed: one lane written for this source,
`tools/run-cryptids.py` (standard library, exact integers), that reads the lifted bytes, derives every table from its
source with its own parser, counts states, hashes, replays every checkpoint, and writes `certs/cryptids-audit.json`,
whose rows state each claim in prose written by the auditor, with the source file, its sha256 and the computed value;
a second implementation in JavaScript held to the Python by the battery; a report page.

**Arm C, through claimbox** — a reader in claimbox, `readers/cryptids.py`, that turns the sentences the source
prints (the READMEs, `PROVENANCE.md`, the constants of `verify.py`) into claimbox objects: the verbatim quote, the
file and its digest, the reading, the predicate; cert-machine's receiver decides them. For the simulation checkpoints
the receiver needs one new primitive, `run`: a (Q, 2) transition table from pinned bytes, a step count, the configuration
reached (state, head, the nonzero cells), decided by a simulator in `instruments/claimbox` in Python and in JavaScript.
Arm C's simulator and arm H's simulator are written separately and share no code; each is the other's second
implementation on the checkpoints.

Both arms are run by the same agent, arm H first (the historical order), then arm C. Whatever arm H learns about the
source is available to arm C; this leak is stated here and in the paper, and it favours arm C's completeness, not its
auditability, which is the property the benchmark is about.

## The metrics, fixed now

- **M1 claims stated**, per arm, by class: hash, count, derivation (table from source), structural map, simulation
  checkpoint, statement-string (what `verify.py` checks by substring), kernel/axiom.
- **M2 pins**: the fraction of stated claims carrying a verbatim quote of the source sentence AND the sha256 of the bytes
  the claim is about.
- **M3 refusals with a rule**: claims each arm declines to state or decide, each with its named rule.
- **M4 recall on planted input defects**: twelve plants, each applied to a copy of the lifted corpus, run through both
  arms; a catch is a changed word or a refusal naming the plant's file. The plants: (1) one cell of a candidate table
  edited; (2) one byte of an upstream source edited; (3) a README state count +1; (4) a README step count +1; (5) a
  checkpoint state changed in the README; (6) a sha256 in `PROVENANCE.md` edited; (7) one entry of the Goldbach embed
  map changed; (8) the halting cell moved to another row of `riemann_95`; (9) two rows of a table swapped; (10) a proof
  file's bytes edited (what `verify.py` records but never compares); (11) a theorem name removed from
  `comparator/all.json`; (12) a trailing comment added to `machine.txt` (a plant that must NOT flip anything).
- **M5 concordance**: on every claim both arms decide, the words agree; a disagreement is a finding, dated.
- **M6 cost**: wall-clock of each arm's full run; lines written for this source in each arm, and what each reused.
- **M7 what an outsider must trust**: for each arm, the files an outsider must read to trust one decision, and whether a
  checker that shares no code with the arm accepts the artifact.
- **M8 the producer's checker**: each gap read in `verify.py` before the run (below), confirmed or refuted by running it
  and by running the arms on the stage it skips.

Gaps read in `verify.py` before the run, to be confirmed by running: it never builds Lean and checks theorem
statements by substring; the `riemann_104` check never runs `riemann_120` although its docstring says it does; the
proof files' sha256s are recorded and compared to nothing; the Goldbach message says 92 cells checked while the code
checks 42; two ZF boot checkpoints (39,753 / state 64 and 39,773 / state 99) are used without explanation; the
simulations stop at 250,000 steps.

## The kernel lane (arm-neutral)

A workflow on hosted runners, modelled on `apn-kernel.yml`: the repository at the pin, Lean `v4.35.0-rc4` with the
Mathlib cache, `lake build Cryptids Challenge`, comparator with the configurations the repository ships
(`constructive.json`, `all.json`), nanoda on the export where the toolchain pairing allows it, the axioms per theorem
recorded. A job that cannot finish is REFUSED, never REFUTED. The BusyBeaver library (299 theorems) is a second,
optional dispatch.

## Kill switch and reporting rule

If either arm states fewer than 20 finite claims, the benchmark is reported as thin and no comparison is drawn. Every
number in the report and in the paper's benchmark table is read from `certs/cryptids-benchmark.json`, which is
written by a tool from the two arms' records and refuses to build when either moves.

## Deliverables

`certs/cryptids-audit.json` (arm H), claimbox's `records/cryptids-run.json` and `records/cryptids-recall.json` (arm C,
lifted here), `certs/cryptids-benchmark.json` (the comparison), `certs/cryptids-kernel.json` (the kernel lane),
`/reports/cryptids.html` (leading with the gaps, dated at the pin), one GitHub issue draft on the operator's word,
and the method paper's variant with a claimbox toggle (`\ifclaimbox`) carrying the benchmark as a results subsection,
for comparison with the base version.

---
Amendments: none yet.
