#!/usr/bin/env node
/* forecast-gym-campaign.js — CAMPAIGN v1: frontier models enter the Gym.
   cert-machine · tools

   Each model receives the same pinned context pack (the day series,
   sha256-named in every resulting commit) and returns one slate: a single
   claimed coverage plus a central interval per target day and quantity.
   The scoring rule and the admission rule are IN the prompt — a proper
   score means telling the forecaster how it is paid is what makes
   honesty its optimal policy.

   Copy-honesty: every model is queried BEFORE any slate is committed or
   published, so no proposal can inform another; the shared madeAt batch
   timestamp records that. (Sealed commits remain the path for
   third-party asynchronous entries.)

   A slate that fails strict validation after 3 attempts does not enter —
   the Gym has no malformed rows; non-entry is stated in the campaign
   transcript instead.

   Auth: ANTHROPIC_API_KEY if set, else the `ant auth login` OAuth
   profile (resolved in-process, never printed — the post-leak protocol).

   usage: node tools/forecast-gym-campaign.js --dry     (query + validate only)
          node tools/forecast-gym-campaign.js --commit  (the campaign)        */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments/forecast/ledger.js'));
const { LEDGER, board, admissionGate } = require(path.join(ROOT, 'tools/forecast-gym.js'));
const { series } = require(path.join(ROOT, 'apps/skyaudit/audit/forecast.js'));

const MODELS = ['claude-opus-5', 'claude-sonnet-5', 'claude-haiku-4-5-20251001'];
/* The uncommitted window. A target already on the ledger is refused as a
   duplicate commit — correctly — but the API call to produce it is paid for
   before the ledger ever sees it, so a stale TARGETS list spends money to
   generate rows that cannot land. Check the ledger before every campaign. */
const TARGETS = ['2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06', '2026-09-07', '2026-09-08'];
const KEYS = ['flights', 'eflyable'];
const CITY = 'nyc';

const dayEndUtc = (date) => Math.floor(Date.parse(date + 'T00:00:00Z') / 1000) + 86400;
const dowName = (date) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date + 'T12:00:00Z').getUTCDay()];
const canon = (o) => JSON.stringify(o, Object.keys(o).sort());
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/* ---- the context pack: pinned, sha-named in every commit ------------------ */
const all = series();
const pack = {
  what: 'daily rotorcraft counts over NYC from the adsb.lol pinned public record (cert-machine SkyAudit): '
    + 'flights = distinct certified rotorcraft flights that UTC day; eflyable = the subset certified '
    + 'E-FLYABLE under the pinned aircraft-spec/rule pair beta-alia|faa-sfar-vfr',
  series: all.map((s) => ({ date: s.date, dow: dowName(s.date), flights: s.flights, eflyable: s.eflyable })),
  observed: 'weekday and weekend populations differ by roughly 2x in this record',
  targets: TARGETS.map((d) => ({ date: d, dow: dowName(d) }))
};
const packJson = JSON.stringify(pack, null, 1);
const packSha = sha256(canon(pack));

const PROMPT = 'You are a forecaster entering THE FORECAST GYM, a public forecasting evaluation with exact '
  + 'scoring (cert-machine). Your forecasts will be sha256-committed to an append-only public ledger BEFORE '
  + 'the outcome days exist, then scored when each day\'s data is published.\n\n'
  + 'THE DATA (pinned context pack):\n' + packJson + '\n\n'
  + 'THE TASK: for every target date and both quantities, give a central interval [lo, hi] (integers, '
  + 'lo <= hi), plus ONE coverage claim for your whole slate, as a fraction string like "4/5".\n\n'
  + 'HOW YOU ARE PAID (so you can be exactly honest): each forecast is scored by the Winkler interval score '
  + 'at alpha = 1 - your claimed coverage: score = (hi - lo) + (2/alpha) * distance-outside-if-missed, in '
  + 'exact rational arithmetic; LOWER IS BETTER. This score is strictly proper: your expected score is '
  + 'minimized by reporting your true central interval at your true coverage. ADMISSION is prune-only: if '
  + 'your covered/scored record becomes exactly-improbable under your own claimed coverage (binomial tail '
  + '<= 1/20, computed exactly), you are DEADMITTED from further commits. Over-claiming coverage gets you '
  + 'pruned; under-claiming wastes width. Honesty is the optimal policy.\n\n'
  + 'Reply with STRICT JSON ONLY, no prose, no code fences, exactly this shape:\n'
  + '{"claim": "p/q", "forecasts": {"YYYY-MM-DD": {"flights": [lo, hi], "eflyable": [lo, hi]}, ...}}\n'
  + 'with one entry per target date.';

/* ---- auth + transport ----------------------------------------------------- */
function getAuth() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) return { headers: () => ({ 'x-api-key': key }) };
  const tok = () => execSync('ant auth print-credentials --access-token', { encoding: 'utf8' }).trim();
  let token = tok();
  return {
    headers: () => ({ Authorization: 'Bearer ' + token, 'anthropic-beta': 'oauth-2025-04-20' }),
    refresh: () => { token = tok(); }
  };
}

/* Published per-MTok rates, cached 2026-06-24. They are here to turn a run into
   a number we can check against the budget, not to be authoritative: the
   invoice is. Every run prints what it actually consumed. */
const RATES = {
  'claude-opus-5': { in: 5, out: 25 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5-20251001': { in: 1, out: 5 },
};
const SPEND = [];
function chargeOf(model, u) {
  const r = RATES[model] || { in: 0, out: 0 };
  const cin = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);
  return { model, in: cin, out: u.output_tokens || 0,
    usd: (cin * r.in + (u.output_tokens || 0) * r.out) / 1e6 };
}

async function ask(auth, model) {
  /* 8192: a thinking model can spend a small cap entirely on deliberation and
     return empty text — a harness artifact, not a model outcome (the matmul
     eval's measured lesson) */
  const body = JSON.stringify({ model, max_tokens: 8192, messages: [{ role: 'user', content: PROMPT }] });
  let last = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', ...auth.headers() },
        body
      });
      if (r.status === 401 && auth.refresh) { auth.refresh(); throw new Error('401 (token refreshed)'); }
      if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + (await r.text()).slice(0, 200));
      const data = await r.json();
      if (data.usage) {
        const c = chargeOf(model, data.usage);
        SPEND.push(c);
        console.log('  usage ' + model + ': in ' + c.in + ' out ' + c.out + ' -> $' + c.usd.toFixed(4));
      }
      return data.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    } catch (e) { last = e; await new Promise((res) => setTimeout(res, 2 ** attempt * 1000)); }
  }
  throw new Error('API failed after 5 attempts for ' + model + ': ' + last);
}

/* ---- strict slate validation ---------------------------------------------- */
function parseSlate(text) {
  const stripped = text.replace(/^```(json)?\s*/m, '').replace(/```\s*$/m, '').trim();
  const j = JSON.parse(stripped);
  const m = /^(\d+)\/(\d+)$/.exec(String(j.claim));
  if (!m) throw new Error('claim is not a fraction p/q');
  const [p, q] = [Number(m[1]), Number(m[2])];
  if (!(p > 0 && p < q)) throw new Error('claim must satisfy 0 < p/q < 1');
  const out = { claim: [p, q], forecasts: {} };
  for (const d of TARGETS) {
    const f = j.forecasts && j.forecasts[d];
    if (!f) throw new Error('missing target ' + d);
    for (const k of KEYS) {
      const iv = f[k];
      if (!Array.isArray(iv) || iv.length !== 2 || !Number.isInteger(iv[0]) || !Number.isInteger(iv[1]) || iv[0] > iv[1])
        throw new Error('bad interval for ' + d + ':' + k);
    }
    out.forecasts[d] = { flights: f.flights, eflyable: f.eflyable };
  }
  return out;
}

/* ---- the campaign --------------------------------------------------------- */
(async () => {
  const mode = process.argv[2];
  if (mode !== '--dry' && mode !== '--commit') {
    console.log('usage: node tools/forecast-gym-campaign.js --dry | --commit [model ...]'); process.exit(2);
  }
  const only = process.argv.slice(3);
  const models = only.length ? MODELS.filter((m) => only.includes(m)) : MODELS;
  console.log('context pack sha256 ' + packSha + ' · ' + all.length + ' calibration days · '
    + TARGETS.length + ' targets x ' + KEYS.length + ' quantities');
  const auth = getAuth();
  /* the board is read ONCE, before any model is queried, so every model in this
     run faces the same record — and so a proposer the rule has already pruned
     never reaches the network */
  const BOARD = board();

  /* collect every slate BEFORE committing any — nothing to copy */
  const slates = {};
  for (const model of models) {
    let slate = null, why = null;
    const g = admissionGate(model, BOARD);
    if (!g.allowed) {
      /* Skipping here is the point: a DEADMITTED proposer is not merely refused
         at the ledger, it is never QUERIED. Enforcing a prune only at commit
         time means paying for the call that the rule already forbids. */
      console.log(model + ': SKIPPED, not queried — ' + g.why);
      continue;
    }
    for (let tries = 0; tries < 3 && !slate; tries++) {
      try {
        const text = await ask(auth, model);
        slate = parseSlate(text);
      } catch (e) { why = String(e.message).slice(0, 120); }
    }
    if (slate) {
      slates[model] = slate;
      console.log(model + ': slate valid · claim ' + slate.claim.join('/'));
      for (const d of TARGETS) console.log('  ' + d + ' flights [' + slate.forecasts[d].flights + '] eflyable [' + slate.forecasts[d].eflyable + ']');
    } else {
      console.log(model + ': DID NOT ENTER after 3 attempts — ' + why);
    }
  }
  const total = SPEND.reduce((a, c) => a + c.usd, 0);
  console.log('SPEND THIS RUN: ' + SPEND.length + ' billed call(s), '
    + SPEND.reduce((a, c) => a + c.in, 0) + ' in / ' + SPEND.reduce((a, c) => a + c.out, 0)
    + ' out tokens, $' + total.toFixed(4) + ' at cached rates');
  if (mode === '--dry') { console.log('dry run: nothing committed'); return; }

  const madeAt = Math.floor(Date.now() / 1000);
  const commitBoard = board();          /* re-read: scoring may have run since */
  for (const [model, slate] of Object.entries(slates)) {
    const cg = admissionGate(model, commitBoard);
    if (!cg.allowed) { console.log('REFUSED all commits for ' + model + ' — ' + cg.why); continue; }
    const [p, q] = slate.claim;
    for (const d of TARGETS) {
      const targetTime = dayEndUtc(d);
      if (madeAt >= targetTime) { console.log('SKIP ' + model + ':' + d + ' — target already closed'); continue; }
      for (const k of KEYS) {
        const [lo, hi] = slate.forecasts[d][k];
        const row = L.commit(LEDGER, {
          id: model + ':' + CITY + ':' + d + ':' + k,
          domain: 'gym/skyaudit-' + CITY + '/' + model,
          target: k, madeAt, targetTime,
          forecast: { lo, hi, alpha: [q - p, q], coverage: [p, q], model,
            method: 'frontier-model campaign v1: one-shot slate, all models queried before any commit was '
              + 'published; context pack sha256 ' + packSha + '; coverage claim chosen by the model' }
        });
        console.log('COMMITTED ' + row.id + ': [' + lo + ', ' + hi + '] claiming ' + p + '/' + q
          + ' · sha ' + row.payloadSha256.slice(0, 12));
      }
    }
  }
})().catch((e) => { console.error('CAMPAIGN ABORTED: ' + e.message); process.exit(1); });
