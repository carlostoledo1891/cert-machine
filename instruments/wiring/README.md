# lattice-claims

Decide a claim about a short lattice vector exactly — or refuse it, naming the
quantity it left out.

---

## The mistake this environment is built from

Auditing 37 published SVP-challenge records, our grader reported **32 of them as
disagreeing with their published figure**. The grader was bit-exact. The finding
was entirely false.

Every discrepancy sat at about 1×10⁻⁴, and half a unit of norm is worth 1.7×10⁻⁴
at those magnitudes. The published ratios had been computed from the *true* norm
and then printed rounded; our exact ratio was computed *from the rounded norm*.
Two exact numbers, different references, and the comparison was meaningless.
Both signs of discrepancy appeared, which was the tell.

Exactness did not save us. **Naming what the claim was about would have.**

That is the whole thesis. A grader can be correct to the last bit and still
wrong, because it compared against a quantity the claim was not about — so in
this environment a submission must declare the reference it decided against, and
a right verdict reached from the wrong reference does not score as right.

> *"A scheme with a 50-bit security level looks identical to a 128-bit scheme to
> someone not running the estimator."*
> — a parameter-selection guide, on why nobody notices

---

## Limits, before anything else

**This certifies arithmetic about a stated lattice and a stated threshold. It
certifies nothing about attack cost, and it is not a claim that any deployed
scheme is weak or strong.** Concrete security depends on cost models that the
field's own authors say cannot yet be pinned down precisely; nothing here
touches that, and a headline saying otherwise would be the one kind of
overclaiming this project cannot afford.

**The float-versus-exact story is weaker than it looks, and we measured it.** A
careful float grader — log domain, never converting the determinant — agrees
with the exact decision on every real record we have checked, 37 of 37. The
tightest margin in the published table is 1.4×10⁻⁴ against a double's 10⁻¹⁶.
Precision is not where this domain breaks. Overflow is, and specification is.

---

## What it measures

One dial, three rungs: **how much of the reference is stated.**

| rung | what the task gives | correct answers |
|---|---|---|
| `declared` | every quantity exact and stated | `ADMISSIBLE` / `REFUSED` |
| `printed` | the norm as a whole number, as published tables give it | `ADMISSIBLE` / `REFUSED` / `STRADDLES` |
| `underspecified` | a required quantity is absent | `NEEDS_DATA`, naming the field |

`STRADDLES` is not a hedge. A norm printed as a whole number genuinely fails to
determine the claim when the record sits within half a unit of the threshold —
this happens in the wild, and the environment mints it on demand.

Every task is procedural and deterministic from a seed, so nothing leaks into
pretraining and a run resumes exactly. `INFINITE = True`.

### The generator's one trick

Finding a short vector is the hard problem; nobody generates instances that way.
But a lattice can be **built around a short vector chosen first**. A
Goldstein–Mayer lattice is fixed by its modulus `q` and entries `xs`, and a
vector lies in it exactly when `v[0] − Σ v[i]·xs[i−1] ≡ 0 (mod q)` — one linear
congruence. So choose `v` freely and small, choose all but one of the `xs` at
random, and solve the congruence for the last. The result is an ordinary lattice
of determinant `q` that happens to contain a vector whose norm we picked.

The norm is *solved for*, not sampled: `v[0]` is free, so it absorbs whatever
makes the squared norm land on target. That is what places an instance a few
parts in 10⁵ from the wall on demand.

Floats appear in the generator and nowhere else. Choosing which instance to mint
is not a decision about a claim, so a float may propose it; the exact predicate
then measures what was actually minted, and that measurement is what ships.

---

## Rewards

| reward | weight | meaning |
|---|---|---|
| `certified` | scored | the verdict is the one the exact decision gives |
| `well_formed` | 0, diagnostic | the submission declared its reference, and it is the one the task states |
| `not_hacked` | 0, diagnostic | a float grader would have agreed |

Feedback on failure is the violated relation and nothing else.

---

## Forgeries

Planted before any model is called. If one is accepted, the suite aborts.

| forgery | must fail | why |
|---|---|---|
| `not_in_lattice` | `certified` | membership fails, so the claim fails |
| `zero_vector` | `certified` | short, in the lattice, and not a solution |
| `neighbour_lattice` | `certified` | one basis entry moved, the vector left |
| `rounded_reference` | `well_formed` | **ours** — right verdict, decided against the rounded norm |
| `factor_swap` | `well_formed` | decided at factor 1 while declaring 21/20 |
| `confident_on_underspecified` | `certified` | a quantity is absent; only `NEEDS_DATA` is correct |
| `wrong_gap_named` | `certified` | refusing is right, naming the wrong gap is not |
| `straddle_called_definite` | `certified` | a rounded norm does not determine this claim |
| `overflow_canary` | `certified` | `float(q)` is `inf`, so a float grader accepts anything |
| `gap_named_in_own_schema` | `certified` | **ours, again** — `NEEDS_DATA` naming the wrong gap, with the right gap's name present only as a key of its own `reference` block |

**10 planted, 10 caught, 0 accepted.**

`zero_vector` earned its place by catching a hole in *our* exact grader, not in a
model: `decide` alone happily accepts the zero vector, because 0 ≤ anything. The
claim is about a **nonzero** vector, and the predicate did not know that until a
forgery said so.

`gap_named_in_own_schema` is the second grader hole, found in review. The first
fix for the spelling bug (below) let the grader search the *whole reply* as
prose for the name of the absent quantity. On a task missing `claim.factor`, a
reply saying `"missing": "q"` — the wrong gap — scored as right, because the
word `factor` sits in its own `reference` block. The grader now reads only the
`missing` field (wherever a model puts it, top level or inside `reference`), and
only the head of it — the words before any parenthesis or dash — because models
write `"q (the lattice modulus for the Gaussian heuristic ...)"` and the
parenthesis is explanation, not the name. The 135 stored replies were re-graded
under the fixed grader with no API call: **the scored reward moved on 0 rows**;
the diagnostic `well_formed` moved on 19 — 14 replies on the `printed` rung that
declared the factor and no single norm are now well-formed, and 5 confident
wrong answers that never named a gap no longer are.

---

## The canary, and what it actually shows

Sampled `declared` tasks, exact verdict against both float graders:

| dimensions | naive float disagrees | careful float disagrees |
|---|---|---|
| 24 – 90 (`q` < 10³⁰⁸) | 0 / 12 | 0 / 12 |
| 104 – 140 (`q` overflows) | **12 / 12** | 0 / 12 |

It is a **cliff, not a gradient**. A double holds ~10³⁰⁸ and a challenge-scaled
determinant passes that at dimension ~102, after which `float(q)` is `inf`,
`GH` is `inf`, and every claim is accepted. Below the cliff both float graders
are fine.

Reported this way on purpose. The interesting failure in this domain is not
rounding — it is a grader that is confidently blind, and a grader that is exact
but pointed at the wrong quantity.

---

## Layout

```
lattice_claims/
├── taskset.py          Taskset / Task / TaskData, three rungs, grade()
├── generate.py         procedural instances; the only file containing a float
├── certify/exact.py    int and Fraction only; floats refused at ingest
├── certify/naive.py    both float graders, shipped for the canary
├── forgeries.py        planted, with the abort gate
├── policies.py         four reference policies: the floor and the ceiling, no API key
├── wiring.py           the second taskset, where the graph is the submission
└── __main__.py         gate / baseline / tasks
tests/                  18 tests
eval/                   run_models.py, regrade.py, page_data.py, the stored runs
```

```bash
python3 -m pytest tests/ -q
python3 -m lattice_claims gate               # the forgery battery
python3 -m lattice_claims baseline --n 15    # reference policies by rung, in under a second
python3 -m lattice_claims tasks 3 --prompts
```

The exact predicate is a port of a decision procedure that was first used to
audit real published records: `n = 2m` gives `(‖v‖²)^m · π^m ≤ f^n · q · m!`, and
odd `n` clears its leftover √π against `π^(n/2)`. A certified π bracket (Machin,
with the truncation error accumulated rather than assumed) decides both.

---

## What this does not do

It does not propose a cryptosystem, a parameter set, or a variant of one, and it
will not. Auditing published arithmetic is open ground and low risk; proposing
primitives is crowded and high risk, and a broken proposal is unrecoverable.
That is a standing rule, not a judgement call made per task.

## What the environment scores before anything is spent

Four reference policies, on the same 45 tasks the models saw. Each reads only
the task's public data and is graded by the same `grade`.

| policy | `declared` | `printed` | `underspecified` | overall |
|---|---|---|---|---|
| `exact` — decide exactly; `STRADDLES` when the half-unit window disagrees; `NEEDS_DATA` when a quantity is absent | 15/15 | 15/15 | 15/15 | **45/45** |
| `careful` — the log-domain float grader | 15/15 | 11/15 | 0/15 | 26/45 |
| `admissible` — always ADMISSIBLE | 10/15 | 4/15 | 0/15 | 14/45 |
| `refused` — always REFUSED | 5/15 | 7/15 | 0/15 | 12/45 |

`exact` is published on purpose: this measures whether an answer checks, not
whether the problem is hard for a program. `careful` is the row to read against
the models — a float grader that is right on every real record and has no way
to say `STRADDLES` or `NEEDS_DATA`: its 11 is the four straddling instances, its
0 is the cost of a grader that cannot abstain.

## Results

135 calls, dimensions 8–16, 15 tasks per rung, ~$1.87.

**`certified` — the scored reward**

| model | `declared` | `printed` | `underspecified` | overall |
|---|---|---|---|---|
| Opus 5 | 14/15 | **14/15** | 9/15 | **37/45** |
| Sonnet 5 | 13/15 | 4/15 | 4/15 | 21/45 |
| Haiku 4.5 | 7/15 | 3/15 | 8/15 | 18/45 |

**`well_formed` — declared a reference, and the right one** (diagnostic)

| model | |
|---|---|
| Opus 5 | 29/30 |
| Sonnet 5 | 28/30 |
| Haiku 4.5 | 19/30 |

(Re-graded after the second grader fix; the first grading read 28, 21 and 13.)

### What separates them

**The `printed` rung, by a factor of three.** Deciding a claim from a norm that
was rounded before it was published — knowing when the rounding leaves the
answer open — is where the models come apart. On the straddling instances
specifically: Opus **4/4**, Sonnet **1/4**, Haiku **0/4**.

**The dominant error is the same for all three, and it is the one this
environment exists to train against: answering confidently when a quantity is
absent.** "Said ADMISSIBLE when it was NEEDS_DATA" is the most common failure
for every model — 4×, 7×, 5×. Nothing in these tasks marks them as
underspecified; the missing quantity has to be noticed.

### The first run measured the grader, not the models

Worth recording, because it is the same error the environment is named for.

The first pass scored Opus **24/45** and `well_formed` **0/30 for every model**.
Both were wrong. Models were correctly declaring their reference — using the
keys `squared_norm` and `acceptance_factor` — and the grader demanded
`norm_squared` and `factor`, failing right answers on spelling. Worse, the
prompt never stated the schema, so there was nothing to fail against. On the
`underspecified` rung, 22 models had correctly returned `NEEDS_DATA` and were
scored zero because they named the absent quantity `q` rather than the grader's
internal path `lattice.q`.

A zero that uniform is not a result, it is a bug. Fixed on both sides: the
prompt now states the schema, and the grader accepts any reasonable spelling of
a key or of a named quantity — a grader that insists on its own vocabulary is
doing precisely what this environment was built to catch.

## The graph as the submission

A second taskset, `lattice_claims/wiring.py`, where the model is not asked for a
verdict but for a **wiring**: which instruments decide the claim, and what may
reach the port that does. Building the graph *is* the grading — the two rules
that matter are already conditions on a wire, so nothing about correctness is
expressed twice:

    a value that came from floating point may not enter a deciding port
    a deciding port with nothing wired to it cannot produce a verdict

45 calls, 15 tasks, dimensions 8–16.

| model | attempted | wired legally | used the exact predicate | right verdict |
|---|---|---|---|---|
| Opus 5 | **0/15** | — | — | — |
| Sonnet 5 | 15/15 | **15/15** | **15/15** | 9/15 |
| Haiku 4.5 | 15/15 | **15/15** | **15/15** | 9/15 |

**Composing the verifier is easy for them. Deciding is not.** Every graph either
model produced was legal: no float reached a deciding port, no deciding port was
left dangling, and neither ever routed the tolerance grader to the sink when the
exact predicate was available. The float screen was offered fifteen times each
and correctly used to decide nothing.

Then the verdict. **Both models routed `certified` on all fifteen** — never
`refuted`, never `refused`. Their 9/15 is exactly the number of tasks whose
answer was ADMISSIBLE. They scored the base rate.

The `refused` port was on the table the whole time; it is how a graph says the
claim was not settled. Neither model drew that wire once, which is the same
failure the main taskset finds, sharpened: here abstention is a wire they chose
not to draw.

### Opus declined this taskset

All fifteen Opus calls came back `stop_reason: refusal`, category `cyber`,
blocked under the Usage Policy. The prompt describes lattice determinants and a
security threshold, and the classifier reads that as cyber content.

**The prompt has not been reworded to get around it.** Rephrasing specifically to
slip past a safety classifier is not something this package will do, and from the
inside it is hard to tell that apart from rephrasing for clarity, so the wording
stands as it is and the refusals are recorded as refusals rather than as failed
attempts. The consequence is plain and belongs here: **as written, this taskset
cannot evaluate Opus.**

### The bug that hid the result first time

The first run scored Sonnet 1/15 and Haiku 0/15, with `gh_exact has no input
'q*'` on 28 of 30 attempts. The catalogue printed deciding ports as `q*`, with
the asterisk as *our* notation for "this port decides" — and the models
reasonably read the port as being named `q*`. Sonnet's very first answer was
otherwise perfect. The marker now has its own column.

That is the third time in this package that a near-zero score turned out to
measure the harness. It is worth saying once more: **a zero that uniform is a
bug, not a result.**

## Reproduce

```bash
python3 -m pytest tests/ -q                       # 18 tests
python3 -m lattice_claims baseline --n 15         # the reference table
python3 eval/run_models.py --n 15 --live          # the verdict tasks
python3 eval/run_models.py --wiring --n 5 --live  # the graph as the submission
python3 eval/regrade.py [--write]                 # re-grade the stored replies, no API call
```

## Page

A report page for this environment is generated at `site/lattice-claims/`:

```bash
python3 eval/page_data.py            # emits eval/page.json from the suite and the run
node ../../tools/build-lattice-env.js
```

It carries the two-instance diagram that explains why `STRADDLES` is a correct
answer — two lattices of the same dimension, both norms published as whole
numbers, one bar clear of the wall and one crossing it.
