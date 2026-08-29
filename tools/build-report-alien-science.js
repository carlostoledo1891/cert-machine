#!/usr/bin/env node
/* build-report-alien-science.js — generate reports/alien-science.html: the
   engine rebuild of the alien-science disposition page, in cert-machine's
   design system.

   The gate: the shipped fellows-pack kernel (stdlib Python, public — it is
   in the published bundle the Anthropic sandbox issue links) is RE-RUN at
   build and must re-derive the disagreement pair — the clean algebraic
   fragment CERTIFIED at exact residual 0, the planted channel mutant
   REFUSED — and the four artifacts the issue cites are re-hashed so their
   byte-stability is visible on the page.

   usage: node tools/build-report-alien-science.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const os = require('os');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const BUNDLE = path.join(ROOT, 'legacy', 'research', 'alien-science', 'alien-science');
const die = (m) => { console.error('ALIEN-SCIENCE REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the gate: re-derive the disagreement pair from the shipped pack ------ */
const SCR = fs.mkdtempSync(path.join(os.tmpdir(), 'alien-build-'));
fs.cpSync(BUNDLE, SCR, { recursive: true });
let out;
try { out = cp.execSync('python3 fellows-pack/kernels/swap_consistency.py', { cwd: SCR, stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }
catch (e) { die('kernel failed:\n' + (e.stdout || e.message)); }
fs.rmSync(SCR, { recursive: true, force: true });
if (!/"verdict": "CERTIFIED", "max": "0"/.test(out)) die('the clean fragment no longer certifies at residual 0');
if (!/"verdict": "REFUSED", "reason": "max residual 1\/10/.test(out)) die('the planted mutant is no longer refused');

/* the four artifacts the issue cites, re-hashed */
const CITED = ['swap-consistency.js', 'hack-detectors.js', 'disposition-v0.json', 'README.md'];
const hashes = CITED.map((f) => ({ f, sha: crypto.createHash('sha256').update(fs.readFileSync(path.join(BUNDLE, f))).digest('hex') }));

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · report · the disagreement re-derived at every build',
  title: 'Alien science needs a disposition, not a sermon',
  deck: 'Anthropic\'s Automated Alignment Researchers closed almost the entire weak-to-strong gap — and named '
    + 'their own binding constraint: evaluation becomes more critical than idea generation. This page is built '
    + 'around one exhibit: a capability score and a machine-checked disposition DISAGREEING about the same '
    + 'artifact. An idea reported at PGR 0.78 whose clean algebraic fragment is CERTIFIED at exact Bayes '
    + 'residual 0 — and a planted mutant carrying the same reported score, REFUSED by the same checker. '
    + 'Both verdicts were re-derived from the shipped pack during this build.'
}));

O.push(C.tldr({
  findingRaw: 'A capability score and a machine-checked disposition DISAGREE about the same artifact: the clean '
    + 'fragment is CERTIFIED at exact Bayes residual 0, while a planted mutant carrying the same reported score '
    + 'is REFUSED by the same checker. Scores rate; dispositions decide.',
  mechanismRaw: 'The exhibit ships as a pack with its own stdlib-Python kernel; both verdicts were re-derived '
    + 'from the shipped bytes during this build, not quoted from a run that happened once.',
  checkRaw: 'download the pack linked on this page and run its kernel — Python standard library, no '
    + 'dependencies, seconds.'
}));

/* ---- the disagreement, exactly -------------------------------------------
   The page's exhibit is that a score and a certificate can disagree. Both
   fragments carry the SAME reported score; what separates them is one exact
   rational residual and a tolerance of exactly zero. Drawn, the tolerance is
   not a band — it is a point, which is why no score can rescue the mutant. */
{
  const fig = CH.intervals({
    w: 900, rowH: 44, x0: -0.012, x1: 0.128, padL: 210, padR: 190,
    xTicks: [0, 0.025, 0.05, 0.075, 0.1].map(v => ({ v, t: v === 0 ? '0' : String(v) })),
    xLabel: 'exact Bayes-consistency residual of the fragment  (the admissible set is the single point 0)',
    rows: [
      { k: 'the clean fragment', point: 0, token: 'var(--c-2)',
        v: 'residual exactly 0 — CERTIFIED', note: 'CERTIFIED — residual 0' },
      { k: 'the planted mutant', point: 0.1, token: 'var(--c-1)',
        v: 'residual 1/10, and epsilon is 0 — REFUSED', note: 'REFUSED — residual 1/10' }
    ],
    keys: [{ token: 'var(--c-2)', t: 'certified: residual is exactly zero' },
           { token: 'var(--c-1)', t: 'refused: any non-zero residual at all' }],
    alt: 'Two fragments on an exact residual axis. The clean one sits at exactly zero and certifies; the '
      + 'planted mutant sits at one tenth and is refused. The tolerance is zero, so the admissible set is the '
      + 'single point at the origin.'
  });
  O.push(C.section({
    lab: '§0 · the exhibit', title: 'The same score, and a certificate that separates them anyway',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Nobody scored the mutant — it carries the clean fragment\'s reported score. The only thing '
        + 'that tells them apart is an exact rational residual, checked against a tolerance of zero, which is '
        + 'why the separation cannot be argued with.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'Both fragments were re-derived from the shipped pack during this '
        + 'build, in stdlib Python, with no key and no GPU. The clean one lands at residual exactly 0 and '
        + 'certifies; the planted mutant lands at 1/10 and is refused. Because \u03b5 = 0 the admissible set '
        + 'is a single point rather than a tolerance band, so there is no threshold to tune and no score high '
        + 'enough to move the mutant into it. That is the whole disposition this page argues for: not a better '
        + 'score, a different KIND of statement.' })
  }));
}

O.push(C.stats([
  { k: 'the clean fragment', v: 'CERTIFIED', role: 'held', n: 'exact Bayes residual 0 — re-derived this build from the shipped pack, stdlib Python' },
  { k: 'the planted mutant', v: 'REFUSED', role: 'warn', n: 'same reported score (nobody scored the mutant), same checker, residual 1/10 ≠ 0 — re-derived this build' },
  { k: 'sample pack', v: '10 + 17 pairs', n: 'shipped clean/mutant pairs plus the live harvested pack — mutant_certified = 0 across both' },
  { k: 'their numbers', v: 'NOT REMEASURED', n: 'PGR 0.97 vs human 0.23, $22/AAR-hour, 0.78 — Anthropic\'s figures, reported as theirs; the ~$18k re-run was priced and declined' },
  { k: 'runs on', v: 'NO KEY, NO GPU', role: 'held', n: 'the disposition checks are self-contained — a stranger re-runs the half that costs nothing' },
  { k: 'cited artifacts', v: CITED.length + ' files', n: 'still served byte-identical at the URLs the sandbox issue links; re-hashed at build' }
]));

O.push(C.section({
  lab: '§1 · the exhibit', title: 'A score and a certificate can disagree — that disagreement is the object',
  bodyRaw: '<div class="col">'
    + C.pRaw('Capability metrics grade how much an idea helps; dispositions decide whether its checkable core is '
      + 'TRUE. The two are orthogonal, and the exhibit makes the orthogonality concrete: the clean fragment and '
      + 'the planted channel mutant carry the SAME reported capability score — the mutant was never scored, it '
      + 'inherits the row\'s — yet exact arithmetic certifies one at residual 0 and refuses the other at '
      + 'residual 1/10. A pipeline that promotes artifacts by score alone promotes both rows; a disposition '
      + 'layer separates them for the cost of a stdlib script. Across the shipped and harvested packs — 27 '
      + 'clean/mutant pairs — not one mutant certifies.')
    + '</div>'
}));

O.push(C.section({
  lab: '§2 · what they built', title: 'The sandbox, and the constraint its authors named',
  bodyRaw: '<div class="col">'
    + C.pRaw('Nine Claude Opus 4.6 agents, sandboxed with a shared forum and codebase, hill-climbing '
      + 'weak-to-strong supervision against a remote PGR API holding ground truth server-side (the Burns et al. '
      + '2023 line). Their reported results — PGR 0.97 against a human baseline of 0.23, at roughly $22 per '
      + 'AAR-hour — stay theirs: remeasuring means re-running 9 × Opus 4.6 × 5 days, a spend this page priced '
      + 'and declined. Their stated ceilings are reward hacking and "alien science" — ideas too strange to '
      + 'evaluate — and their own conclusion is this page\'s premise: evaluation becomes more critical than '
      + 'idea generation. The disposition layer is a concrete answer in the one lane where answers can be '
      + 'exact: the algebraically checkable fragment of a proposed idea.')
    + '</div>'
}));

O.push(C.section({
  lab: '§3 · the discipline', title: 'What is claimed, what is not, and one retraction',
  bodyRaw: '<div class="col">'
    + C.pRaw('Not claimed: that certificates dissolve alien science in general — only that where an idea has a '
      + 'checkable algebraic core, the check can be exact, portable and free to re-run. The literature review is '
      + 'labeled partial. And one assertion was RETRACTED at source-check: an early draft called the upstream '
      + 'sandbox repository MIT-licensed; the GitHub API returned license: null and every LICENSE path 404d, so '
      + 'on 2026-07-31 the claim was pulled rather than softened — here and in every working note that carried '
      + 'it. Do not assume MIT reuse of the upstream sandbox.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · check it', title: 'The pack re-runs for nothing — and the cited bytes hold still', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'cited artifact' }, { h: 'sha256 (re-hashed this build)', cls: 'v' }],
    rows: hashes.map((h) => [{ raw: '<a href="/research/alien-science/alien-science/' + C.esc(h.f) + '"><span class="m">' + C.esc(h.f) + '</span></a>' }, { raw: '<span class="m">' + h.sha.slice(0, 32) + '…</span>' }])
  })
  + '<div class="col">' + C.pRaw('The four files the sandbox issue links are served byte-identical at their '
    + 'original URLs (they are raw artifacts, not pages, so they never restyle). The disagreement pair above is '
    + 're-derived at every build of this page by the pack\'s own kernel — '
    + '<span class="m">python3 fellows-pack/kernels/swap_consistency.py</span>, standard library only — from '
    + '<a href="https://github.com/carlostoledo1891/cert-machine/tree/main/legacy/research/alien-science/alien-science">the published bundle</a>.') + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-alien-science.js @ git ' + gitrev
  + ' — the disagreement pair re-derived from the shipped pack during this build (CERTIFIED + REFUSED, or no page); the cited artifacts re-hashed. '
  + 'The page as originally sent is byte-preserved in the repository (legacy/research/alien-science/).') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'alien-science.html'),
  TPL.render({ title: 'Alien science needs a disposition · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/alien-science.html' }));
console.log('reports/alien-science.html written: pair re-derived (CERTIFIED + REFUSED), ' + CITED.length + ' artifacts re-hashed @ git ' + gitrev);
