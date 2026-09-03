# POSITIONING — the decisions, 2026-09-03

Input: `notes/positioning-brainstorm-2026-09-03.md` (operator note, pinned verbatim).
This file is the DISCUSSION: seven decisions, each with the measured fact behind it,
the options, a recommendation, and the exact TODO delta it produces. Nothing here is
built until the operator rules. Decide these first; then the menu at the top of
HANDOFF.md is rewritten in the same commit (CLAUDE.md rule).

Everything below marked MEASURED was checked in this session against the files, not
recalled.

---

## RULINGS — 2026-09-03

The operator's instruction was *"do the changes you suggest and decide the options by
keeping us honest."* Decided and shipped in the same session, in this order:

| # | Ruling | State |
|---|---|---|
| D1 | Adopt the WIDENED sentence (option b), stamp it in all six places at once | **DONE** — one operator action owed (Zenodo metadata title) |
| D2 | Relabel the tile; build `reports/refusals.html`, by kind, no total. The note's "fold NEEDS DATA in" **declined** | **DONE** |
| D3 | Calibration sentence verbatim; LEAD reordered so the catches lead | **DONE** |
| D4 | Independence restated as independence **from the claimant**, with the two reuses disclosed in the limits section | **DONE** |
| D5 | Intake **not built**; the build/send line ruled: *publishing a decision on our own site is a build; posting it into someone else's thread, repo or inbox is a send* | **RULED, QUEUED** |
| D6 | Monthly ledger adopted, first instance end of September 2026 | **QUEUED** |
| D7 | λ(5) shipped under the calibration framing; grader-benchmark aggregate queued | **DONE / QUEUED** |

**Where I went against the note, and why.**

1. **The name is wider than the note asked for.** The note wanted *"AI-generated
   mathematical claims."* Under that name λ(4), λ(5), Erdős #1038 (both ends), #290,
   K(11) ≥ 604 and the terra/MFG theorems — most of the site's weight — read as
   off-topic. "Machine-generated mathematics" keeps the category, keeps the moat
   (independence), and still excludes "generator" from the title.

2. **NEEDS DATA is not folded into the refusal counter.** The note offered that as
   one of two fixes. It would inflate one number by merging two different
   measurements — NEEDS DATA measures the claimant's opacity, REFUSED measures our
   instrument's reach — and it contradicts both the three-valued doctrine and the
   deflate-to-truth counting rule. The refusals page keeps the kinds apart and has no
   total at all.

3. **The rate the note asked for existed already, in a record nobody was reading.**
   "A verifier's refusal rate is a headline number" — it is 13%, 39 of 301 submitted
   claims on the matmul eval board. Model declines (23) and replies cut off by our own
   output cap (40) are excluded from both the numerator and the denominator, because
   neither is our refusal.

4. **One finding the note did not have (D4).** Two instruments reuse code across the
   producer/checker line. Both are ours and both are deliberate, so independence
   *from the claimant* holds — but "no shared code," unqualified, is checkable and
   would not have survived the check. It is now stated precisely and disclosed where
   the trust base is stated.

**Also shipped this session, from item 1 of the menu rather than the note:** λ(5) is
published, and with it a new instrument (`instruments/trigmin/minpoly.js`) that turns a
certified enclosure into an exact minimal polynomial. λ(5) is algebraic of degree
exactly 5. And the non-monotonicity λ(6) < λ(5) turns out to need no λ(6) proof at all —
λ(n) is an infimum over n-sets, so the witness set {1,2,4,6,7,8} plus the proved λ(5) is
the whole argument.


---

## D1 · The name — one sentence, or the three we ship today

MEASURED. We currently ship THREE different names, simultaneously:

| Where | Name |
|---|---|
| `site/index.html` `<title>` (the public landing page) | cert-machine · **the conjecture engine** |
| `README.md` H1 (the repo face) | **The conjecture engine — AI verification infrastructure for machine-generated mathematics** |
| `CITATION.cff` + `.zenodo.json` (the MINTED DOI, v2026.09.1) | cert-machine: **verification layers for AI-scale mathematical search** (certified audits, proof-grounded evals, verified reward channels) |
| `CLAUDE.md` line 1 (our own constitution) | cert-machine — **the conjecture engine** |

The note's diagnosis is not a matter of taste — it is a fact on disk. A reader who
follows a citation to the DOI, then to the repo, then to the site, meets three
descriptions of three different products.

**Options**

- **(a) Adopt the note's sentence verbatim.** *Independent certification of
  AI-generated mathematical claims — exact arithmetic, no shared code, refusal as a
  verdict.* Sharpest, and it names the empty square. Cost: it describes the audit
  half only. λ(4)/λ(5)/λ(6), Erdős #1038 both ends, #290, kissing K(11) ≥ 604, the
  terra/MFG theorems are OUR OWN mathematics, not audits of AI claims — under (a)
  the heaviest results on the site read as off-topic.
- **(b) Same category, widened object.** *Independent exact certification of
  machine-generated mathematics — a verdict, or a stated refusal.* Keeps "independent
  certification" as the category and the moat, keeps every existing result on-topic,
  and still excludes "generator". Loses a little of the AI-claims edge, which is
  recovered by move 2 (lead with the catches) rather than by the title.
- **(c) Keep the current title; add only the calibration sentence (D3).** Zero cost,
  and the three-name problem stays.

**Recommendation: (b), stamped ONCE, at the next release.** The DOI title is minted;
changing it means the concept DOI carries two titles. That is acceptable exactly
once, and is an argument for deciding now rather than in three weeks. If (b) is
chosen, the same string goes into: site title + og/twitter meta, README H1,
CITATION.cff, `.zenodo.json`, CLAUDE.md line 1, HANDOFF header — one commit, no
partial rename.

**TODO delta:** new task "RENAME, one string, six files, at the next release tag."

---

## D2 · The refusal counter — what it actually counts

MEASURED, and the note's instinct is right for a reason it does not state.

`REFUSED · HONEST: 1` is computed at `tools/machine-figure.js:39` as
`sum(families[].counts.refused)` over `ledger.json`. The single refusal is
**keller-fibers**, against 16,943 certified decisions (2,274 hits, 14,668 rejects).
So the tile is CORRECT and NARROW: it counts refusals **inside the enumerate → screen
→ certify loop only**. It is not, and has never been, a count of the project's
refusals.

The project's real refusals exist, are load-bearing, and are counted NOWHERE:

- `certs/kissing-ledger.json` — 11 rows: 9 CERTIFIED, **1 NEEDS DATA** (the headline
  604, the row the einstein-arena issue exists to fill), 1 QUEUED.
- `certs/mfg2p-regime-map.json` — 21,567 cells: 24 UNIQUE, 11,628 MULTIPLE,
  **9,915 UNDECIDED** (already drawn hatched on the terra atlas).
- `certs/ai-claims-summary.json` — 6 lanes: 5 CONFIRMED, **1 PARTIAL**, and every
  single lane carries an explicit scope limit ("the computational fragment",
  "at ε = 1/6 only", "the numerical criterion"). Six stated refusals of scope.
- Erdős #1038 supremum — **degree 9 attempted and recorded open** (box budget), in
  the live comment on teorth/erdosproblems#179.
- λ(6) — one family unresolved after 49.8 h and still running.

**Options**

- **(a) Relabel + build the refusal ledger.** Rename the tile to what it measures
  (ENGINE REFUSALS · 1 of 16,943) and add `reports/refusals.html`: every refusal in
  the project, **by kind, never merged** — REFUSED (instrument declined), NEEDS DATA
  (claimant opacity), OPEN (budget exhausted, recorded), UNDECIDED (cells) — each row
  pointing at its record, rebuilt from records at every build like any audit page.
- **(b) Relabel only.** Honest, cheap, and leaves the corpus invisible.
- **(c) Fold NEEDS DATA and PARTIAL into the REFUSED number, as the note suggests.**
  **Recommend against.** It contradicts the three-valued doctrine in CLAUDE.md
  (NEEDS DATA measures claim-maker opacity; REFUSED measures our instrument's reach)
  and the counting rule ("dedupe and deflate to truth"). One inflated counter would
  cost more than the whole page gains.

**Recommendation: (a).** It is the cheapest credibility fix available (roughly half a
session), it is a MEASUREMENT rather than a slogan, and a refusal ledger is a house
form — an audit page that re-derives its own numbers. The note is right that a
verifier's refusal rate is a headline number; we should publish it as a rate with a
denominator, per kind.

**TODO delta:** new task "reports/refusals.html + tile relabel", NEXT SESSION tier.

---

## D3 · The calibration sentence

The site's `<h2>Two theorems and two audits, in plain words` is a prover's credential.
The note's fix is one sentence, not a rewrite:

> *Only a machine that can prove a theorem should be trusted to refuse one.*

**Recommendation: yes, as written.** It costs one paragraph, contradicts nothing,
and it is the sentence that makes λ(5) — publishing today — land as calibration
rather than as a competing headline. Site push, not a send.

**TODO delta:** folded into whatever site build runs next; no separate task.

---

## D4 · "No shared code" needs a definition before it goes in a title

FINDING, ours, not in the note. §2c says *"Never runs the authors' code. Auditor
shares no code with prover."* Two flagship results reuse code across the
producer/checker line — **our own code, in both cases**:

- `instruments/mfgcap` **imports** the frozen published `reports/verify_congest.py`
  and extends it (deliberately: the frozen bytes are re-extracted from the sent
  page at every build, and importing rather than editing is what keeps them frozen).
- `instruments/lemniscate` was crossed from the operator's own bench with sha, and
  its require paths were repointed at `instruments/interval` — the certifier the
  bench already used, byte-identical on four files.

Independence from the **claimant** holds in both cases, and that is the claim that
matters. But an unqualified "no shared code" is checkable and would not survive the
check. The precise form: **shares no code with the claimant; every certificate
re-runs on stock Python with no engine present.**

**Recommendation:** adopt the precise wording wherever the phrase appears, and state
the mfgcap/lemniscate reuse in the limits section — which §6 says to protect, and
which is exactly where a disclosure like this belongs. Cheap, and it removes the one
sentence in the positioning an adversary could break.

**TODO delta:** one line in the limits section + the rename string (D1).

---

## D5 · Intake — the queue, and the governance question under it

The note's move 6 is the largest build in it. MEASURED: `oracle/` is today a Python
library + `tool-definition.json` + a battery — a thing you download, exactly as the
note says. `site/oracle/index.html` is its page.

**Options**

- **(a) GitHub-native intake.** An issue template on cert-machine ("submit a claim"),
  labels for the three verdicts, and a public decided-claims ledger page generated
  from the issues. No server, no new hosting surface, and it fits "every page is born
  from a record".
- **(b) A real endpoint** (Vercel function + form + queue). Heavier; adds a moderation
  and abuse surface to a static site.
- **(c) Not now.**

**The governance question, which matters more than the mechanism:** intake creates an
obligation to answer, and under our standing rule every outward-facing act is
operator-gated. A queue whose every reply waits for a gate will read as abandoned.
So (a) or (b) requires a ruling: **is publishing a certificate page for a submitted
claim a SEND?** Suggested line — *publishing a decision on our own site is a build;
posting it into someone else's thread, repo or inbox is a send.* Without that ruling
I would not start either.

**Recommendation:** (a), and only after the ruling. It is 1–2 sessions.

**TODO delta:** operator ruling first ("is a decision page a send?"), then a queued
build.

---

## D6 · Cadence — the monthly ledger

*Claims decided, September 2026.* Nearly free for us: every number on the site
already regenerates from records, so the page is a dated diff of the ledger and the
certs. The obligation is monthly, not the build.

**Recommendation: yes, starting with September 2026**, published as a page. Note the
seam: the PAGE is a build; ANNOUNCING it anywhere is a send.

**TODO delta:** new recurring task, first instance end of September.

---

## D7 · Sequence — what the note reorders in the standing menu

The note's §7 sequence collides with the menu in exactly two places, and agrees with
it everywhere else.

- **λ(5), today's task 1.** The note says λ(5)/λ(6) belong in an arXiv note "not on
  the front page competing with the position". That does NOT block today's build:
  the record is complete (8/8 families) and has no page, which is an inconsistency
  regardless of positioning. **Proceed — and place it under the calibration framing
  (D3) rather than as a headline.** The paper's shape still waits on λ(6).
- **The catches should lead.** Moving "we checked the AI's homework", the #852
  correction and the answer-key bug above the theorem programs on the landing page is
  a layout decision, not a rewrite, and it is the note's move 2. Recommend doing it in
  the same site build as D2/D3.
- **The grader benchmark** (§7, "2 months") is closer than the note thinks: we already
  hold `reports/answer-key.html`, `reports/matmul-eval.html`, `reports/rm-audit.html`
  and `certs/ai-claims-summary.json`. What is missing is the AGGREGATE — error rate
  per source, one table. That is a smaller build than "2 months" implies and it is the
  natural companion to the refusal ledger (D2).

**Unchanged by the note:** λ(6) folding, the covering producer patches, the #1038
supremum paper, the terra remnants, the markdown→LaTeX crossings. Positioning work is
site-and-string work; it does not consume the math queue.

---

## Menu corrections found while checking (independent of the decisions above)

- **Operator item 8(b) is DONE.** `reports/erdos290.html` already carries §3b
  "superseded, and why it is kept" and cites van Doorn arXiv:2609.00104 six times;
  the two-sided Theorem-8 reading is explicitly marked history. Only 8(a) — the
  follow-up comment on issue 164 — and the optional ai-claims row remain, and 8(a) is
  a SEND.
- **No reply anywhere.** teorth/erdosproblems#179: our two comments are the last
  words, no maintainer or Tao response. #392: 0 comments. vinid/einstein-arena#64:
  0 comments. Nothing outranks this session.
- **λ(6) is deep, not stuck.** PID 72893 at 49h 46m on a+2e = 2f, log 0 bytes (normal).
  The traced twin in `scratchpad/l6trace` reached node 119 by 12:20 with 25-minute
  gaps between single nodes — the search is advancing, slowly, at the expected shape.
- **The gates are clean.** `sweep-claims`: no findings. `check-stale-claims`: 2 pairs
  examined, 0 stale (one passes only on an acknowledging phrase, no source recorded to
  demand — worth pinning a source for that pair).
