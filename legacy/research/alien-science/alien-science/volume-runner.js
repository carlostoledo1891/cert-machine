#!/usr/bin/env node
'use strict';
/*
 * volume-runner.js — PATH 09 Phase-4B high-volume dual-lane runner (Node twin).
 *
 * Reads claim+witness JSONL (synthetic swap pairs). Always runs disposition
 * locally. Optional --post-pgr POSTs to W2S_EVAL_URL/api/evaluate-predictions
 * (their shape) — never invents predictions. Mode A legitimacy: if
 * LABELED_DATA_REACHABLE=1, PGR lane is marked illegitimate.
 *
 *   node volume-runner.js --batch path/to/batch.jsonl
 *   node volume-runner.js --batch … --plant-mutant
 *   W2S_EVAL_URL=… node volume-runner.js --batch … --post-pgr --predictions path.json
 */
const fs = require('fs');
const path = require('path');
const SC = require(path.join(__dirname, 'swap-consistency.js'));
const Dual = require(path.join(__dirname, 'dual-client.js'));

function parseArgs(argv) {
  const out = { batch: null, postPgr: false, plant: false, predictions: null, summaryOut: null };
  const a = argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--batch') out.batch = a[++i];
    else if (a[i] === '--post-pgr') out.postPgr = true;
    else if (a[i] === '--plant-mutant') out.plant = true;
    else if (a[i] === '--predictions') out.predictions = a[++i];
    else if (a[i] === '--summary-out') out.summaryOut = a[++i];
  }
  return out;
}

function loadJsonl(p) {
  const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/).filter(l => l.trim());
  return lines.map((l, i) => {
    try { return JSON.parse(l); }
    catch (e) { throw new Error('JSONL line ' + (i + 1) + ': ' + e.message); }
  });
}

function disposeRow(row, plant) {
  const Q = SC.Q;
  let pairs;
  if (row.pairs) {
    pairs = row.pairs.map(([a, b]) => [SC.Q.fromDouble ? a : a, b]);
    // Prefer exact: if numbers, use consistentSample path via disposeSample
    pairs = row.pairs;
  } else if (row.p_orig != null && row.p_swap != null) {
    pairs = [[row.p_orig, row.p_swap]];
  } else {
    throw new Error('row needs pairs or p_orig/p_swap');
  }
  if (plant) pairs = SC.plantMutant(SC.consistentSample(pairs.map(p => p[0])), 0, Q.R(1n, 5n));
  return SC.disposeSample(pairs, Q.ZERO);
}

async function run(opts) {
  if (!opts.batch) throw new Error('--batch required');
  const rows = loadJsonl(opts.batch);
  if (rows.length < 1) throw new Error('empty batch');

  let pgrMeta = { mode: 'skipped', success: true };
  if (opts.postPgr) {
    const base = process.env.W2S_EVAL_URL;
    if (!base) throw new Error('--post-pgr requires W2S_EVAL_URL (no silent fake remote)');
    if (!opts.predictions) {
      throw new Error('--post-pgr requires --predictions (never invent predictions)');
    }
    const body = JSON.parse(fs.readFileSync(opts.predictions, 'utf8'));
    const DualMod = Dual;
    // reuse live helper via evaluateDual path internals — call through require of dual
    const live = await (async () => {
      const http = require('http');
      const https = require('https');
      const { URL } = require('url');
      const url = new URL('/api/evaluate-predictions', base);
      const lib = url.protocol === 'https:' ? https : http;
      const payload = JSON.stringify(body);
      return new Promise((resolve, reject) => {
        const req = lib.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 120000
        }, res => {
          let data = '';
          res.on('data', c => { data += c; });
          res.on('end', () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
            catch (e) { reject(e); }
          });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    })();
    pgrMeta = {
      mode: 'live',
      success: live.status < 400,
      remeasured: true,
      raw: live.body,
      illegitimate: process.env.LABELED_DATA_REACHABLE === '1'
    };
    if (pgrMeta.illegitimate) {
      pgrMeta.note = 'Mode A: labeled_data reachable — PGR lane marked illegitimate';
    }
  } else if (process.env.LABELED_DATA_REACHABLE === '1') {
    pgrMeta = {
      mode: 'skipped',
      success: true,
      illegitimate: true,
      note: 'labeled_data reachable — any future PGR would be illegitimate'
    };
  }

  let certified = 0, refused = 0, mutantCertified = 0;
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const disp = disposeRow(row, opts.plant);
    if (disp.verdict === 'CERTIFIED') certified++;
    else refused++;
    if (opts.plant && disp.verdict === 'CERTIFIED') mutantCertified++;
    if (row.ground_truth_role === 'mutant' && disp.verdict === 'CERTIFIED') mutantCertified++;
    const line = {
      schema: 'volume-result/v0',
      i: i,
      id: row.id || ('row-' + i),
      disposition: {
        verdict: disp.verdict,
        max_residual: disp.witness && disp.witness.payload && disp.witness.payload.max_residual,
        refuse_reason: disp.refuse_reason || null
      },
      pgr: pgrMeta.mode === 'live' ? { mode: 'live', remeasured: true } : { mode: pgrMeta.mode },
      disagreement: Dual.disagreement(
        pgrMeta.mode === 'live' && pgrMeta.raw
          ? { pgr: pgrMeta.raw.pgr, mode: 'live' }
          : { chat_pgr: row.pgr_reported != null ? row.pgr_reported : null, mode: 'reported' },
        disp
      )
    };
    results.push(line);
  }

  const summary = {
    schema: 'volume-summary/v0',
    n: rows.length,
    certified: certified,
    refused: refused,
    mutant_certified: mutantCertified,
    pgr: pgrMeta,
    cost_refuse: { status: 'REFUSED', re_hillclimb_usd: 18000 },
    batch: opts.batch
  };

  return { results, summary };
}

module.exports = { run, loadJsonl, disposeRow };

async function main() {
  const opts = parseArgs(process.argv);
  try {
    const { results, summary } = await run(opts);
    if (summary.mutant_certified !== 0) {
      console.error(JSON.stringify(summary, null, 2));
      console.error('mutant_certified must be 0');
      process.exit(1);
    }
    if (opts.summaryOut) {
      fs.writeFileSync(opts.summaryOut, JSON.stringify(summary, null, 2) + '\n');
    }
    // print summary on stdout; JSONL results on stderr if VOLUME_JSONL=1
    if (process.env.VOLUME_JSONL === '1') {
      for (const r of results) console.error(JSON.stringify(r));
    }
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(String(e.message || e));
    process.exit(1);
  }
}

if (require.main === module) main();
