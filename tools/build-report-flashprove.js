#!/usr/bin/env node
/* build-report-flashprove.js — reports/flashprove.html: the outside check of anthropics/FlashProve at 9e2bdd8f, read
   from certs/flashprove-check.json (tools/record-flashprove.js) alone. Gaps first (the house rule), then every step
   with its word and what came back, then the limits. A step whose word is not one of the record's, or a record whose
   verdict counts do not add up to its steps, refuses the page.

   usage: node tools/build-report-flashprove.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('FLASHPROVE REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const REC = 'certs/flashprove-check.json';
const R = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const GH = 'https://github.com/carlostoledo1891/cert-machine/blob/main/';
const esc = C.esc;
const WORDS = ['CERTIFIED', 'REFUTED', 'REFUSED', 'NOT RUN'];
for (const s of R.steps) if (!WORDS.includes(s.verdict)) die('step ' + s.id + ' has the word ' + s.verdict);
const count = (w) => R.steps.filter((s) => s.verdict === w).length;
for (const [w, n] of Object.entries(R.verdicts)) if (count(w) !== n) die('the record counts ' + n + ' ' + w + ', its steps ' + count(w));
if (count('REFUTED') && !/SEE STEPS/.test(R.falseAcceptance)) die('a REFUTED step with no false-acceptance line');
const code = (t) => esc(t).replace(/`([^`]+)`/g, '<span class="m">$1</span>');
const tag = (v) => C.tag(v, v === 'CERTIFIED' ? 'held' : v === 'REFUTED' ? 'fail' : 'open');
const recLink = (rel) => '<a href="' + C.escAttr(GH + rel) + '"><span class="m">' + esc(rel) + '</span></a>';
const PH = { 1: 'Routes 1 and 2 on a hosted runner', 2: 'The Lean library on a CPU pod', 3: 'The statement reading', 4: 'Exact checks of our own', 5: 'Route 3 on one GPU' };
const notDone = R.steps.filter((s) => s.verdict !== 'CERTIFIED');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · an outside check, November 2026',
  title: 'FlashProve, checked from the public bytes',
  deck: 'FlashProve (Anthropic, released 30 October 2026 as a research artefact) lets a model provider prove that a reply came from the model it committed to, with a soundness theorem in Lean 4. '
    + 'Here a second party ran its verifier, its Lean library and its GPU route from the public repository at 9e2bdd8f, read its statements against what its theorems cover, and recomputed its numbers exactly. '
    + 'No tampered proof was accepted. The gaps below are already in FlashProve\'s own ledger; they sit between the README\'s sentences and that ledger.'
}));
B.push(C.stats([
  { k: 'steps certified', v: String(count('CERTIFIED')), n: 'of ' + R.steps.length + ' pre-registered' },
  { k: 'refused or not run', v: String(count('REFUSED') + count('NOT RUN')), n: 'resources, a platform crash, and one error of ours' },
  { k: 'tampered inputs accepted', v: '0', n: R.falseAcceptance },
  { k: 'gaps both readers found', v: String(R.gaps.length), n: 'each already stated in the claimant\'s ledger' },
]));

/* §1 the gaps */
B.push(C.section({
  lab: '§1 · the gaps', title: 'What the headline sentences leave out', id: 'gaps', wide: true,
  bodyRaw: C.pRaw('Two readers read the README, the theorem file, the limits and gaps ledgers and the paper, each without seeing the other\'s table. A gap counts only if both found it. Every one is dated at the pin, 9e2bdd8f, and every one is already stated somewhere in FlashProve\'s own ledger; the column on the right says where.')
    + C.table({ cols: [{ h: '' }, { h: 'gap' }, { h: 'where the claimant states it' }],
      rows: R.gaps.map((g) => [g.id, { raw: code(g.gap) }, g.ledger]) })
    + C.pRaw('One point a single reader raised was confirmed against the text: the small example that route 1 verifies is outside every theorem (THEOREM.md: "The small example\'s files are out of scope: <span class="m">verify</span> rejects them"). A YES on it is a fact about the C++ program, not an instance of the soundness theorem. The merged reading is ' + recLink('corpus/flashprove/readings/merged.md') + '.')
}));

/* §2 what did not run, and why */
B.push(C.section({
  lab: '§2 · not decided', title: 'What this check did not settle', id: 'open',
  bodyRaw: C.plainList(notDone.map((s) => ({ b: s.what + '.', raw: tag(s.verdict) + ' ' + esc(s.why) + ' <span class="small">(step <span class="m">' + esc(s.id) + '</span>, §3.' + s.phase + ')</span>' })))
}));

/* §3 every step */
for (const ph of [1, 2, 3, 4, 5]) {
  const rs = R.steps.filter((s) => s.phase === ph);
  B.push(C.section({
    lab: '§3.' + ph + ' · phase ' + ph, title: PH[ph], id: 'phase-' + ph, wide: true,
    bodyRaw: C.table({ cols: [{ h: 'step' }, { h: 'what' }, { h: 'word' }, { h: 'what came back' }],
      rows: rs.map((s) => [{ raw: '<span class="m">' + esc(s.id) + '</span>' }, s.what, { raw: tag(s.verdict) }, { raw: esc(s.got) + (s.why ? '<br><span class="small">' + esc(s.why) + '</span>' : '') }]) })
  }));
}

/* §4 limits */
B.push(C.section({
  lab: '§4 · limits', title: 'What this check is, and is not', id: 'limits',
  bodyRaw: C.plainList([
    { b: 'Not a review of the cryptography.', text: 'The theorems were checked to compile and, where the build finished, to rest on the standard axioms; their mathematics is the kernels\', not ours. Nothing here is a security assessment.' },
    { b: 'Route 4 untouched.', text: 'The 400B prover on real model weights was out of scope; no claim about it is decided here.' },
    { b: 'Pre-registered.', text: 'Every step and its expected result were written and pushed before any run (' + R.preregistration + '). No step was re-run to change its outcome.' },
    { b: 'Spend.', text: 'Route 1: ' + R.spend.route1 + '. Lean pod: ' + R.spend.leanPod + '. GPU pod: ' + R.spend.gpuPod + '.' },
    { b: 'Our own error, recorded.', text: 'The second check of the fresh GPU proof did not run because our script passed wrong file paths; the proof was deleted with the pod. It is listed as NOT RUN, not as anything the claim did.' },
  ])
    + C.pRaw('The record is ' + recLink(REC) + '; the facts behind it are under ' + recLink('corpus/flashprove/runs/') + '.')
}));

const foot = '<p>' + esc('Generated by tools/build-report-flashprove.js from ' + REC + ' (' + R.steps.length + ' steps; claim anthropics/FlashProve @ ' + R.claim.commit.slice(0, 8) + ') @ git ' + git + '. Built with Claude (Anthropic).') + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'flashprove.html'), TPL.render({
  title: 'FlashProve, checked from the public bytes · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'An outside, pre-registered check of anthropics/FlashProve at 9e2bdd8f: its verifier, Lean library and GPU route run from the public bytes, its statements read against its theorems by two blind readers, its numbers recomputed exactly; gaps first.',
  path: '/reports/flashprove.html'
}));
console.log('reports/flashprove.html written: ' + R.steps.length + ' steps (' + Object.entries(R.verdicts).map(([k, v]) => v + ' ' + k).join(', ') + '), ' + R.gaps.length + ' gaps @ git ' + git);
