#!/usr/bin/env node
/* record-mfg-two-models.js — certs/mfg-two-models.json: what two models claimed about the stationary quadratic
   mean-field game on the torus, decided here from their own numbers.

   THE CANDIDATES AND THE PROOFS ARE NOT OURS, with one exception said below. GPT-6.2 Astra and Claude Fable 5.2 each
   answered one identical message (corpus/mfg-two-models/message.md) and then read each other's mathematics
   (cross-read-instruction.md). This tool decides, with labs/mfg/box.js and with legacy/core/mfg/validate.js as a second
   decider at single points:

     claims      every list of candidate equilibria each model submitted, AS SUBMITTED (nothing is polished), and the
                 seven candidates built in this repository's own session from the two models' count at A = 0
     uniqueness  GPT-6.2 Astra's uniqueness argument, its last inequality evaluated exactly per rectangle
                 (labs/mfg/uniqueness.py), and what it does to the published map (certs/mfg-regime-map.json)
     folds       Astra's fold formula against Fable's fold table
     readings    who read which proof and what each reading found (corpus/mfg-two-models/readings.json, by hand)

   A WORD ABOUT POSITIVITY. The certifier proves m > 0 over each ball by a grid bound, and refuses a density that
   comes close to zero. Both models prove (and it is three lines: the flux sigma m' + m u' is constant, (m e^{2u})' is
   that constant times e^{2u}, periodicity makes it zero) that every real periodic solution with mean density one is
   positive. An enclosed solution is such a solution. So each row carries two words: `word` takes positivity from that
   lemma, `wordWithTheGridBound` asks the certifier's own bound as well. The page says which it states.

   usage: node tools/record-mfg-two-models.js --write    decide everything and write the record (minutes)
          node tools/record-mfg-two-models.js --check    pins, the uniqueness instrument and a sample of claims
                                                         re-decided and compared with the record (seconds)      MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const M = require(path.join(ROOT, 'legacy/core/mfg/mfg1d.js'));
const B = require(path.join(ROOT, 'labs/mfg/box.js'));
const V = require(path.join(ROOT, 'legacy/core/mfg/validate.js'));
const I = require(path.join(ROOT, 'legacy/core/interval/interval.js'));

const OUT = 'certs/mfg-two-models.json';
const DIR = 'corpus/mfg-two-models';
const NU = 1.02, SIGMA = 0.5;
const sha = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const INPUTS = ['message.md', 'cross-read-instruction.md', 'astra-claims.json', 'fable-claims.json', 'control-room-seven-claims.json',
  'astra-report.tex', 'astra-cross-read.txt', 'fable-proofs.md', 'fable-folds.csv', 'readings.json'].map((f) => DIR + '/' + f);
const INSTRUMENTS = ['labs/mfg/box.js', 'labs/mfg/uniqueness.py', 'legacy/core/mfg/validate.js', 'legacy/core/mfg/mfg1d.js',
  'legacy/core/interval/interval.js', 'certs/mfg-regime-map.json'];
const SOURCES = [['astra', 'astra-claims.json'], ['fable', 'fable-claims.json'], ['session', 'control-room-seven-claims.json']];
/* the claims re-decided at every --check: single points, at most 64 modes, seconds each */
const SAMPLE = { astra: ['near-first-fold'], fable: ['three_nearfold_A05', 'three_nearfold_A12'] };

const pack = (q, N) => { const x = new Float64Array(2 * N + 1); x[0] = q.rho; for (let k = 1; k <= N; k++) { x[k] = q.a[k - 1]; x[N + k] = q.b[k - 1]; } return x; };
const thin = (cl) => cl.c[0] === cl.c[1] && cl.A[0] === cl.A[1];

/* an UPPER bound on the distance of two predictors over the whole box (box.js's separationBox is the lower one) */
function distUpper(v1, v2, N) {
  let s = I.mag(I.sub(v1.rho, v2.rho)), nk = 1;
  for (let k = 1; k <= N; k++) {
    nk = I.nextUp(nk * NU);
    s = I.nextUp(s + I.nextUp(2 * nk * I.mag(I.sub(v1.p[k], v2.p[k]))));
    s = I.nextUp(s + I.nextUp(2 * nk * I.mag(I.sub(v1.b[k], v2.b[k]))));
  }
  return s;
}
/* is the ball of radius R around this certificate's predictor one in which the exact solution is unique? The radii
   polynomial with the certificate's own upper bounds, rounded up: p(R) < 0 and Z1 + Z2 R < 1. */
function uniqueWithin(ct, R) {
  if (!(R >= ct.r)) return false;
  const up = I.nextUp;
  const p = up(up(up(0.5 * ct.Z2) * up(R * R)) + up(ct.Y0 - I.nextDown(I.nextDown(1 - ct.Z1) * R)));
  return p < 0 && up(ct.Z1 + up(ct.Z2 * R)) < 1;
}

function decide(cl) {
  const N = cl.N, k = cl.candidates.length;
  const box = { N, sigma: [SIGMA, SIGMA], c: cl.c.slice(), A: cl.A.slice() };
  const xs = cl.candidates.map((q) => pack(q, N));
  const cs = xs.map((x) => {
    let ct; try { ct = B.validateBox(x, box, { nu: NU }); } catch (e) { return { ok: false, why: 'the certifier threw: ' + e.message }; }
    if (!ct.ok) return { ok: false, why: ct.why };
    const pos = B.boxPositivity(ct.predictor.b, N, ct.r);
    return { ok: true, ct, grid: pos.positive, minM: pos.minM };
  });
  let second = 'not applicable (a box)';
  if (thin(cl)) {
    const P = M.makeProblem({ sigma: SIGMA, c: cl.c[0], A: cl.A[0], N });
    const agree = xs.every((x, i) => { let ok = false; try { ok = !!V.validate(x, P, { nu: NU }).ok; } catch (e) { ok = false; } return ok === cs[i].ok; });
    second = agree ? 'agrees' : 'DISAGREES';
  }
  let same = false, allDisjoint = true;
  const disjoint = (i, j) => B.separationBox(cs[i].ct.predictor, cs[j].ct.predictor, N, NU) > cs[i].ct.r + cs[j].ct.r;
  const kept = [];
  for (let i = 0; i < k; i++) {
    if (!cs[i].ok) continue;
    for (let j = 0; j < i; j++) {
      if (!cs[j].ok || disjoint(i, j)) continue;
      allDisjoint = false;
      const hi = distUpper(cs[i].ct.predictor, cs[j].ct.predictor, N);
      if (uniqueWithin(cs[i].ct, I.nextUp(hi + cs[j].ct.r)) || uniqueWithin(cs[j].ct, I.nextUp(hi + cs[i].ct.r))) same = true;
    }
    if (kept.every((j) => disjoint(i, j))) kept.push(i);
  }
  const enclosed = cs.filter((c) => c.ok).length;
  const gridPositive = kept.filter((i) => cs[i].grid).length;
  const word = second === 'DISAGREES' ? 'REFUSED' : same ? 'REFUTED' : (enclosed === k && allDisjoint) ? 'CERTIFIED' : 'REFUSED';
  const wordGrid = word !== 'CERTIFIED' ? word : (cs.every((c) => c.grid) ? 'CERTIFIED' : 'REFUSED');
  const whys = [...new Set(cs.filter((c) => !c.ok).map((c) => c.why))];
  return { id: cl.id, c: cl.c, A: cl.A, N, point: thin(cl), claimed: k, enclosed, distinct: kept.length, gridPositive,
    word, wordWithTheGridBound: wordGrid,
    reason: word === 'CERTIFIED' ? null : second === 'DISAGREES' ? 'the two deciders disagree on a candidate' : same ? 'two candidates enclose the same exact solution' : whys.length ? whys.join(' | ') : 'two balls are neither provably disjoint nor provably the same solution',
    secondDecider: second,
    smallestGridDensity: cs.some((c) => c.ok) ? Math.min(...cs.filter((c) => c.ok).map((c) => c.minM)) : null,
    largestRadius: cs.some((c) => c.ok) ? Math.max(...cs.filter((c) => c.ok).map((c) => c.ct.r)) : null };
}

function claimsOf(file) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, DIR, file), 'utf8'));
  return d.claims.map((c) => ({ id: c.id, c: c.c, A: c.A, N: c.N, candidates: c.candidates, stated: c.probability !== undefined ? c.probability : null }));
}
function uniqueness() {
  const out = cp.execFileSync('python3', ['-I', 'labs/mfg/uniqueness.py'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
  return JSON.parse(out);
}
/* Astra's two-term fold formula, evaluated at the couplings where Fable's table puts the first fold: it should
   return Fable's depth. Floating point on both sides; a comparison, not a certificate. */
function folds() {
  const rows = fs.readFileSync(path.join(ROOT, DIR, 'fable-folds.csv'), 'utf8').split('\n').filter((l) => l && l[0] !== '#' && !/^j,/.test(l)).map((l) => l.split(','));
  const P2 = Math.PI * Math.PI;
  const law = (d) => (4 / 3) * Math.sqrt(2 / (3 * P2)) * Math.pow(d, 1.5) * (1 + d / (16 * P2));
  const pick = (j, A) => rows.find((r) => r[0] === String(j) && Math.abs(Number(r[1]) - A) < 1e-9);
  const first = [0.1, 0.5, 1.0, 1.2].map((A) => { const c = Number(pick(1, A)[2]); return { depth: A, fableFold: c, astraFormulaReturns: Number(law(-c - P2).toFixed(5)), relativeError: Number(Math.abs(law(-c - P2) - A) / A).toExponential(1) }; });
  const coef = (j, e) => [0.05, 0.1, 0.2].map((A) => ({ depth: A, value: Number(((-(j * j) * P2 - Number(pick(j, A)[2])) / Math.pow(A, e)).toFixed(6)) }));
  return { source: DIR + '/fable-folds.csv (floating point, not certified)', first,
    second: { astraCoefficient: 0.133414749944, exponent: '4/3', fableTableGives: coef(2, 4 / 3) },
    third: { astraCoefficient: 0.005402423388, exponent: '2', fableTableGives: coef(3, 2) } };
}
function pins() { const o = {}; for (const f of INPUTS.concat(INSTRUMENTS)) o[f] = sha(f); return o; }

function build() {
  const claims = {}, summary = {};
  for (const [who, file] of SOURCES) {
    claims[who] = claimsOf(file).map((cl) => { const r = decide(cl); r.statedProbability = cl.stated; process.stderr.write(who + ' ' + r.id + ' ' + r.word + ' ' + r.distinct + '/' + r.claimed + '\n'); return r; });
    const rows = claims[who];
    summary[who] = { claims: rows.length, certified: rows.filter((r) => r.word === 'CERTIFIED').length, certifiedWithTheGridBound: rows.filter((r) => r.wordWithTheGridBound === 'CERTIFIED').length,
      refused: rows.filter((r) => r.word === 'REFUSED').length, refuted: rows.filter((r) => r.word === 'REFUTED').length,
      mostCertifiedAtOnce: Math.max(...rows.filter((r) => r.word === 'CERTIFIED').map((r) => r.claimed)) };
  }
  const readings = JSON.parse(fs.readFileSync(path.join(ROOT, DIR, 'readings.json'), 'utf8'));
  return { what: 'two models on the stationary quadratic mean-field game: their candidate equilibria decided as submitted, one uniqueness argument decided per rectangle, and who read which proof',
    game: '-sigma u\'\' + (1/2)(u\')^2 + rho = c m + A cos(2 pi x), -sigma m\'\' - (m u\')\' = 0, int m = 1, int u = 0, m > 0, sigma = 1/2, even solutions on R/Z',
    date: readings.date, nu: NU, pins: pins(), sample: SAMPLE,
    positivity: 'word: positivity from the zero-flux lemma (an enclosed solution is real, periodic and has mean density one). wordWithTheGridBound: the certifier\'s own grid bound as well.',
    models: readings.models, session: readings.session,
    summary, claims, uniqueness: uniqueness(), folds: folds(), readings };
}

function check() {
  const fail = (m) => { console.log('FAIL mfg-two-models: ' + m); process.exit(1); };
  if (!fs.existsSync(path.join(ROOT, OUT))) fail('no record at ' + OUT);
  const R = JSON.parse(fs.readFileSync(path.join(ROOT, OUT), 'utf8'));
  const now = pins();
  for (const f of Object.keys(now)) if (R.pins[f] !== now[f]) fail(f + ' no longer hashes to the pinned ' + String(R.pins[f]).slice(0, 12));
  if (JSON.stringify(R.readings) !== JSON.stringify(JSON.parse(fs.readFileSync(path.join(ROOT, DIR, 'readings.json'), 'utf8')))) fail('the readings in the record are not the file\'s');
  if (JSON.stringify(R.uniqueness) !== JSON.stringify(uniqueness())) fail('the uniqueness instrument no longer returns the recorded curve');
  if (JSON.stringify(R.folds) !== JSON.stringify(folds())) fail('the fold comparison moved');
  let n = 0;
  for (const [who, file] of SOURCES) {
    const want = SAMPLE[who] || [];
    for (const cl of claimsOf(file).filter((c) => want.includes(c.id))) {
      const got = decide(cl), rec = R.claims[who].find((r) => r.id === cl.id);
      for (const f of ['claimed', 'enclosed', 'distinct', 'gridPositive', 'word', 'wordWithTheGridBound', 'secondDecider'])
        if (got[f] !== rec[f]) fail(who + ' ' + cl.id + ': ' + f + ' is ' + got[f] + ', the record says ' + rec[f]);
      n++;
    }
  }
  /* the sentences a page may state, each read back */
  const S = R.summary;
  if (!(S.session.mostCertifiedAtOnce === 7 && S.astra.mostCertifiedAtOnce === 5 && S.fable.mostCertifiedAtOnce === 5)) fail('the certified counts (seven, five, five) moved');
  if (!(S.astra.refuted === 0 && S.fable.refuted === 0)) fail('a claim is now refuted');
  if (R.uniqueness.map.multipleCellsInsideTheUniqueRegion !== 0) fail('a MULTIPLE cell of the map lies inside the region the argument calls unique');
  console.log('PASS mfg-two-models: ' + Object.keys(now).length + ' pins; the uniqueness curve (' + R.uniqueness.curve.length + ' depths, ' + R.uniqueness.map.uniqueByTheArgument + ' cells) and the fold comparison recomputed; '
    + n + ' sampled claims re-decided as recorded; certified at once: ' + S.astra.mostCertifiedAtOnce + ' (Astra), ' + S.fable.mostCertifiedAtOnce + ' (Fable), ' + S.session.mostCertifiedAtOnce + ' (this session); nothing refuted');
}

if (process.argv.includes('--write')) {
  const rec = build();
  fs.writeFileSync(path.join(ROOT, OUT), JSON.stringify(rec, null, 1) + '\n');
  console.log('written ' + OUT + ': ' + JSON.stringify(rec.summary));
} else check();
