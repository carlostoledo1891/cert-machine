/* decisions.js — the published DECISIONS, kept, and graded against what the satellites saw.
   apps/janela/audit · cert-machine

     node apps/janela/audit/decisions.js archive FILE   keep the day's decisions at the observable sites
                                                         (FILE: the app's day, today.json) -> certs/janela-decisions/YYYYMMDD.json
     node apps/janela/audit/decisions.js score          print the decision-level record (nothing written)

   WHY. The ledger grades the BANDS (did the sea fall inside?). An operator acts on the
   DECISIONS: "Alívio LIBERADA from Wednesday 09h for 24 h". This module keeps every published
   decision at the open-sea sites a satellite can see (the scored kinds of commit.js) and,
   once the days are observed (observe.py, three days late), says what happened to each.
   The app's day is overwritten daily on janela-field; the decisions are kept here, on main,
   written once (guard.js), so the record survives the day.

   WHAT IS GRADED (decision-level-v1, certs/janela-ledger/DEFINITIONS.json): the Hs limit of
   each preset, the only variable the altimeter measures as the decision means it. A window
   [t, t + TR] of a preset at a site, decided LIBERADA or VETADA by a criterion (the measured
   band, DNV Table 4-1, the site alpha), is OBSERVED at a step of the window when a pass's
   mid-time is within 3 h of the step (score.js's rule, the pass nearest); the sea between
   steps is never decided, so never graded. A window is graded only if its start is at least
   an hour after the decisions were archived (a decision about a window already open is not a
   forecast). Outcomes:
     LIBERADA  held      every observed step within the Hs limit
               broke     some observed step outside it — a published LIBERADA the sea refused
     VETADA    confirmed some observed step outside the limit
               open      every step of the window observed and all within: the sea allowed it
     either    unseen    no step of the window observed (or, for VETADA, some steps unseen and
                         every observed one within — nothing can be said)
   Descriptive counts, never an admission: the windows of a day overlap and share passes.
   A LIBERADA also needs its wind limit; only its Hs part is graded here, and it says so.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Q = require('../../../instruments/window/q.js');
const C = require('./criteria.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const DIR = path.join(ROOT, 'certs', 'janela-decisions');
const OBS = path.join(ROOT, 'corpus', 'janela', 'observed');
const RULE = 'decision-level-v1 (apps/janela/audit/decisions.js)';
const CRITS = require('../app/model.js').CRITS;    /* the order the day's codes are written in (criteria.place over model.CRITS) */
const OBSERVABLE = new Set(['field', 'platform', 'coast']);
const WINDOW_MS = 3 * 3600e3, MARGIN_MS = 3600e3;

/* the day's decisions at the observable sites, from the app's day (today.json) */
function extract(T, sites, archivedAt) {
  const N = T.t.length, out = {};
  for (const s of sites) {
    if (!OBSERVABLE.has(s.kind) || !T.places[s.id] || !T.dec[s.id]) continue;
    const dec = {};
    for (const p of T.presets) {
      const c = T.dec[s.id][p.id];
      if (typeof c !== 'string' || c.length !== N * CRITS.length) throw new Error('REFUSED: ' + s.id + ' ' + p.id + ' is not ' + CRITS.length + ' x ' + N + ' codes');
      dec[p.id] = c;
    }
    out[s.id] = { node: T.places[s.id].node, dec };
  }
  return {
    what: 'The decisions Janela published at the open-sea sites a satellite can see, kept from the app\'s day (janela-field is overwritten daily) and graded by ' + RULE + '.',
    rule: RULE, run: T.run, git: T.git, digest: T.digest, dayMadeAt: T.madeAt, archivedAt,
    t: T.t, lead: T.lead, crits: CRITS, presets: T.presets.map((p) => ({ id: p.id, TR: p.TR, limits: p.limits })), sites: out
  };
}

function archive(file) {
  const raw = fs.readFileSync(file);
  const T = JSON.parse(raw.toString('utf8'));
  const day = T.run.slice(0, 10).replace(/-/g, '');
  const dest = path.join(DIR, day + '.json');
  if (fs.existsSync(dest)) { console.log('janela decisions: ' + path.relative(ROOT, dest) + ' already kept'); return; }
  const sites = require('../scenario/sites.json').sites;
  const rec = extract(T, sites, new Date().toISOString().slice(0, 19) + 'Z');
  rec.daySha256 = crypto.createHash('sha256').update(raw).digest('hex');
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(rec) + '\n');
  console.log('janela decisions: kept ' + Object.keys(rec.sites).length + ' sites x ' + rec.presets.length + ' presets x ' + CRITS.length + ' criteria of ' + T.run + ' -> ' + path.relative(ROOT, dest));
}

/* the pass nearest a step's time within 3 h, at a site, from the observed days given ({date: day file}) */
function passAt(obs, sid, tIso) {
  const t = Date.parse(tIso + ':00:00Z');
  let best = null;
  for (const d of [new Date(t - WINDOW_MS), new Date(t), new Date(t + WINDOW_MS)].map((x) => x.toISOString().slice(0, 10))) {
    const o = obs[d];
    if (o === undefined) return undefined;          /* a day not yet observed: the step cannot be graded yet */
    for (const ps of ((o && o.passes && o.passes[sid]) || [])) {
      const dt = Math.abs(Date.parse(ps.tMid) - t);
      if (dt <= WINDOW_MS && (!best || dt < best.dt)) best = { dt, ps };
    }
  }
  return best ? best.ps : null;
}

const within = (x, l) => { const c = Q.cmp(x, Q.parse(l.value)); return l.op === '<=' ? c <= 0 : l.op === '<' ? c < 0 : l.op === '>=' ? c >= 0 : c > 0; };

/* grade(records, obs) -> { rule, n, byCrit: { crit: { L: {held, broke, unseen}, V: {confirmed, open, unseen}, pending } }, broke: [...] } */
function grade(records, obs) {
  const by = {};
  for (const c of CRITS) by[c] = { L: { held: 0, broke: 0, unseen: 0 }, V: { confirmed: 0, open: 0, unseen: 0 }, pending: 0 };
  const broke = [];
  let n = 0;
  for (const R of records) {
    const N = R.t.length, steps = R.t.map((t, k) => ({ t, lead: R.lead[k] }));
    for (const [sid, s] of Object.entries(R.sites)) {
      for (const p of R.presets) {
        const hs = p.limits.find((l) => l.var === 'hs');
        if (!hs) continue;
        CRITS.forEach((crit, ci) => {
          const codes = s.dec[p.id].slice(ci * N, (ci + 1) * N);
          for (let i = 0; i < N; i++) {
            const v = codes[i];
            if (v !== 'L' && v !== 'V') continue;
            if (Date.parse(R.t[i] + ':00:00Z') - Date.parse(R.archivedAt) < MARGIN_MS) continue;
            const sp = C.span(steps, i, p.TR);
            if (!sp) continue;
            const seen = sp.map((k) => passAt(obs, sid, R.t[k]));
            if (seen.some((x) => x === undefined)) { by[crit].pending++; continue; }
            n++;
            const obsd = seen.filter(Boolean), out = obsd.filter((ps) => !within(Q.parse(ps.hs), hs));
            if (v === 'L') {
              if (!obsd.length) by[crit].L.unseen++;
              else if (out.length) { by[crit].L.broke++; broke.push({ run: R.run, site: sid, preset: p.id, crit, start: R.t[i], hs: out.map((ps) => [ps.tMid, Q.dec(Q.parse(ps.hs), 2)]) }); }
              else by[crit].L.held++;
            } else if (out.length) by[crit].V.confirmed++;
            else if (obsd.length === seen.length) by[crit].V.open++;
            else by[crit].V.unseen++;
          }
        });
      }
    }
  }
  return { rule: RULE, graded: n, byCrit: by, broke };
}

/* the kept days and the observed days on disk, graded */
function load() {
  const recs = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /^\d{8}\.json$/.test(f)).sort().map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'))) : [];
  const obs = new Proxy({}, { get: (c, d) => {
    if (typeof d !== 'string') return undefined;
    if (!(d in c)) { const p = path.join(OBS, d.replace(/-/g, '') + '.json'); c[d] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : undefined; }
    return c[d];
  } });
  return Object.assign(grade(recs, obs), { days: recs.map((r) => r.run.slice(0, 10)) });
}

if (require.main === module) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'archive' && arg) archive(path.resolve(arg));
  else if (cmd === 'score') {
    const g = load();
    console.log('janela decisions (' + g.rule + '): ' + g.days.length + ' day(s) kept, ' + g.graded + ' windows graded');
    for (const c of CRITS) {
      const b = g.byCrit[c];
      console.log('  ' + c.padEnd(5) + ' LIBERADA held ' + b.L.held + ', broke ' + b.L.broke + ', unseen ' + b.L.unseen + ' · VETADA confirmed ' + b.V.confirmed + ', open ' + b.V.open + ', unseen ' + b.V.unseen + ' · waiting ' + b.pending);
    }
    for (const x of g.broke.slice(0, 20)) console.log('  BROKE ' + x.run + ' ' + x.site + ' ' + x.preset + ' ' + x.crit + ' from ' + x.start + ': ' + x.hs.map((h) => h[1] + ' m at ' + h[0]).join(', '));
  } else { console.error('usage: decisions.js archive FILE | score'); process.exit(2); }
}

module.exports = { RULE, CRITS, extract, grade, passAt, load };
