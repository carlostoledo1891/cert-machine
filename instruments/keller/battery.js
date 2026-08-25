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

/* ---- the Alpöge counterexample: n=3, plus the ONE padded representative ----
   The family carries exactly two Alpöge rows now (outside review R2): the
   n=3 mathematics and n=8 as the stated stabilization — five identical
   padded rows were collapsed into that one. */
let claim3 = null;
{
  for (const i of [0, 1]) {                                 /* n = 3 and n = 8 (padded) */
    const o = FAM.enumerate(i);
    if (i === 0) claim3 = o.claim;
    const v = FAM.value(o);
    ok(FAM.interesting(o, v), 'n=' + o.n + ': float screen passes (sampled |det+2| = ' + v.toExponential(1) + ')');
    const c = FAM.certify(o);
    ok(c.verdict === 'HIT' && c.enclosure[0] === -2 && c.enclosure[1] === -2,
      'n=' + o.n + (o.padded ? ' (the padded representative)' : '') + ': VERIFIED — det J = -2 identically, 3 exact collisions; the Jacobian conjecture is false in dimension ' + o.n);
    if (o.padded) ok(/STABILIZATION/.test(c.text) && !!c.extra.padded,
      'the padded row SAYS it is padding — stabilization stated in the certificate text, not hidden');
  }
  const third = FAM.enumerate(2);
  ok(!third || !/Alpöge/.test(third.source),
    'exactly TWO Alpöge rows enumerate — the five identity-padding rows are collapsed (R2)');
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

/* ---- Gallagher's family: reconstructed from the seed and decided ---- */
{
  const SW = require('#instruments/keller/sweep.js');
  for (const d of [2, 4]) {
    const g = SW.fromSeed({ pCoeffs: SW.gallagherSeed(d) });
    ok(g.ok && Q.cmp(g.claim.det, Q.R(1n)) === 0,
      'Gallagher d=' + d + ': det J = 1 identically, fiber degree ' + (d + 1) + ', 2 rational collision witnesses — decided, not trusted');
  }
  const dm = SW.fromSeed({ pCoeffs: [Q.R(1n), Q.ZERO, Q.R(-2n)], b: Q.R(-1n) });
  ok(dm.ok && dm.meta.a === '-4/3' && Q.cmp(dm.claim.det, Q.R(-1n)) === 0,
    'the distinct member (w-2w^3): a = -4/3 matches the paper, det J = -1, collisions certified');
  const sab = SW.fromSeed({ pCoeffs: SW.gallagherSeed(3), sabotage: 'breakSeed' });
  ok(!sab.ok, 'RED: a seed violating p(1) = -c is REFUSED (' + sab.why + ')');
}

/* ---- source pins: the certificate is over a byte sequence (R3) ---- */
{
  const PIN = require('#instruments/pin.js');
  const gal = (() => { for (let i = 0; ; i++) { const e = FAM.enumerate(i); if (!e) return null; if (e.pin) return e; } })();
  ok(!!gal, 'a pinned entry enumerates (Gallagher, corpus/sources/gallagher2026.pdf)');
  const c = FAM.certify(gal);
  ok(c.verdict === 'HIT' && c.extra.sourcePin && c.extra.sourcePin.sha256 === PIN.PINS['gallagher2026.pdf']
    && typeof c.extra.transcription === 'string' && c.extra.transcription.length > 0,
    'the certificate carries the source sha256 (re-hashed, not copied) AND the transcribed formula string');
  /* RED: a forged pin table must refuse — the drift path can actually fire */
  const forged = PIN.verify('gallagher2026.pdf', { pins: { 'gallagher2026.pdf': '0'.repeat(64) } });
  ok(!forged.ok && /mismatch/.test(forged.why), 'RED: a drifted source (forged pin) is REFUSED with a sha256 mismatch');
  const unpinned = PIN.verify('no-such-source.pdf');
  ok(!unpinned.ok, 'RED: a source with no recorded pin is REFUSED, not waved through');
}

/* ---- the fiber hunter: non-injectivity found blind ---- */
{
  const { certifiedFiber } = require('#instruments/keller/fibers.js');
  const alp = FAM.enumerate(0);

  /* blind rediscovery: all three known preimages of (-1/4,0,0), no witnesses given */
  const f = certifiedFiber(alp.claim.F, alp.claim.image);
  ok(f.preimages === 3, 'BLIND: the hunter certifies 3 preimages of Alpöge\'s collision point without being told any (' + f.preimages + ')');
  let contained = 0;
  for (const wpt of alp.claim.collisions) {
    const wf = wpt.map(Q.toDouble);
    if (f.boxes.some(b => wf.every((x, i) => b.box[i][0] <= x && x <= b.box[i][1]))) contained++;
  }
  ok(contained === 3, 'each known rational witness lies INSIDE one of the certified boxes (' + contained + '/3)');

  /* negative control: an automorphism's fiber is a single certified point */
  const n = 3;
  const auto = [K.padd(K.pvar(0, n), K.ppow(K.pvar(1, n), 2, n)),
                K.padd(K.pvar(1, n), K.ppow(K.pvar(2, n), 3, n)),
                K.pvar(2, n)];
  const fa = certifiedFiber(auto, [Q.R(2n), Q.R(1n), Q.R(1n)]);
  ok(fa.preimages === 1, 'RED control: a triangular automorphism certifies EXACTLY 1 preimage — 400 starts converge to one box, dedup holds (' + fa.preimages + ')');
}

console.log('');
console.log('keller battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
