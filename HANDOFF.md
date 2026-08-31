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

## TASKS BACKLOG — the standing menu (updated 2026-08-31, generation front BUILT)

Kept current at every handoff; a session that changes any task's state
updates this menu in the same commit (CLAUDE.md rule). Grouped by who acts.

SESSION 2026-08-31b — CHOWLA'S COSINE PROBLEM: MACHINERY BUILT, TARGET CLOSED
(operator: "can we work more on Chowla's Cosine Problem? Consult sin-mfg" —
and consulting sin-mfg is what killed it. Read that lab FIRST next time.)

  VERDICT: THE SMALL-c SEARCH IS DEAD. Do not reopen it. Two independent
  reasons, either one sufficient:

  1. OCCUPIED, and sin-mfg had already ruled so. Its chowla-cosine probe
     carries a literature gate dated 2026-08-20 (confidence 9/10):
     "Candidate 2 - explicit sets with small normalised minimum (c <= 0.6460
     at n=20): OCCUPIED", by Mercer (INTEGERS 19 (2019) #A4) and Bedert
     (arXiv:2509.05260). Their own funnel had already reached c <= 0.6460 at
     n=20. OUR RUN REACHED 0.778 — WORSE THAN WORK ALREADY ON DISK.
  2. CONJECTURALLY IMPOSSIBLE. Bedert, quoted in that gate: K(n) << sqrt(n)
     is the best known upper bound and "Chowla conjectured that this is
     sharp". Since c = K(n)/sqrt(n), Chowla's own conjecture says c is
     bounded BELOW. Epoch's problem page says the same in its own words:
     solving it "would disprove Chowla's conjecture", and "there is also a
     risk that Chowla's conjecture is true, in which case the problem is not
     solvable."

  OUR OWN DATA AGREES WITH THE CONJECTURE, which is the honest null:
     n     10      15      20      25      30
     c <= 0.6558  0.7073  0.7781  0.7733  0.8205        (certs/chowla-records.json)
  RISING with n and parked near the folklore constant 1/sqrt(2) = 0.7071. A
  factor of ~15 from the 1/20 landmark with no trend toward it. A folklore
  family (A = positive differences of a perfect difference set) already gives
  c -> 1/sqrt(2) at EVERY n of its shape; our best beat it at no n.

  WHAT WAS BUILT AND IS WORTH KEEPING: machine/generate/chowla.js (float
  screen + exact certify + classical baselines REBUILT here, so no lift is
  needed), proposers/setwalk.js (the free hill climb), tools/run-chowla-front.js.
  Calibrated 3-for-3 against sin-mfg's exhaustive champions and it
  independently REDISCOVERED the n=10 champion 0.655838. The machinery is
  sound; the target is not. No report page was built - there is no result.
  The degree wall is now refused rather than endured (Mian-Chowla at n=30
  reaches 1312 and hung the first smoke test).

  THE ONE LANE STILL OPEN, and it is about the VERIFIER, not the mathematics.
  Epoch's page admits "the verifier uses a numerical sampling check, so there
  is a small risk there". It is a bigger risk than that, DEMONSTRATED with
  certificates: A = 40320*{1..24} has max(A) = 967,680, legal under Epoch's
  own <1e6 ceiling, and its TRUE certified merit is c = 1.189981 - a bad set.
  A 1000-point grid sampler reports apparent c = 0.2041 (it would pass a
  c=0.25 bar; plain undersampling, no adversarial alignment). A sampler whose
  resolution DIVIDES 40320 reports min f_A = +24, i.e. "never negative at
  all", passing ANY c. Only at M >= 100,000 does it approach truth, and it
  still under-reports. Structurally a grid needs M >~ max(A) because f_A has
  degree max(A); Epoch permits max(A) up to 1e6.
  We reach degree 967,680 with a certifier walled at 400 ONLY because
  dilation invariance c(N*S) = c(S) is a theorem.
  This is also the lane sin-mfg's gate left open: Candidate 1, "certified
  enclosures as a verification method exceeding numerical sampling", ruled
  PARTIAL rather than occupied.
  PROPOSED, NOT DONE, AND NOT SENT: report the sampling gap to Epoch as
  benchmark hardening. Submitting such a set to SCORE would be fraud - it
  violates the bound by ~5x while dressed to pass. Third-party send, so it
  waits on the operator's word like everything else in outreach/SEND-QUEUE.md.
  Caveat to carry: Epoch's actual sampler (resolution, grid vs random,
  adaptive) is unknown, so this proves the CLASS is exploitable, not that
  their verifier is broken.

  IF THIS FAMILY IS WORKED AGAIN, the live targets are in sin-mfg's
  mercer-program probe and are about mu/lambda, not small c: n = 17 (first
  term-count case with no printed demonstration of mu > 1); certifying
  Hare-Jankauskas' 19-term degree-38 polynomial has min >= 2; Mercer's §6
  reduction at m > 5. Honest framing there is "certified where nothing
  certified exists", never "progress on Chowla".

SESSION 2026-08-31e — THE GLIDE BAND IS BUILT. reports/glide-band.html

  Operator: "Build #2 ... report + interactive dashboard ... BOLD on the
  comparison." Built on SkyAudit's implementation map: app dir with a battery
  as the page's gate, sha256-pinned data, every number computed at build.

  WHAT IT IS. Engine-out reach on a REAL pinned flight — N412JS, a PC-12
  single-engine turboprop at FL240, adsb.lol 2026-08-26, read through
  apps/skyaudit's own day pin — against 650 airfields from OurAirports
  (public domain, pinned). Interval arithmetic over the glide model gives an
  inner boundary (reachable for EVERY value in the envelope), an outer
  boundary (reachable for NONE), and the annulus between. 288 states: 36
  cruise positions x 4 wind presets x 2 forecast modes, all decided at build.
  Interactive: scrub the trajectory, switch wind, toggle the forecast mode.

  THE HEADLINE IS NOT THE ONE THE SCOUT EXPECTED, AND IT IS BETTER.
  The comparison is not "their ring is too big". It is that while the panel's
  assumed inputs sit inside the honest envelope, its line ALWAYS falls between
  the two certified boundaries — so nothing inside it can ever be proved
  unreachable. The single line cannot be caught being wrong, and is never
  shown to be right either: 57% of what it claims is undecided by the evidence
  it was drawn from. An instrument that cannot fail a test is not passing one.
  The build GATES this: a mode-0 refutation would refuse the page.
  Reverse the winds-aloft forecast — a documented failure of the input the
  ring leans on hardest — and 1356 site-states inside that same line become
  provably unreachable. The line did not get less accurate; it became
  FALSIFIABLE, and was falsified.

  TWO NEAR-MISSES WORTH REMEMBERING.
   · The first battery had a red control that fired VACUOUSLY — an
     assert.ok(false) at the end guaranteed it regardless of the loop above.
     That is sin-mfg's vacuous-green failure reproduced from scratch. It is
     now a real mutant that grades against the nominal ring.
   · The first route to refutations was going to raise a "book glide ratio"
     until crosses appeared. That is tuning a number until the story works.
     The honest case — a reversed winds-aloft forecast — needed no tuning.

  A CORRECTION TO SESSION d, and it runs against me: I wrote in targets.json
  and in a commit that SkyAudit ingests NO ADS-B. IT DOES, DAILY.
  apps/skyaudit/audit/ingest-day.js downloads an adsb.lol day, pins it,
  extracts, certifies and re-flies; eight pinned days are on disk. I had read
  only SOURCES-PINS.json (the regulatory PDFs) and concluded there was no
  feed. "Zero new data" HOLDS for the ADS-B track board. The second half of
  that row stands and is the half that matters: the traces are self-reported
  position/alt/gs/track with no pseudoranges, so GNSS-solution infeasibility
  is still undecidable from them and kinematic infeasibility is still the
  honest scope. Row corrected.

  HYPOTHESES, STATED ON THE PAGE RATHER THAN BURIED. H1 terrain is not
  modelled — and the asymmetry is load-bearing: REFUTED is unaffected and
  stays proved, PROVED REACHABLE means "if the path is unobstructed". H2
  steady state. H3 spherical earth enclosed pole-to-equator. H4 the envelope
  is a STATED scenario — no manufacturer performance figure is asserted
  anywhere, and nothing claims what any particular product computes
  internally; what is compared is the point-estimate METHOD.

  WORDING: "certified" always means a mathematically certified enclosure, no
  airworthiness meaning; the artifact carries NOT FOR NAVIGATION on its face.

  EVOLVED SAME SESSION (operator: "use illustrative scenarios to fill the
  parameters missing ... evolve the report"). Two additions carried it.

   · FIVE ILLUSTRATIVE PACKS replace the single anonymous envelope: trainer,
     high-performance single, turboprop propeller FEATHERED, turboprop
     propeller did NOT feather, glider. Each is a stated class with a stated
     envelope AND the glide ratio the panel would be CONFIGURED with. The
     fourth pack is the whole point and it is a better scenario than the
     reversed forecast, because nobody had to choose a value to make it bite:
     same aircraft, same flight, one action short, and the failure is not a
     bad number but an EVENT THE INSTRUMENT CANNOT OBSERVE. The panel keeps
     drawing the feathered ring because nothing tells it otherwise.
   · THE TURN (H5): height lost turning onto each field at standard rate from
     the aircraft's ACTUAL ADS-B ground track, charged to BOTH instruments so
     the comparison stays about method. The band is now visibly asymmetric
     about the flight path instead of a ring centred on the aeroplane, and it
     uses real pinned data rather than another assumption.

  THE THREE NUMBERS NOW, all gated at build:
     panel inside the envelope   54% unproved,  0 refutable  (structural)
     propeller did NOT feather   29% of the same line's claims REFUTED
     forecast 180 degrees out    27% REFUTED
  Philadelphia International is among the refuted rows in the no-feather
  scenario — a major airport the line shows inside reach and the band proves
  is not.

  NEXT ON THIS FRONT: terrain (H1) over a pinned DEM — same arithmetic, and it
  can only ever cost green claims, never add them. AND ONE THING TO SCOUT
  BEFORE ANY OUTREACH: TAWS is mandated equipment and its predictive
  terrain-clearance component has this same uncertainty structure. If that
  holds up at the source, terrain-aware reachability has a COMPELLED BUYER
  where the bare glide ring does not — which would move this front from demo
  to market. Read the actual rule before saying it out loud.

SESSION 2026-08-31d — THE READING SESSION. NOTHING BUILT, FOUR THINGS SETTLED.

  The instruction was to read, not to build, and nothing was built: no
  instrument, no gate, no battery. The only file changed is
  corpus/targets.json, which is memory and refuses nothing.

  1. THE 0.54 IN VAN DOORN IS OURS TO SHARPEN, AND WE ALREADY HAVE.
     Read from his Theorem 8, not the abstract. It is TWO-SIDED:
       0.54 < liminf (b(a)-a)/log a < 0.61
     Lemma 31 gives the lower endpoint 1/(1+c), Lemma 30 the upper 1/(2c),
     Lemma 32 supplies 0.82 < c < 0.85, and BOTH constants are those two
     expressions rounded to two decimals. So 0.54 -> 0.546 is a genuine
     sharpening of a published theorem statement. It is already banked.

  2. THE FOURTH DIGIT IS AN OEIS DIGIT, NOT A THEOREM DIGIT.
     No theorem anywhere states this constant to four places. The earlier
     framing — "a fourth digit is a sharper constant in a published theorem"
     — was overstated, and targets.json now says so. Chase the fourth digit
     for the sequence entry if at all.

  3. THE OTHER CONSTANT, 0.61, IS IMPROVABLE RIGHT NOW FOR FREE, AND NOBODY
     HAS SAID SO. The upper endpoint 1/(2c) needs a LOWER bound on c, and a
     lower bound needs no tail lemma at all — the unpinned tail is charged 0.
     Our certified c >= 0.830416407911 gives liminf < 0.6021076 immediately.
     Theorem 8 would read 0.546 < liminf < 0.6022, the published interval
     narrowing from width 0.07 to 0.0562, on data already certified and
     already public. Every public artefact from this project — the report
     page, both issue-164 comments, the OEIS packs — speaks only about
     1/(1+c). NEW TARGET ROW: erdos290-upper-constant. The direction of
     Lemma 30 must be read at the source before this is stated publicly;
     the arithmetic is checked, the reading is not.

  4. THE DELTA-WINDOW TARGET IS REPRICED, AND ITS UNSCOUTED FIELD IS CLOSED.
     · The window that buys the fourth digit is delta in (0.0990, 0.5156],
       not [0.293, 0.493]. Wider on the low side, TIGHTER on the high side,
       and both ends within ~3% of the free bounds — so a lemma that only
       just clears them is worthless. Width 0.1 near 1-e^(-1/2) clears both.
     · THE FRAMING WAS WRONG. delta = 1 - E[2^(-fix)] presupposes the sign
       kernel K = G ∩ C_2^l is large. Given that, Jensen (2^(-t) convex) plus
       Burnside (E[fix] = 1 for any transitive image) gives delta <= 1/2 with
       no primitivity, no Jordan, no group identification at all. The target
       is the KERNEL, not the image. K in {0, diag} is the dangerous case.
     · WHAT IS KNOWN UNCONDITIONALLY: nothing. van Doorn's Lemma 32 proof is
       verbatim a PARI/Magma run — irreducible for even d <= 500, group for
       even d <= 60 — so irreducibility of f_d is NOT a theorem for large d,
       and his Lemma 38 assumes it. No literature on Gal(f_d) exists; the
       family appears to be studied nowhere else. The nearest published
       analogue (arXiv:2510.18857, random reciprocal polynomials) is
       probabilistic and gives no purchase on a fixed d.
     · UNTRIED ANGLE, recorded not attempted: f_d(0) = (-1)^d d!, leading
       coefficient d+1, h(0) = (-1)^l (l!)^2 — Dumas/Newton-polygon at primes
       dividing d! is exactly the Filaseta-Trifonov machinery for Bessel and
       generalized Laguerre. Nobody has pointed it at f_d.

  5. A CITATION IS WRONG IN THE PREPRINT, AND IT MATTERS BEFORE ANY SUBMISSION.
     The composition-discriminant step is credited to Altmann-Awtrey-Cryan-
     Shannon-Touchette 2020 with the claim that handling the NON-MONIC factor
     d+1 is the new part. AACST2020 is about x^8 + a x^4 + b and carries no
     general composition law; and the general NON-MONIC law is already
     written down — John Cullinan, "The discriminant of a composition"
     (faculty.bard.edu/cullinan/disccomp.pdf), explicit in the leading
     coefficients, hypotheses satisfied here since Res(h, x^2) = (l!)^4 != 0.
     Unclaimed part: only the 4k(k+1) characterisation itself. van Doorn's
     paper contains no discriminant and no square anywhere (grepped in full).

  SEND STATE. outreach/issue164-PASTE.md was NOT unsent — it was posted
  verbatim to teorth/erdosproblems#164 on 2026-08-31T18:47:28Z. A follow-up,
  outreach/issue164-PASTE-2.md, was posted on the operator's word at
  2026-08-31T20:21:11Z (comment 5484039660): the two-sided Theorem 8 and the
  0.61 -> 0.6022 endpoint, the fourth-digit repricing, the kernel-not-image
  sketch with its irreducibility blocker, and the Cullinan citation
  correction. Write "problem 290", never "#290", in that repo — a bare #290
  auto-links to an unrelated issue; caught and edited out after posting.
  STILL UNSENT: the two OEIS packs.

SESSION 2026-08-31c — #290 CLOSED, AND THE NEXT MOVE IS READING

  **START THE NEXT SESSION BY READING, NOT BUILDING.** The single open target
  worth work is `erdos290-delta-window` in corpus/targets.json, and its
  `unscouted` field is the whole instruction: what is known unconditionally
  about Gal(f_d) and its image in S_l — including whether f_d is even known
  to be irreducible for large even d — HAS NOT BEEN CHECKED. Until it is,
  nothing about that lemma is worth attempting.

  WHAT IS DONE AND LIVE
   · The #290 summit finished: 6 shards closed l = 293..310, merged, 250
     degrees closed, 0 open, l = 61..310 contiguous.
   · c ∈ [0.830416407911, 0.831220912621] and 1/(1+c) ∈
     [0.546083759260, 0.546323774021], so **c_0 = 0.546 UNCONDITIONALLY**,
     where every previous horizon pinned only 0.54. The conditional
     expansion holds at 110 digits with its assumption now entering at
     even d >= 622 rather than 62.
   · reports/erdos290.html leads with it: "A digit that was a guess is now a
     theorem". The 1/(1+c) interval and the count of agreed digits are
     DERIVED at build; a gate refuses the build if an extension ever fails to
     add an unconditional digit.
   · WHY THE DIGITS MATTER, and this was mis-stated for most of the session:
     van Doorn arXiv:2411.03073 is about denominators of generalized harmonic
     sums and proves b(a) > a + 0.54*log(a). c_0 IS that constant. A third
     unconditional digit is the difference between a published theorem saying
     0.54 and saying 0.546. NOT AN OEIS ORNAMENT. (Inferred from the abstract;
     checking it against his derivation is stage 0 of SPEC-PRICING.md.)

  DRAFTED, PASTE-READY, NOT SENT — sending is Carlos's call and needs no
  ceremony; SEND-QUEUE.md is now a readiness list, not a request.
   · outreach/issue164-PASTE.md — a pure delta on the comment already posted
     on teorth/erdosproblems#164, GitHub-safe Markdown (a stray asterisk had
     been italicising half a paragraph; fixed and verified mechanically).
   · outreach/oeis-erdos290-pack.md — packs 4 and 5 FILLED, 110 terms each,
     with quantified failure semantics so an entry is amended by raising d0
     rather than retracted. Pack 4 is the one van Doorn asked for by name.
   · outreach/oeis-erdos852h-extension.md — the length-31 record, re-verified.

  A REAL BUG, FIXED, WITH ITS RED CONTROL: Q.toDouble took its fast path
  whenever the quotient was FINITE. Once a denominator passes ~1024 bits while
  the numerator does not, Number(d) is Infinity, finite/Infinity is 0, and
  isFinite(0) is true — so it returned ZERO. Since toDouble reports enclosure
  WIDTHS, a certified bracket printed as width exactly zero: infinite precision
  claimed silently. It surfaced only because a log axis cannot take log10(0).
  Fixed in instruments/interval and in the lifted legacy copy, BOTH DECLARED as
  patches in LIFT.json — the first attempt was an in-place edit of a lifted
  tree and the next lift silently reverted it. THE SAME DEFECT IS UPSTREAM in
  sin-mfg; reported, not repaired.

  WHAT THE SESSION ACTUALLY TAUGHT, and it is not about code. Five targets
  died — polynomial multiplication, the 55-addition search, Chowla small-c,
  delta >= 1/2, family arguments — each after hours, each of which would have
  died in minutes if the prior art had been read first. sin-mfg's Chowla gate
  had ruled that lane OCCUPIED on 2026-08-20 and sat unread on disk while three
  hours went into rediscovering it. corpus/targets.json now holds all nine
  targets with the citation that killed each; `node tools/targets.js [word]`
  reads it. It is memory, not a gate: no die(), no build wiring, refuses
  nothing.

  DELETED THIS SESSION, on the operator's instruction and correctly: a lemma-
  pricing tool and its battery and refutation check. The operator asked for
  ideas and got a checkpoint. The findings survive in SPEC-PRICING.md —
  delta >= 1/2 is false; family arguments are worth their density and never
  buy a digit; a window of width 0.2 buys the fourth digit where compute needs
  ~10^5 times. machine/erdos290/tail.js was KEPT because it removed a
  duplicated bracket, not because it checks anything.

  STANDING NOTE ON HOW TO WORK HERE: scout first, build second. Write the
  targets.json row even when the verdict is OPEN. Do not answer a request for
  ideas with a gate.

SESSION 2026-08-31 — THE 55-ADDITION AUDIT (option 3, redirected by its own
prior-art gate from a search into an audit)

  reports/matmul-additions.html is live. THE CLAIM HELD.

  Karunaratne & Idamekorala, arXiv:2607.28676 (28 Jul 2026) claim a
  55-addition, rank-23 circuit for general 3x3 matrix multiplication. One
  month old; their certificate repo has ZERO stars. Verified here, from their
  published bytes, with an instrument that could have contradicted it and
  without running a line of their code:
    · all three circuits realize their factor matrices EXACTLY (symbolic
      evaluation over the integers, row by row)
    · the gates count to 55 HERE — 13 + 14 + 28 — matching the declaration
    · 729 Brent equations exact over Q, rank 23, layout AC
    · every coefficient in {-1,0,1}, which is what supports their
      any-associative-ring claim
    · naive cost of the same three maps: 122 additions, computed here — and
      122 is the number their own source file is named for (cn122)
  instruments/slp + battery: 16 checks, 8 red controls, all fire.

  WHY AN AUDIT AND NOT THE SEARCH THE BACKLOG ASKED FOR. The prior-art gate
  killed the search: the additive record moved SEVEN times in under a year
  (98 -> 62 -> 61 -> 60 -> 59 -> 58 -> 56 -> 55), several steps one addition
  apart, three of them in 2026. And our generation front is F2-only while
  these are integer {-1,0,1} schemes, so the flip walk cannot even produce
  candidates. SPEC-GENERATION.md §7 item 2 is corrected in place with the
  generalisation worth keeping: WHEN THE PRIOR-ART GATE KILLS A TARGET AS A
  SEARCH, ASK WHETHER IT IS ALIVE AS AN AUDIT. A field moving this fast makes
  unchecked claims faster than checked ones.

  WHAT IS REUSABLE: instruments/slp decides the half a tensor checker cannot
  see — that a straight-line program computes the linear map it claims, and
  that it uses the gates it says. Any future additive-complexity claim, ours
  or anyone's, goes through it.

  NOT DONE: their LOCAL optimality claim (that no 13-gate circuit exists for
  that map) is a different computation and this instrument does not do it.

OUTREACH STATE LIVES IN ONE FILE NOW: `outreach/SEND-QUEUE.md`.
It is the single source of truth for what is ready, what is held and why.
Outreach status had accumulated across ~20 places in this document, which is
exactly the shape of thing that diverges the first time one copy is edited;
consult the queue, and record sends there.

  READY (need a human — this repo has no mail transport and no OEIS API):
    the #852 OEIS record extension (re-verified 2026-08-31, independently) ·
    the KAUST letter · ORCID then the Zenodo DOI.
  HELD ON MERIT until the #290 shard merge, because the summit is mid-flight
  and will change the exact numbers they quote: the issue-164 follow-up
  (which `gh` COULD post today — it is held on judgement, not mechanics; its
  own text promises a third unconditional digit "when the squeeze reaches
  l ~ 310", and the shards are at l = 304..309) and the #290 OEIS packs.
  ALREADY OUT: the #852 correction; the #510 comment (in moderation).

  AND A CORRECTION TO THE COUNT THIS PROJECT HAS BEEN QUOTING ITSELF: it is
  not "nine of eleven outreach artifacts never sent". Eleven destinations are
  NAMED; only six have drafts that exist and have never been sent. The arXiv
  #290 note, the oracle paper, the outside reruns, EmbraerX and the RM-group
  note have no document in outreach/ at all. They are intentions, not staged
  artifacts, and counting them as staged overstated how close they are.

SESSION 2026-08-30c — THE POLYNOMIAL FRONT: RUN, CALIBRATED, PUBLISHED, CLOSED
(operator: "point the generation loop at the polynomial-multiplication tensors";
then "finish the tasks related, update the report and stop this front".)

  STATE: **DONE AND CLOSED.** reports/polynomial-multiplication.html is live,
  certs/bilinear-certificate.json holds 9 certified schemes, make test is
  37 PASS. Do not reopen without a new idea — the budget lever is exhausted
  at this scale (see WHAT WOULD ACTUALLY MOVE IT, below).

  THE RESULT IS A NULL, AND THE CALIBRATION IS WHY IT IS WORTH A PAGE.
  Nine targets certified, ZERO published upper bounds beaten:

      C7   naive 49 -> 13   published 13..13   MATCH  (the EXACT rank)
      T6   naive 21 -> 14   published 13..14   MATCH
      T7   naive 28 -> 18   published 16..18   MATCH
      T8   naive 36 -> 23   published 19..22   above by 1
      T9   naive 45 -> 27   published 21..26   above by 1
      C8   naive 64 -> 25   published 19..22   above by 3
      P2/P3/P4 -> 3/6/9     Chen-Kauers Z2 table, exact agreement

  Three published hand constructions (Wagh-Morgera 1983, Cenk-Ozbudak 2009)
  re-derived from the naive algorithm by a random walk that was told nothing
  about them, at $0.0000 in ~20 minutes of one nice-10 laptop core while the
  #290 summit had the other six. C7 is the sharp one: its walls MEET at 13,
  so reaching 13 is reaching the true minimum, not an estimate.

  THE PRIOR-ART GATE PAID FOR ITSELF TWICE — and the task premise was wrong.
  The brief said "nobody has pointed modern search at these". False, twice:
   1. CHEN & KAUERS, arXiv:2502.06264 (Feb 2025) already ran a flip graph
      over Z2 on the FULL product and published a 10x10 table. Their squares
      (P6=17, P7=22, P8=26) land exactly ON the Montgomery/CRT bounds, never
      below. The full product is TAKEN; attacking it was redoing their run.
      Their table is now our CALIBRATION LADDER instead.
   2. WANG HIMSELF, in a footnote to the very table of new lower bounds,
      improved T9 from 27 to 26 BY FLIP-GRAPH SEARCH OVER F2. So the one
      truncated case modern search has touched, it beat — which is the honest
      reason to have expected the others to move, and they did not for us.
  SPEC-GENERATION.md §7 item 1 has been corrected in place. The lesson is
  written there: an item whose appeal rests on "nobody has tried X" is resting
  on a negative nobody checked.

  WHAT WAS BUILT (all reusable, none of it polynomial-specific):
    machine/generate/targets.js   every bilinear target in ONE module —
                  matmul <n,m,p>, full P_n, truncated T_n, cyclic C_n, and
                  C_n^- which over F2 IS C_n (X^n+1 = X^n-1 in char 2; the
                  module says so rather than inventing a separate search).
    f2scheme.js   generalised from matmul to any target. Nothing in the
                  residual, the flips or the reduces was ever about matrices.
    proposers/flip.js  gained the PLUS TRANSITION, the rank-increasing move.
                  This was not a guess — see below.
    instruments/bilinear/  the new certifier: exact over F2 for ANY target,
                  and it REBUILDS the tensor from the target's NAME by literal
                  polynomial arithmetic. It never takes the claimant's word
                  for which tensor is being decomposed, because any scheme
                  decomposes something. 16 checks, 7 red controls, 4 ladder
                  rungs. Cross-checked against instruments/strassen on the one
                  case they share (Strassen's rank 7).
    tools/run-bilinear-front.js   the campaign runner.
    tools/build-report-bilinear.js  re-decides all 9 schemes at every build.
    corpus/bilinear-bounds.json   the literature, with citations. NOT ours.

  THE LADDER CAUGHT THE SEARCH BEING BROKEN, which is the whole argument for
  having one. Without a rank-increasing move the walk matched the literature
  at P2..P4 and then quietly sat above it from P5 on — P6 at 21 against the
  published 17. That looks EXACTLY like success if nobody checks the top of
  the ladder. Adding the plus transition moved P6 21 -> 18 and P5 14 -> 13.
  The ladder is now a deterministic gate (fixed seed, fixed budget) in the
  battery, so a future change that re-breaks the walk refuses the build.

  TWO DEFECTS I CREATED AND FIXED, both of the self-hiding kind:
   1. THE RECORD AND THE RESTART SEED SHARED ONE VARIABLE. The adaptive
      restart cleared it, so the certifier could audit the NAIVE algorithm
      while the run printed the record rank — a VERIFIED stamp on the wrong
      object. Two variables now, with the reason written at the site.
   2. TWO CAMPAIGNS, ONE CERTIFICATE FILE, LAST WRITER WINS. Load-once /
      write-at-end silently deleted the other campaign's rows. Writes now
      merge against disk per target, so a run that dies halfway still keeps
      everything it certified.

  MEASURED AND REJECTED: drawing the plus transition's mask from inside the
  support of the factor being split (keeping both halves local) instead of
  over the whole space. Identical ranks on T7 and T8 at equal budget, so the
  option was DELETED rather than left as dead config.

  NOT ATTEMPTED, and the page says so in a computed sentence rather than
  implying a complete sweep: T10, T11, C10, P6, P7, P8. C10's naive seed has
  100 terms and the walk is ~O(r^2) per step, so it was the wall.

  WHAT WOULD ACTUALLY MOVE IT (for whoever reopens this):
   - NOT more budget at this scale. We are 1 above at T8 and T9 after ~10^7
     steps; Wang's own T9 win used a 192-core c8g.48xlarge. The laptop is the
     binding constraint, not the algorithm.
   - The real lever is a BETTER SEED, not a longer walk: fold a full-product
     scheme down to the cyclic target (c and c+n merge, same rank, free) and
     start there instead of at naive rank n^2. Untested — it is the one idea
     that was left on the table when the front was closed.
   - F3 is completely unbuilt. instruments/bilinear is F2-only and REFUSES a
     claim over any other ring rather than pretending. Wang's F3 rows
     (C9/C9-, T8, T9, T10) have gaps of 5 to 10 and nobody has swept them.

SESSION 2026-08-31b — THE GENERATION FRONT IS BUILT AND IT CERTIFIES
(operator: "Start building. Remember to change the cerimonial and gates to
accept it. We must have a more maleable system. Go").

  STEPS 1-4 OF SPEC-GENERATION.md ARE DONE. machine/generate/:
    f2scheme.js   schemes over F2 as bitmasks; the EXACT residual (the count
                  of violated tensor equations) is the fitness — an integer,
                  not a score, computed from the object the proposer
                  submitted by arithmetic the proposer never touches; plus
                  flip and reduce, the identity-preserving moves.
    proposers/flip.js  the FREE proposer: a flip-graph random walk. No API
                  call, no tokens. This is deliberate — it is the honest
                  baseline every paid proposer must beat, and the spec's stop
                  condition now has a concrete number to beat.
    ledger.js     append-only, commit-before-certify.
    controller.js the loop, wired to instruments/forecast/admission.js
                  UNCHANGED — the prune rule needed only a new noun.

  IT WORKS. <2,2,2>: rediscovers Strassen's rank 7 from naive 8 in under a
  second. <3,3,3> over F2: naive 27 -> 26 -> 25 -> 24 -> 23, i.e. LADERMAN'S
  RANK, from scratch, in ~13 s at $0.0000. The authority agrees:
  instruments/strassen returns VERIFIED, layout CA, 729 equations, and the
  BigInt cross-check confirms it. Board: flip@v1 13/13 certified, ADMITTED.

  TWO TUNING ERRORS, FIXED BY MEASUREMENT NOT GUESSWORK: restarting from the
  best scheme every round collapsed the walk into one basin and stuck at 24;
  replacing that with a fixed odd/even alternation tied freshness to seed
  parity so half the seeds were never tried. The restart is now ADAPTIVE —
  continue while the walk pays, start fresh the moment a round returns
  nothing. That is what reached 23 through the controller.

  THE GATES, MADE MALLEABLE — AND THE TWO DEFECTS THAT SURFACED DOING IT.
  A declared `wip-*` namespace in certs/ is now exempt from the description
  table: a gate catches drift and forgery, it never charges rent on iteration
  (CLAUDE.md). But making it malleable exposed two real defects:
   1. A PUBLICATION LEAK I CREATED. The table ignored wip-*, but the site
      build copies certs/ wholesale — so the working ledger would have
      SHIPPED to carlostoledo.co while being excused from description.
      Exactly backwards.
   2. THE RULE WAS ALREADY DEFINED TWICE. The shard-exclusion regex existed
      in the description gate AND again in the publication loop, and they
      DIVERGED the instant one was edited. The corpus.js lesson, happening
      live, in a file that already carries a comment warning about it.
  Now ONE module-scope WORKING pattern serves both, with the rule stated
  once: a file excused from being described must also be excused from
  shipping. Both falsifiers verified — an undescribed non-wip certificate
  still REFUSES the build, and a wip- file is exempt AND never shipped.
  certs/wip-* is gitignored.

  THE SHAPE WORTH REUSING: do not weaken a gate, give it a DECLARED NAMESPACE
  with an explicit contract. The gate loses no power over what ships.

  NOT DONE: width() formalised on instruments/interval (only the algebraic
  case is done) · ctx.refuted mechanisms actually consumed by a proposer that
  can repair (the flip walk ignores them and does not need them) · the model
  proposer · the report page. Per the spec's stop condition, a paid proposer
  must now beat rank 23 on <3,3,3> at $0.0000 before it earns its invoice.

SPEC-GENERATION.md — THE GENERATION FRONT, SPECIFIED, NOT BUILT (2026-08-31,
operator: "Research how to add a generation front... bring solutions to make it
work and stand out from the newest competitors", then "yes, spec").

  THE RESEARCH FINDING. AlphaEvolve-class systems are bottlenecked on the
  EVALUATOR, not the proposer — the stated requirement is "a manually designed
  unhackable evaluator that maps solutions to scalar scores", and the
  documented failures are what a scalar buys (a candidate that deleted a GPU
  memory limit and caught the exception; candidates that skipped pipeline
  stages; one that zero-weighted 97% of experts to win a balance metric).
  AlphaProof Nexus (arXiv:2605.22763, May 2026) is the closest published
  system — 9 of 353 Erdős problems at hundreds of dollars each — and names the
  exact problem: "the mismatch between evolutionary algorithms, which typically
  assume a graduated fitness landscape, and formal proof evaluation, which is
  inherently binary." THEIR ANSWER IS LLM RATERS scoring plausibility, clarity
  and novelty into an Elo, and their admitted failure modes are agents
  offloading difficulty into sorry's that restate the target and sketches
  citing hallucinated lemmas. A subjective fitness signal buys exactly that.

  THE WEDGE, and the reason to build at all: AN INTERVAL ENCLOSURE IS BOTH.
  The verdict is a proof; the WIDTH is the gradient. Evolution gets a
  continuous, objective, monotone landscape and soundness is never traded for
  it, with no model's opinion anywhere in the loop. That is a technical answer
  to a problem a DeepMind-adjacent paper published in May and solved with
  vibes, and it is available to this project only because the interval stack
  already exists.

  THREE OF FOUR PARTS ARE ALREADY BUILT: machine/engine.js (the loop),
  oracle/tool-definition.json (a strict-schema model-callable certifier that
  already returns CERTIFIED / REFUTED-with-mechanism / REFUSED), the 17
  instruments (the fitness functions), machine/funnel/ (14 items / 19
  anti-hacking red controls — the thing competitors name as the hard part),
  and instruments/forecast/admission.js (the prune rule, reusable verbatim by
  changing the noun from forecaster to proposer). MISSING: the controller.

  THE SPEC covers: the propose(ctx) contract added beside enumerate (additive,
  never a replacement — the #852 find came from a plain scan and a scan wins
  wherever it can exhaust) · ctx.refuted carrying the certifier's MECHANISM as
  a repair instruction, which is what makes it a loop rather than a lottery ·
  rationale recorded and never read by any decision · fitness ranked verdict,
  then exact progress against the incumbent, then width · proposer identity as
  (model, prompt version, temperature) so a revised prompt is a NEW proposer,
  which is the honest form of readmission the gym still lacks · the prune gate
  sitting BEFORE the API call, not at the ledger · publishing the denominator.

  BUILD ORDER is 7 steps; steps 1-4 are a working single-proposer loop and the
  honest MVP. STATED STOP CONDITION: if after step 4 the proposer has not
  beaten enumerate on the same budget, report that and stop — a null is
  publishable and this project has published one before.

  FIRST TARGET named in the spec: the polynomial-multiplication tensors over
  F2/F3 (18 published lower bounds, gaps of 3 to 10, 1980s CRT upper bounds,
  flip-graph never pointed at them though its authors name them applicable and
  publish the code). Two-sided: a hit is a new upper bound, a hit below a
  published lower bound refutes a 2026 paper.

  NOT BUILT. Operator's call whether to start at step 1.

SESSION 2026-08-30f — A FIND. THE #852 RECORD EXTENDED PAST THE PUBLISHED TERMS.

  L2 (the deep run launched in the previous block) reproduced the published
  state of the art and then passed it:

    len 30  index    7,889,803,997  prime 196,948,778,371   = A079007's LAST term
    len 31  index   10,435,962,861  prime 263,552,821,783   BEYOND EVERY PUBLISHED TERM

  A079007 held n = 0..30; A078515 and A079889 held 27 terms each, all ending at
  196,948,778,371. Ours is the 28th index term and A079007(31).

  THE EXHIBIT IS INDEPENDENTLY CERTIFIED. instruments/erdos852h/verify-record.js
  shares NO line with the scan — deterministic BigInt Miller-Rabin, next-prime
  by stepping, a Set for distinctness. It re-proves at every build that
  263552821783 is prime, that the next 31 gaps
  (76 8 34 36 26 106 38 82 18 54 50 16 62 70 14 48 42 64 6 104 24 12 66 22 30
  96 2 10 74 4 32) are pairwise distinct, that the run spans
  263552821783..263552823109, and that the 32nd gap is 4 — already present, so
  the run is EXACTLY 31 and not longer. The last PUBLISHED term is re-proved
  the same way as a control: a verifier that cannot confirm what the
  literature already holds is not evidence.

  TWO CLAIMS, STATED SEPARATELY BECAUSE THEY ARE NOT EQUALLY STRONG:
    h reaches 31 there  — independently re-proved, does not depend on the scan
    it is the SMALLEST such index — a statement about every index below it;
      only the exhaustive scan can speak to it. Evidence for the scan: it
      reproduced all 27 A078515 indices and all 27 A079889 start primes
      exactly before extending them. Evidence, not an independent proof.
  The page says exactly this and never blurs the two.

  WHY THIS ONE WORKED, when the tensor front did not: a lower bound is a
  universal statement and an audit of one can only ever AGREE. h(x) >= k is
  EXISTENTIAL — one object settles it, and producing objects is what this
  machine does. That was the lesson written down when #290's tensor lane
  returned a null, and it is the lesson that paid here.

  SHIPPED WITH IT: reports/erdos852-h.html §4 "Past the last published term"
  (the exhibit re-proved at build; a record that fails to re-prove, or that
  turns out longer than claimed, REFUSES the page) ·
  certs/erdos852-h-records.json, described in the certificate table ·
  outreach/oeis-erdos852h-extension.md, the submission pack for A078515 /
  A079007 / A079889 with the caveat about minimality written into it.
  The shelf card now reads "reproduces every published term, then passes them".

  THE RUN COMPLETED: exhaustive to 5e11 in 4042 s (67 min), 28 distinct
  records, structurally clean. No length 32 exists below 5e11, so the finding
  is not "31 found so far" but "31 is the record up to 5e11" — the stronger
  statement, and the one the page makes.

  NOT SENT: the OEIS submission itself. Third-party send, operator's word.

SESSION 2026-08-30e — ERDŐS #852: THE CONJECTURE, FINALLY AGAINST THE DATA
(operator: "how could we push more on erdos852?" then "Go L1" then "Start all 3").

  THE OPENING. #852's constant work was finished and public (5d061fb/earlier):
  c0 certified to 61 digits, the published C* REFUTED at digit 12, correction
  live on erdosproblems.com since 2026-08-27. What was NOT done: the constant
  had never been compared to the DATA. The thread conjectures h(x) ~ c0 log x;
  OEIS A053597/A078515/A079007/A079889 have held the exact record runs since
  2002; the problem page lists those sequences in its own OEIS box. Neither
  side had ever been pointed at the other. That gap needed no new mathematics.

  L1 SHIPPED — reports/erdos852-h.html. instruments/erdos852h/ (h.js, a
  streaming segmented sieve + two-pointer longest-repeat-free-window scan,
  integers only, memory independent of the limit; analyse.js, the crossing).
  Our scan reproduces A078515's record indices AND A079889's start primes
  term for term — two independent witnesses to the same integers, a 2002
  sequence and a scan written this week from the problem statement.

  THE FINDING IS A READING. #852 says "for some n < x", and n INDEXES a prime,
  so x counts primes rather than measuring size. Under that reading c0 lands
  inside 9 of 14 plateau bands with no drift across the decades; under the
  prime reading the same data gives ~1.14 and is not closing on c0. THE DATA
  PICKS THE READING. It also bears on Erdős's own question — he asked whether
  h(x) = o(log x), and the ratio is flat near c0, not decaying.
  SAMPLING BIAS REMOVED, not ignored: h is a step function whose records ARE
  its jumps, so quoting the ratio at records reads only the tops of the steps.
  Every plateau is reported as a BAND (ratio at its start and at its end) and
  c0 is asked to lie inside. Where it misses it misses narrowly and in both
  directions — 4 bands below, 1 above — and the page shows that rather than
  smoothing it.

  L3 SHIPPED — lean/erdos852/Erdos852/Statement.lean, a formalised STATEMENT
  of #852 (the problem page's own field reads "Formalised statement? No
  (create one)"). Type-checks clean on Lean 4.33.1 + Mathlib, zero sorry.
  It formalises the INDEX reading, and it does not hide the landmine: h is an
  sSup and Nat.sSup of an unbounded set is junk 0, so DistinctRunSetBddAbove
  is stated as the named side-condition it is and everything needing it takes
  it as a hypothesis. Both Erdős questions are stated, plus ThreadConjecture,
  recorded because it is INCOMPATIBLE with question 2.

  L2 RUNNING — h.js to 5e11 in the background, targeting a record past
  A078515's last term (index 7,889,803,997). certs/erdos852-h-records.json
  when it lands; the report prefers that file over a build-time recompute.

  A REAL BUG, CAUGHT BY THE FIRST L2 RUN AND FIXED. The seen-table was an
  Int32Array holding GAP INDICES. Past the 2^31-st prime the stored index
  wraps negative, `last >= left` silently goes false, repeats stop cutting the
  window, and the run length explodes — observed as a bogus record of length
  14,730,343 at index 2147483648 EXACTLY. Now Float64Array (exact to 2^53).
  THE GATE HOLE THIS EXPOSED IS THE REAL LESSON: the corruption landed PAST
  the last OEIS term, so a prefix comparison against A078515 would have passed
  it clean and the page would have published h_max = 14 million. Added
  analyse.validate() — monotone indices, monotone lengths, step <= 3, start
  primes increasing, and a plausibility ceiling — which catches it with no
  reference sequence at all, and the builder now runs it BEFORE the OEIS
  comparison. A reference check only covers the head of a deep run.

  NOT DONE: submitting the formalised statement to erdosproblems.com, and the
  thread comment reporting the reading finding. Both are third-party sends and
  wait on the operator's word (outreach discipline unchanged).

SESSION 2026-08-30d — THE SIX-LANE AUDIT, NARRATED (operator: "review sin-mfg
to bring the 6 lanes audit to this project"; then "not ceremonial and gates,
the reports must be rebuilt from zero with more appeal"; then "add nice
interactive charts and graphs"; flagship-only chosen over flagship + six
detail pages).

  WHAT THIS WAS. sin-mfg's Lane B is six independent re-verifications of
  AI-CLAIMED mathematical results (mostly aimath.robertj1.com). All six
  verify.js were ALREADY LIFTED and allowlisted in LIFT.json (2026-08-26) and
  have been sitting in legacy/research/challenges/lane/ as gate sources,
  UNSERVED. Only lemniscate had ever had a public page. So this was never a
  lift job — it was five certified results dark for four days, the same
  narration deficit the outside-reader audit diagnosed.

  SHIPPED: reports/ai-claims-audit.html — "We checked the AI's homework".
  All six verifiers RUN AT BUILD (6.0 s end to end): 230 checks across five of
  the six, 21 mutation controls, every control rejected. 5 CONFIRMED,
  1 PARTIAL (Ran-Teng), 0 REFUTED.
  THE FINDING IS THE SPLIT, not the tally: in 6 of 6 the computational
  fragment certifies and the analytic core does not. Poisson is the one lane
  where the gap closes, for a structural reason the page names — a
  counterexample is an EXISTENCE claim, so certifying the exhibit IS
  certifying the claim. Every other lane asks a machine to confirm a universal
  statement from a finite computation.

  NEW: instruments/laneaudit/audit.js — the ONE module that runs the six and
  parses their output (per-lane extractors; formats differ because the
  verifiers were written months apart). Nothing transcribed. Two verifiers
  print no check total and the page shows an em-dash rather than a number we
  invented. The builder refuses on: a failing check, a mutation control that
  stops firing, a verifier that stops printing its own totals, or any REFUTED.

  NEW DESIGN COMPONENT: C.picker({name,items}) — CSS-state tabs, no script,
  same device as the nav drawer; every panel ships in the markup so a reader
  with CSS off sees all six. Capped at 12 (the count the template styles) and
  throws above it. DESIGN.md row added; CSS in template.js.

  CHARTS: bars (checks per claim, hover = mutation controls + runtime) ·
  segments (the 6x2 fragment-vs-core grid, hatch as the second channel since
  the hatch already means "nothing was enclosed here") · bars (relative gain
  for the two claims that move a published number: Maxwell 16 -> 24, +50%;
  Korenblum 0.3554 -> 0.4263, +19.9%).
  A DUMBBELL WAS BUILT AND THROWN AWAY: normalised before/after made both rows
  identical-length, which conveys nothing. Replaced with relative gain, the
  one axis two different units actually share.

  TWO DEFECTS CAUGHT BEFORE SHIPPING, both mine:
   1. The deck claimed verifiers "had never seen the authors' code". FALSE for
      Mathieu, whose VERDICT records that the author's Python was READ to
      cross-check which identities the TeX intended (never executed). Deck now
      says "never ran a line of the authors' code", the tl;dr carries the
      exception, and the Mathieu lane carries a disclosure paragraph.
   2. The re-run section shipped git clone .../carlostoledo/cert-machine. The
      remote is carlostoledo1891. A wrong clone URL in the "check it yourself"
      section is the same class as the two 404s fixed in 5d061fb.

  THE SIX PER-CLAIM PAGES SHIPPED (operator: "build the 6 per claim and push
  live"), reports/claim-<id>.html, registered on the shelf and in the sitemap.
  Each carries §1 the claim at source · §2 the verifier's OWN check ledger as
  it printed it at this build (per-stage tables + a per-stage bar chart where
  the verifier emits stages) · §3 the falsifiers, each named · §4 the boundary
  · §5 re-run + cards to the other five. tools/build-report-claim.js loops the
  six; instruments/laneaudit/audit.js gained ledger() so the flagship and the
  detail pages read ONE parser and cannot disagree.

  AND A CORRECTION TO THE FLAGSHIP I SHIPPED AN HOUR EARLIER. Building the
  ledger exposed that THE SIX VERIFIERS DO NOT AGREE ABOUT WHAT A CHECK IS:
  maxwell, ranteng and lemniscate FOLD their mutation controls into their own
  printed total (17+3=20, 38+5=43, 22+4=26); mathieu counts its 3 separately;
  korenblum and poisson print no total at all. The first version of the page
  put those six incomparable numbers in one column and summed them to "230
  checks". That number was not wrong per verifier — each was parsed from its
  own output — but the COLUMN was not a column, and the sum was not a sum.
  Now: one rule applied to all six (a named PASS row that is not a mutation
  control) giving 92 named checks, the verifier's own total carried in a
  SECOND column beside it, and a paragraph naming the disagreement with the
  arithmetic shown. Where a verifier names no rows or states no total the cell
  reads em-dash. The counting rule again: deflate to truth before anything is
  stated publicly — this one survived a commit AND a deploy before the
  per-claim build forced it into the open.

  STILL the operator's call: whether the flagship earns a landing-page slot —
  it sits at shelf index 9, so it is on /reports/ but not in the landing's
  top-6 feature. Reordering the feature is editorial, not mine.

STATE OF RECORD (refreshed 2026-08-29; full histories live in
apps/skyaudit/TODO.md and the session entries below — this block holds
only what stands).

  THE PUBLIC SURFACE, as of this handoff: 27 report pages (+ the
  two-population regime map 2026-08-29; the matmul eval carries the
  recall-vs-derivation table as of 2026-08-30; + reports/keller.html
  2026-08-30, THE JACOBIAN CONJECTURE AUDITED — see the session block
  below), every one
  of them carrying at least one chart built from its own gated numbers
  (design/charts.js + design/battery.js, both new this week). LAB v0
  live at reports/mfg-observatory.html with the certifier running in
  the page, shipping as one dependency-free file, and its lab in
  labs/mfg/. HarborProof renamed from HARBORPROOF/harborproof with
  301s from the old paths. make test 35/35, control 28 batteries,
  drift 130 unchanged.

  THE OUTSIDE-READER AUDIT (2026-08-30). An outside reader sent seven
  "hidden gem" claims. Fact-checked against the repo: FOUR REFUTED, three
  partly true, none fully confirmed — Mercer, entropy, #290 and the
  one-population MFG map all had shipped pages the reader had not opened
  (the Mercer "gap" was the title of that page's own §0). THE USEFUL
  FINDING WAS THE PATTERN, NOT THE LIST: a motivated reader with repo
  access concluded "no page exists" for five pages that do, because they
  were reading certs/ and HANDOFF rather than reports/. The deficit is
  DISCOVERABILITY FROM THE SURFACES PEOPLE LAND ON, not narration —
  which is what the Erdos lane below is for. Two independent sweeps then
  found what the reader had not: eight real defects on live pages, and
  five certified-but-unnarrated results. Both were executed the same day
  by seven parallel agents on disjoint builders; every claim below was
  re-verified by the operator's agent before it shipped.

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
  companion note reports/skyaudit.html (day-stability §7 REBUILT
  2026-08-30 — it read a HARDCODED pair, DAY=08-26 vs DAY2=08-23, so
  the public page argued from two days while the corpus held seven and
  neither Fri 08-28 nor Sat 08-29 had any public home; §7 now renders
  the WHOLE series from audit/forecast.js's own series() — one module
  owns the day scan and the E-FLYABLE definition, so the page and the
  forecaster cannot disagree — with a per-day bar chart, a 7-row table,
  and a shape computed at build rather than asserted in prose; the
  controlled Wed-vs-Sun pair survives as §7b. NEW GATE 2c: every day
  shown is re-tallied from its OWN certificate ledger. The first
  version of that gate was VACUOUS — it compared the summary against
  series(), which reads the same file, and a red control corrupting a
  non-record day's CERTIFIED passed clean; the row-count check misses
  it too, since rows is untouched. Fixed to recount VERDICTS from the
  .gz ledger, the only independent witness, and both reds now fire:
  corrupt CERTIFIED -> REFUSED, corrupt rows -> REFUSED, restored ->
  PASS. v2 delta disclosed §6); ingest-day.js = one-command day ingest;
  battery 33/33, 12 build gates, make test 35/35.

  THE PREDICTION PROGRAM — instruments/forecast/ (conformal coverage
  as counting theorem + append-only exact-scored commit/score ledger
  + NEW admission.js: the prune rule computed as an exact binomial
  tail at a stated 1/20 bar; battery now 7 checks + 5 reds) ·
  SkyForecast v1 card live (dashed, never verdict-styled; gate 11) ·
  product ledger 22 commits, 2 SCORED (0/2 covered — the 08-28 v1 pair
  busted, eflyable on the predicted definition move and flights on a
  genuine Friday-volume miss; causes stated, nothing rescored), 08-31 v2 pair,
  09-01 + 09-02 pairs at n=4 coverage 3/5 ([191,397]/[49,127] — the
  Thu volume drop honestly widened the intervals). Day series now
  SEVEN days and the week is COMPLETE (2026-08-30): + Sat 2026-08-29
  ingested green, 266 flights / 58 E-FLYABLE (21.8%), fleet 7 — every
  one of the seven weekdays is now represented exactly once.
  THE WEEKEND-CLUSTER CLAIM WAS OVERSTATED AND IS CORRECTED HERE
  (2026-08-30, caught while building the page that would have published
  it). The first write-up said "weekend 21.7/21.8 against a weekday
  cluster of 25.7-32%" — that range SILENTLY DROPPED Friday 08-28 at
  22.2%, a weekday sitting 0.4 points from Saturday. What the seven days
  actually show, computed: the share peaks Mon at 32.0% and falls on
  every following day without exception — 32.0, 28.1, 26.2, 25.7, 22.2,
  21.8 — with the opening Sunday at 21.7. A weekday/weekend split does
  still separate the groups, but by 0.4 points (min weekday Fri 22.2 >
  max weekend Sat 21.8), not by the wide gap first claimed. VOLUME does
  NOT split by day type at all: Thu 191 flights is BELOW Sat 266.
  Two readings fit the same seven numbers — a weekly cycle and a
  monotone drift unrelated to weekday — and ONE WEEK CANNOT TELL THEM
  APART. reports/skyaudit.html §7 now states exactly that and refuses
  to pick one; the separation margin is COMPUTED at build, so a day
  that breaks the split rewrites the sentence instead of embarrassing
  it. The lesson is the counting rule: deflate to truth BEFORE anything
  is stated publicly — the overstatement survived one commit message
  (4aa5657) because no page had to render it yet.
  THE WEEKEND UNLOCK, first available this session: forecast.js
  refuses any group with n < 2, so while Sunday stood alone NO weekend
  target was committable — which is exactly why 08-29 and 08-30 have
  no product rows and why scoring 08-29 REFUSED rather than scored.
  With Saturday ingested the weekend group reaches n = 2 and weekend
  targets became committable for the first time: 09-05 + 09-06
  committed at [175,266]/[38,58], proved coverage 1/3 — weak, and
  honestly weak, because two days cannot prove more than that.
  THE FORECAST GYM (8E) — BUILT 2026-08-28 (operator's word "build
  what's missing"): tools/forecast-gym.js (three house proposers —
  conformal claims only its theorem; persistence the forced dumb
  baseline built to be pruned in public; range the hedger — commits
  refused for DEADMITTED proposers) + certs/forecast-gym-ledger.jsonl
  (130 commits sha-pinned before their targets, 13 target days, 22 SCORED
  — 12 on 2026-08-29, the first grading in the gym's life: conformal,
  range, opus-5 and sonnet-5 all 2/2 ADMITTED; persistence 0/2 but KEPT (its
  1/2 claim clears the bar — the rule refuses to punish what it cannot
  prove); claude-haiku-4.5 0/2 and DEADMITTED on the exact binomial
  tail 1/36 < 1/20, the narrow-interval overconfidence signature
  measured on the first day it could be) +
  THE SECOND SCORING 2026-08-30 (10 rows, target Sat 2026-08-29,
  outcome 266 flights / 58 E-FLYABLE) — THE WEEKEND IS WHERE THE
  NARROW FORECASTERS DIE. On flights EVERY proposer missed except
  `range`, the deliberate hedger; the Saturday volume collapse was
  outside all four narrow intervals. Board now: conformal 2/2 · range
  4/4 (perfect, and the only one to take the Saturday) · opus-5 3/4
  (it covered eflyable — it had the DIRECTION of the weekend drop, per
  its v1 claim — but missed the MAGNITUDE on flights) · sonnet-5 2/4,
  which is the sharp reversal: sonnet WON the first scoring 2/2 and
  took both Winklers, then missed both targets on the first weekend it
  ever faced · claude-haiku-4.5 0/4, still DEADMITTED (its 08-29 rows
  were committed BEFORE the prune and are therefore legitimately
  scored — the prune is not retroactive and must not be) ·
  persistence 0/4 and STILL ADMITTED on the exact tail 1/16 > 1/20.
  PERSISTENCE IS NOW ONE SCORED MISS FROM ITS OWN DEADMISSION: at 0/5
  under a claimed 1/2 the tail is 1/32 < 1/20 and the rule fires. The
  forced dumb baseline was built to be pruned in public and it is
  about to be, on arithmetic stated in advance. auditAdmissionHistory
  replays all 130 commits: 0 violations. +
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

LAB v0 — SHIPPED 2026-08-28 (operator-approved "I accept the
suggestion"; the target user, by name, is Ricardo de Lima Ribeiro of the
KAUST MFG group, and the page succeeds when HE uses it).
  WHAT SHIPPED: reports/mfg-observatory.html — THE MFG REGIME
  OBSERVATORY. The mfg-cap point theorem generalised to a MAP: the
  (c, A) plane at sigma = 1/2 partitioned into 19,800 cells, each
  decided UNIFORMLY over its own rectangle — 11,330 MULTIPLE (two
  exact solutions for EVERY parameter in the cell, two provably
  disjoint certified balls, both densities positive; 30.7% of the
  plane by area), 384 UNIQUE (c >= 0, Lasry-Lions global uniqueness
  CITED, our enclosure proved), 8,086 UNDECIDED with the reason kept
  verbatim (6,470 of them still enclose one exact solution). The
  partition's area identity is re-checked at every build; a grid of
  point results would prove nothing between its points.
  THE INSTRUMENT (labs/mfg/, MIT, tools-first as required):
   - box.js — uniform-over-a-parameter-box radii-polynomial validation.
     THE FINDING that made a map possible: with a FIXED candidate Y0
     grows linearly in cell width and only cells narrower than 0.004
     in c close on the herding branch (a hairline). Carrying the
     TANGENT PREDICTOR (DPhi xdot = -d_s Phi, from the Jacobian already
     factored for A) cancels the first-order term, Y0 drops to O(h^2),
     and 0.0625 closes — 15.6x wider, and that IS the map's cell size.
     box.js carries opts.freezePredictor so falsifier X2 can switch the
     predictor off and measure BOTH thresholds on the same ladder: the
     ratio quoted on the page is a measurement of that build, and the
     page parses it rather than transcribing it.
     Also: boxPositivity over the box, refuteCandidate (the NEGATIVE
     direction: one equation whose residual exceeds its own row bound
     times delta proves no exact solution lies that close), decideCell.
   - regime.js — the adaptive sweep (quadtree; refines only where
     refinement can help, so resolution sharpens exactly on the
     pitchfork seam and the fold) -> certs/mfg-regime-map.json.
   - battery.js — 9 checks + 6 falsifiers. G1/G2 are the important
     ones: at ZERO cell width box.js reproduces the lifted kernel
     (legacy/core/mfg/validate.js) BIT FOR BIT on 7 reference
     instances — same Y0, Z1, Z2, r, kappa — including the kappa
     column validate.js records in its own header. A rule defined
     twice WILL diverge; this is the check that fires when it does.
     C1 re-solves at all four CORNERS of a certified cell and requires
     each corner solution inside the ball (the uniform claim, checked
     by arithmetic a referee can repeat).
   - widget.js — the browser certifier is ASSEMBLED at build from the
     actual sources (interval.js + mfg1d.js + box.js), nothing retyped,
     then EXECUTED against the Node path and required to agree on
     verdicts AND witnesses or the page refuses to build.
  THE THREE DOORS (tools-first, all live): the paste box in the page
  (verified working in-browser by CDP: same witness numbers as Node) ·
  reports/mfg-certify.js, the same certifier as ONE file with NO
  dependencies at all · labs/mfg/ in the public repo with a README
  that states the scope.
  DELIVERY VEHICLE STAGED, NOT SENT: outreach/kaust-mfg-lab.md — the
  letter, with the closing ask verbatim ("send me the one claim that
  costs your group the most time to defend"). Needs the operator's
  three opening sentences and a recipient choice. The old objection
  against the KAUST draft ("reword 'live in the browser'") is moot.
  LAB v1 SHIPPED 2026-08-29 as the TWO-POPULATION lab (labs/mfg2p/, see
  the ACTIVE NEXT entry). The sigma axis is STILL open and still the
  expensive one: box2p.js inherits the same defect (A is built at one
  sigma, so the tail of I - A DPhi carries |1 - sigma/sigma0|, which
  does not decay in k), falsifier X4 proves it is charged in BOTH labs,
  and the map was therefore swept at fixed sigma = 0.5. The rescaling
  that would fix it — divide rows k >= 1 by sigma so the linear diagonal
  is sigma-free and A's tail inverse is exact, moving the sigma
  dependence into terms that DO decay — is written up but not built; it
  gates the sigma axis and nothing else, which is why the map came
  first. Also open: the congestion model as a second rung (its solver is
  NOT published, so today it is one certified point,
  reports/mfg-congest.html) · every engagement is simultaneously an
  external rerun (item 13) and a vouching candidate.

DATAVIZ: the report shelf is DONE — 24 of 24 pages carry a figure
(2026-08-29). Still bare, and no word needed to fix them since they are
our own surface: the landing page, the control page, /oracle/ and
/machine/. design/charts.js already covers every form they would need.

SESSION 2026-08-30b — THE DEFECT SWEEP AND THE FIVE UNNARRATED RESULTS
(operator's word: "Start with the urgent part and after finish execute the
gems list, all items"; seven parallel agents on disjoint builders).

  SIX LIVE DEFECTS FIXED, all verified on carlostoledo.co before and after:
   1. TWO HARD 404s in the landing page's re-verify column — the column a
      skeptic clicks FIRST. /verify/ ships only the three .py verifiers;
      two rows pointed single-file JS/HTML artifacts at it. Now three
      constructors (PY / INPAGE / NOVERIFIER) that each NAME the repo file
      they copy from, and a gate that refuses any re-verify link whose
      source does not exist. The mfg2p row was also MISLABELED — there is
      no single-file certifier for that map; it now says so.
   2. THE ABOUT PAGE understated the project's ONLY external validation:
      "#852: Submitted, awaiting moderation" when it has been PUBLIC since
      2026-08-27. Now reads the status and date from the pin in
      corpus/sources/PINS.json, and refuses if the snapshot disappears.
      Deliberately NOT overclaimed: visible is not endorsed, clearing a
      moderation queue is not peer review.
   3. ESCAPED MARKUP rendering as literal text on the flagship eval page —
      TEN leaks, not the two visible ones. Fixed with components.table's
      existing {raw} affordance (values still escaped; raw is for markup
      the BUILDER wrote, never for a value off disk). design/battery.js
      gained check F3 + reds X5/X6 — X6 requires a leaked <em> to fire
      while the escaped tensor <2,2,2> beside it does NOT, because a check
      that fires on every escaped bracket gets switched off in a week.
      A second page (mfg-observatory §8) had the same defect, 6 leaks,
      carried as an exact-pinned LEAK_DEBT that failed in BOTH directions;
      fixed the same day (C.p -> C.pRaw) and the debt line deleted.
   4. THREE COUNTS FOR ONE FILE: strassen-certificate.json has 10 entries;
      the site said "Nine" and "11 algorithms" on three surfaces. Now
      computed once from the certificate.
   5. THE ORACLE PAGE contradicted the page it links: "9 trajectories"
      vs verifier-loop.html's "6 of 10". Root cause: the trajectory key
      merged sonnet-5's (2,2,2,7) and ('tensor','c1',7) trajectory 0.
      Now keyed on (model, tag, target, trajectory). TRUE unclosed-rounds
      figure is 25, of which 24 carried mechanism — the 4th unclosed
      trajectory DECLINED and its feedback is null, so it received none.
   6. #290's tl;dr contradicted its own body ("a third" / "l <= 90" vs
      "50%" / "l <= 120"), and claimed d = 168 was "the last exceptional
      density in range" when the DEPLOYED cert already closed ES0 at both
      l = 84 and l = 112. All computed now. A FOURTH defect surfaced in
      the same file: the page said the conditional enclosure assumes
      "every even d >= 122" while the lifted kernel branches at 2l <= 60,
      i.e. it assumes from d = 62 — the page claimed to assume LESS than
      its own computation does. The builder now DETECTS the boundary
      (the enclosure width is the sum of carried allowances) and dies if
      it cannot locate it.

  #290 MERGED AND REPUBLISHED: +152 degrees -> 212 closed, l = 61..272
  contiguous, open: [] throughout. Bracket 2.070e-3 -> 9.166e-4, from
  "50% tighter than the cited page" to 78%. All SIX exceptional degrees
  past the cited horizon (d = 168, 224, 288, 360, 440, 528) closed to
  ES0. c* agreed to 110 digits at horizon 272. NOTE: the OEIS b-files came
  back BYTE-IDENTICAL — at horizon 120 the allowance was already ~1e-238,
  so 110 digits were saturated; the horizon move shows up past ~230 only.
  The six shards are STILL RUNNING toward l = 310; this was an interim
  merge and the merge tool supports another.

  FIVE UNNARRATED RESULTS, NOW PUBLISHED:
   - reports/keller.html (NEW) — THE JACOBIAN CONJECTURE, AUDITED. 11
     certificates, 10 distinct maps: Jacobian false in dim 3, Hessian
     false in 5 vars, five Gallagher members rebuilt from seeds, and
     THREE COUNTEREXAMPLES GENERATED HERE that no paper carries. The
     doubling identity det Hess(y*F) = -4 = -(det J F)^2 makes the two
     published entries certify each other (ARITHMETIC independence, not
     byte independence — both pin the same PDF, and the page says so).
     keller-fibers re-finds the collisions BLIND; 7/9 cells certify, and
     the 2 that FAIL are on the page, because a lower bound allowed to be
     weak is the only kind worth trusting. Gates: battery 32 checks / 9
     reds + verify_keller.py + certificate<->family monomial identity.
   - methods-note §5 — "19 ways to cheat this machine". The funnel's
     anti-hacking battery, 14 items / 19 red controls, keyed to the
     battery's own control letters and checked BOTH directions: a new red
     control with no description, or a description whose control vanished,
     REFUSES the page. That is the structural fix for the defect that hid
     this battery in the first place. CREDIT CORRECTED: the 159x
     amplitude-inflation incident is NOT ours — it is a third-party
     project's self-disclosed result, reaching us second-hand through a
     sin-mfg audit note; the page credits it as history and does not name
     the project. The gate is ours.
   - answer-key §5 — "what a clean audit looks like": instruments/sos
     re-verifies the AI-discovered Lyapunov functions of arXiv:2606.10045
     in exact rationals and THE PAPER HELD UP. Three verdicts as a set:
     one CONFIRMED, three of the paper's OWN FLAGGED candidates refuted
     with exact witnesses (Eq. 23 at x = (3/200000, 1/1000) gives
     22103/50000000000000 > 0), and Motzkin REFUSED — the instrument
     declining to certify something TRUE, which is correct behaviour.
     This extends "I audit published AI mathematics" from two domains to
     THREE (+ control theory). An auditor whose instrument can return
     CONFIRMED is the only kind whose REFUTED is worth anything.
   - mercer §6 — "what has been decided exhaustively, and why there is no
     single number". THE PAGE WAS DOUBLE-COUNTING: box 30 is nested inside
     box 40, so the old "5,090,150,225 sets" counted 98,979,465 twice;
     the lambda 23-row sum re-counted 31,020,445. Deflated and published
     by KIND with units named and NO TOTAL — the table's last row is the
     refusal itself. The buried result: 725,532,585 sets deepened M=25 ->
     M=30 (698,969,540 never before certified) whose collective answer was
     "the incumbent still stands" — 8 of 9 CONFIRMED, 1 improved. The page
     used to compress that into one subordinate clause. Also corrected:
     "confirmed thirteen of fourteen optimisers" was wrong on its face —
     only 9 rows carry a vsShallower verdict.
   - certs/census-high-periods.json — the landing page cited 1,419,655,025
     boxes from a file that lived at the REPO ROOT and was therefore never
     deployed: a headline number with no published artifact to check it
     against. Moved into certs/ (four builders rewired), so the existing
     cert sync publishes it; the cert-table gate refused until it had a
     row, which is the gate working.

  THREE PRIORITY CLAIMS DEFLATED: "the first certified mu(n) rows
  ANYWHERE" contradicted the same page's own Boyd-1986-is-unread
  disclaimer (3 leaks, now 0); the landing page's "rows nobody else
  holds" got the same treatment. Priority is never claimed from an
  unread record.

  THE ERDOS LANE — the repositioning move. Four Erdos problems were
  presented as four unrelated one-offs; reports/index.html now carries
  "Erdos problems, audited" grouping #852, #510 (mercer-program, which a
  reader previously could not tell was Erdos work at all), #290 and
  #1038. Presentation only, no new mathematics — it turns four pages into
  a program.

  MEASURED: 26 report pages, make test 35/35, control 28 batteries,
  drift 130 unchanged, design battery 20 checks / 6 falsifiers.

SESSION 2026-08-30c — THE LOWER WALL. A NEW FRONT, AND AN HONEST NULL.
(operator's word: "go 3,3,3" then "proceed"; four specs and five security ideas
were evaluated and DROPPED first — see the verdicts below.)

  WHAT WAS DROPPED, AND WHY (do not revisit without new information):
   - Spec 1 answer-preserving transformations: NO-GO on graphs/PIT. Our own d7
     rung already ran that experiment — a permutation disguise was SOLVED
     (opus 6/6, sonnet 3/3) while dense conjugation is 0/10. Relabelling defeats
     lookup, not RECOGNITION, and recognition is the binding property.
   - Spec 2 TSE election reconciliation: NO-GO, three ways. The check is an urna
     invariant, it is the totalizer's own upstream admission gate, and the two
     "independent" files are one file (206,117 of 206,117 keys identical,
     delta 0). Plus a criminal-statute hazard 35 days before a Brazilian
     election, with REFUTED and "certified" as hazard words. Do not revisit.
   - Spec 3 cold-vs-derived: GO-WITH-CHANGES but never run. Trials are not
     independent (opus emitted 2 distinct strings in 26 calls); temperature is
     a 400 on Opus 5/Sonnet 5; and the hypothesised wrong-sign failure mode
     DOES NOT OCCUR in our data.
   - Spec 4 certified RLVR: NO-GO as specified. The all-zeros witness scores
     8 violated equations of 64 and haiku's median is 9 — emitting NOTHING beats
     the model, so GRPO has no gradient. Transposed-Strassen also scores 8, so a
     dense shaping reward cannot tell "right answer, wrong convention" from
     "gave up".
   - ZK underconstrained-circuit auditor: NO-GO. Aims at the bug class a linter
     already detects at 100% and is definitionally blind to the class at 0%.
     Picus (MIT) is the incumbent; the pitch's formula is that paper's eq. 1,
     presented as the naive approach.
   - NIST conformance / PKI verifier / bounded patch certification: NO-GO
     (occupied, or hazardous, or both). The LLM-on-security-code eval survives
     as GO-WITH-CHANGES and is unbuilt.

  THE FILTER THAT EXPLAINS ALL OF THEM, and worth keeping: this machine's edge
  needs (a) an incumbent using FLOATS, so exactness buys something, and (b) a
  rule with a COMPELLED number, so the verdict has a buyer. FuelEU/HarborProof
  and eVTOL/SkyAudit have both. ZK has neither. Hunt where floats and
  regulators coexist.

  THE NEW FRONT — instruments/tensorlb/, THE LOWER WALL.
  Erdos-style upper-bound auditing has been this repo's habit for months
  (Strassen, Laderman, AlphaTensor, AlphaEvolve, all pinned in
  certs/strassen-certificate.json). The lower-bound side had never been touched.
  Chengu Wang, arXiv:2603.07280 (2026-03-07, MIT code at
  github.com/wcgbg/tensor-rank-lower-bound, TWO stars, pushed 2026-08-29) proves
  R_F2(<3,3,3>) >= 20, improving Blaeser's 19 of 2003. So far as we can
  establish nobody had ever checked it.
   - THE METHOD, and it is the point: we did NOT reimplement his four inference
     rules. A verifier that re-runs an author's own rules can only ever AGREE.
     tensorlb computes GROUND TRUTH — the true minimum rank of each constrained
     sub-tensor over F2 — and asks whether his number is the truth. A method
     that can DISAGREE is worth strictly more than one that cannot.
   - RECOVERED FROM THE BYTES, documented nowhere: the constraint semantics
     (bitmask functionals forced to zero) and the transposed c[k][i] index
     convention. Neither is stated in the certificate or the paper's text.
   - RESULT ON THE CONTROL (<2,2,2>, where rank 7 is optimal since Winograd
     1971): all 10 upper-bound witnesses re-verified against sub-tensors we
     rebuilt; 3 bounds proved two-sided; 0 refuted. The root node is the
     unconstrained tensor at lb 7 — had our search found rank 6 there, our
     SEARCH was broken, not mathematics. It did not.
   - RESULT ON THE TARGET (<3,3,3>, 496 nodes): 4 proved TWO-SIDED (his rules
     not relied on at all), 8 TIGHT-IF (an upper bound equal to his lower
     bound — NOT a proof of the lower bound), 6 SURVIVES, 478 NOT-ATTACKED
     (dim > 2, beyond the instrument), and 0 REFUTED.
   - PROVENANCE: both certificates are pinned in corpus/sources/PINS.json and
     the n333 sha256 EQUALS the git-lfs object id Wang published upstream
     (25595a88…c6135d) — we can prove we audited the exact bytes he shipped.
   - GATES: instruments/tensorlb/battery.py, 12 checks + 3 red controls that all
     fire (inflated bound, altered witness coefficient, deleted witness term).
     In make test and gating reports/tensor-rank-bounds.html.

  WE DISCOVERED NOTHING, AND THE PAGE SAYS SO. Zero refutations, no new bound,
  no counterexample; 478 of 496 nodes still rest entirely on Wang's reasoning.
  What exists is the first independent check of any part of a new lower bound on
  a fifty-year-old open problem — a reproduction, not a find. The operator wants
  a find and this is not one.

  THE REACHABLE NEXT STEP: dim-3 nodes (68 of them) need an exact method for
  3x9x9 tensors; dim-2 already uses the pencil identity
  min rank = min_X ( rank X + rank(M0+X) + rank(M1+X) ), searched randomly, which
  yields UPPER bounds only. An exact dim-2 minimisation would upgrade 8
  TIGHT-IF nodes to CONFIRMED. Beyond that the four rules must be implemented
  from the paper, and the honest artifact becomes "verifier derived partly from
  the reference implementation".

  ALSO OUTSTANDING, unactioned, from the audit earlier this session:
   - tools/llm-harness.py line ~1014 drops --effort/--stream in CAMPAIGN mode
     (the loop path passes them). The 90 rows tagged v4-effort-low therefore ran
     at DEFAULT effort and the tag is a lie on a live page.
   - tools/build-report-eval.js:53 counts budget-exhausted rows in the
     leaderboard denominator: opus-5 publishes at 30% where the honest graded
     rate is 90%, sonnet-5 at 33% where it is 100%.
   - No ledger row anywhere records output tokens above 4000, yet the eval page
     claims 16k and 32k campaigns. Re-run c1/c2 metered at high budget as v5.

FIRST THING NEXT SESSION (in this order):
  1. node tools/sweep-claims.js
  2. 8D DAILY LOOP — when adsb.lol releases a day D:
        node apps/skyaudit/audit/ingest-day.js D
        node apps/skyaudit/audit/forecast.js score D
        node tools/forecast-gym.js score D
     then commit forward both ledgers for the next uncommitted day. House is
     committed through 2026-09-09 (incl. the first weekend targets 09-05 +
     09-06); product through 2026-09-09; models through 2026-09-08.
     Days ingested and scored through Sat 2026-08-29 — the next release to
     watch is Sun 2026-08-30. NOTE for weekend days: the product ledger has
     no rows before 09-05, so `forecast.js score` on a weekend day at or
     before 08-30 THROWS "no commit with id" — that is the ledger honestly
     refusing to score what was never committed, not a failure. The gym
     scores those days normally.
     Model rows are spend-gated AND admission-gated: claude-haiku-4.5 is
     DEADMITTED and is now genuinely skipped, not merely refused at the
     ledger. Check the ledger before any campaign — a stale TARGETS list
     spends on calls whose rows can only be duplicate-refused.
  3. Shard health: tail -n 2 certs/shard-logs/shard-*.log
  Then the ACTIVE NEXT menu below — operator chooses.

#290 SUMMIT CAMPAIGN — STATUS AT HANDOFF 2026-08-30: six detached
shards ALIVE and healthy (pids re-verified, one process each), working
l = 121 -> 310. Measured at this handoff: 148 of the 190 target degrees
are closed across certs/erdos290-tail-shard-*.json (24-25 each), and the
42 that remain are the CONTIGUOUS TOP BLOCK l = 269..310 — the shards
have swept the range in order and only the summit is left. Cost is ~l^4,
so those 42 are far more than 42/190 of the work: l = 310 alone costs
~1.8x what l = 269 does. Progress across this session was 147 -> 148,
which is the honest rate to plan against — this is days of wall clock,
not hours. Nothing here needs attention unless a shard dies; the merge
path is unchanged:
    node tools/run-erdos290-tail-shard.js merge
    node tools/erdos290-cstar-precision.js 110
    make reports && make site && make test
    refresh outreach/erdos290-issue164.md + the OEIS constant packs
    with the new bracket, commit, deploy.

ACTIVE NEXT (operator to choose; nothing pre-authorized):
  A. HarborProof — FIRST LIGHT SHIPPED 2026-08-28 (see the 2026-08-28c
     session entry): instruments/fueleu (exact Reg 2023/1805 arithmetic
     from pinned OJ bytes; 10 checks + 5 reds) × the official EU-MRV
     2025 registry (17,045 ships, THETIS public API, sha-pinned) →
     reports/harbor-proof.html — 12,620 ships decided both years, EUR
     1.19B penalty floor on 2025 as sailed, EUR 3.31B re-sailed under
     2030, per-ship exact flip fractions (median 6.31%). NOTE: the DMA
     bulk AIS server was DOWN all session (TLS reset) — AIS voyage
     replay is the v2 roadmap, not first light; the registry
     counterfactual needed no AIS. NEXT here: candidate-fuel boxes
     (methanol/ammonia), company-level pooling arithmetic, the gym
     margin-forecast pack, the app-zone product face (word).
  B. 8E THE FORECAST GYM — BUILT 2026-08-28 + CAMPAIGN v1 COMMITTED
     the same night (operator's word "Proceed 1"): opus-5 (claim 4/5,
     wide, forecasts the weekend drop), sonnet-5 (claim 4/5), haiku-4.5
     (claim 5/6, NARROW — the overconfidence signature the admission
     rule will test). 36 model commits + 32 house = 68 on the ledger,
     0 scored at commit time; SCORED 2026-08-29 — sonnet-5 took both
     targets on Winkler (180/65), opus-5 tied on flights, haiku
     DEADMITTED exactly as its narrow intervals predicted. Sonnet's first 3 attempts
     returned empty text at max_tokens 2048 — the documented
     thinking-exhaustion HARNESS artifact, fixed at the cause (8192)
     and retried BEFORE anything was pushed (copy-honesty intact).
     Remaining gym moves: more packs · third-party sealed entries.
  B2. LAB v0 SHIPPED · LAB v1 (TWO POPULATIONS) SHIPPED 2026-08-29 on the
     operator's word "proceed on your order", from a paper the operator
     sent (Wang-Li-Yao-Xia, Mathematics 10(21):4075 — multi-population
     MFG solved by a GAN). NEW: labs/mfg2p/ (model + box certifier over
     a rectangle of COUPLING MATRICES + sweep + battery 11 checks / 7
     falsifiers) and reports/mfg-two-population.html — 21,567 cells,
     11,628 MULTIPLE, 24 UNIQUE, area identity exact. THE FINDINGS:
     (a) Lasry-Lions monotonicity (|s| <= c_self) is 11.2x CONSERVATIVE
     on this slice — it stops at s = 1, the first certified multiplicity
     is at s = 11.238; (b) THE UNFOLDING, which was not predicted: at
     d = 0 the second equilibrium arrives through a symmetry-breaking
     pitchfork at s = 10.90, and at d >= 0.05 there is NO singular
     Jacobian anywhere in s in [0,15] — the pitchfork unfolds, the
     primary branch goes smooth, and the second equilibrium survives on
     a branch NO continuation can reach. Battery U1/U2 gate it. Since
     attack-defense means d != 0 by definition, that is exactly the
     regime a neural solver goes blind in, and 11,300+ of the MULTIPLE
     cells sit at d > 0 — certified where continuation cannot look.
     REMAINING on this shelf: the sigma axis (still the expensive one,
     see the note below), the fold in d (it sits past d = 1.5 at
     sigma = 0.5, so this map does NOT locate it and the page says so),
     a second named engagement, and the letter's send (word).
  C. 8C-full — certified-universal-over-forecast-envelope fleet
     statements; BLOCKED on the parked scenario packs.
  THE PRUNE GAP — FOUND AND CLOSED 2026-08-29 (operator's word "Approved,
     go ahead"). When claude-haiku-4.5 was DEADMITTED by the first scoring,
     the rule was enforced in ONE place: the loop that commits the three
     HOUSE proposers. tools/forecast-gym-campaign.js queried its own model
     list and called L.commit directly, and L.commit enforces temporal
     hygiene but NOT admission — so a pruned model would have been queried,
     paid for, and committed. The prune held for the baselines and did not
     hold for the models it was written for. NOW: one admissionGate() in
     forecast-gym.js that both paths call; the campaign checks it BEFORE the
     API call (a prune enforced only at the ledger costs money to enforce)
     and again at commit; board() is time-parameterised (board({asOf})); and
     auditAdmissionHistory() replays EVERY commit against the board as of
     its own madeAt — the record-level invariant that does not depend on any
     caller. The report page gates on it (gate 4) and the gate is proven
     non-vacuous by a red control that builds a corrupt ledger and must
     catch it with the exact tail 1/36. Verified live: injecting a real
     post-deadmission haiku commit REFUSES the page.
  CAMPAIGN v2 COMMITTED 2026-08-29 (operator budget: $20). Targets
     2026-09-03..09-08 — the campaign's TARGETS were stale (all six already
     on the ledger), and a stale target list SPENDS on calls whose rows can
     only be duplicate-refused, so check the ledger before every campaign.
     opus-5 (claim 2/3) and sonnet-5 (claim 3/4) entered, 24 rows;
     haiku SKIPPED, NOT QUERIED. Both models claimed LOWER coverage than in
     v1 (4/5) — noted, not explained. The campaign now meters itself: every
     run prints tokens in/out and dollars at cached rates. MEASURED SPEND:
     $0.0682 dry + $0.0703 commit = $0.1385 of the $20. Ledger 124 commits,
     audit 0 violations, haiku frozen at 12 while everyone else grew to 24.
  DAILY LOOP (8D, proven end-to-end and now RUN TWICE — first scoring
     2026-08-29, second 2026-08-30 on target Sat 08-29):
     when adsb.lol releases a day D:
     node audit/ingest-day.js D && node audit/forecast.js score D &&
     node tools/forecast-gym.js score D, then COMMIT FORWARD (product
     + gym) for the next uncommitted days — the ledger ages only if
     fed daily. Committed through 2026-09-09 (house + product; the
     first weekend targets, 09-05 + 09-06, entered 2026-08-30 the day
     the weekend group reached n = 2). Model rows are
     spend-gated: a DEADMITTED proposer's commits are refused, so
     claude-haiku-4.5 is out until it is recalibrated and re-entered.
     `forecast-gym.js commit` touches ONLY the three house proposers —
     it costs nothing and is safe to run any time; model rows come from
     the separate spend-gated campaign script.
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
 5. EVAL — WORKED 2026-08-30 (operator's word "proceed this front", budget
    $15, MEASURED SPEND $3.40). THE RESULT: the contamination delta is now a
    MEASUREMENT, not an assertion. Same model, same effort, same 4k cap, same
    code path; the only variable is whether the answer can be RECALLED or must
    be DERIVED (rung ('tensor','cN',7) = Strassen under a seed-pinned
    unimodular change of basis, provably solvable because the witness is
    Strassen transported, and the build checks that it certifies):
        model      plain Strassen      conj c1            conj c2
        sonnet-5   10/10 CERTIFIED     0, never answered  0, never answered
        opus-5      9/10 CERTIFIED     0, never answered  0, never answered
        haiku-4.5   0/10               0/10               0/10
    REPLICATED on two independent seeds (c1, c2 — the ladder now publishes c2
    and c3; conj_matrices is seeded by the tag string so instances are mintable
    forever). "Never answered" = the model spent its ENTIRE output budget and
    emitted no parseable decomposition, though a valid answer is 347 characters
    with no entry above 3; measured at 4k, 16k, 32k and 48k and at effort low,
    medium and default.
    THE CONTROL IS THE POINT: haiku fails the recallable rung exactly as it
    fails the conjugated ones, so the gap appears ONLY in models capable enough
    to recall Strassen. Without that row its zero would have looked like
    evidence and been none. And low effort is not disabling — sonnet certifies
    10/10 at low effort on the recallable instance.
    FOUR HARNESS CAPABILITIES ADDED (tools/llm-harness.py), all permanent:
    (a) token+dollar METERING per row and per run — before this the ledger
    recorded latency only, so a rung's cost could never be checked against a
    budget; (b) SSE STREAMING — without it the hard rungs cannot be run at all,
    a non-streaming request that large outruns the HTTP timeout; (c) --effort,
    the thinking-depth knob, which is the right lever when a model deliberates
    past its whole output budget (raising max_tokens only buys more silence);
    (d) budget-exhausted LEDGER ROWS — excluded from every rate (our cap is not
    the model's failure) but PRESENT, because a model asked ten times that
    never answers must not look like a model that was never asked. That
    omission would have silently gutted the strongest column of the table.
    STILL OPEN HERE: feedback conversion is STILL 0 and now for a new reason —
    the conjugation rung produces no first proposal to give feedback ON, so the
    loop has nothing to iterate. Also unexplained: at effort low sonnet
    DECLINED in 56 tokens in loop mode but EXHAUSTED 10/10 in campaign mode,
    same model, same effort, same rung. n = 10 per cell, no uncertainty stated.
 5a. EVAL, REMAINING: bigger n on v3 rungs / new model rows (keyless auth live;
    thinking rungs cost 10-30k output tokens/proposal); a true
    feedback-conversion loop needs an intermediate-capability model;
    Laderman/r22 loops need >24k budgets. R3 CONJUGATION RUNG BUILT
    2026-08-28 (word "work on R3 until ship"): ('tensor','c1',7) on
    the ladder — seed-pinned unimodular conjugation, transported
    Strassen green control, RAW Strassen as a red that must fail,
    fresh instances mintable forever (tags c2, c3, ...). First
    campaign tag v4 (see session 2026-08-28c for the budget lesson).
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
 O2. HarborProof — UPGRADED 2026-08-27 (the killer-app test applied):
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
 11. KAUST LETTER — REWRITTEN AND STAGED 2026-08-28 as
     outreach/kaust-mfg-lab.md, now paired with its delivery vehicle:
     reports/mfg-observatory.html (the regime map), reports/mfg-certify.js
     (the one-file certifier, no dependencies) and labs/mfg/ in the
     public repo — and now ALSO reports/mfg-two-population.html, which
     engages Cirant's multiplicity line directly instead of only citing
     it and is the stronger opening gift; the letter's evidence
     paragraph should be refreshed to lead with it before it sends. Closing ask, verbatim: "send me the one claim that
     costs your group the most time to defend." STILL NEEDS from the
     operator: the recipient (Ribeiro alone or +1), three opening
     sentences in your own words, and a yes/no on the ask as written.
     The earlier objection ("reword 'live in the browser'") is moot —
     it is literally live in the browser, CDP-verified.
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

SESSION 2026-08-29 (EVERY REPORT GETS A CHART — operator's word:
"apply at least one chart, graphic per report. Cleverly decided and
showing insightful information"):
  - COVERAGE IS NOW 24/24. The thirteen remaining pages each got the
    chart its own argument needed, not a chart:
      impostors    agreement depth per constant against the 17-digit
                   double screen — the page's thesis, drawn
      answer-key   the two ways to be wrong on ONE axis: right to 11
                   digits, or right to 62 and still refuted; the float
                   screen falls between them
      methods-note how 10 real defects were caught, INCLUDING the empty
                   bar the page is titled after ("none by reading code")
      matmul-eval  outcome mix per campaign — the REFUTED band is empty
                   across 274 proposals, which is the finding
      verifier-loop every trajectory round by round: the 3 certified are
                   green in cell one, so no feedback conversion exists
      forecast-gym what each proposer RISKED before the day existed —
                   widths 0 to 222 on the same future
      mfg-cap      separation vs combined radius on one log axis: 10^13
      mfg-congest  the radii polynomial itself, from the verifier's own
                   Y0/Z1/Z2 — the one inequality the proof rests on
      mfg-lab      the paper's Table I edge by edge, 12 of 15 exact
      wardrop      one paper, all three verdicts (exact/enclosed/refused)
      lemniscate   enclosure width vs the box the manuscript needs: 15
                   decades of margin
      zeta3        the five rows by how tightly each is pinned — the
                   "new and unproven" ones are held to the same standard
      alien-science the exact residual axis where epsilon = 0, so the
                   admissible set is a POINT and no score can move the
                   mutant into it
  - THREE CHARTS CHANGED WHAT THE PROSE SAID, which is the point of
    drawing things. The impostor caption first claimed every constant
    cleared the 17-digit line; two are at 16, and the corrected text
    now says what the chart says. The mfg-lab caption quoted a
    max gap of 2 against the page's own 1.568 — the first is a
    difference of ROUNDED totals, the second the gate's unrounded
    deviation, and the caption now distinguishes them. HarborProof's
    spike was found the same way last session.
  - KIT ADDITIONS, all from real failures seen on screen: intervals,
    segments (three-valued verdicts and stacked shares), log x-axis and
    marks on bars, vertical callouts on lines, notes on segment rows,
    and — the important one — the legend now WRAPS instead of silently
    dropping its last key off the right edge.
  - design/battery.js: 24 pages, 48 svg roots, 0 literal colours, every
    figure with a text alternative. make test 34/34.

SESSION 2026-08-28f (THE DATAVIZ PASS — operator's word: "UX + UI pass
focused on charts and graphics ... minimal, beautiful, adapt to our
colours ... insert charts across the reports"; no reference images
arrived with the message, so the direction was taken from the words):
  - THE SHELF HAD NO CHARTS. 24 report pages, one figure between them
    (the observatory map). Now nine pages carry one, each chosen as
    that page's most important thing to see:
      erdos290     the certified width of c closing, log scale, with the
                   cited page's horizon shaded — every point bracket(L)
                   recomputed in exact rationals at build
      erdos852     the refutation at 1e-13 zoom: the published constant
                   and a naive double product on the SAME point, outside
                   the certified enclosure; log1p back inside
      harbor-proof the per-ship flip fraction as a population — and the
                   chart found something: 2,286 ships (18%) in ONE bin
                   carrying 30 distinct values, the signature of a shared
                   default emission factor, now stated in the caption
      skyaudit     the reserve-price ladder as EMPHASIS (Beta in the
                   accent, the other three in context grey) — the form
                   the skill names for "one series is the point"
      evtol        the three-valued verdict SWEPT: certified / hatched
                   undecidable / refuted across cruise duration, both
                   rules. The machine's signature picture
      entropy      proved vs open, drawn to scale, with ln 2 marked
      mercer       the mu(5) ladder falling rung by rung
      water-value  the margin as a DISTRIBUTION, not a maximum
      rm-audit     51 printed rows as cells: 50 green, one plum
      alphaevolve  naive rank -> certified rank per shape, dumbbell
  - THE ASSET IS design/charts.js — nine forms (lines, band, bars,
    dist, dumbbell, strip, intervals, segments, sparkline) with the
    rules applied BY CONSTRUCTION: colour by job, three identity hues
    max (context exempt, which is how emphasis works), text never wears
    the data colour, 2px lines / 4px rounded data-ends / 2px surface
    gaps / hairline SOLID grid (dashes reserved for predicted marks),
    labels selective. One delegated hover listener per page — the
    second scripted element the design system ships, and it enhances
    rather than gates.
  - THE PALETTE WAS DERIVED, NOT PICKED. The text tokens FAIL as chart
    marks (outside the OKLCH band, --held under the chroma floor,
    green<->amber at deltaE 5.4 protan). Chart steps were snapped from
    the SAME three hues — hue held, L and C moved — taking the passing
    candidate CLOSEST to the brand. The first answer passed the
    published standard and then collapsed to deltaE 4.3 under
    tritanopia, which our own battery gates and the standard does not;
    the second answer clears all three CVD types AND sits closer to
    the brand tokens, so nothing was traded for it.
  - design/battery.js is new and in make test (34 rows now): it
    re-derives the palette checks in OKLab with Machado 2009 rather
    than quoting them, scans every generated report for a literal
    colour inside an <svg> (DESIGN.md has claimed "tokens only" since
    the beginning with nothing enforcing it), checks every figure has
    a text alternative, and fires four falsifiers.
  - Verified by CDP in BOTH themes at desktop and phone widths, with
    the hover readout exercised in-browser; no horizontal overflow.

SESSION 2026-08-28e (LAB v0 — operator's word: the MFG research lab,
tools-first, target Ricardo de Lima Ribeiro; three binding requirements
kept — full rebuild in OUR design system, tools-first, code in labs/mfg
with the page under /reports):
  - THE CENTREPIECE SHIPPED: reports/mfg-observatory.html. 19,800
    cells; 11,330 MULTIPLE (30.7% of the plane by area), 384 UNIQUE,
    8,086 UNDECIDED (6,470 still carrying one certified enclosure).
    Tightest witness anywhere in the map clears its own combined radii
    by 289.6x; smallest certified density 2.81e-7 (positive, and it is
    proved, never assumed — m > 0 is a hypothesis of the model).
  - THE MATHEMATICS THAT MADE IT A MAP AND NOT A TABLE: the box
    certificate carries a QUANTIFIER — for every s in the rectangle
    there is a unique solution in B_r(xbar(s)) — which needs (a) A
    fixed at the box midpoint, so the tail of I - A DPhi carries an
    undecaying 1 - sigma/sigma0 that is charged by hand, and (b) a
    TANGENT PREDICTOR, without which admissible cells collapse from
    0.0625 to 0.004 in c (15.6x). Measured, not assumed: box.js has an
    opts.freezePredictor switch so falsifier X2 walks the same width
    ladder both ways, and the page parses the ratio from that run.
  - THE DIVERGENCE GUARD: labs/mfg/box.js is a SECOND implementation
    of the lifted kernel's argument. G1/G2 require bit-for-bit equality
    at zero width on 7 reference instances (kappa 0.4494 at
    (0.5,-24,0) reproduced from validate.js's own header comment), and
    the page refuses to build without them. The browser bundle is
    assembled from the source files and executed against the Node path
    for the same reason.
  - THE NEGATIVE DIRECTION: refuteCandidate — paste a claimed
    equilibrium and a claimed accuracy; one equation whose residual
    exceeds its own row bound times delta proves no exact solution is
    that close. R2 requires the instrument to REFUSE rather than
    certify when handed a true equilibrium.
  - THREE DOORS, all verified: the in-page paste box (CDP-driven click
    returned MULTIPLE with the same witness numbers as Node),
    reports/mfg-certify.js (56 KB, zero dependencies, run at build),
    labs/mfg/ with its README.
  - HOUSEKEEPING found and fixed at the cause: `make site` had been
    REFUSING since the #290 shard campaign started, because the
    in-progress certs/erdos290-tail-shard-*.json files are not on the
    published certificate shelf. They are working records that `merge`
    folds into erdos290-tail-ext.json, so they are now gitignored (like
    certs/shard-logs/) and excluded from the shelf check by name, with
    the reason written down. A running campaign can no longer block a
    site build.
  - The map record is written compact (one cell per line, reasons
    interned): pretty-printing 19,800 cells cost 13 MB of leading
    spaces, and a record that large is one a host may silently drop.
  - make test gains a row (mfg lab box certifier). Battery 9 checks +
    6 falsifiers, all green.

SESSION 2026-08-28d (the #290 revisit + the discoverability front —
operator's words "boost the 290 until where we can", "wait l=120 and
have all outreach updated, committed and deployed", "work in the
foreground on the other tasks"):
  - THE #290 STATE, READ: your issue-164 comment (teorth/erdosproblems,
    4 Aug) IS the full answer to Woett's help-wanted ask; zero replies
    in 24 days because the problem-page comment it promised never
    cleared moderation. The account for OEIS was only requested
    2026-08-28 — so the about page's "OEIS submission, posted 4 August,
    unanswered" line is WRONG and must be corrected (operator to
    confirm what happened on Aug 4; nothing was ever filed).
  - THE TAIL EXTENDED to l = 120 (even d <= 240): 60 degrees closed,
    0 open; the ONLY drops are d = 168 and 224 — exactly the two
    4k(k+1) in range, the law twice more. Bracket c ∈ [0.829918323,
    0.831988708] (width 2.07e-3, from 2.75e-3); 1/(1+c) ∈
    [0.545854892900, 0.546472477723]; assumption enters at d >= 242.
    Timing law measured ~l^4 (116 s @ 91, 212 s @ 105); the l≈310
    summit (third UNCONDITIONAL digit) is ~11 single-thread days ->
    tools/run-erdos290-tail-shard.js (per-shard files, merge refuses
    disagreement) LAUNCHED with 6 shards at session end — see the cold
    start; `merge` then rebuild when they finish. Fourth digit needs
    l≈740 (months): not on the menu.
  - PRECISION: tools/erdos290-cstar-precision.js moves the conditional
    enclosure's certified horizon to the live tail record (the lifted
    kernel capped at 46 digits by ITS first uncertified degree); gated
    by calibration vs the kernel (43 digits agree), cutoff agreement,
    containment. 110 digits of c* and of 1/(1+c*) — outreach/
    b-oeis-cstar.txt, b-oeis-c0.txt (rerun after each horizon move).
  - OUTREACH STAGED (all sends on the word; OEIS clicks are the
    operator's, account pending approval): outreach/erdos290-issue164.md
    (the posted comment pinned + the refreshed follow-up draft),
    outreach/oeis-erdos290-pack.md (5 packs: disc(f_d) and disc(h_l)
    integer sequences with Bareiss-verified terms + b-files, the
    A033996 comment, the two constants staged for after the campaign),
    outreach/zenodo-plan.md (repo-release DOI now; the #290 deposit
    after the summit; ORCID first; arXiv note follows Woett).
    Recommended order: ORCID -> issue-164 follow-up (the loop-closer;
    numbers are l=120-fresh) -> OEIS packs 1,2,3 once approved ->
    constants after the campaign.
  - DISCOVERABILITY FRONT (was title-only): template head with
    description/og/twitter/favicon, favicon.svg + og.png born from the
    design tokens (CDP-rendered card), canonical + og:url, www->apex
    308 in vercel.json, robots.txt + sitemap.xml generated from the
    desired map (30 URLs), canonical path on all 23 report builders,
    hand-written descriptions on ten flagships.
  - JUDGMENT CALLS recorded: All Things Agentic hackathon (Google
    stack, Aug 31, 11k entrants) — PASS, wrong window/audience/stack.
    OEIS entries — worth doing as the first third-party acceptance and
    the pretext for engaging van Doorn, not as a credential.
  - LAB v0 (MFG, tools-first, target Ricardo de Lima Ribeiro) approved
    and written up as FIRST THING NEXT SESSION above.

SESSION 2026-08-28c (R3 + HarborProof — operator's word "work on R3 and
harbor-proof until ship and stop"):
  - R3 SHIPPED: the conjugation rung ('tensor','c1',7) in the harness —
    seed-pinned unimodular conjugation (tensor_value/tensor_witness
    generalize the d7 path; instance c1: 40 nonzeros, entries to |8|,
    witness coeffs to |3|); greens: transported Strassen certifies;
    reds: sign-flip + RAW STRASSEN must fail (the recall control); dry
    battery green (34 reds run, 0 certified). /oracle/ ladder's
    "next, unbuilt" row became the live "search" row; eval page gains
    §2f (fresh instances forever — contamination-proof by algebra).
    CAMPAIGN v4 FINDING (the budget wall, stated on §2f): d7 was
    opus-solvable @16k; on c1 opus emits EMPTY at 16k and sonnet at
    32k every attempt (skipped as harness artifacts); the API 400s
    non-streaming budgets above ~32k — STREAMING SUPPORT in the
    harness is the named unblock for deeper budgets. haiku attempted
    6/6, all exactly rejected. Recall provably scores zero on this
    rung; derivation hasn't yet fit a buyable budget.
  - HarborProof FIRST LIGHT SHIPPED (see ACTIVE NEXT A for the standing
    state): instruments/fueleu (Reg 2023/1805 constants transcribed
    from OJ bytes fetched via the Publications-Office cellar — EUR-Lex
    proper anti-bots 202s; the DMA AIS bulk server was DOWN all
    session, TLS reset — v0 pivoted to the BETTER source: the official
    EU-MRV per-ship registry, THETIS public API, 2025 v45 generated
    the same day). THE SHARPENING that made the page: the naive outer
    box (any WtT × any LCV) straddled 11,971 ships; constraining the
    fuel-mix simplex by each ship's own reported CO2eq/fuel ratio
    (extremes at two-fuel vertices — linear-fractional over the
    constrained polytope) decided ALL 12,620 admitted ships with 0
    straddles. Battery 10 checks + 5 reds incl. the 1e-9 boundary
    flip; make test now 32 rows; control page 28 batteries.
  - QUEUED BY THE OPERATOR mid-session: the Erdős #290 revisit (their
    #290 comment never cleared moderation while #852 did). Prep done
    this session: thread re-read (Woett = van Doorn asks for the
    constant's OEIS expansion; TAO suggests the help-wanted GitHub
    issue route; 4 comments, ours absent), Woett's b<=6a Lean file
    fetched (Aristotle+Alexeev, mathlib 4.24.0), our 290 batteries
    green, A375081's 10,000 terms audited against [vD24]'s proved
    bounds (0 violations; min (b-a)/log a = 0.657 at a=9233, above
    our conditional 1/(1+c*) = 0.54622931...), tail-extension runner
    confirmed incremental past l=90. Assessment delivered in-session;
    next moves await the word.

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
