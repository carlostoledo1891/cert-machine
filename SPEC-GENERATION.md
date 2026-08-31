# SPEC — the generation front

Status: **specification, not built.** Written 2026-08-31.

A model proposes; the certifier decides; a proposer that stops earning its
place stops being queried. This document specifies the one component the
machine is missing, against the contracts that already exist.

---

## 0. Why this shape, and not the field's

Two independent lines say the same thing about AlphaEvolve-class systems: the
bottleneck is the **evaluator**, not the proposer. Anyone can call a frontier
model. The stated requirement is "a manually designed unhackable evaluator
that maps solutions to scalar scores", and the documented failures are what
happens when that evaluator is a score — a candidate that deletes a memory
limit and catches the exception, a candidate that skips pipeline stages, a
candidate that zero-weights 97% of the population to win a balance metric.

AlphaProof Nexus (arXiv:2605.22763) is the closest published system and names
the problem this spec exists to answer:

> "A challenge here is the mismatch between evolutionary algorithms, which
> typically assume a graduated fitness landscape, and formal proof evaluation,
> which is inherently binary."

Their answer is LLM raters scoring *plausibility, clarity and novelty* into an
Elo. That is a subjective fitness signal, and their two admitted failure modes
— agents offloading difficulty into `sorry`s that restate the target, and
sketches citing hallucinated lemmas — are what a subjective signal buys.

**This machine's answer is different and is the whole reason to build it:**

> An interval enclosure is binary AND graduated. The verdict is a proof; the
> WIDTH is the gradient.

Evolution gets a continuous, objective, monotone landscape to climb. Soundness
is never traded for it. No model's opinion enters the loop at any point.

---

## 1. What already exists

Three of four parts are built and deployed. This spec adds the fourth.

| part | where | status |
| --- | --- | --- |
| the loop | `machine/engine.js` — enumerate → screen → certify → dedup | built |
| the family contract | six functions, 11 families in `families/` | built |
| the deciders | 17 instruments (`interval`, `trigmin`, `sos`, `strassen`, `keller`, `census`, `cf`, `erdos852h`, …) | built |
| a model-callable certifier | `oracle/tool-definition.json` + `claim-schema.json` — strict schema, returns CERTIFIED / REFUTED-with-mechanism / REFUSED | built |
| the anti-hacking layer | `machine/funnel/` — governor, selftest, 14 items / 19 red controls | built |
| the prune rule | `instruments/forecast/admission.js` — `admit({claim, scored, covered, bar})`, exact binomial tail in BigInt | built |
| publication | ledger, build gates, report builders | built |
| **the controller** | — | **this spec** |

---

## 2. The `propose` contract

One optional function is added beside `enumerate`. A family that omits it
behaves exactly as today.

```
propose(ctx) -> Promise<Proposal[]>
```

`enumerate(i)` is systematic and exhaustive. `propose(ctx)` is a model, and is
**additive, never a replacement** — on a family a scan can exhaust, the scan
wins and the proposer is not called. (Stated because it is the failure this
project would otherwise walk into: the #852 record on 2026-08-31 came from a
plain two-pointer scan, not from cleverness.)

### 2.1 `ctx` — what the proposer is told

```js
{
  family:    'strassen-audit',      // family.name
  statement: '…',                   // family.statement, verbatim
  target: {                         // what would count as progress
    kind: 'minimise' | 'maximise' | 'decide',
    quantity: 'rank' | 'additions' | 'run-length' | …,
    incumbent: <number|string>,     // the published value to beat
    source: 'A079007(30) = 196948778371'
  },
  best:      [ … ],                 // the k best CERTIFIED objects so far,
                                    // each with its certificate and width
  refuted:   [ … ],                 // the k most recent REFUTED proposals,
                                    // each with the instrument's MECHANISM
  budget:    { proposals: 8, tokensOut: 4000 }
}
```

**`refuted` is the load-bearing field.** The certifier does not return "wrong";
it returns the first violated equation, the exact left side, the required right
side and the exact discrepancy. That is a repair instruction, and feeding it
back is what makes this a loop rather than a lottery. The existing oracle tool
description already says so in as many words.

### 2.2 `Proposal` — what comes back

```js
{
  obj:      <object>,     // in the family's own object language — the SAME
                          // thing enumerate(i) returns, so every downstream
                          // stage is unchanged
  claim:    [pN, pD],     // the proposer's stated hit rate, e.g. [1, 4]
  rationale: '…',         // free text, NEVER read by any decision
  proposer: 'claude-opus-5@v3'
}
```

`rationale` is recorded and displayed and **is not an input to anything**. The
moment a rationale can move a verdict, this becomes the system whose failure
modes are quoted in §0.

### 2.3 Admissibility

A proposal is REFUSED before it reaches the certifier if it is not a
well-formed object of the family, if `claim` is absent or outside `[0,1]`, or
if `key(obj)` is already in the ledger. A refused proposal **still counts
against the proposer's record** — proposing garbage is not free.

---

## 3. Fitness is the enclosure width

The engine's certify already returns `{ verdict, enclosure, text, extra }`.
This spec requires one addition per instrument:

```
width(certificate) -> non-negative real, or null
```

`null` means the instrument has no graduated signal and the family is
**decide**-kind: fitness is the verdict alone, and the controller degrades to
a bandit over proposers instead of a hill climb. That is stated rather than
faked.

The controller ranks the population by, in order:

1. **verdict** — HIT above REJECT above REFUSED. Terminal and non-negotiable.
2. **progress against the incumbent** — exact comparison in the family's own
   arithmetic. This is what "better" means, and it is an integer or an exact
   rational, never a float.
3. **width** — narrower first. Two candidates that both fail to beat the
   incumbent are ordered by how close their certificates came to deciding.

Rule 3 is the gradient. Rules 1 and 2 are the proof.

**A proposer cannot influence its own fitness**, because the fitness is
computed by an instrument the proposer never touches, from a certificate the
proposer cannot forge. This is the structural claim of the whole design and
the reason the documented reward hacks cannot occur: there is no scalar to
game, only arithmetic to satisfy.

---

## 4. Proposer admission — grading the generator

Nobody in this field grades their generator. This machine already has the
mechanism, applied to forecasters; the change is the noun.

A **proposer** is the triple `(model, prompt version, temperature)`. It is a
distinct identity: changing the prompt makes a new proposer with a fresh
record, because a proposer's record must describe the thing that will be
queried next.

```js
const { admit } = require('instruments/forecast/admission.js');
admit({ claim: [pN, pD], scored: proposalsDecided, covered: hits, bar: [1, 20] });
```

- `scored` — proposals that reached a verdict, REFUSED included.
- `covered` — proposals that came back HIT.
- **DEADMITTED** when the exact binomial tail falls to or below the bar: *if
  the claimed hit rate were true, a record this bad has probability ≤ tail*.

A DEADMITTED proposer is **not queried** — the gate sits before the API call,
not at the ledger. A prune enforced only at the ledger costs money to enforce;
that lesson is already in the record from the forecast gym's prune gap.

Three properties carried over deliberately:

- **`scored = 0` ⇒ tail 1 ⇒ ADMITTED.** Admission is lost by record, never by
  opinion.
- **Only under-performance prunes.** Beating your claim is the conservative
  direction.
- **The prune is not retroactive.** Proposals committed before a deadmission
  are still scored.

**Open, and it must not be quietly skipped:** the forecast gym has no
readmission path despite its own text implying one. A proposer whose prompt is
revised becomes a *new* proposer under this spec, which is the honest version
of readmission and the reason to make prompt version part of the identity.

---

## 5. The controller loop

```
until budget exhausted or the target is closed:
  1. pick a proposer          admitted only; sample ∝ recent certified progress
  2. build ctx                best-so-far, most recent REFUTED mechanisms, budget
  3. propose(ctx)             one API call, metered in tokens and dollars
  4. for each proposal:
       admissible?            no  → REFUSED, counts against the record
       key seen?              yes → duplicate, counts against the record
       certify(obj)           the family's own instrument, unchanged
       record verdict + width + cost into the ledger
  5. update the population    ranked by §3
  6. update admission         §4; deadmit if the tail has fallen to the bar
```

Every step already has an owner in the repo except steps 1, 2 and 5.

### 5.1 What must be true of the ledger

Append-only, one row per proposal, each carrying: proposer identity, `ctx`
digest, the object, the verdict, the enclosure, the width, the cost, and the
wall-clock. A row is written **before** the certifier runs and completed
after, so a crash mid-certification leaves an honest REFUSED rather than a
gap. Same discipline as the forecast ledger's commit-before-score.

---

## 6. What gets published

The report page is not a leaderboard of wins. It is:

- the **board** — every admitted proposer, its claimed hit rate, its realized
  rate, its exact admission tail, and its spend
- the **refutations** — the count and a sample of proposals the certifier
  killed, with mechanisms. *AlphaEvolve-class systems report hits. Publishing
  the denominator is the differentiator; it is also the only honest way to
  state a hit rate.*
- the **incumbent table** — what was beaten, by whom, and by how much, with
  every improvement re-proved at build by an independent verifier the way
  `instruments/erdos852h/verify-record.js` re-proves the #852 exhibit
- the **cost** — dollars per certified object, per proposer

---

## 7. First targets

The controller is worthless without a target where certification is cheap and
the claim is existential. In priority order:

1. **Polynomial-multiplication tensors over F₂** — 18 published lower bounds
   (Wang, arXiv:2603.07280) with gaps of 3 to 10; the upper bounds they are
   measured against are still 1980s CRT hand constructions (Wagh–Morgera,
   Morgera, Winograd) and Cenk–Özbudak 2009. F₂ arithmetic makes the
   certifier nearly free. Every hit is a new upper bound; a hit below a
   published lower bound refutes a 2026 paper.

   **CORRECTED 2026-08-30, by the prior-art gate this list asks for.** This
   item used to read "flip-graph search has never been pointed at them". That
   is false, and the paper that falsifies it is one this spec should have
   found: Chen & Kauers, *Flip Graphs for Polynomial Multiplication*
   (arXiv:2502.06264, February 2025) adapted the Kauers–Moosbauer software to
   the polynomial case and published a 10×10 table of ranks over ℤ₂. So:

   - **The FULL product P_n over F₂ is taken.** Their squares are 3, 6, 9,
     13, 17, 22, 26 for P₂..P₈ — landing exactly ON the Montgomery/CRT bounds
     Wang cites, never below them. Attacking it would be redoing their run.
   - **The CYCLIC, TRUNCATED and NEGACYCLIC products are untouched.** Those
     words do not appear in their paper at all; it is the full product and
     Hensel lifting, and its own conclusion names ℤ₃/ℤ₅/ℤ₇ as not done.

   The correction narrows the target and pays for itself twice: their table
   is also a **calibration ladder**, a set of published ranks reached by the
   same method, so a walk that cannot match them is a walk whose numbers on
   the open families mean nothing. That ladder is now the gate in
   `instruments/bilinear/battery.js`.

   And it says something worth keeping about how this list is written: an
   item whose appeal rests on "nobody has tried X" is an item resting on a
   negative that was never checked. Check it first — the target that survives
   is smaller, but it is real.
2. **3×3 rank-23 addition count** — incumbent 55, whose authors explicitly
   disclaim global optimality; the two-level search over schemes × circuits
   has never been run.
3. **OEIS record extensions in the #852 family** — proven at 67 minutes per
   term on 2026-08-31.

---

## 8. Build order

| step | what | depends on |
| --- | --- | --- |
| 1 | `width()` on `instruments/strassen` and `instruments/interval` | — |
| 2 | proposal ledger + schema, append-only, commit-before-certify | — |
| 3 | `propose()` on one family (`strassen-audit`) via the existing oracle tool | 1, 2 |
| 4 | controller loop §5, single proposer, no evolution | 3 |
| 5 | proposer admission wired to `admission.js` | 4 |
| 6 | population ranking + `ctx.best` / `ctx.refuted` feedback | 4 |
| 7 | the report page | 5, 6 |

Steps 1–4 are a working single-proposer loop and are the honest MVP. Do not
build 6 before 4 has certified something.

---

## 9. Honest risks

- **Scale.** AlphaProof Nexus solved 9 of 353 Erdős problems at hundreds of
  dollars each, with DeepMind's budget. This machine must win on target
  selection and cheap certification, not on search depth.
- **The proposer may not help.** On families a scan can exhaust, a scan is
  better, and the #852 find is the evidence. If after step 4 the proposer has
  not beaten `enumerate` on the same budget, the honest outcome is to report
  that and stop — a null here is publishable and this project has published
  one before.
- **The moat is the red controls, and they rot.** Every new family needs its
  own forgeries. A funnel whose controls do not grow with it is decoration.
- **Cost.** Metering exists in the campaign runner; reuse it, and put dollars
  per certified object on the page from the first run.

---

## 10. The one-line claim this front would let the project make

> Everyone else grades a generated proof by asking a model whether it looks
> right. Here the grader is arithmetic, the gradient is an enclosure width,
> and the refutations are published with the hits.
