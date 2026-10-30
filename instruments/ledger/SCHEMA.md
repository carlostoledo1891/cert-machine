# instruments/ledger — sampled exact replay of a search ledger, on two simulators

Asked by claimbox's growth plan (its HANDOFF, B6: "a ledger of search progress, hash-chained checkpoints, random stretches
replayed on two simulators") and approved by the operator on 2026-10-30 (this repository's HANDOFF ◆, ruling 3). Without it
a watcher — a search that halts only on what it hunts — returns nothing until it halts, and the receiver decides only
halting witnesses. With it, the receiver decides the watcher's progress: what was replayed is decided exactly, and what was
sampled says what it would have caught. The runners that write ledgers are claimbox's; this folder decides them.

```
instruments/ledger/replay.py     the decider and the Python simulator; runs replay.js and keeps the joint word
instruments/ledger/replay.js     the second simulator, no code shared with replay.py (the funnel's chain and claim constructors)
instruments/ledger/battery.py    the gate (make test "ledger: sampled replay")
instruments/ledger/decisions.json   the recorded decisions: three ledgers, full and by the seeded sample (seed 2026-10-30, k = 5)
instruments/ledger/machines/     BB(4) and BB(5)'s champions as (Q, 2) tables
instruments/ledger/ledgers/      bb4-hit (a HIT), bb5-record (a RECORD), bb5-forged-row (the falsifier)
```

## The ledger

JSON Lines, each line the funnel's chained line (`machine/funnel/funnel.js` chainLine: the record compact, then
`,"chain":"<sha256(previous chain + "\n" + the line without its chain)>"}`, the first chain from `chainGenesis(id)` =
sha256("GENESIS:" + id)). Line 0 is the header; every other line a checkpoint.

```
{"kind":"ledger","format":1,"id":"bb5-record","machine":{"path":"instruments/ledger/machines/bb5.tm","sha256":"5116e794…"},"claim":{"shape":"RECORD","box":[1,200000]},"chain":"…"}
{"kind":"checkpoint","i":0,"step":0,"halted":false,"state":0,"head":0,"ones":[],"chain":"…"}
{"kind":"checkpoint","i":1,"step":10000,"halted":false,"state":…,"head":…,"ones":[…],"chain":"…"}
```

- **The machine** is a (Q, 2) table (one row per state, two cells `wDq` or `---`), pinned by path and sha256. Step t reads
  the cell under the head; `---` halts at t, the halting step counted and nothing written (tm.py's convention); the run
  starts from the blank tape, head 0, state 0.
- **The claim** is in one of the funnel's two legal shapes (its README, rule 1): a **HIT** `{"shape":"HIT","halt":T}` — the
  machine halts at step T, the last checkpoint is that halt — or a **RECORD** `{"shape":"RECORD","box":[1,N]}` — the box
  named: no halt in steps 1..N, the last checkpoint at step N. Anything else, a free-text superlative included, is refused.
- **A checkpoint** is the configuration after `step` steps: `state`, `head`, `ones` (the cells holding 1, strictly
  increasing) and `halted`. Checkpoints are numbered 0, 1, …, in increasing steps; only the last may be a halt. A
  **stretch** j is the run from checkpoint j to checkpoint j + 1; a ledger of K + 1 checkpoints has K stretches.

## The decision

In this order: the lines read (REFUSED when a line is not JSON, not in the chained-line form, a header or checkpoint of
another shape, a claim outside the two shapes, a box or halt the last checkpoint does not close, a machine not on disk or
not at its pin); the chain re-hashed over every line (REFUTED at the first broken link, the line its witness); the first
checkpoint must be the blank configuration (REFUTED otherwise); then the stretches are replayed exactly from their first
checkpoint: all K (`--full`), or a sample of k (`--seed S --k k`). A stretch whose replay does not end at the next
checkpoint — another configuration, or a halt before it, or no halt where the checkpoint says one — is REFUTED with its
witness: the stretch, its line, the claimed and the replayed configuration (step, halted, state, head, the number of cells
holding 1 and a digest).

| replay | every replayed stretch agrees | a stretch differs |
|---|---|---|
| full (k = K) | **CERTIFIED**: the HIT as the funnel's `hitClaim` (witness `{"halt":T}`, certificate the chain head); the RECORD as `recordClaim` with the full replay as its exhaustion certificate | **REFUTED**, the first such stretch the witness |
| sample (k < K) | **REFUSED** — a sample is not a proof; the RECORD printed with the funnel's downgrade "best known to this search"; the detection bounds stated | **REFUTED**, as above |

**The sample** is k distinct stretch indices drawn from sha256(`seed:chainHead:j`), j = 0, 1, … (the first 13 hex digits
mod K, repeats skipped), recorded sorted with the seed. It depends on the ledger's chain head, so a runner cannot know it
before the auditor names the seed. **The detection bounds** printed with a sampled decision, exact rationals: the
probability `k/K` of catching one wrong stretch, and 1 − (1 − f)^k for f = 1/100 and 1/10 — a runner wrong on a fraction f
of its stretches escapes k distinct draws with probability C(K − fK, k)/C(K, k) ≤ (1 − f)^k (the plan's bound; the battery
measures the rate on the falsifier).

**Two simulators.** replay.py and replay.js each decide the ledger alone — the reading, the chain, the sample, every
stretch, the witness, the rule, the claim text — and replay.py keeps the word only when the two decisions are identical
field for field; otherwise the ledger is REFUSED ("the two simulators disagree"). The verdict words are read from
`instruments/verdict.js`; the downgrade from the funnel; replay.js calls the funnel's own `chainGenesis`, `hitClaim` and
`recordClaim`, and replay.py writes the same strings again, so the battery's agreement holds the Python to the funnel.

## The record and the falsifier

`decisions.json` (`python3 instruments/ledger/replay.py --record instruments/ledger/decisions.json --seed 2026-10-30 --k 5
instruments/ledger/ledgers/*.jsonl`): bb4-hit CERTIFIED in full (BB(4) halts at step 107; tm.py agrees), REFUSED by the
sample; bb5-record CERTIFIED in full (BB(5)'s champion, no halt in 200,000 steps; tm.py agrees), REFUSED by the sample;
bb5-forged-row — checkpoint 7 with one cell added that the machine never wrote, the chain re-hashed — REFUTED in full,
witness stretch 6 (446 cells claimed at step 70,000, 445 replayed). The record's sample of the forged ledger (stretches 0,
9, 12, 16, 17) misses the two stretches the forgery spoils: REFUSED, not CERTIFIED — the seed (the date) was named before any decision
was drawn and is kept as it fell. Over 400 seeds the sample of 5 catches the forgery at the predicted rate,
1 − C(18, 5)/C(20, 5) = 17/38 (battery section 5).

## What it does not do

- It does not write ledgers. The battery's honest runner (`replay.py --write`) makes the fixtures; claimbox's watchers are
  the producers.
- One machine model today: the (Q, 2) Turing machine from the blank tape. A ledger of another search (an enumeration over
  a box, the ξ′ ceiling, an arena hunter) needs its step function written twice, here and in replay.js, before it is read.
- A sampled decision never certifies, and never states a probability that the claim is true: the bounds are about a runner
  that skipped or forged stretches, at the auditor's seed.
