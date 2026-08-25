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
819,097  objects generated across 9 families
 15,609  certified exactly
54.6M    closed forms tested · 54,617,565 refuted · 0 surviving
    228  existence-AND-uniqueness theorems (Krawczyk)
    452  COMPLETENESS theorems (census: Hénon 328/328 + Holmes cubic 124/124, 0 refusals)
      6  dimensions in which the Jacobian conjecture is certified FALSE (keller-audit, n=3..8)
      3  NEW counterexamples GENERATED here (tangent-sweep, geometric degree 4/5/6, rational witnesses)
      1  HESSIAN conjecture counterexample audited (Meng–Yang HC5: det Hess ≡ 128, 5 variables)
      5  Gallagher-family members audited from the seed (det ≡ 1, fiber degrees 3..6, + the distinct member)
      6  fibers recounted BLIND (multistart + Krawczyk boxes; Alpöge's 3 preimages rediscovered unaided)
      5  Ramanujan Machine conjectures SURVIVE a rigorous audit (4 zeta(3) minus-CFs recorded, pending)
```

Batteries 13/13 on the page (14 in `make test`). Engine gate 31/31. Census
battery 26/26 (two maps, 5 red controls), keller battery 26/26 (7 red
controls; the generator reproduces Alpöge polynomial-for-polynomial, and the
doubling identity det Hess(y·F) = −(det J F)² = −4 makes the Alpöge and
Meng–Yang corpus entries certify each other). Drift: 38 unchanged, 1 local edited (a declared patch).

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
| `chowla-cosine` | Chowla merit c = −min f_A/√\|A\| | 295 certified below 1 |
| `oeis-closedform` | audits 14,593 published OEIS constants | 54.6M forms refuted, **0 discoveries** — every survivor's full record fetched and its form found on record, a verdict the engine now reaches itself |
| `henon-orbits` | **certified existence + uniqueness** of Hénon periodic orbits | 228 theorems, calibrated against the closed-form fixed points |
| `keller-audit` | Jacobian + Hessian counterexamples decided — and GENERATED | 15/15: Alpöge n=3..8; 3 generated from our own curves; Meng–Yang HC5; Gallagher's family d=2..5 + distinct member, reconstructed from the seeds — every det a symbolic identity, every witness exact rational |
| `keller-fibers` | fiber counts certified BLIND — no witnesses consumed | 6/8 HITs: Alpöge's 3 preimages rediscovered unaided; gallagher-d2/d3 at full tangency degree; 2 cells honestly REJECT/REFUSED (witnesses at \|z\|~200, beyond blind reach) |
| `ramanujan-audit` | the Ramanujan Machine's conjectures, decided | 5/5 positive-CF conjectures survive an UNCONDITIONAL interval audit (tail seeded by proof); the engine's own vocabulary then rediscovers (1/4)·π as the unique surviving form over the Brouncker enclosure |
| `henon-census` | **the EXACT number** of period-p points, plane exhausted | 328/328 cells; at a=1.4: exactly 4 period-7 and 7 period-8 orbits (matches Galias); p=12 = 248 points/19 orbits in 52 s |
| `holmes-census` | the same, for the Holmes cubic map x' = dx − x³ + b·prev | 124/124 cells (d sweep through the pitchfork, p ≤ 4); at d=2.77: exactly 3/9/15/49 points for p=1..4, 63 for p=5; calibrated on the closed-form fixed points ±sqrt(d+b−1) |

The census (`instruments/census/henon-census.js`) is the completeness record
the field survey said nobody publishes for non-SAT numerics: a certified a
priori bound confines every periodic point, interval tube iteration excludes,
Krawczyk-as-contraction resolves each remainder to exactly one point, and
minimal periods are decided by certified shift-links — never by tolerance.
It can refuse; it can never return a wrong count. Two bugs were found exactly
the way the method predicts: by a red control (the fat-record stall at a=0.96,
p=4 — caught by the shift classification, not by reading code).

## Review fixes (an outside reader's pass, 2026-08-25 — verified, accepted)

- **R1 · the 898.** tested − refuted − surviving = 898 on the page; verified:
  exactly the OEIS family's double-precision survivors, later decided by the
  exact BigInt test (21) or the form-on-record check — never folded into a
  displayed tally. Decompose the counts on the page so the subtraction a
  reviewer will do comes out to zero.
- **R2 · stabilization padding.** Alpöge rows n=4..8 are one theorem by
  identity-padding; a knowledgeable reader sees six rows as padding. Collapse
  to n=3 plus ONE padded row with the stabilization stated.
- **R3 · hash-pinned transcriptions.** The keller corpus is transcribed from
  a tweet, a Zenodo PDF, an arXiv page, MathWorld. The certificate should be
  over a byte sequence, not "the map in that paper": corpus/sources/ now
  holds the PDFs with sha256 (gallagher2026.pdf 1782eefa…, e-sheet
  ebbf12b7…, pi-sheet 48b35cb0…, zeta3 6429e280…); wire the hashes + the
  transcribed formula strings into each family entry's extra.
- **R4 · say what the sweeps are.** sweep-d3/4/5 are NEW CURVES through the
  PUBLISHED tangent-sweep mechanism — new instances, not a new mechanism,
  and not coordinate-equivalence-checked against Gallagher's members. The
  table must say exactly that. Also: the fibers cell for Alpöge aims at the
  PUBLISHED collision image — add a cell with a target WE choose, so the
  "no witnesses consumed" claim is airtight.
- **R5 · label the llm-harness battery** as dry-run plumbing with a fake
  proposer — no model has run; the green tick must not be readable as an
  LLM result.
- **R6 · chowla's terminal state.** The one family still at "cap reached";
  a detach run with CERT_CAP high enough to exhaust the screen's survivors.
- **R7 · package the keller verification.** Standalone stdlib-fractions
  verifier (det identity + rational collisions need nothing but Fraction)
  over the hash-pinned sources, plus the certificate as a detached file —
  the outside-checkable artifact. Where and whether to post it is the
  operator's call, not the machine's.

## Next steps, in order

1. **Higher periods at the classical parameters.** DONE through p=15, all
   matching Galias, all recheck-clean. p=13: 418 points, 32 orbits (3 min).
   p=14: 648 points, 44 orbits, plus the p=7 census independently re-derived
   (125M boxes, 18 min). p=15: EXACTLY 1082 points — 2 fixed, 72 orbits of
   minimal period 15 — 393M boxes in 43 min. p=16 is running in the
   background (census-high-periods.json; expect ~1.2G boxes, a few hours).
   Beyond p=16: the detach runner or a smarter box metric.
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
5. **Ramanujan Machine audit: v1 BUILT (ramanujan-audit).** instruments/cf/
   evaluates positive polynomial CFs backward with a PROVED tail seed
   (t in (0, a/b]) and outward rounding — an unconditional enclosure, no
   convergence theorem consumed; widths bottom out at ~8e-16. The e and pi
   sheets audit clean (5/5 survive; Brouncker calibrates; every
   normalization float-guarded against transcription error). REMAINING, and
   it is the flagship: the zeta(3) minus-CF table, including TWO rows the
   Machine marks "new and unproven" — needs a verified tail-lemma evaluator
   (per-family tail interval T(n) = [alpha n^3, beta n^3], inclusion proved
   by shift-and-check-coefficients polynomial positivity, which
   instruments/keller/ arithmetic already supports). Also v2: high-precision
   exact-rational constant enclosures (Machin pi, sum 1/k!) to push slack
   below double precision. Original note: Certify or refute
   them exactly — continued-fraction values against interval enclosures, the
   contrast this project was built around, demonstrated on the other side's
   own corpus. Unlike OEIS this is NOT a curated-corpus trap: their claims are
   conjectures by construction, so refutations are discoveries. High headline
   value per unit work; "this decides, that guesses" writes itself.
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
7. **Portable certificates.** Nothing in the ledger is checkable by a stranger
   yet. A standalone stdlib verifier for one certificate class (the census
   boxes are the best candidate: finitely many intervals plus one contraction
   inequality each), or a Lean export — and the 54.6M proved negatives as a
   labeled dataset. The detach battery is the seed.
8. **More Krawczyk families.** Any parameterised nonlinear system: steady
   states of reaction-diffusion, roots of polynomial systems.
9. **Do NOT go back to closed-form hunting over curated corpora.** OEIS was the
   right calibration target and the wrong discovery target, and the reason is
   structural and predictable in advance. (The keller and Ramanujan-Machine
   corpora are not this: their claims are new or conjectural, and decidable by
   our instruments.)

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
