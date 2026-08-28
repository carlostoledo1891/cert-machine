# HANDOFF — cert-machine

## What it is

A conjecture engine: generate mathematical objects at scale, screen in float,
**certify the survivors exactly**, and hunt closed forms for what survives.
Interval enclosures and exact rational decisions — a REFUTED here is proved.

```
make engine    generate → screen → certify; writes ledger.json   (~4 min)
make control   rebuild index.html from the ledger                (~40 s, runs batteries)
make test      every battery
make drift     re-hash the lift against the source lab
```

## TASKS BACKLOG — the standing menu (updated 2026-08-27 late night)

Kept current at every handoff; a session that changes any task's state
updates this menu in the same commit (CLAUDE.md rule). Grouped by who acts.

STATE OF RECORD (refreshed 2026-08-27, end of the foundations+
prediction+oracle session; full histories live in apps/skyaudit/TODO.md
and the session entries below — this block holds only what stands):

  SKYAUDIT — TWO CITY PACKS LIVE, methodology v2, 4-day pinned series.
  NYC flagship /apps/skyaudit/: Wed 2026-08-26, 82 aircraft / 382
  flights / 3,056 rows; 100 E-FLYABLE (26.2%), fleet EXACTLY 10;
  floors 267/309/318/304 kWh; reserve price 215/195/153/100/14/0
  (30-min = ZERO provable); electric bill $290–2,056 vs $3,966–9,902
  disjoint; Joby/Archer/Eve 0 provable; Archer guarantee undecidable.
  SP pack /apps/skyaudit/sp/ under ANAC RBAC 91.151(b) (pinned,
  quoted): 59/148 E-FLYABLE (40%); REH corridor planner; Eve flip
  threshold leads (253 kWh). v2 series: Sun 38 (21.7%) · Mon 127
  (32%) · Tue 106 (28.1%) · Wed 100 (26.2%) — weekday cluster holds.
  Registry joins (FAA+ANAC, union of days, membership on authority);
  companion note reports/skyaudit.html (day-stability §7, v2 delta
  disclosed §6); ingest-day.js = one-command day ingest; battery
  33/33, 11 build gates, make test 31/31.

  THE PREDICTION PROGRAM — instruments/forecast/ (conformal coverage
  as counting theorem + append-only exact-scored commit/score ledger
  + NEW admission.js: the prune rule computed as an exact binomial
  tail at a stated 1/20 bar; battery now 7 checks + 5 reds) ·
  SkyForecast v1 card live (dashed, never verdict-styled; gate 11) ·
  product ledger 8 commits: 08-28 v1 pair (disclosure recorded — WILL
  BUST on eflyable, score it and state the cause), 08-31 v2 pair,
  09-01 + 09-02 pairs at n=4 coverage 3/5 ([191,397]/[49,127] — the
  Thu volume drop honestly widened the intervals). Day series now
  FIVE days: + Thu 2026-08-27 ingested green, 49 E-FLYABLE (25.7% —
  the weekday RATE cluster holds at half the volume).
  THE FORECAST GYM (8E) — BUILT 2026-08-28 (operator's word "build
  what's missing"): tools/forecast-gym.js (three house proposers —
  conformal claims only its theorem; persistence the forced dumb
  baseline built to be pruned in public; range the hedger — commits
  refused for DEADMITTED proposers) + certs/forecast-gym-ledger.jsonl
  (32 commits sha-pinned before their targets, 6 target days, 0
  scored yet — first scoring 08-29 when 08-28 releases) +
  reports/forecast-gym.html (gates: battery + BOTH ledgers re-verified
  with the builder's own arithmetic — payload shas re-hashed, every
  Winkler recounted string-exact, commit-before/score-after re-checked
  — + admission board recomputed). Thesis on the page: the future is
  the only test set that cannot leak. Model campaigns enter SEALED
  (sha public, payload revealed at scoring), spend on the word.
  Doctrine: prediction enters as a proposer only (CLAUDE.md).

  THE ORACLE — packaged AND doored: oracle/certmachine.py (red
  controls at import, Q+F2, exact mechanisms; harness imports the one
  definition), /oracle/ front door live (60-second curl->certify()
  path, shared gated paste box with the board, evidence links),
  paper/verified-reward-oracle.md DRAFT (not submitted). DOOR UPGRADED
  2026-08-28 (operator's word "use what survives", from an outside
  draft fact-checked against the ledgers): §3 lab framing (every
  reward hack is a verifier defect), §4 Monday uses (audit/evaluate/
  train), §5 THE LADDER with open rungs — all counts recomputed from
  the eval ledger; a certified rank-6 row refuses the build; the
  seed-pinned conjugation rung named "next, unbuilt" on record —
  §6 the loop stated honestly (3 closed all first-round, no
  feedback-driven conversion yet), §7 scope + the Lean exit, §9
  trust base + the EXTERNAL-RERUN REGISTRY read from
  corpus/external-reruns.json (empty until it isn't). The outside
  draft's "measurable improvement" loop claim was REFUTED by our own
  loop ledger and replaced with the honest statement.

ACTIVE NEXT (operator to choose; nothing pre-authorized):
  A. HARBORPROOF build — scouted GO (see O2): FuelEU exact penalty
     formula in its first live year + Danish Maritime Authority free
     bulk AIS. The next big observatory.
  B. 8E THE FORECAST GYM — BUILT 2026-08-28 + CAMPAIGN v1 COMMITTED
     the same night (operator's word "Proceed 1"): opus-5 (claim 4/5,
     wide, forecasts the weekend drop), sonnet-5 (claim 4/5), haiku-4.5
     (claim 5/6, NARROW — the overconfidence signature the admission
     rule will test). 36 model commits + 32 house = 68 on the ledger,
     0 scored; scoring lands with 8D daily. Sonnet's first 3 attempts
     returned empty text at max_tokens 2048 — the documented
     thinking-exhaustion HARNESS artifact, fixed at the cause (8192)
     and retried BEFORE anything was pushed (copy-honesty intact).
     Remaining gym moves: more packs · third-party sealed entries.
  C. 8C-full — certified-universal-over-forecast-envelope fleet
     statements; BLOCKED on the parked scenario packs.
  WAITING ON DATA (automatic): 8D — when adsb.lol releases a day D:
     node audit/ingest-day.js D && node audit/forecast.js score D &&
     node tools/forecast-gym.js score D, then COMMIT FORWARD (product
     + gym) for the next uncommitted days — the ledger ages only if
     fed daily. For 2026-08-28 specifically: the v1-calibrated
     eflyable commit will bust against the v2 outcome; score it, keep
     it, state the cause (disclosure text in TODO 8D).
  HELD/PARKED: synthetic demand packs · outreach on the word only.
  Spec: APP.md · plan: TODO.md · research: RESEARCH.md.

AGENT, ON THE OPERATOR'S WORD (spend/scope) — ranked:
 1. LRCAP CERTIFIED AUCTION ARITHMETIC — PERISHABLE. Fetch ANEEL CP
    22/2026 edital drafts; exact-rational dominance thresholds (β=0.9
    locational bonus × two-product Dec 2/4 sequencing × content premium).
    Clock: CP closes Sep 14; hearing Sep 1; auctions Dec 2/4. Public data
    only. First-of-kind (frontier scan verified: no public model exists).
 2. AEROELASTIC LCO ENCLOSURE — the flagship world-first: radii-polynomial
    enclosure of the 2-DOF pitch-plunge limit cycle + certified flutter
    interval (sequence.js + radii.js are the instruments; whirl-flutter
    ROM as sequel; NASA TRAST is the live hook). Its own session.
 3. PERFECT-FORESIGHT REVENUE AUDITOR — exact LP-duality ceiling on
    public prices; makes vendor "% of perfect" claims decidable.
    ABSORBED BY GRIDPROOF (the observatory shelf below) — build it as
    that app's instrument, not standalone.
 4. UAM CAPACITY-CLAIM AUDIT (exact-rational recert of a published
    vertiport/corridor bound) · STORAGE-NASH CERTIFICATE (first
    machine-checkable equilibrium certificate in that literature).
 5. EVAL: bigger n on v3 rungs / new model rows (keyless auth live;
    thinking rungs cost 10-30k output tokens/proposal); a true
    feedback-conversion loop needs an intermediate-capability model;
    Laderman/r22 loops need >24k budgets. NEW NAMED RUNG (2026-08-28):
    the seed-pinned random conjugation of <n,n,n> — provably the same
    tensor, published factor files don't parse; /oracle/'s ladder
    names it "next, unbuilt". Building the rung is agent work
    (generalize the d7 disguise transform); running a campaign on it
    is spend, on the word.
 5b. THE ORACLE PACKAGING — SHIPPED 2026-08-27 (operator's word
    "proceed on your order"): (a) oracle/certmachine.py — certify()
    -> CERTIFIED(certificate w/ sha + equation count) / REFUTED(exact
    mechanism: first violated equation + rational discrepancy, fixed
    iteration order) / REFUSED(reason); stdlib-only, floats refused at
    the door, rings Q + F2 (the characteristic-2 pair — sign-flipped
    Strassen Q-REFUTED/F2-CERTIFIED — is a battery row); RED CONTROLS
    RUN AT IMPORT (a broken grader refuses to exist); battery.py 14
    checks + 6 reds; make test row + control-page row; claim/
    certificate JSON schemas + oracle/tool-definition.json (strict
    Messages-API tool shape) + README with the tool-runner wiring.
    ONE DEFINITION: the eval harness now imports certmachine.check_Q
    (dry battery + eval-report calibration gate both green after the
    delegation). (b) PASTE-A-DECOMPOSITION live on the matmul board —
    BigInt-rational browser mirror, GATED AT BUILD (Strassen must
    certify, forgery must refute, float must refuse or the page
    refuses to build); nothing uploaded, citable path stated. (c)
    paper/verified-reward-oracle.md — the arXiv-shaped DRAFT
    (invariant, red-control discipline, results quoted from ledgers,
    #852+RM taxonomy, honest scope, Lean bridge as extension);
    SUBMISSION on the word only.
    THE ORACLE LANDING PATH — DONE 2026-08-27 (operator ruling on the
    word "define the oracle landing path and publish"): /oracle/ is
    the oracle's own front door — an app-zone-style EXCEPTION to the
    pages-under-/reports rule, sanctioned by that word (the S2.5c rule
    otherwise stands). The page: contract stats, the sixty-second
    curl->certify() path, the paste box (tools/oracle-widget.js — ONE
    widget definition shared with the board, gated at every build),
    the tool-shape section, the evidence links (board/loop/taxonomy/
    methods + the paper draft, labeled not-submitted). GATES: oracle
    battery re-runs at site build (page refuses without ALL PASS) +
    widget known answers; numbers read from the eval ledger. Landing's
    reward-channel section links the door.
    STILL PENDING from this shelf: outside reruns (item 13, target 3);
    paper SUBMISSION (word).
 6. APERY/STURM DECIDER (notes/apery-sturm-decider.md; green zeta(3)
    must PROVE, red zeta(5) must REFUSE). A session's work.
 7. MU BOX50 (worker_threads sharding ~3.68x, then n=10..12 detached).
 8. STRASSEN 2506.13242 non-complex rank-48 row (home:
    reports/alphaevolve.html).
 9. RM Catalan widths toward 1e-30 · tangent-sweep orbit-invariant column.
 10. OP-2 EXPLORATION (Γ-convergence of the exact discrete KKT — the
    stock-constraint phase's math follow-on).

NEXT OBSERVATORIES (ranked, template-ready — the app-doctrine shelf,
from the SkyAudit retrospective 2026-08-27; each = the decidable-claims
observatory template on a new market, built on the operator's word):
 O1. GRIDPROOF — every ERCOT grid battery graded against the exact LP
     perfect-foresight ceiling (dual certificate: the theorem IS the
     product; ERCOT 5-min prices + EIA battery registry, public).
     Absorbs item 3. Deepest instrument moat.
 O2. HARBORPROOF — UPGRADED 2026-08-27 (the killer-app test applied):
     AIS replay against the BINDING rules — FuelEU Maritime GHG-
     intensity thresholds (penalties + pooling), EU ETS on shipping,
     IMO CII bands — "this vessel's real trading pattern, re-sailed on
     paper under FuelEU 2030, decided: compliant by this margin or
     non-compliant unless X" — proof on both sides of a threshold WITH
     A FINE ATTACHED; shipowners/charterers/Poseidon-Principles banks
     are compelled buyers who today pay for ESTIMATES. Candidate
     assets: methanol/ammonia/batteries/wind-assist/slow-steaming
     boxes; admiralty cube law + IMO's own published formulas.
     SCOUTED 2026-08-27 — VERDICT: GO. (a) Regulation verified via
     class-society/trade summaries (pin EUR-Lex 2023/1805 itself at
     build): WtW reference 91.16 gCO2eq/MJ; reductions -2% 2025 /
     -6% 2030 / -14.5% 2035 / -31% 2040 / -62% 2045 / -80% 2050;
     penalty EUR 2,400 per tonne VLSFO-energy-equivalent over the
     limit — a PUBLISHED EXACT FORMULA; banking (2 yr) + pooling =
     more decidable arithmetic. TIMING GIFT: the FIRST verification/
     penalty cycle closed H1 2026 (penalties due 30 June 2026) — the
     rule is in its first live year RIGHT NOW. (b) THE DATA GAP
     CLOSES: the Danish Maritime Authority publishes free bulk
     historical AIS (CSV, web.ais.dk/aisdata/, ~2 years back) — the
     Danish straits carry ALL Baltic traffic, EU voyages by
     construction; verify listing + license at build. Note for the
     build: the audit is COUNTERFACTUAL (re-sail under candidate-fuel
     WtW boxes), so no fuel attribution from AIS is needed — exactly
     the SkyAudit shape; ship particulars need a registry-join analog
     (AIS static messages + open registries). Class societies (DNV/
     LR/ABS) framed as licensees, not competitors (word-gated).
     Test sentence, kept verbatim: "Replay a real year of your
     operations under the rule that's coming, and get a verdict with a
     proof, not a forecast."
 O3. RANGEPROOF — EPA test-car road-load coefficients (public domain):
     every EV on sale vs the user's real commute across a temperature
     box; winter range decided, not anecdoted. Mass-market; NEEDS
     DATA as a consumer-facing manufacturer-transparency index.
 O4. ORBITPROOF — FCC 5-year deorbit rule vs TLE decay enclosures
     (boxed ballistic coefficient + solar activity -> reentry
     interval; REFUSED-straddles-the-deadline is itself the story).
     Most photogenic; flagship-math candidate.
 O5. ROOFPROOF — NREL irradiance + USGS LIDAR vs installer
     solar-yield claims, roof by roof; consumer protection, map-native.

DRAFTED OR READY, SENDING ON THE OPERATOR'S WORD:
 11. KAUST LETTER — READY TO SEND: evidence surface rebuilt and live
     (reports/mfg-cap.html, mfg-lab.html, wardrop-repro.html,
     methods-note.html; code link github.com/carlostoledo1891/mfg-lab/
     tree/main/research/mfg-cap). Needs your 3 sentences, recipient
     choice, and rewording of "live in the browser".
 12. Co-sign notes (He-Tang, mzn) · RM-group note (optional).
 13. EXTERNAL RERUN recruitment — target raised to THREE on record
     (2026-08-27 brainstorm; highest-leverage credibility move; the
     recording slot exists on the control page). "One machine, one
     operator" is the sentence standing between the oracle and being
     taken seriously. The registry is now MACHINE-READ (2026-08-28):
     corpus/external-reruns.json renders on /oracle/ §9 with count and,
     when non-empty, a who/date/what/hash table — recording a rerun is
     one JSON entry + rebuild.
 14. LRCAP GUARD-RAIL DECISION: forfeit December consciously, or set a
     send date (the sin-mfg outreach drafts await only the send).
 15. EMBRAERX ARTIFACT PLAY — now unlocked: instance-level UAM artifact
     aimed at the warm contacts (uam-corridor is public; evtol-energy
     is live here).

WAITING ON THE WORLD (node tools/sweep-claims.js watches — FIRST ACTION
every session):
 16. #852 correction PUBLIC 2026-08-27 — thread snapshot pinned beside the
     original (corpus/sources/erdos852_thread_correction-public_2026-08-27
     .html), sweep watch closed · #510 lambda table (moderation) ·
     OEIS submission (unanswered).

OPERATOR CLICKS ONLY:
 17. GitHub support ticket to gc purged IP blobs (optional) · Boyd 1986
     via ILL (gates "first witness" prose on the Mercer page only).

## The direction (operator ruling, 2026-08-26): SHIP

The verification layer this machine occupies — proved negatives at scale,
exhaustion certificates, certified audits of published AI-generated math —
is uncrowded for months, not years (the Ramanujan Machine's own Challenge
now asks for verified code; practitioners are arriving thread by thread).
The machine holds ~25 first-ever certified rows, TWO refutations of
published claims (erdos852's C*; the RM mixed-zeta row 3), and cross-lab
replications to the kill-split digit — and almost none of it is visible
off this disk. THE BOTTLENECK IS PUBLICATION, NOT INSTRUMENTS. Everything
ladders to one sentence: "I build verification layers under which AI-scale
mathematical search produces only certified output — and I audit published
AI-generated mathematics."

Public touchpoint (operator rulings, 2026-08-26): cert-machine replaces
sin-mfg on carlostoledo.co. Front door = a THIN LANDING PAGE (the
positioning sentence, the three lanes with one flagship number each, links
to control page / reports / certificates / GitHub, and the ten-second
"rerun this yourself" block); the control page sits one click below. Code
= the FULL repo, public on GitHub, after the self-containment pass.
NOTHING from sin-mfg's ceremony layer comes along — no CI pipelines, no
timestamping, no publication-approval flows, no governance files. OUTWARD
ACTIONS (operator ruling, 2026-08-27, replacing "one operator click"): they
happen on the operator's WORD — an explicit instruction to the agent to
publish, push, deploy, post, or send is equivalent to the operator's own
click, and the agent executes it wherever credentials allow. Nothing outward
is ever SELF-initiated; the gate is the operator's instruction, not the
operator's hands.

The shipping queue, WITH STATUS (updated 2026-08-27; the eval promotion
from the flow-vs-stock ruling is folded in — this list IS the order):

S1. PUBLISH PREP — DONE (e34c5b3). Self-contained: sin-mfg deps lifted via
    LIFT.json (41 files, drift 41/41 clean; no machine path in any
    certificate — certs/mercer-mu5.json regenerated m=5..20); LICENSE +
    package metadata; public README (positioning sentence, three lanes,
    ten-second verifier block — all three commands tested verbatim — and
    the honest trust base); make site (landing + control page + 4 reports
    + 8 certificates + verifiers; every landing number recomputed at
    build, build refuses on drift); vercel.json + .vercelignore (the
    Vercel import needs zero manual settings, no cloud build); the
    paste-ready #510 comment (outreach/erdos510-comment.md — the lambda
    table with bounds CEILED at 12 decimals via exact rationals).
GO-LIVE — (1) DONE on the operator's word (2026-08-27): the repo is
    PUBLIC at github.com/carlostoledo1891/cert-machine (MIT detected;
    main pushed; default-publish rule now LIVE). Remaining:
    (2) DONE (2026-08-27, agent-executed after device-code auth): Vercel
        project cert-machine created and linked, site/ deployed to
        production, carlostoledo.co + www force-moved from mfg-lab —
        THE DOMAIN IS LIVE, all routes verified 200 (landing, /machine/,
        reports, certs, verifiers). Web Analytics: snippet on every
        generated page via design/template.js; ENABLED by the operator's
        dashboard toggle 2026-08-27 — collecting live, no redeploy needed;
    (3) DONE (2026-08-26, operator's click): the #510 lambda-table comment
        is POSTED and sits in the moderation queue; the sweep now watches
        the page (signature digits) and shouts + instructs a snapshot when
        it appears. Status note in outreach/erdos510-comment.md.
    From the moment (1) exists, the default-publish rule is live: every
    green session ends by rebuilding the site and pushing.
S2. THE TWO AUDIT STORIES —
    (a) DONE (75c85e5): reports/erdos852.html expanded into the failure-taxonomy
        research note for a lab-evals reader ("a model published a float
        artifact as a constant, to thirteen digits of false confidence;
        only exact arithmetic caught it"), with the RM row-3 sign slip as
        the second specimen of the class.
    (b) DONE (abf6be0): reports/rm-audit.html — the certified status
        registry: all 52 rows re-certified at build, 51 SURVIVE, the
        row-3 refutation + certified correction front and center, build
        refuses on any deviation. Optional after go-live, on the
        operator's word: a short note to the RM group (their Challenge
        asks for verified code), carrying the independent-rerun
        invitation.
S2.5c HOUSEKEEPING RULINGS (operator, 2026-08-27), permanent:
    - Every PAGE lives under /reports (plus the landing and /machine/).
      No parallel page structures; historical URLs survive as 301s into
      /reports (vercel.json holds 15, incl. .html spellings). /research/
      on the site carries ONLY raw artifact FILES individually cited in
      outreach (the alien-science bundle) — files, not pages.
    - All five sent pages are REBUILT in cert-machine's design system
      (reports/: erdos290, verify-lemniscate, mfg-congest, wardrop-repro,
      alien-science), each gated on re-running its own public verifier at
      build (embedded-verifier extraction for mfg/wardrop — the extracted
      .py ships beside the page; the fellows-pack kernel for alien).
      Byte-preserved originals live in legacy/ as repo provenance only.
    - build-site is an INCREMENTAL SYNC: writes only changed bytes, prunes
      only what should not exist, never rm-and-recreate (cloud-synced
      ~/Documents has nothing to fight); sync-conflict junk is auto-pruned
      silently. FIX CAUSES, DO NOT ADD GATES (operator instruction).
S2.5b INCIDENT AND STANDING RULES (2026-08-27). A whole-directory lift of
    the mfg-congest and wardrop-repro units published 18 PROPRIETARY-marked
    solver files + internal docs (~127 files) to the public repo and site
    for ~1-2 h. REMEDIATED same day: purged, LIFT.json rewritten to
    explicit per-file items, git history REWRITTEN and force-pushed, site
    redeployed, all 404s verified; sent pages stayed live throughout.
    RULES, permanent: (1) public lifts are FILE-LEVEL and eligible only if
    present in the published mfg-lab repo tree — the source lab's own
    allowlist made real; check BEFORE lifting. (2) Operator ruling: NEVER
    copy styles from sin-mfg — rebuilds and new pages use cert-machine's
    design system only; byte-preserved legacy citation pages excepted.
    (3) mfg-congest + wardrop-repro engine rebuilds (pending) may re-run
    only PUBLIC components (the pages embed their stdlib verifiers; the
    kernels are class-B private and stay out).
S2.5 LEGACY OUTREACH SURFACES (operator ruling 2026-08-27: this is the
    focus before the eval).
    STAGE 1 — DONE: the three SENT outreach targets (Erdos #290 report,
    Erdos #1038 verify-lemniscate, the Anthropic sandbox alien-science
    bundle) had gone DEAD — the old mfg-lab project 308s its whole host
    to carlostoledo.co, which now serves cert-machine, so every shared
    URL 404ed. Restored: lifted byte-identical from sin-mfg via
    LIFT.json (125 files, drift clean) into legacy/, served at ORIGINAL
    paths; vercel.json carries extensionless rewrites + 301s for retired
    spellings (/technical-reports/*, /reports/verify-lemniscate). All
    seven sent URLs verified 200 end-to-end through the old host; the
    four cited artifacts hash-identical to the sin-mfg source.
    CONSEQUENCE, PERMANENT: the mfg-lab Vercel project must NEVER be
    deleted — its .vercel.app host is in three sent messages and only
    resolves by redirecting into carlostoledo.co.
    STAGE 2 — NEXT: rebuild erdos290 and verify-lemniscate as
    cert-machine engine reports (numbers reviewed and re-certified by
    our instruments, improved where cheap — e.g. the #290 l-sweep
    deepening), then flip their legacy paths to 301s onto the new pages.
    The alien-science bundle stays FROZEN (cited evidence bytes in a
    safety-research issue) unless the operator rules otherwise.
S3. THE EVAL — LIVE WITH ITS FIRST BOARD (2026-08-27). 202 ledger rows,
    five campaigns (prompt v1 + clarified v2, tags in every row):
    claude-opus-5 v2 17/24 certified (71%) · claude-sonnet-5 v2 28/40
    (70%; v1 25/34) · claude-haiku-4.5 0/80 across both prompts — a
    measured capability cliff. THE FINDING: zero REFUTED rows among real
    models — every well-formed proposal surviving the float screen was
    EXACTLY right (survivor truth 100%); frontier failures are malformed/
    rejected (Laderman-rung emptiness under thinking budgets), never
    subtly wrong. Harness: API retry+skip (errors are not model
    outcomes), v2 prompt with worked example, per-campaign tags, budget
    caps. Spend: well under the operator's $24. KEY ROTATION: the pasted
    key was DELETED by the operator 2026-08-27 (leak closed). Future
    campaigns: operator drops a fresh Console key at
    ~/.secrets/anthropic-key (chmod 600) and runs are invoked as
    ANTHROPIC_API_KEY=$(cat ~/.secrets/anthropic-key) — the key never
    enters a transcript again.
    ORIGINAL BUILD NOTE (2026-08-27): tools/llm-harness.py gains
    the matmul family (rank-R decompositions of <n,m,p> over Q; stdlib
    Fraction grading of the full tensor identity — always decidable, false
    positives provably false; prune-only float screen; per-proposal
    accounting, dedup off for evals). Red controls per run incl. the
    SUB-FLOAT forgery (coefficient off by 1e-9, invisible to the screen,
    REFUTED exactly); any control certifying aborts the campaign. Ladder:
    <2,2,2> r8, r7 (Strassen), <2,2,3> r11, <3,3,3> r23 (Laderman) —
    achievable ranks only. Leaderboard: reports/matmul-eval.html
    (build-report-eval.js re-runs the calibration as its gate; ledger
    certs/matmul-eval-ledger.jsonl, append-only; page states NO MODEL HAS
    RUN yet — the fake baseline is labeled). FIRST CAMPAIGN is one
    operator command with their key:
    ANTHROPIC_API_KEY=... python3 tools/llm-harness.py --family matmul
    --model <id> --n 40 --ledger certs/matmul-eval-ledger.jsonl
    ORIGINAL NOTE: model-proposes-engine-certifies over the
    strassen corpus: per-model certified truth rates, false positives
    provably false; shipped as corpus + stdlib graders + a small
    leaderboard page. The one artifact whose value curve has no operator
    in the denominator; the direct frontier-lab bridge.
S4. THE NEW-CLAIMS SWEEP — DONE (2026-08-27): tools/sweep-claims.js.
    Run `node tools/sweep-claims.js` at SESSION START. Surfaces: the RM
    results page (a new sheet = new registry corpus), the erdosproblems
    #852 thread (the standing moderation check is now automated — it
    shouts when the correction digits appear and the snapshot instruction
    fires), the #510 page (added 2026-08-26: the posted lambda-table
    comment's signature digits; shout + snapshot when public), and arXiv
    "Ramanujan Machine" mentions (a proof of an audited
    row updates its registry status). Diff state: corpus/claims-seen.json.
    A REPORT, not a gate — exit 0 always; acting is a session decision.
    No cron unless the operator later opts in.
S5. THE MERCER PROGRAM REPORT — DONE (2026-08-27): reports/mercer-program.html
    (build-report-mercer.js re-certifies all 12 mu champions, re-proves the
    Sturm equality, re-checks the 16 ladder rungs at every build; 5.09G sets
    accounted; Boyd framing discipline in its own section). ORIGINAL NOTE: the mu/lambda tables, the
    m = 5..20 bracket ladder, M(0,1,2,6,9) = 1, cross-lab replication to
    the kill-split digit. "First CERTIFICATE / named box" framing; Boyd
    1986 (unread; ILL) gates "first witness" prose only.
S6. THE METHODS NOTE — DONE (2026-08-26): reports/methods-note.html
    ("None by reading code"; tools/build-report-methods.js). The bug
    catalog: 10 real bugs, each with the instrument that caught it
    (impossible number / calibration / control / byte pin / outside read
    — 0 by reading code), the five rules as engineering, two near-misses,
    the same-class-in-the-wild section, and the OPEN co-sign invitation
    (generic on the page; DIRECTED notes to He-Tang / mzn remain
    operator's-word outreach, undrafted). SIX batteries execute as the
    page's own gate; recomputable numbers recomputed, history quoted AS
    history. Ranked #2 on the shelf.
S7. THE LEAN BRIDGE — DEMONSTRATED AT FULL SCALE 2026-08-26/27:
    check.sh 4/4 — the complete artifact builds green (all 33,859 primes
    kernel-certified in 240 fine-grain modules, ascent, oddness, the
    N_spec/D_spec product-spec theorems, THE inequality) and all three
    forged variants are REJECTED by the kernel. reports/erdos852.html §8
    now states the demonstrated state (the dated honesty sentence removed
    by its own rule). Two performance walls were root-caused as CAUSES:
    (1) isPrime in Bool primitives (Nat.blt/beq) — ite/Decidable chains
    are kernel poison at scale; (2) NEVER evaluate a 33k-element fold in
    one decide — the kernel cache held every growing bignum partial
    (~8GB, 5%-CPU rehash churn); the fix is chunksP (240 chunk
    REFERENCES) + two generic induction lemmas (all_flatten,
    prod_map_flatten in Basic.lean) so proofs rewrite over references and
    the kernel evaluates a TREE of chunk subproducts. Fine grain
    (~140 primes/module) keeps every decide's cache small — measured
    635s at 2,116 primes vs 4s at 141. Full build ~16 min on 8 workers.
    Lean 4.33 + Mathlib project at lean/erdos852. Design: a ten-line trial-division isPrime with a
    machine-checked correctness THEOREM against Mathlib's Nat.Prime
    (Basic.lean), so the kernel evaluates the fast function and the
    33,859-prime list needs ZERO generator trust — an omission only
    weakens the bound, every other defect fails the build (primality,
    strict ascent → Pairwise distinctness, oddness all kernel-checked).
    The theorem: cstar_refuted, 5(N−D)·10^12 > 752403861778·D, by
    `decide +kernel` with maxHeartbeats 0 (the default heartbeat cap was
    the first full-scale failure; 16 parallel mathlib workers then
    swap-thrashed the 16GB machine — build chunks in batches of 3).
    Generator: tools/gen-lean-erdos852.py (reads the certificate;
    weight-balanced chunk modules). Reds: lean/erdos852/check.sh — three
    forged variants (composite / order / claim) the kernel must REJECT.
    reports/erdos852.html §8 states the bridge and its honest boundary
    (the subset-product monotonicity paragraph and the transcription of
    the published constant stay outside Lean). lean/**/.lake gitignored;
    rerun: install elan, `lake exe cache get`, bash lean/erdos852/check.sh.

ADOPTED FROM THE FLOW-VS-STOCK BRAINSTORM (operator, 2026-08-27) — convert
operator capability (a flow) into artifacts that hold value unattended (stock):
  1. DONE is redefined: not "battery green" (internal done) but "has a public
     URL and someone else could rerun it". A result without a URL is not done.
  2. Owned surfaces (repo, site) default-publish: a green session ENDS by
     rebuilding the site and pushing — the operator vetoes after, not before.
     Third-party surfaces (forums, email, OEIS, notes to authors) move only
     on the operator's explicit word, never agent-initiated.
  3. QUEUE REORDER: the eval moves to directly after S2 (now reflected in
     the queue above as S3; the reports and the Lean bridge are writing
     slots interleaved around it).
  4. The audit function becomes standing: the engine already re-audits the
     whole RM corpus every run; add a NEW-CLAIMS sweep (RM results pages,
     erdosproblems proof-claims, arXiv constants) run per session — a fetch
     tool, not a cron; scheduling is a later operator opt-in.
  5. Attach one human: the #510 comment, the RM correction note, and the
     methods paper each explicitly INVITE an independent rerun / co-sign
     (the thread practitioners already doing rigorous numerics — He-Tang,
     mzn — are the natural first contacts).
  Positioning shift that follows: not "watch me operate" but "I built the
  verification infrastructure — the eval labs run, the registry that
  updates, the certificates anyone checks in ten seconds." Operator
  capability stays visible as provenance, not as the product.

SESSION 2026-08-28b (THE FORECAST GYM — operator's word "build what's
missing", after the hiring-lead read named the prediction engine's three
gaps: age, the 8C fusion, the public face; 8C stays BLOCKED on the
operator's own parked scenario packs and was not touched):
  - AGE: day 2026-08-27 ingested green (Thu, 49 E-FLYABLE, 25.7% — the
    weekday rate cluster holds at HALF the volume; intervals widened
    honestly). Product ledger committed forward: 09-01 + 09-02 pairs at
    the new n=4 coverage 3/5. 8D is now a standing daily cadence:
    ingest, score BOTH ledgers, commit forward.
  - THE INSTRUMENT GREW: instruments/forecast/admission.js — the
    doctrine's prune rule ("below your certified coverage you stop
    being admitted") computed as an EXACT binomial tail P[X<=k] over
    BigInt rationals, DEADMITTED at a stated 1/20 bar, the tail printed
    as the certificate; only under-coverage prunes. Battery 7 checks +
    5 reds (the deadmission firing IS a red).
  - THE GYM: tools/forecast-gym.js — three deterministic house
    proposers (conformal = claims only its theorem, and REFUSED the
    weekend group as too small to prove anything, on the record;
    persistence = the forced dumb baseline, expected to be pruned in
    public; range = the hedger); 32 sealed-capable commits across 6
    target days; DEADMITTED proposers' commits are refused by the
    runner (mechanism verified on a scratch ledger: 0/5 at claim 1/2 ->
    tail 1/32 <= 1/20 -> SKIP printed).
  - THE PAGE: reports/forecast-gym.html — thesis "the future is the
    only test set that cannot leak"; gates = battery + both ledgers
    re-verified with the builder's OWN arithmetic (sha re-hash, Winkler
    recount string-exact, commit-before/score-after) + admission board
    recomputed. Shelf AI group position 5; landing card; /oracle/ §8
    links it as the probabilistic sibling channel. Verified: 31/31,
    zero overflow 1440/390, board screenshot clean, links root-absolute.
  - SCRATCH-TEST CAUGHT A REAL BUG before any ledger was touched:
    admission verdicts carried BigInts that JSON could not serialize —
    fixed at the cause (tailStr only).

SESSION 2026-08-28 (the oracle door upgrade — operator's word "use what
survives and update /oracle/", on an outside-drafted oracle page):
  - The outside draft (written without repo access) was fact-checked
    against the ledgers before anything shipped. SURVIVED: the lab
    framing, the Monday uses, the ladder with open rungs, the scope/
    Lean-exit statement, the on-page rerun registry, the hero sentence
    ("graded correct and is correct are the same event"). REFUTED BY
    OUR OWN LEDGER: its closed-loop "measurable improvement" claim +
    median-rounds stat — the loop record is 3 closed all first-round
    (opus) and 24 rounds with no conversion (haiku); the page now
    states that honestly and names the conversion trajectory as open.
    Its ladder mixed real rungs with corpus rows and an unbuilt rung —
    now labeled honestly (audits-not-rungs note for AlphaEvolve/
    AlphaTensor; "next, unbuilt" for the conjugation rung).
  - /oracle/ rebuilt in build-site.js §1-§9 (foreign CSS never
    entered): all ladder/loop counts computed from the ledgers at
    build; NEW GATE-BY-FACT: a CERTIFIED rank-6 <2,2,2> row (Winograd-
    impossible) refuses the build. NEW RECORD: corpus/external-
    reruns.json ([] until someone reruns) renders as §9's registry.
  - Verified: make site green (27/27 control batteries), make test
    31/31, zero horizontal overflow at 1440/390 (CDP probe), ladder
    table screenshot clean, every internal link root-absolute.

SESSION 2026-08-27 CLOSE (documentation + review phase, operator's word):
  - CLAUDE.md now carries the permanent instructions: sin-mfg is a
    LEARNING repository (insights applied freely, gates/rulings never
    imported); every page is born from the cert-machine template (no
    built pages or CSS from sin-mfg; legacy/ = unserved gate sources;
    the only byte-preserved exception is already-sent outreach URLs);
    keep the machine lean (gates catch drift and forgery, never slow
    development — review and delete what refuses instead of measures);
    the TASKS BACKLOG at the top of HANDOFF is the operator's standing
    menu, updated in the same commit as any task-state change.
  - REVIEW PASS: no tracked junk (641 files; .gitignore already covers
    .DS_Store/.lake; the 18 sync-resurrected lean files were pruned
    earlier tonight); every code gate in the repo measures (drift,
    forgery, count closure, shelf/disk agreement) — none refuses a
    direction, nothing removed. The lock-imports were behavioral and are
    closed by the CLAUDE.md rules + memory.
  - Backlog restructured into TASKS BACKLOG (17 items, ranked, grouped
    by who acts) at the top of this file.

SESSION 2026-08-27 LATE NIGHT (THE UNLOCK + the new-fronts program):
  - OPERATOR RULING, permanent: sin-mfg's RULINGS are information, never
    law here. Explicitly non-binding: its D2 aerospace gate, its "market
    KILLED" verdicts (about selling; our goal is portfolio — an incumbent
    tool like NASA Kodiak is a benchmark to beat, not a blocker), its
    OCCUPIED-as-veto gates, its MOAT/owner ceremonies. What binds stays
    short: read-only source lab, class-C never public, file-level lifts,
    calibrate+reds, done = public URL + rerunnable, sends on the word.
    Symptom the operator flagged and to watch for: routing decisions to
    him that his rules already delegate — that is the slowness.
  - TWO FRONTIER SCANS (web, verified-at-source; full reports in session):
    AEROSPACE — the crown gap is CONFIRMED OPEN 3 ways: computer-assisted
    proof of periodic orbits is mature, aeroelastic LCO literature is
    mature, their intersection is EMPTY (no certified aeroelastic LCO
    exists anywhere; NASA TRAST whirl-flutter is the live hook). eVTOL
    energy-reserve feasibility (SFAR 20/30-min rule, industry pushback)
    has NO provable envelope anywhere — Monte Carlo only. UAM capacity/
    equilibrium claims are simulation-only across the literature.
    Althoff/Platzer iFM 2025 converged on our witness+kernel architecture
    — cite as validation. LRCAP/BESS — dates hold (auctions Dec 2/4;
    ANEEL hearing Sep 1; CP 22/23 close Sep 14); record 296.8 GW
    registered vs ~5-6 GW to contract; NO public quantitative clearing
    model exists (certified LRCAP arithmetic = first + perishable). And
    nobody certifies the "percent of perfect foresight" ceilings battery
    vendors are judged by (Gridmatic 48%, Autobidder ranks) — an exact
    LP-duality auditor would make those claims decidable.
  - FIRST INSTRUMENT OF THE AEROSPACE FRONT SHIPPED: instruments/evtol/
    (energy.js + battery.js, 25 checks, 4 reds, verdicts cross-proved by
    256-corner exact-rational sweeps; dyadic closed-form calibration —
    the battery caught THREE of the builder's own fixture errors incl.
    the 0.9-is-not-dyadic slip, working as designed) + reports/
    evtol-energy.html (build gates: battery + live mission ladder + the
    certified-endurance frontier bisected fresh each build; frontier at
    the stated boxes: ~19 min cruise under the 20-min rule, ~11 under
    30). Aviation wording rule applied on-page ("mathematically
    certified", no airworthiness meaning). New shelf group 'applied'
    (evtol-energy + water-value moved in). make test row 'evtol energy';
    control battery row added (now 25 batteries).
  - THE NEW-FRONTS QUEUE, ranked (novelty x feasibility x clocks):
    (1) LRCAP certified auction arithmetic — fetch CP 22/2026 edital
    drafts, exact-rational dominance thresholds (beta=0.9 x two-product
    sequencing x content premium); PERISHABLE, target well before Sep 14;
    (2) the aeroelastic LCO enclosure — the world-first flagship, needs
    its own session (radii polynomial on the 2-DOF pitch-plunge system;
    sequence.js + radii.js are the instruments); (3) certified
    perfect-foresight revenue auditor (exact LP duality on public
    prices); (4) UAM capacity-claim audit; (5) storage-Nash certificate.

SESSION 2026-08-27 NIGHT (the stock-constraint phase — operator chose it as
the first of the three new fronts after the sin-mfg investigation; aerospace
and LRCAP idea extractions are recorded in this session's chat, NOT in repo
files — class-C sin-mfg material must never enter this public tree):
  - THREE-FRONT INVESTIGATION (aerospace / LRCAP / BESS) swept sin-mfg via
    three read-only agents. Keys: research/lrcap-bess is a LIVE priced
    engagement (SKUs R$30-100k, Dec 2/4 2026 auctions, ANEEL CP closes
    14 Sept, outreach drafted-never-sent, class C — nothing liftable);
    aerospace has a PROMOTED uam-corridor unit + EmbraerX warm-contact
    strategy + a stale D2 ruling (no aerospace report before the Rust
    kernel — its stated blocker retired 2026-08-01; operator must
    re-adjudicate) + one named unbuilt bridge (certified limit-cycle
    enclosure, the object Kodiak cannot do); "certified" is a hazard word
    in aviation (always "mathematically certified ... enclosure").
  - KAUST LETTER READINESS (the phase's cheapest high-value move): the v3
    Gomes/Ribeiro letter's evidence surface was DEAD — mfg-lab.vercel.app
    hash-routes now land on this site's root, github.com/carlostoledo1891/
    mfg-cap 404s. FIRST FIX (serving the sin-mfg pages byte-preserved under
    /research/) was WRONG and operator-corrected the same night — see the
    RULING below. Final state: the letter's evidence = REBUILT reports in
    this design system (reports/mfg-cap.html — the lead multiplicity
    result, its battery + 6 falsifiers re-run at build; reports/
    mfg-lab.html — the lab's certified-claims registry, four of its own
    batteries at build; reports/wardrop-repro.html and methods-note.html
    already covered #/wardrop and #/verification). The "MIT code" citation
    points at github.com/carlostoledo1891/mfg-lab/tree/main/research/
    mfg-cap (resolves today). The letter's "live in the browser" phrasing
    needs the operator's rewording at send — the interactive artifact now
    lives in the public repo, not on this site.
  - RULING (operator, 2026-08-27, permanent): byte-preserved sin-mfg pages
    are served ONLY for urls in ALREADY-SENT outreach (the alien-science
    bundle). Never-sent material NEVER ships in foreign design — rebuild
    in this design system under /reports and 301 the old path onto the
    rebuild. Lifted units stay in legacy/ as GATE SOURCES only, unserved.
  - THE ENERGY SHELF OPENED: reports/water-value.html
    (build-report-water-value.js) — the stock-constraint unit's PUBLIC set
    lifted file-level (13 new LIFT items, eligibility checked against the
    live published mfg-lab repo listing; drift 112/112 clean). Gates: the
    unit's OWN batteries re-run at build (test-sin 50 checks incl. its
    corner sweep; test-transpose-sin with BOTH mutants required to print
    CAUGHT — the build's red controls), the scenario-tree water-value
    solver EXTRACTED from water-value.html's verbatim block (sha-pinned
    28fc1501...; flipped byte refuses; ships beside the page as
    reports/water_value_tree.extracted.js), 120 seeded random trees
    re-certified every build (worst rel gap ~5.7e-14, off-binding
    martingale residual ~9.7e-13, zero trichotomy violations, sign of the
    gap checked SEPARATELY with a 1e-12 rounding bar — a femto-negative is
    ulp accumulation, not assembly). PLD layer quoted as history with its
    own DESCRIPTIVE-CONSISTENCY downgrade; OP-1/OP-2 stated as open.
    Shelf: 'ground' group; build-site serves the lifted units as raw
    citation files under /research/ (the alien-science pattern).
  - NEXT IN PHASE (operator's word where marked): [operator] send the
    KAUST letter with the URL substitutions; [operator] the LRCAP
    guard-rail decision (forfeit December consciously, or set a send
    date — ANEEL CP closes 14 Sept); [agent] OP-2 exploration
    (Γ-convergence of the exact discrete KKT) when directed; [agent]
    price-saturation floor-recalibration would need sin-mfg write access
    — it CANNOT run here; flag only.

SESSION 2026-08-27 LATEST (the report chase — all four queue items, on the
operator's word "proceed all four"):
  1. reports/alphaevolve.html SHIPPED (build-report-alphaevolve.js): the
     whole strassen corpus re-certified at build (11 rows; AlphaEvolve-48
     over Z[i] scale-8/4096-equations gated, the rank-47 over-Q refutation
     gated, commit-pin sha gated). 2. reports/answer-key.html SHIPPED
     (build-report-answer-key.js): three specimens RE-PROVED at build
     (naive-product reproduction + exact refutation; deepest impostor depth
     re-derived in BigInt = 62, A271880 — cross-gated with the impostors
     page; RM printed/corrected pair re-certified) + the eval as the
     keyless design.
  3. EVAL V2 SHIPPED. Harness: ladder + probe (2,2,2,6) impossible
     (Winograd 1971, consumed+named; decline option {"impossible":true} on
     EVERY rung so refusal is never a tell), disguised tensor
     ('tensor','d7',7) — the <2,2,2> tensor under a pinned monomial
     transform, prompt never says matmul; green control = transformed
     Strassen MUST certify, red = sign-flip must not — and the OPEN
     (3,3,3,22) discovery rung (labeled; certified row would be new math;
     page renders it in bold, never a score). New outcome 'declined';
     run_green_controls beside red. MEASUREMENT-ARTIFACT FIX (cause, not
     gate): thinking models can exhaust max_tokens with EMPTY text — was
     being recorded as 'malformed'; harness now reads stop_reason and
     SKIPS budget-cut unparseable replies like API errors. 102 artifact
     rows (never committed) were dropped and every v3 campaign re-run
     under sane budgets. FINDINGS (certs/matmul-eval-ledger.jsonl, tag
     v3): probe — opus 6/10 declined, sonnet 5/10, HAIKU 0/10 (attempts
     the impossible every time it parses); over-refusal control clean
     (opus 7/10, sonnet 10/10 certified on r7, 0 declines). Disguised —
     opus 6/6 CERTIFIED @16k budget, sonnet 3/3 graded @32k (exhausts
     16k thinking every attempt), haiku 0/10: the disguise converts free
     recall into 10k-30k tokens of real derivation — the cost asymmetry
     IS the anti-recall measurement (stated on the page §2d). Open r22 —
     opus 6/6 declined, sonnet 5/5 graded declined. Still zero REFUTED
     and zero false certifications ever.
  4. reports/verifier-loop.html SHIPPED (build-report-loop.js) + harness
     --loop/--trajectories/--loop-ledger: feedback is TEMPLATE-LOCKED to
     the grader's own mechanism (parse complaint / screen class / the
     certificate's first_violation index + exact discrepancy) and the
     build REFUSES a ledger whose feedback deviates (anti-coaching gate).
     certs/matmul-loop-ledger.jsonl: 27 rounds, 6 trajectories — haiku
     r7 3x8 rounds NEVER converts (below-bar model not rescued), opus r7
     3/3 first-shot certified; Laderman loops budget-exhausted even @24k
     (skipped, unrecorded, honest). Headline: the channel is honest in
     both directions — cannot coach, cannot be sweet-talked.
  Wiring: C.tldr on all three new pages; site shelf AI group = 10 pages
  (alphaevolve #2, verifier-loop #4, answer-key #6); certs table +
  matmul-loop-ledger.jsonl; Makefile reports += 3 builders.
  OPEN AFTER THIS: an intermediate-capability model for a true feedback
  CONVERSION trajectory (none of ours is one nudge from the bar); r22/
  Laderman loops need >24k budgets if ever re-run; spend not precisely
  measurable keylessly (~100 graded calls + ~60 skips/retries).

SESSION 2026-08-27 LATER (narrative transformation — operator ruling after
the "is my portfolio sexy" brainstorm; report chase NOT started, next on
the operator's word):
  - IDENTITY FLIP: the site is an AI-VERIFICATION portfolio. Landing deck
    and README positioning gained the reward clause ("— reward signals that
    cannot be hacked —"). "The three lanes" became THE THREE PRODUCTS:
    certified audits of AI-generated math (first), evals whose ground truth
    is a proof, a verified reward channel — with the classical math demoted
    to "the proving ground" paragraph and the reports index split into two
    shelves (AI verification / the instruments, proven on hard ground).
  - RLVR SECTION on the landing ("A reward channel that cannot be hacked"):
    the prune-only invariant = no gap between graded-correct and is-correct;
    red controls prove the refusal path per campaign; measured "never paid
    out on a false claim" line computed from the eval ledger at build (with
    an honest branch if a refuted row ever appears); scope stated (finitely
    many exact arithmetic facts; REFUSES otherwise). One scalable-oversight
    sentence, no manifesto. README's "Where it goes" rewritten as "Verified
    reward, running".
  - ALPHAEVOLVE ABOVE THE FOLD: landing stat "AlphaEvolve rank-48 CERTIFIED
    (Z[i]) · AlphaTensor rank-47 verified over F2, REFUTED over Q", gated on
    the ledger rows (mm|alphaevolve-48-4x4x4, mm|alphatensor-f2-4x4x4). New
    landing stats also: model proposals graded (computed from
    certs/matmul-eval-ledger.jsonl at build; gate refuses an empty board).
  - TL;DR BLOCKS: new design component C.tldr (finding / mechanism / check
    it — DESIGN.md row added); ALL 13 reports carry one under the header,
    each with the audience hook in the audience's vocabulary (answer-key
    contamination on impostors/erdos852, reward oracle on matmul-eval,
    verifier engineering on methods-note).
  - NEXT (the report chase, ranked, awaiting the operator's word):
    (1) AlphaEvolve/AlphaTensor certified-audit page; (2) eval v2 —
    recall-proof rungs (permuted/rescaled tensors, ±1-restricted <2,2,2>,
    open <3,3,3> r22 target) + the rank-6 honesty probe (campaigns = spend);
    (3) verifier-in-the-loop demo report; (4) answer-key-contamination note
    stitched from erdos852 §6 + impostors.

SESSION 2026-08-27 (review-fix pass — an outside review's defects, all fixed):
  - COUNTS DEFLATED TO TRUTH, everywhere: RM audit is "51 printed rows, 50
    survive, 1 refuted as printed, correction certified" (the 52-row corpus =
    51 printed + OUR correction; counting it was inflation by one). Front
    page "published claims refuted: 2" → "1 refuted · 1 corrected" (a
    transcription slip is not a second refutation). Applied to landing,
    rm-audit page (deck/stats/registry/footer + gates), README, methods-note
    stat, cf-audit battery label (which had said six sheets/46 rows — stale),
    HANDOFF. New and unproven: 39 decided, 38 survive as printed.
  - §4 SURVIVORS → 0: strassen's integer ranks were "surviving" their own
    spellings (47/1 AND sqrt(2209/1) — the dedup gap the reviewer named).
    Fix at the cause: family flag integerValued skips the closed-form hunt;
    the sqrt vocabulary skips perfect squares (the rational loop already
    tests that spelling). Ledger regenerated: ...+ 0 open + 0 surviving.
  - RM-AUDIT REGISTRY gains the DEFINING CF column (a(n) denominators /
    b(n) numerators — the sheets' own labeling; the four same-value pairs
    rm-e-a/b, cat-02/05, cat-03/10, cat-07/11 are found by computation and
    named as distinct CFs, not duplicates). Refutation reframed precisely:
    THREE typographic errors on the 2022 sheet, one fatal; underlying
    computation correct. "First on record" now dated (as of 2026-08-27) and
    open to correction. "The Machine says" labeled sheet-time status.
  - CROSS-PAGE CONTRADICTION fixed: the battery row no longer says "NO
    model has run" — it is the eval's dry-run gate, pointing at the live
    certs/matmul-eval-ledger.jsonl and reports/matmul-eval.html.
  - STALE DISCLAIMERS replaced (control page + impostors): "Published, not
    peer-reviewed, not independently rerun" — the slot where external
    reruns get recorded. (The reviewer's top ask: ONE outside person
    cloning and running the three verifiers, name + hash recorded.)
  - ENVELOPE: §5 explains the moved bars (bar(10), bar(17) — box30 sweep
    champions past Boyd/HJ; computed at build, adopted-here rows = the
    promotions).
  - NOT DONE HERE (follow-ups, by design): new discriminating eval rungs
    (<3,3,3> r22 open target, ±1-restricted <2,2,2>, permuted tensors) →
    eval tasks 1-2; tangent-sweep orbit-invariant column; Catalan widths
    to 1e-30; RM-group submission/email = operator's-word outreach (the
    per-rung §2b table already existed and satisfied that review point).

SESSION 2026-08-26/27 LATE (post-restart continuation):
  - S7 closed at full scale (see S7 above) — the finishing sequence ran on
    the operator's word ("when finish, commit and push live"): committed
    ac360e6, pushed, deploy verified live (§8 demonstrated-state text
    confirmed on carlostoledo.co).
  - UI PASS 2 (operator feedback, two agent passes): machine schematic is
    VERTICAL-DENSE — original type sizes, 4-column self-sizing family
    grid, full-width spine bands, 4-across instruments, 800x936 design
    units at 1:1 on desktop (~0.49 scale on phones, accepted; pinch-zooms
    cleanly). Tables/card grids inside prose sections BREAK OUT to the
    centered 900px track (.col .wide breakout in template.js); figcaptions
    span their figure's track. All 13 reports rebuilt on the new
    stylesheet; verified by emulated screenshots 1440/390 light+dark and
    a zero-body-overflow probe; make test 26/26, control 24/24, drift
    clean. CDP screenshot/probe scripts (shot.mjs/probe.mjs) live in the
    session scratchpad — rewrite from the DESIGN.md description if absent.

SESSION 2026-08-26 (operator greenlit A-F in one word each), beyond the
S6/S7 entries above:
  - SITE: /reports/ index (importance-ordered cards; build refuses if the
    shelf and disk disagree), /about/ (content adapted from the sin-mfg
    about, cert-machine styles only), GitHub ICON nav, pure-CSS mobile
    drawer, landing reorganized (lanes → machine → report cards → rerun →
    certificates table → discipline). THE MACHINE DRAWING IS ONE DRAWING
    (operator instruction): tools/machine-figure.js, batteries.json
    written by the control build feeds the landing, `make site` depends
    on `make control`, both pages byte-identical. code() component
    replaced an inline-styled <pre> whose quoted font stack truncated the
    style attribute (the "python text too big" bug). Root index.html IS
    the control page artifact (operator asked; not junk — do not delete).
  - EVAL (D, key-free half): per-rung breakdown table (§2b "Where the
    cliffs are") + the OPEN SUBMISSION PATH — llm-harness --proposals
    FILE --model-label NAME grades external JSONL through the same
    screen/certifier/red controls, ladder-only targets, attribution
    required; §4 recipe on the page (PR carries the proposals file, not
    graded rows — grading is deterministic). STILL KEY-GATED: more
    models / bigger n, the impossible-rank honesty probe — UNBLOCKED
    2026-08-27: keyless auth via `ant auth login` OAuth profile is live
    and VERIFIED end-to-end (models endpoint 200; a real 1-proposal
    haiku micro-run through the harness's Bearer path). No static key
    exists anywhere. Campaigns now run on the operator's word alone
    (spend is the only gate).
  - E DONE (mechanism): the l=87 OOM was candidateDeltas materializing
    p(87)=38.9M partition objects (p(86)=34.3M fit — matches both OOMs).
    tools/galois-exceptions-lean.js: sha-pinned source-transform fork
    (refuses if the lift moves; only candidateDeltas replaced) with
    closed-form class sums from the cycle-index EGF — Σ sgn·u^fix =
    (u−1)^l + l(u−1)^{l−1}; Σ u^fix = l!Σ(−1)^j 2^{j-l}... /j!; even
    subgroup = (all+signed)/2, S_0/S_1 degenerate case handled.
    Battery (make test row erdos290-lean): closed==enumerated l≤12
    exactly, δ(ES0)(4)=150/384 pinned, broken-EGF red, fork==lifted at
    analyze(8), mutateDisc red. run-erdos290-tail-ext.js now uses the
    fork; the FINALE LANDED same session: l = 87..90 ALL CLOSED (30
    degrees closed, 0 open through l <= 90; l=90 took 186 s in the fork),
    reports/erdos290.html rebuilt — bracket now 33% tighter than the
    cited page. E is COMPLETE; the extension's next wall is compute time,
    not memory. ALSO: a default `make engine` run silently regressed the
    chowla R6 exhaustion (CERT_CAP default < 1600) — cause fixed, the
    Makefile engine target now defaults CERT_CAP=1600.
  - F/strassen DONE: AlphaEvolve's rank-48 <4,4,4> CERTIFIED over Z[i] —
    canonical bytes located (commit-pinned DeepMind notebook, pinned in
    PINS.json + corpus/sources/), tools/convert_alphaevolve.js (doubles
    the half-Gaussian factors; audits BEFORE writing), auditZi/auditZiBig
    in instruments/strassen/tensor.js (scale-s identity Σuvw = s·T, im
    part must vanish), family row alphaevolve-48-4x4x4 (HIT: 4096
    equations exact, layout CA, scale 8), battery 31/31 incl. two Zi reds
    + Strassen-lifted-to-Zi calibration, stdlib verifier extended
    (audit_zi), certificate re-exported (10 entries). Related-but-
    distinct: arXiv 2506.13242's non-complex 48 — a later corpus row.
  - F/apery: requisites READ and PINNED (notes/apery-sturm-decider.md;
    three PDFs in corpus/sources/, hashes verified locally). Criterion
    log α > β (vdP p.199); ζ(3) instance ln(17+12√2)=3.5255>3 (the
    remembered 3.489 was WRONG); ζ(5) red: μ³+2368μ²−752μ−16 CONFIRMED
    verbatim, decay governed by μ₂ (not μ₁, not 1/μ₃), β=5, fails by
    3.914; the PNT-free rational bar (Dₙ<3ⁿ: 17−12√2 < 1/27 exactly) is
    the Sturm-friendly form to decide. INSTRUMENT NOT YET BUILT.
  - F/mu box50: still parked — wants worker_threads sharding in
    run-mu-table.js + days of detached compute; nothing started.
  - notes/alphaevolve-48.md holds the pin story; UI verified via CDP
    probe + emulated-mobile screenshots (drawer, X-morph, no overflow).

STANDING RULE while S1-S2 are unshipped: no new instruments, no new
families; new math only where a report needs a missing number. The build
menus further down are PARKED, not deleted — their technical context
stays correct and current.

## State, measured at handoff

```
819,152  objects generated across 11 families
 16,943  certified exactly
54.6M    closed forms: 54,629,173 tested = 54,628,275 refuted (double)
         + 21 refuted (exact BigInt) + 877 form-on-record + 0 open + 0 surviving
         — the decomposition closes, and the engine REFUSES a ledger where it does not
         (2026-08-27 review fix: the former 18 "survivors" were strassen integer
         ranks matching their own spellings — integer-valued families now SKIP the
         closed-form hunt (family flag integerValued) and perfect-square sqrt
         spellings dedup against their rational form; ZERO survivors is the true state)
    228  existence-AND-uniqueness theorems (Krawczyk)
    452  COMPLETENESS theorems (census: Hénon 328/328 + Holmes cubic 124/124, 0 refusals)
  1,579  chowla screen survivors EXHAUSTED (1,508 certified below 1 — the family is terminal)
     11  keller corpus certificates: Alpöge n=3 + ONE padded row stating the stabilization,
         3 tangent-sweep instances, Meng–Yang HC5, Gallagher d=2..5 + the distinct member —
         every det a symbolic identity over Q, sources hash-pinned, ALL 11 re-verified by a
         standalone stdlib-Python checker in 0.2 s
      7  fibers cells HIT blind, incl. alpoge-own-target: target (0,1,0) chosen from a fixed
         enumeration, never published anywhere, 3 preimages certified — witnesses AND target self-chosen
     50  of the Ramanujan Machine's 51 PRINTED rows SURVIVE an UNCONDITIONAL audit
         (2026-08-27 counting rule: public counts are printed-rows-only — our
         certified correction is a 52nd certification, never folded in) — ALL SEVEN
         sheets COMPLETE: e, pi, zeta(3), CATALAN (23 rows), pi^2 (12), ln 2 (1),
         mixed-zeta-orders (2026-08-26, 5 rows + 1 corrected row) — including 38 of
         the 39 rows the Machine marks "new and unproven"; PLUS the FIRST certified
         REFUTATION of a printed RM row: the mixed-zeta sheet's row 3 as printed,
         2/(2ζ(5)−2ζ(3)−1), is FALSE (~−1.5035 vs the CF's 2.98623) — a sign slip;
         the +1 correction SURVIVES on the SAME enclosure, mechanism named in the
         certificate (the display's a_1 = 275 also contradicts its own polynomial's
         75). Catalan's G certified from its defining series with a PROVED convexity
         tail (96k^2+288k+184 >= 0, exact), pi^2/acosh(2)/ln2 brackets at 1e-47;
         zetaBracket(s, K) at any s >= 2 (ζ(5)/ζ(7) at 3.3e-21/1.1e-27, the ζ(2)/
         ζ(4) series vs π routes held in mutual containment); Möbius forms
         (p+qK)/(s+tK) and two-constant linear-zeta forms decided in exact
         rationals; three head-negative rows via an exact head-shift transform;
         six sign-definite-NEGATIVE-head rows admitted by a gated minus.js extension
         (fixed sign, not positivity, is what increasing maps need); the five
         double-root rows all take the SHARP band L = n^k + α₊n^{k−1} at N0 = 1
      9  fast matrix-multiplication algorithms VERIFIED as exact tensor identities
         (strassen-audit): Strassen 1969 calibrates; Strassen⊗Strassen rank-49 generated
         and re-decided; AlphaTensor's rank-47 4x4 VERIFIED over F2 and REFUTED over Q —
         the speedup provably needs characteristic 2; naive rank-8 honestly REJECTED
 0.3017  certified lower bound on h_top(Henon, 1.4, 0.3) — 340 disjoint h-sets, 4,140
         covering relations (durations 1..6, composed to the uniform F^11 as BINARY
         relations), exact spectral bound; census ceiling ln(1696)/16 = 0.4648
      9  certified mu(n) rows (certs/mu-table.json, battery-gated): the box30 Newman
         min-modulus table n = 9..17, EVERY set exhausted (752M total, conservation
         per row), champions certified, orbits classified. n=9 VALIDATES against the
         sin-mfg record (six survivors, published witness at 1.3623731781333241 to
         the last digit); n = 10..17 are rows NOBODY has ever run — mu(10) >= 1.3236,
         mu(11) >= 1.5346, mu(12) >= 1.5536, mu(13) >= 1.8999, mu(14) >= 1.7241,
         mu(15) >= 1.6647, mu(16) >= 1.7214, mu(17) >= 1.6761 (n=17: the FIRST
         demonstration at the first term count with no printed mu > 1 anywhere).
         TERMS convention; box maxima, not values — the dips at high n are the
         box crowding (16 of 30 slots filled at n=17), bigger boxes are the next rung.
         PLUS the equality theorem M(0,1,2,6,9) = 1 EXACTLY (deflation + Sturm).
     16  mu(5) ladder rungs (certs/mercer-mu5.json, battery-gated): Mercer's §6
         program certified at GENERAL m — mu(5) <= 1 + pi/m for m = 5..20, ending
         at mu(5) <= 1 + pi/20 = 1.15708 (3038 exceptional tuples at m=20, every
         case closed by ONE exact rational evaluation of |f|^2 against the exact
         bar (1+piLo/m)^2; 9,700+ case points across the ladder, each re-proved
         by the battery in exact rationals every run). m=5,6 CALIBRATE (Mercer's Tables 5/6/7 reproduced
         exactly; the source lab's m=6 record matched row for row); m=7..16 are
         rungs nobody holds. Component (i) — the reduction — is consumed from
         the paper (Lemma 6.2; general-m statement p. 16), like Krawczyk.
         Lineage: CFF 1983 mu(3) -> Goddard 1992 mu(4) -> Mercer 2019 sketch ->
         here. From m=10 the list contains (3,7,8,9), the REVERSAL of Mercer's
         own witness (min EXACTLY 1, our Sturm theorem) — it closes with
         g(-1) = 1 <= bar at every m, as it must. Higher rungs are one command:
         node tools/run-mercer-mu5.js <maxM> (each rung lands incrementally).
      4  erdos852 records: BOTH uncertified GPT constants on Erdős #852 replaced by
         certified enclosures — c0 to 61 digits (root of I0=1, existence AND uniqueness),
         C* to width 3.2e-16 (1.86M-prime product, tail proved) — and the PUBLISHED
         C* = 0.0752403861777 REFUTED at its 12th significant digit: it is the naive
         IEEE-754 double product, digit for digit (87% of factors round to 1.0 and
         vanish); true value 0.07524038617830924... The correction PACKAGE is built
         (R7 class): certs/erdos852-certificate.json + tools/verify_erdos852.py
         (stdlib; the refutation re-proved in exact ints with NO tail bound — the
         partial product to 4e5 is a strict lower bound already above the claim;
         the c0 window re-decided at 130 digits; 4 reds; 0.7 s) + the paste-ready
         thread comment at outreach/erdos852-comment.md. POSTING IS THE OPERATOR'S
         CLICK — the site needs a login; nothing auto-sends.
```

Batteries 24/24 on the page (25 rows in `make test`). Engine gate 31/31.
New this round: instruments/bigfloat/ — dyadic big-float interval arithmetic
(BigInt mantissa · 2^e, directed rounding, arbitrary precision; pi/ln2/e
certified to 50 literature digits, mutation-tested rounding) — the layer
doubles and exact rationals could not cover: doubles stop at ~14 digits,
exact rationals explode through a million-factor product. Built for
erdos852, generic by construction; the Mercer/Newman continuation and any
future constant-certification run on it as-is.
Census battery 26/26 (two maps, 5 red controls), keller battery 32/32
(incl. pin drift + forged-pin reds), cf battery 27/27 (10 red controls;
Apéry + the two PROVEN pi^2 rows are the calibrations), entropy battery 11/11 (ln 2
calibration at the full horseshoe; 4 red controls; the detached
certificate re-proved in full every run). Reports shipped (make reports):
reports/impostors.html, reports/zeta3-audit.html, reports/entropy.html —
every number recomputed from records at build time, every build
self-refusing on drift, now joined by reports/erdos852.html.
h_top(Hénon 1.4, 0.3) >= 0.301680 is a certified theorem
(certs/entropy-henon.json, hLB = 0.3016800418811779 — an earlier revision
of this paragraph said 0.356403, the TAINTED lids-only number the shelf
item below refutes; the certificate file itself always held the sound
bound). Drift: 38 unchanged, 1 local edited (a declared patch).

The census instrument is now SPEC-GENERAL: any second-order polynomial
recurrence plugs in with seven functions (step, two partials, in float and
intervals, plus its own certified a priori bound) and inherits the whole
argument. The refactor was proved byte-identical on Hénon before the second
map went in. The second map immediately found the instrument's third real
bug: the Holmes cubic has a fixed point AT x=0, which is the exact midpoint
of the symmetric root box — a zero ON a bisection line can never satisfy
strict interior containment, and the census dove to its depth cap around it.
The root box is now asymmetric by M/1024 (2049 odd => no dyadic subdivision
endpoint ever equals 0). Found by running, not by reading.

An outside review caught two defects in under a minute; both are fixed and
gated. (1) The closed-form vocabularies emitted unreduced spellings —
(2/1)·e and (4/2)·e counted as two forms — so refutation counts were inflated
~30% and one surviving value showed as four candidates; every vocabulary is now
reduced-only, which DEFLATED the headline from 77.6M to 54.6M. (2) The OEIS
family read only the entry NAME and certified "Decimal expansion of 2*e" as a
discovery; corpus/survivors-confirmed.json (full records, fetched by
tools/confirm-survivors.js) now feeds back into certify, so a survivor with a
form on record is REJECT and an unfetched survivor is an open candidate, never
a hit. OEIS hits went 38 → 0: the engine itself now concludes what the
hand-check knew. A019762 is pinned in the battery as a regression control.

## The eleven families

| family | output | result so far |
|---|---|---|
| `newman-minmod` | min\|f\| on \|z\|=1 for 0/1 polynomials | 4 certified; one adopted into the envelope (17-term, min\|f\| ≥ 1.4141441147942588) |
| `chowla-cosine` | Chowla merit c = −min f_A/√\|A\| | **EXHAUSTED**: all 1,579 screen survivors certified, 1,508 below 1 — the family's terminal state (R6) |
| `oeis-closedform` | audits 14,593 published OEIS constants | 54.6M forms refuted, **0 discoveries** — and the counts now decompose to zero on the page (R1) |
| `henon-orbits` | **certified existence + uniqueness** of Hénon periodic orbits | 228 theorems, calibrated against the closed-form fixed points |
| `keller-audit` | Jacobian + Hessian counterexamples decided — and GENERATED | 11/11: Alpöge n=3 + one padded row stating the stabilization (R2); 3 NEW CURVES through the PUBLISHED tangent-sweep mechanism (labeled as such, R4); Meng–Yang HC5; Gallagher d=2..5 + distinct member — every det a symbolic identity, sources hash-pinned (R3), all detached + independently re-verified (R7) |
| `keller-fibers` | fiber counts certified BLIND — no witnesses consumed | 7/9 HITs: Alpöge's 3 preimages rediscovered unaided; alpoge-own-target proves the same with a SELF-CHOSEN target (0,1,0) — 3 preimages, full geometric degree; 2 cells honestly REJECT/REFUSED (witnesses at \|z\|~200, beyond blind reach) |
| `ramanujan-audit` | the Ramanujan Machine's conjectures, decided | ALL SEVEN sheets COMPLETE (52 rows): 51 SURVIVE + the FIRST certified refutation of a printed RM row — the mixed-zeta sheet's row 3 as printed (2/(2ζ5−2ζ3−1)) is FALSE, a sign slip; the corrected +1 identity SURVIVES on the same enclosure. The five double-root rows all take the SHARP band L = n^k + α₊n^{k−1} at N0=1 (the sub-leading quadratic factors over Z); zetaBracket(s,K) generalizes the series bracket to any s ≥ 2 (ζ(2)/ζ(4) cross-checked against the independent π route) |
| `henon-census` | **the EXACT number** of period-p points, plane exhausted | 328/328 cells; at a=1.4: exactly 4 period-7 and 7 period-8 orbits (matches Galias); one-off records through p=16 (1696 points, 1.42G boxes, recheck-clean) |
| `holmes-census` | the same, for the Holmes cubic map x' = dx − x³ + b·prev | 124/124 cells (d sweep through the pitchfork, p ≤ 4); at d=2.77: exactly 3/9/15/49 points for p=1..4, 63 for p=5; calibrated on the closed-form fixed points ±sqrt(d+b−1) |
| `strassen-audit` | fast matmul algorithms decided as exact tensor identities | 9 HIT / 1 REJECT: Strassen-7 (calibration), Strassen⊗Strassen 49 (generated), AlphaTensor r/f2 selections from the pinned npz — incl. rank-47 4x4 over F2 with its over-Q REFUTATION recorded; naive rank-8 certified correct, certified NOT fast |
| `erdos852-constants` | the two GPT constants on Erdős #852, certified + their published digits audited | 3 HIT / 1 REJECT: c0 enclosed to 61 digits (unique root of I0=1; dilog via Lewin inversion; monotonicity certified); C* enclosed to 3.2e-16 (Euler product, 1.86M primes, tail proved; pi^2/8 calibration); published c0 survives AS A ROUNDING (its "..." is a half-ulp slip); published C* REFUTED at digit 12 — it is the naive double product, mechanism reproduced in the battery every run |

The census (`instruments/census/henon-census.js`) is the completeness record
the field survey said nobody publishes for non-SAT numerics: a certified a
priori bound confines every periodic point, interval tube iteration excludes,
Krawczyk-as-contraction resolves each remainder to exactly one point, and
minimal periods are decided by certified shift-links — never by tolerance.
It can refuse; it can never return a wrong count. Two bugs were found exactly
the way the method predicts: by a red control (the fat-record stall at a=0.96,
p=4 — caught by the shift classification, not by reading code).

## Review fixes (an outside reader's pass, 2026-08-25) — ALL SEVEN EXECUTED

- **R1 · DONE.** The ledger carries the full closed-form decomposition
  (refuted-double / refuted-exact-BigInt / form-on-record / open /
  surviving), the page prints it, and run-engine REFUSES to write a ledger
  whose subtraction does not close to zero. Measured: 898 = 21 + 877 + 0.
- **R2 · DONE.** DIMS = [3, 8]: the n=3 mathematics plus one padded row
  whose certificate text states the stabilization in so many words; the
  battery pins that exactly two Alpöge rows enumerate.
- **R3 · DONE, then completed.** corpus/sources/PINS.json +
  instruments/pin.js: pinned entries re-hash their source PDF at certify
  time, carry {file, sha256} + the transcribed formula strings in extra,
  and REFUSE on drift. Red controls: forged pin table, unpinned source.
  Instrument yield, immediately: re-reading rm_zeta3.pdf against its pin
  exposed that the first transcription MISSED the sheet's second row
  (5/(2ζ(3)), a positive CF hiding in the minus table) — now audited with
  the rest. Coverage is now TOTAL: mengyang2026.pdf (arXiv:2607.22198v2,
  fetched and pinned) prints the Alpöge map and witnesses as its eq.
  (1)-(2), so the Alpöge rows — whose origin is a tweet with no canonical
  bytes — pin those bytes too; every transcribed entry in the corpus
  certifies against a held byte sequence, and the battery asserts zero
  transcriptions are unpinned. verify_keller.py also prints the sha256 of
  the certificate file it verified, so two transcripts naming the same
  hash provably checked the same bytes.
- **R4 · DONE.** Sweep rows are labeled "new curve through the published
  mechanism, not coordinate-equivalence-checked against Gallagher" in
  source, text, and extra.mechanism. keller-fibers gained
  alpoge-own-target: target (0,1,0), fourth in a fixed enumeration of plain
  rational points, no published image consumed — 3 preimages certified
  blind, the map's full geometric degree.
- **R5 · DONE.** The battery row reads "llm harness — plumbing only, NO
  model has run", with the fake-proposer dry-run named in the note.
- **R6 · DONE.** CERT_CAP=1600 run: all 1,579 chowla screen survivors
  certified (1,508 HIT). The family table now says "exhausted" — terminal.
- **R7 · DONE.** certs/keller-certificate.json (11 certificates: every
  polynomial as explicit monomials with exact rational coefficients) +
  tools/verify_keller.py — Python stdlib only, zero code shared with the
  engine; re-derives the Jacobian, expands det symbolically, evaluates
  collisions, re-hashes pins, and must refute a forged coefficient before
  exiting green. Full corpus verifies in 0.2 s. Wired into make test and
  the page. Whether to post it anywhere remains the operator's call.

## Next steps, in order

1. **Higher periods at the classical parameters.** DONE through p=16, all
   recheck-clean (p=13/14/15 match Galias). p=13: 418 points, 32 orbits
   (3 min). p=14: 648 points, 44 orbits, plus the p=7 census independently
   re-derived (125M boxes, 18 min). p=15: EXACTLY 1082 points — 2 fixed, 72
   orbits of minimal period 15 — 393M boxes in 43 min. p=16: EXACTLY 1696
   points — 2 fixed, 1 two-cycle, 1 four-cycle, 7 eight-cycles (the p=8
   census's own count reappearing, as it must), 102 sixteen-cycles — 1.42G
   boxes in 3.0 h, recheck 79 converged / 0 unmatched
   (census-high-periods.json). Beyond p=16: the detach runner or a smarter
   box metric.
2. **A second map for the census: DONE (Holmes cubic).** The instrument is
   spec-general now; a third map is one spec + one family file + battery
   lines. Ikeda needs interval sin/cos (transcendental.js is sound). Holmes
   p>=5 at d=2.77 costs ~90 s/cell (tube expansion ~9/step and ~3x the orbit
   count) — those are one-off records like Hénon p=13..16, not grid cells.
3. **keller: audit BUILT, generator BUILT.** instruments/keller/sweep.js
   implements the tangent-sweep as an exact-rational recipe: for any d >= 2
   it emits a map of geometric degree d+1 with det J ≡ −2 (verified
   symbolically) and constructs 2 rational collision witnesses from a secant
   line of phi(w) = q(w) − (w/2)p(w). Calibration: d=2 reproduces Alpöge
   polynomial-for-polynomial. d=3,4,5 ship as new certified objects; higher d
   and free-coefficient sweeps are one enumerate() away. Meng–Yang's HC5 is
   audited (det Hess Psi ≡ 128 symbolically; gradient collision at
   (±1, ∓3/2, 0,0,0); the doubling identity det Hess(y·F) = −4 checked in
   the battery). Gallagher's family is audited too: the Zenodo preprint's
   seed gauge (p(0)=0, p(1)=−c, ∫₀¹p=0; det J ≡ bc; fiber degree deg p + 1)
   is implemented as fromSeed() with every seed condition verified and
   rational collisions from the linear inverse equation R(w) = wP − cQ;
   d=2..5 and the distinct member (a = −4/3, matching the paper) VERIFIED.
   The published corpus is essentially complete — Zhang's paper derives
   consequences, not new explicit maps.
   Original note: On
   2026-07-19 Alpöge refuted the Jacobian conjecture in dimension 3 (found
   with Claude; Gallagher's infinite family 07-20, Speyer's tangent-sweep
   geometry 07-23, Gao's arXiv:2608.00222 survey; n=2 REMAINS OPEN). Verified
   in-session by two independent exact routes: for
   P=(1+xy)³z+y²(1+xy)(4+3xy), Q=y+3x(1+xy)²z+3xy²(4+3xy), R=2x−3x²y−x³z,
   det J ≡ −2 is a POLYNOMIAL IDENTITY over Q (symbolic, every monomial
   cancels; hand partials cross-checked by exact Lagrange interpolation), and
   (0,0,−1/4), (1,−3/2,13/2), (−1,3/2,13/2) all map to (−1/4,0,0) exactly.
   Build the family: a corpus of the published explicit maps (Alpöge,
   Gallagher, Meng–Yang's Hessian counterexample, Zhang's consequences), each
   certified or refuted exactly; red control: one perturbed coefficient must
   break the identity. A calibration corpus whose ground truth is five weeks
   old — the exact opposite of OEIS staleness.
4. **keller-search: the fiber hunter is BUILT (keller-fibers).**
   instruments/keller/fibers.js: damped multistart Newton over a scale
   ladder, every candidate certified in a Krawczyk box on the EXACT map
   (interval-enclosed rational coefficients), dedup by certified box
   disjointness — "AT LEAST k preimages, provably distinct", k >= 2
   re-proving non-injectivity blind. Remaining from the original plan:
   ansatz-grammar enumeration (z-affine coefficient grids through the exact
   Keller filter) for the minimal-degree question, and the plane-case
   exclusions. Original note: The Alpöge
   map is z-AFFINE with coefficients in {±1..±4} — inside an enumerable
   grammar. enumerate: structured ansätze F = A(x,y)·z + B(x,y); screen:
   exact Keller filter (det J ≡ const, symbolic over Q — the instrument seed
   already exists from the audit) then float Newton on F(u)−F(v)=0; certify:
   exact rational collision or a Krawczyk box. Discovery targets, honestly
   ranked: minimal-degree counterexample (the literature is weeks old; likely
   open), counterexamples outside the tangent-sweep class, geometric-degree
   censuses ("EXACTLY d preimages, certified" — the census shape), and for
   the OPEN plane case certified exclusions: "no collision in this family,
   proved" (Moh already gives degree ≤ 100, so plane statements are
   exclusion-only until the ansatz outgrows it).
5. **Ramanujan Machine audit: COMPLETE (ramanujan-audit + instruments/cf/).**
   The flagship landed. instruments/cf/minus.js decides the zeta(3)
   minus-CF table: per-family tail bands [L(n), U(n)] proved by
   shift-and-check coefficient positivity (terminal containment + band
   invariance, exactly the HANDOFF plan, with polynomial bands where cubic
   ones cannot work), convergence proved INSIDE the certificate (monotone
   convergents, bounded below — no external theorem), and zeta(3) bracketed
   EXACTLY from its defining series (BigInt partial sum + convexity tail
   bracket, width 9.7e-17 at K=6000, 7 ms; final comparisons all in exact
   rationals). All 10 rows of the corpus SURVIVE, including both
   "new and unproven" rows at widths 2.2e-16 / 8.9e-16. Instructive
   subtlety, worth keeping: rm-z3-inv's tail recursion has s_n = n^3 as an
   EXACT spurious solution (CF value 0, adjacent to the true branch — the
   double root of c^2−2c+1); its band must exclude it (L = n^3+2n^2 is
   sharp) and that CF genuinely converges slowly — depth 1e7 gives an
   honest 2e-14, while the fast rows hit machine precision by depth 80.
   DONE 2026-08-25: the Catalan (23 rows), pi^2 (12) and ln 2 (1) sheets,
   COMPLETE — all 46 corpus rows survive; pinned rm_catalan.pdf /
   rm_zeta2.pdf / rm_other.pdf; new machinery: instruments/cf/forms.js
   (exact Möbius decision + head-shift transform),
   instruments/bigfloat/constants.js (G via proved-convexity tail, pi^2,
   acosh 2, ln 2), sign-definite-negative heads in minus.js (gated by 2
   new reds). THE LAST SHEET LANDED 2026-08-26 (rm_zeta_orders.pdf, pinned):
   all 5 double-root rows decided — the feared rm-z3-inv-grade craft turned
   out CLEAN (the sub-leading quadratic factors over Z for every row; sharp
   L = n^k + α₊n^{k−1} at N0 = 1; convergence FAST, branch gap >= 5 vs
   rm-z3-inv's 2) — 4 survive, row 3 as printed REFUTED (sign slip,
   correction certified). The corpus is 52 rows, seven sheets, complete.
   zetaBracket(s, K) shipped in minus.js.
6. **An LLM-conjecture campaign through `tools/llm-harness.py`.** Model
   proposes, engine certifies, ledger records the per-family truth rate of
   proposals that survived a float screen — an eval whose ground truth is a
   proof. The harness ships with an Egyptian-fraction demo and red controls
   that abort the run if a false proposal ever certifies; the real campaign
   needs one of our families ported behind its six-method interface. Porting
   an UNFAMILIAR family at the same time (Littlewood/Barker polynomials, or a
   Diophantine family where certify is an exact rational witness) doubles as
   the stress test of whether the interface generalises or has quietly shaped
   itself around the first five.
7. **A fast-matmul audit family (`strassen-audit`) — SHIPPED.** The family,
   instrument (instruments/strassen/tensor.js: exact tensor-identity audit
   over Q and F2, layout detected never assumed, exact-double fast path
   cross-checked against BigInt), battery (23/23: Strassen-7 calibration,
   composition reproduces rank-49, three reds), pinned AlphaTensor npz
   sources + stdlib converter with a shimmed unpickler, detached
   certificate (certs/strassen-certificate.json) and stdlib verifier
   (tools/verify_strassen.py, 0.2 s, prints its own sha256). Flagship
   decided both ways: rank-47 4x4 VERIFIED over F2, REFUTED over Q.
   REMAINING: AlphaEvolve's 48 (fetch + pin its factor list when a
   canonical byte source is located), more npz keys, and the LLM campaign
   (item 6) now has its natural corpus. Original note: Fast matrix
   multiplication algorithms ARE certify-shaped objects: "4x4 in 48
   multiplications" (AlphaEvolve 2025) is a rank-48 decomposition of the
   <4,4,4> tensor — finitely many exact coefficients whose triple-product
   sum must equal the matmul tensor IDENTICALLY, over a stated ring. That
   is the keller-audit shape wholesale: transcribe the published zoo
   (Strassen 7 for 2x2 — the calibration with the textbook answer;
   Laderman 23 for 3x3; Smirnov's catalog; AlphaTensor's mod-2 rank-47;
   AlphaEvolve's 48), pin the sources, certify each as an exact
   multilinear identity (the keller polynomial arithmetic already
   suffices), red control: one perturbed coefficient must break it. The
   certificates detach even more cleanly than keller (sums of triple
   products of small rationals — a tiny stdlib verifier). And it is the
   NATURAL corpus for item 6's LLM campaign: "propose a rank-<=49
   decomposition of <4,4,4>; the engine certifies" is the one game where
   model-proposes-verifier-decides already produced a famous discovery, so
   the eval has a literature baseline. (What this is NOT: matmul speed is
   not one of OUR bottlenecks — census box counts and BigInt expansion
   are; the value is the corpus, not the kernel.)
8. **Portable certificates: the keller class is DONE (R7).**
   certs/keller-certificate.json + tools/verify_keller.py is the pattern:
   detach the claim as explicit exact data, re-verify with stdlib only, red
   control inside the verifier. NEXT candidates: the census boxes (finitely
   many intervals plus one contraction inequality each — the natural second
   class), the minus-CF tail bands (the certificate is four polynomial
   positivity facts + one backward iteration, ideal for a tiny checker), or
   a Lean export — and the 54.6M proved negatives as a labeled dataset.
9. **More Krawczyk families.** Any parameterised nonlinear system: steady
   states of reaction-diffusion, roots of polynomial systems.
10. **Do NOT go back to closed-form hunting over curated corpora.** OEIS was the
   right calibration target and the wrong discovery target, and the reason is
   structural and predictable in advance. (The keller and Ramanujan-Machine
   corpora are not this: their claims are new or conjectural, and decidable by
   our instruments.)

## The report shelf (gems verified against the records, 2026-08-25)

Five things already in the records that could stand as research-style
reports; the first two are hidden gems — results the machine holds that
nobody has written down. Ranked by readiness x novelty:

0. **The erdos852 refutation — SHIPPED (reports/erdos852.html).** "The
   constant that was a rounding error": both #852 constants certified, the
   published C* refuted at digit 12 and shown to BE the naive IEEE-754
   product (87% of factors round to 1.0 and vanish; the naive value
   reproduces the published digits exactly, re-run live at build time).
   The build refuses if any verdict, digit, or the mechanism moves.

1. **The impostor catalog — SHIPPED (reports/impostors.html).** The 21
   exact-BigInt refutations as a report; every number recomputed from the
   corpus at build time (tools/build-report-impostors.js, which refuses to
   build if the records change). Measured agreement depths, in the exact
   relative sense (largest d with gap <= value·10^-d — a mantissa-prefix
   count lies for values like 0.199…9 vs 1/5): A271880 impersonates 1/5
   for 62 significant digits (six spellings refuted at 105 published
   digits); A181284 -> 3/11 for 58; A359187 -> 1 for 44; A226120 -> 1 and
   A266296 ("close to 24, related to the Ramanujan constant") -> 24 for 16
   each. Range 16–62: from "barely past double precision" to "passes any
   screen ever used to announce a discovery".
2. **Certified entropy — INSTRUMENT BUILT, BOUND CERTIFIED, REPORT SHIPPED
   (instruments/entropy/ + certs/entropy-henon.json + reports/entropy.html).**
   h_top(Hénon, 1.4, 0.3) >= 0.301680, a theorem: 340 pairwise-disjoint
   h-set parallelograms, 4,140 covering relations at durations k = 1..6
   (strict interval inequalities, adaptive bisection, outward rounding),
   COMPOSED to the uniform iterate F^11 as BINARY relations and bounded by
   an exact integer spectral argument; one consumed external theorem
   (Zgliczynski–Gidea covering relations -> subshift semi-conjugacy), used
   the way Krawczyk's is. Calibrated where the answer is known: at a=6 the
   instrument certifies the FULL 2-shift, h >= ln 2 exactly. The battery
   (12/12) re-proves the whole detached certificate every run. THE TWO
   SOUNDNESS BUGS, both caught by impossible numbers, both now gated:
   (1) counting mixed-duration paths as distinct itineraries gave
   h >= 0.61 > true 0.465 — a duration-2 relation constrains nothing at
   its intermediate time, so paths with different visit-time sets can
   realize the SAME orbit; fix: binary uniform composition, plus a
   semantic red control (the exact-ln2 horseshoe must stay at ln 2 under
   mixed durations). (2) A lids-only image condition certified a
   golden-mean 2-box graph under F converging to ln phi = 0.4812 > 0.465 —
   an image part hovering in the slab above the target interior lets a
   finger poke in and retract; fix: forbid the full slabs {|u|<=1,
   |s|>=1}. An interim commit recorded 0.356403 under the lids-only
   condition; that number was TAINTED and is superseded — the sound bound
   is 0.301680, 65% of the census ceiling 0.4648. NEXT for the gap: boxes
   sized to local expansion, more durations, denser cores.
3. **The zeta(3) audit report — SHIPPED (reports/zeta3-audit.html).**
   Verdicts re-certified, the source re-hashed, the Apery certificate
   checks printed verbatim, and the spurious-solution lemma re-proved as an
   exact polynomial identity at build time; the build fails otherwise.
4. **The keller moduli question.** sweep.js parametrizes counterexamples by
   the free coefficients c_3..c_d — an unexplored moduli space, and the
   R4 label ("coordinate-equivalence unchecked") is itself the open
   question: how many inequivalent counterexamples per geometric degree?
   Needs an equivalence-testing instrument + a coefficient sweep. The
   literature is weeks old; nobody holds this.
5. **The bug catalog.** Six real bugs, all found by controls or
   calibration, none by reading code — sqrt(2) refuted as its own closed
   form, the bisection-line zero, the fat-record stall, undamped-Newton
   blindness, unreduced-fraction inflation, the missed sheet row caught by
   byte pins. An experience report where every claim is `make test`.

## The sin-mfg vein (mined 2026-08-25 — read-only dig; ideas, not process)

Four parallel agents read the whole lab. The gold, ranked by fit to this
engine (full specs live at the quoted sin-mfg paths; that tree is
READ-ONLY, lift numbers by transcription + pin, never by edit):

1. **erdos852-constants — MINED (2026-08-25), and it paid.** Both constants
   certified (instruments/erdos852/ + families/erdos852-constants.js), and
   the C* audit found the published value WRONG at its 12th significant
   digit — a certified refutation of a live-thread constant with the
   generating bug identified (naive double product; factors 1 + 1/(p-1)^3
   round to 1.0 for p > ~2e5) and reproduced digit-for-digit in the
   battery. Sources pinned (erdos852_page/thread.html). The report shipped
   (reports/erdos852.html) and the CORRECTION PACKAGE is built and gated:
   detached certificate (certs/erdos852-certificate.json) + stdlib verifier
   (tools/verify_erdos852.py) + paste-ready comment
   (outreach/erdos852-comment.md — every number in it re-verified: the 2^53
   threshold is p-1 >= 208064, the missing mass measures 9.1e-13, the
   snippet runs verbatim). STATUS 2026-08-25 (operator rulings): (a) the
   comment is POSTED and sits in the site's MODERATOR-APPROVAL queue
   (operator-confirmed; two cache-busted public fetches still show 7
   comments, consistent with that) — do not cite it as public until a
   fetch of the thread shows it, then snapshot the thread as evidence
   (the dated note in outreach/erdos852-comment.md is the record); (b) OEIS:
   ON HOLD by operator ruling — neither constant has an A-number (corpus
   grep: 0 matches), two submittable sequences whenever the hold lifts,
   operator-authored only (OEIS forbids AI-generated submissions);
   (c) A078515 extension (27 terms, primes to ~2e11, Alexeev invited)
   remains a separate detach-runner compute job. Occupancy lesson applied:
   page + thread + /proof-claims all fetched; 0 claims there.
2. **The Mercer/Newman mu-lambda continuation — COMPUTE SIDE OPENED
   (2026-08-25).** Built in-tree: instruments/trigmin/sweep.js — the
   exhaustive box cascade (stage-W integer kills at roots of unity — 4|f|^2
   is an INTEGER at m=2,3,4,6; dyadic exact kill via a Chebyshev VALUE
   recurrence, no polynomial assembled; full certification of survivors;
   conservation identity that THROWS; orbit classification with
   primitive-first tie-break — every sin-mfg lesson encoded). CALIBRATED
   cross-lab: Goddard's 1992 box re-closed in 0.7 s with the source lab's
   exact counts (142,506 / 104,468 W-kills / 2 survivors / same champion
   floor), and the mu(9) box30 six-survivor two-orbit structure reproduced,
   published witness at 1.3623731781333241 to the last digit — 16x faster
   than the source run. Battery sweep-battery.js 20+/0 incl. a 100%
   kill audit and 7 reds. NEW THEOREM: **M(0,1,2,6,9) = 1 EXACTLY**
   (certifyMinEqualsOne: |f|^2 − 1 = (y+1)·H, H(−1)=92 > 0, Sturm counts 0
   roots — the equality tie no enclosure can decide, from Mercer's own
   witness; the vein's "exact M(0,1,2,6,9)=1" item, done). The mu(10..17)
   box30 ladder is RUNNING (tools/run-mu-table.js → certs/mu-table.json,
   battery-gated rows). THE LADDER LANDED: certs/mu-table.json holds
   n = 9..17 box30, 752M sets exhausted, all champions battery-re-certified
   byte-identically and ADOPTED into the envelope (dated edit); mu(10..17)
   are the first rows anyone holds; n=9 validates cross-lab. Two design
   upgrades earned mid-run: a DYNAMIC rising bar (a weak seed cost days
   under the fixed bar when the n=11 insertion-seed certified at 0.925 —
   with the ratchet it costs minutes; kills against an earlier lower bar
   stay valid a fortiori) and hill-climb seeding.
   BIGGER BOXES LANDED (2026-08-26, certs/mu-table-40.json, battery-gated):
   mu(10) box40 champion {0,1,4,7,8,13,22,24,32,34} floor 1.420064490311554
   (box30 gave 1.3236 — the ceiling 30->40 raised the certified bound past
   even mu(9)'s 1.3782, killing the "dip" reading at n=10); mu(11) box40
   {0,2,4,12,19,20,24,25,27,30,33} floor 1.546098106216827 (box30 1.5346);
   mu(12) box40 champion {0,1,11,12,16,18,19,21,24,25,27,33} floor
   1.6889690211416546 (box30 1.5536 — the biggest box-extension gain yet,
   +0.135). 273M + 848M + 2.31G sets exhausted — 3.43 BILLION verdicts in
   the three wider boxes — 2 survivors each, orbits unique, every champion
   battery-re-certified byte-identically. The box30->40 lesson, three for
   three: at n >= 10 the box30 maxima were CROWDING artifacts; ceilings
   matter, and box50 at n=10..12 (C(50,k): 2.5G..27G) is the next rung.
   THE LAMBDA HALF LANDED (2026-08-26, instruments/trigmin/lambda.js +
   lambda-battery.js 18/0 + certs/lambda-table.json, 18 rows):
   ALL NINE source-lab rows REPRODUCED exactly — n=4 box20 down to the
   per-stage split (W=2818, the sin-mfg measured count) and the 12dp
   values; proved closed forms computed never remembered (9/8 exact,
   (17+7*sqrt7)/27 via certified sqrt); the wrong-endpoint bar refused BY
   NAME and its disaster demonstrated. NEW rows nobody holds:
   lambda(13) <= 2.31823265015213  {1,2,3,4,5,6,7,9,10,11,12,13,16}
   lambda(14) <= 2.320690691854875 {1,3,4,5,9,10,12,13,14,17,22,23,26,27} (M=30)
   lambda(15) <= 2.4189121268958322 {1,2,3,4,6,7,8,9,10,11,12,14,18,20,21}
   lambda(16) <= 2.454832753027949 {1,2,3,4,5,6,7,8,10,11,13,14,15,16,17,21}
   lambda(17) <= 2.5648971205451674 {1..15,19,22}
   DEEPENED n=9..17 to M=30 (2026-08-26 finished the 13..17 half: 685M
   sets in five parallel detached runs, sidecar + merge phases in
   run-lambda-table.js): n = 9..13 and 15..17 CONFIRM their M=25
   optimisers; lambda(14) IMPROVED from 2.366350427056568 to the value
   above — its M=30 optimiser reaches exponent 27, entirely outside the
   M=25 box, killing the "near-interval structure continues" reading at
   n=14. The n<=13/15..17 values are certified at depth 30.
   MERCER §6: DONE AND EXCEEDED (2026-08-26) — not just m=7,8 but the whole
   ladder to m=20, certified (instruments/trigmin/mercer6.js + 32/32 battery;
   see the mu(5)-ladder block above).
   Still queued: mu box50+ (wants worker sharding), Boyd 1986 (ILL/purchase)
   before any novelty prose.
   Original note: sin-mfg holds certified
   mu(6..9) — mu(9) floor 1.3781877 STRICTLY BEATS Boyd's published
   witness 1.3623731 (certified floor above certified ceiling) — and a
   lambda(4..12) table with NO published rows past n=6. Never run: mu(10..16);
   n=17 (first term-count with no printed mu>1 anywhere); exact
   M(0,1,2,6,9)=1; Mercer §6 at m=7,8 (each improves mu(5) <= 1+pi/m, a
   40-year lineage); Mercer §5's unexecuted lambda(4) proof strategy. Our
   trigmin/newman instruments are the same shape — they were lifted FROM
   there. Report-grade material already in hand. Blocking novelty check:
   Boyd 1986 (LMS LNS 109) is unread — archive.org diophantineanaly0000aust.
   PROBED 2026-08-25: the item is access-restricted (lending only; the OCR
   text 401s). OPERATOR RULING same day: the archive.org borrow is NOT
   available to them. Remaining routes, from the sin-mfg hunt's own
   ranking: interlibrary loan, a library copy, or Cambridge purchase
   (explicitly the LAST resort). Until one lands, every mu-table sentence
   stays at the referee-grade framing already in use — "first CERTIFICATE",
   exhaustion over a named box, never "first witness" — which three
   secondary sources (zbMATH review + HJ §8.1 + Goddard p. 319) support
   without the paper. The COMPUTE side was never gated and is now DONE
   through n=17 (certs/mu-table.json); lambda continuation also ungated.
   (research/probes/mercer-program/.)
3. **Erdős #290 continuation.** The 4k(k+1) square-discriminant law is
   proved + blind-confirmed at k=6 (disc(f_168), 45,336 digits, perfect
   square by CRT). Honest boundary: the GROUP at d=168 undetermined; sweep
   past l=60 shrinks the c-enclosure by exactly 1/(2l(2l+1)) per degree.
   OEIS submission for 1/(1+c) = 0.546229310400104587… posted 2026-08-04,
   unanswered. (research/challenges/erdos290/.)
4. **Erdős #979 decade 15 — the background treadmill.** Two independent
   exhaustive engines, checkpoints at done:true nextLo=1e14; ~55 h
   detachable compute, zero build cost, P(a(6) hit) ~0.10-0.15. Perfect
   detach-runner fodder under ANY front. (research/probes/erdos979-a385316/.)
5. **AI-claims audit targets with full specs, never built:**
   kuperberg-six-unit-cylinders (2,954,984 exact rational cases,
   deterministic verifier, peer review pending); levit-mandrescu
   nonunimodal independence polynomial (degree-2037 BigInt, exact valley
   a1094 > a1095 < a1096, whiskering identities listed); erdos-684 (re-check
   a refuted Lemma 18 in exact binomial arithmetic). Each is one family
   file here. (research/challenges/SCOUT_2026-08-04_CLAIM6.md.)
6. **The Apéry/Sturm irrationality-race decider — spec'd, never built.**
   Input: an Apéry-like recurrence (integer char poly + denominator-growth
   exponent); decide the irrationality inequality by certified real-root
   isolation. Green control: zeta(3)/Apéry must PROVE. Red control:
   zeta(5)/Zudilin (mu^3+2368mu^2-752mu-16) must REFUSE — zeta(5) is open,
   so an instrument that proves it is broken. Natural sequel to our
   ramanujan-audit; the two bibliographic requisites (the inequality
   stated correctly; the exponent per recurrence) must be read out of the
   literature, not remembered. (research/challenges/apery-obstruction.html.)
7. **Chowla structured arm + a conjecture-mining observation.** Their
   certified flat ratios mu_lo(n)/sqrt(n) in [0.4165, 0.4635] across
   n=5..19 from two unrelated regimes point at alpha = 1/2 on Boyd's named
   open conjecture (no alpha is conjectured anywhere in print). Caveat
   recorded: box maxima are lower bounds; flatness could be search-effort.
   Also: Shvets arXiv:2604.06239 PROVES the Machine's Z2 = 12/(7 zeta(3))
   — our rm-z3-new2 row's identity — cite it in the zeta3 report's next
   revision. And their scout found NO record of any RM conjecture ever
   refuted; a status registry is an unoccupied niche.
8. **Blocked but named:** Erdős #513 upper bound (ANY rigorous c > 0 in
   B <= 2/pi − c is the first movement since 1964) — blocked on the
   paywalled Clunie–Hayman 1964; do not start without the paper.

Instrument-design lessons paid for there, worth adopting: stage-W exact
kills at roots of unity (integer arithmetic killed 73-99% of boxes before
any float); cascade economics (their certify was 1018x the kill stage —
design kill tiers first); a conservation identity per shard AND globally;
the inf/sup direction traps (a bar taken from the wrong endpoint silently
killed a true champion); dilation/reversal orbits classified before
tie-breaking (a string sort once nearly published a dilated copy as a
discovery); publish brackets, never values, for anything known only
between two evaluated points; round lower bounds DOWN; and wire every
outside cross-check into CI or it rots (their eqcert-crossval emitted 671
claims that were never validated — the check existed and was never run).

## The rule for changing front

A front is worth another run while the marginal run still moves one of three
numbers: **discovery yield** (new certified objects nobody holds), **instrument
yield** (bugs found, capability gained), or **audience yield** (a certified
artifact placed in front of the right reader — added by the 2026-08-26 SHIP
ruling, and DOMINANT until S1-S2 ship). The OEIS run scored 0 discovery and high
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
