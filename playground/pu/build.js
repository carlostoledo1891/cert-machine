/* build.js — site/instruments/pu/index.html: PU Verificado, the instrument.
   playground/pu/ · cert-machine · 2026-10-16

   A rate, a settlement date and a maturity give the Tesouro Direto price of an LTN or an NTN-F exactly, under the
   Treasury's own rule table — the enclosure of the one irrational step, and every truncation shown as a decision.
   Paste rows of the published CSV and each is decided to the verdict the ledger gives it.
   2026-10-17: the LFT (Tesouro Selic) joined — the pinned SGS 11 and SGS 432 series ride in the page, compacted and
   decoded back before the page is written — and a pasted row is decided by instruments/pu/rows.js, the module the
   ledger itself calls, under every pre-registered hypothesis (until then the tab tried the primary settlement only).

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
const ROWS_SRC = fs.readFileSync(path.join(ROOT, 'instruments', 'pu', 'rows.js'), 'utf8');
const B3 = fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'b3-settlement.json'), 'utf8');
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'pu', 'PINS.json'), 'utf8'));
const ledgerPath = path.join(ROOT, 'certs', 'pu-ledger.json');
const L = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : null;

/* the LFT's inputs, read exactly as tools/run-pu-ledger.js reads them, then compacted for the page: SGS 11 as a string of
   day gaps (base 36) and runs of equal rates; SGS 432 as its change points. Decoded back here, and the page is refused
   unless the decoding equals the pinned series (the Selic) and gives the same meta on every pinned date (SGS 432). */
const BCB = path.join(ROOT, 'corpus', 'pu', 'sources', 'bcb');
const readSgs = (prefix) => { let rows = []; for (const f of fs.readdirSync(BCB).filter((x) => x.startsWith(prefix)).sort()) { if (sha(fs.readFileSync(path.join(BCB, f))) !== PINS.files['bcb/' + f].sha256) throw new Error('pu instrument: ' + f + ' is not the pinned file'); rows = rows.concat(JSON.parse(fs.readFileSync(path.join(BCB, f), 'utf8'))); } return rows.map((r) => { const [d, m, y] = r.data.split('/'); return { iso: y + '-' + m + '-' + d, valor: r.valor }; }).sort((a, b) => (a.iso < b.iso ? -1 : 1)); };
const SELIC = readSgs('sgs11-').map((r) => ({ iso: r.iso, pct6: Math.round(Number(r.valor) * 1e6) }));
const META_ROWS = readSgs('sgs432-').map((r) => [r.iso, r.valor.replace('.', ',')]);
const dayMs = 86400000, isoAdd = (iso, n) => new Date(Date.parse(iso + 'T00:00:00Z') + n * dayMs).toISOString().slice(0, 10);
function packSelic(rows) {
  let gaps = '', runs = [];
  rows.forEach((r, i) => { if (i) { const g = Math.round((Date.parse(r.iso) - Date.parse(rows[i - 1].iso)) / dayMs); if (g < 1 || g > 35) throw new Error('pu instrument: a Selic gap of ' + g + ' days'); gaps += g.toString(36); }
    if (runs.length && runs[runs.length - 1][1] === r.pct6) runs[runs.length - 1][0]++; else runs.push([1, r.pct6]); });
  return { first: rows[0].iso, gaps, runs };
}
function unpackSelic(p) {          /* the same function runs in app.js: keep the two byte-identical in meaning */
  const out = []; let iso = p.first, k = 0;
  for (const [n, v] of p.runs) for (let j = 0; j < n; j++) { if (out.length) iso = isoAdd(iso, parseInt(p.gaps[k++], 36)); out.push({ iso, pct6: v }); }
  return out;
}
const packMeta = (rows) => rows.filter((r, i) => !i || r[1] !== rows[i - 1][1]);
const SELIC_PACK = packSelic(SELIC), META_PACK = packMeta(META_ROWS);
{
  const back = unpackSelic(SELIC_PACK);
  if (back.length !== SELIC.length || back.some((r, i) => r.iso !== SELIC[i].iso || r.pct6 !== SELIC[i].pct6)) throw new Error('pu instrument: the packed Selic series does not decode to the pinned one');
  const full = new Map(META_ROWS), cp = new Map(META_PACK);
  const at = (M, iso) => { if (M.has(iso)) return M.get(iso); let best = null; for (const k of M.keys()) if (k < iso && (!best || k > best)) best = k; return best ? M.get(best) : null; };
  for (const [iso] of META_ROWS) if (at(full, iso) !== at(cp, iso)) throw new Error('pu instrument: the meta change points disagree with SGS 432 on ' + iso);
  for (const r of SELIC) if (at(full, r.iso) !== at(cp, r.iso)) throw new Error('pu instrument: the meta change points disagree with SGS 432 on ' + r.iso);
}

function build(OUT) {
  const holSha = sha(HOL), decSha = sha(DECIDE_SRC), rowsSha = sha(ROWS_SRC);
  if (JSON.parse(HOL).sourceSha256 !== PINS.files['feriados_nacionais.xls'].sha256) throw new Error('pu instrument: holidays.json is not read from the pinned xls');
  const spec = { decideSha256: decSha, rowsSha256: rowsSha, holidaysSha256: holSha, holidaysSource: PINS.files['feriados_nacionais.xls'].sha256,
    selic: { first: SELIC[0].iso, last: SELIC[SELIC.length - 1].iso, days: SELIC.length }, meta: { first: META_ROWS[0][0], last: META_ROWS[META_ROWS.length - 1][0] },
    ledger: L ? { generated: L.generated, pairs: L.scope.pairsDecided, reproduced: L.counts.byVerdict.REPRODUCED || 0, off: L.counts.byVerdict.OFF || 0, lastDate: L.scope.lastDate } : null };
  const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; Tesouro Direto</div>
  <h1>PU Verificado</h1>
  <p class="lede">The price of a federal bond under the Treasury&rsquo;s own rule table, decided in your tab: a rate, a settlement date and a maturity give the LTN, NTN-F or LFT (Tesouro Selic) price with every truncation shown and the one irrational step as an enclosure; the LFT reads the Selic index from the Central Bank&rsquo;s own series, pinned and carried in the page. Paste rows of the published Tesouro Direto file and each is decided by the code that decided the <a href="../../reports/pu-verificado.html">report</a>, to the verdict the report gives it. Nothing leaves this page.</p>
</div></header>

<section class="wrap panel" id="price">
  <div class="eyebrow">one price</div>
  <form id="f" class="form" onsubmit="return false">
    <label>title<select id="kind"><option value="LTN">Tesouro Prefixado (LTN)</option><option value="NTN-F">Tesouro Prefixado com Juros Semestrais (NTN-F)</option><option value="LFT">Tesouro Selic (LFT)</option></select></label>
    <label>maturity<input id="mat" type="date" value="2010-07-01"></label>
    <label>settlement<input id="settle" type="date" value="2008-05-21"></label>
    <label id="quoteL" hidden>quotation (the Selic index day)<input id="quote" type="date" value="2008-05-20"></label>
    <label>rate, % a.a. (as published)<input id="rate" type="text" inputmode="decimal" value="14,3600"></label>
    <label>printed price, R$ (optional)<input id="printed" type="text" inputmode="decimal" placeholder="753,32"></label>
  </form>
  <div id="out" class="out" aria-live="polite"></div>
</section>

<section class="wrap panel" id="rows">
  <div class="eyebrow">rows of the published file</div>
  <p class="sub">Paste lines of <span class="m">precotaxatesourodireto.csv</span> (Tipo Titulo;Data Vencimento;Data Base;Taxa Compra;Taxa Venda;PU Compra;PU Venda;PU Base). Each side is decided by <span class="m">instruments/pu/rows.js</span>, the module the ledger calls, under every hypothesis it pre-registered: the primary settlement (a purchase on the next business day, a sale on the quotation day), D+1, D+1 skipping 24 and 31 December, B3&rsquo;s settlement calendar and the calendar as of the quotation; REPRODUCED names the hypothesis that holds, CONSISTENT the one under which the printed centavos lie inside the price interval the printed rate&rsquo;s own precision allows. LTN, NTN-F and LFT; other titles are refused by name.</p>
  <textarea id="paste" rows="5" spellcheck="false" placeholder="Tesouro Prefixado;01/01/2027;15/10/2026;14,32;14,44;945,46;942,02;942,02"></textarea>
  <div class="row"><button id="decide" type="button">Decide the rows</button><span id="rowsNote" class="note"></span></div>
  <div id="table" class="out"></div>
</section>

<section class="wrap panel" id="trust">
  <div class="eyebrow">why you can trust this</div>
  <ul class="plain">
    <li><b>The same bytes.</b> <span class="m">instruments/pu/decide.js</span> is inlined here unchanged (sha256 <span class="m">${decSha.slice(0, 16)}&hellip;</span>); it is the decider of <span class="m">certs/pu-ledger.json</span>${L ? ' (' + Number(spec.ledger.pairs).toLocaleString('en-US') + ' prices, ' + Number(spec.ledger.reproduced).toLocaleString('en-US') + ' reproduced, last day ' + esc(spec.ledger.lastDate) + ')' : ''}.</li>
    <li><b>The calendar is pinned.</b> ANBIMA&rsquo;s national holidays, read once from the xls whose sha256 is <span class="m">${esc(PINS.files['feriados_nacionais.xls'].sha256.slice(0, 16))}&hellip;</span>. It is today&rsquo;s calendar: a price published before 2023-12-21 for a title maturing after 2024 was priced without the 20 November holiday — the report explains, and the toggle below re-decides under the calendar as of the quotation.</li>
    <li><b>The Selic index is pinned.</b> SGS 11 (the daily rate, ${esc(spec.selic.first)} to ${esc(spec.selic.last)}, ${Number(spec.selic.days).toLocaleString('en-US')} days) and SGS 432 (the target, which projects the VNA to a settlement after the quotation), read from the files whose sha256s <span class="m">corpus/pu/PINS.json</span> records; compacted for this page and decoded back against the pinned series before the page was written. The VNA accumulates the daily factor at 16 decimals, rounded half up, and truncates at 6 (Tabela 3).</li>
    <li><b>One rule for a row.</b> A pasted row runs through <span class="m">instruments/pu/rows.js</span> (sha256 <span class="m">${rowsSha.slice(0, 16)}&hellip;</span>), the same function the ledger calls on each of its rows, so the tab and the report cannot disagree on a verdict.</li>
    <li><b>Exact where the rule is exact.</b> Rate T-6, exponent T-14, flows A-9, price T-6 in integer arithmetic; the power (1 + taxa)^(du/252) as an enclosure at 10<sup>&minus;48</sup> with every series remainder bounded. A truncation whose enclosure straddles the boundary is REFUSED, not rounded through.</li>
    <li><b>What is not claimed.</b> A difference from a printed price is a difference from the methodology&rsquo;s value for the printed rate on the pinned calendar; conventions the publisher follows and does not print (a settlement calendar, a day skipped) are named, not assumed.</li>
  </ul>
  <label class="toggle"><input id="precal" type="checkbox"> one price: use the calendar as of the quotation (no 20 November holiday from 2024 on) — a pasted row tries both</label>
</section>`;
  const html = page({
    title: 'PU Verificado — the instrument',
    desc: 'Price a Tesouro Direto LTN, NTN-F or LFT exactly under the Treasury’s rule table, in the browser: the enclosure of the irrational step, every truncation as a decision, the Selic index from the pinned Central Bank series, and pasted rows of the published file decided by the ledger’s own module.',
    path: '/instruments/pu/', body, css: CSS,
    script: `<script id="pu-spec" type="application/json">${JSON.stringify(spec)}</script>\n<script id="pu-holidays" type="application/json">${HOL}</script>\n<script id="pu-b3" type="application/json">${B3}</script>\n<script id="pu-selic" type="application/json">${JSON.stringify(SELIC_PACK)}</script>\n<script id="pu-meta" type="application/json">${JSON.stringify(META_PACK)}</script>\n<script>${DECIDE}</script>\n<script>${ROWS_SRC}</script>\n<script>${APP}</script>`
  });
  fs.mkdirSync(path.join(OUT, 'pu'), { recursive: true });
  fs.writeFileSync(path.join(OUT, 'pu', 'index.html'), html);
  return { bytes: html.length, decideSha256: decSha, rowsSha256: rowsSha };
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
