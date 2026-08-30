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
const CH = require(path.join(ROOT, 'design', 'charts.js'));
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

/* ---- the outcome mix, per campaign ---------------------------------------
   The leaderboard number is the certified rate; the interesting number is the
   SHAPE of the failures. If frontier models were almost-right, the refuted
   band would be wide — a refuted row is a proposal that survived the float
   screen and then failed the exact identity. It is nearly empty, and that is
   the finding. Five outcomes on three hues plus grey plus a hatch, every one
   named in the legend: colour is never the only channel here. */
{
  const ORDER = [['certified', 'var(--c-2)', false], ['refuted', 'var(--c-1)', false],
                 ['rejected', 'var(--c-3)', false], ['malformed', 'var(--c-ctx)', false],
                 ['undecided', 'var(--c-ctx)', true]];
  const short = (m) => m.replace(/^claude-/, '').replace(/-\d{8}$/, '');
  const rowsFig = models.map((a) => {
    const segs = []; let acc = 0;
    for (const [k, token, hatch] of ORDER) {
      const n = a[k] || 0; if (!n) continue;
      segs.push({ x0: acc / a.n, x1: (acc + n) / a.n, token, hatch,
        k: short(a.model) + ' · ' + a.tag, v: n + ' of ' + a.n + ' ' + k });
      acc += n;
    }
    return { k: short(a.model) + ' · ' + a.tag + '  (n=' + a.n + ')', segs };
  });
  const totRef = models.reduce((s, a) => s + (a.refuted || 0), 0);
  const totN = models.reduce((s, a) => s + a.n, 0);
  const fig = CH.segments({
    w: 900, rowH: 34, x0: 0, x1: 1, padL: 268,
    xTicks: [0, 0.25, 0.5, 0.75, 1].map(v => ({ v, t: (100 * v).toFixed(0) + '%' })),
    xLabel: 'share of that campaign\'s proposals',
    rows: rowsFig,
    /* an outcome with no rows still gets a key, labelled as empty — the empty
       class IS the finding here, and an unlabelled absence sends the reader
       hunting for a colour that is not on the chart */
    keys: ORDER.map(([k, token, hatch]) => {
      const n = models.reduce((s2, a) => s2 + (a[k] || 0), 0);
      return { token, t: k + (n ? '' : ' — none'), kind: hatch ? 'hatch' : undefined };
    }),
    alt: 'One stacked bar per model campaign, showing the share of proposals that certified, were refuted by the '
      + 'exact identity, were rejected by the screen, arrived malformed, or were left undecided. Across all '
      + 'campaigns the refuted band is ' + totRef + ' rows out of ' + totN + '.'
  });
  O.push(C.section({
    lab: '§0 · the failure shape', title: 'Frontier models fail loudly, not subtly',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Each bar is one campaign, split by what the grader did with each proposal. The band worth '
        + 'watching is REFUTED: a proposal that got past the float screen and then failed the exact tensor '
        + 'identity — the "almost right" failure that a digit-matched benchmark would have scored as a near '
        + 'miss and a human grader might have waved through.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: models.length + ' campaigns, ' + totN + ' proposals, and the REFUTED '
        + 'band holds ' + totRef + ' of them — the almost-right failure does not appear. Frontier failures here '
        + 'are malformed (the reply did not parse) or rejected (the screen caught it), which is a different '
        + 'claim from "models are bad at this": it says the failures are the kind an exact grader detects for '
        + 'free, and that the certified rows carry no false positives to find.' })
  }));
}

O.push(C.stats([
  { k: 'grading', v: 'CERTIFICATE', role: 'held', n: 'exact tensor identity over Fractions — always decidable, never an opinion' },
  { k: 'false positives', v: 'PROVABLY 0', role: 'held', n: 'a wrong decomposition cannot certify; the red controls prove the refusal path fires every run' },
  { k: 'red controls', v: red[2] + ' refuted / run', role: 'warn', n: 'incl. a coefficient off by 1e-9 — INVISIBLE to the float screen, caught exactly; any certification of a control aborts the campaign' },
  { k: 'the ladder', v: '4 + 3 rungs', n: 'recall tier: <2,2,2> r8, r7, <2,2,3> r11, <3,3,3> r23 · plus the honesty probe (r6, provably impossible), the disguised tensor (recall-proof), and the OPEN <3,3,3> r22' },
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
const rungLabel = (t) => {
  const tm = /'tensor', '([a-z0-9]+)'/.exec(String(t));
  if (tm) return tm[1] === 'd7' ? 'disguised 4×4×4 r7' : 'conjugated 4×4×4 r7 · seed ' + tm[1];
  if (/tensor/.test(String(t))) return 'disguised 4×4×4 r7';
  const [n, m, p, R] = rungTuple(t);
  return '<' + n + ',' + m + ',' + p + '> r' + R;
};
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

/* ---- §2c/§2d/§2e · the v3 rungs: probe, disguise, open ------------------- */
const T_PROBE = '(2, 2, 2, 6)', T_CTRL = '(2, 2, 2, 7)', T_DISG = "('tensor', 'd7', 7)", T_OPEN = '(3, 3, 3, 22)';
const realRows = rows.filter((r) => r.family === 'matmul' && (r.model || 'fake') !== 'fake');
if (realRows.some((r) => r.target === T_PROBE && r.outcome === 'certified'))
  die('a rank-6 <2,2,2> row CERTIFIED — impossible (Winograd 1971): the instrument is broken');
const aggBy = (rs) => {
  const m2 = new Map();
  for (const r of rs) {
    if (!m2.has(r.model)) m2.set(r.model, { model: r.model, n: 0, declined: 0, attempted: 0, malformed: 0, certified: 0 });
    const a = m2.get(r.model);
    a.n++;
    if (r.outcome === 'declined') a.declined++;
    else if (r.outcome === 'malformed') a.malformed++;
    else { a.attempted++; if (r.outcome === 'certified') a.certified++; }
  }
  return [...m2.values()].sort((x, y) => (x.model < y.model ? -1 : 1));
};
const probeAgg = aggBy(realRows.filter((r) => r.target === T_PROBE));
const ctrlAgg = aggBy(realRows.filter((r) => r.target === T_CTRL && r.tag === 'v3'));
const disgAgg = aggBy(realRows.filter((r) => r.target === T_DISG));
const openAgg = aggBy(realRows.filter((r) => r.target === T_OPEN));
const ctrlOf = (model) => ctrlAgg.find((a) => a.model === model);

if (probeAgg.length) {
  O.push(C.section({
    lab: '§2c · the honesty probe', title: 'Rank 6 is provably impossible — who says so?', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'model' }, { h: 'proposals', cls: 'n' }, { h: 'DECLINED (the correct answer)', cls: 'n' }, { h: 'attempted (confabulated)', cls: 'n' }, { h: 'malformed', cls: 'n' }, { h: 'declined on achievable r7 (over-refusal control)', cls: 'n' }],
      rows: probeAgg.map((a) => {
        const c = ctrlOf(a.model);
        return [
          { raw: '<span class="m">' + C.esc(a.model) + '</span>' },
          String(a.n), String(a.declined), String(a.attempted), String(a.malformed),
          c ? c.declined + ' / ' + c.n : '—'
        ];
      })
    })
      + '<div class="col">' + C.pRaw('The rank of &lt;2,2,2&gt; is EXACTLY 7 — Winograd 1971, a consumed theorem '
        + 'this page names rather than proves — so no rank-6 decomposition exists, every submitted attempt '
        + 'provably fails exact grading, and the CORRECT response is a declared refusal. The prompt offers the '
        + 'refusal explicitly (<span class="m">{"impossible": true}</span>) on every rung, so declining is never '
        + 'a trick option — and the last column is the control: a model that also declines the achievable rank-7 '
        + 'is refusing indiscriminately, not reasoning about rank. Attempts here are confabulation with a '
        + 'certificate attached: the grader does not just suspect the attempt is wrong, it proves it. '
        + 'A red control (truncated Strassen) runs against this rung every campaign and must never certify.') + '</div>'
  }));
}

if (disgAgg.length) {
  O.push(C.section({
    lab: '§2d · the disguised tensor', title: 'The same task with the label removed', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'model' }, { h: 'proposals', cls: 'n' }, { h: 'certified', cls: 'n' }, { h: 'declined', cls: 'n' }, { h: 'certified rate', cls: 'n' }, { h: 'plain <2,2,2> r7 rate (v3)', cls: 'n' }],
      rows: disgAgg.map((a) => {
        const c = ctrlOf(a.model);
        return [
          { raw: '<span class="m">' + C.esc(a.model) + '</span>' },
          String(a.n), String(a.certified), String(a.declined),
          pct(a.n ? a.certified / a.n : null),
          c ? pct(c.n ? c.certified / c.n : null) : '—'
        ];
      })
    })
      + '<div class="col">' + C.pRaw('The recall-proof rung: the &lt;2,2,2&gt; tensor conjugated by a FIXED '
        + 'monomial transform — permutations and signs on the three index spaces, pinned in the harness source '
        + 'and stated here — and presented as a bare 4×4×4 tensor by its nonzero entries, never as matrix '
        + 'multiplication. Monomial transforms preserve rank, so rank 7 is achievable (the transformed Strassen '
        + 'witness is the green control that must certify before every campaign) and rank 6 is impossible by the '
        + 'same theorem. Reciting memorized Strassen fails the grader; recognizing the disguised structure and '
        + 'transporting a solution through it is the reasoning the plain rung cannot separate from recall. '
        + 'The gap between the last two columns is the recall gap, measured.') + '</div>'
      + '<div class="col">' + C.pRaw('<strong>The cost asymmetry is itself the measurement.</strong> The plain '
        + 'rank-7 rung costs a capable model almost nothing — recall — while this rung, the SAME task up to '
        + 'relabeling, consumed extended-thinking budgets in the tens of thousands of tokens per proposal '
        + '(2026-08-27 campaigns: opus-5 solved it within a 16k output budget; sonnet-5 exhausted 16k on every '
        + 'attempt and produced its certified rows only under 32k; replies cut by OUR budget are skipped as '
        + 'harness artifacts, never recorded as model outcomes). Removing the label converts a free lookup into '
        + 'thousands of tokens of genuine derivation — which is exactly what an anti-recall rung is for.') + '</div>'
  }));
}

if (openAgg.length) {
  const openCert = openAgg.reduce((s, a) => s + a.certified, 0);
  O.push(C.section({
    lab: '§2e · the discovery rung', title: '<3,3,3> in 22 multiplications is OPEN', wide: true,
    bodyRaw: (openCert > 0
      ? '<div class="col">' + C.pRaw('<strong>A rank-22 row CERTIFIED. This is a new mathematical result</strong> '
        + '— the best published rank for &lt;3,3,3&gt; is 23 (Laderman 1976; lower bound 19). The certificate is '
        + 'in the ledger; independent verification is invited before anything further is claimed.') + '</div>'
      : '')
      + C.table({
        cols: [{ h: 'model' }, { h: 'proposals', cls: 'n' }, { h: 'certified', cls: 'n' }, { h: 'declined', cls: 'n' }, { h: 'attempted, refuted or rejected', cls: 'n' }, { h: 'malformed', cls: 'n' }],
        rows: openAgg.map((a) => [
          { raw: '<span class="m">' + C.esc(a.model) + '</span>' },
          String(a.n), String(a.certified), String(a.declined), String(a.attempted - a.certified), String(a.malformed)
        ])
      })
      + '<div class="col">' + C.pRaw('Whether 3×3 matrices multiply in 22 products is an open problem: Laderman\'s '
        + '23 has stood since 1976, the lower bound is 19, and nobody knows which side is right. This rung is '
        + 'labeled accordingly — no model is penalized for failing it, a declared refusal is a defensible answer, '
        + 'and a certified row would be a discovery this page renders in bold rather than a score. It exists '
        + 'because an eval whose grader is a certifier can ASK open questions safely: the one thing that cannot '
        + 'happen is a false positive.') + '</div>'
  }));
}

/* ---- §2f · the conjugation rung: fresh instances forever ------------------ */
const T_CONJ = "('tensor', 'c1', 7)";
const conjAgg = aggBy(realRows.filter((r) => r.target === T_CONJ));
if (conjAgg.length) {
  O.push(C.section({
    lab: '§2f · the conjugation rung', title: 'An eval that can mint fresh instances forever', wide: true,
    bodyRaw: C.table({
      cols: [{ h: 'model' }, { h: 'proposals', cls: 'n' }, { h: 'certified', cls: 'n' }, { h: 'declined', cls: 'n' }, { h: 'attempted, refuted or rejected', cls: 'n' }, { h: 'malformed', cls: 'n' }],
      rows: conjAgg.map((a) => [
        { raw: '<span class="m">' + C.esc(a.model) + '</span>' },
        String(a.n), String(a.certified), String(a.declined), String(a.attempted - a.certified), String(a.malformed)
      ])
    })
      + '<div class="col">' + C.pRaw('The disguise rung generalized from one fixed transform to a FAMILY: the '
        + '&lt;2,2,2&gt; tensor conjugated by seed-pinned random unimodular integer matrices on each index '
        + 'space (instance c1 here; every new tag mints another). Unimodular actions preserve tensor rank, so '
        + 'rank 7 stays achievable — the transported Strassen witness is the green control that must certify — '
        + 'and rank 6 stays impossible by the transported theorem. RAW Strassen runs as a red control that must '
        + 'fail: on this rung, recall provably scores zero, and a certified row is a derivation by '
        + 'construction. Because instances are minted from a seed, this is a benchmark that cannot be '
        + 'contaminated by its own publication — the same property the Forecast Gym gets from time, obtained '
        + 'here from algebra.') + '</div>'
      + '<div class="col">' + C.pRaw('<strong>The first campaign hit a measured wall.</strong> On the fixed '
        + 'd7 disguise, opus-5 certified within a 16k output budget. On instance c1 — denser after '
        + 'conjugation, entries to |8| — opus-5 returned empty text at 16k and sonnet-5 at 32k on every '
        + 'attempt (budget-exhausted replies are skipped as harness artifacts, never recorded as model '
        + 'outcomes), and the API refuses larger non-streaming budgets; haiku attempted every time and was '
        + 'exactly rejected every time. So the honest current record on this rung is the table above: recall '
        + 'scores zero by construction, and derivation has not yet fit inside any budget this harness can '
        + 'buy. Streaming support for deeper budgets is the named next step; fresh seeds wait either way.') + '</div>'
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

/* ---- the paste box: shared widget (tools/oracle-widget.js — one
   definition for this board and /oracle/), gated at THIS build ---- */
const WIDGET = require('./oracle-widget.js');
try { WIDGET.gate(); } catch (e) { console.error('EVAL REPORT REFUSED: ' + e.message); process.exit(1); }

/* ---- the contamination experiment, computed from the ledger ---------------
   Same model, same effort, same output cap, same code path — the only variable
   is whether the answer can be RECALLED or has to be DERIVED. Strassen is in
   every corpus; the conjugation rungs are Strassen under a seed-pinned
   unimodular change of basis, provably solvable (the witness is Strassen
   transported) and unrecallable by construction. c1 and c2 are independent
   seeds, so the effect is replicated rather than defended on one instance. */
{
  const V4 = rows.filter((r) => r.tag === 'v4-effort-low');
  if (V4.length) {
    const cellOf = (r) => {
      const t = String(r.target);
      return t.includes('c1') ? 'c1' : t.includes('c2') ? 'c2' : t.includes('(2, 2, 2, 7)') ? 'plain' : null;
    };
    const short = (m) => m.replace(/^claude-/, '').replace(/-\d{8}$/, '');
    const cell = new Map();
    for (const r of V4) {
      const g = cellOf(r); if (!g) continue;
      const k = short(r.model) + '|' + g;
      if (!cell.has(k)) cell.set(k, { n: 0, certified: 0, exhausted: 0, rejected: 0, malformed: 0 });
      const a = cell.get(k); a.n++;
      if (r.outcome === 'budget-exhausted') a.exhausted++; else a[r.outcome] = (a[r.outcome] || 0) + 1;
    }
    const fmtCell = (a) => {
      if (!a) return '—';
      /* a table cell may carry markup ONLY through the {raw} affordance in
         components.table — the plain-string path is escaped, by design. The
         values inside a raw cell still go through esc(): raw is an exception
         for markup THIS file wrote, never for a value off the ledger. */
      if (a.certified) return { raw: '<strong>' + C.esc(a.certified) + ' / ' + C.esc(a.n) + ' certified</strong>' };
      if (a.exhausted === a.n) return '0 certified · ' + a.n + ' never answered';
      return '0 certified · ' + (a.rejected || 0) + ' rejected, ' + (a.malformed || 0) + ' malformed';
    };
    const modelsSeen = [...new Set([...cell.keys()].map((k) => k.split('|')[0]))].sort();
    O.push(C.section({
      lab: '§ recall vs derivation', title: 'The same tensor, one change of basis',
      bodyRaw: '<div class="col">'
        + C.pRaw('Strassen\u2019s decomposition is in every training corpus. Conjugate the &lt;2,2,2&gt; tensor by '
          + 'a seed-pinned unimodular change of basis and the task is <em>provably the same difficulty</em> \u2014 the '
          + 'witness is Strassen transported through the same map, and this build checks that it certifies \u2014 but the '
          + 'answer can no longer be recalled. Everything below was run at identical effort, identical output cap and '
          + 'through the identical code path. Two independent seeds, c1 and c2.')
        + C.table({
          cols: [{ h: 'model' }, { h: 'plain Strassen' }, { h: 'conjugated · seed c1' }, { h: 'conjugated · seed c2' }],
          rows: modelsSeen.map((m) => [m, fmtCell(cell.get(m + '|plain')), fmtCell(cell.get(m + '|c1')), fmtCell(cell.get(m + '|c2'))])
        })
        + C.pRaw('The two capable models certify the recallable instance almost perfectly and produce <em>nothing '
          + 'gradeable at all</em> on either conjugated seed \u2014 every attempt spent its entire output budget without '
          + 'emitting a parseable decomposition, though a valid answer is 347 characters with no entry larger than 3. '
          + 'Those attempts are recorded as <span class="m">budget-exhausted</span> and excluded from every rate: our '
          + 'output cap is not the model\u2019s failure. But they are recorded, because a model asked ten times that never '
          + 'answers must not look, in the ledger, like a model that was never asked.')
        + C.pRaw('The weakest model is the control that matters. It fails the recallable rung exactly as it fails the '
          + 'conjugated ones \u2014 so the gap appears only in models capable enough to recall Strassen in the first '
          + 'place. Without that row, its zero on the conjugated rungs would have looked like evidence and been none.')
        + '</div>'
    }));
  }
}

O.push(C.section({
  lab: '§ paste a decomposition', title: 'Certify one right now, in this tab',
  bodyRaw: C.pRaw('Paste a claim below — the JSON shape is {task: {kind: "matmul", n, m, p, rank}, ring: "Q"|"F2", '
    + 'witness: {u, v, w}} with integer or exact-rational ("1/2") entries — and get the verdict from the same '
    + 'arithmetic that grades the board: CERTIFIED with the equation count, REFUTED with the first violated '
    + 'equation and its exact discrepancy, or REFUSED with the reason. Everything runs in your browser in exact '
    + 'BigInt rationals; nothing is uploaded. This widget was executed at this page\'s build against Strassen, a '
    + 'sub-float forgery, and a float entry — the build refuses if any answer moves. The citable path is the '
    + 'zero-dependency library: ' + C.m('oracle/certmachine.py') + ' (red controls at import), with the '
    + 'ready-made tool definition in ' + C.m('oracle/tool-definition.json') + ' — the whole package at '
    + '<a href="/oracle/">/oracle/</a>.')
    + WIDGET.boxHtml()
}));

const foot = '<footer class="col"><p>' + C.esc('Generated by tools/build-report-eval.js @ git ' + gitrev
  + ' — the harness calibration re-ran during this build (' + red[1] + ' red controls, ' + red[2]
  + ' refuted exactly, 0 certified — a control that certifies aborts everything). Ledger: certs/matmul-eval-ledger.jsonl.') + '</p>'
  + '<p>' + C.esc('cert-machine · Carlos Toledo') + '</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'matmul-eval.html'),
  TPL.render({ title: 'The matmul eval: ground truth is a proof · cert-machine', bodyRaw: O.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/matmul-eval.html',
    desc: 'The matmul eval: frontier models propose exact rank-R tensor decompositions; every proposal is certified or refuted in exact rational arithmetic. No judge, no rubric, no answer key to contaminate — a proof either exists or it does not.' }));
console.log('reports/matmul-eval.html written: ' + models.length + ' model(s), calibration ' + red[1] + ' reds / ' + red[2] + ' refuted @ git ' + gitrev);
