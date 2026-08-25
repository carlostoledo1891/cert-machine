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
     46  Ramanujan Machine conjectures SURVIVE an UNCONDITIONAL audit — SIX complete
         sheets: e, pi, zeta(3), CATALAN (23 rows), pi^2 (12), ln 2 (1) — including
         ALL 34 rows the Machine marks "new and unproven"; Catalan's G certified from
         its defining series with a PROVED convexity tail (96k^2+288k+184 >= 0, exact),
         pi^2/acosh(2)/ln2 brackets at 1e-47; Möbius forms (p+qK)/(s+tK) decided in
         exact rationals; three head-negative rows via an exact head-shift transform;
         six sign-definite-NEGATIVE-head rows admitted by a gated minus.js extension
         (fixed sign, not positivity, is what increasing maps need)
      9  fast matrix-multiplication algorithms VERIFIED as exact tensor identities
         (strassen-audit): Strassen 1969 calibrates; Strassen⊗Strassen rank-49 generated
         and re-decided; AlphaTensor's rank-47 4x4 VERIFIED over F2 and REFUTED over Q —
         the speedup provably needs characteristic 2; naive rank-8 honestly REJECTED
 0.3017  certified lower bound on h_top(Henon, 1.4, 0.3) — 340 disjoint h-sets, 4,140
         covering relations (durations 1..6, composed to the uniform F^11 as BINARY
         relations), exact spectral bound; census ceiling ln(1696)/16 = 0.4648
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

Batteries 21/21 on the page (22 rows in `make test`). Engine gate 31/31.
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
| `ramanujan-audit` | the Ramanujan Machine's conjectures, decided | 46/46 SURVIVE unconditionally across SIX complete sheets (e, pi, zeta(3), Catalan, pi^2, ln 2) incl. ALL 34 "new and unproven" rows; calibrated on Apéry + both PROVEN pi^2 rows (Kadyrov–Orynbassar) + both known rows (incl. the two-constant 6/(8G−π·acosh 2)); G from its defining series with a proved convexity tail; REMAINING: the mixed-zeta-orders sheet (5 rows, all with the (c−1)² double-root pathology — rm-z3-inv-grade band craft each) |
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
   new reds). REMAINING, the last sheet:
   results_different_zeta_orders.pdf (fetched, NOT yet pinned/transcribed)
   — 5 unproven rows mixing zeta(2..5,7), every one with a_lead=2,
   b_lead=1 => (c−1)^2 DOUBLE ROOT: each band needs rm-z3-inv-grade craft
   (sharp sub-leading exclusion, depth ~1e7, honest slow convergence), and
   zeta(4)=pi^4/90 / zeta(5) / zeta(7) brackets from defining series
   (easy, zeta3Bracket's pattern).
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
   snippet runs verbatim). REMAINING, all operator-gated: (a) post the
   comment — login click, nothing auto-sends; (b) OEIS: NEITHER constant
   has an A-number (corpus grep: 0 matches) — two submittable sequences,
   but OEIS forbids AI-generated submissions, so operator-authored or not
   at all; (c) A078515 extension (27 terms, primes to ~2e11, Alexeev
   invited) is a separate detach-runner compute job. Occupancy lesson
   applied: page + thread + /proof-claims all fetched; 0 claims there.
2. **The Mercer/Newman mu-lambda continuation.** sin-mfg holds certified
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
   text 401s). Unblocking needs the OPERATOR's archive.org borrow (1-hour
   loan reads fine) or a library copy. The COMPUTE side (mu(10..16), n=17,
   lambda) is not gated — only novelty prose is.
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

A front is worth another run while the marginal run still moves one of two
numbers: **discovery yield** (new certified objects nobody holds) or **instrument
yield** (bugs found, capability gained). The OEIS run scored 0 discovery and high
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
