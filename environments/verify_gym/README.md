# verify-gym

**Bracket a constant, and be paid only for what is certified.**

A task names a real constant and an interval it is known to lie in. The model answers with a tighter interval,
`lo < x < hi`, with rational endpoints. Each side of the answer is one claim, `x > lo` or `x < hi`, and each is
decided by exact integer arithmetic. There is no float, no tolerance and no answer key anywhere in the grading.
The reward is the number of decimals the answer certifies beyond the interval the task gave, capped. A wrong
side pays 0, and so does an unreadable answer.

```bash
prime env install carlos-toledo/verify-gym     # or: pip install verify-gym from the Hub's index
```

```python
import verifiers as vf
env = vf.load_environment("verify-gym")          # train: the v0 stage; eval: the frozen held-out set
env = vf.load_environment("verify-gym", eval_split="val")   # eval on the validation stream instead
```

```bash
python -m verify_gym.cli gate              # the forgery battery
python -m verify_gym.cli baseline          # the reference policies on the frozen held-out set, no API key
python -m verify_gym.cli tasks 3 --prompts
```

This is v0 (package 0.1.0): three families, curriculum version 1, the held-out set `heldout-v0.json`. The decider,
the families, the gate and the policies are the Python standard library; only the two adapters import the
framework.

## The families

The first group is BRACKET A CONSTANT. Every family is decided by one integer comparison per side:

| family | the constant | `x > p/q` exactly when | size limit | cap |
|---|---|---|---|---|
| `xx` | the root of x^x = N | p^p < N^q·q^p (p/q ≥ 1) | 10^5 | 8 |
| `kroot` | n^(1/k) | p^k < n·q^k (p/q > 0) | 10^30 | 20 |
| `poly` | the one root of an integer polynomial P in a stated isolating interval (l, h) | sign P(p/q) = sign P(l) | 10^30 | 20 |

The size limit applies to the numerator and the denominator in lowest terms. For `poly`, the isolation is
decided before any side. P(l) and P(h) must have opposite signs, and the Moebius transform
(1+t)^d·P((l+ht)/(1+t)) must have exactly one sign variation, which by Descartes' rule means exactly one root
in (l, h). The second decider checks the same isolation with a Sturm sequence instead. The x^x reduction is the
one cert-machine's x^x = y ledger uses: x^x is at most 1 on (0, 1], strictly increasing on [1, ∞), and has no
negative root. That argument is read, not decided, and a bar below 1 is refused rather than decided.

Difficulty comes from the instance:
- `xx`: the size of N, up to 10^6.
- `kroot`: k up to 7 and n up to 10^12.
- `poly`: the degree, and root clustering. Its cluster tier, (bx − a)²(x + c) − e, puts two roots close
  together, and a float root-finder misses them by about 10^-14.

## The reward

```
d        = max(0, floor(-log10(hi - lo)))      by integer comparison, never a logarithm
progress = min(cap, max(0, d - d0))            d0: the decimals of the interval the task stated
reward   = progress / cap                      only when BOTH sides are CERTIFIED; 0 otherwise
```

The reward is graded on purpose. This repository's lattice-claims runs (Qwen3.5-9B, GRPO) collapsed within
about 10 steps under verdict-only rewards. Every group of eight scored alike, and the trainer stopped on empty
batches. Che et al. (arXiv 2608.00301) explain why that happens to discrete calibrated-claiming rewards. Here a
tighter certified bracket is worth more than a looser one, so answers in a group differ whenever their brackets
differ. There is no penalty term and no abstention action to collapse onto.

The size limit is checked on the text before anything is converted (80 digits at most per part), and again in
lowest terms before any arithmetic. No answer can make the grader compute a large power. The worst `xx`
decision is two million-bit powers, about 0.2 s on Python 3.9.

## What it scores, before you spend anything

These are the five reference policies on the 120 frozen held-out tasks (40 per family). They read only the
prompt, need no key and no network, and every answer is decided twice. The table is
[`certs/verify-gym-scorecard.json`](https://github.com/carlostoledo1891/cert-machine/blob/main/certs/verify-gym-scorecard.json):

| policy | mean reward | xx | kroot | poly | certified | refuted | malformed |
|---|---:|---:|---:|---:|---:|---:|---:|
| `never` — no answer | 0.000 | 0.000 | 0.000 | 0.000 | 0 | 0 | 120 |
| `echo` — repeat the stated bracket | 0.000 | 0.000 | 0.000 | 0.000 | 120 | 0 | 0 |
| `float` — the float64 root, ±1 in its 16th digit | 0.531 | 0.600 | 0.430 | 0.562 | 85 | 22 | 13 |
| `bisect` — 20 exact bisection steps | 0.340 | 0.450 | 0.300 | 0.271 | 120 | 0 | 0 |
| `cf` — continued-fraction convergents of a 100-digit estimate | 0.981 | 0.944 | 1.000 | 1.000 | 120 | 0 | 0 |

Read the refuted column first. `float` outscores honest exact bisection on the mean, and 22 of its 120 brackets
are false:
- 8 of the 11 clustered polynomial roots;
- 13 k-th roots, because `n ** (1/k)` in float64 is not correctly rounded;
- one x^x root.

A mean that hides that is a mean a model can buy by guessing. `echo` is certified 120 times and earns nothing,
because copying is worth 0 by construction. `cf` is the ceiling within the size limit, and it is published on
purpose. This environment does not measure whether a program can do this. It measures whether the answer checks.

There are no model rows yet. They come later, one run per row, each with its model id, sampling, date and every
reply stored. The protocol is fixed in advance in
[the pre-registration](https://github.com/carlostoledo1891/cert-machine/blob/main/notes/verify-gym-preregistration-2026-10-31.md).

## The forgery gate runs first

Before any number is reported, the gate plants these answers on every row and requires each to score 0 under
its expected verdict:
- the stated bracket copied;
- the sides swapped, and a point;
- a side on the wrong side of the root;
- each tight side moved one unit of its own denominator past the root;
- a 90-digit endpoint, and a true bracket over the size limit;
- a truncated upper end and a rounded-up lower end that look tight;
- the root printed as a float, alone and as both endpoints;
- an exponent, NaN and Infinity, a zero denominator, and prose;
- a hedge: the true bracket, then a wrong one last;
- a true side outside the reduction (`xx` lo = 1/2, `kroot` lo = 0).

It also requires the true bracket to score above 0, because a grader that rejects everything passes every red
control. On the held-out set:

```
2240 forgeries planted on 120 rows · 0 leaked · 0 misfiled · 240 green controls · GATE GREEN
```

The gate itself is tested. It must fail under a grader that accepts everything, one that rejects everything,
and one with the x^x comparison flipped. Both framework adapters and the CLI run the gate at load time.

## Two deciders

`verify_gym/exact.py` is the only decider the environment uses, in the Python standard library.
`check.js` is a second one, in JavaScript BigInt, with no shared code; it decides isolation by Sturm sequence
where the first uses Descartes. Every held-out answer of every policy goes through both, and so does every
planted forgery: 2,600 answers, compared on the verdict, both side words, the decimals and the progress. They
agree on all of them, and one difference would refuse the scorecard. A future training run is held to the same
rule: every sample that earned a reward is re-decided by `check.js` afterwards.

`check.js` and the scripts that need it or spend money (`crosscheck.py`, `scorecard.py`, `readiness.py`,
`recheck.py`, `modelrow.py`) live beside the package in
[the source repository](https://github.com/carlostoledo1891/cert-machine/tree/main/environments/verify_gym), not
in the wheel. The wheel holds the decider, the families, the curriculum, the held-out file, the gate, the
policies and the two adapters.

## A curriculum that only grows

`verify_gym/curriculum.json` is append-only. Each family, training stage and held-out set is pinned by sha256,
and the battery refuses a change to a listed entry. A task's identity is (family, split, index) over that
family's own seeded stream, so appending a family moves no existing task. That is tested.

When cert-machine's register decides a new real constant that has an exact side decider, it can become a family.
It then needs four things:
1. a side function here and an independent one in `check.js`;
2. a generator;
3. a curriculum entry naming the ledger it came from;
4. its own frozen held-out file.

The held-out set `heldout-v0.json` (sha256
`789cead61a5cb4612589b511562d9a6bfb4fe7d2b7dd2dcfc80b94193e71978d`, 120 tasks, 40 per family) is never edited;
`api.heldout()` refuses a file that does not hash to it. The training and validation pools
redraw any instance it contains.

## Before and after a training run

Two protocol steps from the pre-registration are built and tested end to end. Neither has been run on a model.

**The readiness gate**, before any paid training step. It takes the first 100 tasks of the validation rotation
with 8 samples each, graded by both deciders. The result is GO only if at least 30% of the groups of 8 have
rewards that are not all equal, and the mean reward is between 0.02 and 0.80. Otherwise GRPO has nothing to
reinforce.

```bash
python3 readiness.py --dry-run mix                          # no model: each sample a different reference policy
python3 readiness.py --endpoint http://HOST:PORT/v1 --model ID --max-tokens N --out RUN   # costs money
```

The dry run with `mix` says GO, and with `cf` or `never` it says NO-GO. The live path is tested against a local
stand-in server in the battery: truncated replies are paid 0, a failed call stops the run with no verdict, and a
re-run resumes.

**The re-check**, after a training run. The trainer writes a rollout log (`verify_gym/rollouts.py`: one header
line, then one line per sample with `task_id`, `reply` and `reward`). `recheck.py` decides every paid sample
again with `check.js`, and it refuses the run's result if one paid reward is not the one `check.js` gives.

```bash
python3 recheck.py RUN/rollouts.jsonl
```

The battery requires it to refuse six forged logs:
- a REFUTED answer paid 1;
- a certified answer paid one step more than it earned;
- a reward no answer can earn;
- a paid reply with no answer;
- a paid truncated reply;
- a held-out task in a training log.

## Both framework bindings are verified

`adapters_v0.load_environment` gives a `SingleTurnEnv`: the training stage for training, and the held-out set
or the validation stream for eval. `adapters_v1.VerifyGymTaskset` gives the Task/Taskset form. Both were run
against live installs of `verifiers` 0.2.0 and 0.3.1, and `tests/test_verifiers_binding.py` re-checks them
wherever the framework is present. Nothing else imports the framework. `tests/test_framework_free.py` blocks
every third-party import and runs the gate, the held-out set and the policies anyway.

## Limits

- This is a training ground, not a result. No model has been trained on it.
- It decides one kind of claim: an interval around a real number that an integer comparison can settle. It says
  nothing about mathematics at large.
- The `xx` size limit keeps the grader fast, and it caps what an `xx` answer can certify at about 9 decimals.
- A model with a Python tool can reach the ceiling; that is a fact about the task, not a flaw in the grader. A
  tool-using row would be scored as its own row.

MIT. Built by [cert-machine](https://carlostoledo.co).
