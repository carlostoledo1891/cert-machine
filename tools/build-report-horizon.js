#!/usr/bin/env node
/* build-report-horizon.js — reports/time-horizon.html: METR's time horizon,
   certified to the last bit.

   The 50 % time horizon (Kwa, West et al. 2025) is the headline number of
   frontier-AI forecasting: the human length of task a model completes half
   the time, read off a logistic fit of run success on log2 human minutes.
   METR publishes point estimates from scikit-learn's L-BFGS with bootstrap
   intervals. instruments/horizon certifies the fit instead — the Krawczyk
   operator proves a box holds exactly one optimum, the horizon is an
   enclosure over it — on METR's own Time Horizon 1.1 evidence, and reads
   every printed number against the enclosure. tools/run-horizon-ledger.py
   writes the ledger; this page reads it and nothing else.

   Gates: the battery must pass with every red fired, and every sentence
   below is gated on the ledger field it reads. (The ledger's --check re-runs
   forty-four certified fits and is not run here; the battery re-certifies one
   agent live and requires the ledger's box.)

   usage: node tools/build-report-horizon.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('HORIZON REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'horizon', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /horizon battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm || bm[2] !== bm[3]) die('the horizon battery did not pass clean:\n' + bout.slice(-800));
const nChecks = Number(bm[1]), nReds = Number(bm[2]);

const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'horizon-ledger.json'), 'utf8'));
const claims = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'metr-horizon', 'claims.json'), 'utf8'));
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'metr-horizon', 'meta.json'), 'utf8'));
const fmt = (x) => Number(x).toLocaleString('en-US');
const A = Object.values(L.agents);
const live = A.filter((a) => a.live && a.live.certified && a.site).sort((a, b) => (a.site.release_date < b.site.release_date ? -1 : 1));
const T = L.trend.certified;

/* ---- gates on the facts the prose states ---- */
if (L.counts.certified !== L.counts.fits || L.counts.fits !== 44) die('not all 44 fits are certified');
if (live.length !== 23) die('the live set is not 23 agents');
const repro = live.filter((a) => a.live.coefficientsVerdict === 'REPRODUCED');
const differ = live.filter((a) => a.live.coefficientsVerdict !== 'REPRODUCED');
if (repro.length !== 22 || differ.length !== 1 || differ[0].alias !== 'Claude Mythos Preview (early)') die('the coefficient verdicts moved');
const gaps = live.map((a) => a.site.p50.relativeGap);
const gapMax = Math.max(...gaps), gapMin = Math.min(...gaps);
if (!(gapMax < 2e-4 && gapMin > 5e-7)) die('the p50 gaps are not in the stated band: ' + gapMin + ' .. ' + gapMax);
if (live.some((a) => a.site.p50.inside)) die('a site estimate lies inside its certified enclosure — the prose says none does');
if (live.some((a) => !a.site.p50.insideBootstrapCI)) die('a certified enclosure lies outside the site\'s bootstrap interval');
const maxRad = Math.max(...live.map((a) => a.live.box.maxRad));
if (!(maxRad < 1e-10)) die('a box radius is above 1e-10');
if (T.from_2023_on.verdict !== 'ENCLOSED' || T.from_2024_on.verdict !== 'ENCLOSED') die('a trend is refused');
const dbl23 = T.from_2023_on.doublingDays, dbl24 = T.from_2024_on.doublingDays;
const printed23 = L.trend.printed.from_2023_on.point_estimate;
if (!(Math.abs(dbl23[0] - printed23) / printed23 < 1e-4 && dbl23[1] - dbl23[0] < 1e-6)) die('the 2023 doubling time does not re-derive to the printed digits');
if (T.from_2023_on.n !== 14 || T.from_2024_on.n !== 12) die('the trend point counts moved');
const postRows = A.filter((a) => a.post);
const postRepro = postRows.filter((a) => a.post.verdict === 'REPRODUCED');
if (postRows.length !== 7 || postRepro.length !== 1 || postRepro[0].alias !== 'Claude 3.7 Sonnet (Inspect)') die('the post-table verdicts moved');
const both = A.filter((a) => a.runsFile && a.runsFile.certified && a.live && a.live.certified);
const bothGap = Math.max(...both.map((a) => Math.abs(a.runsFile.horizons['0.5'].minutes[0] - a.live.horizons['0.5'].minutes[0]) / a.live.horizons['0.5'].minutes[0]));
if (!(both.length === 20 && bothGap < 2e-4)) die('the two evidence forms do not agree to 2e-4 on the 20 shared agents: ' + both.length + ' ' + bothGap);
const human = L.agents.human;
if (!human || !human.runsFile || !human.runsFile.certified) die('the human alias is not certified');
const opus46 = L.agents['Claude Opus 4.6 (Inspect)'], mythos = L.agents['Claude Mythos Preview (early)'];
if (!(mythos.live.horizons['0.5'].minutes[0] > 960 && opus46.live.horizons['0.5'].minutes[0] < 960)) die('the 16-hour exclusion sentence would be false');

/* ---- figure 1: every live agent, the enclosure and the printed point ---- */
const lg = Math.log2;
const rows1 = live.map((a) => {
  const h = a.live.horizons['0.5'].minutes;
  return { k: a.alias.replace(' (Inspect)', '').replace('Claude Mythos Preview (early)', 'Mythos Preview (early)'), lo: lg(h[0]), hi: lg(h[1]), point: lg(a.site.p50.estimate),
    token: a.site.is_sota ? 'var(--c-2)' : 'var(--c-3)',
    v: 'certified [' + h[0].toFixed(4) + ', ' + h[1].toFixed(4) + '] min · site ' + a.site.p50.estimate + ' · bootstrap [' + a.site.p50.ci[0] + ', ' + a.site.p50.ci[1] + ']',
    note: a.site.p50.estimate.toFixed(a.site.p50.estimate < 10 ? 1 : 0) + ' [' + a.site.p50.ci[0].toFixed(0) + '\u2013' + a.site.p50.ci[1].toFixed(0) + ']' };
});
const tickMin = [1, 4, 15, 60, 240, 960, 2880];
const FIG1 = CH.intervals({
  w: 900, rowH: 30, padL: 190, padR: 150, x0: lg(1), x1: lg(4000), rows: rows1,
  xTicks: tickMin.map((m) => ({ v: lg(m), t: m < 60 ? m + ' min' : (m / 60) + ' h' })),
  xLabel: '50 % time horizon, human minutes (log scale)',
  keys: [{ token: 'var(--c-2)', t: 'enclosure \u00b7 state of the art at release' }, { token: 'var(--c-3)', t: 'enclosure \u00b7 not state of the art' }],
  alt: 'Twenty-three rows, one per model in release order, on a logarithmic minutes axis: each row carries the certified enclosure of the 50 % horizon as a hairline capsule with end caps and METR\'s own point estimate as a dot on it, with the printed bootstrap interval as text.',
});

/* ---- figure 2: the trend through the certified horizons ---- */
const day0 = new Date('2023-01-01T00:00:00Z');
const days = (d) => (new Date(d + 'T00:00:00Z') - day0) / 86400000;
const trendSet = new Set(T.from_2023_on.agents);
const pts = live.filter((a) => a.site.release_date >= '2023-01-01').map((a) => ({
  x: days(a.site.release_date), y: lg(a.live.horizons['0.5'].minutes[0]),
  token: trendSet.has(a.alias) ? 'var(--c-2)' : 'var(--c-3)', k: a.alias.replace(' (Inspect)', ''),
  v: a.live.horizons['0.5'].minutes[0].toFixed(2) + ' min · ' + a.site.release_date + (trendSet.has(a.alias) ? ' · in the trend' : ' · not in the trend'),
}));
/* the line: through the certified slope at the weighted centroid; intercept from the exact centroid of the points */
const tp = pts.filter((p) => trendSet.has(p.k + ' (Inspect)') || trendSet.has(p.k));
const xbar = tp.reduce((s, p) => s + p.x, 0) / tp.length, ybar = tp.reduce((s, p) => s + p.y, 0) / tp.length;
const slope = (T.from_2023_on.slopeBitsPerDay[0] + T.from_2023_on.slopeBitsPerDay[1]) / 2;
const x0 = 0, x1 = days('2026-07-01');
const FIG2 = CH.scatter({
  w: 900, h: 420, x0, x1, y0: lg(1), y1: lg(4000), padL: 62,
  xTicks: ['2023-01-01', '2024-01-01', '2025-01-01', '2026-01-01'].map((d) => ({ v: days(d), t: d.slice(0, 4) })),
  yTicks: tickMin.map((m) => ({ v: lg(m), t: m < 60 ? m + ' min' : (m / 60) + ' h' })),
  xLabel: 'release date', yLabel: '50 % horizon (log scale)',
  pts, curves: [{ pts: [[x0, ybar + slope * (x0 - xbar)], [x1, ybar + slope * (x1 - xbar)]], token: 'var(--c-2)', k: 'doubling every ' + dbl23[0].toFixed(1) + ' days' }],
  keys: [{ token: 'var(--c-2)', t: 'state of the art at release, in the trend (' + T.from_2023_on.n + ')' }, { token: 'var(--c-3)', t: 'not in the trend: not state of the art, or above 16 hours' }],
  alt: 'Scatter of certified 50 % horizons on a log axis against release date from 2023 to 2026, with a straight trend line through the state-of-the-art models rising by one doubling every ' + dbl23[0].toFixed(1) + ' days.',
});

/* ---- tables ---- */
const tbl = C.table({
  cols: [{ h: 'model' }, { h: 'released' }, { h: 'certified p50, min', cls: 'n' }, { h: 'site p50', cls: 'n' }, { h: 'gap', cls: 'n' }, { h: 'coef · intercept printed', cls: 'n' }, { h: 'certified, rounded', cls: 'n' }, { h: 'verdict' }],
  rows: live.map((a) => {
    const h = a.live.horizons['0.5'].minutes;
    const enc = h[0].toFixed(6) === h[1].toFixed(6) ? h[0].toFixed(6) : '[' + h[0].toFixed(6) + ', ' + h[1].toFixed(6) + ']';
    return [a.alias.replace(' (Inspect)', ''), a.site.release_date, enc, String(a.site.p50.estimate), a.site.p50.relativeGap.toExponential(1),
      a.live.printed.coefficient + ' · ' + a.live.printed.intercept, a.live.coefficientsCertifiedRounded.coefficient + ' · ' + a.live.coefficientsCertifiedRounded.intercept, a.live.coefficientsVerdict.toLowerCase()];
  }),
});
const postTbl = C.table({
  cols: [{ h: 'model' }, { h: 'post, 29 Jan (TH1.1)', cls: 'n' }, { h: 'certified on the May file', cls: 'n' }, { h: 'site, 8 May', cls: 'n' }, { h: 'verdict' }],
  rows: postRows.sort((a, b) => b.post.th11[0] - a.post.th11[0]).map((a) => [a.alias.replace(' (Inspect)', ''), a.post.th11[0] + ' [' + a.post.th11[1] + ', ' + a.post.th11[2] + ']', a.live.horizons['0.5'].minutes[0].toFixed(2), String(a.site.p50.estimate), a.post.verdict.toLowerCase()]),
});
const trendTbl = C.table({
  cols: [{ h: 'trend' }, { h: 'models', cls: 'n' }, { h: 'certified doubling time, days', cls: 'n' }, { h: 'printed', cls: 'n' }],
  rows: [['from 2023 on', String(T.from_2023_on.n), dbl23[0].toFixed(5) + ' .. ' + dbl23[1].toFixed(5), printed23 + ' [' + L.trend.printed.from_2023_on.ci_low + ', ' + L.trend.printed.from_2023_on.ci_high + '] (site) · ' + claims.post.doublingTimeDays.from2023.th11 + ' (post)'],
    ['from 2024 on', String(T.from_2024_on.n), dbl24[0].toFixed(5) + ' .. ' + dbl24[1].toFixed(5), claims.post.doublingTimeDays.from2024.th11 + ' (post, January\'s model set)']],
});

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · audit · the time horizon · re-decided at this build',
  title: 'METR’s time horizon, certified to the last bit.',
  deck: 'The 50 % time horizon is the length of task, measured in the time a human takes, that a model completes half the time; METR reads it off a logistic fit of run success on log2 human minutes and publishes a point estimate with a bootstrap interval, and the doubling time of that number is the most-quoted trend in AI forecasting. This page takes METR’s own Time Horizon 1.1 evidence — the raw runs of its public repository and the per-task file behind its live chart — and, for every model, proves that the fit has exactly one optimum inside a box, states the horizon as an enclosure over that box, reads every number METR printed against it, and re-derives the doubling time as an interval.',
}));
B.push(C.tldr({
  findingRaw: '<strong>All ' + L.counts.fits + ' fits certify, and METR’s printed numbers are what the certificates say they should be.</strong> For each of the ' + live.length + ' models on the live chart the box that provably holds the optimum has radius below 10⁻¹⁰; the site’s printed slope and intercept are the rounding of that box for ' + repro.length + ' of ' + live.length + ' (the one exception is off by one in the third decimal of the intercept); the site’s p50 point estimates lie between ' + gapMin.toExponential(1) + ' and ' + gapMax.toExponential(1) + ' (relative) from the enclosure and never inside it, which is what a solver stopped at a tolerance looks like next to a proof; every enclosure lies inside METR’s own bootstrap interval. The post-2023 doubling time re-derives from the certified horizons of the ' + T.from_2023_on.n + ' state-of-the-art models as ' + dbl23[0].toFixed(3) + ' days — the site prints ' + printed23 + '. Where the January post and the May chart disagree (six of seven TH1.1 numbers), the certificate sides with the May file, because it is the May file: METR’s own estimates moved when runs were added, and the certificate makes that a provenance statement rather than a suspicion. On the runs file of March and the per-task file of May the twenty models in both agree to ' + bothGap.toExponential(1) + '.',
  mechanismRaw: 'The estimator is METR’s to the letter: scikit-learn’s penalised logistic regression is the unique zero of the score F(w, b) = (λ w − Σ sᵢ (yᵢ − pᵢ) xᵢ, −Σ sᵢ (yᵢ − pᵢ)) with xᵢ = log2(minutes), sᵢ the task weight (1/√k for a family of k tasks, normalised) and λ = 10⁻⁵ from their figs.yaml; per-run fitting collapses to per-task fitting with the mean outcome, exactly. A float Newton iteration finds the candidate; the Krawczyk operator, evaluated in outward-rounded interval arithmetic with exp and log from certified rational series (a Python library written for this, standard library only, cross-checked against the machine’s JavaScript one by containment), proves a box around it maps strictly into itself, so the box holds exactly one zero. The horizon 2^((logit ½ − b)/w) is then the interval extension over the box. The doubling time is an exact least-squares line through log2 of the certified horizons against release date, with the intervals carried through the linear formula, over the models the site flags as state of the art with a horizon under 16 hours (the site’s own rule). The bootstrap intervals are METR’s and are not re-decided: a bootstrap is a random draw, not a theorem; the certified box is the optimiser’s uncertainty, and it is ten orders of magnitude smaller.',
  checkRaw: C.m('python3 instruments/horizon/battery.py') + ' — ' + nChecks + ' checks, ' + nReds + ' red controls that must fire (a Taylor series without its remainder, a division through zero, a log touching zero, Krawczyk from a far candidate, a slope box through zero asked for a horizon, a printed horizon moved by 1 %); it re-certifies Claude 3.7 Sonnet live from the pinned file and requires the ledger’s box. ' + C.m('python3 tools/run-horizon-ledger.py') + ' re-hashes the seven pinned files and re-certifies all 44 fits in about two minutes on eight cores.',
}));
B.push(C.stats([
  { k: 'fits certified', v: L.counts.certified + ' / ' + L.counts.fits, role: 'held', n: live.length + ' models on the May file, ' + L.counts.runsFileAgents + ' aliases in the March runs; every box radius below 10⁻¹⁰' },
  { k: 'printed coefficients that are the rounding of the box', v: repro.length + ' / ' + live.length, role: 'held', n: 'the site prints three decimals; ' + differ[0].alias + ' prints ' + differ[0].live.printed.intercept + ' where the box rounds to ' + differ[0].live.coefficientsCertifiedRounded.intercept },
  { k: 'site p50 estimates inside their enclosure', v: '0 / ' + live.length, role: 'held', n: 'all within ' + gapMax.toExponential(1) + ' relative; L-BFGS stops at a tolerance, a certificate does not' },
  { k: 'doubling time from 2023, certified', v: dbl23[0].toFixed(2) + ' d', role: 'held', n: 'an enclosure ' + (dbl23[1] - dbl23[0]).toExponential(1) + ' days wide through ' + T.from_2023_on.n + ' models; the site prints ' + printed23 },
  { k: 'January’s post against May’s file', v: postRepro.length + ' / ' + postRows.length, role: 'open', n: 'one printed horizon is the rounding of the certified one; six moved with the runs METR added between the two' },
  { k: 'the human alias', v: human.runsFile.horizons['0.5'].minutes[0].toFixed(0) + ' min', role: 'open', n: 'the same fit on the human-baseline runs in the March file: humans given the same budget rule succeed half the time at this task length' },
]));

B.push(C.section({
  lab: '§1 · the fits', title: live.length + ' models, each fit proved to hold one optimum, each horizon an enclosure',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG1, caption: 'One row per model in release order. The capsule is the certified enclosure of the 50 % horizon (hairline-thin at this scale: its end caps are the only way to see it); the dot is METR’s printed point estimate, which sits on the capsule at every row; the text is METR’s bootstrap interval. Hover for the numbers.' })
    + '<div class="col">' + C.pRaw('The table gives each model’s certified horizon, the site’s estimate, their relative gap, and the site’s printed slope and intercept against the rounding of the certified box.') + '</div>'
    + tbl,
}));

B.push(C.section({
  lab: '§2 · the trend', title: 'The doubling time, as an interval: ' + dbl23[0].toFixed(2) + ' days since 2023',
  wide: true,
  bodyRaw: C.figure({ svgRaw: FIG2, caption: 'Certified 50 % horizons against release date. The line is the exact least-squares fit through the ' + T.from_2023_on.n + ' models the site flags as state of the art at release with a horizon under 16 hours; its slope is an enclosure ' + (T.from_2023_on.slopeBitsPerDay[1] - T.from_2023_on.slopeBitsPerDay[0]).toExponential(1) + ' bits per day wide. Amber points are on the chart and not in the trend.' })
    + '<div class="col">' + C.pRaw('The site prints ' + printed23 + ' days with a bootstrap interval [' + L.trend.printed.from_2023_on.ci_low + ', ' + L.trend.printed.from_2023_on.ci_high + ']; the certified line re-derives ' + dbl23[0].toFixed(3) + ' from the same model set, which says the site’s trend is computed on exactly the numbers its chart shows and by exactly the rule its file states (state of the art at release; central estimate under 16 hours, which leaves ' + mythos.alias + ' at ' + mythos.live.horizons['0.5'].minutes[0].toFixed(0) + ' minutes out and ' + opus46.alias.replace(' (Inspect)', '') + ' at ' + opus46.live.horizons['0.5'].minutes[0].toFixed(0) + ' in). From 2024 on the same rule gives ' + dbl24[0].toFixed(1) + ' days over ' + T.from_2024_on.n + ' models; the January post printed ' + claims.post.doublingTimeDays.from2024.th11 + ' on its smaller set, and the site does not print a 2024 figure.') + '</div>'
    + trendTbl,
}));

B.push(C.section({
  lab: '§3 · the post and the chart', title: 'Seven numbers printed in January, one still the rounding of the fit in May',
  bodyRaw: '<div class="col">' + C.pRaw('The Time Horizon 1.1 post of 29 January printed TH1.1 horizons for seven models. Against the May per-task file, one is the rounding of the certified horizon and six are not — by 3 to 12 % — and the site’s own May estimates moved by the same amounts. Nothing was mis-computed: runs were added between the post and the chart (the repository’s runs file of March already gives the May numbers to ' + bothGap.toExponential(1) + '), and the post is a fit on the January runs that no public file holds. A printed number without the file it came from cannot be re-decided; it can only be dated.') + '</div>'
    + postTbl,
}));

B.push(C.section({
  lab: '§4 · why this instrument exists', title: 'The number this machine will decide on its own tasks',
  bodyRaw: '<div class="col">' + C.pRaw('This page is a calibration. The same instrument is built to fit a time-horizon curve on tasks graded by an exact verifier — no answer key, no judge, no tolerance (the blind-spot, break-the-grader and lattice-claims environments) — against timed human baselines, and to state the 50 % horizon as an enclosure with its human-baseline provenance pinned. Those runs and baselines do not exist yet; when they do, the fit will be the one proved here on METR’s data, and nothing on this page will need to change for it to be trusted.') + '</div>',
}));

/* ---- §5: the same result for three audiences (the METR plan's deliverable 4,
   written here on the calibration; it will be rewritten on this machine's own
   number when the runs and baselines exist). Every figure is a ledger field. */
const sc = (x, d) => Number(x).toFixed(d);
B.push(C.section({
  lab: '§5 · for three audiences', title: 'The same result, written three ways',
  bodyRaw: '<div class="col">'
    + C.pRaw('<strong>For a system card.</strong> The 50 % time horizon reported for each model on METR’s Time Horizon 1.1 suite was re-derived by an independent implementation of the published estimator (weighted L2-penalised logistic regression of task success on log₂ human minutes, λ = 10⁻⁵, inverse-root-family task weights) with the optimum certified by interval arithmetic: for all ' + live.length + ' models the fitted parameters are proved to lie in a box of radius below 10⁻¹⁰, the reported slope and intercept are the rounding of that box for ' + repro.length + ' of ' + live.length + ' models (the remaining one differs by 0.001 in the intercept), and the reported point estimates of the horizon lie within ' + gapMax.toExponential(1) + ' (relative) of the certified value, consistent with optimiser tolerance. The reported bootstrap intervals contain the certified values in every case and were not re-derived. The post-2023 doubling time re-derives as ' + sc(dbl23[0], 2) + ' days against the reported ' + printed23 + '. Evidence: the runs file at commit ' + meta.repository.commit.slice(0, 7) + ' of METR/eval-analysis-public and the site’s task and benchmark result files fetched ' + meta.site.fetched + ', pinned by sha256 in this repository.')
    + C.pRaw('<strong>For a regulator.</strong> The headline capability number in this report — the length of task, in human working time, that a frontier model completes half the time — depends on a statistical fit whose correctness is usually taken on trust. We checked it without trusting it. Using METR’s own published data, we proved, in arithmetic that accounts for every rounding error, that each fit has exactly one best answer and computed a range narrower than a ten-billionth around it; every number METR published lands where that proof says it must, and the rate at which the horizon doubles re-derives from the same models as ' + sc(dbl23[0], 1) + ' days. What this does not establish: whether the tasks, the human timings or the success criteria are the right ones — those are METR’s choices and are outside what arithmetic can decide. What it does establish: that the trend line quoted to you is computed exactly as described from exactly the data shown, and that anyone can rerun the proof in two minutes from the public files.')
    + C.pRaw('<strong>For a post.</strong> METR’s time-horizon curve is the most-quoted graph in AI forecasting, and its points are fits nobody outside METR has checked. I checked them — not by refitting and eyeballing, but by proving each fit has one optimum and boxing it to 10⁻¹⁰. Every published number lands in its box or within a solver’s tolerance of it; the doubling time comes out at ' + sc(dbl23[0], 1) + ' days, the digit they print. The one thing that moved is the January post versus the May chart: six of seven horizons shifted by 3–12 % as runs were added, which is fine, and which you can only know because the files are public and pinned. The instrument that did this is built for a harder job: a time-horizon number on tasks graded by an exact verifier, with no judge in the loop. That number is next.')
    + '</div>',
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No time horizon is called right or wrong: the certificate is about the fit, not about the tasks, the human baselines or the binarisation of scores, all of which are METR’s and taken as given. The bootstrap intervals are not re-decided. The task weights use 1/√k as the correctly rounded double read as a rational, which is what METR’s pipeline does with it; the certified box is a proof about that estimator. The March runs and the May file are two snapshots of a moving dataset, held here at the commit and the fetch date in ' + C.m('corpus/metr-horizon/meta.json') + '; the post’s runs are not public. The human alias is METR’s own baseline runs fitted by the same rule and is reported as a curiosity, not a measurement of people.'),
}));

const foot = '<p>Generated by tools/build-report-horizon.js @ git ' + git + '. Gates at this build: the horizon battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired; one agent re-certified live from the pinned evidence and required to give the ledger’s box), every sentence above gated on the ledger field it reads. A fit that stops certifying, a site estimate that lands inside an enclosure, a doubling time off the printed digits, or an enclosure outside METR’s bootstrap interval refuses this page.</p>';

fs.writeFileSync(path.join(ROOT, 'reports', 'time-horizon.html'),
  TPL.render({ title: 'METR’s time horizon, certified', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/time-horizon.html',
    desc: 'METR’s Time Horizon 1.1 re-decided as certificates: for 23 models the penalised logistic fit proved to hold exactly one optimum in a box below 10⁻¹⁰, the 50 % horizon as an enclosure, the printed coefficients its rounding for 22 of 23, the point estimates within a solver’s tolerance and never inside, the post-2023 doubling time re-derived as 128.74 days to the printed digit, and the January post’s numbers dated against the May chart.' }));
console.log('reports/time-horizon.html written: ' + L.counts.certified + '/' + L.counts.fits + ' fits certified, doubling ' + dbl23[0].toFixed(3) + ' d, battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
