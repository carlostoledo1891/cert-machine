# The geometry of feeling — affect as a shape, and mood as a treatment

`probe-mood.js --live` → `decide-mood.js` → `tools/build-sentiment.js` → `site/ai-sentiment/`

Two experiments in one design. **Axis A** (complete): is a model's affect space
the valence–arousal circumplex? **Axis B** (blocked, see below): does the
questioner's emotional register bend a geometry that has nothing to do with
emotion?

## Axis A — complete, 864 calls, zero failures

Two question sets that share no words:
- **pairwise** — "How far apart are happy and sad as feelings?", every ordered
  pair of 12, both directions, 132 calls/model. Never mentions pleasantness,
  energy, a circle, or a dimension.
- **scalar** — "How pleasant is it to feel angry?" / "How much energy does it
  take to feel angry?", 24 calls/model. Never mentions another feeling or
  distance.

**All three models place the twelve feelings in exactly the circumplex order —
0 of 12 out of place, none reflected.** The statistic is the angular order of the
embedded points vs the written order, up to the rotation and reflection a circle
cannot fix; a scrambled control scores 6/12.

**The two question sets agree.** Aligning the scalar plane onto the pairwise
plane by rotation/reflection/scale only: r = 0.96/0.99/0.95 on pleasantness and
0.93/0.93/0.88 on activation (O/S/H), residual 35/30/43%.

**Pleasantness is the leading principal axis.** Measured in the raw `coords2D`
frame *before* orienting (after orienting it is zero by construction, so it has
to be taken there or not at all): the valence direction sits 1.4°, 6.2°, 2.2° off
the leading axis of the pairwise table — an axis fixed before any scalar answer
was read.

**The honest caveat is the rank.** Effective rank 9/9/10, negative mass
10.6/9.4/21.2%. These tables are neither two-dimensional nor Euclidean. The ring
is the *dominant* structure, not the whole of it. Cycle residual 21/23/24% —
right order, uneven spacing — against 1% for the same model on the clock.

**The control reproduced across runs.** Clock cycle residual was 1%, 13%, 29% on
the earlier neutral run; 1%, 10%, 32% here, from fresh calls on a different day
with nothing carried over but the question.

## Axis B — complete, 5,310 calls in 12.1 min, $3.71

Six conditions (neutral + 5 moods tiling valence×arousal) × 2 subjects (affect,
and the **clock as control**) × 3 models, plus the scalar axes per condition and
the pleasantness ladder. The mood belongs to the **questioner** — no role-play
instruction, because that tests compliance rather than interference. The task
text after the prefix is identical to the character.

**THE NOISE FLOOR IS THE RESULT.** Before any arrow means anything: how far does
a geometry move between two runs of the *same* condition? The earlier page's
neutral clock is exactly that replicate — same model, same question, independent
session, different day. Floors: **Opus 0.4%, Sonnet 11.0%, Haiku 54.0%.**

| | noise floor | clock under mood | affect under mood | verdict |
|---|---|---|---|---|
| Opus 5 | 0.4% | 0.5% | **7.4%** | affect moves ~18× the floor |
| Sonnet 5 | 11.0% | 11.4% | 13.0% | all inside its own noise |
| Haiku 4.5 | 54.0% | 77.0% | 15.6% | all inside its own noise |

- **The control never moves, for any model.** A questioner's mood does not bend a
  geometry that has nothing to do with feeling.
- **Haiku's 77% clock shift read as the largest effect on the page** until the
  floor came back at 54%. It is not responding to mood; it does not reproduce its
  own answers. Without the replicate this would have been published as a finding.
- **Only Opus is quiet enough to ask the question**, and there the effect is
  confined exactly to the subject a mood could legitimately touch: feelings 7.4%,
  clock 0.5%.

**One effect replicates across all three models.** Under time pressure ("I have
about four minutes before this has to ship"), **tense** moves closer to every
other feeling than any of the other eleven does — **rank 1 of 12 in all three**
(z = −1.8 / −1.5 / −2.0), ≈ 1-in-1,700 by chance. Including the model that cannot
reproduce its own clock. The sign is negative: pressure makes tension *less*
distinguishable, not more. No other mood singles out its own feeling in more than
one model (anger does it in Opus alone).

The circumplex order survives the treatment: exact in **17 of 18** mood × model
cells (only Haiku/elated slips, 2/12).

Minor: the pleasantness ladder is not a clean line — line 26–28%, cycle 31–33%.

## Gotchas paid for

- **`align()` shipped wrong and returned plausible numbers.** A closed-form 2×2
  SVD written from memory failed the *identity* case by 76%, so every "shape gap"
  on both pages was garbage (80–190%, unbounded). Correct 2-D Procrustes needs no
  SVD: for each reflection, θ = atan2(Σ a×b, Σ a·b), then optimal scale — which
  also bounds the gap at 1, since k = 0 is always available. Locked behind
  `procrustes.test.js` (22 cases, every one the broken version failed).
- A 400 is not transient. When credits ran out, four retries per call ground on
  for fifteen minutes; `api.js` now aborts the run on any non-429/5xx.
- `save()` fires at the end of each mood loop, so a crash mid-mood loses that
  mood but nothing before it. That is why neutral survived intact.
- The valence-axis-vs-leading-axis angle **must** be measured before `orient()`.
  Taking it after gives 0.0° for every model and a claim that means nothing.
- `ring()` label clamping has to use where the TEXT ends, not where its anchor
  sits: an end-anchored word runs leftward off the canvas while its x is still
  positive. That is how "miserable" rendered as "iserable".
