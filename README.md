# The conjecture engine: a certification discipline for generated mathematics

*Carlos Toledo · cert-machine*

```
make engine    generate → screen → certify; writes ledger.json
make control   rebuild index.html from the ledger (runs every battery)
make test      every battery
make drift     re-hash the lifted instruments against the source lab
```

## The problem

Anything that generates mathematical claims at scale — a brute-force enumerator, a
heuristic search, or a language model — produces far more candidates than anyone can
check. The usual response is to lower the bar for "checked": match twenty decimal
digits, run a floating-point test, and argue from collision probability that the
result is almost certainly right. The Ramanujan Machine works this way, and so do
most "AI discovers formula" pipelines.

The trouble is that *almost certainly* has no composition rule. A pipeline built out of
almost-certain steps has an unknown error rate, and a screening step that can
introduce false positives is indistinguishable, from the outside, from a screening
step that cannot.

cert-machine takes the opposite bet. The engine may use floating point to *decide what
not to look at*, but it may never use floating point to *decide what is true*.
Every object that appears in the ledger carries an exact certificate: an interval
enclosure computed with directed rounding, or a decision made in exact rational
arithmetic. A refutation in the ledger is a proof, not an unlikelihood.

## The loop

The engine runs three stages over a *family* of objects:

1. **Generate.** Enumerate candidates from a parameter space. Cheap, unbounded,
   uninteresting on its own.
2. **Screen.** Evaluate each candidate in float and keep the ones that *look*
   interesting. This stage has one rule: it may only prune. A float screen that
   admits nothing false is impossible, so it is never allowed to admit anything.
3. **Certify.** For each survivor, produce an exact certificate or fail. Only
   certified objects enter the ledger.

Because the screen only prunes, the worst thing a bad screen can do is miss a
result. It cannot mint one. This asymmetry is what makes the loop safe to run at
scale without supervision.

A family plugs into the engine by supplying six functions —
`enumerate`, `value`, `interesting`, `certify`, `key`, `statement` — and
inherits the loop, the scaling, and the deduplication. Five families are currently
attached (Chowla cosine sets, Hénon periodic-point census, Hénon orbit boxes, Newman
polynomial minimum modulus, OEIS constants with candidate closed forms). None of
them is the point. The point is that a sixth can be attached without touching the
certification discipline.

## What a certificate is

For a real-valued quantity, a certificate is an interval `[lo, hi]` computed by
interval arithmetic with outward rounding, such that the true value provably lies
inside. Widths in the ledger are on the order of 1e-15 for polynomial and
trigonometric quantities and 1e-13 for Hénon orbit coordinates — but width is a
convenience, not the claim. The claim is containment.

For a counting question (how many period-*p* points does the Hénon map have at
these parameters?) the certificate is a set of uniqueness boxes covering every
fixed point of `H^p`, plus an interval-arithmetic exclusion of the rest of the
plane. The answer is an integer with width zero because it is not measured at all.

For a closed-form question, the certificate is *negative*: every candidate form in
a fixed vocabulary is evaluated exactly, and every one lying outside the enclosure
is refuted. Whatever survives is a candidate, explicitly labelled as such. The
engine does not claim a closed form. It claims that the alternatives are gone.

## Red controls

Every battery in the build carries *red controls*: inputs that must fail. A trig
minimum certifier ships with two objects whose claimed minimum is wrong; the Hénon
census ships with three parameter sets whose counts are known and one whose count is
deliberately misstated. The build is green only if every green control passes
**and every red control fires**.

This is the single most important habit in the project, and the cheapest. A
certifier that has never been shown a false claim is not known to reject false
claims; it is only known to accept true ones. Red controls are the difference
between "the tests pass" and "the instrument discriminates." Every battery in
the build carries them, and every real bug this project has found was found by
one — none by reading code.

## The frozen envelope

Some families define "interesting" relative to a moving bar — a Newman hit must
exceed the best certified minimum modulus for fewer terms. That bar is stored as a
set of *witness objects*, never as transcribed numbers, and every witness is
re-certified when the engine loads. The bar is then frozen for the duration of a
campaign. If it moved as hits arrived, a candidate's verdict would depend on the
order in which candidates were proposed, and the ledger would no longer be a
function of the parameter space.

A staleness audit at the end of each campaign reports whether any certified object
now sits above the envelope without having been adopted into it. The current
answer is *clean*; the audit exists so that a future *dirty* cannot go unnoticed.

## Provenance

The certifying instruments are lifted from a source lab that is mounted read-only
and never repaired in place. Each lifted file is hashed; the build reports how
many are unchanged, how many have moved or vanished at the source, and which were
patched on the way in, with each patch declared. The control page (`index.html`)
is itself generated from the ledger by the same build that executed the batteries,
so a number on the page and the run that produced it cannot drift apart.

## What this is not

Nothing in the ledger has been through a literature gate. Certified enclosures are
proofs *of the object* — this set has this merit, this polynomial has this minimum
modulus — pending independent verification of the instrument. They are not claims
of novelty, and several are certainly known. The value of the engine is not any
row in its tables; it is that every row means exactly one thing.

## Where it goes

The `sos · re-verify AI result` battery already does the thing this engine is for:
take a claim produced by a system that cannot be trusted, and decide it. The
natural next step is to make that the primary mode — a model proposes, the machine
certifies, and the ledger records how often the proposals were true. That is an
evaluation with a proof for ground truth. The companion harness
(`tools/llm-harness.py`) is a first cut at it: stdlib only, Fractions for every
decision, and it aborts if a deliberately false proposal is ever certified.

## Defects, found and fixed

Listed here because a write-up that hides them is the kind of document this
project exists to replace. Both of the following were caught by an outside
reader in under a minute, which is exactly the review this page invites.

- **Fixed.** The closed-form vocabulary contained unreduced fractions
  (`(2/1)·e`, `(4/2)·e`, …), so refutation counts were inflated by duplicates
  and one surviving value could appear as four candidates. Every vocabulary now
  emits reduced spellings only — a change that *deflated* the headline
  refutation count, which is the direction an honest fix moves it.
- **Fixed.** The `oeis-closedform` family once read the entry *name* only, and
  certified "Decimal expansion of 2*e" as a discovery because its regex missed
  the asterisk. The full OEIS record of every survivor is now fetched
  (`tools/confirm-survivors.js`), cached in the corpus, and fed back into
  `certify`: a survivor whose record states its form is a REJECT ("screen
  escape, not a discovery"), and a survivor whose record has not been fetched
  is an open candidate, never a hit. The battery pins A019762 as a permanent
  regression control.
- **Open.** No certificate is yet exportable to an independent checker. The
  `detach` battery is the seed of one.
