/* score.js — the ledger meets the satellites.
   apps/janela/audit · cert-machine

     node apps/janela/audit/score.js

   For every COMMIT in certs/janela-ledger/ not yet scored, whose target day has
   been observed (corpus/janela/observed/YYYYMMDD.json), find the pass at the
   commit's site whose mid-time is nearest the target time and within 3 h; if
   there is one, SCORE the commit with that pass's exact mean Hs
   (instruments/forecast/ledger.js: exact Winkler score, covered or not, never
   rescored). A commit with no such pass stays unscored for good: pass times do
   not depend on the forecast. Prints the record and the admission state of
   each proposer — trials, looks and bars as placar.js defines them, the one
   definition the method page and the app read too.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const path = require('path');
const L = require('../../../instruments/forecast/ledger.js');
const P = require('./placar.js');

const ROOT = path.join(__dirname, '..', '..', '..');
const LEDGER = path.join(ROOT, 'certs', 'janela-ledger');
const OBS = path.join(ROOT, 'corpus', 'janela', 'observed');
const WINDOW_MS = 3 * 3600e3;

function observedDay(day) {
  const p = path.join(OBS, day.replace(/-/g, '') + '.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

function main() {
  const now = new Date().toISOString().slice(0, 19) + 'Z';
  const files = fs.existsSync(LEDGER) ? fs.readdirSync(LEDGER).filter((f) => /^\d{6}\.jsonl$/.test(f)).sort() : [];
  const cache = {};
  let scored = 0, waiting = 0, nopass = 0;
  for (const f of files) {
    const p = path.join(LEDGER, f);
    const rows = L.rows(p);
    const done = new Set(rows.filter((r) => r.type === 'score').map((r) => r.id));
    for (const c of rows.filter((r) => r.type === 'commit' && !done.has(r.id))) {
      const sid = c.id.split(':')[1];
      const t = Date.parse(c.targetTime);
      /* the pass may fall on the target day or the next/previous one (3 h window across midnight) */
      const days = [new Date(t - WINDOW_MS), new Date(t), new Date(t + WINDOW_MS)].map((d) => d.toISOString().slice(0, 10));
      const obs = [...new Set(days)].map((d) => (cache[d] = cache[d] === undefined ? observedDay(d) : cache[d]));
      if (obs.some((o) => o === null)) { waiting++; continue; }
      let best = null;
      for (const o of obs) for (const ps of (o.passes[sid] || [])) {
        const dt = Math.abs(Date.parse(ps.tMid) - t);
        if (dt <= WINDOW_MS && (!best || dt < best.dt)) best = { dt, ps, day: o.date };
      }
      if (!best) { nopass++; continue; }
      const [num, den] = best.ps.hs.split('/');
      L.score(p, c.id, [num, den || '1'], { at: now });
      scored++;
    }
  }
  /* the record and admission, per proposer (placar.js: one trial per target day, looks at 30·2^j) */
  const all = [].concat(...files.map((f) => L.rows(path.join(LEDGER, f))));
  console.log('janela score: ' + scored + ' newly scored, ' + waiting + ' waiting for observations, ' + nopass + ' with no pass within 3 h');
  for (const p of Object.values(P.record(all))) {
    const a = p.admission;
    const last = a.looks[a.looks.length - 1];
    console.log('  ' + p.domain + ': ' + p.commits + ' commits, ' + p.scored + ' scored, ' + p.covered + ' covered (rows); '
      + a.trials + ' trial days, ' + a.trialsCovered + ' covered — ' + a.status
      + (a.pending ? ' (pending: first look at ' + P.FIRST_LOOK + ' trial days)' : ' (look at ' + last.m + ': tail ' + last.tail + ' vs bar ' + last.bar + ')'));
  }
}

main();
