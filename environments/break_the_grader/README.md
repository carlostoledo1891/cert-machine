# break-the-grader

**Break the grader, or prove it cannot be broken.**

The model is shown a quantity, a *certificate* proving that quantity lies in an
interval, and a grader. Its job is to find a value the grader **accepts** and the
certificate **refutes** — or to answer `NO_ATTACK` when no such value exists.

There is no answer key in this environment. No reference answer to match, no
judge model, no tolerance anywhere in the scoring. A submission is wrong when a
proof says it is outside the interval, which is a stronger statement than
disagreeing with a stored decimal.

```bash
pip install break-the-grader
python -m break_the_grader.cli gate          # the forgery battery, ~1s
python -m break_the_grader.cli baseline      # the reference table, no API key
python -m break_the_grader.cli tasks 5 --prompts
```

## What it scores, before you spend anything

Four reference policies ship with the package. Each reads **only the prompt** —
the same string a model is shown — and each is graded by the same certificate.
Below they sit beside a real model run on the identical tasks. The policy half
needs no API key, no GPU and about four seconds:

| player | kind | n | mean reward | solved | false claims | impossible | razor | narrow | wide |
|---|---|---:|---:|---:|---:|:--|:--|:--|:--|
| `never` — always refuse | policy | 120 | -0.350 | 32% | 81 | 39/39 | 0/21 | 0/39 | 0/21 |
| `always` — attack blindly at the first double past the interval | policy | 120 | +0.558 | 56% | 0 | 0/39 | 14/21 | 32/39 | 21/21 |
| `naive` — the float mistake: submit `hi + tol/2` | policy | 120 | +0.258 | 49% | 28 | 0/39 | 11/21 | 28/39 | 20/21 |
| `careful` — do the arithmetic properly, in exact rationals | policy | 120 | +1.000 | 100% | 0 | 39/39 | 21/21 | 39/39 | 21/21 |
| **claude-opus-5** | effort low | 120 | **+0.950** | 97% | 2 | 37/39 | 20/21 | 39/39 | 20/21 |
| **claude-sonnet-5** | effort low | 115 | **+0.670** | 81% | 16 | 34/37 | 14/20 | 26/38 | 19/20 |
| **claude-haiku-4-5** | no effort param | 120 | **+0.317** | 51% | 23 | 25/39 | 5/21 | 17/39 | 14/21 |

Read the columns, not the mean. Blind play gets 56% and **zero of 39 impossible
rungs** — that column is the whole of what this environment measures, and a mean
which ignores it can be bought by guessing.

The model rows are a real run — 360 calls, $1.92 of a $4.00 cap reserved
worst-case before every call — on the **same 120 seeds** as the policies. Row n
is a function of n alone, so those are literally the same tasks, not a comparable
sample. Replies truncated by the caller's own `max_tokens` and model refusals are
recorded and excluded from the rates: a harness artifact is not a model outcome.

The environment separates all three frontier models — +0.950, +0.670, +0.317 —
and the smallest scores **below the one-line blind policy**. Not because the
tasks are hard for a program: because the blind policy makes zero false claims
and that model makes 23. Confidence is what costs, and it is priced in its own
column.

`careful` is published on purpose. This is not a puzzle that is hard for something
which checks — it is a measurement of whether the answer checks, and hiding the
solver would misrepresent that.

## Difficulty is one number, and it has a closed form

A grader that accepts everything within `tol` of a stored key, checking a quantity
certified to width `w`, accepts a band of provably-wrong values of size

```
    band = 2·tol − w        empty exactly when tol ≤ w/2
```

so the generator does not sample a tolerance and hope: it draws the **room** it
wants — how many representable doubles should fit in the band — and solves
`tol = (w + room·u)/2` for it, with `u` one ulp at that magnitude.

| rung | room, in doubles | share of a batch |
|---|---|---|
| impossible | none fits — `NO_ATTACK` is the only right answer | 30% |
| razor | under 16 | 23% |
| narrow | under a million | 33% |
| wide | more | 14% |

Room, not "certificate widths", because a model submits a **double**, not a real
number. Half this corpus is exact integers whose certificate has width zero, and
measuring in widths sent every one of them to the easiest label when a `1e-16`
tolerance around an integer is the sharpest rung there is.

**Both standing answers lose.** Always-attack fails every rung whose band is
empty; never-attack fails every rung whose band is not. Only checking wins —
which is the behaviour worth rewarding, because an auditor that always finds
something is exactly as useless as one that never does.

## The band is decided in exact rationals, then intersected with the doubles

Those are different questions, and the gap between them is a rung.

Around the integer 64 with a tolerance of `1e-15`, the band `(64, 64+1e-15)` is a
perfectly good interval of real numbers containing **no representable double at
all** — the nearest one is 1.4e-14 away. A model that reasons "the tolerance is
1e-15, so 64 + 5e-16 will do" submits a value that *is* 64 in float64: inside the
certificate, not outside, and scored wrong.

That rung exists because this lab's own generator had the identical bug —
`hi + tol/2` rounding back to `hi` on a zero-width certificate — and its battery
caught it before it shipped. The environment inherits the catch.

## Scoring

| outcome | reward | verdict |
|---|---|---|
| a break that verifies | **+1** | `SOLVED` |
| `NO_ATTACK` where none exists | **+1** | `SOLVED` |
| a value the grader accepts that is **inside** the certificate | **−1** | `WRONG` |
| `NO_ATTACK` where a break exists | **−1** | `WRONG` |
| a value outside the certificate the grader rejects | **0** | `UNSUPPORTED` |
| unparseable submission | **0** | `REFUSED_PARSE` |

The two zeros are deliberate and are not the same as each other or as a wrong
answer. A failed attack asserts nothing false about the quantity — it is a miss.
Claiming a break that the grader accepts and the certificate contains **is** a
false claim of unsoundness, and it costs the most.

Three signals come back and are kept apart: `reward` trains, `well_formed`
separates a refusal from a wrong answer, and `false_claim` counts the specific
failure this environment exists to punish. Feedback on failure is the reason and
nothing else — no hints, no rubric, no partial credit. A witness that is nearly
right is wrong.

## The forgery battery is the test suite

Planted before any model is called: the true value submitted as an attack, both
certificate endpoints, a wildly wrong value, `NO_ATTACK` on a breakable grader,
and the near-miss one ulp inside the boundary the real witness cleared. Every one
must fail to score.

```
686 forgeries planted · 0 leaked · GATE GREEN
```

They live in `tests/`, beside the package rather than inside the wheel — a
top-level `tests/` installed into site-packages shadows everybody else's. What
every consumer does get is the battery **at load time**: both framework adapters
and the CLI run it before handing back anything a model could be scored against,
and raise if a single planted submission scores. An environment that cannot
refuse a forgery has no business producing a number.

## The corpus

104 certified quantities, each **read from a record and sha256-pinned to it** —
Chowla's cosine dip at n=4 and n=5, both Erdős #852 constants, the
Erdős–Herzog–Piranian bracket, a mode-selection threshold, and 95 conjectures
from this lab's own ledger. 52 are exact integers (a tensor rank, a contact
count, a period count), the sharpest seeds in the set: when the true value is an
integer, *every* value in the tolerance window is provably wrong.

Endpoints are stored as exact rationals, not decimals. An environment whose whole
subject is what decimals lose may not store its own facts as decimals.

The corpus grows with every certificate the lab produces, which is the part that
cannot be copied without doing the mathematics first.

## Provenance

One member of the band was not generated. The value `0.0752403861777` was
published for the Erdős #852 constant in that problem's own discussion thread; it
sits `6.09e-13` outside this lab's certificate and inside any ordinary tolerance
of it. The refutation and its certified replacement are public in that thread.

That is what the environment is about: not a hypothetical, a reproduction.

## Both framework bindings are verified

`break_the_grader/adapters_v0.py` exposes `load_environment` (a `SingleTurnEnv`
with a `Rubric`); `adapters_v1.py` exposes `BreakTheGraderTaskset` (`Task` /
`TaskData` / `@reward`). **Both were run against a live install — `verifiers`
0.2.0, the version `prime` 0.6.31 pins — not written from a doc.** Writing them
from the doc had already produced three defects, two of which are silent:

- a plain-string `task` column aborts every rollout in 0.2.0;
- scoring receives pydantic message objects, not dicts, so a `.get("content")`
  misses and **every reply reads as unparseable — a whole eval reporting 0.000
  with no error raised anywhere**;
- `Taskset.load()` returns a list in 0.2.0 and an iterable in 0.3.1.

Nothing else in the package imports `verifiers`. The graders, the band geometry
and the corpus are standard library only, and `tests/test_framework_free.py`
proves it by blocking every third-party import and running the battery anyway.

## Limits

This decides claims that reduce to finitely many exact arithmetic facts — exhibit
a value, verify an identity, bound a quantity. It does not decide mathematics at
large, and a submission outside that boundary is refused rather than guessed at.
Nothing here is a formal proof in the sense of Lean or Coq. What it meets is the
working standard of the computer-assisted-proof tradition: one rung below a
formal proof, and several above a decimal that looked convincing.

It is also not novel and does not claim to be. Verifier soundness is an active
2026 literature and environments with designer-embedded reward hacks are already
on the Hub. What differs is narrower: the hacks here are not authored, they are
minted from certificates and carry proofs, so the set is infinite, cannot be
memorised, and includes rungs where the honest answer is that no attack exists.

MIT. Built by [cert-machine](https://carlostoledo.co) · the method and the
measurement behind it: <https://carlostoledo.co/reports/gym.html>
