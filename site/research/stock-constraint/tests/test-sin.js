/* test-sin.js — headless validation battery for sin-mfg.html
   (the SIN-MFG living note: price formation with a stock constraint).

   WHY THIS FILE EXISTS, AND WHY IT EXTRACTS RATHER THAN COPIES
   -----------------------------------------------------------
   The artifact's header comment advertised a certification by test-sinmfg.js.
   That battery does exist (recovered into artifacts-outdated/), but it was
   never transferred alongside the artifact, so the certification was
   unverifiable by anyone holding sin-mfg.html — the same species as
   FINDINGS.md Result 5, a harness validating a stale file for a whole session.

   More importantly, test-sinmfg.js carries its OWN EMBEDDED COPY of the kernel:
   it contains no fs call and never opens sin-mfg.html. So it runs green while
   validating a kernel that has since diverged from the artifact. That is a
   fake certificate with extra steps, and it is why this battery does the
   opposite: it EXTRACTS the kernel from sin-mfg.html at run time and therefore
   cannot drift from the artifact under test. SIN_HTML=<path> aims it at a
   mutant for mutation testing.

   (test-wardrop.js has the identical structural defect, currently undetonated
   because nobody has touched Tab 07 since the port. See FINDINGS_SIN.md.)

   Two layers, deliberately:
     LAYER A — MATH.    Assertions and parameter sweeps against the extracted
                        kernel primitives. Validates the mathematics and the
                        note's structural claims (Hotelling/T3, three regimes,
                        the "complete case analysis" comment in clearSlice).
     LAYER B — WIRING.  The FULL script under a Proxy DOM, driven through the
                        artifact's own window.__sin.solveSync() hook, reading
                        the real readouts. Layer B's displayed numbers are
                        cross-checked against Layer A's independent
                        recomputation — so neither the math nor the display
                        path can be wrong alone.

   House rules honoured: pre-update residuals only; semantics over magnitude;
   measured ranges, never remembered ones; branch COVERAGE is asserted, so a
   "complete case analysis" claim cannot pass by never being exercised.
*/
'use strict';
const fs = require('fs');
const path = require('path');

/* ================================================================
   0 · EXTRACTION (self-validating)
   ================================================================ */
/* A MISSING SUBJECT MUST BE A SENTENCE, NOT A STACK TRACE. Guard copied from
   test-index.js (which already solved this for itself). An unguarded
   readFileSync throws ENOENT: the runner sees a node internal frame and a
   nonzero exit, and cannot tell "the gate caught something" from "the gate is
   broken". Worse, the throw aborts the module, so every check after it — and
   the PASS/FAIL summary — silently stops running. MEASURED 2026-07-28: with
   SIN_HTML pointed at a missing path this battery printed ZERO PASS lines,
   ZERO FAIL lines and a node:fs frame. The guard prints on stdout, where this
   battery's other FAIL lines live, so a runner grepping one stream sees it. */
function mustExist(p, what, advice) {
  if (fs.existsSync(p)) return;
  console.log('FAIL  E0 ' + what + ' is not there: ' + p);
  console.log('      This is a MISSING FILE, not a failed assertion. ' + advice);
  console.log('\nSIN gate FAILED — subject missing, so NO check in this battery ran.');
  process.exit(1);
}

/* ONE LAYOUT, ONE ARTIFACT, 2026-08-21 — and the list this replaces is the argument for why.
   The note had FOUR addresses in two years: sin-mfg.html beside this battery in the monorepo,
   papers/stock-constraint.html in the export (M7b re-slugged the routed page to its SUBJECT, not
   its source directory), then technical-reports/stock-constraint.html after that rename, which
   this list was not told about — so the EXPORT branch resolved to nothing and the public tree's
   own battery died at "subject missing, so NO check in this battery ran" (measured 2026-07-30).
   Every entry was added after a break, never before one.
   The structure migration makes source path and published path the same string, so the artifact is
   research/stock-constraint/stock-constraint.html in BOTH trees and the candidate list has one
   entry. It is collapsed to a single path rather than kept as a one-element list: a fallback that
   can only ever choose its first entry reads as a choice and decides nothing. The gate still
   refuses loudly rather than inventing a subject — E0 below names the missing file. */
const _sinCandidates = [path.join(__dirname, '..', 'stock-constraint.html')];
const HTML = process.env.SIN_HTML ||
  _sinCandidates.find(p => fs.existsSync(p)) || _sinCandidates[0];
mustExist(HTML, 'the artifact this battery extracts the SIN-MFG kernel from',
  'Re-point SIN_HTML (or the default beside this file) at the artifact carrying the note; ' +
  'if the artifact was renamed or retired, re-point or retire this battery deliberately, ' +
  'do not let it crash.');
const html = fs.readFileSync(HTML, 'utf8');

const fails = [];
const notes = [];
function check(name, cond, detail) {
  console.log((cond ? 'PASS  ' : 'FAIL  ') + name + (detail ? '   [' + detail + ']' : ''));
  if (!cond) fails.push(name);
}
function note(s) { notes.push(s); console.log('    ' + s); }

const MARK = '/* ---------------- canvases (dpr-crisp; logical coordinates) ---------------- */';

/* --- extraction: count blocks LAZILY, then choose one BY ANCHOR ------------
   This used to be a bare count check followed by a GREEDY
   /<script>([\s\S]*)<\/script>/ — first `<script>` to LAST `</script>`. On a
   one-block file that is right by accident; on a two-block file the span
   swallows `</script> … <script>` into the middle of the source. MEASURED
   2026-07-28 against research/mfg-congest/mfg-congest.html (two bare blocks): this
   battery printed `harness: script extracted … (131721 chars)` — a length
   reported for a span that is not a script — and then failed four checks for
   the wrong reason. It also crashed outright on zero blocks, because
   `.match(...)[1]` on null is a TypeError.

   The count is now REPORTED, and the binding assertion is that exactly one
   bare block carries exactly one kernel/render boundary marker. That is
   STRICTLY STRONGER than the old count: a single block holding two markers
   passed the old check and produced a truncated kernel. It is also the
   assertion that survives the artifact becoming paper-shaped — a gate that
   goes red on a correct artifact gets tuned green, which is how a gate dies. */
const blocks = (html.match(/<script>([\s\S]*?)<\/script>/g) || [])
  .map(b => b.slice('<script>'.length, -'</script>'.length));
const carriers = blocks.map((b, i) => ({ i, b, n: b.split(MARK).length - 1 })).filter(o => o.n > 0);
const nCarried = carriers.reduce((s, o) => s + o.n, 0);
check('extraction: exactly one bare <script> block carries the kernel/render boundary marker',
  carriers.length === 1 && nCarried === 1,
  blocks.length + ' bare block(s) [' + blocks.map((b, i) => '[' + i + '] ' + b.length + ' chars').join(' · ') +
  '] · marker in ' + carriers.length + ' block(s), ' + nCarried + ' occurrence(s)');
if (carriers.length !== 1 || nCarried !== 1) {
  console.log('      This is an ABSENT or AMBIGUOUS subject, not a failed assertion. The kernel is');
  console.log('      selected by the marker, never by a greedy span between the first <script> and');
  console.log('      the last </script>. If the note moved to a page shape that pairs a behaviour');
  console.log('      block with a payload block, re-point this battery deliberately.');
  console.log('\nFATAL: no unambiguous kernel block — NO kernel check in this battery ran.');
  process.exit(2);
}
const FULL = carriers[0].b;
console.log('harness: script extracted from ' + HTML + ' (block ' + carriers[0].i + ', ' + FULL.length + ' chars)');

const nMark = FULL.split(MARK).length - 1;
check('extraction: kernel/render boundary marker is unique', nMark === 1, nMark + ' occurrences');
const KSRC = FULL.slice(0, FULL.indexOf(MARK));

/* The kernel region must stay pure. If future code motion drags a DOM call
   above the marker, this battery would silently start testing something that
   cannot run headless — fail loudly instead. The `$` definition is a lambda
   body, never invoked in this region, and is the single allowed exception. */
const domHits = (KSRC.match(/document\s*\.|window\s*\.|getComputedStyle|requestAnimationFrame/g) || []);
check('extraction: kernel region is DOM-free (only the $ lambda mentions document)',
  domHits.length === 1 && /const\s*\$\s*=\s*id\s*=>\s*document\.getElementById/.test(KSRC),
  domHits.length + ' DOM reference(s)');

const EXPORTS = ['NT', 'dt', 'NX', 'XBAR', 'hx', 'SIG', 'ETA', 'AMAX', 'KAPT', 'XSTAR',
  'GAM', 'QBAR', 'HBAR', 'CBAR', 'xs', 'P', 'Lt', 'St', 'At_', 'solveField', 'makeN',
  'bisect', 'clearSlice', 'dispatch', 'dpAudit', 'welfareOf', 'touCounterfactual', 'thomas'];
let K;
try {
  K = new Function(KSRC + '\nreturn {' + EXPORTS.join(',') + '};')();
} catch (e) {
  check('extraction: kernel region evaluates and exports every expected symbol', false, e.message);
  console.log('\nFATAL: cannot continue without the kernel.');
  process.exit(2);
}
check('extraction: kernel region evaluates and exports every expected symbol',
  EXPORTS.every(k => K[k] !== undefined), EXPORTS.length + ' symbols');

const { NT, dt, NX, hx, HBAR, AMAX, ETA, xs } = K;
const BASE = Object.assign({}, K.P);
const setP = o => Object.assign(K.P, BASE, o || {});

/* ================================================================
   1 · LAYER A — MATH
   ================================================================ */

/* Picard exactly as the artifact drives it: damped theta=0.5, tol 1e-10,
   cap 250 (see loop() and __sin.solveSync in the artifact). The residual is
   measured PRE-update — |p_new - p_old| before the blend is applied — which
   is the artifact's stated standard ("every residual below is computed
   before the update it judges"). */
function picard(maxIt) {
  const price = new Float64Array(NT).fill(0.8);
  let field = null, disp = null, res = 1, it = 0;
  const hist = [];
  for (let k = 0; k < (maxIt || 250); k++) {
    field = K.solveField(price);
    disp = K.dispatch(field.Ux);
    const pNew = disp.sl.map(s => s.p);
    res = 0;
    for (let t = 0; t < NT; t++) res = Math.max(res, Math.abs(pNew[t] - price[t]));
    it++; hist.push(res);
    if (res < 1e-10) break;
    for (let t = 0; t < NT; t++) price[t] = 0.5 * price[t] + 0.5 * pNew[t];
  }
  return { price, field, disp, res, it, hist, conv: res < 1e-10 };
}

console.log('\n--- Layer A · field certificates (base parameters) ---');
setP();
const R = picard();
check('A1 Picard converges at base parameters', R.conv, R.it + ' iterations, res ' + R.res.toExponential(2));

/* Mass: the semantic form. A terminal-slice-only check is indistinguishable
   from the correct one at rest (FINDINGS.md Result 6), so take the max over
   EVERY time slice and record where the worst slice actually falls. */
(() => {
  let worst = 0, worstT = -1;
  for (let t = 0; t <= NT; t++) {
    let s = 0;
    for (let i = 0; i < NX; i++) s += R.field.m[t][i] * hx;
    if (Math.abs(s - 1) > worst) { worst = Math.abs(s - 1); worstT = t; }
  }
  check('A2 mass drift is machine-small, max over ALL slices', worst < 1e-12,
    worst.toExponential(2) + ' at t=' + worstT + ' of ' + NT);
  note('worst slice is t=' + worstT + (worstT === NT ? ' (terminal)' : ' (NOT terminal — a terminal-only check would understate)'));
})();

(() => {
  let mn = Infinity;
  for (let t = 0; t <= NT; t++) for (let i = 0; i < NX; i++) mn = Math.min(mn, R.field.m[t][i]);
  check('A3 positivity strict over all (t,x)', mn > 0, 'min m = ' + mn.toExponential(2));
})();

/* ---------------- clearSlice: the "complete case analysis" claim ----------
   The comment above clearSlice asserts "every branch balances by
   construction". That is a checkable claim, so check it — and check that the
   sweep actually REACHES every branch, otherwise the claim passes vacuously
   (the mutation-testing lesson: a green suite proves nothing until it can go
   red, and a branch never exercised can never go red). */
console.log('\n--- Layer A · clearing: balance identity and branch coverage ---');
const BRANCH = { curtail: 0, scarcity: 0, wAboveCap: 0, hydroMarginal: 0, hydroOff: 0, hydroCapped: 0 };
function classify(sl, w, Ux, t) {
  const N = K.makeN(t, Ux);
  if (sl.k > 1e-12) return 'curtail';
  if (sl.d > 1e-12 && sl.h >= HBAR - 1e-9) return 'scarcity';
  if (w > K.P.PMAX) return 'wAboveCap';
  if (sl.h > 1e-9 && sl.h < HBAR - 1e-9) return 'hydroMarginal';
  if (sl.h <= 1e-9) return 'hydroOff';
  return 'hydroCapped';
}

const CORNERS = [];
for (const sol of [0.6, 1.25, 1.8])
  for (const pk of [0.2, 0.5, 0.8])
    for (const phi of [0, 1.0, 2.0])
      for (const EHYD of [2.0, 3.2, 5.0])
        for (const PMIN of [0.02, 0.30])
          for (const PMAX of [1.5, 4.0])
            CORNERS.push({ sol, pk, phi, EHYD, PMIN, PMAX });

let worstBalance = 0, worstBand = 0, worstBox = 0, badBox = null;
let sweepConv = 0, sweepStall = 0, itMin = Infinity, itMax = 0;
const stalled = [];
const sweepResults = [];

for (const c of CORNERS) {
  setP(c);
  const r = picard();
  sweepResults.push({ c, r });
  if (r.conv) { sweepConv++; itMin = Math.min(itMin, r.it); itMax = Math.max(itMax, r.it); }
  else { sweepStall++; stalled.push({ c, res: r.res, it: r.it }); }

  for (let t = 0; t < NT; t++) {
    const sl = r.disp.sl[t];
    const N = K.makeN(t, r.field.Ux[t]);
    /* the balance identity every branch is claimed to satisfy */
    worstBalance = Math.max(worstBalance, Math.abs(N(sl.p) - sl.h + sl.k - sl.d));
    /* band complementarity: kappa>0 only at the floor, d>0 only at the cap */
    worstBand = Math.max(worstBand, sl.k * Math.abs(sl.p - K.P.PMIN), sl.d * Math.abs(K.P.PMAX - sl.p));
    /* box constraints */
    const viol = Math.max(-sl.h, sl.h - HBAR, -sl.k, -sl.d, K.P.PMIN - sl.p, sl.p - K.P.PMAX);
    if (viol > worstBox) { worstBox = viol; badBox = { c, t, sl: Object.assign({}, sl) }; }
    BRANCH[classify(sl, r.disp.w, r.field.Ux[t], t)]++;
  }
}
setP();

check('A4 clearing balance identity |N(p)-h+k-d| = 0 on every slice, every corner',
  worstBalance < 1e-9, 'worst ' + worstBalance.toExponential(2) + ' over ' + CORNERS.length + ' corners x ' + NT + ' hours');
check('A5 band complementarity: kappa>0 only at the floor, deficit>0 only at the cap',
  worstBand < 1e-9, 'worst ' + worstBand.toExponential(2));
check('A6 box constraints 0<=h<=HBAR, kappa>=0, d>=0, floor<=p<=cap',
  worstBox < 1e-9, badBox ? 'worst violation ' + worstBox.toExponential(2) : 'clean');

/* Coverage is the point: an unexercised branch is an unvalidated branch.

   NOTE on wAboveCap. Once the withholding fix is in, w > PMAX can never be an
   EQUILIBRIUM: h = 0 everywhere there, so tot(w) = 0 < EHYD and the bisection
   always lands at w <= PMAX. That is the branch doing its job, not the branch
   being dead -- it is what makes tot(w) decrease to zero and the bisection
   well-posed in the first place. So it cannot be observed by classifying final
   dispatches, and is probed directly below instead. Before the fix it appeared
   82 times in final states, which was precisely the bug. */
const FINAL_BRANCHES = ['curtail', 'scarcity', 'hydroMarginal', 'hydroOff', 'hydroCapped'];
const uncovered = FINAL_BRANCHES.filter(k => BRANCH[k] === 0);
check('A7 the sweep exercises every clearSlice branch reachable in equilibrium',
  uncovered.length === 0, uncovered.length ? 'NEVER REACHED: ' + uncovered.join(', ') : FINAL_BRANCHES.length + ' reached');
note('branch counts: ' + Object.entries(BRANCH).map(([k, v]) => k + ' ' + v).join(' · '));

/* Direct unit probe of the withholding branch: force w above the cap and
   assert the Hotelling condition it exists to enforce. */
(() => {
  setP();
  const f = K.solveField(R.price);
  let worstH = 0, worstBal = 0, n = 0;
  for (const w of [K.P.PMAX + 1e-9, K.P.PMAX * 1.5, K.P.PMAX + 5, 1e6]) {
    for (let t = 0; t < NT; t++) {
      const sl = K.clearSlice(t, f.Ux[t], w), N = K.makeN(t, f.Ux[t]);
      if (sl.k > 1e-12) continue;                 // curtailment legitimately preempts
      worstH = Math.max(worstH, sl.h);            // KKT: p <= PMAX < w  =>  h = 0
      worstBal = Math.max(worstBal, Math.abs(N(sl.p) - sl.h + sl.k - sl.d));
      n++;
    }
  }
  check('A7b withholding branch: w>cap forces h=0 on every non-curtailed hour',
    worstH < 1e-12 && worstBal < 1e-9,
    'max h = ' + worstH.toExponential(2) + ', max balance residual = ' + worstBal.toExponential(2) + ' over ' + n + ' probes');
})();

/* ---------------- the structural claims the note is ABOUT ---------------- */
console.log('\n--- Layer A · structural results (T3 Hotelling, complementarity, budget) ---');

/* T3: on hydro-marginal hours the price is pinned to the water value.
   This is the note's headline prediction ("the water value pins the price
   flat on hydro-marginal windows"), so it gets swept, not spot-checked. */
(() => {
  let worstFlat = 0, marginalHours = 0, cornersWithMarginal = 0;
  for (const { c, r } of sweepResults) {
    setP(c);
    let any = 0;
    for (const s of r.disp.sl) {
      if (s.h > 1e-9 && s.h < HBAR - 1e-9) { any++; worstFlat = Math.max(worstFlat, Math.abs(s.p - r.disp.w)); }
    }
    marginalHours += any;
    if (any) cornersWithMarginal++;
  }
  setP();
  check('A8 [T3] on hydro-marginal hours the price equals the water value',
    worstFlat < 1e-9 && marginalHours > 0,
    'max |p-w| = ' + worstFlat.toExponential(2) + ' over ' + marginalHours + ' marginal hours in ' + cornersWithMarginal + ' corners');
})();

/* Complementarity in w: below the water value hydro withholds entirely,
   above it hydro runs flat out. */
(() => {
  let worst = 0;
  for (const { c, r } of sweepResults) {
    setP(c);
    for (const s of r.disp.sl) {
      if (s.p < r.disp.w - 1e-6) worst = Math.max(worst, s.h);
      if (s.p > r.disp.w + 1e-6) worst = Math.max(worst, HBAR - s.h);
    }
  }
  setP();
  check('A9 complementarity in w: p<w => h=0 and p>w => h=HBAR', worst < 1e-9,
    'worst ' + worst.toExponential(2));
})();

/* Budget: the stock constraint must actually close, OR the run must be in a
   declared exceptional regime (spill / mixed cap-indifference). Silently
   missing the budget is the failure this catches. */
(() => {
  let worstBud = 0, nSpill = 0, nMix = 0, nNormal = 0, worstMixBud = 0;
  for (const { c, r } of sweepResults) {
    setP(c);
    const tot = r.disp.sl.reduce((a, s) => a + s.h * dt, 0);
    if (r.disp.spill > 1e-6) { nSpill++; continue; }
    if (r.disp.mix !== null && r.disp.mix !== undefined) {
      nMix++; worstMixBud = Math.max(worstMixBud, Math.abs(tot - K.P.EHYD));
      continue;
    }
    nNormal++;
    worstBud = Math.max(worstBud, Math.abs(tot - K.P.EHYD));
  }
  setP();
  check('A10 hydro budget closes in the normal regime', worstBud < 1e-6,
    'worst |sum h dt - EHYD| = ' + worstBud.toExponential(2) + ' over ' + nNormal + ' corners');
  check('A11 mixed cap-indifference dispatch closes the budget when it triggers',
    nMix === 0 || worstMixBud < 1e-6,
    nMix ? nMix + ' corners, worst ' + worstMixBud.toExponential(2) : 'branch not triggered in this sweep');
  note('regimes across the sweep: ' + nNormal + ' normal · ' + nSpill + ' spill · ' + nMix + ' mixed-at-cap');
  if (nMix === 0) note('NOTE: the mixed-dispatch branch was NOT exercised — its correctness is UNVALIDATED by this sweep.');
})();

/* ---- ROOT CAUSE of the A9/A10/A12 reds (diagnosed 2026-07-20) ------------
   dispatch() bisects the water value on w in [1e-4, PMAX+5]. That search is
   only meaningful if tot(w) -> 0 as w grows: a resource whose water is worth
   more than the capped price should withhold. clearSlice has exactly that
   branch --

       if(N(PMIN)<=0)            { curtailment }
       else if(N(PMAX)>=HBAR)    { SCARCITY: p=PMAX, h=HBAR }   <-- tested first
       else if(w>PMAX)           { withhold: h=0 }              <-- unreachable

   -- but the SCARCITY test precedes it. So on any hour where net demand at
   the cap exceeds hydro capacity, h is pinned to HBAR no matter how large w
   becomes. tot(w) then saturates at a positive constant, the budget
   constraint becomes unenforceable, and the bisection walks to its bracket
   ceiling PMAX+5 and stops there -- undetected, because dispatch() handles
   only two exceptional regimes (spill, mixed-at-cap) and not this third one.

   Measured: at sol=0.6 pk=0.8 phi=0 EHYD=2.0 floor=0.02 cap=1.5 -- every one
   a legal slider position -- seven evening hours are pinned at HBAR, giving
   sum h dt = 2.10 against a budget of 2.00, and tot(w) = 2.10 for every w
   tested out to 1e6. The page then displays w = 6.500000 (= PMAX+5, the
   bracket ceiling, not a water value) to six decimals.

   This check names that mechanism directly so the three reds above are not
   re-diagnosed from scratch next session. */
const SATURATED = [];
(() => {
  const saturated = SATURATED;
  for (const { c, r } of sweepResults) {
    setP(c);
    if (r.disp.spill > 1e-6 || r.disp.mix != null) continue;
    const ceiling = K.P.PMAX + 5;
    if (Math.abs(r.disp.w - ceiling) < 1e-6) {
      const tot = w => { let x = 0; for (let t = 0; t < NT; t++) x += K.clearSlice(t, r.field.Ux[t], w).h * dt; return x; };
      saturated.push({ c, w: r.disp.w, tot: tot(ceiling), totHuge: tot(1e6), EHYD: K.P.EHYD });
    }
  }
  setP();
  check('A16 the water-value bisection never saturates at its bracket ceiling (PMAX+5)',
    saturated.length === 0,
    saturated.length
      ? saturated.length + ' corners saturate; e.g. tot(w)=' + saturated[0].tot.toFixed(3) +
        ' vs EHYD=' + saturated[0].EHYD + ', unchanged at w=1e6 (tot=' + saturated[0].totHuge.toFixed(3) + ')'
      : 'no saturation');
  if (saturated.length) {
    note('ROOT CAUSE: clearSlice tests the scarcity branch BEFORE the w>PMAX withholding branch,');
    note('so h is pinned to HBAR regardless of w and the stock constraint cannot be enforced.');
    note('A9, A10 and A12 above are the SAME six corners and the SAME cause.');
  }
})();

/* Dual feasibility of w: the budget must be monotone in the water value
   around the solution, which is what makes the bisection meaningful. */
(() => {
  let bad = 0, tested = 0;
  for (const { c, r } of sweepResults) {
    setP(c);
    if (r.disp.spill > 1e-6 || r.disp.mix != null) continue;
    const tot = w => { let x = 0; for (let t = 0; t < NT; t++) x += K.clearSlice(t, r.field.Ux[t], w).h * dt; return x; };
    const up = tot(r.disp.w * 1.01), dn = tot(r.disp.w * 0.99);
    tested++;
    if (!(dn >= K.P.EHYD - 1e-6 && up <= K.P.EHYD + 1e-6)) bad++;
  }
  setP();
  check('A12 water-value bracket holds: budget is monotone across w', bad === 0,
    bad + ' violations of ' + tested + ' tested corners');
})();

/* ---------------- convergence range: MEASURED, never remembered ---------- */
console.log('\n--- Layer A · convergence range (measured across the slider box) ---');
check('A13 Picard converges on the majority of the slider box', sweepConv > CORNERS.length / 2,
  sweepConv + '/' + CORNERS.length + ' corners converge');
note('MEASURED iteration range on converging corners: ' + itMin + '-' + itMax +
  ' (tol 1e-10). Non-converging corners: ' + sweepStall + '/' + CORNERS.length + '.');
if (stalled.length) {
  const worstStall = stalled.reduce((a, b) => (b.res > a.res ? b : a));
  note('worst stall: res ' + worstStall.res.toExponential(2) + ' after ' + worstStall.it +
    ' iterations at sol=' + worstStall.c.sol + ' pk=' + worstStall.c.pk + ' phi=' + worstStall.c.phi +
    ' EHYD=' + worstStall.c.EHYD + ' floor=' + worstStall.c.PMIN + ' cap=' + worstStall.c.PMAX);
  note('ANY PROSE STATING A CONVERGENCE RANGE MUST QUOTE ' + itMin + '-' + itMax +
    ' AND DISCLOSE THE ' + sweepStall + ' NON-CONVERGING CORNERS.');
}

/* ---------------- harvested from test-sinmfg.js / smoke-note.js ----------
   Those two batteries were retired in the 2026-07-20 cleanup (one embedded its
   own stale kernel copy and ran green against it; the other hardcoded a dead
   sandbox path and could not run at all). Their three genuinely unique
   assertions were moved here first, where they run against the kernel EXTRACTED
   from the artifact. Deliberately NOT harvested:
     - test-sinmfg.js `eps < floor` — the fabricated-floor construction
       FINDINGS.md destroyed. The floor has now been removed from the artifact's
       display entirely; A15 (a Layer-B guard) pins that it does not return, so
       reimporting the assertion would restore a retracted defect.
     - test-sinmfg.js dpAudit2 — line-for-line the same algorithm as the
       artifact's dpAudit that A19 calls. A duplicate, not a cross-check;
       a genuinely independent audit is new work, not harvest. */
console.log('\n--- Layer A · harvested structural checks ---');

/* T4 — the fleet must ABSORB curtailment, not create it. The note displays
   this number (roCurt, "0.96 → 0.70"), so it needs a gate. */
(() => {
  setP();
  const kF = R.disp.sl.reduce((x, s) => x + s.k * dt, 0);
  const phi0 = K.P.phi;
  K.P.phi = 0;
  const d0 = K.dispatch(new Float64Array(NT));      // fleet off: zeroed Ux
  K.P.phi = phi0;
  const k0 = d0.sl.reduce((x, s) => x + s.k * dt, 0);
  check('A17 [T4] the fleet strictly reduces curtailed energy',
    kF < k0 && k0 > 0,
    'with fleet ' + kF.toFixed(4) + ' vs without ' + k0.toFixed(4) +
    ' (absorbs ' + (100 * (k0 - kF) / Math.max(k0, 1e-9)).toFixed(1) + '%)');
  check('A18 P.phi is restored after the fleet-off probe (no state leak)',
    K.P.phi === phi0, 'phi = ' + K.P.phi);
})();

/* A21 — A17 IS WEAK, AND THIS IS THE MEASUREMENT THAT SHOWS IT.
   Mutating the artifact to flip the fleet's sign entirely
   (`fleet = -P.phi*clamp(...)` in makeN) does NOT trip A17: kF < k0 stays
   true because the equilibrium re-solves around the perverse fleet. A17 only
   ever asserted that SOME fleet beats NO fleet, which is a weaker statement
   than it looks. The sign flip was caught, but by A14 (welfare beaten by a
   two-level tariff) — not by the check nominally about the fleet.

   The falsifiable content is the ARBITRAGE DIRECTION, which is what the note
   actually claims: charge into the solar surplus, discharge into the evening
   peak. Measured — true artifact: midday(10-14) +0.2745, evening(18-21)
   -0.9647. Sign-flipped mutant: midday -0.0717. That separates them. */
(() => {
  setP();
  let midday = 0, evening = 0;
  for (let t = 0; t < NT; t++) {
    if (t >= 10 && t <= 14) midday += R.field.A[t];
    if (t >= 18 && t <= 21) evening += R.field.A[t];
  }
  check('A21 the fleet arbitrages the right way: charges at midday, discharges at the evening peak',
    midday > 0 && evening < 0,
    'midday(10-14) ' + midday.toFixed(4) + ' · evening(18-21) ' + evening.toFixed(4));
})();

/* eps >= -tol. A negative exploitability means the best response lost to the
   policy it is supposed to dominate — i.e. the DP is broken. One line, and the
   battery lacked it. */
(() => {
  setP();
  const a = K.dpAudit(R.price, R.field);
  check('A19 DP exploitability is non-negative (best response cannot lose)',
    a.eps >= -1e-9, 'eps = ' + a.eps.toExponential(3));
})();

/* Comparative statics — a NEW assertion class. The 324-corner sweep checks that
   certificates hold everywhere, but never that the model RESPONDS correctly to
   a parameter. More solar must not reduce curtailment.
   MEASURED before asserting (house rule): curtailed energy over
   sol = 0.6..1.8 runs 0.0000, 0.0000, 0.0601, 0.5297, 1.2254, 1.9487, 2.8850
   and curtailment hours 0,0,2,4,4,5,6 — monotone in both. */
(() => {
  const sols = [0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8];
  const es = [], hs = [];
  for (const sol of sols) {
    setP({ sol });
    const r = picard();
    es.push(r.disp.sl.reduce((x, s) => x + s.k * dt, 0));
    hs.push(r.disp.sl.filter(s => s.k > 1e-9).length);
  }
  setP();
  const monoE = es.every((v, i) => i === 0 || v >= es[i - 1] - 1e-12);
  const monoH = hs.every((v, i) => i === 0 || v >= hs[i - 1]);
  const responds = es[es.length - 1] > es[0] + 1e-6;   // guard against all-zero
  check('A20 comparative statics: curtailment is monotone non-decreasing in solar',
    monoE && monoH && responds,
    'energy ' + es.map(v => v.toFixed(2)).join(' → ') + ' · hours ' + hs.join(','));
})();

/* ---------------- adjoint structure of the field operator ----------------
   The note's strongest structural claim was "FP forward on the exact discrete
   transpose". Measured, the claim is PART true and PART false, and the honest
   split matters:
     - DIFFUSION is an exact discrete transpose of itself (self-adjoint) —
       the reflecting-BC tridiagonal is symmetric, |D - Dᵀ| ~ machine zero.
     - TRANSPORT is NOT: the FP uses upwind flux, the linearized HJB drift is
       centered, so |T_FP - A_HJBᵀ|/scale ~ 1.0 at every slice. They are not
       adjoints at all.
     - MASS CONSERVATION, which the note actually depends on, comes from the
       CONSERVATIVE FLUX FORM (the transport matrix has machine-zero column
       sums, 1ᵀT_FP = 0), NOT from an adjoint identity.
   The prose was corrected to say exactly this; these checks pin the true
   parts and a prose guard pins the corrected claim. See FINDINGS_SIN.md. */
console.log('\n--- Layer A · adjoint structure of the field operator ---');
(() => {
  setP();
  const NX = K.NX, hx = K.hx, nu = 0.5 * K.SIG * K.SIG;
  // frozen equilibrium policy at a representative interior slice
  const t = 12, u = R.field.u[t], price = R.price[t];
  const al = new Float64Array(NX);
  for (let i = 0; i < NX; i++) {
    const uxp = i < NX - 1 ? (u[i + 1] - u[i]) / hx : 0, uxm = i > 0 ? (u[i] - u[i - 1]) / hx : 0;
    al[i] = Math.max(-K.AMAX, Math.min(K.AMAX, (0.5 * (uxp + uxm) - price) / K.ETA));
  }
  const matOf = apply => {
    const M = Array.from({ length: NX }, () => new Array(NX).fill(0));
    for (let j = 0; j < NX; j++) {
      const e = new Float64Array(NX); e[j] = 1;
      const c = apply(e);
      for (let i = 0; i < NX; i++) M[i][j] = c[i];
    }
    return M;
  };
  // FP upwind transport generator: (T m)[i] = -(flux[i+1]-flux[i])/hx
  const TFP = matOf(m => {
    const flux = new Float64Array(NX + 1);
    for (let f = 1; f < NX; f++) { const a = 0.5 * (al[f - 1] + al[f]); flux[f] = a > 0 ? a * m[f - 1] : a * m[f]; }
    const o = new Float64Array(NX);
    for (let i = 0; i < NX; i++) o[i] = -(flux[i + 1] - flux[i]) / hx;
    return o;
  });
  // linearized HJB centered advection generator: (A v)[i] = al_i*(centered grad v)[i]
  const AHJB = matOf(v => {
    const o = new Float64Array(NX);
    for (let i = 0; i < NX; i++) {
      const uxp = i < NX - 1 ? (v[i + 1] - v[i]) / hx : 0, uxm = i > 0 ? (v[i] - v[i - 1]) / hx : 0;
      o[i] = al[i] * 0.5 * (uxp + uxm);
    }
    return o;
  });
  // implicit diffusion operator (the shared diffuse() matrix), reflecting BC
  const r = nu * (K.dt / 4) / (hx * hx);
  const D = matOf(v => {
    const a = new Float64Array(NX), b = new Float64Array(NX), c = new Float64Array(NX);
    for (let i = 0; i < NX; i++) { a[i] = -r; b[i] = 1 + 2 * r; c[i] = -r; }
    b[0] = 1 + r; b[NX - 1] = 1 + r; a[0] = 0; c[NX - 1] = 0;
    return K.thomas(a, b, c, v);
  });

  // (1) diffusion self-adjoint — the TRUE transpose part
  let dSym = 0, dScale = 0;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) {
    dSym = Math.max(dSym, Math.abs(D[i][j] - D[j][i])); dScale = Math.max(dScale, Math.abs(D[i][j]));
  }
  /* The matrices above are reconstructed in the test; `diffuse`/flux live in a
     closure inside solveField and cannot be extracted. So each property check
     is ANCHORED to the artifact's actual source form — if the real operator
     drifts from the form whose property we verified, the anchor fails. Without
     this the check would validate a copy (the landmine pattern). */
  const symBC = /b\[0\]=1\+r;\s*b\[NX-1\]=1\+r;\s*a\[0\]=0;\s*c\[NX-1\]=0;/.test(KSRC);
  check('A22 diffusion operator is an exact discrete transpose (self-adjoint)',
    dSym / dScale < 1e-12 && symBC,
    '|D - Dᵀ|/scale = ' + (dSym / dScale).toExponential(2) + (symBC ? '' : ' · SOURCE BC no longer symmetric'));

  // (2) transport conservative — the source of mass conservation (1ᵀ T = 0)
  let colSum = 0;
  for (let j = 0; j < NX; j++) { let s = 0; for (let i = 0; i < NX; i++) s += TFP[i][j]; colSum = Math.max(colSum, Math.abs(s)); }
  // anchor: the artifact's FP update must still be the conservative flux
  // divergence -(flux[i+1]-flux[i])/hx (a non-conservative variant breaks 1ᵀT=0)
  const consForm = /w\[i\]=mv\[i\]-dts\*\(flux\[i\+1\]-flux\[i\]\)\/hx/.test(KSRC);
  check('A23 FP transport is conservative at the operator level (machine-zero column sums)',
    colSum < 1e-12 && consForm,
    'max |1ᵀ·col| = ' + colSum.toExponential(2) + (consForm ? '' : ' · SOURCE no longer conservative flux form'));

  // (3) transport is NOT the exact adjoint of the centered HJB drift — the
  // corrected claim. Measured relative defect ~1.0 (upwind vs centered). This
  // is documented, not asserted-forever: if the scheme ever moved to a matched
  // discretization the note's prose would need updating too, so we record the
  // measurement rather than gate a specific magnitude.
  let dT = 0, tScale = 0;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NX; j++) {
    dT = Math.max(dT, Math.abs(TFP[i][j] - AHJB[j][i])); tScale = Math.max(tScale, Math.abs(TFP[i][j]));
  }
  note('MEASURED transport adjoint defect |T_FP - A_HJBᵀ|/scale = ' + (dT / tScale).toFixed(3) +
    ' (upwind FP vs centered HJB — NOT adjoints; conservation is from the flux form, A23).');
})();

/* Prose guards — the corrected overclaims must not silently return. Two were
   found in sin-mfg.html and fixed 2026-07-20: (a) "exact discrete transpose"
   for the transport (false — A22/A23 above show diffusion self-adjoint but
   transport only conservative), and (b) the "O(h+Δt) consistency floor" /
   "meaningful down to ... floor" language that FINDINGS.md destroyed for
   mfg-lab and smoke.js bans — it had survived here because no gate checked
   this file (the failure-catalog "a fixed claim survives in copies you did
   not grep for"). Guard the DISPLAYED text; retraction comments may still
   name the phrases. */
(() => {
  // strip HTML/JS comments so a retraction comment naming a phrase doesn't trip the guard
  const shown = html.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
  check('A24 prose: no "exact discrete transpose" overclaim for the FP operator',
    !/exact discrete transpose/.test(shown));
  check('A25 prose: no retracted "consistency floor" language',
    !/consistency floor/.test(shown));
  check('A26 prose: eps floor not claimed as a bound ("meaningful down to")',
    !/meaningful down to/.test(shown));
  /* [ADDED 2026-07-21] The organizing principle was stated with a universal
     quantifier that this page's OWN panel falsifies: the exploitability eps is
     an independent DP optimality gap, neither a constraint residual nor an
     adjoint martingale. Narrowed to four classes; pin the absence so the
     tidier-sounding universal cannot creep back. */
  check('A27 prose: the certificate principle is not stated as a universal',
    !/(every|each) certificate is a constraint residual/i.test(shown));
  /* Strong LP duality needs no CQ because the constraints are LINEAR — that is
     finiteness, not a strength of the argument. Saying "no constraint
     qualification needed" unqualified reads as the latter; a referee flags it. */
  check('A28 prose: "no constraint qualification" is attributed to linearity, not sold as strength',
    !/no constraint qualification needed/i.test(shown));
})();

/* ---------------- welfare / convexity ----------------------------------- */
console.log('\n--- Layer A · welfare (the convex-program claim) ---');
(() => {
  setP();
  const Jstar = K.welfareOf(R.price, R.field, R.disp);
  let best = -Infinity, bestCfg = null, worstBud = 0, nMix = 0, nSpill = 0;
  const ws = [], mixes = [], slFails = [];
  for (const pk of [1.0, 1.3, 1.6, 1.9, 2.2])
    for (const off of [0.3, 0.45, 0.6, 0.75, 0.9])
      for (const wn of [[17, 21], [18, 22]]) {
        const r = K.touCounterfactual(pk, off, wn[0], wn[1]);
        if (r.bud > worstBud) worstBud = r.bud;
        if (r.mix !== null) { nMix++; mixes.push(r.mix); }
        if (r.spill > 1e-6) nSpill++;
        ws.push(r.w);
        for (const s of r.sl) {
          if (!(s.h >= -1e-12 && s.h <= HBAR + 1e-12)) slFails.push('h');
          if (!(s.q >= -1e-12 && s.q <= K.QBAR + 1e-12)) slFails.push('q');
          if (!(s.d >= -1e-12)) slFails.push('d');
        }
        if (r.J > best) { best = r.J; bestCfg = { pk, off, wn }; }
      }
  const gap = Jstar - best;
  check('A14 equilibrium welfare is not beaten by any two-level TOU tariff (50-point grid)',
    gap >= -1e-9,
    'J* - J_bestTOU = ' + gap.toExponential(3) + ' (' + (100 * gap / Math.abs(Jstar)).toFixed(2) + '%)');
  note('best TOU on the grid: peak ' + bestCfg.pk + ' off ' + bestCfg.off + ' window ' + bestCfg.wn.join('-'));

  /* [ADDED 2026-07-29] A14 tests only the SIGN of the gap, and that is why it
     ran green for months over a counterfactual that violated the model's own
     stock constraint on 50 of 50 grid points. touCounterfactual dispatched hydro
     as a pure residual — clamp(need - min(w/GAM,QBAR), 0, HBAR) with no
     withholding branch — so sum h dt was bounded below by sum max(need-QBAR,0)
     for EVERY w, the budget EHYD = 3.2 sat below that bound, the bisection
     walked to its PMAX+5 ceiling and returned w = 8 on all 50 points, and the
     counterfactual spent up to 4.9305 of hydro. Worst error 1.7504 against 3.2.
     Every violation handed the counterfactual MORE hydro than allowed, so the
     old 5.23% understated the equilibrium; held to its own budget the best-TOU
     gap is 20.39%. Same species as Defect 1, at a second site.

     A comparison is like-for-like only if both sides obey the same constraints.
     THE GAP'S SIGN IS NOT A SUBSTITUTE FOR THE CONSTRAINT: assert the
     constraint. See FINDINGS_SIN.md Defect 5. */
  check('A14b every TOU counterfactual closes the hydro stock constraint it is compared under',
    worstBud < 1e-9 && slFails.length === 0,
    'worst |sum h dt - EHYD| = ' + worstBud.toExponential(3) + ' over 50 tariffs (EHYD = '
    + K.P.EHYD + ') · per-slice bound violations ' + slFails.length
    + ' · w in [' + Math.min(...ws).toFixed(4) + ', ' + Math.max(...ws).toFixed(4) + ']'
    + ' · mixed ' + nMix + ' · spill ' + nSpill);

  /* The counterfactual closes its budget through the SAME degenerate dual the
     equilibrium has: at w = PMAX hydro is indifferent between displacing a unit
     of unserved energy (worth PMAX) and holding the water, so the optimal set is
     a face, and a uniform-theta point of it is chosen. That choice must not move
     the number being reported. It does not, and the reason is structural: on a
     pooled hour thermal is at QBAR and d = need - QBAR - h, so J is affine in
     sum h with slope -PMAX across the whole face. Measured here against two
     extreme points of the same face (greedy-earliest, greedy-latest), rebuilt
     independently of the kernel's own allocation. */
  const tariff = (pk, off, w0, w1) => {
    const tau = new Float64Array(NT);
    for (let t = 0; t < NT; t++) tau[t] = (t >= w0 && t <= w1) ? pk : off;
    return tau;
  };
  const JofH = (pk, off, w0, w1, alloc) => {
    const tau = tariff(pk, off, w0, w1), f = K.solveField(tau), need = new Float64Array(NT);
    for (let t = 0; t < NT; t++)
      need[t] = Math.min(K.At_(t) / tau[t], K.CBAR) + K.Lt(t) + K.P.phi * f.A[t] - K.St(t);
    const h = alloc(need);
    let J = 0;
    for (let t = 0; t < NT; t++) {
      let stor = 0; const u = f.u[t];
      for (let i = 0; i < NX; i++) {
        const uxp = (i < NX - 1 ? (u[i + 1] - u[i]) / hx : 0), uxm = (i > 0 ? (u[i] - u[i - 1]) / hx : 0);
        const a = Math.max(-AMAX, Math.min(AMAX, (0.5 * (uxp + uxm) - tau[t]) / ETA));
        stor += 0.5 * ETA * a * a * f.m[t][i] * hx;
      }
      const rem = need[t] - h[t], q = Math.min(Math.max(rem, 0), K.QBAR), d = Math.max(rem - q, 0);
      J += dt * (K.At_(t) * Math.log(Math.min(K.At_(t) / tau[t], K.CBAR))
        - K.P.phi * stor - 0.5 * K.GAM * q * q - K.P.PMAX * d);
    }
    for (let i = 0; i < NX; i++) J += (-K.KAPT * (xs[i] - K.XSTAR) ** 2) * f.m[NT][i] * hx;
    return { J, h };
  };
  const capOf = need => Array.from(need, n => Math.min(Math.max(n - K.QBAR, 0), HBAR));
  const fill = order => need => {
    const c = capOf(need), h = c.map(() => 0);
    let rem = K.P.EHYD / dt;
    for (const t of order) { if (rem <= 0) break; const g = Math.min(c[t], rem); h[t] = g; rem -= g; }
    return h;
  };
  const fwd = Array.from({ length: NT }, (_, t) => t);
  const Jk = K.touCounterfactual(1.6, 0.55, 17, 21).J;
  const Je = JofH(1.6, 0.55, 17, 21, fill(fwd)).J;
  const Jl = JofH(1.6, 0.55, 17, 21, fill(fwd.slice().reverse())).J;
  const spread = Math.max(Math.abs(Je - Jk), Math.abs(Jl - Jk));
  check('A14c the uniform-theta tie-break on the indifferent pool is welfare-neutral',
    spread < 1e-12,
    'J(kernel) = ' + Jk.toFixed(9) + ' · greedy-early ' + Je.toFixed(9)
    + ' · greedy-late ' + Jl.toFixed(9) + ' · spread ' + spread.toExponential(2));

  /* And the dispatch is cost-minimising, not merely feasible: no
     budget-preserving reallocation of hydro between two hours improves J. This
     is the assertion the old residual dispatcher could never have passed, since
     it had no water value to be optimal with respect to. */
  const hK = K.touCounterfactual(1.6, 0.55, 17, 21).sl.map(s => s.h);
  let bestGain = -Infinity, argij = null;
  const EPSR = 1e-3;
  for (let i = 0; i < NT; i++) {
    if (hK[i] < EPSR) continue;
    for (let j = 0; j < NT; j++) {
      if (i === j || HBAR - hK[j] < EPSR) continue;
      const h = Float64Array.from(hK); h[i] -= EPSR; h[j] += EPSR;
      const J = JofH(1.6, 0.55, 17, 21, () => h).J;
      if (J - Jk > bestGain) { bestGain = J - Jk; argij = i + '->' + j; }
    }
  }
  check('A14d no budget-preserving reallocation of counterfactual hydro improves its welfare',
    bestGain < 1e-9,
    'best gain ' + bestGain.toExponential(3) + ' at ' + argij + ' (eps = ' + EPSR + ')');
  note('counterfactual regimes over the 50 tariffs: mixed ' + nMix + ' · spill ' + nSpill
    + (mixes.length ? ' · theta in [' + Math.min(...mixes).toFixed(4) + ', '
      + Math.max(...mixes).toFixed(4) + ']' : ''));
  note('best-TOU welfare gap held to its own stock constraint: '
    + (100 * gap / Math.abs(Jstar)).toFixed(2) + '% (was 5.23% when the counterfactual overspent)');
})();

/* Both degenerate-dual branches of the COUNTERFACTUAL must be reachable, or the
   case analysis above is prose. dispatch()'s branches are covered by A7/A11; the
   counterfactual's are covered here, by walking EHYD. A branch that is never
   exercised proves nothing (FINDINGS_SIN, three times over). */
(() => {
  const seen = { mixed: 0, interior: 0, spill: 0 };
  const rows = [];
  for (const E of [0.05, 0.5, 2.0, 3.2, 5.0, 6.5, 9.0]) {
    setP({ EHYD: E });
    const r = K.touCounterfactual(1.6, 0.55, 17, 21);
    const reg = r.spill > 1e-6 ? 'spill' : (r.mix !== null ? 'mixed' : 'interior');
    seen[reg]++;
    rows.push('EHYD=' + E + ' ' + reg + ' w=' + r.w.toFixed(4) + ' bud=' + r.bud.toExponential(1));
    if (!(r.bud < 1e-9)) { seen.bad = (seen.bad || 0) + 1; }
  }
  setP();
  check('A14e all three counterfactual water-value regimes are reachable and each closes the budget',
    seen.mixed > 0 && seen.interior > 0 && seen.spill > 0 && !seen.bad,
    rows.join(' · '));
})();

/* ---------------- FLOOR DISCIPLINE (the retracted claim, resurfaced) -----
   mfg-lab.html printed an exploitability "floor" that FINDINGS.md measured
   and destroyed: the O(h+dt) bound is ~9 orders too large to bind, and no
   calibrated constant is defensible (2400x spread). The lab removed it, and
   smoke.js pins its absence.

   sin-mfg.html prints one anyway, at line `roEps`:
       fmtE(eps) + ' < floor ' + floor.toFixed(3) + ' (heuristic scale)'
   with floor = (hx/XBAR + dt/NT) * arb — an invented constant of 1 on an
   O(h+dt) scale, exactly the retracted construction. This measures whether
   it binds. It is a MEASUREMENT, not yet a gate: the gate goes in once the
   line is fixed, so that the fix can be shown to go red. */
/* Floor discipline. An earlier version DISPLAYED an O(h+Δt) "floor" beside eps
   and claimed "eps < floor". Measured: |eps|/floor spans several orders across
   the slider box (documented below), so no single constant bounds eps — the
   fabricated-floor construction FINDINGS.md destroyed for mfg-lab. The floor is
   now removed from the display entirely; A15 (a Layer-B guard) pins that it does
   not return. Here we only MEASURE the spread, as the standing evidence for the
   removal. */
console.log('\n--- Layer A · floor discipline (evidence the removed floor was not a bound) ---');
(() => {
  const ratios = [];
  const probe = CORNERS.filter((_, i) => i % 7 === 0);   // 1-in-7 sample, sweep is expensive
  for (const c of probe) {
    setP(c);
    const r = picard();
    if (!r.conv) continue;
    const a = K.dpAudit(r.price, r.field);
    if (isFinite(a.eps) && isFinite(a.floor) && a.floor > 0) ratios.push(Math.abs(a.eps) / a.floor);
  }
  setP();
  ratios.sort((x, y) => x - y);
  const lo = ratios[0], hi = ratios[ratios.length - 1];
  note('|eps| / (old floor) over ' + ratios.length + ' converged corners: ' +
    lo.toExponential(2) + ' .. ' + hi.toExponential(2) + '  (spread ' + (hi / lo).toFixed(0) +
    'x) — not a calibratable bound, hence removed from the display.');
})();

/* ================================================================
   2 · LAYER B — WIRING (the artifact's own certificate code)
   ================================================================ */
console.log('\n--- Layer B · wiring: the artifact\'s own display path ---');

function makeCtx(owner) {
  return new Proxy({}, {
    get(t, p) {
      if (p === 'canvas') return owner;
      if (p === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h });
      if (p === 'measureText') return () => ({ width: 10 });
      if (p in t) return t[p];
      return () => undefined;
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}
const RANGE_DEFAULTS = { pSol: '1.25', pPk: '0.50', pPhi: '1.0', pEh: '3.2', pFl: '0.05', pCp: '3.0' };
const reg = new Map();
function makeEl(tag, id) {
  const el = {
    tagName: (tag || 'div').toUpperCase(), id: id || 'el', style: {}, dataset: {},
    attributes: {}, _handlers: {}, children: [],
    value: '', defaultValue: '', type: '', textContent: '', innerHTML: '', className: '',
    clientWidth: 900,
    classList: { _s: new Set(), add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute(k, v) { el.attributes[k] = String(v); },
    getAttribute(k) { return el.attributes[k]; },
    addEventListener(t, fn) { (el._handlers[t] = el._handlers[t] || []).push(fn); },
    removeEventListener() {},
    dispatchEvent(ev) { (el._handlers[ev.type] || []).forEach(fn => fn.call(el, ev)); return true; },
    click() { el.dispatchEvent({ type: 'click', target: el, preventDefault() {} }); },
    appendChild(c) { el.children.push(c); return c; },
    querySelector() { return null; }, querySelectorAll() { return []; },
    getContext() { if (!el._ctx) el._ctx = makeCtx(el); return el._ctx; },
    getBoundingClientRect() { return { width: 900, height: 300, top: 0, left: 0 }; },
    toBlob(cb) { cb(null); }
  };
  el.width = 900; el.height = 300;
  return el;
}
function getEl(id) {
  if (!reg.has(id)) {
    const el = makeEl('div', id);
    if (RANGE_DEFAULTS[id] !== undefined) { el.type = 'range'; el.value = el.defaultValue = RANGE_DEFAULTS[id]; }
    reg.set(id, el);
  }
  return reg.get(id);
}
const g = globalThis;
g.window = g;
g.document = {
  documentElement: makeEl('html', 'root'),
  getElementById: getEl,
  createElement: t => makeEl(t),
  querySelectorAll: () => [],
  addEventListener() {}
};
g.requestAnimationFrame = () => 0;               // loop() registers and never runs
g.matchMedia = () => ({ matches: false });
g.devicePixelRatio = 1;
g.getComputedStyle = () => ({ getPropertyValue: () => '#000' });
try { g.addEventListener = () => {}; } catch (e) {
  Object.defineProperty(g, 'addEventListener', { value: () => {}, configurable: true });
}

let wiringOk = true;
try { new Function(FULL)(); } catch (e) {
  wiringOk = false;
  check('B1 full artifact script evaluates under a headless DOM', false, e.message);
}
if (wiringOk) {
  check('B1 full artifact script evaluates under a headless DOM', true);
  check('B2 the artifact exposes its documented test hook window.__sin.solveSync',
    g.__sin && typeof g.__sin.solveSync === 'function');
}

if (wiringOk && g.__sin && typeof g.__sin.solveSync === 'function') {
  const txt = id => getEl(id).textContent;
  const num = s => {
    if (typeof s !== 'string') return NaN;
    if (/<\s*1e-14/.test(s)) return 0;            // fmtG's machine-zero form
    const m = s.match(/-?\d+(?:\.\d+)?e[+-]\d+|-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  };

  const out = g.__sin.solveSync(false);
  check('B3 solveSync converges at base parameters and reports it',
    out.conv === true, out.it + ' iterations, res ' + out.res.toExponential(2));

  const RO = ['roClear', 'roMass', 'roMin', 'roBud', 'roComp', 'roT3', 'roBand',
    'roDual', 'roEps', 'roReg', 'roCurt', 'roG', 'roFP'];
  const unset = RO.filter(id => !txt(id) || txt(id) === '—');
  check('B4 every certificate readout is populated after a full solve',
    unset.length === 0, unset.length ? 'still blank: ' + unset.join(', ') : RO.length + ' readouts');

  /* A15 — the eps readout reports the exploitability value, NOT a fabricated
     floor. The floor was displayed as "eps < floor X" / "O(h+Δt) scale X" and
     removed (the measurement above shows it bounds nothing). This guard pins the
     removal: roEps must carry the eps value and must NOT present a floor/bound. */
  {
    const s = txt('roEps');
    const hasValue = /-?\d+(?:\.\d+)?e[+-]\d+/.test(s);
    const hasFloor = /floor|< ?floor|O\(h\+|scale\s+\d/.test(s);
    check('A15 eps readout reports the value, not a fabricated floor/bound',
      hasValue && !hasFloor, 'roEps = "' + s + '"');
  }

  /* THE CROSS-CHECK. Layer A recomputed these independently from the extracted
     kernel; Layer B is what the reader actually sees. If they disagree, either
     the math is wrong or the display lies — and neither can hide behind the
     other. */
  setP();
  const A = picard();
  let massA = 0;
  for (let t = 0; t <= NT; t++) {
    let s = 0; for (let i = 0; i < NX; i++) s += A.field.m[t][i] * hx;
    massA = Math.max(massA, Math.abs(s - 1));
  }
  let clearA = 0;
  for (let t = 0; t < NT; t++) {
    const sl = A.disp.sl[t], N = K.makeN(t, A.field.Ux[t]);
    clearA = Math.max(clearA, Math.abs(N(sl.p) - sl.h + sl.k - sl.d));
  }
  const agree = (a, b, tol) => (a === 0 && b === 0) || Math.abs(a - b) <= tol * Math.max(1e-30, Math.abs(a), Math.abs(b));

  check('B5 displayed iteration count matches an independent Picard run',
    out.it === A.it, 'page ' + out.it + ' vs battery ' + A.it);

  /* B6/B7 — THE DISPLAY-FLOOR TRAP (found by mutation testing, 2026-07-20).
     The first version of these two checks compared the displayed string to an
     independent recomputation and allowed fmtG's machine-zero form '< 1e-14'
     to stand for any value below 1e-14. A mutant that replaced the mass
     computation with the literal string '< 1e-14' PASSED — a fake certificate,
     invisible, in the exact battery written to catch fake certificates.

     Cause: measured over 48 corners, mass drift never exceeds 5.55e-15 and the
     clearing residual likewise stays under the floor, so BOTH readouts render
     the constant string '< 1e-14' everywhere in the reachable slider box. A
     value that is displayed as a constant cannot be falsified by reading it,
     so no string comparison against it can ever bite.

     The fix is to stop treating the floored string as evidence. These checks
     now assert only what the string can actually support -- that the page is
     not claiming machine-zero while the truth is larger -- and the falsifiable
     work is done by B8 (roFP carries real digits and tracks) plus B12, which
     gates the floor-collapse hazard itself. */
  /* B6/B7/B8 — THE CROSS-CHECK, AND WHY IT TRACKS ACROSS CORNERS.
     Two escapes were found here by mutation testing, both the same species:

       1. The first version let fmtG's machine-zero string '< 1e-14' stand for
          any sub-floor value. A mutant hardcoding roMass to that literal
          passed. (Fixed in the artifact: fmtG now prints real digits.)
       2. The second version compared real digits, but only AT BASE
          PARAMETERS. A mutant hardcoding roMass to '3.33e-15' -- the correct
          base-parameter value -- passed again. A constant is indistinguishable
          from a computation when you only ever sample one point.

     This is exactly the smoke.js M1-mass lesson: magnitude checks are weak,
     and a single sample cannot separate implementations that agree there.
     So every displayed certificate is now tracked across several corners and
     must BOTH agree with an independent recomputation at each one AND take
     more than one distinct value. A readout that never varies is reported as
     unfalsifiable rather than quietly passing. */
  (() => {
    const probe = [
      { sol: 1.25, pk: 0.50, phi: 1.0, EHYD: 3.2, PMIN: 0.05, PMAX: 3.0 },
      { sol: 0.60, pk: 0.20, phi: 0.0, EHYD: 2.0, PMIN: 0.02, PMAX: 4.0 },
      { sol: 1.80, pk: 0.50, phi: 2.0, EHYD: 5.0, PMIN: 0.30, PMAX: 4.0 },
      { sol: 0.60, pk: 0.80, phi: 2.0, EHYD: 2.0, PMIN: 0.02, PMAX: 1.5 }
    ];
    /* what the page shows -> how the battery recomputes it, independently */
    const TRACKED = {
      roClear: r => {
        let x = 0;
        for (let t = 0; t < NT; t++) {
          const sl = r.disp.sl[t], N = K.makeN(t, r.field.Ux[t]);
          x = Math.max(x, Math.abs(N(sl.p) - sl.h + sl.k - sl.d));
        }
        return x;
      },
      roMass: r => {
        let x = 0;
        for (let t = 0; t <= NT; t++) {
          let s = 0; for (let i = 0; i < NX; i++) s += r.field.m[t][i] * hx;
          x = Math.max(x, Math.abs(s - 1));
        }
        return x;
      },
      roFP: r => r.res,
      /* B13 — harvested T4, display half. roCurt renders "kF vs k0 (absorbs N%)";
         num() takes the first number, so recompute kF (curtailed energy WITH
         the fleet) and compare. Pairs with A17, which checks the SIGN. */
      roCurt: r => r.disp.sl.reduce((x, s) => x + s.k * dt, 0),
      /* B14 — the welfare gap, display half, added 2026-07-29 with the Stage 0.4
         fix. roG renders "+X.X% naive · +Y.Y% vs BEST two-level TOU"; num() takes
         the naive percentage, so recompute that. This ALSO covers the refusal
         path: when a counterfactual fails to close its own stock constraint the
         page prints "refused · … off by <bud>" instead of a percentage, and the
         number num() then finds is the budget error, which cannot agree with the
         recomputed percentage. So the readout is pinned in both directions —
         a like-for-like gap must track, and a non-like-for-like one must not
         render as a gap at all. */
      roG: r => {
        const Jstar = K.welfareOf(r.price, r.field, r.disp);
        const Jn = K.touCounterfactual(1.6, 0.55, 17, 21).J;
        return 100 * (Jstar - Jn) / Math.abs(Jstar);
      }
    };
    const shown = {}, agreed = {};
    for (const id in TRACKED) { shown[id] = new Set(); agreed[id] = 0; }

    for (const c of probe) {
      getEl('pSol').value = String(c.sol); getEl('pPk').value = String(c.pk);
      getEl('pPhi').value = String(c.phi); getEl('pEh').value = String(c.EHYD);
      getEl('pFl').value = String(c.PMIN); getEl('pCp').value = String(c.PMAX);
      g.__sin.solveSync(false);
      const page = {};
      for (const id in TRACKED) { page[id] = txt(id); shown[id].add(page[id]); }
      setP(c);
      const ind = picard();
      for (const id in TRACKED) {
        if (agree(num(page[id]), TRACKED[id](ind), 0.05)) agreed[id]++;
      }
    }
    for (const id in RANGE_DEFAULTS) getEl(id).value = RANGE_DEFAULTS[id];
    setP();

    const LABEL = { roClear: 'B6 clearing residual', roMass: 'B7 mass drift', roFP: 'B8 Picard residual',
                    roCurt: 'B13 fleet-vs-curtailment exhibit', roG: 'B14 welfare gap of a posted TOU tariff' };
    for (const id of ['roClear', 'roMass', 'roFP', 'roCurt', 'roG']) {
      const allAgree = agreed[id] === probe.length;
      const varies = shown[id].size > 1;
      check(LABEL[id] + ' tracks an independent recomputation across corners',
        allAgree && varies,
        agreed[id] + '/' + probe.length + ' agree · ' + shown[id].size + ' distinct value(s)' +
        (varies ? '' : ' — CONSTANT, so a hardcoded value would be indistinguishable'));
    }
  })();

  /* Honest-status discipline: a converged run must say so, and — the part
     that matters — a stalled run must NOT claim an equilibrium. Drive a
     corner the sweep found to stall, if there is one. */
  check('B9 converged run reports convergence in the status line',
    /converged/.test(txt('status')), txt('status').slice(0, 60));

  /* B12 — the floor-collapse hazard, promoted from a battery bug to a gate.
     fmtG renders anything under 1e-14 as the constant '< 1e-14'. For a
     certificate whose true value is under that floor everywhere in the
     reachable slider box, the readout is a constant: it cannot distinguish a
     real computation from a hardcoded string, which is the definition of an
     unfalsifiable certificate. This is not hypothetical -- it is how mutant
     m1 escaped. Report which readouts are in that state so the display can be
     fixed (show more digits, or state the bound is below display resolution)
     rather than silently reassuring the reader. */
  (() => {
    const probe = [
      { sol: 0.60, pk: 0.20, phi: 0.0, EHYD: 2.0, PMIN: 0.02, PMAX: 1.5 },
      { sol: 1.25, pk: 0.50, phi: 1.0, EHYD: 3.2, PMIN: 0.05, PMAX: 3.0 },
      { sol: 1.80, pk: 0.80, phi: 2.0, EHYD: 5.0, PMIN: 0.30, PMAX: 4.0 }
    ];
    const seen = { roMass: new Set(), roClear: new Set(), roBand: new Set() };
    for (const c of probe) {
      getEl('pSol').value = String(c.sol); getEl('pPk').value = String(c.pk);
      getEl('pPhi').value = String(c.phi); getEl('pEh').value = String(c.EHYD);
      getEl('pFl').value = String(c.PMIN); getEl('pCp').value = String(c.PMAX);
      g.__sin.solveSync(false);
      for (const id in seen) seen[id].add(txt(id));
    }
    for (const id in RANGE_DEFAULTS) getEl(id).value = RANGE_DEFAULTS[id];
    g.__sin.solveSync(true);
    const constant = Object.entries(seen)
      .filter(([, s]) => s.size === 1 && [...s][0].indexOf('< 1e-14') === 0)
      .map(([id]) => id);
    check('B12 no certificate renders as a constant floored string across the slider box',
      constant.length === 0,
      constant.length
        ? constant.join(', ') + ' show "< 1e-14" at every corner — a hardcoded string is indistinguishable from the real computation'
        : 'all readouts carry falsifiable digits');
  })();

  if (stalled.length) {
    const s0 = stalled[0].c;
    getEl('pSol').value = String(s0.sol); getEl('pPk').value = String(s0.pk);
    getEl('pPhi').value = String(s0.phi); getEl('pEh').value = String(s0.EHYD);
    getEl('pFl').value = String(s0.PMIN); getEl('pCp').value = String(s0.PMAX);
    const bad = g.__sin.solveSync(false);
    check('B10 a non-converging corner is reported as a stall, not as an equilibrium',
      bad.conv === false && /stalled honestly/.test(txt('status')) && !/converged/.test(txt('status')),
      txt('status').slice(0, 70));
    /* restore */
    for (const id in RANGE_DEFAULTS) getEl(id).value = RANGE_DEFAULTS[id];
    g.__sin.solveSync(true);
  } else {
    note('B10 SKIPPED: no stalling corner found in the sweep, so honest-stall messaging is UNEXERCISED.');
  }

  /* B11 — the reporting half of the A16 defect, and the one that matters most
     to the house thesis. finish() and solveSync gate the word "converged" on
     S.res < 1e-10, the PICARD residual alone. They never consult the
     structural certificates. So at a bracket-saturating corner the page
     announces "converged" and "every residual below is computed before the
     update it judges" while displaying a hydro-budget miss of 1e-1, a
     complementarity violation of 3e-1, a water value that is really the
     bisection's bracket ceiling, and only ONE self-flagging readout
     (roDual = VIOLATED). A verdict must not outrank its own certificates. */
  /* The gate itself must exist even when no corner currently trips it.
     A check that silently skips is a fake pass — B11 below only runs if the
     sweep found a violating corner, so assert the MECHANISM unconditionally:
     solveSync must report the structural audit, and "converged" must require
     it. (B11 has been proven to bite: reverting the clearSlice branch order
     makes it fire.) */
  check('B11a the convergence verdict is gated on the structural audit, not the Picard residual alone',
    out.certOK === true && Array.isArray(out.violations) &&
    typeof out.picardOK === 'boolean' && out.conv === (out.picardOK && out.certOK),
    'conv=' + out.conv + ' picardOK=' + out.picardOK + ' certOK=' + out.certOK +
    ' violations=' + (out.violations ? out.violations.length : 'ABSENT'));

  if (SATURATED.length) {
    const s0 = SATURATED[0].c;
    getEl('pSol').value = String(s0.sol); getEl('pPk').value = String(s0.pk);
    getEl('pPhi').value = String(s0.phi); getEl('pEh').value = String(s0.EHYD);
    getEl('pFl').value = String(s0.PMIN); getEl('pCp').value = String(s0.PMAX);
    g.__sin.solveSync(false);
    const violated = [];
    if (Math.abs(num(txt('roBud'))) > 1e-6) violated.push('hydro budget ' + txt('roBud'));
    if (Math.abs(num(txt('roComp'))) > 1e-6) violated.push('complementarity ' + txt('roComp'));
    if (/VIOLATED/.test(txt('roDual'))) violated.push('w dual feasibility VIOLATED');
    check('B11 the page does not announce "converged" while structural certificates are violated',
      !(violated.length && /converged/.test(txt('status'))),
      violated.length
        ? 'status "' + txt('status').slice(0, 34) + '" alongside: ' + violated.join(' · ')
        : 'no violated certificates at this corner');
    for (const id in RANGE_DEFAULTS) getEl(id).value = RANGE_DEFAULTS[id];
    g.__sin.solveSync(true);
  }
}

/* ================================================================
   3 · SUMMARY
   ================================================================ */
console.log('\n' + '='.repeat(64));
if (fails.length) {
  console.log(fails.length + ' FAILURE(S):');
  fails.forEach(f => console.log('  - ' + f));
} else {
  console.log('ALL PASS');
}
process.exit(fails.length ? 1 : 0);
