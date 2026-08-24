/* test-eqcert.js — the toolkit's own battery.

   A library that certifies other people's computations has to be held to a
   higher standard than the computations, because every downstream certificate
   inherits its defects. So: the interval arithmetic is checked against EXACT
   rational arithmetic rather than against itself, the rational arithmetic is
   checked against the field axioms, the contraction drivers are checked on
   problems with known answers, and the Certificate contract is checked by
   trying to violate it.

   MIT licensed. Part of eqcert. */
'use strict';
const E = require('../index.js');
const I = E.interval, Q = E.rational, S = E.sequence, R = E.radii, C = E.certificate;

let fails = 0;
const check = (n, c, d) => { console.log((c ? 'PASS' : 'FAIL') + '  ' + n + (d !== undefined ? '   [' + d + ']' : '')); if (!c) fails++; };
function rng32(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const t0 = Date.now();

/* ================= interval arithmetic, against exact rationals ========== */
function enclosureTest(add, sub, mul, div) {
  const rnd = rng32(20260722);
  const scales = [1, 1e-9, 1e9, 1e-4, 1e300, 1e-300];
  for (let t = 0; t < 4000; t++) {
    const a = (rnd() - 0.5) * scales[t % 6];
    let b = (rnd() - 0.5) * scales[(t + 1) % 6];
    if (b === 0) b = 0.5;
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    let ra, rb;
    try { ra = Q.fromDouble(a); rb = Q.fromDouble(b); } catch (e) { continue; }
    const cases = [[add([a, a], [b, b]), Q.add(ra, rb)], [sub([a, a], [b, b]), Q.sub(ra, rb)],
                   [mul([a, a], [b, b]), Q.mul(ra, rb)], [div([a, a], [b, b]), Q.div(ra, rb)]];
    for (const [got, exact] of cases) {
      if (!Number.isFinite(got[0]) || !Number.isFinite(got[1])) continue;
      if (!Q.inClosed(exact, got[0], got[1])) return t;
    }
  }
  return -1;
}
check('I1 nextUp / nextDown are the true float neighbours',
  I.nextUp(1) === 1 + Number.EPSILON && I.nextDown(1) === 1 - Number.EPSILON / 2 &&
  I.nextUp(0) === Number.MIN_VALUE && I.nextDown(0) === -Number.MIN_VALUE &&
  I.nextUp(I.nextDown(3.7)) === 3.7);
{
  const bad = enclosureTest(I.add, I.sub, I.mul, I.div);
  check('I2 every interval operation ENCLOSES the exact rational result', bad < 0,
    bad < 0 ? '16000 ops across six magnitude scales incl. 1e±300' : 'first miss at op ' + bad);
}
check('I3 division by an interval straddling zero is refused, not fudged', (() => {
  try { I.div(I.iv(1), I.iv(-1, 1)); return false; } catch (e) { return true; }
})());
check('I4 sqr is tighter than mul across zero, and still encloses', (() => {
  const a = I.iv(-2, 3);
  const s = I.sqr(a), m = I.mul(a, a);
  return s[0] >= m[0] && s[1] <= m[1] && s[0] === 0 && s[1] >= 9;
})());
check('I5 interior() is STRICT — the Krawczyk side condition is not weakened', (() => {
  return I.interior(I.iv(0, 1), I.iv(-1, 2)) === true &&
         I.interior(I.iv(-1, 2), I.iv(-1, 2)) === false &&      /* equal: NOT interior */
         I.subset(I.iv(-1, 2), I.iv(-1, 2)) === true;
})());

/* ================= exact rational arithmetic ============================= */
check('Q1 field axioms hold exactly on random triples', (() => {
  const rnd = rng32(7);
  for (let t = 0; t < 400; t++) {
    const mk = () => Q.R(BigInt(Math.floor((rnd() - 0.5) * 2000)), BigInt(Math.floor(rnd() * 500) + 1));
    const a = mk(), b = mk(), c = mk();
    if (Q.cmp(Q.add(a, b), Q.add(b, a)) !== 0) return false;
    if (Q.cmp(Q.mul(a, Q.add(b, c)), Q.add(Q.mul(a, b), Q.mul(a, c))) !== 0) return false;
    if (Q.sign(b) !== 0 && Q.cmp(Q.mul(Q.div(a, b), b), a) !== 0) return false;
  }
  return true;
})(), '400 triples');
check('Q2 fromDouble is LOSSLESS (every finite double is m·2^e)', (() => {
  const rnd = rng32(3);
  for (let t = 0; t < 500; t++) {
    const x = (rnd() - 0.5) * Math.pow(10, Math.floor(rnd() * 20) - 10);
    if (!Number.isFinite(x)) continue;
    const q = Q.fromDouble(x);
    if (!Q.inClosed(q, x, x)) return false;      /* exactly representable */
  }
  return true;
})());
check('Q3 an exactly singular system returns null rather than a plausible answer', (() => {
  const A = [[Q.R(1n), Q.R(2n)], [Q.R(2n), Q.R(4n)]];       /* rank 1 */
  return Q.solve(A, [Q.R(1n), Q.R(2n)], 2) === null;
})());
check('Q4 exact solve has EXACTLY zero residual (not a small one)', (() => {
  const rnd = rng32(9);
  for (let t = 0; t < 60; t++) {
    const n = 4;
    const A = [], b = [];
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(Q.R(BigInt(Math.floor((rnd() - 0.5) * 40)), BigInt(Math.floor(rnd() * 7) + 1)));
      row[i] = Q.add(row[i], Q.R(50n));                      /* keep it nonsingular */
      A.push(row); b.push(Q.R(BigInt(Math.floor((rnd() - 0.5) * 40))));
    }
    const x = Q.solve(A, b, n);
    if (!x) continue;
    if (!Q.allZero(Q.residual(A, x, b, n))) return false;
  }
  return true;
})(), '60 random systems, residual identically 0');
check('Q5 exact arithmetic DECIDES a tie that intervals cannot', (() => {
  /* the situation that motivated this module: a quantity that is exactly zero.
     Interval arithmetic on the same expression cannot conclude; exact can. */
  const a = Q.R(1n, 3n), b = Q.R(1n, 3n);
  const exact = Q.sub(a, b);
  const ia = I.div(I.iv(1), I.iv(3)), ib = I.div(I.iv(1), I.iv(3));
  const isub = I.sub(ia, ib);
  return Q.isZero(exact) && isub[0] < 0 && isub[1] > 0;      /* interval straddles 0 */
})(), 'exact says 0; the interval can only say "near 0"');

/* ================= sequence algebra ====================================== */
check('S1 the norm is a Banach algebra norm for convolution', (() => {
  const rnd = rng32(5), nu = 1.05;
  for (let t = 0; t < 300; t++) {
    const K = 6, f = [], g = [];
    for (let k = 0; k <= K; k++) { f.push((rnd() - 0.5) * 2); g.push((rnd() - 0.5) * 2); }
    const h = S.conv(f, g, 2 * K, S.EVEN, S.EVEN);
    const nf = S.normNu(f, nu, true), ng = S.normNu(g, nu, true), nh = S.normNu(h, nu, true);
    if (nh > nf * ng * (1 + 1e-12)) return false;
  }
  return true;
})(), '300 random pairs, nu = 1.05');
check('S2 PARITY CHANGES THE ANSWER — an odd sequence extended evenly is a different object', (() => {
  const p = [0, 1.3, -0.4, 0.2];
  const odd = S.conv(p, p, 3, S.ODD, S.ODD);
  const even = S.conv(p, p, 3, S.EVEN, S.EVEN);
  let d = 0;
  for (let k = 0; k <= 3; k++) d = Math.max(d, Math.abs(odd[k] - even[k]));
  return d > 1e-6;
})(), 'the live bug this module exists to prevent');
check('S3 odd * odd is even, and (f*f)_0 for an odd f is negative', (() => {
  const p = [0, 1.3, -0.4, 0.2];
  const pp = S.conv(p, p, 3, S.ODD, S.ODD);
  /* (p*p)_0 = sum_j p_j p_{-j} = -sum_j p_j^2 < 0 for a nonzero odd sequence */
  return pp[0] < 0;
})());
check('S4 the same code runs over intervals and encloses the float answer', (() => {
  const f = [0.5, -0.25, 0.125], g = [1, 0.5, -0.5];
  const flt = S.conv(f, g, 4, S.EVEN, S.EVEN);
  const IA = { ZERO: I.ZERO, ONE: I.ONE, add: I.add, sub: I.sub, mul: I.mul, abs: I.abs };
  const ivl = S.conv(f.map(I.iv), g.map(I.iv), 4, S.EVEN, S.EVEN, IA);
  for (let k = 0; k <= 4; k++) if (!I.contains(ivl[k], flt[k])) return false;
  return true;
})());

/* ================= contraction drivers =================================== */
/* The invariant is NOT "r is strictly above the float root". The float root is
   itself computed, and nextUp can already place it inside the negative region —
   in which case returning it is correct. The invariant that always holds, and
   the one worth asserting, is that the RETURNED radius has p(r) negative as an
   INTERVAL upper bound, and lies in [rMin, rMax]. Asserting the stronger,
   false thing is how this check first failed. */
check('R1 the returned radius has p(r) negative as an interval UPPER bound', (() => {
  const cases = [[1e-15, 0.03, 2.0], [1e-9, 0.4, 12.0], [1e-20, 0.7, 0.05], [2.3e-17, 0.5241, 1.2]];
  for (const [Y0, Z1, Z2] of cases) {
    const r = R.radiiPolynomial(Y0, Z1, Z2);
    if (!r.ok) return false;
    if (!(r.pAtR < 0)) return false;                    /* the interval bound */
    if (!(r.r >= r.rMin && r.r <= r.rMax)) return false;
    const pf = 0.5 * r.Z2 * r.r * r.r - (1 - r.Z1) * r.r + r.Y0;
    if (!(pf < 0)) return false;                        /* and in floats too */
  }
  return true;
})(), '4 regimes');
check('R2 when the computed root is NOT verifiably negative, the driver walks up', (() => {
  /* Found by search: here nextUp on the float root lands where the interval
     enclosure of p is still positive, so returning the root would prove
     nothing. The driver must enlarge. */
  const Y0 = 2.30e-17, Z1 = 0.5241, Z2 = 1.2;
  const r = R.radiiPolynomial(Y0, Z1, Z2);
  if (!r.ok) return false;
  const IR = I.iv(r.rMin);
  const pRoot = I.add(I.sub(I.mul(I.mul(I.iv(0.5), I.iv(Z2)), I.mul(IR, IR)),
                            I.mul(I.sub(I.ONE, I.iv(Z1)), IR)), I.iv(Y0));
  return pRoot[1] >= 0 && r.r > r.rMin && r.pAtR < 0;
})(), 'the trap an earlier version of this code fell into');
check('R3 Z1 >= 1 is refused outright', (() => !R.radiiPolynomial(1e-15, 1.0, 2.0).ok)());
check('R4 too large a defect is refused (discriminant <= 0)', (() => !R.radiiPolynomial(1.0, 0.5, 2.0).ok)());
/* R8 — THE RED CONTROL FOR THE CONTRACTION-FACTOR GUARD, added 2026-07-30.
   Before the guard existed this exact triple returned ok:true. It is the reason
   the guard is in radii.js and not merely believed to be a good idea: p(r) < 0
   is verified, the radius is inside [rMin, rMax], and yet kappa >= 1, so
   uniqueness in B_r does not follow. Found by sweeping disc -> 0+; 84 of 2520
   near-tangency triples behaved this way. Asserting all four facts, not just the
   refusal, so a future edit cannot make this pass for the wrong reason. */
check('R8 RED CONTROL: p(r) < 0 but kappa >= 1 is REFUSED, not certified', (() => {
  const Y0 = 4.895599500000001e-13, Z1 = 0.01, Z2 = 1e12;
  const r = R.radiiPolynomial(Y0, Z1, Z2);
  if (r.ok) return false;                                  /* must refuse */
  if (!/contraction factor/.test(r.why || '')) return false;/* for THIS reason */
  if (!(r.kappa >= 1)) return false;                       /* kappa really is >= 1 */
  /* and the refusal is NOT because p(r) failed: p(r) < 0 genuinely holds, and
     the radius sits past the vertex of p, which is what makes kappa exceed 1 */
  const IR = I.iv(r.r);
  const p = I.add(I.sub(I.mul(I.mul(I.iv(0.5), I.iv(Z2)), I.mul(IR, IR)),
                        I.mul(I.sub(I.ONE, I.iv(Z1)), IR)), I.iv(Y0));
  if (!(p[1] < 0)) return false;
  if (!(r.r <= r.rMax)) return false;
  return r.r > (1 - Z1) / Z2;                              /* past the vertex */
})(), 'self-map without contraction: existence yes, uniqueness no');
check('R9 the guard does NOT fire in the regime the shipped certifiers run in', (() => {
  /* The companion to R8: a guard that refuses everything is not a guard either.
     These are the two REAL operating points of the shipping certifiers — the
     parametric window kernel and the spectral artifact's worst enclosure — and both
     must still certify, with kappa < 1.
     The identifiers of the ledger records these came from are deliberately NOT named
     here: this file ships to the public tree, and a record id is private material.
     That is not a hypothetical — the first version of this comment named one, and the
     export token scan caught it. */
  for (const [Y0, Z1, Z2] of [[3.494961279168974e-15, 0.5267562117334962, 23.66157880910839],
                              [4.3e-15, 0.0644, 23.66]]) {
    const r = R.radiiPolynomial(Y0, Z1, Z2);
    if (!r.ok) return false;
    if (!(r.kappa < 1)) return false;
  }
  return true;
})(), 'both shipping certifiers\' operating points still certify, kappa < 1');
check('R5 Krawczyk encloses a known root and reports a tight box', (() => {
  /* x^2 - 2 = 0 near 1.4142..., a root we know independently */
  const F = X => [I.sub(I.mul(X[0], X[0]), I.iv(2))];
  const DF = X => [[I.mul(I.iv(2), X[0])]];
  const x0 = [Math.SQRT2];
  const A = [[1 / (2 * Math.SQRT2)]];
  const k = R.krawczyk(F, DF, x0, A);
  return k.ok && k.box[0][0] < Math.SQRT2 && Math.SQRT2 < k.box[0][1] && k.maxRad < 1e-14;
})());
check('R6 Krawczyk REFUSES where the derivative vanishes (no isolated root)', (() => {
  /* x^2 = 0 at 0: the root is not simple, so no enclosure can be contracted */
  const F = X => [I.mul(X[0], X[0])];
  const DF = X => [[I.mul(I.iv(2), X[0])]];
  const k = R.krawczyk(F, DF, [0], [[1]], { radCap: 1 });
  return !k.ok;
})());

/* ================= the Certificate contract ============================== */
check('C1 a certificate CANNOT be built without a falsifier', (() => {
  try { C.proved({ claim: 'x', evidence: { a: 1 } }); return false; } catch (e) { return /falsifier/.test(e.message); }
})(), 'the one design decision in this library');
check('C2 a PROVED verdict without evidence is refused', (() => {
  try { C.proved({ claim: 'x', falsifier: 'y' }); return false; } catch (e) { return /evidence/.test(e.message); }
})());
check('C3 a REFUSED verdict must say why', (() => {
  try { C.refused({ claim: 'x', falsifier: 'y' }); return false; } catch (e) { return /why/.test(e.message); }
})());
check('C4 assumptions are reported separately from checked facts', (() => {
  const c = C.proved({ claim: 'k', evidence: { r: 1e-9 }, falsifier: 'f', assumes: ['positivity is a hypothesis'] });
  const t = c.report();
  return /ASSUMED \(not checked here\)/.test(t) && /positivity is a hypothesis/.test(t) && /falsified by/.test(t);
})());
check('C5 a refusal never renders as a success', (() => {
  const c = C.refused({ claim: 'k', falsifier: 'f', why: 'Z1 >= 1' });
  return !c.proved && /NOT PROVED/.test(c.line()) && /nothing is claimed/.test(c.line());
})());

/* ================= falsifiers ============================================ */
console.log('\n    executing falsifiers');
let reds = 0; const total = 4;
{
  const thinMul = (a, b) => { const p = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]]; return [Math.min(...p), Math.max(...p)]; };
  const bad = enclosureTest(I.add, I.sub, thinMul, I.div);
  if (bad >= 0) { reds++; console.log('       RED ok  X1 removing the outward widening breaks the enclosure (op ' + bad + ')'); }
  else console.log('       RED FAIL  X1 the enclosure test has no power');
}
{
  /* a non-strict "interior" would let Krawczyk claim uniqueness it has not earned */
  const loose = (a, b) => b[0] <= a[0] && a[1] <= b[1];
  if (loose(I.iv(-1, 2), I.iv(-1, 2)) && !I.interior(I.iv(-1, 2), I.iv(-1, 2))) {
    reds++; console.log('       RED ok  X2 subset() would accept an equal box; interior() rejects it');
  } else console.log('       RED FAIL  X2 interior and subset are indistinguishable');
}
{
  /* the mutant: return the computed root without verifying it. On the regime
     found by search this yields a radius whose p(r) enclosure is POSITIVE —
     i.e. a reported "proof" that proves nothing. */
  const Y0 = 2.30e-17, Z1 = 0.5241, Z2 = 1.2;
  const r = R.radiiPolynomial(Y0, Z1, Z2);
  const IR = I.iv(r.rMin);
  const pRoot = I.add(I.sub(I.mul(I.mul(I.iv(0.5), I.iv(Z2)), I.mul(IR, IR)),
                            I.mul(I.sub(I.ONE, I.iv(Z1)), IR)), I.iv(Y0));
  if (pRoot[1] >= 0 && r.pAtR < 0) {
    reds++; console.log('       RED ok  X3 skipping the verification would report p(r) enclosure ' +
      pRoot[1].toExponential(2) + ' >= 0 as a proof');
  } else console.log('       RED FAIL  X3 the verification step is not load-bearing');
}
{
  /* the parity bug, as a falsifier of the sequence module */
  const p = [0, 1.3, -0.4, 0.2];
  const a = S.conv(p, p, 3, S.ODD, S.ODD), b = S.conv(p, p, 3, S.EVEN, S.EVEN);
  let d = 0; for (let k = 0; k <= 3; k++) d = Math.max(d, Math.abs(a[k] - b[k]));
  if (d > 1e-6) { reds++; console.log('       RED ok  X4 mis-declared parity changes the convolution by ' + d.toExponential(2)); }
  else console.log('       RED FAIL  X4 parity is not load-bearing here');
}
check('X every falsifier turned its target red', reds === total, reds + '/' + total);

console.log('\n' + (Date.now() - t0) + ' ms · ' + (fails ? fails + ' FAILURE(S)' :
  'ALL PASS — arithmetic validated against exact rationals, contraction side\n  conditions enforced, and a certificate cannot be built without its falsifier.'));
process.exit(fails ? 1 : 0);
