#!/usr/bin/env node
/* run-hseva-ledger.js — the return-level table as a certificate. Writes
   certs/hseva-ledger.json.

   THE METHOD is that of Reis, Guimarães, Farina, Paul, de Paula and Ribeiro
   (Ocean Engineering 359, 2026, 125841), read from its full text: six families
   (normal, lognormal, Weibull, exponentiated Weibull, generalized gamma,
   Gumbel) fitted by maximum likelihood to the unfiltered series and to daily,
   weekly and monthly block maxima; four goodness-of-fit criteria
   (Kolmogorov–Smirnov, Anderson–Darling, χ² on Sturges bins, MSE), Anderson–
   Darling the one that selects; 100- and 1000-year return levels. Here every
   fit is CERTIFIED — the Krawczyk operator proves a box around the candidate
   holds exactly one zero of the score — and every criterion and level is an
   enclosure over that box; each criterion's choice of family is DECIDED or
   REFUSED.

   THREE BODIES OF DATA:
     buoys   the benchmark's NDBC buoys A, B, C (hourly, provided + retained
             years), at the paper's blocks and at annual maxima besides;
     ww3     the paper's own hindcast (Ifremer WAVEWATCH III, 3-hourly,
             1993–2024) at the grid points of corpus/ww3-points — present when
             tools/fetch-ww3-points.py has pinned all 384 months;
     printed the Hs marginals the benchmark's contributions printed for the
             provided years of A, B, C (corpus/ec-benchmark/marginals.json),
             each decided against the same data.

   A family whose likelihood rises to a boundary of the family (the float
   climb reaches the family's declared `edge`) has no maximum-likelihood fit;
   it is REFUSED with that reason and left out of the ranking, since the method
   has no fit of it to rank. A family refused for any other reason makes the
   ranking REFUSED: its fit might exist and win.

   usage: node tools/run-hseva-ledger.js            everything (several minutes; workers in parallel)
          node tools/run-hseva-ledger.js --check    re-derive and compare with the shipped ledger, write nothing
          node tools/run-hseva-ledger.js --quick    the buoys' daily, weekly, monthly and annual blocks only (the battery's live run)
          node tools/run-hseva-ledger.js --unit buoy:A | ww3:campos | printed   one unit as JSON on stdout (the workers) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const ROOT = path.resolve(__dirname, '..');
const BL = require(path.join(ROOT, 'instruments', 'hseva', 'blocks.js'));
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const { FAMILIES, PAPER_SIX } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const EL = require(path.join(ROOT, 'instruments', 'ecbench', 'lib.js'));
const IV = require(path.join(ROOT, 'instruments', 'interval', 'interval.js'));
const TR = require(path.join(ROOT, 'instruments', 'interval', 'transcendental.js'));
const die = (m) => { console.error('HSEVA LEDGER REFUSED: ' + m); process.exit(1); };
const arg = (k) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : null; };
const CHECK = process.argv.includes('--check'), QUICK = process.argv.includes('--quick'), UNIT = arg('--unit');
const OUT = path.join(ROOT, 'certs', 'hseva-ledger.json');
const FAMS = PAPER_SIX;
const CRIT = ['ad', 'ks', 'mse', 'chi2'];
const T = [10, 50, 100, 1000];
const PAPER_BLOCKS = ['native', 'daily', 'weekly', 'monthly'];
const BUOY_BLOCKS = QUICK ? ['daily', 'weekly', 'monthly', 'annual'] : ['native', 'daily', 'weekly', 'monthly', 'annual'];

/* ---- numbers out: an enclosure is printed outward, so the strings still enclose ---- */
function outward(v, sig, up) {
  if (!Number.isFinite(v)) return String(v);
  if (v === 0) return '0';
  let s = v.toPrecision(sig), w = Number(s);
  if (up ? w < v : w > v) {
    const e = Math.floor(Math.log10(Math.abs(w))), step = Math.pow(10, e - sig + 1);
    s = (up ? w + step : w - step).toPrecision(sig);
  }
  return s;
}
const ivOut = (a, sig) => (a ? { lo: outward(a[0], sig || 10, false), hi: outward(a[1], sig || 10, true) } : null);

/* ---- one block: six fits, four criteria, four levels, four rankings ---- */
function fitBlock(S, blk) {
  const BM = BL.blockMaxima(S, blk);
  const prepared = FT.prepare(BM.x);
  const fits = {}, entries = [];
  for (const f of FAMS) {
    const t0 = Date.now();
    const c = FT.certify(f, BM.x, { prepared });
    if (!c.ok) {
      fits[f] = { certified: false, edge: !!c.edge, why: c.why, stop: c.theta ? c.theta.map((v) => Number(v).toPrecision(6)) : null, seconds: Number(((Date.now() - t0) / 1000).toFixed(1)) };
      entries.push({ family: f, refused: true, edge: !!c.edge });
      continue;
    }
    const cr = FT.criteria(c, S.den);
    const ll = c.fam.loglik(FT.intervalOps, c.box, c.Di);              /* the certificate's own family: its coordinates */
    const rl = {}; for (const yr of T) { const v = FT.returnLevel(c, yr, BM.hours); rl[yr] = v ? ivOut(v, 8) : null; }
    fits[f] = {
      certified: true, names: c.names, coords: c.coords || null, stacy: c.stacy ? c.stacy.map((v) => Number(v).toPrecision(9)) : null, stacyBox: c.stacyBox ? c.stacyBox.map((b) => [outward(b[0], 12, false), outward(b[1], 12, true)]) : null, theta: c.theta.map((v) => Number(v).toPrecision(9)), box: c.box.map((b) => [outward(b[0], 12, false), outward(b[1], 12, true)]),
      maxRad: c.maxRad.toExponential(2), rounds: c.rounds, iters: c.newtonIters, ll: ivOut(ll, 12),
      criteria: { ad: ivOut(cr.ad), ks: ivOut(cr.ks), mse: ivOut(cr.mse), chi2: cr.chi2.value ? Object.assign(ivOut(cr.chi2.value), { bins: cr.chi2.bins, kept: cr.chi2.kept }) : { value: null, refused: !!cr.chi2.refused, why: cr.chi2.why, bins: cr.chi2.bins || null } },
      returnLevel: rl, seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
    };
    entries.push({ family: f, ad: cr.ad, ks: cr.ks, mse: cr.mse, chi2: cr.chi2.value, chi2Refused: !!cr.chi2.refused });
  }
  const rankings = {}; for (const k of CRIT) rankings[k] = FT.rankRule(entries, k);
  const mx = BM.x.reduce((a, v) => (v > a ? v : a), 0);
  return { hours: BM.hours, n: BM.n, max: mx.toFixed(4), fits, rankings };
}
function unitBuoy(b) {
  const S = BL.series(b);
  const blocks = {}; for (const blk of BUOY_BLOCKS) blocks[blk] = fitBlock(S, blk);
  return { files: S.files, n: S.n, dropped: S.dropped, years: S.years, den: S.den, step: S.step, blocks };
}
function unitWw3(p) {
  const S = BL.ww3Series(p);
  const blocks = {}; for (const blk of PAPER_BLOCKS) blocks[blk] = fitBlock(S, blk);
  return { months: S.months, n: S.n, dropped: S.dropped, years: S.years, den: S.den, step: S.step, first: S.t[0], last: S.t[S.n - 1], blocks };
}

/* ---- the benchmark's printed marginals, decided on the provided years ---- */
function unitPrinted() {
  const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ec-benchmark', 'marginals.json'), 'utf8'));
  const oi = FT.intervalOps;
  const reference = {}, rows = [];
  const lnBox = (b) => [TR.log(IV.iv(b[0]))[0], TR.log(IV.iv(b[1]))[1]];
  for (const b of ['A', 'B', 'C']) {
    const S = BL.series(b, { provided: true });
    const xs = S.h, prepared = FT.prepare(xs), Di = prepared.Di;
    const ref = { n: S.n, min: Math.min(...xs).toFixed(4), max: Math.max(...xs).toFixed(4), file: S.files[0].rel, sha256: S.files[0].sha256, mle: {} };
    const cert = (f, data, opts) => {
      const c = FT.certify(f, data, opts);
      if (!c.ok) return { certified: false, why: c.why, edge: !!c.edge };
      const ll = c.fam.loglik(oi, c.box, c.Di);
      return { certified: true, c, out: { certified: true, theta: c.theta.map((v) => Number(v).toPrecision(9)), box: c.box.map((q) => [outward(q[0], 12, false), outward(q[1], 12, true)]), maxRad: c.maxRad.toExponential(2), ll: ivOut(ll, 12), rl100: ivOut(FT.returnLevel(c, 100, 1), 8), rl1000: ivOut(FT.returnLevel(c, 1000, 1), 8) }, ll };
    };
    const W = cert('weibull', xs, { prepared }), E = cert('expweibull', xs, { prepared }), LN = cert('lognormal', xs, { prepared });
    ref.mle.weibull = W.out || W; ref.mle.expweibull = E.out || E; ref.mle.lognormal = LN.out || LN;
    const tzW = cert('weibull', S.tz);                               /* the zero-up-crossing period, for contribution 8's row C */
    ref.mle.tzWeibull = tzW.out || tzW;
    for (const R of M.rows) {
      const v = R.values[b]; if (!v) continue;
      const P = {}; R.order.forEach((k, i) => { P[k] = FT.printedBox(v[i]); });
      let fam = R.family, theta, loc = P.loc || null;
      if (R.family === 'weibull') theta = [P.k, P.lambda];
      else if (R.family === 'expweibull') theta = [P.alpha, P.k, P.lambda];
      else if (R.family === 'lognormal3') { theta = [lnBox(P.expmu), P.sigma, P.loc]; loc = null; }
      const row = { id: R.id, contribution: R.contribution, table: R.table, buoy: b, family: R.family, printed: v, estimator: R.estimator };
      /* the data the fit says cannot occur: below the location (in the printed box: certainly, possibly) */
      const locIv = R.family === 'lognormal3' ? P.loc : loc;
      row.belowLocation = locIv ? [xs.filter((q) => q < locIv[0]).length, xs.filter((q) => q < locIv[1]).length] : [0, 0];   /* [certainly, possibly] */
      /* the log-likelihood over the printed box, where no datum can fall outside the support */
      let ll = null, llWhy = null;
      if (row.belowLocation[1] > 0) llWhy = row.belowLocation[0] > 0 ? 'minus infinity: ' + row.belowLocation[0] + ' hours lie below the printed location' : 'not stated: at the printed precision the location may lie above the smallest hour';
      else { try { ll = FT.llAt(fam, theta, loc, Di); } catch (e) { llWhy = 'not stated: ' + e.message; } }
      row.ll = ll ? ivOut(ll, 12) : null; if (llWhy) row.llWhy = llWhy;
      row.rl100 = ivOut(FT.levelAt(fam, theta, loc, 100, 1), 8);
      row.rl1000 = ivOut(FT.levelAt(fam, theta, loc, 1000, 1), 8);
      /* the verdict against the certified maximum of the same family on the same hours */
      const refFam = R.family === 'lognormal3' ? null : (R.family === 'weibull' && !loc ? W : R.family === 'expweibull' ? E : null);
      if (R.family === 'lognormal3') {
        const start = [Math.log(Number(v[0])), Number(v[1]), Number(v[2])];
        const L3 = cert('lognormal3', xs, { prepared, start });
        row.localMax = L3.out || L3;
        if (L3.certified) row.reproduces = L3.c.box.every((q, i) => theta[i][0] <= q[0] && q[1] <= theta[i][1]);
      }
      if (refFam && refFam.certified) {
        row.reproduces = refFam.c.box.every((q, i) => theta[i][0] <= q[0] && q[1] <= theta[i][1]);
        if (ll) row.deficit = ivOut(IV.sub(refFam.ll, ll), 8);      /* how far below the certified maximum of its own family */
      }
      if (R.id === 'c8' && tzW.certified) row.reproducesTz = tzW.c.box.every((q, i) => [P.k, P.lambda][i][0] <= q[0] && q[1] <= [P.k, P.lambda][i][1]);
      if (loc && W.certified && ll) row.deficitVsTwoParameter = ivOut(IV.sub(W.ll, ll), 8);
      rows.push(row);
    }
    reference[b] = ref;
  }
  return { what: 'The benchmark contributions\' printed Hs marginals (corpus/ec-benchmark/marginals.json) decided on the provided ten years of A, B, C — the hours they were fitted to. Levels are hourly sea-state levels: F⁻¹(1 − 1/(T·8766)).', reference, rows };
}

/* the block maxima exactly as the ledger fits them, for the scipy recorder (tools/run-hseva-scipy.py) */
function unitSeries(b) {
  const S = BL.series(b), out = {};
  for (const blk of ['native', 'daily', 'weekly', 'monthly', 'annual']) { const BM = BL.blockMaxima(S, blk); out[blk] = { hours: BM.hours, x: Array.from(BM.x) }; }
  return out;
}

if (UNIT) {
  const [kind, name] = UNIT.split(':');
  const r = kind === 'buoy' ? unitBuoy(name) : kind === 'ww3' ? unitWw3(name) : kind === 'printed' ? unitPrinted() : kind === 'series' ? unitSeries(name) : die('unknown unit ' + UNIT);
  process.stdout.write(JSON.stringify(r), () => process.exit(0));   /* exit only once a pipe has taken every byte */
} else {

/* ---- the whole ledger: units in parallel worker processes ---- */
EL.ensureCorpus();
const t0 = Date.now();
const ww3Dir = path.join(ROOT, 'corpus', 'ww3-points', 'months');
const ww3Meta = path.join(ROOT, 'corpus', 'ww3-points', 'meta.json');
const ww3Ready = !QUICK && fs.existsSync(ww3Meta) && fs.readdirSync(ww3Dir).filter((f) => /^\d{6}\.json$/.test(f)).length === 384;
const points = ww3Ready ? JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', 'points.json'), 'utf8')).points.map((p) => p.name) : [];
const units = ['buoy:A', 'buoy:B', 'buoy:C'].concat(QUICK ? [] : ['printed']).concat(points.map((p) => 'ww3:' + p));
const results = {};
function runAll() {
  return new Promise((resolve) => {
    const queue = units.slice(); let live = 0;
    const width = Math.max(1, Math.min(os.cpus().length - 1, 8));
    const next = () => {
      if (!queue.length && !live) return resolve();
      while (live < width && queue.length) {
        const u = queue.shift(); live++;
        const args = [__filename, '--unit', u].concat(QUICK ? ['--quick'] : []);
        const ch = cp.spawn(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'inherit'] });
        let buf = '';
        ch.stdout.on('data', (d) => { buf += d; });
        ch.on('close', (code) => {
          if (code !== 0) die('unit ' + u + ' exited ' + code);
          results[u] = JSON.parse(buf); live--;
          console.log('  ' + u.padEnd(24) + ' done at ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
          next();
        });
      }
    };
    next();
  });
}

/* ---- what scipy printed for the same series, decided (certs/hseva-scipy.json) ----
   floc0 is the family as the paper writes it; default is scipy's call without
   floc, a model with a free location whose likelihood is unbounded (Hill 1963;
   Smith 1985) — whatever it prints is where its optimiser stopped. Decided per
   fit: whether a datum lies below the printed location (the fitted density is
   zero there), and whether the printed point's log-likelihood lies below a
   certified member of its own family (so it is not a maximum of anything). */
function scipyDecide(buoys) {
  const file = path.join(ROOT, 'certs', 'hseva-scipy.json');
  if (!fs.existsSync(file)) return null;
  const SP = JSON.parse(fs.readFileSync(file, 'utf8'));
  const oi = FT.intervalOps;
  const thinOf = (f, p) => {                          /* scipy's (shape…, loc, scale) → our θ and location, as thin intervals */
    const v = p.map(Number), I = (x) => IV.iv(x);
    if (f === 'lognormal') return { theta: [TR.log(I(v[2])), I(v[0])], loc: v[1] };
    if (f === 'weibull') return { theta: [I(v[0]), I(v[2])], loc: v[1] };
    return { theta: [I(v[0]), I(v[1]), I(v[3])], loc: v[2] };           /* expweibull, gengamma: (a, c, loc, scale) */
  };
  const lowerBoundOfSup = (fits, f) => {             /* a certified member or limit of the family: its log-likelihood */
    if (fits[f].certified) return { lo: Number(fits[f].ll.lo), via: f };
    if (f === 'gengamma' && fits.lognormal.certified) return { lo: Number(fits.lognormal.ll.lo), via: 'lognormal (the limit of the family as α → ∞)' };
    if (f === 'expweibull' && fits.weibull.certified) return { lo: Number(fits.weibull.ll.lo), via: 'weibull (the family at α = 1)' };
    return null;
  };
  const out = { scipy: SP.scipy, numpy: SP.numpy, python: SP.python, recorded: SP.generated, buoys: {} };
  for (const b of Object.keys(SP.buoys)) {
    const S = BL.series(b);
    out.buoys[b] = {};
    for (const blk of Object.keys(SP.buoys[b])) {
      const BM = BL.blockMaxima(S, blk);
      const { Di } = FT.prepare(BM.x);
      const xmin = BM.x.reduce((a, v) => (v < a ? v : a), Infinity);
      const fits = buoys[b].blocks[blk] ? buoys[b].blocks[blk].fits : null;
      if (!fits) continue;
      const rec = {};
      for (const f of ['lognormal', 'weibull', 'expweibull', 'gengamma']) {
        const r = SP.buoys[b][blk][f], d = {};
        for (const mode of ['floc0', 'default']) {
          const q = r[mode];
          if (!q || q.error) { d[mode] = { error: q ? q.error : 'absent' }; continue; }
          const { theta, loc } = thinOf(f, q.params);
          const e = { params: q.params, level100: q.level['100'], level1000: q.level['1000'] };
          const below = BM.x.filter((x) => x < loc).length;
          if (mode === 'default') e.loc = String(loc);
          if (below > 0) { e.verdict = 'OUTSIDE_SUPPORT'; e.below = below; e.minDatum = xmin.toFixed(4); }
          else {
            let ll = null;
            try { ll = FT.llAt(f, theta, loc !== 0 ? IV.iv(loc) : null, Di); } catch (err) { e.llWhy = err.message; }
            if (ll) e.ll = ivOut(ll, 12);
            const lb = lowerBoundOfSup(fits, f);
            if (ll && lb && ll[1] < lb.lo) { e.deficit = outward(lb.lo - ll[1], 8, false); e.via = lb.via; }
            const lv = fits[f].certified && fits[f].returnLevel[100] ? [Number(fits[f].returnLevel[100].lo), Number(fits[f].returnLevel[100].hi)] : null;
            const v = Number(q.level['100']);
            if (lv) e.level100Shift = (v < lv[0] ? v - lv[0] : v > lv[1] ? v - lv[1] : 0).toFixed(4);   /* scipy's level minus the certified one, m */
            if (mode === 'floc0') {
              if (fits[f].certified) e.verdict = Math.abs(Number(e.level100Shift)) < 0.005 ? 'AGREES' : 'OFF_THE_MAXIMUM';
              else e.verdict = 'PRINTED_WITHOUT_A_MAXIMUM';
            } else e.verdict = e.deficit ? 'BELOW_A_MEMBER' : 'NOT_DECIDED';
          }
          if (mode === 'floc0' && !fits[f].certified && e.verdict !== 'OUTSIDE_SUPPORT') e.noMaximum = fits[f].why;
          d[mode] = e;
        }
        rec[f] = d;
      }
      out.buoys[b][blk] = rec;
    }
  }
  return out;
}

/* ---- the paper's findings, decided on every series held ---- */
function findings(series) {
  const F = { native: [], weibullByBlock: {}, disagree: [], aggregation: [], gengamma: { certified: 0, edge: 0, refused: 0, decidedBest: [] }, series: series.length };
  for (const blk of PAPER_BLOCKS) F.weibullByBlock[blk] = { decided: 0, of: 0 };
  for (const s of series) {
    for (const blk of PAPER_BLOCKS) {
      const B = s.blocks[blk]; if (!B) continue;
      const r = B.rankings.ad;
      F.weibullByBlock[blk].of++;
      if (r.verdict === 'DECIDED' && r.best === 'weibull') F.weibullByBlock[blk].decided++;
      const w = {}; for (const k of CRIT) w[k] = B.rankings[k].verdict === 'DECIDED' ? B.rankings[k].best : null;
      const named = [...new Set(Object.values(w).filter(Boolean))];
      if (named.length > 1) F.disagree.push({ series: s.id, block: blk, winners: w });
      const G = B.fits.gengamma;
      if (G.certified) F.gengamma.certified++; else if (G.edge) F.gengamma.edge++; else F.gengamma.refused++;
      if (r.verdict === 'DECIDED' && r.best === 'gengamma') F.gengamma.decidedBest.push(s.id + '/' + blk);
    }
    const rn = s.blocks.native.rankings.ad;
    F.native.push({ series: s.id, verdict: rn.verdict, best: rn.best || null, why: rn.why || null });
    const lv = PAPER_BLOCKS.map((blk) => { const B = s.blocks[blk]; const r = B.rankings.ad; return r.verdict === 'DECIDED' ? { blk, fam: r.best, v: Number(B.fits[r.best].returnLevel[100].hi) } : null; }).filter(Boolean);
    if (lv.length >= 2) {
      const lo = lv.reduce((m, q) => (q.v < m.v ? q : m)), hi = lv.reduce((m, q) => (q.v > m.v ? q : m));
      F.aggregation.push({ series: s.id, lo: lo.v.toFixed(2), loBlock: lo.blk, loFamily: lo.fam, hi: hi.v.toFixed(2), hiBlock: hi.blk, hiFamily: hi.fam, factor: (hi.v / lo.v).toFixed(3), blocksDecided: lv.length });
    }
  }
  F.nativeEw = F.native.filter((q) => q.verdict === 'DECIDED' && q.best === 'expweibull').length;
  F.nativeDecided = F.native.filter((q) => q.verdict === 'DECIDED').length;
  return F;
}

runAll().then(() => {
  const buoys = {}; for (const b of ['A', 'B', 'C']) buoys[b] = results['buoy:' + b];
  const ww3 = ww3Ready ? { meta: 'corpus/ww3-points/meta.json', points: {} } : null;
  if (ww3) for (const p of points) ww3.points[p] = results['ww3:' + p];
  const seriesBuoys = ['A', 'B', 'C'].map((b) => ({ id: 'buoy ' + b, blocks: buoys[b].blocks }));
  const seriesWw3 = ww3 ? points.map((p) => ({ id: p, blocks: ww3.points[p].blocks })) : [];
  const ledger = {
    what: 'The method of Reis, Guimarães, Farina, Paul, de Paula, Ribeiro (Ocean Eng. 359, 2026, 125841) — six families fitted by maximum likelihood to the unfiltered series and to daily, weekly and monthly block maxima, four goodness-of-fit criteria, 100- and 1000-year return levels — with every fit certified by the Krawczyk operator as the unique zero of its score in a box, every criterion and level an enclosure over that box, and each criterion\'s choice of family DECIDED or REFUSED; on the benchmark\'s NDBC buoys A–C (annual maxima besides), on the paper\'s own WAVEWATCH III hindcast at the grid points of corpus/ww3-points, and against the Hs marginals the benchmark\'s contributions printed.',
    generated: new Date().toISOString().slice(0, 10),
    conventions: {
      hoursPerYear: 8766,
      returnLevel: 'F⁻¹(1 − b/(T·8766)) for a block of b hours (b = 1 for the buoys\' hourly series, 3 for the hindcast\'s, 24, 168, 730.5, 8766); null when fewer than one block falls in the return period',
      criteria: 'A² = −n − (1/n) Σ (2i−1)[ln F(x_(i)) + ln S(x_(n+1−i))], S the survival function; D = max_i max(i/n − F(x_(i)), F(x_(i)) − (i−1)/n); MSE = (1/n) Σ [F(x_i) − F_n(x_i)]², F_n the empirical CDF with ties; χ² on max(8, ⌈log2 n⌉ + 1) equal-width bins over [min, max] (each datum binned exactly as a rational, [e_j, e_{j+1}), the last bin closed), E_j = n[F(e_{j+1}) − F(e_j)] kept when E_j ≥ 5, undefined below two kept bins, REFUSED when an E_j straddles 5; every one an enclosure over the certified box; lower is better for all four',
      ranking: 'DECIDED when the lowest enclosure lies wholly below every other; REFUSED otherwise, naming the overlap; REFUSED also when a family has no certified fit for a reason other than its edge. A family refused at its edge (the likelihood rising to a boundary of the family) has no maximum-likelihood fit and is left out, named in `excluded`. DECIDED ranks the criterion\'s arithmetic on this sample; it is not a test between models.',
      certificate: 'Krawczyk (instruments/interval/radii.js) on the score equations over the interval data; data sums by Sum2 with its error bound added outward; the box is the certificate',
      data: 'each literal enclosed by its neighbouring doubles; a block maximum is the largest value in the calendar block (UTC day, ISO week, month, year)',
    },
    families: FAMS, criteria: CRIT, returnPeriods: T, paperBlocks: PAPER_BLOCKS, buoyBlocks: BUOY_BLOCKS, quick: QUICK,
    buoys,
    ww3,
    printed: QUICK ? null : results.printed,
    scipy: QUICK ? null : scipyDecide(buoys),
    findings: QUICK ? null : { buoys: findings(seriesBuoys), ww3: ww3 ? findings(seriesWw3) : null },
    seconds: Number(((Date.now() - t0) / 1000).toFixed(1)),
  };
  if (!ww3) ledger.ww3Why = QUICK ? 'quick run' : 'corpus/ww3-points is not complete (tools/fetch-ww3-points.py, then --finalize)';
  console.log('  ' + ledger.seconds + ' s');
  const strip = (x) => { const y = JSON.parse(JSON.stringify(x)); delete y.generated; delete y.seconds; const walk = (o) => { if (o && typeof o === 'object') { delete o.seconds; for (const v of Object.values(o)) walk(v); } }; walk(y); return JSON.stringify(y); };
  if (CHECK) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    if (strip(old) !== strip(ledger)) die('the re-derived ledger differs from certs/hseva-ledger.json');
    console.log('  --check: the shipped ledger re-derives identically');
  } else if (QUICK) {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    for (const b of ['A', 'B', 'C']) for (const blk of BUOY_BLOCKS) if (JSON.stringify(strip(old.buoys[b].blocks[blk])) !== JSON.stringify(strip(ledger.buoys[b].blocks[blk]))) die('buoy ' + b + ' ' + blk + ' re-derives differently from the shipped ledger');
    console.log('  --quick: the daily, weekly, monthly and annual blocks re-derive identically; nothing written');
  } else {
    fs.writeFileSync(OUT, JSON.stringify(ledger, null, 1) + '\n');
    console.log('  certs/hseva-ledger.json written');
  }
});
}
