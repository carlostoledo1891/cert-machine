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

## LANE 2 — the #290 hold is RELEASED (2026-08-31)

The summit finished: six shards closed l = 293..310, the main record holds
250 degrees closed and 0 open, l = 61..310 contiguous. Everything that was
held for it is now current.

### 2a. The issue-164 follow-up — READY, and `gh` can post it
File: `outreach/erdos290-issue164.md`, rewritten against the new horizon.
Target: `teorth/erdosproblems#164`, open since 2025-11-28, no replies since
the 2026-08-04 comment.

It was held because its own text promised a third unconditional digit "when
the squeeze reaches l ≈ 310". **That digit landed:**

    unconditional  c       ∈ [0.830416407911, 0.831220912621]
    unconditional 1/(1+c)  ∈ [0.546083759260, 0.546323774021]

0.546 is pinned with NO assumption, where the previous horizon pinned only
0.54. The tail hypothesis now enters at l = 311 (even d ≥ 622), was 242.
This is the strongest send in the queue and the only one where a specific
person asked a specific question and is still waiting.

### 2b. The #290 OEIS packs — READY, packs 4 and 5 now filled
`outreach/oeis-erdos290-pack.md`. Packs 4 and 5 were STAGED against exactly
one condition — "awaits the l ≈ 310 campaign, first three digits
unconditional" — and that condition is now MET. Both are filled with real
numbers: 110 terms each from `b-oeis-c0.txt` and `b-oeis-cstar.txt`, the
unconditional intervals, the assumption, and quantified failure semantics so
an entry can be amended rather than retracted.

PACK 4 is the one **W. van Doorn asked for by name** — he is the author of
arXiv:2411.03073 and wrote "I think it would be worthwhile to add the decimal
expansion of c_0 to the OEIS". Send order: packs 1-3 (campaign-independent)
any time, then 4, then 5.

One editor question is pre-answered in the file: if an editor objects to a
conditional constant, offer the 3-digit unconditional sequence instead and
let them choose. Do not argue for the long one.

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
