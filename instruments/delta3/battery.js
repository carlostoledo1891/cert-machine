#!/usr/bin/env node
/* battery.js — the δ₃ verifier's gates.
   instruments/delta3 · cert-machine

     node instruments/delta3/battery.js          PASS/FAIL per line; nonzero exit on any FAIL
     BATTERY_FAILFAST=1 …                         stop at the first FAIL (the mutation pass)

   GREEN: the facts about φ* and h; the two area routines against each other off the
   grid; the fast step-function Q against the pair-by-pair one; the bathtub constants at
   the bathtub's exact minimiser on every cell; every cut-pair bound against the exact
   contribution of σ placed on sub-rectangles of that pair; E(σ) ≥ L(y) on adversarial σ
   with the verifier's own L; and the genuine set: five VERIFIED, cover complete,
   THEOREM VERIFIED.

   RED: each control is a genuine certificate mutated in memory, and must be REFUSED.
   The "planted" ones change one thing by 2^−100 or add one form with multiplier
   2^−100, so that exactly one rule can refuse them; for those the refusal must come
   from that rule (the expected reason is matched), or the line FAILs. A control that
   is caught only by a different rule is not evidence that its own rule works.

   MIT licensed. Part of cert-machine. */
'use strict';

const Q = require('../interval/rational.js');
const M = require('./model.js');
const V = require('./verify.js');
const L = require('./lemmas.js');

const r = M.r, ONE = r(1), U = M.U;
const FAILFAST = process.env.BATTERY_FAILFAST === '1';
const T0 = Date.now();
let pass = 0, fail = 0;
function check(name, ok, note) {
  if (ok) { pass++; console.log('PASS  ' + name + (note ? '   [' + note + ']' : '')); return; }
  fail++; console.log('FAIL  ' + name + (note ? '   [' + note + ']' : ''));
  if (FAILFAST) { console.log('FAILFAST: stopping'); process.exit(1); }
}
const TINY = '1/1267650600228229401496703205376';           /* 2^−100 */
const clone = x => JSON.parse(JSON.stringify(x));
const S = q => Q.toString(q);

/* ---- GREEN: φ*, h, areas ---------------------------------------------------- */
let facts = null;
try { facts = V.phiStarFacts(); } catch (e) { check('phi* facts', false, e.message); }
if (facts) {
  check('Q(phi*) = -5/137 by exact block-pair areas', facts.Q === '-5/137');
  check('∫h = 5/137 = −Q(phi*) (h from g*, independent of the areas)', facts.hIntegral === '5/137');
  check('h vanishes exactly at the 11 breakpoints', facts.hZeros.length === 11 && facts.hZeros.every((z, k) => S(r(M.EDGES[k + 1], U)) === z));
  check('one-sided slopes at the zeros are −1|−3/2 on the left and 1|3/2 on the right, symmetric',
    facts.slopesAtZeros.every(s => ['-1', '-3/2'].includes(s.left) && ['1', '3/2'].includes(s.right) && s.left === S(Q.neg(r(...s.right.split('/').map(Number))))));
}
check('every kink candidate of g* is a multiple of 1/1096', M.kinkCandidatesOffLattice().length === 0);
{
  const hn = M.hNodes();
  let bad = 0;
  for (let x = 0; x < U; x++) {
    const g = M.gStar(r(2 * x + 1, 2 * U));
    const hm = Q.mul(r(-M.SIGNS[M.blockOf(x, x + 1)]), g);
    if (Q.cmp(hm, Q.mul(r(1, 2), Q.add(hn[x], hn[x + 1]))) !== 0) bad++;
  }
  check('h at every half-node (from g*) is the average of its two nodes: linear on all 1096 pieces', bad === 0, bad + ' off');
}
check('the colouring is balanced (274 + 274), so |T| = n²/8 + O(n) for the upper bound',
  M.BLOCKS.filter((_, k) => k % 2 === 0).reduce((a, b) => a + b, 0) === 274);
check('area(R) = 1/2', M.area4(0n, BigInt(U), 0n, BigInt(U), BigInt(U)) === 2n * BigInt(U) * BigInt(U));
{
  const R = L.rng(11);
  let bad = 0;
  const u = 1096n * 35n;
  for (let t = 0; t < 400; t++) {
    const a = [R.int(0, 38359), R.int(0, 38359)].sort((x, y) => x - y), b = [R.int(0, 38359), R.int(0, 38359)].sort((x, y) => x - y);
    if (a[0] === a[1] || b[0] === b[1]) continue;
    const A = M.area4(BigInt(a[0]), BigInt(a[1]), BigInt(b[0]), BigInt(b[1]), u);
    const C = M.area4Clip(BigInt(a[0]), BigInt(a[1]), BigInt(b[0]), BigInt(b[1]), u);
    if (C.d !== 1n || C.n !== A) bad++;
  }
  check('trapezoid areas = clipped-polygon areas on 400 random off-grid rectangles', bad === 0, bad + ' disagree');
  let qb = 0;
  for (let t = 0; t < 40; t++) {
    const N = R.int(2, 10), D = 37 * N;
    const cuts = new Set([0, D]); while (cuts.size < N + 1) cuts.add(R.int(1, D - 1));
    const pts = [...cuts].sort((x, y) => x - y).map(c => r(c, D));
    const vals = pts.slice(1).map(() => r(R.int(-9, 9), R.int(1, 7)));
    if (Q.cmp(L.Qstep(pts, vals), L.QstepBrute(pts, vals)) !== 0) qb++;
  }
  check('fast step-function Q = pair-by-pair Q on 40 random step functions', qb === 0, qb + ' disagree');
}

/* ---- the exact PSD prover on matrices built to fool floats ------------------------ */
{
  const { provePSD } = require('./psd.js');
  const R = L.rng(3);
  const n = 40, B = Array.from({ length: n }, () => Array.from({ length: n }, () => R.int(-9, 9)));
  const G = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => { let s = i === j ? 1 : 0; for (let k = 0; k < n; k++) s += B[i][k] * B[j][k]; return r(s, 7); }));
  check('psd: a 40×40 BBᵀ + I/7 is proved PSD', provePSD(G).verdict === 'PSD');
  /* det = 1/9 − 2^−200 − 1/9 < 0 exactly, but the rounded matrix is positive definite
     (fl(1/9) − fl(1/3)² ≈ +6e−18): only the exact remainder / minors can refuse it */
  const blind = [[r(1), r(1, 3)], [r(1, 3), Q.sub(r(1, 9), Q.R(1n, 1n << 200n))]];
  const pb = provePSD(blind);
  check('psd: float-blind indefinite 2×2 (det = −2^−200) is NOT proved PSD', pb.verdict !== 'PSD', pb.verdict + ': ' + (pb.why || ''));
  /* leading minors 1, 0, −1: indefinite, and the zero minor must not be read as a pass */
  const zm = [[r(1), r(1), r(0)], [r(1), r(1), r(1)], [r(0), r(1), r(1)]];
  const pz = provePSD(zm);
  check('psd: indefinite 3×3 with a zero leading minor is NOT proved PSD', pz.verdict !== 'PSD', pz.verdict + ': ' + (pz.why || ''));
  const zr = [[r(2), r(0), r(1)], [r(0), r(0), r(0)], [r(1), r(0), r(1)]];
  check('psd: an exactly zero row is dropped and the rest proved', provePSD(zr).verdict === 'PSD');
  /* indefinite (v = (1,0,−1) gives −2) with leading minors 1, 0, 0 under elimination:
     the one shape on which a Bareiss pivot test of "< 0" instead of "≤ 0" says PSD */
  const zz = [[r(1), r(1), r(2)], [r(1), r(1), r(2)], [r(2), r(2), r(1)]];
  const pzz = provePSD(zz);
  check('psd: indefinite 3×3 whose elimination zeroes the rest is NOT proved PSD', pzz.verdict !== 'PSD', pzz.verdict + ': ' + (pzz.why || ''));
  /* BBᵀ − 2^−200·I with B 8×7: exactly indefinite, but its float image is the singular BBᵀ,
     on which a shifted float Cholesky can succeed by rounding. The first seed where it does
     is the control: only the exact remainder check (or Bareiss) may refuse it. */
  let blindSeed = -1, blindRes = null;
  for (let seed = 1; seed <= 400 && blindSeed < 0; seed++) {
    const R2 = L.rng(seed), m = 8;
    const Bm = Array.from({ length: m }, () => Array.from({ length: m - 1 }, () => R2.int(-3, 3)));
    const A = Array.from({ length: m }, (_, i) => Array.from({ length: m }, (_, j) => {
      let s2 = 0; for (let k = 0; k < m - 1; k++) s2 += Bm[i][k] * Bm[j][k];
      return i === j ? Q.sub(r(s2), Q.R(1n, 1n << 200n)) : r(s2);
    }));
    if (A.some((row, i) => Q.sign(row[i]) <= 0)) continue;
    const res = provePSD(A);
    if (res.floatFactorFound) { blindSeed = seed; blindRes = res; }
  }
  check('psd: a control exists where float Cholesky succeeds on an exactly indefinite BBᵀ − 2^−200·I', blindSeed > 0, 'seed ' + blindSeed);
  check('psd: … and that matrix is NOT proved PSD', blindRes !== null && blindRes.verdict !== 'PSD', blindRes ? blindRes.verdict + ': ' + (blindRes.why || '') : 'no control');
  const asym = [[r(1), r(0)], [Q.R(1n, 1n << 90n), r(1)]];
  check('psd: an asymmetric matrix is refused', provePSD(asym).verdict !== 'PSD');
}

/* ---- GREEN: the per-grid terms of L against exact integrals --------------------- */
const entries = V.loadEntries(V.defaultFiles());
const byName = Object.fromEntries(entries.map(e => [e.label.replace(/^certs\/delta3\//, ''), e]));
const grids = [...new Map(entries.map(e => [JSON.stringify(e.cert.grid), e.cert.grid])).values()].map(g => V.gridData(g));
for (const gd of grids) {
  let n = 0, bad = 0;
  for (const c of gd.cells) for (const k of [1, 3, 8, 13, 16]) {
    const y = r(k, 16);
    n++;
    if (Q.cmp(L.bathtubExact(c.p, c.q, y), Q.add(Q.mul(c.a, y), Q.mul(c.b, Q.mul(y, y)))) < 0) bad++;
  }
  /* sharpness of a: F(y)/y → w·min h, so a may not exceed the slope at y → 0 */
  let sharp = 0;
  for (const c of gd.cells) {
    const y = r(1, 1 << 20);
    if (Q.cmp(Q.div(L.bathtubExact(c.p, c.q, y), y), Q.add(c.a, Q.mul(c.b, y))) < 0) sharp++;
  }
  check('grid n=' + gd.n + ': bathtub a·y + b·y² ≤ ∫h over the exact minimiser {h < v}, every cell, 5 levels', bad === 0, bad + '/' + n + ' violated');
  check('grid n=' + gd.n + ': bathtub slope a holds at y = 2^−20 (a ≤ w·min h)', sharp === 0, sharp + ' violated');

  /* every cut pair: σ = 1 on a sub-interval of each cell (8 placements), the bound
     max(bound1, bound2) at those averages ≤ s_i s_j ∬_{R∩(S_i×S_j)} 1, exactly */
  let cn = 0, cbad = 0;
  const Ub = BigInt(U) * 4n;
  for (const c of gd.cut) {
    const ci = gd.cells[c.i], cj = gd.cells[c.j];
    const subs = cell => [[cell.p * 4, cell.q * 4], [cell.p * 4, cell.p * 4 + (cell.q - cell.p) * 2], [cell.p * 4 + (cell.q - cell.p) * 2, cell.q * 4], [cell.p * 4 + (cell.q - cell.p), cell.q * 4 - (cell.q - cell.p)]];
    for (const [a0, a1] of subs(ci)) for (const [b0, b1] of subs(cj)) {
      if (c.i === c.j && (a0 !== b0 || a1 !== b1)) continue;  /* one σ per cell */
      const A4 = M.area4(BigInt(a0), BigInt(a1), BigInt(b0), BigInt(b1), Ub);
      const exact = Q.mul(r(c.sgn), Q.R(A4, 4n * Ub * Ub));
      const yi = r(a1 - a0, 4 * (ci.q - ci.p)), yj = r(b1 - b0, 4 * (cj.q - cj.p));
      const yy = Q.mul(yi, yj);
      const [b1x, b2x] = V.cutBounds(c);
      const v1 = Q.add(b1x.k, Q.mul(b1x.q, yy)), v2 = Q.add(b2x.k, Q.mul(b2x.q, yy));
      cn++;
      if (Q.cmp(Q.cmp(v1, v2) >= 0 ? v1 : v2, exact) > 0) cbad++;
    }
  }
  check('grid n=' + gd.n + ': every cut-pair bound ≤ the exact contribution of σ on sub-rectangles', cbad === 0, cbad + '/' + cn + ' violated');

  /* E(σ) ≥ L(y) on adversarial σ, E from areas only */
  const R = L.rng(77 + gd.n);
  let en = 0, ebad = 0, idbad = 0;
  for (const gen of Object.keys(L.GENERATORS)) for (let k = 0; k < 3; k++) {
    const c = L.runCase(gd, gen, R, { identity: k === 0 });
    en++;
    if (!c.lemmaOk || !c.nonneg) ebad++;
    if (c.identityOk === false || c.symmetryOk === false) idbad++;
  }
  check('grid n=' + gd.n + ': E(σ) ≥ L(y) and E ≥ 0 on ' + en + ' adversarial step functions', ebad === 0, ebad + ' violated');
  check('grid n=' + gd.n + ': centring identity and E(σ) = E(1−σ) exact on 7 of them', idbad === 0);
}

/* ---- GREEN: the genuine set ------------------------------------------------------ */
const run = V.verifyAll(entries);
for (const x of run.results) check('genuine ' + x.file + ' VERIFIED' + (x.verdict === 'VERIFIED' ? ', E ≥ ' + x.boundDecimal : ''), x.verdict === 'VERIFIED', x.why || undefined);
check('genuine slab bounds equal the files\' claims exactly', run.results.filter(x => x.kind === 'slab').every(x => x.claimMatchesFile === true));
check('genuine cover of [0, 1/2] is complete', run.cover.complete);
check('genuine THEOREM A VERIFIED', run.theorem.verdict === 'VERIFIED');

/* ---- RED ---------------------------------------------------------------------- */
function red(name, fileName, mutate, expect) {
  const c = clone(byName[fileName].cert);
  mutate(c);
  const res = V.verifyCertificate(c, fileName + ' (forged)');
  const refused = res.verdict === 'REFUSED';
  const right = !expect || (res.why && expect.test(res.why));
  check('RED ' + name + ' → REFUSED' + (expect ? ' by ' + expect.source : ''), refused && right, refused ? res.why.slice(0, 110) : 'ACCEPTED, E ≥ ' + res.boundDecimal);
}
const SL = 'slab-2_5-9_20-g8_4_0.json';        /* a small slab, no triangles */
const ST = 'slab-9_20-1_2-g8_4_0.json';        /* a small slab with triangles */
const SB = 'slab-3_10-4_10-g24_4_8.json';      /* the slab with the most triangles */
const IN = 'inner-r20-g24_4_8.json';
const addR = (a, b) => S(Q.add(V.rat(a, 'a'), V.rat(b, 'b')));
const recomputeClaim = c => { c.claim = S(Q.sub(V.rat(c.B, 'B'), Q.mul(V.rat(c.eps, 'eps'), r(c.grid.length)))); };

/* proof-level forgeries: the certificate's numbers no longer prove its bound */
red('slab bound raised by 1e-3 (B, claim recomputed)', SL, c => { c.B = addR(c.B, '1/1000'); recomputeClaim(c); }, /^psd:/);
red('slab bound raised by 1e-6 (B, claim recomputed)', ST, c => { c.B = addR(c.B, '1/1000000'); recomputeClaim(c); }, /^psd:/);
red('triangle forms dropped', ST, c => { c.forms = c.forms.filter(f => f[0] !== 'tri'); }, /^psd:/);
red('triangle forms dropped (most-triangle slab)', SB, c => { c.forms = c.forms.filter(f => f[0] !== 'tri'); }, /^psd:/);
red('all cut theta set to 1', SL, c => { c.theta = c.theta.map(() => '1'); }, /^psd:/);
red('all cut theta set to 0', SL, c => { c.theta = c.theta.map(() => '0'); }, /^psd:/);
red('slab widened: hi 9/20 → 1/2', SL, c => { c.hi = '1/2'; }, /^psd:/);
red('slab widened: lo 2/5 → 3/10', SL, c => { c.lo = '3/10'; }, /^psd:/);
red('eps inflated with B (S + εI still PSD, honest bound negative)', SL, c => { c.B = addR(c.B, '1/1000'); c.eps = addR(c.eps, '1/1000'); }, /^bound:/);
red('eps set to 0 (claim recomputed)', SL, c => { c.eps = '0'; recomputeClaim(c); }, /^psd:/);
red('one tri sign flipped to s1·s2·s3 = −1', ST, c => { const f = c.forms.find(x => x[0] === 'tri'); f[1][3] = f[1][3].map(s => -s); }, /^form: tri with s1·s2·s3 = −1/);
red('grid with the edge 68/1096 removed', SL, c => { c.grid = c.grid.filter(x => x !== 68); }, /^grid:/);
red('grid with the edge 548/1096 removed', IN, c => { c.grid = c.grid.filter(x => x !== 548); }, /^grid:/);
/* planted: one rule each */
red('PLANTED claim raised by 2^−100 over B − ε(1+n)', SL, c => { c.claim = addR(c.claim, TINY); }, /^claim:/);
red('PLANTED negative multiplier (extra yy form, μ = −2^−100)', SL, c => { c.forms.push(['yy', [0, 1], '-' + TINY]); }, /^multiplier:/);
red('PLANTED extra tri with s = (−1,−1,−1), μ = 2^−100', SL, c => { c.forms.push(['tri', [0, 1, 2, [-1, -1, -1]], TINY]); }, /^form: tri with s1·s2·s3 = −1/);
red('PLANTED extra tri with a repeated index, μ = 2^−100', SL, c => { c.forms.push(['tri', [3, 3, 7, [1, 1, 1]], TINY]); }, /^form: tri with a repeated index/);
/* θ planted at the entry already nearest the bound, so the polynomial barely moves */
const argBy = (arr, better) => arr.reduce((b, x, k) => (b < 0 || better(V.rat(x, 't'), V.rat(arr[b], 't')) ? k : b), -1);
red('PLANTED largest theta := 1 + 2^−100', SL, c => { c.theta[argBy(c.theta, (x, y) => Q.cmp(x, y) > 0)] = addR('1', TINY); }, /^theta:/);
red('PLANTED smallest theta := −2^−100', SL, c => { c.theta[argBy(c.theta, (x, y) => Q.cmp(x, y) < 0)] = '-' + TINY; }, /^theta:/);
red('PLANTED unknown form kind "zz", μ = 2^−100', SL, c => { c.forms.push(['zz', [0, 1], TINY]); }, /^form: unknown kind/);
red('PLANTED form index out of range, μ = 2^−100', SL, c => { c.forms.push(['yy', [0, c.grid.length - 1], TINY]); }, /^form: yy index out of range/);
red('PLANTED eps = −2^−100', SL, c => { c.eps = '-' + TINY; }, /^multiplier: eps/);
red('PLANTED theta list one short', SL, c => { c.theta.pop(); }, /^theta:/);
red('PLANTED malformed rational "2.7e-4" for B', SL, c => { c.B = '2.7e-4'; }, /^B: not a rational/);
red('PLANTED grid shifted off 1096', SL, c => { c.grid[c.grid.length - 1] = 1097; }, /^grid:/);

/* inner */
red('inner radius doubled (1/5 → 2/5)', IN, c => { c.rin = '2/5'; }, /^identity:/);
const innerLeftover = (c, mutate) => {                      /* rebalance c so the linear identity holds again */
  mutate(c);
  const gd = V.gridData(c.grid), rin = V.rat(c.rin, 'rin'), kap = V.rat(c.kap, 'kap');
  const lamRow = new Array(gd.n).fill(Q.R(0n));
  for (const [k, v] of Object.entries(c.lam)) { const i = +k.split(',')[0]; lamRow[i] = Q.add(lamRow[i], V.rat(v, 'l')); }
  c.c = gd.cells.map((cell, i) => S(Q.sub(Q.sub(Q.sub(cell.a, lamRow[i]), Q.mul(rin, V.rat(c.nu[i], 'nu'))), Q.mul(Q.mul(kap, rin), cell.w))));
};
red('inner radius doubled, c rebalanced to keep the identity', IN, c => innerLeftover(c, x => { x.rin = '2/5'; }), /^multiplier: c\[/);
red('inner linear budget overspent: c[0] made negative', IN, c => { c.c[0] = S(Q.neg(Q.add(V.rat(c.c[0], 'c'), ONE))); }, /^multiplier: c\[0\]/);
red('inner linear budget overspent: one λ doubled', IN, c => { const k = Object.keys(c.lam)[0]; c.lam[k] = addR(c.lam[k], c.lam[k]); }, /^identity:/);
red('inner budget overspent, rebalanced: λ raised by c_i + 2^−100', IN, c => innerLeftover(c, x => { const i = x.c.findIndex(v => v !== '0'); const k = Object.keys(x.lam).find(k2 => +k2.split(',')[0] === i); x.lam[k] = addR(addR(x.lam[k], x.c[i]), TINY); }), /^multiplier: c\[/);
red('inner RLT multipliers dropped (lam = {})', IN, c => { c.lam = {}; }, /^identity:/);
red('inner RLT multipliers dropped, c rebalanced', IN, c => innerLeftover(c, x => { x.lam = {}; }), /^psd:/);
red('inner nu dropped, c rebalanced', IN, c => innerLeftover(c, x => { x.nu = x.nu.map(() => '0'); }), /^psd:/);
red('inner N[0,0] raised by 1 (P loses it)', IN, c => { c.N['0,0'] = addR(c.N['0,0'] || '0', '1'); }, /^psd:/);
red('PLANTED inner N lower-triangular key', IN, c => { c.N['5,2'] = TINY; }, /^multiplier: N key/);
red('PLANTED inner kap = −2^−100', IN, c => { c.kap = '-' + TINY; }, /^multiplier: kap/);
red('PLANTED inner nu[3] = −2^−100', IN, c => { c.nu[3] = '-' + TINY; }, /^multiplier: nu\[3\]/);

/* the cover */
{
  const without = entries.filter(e => !/slab-3_10-4_10/.test(e.label));
  const cov = V.verifyAll(without);
  check('RED slab [3/10, 2/5] missing from the cover → THEOREM REFUSED', cov.theorem.verdict === 'REFUSED' && !cov.cover.complete, 'gap ' + JSON.stringify(cov.cover.gap));
  const noInner = V.verifyAll(entries.filter(e => !/inner/.test(e.label)));
  check('RED inner certificate missing → THEOREM REFUSED', noInner.theorem.verdict === 'REFUSED' && !noInner.cover.complete, 'gap ' + JSON.stringify(noInner.cover.gap));
  const forged = entries.map(e => /slab-9_20/.test(e.label) ? Object.assign({}, e, { cert: Object.assign(clone(e.cert), { hi: '9/20', lo: '2/5' }) }) : e);
  const dup = V.verifyAll(forged);
  check('RED last slab relabelled [2/5, 9/20] (cover stops short of 1/2) → THEOREM REFUSED', dup.theorem.verdict === 'REFUSED', 'gap ' + JSON.stringify(dup.cover.gap));
}

console.log((fail === 0 ? 'BATTERY GREEN' : 'BATTERY RED') + '   ' + pass + ' pass, ' + fail + ' fail   ' + ((Date.now() - T0) / 1000).toFixed(1) + ' s');
process.exit(fail === 0 ? 0 : 1);
