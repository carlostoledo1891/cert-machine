#!/usr/bin/env node
/* record-apn-kernel.js — the AlphaProof Nexus audit's kernel ledger, certs/apn-kernel.json.

   Downloads the artifacts of runs of .github/workflows/apn-kernel.yml (each job uploads apn-<item>/result.json: the facts of
   one Comparator run, no verdict) into corpus/alphaproof-nexus/kernel-runs/<run>/<item>.json, and decides each row by THE
   Comparator rule (tools/comparator-verdict.js, shared with the openai/math lane): CERTIFIED when Comparator passes and both
   Lean's kernel and nanoda accept; REFUTED only when two runs agree on a rejection or a statement mismatch; REFUSED
   otherwise, with the stage. An item run twice keeps both runs; its row is decided on the latest.

   CERTIFIED here means: the proof in the results repository proves exactly formal-conjectures' statement at the commit the
   repository builds against (Comparator compares the elaborated statements and every constant they mention), with only
   propext / Quot.sound / Classical.choice, accepted by two independently written kernels. Whether that statement is the
   problem Erdős asked is the reading lane's question, and certs/apn-statements.json's.

   usage: node tools/record-apn-kernel.js <run-id> [<run-id> ...] [--partial]
          node tools/record-apn-kernel.js --rebuild      (re-decide from the runs on disk)
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const { decide } = require('./comparator-verdict.js');

const ROOT = path.resolve(__dirname, '..');
const RUNS = path.join(ROOT, 'corpus', 'alphaproof-nexus', 'kernel-runs');
const OUT = path.join(ROOT, 'certs', 'apn-kernel.json');
const REPO = 'carlostoledo1891/cert-machine';
const ITEMS = ['erdos_12.parts.i', 'erdos_12.parts.ii', 'erdos_125.variants.positive_lower_density', 'erdos_138.variants.difference', 'erdos_152',
  'erdos_26.variants.tenenbaum', 'erdos_741.parts.i', 'erdos_741.parts.ii', 'erdos_846', 'erdos_741.variants.upper'];
const args = process.argv.slice(2);
if (!args.length) { console.error('usage: record-apn-kernel.js <run-id> ... [--partial] | --rebuild'); process.exit(2); }

for (const run of args.filter((a) => /^\d+$/.test(a))) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,createdAt,updatedAt,status,conclusion,url`, { encoding: 'utf8' }));
  if (meta.status !== 'completed' && !args.includes('--partial')) { console.error('run ' + run + ' is ' + meta.status + '; record it when it completes, or pass --partial'); process.exit(1); }
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'apnk-'));
  cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} --pattern 'apn-erdos*'`, { stdio: 'inherit' });
  const dir = path.join(RUNS, String(run));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const a of fs.readdirSync(tmp)) {
    const item = a.replace(/^apn-/, '');
    const f = path.join(tmp, a, 'result.json');
    const fact = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { challenge: item, ran: false, missing: 'no result.json in the artifact' };
    for (const extra of ['sha256.txt', 'audit-config.json']) {
      const p = path.join(tmp, a, extra);
      if (fs.existsSync(p)) fact[extra === 'sha256.txt' ? 'sha256' : 'config'] = extra === 'sha256.txt' ? fs.readFileSync(p, 'utf8').trim().split('\n') : JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    fs.writeFileSync(path.join(dir, item + '.json'), JSON.stringify(fact, null, 1) + '\n');
  }
  /* a job that ended without uploading a result is recorded from the job list, with the step it died in */
  const jobs = JSON.parse(cp.execSync(`gh api --paginate repos/${REPO}/actions/runs/${run}/jobs?per_page=100 --jq '[.jobs[] | {name, status, conclusion, steps: [.steps[] | {name, conclusion}]}]'`, { encoding: 'utf8' }).replace(/\]\s*\[/g, ','));
  for (const j of jobs) {
    const mt = /^check \((.+)\)$/.exec(j.name);
    if (!mt || j.status !== 'completed' || fs.existsSync(path.join(dir, mt[1] + '.json'))) continue;
    const step = (j.steps.find((s) => s.conclusion !== 'success' && s.conclusion !== 'skipped') || {}).name || 'an unnamed step';
    fs.writeFileSync(path.join(dir, mt[1] + '.json'), JSON.stringify({ challenge: mt[1], ran: false, jobConclusion: j.conclusion, missing: 'the job ended (' + j.conclusion + ') in the step "' + step + '" without uploading a result' }, null, 1) + '\n');
  }
  fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({ run: meta.databaseId, workflowSha: meta.headSha, createdAt: meta.createdAt, updatedAt: meta.updatedAt, status: meta.status, conclusion: meta.conclusion, url: meta.url }, null, 1) + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('run ' + run + ': recorded');
}

/* decide every item from every run on disk, latest run last */
const runs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^\d+$/.test(d)).map((d) => ({ d, meta: JSON.parse(fs.readFileSync(path.join(RUNS, d, '_run.json'), 'utf8')) }))
  .sort((a, b) => String(a.meta.createdAt).localeCompare(String(b.meta.createdAt))) : [];
const rows = ITEMS.map((item) => {
  const r = { item, runs: [] };
  for (const { d, meta } of runs) {
    const p = path.join(RUNS, d, item + '.json');
    if (!fs.existsSync(p)) continue;
    const f = JSON.parse(fs.readFileSync(p, 'utf8'));
    r.runs.push({ run: meta.run, workflowSha: meta.workflowSha, at: meta.updatedAt, exit: f.exit, seconds: f.seconds, cacheSeconds: f.cacheSeconds, maxRssKB: f.maxRssKB, kernels: f.kernels, theorem: f.config ? f.config.theorem_names : null, sha256: f.sha256 || null, decided: decide(f) });
  }
  if (!r.runs.length) return Object.assign(r, { word: 'NOT RUN', why: 'no run of the kernel lane has reached this item yet' });
  const last = r.runs[r.runs.length - 1];
  r.word = last.decided.word;
  if (r.word === 'REFUTED?') r.word = r.runs.filter((x) => x.decided.word === 'REFUTED?').length >= 2 ? 'REFUTED' : 'REFUTED — TO REPRODUCE';
  r.why = last.decided.why; r.stage = last.decided.stage || null;
  return r;
});
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, p))).digest('hex');
const counts = {}; for (const r of rows) counts[r.word] = (counts[r.word] || 0) + 1;
const rec = {
  what: 'The AlphaProof Nexus audit, kernel lane: each Erdős proof of google-deepmind/alphaproof-nexus-results @ 0647711a checked by Comparator v4.27.0 against formal-conjectures\' own statement at the commit the repository builds against (7862bf6a), with nanoda on (.github/workflows/apn-kernel.yml). CERTIFIED here means the proof proves exactly that statement, uses only propext / Quot.sound / Classical.choice, and two independently written kernels accept it. Whether the statement is the problem Erdős posed is the reading lane\'s question.',
  generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  workflow: '.github/workflows/apn-kernel.yml', rule: 'tools/comparator-verdict.js', deciders: { rule: sha('tools/comparator-verdict.js'), prepare: sha('tools/apn-kernel-prepare.py'), workflow: sha('.github/workflows/apn-kernel.yml') },
  counts, rows,
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log('wrote certs/apn-kernel.json — ' + JSON.stringify(counts));
for (const r of rows) console.log('  ' + r.word.padEnd(22) + r.item.padEnd(44) + (r.word === 'CERTIFIED' || r.word === 'NOT RUN' ? '' : (r.stage ? '[' + r.stage + '] ' : '') + String(r.why).slice(0, 160)));
