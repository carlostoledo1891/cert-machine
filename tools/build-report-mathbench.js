#!/usr/bin/env node
/* build-report-mathbench.js — reports/mathbench.html: Certified MathBench v0, as pre-registered
   (notes/mathbench-v0-preregistration-2026-09-29.md). Every number comes from certs/mathbench-ledger.jsonl — the rows the
   campaign wrote, one per rung per model, each decided by its family's certifier — and from the battery's own count.

   usage: node tools/build-report-mathbench.js */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('MATHBENCH REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

let bat = ''; try { bat = cp.execFileSync('python3', ['instruments/mathbench/battery.py'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die('the battery did not pass: ' + (e.stdout || e.message)); }
const bm = /mathbench battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(bat);
if (!bm || bm[2] !== bm[3]) die('the battery did not pass whole');
const rows = fs.readFileSync(path.join(ROOT, 'certs', 'mathbench-ledger.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((r) => r.tag === 'v0');
const MODELS = ['baseline', 'claude-haiku-4-5-20251001', 'claude-sonnet-5', 'claude-opus-5'];
const SHORT = { 'baseline': 'baseline', 'claude-haiku-4-5-20251001': 'Haiku 4.5', 'claude-sonnet-5': 'Sonnet 5', 'claude-opus-5': 'Opus 5' };
const FAM = ['golomb', 'capset', 'code', 'ramsey', 'sumdiff3b', 'kissing', 'polymulF2'];
const FAMNAME = { golomb: 'Golomb rulers', capset: 'cap sets in F₃ⁿ', code: 'binary codes', ramsey: 'Ramsey graphs', sumdiff3b: 'sum–difference laws (C3b)', kissing: 'kissing configurations', polymulF2: 'polynomial multiplication over F₂' };
const BEYOND = new Set(['capset|(7, 237)', 'code|(10, 3, 73)', 'ramsey|(4, 6, 36)', 'sumdiff3b|1.7789889', 'kissing|(5, 41)']);
/* the latest row per (model, family, rung) */
const last = new Map();
for (const r of rows) last.set(r.model + '|' + r.family + '|' + r.target, r);
const rungs = [];
for (const f of FAM) {
  const ts = [...new Set(rows.filter((r) => r.family === f && r.model === 'baseline').map((r) => r.target))];
  for (const t of ts) rungs.push([f, t]);
}
if (rungs.length !== 46) die('expected the 46 pre-registered rungs, found ' + rungs.length);
const get = (m, f, t) => last.get(m + '|' + f + '|' + t);
const done = MODELS.slice(1).filter((m) => rungs.every(([f, t]) => get(m, f, t)));
if (done.length < 3) die('the campaign has not finished: complete for ' + done.join(', '));
const stat = (m) => {
  const rs = rungs.map(([f, t]) => get(m, f, t));
  const c = (o) => rs.filter((r) => r.outcome === o).length;
  const beyondBase = rungs.filter(([f, t]) => get(m, f, t).outcome === 'certified' && get('baseline', f, t).outcome !== 'certified').length;
  const beyondRec = rungs.filter(([f, t]) => BEYOND.has(f + '|' + t) && get(m, f, t).outcome === 'certified').length;
  const usd = rs.reduce((a, r) => a + ((r.usage && r.usage.usd) || 0), 0);
  const out = rs.reduce((a, r) => a + ((r.usage && r.usage.out) || 0), 0);
  const graded = rs.length - c('budget-exhausted');
  return { certified: c('certified'), refuted: c('refuted'), rejected: c('rejected'), malformed: c('malformed'), budget: c('budget-exhausted'), undecided: c('undecided'), graded, beyondBase, beyondRec, usd, out };
};
const S = Object.fromEntries(MODELS.map((m) => [m, stat(m)]));
const spent = MODELS.slice(1).reduce((a, m) => a + S[m].usd, 0);
if (spent > 30) die('the campaign spent more than its ceiling');
const beyondRecAny = MODELS.slice(1).some((m) => S[m].beyondRec > 0);
/* filled = certified, outlined = refuted, dashed = not graded as an object (screened out, unparsed, out of tokens) */
const TAG = { certified: ['CERTIFIED', 'held'], refuted: ['REFUTED', 'dep'], rejected: ['REJECTED', 'open'], malformed: ['MALFORMED', 'open'], 'budget-exhausted': ['OUT OF TOKENS', 'open'], undecided: ['UNDECIDED', 'open'] };
const cell = (r) => r ? { raw: C.tag(...(TAG[r.outcome] || [r.outcome, 'open'])) } : '—';

const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · benchmark · pre-registered',
  title: 'Certified MathBench v0',
  deck: 'Three Claude models asked, once each, for 46 mathematical constructions across seven families — rulers, caps, codes, graphs, laws, sphere packings, '
    + 'bilinear algorithms — and every answer decided exactly: no answer key, no judge, no tolerance. The run followed its pre-registration, and cost US$'
    + spent.toFixed(2) + ' of the US$30 ceiling.'
}));
B.push(C.scope('Pre-registered on 29 September 2026 before the first model call (notes/mathbench-v0-preregistration-2026-09-29.md): the families and ladders, '
  + 'one sample per rung at the API\'s default thinking and effort, 24,000 output tokens, the metrics, and what counts as a null. Models: '
  + MODELS.slice(1).map((m) => SHORT[m] + ' (' + m + ')').join(', ') + '. Rungs marked ◆ ask beyond the published record; nothing certified there would be announced '
  + 'before a second implementation re-decides it. One deviation, recorded in the pre-registration: five Opus calls on the sum–difference family came back from the '
  + 'API with an error and no reply, nothing billed, and were issued once more after the run; no rung was sampled twice.'));
B.push(C.tldr({
  findingRaw: MODELS.slice(1).map((m) => '<b>' + SHORT[m] + '</b> ' + S[m].certified + ' of ' + S[m].graded + ' graded rungs certified (' + S[m].beyondBase + ' the baseline does not reach)').join('; ')
    + '. ' + (beyondRecAny ? 'A beyond-the-record rung was certified: it is held for a second implementation before anything is said about it.' : 'No model certified a rung beyond the published record.')
    + ' Rungs where a reply ran out of tokens before an object: ' + MODELS.slice(1).map((m) => SHORT[m] + ' ' + S[m].budget).join(', ') + ' — recorded, never graded.',
  mechanismRaw: 'Each family parses a reply into an exact object and decides it: distinct differences for a ruler, no three collinear points for a cap, pairwise distances for a code, '
    + 'clique and independence numbers for a graph, entropies in intervals for a law, exact inner products for a kissing configuration, the bilinear identity over F₂. '
    + 'Before any call the family\'s red controls (near-misses forged from known witnesses) must come back refuted and its green controls certified; a textbook baseline '
    + 'is decided like any proposal.',
  checkRaw: C.m('python3 instruments/mathbench/battery.py') + ' — ' + bm[1] + ' checks, ' + bm[3] + ' red controls · ' + C.m('certs/mathbench-ledger.jsonl') + ', one row per call with its usage.'
}));
B.push(C.stats(MODELS.slice(1).map((m) => ({ k: SHORT[m], v: S[m].certified + '/' + S[m].graded, n: 'certified of graded · ' + S[m].refuted + ' refuted · US$' + S[m].usd.toFixed(2) + (S[m].certified ? ' · US$' + (S[m].usd / S[m].certified).toFixed(3) + ' per certified rung' : '') }))
  .concat([{ k: 'baseline', v: S.baseline.certified + '/46', n: 'the textbook first try, decided like any proposal' }])));
B.push(C.section({
  lab: '§1 · every rung', title: 'Forty-six constructions, four answerers', wide: true,
  bodyRaw: C.table({
    cols: [{ h: 'family' }, { h: 'rung' }].concat(MODELS.map((m) => ({ h: SHORT[m] }))),
    rows: rungs.map(([f, t]) => [FAMNAME[f], (BEYOND.has(f + '|' + t) ? '◆ ' : '') + t].concat(MODELS.map((m) => cell(get(m, f, t)))))
  })
}));
B.push(C.section({
  lab: '§2 · the words', title: 'What each verdict means',
  bodyRaw: C.pRaw('In the table a filled mark is certified, an outlined one refuted, and a dashed one not graded as an object.') + C.plainList([
    { b: 'CERTIFIED.', text: 'The object parsed and has every property the rung asks, decided exactly.' },
    { b: 'REFUTED.', text: 'The object parsed and the certifier names the property it lacks — a repeated difference, a collinear triple, a clique, a short distance.' },
    { b: 'REJECTED.', text: 'The object parsed but failed the cheap screen before the certifier (a wrong size, a wrong shape); the screen may only rule things out.' },
    { b: 'MALFORMED.', text: 'No object could be parsed from the reply.' },
    { b: 'OUT OF TOKENS.', text: 'The reply reached the 24,000-token cap before an object: recorded and billed, never graded.' }
  ])
}));
B.push(C.section({
  lab: '§3 · limits', title: 'What one sample says',
  bodyRaw: C.plainList([
    { b: 'One sample per rung.', text: 'Pass@1 at the default thinking settings; a second sample, or more thinking, could change any cell. The pre-registration fixed this before the first call.' },
    { b: 'Recall and discovery look alike.', text: 'Most rungs are known optima or records; certifying one shows the model produced a correct object, not that it found one no one had.' },
    { b: 'Only Anthropic\'s models.', text: 'The keys on this machine reach no other lab; v0 compares three Claude models, not the field.' }
  ])
}));
const foot = '<p>' + C.esc('Generated by tools/build-report-mathbench.js from certs/mathbench-ledger.jsonl (' + rows.length + ' v0 rows); battery ' + bm[1] + ' checks, ' + bm[3] + ' red controls.') + '</p><p>' + C.esc('git ' + git) + '</p>';
fs.writeFileSync(path.join(ROOT, 'reports', 'mathbench.html'), TPL.render({
  title: 'Certified MathBench v0 · cert-machine', bodyRaw: B.join('\n\n'), footRaw: foot,
  desc: 'Three Claude models, 46 mathematical constructions, one sample each, every answer decided exactly: ' + MODELS.slice(1).map((m) => SHORT[m] + ' ' + S[m].certified + '/' + S[m].graded).join(', ') + '; US$' + spent.toFixed(2) + ' of a pre-registered US$30.',
  path: '/reports/mathbench.html'
}));
console.log('reports/mathbench.html written: ' + MODELS.slice(1).map((m) => SHORT[m] + ' ' + S[m].certified + '/' + S[m].graded).join(', ') + ', $' + spent.toFixed(2) + ' @ git ' + git);
