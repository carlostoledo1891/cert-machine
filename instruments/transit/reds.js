/* reds.js — node experiments/transit/reds.js
 *
 * The red team. Every one of these is a way the enclosure could be wrong that
 * would still produce plausible-looking numbers, which is the only kind of
 * error worth hunting. A red that cannot fail is not a red, so one of them is a
 * deliberately broken control that MUST fail.
 */
'use strict';
const T = require('./transit.js'), E = require('./enclose.js');
let fail = 0;
const ok = (n, c, got) => { if (!c) fail++; console.log(`  ${c ? 'RED OK  ' : 'RED FAIL'} ${n}${c ? '' : '   got ' + JSON.stringify(got)}`); };

/* a synthetic star with a stated profile, sampled like a real light curve */
function synth(profile, k, aR, b, P, sigma, n = 90, half = 0.036) {
  const NR = 4000, w = []; let norm = 0;
  for (let i = 0; i < NR; i++) { const r = (i + 0.5) / NR, dm = 2 * Math.PI * r * profile(r) / NR; w.push([r, dm]); norm += dm; }
  for (const x of w) x[1] /= norm;
  const bins = [];
  for (let i = -n; i <= n; i++) {
    const t = i * (2.6 * half) / n, z = T.zOf(t, aR, b, P);
    let d = 0; for (const [r, m] of w) d += T.arcFrac(r, z, k) * m;
    bins.push({ tmin: t, tmax: t, tmid: t, f: 1 - d, sigma, stated: sigma, measured: sigma, n: 20 });
  }
  return bins;
}
const PROFILES = {
  'solar-like quadratic': r => { const mu = Math.sqrt(Math.max(0, 1 - r * r)); return 1 - 0.4 * (1 - mu) - 0.25 * (1 - mu) ** 2; },
  'uniform disk': () => 1,
  'limb BRIGHTENED': r => 0.4 + 0.6 * r * r,
  'a bright ring at r=0.8': r => 0.2 + Math.exp(-(((r - 0.8) / 0.05) ** 2))
};
const P0 = 2.4706, AR = 8.4, SIG = 8e-5;
const O = { grid: 1400, iters: 300, inner: 60, maxCells: 80000 };

/* ---- RED 1. containment: the truth must survive, whatever the profile ---- */
console.log('RED 1 — synthetic truth is admitted (nonnegativity rung)');
for (const [name, pf] of Object.entries(PROFILES)) {
  for (const [k, b] of [[0.10, 0.35], [0.13, 0.62]]) {
    const bins = synth(pf, k, AR, b, P0, SIG);
    const geom = { aR: [AR, AR], b: [b, b], t0: [0, 0], P: P0 };
    const v = E.decide(bins, k, 'none', geom, { nsig: 3, sys: 0 }, O).verdict;
    ok(`${name}, k=${k}, b=${b}`, v === 'admitted', v);
  }
}

/* ---- RED 2. the monotone rung must NOT admit a limb-brightened truth ----- *
 * It is a real assumption, so it has to be capable of being wrong. If the
 * monotone ladder admitted a star that brightens outward, the rung would be
 * decorative. */
console.log('RED 2 — the monotone rung is a real restriction');
{
  const k = 0.12, b = 0.4;
  const bins = synth(PROFILES['limb BRIGHTENED'], k, AR, b, P0, SIG);
  const geom = { aR: [AR, AR], b: [b, b], t0: [0, 0], P: P0 };
  const none = E.decide(bins, k, 'none', geom, { nsig: 3, sys: 0 }, O).verdict;
  const mono = E.decide(bins, k, 'monotone', geom, { nsig: 1, sys: 0 }, O).verdict;
  ok('nonnegativity admits the true k of a limb-brightened star', none === 'admitted', none);
  ok('monotone does not admit it at the same k and a 1-sigma budget', mono !== 'admitted', mono);
}

/* ---- RED 3. monotone in the error budget -------------------------------- */
console.log('RED 3 — a wider budget is a larger set');
{
  const k = 0.11, b = 0.5;
  const bins = synth(PROFILES['solar-like quadratic'], k, AR, b, P0, SIG);
  const geom = { aR: [AR, AR], b: [b, b], t0: [0, 0], P: P0 };
  let good = true;
  for (const kk of [0.07, 0.09, 0.15, 0.2]) {
    const tight = E.decide(bins, kk, 'none', geom, { nsig: 1, sys: 0 }, O).verdict;
    const loose = E.decide(bins, kk, 'none', geom, { nsig: 8, sys: 0 }, O).verdict;
    if (tight === 'admitted' && loose === 'refuted') good = false;
  }
  ok('widening never refutes what a tighter budget admitted', good);
}

/* ---- RED 4. the ladder is nested ---------------------------------------- */
console.log('RED 4 — monotone is a subset of nonnegative');
{
  const k = 0.11, b = 0.45;
  const bins = synth(PROFILES['solar-like quadratic'], k, AR, b, P0, SIG);
  const geom = { aR: [AR, AR], b: [b, b], t0: [0, 0], P: P0 };
  let good = true;
  for (const kk of [0.06, 0.08, 0.11, 0.16, 0.25]) {
    const n = E.decide(bins, kk, 'none', geom, { nsig: 3, sys: 0 }, O).verdict;
    const m = E.decide(bins, kk, 'monotone', geom, { nsig: 3, sys: 0 }, O).verdict;
    if (n === 'refuted' && m === 'admitted') good = false;
  }
  ok('monotone never admits what nonnegativity refutes', good);
}

/* ---- RED 5. time reversal ----------------------------------------------- *
 * The constraint set depends on |t|, so reversing the light curve must change
 * nothing at all. This catches an indexing error in the fold that a symmetric
 * test curve would hide. */
console.log('RED 5 — the enclosure does not know which way time runs');
{
  const k = 0.115, b = 0.55;
  const bins = synth(PROFILES['solar-like quadratic'], k, AR, b, P0, SIG);
  const rev = bins.map(x => ({ ...x, tmin: -x.tmax, tmax: -x.tmin, tmid: -x.tmid })).reverse();
  const geom = { aR: [AR, AR], b: [b, b], t0: [0, 0], P: P0 };
  let same = true;
  for (const kk of [0.08, 0.115, 0.18]) {
    if (E.decide(bins, kk, 'none', geom, { nsig: 3, sys: 0 }, O).verdict !== E.decide(rev, kk, 'none', geom, { nsig: 3, sys: 0 }, O).verdict) same = false;
  }
  ok('reversing the light curve changes no verdict', same);
}

/* ---- RED 6. THE INVISIBLE CORE ------------------------------------------ *
 * The planet's centre never comes closer to the star's centre than b, so a
 * circle of radius r < b - k and the planet disk never meet: r + k <= b. Flux
 * placed there is invisible at EVERY epoch, and the normalisation is the only
 * thing that notices it.
 *
 * That is a fact about the kernel, so it is checked on the kernel. It was first
 * written here as a stronger claim — that no k below b can be refuted, because
 * the flux can always hide — and RED 6 refuted it: a planet of k = 0.55 in
 * front of a b = 0.62 transit is refused, because a planet that large reaches
 * the limb far too early and the visible annulus cannot be silent then. Hiding
 * buys an amplitude, not a duration. The claim is now the one that is true.
 */
console.log('RED 6 — flux inside r < b - k is invisible at every epoch');
{
  const b = 0.62, kT = 0.13, AR2 = AR;
  let worst = 0, n = 0;
  for (let i = -120; i <= 120; i++) {
    const t = i * 0.0008, z = T.zOf(t, AR2, b, P0);
    for (const r of [0.001, 0.1, 0.2, 0.3, 0.4, b - kT - 1e-9]) { worst = Math.max(worst, T.arcFrac(r, z, kT)); n++; }
  }
  ok(`the kernel is exactly 0 for all r < b - k, at ${n} (r, t) pairs`, worst === 0, worst);
  ok('and NOT zero just outside that radius', T.arcFrac(b - kT + 0.02, T.zOf(0, AR2, b, P0), kT) > 0);
  /* the consequence: the normalisation is all that sees the core, so the data
     constrain the product (visible fraction) x (planet size), not either alone */
  const bins = synth(PROFILES['solar-like quadratic'], kT, AR2, b, P0, SIG);
  const geom = { aR: [AR2, AR2], b: [b, b], t0: [0, 0], P: P0 };
  const d = E.decide(bins, kT, 'none', geom, { nsig: 3, sys: 0 }, O);
  ok('the truth is admitted and its witness is allowed to use the core',
    d.verdict === 'admitted', d.verdict);
}

/* ---- RED 7. THE DELIBERATELY BROKEN CONTROL ----------------------------- *
 * A red suite where nothing can fail proves nothing. Here the kernel is fed the
 * WRONG impact parameter — the light curve of a b = 0.62 transit judged against
 * a b = 0.05 geometry — and the truth must be refused. If this passes, the
 * enclosure is insensitive to the thing it is supposed to be sensitive to. */
console.log('RED 7 — the control, which must FAIL to admit');
{
  const bins = synth(PROFILES['solar-like quadratic'], 0.13, AR, 0.62, P0, SIG);
  const wrong = { aR: [AR, AR], b: [0.05, 0.05], t0: [0, 0], P: P0 };
  const v = E.decide(bins, 0.13, 'none', wrong, { nsig: 3, sys: 0 }, O).verdict;
  ok('the true k under the WRONG geometry is not admitted', v !== 'admitted', v);
}

console.log(fail ? `\n${fail} RED(S) FAILED` : '\nall reds fire');
process.exit(fail ? 1 : 0);
