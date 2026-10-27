#!/usr/bin/env node
/* record-openai-math-kernel.js — lane K's ledger, certs/openai-math-kernel.json.

   Downloads the artifacts of one or more runs of .github/workflows/openai-math-kernel.yml
   (each job uploads kernel-<challenge>/result.json: the facts of one Comparator run, no
   verdict) and DECIDES each row by the words fixed in corpus/openai-math/preregistration.json
   (lanes.K.words, lanes.K.strictWords). The rule lives here and only here: the page, the
   handoff and any note read this ledger.

   A challenge run twice keeps both runs; its row is decided on the LATEST run, and a REFUTED
   is only stated when two runs agree (preregistration: "reproduced by a second run").

   A LATER PIN (pre-registration amendment 17, 2026-10-27): --pin <sha> records runs dispatched with math_pin=<sha>
   into their own store and ledger — corpus/openai-math/kernel-runs-<pin8>/ and certs/openai-math-kernel-<pin8>.json,
   decided against that pin's census (release-<pin8>.json) — and never touches the audit pin's. A run whose title or
   whose jobs' env.txt name another pin is refused.

   usage: node tools/record-openai-math-kernel.js [--pin <sha>] <run-id> [<run-id> ...] [--partial]
          node tools/record-openai-math-kernel.js [--pin <sha>] --rebuild      (re-decide from the runs on disk) */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const { writeStable } = require('./stable-json.js');

const ROOT = path.resolve(__dirname, '..');
const AUDIT_PIN = 'fd4aeeb2ee4fc729c18d98444fed42fd0529eeeb';
const argv = process.argv.slice(2);
const pinAt = argv.indexOf('--pin');
const PIN = pinAt >= 0 ? argv[pinAt + 1] : AUDIT_PIN;
if (!/^[0-9a-f]{40}$/.test(PIN || '')) { console.error('--pin takes a full 40-hex commit'); process.exit(2); }
const LATER = PIN !== AUDIT_PIN;
const SUFFIX = LATER ? '-' + PIN.slice(0, 8) : '';
const RUNS = path.join(ROOT, 'corpus', 'openai-math', 'kernel-runs' + SUFFIX);
const OUT = path.join(ROOT, 'certs', 'openai-math-kernel' + SUFFIX + '.json');
const release = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', LATER ? 'release' + SUFFIX + '.json' : 'release.json'), 'utf8'));
if (release.commit !== PIN) { console.error('the census is of ' + release.commit + ', not ' + PIN); process.exit(1); }
const prereg = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'openai-math', 'preregistration.json'), 'utf8'));
/* a later pin runs only the challenges its amendment lists (ADDED + CHANGED), fixed before any run */
const AMEND = LATER ? prereg.amendments.find((a) => a.pin && a.pin.commit === PIN) : null;
if (LATER && !AMEND) { console.error('no pre-registration amendment names the pin ' + PIN); process.exit(1); }
const REPO = 'carlostoledo1891/cert-machine';

const args = argv.filter((a, i) => !(pinAt >= 0 && (i === pinAt || i === pinAt + 1)));
if (!args.length) { console.error('usage: record-openai-math-kernel.js [--pin <sha>] <run-id> ... | --rebuild'); process.exit(2); }

/* 1 · fetch: each run's artifacts land in corpus/openai-math/kernel-runs/<run>/<challenge>.json,
   the facts only (result.json), with the run's own metadata beside them */
for (const run of args.filter((a) => /^\d+$/.test(a))) {
  const meta = JSON.parse(cp.execSync(`gh run view ${run} -R ${REPO} --json databaseId,headSha,createdAt,updatedAt,status,conclusion,url,displayTitle`, { encoding: 'utf8' }));
  /* the run's title carries its math_pin (run-name, amendment 17); a run with no pin in its title predates the input
     and ran at the audit pin */
  const titlePin = (/@ ([0-9a-f]{40})/.exec(meta.displayTitle || '') || [])[1] || AUDIT_PIN;
  if (titlePin !== PIN) { console.error('run ' + run + ' ran at ' + titlePin + ', not ' + PIN + ' (pass --pin ' + titlePin + ')'); process.exit(1); }
  /* --partial records the jobs of a run still in progress (their artifacts exist once each job ends); the run's
     directory is rewritten whole when it is recorded again after it completes */
  if (meta.status !== 'completed' && !args.includes('--partial')) { console.error('run ' + run + ' is ' + meta.status + '; record it when it completes, or pass --partial'); process.exit(1); }
  const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'omk-'));
  /* a run in progress may have no challenge artifact yet (only kernel-tools): with --partial that is not an error */
  try { cp.execSync(`gh run download ${run} -R ${REPO} -D ${tmp} --pattern 'kernel-*'`, { stdio: 'inherit' }); }
  catch (e) { if (!args.includes('--partial')) throw e; }
  const dir = path.join(RUNS, String(run));
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const a of fs.readdirSync(tmp)) {
    if (a === 'kernel-tools') continue;
    const f = path.join(tmp, a, 'result.json');
    const ch = a.replace(/^kernel-/, '');
    const fact = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : { challenge: ch, ran: false, missing: 'no result.json in the artifact' };
    const factPin = ((fact.env || []).find((l) => /^math pin: /.test(l)) || '').replace(/^math pin: /, '') || AUDIT_PIN;
    if (fact.ran !== false && factPin !== PIN) { console.error('run ' + run + ', ' + ch + ': the job ran at ' + factPin + ', not ' + PIN); process.exit(1); }
    fs.writeFileSync(path.join(dir, ch + '.json'), JSON.stringify(fact, null, 1) + '\n');
  }
  /* a job that ENDED without uploading a result (the runner terminated it mid-step, so even the always() upload
     never ran) has no artifact to download; it is recorded from the job list, with the step it died in, rather
     than left out — a run that kills a job is a fact about the challenge on this machine */
  const jobs = JSON.parse(cp.execSync(`gh api --paginate repos/${REPO}/actions/runs/${run}/jobs?per_page=100 --jq '[.jobs[] | {id, name, status, conclusion, steps: [.steps[] | {name, conclusion}]}]'`, { encoding: 'utf8' }).replace(/\]\s*\[/g, ','));
  for (const j of jobs) {
    const mt = /^check \((.+)\)$/.exec(j.name);
    if (!mt || j.status !== 'completed' || j.conclusion === 'success' || fs.existsSync(path.join(dir, mt[1] + '.json'))) continue;
    /* the step it died in: the first that did not succeed (a runner that lost contact leaves it with no conclusion) */
    const step = (j.steps.find((s) => s.conclusion !== 'success' && s.conclusion !== 'skipped') || {}).name || 'an unnamed step';
    const said = JSON.parse(cp.execSync(`gh api repos/${REPO}/check-runs/${j.id}/annotations --jq '[.[].message]'`, { encoding: 'utf8' }))
      .filter((m) => !/Node\.js 20 is deprecated/.test(m)).join(' | ');
    fs.writeFileSync(path.join(dir, mt[1] + '.json'), JSON.stringify({ challenge: mt[1], ran: false, jobConclusion: j.conclusion,
      missing: j.conclusion === 'cancelled' ? 'the job was cancelled in the step "' + step + '" (its time limit, or a cancel) without uploading a result'
        : 'the job ended (' + j.conclusion + ') in the step "' + step + '" without uploading a result: the runner terminated it' + (said ? ' (GitHub: ' + said + ')' : '') }, null, 1) + '\n');
  }
  n = fs.readdirSync(dir).filter((f) => f.endsWith('.json') && f !== '_run.json').length;
  fs.writeFileSync(path.join(dir, '_run.json'), JSON.stringify(Object.assign({ run: meta.databaseId, workflowSha: meta.headSha, createdAt: meta.createdAt, updatedAt: meta.updatedAt, status: meta.status, conclusion: meta.conclusion, url: meta.url, jobs: n }, LATER ? { mathPin: PIN } : {}), null, 1) + '\n');
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('run ' + run + ': ' + n + ' challenge results');
}

/* 2 · decide: the words of the pre-registration, from the facts */
const { accepts, rejects, decide } = require('./comparator-verdict.js');   /* the rule, shared with the AlphaProof Nexus lane */
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
  if (g.errorsAtExamples && g.errorsAtExamples.length && !(g.errorsInCopy || []).length && g.guard === 'OK') return { word: 'TRANSFERS', why: 'Lean accepts every solution theorem for the statement the challenge displays (guard: ' + t.guardLine + '); the red control (' + (g.redControl || 'one displayed hole body replaced by sorry') + ') is rejected', redControl: 'fired: ' + (g.redControl || 'hole') };
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
/* the nanoda build of a run whose jobs did not print it: the amendment-13 dispatches name theirs in
   corpus/openai-math/kernel-runs/dispatch-order.json; before them, the workflow at the run's commit either raised the
   stack (amendment 11, 'stack1g') or ran nanoda as published ('stock') */
const DISPATCH = (() => { try { return JSON.parse(fs.readFileSync(path.join(RUNS, 'dispatch-order.json'), 'utf8')); } catch (e) { return {}; } })();
const buildCache = new Map();
function buildOfRun(meta) {
  const key = String(meta.run);
  if (buildCache.has(key)) return buildCache.get(key);
  let b = null;
  for (const v of Object.values(DISPATCH)) if (v && typeof v === 'object' && !Array.isArray(v) && String(v.run || ('runpod-' + (v.pod || ''))) === key && v.nanodaBuild) b = v.nanodaBuild;
  if (!b && meta.nanodaBuild) b = meta.nanodaBuild;
  if (!b && /^[0-9a-f]{40}$/.test(meta.workflowSha || '')) {
    try { b = /1_073_741_824/.test(cp.execSync('git show ' + meta.workflowSha + ':.github/workflows/openai-math-kernel.yml', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })) ? 'stack1g' : 'stock'; } catch (e) { b = null; }
  }
  buildCache.set(key, b);
  return b;
}
/* GitHub runs (numeric ids) and RunPod runs (runpod-<pod>, amendment 14, tools/import-runpod-openai-math.js), in the
   order they were created — the latest run of a challenge decides its row */
const created = (d) => { try { return JSON.parse(fs.readFileSync(path.join(RUNS, d, '_run.json'), 'utf8')).createdAt || ''; } catch (e) { return ''; } };
const runDirs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^(\d+|runpod-[a-z0-9]+)$/.test(d) && fs.existsSync(path.join(RUNS, d, '_run.json')))
  .sort((a, b) => created(a).localeCompare(created(b)) || a.localeCompare(b)) : [];
for (const d of runDirs) {
  const meta = JSON.parse(fs.readFileSync(path.join(RUNS, d, '_run.json'), 'utf8'));
  for (const file of fs.readdirSync(path.join(RUNS, d)).filter((x) => x.endsWith('.json') && x !== '_run.json')) {
    const f = JSON.parse(fs.readFileSync(path.join(RUNS, d, file), 'utf8'));
    const ch = byName.get(f.challenge);
    if (!ch) { console.error('not a census challenge: ' + f.challenge); process.exit(1); }
    const r = rows.get(ch.name) || { challenge: ch.name, families: ch.families, statementLines: ch.statementLines, nanodaInRelease: ch.enableNanoda, definitionHoles: ch.definitionNames.length, runs: [] };
    /* a job that never reached Comparator because WE cancelled its run is not a decision of any kind */
    const dec = !f.ran && meta.conclusion === 'cancelled' ? { word: 'NOT RUN', stage: 'cancelled', why: 'its run was cancelled before Comparator ran' } : decide(f);
    /* which nanoda: the job prints its build (amendment 13); a job that left no facts, or ran before that line
       existed, takes it from the dispatch record (amendment-13 runs) or from the workflow at the run's commit */
    const printed = ((f.env || []).find((l) => /^nanoda build: /.test(l)) || '').replace(/^nanoda build: /, '') || null;
    const nb = printed || buildOfRun(meta);
    if (dec.word === 'CERTIFIED' && nb && /issue44/.test(nb)) dec.why = 'Comparator exit 0; Lean\'s kernel and nanoda with the ammkrn/nanoda_lib#44 patch (' + nb + ', amendment 13) both accept';
    r.runs.push({ run: meta.run, workflowSha: meta.workflowSha, at: meta.updatedAt, nanodaBuild: nb, exit: f.exit, seconds: f.seconds, cacheSeconds: f.cacheSeconds, maxRssKB: f.maxRssKB, kernels: f.kernels, decided: dec, strict: f.ran ? decideStrict(f, ch) : null, transfer: f.ran ? decideTransfer(f, ch) : null });
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
  r.why = last.decided.why; r.stage = last.decided.stage || null; r.nanodaBuild = last.nanodaBuild || null;
  /* the latest run whose strict run reached a decision decides it (a cancelled job's absent strict run says nothing) */
  const st = r.runs.filter((x) => x.strict && x.strict.word !== 'NOT RUN'); r.strict = st.length ? st[st.length - 1].strict : last.strict;
  /* the latest run that ran the transfer check decides it */
  const tr = r.runs.filter((x) => x.transfer); r.transfer = tr.length ? tr[tr.length - 1].transfer : null;
  /* does the theorem prove the statement the challenge DISPLAYS? Settled by the strict run when the bodies are the
     same constants, or by the transfer check when they differ; anything else leaves it open */
  if (r.definitionHoles) {
    r.displayed = r.strict && r.strict.word === 'SAME BODIES' ? { word: 'PROVED', by: 'the strict run: every hole is, constant for constant, the displayed definition' }
      : r.transfer && r.transfer.word === 'TRANSFERS' ? { word: 'PROVED', by: 'the transfer check: Lean accepts the theorem for the displayed statement, red control rejected' }
      : { word: 'OPEN', by: 'neither the strict run nor the transfer check settles it' };
  }
}
const list = [...rows.values()].filter((r) => r.word !== 'NOT RUN').sort((a, b) => a.challenge.localeCompare(b.challenge));
const notRun = [...rows.values()].filter((r) => r.word === 'NOT RUN').map((r) => r.challenge).sort();
const tally = (xs) => xs.reduce((o, x) => ((o[x] = (o[x] || 0) + 1), o), {});
/* a later pin: only its amendment's challenges are members, and every one of them is listed, run or not */
if (LATER) for (const r of list) if (!AMEND.challenges.order.includes(r.challenge)) { console.error(r.challenge + ' is not in the amendment\'s list for ' + PIN.slice(0, 8)); process.exit(1); }
const members = LATER ? AMEND.challenges.order : release.challenges.map((c) => c.name);
const ledger = {
  what: 'Lane K of the openai/math audit: each Comparator challenge re-run on Linux with nanoda on, decided by the words of corpus/openai-math/preregistration.json (lanes.K). CERTIFIED here means the Lean theorem states exactly the challenge statement, uses only propext / Quot.sound / Classical.choice, and two independently written kernels accept the proof. It does not mean the paper\'s claim is proved: that is lane S.'
    + (LATER ? ' THIS LEDGER IS THE SECOND PIN, ' + PIN + ' (pre-registration amendment ' + (prereg.amendments.indexOf(AMEND) + 1) + '): only the ' + members.length + ' challenges ADDED or CHANGED since ' + AUDIT_PIN.slice(0, 8) + ' are members; the ' + AMEND.challenges.unchanged + ' unchanged ones are not re-run, and the audit pin\'s ledger, certs/openai-math-kernel.json, stands as it was.' : ''),
  release: Object.assign({ commit: release.commit, challenges: release.challenges.length }, LATER ? { previous: AUDIT_PIN, members: members.length, unchangedNotRun: AMEND.challenges.unchanged, amendment: prereg.amendments.indexOf(AMEND) + 1 } : {}),
  decider: prereg.lanes.K.decider,
  declaredChanges: prereg.lanes.K.declaredChanges,
  trustBase: prereg.lanes.K.trustBase,
  notRunYet: LATER ? members.filter((m) => !list.find((r) => r.challenge === m)).sort() : notRun,
  counts: { decided: list.length, of: members.length, cancelledBeforeComparator: notRun.length, words: tally(list.map((r) => r.word)), strict: tally(list.filter((r) => r.strict).map((r) => r.strict.word)), transfer: tally(list.filter((r) => r.transfer).map((r) => r.transfer.word)), displayed: tally(list.filter((r) => r.displayed).map((r) => r.displayed.word)) },
  rows: list,
};
writeStable(OUT, ledger);
console.log(path.relative(ROOT, OUT) + ': ' + list.length + ' of ' + members.length + ' challenges — ' + JSON.stringify(ledger.counts.words) + (Object.keys(ledger.counts.strict).length ? '; strict ' + JSON.stringify(ledger.counts.strict) : ''));
for (const r of list) console.log('  ' + r.word.padEnd(22) + r.challenge.padEnd(34) + (r.strict ? '[' + r.strict.word + '] ' : '') + (r.word === 'CERTIFIED' ? '' : r.why));
