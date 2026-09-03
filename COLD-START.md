cert-machine — cold start. READ FIRST, BUILD SECOND.

Working dir: /Users/carlostoledo/Documents/cert-machine
Read CLAUDE.md and HANDOFF.md; both current. For the tip, run
`git log --oneline -1` — a hash written into this file would name the commit
before the one that carries it, so it is deliberately not stamped here.

STATE YOU INHERIT: THE SITE IS LIVE AND RE-DOI-STAMPED. Released
v2026.09.1, DOI 10.5281/zenodo.22285003 (concept 10.5281/zenodo.22225860).
Live at carlostoledo.co: the hot-spots theorem is now a POSITIVE-MEASURE
FAMILY (c in [0.845, 0.85]); Erdős #1038 has a certified unconditional
bracket 1.828 <= inf <= 1.8344304971959906; the kissing ledger certifies
K(11) >= 604. PAPERS ARE LATEX NOW (paper/tex/, `make papers`, tectonic)
with the author line and AI disclosure FILLED — venue, ORCID and the
submit decisions are still the operator's. 55/55 batteries.

TWO SENDS ARE OUT: teorth/erdosproblems#179 (LIVE) and the erdosproblems
forum thread 1038 (posted, was in moderation). A MAINTAINER OR TAO REPLY
OUTRANKS EVERYTHING — report and pause before acting on one.

FIRST ACTION:  node tools/sweep-claims.js && node tools/check-stale-claims.js
  The second is new: it catches OUR pages going stale against literature
  already logged (it caught reports/erdos290.html doing exactly that).
SECOND ACTION: node tools/targets.js   (28 rows)
THIRD ACTION:  the lambda(6) run, BEFORE anything else long-running:
  `ps -p 72893 -o pid,%cpu,etime` and
  `cat '/private/tmp/claude-501/-Users-carlostoledo-Documents-cert-machine/776c9149-d43e-4dae-b0b0-451991a0bdcd/scratchpad/a2e.log'`
  (a+2e = 2f, the last of ten families; ~49.5 h at handoff, log 0 bytes
  until the verdict, which is normal). A TRACED TWIN runs the same family
  in an isolated git worktree (scratchpad/l6trace) and is the clean read
  on whether the original is deep or stuck — see HANDOFF.
FOURTH ACTION: gh issue view 179 --repo teorth/erdosproblems --comments
  (and 392, 164). Then read the MENU at the top of HANDOFF.md.

YOUR TASK THIS SESSION — TWO THINGS, IN THIS ORDER:

1. PUBLISH LAMBDA(5). It is COMPLETE — all eight families closed in
   certs/lambda56-campaign.json — and it has NO PAGE AND NO PAPER. We
   publish reports/lambda4.html for the third exact value of Chowla's
   cosine dip while the fourth sits finished and invisible. Build the
   page from the record the way build-report-lambda4.js does, with its
   own gates. NOTE THE SHAPE DECISION: if lambda(6) lands, lambda(4),
   (5) and (6) become ONE non-monotonicity paper (Mercer conjectured
   lambda(6) < lambda(5); that is what the campaign is for) — so publish
   the lambda(5) PAGE now and hold the paper's shape until the run
   resolves.

2. REVIEW THE BENCH AGAIN — ALL FOLDERS AND ALL PAGES — for valuable
   mathematics, instruments, claims and narrative. /Users/carlostoledo/
   Documents/frontier-apps. Read-write-safe, it is the operator's own
   sandbox, and everything there will be published. Look at experiments/
   (16 dirs), site/, drafts/, oss/, out/, lib/, and the root docs
   (FRONTS, NOVELTY, PARKED, PORTFOLIO, LIFTS, FLEX, HOTSPOTS). Known
   already, do not re-derive: ember/BAND (PORTED), erdos1038 (PORTED),
   terra family (PORTED), kissing11 (we built our own ledger). KNOWN AND
   UNPORTED: experiments/envs — "a certified enclosure is a CANARY
   FACTORY" (if q is certified to width 4e-13 and a grader accepts
   anything within 1e-9, every value in the surrounding band is provably
   NOT q AND passes that grader, so adversarial submissions are minted
   without limit from certificates we already hold; it carries its own
   honesty rule and throws rather than degrade). The operator has said
   envs is NOT the current focus but it is the strongest unported idea
   there. NEW SINCE THE LAST SURVEY: experiments/kissing12 (probe-d12.py,
   relax.py, k12lib.py, data/) — an active probe, no theorem doc yet;
   leave it until it produces one, the way ember/BAND did.

STANDING CONTEXT (details in HANDOFF):
  · ALL SENDS ARE OPERATOR-GATED. Staged and unsent: the issue-164
    follow-up on #290, two verification-invitation letters (now stronger
    as a FAMILY — both carry a band banner), the formal-conjectures issue.
  · PAPERS ARE LATEX; PAGES stay in the house design system. `make
    papers` builds all; the compiler REFUSES a paper still containing
    [OPERATOR]/TODO/XXX. Still markdown: lambda4-proof.md,
    terra-peaks.md. Four bench .tex remain crossable (terra, terra-cap,
    terra-faces, terra-attn, mfg-terra).
  · PAPERS FOR THEOREMS, PAGES FOR AUDITS — an audit page re-runs its own
    numbers at every build, which is the better artifact; keller,
    rm-audit and erdos852 do not want papers.
  · instruments/covering is ONE module with four consumers (1D ladders +
    2D area accounting). Two producers still owe it their pieces:
    mfg-regime-map and terra-bracket-table emit no cell/row list, so
    neither is auditable yet — the same one-line patch family.js got.
  · Honest framing travels everywhere: "to our knowledge" + the fence
    list on every first-claim; de Dios Pont (2412.06344) is a
    COUNTEREXAMPLE, never a proven class. Race watch: arXiv, weekly.
  · sin-mfg remains READ-ONLY, permanently. frontier-apps is a
    publication-bound sandbox and NOT a lift source; crossings are
    copy-with-sha of the operator's own work.
