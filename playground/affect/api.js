/* api.js — the three models, and the two things every probe does.
   Factored out of probe.js so the mood probe cannot drift from it. */
'use strict';
const { execFileSync } = require('child_process');

/* `effort` is not universal: Haiku 4.5 answers "This model does not support the
   effort parameter" and fails every call if you send it. Capability per model,
   not per family — this cost 42 silent retries to learn. */
const MODELS = [
  { id: 'claude-opus-5', label: 'Opus 5', short: 'O', effort: true, inUSD: 5e-6, outUSD: 25e-6 },
  { id: 'claude-sonnet-5', label: 'Sonnet 5', short: 'S', effort: true, inUSD: 2e-6, outUSD: 10e-6 },
  { id: 'claude-haiku-4-5', label: 'Haiku 4.5', short: 'H', effort: false, inUSD: 1e-6, outUSD: 5e-6 },
];

function auth() {
  if (process.env.ANTHROPIC_API_KEY) return { kind: 'key', value: process.env.ANTHROPIC_API_KEY };
  try { return { kind: 'oauth', value: execFileSync('ant', ['auth', 'print-credentials', '--access-token'], { encoding: 'utf8' }).trim() }; }
  catch { throw new Error('no active Anthropic credential — run `ant auth login`, or export ANTHROPIC_API_KEY'); }
}

async function ask(M, text, A, scale) {
  const headers = { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' };
  if (A.kind === 'oauth') { headers.authorization = `Bearer ${A.value}`; headers['anthropic-beta'] = 'oauth-2025-04-20'; }
  else headers['x-api-key'] = A.value;
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST', headers,
    body: JSON.stringify(Object.assign({ model: M.id, max_tokens: 1500, messages: [{ role: 'user', content: text }] },
      M.effort ? { output_config: { effort: 'low' } } : {})),
  });
  if (!r.ok) { const e = new Error(`${r.status}`); e.status = r.status; e.body = (await r.text()).slice(0, 200); throw e; }
  const j = await r.json();
  const t = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  const m = t.match(/-?\d+/);
  return { n: m ? Math.max(0, Math.min(scale, parseInt(m[0], 10))) : null, usage: j.usage, text: t };
}

/* thousands of independent calls, none of which depend on each other */
async function pool(tasks, n, onTick) {
  const out = new Array(tasks.length);
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= tasks.length) return;
      out[i] = await tasks[i]();
      if (onTick) onTick(++done, tasks.length);
    }
  }));
  return out;
}

/* A 400 is the model or the account telling you something that will be just as
   true in 700ms. Retrying it burned four attempts on every one of thousands of
   remaining calls when the credit balance ran out — fifteen minutes of backoff
   to learn something the first response already said. Rate limits and 5xx are
   transient; nothing else is, and a fatal one stops the whole run rather than
   filling the output with zeros that later look like answers. */
class Fatal extends Error {}
const transient = (e) => e.status === 429 || (e.status >= 500 && e.status < 600) || !e.status;

/* one retrying call, with its spend booked */
function makeAsker(A, scale, spend) {
  return async (M, text) => {
    for (let k = 0; k < 4; k++) {
      try {
        const r = await ask(M, text, A, scale);
        spend[M.id].in += r.usage.input_tokens; spend[M.id].out += r.usage.output_tokens;
        if (r.n !== null) return r.n;
      } catch (e) {
        if (!transient(e)) throw new Fatal(`${M.label} ${e.status}: ${e.body}`);
        if (k === 3) { spend[M.id].fail++; if (spend[M.id].fail === 1) console.log(`\n  ! ${M.label} ${e.status}: ${e.body}`); return null; }
        await new Promise(z => setTimeout(z, 700 * (k + 1) * (e.status === 429 ? 3 : 1)));
      }
    }
    spend[M.id].fail++; return null;
  };
}

const blankSpend = () => Object.fromEntries(MODELS.map(m => [m.id, { in: 0, out: 0, fail: 0 }]));
const priceOut = (spend) => MODELS.map(m => ({ id: m.id, label: m.label, ...spend[m.id],
  usd: +(spend[m.id].in * m.inUSD + spend[m.id].out * m.outUSD).toFixed(3) }));

module.exports = { MODELS, auth, ask, pool, makeAsker, blankSpend, priceOut, Fatal };
