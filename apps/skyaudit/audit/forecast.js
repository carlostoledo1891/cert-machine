/* forecast.js — the SkyAudit adapter for instruments/forecast: turns the
   pinned day series into calibration values, commits interval forecasts
   to the ledger BEFORE the target day exists, scores them after.
   apps/skyaudit · cert-machine

   The adapter owns the exchangeability story (the theorem's hypothesis):
   days are grouped WEEKDAY vs WEEKEND — the day-stability measurement
   (nyc.compare.json) showed the two populations differ by 2x, so mixing
   them would void the hypothesis on purpose. Within a group, days are
   treated as exchangeable; that is a stated modeling judgment, printed
   into every commit, not a proof.

   Vocabulary (doctrine): these are FORECASTS. The certificate covers the
   coverage arithmetic and the ledger accounting — never the outcome.

   usage: node forecast.js commit YYYY-MM-DD   (target day, not yet flown)
          node forecast.js score  YYYY-MM-DD   (target day now summarized)
          node forecast.js record                                          */
'use strict';

const fs = require('fs');
const path = require('path');
const { interval } = require('../../../instruments/forecast/conformal.js');
const L = require('../../../instruments/forecast/ledger.js');

const DATA = path.join(__dirname, '../data');
const LEDGER = path.join(__dirname, '../../../certs/skyaudit-forecast-ledger.jsonl');
const CITY = 'nyc';
const BETA = 'beta-alia|faa-sfar-vfr';

const dow = (date) => new Date(date + 'T12:00:00Z').getUTCDay();      /* 0=Sun..6=Sat */
const isWeekend = (date) => [0, 6].includes(dow(date));
const dayEndUtc = (date) => Math.floor(Date.parse(date + 'T00:00:00Z') / 1000) + 86400;

function series() {
  const out = [];
  for (const d of fs.readdirSync(DATA).filter((x) => /^day-\d{4}-\d{2}-\d{2}$/.test(x)).sort()) {
    const p = path.join(DATA, d, CITY + '.audit-summary.json');
    if (!fs.existsSync(p)) continue;
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    out.push({ date: d.slice(4), flights: s.flights, eflyable: s.bySpecRule[BETA].CERTIFIED });
  }
  return out;
}

function calibration(targetDate) {
  const wk = isWeekend(targetDate);
  const group = series().filter((s) => s.date !== targetDate && isWeekend(s.date) === wk);
  return { group, kind: wk ? 'weekend' : 'weekday' };
}

function commit(targetDate) {
  const { group, kind } = calibration(targetDate);
  const madeAt = Math.floor(Date.now() / 1000);
  const targetTime = dayEndUtc(targetDate);
  if (madeAt >= targetTime) throw new Error('REFUSED: ' + targetDate + ' is already over — a forecast now would be backdated');
  /* the widest provable claim for this n: miss-rate 2/(n+1) */
  const n = group.length;
  if (n < 2) throw new Error('REFUSED: ' + kind + ' group has ' + n + ' day(s) — no coverage is provable below n = 2');
  const alpha = [2, n + 1];
  for (const key of ['flights', 'eflyable']) {
    const cert = interval(group.map((g) => g[key]), alpha[0], alpha[1]);
    if (cert.verdict !== 'CERTIFIED-COVERAGE') throw new Error('REFUSED: ' + cert.why);
    const row = L.commit(LEDGER, {
      id: CITY + ':' + targetDate + ':' + key,
      domain: 'skyaudit/' + CITY, target: key, madeAt, targetTime,
      forecast: { lo: Number(cert.loStr), hi: Number(cert.hiStr), alpha,
        coverage: cert.coverageStr, n,
        hypothesis: 'days exchangeable WITHIN the ' + kind + ' group (grouping chosen from the measured '
          + 'weekday/weekend 2x split, nyc.compare.json); calibration days: ' + group.map((g) => g.date).join(', ') },
    });
    console.log('COMMITTED ' + row.id + ': [' + cert.loStr + ', ' + cert.hiStr + '] · proved coverage '
      + cert.coverageStr + ' (grows with the corpus) · sha ' + row.payloadSha256.slice(0, 12));
  }
}

function scoreDay(targetDate) {
  const p = path.join(DATA, 'day-' + targetDate, CITY + '.audit-summary.json');
  if (!fs.existsSync(p)) throw new Error('REFUSED: no summary for ' + targetDate + ' — ingest it first');
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  const outcomes = { flights: s.flights, eflyable: s.bySpecRule[BETA].CERTIFIED };
  const at = Math.floor(Date.now() / 1000);
  for (const key of ['flights', 'eflyable']) {
    const row = L.score(LEDGER, CITY + ':' + targetDate + ':' + key, outcomes[key], { at });
    console.log('SCORED ' + row.id + ': outcome ' + outcomes[key] + ' · covered ' + row.covered + ' · Winkler ' + row.winkler);
  }
  console.log('lifetime record: ' + JSON.stringify(L.record(LEDGER)));
}

module.exports = { series, calibration };

if (require.main === module) {
  const [cmd, date] = process.argv.slice(2);
  if (cmd === 'commit') commit(date);
  else if (cmd === 'score') scoreDay(date);
  else if (cmd === 'record') console.log(JSON.stringify(L.record(LEDGER), null, 1));
  else { console.log('usage: node forecast.js commit|score YYYY-MM-DD · record'); process.exit(2); }
}
