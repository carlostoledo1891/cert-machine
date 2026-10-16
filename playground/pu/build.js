/* build.js — site/instruments/pu/index.html: PU Verificado, the instrument.
   playground/pu/ · cert-machine · 2026-10-16

   A rate, a settlement date and a maturity give the Tesouro Direto price of an LTN or an NTN-F exactly, under the
   Treasury's own rule table — the enclosure of the one irrational step, and every truncation shown as a decision.
   Paste rows of the published CSV and each is decided to the verdict the ledger gives it.

   NO FICTION ON /instruments: the code in the tab is instruments/pu/decide.js inlined byte for byte (its sha256 is
   printed on the page) — the same bytes that decided certs/pu-ledger.json — and corpus/pu/holidays.json, the pinned
   ANBIMA calendar read once from the xls. The page states no number of its own; the worked example it opens on is
   the methodology's. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const DECIDE_SRC = fs.readFileSync(path.join(ROOT, 'instruments', 'pu', 'decide.js'), 'utf8');
/* the sha printed is of the file as committed; the inlined text drops the shebang line, which is Node's, not the browser's */
const DECIDE = DECIDE_SRC.replace(/^#!.*\n/, '');
const HOL = fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'holidays.json'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'PINS.json'), 'utf8'));
const ledgerPath = path.join(ROOT, 'certs', 'pu-ledger.json');
const L = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : null;

function build(OUT) {
  const holSha = sha(HOL), decSha = sha(DECIDE_SRC);
  if (JSON.parse(HOL).sourceSha256 !== PINS.files['feriados_nacionais.xls'].sha256) throw new Error('pu instrument: holidays.json is not read from the pinned xls');
  const spec = { decideSha256: decSha, holidaysSha256: holSha, holidaysSource: PINS.files['feriados_nacionais.xls'].sha256,
    ledger: L ? { generated: L.generated, pairs: L.scope.pairsDecided, reproduced: L.counts.byVerdict.REPRODUCED || 0, off: L.counts.byVerdict.OFF || 0, lastDate: L.scope.lastDate } : null };
  const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; Tesouro Direto</div>
  <h1>PU Verificado</h1>
  <p class="lede">The price of a fixed-rate federal bond under the Treasury&rsquo;s own rule table, decided in your tab: a rate, a settlement date and a maturity give the LTN or NTN-F price with every truncation shown and the one irrational step as an enclosure. Paste rows of the published Tesouro Direto file and each is decided to the same verdict the <a href="../../reports/pu-verificado.html">report</a> gives it. Nothing leaves this page.</p>
</div></header>

<section class="wrap panel" id="price">
  <div class="eyebrow">one price</div>
  <form id="f" class="form" onsubmit="return false">
    <label>title<select id="kind"><option value="LTN">Tesouro Prefixado (LTN)</option><option value="NTN-F">Tesouro Prefixado com Juros Semestrais (NTN-F)</option></select></label>
    <label>maturity<input id="mat" type="date" value="2010-07-01"></label>
    <label>settlement<input id="settle" type="date" value="2008-05-21"></label>
    <label>rate, % a.a. (as published)<input id="rate" type="text" inputmode="decimal" value="14,3600"></label>
    <label>printed price, R$ (optional)<input id="printed" type="text" inputmode="decimal" placeholder="753,32"></label>
  </form>
  <div id="out" class="out" aria-live="polite"></div>
</section>

<section class="wrap panel" id="rows">
  <div class="eyebrow">rows of the published file</div>
  <p class="sub">Paste lines of <span class="m">precotaxatesourodireto.csv</span> (Tipo Titulo;Data Vencimento;Data Base;Taxa Compra;Taxa Venda;PU Compra;PU Venda;PU Base). Each side is decided under the conventions the ledger measured: a purchase settles on the next business day, a sale on the quotation day (D+1 until 2021-09-10), centavos truncated. Fixed-rate titles only; other titles are refused by name.</p>
  <textarea id="paste" rows="5" spellcheck="false" placeholder="Tesouro Prefixado;01/01/2027;15/10/2026;14,32;14,44;945,46;942,02;942,02"></textarea>
  <div class="row"><button id="decide" type="button">Decide the rows</button><span id="rowsNote" class="note"></span></div>
  <div id="table" class="out"></div>
</section>

<section class="wrap panel" id="trust">
  <div class="eyebrow">why you can trust this</div>
  <ul class="plain">
    <li><b>The same bytes.</b> <span class="m">instruments/pu/decide.js</span> is inlined here unchanged (sha256 <span class="m">${decSha.slice(0, 16)}&hellip;</span>); it is the decider of <span class="m">certs/pu-ledger.json</span>${L ? ' (' + Number(spec.ledger.pairs).toLocaleString('en-US') + ' prices, ' + Number(spec.ledger.reproduced).toLocaleString('en-US') + ' reproduced, last day ' + esc(spec.ledger.lastDate) + ')' : ''}.</li>
    <li><b>The calendar is pinned.</b> ANBIMA&rsquo;s national holidays, read once from the xls whose sha256 is <span class="m">${esc(PINS.files['feriados_nacionais.xls'].sha256.slice(0, 16))}&hellip;</span>. It is today&rsquo;s calendar: a price published before 2023-12-21 for a title maturing after 2024 was priced without the 20 November holiday — the report explains, and the toggle below re-decides under the calendar as of the quotation.</li>
    <li><b>Exact where the rule is exact.</b> Rate T-6, exponent T-14, flows A-9, price T-6 in integer arithmetic; the power (1 + taxa)^(du/252) as an enclosure at 10<sup>&minus;48</sup> with every series remainder bounded. A truncation whose enclosure straddles the boundary is REFUSED, not rounded through.</li>
    <li><b>What is not claimed.</b> A difference from a printed price is a difference from the methodology&rsquo;s value for the printed rate on the pinned calendar; conventions the publisher follows and does not print (a settlement calendar, a day skipped) are named, not assumed.</li>
  </ul>
  <label class="toggle"><input id="precal" type="checkbox"> use the calendar as of the quotation (no 20 November holiday from 2024 on)</label>
</section>`;
  const html = page({
    title: 'PU Verificado — the instrument',
    desc: 'Price a Tesouro Direto LTN or NTN-F exactly under the Treasury’s rule table, in the browser: the enclosure of the irrational step, every truncation as a decision, and pasted rows of the published file decided to the ledger’s verdicts.',
    path: '/instruments/pu/', body, css: CSS,
    script: `<script id="pu-spec" type="application/json">${JSON.stringify(spec)}</script>\n<script id="pu-holidays" type="application/json">${HOL}</script>\n<script>${DECIDE}</script>\n<script>${APP}</script>`
  });
  fs.mkdirSync(path.join(OUT, 'pu'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'pu', 'index.html'), html);
  return { bytes: html.length, decideSha256: decSha };
}

/* the card: a digit ladder — three rows of digits, the parting cell outlined */
function cardArt() {
  const S0 = 560, cw = 56, ch = 64, x0 = 36, y0 = 170;
  const rows = [['7', '5', '3', ',', '3', '1', '5', '3', '2'], ['7', '5', '3', ',', '3', '1', '5', '3', '2'], ['7', '5', '3', ',', '3', '1', '5', '3', '3']];
  let out = `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="A digit ladder: a published price over the two ends of its enclosure, digit by digit; the last cell differs.">`;
  rows.forEach((r, i) => r.forEach((d, j) => {
    const x = x0 + j * cw, y = y0 + i * (ch + 10);
    if (d === ',') { out += `<text x="${x + cw / 2}" y="${y + ch * 0.72}" text-anchor="middle" font-size="40" fill="currentColor" fill-opacity="0.5">,</text>`; return; }
    const part = j === 8 && i > 0;
    out += `<rect x="${x + 4}" y="${y}" width="${cw - 8}" height="${ch}" rx="4" fill="none" stroke="currentColor" stroke-opacity="${part ? 0.95 : 0.25}" stroke-width="${part ? 3 : 1.2}"/>`;
    out += `<text x="${x + cw / 2}" y="${y + ch * 0.7}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="34" fill="currentColor" fill-opacity="${j < 8 ? 0.55 : 0.95}">${d}</text>`;
  }));
  out += `<text x="${x0}" y="${y0 - 28}" font-family="ui-monospace, monospace" font-size="18" fill="currentColor" fill-opacity="0.45" letter-spacing="2">PUBLISHED</text>`;
  out += `<text x="${x0}" y="${y0 + 3 * (ch + 10) + 34}" font-family="ui-monospace, monospace" font-size="18" fill="currentColor" fill-opacity="0.45" letter-spacing="2">ENCLOSURE LO · HI</text>`;
  return out + '</svg>';
}

module.exports = { build, cardArt };
