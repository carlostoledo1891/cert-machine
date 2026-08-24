/* generators/llm.js — Anthropic Messages API proposer, behind the same fence.
   ENGINE TOOLING — research/_engine/funnel · ships nowhere · mints nothing.

   TWO HALVES, ONE FILE:

   1. The GENERATOR (module.exports) runs INSIDE the write-fence — a bare vm
      context with no require/fs/process/env. It never sees a key. When the
      host wired a live API (__llm.available), next() builds a Messages API
      request body (JSON-schema-constrained candidate output via a forced tool
      call) and hands it to __llm.call — a host capability. When no key is in
      the env, it runs in MOCK MODE: a deterministic seeded stub, clearly
      labeled mock in every record it produces (mock:true + '[mock]' in the
      hypothesis).

   2. makeHostCall (attached below) runs HOST-SIDE in funnel.js. It reads
      ANTHROPIC_API_KEY from env, keeps the key in a closure — NEVER stored in
      a record, NEVER printed, NEVER passed into the sandbox — and logs every
      request/response body verbatim to experiments/llm-log.jsonl.

   Determinism: mock mode is fully deterministic (battery-verified). A live
   LLM call is not replay-deterministic — the log preserves what actually
   happened; records carry mock:false so nobody mistakes them. The selftest
   battery never exercises the live path (no network in the battery). */
'use strict';

function drawFromSchema(schema, rng) {
  /* deterministic uniform draw from the declarative schema subset */
  if (schema && Array.isArray(schema.enum)) {
    return JSON.parse(JSON.stringify(schema.enum[Math.floor(rng() * schema.enum.length)]));
  }
  switch (schema && schema.type) {
    case 'object': {
      var o = {};
      var props = schema.properties || {};
      var req = schema.required || Object.keys(props);
      for (var i = 0; i < req.length; i++) o[req[i]] = drawFromSchema(props[req[i]], rng);
      return o;
    }
    case 'array': {
      var len = schema.minItems !== undefined ? schema.minItems : (schema.maxItems !== undefined ? schema.maxItems : 2);
      var a = new Array(len);
      for (var j = 0; j < len; j++) a[j] = drawFromSchema(schema.items, rng);
      return a;
    }
    case 'integer': {
      var lo = schema.minimum !== undefined ? schema.minimum : 0;
      var hi = schema.maximum !== undefined ? schema.maximum : 100;
      return lo + Math.floor(rng() * (hi - lo + 1));
    }
    case 'number': {
      var nlo = schema.minimum !== undefined ? schema.minimum : 0;
      var nhi = schema.maximum !== undefined ? schema.maximum : 1;
      return nlo + rng() * (nhi - nlo);
    }
    case 'string': return 'mock';
    case 'boolean': return rng() < 0.5;
    default: throw new Error('llm mock: unsupported schema type ' + String(schema && schema.type));
  }
}

/* Phase 4 steering (scout read 2026-08-20, both mechanics recorded via promptSha):
   - BEST-SHOT PAIR — FunSearch's entire mutation operator: two prior certified
     hits sorted worse-to-better as v0, v1; the model is asked for v2. The sort
     order induces an improvement gradient in-context.
   - FAILURE SIDE-CHANNEL — state.recent now carries WHY each candidate died
     (cascade stage + reason, or the certifier's why); the prompt renders it so
     rejected patterns are not re-proposed blind. */
function buildRequest(state) {
  var lb = state.leaderboard || [];
  var pair = '';
  if (lb.length >= 2) {
    var v0 = lb[lb.length - 1]; /* worst of the shown board */
    var v1 = lb[0];             /* best */
    pair = 'Improvement pair, sorted worse to better — your proposal is v2 and should beat both:\n'
      + 'v0 (score ' + v0.score + '): ' + JSON.stringify(v0.candidate) + '\n'
      + 'v1 (score ' + v1.score + '): ' + JSON.stringify(v1.candidate) + '\n\n';
  }
  return {
    model: state.model || 'claude-sonnet-5',
    max_tokens: 1024,
    /* forced tool call wants its budget in the tool, not in thinking */
    thinking: { type: 'disabled' },
    tools: [{
      name: 'propose_candidate',
      description: 'Propose exactly one new candidate for the certified funnel. The candidate must satisfy the schema; the hypothesis is one line stating why this candidate might certify as HIT.',
      input_schema: {
        type: 'object',
        properties: {
          candidate: state.schema,
          hypothesis: { type: 'string', description: 'one line: why this candidate' }
        },
        required: ['candidate', 'hypothesis']
      }
    }],
    tool_choice: { type: 'tool', name: 'propose_candidate' },
    messages: [{
      role: 'user',
      content: 'You are the proposer inside a certified generate-and-verify funnel. Your proposals are scored '
        + 'and screened by floats but admitted ONLY by an exact certifier — never claim anything, just propose.\n\n'
        + 'Candidate JSON schema:\n' + JSON.stringify(state.schema) + '\n\n'
        + pair
        + 'Current leaderboard (certified hits, best first):\n' + JSON.stringify(lb) + '\n\n'
        + 'Recent candidates with outcomes (candidate, score, screenPass, certVerdict, why it died if it did):\n'
        + JSON.stringify(state.recent || []) + '\n\n'
        + 'Do not re-propose a pattern whose "why" shows it already failed. '
        + 'Propose ONE new candidate (not a duplicate of the leaderboard) via the propose_candidate tool.'
    }]
  };
}

module.exports = {
  name: 'llm',

  init: function (ctx) {
    if (!ctx || !ctx.schema) throw new Error('llm: init needs ctx.schema (the candidateSchema)');
    return { schema: ctx.schema, calls: 0, mock: !ctx.llmAvailable };
  },

  next: function (state, rng) {
    if (state.mock) {
      var candidate = drawFromSchema(state.schema, rng);
      return {
        candidate: candidate,
        mock: true,
        hypothesis: '[mock] deterministic seeded draw from candidateSchema (no ANTHROPIC_API_KEY in env)',
        state: { schema: state.schema, calls: state.calls + 1, mock: true }
      };
    }
    /* live mode: __llm.call is a host capability — the sandbox never holds the key */
    var body = buildRequest(state);
    return __llm.call(body).then(function (resp) {
      var blocks = (resp && resp.content) || [];
      var tu = null;
      for (var i = 0; i < blocks.length; i++) {
        if (blocks[i].type === 'tool_use' && blocks[i].name === 'propose_candidate') { tu = blocks[i]; break; }
      }
      if (!tu || !tu.input || tu.input.candidate === undefined) {
        throw new Error('llm: response carried no propose_candidate tool_use (stop_reason=' + String(resp && resp.stop_reason) + ')');
      }
      return {
        candidate: tu.input.candidate,
        mock: false,
        hypothesis: String(tu.input.hypothesis || '(model gave no hypothesis)').split('\n')[0],
        state: { schema: state.schema, calls: state.calls + 1, mock: false }
      };
    });
  }
};

/* ---------------- HOST SIDE (runs in funnel.js, OUTSIDE the fence) ----------------
   One small HTTP function using fetch. The key lives only in this closure.
   Requests and responses are logged VERBATIM (bodies, status) — headers are
   not logged, so the key cannot leak through the log.

   promptSha: the prompt is a steering decision (the QR-basin anchor came from
   one sentence we wrote), so it is recorded as an experimental input — sha256
   of the verbatim request body, computed HERE where the request is sent,
   stamped into the log entry, and exposed via lastPromptSha() so the runner
   chains it onto the candidate record the call produced. sha256Fn is passed
   in by funnel.js because this file also loads inside the vm fence, where a
   top-level require would throw. */
module.exports.makeHostCall = function makeHostCall(env, fetchImpl, logLine, sha256Fn) {
  var key = env && env.ANTHROPIC_API_KEY;
  if (!key) return { available: false, call: null };
  if (typeof fetchImpl !== 'function') {
    throw new Error('llm: ANTHROPIC_API_KEY is set but no fetch is available (Node >= 18 required for live mode)');
  }
  if (typeof sha256Fn !== 'function') {
    throw new Error('llm: makeHostCall needs sha256Fn — the prompt chain cannot be recorded without it');
  }
  var lastPromptSha = null;
  return {
    available: true,
    lastPromptSha: function () { return lastPromptSha; },
    call: async function llmHttp(body) {
      var requestBody = JSON.stringify(body);
      var promptSha = sha256Fn(requestBody);
      lastPromptSha = promptSha;
      var res = await fetchImpl('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01'
        },
        body: requestBody
      });
      var json = await res.json();
      if (logLine) logLine({ apiKeyPresent: true, promptSha: promptSha, status: res.status, request: body, response: json });
      if (!res.ok) throw new Error('llm: API error ' + res.status + ' ' + String(json && json.error && json.error.type));
      return json;
    }
  };
};
