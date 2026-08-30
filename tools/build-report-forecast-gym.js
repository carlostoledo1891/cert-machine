#!/usr/bin/env node
/* build-report-forecast-gym.js — generate reports/forecast-gym.html: the
   contamination-impossible forecasting eval.

   Gates, every build:
     1. instruments/forecast/battery.js re-runs — coverage theorem by exact
        enumeration, hand-computed Winkler, admission tail, 5 reds fired —
        or the page refuses.
     2. BOTH ledgers (the gym's and the SkyForecast product ledger) are
        re-verified row by row with this builder's OWN rational arithmetic:
        every commit re-hashed (payload sha must match), every commit
        madeAt strictly before targetTime, every score's Winkler recomputed
        from the committed interval and the outcome and compared string-
        exact, no id scored twice. A deviation refuses the page.
     3. The admission board is recomputed via instruments/forecast/
        admission.js; the page renders only what that recount says.

   usage: node tools/build-report-forecast-gym.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('FORECAST GYM REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- gate 1: the instrument battery -------------------------------------- */
const bat = cp.spawnSync('node', ['instruments/forecast/battery.js'], { cwd: ROOT });
const bm = /ALL PASS: (\d+) checks, (\d+) reds fired/.exec(String(bat.stdout));
if (bat.status !== 0 || !bm) die('the forecast battery did not pass');
const batChecks = bm[1], batReds = bm[2];

/* ---- gate 2: both ledgers re-verified with independent arithmetic --------- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
const norm = ([n, d]) => { if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; };
const ratStr = ([n, d]) => d === 1n ? String(n) : String(n) + '/' + String(d);
const rat = (x) => Array.isArray(x) ? [BigInt(x[0]), BigInt(x[1])] : [BigInt(x), 1n];
function winklerRecount(f, outcome) {
  const [lo, hi, y] = [rat(f.lo), rat(f.hi), rat(outcome)];
  const [aN, aD] = f.alpha.map(BigInt);
  const cmp = (a, b) => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0n ? -1 : d > 0n ? 1 : 0; };
  const sub = (a, b) => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
  const width = sub(hi, lo);
  const below = cmp(y, lo) < 0 ? sub(lo, y) : [0n, 1n];
  const above = cmp(y, hi) > 0 ? sub(y, hi) : [0n, 1n];
  const dist = norm([below[0] * above[1] + above[0] * below[1], below[1] * above[1]]);
  const pen = norm([2n * aD * dist[0], aN * dist[1]]);
  return ratStr(norm([width[0] * pen[1] + pen[0] * width[1], width[1] * pen[1]]));
}
const canon = (o) => JSON.stringify(o, Object.keys(o).sort());
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
function verifyLedger(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) die('missing ledger ' + rel);
  const rows = fs.readFileSync(p, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  const commits = new Map(), scored = new Set();
  for (const r of rows) {
    if (r.type === 'commit') {
      if (commits.has(r.id)) die(rel + ': duplicate commit ' + r.id);
      if (!(r.madeAt < r.targetTime)) die(rel + ': backdated commit ' + r.id);
      if (r.forecast && sha256(canon(r.forecast)) !== r.payloadSha256) die(rel + ': payload sha mismatch on ' + r.id);
      commits.set(r.id, r);
    } else if (r.type === 'score') {
      if (scored.has(r.id)) die(rel + ': ' + r.id + ' scored twice');
      const c = commits.get(r.id);
      if (!c) die(rel + ': score without commit ' + r.id);
      if (r.at < c.targetTime) die(rel + ': premature score on ' + r.id);
      if (c.forecast && winklerRecount(c.forecast, r.outcome) !== r.winkler)
        die(rel + ': Winkler recount mismatch on ' + r.id + ' — got ' + winklerRecount(c.forecast, r.outcome) + ', ledger says ' + r.winkler);
      scored.add(r.id);
    } else die(rel + ': unknown row type ' + r.type);
  }
  return { rows, commits, scored };
}
const gym = verifyLedger('certs/forecast-gym-ledger.jsonl');
const product = verifyLedger('certs/skyaudit-forecast-ledger.jsonl');
if (gym.commits.size === 0) die('the gym ledger holds no commits — commit baselines first');

/* ---- gate 3: the board, recomputed --------------------------------------- */
const { board, PROPOSERS, auditAdmissionHistory, admissionGate } = require(path.join(ROOT, 'tools', 'forecast-gym.js'));
const B0 = board();

/* ---- gate 4: the prune rule held HISTORICALLY, not merely in the code -----
   The admission gate is code, and code is only as good as the next tool that
   forgets to call it — which is exactly what happened: the rule was enforced
   for the three house proposers and NOT for the frontier-model campaign, so a
   pruned model could be queried and committed. Fixing the caller is not enough
   to trust the record. This gate asks the record itself:

       no commit exists from a proposer that was already DEADMITTED at the
       instant that commit was made.

   Every commit is replayed against the board as of its own madeAt — the scores
   that had settled by then and nothing later. And because a gate that cannot
   fail is decoration, the RED below builds a ledger that violates the invariant
   on purpose and requires the audit to catch it before the real one is
   trusted. */
{
  const os = require('os');
  const dirty = path.join(os.tmpdir(), 'gym-admission-red-' + process.pid + '.jsonl');
  const w = (o) => fs.appendFileSync(dirty, JSON.stringify(o) + '\n');
  const fc = { lo: 1, hi: 2, alpha: [1, 6], coverage: [5, 6], method: 'red control' };
  /* two scored misses against a 5/6 claim -> exact tail 1/36 <= 1/20 -> DEADMITTED */
  w({ type: 'commit', id: 'redmodel:nyc:2026-01-01:flights', domain: 'gym/red', target: 'flights',
      madeAt: 100, targetTime: 200, payloadSha256: 'x', forecast: fc });
  w({ type: 'commit', id: 'redmodel:nyc:2026-01-02:flights', domain: 'gym/red', target: 'flights',
      madeAt: 101, targetTime: 201, payloadSha256: 'x', forecast: fc });
  w({ type: 'score', id: 'redmodel:nyc:2026-01-01:flights', at: 300, outcome: 99, covered: false, winkler: '1' });
  w({ type: 'score', id: 'redmodel:nyc:2026-01-02:flights', at: 301, outcome: 99, covered: false, winkler: '1' });
  /* ...and then a commit made AFTER the prune. This is the row that must be caught. */
  w({ type: 'commit', id: 'redmodel:nyc:2026-01-09:flights', domain: 'gym/red', target: 'flights',
      madeAt: 400, targetTime: 500, payloadSha256: 'x', forecast: fc });
  const red = auditAdmissionHistory(dirty);
  fs.unlinkSync(dirty);
  if (red.violations.length !== 1 || red.violations[0].id !== 'redmodel:nyc:2026-01-09:flights')
    die('the admission-history audit did NOT catch a deliberately corrupt ledger — the gate is vacuous '
        + '(caught ' + red.violations.length + ')');
  if (red.violations[0].tail !== '1/36')
    die('the red control was caught with the wrong exact tail: ' + red.violations[0].tail + ' (expected 1/36)');
}
const ADMIT_AUDIT = auditAdmissionHistory();
if (ADMIT_AUDIT.violations.length)
  die('the gym ledger contains ' + ADMIT_AUDIT.violations.length + ' commit(s) made by an already-DEADMITTED '
      + 'proposer: ' + ADMIT_AUDIT.violations.map((v) => v.id + ' (tail ' + v.tail + ')').join(', '));
const meanW = (list) => {
  if (!list.length) return null;
  let n = 0n, d = 1n;
  for (const s of list) { const [a, b] = s.includes('/') ? s.split('/').map(BigInt) : [BigInt(s), 1n]; n = n * b + a * d; d = d * b; }
  return ratStr(norm([n, d * BigInt(1)])) + (list.length > 1 ? ' / ' + list.length + ' = ' + ratStr(norm([n, d * BigInt(list.length)])) : '');
};
const fmtT = (t) => new Date(t * 1000).toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

const PROPOSER_LABEL = {
  conformal: 'the house forecaster; claims only its theorem',
  persistence: 'forced dumb baseline; overconfident by design',
  range: 'the hedger; wide and safe, and pays for it'
};
const MODEL_LABEL = 'frontier model — campaign v1: one-shot slate; every model queried before any commit was published';
const modelProposers = Object.keys(B0).filter((n) => !(n in PROPOSER_LABEL));

const totScored = Object.values(B0).reduce((s, r) => s + r.scored, 0);

/* ---- the page ------------------------------------------------------------ */
const B = [];
B.push(C.header({
  eyebrow: 'cert-machine · the eval shelf · forecasting',
  title: 'The Forecast Gym: the test set that cannot leak',
  deck: 'A forecasting eval in which contamination is impossible by construction, because the outcomes do not '
    + 'exist yet. Every forecast is committed to an append-only ledger — sha256, timestamp strictly before the '
    + 'target — and scored afterward with a proper score in exact rationals, so honesty is the optimal policy '
    + 'and the reward cannot be gamed. Admission is prune-only: a forecaster exactly-improbably below its own '
    + 'claimed coverage is deadmitted, with the exact binomial tail as the certificate. Forecasts are proposals '
    + 'here, never verdicts — this page never confuses the two.'
}));

B.push(C.tldr({
  findingRaw: 'Hindcast benchmarks cannot prove a model has not seen the outcome; the only outcome provably '
    + 'unseen is one that did not exist when the forecast was committed. The Gym makes temporal hygiene a '
    + 'checkable property: ' + C.m('git log certs/forecast-gym-ledger.jsonl') + ' dates every sha before its target.',
  mechanismRaw: 'commit-before / score-after on an append-only ledger (backdating, premature scoring, rescoring '
    + 'and tampering are refused — each a red control); Winkler interval score in exact rationals; prune-only '
    + 'admission by exact binomial tail at a stated bar of 1/20.',
  checkRaw: C.m('node instruments/forecast/battery.js') + ' — ' + batChecks + ' checks, ' + batReds
    + ' reds that must fire, in seconds.'
}));

/* ---- the commitments, before any of them can be scored -------------------
   Every row here is sha-pinned to a day that has not happened. What can be
   read TODAY is not who is right — nothing is scored — but how much risk each
   proposer took, which is the width of its interval. The gym exists because
   that width is the thing an admission rule can price. */
{
  const commits = gym.rows.filter(r => r.type === 'commit');
  const dayOf = r => r.id.split(':')[2];
  const propOf = r => r.domain.split('/').pop();
  const days = [...new Set(commits.map(dayOf))].sort();
  const pick = days.map(d => ({ d, n: commits.filter(r => dayOf(r) === d && r.target === 'flights').length }))
    .sort((a, b) => b.n - a.n || (a.d < b.d ? -1 : 1))[0];
  const set = commits.filter(r => dayOf(r) === pick.d && r.target === 'flights')
    .sort((a, b) => (b.forecast.hi - b.forecast.lo) - (a.forecast.hi - a.forecast.lo));
  const lo = Math.min.apply(null, set.map(r => r.forecast.lo));
  const hi = Math.max.apply(null, set.map(r => r.forecast.hi));
  const pad = (hi - lo) * 0.08;
  const short = m => m.replace(/^claude-/, '').replace(/-\d{8}$/, '');
  const fig = CH.intervals({
    w: 900, rowH: 40, x0: lo - pad, x1: hi + pad, padL: 190, padR: 118,
    xTicks: [lo, Math.round((lo + hi) / 2), hi].map(v => ({ v, t: String(v) })),
    xLabel: 'flights the audit will count on ' + pick.d + ' — committed before the day existed',
    rows: set.map(r => {
      const w = r.forecast.hi - r.forecast.lo;
      return w === 0
        ? { k: short(propOf(r)), point: r.forecast.lo, token: 'var(--c-3)',
            v: 'point forecast ' + r.forecast.lo + ' — width 0', note: 'width 0' }
        : { k: short(propOf(r)), lo: r.forecast.lo, hi: r.forecast.hi, token: 'var(--c-1)',
            v: '[' + r.forecast.lo + ', ' + r.forecast.hi + '] — width ' + w, note: 'width ' + w };
    }),
    keys: [{ token: 'var(--c-1)', t: 'committed interval' }, { token: 'var(--c-3)', t: 'point forecast (width 0)' }],
    alt: set.length + ' forecasters, each committed to an interval for the same future day before it happened. '
      + 'The widest spans ' + (hi - lo) + ' flights; one is a bare point with no width at all.'
  });
  B.push(C.section({
    lab: '§0 · the commitments', title: 'What each forecaster risked, before the day existed',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.pRaw('Nothing on this chart is scored — that is the point of it. Every interval was sha-pinned before '
        + 'its target day existed, so the only thing visible today is how much each proposer risked: a narrow '
        + 'interval scores better when it contains the outcome and worse when it does not.')
      + '</div>'
      + C.figure({ svgRaw: fig, caption: 'The ' + set.length + ' commitments for ' + pick.d + ' flights, widest '
        + 'first. Widths run from ' + Math.min.apply(null, set.map(r => r.forecast.hi - r.forecast.lo)) + ' to '
        + Math.max.apply(null, set.map(r => r.forecast.hi - r.forecast.lo)) + ' flights across the same future. '
        + 'The zero-width row is the persistence baseline, built to be pruned in public. Nothing here is an '
        + 'opinion about who is right; the day decides that, and the exact Winkler score and the admission rule '
        + 'do the rest without anyone\'s judgement entering.' })
  }));
}

B.push(C.stats([
  { k: 'the test set', v: 'the future', role: 'held', n: 'outcomes that do not exist at commit time — the one split no training corpus can contain' },
  { k: 'commits on the ledger', v: String(gym.commits.size + product.commits.size), role: 'held', n: gym.commits.size + ' gym + ' + product.commits.size + ' SkyForecast product commits, every one sha-pinned before its target; ' + (totScored + product.scored.size) + ' scored so far' },
  { k: 'the score', v: 'proper', n: 'Winkler interval score, exact rationals: uniquely optimized in expectation by the true quantiles — hedging pays in width, overconfidence pays in distance' },
  { k: 'admission', v: 'prune-only', n: 'a proposer below its claimed coverage is DEADMITTED with the exact binomial tail as certificate; admission is lost by record, never by opinion' },
  { k: 'reds at this build', v: batReds, role: 'held', n: 'backdated commit · premature score · rescore · tampered reveal · the admission rule itself — each must fire or this page does not exist' },
  modelProposers.length
    ? { k: 'models on the board', v: String(modelProposers.length), role: 'held', n: 'frontier models entered campaign v1 with sha-pinned slates; scoring lands as their target days do — a campaign is operator-gated spend, like every eval here' }
    : { k: 'models graded', v: '0', role: 'warn', n: 'no model has run yet — the board below holds the house baselines; a campaign is operator-gated spend, like every eval here' }
]));

B.push(C.section({
  lab: '§1 · the leak', title: 'Why every hindcast benchmark is an answer key',
  bodyRaw: [
    C.p('Evaluate a model\'s forecasting on past data and you are asking a question the training corpus may '
      + 'already answer. Cutoff dates are self-reported, contamination audits are heuristic, and a re-scraped '
      + 'benchmark leaks the moment it is published. No split protocol can prove a negative about what a model '
      + 'has seen.'),
    C.pRaw('The Gym inverts the burden. A forecast is committed — content-addressed by sha256, timestamped — '
      + 'while the outcome is still in the future, so "the model saw the answer" is not improbable but '
      + '<em>impossible</em>: the answer did not exist. Hygiene is then a property a stranger can check '
      + 'mechanically: the ledger is append-only in a public git history, so every commit carries two '
      + 'independent timestamps (the row\'s, and git\'s) that must both precede the target day. The same '
      + 'discipline that removes the answer key from ' + '<a href="/reports/matmul-eval.html">the matmul '
      + 'eval</a> — there the reference is a proof, here the reference is the future.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · the mechanism', title: 'Commit before, score after, never rewrite',
  bodyRaw: [
    C.pRaw('A commit row pins ' + C.m('{id, target, madeAt, targetTime, sha256(forecast)}') + ' with '
      + C.m('madeAt < targetTime') + ' enforced — a backdated commit is refused, a premature score is refused, '
      + 'a second score of the same id is refused, and a sealed commit whose revealed payload does not hash to '
      + 'its committed sha is refused as tampered. Each refusal is a red control in the battery: the mechanism '
      + 'is proved able to say no before it is trusted to say yes.'),
    C.pRaw('<strong>Sealed commits</strong> are how third-party proposers enter asynchronously without reading '
      + 'each other: the ledger shows only the sha until scoring, when the payload is revealed and verified '
      + 'against it. A house-run model campaign uses the batch form of the same honesty: every model is queried '
      + 'before any commit is published, and the shared batch timestamp records it.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the score', title: 'A reward that makes honesty the optimal policy',
  bodyRaw: [
    C.pRaw('Every scored forecast pays the Winkler interval score at its own committed miss-rate α: '
      + C.m('width + (2/α) · distance-outside') + ', computed in exact rationals and stored as a string. The '
      + 'score is strictly proper for central intervals — its expectation is uniquely minimized by reporting '
      + 'the true quantiles — so there is no strategy against it: hedge wide and the width term pays, claim '
      + 'narrow and the miss term pays. From the battery\'s hand-computed row: forecast [10, 20] at α = 1/4 '
      + 'scores 10 when the outcome is 15, and 10 + 8·6 = 58 when the outcome is 26.'),
    C.pRaw('This is the probabilistic sibling of <a href="/oracle/">certify()</a>: there, a claim is decided '
      + 'and the reward cannot pay a false claim; here, a forecast is scored and the reward cannot pay a '
      + 'dishonest one better than an honest one — in expectation, which is the strongest thing a probabilistic '
      + 'channel can promise. Both channels share the discipline: append-only ledgers, red controls first, '
      + 'exact arithmetic everywhere a number is decided.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§4 · admission', title: 'Prune-only: below your claimed coverage, you stop being admitted',
  bodyRaw: [
    C.pRaw('Doctrine: prediction enters as a proposer, never an authority, and a proposer that misses its '
      + 'certified coverage stops being admitted until recalibrated. The Gym computes that rule instead of '
      + 'judging it. A proposer claiming coverage p with k of m scored forecasts covered is held to the exact '
      + 'binomial tail ' + C.m('P[X ≤ k], X ~ Binomial(m, p)') + ' — BigInt rationals, no float — and is '
      + 'DEADMITTED when the tail falls to 1/20 or below. The verdict reads: "if the claimed coverage were '
      + 'true, a record this bad or worse has this exact probability." The tail is the certificate; the bar is '
      + 'a stated convention; only under-coverage prunes, because over-coverage is the conservative direction '
      + 'and the score already prices it.'),
    C.p('A deadmitted proposer\'s new commits are refused by the gym runner, and its deadmission stands in the '
      + 'ledger permanently — wrong forecasts are exhibits here, not embarrassments. The forced dumb baseline '
      + 'below exists to be pruned in public: the mechanism firing on schedule is the demonstration.')
  ].join('\n')
}));

/* the board */
const boardRows = Object.entries(B0).map(([name, r]) => [
  { raw: '<span class="m">' + C.esc(name) + '</span>' },
  PROPOSER_LABEL[name] || MODEL_LABEL,
  r.claim ? r.claim : '—',
  String(r.commits),
  r.scored ? r.covered + '/' + r.scored : '—',
  r.scored ? meanW(r.winkler) : '—',
  r.scored ? r.admission.tailStr : '—',
  { raw: r.admission.status === 'DEADMITTED' ? C.tag('DEADMITTED', 'open') : C.tag('ADMITTED', 'held') }
]);
const outstanding = [...gym.commits.values()].filter((c) => !gym.scored.has(c.id))
  .sort((a, b) => a.targetTime - b.targetTime || (a.id < b.id ? -1 : 1));
B.push(C.section({
  lab: '§5 · the board', title: 'The standing record, recounted from the ledger at this build', wide: true,
  bodyRaw: '<div class="col">'
    + C.pRaw('Pack v1 is SkyAudit\'s pinned day series: two quantities per day (total rotorcraft flights, '
      + 'E-FLYABLE count under the pinned spec/rule pair), forecast for named future days. Three house '
      + 'proposers run — deterministic functions of the pinned series, so every commit is rerunnable. '
      + (totScored === 0 ? 'No gym forecast has been scored yet — the first targets are still in the future; '
        + 'the outstanding commits below are the record aging in public.' : totScored + ' gym forecasts scored so far.')
      + ' ' + (modelProposers.length
        ? modelProposers.length + ' frontier models are on the board via campaign v1 (' + C.m(modelProposers.join(', '))
          + '): one-shot slates against the sha-named context pack, coverage claims chosen by each model, '
          + 'queried in batch before any commit was published.'
        : 'No model has run: model campaigns enter on the operator\'s word and are graded by exactly this machinery.'))
    + '</div>'
    + C.table({
      cols: [{ h: 'proposer' }, { h: 'what it is' }, { h: 'claims' }, { h: 'commits' }, { h: 'covered' }, { h: 'Winkler (sum / n = mean)' }, { h: 'exact tail' }, { h: 'admission' }],
      rows: boardRows
    })
    + '<div class="col">' + C.pRaw('<strong>Outstanding commits</strong> — sha-pinned, waiting for their day to '
      + 'exist. Lead time is on the record: a forecast committed minutes before midnight is worth less than one '
      + 'committed days out, and the ledger shows which is which.') + '</div>'
    + C.table({
      cols: [{ h: 'id' }, { h: 'interval' }, { h: 'claims' }, { h: 'committed at' }, { h: 'target closes' }, { h: 'sha256 (prefix)' }],
      rows: outstanding.map((c) => [
        { raw: '<span class="m">' + C.esc(c.id) + '</span>' },
        '[' + c.forecast.lo + ', ' + c.forecast.hi + ']',
        c.forecast.coverage.join('/'),
        fmtT(c.madeAt), fmtT(c.targetTime),
        { raw: '<span class="m">' + c.payloadSha256.slice(0, 16) + '</span>' }
      ])
    })
    + '<div class="col">' + C.pRaw('The SkyForecast product ledger — same instruments, the consumer-facing '
      + 'card on <a href="/apps/skyaudit/">SkyAudit</a> — is re-verified by this build too: '
      + product.commits.size + ' commits, ' + product.scored.size + ' scored, every Winkler recounted. One '
      + 'mechanism, two surfaces.') + '</div>'
}));

B.push(C.note({ lab: 'what a prune has to mean', bodyRaw:
  'A pruned proposer that can still commit is not pruned. When claude-haiku-4.5 was DEADMITTED on the first '
  + 'day of scoring, the rule was enforced in exactly one place — the loop that commits the three house '
  + 'proposers — and NOT in the frontier-model campaign, which queried its model list and wrote to the ledger '
  + 'directly. The prune held for the baselines and quietly did not hold for the models it was written for. '
  + 'That is now one gate both paths call, and a pruned proposer is never even queried: enforcing a prune only '
  + 'at the ledger means paying for the call the rule already forbids. The stronger check is the one that does '
  + 'not depend on any caller — every commit on this ledger is replayed against the board as of the instant it '
  + 'was made, and a single row from an already-pruned proposer refuses this page.' }));

B.push(C.section({
  lab: '§6 · enter', title: 'How a model (or you) gets on the board',
  bodyRaw: [
    C.p('A proposer is anything that emits interval forecasts with a claimed coverage for the named future '
      + 'targets. Submissions are sealed commits: the sha enters the public ledger before the target day, the '
      + 'payload is revealed and hash-verified at scoring, attribution required. Scoring and admission are '
      + 'deterministic, so a submission cannot be argued with — only outperformed.'),
    C.pRaw(C.m('node tools/forecast-gym.js record') + ' prints the board; '
      + C.m('node instruments/forecast/battery.js') + ' proves the machinery on your machine first, reds '
      + 'included. Model campaigns through the same path are spend and run on the operator\'s word, like '
      + 'every campaign on <a href="/reports/matmul-eval.html">the eval shelf</a>.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-forecast-gym.js @ git ' + git + '. Gates '
  + 'at this build: the forecast battery (' + batChecks + ' checks, ' + batReds + ' reds fired), both ledgers '
  + 're-verified row by row with this builder\'s own arithmetic (payload shas re-hashed, every Winkler '
  + 'recounted string-exact, commit-before/score-after re-checked), the admission board recomputed from '
  + 'the exact binomial tail, and every one of the ' + ADMIT_AUDIT.commits + ' commits replayed against the '
  + 'board AS OF ITS OWN madeAt to prove none was made by an already-pruned proposer — a gate first run against '
  + 'a deliberately corrupt ledger, which it caught with the exact tail 1/36, so it is known not to be vacuous. '
  + 'A deviation anywhere refuses the page. Forecasts on this page are proposals, never verdicts.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'forecast-gym.html'),
  TPL.render({ title: 'The Forecast Gym · cert-machine', bodyRaw: B.join('\n\n') + CH.script(), footRaw: foot, path: '/reports/forecast-gym.html',
    desc: 'The Forecast Gym: a forecasting eval where contamination is impossible by construction — forecasts sha-committed before their outcomes exist, scored by a proper score in exact rationals, admission prune-only with an exact binomial certificate.' }));
console.log('reports/forecast-gym.html written: ' + gym.commits.size + ' gym commits (' + totScored
  + ' scored), ' + product.commits.size + ' product commits, battery ' + batChecks + '/' + batReds + ' @ git ' + git);
