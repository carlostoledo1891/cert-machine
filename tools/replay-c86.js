#!/usr/bin/env node
/* replay-c86.js — the registry's C_86 certificate (the Schur–Siegel–Smyth trace constant, #227, R. Pinho) decided
   twice, by two implementations that share no code with each other or with the claimant's checker (kept as text,
   never run): this file (JavaScript: eqcert's BigInt rationals and outward-rounded intervals with its series
   logarithm) and instruments/optq/c86.py (Python: Fraction and its own float series logarithm).

   What the certificate is: a step measure μ = Σ d_i 1_[e_i, e_{i+1}] dx on the cells of width 1/200 in [0, 6] (629
   nonzero cells, support [1/20, 1037/200]) and eleven integer polynomials Q with weights b_Q. What is decided — the six
   finite conditions the claimant states, which are the hypotheses of Smith's sufficiency criterion and the
   arithmetic of the bound:
     E1 d_i >= 0, edges increasing, the support inside [1/20, 1037/200]                                   exact
     E2 each Q primitive, irreducible over Z (no integer root, no monic integer quadratic factor within the Mignotte
        bound — enough for degree <= 5), all roots real (a Sturm count equal to the degree); the Q distinct   exact
     E3 Σ b_Q deg Q < m, the mass                                                                           exact
     E4 ∫ log|Q| dμ > 0 for each Q, as -Σ_k c_k G_Q(e_k) with c_k = d_k - d_{k-1}, G_Q(x) = Σ_roots g(x - r) +
        x ln|lc|, g(u) = u ln|u| - u, roots enclosed to 2^-80 by Sturm bisection; the lower end > 0        enclosure
     E5 f = U_μ - Σ b_Q log|Q| >= 0 on every cell with d_i > 0: adaptive bisection; on a box the two cell-edge terms
        and any -b ln|Q| with Q vanishing on the box are bounded by their exact monotone ranges, the smooth rest by a
        second-order Taylor form at the midpoint; proved when the lower end > 0, refuted when the upper end < 0,
        REFUSED when a box narrower than W_MIN is neither                                                  enclosure
     E6 ∫ x dμ / m equals the certificate's `bound` and is <= the bound the registry prints                 exact
   The step from E1–E6 to C_86 <= bound is the published chain (the minimum principle, Smith's criterion and theorem),
   read and not re-derived; the record says so.

   usage: node tools/replay-c86.js            both implementations, the red controls → certs/c86-replay.json (~minutes)
          node tools/replay-c86.js --check    the battery: the JavaScript decider re-derives every condition and every
                                              red control and compares with the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const I = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const T = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const Q = require(path.join(ROOT, 'instruments', 'interval', 'rational.js'));
const OUT = path.join(ROOT, 'certs', 'c86-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('C86 REPLAY REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));
const DIR = 'corpus/optconst-queue/c86-2026-10-19';
const W_MIN = 1e-9, MAX_DEPTH = 40;

/* ---- the inputs and the registry's words, each against its pin ------------------------------------------------- */
const PINS = J(DIR + '/PINS.json');
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS.files[rel] || sha(buf) !== PINS.files[rel].sha256) die(rel + ' does not match its pin'); return buf; };
const CERT_REL = 'rpinho/cert_n1200_A11.json';
const cert = JSON.parse(pinned(CERT_REL).toString('utf8'));
pinned('rpinho/referee_check.py');                                 // present and pinned; never run
const page86 = pinned('upstream/86a.md').toString('utf8');
const readme = pinned('upstream/README.md').toString('utf8');
const row = page86.split('\n').find((x) => x.startsWith('| $') && x.includes('| [Pin26] |')) || die('no [Pin26] row on the 86a page');
const rowBound = /^\| \$([0-9.]+)\$(\\\*)? \|/.exec(row) || die('no bound in the [Pin26] row');
const readmeRow = readme.split('\n').find((x) => x.startsWith('| [86](')) || die('no row 86 in the README');
const readmeUpper = /\| ([0-9.]+) \(([0-9.]+)\*\) \|\s*$/.exec(readmeRow) || die('the README row 86 no longer carries an asterisked upper bound');
const PRINTED = rowBound[1];
if (readmeUpper[2] !== PRINTED) die('the page and the README print different asterisked bounds');

/* ---- exact rationals ------------------------------------------------------------------------------------------- */
const qs = (s) => { const m = /^(-?\d+)(?:\/(\d+))?$/.exec(String(s)) || die('not a rational: ' + s); return Q.R(BigInt(m[1]), m[2] ? BigInt(m[2]) : 1n); };
const qInt = (n) => Q.R(BigInt(n), 1n);
const qlt = (a, b) => Q.cmp(a, b) < 0, qle = (a, b) => Q.cmp(a, b) <= 0, qeq = (a, b) => Q.cmp(a, b) === 0;
const qNum = (a) => { /* a double near a, then widened to contain it */
  const neg = a.n < 0n; let n = neg ? -a.n : a.n; const d = a.d;
  const bits = n.toString(2).length - d.toString(2).length; const k = BigInt(Math.max(0, 70 - bits));
  const f = Number((n << k) / d) / Math.pow(2, Number(k)); return neg ? -f : f;
};
const qToIv = (a) => { let lo = qNum(a), hi = lo; while (Q.cmp(Q.fromDouble(lo), a) > 0) lo = I.nextDown(lo); while (Q.cmp(Q.fromDouble(hi), a) < 0) hi = I.nextUp(hi); return I.iv(lo, hi); };
const decimal = (a, k) => { const neg = a.n < 0n; let n = neg ? -a.n : a.n; const ip = n / a.d; let rem = n % a.d; let s = ''; for (let i = 0; i < k; i++) { rem *= 10n; s += (rem / a.d).toString(); rem %= a.d; } return (neg ? '-' : '') + ip + '.' + s + '…'; };

/* ---- polynomials, coefficients constant term first ------------------------------------------------------------- */
const pdeg = (p) => p.length - 1;
const peval = (p, x) => { let r = Q.ZERO; for (let i = p.length - 1; i >= 0; i--) r = Q.add(Q.mul(r, x), p[i]); return r; };
const pderiv = (p) => (p.length > 1 ? p.slice(1).map((c, i) => Q.mul(qInt(i + 1), c)) : [Q.ZERO]);
const ptrim = (p) => { p = p.slice(); while (p.length > 1 && Q.isZero(p[p.length - 1])) p.pop(); return p; };
function pdivmod(a, b) {
  a = a.slice(); b = ptrim(b); const q = new Array(Math.max(1, a.length - b.length + 1)).fill(Q.ZERO); let r = ptrim(a);
  while (r.length >= b.length && !r.every(Q.isZero)) {
    const c = Q.div(r[r.length - 1], b[b.length - 1]); const k = r.length - b.length; q[k] = c;
    for (let i = 0; i < b.length; i++) r[k + i] = Q.sub(r[k + i], Q.mul(c, b[i]));
    r.pop(); r = ptrim(r.length ? r : [Q.ZERO]); if (r.length === 1 && Q.isZero(r[0])) break;
  }
  return [ptrim(q), r.length ? r : [Q.ZERO]];
}
function sturm(p) { const chain = [p, pderiv(p)]; while (pdeg(chain[chain.length - 1]) > 0) { const [, r] = pdivmod(chain[chain.length - 2], chain[chain.length - 1]); if (r.every(Q.isZero)) break; chain.push(r.map(Q.neg)); } return chain; }
function changes(chain, x) { let s = 0, prev = 0; for (const q of chain) { const sg = Q.sign(peval(q, x)); if (!sg) continue; if (prev && sg !== prev) s++; prev = sg; } return s; }
function realRoots(p, width) {
  const chain = sturm(p); const lc = Q.abs(p[p.length - 1]);
  let B = Q.ONE; for (let i = 0; i < p.length - 1; i++) { const v = Q.add(Q.ONE, Q.div(Q.abs(p[i]), lc)); if (qlt(B, v)) B = v; }
  const total = changes(chain, Q.neg(B)) - changes(chain, B);
  const boxes = [[Q.neg(B), B, total]], iso = [];
  while (boxes.length) {
    const [a, b, n] = boxes.pop(); if (n === 0) continue; if (n === 1) { iso.push([a, b]); continue; }
    const m = Q.div(Q.add(a, b), qInt(2));
    if (n < 0) die('negative Sturm count');
    if (Q.isZero(peval(p, m))) { iso.push([m, m]); const nl = changes(chain, a) - changes(chain, m); /* V(a) - V(m) counts the roots in (a, m], m included */ boxes.push([a, m, nl - 1], [m, b, n - nl]); continue; }
    const nl = changes(chain, a) - changes(chain, m); boxes.push([a, m, nl], [m, b, n - nl]);
  }
  const out = [];
  for (let [a, b] of iso) {
    if (qeq(a, b)) { out.push([a, b]); continue; }
    let fa = Q.sign(peval(p, a));
    while (qlt(width, Q.sub(b, a))) { const m = Q.div(Q.add(a, b), qInt(2)); const fm = Q.sign(peval(p, m)); if (fm === 0) { a = b = m; break; } if (fm === fa) { a = m; fa = fm; } else b = m; }
    out.push([a, b]);
  }
  out.sort((u, v) => Q.cmp(u[0], v[0]));
  return { count: total, roots: out };
}
const gcdInt = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; };
const content = (q) => q.reduce((g, c) => gcdInt(g, c), 0n);
function integerRoots(q) { const a0 = q[0] < 0n ? -q[0] : q[0]; if (a0 === 0n) return [0n]; const out = new Set(); for (let d = 1n; d * d <= a0; d++) if (a0 % d === 0n) for (const r of [d, -d, a0 / d, -(a0 / d)]) if (Q.isZero(peval(q.map(qInt), qInt(r)))) out.add(r); return [...out]; }
function quadraticFactor(q) {
  const n2 = q.reduce((s, c) => s + c * c, 0n); let norm = 0n; while ((norm + 1n) * (norm + 1n) <= n2) norm++; norm += 1n;        // ceil of the 2-norm
  const bound = 2n * norm;                                                                                                          // Mignotte: C(2,1) ||q||_2
  const a0 = q[0] < 0n ? -q[0] : q[0]; const divs = []; for (let d = 1n; d <= a0; d++) if (a0 % d === 0n) divs.push(d, -d);
  for (const b of divs) for (let a = -bound; a <= bound; a++) { const [, r] = pdivmod(q.map(qInt), [qInt(b), qInt(a), Q.ONE]); if (r.every(Q.isZero)) return [b, a, 1n]; }
  return null;
}
function irreducible(q) { const deg = q.length - 1; if (deg <= 1) return true; if (integerRoots(q).length) return false; if (deg <= 3) return true; if (deg > 5) die('irreducibility search written for degree <= 5'); return quadraticFactor(q) === null; }

/* ---- sound intervals: g, ln, polynomials on boxes --------------------------------------------------------------- */
const lnIv = (a) => { if (!(a[0] > 0)) die('ln of an interval touching zero'); return I.iv(T.logPoint(a[0])[0], T.logPoint(a[1])[1]); };
const gPt = (u) => { if (u === 0) return I.iv(0, 0); if (Math.abs(u) < 1e-300) return I.iv(-1e-297, 1e-297); /* |g(u)| <= |u| (|ln|u|| + 1) < 1e-297 there; the series log refuses subnormals */ const l = T.logPoint(Math.abs(u)); return I.sub(I.mul(l, I.iv(u, u)), I.iv(u, u)); };
function gIv(a) { const pts = [a[0], a[1]]; for (const c of [-1, 1]) if (a[0] < c && c < a[1]) pts.push(c); let lo = Infinity, hi = -Infinity; for (const p of pts) { const v = gPt(p); if (v[0] < lo) lo = v[0]; if (v[1] > hi) hi = v[1]; } return I.iv(lo, hi); };
const ipoly = (q, X) => { let P = I.iv(0, 0); for (let i = q.length - 1; i >= 0; i--) P = I.add(I.mul(P, X), I.iv(Number(q[i]), Number(q[i]))); return P; };
const absIv = (u) => I.iv(Math.min(Math.abs(u[0]), Math.abs(u[1])), Math.max(Math.abs(u[0]), Math.abs(u[1])));
const idivSafe = (a, b) => { if (b[0] <= 0 && 0 <= b[1]) die('interval division by an interval containing zero'); return I.div(a, b); };

/* ---- the certificate ------------------------------------------------------------------------------------------- */
const C = { edges: cert.edges.map(qs), densities: cert.densities.map(qs), A: cert.A.map((q) => q.map((c) => BigInt(c))), b: cert.b.map(qs), bound: qs(cert.bound) };
const copyCert = (c) => ({ edges: c.edges.slice(), densities: c.densities.slice(), A: c.A.map((q) => q.slice()), b: c.b.slice(), bound: c.bound });

function checkE1(c) {
  const okD = c.densities.every((x) => Q.sign(x) >= 0), okE = c.edges.length === c.densities.length + 1 && c.edges.every((e, i) => i === 0 || qlt(c.edges[i - 1], e));
  const nz = c.densities.map((x, i) => (Q.sign(x) > 0 ? i : -1)).filter((i) => i >= 0);
  const smin = nz.length ? c.edges[nz[0]] : null, smax = nz.length ? c.edges[nz[nz.length - 1] + 1] : null;
  const okS = nz.length > 0 && qle(Q.R(1n, 20n), smin) && qle(smax, Q.R(1037n, 200n));
  return { ok: okD && okE && okS, cells: c.densities.length, nonzeroCells: nz.length, support: smin ? [Q.toString(smin), Q.toString(smax)] : null };
}
function checkE2(c) {
  const rows = []; let ok = true; const seen = [];
  for (const q of c.A) {
    const deg = q.length - 1, prim = content(q) === 1n, monic = q[q.length - 1] === 1n || q[q.length - 1] === -1n;
    const irr = monic ? irreducible(q) : false; const rr = realRoots(q.map(qInt), Q.R(1n, 1n << 80n));
    const norm = (q[q.length - 1] < 0n ? q.map((x) => -x) : q).join(','); const distinct = !seen.includes(norm); seen.push(norm);
    rows.push({ Q: q.map(String), deg, primitive: prim, monicUpToSign: monic, irreducible: irr, realRoots: rr.count, allReal: rr.count === deg, distinct, roots: rr.roots.map(([a, b]) => [Q.toString(a), Q.toString(b)]), rootsQ: rr.roots });
    ok = ok && prim && monic && irr && rr.count === deg && distinct;
  }
  return { ok, polynomials: rows };
}
const massMoment = (c) => { let m = Q.ZERO, t = Q.ZERO; for (let i = 0; i < c.densities.length; i++) { const w = Q.sub(c.edges[i + 1], c.edges[i]); m = Q.add(m, Q.mul(c.densities[i], w)); t = Q.add(t, Q.mul(c.densities[i], Q.div(Q.sub(Q.mul(c.edges[i + 1], c.edges[i + 1]), Q.mul(c.edges[i], c.edges[i])), qInt(2)))); } return [m, t]; };
function checkE3(c) { const [m] = massMoment(c); let s = Q.ZERO; c.b.forEach((bq, i) => { s = Q.add(s, Q.mul(bq, qInt(c.A[i].length - 1))); }); return { ok: qlt(s, m) && c.b.every((x) => Q.sign(x) >= 0), mass: Q.toString(m), sumBDeg: Q.toString(s), ratio: qNum(Q.div(s, m)) }; }
function jumps(c) { const out = []; for (let k = 0; k < c.edges.length; k++) { const prev = k > 0 ? c.densities[k - 1] : Q.ZERO, cur = k < c.densities.length ? c.densities[k] : Q.ZERO; const ck = Q.sub(cur, prev); if (!Q.isZero(ck)) out.push({ k, e: c.edges[k], eIv: qToIv(c.edges[k]), cIv: qToIv(ck) }); } return out; }
function checkE4(c, e2) {
  const js = jumps(c); const rows = []; let ok = true;
  c.A.forEach((q, i) => {
    const roots = e2.polynomials[i].rootsQ; const lc = q[q.length - 1] < 0n ? -q[q.length - 1] : q[q.length - 1];
    let total = I.iv(0, 0);
    for (const j of js) {
      let G = I.iv(0, 0);
      for (const [a, b] of roots) { const u = qToIv(Q.sub(j.e, b)), v = qToIv(Q.sub(j.e, a)); G = I.add(G, gIv(I.iv(u[0], v[1]))); }
      if (lc !== 1n) G = I.add(G, I.mul(j.eIv, T.logPoint(Number(lc))));
      total = I.sub(total, I.mul(j.cIv, G));
    }
    rows.push({ Q: q.map(String), integral: [total[0], total[1]], positive: total[0] > 0 }); ok = ok && total[0] > 0;
  });
  return { ok, rows };
}
function fEnclosure(X, js, A, A1, A2, bF) {
  const x0 = X[0], x1 = X[1], xm = (x0 + x1) / 2, hw = Math.max(xm - x0, x1 - xm);
  let S = I.iv(0, 0), Tm = I.iv(0, 0), T1 = I.iv(0, 0), T2 = I.iv(0, 0); let sInf = false;
  for (const j of js) {
    if (x0 <= j.eIv[1] && j.eIv[0] <= x1) { S = I.add(S, I.mul(j.cIv, gIv(I.sub(X, j.eIv)))); continue; }
    const u = I.sub(I.iv(xm, xm), j.eIv); const l = lnIv(absIv(u)); const gu = I.sub(I.mul(u, l), u);
    Tm = I.add(Tm, I.mul(j.cIv, gu)); T1 = I.add(T1, I.mul(j.cIv, l)); T2 = I.add(T2, idivSafe(j.cIv, I.sub(X, j.eIv)));
  }
  for (let i = 0; i < A.length; i++) {
    const q = A[i], bq = bF[i]; const QX = ipoly(q, X);
    if (QX[0] <= 0 && 0 <= QX[1]) { const mag = Math.max(Math.abs(QX[0]), Math.abs(QX[1])); const lm = T.logPoint(mag)[1]; S = I.iv(I.nextDown(S[0] - I.nextUp(bq[1] * lm)), S[1]); sInf = true; continue; }
    const Qm = ipoly(q, I.iv(xm, xm)); Tm = I.sub(Tm, I.mul(bq, lnIv(absIv(Qm))));
    const Q1 = ipoly(A1[i], I.iv(xm, xm)); T1 = I.sub(T1, I.mul(bq, idivSafe(Q1, Qm)));
    const Q1X = ipoly(A1[i], X), Q2X = ipoly(A2[i], X); const num = I.sub(I.mul(Q2X, QX), I.mul(Q1X, Q1X)); T2 = I.sub(T2, I.mul(bq, idivSafe(num, I.mul(QX, QX))));
  }
  const m1 = Math.max(Math.abs(T1[0]), Math.abs(T1[1])), m2 = Math.max(Math.abs(T2[0]), Math.abs(T2[1]));
  const slack = I.nextUp(I.nextUp(m1 * hw) + I.nextUp(I.nextUp(m2 * hw) * hw / 2));
  const lo = I.nextDown(I.nextDown(S[0] + Tm[0]) - slack), hi = sInf ? Infinity : I.nextUp(I.nextUp(S[1] + Tm[1]) + slack);
  return [lo, hi];
}
const dInt = (q) => (q.length > 1 ? q.slice(1).map((c, i) => c * BigInt(i + 1)) : [0n]);
function checkE5(c, wmin) {
  /* every cell with d_i > 0, left to right; a box is proved (lower end > 0), a counterexample (upper end < 0: REFUTED, the run stops) or
     undecided below W_MIN (kept; the run goes on so that a counterexample elsewhere still refutes) */
  const js = jumps(c), bF = c.b.map(qToIv), A = c.A, A1 = A.map(dInt), A2 = A1.map(dInt);
  const cells = c.densities.map((x, i) => (Q.sign(x) > 0 ? i : -1)).filter((i) => i >= 0);
  let proved = 0, minLower = Infinity, maxDepth = 0, worst = null; const undecided = [];
  for (const i of cells) {
    const lo = qToIv(c.edges[i]), hi = qToIv(c.edges[i + 1]); const stack = [[lo[0], hi[1], 0]];
    while (stack.length) {
      const [x0, x1, depth] = stack.pop(); const [flo, fhi] = fEnclosure(I.iv(x0, x1), js, A, A1, A2, bF);
      if (flo > 0) { proved++; if (flo < minLower) { minLower = flo; worst = [x0, x1]; } if (depth > maxDepth) maxDepth = depth; continue; }
      if (fhi < 0) return { ok: false, verdict: 'REFUTED', counterexampleBox: [x0, x1], fUpper: fhi, cells: cells.length, provedBoxes: proved, undecidedBoxes: undecided.length };
      if (x1 - x0 < wmin || depth >= MAX_DEPTH) { undecided.push([x0, x1, flo, fhi]); continue; }
      const xm = (x0 + x1) / 2; stack.push([xm, x1, depth + 1], [x0, xm, depth + 1]);
    }
  }
  if (undecided.length) return { ok: false, verdict: 'REFUSED', undecidedBoxes: undecided.length, firstUndecided: undecided[0], cells: cells.length, provedBoxes: proved };
  return { ok: true, verdict: 'CERTIFIED', cells: cells.length, provedBoxes: proved, minCertifiedLowerBound: minLower, worstBox: worst, maxDepth, wMin: wmin, nonzeroEdgeJumps: js.length };
}
function checkE6(c, printed) { const [m, t] = massMoment(c); const bound = Q.div(t, m); const pr = qs(printed.replace('.', '') + '/1' + '0'.repeat(printed.split('.')[1].length)); return { ok: qeq(bound, c.bound) && qle(bound, pr), mass: Q.toString(m), moment: Q.toString(t), bound: Q.toString(bound), boundDecimal: decimal(bound, 24), equalsCertificateBound: qeq(bound, c.bound), printed, lePrinted: qle(bound, pr) }; }
function decide(c, printed, wmin) {
  const t0 = Date.now(); const r = { E1: checkE1(c), E2: checkE2(c), E3: checkE3(c), E6: checkE6(c, printed) };
  r.E4 = r.E2.ok ? checkE4(c, r.E2) : { ok: false, skipped: 'E2 failed' };
  const exactFailed = ['E1', 'E2', 'E3', 'E4', 'E6'].filter((k) => !r[k].ok);
  r.E5 = exactFailed.length === 0 ? checkE5(c, wmin) : { ok: false, skipped: 'an earlier condition failed: ' + exactFailed.join(',') };
  for (const p of r.E2.polynomials) delete p.rootsQ;
  const keys = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6']; r.failed = keys.filter((k) => !r[k].ok && !r[k].skipped);      // a skipped condition is not a failed one
  r.verdict = r.failed.length === 0 ? 'CERTIFIED' : (r.failed.length === 1 && r.failed[0] === 'E5' && r.E5.verdict === 'REFUSED' ? 'REFUSED' : 'REFUTED');
  r.seconds = +((Date.now() - t0) / 1000).toFixed(1); return r;
}
/* ---- red controls: planted corruptions that must be caught ------------------------------------------------------ */
function corrupt(c, kind) {
  c = copyCert(c);
  if (kind === 'densities98') c.densities = c.densities.map((x) => Q.mul(x, Q.R(98n, 100n)));
  else if (kind === 'weights13') c.b = c.b.map((x) => Q.mul(x, Q.R(13n, 10n)));
  else if (kind === 'mass005') c.densities[10] = Q.add(c.densities[10], Q.R(1n, 100n));
  else if (kind === 'bound') c.bound = Q.sub(c.bound, Q.R(1n, 10n ** 12n));
  else if (kind === 'reducible') c.A[2] = [2n, -3n, 1n];
  else if (kind === 'complex') c.A[2] = [1n, 0n, 1n];
  else die('unknown red control ' + kind);
  return c;
}
const REDS = [
  { id: 'densities-scaled-0.98', kind: 'densities98', expect: 'REFUTED', mustFail: ['E5'], what: 'every density scaled by 0.98: f dips below zero on the support (E5 refuted by a box with f < 0)' },
  { id: 'weights-scaled-1.3', kind: 'weights13', expect: 'REFUTED', mustFail: ['E3'], what: 'every weight scaled by 1.3: Σ b_Q deg Q exceeds the mass (E3)' },
  { id: 'extra-mass-near-0.05', kind: 'mass005', expect: 'REFUTED', mustFail: ['E4', 'E6'], what: 'density 1/100 added in the first cell of the support: ∫ log|x| dμ turns negative (E4) and the bound no longer matches (E6)' },
  { id: 'tampered-bound', kind: 'bound', expect: 'REFUTED', mustFail: ['E6'], what: 'the certificate\'s bound lowered by 10^-12: it no longer equals ∫ x dμ / m (E6)' },
  { id: 'reducible-polynomial', kind: 'reducible', expect: 'REFUTED', mustFail: ['E2'], what: 'x^2 - 3x + 1 replaced by x^2 - 3x + 2 = (x - 1)(x - 2): not irreducible (E2)' },
  { id: 'complex-roots', kind: 'complex', expect: 'REFUTED', mustFail: ['E2'], what: 'x^2 - 3x + 1 replaced by x^2 + 1: no real root (E2)' }
];
/* ---- the Python decider on the same bytes ------------------------------------------------------------------------ */
function decidePy(red) {
  const tmp = path.join(ROOT, 'out', 'c86'); fs.mkdirSync(tmp, { recursive: true });
  const out = path.join(tmp, 'py-' + (red || 'main') + '.json');
  const args = ['-I', path.join(ROOT, 'instruments', 'optq', 'c86.py'), path.join(ROOT, DIR, CERT_REL), '--printed', PRINTED, '--json', out]; if (red) args.push('--red', red);
  const r = cp.spawnSync('python3', args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (![0, 1].includes(r.status)) die('c86.py failed' + (red ? ' on ' + red : '') + ': ' + (r.stderr || '').slice(-400));
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}
const summary = (r) => ({ verdict: r.verdict, failed: r.failed, E5: r.E5.verdict ? { verdict: r.E5.verdict, provedBoxes: r.E5.provedBoxes ?? r.E5.proved_boxes, minLower: r.E5.minCertifiedLowerBound ?? r.E5.min_certified_lower_bound, maxDepth: r.E5.maxDepth ?? r.E5.max_depth } : r.E5, seconds: r.seconds });

/* ---- run ----------------------------------------------------------------------------------------------------------- */
console.log('C_86: the registry prints ' + PRINTED + '* on the 86a page and in the README (pinned at ' + PINS.registryCommit.slice(0, 8) + '); the certificate at ' + PINS.certificateCommit.slice(0, 7));
const js = decide(C, PRINTED, W_MIN);
console.log('  js  ' + js.verdict + '  failed ' + JSON.stringify(js.failed) + '  bound ' + js.E6.bound + ' = ' + js.E6.boundDecimal + '  E5 ' + JSON.stringify(summary(js).E5) + '  ' + js.seconds + ' s');
const reds = REDS.map((x) => {
  const r = decide(corrupt(C, x.kind), PRINTED, W_MIN); const row = { id: x.id, what: x.what, expect: x.expect, mustFail: x.mustFail, js: r.verdict, jsFailed: r.failed, jsSeconds: r.seconds };
  row.fired = r.verdict === x.expect && x.mustFail.every((k) => r.failed.includes(k));
  console.log('  RED ' + x.id.padEnd(24) + ' expect ' + x.expect + ' failing ' + x.mustFail.join('+') + '  js ' + r.verdict + ' ' + JSON.stringify(r.failed) + (row.fired ? '  fired' : '  DID NOT FIRE'));
  return row;
});
const deciders = { js: sha(rd('tools/replay-c86.js')), py: sha(rd('instruments/optq/c86.py')), eqcertInterval: sha(rd('instruments/interval/interval.js')), eqcertTranscendental: sha(rd('instruments/interval/transcendental.js')) };
if (CHECK) {
  const was = J('certs/c86-replay.json');
  if (was.js.verdict !== js.verdict || was.js.E6.bound !== js.E6.bound || JSON.stringify(was.js.failed) !== JSON.stringify(js.failed) || was.sha256 !== PINS.files[CERT_REL].sha256) die('the certificate does not re-derive as recorded');
  if (!reds.every((r) => r.fired)) die('a red control did not fire');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('c86 replay: ' + js.verdict + ' re-derived as recorded, ' + reds.length + '/' + reds.length + ' red controls fired (the JavaScript decider; the record holds both)');
} else {
  const py = decidePy(null); const pyS = summary(py);
  console.log('  py  ' + py.verdict + '  failed ' + JSON.stringify(py.failed) + '  bound ' + py.E6.bound + '  E5 ' + JSON.stringify(pyS.E5) + '  ' + py.seconds + ' s');
  const agree = py.verdict === js.verdict && py.E6.bound === js.E6.bound && JSON.stringify(py.failed) === JSON.stringify(js.failed);
  if (!agree) die('the two implementations disagree');
  for (const row of reds) { const r = decidePy(REDS.find((x) => x.id === row.id).kind); row.py = r.verdict; row.pyFailed = r.failed; row.pySeconds = r.seconds; row.fired = row.fired && r.verdict === row.expect && row.mustFail.every((k) => r.failed.includes(k)); console.log('  RED ' + row.id.padEnd(24) + ' py ' + r.verdict + ' ' + JSON.stringify(r.failed) + (row.fired ? '  fired in both' : '  DID NOT FIRE')); }
  if (!reds.every((r) => r.fired)) die('a red control did not fire in both implementations');
  const rec = {
    what: 'The registry\'s C_86 certificate (R. Pinho, #227, merged 2026-10-18 with an asterisk) decided by two implementations that share no code with each other or with the claimant\'s checker (never run): the six finite conditions E1–E6 of Smith\'s sufficiency criterion and the bound\'s arithmetic, exact where the data is rational and by sound enclosures where a logarithm enters; the step from the conditions to C_86 <= bound is the published chain (the minimum principle, Smith\'s criterion and theorem [Smi24]), read and not re-derived here',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: +((Date.now() - T0) / 1000).toFixed(1), node: process.version,
    python: cp.execFileSync('python3', ['-I', '-c', 'import sys; print(sys.version.split()[0])'], { encoding: 'utf8' }).trim(),
    deciders, pins: DIR + '/PINS.json', registryCommit: PINS.registryCommit, certificateCommit: PINS.certificateCommit, source: DIR + '/' + CERT_REL, sha256: PINS.files[CERT_REL].sha256,
    claim: 'C_86 <= ' + PRINTED, asteriskedAtPin: true, verdict: js.verdict, agree,
    bound: { exact: js.E6.bound, decimal: js.E6.boundDecimal, mass: js.E6.mass, moment: js.E6.moment, lePrinted: js.E6.lePrinted },
    js, py: Object.assign({}, py, { E2: { ok: py.E2.ok, polynomials: py.E2.polynomials.map((p) => ({ Q: p.Q, deg: p.deg, irreducible: p.irreducible, all_real: p.all_real })) } }),
    redControls: reds,
    limits: ['E5 is decided on the closed cells with positive density; the extension to C is the claimant\'s minimum-principle argument, read', 'irreducibility is decided for degree <= 5 by the absence of integer roots and of monic integer quadratic factors (Mignotte bound) — every Q here is monic up to sign with constant term ±1', 'the two deciders share the mathematics (the Taylor form on boxes) and nothing else']
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/c86-replay.json — ' + js.verdict + ' in both; ' + reds.length + '/' + reds.length + ' red controls fired in both; ' + rec.seconds + ' s');
}
