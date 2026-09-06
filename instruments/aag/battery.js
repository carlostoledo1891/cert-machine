#!/usr/bin/env node
/* battery.js — the gate on instruments/aag.

     R  the record re-derived live and matched byte for byte; the code hash
     C  what is certified: refused cells contain exactly the three roots and
        nothing else, the refused length is 4/K at every budget, the density is
        zero exactly on the empty runs and enclosed on the occupied ones, the
        two value functions differ off the support and meet at x = 1, the
        boundary relations hold with the standings they claim, case 2 is
        positive over the whole γ box
     X  falsifiers — each must turn its own target red

   usage: node instruments/aag/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const A = require(path.join(__dirname, 'aag.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { iv, contains } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'aag-empty-region.json'), 'utf8'));

/* ================= R ==================================================== */
const t0 = Date.now();
const live = A.decide(REC.options);
check('R1  the record re-derived live equals the record (runs, tubes, ladder, boundaries, case 2)',
  JSON.stringify([live.case1, live.ladder, live.case2]) === JSON.stringify([REC.case1, REC.ladder, REC.case2]), (Date.now() - t0) + ' ms');
check('R2  the code that produced the record is the code on disk', A.sha256File(path.join(__dirname, 'aag.js')) === REC.provenance.sha256);

/* ================= C ==================================================== */
{
  const c1 = REC.case1, K = REC.options.K;
  const refusedRuns = c1.runs.filter(r => r.standing === 'REFUSED');
  check('C1  three refused runs, one around each exact root 1/12, 5/12, 3/4',
    refusedRuns.length === 3 && REC.roots.every(r => refusedRuns.some(q => q.x0 <= r && r <= q.x1)),
    refusedRuns.map(r => '[' + r.x0.toFixed(4) + ',' + r.x1.toFixed(4) + ']').join(' '));
  check('C2  the refused length is 4/K at every budget of the ladder (the root 3/4 sits on a cell edge and takes two cells)',
    REC.ladder.every(l => l.refused === 4 && Math.abs(l.refusedLength - 4 / l.K) < 1e-15 && l.refusedOK && l.rootsOK),
    REC.ladder.map(l => l.K + ':' + l.refusedLength).join(' '));
  check('C3  the density is exactly zero on every EMPTY cell and enclosed strictly positive on every OCCUPIED cell',
    c1.mTube.every(p => (p[3] === 'EMPTY' && p[1] === 0 && p[2] === 0) || (p[3] === 'OCCUPIED' && p[1] > 0) || p[3] === 'REFUSED'));
  check('C4  the empty region is {V < 0}: the two EMPTY runs are (1/12, 5/12) and (3/4, 1) up to one cell',
    (() => { const e = c1.runs.filter(r => r.standing === 'EMPTY'); return e.length === 2 && Math.abs(e[0].x0 - 1 / 12) <= 1 / K + 1e-12 && Math.abs(e[0].x1 - 5 / 12) <= 1 / K + 1e-12 && Math.abs(e[1].x0 - 0.75) <= 1 / K + 1e-12 && e[1].x1 === 1; })());
  const up0 = c1.uPlus[0], um0 = c1.uMinus[0];
  check('C5  the two value functions differ at x = 0 (u₊ > 0.45 > 0 > −0.45 > u₋) and both vanish at x = 1',
    up0[1] > 0.45 && um0[2] < -0.45 && c1.uPlus[K][1] === 0 && c1.uPlus[K][2] === 0, 'u₊(0) ∈ [' + up0[1].toFixed(4) + ', ' + up0[2].toFixed(4) + ']');
  check('C6  the weak-solution conditions (Definition 2.11) hold on every decided cell', c1.weak.ok);
  const b = c1.boundary;
  check('C7  case 1 boundary: inflow 0 = j₀ with m(0) > 0; u(1) = ψ = 0 (contact); exit flux exactly 0 — contact without exit',
    b.inflow.ok && b.V0[0] > 0 && b.relaxed.ok && b.noEntry.ok && b.contact.inContactSet && b.contact.exit === false && b.m1[0] === 0 && b.m1[1] === 0);
  const c2 = REC.case2;
  check('C8  case 2: density certified positive on every cell for every γ in the box', c2.mMin > 0 && c2.mTube.every(p => p[1] > 0), 'floor ' + c2.mMin.toFixed(5) + ' over γ ∈ [' + c2.gamma + ']');
  check('C9  case 2 boundary: inflow j₀ exactly; u(1) = ψ = 0 (contact); exit flux −j₀ < 0 — contact with exit',
    c2.boundary.inflow.ok && c2.boundary.noEntry.ok && c2.boundary.noEntry.flux[1] < 0 && c2.boundary.contact.exit === true);
  check('C10 case 2 value function decreasing from u(0) ∈ [0.9, 1.2] to u(1) = 0', c2.u[0][1] > 0.9 && c2.u[0][2] < 1.2 && c2.u[K][2] === 0);
  check('C11 the certificate object is PROVED and carries five falsifiers', REC.certificate.verdict === 'PROVED' && REC.certificate.falsifier.length === 5);
}

/* ================= X ==================================================== */
{
  const K = 256, h = 1 / K;
  /* X1: the float rule paints every root cell; the interval rule refuses them */
  const rootCells = A.ROOTS.map(r => Math.min(K - 1, Math.floor(r / h)));
  const floatPaints = rootCells.every(k => A.standingFloat((k + 0.5) * h) !== 'REFUSED');
  const intervalRefuses = rootCells.every(k => A.standing(A.V([k * h, (k + 1) * h], I.ZERO)) === 'REFUSED');
  check('X1  RED ok: the float rule (sign at the centre) paints every root cell; the interval rule refuses each', floatPaints && intervalRefuses);

  /* X2: a root removed from the list breaks the consistency check */
  const p = A.paint(K);
  const missing = p.cells.filter(c => c.standing === 'REFUSED').every(c => A.ROOTS.slice(0, 2).some(r => c.x0 <= r && r <= c.x1));
  check('X2  RED ok: with the root 3/4 deleted from the list, a refused cell contains no listed root', !missing);

  /* X3: ψ raised to 0.1 with j₀ = 0.1 — the complementarity product is 0.1 × (−0.1) ≠ 0 */
  const prod = I.mul(I.sub(iv(0.1), I.ZERO), I.neg(A.J0I));
  check('X3  RED ok: exit cost ψ = 0.1 with flux −j₀: the contact product is not 0 and must refuse', !contains(prod, 0), '[' + prod.map(v => v.toFixed(4)) + ']');

  /* X4: the cubic bracket shifted off the root fails the sign check */
  const br = A.rootPoint(-0.4, 0.1), w = br[1] - br[0];
  check('X4  RED ok: the cubic bracket shifted off the root fails the sign check',
    A.bracketOK(br[0], br[1], -0.4, 0.1) && !A.bracketOK(br[0] + 3 * w, br[1] + 3 * w, -0.4, 0.1) && !A.bracketOK(br[0] - 3 * w, br[1] - 3 * w, -0.4, 0.1));

  /* X5: j₀ forged to 0 at a cell where V < 0: no positive root; the bracket must be refused */
  let threw = false;
  try { A.rootPoint(-0.4, 0); } catch (e) { threw = true; }
  check('X5  RED ok: the cubic with j₀ = 0 at V = −0.4 has no positive root and the bracket is refused', threw);
}

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
