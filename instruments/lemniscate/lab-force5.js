/* ERDOS-1038 item 3 — lab-force5: the FORCING LEG under the corrected composition rule.

   Composition (s9 re-derivation, see CHASE.md "COMPOSITION RULE"): with a₀ = inf of the
   positive component containing (−√2, 0), Case B (a₀ ∈ (−T, −√2]) counts
        |E| ≥ (−a₀) + R(a₀) + (M − T)
   because the TAIL sweep's images are disjoint from (a₀, 0) and can be counted in Case B
   too.  So the forcing family at a₀ only needs a b-range of length R(a₀) ≥ T + a₀ (the
   long-interval SHORTFALL), not M + a₀ (mendozalab/Hua Xu use cap ≥ upper bound).
   Price: the forcing images must avoid the tail images.

   At a₀ → −T the requirement is R → 0: a single positive dual  ν = δ_{a₀} + Σ w_p δ_p
   with U_ν > 0 on {−1} ∪ [0,1], atoms p outside the known-positive region (a₀, 0) and
   (for the deep regime) outside the tail images.  This lab measures that limit:
   mode "fixed":  max-min LP over atom positions on a grid (cutting planes close it),
                  reporting margin(a₀) and the optimal support.
   mode "lanes":  given anchors + directions, check the moving family for b ∈ [0, R].
   Usage:  node lab-force5.js fixed  [a0 list]  [avoid=tail|none]
           node lab-force5.js lanes  a0 R  s1:±1,s2:±1,...            */
'use strict';
const path = require('path');
const { solveMaxMin } = require(path.join(__dirname, 'lp.js'));

const mode = process.argv[2] || 'fixed';
module.exports = { U, minS, forcingLP, support };

// tail images to avoid (K1 n6 at T′ = 1.77 from data/sweep3-T1.77.json, widened by 2e-3)
// override with env TAIL="l1-h1,l2-h2,..."
const TAIL_IMAGES = process.env.TAIL ? process.env.TAIL.split(',').map(s => s.split('-').map(Number)) : [[0.0001, 0.0514], [0.733, 1.0235]];
function inTail(p, pad = 2e-3) { return TAIL_IMAGES.some(([l, h]) => p > l - pad && p < h + pad); }

function U(a0, P, w, x) {
  let v = -Math.log(Math.abs(x - a0));
  for (let i = 0; i < P.length; i++) if (w[i] > 0) v -= w[i] * Math.log(Math.abs(x - P[i]));
  return v;
}
// minimum of U over S = {−1} ∪ [0,1]: grid + golden polish in every cell holding a local min
function minS(a0, P, w, NG) {
  const f = x => U(a0, P, w, x);
  let best = f(-1), bx = -1;
  const h = 1 / NG, vals = new Float64Array(NG + 1);
  for (let i = 0; i <= NG; i++) vals[i] = f(i * h);
  const g = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i <= NG; i++) {
    const isMin = (i === 0 || vals[i] <= vals[i - 1]) && (i === NG || vals[i] <= vals[i + 1]);
    if (!isMin) continue;
    let l = Math.max(0, (i - 1) * h), r = Math.min(1, (i + 1) * h);
    let x1 = r - g * (r - l), x2 = l + g * (r - l), f1 = f(x1), f2 = f(x2);
    for (let it = 0; it < 50; it++) {
      if (f1 < f2) { r = x2; x2 = x1; f2 = f1; x1 = r - g * (r - l); f1 = f(x1); }
      else { l = x1; x1 = x2; f1 = f2; x2 = l + g * (r - l); f2 = f(x2); }
    }
    const xc = (l + r) / 2, vc = Math.min(f(xc), vals[i], f1, f2);
    if (vc < best) { best = vc; bx = vc === vals[i] ? i * h : xc; }
  }
  return { m: best, x: bx };
}
// max-min LP over positions P, closed by cutting planes on S
function forcingLP(a0, P, opts = {}) {
  const NX = opts.NX || 200, rounds = opts.rounds || 200;
  const pts = [-1];
  const near = x => P.some(p => Math.abs(x - p) < 1e-6);
  for (let i = 0; i <= NX; i++) { const x = (i + 0.37) / (NX + 0.37); if (!near(x)) pts.push(x); }
  for (const x of [0, 1]) { if (!near(x)) pts.push(x); else pts.push(x === 0 ? 1e-6 : 1 - 1e-6); }
  const row = x => P.map(p => -Math.log(Math.abs(x - p)));
  const G = pts.map(row), g0 = pts.map(x => -Math.log(Math.abs(x - a0)));
  for (const e of opts.extraRows || []) { G.push(e.row); g0.push(e.g0); }   // static side constraints (cert-force.js)
  let r = solveMaxMin(G, g0), cert = -Infinity, wBest = null, tLP = r.t;
  for (let k = 0; k < rounds; k++) {
    if (!r.w) break;
    const dip = minS(a0, P, r.w, 4000);
    if (dip.m > cert) { cert = dip.m; wBest = r.w.slice(); }
    tLP = r.t;
    if (dip.m >= r.t - 1e-9) break;
    // a dip AT a zero-weight candidate (U finite there): constrain both nudged neighbours instead of the pole
    const xs = near(dip.x) ? [Math.max(0, dip.x - 1e-6), Math.min(1, dip.x + 1e-6)].filter(x => !near(x)) : [dip.x];
    for (const x of xs) { G.push(row(x)); g0.push(-Math.log(Math.abs(x - a0))); }
    r = solveMaxMin(G, g0);
  }
  return { cert, tLP, w: wBest };
}
function support(P, w, tol = 1e-9) {
  const out = [];
  for (let i = 0; i < P.length; i++) if (w[i] > tol) out.push([P[i], w[i]]);
  return out;
}

if (require.main !== module) { /* used as a module by cert-force.js */ } else if (mode === 'fixed') {
  const a0s = (process.argv[3] || '-1.77,-1.78,-1.79,-1.80,-1.81,-1.82,-1.83').split(',').map(Number);
  const avoid = (process.argv[4] || 'tail');
  const step = Number(process.argv[5] || 0.005), pmax = Number(process.argv[6] || 1.3);
  const P = [];
  for (let p = 0; p <= pmax + 1e-12; p += step) {
    const q = Math.round(p * 1e6) / 1e6;
    if (avoid === 'tail' && inTail(q)) continue;
    if (Math.abs(q - 1) < 1e-3) continue; // a pole exactly on the boundary point 1 of S defeats the sampled LP (dips → 1⁻); 0.995 is as good
    P.push(q);
  }
  console.log(`fixed-atom forcing LP: |P| = ${P.length} positions in [0, ${pmax}] step ${step}, avoid = ${avoid}`);
  for (const a0 of a0s) {
    const t0 = Date.now();
    const r = forcingLP(a0, P);
    const sup = support(P, r.w);
    const v = minS(a0, P, r.w, 40000);
    console.log(`a0 = ${a0.toFixed(4)}  margin = ${v.m.toExponential(3)} (LP t ${r.tLP.toExponential(3)}) at x = ${v.x.toFixed(5)}  U(-1) = ${U(a0, P, r.w, -1).toExponential(3)}  support: ${sup.map(([p, w]) => `${p.toFixed(3)}:${w.toFixed(4)}`).join(' ')}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);
  }
} else if (mode === 'sweep') {
  // PURE-FORCING proxy: cap given; for each a0 the heavy lane sits at b = cap − |a0| (worst displacement),
  // the other atoms are free on a grid in [b + gap, pmax] (positions re-chosen per (a0,b) — a proxy for
  // per-a0 anchors s_i − b).  Prints m*(a0, b) and the LP support.  Usage: sweep cap a0list [step] [pmax] [gap]
  const cap = Number(process.argv[3]);
  const a0s = process.argv[4].split(',').map(Number);
  const step = Number(process.argv[5] || 0.005), pmax = Number(process.argv[6] || 1.3), gap = Number(process.argv[7] || 0.01);
  for (const a0 of a0s) {
    const R = cap - Math.abs(a0);
    if (R < 0) { console.log(`a0 = ${a0}: below −cap, Case A`); continue; }
    const t0 = Date.now();
    let worst = { m: Infinity };
    const bs = (process.env.BS || '1,0.5').split(',').map(Number).map(f => f * R);
    for (const b of bs) {
      const P = [b];
      for (let p = b + gap; p <= pmax + 1e-12; p += step) { const q = Math.round(p * 1e6) / 1e6; if (Math.abs(q - 1) < 1e-3) continue; P.push(q); }
      if (process.env.LEFT) { const [l, h, st] = process.env.LEFT.split(',').map(Number); for (let p = l; p <= h + 1e-12; p += st) if (p < a0 - 1e-3) P.push(Math.round(p * 1e6) / 1e6); } // candidates LEFT of a0
      const r = forcingLP(a0, P);
      const v = minS(a0, P, r.w, 40000);
      if (v.m < worst.m) worst = { m: v.m, b, x: v.x, sup: support(P, r.w) };
    }
    console.log(`cap ${cap}  a0 = ${a0.toFixed(4)}  R = ${R.toFixed(4)}  worst m* = ${worst.m.toExponential(3)} at b = ${worst.b.toFixed(4)}, x = ${worst.x.toFixed(5)}  support: ${worst.sup.map(([p, w]) => `${p.toFixed(4)}:${w.toFixed(3)}`).join(' ')}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);
  }
} else if (mode === 'comb') {
  // REALIZABLE lanes: heavy lane p₀(b) = b (image [0,R]) + a COMB of teeth s_j = hi − j·R, j = 0..k−1
  // (down to lo), all moving LEFT: p_j(b) = s_j − b.  Tooth images [s_j − R, s_j] tile [lo', hi] without
  // overlap, so the covering count is valid.  Weights re-solved per b (LP); reports min over b ∈ [0,R].
  // Usage: comb cap a0list [lo] [hi] [NB]
  const cap = Number(process.argv[3]);
  const a0s = process.argv[4].split(',').map(Number);
  const lo = Number(process.argv[5] || 0.6), hi = Number(process.argv[6] || 1.05), NB = Number(process.argv[7] || 20);
  for (const a0 of a0s) {
    const R = cap - Math.abs(a0);
    if (R <= 0) { console.log(`a0 = ${a0}: below −cap, Case A`); continue; }
    const t0 = Date.now();
    // the comb phase (hi mod R) is a free per-a₀ design parameter: env PHASES=n scans n phases over one period
    const NPH = Number(process.env.PHASES || 1);
    let best = null;
    for (let ph = 0; ph < NPH; ph++) {
      const hiP = hi + R * ph / NPH;
      const teeth = []; for (let sj = hiP; sj - R >= lo - 1e-12; sj -= R) teeth.push(sj);
      let worst = { m: Infinity };
      for (let i = 0; i <= NB; i++) {
        const b = R * i / NB;
        // a pole within 1e-3 of the boundary point 1 defeats the sampled LP; nudge that tooth just outside S
        // (float-grade measurement only — U → +∞ at an atom on the boundary, so the true family is fine there)
        const P = [b, ...teeth.map(sj => sj - b).map(p => Math.abs(p - 1) < 1e-3 ? 1 + 1e-3 : p)];
        const r = forcingLP(a0, P, { NX: 400 });
        const v = minS(a0, P, r.w, 40000);
        if (v.m < worst.m) worst = { m: v.m, b, x: v.x, sup: support(P, r.w) };
        if (best && worst.m < best.m) break; // this phase cannot win
      }
      if (!best || worst.m > best.m) best = { ...worst, hiP, nt: teeth.length, lo: teeth[teeth.length - 1] - R };
    }
    const worst = best;
    console.log(`cap ${cap}  a0 = ${a0.toFixed(4)}  R = ${R.toFixed(4)}  teeth ${worst.nt} on [${worst.lo.toFixed(3)}, ${worst.hiP.toFixed(4)}]  min over b: ${worst.m.toExponential(3)} at b = ${worst.b.toFixed(4)}, x = ${worst.x.toFixed(5)}  support@worst: ${worst.sup.map(([p, w]) => `${p.toFixed(4)}:${w.toFixed(3)}`).join(' ')}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);
  }
} else if (mode === 'comb2') {
  // two combs meeting at s*: LEFT comb teeth s* − jR (j ≥ 0) moving left (images tile (lo, s*]),
  // RIGHT comb teeth s* + jR (j ≥ 0) moving right (images tile [s*, hi)); heavy lane at b.
  // Usage: comb2 cap a0list [lo] [s*] [hi] [NB]
  const cap = Number(process.argv[3]);
  const a0s = process.argv[4].split(',').map(Number);
  const lo = Number(process.argv[5] || 0.6), sStar = Number(process.argv[6] || 0.99), hi = Number(process.argv[7] || 1.1), NB = Number(process.argv[8] || 20);
  for (const a0 of a0s) {
    const R = cap - Math.abs(a0);
    if (R <= 0) { console.log(`a0 = ${a0}: below −cap, Case A`); continue; }
    const left = [], right = [];
    for (let sj = sStar; sj - R >= lo - 1e-12; sj -= R) left.push(sj);
    for (let sj = sStar + R; sj + R <= hi + 1e-12; sj += R) right.push(sj); // first right tooth starts at s*+R? no — start at s* itself:
    right.unshift(sStar);
    const t0 = Date.now();
    let worst = { m: Infinity };
    for (let i = 0; i <= NB; i++) {
      const b = R * i / NB;
      let P = [b, ...left.map(sj => sj - b), ...right.map(sj => sj + b)];
      if (i === 0) P = P.filter((p, k) => P.indexOf(p) === k); // s* appears twice at b = 0
      P = P.map(p => Math.abs(p - 1) < 1e-3 ? 1 + 1e-3 : p);
      const r = forcingLP(a0, P, { NX: 400 });
      const v = minS(a0, P, r.w, 40000);
      if (v.m < worst.m) worst = { m: v.m, b, x: v.x, sup: support(P, r.w) };
    }
    console.log(`cap ${cap}  a0 = ${a0.toFixed(4)}  R = ${R.toFixed(4)}  L${left.length}/R${right.length} at s*=${sStar}  min over b: ${worst.m.toExponential(3)} at b = ${worst.b.toFixed(4)}, x = ${worst.x.toFixed(5)}  support@worst: ${worst.sup.map(([p, w]) => `${p.toFixed(4)}:${w.toFixed(3)}`).join(' ')}  [${((Date.now() - t0) / 1000).toFixed(1)}s]`);
  }
} else if (mode === 'lanes') {
  // moving family: atoms at s_i + dir_i·b, b ∈ [0, R]; weights re-solved per b (LP), report min margin over b
  const a0 = Number(process.argv[3]), R = Number(process.argv[4]);
  const lanes = process.argv[5].split(',').map(s => { const [p, d] = s.split(':').map(Number); return { s: p, dir: d }; });
  const NB = Number(process.argv[6] || 40);
  let worst = { m: Infinity };
  for (let i = 0; i <= NB; i++) {
    const b = R * i / NB;
    const P = lanes.map(L => L.s + L.dir * b);
    const r = forcingLP(a0, P, { NX: 400 });
    const v = minS(a0, P, r.w, 40000);
    if (v.m < worst.m) worst = { m: v.m, b, x: v.x, w: r.w.slice() };
  }
  // image intervals
  const imgs = lanes.map(L => L.dir > 0 ? [L.s, L.s + R] : [L.s - R, L.s]).sort((p, q) => p[0] - q[0]);
  let ok = true; for (let i = 1; i < imgs.length; i++) if (imgs[i][0] <= imgs[i - 1][1]) ok = false;
  const tailHit = imgs.some(([l, h]) => TAIL_IMAGES.some(([tl, th]) => l < th && h > tl));
  console.log(`a0 = ${a0}  R = ${R}  worst margin ${worst.m.toExponential(3)} at b = ${worst.b.toFixed(4)}, x = ${worst.x.toFixed(5)}  weights ${worst.w.map(w => w.toFixed(4)).join(',')}  images ${JSON.stringify(imgs.map(([l, h]) => [+l.toFixed(4), +h.toFixed(4)]))} disjoint ${ok} tail-overlap ${tailHit}`);
}
