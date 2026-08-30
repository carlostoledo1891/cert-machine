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

/* ---- the per-proposer record, recomputed exactly from the ledger ----------
   opts.asOf (a unix instant) restricts the record to what was KNOWN then: only
   scores settled strictly before that moment count. board() with no options is
   the record as of now, which is what the CLI and the page show; the audit
   below walks the ledger and asks for the board as of each commit, which is the
   only way to ask whether a commit was legitimate WHEN IT WAS MADE. One
   function, so the live rule and the historical audit can never drift apart. */
function board(opts) {
  const asOf = opts && opts.asOf;
  const ledger = (opts && opts.ledger) || LEDGER;
  const rows = L.rows(ledger).filter((r) => {
    if (asOf === undefined) return true;
    if (r.type === 'score') return r.at < asOf;      /* a score settles at r.at */
    return r.madeAt < asOf;
  });
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

/* ---- THE ADMISSION GATE — the ONE definition of "may this proposer commit?"
   Both consumers pass through here: the house loop below and the frontier-model
   campaign (tools/forecast-gym-campaign.js). It used to be an inline check in
   the house loop only, which meant a DEADMITTED model could still be queried
   AND committed by the campaign — the prune rule held for three proposers and
   quietly did not hold for the ones it was written for. A rule defined once is
   the whole point (CLAUDE.md); this is that one place.                       */
function admissionGate(name, b) {
  const rec = (b || board())[name];
  if (!rec) return { allowed: true, why: 'no record yet — admission is lost by record, never by opinion' };
  if (rec.admission.status === 'DEADMITTED') return { allowed: false, why: rec.admission.text };
  return { allowed: true, why: rec.admission.text };
}

/* ---- THE RECORD-LEVEL INVARIANT, audited from the ledger alone ------------
   The gate above is code, and code can be bypassed by the next tool somebody
   writes. This is the property that does not depend on any caller:

       no commit exists from a proposer that was ALREADY DEADMITTED at the
       instant that commit was made.

   Replay the ledger in commit order; for each commit ask for the board as of
   its own madeAt — the scores that had settled by then, nothing later — and
   require that the proposer was admitted at that moment. A violation means the
   ledger itself is corrupt, whoever wrote it and however it was written. The
   report page gates on this, so a bad row cannot be published.              */
function auditAdmissionHistory(ledgerPath) {
  const ledger = ledgerPath || LEDGER;
  const rows = L.rows(ledger);
  const commits = rows.filter((r) => r.type === 'commit').slice().sort((a, b) => a.madeAt - b.madeAt);
  const violations = [];
  for (const c of commits) {
    const name = c.id.slice(0, c.id.indexOf(':'));
    const asOf = board({ ledger, asOf: c.madeAt })[name];
    if (asOf && asOf.admission.status === 'DEADMITTED') {
      violations.push({ id: c.id, madeAt: c.madeAt, scored: asOf.scored, covered: asOf.covered,
        claim: asOf.claim, tail: asOf.admission.tailStr, text: asOf.admission.text });
    }
  }
  return { commits: commits.length, violations };
}

function commit(dates) {
  const all = series();
  const madeAt = Math.floor(Date.now() / 1000);
  const b = board();
  for (const targetDate of dates) {
    const targetTime = dayEndUtc(targetDate);
    for (const [name, propose] of Object.entries(PROPOSERS)) {
      const g = admissionGate(name, b);
      if (!g.allowed) { console.log('SKIP ' + name + ' (' + targetDate + '): ' + g.why); continue; }
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

module.exports = { board, PROPOSERS, LEDGER, admissionGate, auditAdmissionHistory };

if (require.main === module) {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === 'commit') commit(args);
  else if (cmd === 'score') score(args[0]);
  else if (cmd === 'record') console.log(JSON.stringify(board(), null, 1));
  else { console.log('usage: node tools/forecast-gym.js commit|score YYYY-MM-DD · record'); process.exit(2); }
}
