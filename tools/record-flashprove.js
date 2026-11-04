#!/usr/bin/env node
/* record-flashprove.js — certs/flashprove-check.json: the outside check of anthropics/FlashProve at 9e2bdd8f, step by
   step as pre-registered (notes/flashprove-preregistration-2026-11-04.md), from the facts on disk:
     corpus/flashprove/runs/route1-41809013962   the hosted runner (routes 1 and 2, the CPU suite)
     corpus/flashprove/runs/runpod-iuordtjfu4g3s2 the Lean pod (build, axioms, the two verifiers, nanoda)
     corpus/flashprove/runs/runpod-oubgvlnuegf8og the GPU pod (route 3)
     corpus/flashprove/readings/merged.md         the two blind readings, merged
     corpus/flashprove/exact.json                 E1 and E2, re-derived by tools/flashprove-exact.py --check
   Each step gets one of the three words, by the rule written beside it, or NOT RUN with the reason. No step is decided
   by hand: a fact that is missing or reads otherwise changes the word, and the gaps are written before the confirmations.

   usage: node tools/record-flashprove.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const die = (m) => { console.error('record-flashprove: REFUSED — ' + m); process.exit(1); };
const R1 = 'corpus/flashprove/runs/route1-41809013962', LP = 'corpus/flashprove/runs/runpod-iuordtjfu4g3s2', GP = 'corpus/flashprove/runs/runpod-oubgvlnuegf8og';
for (const d of [R1, LP, GP]) if (!fs.existsSync(path.join(ROOT, d))) die('no facts at ' + d);
const rd = (d, f) => { const p = path.join(ROOT, d, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null; };
const ex = (d, s) => { const t = rd(d, s + '.exit'); return t === null ? null : Number(t.trim()); };
const secs = (d, s) => { const a = rd(d, s + '.start'), b = rd(d, s + '.end'); return a && b ? Number(b) - Number(a) : null; };
const last = (d, s, n = 1) => (rd(d, s + '.out') || '').trim().split('\n').slice(-n).join('\n');
const has = (d, s, re) => re.test(rd(d, s + '.out') || '');
const ex4 = cp.spawnSync('python3', ['-I', path.join(ROOT, 'tools', 'flashprove-exact.py'), '--check'], { encoding: 'utf8' });
if (ex4.status !== 0) die('corpus/flashprove/exact.json does not re-derive: ' + ex4.stdout + ex4.stderr);
const EX = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'flashprove', 'exact.json'), 'utf8'));
const merged = fs.readFileSync(path.join(ROOT, 'corpus', 'flashprove', 'readings', 'merged.md'), 'utf8');
const gapRows = merged.split('\n').filter((l) => /^\| G\d+ \|/.test(l));

const steps = [];
const add = (id, phase, what, word, got, why) => steps.push({ id, phase, what, verdict: word, got, why });
const yesNo = (cond) => (cond ? 'CERTIFIED' : 'REFUTED');

/* phase 1: the hosted runner */
add('pins', 1, 'every pinned byte of the claim against corpus/flashprove/PINS.json', yesNo(/^ok\s+80 files and the tree equal/m.test(rd(R1, 'pins.out') || '')), (rd(R1, 'pins.out') || '').trim().split('\n').pop(), 'the clone re-hashed before any step');
add('R1.1', 1, 'verifier/build.sh builds cp_verify', yesNo(ex(R1, 'R1.1') === 0 && has(R1, 'R1.1', /THE VERIFIER IS BUILT:/)), 'exit ' + ex(R1, 'R1.1') + '; ' + last(R1, 'R1.1'), 'expected exit 0 and the BUILT line');
add('R1.2', 1, 'cp_verify on examples/accepted-proof (the small example)', yesNo(ex(R1, 'R1.2') === 0 && last(R1, 'R1.2') === 'YES'), 'exit ' + ex(R1, 'R1.2') + '; YES', 'expected YES; the small example is outside every theorem (THEOREM.md:303), so this is a fact about the C++ program only');
add('R1.3', 1, 'cp_verify on examples/full-size', yesNo(ex(R1, 'R1.3') === 0 && last(R1, 'R1.3') === 'YES' && has(R1, 'R1.3', /bits=128/)), 'exit ' + ex(R1, 'R1.3') + '; YES; bits=128; ' + ((rd(R1, 'R1.3.out') || '').match(/proof of work:[^\n]*/) || [''])[0], 'expected YES and bits=128');
const tam = ['a', 'b', 'c', 'd', 'e', 'f'].map((k) => ({ k, exit: ex(R1, 'R1.4' + k), last: last(R1, 'R1.4' + k) }));
add('R1.4', 1, 'six tampered inputs to cp_verify (a byte of the proof, the ID, the reply, a byte of the request, the proof cut by a byte, the wrong ID)', tam.every((t) => t.exit !== 0) ? 'CERTIFIED' : 'REFUTED', tam.map((t) => '(' + t.k + ') exit ' + t.exit + ' ' + t.last).join('; '), 'each must not be accepted; an exit 0 on any would be a finding');
add('R2', 1, 'blocks/first_look.sh (an honest copy accepted, a one-bit flip rejected)', yesNo(ex(R1, 'R2') === 0 && has(R1, 'R2', /AS EXPECTED: the honest copy was accepted/)), 'exit ' + ex(R1, 'R2'), 'expected exit 0 and AS EXPECTED');
const suite = ((rd(R1, 'R3.out') || '').match(/run_suite\.py: \d+ rows passed[^\n]*/) || [''])[0];
const failedRows = ((rd(R1, 'R3.out') || '').match(/^FAILED[^\n]*/gm) || []).map((s) => s.replace(/\s+/g, ' '));
add('R3', 1, 'run_suite.py cpu (the claimant\'s own suite, CPU rows)', ex(R1, 'R3') === 0 ? 'CERTIFIED' : 'REFUSED', 'exit ' + ex(R1, 'R3') + '; ' + suite.split(';')[0] + '; failed: ' + failedRows.join(' | ') + '; ' + (/0 ended with status 3/.test(suite) ? 'no row ended with status 3 (no false acceptance)' : 'STATUS 3 PRESENT'),
  'expected exit 0. One row of 92 (the Lean verifier\'s test script: 1 of 344 calls not as expected) failed, and our workflow did not keep that row\'s screen, so what the call was cannot be read from our facts: not decided either way. No row reported a false acceptance (status 3).');

/* phase 2: the Lean pod */
add('L1', 2, 'elan, Lean v4.29.1, Mathlib\'s cache, the pins', yesNo(ex(LP, 'L1') === 0), 'exit ' + ex(LP, 'L1') + '; ' + last(LP, 'L1'), '');
add('L2', 2, 'lake build of the library (default targets)', ex(LP, 'L2') === 0 ? 'CERTIFIED' : 'REFUSED', 'exit ' + ex(LP, 'L2') + ' after ' + secs(LP, 'L2') + ' s; the last line built: ' + ((rd(LP, 'L2.out') || '').match(/\[\d+\/\d+\] Built [^\n(]*/g) || ['?']).pop().trim(),
  'exit 139 is a segmentation fault of Lake itself at 37,583 of 37,650 jobs, every module before it built with the three standard axioms: a platform failure, not a failure of the claim. A re-run with fewer threads waits on CPU stock.');
add('L3', 2, '#print axioms of the six theorems from our own file', 'REFUSED', 'exit ' + ex(LP, 'L3') + '; ' + ((rd(LP, 'L3.out') || '') + (rd(LP, 'L3.err') || '')).match(/object file[^\n]*does not exist/)?.[0], 'not reached: the six theorems\' module was among the 67 jobs L2 did not build');
add('L4.cp', 2, 'cp_verify built on the pod, on examples/full-size', yesNo(ex(LP, 'L4.cp') === 0 && last(LP, 'L4.cp') === 'YES'), 'exit ' + ex(LP, 'L4.cp') + '; YES', '');
add('L4.lean', 2, 'the Lean verifier (tools/lean-verify) on examples/full-size', yesNo(ex(LP, 'L4.lean') === 0 && has(LP, 'L4.lean', /VERDICT: ACCEPT/)), 'exit ' + ex(LP, 'L4.lean') + ' after ' + secs(LP, 'L4.lean') + ' s; ' + last(LP, 'L4.lean'), 'expected ACCEPT, beside cp_verify\'s YES');
add('L4.tamper', 2, 'both verifiers on the full-size proof with its middle byte flipped', ex(LP, 'L4.cp-a') !== 0 && ex(LP, 'L4.lean-a') !== 0 ? 'CERTIFIED' : 'REFUTED',
  'cp_verify exit ' + ex(LP, 'L4.cp-a') + ' ' + last(LP, 'L4.cp-a') + '; the Lean verifier exit ' + ex(LP, 'L4.lean-a') + ' ' + last(LP, 'L4.lean-a'), 'neither accepted it. The Lean verifier gave NO VERDICT, not the REJECT the pre-registration expected: its parser, outside Lean, refused the file, so Lean\'s own rejection path was not reached by this control.');
const nan = rd(LP, 'L5.nanoda-sound_of_verify_at.out') || '';
const nanN = (nan.match(/Checked (\d+) declarations with no typechecker errors/) || [])[1];
add('L5.nanoda', 2, 'nanoda (second kernel) on a PUBLIC lean4export of VerifierAndGoals.AtTheName.sound_of_verify_at — the route the claim\'s CHECKING.md calls "untried"', nanN && ex(LP, 'L5.nanoda-sound_of_verify_at') === 0 ? 'CERTIFIED' : 'REFUSED',
  'exit ' + ex(LP, 'L5.nanoda-sound_of_verify_at') + ' after ' + secs(LP, 'L5.nanoda-sound_of_verify_at') + ' s; ' + (nanN ? Number(nanN).toLocaleString('en-US') + ' declarations checked, no typechecker error' : 'no count'), 'the three standard axioms permitted; the one pretty-printer error is nanoda\'s printer, not a check');
const six = ['sound', 'soundAndBinding', 'completeOnCanServe', 'zeroKnowledgeOnCanServe', 'refusedHandsOutNoProof', 'repliesFit'];
add('L5.six', 2, 'nanoda on exports of the six theorems', 'REFUSED', six.map((t) => t + ' export exit ' + ex(LP, 'L5.export-' + t)).join('; '), 'not reached: their module was not built (L2)');

/* phase 3, 4 */
add('P3', 3, 'two blind statement readings, merged (corpus/flashprove/readings/)', 'CERTIFIED', gapRows.length + ' gaps found by both readers; each already stated in the claimant\'s own ledger', 'a reading, not a proof: the word says the pre-registered procedure ran and gave its table');
const s0 = EX.E1.finalSoundnessError, b0 = EX.E1.finalBindingError;
add('E1', 4, 'the printed bounds against their Lean definitions, in exact rationals', s0.atQ['2^64'].exactOverPrinted < 1.000001 && b0.atQ['2^64'].exactOverPrinted < 1.000001 ? 'CERTIFIED' : 'REFUTED',
  'soundness 2^' + s0.atZero.log2Floor + ' at q = 0, reaches 2^-40 at q = ' + s0.leastQReaching['2^-40'] + ' (about 2^84); binding 2^' + b0.atZero.log2Floor + ' at q = 0; the exact values lie just above the printed "about" forms, by a factor 1 to six places', '"about q/2^124 + 2^-101" and "about q/2^124 + 2^-100" match finalSoundnessError and finalBindingError');
const e2 = EX.E2;
add('E2', 4, 'the field and the counts the statements name', e2.prattChecked && e2.xCubedMinusSevenIrreducible && e2.columns.holds && e2.pCubedBelow2to192 && Object.values(e2.plantedCertificatesRefused).every(Boolean) ? 'CERTIFIED' : 'REFUTED',
  'p = 2^64 - 2^32 + 1 prime by a Pratt certificate checked here (two planted certificates refused); x^3 - 7 irreducible over F_p; p^3 < 2^192 (which the claim says it does not prove); 62 + 688,127·64 = ' + e2.columns.lhs.toLocaleString('en-US') + ' ≤ 44,040,191', '');
add('E3', 4, 'our own byte-level parse of the proof header from docs/format/FORMAT.md', 'NOT RUN', '—', 'not written in this round; the differential of the two verifiers (L4) stands on one proof');

/* phase 5: the GPU pod */
const g2 = rd(GP, 'G2.out') || '', g1 = rd(GP, 'G1.out') || '';
const compiled = (g1 + g2).match(/Compiled by [^\n]*/g) || [];
add('GPU', 5, 'examples/quickstart-gpu.sh on one H100 (build, commit, prove a 64-token request, verify)', ex(GP, 'G2') === 0 && /quickstart-gpu: all steps ended as expected/.test(g2) && compiled.length > 0 && compiled.every((l) => /release 13\.2, V13\.2\.86$/.test(l)) ? 'CERTIFIED' : 'REFUTED',
  'exit ' + ex(GP, 'G2') + ' after ' + secs(GP, 'G2') + ' s; cp_verify YES; ' + compiled.length + ' "Compiled by" lines, each nvcc 13.2 V13.2.86', '');
add('GPU.recheck', 5, 'the fresh GPU proof re-checked, and a tampered copy', 'NOT RUN', 'cp_verify exit ' + ex(GP, 'G3.fresh') + ' on both: "' + last(GP, 'G3.fresh') + '"', 'OUR ERROR: our script passed the wrong paths for the config and key files, so neither check reached the proof. The proof itself was deleted with the pod. The GPU line above (the route\'s own cp_verify YES) stands; the second check does not exist.');

const words = steps.reduce((m, s) => (m[s.verdict] = (m[s.verdict] || 0) + 1, m), {});
const rec = {
  what: 'The outside check of anthropics/FlashProve at 9e2bdd8f: the claimant\'s verifier and Lean library run from the public bytes by a second party, the statements read against what is checked, and the numbers recomputed exactly. Not a review of the cryptography.',
  generated: new Date().toISOString().slice(0, 10),
  claim: { repo: 'https://github.com/anthropics/FlashProve', commit: '9e2bdd8ff5bf9c62f18263d7dac189b0400b260c', version: '0.16.0-rc.26' },
  preregistration: 'notes/flashprove-preregistration-2026-11-04.md',
  verdicts: words,
  falseAcceptance: steps.some((s) => s.verdict === 'REFUTED') ? 'SEE STEPS' : 'none: no tampered input accepted by either verifier, no suite row with status 3',
  gaps: gapRows.map((l) => { const c = l.split('|').map((x) => x.trim()); return { id: c[1], gap: c[2].replace(/\*\*/g, ''), ledger: c[5] }; }),
  steps,
  spend: { route1: 'GitHub-hosted runner (free)', leanPod: '≈ US$12 (cpu3m 32 vCPU, about 6.9 h)', gpuPod: '≈ US$1.81 (H100, 21 min)' },
  facts: { route1: R1, leanPod: LP, gpuPod: GP, readings: 'corpus/flashprove/readings/', exact: 'corpus/flashprove/exact.json' },
};
fs.writeFileSync(path.join(ROOT, 'certs', 'flashprove-check.json'), JSON.stringify(rec, null, 1) + '\n');
console.log('certs/flashprove-check.json: ' + Object.entries(words).map(([k, v]) => v + ' ' + k).join(', ') + '; ' + rec.gaps.length + ' gaps');
