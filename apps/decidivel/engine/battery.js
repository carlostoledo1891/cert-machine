/* battery.js — Decidível's battery. apps/decidivel · cert-machine

   GREEN: at 200 random inputs the engine's thin-point interval CONTAINS the
   value of reference.py, and its two factors (density, modulus) the reference's parts (Python decimal at 50 digits, the textbook Gassmann
   form, the ratio taken directly — no shared code, no difference form); the
   proved extremes of 24 random sub-boxes contain the reference at every one of
   12 points drawn inside each; every witness holds a point of its DECLARED box
   (the decimals as exact rationals, compared with the witness's doubles as
   exact rationals, in arithmetic of this file's own) and its interval
   contains the reference there; a soft, porous, gas-rich box is PROVADO, a
   tight stiff one REFUTADO, the headline RECUSADO with a proved witness on
   each side; decide() is deterministic.
   RED: a Monte Carlo feasibility study (1,000 seeded draws) that finds every
   draw detectable and calls the box PROVADO is refused — the engine returns a
   model the draws missed, proved below the threshold; a point estimate at the
   box centre passed off as "the change" is caught by the witnesses; porosity
   above the critical porosity and an oil saturation driven negative are
   refused as outside the domain; a threshold one hundredth of a percent above
   a proved upper bound is REFUTADO, one below a proved lower bound PROVADO; a
   witness with one coordinate at the widened double beside a declared end (one
   double outside the declared box, where the witnesses sat until 2026-11-11)
   is refused by the engine's exact membership check, and so is a fat box.

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

/* ---- exact arithmetic of this file's own (BigInt pairs), sharing nothing with the engine: a declared decimal and a
   double, each as the rational it is ---- */
const ratDec = (s) => { const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(s)); if (!m) throw new Error('battery: not a plain decimal: ' + s); const f = m[3] || ''; return [BigInt(m[2] + f) * (m[1] ? -1n : 1n), 10n ** BigInt(f.length)]; };
const ratDbl = (x) => {
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x);
  const bits = dv.getBigUint64(0), neg = bits >> 63n, e = Number((bits >> 52n) & 0x7ffn), f = bits & ((1n << 52n) - 1n);
  if (e === 0x7ff) throw new Error('battery: not a finite double');
  const m = (e === 0 ? f : f | (1n << 52n)) * (neg ? -1n : 1n), ex = (e === 0 ? 1 : e) - 1075;
  return ex >= 0 ? [m * (1n << BigInt(ex)), 1n] : [m, 1n << BigInt(-ex)];
};
const rcmp = (a, b) => { const l = a[0] * b[1], r = b[0] * a[1]; return l < r ? -1 : l > r ? 1 : 0; };
/* the coordinates at which a witness (a point or a thin box per dimension) holds NO point of the declared box */
const outsideB = (decl, at) => R.DIMS.filter((k) => !(rcmp(ratDbl(at[k][0]), ratDec(decl[k][1])) <= 0 && rcmp(ratDbl(at[k][1]), ratDec(decl[k][0])) >= 0));

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
let coordsOut = 0;
G.forEach((g, b) => { for (const w of [g.wmin, g.wmax]) { if (!w) continue; const p = {}; for (const k of R.DIMS) p[k] = String((w.B[k][0] + w.B[k][1]) / 2); const out = outsideB(sub[b], w.B).length; coordsOut += out; wpts.push(p); wr.push({ r: w.r, inBox: out === 0 }); } });
const refW = refOf(wpts);
refW.forEach((v, i) => { if (wr[i].inBox && wr[i].r[0] <= v * (1 + 1e-12) && v * (1 - 1e-12) <= wr[i].r[1]) witOk++; });
ok(witOk === wpts.length, 'witnesses hold a point of their DECLARED box (exact rationals) and enclose the reference: ' + witOk + ' of ' + wpts.length + (coordsOut ? ' — ' + coordsOut + ' coordinates outside the declared box' : ''));

/* ---- green: the attributes — the density factor and the modulus factor, against the reference's parts ---- */
{
  const parts = JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'reference.py'), '--parts'], { input: JSON.stringify(pts), encoding: 'utf8' }));
  let okA = 0, okB = 0;
  pts.forEach((p, i) => { const c = R.coreD(thin(p)); const A = Number(parts[i][1]), Bm = Number(parts[i][2]); if (c.A.v[0] <= A && A <= c.A.v[1]) okA++; if (c.Bm.v[0] <= Bm && Bm <= c.Bm.v[1]) okB++; });
  ok(okA === pts.length && okB === pts.length, 'the density and modulus factors contain the reference at ' + okA + ' and ' + okB + ' of ' + pts.length);
  /* Gassmann leaves G alone, so Is² changes by the density factor only and (Vp/Vs)² by the modulus factor only: their product is r */
  const c = R.coreD(thin(pts[0])); const prod = c.A.v[0] * c.Bm.v[0], r = R.changeD(thin(pts[0])).v;
  ok(prod <= r[1] * (1 + 1e-12) && r[0] * (1 - 1e-12) <= c.A.v[1] * c.Bm.v[1], 'the two factors multiply back to r');
}

/* ---- green: three verdicts on declared boxes ---- */
const soft = Object.assign({}, D.box, D.scenarios.K4.mod, { phi: ['0.24', '0.25'], dSg: ['0.44', '0.47'] });
ok(R.decide(soft, { theta: '0.005' }, { noPrice: true }).verdict === R.PROVADO, 'a soft, porous, gas-rich box at 0.5% is PROVADO');
const tight = Object.assign({}, D.box, { phi: ['0.002', '0.004'], s: ['0.85', '0.90'], dSg: ['0.01', '0.02'] });
ok(R.decide(tight, { theta: '0.03' }, { noPrice: true }).verdict === R.REFUTADO, 'a tight, stiff box with little gas at 3% is REFUTADO');
const H = Object.assign({}, D.box, { phi: D.headline.phi, dSg: D.headline.dSg });
const hr = R.decide(H, { theta: D.headline.theta }, { noPrice: true });
ok(hr.verdict === R.RECUSADO && hr.witnesses.det && hr.witnesses.und, 'the headline is RECUSADO with a proved witness on each side');
ok(JSON.stringify(R.decide(H, { theta: D.headline.theta }, { noPrice: true })) === JSON.stringify(hr), 'decide() is deterministic');
{
  /* the headline's two witnesses hold a point of the declared box, exactly; so do the witnesses of its proved range */
  const A = R.absRange(R.box(H), { budget: 12000 });
  const ws = [['detectable', hr.witnesses.det && hr.witnesses.det.at], ['undetectable', hr.witnesses.und && hr.witnesses.und.at], ['range, smallest', A.wmin && A.wmin.B], ['range, largest', A.wmax && A.wmax.B]];
  const outs = ws.map(([n, at]) => [n, at ? outsideB(H, at) : ['absent']]);
  ok(outs.every(([, o]) => o.length === 0), 'the headline witnesses hold a point of the declared box, exactly' + outs.filter(([, o]) => o.length).map(([n, o]) => ' — ' + n + ': ' + o.length + ' of ' + R.DIMS.length + ' coordinates outside (' + o.join(', ') + ')').join(''));
}

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
/* ---- red: the sign of the change, sold as guaranteed ---- */
{
  const HK = Object.assign({}, D.box, { phi: D.headline.phi, dSg: D.headline.dSg });
  const S = R.signDensity(HK, { budget: 300 });
  const lightest = Number(D.box.rhoo[0]);
  /* "gas replacing oil always softens": refused — at a gas density the declared range admits, a proved model GAINS impedance; and never below the lightest admissible oil */
  red(S.rhoFlip !== null && S.witness && S.witness.r[0] > 1 && S.rhoFlip >= lightest, 'a proved model gains impedance at gas density ' + S.rhoFlip + ' g/cm³ (≥ the lightest oil, ' + lightest + '): the sign is not guaranteed');
}
/* ---- green: a record written beside the submitted one is this engine's ----
   data/decidivel-ledger.json is the record of the submitted page and is gated by build.js; it may pin an earlier engine.
   Every other ledger in data/ (run.js --out) must pin the engine and the declared ranges on disk, its headline receipt
   must re-decide identically, and its witnesses must hold a point of the declared box, exactly. */
{
  const crypto = require('crypto');
  const ROOT = path.join(__dirname, '..', '..', '..'), DATA = path.join(__dirname, '..', 'data');
  const shaOf = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
  for (const f of fs.readdirSync(DATA).filter((x) => /^decidivel-ledger-.+\.json$/.test(x)).sort()) {
    const L = JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));
    const pinned = Object.entries(L.engine).every(([rel, h]) => shaOf(rel) === h) && shaOf(L.declared.file) === L.declared.sha256;
    const again = pinned && JSON.stringify(R.decide(L.headline.box, { theta: L.headline.theta }, { noPrice: true, budget: L.budget })) === JSON.stringify(L.headline.receipt);
    const ws = Object.values(L.headline.receipt.witnesses || {}).filter(Boolean);
    const inB = ws.length > 0 && ws.every((w) => outsideB(L.headline.box, w.at).length === 0 && R.witnessInBox(L.headline.box, w.at) === null);
    ok(pinned && again && inB, 'data/' + f + ': ' + (pinned ? 'pins the engine and the ranges on disk' : 'DOES NOT pin the engine or the ranges on disk (run apps/decidivel/run.js --out data/' + f + ')') + '; headline receipt ' + (again ? 're-decided identical' : 'NOT re-decided identical') + '; witnesses ' + (inB ? 'inside' : 'NOT inside') + ' the declared box');
  }
}
/* ---- red: a witness outside the declared box ---- */
{
  const has = typeof R.witnessInBox === 'function';
  const at = hr.witnesses.und ? hr.witnesses.und.at : null, Bp = R.box(H);
  /* the declared ends that are not doubles: there the double hull's end is one double outside the declared box */
  const widened = R.DIMS.filter((k) => rcmp(ratDbl(Bp[k][1]), ratDec(H[k][1])) > 0);
  const k = widened[0];
  /* that end, as a point coordinate: where the engine's witnesses sat before 2026-11-11 */
  const moved = at && k ? Object.assign({}, at, { [k]: [Bp[k][1], Bp[k][1]] }) : null;
  const why = has && moved ? R.witnessInBox(H, moved) : null;
  red(has && at && R.witnessInBox(H, at) === null && moved && outsideB(H, moved).join() === k && typeof why === 'string' && why.includes(k),
    'a witness with ' + k + ' at the widened double ' + (k ? Bp[k][1] : '') + ' (declared end ' + (k ? H[k][1] : '') + ') is refused by the exact membership check' + (why ? ': ' + why : ''));
  /* a fat box meets the declared box but is no witness: refused for its width */
  const fat = at && k ? Object.assign({}, at, { [k]: [Number(H[k][0]), Number(H[k][1])] }) : null;
  red(has && fat && typeof R.witnessInBox(H, fat) === 'string', 'a "witness" that is a whole interval of ' + k + ' is refused: a witness is a point or a two-double box');
}
/* ---- red: outside the domain ---- */
red(R.decide(Object.assign({}, H, { phi: ['0.38', '0.42'] }), { theta: '0.015' }, { noPrice: true }).checks[0].id === 'dominio' && R.decide(Object.assign({}, H, { phi: ['0.38', '0.42'] }), { theta: '0.015' }, { noPrice: true }).verdict === R.RECUSADO, 'porosity reaching the critical porosity is refused');
red(R.decide(Object.assign({}, H, { dSg: ['0.70', '0.85'] }), { theta: '0.015' }, { noPrice: true }).verdict === R.RECUSADO, 'a gas saturation that drives oil negative is refused');

console.log('decidivel battery: ' + pass + ' pass, ' + fail + ' fail, ' + fired + '/' + reds + ' red controls fired; reference agreement at ' + (pts.length + inner.length + wpts.length) + ' inputs, tightest margin ' + worst.toExponential(1));
process.exit(fail ? 1 : 0);
