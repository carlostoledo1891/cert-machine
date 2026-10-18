#!/usr/bin/env node
/* replay-autocorr.js — the registry's C_1c and C_1d step functions, each decided twice.

   On 2026-10-18 the optimization-constants registry carried two new family-1 constants with asterisked bounds:
   C_1c >= 0.4103287* (Barnard–Steinerberger; rozetyp's integer step function, #207) and C_1d <= 1.463071582607559*
   (the signed third autocorrelation; a 300-cell signed step function given in the body of #224). This decides both from
   the pinned bytes (corpus/optconst-queue/next-2026-10-18/) against the bounds the registry prints, read from its pinned
   pages, by two implementations that share no code with each other or with the claimants' verifiers (kept as text,
   never run): instruments/optq/autocorr.py (Python, Fraction and int, every lag summed term by term) and
   instruments/optq/stepfun-exact.js (JavaScript BigInt, Kronecker products).

   Two findings are recorded beside the verdicts, read from the same pages:
     C_1c  the page prints the certificate's fraction as "0.41030287175…"; the fraction is 0.41032871754… (the Bound
           column, 0.4103287, is right);
     C_1d  the printed bound 1.463071582607559 is BELOW the certificate's exact value 1.46307158260755932…, so the
           certificate does not show it: as printed the claim is REFUTED (the function's ratio exceeds it — a statement
           about the certificate, not about the constant), and the bound rounded up at the next digit is CERTIFIED.

   usage: node tools/replay-autocorr.js            both implementations, the red controls → certs/autocorr-replay.json
          node tools/replay-autocorr.js --check    the battery: the JavaScript decider re-derives every row and red
                                                   control and compares with the record; nothing written
   MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SE = require(path.join(ROOT, 'instruments', 'optq', 'stepfun-exact.js'));
const OUT = path.join(ROOT, 'certs', 'autocorr-replay.json');
const CHECK = process.argv.includes('--check');
const T0 = Date.now();
const die = (m) => { console.error('AUTOCORR REPLAY REFUSED: ' + m); process.exit(1); };
const rd = (rel) => fs.readFileSync(path.join(ROOT, rel));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const J = (rel) => JSON.parse(rd(rel).toString('utf8'));
const DIR = 'corpus/optconst-queue/next-2026-10-18';

/* ---- the inputs and the registry's words, each against its pin ------------------------------------------- */
const PINS = J(DIR + '/PINS.json').files;
const pinned = (rel) => { const buf = rd(DIR + '/' + rel); if (!PINS[rel] || sha(buf) !== PINS[rel].sha256) die(rel + ' does not match its pin'); return buf; };
const page = { '1c': pinned('upstream/constants/1c.md').toString('utf8'), '1d': pinned('upstream/constants/1d.md').toString('utf8') };
const rowOf = (k, ref) => page[k].split('\n').find((x) => x.startsWith('| $') && x.includes('| [' + ref + '] |')) || die('no [' + ref + '] row on the ' + k + ' page');
const bound = (row) => { const m = /^\| \$([0-9.]+)(\*?)\$(\*?) \|/.exec(row); if (!m) die('no bound in the row ' + row.slice(0, 60)); return { claim: m[1], asterisked: !!(m[2] || m[3]) }; };
const r1c = rowOf('1c', 'R2026'), r1d = rowOf('1d', 'CERT2026');
const stated1c = /\*\*Exact value:\*\* \$(\d+)\/(\d+) = ([0-9.]+)\\dots\$/.exec(r1c) || die('the 1c row no longer states its fraction and decimal');
const k3072 = /K = 3072\$ giving \$([0-9.]+)\$/.exec(r1c) || die('the 1c row no longer states the K = 3072 bound');
const stated1d = /rational number \$(\d+) \/ (\d+)\$, which is \$([0-9.]+)\\dots\$/.exec(r1d) || die('the 1d row no longer states its fraction');
const SOURCES = [
  { id: '1c-rozetyp', kind: '1c', ref: 'R2026', producer: 'rozetyp (barnard-steinerberger-lower-bound @ 19f39715), K = 6144', rel: 'rozetyp/certificate.json', ...bound(r1c), stated: { fraction: stated1c[1] + '/' + stated1c[2], decimal: stated1c[3] } },
  { id: '1c-rozetyp-k3072', kind: '1c', ref: 'R2026', producer: 'rozetyp, the earlier certificate (previous/certificate_K3072.json), K = 3072', rel: 'rozetyp/previous/certificate_K3072.json', claim: k3072[1], asterisked: false },
  { id: '1d-cert2026', kind: '1d', ref: 'CERT2026', producer: 'the 300-cell certificate in the body of pull request 224 (CRLF bytes, sha256 44f3f2b6…)', rel: 'pr-224/construction.json', ...bound(r1d), stated: { fraction: stated1d[1] + '/' + stated1d[2], decimal: stated1d[3] } }
];
const OBJ = Object.fromEntries(SOURCES.map((s) => [s.id, JSON.parse(pinned(s.rel).toString('utf8'))]));
const heights = (s) => (s.kind === '1c' ? OBJ[s.id].weights_int : OBJ[s.id].values);
const optsOf = (s, extra = {}) => Object.assign(s.kind === '1c' ? { K: OBJ[s.id].K } : {}, extra);

/* ---- the Python decider on the same bytes -------------------------------------------------------------------- */
function decidePy(s, claim, mutate) {
  const r = cp.spawnSync('python3', ['-I', path.join(ROOT, 'instruments', 'optq', 'autocorr.py'), s.kind, path.join(ROOT, DIR, s.rel), claim, JSON.stringify(mutate || null)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) die('autocorr.py failed on ' + s.id + ': ' + (r.stderr || '').slice(-400));
  return JSON.parse(r.stdout);
}
const frac = (v) => v.split('/').map(BigInt);
const cmpFrac = ([a, b], [c, d]) => (a * d > c * b ? 1 : a * d < c * b ? -1 : 0);
/* a decimal string at k places, rounded toward +∞ or toward −∞ */
const roundTo = ([p, q], k, up) => { const s = 10n ** BigInt(k), t = (p * s) / q, r = (p * s) % q; const u = up && r !== 0n ? t + 1n : t; return (u / s) + '.' + (u % s).toString().padStart(k, '0'); };

/* ---- the rows ------------------------------------------------------------------------------------------------ */
const rows = SOURCES.map((s) => {
  const t = Date.now(), js = SE.decide(s.kind, heights(s), s.claim, optsOf(s));
  const row = { id: s.id, constant: s.kind === '1c' ? 'C_1c' : 'C_1d', ref: s.ref, producer: s.producer, source: DIR + '/' + s.rel, sha256: PINS[s.rel].sha256, n: heights(s).length,
    claim: (s.kind === '1c' ? 'C_1c >= ' : 'C_1d <= ') + s.claim, asteriskedAtPin: s.asterisked, js, jsSeconds: +((Date.now() - t) / 1000).toFixed(1) };
  if (s.stated) row.stated = Object.assign({}, s.stated, { fractionMatches: (() => { const [a, b] = frac(js.value), [c, d] = frac(s.stated.fraction); return a * d === b * c; })(), decimalMatches: js.decimal.startsWith(s.stated.decimal) });
  if (!CHECK) {
    const t2 = Date.now(); row.py = decidePy(s, s.claim); row.pySeconds = +((Date.now() - t2) / 1000).toFixed(1);
    row.agree = row.py.verdict === js.verdict && row.py.value === js.value;
    row.verdict = row.agree ? js.verdict : 'REFUSED';
  }
  /* a printed upper bound below the exact value: the bound the certificate does show, rounded up at one more digit */
  if (js.verdict === 'REFUTED' && s.kind === '1d') {
    const digits = s.claim.split('.')[1].length + 1, repaired = roundTo(frac(js.value), digits, true);
    const jr = SE.decide(s.kind, heights(s), repaired, optsOf(s));
    row.repair = { claim: 'C_1d <= ' + repaired, how: 'the exact value rounded up at ' + digits + ' decimals', js: jr.verdict };
    if (!CHECK) row.repair.py = decidePy(s, repaired).verdict;
    row.gap = 'the printed bound ' + s.claim + ' is below the certificate\'s exact value ' + js.decimal.slice(0, 22) + '…: the certificate shows C_1d <= ' + repaired + ', not the printed bound';
  }
  if (row.stated && !row.stated.decimalMatches) row.gap = 'the page prints the fraction ' + s.stated.fraction + ' as ' + s.stated.decimal + '…; it is ' + js.decimal.slice(0, 14) + '…';
  console.log('  ' + s.id.padEnd(17) + ' n=' + String(row.n).padStart(5) + '  ' + js.verdict.padEnd(9) + ' ' + js.decimal + (row.py ? '  py ' + row.py.verdict + (row.agree ? ' (the same fraction)' : ' — DISAGREES') : '') + (row.repair ? '  repaired ' + row.repair.claim + ' ' + row.repair.js + (row.repair.py ? '/' + row.repair.py : '') : ''));
  if (row.gap) console.log('      gap: ' + row.gap);
  return row;
});
const R = Object.fromEntries(rows.map((r) => [r.id, r]));

/* ---- the red controls: each must come out wrong in both implementations ---------------------------------------- */
const S1c = SOURCES[0], S1d = SOURCES[2];
const aboveMore = (() => { const [p, q] = frac(R['1c-rozetyp'].js.value); const s = 10n ** 15n, t = (p * s) / q + 2n; return (t / s) + '.' + (t % s).toString().padStart(15, '0'); })();
const below1d = roundTo(frac(R['1d-cert2026'].js.value), 15, false);
/* Σv set to zero exactly: v_0 replaced by v_0 − Σv, as a fraction both implementations read */
const zeroSum = (() => { const fr = heights(S1d).map(SE.exact), { D, a } = SE.common(fr), T = a.reduce((s, x) => s + x, 0n), v0 = a[0] - T, [p, q] = SE.reduce([v0, D]); return p + '/' + q; })();
const REDS = [
  { id: 'a-bound-above-the-value', on: S1c, claim: aboveMore, expect: 'REFUTED', what: 'the C_1c function against a lower bound 2·10^-15 above its exact value' },
  { id: 'a-negative-weight', on: S1c, claim: S1c.claim, mutate: { index: 0, value: '-1' }, expect: 'REFUSED', what: 'the C_1c function with its first weight made negative' },
  { id: 'a-bound-below-the-value', on: S1d, claim: below1d, expect: 'REFUTED', what: 'the C_1d function against an upper bound 10^-15 below its exact value' },
  { id: 'a-zero-integral', on: S1d, claim: S1d.claim, mutate: { index: 0, value: zeroSum }, expect: 'REFUSED', what: 'the C_1d function with its first value changed so that Σv = 0 exactly' }
];
const reds = REDS.map((x) => {
  const js = SE.decide(x.on.kind, heights(x.on), x.claim, optsOf(x.on, x.mutate ? { mutate: x.mutate } : {}));
  const r = { id: x.id, what: x.what, claim: x.claim, expect: x.expect, js: js.verdict, jsWhy: js.why || js.decimal };
  if (!CHECK) { const py = decidePy(x.on, x.claim, x.mutate); r.py = py.verdict; r.pyWhy = py.why || py.valueDecimal; }
  r.fired = r.js === x.expect && (CHECK || r.py === x.expect);
  console.log('  RED ' + x.id.padEnd(24) + ' expect ' + x.expect.padEnd(8) + ' js ' + r.js + (r.py ? '  py ' + r.py : '') + (r.fired ? '  fired' : '  DID NOT FIRE'));
  return r;
});

/* ---- the record ----------------------------------------------------------------------------------------------- */
const deciders = { js: sha(rd('tools/replay-autocorr.js')), jsModule: sha(rd('instruments/optq/stepfun-exact.js')), py: sha(rd('instruments/optq/autocorr.py')) };
if (CHECK) {
  const was = J('certs/autocorr-replay.json');
  for (const r of rows) { const w = was.rows.find((x) => x.id === r.id); if (!w || w.js.value !== r.js.value || w.js.verdict !== r.js.verdict || w.claim !== r.claim || w.sha256 !== r.sha256 || (w.repair || {}).js !== (r.repair || {}).js) die(r.id + ' does not re-derive as recorded'); }
  if (!reds.every((r) => r.fired)) die('a red control did not fire');
  if (Object.keys(deciders).some((k) => was.deciders[k] !== deciders[k])) console.log('  note: a decider changed since the record was written — re-run without --check before citing it');
  console.log('autocorr replay: ' + rows.length + ' rows re-derived identical, ' + reds.length + '/' + reds.length + ' red controls fired (the JavaScript decider; the record holds both)');
} else {
  if (!rows.every((r) => r.agree)) die('the two implementations disagree on ' + rows.filter((r) => !r.agree).map((r) => r.id).join(', '));
  if (rows.some((r) => r.repair && !(r.repair.js === 'CERTIFIED' && r.repair.py === 'CERTIFIED'))) die('a repaired bound is not CERTIFIED in both');
  if (!reds.every((r) => r.fired)) die('a red control did not fire in both implementations');
  const rec = {
    what: 'The registry\'s C_1c (rozetyp, #207) and C_1d (#224) step functions, decided exactly by two implementations that share no code (instruments/optq/autocorr.py; instruments/optq/stepfun-exact.js) against the bounds the registry prints, read from its pinned pages; the C_1d printed bound below its own certificate\'s value recorded with the bound the certificate does show. Written by tools/replay-autocorr.js.',
    generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'), seconds: +((Date.now() - T0) / 1000).toFixed(1), node: process.version,
    python: cp.execFileSync('python3', ['-I', '-c', 'import sys; print(sys.version.split()[0])'], { encoding: 'utf8' }).trim(),
    deciders, pins: DIR + '/PINS.json', registryCommit: J(DIR + '/PINS.json').registryCommit,
    counts: rows.reduce((c, r) => ((c[r.verdict] = (c[r.verdict] || 0) + 1), c), {}), rows, redControls: reds
  };
  fs.writeFileSync(OUT, JSON.stringify(rec, null, 1) + '\n');
  console.log('wrote certs/autocorr-replay.json — ' + Object.entries(rec.counts).map(([k, v]) => v + ' ' + k).join(', ') + '; both implementations agree on every fraction; ' + reds.length + '/' + reds.length + ' red controls fired in both (' + rec.seconds + ' s)');
}
