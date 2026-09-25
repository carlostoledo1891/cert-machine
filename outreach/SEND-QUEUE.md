# SEND QUEUE — what is ready, what is held, and why

Built 2026-08-31, rewritten to drop the permission ceremony. This is a
READINESS LIST, not a request. It says what is ready, what it says, and where
it goes; sending is Carlos's call and needs no ritual from this file.

Mechanics, so nothing is mysterious: there is no mail transport, no OEIS API
and no erdosproblems account in this repo, so those are paste-by-hand. `gh` IS
authenticated (carlostoledo1891, repo scope), so GitHub can be driven from
here on request.

---

## LANE M — THE METR PLAN (2026-09-21): built as far as the world allows; the frontier runs are IN (2026-09-25); the hub push is DONE; three sends wait

### M1. The baseline recruiting message — DRAFTED, HELD (the operator sends, one per person)
File: `outreach/blind-spot-baselines-request-2026-09-21.md`. Five to ten people with a
digital-design background; the task list is `tasks` in environments/blind_spot/baselines.json
(18 ids, six per rung, seed 2027); returned attempts go in `attempts` and are graded by
`python3 environments/blind_spot/inspect/ledger.py --grade-baselines`. Without these rows
there is no time horizon (deliverable 2).

### M2. The hub push of the Inspect variant (blind-spot v0.1.1) — DONE 2026-09-25 15:17 -03, on the word
`prime env push --visibility PUBLIC` from environments/blind_spot; hub wheel sha256 5e73a299af18d268…; verified FROM THE
REGISTRY in a fresh venv from /tmp (load_environment exported, the Inspect task shipped, the 11 controls, an
`inspect eval` on the installed task, the verifiers binding building 3 train / 3 eval with disjoint seeds).
https://app.primeintellect.ai/dashboard/environments/carlos-toledo/blind-spot · `prime env install carlos-toledo/blind-spot`

### M3. The applications (Task Development Engineer, then MTS Evaluation Execution) — DRAFTED 2026-09-22, HELD
Files: `outreach/metr/resume.md` (one page; leads with the thesis and the three hub links; education and
prior employment are [OPERATOR FILLS] — nothing was invented), `outreach/metr/cover-task-development-
engineer.md` (deliverables 1, 3 and the time-horizon instrument, in the posting's own words),
`outreach/metr/cover-mts-evaluation-execution.md` (the calibration and the three-audience write-up; the
relocation/visa line is [OPERATOR FILLS]). The portfolio page /portfolio/ (built, gated on three ledgers)
is live. MAIN WAS PUSHED 2026-09-22 (72d2fd6..ff37f4e) on the operator's "fix now" when the return-levels
link 404ed for Pedro's message; every link in the three files now resolves (checked 200). Every figure in
the three files is a ledger field. Each application is a send, per role.

### M4. An issue on METR/eval-analysis-public — the TH1.1 fits certified — DRAFTED 2026-09-25, HELD
File: `outreach/metr-eval-analysis-issue-2026-09-25.md`. Every figure a field of certs/horizon-ledger.json
(44/44 certified; coefficients the rounding of the box for 22 of 23; the Mythos intercept 5.582 vs the box's
5.583; the doubling time 128.740 vs 128.744). Offers a `certify_fit` check for their pipeline. Posting it
before the applications puts the work in front of the exact team that reads them; `gh` can open it on the word.

### M3a. The Lever form answers — DRAFTED 2026-09-25, HELD
File: `outreach/metr/lever-answers.md`. The Task Dev form (fetched 2026-09-25) has no cover-letter field:
two free-text questions ("best evidence", "why METR"), a resume upload, four dropdowns. Both roles' answers
are drafted; the Eval Execution form as fetched showed only the timeline box, so its cover note goes as
page two of the resume PDF if the live form has no question. [OPERATOR FILLS]: work authorization, the
relocation dropdown, earliest start, the sharing consent, LinkedIn.

### M0. RESOLVED 2026-09-25: the Anthropic Console credit was topped up; the frontier campaign ran (environments/blind_spot/inspect/run_frontier.sh). The history: the credit
balance. `inspect eval …@blind_spot_located --model anthropic/claude-sonnet-5` reached the API
on 2026-09-21 and was refused before generation ("credit balance is too low"; nothing billed;
the attempt is in environments/blind_spot/inspect/logs/blocked/). The OAuth profile path works
under Inspect as `ANTHROPIC_AUTH_TOKEN=$(ant auth print-credentials --access-token)`.

## LANE 0 — ERDŐS #1 (2026-09-16): the comment is OUT and in moderation; the issue is next

### 0a. erdosproblems.com/1 comment — POSTED 2026-09-16 ~11:25 -03 by Carlos, awaiting moderator approval
File: `outreach/erdos1-forum-comment.md` (the site's own format; reviewed against its five rules, rule-1
disclosure in the text). `node tools/sweep-claims.js` reports when it is shown; then snapshot the thread.

### 0b. Issue on github.com/tadamcz/erdos1 — POSTED 2026-09-16 11:40 -03 as issue #2 (gh, on the word)
File: `outreach/erdos1-tadamcz-issue.md` holds the posted body. https://github.com/tadamcz/erdos1/issues/2

### 0c. Mathstodon — READY (495 characters), HELD until the forum comment is shown and the thread has looked
File: `outreach/erdos1-mastodon.md`. The site's advice page: no social-media announcement before
community assessment.

## READY NOW — paste-by-hand

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

### 5. Zenodo: the two port deposits — PARTIALLY DONE 2026-09-02
THE STAMP EXISTS. The current archive is v2026.09.1, DOI
10.5281/zenodo.22285003 (2026-09-03), under concept DOI
10.5281/zenodo.22225860 — the same concept as lambda(4)'s deposit, which
is archive version 1 of it rather than a separate record. v2026.09
(10.5281/zenodo.22257596) is SUPERSEDED and must not be cited. Every
deposit is recorded in corpus/zenodo.json and check-wiring gates
CITATION.cff against it, because CITATION.cff named v2026.09.1 while
carrying v2026.09's DOI for a day and a half and nothing caught it.
The site pages and the papers cite the CONCEPT DOI, which resolves to
the latest version and does not go stale. STILL OPTIONAL: the two standalone per-result deposits for
citation granularity — metadata in `outreach/zenodo-ports.md`, upload
bundles prebuilt in `outreach/zenodo-bundles/` (gitignored). Needs the
operator's account: the clicks, or a personal access token
(deposit:write + deposit:actions) for the machine to do it.

### 6. Verification invitations for both theorem programs (staged 2026-09-02)
Files: `outreach/ember-verification-invites.md` (Hatcher first; then
Judge/Mondal, Burdzy, de Dios Pont, the 2604.19003 group) and
`outreach/terra-verification-invites.md` (Cirant first; Cesaroni; KAUST —
supersedes-or-merges the older kaust-mfg-lab.md, do not send both).
Adversarial ask ("try to break it"), co-authorship only as the natural
close if engagement warrants. Each needs the operator's three opening
sentences, recipient choice, and a yes/no on the closing line. Every
claim in both letters is already on the released pages with its fences.
