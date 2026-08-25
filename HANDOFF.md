# HANDOFF — cert-machine

## What it is

A conjecture engine: generate mathematical objects at scale, screen in float,
**certify the survivors exactly**, and hunt closed forms for what survives.
Interval enclosures and exact rational decisions — a REFUTED here is proved.

```
make engine    generate → screen → certify; writes ledger.json   (~4 min)
make control   rebuild control.html from the ledger              (~40 s, runs batteries)
make test      every battery
make drift     re-hash the lift against the source lab
```

## State, measured at handoff

```
818,613  objects generated across 4 families
 15,125  certified exactly
77.6M    closed forms tested · 77,662,725 refuted · 7 surviving
    228  existence-AND-uniqueness theorems (Krawczyk)
```

Batteries 10/10. Engine gate 20/20 with 8 red controls. `control.html` builds
byte-identical twice. Drift: 38 unchanged, 1 local edited (a declared patch).

## The four families

| family | output | result so far |
|---|---|---|
| `newman-minmod` | min\|f\| on \|z\|=1 for 0/1 polynomials | 4 certified; one adopted into the envelope (17-term, min\|f\| ≥ 1.4141441147942588) |
| `chowla-cosine` | Chowla merit c = −min f_A/√\|A\| | 295 certified below 1 |
| `oeis-closedform` | audits 14,593 published OEIS constants | 77.6M forms refuted, **0 discoveries** — the corpus is curated, every survivor already had its form on record |
| `henon-orbits` | **certified existence + uniqueness** of Hénon periodic orbits | 228 theorems, calibrated against the closed-form fixed points |

## Next steps, in order

1. **Interval branch-and-bound for `henon-orbits`.** Today's orbit counts are
   LOWER BOUNDS — Newton found what twelve deterministic starts reached, and the
   family says so in its own REJECT text. Exhausting the phase space by interval
   exclusion turns "we certified 5 period-8 orbits" into "there are exactly N,
   certified". That is the RECORD-with-completeness shape that nobody publishes
   for non-SAT numerics, and it is the single highest-value build available.
2. **More Krawczyk families.** The instrument is general: any parameterised
   nonlinear system. Steady states of reaction-diffusion, roots of polynomial
   systems, periodic orbits of other maps. Each is one file.
3. **Do NOT go back to closed-form hunting over curated corpora.** OEIS was the
   right calibration target and the wrong discovery target, and the reason is
   structural and predictable in advance.

## The rule for changing front

A front is worth another run while the marginal run still moves one of two
numbers: **discovery yield** (new certified objects nobody holds) or **instrument
yield** (bugs found, capability gained). The OEIS run scored 0 discovery and high
instrument — three real bugs, including the engine refuting √2 as a closed form
for the decimal expansion of √2. The *next* OEIS run would have scored zero on
both. Estimate both before the run, from the structure of the corpus.

## Adding a family

One file in `families/`, six functions, no registration —
`enumerate(i)`, `value(obj)`, `interesting(obj,v)`, `certify(obj)`, `key(obj)`,
plus `name`/`statement`. `tools/run-engine.js` picks up every `.js` there.
The screen may only ever PRUNE; nothing is admitted without an exact certificate.

**Whatever you build, calibrate it against a case with a known answer, and give
it a red control that can actually fire.** Every real bug this project has found
was found that way, and none by reading code.

## The one rule

`/Users/carlostoledo/Documents/sin-mfg` is **read-only, permanently.** Read
anything — numbers, literature, instruments, records. Never edit a file, never
change the tree; find an error there and report it rather than repair it. That
lab pins evidence by path and sha256, so an edit demotes a certified claim.

Copies come out through `LIFT.json` → `PROVENANCE.json`; `make drift` re-hashes
both ends. Patches to lifted files are declared so they cannot be mistaken for
drift.
