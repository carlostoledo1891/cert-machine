# SEND QUEUE — what is ready, what is held, and why

Built 2026-08-31. Standing rule: owned surfaces default-publish; **third-party
sends go on the operator's word only.** This file exists because the machine
has no send channel: there is no mail transport, no OEIS API, and no
erdosproblems account wired into this repo. `gh` IS authenticated
(carlostoledo1891, repo scope), so GitHub is the one channel that can be
driven from here.

Every artifact below was re-checked against today's records before being
placed in a lane. Nothing has been sent by this session.

---

## LANE 1 — READY, needs a human at a web form or a mail client

### 1a. OEIS: the #852 record extension  ← the freshest and the easiest
File: `outreach/oeis-erdos852h-extension.md`
Destination: oeis.org, one submission per affected sequence.

**Re-verified 2026-08-31, independently:**
```
node instruments/erdos852h/verify-record.js 263552821783 31
  prime 263552821783 · length 31 (exact — the next gap 4 repeats)
  spans 263552821783 .. 263552823109 · distinct 31 of 31
```
That verifier is a separate implementation from the scan that found the
record: deterministic Miller-Rabin in BigInt, next-prime by stepping, a set
for distinctness. It re-runs at every build of `reports/erdos852-h.html`.

The new record: **run length 31, opening prime 263552821783, index
10435962861.** A078515, A079007 and A079889 all stop short of it.

**Before submitting, one thing to confirm by eye, because this repo did not
re-derive it:** the pack maps the record onto each sequence as
A079007(31) = 263552821783, A078515 next term = 10435962861, A079889 next
term = 263552821783. Check each sequence's own offset and definition on its
OEIS page first — the scan reproduced every published term of all three
before extending them, which is strong evidence the mapping is right, but the
mapping itself is transcription and transcription is where this goes wrong.

**The caveat that must travel with the submission** (already in the pack, do
not drop it): the independent verifier certifies EXISTENCE — this prime opens
exactly 31 pairwise-distinct gaps. MINIMALITY, that this is the smallest such
index, rests on the exhaustive scan to 5e11, not on the verifier.

### 1b. KAUST — the MFG lab letter
File: `outreach/kaust-mfg-lab.md`. Email. Independent of every running
campaign, so it is ready whenever you are.

### 1c. ORCID, then a Zenodo DOI
File: `outreach/zenodo-plan.md`. Web, and strictly ordered: ORCID first, the
DOI second. Nothing else in this queue depends on it.

---

## LANE 2 — HELD ON MERIT, not on mechanics. Do not send yet.

Everything touching Erdős #290 is held because **the summit is mid-flight and
will change the exact numbers these drafts quote.** As of 2026-08-31 the six
detached shards are at l = 304, 305, 306, 307, 308, 309, closing on 310.

### 2a. The issue-164 follow-up  ← the one I could have posted, and did not
File: `outreach/erdos290-issue164.md`. Target:
`teorth/erdosproblems#164`, open since 2025-11-28, no replies since the
2026-08-04 comment. `gh` can post this today.

It is held because the draft says, in its own text:

> The third unconditional digit falls when the squeeze reaches l ≈ 310
> (even d up to ~620); that run is in progress.

Posting that sentence hours before the run delivers the digit it promises
buys one stale comment and forces a third. The draft's other headline numbers
— d ≤ 240 determined, tail assumption entering at even d ≥ 242, 110
conditional digits — are all superseded by the merge. **Send after the merge,
with the third digit in hand.** That is also what HANDOFF's standing
post-merge checklist says to do.

### 2b. The #290 OEIS packs
Files: `outreach/oeis-erdos290-pack.md`, `b-oeis-c0.txt`, `b-oeis-cstar.txt`,
`b-disc-fd.txt`, `b-disc-h.txt`. Same reason: the b-files are the enclosure,
and the enclosure is what the running campaign tightens. Regenerate after the
merge, then send.

---

## LANE 3 — already out, nothing to do

- **#852 correction** — PUBLIC; `tools/sweep-claims.js` reports the snapshot
  pinned and the watch closed.
- **#510 comment** (`outreach/erdos510-comment.md`) — submitted; still sitting
  in the erdosproblems moderation queue, which the sweep re-checks every run.

---

## NOT STAGED — named in the backlog, but no document exists yet

The arXiv #290 note, the oracle paper, the outside reruns, EmbraerX, and the
RM-group note are named in HANDOFF as intended sends. There is no draft for
any of them in `outreach/`. They are ideas, not artifacts, and should not be
counted as "staged but unsent".

**So the honest count is not "nine of eleven unsent".** Eleven destinations
are named; six have drafts that have never been sent; of those six, three are
ready now (1a, 1b, 1c) and three are held on merit until the #290 merge.
