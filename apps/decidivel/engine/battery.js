/* battery.js — Decidível's battery. apps/decidivel · cert-machine

   GREEN: at 200 random inputs the engine's thin-point interval CONTAINS the
   value of reference.py (Python decimal at 50 digits, the textbook Gassmann
   form, the ratio taken directly — no shared code, no difference form); the
   proved extremes of 24 random sub-boxes contain the reference at every one of
   12 points drawn inside each; every witness lies in its box and its interval
   contains the reference there; a soft, porous, gas-rich box is PROVADO, a
   tight stiff one REFUTADO, the headline RECUSADO with a proved witness on
   each side; decide() is deterministic.
   RED: a Monte Carlo feasibility study (1,000 seeded draws) that finds every
   draw detectable and calls the box PROVADO is refused — the engine returns a
   model the draws missed, proved below the threshold; a point estimate at the
   box centre passed off as "the change" is caught by the witnesses; porosity
   above the critical porosity and an oil saturation driven negative are
   refused as outside the domain; a threshold one hundredth of a percent above
   a proved upper bound is REFUTADO, one below a proved lower bound PROVADO.

   usage: node apps/decidivel/engine/battery.js                            MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const R = require('./rockphys.js');
const D = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'declared.json'), 'utf8'));

let pass = 0, fail = 0, reds = 0, fired = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };
const red = (c, m) => { reds++; if (c) fired++; else console.error('RED CONTROL DID NOT FIRE: ' + m); ok(c, 'red: ' + m); };
let seed = 20260930; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const BASE = Object.assign({}, D.box, { phi: ['0.02', '0.30'], dSg: ['0.02', '0.45'], dSw: ['0', '0.05'] });
const draw = (b) => { const p = {}; for (const k of R.DIMS) { const a = Number(b[k][0]), c = Number(b[k][1]); p[k] = (a + (c - a) * rnd()).toPrecision(12); } return p; };
const thin = (p) => { const B = {}; for (const k of R.DIMS) B[k] = R.dec(p[k]); return B; };
const refOf = (pts) => JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'reference.py')], { input: JSON.stringify(pts), encoding: 'utf8' })).map(Number);

/* ---- green: the second implementation, point by point ---- */
const pts = Array.from({ length: 200 }, () => draw(BASE));
const ref = refOf(pts);
let inside = 0, worst = Infinity;
pts.forEach((p, i) => { const r = R.changeD(thin(p)).v; if (r[0] <= ref[i] && ref[i] <= r[1]) inside++; worst = Math.min(worst, ref[i] - r[0], r[1] - ref[i]); });
ok(inside === pts.length, 'thin-point intervals contain the reference at ' + inside + ' of ' + pts.length);

/* ---- green: proved extremes are bounds, witnesses are real ---- */
let boxesOk = 0, witOk = 0, nBox = 24;
const sub = [];
for (let b = 0; b < nBox; b++) {
  const s = {};
  for (const k of R.DIMS) { const a = Number(BASE[k][0]), c = Number(BASE[k][1]); if (a === c) { s[k] = BASE[k]; continue; } const u = a + (c - a) * rnd(), v = a + (c - a) * rnd(); s[k] = [Math.min(u, v).toPrecision(8), Math.max(u, v).toPrecision(8)]; }
  if (R.domain(R.box(s))) { nBox--; continue; }
  sub.push(s);
}
const inner = [], owners = [];
sub.forEach((s, b) => { for (let j = 0; j < 12; j++) { inner.push(draw(s)); owners.push(b); } });
const refIn = refOf(inner);
const G = sub.map((s) => R.range(R.box(s), { budget: 3000 }));
const bad = new Set();
inner.forEach((p, j) => { const g = G[owners[j]]; if (!(g.L <= refIn[j] && refIn[j] <= g.U)) bad.add(owners[j]); });
boxesOk = sub.length - bad.size;
ok(boxesOk === sub.length, 'proved extremes contain the reference inside ' + boxesOk + ' of ' + sub.length + ' random boxes');
const wpts = [], wr = [];
G.forEach((g, b) => { for (const w of [g.wmin, g.wmax]) { if (!w) continue; const p = {}; for (const k of R.DIMS) p[k] = String((w.B[k][0] + w.B[k][1]) / 2); const B = R.box(sub[b]); const inBox = R.DIMS.every((k) => B[k][0] <= w.B[k][0] && w.B[k][1] <= B[k][1]); wpts.push(p); wr.push({ r: w.r, inBox }); } });
const refW = refOf(wpts);
refW.forEach((v, i) => { if (wr[i].inBox && wr[i].r[0] <= v * (1 + 1e-12) && v * (1 - 1e-12) <= wr[i].r[1]) witOk++; });
ok(witOk === wpts.length, 'witnesses lie in their box and enclose the reference: ' + witOk + ' of ' + wpts.length);

/* ---- green: three verdicts on declared boxes ---- */
const soft = Object.assign({}, D.box, D.scenarios.K4.mod, { phi: ['0.24', '0.25'], dSg: ['0.44', '0.47'] });
ok(R.decide(soft, { theta: '0.005' }, { noPrice: true }).verdict === R.PROVADO, 'a soft, porous, gas-rich box at 0.5% is PROVADO');
const tight = Object.assign({}, D.box, { phi: ['0.002', '0.004'], s: ['0.85', '0.90'], dSg: ['0.01', '0.02'] });
ok(R.decide(tight, { theta: '0.03' }, { noPrice: true }).verdict === R.REFUTADO, 'a tight, stiff box with little gas at 3% is REFUTADO');
const H = Object.assign({}, D.box, { phi: D.headline.phi, dSg: D.headline.dSg });
const hr = R.decide(H, { theta: D.headline.theta }, { noPrice: true });
ok(hr.verdict === R.RECUSADO && hr.witnesses.det && hr.witnesses.und, 'the headline is RECUSADO with a proved witness on each side');
ok(JSON.stringify(R.decide(H, { theta: D.headline.theta }, { noPrice: true })) === JSON.stringify(hr), 'decide() is deterministic');

/* ---- red: Monte Carlo feasibility, refused ---- */
{
  const HK = Object.assign({}, H, D.scenarios.K3.mod), hb = R.box(HK);
  let mcMin = Infinity; const draws = [];
  for (let i = 0; i < 1000; i++) { const p = draw(HK); const q = {}; for (const k of R.DIMS) q[k] = Number(p[k]); const v = Math.abs(Math.sqrt(R.pointR(q)) - 1) * 100; draws.push(v); mcMin = Math.min(mcMin, v); }
  const thetaMC = (mcMin * 0.999).toFixed(4);                        /* every draw is at or above it */
  const mcSays = draws.every((v) => v >= Number(thetaMC)) ? R.PROVADO : R.RECUSADO;
  const eng = R.decideBox(hb, String(Number(thetaMC) / 100), { budget: 12000 });
  red(mcSays === R.PROVADO && eng.verdict !== R.PROVADO && eng.und, 'a Monte Carlo "detectable in all 1,000 draws" at ' + thetaMC + '% is refused with a proved model below it');
}
/* ---- red: a point estimate passed off as the answer ---- */
{
  const c = {}; for (const k of R.DIMS) c[k] = (Number(H[k][0]) + Number(H[k][1])) / 2;
  const centre = Math.abs(Math.sqrt(R.pointR(c)) - 1) * 100;
  const A = R.absRange(R.box(H), { budget: 12000 });
  red(A.loA !== null && A.hiA !== null && (A.loA < centre - 0.1 || A.hiA > centre + 0.1), 'the centre value ' + centre.toFixed(2) + '% is not "the change": witnesses at ' + (A.loA || 0).toFixed(2) + '% and ' + A.hiA.toFixed(2) + '%');
  red(R.classifyAbs(A, A.hi + 0.01) === R.REFUTADO, 'a threshold just above the proved upper bound is REFUTADO');
  red(A.lo <= 0 || R.classifyAbs(A, A.lo - 0.01) === R.PROVADO, 'a threshold just below the proved lower bound is PROVADO');
}
/* ---- red: outside the domain ---- */
red(R.decide(Object.assign({}, H, { phi: ['0.38', '0.42'] }), { theta: '0.015' }, { noPrice: true }).checks[0].id === 'dominio' && R.decide(Object.assign({}, H, { phi: ['0.38', '0.42'] }), { theta: '0.015' }, { noPrice: true }).verdict === R.RECUSADO, 'porosity reaching the critical porosity is refused');
red(R.decide(Object.assign({}, H, { dSg: ['0.70', '0.85'] }), { theta: '0.015' }, { noPrice: true }).verdict === R.RECUSADO, 'a gas saturation that drives oil negative is refused');

console.log('decidivel battery: ' + pass + ' pass, ' + fail + ' fail, ' + fired + '/' + reds + ' red controls fired; reference agreement at ' + (pts.length + inner.length + wpts.length) + ' inputs, tightest margin ' + worst.toExponential(1));
process.exit(fail ? 1 : 0);
