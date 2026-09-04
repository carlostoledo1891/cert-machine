/* decide.js — turn three models' answers into three geometries, exactly, and
 * then measure the distance between the geometries.
 *   node experiments/neural-geometry/decide.js
 *
 * Every model gets the same treatment, and the treatment contains no fitting.
 * The two directions of a pair are added rather than averaged: the sum is an
 * integer where the mean is a half-integer, scaling a distance matrix by 2
 * changes no triangle inequality and no signature, and integers keep the gate
 * and the congruence in exact arithmetic. Whatever a model's numbers do, they
 * do it in a table nothing has smoothed.
 *
 * The metric gate is a MEASUREMENT here, not a veto. Classical scaling is
 * defined on any symmetric hollow table, and the negative mass already reports
 * how far the table is from Euclidean; refusing to draw would throw away the
 * more interesting fact, which is that the triangle inequality fails almost
 * everywhere and fails in a patterned way. So the gate reports how many triples
 * break and by how much against the largest distance the model was willing to
 * name, and the geometry is drawn regardless, labelled with what it violated.
 *
 * Two one-parameter fits go beside it. A LINE has d ∝ |i−j| and a CYCLE has
 * d ∝ min(|i−j|, n−|i−j|); each has a single free scale, fixed in closed form,
 * so the residuals are comparable and neither can flatter itself by having more
 * knobs. For an ordered set they answer the question the set was built to ask:
 * does this model hold the week as a line or as a circle?
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../exact-geometry/decide.js');
const { align } = require('./plate.js');

const IN = path.join(__dirname, 'out', 'probe.json');
const P = JSON.parse(fs.readFileSync(IN, 'utf8'));

const sym = (raw, n) => Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => (i === j ? 0 : raw[i][j] + raw[j][i])));   // ×2, integer

function asymmetry(raw, n) {
  let mx = 0, sum = 0, cnt = 0, worst = null, tot = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.abs(raw[i][j] - raw[j][i]);
    sum += d; cnt++; tot += raw[i][j] + raw[j][i];
    if (d > mx) { mx = d; worst = [i, j, raw[i][j], raw[j][i]]; }
  }
  return { max: mx, mean: sum / cnt, rel: tot ? sum / (tot / 2) : 0, worst };
}

/* the two one-parameter shapes an ordered set could have. One free scale each,
   set by projection, so the residuals mean the same thing. */
function shapeFits(D, n) {
  const L = [], C = [], d = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const g = j - i;
    L.push(g); C.push(Math.min(g, n - g)); d.push(D[i][j]);
  }
  const fit = (T) => {
    let dt = 0, tt = 0, dd = 0;
    for (let k = 0; k < d.length; k++) { dt += d[k] * T[k]; tt += T[k] * T[k]; dd += d[k] * d[k]; }
    const s = tt ? dt / tt : 0;
    let r = 0; for (let k = 0; k < d.length; k++) r += (d[k] - s * T[k]) ** 2;
    return { scale: s, resid: dd ? Math.sqrt(r / dd) : 0 };
  };
  return { line: fit(L), cycle: fit(C) };
}

function decideOne(raw, S) {
  const n = S.items.length;
  const D = sym(raw, n);
  const asym = asymmetry(raw, n);
  const gate = G.metricGate(D, n);
  /* how much of the gate fails, not merely whether */
  let bad = 0, tot = 0, dmax = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmax = Math.max(dmax, D[i][j]);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    if (i === j || j === k || i === k) continue;
    tot++; if (D[i][j] + D[j][k] - D[i][k] < 0) bad++;
  }
  gate.badTriples = bad; gate.totTriples = tot;
  gate.relSlack = dmax ? Math.abs(gate.worstSlack || 0) / dmax : 0;
  const out = { asym, gate, D };
  const B = G.gram(D, n);
  out.signature = G.signature(B, n);
  out.spectrum = G.spectrumOf(B, n);
  out.hyp = G.hyperbolicity(D, n);
  out.pts = G.coords2D(B, n);
  out.mst = G.mst(D, n);
  if (S.order) out.closure = G.closure(D, n);
  /* how flat is it, in the units the model chose: the largest distance it can
     draw in two dimensions against the largest it claimed */
  if (S.order) out.fits = shapeFits(D, n);
  /* the flattest thing a table can be: every distance the same. A near-constant
     table is a metric for free, so this ratio says whether passing the gate
     means anything. */
  let dmin = Infinity;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmin = Math.min(dmin, D[i][j]);
  out.contrast = dmin > 0 ? dmax / dmin : Infinity;
  out.dmax = dmax;
  out.spread = dmax / (2 * P.scale);                        // 1.0 = uses the whole scale
  return out;
}

/* ---- across models ------------------------------------------------------ */
function crossTable(recs, n) {                              // per pair, max−min over models
  const live = recs.filter(Boolean);
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    if (i === j) continue;
    const v = live.map(r => r.D[i][j]);
    M[i][j] = Math.max(...v) - Math.min(...v);
  }
  return M;
}

function corr(a, b, n) {                                    // Pearson over the off-diagonal
  const xs = [], ys = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { xs.push(a.D[i][j]); ys.push(b.D[i][j]); }
  const mx = xs.reduce((s, x) => s + x, 0) / xs.length, my = ys.reduce((s, y) => s + y, 0) / ys.length;
  let sxy = 0, sxx = 0, syy = 0;
  for (let k = 0; k < xs.length; k++) { const u = xs[k] - mx, v = ys[k] - my; sxy += u * v; sxx += u * u; syy += v * v; }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
}

/* residual after the freedoms a distance matrix genuinely leaves free */
function shapeGap(a, b) {
  if (!a.pts || !b.pts) return null;
  const A = align(a.pts, b.pts), n = A.length;
  const cy = b.pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
  const B = b.pts.map(p => [p[0] - cy[0], p[1] - cy[1]]);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (A[i][0] - B[i][0]) ** 2 + (A[i][1] - B[i][1]) ** 2; den += B[i][0] ** 2 + B[i][1] ** 2; }
  return den ? Math.sqrt(num / den) : null;
}

const out = { scale: P.scale, builtAt: P.builtAt, probedAt: P.builtAt, models: P.models, spend: P.spend || null, subjects: [] };

for (const S of P.subjects) {
  const n = S.items.length;
  const rec = { id: S.id, title: S.title, note: S.note, order: S.order, pair: S.pair, items: S.items, n, byModel: {} };
  for (const M of P.models) {
    const src = S.byModel[M.id];
    if (!src) continue;
    rec.byModel[M.id] = Object.assign({ n, items: S.items, order: S.order, secs: src.secs, raw: src.raw }, decideOne(src.raw, S));
  }
  const recs = P.models.map(M => rec.byModel[M.id]);
  rec.cross = crossTable(recs, n);
  rec.pairs = [];
  for (let a = 0; a < P.models.length; a++) for (let b = a + 1; b < P.models.length; b++) {
    if (!recs[a] || !recs[b]) continue;
    rec.pairs.push({ a: P.models[a].id, b: P.models[b].id, r: corr(recs[a], recs[b], n), gap: shapeGap(recs[a], recs[b]) });
  }
  out.subjects.push(rec);
}

fs.writeFileSync(path.join(__dirname, 'out', 'geometry.json'), JSON.stringify(out));

/* ---- what happened ------------------------------------------------------ */
const pad = (s, k) => String(s).padEnd(k);
console.log(pad('subject', 12) + P.models.map(m => pad(m.label, 34)).join(''));
for (const S of out.subjects) {
  const cells = P.models.map(M => {
    const r = S.byModel[M.id];
    if (!r) return pad('—', 30);
    return pad((r.gate.ok ? 'metric ' : `${r.gate.badTriples}/${r.gate.totTriples} `)
      + `rk${r.spectrum.effRank} neg${(100 * r.spectrum.negMass).toFixed(0)}%`
      + (r.fits ? ` L${(100 * r.fits.line.resid).toFixed(0)}/C${(100 * r.fits.cycle.resid).toFixed(0)}` : '')
      + ` x${r.contrast === Infinity ? '∞' : r.contrast.toFixed(1)}`, 34);
  });
  console.log(pad(S.id, 12) + cells.join(''));
}
console.log('\npairwise agreement (Pearson over pair distances / shape gap after Procrustes):');
for (const S of out.subjects) console.log('  ' + pad(S.id, 11) + S.pairs.map(p =>
  `${p.a.split('-')[1][0].toUpperCase()}${p.b.split('-')[1][0].toUpperCase()} r=${p.r.toFixed(2)}${p.gap === null ? '' : ` gap=${(100 * p.gap).toFixed(0)}%`}`).join('   '));
console.log('\nwritten out/geometry.json');
