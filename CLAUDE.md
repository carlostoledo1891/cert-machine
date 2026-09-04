# cert-machine — independent exact certification

> Independent exact certification of machine-generated mathematics — exact arithmetic, no code shared with the claimant, refusal as a verdict.
>
> Adopted 2026-09-03 as the ONE description, to be held for a year (D1 in
> notes/positioning-decisions-2026-09-03.md). It goes in the site title, the
> README, CITATION.cff and .zenodo.json, and nowhere is it paraphrased. The
> engine below is the generator; the position is the judge.

Generate mathematical objects at scale, screen in float, **certify the survivors exactly**,
and hunt closed forms for what survives. The Ramanujan-Machine shape with the part they
disclaim: their hits are truncated-decimal collisions plus a probability argument; ours are
interval enclosures and exact rational decisions. A REFUTED here is proved.

```
make engine    generate → screen → certify; writes ledger.json
make control   rebuild index.html from the ledger
make test      every battery
make drift     re-hash the lift against the source lab
```

## Layout

```
machine/engine.js     the loop: enumerate, screen, certify, dedup, closed-form hunt
machine/funnel/       the campaign runner (chained records, forced dumb baseline)
machine/detach/       long runs that survive the harness
families/             one file per object family — six functions each
instruments/          the certifiers
  interval/           eqcert: intervals, exact rationals, falsifier-required certificates
  trigmin/            certified minima of integer cosine polynomials + the Newman envelope
  sos/                exact rational sum-of-squares
design/               tokens, components, template — every page is generated;
                      cdp.js is THE headless-Chrome client (it was written out
                      three times before 2026-09-04)
playground/           the source of /instruments — nine ungated instruments and
                      plate series. THE FOLDER AND THE URL DIFFER ON PURPOSE:
                      instruments/ at the root is already taken by the
                      certifiers, which are a different thing and are never
                      served. Renamed from /playground 2026-09-04, 301 in place.
tools/                run-engine · build-control · test-engine · lift
                      check-measure · the layout ruler: every built page driven
                      in Chrome at 1440 and 390, ratcheted against
                      design/measure-baseline.json, which only turns down
```

## Adding a family

One file in `families/`, six functions, no registration:

```js
name, statement                 what a hit asserts, in words
enumerate(i) -> object | null   deterministic and indexed
value(obj)   -> number          fast float
interesting(obj, v) -> bool     cheap screen — may only PRUNE, never admit
certify(obj) -> { verdict, enclosure, text, extra }    the only authority
key(obj)     -> string          canonical identity for dedup
```

`tools/run-engine.js` picks up every `.js` in `families/` automatically.

## The one rule

`/Users/carlostoledo/Documents/sin-mfg` is **read-only, permanently.** Read anything —
numbers, literature, instruments, records. Never edit a file, never change the tree; if you
find an error there, report it rather than repair it. That lab pins evidence by path and
sha256, so an edit makes a pin resolve to nothing and demotes a certified claim.

Copies come out through `LIFT.json`, which records each source path and its sha256 in
`PROVENANCE.json`; `make drift` re-hashes both ends. Patches to lifted files are declared in
`LIFT.json` so they can never be mistaken for drift.

## The sin-mfg relationship (operator instructions, 2026-08-27, permanent)

- **sin-mfg is a LEARNING repository.** Read it for insights, numbers, instruments and
  records, and apply them here **freely**. Never copy a gate, ruling, or instruction from
  sin-mfg that locks development — its aerospace gates, market-kill verdicts,
  occupied-as-veto literature gates, MOAT ceremonies and owner rituals are ITS governance,
  not ours. An incumbent tool existing (NASA Kodiak, anyone) is a benchmark to beat, never
  a blocker. What binds here stays short: this file's rules plus HANDOFF's standing rules.
- **Every page is born from the cert-machine template** (`design/tokens + components +
  template`). Never import built pages or CSS from sin-mfg. Lifted sin-mfg bytes live in
  `legacy/` as **gate sources only, unserved** — a public page from that material is a
  REBUILD in our design system under `/reports`, with a 301 from any old path. The single
  exception: byte-preserved files whose URLs appear in ALREADY-SENT outreach (the
  alien-science bundle).
- **Keep the machine lean.** Gates exist to catch drift and forgery, never to slow
  development; when a check refuses a direction rather than measuring a fact, remove it.
  Periodically review and delete unnecessary gates, files and dead code.

## The app doctrine (permanent, learned building SkyAudit, operator-approved 2026-08-27)

- Apps are the machine's highest-yield artifact form: the DECIDABLE-CLAIMS
  OBSERVATORY template = pinned real-world data × published claims/rules as
  boxes × an exact instrument × a product face. The city/market is the
  swappable pack; the template is the asset. The killer-app test (added
  2026-08-27): all four ingredients PLUS someone with money who is legally
  required to produce a defensible number under the rule — a contested
  rule without a compelled buyer is a demo, not a market.
- LESS MATH, MORE PRODUCT: product words on the surface (E-FLYABLE-style);
  the rigorous verdict + enclosure + witness one click down in a "why you
  can trust this" layer. Rigor wins by being invisible load-bearing
  structure, never the headline.
- The three-valued verdict is the product; NEEDS DATA is its sharpest edge —
  it MEASURES claim-maker opacity. Publish the exact threshold that would
  flip a verdict ("at X kWh you turn green"): the app is an incentive
  machine for disclosure.
- Gamification is welcome and must stay honest: simulations labeled as
  simulations, game mechanics only through cited physics anchors, the
  certified verdict always visible as the authority. Severity is never
  color alone (Garmin grammar); annunciators for binary states, plain-word
  tri-states.
- Every displayed number comes from a gated record; gates restore-the-
  record-on-refuse so drift refuses EVERY run. Any filter or definition
  used by two consumers lives in ONE module — a rule defined twice WILL
  diverge (the corpus.js lesson). Counting rule: dedupe and deflate to
  truth before anything is stated publicly.
- Data discipline: license separation (code MIT; corpora under their own
  license file beside them), sha256-pin every dataset including basemap
  tiles; big binaries serve from the public repo's raw URL pinned by commit
  SHA (Vercel's CLI silently drops large files); every regulated domain has
  hazard words — find them before writing page copy (aviation's
  "certified" pattern).
- UI verification: real-wait CDP screenshots (virtual-time budgets race
  cold CDNs and lie); headless Chrome clamps windows to >=500px — use
  device-metrics emulation for mobile truth; local dev servers must
  support Range requests.
- PREDICTION enters as a PROPOSER, never an authority (2026-08-27): a
  forecaster emits calibrated BOXES (never points); the certifier decides
  universally over the forecast envelope; every scenario is a pinned
  artifact (model version, inputs, sha) named in the certificate; the
  forecaster is graded by the machine against realized days and one that
  misses its certified coverage stops being ADMITTED until recalibrated
  (prune-only, applied to scenario proposers). In every UI, predicted and
  decided NEVER share a color or a typography — the moment a reader
  cannot tell which is which, the audit posture is gone.

## Target memory (added 2026-08-31)

`corpus/targets.json` records every target scouted and what became of it;
`node tools/targets.js [word]` reads it. It is MEMORY, not a gate — it refuses
nothing and is wired into no build. It exists because five targets died in one
session, each after hours, and every one would have died in minutes if the
prior art had been read first. **Scout before building, and write the row —
including when the verdict is OPEN, because a scouted-and-open target is worth
more than an unscouted one.** sin-mfg's own probe notes count as prior art and
are the first place to look; one of the five was already killed there, on disk,
the whole time.

## The backlog

The task menu lives at the TOP of `HANDOFF.md` (**TASKS BACKLOG**) and is kept current at
every handoff — the operator consults it as the standing menu. A session that changes the
state of any task updates the menu in the same commit.
