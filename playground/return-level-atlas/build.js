/* build.js — site/instruments/return-level-atlas/: the paper's map, decided.
   playground/return-level-atlas/ · cert-machine · 2026-09-27

   Reis, Guimarães et al. (Ocean Engineering 2026) map, over the global ocean,
   which of six families fits significant wave height best and what 100- and
   1000-year wave each implies. This page is that map with every cell a
   certificate: the families certified at each open-sea cell of the paper's own
   hindcast (certs/hseva-atlas.json), the choice DECIDED or REFUSED, the paper's
   regional claims decided as boxes (instruments/hseva/atlas-claims.js), and any
   cell re-certified in the reader's tab from the pinned daily maxima by the
   same bytes that wrote the ledger (instruments/hseva/atlas.js, inlined).

   NO FICTION ON /instruments: every number the page shows is a field of the
   ledger or of the corpus meta; the claims' verdicts are computed here and
   gated; the cell files are served from the public repository pinned by
   commit and checked by sha256 in the tab. What is not in the ledger — the
   unfiltered 3-hourly block — is not drawn. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const { bundle } = require(path.join(PG, 'return-level-check', 'bundle.js'));
const AC = require(path.join(ROOT, 'instruments', 'hseva', 'atlas-claims.js'));
const AT = require(path.join(ROOT, 'instruments', 'hseva', 'atlas.js'));
const { PAPER_SIX } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const WORKER = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const die = (m) => { throw new Error('return-level-atlas: ' + m); };
const FW = { normal: 'the normal', lognormal: 'the lognormal', weibull: 'the Weibull', expweibull: 'the exponentiated Weibull', gengamma: 'the generalized gamma', gumbel: 'the Gumbel' };
const fmt = (x) => Number(x).toLocaleString('en-US');
const REPO = 'carlostoledo1891/cert-machine';

function exists() { return fs.existsSync(path.join(ROOT, 'certs', 'hseva-atlas.json')) && fs.existsSync(path.join(ROOT, 'corpus', 'ww3-grid', 'meta.json')); }

/* the ledger joined with the corpus; every sea cell has a record and every record a sea cell */
function load() {
  const metaBytes = fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-grid', 'meta.json'));
  const L = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs', 'hseva-atlas.json'), 'utf8'));
  const M = JSON.parse(metaBytes);
  if (L.corpus.sha256 !== sha(metaBytes)) die('the ledger was not made from this corpus (meta.json sha256 differs)');
  const rec = new Map(L.cells.map((c) => [c.id, c]));
  const cells = M.cells.map((m) => {
    const r = rec.get(m.id);
    if (m.status === 'sea' && !r) die('sea cell ' + m.id + ' has no record');
    if (m.status !== 'sea' && r) die(m.id + ' has a record but is not open sea');
    return Object.assign({}, m, r ? { blocks: r.blocks, recSha: sha(JSON.stringify(r)).slice(0, 32) } : {});
  });
  if (rec.size !== cells.filter((c) => c.status === 'sea').length) die('the ledger holds records for cells the corpus does not list');
  return { L, M, cells };
}

/* the commit the cell files are served from: pinned, an ancestor of HEAD, and holding every file named */
function served(M) {
  if (process.env.ATLAS_DEV && process.env.ATLAS_DEV_SERVED) return { commit: 'development', base: process.env.ATLAS_DEV_SERVED };
  const f = path.join(ROOT, 'corpus', 'ww3-grid', 'SERVED.json');
  if (!fs.existsSync(f)) return null;
  /* once a commit is named, every check must pass or the page is not built: a page that points at other bytes is worse than none */
  const S = JSON.parse(fs.readFileSync(f, 'utf8'));
  const git = (args, big) => cp.execSync('git ' + args, { cwd: ROOT, maxBuffer: big ? 256 << 20 : 1 << 20, stdio: ['ignore', 'pipe', 'ignore'] });
  const must = (what, fn) => { let ok = false; try { ok = fn(); } catch (e) { ok = false; } if (!ok) die('SERVED.json names ' + S.commit.slice(0, 12) + ', but ' + what); };
  must('it is not an ancestor of HEAD', () => { git('merge-base --is-ancestor ' + S.commit + ' HEAD'); return true; });
  must('it is on no remote branch (push it first: raw.githubusercontent serves only what is pushed)', () => git('branch -r --contains ' + S.commit).toString().trim().length > 0);
  must('the corpus, the cells, the ledger or the certifying code differ between it and the working tree',
    () => { git('diff --quiet ' + S.commit + ' -- corpus/ww3-grid/meta.json corpus/ww3-grid/cells certs/hseva-atlas.json instruments/hseva instruments/interval playground/return-level-check/bundle.js'); return true; });
  must('a cell file the corpus names is not in it', () => { const ls = new Set(git('ls-tree -r --name-only ' + S.commit + ' corpus/ww3-grid/cells', true).toString().split('\n')); return M.cells.every((c) => !c.file || ls.has('corpus/ww3-grid/' + c.file)); });
  return { commit: S.commit, base: 'https://raw.githubusercontent.com/' + REPO + '/' + S.commit + '/corpus/ww3-grid/' };
}

/* the page's compact view of the ledger: one row per cell */
const FAMC = (f) => (f === 'R' ? 6 : PAPER_SIX.indexOf(f));
/* an enclosure with two finite ends — JSON writes ±∞ and NaN as null, and null compares as 0 */
const fin2 = (q) => Array.isArray(q) && q.length === 2 && q.every((x) => typeof x === 'number' && Number.isFinite(x));
function row(c) {
  const sets = (c.sets.includes('global4') ? 1 : 0) | (c.sets.includes('brazil1') ? 2 : 0) | (c.sets.some((s) => /^report:/.test(s)) ? 4 : 0);
  const report = (c.sets.find((s) => /^report:/.test(s)) || '').replace('report:', '');
  if (c.status === 'ice') return [c.id, c.lat, c.lon, sets, 1, report, c.iceSteps, c.iceMonths, c.iceMax, c.fillDays, c.fillSteps];
  const B = ['daily', 'weekly', 'monthly'].map((blk) => {
    const b = c.blocks[blk], ad = b.rank.ad, F = ad !== 'R' ? b.fits[ad] : null;
    const { gg, ew } = AT.codes(b);                                  /* the one rule, shared with the reader's tab */
    const l = (k) => (F && fin2(F[k]) ? F[k] : [null, null]);
    const below = F && fin2(F.l100) ? (F.l100[1] < b.max ? 1 : 0) : null;
    return ['ad', 'ks', 'mse', 'chi2'].map((k) => FAMC(b.rank[k])).concat([FAMC(b.naive), gg, ew]).concat(l('l100')).concat(l('l1000')).concat([below]);
  });
  return [c.id, c.lat, c.lon, sets, 0, report, c.sha256, c.recSha, Number(c.blocks.daily.max.toFixed(3))].concat(B);
}

function landJson() {
  const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'basemap', 'PINS.json'), 'utf8'));
  const src = fs.readFileSync(path.join(ROOT, 'corpus', 'basemap', 'ne_50m_land.geojson'));
  if (sha(src) !== pins.files['ne_50m_land.geojson'].sha256) die('the land polygons are not the pinned bytes');
  const G = JSON.parse(src);
  /* rounded to 0.01°, thinned to one vertex per 0.06° of coast, islands under 0.25° across dropped: a cell here is 1° to 4° */
  const q = (x) => Math.round(x * 100) / 100;
  const ring = (r) => { const o = []; for (let k = 0; k < r.length; k++) { const v = [q(r[k][0]), q(r[k][1])]; const l = o[o.length - 1]; if (!l || k === r.length - 1 || Math.abs(l[0] - v[0]) + Math.abs(l[1] - v[1]) >= 0.06) o.push(v); } return o.length >= 4 ? o : null; };
  const big = (r) => { let a = 1e9, b = -1e9, c = 1e9, d = -1e9; for (const p of r) { a = Math.min(a, p[0]); b = Math.max(b, p[0]); c = Math.min(c, p[1]); d = Math.max(d, p[1]); } return b - a >= 0.25 || d - c >= 0.25; };
  const polys = [];
  for (const f of G.features) for (const p of (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates)) {
    if (!big(p[0])) continue;
    const rs = p.map(ring).filter(Boolean); if (rs.length) polys.push(rs);
  }
  return JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: polys } }] });
}

function build(OUTDIR) {
  if (!exists()) return null;
  if (process.env.ATLAS_DEV && path.resolve(OUTDIR).startsWith(path.join(ROOT, 'site'))) die('ATLAS_DEV builds point the page at a development server: they do not write into site/');
  const { L, M, cells } = load();
  const S = served(M);
  const claims = AC.evaluate(cells.filter((c) => c.status === 'sea'));
  for (const k of claims) if (!k.cells && !process.env.ATLAS_DEV) die('claim ' + k.id + ' covers no certified cell');
  const sea = cells.filter((c) => c.status === 'sea'), ice = cells.filter((c) => c.status === 'ice');
  const facts = {
    sea: sea.length, ice: ice.length, global4: sea.filter((c) => c.sets.includes('global4')).length, brazil1: sea.filter((c) => c.sets.includes('brazil1')).length,
    decided: {}, refused: {}, weibull: {}, near: 0, naiveDiff: {}, below: {},
  };
  for (const blk of ['daily', 'weekly', 'monthly']) {
    facts.decided[blk] = sea.filter((c) => c.blocks[blk].rank.ad !== 'R').length;
    facts.refused[blk] = sea.length - facts.decided[blk];
    facts.weibull[blk] = sea.filter((c) => c.blocks[blk].rank.ad === 'weibull').length;
    facts.naiveDiff[blk] = sea.filter((c) => c.blocks[blk].naive !== c.blocks[blk].rank.ad).length;
    facts.below[blk] = sea.filter((c) => { const b = c.blocks[blk], f = b.rank.ad; return f !== 'R' && fin2(b.fits[f].l100) && b.fits[f].l100[1] < b.max; }).length;
  }
  facts.near = sea.filter((c) => ['daily', 'weekly', 'monthly'].some((blk) => AT.codes(c.blocks[blk]).gg === 1)).length;
  /* cell-blocks, over the three blocks */
  const cb = (pred) => sea.reduce((a, c) => a + ['daily', 'weekly', 'monthly'].filter((blk) => pred(c.blocks[blk], c)).length, 0);
  facts.ewG = cb((B) => B.fits.expweibull.c && B.fits.expweibull.g);
  facts.ewStop = cb((B) => [1, 4].includes(AT.codes(B).ew));
  facts.ewStopK = cb((B) => AT.codes(B).ew === 1);
  facts.ggNearCB = cb((B) => AT.codes(B).gg === 1);
  facts.ggEdgeCB = cb((B) => B.fits.gengamma.e);
  facts.naiveCB = cb((B) => B.naive !== B.rank.ad);
  facts.belowCB = cb((B) => { const f = B.rank.ad; return f !== 'R' && fin2(B.fits[f].l100) && B.fits[f].l100[1] < B.max; });
  facts.leveledCB = cb((B) => { const f = B.rank.ad; return f !== 'R' && fin2(B.fits[f].l100); });
  facts.decidedCB = cb((B) => B.rank.ad !== 'R');
  /* the base rate: even with every fit exactly right, a record of Y years exceeds the 100-year level with probability 1 − e^(−Y/100) */
  facts.years = M.days / 365.25; facts.baseRate = -Math.expm1(-facts.years / 100);
  facts.worst = null;
  for (const c of sea) for (const blk of ['daily', 'weekly', 'monthly']) { const B = c.blocks[blk], f = B.rank.ad; if (f === 'R' || !fin2(B.fits[f].l100)) continue; const r = B.fits[f].l100[1] / B.max; if (!facts.worst || r > facts.worst.r) facts.worst = { r, id: c.id, lat: c.lat, lon: c.lon, blk, f, v: B.fits[f].l100[1], max: B.max }; }
  const data = JSON.stringify({ fam: PAPER_SIX, blocks: ['daily', 'weekly', 'monthly'], generated: L.generated, days: M.days, first: M.first, last: M.last,
    served: S, cells: cells.map(row), claims: claims.map((k) => ({ id: k.id, where: k.where, quote: k.quote, cite: k.cite, rule: k.rule, blocks: k.blocks, box: k.box, cells: k.cells, verdict: k.verdict, counts: k.counts })) });

  const B = bundle([['atlas.js', 'instruments/hseva/atlas.js']], { AT: 'atlas.js' });
  /* the page re-derives cells with these bytes and says "the ledger's own code": so they must be the code the ledger recorded */
  if (!L.code && !process.env.ATLAS_DEV) die('the atlas ledger records no code: re-run tools/run-hseva-atlas.js');
  for (const [rel, h] of Object.entries(L.code || {})) if (B.modules[rel] !== h) die(rel + ' is not the bytes that wrote the atlas ledger (' + h.slice(0, 12) + '): re-run tools/run-hseva-atlas.js');
  for (const rel of Object.keys(B.modules)) if (L.code && !L.code[rel]) die(rel + ' is bundled but the ledger does not record it');
  /* the page's own thread runs two of the ledger's modules as they are: the block rule (a cell's maxima, before any fit)
     and the claims' rule code (a reader's own claim, decided the way the paper's ten were) */
  const RULES = [['BR', 'instruments/hseva/blockrule.js'], ['AC', 'instruments/hseva/atlas-claims.js']];
  const rulesJs = '(function () { var R = {};\n' + RULES.map(([k, rel]) => {
    const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/<\/script/i.test(t)) die(rel + ' holds a closing script tag');
    return '(function () { var module = { exports: {} };\n' + t + '\nR.' + k + ' = module.exports; })();';
  }).join('\n') + '\nwindow.ATLAS_RULES = R; })();';
  const modules = Object.assign({ 'playground/return-level-atlas/app.js': sha(APP), 'playground/return-level-atlas/worker.js': sha(WORKER) }, B.modules,
    Object.fromEntries(RULES.map(([, rel]) => [rel, sha(fs.readFileSync(path.join(ROOT, rel), 'utf8'))])));
  const vpins = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps', 'skyaudit', 'vendor', 'VENDOR-PINS.json'), 'utf8'));
  const vsha = Object.fromEntries(fs.readFileSync(path.join(ROOT, 'apps', 'skyaudit', 'vendor', 'VENDOR-SHA256.txt'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse()));
  const ml = fs.readFileSync(path.join(ROOT, 'apps', 'skyaudit', 'vendor', 'maplibre-gl.js'));
  if (sha(ml) !== vsha['maplibre-gl.js']) die('maplibre-gl.js is not the pinned bytes');

  const dir = path.join(OUTDIR, 'return-level-atlas');
  fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'vendor', 'maplibre-gl.js'), ml);
  fs.writeFileSync(path.join(dir, 'atlas.json'), data);
  fs.writeFileSync(path.join(dir, 'land.json'), landJson());

  const V = { HOLDS: 'holds', 'DOES NOT HOLD': 'does not hold', UNDECIDED: 'undecided' };
  const FS = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exp. Weibull', gengamma: 'gen. gamma', gumbel: 'Gumbel' };
  const cnt = (k) => k.counts.map((q) => (q.against !== undefined ? q.block + ': ' + q.relation + ' at ' + q.decided + ', not ' + q.relation + ' at ' + q.against + ', not decided at ' + q.refused + ' of ' + q.n
    : (q.family ? FS[q.family] + ', ' : '') + q.block + ': ' + q.decided + ' decided, ' + q.refused + ' refused of ' + q.n)).join(' · ');
  const claimRows = claims.map((k) => `<li class="ra-claim" data-claim="${k.id}" tabindex="0" role="button" aria-label="show on the map: ${esc(k.where)}"><div class="ra-cv ra-v-${V[k.verdict].replace(/ /g, '-')}">${k.verdict}</div><div><div class="ra-cq">&ldquo;${esc(k.quote)}&rdquo; <span class="ra-cite">${esc(k.cite)}</span></div><div class="ra-cr">${esc(k.where)} &middot; ${esc(k.rule)}</div><div class="ra-cn mono">${esc(cnt(k))}</div></div></li>`).join('');
  const nV = (v) => claims.filter((k) => k.verdict === v).length;

  const OPENS = `The map answers where the paper's selection is a decision and where it is not, and two of the six families needed other coordinates to be decided at all. Where the exponentiated Weibull's climb runs past &alpha; = 10<sup>4</sup>, write &theta; = &lambda;<sup>k</sup> and &beta; = &theta; ln &alpha;: the family reads F = exp(e<sup>&beta;/&theta;</sup> ln(1 &minus; e<sup>&minus;x<sup>k</sup>/&theta;</sup>)), a Gumbel law of H<sub>s</sub><sup>k</sup> with location &beta; and scale &theta; once e<sup>&minus;x<sup>k</sup>/&theta;</sup> is small over the data. The runaway &alpha; is a regime the (&alpha;, k, &lambda;) coordinates place in the millions or beyond, not an edge: in (k, &theta;, &beta;) the family's maximum is an ordinary point, certified here at ${fmt(facts.ewG)} cell-blocks. At ${fmt(facts.ewStop)} more the family is still refused${facts.ewStopK ? ', ' + (facts.ewStopK === facts.ewStop ? 'every one' : fmt(facts.ewStopK) + ' of them') + ' because the climb runs on even there, toward k &rarr; 0 &mdash; a Gumbel law of ln H<sub>s</sub>, the Fr&eacute;chet tail the family reaches only in a double limit: that is where a seventh family would decide what six cannot, the Fr&eacute;chet itself or the extended generalized Pareto of Naveau et al. (Water Resources Research, 2016), which is the exponentiated Weibull&rsquo;s own construction &mdash; a power of a distribution function &mdash; on a Pareto base' : ''}. The exp. Weibull view maps where each coordinate system holds. The generalized gamma's maximum sits beside its lognormal limit (&alpha; above 500) at ${fmt(facts.ggNearCB)} cell-blocks and is certified there, in Prentice's coordinates; its likelihood is proved to peak at the limit itself at ${fmt(facts.ggEdgeCB)}. A fitter that stops at a threshold and calls it the limit names another family, or none, at ${fmt(facts.naiveCB)} cell-blocks. And the choice the statistic makes is not a sanity check${facts.worst ? ': the decided family&rsquo;s 100-year wave reaches ' + facts.worst.r.toFixed(1) + '&times; the largest day on record (' + esc(FW[facts.worst.f]) + ', ' + facts.worst.v.toFixed(1) + ' m against ' + facts.worst.max.toFixed(2) + ' m, ' + Math.abs(facts.worst.lat) + '&deg; ' + (facts.worst.lat < 0 ? 'S' : 'N') + ' ' + Math.abs(facts.worst.lon) + '&deg; ' + (facts.worst.lon < 0 ? 'W' : 'E') + ', ' + facts.worst.blk + ')' : ''}. The other way round proves less: the 100-year wave lies below the record at ${fmt(facts.belowCB)} of the ${fmt(facts.leveledCB)} decided cell-blocks with a level (${(100 * facts.belowCB / Math.max(1, facts.leveledCB)).toFixed(0)}%), and a ${facts.years.toFixed(0)}-year record exceeds even a correct 100-year level with probability 1 &minus; e<sup>&minus;${(facts.years / 100).toFixed(2)}</sup> &asymp; ${(100 * facts.baseRate).toFixed(0)}%. A standard for marginal fits can be read off this map &mdash; which choices it must fix, and where a certificate, not an optimiser, has to say what the fit is.`;
  /* THE PAGE IS A VIEWPORT (2026-09-28, on the operator's "a perfect 100vw × 100vh experience … a lateral panel and
     tabs … optimize for mobile"): the globe fills the window under the nav and nothing scrolls but the panel. Beside
     the globe on a wide screen, over it as a sheet on a phone: the paper's claims, the chosen cell, and the method, as
     three tabs. It carries no document footer (foot: null) — a footer under an overflow:hidden body is one nobody can
     reach; its closing line is the method tab's last. */
  const body = `
<main class="ra-app" id="ra-app" data-sheet="peek" data-panel="open" data-ready="0">
<section class="ra-stage" aria-label="The globe">
  <div class="ra-map" id="ra-map" role="application" aria-label="A globe of the ocean divided into cells, each shaded by the chosen quantity; refused cells hatched, sea-ice cells dotted"></div>
  <div class="ra-ctl" id="ra-ctl">
    <div class="ra-seg ra-modes" id="ra-mode" role="radiogroup" aria-label="what the cells show"></div>
    <div class="ra-view"><label class="ra-lab" for="ra-mode-sel">view</label><select id="ra-mode-sel" class="ra-select"></select></div>
    <div class="ra-seg ra-blocks" id="ra-block" role="radiogroup" aria-label="block"></div>
    <div class="ra-sub" id="ra-sub"></div>
    <div class="ra-goto"><label class="ra-lab" for="ra-go">go to</label><select id="ra-go" class="ra-select"></select></div>
  </div>
  <div class="ra-legend" id="ra-legend" aria-live="polite"></div>
  <div class="ra-tip" id="ra-tip" aria-hidden="true"></div>
  <div class="ra-hint" id="ra-hint" role="status"></div>
  <button type="button" class="ra-reopen" id="ra-reopen" aria-controls="ra-panel" aria-expanded="true">the claims &amp; the cell</button>
</section>
<aside class="ra-panel" id="ra-panel" aria-label="The paper's claims, the chosen cell, and the method">
  <button type="button" class="ra-grip" id="ra-grip" aria-controls="ra-panel" aria-label="Show more of the panel"><i></i></button>
  <header class="ra-head">
    <div class="ra-eyebrow">instruments &middot; return-level atlas</div>
    <div class="ra-titlerow"><h1>Every cell a certificate.</h1><button type="button" class="ra-close" id="ra-close" aria-controls="ra-panel" aria-expanded="true">hide</button></div>
    <p class="ra-lede">The global map of Reis, Guimar&atilde;es et al. (Ocean Engineering, 2026) &mdash; which of six families fits significant wave height best, and the 100- and 1000-year wave &mdash; with each of the ${sea.length.toLocaleString('en-US')} open-sea cells of the paper's own hindcast certified, and its regional claims decided: ${nV('HOLDS')} hold, ${nV('DOES NOT HOLD')} do not, ${nV('UNDECIDED')} the refusals leave open.</p>
  </header>
  <div class="ra-tabs" role="tablist" aria-label="the panel">
    <button type="button" role="tab" id="ra-t-claims" aria-controls="ra-p-claims" aria-selected="true" tabindex="0">claims &middot; ${claims.length}</button>
    <button type="button" role="tab" id="ra-t-cell" aria-controls="ra-p-cell" aria-selected="false" tabindex="-1">cell</button>
    <button type="button" role="tab" id="ra-t-method" aria-controls="ra-p-method" aria-selected="false" tabindex="-1">method</button>
  </div>
  <div class="ra-body" id="ra-body">
    <section class="ra-pane" id="ra-p-claims" role="tabpanel" aria-labelledby="ra-t-claims">
      <p class="n">Each claim is quoted from the paper's &sect;3 and read as a region, the blocks it speaks of, and a rule over the certified cells there. A cell counts for a family only where the choice is DECIDED; a REFUSED cell counts for nobody and could count for anybody, so a claim <b>holds</b> when it is true however the refused cells fell, <b>does not hold</b> when it is false however they fell, and is <b>undecided</b> when they could make it either. Choose a claim to see its box.</p>
      <div id="ra-mine"></div>
      <div id="ra-sm"></div>
      <div class="k">the paper's ten</div>
      <p class="n" id="ra-recheck"></p>
      <ul class="ra-claims" id="ra-claims">${claimRows}</ul>
    </section>
    <section class="ra-pane" id="ra-p-cell" role="tabpanel" aria-labelledby="ra-t-cell" hidden>
      <div class="ra-find"><label class="ra-lab" for="ra-find">find a cell</label><input id="ra-find" class="ra-select" type="text" inputmode="decimal" placeholder="lat, lon" aria-label="open the cell nearest a latitude and longitude, for example -22.5, -40" autocomplete="off"></div>
      <div id="ra-cellbox"><p class="n">Choose a cell on the globe, or type a latitude and longitude: its choices open here, and it can be certified again in this tab from the pinned data, with the ledger's own code.</p></div>
    </section>
    <section class="ra-pane ra-prose" id="ra-p-method" role="tabpanel" aria-labelledby="ra-t-method" hidden>
      <h2>What is certified, and what is not</h2>
      <p>At every cell and block, each family's fit is a box the Krawczyk operator proves holds exactly one zero of the score, with the Hessian proved negative definite over it &mdash; the likelihood's one maximum there &mdash; or it is refused with the reason: the generalized gamma is left out only where its likelihood is proved to peak at its lognormal limit beside the lognormal fit; any other refusal blocks the choice. The four criteria and the levels are enclosures over the box; a family is chosen only where its enclosure lies wholly below every other's. That no better maximum lies elsewhere in a family is the search's claim, as it is any optimiser's. Not certified: that a family is the true law of the sea, the sampling width of a 100-year level, or the model's own error against the sea it simulates. A cell certified in your tab also draws its return-level plot from the same certificates: each family's quantile over return periods from two blocks to 10,000 years, every point an enclosure narrower than the line, beside the block maxima and the record.</p>
      <p>The data: the Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01 (0.5&deg;, 3-hourly, ${esc(M.first)} to ${esc(M.last)}), the paper's own, CC BY-SA 4.0. Every hs chunk of every monthly file was read by byte range and hashed as read (the same hashes corpus/ww3-points pinned for the same files), and each UTC day's largest value kept at the nodes of a 4&deg; global lattice, a 1&deg; lattice of the Brazilian margin and the report's thirteen nodes; a cell is the node's series, not an area mean. ${ice.length.toLocaleString('en-US')} cells that the hindcast's own sea-ice field touches at some 3-hourly step of the 32 years are shown and not certified: under ice the model damps the waves to millimetres rather than leaving a gap, so the series is partly the ice's. The daily, weekly and monthly blocks are here; the unfiltered 3-hourly block is certified at the thirteen nodes of <a href="/reports/return-levels.html">the return-level report</a>, where six fits of 93,504 values take minutes each. Land: Natural Earth 1:50m, public domain.</p>
      <h2>What this opens</h2>
      <p>${OPENS}</p>
      <p>The code in your tab: ${Object.entries(modules).map(([rel, h]) => '<span class="mono">' + esc(rel) + '</span> ' + h.slice(0, 12)).join(' &middot; ')}. ${S ? 'Cell files served from the public repository at commit <span class="mono">' + S.commit.slice(0, 12) + '</span>, each checked against its sha256 before it is used; the whole ledger is <a href="https://github.com/' + REPO + '/blob/' + S.commit + '/certs/hseva-atlas.json">certs/hseva-atlas.json</a> at the same commit.' : 'Cell files are not yet served from a published commit; the map and the claims stand, re-certification in the tab waits for them.'}</p>
      <p class="mono ra-cmd">instruments/hseva/.venv/bin/python3 tools/fetch-ww3-grid.py<br>instruments/hseva/.venv/bin/python3 tools/fetch-ww3-grid.py --ice<br>instruments/hseva/.venv/bin/python3 tools/build-ww3-atlas-corpus.py<br>node tools/run-hseva-atlas.js<br>node instruments/hseva/battery.js</p>
      <p class="n">nothing here is gated · every number came out of the record beside the page</p>
    </section>
  </div>
</aside>
</main>`;
  const SPEC = { modules, served: S ? S.base : null };
  const html = page({
    title: 'The return-level atlas — cert-machine',
    desc: 'The global map of Reis, Guimarães et al. (Ocean Eng. 2026) — which of six families fits significant wave height best, and the 100- and 1000-year wave — with every cell of the paper\'s own hindcast certified: the choice DECIDED or REFUSED, the paper\'s regional claims decided as boxes, and any cell re-certified in your tab from the pinned data.',
    path: '/instruments/return-level-atlas/',
    css: CSS,
    body,
    foot: null,
    script: `<script id="ra-spec" type="application/json">${JSON.stringify(SPEC).replace(/</g, '\\u003c')}</script>\n<script id="ra-bundle" type="text/plain">${B.BUNDLE}</script>\n<script id="ra-worker" type="text/plain">${WORKER}</script>\n<script src="vendor/maplibre-gl.js"></script>\n<script>${rulesJs}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, data: data.length, sea: sea.length, ice: ice.length, claims: claims.map((k) => k.id + ':' + k.verdict), served: S ? S.commit.slice(0, 12) : null, facts };
}

/* the card: a mosaic of cells on a globe's limb */
function cardArt() {
  const S0 = 560, cx = 280, cy = 300, R = 220;
  let cells = '';
  for (let la = -72; la <= 72; la += 12) for (let lo = -84; lo <= 84; lo += 12) {
    const x = cx + R * Math.cos(la * Math.PI / 180) * Math.sin(lo * Math.PI / 180), y = cy - R * Math.sin(la * Math.PI / 180);
    const w = 16 * Math.cos(lo * Math.PI / 180) * Math.cos(la * Math.PI / 180) + 2, h = 16 * Math.cos(la * Math.PI / 180) + 2;
    const v = 0.35 + 0.6 * Math.abs(Math.sin((la * 3 + lo) * Math.PI / 180));
    cells += `<rect x="${(x - w / 2).toFixed(1)}" y="${(y - h / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="currentColor" fill-opacity="${v.toFixed(2)}"/>`;
  }
  return `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="A globe covered in a mosaic of cells, each a certified fit."><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-width="1"/>${cells}</svg>`;
}

module.exports = { build, cardArt, exists };
