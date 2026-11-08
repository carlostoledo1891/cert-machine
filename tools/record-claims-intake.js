#!/usr/bin/env node
/* record-claims-intake.js — the first four claims filed through cert-machine's public claim form (issues #3–#6,
   maximusrufus, 2026-11-06), decided; the writer of certs/claims-intake-2026-11-08.json. Pre-registered in
   notes/claims-intake-preregistration-2026-11-08.md (bcdc469f) before any decider ran.

     #3  26 circles, ThetaEvolve's "AlphaEvolve" entry: no overlaps (no tolerance), sum = 2.63586276
     #4  the second autocorrelation inequality, entry "8B-w_RL@65" (3072 cells): C2 >= 0.9469
     #5  26 circles, entry "8B-w_RL@65": no overlaps up to 1e-6 (the source's tolerance), sum = 2.6359857
     #6  EinsteinArena solution 2506, "The Prime Number Theorem": the stated constraint and the printed score

   Two implementations that share no code: tools/claims-intake-deciders.js (JavaScript, BigInt) and the standalone
   checkers corpus/claims-intake/{circles,autocorr2,pnt}/check.py (Python standard library, python3 -I), run here as
   children. A claim is CERTIFIED or REFUTED only when both reach it; every compared field must agree or the run
   refuses. The claimants' code — ThetaEvolve's vis.py and programs, EinsteinArena's verifier — is never read or run.

   usage: node tools/record-claims-intake.js           decide all four, every control, both implementations → the record
          node tools/record-claims-intake.js --check   the battery: re-derive both and compare with the record; nothing written
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
const H = X.helpers;
const OUT = path.join(ROOT, 'certs', 'claims-intake-2026-11-08.json');
const PRE = 'notes/claims-intake-preregistration-2026-11-08.md';
const ME = 'tools/record-claims-intake.js', DEC = 'tools/claims-intake-deciders.js';
const PY = { circles: 'corpus/claims-intake/circles/check.py', autocorr2: 'corpus/claims-intake/autocorr2/check.py', pnt: 'corpus/claims-intake/pnt/check.py' };
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('CLAIMS INTAKE REFUSED: ' + m); process.exit(1); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const git = (args) => cp.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();

/* ---------------- the pins ---------------- */
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus/claims-intake/inputs/PINS.json'), 'utf8'));
function pinned(rel, want) {
  const b = fs.readFileSync(path.join(ROOT, rel));
  if (sha(b) !== want) die(rel + ' hashes to ' + sha(b) + ', the pin is ' + want);
  return b.toString('utf8');
}
const IN = (f) => pinned('corpus/claims-intake/inputs/' + f, PINS.files[f].sha256);
const CIRC = 'thetaevolve-7c12898-CirclePacking-data.json', AUTO = 'thetaevolve-7c12898-SecondAutoCorrIneq-data.json';
const STMT = 'einstein-arena-api-problems-prime-number-theorem_2026-11-08.json', BEST7 = 'corpus/einstein-arena/best-7.json';
const ISSUE_SHA = { 3: 'c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8', 4: '3d453b729f5913e7f686e1386c5351fb90a2f434910604c6199ad39905a3cb4b',
  5: 'c20023f5a4d3e1408a7ec29ee043dea3c2b8d9711dd21c806008b5a48646e7b8', 6: '5382b697a7920edd92edc8c4770441925042bde3d3719456e84f248fbb8bd333' };
if (PINS.files[CIRC].sha256 !== ISSUE_SHA[3] || PINS.files[AUTO].sha256 !== ISSUE_SHA[4] || PINS.elsewhere[BEST7].sha256 !== ISSUE_SHA[6]) die('a pin differs from the sha256 the issue states');

/* the claims, verbatim from the issue bodies (read 2026-11-08) */
const CLAIMS = {
  3: { title: '[claim] 26 circles in the unit square, sum of radii 2.63586276 (AlphaEvolve key)', text: '26 circles in the unit square, no overlaps, sum of radii = 2.63586276 (the AlphaEvolve construction as stored under key "AlphaEvolve")', source: 'github.com/ypwang61/ThetaEvolve@7c12898 README' },
  4: { title: '[claim] Second autocorrelation inequality C2 >= 0.9469 (key 8B-w_RL@65)', text: 'Second autocorrelation inequality: the step function stored under key "8B-w_RL@65" (3072 cells) gives C2 >= 0.9469', source: 'github.com/ypwang61/ThetaEvolve@7c12898; arXiv:2511.23473 Sec. 4' },
  5: { title: '[claim] 26 circles in the unit square, sum of radii 2.6359857 at overlap tolerance 1e-6 (key 8B-w_RL@65)', text: '26 circles in the unit square, no overlaps up to tolerance 1e-6 as stated in the source, sum of radii = 2.6359857 (key "8B-w_RL@65")', source: 'github.com/ypwang61/ThetaEvolve@7c12898; arXiv:2511.23473 Table 2' },
  6: { title: '[claim] Prime Number Theorem: EinsteinArena solution 2506 satisfies the stated constraint with printed score 0.9976572852677297', text: 'EinsteinArena solution 2506 (agent "CodexProLong", created 2026-08-15) to the problem "The Prime Number Theorem": the submitted construction satisfies the problem\'s stated constraint and attains the score printed for it, 0.9976572852677297', source: 'EinsteinArena, solution record 2506 (the platform\'s API record of the solution)' },
};

/* ---------------- the JavaScript decisions ---------------- */
const strip = (o) => JSON.parse(JSON.stringify(o, (k, v) => (k[0] === '_' ? undefined : typeof v === 'bigint' ? v.toString() : v)));
const CIRCLE_CLAIMS = { 3: { entry: 'AlphaEvolve', tol: '0', sum: '2.63586276', bump: '1e-6', sumMoved: '2.63586277' },
  5: { entry: '8B-w_RL@65', tol: '1e-6', sum: '2.6359857', bump: '3e-6', sumMoved: '2.6359858' } };
function jsCircles(which, E) {
  const c = CIRCLE_CLAIMS[which];
  const C = E[c.entry].map((t) => t.map((x) => L.parseDecimal(x.lit)));
  const t = L.parseDecimal(c.tol);
  const res = X.circles(C, t, c.sum);
  const out = { result: strip(res) };
  if (which === 5) {
    const s = X.circlesShrunk(C, L.parseDecimal('1e-6'));
    const ae = X.circles(E.AlphaEvolve.map((r) => r.map((x) => L.parseDecimal(x.lit))), Q.ZERO, '2.63586276');
    out.shrunk = Object.assign(strip(s), { aboveAlphaEvolveExactSum: Q.cmp(s._sumR, ae._sumR) > 0 });
  }
  const K = {};
  const i = res._minPair2[0];
  const P1 = C.map((r) => r.slice()); P1[i][2] = Q.add(P1[i][2], L.parseDecimal(c.bump));
  K.P1 = { what: 'circle ' + i + ' (the tightest pair, squared form) radius + ' + c.bump, verdict: X.circles(P1, t, c.sum).verdict };
  const P2 = C.map((r) => r.slice()); P2[0][0] = Q.sub(P2[0][2], L.parseDecimal('2e-6'));
  K.P2strict = { what: 'x_0 := r_0 - 2e-6, strict', verdict: X.circles(P2, Q.ZERO, c.sum).verdict };
  K.P2tol = { what: 'x_0 := r_0 - 2e-6, tolerance 1e-6', verdict: X.circles(P2, L.parseDecimal('1e-6'), c.sum).verdict };
  const P3 = C.map((r) => r.slice()); P3[1][0] = P3[0][0]; P3[1][1] = P3[0][1];
  K.P3 = { what: 'circle 1\'s centre on circle 0\'s', verdict: X.circles(P3, t, c.sum).verdict };
  K.P4 = { what: 'the sum claim moved to ' + c.sumMoved, verdict: X.circles(C, t, c.sumMoved).verdict };
  if (res.repair) K.P5 = { what: 'every radius - ' + res.repair.deltaBar + ' (the repair), strict', verdict: X.circlesShrunk(C, L.parseDecimal(res.repair.deltaBar)).strictHolds ? 'CERTIFIED' : 'REFUTED' };
  K.P6 = { what: 'the first 25 circles only', verdict: X.circles(C.slice(0, 25), t, c.sum).verdict };
  out.controls = K;
  return out;
}
const AUTO_ENTRY = '8B-w_RL@65', AUTO_THR = '0.9469';
const CALIB = [['AlphaEvolve-v1', '0.8962'], ['StrongInit', '0.9055'], ['8B-wo_RL@100', '0.9434']];
function printedAs(A, printed) {
  const r = Q.R(A.Qnum, A.Qden);
  return { rounds: L.printedIsRounding(r, printed), truncates: L.printedIsTruncation(r, printed), atLeast: Q.cmp(r, L.parseDecimal(printed)) >= 0 };
}
function jsAutocorr(E) {
  const lits = E[AUTO_ENTRY].map((x) => x.lit);
  if (lits.length !== 3072) die('entry ' + AUTO_ENTRY + ' has ' + lits.length + ' values');
  const A = X.autocorr2(lits), V = X.autocorr2Verdict(A, AUTO_THR);
  const result = { verdict: V.verdict, n: A.n, domain: A.domain, negatives: A.negatives.length };
  if (A.domain) Object.assign(result, { Q30: A.Q30, argmax: A.argmax, decimals: A.decimals, Qnum: A.Qnum.toString(), Qden: A.Qden.toString(), margin: V.margin, 'printed0.9469': printedAs(A, AUTO_THR) });
  const K = {};
  const q1 = lits.slice(); q1[0] = '-1e-6';
  K.Q1 = { what: 'cell 0 := -1e-6', verdict: X.autocorr2Verdict(X.autocorr2(q1), AUTO_THR).verdict };
  const up4 = H.up(A.Qnum, A.Qden, 4), dn4 = H.down(A.Qnum, A.Qden, 4);
  const upT = Q.cmp(L.parseDecimal(up4), Q.R(A.Qnum, A.Qden)) === 0 ? H.qExact(Q.add(L.parseDecimal(up4), Q.R(1n, 10000n))) : up4;
  K.Q2up = { what: 'the least 4-decimal threshold above Q: ' + upT, verdict: X.autocorr2Verdict(A, upT).verdict };
  K.Q2down = { what: 'the greatest 4-decimal threshold at or below Q: ' + dn4, verdict: X.autocorr2Verdict(A, dn4).verdict };
  let big = 0; const vals = lits.map((x) => L.parseDecimal(x)); for (let i = 1; i < vals.length; i++) if (Q.cmp(vals[i], vals[big]) > 0) big = i;
  const q3 = lits.slice(); q3[big] = H.qExact(Q.mul(vals[big], Q.R(100n)));
  const A3 = X.autocorr2(q3);
  K.Q3 = { what: 'cell ' + big + ' (the largest) times 100', verdict: X.autocorr2Verdict(A3, AUTO_THR).verdict, Q30: A3.Q30 };
  K.Q4 = {};
  for (const [name, printed] of CALIB) { const Ac = X.autocorr2(E[name].map((x) => x.lit)); K.Q4[name] = Object.assign({ cells: E[name].length, printed, Q30: Ac.Q30 }, printedAs(Ac, printed)); }
  const one = X.autocorr2(['1']), two = X.autocorr2(['1', '1']);
  K.Q5 = { oneCell: one.Qnum === 2n && one.Qden === 3n, twoEqualCells: two.Qnum === 2n && two.Qden === 3n };
  return { result, controls: K };
}
const N_FACTOR = 10n;
function mobiusJs(N) { const mu = new Array(N + 1).fill(1), comp = new Array(N + 1).fill(false); for (let p = 2; p <= N; p++) { if (comp[p]) continue; for (let m = p; m <= N; m += p) { if (m > p) comp[m] = true; mu[m] = -mu[m]; } for (let m = p * p; m <= N; m += p * p) mu[m] = 0; } return mu; }
function jsPnt(B, stmt) {
  const STATED = ['1. Clips all values to $[-10, 10]$', '2. Adjusts $f(1)$ so that $\\sum_k f(k)/k = 0$ (normalization)', '3. Draws $10^7$ random samples $x \\sim \\mathrm{Uniform}(1,\\, 10 \\cdot \\max_k k)$ and checks $\\sum_k f(k)\\lfloor x/k \\rfloor \\le 1 + 10^{-4}$', '4. Returns $S(f) = -\\sum_k f(k) \\log(k) / k$'];
  for (const s of STATED) if (!stmt.description.includes(s)) die('the pinned statement no longer reads: ' + s);
  if (B.id.lit !== '2506' || B.agentName !== 'CodexProLong') die('best-7.json is not solution 2506 by CodexProLong');
  const pf = Object.entries(B.data.partial_function).map(([k, v]) => [k, v.lit]);
  const O = X.pntObject(pf);
  const maxK = O.keys.reduce((m, k) => (k > m ? k : m), 0n);
  const N = Number(N_FACTOR * maxK);
  const R = X.pntRange(O.keys, O.A, O.kd, N);
  /* the witnesses, evaluated directly at the integer: x = 1, the range's argmax, the mirror point lcm - 1 - m */
  const w1 = X.pntDirect(O.keys, O.A, R, 1n), wmax = X.pntDirect(O.keys, O.A, R, BigInt(R.max.n));
  if (wmax !== R._maxV) die('the range scan and the direct evaluation disagree at n = ' + R.max.n);
  const xm = R._Lcm - 1n - BigInt(R.mirror.m), wmir = X.pntDirect(O.keys, O.A, R, xm);
  const LD = R._LD;
  const sc = X.pntScore(O.keys, O.A, O.kd), ag = X.scoreAgreement(sc, B.score.lit, '0.000001');
  const Aref = w1 > LD || R.over1 > 0 || wmir > LD;
  const E30 = (v) => [H.down(v, LD, 30), H.up(v, LD, 30)];
  const result = {
    keys: O.keys.length, maxKey: Number(maxK), clipped: O.clipped, range: [1, N - 1], lcmDigits: R.lcmDigits, f1: R.f1, f1AboveOne: R.f1AboveOne,
    readingA: { verdict: Aref ? 'REFUTED' : 'REFUSED', witness1: { x: 1, F: E30(w1), aboveOne: w1 > LD }, inRangeAboveOne: R.over1, firstInRange: R.first1,
      mirror: { x: 'lcm(keys) - 1 - ' + R.mirror.m, xDigits: xm.toString().length, F: E30(wmir), aboveOne: wmir > LD, equalsPhiMinusF: wmir === R._mirrorV } },
    readingB: { holds: R.over2 === 0, aboveTolerance: R.over2, firstAboveTolerance: R.first2 },
    max: { n: R.max.n, F: R.max.F, belowTolBy: E30(LD + LD / 10000n - R._maxV) },
    min: { n: R.min.n, F: R.min.F }, phi: R.phi,
    score: { enclosure: [H.down(sc.lo, H.P10(sc.scale), 40), H.up(sc.hi, H.P10(sc.scale), 40)], printed: B.score.lit, agreement: ag },
    exactFallbacks: R.exactCalls,
  };
  result.verdict = Aref || !ag.agrees ? 'REFUTED' : 'REFUSED';
  const K = {};
  const bad = H.qExact(Q.add(L.parseDecimal(B.score.lit), L.parseDecimal('2e-6')));
  K.K1 = { what: 'the printed score + 2e-6', verdict: X.scoreAgreement(sc, bad, '0.000001').agrees ? 'CERTIFIED' : 'REFUTED' };
  const R2 = X.pntRange(O.keys, O.A.map((a) => a * 1001n), O.kd + 3, N);
  K.K2 = { what: 'f scaled by 1.001', readingBHolds: R2.over2 === 0, aboveTolerance: R2.over2, first: R2.first2.slice(0, 5) };
  const mu = mobiusJs(2000), mk = [], ma = [];
  for (let k = 2; k <= 2000; k++) { mk.push(BigInt(k)); ma.push(BigInt(mu[k]) * 10000n); }
  const R3 = X.pntRange(mk, ma, 4, 2001, { f1: 10000n, countNotOne: true });
  K.K3 = { what: 'f = mu on 1..2000, f(1) = 1, no normalization: F(n) = 1 for every n <= 2000', holds: R3.notOne === 0 };
  const lnE = X.lnEnclosures([2n, 3n, 6n, 10n]), S = H.P10(50);
  const pub = { 2: '0.69314718055994530941723212145817656807550013436025', 3: '1.09861228866810969139524523692252570464749055782274', 10: '2.30258509299404568401799145468436420760110148862877' };
  let okpub = true;
  for (const [k, s] of Object.entries(pub)) { const [lo, hi] = lnE.ln.get(BigInt(k)); const p = H.scaled(s, 50); okpub = okpub && lo <= p + 1n && p <= hi; }
  const [a6, b6] = lnE.ln.get(6n), [a2, b2] = lnE.ln.get(2n), [a3, b3] = lnE.ln.get(3n);
  K.K4 = { publishedDigits: okpub, ln6MeetsLn2PlusLn3: (a6 > a2 + a3 ? a6 : a2 + a3) <= (b6 < b2 + b3 ? b6 : b2 + b3) };
  const O5 = X.pntObject(pf.map(([k, v]) => [k, k === '2' ? '11' : v]));
  const i2 = O5.keys.findIndex((k) => k === 2n);
  K.K5 = { what: 'f(2) := 11', clipped: O5.clipped, valueUsed: H.qExact(Q.R(O5.A[i2], H.P10(O5.kd))) };
  void S;
  return { result, controls: K };
}

/* ---------------- the Python checkers ---------------- */
function runPy(script, args) {
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, script), ...args, '--controls', '--json'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  if (r.status !== 0) die(script + ' ' + args.join(' ') + ' exited ' + r.status + ': ' + (r.stdout || '').slice(0, 400) + (r.stderr || '').slice(0, 400));
  return JSON.parse(r.stdout);
}

/* ---------------- comparison: every field both compute ---------------- */
const pick = (o, keys) => Object.fromEntries(keys.map((k) => [k, k.split('.').reduce((a, p) => (a == null ? a : a[p]), o)]));
function same(label, a, b, keys, bad) {
  const A = pick(a, keys), B = pick(b, keys);
  for (const k of keys) if (JSON.stringify(A[k]) !== JSON.stringify(B[k])) bad.push(label + ' ' + k + ': js ' + JSON.stringify(A[k]) + ' / py ' + JSON.stringify(B[k]));
}
const CIRCLE_KEYS = ['verdict', 'fails', 'tolerance', 'sumExact', 'sumRounds', 'sumTruncates', 'sumMinusClaim', 'underReading.sideViolations', 'underReading.pairViolations',
  'strict.holds', 'strict.sideViolations', 'strict.pairViolations', 'strict.sides', 'strict.pairs', 'radiiNonPositive', 'tightestSide', 'tightestPairSquared', 'worstPairDistance',
  'tangenciesExact', 'sideTouchesExact', 'repair'];
const AUTO_KEYS = ['verdict', 'n', 'domain', 'negatives', 'Q30', 'argmax', 'decimals', 'Qnum', 'Qden', 'margin', 'printed0.9469'];
const PNT_KEYS = ['verdict', 'keys', 'maxKey', 'clipped', 'range', 'lcmDigits', 'f1', 'f1AboveOne', 'readingA', 'readingB', 'max', 'min', 'phi', 'score.enclosure', 'score.printed', 'score.agreement'];
const strictPairsAsArrays = (r) => { if (r && r.strict && r.strict.pairs) r.strict.pairs = r.strict.pairs.map((p) => (Array.isArray(p) ? p : [p[0], p[1]])); return r; };

/* the pre-registered predictions for every control (notes/claims-intake-preregistration-2026-11-08.md) */
const PRED = {
  3: { P1: 'REFUTED', P2strict: 'REFUTED', P2tol: 'REFUTED', P3: 'REFUTED', P4: 'REFUTED', P6: 'REFUSED' },
  5: { P1: 'REFUTED', P2strict: 'REFUTED', P2tol: 'REFUTED', P3: 'REFUTED', P4: 'REFUTED', P5: 'CERTIFIED', P6: 'REFUSED' },
  4: { Q1: 'REFUTED', Q2up: 'REFUTED', Q2down: 'CERTIFIED', Q3: 'REFUTED' },
};

function decideAll() {
  const CP = parseJsonExact(IN(CIRC)), AC = parseJsonExact(IN(AUTO));
  const ent = (A) => Object.fromEntries(A.map((e) => [e.name, e.list]));
  const stmt = JSON.parse(IN(STMT));
  const B = parseJsonExact(pinned(BEST7, PINS.elsewhere[BEST7].sha256));
  const js = { 3: jsCircles(3, ent(CP)), 5: jsCircles(5, ent(CP)), 4: jsAutocorr(ent(AC)), 6: jsPnt(B, stmt) };
  const py = { 3: runPy(PY.circles, ['3']), 5: runPy(PY.circles, ['5']), 4: runPy(PY.autocorr2, []), 6: runPy(PY.pnt, []) };
  const bad = [];
  for (const n of [3, 5]) {
    strictPairsAsArrays(js[n].result);
    same('#' + n, js[n].result, py[n].result, CIRCLE_KEYS, bad);
    for (const k of Object.keys(js[n].controls)) if (!py[n].controls[k] || js[n].controls[k].verdict !== py[n].controls[k].verdict || js[n].controls[k].what !== py[n].controls[k].what) bad.push('#' + n + ' control ' + k);
    if (Object.keys(js[n].controls).sort().join() !== Object.keys(py[n].controls).sort().join()) bad.push('#' + n + ' control sets');
  }
  same('#5 shrunk', js[5].shrunk, py[5]['shrunkBy1e-6'], ['strictHolds', 'sumExact', 'sideViolations', 'pairViolations', 'aboveAlphaEvolveExactSum'], bad);
  same('#4', js[4].result, py[4].result, AUTO_KEYS, bad);
  for (const k of ['Q1', 'Q2up', 'Q2down', 'Q3']) same('#4 ' + k, js[4].controls[k], py[4].controls[k], ['what', 'verdict'].concat(k === 'Q3' ? ['Q30'] : []), bad);
  for (const [name] of CALIB) same('#4 Q4 ' + name, js[4].controls.Q4[name], py[4].controls.Q4[name], ['cells', 'printed', 'Q30', 'rounds', 'truncates', 'atLeast'], bad);
  same('#6', js[6].result, py[6].result, PNT_KEYS, bad);
  same('#6 K1', js[6].controls.K1, py[6].controls.K1, ['verdict'], bad);
  same('#6 K2', js[6].controls.K2, py[6].controls.K2, ['readingBHolds', 'aboveTolerance', 'first'], bad);
  same('#6 K3', js[6].controls.K3, py[6].controls.K3, ['holds'], bad);
  same('#6 K5', js[6].controls.K5, py[6].controls.K5, ['clipped', 'valueUsed'], bad);
  if (bad.length) die('the two implementations disagree: ' + bad.slice(0, 12).join(' | '));
  /* every control as predicted */
  const asPred = {};
  for (const n of [3, 5, 4]) for (const [k, want] of Object.entries(PRED[n])) asPred['#' + n + ' ' + k] = js[n].controls[k].verdict === want;
  for (const [name] of CALIB) asPred['#4 Q4 ' + name] = js[4].controls.Q4[name].rounds || js[4].controls.Q4[name].truncates;
  for (const [k, v] of Object.entries(js[4].controls.Q5).concat(Object.entries(py[4].controls.Q5))) asPred['#4 Q5 ' + k] = v === true;
  asPred['#6 K1'] = js[6].controls.K1.verdict === 'REFUTED';
  asPred['#6 K2'] = js[6].controls.K2.readingBHolds === false;
  asPred['#6 K3'] = js[6].controls.K3.holds === true && py[6].controls.K3.holds === true;
  for (const [k, v] of Object.entries(js[6].controls.K4).concat(Object.entries(py[6].controls.K4))) asPred['#6 K4 ' + k] = v === true;
  asPred['#6 K5'] = JSON.stringify(js[6].controls.K5.clipped) === '[2]' && js[6].controls.K5.valueUsed === '10';
  return { js, py, asPred };
}

function main() {
  const { js, py, asPred } = decideAll();
  const verdicts = { 3: js[3].result.verdict, 4: js[4].result.verdict, 5: js[5].result.verdict, 6: js[6].result.verdict };
  const notPredicted = Object.entries(asPred).filter(([, v]) => !v).map(([k]) => k);
  const deciders = { js: sha(fs.readFileSync(path.join(ROOT, DEC))), writer: sha(fs.readFileSync(path.join(ROOT, ME))),
    py: Object.fromEntries(Object.entries(PY).map(([k, p]) => [k, sha(fs.readFileSync(path.join(ROOT, p)))])) };
  if (CHECK) {
    const was = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const bad = [];
    for (const n of [3, 4, 5, 6]) {
      if (was.claims[n].verdict !== verdicts[n]) bad.push('#' + n + ' verdict ' + was.claims[n].verdict + ' -> ' + verdicts[n]);
      if (JSON.stringify(was.claims[n].decision) !== JSON.stringify(js[n].result)) bad.push('#' + n + ' decision');
      if (JSON.stringify(was.claims[n].controls) !== JSON.stringify(js[n].controls)) bad.push('#' + n + ' controls');
    }
    if (JSON.stringify(was.claims[5].shrunkBy1e6) !== JSON.stringify(js[5].shrunk)) bad.push('#5 shrunk');
    if (JSON.stringify(was.notAsPredicted) !== JSON.stringify(notPredicted)) bad.push('controls as predicted');
    if (bad.length) die('the re-derivation differs from the record: ' + bad.join(', '));
    if (JSON.stringify(was.deciders) !== JSON.stringify(deciders)) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
    console.log('CLAIMS INTAKE — re-derived, equal to the record: #3 ' + verdicts[3] + ', #4 ' + verdicts[4] + ', #5 ' + verdicts[5] + ', #6 ' + verdicts[6] + ' (both implementations; ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s)');
    return;
  }
  const preCommit = git(['log', '--format=%H %cI', '--diff-filter=A', '--', PRE]).split('\n').pop();
  const r3 = js[3].result, r4 = js[4].result, r5 = js[5].result, r6 = js[6].result;
  const rec = {
    gaps: [
      '#3, #5: nothing about optimality; the entries "8B-w_RL@65-Formal" (the README\'s zero-tolerance 2.63598308), "ShinkaEvolve" and "Init" were not decided.',
      '#4: the verdict is on the claim as filed ("C2 >= 0.9469"); the paper prints 0.9469, which is the exact value rounded to four decimals, not a lower bound of it. What the bytes prove is C2 >= ' + r4.Q30[0] + ' (rounded down). ThetaEvolve\'s own scorer was not read or run, so whether it reports 0.9469 or the exact value is not known here.',
      '#4: one calibration of the definition is NOT as predicted — the file\'s "StrongInit" entry (1024 cells) decides to ' + js[4].controls.Q4.StrongInit.Q30[0] + '…, where Table 2 prints 0.9055 for the initial program; the two other calibrations reproduce their printed digits, AlphaEvolve-v1 to AlphaEvolve\'s own 0.8962 <= C2 (the same 50 literals as AlphaEvolve\'s B.2 notebook). Possibly the stored list is not the object behind Table 2\'s "Initial"; not resolved without running their code.',
      '#6: reading A (F(x) <= 1 for every x >= 1) is refuted; reading B, the platform\'s own check made exhaustive over its sampled range with its 1e-4 tolerance, holds — this record says nothing about the platform\'s sampled run itself (its samples are not published). Whether any f yields a statement about pi(x) is the problem\'s mathematics, read, not decided.',
      'None of the four was decided by running the claimant\'s code: ThetaEvolve\'s vis.py and programs/ were never fetched; the verifier field of the EinsteinArena API record is held unread.',
    ],
    what: 'The first four claims filed through cert-machine\'s public claim form (issues #3–#6, maximusrufus, 2026-11-06), each decided exactly from bytes pinned by sha256 — every sha256 the issues state matched — by two implementations sharing no code (tools/claims-intake-deciders.js, BigInt; corpus/claims-intake/{circles,autocorr2,pnt}/check.py, Python standard library). The Python checkers are the standalone certificates: each re-runs with python3 -I on its pinned input, without this engine.',
    verdicts,
    claims: {
      3: { issue: 'https://github.com/carlostoledo1891/cert-machine/issues/3', ...CLAIMS[3], entry: 'AlphaEvolve', verdict: r3.verdict, agree: true,
        reading: 'r_i > 0; r_i <= x_i, y_i <= 1 - r_i; (r_i + r_j)^2 <= |c_i - c_j|^2 for every pair (tangency allowed); the printed sum read as a rounding, |sum r - 2.63586276| <= 5e-9',
        headline: 'no overlaps and inside the square, exactly: the closest pair (' + r3.worstPairDistance.pair.join(', ') + ') is separated by ' + r3.worstPairDistance.sumMinusDistance[1].replace(/^-/, '') + '… (rounded down) and the tightest side slack is ' + r3.tightestSide.slackExact + '; sum r = ' + r3.sumExact + ' exactly, which rounds to 2.63586276 (and truncates to 2.63586275)',
        certificate: 'python3 -I corpus/claims-intake/circles/check.py 3', decision: r3, controls: js[3].controls },
      4: { issue: 'https://github.com/carlostoledo1891/cert-machine/issues/4', ...CLAIMS[4], entry: AUTO_ENTRY, verdict: r4.verdict, agree: true,
        reading: 'C2 the least constant with ||f*f||_2^2 <= C2 ||f*f||_1 ||f*f||_inf for non-negative f (arXiv:2511.23473 A.3); for a step function Q = sum_m (c_{m-1}^2 + c_{m-1}c_m + c_m^2) / (3 (sum a)^2 max c), c the exact autoconvolution; the claim CERTIFIED iff every value >= 0 and Q >= 9469/10000',
        headline: 'every value >= 0, so the function is in the inequality\'s domain, but Q = ' + r4.Q30[0] + '… exactly, below 0.9469 by more than ' + r4.margin[1].replace(/^-/, '').slice(0, 18) + ' (a lower bound of the gap, cut down); the bytes prove C2 >= ' + r4.Q30[0].slice(0, 12) + ' (cut down), and the paper\'s 0.9469 is Q rounded to four decimals',
        certificate: 'python3 -I corpus/claims-intake/autocorr2/check.py (prints the exact Q and the falsifying margin)', decision: r4, controls: js[4].controls },
      5: { issue: 'https://github.com/carlostoledo1891/cert-machine/issues/5', ...CLAIMS[5], entry: '8B-w_RL@65', verdict: r5.verdict, agree: true,
        reading: 'with t = 1e-6 (arXiv:2511.23473 App. A.1, OpenEvolve\'s atol): r_i > 0; r_i - t <= x_i, y_i <= 1 - r_i + t; r_i + r_j - t <= |c_i - c_j| for every pair; the printed sum read as a rounding, |sum r - 2.6359857| <= 5e-8. The strict reading (t = 0) reported as a fact.',
        headline: 'holds at the source\'s 1e-6 tolerance, exactly; strictly it does not — ' + r5.strict.pairViolations + ' of 325 pairs overlap and ' + r5.strict.sideViolations + ' circles cross a side, the worst overlap r_i + r_j - d_ij = ' + r5.worstPairDistance.sumMinusDistance[1] + '… (pair ' + r5.worstPairDistance.pair.join(', ') + ', rounded up); sum r = ' + r5.sumExact + ' exactly; every radius reduced by ' + r5.repair.deltaBar + ' gives an exact packing with sum ' + r5.repair.repairedSum,
        certificate: 'python3 -I corpus/claims-intake/circles/check.py 5', decision: r5, controls: js[5].controls, shrunkBy1e6: js[5].shrunk },
      6: { issue: 'https://github.com/carlostoledo1891/cert-machine/issues/6', ...CLAIMS[6], solution: 2506, verdict: r6.verdict, agree: true,
        reading: 'the statement\'s steps 1–2 applied exactly (no value clipped; f(1) := -sum_{k>=2} f(k)/k, a rational); A, the constraint: F(x) = sum_k f(k) floor(x/k) <= 1 for every real x >= 1 (decides); B, the platform\'s check made exhaustive: F(n) <= 1 + 1e-4 for every integer 1 <= n < 10 max k (reported); the score S = -sum_k f(k) ln(k)/k enclosed and compared with the printed double within the platform\'s minImprovement 1e-6 (the house rule of tools/run-mc100-einstein.js)',
        headline: 'the constraint fails at the first point: F(x) = f(1) = ' + r6.f1[0].slice(0, 22) + '… > 1 for 1 <= x < 2 (f(1) is set by the platform\'s own normalisation); ' + r6.readingA.inRangeAboveOne + ' of the ' + (r6.range[1]).toLocaleString('en-US') + ' integers of the sampled range exceed 1, none exceeds 1 + 1e-4 (the platform\'s check, made exhaustive, passes: the maximum, at n = ' + r6.max.n + ', is below 1 + 1e-4 by more than ' + r6.max.belowTolBy[0].slice(0, 16) + '); outside the range, at x = lcm(keys) - 1 - ' + r6.min.n + ' (a 2117-digit integer), F = ' + r6.readingA.mirror.F[0].slice(0, 10) + '…; the printed score agrees with the exact S = ' + r6.score.enclosure[0].slice(0, 22) + '… (the double is ' + r6.score.agreement.distanceUp.replace(/0+$/, '') + ' above it)',
        certificate: 'python3 -I corpus/claims-intake/pnt/check.py (evaluates sum_k f(k) floor(x/k) directly at each witness)', decision: r6, controls: js[6].controls },
    },
    python: { 3: py[3].result.verdict, 4: py[4].result.verdict, 5: py[5].result.verdict, 6: py[6].result.verdict, version: py[3].python, selftests: { '4': py[4].controls.Q5, '6': py[6].controls.K4 } },
    allAgree: true,
    controlsAsPredicted: asPred,
    notAsPredicted: notPredicted,
    predictionsMet: { 3: 'CERTIFIED, the more likely of the registered outcomes (0.6)', 4: 'REFUTED with Q rounding to 0.9469, the registered 0.2 branch', 5: 'CERTIFIED under T with S failing, as registered (0.85 and 0.95)', 6: 'REFUTED by a witness inside the sampled range (x = 1), as registered (0.8); B holds, as registered (0.75); the score agrees (0.95)' },
    pins: { thetaevolve: { repo: 'github.com/ypwang61/ThetaEvolve', commit: '7c12898f5d7627af403e3aca643af76199fb5c20', files: { [CIRC]: PINS.files[CIRC], [AUTO]: PINS.files[AUTO] }, licence: 'Apache-2.0' },
      einsteinArena: { solution: BEST7, sha256: PINS.elsewhere[BEST7].sha256, statement: PINS.files[STMT] }, issueShaMatched: true,
      paper: { arxiv: '2511.23473v1', pdfSha256: '8e74933b2a4dddbf80a063fb88438c95b62b982a5167bbb77213ce1e3839715d', read: '§3.3 note (1), Table 2 and its caption, Appendix A.1–A.3' } },
    read: ['the four issue bodies', 'ThetaEvolve README.md and LICENSE at the pin', 'arXiv:2511.23473v1 §3.3, Table 2, Appendix A', 'the description field of the EinsteinArena PNT statement', 'after the pre-registration, for the calibration Q4 only: AlphaEvolve\'s B.2 cells in corpus/sources/alphaevolve_mathematical_results.ipynb (the statement, the 50 heights, the verification formula)'],
    neverReadOrRun: ['ThetaEvolve Results/*/vis.py', 'ThetaEvolve Results/*/programs/', 'every evaluator in the ThetaEvolve, OpenEvolve and ShinkaEvolve repositories', 'the verifier field of the EinsteinArena API record (held unread in the pinned file)', 'EinsteinArena\'s verifier sources for problem 7'],
    preregistration: { path: PRE, sha256: sha(fs.readFileSync(path.join(ROOT, PRE))), addedIn: preCommit,
      sha256AsRegistered: sha(cp.execFileSync('git', ['show', preCommit.split(' ')[0] + ':' + PRE], { cwd: ROOT })), amendments: 'A (2026-11-08, after the first run): see the note' },
    deciders,
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), git: git(['rev-parse', 'HEAD']), node: process.version,
    rederive: 'node tools/record-claims-intake.js --check (offline, ~11 s); each claim alone: python3 -I corpus/claims-intake/circles/check.py 3 (or 5), .../autocorr2/check.py, .../pnt/check.py',
    seconds: +((Date.now() - T0) / 1000).toFixed(1),
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('CLAIMS INTAKE — #3 ' + verdicts[3] + ', #4 ' + verdicts[4] + ', #5 ' + verdicts[5] + ', #6 ' + verdicts[6] + '; both implementations agree; ' + (notPredicted.length ? 'NOT as predicted: ' + notPredicted.join(', ') : 'every control as predicted') + ' → certs/claims-intake-2026-11-08.json (' + rec.seconds + ' s)');
}
main();
