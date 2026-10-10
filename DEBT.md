# DEBT

What this repository owes itself. One row per item: what it is, why it is not
done, and what closing it costs. Written 2026-09-04 at the close of the
one-seed design pass, because four phases of that pass produced a list that was
living in a chat window.

**The rule for this file.** An item goes here when it is a real defect or a real
gap AND it is not being fixed in the same session. "We might improve this" is
not debt; it is a wish, and wishes belong in the HANDOFF menu. Debt is
something that is *wrong now*. A row leaves this file only by being fixed or by
being shown not to be a defect — never by going quiet.

## PAID — 2026-09-08 (tenth session: the Chrome gates, an hour)

| what | how it was closed |
|---|---|
| the layout ruler and the render gate FLAKED or HUNG inside chained runs (2026-09-06, 07: five times; a headless Chrome with a second of CPU that never returned; two chained runs lost) | `design/cdp.js`: ONE CHROME AT A TIME — a pid lock in the temp dir serialises every caller (a live holder is waited for, up to three minutes, and named; a dead one is cleared); a WATCHDOG on every CDP call — a reply that does not come within 30 s rejects with the method named; the Chrome version printed once per launch (`[cdp] Chrome/152.0.7977.77 on port 9233`), because the 2026-09-07 hangs began with an auto-update nobody saw. Both gates wrap each page and refuse with the PAGE named (`page reports/x.html — CDP Page.navigate did not return within 30000 ms (a hung Chrome: kill it and rerun this gate alone)`). Exercised: a 1 ms budget on a real call rejects naming the method; two concurrent drivers serialise |
| the ruler's ratchet accepted a FLAKY LOW measurement as an improvement, then refused the honest one as a regression (zeta3-audit, 2026-09-07) | `check-measure.js --accept` now carries a sha256 per page in the baseline and REFUSES to lower a row whose page bytes did not change — a lower read on unchanged bytes is a page measured before it rendered — unless `--accept-better` says the author looked; pure `acceptMerge`, three red controls (unchanged bytes + lower → kept; changed bytes → recorded; `--accept-better` → recorded). The baseline gained 83 digests with no number moved |

---

## PAID — 2026-09-05 (third pass: the foundation declared once)

| what | how it was closed |
|---|---|
| `body` and the box-sizing reset declared in **seven** files under `playground/` and in the shell | deleted one file at a time, each page rebuilt and pixel-diffed at 1440 and 390 against a capture from before the first deletion: ten pages identical, interferometer inside its measured capture jitter. The shell's two rules are the only copy now; interferometer keeps the margin/padding zeroing and three body properties the shell does not set |
| the GitHub mark in the nav rendered at **17px, 32px or 292px** depending on the page | it carried width/height attributes only, and five pages have a page-wide `svg{width:100%;height:auto}` for their figures. `design/nav.js` pins the size; found by driving the phone drawer, which no closed-state screenshot could see |
| `contact.mjs` / `refutation.mjs` ported without the record they read | the record is `instruments/wiring/eval/`, sha256-pinned; `test.mjs` draws the sheet and builds the four refutations from it every run |
| the control build's "wiring (graph as submission)" row was **green while executing nothing** | it ran the pytest file as a script, which defines eight tests and runs none. Through pytest now, 8/8; the hash-pinned file is untouched |
| a RED battery on the control build gave **no reason** | the runner discarded stdout and stderr. A failing battery prints its last eight lines now |
| the control build ran **`python3 instruments/wiring/concord.mjs`** | the concord battery was registered in the Python list. RED on every control build it had been in, unreadable until the row above. Moved to the node list, and the runner now refuses a battery whose file extension does not match its interpreter |
| **the working tree can read as empty** while `ls`, `stat` and git all say it is there | ~/Documents is iCloud Drive and Optimize Mac Storage evicts files; 365 tracked files were evicted mid-session and a gate over them passed; an hour later a **gitignored** skyaudit day corpus was evicted and its battery went red on a count. check-wiring check 0 refuses a tree where any tracked file reads short or any ignored corpus under apps/, certs/, corpus/ or site/apps/ carries the evicted flag, and names `make materialize`, which now reads the ignored corpora too; the new batteries refuse the empty hash on a non-empty pin. **The real fix is the operator's: take the repository out of iCloud Drive** |
| the pinned lattice-claims record was graded by **a grader this repository did not hold** | the package snapshot was one session behind the re-graded record. Ported whole from frontier-apps into `instruments/wiring/` (24 files, one PROVENANCE); `battery.py` re-grades the 135 stored replies with the grader on disk every build and refuses if a row moves. 0 moved |
| the rewire readout named one grader and counted **another** | the report socket accepts a second reporter and `sourceInto` took the first wire; it takes the last, so the number follows the caption. Found by dragging, not by looking |
| check-wiring's registry check printed "the same batteries" over **a subset** | it matched only files named battery/selftest/test-engine. Seven `make test` rows had never run on the control page: the four cert-unit files, the interval enclosure test, the skyaudit and tensorlb Python verifiers. The check now compares every script in the test target against every argv in build-control (for-loops expanded, the pytest `cd` form resolved); all seven are registered; `replay.mjs` exits non-zero on a disagreement, declared as a patch in `corpus/frontier-port.json` |

## PAID — 2026-09-05 (second pass: what a page SHOWS)

| what | how it was closed |
|---|---|
| **1,337 stray commas** on five live pages | an array interpolated into a template literal stringifies with COMMAS between its elements. `${ch}` where `ch` is an array of `<line>` put 892 of them inside one figure and 66 on the gathering page. Three missing `.join('')` calls |
| **12 kinds of invisible SVG element** | the gathering page embeds each instrument's card art but not the stylesheet that colours it, and SVG's default stroke is `none` — so 63 chords on the affect card and 60 on answer-shape painted nothing. Those two plates measured **1.47% and 1.22% ink** and read as black boxes. The figure primitives are shared components now; affect measures **6.97%** |
| two cells reading `null` in a published table | `String(null)` is the four-character word. An absent count is an em dash |
| literal backticks in a `/machine` table cell | a markdown habit inside a JS description string |
| the nav was dead in a `file://` preview | every link was absolute. The site is reviewed from disk before it is pushed, so a nav that only works after deploy is a nav nobody can check |

## PAID — 2026-09-05 (first pass)

| what | how it was closed |
|---|---|
| the site had TWO navigations, and /instruments carried the smaller one | `design/nav.js` — links, markup and CSS in one module, emitted by both shells. A reader landing on an instrument page could not reach the reports, the machine or the about page without going home first, and that section holds the most hireable material on the site |
| the nav order was Reports · Machine · Instruments · About | Reports · **Instruments** · Machine · About — the audits, then the things you can turn, then the engine, then the person. It also marks the current section with `aria-current` now, which it never did |
| two of the nine cards on /instruments painted `#0a0a0c` inside a `#101014` plate | measured, not guessed: `affect` and `answer-shape` painted the PAGE ground over the plate ground, so two cards were visibly darker than the other seven. No art paints its own ground now |
| card arts filled between 52% and 131% of their plate | the plate takes the art's OWN aspect ratio, read off its viewBox at build time. SEVEN of the nine arts are square and every plate was 4/3, so each was letterboxed into 75% of the width — a drawing floating in a dark box. Now 69–102% wide, 67–99% tall, and `affect`'s 131% overflow (it was being clipped) is gone |
| every card carried seven text blocks and 1,200–1,750 characters | title, description and the art. The eyebrow, the "what decides it" strip, the figcaption and the four fact cells are gone: 3 blocks, 408–642 characters |

## PAID — 2026-09-04

| what | how it was closed |
|---|---|
| `CITATION.cff` named v2026.09.1 and carried v2026.09's DOI | pointed at `10.5281/zenodo.22285003`; the deposits are recorded in `corpus/zenodo.json` and check-wiring gates the citation against it |
| `.zenodo.json` declared a sibling archive version as `isSupplementTo` | `isNewVersionOf` — the lambda(4) deposit is archive version 1 of this concept, not a separate work |
| two outreach notes described the superseded deposit as current | both updated; `10.5281/zenodo.22257596` is marked superseded wherever it still appears |
| the skyaudit app shipped a LIGHT palette on a DARK ground | one theme, matching `design/tokens.js`. Measured before the fix: `--v-cert` rendered `#2C6142` at **2.73:1** against `#0a0a0c` on any light-OS machine, under the 3:1 floor the design battery enforces everywhere else, and the `*-soft` washes came out near-white where the dark theme expects near-black. Nothing in the repository has ever set `data-theme`, so the light half was serving a switch that does not exist |
| Plate IV's `p(r) = 0` label sat on the zero line, among the crossings and the dots | moved to the empty quadrant below-left. Verified numerically rather than by eye: zero curve points and zero dots inside the label's box |
| `certs/erdos1038-inf.json` re-hashed on every build | `tools/stable-json.js` — the record is rewritten only when its content changes, so `builtAt` now means *when this content was first produced*. Verified by a full re-run of all four #1038 theorems: the sha held |

---

## THE STANDING DEBT OF THIS WHOLE PASS — DISCHARGED 2026-09-05 (second session)

It read: *nothing in the 2026-09-05 sessions was confirmed by looking at a page.*
Eleven pages have now been opened at 1440 and 390, captured in scrolled slices so
nothing sat below a capture fold. The result is **`VISUAL-REVIEW-2026-09-05.md`,
16 rows**, each naming the page, the defect and the shot that shows it. Awaiting
the operator's ruling; nothing on that list has been fixed.

Two rows of the PAID list below are now known to have been verified against a
lying measurement, and looking settled both: `reports/glide-band.html`'s figures
**render fully** (check-render reporting them blank/unmeasured is the gate's
limit, not the page's defect), and `exact-geometry`'s 0.41% ink — thinnest on the
site — is a genuinely sparse four-point drawing, not a blank.

### The new standing debt, and it is smaller and named

`VISUAL-REVIEW-2026-09-05.md` §A–§G. The two that are grammar rather than layout
are already understood: the black REFUSED swatch on `/instruments` is `.w-void`
resolving to no paint (§F-1 also records that `check-render` **passes** it,
because black *is* a paint on a near-black ground — the test needs to be
contrast-against-ground), and `interferometer`'s clipped u−v inset is the
`#stage{width:100%}` gotcha now written down in `design/CONTRACT.md`.

## PAID — 2026-10-09 (Phase 0 of the method-paper plan, notes/method-paper-plan-2026-10-09.md: headline truth)

Found by an ADVERSARIAL READ OF THE CODE on 2026-10-09 — the first defects this project found that way, which
retires the sentence "none by reading code" (the methods note now counts both kinds). Pinned before/after in
`certs/erratum-2026-10-09.json` and shown on the control page's §7.

| what | how it was closed |
|---|---|
| **the closed-form hunt counted a FLOAT comparison as a refutation** (`machine/engine.js` relations(): Math.sqrt(p/q), a midpoint times a rational, Math.pow; `families/oeis-closedform.js` forms(): sqrt, cbrt, (a+b√d)/c, constant multiples and powers, products and quotients, log, exp). Exact for p/q, not for the rest; the control page counted 54,628,275 as "refuted in double" while README/CLAUDE.md/HANDOFF said "a REFUTED here is proved" | every candidate is an exact rational or a verified enclosure (`instruments/interval/algebraic.js`: verified root brackets, decimal-given γ; `transcendental.js`: π, e, ln 2, ln 10, log, exp, rational powers as exp((p/q) log K)); a form is refuted only on DISJOINTNESS; c^(p/q) with q > 1 in the per-conjecture hunt is REFUSED, not tested; the constant's mantissa box is the exact digit interval converted outward; the vocabulary is unchanged (3,763 forms). Red controls in `tools/test-engine.js`: an enclosure touching sqrt(2)'s bracket by one double keeps sqrt(2); (1/2)·π survives a one-double enclosure of π/2. THE REWRITE'S OWN FIRST RUN announced A271880 (1/5 to sixty-three digits) as a discovery: `sqrt2^(2/1)` is 2 in disguise and, typed as an ENCLOSURE, skipped the exact pass the old continued-fraction detector had routed it to — caught by reading the ledger (one OEIS hit where there had been none for months is an impossible number), fixed by emitting the twelve rational root powers as exact rationals, and held by a red control on A271880 |
| **REJECT mixed "proved below the bar" with the STRADDLE, and the engine sent any unknown verdict word to the rejects** (`machine/engine.js:58-60`; `families/cosine.js:48`, `families/newman.js:41`); strassen's certified-correct-not-fast and oeis's not-a-discovery were also REJECT | `instruments/verdict.js`: the three words, `decide(enclosure, bar, relation)` as the ONE predicate, `compose()`; the engine's contract is CERTIFIED / REFUTED / REFUSED, an unknown word is REFUSED and counted as `unknown`; every family routed through it; REFUSED rows keep their `extra` so the OEIS decomposition still closes; henon-orbits' "no contraction" and keller-fibers' "one preimage" are REFUSED (they were REJECT); every consumer in tools/ renamed; red controls: a straddle is REFUSED, the old word and `undefined` are counted as unknown |
| **the Newman HIT compared the candidate's lower end with the champion's LOWER end** (`families/newman.js:41`; `envelope.barSq` kept only modSq[0]); the statement said "every value achievable with fewer terms" over a finite envelope with box maxima | `envelope.barSqInterval(n)` = [max lo, max hi] of the champions' enclosures; `decide(modSq, bar, 'gt')`: CERTIFIED iff candidate.lo > bar.hi; the statement says "the recorded envelope"; the four hits on record have gaps 0.02–0.36 against widths ~5e-16 and did not move; red control: a candidate equal to the champion's enclosure is REFUSED |
| **`pow` used 32-bit exponent arithmetic**: pow([1,2], 2^31) = [1,1], silently | refused at |n| ≥ 2^31 (`interval.js`); red control X7 |
| **no NaN or infinity semantics**: mul([0,∞],[0,1]) = [NaN,NaN]; div by [NaN,NaN] not refused; the batteries skipped non-finite results | `wf()` in every arithmetic primitive (a pair of non-NaN numbers, lo ≤ hi) and an output check for 0·∞ and ∞−∞; refusal by throw; infinite endpoints stay sound bounds; red control X8; `test-eqcert.js` S4 was found VACUOUS by it (`f.map(I.iv)` built [0.5, 0] boxes — the arity trap X4 names) and fixed; cost measured at 10 M operations in 178 ms |
| **the radii-polynomial linear branch returned ok without the interval check, and accepted a NEGATIVE or NaN Z2** | Y0 and Z2 must be finite and nonnegative; the Z2 = 0 branch proves p(r) < 0 as an interval inequality before ok; reds R3b–R3e (`test-eqcert.js`) |
| **the Certificate class accepted `['']` as a falsifier and `{k: undefined}` as evidence, and toJSON then emitted the object the constructor refuses** | `req()` rejects empty entries; `checkEvidence()` requires finite numbers, intervals, strings or booleans; the six user batteries green. The EXECUTABLE falsifier (a certificate-transform the checker must reject) is B1 of the plan, still open |
| **`make test` never failed and the control build wrote the page with a red battery** | every test line marks `.test-failed` on FAIL and the target exits 1 at the end (the cloud workflows and the watchdog do not call it); `tools/build-control.js` refuses on a red battery, naming it, unless `CONTROL_ALLOW_RED=1` is set and printed |
| **the engine's CONSTANTS padded composite float expressions by ±1 ulp without proof** (`(1+Math.sqrt(5))/2`, `Math.exp(1)/Math.PI` — the latter misnamed gamma_e) | π, e, ln 2 from the series module; √2, √3, √5 as verified brackets; φ by interval arithmetic; the e/π entry removed (a quotient of constants, not a form) |
| **no toolchain pin** | `.node-version` (24.14.1), `.python-version` (3.9.6); `ledger.json` records node, V8, platform and arch, and `generatedAt` |

## OPEN

### WHAT A READ OF THE CERTIFIERS' CODE FOUND, FOR THE METHOD PAPER (found 2026-10-09; the rows above are paid)

The method paper (`paper/tex/cert-machine-method.tex`, §8) states these as limits. Each
item is a place where a comment, a name or a count says more than the code does. None
was found to move a verdict reported in a companion paper, but that was not proved.

| what | where | what closing it costs |
|---|---|---|
| **no shared verdict module beyond the engine.** `instruments/verdict.js` now holds the words and `decide()`, and every FAMILY imports it (2026-10-09); the instruments and apps still declare PROVED/REFUSED/NOT_CHECKED, PROVADO/REFUTADO/RECUSADO, DECIDED/REFUSED and CERTIFIED/REFUSED/REFUTED/STANDS separately, and flip thresholds are written three times (`apps/contraprova/gate/flowline.js:247-263`, `apps/decidivel/engine/rockphys.js:425-431`, `apps/abatimento/abatimento.js:179-189`). The closed list is enforced only at publication (`tools/run-claims-ledger.js:366`). `apps/abatimento` is FROZEN until the CPSI closes 2026-10-19 17:00 | instruments, apps | import the module everywhere (plan A1), a grep gate, a `class` field on every register row (`mechanism` is null on 131 of 132); a day after 10-19 |
| **the falsifier is prose.** The Certificate class now rejects empty strings and undefined values (paid above); the falsifier is still a sentence, never executed | `certificate.js` | the certificate format with rule-generated result-bearing mutants the checker must reject (plan B1) |
| **`encloseCos`/`encloseSin` pad the platform's `Math.cos`/`Math.sin`**, which ECMAScript does not guarantee to be faithful (the comment says so). SIX live callers, not four: `labs/mfg/box.js`, `labs/mfg2p/box2p.js`, `instruments/critcount`, `instruments/transit`, `apps/glide-band/kernel.js`, `reports/mfg-certify.js` — and labs/mfg IS the radii-polynomial certifier the method paper names in §4.1, with `Math.pow` in its Z2 (`labs/mfg/box.js:387-392`). The pad's contract (an argument carrying ≤ 2 ulp relative error) is unwritten; two callers pass thin 2π·k·t | `instruments/interval/interval.js` | retire the pad in labs/mfg for the series sin/cos and interval pow, re-run its records (plan A2); the other five callers: retire, or a written contract and out of the paper's scope by name |
| **`taylor2.integrate` is rigorous only on dyadic cells of [0,1]**: on a general [a,b] the float midpoint leaves an O(ulp) gap per cell (`quadrature.js:16-21` avoids exactly this) | `instruments/interval/taylor2.js:67-84`; called on [−r, r] by `instruments/agtable/exact.js:88` | enclose the cell midpoints and widths as intervals; re-run agtable |
| **`test-interval.js` checks nextUp ≥ x, not that it is the immediate neighbour; two trig tests are tautologies** (`encloseCos(x)` contains `Math.cos(x)`; X5 compares two pads). The primitive IS correct on 2·10^5 random doubles and every edge case probed | `instruments/interval/tests/test-interval.js` | the bit-pattern neighbour check at ±0, the subnormal boundary, MAX_VALUE, ±∞; the tautologies removed (plan A4) |
| **the same-author "second implementations" are N-version checks**, same specification, same inputs; Decidível's is a point value checked for containment. The paper says "share no code" (true) and the table is headed as independent (not). The λ(4) outside rerun is recorded with `hash: null` and no pinned commit | `apps/*/reference.py`; `corpus/external-reruns.json`; `paper/tex/cert-machine-method.tex` Table 2 | the words "same-author second implementation" and a separate count for outside reruns; pin the λ(4) commit sha (plan P0.5, C2) |
| **the hseva battery counts positive assertions as red controls** (`red()` at `battery.js:59, 196, 243, 323` asserts that something holds, not that a forgery is refused), so "R/R red controls fired" overstates the falsifiers. P1 no longer prints the count | `instruments/hseva/battery.js` | move those four to `ok()`; HsevaReds falls by four |
| **Contraprova: a PROVADO consistency check (checks 2, 6, 7) means the claim meets an outer enclosure**, weaker than the header's gloss; the interval Reynolds number loses a factor D₋/D₊, so "with Q ≥ q_min the gate decides" (`:202`) holds in the demonstrator, not in general; the P_d thresholds are float with outward 0.1-bar rounding, not directed rounding | `apps/contraprova/gate/flowline.js:51-57, 202, 247-251` | say "consistent" for those checks; compute Re with D cancelled; directed rounding for the thresholds |
| **ecbench's error bound drops O(u²) terms and assumes `Number(literal)` is correctly rounded** (ECMA-262 guarantees it to 20 significant digits); the margin absorbs both, and the 1e-9 prefilter pad is not scaled for coordinates above 128 | `instruments/ecbench/geometry.js:47-57, 107-119` | state the bound with the u² term; scale the pad, or refuse |M| > 128 |
| **trigmin's re-check shares `cheb.js` with the path it checks**, and `newman.js:27` cites a 47-check battery against 34 `ok` sites | `instruments/trigmin/newman.js:260-298` | an independent Chebyshev expansion for the re-check; count the battery from its output |
| **the transcendental tails are computed in round-to-nearest** with one `nextUp` (25! is not exact in double); sound only because the tails (~1e-25) lie far below the one-ulp widening of `add` | `instruments/interval/transcendental.js:131-133, 168-171, 208-211` | compute the tails outward too; an hour |
| **`special.js` uses hard-coded doubles `LGAMMA_MIN` and `XSTAR` as enclosure ends** | `instruments/hseva/special.js:39-40, 166` | derive them as enclosures or justify each with a bound |
| **sos and trigmin have no independent second implementation; ecbench and hseva are re-run in the browser by the same bytes**, which checks the record, not the code | — | a clean-room second implementation of each, as abatimento and contraprova have |
| **`make test` never fails and the control build does not refuse on a red battery.** Every test line is `… && echo PASS \|\| echo FAIL`, so make exits 0; `tools/build-control.js` tags a red row and writes the page (`:254, :561`). The refusals that hold are per battery, per report page, per app record and per paper-numbers generator | `Makefile:84-208`; `tools/build-control.js:240-254` | make the target and the control build exit non-zero on any FAIL; check first that the cloud workflows and the watchdog do not rely on the zero exit |
| **`\GatesN` = 6 in the register paper, but the methods note runs 7 gates**: `tools/paper-numbers/register.js:449` counts with `^\s+\['`, which misses `[FUNNEL_GATE, …]` | `tools/paper-numbers/register.js:449`; `paper/tex/register.tex:116` | count the gates from the builder's own list |
| **`make drift` skips the local-side check when the source is gone**, and on this desk the source lab is not at the recorded path (137 "source gone"); the local side re-hashes 137/137 by hand | `tools/lift.js:73-89` (`:77`) | check `local_sha256` whatever the source's state |
| **`node tools/build-site.js` run alone prunes `site/swell/`** (and the other app outputs it does not write): the sync keeps only what it wrote, and Swell's files come from `apps/swell/build.js`, a later step of `make site`. Found 2026-10-09 when a site build for the papers deleted nine tracked Swell files; restored from git before the commit | `tools/build-site.js` (the sync's prune) | teach the prune the app directories `make site` fills, or refuse to prune a tracked file under one |
| **RERUN.md and /reports/rerun.html were built at `cb6d042`**, ~100 commits behind HEAD; 8 commands still "not yet timed" | `tools/build-report-rerun.js` | a timed run of the full kit, then rebuild |

### THE RENDER GATE COLLAPSES A PAGE'S FIGURES INTO ONE ROW (found 2026-09-15)

`tools/check-render.js` keys a figure by its first class name, so all four `.figbox`
elements on `reports/glide-band.html` share the key `glide-band.html :: figbox` and the
row keeps the WORST ink of whichever ones it managed to capture. Three of those four are
usually unmeasurable (the `captureBeyondViewport` blank-clip limit the file documents),
so the row has been the one measurable figure's 10.29%. On 2026-09-15 a two-pixel height
change let all four be captured and the row fell to **3.59%** — reported as "a figure got
thinner" when nothing about any figure had changed. The page was checked by eye and by
pixel diff: the figures are identical.
**What it costs to close:** key each figure by its index within the page as well as its
class, so a row means one figure. Half a day, and it re-records the baseline.

### THE LAYOUT RULER COUNTS A BORDERED BOX AS TWO SPINES (found 2026-09-09, twelfth session)

`tools/check-measure.js`'s probe records a spine as `Math.round(r.left + paddingLeft)`. For a box
with a border it therefore records the box's own edge at `left + padding` and its children's at
`left + border + padding` — two spines one pixel apart for one alignment. The baseline has carried
the pattern for as long as the panel has had a left border (`1134` and `1135` on
`/instruments/navier-stokes/`), and adding one bordered plate to that page this session moved it
from 7 spines to 9 when only one new alignment was introduced. The row was recorded at 9 with
`--accept-worse`, which is the honest number for the probe as written and the wrong number for the
page.

What it costs to close: one term — `+ parseFloat(cs.borderLeftWidth || 0)` — in the PROBE string,
which is deliberately a single shared definition so the red controls exercise the same rule. It is
not done here because it re-measures **every** page: any bordered box on the site collapses two
edges into one, so the whole baseline reads better at once and would have to go in under
`--accept-better` with "the probe changed, not the pages" in the commit. That is a gate change, and
a gate change inside a session about an instrument is how a baseline stops meaning anything. An
hour, on its own, with the before/after diff read page by page.

### THE LAYOUT RULER MEASURES APP PAGES BEFORE THEY RENDER (found 2026-09-09)

`site/apps/skyaudit/index.html` and its `sp/` twin read **4/4/5 spines** in the baseline
recorded 2026-09-05 and **6/6/7** when measured now, on bytes that have not changed
(sha256 identical to the baseline's). Three consecutive runs of the probe alone, driven
through the same CDP client with the same fonts-ready wait, gave 6/6/7 every time; the
full 84-page gate gave 6/6/7 on two runs and 4/4/5 on a third. The low read is the page
measured before its app lays out — the same failure as the zeta3-audit incident of
2026-09-07, in the other direction: the ratchet's guard catches a flaky LOW offered as an
improvement (and did, naming the page), but nothing catches a flaky low being *recorded in
the first place*, which is what happened on 2026-09-05 and left two rows FALSE GREEN for
four days. The rows are now recorded at 6/6/7 with `--accept-worse` and the reason here.

What it costs to close: the ruler's per-page wait is `document.fonts.ready` plus 180 ms,
which is a document measurement, not an application one. An app page needs a settled-DOM
condition — no mutation for N ms, or an explicit readiness signal the app emits — before
the probe runs. Half a day, and it also removes the run-to-run flap. Until then the two
skyaudit rows are the only known unstable pair, and they are recorded at their rendered
value, which is the conservative one.

**A related fact, now measured rather than guessed:** the baseline records the Chrome that
produced it (`browser` in `design/measure-baseline.json`), and the gate prints a line when
the running Chrome differs. A layout ruler is a browser measurement; Chrome auto-updated
from 152.0.7977.77 to .83 between the tenth session and this one, and without that field a
whole-baseline shift is indistinguishable from a page regression.

**A second unstable page, 2026-10-09:** `site/swell/index.html` @768 read 9 spines on three
consecutive gate runs and 7 on the two `--accept` runs that followed, on bytes that did not
change between them (and again after `apps/swell/build.js` re-rendered it). The baseline holds
7; a control build that reads 9 goes red on that row alone. Same cause as the skyaudit pair
(an app page measured before it settles); same closure (a settled-DOM wait). Until then: re-run
`node tools/check-measure.js` alone and, if the flap persists, record the higher number with
`--accept-worse` and this reason.


### 0 · THE GATE THAT DID NOT EXIST — now it does
`tools/check-render.js`. The repository gated the registries, the type system,
the palette, the layout geometry and the grammar, and had **nothing that looked
at what a reader sees** — so a figure could render as an empty rectangle with
every gate green. Three checks: builder leaks (markers, outside script/style,
in value positions only so prose is respected), every classed mark inside a
figure resolving to a paint, and INK — each figure screenshotted and its
non-ground pixels counted, ratcheted against `design/render-baseline.json`.
Four red controls. **Its first run found every defect listed above.**

Two honest limits, both in the file: ink RATCHETS rather than setting a bar,
because only the author can say whether a sparse drawing is empty or exact; and
three figures on `reports/glide-band.html` sit far enough below the fold that
`captureBeyondViewport` returns a blank clip, so they are reported as
**unmeasured** rather than counted as blank. Fixing that capture is the next
thing this gate needs.


### 1 · The Zenodo titles — the concept DOI is right since 2026-09-05; two superseded records are not
v2026.09.2 (`10.5281/zenodo.22382866`) was minted through the GitHub
integration with the one title, the declared description and `isNewVersionOf`;
the concept DOI resolves to it and CITATION.cff cites it. The two superseded
snapshots, `…22285003` and `…22257596`, still carry the retired title, because
the integration mints and never edits. `ZENODO_TOKEN=… node
tools/zenodo-metadata.js --apply` edits both, verifies from the public
records and closes the entry; the clicks are in `corpus/zenodo.json`.
check-wiring's NOTE counts 2 until then. **Owed since 2026-09-03; narrowed.**

### 2 · The exact envelope on curveset
`/instruments/curveset` is honest now — the envelope is drawn COMPUTED because
it is evaluated in floats — but honest about being weaker than it needs to be.
The standards are half-integers and both envelopes are a min/max of *linear*
functions, so `U` and `L` are piecewise linear with breakpoints at the standards
and the backwards read is one exact solve on one piece instead of a bisection.
Do it in `playground/rational.js` and flip `ARITHMETIC` to `'exact'` in
`envelope.js`; every mark and the legend re-promote on their own, because
nothing on that page names a standing by hand.
**Cost:** a session. **It is the only place on /instruments where DECIDED is
available and not taken.**

### 3 · The HTML standing contract is exercised on one side only
`warrant.js`'s HTML voices ship site-wide, but only /instruments draws them.
Report numbers come from certificates and are DECIDED, which renders unmarked —
correct, and therefore invisible. So the contract has never been seen carrying
a distinction on a report page.
**Not a defect yet**, but it means the voices are untested where most of the
site's numbers live. The honest test is a report that genuinely mixes standings.
`reports/rm-audit.html` is the candidate: it sets truncated-decimal collisions
against exact decisions, which is exactly the COMPUTED/DECIDED pair.

### 4c · THE VENDORED FONT SUBSETS ARE GONE, AND NOTHING REPLACES THEM YET (2026-09-15)
`/instruments` used to ship its own `inter-var.woff2` and `jetbrains-mono-var.woff2`
beside the pages. Measured with Chrome's `CSS.getPlatformFontsForNode` over the 39
non-ASCII glyphs the site actually uses (η χ λ ∈ ≤ ≥ √ ₁ …): the vendored Inter drew
**11**, Times drew **19** and Apple Symbols **9** — so Greek and the math signs
rendered in Times on every instrument page, while Google's Inter drew **26** of the
same set on a report page. The subsets went with the one shell and every page now
makes the same Google Fonts request.
**What is owed:** vendoring full-coverage subsets (Latin + Greek + the math and
super/subscript blocks), sha-pinned, so the pages are legible with no network — which
is how they are reviewed from disk. **Cost:** an afternoon with a subsetter and a
pinned record. **Risk of leaving it:** a reader with no network sees fallback metrics;
nothing is lost but the type.

### 4 · `app-shell.js` is still a second page shell
Collapsing its palette fixed the colour defect and `design/nav.js` fixed the
navigation, but not the duplication: the app pages are still built by a
different shell, with their own layout rules. Phases 2 and 3 unified the reports
and /instruments and left `apps/` alone.
**Cost:** moderate. **Risk of leaving it:** the next layout decision has two
places to land and only one of them is gated.
**PARTLY PAID 2026-09-15:** the app pages take `template.js`'s one head now, and
`design/tokens.js` emits their scale. What is still their own is the BODY — the
`.as-top` bar, the docked panels, `appCss()` — which is a product layout, not a
document one, and the dock is their footer. The remaining duplication is that body.

### 4b · The card arts do not fill their own viewBoxes
The plate now matches each art's aspect ratio, which closed most of the gap.
What is left is per-art: measured at 1440px the arts fill **69–102%** of the
plate's width and **67–99%** of its height, because each drawing carries its own
margin inside its viewBox. Tightening nine viewBoxes to their content is nine
bespoke figure edits and each one needs eyes on the result.
**Cost:** an afternoon with a browser open. **Not urgent:** the spread is now
narrow enough that no card reads as empty.

### 5 · The remaining geometry debt
679 spines and 5 clipped blocks at 1440px, from `design/measure-baseline.json`.
Most of the 679 are legitimate grid columns and card interiors. The metric
cannot currently tell "a component's columns" from "an accidental new spine",
which is why it has twice flagged its own counting floor rather than a
regression. **Chasing the number further is not worth much without a sharper
metric**, and sharpening it is itself the work.

### 6 · Other records still churn their own bytes
`certs/ember-band.json` and `certs/kissing-ledger.json` rewrite a `generated`
timestamp every build; `certs/ai-claims-summary.json` rewrites a wall-clock
runtime. Nothing pins them, so this is diff noise rather than a broken pin —
`tools/stable-json.js` is the fix and it is one call each.
**Deliberately not done in the same session as item 6's sibling:** the first
attempt at converting four *other* writers by regex corrupted two certificate
files (they were restored from git within the minute, and the surgical
single-file fix was done instead). Code that writes certificates gets edited by
hand, one file at a time, with the sha checked before and after.

### 7 · The dead `.item` class collision
`.item` is a child class of both `.hero-meta` and `.w-legend`. It is what made
the phase 3 audit miscount a legend's size, and the miscount reached a commit
message before it was caught. Harmless today; a trap for the next audit.
Recorded in `playground/design/COMPONENTS.md`.

---

## NOT DEBT — decided, and here so it is not re-litigated

- **`instruments/` at the root is the certifiers and `/instruments` is the
  served section.** The folder and the URL differ on purpose. Documented in
  three places. Do not "fix" it.
- **The reading measure on /instruments (82ch) is wider than a classic prose
  measure.** Those pages are figure-first; the prose sits beside full-track
  components, and a narrower column reads as a leftover.
- **The legend column count is derived from `data-n`, not from available
  width.** `auto-fit` was tried in phase 2 and the layout ruler refused it.
