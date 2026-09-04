/* anthropic.js — a raw-HTTP Anthropic client for the environments harness.
   instruments/envs · cert-machine

   WHY RAW HTTP AND NOT THE SDK. This repository ships with NO npm dependencies,
   and that is a published claim on three pages of the site — the About page's
   standard says "the repository is public under MIT with no dependencies", and
   the reproduction argument in the paper rests on it. Adding a package to run a
   pilot would falsify a claim we make about ourselves, which is a worse trade
   than writing forty lines of fetch. The wire format below follows the
   documented Messages API; nothing here is guessed.

   AUTH. The machine has an `ant auth login` profile rather than an API key, so
   the token is fetched per run with `ant auth print-credentials --access-token`
   and sent as a bearer with the OAuth beta header. The token is short-lived and
   is never written to disk by this file.

   MODEL RULES honoured here, from the current API:
     · Claude Opus 5 / Sonnet 5 REJECT temperature / top_p / top_k with a 400 —
       so no sampling parameter is sent at all. The bench harness's temperature
       field is deliberately ignored for these models and recorded as null.
     · `budget_tokens` is removed on the 5-family; no thinking config is sent,
       which leaves each model on its own default (Opus 5 and Sonnet 5 run
       adaptive thinking; Haiku 4.5 runs without). That difference is REAL and
       is recorded per row rather than papered over.
     · stop_reason 'refusal' is a 200 with no usable content — recorded as a
       refusal of its own kind, never as a wrong answer.
     · stop_reason 'max_tokens' means OUR cap truncated the reply. That is a
       harness artifact, not a model outcome, and rows carrying it are excluded
       from pass rates exactly as the eval board excludes its budget-exhausted
       replies. */
'use strict';
const cp = require('child_process');

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const VERSION = '2023-06-01';

let _token = null;
function token() {
  if (_token) return _token;
  if (process.env.ANTHROPIC_API_KEY) return (_token = { kind: 'key', value: process.env.ANTHROPIC_API_KEY });
  const out = cp.execSync('ant auth print-credentials --access-token', { encoding: 'utf8' }).trim();
  if (!out) throw new Error('no Anthropic credential: set ANTHROPIC_API_KEY or run `ant auth login`');
  return (_token = { kind: 'oauth', value: out });
}

/* per-million-token prices, first-party API. Used by the budget guard; a model
   with no row here cannot be called, because an uncosted call cannot be capped. */
const PRICES = {
  'claude-opus-5': { in: 5, out: 25 },
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5': { in: 1, out: 5 }
};

function priceOf(model) {
  const p = PRICES[model];
  if (!p) throw new Error('anthropic.js: no price on record for ' + model + ' — refusing to make an uncosted call');
  return p;
}
const costOf = (model, inTok, outTok) => {
  const p = priceOf(model);
  return (inTok * p.in + outTok * p.out) / 1e6;
};
/* the most a single call can cost, used to RESERVE against the cap before it runs */
const worstCase = (model, promptTokens, maxTokens) => costOf(model, promptTokens + 200, maxTokens);

function anthropicModel(id, { model, maxTokens = 4096, effort = null }) {
  if (!PRICES[model]) throw new Error('anthropicModel: unpriced model ' + model);
  return {
    id, kind: 'anthropic', model, temperature: null, effort, maxTokens,
    async complete(prompt) {
      if (process.env.ENVS_ALLOW_NETWORK !== '1')
        throw new Error('network is disabled: a model call would send the prompt off this machine. '
          + 'Set ENVS_ALLOW_NETWORK=1 to allow it (a deliberate, per-run decision).');
      const t = token();
      const headers = {
        'content-type': 'application/json',
        'anthropic-version': VERSION,
        ...(t.kind === 'oauth'
          ? { authorization: 'Bearer ' + t.value, 'anthropic-beta': 'oauth-2025-04-20' }
          : { 'x-api-key': t.value })
      };
      const body = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] };
      if (effort) body.output_config = { effort };
      const res = await fetch(ENDPOINT, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) {
        const txt = (await res.text()).slice(0, 300);
        const err = new Error(id + ': HTTP ' + res.status + ' ' + txt);
        err.status = res.status;
        err.outOfCredit = res.status === 402 || /credit|quota|billing/i.test(txt);
        throw err;
      }
      const j = await res.json();
      const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
      return {
        text,
        inTok: j.usage?.input_tokens ?? 0,
        outTok: j.usage?.output_tokens ?? 0,
        stopReason: j.stop_reason || null,
        refused: j.stop_reason === 'refusal',
        truncated: j.stop_reason === 'max_tokens',
        servedBy: j.model || model
      };
    }
  };
}

module.exports = { anthropicModel, PRICES, priceOf, costOf, worstCase };
