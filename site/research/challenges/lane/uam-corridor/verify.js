/* verify.js — the UAM corridor instance, verified end to end. MIT.
   Companion to /reports/uam-corridor. Node only, no dependencies beyond the
   interval/rational toolkit published in this repository. Run:  node verify.js
   Exit 0 iff every check passes — INCLUDING two mutation controls that must go red on
   deliberately broken inputs, printed last, because a check that has never been seen
   failing proves nothing.

   WHAT THIS FILE ESTABLISHES, in the page's own words: a MATHEMATICALLY certified
   equilibrium statement in exact BigInt rational arithmetic — residuals identically
   zero, a uniqueness condition with an exact integer margin, and an honest REFUSED plus
   an exhibited equilibrium FACE where the condition fails. It carries no airworthiness,
   separation-assurance or operational-approval meaning; "certification" in aviation is
   the regulator's word, not ours.

   THE INSTANCE is illustrative — derived from the published structure of the Eve-led
   "Concept of Operations for Sustainable Urban Air Mobility in Rio de Janeiro"
   (April 2022; sha256 0d38f35ae667e4f613de54df1789c1012896c0a812b4ced2cb8670aa5a8b536b):
   the two approved CEMHS↔Galeão routes of its p.52 (free-flow 11 min; shoreline legs
   totalling 16 min), demand proportions from its p.22 (Barra 12 / Copacabana 22 /
   Centro 7), and its p.52 expectation of multiple fleet operators. Congestion
   coefficients and demand units are stylized by us; nothing here is Eve's data. */
'use strict';
const path = require('path');
const fs = require('fs');
/* resolve the toolkit by MARKER, not by depth: this file runs three levels below the root
   in the published repo and four in its source tree. */
function eqcertSrc(from) {
  let d = from;
  for (let i = 0; i < 8; i++) {
    const cand = path.join(d, 'core', 'interval');
    if (fs.existsSync(path.join(cand, 'rational.js'))) return cand;
    const up = path.dirname(d);
    if (up === d) break;
    d = up;
  }
  throw new Error('verify.js: the rational toolkit was not found above ' + from);
}
const RAT = require(path.join(eqcertSrc(__dirname), 'rational.js'));
const { R: Q, ZERO, ONE, add, sub, mul, div, neg, cmp, sign, toString: rstr, solve } = RAT;
const Qi = n => Q(BigInt(n));

let n = 0, fails = 0;
function say(cond, name, detail) {
  n++;
  console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (detail !== undefined ? '   [' + detail + ']' : ''));
  if (!cond) fails++;
}

/* ============ scenario one: the airport-bound network (3 populations) ============ */
const NODES = [1, 2, 3, 4], EXIT = 4;
const EDGES = [[1, 4], [1, 2], [2, 3], [3, 4]];   // k0 main B→G · k1 B→C · k2 C→T · k3 T→G
const NE = 4;
const a = [11, 5, 5, 6], b = [3, 1, 1, 1], g = [2, 1, 1, 1];
const POPS = [
  { name: 'Barra', s: 1, Q: 12 },
  { name: 'Copacabana', s: 2, Q: 22 },
  { name: 'Centro', s: 3, Q: 7 },
];
const R = POPS.length;
function usableEdges(s) {
  const fwd = new Set([s]); let grew = true;
  while (grew) { grew = false; for (const [u, v] of EDGES) if (fwd.has(u) && !fwd.has(v)) { fwd.add(v); grew = true; } }
  const back = new Set([EXIT]); grew = true;
  while (grew) { grew = false; for (const [u, v] of EDGES) if (back.has(v) && !back.has(u)) { back.add(u); grew = true; } }
  const use = []; EDGES.forEach(([u, v], k) => { if (fwd.has(u) && back.has(v)) use.push(k); });
  return use;
}
const USABLE = POPS.map(p => usableEdges(p.s));

function edgeCostExact(j, ri, k) {
  let tot = ZERO;
  for (let s = 0; s < R; s++) if (j[s][k] !== undefined) tot = add(tot, j[s][k]);
  const own = j[ri][k] !== undefined ? j[ri][k] : ZERO;
  return add(add(Qi(a[k]), mul(Qi(b[k]), tot)), mul(Qi(g[k]), own));
}
function kktExact(S) {
  const phiNodes = [];
  for (let ri = 0; ri < R; ri++) { const set = new Set();
    for (const k of S[ri]) { const [u, v] = EDGES[k]; if (u !== EXIT) set.add(u); if (v !== EXIT) set.add(v); }
    phiNodes.push([...set]); }
  const idxJ = POPS.map(() => ({})), idxP = POPS.map(() => ({})); let col = 0;
  for (let ri = 0; ri < R; ri++) for (const k of S[ri]) idxJ[ri][k] = col++;
  for (let ri = 0; ri < R; ri++) for (const nn of phiNodes[ri]) idxP[ri][nn] = col++;
  const N = col;
  const A = Array.from({ length: N }, () => Array.from({ length: N }, () => ZERO));
  const rhs = Array.from({ length: N }, () => ZERO);
  let row = 0;
  for (let ri = 0; ri < R; ri++) for (const k of S[ri]) { const [u, v] = EDGES[k];
    for (let rj = 0; rj < R; rj++) if (idxJ[rj][k] !== undefined) A[row][idxJ[rj][k]] = add(A[row][idxJ[rj][k]], Qi(b[k]));
    A[row][idxJ[ri][k]] = add(A[row][idxJ[ri][k]], Qi(g[k]));
    if (v !== EXIT) A[row][idxP[ri][v]] = add(A[row][idxP[ri][v]], ONE);
    if (u !== EXIT) A[row][idxP[ri][u]] = add(A[row][idxP[ri][u]], neg(ONE));
    rhs[row] = neg(Qi(a[k])); row++; }
  for (let ri = 0; ri < R; ri++) { const { s, Q: Qr } = POPS[ri];
    for (const nn of phiNodes[ri]) {
      for (const k of S[ri]) { const [u, v] = EDGES[k];
        if (u === nn) A[row][idxJ[ri][k]] = add(A[row][idxJ[ri][k]], ONE);
        if (v === nn) A[row][idxJ[ri][k]] = add(A[row][idxJ[ri][k]], neg(ONE)); }
      rhs[row] = (nn === s) ? Qi(Qr) : ZERO; row++;
    } }
  if (row !== N) return { singular: true };
  const x = solve(A, rhs, N);
  if (!x) return { singular: true };
  const j = POPS.map(() => ({})), phi = POPS.map(() => ({}));
  for (let ri = 0; ri < R; ri++) for (const k of S[ri]) j[ri][k] = x[idxJ[ri][k]];
  for (let ri = 0; ri < R; ri++) for (const nn of phiNodes[ri]) phi[ri][nn] = x[idxP[ri][nn]];
  return { j, phi };
}
function solveExact(seed) {
  let S = (seed || USABLE).map(s => s.slice());
  for (let iter = 0; iter < 60; iter++) {
    const res = kktExact(S);
    if (res.singular) throw new Error('singular KKT');
    let changed = false;
    for (let ri = 0; ri < R; ri++) {
      const nonpos = S[ri].filter(k => sign(res.j[ri][k]) <= 0);
      if (nonpos.length) { let w = nonpos[0]; for (const k of nonpos) if (cmp(res.j[ri][k], res.j[ri][w]) < 0) w = k;
        S[ri] = S[ri].filter(k => k !== w); changed = true; } }
    if (changed) continue;
    for (let ri = 0; ri < R; ri++) {
      const phiOf = nn => nn === EXIT ? ZERO : (res.phi[ri][nn] !== undefined ? res.phi[ri][nn] : null);
      let best = null, bestSlack = ZERO;
      for (const k of USABLE[ri]) { if (S[ri].includes(k)) continue; const [u, v] = EDGES[k];
        const pu = phiOf(u), pv = phiOf(v); if (pu === null || pv === null) continue;
        const slack = add(edgeCostExact(res.j, ri, k), sub(pv, pu));
        if (sign(slack) < 0 && cmp(slack, bestSlack) < 0) { best = k; bestSlack = slack; } }
      if (best !== null) { S[ri].push(best); changed = true; } }
    if (!changed) return { S, ...res };
  }
  throw new Error('active set did not settle');
}
function conservationResidual(j, S) {
  let worst = ZERO;
  for (let ri = 0; ri < R; ri++) { const { s, Q: Qr } = POPS[ri];
    for (const nn of NODES) { if (nn === EXIT) continue;
      let net = ZERO; for (const k of S[ri]) { const [u, v] = EDGES[k];
        if (u === nn) net = add(net, j[ri][k]); if (v === nn) net = sub(net, j[ri][k]); }
      const d = sub(net, nn === s ? Qi(Qr) : ZERO);
      if (cmp(RAT.abs(d), worst) > 0) worst = RAT.abs(d); } }
  return worst;
}
function tightnessResidual(j, phi, S) {
  let worst = ZERO;
  for (let ri = 0; ri < R; ri++) { const phiOf = nn => nn === EXIT ? ZERO : phi[ri][nn];
    for (const k of S[ri]) { const [u, v] = EDGES[k];
      const r_ = add(edgeCostExact(j, ri, k), sub(phiOf(v), phiOf(u)));
      if (cmp(RAT.abs(r_), worst) > 0) worst = RAT.abs(r_); } }
  return worst;
}
function minOffSupportSlack(j, phi, S) {
  let best = null;
  for (let ri = 0; ri < R; ri++) { const phiOf = nn => nn === EXIT ? ZERO : (phi[ri][nn] !== undefined ? phi[ri][nn] : null);
    for (const k of USABLE[ri]) { if (S[ri].includes(k)) continue; const [u, v] = EDGES[k];
      const pu = phiOf(u), pv = phiOf(v); if (pu === null || pv === null) continue;
      const slack = add(edgeCostExact(j, ri, k), sub(pv, pu));
      if (best === null || cmp(slack, best) < 0) best = slack; } }
  return best === null ? ZERO : best;
}
function uniquenessMargin(bArr, gArr) {
  const Rk = EDGES.map((_, k) => USABLE.filter(u => u.includes(k)).length);
  let margin = null, pd = true;
  for (let k = 0; k < NE; k++) {
    const e1 = gArr[k], e2 = Rk[k] * bArr[k] + gArr[k];
    if (!(e1 > 0 && e2 > 0)) pd = false;
    const m = Math.min(e1, e2);
    if (margin === null || m < margin) margin = m;
  }
  return { pd, margin };
}

console.log('UAM corridor instance — exact verification (BigInt rationals; zero means identically zero)\n');
console.log('-- scenario one: three populations, airport-bound --');
const sol = solveExact();
const consR = conservationResidual(sol.j, sol.S);
const tightR = tightnessResidual(sol.j, sol.phi, sol.S);
const slack = minOffSupportSlack(sol.j, sol.phi, sol.S);
say(sign(consR) === 0, 'Kirchhoff conservation residual exactly 0', rstr(consR));
say(sign(tightR) === 0, 'support tightness residual exactly 0', rstr(tightR));
say(sign(slack) >= 0, 'no off-support shortcut (min slack >= 0)', rstr(slack));
let minFlow = null;
for (let ri = 0; ri < R; ri++) for (const k of sol.S[ri]) if (minFlow === null || cmp(sol.j[ri][k], minFlow) < 0) minFlow = sol.j[ri][k];
say(sign(minFlow) > 0, 'support positivity (min flow > 0)', rstr(minFlow));
const um = uniquenessMargin(b, g);
say(um.pd && um.margin === 1, 'uniqueness condition PD with exact margin 1', 'margin = ' + um.margin);
say(cmp(sol.j[0][0], div(Qi(128), Qi(11))) === 0 && cmp(sol.j[0][1], div(Qi(4), Qi(11))) === 0,
  'Barra splits: 128/11 on the main corridor, 4/11 on the shoreline chain',
  rstr(sol.j[0][0]) + ' / ' + rstr(sol.j[0][1]));
const solB = solveExact([[1, 2, 3], [2, 3], [3]]);
say(POPS.every((_, ri) => sol.S[ri].slice().sort().join() === solB.S[ri].slice().sort().join()) &&
    POPS.every((_, ri) => sol.S[ri].every(k => cmp(sol.j[ri][k], solB.j[ri][k]) === 0)),
  'identical equilibrium from the opposite-path seed (independent restart)');

/* ============ scenario two: two operators, two corridors, total-flow costs ============ */
console.log('\n-- scenario two: two operators, total-flow congestion (g = 0) --');
const aM = Qi(11), aS = Qi(16), bM = Qi(2), bS = Qi(2), QA = Qi(6), QB = Qi(6);
const T = add(QA, QB);
const xMain = div(add(sub(aS, aM), mul(bS, T)), add(bM, bS));
say(cmp(xMain, div(Qi(29), Qi(4))) === 0, 'corridor totals pinned exactly: 29/4 on main of 12', rstr(xMain));
function v2ok(AjM, BjM) {
  const AjS = sub(QA, AjM), BjS = sub(QB, BjM);
  const totM = add(AjM, BjM), totS = add(AjS, BjS);
  const cM = add(aM, mul(bM, totM)), cS = add(aS, mul(bS, totS));
  return sign(sub(add(totM, totS), T)) === 0 && [AjM, AjS, BjM, BjS].every(f => sign(f) >= 0) &&
    cmp(totM, xMain) === 0 && cmp(cM, cS) === 0;
}
const lo = sub(xMain, QB), hi = QA;                       // operator-A-on-main range [5/4, 6]
const mid = div(add(lo, hi), Qi(2));
say(cmp(sub(hi, lo), div(Qi(19), Qi(4))) === 0, 'equilibrium face width exactly 19/4', rstr(sub(hi, lo)));
say(v2ok(lo, sub(xMain, lo)) && v2ok(hi, sub(xMain, hi)) && v2ok(mid, sub(xMain, mid)),
  'both extremes AND the midpoint verify exactly — a 1-dimensional face of equilibria');
const det = sub(mul(bM, bM), mul(bM, bM));
say(sign(det) === 0, 'non-strictness witness: det(symmetric part) exactly 0 — point-uniqueness REFUSED', rstr(det));

/* ============ the sequel: the map around the instance, and the tie-breakers ============ */
console.log('\n-- the map around the instance (exact) --');
{
  /* the demand threshold: scaling all demands by t, in the low-demand regime Barra rides
     main only; the shoreline chain's route slack, derived from the SAME cost constants:
     slack(t) = a1 + (a2 + b2·22t) + (a3 + b3·(22+7)t) − (a0 + (b0+g0)·12t).  Zero at 5/9. */
  const slackAt = t => {
    const chain = add(add(Qi(a[1]), add(Qi(a[2]), mul(Qi(b[2]), mul(Qi(22), t)))),
                      add(Qi(a[3]), mul(Qi(b[3]), mul(Qi(29), t))));
    const main = add(Qi(a[0]), mul(Qi(b[0] + g[0]), mul(Qi(12), t)));
    return sub(chain, main);
  };
  const tStar = div(Qi(5), Qi(9));
  say(sign(slackAt(tStar)) === 0 &&
      sign(slackAt(sub(tStar, div(Qi(1), Qi(9))))) > 0 &&
      sign(slackAt(add(tStar, div(Qi(1), Qi(9))))) < 0,
    'the shoreline route enters at exactly demand scale t* = 5/9 (slack 0 there, sign change bracketed)',
    rstr(slackAt(tStar)));
}
{
  /* the face-existence boundary: interior aggregate split x = (aS−aM+bS·T)/(bM+bS); the
     face exists iff 0 < x < T, i.e. exactly when T > 5/2 with these constants. */
  const xOf = T => div(add(sub(aS, aM), mul(bS, T)), add(bM, bS));
  const Tb = div(Qi(5), Qi(2));
  say(cmp(xOf(Tb), Tb) === 0 && cmp(xOf(Qi(4)), Qi(4)) < 0 && sign(xOf(Qi(4))) > 0,
    'the face exists exactly when total operator demand exceeds 5/2 (boundary x = T there)',
    rstr(xOf(Tb)));
}
console.log('\n-- the tie-breakers (asymmetric operators QA = 8, QB = 4; same totals) --');
{
  /* vanishing pricing: with own-flow price g the unique equilibrium has
     TM(g) = (2(aS−aM) + (2bS+g)T)/(2bM+2bS+2g) and jA = TM/2 + (QA−QB)/4;
     verified at g = 1/4 by the exact tightness identity, then the g→0 substitution. */
  const QA8 = Qi(8), QB4 = Qi(4), T = Qi(12);
  const TMof = g => div(add(mul(Qi(2), sub(aS, aM)), mul(add(mul(Qi(2), bS), g), T)),
                        add(add(mul(Qi(2), bM), mul(Qi(2), bS)), mul(Qi(2), g)));
  const jAof = g => add(div(TMof(g), Qi(2)), div(sub(QA8, QB4), Qi(4)));
  const g4 = div(Qi(1), Qi(4));
  const TMg = TMof(g4), jAg = jAof(g4);
  const cM = add(add(aM, mul(bM, TMg)), mul(g4, jAg));
  const cS = add(add(aS, mul(bS, sub(T, TMg))), mul(g4, sub(QA8, jAg)));
  const sel = jAof(ZERO);
  const faceLo = sub(TMof(ZERO), QB4), faceHi = TMof(ZERO);
  say(cmp(cM, cS) === 0 && cmp(sel, div(Qi(37), Qi(8))) === 0 &&
      cmp(sel, faceLo) > 0 && cmp(sel, faceHi) < 0,
    'vanishing pricing selects exactly 37/8 — verified at g = 1/4, strictly inside the face [13/4, 29/4]',
    rstr(sel));
  /* the classical characterization: the vanishing-price (Tikhonov) limit is the
     LEAST-NORM point of the face. Witnessed exactly: the squared flow vector
     (s, QA−s, TM−s, s−TM+QB) at the selected s is strictly below both neighbours. */
  const n2 = s => {
    const parts = [s, sub(QA8, s), sub(TMof(ZERO), s), sub(s, sub(TMof(ZERO), QB4))];
    let acc = ZERO; for (const p of parts) acc = add(acc, mul(p, p));
    return acc;
  };
  const d8 = div(Qi(1), Qi(8));
  say(cmp(n2(sel), n2(sub(sel, d8))) < 0 && cmp(n2(sel), n2(add(sel, d8))) < 0,
    'the pricing selection is the LEAST-NORM point of the face (classical Tikhonov selection) — discrete minimality witnessed exactly',
    rstr(n2(sel)) + ' < ' + rstr(n2(sub(sel, d8))) + ', ' + rstr(n2(add(sel, d8))));
  /* the proportional point: a shared quantal response gives x_r proportional to Q_r, so
     xA = QA·(29/4)/T = 29/6 exactly; the two tie-breakers differ by exactly 5/24. */
  const prop = div(mul(QA8, TMof(ZERO)), T);
  say(cmp(prop, div(Qi(29), Qi(6))) === 0 &&
      cmp(sub(prop, sel), div(Qi(5), Qi(24))) === 0,
    'the proportional (quantal) point is exactly 29/6 — differing from the pricing point by exactly 5/24',
    rstr(prop) + ' − ' + rstr(sel) + ' = ' + rstr(sub(prop, sel)));
}

/* ============ mutation controls: the checks shown going red ============ */
console.log('\n-- mutation controls (these must FIRE; a check never seen red proves nothing) --');
{
  const u0 = uniquenessMargin(b, [0, 0, 0, 0]);
  say(!u0.pd && u0.margin === 0, 'control M1: with g = 0 the uniqueness condition FAILS (margin 0)', 'pd=' + u0.pd);
  const jBad = sol.j.map(m => Object.assign({}, m));
  jBad[0][sol.S[0][0]] = add(jBad[0][sol.S[0][0]], Qi(1));
  say(sign(conservationResidual(jBad, sol.S)) !== 0, 'control M2: +1 on one flow and conservation goes red');
}

console.log('\n' + (fails === 0 ? 'ALL PASS' : fails + ' FAILED') + '  (' + n + ' checks)');
process.exit(fails ? 1 : 0);
