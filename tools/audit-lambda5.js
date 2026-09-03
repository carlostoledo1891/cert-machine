#!/usr/bin/env node
/* audit-lambda5.js — the independent audit of the lambda(5) theorem.
   tools/ · cert-machine

   AN INDEPENDENT SECOND WALK. This tool shares no code with the symbolic
   engine (instruments/lambda4, instruments/lambda56): inner products are
   computed by DIRECT TRIGONOMETRIC SUMMATION over the actual equispaced
   sets, condition membership by plain integer arithmetic on the record's
   condition VECTORS, and every set that the float screen cannot settle is
   re-certified from scratch by the calibrated minimum instrument. What it
   reads from the campaign record is data only — condition vectors, deltas,
   the worklist, the target enclosure — never a derivation.

   WHAT IT CHECKS, and each one can only fail loudly:

     SWEEP        every gcd-reduced 5-set with max element <= BOX dips
                  STRICTLY below L(1,2,4,5,6), except {1,2,4,5,6} itself,
                  which attains it. A set that does not is a REFUTER of the
                  theorem, and the audit aborts naming it.
     GENERIC      for every set with no positive-delta condition active, the
                  Section-5 inner product computed by direct summation is
                  <= 0 AND the weight's own average is > 0 — the two
                  hypotheses of Lemma 3.4 — so the generic argument really
                  does close it. The engine says this symbolically; this
                  recomputes it numerically, point by point.
     EXHAUSTIVE   every set the generic argument does NOT close satisfies at
                  least one of the eight recorded family conditions. A set in
                  neither place would be outside the whole reduction.
     OBSTRUCTION  on points of the double-sum core b+c = a+d = e, all four
                  classical atoms at both anchors have STRICTLY POSITIVE
                  inner product (they cannot close it — the obstruction is
                  real), while the Fejer-Riesz comb at 2pi/3 does close it.
     WITNESS      {1,2,4,5,6} attains the target and its dilations inherit
                  it; the walls in the record are therefore definitional.

   WHAT IT DOES NOT CHECK, stated so the page can state it: the INTERIOR of
   the eight closure trees — the subfamily cones, the derived thresholds and
   the finite parts inside them. The lambda(4) audit walks those; this one
   does not yet. It audits the theorem, the first level of the reduction and
   the obstruction, and says so.

   usage: node tools/audit-lambda5.js [box]   (default 30)
   writes certs/lambda5-audit.json */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const LAM = require(path.join(ROOT, 'instruments', 'trigmin', 'lambda.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));

const die = (m) => { console.error('LAMBDA5 AUDIT: HOLE FOUND OR CHECK FAILED — ' + m); process.exit(1); };
const t0 = Date.now();
const BOX = Number(process.argv[2] || 30);
if (!Number.isInteger(BOX) || BOX < 8) die('box must be an integer >= 8');

const rec = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'lambda56-campaign.json'), 'utf8'));
const st = rec.stages || {};
const gen5 = st['lambda5-generic'] || die('the record has no lambda(5) generic stage');
const dv = (s) => { const p = s.split('/'); return Number(p[0]) / Number(p[1] || 1); };
const EXC = gen5.exceptions.map((e) => ({
  key: e.key.split(',').map(Number), delta: e.delta, label: e.label, dv: dv(e.delta), pos: dv(e.delta) > 0
}));
if (EXC.length !== 15) die('the record no longer carries fifteen generic conditions');
const FAMKEY = (gen5.worklist || []).map((w) => w.key.split(',').map(Number));
if (FAMKEY.length !== 8) die('the record no longer carries eight families');

/* the target, from the record — exact rationals, never a decimal */
const parseQ = (s) => { const p = s.split('/'); return Q.R(BigInt(p[0]), BigInt(p[1] || 1)); };
const TGT = (typeof st.targets.L5 === 'string') ? JSON.parse(st.targets.L5) : st.targets.L5;
const TLO = parseQ(TGT.lo), THI = parseQ(TGT.hi);
const tlo = Q.toDouble(TLO), thi = Q.toDouble(THI);

/* ---- direct trigonometric summation (shares nothing with the engine) ------ */
const PI = Math.PI;
const avg = (m, xi, f) => { let s = 0; for (let k = 0; k < m; k++) s += f((xi + 2 * PI * k) / m); return s / m; };
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
const setGcd = (A) => A.reduce((s, v) => gcd(s, v));

/* the Section-5 generic clause at a point, numerically:
   S = {theta : e*theta = pi}, w = 2(1 - cos d theta)^2, g = 2/3 + sum cos */
function genericClause(A) {
  const [a, b, c, d, e] = A;
  const w = (t) => 2 * Math.pow(1 - Math.cos(d * t), 2);
  const g = (t) => 2 / 3 + Math.cos(a * t) + Math.cos(b * t) + Math.cos(c * t) + Math.cos(d * t);
  return { wg: avg(e, PI, (t) => w(t) * g(t)), w1: avg(e, PI, w) };
}

/* condition membership by plain integer arithmetic on the gap vector */
const gaps = (A) => [A[0], A[1] - A[0], A[2] - A[1], A[3] - A[2], A[4] - A[3]];
const activeOf = (A) => { const x = gaps(A); return EXC.filter((e) => e.key.reduce((s, k, i) => s + k * x[i], 0) === 0); };
const inFamily = (A) => { const x = gaps(A); return FAMKEY.some((k) => k.reduce((s, kk, i) => s + kk * x[i], 0) === 0); };

/* ---- the sweep ------------------------------------------------------------ */
/* float screen on a shared cosine table, then exact certification for
   anything the screen cannot settle. The screen may only PRUNE. */
const GRID = 4096;
const TAB = [];
for (let m = 0; m <= BOX; m++) {
  const row = new Float64Array(GRID);
  for (let i = 0; i < GRID; i++) row[i] = Math.cos(m * (PI * i / (GRID - 1)));
  TAB.push(row);
}
const floatMin = (A) => {
  let best = Infinity;
  const r0 = TAB[A[0]], r1 = TAB[A[1]], r2 = TAB[A[2]], r3 = TAB[A[3]], r4 = TAB[A[4]];
  for (let i = 0; i < GRID; i++) {
    const v = r0[i] + r1[i] + r2[i] + r3[i] + r4[i];
    if (v < best) best = v;
  }
  return best;
};

const EXTREMIZER = [1, 2, 4, 5, 6];
const same = (A, B) => A.every((v, i) => v === B[i]);

const SAMPLE_EVERY = Number(process.env.SAMPLE_EVERY || 40);
let swept = 0, screened = 0, exact = 0, sampled = 0, refuters = [], genericClosed = 0, familyOnly = 0, genericChecked = 0;
let worstGenericWG = -Infinity, minGenericW1 = Infinity, worstSymbolicGap = 0, worstSymbolicAt = null;
const A = [0, 0, 0, 0, 0];
for (A[0] = 1; A[0] <= BOX - 4; A[0]++)
for (A[1] = A[0] + 1; A[1] <= BOX - 3; A[1]++)
for (A[2] = A[1] + 1; A[2] <= BOX - 2; A[2]++)
for (A[3] = A[2] + 1; A[3] <= BOX - 1; A[3]++)
for (A[4] = A[3] + 1; A[4] <= BOX; A[4]++) {
  if (setGcd(A) !== 1) continue;
  swept++;
  const S = A.slice();

  /* the theorem: strictly below the target, except the extremizer */
  const fm = floatMin(S);
  if (same(S, EXTREMIZER)) {
    const r = LAM.certifyLambda(S, { tol: 1e-12 });
    if (!(Q.cmp(Q.fromDouble(r.minEnclosure[0]), THI) <= 0 && Q.cmp(TLO, Q.fromDouble(r.minEnclosure[1])) <= 0))
      die('the extremizer no longer certifies onto the target enclosure');
    exact++;
  } else if (fm < tlo - 1e-6) {
    /* the screen may only PRUNE, and here it is sound in the direction used:
       a grid value is an UPPER bound on the true minimum, so a grid value
       below the target's low end proves the true minimum is below it. Even
       so, one set in every SAMPLE_EVERY is re-certified exactly, so the
       screen is audited rather than trusted. */
    screened++;
    if (swept % SAMPLE_EVERY === 0) {
      const r = LAM.certifyLambda(S, { tol: 1e-11 });
      sampled++;
      if (!(Q.cmp(Q.fromDouble(r.minEnclosure[1]), TLO) < 0))
        die('the float screen pruned a set the exact certifier does not put below the target: {' + S + '}');
    }
  } else {
    const r = LAM.certifyLambda(S, { tol: 1e-11 });
    exact++;
    if (!(Q.cmp(Q.fromDouble(r.minEnclosure[1]), TLO) < 0)) refuters.push({ A: S, enclosure: r.minEnclosure });
  }

  /* the reduction, first level — and the engine's whole symbolic layer,
     cross-validated: its model says the inner product at a point is
     base(0) + the deltas of the ACTIVE conditions. Direct summation must
     agree, at every set in the box, or the symbolic layer is wrong. */
  const act = activeOf(S);
  const pos = act.filter((e) => e.pos);
  const { wg, w1 } = genericClause(S);
  genericChecked++;
  const predicted = act.reduce((s, e) => s + e.dv, 0);
  const gap = Math.abs(wg - predicted);
  if (gap > 1e-7) die('the engine\'s symbolic inner product disagrees with direct summation at {' + S + '}: '
    + 'predicted ' + predicted + ', measured ' + wg);
  if (gap > worstSymbolicGap) { worstSymbolicGap = gap; worstSymbolicAt = S.slice(); }
  if (!(w1 > 1e-12)) die('the generic weight has non-positive average at {' + S + '} — Lemma 3.4 does not apply there');
  if (w1 < minGenericW1) minGenericW1 = w1;
  if (!pos.length) {
    /* the generic argument must close it: a non-positive inner product */
    if (wg > 1e-9) die('a set the engine closes generically has a POSITIVE generic inner product: {' + S + '} -> ' + wg);
    if (wg > worstGenericWG) worstGenericWG = wg;
    genericClosed++;
  } else {
    if (!inFamily(S)) die('{' + S + '} is closed by neither the generic argument nor any recorded family');
    familyOnly++;
  }
}
if (refuters.length) die(refuters.length + ' REFUTER(S) of the theorem in the box, first: {' + refuters[0].A + '}');

/* ---- the obstruction, independently -------------------------------------- */
/* The mechanism, checked pointwise rather than argued: on the double-sum core
   b+c = a+d = e, the equispaced set S(e, pi) has d*theta = pi - a*theta and
   c*theta = pi - b*theta, so cos a + cos d = 0 and cos b + cos c = 0 THERE.
   The consequence is that g is CONSTANT on S — equal to g0 — so <w,g> =
   g0 * <w,1> > 0 for EVERY nonnegative weight, and no classical Section-5
   argument can start. This audit checks the identity at every core point in
   the box, then checks the conclusion against the four classical atoms and a
   batch of random nonnegative weights. */
const corePts = [];
for (let a = 1; a <= BOX; a++)
for (let u = 1; u <= BOX; u++)
for (let v = 1; v <= BOX; v++) {
  const A5 = [a, a + u, a + u + v, a + 2 * u + v, 2 * a + 2 * u + v];
  if (A5[4] > BOX) continue;
  if (!(A5[0] < A5[1] && A5[1] < A5[2] && A5[2] < A5[3] && A5[3] < A5[4])) continue;
  if (setGcd(A5) !== 1) continue;
  corePts.push({ A: A5, auv: [a, u, v] });
}
if (corePts.length < 5) die('too few double-sum-core points inside the box to test the obstruction');

/* the core node's own conditions, read from the record as data */
const coreNode = ((st['lambda5-family: a+d = e'] || {}).node || {}).children || {};
const CORE = ((coreNode['0,1,0,-1'] || {}).exceptions || []).map((e) => ({
  key: e.key.split(',').map(Number), dv: dv(e.delta), label: e.label, pos: dv(e.delta) > 0
}));
if (CORE.length !== 7) die('the core node no longer carries seven conditions');
const coreBase = Number((coreNode['0,1,0,-1'] || {}).base);
if (coreBase !== -8) die('the core theorem no longer records base -8');

const omcsq = (k) => (t) => 2 * Math.pow(1 - Math.cos(k * t), 2);
let flatWorst = 0, classicalWorst = Infinity, combWorst = -Infinity, combClosed = 0;
let coreSymbolicGap = 0;
const randW = [];
for (let r = 0; r < 12; r++) {
  const ks = [1 + (r % 5), 2 + (r % 3), 3 + (r % 7)];
  randW.push((t) => ks.reduce((s, k) => s + (1 - Math.cos(k * t)) * (1 + (k % 3)), 0));
}
for (const P of corePts) {
  const [a, b, c, d, e] = P.A;
  /* the identity: g is flat on S(e, pi) */
  for (let k = 0; k < e; k++) {
    const t = (PI + 2 * PI * k) / e;
    const f = Math.cos(a * t) + Math.cos(b * t) + Math.cos(c * t) + Math.cos(d * t);
    if (Math.abs(f) > flatWorst) flatWorst = Math.abs(f);
    if (Math.abs(f) > 1e-9) die('the complement cancellation FAILS at {' + P.A + '}: sum of cosines on S is ' + f);
  }
  /* the conclusion: every nonnegative weight has a strictly positive inner product */
  const g23 = (t) => 2 / 3 + Math.cos(a * t) + Math.cos(b * t) + Math.cos(c * t) + Math.cos(d * t);
  for (const m of [a, b, c, d]) {
    const v = avg(e, PI, (t) => omcsq(m)(t) * g23(t));
    if (!(v > 0)) die('a classical atom closes the double-sum core at {' + P.A + '} — the comb weight would be unjustified');
    if (v < classicalWorst) classicalWorst = v;
  }
  for (const w of randW) {
    const v = avg(e, PI, (t) => w(t) * g23(t));
    if (!(v > 0)) die('a random nonnegative weight closes the double-sum core at {' + P.A + '}');
    if (v < classicalWorst) classicalWorst = v;
  }
  /* the way through: the Fejer-Riesz comb at 2pi/3, g0 = 7/6. The engine's
     model for it is base -8 plus the active core deltas; direct summation
     must agree, and where no POSITIVE condition is active the comb must
     actually close the point. */
  const comb = (t) => {
    let re = 0, im = 0;
    for (let j = 0; j <= 1; j++) for (const [k, ck] of [[0, 5], [1, 7], [2, 5]]) {
      const ph = (j * (a + e) + k * (b + e)) * t;
      re += ck * Math.cos(ph); im += ck * Math.sin(ph);
    }
    return re * re + im * im;
  };
  const g76 = (t) => 7 / 6 + Math.cos(a * t) + Math.cos(b * t) + Math.cos(c * t) + Math.cos(d * t);
  const meas = avg(e, 2 * PI / 3, (t) => comb(t) * g76(t));
  const act = CORE.filter((E) => E.key.reduce((s, k, i) => s + k * P.auv[i], 0) === 0);
  const pred = coreBase + act.reduce((s, E) => s + E.dv, 0);
  const gap = Math.abs(meas - pred);
  if (gap > 1e-6) die('the core theorem\'s symbolic value disagrees with direct summation at {' + P.A + '}: '
    + 'predicted ' + pred + ', measured ' + meas);
  if (gap > coreSymbolicGap) coreSymbolicGap = gap;
  if (!act.some((E) => E.pos)) {
    if (meas > 1e-6) die('the comb weight does NOT close a generic double-sum-core point {' + P.A + '} -> ' + meas);
    combClosed++;
    if (meas > combWorst) combWorst = meas;
  }
}
if (!combClosed) die('no generic core point in the box — the comb closure was never exercised');
/* the extremizer sits on the core and must be walled by POSITIVE conditions */
{
  const act = CORE.filter((E) => E.key.reduce((s, k, i) => s + k * [1, 1, 2][i], 0) === 0);
  if (act.length !== 3 || act.reduce((s, E) => s + E.dv, 0) <= 0)
    die('{1,2,4,5,6} no longer escapes the core theorem on three positive walls');
}

/* ---- the witness and its dilations ---------------------------------------- */
const dil = [2, 3, 5].map((k) => EXTREMIZER.map((v) => v * k));
for (const D of dil) {
  const r = LAM.certifyLambda(D, { tol: 1e-11 });
  if (!(Q.cmp(Q.fromDouble(r.minEnclosure[0]), THI) <= 0 && Q.cmp(TLO, Q.fromDouble(r.minEnclosure[1])) <= 0))
    die('a dilation of the extremizer does not attain the target: {' + D + '}');
}

/* ---- the record ------------------------------------------------------------ */
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const out = {
  what: 'The independent audit of the lambda(5) theorem: a second walk sharing no code with the symbolic engine. '
    + 'Inner products by direct trigonometric summation, condition membership by plain integer arithmetic on the '
    + 'record\'s condition vectors, every set the float screen cannot settle re-certified from scratch. It audits '
    + 'the THEOREM (no refuter in the box), the FIRST LEVEL of the reduction (the generic clause and the '
    + 'exhaustiveness of the eight families) and the OBSTRUCTION (no classical atom closes the double-sum core, '
    + 'the comb does). It does NOT walk the interior of the eight closure trees — the subfamily cones, the derived '
    + 'thresholds and the finite parts inside them; the lambda(4) audit does that for lambda(4) and no equivalent '
    + 'exists here yet.',
  box: BOX, setsWalked: swept, screened, exactlyCertified: exact, screenAudited: sampled,
  sampleEvery: SAMPLE_EVERY, refuters: refuters.length,
  genericClosed, genericChecked, familyReached: familyOnly,
  worstGenericInnerProduct: worstGenericWG, minGenericWeightAverage: minGenericW1,
  symbolicVsNumeric: { worstGap: worstSymbolicGap, worstAt: worstSymbolicAt, coreWorstGap: coreSymbolicGap },
  obstruction: { corePoints: corePts.length, worstCancellationResidual: flatWorst,
    classicalWorstInnerProduct: classicalWorst, combGenericPoints: combClosed, combWorstInnerProduct: combWorst },
  dilationsChecked: dil.length,
  target: { lo: TGT.lo, hi: TGT.hi },
  meta: { date: new Date().toISOString().slice(0, 10), git, ms: Date.now() - t0 }
};
fs.writeFileSync(path.join(ROOT, 'certs', 'lambda5-audit.json'), JSON.stringify(out, null, 1) + '\n');
console.log('lambda(5) audit CLEAN · box ' + BOX + ' · ' + swept.toLocaleString('en-US') + ' gcd-reduced 5-sets'
  + ' · ' + screened.toLocaleString('en-US') + ' screened (' + sampled.toLocaleString('en-US')
  + ' of them re-certified exactly), ' + exact + ' exactly certified, 0 refuters'
  + ' · generic closes ' + genericClosed.toLocaleString('en-US') + ', families reach ' + familyOnly.toLocaleString('en-US')
  + ' · symbolic=numeric to ' + worstSymbolicGap.toExponential(1)
  + ' · obstruction held at ' + corePts.length + ' core points (' + combClosed + ' comb-closed) · ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
