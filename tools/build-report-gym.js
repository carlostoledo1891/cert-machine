#!/usr/bin/env node
/* build-report-gym.js — reports/gym.html, from certs/gym-record.json.
   The record is produced by RUNNING the shipped Python package; this page only
   reads it. The build refuses if the environment's own gates have stopped
   holding, because a page about soundness may not outlive the soundness.
   usage: node tools/build-report-gym.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('GYM REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const num = (n) => n.toLocaleString('en-US');
const RP = path.join(ROOT, 'certs', 'gym-record.json');
if (!fs.existsSync(RP)) die('certs/gym-record.json is missing — run node tools/run-gym-record.js');
const R = JSON.parse(fs.readFileSync(RP, 'utf8'));
if (R.forgeries.leaked !== 0) die('the record says a forgery leaked');
if (!(R.alwaysAttackSolves < R.tasksSampled && R.neverAttackSolves > 0)) die('both standing answers no longer lose');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · environments · certificate-band-gym',
  title: 'Break the grader, or prove it cannot be broken',
  deck: 'An RL environment with no answer key: the model is shown a certified interval and a grader, and must '
    + 'produce a value the grader accepts and the certificate refutes — or say NO_ATTACK when none exists. The '
    + 'negatives carry proofs, the difficulty is one number with a closed form, and the task set is infinite '
    + 'because the parameter space is continuous.'
}));
B.push(C.scope('A development tool, not a paper. Everything on this page was produced by running the shipped '
  + 'Python package, which has zero dependencies and needs no GPU, container or network to score a rollout. The '
  + 'binding onto the verifiers spec is written from its published description and has NOT been run against a '
  + 'live install — that is stated here, at the top of taskset.py, and in the package README.'));

B.push(C.tldr({
  findingRaw: 'Difficulty is <b>one number with a closed form</b>: a tolerance grader checking a quantity '
    + 'certified to width w accepts a band of provably-wrong values of size ' + C.m('2·tol − w') + ', empty '
    + 'exactly at ' + C.m('tol = w/2') + '. Setting ' + C.m('tol = τ·w') + ' runs a task from twenty million '
    + 'certificate widths of room to none at all.',
  mechanismRaw: 'Of ' + num(R.tasksSampled) + ' generated tasks, ' + num(R.attackable) + ' are breakable and '
    + num(R.tasksSampled - R.attackable) + ' are not — and which is which is decided by <b>constructing</b> an '
    + 'attack, never by a label. Always-attack solves ' + R.alwaysAttackSolves + '; never-attack solves '
    + num(R.neverAttackSolves) + '. Both standing answers lose, so only checking wins.',
  checkRaw: C.m('python -m certificate_band_gym.cli gate') + ' runs the forgery battery · '
    + C.m('… tasks 5 --prompts') + ' shows what a model sees · ' + C.m('… eval --base-url … --model …')
    + ' scores any OpenAI-compatible endpoint.'
}));

B.push(C.stats([
  { k: 'certified facts', v: num(R.facts), n: R.pinned + ' sha256-pinned to the record they were read from · ' + R.exactIntegers + ' exact integers, the sharpest seeds in the set: when the true value is an integer, every value in the tolerance window is provably wrong.' },
  { k: 'tasks breakable', v: num(R.attackable) + ' / ' + num(R.tasksSampled), n: 'Decided by minting an actual double inside the band. A rung declared breakable that cannot produce one throws rather than shipping.' },
  { k: 'always-attack scores', v: String(R.alwaysAttackSolves), n: 'Out of ' + num(R.tasksSampled) + '. Never-attack scores ' + num(R.neverAttackSolves) + '. A test asserts both, because an environment that rewards a reflex measures nothing.' },
  { k: 'forgeries planted, leaked', v: num(R.forgeries.planted) + ' / ' + R.forgeries.leaked, n: 'Planted before any model is called. They live in tests/, so any CI that installs the package re-checks the soundness claim on a machine that is not ours.' }
]));

{
  const pts = R.dial.filter(d => d.bandWidths > 0);
  const svg = CH.lines({
    w: 900, h: 330, logX: true, logY: true,
    x0: Math.min(...pts.map(p => p.tau)) * 0.8, x1: Math.max(...pts.map(p => p.tau)) * 1.3,
    y0: Math.min(...pts.map(p => p.bandWidths)) * 0.5, y1: Math.max(...pts.map(p => p.bandWidths)) * 2,
    xLabel: 'τ = tolerance ÷ certificate width', yLabel: 'band, in certificate widths',
    alt: 'The difficulty dial: band size against the tolerance multiple, both on log axes. The band falls linearly and vanishes at tau = 1/2.',
    series: [{ name: 'band = 2τ − 1 widths', token: 'var(--c-1)', pts: pts.map(p => [p.tau, p.bandWidths]) }],
    keys: [{ token: 'var(--c-1)', t: 'band = (2τ − 1) certificate widths', kind: 'line' }],
    vmarks: [{ x: 0.5001, t: 'no double fits below here', token: 'var(--c-3)', dashed: true }]
  });
  const rows = R.dial.map(d => [
    { raw: C.m(d.tau >= 1 ? num(Math.round(d.tau)) : d.tau.toString()) },
    { raw: C.m(d.bandWidths >= 1 ? num(d.bandWidths) : (d.bandWidths === 0 ? '0' : d.bandWidths.toExponential(1))) },
    { raw: C.m(d.band === 0 ? '0' : d.band.toExponential(2)) },
    { raw: d.reachable ? C.tag('breakable', 'open') : C.tag('no attack exists', 'held') }
  ]);
  B.push(C.section({
    lab: '§1 · the dial', title: 'One number moves a task from a gift to an impossibility', wide: true,
    bodyRaw: [
      C.figure({ svgRaw: svg, caption: 'The band against τ, both axes logarithmic, measured on '
        + R.dialFact.id + ' (width ' + R.dialFact.width.toExponential(1) + '). It falls linearly in τ and '
        + 'vanishes at τ = 1/2 — and stops being reachable before that, once the band is narrower than the gap '
        + 'between neighbouring doubles.' }),
      C.table({ cols: [{ h: 'τ' }, { h: 'band, in widths', cls: 'v' }, { h: 'band, absolute', cls: 'v' }, { h: 'is there an attack?' }], rows }),
      '<div class="col">' + C.pRaw('Nothing here is hand-curated. The generator samples τ on a log schedule, so a '
        + 'batch contains gifts, razors and impossibilities in known proportions, and the dial is continuous if '
        + 'you want it somewhere else. That is what a fixed list of hand-authored tasks cannot give you: a '
        + 'difficulty knob with an analytic form, and a task set with nothing to leak because it does not exist '
        + 'until the parameters are chosen.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§2 · the rung that caught us first', title: 'Exact in the reals, empty in the machine',
  bodyRaw: [
    C.pRaw('The band is computed in exact rationals and then intersected with the doubles, and those are '
      + 'different questions. Around the integer 64 with a tolerance of 1e-15 the band is a perfectly good '
      + 'interval of real numbers containing <strong>no representable double at all</strong> — the nearest one '
      + 'is 1.4e-14 away. A model that reasons "the tolerance is 1e-15, so 64 + 5e-16 will do" submits a value '
      + 'that <em>is</em> 64 in float64: inside the certificate, not outside, and scored wrong.'),
    C.pRaw('That rung exists because this lab\'s own canary generator had the identical bug — ' + C.m('hi + tol/2')
      + ' rounding back to ' + C.m('hi') + ' on a zero-width certificate — and the battery caught it before it '
      + 'shipped. When the same environment was run against real models, the model without extended thinking '
      + 'made the same mistake on every attempt at that rung. The environment inherits the catch.'),
    C.note({ lab: 'why the corpus is stored as rationals', bodyRaw: C.pRaw('Endpoints are exact fractions, not '
      + 'decimals. An environment whose entire subject is what decimals lose may not store its own facts as '
      + 'decimals — and every fact names the record it was read from, with that record\'s sha256, so a task '
      + 'traces back to the certificate that produced it.') })
  ].join('\n')
}));

{
  const rows = Object.entries(R.mix).sort((a, b) => b[1] - a[1]).map(([k, v]) => {
    const [kind, rung] = k.split('/');
    return [{ raw: C.esc(kind) }, { raw: C.esc(rung) }, { raw: C.m(num(v)) },
      { raw: C.m((100 * v / R.tasksSampled).toFixed(1) + '%') }];
  });
  B.push(C.section({
    lab: '§3 · the mix', title: 'What ' + num(R.tasksSampled) + ' sampled tasks contain', wide: true,
    bodyRaw: [
      C.table({ cols: [{ h: 'grader shape' }, { h: 'rung' }, { h: 'tasks', cls: 'v' }, { h: 'share', cls: 'v' }], rows }),
      '<div class="col">' + C.pRaw('Four grader shapes — absolute tolerance, relative tolerance, rounding to a '
        + 'printed number of digits, and the certificate itself — share ONE exact band computation, because each '
        + 'is only an acceptance interval. The certificate shape is deliberately the rarest: it is unbreakable '
        + 'by construction, and the impossibility worth training on is geometric rather than definitional.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§4 · scoring', title: 'What is rewarded, and what it costs to guess',
  bodyRaw: [
    C.table({
      cols: [{ h: 'outcome' }, { h: 'reward', cls: 'v' }],
      rows: [
        [{ raw: C.esc('a break that verifies') }, { raw: C.m('+1') }],
        [{ raw: C.esc('NO_ATTACK where none exists') }, { raw: C.m('+1') }],
        [{ raw: C.esc('a claimed break that does not verify') }, { raw: C.m('−1') }],
        [{ raw: C.esc('NO_ATTACK where a break exists') }, { raw: C.m('−1') }],
        [{ raw: C.esc('unparseable submission') }, { raw: C.m('0') }]
      ]
    }),
    '<div class="col">' + C.pRaw('Three signals come back and are kept apart: one trains, one separates a '
      + 'refusal from a wrong answer, and one counts the specific failure this environment exists to punish — a '
      + 'confident claim that does not verify. No partial credit anywhere: a witness that is nearly right is '
      + 'wrong, and partial credit is where reward hacking gets in. Feedback on failure is the reason it failed '
      + 'and nothing else — no hints, no rubric.') + '</div>'
  ].join('\n')
}));

B.push(C.section({
  lab: '§5 · limits', title: 'What this does not do',
  bodyRaw: [
    C.plainList([
      { b: 'It is not novel, and does not claim to be.', text: 'Measuring verifier soundness is an active 2026 '
        + 'literature, and environments with designer-embedded reward hacks are published and on the Hub. What '
        + 'differs here is narrower: the hacks are not authored, they are generated from certificates and carry '
        + 'proofs, so the set is infinite and cannot be memorised.' },
      { b: 'It decides one shape of claim.', text: 'A number, against a certificate. Not mathematics at large; '
        + 'a submission outside that boundary is refused rather than guessed at.' },
      { b: 'The verifiers binding is unverified.', text: 'Written from the published API description, not run '
        + 'against a live install. The core needs no framework and is exercised by the tests and the CLI.' },
      { b: 'No results table yet.', text: 'Real-model numbers exist for this lab\'s JavaScript environments, not '
        + 'for this package — different rungs, different generator. Publishing those under this name would be '
        + 'the exact move the environment argues against. One CLI command produces a real one.' }
    ])
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-gym.js from certs/gym-record.json (' + R.meta.date + ', git ' + R.meta.git + '), which is produced by running the shipped package. Rebuild: node tools/run-gym-record.js') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · environments/certificate_band_gym · MIT, zero dependencies') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'gym.html'), TPL.render({
  title: 'certificate-band-gym · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'An RL environment with no answer key: break a grader, or prove it cannot be broken. Adversarial '
    + 'submissions are generated from certified enclosures — provably wrong, infinite, and with difficulty set '
    + 'by one number with a closed form. Zero dependencies, ' + num(R.forgeries.planted) + ' forgeries planted '
    + 'and none leaked.',
  path: '/reports/gym.html'
}));
console.log('reports/gym.html written: ' + R.facts + ' facts, ' + num(R.tasksSampled) + ' tasks sampled @ git ' + git);
