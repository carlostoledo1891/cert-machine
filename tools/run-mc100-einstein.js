#!/usr/bin/env node
/* run-mc100-einstein.js — the hundred pre-registered machine claims, phase 4b wave 1: the EinsteinArena rows a
   decider already exists for.
   tools/ · cert-machine

   WHAT IT DECIDES. Ten of the 29 rows of the einstein-arena pool (corpus/machine-claims-100.json; each row the
   platform's current best of 2026-10-02 for one problem, pinned in corpus/einstein-arena):
     the four kissing rows   d11 n=594, d12 n=841 and the two open rungs d11 n=605, d12 n=842
                             — instruments/kissing/kissing.js (imported, never edited) decides the configuration;
                             the full pass below counts every violating pair, finds the worst exactly and encloses
                             the platform's penalty score
     the six easota shapes   minimum overlap, first autocorrelation, min-distance ratio, flat polynomials,
                             edges vs triangles, circles in a rectangle — instruments/easota/decide.js
   The other nineteen rows need deciders that do not exist yet; they are listed in the ledger's `undecided` with
   the reason, and stay out of the register until a run decides them. Nothing is dropped.

   EXACTNESS. The bytes are re-hashed against the manifest's pin. Every number is read as the decimal LITERAL the
   file carries (a JSON reader that keeps numbers as their text; the literal is also checked against the shortest
   round-trip form of the double it denotes), and the literal is the rational. No float decides anything.

   THE PLATFORM'S SCORE. Each row's claim is that the object is a feasible solution of the problem and that the
   platform's score of it is S. S is a float64 evaluation printed as a double. The rule, fixed before any row was
   decided here and stated in the ledger:
     · CERTIFIED (kind none) — every constraint of the problem holds EXACTLY, and the exact objective (or its
       rigorous enclosure) agrees with S within the platform's own resolution: its minImprovement for the problem
       when that is nonzero, else 1e-12 relative. The side on which S falls is recorded beside it.
     · REPAIRED (kind tolerance-witness) — a constraint holds only up to a numerical tolerance or a normalisation,
       not exactly; the as-published value is compared with S, and an exact witness built from the same bytes
       (instruments/easota's repair) is certified next to it with its deficit. Whose tolerance, and when, is read
       from bytes pinned in corpus/sources/easota-platform and re-checked below (PLATFORM): the platform's overlap
       verifier has NO tolerance on Σh — it rescales h to Σh = n/2 in float64 before scoring, in every public
       version; the 1e-6 (np.isclose, atol=1e-6) is the Together repository's notebook (corpus/easota), not the
       platform's. Its circles verifier dropped its 1e-9 slack on 2026-08-24 (code merged 2026-08-31), before these
       bests were fetched (2026-10-02).
     · a score that the exact value does not reproduce is REFUTED, kind not-from-the-published-data.
   For the penalty-scored kissing rungs (605 and 842 open; 841 closed by the platform 2026-06-30, "Solved Outside
   EinsteinArena"), "feasible" is read as the platform reads it — n nonzero vectors
   in R^d, which its verifier scores — and the score is the overlap penalty Σ max(0, 2 − |c_i − c_j|), c_i = 2x_i/|x_i|
   (inferred, and checked: the enclosure reproduces all four printed scores to every printed digit). A score above
   0 is the platform's own statement that the object is NOT a kissing configuration; deciding that exactly — every
   violating pair, the worst one's exact excess — is the decision the pre-registration expects, not a refutation.

   usage: node tools/run-mc100-einstein.js          writes certs/mc100-einstein-arena.json */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..');
const K = require(path.join(ROOT, 'instruments', 'kissing', 'kissing.js'));
const L = require(path.join(ROOT, 'instruments', 'easota', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'easota', 'decide.js'));
const Q = L.Q;
const die = (m) => { console.error('MC100 EINSTEIN REFUSED: ' + m); process.exit(1); };
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const ms = (t0) => Math.round(Number(process.hrtime.bigint() - t0) / 1e5) / 10;
const POOL = 'einstein-arena';
const M = J('corpus/machine-claims-100.json');
const META = J('corpus/einstein-arena/meta.json');
const PROBLEMS = J('corpus/einstein-arena/problems.json');

/* ---- the platform's rules, read from pinned bytes: a row states no tolerance these bytes do not show ---- */
const PINS = J('corpus/sources/PINS.json');
const pinnedText = (key) => {
  const b = fs.readFileSync(path.join(ROOT, 'corpus', 'sources', key));
  if (!PINS[key] || crypto.createHash('sha256').update(b).digest('hex') !== PINS[key]) die('corpus/sources/' + key + ' does not hash to its pin');
  return b.toString('utf8');
};
const PLATFORM = (() => {
  const src = 'corpus/sources/easota-platform/';
  const ovl = pinnedText('easota-platform/erdos-min-overlap_9cd6fbfb.ts'), cir = pinnedText('easota-platform/circles-rectangle_9cd6fbfb.ts');
  const log = pinnedText('easota-platform/einstein-arena-changelog_9cd6fbfb.md');
  const nb = fs.readFileSync(path.join(ROOT, 'corpus', 'easota', 'erdos-minimum-overlap', 'verifier.py'), 'utf8');
  if (!ovl.includes('sequence_array = _normalize_sum_constraint(sequence_array)') || /isclose|atol/.test(ovl)) die('the pinned overlap verifier no longer rescales Σh without a tolerance');
  if (!nb.includes('np.isclose(actual_sum, target_sum, atol=1e-6)')) die('the repository notebook no longer holds the 1e-6 on Σh');
  if (!cir.includes('if width + height > Fraction(2):') || cir.includes('1e-9')) die('the pinned circles verifier is not the no-slack rule');
  if (!log.includes('Removed the `1e-9` feasibility slack from `circle-packing`, `circles-rectangle`')) die('the pinned changelog no longer records the circles slack removed');
  return {
    overlap: 'the platform\'s verifier has no tolerance on the sum — in every public version (' + src + 'erdos-min-overlap_9cd6fbfb.ts) it rescales h to Σh = n/2 in float64 before scoring, the repair below in floating point — and the 1e-6 is the Together repository notebook\'s np.isclose (corpus/easota), not the platform\'s',
    circles: 'the platform\'s verifier has had no slack since 2026-08-24 (' + src + 'einstein-arena-changelog_9cd6fbfb.md; circles-rectangle_9cd6fbfb.ts)'
  };
})();

/* ---- the exact JSON reader: numbers kept as the literal text the file carries ---- */
function parseJsonExact(text) {
  let i = 0;
  const ws = () => { while (i < text.length && /\s/.test(text[i])) i++; };
  const val = () => {
    ws();
    const c = text[i];
    if (c === '{') { i++; const o = {}; ws(); if (text[i] === '}') { i++; return o; }
      for (;;) { ws(); const k = val(); ws(); if (text[i++] !== ':') throw new Error('json: expected :'); o[k] = val(); ws(); const d = text[i++]; if (d === '}') return o; if (d !== ',') throw new Error('json: expected , or }'); } }
    if (c === '[') { i++; const a = []; ws(); if (text[i] === ']') { i++; return a; }
      for (;;) { a.push(val()); ws(); const d = text[i++]; if (d === ']') return a; if (d !== ',') throw new Error('json: expected , or ]'); } }
    if (c === '"') { const m = /^"(?:[^"\\]|\\.)*"/.exec(text.slice(i, i + 1e6)); i += m[0].length; return JSON.parse(m[0]); }
    const m = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(text.slice(i, i + 64));
    if (m) { i += m[0].length; return { lit: m[0] }; }
    for (const [w, v] of [['true', true], ['false', false], ['null', null]]) if (text.startsWith(w, i)) { i += w.length; return v; }
    throw new Error('json: unexpected ' + c + ' at ' + i);
  };
  const v = val(); ws(); if (i !== text.length) throw new Error('json: trailing bytes');
  return v;
}
let literalChecks = 0, literalMismatch = 0;
/* a literal -> its text, checked against the shortest round-trip form of the double it denotes */
const lit = (x) => {
  if (!x || typeof x.lit !== 'string') throw new Error('expected a number literal');
  literalChecks++;
  if (String(Number(x.lit)) !== x.lit && L.Q.cmp(L.parseDecimal(String(Number(x.lit))), L.parseDecimal(x.lit)) !== 0) literalMismatch++;
  return x.lit;
};

/* the bytes of one row, re-hashed against the manifest (best-3 is stored gzip; the pin is the JSON's) */
function bytesOf(mr) {
  const f = mr.source.split(' ')[0];
  let raw = fs.readFileSync(path.join(ROOT, f));
  if (/\.gz$/.test(f)) raw = zlib.gunzipSync(raw);
  const sha = crypto.createHash('sha256').update(raw).digest('hex');
  if (sha !== mr.sha256) die(mr.id + ': ' + f + ' hashes to ' + sha + ', the manifest pins ' + mr.sha256);
  return { text: raw.toString('utf8'), sha, file: f };
}

/* ---- display and agreement helpers ---- */
const dec = (r, d = 20) => L.toFixed(r, d);
const bigDiv = (a, b, d = 30) => { /* a/b to d decimals, floor, as a string, a,b BigInt b>0 */
  const neg = (a < 0n) !== (b < 0n); a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  const s = ((a * 10n ** BigInt(d)) / b).toString().padStart(d + 1, '0');
  return (neg ? '-' : '') + s.slice(0, s.length - d) + '.' + s.slice(s.length - d);
};
/* the agreement rule: |exact - S| <= tol, tol = minImprovement when nonzero, else 1e-12 relative; exact may be an enclosure [lo, hi] */
function agreement(lo, hi, Slit, minImp) {
  const S = L.parseDecimal(Slit);
  const absS = Q.abs(S);
  const tol = minImp > 0 ? L.parseDecimal(String(minImp)) : Q.mul(L.parseDecimal('1e-12'), Q.cmp(absS, Q.R(1n)) > 0 ? absS : Q.R(1n));
  const dist = Q.cmp(S, lo) < 0 ? Q.sub(lo, S) : (Q.cmp(S, hi) > 0 ? Q.sub(S, hi) : Q.R(0n));
  const side = Q.cmp(S, lo) < 0 ? 'below' : (Q.cmp(S, hi) > 0 ? 'above' : 'inside');
  return { agrees: Q.cmp(dist, tol) <= 0, distance: dec(dist, 24), tolerance: L.toFixed(tol, 24).replace(/0+$/, ''), printedSide: side, rule: minImp > 0 ? 'the platform\'s minImprovement ' + minImp : '1e-12 relative (minImprovement 0)' };
}

/* ================================================================================
   KISSING — instruments/kissing/kissing.js for the decision; the full pass here for the distance
   ================================================================================ */
const isqrt = (x) => { if (x < 0n) throw new Error('isqrt of a negative'); if (x < 2n) return x; let r = 1n << BigInt(Math.ceil(x.toString(2).length / 2)); for (;;) { const y = (r + x / r) >> 1n; if (y >= r) break; r = y; } while (r * r > x) r--; while ((r + 1n) * (r + 1n) <= x) r++; return r; };
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
function kissingFull(V) {
  /* every pair decided exactly; the platform's penalty enclosed in 40-digit fixed point, outward rounded */
  const S = 10n ** 40n;
  const n = V.length, dot = (x, y) => { let s = 0n; for (let k = 0; k < x.P.length; k++) s += x.P[k] * y.P[k]; return s; };
  const N = V.map((v) => dot(v, v));
  let violations = 0, contacts = 0, coincident = 0, lo = 0n, hi = 0n, worst = null;
  const coincidentPairs = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const s = dot(V[i], V[j]);
    if (s <= 0n) continue;
    const P = N[i] * N[j], t = 4n * s * s;
    if (t === P) { contacts++; continue; }
    if (t < P) continue;
    violations++;
    if (!worst || s * s * worst.P > worst.s * worst.s * P) worst = { i, j, s, P };
    if (s * s === P) { coincident++; coincidentPairs.push([i, j]); lo += 2n * S; hi += 2n * S; continue; }   /* the same direction: distance 0, penalty 2 exactly */
    const r = isqrt(P), exactRoot = r * r === P;
    const cosLo = exactRoot ? (s * S) / r : (s * S) / (r + 1n);
    const cosHi = exactRoot ? (s * S + r - 1n) / r : (s * S + r - 1n) / r;
    const xLo = 8n * (S - (cosHi > S ? S : cosHi)), xHi = 8n * (S - cosLo);
    const dLo = isqrt(xLo * S), dHi = isqrt(xHi * S) + 1n;
    lo += 2n * S - dHi; hi += 2n * S - dLo;
  }
  let w = null;
  if (worst) {
    const { i, j, s, P } = worst, g = gcd(s * s, P);
    const r = isqrt(P), e = 30n, SC = 10n ** e, root = r * r === P;
    const cosLo = (s * SC) / (root ? r : r + 1n), cosHi = (s * SC + r - 1n) / r;
    const c = Number(cosLo) / Number(SC);
    w = { i, j, cos2Exact: (s * s / g).toString() + '/' + (P / g).toString(),
      cos2MinusQuarterExact: (() => { const num = 4n * s * s - P, den = 4n * P, h = gcd(num, den); return (num / h).toString() + '/' + (den / h).toString(); })(),
      cosEnclosure: [bigDiv(cosLo, SC, 30), bigDiv(cosHi, SC, 30)],
      innerProductExcessEnclosure: [bigDiv(2n * cosLo - SC, 2n * SC, 30), bigDiv(2n * cosHi - SC, 2n * SC, 30)],
      angleDegApprox: Math.acos(Math.min(1, c)) * 180 / Math.PI, angleDeficitDegApprox: 60 - Math.acos(Math.min(1, c)) * 180 / Math.PI };
    const digits = (x) => x.length > 120 ? x.slice(0, 60) + '…(' + x.length + ' chars)' : x;
    w.cos2ExactShort = digits(w.cos2Exact);
  }
  return { pairs: n * (n - 1) / 2, violations, contacts, coincident, coincidentPairs, worst: w,
    penaltyEnclosure: [Q.R(lo, S), Q.R(hi, S)] };
}

function kissingRow(mr, B, prob) {
  const dims = /d(\d+)/.exec(prob.slug), nT = /n=(\d+)/.exec(prob.title);
  const d = Number(dims[1]), nWant = Number(nT[1]);
  const rows = B.data.vectors.map((v) => v.map(lit));
  if (rows.length !== nWant || rows.some((v) => v.length !== d)) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the object is not ' + nWant + ' vectors in R^' + d + ' (' + rows.length + ' rows)' };
  const V = K.fromDecimals(rows);
  const cert = K.certify(V);
  const full = kissingFull(V);
  const Slit = lit(B.score);
  const ag = agreement(full.penaltyEnclosure[0], full.penaltyEnclosure[1], Slit, prob.minImprovement);
  const out = { kissing: cert.verdict === 'CERTIFIED', n: rows.length, dim: d, pairs: full.pairs, violations: full.violations, contacts: full.contacts, coincident: full.coincident,
    penaltyEnclosure: [dec(full.penaltyEnclosure[0], 30), dec(full.penaltyEnclosure[1], 30)], printedScore: Slit, agreement: ag, worst: full.worst };
  if ((cert.verdict === 'CERTIFIED') !== (full.violations === 0)) die(mr.id + ': instruments/kissing and the full pass disagree');
  if (full.coincident) {
    /* drop one vector of each coincident pair and decide the rest */
    const drop = new Set(full.coincidentPairs.map(([, j]) => j));
    const rest = K.certify(V.filter((_, k) => !drop.has(k)));
    out.withoutRepeats = { dropped: [...drop], n: V.length - drop.size, verdict: rest.verdict, contacts: rest.contacts };
  }
  if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the platform\'s score ' + Slit + ' is not the exact penalty of the object, enclosed in [' + out.penaltyEnclosure.join(', ') + ']', decision: out };
  const commas = (x) => x.toLocaleString('en-US');
  /* an interval endpoint shortened for prose must move OUTWARD: the lower end down, the upper end up
     (cutting both ends to 22 characters rounded a positive upper end inward) */
  const outward = (str, dir, keep) => {
    const t = String(str).trim(); if (t.length <= keep || !/^-?\d+(\.\d+)?$/.test(t)) return t;
    const neg = t[0] === '-', body = neg ? t.slice(1) : t, cut = body.slice(0, keep - (neg ? 1 : 0)), rest = body.slice(cut.length);
    const dropped = /[1-9]/.test(rest), grow = dropped && ((dir === 'up') !== neg);
    if (!grow || cut.endsWith('.')) return (neg ? '-' : '') + (cut.endsWith('.') ? cut.slice(0, -1) : cut);
    const digits = cut.replace('.', ''), dot = cut.indexOf('.');
    const inc = (BigInt(digits) + 1n).toString().padStart(digits.length, '0');
    const out = dot < 0 ? inc : inc.slice(0, inc.length - (digits.length - dot)) + '.' + inc.slice(inc.length - (digits.length - dot));
    return (neg ? '-' : '') + out;
  };
  let scope;
  if (out.kissing) scope = 'a kissing configuration of ' + out.n + ' in R^' + d + ': every one of the ' + commas(out.pairs) + ' pairs at an angle of at least 60°, decided exactly in Q (' + commas(out.contacts) + ' exact contacts); the platform\'s score ' + Slit + ' is its exact penalty, 0';
  else if (full.coincident && out.withoutRepeats && out.withoutRepeats.verdict === 'CERTIFIED' && full.violations === full.coincident)
    scope = 'NOT a kissing configuration of ' + out.n + ': ' + full.coincident + ' pair' + (full.coincident === 1 ? '' : 's') + ' (' + full.coincidentPairs.map((p) => p.join(' & ')).join('; ') + ') point in the same direction (cos = 1 exactly) and every other pair is at 60° or more, exactly — ' + out.withoutRepeats.n + ' distinct directions form a kissing configuration (' + commas(out.withoutRepeats.contacts) + ' exact contacts); the platform\'s score ' + Slit + ' is exactly the penalty of the repeat (2 per repeated pair)';
  else scope = 'NOT a kissing configuration of ' + out.n + ' (as the platform\'s score itself says): ' + commas(full.violations) + ' of ' + commas(out.pairs) + ' pairs are closer than 60°, decided exactly; the worst, vectors ' + full.worst.i + ' and ' + full.worst.j + ', has cos²θ = 1/4 + δ with δ = ' + (full.worst.cos2MinusQuarterExact.length > 80 ? 'an exact rational (in the ledger)' : full.worst.cos2MinusQuarterExact) + ', cos θ − 1/2 ∈ [' + outward(full.worst.innerProductExcessEnclosure[0], 'down', 22) + ', ' + outward(full.worst.innerProductExcessEnclosure[1], 'up', 22) + '] (θ ≈ ' + full.worst.angleDegApprox.toFixed(4) + '°, ' + full.worst.angleDeficitDegApprox.toFixed(4) + '° short of 60°); the platform\'s score ' + Slit + ' is the overlap penalty Σ max(0, 2 − |c_i − c_j|), enclosed here in [' + outward(out.penaltyEnclosure[0], 'down', 22) + ', ' + outward(out.penaltyEnclosure[1], 'up', 22) + ']';
  return { verdict: 'CERTIFIED', kind: 'none', scope, decision: out };
}

/* ================================================================================
   THE EASOTA SHAPES — instruments/easota/decide.js
   ================================================================================ */
const R = (s) => L.parseDecimal(s);
function easotaRow(mr, B, prob) {
  const Slit = lit(B.score), minImp = prob.minImprovement;
  const done = (o) => o;
  switch (prob.slug) {
    case 'erdos-min-overlap': {
      const h = B.data.values.map((x) => R(lit(x)));
      const r = D.overlap(h);
      const ag = agreement(r.bound, r.bound, Slit, minImp);
      const decision = { steps: r.n, inRange: r.inRange, sumMinusHalfN: dec(r.sumSlack, 24), bound: dec(r.bound, 20), lag: r.lag, printedScore: Slit, agreement: ag,
        repair: r.repair ? { how: r.repair.how, bound: dec(r.repair.bound, 20), delta: dec(r.repair.delta, 24) } : null };
      if (!r.inRange) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'a value outside [0, 1]', decision };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed bound ' + Slit + ' is not the exact bound of the bytes, ' + decision.bound, decision };
      if (r.witnessed) return { verdict: 'CERTIFIED', kind: 'none', scope: 'h of ' + r.n + ' steps in [0, 1] with Σh = n/2 exactly: C5 ≤ ' + decision.bound + '… exactly (the printed ' + Slit + ' agrees, ' + ag.printedSide + ')', decision };
      const holds = Q.cmp(r.repair.bound, R(Slit)) <= 0;
      decision.repair.printedBoundProvedByRepair = holds;
      return { verdict: 'REPAIRED', kind: 'tolerance-witness', scope: 'as published, Σh − n/2 = ' + decision.sumMinusHalfN.replace(/0+$/, '') + ', not 0; ' + PLATFORM.overlap + '. The printed ' + Slit + ' agrees with the as-published bound ' + decision.bound + '… (' + ag.printedSide + '); the exact witness built from the same bytes (' + r.repair.how + ') certifies C5 ≤ ' + decision.repair.bound + '…, ' + decision.repair.delta.replace(/0+$/, '') + ' from the as-published value' + (holds ? ' — at or below the printed ' + Slit + ', so the printed upper bound itself is proved by the repaired witness' : ' — above the printed ' + Slit + ', so the printed bound is not proved'), decision };
    }
    case 'first-autocorrelation-inequality': {
      const f = B.data.values.map((x) => R(lit(x)));
      const r = D.autocorr(f);
      if (!r.witnessed) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'not a witness: ' + r.reason, decision: { n: r.n } };
      const ag = agreement(r.C1, r.C1, Slit, minImp);
      const decision = { n: r.n, C1: dec(r.C1, 20), argmax: r.argmax, floatArgmax: r.floatArgmax, candidatesDecidedExactly: r.candidates, screenErrorBound: r.errorBound, printedScore: Slit, agreement: ag };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed ' + Slit + ' is not the exact C1 of the bytes, ' + decision.C1, decision };
      return { verdict: 'CERTIFIED', kind: 'none', scope: 'f ≥ 0 at all ' + r.n + ' values, exactly: C1 ≤ ' + decision.C1 + '… exactly (the maximum of the autoconvolution decided at ' + r.candidates + ' candidate index' + (r.candidates === 1 ? '' : 'es') + ' the float screen could not separate; the printed ' + Slit + ' agrees, ' + ag.printedSide + ')', decision };
    }
    case 'min-distance-ratio-2d': {
      const P = B.data.vectors.map((v) => v.map((x) => R(lit(x))));
      const r = D.mindist(P);
      if (!r.witnessed) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'two points coincide', decision: {} };
      const ag = agreement(r.score, r.score, Slit, minImp);
      const decision = { n: r.n, ratioSquared: dec(r.score, 20), minPair: r.minPair, maxPair: r.maxPair, printedScore: Slit, agreement: ag };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed ' + Slit + ' is not the exact ratio² of the bytes, ' + decision.ratioSquared, decision };
      return { verdict: 'CERTIFIED', kind: 'none', scope: r.n + ' distinct points: (max d / min d)² = ' + decision.ratioSquared + '… exactly (the printed ' + Slit + ' agrees, ' + ag.printedSide + ')', decision };
    }
    case 'flat-polynomials': {
      const c = B.data.coefficients.map((x) => BigInt(lit(x)));
      const r = D.flat(c);
      if (!r.witnessed) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: r.reason, decision: {} };
      const ag = agreement(r.Cplus[0], r.Cplus[1], Slit, minImp);
      const decision = { N: r.N, CplusEnclosure: [dec(r.Cplus[0], 20), dec(r.Cplus[1], 20)], method: r.method, printedScore: Slit, agreement: ag,
        note: 'the platform evaluates |g| on 10^6 grid points — a lower bound of the supremum the definition names; the enclosure is the supremum itself (instruments/trigmin)' };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed ' + Slit + ' is not C⁺ of the coefficients, enclosed in [' + decision.CplusEnclosure.join(', ') + ']', decision };
      return { verdict: 'CERTIFIED', kind: 'none', scope: '70 coefficients ±1: C⁺ = max_{|z|=1}|g(z)|/√71 ∈ [' + decision.CplusEnclosure[0] + ', ' + decision.CplusEnclosure[1] + '], the supremum certified (the platform\'s 10⁶-point grid value ' + Slit + ' is ' + ag.printedSide + ' it, within the platform\'s resolution)', decision };
    }
    case 'edges-vs-triangles': {
      const W = B.data.weights.map((row) => row.map((x) => R(lit(x))));
      if (W.some((row) => row.length !== 20)) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'a row without 20 weights', decision: {} };
      const neg = W.reduce((n, row) => n + row.filter((x) => Q.sign(x) < 0).length, 0);
      const r = D.edges(W);
      const ag = agreement(r.score, r.score, Slit, minImp);
      const decision = { rows: r.rows, distinctRho: r.distinctRho, negativeWeights: neg, area: dec(r.area, 20), maxGap: dec(r.maxGap, 20), score: dec(r.score, 20), narrowSegmentsSkippedByPlatform: r.skipped, printedScore: Slit, agreement: ag };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed ' + Slit + ' is not the exact envelope score, ' + decision.score, decision };
      return { verdict: 'CERTIFIED', kind: 'none', scope: r.rows + ' rows of 20 weights: the platform\'s envelope score −(area + 10·max gap) = ' + decision.score + '… exactly (the printed ' + Slit + ' agrees, ' + ag.printedSide + ')', decision };
    }
    case 'circles-rectangle': {
      const C = B.data.circles.map((c) => c.map((x) => R(lit(x))));
      const r = D.circles(C);
      const ag = agreement(r.sumR, r.sumR, Slit, minImp);
      const decision = { n: r.n, sumR: dec(r.sumR, 20), boxSlack: dec(r.boxSlack, 24), overlappingPairs: r.overlaps, worstPair: [r.worstPair.i, r.worstPair.j], worstPairSlackSquared: dec(r.worstPair.slack, 24), printedScore: Slit, agreement: ag,
        repair: r.repair ? { lambda: dec(r.repair.lambda, 20), sumR: dec(r.repair.sumR, 20), deficit: dec(r.repair.deficit, 24), boxSlack: dec(r.repair.boxSlack, 24) } : null };
      if (!ag.agrees) return { verdict: 'REFUTED', kind: 'not-from-the-published-data', scope: 'the printed ' + Slit + ' is not Σr of the bytes, ' + decision.sumR, decision };
      if (r.witnessed) return { verdict: 'CERTIFIED', kind: 'none', scope: r.n + ' circles, no two overlapping and the bounding box at w + h ≤ 2, exactly: Σr = ' + decision.sumR + '… (the printed ' + Slit + ' agrees, ' + ag.printedSide + ')', decision };
      if (!r.repair) return { verdict: 'REFUTED', kind: 'tolerance-witness', scope: 'not a witness and no repair: ' + r.overlaps + ' overlapping pairs, box slack ' + decision.boxSlack, decision };
      return { verdict: 'REPAIRED', kind: 'tolerance-witness', scope: 'as published, ' + (r.overlaps ? r.overlaps + ' pair' + (r.overlaps === 1 ? '' : 's') + ' overlap, exactly (' + PLATFORM.circles + ')' : 'no pair overlaps') + (Q.sign(r.boxSlack) < 0 ? ' and the box exceeds w + h = 2 by ' + dec(Q.neg(r.boxSlack), 24).replace(/0+$/, '') : '') + '; the printed ' + Slit + ' is the as-published Σr (' + ag.printedSide + '); every radius scaled by λ = ' + decision.repair.lambda + ' gives an exact witness, Σr = ' + decision.repair.sumR + '…, ' + decision.repair.deficit.replace(/0+$/, '') + ' below', decision };
    }
  }
  return null;
}

/* ---- the same object already in the register? (the easota table holds the platform's own repository copies) ---- */
const EASOTA_PROBLEM = { 'erdos-min-overlap': 'erdos-minimum-overlap', 'first-autocorrelation-inequality': 'first-autocorrelation', 'min-distance-ratio-2d': 'min-distance-ratio-2d',
  'flat-polynomials': 'flat-polynomials', 'edges-vs-triangles': 'edges-vs-triangles', 'circles-rectangle': 'circles-rectangle' };
function easotaTwin(slug, B) {
  const prob = EASOTA_PROBLEM[slug]; if (!prob) return null;
  const E = J('certs/easota-ledger.json');
  const mine = (() => {
    if (slug === 'erdos-min-overlap' || slug === 'first-autocorrelation-inequality') return B.data.values.map((x) => R(lit(x)));
    if (slug === 'min-distance-ratio-2d') return B.data.vectors.map((v) => v.map((x) => R(lit(x))));
    if (slug === 'flat-polynomials') return B.data.coefficients.map((x) => BigInt(lit(x)));
    if (slug === 'edges-vs-triangles') return B.data.weights.map((row) => row.map((x) => R(lit(x))));
    return B.data.circles.map((c) => c.map((x) => R(lit(x))));
  })();
  const key = (a) => JSON.stringify(a, (k, v) => (typeof v === 'bigint' ? v.toString() : (v && v.n !== undefined && v.d !== undefined ? Q.toString(v) : v)));
  const want = key(mine);
  for (const r of E.rows.filter((x) => x.problem === prob)) {
    const rel = r.file.replace(/^corpus\/easota\//, ''), base = path.basename(rel);
    let theirs;
    if (prob === 'erdos-minimum-overlap') theirs = L.loaders.overlapPy(rel, base === 'haugland_2016.py' ? 'haugland' : base === 'alphaevolve_2025.py' ? 'ae-half' : 'full');
    else if (prob === 'first-autocorrelation') theirs = /\.json$/.test(base) ? L.loaders.autocorrJson(rel) : L.loaders.autocorrPy(rel);
    else if (prob === 'min-distance-ratio-2d') theirs = L.loaders.points(rel, 'vectors');
    else if (prob === 'flat-polynomials') theirs = L.loaders.coefficientsPy(rel);
    else if (prob === 'edges-vs-triangles') theirs = L.loaders.weightsPy(rel);
    else theirs = L.loaders.circles(rel);
    if (key(theirs) === want) return { register: 'ea-' + r.id.replace(/\//g, '-'), easota: r.id, file: r.file, verdict: r.verdict };
  }
  return null;
}

/* ---- the rows of the pool this run decides, and the reason for every other ---- */
const KISSING = ['kissing-number-d11', 'kissing-number-d12', 'kissing-number-d11-605', 'kissing-number-d12-842'];
const EASOTA = ['erdos-min-overlap', 'first-autocorrelation-inequality', 'min-distance-ratio-2d', 'flat-polynomials', 'edges-vs-triangles', 'circles-rectangle'];
const LATER = {
  'second-autocorrelation-inequality': 'a new exact scorer (the second autocorrelation ratio over 1,999,999 values)',
  'third-autocorrelation-inequality': 'a new exact scorer (signed f; the third autocorrelation ratio)',
  'prime-number-theorem': 'not decidable as stated: the platform scores it by Monte Carlo sampling (the easota ledger\'s undecided row); a sampled score is not a claim about the construction',
  'uncertainty-principle': 'a new decider (Laguerre double roots and the sign pattern, exact)',
  'thomson-problem': 'a new decider (an energy enclosure; the claim is a value, not an optimum)',
  'tammes-problem': 'a new decider (the minimum angle of 50 points on S², exactly)',
  'heilbronn-triangles': 'a new decider (points in the equilateral triangle; Q(√3) arithmetic) — easota decides the convex-region variant only',
  'circle-packing': 'a new decider (circles in the unit square; easota decides the rectangle-of-perimeter-4 variant only)',
  'difference-bases': 'a new finite exact check',
  'kakeya-needle-128': 'a new exact scorer',
  'hadamard-det-51': 'a new finite exact check (an integer determinant)',
  'sorting-network-16': 'a new finite exact check (the 0-1 principle)',
  'shannon-capacity-c7-5': 'a new finite exact check (an independent set in C7^⊠5)',
  'ring-loading-15': 'a new finite exact check',
  'spencer-discrepancy': 'a new finite exact check',
  'sidon-45-set': 'a new finite exact check',
  'no-three-in-line-75': 'a new finite exact check',
  'two-deletion-code-16': 'a new finite exact check',
  'snake-in-the-box-13': 'a new finite exact check'
};

function main() {
  const t0 = process.hrtime.bigint();
  const mrows = M.rows.filter((r) => r.pool === POOL);
  if (mrows.length !== M.caps[POOL]) die('the manifest holds ' + mrows.length + ' rows in ' + POOL);
  const rows = [], undecided = [];
  const regLedger = J('certs/kissing-ledger.json');
  for (const mr of mrows) {
    const slug = mr.id.replace(/^ea-best-/, '');
    const prob = PROBLEMS.find((p) => p.slug === slug);
    if (!prob) die(mr.id + ': no problem ' + slug + ' in problems.json');
    if (!KISSING.includes(slug) && !EASOTA.includes(slug)) {
      if (!LATER[slug]) die(mr.id + ': neither decided here nor given a reason');
      undecided.push({ id: mr.id, problem: prob.title, needs: LATER[slug] });
      continue;
    }
    const t1 = process.hrtime.bigint();
    const { text, sha, file } = bytesOf(mr);
    const B = parseJsonExact(text);
    const fm = Object.values(META.files).find((x) => x.slug === slug);
    if (!fm || String(fm.solution_id) !== B.id.lit) die(mr.id + ': the bytes are not solution ' + (fm && fm.solution_id));
    process.stderr.write('  ' + mr.id + ' … ');
    const res = KISSING.includes(slug) ? kissingRow(mr, B, prob) : easotaRow(mr, B, prob);
    const row = Object.assign({ id: mr.id, pool: POOL, claimant: mr.claimant, claim: mr.claim, source: file, sha256: sha, problem: prob.title, solution: Number(B.id.lit), agent: B.agentName, scoring: prob.scoring, minImprovement: prob.minImprovement },
      res, { ms: ms(t1) });
    /* the same object already in the register: the platform's 594 was decided 2026-09-07 from another copy of these bytes */
    if (slug === 'kissing-number-d11') {
      const twin = regLedger.rows.find((r) => r.id === 'ea-594-winner');
      const tv = JSON.parse(fs.readFileSync(path.join(ROOT, 'corpus', 'kissing', 'ea-d11-594-winner.json'), 'utf8')).vectors;
      if (twin && twin.verdict === 'CERTIFIED' && JSON.stringify(tv) === JSON.stringify(B.data.vectors.map((v) => v.map((x) => x.lit)))) {
        row.sameClaimAs = 'kiss-ea-594-winner';
        row.scope += ' — the same object (solution #' + row.solution + ', the same 594 vectors literal for literal) the register decided 2026-09-07 as kiss-ea-594-winner; counted there, once';
      }
    }
    if (EASOTA.includes(slug)) {
      const tw = easotaTwin(slug, B);
      if (tw) {
        const regVerdict = tw.verdict === 'WITNESSED' ? 'CERTIFIED' : tw.verdict;
        if (regVerdict !== row.verdict) die(mr.id + ': the same object as ' + tw.register + ' but decided ' + row.verdict + ' here and ' + regVerdict + ' there');
        row.sameClaimAs = tw.register;
        row.scope += ' — the same object, number for number, as ' + tw.file + ' (the platform\'s repository copy), decided in the register as ' + tw.register + '; counted there, once';
      }
    }
    process.stderr.write(row.verdict + (row.sameClaimAs ? ' = ' + row.sameClaimAs : '') + ' (' + row.ms + ' ms)\n');
    rows.push(row);
  }
  /* a literal that is not the shortest form of its double changes nothing decided (the literal is the rational); it is counted */
  const byVerdict = {}, byKind = {};
  for (const x of rows) { byVerdict[x.verdict] = (byVerdict[x.verdict] || 0) + 1; byKind[x.kind] = (byKind[x.kind] || 0) + 1; }
  const ledger = {
    what: 'The einstein-arena pool of the hundred pre-registered machine claims (corpus/machine-claims-100.json, registered 2026-10-02 before any was decided), WAVE 1: the ' + rows.length + ' rows a decider already existed for, decided by tools/run-mc100-einstein.js from the platform\'s bests of 2026-10-02 (corpus/einstein-arena), every number read as the decimal literal the file carries. The other ' + undecided.length + ' rows are listed in `undecided` with what they need; nothing is dropped. The claimant\'s code — and the platform\'s verifier — is never run; the definitions are read from the problem statements and the published verifiers: the Together repository\'s notebook (corpus/easota) and the platform\'s own sources, pinned with their dates in corpus/sources/easota-platform.',
    pool: POOL, wave: 1, manifest: 'corpus/machine-claims-100.json', registered: M.registered,
    deciders: { kissing: 'instruments/kissing/kissing.js (certify; imported unchanged) + the full pass in this tool (every pair, the worst exactly, the penalty enclosed)', easota: 'instruments/easota/decide.js (overlap, autocorr, mindist, flat, edges, circles)' },
    rules: {
      certified: 'every constraint holds exactly and the exact objective (or its rigorous enclosure) agrees with the printed score within the platform\'s resolution: its minImprovement when nonzero, else 1e-12 relative; printedSide records where the printed double falls',
      repaired: 'a constraint holds only up to a numerical tolerance or a normalisation, not exactly (whose, and since when, is named in the row from corpus/sources/easota-platform: the platform\'s overlap verifier rescales Σh to n/2 with no tolerance; the 1e-6 is the Together repository notebook\'s); the as-published value is compared with the printed score and an exact witness from the same bytes is certified next to it (kind tolerance-witness)',
      refuted: 'a printed score the exact value does not reproduce (kind not-from-the-published-data)',
      openKissingRungs: 'for a penalty-scored kissing rung, feasible = n nonzero vectors in R^d (what the platform scores); the score is Σ max(0, 2 − |c_i − c_j|) over pairs, c_i = 2x_i/|x_i| — inferred, and reproduced to every printed digit for all four kissing rows; a score above 0 is the platform\'s own statement that the object is not a kissing configuration, and the decision of that, pair by pair, is the row\'s content'
    },
    literalReading: { literals: literalChecks, notShortestForm: literalMismatch },
    rows, count: rows.length, byVerdict, byKind, undecided,
    timing: { runMs: ms(t0), rowMsTotal: Math.round(rows.reduce((s, x) => s + x.ms, 0) * 10) / 10 },
    generated: new Date().toISOString(), git, node: process.version
  };
  fs.writeFileSync(path.join(ROOT, 'certs', 'mc100-einstein-arena.json'), JSON.stringify(ledger, null, 1) + '\n');
  console.log('certs/mc100-einstein-arena.json · ' + rows.length + ' rows decided (' + Object.entries(byVerdict).map(([k, n]) => n + ' ' + k).join(', ') + '), ' + undecided.length + ' undecided with reasons · ' + ledger.timing.runMs + ' ms');
}

module.exports = { parseJsonExact, kissingFull, kissingRow, easotaRow, agreement };
if (require.main === module) main();
