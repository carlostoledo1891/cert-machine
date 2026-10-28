#!/usr/bin/env node
/* build-report-price.js — generate reports/price.html: the clearing price as a proved band.
   certs/price-band.json is re-derived during the build (exact rationals and the float port)
   and compared byte for byte; no page on a difference.
   usage: node tools/build-report-price.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const G = require(path.join(ROOT, 'design', 'grammar.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const TK = require(path.join(ROOT, 'design', 'tokens.js'));
/* WARRANT v2.1 (design/WARRANT.md), 2026-10-28. The closed form, the band, its width and its parts are DECIDED: exact
   rationals, solid lines, plain numbers. The finite-difference runs are floats at fixed meshes: COMPUTED, dashed lines
   and dashed-underlined numbers. The supply scenario and its ±15 % box are inputs someone picked (the lab's default
   sliders, a ρ chosen for the worked example): CHOSEN, dotted, and every decision below holds given them (rule 6).
   Figure 1 drew the box dashed "because it is assumed" until this pass; dashed means a float, and "assumed" is a
   premise's grade, carried by words in §5 (rule 11), never by the stroke. The band is carried from the box to a price
   by a model never held against a market, so it keeps its crisp edges and gains a halo (rule 13). */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
/* a premise names its record by path; at 390 px a path is one unbreakable word and pushed SkyAudit's page 63 px wide
   (the ruler, 2026-10-28). A break opportunity after each slash, nothing else changes. */
const PREM = (items, o) => W.premisesHtml(items, o).replace(/([\w.-])\/(?=[\w.-])/g, '$1/<wbr>');
const die = (m) => { console.error('PRICE REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
/* a bound rounds OUTWARD (rule 8): an upper end up, a lower end down */
const outF = (x, up, d) => { const k = 10 ** d; let v = (up ? Math.ceil(x * k) : Math.floor(x * k)) / k;
  while (up ? Number(v.toFixed(d)) < x : Number(v.toFixed(d)) > x) v += (up ? 1 : -1) / k; return v.toFixed(d); };
const outE = (x, up) => { const e = Math.floor(Math.log10(Math.abs(x))); return outF(x / 10 ** e, up, 1) + 'e−' + String(-e); };
const comp = (s, title) => W.value(C.esc(String(s)), W.COMPUTED, { title: title || 'a float from the finite-difference kernel at one mesh — computed, nothing decided it' });

try { cp.execSync('node instruments/price/run.js --check', { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { die('the live re-derivation differs from certs/price-band.json:\n' + (e.stderr || e.stdout || e.message)); }
/* the battery, so the counts and the measured agreements the page quotes are read, not typed (they were typed until
   2026-10-28: "23 checks, 5 red controls" and "the two agree to 1e−14" had no gate behind them) */
const t0 = Date.now();
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'instruments', 'price', 'battery.js')], { cwd: ROOT, encoding: 'utf8' });
const batSecs = (Date.now() - t0) / 1000;
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /ALL PASS\s+\((\d+) checks, (\d+) red controls\)/.exec(bout);
if (bat.status !== 0 || !bm) die('the price battery did not pass:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);
if ((bout.match(/RED ok/g) || []).length !== nReds) die('the battery\'s red count is not its RED lines');
const ric = /^PASS\s+E4 .*\[([0-9.e+-]+) · ([0-9.e+-]+)\]/m.exec(bout);
if (!ric) die('the Riccati cross-check line moved');
const ricMax = Math.max(Number(ric[1]), Number(ric[2]));
const RIC_T = 'the largest gap between the float Riccati route and the closed form, at η = 0 and η = 6 — measured by the battery at this build';
if (!(ricMax < 1e-14)) die('the Riccati route no longer agrees with the closed form to 1e−14: ' + ricMax);
if (!/^PASS\s+B2\s+twenty random supply paths inside the box price inside the band/m.test(bout)) die('the twenty interior paths are not checked');
if (!/^PASS\s+X5\s+RED ok: a supply path above the box prices below the band/m.test(bout)) die('the path above the box is not checked');
const REC = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'price-band.json'), 'utf8'));
if (REC.verdict !== 'PROVED') die('record verdict is ' + REC.verdict);
if (!REC.exact.ladder.every(L => L.certificate.verdict === 'PROVED')) die('a ladder certificate is not PROVED');
const { CAT, CTX } = TK.CHART;
const N = REC.model.N, hrs = (n) => 24 * n / N;
const L0 = REC.exact.ladder[0];
if (REC.exact.rho !== '3/20') die('the box is no longer ρ = 3/20');
const RHO_PCT = '15 %';
const f3 = (v) => v.toFixed(3), f4 = (v) => v.toFixed(4);
/* the box that would make the widest band one price unit: the width is linear in ρ, so ρ₁ = (3/20)/w exactly. It is a
   ceiling a forecaster must stay under, so it rounds DOWN; toFixed rounded it up, to 5.41 % for 5.4060… % */
const [wN, wD] = L0.maxWidth.exact.split('/').map(BigInt);
const rho1c = (1500n * wD) / wN;                        /* floor(100 × percent), exact */
const rhoFor1Pct = (Number(rho1c) / 100).toFixed(2);
if (!(Math.abs(Number(rhoFor1Pct) - 15 / L0.maxWidth.value) < 0.011 && Number(rhoFor1Pct) <= 15 / L0.maxWidth.value)) die('ρ₁ does not round down from the float');
const dayShare = L0.maxWidth.parts.day / L0.maxWidth.value;
const instMax = Math.max(...L0.band.width) - L0.maxWidth.parts.day;
const lostPct = 100 * REC.fdBox.lab.lost / REC.exact.energy.value;
const shadow = REC.exact.ladder[0].Pi0.value - REC.fdBox.consistent.PiMid;
/* the facts the prose states, gated on the record */
if (!(REC.lab.it === 49 && REC.fdBox.lab.it === 49)) die('the port no longer takes the lab\'s 49 iterations');
if (!(REC.fdBox.lab.clearGap < 1e-14 && REC.fdBox.constrained.clearGap < 1e-14)) die('the control-cleared kernels no longer clear to 1e−14');
const xiErr = Math.abs(REC.fdBox.consistent.XiErr);
if (!(xiErr < 1e-13)) die('the flux-cleared scheme no longer conserves to 1e−13: ' + xiErr);
const XI_ERR = outE(xiErr, true);                       /* "to 1e−14" was printed for a measured 1.04e−14 */
if (!(REC.fdBox.constrained.lost > 0 && REC.fdBox.constrained.lost < REC.fdBox.lab.lost)) die('the state-constraint walls no longer reduce the loss without removing it');
if (L0.certificate.falsifier.length !== 5) die('the certificate no longer carries five falsifiers');
/* convergence is MEASURED at two meshes only for η = 0; with the set-point potential on, one mesh was run. The page said
   "the maximal price error halves when H halves, at η = 0 and with the set-point potential on" until 2026-10-28. */
if (REC.wideRuns.consistent.length !== 2 || REC.wideRuns.lab.length !== 2) die('the convergence table is not two meshes');
if (REC.wideRuns.consistentEta.length !== 1) die('the η = 6 convergence now has ' + REC.wideRuns.consistentEta.length + ' meshes: say so on the page');
const ETA = REC.wideRuns.consistentEta[0];
if (!(REC.wideRuns.order > 1.6 && REC.wideRuns.order < 2.4 && REC.wideRuns.labOrder < 1)) die('the convergence orders moved out of the stated reading');
const every = (arr, k) => arr.filter((_, i) => i % k === 0 || i === arr.length - 1);
const series = (ys, k) => every(ys.map((y, n) => [hrs(n), y]), k || 1);
const xh = { xTicks: [0, 4, 8, 12, 16, 20, 24].map(v => ({ v, t: String(v) })), xOf: (v) => v.toFixed(1) + ' h' };

/* ---- figure 1: the supply and its box ----------------------------------------
   Both are INPUTS someone picked, so both are CHOSEN and dotted, drawn through W.attrs (the class sets the ink; identity
   is weight and opacity, design/grammar.js IDENTITY). charts.lines draws only solid or dashed, so this one figure is
   drawn on its frame here, the way bandFig is. */
const Qmax = Math.max(...REC.Q), Qnoon = REC.Q[N / 2];
function chosenFig(o, ser, alt) {
  const nLeg = ser.length;
  const f = CH.frame(Object.assign({}, o, { padB: 28 + 22 + 5 + nLeg * 19 }));
  const out = [CH.open({ w: f.w, h: f.h, alt })];
  out.push(CH.axes(f, o));
  for (const s of ser) {
    out.push('    <path d="' + s.pts.map((p, k) => (k ? 'L' : 'M') + f.px(p[0]).toFixed(2) + ' ' + f.py(p[1]).toFixed(2)).join(' ')
      + '" ' + W.attrs(W.CHOSEN, { width: s.width }) + (s.opacity ? ' opacity="' + s.opacity + '"' : '') + ' stroke-linejoin="round"/>');
  }
  ser.forEach((s, i) => {                                /* the key: the same stroke, one line each, under the axis label */
    const y = f.h - 7 - (nLeg - 1 - i) * 19;
    out.push('    <line x1="' + f.L + '" y1="' + (y - 4) + '" x2="' + (f.L + 22) + '" y2="' + (y - 4) + '" ' + W.attrs(W.CHOSEN, { width: s.width })
      + (s.opacity ? ' opacity="' + s.opacity + '"' : '') + '/>');
    out.push(CH.txt(f.L + 30, y, s.name, 't-note', 'start'));
  });
  out.push(CH.close);
  return out.join('\n');
}
const FIG_SUPPLY = chosenFig(Object.assign({
  w: 900, h: 300, x0: 0, x1: 24, y0: 0, y1: 1.25, yTicks: [0, 0.5, 1].map(v => ({ v, t: String(v) })), xLabel: 'hour of the day (the lab\'s T = 1 drawn as 24 h)', yLabel: 'supply Q(t)'
}, xh), [
  { name: 'the box\'s upper edge, Q (1 + ρ), ρ = 3/20 — chosen for this worked example', pts: series(REC.exact.boxHi, 2), width: 1.6, opacity: 0.62 },
  { name: 'the lab\'s supply scenario Q at its default sliders — chosen', pts: series(REC.Q, 2), width: 2.4 },
  { name: 'the box\'s lower edge, Q (1 − ρ) — chosen', pts: series(REC.exact.boxLo, 2), width: 1.6, opacity: 0.62 }
], 'A supply curve over 24 hours, low at dawn, rising to a peak of ' + Qmax.toFixed(2) + ' (' + Qnoon.toFixed(2) + ' at noon) and dipping at the end of the day, with two dotted curves 15 percent above and below it; all three are chosen inputs.');

/* ---- figure 2: the price band --------------------------------------------- */
function bandFig(L, opts) {
  const keys = [
    { token: CAT[0], t: 'the band: every supply path inside the box prices inside it; both edges attained (decided, given the model and the box)', kind: 'swatch' },
    { token: CAT[1], t: 'the price of the nominal path (decided, exact)', kind: 'line' }
  ];
  const nLeg = CH.legendLines(keys, 900 - 62 - 22);
  const ys = L.band.lo.concat(L.band.hi);
  const y0 = Math.floor(Math.min(...ys) * 2) / 2, y1 = Math.ceil(Math.max(...ys) * 2) / 2;
  const o = Object.assign({ w: 900, h: 320 + nLeg * 19, x0: 0, x1: 24, y0, y1, padB: 28 + 22 + 5 + nLeg * 19, xLabel: 'hour of the day', yLabel: 'clearing price ϖ(t)' + (opts && opts.yl ? opts.yl : '') }, xh);
  const f = CH.frame(o);
  const out = [CH.open({ w: f.w, h: f.h, alt: opts.alt })];
  out.push(CH.axes(f, Object.assign({}, o, { yTicks: [y0, y1, 0, -1, -2, -3, -4].filter(v => v >= y0 && v <= y1).map(v => ({ v, t: String(v) })) })));
  const up = L.band.hi.map((v, n) => (n ? 'L' : 'M') + f.px(hrs(n)).toFixed(1) + ' ' + f.py(v).toFixed(1)).join(' ');
  const dn = L.band.lo.map((v, n) => 'L' + f.px(hrs(n)).toFixed(1) + ' ' + f.py(v).toFixed(1)).reverse().join(' ');
  /* THE HALO (WARRANT rule 13): the band is carried from the supply box to a price by the Gomes–Saúde model, which
     nothing here held against a market. Its edges stay crisp, because the decision is made on them given the model; a
     blur of the same fill reaches past them, because the model's own error has no edge to draw. Same token, no new
     colour. */
  out.push('    <defs><filter id="price-halo" x="-5%" y="-40%" width="110%" height="180%"><feGaussianBlur stdDeviation="7"/></filter></defs>');
  out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.30" filter="url(#price-halo)"/>');
  out.push('    <path d="' + up + ' ' + dn + ' Z" fill="' + CAT[0] + '" opacity="0.14"/>');
  for (const edge of [L.band.hi, L.band.lo]) out.push('    <path d="' + edge.map((v, n) => (n ? 'L' : 'M') + f.px(hrs(n)).toFixed(1) + ' ' + f.py(v).toFixed(1)).join(' ') + '" fill="none" stroke="' + CAT[0] + '" stroke-width="2" stroke-linejoin="round"/>');
  out.push('    <path d="' + L.price.map((v, n) => (n ? 'L' : 'M') + f.px(hrs(n)).toFixed(1) + ' ' + f.py(v).toFixed(1)).join(' ') + '" fill="none" stroke="' + CAT[1] + '" stroke-width="2" stroke-linejoin="round"/>');
  const xm = f.px(hrs(L.maxWidth.at));
  out.push('    <line x1="' + xm.toFixed(1) + '" y1="' + f.T + '" x2="' + xm.toFixed(1) + '" y2="' + (f.T + f.ph) + '" stroke="' + CTX + '" stroke-width="1" stroke-dasharray="' + G.GUIDE + '"/>');
  out.push(CH.txt(xm + 7, f.T + 13, 'widest: ' + f4(L.maxWidth.value) + ' at ' + hrs(L.maxWidth.at).toFixed(0) + ' h', 't-note', 'start'));
  for (let n = 0; n <= N; n += 4) {
    out.push('    <rect ' + CH.hit('x="' + (f.px(hrs(n)) - 6).toFixed(1) + '" y="' + f.T + '" width="12" height="' + f.ph + '" fill="transparent" data-cmx="' + f.px(hrs(n)).toFixed(1) + '"', hrs(n).toFixed(1) + ' h', 'band [' + f4(L.band.lo[n]) + ', ' + f4(L.band.hi[n]) + '] · nominal ' + f4(L.price[n])) + '/>');
  }
  out.push(CH.legend(keys, f.L, f.h - 7, undefined, f.pw));
  out.push(CH.close);
  return out.join('\n');
}
/* the alt texts are read from the record too: the width figure's said "the instant term below 0.3" for a maximum of
   0.3047 until 2026-10-28 */
const wMin = Math.min(...L0.band.width), wMax = Math.max(...L0.band.width);
const FIG_BAND = bandFig(L0, { alt: 'A shaded band over 24 hours between two solid edges ' + outF(wMin, false, 2) + ' to ' + outF(wMax, true, 2) + ' price units apart, with the nominal price running through its middle and a soft halo past both edges; the band is widest at ' + hrs(L0.maxWidth.at).toFixed(0) + ' h.' });

/* ---- figure 3: what the width is made of -------------------------------------- */
const FIG_WIDTH = CH.lines(Object.assign({
  w: 900, h: 300, x0: 0, x1: 24, y0: 0, y1: 3.2, yTicks: [0, 1, 2, 3].map(v => ({ v, t: String(v) })), xLabel: 'hour of the day', yLabel: 'width of the band', hover: false,
  series: [
    { name: 'the width, exact: c·2ρQ(t) + γ·2ρ∫Q', pts: series(L0.band.width, 2) },
    { name: 'the day term γ·2ρ∫Q = ' + f4(L0.maxWidth.parts.day) + ': the whole day\'s energy, the same at every hour', pts: [[0, L0.maxWidth.parts.day], [24, L0.maxWidth.parts.day]], token: CTX },
    { name: 'the instant term c·2ρQ(t): what this hour\'s forecast error costs', pts: series(L0.band.width.map((w, n) => w - L0.maxWidth.parts.day), 2) }
  ],
  alt: 'Three curves: the band\'s width, between ' + outF(wMin, false, 2) + ' and ' + outF(wMax, true, 2) + ', the constant day term at ' + f3(L0.maxWidth.parts.day) + ' just under it, and the instant term, never above ' + outF(instMax, true, 3) + '.'
}, xh));

/* ---- figure 4: the set-point potential bends the price-supply line ----------- */
const FIG_ETA = CH.lines(Object.assign({
  w: 900, h: 320, x0: 0, x1: 24, y0: Math.floor(Math.min(...REC.exact.ladder.map(L => Math.min(...L.Pi)))), y1: Math.ceil(Math.max(...REC.exact.ladder.map(L => Math.max(...L.Pi)))),
  xLabel: 'hour of the day', yLabel: 'Π(t), the offset −(ϖ + cQ)', hover: false, yTicks: [1, 1.5, 2, 2.5, 3].map(v => ({ v, t: String(v) })),
  series: REC.exact.ladder.map(L => ({ name: 'η = ' + L.eta + (L.eta !== '0' ? ', κ = ' + L.kappa : '') + (L.eta === '0' ? ': the paper\'s constant Θ = ' + f4(-L.Pi[0]) : ''), pts: series(L.Pi, 2) })),
  alt: 'Three curves of the offset between price and supply: flat at ' + f3(L0.Pi0.value) + ' for eta ' + REC.exact.ladder[0].eta + ', and rising then falling through the day for eta ' + REC.exact.ladder.slice(1).map(L => L.eta).join(' and eta ') + ', the larger eta the larger the excursion.'
}, xh));

/* ---- figure 5: the lab's fleet against conservation ----------------------------- */
const FIG_XI = CH.lines(Object.assign({
  w: 900, h: 320, x0: 0, x1: 24, y0: 0.25, y1: 1.0, yTicks: [0.25, 0.5, 0.75, 1].map(v => ({ v, t: String(v) })), xLabel: 'hour of the day', yLabel: 'Ξ(t), the fleet\'s mean charge', hover: false,
  series: [
    { name: 'Ξ(t) = x̄₀ + ∫₀ᵗQ — what clearing requires (decided, exact)', pts: series(L0.Xi, 2), token: CAT[0] },
    { name: 'the lab\'s kernel: cleared in the controls, ' + f4(REC.fdBox.lab.lost) + ' short by nightfall (computed)', pts: series(REC.fdBox.lab.Xi, 2), token: CTX, dashed: true },
    { name: 'walls made state constraints, still clearing on the controls: ' + f4(REC.fdBox.constrained.lost) + ' short (computed)', pts: series(REC.fdBox.constrained.Xi, 2), token: CAT[2], dashed: true },
    { name: 'clearing on the Fokker–Planck flux: conserves to ' + XI_ERR + ' (computed)', pts: series(REC.fdBox.consistent.Xi, 2), token: CAT[1], dashed: true }
  ],
  alt: 'The exact mean charge rises from ' + REC.exact.xbar0.value.toFixed(2) + ' to ' + REC.exact.XiT.value.toFixed(2) + ' over the day; three dashed curves from the finite-difference kernel follow it at first and fall away, the lab\'s ending at ' + REC.fdBox.lab.XiT.toFixed(2) + ', the constrained one at ' + REC.fdBox.constrained.XiT.toFixed(2) + ', the flux-cleared one on the exact line.'
}, xh));

/* ---- figure 6: three prices on the box ------------------------------------------ */
const allP = L0.price.concat(REC.fdBox.lab.price, REC.fdBox.consistent.price);
const FIG_PRICES = CH.lines(Object.assign({
  w: 900, h: 320, x0: 0, x1: 24, y0: Math.floor(Math.min(...allP) * 2) / 2, y1: Math.ceil(Math.max(...allP) * 2) / 2, yTicks: [-4, -3, -2, -1, 0].filter(v => v >= Math.floor(Math.min(...allP) * 2) / 2 && v <= Math.ceil(Math.max(...allP) * 2) / 2).map(v => ({ v, t: String(v) })), xLabel: 'hour of the day', yLabel: 'clearing price ϖ(t)', hover: false,
  series: [
    { name: 'the exact price on the whole line, ϖ = Θ − cQ (decided)', pts: series(L0.price, 2), token: CAT[0] },
    { name: 'the lab\'s kernel on its box [0, 1] (computed): Π ≈ ' + f3(REC.fdBox.lab.PiMid) + ' at noon', pts: series(REC.fdBox.lab.price, 2), token: CTX, dashed: true },
    { name: 'the flux-cleared box (computed): Π ≈ ' + f3(REC.fdBox.consistent.PiMid) + ' at noon — the wall\'s shadow price is the gap to Θ', pts: series(REC.fdBox.consistent.price, 2), token: CAT[1], dashed: true }
  ],
  alt: 'Three price curves with the same shape, the supply upside down: the exact one lowest, at ' + L0.price[N / 2].toFixed(2) + ' at noon, the flux-cleared box ' + shadow.toFixed(2) + ' above it, the lab\'s kernel ' + (L0.Pi0.value - REC.fdBox.lab.PiMid).toFixed(2) + ' above it, at ' + REC.fdBox.lab.price[N / 2].toFixed(2) + ' at noon.'
}, xh));

/* ---- tables ---- */
const T_BOX = C.table({
  cols: [{ h: 'the scheme on the lab\'s box' }, { h: 'Ξ(T), the fleet at nightfall', cls: 'v' }, { h: 'energy lost', cls: 'v' }, { h: 'Π at noon', cls: 'v' }, { h: 'density at the wall, T', cls: 'v' }, { h: 'iterations · residual', cls: 'v' }],
  rows: [
    ['the lab\'s kernel as it is (walls: u_x = 0 outside; clearing on the controls)', { raw: comp(f4(REC.fdBox.lab.XiT)) }, { raw: comp(f4(REC.fdBox.lab.lost) + ' (' + lostPct.toFixed(1) + ' % of the day)') }, { raw: comp(f4(REC.fdBox.lab.PiMid)) }, { raw: comp(f3(REC.fdBox.wallDensityT.lab)) }, { raw: comp(REC.fdBox.lab.it + ' · ' + REC.fdBox.lab.res.toExponential(1)) }],
    ['walls as state constraints (no control into a wall); clearing on the controls', { raw: comp(f4(REC.fdBox.constrained.XiT)) }, { raw: comp(f4(REC.fdBox.constrained.lost)) }, { raw: comp(f4(REC.fdBox.constrained.PiMid)) }, { raw: comp(f3(REC.fdBox.wallDensityT.constrained)) }, { raw: comp(REC.fdBox.constrained.it + ' · ' + REC.fdBox.constrained.res.toExponential(1)) }],
    ['state-constraint walls; clearing on the Fokker–Planck flux (ours)', { raw: comp(f4(REC.fdBox.consistent.XiT)) }, { raw: comp(Math.abs(REC.fdBox.consistent.lost).toExponential(1)) }, { raw: comp(f4(REC.fdBox.consistent.PiMid)) }, { raw: comp(f3(REC.fdBox.wallDensityT.consistent)) }, { raw: comp(REC.fdBox.consistent.it + ' · ' + REC.fdBox.consistent.res.toExponential(1)) }],
    [{ raw: '<b>the exact model on the whole line</b>' }, { raw: '<b>' + f4(REC.exact.XiT.value) + '</b>' }, { raw: '<b>0, by identity</b>' }, { raw: '<b>' + f4(L0.Pi0.value) + '</b>' }, '—', 'none: closed form']
  ]
});
if (!REC.wideRuns.consistent.concat(REC.wideRuns.consistentEta, REC.wideRuns.lab).every(c => c.converged)) die('a wide-domain run did not converge — the table says they all did');
const wideRow = (label, c) => [label, { raw: C.m(c.NX + ' × ' + c.NT + ', H = ' + c.H.toFixed(4)) }, { raw: comp(f4(c.maxErr)) }, { raw: comp(c.XiErr.toExponential(1)) }, { raw: comp(f4(c.PiMid)) + ' vs ' + f4(c.PiMidExact) }];
if (!(ETA.eta === 6)) die('the set-point run is no longer η = 6');
const wideRows = REC.wideRuns.consistent.map(c => wideRow('state-constraint walls + flux clearing, η = 0', c))
  .concat(REC.wideRuns.consistentEta.map(c => wideRow('the same with η = 6, κ = 0.6 (one mesh only)', c)))
  .concat(REC.wideRuns.lab.map(c => wideRow('the lab\'s walls and clearing', c)));
const T_WIDE = C.table({
  cols: [{ h: 'scheme on [−1, 2], walls far from the fleet' }, { h: 'mesh' }, { h: 'max |ϖ_fd − ϖ_exact|', cls: 'v' }, { h: 'max |Ξ_fd − Ξ_exact|', cls: 'v' }, { h: 'Π at noon, fd vs exact', cls: 'v' }],
  rows: wideRows
});
const T_CERT = C.table({
  cols: [{ h: 'η' }, { h: 'κ' }, { h: 'Π(0)', cls: 'v' }, { h: 'Π(T)', cls: 'v' }, { h: 'widest band', cls: 'v' }, { h: 'at', cls: 'v' }, { h: 'instant · day · set-point parts of it', cls: 'v' }, { h: 'verdict' }],
  rows: REC.exact.ladder.map(L => [L.eta, L.eta === '0' ? '—' : L.kappa, f4(L.Pi0.value), f4(L.PiT.value), f4(L.maxWidth.value), hrs(L.maxWidth.at).toFixed(0) + ' h', f3(L.maxWidth.parts.inst) + ' · ' + f3(L.maxWidth.parts.day) + ' · ' + f3(L.maxWidth.parts.set), { raw: C.tag('PROVED') }])
});

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · exact arithmetic on a published model, re-derived at every build',
  title: 'The clearing price, as a proved band',
  deck: 'In the Gomes–Saúde model the electricity price is not a function anyone writes down: it is the Lagrange multiplier that makes '
    + 'a fleet of batteries absorb exactly what the grid produces. For the linear-quadratic case the paper solves it by a Volterra '
    + 'equation and a Laplace transform, up to one implicit constant. With quadratic terminal data that constant is explicit, the price '
    + 'closes in three lines, and it is affine in the supply path with every coefficient non-positive. So a forecast given as a box — '
    + 'this much supply, give or take — turns into a price band that is a theorem: every path inside the box prices inside the band, '
    + 'both edges are reached, and the whole thing is decided in exact rationals. The page then holds the source lab\'s own '
    + 'finite-difference kernel against the closed form and finds where its market clears and its batteries do not.'
}));

O.push(C.tldr({
  findingRaw: 'On the lab\'s supply scenario the price-supply line is ϖ = Θ − cQ with Θ ≈ ' + f4(REC.exact.theta.value) + ', an exact rational rounded to four decimals (the paper\'s (25)/(30), re-decided), and a ' + RHO_PCT + ' box on the supply gives a price band '
    + f4(L0.maxWidth.value) + ' wide at its widest, ' + (100 * dayShare).toFixed(0) + ' % of which is the day\'s total energy rather than the hour\'s — <em>given the lab\'s scenario and ρ = 3/20</em>. The lab\'s kernel clears its market in the agents\' controls to 1e−14 and still ends the day with ' + comp(f4(REC.fdBox.lab.lost)) + ' of the ' + f4(REC.exact.energy.value) + ' it cleared missing — ' + comp(lostPct.toFixed(0) + ' %') + ' vanishes at the wall. Clearing on the flux instead conserves, and then approaches the closed form at first order.',
  mechanismRaw: 'Π = ∫u_x m and Ξ = ∫x m obey Ξ̇ = Q and Π̇ = −η(Ξ − κ) (the paper\'s §6.2); quadratic terminal data gives Π(T) = γ(Ξ(T) − ζ), so ϖ = −cQ − γ(Ξ(T) − ζ) − η∫ₜᵀ(Ξ − κ). Every quantity is a rational number of the data and is computed as one. The lab\'s kernel is ported bit for bit (fd.js) and run three ways. What the band rests on, and how far each premise was checked, is §5.',
  checkRaw: C.m('node instruments/price/battery.js') + ' (' + nChecks + ' checks, ' + nReds + ' of them red controls, ' + comp('about ' + (Math.round(batSecs / 5) * 5) + ' s', 'the wall-clock of the battery at this build — a measurement') + ') re-derives the record, decides the identities exactly, checks the closed form against an independent Riccati route (they agree to ' + comp(outE(ricMax, true), RIC_T) + '), and measures the kernel.'
}));

O.push(C.stats([
  { k: 'Θ, the price-supply offset', v: f4(REC.exact.theta.value), role: 'held', n: 'decided exactly: Π_n = −Θ at all ' + (N + 1) + ' grid times as a rational identity; Θ = −γ(∫Q + x̄₀ − ζ), the paper\'s (30)' },
  { k: 'the widest band', v: f4(L0.maxWidth.value), role: 'held', n: 'at ' + hrs(L0.maxWidth.at).toFixed(0) + ' h, for a ' + RHO_PCT + ' box; twenty random paths inside the box priced inside it, exactly; both edges attained' },
  { k: 'the day, not the hour', v: (100 * dayShare).toFixed(0) + ' %', role: 'held', n: 'of the widest band is γ·2ρ∫Q, the uncertainty in the day\'s total energy; the hour\'s own forecast error is c·2ρQ(t) ≤ ' + outF(instMax, true, 3) },
  { k: 'a band one unit wide', v: rhoFor1Pct + ' %', role: 'held', n: 'the largest box that buys it, rounded down: the width is linear in ρ, so ρ = ' + RHO_PCT + ' × 1/' + f3(L0.maxWidth.value) + '. The threshold a forecaster is asked to meet' },
  { k: 'the lab\'s wall', vRaw: comp('−' + lostPct.toFixed(1) + ' %'), role: 'warn', nRaw: 'of the day\'s cleared energy never enters a battery: Ξ(T) = ' + comp(f4(REC.fdBox.lab.XiT)) + ' against ' + f4(REC.exact.XiT.value) + '; the density at x = 1 reaches ' + comp(f3(REC.fdBox.wallDensityT.lab)) },
  { k: 'first order, once it conserves', vRaw: comp(f3(REC.wideRuns.order)), role: 'held', nRaw: 'error ratio for H halved on a domain where the walls do not bind, flux-cleared, η = 0; the lab\'s walls give ' + comp(f3(REC.wideRuns.labOrder)) + ' — the error grows with refinement' }
]));

/* X5 moves the box's upper edge up by 1/10 at every hour (an absolute 0.1, not a tenth of the edge) */
if (!/const Qout = hi\.map\(h => add\(h, Rn\.R\(1n, 10n\)\)\);/.test(fs.readFileSync(path.join(ROOT, 'instruments', 'price', 'battery.js'), 'utf8'))) die('the path above the box is no longer 0.1 above its upper edge');
if (!(REC.lab.NX === 120 && REC.lab.NT === 240 && REC.fdBox.lab.price.length === N + 1)) die('the lab\'s mesh moved');
const LEG = W.legendHtml({ compact: true, exclude: [W.REFUSED] });

O.push(C.section({
  lab: '§1 · the model', title: 'A price that is a multiplier',
  bodyRaw: '<div class="col">'
    + C.pRaw('Each agent holds a charge x and chooses a rate α of buying (α > 0) or selling. The running cost is c α²/2 + ϖ(t) α + η (x − κ)²/2 — wear, payment at the spot price, and a set-point preference — and the terminal cost is γ (x − ζ)²/2. The price ϖ(t) is whatever makes the fleet\'s total purchase equal the grid\'s production Q(t):')
    + C.eq(C.esc('−u_t + (ϖ + u_x)²/(2c) − η(x − κ)²/2 = 0,      m_t − (m (ϖ + u_x))_x / c = 0,      (1/c) ∫ (ϖ + u_x) m dx = −Q(t).'))
    + C.pRaw('Gomes and Saúde prove existence and uniqueness of (u, m, ϖ) with ϖ Lipschitz, then work the linear-quadratic case. Two averages carry the price: Π(t) = ∫u_x m and Ξ(t) = ∫x m. The paper derives Ξ̇ = Q — the fleet\'s mean charge rises by exactly what the grid produces, conservation of energy — and Π̇ = −η(Ξ − κ), then solves for Π by a Volterra equation with a separable kernel and a Laplace transform, leaving Π(0) to be fixed implicitly. With quadratic terminal data Π(T) = ∫γ(x − ζ) m(T) = γ(Ξ(T) − ζ) is explicit, and the pair integrates in closed form:')
    + C.eq(C.esc('Ξ(t) = x̄₀ + ∫₀ᵗ Q,      Π(t) = γ (Ξ(T) − ζ) + η ∫ₜᵀ (Ξ(s) − κ) ds,      ϖ(t) = −c Q(t) − Π(t).'))
    + C.pRaw('This is elementary, and for η = 0 it is the paper\'s own line ϖ = Θ − cQ with Θ = −γ(∫₀ᵀQ + x̄₀ − ζ). What it buys is the shape: the price is affine in the supply path, and every coefficient is ≤ 0 when c, γ, η ≥ 0. More supply at any hour lowers the price at every hour, never raises it. Supply on the grid is a step function, Q_n on [t_n, t_{n+1}), so with rational data every quantity above is a rational number, and the instrument computes it as one. The battery checks the closed form against an independent route — the quadratic ansatz u = a x² + b x + e, a Riccati equation for a and a linear one for b, integrated in float — and the two agree to ' + comp(outE(ricMax, true), 'the largest gap between the float Riccati route and the closed form, at η = 0 and η = 6 — measured by the battery at this build') + '.')
    + '</div>'
    + C.figure({ svgRaw: FIG_SUPPLY, caption: 'Figure 1 · The supply scenario of the source lab at its default sliders — a dawn cut, a midday plateau, a dip at the end of the day — and the forecast box Q(1 ± ρ), ρ = ' + RHO_PCT + '. All three lines are dotted because all three are chosen: the scenario is the lab\'s default, and ρ is picked for this worked example. Every decision on this page holds given them. Nothing is claimed about which path inside the box the day will follow; the box is the weakest thing one can say about a forecast.' })
    + '<div class="col">' + LEG + '</div>'
}));

O.push(C.section({
  lab: '§2 · the band', title: 'Every path in the box prices inside it',
  bodyRaw: '<div class="col">'
    + C.pRaw('Because the price falls with supply coordinate-wise, the band over the box is attained at its corners: the lowest price at every hour is the price of the upper edge Q(1 + ρ), the highest is the price of the lower edge, and these are prices of actual paths, so the band is tight. The certificate says exactly that, carries ' + L0.certificate.falsifier.length + ' falsifiers, and is decided by exact arithmetic: twenty random paths inside the box price inside the band at all ' + (N + 1) + ' grid times, and a path 0.1 above the box\'s upper edge at every hour prices below it.')
    + '</div>'
    + C.figure({ svgRaw: FIG_BAND, caption: 'Figure 2 · The price band for the ' + RHO_PCT + ' box, η = 0. The fill is the set of prices the box admits; the two solid edges are the prices of the box\'s edges; the middle line is the price of the nominal path. Widest at ' + hrs(L0.maxWidth.at).toFixed(0) + ' h, where the supply peaks: ' + f4(L0.maxWidth.value) + ', decided as the rational ' + L0.maxWidth.exact + '. The soft halo past both edges is the model\'s own error: the band is exact about the Gomes–Saúde model, which nothing here has held against a market, so that error has no edge to draw.' })
    + '<div class="col">'
    + C.pRaw('The width has an anatomy, and it is the finding of this section. At hour t the width is c·2ρQ(t) + γ·2ρ∫₀ᵀQ + (the η term): the hour\'s own forecast error, the day\'s total forecast error, and the set-point term. On this scenario the day term is ' + f4(L0.maxWidth.parts.day) + ' and the instant term never exceeds ' + outF(instMax, true, 3) + ': ' + (100 * dayShare).toFixed(0) + ' % of the band at its widest is uncertainty about how much energy the whole day will bring, not about this hour. A forecaster who wants the band at most one price unit wide needs a box of at most ' + rhoFor1Pct + ' % (rounded down), and needs it on the integral more than on the hour. That is the threshold the page publishes: the disclosure that would narrow the price.')
    + '</div>'
    + C.figure({ svgRaw: FIG_WIDTH, caption: 'Figure 3 · The width of the band and its parts. The flat line is the day term, the same at every hour; the lower curve is the instant term, the supply\'s shape scaled by 2ρc. The width is their sum exactly, checked as a rational identity at every grid time.' })
    + '<div class="col">'
    + C.pRaw('With a set-point preference η > 0 the price-supply relation stops being a line. Π(t) picks up η∫ₜᵀ(Ξ − κ): while the fleet\'s mean is above the set point the offset grows toward the past, and the price the market clears at depends on where the fleet is going to be, not only on how much it will have absorbed. The band is still attained at the corners — the η term has non-positive coefficients too — and its set-point part is tabulated.')
    + '</div>'
    + C.figure({ svgRaw: FIG_ETA, caption: 'Figure 4 · The offset Π(t) = −(ϖ + cQ) for three set-point strengths on the same supply. At η = 0 it is the constant Θ of the paper; at η > 0 with κ = 0.6 it bends, by more as η grows. All three are exact.' })
    + T_CERT
}));

O.push(C.section({
  lab: '§3 · the lab\'s kernel', title: 'A market that clears and batteries that do not fill',
  bodyRaw: '<div class="col">'
    + C.pRaw('The source lab solves this model on the battery box [0, 1] with an implicit upwind scheme, Anderson-accelerated on the clearing map, and reports a residual measured before the step it judges. That kernel is ported here bit for bit — the same ' + REC.lab.it + ' iterations to the same residual, the same price to the last binary digit — with the domain, the walls and the clearing rule made parameters. It clears: the fleet\'s purchase matches Q to 1e−14 at every time step. And the fleet ends the day at Ξ(T) = ' + comp(f4(REC.fdBox.lab.XiT)) + ' when conservation says ' + f4(REC.exact.XiT.value) + '. The gap, ' + comp(f4(REC.fdBox.lab.lost)) + ', is ' + comp(lostPct.toFixed(1) + ' %') + ' of the day\'s energy, and it is at the wall: the density at x = 1 reaches ' + comp(f3(REC.fdBox.wallDensityT.lab)) + ' by nightfall.')
    + C.pRaw('The mechanism is two lines of the scheme. At a wall the missing neighbour counts as u_x = 0, so an agent at full charge still sees the price and may point its control into the wall; the payment enters the Lagrangian and the purchase enters the clearing sum. The Fokker–Planck step then sets the flux through the wall to zero. Energy is bought, counted as cleared, and never stored. Forbid the wall-pointing control — the state-constraint boundary condition — and the loss falls to ' + comp(f4(REC.fdBox.constrained.lost)) + ' but does not vanish, because the clearing sum still counts controls at cells the flux cannot leave. Clear on the discrete flux of the Fokker–Planck step itself, one bisection per time step, and Ξ(T) matches the exact model to ' + comp(XI_ERR) + '.')
    + '</div>'
    + C.figure({ svgRaw: FIG_XI, caption: 'Figure 5 · The fleet\'s mean charge through the day. Solid: what clearing requires, Ξ = x̄₀ + ∫Q, exact. Dashed: three runs of the same kernel — as the lab wrote it, with state-constraint walls, and with flux clearing. Only the last conserves. Dashed is computed: none of the three is an authority here.' })
    + '<div class="col">' + LEG + '</div>'
    + T_BOX
    + '<div class="col">'
    + C.pRaw('Once the scheme conserves, the box\'s price can be read against the whole line\'s. At noon the flux-cleared box gives Π ≈ ' + comp(f3(REC.fdBox.consistent.PiMid)) + ' where the closed form gives ' + f3(L0.Pi0.value) + ': a gap of ' + comp(f3(shadow)) + ' that is the wall\'s shadow price, the model\'s own statement that a fleet that cannot exceed full charge does not need to be paid as much to absorb the day. The lab\'s kernel put the same number at ' + comp(f3(REC.fdBox.lab.PiMid)) + ', and that was the leak talking, not the wall. Whether the wall\'s shadow price is ' + comp(f3(shadow)) + ' or something near it is a float statement at one mesh; what is decided is the whole-line value and the fact that only the conserving scheme is measuring the model.')
    + '</div>'
    + C.figure({ svgRaw: FIG_PRICES, caption: 'Figure 6 · Three prices on the lab\'s scenario. Solid: the exact whole-line price ϖ = Θ − cQ. Dashed: the lab\'s kernel and the flux-cleared box, both computed on [0, 1] at NX = ' + REC.lab.NX + ', NT = ' + REC.lab.NT + '. The three share the supply\'s shape; they differ by their offsets. The hook at 24 h on the dashed curves is the kernel\'s own last grid point, where its price is read from the terminal condition rather than from the iteration.' })
}));

O.push(C.section({
  lab: '§4 · convergence', title: 'The closed form, approached from the mesh',
  bodyRaw: '<div class="col">'
    + C.pRaw('Move the walls to [−1, 2], where the fleet never reaches them, and the flux-cleared scheme must approach the closed form as the mesh refines. At η = 0 it does, at first order: the maximal price error goes from ' + comp(f4(REC.wideRuns.consistent[0].maxErr)) + ' to ' + comp(f4(REC.wideRuns.consistent[1].maxErr)) + ' when H halves, a ratio of ' + comp(f3(REC.wideRuns.order)) + '. With the set-point potential on (η = 6) only the coarser mesh was run: its error, ' + comp(f4(ETA.maxErr)) + ', sits beside the η = 0 run\'s at the same mesh, and the order there is not measured. The lab\'s wall treatment on the same domain does not approach it — its error grows with refinement, ratio ' + comp(f3(REC.wideRuns.labOrder)) + ' — because the wall cell\'s free purchase lowers u there and the backward equation carries the cheaper value inward. That is a red control on the page\'s own claim: if the closed form were wrong, the conserving scheme would not converge to it either. Every run in the table converged to its 1e−9 clearing residual.')
    + '</div>' + T_WIDE
}));

/* §5 — the "Assumed." item of this list became the premise chain (WARRANT rule 11): the same premises, each with the
   rung its checking reached and the record behind it, and the weakest named. Nothing was dropped. */
O.push(C.section({
  lab: '§5 · the honest boundary', title: 'What is claimed, and what is not',
  bodyRaw: '<div class="col">' + C.plainList([
    { b: 'Decided.', text: 'Θ; Π_n = −Θ at every grid time for η = 0; Ξ(T) = x̄₀ + ∫Q; the terminal identity and the step identity for η > 0; the band, its attainment at the corners, twenty interior paths inside it; the width\'s decomposition. All as rational identities on the lab\'s supply entered losslessly (a double is m·2^e).' }
  ])
    + C.pRaw('<b>What it rests on.</b> In the order the band travels through them, each premise with the rung its checking reached — <b>validated</b> (against the thing itself, held out), <b>compared</b> (against a model that keeps more), <b>verified</b> (the code against an exact solution of its own equations) or <b>assumed</b> (adopted; nothing here checked it):')
    + PREM([
      { grade: W.ASSUMED, label: 'The supply scenario and its box',
        evidence: 'the source lab\'s supply at its default sliders, entered losslessly, and a box of ρ = 3/20 around it. Both are picked for a worked example, not forecasts: no correlation between hours is assumed, which is why the corners are attained. Supply is a step function on the grid; the price at t_n is its right limit.' },
      { grade: W.ASSUMED, label: 'The model',
        evidence: 'the paper\'s (33) on the whole line, first order (ε = 0), with quadratic terminal data; the closed form rests on the paper\'s averaged dynamics, an identity for C² solutions with decaying density, cited and not re-proved here. Nothing here holds the model\'s price against a market\'s.' },
      { grade: W.VERIFIED, label: 'The closed form, and the code that evaluates it',
        evidence: 'an independent float route through the same equations (the quadratic ansatz and its Riccati equation) agrees with it to ' + outE(ricMax, true) + ' at η = 0 and η = 6 (instruments/price/battery.js E4, run at this build); the conserving finite-difference scheme approaches it at first order on a domain where the walls do not bind (ratio ' + f3(REC.wideRuns.order) + ', certs/price-band.json wideRuns). The identities themselves are decided in exact rationals.' },
    ], { meetLine: 'The arithmetic is exact and the closed form is verified; the weakest premise is <b>assumed</b>. The band is a theorem <em>given the model, the scenario and the box</em>; what it says about a real market rests on a model nobody here has held against one, which is what the halo in Figure 2 draws.' })
    + C.plainList([
    { b: 'Measured, not decided.', text: 'Everything about the finite-difference kernel: the leak, the wall density, the shadow price, the convergence ratios. Floats at fixed meshes, drawn dashed. The port reproduces the lab bit for bit at the lab\'s parameters; the two generalisations — state-constraint walls and flux clearing — are this instrument\'s, and they are a diagnosis of a scheme, not a statement about the source lab\'s other results.' },
    { b: 'Not claimed.', text: 'Novelty of the closed form (it is three lines from the paper\'s own §6.2 and may well be known to its authors); anything for non-quadratic terminal data, where Π(T) needs the whole terminal density; anything about ε > 0; that a ' + RHO_PCT + ' box is a realistic forecast — it is a worked example of the certificate, with the lab\'s scenario as data.' },
    { b: 'Occupied, and cited.', text: 'The monotone semi-Lagrangian discretisation of this model with a convergence proof is Ashrafyan–Gomes (2024/25); the kernel measured here is the source lab\'s, not theirs.' }
  ]) + '</div>'
}));

/* the title said "Twenty seconds" for two commands that take about forty-five between them; it names the commands now, and the TL;DR carries the battery's measured time */
O.push(C.section({
  lab: '§6 · check it', title: 'Two commands on your machine',
  bodyRaw: '<div class="col">'
    + C.code('node instruments/price/battery.js       # ' + nChecks + ' checks, ' + nReds + ' red controls: identities exact, band attained, Riccati to ' + outE(ricMax, true).replace('−', '-') + ', kernel measured\nnode instruments/price/run.js --check   # the record, re-derived and compared byte for byte')
    + C.pRaw('The instrument is <span class="m">instruments/price/price.js</span> (exact) with <span class="m">fd.js</span> (the port) and <span class="m">derive.js</span>; the record is <span class="m">certs/price-band.json</span>. The certificate\'s falsifiers, as recorded: ' + L0.certificate.falsifier.map(s => '<em>' + C.esc(s) + '</em>').join('; ') + '.')
    + '</div>'
}));

O.push(C.section({
  lab: 'references', title: 'Sources',
  bodyRaw: '<div class="col">' + C.plainList([
    { raw: 'D. A. Gomes, J. Saúde, <em>A mean-field game approach to price formation in electricity markets</em>, arXiv:1807.07088 (2018); Dynamic Games and Applications 11 (2021) — the model, Theorem 1, and §6 (linear-quadratic: (25), (30), (32), the Volterra route of §6.2).' },
    { raw: 'Y. Ashrafyan, D. A. Gomes, <em>A fully-discrete semi-Lagrangian scheme for a price formation MFG model</em>, arXiv:2403.02785 (2024, revised 2025) — a monotone discretisation with a convergence proof; cited as the occupied method, not measured here.' },
    { raw: 'The source lab: sin-mfg research/mfg-lab/mfg-lab.html, module MPR (kernel sha256 65c89093…, artifact sha256 37c0e3bd…), read-only; ported in <span class="m">instruments/price/fd.js</span> and reproduced bit for bit on 2026-09-07.' },
    { raw: '<a href="afg.html">The first-order game by its current</a>, <a href="monoflow.html">the monotone flow that is not a gradient</a>, <a href="maxval.html">the maximal value function</a> — the other reports of this series on the same group\'s work.' }
  ]) + '</div>'
}));

const foot = '<p>' + C.esc('Generated by tools/build-report-price.js @ git ' + gitrev
  + ' — certs/price-band.json re-derived during this build (exact rationals and the float port) and compared byte for byte (identical, or no page). Code sha256 ' + REC.provenance.sha256.slice(0, 16) + '…') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'price.html'),
  TPL.render({ title: 'The clearing price, as a proved band · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/price.html',
    desc: 'The Gomes–Saúde electricity price closed in exact rationals: a forecast box on the supply becomes a price band that is a theorem, and the source lab\'s kernel is found clearing a market whose batteries do not fill.' }));
console.log('reports/price.html written: record re-derived identically @ git ' + gitrev);
