#!/usr/bin/env node
/* record-prime-gap-premises.js — certs/prime-gap-premises.json: the premises of three conditional Lean proofs of bounded
   prime gaps (OpenAI's 186, openai/PrimeGaps186 at 61340d0b; the 182 of romyar1/prime-gaps-lean at b77bf175; Axiom Math's
   212, AxiomMath/BGP212 at 6641780b), 16 of them in one ledger, and what was checked about each.

   THE MATHEMATICS IS NOT OURS, and nothing here proves a premise or verifies one of the three bounds. Re-derived from
   corpus/prime-gap-premises (the work of 2026-11-12, published 2026-11-13; every file pinned in its PROVENANCE.json) and
   refused on any difference:
     · every file is the pinned one, and the folder holds no other;
     · the 16 rows of ledger.jsonl and their statuses, each status re-derived from the evidence it names;
     · every evidence path of the ledger (they name the private folder) is mapped to its public counterpart and that
       file's sha256 is the ledger's; the two withheld files of row 182-4 are "withheld, sha256 …", read from
       step5/acceptance-read.json and found in step5/SHA256SUMS.step5;
     · step 2, the rank-four premise: the two deciders' per-prime lines add up to their summaries and agree, the
       comparison record, the brute-force control, the planted bounds 3 and 2, the largest ratio and its (p, c);
     · step 5, row 182-4: the acceptance as read, the comparison (262 of 262), the three exit files 0 / 1 / 1, the
       comparison script's hash at the run equal to the hash logged before production;
     · the seven quoted premises of the 212: both blind readings (corpus/bgp212-readings-2026-11-12) say MISMATCH;
     · the 186 rows: what certs/prime-gaps-186.json says;
     · the money and the four seal digests as RESULT-2026-11-12.md and PUBLICATION-NOTES.md state them, each digest
       found once in seals/registry.jsonl.
   The 182 repository carries no licence: nothing of it is stored here; its attribution is the line of its own NOTICE.md
   at the pinned commit, quoted.     `--check` compares.     MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const DIR = 'corpus/prime-gap-premises';
const P = path.join(ROOT, DIR);
const READINGS = 'corpus/bgp212-readings-2026-11-12';
const PRIVATE = 'notes/lean-intake-phase2-2026-11-12/';          /* the folder the ledger's evidence paths name */
const die = (m) => { console.error('PRIME GAP PREMISES RECORD REFUSED: ' + m); process.exit(1); };

/* build(read): the record, from a reader of repository-relative paths, so that a tamper test can hand it a reader that
   changes bytes in memory and see it refuse, with nothing on disk touched. */
function build(read) {
  const text = (rel) => { const b = read(rel); if (b == null) die('missing ' + rel); return b.toString('utf8'); };
  const sha = (rel) => { const b = read(rel); if (b == null) die('missing ' + rel); return crypto.createHash('sha256').update(b).digest('hex'); };
  const json = (rel) => { try { return JSON.parse(text(rel)); } catch (e) { die(rel + ' is not JSON'); } };
  const jsonl = (rel) => text(rel).split('\n').filter(Boolean).map((l, i) => { try { return JSON.parse(l); } catch (e) { die(rel + ' line ' + (i + 1) + ' is not JSON'); } });
  const c = (rel) => DIR + '/' + rel;
  const need = (cond, m) => { if (!cond) die(m); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* every copied file is the one pinned, and the folder holds no other */
  const PROV = json(c('PROVENANCE.json'));
  for (const f of PROV.files) {
    need(sha(c(f.path)) === f.sha256, f.path + ' is not the pinned file');
    need(read(c(f.path)).length === f.bytes, f.path + ' is not the pinned length');
  }
  const onDisk = [];
  (function walk(d) { for (const e of fs.readdirSync(path.join(P, d), { withFileTypes: true })) { const r = d ? d + '/' + e.name : e.name; if (e.isDirectory()) walk(r); else if (r !== 'PROVENANCE.json') onDisk.push(r); } })('');
  need(same(onDisk.sort(), PROV.files.map((f) => f.path).sort()), 'the folder and PROVENANCE.json do not list the same files');

  const RESULT = text(c('RESULT-2026-11-12.md')), PREREG = text(c('PREREGISTRATION.md')), NOTES = text(c('PUBLICATION-NOTES.md'));
  const published = (/^# What this folder is.*\((\d{4}-\d\d-\d\d)\)/m.exec(NOTES) || die('PUBLICATION-NOTES.md has no date'))[1];
  const workDate = (/^# Lean intake, Phase 2 — the result \((\d{4}-\d\d-\d\d);/m.exec(RESULT) || die('RESULT has no date'))[1];

  /* ---------------------------------------------------------------- the 186 rows: what the 186 record says */
  const R186 = json('certs/prime-gaps-186.json');
  const F186 = R186.finite;
  need(R186.verdicts.axiom1 === 'CERTIFIED on the instances' && R186.verdicts.axiom2 === 'CERTIFIED on the instances' && R186.verdicts.certificate === 'REPRODUCED',
    'certs/prime-gaps-186.json no longer says what the ledger enters for the 186');
  need(F186.primesBelow === 2000 && F186.axiom1.instances === F186.axiom1.holdInBoth && F186.axiom2.instances === F186.axiom2.holdInBoth
    && F186.axiom1.fails === 0 && F186.axiom2.fails === 0 && F186.axiom1.undecided === 0 && F186.axiom2.undecided === 0, 'an instance of a 186 axiom no longer holds in both deciders');
  need(/^61340d0b/.test(R186.pins.commit), 'the 186 record is no longer pinned at 61340d0b');

  /* ---------------------------------------------------------------- step 2: the rank-four premise on instances */
  const BOUND = 2000;
  const primes = []; for (let p = 2; p < BOUND; p++) { let ok = true; for (let d = 2; d * d <= p; d++) if (p % d === 0) { ok = false; break; } if (ok) primes.push(p); }
  const la = jsonl(c('out/decider-a.jsonl')), lb = jsonl(c('out/decider-b.jsonl'));
  const A = la[la.length - 1].summary, B = lb[lb.length - 1].summary;
  need(A && B, 'a decider has no summary line (the run is not finished)');
  const pa = la.slice(0, -1), pb = lb.slice(0, -1);
  need(same(pa.map((r) => r.p), primes) && same(pb.map((r) => r.p), primes), 'a decider did not run exactly the primes below ' + BOUND);
  const KEYS = ['instances', 'holds', 'fails', 'undecided', 'fails3', 'fails2'];
  for (const [name, rows, S] of [['A', pa, A], ['B', pb, B]]) {
    need(S.primes === primes.length, 'decider ' + name + ': the summary counts ' + S.primes + ' primes');
    for (const k of KEYS) need(rows.reduce((t, r) => t + r[k], 0) === S[k], 'decider ' + name + ': the per-prime ' + k + ' do not add up to the summary');
    for (const r of rows) need(r.instances === r.p - 1 && r.holds === r.instances && r.fails === 0 && r.undecided === 0, 'decider ' + name + ': an instance at p = ' + r.p + ' does not hold');
  }
  const instances = primes.reduce((t, p) => t + p - 1, 0);
  need(A.instances === instances && B.instances === instances, 'the deciders do not count every c ≠ 0 at every prime');
  need(A.holds === instances && B.holds === instances && A.fails === 0 && B.fails === 0 && A.undecided === 0 && B.undecided === 0, 'an instance does not hold in both deciders');
  for (let i = 0; i < primes.length; i++) need(pa[i].fails3 === pb[i].fails3 && pa[i].fails2 === pb[i].fails2, 'the planted bounds fail on different counts at p = ' + primes[i]);
  need(A.fails3 > 0 && A.fails2 > 0, 'a planted bound was not refuted');
  /* the planted bound 3, set against set: out/planted3-sets.txt (the per-instance value files are withheld) */
  const p3 = text(c('out/planted3-sets.txt'));
  const m3 = /A at the recorded precision: (\d+) \| B: (\d+) \| A subset of B: (True|False) \| in B only: (\[.*\])\nof those, failing bound 3 at F = 64 in decider A: (\d+) of (\d+)/.exec(p3) || die('out/planted3-sets.txt does not read as expected');
  const onlyB = (m3[4].match(/\(\d+, \d+\)/g) || []).length;
  need(Number(m3[2]) === B.fails3 && m3[3] === 'True' && Number(m3[1]) + onlyB === B.fails3 && Number(m3[5]) === onlyB && Number(m3[6]) === onlyB,
    'the planted bound 3 does not fail on the same set in both deciders');
  const CMP = json(c('out/compare.json'));
  const bruteMax = 31, bruteWant = primes.filter((p) => p <= bruteMax).reduce((t, p) => t + p - 1, 0);
  need(CMP.primes_compared === primes.length && CMP.instances_compared === instances, 'the comparison record does not cover every instance');
  need(CMP.disjoint === 0 && CMP.first_disjoint.length === 0, 'the comparison record shows a disjoint enclosure');
  need(CMP.brute_instances === bruteWant && CMP.brute_outside === 0 && CMP.first_outside.length === 0, 'the brute-force control is not inside both deciders on every instance for p ≤ ' + bruteMax);
  need(same(A.at, B.at) && A.at.length === 2, 'the two deciders place the largest ratio at different (p, c)');
  const up4 = (x) => Math.ceil(x * 1e4) / 1e4;
  need(A.max_ratio.toFixed(4) === up4(B.max_ratio_hi).toFixed(4), 'the largest ratio does not print the same from both deciders');
  need(A.max_ratio < 4 && B.max_ratio_hi < 4, 'the largest ratio reaches the bound');
  /* the published deciders differ from the private ones the summaries hash, exactly as PUBLICATION-NOTES.md lists */
  const changed = {};
  for (const m of NOTES.matchAll(/^\| (\S+) \| [^|]* \| ([0-9a-f]{64}) \| ([0-9a-f]{64}) \|$/gm)) changed[m[1]] = { private: m[2], here: m[3] };
  need(Object.keys(changed).length === 4, 'PUBLICATION-NOTES.md does not list four changed files');
  for (const [f, h] of Object.entries(changed)) need(sha(c(f)) === h.here, f + ' is not the published file PUBLICATION-NOTES.md names');
  need(A.decider_a_sha256 === changed['decider_a.py'].private && B.decider_b_sha256 === changed['decider_b.js'].private, 'a summary was not written by the decider PUBLICATION-NOTES.md names');
  const pg186a = (/pg186a_decide\.py is the 186 audit's own\s+decider A, unchanged \(sha256 ([0-9a-f]{64})\)/.exec(NOTES) || die('PUBLICATION-NOTES.md does not pin pg186a_decide.py'))[1];
  need(sha(c('pg186a_decide.py')) === pg186a, 'pg186a_decide.py is not the file PUBLICATION-NOTES.md pins');
  const withheldValues = text(c('out/VALUES-NOT-PUBLISHED.sha256')).trim().split('\n').map((l) => { const m = /^([0-9a-f]{64}) {2}(\S+)$/.exec(l) || die('out/VALUES-NOT-PUBLISHED.sha256 does not read'); return { file: m[2], sha256: m[1] }; });
  need(withheldValues.length === 2, 'two value files are withheld');
  const rm = /303 primes, 276,747 instances[\s\S]*?6,557 s[\s\S]*?167 s[\s\S]*?\(149 instances\)[\s\S]*?496 instances fail in both[\s\S]*?13,696 in both, equal per prime\. Largest \|K4\(c\)\|\/\(p√p\) = ([0-9.]+) at\s+\(p, c\) = \((\d+), (\d+)\)/.exec(RESULT) || die('RESULT no longer states step 2 as the record reads it');
  need(primes.length === 303 && instances === 276747 && Math.round(A.seconds) === 6557 && Math.round(B.seconds) === 167 && bruteWant === 149 && B.fails3 === 496 && B.fails2 === 13696
    && rm[1] === A.max_ratio.toFixed(4) && Number(rm[2]) === A.at[0] && Number(rm[3]) === A.at[1], 'the outputs of step 2 are not what RESULT states');
  const rankFour = {
    premise: 'IncidenceRankFourBound', bound: 4, primesBelow: BOUND, primes: primes.length, largestPrime: primes[primes.length - 1], instances,
    holdInBoth: A.holds, fails: 0, undecided: 0,
    deciderA: { file: c('decider_a.py'), kind: 'exact integers', seconds: A.seconds, raisedPrecision: pa.reduce((t, r) => t + r.raised, 0), ranAsSha256: A.decider_a_sha256, publishedSha256: changed['decider_a.py'].here },
    deciderB: { file: c('decider_b.js'), kind: 'interval arithmetic', seconds: B.seconds, ranAsSha256: B.decider_b_sha256, publishedSha256: changed['decider_b.js'].here },
    agreement: { instancesCompared: CMP.instances_compared, disjoint: CMP.disjoint, bruteForcePrimesUpTo: bruteMax, bruteForceInstances: CMP.brute_instances, bruteForceOutside: CMP.brute_outside },
    planted: [
      { bound: 3, failInA: A.fails3, failInB: B.fails3, equalAtEveryPrime: true, sameSet: true, atFirstPrecisionInA: Number(m3[1]), neededHigherPrecisionInA: onlyB, firstPrime: pb.find((r) => r.fails3 > 0).p },
      { bound: 2, failInA: A.fails2, failInB: B.fails2, equalAtEveryPrime: true, firstPrime: pb.find((r) => r.fails2 > 0).p }
    ],
    largest: { p: A.at[0], c: A.at[1], ratio: A.max_ratio.toFixed(4), deciderAValue: A.max_ratio, deciderBUpperEnd: B.max_ratio_hi },
    withheld: withheldValues,
    /* for the page's drawing only: decider B's upper end of the largest |K4(c)|/(p√p) at each prime, rounded up */
    perPrimeDisplayOnly: pb.map((r) => [r.p, up4(r.max_ratio_hi)])
  };

  /* ---------------------------------------------------------------- step 5: the 182's numerical package, replayed */
  const ACC = json(c('step5/acceptance-read.json')), C5 = json(c('step5/runs/compare182.json'));
  const ar = ACC.read;
  const exit = (n) => text(c('step5/runs/' + n + '.exit')).trim();
  need(ar.status === 'PASS_COMPLETE_EXTERNAL_NUMERICAL_RECOMPUTATION' && ar.target_inequalities === 262 && ar.all_262_recomputed === true
    && ar.historical_production_outputs_read === false && ar.mathematical_payloads_match_reference === true, 'the acceptance, as read, does not say what REPRODUCED needs');
  const stages = Object.values(ACC.stages);
  need(stages.length === ar.production_stages && stages.every((s) => s.status === 'PASS') && ACC.audits.passed === ACC.audits.of && ACC.audits.of === ar.audit_stages, 'a stage or an audit of the package did not pass');
  const rej = Object.values(ACC.rejections);
  need(rej.length === 4 && rej.every((x) => x === true), 'one of the package’s four rejection tests was not rejected');
  need(C5.verdict === 'PASS' && C5.passed === 262 && C5.lean_bounds === 262 && C5.fresh_rows === 262 && C5.failures.length === 0, 'the comparison does not pass on 262 of 262');
  need(C5.equal_to_lean_literal === 262 && C5.equal_to_published_value === 262 && C5.published_rows === 262 && C5.strict_rows === 0, 'a fresh value is not equal to its Lean literal and to the published value');
  need(C5.rows.length === 262 && C5.rows.every((r) => r.ok === true && r.equal === true), 'a row of the comparison is not ok and equal');
  const kinds = { cap: 0, outer: 0, inner: 0 }; for (const r of C5.rows) kinds[r.key[0]]++;
  need(kinds.cap === 5 && kinds.outer === 120 && kinds.inner === 137, 'the comparison does not hold 5 + 120 + 137 rows');
  need(exit('compare') === '0' && exit('red-tighten') === '1' && exit('red-drop') === '1', 'the three exit files are not 0 / 1 / 1');
  for (const n of ['audit', 'negative', 'verify', 'finish']) need(exit(n) === '0', 'the package’s ' + n + ' step did not exit 0');
  const redT = json(c('step5/runs/red-tighten.log')), redD = json(c('step5/runs/red-drop.log'));
  need(redT.verdict === 'FAIL' && redT.failures.length === 1 && /^\('outer', 17, 'rootUpper'\)/.test(redT.failures[0]), 'the tightened literal was not refused at its own row');
  need(redD.verdict === 'FAIL' && redD.fresh_rows === 261 && redD.failures.some((f) => f === 'the record has 261 rows, not 262'), 'the dropped row was not refused on the count');
  const scriptSha = sha(c('step5/compare182.py'));
  const atRun = text(c('step5/runs/compare182.at-run.sha256')).slice(0, 64), before = text(c('step5/runs/compare182.sha256')).slice(0, 64);
  const status = text(c('step5/runs/_status.txt')).split('\n').filter(Boolean);
  const iLogged = status.findIndex((l) => l.includes('compare182.py ' + scriptSha + ' on the pod, before verify.py'));
  const iVerify = status.findIndex((l) => / verify exit 0 \(\d+ s\)/.test(l));
  need(atRun === before && atRun === scriptSha && iLogged >= 0 && iVerify > iLogged, 'the comparison script’s hash at the run is not the hash logged before production');
  const verifySeconds = Number(text(c('step5/runs/verify.seconds')).trim());
  need(status[iVerify].includes('(' + verifySeconds + ' s)'), 'the status line and verify.seconds disagree');
  const archive = /^([0-9a-f]{64}) /.exec(text(c('step5/runs/archive.sha256')))[1];
  const archLine = status.find((l) => l.includes('archive: ' + archive)) || die('the status file does not name the archive');
  const archiveBytes = Number(/ (\d+) bytes$/.exec(archLine)[1]);
  const head182 = text(c('step5/runs/repo.head')).trim();
  need(/^b77bf175[0-9a-f]{32}$/.test(head182) && status.some((l) => l.includes('repo at ' + head182)), 'the 182 repository was not at b77bf175');
  need(/correct: True/.test(text(c('step5/runs/repro-fixed.log'))) && /correct: False/.test(text(c('step5/runs/repro-stock.log'))), 'the witness of the library correction does not behave as stated');
  need(same(C5.lean_blobs, { 'TrialData182.lean': '9caf00df6ae7267602395ab8659a1a566f385443', 'SourceData182.lean': '45d4b55d8a5781a300d07d0a4d198aef68eb651d' }), 'the Lean literals compared are not the pinned blobs');
  need(ACC.coverage_json_sha256 === C5.coverage_sha256 && ACC.coverage_json_sha256 === ACC.published_coverage_json_sha256, 'the fresh coverage record is not byte-identical to the published one');
  const sums = text(c('step5/SHA256SUMS.step5')).trim().split('\n');
  need(sums.includes(ACC.verification_json_sha256 + '  ./evidence/verification.json') && sums.includes(ACC.coverage_json_sha256 + '  ./evidence/coverage.json'), 'the withheld files are not in step5/SHA256SUMS.step5 under the hashes read');
  const fl = /flint: (v[0-9.]+) \+ ([0-9a-f]{8}) applied/.exec(status.join('\n')) || die('the status file does not name the FLINT that was built');
  need(status.some((l) => / flint build exit 0$/.test(l)) && status.some((l) => / python-flint build exit 0$/.test(l)), 'the arithmetic library was not built from source');
  const envFixed = /\n(3\.\d+\.\d+) [^\n]*\nLinux-\S*x86_64\S*\npython-flint (\S+) numpy/.exec(text(c('step5/runs/env-fixed.txt'))) || die('step5/runs/env-fixed.txt does not read as a Linux x86-64 environment');
  need(RESULT.includes('FLINT ' + fl[1] + ' + ' + fl[2] + ' from source') && RESULT.includes('python-flint ' + envFixed[2]) && RESULT.includes('Python ' + envFixed[1]), 'the stack is not the one RESULT states');
  const deviations = (text(c('step5/DEVIATIONS.md')).match(/^\d+\. /gm) || []).length;
  need(deviations === 6, 'step5/DEVIATIONS.md does not list six departures');
  need(/\*\*262 of 262\*\*/.test(RESULT) && /10,339 s of wall time/.test(RESULT) && verifySeconds === 10339 && /14 of 14 stages PASS/.test(RESULT) && /328,936 geometry equalities/.test(RESULT) && ar.source_geometry_equalities === 328936
    && /hashes re-checked at home\)/.test(RESULT) && sums.length === 154 && /step5\/import2, 154 files/.test(RESULT), 'the outputs of step 5 are not what RESULT states');
  const replay182 = {
    premise: 'PhysicalSourceBounds182', inequalities: 262, split: { cap: kinds.cap, outer: kinds.outer, inner: kinds.inner },
    archive: { sha256: archive, bytes: archiveBytes }, repositoryHead: head182,
    stack: { flintRelease: fl[1], flintCorrection: fl[2], builtFromSource: true, pythonFlint: envFixed[2], python: envFixed[1], platform: 'Linux x86-64', departures: deviations },
    acceptance: { status: ar.status, stages: ar.production_stages, stagesPassed: stages.filter((s) => s.status === 'PASS').length, audits: ACC.audits.passed, auditsOf: ACC.audits.of, rejections: rej.length, rejected: rej.filter(Boolean).length,
      targetInequalities: ar.target_inequalities, geometryEqualities: ar.source_geometry_equalities, completedUtc: ar.completed_utc, wallSeconds: verifySeconds, summedStageSeconds: Math.round(ar.recorded_production_seconds) },
    comparison: { script: c('step5/compare182.py'), sha256: scriptSha, loggedBeforeProduction: true, verdict: C5.verdict, passed: C5.passed, of: C5.lean_bounds, equalToLeanLiteral: C5.equal_to_lean_literal, equalToPublishedValue: C5.equal_to_published_value, strictRows: C5.strict_rows, leanBlobs: C5.lean_blobs },
    exits: { compare: Number(exit('compare')), redTighten: Number(exit('red-tighten')), redDrop: Number(exit('red-drop')) },
    redControls: [{ what: 'one Lean literal tightened past its value', outcome: 'FAIL', names: 'outer row 17, rootUpper' }, { what: 'one row dropped', outcome: 'FAIL', names: 'the count, 261 rows' }],
    withheld: [{ file: 'the package’s acceptance receipt (verification.json)', sha256: ACC.verification_json_sha256 }, { file: 'the package’s coverage record (coverage.json)', sha256: ACC.coverage_json_sha256, byteIdenticalToPublished: true }],
    importedFiles: sums.length
  };

  /* ---------------------------------------------------------------- step 3: the 212's seven quoted premises, read twice */
  const RP = json(READINGS + '/PROVENANCE.json');
  for (const f of ['reader-a/summary.json', 'reader-b/summary.json']) need((RP.files.find((x) => x.path === f) || {}).sha256 === sha(READINGS + '/' + f), READINGS + '/' + f + ' is not the file its PROVENANCE.json pins');
  const SA = json(READINGS + '/reader-a/summary.json'), SB = json(READINGS + '/reader-b/summary.json');
  need(SA.lean.commit === SB.pins.lean.commit && SA.lean.sha256 === SB.pins.lean.sha256 && /^6641780b/.test(SA.lean.commit), 'the two readers did not read the same Lean file at 6641780b');
  need(same(SA.counts, { MATCH: 0, MISMATCH: 7, CANNOT_READ: 0 }) && same(SB.counts, { MATCH: 0, MISMATCH: 7, 'CANNOT READ': 0 }), 'a reader’s counts are not 7 MISMATCH');
  const readA = Object.fromEntries(SA.premises.map((p) => [p.name, p.reading])), readB = Object.fromEntries(SB.hypotheses.map((p) => [p.name, p.reading]));

  /* ---------------------------------------------------------------- step 1: the ledger, each status re-derived */
  const LEDGER = jsonl(c('ledger.jsonl'));
  need(LEDGER.length === 16, 'the ledger has ' + LEDGER.length + ' rows, not 16');
  const D = 'DECIDED ON INSTANCES below ' + BOUND;
  const s5 = 'REPRODUCED';
  const want = (r) => {
    if (r.id === '186-1' || r.id === '186-2' || r.id === '182-1' || r.id === '182-2' || r.id === '182-3') return D;
    if (r.id === '186-3' || r.id === '182-4') return s5;
    if (r.id === '182-5' || r.id === '212-Gap212Certificate') return 'NOT DECIDED';
    if (r.proof === '212' && readA[r.lean] && readB[r.lean]) { need(readA[r.lean] === readB[r.lean], 'the two readers disagree on ' + r.lean); return 'READ: ' + readA[r.lean]; }
    die('the ledger holds a row this record does not know: ' + r.id);
  };
  const PINS = { '186': ['openai/PrimeGaps186', '61340d0b', 'Apache-2.0'], '182': ['romyar1/prime-gaps-lean', 'b77bf175', 'no licence: quoted, never copied'], '212': ['AxiomMath/BGP212', '6641780b', 'Apache-2.0'] };
  const pub = (e, row) => {                                          /* an evidence path of the ledger → its public counterpart */
    if (e.path === 'certs/prime-gaps-186.json') { need(sha(e.path) === e.sha256, 'certs/prime-gaps-186.json is not the file the ledger pins'); return { path: e.path, sha256: e.sha256 }; }
    if (e.path === PRIVATE + 'readings/summary.json') { const f = READINGS + '/reader-a/summary.json'; need(sha(f) === e.sha256, f + ' is not the file the ledger pins'); return { path: f, sha256: e.sha256 }; }
    const cb = /^claimbox@([0-9a-f]{8}):readings\/bgp212-2026-11-12\/(\w+\.reading\.md)$/.exec(e.path);
    if (cb) { need(RP.readerA.commit.startsWith(cb[1]), 'the readings folder was not copied from the commit the ledger names'); const f = 'reader-a/' + cb[2]; const pin = RP.files.find((x) => x.path === f) || die(f + ' is not in the readings’ PROVENANCE.json'); need(sha(READINGS + '/' + f) === pin.sha256, READINGS + '/' + f + ' is not the pinned file'); return { path: READINGS + '/' + f, sha256: pin.sha256 }; }
    const s5w = { [PRIVATE + 'step5/import2/evidence/verification.json']: ACC.verification_json_sha256, [PRIVATE + 'step5/import2/evidence/coverage.json']: ACC.coverage_json_sha256 };
    if (e.path in s5w) { need(s5w[e.path] === e.sha256, 'a withheld file’s hash, as read, is not the ledger’s'); return { withheld: true, sha256: e.sha256 }; }
    const map = { [PRIVATE + 'step5/import2/runs/compare182.json']: c('step5/runs/compare182.json') };
    const f = map[e.path] || (e.path.startsWith(PRIVATE + 'out/') ? c(e.path.slice(PRIVATE.length)) : die('row ' + row.id + ': no public counterpart for ' + e.path));
    need(sha(f) === e.sha256, f + ' is not the file the ledger pins');
    return { path: f, sha256: e.sha256 };
  };
  const premises = LEDGER.map((r) => {
    need(same([r.repository, r.commit, r.licence], PINS[r.proof]), 'row ' + r.id + ' is not pinned as its proof is');
    need(r.status === want(r), 'row ' + r.id + ' says ' + r.status + ', and its evidence gives ' + want(r));
    need(r.statement.length <= 300, 'row ' + r.id + ' quotes more than 300 characters');
    need((r.status === 'NOT DECIDED') === (r.evidence.length === 0), 'row ' + r.id + ': evidence and status disagree');
    return { id: r.id, proof: r.proof, file: r.file, lean: r.lean, shape: r.shape, statement: r.statement, status: r.status, evidence: r.evidence.map((e) => pub(e, r)) };
  });
  const byStatus = {}; for (const r of premises) byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  /* RESULT's step-1 line is the count before amendment A1, which moved one row (182-4) from NOT DECIDED to REPRODUCED */
  const r1 = /DECIDED ON INSTANCES below 2000: (\d+) [\s\S]*?REPRODUCED: (\d+) [\s\S]*?READ: MISMATCH: (\d+) [\s\S]*?NOT DECIDED: (\d+)\./.exec(RESULT) || die('RESULT no longer states the ledger’s counts');
  need(byStatus[D] === Number(r1[1]) && byStatus.REPRODUCED === Number(r1[2]) + 1 && byStatus['READ: MISMATCH'] === Number(r1[3]) && byStatus['NOT DECIDED'] === Number(r1[4]) - 1 && /The word, by A1: \*\*REPRODUCED\*\*/.test(RESULT),
    'the ledger’s counts are not RESULT’s, with row 182-4 moved by amendment A1');
  const r4 = LEDGER.find((r) => r.id === '182-4'), r3 = LEDGER.find((r) => r.id === '182-3');
  need(r4.note.includes('262 of 262, all 262 equal to the literal and to the published value') && r3.note.includes(instances + ' instances') && r3.note.includes(rankFour.largest.ratio), 'a ledger note no longer states its row’s numbers');
  const quoted212 = premises.filter((r) => r.proof === '212' && r.shape === 'quoted asymptotic theorem');
  need(quoted212.length === 7 && quoted212.every((r) => r.status === 'READ: MISMATCH') && same(quoted212.map((r) => r.lean).sort(), Object.keys(readA).sort()) && same(Object.keys(readA).sort(), Object.keys(readB).sort()), 'the seven quoted premises of the 212 are not the seven both readers read');
  const allN = LEDGER.filter((r) => r.proof === '212' && /summed over all n|bounds the unrestricted discrepancy/.test(r.note)).length;
  need(allN === 6 && /adds x\^xi <= M/.test(LEDGER.find((r) => r.lean === 'BilinearBombieriVinogradov').note) && /Main clause\s+\(six premises\)/.test(RESULT), 'the main differing clause is no longer in six of the seven readings');

  /* ---------------------------------------------------------------- step 6, the money, the seals */
  const cert = LEDGER.find((r) => r.id === '212-Gap212Certificate');
  need(/no witness is published/.test(cert.note) && /NOT DECIDED, no witness published/.test(RESULT), 'the certificate row no longer says that no witness is published');
  const iss = /FILED on the operator's word:\s+AxiomMath\/BGP212 #(\d+)\./.exec(RESULT) || die('RESULT no longer names the question filed about the certificate');
  const mm = /Two pods: (\d+) min \+ (\d+) h (\d+) min at US\$([0-9.]+)\/h ≈ US\$([0-9.]+) by the clock \(not a billing read\)\. Both deleted, 404\./.exec(RESULT) || die('RESULT no longer states the money');
  const minutes = Number(mm[1]) + 60 * Number(mm[2]) + Number(mm[3]);
  need(Math.abs(minutes / 60 * Number(mm[4]) - Number(mm[5])) < 0.01, 'the money does not add up');
  const sm = /four digests in seals\/registry\.jsonl: the rules ([0-9a-f]{8})…,\s+the results ([0-9a-f]{8})…, amendment A1's rules ([0-9a-f]{8})…, its results ([0-9a-f]{8})…/.exec(NOTES) || die('PUBLICATION-NOTES.md no longer names the four seals');
  need(RESULT.includes('sealed ' + sm[1] + '…') && PREREG.includes('after the results seal ' + sm[2]) && RESULT.includes('sealed ' + sm[3] + '…'), 'RESULT and the pre-registration do not name the seals PUBLICATION-NOTES.md names');
  const registry = jsonl('seals/registry.jsonl');
  const seals = [['the rules', 1], ['the results', 2], ['amendment A1, the rules', 3], ['amendment A1, the results', 4]].map(([what, i]) => {
    const hit = registry.filter((r) => r.digest.startsWith(sm[i]));
    need(hit.length === 1, 'the seal ' + sm[i] + '… is not once in seals/registry.jsonl');
    return { what, digest: hit[0].digest, posted: hit[0].posted };
  });

  /* the 182 repository's own line, quoted from its NOTICE.md at the pinned commit ("Project attribution: **…**"); the file
     is not stored here, so this is the one string the corpus cannot re-derive: its git blob id is given to check it by */
  const NOTICE182 = { quote: 'GPT-6 Astra (OpenAI), prompted by Romyar Sharifi.', file: 'NOTICE.md', blob: '46b1a5936cab532f246f95d2cdb7b83c7a8dd1ce' };
  const R = {
    undecided: 'The proofs are OpenAI’s (the bound 186), those of the 182’s authors (its repository’s NOTICE says: “' + NOTICE182.quote + '”) and Axiom Math’s (the bound 212). This record lists the premises their Lean theorems take as hypotheses and what was checked about each. It proves no premise and does not verify any of the three bounds.',
    dates: { work: workDate, published },
    proofs: [
      { id: '186', bound: 186, by: 'OpenAI', repository: 'https://github.com/' + PINS['186'][0], name: PINS['186'][0], commit: R186.pins.commit, licence: PINS['186'][2], premises: premises.filter((r) => r.proof === '186').length },
      { id: '182', bound: 182, repository: 'https://github.com/' + PINS['182'][0], name: PINS['182'][0], commit: head182, licence: 'none: quoted and linked, never copied', premises: premises.filter((r) => r.proof === '182').length,
        attribution: NOTICE182 },
      { id: '212', bound: 212, by: 'Axiom Math', repository: 'https://github.com/' + PINS['212'][0], name: PINS['212'][0], commit: SA.lean.commit, licence: PINS['212'][2], premises: premises.filter((r) => r.proof === '212').length }
    ],
    ledger: { file: c('ledger.jsonl'), sha256: sha(c('ledger.jsonl')), rows: premises.length, byStatus, premises },
    inherited186: { record: 'certs/prime-gaps-186.json', sha256: sha('certs/prime-gaps-186.json'), primes: F186.axiom1.primes, primesBelow: F186.primesBelow, axiom1Instances: F186.axiom1.instances, axiom2Instances: F186.axiom2.instances,
      axiom1: R186.verdicts.axiom1, axiom2: R186.verdicts.axiom2, certificate: R186.verdicts.certificate, numbers: R186.recomputed.integers, recomputed: R186.verdicts.recomputed,
      vendoredBy182: 'byte-identical file (as the ledger states); that the 182’s names resolve to its definitions is a reading' },
    rankFour,
    replay182,
    readings212: { folder: READINGS, lean: { file: SA.lean.path, commit: SA.lean.commit, sha256: SA.lean.sha256 }, readers: 2, premises: quoted212.length, mismatchA: SA.counts.MISMATCH, mismatchB: SB.counts.MISMATCH,
      sources: ['[1] Polymath, arXiv ' + SA.sources['[1]'].arxiv + SA.sources['[1]'].version, '[2] Stadlmann, arXiv ' + SA.sources['[2]'].arxiv + SA.sources['[2]'].version],
      allNDiscrepancy: allN, addedHypothesis: 1, issue: { repository: 'AxiomMath/BGP212', number: 1, url: 'https://github.com/AxiomMath/BGP212/issues/1' }, word: 'readings, not decisions' },
    certificate212: { status: cert.status, reason: 'no witness is published', issue: { repository: 'AxiomMath/BGP212', number: Number(iss[1]), url: 'https://github.com/AxiomMath/BGP212/issues/' + iss[1] },
      ledgerNote: 'the ledger’s note was written before the question was filed and still says “drafted, not sent”' },
    gaps: null,
    method: { rules: [c('PREREGISTRATION.md')], result: c('RESULT-2026-11-12.md'), notes: c('PUBLICATION-NOTES.md'), registry: 'seals/registry.jsonl' },
    money: { pods: 2, minutes, usdPerHour: Number(mm[4]), usd: Number(mm[5]), word: 'by the clock, not a billing read' },
    seals,
    provenance: { file: c('PROVENANCE.json'), files: PROV.files.length },
    words: { '186': [D, D, s5], rankFour: r3.status, replay182: r4.status, readings212: 'READ: MISMATCH', fourier182: LEDGER.find((r) => r.id === '182-5').status, certificate212: cert.status, premisesProved: 0 }
  };
  const N = (x) => Number(x).toLocaleString('en-US');
  R.gaps = [
    { id: 'conditional', b: 'Nothing here proves a premise, and nothing here verifies 186, 182 or 212.', text: 'Each proof says: if its premises hold, then its bound. This page is about the premises, not about the proofs.' },
    { id: 'instances', b: 'Instances are not a proof.', text: 'The rank-four bound was decided at every prime below ' + N(BOUND) + ' and at none above. A finite check can refute a premise that was written down wrongly; it cannot prove one. For all primes the bound is Deligne’s theorem, not this run’s.' },
    { id: 'replay', b: 'The 182’s ' + replay182.inequalities + ' numbers were reproduced, not decided.', text: 'They came out of the authors’ own programs, run again by me. A replay of a claimant’s programs is never an independent decision. And the step from each computed bound to the integral it stands for is argued in the package’s comments: it is in no program and not in Lean.' },
    { id: 'pairing', b: 'Which number belongs to which Lean row is the package’s own assignment.', text: 'My comparison re-derives that key from the Lean row and requires it to be equal, which checks the pairing against Lean’s own fields and no further.' },
    { id: 'readings', b: 'The readings of the 212 are readings.', text: 'Two AI readers compared each quoted premise with the paper it cites. A reading is not a decision, and neither reader is a human referee.' },
    { id: 'fourier', b: 'Not decided: the 182’s local Fourier hypothesis.', text: 'Its constants are free, so no finite test can refute it: a larger threshold or a larger constant escapes any instance.' },
    { id: 'certificate', b: 'Not decided: the 212’s certificate.', text: 'It asserts that a certain function exists, and no such function is published. The question is open with the authors as issue #' + R.certificate212.issue.number + ' of their repository.' },
    { id: 'inherited', b: 'Two of the 182’s premises are the 186’s, taken over.', text: 'The 182 carries a copy of the 186’s Lean file that is byte-identical, so its two shared premises inherit the checks of the 186. That its names resolve to those definitions is my reading of the file; I did not ask Lean.' },
    { id: 'platform', b: 'The replay ran on my own build of FLINT, on Linux.', text: 'The package is tested by its authors on macOS with its bundled libraries. No byte of the package was changed; ' + ['zero', 'one', 'two', 'three', 'four', 'five', 'six'][deviations] + ' things in the environment around it were, and each is listed in the records.' },
    { id: 'cleanroom', b: 'A recomputation of the ' + replay182.inequalities + ' numbers by programs of mine has not been started.', text: 'That is what would turn “reproduced” into something stronger for that row.' }
  ];
  return R;
}

const diskRead = (rel) => { try { return fs.readFileSync(path.join(ROOT, rel)); } catch (e) { return null; } };
const out = path.join(ROOT, 'certs', 'prime-gap-premises.json');
module.exports = { build, diskRead };
if (require.main === module) {
  const R = build(diskRead);
  const text = JSON.stringify(R, null, 1) + '\n';
  if (process.argv.includes('--check')) {
    if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) die('certs/prime-gap-premises.json differs from what corpus/prime-gap-premises gives');
    console.log('certs/prime-gap-premises.json re-derived: identical');
  } else {
    fs.writeFileSync(out, text);
    console.log('certs/prime-gap-premises.json written · ' + R.ledger.rows + ' premises · ' + Object.entries(R.ledger.byStatus).map(([k, v]) => k + ' ' + v).join(' · ') + ' · proved here 0 · US$' + R.money.usd.toFixed(2));
  }
}
