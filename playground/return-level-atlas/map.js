/* map.js — site/instruments/return-level-atlas/map/: the atlas as a flat map, in the apps' product look.
   playground/return-level-atlas/ · cert-machine · 2026-10-29

   WHY A SECOND VIEW. Pedro Guimarães (UFSC LabECO, extreme values of Hs for a Petrobras/ANP contract) says the data
   and the figures are among the most painful parts of that work: everyone fits their own marginal model, and nobody
   can see what the choice of model does to the number. The globe answers the paper; this page answers the engineer.
   One question at a time — the design wave, 100 or 1000 years, on daily, weekly or monthly maxima — on an EQUAL-AREA
   flat map (Equal Earth, drawn by the page itself: no library, no tiles), and a card per cell in product words: the
   design wave as the ledger decides it, the six families side by side (their spread IS the model uncertainty Pedro
   describes), whether the decided family survives the other criteria and blocks, the statistical width another 32
   years could give, and, one click down, what the number rests on and the cell's certificate on the globe.

   ONE LEDGER, ONE SET OF RULES. The map reads the globe's own data (../atlas.json and ../land.json, the same bytes)
   and draws by the globe's own rules (shared.js: the row's decoding, the cell's square, the ramp, the refusal of a
   level, outward centimetres). Its one file of its own, cells.json, carries what the globe's rows do not: each of the
   six families' levels, rounded outward to the centimetre by shared.js cmOut; each family's refusal by the ledger's
   codes (instruments/hseva/atlas.js codes); the reason Anderson–Darling decides no family, re-derived by THE rank rule
   (instruments/hseva/fit.js rankRule) from the ledger's own enclosures — and the build refuses where that rule does
   not give the ledger's choice back.

   EVERY NUMBER FROM A RECORD. Each number this builder types into the page goes through N() with the record it came
   from; afterwards every digit in the page's visible text must be one N() gave, or the build refuses (WARRANT rule 8).
   The tab's numbers are the data's, rounded by shared.js. The words are English (the operator, 2026-10-30: no more
   pt-BR pages; the Portuguese half and its PT/EN switch were dropped).                                          MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { renderApp } = require(path.join(ROOT, 'design', 'app-shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const SH = require(path.join(HERE, 'shared.js'));
const AT = require(path.join(ROOT, 'instruments', 'hseva', 'atlas.js'));
const FT = require(path.join(ROOT, 'instruments', 'hseva', 'fit.js'));
const { PAPER_SIX } = require(path.join(ROOT, 'instruments', 'hseva', 'families.js'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const die = (m) => { throw new Error('return-level-atlas map: ' + m); };
const REPO = 'carlostoledo1891/cert-machine';
const BLK = SH.BLK;
const fin2 = (q) => Array.isArray(q) && q.length === 2 && q.every((x) => typeof x === 'number' && Number.isFinite(x));

/* the report's thirteen nodes in product words; a node the ledger names and this list does not refuses the build */
const PLACE = {
  'foz-amazonas': 'Equatorial margin · Foz do Amazonas',
  potiguar: 'Equatorial margin · Potiguar',
  'espirito-santo': 'Espírito Santo Basin',
  campos: 'Campos Basin',
  santos: 'Santos Basin',
  pelotas: 'Pelotas Basin',
  'north-atlantic': 'North Atlantic',
  'south-of-japan': 'South of Japan',
  'arabian-sea': 'Arabian Sea',
  'subantarctic-north': 'Northern sub-Antarctic',
  'acc-central': 'Antarctic Circumpolar Current',
  drake: 'Drake Passage',
  'southern-high': 'Higher southern latitudes',
};
/* a count the prose writes as a word: only the counts listed here, so a ledger with another count refuses the build */
const WORD = { 3: 'three', 4: 'four', 6: 'six' };

/* ---- the six families at one cell and block, from the ledger ---- */
/* a family's state: [lo100, hi100, lo1000, hi1000] in whole centimetres, outward (an end null where the level has no
   enclosure), or a code: e — the generalized gamma's likelihood proved highest at its lognormal limit; k — the
   exponentiated Weibull's climb runs toward k → 0 (its Fréchet corner); s — past α = 10⁴ and not certified in its
   Gumbel coordinates; b — another climb stopped at its family's edge; r — refused otherwise (the codes are the
   ledger's, read through atlas.js codes() for the two hard families) */
function famState(f, B) {
  const F = B.fits[f];
  if (!F.c) {
    if (F.e) return 'e';
    if (f === 'expweibull') { const ew = AT.codes(B).ew; return ew === 1 ? 'k' : ew === 4 ? 's' : 'r'; }
    return F.s ? 'b' : 'r';
  }
  const a = SH.cmOut(F.l100), z = SH.cmOut(F.l1000);
  return [a ? a[0] : null, a ? a[1] : null, z ? z[0] : null, z ? z[1] : null];
}
/* THE RANK RULE, run again over the ledger's own enclosures (fit.js rankRule — the one place it lives). The ledger
   prints each enclosure outward to eight figures, which can only widen it: so a choice the ledger REFUSED must come back
   REFUSED (its reason is what the card says), and a choice it DECIDED must come back with the same family first. */
function rankAgain(B) {
  const entries = PAPER_SIX.map((f) => {
    const F = B.fits[f];
    if (!F.c) return { family: f, refused: true, edge: !!F.e };
    if (F.crit) return { family: f, unstated: ['ad', 'ks', 'mse', 'chi2'] };
    return { family: f, ad: F.ad, ks: F.ks, mse: F.mse, chi2: Array.isArray(F.chi2) ? F.chi2 : undefined, chi2Refused: F.chi2 === 'R', unstated: F.ad ? [] : ['ad'] };
  });
  return FT.rankRule(entries, 'ad');
}
const FI = (f) => { const k = PAPER_SIX.indexOf(f); if (k < 0) die('a family the ledger does not hold: ' + f); return k; };
function whyOf(r) {
  const w = String(r.why || '');
  let m = /^no certified fit for (.+) — /.exec(w);
  if (m) return ['b', m[1].split(', ').map(FI)];
  m = /^the statistic could not be enclosed for (.+)$/.exec(w);
  if (m) return ['u', m[1].split(', ').map(FI)];
  if (w === 'enclosures overlap' && r.best) return ['t', [FI(r.best)].concat((r.tied || []).map(FI))];
  if (w === 'no family has the statistic') return ['n', []];
  die('a refusal of the rank rule this page has no words for: ' + w);
}

function build(dir, ctx) {
  const { L, M } = ctx, cells = ctx.cells;
  const sea = cells.filter((c) => c.status === 'sea'), ice = cells.filter((c) => c.status === 'ice');
  if (JSON.stringify(L.families) !== JSON.stringify(PAPER_SIX)) die('the ledger\'s families are not the paper\'s six in its order');
  if (JSON.stringify(L.blocks) !== JSON.stringify(BLK)) die('the ledger\'s blocks are not ' + BLK.join(', '));
  const periods = L.returnPeriods;
  if (!(Array.isArray(periods) && periods.length === 2 && periods.every((T) => Number.isInteger(T) && T > 0))) die('the ledger names no two return periods');

  /* ---- the cells' own file: the six families, the refusal's reason, the statistical interval ---- */
  const out = {}, nBlock = {};
  let echoed = 0, widened = 0;
  for (const c of sea) {
    const st = (L.stat && L.stat.cells && L.stat.cells[c.id]) || {};
    out[c.id] = BLK.map((blk) => {
      const B = c.blocks[blk];
      if (nBlock[blk] === undefined) nBlock[blk] = B.n; else if (nBlock[blk] !== B.n) die(c.id + ' ' + blk + ': ' + B.n + ' maxima where the other cells have ' + nBlock[blk]);
      const fams = PAPER_SIX.map((f) => famState(f, B));
      const r = rankAgain(B);
      let why = null;
      if (B.rank.ad === 'R') {
        if (r.verdict !== 'REFUSED') die(c.id + ' ' + blk + ': the ledger refuses the choice, and the rank rule over its enclosures decides ' + r.best);
        why = whyOf(r);
      } else {
        if (r.best !== B.rank.ad) die(c.id + ' ' + blk + ': the ledger decides ' + B.rank.ad + ', the rank rule over its enclosures puts ' + r.best + ' first');
        if (r.verdict === 'DECIDED') echoed++; else widened++;
        /* the decided family's level is the globe's: the card and the map's fill must agree on whether it exists */
        const s = fams[FI(B.rank.ad)];
        for (const [k, T] of [[0, 100], [2, 1000]]) if ((s[k] !== null) !== fin2(B.fits[B.rank.ad]['l' + T])) die(c.id + ' ' + blk + ': the ' + T + '-year level and its centimetres disagree');
      }
      const S = st[blk], stat = S && B.rank.ad !== 'R' && S.f === B.rank.ad ? [SH.cmOut(S.l100), SH.cmOut(S.l1000)] : null;
      return [fams, why, stat ? [stat[0] ? stat[0][0] : null, stat[0] ? stat[0][1] : null, stat[1] ? stat[1][0] : null, stat[1] ? stat[1][1] : null] : null];
    });
  }
  const cellsJson = JSON.stringify({ generated: L.generated, fam: PAPER_SIX, blocks: BLK, periods, cells: out });

  /* ---- the report's nodes, the places of the list; the Brazilian margin is the 1° lattice's own extent ---- */
  const br = cells.filter((c) => c.sets.includes('brazil1'));
  if (!br.length) die('no cell of the 1° lattice');
  const ext = { lat: [Math.min(...br.map((c) => c.lat)), Math.max(...br.map((c) => c.lat))], lon: [Math.min(...br.map((c) => c.lon)), Math.max(...br.map((c) => c.lon))] };
  const P = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'ww3-points', 'points.json'), 'utf8')).points;
  const places = cells.filter((c) => c.sets.some((s) => /^report:/.test(s))).map((c) => {
    const name = c.sets.find((s) => /^report:/.test(s)).slice('report:'.length);
    if (!PLACE[name]) die('the report node ' + name + ' has no words on the map');
    if (!P.some((q) => q.name === name && q.lat === c.lat && q.lon === c.lon)) die('the report node ' + name + ' is not where corpus/ww3-points puts it');
    const margin = c.lat >= ext.lat[0] && c.lat <= ext.lat[1] && c.lon >= ext.lon[0] && c.lon <= ext.lon[1];
    return { id: c.id, name, label: PLACE[name], margin };
  });
  places.sort((a, b) => (b.margin - a.margin) || (byId(b.id).lat - byId(a.id).lat));
  function byId(id) { return cells.find((c) => c.id === id); }

  /* ---- what the hindcast was compared with (certs/janela-pnboia-check.json): the Navy's buoys, all sea states ---- */
  const pnb = (() => {
    const f = path.join(ROOT, 'certs', 'janela-pnboia-check.json');
    if (!fs.existsSync(f)) return null;
    const R = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (!R.sources || !/GLOBMULTI_ERA5_GLOBCUR_01/.test(R.sources.hindcast || '') || R.sources.hindcast.indexOf(M.dataset.name) < 0) die('certs/janela-pnboia-check.json does not compare this hindcast');
    const B = R.buoys.filter((b) => b.pairs > 0 && Number.isFinite(b.biasHindcastMinusBuoy) && Number.isFinite(b.rms));
    if (!B.length) die('certs/janela-pnboia-check.json holds no buoy with pairs');
    const bias = B.map((b) => b.biasHindcastMinusBuoy), rms = B.map((b) => b.rms);
    /* D10: each range is computed from every kept buoy's cell; a name holds a space, so the address is by index */
    const cellsOf = (field) => B.map((b) => 'certs/janela-pnboia-check.json#/buoys/' + R.buoys.indexOf(b) + '/' + field);
    const nodes = new Set(B.map((b) => b.node.join(','))).size;
    /* a buoy node that IS an atlas cell: the comparison at that cell itself */
    const at = {};
    for (const b of B) { const c = sea.find((q) => q.lat === b.node[0] && q.lon === b.node[1]); if (c) (at[c.id] = at[c.id] || []).push({ buoy: b.buoy, pairs: b.pairs, from: b.from, to: b.to, bias: b.biasHindcastMinusBuoy, rms: b.rms }); }
    return { buoys: B.length, nodes, pairs: B.reduce((a, b) => a + b.pairs, 0), from: B.map((b) => b.from).sort()[0].slice(0, 4), to: B.map((b) => b.to).sort().slice(-1)[0].slice(0, 4),
      bias: [Math.floor(Math.min(...bias) * 100), Math.ceil(Math.max(...bias) * 100)], rms: [Math.floor(Math.min(...rms) * 100), Math.ceil(Math.max(...rms) * 100)], at,
      biasFrom: cellsOf('biasHindcastMinusBuoy'), rmsFrom: cellsOf('rms') };
  })();

  /* ---- the premise grades, each from its record (WARRANT v2.1 rule 12) ---- */
  /* the fits: VERIFIED — the certifier's code reproduces cases with known answers (closed forms, 50-digit values) in
     instruments/hseva/battery.js, and the ledger records that code by sha256 */
  const battery = fs.readFileSync(path.join(ROOT, 'instruments', 'hseva', 'battery.js'), 'utf8');
  if (!/calibrated on\s+cases with known answers/.test(battery) || !/closed forms/.test(battery) || !/50-digit values/.test(battery)) die('instruments/hseva/battery.js no longer calibrates the fits on known answers: the fits cannot be graded verified');
  if (!L.code || !L.code['instruments/hseva/fit.js']) die('the atlas ledger does not record the fit code by sha256');
  /* the statistical layer's level, from its own description */
  const lvl = /the (\d+)% intervals of the delta method/.exec((L.stat && L.stat.what) || '');
  if (!lvl) die('the statistical layer does not say the level of its intervals');
  /* the paper and the data, as the records name them */
  const paper = /^The return-level atlas: the method of ([^(]+)\(Ocean Engineering (\d+), (\d{4}), (\d+)\)/.exec(L.what || '');
  if (!paper) die('the ledger no longer names the paper it follows');
  const first = M.first, last = M.last, years = M.days / 365.25;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(first) || !/^\d{4}-\d{2}-\d{2}$/.test(last) || !(years > 1)) die('the corpus does not give its first day, last day and length');
  const lat4 = /^(\d+)° global/.exec(M.lattices.global4 || ''), lat1 = /^(\d+)° Brazilian margin/.exec(M.lattices.brazil1 || '');
  if (!lat4 || !lat1) die('the corpus does not name its two lattices');

  /* ---- THE TYPED NUMBERS: every digit the page's own text carries comes through here, with its record ---- */
  const said = new Set();
  const N = (s) => { for (const run of String(s).match(/\d+(?:[.,]\d+)*/g) || []) said.add(run); return String(s); };
  const en = (n) => N(Number(n).toLocaleString('en-US'));
  const dc = (cmv) => N((Math.abs(cmv) / 100).toFixed(2));
  const sgn = (cmv) => (cmv < 0 ? '&minus;' : cmv > 0 ? '+' : '');
  const word = (n) => { if (!WORD[n]) die('no word for the count ' + n); return WORD[n]; };
  const cite = (s) => N(s);                                             /* a citation's year is the citation's own */
  const name = (s) => N(s);                                             /* a name that holds a digit (sha256) is not a quantity */
  const lic = /^(CC BY-SA \d+(?:\.\d+)?)/.exec(M.dataset.license || '');
  if (!lic) die('the corpus does not name the hindcast\'s licence');
  const LIC = N(lic[1]);
  const digits = /(\d+)-digit values/.exec(battery);
  if (!digits) die('instruments/hseva/battery.js no longer names the digits of its reference values');
  const D50 = N(digits[1]), SHA = name('sha256');
  const Y = { a: N(first.slice(0, 4)), b: N(last.slice(0, 4)), n: N(Math.round(years)) };
  const T0 = N(periods[0]), T1 = N(periods[1]);
  const L4 = N(lat4[1]), L1 = N(lat1[1]), nRep = places.length, LV = N(lvl[1]);
  const DS = M.dataset.name; N(DS);
  if (!/^Reis, Guimarães/.test(paper[1])) die('the ledger\'s paper is not Reis, Guimarães et al.');
  const ref = () => 'Reis, Guimar&atilde;es et al. (Ocean Engineering, ' + N(paper[3]) + ')';
  const pnbTxt = () => {
    if (!pnb) return 'no comparison with measurements on record.';
    const v = (s, derived) => W.value(s, W.COMPUTED, { derived, title: 'computed: a float statistic (certs/janela-pnboia-check.json)' });
    const rng = (q, signed) => (signed ? sgn(q[0]) : '') + dc(q[0]) + ' to ' + (signed ? sgn(q[1]) : '') + dc(q[1]) + ' m';
    return 'against the Navy\'s PNBOIA buoys, at ' + en(pnb.nodes) + ' nodes of the Brazilian margin (' + en(pnb.pairs) + ' pairs, ' + N(pnb.from) + '&ndash;' + N(pnb.to) + '), its bias ran ' + v(rng(pnb.bias, true), pnb.biasFrom) + ' and its RMS ' + v(rng(pnb.rms), pnb.rmsFrom) + ' (certs/janela-pnboia-check.json): over every sea state. Its extremes, which a design wave reads, were never checked.';
  };
  /* the chain every cell's number travels, without the cell's own figures: the card's chain is this one, with the
     cell's own figures in the second and the last premise (map-client.js restsOn) */
  const premItems = () => [
    { grade: W.ASSUMED, label: 'The hindcast', evidence: DS + ' (Ifremer WAVEWATCH III), a wave model\'s output; ' + pnbTxt() },
    { grade: W.ASSUMED, label: 'Independent maxima, from a climate that does not change', evidence: 'each block\'s maxima are taken as independent and from one law, and ' + Y.n + ' years of one climate stand for ' + T0 + ' or ' + T1 + '; daily maxima come in storms (each cell\'s card says how much).' },
    { grade: W.VERIFIED, label: 'The fits', evidence: 'each family, by maximum likelihood, is a box the Krawczyk operator proves holds the likelihood\'s one maximum there, the Hessian proved negative definite: decided. The code reproduces closed forms and ' + D50 + '-digit values (instruments/hseva/battery.js).' },
    { grade: W.ASSUMED, label: 'Each family\'s best maximum', evidence: 'that no better maximum lies elsewhere in the family is the search\'s claim, as it is any optimiser\'s.' },
    { grade: W.ASSUMED, label: 'The family chosen on the same sample', evidence: 'Anderson&ndash;Darling chooses among the ' + word(PAPER_SIX.length) + ' on the same maxima they were fitted to; no held-out sample decides between families.' },
  ];
  /* the line that names the weakest premise, by its grade (W.weakest over the chain) and by name */
  const meetOf = (items) => 'The arithmetic is exact; the weakest premise is <b>' + W.GRADE[W.weakest(...items.map((x) => x.grade))] + '</b>: the hindcast, the independence, the search and the choice of family.';
  const chain = () => { const items = premItems(); return W.premisesHtml(items, { meetLine: meetOf(items) }); };

  const how = `<h3>What the map shows</h3>
<p>Each cell is a node of the hindcast of ${ref()}: ${en(sea.length)} in the open sea, on a ${L4}&deg; lattice of the globe, a ${L1}&deg; lattice of the Brazilian margin and the report's ${en(nRep)} nodes. The colour is the <b>design wave</b>: the significant wave height (H<sub>s</sub>) of the ${T0}- or ${T1}-year return level, in the family Anderson&ndash;Darling decides among ${word(PAPER_SIX.length)}, on the daily, weekly or monthly maxima of ${Y.a} to ${Y.b}. A <b>refused</b> cell is hatched: there no family is decided, or its level does not close into an exact interval, and the card says why. The ${en(ice.length)} that the hindcast's own sea ice touches at some step are dotted: shown, not certified.</p>
<h3>Every cell at its true area</h3>
<p>The map uses the Equal Earth projection (${cite('Šavrič, Patterson and Jenny, 2018')}), which keeps areas: each cell takes a share of the map in proportion to its share of the ocean, and a ${L4}&deg; cell near the pole looks no bigger than it is. Drag to move, use the wheel or two fingers to zoom; &ldquo;Brazilian margin&rdquo; frames the ${L1}&deg; lattice.</p>
<h3>How to read each number</h3>
<p>A <b>decided</b> number is an exact interval, rounded outward to the centimetre: the lower end down, the upper end up. The width another ${Y.n} years of the same sea could give (${LV}%, the delta method) is <b>statistical</b>, dash-underlined: computed, not decided. A <b>refusal</b> has no mark: &empty; and the reason.</p>
${W.legendHtml({ code: fs.readFileSync(path.join(HERE, 'map-client.js'), 'utf8') })}
<h3>What each number rests on</h3>
<p>The arithmetic is exact, and each number rests on premises checked to different rungs; a conclusion is as checked as its weakest premise. Each cell's card repeats this chain with its own figures.</p>
${chain()}
<h3>The globe</h3>
<p>On the <a href="../">globe</a> are the paper's regional claims, decided as boxes, the other views (which family, the criteria, the seventh family, the uncertainty) and, in each cell, the certificate: it can be certified again in your browser, with the record's own code, from the data pinned by ${SHA}.</p>
<h3>Sources</h3>
<p>Waves: Ifremer WAVEWATCH III ${DS} (<a href="https://doi.org/${M.dataset.doi}">doi</a>), ${LIC}. Land: Natural Earth, public domain. The record: <a href="https://github.com/${REPO}/blob/main/certs/hseva-atlas.json">certs/hseva-atlas.json</a>. Code (MIT): <a href="https://github.com/${REPO}/tree/main/playground/return-level-atlas">playground/return-level-atlas</a>.</p>`;
  const lede = 'The wave a structure must stand, cell by cell: decided where the record decides, refused &mdash; with the reason &mdash; where it does not.';
  const panelHtml = `
<div class="rm-grab" aria-hidden="true"></div>
<div class="rm-phead">
  <div class="rm-eyebrow">instruments &middot; return-level atlas</div>
  <h1 class="rm-q">Design wave</h1>
  <p class="rm-lede">${lede}</p>
  <div class="rm-qrow"><div class="rm-seg" id="rm-T" role="radiogroup"></div><div class="rm-seg" id="rm-B" role="radiogroup"></div></div>
  <div id="rm-key" aria-live="polite"></div>
</div>
<nav class="rm-tabs" role="tablist"><button type="button" class="rm-tab on" data-tab="places" role="tab" aria-selected="true">Places</button><button type="button" class="rm-tab" data-tab="how" role="tab" aria-selected="false">How to read</button></nav>
<div class="rm-scroll" id="rm-scroll">
  <section class="rm-pane on" data-pane="places"><div id="rm-list"><p class="rm-note" id="rm-wait">Reading the atlas&rsquo;s record&hellip;</p></div><section id="rm-card" hidden></section></section>
  <section class="rm-pane rm-how" data-pane="how"><div class="rm-howl">${how}</div></section>
</div>`;
  const topHtml = `<div class="rm-top"><nav class="rm-views" aria-label="globe or map"><a href="../" id="rm-to-globe">Globe</a><a aria-current="page" href="./">Map</a></nav></div>`;
  const extraHtml = `<div class="rm-ctl" id="rm-ctl" role="group" aria-label="frame the map"><button type="button" id="rm-world">World</button><button type="button" id="rm-brazil">Brazilian margin</button><button type="button" id="rm-zin" aria-label="zoom in">+</button><button type="button" id="rm-zout" aria-label="zoom out">&minus;</button></div>
<div id="rm-tip" role="tooltip" hidden></div>`;
  /* the page's own words carry no number a record did not give */
  for (const [where, h] of [['the panel', panelHtml], ['the top bar', topHtml], ['the map', extraHtml]]) {
    const text = h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<svg[\s\S]*?<\/svg>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-zA-Z]+;|&#\d+;/g, ' ');
    const bad = [...new Set((text.match(/\d+(?:[.,]\d+)*/g) || []).filter((r) => !said.has(r)))];
    if (bad.length) die('a number typed in ' + where + ' that no record gives: ' + bad.join(', '));
  }

  /* ---- the tab's modules: the grammar's renderer and the shared rules, as text (Swell's way) ---- */
  const MOD = [['grammar.js', 'design/grammar.js'], ['warrant.js', 'playground/warrant.js'], ['shared.js', 'playground/return-level-atlas/shared.js']];
  const mods = { src: {}, sha: {} };
  for (const [k, rel] of MOD) { const t = fs.readFileSync(path.join(ROOT, rel), 'utf8'); mods.src[k] = t; mods.sha[rel] = sha(t); }
  const MODS = 'window.RLA_MAP_MODS=' + JSON.stringify(mods).replace(/</g, '\\u003c') + ';\n';
  const APPJS = fs.readFileSync(path.join(HERE, 'map-client.js'));
  const CSS = fs.readFileSync(path.join(HERE, 'map.css'), 'utf8');
  const cfg = {
    periods, blocks: BLK, fam: PAPER_SIX, nBlock, years: { first: first.slice(0, 4), last: last.slice(0, 4), n: Math.round(years) }, stat: { level: Number(lvl[1]) },
    places, frame: { brazil: [[ext.lon[0] - 0.5, ext.lat[0] - 0.5], [ext.lon[1] + 0.5, ext.lat[1] + 0.5]] },
    pnb: pnb ? { at: pnb.at } : null, dataset: DS,
    prem: (() => { const it = premItems(); return { items: it, meet: meetOf(it) }; })(),
    shas: { 'app.js': sha(APPJS), 'mods.js': sha(MODS), 'cells.json': sha(cellsJson), 'shared.js': mods.sha['playground/return-level-atlas/shared.js'] },
  };
  const html = renderApp({
    title: 'Design wave — the return-level atlas as a flat map',
    description: 'The 100- and 1000-year design wave in every cell of the hindcast of Reis, Guimarães et al. (Ocean Engineering 2026), on an equal-area map: decided where the record decides, refused with the reason where it does not, the six families side by side and the statistical width apart.',
    path: '/instruments/return-level-atlas/map/', lang: 'en', appName: 'Return-level atlas', brand: 'CERT-MACHINE', homeHref: '/',
    topHtml, navLinks: [{ href: '/instruments/', label: 'instruments' }],
    mapAria: 'An equal-area (Equal Earth) world map divided into cells, each shaded by its design wave; refused cells hatched, cells touched by sea ice dotted',
    cssRaw: CSS, noDock: true, noLeft: true, warrant: true,
    panelHtml, extraHtml,
    configGlobal: 'RLA_MAP', configJson: JSON.stringify(cfg).replace(/</g, '\\u003c'),
    scripts: ['mods.js', 'app.js'],
  });
  const mdir = path.join(dir, 'map');
  fs.mkdirSync(mdir, { recursive: true });
  fs.writeFileSync(path.join(mdir, 'index.html'), html);
  fs.writeFileSync(path.join(mdir, 'app.js'), APPJS);
  fs.writeFileSync(path.join(mdir, 'mods.js'), MODS);
  fs.writeFileSync(path.join(mdir, 'cells.json'), cellsJson);
  return { bytes: html.length, cells: cellsJson.length, echoed, widened, places: places.length, pnb: !!pnb };
}

module.exports = { build };
