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
        generated page via design/template.js; the project has a
        provisioned analytics id but enabling it is DASHBOARD-ONLY
        (one toggle: project -> Analytics -> Enable) — no public API;
        works instantly once toggled, no redeploy needed;
    (3) post the #510 comment (operator's erdosproblems login; after (1),
        since the comment cites the certificate URL).
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
S3. THE EVAL (promoted) — model-proposes-engine-certifies over the
    strassen corpus: per-model certified truth rates, false positives
    provably false; shipped as corpus + stdlib graders + a small
    leaderboard page. The one artifact whose value curve has no operator
    in the denominator; the direct frontier-lab bridge.
S4. THE NEW-CLAIMS SWEEP — a per-session fetch/diff tool over the claim
    surfaces (RM results pages, erdosproblems proof-claims, arXiv
    constants) feeding the registry. A tool run each session, NOT a cron;
    scheduling is a later operator opt-in.
S5. THE MERCER PROGRAM REPORT — writing slot: the mu/lambda tables, the
    m = 5..20 bracket ladder, M(0,1,2,6,9) = 1, cross-lab replication to
    the kill-split digit. "First CERTIFICATE / named box" framing; Boyd
    1986 (unread; ILL) gates "first witness" prose only.
S6. THE METHODS NOTE — the bug catalog (~9 real bugs, every one caught by
    a control, calibration, or impossible number — none by reading code),
    red controls, conservation identities, screens-never-admit;
    MATH-AI-workshop shaped; carries the co-sign invitation (He-Tang,
    mzn are the natural first contacts). Framing per the replicability
    read: the moat is the discipline and the dated public record, never
    the code — others replicating it after publication is the GOOD
    outcome.
S7. THE LEAN BRIDGE — the C* refutation exported as ONE Lean-checked
    integer inequality; the standing answer to the bespoke-JS-stack
    objection.

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

STANDING RULE while S1-S2 are unshipped: no new instruments, no new
families; new math only where a report needs a missing number. The build
menus further down are PARKED, not deleted — their technical context
stays correct and current.

## State, measured at handoff

```
819,145  objects generated across 11 families
 16,936  certified exactly
54.6M    closed forms: 54,635,424 tested = 54,634,508 refuted (double)
         + 21 refuted (exact BigInt) + 877 form-on-record + 0 open + 18 surviving
         — the decomposition closes, and the engine REFUSES a ledger where it does not
         (the 18 survivors: trivial strassen self-matches — an integer rank enclosure
         [47,47] "survives" 47/1 and sqrt(2209), as it must; every erdos852 and
         ramanujan enclosure refuted or outranked its vocabulary forms)
    228  existence-AND-uniqueness theorems (Krawczyk)
    452  COMPLETENESS theorems (census: Hénon 328/328 + Holmes cubic 124/124, 0 refusals)
  1,579  chowla screen survivors EXHAUSTED (1,508 certified below 1 — the family is terminal)
     11  keller corpus certificates: Alpöge n=3 + ONE padded row stating the stabilization,
         3 tangent-sweep instances, Meng–Yang HC5, Gallagher d=2..5 + the distinct member —
         every det a symbolic identity over Q, sources hash-pinned, ALL 11 re-verified by a
         standalone stdlib-Python checker in 0.2 s
      7  fibers cells HIT blind, incl. alpoge-own-target: target (0,1,0) chosen from a fixed
         enumeration, never published anywhere, 3 preimages certified — witnesses AND target self-chosen
     51  Ramanujan Machine conjectures SURVIVE an UNCONDITIONAL audit — ALL SEVEN
         sheets COMPLETE: e, pi, zeta(3), CATALAN (23 rows), pi^2 (12), ln 2 (1),
         mixed-zeta-orders (2026-08-26, 5 rows + 1 corrected row) — including ALL
         39 rows the Machine marks "new and unproven"; PLUS the FIRST certified
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
