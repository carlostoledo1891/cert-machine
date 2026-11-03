#!/usr/bin/env node
/* record-eth-hawkley-heavy.js — certs/eth-hawkley-heavy.json: the HEAVY link of Daniel Hawkley's ETH bridge decided
   from the facts of one RunPod run (tools/runpod-eth-hawkley.sh, imported by tools/import-runpod-eth-hawkley.js into
   corpus/eth-refutation/hawkley/runs/runpod-<pod>/): his theorem
     OAI.Bridges.ETH.not_positiveRateETH : ¬ OAI.ParityWL.Complexity.PositiveRateETH
   (lean/OAI/Bridges/ETH/FinalImplication.lean), proved from OpenAI's original_sat_main on top of the whole family-378
   build. There is no Comparator challenge for it in his tree, so the rule stands on: the clone at the pin with
   OpenAI's files against our pins (exactly lean/lakefile.lean differing, by his six-line block) and his files against
   corpus/eth-refutation/hawkley/pins.json; lake update moving no pinned dependency; the claimant's build exit 0; #print
   axioms from OUR file naming only the three standard axioms for his theorem and for OpenAI's; a standalone
   lean4export of the theorem's closure accepted by nanoda (our build) and the negative control (Classical.choice not
   permitted) rejected; leanchecker --fresh over the module when it ran. THE RULE LIVES HERE AND NOWHERE ELSE.

   The words are certs/eth-kernel.json's:
     CERTIFIED  every fact above holds (leanchecker counted when it ran; absent, it is a gap, not a refusal)
     REFUTED    a kernel (nanoda or leanchecker) rejects the solution on a type error, reproduced by a second run
     REFUSED    no decision, with the exact reason (resources, a build failure, bytes off the pins, a moved dependency,
                a control that did not fire, or one kernel rejection not yet reproduced)

   usage: node tools/record-eth-hawkley-heavy.js [<pod-id>]   decide from the imported run (the latest when omitted)
          node tools/record-eth-hawkley-heavy.js --check      the battery: the record on disk is what the run decides */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const RUNS = path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley', 'runs');
const OUT = path.join(ROOT, 'certs', 'eth-hawkley-heavy.json');
const STD = ['propext', 'Classical.choice', 'Quot.sound'];
const check = process.argv.includes('--check');
const podArg = process.argv.slice(2).find((a) => /^[a-z0-9]{10,}$/.test(a));
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const num = (s) => { const t = (s || '').trim(); return /^-?\d+$/.test(t) ? Number(t) : null; };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const dirs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => d.startsWith('runpod-')).sort() : [];
const dir = podArg ? path.join(RUNS, 'runpod-' + podArg) : (dirs.length ? path.join(RUNS, dirs[dirs.length - 1]) : null);
if (!dir || !fs.existsSync(dir)) { console.error('no imported run under corpus/eth-refutation/hawkley/runs/'); process.exit(2); }
const H = path.join(dir, 'hawkley');
const run = J(path.join(dir, '_run.json'));
const res = fs.existsSync(path.join(H, 'result.json')) ? J(path.join(H, 'result.json')) : null;
const HP = J(path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley', 'pins.json'));
const OP = J(path.join(ROOT, 'corpus', 'eth-refutation', 'pins.json')).claims.openai;

/* ---- the facts, each read from a file the pod wrote ---- */
const step = (s) => ({ exit: num(read(path.join(H, s + '.exit'))), seconds: (num(read(path.join(H, s + '.end'))) != null && num(read(path.join(H, s + '.start'))) != null) ? num(read(path.join(H, s + '.end'))) - num(read(path.join(H, s + '.start'))) : null,
  ran: fs.existsSync(path.join(H, s + '.exit')), started: fs.existsSync(path.join(H, s + '.start')),
  maxRssKB: res && res.steps && res.steps[s] ? res.steps[s].maxRssKB : null, containerPeakKB: res && res.steps && res.steps[s] ? res.steps[s].containerPeakKB : null });
const steps = Object.fromEntries(['prepare', 'build', 'axioms', 'export', 'nanoda', 'nanoda-control', 'leanchecker'].map((s) => [s, step(s)]));
const head = (read(path.join(H, 'head.txt')) || '').trim();
const verify = fs.existsSync(path.join(H, 'verify.json')) ? J(path.join(H, 'verify.json')) : null;
const extras = fs.existsSync(path.join(H, 'extras.json')) ? J(path.join(H, 'extras.json')) : null;
const prepLog = read(path.join(H, 'prepare.log')) || '';
const buildLog = read(path.join(H, 'build.log')) || '';
const nanodaErr = read(path.join(H, 'nanoda.err')) || '', controlErr = read(path.join(H, 'nanoda-control.err')) || '';
const freshErr = read(path.join(H, 'leanchecker.err')) || '', freshLog = read(path.join(H, 'leanchecker.log')) || '';
const exportSha = (read(path.join(H, 'export.sha256')) || '').split(/\s+/)[0] || null;

const facts = {};
facts.headAtPin = head.startsWith(HP.hawkley.commit);
facts.openaiFilesAtPins = !!verify && verify.checked > 3900 && verify.mismatches.length === 1 && /^lean\/lakefile\.lean: /.test(verify.mismatches[0]) && verify.unpinned.length === 0;
/* his files: every pinned file under lean/ present in the clone with the pinned sha256 (the pod cloned lean/ only) */
const hisLean = Object.entries(HP.hawkley.files).filter(([p]) => p.startsWith('lean/'));
const hisMissing = extras ? hisLean.filter(([p, s]) => (p === 'lean/lakefile.lean' ? (extras.modified[p] !== s) : (extras.extras[p] !== s))).map(([p]) => p) : hisLean.map(([p]) => p);
facts.hisFilesAtPins = extras != null && hisMissing.length === 0;
/* the lakefile: OpenAI's pinned bytes plus exactly his six added lines, nothing removed */
const diff = extras ? extras.lakefile_diff.filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)) : [];
const srcLake = read(path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley', 'src', 'lean', 'lakefile.lean')) || '';
const baseLake = read(path.join(ROOT, 'corpus', 'eth-refutation', 'hawkley', 'base', 'lean', 'lakefile.lean')) || '';
const added = diff.filter((l) => l.startsWith('+')).map((l) => l.slice(1)), removed = diff.filter((l) => l.startsWith('-'));
facts.lakefileIsBasePlusBlock = extras != null && extras.openai_lakefile_sha256 === OP.files['lean/lakefile.lean'] && removed.length === 0 && added.length === 6 && srcLake === baseLake.replace(/\n$/, '') + '\n' + added.join('\n') + '\n';
if (!facts.lakefileIsBasePlusBlock && extras && removed.length === 0 && added.length === 6) facts.lakefileIsBasePlusBlock = srcLake.includes(added.join('\n')) && sha(baseLake) === OP.files['lean/lakefile.lean'];
facts.manifestUnmoved = /all 42 dependency revisions equal the pinned manifest/.test(prepLog);
facts.prepareOk = steps.prepare.exit === 0;
facts.buildOk = steps.build.exit === 0 && /Build completed successfully/.test(buildLog);
const printed = res && res.axioms && res.axioms.printed ? res.axioms.printed : [];
facts.axiomsStandard = printed.length === 2 && printed.every((a) => a.axioms.length && a.axioms.every((x) => STD.includes(x)))
  && printed.some((a) => a.theorem === 'OAI.Bridges.ETH.not_positiveRateETH') && printed.some((a) => a.theorem === 'OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main');
facts.exportOk = steps.export.exit === 0 && !!exportSha;
facts.nanodaAccepts = steps.nanoda.exit === 0;
facts.nanodaResourceAbort = steps.nanoda.exit !== 0 && /overflow|Killed|memory|timed out|timeout/i.test(nanodaErr);
facts.controlRejectsOnAxiom = steps['nanoda-control'].exit === 1 && /unpermitted axiom "Classical\.choice"/.test(controlErr);
facts.leanchecker = !steps.leanchecker.started ? 'not run' : !steps.leanchecker.ran ? 'running' : steps.leanchecker.exit === 0 ? 'REPLAYED' : (steps.leanchecker.exit === 124 ? 'timed out' : 'exit ' + steps.leanchecker.exit);

/* ---- the rule ---- */
const musts = ['headAtPin', 'openaiFilesAtPins', 'hisFilesAtPins', 'lakefileIsBasePlusBlock', 'manifestUnmoved', 'prepareOk', 'buildOk', 'axiomsStandard', 'exportOk', 'nanodaAccepts', 'controlRejectsOnAxiom'];
const failed = musts.filter((k) => !facts[k]);
let word, why;
const kernelRejects = (steps.nanoda.ran && steps.nanoda.exit !== 0 && !facts.nanodaResourceAbort) || (facts.leanchecker.startsWith('exit ') && !/Killed|memory|timed out/i.test(freshErr));
if (kernelRejects) { word = 'REFUSED'; why = 'a kernel rejected the solution in this one run (' + (steps.nanoda.exit !== 0 ? 'nanoda exit ' + steps.nanoda.exit : 'leanchecker ' + facts.leanchecker) + '); REFUTED needs a second run that reproduces it'; }
else if (failed.length) { word = 'REFUSED'; why = 'not every fact holds: ' + failed.join(', ') + (steps.build.exit === 124 ? ' (the build timed out: resources)' : ''); }
else { word = 'CERTIFIED'; why = 'the clone at the pin, OpenAI’s ' + verify.checked + ' pinned files unchanged but the lakefile (his six-line block), his ' + hisLean.length + ' files at their pins, lake update moving no dependency; lake build exit 0 (' + steps.build.seconds + ' s); #print axioms (our file) names only propext, Classical.choice, Quot.sound for his theorem and for OpenAI’s original_sat_main; nanoda accepts the theorem’s closure exported by lean4export (' + steps.nanoda.seconds + ' s) and rejects the negative control; leanchecker --fresh ' + (facts.leanchecker === 'REPLAYED' ? 'replayed the module into an empty environment (exit 0, ' + steps.leanchecker.seconds + ' s)' : facts.leanchecker); }

const gaps = [
  'No Comparator challenge exists for this theorem in the claimant’s tree: its statement is read from the pinned bytes of lean/OAI/Bridges/ETH/FinalImplication.lean (¬ OAI.ParityWL.Complexity.PositiveRateETH, no premise), not compared by Comparator against a trusted file; the kernels decide the proof, the bytes decide the statement.',
  'The trust base includes OpenAI’s proof of original_sat_main, rebuilt here as part of the same lake build and reached by the same nanoda export; OpenAI’s own Comparator-checked statement is exact_count_and_sat (certs/eth-kernel.json, CERTIFIED), and the step from it to ¬ PositiveRateETH is this theorem’s content.',
  'With the light theorem (certs/eth-hawkley-bridge.json) the chain from OpenAI’s accepted theorem to Anthropic’s MainResults.ETHIsFalse is kernel-checked inside OpenAI’s Lean v4.34.1 and Mathlib d13f23b7; Anthropic proved ETHIsFalse on v4.33.1 with Mathlib 0df444a3, and the elaborated terms across that seam are not compared here (certs/eth-seam.json did it for TSavo’s direction).',
  'The claimant’s page names 81ec97cd2 as the commit where this theorem was verified; the replay is of his HEAD d6b79b7d1, which holds the same bridge modules by his later commits’ file lists (read, not decided): the pinned bytes are d6b79b7d1’s.',
  facts.leanchecker === 'REPLAYED' ? 'leanchecker --fresh replayed every constant the module reaches, OpenAI’s proof included.' : 'leanchecker --fresh: ' + facts.leanchecker + ' — the rule stands on nanoda and the toolchain’s kernel inside lake build.'
];

const rec = {
  what: 'The heavy link of Daniel Hawkley’s ETH bridge — OAI.Bridges.ETH.not_positiveRateETH : ¬ OAI.ParityWL.Complexity.PositiveRateETH, proved from OpenAI’s original_sat_main inside thinkthoughts/math @ ' + HP.hawkley.commit.slice(0, 8) + ' (a fork of openai/math at 7ef5c0cc) — decided from the facts of one RunPod run of tools/runpod-eth-hawkley.sh. No Comparator challenge exists for it; the rule is in tools/record-eth-hawkley-heavy.js.',
  words: { CERTIFIED: 'the clone and every file at the pins (OpenAI’s unchanged but the lakefile’s six-line block), lake update moving no dependency, the claimant’s build exit 0, #print axioms (our file) only the three standard axioms for his theorem and OpenAI’s, nanoda accepting the theorem’s exported closure and rejecting the negative control; leanchecker counted when it ran', REFUTED: 'a kernel rejects the solution on a type error, reproduced by a second run', REFUSED: 'no decision, with the exact reason' },
  claim: { repository: HP.hawkley.repository, forkOf: HP.hawkley.forkOf, commit: HP.hawkley.commit, commitDate: HP.hawkley.commitDate, author: HP.hawkley.author, theorem: 'OAI.Bridges.ETH.not_positiveRateETH', module: 'OAI.Bridges.ETH.FinalImplication', upstream: 'OAI.Algorithms.SubexponentialSAT.SqrtLogSpace.original_sat_main', pageNamesCommit: '81ec97cd23d21675cee4ee76768fffba33a61e17' },
  run: { pod: run.pod, audit: run.audit, pin: run.pin, imported: run.imported, complete: run.complete, phase: run.status && run.status._phase, machine: run.status && run.status._machine, started: run.status && run.status._started, env: res ? res.env : null, head },
  steps, axiomsPrinted: printed, export: { sha256: exportSha, declarations: 'Comparator’s list: the theorem plus Quot, propext, Quot.sound, Classical.choice and the Nat/String builtins' },
  nanoda: { exit: steps.nanoda.exit, seconds: steps.nanoda.seconds, config: fs.existsSync(path.join(H, 'nanoda.json')) ? J(path.join(H, 'nanoda.json')) : null, build: 'ammkrn/nanoda_lib 3a240721 with the issue44 patch and a 1 GiB stack (the eth-kernel lane’s)' },
  control: { exit: steps['nanoda-control'].exit, rejectedOnAxiom: facts.controlRejectsOnAxiom, errTail: controlErr.split('\n').filter((l) => /Error|axiom/.test(l)).slice(0, 2) },
  leanchecker: { status: facts.leanchecker, exit: steps.leanchecker.exit, seconds: steps.leanchecker.seconds, logTail: freshLog.split('\n').filter(Boolean).slice(-3) },
  pins: { hawkleyFiles: hisLean.length, hawkleyMissingOrChanged: hisMissing, openaiChecked: verify ? verify.checked : null, openaiMismatches: verify ? verify.mismatches : null, lakefileAddedLines: added, lakefileRemovedLines: removed.length },
  facts, word, why, gaps,
  generated: new Date().toISOString()
};

if (check) {
  if (!fs.existsSync(OUT)) { console.error('no record on disk'); process.exit(1); }
  const old = J(OUT);
  const bad = [];
  for (const k of ['word', 'why', 'gaps', 'facts', 'axiomsPrinted', 'pins']) if (JSON.stringify(old[k]) !== JSON.stringify(rec[k])) bad.push(k);
  for (const s of Object.keys(steps)) if (JSON.stringify((old.steps || {})[s]) !== JSON.stringify(steps[s])) bad.push('steps.' + s);
  if (bad.length) { console.error('FAIL  eth-hawkley-heavy --check: ' + bad.join(', ')); process.exit(1); }
  console.log('PASS  eth-hawkley-heavy --check: ' + old.word);
} else {
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('certs/eth-hawkley-heavy.json: ' + word + ' — ' + why);
  if (failed.length) console.log('  facts not holding: ' + failed.join(', '));
}
