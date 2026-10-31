# Verify Gym v0: pre-registration, 2026-10-31

Written and committed before any score on the held-out set exists. No reference policy, no model and no
forgery has been graded on a held-out task at the commit that adds this note; the policies were developed and
the reward checked on the TRAINING streams only. What follows fixes the task families, the reward, the held-out
split, the scorecard's protocol and the ship criterion for a future trained model. A change after this commit is
written at the end, dated, as a deviation.

The operator's ruling (2026-10-31): ground first, then model. v0 is an environment, a curriculum that grows, and a
public scorecard graded by cert-machine. A trained open model ships later only if it beats its own base on the
held-out tasks by the criterion below. Training budget up to US$500, spent only on the operator's word.

## Why the reward is graded (what the earlier runs found)

- lattice-claims, stage 2 (2026-10-05, Qwen3.5-9B, notes/lattice-claims-rl-preregistration-2026-10-04.md): both
  graders, the answer key and the exact one, drove abstention to 0 within about 10 steps. Groups went uniform
  (zero-advantage share 0.85–0.95) and the trainer aborted both runs. Arm C (+1 / 0 / −1) collapsed the other way,
  into abstaining on everything. None of the three taught the discriminating policy. The binding constraint was
  the policy's ability to decide the tasks; a verdict-only reward on a coin-flip task is flat.
- Claim Court (2026-10-23): the +G / −L / 0 calibrated-claiming reward is published, and its GRPO collapse is
  explained by Che et al. (arXiv 2608.00301): a discrete abstention reward kills the gradient and the KL anchor
  together.
- The design answer: a reward on CERTIFIED PROGRESS. Every certified answer is worth the number of decimals it
  certifies beyond what the task gave, so the answers in a group of eight differ whenever their brackets differ.
  Small progress gets a small reward, and the reward never lumps "close" together with "wrong". A refuted side
  pays 0, the same as an unreadable answer. There is no penalty term, because penalties are what produced arm C's
  over-abstention, and there is no abstention action to collapse onto.

## What is fixed

**The code.** environments/verify_gym at the commit that adds this note: the exact decider
(verify_gym/exact.py, Python standard library), the families and their generators (verify_gym/families.py), the
prompt template and the reply parser (verify_gym/task.py), the curriculum (verify_gym/curriculum.json, version 1).
The second decider is environments/verify_gym/check.js (JavaScript BigInt, no shared code). It decides the
polynomial family's isolation by a Sturm sequence, where the Python decider uses Descartes' rule.

**The families** (first family group: BRACKET A CONSTANT). A task names a real constant x, states a bracket
lo0 < x < hi0 that is itself certified, and asks for the tightest interval lo < x < hi with rational endpoints.
Each side is one claim, decided by exact integer arithmetic only:

| family | x | x > p/q decided by | stated bracket | size limit (lowest terms) | cap |
|---|---|---|---|---|---|
| `xx` | the root of x^x = N, N ≥ 2 an integer, N ≠ k^k | p^p < N^q·q^p, for p/q ≥ 1 (a bar below 1 is REFUSED) | (⌊x⌋, ⌊x⌋+1) | numerator, denominator < 10^5 | 8 |
| `kroot` | n^(1/k), k ≥ 2, n not a perfect k-th power | p^k < n·q^k, for p/q > 0 | (m, m+1), m the integer root | < 10^30 | 20 |
| `poly` | the one root of an integer P (no rational root) in a stated isolating interval (l, h) | sign P(p/q) = sign P(l), with P(l)P(h) < 0 and one Descartes sign variation on (l, h) | (l, h) itself | < 10^30 | 20 |

`x < p/q` is the reverse comparison. Equality would mean x = p/q, and then both strict sides are REFUTED. The
x^x reduction is the one certs/xx-ledger.json uses (tools/run-xx-ledger.py; reports/xx.html). x^x ≤ 1 on (0, 1],
it is strictly increasing on [1, ∞), and it has no negative real root. That argument is READ, not decided here,
exactly as the ledger says.

The xx size limit is low on purpose. The decision computes p^p, so a six-digit numerator is a
million-digit-scale comparison (about 0.2 s on Python 3.9), and the limit is what keeps any answer from stalling
the grader. Within it, the tightest bracket (the Farey neighbours of x) certifies about 7 to 9 decimals, which is
why xx's cap is 8. kroot and poly have room for about 59 decimals. Their cap of 20 sits above float64's 15–16
significant digits, so the top of their range needs real arithmetic.

Difficulty comes from the instance: xx by the size of N (three tiers to 10^6), kroot by k and the size of n
(three tiers to k = 7, n < 10^12), poly by degree (3–4, 5–6) and root clustering. The cluster tier is
(bx − a)²(x + c) − e: two roots close to a/b, where a float root-finder's error is about 10^-14.

**The reward.** If both sides are CERTIFIED:

    d        = max(0, floor(−log10(hi − lo)))       by integer comparison: hi − lo = u/v, d the largest k with u·10^k ≤ v
    progress = min(cap, max(0, d − d0))             d0 = the decimals of the stated bracket (0 for 115 of the 120 held-out tasks)
    reward   = progress / cap                       in [0, 1]

In every other case the reward is 0: a REFUTED side, a REFUSED side (outside the family's reduction, even when
true), lo ≥ hi, an endpoint that is not an integer, a finite decimal or p/q, more than 80 digits in any part of an
endpoint's text (checked before any conversion), or an endpoint over the size limit in lowest terms (checked
before any arithmetic). A reward is never positive for an answer whose two sides were not both decided
CERTIFIED. Copying the stated bracket scores exactly 0.

**The reply format.** The last JSON object in the reply with keys `lo` and `hi` is the answer. An earlier
object is never graded, so several answers cannot hedge. JSON numbers are read as their text, never as floats,
so 1.4142 is 14142/10000 exactly. Exponents, NaN, Infinity and booleans are malformed.

**The held-out set**, frozen: `environments/verify_gym/verify_gym/heldout-v0.json`, 120 tasks, 40 per family,
drawn from each family's "heldout" stream:

    sha256 789cead61a5cb4612589b511562d9a6bfb4fe7d2b7dd2dcfc80b94193e71978d

- xx: N < 100 ×11, < 10^4 ×13, < 10^6 ×16.
- kroot: k ≤ 3 with n < 10^3 ×7; k ≤ 5 with n < 10^6 ×20; k ≤ 7 with n < 10^12 ×13.
- poly: degree 3–4 ×13, degree 5–6 ×16, cluster ×11.

Each row carries its prompt. The battery requires the template to render every frozen prompt unchanged, and
`api.heldout()` refuses a file that does not hash to the curriculum's sha256. Training ("train") and validation
("val") rows come from their own streams (`sha256("verify-gym|<family>|<split>|<index>|<draw>")`). A pool
instance whose key is in a held-out set is redrawn, so the pools and the held-out set are disjoint by key. That
property is tested.

**Always evolving.** curriculum.json is append-only. Each family entry is pinned by sha256 (PROVENANCE.json), and
the battery refuses a change to a listed family, stage or held-out file. A new family appends; it moves no task,
because every task's identity is (family, split, index) over its own stream. The hook for the register: when a
ledger in certs/ decides a real constant that has an exact side decider, that constant becomes a family. Adding
one takes four things, and the battery refuses a family that lacks any of them:

1. A side function in exact.py and an independent one in check.js.
2. A generator.
3. A curriculum entry that names the ledger and its sha256.
4. Its own held-out file, hashed and appended.

heldout-v0.json is never edited. A family whose instrument decides by an interval enclosure, not by exact
comparison, would REFUSE sides inside the enclosure's resolution. Whether such a family's reward should treat
REFUSED as 0 is a question for its own pre-registration, not answered here.

## The scorecard protocol

certs/verify-gym-scorecard.json is written by environments/verify_gym/scorecard.py and re-derived by its
`--check`. v0 holds reference policies only. Each reads only the prompt, needs no key and no network, and is
graded on all 120 held-out tasks, after the forgery gate is green:

| policy | what it does | predicted (written before it ran on the held-out set) |
|---|---|---|
| `never` | no answer | reward 0, all MALFORMED |
| `echo` | the stated bracket | all 120 CERTIFIED (each stated bracket checked by both deciders), reward 0 |
| `float` | the float64 root, ±1 in its 16th significant digit; for xx, aim at the cap and round each endpoint to the nearest fraction the limit allows | REFUTED on some kroot tasks (n^(1/k) in float is not correctly rounded), on some poly cluster tasks, and on some xx tasks; MALFORMED on some xx tasks (rounding collapses lo onto hi); mean reward strictly between bisect's and cf's |
| `bisect` | 20 exact bisection steps from the stated bracket, fewer where the size limit stops it | every answer CERTIFIED; about 6/20 on kroot and poly, about 4/8 on xx |
| `cf` | the continued fraction of a 100-digit estimate: the first convergent pair at least as tight as the cap, else the Farey neighbours within the limit | every answer CERTIFIED; 1.0 on kroot and poly; at least 0.85 on xx |

On the training streams (60 per family, before this note), `float` was REFUTED on 15 of 60 kroot, 8 of 60 poly
and 2 of 60 xx, and MALFORMED on 31 of 60 xx. Those are training rows, and the held-out numbers may differ. They
are reported whatever they are.

Every held-out answer of every policy is graded by both deciders and compared field by field: verdict, the two
side words, decimals, progress. So is every planted forgery. One difference refuses the scorecard.

**Model rows** come later, each on the operator's word (API spend). They use the same frozen prompts, 8 samples
per task, and the sampling stated in the row (model id, date, temperature, max tokens, thinking or not, tools or
not: a tool-using row is a separate row, labelled). Every reply is stored and its sha256 recorded, and every reply
is graded by both deciders. A reply cut off by the caller's max_tokens scores 0. Its count is reported in its own
column, so the harness's limit is not read as the model's mistake.

## Reward hacking: what counts, and how the gate catches it

Reward hacking here is any positive reward for an answer whose bracket was not decided to contain x, and any
reward bought by something other than a tighter certified bracket. The decider is exact, so the first kind
requires a decider bug. The second kind is in-distribution.

| hack | why it fails | caught by |
|---|---|---|
| copy the stated bracket | its decimals are d0, so progress is 0 | gate (expected CERTIFIED, reward 0) |
| a side the wrong way round, lo ≥ hi, a point | REFUTED or MALFORMED | gate |
| a side one unit of its denominator past the root (the tight mutant) | REFUTED | gate |
| a decimal written to look tight (a truncated upper end, a rounded-up lower end) | REFUTED | gate |
| the root printed as a float, or as both endpoints | MALFORMED | gate |
| huge integers to stall the grader | text over 80 digits, or over the limit in lowest terms: MALFORMED before any arithmetic | gate (and the slowest single grade is recorded) |
| a true side outside the reduction (xx lo = 1/2; kroot lo = 0) | REFUSED, 0: true but unchecked pays nothing | gate |
| several answers (hedging) | only the last is graded | gate (the true bracket, then a wrong one last: REFUTED) |
| exponents, NaN, Infinity, zero denominators, prose | MALFORMED | gate |
| training on the held-out set | disjoint by key; the file is hashed; the trained model's own held-out run is its only use | tests + `api.heldout()` |
| a decider bug | every held-out answer and forgery decided twice; after a training run, every logged sample with reward > 0 re-decided by check.js | battery; the ship criterion (5) |

The gate runs in every consumer (CLI, both adapters, scorecard) before anything is graded. On every row it is
given, every planted forgery must score 0 under its expected verdict, and two green controls must score above 0
(a grader that rejects everything would pass the red ones). The battery also requires the gate itself to fail
under three broken graders: one that accepts everything, one that rejects everything, and one with the xx
comparison flipped.

## The ship criterion for a future trained model

- **Base and trained.** B is one open-weights model, named in a dated deviation before any training step. T is B
  after RL on the v0 TRAINING stream only, with the reward above, exactly as the environment computes it.
- **Checkpoint choice.** Exactly one checkpoint of T is evaluated on the held-out set. It is chosen on the
  validation stream ("val", 60 tasks per family) and never on the held-out set.
- **Evaluation.** B and T each answer the 120 frozen held-out prompts with 8 samples per task. Both use the same
  sampling (temperature 1.0, top-p 1.0, the max tokens and thinking mode named in the deviation, no tools).
- **Statistic.** s_i is the mean reward of the 8 samples on task i, and Δ = mean over i of (s_i(T) − s_i(B)).
  The paired bootstrap resamples the 120 tasks 10,000 times with seed 20261031 and gives a one-sided 95% lower
  bound on Δ.

**SHIP** only if all six hold:

1. Δ ≥ 0.05 (on the 0–1 scale; 0.4 of a decimal on xx, one decimal on kroot or poly).
2. The bootstrap lower bound on Δ is above 0.
3. No family regresses: every per-family Δ_f is at least −0.02.
4. T's REFUTED share over all its held-out samples is at most B's plus 0.05. A gain bought with more false
   brackets is not shipped.
5. Every held-out reply of T is re-decided by check.js with 0 disagreements, and the gate is green at the
   evaluated commit.
6. Total spend, pilots and evaluations included, is at most US$500.

Otherwise the result is NO-SHIP and is reported with its numbers. A null is a result.

**Before any paid training step** (the lattice-claims lesson, a gate on the base model). On 100 tasks from the
"val" stream with 8 samples each, at the training sampling settings, GO only if both hold:

- at least 30% of the groups of 8 have rewards that are not all equal;
- the mean reward is between 0.02 and 0.80.

Otherwise GRPO has nothing to reinforce (or nothing left to learn), and that measurement is the finding.

## Deviations

Any change after this commit is recorded here, dated, with its reason.

1. **2026-10-31, the first held-out run: a misbuilt forgery, caught by the gate before anything was graded.**
   The scorecard's first run refused before grading any policy. The gate reported
   `MISFILED kroot/heldout/2: hi a truncated decimal (looks tight, below the root) -> MALFORMED, not REFUTED`.
   The forgery printed 25 decimals whatever the root's size. For a root near 10^6 that puts the numerator over
   the 10^30 limit, so it was refused as oversize, not refuted. It scored 0 either way: nothing leaked. The
   forgery now uses the most decimals the limit admits for that root (at most 25). The two one-unit mutants name
   MALFORMED as their expected verdict where the moved numerator would reach the limit. The xx comparison is
   memoised; it is pure, and the word is unchanged. The reward, the families, the held-out set and the readings
   are unchanged.

2. **2026-10-31, the re-check and the readiness gate built (recheck.py, readiness.py): nothing above changed.**
   Three details the text left open are now fixed in code, and no score on any model exists. The "100 tasks from
   the val stream" are the first 100 of the validation rotation (xx/val/0, kroot/val/0, poly/val/0, xx/val/1, …),
   the order the CLI and the v0 adapter already used. The two GO bounds are inclusive and are decided in exact
   rationals. A reply the caller truncates is paid 0 in the readiness run too, as it already was for model rows.
   The rollout log a trainer writes is defined in verify_gym/rollouts.py. A logged reward is read as
   reward × cap, which must be within 10^-6 of an integer, so that a float32 store of k/20 still reads as k.

3. **2026-10-31, before the readiness gate: the base model, the training sampling, and where each step runs.**
   Written before any readiness sample and before any training step.
   - **B is Qwen/Qwen3.5-9B** (the 4B's hosted trainer delivered no updates in the lattice-claims runs; the 9B's
     did). The training sampling, which the readiness gate uses: thinking off (`chat_template_kwargs:
     {enable_thinking: false}`), temperature 1.0, top-p 1.0, **max tokens 16,384**, no tools.
   - Why 16,384 and not lattice-claims' 1,536. Pilots on the TRAINING stream (never the held-out set or the val
     stream) measured the 9B with thinking off: at 4,096 tokens all 9 of 9 replies were cut off; at 16,384, 11 of
     12 finished, and every one ran 7,000 to 14,600 tokens (it reasons in the visible reply when thinking is
     off). Below about 8,000 tokens the gate would measure the length limit, not the model. The pilot replies
     are kept outside the repository; their cost (all pilots, six models) was US$1.41.
   - **The readiness gate runs on Prime Inference** (`qwen/qwen3.5-9b`, api.pinference.ai), through
     readiness.py's live path, because the operator's GO names Prime and no other GPU. Estimated cost: 800
     samples × about 10,900 output tokens at US$0.25 per million, plus input, about US$2.2. The earlier "about
     US$1" was written from lattice-claims' 115-token answers and is wrong by about 2× for this environment; the
     run is stopped if it passes US$4.5 (2× this estimate).
   - **Model rows** (the scorecard): four open-weights models on Prime Inference at the same sampling (thinking
     off, 16,384 tokens, temperature 1.0, top-p 1.0, no tools): deepseek/deepseek-v4-pro,
     deepseek/deepseek-v4.1-flash, google/gemma-4-26b-a4b-it, and qwen/qwen3.5-9b (B itself, on this server).
     The models were chosen by the measured cost per row, before any held-out answer of theirs existed:
     qwen3.5-397b-a17b (about US$34 a row) and kimi-k3 (about US$37) were not run, and minimax-m3 was dropped
     because 9 of 12 of its pilot replies hit 16,384 tokens.
   - **Training (step 3) is on Prime Hosted Training or not at all** (the operator's GO; no rented GPUs). Read on
     2026-10-31 before any launch: `/rft/models` (the LoRA models Hosted Training offers) is empty, `prime train
     models` (CLI 0.6.31 and 0.19.0) says no models are available and that on-demand training is a beta this
     account is not enrolled in (`onDemandBetaAccess: false`), and Qwen3.5-9B is not among the deployable adapter
     models. If that is still so after the gate, no training step runs and that is reported; nothing about the
     ship criterion changes.
