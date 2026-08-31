#!/usr/bin/env node
/* build-report-add55.js — reports/matmul-additions.html.

   Rank is not the cost of a matrix-multiplication algorithm. A rank-23
   scheme for 3x3 still has to FORM its 23 left factors from the 9 entries of
   A, form 23 right factors from B, and combine 23 products into the 9
   entries of C. Those three linear maps are where the additions live, and
   the additive record has moved five times in eight months: 62, 61, 60, 59,
   58, 56, and — in July 2026 — 55.

   This page is the independent check of that 55. It re-derives every number
   from the authors' own published certificate, with an instrument written
   here that could contradict it, and never runs a line of their code.

   Gates, all of which refuse the build:
     - instruments/slp/battery.js re-runs and must pass, red controls included
     - the audited bytes must match the sha256 pinned in corpus/sources
     - the audit must come back VERIFIED; a REFUTED node is a finding, and a
       finding is something to write up, not to ship a page around

   usage: node tools/build-report-add55.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const S = require(path.join(ROOT, 'instruments', 'slp', 'slp.js'));
const T = require(path.join(ROOT, 'instruments', 'strassen', 'tensor.js'));
const die = (m) => { console.error('ADD55 REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the battery ------------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'instruments', 'slp', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /slp battery: (\d+) pass, (\d+) fail/.exec(bout);
if (bat.status !== 0 || !bm || Number(bm[2]) !== 0) die('the slp battery did not pass:\n' + bout.slice(-800));
const nChecks = Number(bm[1]);
const nReds = (bout.match(/PASS  RED:/g) || []).length;

/* ---- gate 2: the audited bytes are the pinned bytes ---------------------- */
const SRC = path.join(ROOT, 'corpus', 'sources', 'add55-certificate.json');
const raw = fs.readFileSync(SRC);
const sha = crypto.createHash('sha256').update(raw).digest('hex');
const PINS = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'PINS.json'), 'utf8'));
if (PINS['add55-certificate.json'] !== sha) die('the certificate does not match its pin');

/* ---- gate 3: the audit itself -------------------------------------------- */
const cert = JSON.parse(raw.toString('utf8'));
const a = S.audit(cert, T);
if (a.verdict !== 'VERIFIED') die('the audit came back ' + a.verdict + ': ' + a.why + ' — that is a FINDING. Write it up.');

const byJob = Object.fromEntries(a.parts.map(p => [p.job, p]));
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · an independent audit of someone else\'s certificate',
  title: 'Rank is not the cost: checking 55 additions for 3×3',
  deck: 'Everyone quotes Laderman\'s 23 multiplications. Almost nobody quotes the additions, and that is where '
    + 'the record has actually been moving — 62, 61, 60, 59, 58, 56, and in July 2026, 55. That last preprint is '
    + 'a month old and its certificate sits on a repository with zero stars. This page re-derives every number in '
    + 'it here, with an instrument built to be able to contradict it.'
}));

B.push(C.tldr({
  findingRaw: 'The 55-addition claim <strong>holds under independent verification</strong>. All three circuits '
    + 'compute exactly the factor matrices they are supposed to; the gates count to <strong>' + a.counted
    + '</strong> here, which is what the certificate declares; and the factor matrices satisfy all <strong>'
    + a.brent.equations + ' Brent equations</strong> exactly over Q, so they genuinely multiply 3×3 matrices at '
    + 'rank ' + a.rank + '. Total cost <strong>' + a.scalarOps + ' scalar operations</strong> — ' + a.counted
    + ' additions and ' + a.rank + ' multiplications. The same three maps computed with no sharing at all would '
    + 'cost <strong>' + a.naive + '</strong> additions, a number we compute rather than quote.',
  mechanismRaw: 'A rank claim and an addition claim fail differently, and an instrument that checks one does not '
    + 'check the other. A circuit can be short and compute the wrong map; a circuit can compute the right map and '
    + 'have been miscounted. So both halves are decided: the straight-line program is evaluated symbolically over '
    + 'the exact integers and compared row by row with the factor matrix it claims to realize, and the tensor '
    + 'identity is handed to <span class="m">instruments/strassen</span>, which has been deciding Brent equations '
    + 'in this repository since long before this claim existed. No declared field is trusted — every gate count '
    + 'and the headline total are re-derived from the gate lists themselves.',
  checkRaw: C.m('node instruments/slp/battery.js') + ' — ' + nChecks + ' checks including ' + nReds
    + ' red controls that must all fire: a flipped gate sign, a deleted gate, a forged per-circuit count, a '
    + 'forged total, a gate reading a slot that does not exist, a gate written out of order, a perturbed factor '
    + 'coefficient, and a coefficient of 2. The audited bytes are pinned at sha256 ' + C.m(sha.slice(0, 16) + '…') + '.'
}));

B.push(C.stats([
  { k: 'the claim', v: a.counted + ' additions', role: 'held', n: 'Karunaratne & Idamekorala, arXiv:2607.28676, 28 July 2026 — re-derived here from their certificate, not transcribed' },
  { k: 'Brent equations', v: a.brent.equations + ' / ' + a.brent.equations, role: 'held', n: 'exact over Q, layout ' + a.brent.layout + '; the factors really do multiply 3×3 matrices at rank ' + a.rank },
  { k: 'scalar operations', v: String(a.scalarOps), role: 'held', n: a.counted + ' additions + ' + a.rank + ' multiplications' },
  { k: 'cost with no sharing', v: String(a.naive), role: 'held', n: 'what the same three linear maps cost gate-for-gate without common subexpressions — computed here, and it is the 122 their source file is named for' },
  { k: 'red controls fired', v: String(nReds) + ' / ' + String(nReds), role: 'held', n: 'every forgery this instrument is meant to catch was planted and caught' },
  { k: 'refuted', v: '0', role: 'held', n: 'nothing in the certificate failed. That is the result, and it is a null one' },
]));

B.push(C.section({
  lab: '§1 · the two halves', title: 'What a "55 additions" claim actually asserts',
  bodyRaw: C.table({
    cols: [{ h: 'the job' }, { h: 'what it computes' }, { h: 'gates declared', cls: 'n' }, { h: 'gates counted here', cls: 'n' }, { h: 'no sharing would cost', cls: 'n' }, { h: 'realizes its factor matrix' }],
    rows: a.parts.map(p => [
      { raw: C.m(p.job) }, p.role, String(p.declared), String(p.actual), String(p.naive),
      { raw: p.realizes ? C.tag('cert', 'exactly') : C.tag('open', 'NO') }
    ]).concat([[
      { raw: '<strong>total</strong>' }, 'the whole linear cost of the scheme',
      { raw: '<strong>' + a.declared + '</strong>' }, { raw: '<strong>' + a.counted + '</strong>' },
      { raw: '<strong>' + a.naive + '</strong>' }, { raw: C.tag('cert', 'AGREE') }
    ]])
  }) + '<div class="col">' + C.pRaw('The rank-23 half of this claim was already settled mathematics — Laderman '
    + 'published a rank-23 scheme in 1976 and this one inherits its rank. What is new is the linear circuit '
    + 'around it, and that is a claim about <em>gates</em>, which no tensor checker can see. Both halves are '
    + 'decided above, separately, because they fail separately.')
  + C.pRaw('The last column is the load-bearing one. A gate count means nothing unless the gates compute the '
    + 'right thing: evaluating each program symbolically gives, for every output, the exact integer combination '
    + 'of inputs it forms, and every one of those matched the factor matrix entry for entry.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the record', title: 'Where the additions have actually been moving',
  bodyRaw: C.table({
    cols: [{ h: 'additions' }, { h: 'who' }, { h: 'note' }],
    rows: [
      ['98', 'Laderman 1976', 'the original rank-23 scheme; nobody optimized its circuit at the time'],
      ['62', 'Mårtensson & Wagner', ''],
      ['61', 'Schwartz & Vaknin', 'using a change of basis'],
      ['60', 'Stapleton, arXiv:2508.03857', 'without a change of basis'],
      ['59', 'arXiv:2601.05272', ''],
      ['58', 'arXiv:2512.21980', 'the Perminov ternary tensor this construction starts from'],
      ['56', 'Sun, arXiv:2604.27645, Apr 2026', ''],
      ['55', 'Karunaratne & Idamekorala, arXiv:2607.28676, Jul 2026', 'audited on this page'],
    ]
  }) + '<div class="col">' + C.pRaw('Seven improvements in under a year, several of them a single addition '
    + 'apart. That cadence is exactly why an independent check is worth doing while the claim is fresh: a record '
    + 'that moves this fast is one where a miscount would propagate into everything built on top of it before '
    + 'anyone looked.')
  + C.pRaw('One thing the authors are careful about and this page repeats: their optimality result is <em>local</em>. '
    + 'They prove their 14-gate circuit optimal for one fixed orientation of one fixed tensor — not that 55 is the '
    + 'minimum over all rank-23 schemes. The global question is open, and this audit says nothing about it.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No new mathematics. We found no error, no miscount and no counterexample — the certificate '
    + 'held everywhere we attacked it, and a page that could only ever have agreed would not have been worth '
    + 'writing, which is why the ' + nReds + ' red controls are listed above and all of them fire. Three limits, '
    + 'stated rather than buried. We verified the certificate the authors published, not the search that produced '
    + 'it, and not their claim of local optimality — proving that no 13-gate circuit exists for that map is a '
    + 'different computation and this instrument does not do it. We take Laderman\'s rank 23 and the source '
    + 'tensor as given. And 55 is an upper bound on a quantity whose true minimum nobody knows. Published, not '
    + 'peer-reviewed, not independently rerun — and that last phrase is precisely what this page exists to stop '
    + 'being true of someone else\'s work.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-add55.js @ git ' + git + '. Gates at this '
  + 'build: the slp battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), the audited bytes '
  + 'matched against sha256 ' + sha.slice(0, 16) + '…, and the full audit re-run — ' + a.brent.equations
  + ' Brent equations and all ' + a.counted + ' gates re-evaluated here. A refuted node would refuse this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'matmul-additions.html'),
  TPL.render({ title: 'Rank is not the cost: checking 55 additions for 3×3',
    bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/matmul-additions.html',
    desc: 'Everyone quotes Laderman\'s 23 multiplications; the additions are where the record has been moving, seven times in a year. The newest claim is 55, one month old, on a zero-star repository. Re-derived here in exact arithmetic.' }));
console.log('reports/matmul-additions.html written: ' + a.verdict + ', ' + a.counted + ' gates counted, '
  + a.brent.equations + ' Brent equations, ' + nReds + ' reds @ git ' + git);
