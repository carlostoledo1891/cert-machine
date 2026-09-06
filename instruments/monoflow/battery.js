#!/usr/bin/env node
/* battery.js — the gate on instruments/monoflow.

     R  the record re-derived live and matched byte for byte; the code hash
     C  what is certified: the control contains the closed form; the form
        returns c/2 on every instance; every certified pair has Im μ away from
        0; the NOT DECIDED instances carry only real eigenvalues; both radii
        (Galerkin, PDE) are finite and the densities positive
     X  falsifiers — each must turn its own target red

   usage: node instruments/monoflow/battery.js */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const M = require(path.join(__dirname, 'monoflow.js'));
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const { iv, contains } = I;

let checks = 0, fails = 0;
function check(name, cond, detail) {
  checks++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'monoflow-spectrum.json'), 'utf8'));

/* ================= R ==================================================== */
{
  const t = Date.now();
  const live = {};
  for (const i of REC.instances) {
    const inst = { sigma: i.sigma, c: i.c, A: i.A, N: i.N, nu: i.pde && i.pde.r ? undefined : undefined };
    if (i.branch === 'herding') inst.branch = 'herding';
    inst.nu = i.c < 0 ? 1.02 : 1.05;
    live[i.id] = M.decide(inst);
  }
  const strip = (x) => JSON.stringify([x.verdict, x.certified.map(p => p.mu), x.form.value, x.galerkin.maxRad, x.pde.r]);
  let same = true;
  for (const i of REC.instances) {
    const l = live[i.id];
    if (strip(l) !== JSON.stringify([i.verdict, i.certified.map(p => p.mu), i.form.value, i.galerkinRadius, i.pde.r])) same = false;
  }
  check('R1  all seven instances re-derived live equal the record (verdict, μ boxes, form, radii)', same, (Date.now() - t) + ' ms');
  check('R2  the code that produced the record is the code on disk', M.sha256File(path.join(__dirname, 'monoflow.js')) === REC.provenance.sha256);
  global.LIVE = live;
}

/* ================= C ==================================================== */
{
  const by = Object.fromEntries(REC.instances.map(i => [i.id, i]));
  const C1 = by.C1, cf = C1.control[0];
  const p = C1.certified[0];
  check('C1  control: the certified pair at (½, 1, 0) contains the closed-form mode-1 eigenvalue',
    cf.complex && p.mu[0][0] <= cf.re[1] && cf.re[0] <= p.mu[0][1] && p.mu[1][0] <= cf.im[1] && cf.im[0] <= p.mu[1][1],
    'Re ' + p.mu[0] + ' ∋ ' + cf.re + ' · Im ' + p.mu[1] + ' ∋ ' + cf.im);
  check('C2  the Lasry–Lions form returns c/2 from the assembled Jacobian on every instance',
    REC.instances.every(i => i.form.contains), REC.instances.map(i => i.id + ':' + i.form.value.map(v => v.toFixed(6))).join(' '));
  const dec = REC.instances.filter(i => i.verdict === 'NOT A GRADIENT FLOW');
  check('C3  five instances decided NOT A GRADIENT FLOW, each with Im μ bounded away from 0',
    dec.length === 5 && dec.every(i => i.certified.length && !(i.certified[0].mu[1][0] <= 0 && 0 <= i.certified[0].mu[1][1])),
    dec.map(i => i.id + ' Im ' + i.certified[0].mu[1][0].toFixed(4)).join(' · '));
  const und = REC.instances.filter(i => i.verdict === 'NOT DECIDED');
  check('C4  the two NOT DECIDED instances reached only real eigenvalues (|Im| < 1e-12) and claim nothing',
    und.length === 2 && und.every(i => i.certified.length === 0 && i.tried.every(t => Math.abs(t.mu[1]) < 1e-12)),
    und.map(i => i.id + ': ' + i.tried.length + ' real').join(' · '));
  check('C5  H0 (constant, c = −12): the closed form says real, with one positive eigenvalue — the flow leaves the constant state',
    by.H0.control[0].complex === false && by.H0.tried.some(t => t.mu[0] > 0));
  check('C6  monotone/not: c ≥ 0 exactly on C1, M1, M2, R1; c < 0 on H0, H1, H2',
    REC.instances.every(i => i.monotone === (i.c >= 0)));
  check('C7  both radii finite everywhere and every PDE density certified positive',
    REC.instances.every(i => i.galerkinRadius < 1e-10 && i.pde.r < 1e-9 && i.pde.minM > 0),
    'max r_G ' + Math.max(...REC.instances.map(i => i.galerkinRadius)).toExponential(1) + ' · min m ' + Math.min(...REC.instances.map(i => i.pde.minM)).toFixed(3));
  check('C8  the certified pair widths are below 1e-8', dec.every(i => i.certified[0].muWidth[0] < 1e-8 && i.certified[0].muWidth[1] < 1e-8));
  check('C9  the certificate objects: five PROVED, two NOT_CHECKED, all carrying five falsifiers',
    REC.instances.filter(i => i.certificate.verdict === 'PROVED').length === 5 && REC.instances.filter(i => i.certificate.verdict === 'NOT_CHECKED').length === 2
    && REC.instances.every(i => i.certificate.falsifier.length === 5));
}

/* ================= X ==================================================== */
{
  const L = global.LIVE;
  /* X1: a symmetric matrix must not yield a non-real pair */
  const n = 6, S = [];
  for (let i = 0; i < n; i++) { S[i] = []; for (let j = 0; j < n; j++) S[i][j] = iv(Math.cos(i * j + 1) + (i === j ? 3 : 0)); }
  const Sm = M.midM(S);
  const e = M.eigFloat(Sm, [3, 1]);
  const x1 = !e.ok || Math.abs(e.mu[1]) < 1e-9 || !(M.eigenBox(S, e).ok && M.eigenBox(S, e).nonReal);
  check('X1  RED ok: a symmetric matrix handed a complex shift yields no non-real pair', x1, e.ok ? 'reached μ = ' + e.mu.map(v => v.toFixed(6)) : 'no eigenpair reached');

  /* X2: the eigenpair certifier started 0.5 away from the eigenvalue */
  const { P, x } = M.candidate({ sigma: 0.5, c: 1, A: 1, N: 16 });
  const G = M.galerkinBox(P, x);
  const J = M.flowJacobian(P, G.box);
  const good = M.eigFloat(M.midM(J), [-20.26, 4.6]);
  const far = Object.assign({}, good, { mu: [good.mu[0] + 0.5, good.mu[1]] });
  check('X2  RED ok: the eigenpair certifier from a candidate 0.5 away returns no contraction', !M.eigenBox(J, far).ok);

  /* X3: the closed form with σ replaced by 1 − σ must be excluded by the control's box */
  const C1 = L.C1, p = C1.certified[0];
  const wrong = M.constantModeI(1 - 0.5, 1, 1);         /* σ = 0.5 -> 1 − σ = 0.5: the same! use σ = 0.4 instead */
  const wrong2 = M.constantModeI(0.4, 1, 1);
  const excluded = !(wrong2.complex && p.mu[1][0] <= wrong2.im[1] && wrong2.im[0] <= p.mu[1][1]);
  check('X3  RED ok: the closed form at a wrong σ (0.4) lies outside the certified pair', excluded, 'Im wrong ' + (wrong2.im ? wrong2.im.map(v => v.toFixed(4)) : 'real') + ' vs box ' + p.mu[1].map(v => v.toFixed(4)));
  void wrong;

  /* X4: the Galerkin certifier from a perturbed candidate */
  const xp = Float64Array.from(x); xp[1] += 1e-2; xp[P.N + 1] -= 1e-2;
  check('X4  RED ok: the Galerkin equilibrium certifier from a candidate perturbed by 1e-2 returns no contraction', !M.galerkinBox(P, xp).ok);

  /* X5: the Lasry–Llions form with a sign flipped in the assembly misses c/2 */
  const v1 = new Array(2 * P.N).fill(0); v1[0] = 1;
  const flipped = M.llForm(Object.assign({}, P, { c: -P.c }), G.box, v1);   /* the Jacobian at −c: must return −c/2, not c/2 */
  check('X5  RED ok: the form assembled with the coupling sign flipped does not return c/2', !contains(flipped, P.c / 2) && contains(flipped, -P.c / 2), flipped.map(v => v.toFixed(6)));
}

console.log(fails === 0 ? 'ALL PASS   (' + checks + ' checks, 5 red controls)' : fails + ' FAILED of ' + checks);
process.exit(fails === 0 ? 0 : 1);
