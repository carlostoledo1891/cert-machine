#!/usr/bin/env node
/* battery.js — the keller instrument's gate.

   Calibration against cases with known answers: a triangular automorphism
   whose determinant is 1 by construction, a map whose determinant is visibly
   nonconstant, and the Alpöge counterexample itself (det -2, three exact
   collisions — the loudest known answer in the field right now).

   Red controls: one perturbed coefficient, one forged collision point, one
   duplicated point. Each must be REFUTED by the exact audit; a battery whose
   controls cannot fire is decoration. */
'use strict';

const K = require('#instruments/keller/keller.js');
const Q = require('#instruments/interval/rational.js');
const FAM = require('#families/keller-audit.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

/* ---- calibration: a triangular automorphism has det exactly 1 ---- */
{
  const n = 3;
  const x = K.pvar(0, n), y = K.pvar(1, n), z = K.pvar(2, n);
  /* (x + y^2, y + z^3, z) — elementary, injective, det J = 1 */
  const F = [K.padd(x, K.ppow(y, 2, n)), K.padd(y, K.ppow(z, 3, n)), z];
  const D = K.pdet(K.jacobian(F, n));
  ok(K.pIsConst(D) && Q.cmp(K.pConstVal(D), Q.R(1n)) === 0,
    'triangular automorphism: det J = 1 as a polynomial identity');
}

/* ---- calibration: a nonconstant determinant is reported nonconstant ---- */
{
  const n = 3;
  const x = K.pvar(0, n), y = K.pvar(1, n), z = K.pvar(2, n);
  const F = [K.ppow(x, 2, n), y, z];                       /* det = 2x */
  const a = K.audit({ F, det: Q.R(2n), collisions: [], image: [] });
  ok(a.verdict === 'REFUTED' && /NOT constant/.test(a.why),
    'x^2 map: det J = 2x is refuted as nonconstant (' + a.why.slice(0, 46) + '…)');
}

/* ---- the Alpöge counterexample, dimensions 3 and 5 ---- */
let claim3 = null;
{
  for (const i of [0, 2]) {                                 /* n = 3 and n = 5 */
    const o = FAM.enumerate(i);
    if (i === 0) claim3 = o.claim;
    const v = FAM.value(o);
    ok(FAM.interesting(o, v), 'n=' + o.n + ': float screen passes (sampled |det+2| = ' + v.toExponential(1) + ')');
    const c = FAM.certify(o);
    ok(c.verdict === 'HIT' && c.enclosure[0] === -2 && c.enclosure[1] === -2,
      'n=' + o.n + ': VERIFIED — det J = -2 identically, 3 exact collisions; the Jacobian conjecture is false in dimension ' + o.n);
  }
}

/* ---- RED: one perturbed coefficient must break the determinant identity ---- */
{
  const forged = { ...claim3, F: claim3.F.map((p, i) => {
    if (i !== 0) return p;
    /* nudge one monomial of P by +1/1000000 */
    const p2 = new Map(p);
    const k = [...p2.keys()][0];
    p2.set(k, Q.add(p2.get(k), Q.R(1n, 1000000n)));
    return p2;
  }) };
  const a = K.audit(forged);
  ok(a.verdict === 'REFUTED', 'RED: one coefficient nudged by 1e-6 — the audit REFUTES (' + a.why.slice(0, 52) + '…)');
}

/* ---- RED: a forged collision point must fail exact evaluation ---- */
{
  const forged = { ...claim3, collisions: claim3.collisions.map((pt, i) =>
    i === 1 ? [pt[0], pt[1], Q.add(pt[2], Q.R(1n, 1000000000n))] : pt) };
  const a = K.audit(forged);
  ok(a.verdict === 'REFUTED' && /coordinate/.test(a.why),
    'RED: a collision point moved by 1e-9 is REFUTED by exact evaluation');
}

/* ---- RED: duplicated points are not a collision ---- */
{
  const forged = { ...claim3, collisions: [claim3.collisions[0], claim3.collisions[0], claim3.collisions[2]] };
  const a = K.audit(forged);
  ok(a.verdict === 'REFUTED' && /SAME point/.test(a.why),
    'RED: the same point listed twice is REFUTED — distinctness is checked, not assumed');
}

/* ---- the audit's positive verdict is reproducible and exact ---- */
{
  const a1 = K.audit(claim3), a2 = K.audit(claim3);
  ok(a1.verdict === 'VERIFIED' && JSON.stringify(a1.checks) === JSON.stringify(a2.checks),
    'two audits of the honest claim are identical');
}

/* ---- the generator: tangent-sweep counterexamples of our own ---- */
{
  const SW = require('#instruments/keller/sweep.js');
  const pEq = (A, B) => {
    if (A.size !== B.size) return false;
    for (const [k, v] of A) { const w = B.get(k); if (!w || Q.cmp(v, w) !== 0) return false; }
    return true;
  };

  /* calibration: at d=2 the generator must reproduce Alpöge's map EXACTLY */
  const g2 = SW.generate(2);
  ok(g2.ok && g2.claim.F.every((f, i) => pEq(f, claim3.F[i])),
    'CALIBRATION: the generator at d=2 reproduces Alpöge\'s map polynomial-for-polynomial (curve [' + (g2.ok ? g2.meta.p.join(', ') : '-') + '])');

  /* new certified counterexamples, generated here */
  for (const d of [3, 4, 5]) {
    const g = SW.generate(d);
    const a = g.ok ? K.audit(g.claim) : null;
    ok(g.ok && a.verdict === 'VERIFIED' && Q.cmp(a.det, Q.R(-2n)) === 0,
      'd=' + d + ': a NEW counterexample of geometric degree ' + (d + 1)
      + ' — det J = -2 identically, 2 rational collision points, generated AND certified');
  }

  /* RED: a curve that violates the twist equations must be refused, not shipped */
  const sab = SW.generate(3, { sabotage: 'breakCurve' });
  ok(!sab.ok, 'RED: a curve with one coefficient off by 1e-6 is REFUSED by the generator ('
    + (sab.ok ? 'SHIPPED — broken' : sab.why.slice(0, 48) + '…') + ')');
}

/* ---- Meng–Yang: the Hessian conjecture, decided in five variables ---- */
{
  const o = (() => { for (let i = 0; ; i++) { const e = FAM.enumerate(i); if (!e) return null; if (e.hessian) return e; } })();
  ok(!!o, 'the Meng–Yang entry enumerates');
  const a = K.audit(o.claim);
  ok(a.verdict === 'VERIFIED' && Q.cmp(a.det, Q.R(128n)) === 0,
    'HC5: det Hess Psi = 128 as a polynomial identity, gradient collision at (±1, ∓3/2, 0,0,0) — the Hessian conjecture is false in 5 variables');

  /* the doubling identity that ties the corpus together:
     phi = y·F for Alpöge's F has det Hess phi == -(det J F)^2 = -4 */
  const n6 = 6;
  const F3 = (() => {   /* Alpöge's map re-read from the family, lifted to 6 vars */
    const o3 = FAM.enumerate(0);
    const lift = (p) => { const out = new Map();
      for (const [k, v] of p) out.set(k + ',0,0,0', v); return out; };
    return o3.claim.F.map(lift);
  })();
  let phi = K.pzero();
  for (let i = 0; i < 3; i++) phi = K.padd(phi, K.pmul(K.pvar(3 + i, n6), F3[i]));
  const grad6 = Array.from({ length: n6 }, (_, i) => K.pdiff(phi, i));
  const H6 = grad6.map(g => Array.from({ length: n6 }, (_, j) => K.pdiff(g, j)));
  const D6 = K.pdet(H6);
  ok(K.pIsConst(D6) && Q.cmp(K.pConstVal(D6), Q.R(-4n)) === 0,
    'the six-variable doubling phi = y·F has det Hess = -4 = -(det J F)^2 — the two corpus entries certify each other');

  /* RED: a degree-2 perturbation of Psi makes the Hessian determinant nonconstant */
  const forged = { ...o.claim };
  const Psi2 = (() => {   /* rebuild Psi from the claim is not possible; perturb H via F directly */
    const F = o.claim.F.map(p => new Map(p));
    /* add eps*x1 to dPsi/dx1 — as if Psi gained (eps/2) x1^2 */
    const k0 = '1,0,0,0,0';
    F[0].set(k0, Q.add(F[0].get(k0) || Q.ZERO, Q.R(1n, 1000000n)));
    return F;
  })();
  const a2 = K.audit({ ...forged, F: Psi2 });
  ok(a2.verdict === 'REFUTED', 'RED: Psi perturbed by (1e-6/2)x1^2 is REFUTED — the Hessian determinant stops being 128 ('
    + a2.why.slice(0, 40) + '…)');
}

console.log('');
console.log('keller battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
