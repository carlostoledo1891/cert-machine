# blind-spot as an Inspect task

The same task, the same scorer, a second framework. `environments/blind_spot`
is published on the Prime Intellect hub through `verifiers`
(`carlos-toledo/blind-spot`); this directory is the identical task as an
[`inspect_ai`](https://inspect.aisi.org.uk) `Task`, graded by **the same
function** the verifiers rubric calls. There is no answer key, no judge model
and no tolerance anywhere: a KILL is verified by simulating the actual netlist
under the actual mutation, and EQUIVALENT is checked against a SAT proof on a
hand-written miter.

```bash
make blind-spot-venv                    # python3.12 venv with inspect_ai + the Anthropic SDK (one-time)
V=environments/blind_spot/.venv/bin

$V/inspect eval environments/blind_spot/inspect/task.py@blind_spot_located \
    --model anthropic/claude-sonnet-5 --effort low --max-tokens 12000 \
    --log-format json --log-dir environments/blind_spot/inspect/logs
# likewise @blind_spot_profile, @blind_spot_blind, or @blind_spot for all three cycling

python3 environments/blind_spot/inspect/ledger.py      # re-score every log; write certs/blind-spot-inspect-ledger.json
python3 environments/blind_spot/inspect/battery.py     # the gate, on `make test` and the control page
```

Needs `yosys`, `iverilog` and `vvp` on PATH (`brew install yosys icarus-verilog`).
The compiled pool simulator is built on first use (~40 s). Anthropic access is
either `ANTHROPIC_API_KEY` or the OAuth profile as `ANTHROPIC_AUTH_TOKEN`
(Inspect sends it as a Bearer with the `oauth-2025-04-20` beta, which is what
`eval/run_models.py` does by hand).

## The task

One mutation may have been applied to `core_euclid_strict` — a combinational
circuit deciding whether two vectors in Z^11 with 3-bit coordinates meet at an
angle of at least 60° — or none. The model names one to eight input pairs on
which the mutant's three output pins differ from the original's, or answers
EQUIVALENT (no pair with valid = 1 can tell them apart), or UNDECIDED. The
prompt is `Task.prompt()` from `blind_spot/taskset.py`, byte-identical to the
verifiers `question` for the same `(seed, index)`; the battery checks that.

**The pool** is MCY's 400 mutations of one design, labelled once by SAT and
verified once by simulation, shipped as `pool/pool.json`:

| | count |
|---|---|
| killable, with a simulator-verified witness | 348 |
| proved equivalent (miter UNSAT) | 51 |
| the identity (`mutate -mode none`, MCY's mutation 1) | 1 |

By the class the published coverage run gave them: `COVERED` 302, `OUTBOX_ONLY`
35, `MINT_ONLY` 8, `ALIGNED_ONLY` 3, `NOCHANGE` 51, `IDENTITY` 1. Tasks are drawn
by class with the rare classes weighted up (`taskset.CLASS_WEIGHTS`), so a
36-task draw at seed 2027 holds 28 killable and 8 equivalent-or-identity tasks.

### The three rungs are three variants

One dial — how much of the defect is stated — as three Inspect tasks over ONE
taskset. The verifiers environment cycles the rung with the index
(`located, profile, blind, located, …`), so a rung variant is the indices
congruent to its offset mod 3 at the same seed, and a task keeps its identity
across frameworks: sample id `2027-4` is `Taskset(2027).sample(4)` in both.

| variant | what the prompt gives | default draw |
|---|---|---|
| `blind_spot_located` | the mutation named — cell, port, bit, how it is bent — the netlist statement it sits in, the wire actually bent and one level of its drivers | 12 tasks, indices 0, 3, 6, … |
| `blind_spot_profile` | the location withheld; which of the four testbench families (corpus, mint, out-of-box, aligned) killed the mutant and which did not | 12 tasks, indices 1, 4, 7, … |
| `blind_spot_blind` | nothing but the design | 12 tasks, indices 2, 5, 8, … |
| `blind_spot` | all three, cycling, as the verifiers dataset does | 36 tasks |

Task args: `-T num_tasks=N -T seed=S -T start=K`. Seed 2027 is the verifiers
adapter's *eval* taskset for its default seed 2026 (train and eval are disjoint
by seed, not index, so both halves see the same rung mixture).

## The scorer

`exact_verifier()` in `task.py` calls `blind_spot.adapters_v0._decide` — the
function every reward function in the verifiers `Rubric` calls — on Inspect's
own assistant messages (text parts only; a verdict inside a reasoning block is
not an answer). `_decide` rebuilds the task from `(seed, index)` in the sample's
metadata, parses the last JSON object carrying a verdict, and grades:

| outcome | `reward` | when |
|---|---|---|
| `SOLVED` | **+1** | a submitted pair flips a pin in simulation; or EQUIVALENT on a mutant the miter proved equivalent |
| `MISSED` | 0 | KILL claimed, no pair flips a pin, and the mutant **is** killable |
| `UNDECIDED` | 0 | |
| `REFUSED_PARSE` | 0 | no verdict, more than eight pairs, a wrong dimension, or a coordinate no 3-bit pin can carry — never masked |
| `WRONG` | **−1** | KILL on a design proved unchanged (a false alarm); or EQUIVALENT on a mutant a pair can distinguish (a gap declared closed) |

The `Score.value` is a dict with the rubric's five numbers — `reward`, `solved`
(the same decision in {0, 1}), `well_formed`, `false_claim`, `out_of_box_kill`
— and Inspect reports mean and stderr of the first two. **"Solved" means
`reward = +1` and nothing else**: a correct diagnosis with no killing pair is
MISSED; a kill through an out-of-box coordinate is SOLVED with
`out_of_box_kill = 1`, which is the environment's thesis as a diagnostic.

### What the battery proves, every build

`battery.py` runs on `make test` and on the control page. It finds a `(seed,
index)` that draws each of the 400 pooled mutants, then scores the truthful
answer (the witness, or EQUIVALENT) and UNDECIDED **three ways** — the Inspect
scorer on an Inspect `TaskState`, `api.score(seed, index, text)` (the verifiers
path), and `taskset.grade` on the task itself — and requires agreement field
for field; the false claim is scored the same three ways on all 52
proved-equivalent mutants and 40 killable ones. Red controls: **a witness with
one coordinate changed stops killing under both scorers** — MISSED, reward 0,
never SOLVED — on every mutant where it stops (the first run of this control
found it does not stop on all of them: a mutant on the box check of u4 is
indifferent to u0, and there both scorers say SOLVED; what is invariant is
that the two never split, and the battery says how many of its 25 stopped); a
killing verdict buried in a reasoning block under a final UNDECIDED grades
UNDECIDED both ways round; a coordinate of 4 is refused, never masked to −4.
Every recorded log is re-scored offline and must agree with what Inspect
wrote; the ledger's pins are re-hashed.

## The ledger, and what has been run

Every number below is read from `certs/blind-spot-inspect-ledger.json`, which
`ledger.py` writes from the logs in `logs/` by **re-scoring every sample** with
`api.score` (the counts are this package's reading of the log, not Inspect's
metrics; a disagreement would be recorded, and the battery refuses on it).

<!-- results:begin -->
**Frontier models, through `inspect eval`** (every rollout re-scored offline by the package; the reward is this package's reading, and it equals Inspect's on every row):

| model | effort | rung | n | solved | wrong | missed | undecided | unreadable | errors | mean reward | out-of-box kills | cost floor |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| claude-haiku-4-5-20251001 | default | blind | 12 | 4/12 | 3 | 5 | 0 | 0 | 0 | +0.083 | 0 | $0.10 |
| claude-haiku-4-5-20251001 | default | located | 12 | 3/12 | 2 | 6 | 1 | 0 | 0 | +0.083 | 0 | $0.07 |
| claude-haiku-4-5-20251001 | default | profile | 12 | 4/12 | 2 | 5 | 1 | 0 | 0 | +0.167 | 2 | $0.09 |
| claude-opus-5 | low | located | 12 | 10/12 | 0 | 0 | 0 | 2 | 0 | +0.833 | 3 | $0.09 |
| claude-opus-5 | low | profile | 12 | 2/12 | 0 | 0 | 0 | 10 | 0 | +0.167 | 0 | $0.02 |
| claude-opus-5 | low | blind | 12 | 4/12 | 3 | 3 | 0 | 2 | 0 | +0.083 | 1 | $0.29 |
| claude-sonnet-5 | low | blind | 12 | 3/12 | 3 | 5 | 0 | 1 | 0 | +0.000 | 0 | $0.08 |
| claude-sonnet-5 | low | located | 12 | 8/12 | 1 | 3 | 0 | 0 | 0 | +0.583 | 0 | $0.12 |
| claude-sonnet-5 | low | profile | 12 | 6/12 | 0 | 3 | 3 | 0 | 0 | +0.500 | 2 | $0.11 |
| claude-sonnet-5 | medium | blind | 12 | 5/12 | 3 | 4 | 0 | 0 | 0 | +0.167 | 1 | $0.30 |
| claude-sonnet-5 | medium | located | 12 | 10/12 | 0 | 2 | 0 | 0 | 0 | +0.833 | 1 | $0.27 |
| claude-sonnet-5 | medium | profile | 12 | 8/12 | 0 | 3 | 1 | 0 | 0 | +0.667 | 2 | $0.26 |
| claude-sonnet-5 | high | blind | 12 | 5/12 | 3 | 3 | 0 | 1 | 0 | +0.167 | 1 | $0.54 |
| claude-sonnet-5 | high | located | 12 | 12/12 | 0 | 0 | 0 | 0 | 0 | +1.000 | 3 | $0.52 |
| claude-sonnet-5 | high | profile | 12 | 6/12 | 1 | 2 | 0 | 3 | 0 | +0.417 | 1 | $1.01 |

The cost column is a floor: errored rollouts report no usage. Each run is one `inspect eval` of one rung variant; the seed is 2027 and the tasks are the same ids across models and efforts.

**The pipeline controls** — the three reference policies as Inspect solvers on the mixed task (controls of the pipeline, never model results; the ledger marks them `control: true`):

| policy | `located` | `profile` | `blind` | all | note |
|---|---|---|---|---|---|
| `sat` — the witness, or the proof | +1.000 | +1.000 | +1.000 | +1.000 | 36/36 solved, 0 false claims |
| `abstain` — UNDECIDED always | +0.000 | +0.000 | +0.000 | +0.000 | 0/36 solved, 0 false claims |
| `never` — EQUIVALENT always | -0.667 | -0.500 | -0.500 | -0.556 | 8/36 solved, 28 false claims |

Refused attempts are kept, not hidden: 1 under `logs/blocked/` (the last: anthropic/claude-sonnet-5 on 2026-09-21, error, `Error code: 400 - {\'type\': \'error\', \'error\': {\'type\': \'invalid_request_…`).
<!-- results:end -->

## Human baselines

Without human times there is no time horizon. They go in
[`../baselines.json`](../baselines.json): five to ten timed attempts per rung by
people with a digital-design background, on the first six tasks of each
variant at seed 2027 (listed under `tasks`, the same ids a model run scores),
graded by the same scorer, under a pseudonym and the consent line the file
carries. The file is sha256-pinned in the ledger; `ledger.py
--grade-baselines` grades every reply with the exact verifier and refuses a
stored outcome that disagrees. **Status: NO DATA** — the recruiting request is
drafted (`outreach/blind-spot-baselines-request-2026-09-21.md`) and is the
operator's to send.

## Layout

```
inspect/
├── task.py           the Task, the four variants, exact_verifier() = adapters_v0._decide
├── run_control.py    the three reference policies through the pipeline (no API, no money)
├── ledger.py         logs → certs/blind-spot-inspect-ledger.json; --grade-baselines; --check
├── battery.py        the gate (runs under ../.venv; builds it on first run)
├── logs/             every `inspect eval` record, JSON; logs/blocked/ the refused attempt
└── README.md         this file
../baselines.json     the human baselines, pinned, NO DATA yet
```

`import blind_spot` stays standard-library only; `inspect_ai` is imported by
`task.py` and nothing below it, so the framework-free claim of the package
holds here as it does for `verifiers`.
