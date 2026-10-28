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
const PLACAR = require('./audit/placar.js');

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
  /* over.feed = 'YYYYMMDD' re-runs a past day (build-today.js --feed); default the newest */
  const pick = over.feed ? over.feed + '.json.gz' : files[files.length - 1];
  need(files.includes(pick), 'no feed ' + pick + ' in corpus/janela/feed');
  const gz = fs.readFileSync(path.join(FEED, pick));
  const raw = zlib.gunzipSync(gz);
  const feed = JSON.parse(raw.toString('utf8'));
  need(feed.run && feed.madeAt && feed.sites, 'the feed lost run/madeAt/sites');
  N.feed = { file: 'corpus/janela/feed/' + pick, sha: sha(raw), gzSha: sha(gz), run: feed.run, madeAt: feed.madeAt,
    ensemble: feed.ensemble, groups: (feed.groups || []).length, licence: feed.licence };

  /* ---- the second provider: NOAA's day for the SAME run (audit/noaa.py), or null when it was not read ---- */
  const NF = path.join(ROOT, 'corpus', 'janela', 'feed-noaa', pick);
  N.noaa = null;
  if (fs.existsSync(NF)) {
    const nraw = zlib.gunzipSync(fs.readFileSync(NF));
    const nf = JSON.parse(nraw.toString('utf8'));
    need(nf.run === feed.run, 'corpus/janela/feed-noaa/' + pick + ' is the run ' + nf.run + ', not the feed\'s ' + feed.run);
    N.noaa = { file: 'corpus/janela/feed-noaa/' + pick, sha: sha(nraw), run: nf.run, madeAt: nf.madeAt, ensemble: nf.ensemble,
      groups: (nf.groups || []).length, licence: nf.licence };
  }

  /* ---- the ledger's rows, read first: a pruned proposer stops deciding on this page as in the app ---- */
  const LD = path.join(ROOT, 'certs', 'janela-ledger');
  const lfiles = fs.existsSync(LD) ? fs.readdirSync(LD).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort() : [];
  const rows = [].concat(...lfiles.map((f) => LEDGER.rows(path.join(LD, f))));
  let rec;
  try { rec = PLACAR.record(rows); } catch (e) { need(false, 'the ledger: ' + e.message); }

  /* ---- the band record, and the week decided over it (audit/today.js): the bands the app decides with
     (bandset.forDecision — the union with NOAA's where its day is at hand, providers-v1) ---- */
  const DB = over.bands ? { bands: over.bands, noaa: null } : require('./audit/bandset.js').forDecision(
    Object.values(rec).map((p) => ({ domain: p.domain, status: p.admission.status, prunedAt: p.admission.prunedAt })), !!N.noaa);
  const bands = DB.bands;
  need(bands.sites && bands.binHours && bands.borrow, 'certs/janela-bands.json lost its shape');
  const noaaDay = DB.noaa ? JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ROOT, N.noaa.file))).toString('utf8')) : null;
  const T = TODAY.compute(feed, bands, OPS.operations, SITES, noaaDay ? { feed: noaaDay, bands: DB.noaa } : undefined);
  let cells = 0, okCells = 0;
  for (const s of Object.values(bands.sites)) for (const b of Object.values(s.bins)) {
    for (const k of ['hs', 'windDiff']) { cells++; if (b[k] && b[k].verdict === 'CERTIFIED-COVERAGE') okCells++; }
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
        /* [workable, determined, mean wait in hours to one decimal] per month and the year */
        o: c.oplim.map((x) => [x[0], x[1], WK.decimal(x[2], 1)]), f: c.opwfCells.map((x) => [x[0], x[1], WK.decimal(x[2], 1)]),
        wo: WK.decimal(c.oplim[12][2], 1), wfw: WK.decimal(c.opwfCells[12][2], 1)
      };
    }
    /* the site alpha's workability (the lower end of its 90% interval, rounded down to
       0.01, times OPLIM): the SAME exact count, at a different OPWF. The record names its
       OPLIM only through opwf/alphaSite, so it is recovered exactly and must be a limit. */
    for (const a of (s.siteAlpha || [])) {
      const oplim = Q.div(Q.parse(a.opwf), Q.parse(a.alphaSite));
      const lim = W.limits.find((l) => Q.cmp(Q.parse(l), oplim) === 0);
      need(lim, 'siteAlpha at ' + sid + ' TR ' + a.TR + ' h is not over a tabulated limit');
      const k = lim + 'm/' + a.TR + 'h', c = cellsOut[k];
      need(c && c.T === a.TPOP, 'siteAlpha at ' + sid + ' ' + k + ' has no workability cell with TPOP ' + a.TPOP);
      need(Q.cmp(Q.parse(a.alphaTable), Q.parse(c.a)) === 0, 'siteAlpha at ' + sid + ' ' + k + ' names a table alpha the cell does not use');
      need(a.cells.length === 13, 'siteAlpha at ' + sid + ' ' + k + ' is not 12 months + the year');
      c.s = { a: trim(WK.decimal(a.alphaSite, 2)), pt: a.alphaSitePoint, ci: a.alphaSiteCi90, wf: trim(a.opwfDec),
        c: a.cells.map((x) => [x[0], x[1], WK.decimal(x[2], 1)]), w: WK.decimal(a.cells[12][2], 1) };
    }
    N.work.sites[sid] = { name: s.name, cells: cellsOut };
  }
  need(N.work.sites.santos && N.work.sites.santos.cells['2.5m/48h'], 'the default month cell (Santos, 2.5 m, 48 h) is gone');

  /* ---- the site alpha: exists only after the back-archive is complete ---- */
  const AP = path.join(ROOT, 'certs', 'janela-alpha.json');
  N.alpha = over.alpha !== undefined ? over.alpha : (fs.existsSync(AP) ? require('./audit/bandset.js').alpha() : null);
  if (N.alpha) need(N.alpha.calibration && N.alpha.sites, 'certs/janela-alpha.json lost calibration/sites');

  /* ---- the forward ledger: commits, scores, admission, per proposer ---- */
  const defs = fs.existsSync(path.join(LD, 'DEFINITIONS.json')) ? JSON.parse(fs.readFileSync(path.join(LD, 'DEFINITIONS.json'), 'utf8')) : {};
  /* the descriptive window of each proposer (first/last commit, targets, sites) */
  const dom = {};
  for (const r of rows) {
    if (r.type !== 'commit') continue;
    const d = dom[r.domain] = dom[r.domain] || { first: null, last: null, tFirst: null, tLast: null, sites: new Set() };
    d.sites.add(r.id.split(':')[1]);
    if (!d.first || r.madeAt < d.first) d.first = r.madeAt;
    if (!d.last || r.madeAt > d.last) d.last = r.madeAt;
    if (!d.tFirst || r.targetTime < d.tFirst) d.tFirst = r.targetTime;
    if (!d.tLast || r.targetTime > d.tLast) d.tLast = r.targetTime;
  }
  /* counts, claim and admission: placar.js (rec, read above), the one definition score.js prints too */
  /* which proposers decide (a calibrated band in force, bandset.js); the rest are raw ensembles: shown and graded,
     never decided on (providers-v1) */
  const deciding = new Set(require('./audit/bandset.js').records().map((r) => r.proposer).concat(Object.values(require('./audit/commit.js').UNIONS)));
  N.ledger = {
    files: lfiles.map((f) => 'certs/janela-ledger/' + f), defs, rule: PLACAR.RULE, firstLook: PLACAR.FIRST_LOOK,
    proposers: Object.values(rec).sort((a, b) => b.commits - a.commits).map((p) => {
      const d = dom[p.domain], a = p.admission, last = a.looks[a.looks.length - 1] || null;
      return { domain: p.domain, name: PLACAR.NAMES_PT[p.domain] || p.domain, decides: deciding.has(p.domain), commits: p.commits, scored: p.scored, covered: p.covered, first: d.first, last: d.last,
        tFirst: d.tFirst, tLast: d.tLast, sites: d.sites.size, claim: p.claim, status: a.status, pending: a.pending,
        trials: a.trials, trialsCovered: a.trialsCovered, next: a.next, looks: a.looks, prunedAt: a.prunedAt,
        tail: last ? last.tail : null, bar: last ? last.bar : null, bySite: p.breakdown.bySite, byLead: p.breakdown.byLead };
    })
  };
  /* the published decisions, graded against the satellites (audit/decisions.js, decision-level-v1): counts only */
  const DLV = require('./audit/decisions.js').load();
  N.ledger.decisions = { rule: DLV.rule, days: DLV.days, graded: DLV.graded, byCrit: DLV.byCrit, broke: DLV.broke.slice(0, 12), brokeAll: DLV.broke.length };

  /* the deciding band's held-out record (apps/janela/audit/providers.py, providers-eval-v1): the trust line's numbers */
  const PE = path.join(ROOT, 'certs', 'janela-providers-eval.json');
  if (fs.existsSync(PE)) {
    const R = JSON.parse(fs.readFileSync(PE, 'utf8'));
    const pick = (o, m) => R.results.find((x) => x.option === o && x.miss === m);
    const U = pick('U(E,N)', '1/10'), E = pick('E', '1/10');
    need(U && E, 'certs/janela-providers-eval.json lost the union or ECMWF at 1/10');
    N.heldOut = { from: R.pairs.split, pairs: R.pairs.test, coverage: U.coverage,
      broke: U.limits['2.0'].brokeLiberada, liberada: U.limits['2.0'].liberada, eBroke: E.limits['2.0'].brokeLiberada, eLiberada: E.limits['2.0'].liberada };
  }
  N.premises = premises(N);
  N.ledger.h2h = PLACAR.headToHead(rows);
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

/* ---- THE PREMISES (WARRANT v2.1, design/WARRANT.md "models as premises"), 2026-10-28 ----
   A verdict here is exact arithmetic over a band; the band, the alpha and the hindcast are MODELS, and each one was
   checked to a different rung. Every grade the app and the method page print is read here from the record that earns
   it, and the build refuses when a record stops saying what the grade needs:
     the Hs band at a measured site         VALIDATED  held-out satellite passes, per measured region (providers-eval-v1)
     the wind band                          ASSUMED    calibrated on the same pairs; no held-out record, the ledger and
                                                       decision-level-v1 grade Hs only
     a band carried to a unit or terminal   ASSUMED    measured at another node; nothing measured it here
     the alpha of DNV Table 4-1             ASSUMED    adopted (North Sea); its 1-in-10,000 tail is extrapolated
     the site-alpha method                  VERIFIED   it reproduces Table 4-1 before it looks at Brazil
     the hindcast at a planning node        VALIDATED  only where a buoy shares the node; ASSUMED elsewhere
     the currents                           ASSUMED    shown, never decided; no comparison record yet
   A grade is where the checking stopped, never a confidence. */
function premises(N) {
  const P = {};
  const evalOf = (rel) => {
    const R = J(rel);
    const m = /(\d+) held-out months/.exec(R.what || '');
    need(m, rel + ' no longer says how many held-out months it judged on');
    const at = (o, miss) => R.results.find((x) => x.option === o && x.miss === miss);
    const out = { file: rel, months: Number(m[1]), split: R.pairs.split, test: R.pairs.test, opt: {} };
    for (const o of ['E', 'N', 'U(E,N)']) {
      const x = at(o, '1/10');
      need(x && x.limits && x.limits['2.0'], rel + ' lost ' + o + ' at 1/10');
      need(x.n === R.pairs.test, rel + ': ' + o + ' was not judged on every test pair');
      out.opt[o] = { coverage: x.coverage, liberada: x.limits['2.0'].liberada, broke: x.limits['2.0'].brokeLiberada };
    }
    /* ECMWF's band widened to about the union's coverage (miss 1/20): the like-for-like the method page names */
    const w = at('E', '1/20');
    need(w && w.limits && w.limits['2.0'], rel + ' lost E at 1/20');
    out.wide = { coverage: w.coverage, liberada: w.limits['2.0'].liberada, broke: w.limits['2.0'].brokeLiberada };
    /* a record that starts judging the wind band held out must be read into a new grade, never ignored */
    need(!/wind/i.test(JSON.stringify(R.results)), rel + ' now judges the wind band held out: re-grade the wind premise');
    return out;
  };
  P.heldOut = { main: evalOf('certs/janela-providers-eval.json') };
  P.regionOf = {};
  for (const r of require('./audit/bandset.js').regions()) {
    const rel = 'certs/janela-providers-eval-' + r.name + '.json';
    if (fs.existsSync(path.join(ROOT, rel))) P.heldOut[r.name] = evalOf(rel);
    for (const sid of r.sites) P.regionOf[sid] = r.name;
  }
  /* the wind band: every ledger target is Hs, and the decision grading says it leaves the wind limit out */
  const defs = N.ledger.defs || {};
  const targets = Object.values(defs).filter((d) => d && d.target).map((d) => d.target);
  need(targets.length && targets.every((t) => /^Hs \(m\)/.test(t)), 'a ledger target is no longer Hs: re-grade the wind premise');
  const dl = Object.entries(defs).find(([k]) => /^decision-level-v1/.test(k));
  need(dl && /wind limit is not graded/.test(dl[1].stated || ''), 'decision-level-v1 no longer says it leaves the wind limit out');
  P.wind = { validated: false, rows: N.bands.rows };
  /* the alpha: the method's calibration against Table 4-1, the tail it extrapolates to, and per site where the
     estimate sits against the table */
  const A = N.alpha;
  if (A) {
    const cal = A.calibration;
    need(cal && cal.pass && cal.within && cal.of && Array.isArray(cal.cells), 'certs/janela-alpha.json lost its calibration against Table 4-1');
    const tol = /\+-([\d.]+)/.exec(cal.gate || '');
    need(tol, 'the alpha calibration gate lost its tolerance');
    const inKey = (c) => Object.keys(c).find((k) => /^within/.test(k));
    need(cal.cells.filter((c) => c[inKey(c)]).length === cal.within, 'the alpha calibration count does not match its cells');
    need(A.method && A.method.P && (A.method.caveats || []).some((c) => /cannot be observed/.test(c)), 'certs/janela-alpha.json lost its tail probability or the caveat that the tail is extrapolated');
    const bySite = {};
    for (const [sid, s] of Object.entries(A.sites)) {
      const est = s.cells.filter((c) => c.verdict === 'ESTIMATED');
      bySite[sid] = { est: est.length, above: est.filter((c) => /ABOVE/.test(c.reading || '')).length, below: est.filter((c) => /BELOW/.test(c.reading || '')).length,
        maxHs: est.length ? Math.max(...est.map((c) => c.designHs)) : null, pairs: s.pairs };
    }
    P.alpha = { within: cal.within, of: cal.of, tol: tol[1], P: A.method.P, oneIn: Math.round(1 / A.method.P), minPairs: A.method.minPairs,
      missed: cal.cells.filter((c) => !c[inKey(c)]).map((c) => ({ hs: c.designHs, T: c.TPOP })), bySite };
  }
  /* the hindcast the planner counts on, against the Navy's moored buoys (certs/janela-pnboia-check.json) */
  const PB = 'certs/janela-pnboia-check.json';
  if (fs.existsSync(path.join(ROOT, PB))) {
    const R = J(PB);
    const dep = R.buoys.filter((b) => b.pairs > 0 && b.pointwise && b.pointwise['2.0m']);
    need(dep.length >= 5, PB + ': too few buoy deployments compared');
    let n = 0, b20 = 0, h20 = 0;
    for (const b of dep) { const c = b.pointwise['2.0m']; n += c.both + c.buoyOnly + c.hindcastOnly + c.neither; b20 += c.both + c.buoyOnly; h20 += c.both + c.hindcastOnly; }
    need(n === dep.reduce((a, b) => a + b.pairs, 0), PB + ': the pointwise counts do not add up to the pairs');
    const nodes = new Set(dep.map((b) => b.node.join(',')));
    const pts = J('corpus/ww3-points/points.json').points;
    const at = {};
    for (const sid of Object.keys(N.work.sites)) {
      const p = pts.find((x) => x.name === sid);
      need(p, 'the planning site ' + sid + ' has no hindcast node in corpus/ww3-points/points.json');
      at[sid] = dep.filter((b) => b.node[0] === p.lat && b.node[1] === p.lon).map((b) => b.buoy);
    }
    const lo = (xs) => Math.min(...xs), hi = (xs) => Math.max(...xs);
    P.hindcast = { deployments: dep.length, pairs: n, from: dep.map((b) => b.from).sort()[0].slice(0, 4), to: dep.map((b) => b.to).sort().slice(-1)[0].slice(0, 4),
      bias: [lo(dep.map((b) => b.biasHindcastMinusBuoy)), hi(dep.map((b) => b.biasHindcastMinusBuoy))], rms: [lo(dep.map((b) => b.rms)), hi(dep.map((b) => b.rms))],
      le2: { buoy: b20, hind: h20, n }, nodes: nodes.size, buoysAt: at };
  }
  /* the currents: shown, never decided; the truth they will be graded against (current-truth-v1) is being gathered */
  const cur = fs.readdirSync(path.join(ROOT, 'certs')).filter((f) => /^janela-current/.test(f));
  need(!cur.length, 'a currents record exists (' + cur.join(', ') + '): re-grade the currents premise');
  const ct = Object.entries(defs).find(([k]) => /^current-truth-v1/.test(k));
  need(ct, 'DEFINITIONS.json lost current-truth-v1');
  P.currents = { compared: false, since: (/^(\d{4}-\d\d-\d\d)/.exec(ct[1].decided || '') || [])[1] || null };
  return P;
}

/* Brazilian number words, once */
const br = {
  int: (x) => Math.round(x).toLocaleString('pt-BR'),
  dec: (s) => String(s).replace('.', ','),
  date: (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4),
  hm: (iso) => iso.slice(11, 16)
};

module.exports = { load, br, Q };
