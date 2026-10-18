#!/usr/bin/env node
/* replay-stepfun.js — the four step functions behind the registry's new C_1a and C_1b rows, each decided twice.

   On 2026-10-18 the optimization-constants registry merged four upper bounds — C_1a <= 1.5027434868 (Atris) and
   1.5027435320 (AgentDiscover, EinsteinArena), C_1b <= 0.3808585504 (Atris) and 0.3808585749 (CodexProLong,
   EinsteinArena) — and marked all four with the asterisk because they were "replayed only by the submitting team's own
   checker" (the maintainer's commit 3010f7ed, pinned in corpus/optconst-queue/registry-2026-10-18b/). His rule removes
   the mark when a bound is independently replayed. This is that replay, in the form the registry accepted for C_3c:
   two implementations that share no code with each other or with the claimants, every input pinned by digest, the
   bounds read from the registry's own pinned pages, red controls that must come out wrong.

   The two implementations: instruments/optq/stepfun.py (Python, Fraction and int, the decider of the 2026-10-15 queue)
   and the decider in this file (JavaScript BigInt, written apart from it). Both compute the same exact rational:
     1a  f >= 0 a step function on [-1/4, 1/4] with n equal steps; f*f is piecewise linear with knots on the grid, so
         max (f*f) / (∫f)^2 = 2n · max_k Σ_i a_i a_{k-i} / (Σ a_i)^2, with a_i the heights over one common denominator;
     1b  h a step function on [0, 2] with n equal steps, 0 <= h <= 1, ∫h = 1 exactly (Σ h_i = n/2), g = 1 - h on [0, 2]
         and zero outside; sup_s ∫ h(x) g(x + s) dx = (2/n) · max_m Σ_i a_i (D - a_{i+m}) / D^2 over every lag m.
   The products are exact integer multiplications (Kronecker substitution: each sequence packed into one big integer).
   A bound is CERTIFIED when the exact value is <= the bound the registry prints, REFUTED when it is above, and REFUSED
   when the function is not admissible as given. CodexProLong's published heights sum to n/2 + 1.9e-13, not n/2: as
   published it is REFUSED (a red control below), and the bound is decided for the heights scaled down to Σh = n/2
   exactly — the repair the platform's own verifier makes in floating point — which keeps 0 <= h <= 1.

   usage: node tools/replay-stepfun.js            both implementations, the red controls → certs/stepfun-replay.json
          node tools/replay-stepfun.js --check    the battery: this file's decider re-derives every row and red control
                                                  and compares with the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'certs', 'stepfun-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('STEPFUN REPLAY REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));

/* ---- the inputs, each against its pin ---------------------------------------------------------------- */
const SNAP = 'corpus/optconst-queue/registry-2026-10-18b';
const OQP = J('corpus/optconst-queue/PINS.json').pins, EAP = J('corpus/optconst-queue/ea-2026-10-18/PINS.json').files, EAM = J('corpus/einstein-arena/meta.json').files;
const SOURCES = [
  { id: '1a-atris', kind: '1a', page: '1a', ref: 'A2026', producer: 'Atris (atrislabs/records @ 1fa857a0)', rel: 'corpus/optconst-queue/sources/atrislabs/1a-sidon-autocorrelation/construction.json', pin: OQP['atrislabs/1a-sidon-autocorrelation/construction.json'] },
  { id: '1a-agentdiscover', kind: '1a', page: '1a', ref: 'EA2026', producer: 'AgentDiscover (EinsteinArena solution 2603, 2026-10-03)', rel: 'corpus/optconst-queue/ea-2026-10-18/solution-2603.json', pin: EAP['solution-2603.json'].sha256 },
  { id: '1b-atris', kind: '1b', page: '1b', ref: 'A2026', producer: 'Atris (atrislabs/records @ 1fa857a0)', rel: 'corpus/optconst-queue/sources/atrislabs/1b-erdos-minimum-overlap/construction.json', pin: OQP['atrislabs/1b-erdos-minimum-overlap/construction.json'] },
  { id: '1b-codexprolong', kind: '1b', page: '1b', ref: 'EA2026', producer: 'CodexProLong (EinsteinArena solution 2507, 2026-08-15)', rel: 'corpus/einstein-arena/best-1.json', pin: EAM['best-1.json'].sha256, rescale: true }
];
for (const s of SOURCES) if (!s.pin || sha(rd(s.rel)) !== s.pin) die(s.rel + ' does not match its pin');
/* the bounds, read from the registry's pinned pages: the row of the upper-bound table that carries the reference */
const SP = J(SNAP + '/PINS.json').files;
const page = (k) => { const rel = 'upstream/constants/' + k + '.md', buf = rd(SNAP + '/' + rel); if (sha(buf) !== SP[rel].sha256) die(rel + ' moved from its pin'); return buf.toString('utf8'); };
for (const s of SOURCES) {
  const l = page(s.page).split('\n').find((x) => x.startsWith('| $') && x.includes('| [' + s.ref + '] |'));
  const m = l && /^\| \$([0-9.]+)\$(\*?) \|/.exec(l);
  if (!m) die('no ' + s.ref + ' row with a bound on the ' + s.page + ' page');
  s.claim = m[1]; s.asterisked = m[2] === '*';
}

/* ---- the JavaScript decider (shares no code with stepfun.py) --------------------------------------------- */
const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
const bitlen = (x) => (x === 0n ? 0 : x.toString(2).length);
/* a double, exactly: sign · mantissa · 2^exponent, read from its IEEE-754 bits */
function exactDouble(x) {
  if (!Number.isFinite(x)) throw new Error('a non-finite height');
  if (x === 0) return [0n, 1n];
  const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, x);
  const hi = dv.getUint32(0), lo = dv.getUint32(4), e = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo), ex;
  if (e === 0) ex = -1074; else { m |= 1n << 52n; ex = e - 1075; }
  if (hi >>> 31) m = -m;
  return ex >= 0 ? [m << BigInt(ex), 1n] : [m, 1n << BigInt(-ex)];
}
/* "p/q", a decimal string, or a JSON number (a double) — each as a fraction of BigInts */
function exact(v) {
  if (typeof v === 'number') return exactDouble(v);
  const s = String(v).trim();
  if (s.includes('/')) { const [p, q] = s.split('/'); if (BigInt(q) <= 0n) throw new Error('a non-positive denominator'); return [BigInt(p), BigInt(q)]; }
  const m = /^(-?)(\d+)(?:\.(\d+))?$/.exec(s); if (!m) throw new Error('not a number: ' + s.slice(0, 40));
  const f = m[3] || '';
  return [(m[1] ? -1n : 1n) * BigInt(m[2] + f), 10n ** BigInt(f.length)];
}
/* the heights over one common denominator D */
function common(fr) {
  let D = 1n;
  for (const [, q] of fr) D = (D / gcd(D, q)) * q;
  return { D, a: fr.map(([p, q]) => p * (D / q)) };
}
/* the coefficients of (Σ a_i x^i)(Σ b_j x^j), a_i, b_j >= 0, by Kronecker substitution: K bits per slot, K a multiple
   of 4 so that the packing and the unpacking are plain hexadecimal strings */
function product(a, b) {
  let ma = 0n, mb = 0n; for (const x of a) if (x > ma) ma = x; for (const x of b) if (x > mb) mb = x;
  const K = Math.ceil((bitlen(BigInt(Math.min(a.length, b.length)) * ma * mb) + 1) / 4) * 4, w = K / 4;
  const pack = (s) => { const parts = new Array(s.length); for (let i = 0; i < s.length; i++) parts[s.length - 1 - i] = s[i].toString(16).padStart(w, '0'); return BigInt('0x' + (parts.join('') || '0')); };
  const hex = (pack(a) * pack(b)).toString(16), L = a.length + b.length - 1;
  if (hex.length > L * w) throw new Error('the product overran its slots: the packing bound was wrong');
  const h = hex.padStart(L * w, '0'), out = new Array(L);
  for (let k = 0; k < L; k++) out[k] = BigInt('0x' + h.slice((L - 1 - k) * w, (L - k) * w));
  return out;
}
const reduce = ([p, q]) => { const g = gcd(p, q) || 1n; return [p / g, q / g]; };
const dec = ([p, q], k) => { const ip = p / q, r = p - ip * q; return ip + '.' + ((r * 10n ** BigInt(k)) / q).toString().padStart(k, '0'); };
/* decide one construction: heights → verdict and exact value */
function decideJs(kind, heights, claim, { rescale, mutate } = {}) {
  const fr = heights.map(exact);
  if (mutate) fr[mutate.index] = mutate.value !== undefined ? exact(mutate.value) : [fr[mutate.index][0] * BigInt(mutate.scale), fr[mutate.index][1]];
  let { D, a } = common(fr);
  const n = a.length, S = a.reduce((s, x) => s + x, 0n);
  if (kind === '1b' && rescale) {
    /* h_i' = h_i · (n/2) / Σh: over the denominator 2S the numerators are a_i · n; a scale-down keeps h' <= h <= 1 */
    if (!(2n * S > BigInt(n) * D)) return { verdict: 'REFUSED', why: 'the rescale is not a scale-down' };
    a = a.map((x) => x * BigInt(n)); D = 2n * S;
  }
  let r;
  if (kind === '1a') {
    if (a.some((x) => x < 0n)) return { verdict: 'REFUSED', why: 'a negative height' };
    const T = a.reduce((s, x) => s + x, 0n); if (T === 0n) return { verdict: 'REFUSED', why: 'the integral is zero' };
    const conv = product(a, a); let best = 0n, at = 0; conv.forEach((c, k) => { if (c > best) { best = c; at = k; } });
    r = { value: reduce([2n * BigInt(n) * best, T * T]), at };
  } else {
    if (a.some((x) => x < 0n || x > D)) return { verdict: 'REFUSED', why: 'a height outside [0, 1]' };
    const T = a.reduce((s, x) => s + x, 0n); if (2n * T !== BigInt(n) * D) return { verdict: 'REFUSED', why: 'Σh − n/2 = ' + dec(reduce([2n * T - BigInt(n) * D, 2n * D]), 24) + ', not 0' };
    const c = a.map((x) => D - x).reverse(), corr = product(a, c); let best = -1n, at = 0; corr.forEach((x, k) => { if (x > best) { best = x; at = k; } });
    r = { value: reduce([2n * best, BigInt(n) * D * D]), at: at - (n - 1) };
  }
  const [cp_, cq] = exact(claim);
  return { verdict: r.value[0] * cq <= cp_ * r.value[1] ? 'CERTIFIED' : 'REFUTED', value: r.value[0] + '/' + r.value[1], decimal: dec(r.value, 30), at: r.at, n };
}

/* ---- the Python decider, instruments/optq/stepfun.py, on the same bytes ------------------------------------ */
const PY = `
import json, sys
sys.path.insert(0, sys.argv[1])
import stepfun
from fractions import Fraction as F
kind, src, claim, rescale, mutate = sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5] == '1', json.loads(sys.argv[6])
obj = json.load(open(src))
vals = stepfun.read_values(obj['data'] if 'data' in obj else obj)
if mutate:
    i = mutate['index']
    vals[i] = F(mutate['value']) if 'value' in mutate else vals[i] * mutate['scale']
if rescale:
    s, n = sum(vals), len(vals)
    vals = [v * F(n, 2) / s for v in vals]
r = stepfun.decide(kind, vals, claim)
print(json.dumps({k: r[k] for k in ('verdict', 'value', 'valueDecimal', 'why') if k in r}))
`;
function decidePy(s, claim, opt = {}) {
  const r = cp.spawnSync('python3', ['-I', '-c', PY, path.join(ROOT, 'instruments', 'optq'), s.kind, path.join(ROOT, s.rel), claim, opt.rescale ? '1' : '0', JSON.stringify(opt.mutate || null)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) die('stepfun.py failed on ' + s.id + ': ' + (r.stderr || '').slice(-400));
  return JSON.parse(r.stdout);
}

/* ---- the four rows, then the red controls ------------------------------------------------------------------ */
const heightsOf = (s) => { const o = J(s.rel); return (o.data || o).values; };
const H = Object.fromEntries(SOURCES.map((s) => [s.id, heightsOf(s)]));
const rows = SOURCES.map((s) => {
  const t = Date.now(), js = decideJs(s.kind, H[s.id], s.claim, { rescale: s.rescale });
  const row = { id: s.id, constant: s.kind === '1a' ? 'C_1a' : 'C_1b', ref: s.ref, producer: s.producer, source: s.rel, sha256: s.pin, n: H[s.id].length, claim: s.kind === '1a' ? 'C_1a <= ' + s.claim : 'C_1b <= ' + s.claim, asteriskedAtPin: s.asterisked, rescaled: !!s.rescale,
    reading: typeof H[s.id][0] === 'number' ? 'the JSON numbers as the IEEE-754 doubles they denote, as the platform parses them' : 'the fractions as written', js, jsSeconds: +((Date.now() - t) / 1000).toFixed(1) };
  if (!CHECK) {
    const t2 = Date.now(); row.py = decidePy(s, s.claim, { rescale: s.rescale }); row.pySeconds = +((Date.now() - t2) / 1000).toFixed(1);
    row.agree = row.py.verdict === js.verdict && row.py.value === js.value;
    row.verdict = row.agree ? js.verdict : 'REFUSED';
    if (js.verdict !== 'REFUSED') { const [p, q] = exact(s.claim), [vp, vq] = js.value.split('/').map(BigInt); row.slack = dec(reduce([p * vq - vp * q, q * vq]), 30); }
  }
  console.log('  ' + s.id.padEnd(17) + ' n=' + String(row.n).padStart(6) + '  ' + js.verdict.padEnd(9) + ' ' + (js.decimal || js.why) + (row.py ? '  py ' + row.py.verdict + (row.agree ? ' (the same fraction)' : ' — DISAGREES') : ''));
  return row;
});
const R = Object.fromEntries(rows.map((r) => [r.id, r]));
/* CodexProLong's heights were decided once before (certs/mc100-einstein-arena.json, 2026-10-02) with the JSON text read as
   exact decimals rather than as doubles — a different reading of the same bytes, so a different fraction; the record
   keeps that bound beside this one and says whether it too certifies the registry's bound */
if (!CHECK) {
  const m = J('certs/mc100-einstein-arena.json').rows.find((r) => r.id === 'ea-best-erdos-min-overlap'), b = m && m.decision.repair && m.decision.repair.bound;
  if (!b || !/^0\.\d{20}$/.test(b)) die('the earlier CodexProLong record has no 20-digit repair bound');
  const [p, q] = exact(SOURCES[3].claim), [bp, bq] = exact(b), hi = [bp + 1n, bq];   /* b is truncated at 20 digits: the value is < b + 10^-20 */
  R['1b-codexprolong'].otherReading = { record: 'certs/mc100-einstein-arena.json', how: 'the JSON text of the heights read as exact decimals', bound: b + '…', certifiesTheClaim: hi[0] * q <= p * hi[1] };
}
/* the red controls: each must come out wrong in both implementations — or the replay could not have gone red */
const atris1a = SOURCES[0], below = (() => { const [p, q] = R['1a-atris'].js.value.split('/').map(BigInt); const t = (p * 10n ** 15n) / q - 1n; return (t / 10n ** 15n) + '.' + (t % 10n ** 15n).toString().padStart(15, '0'); })();
const REDS = [
  { id: 'claim-below-the-value', on: atris1a, claim: below, opt: {}, expect: 'REFUTED', what: 'the Atris C_1a function against a bound 10^-15 below its exact value' },
  { id: 'a-raised-height', on: atris1a, claim: atris1a.claim, opt: { mutate: { index: Math.floor(R['1a-atris'].js.at / 2), scale: 2 } }, expect: 'REFUTED', what: 'the Atris C_1a function with the height at half the maximising lag doubled' },
  { id: 'a-negative-height', on: atris1a, claim: atris1a.claim, opt: { mutate: { index: 0, value: '-1/10000000000000' } }, expect: 'REFUSED', what: 'the Atris C_1a function with its first height made negative' },
  { id: 'a-height-above-one', on: SOURCES[2], claim: SOURCES[2].claim, opt: { mutate: { index: 0, value: '10000000000001/10000000000000' } }, expect: 'REFUSED', what: 'the Atris C_1b function with its first height above 1' },
  { id: 'codexprolong-as-published', on: SOURCES[3], claim: SOURCES[3].claim, opt: {}, expect: 'REFUSED', what: 'CodexProLong\'s C_1b heights as published, not rescaled (Σh ≠ n/2)' }
];
const reds = REDS.map((x) => {
  const js = decideJs(x.on.kind, H[x.on.id], x.claim, x.opt), r = { id: x.id, what: x.what, claim: x.claim, expect: x.expect, js: js.verdict, jsWhy: js.why || js.decimal };
  if (!CHECK) { const py = decidePy(x.on, x.claim, x.opt); r.py = py.verdict; r.pyWhy = py.why || py.valueDecimal; }
  r.fired = r.js === x.expect && (CHECK || r.py === x.expect);
  console.log('  RED ' + x.id.padEnd(26) + ' expect ' + x.expect.padEnd(8) + ' js ' + r.js + (r.py ? '  py ' + r.py : '') + (r.fired ? '  fired' : '  DID NOT FIRE'));
  return r;
});

/* ---- the record ------------------------------------------------------------------------------------------- */
if (CHECK) {
  const was = J('certs/stepfun-replay.json');
  for (const r of rows) { const w = was.rows.find((x) => x.id === r.id); if (!w || w.js.value !== r.js.value || w.js.verdict !== r.js.verdict || w.claim !== r.claim || w.sha256 !== r.sha256) die(r.id + ' does not re-derive as recorded'); }
  if (!reds.every((r) => r.fired)) die('a red control did not fire');
  if (was.deciders.js !== sha(rd('tools/replay-stepfun.js'))) console.log('  note: this file changed since the record was written — re-run without --check before citing it');
  console.log('stepfun replay: ' + rows.length + ' rows re-derived identical, ' + reds.length + '/' + reds.length + ' red controls fired (the JavaScript decider; the record holds both)');
} else {
  if (!rows.every((r) => r.agree)) die('the two implementations disagree on ' + rows.filter((r) => !r.agree).map((r) => r.id).join(', '));
  if (!reds.every((r) => r.fired)) die('a red control did not fire in both implementations');
  const counts = rows.reduce((c, r) => ((c[r.verdict] = (c[r.verdict] || 0) + 1), c), {});
  const rec = {
    what: 'The four step functions behind the optimization-constants registry\'s C_1a and C_1b rows of 2026-10-18, each decided exactly by two implementations that share no code (instruments/optq/stepfun.py; the JavaScript decider in tools/replay-stepfun.js), against the bounds the registry prints, read from its pinned pages. Written by tools/replay-stepfun.js.',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: +((Date.now() - T0) / 1000).toFixed(1), node: process.version,
    python: cp.execFileSync('python3', ['-I', '-c', 'import sys; print(sys.version.split()[0])'], { encoding: 'utf8' }).trim(),
    deciders: { js: sha(rd('tools/replay-stepfun.js')), py: sha(rd('instruments/optq/stepfun.py')) },
    registry: { snapshot: SNAP + '/', commit: J(SNAP + '/PINS.json').commit, asteriskCommit: J(SNAP + '/api/commit-3010f7ed.json').sha },
    counts, rows, redControls: reds
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/stepfun-replay.json — ' + Object.entries(counts).map(([k, v]) => v + ' ' + k).join(', ') + '; both implementations agree on every fraction; ' + reds.length + '/' + reds.length + ' red controls fired in both (' + rec.seconds + ' s)');
}
