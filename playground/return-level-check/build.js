/* build.js — site/instruments/return-level-check/index.html.
   playground/return-level-check/ · cert-machine · 2026-09-26

   The return-level table as a certificate, for a series the reader brings:
   drop a significant-wave-height record (or take the Campos Basin hindcast
   preset), declare the block, and the six families of Reis, Guimarães et al.
   (Ocean Eng. 2026) are fitted and certified in the tab — every fit a box the
   Krawczyk operator proved to hold one zero of the score, or a refusal; the
   four criteria and the 100- and 1000-year levels as enclosures; the choice
   DECIDED or REFUSED — and a certificate carrying the data's sha256 (never the
   data) is written for download. A second panel decides a fit someone printed.

   NO FICTION ON /instruments: the code in the tab is instruments/interval and
   instruments/hseva inlined byte for byte (their sha256 go into every
   certificate), the same bytes that certified certs/hseva-ledger.json and that
   instruments/hseva/battery.js checks. The page states no number of its own
   except the preset's, which are read from the pinned extraction. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const WORKER = fs.readFileSync(path.join(HERE, 'worker.js'), 'utf8');
const { PAPER_SIX } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

/* the ledger's modules, byte for byte, behind a twelve-line require (bundle.js, shared with the atlas) */
const { bundle } = require(path.join(HERE, 'bundle.js'));
const B = bundle();
const BUNDLE = B.BUNDLE;
const modules = {};
/* the page's own code is named too: app.js holds THE parse rule (bytes → series), worker.js the run */
modules['playground/return-level-check/app.js'] = sha(APP);
modules['playground/return-level-check/worker.js'] = sha(WORKER);
Object.assign(modules, B.modules);

/* the preset: the Campos Basin node of the paper's own hindcast, if the extraction is complete and contiguous */
function preset() {
  const dir = path.join(ROOT, 'corpus', 'ww3-points', 'months');
  if (!fs.existsSync(path.join(ROOT, 'corpus', 'ww3-points', 'meta.json'))) return null;
  const files = fs.readdirSync(dir).filter((f) => /^\d{6}\.json$/.test(f)).sort();
  if (files.length !== 384) return null;
  const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', 'points.json'), 'utf8')).points.find((p) => p.name === 'campos');
  const t = [], v = [];
  for (const f of files) { const r = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); for (let i = 0; i < r.steps; i++) { t.push(r.times[i]); v.push(r.points.campos[i]); } }
  for (let i = 1; i < t.length; i++) if (Date.parse(t[i] + ':00Z') - Date.parse(t[i - 1] + ':00Z') !== 3 * 3600000) throw new Error('return-level-check: the Campos series is not contiguous at ' + t[i]);
  if (v.some((x) => !(x > 0))) throw new Error('return-level-check: the Campos series holds a fill or a zero');
  const buf = Buffer.alloc(v.length * 2); v.forEach((x, i) => buf.writeInt16LE(x, i * 2));
  return { name: 'Campos Basin, 22.5° S 40.0° W — Ifremer WAVEWATCH III hindcast GLOBMULTI_ERA5_GLOBCUR_01, the paper\'s data (CC BY-SA 4.0)', source: 'corpus/ww3-points (pinned by digest, extracted by tools/fetch-ww3-points.py)', lat: P.lat, lon: P.lon, start: t[0], step: 3, n: v.length, last: t[t.length - 1], b64: buf.toString('base64'), sha256: sha(buf) };
}

function build(OUTDIR) {
  const P = preset();
  const SPEC = { families: PAPER_SIX, T: [100, 1000], modules, preset: P };
  const blockOpts = [['native', 'the series itself (unfiltered)'], ['daily', 'daily maxima'], ['weekly', 'weekly maxima (ISO weeks)'], ['monthly', 'monthly maxima'], ['annual', 'annual maxima']];
  const FW = { normal: 'normal', lognormal: 'lognormal', weibull: 'Weibull', expweibull: 'exponentiated Weibull', gengamma: 'generalized gamma', gumbel: 'Gumbel' };
  const ORD = ['1st', '2nd', '3rd'].concat(Array.from({ length: 17 }, (_, i) => (i + 4) + 'th'));
  const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">instruments &middot; return-level check &middot; a marginal fit, certified in your tab</div>
  <h1>Certify a return level. Your file never leaves this page.</h1>
  <p class="lede">Bring a significant-wave-height record; declare the block. The six families of <a href="https://doi.org/10.1016/j.oceaneng.2026.125841">Reis, Guimar&atilde;es, Farina, Paul, de Paula and Ribeiro (Ocean Engineering, 2026)</a> are fitted by maximum likelihood and each fit is <em>certified</em> &mdash; a box the Krawczyk operator proves holds exactly one zero of the score, over which the likelihood is proved concave, so that zero is its maximum there; all of it evaluated in outward-rounded interval arithmetic over every value &mdash; or refused with the reason. The paper's four criteria and the 100- and 1000-year levels come back as enclosures, the choice of family as DECIDED or REFUSED, and you can download the certificate: it carries your file's sha256 and the digest of every file of code that ran, the rule that read your file included, never the data. The code is the one that certified <a href="/reports/return-levels.html">the return-level table</a> and every cell of <a href="/instruments/return-level-atlas/">the return-level atlas</a>, running in your browser; your file is read here and sent nowhere.</p>
</div></header>

<section class="wrap">
  <div class="rc-wrap">
    <div class="rc-main">
      <div class="rc-drop" id="rc-drop">
        <div class="k">1 &middot; your series</div>
        <p>Drop a text or CSV file here, or <label class="rc-file">choose one<input id="rc-file" type="file" accept=".txt,.csv,.dat,text/plain,text/csv"></label>${P ? ', or <button id="rc-preset" type="button">use the Campos Basin hindcast, ' + P.start.slice(0, 4) + '&ndash;' + P.last.slice(0, 4) + '</button>' : ''}. One line per time: a timestamp first (<span class="mono">2004-03-01 06:00</span>, <span class="mono">2004-03-01T06:00Z</span>, <span class="mono">2004-03-01-06</span>; a zone written with it is applied), then fields split by spaces, tabs, commas or semicolons; Hs is the <select id="rc-col" aria-label="the field that holds Hs">${ORD.map((w, i) => '<option value="' + (i + 1) + '">' + w + '</option>').join('')}</select> <label class="inl" for="rc-col">field after the timestamp</label>. Lines without a timestamp, fields that are not a number, and NDBC's missing marks (99, 999, 9999) are skipped and counted; the lines are put in time order.</p>
      </div>
      <div class="rc-data" id="rc-data"><div class="k">the series</div><div class="n">none yet</div></div>
      <div class="rc-controls">
        <div><label for="rc-block">2 &middot; the block</label><select id="rc-block">${blockOpts.map(([v, t]) => '<option value="' + v + '"' + (v === 'daily' ? ' selected' : '') + '>' + t + '</option>').join('')}</select></div>
        <div class="rc-fams"><span class="lab">the families</span>${PAPER_SIX.map((f) => '<label><input type="checkbox" id="rc-f-' + f + '" checked> ' + FW[f] + '</label>').join('')}</div>
        <div class="rc-go"><button id="rc-run" type="button" disabled>3 &middot; certify</button><button id="rc-download" type="button" disabled>download the certificate</button></div>
      </div>
      <div class="rc-progress" id="rc-progress"></div>
      <div class="rc-verdict" id="rc-verdict"></div>
      <div id="rc-results"></div>
    </div>
  </div>
</section>

<section class="wrap">
  <h2 class="t2">Decide a fit someone printed</h2>
  <p class="lede">A report, a colleague or a pipeline printed a fitted distribution. Type its parameters as printed; they are decided against the series and block above, over every value the printed digits allow &mdash; <b>REPRODUCED</b> when the digits are the rounding of the certified maximum-likelihood fit; <b>CONSISTENT</b> when they carry more digits than the certified box resolves and lie inside it; <b>OFF THE MAXIMUM</b> when its likelihood is provably lower; <b>NOT THE CERTIFIED FIT</b> when the digits exclude the maximum but cannot separate the likelihoods; <b>BELOW ITS LIMIT</b> when the family peaks at its lognormal limit and the printed point is provably less likely than that limit; <b>OUTSIDE ITS SUPPORT</b> when a location leaves observed values with zero density; <b>NOT DECIDED</b> when the digits are too few to say.</p>
  <div class="rc-check">
    <div><label for="rc-cf">family</label><select id="rc-cf">${PAPER_SIX.map((f) => '<option value="' + f + '">' + FW[f] + '</option>').join('')}</select></div>
    <div class="rc-cp" id="rc-cp"></div>
    <div><button id="rc-check" type="button">decide it</button></div>
  </div>
  <div class="rc-out" id="rc-check-out"></div>
</section>

<section class="section"><div class="wrap">
  <div class="prose">
    <h2 class="t2">What is certified, and what is not</h2>
    <p>Certified: that each fit is the unique stationary point of the likelihood in its box, and its maximum there &mdash; the Hessian is proved negative definite over the whole box; that each criterion and level is what that box implies; that a ranking follows from the enclosures. The float search that finds a candidate is never trusted for a number &mdash; the box is. The generalized gamma tends to the lognormal as its shape grows, and on many records its likelihood peaks there: where the certificate proves that next to the limit (the derivative in Prentice's Q negative over a stated neighbourhood of the lognormal fit) and a search from both ends of the family finds no maximum inside it above the lognormal's, the family is left out of the ranking, named &mdash; the lognormal it tends to is ranked. The exponentiated Weibull whose climb runs past &alpha; = 10<sup>4</sup> is in its Gumbel regime &mdash; with &theta; = &lambda;<sup>k</sup> and &beta; = &theta; ln &alpha; it is a Gumbel law of H<sub>s</sub><sup>k</sup> &mdash; and is carried to (k, &theta;, &beta;), where its maximum is an ordinary point, and certified there. Any family still without a certified maximum makes the ranking REFUSED rather than handing the choice to the families that did converge. A certified maximum is a maximum in its box; that no better one exists elsewhere in the family is the search's claim, as it is any optimiser's. The location is fixed at zero, as the paper writes the families: with a free location the likelihood of every one of them is unbounded, and a number printed for it is where an optimiser stopped.</p>
    <p>Not certified: that any family is the true law of the sea, that the data are right, or how uncertain a 100- or 1000-year level is &mdash; that uncertainty is statistical and is not in these enclosures. Values are treated as independent draws, as the paper treats them. And "certified" here is the arithmetic's word, not a regulator's: offshore units are approved by classification societies under their own rules. A certificate from this page is evidence anyone can re-check without trusting the page &mdash; the same code, the same digest, the same boxes.</p>
    <p>The code, as inlined here: ${Object.entries(modules).map(([rel, h]) => '<span class="mono">' + esc(rel) + '</span> ' + h.slice(0, 12)).join(' &middot; ')}.${P ? ' The preset is the Campos Basin node of the paper\'s own hindcast: ' + P.n.toLocaleString('en-US') + ' three-hourly values, ' + P.start.slice(0, 10) + ' to ' + P.last.slice(0, 10) + ', sha256 ' + P.sha256.slice(0, 12) + '…, CC BY-SA 4.0 (Ifremer; Alday et al. 2021).' : ''}</p>
    <p class="mono ink-4 mt5 cmd">
    node instruments/hseva/battery.js<br>
    node tools/run-hseva-ledger.js<br>
    node playground/build.js</p>
  </div>
</div></section>`;
  const dir = path.join(OUTDIR, 'return-level-check');
  fs.mkdirSync(dir, { recursive: true });
  const json = JSON.stringify(SPEC).replace(/</g, '\\u003c');
  const html = page({
    title: 'Certify a return level — cert-machine',
    desc: 'Bring a significant-wave-height record: the six families of Reis, Guimarães et al. (Ocean Eng. 2026) are fitted and certified in your browser — each fit a box proved to hold one maximum of the likelihood, or a refusal; four criteria and the 100- and 1000-year levels as enclosures; a downloadable certificate carrying your file\'s sha256, never the data. And decide a fit someone printed.',
    path: '/instruments/return-level-check/',
    css: CSS,
    body: `<main>${body}</main>`,
    script: `<script id="rc-spec" type="application/json">${json}</script>\n<script id="rc-bundle" type="text/plain">${BUNDLE}</script>\n<script id="rc-worker" type="text/plain">${WORKER}</script>\n<script>${APP}</script>`,
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, preset: !!P, modules: Object.keys(modules).length };
}

/* the card: six family curves, drawn as the lognormal limit the generalized gamma climbs to */
function cardArt() {
  const S0 = 560, ML = 40, MB = 40;
  const pdfLn = (x) => Math.exp(-Math.pow(Math.log(x), 2) / (2 * 0.36)) / (x * 0.6 * Math.sqrt(2 * Math.PI));
  const pdfW = (x, k) => k * Math.pow(x, k - 1) * Math.exp(-Math.pow(x, k));
  const xs = []; for (let x = 0.05; x <= 4; x += 0.05) xs.push(x);
  const px = (x) => ML + (x / 4) * (S0 - ML - 20), py = (y) => S0 - MB - Math.min(y, 1.4) / 1.4 * (S0 - MB - 30);
  const pathOf = (f) => xs.map((x, i) => (i ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(f(x)).toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="Density curves of a lognormal and of Weibull laws with rising shape: the families a return level is read from.">`
    + [1.2, 1.6, 2.2].map((k, i) => `<path d="${pathOf((x) => pdfW(x, k))}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity="${0.35 + 0.15 * i}" stroke-dasharray="5 4"/>`).join('')
    + `<path d="${pathOf(pdfLn)}" fill="none" stroke="currentColor" stroke-width="2.4" stroke-opacity="0.95"/>`
    + `<line x1="${ML}" y1="${S0 - MB}" x2="${S0 - 20}" y2="${S0 - MB}" stroke="currentColor" stroke-opacity="0.35" stroke-width="1"/>`
    + '</svg>';
}

module.exports = { build, cardArt };
