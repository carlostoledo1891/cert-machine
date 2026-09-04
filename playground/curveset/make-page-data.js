/* make-page-data.js — the science half. Fits what the practitioner would fit,
   prices each assumption, and writes out/page.json for the drawing half.
   node experiments/curveset/make-page-data.js
   The ENVELOPE is not baked: it is closed form and cheap, so the page computes
   it live from the same envelope.js this file tests against. */
'use strict';
const fs = require('fs');
const path = require('path');
const E = require('./envelope.js');
const DATA = require('./data.js');

/* ---- the curve a practitioner would report ------------------------------ */
const evalForm = (F, x) => F.form === 'poly'
  ? F.c.reduce((t, c, k) => t + c * Math.pow(x, k), 0)
  : F.p[1] + (F.p[0] - F.p[1]) / (1 + Math.pow(x / F.p[2], F.p[3]));       // 4PL

function fit4PL(x, y, w) {
  const cost = p => x.reduce((t, xi, i) => {
    if (xi <= 0) return t;                       // 4PL is undefined at zero concentration
    return t + Math.pow((p[1] + (p[0] - p[1]) / (1 + Math.pow(xi / p[2], p[3])) - y[i]) / w[i], 2);
  }, 0);
  const y0 = Math.min(...y), y1 = Math.max(...y), mid = Math.sqrt(x[1] * x[x.length - 1]);
  let S = [[y0, y1 * 1.3, mid, 1.0], [y0 * 0.8, y1 * 1.6, mid * 1.5, 1.3],
  [y0 * 1.2, y1 * 1.2, mid * 0.7, 0.8], [y0, y1 * 2.0, mid * 2, 1.1], [y0 * 0.5, y1 * 1.1, mid * 0.5, 1.5]];
  for (let it = 0; it < 8000; it++) {
    S.sort((u, v) => cost(u) - cost(v));
    const c = [0, 1, 2, 3].map(k => S.slice(0, 4).reduce((t, p) => t + p[k] / 4, 0));
    const w2 = S[4], r = c.map((v, k) => v + (v - w2[k]));
    if (cost(r) < cost(S[0])) { const e = c.map((v, k) => v + 2 * (v - w2[k])); S[4] = cost(e) < cost(r) ? e : r; }
    else if (cost(r) < cost(S[3])) S[4] = r;
    else { const cc = c.map((v, k) => v + 0.5 * (w2[k] - v)); S[4] = cost(cc) < cost(w2) ? cc : S[0].map((v, k) => v + 0.5 * (w2[k] - v)); }
  }
  S.sort((u, v) => cost(u) - cost(v));
  return S[0];
}

const invert = (F, y, lo, hi) => {
  let a = lo, b = hi;
  const up = evalForm(F, hi) > evalForm(F, lo);
  for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if ((evalForm(F, m) < y) === up) a = m; else b = m; }
  return (a + b) / 2;
};

/* ---- build ------------------------------------------------------------- */
const K = 2;                                            // coverage on the error budget
const out = { builtAt: new Date().toISOString(), k: K, sets: [] };

for (const d of DATA.all()) {
  const errs = d.errKind === 'measured' ? d.err(K) : d.err(K, d.cv, d.floor);
  /* the coordinate the smoothness claim is made in. A monotone reparameterisation
     changes no admissible curve — monotone is monotone in any of them — so the
     monotone-only answer is identical either way, and only the slope claim moves. */
  const LOG = d.xScale === 'log';
  const fwd = (x) => LOG ? Math.log10(x) : x;
  const bwd = (u) => LOG ? Math.pow(10, u) : u;
  const keep = d.x.map((x, i) => i).filter(i => !LOG || d.x[i] > 0);
  const C = E.prepare(keep.map(i => fwd(d.x[i])), keep.map(i => d.y[i]), keep.map(i => errs[i]), d.sense);
  const sec = E.secantBand(C);

  /* the reported curve */
  let F, residSD;
  if (d.id === 'pontius') {
    F = { form: 'poly', c: [0.673565789473684e-03, 0.732059160401003e-06, -0.316081871345029e-14] };
    residSD = d.reported.residSD;
  } else {
    const w = errs.map(e => e / K);
    const p = fit4PL(d.x, d.y, w);
    F = { form: '4pl', p };
    const res = d.x.map((xi, i) => xi <= 0 ? 0 : evalForm(F, xi) - d.y[i]).filter((_, i) => d.x[i] > 0);
    residSD = Math.sqrt(res.reduce((t, r) => t + r * r, 0) / (res.length - 4));
  }
  const span = [Math.min(...d.x), Math.max(...d.x)];
  const xHat = invert(F, d.ask, span[0] + 1e-9, span[1]);
  const h = (span[1] - span[0]) * 1e-5;
  const slope = Math.abs((evalForm(F, xHat + h) - evalForm(F, xHat - h)) / (2 * h));
  const uFit = K * residSD / slope;                     // reported half-width, k=2

  /* the price of each assumption, on one shared scale. The dial is a LOCAL
     smoothness claim — how far the response may wander from the straight line
     between two adjacent standards — because a global slope band says nothing
     about a curve that genuinely bends. t = 0 is linear interpolation, which is
     what a laboratory reading the plate by hand produces; the parametric fit
     sits past the end of the dial, and the gap between them is what the
     functional form is buying. */
  const rungs = [];
  {
    const r0 = E.readBack(C, d.ask, 0, Infinity);
    rungs.push({
      tol: null, kind: 'monotone',
      r: r0 ? { lo: bwd(r0.lo), hi: bwd(r0.hi), width: bwd(r0.hi) - bwd(r0.lo), bounded: r0.bounded } : null,
    });
  }
  for (const tol of [2, 1, 0.5, 0.25, 0.1, 0.05, 0.02, 0]) {
    const r = E.readBackLocal(C, d.ask, tol);
    rungs.push({
      tol, kind: tol === 0 ? 'interpolate' : 'local',
      r: r && r.bounded ? { lo: bwd(r.lo), hi: bwd(r.hi), width: bwd(r.hi) - bwd(r.lo), bounded: true } : null,
    });
  }

  out.sets.push({
    id: d.id, title: d.title, source: d.source,
    xName: d.xName, xUnit: d.xUnit, yName: d.yName, yUnit: d.yUnit, sense: d.sense, xScale: d.xScale,
    x: d.x, y: d.y, reps: d.reps, errs,
    errKind: d.errKind, sPooled: d.sPooled || null, cv: d.cv || null, floor: d.floor || null,
    secant: { lo: sec.lo, hi: sec.hi },
    reported: { kind: d.reported.kind, note: d.reported.note, form: F, residSD, xHat, uFit },
    ask: d.ask, askLabel: d.askLabel,
    rungs,
  });
}

fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'out', 'page.json'), JSON.stringify(out));

/* ---- what happened ----------------------------------------------------- */
const fmt = (v, u) => (Math.abs(v) >= 1e4 ? v.toFixed(0) : v.toPrecision(4)) + (u ? ' ' + u : '');
for (const s of out.sets) {
  console.log(`\n=== ${s.id} — ${s.title}`);
  console.log(`  ${s.x.length} standards, ladder ${fmt(s.x[1] - s.x[0], s.xUnit)} … ${fmt(s.x[s.x.length - 1] - s.x[s.x.length - 2], s.xUnit)}`);
  console.log(`  error budget: ${s.errKind}${s.errKind === 'measured' ? ` (pooled s = ${s.sPooled.toExponential(3)})` : ` (stated CV ${(100 * s.cv).toFixed(0)}%, floor ${s.floor})`}, k = ${K}`);
  console.log(`  ${s.askLabel} ${s.ask}`);
  console.log(`    reported (${s.reported.kind}):  ${fmt(s.reported.xHat, s.xUnit)}  ±${fmt(s.reported.uFit, '')}`);
  for (const g of s.rungs) {
    if (!g.r) { console.log(`    tol ${String(g.tol)}: no admissible curve`); continue; }
    const lbl = g.kind === 'monotone' ? 'monotone only         '
      : g.kind === 'interpolate' ? 'join the dots (t = 0) '
        : `wander up to ±${(100 * g.tol).toFixed(0).padStart(3)}%   `;
    console.log(`    ${lbl}  ${g.r.bounded ? fmt(g.r.lo, '') + ' – ' + fmt(g.r.hi, '') + '   width ' + fmt(g.r.width, s.xUnit) + '   ' + (g.r.width / (2 * s.reported.uFit)).toFixed(1) + '× the reported ±' : 'unbounded'}`);
  }
}
console.log('\nwritten out/page.json');
