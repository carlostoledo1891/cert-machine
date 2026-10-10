#!/usr/bin/env node
/* record-openai-math-kernel.js — lane K's ledger, certs/openai-math-kernel.json.

   Downloads the artifacts of one or more runs of .github/workflows/openai-math-kernel.yml
   (each job uploads kernel-<challenge>/result.json: the facts of one Comparator run, no
   verdict) and DECIDES each row by the words fixed in corpus/openai-math/preregistration.json
   (lanes.K.words, lanes.K.strictWords). The rule lives here and only here: the page, the
   handoff and any note read this ledger.

   A challenge run twice keeps both runs; its row is decided on the LATEST run, and a REFUTED
   is only stated when two runs agree (preregistration: "reproduced by a second run").

   usage: node tools/record-openai-math-kernel.js <run-id> [<run-id> ...]
          node tools/record-openai-math-kernel.js --rebuild      (re-decide from the runs on disk) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const RUNS = path.join(ROOT, 'corpus', 'openai-math', 'kernel-runs');
const OUT = path.join(ROOT, 'certs', 'openai-math-kernel.json');
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'release.json'), 'utf8'));
const prereg = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'preregistration.json'), 'utf8'));
const REPO = 'carlostoledo1891/cert-machine';

const args = process.argv.slice(2);
if (!args.length) { console.error('usage: record-openai-math-kernel.js <run-id> ... | --rebuild'); process.exit(2); }

/* 1 · fetch: each run's artifacts land in corpus/openai-math/kernel-runs/<run>/<challenge>.json,
   the facts only (result.json), with the run's own metadata beside them */
for (const run of args.filter((a) => /^\d+$/.test(a))) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,createdAt,updatedAt,status,conclusion,url`, { encoding: 'utf8' }));
  if (meta.status !== 'completed') { console.error('run ' + run + ' is ' + meta.status + '; record it when it completes'); process.exit(1); }
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'omk-'));
  cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} --pattern 'kernel-*'`, { stdio: 'inherit' });
  const dir = path.join(RUNS, String(run));
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const a of fs.readdirSync(tmp)) {
    if (a === 'kernel-tools') continue;
    const f = path.join(tmp, a, 'result.json');
    const ch = a.replace(/^kernel-/, '');
    const fact = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { challenge: ch, ran: false, missing: 'no result.json in the artifact' };
    fs.writeFileSync(path.join(dir, ch + '.json'), JSON.stringify(fact, null, 1) + '\n');
    n++;
  }
  fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({ run: meta.databaseId, workflowSha: meta.headSha, createdAt: meta.createdAt, updatedAt: meta.updatedAt, conclusion: meta.conclusion, url: meta.url, jobs: n }, null, 1) + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('run ' + run + ': ' + n + ' challenge results');
}

/* 2 · decide: the words of the pre-registration, from the facts */
const accepts = (f, k) => f.kernels.some((l) => new RegExp('^' + k + ' kernel accepts the solution').test(l));
const rejects = (f) => f.kernels.filter((l) => /kernel rejects/.test(l));
const COMPARATOR_NO = [/Challenge and solution theorem statement do not match/, /Const does not match between challenge and target/, /Challenge and solution constant kind don't match/, /not permitted|illegal axiom|uses axiom|Axiom .* is not/i];
function decide(f) {
  if (!f.ran) return { word: 'REFUSED', stage: 'not run', why: f.missing || 'the job stopped before Comparator ran (see the run log)' };
  if (f.exit === 0 && f.okay && accepts(f, 'nanoda') && accepts(f, 'Lean default')) return { word: 'CERTIFIED', why: 'Comparator exit 0; nanoda and Lean\'s kernel both accept' };
  if (f.exit === 0 && f.okay) return { word: 'REFUSED', stage: 'kernels', why: 'Comparator passed but the two acceptance lines were not both printed: ' + JSON.stringify(f.kernels) };
  const text = (f.logTail || []).concat(f.errTail || []).join('\n');
  const no = rejects(f).length ? 'a kernel rejects: ' + rejects(f).join('; ') : (COMPARATOR_NO.find((re) => re.test(text)) ? (text.split('\n').find((l) => COMPARATOR_NO.some((re) => re.test(l))) || '').trim() : null);
  if (no) return { word: 'REFUTED?', stage: 'comparator', why: no };
  const stage = /Building .*\n(?![\s\S]*Exporting)/.test(text) ? 'build' : /Exporting/.test(text) ? 'export or replay' : 'setup';
  return { word: 'REFUSED', stage, why: (f.errTail || []).slice(-3).join(' | ') || 'exit ' + f.exit };
}
function decideStrict(f, ch) {
  if (!ch.definitionNames.length) return null;
  if (!f.strict) return { word: 'NOT RUN', why: 'no second run in this job' };
  if (f.strict.exit === 0 && f.strict.okay) return { word: 'SAME BODIES', why: 'with definition_names emptied, every declared definition matched body and all' };
  if (f.strict.mismatches.length) return { word: 'BODIES DIFFER', constants: f.strict.mismatches, why: 'Comparator names the constants whose bodies differ; each is read in lane S' };
  return { word: 'NOT DECIDED', why: (f.strict.errTail || []).slice(-3).join(' | ') };
}

const byName = new Map(release.challenges.map((c) => [c.name, c]));
const rows = new Map();
const runDirs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^\d+$/.test(d)).sort((a, b) => Number(a) - Number(b)) : [];
for (const d of runDirs) {
  const meta = JSON.parse(fs.readFileSync(path.join(RUNS, d, '_run.json'), 'utf8'));
  for (const file of fs.readdirSync(path.join(RUNS, d)).filter((x) => x.endsWith('.json') && x !== '_run.json')) {
    const f = JSON.parse(fs.readFileSync(path.join(RUNS, d, file), 'utf8'));
    const ch = byName.get(f.challenge);
    if (!ch) { console.error('not a census challenge: ' + f.challenge); process.exit(1); }
    const r = rows.get(ch.name) || { challenge: ch.name, families: ch.families, statementLines: ch.statementLines, nanodaInRelease: ch.enableNanoda, definitionHoles: ch.definitionNames.length, runs: [] };
    r.runs.push({ run: meta.run, workflowSha: meta.workflowSha, at: meta.updatedAt, exit: f.exit, seconds: f.seconds, cacheSeconds: f.cacheSeconds, maxRssKB: f.maxRssKB, kernels: f.kernels, decided: decide(f), strict: decideStrict(f, ch) });
    rows.set(ch.name, r);
  }
}
for (const r of rows.values()) {
  const last = r.runs[r.runs.length - 1];
  r.word = last.decided.word;
  if (r.word === 'REFUTED?') {
    const agree = r.runs.filter((x) => x.decided.word === 'REFUTED?').length;
    r.word = agree >= 2 ? 'REFUTED' : 'REFUTED — TO REPRODUCE';
  }
  r.why = last.decided.why; r.stage = last.decided.stage || null;
  r.strict = last.strict;
}
const list = [...rows.values()].sort((a, b) => a.challenge.localeCompare(b.challenge));
const tally = (xs) => xs.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});
const ledger = {
  what: 'Lane K of the openai/math audit: each Comparator challenge re-run on Linux with nanoda on, decided by the words of corpus/openai-math/preregistration.json (lanes.K). CERTIFIED here means the Lean theorem states exactly the challenge statement, uses only propext / Quot.sound / Classical.choice, and two independently written kernels accept the proof. It does not mean the paper\'s claim is proved: that is lane S.',
  release: { commit: release.commit, challenges: release.challenges.length },
  decider: prereg.lanes.K.decider,
  declaredChanges: prereg.lanes.K.declaredChanges,
  trustBase: prereg.lanes.K.trustBase,
  counts: { decided: list.length, of: release.challenges.length, words: tally(list.map((r) => r.word)), strict: tally(list.filter((r) => r.strict).map((r) => r.strict.word)) },
  rows: list,
};
writeStable(OUT, ledger);
console.log('certs/openai-math-kernel.json: ' + list.length + ' of ' + release.challenges.length + ' challenges — ' + JSON.stringify(ledger.counts.words) + (Object.keys(ledger.counts.strict).length ? '; strict ' + JSON.stringify(ledger.counts.strict) : ''));
for (const r of list) console.log('  ' + r.word.padEnd(22) + r.challenge.padEnd(34) + (r.strict ? '[' + r.strict.word + '] ' : '') + (r.word === 'CERTIFIED' ? '' : r.why));
