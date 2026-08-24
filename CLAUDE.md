# CLAUDE.md — cert-machine

Read `CHARTER.md` first: one page, and it is the only doctrine here.
`PLAN.md` is the build plan and the ideas behind it.

**This repo has no gates.** Nothing blocks. If you are looking for permission, there isn't
any — read `CHARTER.md` §"The distinction" so you know which disciplines are load-bearing
(they are instruments, and turning one off is a recorded choice, not a forbidden one).

---

## THE ONE RULE — `sin-mfg` is read-only, permanently

**Owner ruling, 2026-08-24.** `/Users/carlostoledo/Documents/sin-mfg` is the source lab.

> **Read any file there, at any time, for insights, answers, numbers, research,
> literature, learnings, engine, instruments — anything. NEVER edit a file. NEVER change
> the tree.**

Reading needs no permission and no announcement. Grep it, mine its `brain/`, `ledger/`,
`missions/` and `research/probes/`, follow its records, take its measured numbers.

**Never:** edit, create, delete, move, `git add`/`commit`/`checkout`/`stash`, or change
that tree in any way — including a fix you are sure is right. **If you find an error there,
report it; do not repair it.**

Why the asymmetry is not fussiness: it is a live lab whose evidence pins files by **path and
sha256**. A run record names a kernel by path and hash, so editing or moving a pinned file
makes the pin resolve to nothing, fails the rung predicate, and **demotes a certified
claim** — and the record cannot be re-stamped to match without falsifying what the run was
performed against. A one-line edit does invisible, expensive damage. The owner also runs
sessions in that tree concurrently.

**How to take something:** copy outward through `LIFT.json`, which records the source path
and the source sha256 at lift time in `PROVENANCE.json`; `make drift` re-hashes both ends
and names what moved. Never symlink into the source, never write back. When a lifted file
needs changing, patch the **copy** and declare the patch in `LIFT.json` so it can never be
mistaken for drift.

This is the only rule in this repository that refuses anything, and it refuses in one
direction only: **outward is free, inward is closed.**

---

## Layout

```
machine/      the engine
  funnel/     generate -> validate -> score -> screen -> certify -> chained record -> board
              funnel.js (runner) · governor.js (budgets, the forced enum baseline)
              stats.js (provenance-at-write) · generators/{enum,evolve,searcher,llm}.js
              selftest/battery.js — 14 items, 19 red controls. THE gate on the machine itself
              skeleton/ — copy this to start a hunt
  detach/     long runs that survive the harness: nohup + checkpoint + resume + watch
instruments/  the certifiers, one per normal form, each with its own battery
  interval/   eqcert — certificate (falsifier-required) · interval · rational · radii ·
              sequence · transcendental
  trigmin/    certified global min of an integer-coefficient cosine polynomial
              (Chebyshev -> BigInt Sturm -> interval Newton -> exact Taylor enclosures)
  sos/        exact rational sum-of-squares certificates (stdlib fractions only)
atlas/        object family -> normal form -> which instrument certifies it -> what a HIT means
corpus/       harvested external claims waiting to be adjudicated
hunts/<slug>/ one campaign each: program.md · statement.json · target.js · battery.js ·
              run.js · experiments/ · best.json
  newman-mu/  Newman polynomials on the unit circle: certified min-modulus
              landscape by term count. Instrument: instruments/trigmin
board/        the cross-hunt leaderboard and the status ledger over external conjectures
notes/        append-only records. A record is never edited to match what happened next
tools/        lift.js — the copy-out + drift reporter
```

## Running

```bash
make selftest                  every battery, plus a list of what it does NOT cover
make hunts                     every hunt's battery (gates the hunt, not the campaign)
make fast                      the inner loop
make drift                     compare the lift against sin-mfg; reports, never blocks
make new-hunt SLUG=<name>      scaffold a hunt from the skeleton

node machine/funnel/funnel.js hunts/<slug> --seed s1 --generator enum|evolve|searcher
node machine/funnel/funnel.js hunts/<slug> --exhaust
node hunts/<slug>/run.js <phase>              a hunt's own pre-authorised budgets

# a long campaign that must survive this harness
node machine/detach/detach.js start <name> --dir hunts/<slug> -- node /abs/path/run.js complete
node machine/detach/detach.js watch <name> --dir hunts/<slug>
```

Zero dependencies: Node (>=18) and system `python3`. No npm install, no venv.

## Two things that will bite you if you don't know them

1. **`admitHit()` is the only writer of `best.json`,** and it re-verifies the certificate
   through `recheckCertificate` before admitting. A score never admits anything. If you
   write a target with no `recheckCertificate`, a sabotaged certifier is undetectable — the
   machine will say so at start.
2. **Every non-enum generator triggers an equal-budget enum baseline automatically,** in the
   same session, and both land in `session-<seed>.json`. There is no opt-out flag. This is
   the discipline that produced the parent lab's most useful measurement — dumb enumeration
   out-hit the live LLM 37:24 at equal budget — and it is the reason to trust any claim that
   an engine is working.

## The source lab

`/Users/carlostoledo/Documents/sin-mfg` — **read-only from here, permanently.** Read
anything; copy through `LIFT.json` so it is recorded; never write. `PROVENANCE.json` says
what came from where and whether it was patched on the way in.
