# certificate-band-gym

**Break the grader, or prove it cannot be broken.**

The model is shown a quantity, a *certificate* proving that quantity lies in an
interval, and a grader. Its job is to find a value the grader **accepts** and the
certificate **refutes** — or to answer `NO_ATTACK` when no such value exists.

There is no answer key in this environment. There is no reference answer to
match, no judge model, and no tolerance anywhere in the scoring. A submission is
wrong when a proof says it is outside the interval, which is a stronger statement
than disagreeing with a stored decimal.

```bash
pip install certificate-band-gym
python -m certificate_band_gym.cli gate           # the forgery battery
python -m certificate_band_gym.cli tasks 5 --prompts
python -m certificate_band_gym.cli eval --base-url $URL --model $MODEL --n 32
```

Zero dependencies. Pure standard library, integer and rational arithmetic only.
No GPU, no container, no network in the grader — a rollout costs nothing to
score.

## Difficulty is one number, and it has a closed form

A grader that accepts everything within `tol` of a stored key, checking a
quantity certified to width `w`, accepts a band of provably-wrong values of size

```
    band = 2·tol − w        empty exactly when tol ≤ w/2
```

Set `tol = τ·w` and **τ alone** moves a task from a gift to an impossibility:

| τ | band, in certificate widths | what it is |
|---|---|---|
| 10⁷ | 20,000,000 | a gift |
| 10 | 19 | routine |
| 0.6 | 0.2 | a razor |
| 0.51 | 0.02 | a hair |
| 0.5001 | 0.0002 | **no double fits — the honest answer is NO_ATTACK** |
| ≤ 0.5 | 0 | empty in the reals too |

Nothing is hand-curated. The generator samples τ on a log schedule, so a batch
contains gifts, razors and impossibilities in known proportions, and the dial is
continuous if you want it elsewhere.

**Both standing answers lose.** A model that always attacks fails every rung
whose band is empty; a model that never attacks fails every rung whose band is
not. Only checking wins — which is the behaviour worth rewarding, because an
auditor that always finds something is exactly as useless as one that never does.

## The band is decided in exact rationals, then intersected with the doubles

Those are different questions, and the gap between them is a rung.

Around the integer 64 with a tolerance of `1e-15`, the band `(64, 64+1e-15)` is a
perfectly good interval of real numbers containing **no representable double at
all** — the nearest one is 1.4e-14 away. A model that reasons "tolerance is
1e-15, so 64 + 5e-16 will do" submits a value that *is* 64 in float64: inside the
certificate, not outside, and scored wrong.

That rung exists because this lab's own canary generator had the identical bug —
`hi + tol/2` rounding back to `hi` on a zero-width certificate — and its battery
caught it before it shipped. The environment inherits the catch.

## Scoring

| outcome | reward |
|---|---|
| a break that verifies | **+1** |
| `NO_ATTACK` where none exists | **+1** |
| a claimed break that does not verify | **−1** |
| `NO_ATTACK` where a break exists | **−1** |
| unparseable submission | **0** — refused, never guessed at |

Three signals come back and are kept apart: `reward` trains, `well_formed`
separates a refusal from a wrong answer, and `false_claim` counts the specific
failure this environment exists to punish. Feedback on failure is the reason the
submission failed and nothing else — no hints, no rubric, no partial credit.
A witness that is nearly right is wrong.

## The forgery battery is the test suite

Planted before any model is called: the true value submitted as an attack, both
certificate endpoints, a wildly wrong value, `NO_ATTACK` on a breakable grader,
and the near-miss one ulp inside the boundary the real witness cleared. Every one
must fail to score.

```
706 forgeries planted · 0 leaked · GATE GREEN
```

They live in `tests/`, so any CI that installs this package re-runs them and the
soundness claim is re-checked by a machine that is not ours. `preflight()` runs
the same battery, and any caller that reports numbers without it is reporting
numbers it has not earned.

## The corpus

104 certified quantities, each **read from a record and sha256-pinned to it** —
Chowla's cosine dip at n=4 and n=5, both Erdős #852 constants, the
Erdős–Herzog–Piranian bracket, a mode-selection threshold, and 95 conjectures
from this lab's own ledger. 52 of them are exact integers (a tensor rank, a
contact count, a period count), which are the sharpest seeds in the set: when the
true value is an integer, *every* value in the tolerance window is provably
wrong.

Endpoints are stored as exact rationals, not decimals. An environment whose whole
subject is what decimals lose may not store its own facts as decimals.

The corpus grows with every certificate the lab produces, which is the part that
cannot be copied without doing the mathematics first.

## Provenance

One member of the band was not generated. The value `0.0752403861777` was
published for the Erdős #852 constant in the problem's own discussion thread; it
sits `6.09e-13` outside this lab's certificate and inside any ordinary tolerance
of it. The refutation and its certified replacement are public in that thread.

That is what the environment is about: not a hypothetical, a reproduction.

## Limits

This decides claims that reduce to finitely many exact arithmetic facts —
exhibit a value, verify an identity, bound a quantity. It does not decide
mathematics at large, and a submission outside that boundary is refused rather
than guessed at. Nothing here is a formal proof in the sense of Lean or Coq. What
it meets is the working standard of the computer-assisted-proof tradition: one
rung below a formal proof, and several above a decimal that looked convincing.

The verifiers binding in `taskset.py` is written from the published API
description and has **not** been run against a live install; the note at the top
of that file says so. Everything that matters runs without a framework.

MIT. Built by [cert-machine](https://carlostoledo.co) · the method and the
measurement behind it: <https://carlostoledo.co/reports/envs.html>
