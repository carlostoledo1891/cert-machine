#!/usr/bin/env node
/* record-cryptids-kernel.js — certs/cryptids-kernel.json from the artifacts of .github/workflows/cryptids-kernel.yml.
   THE ONE PLACE the kernel lane's facts become a word: CERTIFIED when Comparator printed "Your solution is okay!", every
   named theorem was checked with only the permitted axioms, and the run exited 0 — a concordance with the repository's
   own CI, never a verification of the mathematics; REFUSED otherwise (a build that did not finish, a kernel that did not
   answer), never REFUTED, because a job that cannot finish says nothing about the proofs.

     gh run download <run-id> -D <dir>            the artifacts cryptids-<config>/result.json
     node tools/record-cryptids-kernel.js <dir> <run-id>                                                           MIT */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const [dir, runId] = process.argv.slice(2);
if (!dir) { console.error('usage: record-cryptids-kernel.js <artifacts-dir> <run-id>'); process.exit(2); }
const prov = JSON.parse(fs.readFileSync(path.join(ROOT, 'PROVENANCE-cryptids.json'), 'utf8'));
const rows = [];
for (const name of fs.readdirSync(dir).filter((n) => n.startsWith('cryptids-')).sort()) {
  const p = path.join(dir, name, 'result.json');
  if (!fs.existsSync(p)) continue;
  const f = JSON.parse(fs.readFileSync(p, 'utf8'));
  const okay = f.ran && f.exit === 0 && f.okay;
  const row = {
    config: f.config, theorems: f.theorems, permittedAxioms: f.permitted_axioms, nanodaRequested: f.nanodaRequested, nanodaAnswered: f.nanodaAnswered === true || (f.kernels || []).some((k) => /nanoda/i.test(k)),
    exit: f.exit, seconds: f.seconds, cacheSeconds: f.cacheSeconds, buildSeconds: f.buildSeconds, rssKb: f.rssKb,
    kernels: f.kernels, env: f.env, sha256: f.sha256,
    verdict: okay ? 'CERTIFIED' : 'REFUSED',
    why: okay ? 'Comparator: every named theorem states what the challenge states, uses only the permitted axioms, and its proof replays through ' + ((f.kernels || []).some((k) => /nanoda/i.test(k)) ? 'Lean\'s kernel and through nanoda' : 'Lean\'s kernel (nanoda did not answer in this run: the configuration key the first dispatch set is one comparator ignores)')
      : (!f.ran ? 'the job did not run to the comparator step' : f.exit !== 0 ? 'comparator exited ' + f.exit + ' (a build or a check that did not finish; the tail of its log is in the artifact)' : 'comparator did not print its acceptance line'),
    logTail: f.logTail ? f.logTail.slice(-1200) : null, errTail: f.errTail ? f.errTail.slice(-600) : null,
  };
  rows.push(row);
}
const rec = {
  what: 'The kernel lane of the cryptids audit: google-deepmind/cryptids at its pin built with its own toolchain and audited by leanprover/comparator with nanoda on, using the configurations the repository ships. A CERTIFIED row is a concordance with the repository\'s own CI (the stated theorems are the ones proved, the axioms are as printed, a second kernel accepts the proofs); it verifies no mathematics. Written by tools/record-cryptids-kernel.js from the workflow\'s artifacts.',
  source: { repository: 'github.com/google-deepmind/cryptids', commit: prov.source_commit, workflow: '.github/workflows/cryptids-kernel.yml', run: runId || null },
  generated: new Date().toISOString().slice(0, 10),
  summary: rows.reduce((s, r) => { s[r.verdict] = (s[r.verdict] || 0) + 1; return s; }, {}),
  rows,
};
fs.writeFileSync(path.join(ROOT, 'certs', 'cryptids-kernel.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/cryptids-kernel.json: ' + rows.map((r) => r.config + ' ' + r.verdict + (r.seconds ? ' (' + r.seconds + ' s)' : '')).join(', '));
