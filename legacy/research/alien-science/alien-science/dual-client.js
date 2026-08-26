#!/usr/bin/env node
'use strict';
/*
 * dual-client.js — PATH 09 Phase-2 thin client (+ P3 stub lane).
 *
 * Two lanes, one call site:
 *   PGR lane     — optional POST to their-style /api/evaluate-predictions
 *                  (W2S_EVAL_URL). Offline default: reported figures only.
 *   Disposition  — local by default; optional POST to disposition-stub
 *                  (DISPOSITION_URL + --via-stub). Fixtures plant server-side.
 *
 * Never reads labeled_data/. Never invents a remote PGR. --post-pgr without
 * W2S_EVAL_URL exits nonzero. --via-stub without DISPOSITION_URL exits nonzero.
 * Full ~18k USD re-hill-climb is refused in MODE_B_RUNBOOK.md.
 *
 *   From this directory (public tree: research/alien-science/alien-science/):
 *   node dual-client.js --fixture heldout-ccs-es
 *   W2S_EVAL_URL=http://127.0.0.1:8000 node ... --fixture heldout-ccs-es --post-pgr
 *   DISPOSITION_URL=http://127.0.0.1:8765 node ... --fixture heldout-ccs-es --via-stub
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const DIR = __dirname;
const SC = require(path.join(DIR, 'swap-consistency.js'));
const EM = require(path.join(DIR, 'em-channel.js'));
const Stub = require(path.join(DIR, 'disposition-stub.js'));
const HELDOUT = path.join(DIR, 'heldout-story.json');
const EM_DISAGREE = path.join(DIR, 'em-disagree-story.json');

function loadHeldout() {
  return JSON.parse(fs.readFileSync(HELDOUT, 'utf8'));
}

function loadEmDisagree() {
  return JSON.parse(fs.readFileSync(EM_DISAGREE, 'utf8'));
}

function disposeSwapFixture(opts) {
  const Q = SC.Q;
  const probs = (opts && opts.probs) || [0, 0.25, 0.5, 0.75, 1, 1 / 3, 2 / 7];
  const sample = SC.consistentSample(probs);
  if (opts && opts.plant_mutant) {
    return SC.disposeSample(SC.plantMutant(sample, 1, Q.R(1n, 5n)), Q.ZERO);
  }
  return SC.disposeSample(sample, Q.ZERO);
}

function disposeEmFixture(opts) {
  const Q = EM.Q;
  const sample = EM.consistentSample(EM.defaultSpecs());
  let disp;
  if (opts && opts.plant_mutant) {
    disp = EM.disposeSample(EM.plantMutant(sample, 1, Q.R(1n, 8n)), Q.ZERO);
    disp.ground_truth_role = 'mutant';
  } else {
    disp = EM.disposeSample(sample, Q.ZERO);
    disp.ground_truth_role = 'clean';
  }
  return disp;
}

function pgrLaneEmReported(story) {
  const p = story.lanes.pgr;
  return {
    mode: 'reported',
    success: true,
    remeasured: false,
    chat_pgr: p.chat_reported,
    heldout_math_pgr: null,
    heldout_code_pgr: null,
    provenance: p.provenance,
    isolation_required_to_remeasure: p.isolation_required_to_remeasure,
    note: 'Not a live eval. Tag every public use as Anthropic-reported.'
  };
}

/**
 * PGR lane. Offline: returns reported block. Online (--post-pgr): POST body.
 * predictions must be supplied by the caller when posting — we do not invent labels.
 */
function pgrLaneReported(story) {
  const p = story.lanes.pgr;
  // heldout_* stay in the output shape but are null: the source reports no
  // held-out numbers for CCS+ES — fig. 8's 0.94/0.47 are CCS + Self-Distill's
  // (see the fixture's heldout_note, passed through below).
  return {
    mode: 'reported',
    success: true,
    remeasured: false,
    chat_pgr: p.chat_reported,
    heldout_math_pgr: p.heldout_math_reported != null ? p.heldout_math_reported : null,
    heldout_code_pgr: p.heldout_code_reported != null ? p.heldout_code_reported : null,
    heldout_note: p.heldout_note != null ? p.heldout_note : null,
    provenance: p.provenance,
    isolation_required_to_remeasure: p.isolation_required_to_remeasure,
    note: 'Not a live eval. Tag every public use as Anthropic-reported.'
  };
}

function postEvaluatePredictions(baseUrl, body, timeoutMs) {
  return new Promise((resolve, reject) => {
    let url;
    try {
      url = new URL('/api/evaluate-predictions', baseUrl);
    } catch (e) {
      reject(new Error('invalid W2S_EVAL_URL: ' + baseUrl));
      return;
    }
    const lib = url.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: timeoutMs || 120000
    }, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(new Error('non-JSON evaluate response: ' + data.slice(0, 200)));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('evaluate-predictions timeout'));
    });
    req.write(payload);
    req.end();
  });
}

async function pgrLaneLive(baseUrl, args) {
  const body = {
    predictions: args.predictions,
    dataset: args.dataset,
    weak_model: args.weak_model,
    strong_model: args.strong_model
  };
  for (const k of Object.keys(body)) {
    if (body[k] === undefined || body[k] === null || body[k] === '') {
      throw new Error('live PGR POST missing required field: ' + k);
    }
  }
  const res = await postEvaluatePredictions(baseUrl, body);
  if (res.status >= 400 || (res.body && res.body.error)) {
    return {
      mode: 'live',
      success: false,
      status: res.status,
      error: (res.body && res.body.error) || ('HTTP ' + res.status),
      raw: res.body
    };
  }
  return {
    mode: 'live',
    success: true,
    remeasured: true,
    transfer_acc: res.body.transfer_acc,
    pgr: res.body.pgr,
    correct: res.body.correct,
    total: res.body.total,
    fixed_weak_acc: res.body.fixed_weak_acc,
    fixed_strong_acc: res.body.fixed_strong_acc,
    endpoint: String(new URL('/api/evaluate-predictions', baseUrl))
  };
}

function disagreement(pgrLane, disp) {
  const highPgr =
    (pgrLane.chat_pgr != null && pgrLane.chat_pgr >= 0.7) ||
    (pgrLane.pgr != null && pgrLane.pgr >= 0.7) ||
    (pgrLane.heldout_math_pgr != null && pgrLane.heldout_math_pgr >= 0.7);
  if (highPgr && (disp.verdict === 'REFUSED' || disp.verdict === 'HACK-SUSPECT')) {
    return {
      kind: 'disagree',
      headline: 'high PGR + ' + disp.verdict,
      note: 'Attention object — metric green, disposition not'
    };
  }
  if (highPgr && disp.verdict === 'CERTIFIED') {
    return {
      kind: 'agree_with_teeth',
      headline: 'high PGR + CERTIFIED fragment',
      note: 'Constructive twin — both lanes green; disposition scope is the fragment only'
    };
  }
  if (disp.verdict === 'OUT-OF-SCOPE') {
    return {
      kind: 'scope',
      headline: 'disposition declined',
      note: 'OUT-OF-SCOPE is success when the claim is not formalisable'
    };
  }
  return {
    kind: 'other',
    headline: (pgrLane.mode || 'pgr') + ' × ' + disp.verdict,
    note: ''
  };
}

async function dispositionViaStub(baseUrl, fixtureName) {
  const res = await Stub.postJson(baseUrl, '/api/dispose-fixture', { fixture: fixtureName });
  if (res.status >= 400 || !res.body || !res.body.disposition) {
    throw new Error(
      'disposition stub failed: HTTP ' + res.status +
      ' ' + ((res.body && res.body.error) || JSON.stringify(res.body)).slice(0, 200)
    );
  }
  return res.body.disposition;
}

function stubFixtureName(opts) {
  const fixture = opts.fixture || 'heldout-ccs-es';
  if (fixture === 'em-disagree') {
    const plant = opts.em ? opts.em.plant_mutant !== false : true;
    return plant ? 'em-mutant' : 'em-clean';
  }
  const plant = opts.swap && opts.swap.plant_mutant;
  return plant ? 'swap-mutant' : 'swap-clean';
}

async function evaluateDual(opts) {
  const fixture = opts.fixture || 'heldout-ccs-es';
  const story = opts.story ||
    (fixture === 'em-disagree' ? loadEmDisagree() : loadHeldout());
  const cost = story.cost_refuse || {
    status: 'REFUSED',
    re_hillclimb_usd: 18000,
    why: 'see MODE_B_RUNBOOK.md'
  };

  let pgr;
  if (opts.postPgr) {
    const base = process.env.W2S_EVAL_URL;
    if (!base) {
      throw new Error('--post-pgr requires W2S_EVAL_URL (no silent fake remote)');
    }
    pgr = await pgrLaneLive(base, opts.live || {});
  } else if (fixture === 'em-disagree') {
    pgr = pgrLaneEmReported(story);
  } else {
    pgr = pgrLaneReported(story);
  }

  let disposition;
  let dispositionMode = 'local';
  if (opts.disposition) {
    disposition = opts.disposition;
  } else if (opts.viaStub) {
    const base = opts.dispositionUrl || process.env.DISPOSITION_URL;
    if (!base) {
      throw new Error('--via-stub requires DISPOSITION_URL (no silent fake remote)');
    }
    disposition = await dispositionViaStub(base, stubFixtureName(opts));
    dispositionMode = 'stub';
  } else if (fixture === 'em-disagree') {
    // Attention object defaults to planted mutant REFUSED; --clean for CERTIFIED twin.
    const plant = opts.em ? opts.em.plant_mutant !== false : true;
    disposition = disposeEmFixture({ plant_mutant: plant });
  } else {
    disposition = disposeSwapFixture(opts.swap);
  }
  if (!disposition.ground_truth_role) disposition.ground_truth_role = 'unknown';

  return {
    schema: 'dual-eval/v0',
    idea: story.idea,
    candidate_key: story.candidate_key || story.idea,
    cost_refuse: cost,
    lanes: {
      pgr,
      disposition: {
        verdict: disposition.verdict,
        refuse_reason: disposition.refuse_reason || null,
        hack_class: disposition.hack_class || null,
        witness_kind: disposition.witness && disposition.witness.kind,
        max_residual: disposition.witness &&
          disposition.witness.payload &&
          disposition.witness.payload.max_residual,
        scope: (disposition.claim && disposition.claim.scope) || null,
        ground_truth_role: disposition.ground_truth_role,
        mode: dispositionMode
      }
    },
    disagreement: disagreement(pgr, disposition),
    sandbox: 'MODE_B_RUNBOOK.md',
    mode_b_runbook: 'MODE_B_RUNBOOK.md'
  };
}

module.exports = {
  evaluateDual,
  disposeSwapFixture,
  disposeEmFixture,
  dispositionViaStub,
  stubFixtureName,
  pgrLaneReported,
  pgrLaneEmReported,
  loadHeldout,
  loadEmDisagree,
  disagreement
};

async function main(argv) {
  const args = argv.slice(2);
  const postPgr = args.includes('--post-pgr');
  const viaStub = args.includes('--via-stub');
  const plant = args.includes('--plant-mutant');
  const clean = args.includes('--clean');
  const fixture = args.includes('--fixture')
    ? args[args.indexOf('--fixture') + 1]
    : 'heldout-ccs-es';
  if (fixture !== 'heldout-ccs-es' && fixture !== 'em-disagree') {
    console.error('unknown fixture: ' + fixture + ' (heldout-ccs-es | em-disagree)');
    process.exit(2);
  }

  // Optional live body from env JSON (owner-supplied predictions — never invented)
  let live = {};
  if (process.env.W2S_EVAL_BODY) {
    live = JSON.parse(process.env.W2S_EVAL_BODY);
  }

  try {
    const out = await evaluateDual({
      fixture,
      postPgr,
      viaStub,
      live,
      swap: { plant_mutant: plant },
      em: fixture === 'em-disagree'
        ? { plant_mutant: clean ? false : true }
        : undefined
    });
    console.log(JSON.stringify(out, null, 2));
    if (out.cost_refuse && out.cost_refuse.status !== 'REFUSED') {
      console.error('cost_refuse must stay REFUSED');
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}

if (require.main === module) {
  main(process.argv);
}
