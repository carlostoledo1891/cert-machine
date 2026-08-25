#!/usr/bin/env node
/* battery.js — the continued-fraction instrument's gate.

   Calibration against identities with proofs on record (Brouncker's pi/4,
   Euler's e-1): a false refutation of a truth is the sqrt(2) lesson all
   over again, and this battery exists to keep it caught. Red controls: a
   shifted form must be refuted, a sign violation and an exactness overflow
   must be refused, and every corpus normalization is float-checked against
   its claimed value so a transcription error cannot sit quietly. */
'use strict';

const { enclose, decide } = require('#instruments/cf/cf.js');
const FAM = require('#families/ramanujan-audit.js');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('PASS  ' + m); } else { fail++; console.log('FAIL  ' + m); } };

const brouncker = { b0: 0, a: n => (n === 1 ? 1 : (n - 1) * (n - 1)), b: n => 2 * n - 1 };

/* ---- calibration: proved identities must survive ---- */
{
  const e = enclose(brouncker, 4000);
  ok(e.ok && e.enclosure[0] <= Math.PI / 4 && Math.PI / 4 <= e.enclosure[1] && e.width < 1e-14,
    'Brouncker: pi/4 inside a rigorous enclosure of width ' + (e.ok ? e.width.toExponential(2) : '-'));
  const ecf = { b0: 1, a: n => n + 1, b: n => n + 1 };
  const ee = enclose(ecf, 60);
  ok(ee.ok && ee.enclosure[0] <= Math.E - 1 && Math.E - 1 <= ee.enclosure[1],
    'Euler: e-1 inside its enclosure (width ' + (ee.ok ? ee.width.toExponential(2) : '-') + ')');
  ok(decide(brouncker, { K: 'pi', u: [0, 1], v: [1, 4] }, 4000).verdict === 'SURVIVES',
    'the true form pi/4 SURVIVES the decision');
}

/* ---- RED: the refutation path must fire, and only on falsehood ---- */
{
  const d = decide(brouncker, { K: 'pi', u: [1, 1000000], v: [1, 4] }, 4000);
  ok(d.verdict === 'REFUTED', 'RED: pi/4 + 1e-6 is REFUTED exactly — the audit can fire');
  const sab = enclose({ b0: 0, a: n => (n === 3 ? -4 : n), b: n => n + 1 }, 100);
  ok(!sab.ok && /a_3/.test(sab.why), 'RED: a negative partial numerator is REFUSED, not iterated over (' + sab.why.slice(0, 40) + '…)');
  const big = enclose({ b0: 0, a: n => 2 ** 60, b: n => n }, 10);
  ok(!big.ok && /2\^53/.test(big.why), 'RED: a coefficient past 2^53 is REFUSED — exactness is checked, not assumed');
}

/* ---- every corpus normalization float-checks against its claimed value ---- */
{
  const z3 = 1.2020569031595943;
  const target = { 'rm-e-a': Math.E / 2 - 1, 'rm-e-b': Math.E / 2 - 1, 'rm-e-c': Math.E - 1,
    'rm-pi-a': Math.PI / 4, 'rm-pi-b': Math.PI / 4 - 0.5,
    'rm-z3-pos': 5 / (2 * z3),
    'rm-z3-inv': 1 / z3, 'rm-z3-apery': 6 / z3, 'rm-z3-new1': 8 / (7 * z3), 'rm-z3-new2': 12 / (7 * z3) };
  let checked = 0, bad = 0;
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    if (o.sheet === 2) continue;      /* sheet-2 rows carry their own Möbius float guard below */
    checked++;
    const tol = o.minusCF ? 1e-5 : 1e-12;      /* rm-z3-inv converges slowly; the float screen is a sanity check */
    if (Math.abs(FAM.value(o) - target[o.id]) > tol) { bad++; console.log('  normalization off: ' + o.id); }
  }
  ok(checked === 10 && bad === 0, 'all ' + checked + ' transcriptions (incl. the whole zeta(3) sheet) agree with their claimed values in float (transcription guard)');
}

/* ---- the minus-CF tail-band evaluator (instruments/cf/minus.js) ---- */
{
  const M = require('#instruments/cf/minus.js');
  const Q = require('#instruments/interval/rational.js');
  const P = M._poly.pOfInts;
  const APERY = { spec: { b0: 5, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [5, 27, 51, 34] },
    cert: { N0: 52, L: P([0, 0, 0, 33]), U: P([0, 0, 0, 35]), depth: 60 } };
  const NEW1 = { spec: { b0: 1, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [1, 5, 9, 6] },
    cert: { N0: 10, L: P([0, 0, 0, 5]), U: P([0, 0, 0, 7]), depth: 60 } };

  /* calibration: zeta(3) bracketed from the defining series must contain the
     19-digit literature value — and brackets at different K must overlap,
     since they enclose the same number */
  const z = M.zeta3Bracket(6000);
  const lit = [12020569031595942854n, 10n ** 19n];
  const inB = z.lo[0] * lit[1] <= lit[0] * z.lo[1] && lit[0] * z.hi[1] <= z.hi[0] * lit[1];
  ok(inB && z.width < 1e-16, 'zeta(3) bracket (defining series + convexity tail, width ' + z.width.toExponential(2) + ') contains the 19-digit literature value');
  const z2 = M.zeta3Bracket(2000);
  ok(z2.lo[0] * z.hi[1] <= z.hi[0] * z2.lo[1] && z.lo[0] * z2.hi[1] <= z2.hi[0] * z.lo[1],
    'brackets at K=2000 and K=6000 overlap — they enclose one number');

  /* calibration: Apery's THEOREM. 6/zeta(3) = the CF is proved mathematics;
     refuting it would mean the evaluator is broken. */
  const ap = M.decideMinus(APERY.spec, Q.R(6n), APERY.cert);
  ok(ap.verdict === 'SURVIVES' && ap.cfWidth < 1e-14,
    'CALIBRATION: Apery\'s proved identity 6/zeta(3) SURVIVES (width ' + (ap.cfWidth || 0).toExponential(2) + ')');

  /* RED: the refutation can fire — a wrong form is REFUTED exactly */
  const wrong = M.decideMinus(NEW1.spec, Q.R(1n), NEW1.cert);
  ok(wrong.verdict === 'REFUTED', 'RED: the false form 1/zeta(3) against the new1 CF is REFUTED exactly');

  /* RED: a band that excludes the tail must be refused by terminal containment */
  const badBand = M.checkTailCert(APERY.spec, { N0: 52, L: P([0, 0, 0, 40]), U: P([0, 0, 0, 45]) });
  ok(!badBand.ok && /\(T\)/.test(badBand.why), 'RED: a forged band L=40n^3 fails terminal containment and is REFUSED');

  /* RED: a band violating invariance-from-below is refused (terminal holds) */
  const badInv = M.checkTailCert(APERY.spec, { N0: 52, L: P([0, 0, 0, 34]), U: P([0, 0, 0, 35]) });
  ok(!badInv.ok && /\(I−\)|invariance from below/.test(badInv.why), 'RED: L=34n^3 passes terminal but fails band invariance — REFUSED');

  /* RED: a nonpositive partial numerator is refused at the certificate level */
  const badA = M.checkTailCert({ b0: 1, aPoly: [0, 0, 0, 0, 0, 0, -1], bPoly: [5, 27, 51, 34] }, APERY.cert);
  ok(!badA.ok && /a\(n\)/.test(badA.why), 'RED: a(n) <= 0 is REFUSED — the minus-CF hypotheses are checked, not assumed');

  /* the spurious solution: for rm-z3-inv, s_n = n^3 solves the tail recursion
     exactly and yields CF value 0 — the band must EXCLUDE it, or the
     enclosure would span [0, 1/zeta(3)] and decide nothing */
  const INV = { spec: { b0: 1, aPoly: [0, 0, 0, 0, 0, 0, 1], bPoly: [1, 3, 3, 2] },
    cert: { N0: 1, L: P([0, 0, 2, 1]), U: P([1, 3, 3, 2]), depth: 200000 } };
  const inv = M.decideMinus(INV.spec, Q.R(1n), INV.cert);
  ok(inv.verdict === 'SURVIVES' && inv.cf[0] > 0.8 && inv.cfWidth < 1e-10,
    'rm-z3-inv: the band L = n^3+2n^2 excludes the spurious exact solution s_n = n^3 (CF value 0) — enclosure locks onto 1/zeta(3)');
}

/* ---- the sheet-2 machinery: constants, forms, sign-definite heads ---- */
{
  const C = require('#instruments/bigfloat/constants.js');
  const BF = require('#instruments/bigfloat/bigfloat.js');
  const FORMS = require('#instruments/cf/forms.js');
  const P = require('#instruments/cf/minus.js')._poly;
  const M = require('#instruments/cf/minus.js');

  /* Catalan's G: convexity proved, bracket contains the literature digits,
     brackets at two N overlap (one number) */
  const conv = C.proveConvexity();
  ok(conv.ok && conv.poly.join(',') === '184,288,96',
    'G tail convexity is a PROVED polynomial identity: second difference expands to 96k^2+288k+184, all coefficients positive');
  const g1 = C.catalanG(160, 2000).enclosure, g2 = C.bracket('G', 160).iv;
  const lit = (iv, s) => { const m = /^(\d+)\.(\d+)$/.exec(s), num = BigInt(m[1] + m[2]), den = 10n ** BigInt(m[2].length);
    return BF.cmpRat(iv.lo, num, den) >= 0 && BF.cmpRat(iv.hi, num + 1n, den) <= 0; };
  ok(lit(g2, '0.91596559417721901'),
    'G (defining series + convexity tail, width ' + BF.widthNumber(g2).toExponential(1) + ') certifies 17 literature digits');
  ok(!BF.disjoint(g1, g2), 'G brackets at N=2000 and N=600000 intersect — one number, two truncations');

  /* RED: a Möbius form whose denominator interval contains 0 is REFUSED */
  const fakeK = { lo: [-1n, 1n], hi: [1n, 1n] };
  const mb = FORMS.mobiusBracket({ p: 1, s: 0, t: 1 }, fakeK);
  ok(!mb.ok && /contains 0/.test(mb.why), 'RED: a form denominator interval containing 0 is REFUSED — no verdict from a possibly-singular form');

  /* RED: a head tail interval straddling 0 refuses; sign-definite NEGATIVE heads evaluate */
  const straddle = M.encloseMinus({ b0: -2, aPoly: [0, 0, 0, 0, 2], bPoly: [-2, 3, 3] },
    { N0: 3, L: P.pOfInts([0, -1, 2]), U: P.pOfInts([-2, 3, 3]) }, 3);
  ok(!straddle.ok && /contains 0/.test(straddle.why),
    'RED: a head tail interval CONTAINING 0 is REFUSED — sign-definiteness is checked, not assumed');
  const negHead = FAM.certify(FAM.enumerate(11));  /* rm-cat-02: y < 0 at the head */
  ok(negHead.verdict === 'HIT' && /SURVIVES/.test(negHead.text),
    'a genuinely NEGATIVE-head row (rm-cat-02: 2/(2G-1) = 1 - 4/y, y < 0) evaluates — increasing maps need a fixed sign, not positivity');
}

/* ---- the family end-to-end: EVERY row of all six sheets ---- */
{
  const KF = { pi2: Math.PI * Math.PI, G: 0.915965594177219, ln2: Math.LN2,
    catalanE: 8 * 0.915965594177219 - Math.PI * Math.acosh(2) };
  let hits = 0, refused = 0, rejects = 0, flagship = 0, s2checked = 0, s2bad = 0;
  const byId = {};
  for (let i = 0; ; i++) {
    const o = FAM.enumerate(i); if (!o) break;
    const c = FAM.certify(o);
    byId[o.id] = c;
    if (c.verdict === 'HIT') { hits++; if (/NEW AND UNPROVEN/.test(c.text)) flagship++; }
    else if (c.verdict === 'REFUSED') refused++;
    else rejects++;
    if (o.sheet === 2) {           /* transcription guard: float CF vs float form */
      s2checked++;
      const K = KF[o.K];
      const target = ((o.form.p || 0) + (o.form.q || 0) * K) / ((o.form.s || 0) + (o.form.t || 0) * K);
      if (Math.abs(FAM.value(o) - target) > 1e-9) { s2bad++; console.log('  sheet2 normalization off: ' + o.id); }
    }
  }
  ok(hits === 46 && rejects === 0 && refused === 0,
    'all 46 conjectures — the e, pi, zeta(3), CATALAN, pi^2 and ln 2 sheets, COMPLETE — SURVIVE their audits (' + hits + ' hits)');
  ok(flagship === 34, 'all 34 rows the Machine marks NEW AND UNPROVEN are decided and say so (' + flagship + ')');
  ok(s2checked === 36 && s2bad === 0, 'all 36 sheet-2 transcriptions agree with their claimed Möbius values in float (transcription guard)');
  ok(byId['rm-z2-proven1'].verdict === 'HIT' && byId['rm-z2-proven2'].verdict === 'HIT',
    'CALIBRATION: both PROVEN pi^2 rows (Kadyrov-Orynbassar) SURVIVE — refuting proved mathematics would mean a broken evaluator');
  ok(byId['rm-z2-known'].verdict === 'HIT' && byId['rm-cat-known'].verdict === 'HIT',
    'CALIBRATION: both KNOWN rows survive, incl. the two-constant form 6/(8G - pi*acosh 2)');

  /* RED: a forged Möbius form against a real enclosure is REFUTED exactly */
  const FORMS = require('#instruments/cf/forms.js');
  const C = require('#instruments/bigfloat/constants.js');
  const KB = C.bracket('G', 192);
  const d = FORMS.decideForm(byId['rm-cat-01'].enclosure, { p: 3, s: 0, t: 5 }, { lo: KB.lo, hi: KB.hi });
  ok(d.disjoint === true, 'RED: the forged form 3/(5G) against rm-cat-01\'s enclosure is REFUTED exactly — the sheet-2 audit can fire');
}

console.log('');
console.log('cf battery: ' + pass + ' pass, ' + fail + ' fail');
if (fail) process.exit(1);
