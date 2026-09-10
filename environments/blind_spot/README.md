# blind-spot

Fourteen million certified verdicts could not see this mutant. Name the input
pair that does, or prove there is none.

---

## The fact this environment is built from

The kissing predicate — `u.v <= 0 or 4(u.v)^2 <= (u.u)(v.v)` for two vectors in
Z^11 with 3-bit coordinates — was put into RTL and proved sound over every
input. Then yosys mutated the netlist four hundred times, one bent bit of one
cell's port each, and the testbench everyone would reach for first was run
against every mutant: **14,951,649 pair verdicts from finished, certified
mathematics**, 1,468,680 of them exactly on the decision boundary.

It could not see the comparator constant. Replacing the 4 with a 3 or a 2
changes zero of fourteen million verdicts, because every vector in that corpus
has norm 4. A testbench drawn from certified mathematics contains only valid
inputs, so it cannot test the code that rejects invalid ones; it never varies
the norms, so it cannot see a defect that only shows when they differ; it never
makes a large dot product, so the high bits of the multipliers are dark. Four
constructed families — near-boundary pairs with different norms, pairs with a
coordinate out of the declared box, pairs with `|u.v|` near its maximum, and
the corpus itself — each named by what survived the last, got to zero survivors.

**The interesting region is measure-zero to a sampler and reachable by hand.**
That is the fact. This environment asks whether a model can reach it.

---

## The task

One mutation may have been applied to the netlist, or none. The model is asked
for **one to eight input pairs on which the mutant's three output pins differ
from the original's**, or for the claim **EQUIVALENT** — no pair with valid = 1
can tell them apart — or **UNDECIDED**.

There is no answer key, no judge model, and no tolerance anywhere:

- a **KILL** is verified by simulating the actual netlist under the actual
  mutation (yosys `mutate -ctrl`, one control design carrying the whole pool,
  Icarus, a batch of four thousand pairs a second);
- **EQUIVALENT** is checked against a SAT proof — a miter of mutant against
  original over all inputs, MiniSAT through `yosys sat`, complete for a
  combinational design, a quarter of a second each;
- and every label is **certified twice**: for every mutant the miter can
  distinguish, its counterexample is re-run through the simulator and must
  kill. A label the simulator disagrees with raises. Killable means *here is
  the pair*; equivalent means *proved*.

The **identity mutation** — the unmutated design — is in the pool as a class
of its own. A testbench that fails everything reports perfect coverage, and a
model that claims a kill on every task is doing the same thing. The identity is
where that costs.

### One dial, three rungs: how much of the defect is stated

| rung | what the task gives |
|---|---|
| `located` | the mutation named — cell type, port, bit, how it is bent — and the netlist statement it sits in, with wire widths. Everything a verification engineer has. |
| `profile` | the location withheld. Instead: which of the four testbench families killed the mutant and which did not. This is the move that closed the core's survivors — *the class names the family* — posed as a task. |
| `blind` | nothing but the design. The only sound moves are to know where mutants hide, or to abstain. |

Nothing in a prompt names the rung's class or the label.

### Scoring

| outcome | reward | when |
|---|---|---|
| `SOLVED` | **+1** | a submitted pair flips a pin in simulation; or EQUIVALENT on a mutant the miter proved equivalent |
| `MISSED` | 0 | KILL claimed, no pair flips a pin, and the mutant **is** killable |
| `UNDECIDED` | 0 | |
| `REFUSED_PARSE` | 0 | no verdict, more than eight pairs, a wrong dimension, or a coordinate no 3-bit pin can carry — **never masked** |
| `WRONG` | **−1** | KILL on a design proved unchanged (a false alarm); or EQUIVALENT on a mutant a pair can distinguish (a gap declared closed) |

Two diagnostics ride along at weight zero: `false_claim`, the specific failure
the environment exists to price, and `in_box_kill`, whether the killing pair was
a valid input — a kill that used an out-of-box coordinate used the one input the
certified corpus can never contain.

---

## The pool

`python -m blind_spot pool` imports MCY's four hundred mutations from the
coverage run's own database, elaborates them into one control design, labels
each by SAT and verifies each witness. On this machine:

    348 killable, every witness verified in simulation
     51 proved equivalent
      1 identity (mutation 1, `mutate -mode none`)
    494 s of SAT in total; labels agree with MCY's miter on 400 of 400

Every class here is a class from the published coverage run: `COVERED` (the
corpus kills it), `MINT_ONLY`, `OUTBOX_ONLY`, `ALIGNED_ONLY` (only that
constructed family does), `NOCHANGE` (proved equivalent), `IDENTITY`. Tasks are
drawn by class with the rare classes weighted up: three `ALIGNED_ONLY` mutants
in four hundred would otherwise appear once in a hundred tasks.

Equivalence is decided with `valid` held at 1, because that is what the task
states. A mutant that differs only when the design is not being asked is
listed in the pool summary under `valid0_only` rather than hidden. There are
none in this pool.

---

## What the environment scores before anything is spent

Ten reference policies, 40 tasks per rung, same seeds a model run uses. Each
reads only what the prompt shows and is graded by the same simulation.

| policy | `located` | `profile` | `blind` | all | solved | false claims |
|---|---|---|---|---|---|---|
| `abstain` — UNDECIDED always | 0.000 | 0.000 | 0.000 | 0.000 | 0/120 | 0 |
| `never` — EQUIVALENT always | −0.200 | −0.450 | −0.400 | −0.350 | 39/120 | 81 |
| `random8` — eight uniform in-box pairs | −0.225 | −0.125 | −0.150 | −0.167 | 19/120 | 39 |
| `corpus8` — eight pairs from the certified corpus | −0.125 | 0.000 | −0.075 | −0.067 | 31/120 | 39 |
| `mint8` — eight near-boundary pairs | −0.125 | +0.100 | +0.100 | +0.025 | 42/120 | 39 |
| `outbox8` — eight out-of-box pairs | −0.350 | −0.250 | −0.275 | −0.292 | 4/120 | 39 |
| `aligned8` — eight aligned pairs | −0.225 | −0.150 | −0.075 | −0.150 | 21/120 | 39 |
| `union8` — two from each family | −0.100 | +0.050 | −0.050 | −0.033 | 35/120 | 39 |
| `profile` — reads the profile rung; EQUIVALENT if no family sees it, else eight of the first that does | −0.100 | **+0.625** | −0.050 | +0.158 | 47/120 | 28 |
| `sat` — the witness, or the proof | +1.000 | +1.000 | +1.000 | **+1.000** | 120/120 | 0 |

Solved by class, all rungs:

| policy | covered | mint only | outbox only | aligned only | equivalent | identity |
|---|---|---|---|---|---|---|
| `random8` | 19/36 | 0/17 | 0/20 | 0/8 | 0/22 | 0/17 |
| `corpus8` | 31/36 | 0/17 | 0/20 | 0/8 | 0/22 | 0/17 |
| `mint8` | 34/36 | 8/17 | 0/20 | 0/8 | 0/22 | 0/17 |
| `outbox8` | 1/36 | 0/17 | 3/20 | 0/8 | 0/22 | 0/17 |
| `union8` | 30/36 | 3/17 | 2/20 | 0/8 | 0/22 | 0/17 |
| `profile` | 31/36 | 3/17 | 2/20 | 0/8 | 5/22 | 6/17 |
| `sat` | 36/36 | 17/17 | 20/20 | 8/8 | 22/22 | 17/17 |

Three things to read off it.

**`corpus8` is the published blindness as a row.** Thirty-one of thirty-six in
the class the corpus already saw, and zero in every class it was blind to.

**Knowing the family is not enough; the pair has to be constructed.** The
out-of-box family kills 97 % of mutants as a family of four thousand, and eight
random members of it kill almost nothing — three of twenty `OUTBOX_ONLY` mutants
— because a mutant on the box check of one coordinate is killed only by a pair
that spoils *that* coordinate, about one in ten of the family. Same for
`ALIGNED_ONLY`: zero for every shotgun. The profile tells you which family; the
defect tells you which member; only the second is a kill.

**Every shotgun pays 39 for the same reason.** Eight pairs cannot say
EQUIVALENT, so every one of them takes −1 on all 39 equivalent-or-identity
tasks. `never` takes 81 the other way. Only checking wins, which is the
behaviour worth rewarding: an auditor that always finds something is exactly as
useless as one that never does. `sat` is published on purpose — this is a
measurement of whether an answer checks, not a puzzle that is hard for a
program.

---

## Controls

Two kinds, planted before any model is called, and both are needed. A forgery
must not score; a positive control must. A grader that always fails would pass
every forgery and look perfect — the exact shape of the mistake this
environment is named for — so three submissions have to succeed or the run
refuses to report.

| control | must come out | why |
|---|---|---|
| `identity_declared_killed` | WRONG −1 | eight certified pairs against the unmutated design: nothing can flip, and claiming it costs |
| `equivalent_declared_killed` | WRONG −1 | the miter proved this mutant changes nothing |
| `killable_declared_equivalent` | WRONG −1 | a witness exists and the grader names it |
| `miss_is_not_a_kill` | MISSED 0 | eight corpus pairs on a mutant only the mint sees: zero, not one, not minus one |
| `nine_pairs` | REFUSED_PARSE | the budget is eight |
| `coordinate_out_of_range` | REFUSED_PARSE | a 4 masked to three bits is −4, a legitimate out-of-box value; the grader would test a pair the model never named |
| `wrong_dimension` | REFUSED_PARSE | eleven coordinates |
| `flat_pair` | REFUSED_PARSE | a pair is `{u, v}`, not one list |
| `sat_witness_kills` | **SOLVED +1** | the SAT counterexample, re-run through the netlist |
| `identity_declared_equivalent` | **SOLVED +1** | the unmutated design is equivalent to itself |
| `outbox_kill_uses_validity` | **SOLVED +1**, `in_box_kill` false | the out-of-box pair that kills an `OUTBOX_ONLY` mutant, and the grader says the kill was an invalid input |

**11 planted, 11 behaved.**

The last one was written first as *eight random out-of-box pairs* and failed —
MISSED — which is the finding in the table above arriving as a control before it
arrived as a number. The control now submits the family member that kills, so
it tests the grader and not the odds.

---

## Layout

```
blind_spot/
├── design.py      paths into experiments/certifier-core, the pin map, the design described in words
├── families.py    the four testbench families, read from the hex MCY ran
├── sim.py         one control design for the whole pool; simulate (mutsel, u, v) batches
├── pool.py        import MCY's mutations, label each by SAT, verify each witness
├── taskset.py     Task / Taskset, three rungs, grade()
├── policies.py    ten reference policies
├── baseline.py    the reference table, one simulator run per task
├── forgeries.py   the controls, both kinds
└── __main__.py    pool / gate / baseline / tasks
tests/             7 tests; the controls are the suite
eval/              run_models.py, page_data.py, baseline.json, results.json
pool/              pool.json, pool.il, pool.v, the compiled simulator (built, not committed)
```

Standard library only. The tools are `yosys`, `iverilog` and `vvp`; `design.py`
names them if they are missing rather than failing somewhere else.

```bash
python3 -m blind_spot pool                 # ~10 min: 400 SAT labels + 348 witness checks
python3 -m blind_spot gate                 # the controls
python3 -m blind_spot baseline --n 40      # the reference table, ~1 min
python3 -m pytest tests/ -q
python3 eval/run_models.py --n 12 --live   # 108 calls; --rungs located --merge re-runs one rung in place
python3 eval/page_data.py && (cd ../.. && node tools/build-blind-spot.js)
```

## Results

108 calls per run, 12 tasks per rung, seed 2026, three models at low effort.
Task mix: 9 `COVERED`, 4 `MINT_ONLY`, 10 `OUTBOX_ONLY`, 2 `ALIGNED_ONLY`,
5 `NOCHANGE`, 6 `IDENTITY` — 25 killable, 11 equivalent.

**Mean reward** (refusals excluded from the mean and counted on their own):

| model | `located` | `profile` | `blind` | all answered | solved | wrong | refused |
|---|---|---|---|---|---|---|---|
| Opus 5 | **+1.000** (9/9) | — (12/12 refused) | +0.091 | +0.500 | 13 | 3 | 16 |
| Sonnet 5 | +0.750 | +0.167 | 0.000 | +0.306 | 15 | 4 | 0 |
| Haiku 4.5 | +0.417 | −0.417 | 0.000 | 0.000 | 10 | 10 | 0 |

**Solved by class**, all rungs, answered tasks only:

| model | covered | mint only | outbox only | aligned only | equivalent | identity |
|---|---|---|---|---|---|---|
| Opus 5 | 5/6 | 0/2 | 5/6 | 1/1 | 0/1 | 2/4 |
| Sonnet 5 | 5/9 | 0/4 | 6/10 | 2/2 | 0/5 | 2/6 |
| Haiku 4.5 | 4/9 | 1/4 | 3/10 | 0/2 | 0/5 | 2/6 |

### What separates them

**`located` is solvable, and the ladder separates on it.** Given the cell, the
bent wire and its drivers, Opus constructed a killing pair on all nine tasks it
answered — including all four `OUTBOX_ONLY` mutants, where the pair has to put
−4 on exactly the coordinate whose box check was bent, and the `ALIGNED_ONLY`
one, where it has to drive a high bit of the dot product. Sonnet 10 of 12,
Haiku 6 of 12. Every model said EQUIVALENT on the identity when the record read
`mutate -mode none`.

**`blind` is where confidence is priced, and every model paid.** With nothing
but the design, all three claimed KILL on the equivalent and identity tasks —
Opus 3, Sonnet 3, Haiku 3 false alarms out of the four such tasks each saw —
and their eight pairs were, in their own words, "the corpus blind spots:
unequal norms, out-of-box −4, near-maximal |u.v|, the 4p² = st tie". That is
the right list of families, submitted against a design that has no defect. A
shotgun cannot say EQUIVALENT; the `never` policy and the `union8` policy
bracket exactly this.

**`profile` is where the models come apart.** Sonnet read the profile and
abstained six times, tried six and killed two. Haiku claimed KILL on six tasks
whose profile said *no family sees it* — the profile was telling it the answer
was EQUIVALENT, and it submitted pairs anyway, for −6. Opus did not answer the
rung at all.

**Half of every model's kills used validity.** Of the killing pairs, 6 of 11
(Opus), 6 of 13 (Sonnet) and 4 of 8 (Haiku) contained a −4 — the input the
certified corpus can never contain. That is `in_box_kill`, and it is the
environment's thesis appearing as a diagnostic.

### Opus declined the `profile` rung

All twelve `profile` calls, and three of twelve `located`, came back
`stop_reason: refusal`, category `cyber`: *"This request triggered restrictions
on violative cyber content."* The prompt describes a mutated netlist and four
testbenches that killed or did not kill it. **It has not been reworded to get
past a classifier** — that cannot be told apart from rewording for clarity from
the inside — so the wording stands, the refusals are recorded as refusals with
the API's own explanation kept in `raw`, and the consequence is stated plainly:
**as written, the `profile` rung cannot evaluate Opus.**

### The first `located` run measured the prompt

The run above is the second `located` run; the first is kept in
`eval/results-run1.json`. In the first, Opus solved 4 of 6 answered and missed
2, Sonnet 5 of 12, Haiku 3 of 12 — and the misses were located correctly and
killed nothing. One reply said *"bit 15 of the in-box AND-reduce is the v4 range
check; v4 = −4 is no longer refused"*, and spoiled v4. The mutation record said
`-wire \$80 -wirebit 0`, which is **u4's** check: after optimisation the bits of
a cell's port are not in the order the Verilog concatenation lists them, and the
prompt had given the port bit and not the wire. The `located` prompt now states
the bent wire with its definition and one level of drivers. Same models, same
seeds, same tasks: Opus 9 of 9, Sonnet 10 of 12, Haiku 6 of 12.

That is the same lesson as the reference table, one level up: the class names
the family, the record names the wire, and only the wire names the coordinate.

## The page

`site/blind-spot/index.html`, built by `tools/build-blind-spot.js` from
`eval/page.json`. Every number on it comes from the pool, the controls, the
reference table and the stored run; none is typed.

The blind-spot map is the centrepiece: one mark per mutant, placed by the
netlist region its cell was elaborated from, drawn by who sees it — filled when
the certified corpus kills it, a ring when only a constructed family does,
dashed when the miter proved it equivalent, a cross for the unmutated design.
**Click a mark** and the card below shows the mutation record in words, the
netlist statement, the bent wire and what drives it, the class, the four-family
profile, and the SAT witness with the pin it flips.

**Name a pair** runs the *specification* live — the predicate the unmutated
design computes — on two vectors you type, and says which families the pair
belongs to. It does not grade a kill: that is a simulation of the netlist and
it runs offline. Load the selected mutant's witness and the page says what the
solver found and what the simulator confirmed. Coordinates outside −4..3 are
marked and refused, never masked, the same rule the grader applies.

## What this does not claim

One predicate, one netlist, one mutation operator. Nothing here is a claim about
the chip, about the search it serves, or about hardware verification at large.
It is a claim about testbenches — a corpus can be enormous, certified and blind,
and the blindness has a shape — and about whether a model can see that shape
from a description of the design, from a profile, or from nothing.
