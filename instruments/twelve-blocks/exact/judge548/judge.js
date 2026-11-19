#!/usr/bin/env node
/* judge.js — an independent judge for one finite statement, E, about 2-colourings of 1..548.

     node judge.js            the nine items, PASS/FAIL each, the verdict on E; exit 0 only if CERTIFIED
     node controls.js         the planted wrong versions

   E: let s be any colouring of 1..548 with M(s) <= 15,756 (M = monochromatic 3-term
   progressions), oriented so that it differs from the twelve-block colouring B in at most
   274 sites. Then s agrees with B outside
     F = {b-1, b, b+1, b+2 : b a boundary of B} ∪ {31, 32, 517, 518}.

   Written from the TEXT of Localisation.md (sections 1, 2, 7, 8, 10) and from the numerical
   data unit-tangents.json. No program of either track was opened. The model (grids, cell
   widths, bathtub constants, cut areas, the slab certificates' verification) is the
   operator's instruments/delta3/verify.js, called through its exports.

   Exact arithmetic decides everything: integers, BigInt, and BigInt fractions
   (instruments/interval/rational.js). Floats appear in two places only, and decide nothing:
   they propose a Cholesky factor whose exact remainder is then checked, and they pick the
   random test colourings. */
'use strict';

const fs = require('fs');
const path = require('path');

const CM = process.env.CERT_MACHINE || path.resolve(__dirname, '..', '..', '..', '..');          /* this repository (changed when the judge was copied here) */
const V = require(path.join(CM, 'instruments', 'delta3', 'verify.js'));
const Q = require(path.join(CM, 'instruments', 'interval', 'rational.js'));
const TANGENT_FILE = path.join(CM, 'corpus', 'twelve-blocks-2', 'run', 'gpt', 'unit-tangents.json');   /* the pinned copy (changed when the judge was copied here) */

const N = 548;
const HALF = N / 2;
const BOUNDS = [28, 34, 62, 99, 158, 274, 390, 449, 486, 514, 520];
const M_BASE = 15756;
const IX = (p, q) => p * (N + 1) + q;
const qi = (a, b) => Q.R(BigInt(a), b === undefined ? 1n : BigInt(b));
const ZERO = qi(0), ONE = qi(1);
const lcmB = (a, b) => a / Q.gcd(a, b) * b;
const babs = x => (x < 0n ? -x : x);

class Fail extends Error {}
const fail = why => { throw new Fail(why); };
const need = (cond, why) => { if (!cond) fail(why); };

/* a small deterministic generator: it only chooses test cases */
function makeRng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/* ---------------------------------------------------------------- the lattice */

function baselineSigns(plant) {
  const b = new Int8Array(N + 1);
  let c = 1, k = 0;
  for (let p = 1; p <= N; p++) { b[p] = c; if (k < BOUNDS.length && p === BOUNDS[k]) { c = -c; k++; } }
  if (plant.baselineFlip) b[plant.baselineFlip] = -b[plant.baselineFlip];
  return b;
}

/* the plain count: triples (a, a+d, a+2d), d >= 1, inside 1..N, of one colour */
function countMono(s) {
  let M = 0;
  for (let d = 1; 2 * d <= N - 1; d++) for (let a = 1; a + 2 * d <= N; a++) if (s[a] === s[a + d] && s[a] === s[a + 2 * d]) M++;
  return M;
}
/* 4R(s) = sum_{j=1}^{274} (s_j - s_{274+j})(s_{2j-1} - s_{2j})   (section 10) */
function R4(s) {
  let t = 0;
  for (let j = 1; j <= HALF; j++) t += (s[j] - s[HALF + j]) * (s[2 * j - 1] - s[2 * j]);
  return t;
}
function paritySums(s) {
  let S0 = 0, S1 = 0;
  for (let p = 1; p <= N; p++) if (p % 2 === 0) S0 += s[p]; else S1 += s[p];
  return [S0, S1];
}
function Kof(G, s) {
  let t = 0;
  for (let p = 1; p <= N; p++) { let row = 0; const o = p * (N + 1); for (let q = 1; q <= N; q++) row += G[o + q] * s[q]; t += row * s[p]; }
  return t;
}
function randomColouring(rng, density) {
  const s = new Int8Array(N + 1);
  for (let p = 1; p <= N; p++) s[p] = rng() < density ? 1 : -1;
  return s;
}
function flipped(b, delta) {
  const s = new Int8Array(N + 1);
  for (let p = 1; p <= N; p++) s[p] = delta[p] ? -b[p] : b[p];
  return s;
}
function randomDelta(rng, density) {
  const d = new Uint8Array(N + 1);
  for (let p = 1; p <= N; p++) d[p] = rng() < density ? 1 : 0;
  return d;
}

/* ---------------------------------------------------------------- item 1 */
function item1(ctx) {
  /* the indicator of a monochromatic triple, on all eight sign patterns */
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1])
    need(((a === b && b === c) ? 4 : 0) === 1 + a * b + b * c + a * c, 'the triple indicator (1+ab+bc+ca)/4 fails');
  /* enumerate the triples: T and the unordered pair weights w_pq */
  const W = new Int32Array((N + 1) * (N + 1));
  let T = 0;
  for (let d = 1; 2 * d <= N - 1; d++) for (let a = 1; a + 2 * d <= N; a++) {
    T++; W[IX(a, a + d)]++; W[IX(a + d, a + 2 * d)]++; W[IX(a, a + 2 * d)]++;
  }
  need(T === Math.floor((N - 1) * (N - 1) / 4), 'T is not floor((n-1)^2/4)');
  /* r_pq: the coefficient array of 4R, four ordered terms per j */
  const r = new Int8Array((N + 1) * (N + 1));
  for (let j = 1; j <= HALF; j++) {
    r[IX(j, 2 * j - 1)] += 1; r[IX(j, 2 * j)] -= 1; r[IX(HALF + j, 2 * j - 1)] -= 1; r[IX(HALF + j, 2 * j)] += 1;
  }
  /* G_pq = 4[1 <= 2p-q <= n] - r_pq, and its range */
  const G = new Int8Array((N + 1) * (N + 1));
  const hist = [0, 0, 0, 0, 0];
  for (let p = 1; p <= N; p++) for (let q = 1; q <= N; q++) {
    const e = 2 * p - q;
    const g = (e >= 1 && e <= N ? 4 : 0) - r[IX(p, q)];
    need(g >= 0 && g <= 4, 'G_pq = ' + g + ' outside [0,4] at (' + p + ',' + q + ')');
    G[IX(p, q)] = g; hist[g]++;
  }
  /* coefficient comparison, using s_p^2 = 1.
       left:  16 M = 4T + 4 sum_{p<q} w_pq s_p s_q
       right: 4T - 6n + 2(S0^2+S1^2) + sum_pq (G_pq + r_pq) s_p s_q */
  let diag = 0;
  for (let p = 1; p <= N; p++) diag += G[IX(p, p)] + r[IX(p, p)];
  const constRight = 4 * T - 6 * N + 2 * N + diag;
  need(constRight === 4 * T, 'the constant coefficients differ: ' + constRight + ' vs ' + 4 * T);
  let pairs = 0;
  for (let p = 1; p <= N; p++) for (let q = p + 1; q <= N; q++) {
    const left = 4 * W[IX(p, q)];
    const right = ((p - q) % 2 === 0 ? 4 : 0) + G[IX(p, q)] + G[IX(q, p)] + r[IX(p, q)] + r[IX(q, p)];
    need(left === right, 'the pair coefficient differs at {' + p + ',' + q + '}: ' + left + ' vs ' + right);
    pairs++;
  }
  /* sanity: the identity against a plain triple count on random colourings; also that the
     array r really is the coefficient array of the closed formula for 4R */
  const rng = makeRng(101);
  let tests = 0;
  for (const dens of [0.5, 0.5, 0.5, 0.5, 0.1, 0.9, 0.3, 0.7, 0.02, 0.5, 0.5, 0.5]) for (let rep = 0; rep < 5; rep++) {
    const s = randomColouring(rng, dens);
    const [S0, S1] = paritySums(s);
    let rr = 0;
    for (let p = 1; p <= N; p++) for (let q = 1; q <= N; q++) if (r[IX(p, q)]) rr += r[IX(p, q)] * s[p] * s[q];
    need(rr === R4(s), 'the array r is not the coefficient array of 4R');
    const right = 4 * T - 6 * N + 2 * (S0 * S0 + S1 * S1) + Kof(G, s) + R4(s);
    need(16 * countMono(s) === right, 'numeric test: 16M differs from the identity');
    tests++;
  }
  Object.assign(ctx, { T, W, r, G });
  return 'T = ' + T + '; ' + pairs + ' pair coefficients and the constant agree; G values 0,1,2,3,4 occur ' + hist.join(', ') + ' times; ' + tests + ' random colourings agree with the plain count';
}

/* ---------------------------------------------------------------- item 2 */
function item2(ctx) {
  const b = ctx.b;
  const M = countMono(b);
  const [S0, S1] = paritySums(b);
  const r4 = R4(b);
  ctx.MB = M; ctx.S0B = S0; ctx.S1B = S1; ctx.R4B = r4;
  need(M === M_BASE, 'M(B) = ' + M + ', not 15,756');
  need(S0 * S0 + S1 * S1 === 8 && S0 + S1 === 0, 'the parity sums are (' + S0 + ', ' + S1 + '), not 2 and -2');
  need(r4 === 0, 'R(B) = ' + r4 / 4 + ', not 0');
  /* cross-check with item 1's identity, if it stands */
  if (ctx.G) need(16 * M === 4 * ctx.T - 6 * N + 2 * (S0 * S0 + S1 * S1) + Kof(ctx.G, b) + r4, 'the identity fails at B');
  let split = 0;
  for (let j = 1; j <= HALF; j++) if (b[2 * j - 1] !== b[2 * j]) split++;
  ctx.baseSplit = split;
  return 'M(B) = ' + M + ' by direct count; even-site sum ' + S0 + ', odd-site sum ' + S1 + '; R(B) = 0; ' + split + ' pairs (2j-1, 2j) are split in B';
}

/* ---------------------------------------------------------------- item 3 */
function item3(ctx) {
  const { G, b } = ctx;
  need(G, 'needs the array G of item 1');
  /* 8 h_p = - sum_q (G_pq + G_qp) b_p b_q */
  const h8 = new Int32Array(N + 1);
  for (let p = 1; p <= N; p++) {
    let t = 0;
    for (let q = 1; q <= N; q++) t += (G[IX(p, q)] + G[IX(q, p)]) * b[q];
    h8[p] = -t * b[p];
  }
  ctx.h8 = h8;
  const KB = Kof(G, b);
  ctx.KB = KB;
  /* 16 Y by the expansion: 2 sum h8_p d_p + 4 sum_pq G_pq b_p b_q d_p d_q */
  const Y16 = delta => {
    const fl = [];
    for (let p = 1; p <= N; p++) if (delta[p]) fl.push(p);
    let lin = 0, quad = 0;
    for (const p of fl) { lin += h8[p]; for (const q of fl) quad += G[IX(p, q)] * b[p] * b[q]; }
    return 2 * lin + 4 * quad;
  };
  ctx.Y16 = Y16;
  /* the expansion against the definition Y = (K(s) - K(b))/16:
     every single flip, random pairs, random flip vectors of several densities */
  const rng = makeRng(202);
  let tests = 0;
  const check = delta => {
    const s = flipped(b, delta);
    need(Kof(G, s) - KB === Y16(delta), 'the expansion of Y differs from (K(s)-K(b))/16');
    tests++;
    return s;
  };
  for (let p = 1; p <= N; p++) { const d = new Uint8Array(N + 1); d[p] = 1; check(d); }
  for (let rep = 0; rep < 300; rep++) { const d = new Uint8Array(N + 1); d[1 + Math.floor(rng() * N)] = 1; d[1 + Math.floor(rng() * N)] = 1; check(d); }
  let mtests = 0;
  for (const dens of [0.005, 0.02, 0.1, 0.3, 0.5]) for (let rep = 0; rep < 12; rep++) {
    const d = randomDelta(rng, dens);
    const s = check(d);
    /* 16 (M(s) - M(B)) = 2 (S0^2 + S1^2 - S0B^2 - S1B^2) + 16 Y + 4 (R(s) - R(B)) */
    const [S0, S1] = paritySums(s);
    const right = 2 * (S0 * S0 + S1 * S1 - ctx.S0B * ctx.S0B - ctx.S1B * ctx.S1B) + Y16(d) + R4(s) - ctx.R4B;
    need(16 * (countMono(s) - ctx.MB) === right, 'M(s) - M(B) differs from Y + R/4 + parity');
    mtests++;
  }
  let hmin = Infinity, hmax = -Infinity, zeros = 0;
  for (let p = 1; p <= N; p++) { hmin = Math.min(hmin, h8[p]); hmax = Math.max(hmax, h8[p]); if (h8[p] === 0) zeros++; }
  return 'h_p computed for 548 sites (8h_p integer, from ' + hmin + ' to ' + hmax + '); the expansion equals (K(s)-K(b))/16 on ' + tests + ' flip vectors (all single flips included); M(s)-M(B) = Y + R/4 + (S0^2+S1^2-8)/8 on ' + mtests + ' colourings by direct count';
}

/* ---------------------------------------------------------------- the model */
function loadModel(ctx) {
  if (ctx.model) return ctx.model;
  const files = V.defaultFiles();
  const entries = V.loadEntries(files);
  need(entries.length === 5, 'expected five certificate files, found ' + entries.length);
  const grids = [];
  const certs = entries.map(e => {
    need(e.cert, 'unreadable certificate ' + e.label);
    const gd = V.gridData(e.cert.grid);
    let g = grids.find(x => x.gd === gd);
    if (!g) { g = { gd, users: [] }; grids.push(g); }
    g.users.push(e.label);
    return { label: e.label, sha: e.sha, cert: e.cert, gd, kind: 'rin' in e.cert ? 'inner' : 'slab' };
  });
  /* every grid point on a site boundary; the sites and the capacity of every cell */
  for (const g of grids) {
    const gd = g.gd;
    g.cells = gd.cells.map((c, i) => {
      need(c.p % 2 === 0 && c.q % 2 === 0, 'grid point off the site lattice in cell ' + i);
      const lo = c.p / 2 + 1, hi = c.q / 2, cap = hi - lo + 1;
      need(Q.cmp(c.w, qi(cap, N)) === 0, 'cell width is not (sites)/548 in cell ' + i);
      return { lo, hi, cap, s: c.s, w: c.w, a: c.a, b: c.b };
    });
    need(g.cells[0].lo === 1 && g.cells[g.cells.length - 1].hi === N, 'the grid does not cover 1..548');
    for (let i = 0; i + 1 < g.cells.length; i++) need(g.cells[i].hi + 1 === g.cells[i + 1].lo, 'cells are not consecutive');
  }
  ctx.model = { certs, grids };
  return ctx.model;
}

/* ---------------------------------------------------------------- item 4 (F1) */
function item4(ctx) {
  const { h8, b } = ctx;
  need(h8, 'needs the site fields of item 3');
  const model = loadModel(ctx);
  const n2 = qi(N * N);
  let cellsChecked = 0, ineqs = 0, tight = 0, minSlack = null;
  model.grids.forEach((g, gi) => {
    g.cells.forEach((c, i) => {
      for (let p = c.lo; p <= c.hi; p++) need(b[p] === c.s, 'grid ' + gi + ' cell ' + i + ': the baseline sign is not the cell\'s ideal sign at site ' + p);
      const hs = [];
      for (let p = c.lo; p <= c.hi; p++) hs.push(h8[p]);
      hs.sort((x, y) => x - y);
      let bq = c.b;
      if (ctx.plant.f1DoubleB && ctx.plant.f1DoubleB.grid === gi && ctx.plant.f1DoubleB.cell === i) bq = Q.mul(bq, qi(2));
      let pre = 0;
      for (let t = 0; t <= c.cap; t++) {
        if (t > 0) pre += hs[t - 1];
        const left = qi(pre, 8);
        const y = qi(t, c.cap);
        const right = Q.mul(n2, Q.add(Q.mul(c.a, y), Q.mul(bq, Q.mul(y, y))));
        const cmp = Q.cmp(left, right);
        if (cmp < 0) fail('F1 fails on grid ' + gi + ' (' + g.cells.length + ' cells) cell ' + i + ' (sites ' + c.lo + '..' + c.hi + ') at t = ' + t + ': sum of the ' + t + ' smallest h = ' + Q.toString(left) + ' < ' + Q.toString(right));
        if (t > 0) { if (cmp === 0) tight++; const sl = Q.sub(left, right); if (minSlack === null || Q.cmp(sl, minSlack) < 0) minSlack = sl; }
        ineqs++;
      }
      cellsChecked++;
    });
  });
  return cellsChecked + ' cells on ' + model.grids.length + ' distinct grids (' + model.grids.map(g => g.cells.length + ' cells, used by ' + g.users.length).join('; ') + '); ' + ineqs + ' inequalities, ' + tight + ' with equality at t >= 1, least slack ' + Q.toString(minSlack);
}

/* ---------------------------------------------------------------- item 5 (F2) */
function item5(ctx) {
  const { G, b, h8 } = ctx;
  need(G && h8, 'needs items 1 and 3');
  const model = loadModel(ctx);
  /* prefix sums of G[m][p]: m the middle site (first index), p the other (second index) */
  const PS = new Int32Array((N + 1) * (N + 1));
  for (let m = 1; m <= N; m++) for (let p = 1; p <= N; p++) PS[IX(m, p)] = G[IX(m, p)] + PS[IX(m - 1, p)] + PS[IX(m, p - 1)] - PS[IX(m - 1, p - 1)];
  const rect = (m0, m1, p0, p1) => PS[IX(m1, p1)] - PS[IX(m0 - 1, p1)] - PS[IX(m1, p0 - 1)] + PS[IX(m0 - 1, p0 - 1)];
  const n2x4 = qi(4 * N * N);
  const out = [];
  model.grids.forEach((g, gi) => {
    const gd = g.gd, n = g.cells.length;
    /* the model's inside area for every ordered pair (i, j): a in cell i, b in cell j */
    const kind = new Uint8Array(n * n);             /* 0 absent, 1 full, 2 cut */
    const ain = new Array(n * n).fill(null);
    for (const f of gd.full) {
      need(kind[f.i * n + f.j] === 0, 'model: pair listed twice');
      kind[f.i * n + f.j] = 1;
      need(Q.cmp(f.coef, Q.mul(qi(g.cells[f.i].s * g.cells[f.j].s), Q.mul(g.cells[f.i].w, g.cells[f.j].w))) === 0, 'model: full-pair coefficient is not s_i s_j w_i w_j');
    }
    for (const c of gd.cut) {
      need(kind[c.i * n + c.j] === 0, 'model: pair listed twice');
      kind[c.i * n + c.j] = 2; ain[c.i * n + c.j] = c.Ain;
      const ww = Q.mul(g.cells[c.i].w, g.cells[c.j].w);
      need(Q.cmp(c.ww, ww) === 0 && c.sgn === g.cells[c.i].s * g.cells[c.j].s, 'model: cut-pair data inconsistent');
      need(Q.cmp(Q.add(c.Ain, c.Aout), ww) === 0 && Q.sign(c.Ain) > 0 && Q.sign(c.Aout) > 0, 'model: cut-pair areas inconsistent');
    }
    let nf = 0, nc = 0, na = 0;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const ci = g.cells[i], cj = g.cells[j];
      const a4 = rect(cj.lo, cj.hi, ci.lo, ci.hi);        /* 4a = sum of G_qp, p in cell i, q in cell j */
      const full4 = 4 * ci.cap * cj.cap;
      const k = kind[i * n + j];
      if (k === 0) { need(a4 === 0, 'F2: grid ' + gi + ' pair (' + i + ',' + j + ') absent in the model but the finite inside sum is ' + a4 + '/4'); na++; }
      else if (k === 1) { need(a4 === full4, 'F2: grid ' + gi + ' pair (' + i + ',' + j + ') full in the model but the finite inside sum is ' + a4 + '/4 of ' + full4 + '/4'); nf++; }
      else {
        need(a4 > 0 && a4 < full4, 'F2: grid ' + gi + ' pair (' + i + ',' + j + ') cut in the model but not in the finite sum');
        need(Q.cmp(Q.mul(n2x4, ain[i * n + j]), qi(a4)) === 0, 'F2: grid ' + gi + ' pair (' + i + ',' + j + '): finite inside sum ' + a4 + '/4 is not n^2 times the model area ' + Q.toString(ain[i * n + j]));
        nc++;
      }
    }
    out.push(n * n + ' ordered pairs (' + nf + ' full, ' + nc + ' cut, ' + na + ' absent)');
  });
  /* the polynomials themselves. For each certificate, L (L0 for the inner one, L_theta for a
     slab) is written here from the finite inequalities alone:
        cells    a_i y_i + b_i y_i^2                               (F1)
        full     s_i s_j w_i w_j y_i y_j                            (F2, z = t_i t_j)
        cut, +   theta * 0 + (1 - theta) * (w_i w_j y_i y_j - A_out)   (F2, z >= 0 and z >= t_i t_j - (c_i c_j - a))
        cut, -   theta * (-A_in) + (1 - theta) * (-w_i w_j y_i y_j)    (F2, z <= a and z <= t_i t_j)
     with theta in [0,1] from the file (inner: the bound that vanishes at y = 0), and compared
     coefficient by coefficient with what the October verifier's own builder (addL) produces:
     the polynomial its certificates bound is the polynomial the finite Y dominates. */
  let polyChecked = 0;
  for (const c of model.certs) {
    const g = model.grids.find(x => x.gd === c.gd), gd = c.gd, n = gd.n;
    let theta = 'inner';
    if (c.kind === 'slab') {
      need(Array.isArray(c.cert.theta) && c.cert.theta.length === gd.cut.length, 'theta has the wrong length in ' + c.label);
      theta = c.cert.theta.map(t => V.rat(t, 'theta'));
      for (const t of theta) need(Q.sign(t) >= 0 && Q.cmp(t, ONE) <= 0, 'a theta outside [0,1] in ' + c.label);
    }
    let k0 = ZERO;
    const lin = g.cells.map(x => x.a), C = new Array(n * n).fill(ZERO);
    const addYY = (i, j, v) => { if (i > j) { const t = i; i = j; j = t; } C[i * n + j] = Q.add(C[i * n + j], v); };
    g.cells.forEach((x, i) => addYY(i, i, x.b));
    for (const f of gd.full) addYY(f.i, f.j, Q.mul(qi(g.cells[f.i].s * g.cells[f.j].s), Q.mul(g.cells[f.i].w, g.cells[f.j].w)));
    gd.cut.forEach((x, t) => {
      const sgn = g.cells[x.i].s * g.cells[x.j].s, ww = Q.mul(g.cells[x.i].w, g.cells[x.j].w);
      const th = theta === 'inner' ? (sgn > 0 ? ONE : ZERO) : theta[t], om = Q.sub(ONE, th);
      if (sgn > 0) { k0 = Q.sub(k0, Q.mul(om, Q.sub(ww, x.Ain))); addYY(x.i, x.j, Q.mul(om, ww)); }
      else { k0 = Q.sub(k0, Q.mul(th, x.Ain)); addYY(x.i, x.j, Q.neg(Q.mul(om, ww))); }
    });
    const pm = new V.Poly(gd.w);
    V.addL(pm, gd, theta);
    pm.finish();
    need(Q.cmp(pm.k, k0) === 0, 'the model polynomial of ' + c.label + ' differs from the finite one (constant)');
    for (let i = 0; i < n; i++) need(Q.cmp(pm.g[i], lin[i]) === 0, 'the model polynomial of ' + c.label + ' differs from the finite one (linear, cell ' + i + ')');
    for (let i = 0; i < n; i++) for (let j = i; j < n; j++) need(Q.cmp(pm.C[i * n + j], C[i * n + j]) === 0, 'the model polynomial of ' + c.label + ' differs from the finite one (quadratic ' + i + ',' + j + ')');
    for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) need(Q.sign(pm.C[i * n + j]) === 0, 'the model polynomial stores a coefficient below the diagonal');
    polyChecked++;
  }
  out.push('the polynomial of each of the ' + polyChecked + ' certificates, written from the finite inequalities, equals the October builder\'s coefficient by coefficient');
  /* numeric cross-check of the consequence, with the model's own evaluator:
     Y(delta) >= n^2 L(y), L with the better of the two cut bounds ('max'), and >= n^2 L0(y) */
  const rng = makeRng(303);
  let tests = 0, minGap = null;
  const n2 = qi(N * N);
  model.grids.forEach(g => {
    const inner = model.certs.find(c => c.kind === 'inner' && c.gd === g.gd);
    const deltas = [];
    for (const dens of [0.002, 0.01, 0.05, 0.15, 0.3, 0.5, 0.8]) for (let rep = 0; rep < 6; rep++) deltas.push(randomDelta(rng, dens));
    /* structured: one whole cell, the cheapest sites of a cell, a window */
    for (let rep = 0; rep < 12; rep++) { const d = new Uint8Array(N + 1); const c = g.cells[Math.floor(rng() * g.cells.length)]; for (let p = c.lo; p <= c.hi; p++) d[p] = 1; deltas.push(d); }
    for (const bd of BOUNDS) { const d = new Uint8Array(N + 1); d[bd] = 1; d[bd + 1] = 1; deltas.push(d); }
    for (const d of deltas) {
      const y = g.cells.map(c => { let t = 0; for (let p = c.lo; p <= c.hi; p++) t += d[p]; return qi(t, c.cap); });
      const Y = qi(ctx.Y16(d), 16);
      const Lmax = Q.mul(n2, V.evalL(g.gd, y, 'max'));
      need(Q.cmp(Y, Lmax) >= 0, 'numeric test: Y < n^2 L(y) on a flip vector');
      const gap = Q.sub(Y, Lmax);
      if (minGap === null || Q.cmp(gap, minGap) < 0) minGap = gap;
      if (inner) need(Q.cmp(Lmax, Q.mul(n2, V.evalL(g.gd, y, 'inner'))) >= 0, 'numeric test: L0 above L');
      tests++;
    }
  });
  void b;
  return out.join('; ') + '; every finite inside sum equals n^2 times the model area; numeric: Y >= n^2 L(y) on ' + tests + ' flip vectors (least gap ' + Q.toString(minGap) + ')';
}

/* ---------------------------------------------------------------- exact positive definiteness */

/* float Cholesky of F - tau I; null when a pivot is not positive */
function cholesky(F, tau) {
  const n = F.length;
  const L = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = F[i][j] - (i === j ? tau : 0);
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (!(s > 0)) return null; L[i][i] = Math.sqrt(s); } else L[i][j] = s / L[j][j];
  }
  return L;
}
/* cyclic Jacobi, floats: the eigenvector of the least eigenvalue (a proposal only) */
function leastEigenvector(F) {
  const n = F.length;
  const A = F.map(r => Float64Array.from(r));
  const Vv = Array.from({ length: n }, (_, i) => { const r = new Float64Array(n); r[i] = 1; return r; });
  for (let sweep = 0; sweep < 30; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += A[p][q] * A[p][q];
    if (off < 1e-26) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = Vv[k][p], vkq = Vv[k][q]; Vv[k][p] = c * vkp - s * vkq; Vv[k][q] = s * vkp + c * vkq; }
    }
  }
  let best = 0;
  for (let i = 1; i < n; i++) if (A[i][i] < A[best][best]) best = i;
  return { value: A[best][best], vector: Vv.map(r => r[best]) };
}

/* Decide a symmetric rational matrix A:
     PD      proved: A' = D A D (D a diagonal of powers of two) equals L L^T + E with L an
             exact dyadic matrix and E exactly strictly diagonally dominant with positive
             diagonal, so E is positive definite and so is A.
     NOT     proved: an exact rational vector v with v^T A v <= 0 ... reported with its value.
     UNKNOWN neither. */
function decidePD(A) {
  const n = A.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (Q.cmp(A[i][j], A[j][i]) !== 0) return { verdict: 'UNKNOWN', why: 'not symmetric' };
  for (let i = 0; i < n; i++) if (Q.sign(A[i][i]) <= 0) return { verdict: 'NOT', why: 'diagonal entry ' + i + ' is not positive', value: Q.toString(A[i][i]) };
  /* exact dyadic rescaling to a unit-size diagonal */
  const e = [];
  for (let i = 0; i < n; i++) e.push(Math.round(-0.5 * Math.log2(Q.toDouble(A[i][i]))));
  const pow2 = k => (k >= 0 ? Q.R(1n << BigInt(k), 1n) : Q.R(1n, 1n << BigInt(-k)));
  const S = A.map((row, i) => row.map((x, j) => Q.mul(x, pow2(e[i] + e[j]))));
  let den = 1n;
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) den = lcmB(den, S[i][j].d);
  const Z = S.map(row => row.map(x => x.n * (den / x.d)));
  const F = S.map(row => row.map(Q.toDouble));
  const T = 50, scale = 1n << BigInt(2 * T), two = 2 ** T;
  let last = 'the float Cholesky found a nonpositive pivot';
  for (let k = 46; k >= 6; k -= 4) {
    const tau = 2 ** -k;
    const L = cholesky(F, tau);
    if (!L) break;                                  /* a larger shift cannot succeed either */
    const Lz = L.map(row => Array.from(row, x => BigInt(Math.round(x * two))));
    /* E = S - Lz Lz^T / 4^T, times den * 4^T */
    let ok = true, margin = null;
    const rowsum = new Array(n).fill(0n), dg = new Array(n);
    for (let i = 0; i < n && ok; i++) for (let j = 0; j <= i; j++) {
      let acc = 0n;
      const Li = Lz[i], Lj = Lz[j];
      for (let t = 0; t <= j; t++) acc += Li[t] * Lj[t];
      const E = Z[i][j] * scale - den * acc;
      if (i === j) dg[i] = E; else { rowsum[i] += babs(E); rowsum[j] += babs(E); }
    }
    for (let i = 0; i < n; i++) {
      const m = dg[i] - rowsum[i];
      if (m <= 0n) { ok = false; last = 'the exact remainder is not strictly diagonally dominant at shift 2^-' + k; break; }
      if (margin === null || m < margin) margin = m;
    }
    if (ok) return { verdict: 'PD', shift: '2^-' + k, margin: Q.toDouble(Q.R(margin, den * scale)) };
  }
  /* an exact witness of failure */
  const ev = leastEigenvector(F);
  const vz = ev.vector.map(x => BigInt(Math.round(x * 2 ** 40)));
  let acc = 0n;
  for (let i = 0; i < n; i++) { if (vz[i] === 0n) continue; let row = 0n; for (let j = 0; j < n; j++) if (vz[j] !== 0n) row += Z[i][j] * vz[j]; acc += row * vz[i]; }
  if (acc <= 0n && vz.some(x => x !== 0n)) {
    /* v^T S v <= 0 with v = vz / 2^40, that is u^T A u <= 0 for u = D v */
    return { verdict: 'NOT', why: 'an exact vector v with v^T A v ' + (acc < 0n ? '< 0' : '= 0'), value: Q.toDouble(Q.R(acc, den << 80n)), floatLeastEigenvalue: ev.value };
  }
  return { verdict: 'UNKNOWN', why: last, floatLeastEigenvalue: ev.value };
}

/* ---------------------------------------------------------------- item 6 */

/* the inner identity, assembled here from the model's cell and pair data and the file's
   multipliers: L0(y) - multiplier terms must be exactly y^T P y */
function assembleInner(cert, gd) {
  const n = gd.n;
  const rin = V.rat(cert.rin, 'rin');
  const lin = gd.cells.map(c => c.a);
  const Mq = Array.from({ length: n }, () => new Array(n).fill(ZERO));
  const half = qi(1, 2);
  const addYY = (i, j, c) => {                       /* c * y_i y_j into the symmetric matrix */
    if (i === j) { Mq[i][i] = Q.add(Mq[i][i], c); return; }
    const h = Q.mul(c, half);
    Mq[i][j] = Q.add(Mq[i][j], h); Mq[j][i] = Q.add(Mq[j][i], h);
  };
  gd.cells.forEach((c, i) => addYY(i, i, c.b));
  for (const f of gd.full) addYY(f.i, f.j, f.coef);
  for (const c of gd.cut) if (c.sgn < 0) addYY(c.i, c.j, Q.neg(c.ww));     /* sgn > 0: the bound 0 */
  const L0 = { lin: lin.slice(), quad: Mq.map(r => r.slice()) };
  const nonneg = (x, what) => { need(Q.sign(x) >= 0, 'multiplier ' + what + ' is negative'); return x; };
  const key = (k, what) => {
    const m = /^(\d+),(\d+)$/.exec(k);
    need(m, 'bad ' + what + ' key ' + k);
    const i = +m[1], j = +m[2];
    need(i < n && j < n, what + ' index out of range');
    return [i, j];
  };
  const lam = Array.from({ length: n }, () => new Array(n).fill(ZERO));
  for (const [k, v] of Object.entries(cert.lam)) {
    const [i, j] = key(k, 'lam');
    const x = nonneg(V.rat(v, 'lam'), 'lam ' + k);
    lam[i][j] = Q.add(lam[i][j], x);
    lin[i] = Q.sub(lin[i], x); addYY(i, j, x);       /* - x y_i (1 - y_j) */
  }
  need(Array.isArray(cert.nu) && cert.nu.length === n && Array.isArray(cert.c) && cert.c.length === n, 'nu or c has the wrong length');
  const nu = cert.nu.map((v, j) => nonneg(V.rat(v, 'nu'), 'nu[' + j + ']'));
  nu.forEach((x, j) => {
    if (Q.sign(x) === 0) return;
    lin[j] = Q.sub(lin[j], Q.mul(x, rin));           /* - x y_j (rin - m) */
    for (let k = 0; k < n; k++) addYY(j, k, Q.mul(x, gd.w[k]));
  });
  const kap = nonneg(V.rat(cert.kap, 'kap'), 'kap');
  if (Q.sign(kap) !== 0) for (let k = 0; k < n; k++) {
    lin[k] = Q.sub(lin[k], Q.mul(kap, Q.mul(rin, gd.w[k])));
    for (let l = 0; l < n; l++) Mq[k][l] = Q.add(Mq[k][l], Q.mul(kap, Q.mul(gd.w[k], gd.w[l])));
  }
  const Nm = Array.from({ length: n }, () => new Array(n).fill(ZERO));
  for (const [k, v] of Object.entries(cert.N)) {
    const [i, j] = key(k, 'N');
    need(i <= j, 'N key below the diagonal');
    const x = nonneg(V.rat(v, 'N'), 'N ' + k);
    Nm[i][j] = Q.add(Nm[i][j], x); if (i !== j) Nm[j][i] = Q.add(Nm[j][i], x);
    addYY(i, j, Q.neg(Q.mul(x, qi(i === j ? 1 : 2))));
  }
  const cvec = cert.c.map((v, i) => nonneg(V.rat(v, 'c'), 'c[' + i + ']'));
  cvec.forEach((x, i) => { lin[i] = Q.sub(lin[i], x); });
  const bad = lin.findIndex(x => Q.sign(x) !== 0);
  need(bad < 0, 'the inner identity leaves a linear residual at cell ' + bad);
  return { n, rin, P: Mq, lam, nu, kap, Nm, cvec, L0 };
}

function item6(ctx) {
  const model = loadModel(ctx);
  const C = ctx.plant.C || 948;
  const innerC = model.certs.find(c => c.kind === 'inner');
  need(innerC, 'no inner certificate');
  const gd = innerC.gd;
  const inner = assembleInner(innerC.cert, gd);
  ctx.inner = inner; ctx.innerGrid = model.grids.find(g => g.gd === gd); ctx.innerGd = gd;
  need(Q.cmp(inner.rin, qi(1, 5)) === 0, 'the inner region is not m <= 1/5');
  /* the assembly against direct evaluation at random rational points, and against the model's L0 */
  const rng = makeRng(404);
  const n = inner.n;
  for (let rep = 0; rep < 4; rep++) {
    const y = [];
    for (let i = 0; i < n; i++) y.push(qi(Math.floor(rng() * 17), 16));
    let m = ZERO;
    for (let i = 0; i < n; i++) m = Q.add(m, Q.mul(gd.w[i], y[i]));
    let l0 = ZERO;
    for (let i = 0; i < n; i++) { l0 = Q.add(l0, Q.mul(inner.L0.lin[i], y[i])); for (let j = 0; j < n; j++) if (Q.sign(inner.L0.quad[i][j])) l0 = Q.add(l0, Q.mul(inner.L0.quad[i][j], Q.mul(y[i], y[j]))); }
    need(Q.cmp(l0, V.evalL(gd, y, 'inner')) === 0, 'my L0 differs from the model\'s L0');
    let rhs = ZERO;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (Q.sign(inner.P[i][j])) rhs = Q.add(rhs, Q.mul(inner.P[i][j], Q.mul(y[i], y[j])));
      if (Q.sign(inner.lam[i][j])) rhs = Q.add(rhs, Q.mul(inner.lam[i][j], Q.mul(y[i], Q.sub(ONE, y[j]))));
      if (Q.sign(inner.Nm[i][j])) rhs = Q.add(rhs, Q.mul(inner.Nm[i][j], Q.mul(y[i], y[j])));
    }
    for (let i = 0; i < n; i++) rhs = Q.add(rhs, Q.add(Q.mul(inner.nu[i], Q.mul(y[i], Q.sub(inner.rin, m))), Q.mul(inner.cvec[i], y[i])));
    rhs = Q.add(rhs, Q.mul(inner.kap, Q.mul(m, Q.sub(inner.rin, m))));
    need(Q.cmp(l0, rhs) === 0, 'the inner identity fails at a random rational point');
  }
  /* P - w w^T / C positive definite */
  const PC = inner.P.map((row, i) => row.map((x, j) => Q.sub(x, Q.mul(Q.mul(gd.w[i], gd.w[j]), qi(1, C)))));
  const pd = decidePD(PC);
  ctx.pd948 = pd;
  need(pd.verdict === 'PD', 'P - w w^T/' + C + ' is not proved positive definite: ' + pd.verdict + ' (' + pd.why + (pd.value !== undefined ? ', value ' + pd.value : '') + (pd.floatLeastEigenvalue !== undefined ? ', float least eigenvalue of the rescaled matrix ' + pd.floatLeastEigenvalue : '') + ')');
  /* the five certificates by the October verifier; the slabs' bounds and the cover */
  if (!ctx.cache.verified) ctx.cache.verified = model.certs.map(c => V.verifyCertificate(c.cert, c.label));
  const results = ctx.cache.verified;
  results.forEach(x => need(x.verdict === 'VERIFIED', 'the October verifier refuses ' + x.file + ': ' + x.why));
  need(V.cover(results).complete, 'the certificate regions do not cover [0, 1/2]');
  const thr = qi(1, 4 * C);
  let minSlab = null;
  const slabs = results.filter(x => x.kind === 'slab').map(x => ({ lo: V.rat(x.region.lo, 'lo'), hi: V.rat(x.region.hi, 'hi'), bound: V.rat(x.bound, 'bound') }));
  need(slabs.length === 4, 'expected four slabs');
  for (const s of slabs) {
    need(Q.cmp(s.bound, thr) > 0, 'a slab bound ' + Q.toString(s.bound) + ' does not exceed 1/' + 4 * C);
    if (minSlab === null || Q.cmp(s.bound, minSlab) < 0) minSlab = s.bound;
  }
  /* every k with n/5 <= k <= n/2 lies in a slab region */
  for (let k = Math.ceil(N / 5); k <= HALF; k++) need(slabs.some(s => Q.cmp(s.lo, qi(k, N)) <= 0 && Q.cmp(qi(k, N), s.hi) <= 0), 'k = ' + k + ' is in no slab region');
  /* the numeric steps, in integers.
     (a) Y >= k^2/C for every k <= n/2: inner for k <= n/5; on a slab Y >= n^2 bound > n^2/(4C) >= k^2/C.
     (b) -R <= k + (split pairs of B), so M(s) <= M(B) gives Y <= 1 + (k + split)/4.
     (c) hence 4k^2 - C k - C (4 + split) <= 0. */
  need(ctx.baseSplit !== undefined && ctx.MB === M_BASE && ctx.R4B === 0 && ctx.S0B * ctx.S0B + ctx.S1B * ctx.S1B === 8, 'needs the baseline facts of item 2');
  const split = ctx.baseSplit;
  let kmax = -1;
  for (let k = 0; k <= HALF; k++) if (4 * k * k - C * k - C * (4 + split) <= 0) kmax = k;
  for (let k = kmax + 1; k <= HALF; k++) need(4 * k * k - C * k - C * (4 + split) > 0, 'the quadratic bound is not monotone past ' + kmax);
  need(kmax <= 243, 'the quadratic bound gives k <= ' + kmax + ', not k <= 243');
  /* (d) for n/5 <= k <= 243: Y >= n^2 bound > n^2/(4C) > (243 + 4 + split)/4 >= 1 + (k + split)/4 */
  need(4 * N * N > 4 * C * (243 + 4 + split), 'n^2/(4C) does not exceed (243 + 4 + split)/4');
  need(Q.cmp(Q.mul(qi(N * N), minSlab), qi(243 + 4 + split, 4)) > 0, 'the least slab bound times n^2 does not exceed (243+6)/4');
  const direct = Q.cmp(Q.mul(qi(N * N), minSlab), qi(HALF + 4 + split, 4)) > 0;
  ctx.kCap = Math.ceil(N / 5) - 1;
  need(ctx.kCap === 109, 'k cap is not 109');
  return 'inner identity exact (linear residual zero, every multiplier >= 0); P - w w^T/' + C + ' positive definite (shift ' + pd.shift + ', least exact margin ' + pd.margin.toExponential(3) + '); five certificates VERIFIED by the October verifier, cover complete; least slab bound ' + Q.toDouble(minSlab).toExponential(6) + ' > 1/' + 4 * C + '; 4k^2 - ' + C + 'k - ' + C * (4 + split) + ' <= 0 gives k <= ' + kmax + ' (the text says 243); n^2/' + 4 * C + ' > ' + (243 + 4 + split) + '/4; hence k <= 109' + (direct ? ' (the slab bound alone already exceeds (274+6)/4, so k <= 109 does not depend on the constant ' + C + ')' : '');
}

/* ---------------------------------------------------------------- item 7 */
function chargeWeights(ctx) {
  const b = ctx.b, grid = ctx.innerGrid;
  const win = new Uint8Array(N + 3);
  for (const bd of BOUNDS) for (let p = bd - 1; p <= bd + 2; p++) win[p] = 1;
  const mult = new Uint8Array(N + 1);
  let probesChosen = 0, pairChosen = 0, invalid = 0, splitPairs = 0;
  for (let j = 1; j <= HALF; j++) {
    const p1 = 2 * j - 1, p2 = 2 * j, q1 = j, q2 = HALF + j;
    const probesAgree = b[q1] === b[q2];
    const split = b[p1] !== b[p2];
    if (split) splitPairs++;
    const touches = win[p1] === 1 || win[p2] === 1;
    if (probesAgree && (touches || split)) {
      /* summand j nonzero needs s_{q1} != s_{q2}; the baseline signs agree, so one of the two is flipped */
      mult[q1]++; mult[q2]++; probesChosen++;
    } else {
      /* summand j nonzero needs s_{p1} != s_{p2}; sound only when the baseline signs agree */
      if (split) invalid++;
      mult[p1]++; mult[p2]++; pairChosen++;
    }
  }
  const g = grid.cells.map(c => { let m = 0; for (let p = c.lo; p <= c.hi; p++) m = Math.max(m, mult[p]); return m; });
  return { g, mult, probesChosen, pairChosen, invalid, splitPairs, win };
}

function item7(ctx) {
  need(ctx.innerGrid, 'needs the inner grid of item 6');
  const b = ctx.b, grid = ctx.innerGrid;
  const cw = chargeWeights(ctx);
  need(cw.invalid === 0, cw.invalid + ' summand(s) are charged to a site pair whose baseline signs differ: the rule is unsound there');
  for (let p = 1; p <= N; p++) need(cw.mult[p] <= 2, 'a site is charged more than twice');
  let g = cw.g.slice();
  const cellOf = new Int16Array(N + 1);
  grid.cells.forEach((c, i) => { for (let p = c.lo; p <= c.hi; p++) cellOf[p] = i; });
  const isWindowCell = grid.cells.map(c => BOUNDS.some(bd => c.hi === bd || c.lo === bd + 1));
  if (ctx.plant.gZeroExterior) g = g.map((x, i) => (isWindowCell[i] ? x : 0));
  ctx.g = g; ctx.cellOf = cellOf; ctx.isWindowCell = isWindowCell;
  /* soundness by the argument: the weight of every cell covers the charge of each of its sites */
  let covered = true, firstBad = -1;
  grid.cells.forEach((c, i) => { for (let p = c.lo; p <= c.hi; p++) if (g[i] < cw.mult[p]) { covered = false; if (firstBad < 0) firstBad = i; } });
  /* numeric test: -R(s) <= sum_i g_i x_i, that is  -R4(s) <= 4 sum_p g_cell(p) delta_p */
  const viol = delta => { const s = flipped(b, delta); let gs = 0; for (let p = 1; p <= N; p++) if (delta[p]) gs += g[cellOf[p]]; return -R4(s) - 4 * gs; };
  let tests = 0, worst = -Infinity, witness = null, witnessValue = 0;
  const see = d => { const v = viol(d); tests++; if (v > worst) worst = v; if (v > 0 && witness === null) { witness = Array.from(d).map((x, p) => (x ? p : 0)).filter(Boolean); witnessValue = v; } };
  see(new Uint8Array(N + 1));
  for (let p = 1; p <= N; p++) { const d = new Uint8Array(N + 1); d[p] = 1; see(d); }
  for (let p = 1; p <= N; p++) for (let q = p + 1; q <= N; q++) { const d = new Uint8Array(N + 1); d[p] = 1; d[q] = 1; see(d); }
  const rng = makeRng(505);
  for (const dens of [0.005, 0.02, 0.05, 0.1, 0.2, 0.35, 0.5]) for (let rep = 0; rep < 300; rep++) see(randomDelta(rng, dens));
  /* a local search that tries to break the inequality */
  for (let start = 0; start < 40; start++) {
    const d = randomDelta(rng, [0, 0.01, 0.05, 0.2][start % 4]);
    let cur = viol(d);
    for (let pass = 0; pass < 6; pass++) {
      let moved = false;
      for (let p = 1; p <= N; p++) { d[p] ^= 1; const v = viol(d); if (v > cur) { cur = v; moved = true; } else d[p] ^= 1; }
      if (!moved) break;
    }
    see(d);
  }
  ctx.gNumeric = { tests, worst, witness };
  const hist = [0, 0, 0];
  g.forEach(x => hist[x]++);
  const text = 'by the rule: ' + cw.probesChosen + ' summands charged to their probe sites, ' + cw.pairChosen + ' to their site pair, none unsoundly; cell weights g: ' + hist[0] + ' cells 0, ' + hist[1] + ' cells 1, ' + hist[2] + ' cells 2; numeric: -R <= sum g x on ' + tests + ' flip vectors (all single and double flips, random, local search), largest -R - sum g x = ' + worst / 4;
  const numericText = 'numeric test: largest -R - sum g x found = ' + worst / 4 + (witness ? '; first counterexample: flipping {' + witness.join(',') + '} gives -R - sum g x = ' + witnessValue / 4 + ' > 0: the inequality is FALSE' : ' (no numeric counterexample found)');
  need(covered, 'the weights do not cover the charges (first at cell ' + firstBad + '); ' + numericText);
  need(worst <= 0, numericText);
  return text;
}

/* ---------------------------------------------------------------- item 8 */
function toCommon(rows) {                            /* a matrix of rationals over one denominator */
  let den = 1n;
  for (const row of rows) for (const x of row) den = lcmB(den, x.d);
  return { den, num: rows.map(row => row.map(x => x.n * (den / x.d))) };
}

function buildReplay(ctx) {
  const inner = ctx.inner, grid = ctx.innerGrid, n = inner.n;
  const w = grid.cells.map(c => c.w), cap = grid.cells.map(c => c.cap), s = grid.cells.map(c => c.s);
  const iw = w.map(x => Q.div(ONE, x));
  const scale2 = (Mx) => Mx.map((row, i) => row.map((x, j) => (Q.sign(x) ? Q.mul(x, Q.mul(iw[i], iw[j])) : ZERO)));
  const Lam = scale2(inner.lam), Z = scale2(inner.Nm), A = scale2(inner.P);
  const H = A.map((row, i) => row.map((x, j) => Q.add(Q.add(x, qi(s[i] * s[j], 4)), i === j ? qi(-1, 8) : ZERO)));
  const pd = decidePD(H);
  const LamC = toCommon(Lam), ZC = toCommon(Z), HC = toCommon(H);
  /* per row, the entries of Lambda in descending order */
  const order = LamC.num.map(row => { const idx = []; row.forEach((x, j) => { if (x > 0n) idx.push(j); }); idx.sort((x, y) => (row[x] > row[y] ? -1 : row[x] < row[y] ? 1 : x - y)); return idx; });
  const bL = LamC.num.map(row => { let t = 0n; row.forEach((x, j) => { t += x * BigInt(cap[j]); }); return Q.R(t, LamC.den); });
  const cTerm = inner.cvec.map((x, i) => Q.mul(qi(N), Q.mul(x, iw[i])));       /* 548 c_i / w_i */
  const nuW = inner.nu.map((x, i) => Q.mul(x, iw[i]));                          /* nu_i / w_i */
  return { n, cap, s, LamC, ZC, HC, order, bL, cTerm, nuW, pd };
}

/* one tangent vector against one box: the necessary inequality, then narrowing.
   Returns { empty: reason } or the narrowed box. Nothing here is taken from the file but v. */
function tangentRound(rp, g, box, vn, vscale) {
  const { n, cap, LamC, ZC, HC, order, bL, cTerm, nuW } = rp;
  const { l, u } = box;
  let sumL = 0, sumU = 0;
  for (let i = 0; i < n; i++) { if (l[i] > u[i]) return { empty: 'an empty interval at cell ' + i }; sumL += l[i]; sumU += u[i]; }
  const K = Math.min(box.K, sumU);
  if (sumL > K) return { empty: 'the lower bounds exceed the mass budget' };
  const lB = l.map(BigInt);
  /* a_i = max of sum_j Lambda_ij x_j on the box with sum x <= K: start at l, fill by descending Lambda_ij */
  const a = new Array(n);
  for (let i = 0; i < n; i++) {
    const row = LamC.num[i];
    let t = 0n, room = K - sumL;
    for (let j = 0; j < n; j++) if (l[j] && row[j] !== 0n) t += row[j] * lB[j];
    for (const j of order[i]) { if (room <= 0) break; const take = Math.min(room, u[j] - l[j]); if (take > 0) { t += row[j] * BigInt(take); room -= take; } }
    a[i] = Q.R(t, LamC.den);
  }
  /* (Z l)_i, (Lambda^T l)_i, l^T Z l */
  const Zl = new Array(n).fill(0n), LTl = new Array(n).fill(0n);
  let lZl = 0n;
  for (let j = 0; j < n; j++) if (l[j]) for (let i = 0; i < n; i++) { Zl[i] += ZC.num[i][j] * lB[j]; LTl[i] += LamC.num[j][i] * lB[j]; }
  for (let i = 0; i < n; i++) if (l[i]) lZl += lB[i] * Zl[i];
  /* (H v)_i and v^T H v, v = vn / vscale */
  const Hv = new Array(n).fill(0n);
  for (const [j, x] of vn) for (let i = 0; i < n; i++) Hv[i] += HC.num[i][j] * x;
  let vHv = 0n;
  for (const [j, x] of vn) vHv += x * Hv[j];
  const vHvQ = Q.R(vHv, HC.den * vscale * vscale);
  let e0 = Q.neg(Q.R(lZl, ZC.den));
  for (let i = 0; i < n; i++) if (l[i]) e0 = Q.add(e0, Q.mul(qi(l[i]), a[i]));
  const rhs = Q.sub(Q.add(ONE, vHvQ), e0);
  const nuFac = Q.sub(qi(N, 5), qi(K));              /* 548/5 - K > 0 since K <= 109 */
  if (Q.sign(nuFac) < 0) throw new Error('budget above 548/5');
  const mins = new Array(n), vals = new Array(n), coefs = new Array(n);
  let total = ZERO;
  for (let i = 0; i < n; i++) {
    let e = Q.sub(bL[i], a[i]);
    e = Q.add(e, Q.add(cTerm[i], Q.mul(nuW[i], nuFac)));
    e = Q.sub(e, qi(g[i], 4));
    e = Q.add(e, Q.R(2n * Zl[i], ZC.den));
    e = Q.sub(e, Q.R(LTl[i], LamC.den));
    const coef = Q.add(e, Q.R(2n * Hv[i], HC.den * vscale));
    coefs[i] = coef;
    const row = [];
    let m = null;
    for (let t = l[i]; t <= u[i]; t++) {
      const q = Q.add(qi(t * t, 8), Q.mul(coef, qi(t)));
      row.push(q);
      if (m === null || Q.cmp(q, m) < 0) m = q;
    }
    vals[i] = row; mins[i] = m; total = Q.add(total, m);
  }
  if (Q.cmp(total, rhs) > 0) return { empty: 'the sum of the minima exceeds the right-hand side', coef: coefs, rhs };
  const slack = Q.sub(rhs, total);
  const nl = l.slice(), nu = u.slice();
  for (let i = 0; i < n; i++) {
    let lo = null, hi = null;
    vals[i].forEach((q, k) => { if (Q.cmp(Q.sub(q, mins[i]), slack) <= 0) { if (lo === null) lo = l[i] + k; hi = l[i] + k; } });
    nl[i] = lo; nu[i] = hi;                          /* the minimiser always survives */
  }
  let su = 0;
  for (let i = 0; i < n; i++) su += nu[i];
  void cap;
  return { l: nl, u: nu, K: Math.min(K, su), coef: coefs, rhs };
}

/* A test of the replay's algebra against colourings, not a proof step. For a flip vector
   delta with k <= 109 flips, cell counts x, any box l <= x <= u, any budget K >= k and any v,
   the chain of section 8 says
       sum_i (x_i^2/8 + coef_i x_i) - rhs + 1  <=  Y + (s.x)^2/4 + R/4 ,
   and on the box l = u = x with v = x and K = k every step but the two model steps is an
   equality, so the left side must EQUAL n^2 L0(y) + (s.x)^2/4 - g.x/4 (kappa = 0). */
function replaySelfTest(ctx, rp, data, vscale) {
  const grid = ctx.innerGrid, gd = ctx.innerGd, n = rp.n, b = ctx.b, g = ctx.g;
  const rng = makeRng(606);
  const pool = [];
  for (const st of data.steps) for (const v of st.vectors) pool.push(v.map(e => [e[0], BigInt(e[1])]));
  const winSites = [];
  for (const bd of BOUNDS) for (let p = bd - 1; p <= bd + 2; p++) winSites.push(p);
  const draw = kind => {
    const d = new Uint8Array(N + 1);
    if (kind === 0) { const dens = [0.004, 0.02, 0.06, 0.15][Math.floor(rng() * 4)]; for (let p = 1; p <= N; p++) d[p] = rng() < dens ? 1 : 0; }
    else { const m = Math.floor(rng() * 7); for (let t = 0; t < m; t++) d[winSites[Math.floor(rng() * winSites.length)]] = 1; if (rng() < 0.5) d[1 + Math.floor(rng() * N)] = 1; }
    let k = 0; for (let p = 1; p <= N; p++) k += d[p];
    while (k > ctx.kCap) { const p = 1 + Math.floor(rng() * N); if (d[p]) { d[p] = 0; k--; } }
    return d;
  };
  const cells = grid.cells;
  const xOf = d => cells.map(c => { let t = 0; for (let p = c.lo; p <= c.hi; p++) t += d[p]; return t; });
  const left = (r, x) => { let t = Q.sub(ONE, r.rhs); for (let i = 0; i < n; i++) if (x[i]) t = Q.add(t, Q.add(qi(x[i] * x[i], 8), Q.mul(r.coef[i], qi(x[i])))); return t; };
  let exact = 0, sound = 0, minGap = null;
  for (let rep = 0; rep < 30; rep++) {
    const d = draw(rep % 2), x = xOf(d);
    let k = 0, sx = 0, gx = 0;
    for (let i = 0; i < n; i++) { k += x[i]; sx += rp.s[i] * x[i]; gx += g[i] * x[i]; }
    const vn = [];
    x.forEach((t, i) => { if (t) vn.push([i, BigInt(t) * vscale]); });
    const r = tangentRound(rp, g, { l: x.slice(), u: x.slice(), K: k }, vn, vscale);
    need(r.coef, 'self-test: the exact box was rejected before the inequality');
    const y = x.map((t, i) => qi(t, cells[i].cap));
    let want = Q.mul(qi(N * N), V.evalL(gd, y, 'inner'));
    want = Q.add(want, Q.add(qi(sx * sx, 4), qi(-gx, 4)));
    const have = left(r, x);
    if (Q.sign(ctx.inner.kap) === 0) need(Q.cmp(have, want) === 0, 'self-test: on the exact box the replay\'s left side differs from n^2 L0 + (s.x)^2/4 - g.x/4');
    else need(Q.cmp(have, want) <= 0, 'self-test: on the exact box the replay\'s left side exceeds n^2 L0 + (s.x)^2/4 - g.x/4');
    exact++;
  }
  for (let rep = 0; rep < 400; rep++) {
    const d = draw(rep % 2), x = xOf(d);
    let k = 0, sx = 0;
    for (let i = 0; i < n; i++) { k += x[i]; sx += rp.s[i] * x[i]; }
    const mode = rep % 4;
    const l = x.map(t => (mode === 0 ? 0 : Math.floor(rng() * (t + 1))));
    const u = x.map((t, i) => (mode === 0 ? cells[i].cap : t + Math.floor(rng() * (cells[i].cap - t + 1))));
    const K = mode === 0 ? ctx.kCap : k + Math.floor(rng() * (ctx.kCap - k + 1));
    const vn = pool[Math.floor(rng() * pool.length)];
    const r = tangentRound(rp, g, { l, u, K }, vn, vscale);
    need(r.coef, 'self-test: a box holding a real flip vector was rejected before the inequality');
    const truth = Q.add(qi(ctx.Y16(d), 16), Q.add(qi(sx * sx, 4), qi(R4(flipped(b, d)), 16)));
    const gap = Q.sub(truth, left(r, x));
    need(Q.sign(gap) >= 0, 'self-test: the necessary inequality\'s left side exceeds Y + (s.x)^2/4 + R/4 on a real flip vector (the chain is unsound as implemented, or the weights g are)');
    if (minGap === null || Q.cmp(gap, minGap) < 0) minGap = gap;
    sound++;
  }
  return 'self-test of the replay algebra: exact on ' + exact + ' point boxes, never above Y + (s.x)^2/4 + R/4 on ' + sound + ' real flip vectors in random boxes (least gap ' + Q.toDouble(minGap).toFixed(4) + ')';
}

function loadTangents(plant) {
  const data = JSON.parse(fs.readFileSync(TANGENT_FILE, 'utf8'));
  need(Number.isInteger(data.scale) && data.scale > 0 && Array.isArray(data.steps), 'unit-tangents.json: unexpected shape');
  if (plant.tangentPerturb) {
    const { step, vec, entry } = plant.tangentPerturb;
    data.steps[step].vectors[vec][entry][1] *= 2;
  }
  if (plant.tangentScale) {
    const { step, vec, factor } = plant.tangentScale;
    data.steps[step].vectors[vec].forEach(e => { e[1] *= factor; });
  }
  if (plant.dropStep !== undefined) data.steps.splice(plant.dropStep, 1);
  return data;
}

/* the operations of the file against the box, exactly as section 8 words them:
     narrow   each vector in turn: the necessary inequality on the current box, then every
              value of every cell that cannot meet it is removed (all cells judged against
              the same box), and the budget becomes min(K, sum u);
     exclude  the current box with l_cell raised to `lower`; its vectors in turn, each
              narrowing that restricted box, until it is empty; then u_cell = lower - 1.
              If it is not empty after the last vector the exclusion is NOT established and
              the box is left as it was. */
function runReplay(ctx, rp, data) {
  const n = rp.n, vscale = BigInt(data.scale), g = ctx.g;
  const readV = v => {
    need(Array.isArray(v), 'a tangent vector is not a list');
    const seen = new Set();
    return v.map(e => {
      need(Array.isArray(e) && e.length === 2 && Number.isInteger(e[0]) && e[0] >= 0 && e[0] < n && Number.isSafeInteger(e[1]), 'bad tangent entry');
      need(!seen.has(e[0]), 'a tangent index is repeated'); seen.add(e[0]);
      return [e[0], BigInt(e[1])];
    });
  };
  let box = { l: new Array(n).fill(0), u: rp.cap.slice(), K: ctx.kCap };
  let nvec = 0, nops = 0;
  const failed = [], notes = [];
  data.steps.forEach((st, si) => {
    nops++;
    need(Array.isArray(st.vectors), 'operation ' + si + ': no vectors');
    if (st.action === 'narrow') {
      for (const v of st.vectors) {
        nvec++;
        const r = tangentRound(rp, g, box, readV(v), vscale);
        if (r.empty) fail('operation ' + si + ' (narrow) empties the whole box (' + r.empty + '), but the baseline itself is a competitor: the replay is inconsistent');
        box = { l: r.l, u: r.u, K: r.K };
      }
    } else if (st.action === 'exclude') {
      const cell = st.cell, lower = st.lower;
      need(Number.isInteger(cell) && cell >= 0 && cell < n && Number.isInteger(lower) && lower >= 1, 'operation ' + si + ': bad cell or lower');
      nvec += st.vectors.length;
      if (lower > box.u[cell]) { notes.push('operation ' + si + ' is vacuous (cell ' + cell + ' already below ' + lower + ')'); return; }
      if (lower <= box.l[cell]) fail('operation ' + si + ' would exclude the whole box');
      let sub = { l: box.l.slice(), u: box.u.slice(), K: box.K };
      sub.l[cell] = lower;
      let empty = null, used = 0;
      for (const v of st.vectors) {
        used++;
        const r = tangentRound(rp, g, sub, readV(v), vscale);
        if (r.empty) { empty = r.empty; break; }
        sub = { l: r.l, u: r.u, K: r.K };
      }
      if (!empty) {                                  /* a last look: the narrowed box may already be empty */
        let sl = 0;
        for (let i = 0; i < n; i++) sl += sub.l[i];
        if (sl > sub.K) empty = 'the lower bounds exceed the mass budget';
      }
      if (!empty) { failed.push({ op: si, cell, lower }); return; }
      if (used < st.vectors.length) notes.push('operation ' + si + ': empty after ' + used + ' of ' + st.vectors.length + ' vectors');
      box.u[cell] = lower - 1;
      let su = 0;
      for (let i = 0; i < n; i++) su += box.u[i];
      box.K = Math.min(box.K, su);
    } else fail('operation ' + si + ': unknown action ' + JSON.stringify(st.action));
  });
  /* the conclusion the text states */
  const left = [];
  ctx.innerGrid.cells.forEach((c, i) => { if (!ctx.isWindowCell[i] && box.u[i] > 0) left.push({ cell: i, sites: [c.lo, c.hi], u: box.u[i], cap: c.cap }); });
  const want = left.length === 2 && left[0].sites[0] === 31 && left[0].sites[1] === 32 && left[0].u === 1 && left[1].sites[0] === 517 && left[1].sites[1] === 518 && left[1].u === 1;
  return { box, failed, notes, nops, nvec, left, want };
}

function item8(ctx) {
  need(ctx.inner && ctx.innerGrid, 'needs the inner identity of item 6');
  need(ctx.g, 'needs the charging weights of item 7');
  need(ctx.kCap === 109, 'needs k <= 109 from item 6');
  const rp = ctx.rp || buildReplay(ctx);
  ctx.rp = rp;
  need(rp.pd.verdict === 'PD', 'H = A + s s^T/4 - I/8 is not proved positive definite: ' + rp.pd.verdict + ' (' + rp.pd.why + ')');
  const data = loadTangents(ctx.plant);
  const selfText = replaySelfTest(ctx, rp, data, BigInt(data.scale));
  const rr = runReplay(ctx, rp, data);
  const { box, failed, notes, nops, nvec, left, want } = rr;
  ctx.box = box; ctx.replay = rr; ctx.exteriorLeft = left;
  /* a check on the replay's end state, not a proof step: every colouring with M(s) <= M(B)
     found by flipping at most three of the 48 sites of F must lie in the final box */
  let compFound = 0, compOutside = 0;
  {
    const Fs = [];
    for (const bd of BOUNDS) for (let p = bd - 1; p <= bd + 2; p++) Fs.push(p);
    Fs.push(31, 32, 517, 518);
    const b = ctx.b, d = new Uint8Array(N + 1);
    const test = () => {
      const s2 = flipped(b, d);
      const [S0, S1] = paritySums(s2);
      const diff16 = 2 * (S0 * S0 + S1 * S1 - 8) + ctx.Y16(d) + R4(s2);
      if (diff16 > 0) return;
      compFound++;
      const x = ctx.innerGrid.cells.map(c => { let t = 0; for (let p = c.lo; p <= c.hi; p++) t += d[p]; return t; });
      let k = 0, inside = true;
      x.forEach((t, i) => { k += t; if (t < box.l[i] || t > box.u[i]) inside = false; });
      if (!inside || k > box.K) compOutside++;
    };
    test();
    for (let i = 0; i < Fs.length; i++) { d[Fs[i]] = 1; test();
      for (let j = i + 1; j < Fs.length; j++) { d[Fs[j]] = 1; test();
        for (let k = j + 1; k < Fs.length; k++) { d[Fs[k]] = 1; test(); d[Fs[k]] = 0; }
        d[Fs[j]] = 0; }
      d[Fs[i]] = 0; }
  }
  ctx.compFound = compFound;
  const leftText = left.length ? left.map(x => 'cell ' + x.cell + ' (sites ' + x.sites[0] + '..' + x.sites[1] + ') <= ' + x.u).join(', ') : 'none';
  const text = 'H positive definite (shift ' + rp.pd.shift + ', least exact margin ' + rp.pd.margin.toExponential(3) + '); ' + nops + ' operations, ' + nvec + ' tangent vectors replayed' + (failed.length ? '; ' + failed.length + ' exclusion(s) NOT established: ' + failed.map(f => 'op ' + f.op + ' (cell ' + f.cell + ' >= ' + f.lower + ')').join(', ') : '') + '; exterior cells left with a possible flip: ' + leftText + '; final mass budget ' + box.K + (notes.length ? '; notes: ' + notes.join('; ') : '') + '; ' + selfText + '; ' + compFound + ' colourings with M <= M(B) found among flips of at most three sites of F, ' + compOutside + ' of them outside the final box';
  need(compOutside === 0, 'the final box excludes a real competitor: the replay is unsound; ' + text);
  need(failed.length === 0, text);
  need(want, 'the replay does not end as the text says; ' + text);
  need(nops === 120 && nvec === 201, 'the replay ends as the text says, but the file holds ' + nops + ' operations and ' + nvec + ' vectors, not 120 and 201; ' + text);
  return text;
}

/* the replay alone, on a finished run's context, with a planted change to the file */
function replayOnly(baseCtx, plant) {
  try {
    const rr = runReplay(baseCtx, baseCtx.rp, loadTangents(plant));
    return { reached: rr.failed.length === 0 && rr.want, failed: rr.failed, left: rr.left };
  } catch (e) { if (!(e instanceof Fail)) throw e; return { reached: false, failed: [], left: [], error: e.message }; }
}

/* ---------------------------------------------------------------- item 9 */
function item9(ctx) {
  for (let k = 1; k <= 8; k++) need(ctx.status[k] === 'PASS', 'item ' + k + ' is not established');
  const grid = ctx.innerGrid, box = ctx.box;
  /* the 22 window cells: the cell ending at each boundary and the cell starting after it */
  const windowCells = [];
  for (const bd of BOUNDS) {
    const L = grid.cells.findIndex(c => c.hi === bd), Rr = grid.cells.findIndex(c => c.lo === bd + 1);
    need(L >= 0 && Rr === L + 1, 'no cell pair at the boundary ' + bd);
    need(grid.cells[L].lo === bd - 1 && grid.cells[Rr].hi === bd + 2, 'the window cells at ' + bd + ' are not {b-1,b} and {b+1,b+2}');
    windowCells.push(L, Rr);
  }
  need(new Set(windowCells).size === 22, 'the window cells are not 22 distinct cells');
  need(grid.cells.every((c, i) => ctx.isWindowCell[i] === windowCells.includes(i)), 'window cell marking inconsistent');
  /* the sites where a competitor may still differ from B */
  const may = new Set();
  grid.cells.forEach((c, i) => { if (box.u[i] > 0) { if (!ctx.isWindowCell[i]) need(box.u[i] <= 1, 'an exterior cell with more than one flip left'); for (let p = c.lo; p <= c.hi; p++) may.add(p); } });
  const F = new Set();
  for (const bd of BOUNDS) for (let p = bd - 1; p <= bd + 2; p++) F.add(p);
  for (const p of [31, 32, 517, 518]) F.add(p);
  need(F.size === 48, 'F does not have 48 sites');
  for (const p of may) need(F.has(p), 'site ' + p + ' may differ from B and is outside F');
  ctx.windowCells = windowCells;
  /* an attempt to falsify E directly, not a proof step: every colouring within two flips of
     B (any sites), and every one with two flips in F and a third anywhere, is counted by the
     identity of items 1-3; one with M <= M(B) and a flip outside F would refute E */
  let tried = 0, low = 0;
  {
    const b = ctx.b, d = new Uint8Array(N + 1), Fl = Array.from(F).sort((x, y) => x - y);
    const test = sites => {
      const s2 = flipped(b, d);
      const [S0, S1] = paritySums(s2);
      tried++;
      if (2 * (S0 * S0 + S1 * S1 - 8) + ctx.Y16(d) + R4(s2) > 0) return;
      low++;
      need(sites.every(p => F.has(p)), 'E IS FALSE: flipping {' + sites.join(',') + '} gives M <= M(B) with a flip outside F');
    };
    test([]);
    for (let p = 1; p <= N; p++) { d[p] = 1; test([p]); for (let q = p + 1; q <= N; q++) { d[q] = 1; test([p, q]); d[q] = 0; } d[p] = 0; }
    for (let i = 0; i < Fl.length; i++) for (let j = i + 1; j < Fl.length; j++) {
      d[Fl[i]] = 1; d[Fl[j]] = 1;
      for (let q = 1; q <= N; q++) if (!d[q]) { d[q] = 1; test([Fl[i], Fl[j], q]); d[q] = 0; }
      d[Fl[i]] = 0; d[Fl[j]] = 0;
    }
  }
  ctx.falsify = { tried, low };
  return 'falsification attempt: ' + tried + ' colourings near B counted exactly, ' + low + ' with M <= M(B) (counted with repetition), none with a flip outside F; window cells (inner grid, 0-based): ' + windowCells.join(',') + '; their sites are exactly b-1..b+2 for the eleven boundaries (44 sites); the sites where a competitor may differ from B number ' + may.size + ', all inside F (48 sites)';
}

/* ---------------------------------------------------------------- the run */
const ITEMS = [
  [1, 'the identity 16M = 4T - 6n + 2(S0^2+S1^2) + K + 4R, and 0 <= G <= 4', item1],
  [2, 'M(B) = 15,756, the parity sums, R(B) = 0', item2],
  [3, 'the finite quadratic Y and the site fields h_p', item3],
  [4, 'F1: the one-body inequality on every cell of every grid', item4],
  [5, 'F2: finite inside sums = n^2 x model areas; Y dominates the model polynomials', item5],
  [6, 'inner identity, P - ww^T/948 positive definite, slab bounds, k <= 243, k < 548/5', item6],
  [7, 'the charging weights: -R <= sum g_i x_i', item7],
  [8, 'the 120 box operations with 201 tangent vectors', item8],
  [9, 'statement E', item9],
];

const CACHE = {};
function runJudge(plant, opts) {
  plant = plant || {};
  opts = opts || {};
  const say = opts.quiet ? () => {} : s => console.log(s);
  const ctx = { plant, b: baselineSigns(plant), status: {}, detail: {}, cache: CACHE };
  const t0 = Date.now();
  let first = null;
  if (!opts.quiet) {
    say('judge548: statement E at n = 548. Inputs, with sha256:');
    for (const f of [TANGENT_FILE].concat(V.defaultFiles(), [path.join(CM, 'instruments', 'delta3', 'verify.js'), path.join(CM, 'instruments', 'delta3', 'model.js'), path.join(CM, 'instruments', 'delta3', 'psd.js'), path.join(CM, 'instruments', 'interval', 'rational.js')]))
      say('  ' + V.sha256(fs.readFileSync(f)) + '  ' + f);
    say('');
  }
  for (const [k, title, fn] of ITEMS) {
    const t1 = Date.now();
    let ok = false, text;
    try { text = fn(ctx); ok = true; } catch (e) { if (!(e instanceof Fail) && !(e instanceof V.Refusal)) text = 'internal error: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e); else text = e.message; }
    ctx.status[k] = ok ? 'PASS' : 'FAIL'; ctx.detail[k] = text;
    if (!ok && first === null) first = k;
    say((ok ? 'PASS' : 'FAIL') + '  item ' + k + '  ' + title + '\n      ' + text + '   [' + ((Date.now() - t1) / 1000).toFixed(1) + ' s]');
  }
  const verdict = first === null ? 'CERTIFIED' : 'REFUSED';
  say('');
  say('E: ' + verdict + (first === null ? '  (every item established)' : '  (first item not established: ' + first + ')') + '   ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  return { verdict, first, status: ctx.status, detail: ctx.detail, ctx, seconds: (Date.now() - t0) / 1000 };
}

/* one item again on a finished run's context, with a planted change (used by controls.js) */
function rerunItem(baseCtx, k, plant) {
  const ctx = Object.assign({}, baseCtx, { plant, status: Object.assign({}, baseCtx.status) });
  const fn = ITEMS.find(x => x[0] === k)[2];
  try { return { ok: true, text: fn(ctx), ctx }; } catch (e) { if (!(e instanceof Fail)) throw e; return { ok: false, text: e.message, ctx }; }
}

module.exports = { runJudge, rerunItem, replayOnly, N, BOUNDS, TANGENT_FILE };

if (require.main === module) {
  const res = runJudge({});
  process.exit(res.verdict === 'CERTIFIED' ? 0 : 1);
}
