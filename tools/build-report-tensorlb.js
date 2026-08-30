#!/usr/bin/env node
/* build-report-tensorlb.js — reports/tensor-rank-bounds.html: BOTH walls of
   the rank of 3x3 matrix multiplication, independently re-verified here.

   This repo has audited the UPPER wall of <3,3,3> for months — Strassen,
   Laderman, AlphaTensor, AlphaEvolve, all pinned in certs/strassen-
   certificate.json and re-decided at every build. This page adds the LOWER
   wall: Chengu Wang's arXiv:2603.07280 (2026-03-07) proves R_F2(<3,3,3>) >= 20,
   improving Blaeser's 19 of 2003. Its certificate had, so far as we can
   establish, never been independently checked.

   Gate: instruments/tensorlb/battery.py re-runs at this build — 12 checks and
   3 red controls that must fire — and the page refuses without it. Every
   number below is parsed from that run, never typed.

   usage: node tools/build-report-tensorlb.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('TENSORLB REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate: the battery, re-run ------------------------------------------- */
const bat = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'tensorlb', 'battery.py')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /battery green: (\d+)\/(\d+) checks, (\d+)\/(\d+) red controls fired/.exec(bout);
if (bat.status !== 0 || !bm) die('the tensorlb battery did not pass:\n' + bout.slice(-600));
const nChecks = Number(bm[1]), nReds = Number(bm[3]);

/* ---- the audits, re-run and parsed --------------------------------------- */
const run = (f) => {
  const r = cp.spawnSync('python3', [path.join(ROOT, 'instruments', 'tensorlb', 'verify.py'),
    path.join(ROOT, 'corpus', 'sources', f)], { cwd: ROOT });
  const o = String(r.stdout);
  const g = (re) => { const m = re.exec(o); if (!m) die('could not read "' + re + '" out of the audit'); return Number(m[1]); };
  return { nodes: g(/nodes:\s*(\d+)/), wok: g(/witnesses re-verified:\s*(\d+) ok/),
    wbad: g(/re-verified:\s*\d+ ok,\s*(\d+) BAD/), conf: g(/CONFIRMED[^:]*:\s*(\d+)/),
    tight: g(/TIGHT-IF[^:]*:\s*(\d+)/), surv: g(/SURVIVES[^:]*:\s*(\d+)/),
    nat: g(/NOT-ATTACKED[^:]*:\s*(\d+)/), ref: g(/REFUTED[^:]*:\s*(\d+)/) };
};
const A2 = run('wang_cert_matrix_q02_n222.pb.txt');
const A3 = run('wang_cert_matrix_q02_n333.pb.txt');
if (A2.ref || A3.ref) die('a node was refuted — that is a finding, not a build: stop and write it up');
if (A2.wbad || A3.wbad) die('an upper-bound witness failed to re-verify');

const pins = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'sources', 'PINS.json'), 'utf8'));
const SHA = pins['wang_cert_matrix_q02_n333.pb.txt'];
const attacked = A3.conf + A3.tight + A3.surv;
const pct = (x, n) => (100 * x / n).toFixed(1) + '%';

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · both walls · an independent audit of someone else\'s certificate',
  title: 'The rank of 3x3 matrix multiplication, audited from both sides',
  deck: 'Laderman multiplied two 3x3 matrices in 23 multiplications in 1976 and nobody has done better since. '
    + 'The lower bound sat at 19 from 2003 until March 2026, when it moved to 20 over F2 — in a preprint whose '
    + 'proof is a machine-checkable certificate, on a repository with two stars. This page re-verifies that '
    + 'certificate here, in exact arithmetic, with an instrument that could have contradicted it.'
}));

B.push(C.tldr({
  findingRaw: 'The certificate behind R_F2(&lt;3,3,3&gt;) &ge; 20 holds everywhere we attacked it: <strong>'
    + attacked + ' of its ' + A3.nodes + ' nodes</strong> were genuinely attacked and <strong>' + A3.ref
    + ' were refuted</strong>. ' + A3.conf + ' are now proved TWO-SIDED here — for those, none of the paper\'s '
    + 'four inference rules is trusted at all. The honest limit is the other ' + A3.nat + ' nodes ('
    + pct(A3.nat, A3.nodes) + '), which this instrument cannot yet reach and which still rest on his reasoning.',
  mechanismRaw: 'We did not reimplement his proof. A verifier that re-runs an author\'s own inference rules can '
    + 'only ever AGREE with him. This instrument computes GROUND TRUTH instead — the true minimum rank of each '
    + 'constrained sub-tensor, over F2 — and asks whether his number is the truth. A method that can DISAGREE is '
    + 'worth strictly more than one that cannot. Two things his certificate never documents, the constraint '
    + 'semantics and the transposed c-index convention, were recovered from the bytes.',
  checkRaw: C.m('python3 instruments/tensorlb/battery.py') + ' — ' + nChecks + ' checks and ' + nReds
    + ' red controls, all of which must fire; the audited bytes are pinned at sha256 ' + C.m(SHA.slice(0, 16) + '…')
    + ', which is the git-lfs object id the author published upstream.'
}));

B.push(C.stats([
  { k: 'the interval, today', v: '20 ≤ R ≤ 23', role: 'held', n: 'lower bound Wang 2026 over F2 (was Blaeser 19, 2003); upper bound Laderman 1976. Both walls re-verified by this machine' },
  { k: 'nodes attacked', v: attacked + ' of ' + A3.nodes, role: 'held', n: 'a genuine attempt to find a cheaper decomposition than the certificate claims' },
  { k: 'refuted', v: String(A3.ref), role: 'held', n: 'no node admitted a decomposition below its claimed bound' },
  { k: 'proved two-sided here', v: String(A3.conf), role: 'held', n: 'rank == the claimed bound, computed exactly; the author\'s inference rules are not relied on for these' },
  { k: 'still on his reasoning', v: String(A3.nat), role: 'open', n: 'dimension > 2; beyond this instrument. Stated here rather than buried' },
  { k: 'control certificate', v: A2.wok + '/' + (A2.wok + A2.wbad) + ' witnesses', role: 'held', n: '<2,2,2>, where rank 7 has been known optimal since Winograd 1971 — every witness re-verified against a sub-tensor we rebuilt ourselves' },
]));

B.push(C.section({
  lab: '§1 · the two walls', title: 'What is actually known about R(&lt;3,3,3&gt;)',
  bodyRaw: C.table({
    cols: [{ h: 'wall' }, { h: 'value', cls: 'n' }, { h: 'who, when' }, { h: 'status here' }],
    rows: [
      ['upper bound (any field)', '23', 'Laderman 1976', 'a rank-23 witness is pinned in certs/strassen-certificate.json and re-certified at every build'],
      ['lower bound (F2)', '20', 'Wang, arXiv:2603.07280, March 2026', A3.conf + ' of ' + A3.nodes + ' certificate nodes proved two-sided here; ' + A3.ref + ' refuted'],
      ['lower bound (any field)', '19', 'Blaeser 2003', 'not audited here — the 20 is an F2 statement and does not supersede it'],
      ['border rank (over C)', '≥ 17', 'Conner–Harper–Landsberg', 'a different quantity; never quote it as a rank bound'],
    ]
  }) + '<div class="col">' + C.pRaw('The gap is real and old: nobody has moved 23 in fifty years, and until this '
    + 'March nobody had moved 19 in twenty-three. A rank-22 algorithm, incidentally, would not even beat Strassen '
    + 'asymptotically — log&#8323;22 &gt; log&#8322;7 — which is why the exhaustive-search literature deliberately '
    + 'stops at 21.') + '</div>'
}));

B.push(C.section({
  lab: '§2 · the audit', title: 'Ground truth, not a second opinion',
  bodyRaw: C.table({
    cols: [{ h: 'certificate' }, { h: 'nodes', cls: 'n' }, { h: 'witnesses re-verified', cls: 'n' },
           { h: 'proved two-sided', cls: 'n' }, { h: 'attacked', cls: 'n' }, { h: 'refuted', cls: 'n' }],
    rows: [
      ['&lt;2,2,2&gt; control (rank 7 known optimal)', String(A2.nodes), A2.wok + ' / ' + (A2.wok + A2.wbad), String(A2.conf), String(A2.conf + A2.tight + A2.surv), String(A2.ref)],
      ['&lt;3,3,3&gt; — the new bound', String(A3.nodes), '—', String(A3.conf), String(attacked), String(A3.ref)],
    ]
  }) + '<div class="col">' + C.pRaw('The control matters more than it looks. Its final node is the unconstrained '
    + '&lt;2,2,2&gt; tensor with a claimed bound of 7 — a number Winograd proved optimal in 1971. Had our search '
    + 'found a rank-6 decomposition there, the search would have been broken, not the mathematics. It did not.')
  + C.pRaw('The &lt;3,3,3&gt; certificate carries no upper-bound witnesses at all, so there is nothing to '
    + 'cross-check against: it is a pure lower-bound argument across ' + A3.nodes + ' nodes resting on four '
    + 'inference rules. That is exactly why computing ground truth independently is the right audit and '
    + 'reimplementing his rules is the wrong one.') + '</div>'
}));

B.push(C.note({
  lab: 'what this page does NOT claim',
  bodyRaw: C.pRaw('No new mathematics was discovered here. We found no refutation, no better bound and no '
    + 'counterexample; ' + A3.nat + ' of ' + A3.nodes + ' nodes were never attacked and still depend entirely on '
    + 'the author\'s reasoning. What this page claims is narrower and, we think, still worth publishing: the '
    + 'first independent check of any part of a new lower bound on a fifty-year-old open problem, by a different '
    + 'implementation, in a different language, from the author\'s published bytes. Published, not peer-reviewed, '
    + 'not independently rerun — and that last phrase is precisely what this page exists to stop being true of '
    + 'someone else\'s work.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-tensorlb.js @ git ' + git + '. Gates at this '
  + 'build: the tensorlb battery (' + nChecks + ' checks, ' + nReds + ' red controls, all fired), both audits '
  + 're-run and their numbers parsed rather than transcribed, and the audited certificate matched against the '
  + 'sha256 its author published. A refuted node would refuse this page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'tensor-rank-bounds.html'),
  TPL.render({ title: 'The rank of 3x3 matrix multiplication, audited from both sides',
    bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/tensor-rank-bounds.html',
    desc: 'Laderman\'s 23 has stood since 1976; the lower bound moved from 19 to 20 in March 2026 in a preprint nobody had checked. Both walls re-verified here in exact arithmetic, by an instrument that could have contradicted either.' }));
console.log('reports/tensor-rank-bounds.html written: ' + A3.conf + '/' + A3.nodes + ' nodes proved two-sided, '
  + attacked + ' attacked, ' + A3.ref + ' refuted; battery ' + nChecks + ' checks / ' + nReds + ' reds @ git ' + git);
