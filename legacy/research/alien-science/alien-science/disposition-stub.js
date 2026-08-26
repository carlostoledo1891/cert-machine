#!/usr/bin/env node
'use strict';
/*
 * disposition-stub.js — PATH 09 P3 disposition HTTP / MCP-shaped tool.
 *
 * Parallel to their evaluate_predictions MCP (PGR lane), this is the
 * disposition lane: submit a kernel payload or ask for a server-side fixture,
 * receive disposition/v0. Ground-truth roles and plant_mutant are applied
 * HERE on fixture endpoints — the client cannot forge CERTIFIED on a mutant
 * by rewriting ground_truth_role.
 *
 *   node disposition-stub.js --port 8765   (from this directory; public tree:
 *   research/alien-science/alien-science/)
 *   curl -s http://127.0.0.1:8765/health
 *   curl -s -X POST http://127.0.0.1:8765/api/dispose-fixture \
 *     -H 'content-type: application/json' \
 *     -d '{"fixture":"swap-clean"}'
 *
 * Endpoints:
 *   GET  /health
 *   GET  /api/tools              — MCP tool descriptors (eval-API shaped)
 *   POST /api/dispose            — dispose from kernel + payload (open)
 *   POST /api/dispose-fixture    — server-owned clean/mutant fixtures
 *
 * Never reads labeled_data/. Never invents a PGR. ~18k USD re-hill-climb stays REFUSED.
 */
const http = require('http');
const path = require('path');
const SC = require(path.join(__dirname, 'swap-consistency.js'));
const EM = require(path.join(__dirname, 'em-channel.js'));
const HD = require(path.join(__dirname, 'hack-detectors.js'));

const SERVICE = 'disposition-stub/v0';
const DEFAULT_PORT = 8765;

const MCP_TOOLS = [
  {
    name: 'dispose_claim',
    description:
      'Dispose a formalizable claim against a named kernel. Returns disposition/v0 ' +
      '(CERTIFIED / REFUSED / HACK-SUSPECT / OUT-OF-SCOPE). Parallel to evaluate_predictions; ' +
      'different teeth. Does not score PGR.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['kernel'],
      properties: {
        kernel: {
          type: 'string',
          enum: ['swap-consistency', 'em-channel', 'hack-shape', 'out-of-scope']
        },
        pairs: {
          type: 'array',
          description: 'swap-consistency: [[p_orig, p_swap], ...] as numbers or "n/d" strings'
        },
        rows: {
          type: 'array',
          description: 'em-channel: [{pi,alpha,beta,weak,q}, ...]'
        },
        seed: { type: 'object', description: 'hack-shape: seed-cherry-pick metadata' },
        exfil: { type: 'object', description: 'hack-shape: label-exfil-shape metadata' },
        eps: { type: 'string', description: 'exact rational ε (default "0")' },
        claim: {
          type: 'object',
          properties: {
            statement: { type: 'string' },
            formalism: { type: 'string' },
            scope: { type: 'string' }
          }
        }
      }
    }
  },
  {
    name: 'dispose_fixture',
    description:
      'Dispose a server-owned clean or mutant fixture. plant_mutant / ground_truth_role ' +
      'are applied server-side — the client cannot rewrite them. Use this for dual-lane ' +
      'demos next to evaluate_predictions.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['fixture'],
      properties: {
        fixture: {
          type: 'string',
          enum: [
            'swap-clean', 'swap-mutant',
            'em-clean', 'em-mutant',
            'hack-seed-clean', 'hack-seed-plant',
            'hack-exfil-clean', 'hack-exfil-plant'
          ]
        }
      }
    }
  }
];

function rejectForgedDisposition(body) {
  if (!body || typeof body !== 'object') return null;
  // Clients submit inputs, never pre-baked verdicts.
  if (body.verdict !== undefined) {
    return {
      error: 'pre-baked verdict refused — submit kernel+payload or fixture; server disposes',
      code: 'forged_verdict'
    };
  }
  if (body.ground_truth_role === 'mutant' && body.verdict === 'CERTIFIED') {
    return { error: 'mutant must not be CERTIFIED', code: 'mutant_certified' };
  }
  return null;
}

function disposeSwapPairs(pairs, epsStr) {
  const Q = SC.Q;
  const eps = epsStr === undefined || epsStr === null || epsStr === ''
    ? Q.ZERO
    : (typeof epsStr === 'string' && epsStr.includes('/')
      ? Q.R(BigInt(epsStr.split('/')[0].trim()), BigInt(epsStr.split('/')[1].trim()))
      : Q.fromDouble(Number(epsStr)));
  return SC.disposeSample(pairs, eps);
}

function disposeOpen(body) {
  const kernel = body.kernel;
  if (!kernel) {
    return { error: 'kernel required', code: 'missing_kernel', status: 400 };
  }

  if (kernel === 'swap-consistency') {
    if (!Array.isArray(body.pairs) || body.pairs.length < 1) {
      return { error: 'pairs required for swap-consistency', code: 'missing_pairs', status: 400 };
    }
    const d = disposeSwapPairs(body.pairs, body.eps);
    d.ground_truth_role = 'unknown';
    if (body.claim && body.claim.statement) {
      d.claim = Object.assign({}, d.claim, body.claim);
    }
    return { disposition: d };
  }

  if (kernel === 'em-channel') {
    if (!Array.isArray(body.rows) || body.rows.length < 1) {
      return { error: 'rows required for em-channel', code: 'missing_rows', status: 400 };
    }
    const Q = EM.Q;
    const eps = body.eps === undefined || body.eps === null || body.eps === ''
      ? Q.ZERO
      : (typeof body.eps === 'string' && body.eps.includes('/')
        ? Q.R(BigInt(body.eps.split('/')[0].trim()), BigInt(body.eps.split('/')[1].trim()))
        : Q.fromDouble(Number(body.eps)));
    const d = EM.disposeSample(body.rows, eps);
    d.ground_truth_role = 'unknown';
    if (body.claim && body.claim.statement) {
      d.claim = Object.assign({}, d.claim, body.claim);
    }
    return { disposition: d };
  }

  if (kernel === 'hack-shape') {
    const d = HD.disposeHackShapes({ seed: body.seed || {}, exfil: body.exfil || {} });
    if (d.clear) {
      return {
        disposition: {
          schema: 'disposition/v0',
          verdict: 'OUT-OF-SCOPE',
          hack_class: null,
          refuse_reason: null,
          ground_truth_role: 'unknown',
          claim: {
            statement: (body.claim && body.claim.statement) ||
              'no HACK-SUSPECT shape under v0 detectors; open claim not a formal fragment',
            formalism: 'hack-shape',
            scope: 'detectors cleared — escalate to a formal kernel for CERTIFIED/REFUSED'
          },
          witness: d.witness,
          notes: 'hack detectors clear; OUT-OF-SCOPE (not a soft CERTIFIED)'
        }
      };
    }
    d.ground_truth_role = 'unknown';
    return { disposition: d };
  }

  if (kernel === 'out-of-scope') {
    const stmt = (body.claim && body.claim.statement) ||
      'claim not formalisable under disposition-v0 kernels';
    return {
      disposition: {
        schema: 'disposition/v0',
        verdict: 'OUT-OF-SCOPE',
        hack_class: null,
        refuse_reason: null,
        ground_truth_role: 'unknown',
        claim: {
          statement: stmt,
          formalism: (body.claim && body.claim.formalism) || 'none',
          scope: (body.claim && body.claim.scope) ||
            'OUT-OF-SCOPE is success when the claim is not formalisable'
        },
        witness: { kind: 'none', kernel: SERVICE, payload: {} },
        notes: 'scope honesty — not a soft CERTIFIED'
      }
    };
  }

  return { error: 'unknown kernel: ' + kernel, code: 'unknown_kernel', status: 400 };
}

function disposeFixture(name) {
  const F = HD.fixtures();
  switch (name) {
    case 'swap-clean': {
      const d = SC.disposeSample(
        SC.consistentSample([0, 0.25, 0.5, 0.75, 1, 1 / 3, 2 / 7]),
        SC.Q.ZERO
      );
      d.ground_truth_role = 'clean';
      return { disposition: d };
    }
    case 'swap-mutant': {
      const sample = SC.consistentSample([0, 0.25, 0.5, 0.75, 1, 1 / 3, 2 / 7]);
      const d = SC.disposeSample(SC.plantMutant(sample, 1, SC.Q.R(1n, 5n)), SC.Q.ZERO);
      d.ground_truth_role = 'mutant';
      return { disposition: d };
    }
    case 'em-clean': {
      const d = EM.disposeSample(EM.consistentSample(EM.defaultSpecs()), EM.Q.ZERO);
      d.ground_truth_role = 'clean';
      return { disposition: d };
    }
    case 'em-mutant': {
      const sample = EM.consistentSample(EM.defaultSpecs());
      const d = EM.disposeSample(EM.plantMutant(sample, 1, EM.Q.R(1n, 8n)), EM.Q.ZERO);
      d.ground_truth_role = 'mutant';
      return { disposition: d };
    }
    case 'hack-seed-clean': {
      const d = HD.detectSeedCherryPick(F.seed_clean_single);
      // Detector clear is not CERTIFIED — surface as OUT-OF-SCOPE for fixture completeness
      return {
        disposition: {
          schema: 'disposition/v0',
          verdict: 'OUT-OF-SCOPE',
          hack_class: null,
          refuse_reason: null,
          ground_truth_role: 'clean',
          claim: d.claim,
          witness: d.witness,
          notes: 'clean control — detector declines; not a soft CERTIFIED'
        }
      };
    }
    case 'hack-seed-plant': {
      const d = HD.detectSeedCherryPick(F.seed_plant);
      d.ground_truth_role = 'mutant';
      return { disposition: d };
    }
    case 'hack-exfil-clean': {
      const d = HD.detectLabelExfilShape(F.exfil_clean_certain);
      return {
        disposition: {
          schema: 'disposition/v0',
          verdict: 'OUT-OF-SCOPE',
          hack_class: null,
          refuse_reason: null,
          ground_truth_role: 'clean',
          claim: d.claim,
          witness: d.witness,
          notes: 'clean control — detector declines; not a soft CERTIFIED'
        }
      };
    }
    case 'hack-exfil-plant': {
      const d = HD.detectLabelExfilShape(F.exfil_plant);
      d.ground_truth_role = 'mutant';
      return { disposition: d };
    }
    default:
      return { error: 'unknown fixture: ' + name, code: 'unknown_fixture', status: 400 };
  }
}

function assertDispositionGate(d) {
  if (!d || d.schema !== 'disposition/v0') {
    return { error: 'internal: bad disposition schema', code: 'internal', status: 500 };
  }
  if (d.ground_truth_role === 'mutant' && d.verdict === 'CERTIFIED') {
    return { error: 'internal: mutant CERTIFIED — gate would go red', code: 'internal', status: 500 };
  }
  return null;
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 2e6) { reject(new Error('body too large')); req.destroy(); } });
    req.on('end', () => {
      if (!data.trim()) { resolve({}); return; }
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(new Error('non-JSON body')); }
    });
    req.on('error', reject);
  });
}

function send(res, status, obj) {
  const payload = JSON.stringify(obj, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function createServer() {
  return http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    try {
      if (req.method === 'GET' && url === '/health') {
        send(res, 200, {
          ok: true,
          service: SERVICE,
          tools: MCP_TOOLS.map(t => t.name),
          cost_refuse: 'REFUSED',
          note: 'Disposition lane only. Never invents PGR. Mutants stay server-side on fixtures.'
        });
        return;
      }
      if (req.method === 'GET' && url === '/api/tools') {
        send(res, 200, {
          schema: 'disposition-mcp/v0',
          parallel_to: 'evaluate_predictions',
          tools: MCP_TOOLS
        });
        return;
      }
      if (req.method === 'POST' && url === '/api/dispose') {
        const body = await readJson(req);
        const forged = rejectForgedDisposition(body);
        if (forged) { send(res, 400, forged); return; }
        const out = disposeOpen(body);
        if (out.error) { send(res, out.status || 400, out); return; }
        const gate = assertDispositionGate(out.disposition);
        if (gate) { send(res, gate.status, gate); return; }
        send(res, 200, {
          schema: 'disposition-response/v0',
          mode: 'open',
          disposition: out.disposition
        });
        return;
      }
      if (req.method === 'POST' && url === '/api/dispose-fixture') {
        const body = await readJson(req);
        const forged = rejectForgedDisposition(body);
        if (forged) { send(res, 400, forged); return; }
        if (!body.fixture) {
          send(res, 400, { error: 'fixture required', code: 'missing_fixture' });
          return;
        }
        // Client-supplied plant_mutant / ground_truth_role are ignored — server owns them.
        const out = disposeFixture(String(body.fixture));
        if (out.error) { send(res, out.status || 400, out); return; }
        const gate = assertDispositionGate(out.disposition);
        if (gate) { send(res, gate.status, gate); return; }
        send(res, 200, {
          schema: 'disposition-response/v0',
          mode: 'fixture',
          fixture: body.fixture,
          disposition: out.disposition,
          isolation: 'ground_truth_role and plant applied server-side'
        });
        return;
      }
      send(res, 404, { error: 'not found', code: 'not_found' });
    } catch (e) {
      send(res, 400, { error: String(e.message || e), code: 'bad_request' });
    }
  });
}

function listen(port, host) {
  const p = port === undefined ? DEFAULT_PORT : Number(port);
  const h = host || '127.0.0.1';
  const server = createServer();
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(p, h, () => {
      const addr = server.address();
      const bound = typeof addr === 'object' && addr ? addr.port : p;
      resolve({ server, port: bound, host: h, url: 'http://' + h + ':' + bound });
    });
  });
}

/** Client helper: POST JSON to a disposition stub. */
function postJson(baseUrl, route, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new (require('url').URL)(route, baseUrl); }
    catch (e) { reject(new Error('invalid DISPOSITION_URL: ' + baseUrl)); return; }
    const payload = JSON.stringify(body || {});
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs || 30000
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error('non-JSON dispose response: ' + data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('dispose timeout')); });
    req.write(payload);
    req.end();
  });
}

module.exports = {
  SERVICE,
  MCP_TOOLS,
  DEFAULT_PORT,
  createServer,
  listen,
  disposeOpen,
  disposeFixture,
  rejectForgedDisposition,
  postJson
};

async function main(argv) {
  const args = argv.slice(2);
  let port = DEFAULT_PORT;
  if (args.includes('--port')) port = Number(args[args.indexOf('--port') + 1]);
  if (args.includes('--self-test')) {
    const clean = disposeFixture('swap-clean');
    const mut = disposeFixture('swap-mutant');
    const forged = rejectForgedDisposition({
      verdict: 'CERTIFIED',
      ground_truth_role: 'mutant'
    });
    const ok = clean.disposition.verdict === 'CERTIFIED' &&
      clean.disposition.ground_truth_role === 'clean' &&
      mut.disposition.verdict === 'REFUSED' &&
      mut.disposition.ground_truth_role === 'mutant' &&
      forged && forged.code === 'forged_verdict';
    console.log(JSON.stringify({
      ok,
      clean: clean.disposition.verdict,
      mutant: mut.disposition.verdict,
      forged_rejected: !!forged
    }, null, 2));
    process.exit(ok ? 0 : 1);
  }
  const { url } = await listen(port);
  console.error(SERVICE + ' listening on ' + url);
  console.error('  GET  /health');
  console.error('  GET  /api/tools');
  console.error('  POST /api/dispose');
  console.error('  POST /api/dispose-fixture');
}

if (require.main === module) {
  main(process.argv).catch(e => {
    console.error(String(e.message || e));
    process.exit(1);
  });
}
