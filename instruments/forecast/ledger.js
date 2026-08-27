/* ledger.js — the prediction ledger: commit before, score after, exactly.
   instruments/forecast · cert-machine

   Append-only JSONL. A COMMIT row pins a forecast (interval + its
   coverage certificate) to a target time BEFORE the outcome exists; a
   SCORE row decides it afterward in exact rationals. The credibility
   design: nothing is ever rewritten or deleted — wrong forecasts are
   permanent exhibits, and that permanence is the product.

   Scoring: the Winkler interval score at miss-rate alpha,
       S = (hi - lo) + (2/alpha) * dist(y, [lo,hi])
   a proper scoring rule for central intervals: the score is uniquely
   optimized in expectation by reporting the true quantiles — honesty
   as the optimal policy, which is what makes this a reward channel a
   model cannot game. Computed in exact rationals, stored as strings.

   REFUSALS (each a red in the battery): a commit whose madeAt is not
   strictly before its targetTime (backdated); scoring before the
   target time (premature); scoring twice; a sealed commit whose
   revealed payload does not hash to the committed sha (tamper).

   Vocabulary rule (doctrine): rows here are FORECASTS. The word
   CERTIFIED refers only to the coverage theorem and the exactness of
   the accounting — never to the outcome.

   MIT licensed. Part of cert-machine.                                    */
'use strict';

const fs = require('fs');
const crypto = require('crypto');

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const canon = (o) => JSON.stringify(o, Object.keys(o).sort());

const rat = (x) => Array.isArray(x) ? [BigInt(x[0]), BigInt(x[1])] : [BigInt(x), 1n];
const sub = (a, b) => norm([a[0] * b[1] - b[0] * a[1], a[1] * b[1]]);
const add = (a, b) => norm([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const mul = (a, b) => norm([a[0] * b[0], a[1] * b[1]]);
const cmp = (a, b) => { const d = a[0] * b[1] - b[0] * a[1]; return d < 0n ? -1 : d > 0n ? 1 : 0; };
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { [a, b] = [b, a % b]; } return a; };
function norm(x) { let [n, d] = x; if (d < 0n) { n = -n; d = -d; } const g = gcd(n, d) || 1n; return [n / g, d / g]; }
const ratStr = (a) => a[1] === 1n ? String(a[0]) : String(a[0]) + '/' + String(a[1]);

function rows(ledgerPath) {
  if (!fs.existsSync(ledgerPath)) return [];
  return fs.readFileSync(ledgerPath, 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}
const append = (p, row) => fs.appendFileSync(p, JSON.stringify(row) + '\n');

/* commit(path, {id, domain, target, targetTime, madeAt, forecast, sealed})
   forecast: {lo, hi, alpha: [num,den], coverage, hypothesis, ...} */
function commit(ledgerPath, c) {
  for (const k of ['id', 'domain', 'target', 'targetTime', 'madeAt', 'forecast']) {
    if (c[k] === undefined) throw new Error('REFUSED: commit missing ' + k);
  }
  if (!(c.madeAt < c.targetTime)) {
    throw new Error('REFUSED: backdated commit — madeAt (' + c.madeAt + ') must be strictly before targetTime (' + c.targetTime + ')');
  }
  if (rows(ledgerPath).some((r) => r.type === 'commit' && r.id === c.id)) throw new Error('REFUSED: duplicate commit id ' + c.id);
  const payload = canon(c.forecast);
  const row = { type: 'commit', id: c.id, domain: c.domain, target: c.target,
    madeAt: c.madeAt, targetTime: c.targetTime, payloadSha256: sha256(payload),
    ...(c.sealed ? {} : { forecast: c.forecast }) };
  append(ledgerPath, row);
  return row;
}

/* score(path, id, outcome, {at, revealedForecast}) — outcome: int or [num,den] */
function score(ledgerPath, id, outcome, opts) {
  const all = rows(ledgerPath);
  const c = all.find((r) => r.type === 'commit' && r.id === id);
  if (!c) throw new Error('REFUSED: no commit with id ' + id);
  if (all.some((r) => r.type === 'score' && r.id === id)) throw new Error('REFUSED: ' + id + ' is already scored — the ledger never rescores');
  const at = opts && opts.at;
  if (at === undefined) throw new Error('REFUSED: score needs an explicit at time');
  if (at < c.targetTime) throw new Error('REFUSED: premature scoring — at (' + at + ') is before targetTime (' + c.targetTime + ')');
  let f = c.forecast;
  if (!f) {
    f = opts && opts.revealedForecast;
    if (!f) throw new Error('REFUSED: sealed commit needs revealedForecast');
    if (sha256(canon(f)) !== c.payloadSha256) throw new Error('REFUSED: revealed payload does not hash to the committed sha — tampered');
  }
  const lo = rat(f.lo), hi = rat(f.hi), y = rat(outcome);
  const [aN, aD] = f.alpha.map(BigInt);
  const width = sub(hi, lo);
  const below = cmp(y, lo) < 0 ? sub(lo, y) : [0n, 1n];
  const above = cmp(y, hi) > 0 ? sub(y, hi) : [0n, 1n];
  const penalty = mul([2n * aD, aN], add(below, above));      /* (2/alpha) * dist */
  const s = add(width, penalty);
  const row = { type: 'score', id, at, outcome, covered: cmp(lo, y) <= 0 && cmp(y, hi) <= 0,
    winkler: ratStr(s), width: ratStr(width), penalty: ratStr(penalty),
    rule: 'Winkler interval score at alpha ' + f.alpha[0] + '/' + f.alpha[1] + ', exact rationals' };
  append(ledgerPath, row);
  return row;
}

/* the lifetime record, recomputed exactly from the ledger — the audit side */
function record(ledgerPath) {
  const all = rows(ledgerPath);
  const scores = all.filter((r) => r.type === 'score');
  return { commits: all.filter((r) => r.type === 'commit').length,
    scored: scores.length, covered: scores.filter((s) => s.covered).length };
}

module.exports = { commit, score, record, rows };
