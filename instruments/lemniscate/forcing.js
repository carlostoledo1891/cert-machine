/* ERDOS-1038 — cert-force.js: RIGOROUS certificate for the PURE-FORCING lower bound  inf ≥ cap.

   THE ARGUMENT (CHASE.md "COMPOSITION RULE READ OUT"). μ normalized: supp μ ⊆ S = {−1} ∪ [0,1],
   (−√2,0) ⊆ E = {U_μ > 0}. Let a₀ = inf of the component of E containing (−√2,0); U_μ(a₀) ≤ 0.
   Case A, a₀ ≤ −cap: |E| ≥ |(a₀,0)| ≥ cap.
   Case B, a₀ ∈ (−cap, −√2]: R(a₀) = cap − |a₀|. For b ∈ [0, R(a₀)] the dual
       ν_b = δ_{a₀} + w₀ δ_b + Σ_j w_j δ_{s_j − b}      (all weights ≥ 0)
   has U_{ν_b} > 0 on S ⊇ supp μ, so 0 < ∫U_{ν_b} dμ = ∫U_μ dν_b = U_μ(a₀) + w₀U_μ(b) + Σ w_j U_μ(s_j−b)
   and, since U_μ(a₀) ≤ 0, some atom of ν_b other than a₀ lies in E (finite-atom selector). The lanes
   b ↦ b and b ↦ s_j − b are unit-speed and injective with pairwise disjoint images [0,R], [s_j − R, s_j]
   (teeth spaced by more than R_box ≥ R), all disjoint from (a₀,0); hence |E ∩ [0,∞)| ≥ R(a₀) and
   |E| ≥ |a₀| + R(a₀) = cap. So L(μ) = |E| ≥ cap for every μ, i.e. inf ≥ cap.

   WHAT IS CERTIFIED, per a₀-box [a⁻,a⁺] ⊂ [−cap, −√2] and b-box [b⁻,b⁺] ⊂ [0, R_box], R_box = cap − |a⁺|,
   with frozen weights w ≥ 0 and teeth s_j = hi − j·(R_box + slack):
       ∀ a₀ ∈ [a_eff, a⁺], b ∈ [b⁻,b⁺], x ∈ S :   U(x) > 0,
       U(x) = −log(x − a₀) − w₀ log|x − b| − Σ_j w_j log|x − s_j + b|,
   where a_eff = max(a⁻, b⁻ − cap): the b-box is only needed by those a₀ with R(a₀) ≥ b⁻.
   RIGOR MODEL (eqcert outward-rounded intervals, lib/eqcert/interval.js + transcendental.js log):
   (i)  −log(x − a₀) is increasing in a₀ for x > a₀  ⇒  evaluate at a₀ = a_eff.
   (ii) TRANSLATION MONOTONICITY. Put y = x + b. The teeth part depends on y only: −Σ w_j log|y − s_j|.
        The rest, f(y,b) = −log(y − b − a₀) − w₀ log(y − 2b), is INCREASING in b as long as x = y − b ≥ b
        (∂f/∂b = 1/(x−a₀) + 2w₀/(x−b) > 0). Hence on region II = {x ∈ [b⁺,1], b ∈ [b⁻,b⁺]}, for fixed y the
        minimum over admissible b is at the smallest admissible b, which gives exactly two THIN problems:
          (IIa) y ∈ [b⁻+b⁺, 1+b⁻], b = b⁻:   Φ(y) = −log(y − b⁻ − a_eff) − w₀ log(y − 2b⁻) − Σ w_j log|y − s_j|
          (IIb) y ∈ [1+b⁻, 1+b⁺],  x = 1:    Ψ(y) = −log(1 − a_eff) − w₀ log(2 − y) − Σ w_j log|y − s_j|
        Both are sums of −c·log|y − q| with c ≥ 0 ⇒ convex on each open gap between poles ⇒ tangent-line
        lower bounds, bisected until positive. No box smearing on region II at all.
   (iii) Region I = {x ∈ [0,b⁺]} and x = −1 use the crude box bound −w log max(|x−p⁻|,|x−p⁺|) (U is large there).
   The weights come from a float LP (lab-force5.forcingLP at b = b⁻, with x = 1 side rows for b across the
   box); the certificate does not trust the LP — it verifies whatever weights were produced.

   Usage:  node cert-force.js [cap] [out.json]
   env: DA0 a₀-box width (0.005) · NB0 b-boxes per a₀-box at R = 0.05 (16, scaled by R) · PHASES (6) ·
        LO/HI comb range (0.6 / 1.0) · NTMAX max teeth (60) · MAXDEPTH split depth (6) · ASTART/AEND partial
        range (tests only — a partial run is NOT a theorem) · VERBOSE per-b-box lines
   MIT.                                                                                                     */
'use strict';
const fs = require('fs');
const path = require('path');
const I = require(path.join(__dirname, '..', 'interval', 'interval.js'));
const T = require(path.join(__dirname, '..', 'interval', 'transcendental.js'));
const { forcingLP, minS } = require(path.join(__dirname, 'lab-force5.js'));
const { iv, add, sub, mul, div, neg, nextUp, nextDown } = I;

const cap = Number(process.argv[2] || 1.82);
const outFile = process.argv[3] || path.join(__dirname, `cert-force-${cap}.json`);
const NB0 = Number(process.env.NB0 || 16), DA0 = Number(process.env.DA0 || 0.005);
const PHASES = Number(process.env.PHASES || 6), LO = Number(process.env.LO || 0.6), HI0 = Number(process.env.HI || 1.0);
const MAXDEPTH = Number(process.env.MAXDEPTH || 6), NTMAX = Number(process.env.NTMAX || 60);
const NODES = Number(process.env.NODES || 20000);
const TOOTH_SLACK = 1e-12;                        // spacing = R_box + slack ≫ accumulated tooth rounding
const SQRT2 = Math.SQRT2;
const A_START = process.env.ASTART ? Number(process.env.ASTART) : -cap;
const A_END = process.env.AEND ? Number(process.env.AEND) : nextUp(-SQRT2);

/* ---------- 1-D convex pole sums:  G(y) = K − Σ c_k log|y − q_k|,  c_k ≥ 0 ---------------------------- */
// terms: [{q: [lo,hi] interval, c: number ≥ 0}]; poles strictly inside (yLo, yHi) must be thin (q lo === hi).
function Peval(terms, K, y) {                     // y thin interval; returns {g, gp} intervals
  let g = K, gp = iv(0);
  for (const t of terms) {
    if (t.c === 0) continue;
    const d = sub(y, t.q);                        // sign-definite because y is never at a pole
    if (!(d[0] > 0 || d[1] < 0)) throw new Error('Peval at a pole');
    const ad = I.abs(d);
    g = sub(g, mul(iv(t.c), T.log(ad)));
    gp = sub(gp, div(iv(t.c), d));                // d/dy[−c log|y−q|] = −c/(y−q)
  }
  return { g, gp };
}
function tangentAt(terms, K, p, u, v) {           // lower bound of G on [u,v] from the tangent at p (convexity)
  const e = Peval(terms, K, iv(p));
  if (e.g[1] <= 0) return { bound: e.g[1], hard: true, at: p };     // G(p) ≤ 0 for certain
  const Tu = add(e.g, mul(e.gp, sub(iv(u), iv(p)))), Tv = add(e.g, mul(e.gp, sub(iv(v), iv(p))));
  return { bound: Math.min(Tu[0], Tv[0]), at: p };
}
// crude lower bound of G over [u,v] (poles allowed at the ends): each term ≥ −c log(max distance)
function crudeOn(terms, K, u, v) {
  let g = K;
  for (const t of terms) {
    if (t.c === 0) continue;
    const d1 = I.abs(sub(iv(u), t.q)), d2 = I.abs(sub(iv(v), t.q));
    g = sub(g, mul(iv(t.c), T.log(iv(Math.max(d1[1], d2[1])))));
  }
  return g[0];
}
function convexGap(terms, K, u, v, uPole, vPole, depth, budget) {
  const mid = (u + v) / 2;
  if (mid <= u || mid >= v || v - u < 1e-13) return { bound: crudeOn(terms, K, u, v), at: mid };
  const tm = tangentAt(terms, K, mid, u, v);
  if (tm.hard) return tm;
  let bound = tm.bound;
  if (bound <= 0 && !uPole) { const t = tangentAt(terms, K, u, u, v); if (t.hard) return t; bound = Math.max(bound, t.bound); }
  if (bound <= 0 && !vPole) { const t = tangentAt(terms, K, v, u, v); if (t.hard) return t; bound = Math.max(bound, t.bound); }
  if (bound > 0 || depth >= 40 || --budget.n <= 0) return { bound, at: mid };
  const L = convexGap(terms, K, u, mid, uPole, false, depth + 1, budget);
  if (L.hard || (L.bound <= 0 && budget.n <= 0)) return L;
  const R = convexGap(terms, K, mid, v, false, vPole, depth + 1, budget);
  return L.bound < R.bound ? L : R;
}
// certified min of G over [yLo, yHi]; poles inside split the range (G → +∞ at a pole with c > 0)
function convexMin(terms, K, yLo, yHi, budget) {
  const poles = terms.filter(t => t.c > 0 && t.q[1] >= yLo && t.q[0] <= yHi)
    .map(t => { if (t.q[0] !== t.q[1]) throw new Error('wide pole inside range'); return t.q[0]; });
  const poleSet = new Set(poles);
  const pts = [...new Set([yLo, ...poles, yHi])].sort((p, q) => p - q);
  let best = { bound: Infinity, at: null };
  for (let i = 0; i + 1 < pts.length; i++) {
    const u = pts[i], v = pts[i + 1];
    const r = convexGap(terms, K, u, v, poleSet.has(u), poleSet.has(v), 0, budget);
    if (r.bound < best.bound) best = r;
    if (best.bound <= 0) break;
  }
  return best;
}

/* ---------- crude box bound for region I and x = −1 ------------------------------------------------- */
// atoms: [{L, Uu, w}] moving-atom boxes; x an interval; |x − p| ≤ max(|x − L|, |x − Uu|)
function boxBound(aEff, atoms, x) {
  let g = neg(T.log(sub(x, iv(aEff))));
  for (const A of atoms) {
    if (A.w === 0) continue;
    const d1 = I.abs(sub(x, iv(A.L))), d2 = I.abs(sub(x, iv(A.Uu)));
    g = sub(g, mul(iv(A.w), T.log(iv(Math.max(d1[1], d2[1])))));
  }
  return g[0];
}
function boxBoundSplit(aEff, atoms, u, v, depth) {
  const m = boxBound(aEff, atoms, iv(u, v));
  if (m > 0 || depth >= 12) return m;
  const mid = (u + v) / 2;
  return Math.min(boxBoundSplit(aEff, atoms, u, mid, depth + 1), boxBoundSplit(aEff, atoms, mid, v, depth + 1));
}

/* ---------- the b-box certificate ----------------------------------------------------------------- */
// returns {min, at, piece} — min > 0 means: U > 0 on S for all a₀ ∈ [aEff, ·], b ∈ [bLo,bHi], with weights w
function certifyBBoxOnce(aEff, bLo, bHi, teeth, w) {
  const budget = { n: NODES };
  let best = { min: Infinity, at: null, piece: null };
  const take = (m, at, piece) => { if (m < best.min) best = { min: m, at, piece }; };
  // (IIa) b = b⁻, y = x + b⁻ ∈ [b⁻+b⁺, 1+b⁻]
  const termsA = [{ q: add(iv(aEff), iv(bLo)), c: 1 }, { q: iv(2 * bLo), c: w[0] }, ...teeth.map((s, j) => ({ q: iv(s), c: w[j + 1] }))];
  const rA = convexMin(termsA, iv(0), nextDown(bLo + bHi), nextUp(1 + bLo), budget);
  take(rA.bound, rA.at === null ? null : rA.at - bLo, 'IIa');
  if (best.min <= 0) return best;
  // (IIb) x = 1, y = 1 + b ∈ [1+b⁻, 1+b⁺]
  const termsB = [{ q: iv(2), c: w[0] }, ...teeth.map((s, j) => ({ q: iv(s), c: w[j + 1] }))];
  const KB = neg(T.log(sub(iv(1), iv(aEff))));
  const rB = convexMin(termsB, KB, nextDown(1 + bLo), nextUp(1 + bHi), budget);
  take(rB.bound, 1, 'IIb');
  if (best.min <= 0) return best;
  // (x = −1) exact 1-D convex problem in b ∈ [b⁻,b⁺]: −log(−1−a) − w₀ log(1+b) − Σ w_j log(1+s_j−b)
  const termsM = [{ q: iv(-1), c: w[0] }, ...teeth.map((s, j) => ({ q: add(iv(1), iv(s)), c: w[j + 1] }))];
  const KM = neg(T.log(sub(iv(-1), iv(aEff))));
  const rM = convexMin(termsM, KM, bLo, bHi, budget);
  take(rM.bound, -1, 'x=-1');
  if (best.min <= 0) return best;
  // (I) x ∈ [0, b⁺]: crude box bound (U is huge there — the heavy atom is within b⁺ of x)
  const atoms = [{ L: bLo, Uu: bHi, w: w[0] }, ...teeth.map((s, j) => { const p = sub(iv(s), iv(bLo, bHi)); return { L: p[0], Uu: p[1], w: w[j + 1] }; })];
  take(boxBoundSplit(aEff, atoms, 0, bHi, 0), bHi / 2, 'I');
  return best;
}

/* ---------- LP weights ---------------------------------------------------------------------------- */
let lpCalls = 0;
function weightsFor(aEff, bLo, bHi, teeth) {
  lpCalls++;
  const P = [bLo, ...teeth.map(s => s - bLo)];
  const extraRows = [];
  for (let k = 1; k <= 8; k++) {                  // x = ±1 side rows across the b-box (the only real b-dependence)
    const b = bLo + (bHi - bLo) * k / 8, Pb = [b, ...teeth.map(s => s - b)];
    for (const x of [1, -1]) {
      if (Pb.some(p => Math.abs(x - p) < 1e-9)) continue;
      extraRows.push({ row: Pb.map(p => -Math.log(Math.abs(x - p))), g0: -Math.log(Math.abs(x - aEff)) });
    }
  }
  const r = forcingLP(aEff, P, { NX: 400, rounds: 60, extraRows });
  if (!r.w) return null;
  return r.w.map(x => (x > 1e-15 ? x : 0));
}
function certifyBBox(aEff, bLo, bHi, teeth, depth) {
  const w = weightsFor(aEff, bLo, bHi, teeth);
  if (w) {
    const c = certifyBBoxOnce(aEff, bLo, bHi, teeth, w);
    if (process.env.VERBOSE) console.log(`   b ∈ [${bLo.toExponential(3)}, ${bHi.toExponential(3)}] a_eff ${aEff.toFixed(6)} d${depth}: float@b⁻ ${minS(aEff, [bLo, ...teeth.map(s => s - bLo)], w, 20000).m.toExponential(3)}  certified ${c.min.toExponential(3)} (${c.piece} at ${c.at})`);
    if (c.min > 0) return [{ b: [bLo, bHi], aEff, w, min: c.min, at: c.at, piece: c.piece }];
  }
  if (depth >= MAXDEPTH) return null;
  const mid = (bLo + bHi) / 2;
  const L = certifyBBox(aEff, bLo, mid, teeth, depth + 1); if (!L) return null;
  const R = certifyBBox(Math.max(aEff, nextDown(mid - cap)), mid, bHi, teeth, depth + 1); if (!R) return null;
  return L.concat(R);
}

/* ---------- comb + a₀-box driver ------------------------------------------------------------------- */
function combTeeth(hi, Rsp) {
  const lo = Math.max(LO, hi - NTMAX * Rsp);      // at most NTMAX teeth (the deep end has R → 0)
  const teeth = []; for (let s = hi; s - Rsp >= lo - 1e-12; s -= Rsp) teeth.push(s);
  return teeth;
}
function bestPhase(aLo, Rbox, Rsp) {              // float scan of the comb phase at b = R_box — heuristic only
  let best = null;
  for (let ph = 0; ph < PHASES; ph++) {
    const hi = HI0 + Rbox * ph / PHASES;
    const teeth = combTeeth(hi, Rsp);
    const P = [Rbox, ...teeth.map(s => s - Rbox)].map(p => (Math.abs(p - 1) < 1e-3 ? 1 + 1e-3 : p));
    const r = forcingLP(aLo, P, { NX: 400, rounds: 60 });
    const m = r.w ? minS(aLo, P, r.w, 20000).m : -Infinity;
    if (!best || m > best.m) best = { m, hi, teeth };
  }
  return best;
}
function certifyABox(aLo, aHi, depth) {
  const Rbox = nextUp(cap + aHi);                 // ≥ R(a₀) = cap − |a₀| for every a₀ in the box
  const Rsp = Rbox + TOOTH_SLACK;
  const ph = bestPhase(aLo, Rbox, Rsp);
  const teeth = ph.teeth;
  if (teeth.length < 1 || !(teeth[teeth.length - 1] - Rsp > Rbox)) throw new Error('comb geometry');
  for (let j = 0; j + 1 < teeth.length; j++) if (!(teeth[j] - teeth[j + 1] > Rbox)) throw new Error('tooth spacing');
  const nb = Math.max(2, Math.round(NB0 * Math.min(1, Rbox / 0.05)));
  const bb = [];
  for (let i = 0; i < nb; i++) {
    const bLo = Rbox * i / nb, bHi = i + 1 === nb ? Rbox : Rbox * (i + 1) / nb;
    const aEff = Math.max(aLo, nextDown(bLo - cap));
    const r = certifyBBox(aEff, bLo, bHi, teeth, 0);
    if (!r) {
      if (depth >= MAXDEPTH) return null;
      const mid = (aLo + aHi) / 2;
      const L = certifyABox(aLo, mid, depth + 1); if (!L) return null;
      const R = certifyABox(mid, aHi, depth + 1); if (!R) return null;
      return L.concat(R);
    }
    bb.push(...r);
  }
  return [{ a: [aLo, aHi], Rbox, Rsp, hi: ph.hi, teeth, floatMargin: ph.m, bboxes: bb, min: Math.min(...bb.map(o => o.min)) }];
}

/* ---------- main ---------------------------------------------------------------------------------- */
const t0 = Date.now();
console.log(`cert-force: cap = ${cap}; a₀ ∈ [${A_START}, ${A_END}] (full range = [−cap, −√2]); DA0 ${DA0}, NB0 ${NB0}, phases ${PHASES}, comb [${LO}, ${HI0}+), ≤ ${NTMAX} teeth`);
const boxes = [];
let ok = true, worst = Infinity;
for (let i = 0; ; i++) {
  const aLo = A_START + i * DA0;
  if (aLo >= A_END - 1e-12) break;
  const aHi = Math.min(A_END, A_START + (i + 1) * DA0);
  const r = certifyABox(aLo, aHi, 0);
  if (!r) { ok = false; console.log(`FAIL a₀-box [${aLo.toFixed(5)}, ${aHi.toFixed(5)}]`); break; }
  const m = Math.min(...r.map(o => o.min));
  worst = Math.min(worst, m);
  boxes.push(...r);
  const nbb = r.reduce((s, o) => s + o.bboxes.length, 0);
  console.log(`a₀ ∈ [${aLo.toFixed(5)}, ${aHi.toFixed(5)}]  R_box ${r[0].Rbox.toFixed(5)}  sub-boxes ${r.length} × b-boxes ${nbb}  certified min ${m.toExponential(3)}  (float@R ${r.map(o => o.floatMargin.toExponential(2)).join('/')})  [${((Date.now() - t0) / 1000).toFixed(0)}s, ${lpCalls} LPs]`);
}
const secs = (Date.now() - t0) / 1000;
const full = A_START <= -cap && A_END >= -SQRT2;
const summary = { cap, ok, fullRange: full, aRange: [A_START, A_END], worstCertifiedMargin: worst, aBoxes: boxes.length, bBoxes: boxes.reduce((s, o) => s + o.bboxes.length, 0), lpCalls, secs };
console.log(ok ? `\nALL BOXES CERTIFIED${full ? ` — inf ≥ ${cap} (pure forcing, no tail)` : ` on the PARTIAL range [${A_START}, ${A_END}] (not a theorem)`}; worst certified margin ${worst.toExponential(3)}; ${summary.aBoxes} a₀-boxes, ${summary.bBoxes} b-boxes, ${lpCalls} LPs, ${secs.toFixed(0)} s` : `\nFAILED — see above`);
fs.writeFileSync(outFile, JSON.stringify({
  statement: `For every probability measure μ with supp μ ⊆ {−1} ∪ [0,1] and (−√2,0) ⊆ {U_μ > 0}: |{U_μ > 0}| ≥ ${cap}. Proof: pure-forcing composition (header of cert-force.js); each box below certifies U_ν > 0 on {−1} ∪ [0,1] for all a₀ ∈ [aEff, a⁺] and b in the b-box, with the listed weights, heavy lane at b and teeth at s_j − b.`,
  rigor: 'eqcert outward-rounded interval arithmetic; monotonicity in a₀; translation monotonicity in b (thin problems IIa/IIb, convex tangent bounds between poles); crude box bounds on x ∈ [0,b⁺] and x = −1.',
  summary, boxes,
}, null, 1));
console.log(`wrote ${outFile}`);
