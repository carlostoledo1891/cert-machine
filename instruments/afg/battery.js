#!/usr/bin/env node
/* battery.js — the gate on instruments/afg.

   In the order a sceptic should read it:

     R  the RECORD is re-derived live at its own grid and must match byte for byte
        (restore-the-record: a drift in the code or the arithmetic refuses here,
        every run, before any page can carry the numbers)
     C  what is certified is what should be: the control hits the paper's
        closed form, the instance has a strictly positive current, both
        densities are certified positive, both value functions close
     X  falsifiers — each must turn its own target red

   usage: node instruments/afg/battery.js          (exit 0 and "ALL PASS" or nothing) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const A = require(path.join(__dirname, 'afg.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'quadrature.js'));
const { iv, sqr, contains } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}

const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'afg-enclosure.json'), 'utf8'));
const K = REC.grid;

/* ================= R · the record, re-derived ============================ */
const live = {};
for (const id of ['A', 'B']) {
  const t = Date.now();
  live[id] = A.enclose(id, K);
  const r = live[id], c = REC.cases[id];
  const same = r.ok && JSON.stringify([r.j, r.H, r.mMin, r.mMax, r.closure, r.uMean, r.mTube, r.uTube]) ===
    JSON.stringify([c.j, c.H, c.mMin, c.mMax, c.closure, c.uMean, c.mTube, c.uTube]);
  check('R' + id + '  case ' + id + ' re-derived live equals the record (boxes, floors, tubes)', same, (Date.now() - t) + ' ms');
}
check('R3  the code that produced the record is the code on disk',
  A.sha256File(path.join(__dirname, 'afg.js')) === REC.provenance.sha256
  && A.sha256File(path.join(ROOT, 'instruments', 'interval', 'quadrature.js')) === REC.provenance.quadratureSha256);

/* ================= C · what is certified ================================= */
{
  const a = live.A, b = live.B;
  check('C1  control: j is enclosed at 0 (|j| ≤ 1e-12)', a.ok && a.j[0] <= 0 && 0 <= a.j[1] && Math.max(-a.j[0], a.j[1]) <= 1e-12, '[' + a.j + ']');
  const cf = a.closedForm.H;
  check('C2  control: the closed form ln ∫e^V lies inside the enclosure of H̄', cf[0] >= a.H[0] && cf[1] <= a.H[1],
    'closed form [' + cf + '] ⊂ H̄ [' + a.H + ']');
  check('C3  control: H̄ enclosure width < 1e-7', a.HWidth < 1e-7, a.HWidth.toExponential(2));
  check('C4  instance: the current is certified strictly positive', b.ok && b.j[0] > 0, '[' + b.j + ']');
  check('C5  instance: H̄ and j enclosed to better than 1e-7', b.HWidth < 1e-7 && b.jWidth < 1e-7,
    'j ' + b.jWidth.toExponential(2) + ' · H ' + b.HWidth.toExponential(2));
  check('C6  both densities certified strictly positive', a.mMin > 0 && b.mMin > 0, a.mMin.toFixed(6) + ' · ' + b.mMin.toFixed(6));
  check('C7  both value functions close (∫u_x ∋ 0)', contains(a.closure, 0) && contains(b.closure, 0));
  check('C8  the control\'s value function is flat (u ≡ 0 within 1e-9)', a.uTube.every(p => Math.abs(p[1]) < 1e-9 && Math.abs(p[2]) < 1e-9));
  check('C9  the instance\'s value function is NOT flat (max |u| > 0.07)', Math.max(...b.uTube.map(p => Math.max(Math.abs(p[1]), Math.abs(p[2])))) > 0.07);
  const certA = A.certificate(a, {}), certB = A.certificate(b, {});
  check('C10 both certificate objects are PROVED and carry their falsifiers', certA.proved && certB.proved && certA.falsifier.length === 5);
}

/* ================= X · falsifiers ======================================== */
{
  const r = Q.midpoint01({ K: 8, fAt: c => sqr(iv(c)), f2On: () => iv(2), remainder: false });
  check('X1  RED ok: the quadrature with its remainder deleted misses ∫x² = 1/3', !contains(r, 1 / 3));

  const b = live.B;
  const br = A.invertPoint(0.1, b.x0[0]);
  const w = br[1] - br[0];
  check('X2  RED ok: a bracket shifted off the root fails the sign check', A.bracketOK(br[0], br[1], 0.1, b.x0[0])
    && !A.bracketOK(br[0] + 3 * w, br[1] + 3 * w, 0.1, b.x0[0]) && !A.bracketOK(br[0] - 3 * w, br[1] - 3 * w, 0.1, b.x0[0]));

  const t = Date.now();
  const far = A.enclose('B', { KF: 1024, KD: 256, KP: 32, x0: [b.x0[0] + 0.05, b.x0[1]], A: A.candidate(A.CASES.B, 512).A });
  check('X3  RED ok: Krawczyk from a candidate 0.05 away returns no contraction', !far.ok, (far.why || 'ok?!') + ' · ' + (Date.now() - t) + ' ms');

  const a = live.A, cf = a.closedForm.H;
  const shifted = [cf[0] + 1e-7, cf[1] + 1e-7];
  check('X4  RED ok: the closed form shifted by 1e-7 lies OUTSIDE the enclosure of H̄', shifted[0] > a.H[1] || shifted[1] < a.H[0]);

  const forged = A.certificate(Object.assign({}, b, { mMin: -1e-9 }), {});
  check('X5  RED ok: a forged density floor ≤ 0 is REFUSED', !forged.proved && /not strictly positive/.test(forged.why));
  const open = A.certificate(Object.assign({}, b, { closure: [1e-3, 2e-3] }), {});
  check('X6  RED ok: a value function that does not close is REFUSED', !open.proved && /periodic/.test(open.why));
}

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 6 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
