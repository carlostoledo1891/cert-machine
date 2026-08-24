# cert-machine — the plan

**Date:** 2026-08-24. **Status:** Phase 0 complete — the repo is standing and every lifted
battery is green (`make selftest`). See `notes/2026-08-24-standup.md`. Phases 1–3 below are
still plan.
**Source lab:** `/Users/carlostoledo/Documents/sin-mfg` — read in full for this plan,
**never written to.** Evidence: no write command was issued against that tree (only `cat`,
`ls`, `find`, `grep`, `wc`, `git status`, `git log`, and `cp` copying outward), and
`make drift` reports all 39 lifted source files byte-identical to their lift-time sha256.
Its working tree did go clean mid-session — the owner committed it at 16:22:55 -03
(`8865bb1`) — which is why the count is not the evidence and the command log is.

---

## 0. The thesis, in one paragraph

sin-mfg is a **verification house**: it can certify anything it is pointed at, and it has
paid for a permission layer that decides what may be pointed at, what may ship, and who
may write it down. cert-machine keeps **every instrument** and **none of the permissions**.
The instruments are not the thing slowing you down — the certifier is what makes a novelty
worth anything. What slows you down is that occupancy, publication and status were built
as *veto points at the end*. Here they become *scores at the front*: the literature read
turns into a novelty score that steers the search, publication turns into a dial with no
default, and the ladder turns into a compass that shows where the evidence is thin — which
is where the next hour should go.

Your own retro already wrote the sentence this project exists to act on:

> **"The machine can certify anything it is pointed at. Point it with the same rigor it
> verifies with."** — `brain/FUNNEL_PROCESS_RETRO_2026-08-20.md` §6

sin-mfg's frontier is not its certifier. It is its **aim**.

---

## 1. What I read (the evidence base for everything below)

| what | where | why it matters here |
|---|---|---|
| the doctrine | `CLAUDE.md` (26 KB), `CONSTITUTION.md` (9 rules, ~30 struck) | tells me exactly which locks exist and which were already removed by owner ruling |
| the certifier contract | `core/interval/` — `certificate.js`, `interval.js`, `rational.js`, `radii.js`, `sequence.js`, `transcendental.js` | a Certificate **cannot be constructed without a falsifier**. This is the one idea worth keeping unconditionally |
| the discovery machine | `research/_engine/funnel/` (19 files, 3163 lines JS) | generate → validate → score → screen → certify → chained record → board. Already built, already tested |
| the autoresearch read | `brain/AUTORESEARCH_AUDIT_2026-08-20.md` | why the funnel exists; the fixed-harness seam; the score≠claim firewall |
| what the other machines do | `research/probes/machines-scout/` — `SCOUT_RAMANUJAN.md`, `SCOUT_DEEPMIND.md`, `SCOUT_FIELD.md` (62 KB) | mechanism-level reads of Ramanujan Machine, FunSearch/AlphaEvolve, SAT/Lean/Graffiti — **and the named gaps nobody has taken** |
| what the machine actually did | `brain/FUNNEL_PROCESS_RETRO_2026-08-20.md` (22 KB) | three campaigns measured; the gradient law; the "box placement dominated engine choice" finding |
| where to point it | `research/probes/problem-scout/NEXT_TRACKS_2026-08-20.md` | four ranked tracks with honest P(mint); the Mercer program at the top |
| the live probes | `research/probes/PROBES.md` (163 lines) + 21 probe dirs | chowla-cosine, erdos979, alphaevolve-certify, cheap-cert-families, rlvr-env |
| the roster | `.claude/agents/` (18 agents, 5589 lines) + `_SWARMS.md` | adversary/hunter/adjudicator separation of powers; the mechanical screen |
| the evidence layer | `ledger/` (claims · certs · attacks · runs · mutants · ladder.md) | the 0–5 status ladder and its six entry doors |

---

## 2. The single design decision

**A lock says what you may do. An instrument says what is true.**

Everything in sin-mfg that refuses a *direction* is dropped. Everything that measures a
*fact* is kept — because without it a "discovery" is a number that came out small, which
is the one thing this house has never shipped.

And the release valve that makes "zero locks" real without making it worthless:

> **Everything can be turned off. Nothing can be turned off silently.**

Every discipline below is a run option with a default. Flip any of them and the run
record says you flipped it, in the chained line, next to the result. No gate ever asks
permission; the record never forgets. That is the whole governance model of this repo.

### Kept — instruments (each already implemented in the lifted code)

| instrument | what it measures | source |
|---|---|---|
| falsifier-required Certificate | "what input would make this red?" — unanswerable ⇒ no certificate | `core/interval/certificate.js` |
| red controls (C10) | a check that has never been seen going red is decoration | funnel selftest: **19 red controls, all fire** |
| independent recompute | `recheckCertificate` re-derives by a different path before admission | `funnel.js: admitHit()` |
| planted-hit recall + reject audit | a float screen may prune, never admit; its false-negative rate is measured, never assumed | funnel run start/end |
| score battery | known-bad scores low; amplitude/scale inflation cannot move the score | funnel run start (their NLS incident, generalized) |
| harness sha pin | sha256(target + funnel + generator) rides every record; a mid-campaign edit is visible | every experiment line |
| tamper-evident chain | each jsonl line hashes the previous; edit/reorder/delete ⇒ resume refuses by line number | `verifyChainFile` |
| forced equal-budget dumb baseline | every clever engine runs against enum at the same budget, automatically | `governor.js` |
| two counters, never one | certified HITs (order-independent) vs new-to-board admissions (novelty) — both, with definitions | `METRIC_DEFS` |
| quantifier shape | HIT (∃, witness attached) vs RECORD (superlative, box named in the claim text) | claim constructors throw otherwise |
| provenance at write | `{seed, runId, harnessSha, ts}` on every line; the reader refuses unprovenanced ones | `stats.js` |

### Dropped — locks

`core/publish_gate.js` and every `WITHHOLD` · `IP_MANIFEST.json` · `PAGES.json`
default-deny and the export allowlist (`tools/build-public.js`) · `LICENSE`/moat/token
gates · the literature gate **as a promotion veto** (it comes back as a score, §4.2) ·
the ladder **as a permission** (it comes back as a compass) · `ledger-scribe` as the sole
writer and every other role monopoly · the mission/handoff bureaucracy (`missions/`,
`MSN-` ids, HANDOFF ritual) · `make verify` as a pre-push hook, CI, and the 60+ `check-*`
targets · the probe time-box and the 14-day auto-drop · `test-single-source.js` (a
whole-tree copy police that only makes sense in a monorepo with an export seam).

**One thing I would not drop, and I'll say it once:** publication is still irreversible.
Not a gate — just: nothing leaves this repo to an external identifier (Zenodo DOI, OEIS,
arXiv, an email, a PR) without you saying so in that session. That is not a lock on
research, it is a lock on *sending*, and it costs nothing until the moment it saves
everything. Everything else above is genuinely gone.

---

## 3. What lifts — measured today, not assumed

I copied the candidate lift into a scratchpad with **no other files present** and ran every
battery. All of it is dependency-free Node (fs/path/os/crypto only) — zero npm packages.

| component | size | isolated result |
|---|---|---|
| `research/_engine/funnel/` — the machine | 19 files · 3163 lines | **14/14 items GREEN, 19/19 red controls fired** |
| `research/_engine/detach/` — nohup+checkpoint+resume+watch | 245 lines | lifts (extracted from 4 hand-rolled copies after a harness kill) |
| `core/interval/` — eqcert: interval · rational · radii · sequence · transcendental · certificate | 1090 lines + 1989 lines of tests | **4/4 batteries PASS** (`test-eqcert`, `test-interval`, `test-transcendental`, `-enclosure`) |
| chowla trig-min certifier — `certify-min.js` + `cheb.js` | 830 lines with its battery | **47/47 PASS**, both red controls fired |
| exact rational SOS — `sos_verify.py`, `lyapunov_cert.py`, `reverify_ai_lyapunov.py` | 260 lines | F6 certificate family, exact, red-controlled |

Total: **~7,500 lines of working, self-tested instrument**, verified green in a bare
directory on 2026-08-24. Nothing needs porting. The lift is a copy.

**How the copy stays honest:** `PROVENANCE.json` records, per lifted file, the sin-mfg
source path + sha256 at lift time. `make drift` re-hashes both ends and prints what has
diverged. We never write back; we can always tell what moved.

---

## 4. The evolutions — what cert-machine adds

The scouts already measured the field's open flanks (`SCOUT_*.md`, phrased to survive a
hostile referee): *nobody independently verifies the evaluator; the DeepMind lineage is
∃-only with no completeness claims; no public artifact standard for non-SAT numerical
exhaustions was located; **no status ledger over conjecture output exists anywhere**;
literature identification is the field's #1 documented failure mode; equal-budget
baselines are absent in every source read.* Five of the six are things you already do.
The five items below turn that from a defensive posture into a search strategy.

### 4.1 · The AIM stage — targeting becomes a machine, not a human step

The retro's own headline finding: **"box placement dominated engine choice."** The chowla
campaign spent ~700K tokens rediscovering a basin Mercer published in 2019, and learned it
only at promotion. Today the funnel has three engines and *zero* machinery for choosing
what to point them at.

Build `machine/aim/`: a first-class phase that runs **before** generation and emits a
scored box proposal — occupancy read, structural priors, the instrument's measured cost
curve at that degree, an expected-novelty-per-certification estimate — recorded as an
experimental input exactly the way `promptSha` records a prompt. Then the payoff: aim
becomes measurable. `aim-engine vs. random-box at equal budget`, judged by the same
forced-baseline discipline you already apply to generators. **No source the scouts read
runs an equal-budget baseline on anything. Running one on targeting is a first.**

### 4.2 · Novelty as the objective function, not the gate

This is the direct answer to "the rigor is holding me back from novelty."

Today: the literature gate is binary, expensive, and fires at promotion — after the spend.
Here: `noveltyScore(candidate) → [0,1]`, cheap, continuous, computed **at admission**, from
a local corpus index (OEIS b-files, the erdosproblems yaml you already snapshotted, arXiv
metadata, RM/AlphaEvolve result dumps, your own board) plus an optional LLM occupancy read.
Board admission ranks on `certified ∧ novel`. A hit that collides with print still gets its
certificate — it just does not win the board, and the collision is *visible in the first
minute instead of the tenth hour*.

The gate is not removed. It is inverted into a compass, and it steers instead of stopping.

### 4.3 · The status ledger over other people's conjecture piles

Your idea #2, pointed at a corpus that already exists. Measured by your own scout:

> The Ramanujan Machine "does not maintain a systematic proved/refuted ledger" — its
> results page tracks status in coarse prose, "**no proof attributions, no dates, no links
> to the proving papers**", and "no fraction-proved figure exists anywhere I could find;
> **nobody — including them — publishes one**." — `SCOUT_RAMANUJAN.md` §2

There are thousands of public machine-generated conjectures — RM's PCF families, the
AlphaEvolve repository of problems (you already opened `alphaevolve-certify` on it),
OEIS conjectured formulas, erdosproblems' computation class with no certificate norm —
and **no one keeps score**. Your instruments can adjudicate a large fraction of them
mechanically. Every adjudication is a mint: a certificate, a refutation, or an honest
UNREACHABLE. The ledger itself is the novel artifact, and it is a public good that
accretes into a moat: the house that knows which conjectures are actually true.

This is also the natural home for "testing a large number of results" — the firehose:
**harvest → normalize to a certifiable form → certify → three buckets → board.**

### 4.4 · The reduction atlas — one instrument, many objects

`certify-min.js` certifies the global minimum of *any* integer-coefficient cosine
polynomial. Your NEXT_TRACKS already found the second object family for it in one read:
Newman polynomials, because `|f(e^{iθ})|² = n + 2·Σ_{i<j} cos((a_j−a_i)θ)` — same
instrument, no modification, a different open problem (Boyd's 1986 conjecture, open at
n=6). That is not a coincidence, it is a **normal form**, and normal forms are cheap.

Maintain `atlas/`: object family → normal form → house instrument → what a HIT means →
who owns the ground. Every row is a new front for an instrument that already passed its
battery. Highest novelty-per-token in the entire system, and it compounds.

### 4.5 · Refutation-first — the counterexample amplifier

From your own autoresearch audit, identified and never built:

> "The deepest fit, unnamed by them: their Navier-Stokes campaign is 'hunt the input that
> maximizes a blowup metric' — the loop is a **counterexample amplifier**." — §"Where it
> plugs into this engine"

Point the funnel at a *published* conjecture's scope box with score = magnitude of
violation. A counterexample is decisive, needs no referee's taste, is instantly recognized,
and is the single fastest path from compute to citable novelty. Your adversary → hunter →
adjudicator separation already exists to keep it honest.

### 4.6 · (Afterburner, optional) the Lean bridge

`elan` + Lean **4.32.0** are installed on this machine. Your ladder's rung 5 (*proved*) is
empty and rung 4 (*certified*) is where everything stops. For the decidable subclass —
exact rational SOS, exact sign decisions, finite case checks — a certificate → Lean
statement path moves objects to rung 5. The scouts flagged the window and dated it:
"Lean is annexing adjacent certificate cultures (LRAT-Catcher, PBLean); the
validated-numerics window is real but must carry its date."

### 4.7 · The Ramanujan answer, stated directly

You asked for a machine like the Ramanujan Machine. Here is the delta, from the scout's
mechanism-level read: RM's certification standard, from 2019 through the 2025 stack, is
**truncated-decimal hash matching plus a collision-probability heuristic** — "such an
accuracy does not replace the need of a formal proof" (their own paper). Their object
space is polynomial continued fractions; their match layer is PSLQ over a constants
library; their status layer does not exist.

Same object space, our instruments: interval enclosures with outward rounding for the PCF
tail, exact rationals to *decide* (the only tool that can resolve a tie — no interval
method can ever conclude a quantity is exactly zero), a falsifier on every certificate, and
a status ledger over the output. That is not an incremental improvement on the Ramanujan
Machine; it is the same machine with the one part they explicitly disclaim. It needs new
mathematics (rigorous PCF tail bounds, irrationality-measure certificates) — which is why
it is Phase 3 and not Phase 1.

---

## 5. Repo shape

```
cert-machine/
  CHARTER.md          the doctrine in one page: locks vs instruments, the one release valve
  CLAUDE.md           short. what this is, how to run it, where things are
  PROVENANCE.json     every lifted file: sin-mfg source path + sha256 at lift time
  Makefile            selftest · fast · hunt · board · drift   (no gates, no CI, no hooks)

  machine/            the engine
    funnel/           LIFTED verbatim — runner, governor, stats, generators, selftest
    detach/           LIFTED verbatim — long runs that survive the harness
    aim/              NEW (§4.1) — box proposal, occupancy priors, cost curves
    novelty/          NEW (§4.2) — noveltyScore + the corpus index behind it

  instruments/        the certifiers. one per normal form, each with its own battery
    interval/         LIFTED — eqcert: interval · rational · radii · sequence · certificate
    trigmin/          LIFTED — Chebyshev → Sturm → interval-Newton, 47 checks
    sos/              LIFTED — exact rational sum-of-squares
    ...               one directory per new normal form, added by the atlas

  atlas/              §4.4 — object family → normal form → instrument → what a HIT means
  corpus/             §4.3 — harvested external claims: RM, AlphaEvolve, OEIS, Erdős
  hunts/<slug>/       one campaign: program.md · target.js · statement.json · experiments/ · best.json
  board/              cross-hunt leaderboard + the status ledger over external conjectures
  notes/              append-only. findings, lessons, dated records
```

Local git repo, private by default. No export machinery, no public tree, no `PAGES.json`.
Reach is decided per artifact, when you want reach.

---

## 6. Build phases

**Phase 0 — stand it up (≈1 hour).** git init · scaffold · lift the five components with
`PROVENANCE.json` · `make selftest` green in the new repo. Everything in this phase is
already proven to work: I ran all of it today in an empty directory.

**Phase 1 — make it ours (≈half a day).** `CHARTER.md`. Turn every kept discipline into a
recorded run option (the release valve). Repoint the only three cross-tree path assumptions
in the whole lift (measured: two `../../../core` climbs in `certify-min.js` and `cheb.js`,
one commented climb in the funnel skeleton). Add `make drift`. First smoke hunt on
the funnel's synthetic target, end to end, so the pipeline is live before real mathematics
touches it.

**Phase 2 — the first two hunts, in parallel (days 1–5).** Both reuse instruments that
passed their batteries today; neither needs new mathematics. See §7.

**Phase 3 — the evolutions (week 2+).** `aim/` and `novelty/` (§4.1, §4.2) built against
the Phase-2 hunts as their first real customers — targeting has to be measured on a hunt
that already ran, or the baseline is imaginary. Then the atlas, then the PCF identity
engine (§4.7), then the Lean bridge if the objects warrant it.

---

## 7. First hunts — recommendation

**Run these two together. They share the machine and share nothing else, so neither can
starve the other.**

**Hunt A — "the scorekeeper" (the firehose, §4.3).** Point the certifier at a public pile
of unadjudicated machine-generated conjectures and keep score. Builds `corpus/`,
`board/`, and the harvest→normalize→certify→bucket loop — i.e. it *is* the infrastructure
for your idea #2, with a real corpus as its first customer. Low mathematical risk, mints
from day one, and the artifact (a status ledger nobody maintains) is itself novel.

**Hunt B — "μ(6) > 1" (the lottery ticket with real odds, §4.4).** A single 6-term Newman
polynomial with certified min modulus > 1 proves the first open case of **Boyd's 1986
conjecture** — a theorem the moment the certificate exists. The instrument needed is
`certify-min.js`, which passed 47/47 in an empty directory today; the work is one
`target.js` (autocorrelation encoding) plus a box. Your own scout priced it: **~25–35%
inside a week**, ~70% that *something* theorem-grade lands on that track inside a month,
and the failure residue is still the first certified λ/μ landscape in the literature.

Deferred to Phase 3, deliberately: the PCF identity engine (§4.7). It is the truest answer
to "a Ramanujan Machine with our characteristics" and it is the only one of the three that
needs mathematics we do not already have on disk. It deserves the aim stage in front of it.

---

## 8. Decisions taken 2026-08-24

**Hunts: A, B and C — all three.** A and B run first because both reuse instruments that
passed their batteries today. C (the PCF identity engine, §4.7) is the one that needs
mathematics not on disk — rigorous continued-fraction tail bounds and irrationality-measure
certificates — so it opens as a scoping track in parallel rather than blocking A and B on
new theory. Nothing about that is a demotion; it is the only one of the three whose first
week is reading and derivation rather than compute.

**Agents: none for now.** Main loop only. The sin-mfg roster stays where it is. When a hunt
first needs an independent ruling — someone other than the searcher deciding whether an
attack survived — that is the moment to write `adversary`/`hunter`/`adjudicator` lean,
against this repo's actual shape rather than the mission bureaucracy they were built for.

**LLM engine: off, and it can be switched on later with a flag.** The generator interface is
`{name, init(ctx), next(state, rng)}` and the live engine is one 194-line file behind it;
the selftest already forces mock mode by passing an empty env, so nothing in the tree
depends on a key existing. Turning it on later is a run option, not a refactor.

### What it would cost, measured rather than estimated

From sin-mfg's own `llm-log.jsonl` (chowla campaign, 2026-08-20, bodies logged verbatim):
**150 calls · 512,494 input tokens · 29,922 output tokens** on `claude-sonnet-5`, averaging
3,417 in / 199 out per call (max_tokens 1024, thinking disabled, one forced tool call).

| campaign size | Sonnet 5 (intro, through 2026-08-31: $2/$10 per MTok) | Sonnet 5 (standard: $3/$15) | Opus 5 ($5/$25) |
|---|---|---|---|
| 150 candidates (measured) | **≈ $1.32** | ≈ $1.99 | ≈ $3.31 |
| 1,000 candidates (linear) | ≈ $8.80 | ≈ $13.30 | ≈ $22.10 |

The 1,000-candidate figure independently reproduces the "\$10–15 per campaign" number in
`brain/AUTORESEARCH_AUDIT_2026-08-20.md`, which is a mild cross-check that the arithmetic is
right. Prompt caching would cut it further — the tool schema and briefing are a stable
prefix, cache reads bill at ~0.1× — but on a two-dollar campaign that is not the point.

**So cost is not the reason to leave it off.** The reason is the measurement: across three
campaigns the live LLM lost to dumb enumeration on certified hits at equal budget (37:24,
with the ordering handicap in its favour) and won on exactly one axis — it was the only
engine that produced legible hypotheses. That is an argument for putting it in `aim/`
(§4.1: basin proposal, occupancy reads, box selection) and keeping it out of the inner loop.

**RunPod: not needed for A, B or C — and worth saying why rather than leaving it open.**
Every certifier here is exact BigInt and interval arithmetic: Sturm chains, interval Newton,
rational SOS. Those are branchy, single-threaded, and gain nothing from a GPU. What long
campaigns actually want is *cheap CPU-hours that survive a laptop sleep*, and `machine/detach`
already solves the survival half locally. If a campaign outgrows the laptop, a plain small
VPS is the right instrument, not a GPU pod. Revisit RunPod only if an ML-flavoured track
(`mf-jepa`, `rlvr-env`) moves over from sin-mfg — that is real GPU work, and none of it is
in A, B or C.

---

## 9. Next, concretely

1. **Phase 1** — `CHARTER.md` disciplines wired as recorded run options; the first smoke hunt
   on the funnel's synthetic target so the pipeline is exercised end to end before real
   mathematics touches it.
2. **Hunt B first target.js** — the Newman μ(n) adapter. `|f(e^{iθ})|² = n + 2·Σ_{i<j}
   cos((a_j−a_i)θ)`, so the candidate is an exponent set and the certificate is
   `instruments/trigmin` unmodified. This is the cheapest path from a standing repo to a
   real object.
3. **Hunt A harvest** — pick the first corpus. The Ramanujan Machine results pages and the
   AlphaEvolve repository of problems are both public and both unadjudicated; `corpus/` takes
   whichever you want scored first.
4. **Hunt C scoping** — read for the tail-bound mathematics before writing any code.
