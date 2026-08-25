# cert-machine — the conjecture engine

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
design/               tokens, components, template — every page is generated
tools/                run-engine · build-control · test-engine · lift
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
