#!/usr/bin/env node
/* build-report-hseva.js — reports/return-levels.html: the return-level table
   as a certificate.

   Reis, Guimarães, Farina, Paul, de Paula and Ribeiro (Ocean Engineering 359,
   2026, 125841) fit six families (normal, lognormal, Weibull, exponentiated
   Weibull, generalized gamma, Gumbel) by maximum likelihood to significant
   wave height — unfiltered and as daily, weekly and monthly block maxima —
   rank them by four goodness-of-fit criteria, select by Anderson–Darling, and
   read 100- and 1000-year return levels. That method is repeated here with
   every step certified (instruments/hseva, certs/hseva-ledger.json) on the
   benchmark's three NDBC buoys and on the paper's own WAVEWATCH III hindcast
   at chosen grid points; the paper's findings are read against both; and the
   Hs marginals other people printed for the same buoys — the benchmark's
   contributions, and scipy's defaults — are decided against the same data.

   Gates: the hseva battery must pass with every red fired, and every sentence
   below is gated on the ledger field it reads (die() before a false one ships).

   usage: node tools/build-report-hseva.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('HSEVA REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const bat = cp.spawnSync('node', [path.join(ROOT, 'instruments', 'hseva', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /hseva battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the hseva battery did not pass clean:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-ledger.json'), 'utf8'));
if (L.quick) die('the shipped ledger is a quick run');
const CL = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'hs-eva', 'claims.json'), 'utf8'));
if (CL.paper.method.families.slice().sort().join() !== L.families.slice().sort().join()) die('the ledger\'s families are not the paper\'s six');
if (CL.paper.method.criteria.indexOf('Sturges') < 0 || L.criteria.length !== 4) die('the four criteria are not the paper\'s');
const Q = CL.paper.qualitativeClaims;
const fmt = (x) => Number(x).toLocaleString('en-US');
const f2 = (x) => Number(x).toFixed(2), f1 = (x) => Number(x).toFixed(1);
const FAM = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel', lognormal3: '3-p lognormal' };
const FAMW = { normal: 'the normal', lognormal: 'the lognormal', weibull: 'the Weibull', expweibull: 'the exponentiated Weibull', gengamma: 'the generalized gamma', gumbel: 'the Gumbel' };
const BLK = { native: 'hourly', daily: 'daily maxima', weekly: 'weekly maxima', monthly: 'monthly maxima', annual: 'annual maxima' };
const CRN = { ad: 'Anderson–Darling', ks: 'Kolmogorov–Smirnov', mse: 'MSE', chi2: 'χ²' };
const BUOYS = ['A', 'B', 'C'], FAMS = L.families, CRIT = L.criteria, PB = L.paperBlocks, BB = L.buoyBlocks;
/* "the lognormal at 4, the generalized gamma at 1, and 3 refused" — the other winners of the unfiltered series */
function nativeTally(F) {
  const by = {}; const refused = [];
  for (const q of F.native) { if (q.verdict !== 'DECIDED') refused.push(q.series); else if (q.best !== 'expweibull') by[q.best] = (by[q.best] || 0) + 1; }
  const parts = Object.entries(by).sort((a, b) => b[1] - a[1]).map(([f, k]) => FAMW[f] + ' at ' + k);
  const head = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : (parts[0] || 'no other');
  return head + (refused.length ? ', and the choice at ' + refused.map(nodeName).join(', ') + ' is refused' : '');
}
/* "Anderson–Darling, MSE and χ² pick the lognormal, Kolmogorov–Smirnov the exponentiated Weibull" */
function splitWords(w) {
  const by = {}; for (const k of Object.keys(w)) if (w[k]) (by[w[k]] = by[w[k]] || []).push(CRN[k]);
  const list = (a) => (a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const groups = Object.entries(by).sort((a, b) => b[1].length - a[1].length);
  return groups.map(([f, ks], i) => list(ks) + (i === 0 ? (ks.length > 1 ? ' pick ' : ' picks ') : ' ') + FAMW[f]).join(', ');
}
const NODE = { campos: 'Campos', santos: 'Santos', 'espirito-santo': 'Espírito Santo', pelotas: 'Pelotas', potiguar: 'Potiguar', 'foz-amazonas': 'Foz do Amazonas', drake: 'the Drake Passage', 'acc-central': 'the central Antarctic Circumpolar Current', 'southern-high': 'the high southern latitudes', 'subantarctic-north': 'the northern sub-Antarctic', 'arabian-sea': 'the Arabian Sea', 'south-of-japan': 'south of Japan', 'north-atlantic': 'the North Atlantic' };
const nodeName = (p) => NODE[p] || p;
const nodeIn = (p) => ({ 'south-of-japan': 'south of Japan', 'southern-high': 'at the high southern latitudes', 'subantarctic-north': 'in the northern sub-Antarctic' }[p] || (/^the /.test(nodeName(p)) ? 'in ' : 'at ') + nodeName(p));
const num = (n) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] || String(n);

/* ---- tallies the prose states ---- */
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const half = (F) => Math.max(...F.box.map((q) => (Number(q[1]) - Number(q[0])) / 2));    /* the recorded box, about its centre */
const listWords = (a) => (a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
let certified = 0, ggEdge = 0, ewStop = 0, decidedAD = 0, rankedAD = 0, maxBox = 0;
const refusedAt = [], edgeAt = [], stopAt = [];
for (const b of BUOYS) for (const blk of BB) {
  const B = L.buoys[b].blocks[blk];
  for (const f of FAMS) {
    const F = B.fits[f];
    if (F.certified) { certified++; maxBox = Math.max(maxBox, half(F)); }
    else if (F.edge) { if (!(f === 'gengamma' && F.boundary && Number(F.boundary.dqQ.hi) < 0)) die('an edge refusal that is not the generalized gamma\'s proved limit: ' + b + ' ' + blk + ' ' + f); ggEdge++; edgeAt.push({ b, blk }); }
    else { if (!(f === 'expweibull' && F.stoppedAtBoundary)) die('a refusal the page does not describe: ' + b + ' ' + blk + ' ' + f); ewStop++; stopAt.push({ b, blk }); }
  }
  rankedAD++; if (B.rankings.ad.verdict === 'DECIDED') decidedAD++; else refusedAt.push({ b, blk });
}
if (refusedAt.map((q) => q.b + q.blk).join() !== stopAt.map((q) => q.b + q.blk).join()) die('the refused choices are not exactly the blocks where the exponentiated Weibull was stopped');
if (!stopAt.every((q) => q.blk === 'annual')) die('an exponentiated-Weibull stop outside the annual maxima');
const ggEdgeByBuoy = BUOYS.map((b) => ({ b, blks: edgeAt.filter((q) => q.b === b).map((q) => q.blk) })).filter((q) => q.blks.length);
const ggEdgeParts = ggEdgeByBuoy.map((q) => (q.blks.length === BB.length ? 'every series of ' + q.b : q.b + '\'s ' + listWords(q.blks.map((blk) => BLK[blk].replace(' maxima', ''))) + (q.blks.length === 1 && q.blks[0] !== 'native' ? ' maxima' : ' series')));
const ggEdgeWords = ggEdgeParts.length > 1 ? ggEdgeParts.slice(0, -1).join('; on ') + '; and on ' + ggEdgeParts[ggEdgeParts.length - 1] : ggEdgeParts[0];
const stopWords = listWords(stopAt.map((q) => q.b + '\'s')) + ' annual maxima';
const FB = L.findings.buoys;
const natBest = FB.native.map((q) => q.best);
if (!(natBest[0] === 'expweibull' && natBest[1] === 'lognormal' && natBest[2] === 'gengamma')) die('the unfiltered-series sentence would be false: ' + natBest.join(', '));
const weibullWins = PB.reduce((s, blk) => s + FB.weibullByBlock[blk].decided, 0);
if (weibullWins !== 0) die('the "Weibull never wins" sentence would be false');
const gg = FB.gengamma;
if (!(gg.certified === 4 && gg.edge === 8 && gg.refused === 0 && gg.decidedBest.join(',') === 'buoy C/native,buoy C/daily')) die('the generalized-gamma sentence would be false: ' + JSON.stringify(gg));
const ggAB = PB.every((blk) => L.buoys.A.blocks[blk].fits.gengamma.edge && L.buoys.B.blocks[blk].fits.gengamma.edge) && PB.every((blk) => L.buoys.C.blocks[blk].fits.gengamma.certified);
if (!ggAB) die('the "at its limit on A and B, certified on every C series" sentence would be false');
if (FB.disagree.length !== 2) die('the criteria sentence would be false: ' + FB.disagree.length);
const annual = BUOYS.map((b) => ({ b, r: L.buoys[b].blocks.annual.rankings.ad }));
const annualDecided = annual.filter((q) => q.r.verdict === 'DECIDED');
if (!(annualDecided.length === 1 && annualDecided[0].b === 'B' && annualDecided[0].r.best === 'gumbel')) die('the annual sentence would be false: ' + annual.map((q) => q.b + ' ' + (q.r.best || q.r.verdict)).join(', '));
const chiUndef = [];
for (const b of BUOYS) for (const blk of BB) { const r = L.buoys[b].blocks[blk].rankings.chi2; if (r.verdict === 'REFUSED' && /no family/.test(r.why || '')) chiUndef.push(b + ' ' + blk); }
if (chiUndef.join() !== 'B annual') die('the χ²-undefined sentence would be false: ' + chiUndef.join(', '));
const agg = FB.aggregation; const aggMax = agg.reduce((m, q) => (Number(q.factor) > Number(m.factor) ? q : m));
/* the preferred family's 100-year level below the largest hour observed, where a family is preferred */
const belowMax = [];
for (const b of BUOYS) for (const blk of BB) { const B = L.buoys[b].blocks[blk], r = B.rankings.ad; if (r.verdict !== 'DECIDED') continue; const v = Number(B.fits[r.best].returnLevel[100].hi); if (v < Number(B.max)) belowMax.push({ b, blk, v, max: Number(B.max), fam: r.best }); }
const belowBy = BUOYS.map((b) => ({ b, q: belowMax.filter((x) => x.b === b) })).filter((x) => x.q.length);
if (!(belowBy.length === 2 && belowBy.every((x) => x.q.map((y) => y.blk).join() === 'daily,weekly,monthly'))) die('the below-the-record sentence would be false: ' + belowMax.map((q) => q.b + ' ' + q.blk).join(', '));
const levelOf = (b, blk, T) => { const B = L.buoys[b].blocks[blk]; return B.rankings.ad.verdict === 'DECIDED' ? Number(B.fits[B.rankings.ad.best].returnLevel[T].hi) : null; };
const levelsAll = []; for (const b of BUOYS) for (const blk of BB) for (const f of FAMS) { const F = L.buoys[b].blocks[blk].fits[f]; if (F.certified) for (const T of ['100', '1000']) if (F.returnLevel[T] && F.returnLevel[T].hi) levelsAll.push(Number(F.returnLevel[T].hi) - Number(F.returnLevel[T].lo)); }
const widestLevel = Math.max(...levelsAll);
if (!(widestLevel < 0.001)) die('the "narrower than a millimetre" sentence would be false: ' + widestLevel);

/* ---- the printed marginals ---- */
const P = L.printed; if (!P) die('the ledger has no printed section');
const row = (id, b) => P.rows.find((r) => r.id === id && r.buoy === b);
if (!(row('c8', 'A').reproduces && row('c8', 'B').reproduces && row('c8', 'C').reproduces === false && row('c8', 'C').reproducesTz)) die('the contribution-8 sentence would be false');
if (!BUOYS.every((b) => row('c3', b).reproduces)) die('the contribution-3 sentence would be false');
if (!BUOYS.every((b) => row('c9', b).belowLocation[0] > 9000)) die('the contribution-9 sentence would be false');
if (!BUOYS.every((b) => row('c12', b).belowLocation[0] === 0 && row('c12', b).belowLocation[1] >= 1)) die('the baseline-location sentence would be false');
if (!BUOYS.every((b) => Number(row('c12', b).printed[2]) === Number(P.reference[b].min) || Math.abs(Number(row('c12', b).printed[2]) - Number(P.reference[b].min)) < 0.0005)) die('the baseline location is not the smallest hour to its digits');
const c4defA = row('c4', 'A').deficit; if (!(c4defA && Number(c4defA.lo) > 800)) die('the contribution-4 deficit on A would be false');
const printedA = ['c12', 'c3', 'c4', 'c8', 'c9'].map((id) => ({ id, r: row(id, 'A') }));
const spreadA = { lo: Math.min(...printedA.map((q) => Number(q.r.rl100.lo))), hi: Math.max(...printedA.map((q) => Number(q.r.rl100.hi))) };
const loId = printedA.find((q) => Number(q.r.rl100.lo) === spreadA.lo).id, hiId = printedA.find((q) => Number(q.r.rl100.hi) === spreadA.hi).id;
if (!(loId === 'c8' && hiId === 'c3')) die('the spread sentence names the wrong ends: ' + loId + ', ' + hiId);
const CONTRIB = { c12: 'contributions 1 & 2', c3: 'contribution 3', c4: 'contribution 4', c8: 'contribution 8', c9: 'contribution 9' };

/* ---- scipy ---- */
const SP = L.scipy; if (!SP) die('the ledger has no scipy section');
const sc = { AGREES: 0, OFF_THE_MAXIMUM: 0, BELOW_ITS_LIMIT: 0, OUTSIDE_SUPPORT: 0, BELOW_A_MEMBER: 0, NOT_DECIDED: 0 };
const scF = { NOT_DECIDED: 0 }, limitDef = [];
const scRows = [];
let maxDeficit = null, shiftRange = [Infinity, -Infinity];
for (const b of BUOYS) for (const blk of Object.keys(SP.buoys[b])) for (const f of Object.keys(SP.buoys[b][blk])) for (const mode of ['floc0', 'default']) {
  const e = SP.buoys[b][blk][f][mode]; if (!e || !e.verdict) continue;
  sc[e.verdict] = (sc[e.verdict] || 0) + 1;
  if (mode === 'floc0' && e.verdict === 'NOT_DECIDED') { scF.NOT_DECIDED++; if (!(f === 'expweibull' && !L.buoys[b].blocks[blk].fits.expweibull.certified)) die('a floc=0 scipy fit left undecided where the page says only the refused exponentiated Weibull is'); }
  if (e.verdict === 'BELOW_ITS_LIMIT') { if (!(f === 'gengamma' && L.buoys[b].blocks[blk].fits.gengamma.edge)) die('BELOW_ITS_LIMIT outside a generalized gamma at its limit'); limitDef.push(Number(e.deficit)); }
  if (e.verdict !== 'AGREES' && e.verdict !== 'NOT_DECIDED') scRows.push({ b, blk, f, mode, e });
  if (e.verdict === 'BELOW_A_MEMBER' && (!maxDeficit || Number(e.deficit) > Number(maxDeficit.e.deficit))) maxDeficit = { b, blk, f, mode, e };
  if (mode === 'default' && e.level100Shift !== undefined) { shiftRange[0] = Math.min(shiftRange[0], Number(e.level100Shift)); shiftRange[1] = Math.max(shiftRange[1], Number(e.level100Shift)); }
}
const floc0Certified = sc.AGREES + sc.OFF_THE_MAXIMUM;
if (!(sc.BELOW_ITS_LIMIT === ggEdge && limitDef.length === ggEdge)) die('the scipy-below-its-limit sentence presumes one per generalized gamma at its limit: ' + sc.BELOW_ITS_LIMIT + ' vs ' + ggEdge);
const limitDefLo = Math.min(...limitDef), limitDefHi = Math.max(...limitDef);
if (!(shiftRange[0] < 0 && shiftRange[1] > 0)) die('the default-call range sentence presumes a negative and a positive end');
const offGG = SP.buoys.C.native.gengamma.floc0, offEW = SP.buoys.A.weekly.expweibull.floc0, outW = SP.buoys.A.monthly.weibull.default, bigEW = SP.buoys.A.native.expweibull.default;
if (!(offGG.verdict === 'OFF_THE_MAXIMUM' && offEW.verdict === 'OFF_THE_MAXIMUM' && outW.verdict === 'OUTSIDE_SUPPORT' && bigEW.verdict === 'BELOW_A_MEMBER')) die('a named scipy verdict changed');
if (!(maxDeficit && maxDeficit.b === 'A' && maxDeficit.blk === 'native' && maxDeficit.f === 'expweibull')) die('the largest scipy deficit is not where the prose says');
if (!(Number(offGG.level100Shift) < 0 && Number(offEW.level100Shift) < 0 && Number(offGG.deficit) > 0 && Number(offEW.deficit) > 0)) die('the "stops short … low" sentence would be false');
if (outW.below !== 1) die('the "one of A\'s monthly maxima" sentence would be false: ' + outW.below);

/* ---- the hindcast ---- */
const W = L.ww3;
const FW = L.findings.ww3;
let prenticeW = 0, prenticeB = 0;
if (W) for (const P of Object.values(W.points)) for (const B of Object.values(P.blocks)) if (B.fits.gengamma.coords) prenticeW++;
for (const b of BUOYS) for (const blk of BB) if (L.buoys[b].blocks[blk].fits.gengamma.coords) prenticeB++;
/* entries for the ranking rule, from the ledger's own enclosures */
const entriesOf = (B, asEdge) => FAMS.map((f) => {
  const F = B.fits[f];
  if (!F.certified || f === asEdge) return { family: f, refused: true, edge: f === asEdge || !!F.edge };
  const iv = (q) => (q && q.lo !== undefined ? [Number(q.lo), Number(q.hi)] : null);
  return { family: f, ad: iv(F.criteria.ad), ks: iv(F.criteria.ks), mse: iv(F.criteria.mse), chi2: iv(F.criteria.chi2), chi2Refused: !!(F.criteria.chi2 && F.criteria.chi2.refused) };
});
/* the generalized gamma's maxima beside its lognormal limit (α > 500, where a climb that stops there gives up) and
   what treating them as the limit would do to the choices: re-ranked here by THE rule with that family left out */
const nearLimit = [];
if (W) for (const [p, Pp] of Object.entries(W.points)) for (const blk of PB) {
  const B = Pp.blocks[blk], G = B.fits.gengamma;
  if (!(G.certified && G.stacy && Number(G.stacy[0]) > 500)) continue;
  if (!(Number(G.ll.lo) > Number(G.limitLl.hi))) die('a certified generalized gamma beside the limit is not above it: ' + p + ' ' + blk);
  let flips = 0; for (const k of CRIT) { const alt = FT.rankRule(entriesOf(B, 'gengamma'), k), here = B.rankings[k]; if ((alt.verdict === 'DECIDED' ? alt.best : 'R') !== (here.verdict === 'DECIDED' ? here.best : 'R')) flips++; }
  nearLimit.push({ p, blk, alpha: Number(G.stacy[0]), flips, best: B.rankings.ad.verdict === 'DECIDED' ? B.rankings.ad.best : null });
}
if (W && PB.reduce((a, blk) => a + FW.weibullByBlock[blk].decided, 0) !== 0) die('the "Weibull best of none of the hindcast series" sentence would be false');
const nearFlips = nearLimit.reduce((a, q) => a + q.flips, 0), nearBest = nearLimit.filter((q) => q.best === 'gengamma').length;
const nearWins = nearLimit.reduce((a, q) => a + CRIT.filter((k) => { const r = W.points[q.p].blocks[q.blk].rankings[k]; return r.verdict === 'DECIDED' && r.best === 'gengamma'; }).length, 0);
if (W && nearWins !== nearFlips) die('a choice beside the limit moves without being a generalized-gamma win, or the reverse: ' + nearWins + ' wins, ' + nearFlips + ' moves');
if (W && !(nearLimit.length >= 5 && nearFlips >= 10)) die('the beside-the-limit sentence presumes at least five such maxima and ten choices they move: ' + nearLimit.length + ', ' + nearFlips);
/* the unfiltered choice at each node, and what the selector says with the refused family left out */
let wRatio = null, wCampos = null, wSantos = null, arab = null;
if (W) {
  for (const [p, Pp] of Object.entries(W.points)) {
    const nat = Pp.blocks.native, r = nat.rankings.ad; if (r.verdict !== 'DECIDED') continue;
    const v = Number(nat.fits[r.best].returnLevel[100].hi), mx = Number(nat.max);
    if (!wRatio || v / mx > wRatio.v / wRatio.max) wRatio = { p, v, max: mx, fam: r.best };
    if (p === 'campos') wCampos = v / mx; if (p === 'santos') wSantos = v / mx;
  }
  const AS = W.points['arabian-sea'];
  if (AS) {
    const refusedAll = PB.every((blk) => AS.blocks[blk].rankings.ad.verdict === 'REFUSED' && AS.blocks[blk].fits.expweibull.stoppedAtBoundary);
    const nat = AS.blocks.native, alt = FT.rankBy(entriesOf(nat).filter((e) => !e.refused), 'ad');
    if (refusedAll && alt.verdict === 'DECIDED') arab = { fam: alt.best, v: Number(nat.fits[alt.best].returnLevel[100].hi), max: Number(nat.max) };
  }
  if (!(arab && arab.fam === 'lognormal' && arab.v / arab.max > 3)) die('the Arabian Sea sentence would be false');
  if (!(wRatio && wRatio.v / wRatio.max < 2 && wCampos < 1.2 && wSantos < 1.2)) die('the decided-levels sentence would be false: ' + JSON.stringify(wRatio));
}

/* ================= figures ================= */
/* FIG1: A² by family and block, buoy C, log axis */
const rowsAD = [];
for (const blk of BB) for (const f of FAMS) {
  const F = L.buoys.C.blocks[blk].fits[f];
  if (!F.certified) { continue; }
  const hi = Number(F.criteria.ad.hi);
  rowsAD.push({ k: BLK[blk] + ' · ' + FAM[f], v: Math.max(hi, 0.1), lab: hi < 10 ? hi.toFixed(2) : fmt(hi.toFixed(0)), token: L.buoys.C.blocks[blk].rankings.ad.best === f ? 'var(--c-1)' : 'var(--c-3)', hover: 'A² ∈ [' + F.criteria.ad.lo + ', ' + F.criteria.ad.hi + '] · θ = ' + F.theta.map((t) => Number(t).toPrecision(5)).join(', ') });
}
const nC = BB.length * FAMS.length - rowsAD.length;
const ends1 = BB.map((blk) => { const c = FAMS.filter((f) => L.buoys.C.blocks[blk].fits[f].certified).map((f) => [f, Number(L.buoys.C.blocks[blk].fits[f].criteria.ad.hi)]).sort((a, b) => a[1] - b[1]); return { blk, lo: c[0][0], hi: c[c.length - 1][0] }; });
const hiFams = [...new Set(ends1.map((q) => q.hi))];
const altHigh = hiFams.length === 1 ? FAMW[hiFams[0]] + ' is highest at every block' : listWords(hiFams.map((f) => FAMW[f] + ' is highest on ' + listWords(ends1.filter((q) => q.hi === f).map((q) => BLK[q.blk])))); 
const FIG1 = CH.bars({
  w: 900, rowH: 20, min: 0.1, max: 10000, logX: true, padL: 236, padR: 80, h: rowsAD.length * 20 + 56 + 18 + 22,
  rows: rowsAD,
  xTicks: [0.1, 1, 10, 100, 1000, 10000].map((v) => ({ v, t: v >= 1 ? fmt(v) : String(v) })), xLabel: 'Anderson–Darling A² (upper end of the enclosure), log scale — bars grow from 0.1',
  keys: [{ token: 'var(--c-1)', t: 'preferred at that block (DECIDED)' }, { token: 'var(--c-3)', t: 'the other certified families' }],
  alt: 'Horizontal bars on a log axis for buoy C, one per certified family at each block size: the Anderson–Darling statistic. Lowest: ' + ends1.map((q) => FAMW[q.lo] + ' on the ' + BLK[q.blk]).join('; ') + '. ' + altHigh.charAt(0).toUpperCase() + altHigh.slice(1) + '. ' + (nC ? nC + (nC === 1 ? ' fit is' : ' fits are') + ' missing: no maximum is certified for ' + (nC === 1 ? 'it' : 'them') + '.' : '')
});
/* FIG2: the 100-year level against block size, buoy A, the three families the statistic picks there */
const xOf = { native: 0, daily: 1, weekly: 2, monthly: 3, annual: 4 };
const decA = BB.filter((blk) => L.buoys.A.blocks[blk].rankings.ad.verdict === 'DECIDED');
const picked = [...new Set(decA.map((blk) => L.buoys.A.blocks[blk].rankings.ad.best))];
if (picked.length > 3) die('buoy A picks more than three families; the chart has three series');
const TOK2 = {}; picked.forEach((f, i) => { TOK2[f] = ['var(--c-1)', 'var(--c-2)', 'var(--c-3)'][i]; });
const off2 = {}; picked.forEach((f, i) => { off2[f] = (i - 1) * 0.12; });
const pts2 = [];
for (const f of picked) for (const blk of BB) {
  const F = L.buoys.A.blocks[blk].fits[f]; if (!F.certified || !F.returnLevel[100]) continue;
  const pref = L.buoys.A.blocks[blk].rankings.ad.best === f;
  pts2.push({ x: xOf[blk] + off2[f], y: Number(F.returnLevel[100].hi), token: TOK2[f], diamond: pref, k: FAM[f] + ' · ' + BLK[blk], v: '100-year Hs ∈ [' + F.returnLevel[100].lo + ', ' + F.returnLevel[100].hi + '] m' + (pref ? ' — the family Anderson–Darling prefers here' : '') });
}
const maxA = Number(L.buoys.A.blocks.native.max);
const FIG2 = CH.scatter({
  w: 900, h: 360, x0: -0.5, x1: 4.5, y0: 4, y1: 20, padL: 62,
  pts: pts2,
  hlines: [{ y: maxA, token: CH.CTX, t: 'the largest hour observed: ' + maxA.toFixed(2) + ' m', dashed: true }],
  xTicks: BB.map((blk) => ({ v: xOf[blk], t: BLK[blk] })), yTicks: [4, 8, 12, 16, 20].map((v) => ({ v, t: v + ' m' })),
  xLabel: 'the block the maxima are taken over (buoy A)', yLabel: '100-year significant wave height, m',
  keys: picked.map((f) => ({ token: TOK2[f], t: FAMW[f] })).concat([{ token: CH.CTX, t: 'diamond: the family the statistic prefers there' }]),
  alt: 'Buoy A: the certified 100-year significant wave height, at five block sizes, for the ' + num(picked.length) + ' families Anderson–Darling picks somewhere on this buoy (' + picked.map((f) => FAMW[f]).join(', ') + '). The preferred family\'s level — the diamonds — runs from ' + f2(Math.min(...decA.map((blk) => levelOf('A', blk, 100)))) + ' to ' + f2(Math.max(...decA.map((blk) => levelOf('A', blk, 100)))) + ' metres depending on the block; on the annual maxima no family is preferred, the choice refused. The dashed line is the largest hour in the record, ' + maxA.toFixed(2) + ' metres.'
});
/* FIG3: the Hs marginals the benchmark's contributions printed, buoy A: the 100-year level over each printed box, against the certified maxima */
const rows3 = [];
const order3 = ['c8', 'c12', 'c9', 'c4', 'c3'];
const NOTE3 = { c8: 'the maximum-likelihood fit, to the digit', c12: 'location = the smallest hour', c9: fmt(row('c9', 'A').belowLocation[0]) + ' hours outside its support', c4: 'least squares, by design', c3: 'a local maximum (scipy)' };
for (const id of order3) { const r = row(id, 'A'); rows3.push({ k: CONTRIB[id].replace('contributions', 'contrib.').replace('contribution', 'contrib.') + ' · ' + FAM[r.family], lo: Number(r.rl100.lo), hi: Number(r.rl100.hi), token: 'var(--c-2)', note: NOTE3[id], v: 'printed ' + r.printed.join(', ') + ' → 100-year Hs ∈ [' + r.rl100.lo + ', ' + r.rl100.hi + '] m over every value the printed digits allow' }); }
for (const f of ['weibull', 'lognormal', 'expweibull']) { const m = P.reference.A.mle[f]; rows3.push({ k: 'certified MLE · ' + FAM[f], point: Number(m.rl100.hi), token: 'var(--c-1)', v: '100-year Hs ∈ [' + m.rl100.lo + ', ' + m.rl100.hi + '] m' }); }
const FIG3 = CH.intervals({
  w: 900, rowH: 34, x0: 4, x1: 20, padL: 236, h: 8 * 34 + 78 + 18,
  rows: rows3,
  xTicks: [4, 8, 12, 16, 20].map((v) => ({ v, t: v + ' m' })), xLabel: 'hourly sea-state 100-year Hs, buoy A, the ten provided years',
  keys: [{ token: 'var(--c-2)', t: 'printed, over its digits' }, { token: 'var(--c-1)', t: 'certified MLE, same hours' }],
  alt: 'Buoy A, the ten years every benchmark team fitted: the 100-year significant wave height implied by five printed marginals and by three certified maximum-likelihood fits. The printed ones run from ' + f2(spreadA.lo) + ' metres (contribution 8\'s two-parameter Weibull) to ' + f2(spreadA.hi) + ' metres (contribution 3\'s three-parameter lognormal).'
});

/* ================= tables ================= */
const adCell = (F) => { if (!F.certified) return F.edge ? 'at its limit' : 'REFUSED'; const v = Number(F.criteria.ad.hi); return v < 100 ? v.toFixed(3) : fmt(v.toFixed(0)); };
const rankRows = [];
for (const b of BUOYS) for (const blk of BB) {
  const B = L.buoys[b].blocks[blk];
  rankRows.push([b + ' · ' + BLK[blk], fmt(B.n)].concat(FAMS.map((f) => adCell(B.fits[f]))).concat([B.rankings.ad.verdict === 'DECIDED' ? 'DECIDED: ' + FAM[B.rankings.ad.best] : 'REFUSED']));
}
const critRows = [];
for (const b of BUOYS) for (const blk of BB) {
  const B = L.buoys[b].blocks[blk];
  const w = CRIT.map((k) => { const r = B.rankings[k]; return r.verdict === 'DECIDED' ? FAM[r.best] : (r.why && /no family/.test(r.why) ? 'not defined' : 'REFUSED'); });
  const named = [...new Set(CRIT.map((k) => B.rankings[k]).filter((r) => r.verdict === 'DECIDED').map((r) => r.best))];
  critRows.push([b + ' · ' + BLK[blk]].concat(w).concat([named.length > 1 ? 'they differ' : 'they agree']));
}
const rlRows = [];
for (const b of BUOYS) for (const blk of BB) {
  const B = L.buoys[b].blocks[blk], f = B.rankings.ad.best, F = f ? B.fits[f] : null;
  rlRows.push(F ? [b + ' · ' + BLK[blk], FAM[f], f2(F.returnLevel[100].hi), F.returnLevel[1000] ? f2(F.returnLevel[1000].hi) : '—', B.max] : [b + ' · ' + BLK[blk], 'REFUSED', '—', '—', B.max]);
}
const SYMB = { mu: 'μ', sigma: 'σ', k: 'k', lambda: 'λ', alpha: 'α', c: 'c', beta: 'β', q: 'Q' };
const boxFam = (f) => { const F = L.buoys.C.blocks.daily.fits[f]; return [FAM[f], F.certified ? F.names.map((nm) => SYMB[nm] || nm).join(', ') + (F.coords ? ' (Prentice)' : '') : '—', F.certified ? F.theta.map((t) => Number(t).toPrecision(6)).join(', ') : 'at its limit', F.certified ? half(F).toExponential(1) : '—', F.certified ? F.criteria.ad.lo + ' … ' + F.criteria.ad.hi : '—']; };
const cdWidest = FAMS.filter((f) => L.buoys.C.blocks.daily.fits[f].certified).reduce((m, f) => (half(L.buoys.C.blocks.daily.fits[f]) > half(L.buoys.C.blocks.daily.fits[m]) ? f : m), 'normal');
const boxRows = FAMS.map(boxFam);
const verdictOf = (r) => {
  if (r.id === 'c8' && r.reproducesTz) return 'the certified Weibull MLE of the zero-up-crossing period Tz, not of Hs';
  if (r.reproduces && r.id === 'c3') return 'a certified local maximum (Hessian negative definite) of its unbounded likelihood; the digits are its rounding';
  if (r.reproduces) return 'the rounding of the certified maximum-likelihood fit';
  if (r.belowLocation[0] > 0) return fmt(r.belowLocation[0]) + ' hours below the printed location: zero density';
  if (r.belowLocation[1] > 0) return 'the location is the smallest hour to the printed digits: undecided whether it lies below it';
  if (r.deficit && Number(r.deficit.lo) > 0) return 'below the certified maximum by ' + fmt(Number(r.deficit.lo).toFixed(0)) + ' or more (a least-squares fit, by design)';
  if (r.estimator === 'weighted least squares') return 'not a maximum-likelihood fit (weighted least squares); too few printed digits to bound the gap';
  return '—';
};
const printedRows = [];
for (const id of ['c12', 'c3', 'c4', 'c8', 'c9']) for (const b of BUOYS) { const r = row(id, b); printedRows.push([CONTRIB[id], b, FAM[r.family], r.printed.join(', '), verdictOf(r), f2(r.rl100.lo) + '–' + f2(r.rl100.hi)]); }
const VSHORT = { OFF_THE_MAXIMUM: 'off the maximum', OUTSIDE_SUPPORT: 'outside its support', BELOW_A_MEMBER: 'below a member' };
const BSHORT = { native: 'hourly', daily: 'daily', weekly: 'weekly', monthly: 'monthly', annual: 'annual' };
const scipyRows = scRows.filter((q) => VSHORT[q.e.verdict]).map((q) => [q.b + ' ' + BSHORT[q.blk], FAM[q.f], q.mode === 'floc0' ? 'floc=0' : 'loc free', VSHORT[q.e.verdict], f2(q.e.level100) + (q.e.level100Shift && Number(q.e.level100Shift) !== 0 ? ' (' + (Number(q.e.level100Shift) > 0 ? '+' : '−') + f2(Math.abs(Number(q.e.level100Shift))) + ')' : ''), q.e.deficit ? fmt(Number(q.e.deficit).toPrecision(4)) : (q.e.below ? fmt(q.e.below) + ' datum below' : '—')]);

/* ================= the page ================= */
const Bk = [];
const total = certified + ggEdge + ewStop;
const fmtA = (a) => fmt(Math.round(a));
const nearAlpha = nearLimit.map((q) => q.alpha);
Bk.push(C.header({
  eyebrow: 'cert-machine · the registry · every fit re-certified at this build',
  title: 'The return-level table as a certificate.',
  deck: 'An offshore structure is designed to a wave height with a return period, and that number comes out of a chain: block the record, fit a distribution, pick one by a goodness-of-fit statistic, invert its tail. Reis, Guimarães, Farina, Paul, de Paula and Ribeiro (Ocean Engineering, 2026) ran the chain over a global hindcast with six families and four criteria. This page runs the same chain — the same six families, the same blocks, the same four criteria — on ' + BUOYS.length + ' NDBC buoys' + (W ? ' and on the paper\'s own hindcast at ' + Object.keys(W.points).length + ' grid points' : '') + ', and certifies every link: each fit is proved to be the likelihood\'s one maximum in a box, every statistic and level is an enclosure over that box, and every choice of family is DECIDED or REFUSED. Then it decides the Hs marginals other people printed for the same buoys.'
}));
Bk.push(C.tldr({
  findingRaw: '<strong>' + certified + ' of ' + total + ' fits certified — six families × five block sizes × three buoys — each a box, at most ±' + maxBox.toExponential(1) + ' wide, proved to hold the likelihood\'s one maximum in it. Of the other ' + num(ggEdge + ewStop) + ', ' + num(ggEdge) + ' are the generalized gamma, whose likelihood is proved to peak at the family\'s lognormal limit — on ' + ggEdgeWords + ' — so the lognormal, which is ranked, stands for it; and ' + num(ewStop) + ' are the exponentiated Weibull on ' + stopWords + ', still rising past α = 10⁴, where nothing is proved: those ' + num(refusedAt.length) + ' choices are REFUSED. The other ' + decidedAD + ' Anderson–Darling choices are DECIDED.</strong> '
    + 'The paper\'s "exponentiated Weibull best for high-frequency data" holds on one buoy of three — the lognormal wins B\'s hourly series and the generalized gamma wins C\'s; its "Weibull more appropriate as the block size increases" holds on none — the Weibull is the decided best of nothing; its "the choice of criterion changes the selection" holds, on ' + num(FB.disagree.length) + ' of twelve series; and the block size moves the preferred family\'s 100-year wave by a factor of up to ' + Number(aggMax.factor).toFixed(2) + '. The generalized gamma, which the paper maps as prominent at high southern latitudes, is here the decided best on two series of twelve and peaks at its lognormal limit on eight. '
    + (W ? 'On the paper\'s own hindcast at ' + FW.series + ' nodes — the Campos and Santos basins among them — the unfiltered 3-hourly series go the same several ways: the exponentiated Weibull is the decided best at ' + FW.nativeEw + ', ' + nativeTally(FW) + '; the Weibull is the decided best of none of the ' + FW.series * PB.length + ' paper-block series; the four criteria split on ' + FW.disagree.length + '. On ' + num(nearLimit.length) + ' series the generalized gamma\'s maximum sits beside its lognormal limit, at α from ' + fmtA(Math.min(...nearAlpha)) + ' to ' + fmtA(Math.max(...nearAlpha)) + ': the generalized gamma wins ' + nearFlips + ' of their ' + nearLimit.length * CRIT.length + ' choices, and a fit that stops at α = 500 and calls it the limit hands every one of them to another family. At the Arabian Sea node every choice is REFUSED — the exponentiated Weibull still rising past α = 10⁴ — and left out, it would hand the choice to ' + FAMW[arab.fam] + ', whose 100-year wave is ' + arab.v.toFixed(2) + ' m against a 32-year record of ' + arab.max.toFixed(2) + ' m. ' : '')
    + 'Then the same data, other people\'s numbers: the Hs marginals the benchmark\'s teams printed for the same ten years of buoy A put the 100-year wave anywhere from ' + f2(spreadA.lo) + ' m to ' + f2(spreadA.hi) + ' m; one printed row is the fit of the wave <em>period</em>; one leaves ' + fmt(row('c9', 'A').belowLocation[0]) + ' observed hours outside its distribution. And scipy, called as the paper writes the families, agrees with the certificate on ' + sc.AGREES + ' fits of ' + floc0Certified + ' — and prints a generalized-gamma fit for each of the ' + num(sc.BELOW_ITS_LIMIT) + ' series where the family peaks at its limit, every one of them below it.',
  mechanismRaw: 'A maximum-likelihood estimate is a zero of the score equations. A float climb (Nelder–Mead, then Levenberg–Marquardt on the likelihood) finds a candidate; the Krawczyk operator then evaluates the score and its Jacobian in outward-rounded interval arithmetic over a box around it — every datum enclosed by its neighbouring doubles, every sum over the data taken by Sum2 with its rounding-error bound added outward — and a box the operator maps strictly inside itself holds exactly one zero; the Hessian is then proved negative definite over the same box (Sylvester\'s criterion, or definiteness at the candidate with every Hessian in the box nonsingular), so that zero is the likelihood\'s maximum there. The generalized gamma needs lnΓ, the digamma and trigamma functions and the regularized incomplete gamma: the first three are enclosed from their asymptotic series with the first omitted term as a proved bound (Binet\'s formula), the last from its power series with a geometric tail. Its maximum is searched for from both ends of the family — from the Weibull, and from the lognormal it tends to as α → ∞ — and certified in Prentice\'s (μ, σ, Q), whose likelihood is written as power series in Q with proved tails, so that the lognormal, Q = 0, is an ordinary point. Where no maximum lies above the lognormal\'s, ∂ℓ/∂Q is proved negative over a stated neighbourhood of the lognormal fit: the family peaks at its limit. Each criterion is an enclosure over the box; χ² bins every datum exactly, as a rational; a family is ranked below another only when its enclosure lies wholly below.',
  checkRaw: C.m('node instruments/hseva/battery.js') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (among them: logarithms skewed to the right refuse the generalized gamma at its limit, with the proof; a 40,000-point generalized gamma at α = 900 is certified beside its limit, where a stop at α = 500 misses it; a family stopped at its boundary blocks the ranking; a saddle is not a maximum; an expected count straddling 5 refuses χ²; a location above the data leaves them outside the support), every family\'s derivatives against finite differences, the gamma family against its closed forms, the Prentice series against the direct form, and the daily, weekly, monthly and annual blocks re-certified live. ' + C.m('node tools/run-hseva-ledger.js') + ' rebuilds the whole ledger in about ' + Math.max(1, Math.round(L.seconds / 60)) + ' minutes.'
}));
Bk.push(C.stats([
  { k: 'fits certified', v: certified + ' of ' + total, n: 'each the likelihood\'s one maximum in a box within ±' + maxBox.toExponential(1) + '; ' + ggEdge + ' generalized-gamma fits proved to peak at the lognormal limit; ' + ewStop + ' refused' },
  { k: 'choices decided', v: decidedAD + ' of ' + rankedAD, n: 'by Anderson–Darling, the paper\'s selector; the ' + num(refusedAt.length) + ' refused are ' + stopWords },
  { k: 'exp. Weibull, unfiltered', v: W ? '1 of 3 · ' + FW.nativeEw + ' of ' + FW.series : '1 of 3', n: W ? 'the paper\'s "best for high-frequency data": on one buoy of three, and at ' + FW.nativeEw + ' of the ' + FW.series + ' nodes of its own hindcast' : 'the paper\'s "best for high-frequency data": the lognormal wins B and the generalized gamma wins C' },
  { k: 'generalized gamma', v: 'best 2 · at its limit 8', n: 'of twelve paper-block buoy series: the decided best on C\'s hourly and daily; its likelihood peaks at the lognormal limit on every one of A\'s and B\'s' },
  { k: '100-year Hs, buoy A, printed', v: f1(spreadA.lo) + '–' + f1(spreadA.hi) + ' m', n: 'five marginals the benchmark\'s teams printed for the same ten years' },
  { k: 'scipy, floc = 0', v: sc.AGREES + ' of ' + floc0Certified, n: 'agree with the certificate to half a centimetre; ' + sc.BELOW_ITS_LIMIT + ' generalized-gamma fits printed below the limit the family peaks at' },
]));

Bk.push(C.section({
  lab: '§1 · the certificate', title: 'What "fitted" means here',
  wide: true,
  bodyRaw: C.table({ cols: [{ h: 'family' }, { h: 'parameters' }, { h: 'certified point', cls: 'n' }, { h: 'box half-width', cls: 'n' }, { h: 'A² enclosure', cls: 'n' }], rows: boxRows })
    + '<div class="col">' + C.pRaw('Buoy C, daily maxima, ' + fmt(L.buoys.C.blocks.daily.n) + ' points. A fitted distribution is usually a number an optimiser stopped at; here it is a box the Krawczyk operator has proved to contain exactly one stationary point of the likelihood — the score and its Jacobian evaluated over the whole box in arithmetic that rounds outward at every step — and over which the Hessian is proved negative definite, so the point is the likelihood\'s maximum there. Every later number is computed over that box, so a statistic or a level is an enclosure whose width is stated, not a float\'s last digits. The widest box here is ' + FAMW[cdWidest] + '\'s, ±' + half(L.buoys.C.blocks.daily.fits[cdWidest]).toExponential(1) + '. ' + (L.buoys.C.blocks.daily.fits.gengamma.coords ? 'The generalized gamma is certified in Prentice\'s coordinates (μ, σ, Q), the same distribution with its long (α, c, λ) ridge straightened. ' : '') + 'On buoys A and B its likelihood peaks at the family\'s lognormal limit: the derivative of the likelihood in Q is proved negative over a stated neighbourhood of the lognormal fit, so every member there is less likely than the lognormal\'s maximum, and the search — started from both ends of the family — found no maximum inside it above that. It is left out of the ranking, named, because the lognormal it tends to is ranked. On ' + stopWords + ' the exponentiated Weibull\'s climb passes α = 10⁴ with the likelihood still rising; nothing is proved there, so those choices are REFUSED rather than handed to the families that did converge.') + '</div>'
}));
Bk.push(C.section({
  lab: '§2 · the four criteria', title: 'Anderson–Darling, enclosed, and what the other three say',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'Buoy C: the upper end of the Anderson–Darling enclosure for every certified family at every block size, on a log axis. Lower is better; the family the statistic prefers at each block size is bright. Hover for the enclosure and the parameters.' })
    + C.table({ cols: [{ h: 'buoy · block' }, { h: 'n', cls: 'n' }].concat(FAMS.map((f) => ({ h: FAM[f], cls: 'n' }))).concat([{ h: 'Anderson–Darling picks' }]), rows: rankRows })
    + C.table({ cols: [{ h: 'buoy · block' }].concat(CRIT.map((k) => ({ h: CRN[k] }))).concat([{ h: 'the four' }]), rows: critRows })
    + '<div class="col">' + C.pRaw('The first table is the paper\'s selector: A² for every family, "at its limit" where the generalized gamma\'s likelihood peaks at the lognormal, REFUSED where no maximum is certified. The unfiltered hourly series go three ways — the exponentiated Weibull on A (' + Number(L.buoys.A.blocks.native.fits.expweibull.criteria.ad.hi).toFixed(1) + ' against the lognormal\'s ' + Number(L.buoys.A.blocks.native.fits.lognormal.criteria.ad.hi).toFixed(0) + '), the lognormal on B (' + Number(L.buoys.B.blocks.native.fits.lognormal.criteria.ad.hi).toFixed(1) + ' against ' + Number(L.buoys.B.blocks.native.fits.expweibull.criteria.ad.hi).toFixed(1) + '), the generalized gamma on C (' + Number(L.buoys.C.blocks.native.fits.gengamma.criteria.ad.hi).toFixed(1) + ' against ' + Number(L.buoys.C.blocks.native.fits.expweibull.criteria.ad.hi).toFixed(1) + '). As the blocks grow, the winner moves, but never to the Weibull. On the annual maxima the Gumbel — the classical law of block maxima, one of the paper\'s six — is the decided best on B; on A and C the choice is refused, the exponentiated Weibull\'s climb still rising at α = 10⁴. The second table asks the paper\'s other question: do the four criteria pick the same family? Mostly yes; on ' + FB.disagree.map((d) => d.series.replace('buoy ', '') + '\'s ' + BLK[d.block] + ' they split — ' + splitWords(d.winners)).join('; on ') + '. χ² is undefined on the annual maxima of B, where no bin keeps an expected count of five — undefined, as the paper has it, not guessed. Every DECIDED choice here is decided in the sense that the enclosures do not overlap; that ranks the criterion\'s arithmetic on this sample, and it is not a test that one family is the truer model.') + '</div>'
}));
const belowText = belowBy.map((x) => 'on ' + x.b + ' from the ' + listWords(x.q.map((y) => y.blk)) + ' maxima (' + x.q.map((y) => f2(y.v)).join(', ') + ' m against ' + x.q[0].max.toFixed(2) + ' m)').join(', and ');
Bk.push(C.section({
  lab: '§3 · the return levels', title: 'The 100- and 1000-year wave, by block',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG2, caption: 'Buoy A: the certified 100-year significant wave height for the families the statistic picks somewhere on this buoy, at each block size; the diamond is the family it picks at that block (none on the annual maxima, where the choice is refused). The dashed line is the largest hour in the record.' })
    + C.table({ cols: [{ h: 'buoy · block' }, { h: 'family the statistic picks' }, { h: '100-year Hs, m', cls: 'n' }, { h: '1000-year Hs, m', cls: 'n' }, { h: 'largest hour, m', cls: 'n' }], rows: rlRows })
    + '<div class="col">' + C.pRaw('The paper\'s third finding — that the temporal aggregation moves the return level — is here with numbers under it. Reading only the family the statistic picks at each of the paper\'s four blocks, the 100-year wave at buoy ' + aggMax.series.replace('buoy ', '') + ' runs from ' + aggMax.lo + ' m (' + BLK[aggMax.loBlock] + ', ' + FAMW[aggMax.loFamily] + ') to ' + aggMax.hi + ' m (' + BLK[aggMax.hiBlock] + ', ' + FAMW[aggMax.hiFamily] + '), a factor of ' + Number(aggMax.factor).toFixed(2) + ' from the same years of the same buoy; at A the factor is ' + Number(agg.find((q) => q.series === 'buoy A').factor).toFixed(2) + ' and at C ' + Number(agg.find((q) => q.series === 'buoy C').factor).toFixed(2) + '. On ' + num(belowMax.length) + ' of the ' + num(decidedAD) + ' decided buoy series the family the statistic prefers puts the 100-year wave below the largest hour the buoy has already recorded — ' + belowText + ': the best fit by Anderson–Darling is not a fit that respects the extreme already on the record. Each level is the quantile at 1 − b/(T·8766) for a block of b hours, over the certified box; the enclosures are narrower than a millimetre and printed at their upper end. That width is the arithmetic\'s: the sampling uncertainty of a 1000-year level from twenty years is statistical, and it is not in these numbers — a certified fit is a certified point estimate.') + '</div>'
}));
Bk.push(C.section({
  lab: '§4 · the paper', title: 'Its findings, read against three buoys' + (W ? ' and its own hindcast' : ''),
  bodyRaw: C.pRaw('"' + Q.ewHighFrequency + '." With all six families, decided for it on buoy A\'s hourly series and against it on B\'s and C\'s. "' + Q.weibullLargeBlocks.charAt(0).toUpperCase() + Q.weibullLargeBlocks.slice(1) + '." Not on these buoys: the Weibull is the decided best of none of the twelve series at the paper\'s blocks, nor of the annual maxima where a choice is decided. "' + Q.aggregationMatters.charAt(0).toUpperCase() + Q.aggregationMatters.slice(1) + '." Both halves hold: the criteria split on ' + num(FB.disagree.length) + ' series, and the block size moves the 100-year wave by up to a factor of ' + Number(aggMax.factor).toFixed(2) + '. The generalized gamma — which the paper finds prominent at higher southern latitudes and in the daily blocks south of South America — is here certified on every paper-block series of buoy C, the best on two of them, and on buoys A and B peaks at its lognormal limit: whatever a fitting routine prints for it there is a point below the lognormal it is heading to (scipy\'s, §' + (W ? 6 : 5) + ', by ' + (limitDefLo < 1 ? limitDefLo.toFixed(2) : fmt(limitDefLo.toFixed(1))) + ' to ' + fmt(limitDefHi.toFixed(0)) + ' log-likelihood units). ' + (W ? 'On the paper\'s own hindcast the family is the decided best on ' + FW.gengamma.decidedBest.length + ' of ' + FW.series * PB.length + ' series — ' + num(nearBest) + ' of them with its maximum beside that limit, at α near a thousand or more. ' : '') + 'The paper reads its grid; this page reads three buoys' + (W ? ' and ' + Object.keys(W.points).length + ' of the grid\'s own points (§5)' : '') + ', and says where the two agree and where they do not.')
}));
if (W) {
  const pts = Object.keys(W.points);
  const wRows = pts.map((p) => {
    const Pp = W.points[p], nat = Pp.blocks.native, r = nat.rankings.ad;
    const ggS = PB.map((blk) => { const G = Pp.blocks[blk].fits.gengamma; return G.certified ? (Pp.blocks[blk].rankings.ad.best === 'gengamma' ? 'best' : 'fit') : G.edge ? 'limit' : 'refused'; }).join(' · ');
    return [p, fmt(Pp.n), r.verdict === 'DECIDED' ? FAM[r.best] : 'REFUSED', PB.map((blk) => { const q = Pp.blocks[blk].rankings.ad; return q.verdict === 'DECIDED' ? FAM[q.best] : 'refused'; }).join(' · '), ggS, r.verdict === 'DECIDED' ? f2(nat.fits[r.best].returnLevel[100].hi) : '—', nat.max];
  });
  const nearWords = listWords(nearLimit.map((q) => 'the ' + (q.blk === 'native' ? 'unfiltered series' : BLK[q.blk]) + ' ' + nodeIn(q.p) + ' (α ' + fmtA(q.alpha) + ')'));
  const ewStopW = []; for (const [p, Pp] of Object.entries(W.points)) { const bl = PB.filter((blk) => Pp.blocks[blk].fits.expweibull.stoppedAtBoundary); if (bl.length) ewStopW.push({ p, bl }); }
  const ewStopN = ewStopW.reduce((a, q) => a + q.bl.length, 0);
  const ewStopWords = listWords(ewStopW.map((q) => (q.bl.length === PB.length ? 'every block ' : 'the ' + listWords(q.bl.map((blk) => (blk === 'native' ? 'unfiltered series' : BLK[blk]))) + ' ') + nodeIn(q.p)));
  Bk.push(C.section({
    lab: '§5 · the paper\'s own data', title: 'The same method on the paper\'s hindcast',
    wide: true,
    bodyRaw: C.table({ cols: [{ h: 'grid point' }, { h: '3-hourly values', cls: 'n' }, { h: 'unfiltered: A² picks' }, { h: 'unfiltered · daily · weekly · monthly' }, { h: 'gen. gamma, by block' }, { h: '100-year Hs, m', cls: 'n' }, { h: 'largest value, m', cls: 'n' }], rows: wRows })
      + '<div class="col">' + C.pRaw('Ifremer\'s WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 — the paper\'s data, 3-hourly on a 0.5° grid, 1993–2024 — read at ' + pts.length + ' of its nodes: the Campos and Santos basins and four more on the Brazilian margin, and points in the regions the paper describes by name. Every hs chunk of every monthly file was fetched by byte range and hashed as read (corpus/ww3-points). On these points: the exponentiated Weibull is the decided best of the unfiltered series on ' + FW.nativeEw + ' of ' + FW.series + '; the Weibull is the decided best of ' + (PB.map((blk) => FW.weibullByBlock[blk].decided).reduce((a, b) => a + b, 0) || 'none') + ' of the ' + FW.series * PB.length + ' paper-block series; the four criteria split on ' + FW.disagree.length + '; the generalized gamma is certified on ' + FW.gengamma.certified + ' and the decided best on ' + FW.gengamma.decidedBest.length + ', and on the other ' + FW.gengamma.edge + ' its likelihood peaks at the lognormal limit' + (FW.gengamma.refused ? ' (on ' + FW.gengamma.refused + ' no maximum is certified and the choice is refused)' : '') + '.')
      + C.pRaw('Two things a fitting routine can do silently are decided here. On ' + num(nearLimit.length) + ' series — ' + nearWords + ' — the generalized gamma\'s maximum lies beside its lognormal limit, far out on the ridge where α, c and λ run together; certified there, it wins ' + nearFlips + ' of their ' + nearLimit.length * CRIT.length + ' choices — Anderson–Darling\'s on ' + num(nearBest) + ' of the ' + num(nearLimit.length) + ' — and a climb that stops at α = 500 and takes the limit for the answer hands every one of them to another family. Its certificate there is in Prentice\'s coordinates, with the likelihood written as power series in Q so that nothing is divided by the small number the ridge is made of. And the exponentiated Weibull\'s climb passes α = 10⁴ still rising on ' + ewStopN + ' series (' + ewStopWords + '): no maximum is certified and none is proved absent, so those choices are REFUSED. At the Arabian Sea that is every choice, and the refusal matters: left out, the family would hand the unfiltered choice to ' + FAMW[arab.fam] + ', whose 100-year wave is ' + arab.v.toFixed(2) + ' m against a largest 3-hourly value in thirty-two years of ' + arab.max.toFixed(2) + ' m — ' + (arab.v / arab.max).toFixed(1) + ' times the record. Where the unfiltered choice is decided, the preferred family\'s 100-year wave is at most ' + Math.round(100 * (wRatio.v / wRatio.max - 1)) + ' % above the record (at ' + nodeName(wRatio.p) + '), and within ' + Math.round(100 * (Math.max(wCampos, wSantos) - 1)) + ' % of it at Campos and Santos. A handful of nodes is not the paper\'s global map; it is the paper\'s method, decided, on the paper\'s own numbers, at places anyone can name.') + '</div>'
  }));
}
Bk.push(C.section({
  lab: '§' + (W ? 6 : 5) + ' · the same data, different numbers', title: 'What other people printed for these buoys',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG3, caption: 'Buoy A, the provided ten years every benchmark team fitted: the hourly 100-year Hs implied by five printed marginals (each over every value its printed digits allow) and by three certified maximum-likelihood fits on the same hours.' })
    + C.table({ cols: [{ h: 'who' }, { h: 'buoy' }, { h: 'family' }, { h: 'printed' }, { h: 'decided' }, { h: '100-year Hs, m', cls: 'n' }], rows: printedRows })
    + '<div class="col">' + C.pRaw('The environmental-contour benchmark (Haselsteiner et al., Ocean Engineering 2021) gave nine teams the same ten years of buoy data; its appendix prints the Hs marginal each fitted. Every printed row is decided here against those hours. Contribution 8\'s two-parameter Weibull for A and B is exactly the maximum-likelihood fit, to its last digit; its row for C is also a certified maximum-likelihood Weibull — of the zero-up-crossing period, not of the wave height, so the table\'s Hs marginal for C describes the wrong variable. Contribution 3\'s three-parameter lognormal, fitted with scipy, is a certified local maximum on all three buoys, of a likelihood that has no global maximum (it grows without bound as the location approaches the smallest hour; Hill 1963) — which is what a free location buys. The baseline\'s location sits on the smallest hour of each buoy to every printed digit; whether that hour is inside the support is below the printed precision, and the page leaves it undecided. Contribution 9\'s locations leave ' + BUOYS.map((b) => fmt(row('c9', b).belowLocation[0])).join(', ') + ' hours of A, B and C below the support — hours its model says cannot happen, among the low sea states where the benchmark paper found that contribution\'s thousands of exceedances. Contribution 4 fitted by weighted least squares, deliberately not by likelihood, and sits ' + fmt(Number(c4defA.lo).toFixed(0)) + ' or more log-likelihood units below the exponentiated Weibull\'s maximum on A — a different estimator, not an error. Together: from the same ten years of one buoy, a 100-year wave anywhere from ' + f2(spreadA.lo) + ' to ' + f2(spreadA.hi) + ' m.') + '</div>'
    + C.table({ cols: [{ h: 'series' }, { h: 'family' }, { h: 'call' }, { h: 'decided' }, { h: '100-yr Hs, m (vs certified)', cls: 'n' }, { h: 'ℓ below', cls: 'n' }], rows: scipyRows })
    + '<div class="col">' + C.pRaw('scipy ' + SP.scipy + ', the routine a Python pipeline reaches for, called on the same block maxima two ways. With the location fixed at zero — the families as the paper writes them — it agrees with the certificate to half a centimetre on ' + sc.AGREES + ' fits of ' + floc0Certified + '; on ' + sc.OFF_THE_MAXIMUM + ' it stops short — the generalized gamma on C\'s hourly series ' + fmt(Number(offGG.deficit).toFixed(1)) + ' log-likelihood units below the maximum, its 100-year wave ' + f2(-Number(offGG.level100Shift)) + ' m low; the exponentiated Weibull on A\'s weekly maxima just ' + Number(offEW.deficit).toPrecision(2) + ' units below, and ' + (100 * -Number(offEW.level100Shift)).toFixed(1) + ' cm low, because that likelihood is nearly flat along a ridge; for the ' + num(sc.BELOW_ITS_LIMIT) + ' generalized-gamma series whose likelihood peaks at the lognormal limit it prints a point on the way — ' + (limitDefLo < 1 ? limitDefLo.toFixed(2) : fmt(limitDefLo.toFixed(1))) + ' to ' + fmt(limitDefHi.toFixed(0)) + ' log-likelihood units below the lognormal\'s maximum — and a return level with it; and where the certificate refuses the exponentiated Weibull (' + stopWords + ') it prints one too, which nothing here can decide. Called the default way, location free, it fits a different model whose likelihood is unbounded (Smith 1985), and prints where its optimiser stopped: the 100-year wave moves by −' + f2(-shiftRange[0]) + ' to +' + f2(shiftRange[1]) + ' m against the certified fixed-location fit; one Weibull puts its location above one of A\'s monthly maxima (' + Number(outW.loc).toFixed(3) + ' m against ' + outW.minDatum + ' m), so an observed month has zero density; and ' + sc.BELOW_A_MEMBER + ' default fits lie below a member of their own family — on A\'s hourly series by ' + fmt(Number(bigEW.deficit).toFixed(0)) + ' log-likelihood units, with a 100-year wave of ' + f2(bigEW.level100) + ' m against the certified ' + f2(Number(bigEW.level100) - Number(bigEW.level100Shift)) + '. None of this is a bug in scipy. It is what "fit the family by maximum likelihood" leaves unsaid: where the location sits, what to do when the likelihood runs to the edge of the family, and when to stop. That packages disagree on the three-parameter Weibull is old news (Harper, Eschenbach & James, The American Statistician, 2011); what is new here is that each disagreement is decided.') + '</div>'
}));
Bk.push(C.section({
  lab: '§' + (W ? 7 : 6) + ' · who certifies', title: 'A certificate anyone can check, and nobody has to trust',
  bodyRaw: C.pRaw('In the regulatory sense nothing on this page certifies anything: offshore units are approved by classification societies under the rules of the national regulators, and a design basis is theirs to accept. What is offered here is a different object — a certificate of the arithmetic, and a file anyone can check. For each fit it records the digest of the data, the choices made (the family, the block, the criterion, the return period, where the location sits), a box the Krawczyk operator proved to hold exactly one stationary point of the likelihood with the Hessian negative definite over it — the likelihood\'s maximum in that box — and an enclosure of every criterion and level over the box; for the generalized gamma at its lognormal limit, the proof that its likelihood peaks there; or REFUSED, with the reason, where no maximum is certified or the enclosures overlap. Checking it needs the data and a verifier that shares no code with whoever fitted the model — not the fitter\'s trust, and not this page\'s. So confidential data can stay where they are held: the check runs there, and only the certificate travels. A standard for marginal fits then has two halves — the choices it fixes, and a certificate that shows each deliverable computed exactly those — and a disagreement between two laboratories becomes one of three things, each decidable: a different declared choice, an arithmetic that did not reach the maximum, or a fit printed where the certificate finds none.') + C.pRaw('To try it on a series of your own: <a href="/instruments/return-level-check/">the return-level check</a> runs this same code in your browser — on any record you drop there, or on the Campos Basin node of the paper\'s hindcast — certifies the six fits, and writes the certificate for download; the file is read in the tab and sent nowhere. It also decides a fit someone printed.')
}));
Bk.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('It does not decide the paper\'s global maps: ' + (W ? 'three buoys and ' + Object.keys(W.points).length + ' hindcast nodes are points, not a grid' : 'three buoys are held here, not its grid') + '. What is certified is the arithmetic of the method: that each fit is the likelihood\'s one maximum in its box, that every statistic and level is what the box implies, that each ranking follows from the enclosures. That no better maximum exists elsewhere in a family is the search\'s claim — for the generalized gamma three climbs, from the Weibull and from the lognormal — as it is any optimiser\'s. "At its limit" means the generalized gamma\'s likelihood is proved to fall as Q grows from 0 over a stated neighbourhood of the lognormal fit (∂ℓ/∂Q &lt; 0 there, recorded with each), and the search found no maximum inside the family above the lognormal\'s: a local proof, like every certified maximum here. A climb that passes α = 10⁴ proves nothing, and the choice it touches is refused. The certificate is of the point estimate given the data; the sampling width of a 100- or 1000-year level is a different, statistical quantity and is not enclosed. Hours and block maxima are treated as independent draws by every family, as they are in the paper. The buoys are the benchmark\'s A, B and C with provided and retained years joined; the printed marginals are decided on the provided years alone, the hours they were fitted to. The paper\'s χ² and MSE are reconstructed from its §2.2 (Sturges bins with at least eight, expected counts of five, the empirical CDF with ties); its code is not held. The data are NDBC\'s and Ifremer\'s, pinned by digest; the hindcast\'s extracted series are CC BY-SA 4.0 as the dataset is.')
}));
const foot = '<p>Generated by tools/build-report-hseva.js @ git ' + git + '. Gates at this build: the hseva battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired; the daily, weekly, monthly and annual blocks re-certified live), every sentence above gated on the ledger field it reads. Ledger generated ' + L.generated + ' in ' + L.seconds + ' s; scipy ' + SP.scipy + ' recorded ' + SP.recorded + '.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'return-levels.html'),
  TPL.render({ title: 'The return-level table as a certificate', bodyRaw: Bk.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/return-levels.html',
    desc: 'The extreme-value method of Reis, Guimarães et al. (Ocean Eng. 2026) — six families fitted by maximum likelihood to significant wave height, four goodness-of-fit criteria, block maxima, 100- and 1000-year return levels — repeated on NDBC buoys and on the paper\'s own hindcast with every fit certified, then the Hs marginals other teams and scipy printed for the same buoys, decided.' }));
console.log('reports/return-levels.html written: ' + certified + '/' + total + ' fits certified (' + ggEdge + ' at the generalized gamma\'s limit, ' + ewStop + ' refused), ' + decidedAD + '/' + rankedAD + ' choices decided, battery ' + nChecks + ' checks / ' + nReds + ' reds' + (W ? ', ' + Object.keys(W.points).length + ' hindcast points' : ', no hindcast yet') + ' @ git ' + git);
