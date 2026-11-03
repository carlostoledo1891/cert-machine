#!/usr/bin/env node
/* record-macmahon-kernel.js — certs/macmahon-kernel.json from the artifact of .github/workflows/macmahon-kernel.yml.
   THE ONE PLACE the lane's facts become a word: CERTIFIED when Comparator printed "Your solution is okay!" and exited 0,
   nanoda answered beside Lean's kernel, and every one of the ten theorems depends on nothing beyond propext,
   Classical.choice and Quot.sound in OUR axiom report — a concordance with the claimant's CI and the Palomar check, never
   a verification of the mathematics beyond what a kernel is; REFUSED otherwise, never REFUTED (a job that cannot finish
   says nothing about the proofs). The statement reading (Challenge.lean against the paper's Theorem 1) is written here as
   READ, kept apart from what was decided.
     gh run download <run-id> -n macmahon-kernel -D <dir>
     node tools/record-macmahon-kernel.js <dir> <run-id>
     node tools/record-macmahon-kernel.js --check           the record's facts re-read from the pinned artifact copy   MIT */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'macmahon-kernel.json');
const KEEP = path.join(ROOT, 'corpus', 'macmahon', 'kernel-run');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'macmahon', 'PINS.json'), 'utf8'));
const PERMITTED = ['Classical.choice', 'Quot.sound', 'propext'];

const READING = {
  what: 'Challenge.lean (imports only Mathlib) read against the paper\'s Theorem 1 ("The minimum size of a universal collection is twelve. Exactly ten labelled collections attain that size, even when repeated varieties are permitted. Each unordered partition of the six labels into triples gives one; these are all; none has repeats.") — a reading, not a decision.',
  word: 'MATCHES',
  points: [
    'An Inventory is Pair → ℕ: multiplicities allowed, so "repeated varieties permitted" is in the statement; DiagonalZero removes the thirty diagonal non-varieties; total is the collection size.',
    'PhysicalBuilds a t asks for an INJECTION of the eight slots into the stock (eight distinct physical copies) with a rotation each, and FaceFits constrains only the three exposed faces of each slot: "exteriors only, internal faces free" as the paper says.',
    'PhysicalUniversal quantifies over every ordered pair i ≠ j: all thirty varieties, each labelled by Conway\'s tableau; "labelled" (colours fixed, no quotient by colour permutations) is the statement\'s own frame, as the paper\'s Theorem 1 says.',
    'minimum_size (IsLeast … 12) and physical_minimum are the first sentence; physical_exactly_ten (Nat.card = 10) the second; physical_iff_two_triangles the third (twoTriangles s for a 3-subset s); physical_minimum_has_no_repeats the last.',
    'The five auxiliary theorems (proper_rotation_iff, exposed_face_rule, face_colours_valid, face_assignment_coverage, face_assignment_unique) certify the tables the statement rests on: the 24 rotations are exactly the proper ones, the slots expose the outward faces, and the faceColours table lists every six-distinct-colour colouring exactly once up to rotation — the same facts certs/macmahon-witnesses.json decided independently (T1).',
    'Not in the Lean statement: the physical cubes themselves (the model is the discrete one the paper declares: six face directions, signed-axis permutations of determinant +1). The paper says so; this is the one step a reader takes on the paper\'s word.',
  ],
};

function decide(f) {
  const okay = f.ran && f.exit === 0 && f.okay;
  const nanoda = f.nanodaAnswered === true;
  const names = f.theorems || [];
  const ax = f.axioms || {};
  const axOk = f.axiomsExit === 0 && names.length === 10 && names.every((n) => Array.isArray(ax[n]) && ax[n].every((a) => PERMITTED.includes(a)));
  const verdict = okay && nanoda && axOk ? 'CERTIFIED' : 'REFUSED';
  const why = verdict === 'CERTIFIED'
    ? 'Comparator: each of the ten named theorems states what Challenge.lean states, uses only the permitted axioms, and its proof replays through Lean\'s kernel and through nanoda; our own #print axioms names only propext, Classical.choice, Quot.sound (exposed_face_rule: propext alone)'
    : !f.ran ? 'the job did not reach the comparator step' : f.exit !== 0 ? 'comparator exited ' + f.exit + ' (a build or a check that did not finish; the log tail is in the artifact)' : !f.okay ? 'comparator did not print "Your solution is okay!"' : !nanoda ? 'nanoda did not answer' : 'the axiom report is not the three standard axioms for all ten theorems (exit ' + f.axiomsExit + ')';
  return { verdict, why, okay, nanoda, axOk };
}

const args = process.argv.slice(2);
if (args[0] === '--check') {
  const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
  const f = JSON.parse(fs.readFileSync(path.join(KEEP, 'result.json'), 'utf8'));
  const d = decide(f);
  const same = d.verdict === old.verdict && JSON.stringify(f.axioms) === JSON.stringify(old.axioms) && f.exit === old.comparator.exit;
  console.log((same ? 'PASS' : 'FAIL') + '  macmahon kernel --check: ' + d.verdict + ' (' + old.source.run + ')');
  process.exit(same ? 0 : 1);
}
const [dir, runId] = args;
if (!dir) { console.error('usage: record-macmahon-kernel.js <artifact-dir> <run-id> | --check'); process.exit(2); }
const src = fs.existsSync(path.join(dir, 'result.json')) ? dir : path.join(dir, 'macmahon-kernel');
const f = JSON.parse(fs.readFileSync(path.join(src, 'result.json'), 'utf8'));
fs.mkdirSync(KEEP, { recursive: true });
for (const n of ['result.json', 'env.txt', 'sha256.txt', 'axioms.log', 'comparator.log', 'audit-config.json']) if (fs.existsSync(path.join(src, n))) fs.copyFileSync(path.join(src, n), path.join(KEEP, n));
const d = decide(f);
const rec = {
  what: 'The kernel lane of the MacMahon classification (Jason Davies, 2026-11-01): the repository at the commit the Palomar registry names, built with its own toolchain (Lean v4.35.0, Mathlib v4.35.0) and audited by leanprover/comparator v4.35.0 with nanoda on, on the configuration the repository ships (comparator.json: ten theorems, Challenge.lean importing only Mathlib, Solution.lean proving them); then #print axioms from our own file. A concordance with the claimant\'s CI and the registry\'s check, never a verification of the mathematics beyond what a kernel is. The statement reading is kept apart as READ.',
  source: { repository: PINS.repo, commit: f.env && /claim: ([0-9a-f]{40})/.test(f.env) ? /claim: ([0-9a-f]{40})/.exec(f.env)[1] : PINS.registered_commit, registered_commit: PINS.registered_commit, workflow: '.github/workflows/macmahon-kernel.yml', run: runId || null, pins: 'corpus/macmahon/PINS.json' },
  generated: new Date().toISOString().slice(0, 10),
  verdict: d.verdict, why: d.why,
  comparator: { exit: f.exit, seconds: f.seconds, okay: f.okay, kernels: f.kernels, nanodaRequested: f.nanodaRequested, nanodaAnswered: f.nanodaAnswered, rssKb: f.rssKb, cacheSeconds: f.cacheSeconds, buildSeconds: f.buildSeconds },
  theorems: f.theorems, permittedAxioms: f.permitted_axioms, axioms: f.axioms, axiomsExit: f.axiomsExit,
  env: f.env, sha256: f.sha256,
  reading: READING,
  decided: { kernel: d.verdict, sufficiency_from_witnesses: 'certs/macmahon-witnesses.json', mathematics: 'not decided here beyond what a kernel is' },
  logTail: f.logTail ? f.logTail.slice(-1500) : null,
};
fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
console.log('certs/macmahon-kernel.json: ' + d.verdict + ' — ' + d.why);
