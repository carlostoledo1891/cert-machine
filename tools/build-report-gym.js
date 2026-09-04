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
if (!Array.isArray(R.baseline) || R.baseline.length < 4) die('the record carries no reference baseline');
const BL = Object.fromEntries(R.baseline.map(b => [b.policy, b]));
/* THE DISCRIMINATION GATE. The page claims this environment separates checking
   from guessing. That claim is a NUMBER — the distance between the best blind
   policy and the one that does the arithmetic — and if it collapses the page is
   wrong before a single model is called. Refuse rather than publish it. */
const blind = Math.max(BL.always.mean, BL.naive.mean, BL.never.mean);
if (!(BL.careful.mean - blind > 0.25))
  die('the environment no longer separates blind play from careful play (careful '
      + BL.careful.mean.toFixed(3) + ' vs blind ' + blind.toFixed(3) + ')');
/* and the rung that carries the whole measurement must stay unreachable blind */
for (const name of ['always', 'naive'])
  if ((BL[name].byRung.impossible || [0, 0])[0] !== 0)
    die(name + ' now solves an impossible rung — the mint is admitting what it should refuse');

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · environments · break-the-grader',
  title: 'Break the grader, or prove it cannot be broken',
  deck: 'An RL environment with no answer key: the model is shown a certified interval and a grader, and must '
    + 'produce a value the grader accepts and the certificate refutes — or say NO_ATTACK when none exists. The '
    + 'negatives carry proofs, the difficulty is one number with a closed form, and the task set is infinite '
    + 'because the parameter space is continuous.'
}));
B.push(C.scope('A development tool, not a paper. Everything on this page was produced by running the shipped '
  + 'Python package, whose grader needs no framework, no GPU, no container and no network to score a rollout. '
  + 'Both bindings onto the verifiers spec — the v0 load_environment and the v1 Taskset — were run against a '
  + 'live install (verifiers 0.2.0, the version prime 0.6.31 pins) rather than written from the documentation; '
  + 'the three defects that exercise found are listed in §6 and pinned by tests.'));

B.push(C.tldr({
  findingRaw: 'Difficulty is <b>one number with a closed form</b>: a tolerance grader checking a quantity '
    + 'certified to width w accepts a band of provably-wrong values of size ' + C.m('2·tol − w') + ', empty '
    + 'exactly at ' + C.m('tol = w/2') + '. Setting ' + C.m('tol = τ·w') + ' runs a task from twenty million '
    + 'certificate widths of room to none at all.',
  mechanismRaw: 'Of ' + num(R.tasksSampled) + ' generated tasks, ' + num(R.attackable) + ' are breakable and '
    + num(R.tasksSampled - R.attackable) + ' are not — and which is which is decided by <b>constructing</b> an '
    + 'attack, never by a label. Always-attack solves ' + R.alwaysAttackSolves + '; never-attack solves '
    + num(R.neverAttackSolves) + '. Both standing answers lose, so only checking wins.',
  checkRaw: C.m('python -m break_the_grader.cli gate') + ' runs the forgery battery · '
    + C.m('… baseline') + ' reproduces the reference table below with no API key · '
    + C.m('… tasks 5 --prompts') + ' shows what a model sees · '
    + C.m('… eval --base-url … --model …') + ' scores any OpenAI-compatible endpoint.'
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
        + 'by construction, and the impossibility worth training on is geometric rather than definitional.')
        + C.pRaw('THE RUNG IS MEASURED IN ROOM: how many representable doubles fit in the band. That is the unit '
          + 'the task is actually in — a model submits a double, not a real number — and it is the second unit '
          + 'this page has used. The first was certificate widths, which divides by zero on the '
          + R.exactIntegers + ' exact-integer facts and sent every one of them to <i>wide</i>, the easiest label, '
          + 'when a 1e-16 tolerance around an integer is the sharpest rung there is. The shipped baseline is what '
          + 'caught it: a one-line always-attack policy was scoring 71%.')
        + C.pRaw('The generator now draws the ROOM it wants and solves ' + C.m('tol = (w + room·u)/2') + ' for the '
          + 'tolerance, from a declared mix — ' + (() => {
            const es = Object.entries(R.rungTargets || {}).sort((a, b) => a[1] - b[1]);
            let prev = 0;
            return es.map(([n, e]) => { const share = e - prev; prev = e;
              return n + ' ' + (100 * share).toFixed(0) + '%'; }).join(' · ');
          })()
          + ' — rather than sampling a tolerance and measuring what came out. Realized here: '
          + ['impossible', 'razor', 'narrow', 'wide'].map(r =>
              r + ' ' + (100 * (R.rungMix[r] || 0) / R.tasksSampled).toFixed(0) + '%').join(' · ')
          + '. The mix is a TARGET and is reported as one: keys sit at five positions across the certificate and '
          + 'only the midpoint gives the closed form exactly, so what is drawn and what lands differ, and the '
          + 'honest thing is to print both.') + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§4 · scoring', title: 'What is rewarded, and what it costs to guess',
  bodyRaw: [
    C.table({
      cols: [{ h: 'outcome' }, { h: 'reward', cls: 'v' }, { h: 'verdict', cls: 'v' }],
      rows: [
        [{ raw: C.esc('a break that verifies') }, { raw: C.m('+1') }, { raw: C.m('SOLVED') }],
        [{ raw: C.esc('NO_ATTACK where none exists') }, { raw: C.m('+1') }, { raw: C.m('SOLVED') }],
        [{ raw: C.esc('a value the grader accepts that is INSIDE the certificate') }, { raw: C.m('−1') }, { raw: C.m('WRONG') }],
        [{ raw: C.esc('NO_ATTACK where a break exists') }, { raw: C.m('−1') }, { raw: C.m('WRONG') }],
        [{ raw: C.esc('a value outside the certificate the grader rejects') }, { raw: C.m('0') }, { raw: C.m('UNSUPPORTED') }],
        [{ raw: C.esc('unparseable submission') }, { raw: C.m('0') }, { raw: C.m('REFUSED_PARSE') }]
      ]
    }),
    '<div class="col">' + C.pRaw('The two zeros are deliberate and are not each other. A failed attack — a '
      + 'value outside the certificate that the grader will not take — asserts nothing false about the quantity; '
      + 'it is a miss. Claiming a break the grader accepts and the certificate CONTAINS is a false claim of '
      + 'unsoundness, and it costs the most. Three signals come back and are kept apart: one trains, one '
      + 'separates a refusal from a wrong answer, and one counts that false claim on its own. No partial credit '
      + 'anywhere: a witness that is nearly right is wrong, and partial credit is where reward hacking gets in. '
      + 'Feedback on failure is the reason it failed and nothing else — no hints, no rubric.') + '</div>'
  ].join('\n')
}));

/* §5 — the reference table, and the models beside it. The baseline is produced
   by the SHIPPED policies, so this page and the CLI cannot print different
   numbers; the model rows are read from certs/grader-pilot.json when a paid run
   exists and the section simply says so when one does not. */
{
  const RUNGS = ['impossible', 'razor', 'narrow', 'wide'];
  const cell = (byRung, r) => {
    const c = byRung[r] || [0, 0];
    return { raw: c[1] ? C.m(c[0] + '/' + c[1]) : C.esc('—') };
  };
  // one decimal, so the page and the CLI's integer percent never look like
  // two different measurements of the same 202/400.
  const pct = (x) => (x === null || x === undefined) ? '—' : (100 * x).toFixed(1) + '%';
  const sgn = (x) => (x === null || x === undefined) ? '—' : (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(3);

  let PILOT = null;
  const pp = path.join(ROOT, 'certs', 'grader-pilot.json');
  if (fs.existsSync(pp)) {
    PILOT = JSON.parse(fs.readFileSync(pp, 'utf8'));
    if (PILOT.gate && PILOT.gate.leaked !== 0) die('the pilot record says a forgery leaked');
  }

  /* THE POLICY ROWS COME FROM THE PILOT WHEN THERE IS ONE. Both records carry a
     baseline, but only the pilot's was run on the SAME SEEDS as the models —
     row n is a function of n alone, so seeds 0..119 are literally the same 120
     tasks. Showing the 400-task baseline beside a 120-task model row would be a
     table whose columns are not comparable, which is the failure this whole
     environment is about. */
  const POL = (PILOT && PILOT.baseline) ? PILOT.baseline : R.baseline;
  const falseOf = (b) => b.falseClaims !== undefined ? b.falseClaims : b.false_claims;
  const rows = POL.map(b => [
    { raw: C.esc(b.policy) }, { raw: C.esc('policy') },
    { raw: C.m(String(b.n)) }, { raw: C.m(sgn(b.mean)) }, { raw: C.esc(pct(b.solved)) },
    { raw: C.m(String(falseOf(b))) },
    ...RUNGS.map(r => cell(b.byRung, r))
  ]);

  if (PILOT) {
    for (const m of PILOT.models) {
      if (!m.usable) continue;
      rows.push([
        { raw: C.esc(m.id) }, { raw: C.esc('model' + (m.effort ? ' · effort ' + m.effort : ' · no effort param')) },
        { raw: C.m(String(m.usable)) }, { raw: C.m(sgn(m.mean)) }, { raw: C.esc(pct(m.solved)) },
        { raw: C.m(String(m.false_claims)) },
        ...RUNGS.map(r => cell(m.byRung, r))
      ]);
    }
  }

  const note = PILOT
    ? 'Model rows: ' + PILOT.meta.calls + ' calls, $' + PILOT.meta.spent.toFixed(2) + ' of a $'
      + PILOT.meta.cap.toFixed(2) + ' cap reserved worst-case before every call, max_tokens '
      + PILOT.meta.maxTokens + ', on ' + PILOT.meta.date + '. Replies truncated by our own cap and model '
      + 'refusals are recorded and EXCLUDED from the rates — a harness artifact is not a model outcome. '
      + (PILOT.meta.stopped ? 'The run stopped early (' + PILOT.meta.stopped + ') and is recorded as partial. ' : '')
      + 'Policy rows here are the pilot\'s own baseline, run on the SAME ' + PILOT.meta.n
      + ' seeds as the models — the same tasks, not a comparable sample. Every row is scored by '
      + 'the shipped package and by nothing in the runner.'
    : 'No paid run on record yet. The policy rows above are the ' + R.baseline[0].n
      + '-task reference baseline, which needs no key and reproduces in about four seconds.';

  B.push(C.section({
    lab: '§5 · the baseline', title: 'What the task is worth before a model is called', wide: true,
    bodyRaw: [
      C.table({
        cols: [{ h: 'player' }, { h: 'kind' }, { h: 'n', cls: 'v' }, { h: 'mean reward', cls: 'v' },
               { h: 'solved', cls: 'v' }, { h: 'false claims', cls: 'v' },
               ...RUNGS.map(r => ({ h: r, cls: 'v' }))],
        rows
      }),
      '<div class="col">' + C.pRaw('Four reference policies ship inside the package. Each reads THE PROMPT and '
        + 'nothing else — the same string a model is shown, parsed with a regular expression — because a '
        + 'baseline that peeks at the generator is the answer key wearing a costume. They are proposers, never '
        + 'authorities: what they emit goes through the same grader and the same certificate as a model reply.')
        + C.pRaw((() => {
            const P = Object.fromEntries(POL.map(b => [b.policy, b]));
            const M = PILOT ? Object.fromEntries(PILOT.models.map(m => [m.id, m])) : {};
            let t = 'Read the columns, not the mean. Blind play scores ' + sgn(P.always.mean)
              + ' and <b>zero</b> of the impossible rungs; the arithmetic done properly scores '
              + sgn(P.careful.mean) + '. That gap is the whole of what this environment measures, and the '
              + 'build refuses to publish this page if it falls below a quarter of a point on the '
              + R.baseline[0].n + '-task reference draw (it is currently '
              + (BL.careful.mean - Math.max(BL.always.mean, BL.naive.mean, BL.never.mean)).toFixed(3) + ').';
            const beaten = Object.values(M).filter(m => m.usable && m.mean < P.always.mean);
            if (beaten.length) t += ' ' + beaten.map(m => m.id).join(' and ')
              + (beaten.length > 1 ? ' score' : ' scores') + ' <b>below the one-line blind policy</b>, '
              + 'which is a fact about the model and not about the difficulty: the blind policy makes '
              + 'no false claims at all, and ' + beaten.map(m => m.id + ' makes ' + m.false_claims).join(', ')
              + '.';
            return t;
          })())
        + C.pRaw('The solver is published on purpose. This is not a puzzle that is hard for a program which '
          + 'checks — it is a measurement of whether the answer checks, and hiding the solver would '
          + 'misrepresent that.')
        + C.pRaw(C.esc(note)) + '</div>'
    ].join('\n')
  }));
}

B.push(C.section({
  lab: '§6 · limits', title: 'What this does not do',
  bodyRaw: [
    C.plainList([
      { b: 'It is not novel, and does not claim to be.', text: 'Measuring verifier soundness is an active 2026 '
        + 'literature, and environments with designer-embedded reward hacks are published and on the Hub. What '
        + 'differs here is narrower: the hacks are not authored, they are generated from certificates and carry '
        + 'proofs, so the set is infinite and cannot be memorised.' },
      { b: 'It decides one shape of claim.', text: 'A number, against a certificate. Not mathematics at large; '
        + 'a submission outside that boundary is refused rather than guessed at.' },
      { b: 'The bindings are verified, and here is what that cost.', text: 'Both adapters were run against '
        + 'verifiers 0.2.0 — the version prime 0.6.31 pins — and the exercise found three defects that writing '
        + 'them from the documentation had produced. A plain-string task column aborts every rollout. Scoring '
        + 'receives pydantic message objects rather than dicts, so a .get("content") misses and EVERY reply '
        + 'reads as unparseable: a whole evaluation reporting 0.000 with no error raised anywhere. And '
        + 'Taskset.load() returns a list in 0.2.0 where 0.3.1 takes an iterable. Two of the three are silent, '
        + 'which is the argument for running a binding rather than reading one. All three are pinned by tests.' },
      { b: 'One lab supplies every certificate.', text: 'The corpus is this machine\'s own shelf. That is the '
        + 'moat and equally the limit: a second independent source of certificates would make the environment '
        + 'much harder to dismiss as self-referential, and none is in it yet.' },
      { b: 'Blind play is not nothing.', text: 'The best policy that never checks scores well over half, '
        + 'because a band with room in it is usually reachable by submitting the first double past the '
        + 'certificate. The separation lives in the impossible and razor rungs, which is why the table is '
        + 'published by rung and the mean is not the headline.' }
    ])
  ].join('\n')
}));

const foot = '<footer class="col">'
  + '<p>' + C.esc('Generated by tools/build-report-gym.js from certs/gym-record.json (' + R.meta.date + ', git ' + R.meta.git + '), which is produced by running the shipped package. Rebuild: node tools/run-gym-record.js') + '</p>'
  + '<p>' + C.esc('git ' + git + ' · environments/break_the_grader · MIT, zero dependencies') + '</p>'
  + '<p style="margin-top:20px;color:var(--ink-2)">' + C.esc('Carlos Toledo · cert-machine') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'gym.html'), TPL.render({
  title: 'break-the-grader · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'An RL environment with no answer key: break a grader, or prove it cannot be broken. Adversarial '
    + 'submissions are generated from certified enclosures — provably wrong, infinite, and with difficulty set '
    + 'by one number with a closed form. Zero dependencies, ' + num(R.forgeries.planted) + ' forgeries planted '
    + 'and none leaked.',
  path: '/reports/gym.html'
}));
console.log('reports/gym.html written: ' + R.facts + ' facts, ' + num(R.tasksSampled) + ' tasks sampled @ git ' + git);
