/* fields.js — scenes of /grammar/: fields, images and physics. How to draw a field from a model, an image as the
   set of its fits, a shape from chords, an error budget and a calibration band, each from one of
   the instruments' own records, twice: as a default plotting call draws it, and in WARRANT.
   tools/grammar-scenes/ · cert-machine · 2026-10-30

   THE INTERFACE is tools/grammar-scenes/README.md; the drawing atoms are tools/build-grammar-gallery.js's. Every
   number is read at build from the record each scene names, and every sentence a caption states about it is a guard:
   its plain words are the scene's stop sentence. Six sources, read only:
     · navier-stokes   playground/navier-stokes/out/scene.json and the drawn core of playground/navier-stokes/field.js
     · interferometer  playground/interferometer/out/page-data.json (the fitted skies, 8-bit, 64 × 64)
     · occultation     instruments/occultation/out/page.json (the chords, the misses, the floor and ceiling)
     · stereo-reach    instruments/stereo/budget.js over instruments/interval/interval.js, on presets.js's literals
     · contours        kits/warrant-mpl/examples/data/contours-a20.json, which must carry certs/ecbench-ledger.json's digest
                       (drawn here, shown among the charts: tools/build-grammar.js takes it from `chartScenes`, 2026-10-30)
     · curveset        playground/curveset/out/page.json and playground/curveset/envelope.js
   Nothing here is red: no scene exhibits a counterexample to a claim about its own record.                        MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const GAL = require(path.join(ROOT, 'tools', 'build-grammar-gallery.js'));
const PL = require(path.join(ROOT, 'tools', 'build-grammar-plates.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));   /* a printed bound moves outward (WARRANT rule 8) */
const { PLAIN, PW, PH, TOP } = GAL;
const { line, t, mood, eyebrow, svg, head, sha, makeGuard } = GAL.atoms;
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/* ------------------------------------------------------------- atoms -- */
/* a coordinate to 0.1 px, with no trailing ".0": every path below is written through this */
const n1 = (v) => { const r = Math.round(v * 10) / 10; return String(r === 0 ? 0 : r); };
/* polylines to one path's d: after M, further pairs are implicit L */
const dOf = (lines, closed) => lines.filter((p) => p.length > 1).map((p) => 'M' + p.map(([x, y]) => n1(x) + ',' + n1(y)).join(' ') + (closed ? 'z' : '')).join('');
const pathEl = (d, a) => '    <path d="' + d + '" ' + a + '/>';
/* the guide pattern (an axis, a ruler): says nothing */
const GUIDE = 'stroke="var(--ink-4)" stroke-width="1" stroke-dasharray="' + G.GUIDE + '" fill="none"';
const hair = (tok) => 'stroke="var(' + (tok || '--rule-strong') + ')" stroke-width="1" fill="none"';
/* identity, never dash: weight and opacity from design/grammar.js's ladder */
const idA = (k) => ' stroke-opacity="' + G.IDENTITY[k].opacity + '"';

/* Ramer–Douglas–Peucker in screen units, so a path keeps every turn the eye can see and nothing finer */
function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  /* a closed loop has no chord to measure against: split it at the point farthest from its start */
  const [sx, sy] = pts[0], [ex, ey] = pts[pts.length - 1];
  if (Math.hypot(ex - sx, ey - sy) < 1e-9) {
    let far = 1, fd = -1;
    pts.forEach(([x, y], i) => { const d = Math.hypot(x - sx, y - sy); if (d > fd) { fd = d; far = i; } });
    if (fd < eps) return [pts[0], pts[pts.length - 1]];
    return simplify(pts.slice(0, far + 1), eps).concat(simplify(pts.slice(far), eps).slice(1));
  }
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    let worst = -1, at = -1;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L; if (d > worst) { worst = d; at = i; } }
    if (worst > eps) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/* MARCHING SQUARES, linked. The level set {g = lev} of a field on an nx × ny lattice, as polylines in lattice units
   (i, j). Each crossing is named by the lattice edge it sits on, so two cells that share an edge share the point
   exactly and the segments link without matching floats. A field padded with a low border closes every curve. */
function isolines(g, nx, ny, lev) {
  const at = (i, j) => g[j * nx + i];
  const pt = new Map(), adj = new Map();
  const H = (i, j) => { const k = 'h' + i + ',' + j; if (!pt.has(k)) { const a = at(i, j), b = at(i + 1, j); pt.set(k, [i + (lev - a) / (b - a), j]); } return k; };
  const V = (i, j) => { const k = 'v' + i + ',' + j; if (!pt.has(k)) { const a = at(i, j), b = at(i, j + 1); pt.set(k, [i, j + (lev - a) / (b - a)]); } return k; };
  const link = (p, q) => { for (const [x, y] of [[p, q], [q, p]]) { if (!adj.has(x)) adj.set(x, []); adj.get(x).push(y); } };
  for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = at(i, j), b = at(i + 1, j), c = at(i + 1, j + 1), d = at(i, j + 1);
    const k = (a > lev ? 1 : 0) | (b > lev ? 2 : 0) | (c > lev ? 4 : 0) | (d > lev ? 8 : 0);
    if (k === 0 || k === 15) continue;
    const bo = () => H(i, j), to = () => H(i, j + 1), le = () => V(i, j), ri = () => V(i + 1, j);
    switch (k) {
      case 1: case 14: link(le(), bo()); break;
      case 2: case 13: link(bo(), ri()); break;
      case 3: case 12: link(le(), ri()); break;
      case 4: case 11: link(ri(), to()); break;
      case 6: case 9: link(bo(), to()); break;
      case 7: case 8: link(le(), to()); break;
      case 5: link(le(), bo()); link(ri(), to()); break;
      case 10: link(le(), to()); link(bo(), ri()); break;
    }
  }
  const used = new Set(), out = [];
  const walk = (start) => {
    const chain = [start]; used.add(start); let cur = start;
    for (;;) { const nx2 = (adj.get(cur) || []).find((q) => !used.has(q)); if (!nx2) break; used.add(nx2); chain.push(nx2); cur = nx2; }
    const closed = chain.length > 2 && (adj.get(cur) || []).includes(start);
    const p = chain.map((k) => pt.get(k)); if (closed) p.push(p[0]);
    out.push({ pts: p, closed });
  };
  for (const [k, v] of adj) if (v.length === 1 && !used.has(k)) walk(k);
  for (const k of adj.keys()) if (!used.has(k)) walk(k);
  return out;
}

/* ================================================== 1. a field from a model ==
   The core OpenAI's Navier–Stokes blowup proof constructs, as /instruments/navier-stokes draws it: iso-speed contours
   of the leading speed |(u_θ, u_z)| in the meridional plane, at a chosen h and a chosen moment τ. The profiles are
   one core out of those with the paper's scalings (scene.json: backing.core is CHOSEN), so every contour is a picture
   of the model; the core box shrinks at the paper's exact exponents and is decided. */
function navierStokes(guard) {
  guard = makeGuard(guard);
  const REC = 'playground/navier-stokes/out/scene.json', FLD = 'playground/navier-stokes/field.js', APP = 'playground/navier-stokes/app.js';
  const S = readJson(REC), NSF = require(path.join(ROOT, FLD));
  /* the chosen inputs: h = 3/50 (one of the page's presets) and τ = 0.01 */
  const HN = 3, HD = 50, h = HN / HD, TAU = 1e-2, A = 0.5 + h, D = 0.5 - h;
  const STOP = 'the drawn core stops being divergence-free (|div u| reaches 10⁻⁶ of its larger term at h = 3/50), h = 3/50 leaves the open window the record states, or the record stops calling the drawn core chosen';
  const win = S.hWindow, lo = win.loExclusive, hi = win.hiExclusive;
  /* lo < 3/50 < hi, in integers */
  guard(STOP, S.backing && S.backing.core && S.backing.core.kind === 'CHOSEN' && lo.n * HD < HN * lo.d && HN * hi.d < hi.n * HD, JSON.stringify(win));
  let worst = 0;
  for (const [X, eta] of [[0.3, 0.3], [0.8, -0.4], [1.5, 0.6], [3.0, 0.85], [0.05, -0.9]]) worst = Math.max(worst, NSF.divergence(X, eta, TAU, h));
  guard(STOP, worst < 1e-6, 'worst |div u| ' + worst.toExponential(2));
  /* the exponents of the box, read from the record: ℓr = τ^(1/2), ℓz = τ^(1/2 − h) */
  const ex = (id) => S.exponents.find((e) => e.id === id).e;
  const lr = ex('lr'), lz = ex('lz');
  guard(STOP, lr.n0 === 1 && lr.n1 === 0 && lr.d === 2 && lz.n0 === 1 && lz.n1 === -2 && lz.d === 2, 'exponents moved');
  /* the leading speed on the lattice, in the profile's own coordinates (√X, η): (1 − η²)^A |(E, U)|, as app.js draws it */
  const CN = 161, CM = 121, CX = 2.15, CY = 0.92, g = new Float64Array(CN * CM);
  let vmax = 0;
  for (let j = 0; j < CM; j++) { const eta = -CY + 2 * CY * j / (CM - 1);
    for (let i = 0; i < CN; i++) { const sx = -CX + 2 * CX * i / (CN - 1), X = sx * sx;
      const v = Math.pow(Math.max(1e-12, 1 - eta * eta), A) * Math.hypot(NSF.E(X, h), NSF.U(X, eta)); g[j * CN + i] = v; if (v > vmax) vmax = v; } }
  const RATIO = 0.7, NL = 5, levels = Array.from({ length: NL }, (_, k) => Math.pow(RATIO, k) * vmax * 0.97);
  /* (√X, η) → physical (r, z) at τ, exactly as the instrument maps it */
  const toRZ = ([i, j]) => { const sx = -CX + 2 * CX * i / (CN - 1), eta = -CY + 2 * CY * j / (CM - 1), q = TAU / (1 - eta * eta);
    return [sx * Math.sqrt(2 * q), Math.pow(q, D) * eta]; };
  /* the core box as the instrument draws it: ℓr = √(2 X_c τ), ℓz = τ^(1/2 − h), X_c read from app.js, never retyped */
  const mXc = /\bXc = ([0-9.]+)/.exec(fs.readFileSync(path.join(ROOT, APP), 'utf8'));
  guard(STOP, !!mXc, 'app.js no longer names X_c');
  const ext = { lr: Math.sqrt(2 * Number(mXc[1]) * TAU), lz: Math.pow(TAU, D) };
  /* the frame: equal scale in r and z, so the box keeps its true shape; room under the ticks for the chosen inputs */
  const O = { w: PW, h: PH, padL: 46, padR: 14, padT: TOP, padB: 54 };
  const pw = PW - O.padL - O.padR, ph = PH - O.padT - O.padB, R = 0.5, Z = R * ph / pw;
  const F = Object.assign({}, O, { x0: -R, x1: R, y0: -Z, y1: Z });
  const sets = levels.map((lev) => isolines(g, CN, CM, lev).map((c) => c.pts.map(toRZ)));
  const inFrame = ([r, z]) => Math.abs(r) <= R * 1.02 && Math.abs(z) <= Z * 1.02;
  const screen = (f, pts) => { const out = []; let cur = [];
    for (const p of pts) { if (inFrame(p)) cur.push([f.px(p[0]), f.py(p[1])]); else { if (cur.length > 1) out.push(cur); cur = []; } }
    if (cur.length > 1) out.push(cur); return out.map((c) => simplify(c, 0.35)); };
  const ticks = (f) => CH.axes(f, { yTicks: [-0.2, 0, 0.2].map((v) => ({ v, t: String(v) })), xTicks: [-0.4, -0.2, 0, 0.2, 0.4].map((v) => ({ v, t: String(v) })) });
  const SPEED = (lev) => Math.pow(TAU, -A) * lev;   /* the speed a level stands for at τ: τ^(−A) times the lattice value */
  const contours = (f) => sets.map((cs) => dOf(cs.flatMap((c) => screen(f, c)))).join('');
  const usual = (() => {
    const f = CH.frame(F), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    out.push(pathEl(contours(f), PLAIN.replace('1.6', '1.2')));
    /* contour labels, as clabel prints them: the speed of three levels, at the right end of each level's widest piece */
    for (const k of [0, 1, 2]) {
      const pieces = sets[k].flatMap((cc) => screen(f, cc)), wid = (c) => Math.max(...c.map((q) => q[0])) - Math.min(...c.map((q) => q[0]));
      const c = pieces.sort((a, b) => wid(b) - wid(a))[0]; if (!c) continue;
      const p = c.reduce((m, q) => (q[0] > m[0] ? q : m), c[0]); out.push(t(p[0] + 4, p[1] + (k === 2 ? -4 : 4), SPEED(levels[k]).toFixed(1), 't-ax'));
    }
    out.push(head(f, 'flow speed in the (r, z) plane', 't-ax'));
    return svg(PW, PH, 'As usually drawn: five levels of the flow speed in the r–z plane, all in one solid ink, three labelled with a speed, like contours of a measured or simulated field. It does not say that the field is a picture of one chosen model, and it has no mark for what the proof decides.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(F), out = [ticks(f), eyebrow(8, 14, 'in warrant')];
    out.push(line(f.px(0), f.T, f.px(0), f.T + f.ph, GUIDE));
    out.push(pathEl(contours(f), W.attrs(W.CHOSEN, { width: 1.6 })));
    const bx = f.px(-ext.lr), by = f.py(ext.lz), bw = f.px(ext.lr) - bx, bh = f.py(-ext.lz) - by;
    out.push('    <rect x="' + n1(bx) + '" y="' + n1(by) + '" width="' + n1(bw) + '" height="' + n1(bh) + '" ' + W.attrs(W.DECIDED, { width: 1.6 }) + '/>');
    out.push(mood(f.L + f.pw, PH - 8, 'given h = 3/50, at τ = 0.01', 'end'));
    out.push(head(f, 'dotted: a picture of the model · solid: core box'));
    return svg(PW, PH, 'In WARRANT: the same five speed levels dotted, chosen, because the core they draw is one flow picked from those with the paper\'s scalings, so the field is a picture of the model; the core box solid, decided, because it shrinks at the paper\'s exact exponents, τ to the one half across and τ to the one half minus h along the axis; the axis a guide; the chosen inputs h = 3/50 and τ = 0.01 named in italic. The contours are a picture; only the box\'s shrinking rates are decided.', out);
  })();
  return {
    id: 'ns-core', title: 'A field from a model', form: 'a contour field from a model', kind: 'record', record: [REC, FLD, APP], stop: STOP, usual, warrant,
    link: 'instruments/navier-stokes/',
    rule: 'Draw a field computed from a model dotted, as a picture of one chosen member, name its chosen inputs in italic, and draw solid only what the model decides, here the box its exact exponents fix.',
    hides: 'The usual contour plot of a model’s field looks like a measurement, with speeds printed on it. Here the contours are dotted, because the profiles behind them were picked to be legible and only the scalings are the paper’s; the one solid mark is the core box, whose shrinking rates are exact.',
    caption: 'The vortex core the blowup proof constructs, in the meridional plane at τ = 0.01 before the singularity, given h = 3/50: five levels of the leading speed |(u<sub>θ</sub>, u<sub>z</sub>)|, each 0.7 of the one inside it. A field drawn from a model is a picture of it: this is one core with the paper’s scalings, divergence-free by construction (checked here to 10⁻⁶). The box is the instrument’s core box, ℓ<sub>r</sub> by ℓ<sub>z</sub>; it shrinks as τ<sup>1/2</sup> by τ<sup>1/2 − h</sup>, exponents the record holds as exact rationals, which is why it is solid.',
  };
}

/* =============================================== 2. an image as a set of fits ==
   M87 as fitted to the Event Horizon Telescope's released 2018 visibilities (/instruments/interferometer): not one
   picture but the fitted skies, reduced as the instrument reduces them (each centred on its own flux centroid, since
   the data cannot see position; blurred to its default 5 μas restoring beam). Where all five are bright is ink; where
   only some are is texture, denser where more of them are. Each sky is a fit by descent in floating point, so every
   edge is computed. */
/* ids for clip paths and textures: this module's own prefix, numbered, so no two drawings on the page share one */
let DOTS = 0;
function interferometer(guard) {
  guard = makeGuard(guard);
  const REC = 'playground/interferometer/out/page-data.json';
  const D = readJson(REC), M = D.meta, N = M.N, NP = N * N;
  const LEVEL = 0.4, BEAM = 5;   /* chosen: a fraction of each sky's own peak; the beam, μas */
  /* the selection, by the instrument's own rule at full phase weight: closure phases at weight 1, no ceiling skies,
     and the stated flux hypothesis (total flux at most F Jy) */
  const live = D.members.filter((m) => m.phase === 1 && m.total <= M.F);
  const STOP = 'the instrument\'s rule (closure phases at full weight, total flux at most 2 Jy) stops selecting five skies, a sky stops decoding to 64 × 64 pixels, or the five stop both sharing a bright region and differing around it at the level drawn';
  guard(STOP, live.length === 5 && M.F === 2 && N === 64, live.length + ' skies');
  /* decode as app.js does: 8-bit × peak, shifted onto its own flux centroid (bilinear, dark outside) */
  const decode = (m) => {
    const b = Buffer.from(m.b64, 'base64'); guard(STOP, b.length === NP, b.length + ' bytes');
    const a = new Float64Array(NP); let tot = 0;
    for (let i = 0; i < NP; i++) { a[i] = b[i] / 255 * m.peak; tot += a[i]; }
    let cx = 0, cy = 0; for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const v = a[j * N + i] / tot; cx += v * i; cy += v * j; }
    const c = (N - 1) / 2, dx = cx - c, dy = cy - c, r = new Float64Array(NP);
    const at = (i, j) => (i < 0 || i >= N || j < 0 || j >= N ? 0 : a[j * N + i]);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const sx = i + dx, sy = j + dy, i0 = Math.floor(sx), j0 = Math.floor(sy), fx = sx - i0, fy = sy - j0;
      r[j * N + i] = at(i0, j0) * (1 - fx) * (1 - fy) + at(i0 + 1, j0) * fx * (1 - fy) + at(i0, j0 + 1) * (1 - fx) * fy + at(i0 + 1, j0 + 1) * fx * fy;
    }
    return r;
  };
  /* the restoring beam, as app.js's blurR: a Gaussian of σ = BEAM μas, separable, edges clamped */
  const pxu = 2 * M.fov / (N - 1);
  const blur = (g) => { const sg = BEAM / pxu, R = Math.ceil(3 * sg), k = []; let sum = 0;
    for (let d = -R; d <= R; d++) { const v = Math.exp(-d * d / (2 * sg * sg)); k.push(v); sum += v; }
    const tmp = new Float64Array(NP), out = new Float64Array(NP), cl = (q) => Math.min(N - 1, Math.max(0, q));
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let v = 0; for (let d = -R; d <= R; d++) v += k[d + R] * g[j * N + cl(i + d)]; tmp[j * N + i] = v / sum; }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { let v = 0; for (let d = -R; d <= R; d++) v += k[d + R] * tmp[cl(j + d) * N + i]; out[j * N + i] = v / sum; }
    let pk = 0; for (let i = 0; i < NP; i++) if (out[i] > pk) pk = out[i];
    for (let i = 0; i < NP; i++) out[i] /= pk;   /* each sky against its own peak */
    return out; };
  const skies = live.map((m) => blur(decode(m)));
  /* the k-th brightest of the five at each pixel: {at least k skies bright} = {k-th brightest ≥ level}. Padded by one dark
     pixel all round, so every level set closes */
  const P = N + 2, pad = (fn) => { const g = new Float64Array(P * P); for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) g[(j + 1) * P + i + 1] = fn(j * N + i); return g; };
  const kth = (k) => pad((q) => skies.map((s) => s[q]).sort((x, y) => y - x)[k - 1]);
  const n5 = kth(5), n3 = kth(3), n1 = kth(1);
  const area = (g) => { let n = 0; for (let q = 0; q < P * P; q++) if (g[q] >= LEVEL) n++; return n; };
  const A5 = area(n5), A3 = area(n3), A1 = area(n1);
  guard(STOP, A5 > 0 && A3 > A5 && A1 > A3, A5 + ' / ' + A3 + ' / ' + A1);
  const best = live.reduce((x, y) => (y.chi2 < x.chi2 ? y : x));
  const bestSky = pad((q) => skies[live.indexOf(best)][q]);
  /* the sky square: the whole field, ±fov μas, pixel i at −fov + 2 fov i/(N − 1) as app.js places it */
  const SQ = 222, X0 = 14, Y0 = 56, sc = SQ / (2 * M.fov);
  const toXY = ([i, j]) => [X0 + SQ / 2 + (-M.fov + (i - 1) * pxu) * sc, Y0 + SQ / 2 - (-M.fov + (j - 1) * pxu) * sc];
  const region = (g, lev) => dOf(isolines(g, P, P, lev).map((c) => simplify(c.pts.map(toXY), 0.3)), true);
  const clip = (id) => '    <defs><clipPath id="' + id + '"><rect x="' + X0 + '" y="' + Y0 + '" width="' + SQ + '" height="' + SQ + '"/></clipPath></defs>';
  const frameSq = '    <rect x="' + X0 + '" y="' + Y0 + '" width="' + SQ + '" height="' + SQ + '" ' + hair('--rule') + '/>';
  const bar = () => { const L = 20 * sc, x1 = X0 + SQ, y = Y0 + SQ + 10; return [line(x1 - L, y, x1, y, 'stroke="var(--ink-3)" stroke-width="1.6"'), t(x1 - L - 6, y + 4, '20 μas', 't-ax', 'end')].join('\n'); };
  const KX = X0 + SQ + 16;
  const usual = (() => {
    const id = 'fx-cl' + (++DOTS), out = [eyebrow(8, 14, 'as usually drawn'), clip(id), frameSq, '    <g clip-path="url(#' + id + ')">'];
    for (const lev of [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]) out.push(pathEl(region(bestSky, lev), 'fill="var(--ink-2)" fill-opacity="0.17" fill-rule="evenodd" stroke="none"'));
    out.push('    </g>', bar());
    out.push(t(X0, 38, 'M87 · ' + M.date + ' · ' + Math.round(M.freqGHz) + ' GHz', 't-ax'));
    out.push(t(KX, Y0 + 12, 'the image:', 't-ax'), t(KX, Y0 + 28, 'one fitted sky,', 't-ax'), t(KX, Y0 + 44, 'brightness', 't-ax'), t(KX, Y0 + 60, 'as grey', 't-ax'));
    return svg(PW, PH, 'As usually drawn: one image of M87, a single fitted sky drawn as grey brightness. It does not show that other skies fit the same data, or where they differ from this one.', out);
  })();
  const warrant = (() => {
    const id = 'fx-cl' + (++DOTS), dd = 'fx-dd' + DOTS, ds = 'fx-ds' + DOTS;
    const dot = (pid, step, r) => '<pattern id="' + pid + '" width="' + step + '" height="' + step + '" patternUnits="userSpaceOnUse"><circle cx="' + step / 2 + '" cy="' + step / 2 + '" r="' + r + '" fill="var(--ink-3)"/></pattern>';
    const out = [eyebrow(8, 14, 'in warrant'), clip(id), '    <defs>' + dot(dd, 3, 0.85) + dot(ds, 6, 0.85) + '</defs>', frameSq, '    <g clip-path="url(#' + id + ')">'];
    const d5 = region(n5, LEVEL), d3 = region(n3, LEVEL), d1 = region(n1, LEVEL);
    out.push(pathEl(d1 + d3, 'fill="url(#' + ds + ')" fill-rule="evenodd" stroke="none"'));
    out.push(pathEl(d3 + d5, 'fill="url(#' + dd + ')" fill-rule="evenodd" stroke="none"'));
    out.push(pathEl(d5, 'fill="var(--ink-3)" fill-rule="evenodd" stroke="none"'));
    out.push(pathEl(d1, W.attrs(W.COMPUTED, { width: 1.6 })));
    out.push(pathEl(d5, W.attrs(W.COMPUTED, { width: 1.6 })));
    out.push('    </g>', bar());
    out.push(head({ L: X0, T: 50 }, live.length + ' skies fitted to the same data, at once'));
    const sw = (y, fill, words) => ['    <rect x="' + KX + '" y="' + (y - 10) + '" width="14" height="14" ' + fill + ' stroke="var(--ink-3)" stroke-width="1"/>']
      .concat(words.map((w, i) => t(KX + 20, y + i * 15, w, 't-note'))).join('\n');
    out.push(sw(Y0 + 12, 'fill="var(--ink-3)"', ['all 5 bright:', 'they agree']));
    out.push(sw(Y0 + 50, 'fill="url(#' + dd + ')"', ['3 or 4 bright']));
    out.push(sw(Y0 + 74, 'fill="url(#' + ds + ')"', ['1 or 2 bright']));
    out.push(t(KX, Y0 + 110, 'edges dashed:', 't-note'), t(KX, Y0 + 125, 'each sky is a fit', 't-note'));
    out.push(mood(KX, Y0 + 158, 'given bright ≥ ' + Math.round(LEVEL * 100) + '%'), mood(KX, Y0 + 173, 'of its peak, and'), mood(KX, Y0 + 188, 'a ' + BEAM + ' μas beam'));
    return svg(PW, PH, 'In WARRANT: five skies fitted to the same released data, drawn at once, each centred on its own flux centroid and blurred to a 5 microarcsecond beam. Solid ink where all five are brighter than ' + Math.round(LEVEL * 100) + ' percent of their own peak; dense dots where three or four are; sparse dots where one or two are. The edges are dashed, computed, because every sky is a fit in floating point; the level and the beam are choices, named in italic. All five agree on one bright patch; around it they differ.', out);
  })();
  return {
    id: 'eht-skies', title: 'An image as a set of fits', form: 'an image as the set of skies fitted to the data', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/interferometer/',
    rule: 'Draw an image fitted to data as the set of its fits: ink where every fit agrees, texture where they differ (denser where more agree), edges in the stroke of how the fits were computed, and the level and the beam named as choices.',
    hides: 'The usual image is one sky out of the many that fit the same visibilities, and a picture cannot say which of its features the data force. Here the five fitted skies are drawn at once: ink where all five are bright, texture where only some are.',
    caption: 'M87 on ' + M.date + ' at ' + M.freqGHz + ' GHz: of the ' + D.members.length + ' skies the instrument fitted to the EHT’s released visibilities (' + M.K + ' of them, from ' + M.stations.length + ' stations), the ' + live.length + ' its own rule keeps at full weight: closure phases in, total flux within ' + M.F + ' Jy. As the instrument draws them, each is centred on its own flux centroid, since neither amplitudes nor closure phases can see position, and blurred to its ' + BEAM + ' μas restoring beam. The usual panel draws the one with the lowest χ² (' + best.chi2.toFixed(2) + '). Bright means at least ' + Math.round(LEVEL * 100) + '% of that sky’s own peak: a chosen line.',
  };
}

/* ============================================== 3. a shape from its chords ==
   A stellar occultation by (95626) 2002 GZ32 (/instruments/occultation): five stations each timed one chord across the
   body's shadow, 23 saw nothing, two returned no data. Assuming only that the silhouette is convex, the chord length is
   concave in the cross-track position, so the set of allowed silhouettes has a floor (the concave hull of the chords'
   lower ends) and a ceiling (concavity read backwards, clipped where the nearest stations saw nothing), both exact.
   Drawn centred slice by slice: chords fix widths, not where along the track the body sat. */
function occultation(guard) {
  guard = makeGuard(guard);
  const REC = 'instruments/occultation/out/page.json';
  const D = readJson(REC);
  const R1 = D.ladder.find((r) => r.nsig === 1), R0 = D.ladder.find((r) => r.nsig === 0);
  const STOP = 'the chords at one stated error stop admitting a convex body, the floor stops being concave, or the joined dots become concave (the usual outline would then be one of the allowed shapes and this caption false)';
  const slopes = (P) => P.slice(1).map((q, i) => (q[1] - P[i][1]) / (q[0] - P[i][0]));
  const concave = (P) => slopes(P).every((m, i, a) => i === 0 || m <= a[i - 1]);
  guard(STOP, R1 && R1.feasible.ok && R0 && !R0.feasible.ok && concave(R1.polyLo) && !R1.dotsConcave && !concave(R1.polyDots));
  const pos = D.sites.filter((x) => x.status === 'positive').map((x) => ({ y: +x.y, len: +x.len, site: x.site }));
  const Y0 = -160, Y1 = 140, inY = (x) => +x.y > Y0 && +x.y < Y1;
  const neg = D.sites.filter((x) => x.status === 'negative' && inY(x)).map((x) => +x.y);
  const lost = D.sites.filter((x) => (x.status === 'bad' || x.status === 'technical') && inY(x)).map((x) => ({ y: +x.y, why: x.status === 'bad' ? 'bad data' : 'failed' }));
  guard(STOP, pos.length === D.nPositive && pos.length === 5, pos.length + ' chords');
  /* the frame: equal scale on the sky plane, along-track x and cross-track y, km */
  const O = { w: PW, h: PH, padL: 46, padR: 92, padT: TOP, padB: 40 };
  const pw = PW - O.padL - O.padR, ph = PH - O.padT - O.padB, XR = (Y1 - Y0) / ph * pw / 2;
  const F = Object.assign({}, O, { x0: -XR, x1: XR, y0: Y0, y1: Y1 });
  const ticks = (f) => CH.axes(f, { yTicks: [-100, 0, 100].map((v) => ({ v, t: String(v) })), xTicks: [-100, 0, 100].map((v) => ({ v, t: String(v) })) });
  /* a chord-length profile [[y, w], …] as the centred outline: right side up, left side down */
  const outline = (f, P) => { const R = P.map(([y, w]) => [f.px(w / 2), f.py(y)]), L = P.slice().reverse().map(([y, w]) => [f.px(-w / 2), f.py(y)]);
    return simplify(R.concat(L, [R[0]]), 0.3); };
  const chords = (f, a) => pos.map((c) => line(f.px(-c.len / 2), f.py(c.y), f.px(c.len / 2), f.py(c.y), a)).join('\n');
  const RX = (f) => f.L + f.pw + 8;
  const usual = (() => {
    const f = CH.frame(F), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    out.push(pathEl(dOf([outline(f, R1.polyDots)]), PLAIN));
    out.push(chords(f, PLAIN));
    out.push(head(f, D.object + ', chords joined', 't-ax'));
    out.push(t(f.L + f.pw, PH - 6, 'km on the sky', 't-ax', 'end'));
    return svg(PW, PH, 'As usually drawn: the five measured chords across the body, centred, and an outline joining their ends, all in one solid ink, closed at the two nearest stations that saw nothing, so the outline reads as the body\'s shape. The other stations that saw nothing and the two that returned no data are not drawn.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(F), h = PL.hatch(), dt = 'fx-ds' + (++DOTS), out = [h.def, ticks(f), eyebrow(8, 14, 'in warrant')];
    out.push('    <defs><pattern id="' + dt + '" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="0.85" fill="var(--ink-3)"/></pattern></defs>');
    const hi = dOf([outline(f, R1.polyHi)]), lo = dOf([outline(f, R1.polyLo)]);
    out.push(pathEl(hi + lo, 'fill="url(#' + dt + ')" fill-rule="evenodd" stroke="none"'));
    out.push(pathEl(lo, 'fill="var(--ink-4)" stroke="none"'));
    /* the misses: a station that saw nothing is an observation, drawn as the track it watched */
    for (const y of neg) out.push(line(f.L, f.py(y), f.L + f.pw, f.py(y), 'class="w-decided" stroke-width="1"' + idA(2)));
    for (const L of lost) { out.push(PL.voidRect(h, f.L, f.py(L.y) - 3, f.pw, 6)); out.push(t(RX(f), f.py(L.y) + 4, '∅ ' + L.why, 't-note')); }
    out.push(pathEl(hi, W.attrs(W.DECIDED, { width: 1.2 }) + idA(1)));
    out.push(pathEl(lo, W.attrs(W.DECIDED, { width: 1.6 })));
    out.push(chords(f, W.attrs(W.DECIDED, { width: 2.4 })));
    const top = neg.filter((y) => y > 0), bot = neg.filter((y) => y < 0);
    if (top.length) out.push(t(RX(f), f.py(Math.max(...top)) + 1, 'saw nothing', 't-note'));
    if (bot.length) out.push(t(RX(f), f.py(Math.min(...bot)) + 8, 'saw nothing', 't-note'));
    out.push(head(f, 'ink: in every allowed body · texture: in some'));
    out.push(mood(f.L + f.pw, PH - 6, 'given 1σ of chord error', 'end'));
    return svg(PW, PH, 'In WARRANT: the five chords solid, decided; every convex silhouette the chords allow at one stated error, drawn centred slice by slice: filled where every allowed silhouette covers, a dot texture where only some do, with the floor and the ceiling as solid edges, decided by exact arithmetic; the stations that saw nothing drawn as the tracks they watched, solid, because a miss is an observation; the two stations that returned no data drawn as hatched voids with their reason. The outline made by joining the chord ends is not drawn: it is not concave, so no convex body has it. The allowed area-equivalent diameter runs from ' + OUT.down(R1.DeqLo, 1) + ' to ' + OUT.up(R1.DeqHi, 1) + ' kilometres.', out);
  })();
  return {
    id: 'occultation-chords', title: 'A shape from its chords', form: 'a silhouette set from chords', kind: 'record', record: REC, stop: STOP, usual, warrant,
    link: 'instruments/occultation/',
    rule: 'Draw a shape known only through cuts as the set of shapes the cuts allow: ink where every allowed shape covers, texture where some do, each cut and each empty probe as an observation, and a probe that returned nothing as a void with its reason.',
    hides: 'The usual sketch joins the chord ends into an outline that looks like the body. That outline is not concave, so no convex body has it. Here the body is the set of shapes the chords allow, and the stations that saw nothing, which set its ceiling, are drawn as observations.',
    caption: D.object + ', the stellar occultation of ' + D.date + ': the ' + D.nPositive + ' chords as published, the stations that saw nothing within the frame (' + D.nNegative + ' in all) and the two that returned no data. Assuming only a convex silhouette, the floor and ceiling are exact: an area-equivalent diameter of ' + OUT.down(R1.DeqLo, 1) + ' to ' + OUT.up(R1.DeqHi, 1) + ' km, given one stated error per chord; at face value no convex body passes through all five. Drawn centred slice by slice, because chords fix widths and not where along the track the body sat: the placement is chosen, the widths decided.',
  };
}

/* =================================================== 4. an error budget ==
   A stereo-video wave rig (/instruments/stereo-reach): the two smartphones of Vieira et al. (2020) at Leme, read at
   the pressure gauge 34 m out. The set of elevations and ranges the rig cannot tell apart is a box, computed in
   outward-rounded interval arithmetic by instruments/stereo/budget.js on the paper's literals. Three boxes nest: the
   best corner of what the paper leaves unstated, every reading of it, and that with a synchronisation lag and a
   texture speed the page chooses. */
function stereoBudget(guard) {
  guard = makeGuard(guard);
  const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
  const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
  const { makeBudget } = require(path.join(ROOT, 'instruments', 'stereo', 'budget.js'));
  const PR = require(path.join(ROOT, 'instruments', 'stereo', 'presets.js'));
  const Bd = makeBudget(IV), P = PR.leme2020, inp = PR.toIntervals(P, Bd, TR.PI), RG = P.gaugeRange;
  const best = Object.assign({}, inp, { p: Bd.lit(P.best.p), dd: Bd.lit(P.best.dd), dt: Bd.lit('0') });
  const box = Object.assign({}, inp, { dt: Bd.lit('0') });
  const at = (i) => Bd.cell(i, Bd.lit(RG));
  const cB = at(best), cX = at(box), cL = at(inp);
  const STOP = 'the best corner\'s box stops lying inside the box over every reading the paper allows, that box stops lying inside the one with the chosen lag, or an observed RMSE leaves the span between the best and the worst totals';
  const inside = (a, b) => a.eta[0] >= b.eta[0] && a.eta[1] <= b.eta[1] && a.r[0] >= b.r[0] && a.r[1] <= b.r[1];
  const worst = Object.assign({}, inp, { p: Bd.lit(P.worst.p), dd: Bd.lit(P.worst.dd) });
  const tB = cB.total[1], tW = at(worst).total[1];
  guard(STOP, inside(cB.quantization, cX.quantization) && inside(cX.quantization, cL.withSync) && P.observed.rmse.every((x) => x >= tB && x <= tW), tB + ' ' + tW);
  /* every height printed is the upper end of an enclosure, so it is rounded up, at a millimetre */
  const cm = (x) => (Number(OUT.up(x, 3)) * 100).toFixed(1);
  const cmDown = (x) => (Number(OUT.down(x, 3)) * 100).toFixed(1);   /* the span's lower end, the best total, rounds down */
  const boxes = [
    { c: cB.quantization, st: W.DECIDED, id: 0, lab: ['best corner,', cm(cB.quantization.vert) + ' cm tall'] },
    { c: cX.quantization, st: W.DECIDED, id: 1, lab: ['every reading', 'of the paper,', cm(cX.quantization.vert) + ' cm tall'] },
    { c: cL.withSync, st: W.CHOSEN, id: 0, lab: ['with a lag,', cm(cL.withSync.vert) + ' cm tall'] },
  ];
  /* the frame: range in metres across, elevation in centimetres up */
  const O = { w: PW, h: PH, padL: 46, padR: 104, padT: TOP, padB: 40, x0: 32.4, x1: 35.6, y0: -0.2, y1: 0.2 };
  const ticks = (f) => CH.axes(f, { yTicks: [-0.2, -0.1, 0, 0.1, 0.2].map((v) => ({ v, t: (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v * 100).toFixed(0) })), xTicks: [33, 34, 35].map((v) => ({ v, t: v + ' m' })) });
  const rect = (f, c, a) => '    <rect x="' + n1(f.px(c.r[0])) + '" y="' + n1(f.py(c.eta[1])) + '" width="' + n1(f.px(c.r[1]) - f.px(c.r[0])) + '" height="' + n1(f.py(c.eta[0]) - f.py(c.eta[1])) + '" ' + a + '/>';
  const usual = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    /* one point with error bars: the total height and the range spread, symmetric about the gauge */
    const x = f.px(+RG), y = f.py(0), hx = (cL.withSync.r[1] - cL.withSync.r[0]) / 2, hy = cL.total[1] / 2;
    out.push(line(f.px(+RG - hx), y, f.px(+RG + hx), y, PLAIN), line(x, f.py(hy), x, f.py(-hy), PLAIN));
    for (const [x1, y1, x2, y2] of [[f.px(+RG - hx), y - 5, f.px(+RG - hx), y + 5], [f.px(+RG + hx), y - 5, f.px(+RG + hx), y + 5], [x - 5, f.py(hy), x + 5, f.py(hy)], [x - 5, f.py(-hy), x + 5, f.py(-hy)]]) out.push(line(x1, y1, x2, y2, PLAIN));
    out.push('    <circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="3.2" fill="var(--ink-2)"/>');
    out.push(t(f.L + f.pw + 10, f.py(hy) + 4, '± ' + cm(hy) + ' cm', 't-ax'));
    out.push(head(f, 'the surface at the gauge · elevation, cm', 't-ax'));
    return svg(PW, PH, 'As usually drawn: the surface point at the gauge, 34 metres out, with symmetric error bars, plus or minus ' + cm(hy) + ' centimetres in elevation and the range spread across. It does not say which part of the error rests on the paper\'s numbers, which on numbers the paper leaves out, and which on a chosen lag.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'in warrant')];
    const LX = f.L + f.pw + 10;
    boxes.slice().reverse().forEach((b) => out.push(rect(f, b.c, W.attrs(b.st, { width: b.st === W.CHOSEN ? 1.8 : 1.6 }) + idA(b.id))));
    /* each box's words at the right, top to bottom outer to inner, a hairline to the box's right edge */
    const rows = [[2, f.py(cL.withSync.eta[1]) + 4], [1, f.py(cX.quantization.eta[1]) + 10], [0, f.py(0) + 24]];
    for (const [k, y] of rows) {
      const b = boxes[k], ey = Math.min(Math.max(y - 4, f.py(b.c.eta[1]) + 2), f.py(b.c.eta[0]) - 2);
      b.lab.forEach((w, i) => out.push(t(LX, y + i * 13, w, 't-note')));
      out.push(line(f.px(b.c.r[1]) + 2, ey, LX - 3, y - 4, hair('--ink-5')));
    }
    out.push(mood(f.L + f.pw, PH - 6, 'given a lag of 1/60 s, texture at 1 m/s', 'end'));
    out.push(head(f, 'what the rig cannot tell apart · elevation, cm'));
    return svg(PW, PH, 'In WARRANT: three nested boxes of the range and elevation the rig cannot tell apart at the gauge, 34 metres out, each an enclosure computed in outward-rounded interval arithmetic. The innermost, solid, is the best corner of what the paper leaves unstated (' + cm(cB.quantization.vert) + ' centimetres tall); the middle, solid and lighter, covers every reading of the pixel pitch and matching precision the paper does not state (' + cm(cX.quantization.vert) + ' centimetres); the outer, dotted, chosen, adds a synchronisation lag of 1/60 second and a texture speed of 1 metre per second, named in italic (' + cm(cL.withSync.vert) + ' centimetres). Most of the height rests on what the paper leaves unstated and on the chosen lag, not on the paper\'s own numbers.', out);
  })();
  return {
    id: 'stereo-budget', title: 'An error budget', form: 'an error budget as nested boxes', kind: 'built', source: 'built: instruments/stereo/budget.js over instruments/interval/interval.js on the Leme 2020 literals of instruments/stereo/presets.js, in outward-rounded interval arithmetic as this page is built', stop: STOP, usual, warrant,
    link: 'instruments/stereo-reach/',
    rule: 'Draw an error budget as nested enclosures, one per premise, innermost first: solid where it rests on the source’s literals or on boxes around what the source leaves out, dotted where it adds a chosen scenario, and name the chosen inputs in italic.',
    hides: 'The usual error bar is one cross of symmetric whiskers. It hides that the error is a box in two dimensions, and that its size rests on three different things: the paper’s numbers, the numbers the paper leaves out, and a lag the page chose.',
    caption: 'The two-smartphone rig of Vieira et al. (2020) at Leme, at the pressure gauge ' + RG + ' m out: the set of ranges and elevations one matched pixel cannot tell apart. The paper gives the baseline (' + P.B.v + ' m), the height (' + P.Hc.v + ' m) and the lens; it does not give the pixel pitch or the matching precision, so those are boxes. The outer box adds a lag of half a frame and a texture speed, both chosen; with the slope and the surface’s own motion the total height is ' + cm(cL.total[1]) + ' cm. The four observed RMSEs against the gauge (' + P.observed.rmse.map((x) => (x * 100).toFixed(0)).join(', ') + ' cm) lie between the best total, ' + cmDown(tB) + ' cm, and the worst, ' + cm(tW) + ' cm.',
  };
}

/* ================================================= 5. counts under a curve ==
   The environmental-contour benchmark (/instruments/contours): three submitted 20-year contours for dataset A (an NDBC
   buoy) over the 175,320 hours they were scored on. The hours are counted exactly into chosen cells and drawn as an
   ordered field in five stated classes; the contours are drawn as their files list them, decided; the edge the
   benchmark's test adds to close an open file is chosen, dotted. Read from the extract the matplotlib kit ships, which
   must carry the digest of the ledger as it is now. */
function ecContours(guard) {
  guard = makeGuard(guard);
  const REC = 'certs/ecbench-ledger.json', EX = 'kits/warrant-mpl/examples/data/contours-a20.json';
  const D = readJson(EX), L = readJson(REC), FLD = D.field;
  const STOP = 'the kit\'s extract no longer carries the digest of the benchmark\'s ledger, its cells stop summing to the hours scored, or a contour\'s count outside or its closure stops matching the ledger';
  const [x0, x1, NX] = FLD.tz, [y0, y1, NY] = FLD.hs, C = FLD.counts;
  const row = (c) => L.rows.find((r) => r.file === c.file);
  guard(STOP, D.source && D.source.record === REC && D.source.sha256 === sha(REC) && C.length === NX * NY && C.reduce((a, b) => a + b, 0) === D.hours
    && D.contours.length === 3 && D.contours.every((c) => { const r = row(c); return r && r.counts.full.out === c.outside && r.polygon.closed === c.closed && r.polygon.closingEdgeLength === c.closingEdgeLength; }), D.source && D.source.sha256);
  const open = D.contours.filter((c) => !c.closed);
  guard(STOP, open.length === 1, open.length + ' open files');
  const CLASSES = [[1, 9], [10, 99], [100, 499], [500, 1999], [2000, Infinity]];
  const big = D.largestHour, maxC = Math.max(...C);
  /* the frame: one cell is 4 × 3.5 units, so the cells sit on the drawing's own grid */
  const CW = 4, CHh = 3.5, O = { w: PW, h: PH, padL: 46, padR: PW - 46 - NX * CW, padT: TOP, padB: PH - TOP - NY * CHh, x0, x1, y0, y1 };
  const ticks = (f) => CH.axes(f, { yTicks: [0, 4, 8, 12].map((v) => ({ v, t: v + ' m' })), xTicks: [0, 5, 10, 15, 20].map((v) => ({ v, t: v + ' s' })) });
  /* the cells of each bin as one path of row runs */
  const runs = (f, binOf, nb) => { const d = Array.from({ length: nb }, () => []);
    for (let iy = 0; iy < NY; iy++) for (let ix = 0; ix < NX;) {
      const k = C[iy * NX + ix] ? binOf(C[iy * NX + ix]) : -1; let jx = ix + 1;
      while (jx < NX && C[iy * NX + jx] && binOf(C[iy * NX + jx]) === k) jx++;
      if (k >= 0) d[k].push('M' + n1(f.L + ix * CW) + ',' + n1(f.T + (NY - 1 - iy) * CHh) + 'h' + n1((jx - ix) * CW) + 'v' + CHh + 'h-' + n1((jx - ix) * CW) + 'z');
      ix = jx; }
    return d.map((x) => x.join('')); };
  const pts = (f, c) => simplify(c.tz.map((v, i) => [f.px(+v), f.py(+c.hs[i])]), 0.35);
  const usual = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    /* a linear ramp, as a default 2-D histogram draws it: twelve bins, each at the mean ink of its cells */
    const NB = 12, binOf = (n) => Math.min(NB - 1, Math.floor(n / maxC * NB));
    const mean = Array.from({ length: NB }, (_, k) => { const m = C.filter((n) => n && binOf(n) === k); return m.length ? m.reduce((a, b) => a + b, 0) / m.length / maxC : 0; });
    runs(f, binOf, NB).forEach((d, k) => { if (d) out.push(pathEl(d, 'fill="var(--ink-2)" fill-opacity="' + Math.max(0.01, mean[k]).toFixed(3) + '" stroke="none"')); });
    /* the files as plotted, vertex to vertex: an open file stays open */
    for (const c of D.contours) out.push(pathEl(dOf([pts(f, c)]), PLAIN));
    out.push(head(f, 'Hs against Tz, three 20-year contours', 't-ax'));
    return svg(PW, PH, 'As usually drawn: a two-dimensional histogram of the hourly sea states on a linear grey ramp, so only the dense core shows, and three 20-year environmental contours in one ink at one weight, which cannot be told apart. The single hours near and beyond the contours, the ones the contours are scored on, are drawn at almost no ink.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'in warrant')];
    const binOf = (n) => CLASSES.findIndex(([lo, hi]) => n >= lo && n <= hi);
    runs(f, binOf, CLASSES.length).forEach((d, k) => { if (d) out.push(pathEl(d, 'fill="' + CH.SEQ[k] + '" stroke="none"')); });
    /* the contours as their files list them: decided, told apart by weight and opacity; a casing so they read over the field */
    D.contours.forEach((c, i) => {
      const P = pts(f, c), d = dOf([P]);
      out.push(pathEl(d, 'stroke="var(--sunk)" stroke-width="3.6" fill="none" stroke-linejoin="round"'));
      out.push(pathEl(d, W.attrs(W.DECIDED, { width: G.IDENTITY[i].weight + 0.3 }) + idA(i)));
      if (!c.closed) out.push(line(f.px(+c.tz[c.tz.length - 1]), f.py(+c.hs[c.hs.length - 1]), f.px(+c.tz[0]), f.py(+c.hs[0]), W.attrs(W.CHOSEN, { width: 1.8 })));
    });
    /* each contour named beside its highest point, with its exact count outside */
    D.contours.slice().sort((a, b) => +b.maxHs - +a.maxHs).forEach((c, k) => {
      const lx = f.px(12.6), ly = f.py(9.1) + k * 15, px = f.px(+c.tzAtMaxHs), py = f.py(+c.maxHs), lab = c.method + ': ' + c.outside + ' out';
      out.push(line(px + 3, py, lx - 4, ly - 4, hair('--ink-5')));
      out.push(t(lx, ly, lab, 't-note'));
      if (!c.closed) out.push(mood(lx + lab.length * 6.9 + 5, ly, 'given'));
    });
    /* the largest hour on record, a decided knot */
    out.push('    <circle cx="' + n1(f.px(+big.u)) + '" cy="' + n1(f.py(+big.hs)) + '" r="3" class="w-decided" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>');
    out.push(t(f.px(+big.u) - 7, f.py(+big.hs) + 4, 'largest hour ' + (+big.hs).toFixed(2) + ' m', 't-note', 'end'));
    /* the key: the five classes, in the corner where no hour falls */
    const KX = f.px(0.6), KY = f.py(9.4);
    out.push(t(KX, KY - 14, 'hours per cell', 't-note'));
    CLASSES.forEach(([lo, hi], k) => { const y = KY + k * 13;
      out.push('    <rect x="' + n1(KX) + '" y="' + n1(y - 8) + '" width="10" height="8" fill="' + CH.SEQ[k] + '"/>');
      out.push(t(KX + 15, y, hi === Infinity ? lo + '+' : lo + '–' + hi, 't-note')); });
    out.push(head(f, 'every hour counted · each file as listed'));
    return svg(PW, PH, 'In WARRANT: the ' + D.hours + ' hourly sea states counted exactly into cells and drawn in five stated classes, so a single hour shows; three 20-year contours as their files list them, solid, decided, told apart by weight and opacity and named with their exact counts of hours outside; the edge the benchmark\'s test adds to close the one open file dotted, chosen, so its count holds given that edge; the largest hour on record a decided knot above all three.', out);
  })();
  return {
    id: 'ec-contours', title: 'Counts under a curve', form: 'an ordered field of counts with curves over it', kind: 'record', record: [REC, EX], stop: STOP, usual, warrant,
    link: 'instruments/contours/',
    rule: 'Draw counts as an ordered field in stated classes so a single count shows, draw each curve as its source lists it, and draw any edge the scorer adds to close it dotted, as a choice the count holds given.',
    hides: 'On a linear ramp only the dense core of the hours shows, and the hours a 20-year contour is scored on, a few single hours at the edge, vanish. Here every hour shows in a stated class, each contour carries its exact count outside, and the edge a test adds to close an open file is dotted.',
    caption: 'Dataset A of the environmental-contour benchmark (an NDBC buoy): ' + D.hours.toLocaleString('en-US') + ' hours of significant wave height Hs and zero-up-crossing period Tz, counted exactly into 0.25 s × 0.2 m cells, and the three submitted 20-year contours the matplotlib kit’s worked example carries, with the hours outside each, decided. The ' + open[0].method + ' file does not repeat its first vertex; the benchmark’s test closes it with a ' + (+open[0].closingEdgeLength * 100).toFixed(1) + ' cm edge, dotted here and almost too short to see, and its count holds <em>given</em> that edge.',
  };
}

/* =========================================== 6. a calibration and its set ==
   A rat IL-6 sandwich ELISA (/instruments/curveset): seven standards above zero on a dilution ladder, each with its
   stated error budget, and the curve everyone fits, a four-parameter logistic. The set of every monotone curve that
   passes within the budget of every standard is drawn as a band (closed form, evaluated in floating point by
   playground/curveset/envelope.js, so computed); the fit is one member of it, chosen by a criterion; a reading of
   0.9 OD is read back through both. */
function curveset(guard) {
  guard = makeGuard(guard);
  const REC = 'playground/curveset/out/page.json', ENV = 'playground/curveset/envelope.js';
  const S = readJson(REC).sets.find((x) => x.id === 'il6'), E = require(path.join(ROOT, ENV));
  const F = S.reported.form, fit = (x) => F.p[1] + (F.p[0] - F.p[1]) / (1 + Math.pow(x / F.p[2], F.p[3]));
  const R = S.rungs[0].r, rep = S.reported, ASK = S.ask;
  /* the band's standing is read from the arithmetic envelope.js declares, never typed: float takes decided to computed */
  const BAND = E.ARITHMETIC === 'exact' ? W.DECIDED : W.throughFloat(W.DECIDED);
  const keep = S.x.map((x, i) => i).filter((i) => S.x[i] > 0), blank = S.x.indexOf(0);
  const STOP = 'the fitted curve leaves the band at a standard above zero, the read-back under bare monotonicity stops being the two standards that bracket the reading, or the reported interval stops lying inside it';
  guard(STOP, S.rungs[0].kind === 'monotone' && keep.every((i) => Math.abs(fit(S.x[i]) - S.y[i]) <= S.errs[i])
    && Math.abs(R.lo - 12.5) < 1e-9 && Math.abs(R.hi - 25) < 1e-9 && S.y[4] + S.errs[4] < ASK && S.y[5] - S.errs[5] > ASK
    && rep.xHat - rep.uFit > R.lo && rep.xHat + rep.uFit < R.hi && blank === 0, JSON.stringify(R));
  const C = E.prepare(keep.map((i) => Math.log10(S.x[i])), keep.map((i) => S.y[i]), keep.map((i) => S.errs[i]), S.sense);
  const O = { w: PW, h: PH, padL: 46, padR: 14, padT: TOP, padB: 40, x0: 1, x1: 160, y0: 0, y1: 3.6, logX: true };
  const ticks = (f) => CH.axes(f, { yTicks: [0, 1, 2, 3].map((v) => ({ v, t: String(v) })), xTicks: [1, 3, 10, 30, 100].map((v) => ({ v, t: String(v) })) });
  const curve = (f) => { const P = []; for (let k = 0; k <= 160; k++) { const x = Math.pow(10, Math.log10(O.x0) + k / 160 * Math.log10(O.x1 / O.x0)); const y = fit(x); if (y <= O.y1) P.push([f.px(x), f.py(y)]); } return simplify(P, 0.3); };
  /* the band's two edges, sampled on a log grid that holds every standard and its two neighbours, so each step is exact */
  const grid = []; for (let k = 0; k <= 240; k++) grid.push(k / 240 * Math.log10(O.x1 / O.x0));
  C.x.forEach((u) => grid.push(u - 1e-9, u, u + 1e-9)); grid.sort((a, b) => a - b);
  const cy = (v) => Math.min(O.y1, Math.max(O.y0, v));
  const edge = (f, fn) => simplify(grid.map((u) => [f.px(Math.pow(10, u)), f.py(cy(fn(u)))]), 0.2);
  const bandU = (f) => edge(f, (u) => E.upper(C, u, 0, Infinity)), bandL = (f) => edge(f, (u) => E.lower(C, u, 0, Infinity));
  const xr = (f) => [f.px(R.lo), f.px(R.hi)];
  const usual = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'as usually drawn')];
    out.push(pathEl(dOf([curve(f)]), PLAIN));
    for (const i of keep) { const x = f.px(S.x[i]); out.push(line(x, f.py(S.y[i] - S.errs[i]), x, f.py(S.y[i] + S.errs[i]), PLAIN), GAL.atoms.plainDot(x, f.py(S.y[i]))); }
    const xh = f.px(rep.xHat), yh = f.py(ASK);
    out.push(line(f.L, yh, xh, yh, PLAIN.replace('1.6', '1')), line(xh, yh, xh, f.T + f.ph, PLAIN.replace('1.6', '1')));
    out.push(t(xh + 6, f.T + f.ph - 8, rep.xHat.toFixed(1) + ' ± ' + rep.uFit.toFixed(1) + ' pg/mL', 't-ax'));
    out.push(head(f, 'absorbance (OD) against pg/mL, log', 't-ax'));
    return svg(PW, PH, 'As usually drawn: seven standards with error bars and the fitted four-parameter logistic curve, all in one solid ink, and a reading of 0.9 OD read back through the curve to ' + rep.xHat.toFixed(1) + ' plus or minus ' + rep.uFit.toFixed(1) + ' pg/mL. The zero standard is silently left off the log axis, and nothing shows that the curve is one of many the standards allow.', out);
  })();
  const warrant = (() => {
    const f = CH.frame(O), out = [ticks(f), eyebrow(8, 14, 'in warrant')];
    const U = bandU(f), L = bandL(f);
    out.push(pathEl(dOf([U.concat(L.slice().reverse())], true), 'fill="var(--band-fill)" stroke="none"'));
    out.push(pathEl(dOf([U]), W.attrs(BAND, { width: 1.6 })), pathEl(dOf([L]), W.attrs(BAND, { width: 1.6 })));
    out.push(pathEl(dOf([curve(f)]), W.attrs(W.CHOSEN, { width: 2 })));
    for (const i of keep) out.push(GAL.atoms.knot(f.px(S.x[i]), f.py(S.y[i]), W.DECIDED));
    /* the read-back: a guide at the reading, the interval the band allows as an extent, the fit's own point and ± */
    const [a, b] = xr(f), yh = f.py(ASK), yb = f.T + f.ph - 5;
    out.push(line(f.L, yh, b, yh, GUIDE), line(a, yh, a, yb, GUIDE), line(b, yh, b, yb, GUIDE));
    out.push('    <rect x="' + n1(a) + '" y="' + n1(yb - 3) + '" width="' + n1(b - a) + '" height="6" fill="var(--ink-2)"/>');
    out.push(t(b + 6, yb + 4, OUT.down(R.lo, 1) + '–' + OUT.up(R.hi, 1) + ' pg/mL', 't-note'));
    out.push(line(f.px(rep.xHat - rep.uFit), yh, f.px(rep.xHat + rep.uFit), yh, W.attrs(W.CHOSEN, { width: 2.4 })));
    out.push(GAL.atoms.knot(f.px(rep.xHat), yh, W.CHOSEN, true));
    /* the fit's words in the empty corner under the band, right of the bracketing standard, with a hairline to its point */
    const fx = f.px(30), fy = f.py(0.5);
    out.push(line(f.px(rep.xHat) + 4, yh + 3, fx - 3, fy - 10, hair('--ink-5')));
    out.push(t(fx, fy - 4, 'the fit, chosen:', 't-note'), t(fx, fy + 10, rep.xHat.toFixed(2) + ' ± ' + rep.uFit.toFixed(2), 't-note'));
    out.push(mood(f.L + 4, yh - 6, 'given a reading of ' + ASK + ' OD'));
    out.push(t(f.L + 4, f.T + 14, 'blank, 0 pg/mL at ' + S.y[blank] + ' OD:', 't-note'), t(f.L + 4, f.T + 28, 'no place on a log axis', 't-note'));
    out.push(head(f, 'dashed: every curve that fits · dotted: the fit'));
    return svg(PW, PH, 'In WARRANT: the band of every monotone curve that passes within the stated error of all seven standards above zero, its edges dashed, computed, because the closed form is evaluated in floating point; the fitted logistic dotted inside it, chosen, one member picked by a fitting criterion; the standards as solid knots. A reading of 0.9 OD, a chosen example named in italic, reads back to the whole span from ' + OUT.down(R.lo, 1) + ' to ' + OUT.up(R.hi, 1) + ' pg/mL, drawn as an extent, against the fit\'s own ' + rep.xHat.toFixed(2) + ' plus or minus ' + rep.uFit.toFixed(2) + ', dotted. The blank at zero is said in words, because a log axis cannot place it.', out);
  })();
  return {
    id: 'il6-band', title: 'A calibration and its set', form: 'a band of every admissible fit around the published line', kind: 'record', record: [REC, ENV], stop: STOP, usual, warrant,
    link: 'instruments/curveset/',
    rule: 'Draw a fitted curve dotted inside the band of every curve the data and the stated assumption allow, read a measurement back through the band as an extent, and say in words any point the axis cannot place.',
    hides: 'The usual calibration plot draws one fitted curve through the standards and reads a sample back to a number with a narrow ±. The fit is one member of a set: assuming only that more analyte means more signal, the standards allow every curve in the band, and the reading is anywhere between the two standards that bracket it.',
    caption: 'A rat IL-6 sandwich ELISA, a published example standard curve: absorbance at 450 nm with a stated budget of 8% (floor 0.01 OD), k = 2. The band holds every monotone curve within budget at the seven standards above zero; the dotted curve is a four-parameter logistic fitted to those seven. A reading of ' + ASK + ' OD reads back to ' + OUT.down(R.lo, 1) + '–' + OUT.up(R.hi, 1) + ' pg/mL, ' + ((R.hi - R.lo) / (2 * rep.uFit)).toFixed(1) + ' times the fit’s ±. The blank (' + S.y[blank] + ' OD at 0 pg/mL) has no place on a log axis; the band and the fit both leave it out, and the fit extended to zero reads ' + fit(0).toFixed(3) + ' OD.',
  };
}

module.exports = {
  topic: { id: 'fields', title: 'Fields, images and physics',
    lead: 'A field from a model, an image as the set of its fits, a shape from its chords, an error budget and a calibration band: five ways to draw physical data, each from one of the instruments’ own records, first as a plotting library draws it and then in WARRANT.' },
  scenes: [navierStokes, interferometer, occultation, stereoBudget, curveset],
  /* the contour figure stands in the charts' gallery (the operator's ruling of 2026-10-30: "a contour figure in the
     gallery"), drawn by this file once and shown there, not twice on one page */
  chartScenes: [ecContours],
};
