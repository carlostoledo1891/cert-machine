#!/usr/bin/env node
/* record-claims-intake-7.js — claim #7 through cert-machine's public claim form (maximusrufus, 2026-11-08): ThetaEvolve's
   zero-tolerance 26-circle packing, entry "8B-w_RL@65-Formal", "sum of radii 2.63598308", decided; the writer of
   certs/claims-intake-7-2026-11-08.json. Pre-registered in notes/claims-intake-7-preregistration-2026-11-08.md before
   any decider ran.

   Two implementations that share no code: tools/claims-intake-deciders.js (JavaScript, BigInt; the circles decider of
   #3/#5, unchanged) and the standalone checker corpus/claims-intake/issue-7/check.py (Python standard library,
   python3 -I), run here as a child. CERTIFIED or REFUTED only when both reach it; every compared field must agree or
   the run refuses. The claimant's code — ThetaEvolve's vis.py and programs — is never read or run.

   usage: node tools/record-claims-intake-7.js           decide, every control, both implementations → the record
          node tools/record-claims-intake-7.js --check   the battery: re-derive both and compare with the record
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const X = require(path.join(__dirname, 'claims-intake-deciders.js'));
const { parseJsonExact } = require(path.join(__dirname, 'run-mc100-einstein.js'));
const { L, Q } = X;
const OUT = path.join(ROOT, 'certs', 'claims-intake-7-2026-11-08.json');
const PRE = 'notes/claims-intake-7-preregistration-2026-11-08.md';
const ME = 'tools/record-claims-intake-7.js', DEC = 'tools/claims-intake-deciders.js', PY = 'corpus/claims-intake/issue-7/check.py';
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('CLAIMS INTAKE #7 REFUSED: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args) => cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

/* ---------------- the pin (the file already held for #3/#5) ---------------- */
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus/claims-intake/inputs/PINS.json'), 'utf8'));
const CIRC = 'thetaevolve-7c12898-CirclePacking-data.json';
const ISSUE_SHA = 'c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8';
if (PINS.files[CIRC].sha256 !== ISSUE_SHA) die('the pin differs from the sha256 the issue states');
const raw = fs.readFileSync(path.join(ROOT, 'corpus/claims-intake/inputs', CIRC));
if (sha(raw) !== ISSUE_SHA) die(CIRC + ' hashes to ' + sha(raw) + ', the pin is ' + ISSUE_SHA);

/* the claim, verbatim from the issue body (read 2026-11-08) */
const CLAIM = {
  title: '[claim] 26 circles in the unit square, sum of radii 2.63598308 with zero tolerance (key 8B-w_RL@65-Formal)',
  text: '26 circles in the unit square, sum of radii 2.63598308, as the source states it. README: "* **Ours (R1-Qwen3-8B): 2.63598308**", with the solution described as "our best-known solution for circle packing (with zero tolerance) in `Results/CirclePacking/figs/8B-w_RL@65-Formal.png`" and "the formal one (without tolerance as AlphaEvolve)" (key "8B-w_RL@65-Formal")',
  source: 'github.com/ypwang61/ThetaEvolve@7c12898 README.md (lines 45, 176, 187); arXiv:2511.23473',
};
const C7 = { entry: '8B-w_RL@65-Formal', tol: '0', sum: '2.63598308', bump: '1e-6', sumMoved: '2.63598309' };
const AE_SUM = '2.63586275641369812';      /* #3's exact AlphaEvolve sum, certs/claims-intake-2026-11-08.json */

/* the entry: 26 centres [x, y], then 26 radii — any other shape is refused */
function triples(v) {
  if (!Array.isArray(v) || v.length !== 2 || !Array.isArray(v[0]) || !Array.isArray(v[1])) return null;
  const [cs, rs] = v;
  if (cs.length !== 26 || rs.length !== 26 || cs.some((c) => !Array.isArray(c) || c.length !== 2) || rs.some((r) => Array.isArray(r))) return null;
  return cs.map((c, i) => [L.parseDecimal(c[0].lit), L.parseDecimal(c[1].lit), L.parseDecimal(rs[i].lit)]);
}

/* ---------------- the JavaScript decision ---------------- */
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : typeof v === 'bigint' ? v.toString() : v)));
function jsDecide(entry) {
  const C = triples(entry);
  if (!C) die('entry ' + C7.entry + ' is not 26 centres [x, y] followed by 26 radii');
  const res = X.circles(C, Q.ZERO, C7.sum);
  const tol = X.circles(C, L.parseDecimal('1e-6'), C7.sum);
  const out = { result: strip(res), atTolerance: { sideViolations: tol.underReading.sideViolations, pairViolations: tol.underReading.pairViolations },
    aboveAlphaEvolveExactSum: Q.cmp(res._sumR, L.parseDecimal(AE_SUM)) > 0 };
  const K = {};
  const i = res._minPair2[0];
  const P1 = C.map((r) => r.slice()); P1[i][2] = Q.add(P1[i][2], L.parseDecimal(C7.bump));
  K.P1 = { what: 'circle ' + i + ' (the tightest pair, squared form) radius + ' + C7.bump, verdict: X.circles(P1, Q.ZERO, C7.sum).verdict };
  const P2 = C.map((r) => r.slice()); P2[0][0] = Q.sub(P2[0][2], L.parseDecimal('2e-6'));
  K.P2strict = { what: 'x_0 := r_0 - 2e-6, strict', verdict: X.circles(P2, Q.ZERO, C7.sum).verdict };
  K.P2tol = { what: 'x_0 := r_0 - 2e-6, tolerance 1e-6', verdict: X.circles(P2, L.parseDecimal('1e-6'), C7.sum).verdict };
  const P3 = C.map((r) => r.slice()); P3[1][0] = P3[0][0]; P3[1][1] = P3[0][1];
  K.P3 = { what: 'circle 1\'s centre on circle 0\'s', verdict: X.circles(P3, Q.ZERO, C7.sum).verdict };
  K.P4 = { what: 'the sum claim moved to ' + C7.sumMoved, verdict: X.circles(C, Q.ZERO, C7.sumMoved).verdict };
  if (res.repair) K.P5 = { what: 'every radius - ' + res.repair.deltaBar + ' (the repair), strict', verdict: X.circlesShrunk(C, L.parseDecimal(res.repair.deltaBar)).strictHolds ? 'CERTIFIED' : 'REFUTED' };
  K.P6 = { what: 'the first 25 circles only', verdict: X.circles(C.slice(0, 25), Q.ZERO, C7.sum).verdict };
  K.P7 = { what: 'the radii block dropped', verdict: triples([entry[0]]) === null ? 'REFUSED' : 'NOT REFUSED' };
  out.controls = K;
  return out;
}

/* ---------------- the Python checker ---------------- */
function runPy() {
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, PY), '--controls', '--json'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) die(PY + ' exited ' + r.status + ': ' + (r.stdout || '').slice(0, 400) + (r.stderr || '').slice(0, 400));
  return JSON.parse(r.stdout);
}
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, k.split('.').reduce((a, p) => (a == null ? a : a[p]), o)]));
function same(label, a, b, keys, bad) {
  const A = pick(a, keys), B = pick(b, keys);
  for (const k of keys) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) bad.push(label + ' ' + k + ': js ' + JSON.stringify(A[k]) + ' / py ' + JSON.stringify(B[k]));
}
const CIRCLE_KEYS = ['verdict', 'fails', 'tolerance', 'sumExact', 'sumRounds', 'sumTruncates', 'sumMinusClaim', 'underReading.sideViolations', 'underReading.pairViolations',
  'strict.holds', 'strict.sideViolations', 'strict.pairViolations', 'strict.sides', 'strict.pairs', 'radiiNonPositive', 'tightestSide', 'tightestPairSquared', 'worstPairDistance',
  'tangenciesExact', 'sideTouchesExact', 'repair'];
/* the pre-registered predictions for every control */
const PRED = { P1: 'REFUTED', P2strict: 'REFUTED', P2tol: 'REFUTED', P3: 'REFUTED', P4: 'REFUTED', P5: 'CERTIFIED', P6: 'REFUSED', P7: 'REFUSED' };

function decide() {
  const E = Object.fromEntries(parseJsonExact(raw.toString('utf8')).map((e) => [e.name, e.list]));
  if (!E[C7.entry]) die('no entry ' + C7.entry);
  const js = jsDecide(E[C7.entry]), py = runPy();
  const bad = [];
  same('#7', js.result, py.result, CIRCLE_KEYS, bad);
  same('#7 at 1e-6', js.atTolerance, py['atTolerance1e-6'], ['sideViolations', 'pairViolations'], bad);
  if (js.aboveAlphaEvolveExactSum !== py.aboveAlphaEvolveExactSum) bad.push('#7 above AlphaEvolve');
  for (const k of Object.keys(js.controls)) if (!py.controls[k] || js.controls[k].verdict !== py.controls[k].verdict || js.controls[k].what !== py.controls[k].what) bad.push('#7 control ' + k);
  if (Object.keys(js.controls).sort().join() !== Object.keys(py.controls).sort().join()) bad.push('#7 control sets');
  if (bad.length) die('the two implementations disagree: ' + bad.slice(0, 12).join(' | '));
  const asPred = Object.fromEntries(Object.keys(js.controls).map((k) => [k, js.controls[k].verdict === PRED[k]]));
  return { js, py, asPred };
}

function headlineOf(r, js) {
  const w = r.worstPairDistance, s = r.strict;
  if (r.verdict === 'CERTIFIED')
    return 'no overlaps and inside the square with no tolerance, exactly: the closest pair (' + w.pair.join(', ') + ') is separated by ' + w.sumMinusDistance[1].replace(/^-/, '') +
      '… (rounded down), the tightest side slack is ' + r.tightestSide.slackExact + ' (circle ' + r.tightestSide.circle + ', ' + r.tightestSide.side + '), and the exact sum ' + r.sumExact + ' rounds to 2.63598308';
  const parts = [];
  if (s.pairViolations) parts.push(s.pairViolations + ' of 325 pairs overlap (the worst, pair (' + w.pair.join(', ') + '), by r_i + r_j - d_ij in [' + w.sumMinusDistance.join(', ') + '])');
  if (s.sideViolations) parts.push(s.sideViolations + ' side constraint' + (s.sideViolations === 1 ? '' : 's') + ' fail (the worst, circle ' + r.tightestSide.circle + ', ' + r.tightestSide.side + ' = ' + r.tightestSide.slackExact + ')');
  if (!r.sumRounds) parts.push('the exact sum ' + r.sumExact + ' does not round to 2.63598308');
  return 'with no tolerance, exactly: ' + parts.join('; ') + (r.repair ? '; every radius reduced by ' + r.repair.deltaBar + ' gives an exact packing (strict holds: ' + r.repair.repairedStrictHolds + ') with sum ' + r.repair.repairedSum : '') +
    (js.atTolerance.pairViolations + js.atTolerance.sideViolations === 0 ? '; at #5\'s 1e-6 tolerance every constraint holds' : '');
}

function main() {
  const { js, py, asPred } = decide();
  const r = js.result;
  const notPredicted = Object.entries(asPred).filter(([, v]) => !v).map(([k]) => k);
  const deciders = { js: sha(fs.readFileSync(path.join(ROOT, DEC))), writer: sha(fs.readFileSync(path.join(ROOT, ME))), py: sha(fs.readFileSync(path.join(ROOT, PY))) };
  if (CHECK) {
    const was = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const bad = [];
    if (was.claim.verdict !== r.verdict) bad.push('verdict ' + was.claim.verdict + ' -> ' + r.verdict);
    if (JSON.stringify(was.claim.decision) !== JSON.stringify(r)) bad.push('decision');
    if (JSON.stringify(was.claim.controls) !== JSON.stringify(js.controls)) bad.push('controls');
    if (JSON.stringify(was.claim.atTolerance1e6) !== JSON.stringify(js.atTolerance) || was.claim.aboveAlphaEvolveExactSum !== js.aboveAlphaEvolveExactSum) bad.push('facts');
    if (JSON.stringify(was.notAsPredicted) !== JSON.stringify(notPredicted)) bad.push('controls as predicted');
    if (bad.length) die('the re-derivation differs from the record: ' + bad.join(', '));
    if (JSON.stringify(was.deciders) !== JSON.stringify(deciders)) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
    console.log('CLAIMS INTAKE #7 — re-derived, equal to the record: ' + r.verdict + ' (both implementations; ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)');
    return;
  }
  const preCommit = git(['log', '--format=%H %cI', '--diff-filter=A', '--', PRE]).split('\n').pop();
  if (!preCommit) die('the pre-registration is not committed');
  const rec = {
    gaps: [
      'Nothing about optimality or the packing problem\'s value; nothing about how the source found or scored the entry; the figure 8B-w_RL@65-Formal.png was not looked at.',
      'Decided from the bytes alone: ThetaEvolve\'s vis.py, its programs/ and every evaluator in that repository were never fetched or run.',
    ],
    what: 'Claim #7 filed through cert-machine\'s public claim form (maximusrufus, 2026-11-08): ThetaEvolve\'s zero-tolerance 26-circle packing (entry "8B-w_RL@65-Formal"), decided exactly under the strict reading from the bytes pinned by sha256 (the sha256 the issue states matched) by two implementations sharing no code (tools/claims-intake-deciders.js, BigInt; corpus/claims-intake/issue-7/check.py, Python standard library — the standalone certificate, re-run with python3 -I without this engine).',
    verdict: r.verdict,
    claim: { issue: 'https://github.com/carlostoledo1891/cert-machine/issues/7', ...CLAIM, entry: C7.entry, verdict: r.verdict, agree: true,
      reading: 'strict, as #3: r_i > 0; r_i <= x_i, y_i <= 1 - r_i; (r_i + r_j)^2 <= |c_i - c_j|^2 for every pair (tangency allowed); the printed sum read as a rounding, |sum r - 2.63598308| <= 5e-9 (truncation reported). The entry is 26 centres [x, y] followed by 26 radii.',
      headline: headlineOf(r, js),
      certificate: 'python3 -I corpus/claims-intake/issue-7/check.py', decision: r, controls: js.controls,
      atTolerance1e6: js.atTolerance, aboveAlphaEvolveExactSum: js.aboveAlphaEvolveExactSum, alphaEvolveExactSum: AE_SUM },
    python: { verdict: py.result.verdict, version: py.python },
    allAgree: true,
    controlsAsPredicted: asPred,
    notAsPredicted: notPredicted,
    pins: { thetaevolve: { repo: 'github.com/ypwang61/ThetaEvolve', commit: '7c12898f5d7627af403e3aca643af76199fb5c20', file: 'Results/CirclePacking/data.json', held: 'corpus/claims-intake/inputs/' + CIRC, sha256: ISSUE_SHA, licence: 'Apache-2.0' }, issueShaMatched: true },
    read: ['the issue body', 'the pre-registration of #3–#6 (its pins, exactness rules and circle readings reused)', 'of the entry, its structure only before the pre-registration (two blocks; ~450 bytes printed while finding the boundary)'],
    neverReadOrRun: ['ThetaEvolve Results/*/vis.py', 'ThetaEvolve Results/*/programs/', 'every evaluator in the ThetaEvolve, OpenEvolve and ShinkaEvolve repositories', 'the figure 8B-w_RL@65-Formal.png'],
    preregistration: { path: PRE, sha256: sha(fs.readFileSync(path.join(ROOT, PRE))), addedIn: preCommit,
      sha256AsRegistered: sha(cp.execFileSync('git', ['show', preCommit.split(' ')[0] + ':' + PRE], { cwd: ROOT })) },
    deciders,
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), git: git(['rev-parse', 'HEAD']), node: process.version,
    rederive: 'node tools/record-claims-intake-7.js --check (offline, a few seconds); alone: python3 -I corpus/claims-intake/issue-7/check.py',
    seconds: +((Date.now() - T0) / 1000).toFixed(1),
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('CLAIMS INTAKE #7 — ' + r.verdict + '; both implementations agree; ' + (notPredicted.length ? 'NOT as predicted: ' + notPredicted.join(', ') : 'every control as predicted') + ' (' + rec.seconds + ' s)');
  console.log('  ' + rec.claim.headline);
}
main();
