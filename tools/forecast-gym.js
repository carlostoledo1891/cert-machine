#!/usr/bin/env node
/* forecast-gym.js — THE FORECAST GYM: the contamination-impossible
   forecasting eval. cert-machine · tools

   The thesis: the future is the only test set that cannot leak. Every
   proposer's forecast is COMMITTED to an append-only ledger — sha256,
   madeAt strictly before targetTime — before the outcome exists, and
   SCORED afterward with the Winkler interval score in exact rationals
   (a proper score: honest quantiles are the optimal policy, so the
   reward cannot be gamed). Admission is prune-only: a proposer whose
   covered/scored record is exactly-improbably bad under its own claimed
   coverage is DEADMITTED (instruments/forecast/admission.js — the exact
   binomial tail is the certificate).

   Pack v1: SkyAudit NYC daily counts (flights, e-flyable), riding the
   pinned day series. The pack is the swappable part; the gym mechanics
   are the asset.

   House proposers, deterministic from the pinned series (rerunnable):
     conformal    claims only what it proves: exact-conformal interval at
                  the smallest provable miss-rate 2/(n+1) over the
                  weekday/weekend group (the theorem's coverage);
                  REFUSES a group too small to prove anything.
     persistence  the forced dumb baseline: yesterday's value as a point
                  interval, claiming 1/2 — overconfident by design; the
                  admission rule is expected to prune it, in public.
     range        the hedger: min..max of every observed day, claiming
                  9/10 — wide intervals survive on coverage and pay for
                  it in Winkler score.

   usage: node tools/forecast-gym.js commit YYYY-MM-DD [YYYY-MM-DD ...]
          node tools/forecast-gym.js score  YYYY-MM-DD
          node tools/forecast-gym.js record            (per-proposer board)

   Model proposers enter the same ledger via sealed commits (payload
   hidden behind its sha until scoring — nobody can copy a forecast);
   campaigns are operator-gated spend, like every eval campaign here.     */
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { interval } = require(path.join(ROOT, 'instruments/forecast/conformal.js'));
const L = require(path.join(ROOT, 'instruments/forecast/ledger.js'));
const A = require(path.join(ROOT, 'instruments/forecast/admission.js'));
const { series } = require(path.join(ROOT, 'apps/skyaudit/audit/forecast.js'));

const LEDGER = process.env.FORECAST_GYM_LEDGER || path.join(ROOT, 'certs', 'forecast-gym-ledger.jsonl');
const CITY = 'nyc';
const KEYS = ['flights', 'eflyable'];
const BETA = 'beta-alia|faa-sfar-vfr';

const dow = (date) => new Date(date + 'T12:00:00Z').getUTCDay();
const isWeekend = (date) => [0, 6].includes(dow(date));
const dayEndUtc = (date) => Math.floor(Date.parse(date + 'T00:00:00Z') / 1000) + 86400;

/* ---- the proposers: (series, targetDate, key) -> forecast | null(refused) --
   Each returns {lo, hi, alpha, coverage, method} — `coverage` is the
   proposer's CLAIM (what admission holds it to); only conformal's claim
   is a theorem, and its payload says so. */
const PROPOSERS = {
  conformal(all, targetDate, key) {
    const wk = isWeekend(targetDate);
    const group = all.filter((s) => s.date !== targetDate && isWeekend(s.date) === wk);
    const n = group.length;
    if (n < 2) return { refused: 'the ' + (wk ? 'weekend' : 'weekday') + ' group has ' + n + ' day(s) — no coverage is provable below n = 2' };
    const cert = interval(group.map((g) => g[key]), 2, n + 1);
    if (cert.verdict !== 'CERTIFIED-COVERAGE') return { refused: cert.why };
    return { lo: Number(cert.loStr), hi: Number(cert.hiStr), alpha: [2, n + 1],
      coverage: cert.coverage.map(String).map(Number), method: 'exact conformal over the '
        + (wk ? 'weekend' : 'weekday') + ' group (' + group.map((g) => g.date).join(', ')
        + '); claimed coverage IS the certified coverage ' + cert.coverageStr };
  },
  persistence(all, targetDate, key) {
    const last = all[all.length - 1];
    const y = last[key];
    return { lo: y, hi: y, alpha: [1, 2], coverage: [1, 2],
      method: 'forced dumb baseline: last observed day (' + last.date + ') as a point interval, claiming 1/2' };
  },
  range(all, targetDate, key) {
    const vals = all.map((s) => s[key]);
    return { lo: Math.min(...vals), hi: Math.max(...vals), alpha: [1, 10], coverage: [9, 10],
      method: 'the hedger: min..max of all ' + all.length + ' observed days, claiming 9/10 — width is paid in Winkler' };
  }
};

/* ---- the per-proposer record, recomputed exactly from the ledger ---------- */
function board() {
  const rows = L.rows(LEDGER);
  const out = {};
  /* proposers = the house three ∪ whoever has committed (model campaigns
     enter under their model id; the board discovers them from the ledger) */
  const names = new Set(Object.keys(PROPOSERS));
  for (const r of rows) if (r.type === 'commit') names.add(r.id.slice(0, r.id.indexOf(':')));
  for (const name of names) {
    const commits = rows.filter((r) => r.type === 'commit' && r.id.startsWith(name + ':'));
    const scores = rows.filter((r) => r.type === 'score' && r.id.startsWith(name + ':'));
    /* the claim admission holds a proposer to: the minimum claimed coverage
       across its scored commits (holding it to its weakest promise —
       the conservative direction; heterogeneous claims stay honest) */
    let claim = null;
    const scoredCommits = commits.filter((c) => scores.some((s) => s.id === c.id));
    for (const c of (scoredCommits.length ? scoredCommits : commits)) {
      const cov = c.forecast.coverage.map(Number);
      if (!claim || cov[0] * claim[1] < claim[0] * cov[1]) claim = cov;
    }
    const covered = scores.filter((s) => s.covered).length;
    const verdict = claim
      ? A.admit({ claim, scored: scores.length, covered })
      : { status: 'ADMITTED', tailStr: '1', text: 'ADMITTED: no scored rows yet — admission is lost by record, never by opinion.' };
    out[name] = { commits: commits.length, scored: scores.length, covered,
      claim: claim ? claim.join('/') : null,
      winkler: scores.map((s) => s.winkler),
      admission: verdict };
  }
  return out;
}

function commit(dates) {
  const all = series();
  const madeAt = Math.floor(Date.now() / 1000);
  const b = board();
  for (const targetDate of dates) {
    const targetTime = dayEndUtc(targetDate);
    for (const [name, propose] of Object.entries(PROPOSERS)) {
      if (b[name].admission.status === 'DEADMITTED') {
        console.log('SKIP ' + name + ' (' + targetDate + '): ' + b[name].admission.text);
        continue;
      }
      for (const key of KEYS) {
        const f = propose(all, targetDate, key);
        if (f.refused) { console.log('REFUSED ' + name + ':' + targetDate + ':' + key + ' — ' + f.refused); continue; }
        const row = L.commit(LEDGER, {
          id: name + ':' + CITY + ':' + targetDate + ':' + key,
          domain: 'gym/skyaudit-' + CITY + '/' + name, target: key, madeAt, targetTime, forecast: f });
        console.log('COMMITTED ' + row.id + ': [' + f.lo + ', ' + f.hi + '] claiming ' + f.coverage.join('/')
          + ' · sha ' + row.payloadSha256.slice(0, 12));
      }
    }
  }
}

function score(targetDate) {
  const p = path.join(ROOT, 'apps/skyaudit/data', 'day-' + targetDate, CITY + '.audit-summary.json');
  if (!fs.existsSync(p)) throw new Error('REFUSED: no summary for ' + targetDate + ' — ingest it first');
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  const outcomes = { flights: s.flights, eflyable: s.bySpecRule[BETA].CERTIFIED };
  const at = Math.floor(Date.now() / 1000);
  for (const r of L.rows(LEDGER)) {
    if (r.type !== 'commit' || !r.id.includes(':' + targetDate + ':')) continue;
    if (L.rows(LEDGER).some((x) => x.type === 'score' && x.id === r.id)) continue;
    const row = L.score(LEDGER, r.id, outcomes[r.target], { at });
    console.log('SCORED ' + row.id + ': outcome ' + outcomes[r.target] + ' · covered ' + row.covered + ' · Winkler ' + row.winkler);
  }
  for (const [name, rec] of Object.entries(board())) {
    console.log(name + ': ' + rec.covered + '/' + rec.scored + ' covered · ' + rec.admission.status);
  }
}

module.exports = { board, PROPOSERS, LEDGER };

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'commit') commit(args);
  else if (cmd === 'score') score(args[0]);
  else if (cmd === 'record') console.log(JSON.stringify(board(), null, 1));
  else { console.log('usage: node tools/forecast-gym.js commit|score YYYY-MM-DD · record'); process.exit(2); }
}
