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
  /* --partial records the jobs of a run still in progress (their artifacts exist once each job ends); the run's
     directory is rewritten whole when it is recorded again after it completes */
  if (meta.status !== 'completed' && !args.includes('--partial')) { console.error('run ' + run + ' is ' + meta.status + '; record it when it completes, or pass --partial'); process.exit(1); }
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
  fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify({ run: meta.databaseId, workflowSha: meta.headSha, createdAt: meta.createdAt, updatedAt: meta.updatedAt, status: meta.status, conclusion: meta.conclusion, url: meta.url, jobs: n }, null, 1) + '\n');
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
/* amendment 9 — the TRANSFER check of a definition-hole challenge, with its red control (the forge) */
function decideTransfer(f, ch) {
  if (!ch.definitionNames.length || !f.transfer) return null;
  const t = f.transfer, g = f.forge || {};
  if (t.exit === 97) return { word: 'NOT DECIDED', why: 'the transfer file could not be generated from the challenge text' };
  if (t.exit === 124) return { word: 'NOT DECIDED', why: 'the transfer check hit its 60-minute limit' };
  if (t.guard === 'FAILED' || t.guard === 'UNVERIFIED') return { word: 'NOT DECIDED', why: 'the guard refused: ' + t.guardLine };
  if (t.errorsInCopy.length) return { word: 'NOT DECIDED', why: 'the copied challenge did not elaborate beside the solution: ' + t.errorsInCopy.slice(0, 2).map((e) => e.text).join(' | ') };
  if (t.guard !== 'OK') return { word: 'NOT DECIDED', why: 'the guard did not report' };
  if (t.errorsAtExamples.length) return { word: 'NOT DEFINITIONAL', why: 'Lean does not accept the solution theorem for the displayed statement by definitional unfolding: ' + t.errorsAtExamples.slice(0, 2).map((e) => e.text).join(' | ') };
  if (t.exit !== 0) return { word: 'NOT DECIDED', why: 'lean exited ' + t.exit + ' with no error located' };
  /* the transfer holds; it counts only if its red control fired */
  if (g.exit === 'genuine') return { word: 'TRANSFERS', why: 'Lean accepts every solution theorem for the displayed statement; every hole is sorried in the challenge, so there is no displayed body to forge', redControl: 'none possible' };
  if (g.errorsAtExamples && g.errorsAtExamples.length && !(g.errorsInCopy || []).length && g.guard === 'OK') return { word: 'TRANSFERS', why: 'Lean accepts every solution theorem for the statement the challenge displays (guard: ' + t.guardLine + '); the red control — one displayed hole body replaced by sorry — is rejected', redControl: 'fired' };
  return { word: 'NOT DECIDED', why: 'the transfer was accepted but its red control did not fire (forge: exit ' + g.exit + ', ' + ((g.errorsAtExamples || []).length) + ' rejection(s) at the example lines, guard ' + g.guard + ')' };
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
    /* a job that never reached Comparator because WE cancelled its run is not a decision of any kind */
    const dec = !f.ran && meta.conclusion === 'cancelled' ? { word: 'NOT RUN', stage: 'cancelled', why: 'its run was cancelled before Comparator ran' } : decide(f);
    r.runs.push({ run: meta.run, workflowSha: meta.workflowSha, at: meta.updatedAt, exit: f.exit, seconds: f.seconds, cacheSeconds: f.cacheSeconds, maxRssKB: f.maxRssKB, kernels: f.kernels, decided: dec, strict: f.ran ? decideStrict(f, ch) : null, transfer: f.ran ? decideTransfer(f, ch) : null });
    rows.set(ch.name, r);
  }
}
for (const r of rows.values()) {
  const ran = r.runs.filter((x) => x.decided.word !== 'NOT RUN');
  const last = ran.length ? ran[ran.length - 1] : r.runs[r.runs.length - 1];
  r.word = last.decided.word;
  if (r.word === 'REFUTED?') {
    const agree = r.runs.filter((x) => x.decided.word === 'REFUTED?').length;
    r.word = agree >= 2 ? 'REFUTED' : 'REFUTED — TO REPRODUCE';
  }
  r.why = last.decided.why; r.stage = last.decided.stage || null;
  r.strict = last.strict;
  /* the latest run that ran the transfer check decides it */
  const tr = r.runs.filter((x) => x.transfer); r.transfer = tr.length ? tr[tr.length - 1].transfer : null;
}
const list = [...rows.values()].filter((r) => r.word !== 'NOT RUN').sort((a, b) => a.challenge.localeCompare(b.challenge));
const notRun = [...rows.values()].filter((r) => r.word === 'NOT RUN').map((r) => r.challenge).sort();
const tally = (xs) => xs.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});
const ledger = {
  what: 'Lane K of the openai/math audit: each Comparator challenge re-run on Linux with nanoda on, decided by the words of corpus/openai-math/preregistration.json (lanes.K). CERTIFIED here means the Lean theorem states exactly the challenge statement, uses only propext / Quot.sound / Classical.choice, and two independently written kernels accept the proof. It does not mean the paper\'s claim is proved: that is lane S.',
  release: { commit: release.commit, challenges: release.challenges.length },
  decider: prereg.lanes.K.decider,
  declaredChanges: prereg.lanes.K.declaredChanges,
  trustBase: prereg.lanes.K.trustBase,
  notRunYet: notRun,
  counts: { decided: list.length, of: release.challenges.length, cancelledBeforeComparator: notRun.length, words: tally(list.map((r) => r.word)), strict: tally(list.filter((r) => r.strict).map((r) => r.strict.word)), transfer: tally(list.filter((r) => r.transfer).map((r) => r.transfer.word)) },
  rows: list,
};
writeStable(OUT, ledger);
console.log('certs/openai-math-kernel.json: ' + list.length + ' of ' + release.challenges.length + ' challenges — ' + JSON.stringify(ledger.counts.words) + (Object.keys(ledger.counts.strict).length ? '; strict ' + JSON.stringify(ledger.counts.strict) : ''));
for (const r of list) console.log('  ' + r.word.padEnd(22) + r.challenge.padEnd(34) + (r.strict ? '[' + r.strict.word + '] ' : '') + (r.word === 'CERTIFIED' ? '' : r.why));
