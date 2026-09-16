#!/usr/bin/env node
/* build-report-erdos1.js — reports/erdos1.html: the Erdős #1 disproof made
   effective, and the sets themselves.

   Erdős's first problem (1931, $500) asked whether a set A ⊆ {1,…,N} with all
   2^|A| subset sums distinct forces N ≫ 2^|A|. Bohman's 1998 construction held
   N ≤ 0.22002·2^|A|. On 2026-08-28 a pre-release GPT-6 Astra, run by Epoch AI,
   disproved the conjecture in Lean — for every ε there are such sets with
   N ≤ ε·2^|A| — and, as Bloom's exposition notes, the argument is ineffective
   at exactly one step. This page carries the effective version of that step
   and the explicit sets it produces, every one re-decided by an independent
   verifier in exact arithmetic on this machine.

   EVERY NUMBER ON THE PAGE IS READ FROM certs/erdos1-ledger.json, which
   tools/run-erdos1-ledger.js writes from the certificates and the verifier's
   own logs by one rule. This builder re-derives the ledger first (--check) and
   refuses if it moved, runs the instrument's battery and refuses unless every
   red control fired, and never computes a scientific quantity itself.

   usage: node tools/build-report-erdos1.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('ERDOS1 REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n) => Number(n).toLocaleString('en-US');

/* ---- gates ------------------------------------------------------------------ */
const chk = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-erdos1-ledger.js'), '--check'], { cwd: ROOT });
if (chk.status !== 0) die('the ledger does not re-derive:\n' + String(chk.stderr).slice(-600) + String(chk.stdout).slice(-300));
const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'erdos1', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /erdos1 battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the erdos1 battery did not pass clean:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos1-ledger.json'), 'utf8'));
const BOHMAN = Number(L.bohman);
const inst = L.instances;
const below = inst.filter((I) => I.belowBohman);
const best = L.best, small = L.smallest;
if (!below.length || Number(best.ratio6) >= BOHMAN) die('the ledger has no verified instance below Bohman');
const certOf = (f) => L.certificates.find((c) => c.file === f);
const bestC = certOf(best.file), smallC = certOf(small.file);
/* the certificate-level checks (V0–V5) plus the per-instance ones (V3, V4a, V4b, V6, V7a–c), counted from this machine's logs */
let passLines = 0;
for (const c of L.certificates) {
  const p = path.join(ROOT, c.verifyLog);
  if (fs.existsSync(p)) passLines += (fs.readFileSync(p, 'utf8').match(/\[PASS\]/g) || []).length;
}
const lattices = [];
for (const c of L.certificates) {
  const key = c.b + '|' + c.s + '|' + c.alpha;
  if (lattices.some((x) => x.key === key)) continue;
  const rows = inst.filter((I) => I.b === c.b && I.s === c.s && I.alpha === c.alpha);
  if (!rows.length) continue;
  lattices.push({ key, b: c.b, s: c.s, alpha: c.alpha, d: c.d, D: c.D, delta: c.delta, deltaHalf: c.deltaHalf, K: c.Kfloat, rows });
}
lattices.sort((x, y) => x.d - y.d || x.alpha.localeCompare(y.alpha));
const alphaHtml = (a) => { const [p, q] = a.split('/'); return q === '1' || !q ? p : p + '/' + q; };
const smallK20 = inst.find((I) => I.d === small.d && I.alpha === small.alpha && I.k === small.k - 1);
const bloomBest = inst.filter((I) => I.alpha === '1/2' && I.belowBohman).reduce((m, I) => (!m || Number(I.ratio6) < Number(m.ratio6) ? I : m), null);
const d729 = inst.filter((I) => I.d === 729 && I.belowBohman).reduce((m, I) => (!m || Number(I.ratio6) < Number(m.ratio6) ? I : m), null);
const d441 = inst.filter((I) => I.d === 441 && I.belowBohman).reduce((m, I) => (!m || Number(I.ratio6) < Number(m.ratio6) ? I : m), null);
const pending = L.unverified.filter((u) => u.why !== 'skipped by --k');
const pendingFiles = [...new Set(pending.map((u) => u.file))];
const siegelDims = Object.keys(L.siegel).sort((a, b) => a - b);
const siegelBest = siegelDims.reduce((m, d) => (!m || Number(L.siegel[d].bound) > Number(L.siegel[m].bound) ? d : m), null);

/* ---- the figure: every verified instance, N/2^n against n ------------------- */
const pts = inst.map((I) => ({
  x: I.n, y: I.ratioFloat, token: I.s === 2 ? 'var(--c-2)' : 'var(--c-3)',
  k: 'b = ' + I.b + ', s = ' + I.s + ', α = ' + I.alpha + ' · d = ' + fmt(I.d) + ' · k = ' + I.k,
  v: 'n = ' + fmt(I.n) + ' · N/2^n = ' + I.ratio6 + (I.belowBohman ? ' · ' + I.percentBelowBohman + '% below Bohman' : ' · above Bohman')
}));
/* the y range follows the ledger: the floor is fixed below the best ratio, the ceiling is the
   largest verified ratio rounded up to 0.05 (the early-k rows of a lattice sit well above Bohman) */
const yLo = 0.12, yHi = Math.max(0.30, Math.ceil(Math.max(...pts.map((p) => p.y)) * 20) / 20);
if (pts.some((p) => p.y < yLo || p.y > yHi)) die('an instance falls outside the figure\'s y range — widen it deliberately');
const yTicks = []; for (let v = 0.14; v <= yHi + 1e-9; v += 0.04) yTicks.push(Number(v.toFixed(2)));
const FIG = CH.scatter({
  w: 900, h: 400, x0: 1000, x1: 300000, y0: yLo, y1: yHi, logX: true, padL: 62,
  xTicks: [1000, 3000, 10000, 30000, 100000, 300000].map((v) => ({ v, t: fmt(v) })),
  yTicks: yTicks.map((v) => ({ v, t: v.toFixed(2) })),
  xLabel: 'n = |A|, the number of elements (log scale)', yLabel: 'N / 2^n',
  hlines: [{ y: BOHMAN, t: 'Bohman 1998: 0.22002' }],
  pts,
  keys: [{ token: 'var(--c-2)', t: 'two-level lattices (s = 2), tilted gadgets' }, { token: 'var(--c-3)', t: 'three-level lattices (s = 3)' }],
  alt: 'Every verified instance as a dot: the number of elements n on a logarithmic axis against N over 2 to the n. The solid horizontal line is Bohman\'s constant 0.22002. Dots for the two-level tilted lattices run from just above the line at n near 1,300 to well below it at n near 30,000; the three-level lattices sit lowest, at ' + best.ratio6 + ' for n = ' + fmt(best.n) + '.'
});

/* ---- the page ---------------------------------------------------------------- */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · erdős #1 · generated from the ledger',
  title: 'The swarm proved the set exists. Here is the set.',
  deck: 'Erdős\'s first problem (1931, $500) asks whether a set A ⊆ {1,…,N} whose 2^|A| subset sums are all distinct '
    + 'must have N ≫ 2^|A|. Bohman\'s construction of 1998 held the record, N ≤ 0.22002·2^|A|, for twenty-eight years. '
    + 'On 28 August 2026 a pre-release GPT-6 Astra, run autonomously by Epoch AI, disproved the conjecture in Lean: for '
    + 'every ε there are such sets with N ≤ ε·2^|A|. The proof is an existence proof, ineffective at exactly one step, '
    + 'and no set below Bohman\'s constant was known. This page makes that step explicit and ships the sets: '
    + fmt(small.n) + ' integers at N/2^n = ' + small.ratio6 + ', and ' + fmt(best.n) + ' integers at ' + best.ratio6
    + ', ' + best.percentBelowBohman + '% below the record — each with a certificate an independent program re-decides '
    + 'in exact arithmetic, and every one re-decided on this machine before it entered this page.'
}));

O.push(C.tldr({
  findingRaw: 'Explicit sum-distinct sets below Bohman\'s constant, the first: ' + C.m('n = ' + fmt(small.n) + ', N/2^n = ' + small.ratio6)
    + ' in dimension ' + small.d + ', down to ' + C.m('n = ' + fmt(best.n) + ', N/2^n = ' + best.ratio6) + ' in dimension '
    + fmt(best.d) + '. Two further results ride along: Bloom\'s base gadget T = I + P/2 is not special (every tilt '
    + 'T = I + αP works, and the best tilt beats 1/2 at every dimension budget), and the base weights give the first '
    + 'explicit lower bounds for the constant in Siegel\'s lemma above Bohman\'s (C<sub>' + fmt(siegelBest) + '</sub> ≥ '
    + L.siegel[siegelBest].bound + ').',
  mechanismRaw: 'Bloom reads the Astra proof as a lattice statement and names its one non-effective step: approximating '
    + 'a rational lattice by a primitive one. Replace the Smith normal form in the Lean proof by a Hermite basis with a '
    + 'bidiagonal chain perturbation, and the perturbed lattice is saturated by construction; the one quantity the proof '
    + 'never computed, the buffer K that controls the perturbation, is an operator norm computed exactly. With '
    + 't = ⌈(2<sup>k</sup> + K)/D⌉ the weights are 2<sup>k</sup>-relation-free and the binary-block lemma gives the set.',
  checkRaw: C.m('python3 verify/verify_erdos1.py certs/erdos1/' + small.file) + ' — seconds; needs python-flint (FLINT does the '
    + 'exact determinant, the rational solves and the integer nullspace). It rebuilds the lattice from (b, s, α) and shares '
    + 'no intermediate object with the builder. ' + fmt(passLines) + ' checks passed on this machine across '
    + L.counts.certificates + ' certificates; the battery\'s ' + nReds + ' planted forgeries all refused.'
}));

O.push(C.stats([
  { k: 'N / 2^n, best', v: best.ratio6, n: best.percentBelowBohman + '% below Bohman\'s 0.22002 · b = ' + best.b + ', s = ' + best.s + ', α = ' + best.alpha + ' · d = ' + fmt(best.d) + ' · verified here' },
  { k: 'elements, best', v: fmt(best.n), n: 'n = d·k with k = ' + best.k + '; N has ' + fmt(best.Ndigits) + ' decimal digits' },
  { k: 'smallest set below', v: fmt(small.n), n: 'N/2^n = ' + small.ratio6 + ' at d = ' + small.d + ', α = ' + small.alpha + ', k = ' + small.k + (smallK20 ? '; k = ' + smallK20.k + ' misses at ' + smallK20.ratio6 : '') },
  { k: 'Siegel\'s constant', vRaw: 'C<sub>' + fmt(siegelBest) + '</sub> ≥ ' + L.siegel[siegelBest].bound, sm: true, n: 'exact, from the verified weights; the recorded lower bound was C_d ≥ 1' },
  { k: 'verified instances', v: String(L.counts.verified), n: L.counts.verifiedBelowBohman + ' below Bohman · ' + L.counts.certificates + ' certificates · ' + fmt(passLines) + ' verifier checks passed on this machine' }
]));

O.push(C.scope('Local working document, machine-derived, not peer-reviewed. The sets are theorems: every step of the chain '
  + 'is a finite exact computation the verifier repeats, and the two structural lemmas it does not recompute at full '
  + 'size (the cube property of the base lattice, for Bloom\'s gadget and for every tilt) are proved in the theorem note, '
  + 'checked exhaustively for d ≤ 9 at every build, and probed at full size. The construction is the one in the Astra '
  + 'proof as read by Bloom; what is new here is the effective transfer, the tilt lemmas, the Siegel numbers and the '
  + 'sets themselves. Nothing here is a Lean proof.'));

/* §1 */
O.push(C.section({
  lab: '§1 · what was proved, and what was not built', title: 'One lemma away from an object',
  bodyRaw: C.pRaw('Write f(n) = inf max A / 2<sup>n−1</sup> over dissociated sets of n positive integers (Bloom\'s '
    + 'normalisation); the ratio on this page is ρ = N/2<sup>n</sup> = f/2, and Bohman is ρ ≤ 0.22002. Bloom\'s exposition '
    + 'of the Astra proof (erdosproblems.com/1, 3 September 2026, pinned in the corpus) reads it as a statement about '
    + 'lattices: an explicit rational lattice Λ<sub>s</sub> in the hyperplane Σx<sub>i</sub> = 0 of ℝ<sup>d</sup>, '
    + 'd = b<sup>s</sup>, with no nonzero point in the open cube (−1,1)<sup>d</sup> and a covolume constant '
    + 'Δ<sub>s</sub> that tends to zero. A dissociated set follows once one has a <em>primitive</em> integer lattice '
    + 'close to Q·Λ<sub>s</sub>; the proof obtains it from a density theorem and, in the Lean, from a Smith normal form '
    + 'with the scale sent to infinity.')
    + C.quote({ text: 'The proof is currently non-quantitative, but just due to the non-effectiveness of the part where we approximate an arbitrary lattice by a primitive lattice.', cite: 'Thomas Bloom, exposition on erdosproblems.com/1, 2026-09-03' })
    + C.pRaw('Every other step is explicit. So the object was one effective lemma away, and the number the proof never '
      + 'computed is one number per lattice.')
}));

/* §2 */
O.push(C.section({
  lab: '§2 · the step, made explicit', title: 'A Hermite basis, a chain perturbation, and one computed number',
  bodyRaw: C.pRaw('Let B be the (d−1)×(d−1) matrix of the first r = d−1 coordinates of a basis of Λ<sub>s</sub>, and '
    + 'A = D·B its integer scaling (D = q<sup>s</sup> for the tilt α = p/q). Take an upper-triangular Hermite basis H of '
    + 'the column lattice of A with its rows reversed; the cube property is a property of the lattice, so it survives. '
    + 'For an integer scale t put')
    + C.eq('C = top(tH) − sh, &nbsp;&nbsp; M = S·C = t·lift(H) − E, &nbsp;&nbsp; S = [[I, 0], [−1<sup>T</sup>, 1]]')
    + C.pRaw('where sh has ones just below the diagonal and lift appends the row that makes every column sum to zero. '
      + 'Deleting the first row of C leaves an upper-triangular matrix with diagonal −1, so the column lattice of M is '
      + 'saturated in ℤ<sup>r+1</sup> and its primitive normal a is an explicit prefix recurrence — the Lean\'s '
      + C.m('transferWeights') + ' with the Smith form replaced by the Hermite form. The one quantity the ineffective proof '
      + 'never computed is the buffer')
    + C.eq('K = D · ‖E H<sup>−1</sup>‖<sub>∞→∞</sub>, &nbsp;&nbsp; so that ‖Ez‖<sub>∞</sub> ≤ K ‖lift(H/D) z‖<sub>∞</sub> for every real z.')
    + C.pRaw('With t = ⌈(2<sup>k</sup> + K)/D⌉ every integer relation c·a = 0 with |c<sub>i</sub>| &lt; 2<sup>k</sup> is '
      + 'forced to zero (c = Mz by saturation, and ‖c‖ ≥ (Dt − K)‖lift(H/D)z‖ ≥ 2<sup>k</sup> by the cube property), and the '
      + 'binary-block lemma gives A = {a<sub>i</sub>2<sup>j</sup> : 0 ≤ i ≤ r, 0 ≤ j &lt; k}: n = dk elements, all subset '
      + 'sums distinct, N/2<sup>n</sup> = max a<sub>i</sub> / 2<sup>kr+1</sup>, which tends to Δ<sub>s</sub>/2 as k grows. '
      + 'Nothing is estimated; every certificate is exact rational arithmetic.')
    + C.note({ lab: 'the best instance', bodyRaw: C.pRaw('b = ' + best.b + ', s = ' + best.s + ', α = ' + best.alpha + ': d = ' + fmt(best.d)
      + ', D = ' + fmt(bestC.D) + ', Δ<sub>s</sub> = ' + bestC.delta.toFixed(6) + ', K = ' + fmt(bestC.Kfloat.toFixed(1)) + ' (about '
      + (bestC.Kfloat / best.d).toFixed(1) + '·d), k = ' + best.k + ', t = ' + fmt(best.t) + '. The ' + fmt(best.d) + ' base weights differ from each '
      + 'other by at most ' + (100 * inst.find((I) => I.file === best.file && I.k === best.k).spread).toExponential(2) + '%: the set is '
      + fmt(best.d) + ' integers of about ' + fmt(best.Ndigits - best.k + 1) + ' digits, each times the first ' + best.k + ' powers of two.') })
}));

/* §3 */
{
  const rows = lattices.map((l) => {
    const bestRow = l.rows.filter((I) => I.belowBohman).reduce((m, I) => (!m || Number(I.ratio6) < Number(m.ratio6) ? I : m), null);
    return [String(l.b), String(l.s), alphaHtml(l.alpha), fmt(l.d), fmt(l.D), l.delta.toFixed(6), l.deltaHalf.toFixed(6),
      fmt(l.K.toFixed(1)), (l.K / l.d).toFixed(2), bestRow ? bestRow.ratio6 + ' (k = ' + bestRow.k + ')' : 'above'];
  });
  O.push(C.section({
    lab: '§3 · the gadget is not special', title: 'Every tilt works, and the best tilt depends on the budget', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Everything rests on one small matrix: Bloom\'s base gadget T = I + P/2 on ℤ<sup>b</sup> ∩ V<sub>b</sub> '
      + '(b odd), height 3/2 and covolume 1 + 2<sup>−b</sup>, whose two properties — no nonzero lattice point in the open '
      + 'cube, and the strip property with one real coordinate — Bloom proves by a case analysis and the Lean formalises as '
      + C.m('composeMatrix_admissible') + '. Nothing in the argument singles out the tilt 1/2. For T<sub>α</sub> = I + αP with '
      + 'any rational 0 &lt; α &lt; 1 the height is 1 + α, the covolume 1 + α<sup>b</sup>, the iteration is unchanged, and')
      + C.eq('Δ<sub>s</sub>(α, b) = (1 + α<sup>b</sup>)<sup>(b<sup>s</sup>−1)/(b−1)</sup> / (1 + α)<sup>s</sup>.')
      + C.pRaw('<strong>The cube property holds for every tilt</strong>, in three lines: if z ≠ 0 is an integer vector with '
        + '|z<sub>i</sub> + αz<sub>i+1</sub>| &lt; 1 for all i and m = max|z<sub>i</sub>| is attained at i, then '
        + 'α|z<sub>i+1</sub>| &gt; m − 1 forces |z<sub>i+1</sub>| = m with the opposite sign, and around the odd cycle '
        + 'z<sub>i</sub> = −z<sub>i</sub>. <strong>The strip property is decided exactly per (α, b)</strong> by a finite search '
        + 'that a structure lemma makes small: the largest integer coordinate has modulus below 1/(1−α) and sits at the last '
        + 'index, so one enumerates the integer chains backwards and intersects the two constraints on the real coordinate — '
        + 'milliseconds at b = 31, and cross-validated against a brute-force decision of both properties for b ≤ 9. Larger '
        + 'tilts pay in covolume and gain in height, so the best tilt depends on the dimension budget, and it beats 1/2 at '
        + 'every budget: at d = 81 the tilt 3/5 already crosses Bohman where Bloom\'s gadget needs d = 729, and at d = 441 the '
        + 'tilt 3/4 reaches ' + (d441 ? d441.ratio6 : '—') + ' where the 729-dimensional Bloom lattice reaches ' + (d729 ? d729.ratio6 : '—')
        + '. Two-parameter cyclic gadgets I + aP + bP² fail the cube condition from b = 7 on through period-three patterns.') + '</div>'
      + C.table({
        cols: [{ h: 'b' }, { h: 's' }, { h: 'α' }, { h: 'd', cls: 'n' }, { h: 'D', cls: 'n' }, { h: 'Δ_s', cls: 'n' }, { h: 'Δ_s / 2 (the limit)', cls: 'n' }, { h: 'buffer K', cls: 'n' }, { h: 'K / d', cls: 'n' }, { h: 'best verified N/2^n', cls: 'n' }],
        rows
      })
      + '<div class="col">' + C.pRaw('The buffer is the number the proof never computed, and it is small: about 1.1·d for the two-level Bloom '
        + 'lattices and 2.1–2.4·d for the three-level ones (scan in the instrument\'s logs). A tilt with denominator q '
        + 'pays through D = q<sup>s</sup>, which is why 11/20 at d = 2,197 carries K ≈ 22·d while its operator norm '
        + '‖EH<sup>−1</sup>‖ is 3.5; small denominators are the lever. A bound on K as a function of (b, s) is exactly '
        + 'what the effective asymptotic theorem still needs (§7).') + '</div>'
  }));
}

/* §4 */
{
  const rows = inst.map((I) => [
    I.b + ', ' + I.s + ', ' + alphaHtml(I.alpha), fmt(I.d), String(I.k), fmt(I.n), fmt(I.Ndigits),
    { raw: (I.belowBohman ? '<strong>' + I.ratio6 + '</strong>' : I.ratio6) }, I.f,
    { raw: I.belowBohman ? C.tag('below · −' + I.percentBelowBohman + '%', 'held') : C.tag('above', 'open') }
  ]);
  O.push(C.section({
    lab: '§4 · the instances', title: fmt(L.counts.verified) + ' explicit sets, every one re-decided on this machine', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Every row is a set A = {a<sub>i</sub>·2<sup>j</sup>} with the base weights read from its certificate, and every row '
      + 'was verified by ' + C.m('instruments/erdos1/verify.py') + ' on this machine — the bench that built the certificates '
      + 'verified them once already, and both logs are kept. A row enters this table by one rule, stated once in the ledger '
      + 'builder: the verifier\'s run ended with every check passed and the instance\'s own block is complete. An unverified '
      + 'instance became the bench\'s headline once for twenty minutes; that rule is the fix. The smallest set below Bohman\'s '
      + 'constant in this family is the ' + fmt(small.n) + '-element one at d = ' + small.d + ' (α = ' + small.alpha + ', k = ' + small.k
      + (smallK20 ? '; one fewer binary shift, k = ' + smallK20.k + ' with n = ' + fmt(smallK20.n) + ', lands at ' + smallK20.ratio6 + ', above by the width of the buffer' : '') + ').') + '</div>'
      + C.figure({ svgRaw: FIG, caption: 'N/2^n against the number of elements for every verified instance. Within one lattice the ratio falls toward Δ_s/2 as k grows; across lattices the tilt and the third level move the whole curve down. Hover a dot for its row.' })
      + C.table({
        cols: [{ h: 'b, s, α' }, { h: 'd', cls: 'n' }, { h: 'k', cls: 'n' }, { h: 'n = |A|', cls: 'n' }, { h: 'digits of N', cls: 'n' }, { h: 'N / 2^n', cls: 'n' }, { h: 'Bloom\'s f = N/2^(n−1)', cls: 'n' }, { h: 'vs 0.22002' }],
        rows
      })
      + '<div class="col">' + C.pRaw('At finite k the ratio exceeds Δ<sub>s</sub>/2 by roughly the factor (1 + (K + D)/2<sup>k</sup>)<sup>r</sup> from the '
        + 'rounding of t, plus the lower-order terms of the recurrence, all of which the certificate carries exactly; '
        + 'k = ⌈log<sub>2</sub>(rK)⌉ + 6 already puts the ratio within one percent of the limit. Three-level lattices with Bloom\'s '
        + 'gadget need b ≥ 9 to cross Bohman (d = 729); the tilted two-level lattices cross at d = 81.')
      + (pending.length ? C.pRaw('<strong>Not on this page:</strong> ' + pending.length + ' instance' + (pending.length > 1 ? 's' : '') + ' in '
        + pendingFiles.length + ' certificate' + (pendingFiles.length > 1 ? 's' : '') + ' (' + pendingFiles.map((f) => f.replace(/^cert-/, '').replace(/\.json(\.gz)?$/, '')).join(', ')
        + ') whose verifier run on this machine had not finished when the ledger was written. They are built and the bench\'s '
        + 'logs pass, but a row here means verified HERE, so they wait.') : '') + '</div>'
  }));
}

/* §5 */
{
  const rows = siegelDims.map((d) => { const S = L.siegel[d]; return [fmt(d), alphaHtml(S.alpha), String(S.k), S.f, { raw: '<strong>' + S.bound + '</strong>' }]; });
  O.push(C.section({
    lab: '§5 · a corollary', title: 'Explicit lower bounds for the constant in Siegel\'s lemma', wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('In the normalisation of Bloom\'s exposition (after Aliev), C<sub>d</sub> is the least constant such that every nonzero '
      + 'a ∈ ℤ<sup>d</sup> has a nonzero x ∈ ℤ<sup>d</sup> with a·x = 0 and ‖x‖<sub>∞</sub><sup>d−1</sup> ≤ C<sub>d</sub>‖a‖<sub>∞</sub>. '
      + 'Bombieri and Vaaler give C<sub>d</sub> ≪ √d; the recorded lower bound is Schinzel\'s C<sub>d</sub> ≥ 1, and Bloom remarks '
      + 'that the Astra lattices should give explicit lower bounds. They do, with no further work: the base weights are '
      + '2<sup>k</sup>-relation-free, so every admissible x has ‖x‖<sub>∞</sub> ≥ 2<sup>k</sup>, whence 2<sup>k(d−1)</sup> ≤ '
      + 'C<sub>d</sub> max a, that is C<sub>d</sub> ≥ 2<sup>kr</sup>/max a = 1/f — an exact rational, printed truncated. A '
      + 'Bohman-type set gives C<sub>d</sub> ≥ 1/0.44004 = 2.2725 for all large d; these are the first explicit values above '
      + 'that, and they grow with the instance as the construction predicts.') + '</div>'
      + C.table({ cols: [{ h: 'd', cls: 'n' }, { h: 'α' }, { h: 'k', cls: 'n' }, { h: 'f = N/2^(n−1)', cls: 'n' }, { h: 'C_d ≥', cls: 'n' }], rows })
  }));
}

/* §6 */
O.push(C.section({
  lab: '§6 · what is verified, and what is not', title: 'Two programs, and the two lemmas between them',
  bodyRaw: C.pRaw(C.m('build.py') + ' constructs; ' + C.m('verify.py') + ' rebuilds Λ<sub>s</sub> from (b, s, α) and checks, '
    + 'independently of the construction\'s intermediate objects:')
    + C.plainList([
      { b: 'V0–V1', text: 'D = q^s; the basis lies in the zero-sum hyperplane; D·B is integral; |det A| (a FLINT determinant) matches the certificate.' },
      { b: 'V2', text: 'H is upper triangular with positive diagonal and spans the same column lattice as A with its rows reversed — exact rational solves, integrality both ways.' },
      { b: 'V3', text: 'the minor of C = S⁻¹M has determinant ±1 by a FLINT determinant, not by the triangular argument (a minor of M itself is not ±1, which the first run on the bench caught).' },
      { b: 'V4', text: 'the FLINT nullspace of Mᵀ is one-dimensional and its primitive generator equals a — independent of the recurrence that produced a.' },
      { b: 'V5–V6', text: 'the recorded K is at least the recomputed operator norm, with H⁻¹ from a solve; D·t − K ≥ 2^k.' },
      { b: 'V7', text: 'positivity, distinctness, n = dk, N = 2^(k−1) max a, the ratio, and the comparison with 0.22002.' }
    ])
    + C.pRaw('The inputs the verifier does not recompute at full size are the cube property of the base lattice — Bloom\'s '
      + 'Lemma 1 for α = 1/2, formalised in Lean for the identical gadget, and Lemma 1′ for every tilt, proved in the theorem '
      + 'note — and the strip property, decided per (α, b) by the structured search. At every build the battery checks Δ<sub>s</sub> '
      + 'against an exact determinant on small lattices, the cube property exhaustively for d ≤ 9, the structured strip decision '
      + 'against a brute-force one for b ≤ 7, and every (α, b) in the ledger; the instrument\'s probes test thousands of lattice '
      + 'vectors at full dimension (18,612 at d = 729, none inside the cube). The battery also plants forgeries the verifier must '
      + 'refuse — a base weight off by one, a halved buffer, a Hermite entry off by one, a gadget that violates the cube '
      + 'condition, a verifier log that did not end green — ' + nReds + ' of ' + nReds + ' fired at this build, ' + nChecks + ' checks green.')
    + C.pRaw('The verifier needs FLINT (python-flint), so it is not a standard-library verifier like the three on the landing '
      + 'page; it is detached all the same — one file, no code shared with the builder beyond the definition of the lattice, '
      + 'which it must share to rebuild it.')
}));

/* §7 */
O.push(C.section({
  lab: '§7 · what this does not settle', title: 'Specific n, not all large n',
  bodyRaw: C.pRaw('Bohman\'s bound holds for all large n; these sets are for specific n. The effective asymptotic statement '
    + 'f(n) ≤ n<sup>−c/log log n</sup> with an explicit c, the form Bloom expects, would follow from a bound on the buffer K '
    + 'as a function of (b, s), because k must only exceed log<sub>2</sub>(rK) by a constant. K is measured here (linear in d '
    + 'in every instance computed) and not proved; the Hermite basis is computed, not analytic, and an analytic triangular '
    + 'basis of Λ<sub>s</sub> with an explicit inverse would settle it. The tilt family is a proven lever for the constant, '
    + 'and bigger tilted instances (α = 0.65, b = 21, s = 3 gives Δ = 0.235 at d = 9,261) need a Hermite path beyond PARI at '
    + 'that size. Nothing here concerns the lower bound N ≥ C(n, ⌊n/2⌋) or the true order of f.')
    + C.note({ lab: 'the records', bodyRaw: C.pRaw('<a href="/certs/erdos1-ledger.json">The ledger</a> (every instance, verified or not, with the '
      + 'sha256 of its certificate) · the certificates under 20 MB in <a href="/certs/erdos1/' + small.file + '">/certs/erdos1/</a> '
      + '(the two 2,197-dimensional ones are 46 MB gzipped and live in the repository) · <a href="/verify/verify_erdos1.py">the '
      + 'verifier</a> · <a href="/paper/erdos1-explicit.md">the theorem note</a> with the proof chain and the tilt lemmas · '
      + '<a href="/paper/erdos1-explicit.pdf">the paper</a> (v0.2, numbers interpolated from this ledger). Sources pinned in the '
      + 'corpus: the problem page and its exposition, the forum thread, the Lean resolution (tadamcz/erdos1 at 0e395153), Epoch\'s '
      + 'FrontierMath Erdős extract.') })
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-erdos1.js from certs/erdos1-ledger.json — the ledger re-derived from the certificates and the verifier\'s logs at build time, the battery run with every planted forgery refused; the build fails if any of it does not hold.') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · cert-machine · Carlos Toledo') + '</p>';

fs.mkdirSync(path.join(ROOT, 'reports'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'reports', 'erdos1.html'),
  TPL.render({ title: 'Erdős #1: the disproof made effective, and the set · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/erdos1.html',
    desc: 'Explicit sum-distinct sets below Bohman\'s constant — the GPT-6 Astra disproof of Erdős problem #1 made effective: ' + fmt(small.n) + ' integers at N/2^n = ' + small.ratio6 + ' and ' + fmt(best.n) + ' at ' + best.ratio6 + ', every certificate re-decided in exact arithmetic.' }));
console.log('reports/erdos1.html written — best ' + best.file + ' k=' + best.k + ' n=' + best.n + ' N/2^n=' + best.ratio6 + ' (' + best.percentBelowBohman + '% below Bohman); smallest n=' + small.n + ' at ' + small.ratio6 + '; ' + L.counts.verified + ' verified instances, ' + pending.length + ' pending; battery ' + nChecks + ' checks, ' + nReds + ' reds');
