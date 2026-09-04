/* decide-mood.js — what six moods did to two geometries.
   node experiments/neural-geometry/decide-mood.js
 *
 * Same treatment as decide.js: both directions summed into an integer table, the
 * metric gate reported rather than enforced, the Gram matrix and its signature in
 * exact rationals, and line/cycle as one-parameter fits.
 *
 * On top of that, three statistics about the effect of a mood. Two of them are
 * computed on the integer tables and never touch an embedding, because an
 * embedding has freedoms (rotation, reflection, scale) that an effect could hide
 * inside:
 *
 *   SWELL      mean distance under the mood over mean distance under neutral.
 *              Does an emotional register push everything further apart?
 *   SALIENCE   for the mood's own feeling — the one word in the set nearest to
 *              how the questioner sounds — the change in its mean distance to
 *              everything else. Positive means the mood made its own feeling
 *              more distinct from the rest. Nothing in any prompt names it.
 *   SHAPE GAP  the residual after Procrustes, which is the only part that needs
 *              the embedding, and which is exactly the part rotation, reflection
 *              and scale cannot explain away.
 *
 * And one cross-validation. The affect plane is recovered from 132 pairwise
 * questions that never mention pleasantness or activation; the two scalar axes
 * come from 24 single-item questions that never mention another feeling or a
 * distance. Aligning one to the other is a check neither question set could have
 * passed alone.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const G = require('../exact-geometry/decide.js');
const { align } = require('./plate.js');

const P = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'mood.json'), 'utf8'));
const NEUTRAL = 'neutral';

const sym = (raw, n) => Array.from({ length: n }, (_, i) =>
  Array.from({ length: n }, (_, j) => (i === j ? 0 : raw[i][j] + raw[j][i])));

function shapeFits(D, n) {
  const L = [], C = [], d = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const g = j - i; L.push(g); C.push(Math.min(g, n - g)); d.push(D[i][j]);
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

const meanOff = (D, n) => { let s = 0, c = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) { s += D[i][j]; c++; } return s / c; };
const meanRow = (D, n, i) => { let s = 0; for (let j = 0; j < n; j++) if (j !== i) s += D[i][j]; return s / (n - 1); };

function decideOne(raw, order) {
  const n = raw.length, D = sym(raw, n);
  let mx = 0, mn = Infinity, asym = 0, apairs = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    mx = Math.max(mx, D[i][j]); mn = Math.min(mn, D[i][j]);
    asym += Math.abs(raw[i][j] - raw[j][i]); apairs++;
  }
  const gate = G.metricGate(D, n);
  let bad = 0, tot = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
    if (i === j || j === k || i === k) continue;
    tot++; if (D[i][j] + D[j][k] - D[i][k] < 0) bad++;
  }
  const B = G.gram(D, n);
  return {
    n, D, raw,
    gate: { ok: gate.ok, badTriples: bad, totTriples: tot, worstSlack: gate.worstSlack, relSlack: mx ? Math.abs(gate.worstSlack || 0) / mx : 0 },
    signature: G.signature(B, n), spectrum: G.spectrumOf(B, n), hyp: G.hyperbolicity(D, n),
    pts: G.coords2D(B, n), mst: G.mst(D, n),
    fits: order ? shapeFits(D, n) : null,
    closure: order ? G.closure(D, n) : null,
    contrast: mn > 0 ? mx / mn : Infinity,
    asym: { rel: asym / (apairs * meanOff(D, n) / 2) },
    mean: meanOff(D, n), dmax: mx,
  };
}

/* Procrustes residual and the per-item displacement it leaves behind */
function deform(mood, base) {
  const A = align(mood.pts, base.pts), n = A.length;
  const c = base.pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
  const B = base.pts.map(p => [p[0] - c[0], p[1] - c[1]]);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (A[i][0] - B[i][0]) ** 2 + (A[i][1] - B[i][1]) ** 2; den += B[i][0] ** 2 + B[i][1] ** 2; }
  return { from: B, to: A, gap: den ? Math.sqrt(num / den) : null };
}

/* does the angular order of the embedded points reproduce the order they were
   written in — up to the rotation and reflection a circle cannot fix */
function cyclicOrder(pts) {
  const n = pts.length;
  const byAngle = pts.map((p, i) => [Math.atan2(p[1], p[0]), i]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  let best = { wrong: n, shift: 0, flip: false };
  for (const flip of [false, true]) {
    const seq = flip ? byAngle.slice().reverse() : byAngle;
    for (let s = 0; s < n; s++) {
      let wrong = 0;
      for (let k = 0; k < n; k++) if (seq[(s + k) % n] !== k) wrong++;
      if (wrong < best.wrong) best = { wrong, shift: s, flip };
    }
  }
  return { outOfPlace: best.wrong, n, exact: best.wrong === 0, reflected: best.flip };
}

/* Put every map in one readable frame. Rotation and reflection are exactly the
   freedoms a table of distances does not fix, so spending them costs nothing and
   buys a picture three models can be compared in: pleasantness to the right,
   activation upward. The DIRECTIONS come from the scalar answers, which the
   pairwise questions never saw — so where a point lands is still entirely the
   pairwise table's doing; only which way is up came from elsewhere. */
function orient(pts, pleasant, activated) {
  const n = pts.length;
  const c = pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
  const B = pts.map(p => [p[0] - c[0], p[1] - c[1]]);
  const z = (v) => { const m = v.reduce((s, x) => s + x, 0) / n; return v.map(x => x - m); };
  const dir = (w) => { let x = 0, y = 0; for (let i = 0; i < n; i++) { x += w[i] * B[i][0]; y += w[i] * B[i][1]; } return [x, y]; };
  const vp = dir(z(pleasant));
  const th = -Math.atan2(vp[1], vp[0]), ct = Math.cos(th), st = Math.sin(th);
  const R = B.map(p => [ct * p[0] - st * p[1], st * p[0] + ct * p[1]]);
  const va = (() => { let y = 0; const w = z(activated); for (let i = 0; i < n; i++) y += w[i] * R[i][1]; return y; })();
  return va < 0 ? R.map(p => [p[0], -p[1]]) : R;
}

/* the two scalar axes as a plane, aligned to the pairwise plane */
function crossValidate(pts, pleasant, activated) {
  const n = pts.length;
  const z = (v) => { const m = v.reduce((s, x) => s + x, 0) / n; const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / n) || 1; return v.map(x => (x - m) / sd); };
  const S = z(pleasant).map((p, i) => [p, z(activated)[i]]);
  const A = align(S, pts);
  const c = pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]);
  const B = pts.map(p => [p[0] - c[0], p[1] - c[1]]);
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (A[i][0] - B[i][0]) ** 2 + (A[i][1] - B[i][1]) ** 2; den += B[i][0] ** 2 + B[i][1] ** 2; }
  /* the direction pleasantness points in the pairwise plane, read off the fit */
  const ang = (() => {
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { const w = z(pleasant)[i]; sx += w * B[i][0]; sy += w * B[i][1]; }
    return Math.atan2(sy, sx) * 180 / Math.PI;
  })();
  const corr = (u, v) => { const mu = u.reduce((s, x) => s + x, 0) / n, mv = v.reduce((s, x) => s + x, 0) / n;
    let a = 0, b = 0, c2 = 0; for (let i = 0; i < n; i++) { const p = u[i] - mu, q = v[i] - mv; a += p * q; b += p * p; c2 += q * q; }
    return b && c2 ? a / Math.sqrt(b * c2) : 0; };
  return { resid: den ? Math.sqrt(num / den) : null, valenceAngle: ang,
    rx: corr(A.map(p => p[0]), B.map(p => p[0])), ry: corr(A.map(p => p[1]), B.map(p => p[1])),
    aligned: A, base: B };
}

/* ---- run ---------------------------------------------------------------- */
const out = { scale: P.scale, builtAt: P.builtAt, models: P.models, moods: P.moods,
  subjects: P.subjects, affect: P.affect, scalars: P.scalars, spend: P.spend, cells: {}, ladder: null };

for (const S of P.subjects) {
  for (const M of P.models) for (const mo of P.moods) {
    const raw = P.cells[`${mo.id}|${S.id}|${M.id}`];
    if (!raw) continue;
    out.cells[`${mo.id}|${S.id}|${M.id}`] = decideOne(raw, S.order);
  }
}
if (P.ladder && Object.keys(P.ladder.byModel).length) {
  out.ladder = { id: P.ladder.id, title: P.ladder.title, note: P.ladder.note, items: P.ladder.items, order: true, byModel: {} };
  for (const M of P.models) if (P.ladder.byModel[M.id]) out.ladder.byModel[M.id] = decideOne(P.ladder.byModel[M.id], true);
}

/* effects, always against the same model's own neutral run */
out.effects = {};
for (const S of P.subjects) for (const M of P.models) {
  const base = out.cells[`${NEUTRAL}|${S.id}|${M.id}`];
  if (!base) continue;
  for (const mo of P.moods) {
    const cell = out.cells[`${mo.id}|${S.id}|${M.id}`];
    if (!cell) continue;
    const d = deform(cell, base);
    const t = mo.near ? S.items.indexOf(mo.near) : -1;
    out.effects[`${mo.id}|${S.id}|${M.id}`] = {
      swell: cell.mean / base.mean,
      gap: d.gap, from: d.from, to: d.to,
      salience: t >= 0 ? (meanRow(cell.D, cell.n, t) / cell.mean) - (meanRow(base.D, base.n, t) / base.mean) : null,
      dCycle: cell.fits && base.fits ? cell.fits.cycle.resid - base.fits.cycle.resid : null,
      dNeg: cell.spectrum.negMass - base.spectrum.negMass,
    };
  }
}

/* the circumplex checks, affect only */
out.circumplex = {};
for (const M of P.models) for (const mo of P.moods) {
  const cell = out.cells[`${mo.id}|affect|${M.id}`];
  const pl = P.ratings[`${mo.id}|pleasant|${M.id}`], ac = P.ratings[`${mo.id}|activated|${M.id}`];
  if (!cell || !pl || !ac) continue;
  /* Measured BEFORE orienting, in the frame coords2D produced, whose x-axis is
     the leading principal axis of the table. After orienting it is zero by
     construction, so it has to be taken here or not at all. */
  const leadingAxisAngle = crossValidate(cell.pts, pl, ac).valenceAngle;
  const oriented = orient(cell.pts, pl, ac);
  cell.oriented = oriented;
  out.circumplex[`${mo.id}|${M.id}`] = Object.assign(
    { order: cyclicOrder(cell.pts), pleasant: pl, activated: ac, oriented, leadingAxisAngle },
    crossValidate(oriented, pl, ac));
}

/* THE NOISE FLOOR, without which none of the above means anything.
   How far does a geometry move between two runs of the SAME condition? The
   previous page's neutral clock is exactly that: same model, same twelve hours,
   same question, an independent session on another day. A mood effect smaller
   than this is not an effect. */
const PREV = path.join(__dirname, 'out', 'geometry.json');
out.floor = {};
if (fs.existsSync(PREV)) {
  const prev = JSON.parse(fs.readFileSync(PREV, 'utf8'));
  const pc = prev.subjects.find(s => s.id === 'clock');
  if (pc) for (const M of P.models) {
    const a = pc.byModel[M.id], b = out.cells[`${NEUTRAL}|clock|${M.id}`];
    if (a && b) out.floor[M.id] = deform({ pts: a.pts }, { pts: b.pts }).gap;
  }
}
/* is a mood's effect on its own feeling special, or is it what happens to every
   feeling? The other eleven are the within-condition null. */
out.salience = {};
for (const M of P.models) for (const mo of P.moods) {
  if (!mo.near) continue;
  const c = out.cells[`${mo.id}|affect|${M.id}`], b = out.cells[`${NEUTRAL}|affect|${M.id}`];
  if (!c || !b) continue;
  const n = c.n, items = P.subjects.find(s => s.id === 'affect').items;
  const d = items.map((_, i) => meanRow(c.D, n, i) / c.mean - meanRow(b.D, n, i) / b.mean);
  const t = items.indexOf(mo.near);
  const mu = d.reduce((s2, v) => s2 + v, 0) / n;
  const sd = Math.sqrt(d.reduce((s2, v) => s2 + (v - mu) ** 2, 0) / n) || 1;
  const rank = d.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]).findIndex(pr => pr[1] === t) + 1;
  out.salience[`${mo.id}|${M.id}`] = { all: d, z: (d[t] - mu) / sd, rank, n, item: mo.near, value: d[t] };
}

fs.writeFileSync(path.join(__dirname, 'out', 'mood-geometry.json'), JSON.stringify(out));

/* ---- what happened ------------------------------------------------------ */
const pad = (s, k) => String(s).padEnd(k);
const pc = (x, d = 0) => `${(100 * x).toFixed(d)}%`;
for (const S of P.subjects) {
  console.log(`\n=== ${S.id} (${S.kind}) — cycle residual, and what each mood did ===`);
  console.log(pad('', 14) + P.moods.map(m => pad(m.id, 12)).join(''));
  for (const M of P.models) {
    console.log(pad(M.label, 14) + P.moods.map(mo => {
      const c = out.cells[`${mo.id}|${S.id}|${M.id}`], e = out.effects[`${mo.id}|${S.id}|${M.id}`];
      return pad(c ? `${pc(c.fits.cycle.resid)}${mo.id === NEUTRAL ? '' : `/${pc(e.gap)}`}` : '—', 12);
    }).join(''));
  }
  console.log(pad('swell', 14) + P.moods.map(mo => pad(P.models.map(M => (out.effects[`${mo.id}|${S.id}|${M.id}`] || {}).swell)
    .filter(x => x).reduce((t, x, _, a) => t + x / a.length, 0).toFixed(3) + '×', 12)).join(''));
}
console.log('\n=== circumplex: does the affect plane agree with the two scalar axes ===');
console.log(pad('', 14) + P.moods.map(m => pad(m.id, 12)).join(''));
for (const M of P.models) console.log(pad(M.label, 14) + P.moods.map(mo => {
  const c = out.circumplex[`${mo.id}|${M.id}`];
  return pad(c ? `${pc(c.resid)} ${c.order.outOfPlace}/${c.order.n}` : '—', 12);
}).join(''));
console.log('\n=== the noise floor: same question, same model, two independent sessions ===');
console.log('  ' + P.models.map(M => `${M.label} ${out.floor[M.id] !== undefined ? pc(out.floor[M.id], 1) : 'n/a'}`).join('   '));
console.log('  a mood effect below this is not an effect:');
for (const S of P.subjects) console.log('    ' + pad(S.id, 8) + P.models.map(M => {
  const v = P.moods.filter(m => m.prefix).map(mo => out.effects[`${mo.id}|${S.id}|${M.id}`].gap);
  const mean = v.reduce((t, x) => t + x, 0) / v.length, f = out.floor[M.id];
  return pad(`${M.short} ${pc(mean, 1)} vs ${f === undefined ? '?' : pc(f, 1)} ${f !== undefined && mean > 2.5 * f ? 'REAL' : 'noise'}`, 24);
}).join(''));
console.log('\n=== salience: did a mood single out its own feeling, against the other eleven ===');
for (const mo of P.moods.filter(m => m.near)) console.log('  ' + pad(`${mo.id} (${mo.near})`, 20)
  + P.models.map(M => { const s2 = out.salience[`${mo.id}|${M.id}`];
    return pad(s2 ? `${M.short} rank ${s2.rank}/${s2.n} z=${s2.z.toFixed(1)}` : '—', 22); }).join(''));
if (out.ladder) console.log('\nladder: ' + P.models.map(M => `${M.short} line ${pc(out.ladder.byModel[M.id].fits.line.resid)} / cycle ${pc(out.ladder.byModel[M.id].fits.cycle.resid)}`).join('   '));
console.log('\nwritten out/mood-geometry.json');
