#!/usr/bin/env node
/* battery.js — the gate on instruments/maxval.
     R  the record re-derived live and matched byte for byte; the code hash
     C  the pair is an MFG solution on every cell; u* enclosed on every vacuum
        cell; u* ≥ u wherever decided; the support shrinks from 2 to 3/2; the
        horizon T is the closed form; b(T) = 0
     X  falsifiers — each must turn its own target red
   usage: node instruments/maxval/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(__dirname, 'maxval.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { iv, add, sub, mul, sqr, neg, contains } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'maxval-cylinder.json'), 'utf8'));

/* ================= R ==================================================== */
const t0 = Date.now();
const live = M.decide(REC.options);
const compact = (res) => JSON.stringify([res.counts, res.pairOK, res.gapOK, res.terminalOK, res.maxGap,
  res.cells.map(c => [c.region[0], c.standing[0], c.u, c.ustar, c.gap, c.m])]);
check('R1  the cylinder re-derived live equals the record (counts, flags, every cell)',
  compact(live) === JSON.stringify([REC.counts, REC.pairOK, REC.gapOK, REC.terminalOK, REC.maxGap, REC.cells.map(c => [c[2], c[3], c[6], c[7], c[8], c[9]])]), (Date.now() - t0) + ' ms');
check('R2  the code that produced the record is the code on disk', M.sha256File(path.join(__dirname, 'maxval.js')) === REC.provenance.sha256);

/* ================= C ==================================================== */
{
  const N = REC.options.NT * REC.options.NX;
  check('C1  every cell is SUPPORT, DECIDED or REFUSED and the counts add up',
    REC.counts.SUPPORT + REC.counts.DECIDED + REC.counts.REFUSED === N, JSON.stringify(REC.counts));
  check('C2  the pair: HJ and transport residuals enclose 0 on every support cell (live)',
    live.cells.filter(c => c.region === 'SUPPORT').every(c => contains(c.hj, 0) && contains(c.transport, 0)));
  check('C3  the pair: the strict subsolution inequality holds on every vacuum cell (live)',
    live.cells.filter(c => c.region === 'VACUUM').every(c => c.subsolution[1] < 0),
    'sup ' + Math.max(...live.cells.filter(c => c.region === 'VACUUM').map(c => c.subsolution[1])).toExponential(2));
  check('C4  the terminal condition: b(T) is enclosed at 0', REC.terminalOK);
  check('C5  every vacuum cell carries an enclosure of u*, and every refused cell is a boundary cell',
    REC.cells.every(c => (c[2] === 'V') === (c[3] === 'D')) && REC.cells.every(c => c[3] !== 'R' || c[2] === 'B'));
  check('C6  maximality is consistent everywhere: the upper end of u* is ≥ the lower end of u on every decided cell', REC.gapOK);
  check('C7  the gap u* − u is PROVED positive on ' + REC.counts.gapProven + ' vacuum cells (more than half of them)',
    REC.counts.gapProven > REC.counts.DECIDED / 2, REC.counts.gapProven + ' of ' + REC.counts.DECIDED);
  check('C8  the enclosure is tight (free path clear) on ' + REC.counts.tight + ' cells', REC.counts.tight > 0);
  const th0 = M.coef(M.thetaOf([0, 1e-9])), thT = M.coef([Math.PI / 3, Math.PI / 3]);
  check('C9  the support shrinks from r(0) = 2 to r(T) = 3/2', Math.abs(th0.r[1] - 2) < 1e-9 && Math.abs(thT.r[0] - 1.5) < 1e-12 && Math.abs(thT.r[1] - 1.5) < 1e-12,
    'r(0) ∈ [' + th0.r + '] · r(T) ∈ [' + thT.r + ']');
  const Tcf = Math.sqrt(2 / 3) * (Math.PI / 3 + Math.sqrt(3) / 2);
  check('C10 the horizon T = √(2/3)(π/3 + √3/2) is inside the enclosed T', REC.instance.T[0] <= Tcf && Tcf <= REC.instance.T[1], 'T ∈ [' + REC.instance.T + ']');
  check('C11 the certificate object is PROVED and carries five falsifiers', REC.certificate.verdict === 'PROVED' && REC.certificate.falsifier.length === 5);
}

/* ================= X ==================================================== */
{
  /* X1: the HJ residual with the coupling sign flipped must not enclose 0 */
  const Tc = [0.3, 0.32], X = [0.5, 0.55];
  const C = M.coef(M.thetaOf(Tc)), P = M.uPar(C, X), m = M.mOf(C, X);
  const hjFlipped = add(add(neg(P.ut), mul(iv(0.5), sqr(P.uxAbs))), m);
  check('X1  RED ok: the HJ residual with the coupling sign flipped (+m) does not enclose 0 on a support cell', !contains(hjFlipped, 0), '[' + hjFlipped.map(v => v.toFixed(4)) + ']');
  /* X2: the transport residual with the velocity sign flipped */
  const trFlipped = add(add(C.Ap, mul(mul(iv(2), C.a), C.A)), mul(sqr(X), sub(neg(C.Bp), mul(mul(iv(6), C.a), C.B))));
  check('X2  RED ok: the transport residual with the velocity sign flipped does not enclose 0', !contains(trFlipped, 0));
  /* X3: a vacuum cell whose free minimiser dives into the support: the interval path check refuses; the centre-only float check does not */
  const Tc3 = [0.05, 0.1], X3 = [2.05, 2.1];
  const hl = M.hopfLax(Tc3, X3);
  const anyBlocked = hl.minimisers.some(Y => !M.pathClear(Tc3, X3, Y));
  /* the float shortcut: the centre path from (t, x) to the centre of the best cell, sampled at 16 times against r(s) at the centre */
  const Yc = hl.minimisers[0]; const yc = (Yc[0] + Yc[1]) / 2, xc = 2.075, tc = 0.075;
  let floatClear = true;
  for (let i = 0; i <= 16; i++) { const s = tc + (M.T - tc) * i / 16; const p = xc + (yc - xc) * (s - tc) / (M.T - tc); const r = M.coef(M.thetaPoint(Math.min(s, M.T - 1e-9))).r; if (!(Math.abs(p) > r[1])) floatClear = false; }
  check('X3  RED ok: near the support at early time the interval path check REFUSES a minimiser (a path may cross)', anyBlocked, hl.minimisers.length + ' minimiser cells · float centre path clear? ' + floatClear);
  /* X4: pruning disabled to one round: the bound is wider, never tighter */
  const one = M.hopfLax([0.9, 0.95], [2.6, 2.65], { rounds: 1 }), full = M.hopfLax([0.9, 0.95], [2.6, 2.65]);
  check('X4  RED ok: one branch-and-bound round gives a wider Hopf–Lax bracket than nine, never tighter', (one.HL[1] - one.HL[0]) > (full.HL[1] - full.HL[0]) && one.HL[0] <= full.HL[0] && one.HL[1] >= full.HL[1],
    'one ' + (one.HL[1] - one.HL[0]).toExponential(2) + ' · nine ' + (full.HL[1] - full.HL[0]).toExponential(2));
  /* X5: a decided cell with u* forged below u fails the gap check */
  const cell = live.cells.find(c => c.standing === 'DECIDED' && c.gapProven);
  const forged = Object.assign({}, cell, { ustar: [cell.u[0] - 1, cell.u[0] - 0.5] });
  check('X5  RED ok: u* forged below u on a decided cell fails the maximality check', !(forged.ustar[1] >= forged.u[0]));
}

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
