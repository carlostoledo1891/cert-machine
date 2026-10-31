/* deck.js — Janela's pitch deck (English, 16:9, 12 slides), printed to PDF by
   headless Chrome at site/janela/janela-apresentacao.pdf. English since
   2026-10-31 (the operator: the deck was never sent; the app and the method
   page went English on 2026-10-30). The file keeps its Portuguese name: the
   pages link that URL.

   ONE NUMBERS OBJECT. Every figure is read from numbers.js (the same N the
   method page reads), from uses.js (the use cases the app's doors and the page
   share), from the pinned rule files, or computed here by the SAME pinned
   instruments the app runs (instruments/window/campaign.js over the hindcast
   hindcast.js verifies); facts() throws when a record stops saying what a
   slide needs, and the build refuses. The stylesheet and the printer are the
   Contraprova deck's (one deck design for the products).

   THE PICTURES ARE THE APP. Two screenshots of the built app (the fleet at a
   desk, a unit's card on a phone) are taken from site/janela/ through a local
   server at print time — never drawn for the deck.

   build(N, shots) -> html   (shots null: the text-only form, whose sha256 is
                              the reprint pin — the screenshots move with the
                              animated sea, the slides' words do not)
   shots() -> { fleet, card } base64 PNGs
   print(html, out)          the Contraprova printer
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const ROOT = path.join(__dirname, '..', '..');
const CP = require(path.join(ROOT, 'apps', 'contraprova', 'deck.js'));
const { APP_DARK } = require(path.join(ROOT, 'design', 'app-shell.js'));
const T = require(path.join(ROOT, 'design', 'tokens.js'));
const { en, Q } = require('./numbers.js');
const USES = require('./uses.js');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const need = (c, m) => { if (!c) throw new Error('janela deck: ' + m); };
const pct = (w, n, k) => en.dec((100 * w / n).toFixed(k === undefined ? 1 : k)) + '%';
const d2 = (x) => en.dec(Number(x).toFixed(2));
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ym = (iso) => MONTHS[+iso.slice(5, 7) - 1] + ' ' + iso.slice(0, 4);

/* ---- the facts a slide states that N does not already hold, each from its record ---- */
function facts(N) {
  const F = {};
  const SITES = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/sites.json'), 'utf8')).sites;
  const UNITS = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/platforms.json'), 'utf8')).units;
  const NPCP = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/rules/npcp.json'), 'utf8'));
  const DNV = JSON.parse(fs.readFileSync(path.join(ROOT, 'apps/janela/scenario/rules/dnv-alpha.json'), 'utf8'));
  F.units = UNITS.length;
  /* the measured sites: every site a bands record calibrates (the 2026-10-06 record's eight + each region's) */
  const BR = require('./audit/bandset.js').bands().records;
  F.mainSites = BR[0].sites.length;
  F.sites = new Set([].concat(...BR.map((r) => r.sites))).size;
  F.rules = NPCP.rules.length; F.acts = Object.keys(NPCP.sources).length;
  F.b704 = JSON.stringify(DNV).match(/"B704":\s*"([^"]+)"/);
  need(F.b704, 'dnv-alpha.json lost the B704 quote'); F.b704 = F.b704[1];
  F.ecmwfPairs = N.bands.rows;
  const NB = JSON.parse(fs.readFileSync(path.join(ROOT, 'certs/janela-bands-noaa.json'), 'utf8'));
  F.noaaPairs = NB.source && NB.source.rows; need(F.noaaPairs, 'certs/janela-bands-noaa.json lost source.rows');
  need(N.heldOut, 'certs/janela-providers-eval.json is missing: the deck states its held-out number');
  F.H = N.heldOut;

  /* the site alpha at design Hs 2 m over the offshore basins of the 2026-10-06 record (a region — Sergipe — and the
     coast point are said apart: their alpha sits at or under the table), every TPOP */
  need(N.alpha, 'certs/janela-alpha.json is missing');
  const BS = require('./audit/bandset.js');
  const off = Object.keys(N.alpha.sites).filter((sid) => { const s = SITES.find((x) => x.id === sid); return s && (s.kind === 'field' || s.kind === 'platform') && !BS.regionOf(sid); });
  const cells = [].concat(...off.map((sid) => N.alpha.sites[sid].cells.filter((c) => c.designHs === 2 && c.verdict === 'ESTIMATED')));
  need(cells.length >= 10, 'too few site-alpha cells at design Hs 2 m');
  F.alpha = { lo: Math.min(...cells.map((c) => c.alpha)), hi: Math.max(...cells.map((c) => c.alpha)), tLo: Math.min(...cells.map((c) => c.dnv['4-1'])), tHi: Math.max(...cells.map((c) => c.dnv['4-1'])),
    above: cells.filter((c) => c.ci90[0] > c.dnv['4-1']).length, n: cells.length, basins: off.length, cal: N.alpha.calibration };

  /* the month: Santos, Hs <= 2.0 m for 48 h — the sea, Table 4-1, the site alpha (exact counts, the record) */
  const c = N.work.sites.santos && N.work.sites.santos.cells['2.0m/48h'];
  need(c && c.s, 'the Santos 2.0 m / 48 h workability cell (with the site alpha) is gone');
  F.work = { sea: pct(c.o[12][0], c.o[12][1]), tab: pct(c.f[12][0], c.f[12][1]), loc: pct(c.s.c[12][0], c.s.c[12][1]), aT: c.ad, aS: c.s.a, wfT: c.wf, wfS: c.s.wf,
    from: N.work.from.slice(0, 4), to: N.work.to.slice(0, 4) };

  /* the campaign: ten 48 h operations at Hs <= 2.0 m from 1 November, run in every hindcast year by the pinned planner */
  const H = require('./audit/hindcast.js').load('santos');
  const CAMP = require(path.join(ROOT, 'instruments', 'window', 'campaign.js'));
  const run = (lim) => CAMP.campaign(H, { limit: lim, TR: 48, N: 10, start: '11-01' });
  const days = (h) => (h === null || h === undefined ? '—' : en.dec((Math.round(h / 2.4) / 10).toFixed(1)));
  const sea = run('2.0'), tab = run(Q.str(Q.mul(Q.parse(c.a), Q.parse('2.0')))), loc = run(Q.str(Q.mul(Q.parse(c.s.a), Q.parse('2.0'))));
  F.camp = [['the sea (Hs ≤ 2.0 m)', sea], ['the site\'s α (OPWF ' + en.dec(c.s.wf) + ' m)', loc], ['Table 4-1 (OPWF ' + en.dec(c.wf) + ' m)', tab]]
    .map(([k, r]) => ({ k, q50: days(r.q50), q90: days(r.q90), worst: days(r.worst), wy: r.worstYear, fin: r.finished, cen: r.censored }));

  /* the third provider, measured (certs/janela-providers-eval-aifs.json, providers-eval-aifs-v1) */
  const AE = path.join(ROOT, 'certs', 'janela-providers-eval-aifs.json');
  if (fs.existsSync(AE)) {
    const R = JSON.parse(fs.readFileSync(AE, 'utf8')), r = Object.fromEntries(R.results.map((x) => [x.option, x.limits['2.0']]));
    need(r['U(E,N)'] && r['U(E,A)'], 'the AIFS evaluation lost its unions');
    F.aifs = { test: R.pairs.test, en: r['U(E,N)'], ea: r['U(E,A)'], from: R.pairs.split };
  }
  /* the hindcast against the Navy's buoys (certs/janela-pnboia-check.json): the time at or under 1.5 and 2.0 m, pooled */
  const PB = path.join(ROOT, 'certs', 'janela-pnboia-check.json');
  if (fs.existsSync(PB)) {
    const R = JSON.parse(fs.readFileSync(PB, 'utf8')), t = {};
    let dep = 0;
    for (const b of R.buoys) {
      if (!b.pointwise) continue;
      dep++;
      for (const k of ['1.5m', '2.0m']) {
        const c = b.pointwise[k], x = t[k] = t[k] || { n: 0, buoy: 0, hind: 0 };
        x.n += c.both + c.buoyOnly + c.hindcastOnly + c.neither; x.buoy += c.both + c.buoyOnly; x.hind += c.both + c.hindcastOnly;
      }
    }
    need(dep >= 5, 'too few buoy deployments compared');
    F.pnb = { deployments: dep, pairs: t['2.0m'].n, b20: pct(t['2.0m'].buoy, t['2.0m'].n), h20: pct(t['2.0m'].hind, t['2.0m'].n),
      b15: pct(t['1.5m'].buoy, t['1.5m'].n, 0), h15: pct(t['1.5m'].hind, t['1.5m'].n, 0),
      from: R.buoys.filter((b) => b.from).map((b) => b.from).sort()[0].slice(0, 4), to: R.buoys.filter((b) => b.to).map((b) => b.to).sort().slice(-1)[0].slice(0, 4) };
  }
  /* the day the app re-decides (the local copy build-today.js just wrote and gated), when it is on this disk */
  const TD = path.join(ROOT, 'site', 'janela', 'data', 'today.json');
  F.day = fs.existsSync(TD) ? (() => { const t = JSON.parse(fs.readFileSync(TD, 'utf8')); return { decisions: t.decisions, second: t.second, run: t.run, proposers: t.ledger ? t.ledger.proposers.length : null }; })() : null;
  F.month = ym(N.feed.run);
  return F;
}

function css() {
  return CP.css() + `
:root{${Object.entries(APP_DARK).map(([k, v]) => k + ':' + v).join(';')}}
.jn-c{display:inline-flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:13px;font-weight:600;letter-spacing:.1em;padding:.4em .9em;border-radius:8px;border:1px solid;white-space:nowrap;align-self:flex-start}
.jn-c i{display:inline-block;width:11px;height:11px;border-radius:2px}
.jn-c.L{color:var(--v-cert);border-color:var(--v-cert);background:var(--v-cert-soft)}.jn-c.L i{background:var(--v-cert)}
.jn-c.V{color:var(--witness);border-color:var(--witness);background:var(--witness-soft)}.jn-c.V i{border:1.5px solid var(--witness);background:linear-gradient(45deg,transparent 42%,var(--witness) 42% 58%,transparent 58%),linear-gradient(-45deg,transparent 42%,var(--witness) 42% 58%,transparent 58%)}
.jn-c.I{color:var(--ink-2);border-color:var(--ink-3);background:var(--surface2)}.jn-c.I i{border:1px solid var(--ink-2);background:repeating-linear-gradient(135deg,var(--ink-2) 0 1px,transparent 1px 3px)}
.jn-c.S{color:var(--v-refd);border-color:var(--v-refd);background:var(--v-refd-soft)}.jn-c.S i{background:radial-gradient(circle,var(--v-refd) 1px,transparent 1.2px) 0 0/3.5px 3.5px}
.gl{font-family:var(--f-mono);font-size:11px;color:var(--ink-3);margin-top:8px;max-width:27ch;line-height:1.4}
.shot{display:block;border:1px solid var(--rule-strong);border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,.45)}
.shot.ph{border-radius:22px}
.split{display:grid;grid-template-columns:1.62fr 1fr;gap:34px;align-items:start}
.split2{display:grid;grid-template-columns:300px 1fr;gap:40px;align-items:start}
.pts{display:flex;flex-direction:column;gap:14px}
.pt{border-left:2px solid var(--rule-strong);padding:2px 0 2px 16px}
.pt b{display:block;font-size:17px;margin-bottom:3px}
.pt p{font-size:14.5px;line-height:1.45}
.ph-empty,.fl-empty{display:flex;align-items:center;justify-content:center;border:1px dashed var(--rule-strong);border-radius:12px;color:var(--ink-4);font-family:var(--f-mono);font-size:12px}
.fl-empty{height:420px}.ph-empty{height:510px}
.qt{font-style:italic;color:var(--ink-3);font-size:14px;line-height:1.5;border-left:2px solid var(--ink-4);padding-left:14px}
td.n,th.n{text-align:right;font-family:var(--f-mono)}
.sm td{padding:9px 12px;font-size:13.5px}.sm th{padding:8px 12px}
`;
}

const CHIP = { L: 'CLEARED', V: 'BLOCKED', I: 'UNDECIDED', S: 'NEEDS DATA' };
const chip = (k) => '<span class="jn-c ' + k + '"><i></i>' + CHIP[k] + '</span>';
const GLOSS = { L: 'every limit holds at the measured band\'s unfavourable edge, at every step of the window', V: 'a limit fails even at the favourable edge; it comes with the witness: the hour and the variable',
  I: 'the band straddles the limit; it comes with the threshold that would flip the decision', S: 'the rule limits what nobody forecasts there (current, visibility), and says what' };

function build(N, shots) {
  const F = facts(N), U = USES.cases('en'), S_ = [];
  const ft = (n) => '<div class="ft"><span>JANELA · carlostoledo.co/janela</span><span>the operational window, decided · ' + esc(F.month) + '</span><span>' + n + '/12</span></div>';
  const img = (k, cls, w) => shots && shots[k] ? '<img class="shot ' + cls + '" style="width:' + w + 'px" src="data:image/png;base64,' + shots[k] + '" alt="">' : '<div class="' + (k === 'card' ? 'ph-empty' : 'fl-empty') + '">the app</div>';
  const H = F.H, broke = pct(H.broke, H.liberada, 2), eBroke = pct(H.eBroke, H.eLiberada, 2), cov = en.dec((100 * H.coverage).toFixed(1)) + '%';
  const since = ym(H.from);

  /* 1 · cover */
  S_.push('<section class="s"><div class="ey">Janela · offshore energy · operational windows</div>'
    + '<div class="cover"><div><h1>The window for every offshore operation, decided.</h1>'
    + '<p style="margin-top:26px;max-width:46ch">For Brazil\'s ' + F.units + ' offshore production units: the next seven days of sea against your operation\'s limit — offloading, cargo, line laying, lifting, the Harbour Master\'s rule — over a forecast whose error was measured by satellite. Every decision comes out with its reason, and whoever checks it redoes it.</p></div>'
    + '<div class="card core"><div class="k">what is already measured</div><div class="big">' + broke + '</div>'
    + '<p style="font-size:16px">of the CLEARED windows with Hs ≤ 2 m that the sea broke, in ' + en.int(H.pairs) + ' satellite comparisons the band never saw (since ' + since + '): <b>' + en.int(H.broke) + ' of ' + en.int(H.liberada) + '</b>.</p>'
    + '<p style="font-size:14px">With a single provider\'s band (ECMWF), in the same test: ' + eBroke + '. The band that decides covers ' + cov + ' of what the satellite saw; it claims 90%.</p></div></div>'
    + '<div class="row" style="margin-top:auto;margin-bottom:34px;gap:22px">' + ['L', 'V', 'I', 'S'].map((k) => '<div>' + chip(k) + '<div class="gl">' + esc(GLOSS[k]) + '</div></div>').join('') + '</div>' + ft(1) + '</section>');

  /* 2 · the problem */
  S_.push('<section class="s"><div class="ey">1 · the problem</div><h2>A forecast is a number; an operation needs a decision it can defend.</h2><div class="col3">'
    + '<div class="card claim"><div class="k">2.4 m forecast, 2.5 m limit</div><p>A forecast without its error measured at the site does not say whether the window fits. Whoever decides rounds out of caution or out of haste — and a broken window can cost a vessel, while a missed one costs day rate and tank space.</p></div>'
    + '<div class="card claim"><div class="k">DNV\'s α closes windows</div><p>Table 4-1 (DNV-OS-H101), calibrated in the North Sea, shrinks the forecast limit. In Santos, Hs ≤ 2.0 m for 48 h: the sea opens <b>' + F.work.sea + '</b> of the starts; the table leaves <b>' + F.work.tab + '</b>.</p></div>'
    + '<div class="card claim"><div class="k">the paperwork</div><p>Marine warranty, the insurer and HSE ask for the weather argument in writing. No provider publishes its own scoreboard against what the sea did.</p></div>'
    + '</div><p class="qt" style="margin-top:28px">“' + esc(F.b704.split(' Guidance note')[0]) + '” — DNV-OS-H101, Section 4, B704. The standard already asks for the site\'s error; nobody measures it.</p>' + ft(2) + '</section>');

  /* 3 · the product */
  S_.push('<section class="s"><div class="ey">2 · the product</div><h2 style="font-size:36px;margin-bottom:22px">The fleet on the map, the answer first.</h2><div class="split">'
    + '<div>' + img('fleet', '', 690) + '</div><div class="pts">'
    + '<div class="pt"><b>The answer before the chart</b><p>How many units can start the operation at the chosen hour, and which cannot, by name.</p></div>'
    + '<div class="pt"><b>The fleet board</b><p>Every unit against the week\'s 29 starts, by basin or by smallest margin, linked to the map; it exports as a spreadsheet (CSV).</p></div>'
    + '<div class="pt"><b>Four verdicts, always with the word</b><p>Shape and word, never colour alone: CLEARED, BLOCKED with the witness, UNDECIDED with the threshold, NEEDS DATA with what is missing.</p></div>'
    + '<div class="pt"><b>Three criteria side by side</b><p>The measured band, DNV\'s Table 4-1 and the site\'s α, for the same window.</p></div>'
    + '<div class="pt"><b>Redone in your browser</b><p>' + (F.day ? 'The day\'s ' + en.int(F.day.decisions) + ' published decisions' : 'Every published decision of the day') + ', re-decided in the tab by the same pinned modules, in seconds, and compared with the record.</p></div>'
    + '</div></div>' + ft(3) + '</section>');

  /* 4 · who it is for */
  S_.push('<section class="s"><div class="ey">3 · who it is for</div><h2 style="font-size:36px">Six decisions, and each one\'s door into the app.</h2><table class="sm"><thead><tr><th>who</th><th>the question</th><th>what they leave with</th><th>horizon</th></tr></thead><tbody>'
    + U.map((u) => '<tr><td>' + esc(u.who) + '</td><td>' + esc(u.q) + '</td><td>' + esc(u.gets) + '</td><td>' + esc(u.n.split(' · ')[1] || u.n) + '</td></tr>').join('')
    + '</tbody></table>' + ft(4) + '</section>');

  /* 5 · one decision, inside */
  S_.push('<section class="s"><div class="ey">4 · one decision, inside</div><div class="split2"><div>' + img('card', 'ph', 262) + '</div><div>'
    + '<h2 style="font-size:34px">Every verdict with its reason, its margin and the paperwork to redo it.</h2><div class="pts">'
    + '<div class="pt"><b>The next window and its margin</b><p>When to start, until when, and how far the unfavourable edge sits from the limit — the margin rounded down, never overstated.</p></div>'
    + '<div class="pt"><b>CRITICAL OFFLOADING, with your numbers</b><p>Storage, inventory and production typed in stay in the browser; Janela puts “tanks full in X h” beside the next offloading window and warns when it opens too late.</p></div>'
    + '<div class="pt"><b>The cost of waiting</b><p>At your day rate — Janela never invents a day rate — until the next CLEARED window.</p></div>'
    + '<div class="pt"><b>Decision note and .json certificate</b><p>The rule cited with its act and page, the run, the band, the sha256 of every module and record, and the commands to redo it by hand.</p></div>'
    + '</div></div></div>' + ft(5) + '</section>');

  /* 6 · the measured band */
  S_.push('<section class="s"><div class="ey">5 · the measured band</div><h2>The forecast with its error measured by satellite, per site and lead time.</h2><div class="col3">'
    + '<div class="card"><div class="k">the archive</div><div class="big">' + en.int(F.ecmwfPairs) + '</div><p>ECMWF forecast × satellite altimeter pairs at ' + F.mainSites + ' sites, 2023–2026; plus ' + en.int(F.noaaPairs) + ' from NOAA WAVEWATCH III. A band calibrated per site and lead time, claiming 9 in 10.</p></div>'
    + '<div class="card"><div class="k">out of sample</div><div class="big">' + cov + '</div><p>coverage in ' + en.int(H.pairs) + ' comparisons since ' + since + ', which no band saw in calibration.</p></div>'
    + '<div class="card core"><div class="k">the decision that counts</div><div class="big">' + broke + '</div><p>of the CLEARED windows with Hs ≤ 2 m broken by the sea (' + en.int(H.broke) + ' of ' + en.int(H.liberada) + '); with ECMWF alone, ' + eBroke + ' (' + en.int(H.eBroke) + ' of ' + en.int(H.eLiberada) + ').</p></div>'
    + '</div><p style="margin-top:22px;font-size:16px">Two providers, ECMWF and NOAA: the <b>union</b> of the two calibrated bands decides, and it covers whenever either one covers — chosen by measurement, before deciding. The raw ensembles are shown and scored; they never decide.</p>'
    + (F.aifs ? '<p style="margin-top:10px;font-size:14px">A third, ECMWF\'s AI model (AIFS, open data since May 2026), was measured by the same rule, written beforehand: in ' + en.int(F.aifs.test) + ' comparisons after ' + en.date(F.aifs.from) + ', the union IFS ∪ AIFS cleared ' + en.int(F.aifs.ea.liberada) + ' with ' + en.int(F.aifs.ea.brokeLiberada) + ' broken; IFS ∪ NOAA, ' + en.int(F.aifs.en.liberada) + ' with ' + en.int(F.aifs.en.brokeLiberada) + '. No measured difference where it matters first — it is scored every day and does not decide yet.</p>' : '') + ft(6) + '</section>');

  /* 7 · the site alpha */
  const A = F.alpha;
  S_.push('<section class="s"><div class="ey">6 · the site\'s α</div><h2>Over the offshore basins, the measured α sits above the North Sea table in every cell.</h2><div class="col3">'
    + '<div class="card"><div class="k">the method, calibrated first</div><div class="big">' + A.cal.within + ' of ' + A.cal.of + '</div><p>Table 4-1 cells reproduced (±0.02) by the method that made the table, before looking at Brazil.</p></div>'
    + '<div class="card core"><div class="k">design Hs 2 m · ' + A.basins + ' offshore sites</div><div class="big">' + d2(A.lo) + '–' + d2(A.hi) + '</div><p>the site\'s α, against ' + d2(A.tLo) + '–' + d2(A.tHi) + ' in the table; the 90% interval sits above the table in ' + A.above + ' of ' + A.n + ' cells.</p></div>'
    + '<div class="card"><div class="k">Santos · Hs ≤ 2.0 m · 48 h</div><table class="sm" style="font-size:14px"><tbody><tr><td>the sea allows</td><td class="n">' + F.work.sea + '</td></tr><tr><td>Table 4-1 (α ' + en.dec(F.work.aT) + ')</td><td class="n">' + F.work.tab + '</td></tr><tr><td>the site\'s α (' + en.dec(F.work.aS) + ')</td><td class="n">' + F.work.loc + '</td></tr></tbody></table><p style="font-size:13px">of operation starts, ' + F.work.from + '–' + F.work.to + ', counted exactly.</p></div>'
    + '</div><p style="margin-top:22px;font-size:15px">A statistical estimate (90% interval, resampled by day), used at its lower bound; the standard\'s 1-in-10,000 tail is a model extrapolation. On the coast (Florianópolis) and in Sergipe-Alagoas the site\'s α sits at or below the table — and Janela says that too. Evidence for the surveyor to redo, never an approval.</p>' + ft(7) + '</section>');

  /* 8 · the campaign */
  S_.push('<section class="s"><div class="ey">7 · the campaign</div><h2>Ten 48 h line-laying operations in Santos from 1 November: how many vessel days?</h2>'
    + '<table><thead><tr><th>criterion</th><th class="n">half the years</th><th class="n">9 in 10</th><th class="n">the worst year</th></tr></thead><tbody>'
    + F.camp.map((r) => '<tr><td>' + esc(r.k) + '</td><td class="n"><b>' + r.q50 + ' days</b></td><td class="n">' + r.q90 + '</td><td class="n">' + r.worst + (r.wy ? ' (' + r.wy + ')' : '') + '</td></tr>').join('')
    + '</tbody></table><p style="margin-top:24px">Each of the ' + (F.camp[0].fin + F.camp[0].cen) + ' hindcast years runs the campaign: the first window after 1 November, the operation takes the window, the next one is sought from its end. The quantiles are exact order statistics of the years that finish' + (F.camp.some((r) => r.cen) ? ' (' + F.camp.filter((r) => r.cen).map((r) => r.cen + (r.cen === 1 ? ' year' : ' years') + ' in the row “' + r.k.split(' (')[0] + '”').join(' and ') + ' did not finish before the record ends: counted, left out)' : '') + '. <b>The distance between the table and the site\'s α, in vessel days, is the argument the surveyor weighs.</b></p>'
    + '<p style="margin-top:12px;font-size:14px">No transit or mobilisation wait; a hindcast (Ifremer WAVEWATCH III) is a model\'s past sea, and the count is exact over it' + (F.pnb ? ' — and the hindcast was checked against ' + F.pnb.deployments + ' deployments of the Brazilian Navy\'s buoys (PNBOIA, ' + F.pnb.from + '–' + F.pnb.to + ', ' + en.int(F.pnb.pairs) + ' pairs): time with Hs ≤ 2.0 m, buoys ' + F.pnb.b20 + ', hindcast ' + F.pnb.h20 + '; below 1.5 m the hindcast is conservative (' + F.pnb.h15 + ' against ' + F.pnb.b15 + ')' : '') + '. In the app: any area, limit, window, number of operations and month.</p>' + ft(8) + '</section>');

  /* 9 · why trust it */
  const sec = F.day && F.day.second;
  S_.push('<section class="s"><div class="ey">8 · why trust it</div><h2>Trust you can check, not trust you are asked for.</h2><div class="col2" style="gap:22px">'
    + '<div class="pt"><b>Exact arithmetic</b><p>Every verdict is decided in rationals on the limit as printed; the published band is rounded outward, so CLEARED and BLOCKED hold on the exact one.</p></div>'
    + '<div class="pt"><b>Redone in the reader\'s browser</b><p>The modules that decide ship inside the page, pinned by sha256; the tab redoes every published decision of the day and compares it with the record.</p></div>'
    + '<div class="pt"><b>A second checker</b><p>Written from the specification without reading the first (Python, no code in common)' + (sec ? ': ' + en.int(sec.equal) + ' of ' + en.int(sec.decisions) + ' decisions equal' : '') + '. The build refuses a day on which the two disagree.</p></div>'
    + '<div class="pt"><b>A public scoreboard</b><p>' + en.int(N.ledger.commits) + ' bands committed before the target hour since ' + en.date(N.ledger.first) + ', scored by satellite; the rule that prunes a band was dated before the first datum. The record only grows.</p></div>'
    + '<div class="pt"><b>Pinned inputs</b><p>The forecast, the bands, the Harbour Masters\' local rules (NPCPs) and DNV\'s table enter by sha256; the decision note says which commit made the day and how to redo it.</p></div>'
    + '<div class="pt"><b>What is said, and what is not</b><p>The band is decided at the forecast steps, at the model node — not the sea between steps, not the berth, not a probability.</p></div>'
    + '</div>' + ft(9) + '</section>');

  /* 10 · coverage and sources */
  S_.push('<section class="s"><div class="ey">9 · coverage and sources</div><h2>The whole Brazilian margin, on data free for commercial use.</h2><div class="col3">'
    + '<div class="card"><div class="k">where</div><div class="big">' + F.units + '</div><p>ANP offshore production units (FPSO, FSO, platforms), each with the band of the nearest measured site; ' + F.sites + ' sites measured against satellite, from Pelotas to Foz do Amazonas.</p></div>'
    + '<div class="card"><div class="k">the rules</div><div class="big">' + F.rules + '</div><p>published limits from ' + F.acts + ' acts of the Maritime Authority (NPCPs, the Harbour Masters\' local rules, and ordinances), with page and literal quote; the offloading criterion cited (OMAE2010-20147); DNV\'s Table 4-1.</p></div>'
    + '<div class="card"><div class="k">the data</div><p style="font-size:15px">ECMWF open data (CC BY 4.0) · NOAA WAVEWATCH III (public domain) · NOAA altimetry (public domain) · Copernicus Marine currents (shown, not yet decided) · Ifremer hindcast (CC BY-SA 4.0) · ANP GeoMaps.</p></div>'
    + '</div><p style="margin-top:22px;font-size:15px">Collected automatically every day; each day published with the commit that made it. Janela runs in the browser: no number you type (inventory, day rate, limit) leaves it.</p>' + ft(10) + '</section>');

  /* 11 · honest limits */
  S_.push('<section class="s"><div class="ey">10 · what Janela does not say</div><h2>The limits, stated before anyone asks.</h2><ul style="font-size:17px">'
    + '<li><b>It is not an approval of an operation.</b> Marine warranty and the class societies own that word; Janela is evidence a surveyor redoes.</li>'
    + '<li><b>The model node, not the berth.</b> At a terminal, the forecast is the open sea of the approach: wave limits at the berth stay NEEDS DATA until a coastal transfer exists.</li>'
    + '<li><b>Current and visibility do not decide.</b> The current is shown and is being measured against observation; a rule that limits it stays NEEDS DATA, and says what would close it.</li>'
    + '<li><b>The site\'s α is an estimate;</b> the standard\'s 1-in-10,000 tail is an extrapolation. In Sergipe-Alagoas the band tends to be conservative (the satellite sees the sea 40–100 km off the coast).</li>'
    + '<li><b>The forward scoreboard is just starting:</b> the first bands are scored three days after each day closes; the first admission reading comes with 30 trial days.</li>'
    + '<li><b>The cargo, line-laying and lifting limits are examples</b> and say so; the offloading one is cited. Use your procedure\'s.</li>'
    + '</ul>' + ft(11) + '</section>');

  /* 12 · the next step */
  S_.push('<section class="s"><div class="ey">11 · the next step</div><h2>A pilot on your operations, judged by its own scoreboard.</h2><div class="col3">'
    + '<div class="card"><div class="k">we ask for</div><ul style="font-size:15px"><li>one operation (offloading, PSV cargo, a campaign)</li><li>your procedure\'s limits</li><li>the units and an operations contact</li><li>if there is one, the weather-downtime log, to compare</li></ul></div>'
    + '<div class="card"><div class="k">we deliver</div><ul style="font-size:15px"><li>the daily windows for those units, with a decision note</li><li>the decisions checked by satellite, on the scoreboard</li><li>the site\'s α argument, for the surveyor to redo</li><li>all of it re-runnable, with the code open</li></ul></div>'
    + '<div class="card core"><div class="k">contact</div><p><b>Carlos Toledo</b></p><p>carlos@carlostoledo.co</p><p>carlostoledo.co/janela</p><p style="font-size:13px">the method: carlostoledo.co/janela/metodo</p></div>'
    + '</div><p style="margin-top:22px;font-size:13px;color:var(--ink-4)">Re-runnable evidence about a window — not an approval of an operation nor a class certification; it does not replace the procedure or the responsibility of whoever signs. The numbers in this document are read from the repository\'s records at the moment it was generated.</p>' + ft(12) + '</section>');

  need(S_.length === 12, 'expected 12 slides, built ' + S_.length);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Janela — the deck</title>'
    + '<link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css() + '</style></head><body>' + S_.join('\n') + '</body></html>';
}

/* ---- the two pictures, from the built app, through a local server (the app's own loader, its own data) ---- */
function serve() {
  const SITE = path.join(ROOT, 'site');
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.bin': 'application/octet-stream', '.i16': 'application/octet-stream' };
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let f = path.join(SITE, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(SITE)) { rsp.writeHead(400); rsp.end(); return; }
      try { if (fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); } catch (e) { /* 404 below */ }
      fs.readFile(f, (err, b) => { if (err) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); rsp.end(b); });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}
async function shots() {
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const srv = await serve(), base = 'http://127.0.0.1:' + srv.address().port + '/janela/';
  const out = {};
  try {
    await withChrome(async (send) => {
      await send('Page.enable'); await send('Runtime.enable');
      const go = async (url, w, h, scale, mobile, ev) => {
        await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile });
        await send('Page.navigate', { url: 'about:blank' }); await settle(300);
        await send('Page.navigate', { url });
        await settle(7000);                                                   /* real wait: the data, the map, the tab's re-check */
        const ok = await send('Runtime.evaluate', { expression: '!!(window.__janela && window.__janela.check && window.__janela.check.ok)', returnByValue: true });
        if (!ok.result.value) throw new Error('the app did not re-check its day in the tab before the screenshot (' + url + ')');
        if (ev) { await send('Runtime.evaluate', { expression: ev }); await settle(1500); }
        return (await send('Page.captureScreenshot', { format: 'png' })).data;
      };
      out.fleet = await go(base + '#op=alivio&modo=semana', 1440, 900, 1, false, "var t=document.getElementById('jn-introt');if(t.getAttribute('aria-expanded')==='true')t.click()");
      out.card = await go(base + '#site=uep-12446&op=alivio&modo=semana', 390, 760, 2, true, "window.__janela.setSheet('full');document.getElementById('jn-scroll').scrollTop=document.getElementById('jn-card').offsetTop-4");
    }, { port: 9243 });
  } finally { srv.close(); }
  return out;
}

/* ---- the link-preview card (site/janela/og.png, 1200x630): the same words as slide 1, the app's own picture ---- */
function ogHtml(N, shots) {
  const F = facts(N);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="' + T.GOOGLE_FONTS + '"><style>' + css()
    + 'html,body{width:1200px;height:630px;overflow:hidden}.og{width:1200px;height:630px;display:grid;grid-template-columns:520px 1fr;gap:0;background:var(--paper)}'
    + '.og .t{padding:56px 22px 44px 56px;display:flex;flex-direction:column;gap:22px}.og h1{font-size:52px;max-width:none}.og p{font-size:19px}'
    + '.og .pic{position:relative;overflow:hidden;border-left:1px solid var(--rule)}.og .pic img{position:absolute;right:0;top:0;height:630px}'
    + '.og .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}.og .jn-c{font-size:11px;padding:.4em .6em;gap:6px}.og .u{font-family:var(--f-mono);font-size:13px;letter-spacing:.14em;color:var(--ink-4);text-transform:uppercase}</style></head><body>'
    + '<div class="og"><div class="t"><div class="u">Janela · offshore energy</div><h1>The window for every offshore operation, decided.</h1>'
    + '<p>' + F.units + ' production units · a forecast with its error measured by satellite · your operation\'s limit</p>'
    + '<div class="chips">' + ['L', 'V', 'I', 'S'].map(chip).join('') + '</div></div>'
    + '<div class="pic">' + (shots && shots.fleet ? '<img src="data:image/png;base64,' + shots.fleet + '" alt="">' : '') + '</div></div></body></html>';
}
async function snap(html, w, h) {
  const os = require('os');
  const { withChrome, settle } = require(path.join(ROOT, 'design', 'cdp.js'));
  const tmp = path.join(os.tmpdir(), 'janela-og-' + process.pid + '.html');
  fs.writeFileSync(tmp, html);
  try {
    return await withChrome(async (send) => {
      await send('Page.enable');
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
      await send('Page.navigate', { url: 'file://' + tmp });
      await settle(3000);                                                    /* real wait: fonts */
      return Buffer.from((await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } })).data, 'base64');
    }, { port: 9244 });
  } finally { fs.unlinkSync(tmp); }
}
const og = (N, shots) => snap(ogHtml(N, shots), 1200, 630);

module.exports = { build, shots, print: CP.print, facts, og };
