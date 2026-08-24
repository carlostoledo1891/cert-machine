# CHARTER — what this place is, and the one rule it has

**cert-machine is the novelty-driven half.** Its parent lab, `sin-mfg`, is a verification
house: it can certify anything it is pointed at, and it grew a permission layer that decides
what may be pointed at, what may ship, and who may write it down. That layer was earned —
every rule in it has an incident behind it — and it is exactly what makes chasing novelty
expensive there.

Here the instruments are the same and the permissions are gone.

## The distinction

> **A lock says what you may do. An instrument says what is true.**

Everything that refused a *direction* was left behind. Everything that measures a *fact* was
kept, because without it a discovery is a number that came out small, and that is the one
thing this house has never shipped.

**Kept, and each is code, not prose:** a Certificate that cannot be constructed without a
falsifier · red controls (a check nobody has seen go red is decoration) · independent
recompute before any admission · planted-hit recall and a measured reject-audit rate ·
the score battery (a score is untrusted until known-bad ranks low and inflation cannot move
it) · the harness sha on every record · hash-chained, tamper-evident run logs · the forced
equal-budget dumb baseline · two counters with their definitions attached · quantifier shape
(a HIT carries a witness; a RECORD names its box) · provenance at write.

**Left behind:** the publish gate and every WITHHOLD · the IP manifest · the page registry
and its default-deny · the literature gate as a veto · the ladder as a permission · role
monopolies · missions, MSN ids, handoff ritual · pre-push hooks, CI, and sixty-odd `check-*`
targets · the probe time-box · the whole-tree copy police.

## The release valve

> **Everything can be turned off. Nothing can be turned off silently.**

Every discipline above is a run option with a default. Flip any of them and the chained
record says you flipped it, on the line next to the result. No gate ever asks permission;
the record never forgets. That is the entire governance model — there is no other.

## The two things that still block

Both are about irreversibility, and neither is about your work.

**1 · Nothing may leave this repository under an external identifier** — a DOI, an OEIS
submission, an arXiv post, an email, a PR — without you saying so in that session. That is
not a lock on research; it is a lock on *sending*, and publication is the only action here
that cannot be undone.

**2 · `sin-mfg` is read-only, permanently** *(owner ruling, 2026-08-24)*. Read any file
there at any time — insights, numbers, research, literature, learnings, engine, instruments
— freely and without asking. **Never edit a file. Never change the tree.** Not a fix, not a
format, not a `git add`. Find an error there and you report it; you do not repair it.

That lab's evidence pins files by path and sha256, so an edit or a move makes a pin resolve
to nothing and **demotes a certified claim**, and the record cannot be re-stamped without
falsifying what the run was performed against. The damage is invisible and expensive, which
is exactly the kind of thing a rule is for. **Outward is free; inward is closed.**

Everything else reports.

## What a hunt is

A directory under `hunts/`. It owns a `target.js` (the problem adapter), a `program.md` (the
briefing, read by people, loaded by no code), its `experiments/` records and its `best.json`
board. The machine runs it; the machine writes nothing outside it; generators run inside a
`vm` fence and cannot write at all.

A hunt does not ask to exist and does not ask to stop.

## Where novelty is supposed to come from

The parent lab measured its own frontier and wrote it down: *"box placement dominated engine
choice"* and *"the machine can certify anything it is pointed at — point it with the same
rigor it verifies with."* Three campaigns, three engines, and the finding was that **aim beat
search**. So the work here is aim: what to point at, chosen and scored and measured with the
same discipline the certifier gets. The literature read is not a gate at the end; it is a
score at the front. See `PLAN.md` §4.

## Provenance

`LIFT.json` declares what was copied out of `sin-mfg`; `PROVENANCE.json` records every file's
source path, the source sha256 at lift time, and the local sha256 after any declared patch.
`make drift` re-hashes both ends and names what moved. **The source lab is read-only from
here, permanently.** Nothing in this repository writes to it.
