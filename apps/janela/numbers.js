/* numbers.js — every number the Janela page displays, read from the record
   that holds it. ONE module: a figure the page states twice is read here once,
   or the two WILL diverge (the corpus.js lesson). A record that no longer says
   what a sentence needs makes this module throw, and the build refuses.

   load(over) -> N. `over` replaces a record for a TEST build only (a synthetic
   bands or alpha record, to see the page in its full state); the served page
   is built with no override.
   apps/janela · cert-machine                                             MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..', '..');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const need = (c, m) => { if (!c) throw new Error('janela numbers: ' + m); };
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

const Q = require('../../instruments/window/q.js');
const WK = require('../../instruments/window/workability.js');
const TODAY = require('./audit/today.js');
const LEDGER = require('../../instruments/forecast/ledger.js');
const ADMIT = require('../../instruments/forecast/admission.js');

/* "0.7900" -> "0.79", "1.844" stays: trailing zeros past the second decimal say nothing */
const trim = (d) => String(d).replace(/^(-?\d+\.\d\d\d*?)0+$/, '$1');

/* great-circle distance, for a display line only ("the node is ~8 km out") */
function km(a, b) {
  const r = Math.PI / 180, dLa = (b[0] - a[0]) * r, dLo = (b[1] - a[1]) * r;
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLo / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}

function load(over) {
  over = over || {};
  const N = {};

  /* ---- the places, the operations, the rules ---- */
  const SITES = J('apps/janela/scenario/sites.json').sites;
  const OPS = J('apps/janela/scenario/operations.json');
  const NPCP = J('apps/janela/scenario/rules/npcp.json');
  const DNV = J('apps/janela/scenario/rules/dnv-alpha.json');
  need(SITES.length >= 1, 'no sites');
  for (const op of OPS.operations) {
    need(SITES.some((s) => s.id === op.site), 'operation ' + op.id + ' names an unknown site');
    need(NPCP.rules.some((r) => r.id === op.rule), 'operation ' + op.id + ' cites a rule that is not in npcp.json');
  }

  /* ---- today's feed: the newest file, gunzipped, hashed as read ---- */
  const FEED = path.join(ROOT, 'corpus', 'janela', 'feed');
  const files = fs.readdirSync(FEED).filter((f) => /^\d{8}\.json\.gz$/.test(f)).sort();
  need(files.length, 'no feed in corpus/janela/feed');
  const gz = fs.readFileSync(path.join(FEED, files[files.length - 1]));
  const raw = zlib.gunzipSync(gz);
  const feed = JSON.parse(raw.toString('utf8'));
  need(feed.run && feed.madeAt && feed.sites, 'the feed lost run/madeAt/sites');
  N.feed = { file: 'corpus/janela/feed/' + files[files.length - 1], sha: sha(raw), gzSha: sha(gz), run: feed.run, madeAt: feed.madeAt,
    ensemble: feed.ensemble, groups: (feed.groups || []).length, licence: feed.licence };

  /* ---- the band record, and the week decided over it (audit/today.js) ---- */
  const bands = over.bands || J('certs/janela-bands.json');
  need(bands.sites && bands.binHours && bands.borrow, 'certs/janela-bands.json lost its shape');
  const T = TODAY.compute(feed, bands, OPS.operations, SITES);
  let cells = 0, okCells = 0;
  for (const s of Object.values(bands.sites)) for (const b of Object.values(s.bins)) {
    for (const k of ['hs', 'windSq']) { cells++; if (b[k] && b[k].verdict === 'CERTIFIED-COVERAGE') okCells++; }
  }
  N.bands = { rows: bands.source && bands.source.rows, sha: bands.source && bands.source.sha256, miss: bands.miss, binHours: bands.binHours,
    borrow: bands.borrow, cells, okCells, synthetic: !!over.bands };

  /* the site rows the page draws, in sites.json order */
  const madeMs = Date.parse(feed.madeAt);
  N.sites = SITES.map((s) => {
    const t = T.sites[s.id] || { steps: [] };
    const node = t.node || null;
    return {
      id: s.id, name: s.name, kind: s.kind, lat: s.lat, lon: s.lon, note: s.note || null,
      node, km: node ? Math.round(km([s.lat, s.lon], node)) : null, bandFrom: t.bandFrom || null,
      bandFromName: t.bandFrom ? (SITES.find((x) => x.id === t.bandFrom) || {}).name || t.bandFrom : null,
      steps: t.steps.map((st) => Object.assign({}, st, { past: Date.parse(st.t + ':00:00Z') < madeMs }))
    };
  });
  need(N.sites.some((s) => s.steps.length), 'no site has forecast steps');

  /* the operations with their published source attached */
  N.ops = T.operations.map((o) => {
    const r = NPCP.rules.find((x) => x.id === o.rule);
    const src = NPCP.sources[r.source] || {};
    return Object.assign({}, o, {
      facility: r.facility, where: r.where, kind: r.kind, quote: r.quote, page: r.page, ruleStatus: r.status || null, uncertain: r.uncertain || null,
      source: { id: r.source, title: src.title, act: src.act, url: src.url, sha256: src.sha256, fetched: src.fetched }
    });
  });
  N.acts = [...new Set(N.ops.map((o) => o.source.id))].map((id) => Object.assign({ id }, NPCP.sources[id]));
  N.counts = { 'LIBERADA': 0, 'VETADA': 0, 'INDEFINIDA': 0, 'SEM DADOS': 0 };
  for (const o of N.ops) for (const st of o.steps) {
    need(st.verdict in N.counts, 'an unknown verdict ' + st.verdict + ' at ' + o.id);
    N.counts[st.verdict]++;
  }
  N.decisions = Object.values(N.counts).reduce((a, b) => a + b, 0);
  /* steps whose Hs band is measured, over the open-sea and terminal sites */
  let withBand = 0, withHs = 0;
  for (const s of N.sites) for (const st of s.steps) { if (st.hsDet !== undefined) withHs++; if (st.hs) withBand++; }
  N.bandSteps = { withBand, withHs };

  /* ---- the month: exact workability counts, 1993–2024 ---- */
  const W = J('certs/janela-workability.json');
  need(W.limits && W.periods && W.sites && W.hindcast, 'certs/janela-workability.json lost its shape');
  N.work = {
    samples: W.hindcast.samples, from: W.hindcast.from, to: W.hindcast.to, source: W.hindcast.source, pinned: W.hindcast.pinned,
    limits: W.limits, periods: W.periods, sites: {}
  };
  for (const [sid, s] of Object.entries(W.sites)) {
    const cellsOut = {};
    for (const [k, c] of Object.entries(s.cells)) {
      need(c.oplim.length === 13 && c.opwfCells.length === 13, 'workability cell ' + sid + ' ' + k + ' is not 12 months + the year');
      cellsOut[k] = {
        T: c.TPOP, a: c.alpha, ad: trim(WK.decimal(c.alpha, 4)), wf: trim(c.opwfDec),
        o: c.oplim.map((x) => [x[0], x[1]]), f: c.opwfCells.map((x) => [x[0], x[1]]),
        wo: WK.decimal(c.oplim[12][2], 1), wfw: WK.decimal(c.opwfCells[12][2], 1)
      };
    }
    N.work.sites[sid] = { name: s.name, cells: cellsOut };
  }
  need(N.work.sites.santos && N.work.sites.santos.cells['2.5m/48h'], 'the default month cell (Santos, 2.5 m, 48 h) is gone');

  /* ---- the site alpha: exists only after the back-archive is complete ---- */
  const AP = path.join(ROOT, 'certs', 'janela-alpha.json');
  N.alpha = over.alpha !== undefined ? over.alpha : (fs.existsSync(AP) ? JSON.parse(fs.readFileSync(AP, 'utf8')) : null);
  if (N.alpha) need(N.alpha.calibration && N.alpha.sites, 'certs/janela-alpha.json lost calibration/sites');

  /* ---- the forward ledger: commits, scores, admission, per proposer ---- */
  const LD = path.join(ROOT, 'certs', 'janela-ledger');
  const lfiles = fs.existsSync(LD) ? fs.readdirSync(LD).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort() : [];
  const rows = [].concat(...lfiles.map((f) => LEDGER.rows(path.join(LD, f))));
  const defs = fs.existsSync(path.join(LD, 'DEFINITIONS.json')) ? JSON.parse(fs.readFileSync(path.join(LD, 'DEFINITIONS.json'), 'utf8')) : {};
  const byId = {};
  const dom = {};
  for (const r of rows) {
    if (r.type !== 'commit') continue;
    byId[r.id] = r;
    const d = dom[r.domain] = dom[r.domain] || { domain: r.domain, commits: 0, scored: 0, covered: 0, first: null, last: null, tFirst: null, tLast: null, alpha: null, sites: new Set() };
    d.commits++;
    d.sites.add(r.id.split(':')[1]);
    if (!d.first || r.madeAt < d.first) d.first = r.madeAt;
    if (!d.last || r.madeAt > d.last) d.last = r.madeAt;
    if (!d.tFirst || r.targetTime < d.tFirst) d.tFirst = r.targetTime;
    if (!d.tLast || r.targetTime > d.tLast) d.tLast = r.targetTime;
    if (r.forecast && r.forecast.alpha) d.alpha = r.forecast.alpha.map(Number);
  }
  for (const r of rows) {
    if (r.type !== 'score') continue;
    const c = byId[r.id]; need(c, 'a score row with no commit: ' + r.id);
    dom[c.domain].scored++; if (r.covered) dom[c.domain].covered++;
  }
  N.ledger = {
    files: lfiles.map((f) => 'certs/janela-ledger/' + f), defs,
    proposers: Object.values(dom).sort((a, b) => b.commits - a.commits).map((d) => {
      need(d.alpha, 'ledger domain ' + d.domain + ' carries no alpha');
      const claim = [d.alpha[1] - d.alpha[0], d.alpha[1]];
      const adm = ADMIT.admit({ claim, scored: d.scored, covered: d.covered });
      return { domain: d.domain, commits: d.commits, scored: d.scored, covered: d.covered, first: d.first, last: d.last,
        tFirst: d.tFirst, tLast: d.tLast, sites: d.sites.size, claim: claim.join('/'), status: adm.status, tail: adm.tailStr, bar: adm.bar.join('/') };
    })
  };
  N.ledger.commits = N.ledger.proposers.reduce((a, p) => a + p.commits, 0);
  N.ledger.scored = N.ledger.proposers.reduce((a, p) => a + p.scored, 0);
  N.ledger.first = N.ledger.proposers.map((p) => p.first).sort()[0] || null;

  /* ---- the DNV source, and the modules the reader's tab decides with ---- */
  N.dnv = { source: DNV.source, t41: DNV.waveTables['4-1'], columns: DNV.waveColumns };
  N.mods = ['instruments/window/q.js', 'instruments/window/decide.js'].map((rel) => ({ rel, sha: sha(fs.readFileSync(path.join(ROOT, rel))) }));
  N.groups = [
    { k: 'Áreas de produção', kinds: ['field'] },
    { k: 'Plataforma', kinds: ['platform'] },
    { k: 'Terminais', kinds: ['terminal'] },
    { k: 'Florianópolis', kinds: ['coast'] }
  ];
  for (const s of N.sites) need(N.groups.some((g) => g.kinds.includes(s.kind)), 'site ' + s.id + ' has a kind no picker group shows: ' + s.kind);
  N.counted = { sites: N.sites.length, byKind: N.sites.reduce((a, s) => { a[s.kind] = (a[s.kind] || 0) + 1; return a; }, {}) };
  return N;
}

/* Brazilian number words, once */
const br = {
  int: (x) => Math.round(x).toLocaleString('pt-BR'),
  dec: (s) => String(s).replace('.', ','),
  date: (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4),
  hm: (iso) => iso.slice(11, 16)
};

module.exports = { load, br, Q };
