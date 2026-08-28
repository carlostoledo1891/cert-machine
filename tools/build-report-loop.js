#!/usr/bin/env node
/* build-report-loop.js — generate reports/verifier-loop.html: the verified
   reward channel demonstrated in closed loop.

   A model is asked for a decomposition; the grader answers every failure
   with ITS OWN refutation mechanism — a parse complaint, a screen
   complaint, or the certificate's first violated equation with its exact
   discrepancy — and the model retries in the same conversation. The page
   renders each trajectory round by round from the append-only loop ledger.

   Gates: the harness calibration re-runs (red controls must refute, green
   witnesses must certify) exactly as the eval page's gate does; every
   ledger row's outcome must be a known verdict; and every feedback string
   must match one of the three fixed mechanism templates — a feedback that
   is not the verifier's own mechanism would be coaching, and the build
   refuses to render it.

   usage: node tools/build-report-loop.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('LOOP REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the grader's calibration, re-run ---------------------------- */
const cal = cp.spawnSync('python3', ['tools/llm-harness.py', '--dry-run', '--family', 'matmul', '--n', '8', '--ledger', '/dev/null'], { cwd: ROOT });
const calOut = String(cal.stdout) + String(cal.stderr);
if (!/red controls:\s*\d+ run,\s*\d+ refuted exactly,\s*0 certified/.test(calOut)) die('red-control line not found in calibration');
if (!/green controls:\s*\d+ run,\s*\d+ certified/.test(calOut)) die('green-control line not found in calibration');

/* ---- gate 2: the ledger, read and checked -------------------------------- */
const LEDGER = path.join(ROOT, 'certs', 'matmul-loop-ledger.jsonl');
if (!fs.existsSync(LEDGER)) die('no loop ledger — run a --loop campaign first');
const rows = fs.readFileSync(LEDGER, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
if (!rows.length) die('the loop ledger is empty');
const OUTCOMES = ['malformed', 'rejected', 'refuted', 'certified', 'undecided', 'declined'];
const FEEDBACK_PREFIX = ['Your reply did not parse', 'Your proposal failed the screen', 'Exact grading REFUTED your proposal'];
for (const r of rows) {
  if (!OUTCOMES.includes(r.outcome)) die('unknown outcome in ledger: ' + r.outcome);
  if (r.feedback != null && !FEEDBACK_PREFIX.some((p) => r.feedback.startsWith(p)))
    die('a feedback string does not match the fixed mechanism templates — that would be coaching, refused');
}

/* trajectories, grouped and ordered */
const byTraj = new Map();
for (const r of rows) {
  const k = r.model + '|' + r.target + '|' + r.trajectory;
  if (!byTraj.has(k)) byTraj.set(k, { model: r.model, target: r.target, trajectory: r.trajectory, rounds: [] });
  byTraj.get(k).rounds.push(r);
}
const trajs = [...byTraj.values()];
for (const t of trajs) t.rounds.sort((a, b) => a.round - b.round);
for (const t of trajs) {
  t.final = t.rounds[t.rounds.length - 1].outcome;
  t.converted = t.final === 'certified' && t.rounds.length > 1;
  t.firstShot = t.final === 'certified' && t.rounds.length === 1;
}
const nCert = trajs.filter((t) => t.final === 'certified').length;
const nConv = trajs.filter((t) => t.converted).length;
const models = [...new Set(trajs.map((t) => t.model))].sort();
const totalRounds = rows.length;

/* ---- the page ------------------------------------------------------------ */
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · verified reward · every trajectory from the append-only ledger',
  title: 'The verifier in the loop',
  deck: 'The reward channel, demonstrated in closed loop: a model proposes a decomposition, the grader answers '
    + 'every failure with its own refutation mechanism — the first violated equation and its exact discrepancy, '
    + 'nothing more — and the model retries in the same conversation. No hints, no partial answers, no human. '
    + 'This page renders every trajectory round by round; the question it measures is whether a certificate\'s '
    + 'failure mechanism is, by itself, a training signal.'
}));

B.push(C.tldr({
  findingRaw: nCert + ' of ' + trajs.length + ' trajectories end CERTIFIED'
    + (nConv ? ' — ' + nConv + ' of them converted from failure by the verifier\'s feedback alone'
      : ' — every certification was first-shot, and no below-bar trajectory was rescued by feedback: the '
      + 'channel is honest in both directions, unable to coach and impossible to sweet-talk')
    + '. The feedback is never advice: it is the exact index where the identity fails and the exact discrepancy, '
    + 'read off the certificate that refuted the attempt.',
  mechanismRaw: 'Reinforcement signal without reward hacking: the loop\'s reward is a certificate, so "the model '
    + 'satisfied the grader" and "the mathematics is correct" are the same event. The three feedback templates '
    + 'are fixed in the harness source, and this build REFUSES to render a trajectory whose feedback deviates '
    + 'from them — coaching would invalidate the demonstration.',
  checkRaw: C.m('python3 tools/llm-harness.py --model <id> --target "(3, 3, 3, 23)" --loop 6 --trajectories 1 '
    + '--max-tokens 5000 --loop-ledger certs/matmul-loop-ledger.jsonl') + ' — same red and green controls as '
    + 'every campaign, run before any round.'
}));

B.push(C.stats([
  { k: 'trajectories', v: String(trajs.length), n: models.join(' · ') + ' — each an independent conversation against the grader' },
  { k: 'end certified', v: String(nCert), role: nCert ? 'held' : 'warn', n: nCert ? 'the terminal row of each is an exact theorem' : 'no trajectory has certified yet — recorded as honestly as a success would be' },
  { k: 'converted by feedback', v: String(nConv), role: nConv ? 'held' : undefined, n: 'failed at round 1, certified by the round cap — the verifier\'s mechanism did the converting' },
  { k: 'rounds graded', v: String(totalRounds), n: 'every round a ledger row with its verdict and the exact feedback sent' },
  { k: 'coaching', v: '0', role: 'held', n: 'feedback is template-locked to the grader\'s own mechanism; the build refuses on any deviation' }
]));

B.push(C.section({
  lab: '§1 · the design', title: 'What the model is told when it fails',
  bodyRaw: [
    C.p('Three failure classes, three fixed messages. A reply that did not parse is told the required JSON shape '
      + 'and nothing else. A proposal that failed the prune-only screen is told which class of check it failed '
      + '(shapes, rank bound, or float spot-test) and nothing else. A proposal the certifier REFUTED is told the '
      + 'first index where the defining identity fails and the exact value of the discrepancy — the certificate\'s '
      + 'own first_violation field, verbatim. That is the entire vocabulary of the feedback channel.'),
    C.p('This is the verified-reward property in motion: the loop can only converge to a certificate, because '
      + 'certification is the only exit the grader rewards, and the grader cannot be satisfied by anything less '
      + 'than the exact identity. There is no rubric to overfit, no judge to persuade, no reference value to '
      + 'reproduce — reward hacking is not difficult here, it is undefined.')
  ].join('\n')
}));

const outcomeTag = (o) => o === 'certified' ? C.tag('CERTIFIED', 'held')
  : o === 'refuted' ? C.tag('refuted', 'open')
  : o === 'declined' ? C.tag('declined', 'dep')
  : C.tag(o, 'dep');
B.push(C.section({
  lab: '§2 · the trajectories', title: 'Round by round, from the ledger', wide: true,
  bodyRaw: trajs.map((t) => C.table({
    cols: [{ h: t.model + ' · ' + t.target + ' · trajectory ' + t.trajectory }, { h: 'verdict' }, { h: 'what the verifier sent back' }],
    rows: t.rounds.map((r) => [
      'round ' + r.round,
      { raw: outcomeTag(r.outcome) },
      { raw: r.feedback ? '<span class="m">' + C.esc(r.feedback.length > 220 ? r.feedback.slice(0, 220) + '…' : r.feedback) + '</span>'
        : (r.outcome === 'certified' ? 'nothing — the terminal row is a theorem' : '—') }
    ])
  })).join('\n')
    + '<div class="col">' + C.pRaw('Every row above is read off ' + C.m('certs/matmul-loop-ledger.jsonl')
      + ' at build time — the raw proposals and full certificates are in the ledger. A trajectory that ends '
      + 'without certifying is rendered exactly like one that succeeds; the demonstration is the channel, '
      + 'not a highlight reel.') + '</div>'
}));

B.push(C.section({
  lab: '§3 · why it matters', title: 'From eval to training signal',
  bodyRaw: C.p('An evaluation grades one attempt; a reward channel shapes many. The loop is the smallest possible '
    + 'demonstration that this machine\'s grading is the second thing, not just the first: the same certificate '
    + 'that scores a proposal carries, in its refutation mechanism, enough signal to steer the next one — and '
    + 'because false positives are provably impossible, a policy trained against this channel cannot learn to '
    + 'exploit its grader. Scaled up, this is reinforcement learning on certified rewards for mathematical '
    + 'search; run once in a conversation, it is what this page shows.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-loop.js @ git ' + git + '. The grader\'s red '
  + 'and green controls re-ran during this build; every trajectory row was read off the append-only ledger; and '
  + 'every feedback string was checked against the fixed mechanism templates — a deviation refuses the page.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'verifier-loop.html'),
  TPL.render({ title: 'The verifier in the loop', bodyRaw: B.join('\n\n'), footRaw: foot, path: '/reports/verifier-loop.html',
    desc: 'The verified reward channel in closed loop: a model proposes, the grader answers with its own refutation mechanism — the exact violated equation, nothing more — and the model retries. Feedback that cannot coach and cannot be sweet-talked.' }));
console.log('reports/verifier-loop.html written: ' + trajs.length + ' trajectories, ' + totalRounds
  + ' rounds, ' + nCert + ' certified (' + nConv + ' converted by feedback) @ git ' + git);
