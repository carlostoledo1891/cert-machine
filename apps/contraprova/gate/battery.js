/* battery.js — the Contraprova gate's battery. apps/contraprova · cert-machine

   GREEN: each of the nine demonstrator proposals gets the verdict its
   scenario states; the refusal publishes a pump-pressure threshold the second
   proposal sits inside (so that proposal's story stays true); decide() is
   deterministic; and at the 64 corners and 24 random inputs of each of two operating points the gate's thin-box
   interval CONTAINS the value of reference.py — a second implementation in
   Python's decimal module at 50 digits, sharing no code — and so does the
   whole-box enclosure.
   RED: forgeries changed by the smallest breaking amount must not pass — a
   claim a tenth of a bar outside the enclosure, a manifold off by 1 m³/d, a
   friction factor just outside the proved solutions, a velocity just outside
   Q/A, a flow just below the turbulent regime, a limit lowered under a proved
   violating corner, and a "gate" that evaluates the float model at the box
   centre (what a point pipeline does), which the reference must catch.

   usage: node apps/contraprova/gate/battery.js                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const F = require('./flowline.js');
const S = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenarios.json'), 'utf8'));

let pass = 0, fail = 0, reds = 0, redsFired = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('FAIL: ' + m); } };
const red = (c, m) => { reds++; if (c) redsFired++; else console.error('RED CONTROL DID NOT FIRE: ' + m); ok(c, 'red: ' + m); };

/* ---- green: the nine proposals ---- */
const R = {};
for (const c of S.cases) {
  R[c.id] = F.decide(c.proposal, S.box, S.rules);
  ok(R[c.id].verdict === c.expect, c.id + ' expected ' + c.expect + ', got ' + R[c.id].verdict);
}
ok(R['ia-mais-4-2'].flip.pdGreen >= Number(S.cases[1].proposal.Pd), 'the refusal\'s green threshold must admit the second proposal\'s pump pressure');
ok(R['ia-mais-4-2'].checks.some((c) => c.id === 'limite' && /dois lados, ambos provados/.test(c.text)), 'the refusal must rest on two proved witnesses');
ok(JSON.stringify(F.decide(S.cases[0].proposal, S.box, S.rules)) === JSON.stringify(R['ia-mais-4-2']), 'decide() is deterministic');

/* ---- green: containment against the second implementation ---- */
const B = F.box(S.box);
const K = F.DIMS;
const fmt = (x) => x.toPrecision(12);
let seed = 20260930; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pts = [];
for (const [Q, Pd] of [['6000', '180'], ['7000', '206']]) {
  for (let m = 0; m < 64; m++) { const p = { Q, Pd }; K.forEach((k, i) => { p[k] = S.box[k][(m >> i) & 1]; }); pts.push(p); }
  for (let j = 0; j < 24; j++) { const p = { Q, Pd }; for (const k of K) { const a = Number(S.box[k][0]), b = Number(S.box[k][1]); p[k] = fmt(a + (b - a) * rnd()); } pts.push(p); }
}
const ref = JSON.parse(cp.execFileSync('python3', [path.join(__dirname, 'reference.py')], { input: JSON.stringify(pts), encoding: 'utf8' }));
const env = {};
for (const [Q, Pd] of [['6000', '180'], ['7000', '206']]) env[Q] = F.envelope(B, F.dec(Q), F.dec(Pd), 7).env;
let inThin = 0, inEnv = 0, worst = Infinity;
pts.forEach((p, i) => {
  const thin = {}; for (const k of K) thin[k] = F.dec(p[k]);
  const P = F.wellhead(thin, F.dec(p.Q), F.dec(p.Pd)).P, r = Number(ref[i]);
  if (P[0] <= r && r <= P[1]) inThin++;
  if (env[p.Q][0] <= r && r <= env[p.Q][1]) inEnv++;
  worst = Math.min(worst, r - P[0], P[1] - r);
});
ok(inThin === pts.length, 'the thin-box interval contains the reference at ' + inThin + ' of ' + pts.length + ' inputs');
ok(inEnv === pts.length, 'the whole-box enclosure contains the reference at ' + inEnv + ' of ' + pts.length + ' inputs');

/* ---- red: forgeries by the smallest breaking amount ---- */
const base = S.cases.find((c) => c.id === 'massa').proposal;
const E = R.massa.enclosure;
const tweak = (o) => JSON.parse(JSON.stringify(Object.assign({}, base, o)));
red(F.decide(tweak({ claim: { Pwh: (E[1] + 0.1).toFixed(1) }, split: undefined }), S.box, S.rules).verdict === F.REFUTADO, 'a claim 0.1 bar above the enclosure');
red(F.decide(tweak({ claim: { Pwh: (E[0] - 0.1).toFixed(1) }, split: undefined }), S.box, S.rules).verdict === F.REFUTADO, 'a claim 0.1 bar below the enclosure');
red(F.decide(tweak({ split: { header: '12000', wells: ['6000', '5999'] } }), S.box, S.rules).verdict === F.REFUTADO, 'a manifold off by 1 m³/d');
const colebrook = R.instabilidade.checks.find((c) => c.id === 'colebrook').text.match(/\[([\d,]+); ([\d,]+)\]/);
const fLo = Number(colebrook[1].replace(',', '.')), fHi = Number(colebrook[2].replace(',', '.'));
red(F.decide(tweak({ claim: { Pwh: '344', f: (fLo - 0.0001).toFixed(5) }, split: undefined }), S.box, S.rules).verdict === F.REFUTADO, 'a friction factor 1e-4 below the proved solutions');
red(F.decide(tweak({ claim: { Pwh: '344', f: (fHi + 0.0001).toFixed(5) }, split: undefined }), S.box, S.rules).verdict === F.REFUTADO, 'a friction factor 1e-4 above the proved solutions');
const vHi = F.kinematics(B, F.dec(base.Q)).v[1];
red(F.decide(tweak({ claim: { Pwh: '344', v: (Math.ceil(vHi * 100) / 100 + 0.01).toFixed(2) }, split: undefined }), S.box, S.rules).verdict === F.REFUTADO, 'a velocity 0.01 m/s above Q/A');
const qMin = R.dominio.flip.qMin;
red(F.decide(tweak({ Q: String(qMin - 1), claim: { Pwh: '391' }, split: undefined }), S.box, S.rules).verdict === F.RECUSADO, 'a flow 1 m³/d below the turbulent regime');
ok(F.decide(tweak({ Q: String(qMin), claim: { Pwh: '391' }, split: undefined }), S.box, S.rules).checks.find((c) => c.id === 'dominio').verdict === F.PROVADO, 'the published flow threshold does decide the domain');
const W = F.corners(B, F.dec('7000'), F.dec('200'), -Infinity);
red(F.decide(S.cases[1].proposal, S.box, { PwhMax: String(Math.floor(W.above.P[0] - 0.5)), vMax: S.rules.vMax }).verdict !== F.PROVADO, 'a limit lowered under a proved violating corner');
/* a "gate" that evaluates the float model at the box centre and calls it the answer */
const mid = {}; for (const k of K) mid[k] = (B[k][0] + B[k][1]) / 2;
const centre = F.pointP(mid, 7000, 206);
const caught = pts.some((p, i) => p.Q === '7000' && Math.abs(Number(ref[i]) - centre) > 1e-6);
red(caught, 'a point estimate at the box centre, passed off as the answer, is caught at the corners');

console.log('contraprova gate battery: ' + pass + ' pass, ' + fail + ' fail, ' + redsFired + '/' + reds + ' red controls fired; reference agreement at '
  + pts.length + ' inputs, tightest margin ' + worst.toExponential(1) + ' bar');
process.exit(fail ? 1 : 0);
