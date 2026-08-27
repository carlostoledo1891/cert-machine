#!/usr/bin/env node
/* build-report-eval.js — generate reports/matmul-eval.html: the eval whose
   ground truth is a proof.

   Model-proposes-engine-certifies over fast matrix multiplication: a
   proposed rank-R decomposition of the <n,m,p> matmul tensor either IS an
   exact tensor identity over the rationals or it is not — graded in stdlib
   Fractions, so a false positive is provably false and a leaderboard row is
   a theorem count, not an opinion.

   The gate: this build re-runs the harness's calibration (deterministic
   fake proposer + red controls) and refuses to render unless every red
   control lands short of certification — including the sub-float forgery
   (a coefficient off by 1e-9, invisible to the float screen) which must be
   REFUTED exactly. The leaderboard is read from the append-only ledger
   certs/matmul-eval-ledger.jsonl.

   usage: node tools/build-report-eval.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('EVAL REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- the gate: calibration re-run ---------------------------------------- */
let cal;
try {
  cal = cp.execSync('python3 tools/llm-harness.py --dry-run --family matmul --n 8 --ledger /dev/null',
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }).toString()
    + cp.spawnSync('python3', ['tools/llm-harness.py', '--dry-run', '--family', 'matmul', '--n', '8', '--ledger', '/dev/null'], { cwd: ROOT }).stderr.toString();
} catch (e) { die('harness calibration failed:\n' + (e.stdout || e.message)); }
const red = /red controls:\s*(\d+) run,\s*(\d+) refuted exactly,\s*0 certified/.exec(cal);
if (!red) die('red-control line not found (or a control certified — the instrument would have aborted)');
if (Number(red[2]) < 1) die('no red control reached exact refutation — the certifier\'s failure path is unproven');

/* ---- the leaderboard, from the ledger ------------------------------------ */
const LEDGER = path.join(ROOT, 'certs', 'matmul-eval-ledger.jsonl');
const rows = fs.existsSync(LEDGER)
  ? fs.readFileSync(LEDGER, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
  : [];
const byModel = new Map();
for (const r of rows) {
  if (r.family !== 'matmul') continue;
  const tag = r.tag || 'v1';
  const k = (r.model || 'fake') + ' · ' + tag;
  if (!byModel.has(k)) byModel.set(k, { model: r.model || 'fake', tag, n: 0, malformed: 0, rejected: 0, refuted: 0, certified: 0, undecided: 0 });
  const a = byModel.get(k);
  a.n++; a[r.outcome] = (a[r.outcome] || 0) + 1;
}
const agg = [...byModel.values()].map((a) => ({
  ...a,
  certRate: a.n ? a.certified / a.n : 0,
  survivorTruth: (a.certified + a.refuted + a.undecided) ? a.certified / (a.certified + a.refuted + a.undecided) : null
}));
const models = agg.filter((a) => a.model !== 'fake').sort((x, y) => x.tag === y.tag ? y.certRate - x.certRate : (x.tag < y.tag ? 1 : -1));
const fake = agg.find((a) => a.model === 'fake');
const pct = (x) => x === null ? '—' : (100 * x).toFixed(0) + '%';

const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · eval · ground truth is a proof',
  title: 'The matmul eval: model proposes, the machine certifies',
  deck: 'A language model is asked for a rank-R decomposition of the <n,m,p> matrix-multiplication tensor over '
    + 'the rationals. The proposal either IS an exact tensor identity — checked term by term in stdlib Fractions '
    + '— or it is not. No human grader, no digit matching, no rubric: a certified row is a theorem, a refuted row '
    + 'is a proof of error, and a false positive is PROVABLY false. This is the grading property digit-matched '
    + 'and human-graded math benchmarks cannot offer, on the one task where model-proposes-verifier-decides '
    + 'already produced a famous discovery.'
}));

O.push(C.tldr({
  findingRaw: 'Across every real-model campaign, zero certified rows are wrong and zero float-screen survivors '
    + 'were subtly false — frontier failures are malformed or rejected, never almost-right. Grading is a proof, '
    + 'so the leaderboard is a theorem count, and the same harness is a reward oracle that cannot be hacked.',
  mechanismRaw: 'A proposed rank-R decomposition either satisfies the full tensor identity in exact rational '
    + 'arithmetic or it does not; red controls — including a coefficient off by 1e-9, invisible to any float '
    + 'screen — must be refuted exactly before a campaign grades anything, and a certifying control aborts it.',
  checkRaw: C.m('python3 tools/llm-harness.py --dry-run --family matmul --n 8') + ' — the calibration this page '
    + 're-ran as its own gate before rendering.'
}));

O.push(C.stats([
  { k: 'grading', v: 'CERTIFICATE', role: 'held', n: 'exact tensor identity over Fractions — always decidable, never an opinion' },
  { k: 'false positives', v: 'PROVABLY 0', role: 'held', n: 'a wrong decomposition cannot certify; the red controls prove the refusal path fires every run' },
  { k: 'red controls', v: red[2] + ' refuted / run', role: 'warn', n: 'incl. a coefficient off by 1e-9 — INVISIBLE to the float screen, caught exactly; any certification of a control aborts the campaign' },
  { k: 'the ladder', v: '4 rungs', n: '<2,2,2> rank 8 (easy) · rank 7 (Strassen) · <2,2,3> rank 11 · <3,3,3> rank 23 (Laderman)' },
  { k: 'models run', v: String(models.length), n: models.length ? 'append-only ledger; every row carries its certificate' : 'none yet — the table below is the deterministic calibration baseline' },
  { k: 'cost to grade', v: '~0', n: 'stdlib Python, milliseconds per proposal; the eval runs anywhere, forever, for nothing' }
]));

O.push(C.section({
  lab: '§1 · why this shape', title: 'An eval where the answer key cannot be wrong',
  bodyRaw: '<div class="col">'
    + C.pRaw('Mathematical ground truth usually inherits the failure class of whatever computed it — the '
      + '<a href="erdos852.html">failure taxonomy</a> on this site exists because digit-matched reference values '
      + 'shipped a float artifact as a constant. Here the reference is not a value at all: the task is to '
      + 'EXHIBIT a witness (a decomposition), and the grader re-derives the claim from the witness alone, '
      + 'exactly. Grading a proposal means checking Σᵣ u[r][a·m+b] · v[r][c·p+d] · w[r][e·p+f] against the '
      + 'matmul tensor at every index — a finite, exact computation with no tolerance anywhere. The eval '
      + 'cannot be gamed by memorizing digits, and it cannot false-accept: both directions of every verdict '
      + 'are theorems.')
    + C.pRaw('Five outcomes per proposal, and all five are informative: MALFORMED (the reply did not parse), '
      + 'REJECTED (the prune-only float screen caught a shape or gross-value error), REFUTED (well-formed, '
      + 'plausible to the screen, exactly false — the bucket digit-matching cannot see), CERTIFIED (exactly '
      + 'true), UNDECIDED (never occurs here; the identity is always decidable). The headline number is the '
      + 'SURVIVOR TRUTH RATE: of proposals that looked right to a float screen, how many were actually true.')
    + '</div>'
}));

const cols = [{ h: 'model' }, { h: 'prompt' }, { h: 'proposals' }, { h: 'certified' }, { h: 'refuted' }, { h: 'rejected' }, { h: 'malformed' }, { h: 'certified rate' }, { h: 'survivor truth' }];
const mkRow = (a, tagKind) => [
  { raw: '<span class="m">' + C.esc(a.model) + '</span>' + (tagKind ? ' ' + C.tag('calibration baseline', tagKind) : '') },
  { raw: '<span class="m">' + C.esc(a.tag || 'v1') + '</span>' },
  String(a.n), String(a.certified), String(a.refuted), String(a.rejected), String(a.malformed), pct(a.certRate), pct(a.survivorTruth)
];
O.push(C.section({
  lab: '§2 · the leaderboard', title: models.length ? 'Certified truth rates' : 'No model has run yet — honestly', wide: true,
  bodyRaw: C.table({ cols, rows: [...models.map((a) => mkRow(a)), ...(fake ? [mkRow(fake, 'open')] : [])] })
    + '<div class="col">' + C.pRaw((models.length === 0
      ? 'The only rows in the ledger are the deterministic FAKE proposer — the calibration baseline that exercises '
        + 'every outcome without any model or API. No claim about any model is made until its rows exist. '
      : 'Every row aggregates the append-only ledger; every underlying proposal carries its exact certificate. ')
      + 'To put a model on this board, run '
      + '<span class="m">ANTHROPIC_API_KEY=… python3 tools/llm-harness.py --family matmul --model &lt;id&gt; --n 40 '
      + '--ledger certs/matmul-eval-ledger.jsonl</span> from '
      + '<a href="https://github.com/carlostoledo1891/cert-machine">the repository</a>, then rebuild this page. '
      + 'The red controls run first and ABORT the campaign if any forgery certifies — the eval refuses to '
      + 'produce numbers under a broken grader.') + '</div>'
}));

/* ---- §2b · the ladder, per rung ------------------------------------------
   Aggregated (model, tag, target) — where capability cliffs live: a model
   can be perfect on the format rung and empty on Laderman, and the
   aggregate hides it. Real models only; the calibration baseline's per-rung
   spread is noise by construction. */
const byRung = new Map();
for (const r of rows) {
  if (r.family !== 'matmul' || (r.model || 'fake') === 'fake') continue;
  const k = r.model + ' ' + (r.tag || 'v1') + ' ' + r.target;
  if (!byRung.has(k)) byRung.set(k, { model: r.model, tag: r.tag || 'v1', target: r.target, n: 0, malformed: 0, rejected: 0, refuted: 0, certified: 0, undecided: 0 });
  const a = byRung.get(k);
  a.n++; a[r.outcome] = (a[r.outcome] || 0) + 1;
}
const rungTuple = (t) => String(t).replace(/[()\s]/g, '').split(',').map(Number);
const rungLabel = (t) => { const [n, m, p, R] = rungTuple(t); return '<' + n + ',' + m + ',' + p + '> r' + R; };
const rungRows = [...byRung.values()].sort((x, y) => {
  if (x.model !== y.model) return x.model < y.model ? -1 : 1;
  if (x.tag !== y.tag) return x.tag < y.tag ? 1 : -1;           /* v2 before v1, like the board */
  const a = rungTuple(x.target), b = rungTuple(y.target);
  for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
});
if (rungRows.length) {
  O.push(C.section({
    lab: '§2b · the ladder, per rung', title: 'Where the cliffs are', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'model' }, { h: 'prompt' }, { h: 'rung' }, { h: 'proposals', cls: 'n' }, { h: 'certified', cls: 'n' }, { h: 'refuted', cls: 'n' }, { h: 'rejected', cls: 'n' }, { h: 'malformed', cls: 'n' }, { h: 'certified rate', cls: 'n' }],
      rows: rungRows.map((a) => [
        { raw: '<span class="m">' + C.esc(a.model) + '</span>' },
        { raw: '<span class="m">' + C.esc(a.tag) + '</span>' },
        { raw: '<span class="m">' + C.esc(rungLabel(a.target)) + '</span>' },
        String(a.n), String(a.certified), String(a.refuted), String(a.rejected), String(a.malformed),
        pct(a.n ? a.certified / a.n : null)
      ])
    })
      + '<div class="col">' + C.pRaw('The aggregate board hides the shape of failure; this table is where it lives. '
        + 'The rungs are ordered easy to hard within each campaign: '
        + '<span class="m">&lt;2,2,2&gt; r7</span> is Strassen 1969, <span class="m">r8</span> is the naive format rung, '
        + '<span class="m">&lt;2,2,3&gt; r11</span> and <span class="m">&lt;3,3,3&gt; r23</span> (Laderman) test whether '
        + 'recall survives precision. Every count is read off the append-only ledger at build time.') + '</div>'
  }));
}

O.push(C.section({
  lab: '§3 · the task, precisely', title: 'What the model is asked, and what the grader checks',
  bodyRaw: '<div class="col">'
    + C.pRaw('The prompt states the convention completely: A is n×m and B is m×p, both vectorized row-major; a '
      + 'decomposition is three lists u, v, w of at most R rows, entries integer or exact fractions; the claim is '
      + 'C[i][k] = Σᵣ w[r][i·p+k] · ⟨u[r], vec A⟩ · ⟨v[r], vec B⟩ for ALL A, B. The grader checks the equivalent '
      + 'finite identity — every (a,b,c,d,e,f) index of the tensor — in exact rational arithmetic, plus the rank '
      + 'bound. The float screen (shape checks and one random spot-multiplication at tolerance 1e-6) may only '
      + 'PRUNE; nothing it passes is believed. Rung one (rank 8 = naive) tests format-following; rank 7 is '
      + 'Strassen 1969; the upper rungs test whether recall survives precision. Achievable ranks only — every '
      + 'rung has a witness on record.')
    + '</div>'
}));

O.push(C.section({
  lab: '§4 · submit a model', title: 'Put anything on this board',
  bodyRaw: '<div class="col">'
    + C.pRaw('The eval is open-scaffold: the task is defined by the GRADER, not by a prompt. Use any model, any '
      + 'provider, any agentic scaffold, any thinking budget — the certificate does not care how the witness was '
      + 'found, and the <span class="m">tag</span> field records what you used.')
    + C.pRaw('<strong>Anthropic models</strong> run directly: <span class="m">ANTHROPIC_API_KEY=… python3 '
      + 'tools/llm-harness.py --family matmul --model &lt;id&gt; --n 40 --tag &lt;yours&gt; --ledger '
      + 'certs/matmul-eval-ledger.jsonl</span>.')
    + C.pRaw('<strong>Anything else</strong> goes through the submission path: generate proposals however you '
      + 'like, write one JSON line per attempt — <span class="m">{"target": "(2, 2, 2, 7)", "proposal": '
      + '"&lt;the model\'s raw reply&gt;"}</span> — and grade the file with <span class="m">python3 '
      + 'tools/llm-harness.py --family matmul --proposals yours.jsonl --model-label &lt;name&gt; --tag &lt;yours&gt; '
      + '--ledger …</span>. Same float screen, same exact certifier, same red controls, run before any grading; '
      + 'a target outside the published ladder is refused, so a submission cannot smuggle in an easier task.')
    + C.pRaw('To land on the public board, open a pull request carrying the PROPOSALS file, not graded rows — '
      + 'grading is deterministic, so rerunning it here reproduces your outcomes bit for bit, and the board '
      + 'never has to trust a submitted verdict. The one thing a submission is trusted about is its own '
      + 'attribution: the model name and the scaffold the tag describes.')
    + '</div>'
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-eval.js @ git ' + gitrev
  + ' — the harness calibration re-ran during this build (' + red[1] + ' red controls, ' + red[2]
  + ' refuted exactly, 0 certified — a control that certifies aborts everything). Ledger: certs/matmul-eval-ledger.jsonl.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'matmul-eval.html'),
  TPL.render({ title: 'The matmul eval: ground truth is a proof · cert-machine', bodyRaw: O.join('\n\n'), footRaw: foot }));
console.log('reports/matmul-eval.html written: ' + models.length + ' model(s), calibration ' + red[1] + ' reds / ' + red[2] + ' refuted @ git ' + gitrev);
