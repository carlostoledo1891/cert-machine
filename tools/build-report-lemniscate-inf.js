#!/usr/bin/env node
/* build-report-lemniscate-inf.js — reports/erdos1038-inf.html.

   Erdős #1038 has THREE claimed full proofs, all AI-assisted, all landing on
   the same constant, and the forum hosting them says in its own words that
   nobody associated with the site has examined any part of them. This page
   does not adjudicate any of them. It reports what is true without them: a
   certified bracket on the infimum, both ends unconditional, plus Tao's model
   Problem 4.1 answered affirmatively for every ε.

   Gates at build: the record is rebuilt live (tools/run-lemniscate.js re-runs
   T1-T3 and re-verifies the T4 record with the independent verifier), the
   battery must pass with every red control firing, the bracket must be
   ordered, and THE FENCE must be present by name — a page that drops any
   claimant, or the forum's caveat, or our own analytic-core limitation, does
   not build.

   usage: node tools/build-report-lemniscate-inf.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('ERDOS1038-INF REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: rebuild the record live ---- */
const r0 = cp.spawnSync('node', [path.join(ROOT, 'tools', 'run-lemniscate.js')], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
if (r0.status !== 0) die('the lemniscate program failed:\n' + (String(r0.stdout) + String(r0.stderr)).slice(-700));

/* ---- gate 2: the battery, every red fired ---- */
const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'lemniscate', 'battery.js')], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /lemniscate battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the lemniscate battery did not pass clean:\n' + bout.slice(-700));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'erdos1038-inf.json'), 'utf8'));
const T1 = R.theorems.T1_upper, T2 = R.theorems.T2_thread_duals;
const T3 = R.theorems.T3_family, T4 = R.theorems.T4_forcing;
if (typeof T4 === 'string') die('the forcing lower bound is not in the record — the page needs both ends');
if (!(R.bracket.lower < R.bracket.upper)) die('the bracket is not ordered');
const lo = R.bracket.lower, up = R.bracket.upper;
const D = '1.83443047576266171109';
/* external reference points, cited as recorded rather than derived here:
   the problem page's recorded bounds, and the best finite-atom lower bound
   recorded in the forum thread. The gap arithmetic is computed, not typed. */
const D_NUM = 1.83443047576266171109;
const PAGE_RECORDED_LO = 1.519, PAGE_RECORDED_UP = 1.835, THREAD_BEST = 1.814605;
const gapBefore = D_NUM - THREAD_BEST, gapNow = D_NUM - lo;
const gapClosedPct = (100 * (gapBefore - gapNow) / gapBefore).toFixed(0);
const aboveD = (up - D_NUM);
const fmt = (x) => x.toLocaleString('en-US');

/* ---- gate 3: THE FENCE, by name ---- */
for (const who of ['Darvas', 'Wang', 'Budala']) {
  if (!R.independence.includes(who)) die('the fence lost the claimant ' + who);
}
if (!/did not audit its analytic core/.test(R.independence)) die('the fence lost our own analytic-core limitation');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · erdős #1038 · the infimum side · every number rebuilt at this build',
  title: 'Three AI proofs of one Erdős problem. Nobody has checked any of them.',
  deck: 'Erdős–Herzog–Piranian asked in 1958 how small the set where a monic polynomial stays below 1 can be. '
    + 'Three separate AI-assisted full proofs of the answer are now claimed on the erdősproblems forum — and the '
    + 'forum states plainly that nobody associated with it has examined any part of them. This page adjudicates '
    + 'none of them. It reports what holds without them: a certified bracket, both ends unconditional.'
}));

B.push(C.tldr({
  findingRaw: '<strong>' + lo + ' ≤ inf ≤ ' + up + '</strong>, certified end to end in interval arithmetic. '
    + 'The lower end moves the best finite-atom bound recorded in the problem\'s forum thread — ' + THREAD_BEST
    + ' — up to ' + lo + ', <strong>closing about ' + gapClosedPct + '% of the remaining gap</strong> to the value '
    + 'the claimed proofs report; the problem page itself still records ' + PAGE_RECORDED_LO + '. It needs '
    + '<strong>no tail, no minimizer and no contradiction</strong> — it is pure forcing, one '
    + 'classical identity, ' + fmt(T4.summary.a0Boxes) + ' boxes. The upper end is an explicit measure, sharper '
    + 'than the ' + PAGE_RECORDED_UP + ' on the problem page and certified rather than numerical. Separately, '
    + '<strong>Tao\'s model Problem 4.1 is answered affirmatively for every ε ∈ (0, 0.1]</strong> — '
    + fmt(T3.onChunks.chunks) + ' certified ε-chunks plus a sliver lemma closing the singular limit. All three '
    + 'claimed proofs report the same constant D = ' + D + '…, which sits inside this bracket; that is '
    + 'corroboration, not confirmation, and this page assumes none of them.',
  mechanismRaw: 'For a probability measure μ on [−1,1] with potential U<sub>μ</sub>(x) = ∫log(1/|x−t|)dμ(t), the '
    + 'quantity is |{U<sub>μ</sub> &lt; 0}| = |{|f| &lt; 1}| under the root correspondence. The lower bound comes '
    + 'from a <em>finite-atom selector</em>: if a comb of unit-speed atoms has positive potential on supp μ while '
    + 'U<sub>μ</sub>(a₀) ≤ 0, one atom must lie in the set — so the set is at least as long as the comb\'s travel. '
    + 'Everything is outward-rounded interval arithmetic over the same certifier the ember and terra theorems use; '
    + 'no float participates in any decision.',
  checkRaw: C.m('node tools/run-lemniscate.js') + ' rebuilds every certificate; '
    + C.m('node instruments/lemniscate/battery.js') + ' — ' + nChecks + ' checks and ' + nReds + ' red controls, '
    + 'each a genuine source mutation that must make the certificate refuse. The forcing record is re-checked by '
    + C.m('verify-forcing.js') + ', which shares no code with the certifier and hunts counterexamples in doubles.'
}));

B.push(C.stats([
  { k: 'the bracket, unconditional', v: lo + ' ≤ inf ≤ ' + up.toFixed(7), role: 'held', n: 'both ends certified here; assumes no claimed proof' },
  { k: 'claimed full proofs', v: '3', role: 'open', n: 'Darvas–Peng–Tao · Shouqiao Wang · Cristian Budala — all AI-assisted, all reporting the same D, none examined by the forum' },
  { k: 'Tao Problem 4.1', v: 'YES, all ε', role: 'held', n: fmt(T3.onChunks.chunks) + ' certified chunks on [1e-12, 0.1] plus the sliver lemma on (0, 1e-12]' },
  { k: 'the lower bound costs', v: T4.summary.a0Boxes + ' boxes, ' + Math.round(T4.summary.secs) + ' s', role: 'held', n: 'no tail, no minimizer; worst certified margin ' + T4.summary.worstMargin.toExponential(3) },
  { k: 'thread duals certified', v: T2.results.length + ' of ' + T2.results.length, role: 'held', n: 'the community\'s posted measures, previously validated by sampling only' },
  { k: 'analytic cores audited', v: '0', role: 'open', n: 'ours is a bracket, not an adjudication — the claimed proofs\' analytic arguments are beyond this instrument and we say so' },
  { k: 'gap to the conjectured value', v: gapClosedPct + '% closed', role: 'held', n: 'the thread\'s best recorded finite-atom bound ' + THREAD_BEST + ' → ' + lo + ', against D = ' + D + '…' },
  { k: 'our upper bound vs D', v: '+' + aboveD.toExponential(2), role: 'held', n: 'an independent construction landing that far above the constant all three claimed proofs report — corroboration of the value, not of any proof of it' },
  { k: 'independent checks of the claims', v: '1 of 3, appendix only', role: 'open', n: 'to our knowledge the only independent verification of any part of any of the three claimed proofs: Appendix A of Darvas–Peng–Tao, re-derived by a different route' },
]));

B.push(C.section({
  lab: '§1 · the claim landscape', title: 'What is claimed, by whom, and what has actually been checked',
  wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'claim' }, { h: 'who, when' }, { h: 'AI used' }, { h: 'examined by anyone?' }, { h: 'checked here', cls: 'n' }],
    rows: [
      ['inf = D exactly', 'Darvas, Peng, Runzhou Tao — 2026-07-15', 'GPT-5.5 Pro (prover–verifier)', 'no', { raw: C.tag('APPENDIX CONFIRMED', 'cert') }],
      ['inf = D exactly', 'Shouqiao Wang', 'GPT-5.6 Sol', 'no', { raw: C.tag('NOT AUDITED', 'open') }],
      ['inf = D exactly', 'Cristian Budala — 2026-08-24', 'GPT-5.6 Sol', 'no', { raw: C.tag('NOT AUDITED', 'open') }],
      ['inf ≥ ' + lo, 'this page', 'none — interval arithmetic', 'certified + independently re-verified', { raw: C.tag('CERTIFIED', 'cert') }],
      ['inf ≤ ' + up, 'this page', 'none — interval arithmetic', 'certified', { raw: C.tag('CERTIFIED', 'cert') }],
    ]
  }) + '<div class="col">'
  + C.pRaw('The forum\'s own words, on the page that lists all three: appearing there '
    + '<em>"is no guarantee of proof correctness, and does not mean that anyone associated with this site has '
    + 'examined any part of the proof."</em> Three independent AI-assisted arguments agreeing on '
    + 'D&nbsp;=&nbsp;' + D + '… is genuine evidence about the number. It is not a proof anyone has read.')
  + C.pRaw('<strong>To our knowledge no independent verification of any part of any of the three has been '
    + 'published</strong> — the forum says as much, and we would be glad to be shown otherwise. This repository '
    + 'has done one such check, and it is narrower than it sounds: we '
    + '<a href="/reports/claim-lemniscate.html">re-verified the computational appendix</a> of the '
    + 'Darvas–Peng–Tao manuscript — the extremal triple exists, is unique in a certified box, and all thirty '
    + 'printed decimals of D are correct. That says nothing about the analytic core, which we did not audit and '
    + 'which is where a proof of this problem actually lives. It is, so far as we can establish, the only part of '
    + 'any of the three claims that anyone outside the authors has checked. The supremum side of the same problem is a '
    + 'separate program: <a href="/reports/erdos1038-sup.html">the certified per-degree theorems</a> on Tao\'s '
    + 'conjecture that sup = 2√2.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the bracket', title: 'Both ends, without assuming anybody',
  bodyRaw: C.table({
    cols: [{ h: 'end' }, { h: 'value', cls: 'n' }, { h: 'how' }, { h: 'cost', cls: 'n' }],
    rows: [
      ['lower', '≥ ' + lo, 'pure forcing: a comb of unit-speed atoms and the finite-atom selector; no tail, no minimizer, no contradiction', T4.summary.a0Boxes + ' a₀-boxes / ' + fmt(T4.summary.bBoxes) + ' b-boxes, ' + Math.round(T4.summary.secs) + ' s'],
      ['upper', '≤ ' + up, 'an explicit measure A·δ₋₁ + f dy on [a,1], its potential in closed form, the set structure from three one-line lemmas', 'seconds'],
      ['the gap', (up - lo).toFixed(6), 'the price of demanding positivity on all of [0,1] rather than on the minimizer\'s own support — a different family, not a finer run', '—'],
    ]
  }) + '<div class="col">'
  + C.pRaw('The lower bound is the part worth reading twice. It does not assume a minimizer exists, does not '
    + 'argue by contradiction, and needs no tail estimate: for every normalized measure, either the component '
    + 'containing (−√2, 0) already reaches the bound, or a certified comb of atoms forces enough of the set into '
    + 'disjoint windows that the total length does. The whole analytic input beyond interval arithmetic is one '
    + 'Fubini identity, ∫U<sub>ν</sub>dμ = ∫U<sub>μ</sub>dν.')
  + C.pRaw('Honest limit of the method: the same forcing at the conjectured optimum can only push the moving atom '
    + 'as far as x<sub>R</sub> ≈ 0.0263, so the ceiling of this route is exactly the upper bound above — the '
    + 'method is exact in principle. The comb family in particular is exhausted near ' + lo + '; its certified '
    + 'margin has already thinned to ' + T4.summary.worstMargin.toExponential(2) + ', and finer boxes cannot buy '
    + 'the next thousandth.') + '</div>'
}));

B.push(C.section({
  lab: '§3 · Tao\'s Problem 4.1', title: 'A named model problem, answered for every ε',
  bodyRaw: '<div class="col">'
  + C.pRaw('In his notes on this problem Tao poses a model question (Problem 4.1): can the two-interval scenario '
    + 'be excluded for the explicit family λ<sup>(ε)</sup>? It is the crux obstruction on the way to the exact '
    + 'value. The answer certified here is <strong>yes, for every ε ∈ (0, 0.1]</strong> — '
    + fmt(T3.onChunks.chunks) + ' interval chunks cover [10⁻¹², 0.1] with a uniform certified margin, and a '
    + 'separate sliver lemma closes (0, 10⁻¹²] by an exact substitution that cancels the ε→0 singular pole '
    + 'algebraically rather than numerically.')
  + C.pRaw('<strong>The δ-mechanism, which is the interesting part.</strong> As ε → 0 the family\'s margin tends '
    + 'to a constant δ set by the level defect of the primal constants. With rounded constants δ can land on '
    + 'either side of zero, and if it lands negative the family <em>provably fails</em> below ε* ≈ 4.3·10⁻⁸. '
    + 'That was not predicted and then checked — the certifier found a decisively negative window first, and the '
    + 'mechanism was worked out afterwards to explain it. Anyone building small-ε duals from midpoint decimals '
    + 'will hit this wall; every construction posted on the thread sits far above it. The battery keeps the '
    + 'failure as a red control: flip the defect to the wrong side and the certificate must refuse.') + '</div>'
}));

B.push(C.section({
  lab: '§4 · the community\'s own measures', title: 'Removing a "validated by sampling only" caveat',
  bodyRaw: '<div class="col">'
  + C.pRaw('Three dual measures posted in the thread carried the caveat that they had been checked by sampling. '
    + 'Sampling cannot decide positivity of a potential with poles. All three are certified here: every weight '
    + 'positive, and U<sub>λ</sub> ≥ 0 on all of [−1,1] by adaptive tangent envelopes on each gap between support '
    + 'points — no quadrature, no grid. Certified off-atom minima: '
    + T2.results.map((r) => r.certifiedMin.toExponential(3)).join(' · ') + '.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('It does not prove the infimum. It does not adjudicate any of the three claimed proofs — their '
    + 'analytic cores are outside what this instrument can reach, and pretending otherwise would be the exact '
    + 'failure this repository exists to avoid. It does not touch the supremum side. The bracket is what a '
    + 'machine can establish about this problem today without trusting anyone: a lower bound with a one-identity '
    + 'trust base, an upper bound from an explicit witness, and a named model problem closed for every ε. If any '
    + 'of the three claimed proofs is correct, the true value is D and this bracket contains it. The certificates '
    + 'and the instrument are public; every number above was recomputed at this build, and a REFUTED row or a '
    + 'missing fence refuses the page.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-lemniscate-inf.js @ git ' + git + '. '
  + 'Gates: the whole program re-run live (T1–T3 recomputed, the T4 record re-verified by an independent '
  + 'checker), the battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), the bracket ordered, '
  + 'and the claim fence present by name. Certificates: certs/erdos1038-inf.json and '
  + 'certs/erdos1038-forcing-1.828.json. The certifier is instruments/interval — the same one behind the ember '
  + 'and terra theorems. Published, not peer-reviewed, not independently rerun.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'erdos1038-inf.html'),
  TPL.render({ title: 'Erdős #1038: the infimum, bracketed', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot,
    path: '/reports/erdos1038-inf.html',
    desc: 'Erdős #1038 has three claimed AI-assisted proofs and no examined ones: a certified unconditional bracket '
      + lo + ' <= inf <= ' + up.toFixed(7) + ', with Tao\'s model Problem 4.1 answered for every epsilon.' }));
console.log('reports/erdos1038-inf.html written: bracket [' + lo + ', ' + up + '], battery '
  + nChecks + '/' + nReds + ' @ git ' + git);
