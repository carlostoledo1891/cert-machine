/* instruments/hseva/atlas.js — ONE cell of the return-level atlas, the one place
   its record is made: tools/run-hseva-atlas.js writes certs/hseva-atlas.json with
   it, and the atlas page bundles these same bytes to re-derive a cell in the
   reader's tab, where the result is compared with the ledger's record as JSON,
   character for character. A rule defined twice would drift.

   A cell is a series of daily maxima (t: 'YYYY-MM-DD', h: metres, den: the
   exact denominator). For the daily, weekly and monthly blocks: the six
   families by fit.js certify(); the four criteria and the 100- and 1000-year
   levels as enclosures printed outward to eight significant digits (so the
   printed pair still encloses); each criterion's choice by rankRule; and what
   a threshold fitter — the generalized gamma past α = 500, the exponentiated
   Weibull past α = 10⁴ (α as recorded, five significant digits) and a family
   whose (α, k, λ) climb stopped at its boundary taken for "the limit" and left
   out, any other refusal blocking — would choose by Anderson–Darling. The claims the atlas decides live in their own module,
   atlas-claims.js, and read only these records.

   THE SEVENTH FAMILY (2026-09-28), a separate layer: the generalized extreme value law certified beside the six (`gev`,
   the same record, with its ξ enclosed as `x`), and `seven`, Anderson–Darling's choice among the seven by the same rank
   rule. `fits`, `rank` and `naive` stay the paper's six: nothing the paper's claims read has moved.

   STATISTICAL, NEVER IN THE RECORD: a caller that passes `stat` gets beside the record, per block, the delta method's 95%
   intervals on the Anderson–Darling family's 100- and 1000-year levels and on the GEV's ξ and levels (fit.js
   deltaLevel — floats, asymptotic, labelled); extremalIndex() is the runs estimator on the daily maxima. The record stays
   the certificate the reader's tab re-derives character for character. */
'use strict';
const FT = require('./fit.js');
const BR = require('./blockrule.js');
const { PAPER_SIX } = require('./families.js');

const BLOCKS = ['daily', 'weekly', 'monthly'];
const CRIT = ['ad', 'ks', 'mse', 'chi2'];

function outward(v, up) {
  if (!Number.isFinite(v) || v === 0) return v;
  let s = Number(v.toPrecision(8));
  if (up ? s < v : s > v) { const e = Math.floor(Math.log10(Math.abs(s))), st = Math.pow(10, e - 7); s = Number((up ? s + st : s - st).toPrecision(8)); }
  return s;
}
const iv = (a) => (a ? [outward(a[0], false), outward(a[1], true)] : null);
/* a refusal's reason, kept to its head and its tail: where it started, and where the last climb stopped */
const said = (why) => { const w = String(why); return w.length <= 220 ? w : w.slice(0, 100) + ' … ' + w.slice(-110); };

/* one family's fit, as the record holds it, and its entry for the rank rule */
function fitOf(f, c, S, BM) {
  let cr = null; try { cr = FT.criteria(c, S.den); } catch (e) { cr = null; }
  const F = { c: 1 };
  if (cr) { F.ad = iv(cr.ad); F.ks = iv(cr.ks); F.mse = iv(cr.mse); F.chi2 = cr.chi2.value ? iv(cr.chi2.value) : cr.chi2.refused ? 'R' : 'U'; }
  else F.crit = 'not enclosed';
  for (const T of [100, 1000]) { let v = null; try { v = FT.returnLevel(c, T, BM.hours); } catch (e) { v = null; } F['l' + T] = iv(v); }
  const e = cr ? { family: f, ad: cr.ad, ks: cr.ks, mse: cr.mse, chi2: cr.chi2.value, chi2Refused: !!cr.chi2.refused, unstated: cr.ad ? [] : ['ad'] } : { family: f, unstated: CRIT.slice() };
  return { F, e };
}
/* a 95% interval, rounded to four significant figures outward; null where the delta method has none */
const s4 = (v, up) => { if (!Number.isFinite(v) || v === 0) return v; const e = Math.floor(Math.log10(Math.abs(v))), st = Math.pow(10, e - 3); return Number(((up ? Math.ceil(v / st) : Math.floor(v / st)) * st).toPrecision(4)); };
const ci = (d) => (d ? [s4(d.lo, false), s4(d.hi, true)] : null);
function statOf(c, BM) {
  return { l100: ci(FT.deltaLevel(c, 100, BM.hours)), l1000: ci(FT.deltaLevel(c, 1000, BM.hours)) };
}
function fitBlock(S, blk, st) {
  const BM = BR.blockMaxima(S, blk);
  const prepared = FT.prepare(BM.x);
  const fits = {}, entries = [], naive = [], certs = {};
  for (const f of PAPER_SIX) {
    const c = FT.certify(f, BM.x, { prepared });
    if (!c.ok) {
      fits[f] = c.edge ? { c: 0, e: 1, k: c.boundary.k, q1: c.boundary.q1 } : c.stoppedAtBoundary ? { c: 0, s: 1, w: said(c.why) } : { c: 0, w: said(c.why) };
      entries.push({ family: f, refused: true, edge: !!c.edge });
      naive.push({ family: f, refused: true, edge: !!(c.edge || c.stoppedAtBoundary) });   /* the threshold fitter: a stop is the limit */
      continue;
    }
    certs[f] = c;
    const { F, e } = fitOf(f, c, S, BM);
    fits[f] = F;
    if (f === 'gengamma') F.a = Number((c.stacy ? c.stacy[0] : c.theta[0]).toPrecision(5));
    if (f === 'expweibull') F.a = Number((c.ew ? c.ew[0] : c.theta[0]).toPrecision(5));
    if (c.coords === 'gengammaP') F.p = 1;
    if (c.coords === 'expweibullG') F.g = 1;
    entries.push(e);
    naive.push((f === 'gengamma' && F.a > 500) || (f === 'expweibull' && !(F.a <= 1e4)) ? { family: f, refused: true, edge: true } : e);
  }
  const rank = {};
  for (const k of CRIT) { const r = FT.rankRule(entries, k); rank[k] = r.verdict === 'DECIDED' ? r.best : 'R'; }
  const nv = FT.rankRule(naive, 'ad');
  /* the seventh family: certified beside the six, ranked with them only in `seven` */
  const g = FT.certify('gev', BM.x, { prepared });
  let G, ge;
  if (!g.ok) { G = g.stoppedAtBoundary ? { c: 0, s: 1, w: said(g.why) } : { c: 0, w: said(g.why) }; ge = { family: 'gev', refused: true, edge: false }; }
  else { const q = fitOf('gev', g, S, BM); G = q.F; G.x = iv(g.box[2]); ge = q.e; }
  const r7 = FT.rankRule(entries.concat([ge]), 'ad');
  let mx = 0; for (let i = 0; i < BM.x.length; i++) if (BM.x[i] > mx) mx = BM.x[i];
  if (st) {
    const S0 = st[blk] = {};
    if (rank.ad !== 'R') { S0.f = rank.ad; Object.assign(S0, statOf(certs[rank.ad], BM)); }
    if (g.ok) { const d = FT.deltaParam(g, 2); S0.gev = Object.assign({ x: d ? [s4(d.lo, false), s4(d.hi, true)] : null }, statOf(g, BM)); }
  }
  return { n: BM.n, h: BM.hours, max: mx, fits, rank, naive: nv.verdict === 'DECIDED' ? nv.best : 'R', gev: G, seven: r7.verdict === 'DECIDED' ? r7.best : 'R' };
}
/* THE RUNS ESTIMATOR of the extremal index (Smith & Weissman 1994) on the daily maxima: the days above u, the series'
   95th percentile (the ⌈0.95 n⌉-th smallest value), fall into clusters, a new one after at least r = 3 days at or below
   u; θ = clusters / days above. Counting, exact; statistical in what it estimates — how many independent extremes the
   daily maxima hold (about θ per day above u), which the design-life level's "successive maxima independent" ignores. */
const EI_Q = 0.95, EI_R = 3;
function extremalIndex(h) {
  const s = Array.from(h).sort((a, b) => a - b), u = s[Math.ceil(EI_Q * s.length) - 1];
  let exc = 0, clu = 0, gap = Infinity;
  for (let i = 0; i < h.length; i++) {
    if (h[i] > u) { exc++; if (gap >= EI_R) clu++; gap = 0; } else gap++;
  }
  return { u, q: EI_Q, r: EI_R, exc, clu, theta: exc ? Number((clu / exc).toFixed(4)) : null };
}
/* the map's view of one block's two hard families — one rule for the page's map (build.js, from the ledger's JSON) and
   for the reader's tab (the worker, from the record in memory), so the two cannot name a state differently.
   gg: 0 a maximum inside the family, 1 beside its lognormal limit (α past 500, or past the doubles: JSON's null),
       2 at the limit with the proof, 3 refused;
   ew: 0 certified in (α, k, λ), 3 certified in the Gumbel coordinates, 1 refused toward k → 0 (the Fréchet corner),
       4 refused past α = 10⁴ otherwise, 2 refused otherwise. */
function codes(B) {
  const G = B.fits.gengamma, E = B.fits.expweibull;
  return {
    gg: G.c ? (G.a === null || !(G.a <= 500) ? 1 : 0) : G.e ? 2 : 3,
    ew: E.c ? (E.g ? 3 : 0) : /passed k = 0\.001/.test(E.w || '') ? 1 : E.s ? 4 : 2,
  };
}
/* S = { n, t, h, den, step: 24 } — the cell's daily maxima; `stat`, if given, receives the statistical layer beside the record */
function cellRecord(id, S, onBlock, stat) {
  const out = { id, blocks: {} };
  for (const blk of BLOCKS) { out.blocks[blk] = fitBlock(S, blk, stat); if (onBlock) onBlock(blk); }
  if (stat) stat.ei = extremalIndex(S.h);
  return out;
}

if (typeof module !== 'undefined') module.exports = { BLOCKS, CRIT, outward, fitBlock, cellRecord, codes, extremalIndex };
