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
819,095  objects generated across 9 families
 16,886  certified exactly
54.6M    closed forms: 54,625,624 tested = 54,624,725 refuted (double)
         + 21 refuted (exact BigInt) + 877 form-on-record + 0 open + 1 surviving
         — the decomposition closes, and the engine REFUSES a ledger where it does not
    228  existence-AND-uniqueness theorems (Krawczyk)
    452  COMPLETENESS theorems (census: Hénon 328/328 + Holmes cubic 124/124, 0 refusals)
  1,579  chowla screen survivors EXHAUSTED (1,508 certified below 1 — the family is terminal)
     11  keller corpus certificates: Alpöge n=3 + ONE padded row stating the stabilization,
         3 tangent-sweep instances, Meng–Yang HC5, Gallagher d=2..5 + the distinct member —
         every det a symbolic identity over Q, sources hash-pinned, ALL 11 re-verified by a
         standalone stdlib-Python checker in 0.2 s
      7  fibers cells HIT blind, incl. alpoge-own-target: target (0,1,0) chosen from a fixed
         enumeration, never published anywhere, 3 preimages certified — witnesses AND target self-chosen
     10  Ramanujan Machine conjectures SURVIVE an UNCONDITIONAL audit — the e sheet, the pi
         sheet, and the COMPLETE zeta(3) sheet, including BOTH rows the Machine marks
         "new and unproven" (enclosure widths 2.2e-16 and 8.9e-16)
```

Batteries 16/16 on the page (17 rows in `make test`). Engine gate 31/31.
Census battery 26/26 (two maps, 5 red controls), keller battery 32/32
(incl. pin drift + forged-pin reds), cf battery 17/17 (7 red controls;
Apéry's proved identity is the calibration), entropy battery 11/11 (ln 2
calibration at the full horseshoe; 4 red controls; the detached
certificate re-proved in full every run). Reports shipped (make reports):
reports/impostors.html, reports/zeta3-audit.html, reports/entropy.html —
every number recomputed from records at build time, every build
self-refusing on drift. h_top(Hénon 1.4, 0.3) >= 0.356403 is a certified
theorem (certs/entropy-henon.json). Drift: 38 unchanged, 1 local edited (a
declared patch).

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

## The seven families

| family | output | result so far |
|---|---|---|
| `newman-minmod` | min\|f\| on \|z\|=1 for 0/1 polynomials | 4 certified; one adopted into the envelope (17-term, min\|f\| ≥ 1.4141441147942588) |
| `chowla-cosine` | Chowla merit c = −min f_A/√\|A\| | **EXHAUSTED**: all 1,579 screen survivors certified, 1,508 below 1 — the family's terminal state (R6) |
| `oeis-closedform` | audits 14,593 published OEIS constants | 54.6M forms refuted, **0 discoveries** — and the counts now decompose to zero on the page (R1) |
| `henon-orbits` | **certified existence + uniqueness** of Hénon periodic orbits | 228 theorems, calibrated against the closed-form fixed points |
| `keller-audit` | Jacobian + Hessian counterexamples decided — and GENERATED | 11/11: Alpöge n=3 + one padded row stating the stabilization (R2); 3 NEW CURVES through the PUBLISHED tangent-sweep mechanism (labeled as such, R4); Meng–Yang HC5; Gallagher d=2..5 + distinct member — every det a symbolic identity, sources hash-pinned (R3), all detached + independently re-verified (R7) |
| `keller-fibers` | fiber counts certified BLIND — no witnesses consumed | 7/9 HITs: Alpöge's 3 preimages rediscovered unaided; alpoge-own-target proves the same with a SELF-CHOSEN target (0,1,0) — 3 preimages, full geometric degree; 2 cells honestly REJECT/REFUSED (witnesses at \|z\|~200, beyond blind reach) |
| `ramanujan-audit` | the Ramanujan Machine's conjectures, decided | 10/10 SURVIVE unconditionally: 5 positive-CF (e, pi sheets) + the COMPLETE zeta(3) sheet — 4 minus-CFs decided by the tail-band evaluator incl. BOTH "new and unproven" rows, plus the sheet's positive row the first transcription missed |
| `henon-census` | **the EXACT number** of period-p points, plane exhausted | 328/328 cells; at a=1.4: exactly 4 period-7 and 7 period-8 orbits (matches Galias); one-off records through p=16 (1696 points, 1.42G boxes, recheck-clean) |
| `holmes-census` | the same, for the Holmes cubic map x' = dx − x³ + b·prev | 124/124 cells (d sweep through the pitchfork, p ≤ 4); at d=2.77: exactly 3/9/15/49 points for p=1..4, 63 for p=5; calibrated on the closed-form fixed points ±sqrt(d+b−1) |

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
   REMAINING if wanted: more Machine sheets (zeta(2), Catalan, ln 2) are
   one transcription + one constant-bracket each; the minus evaluator and
   the exact-bracket pattern generalize as-is.
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
7. **A fast-matmul audit family (`strassen-audit`).** Fast matrix
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
   h_top(Hénon, 1.4, 0.3) >= 0.356403, a theorem: 228 pairwise-disjoint
   h-set parallelograms, 916 covering relations for the single iterate F^4
   (strict interval inequalities, adaptive bisection, outward rounding),
   exact BigInt spectral bound ln sp(T)/4; one consumed external theorem
   (Zgliczynski–Gidea covering relations -> subshift semi-conjugacy), used
   the way Krawczyk's is. Calibrated where the answer is known: in the
   Devaney–Nitecki regime (a=6) the instrument certifies the FULL 2-shift,
   h >= ln 2 exactly. Four red controls; the battery re-proves the entire
   detached certificate every run (11/11). The census ceiling is
   ln(N_16)/16 = 0.4648 (literature h ~ 0.4651) — today's bound is 76% of
   it. The gap is graph structure, not rigor: uniform box sizes and one
   global iterate. NEXT: per-edge durations with Bowen-weighted spectral
   bounds, boxes sized to local expansion. A bug worth remembering was
   found by running: the first covering condition demanded the whole image
   inside the target's s-strip — a long horseshoe leg legitimately
   overshoots in u, and the correct condition only forbids touching the
   s-lids; symptom was edges certifying but never a cycle.
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
